//block
//noreplace

/**
 * @author Michael Delgado
 * @email support@axxis-systems.com
 * @created 2026/08/09
 * @name cmdPremiumsPayment
 * @version 1.3
 * @purpose: Apply one payment to multiple policies and send any excess to transit.
 * @context: {
 *   workspaceId: number,
 *   currency?: string,
 *   amount?: number,
 *   payments: [{ policyId: number, amount: number }],
 *   supplementaryPayments?: [{ policyId: number, amount: number }],
 *   sourceTransitAccountId?: number,
 *   transitIncomeType?: string,
 *   transferEntity?: object,
 *   credits?: [{ policyId: number, amount: number }]
 * }
 * @notes:
 *   - The payment is distributed by policy without validating a payer or fiscal receipt.
 *   - Each policy amount is applied to its pending installments in due-date order.
 *   - Supplementary payments settle eligible installments before any remainder goes to transit.
 *   - When sourceTransitAccountId is provided, a second negative transfer is created and executed
 *     against the transit account after the premium allocation succeeds.
 *   - The transfer entity can be provided by the payment form to preserve split-payment details.
 *   - v1.1 (MSN-000174): the transit balance counts every movement except PREMIUMPAY, the same rule as the
 *     transit account list (cmdGetTransitMovs) and its line detail (cmdTransitLines).
 *   - v1.2 (MSN-000175): credits apply the pending negative installments (credit balance) of policies of the same
 *     payer. They pay the selected installments before the cash: those lines carry compensationType SALDOFAVOR
 *     (moneyInAmount = cash part, compensationAmount = credit part) and every negative installment taken gets a
 *     line with compensationAmount = -taken. No money moves for the credit part; the money-in transfer covers only
 *     the cash (amount = payments + supplementary - credits) and is not created when the cash is 0.
 *     A policy's own credit goes to its own installments first. Credits never go to transit.
 */

try {
  const commandContext = context || {};
  const input = getContextInput(commandContext);
  validateInput(input);

  const workspaceId = getPositiveInteger(input.workspaceId);
  const payments = getPaymentRows(input);
  const supplementaryPayments = getSupplementaryPaymentRows(input);
  const requestedAmount = getSignedMoney(input.amount);
  const sourceTransitAccountId = getPositiveInteger(input.sourceTransitAccountId);
  const credits = getCreditRows(input);
  const creditTotal = roundMoney(credits.reduce((total, item) => total + item.amount, 0));
  const calculatedAmount = roundMoney(
    payments.reduce((total, item) => total + item.amount, 0)
    + supplementaryPayments.reduce((total, item) => total + item.amount, 0)
    - creditTotal
  );
  const totalAmount = requestedAmount > 0 ? requestedAmount : calculatedAmount;

  if (Math.abs(totalAmount - calculatedAmount) > 0.01) {
    throw new Error(creditTotal > 0
      ? 'El monto total no coincide con la suma de los montos asignados a las pólizas menos el saldo a favor aplicado.'
      : 'El monto total no coincide con la suma de los montos asignados a las pólizas.');
  }

  if (creditTotal > 0 && sourceTransitAccountId > 0) {
    throw new Error('El saldo a favor no se puede aplicar en un cobro desde una cuenta en tránsito.');
  }

  if (totalAmount < 0 && creditTotal <= 0) {
    throw new Error('Un monto negativo debe aplicarse a cuotas negativas disponibles.');
  }

  if (sourceTransitAccountId > 0) {
    const availableBalance = loadTransitAccountBalance(sourceTransitAccountId);
    if (totalAmount > availableBalance + 0.01) {
      throw new Error(`La cuenta en tránsito no tiene saldo suficiente. Disponible: ${roundMoney(availableBalance)}, solicitado: ${roundMoney(totalAmount)}.`);
    }
  }

  // AXX-823: settle eligible debt across selected policies before transit.
  // AXX-823: both cashier inputs describe money to apply to eligible debt.
  // Merge repeated policies before allocation so an installment is never paid twice.
  const combinedPayments = [];
  payments.concat(supplementaryPayments).forEach(payment => {
    const existing = combinedPayments.find(item => item.policyId === payment.policyId);
    if (existing) existing.amount = roundMoney(existing.amount + payment.amount);
    else combinedPayments.push({ policyId: payment.policyId, amount: payment.amount });
  });
  const creditPolicyIds = credits
    .map(item => item.policyId)
    .filter(policyId => !combinedPayments.some(payment => payment.policyId === policyId));
  creditPolicyIds.forEach(policyId => combinedPayments.push({ policyId: policyId, amount: 0 }));
  const details = combinedPayments.map(payment => {
    const policy = loadPolicy(payment.policyId);
    return { policy, amount: payment.amount, payPlan: loadPayPlan(policy.id) };
  });
  details.forEach(item => {
    item.allocation = distributePayment(item.payPlan, item.amount);
  });
  // Keep the requested amounts where possible; move only their unused excess.
  for (const source of details) {
    for (const target of details) {
      if (source.allocation.transitAmount <= 0) break;
      if (source === target) continue;
      const available = roundMoney(target.payPlan.reduce((sum, row) =>
        sum + Math.max(0, getMoney(row.minimum) - getMoney(row.payed)), 0)
        - target.allocation.appliedAmount);
      const moved = roundMoney(Math.min(source.allocation.transitAmount, available));
      if (moved <= 0) continue;
      source.amount = roundMoney(source.amount - moved);
      source.allocation = distributePayment(source.payPlan, source.amount);
      target.amount = roundMoney(target.amount + moved);
      target.allocation = distributePayment(target.payPlan, target.amount);
    }
  }
  details.forEach(item => {
    if (item.allocation.transitAmount > 0) ensureTransitAccount(item.policy);
  });

  const creditDetails = loadCredits(credits, details);
  const totals = calculateTotals(details);
  validateTotals(totalAmount, totals, creditTotal);
  assignCredit(details, creditTotal, creditDetails);

  const transferAmount = totalAmount;
  const transfer = transferAmount !== 0
    ? createTransfer(input, workspaceId, transferAmount)
    : null;
  const entity = buildPaymentAllocationEntity(input, workspaceId, transferAmount, transfer, details, totals, creditDetails, creditTotal);

  doCmd({
    cmd: 'DoPaymentAllocation',
    data: { entity: entity }
  });

  if (!DoPaymentAllocation || DoPaymentAllocation.ok === false) {
    throw new Error(DoPaymentAllocation && DoPaymentAllocation.msg
      ? DoPaymentAllocation.msg
      : 'No fue posible aplicar el pago.');
  }

  const allocationId = getAllocationId(DoPaymentAllocation && DoPaymentAllocation.outData)
    || loadAllocationIdByTransferId(transfer && transfer.id)
    || loadAllocationIdByCreditDetails(creditDetails);
  const transitTransfer = sourceTransitAccountId > 0
    ? createTransitDebitTransfer(input, workspaceId, totalAmount, sourceTransitAccountId, details, allocationId)
    : null;

  return {
    ok: true,
    msg: 'Pago de primas aplicado correctamente',
    data: {
      amount: totalAmount,
      appliedAmount: totals.appliedAmount,
      transitAmount: totals.transitAmount,
      difference: totals.difference,
      creditAmount: creditTotal,
      allocationId: allocationId || null,
      creditTransfers: [],
      transitTransfer: transitTransfer,
      policies: details.map(item => ({
        policyId: item.policy.id,
        amount: item.amount,
        appliedAmount: item.allocation.appliedAmount,
        transitAmount: item.allocation.transitAmount,
        installments: item.allocation.installments.map(row => ({
          payPlanId: row.id,
          amount: row.dueAmount,
          creditAmount: row.compensationAmount || 0
        }))
      })),
      credits: creditDetails.map(item => ({
        policyId: item.policy.id,
        amount: item.amount,
        installments: item.installments.map(row => ({
          payPlanId: row.id,
          amount: -row.taken
        }))
      }))
    }
  };
} catch (error) {
  throw new TypeError(`@${getErrorMessage(error)}`);
}

function getContextInput(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
}

function validateInput(input) {
  if (getPositiveInteger(input.workspaceId) <= 0) {
    throw new Error('El identificador de la caja es obligatorio y debe ser válido.');
  }

  const payments = getPaymentRows(input);
  const supplementaryPayments = getSupplementaryPaymentRows(input);
  const requestedAmount = getSignedMoney(input.amount);
  const creditRows = getCreditRows(input);
  if (payments.length === 0 && supplementaryPayments.length === 0
    && !(requestedAmount < -0.01 && creditRows.length > 0)) {
    throw new Error('Debe indicar al menos una póliza para realizar el cobro.');
  }

  const policyIds = new Set();
  payments.forEach(item => {
    if (getPositiveInteger(item.policyId) <= 0) {
      throw new Error('El identificador de la póliza es obligatorio y debe ser válido.');
    }

    if (item.amount <= 0) {
      throw new Error(`El monto de la póliza ${item.policyId} debe ser mayor que cero.`);
    }

    if (policyIds.has(item.policyId)) {
      throw new Error(`La póliza ${item.policyId} fue enviada más de una vez.`);
    }

    policyIds.add(item.policyId);
  });

  const supplementaryIds = new Set();
  supplementaryPayments.forEach(item => {
    if (getPositiveInteger(item.policyId) <= 0 || item.amount <= 0) {
      throw new Error('La prima complementaria debe tener una póliza válida y un monto mayor que cero.');
    }

    if (supplementaryIds.has(item.policyId)) {
      throw new Error(`La póliza ${item.policyId} fue enviada mÃ¡s de una vez en primas complementarias.`);
    }

    supplementaryIds.add(item.policyId);
  });

  const creditIds = new Set();
  getCreditRows(input).forEach(item => {
    if (getPositiveInteger(item.policyId) <= 0 || item.amount <= 0) {
      throw new Error('El saldo a favor debe tener una póliza válida y un monto mayor que cero.');
    }

    if (creditIds.has(item.policyId)) {
      throw new Error(`La póliza ${item.policyId} fue enviada más de una vez en saldos a favor.`);
    }

    creditIds.add(item.policyId);
  });
}

function getPaymentRows(input) {
  const source = Array.isArray(input.payments)
    ? input.payments
    : Array.isArray(input.policies)
      ? input.policies
      : Array.isArray(input.rows)
        ? input.rows
        : [];

  return source.map(item => ({
    policyId: getPositiveInteger(item && (item.policyId || item.lifePolicyId)),
    amount: roundMoney(getMoney(item && item.amount))
  }));
}

function getSupplementaryPaymentRows(input) {
  const source = Array.isArray(input && input.supplementaryPayments)
    ? input.supplementaryPayments
    : Array.isArray(input && input.complementaryPayments)
      ? input.complementaryPayments
      : [];

  return source.map(item => ({
    policyId: getPositiveInteger(item && (item.policyId || item.lifePolicyId)),
    amount: roundMoney(getMoney(item && item.amount))
  }));
}

function getCreditRows(input) {
  const source = Array.isArray(input && input.credits) ? input.credits : [];

  return source.map(item => ({
    policyId: getPositiveInteger(item && (item.policyId || item.lifePolicyId)),
    amount: roundMoney(getMoney(item && item.amount))
  }));
}

// MSN-000175: the pending negative installments each credit takes, oldest first.
function loadCredits(credits, details) {
  const holderIds = details.map(item => getPositiveInteger(item.policy && item.policy.holderId));

  return credits.map(credit => {
    const known = details.find(item => item.policy.id === credit.policyId);
    const policy = known ? known.policy : loadPolicy(credit.policyId);
    const policyLabel = getTrimmedString(policy.code) || String(policy.id);
    if (holderIds.indexOf(getPositiveInteger(policy.holderId)) < 0) {
      throw new Error(`La póliza ${policyLabel} no es del mismo pagador que las pólizas que se cobran.`);
    }

    const payPlan = known ? known.payPlan : loadPayPlan(policy.id);
    const negativeRows = payPlan
      .filter(row => getSignedMoney(row && row.minimum) - getSignedMoney(row && row.payed) < -0.005)
      .sort((a, b) => (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) || (a.id - b.id));
    const available = roundMoney(negativeRows.reduce((total, row) =>
      total + getSignedMoney(row.payed) - getSignedMoney(row.minimum), 0));
    if (credit.amount > available + 0.01) {
      throw new Error(`La póliza ${policyLabel} tiene ${available.toFixed(2)} de saldo a favor; se intentó aplicar ${credit.amount.toFixed(2)}.`);
    }

    let remaining = credit.amount;
    const installments = [];
    for (const row of negativeRows) {
      if (remaining <= 0) break;
      const open = roundMoney(getSignedMoney(row.payed) - getSignedMoney(row.minimum));
      const taken = roundMoney(Math.min(open, remaining));
      if (taken <= 0) continue;
      installments.push({ ...row, taken: taken });
      remaining = roundMoney(remaining - taken);
    }

    return { policy: policy, amount: credit.amount, installments: installments };
  });
}

// MSN-000175: the credit pays the installments before the cash, a policy's own installments first.
function assignCredit(details, creditTotal, creditDetails) {
  const ownPolicyIds = creditDetails.map(item => item.policy.id);
  const ordered = details.filter(item => ownPolicyIds.indexOf(item.policy.id) >= 0)
    .concat(details.filter(item => ownPolicyIds.indexOf(item.policy.id) < 0));
  let remaining = roundMoney(creditTotal);

  ordered.forEach(item => {
    item.allocation.installments.forEach(installment => {
      const credit = roundMoney(Math.min(installment.dueAmount, Math.max(remaining, 0)));
      installment.compensationAmount = credit;
      installment.moneyInAmount = roundMoney(installment.dueAmount - credit);
      remaining = roundMoney(remaining - credit);
    });
  });
}

function loadPolicy(policyId) {
  doCmd({
    cmd: 'RepoLifePolicy',
    data: {
      operation: 'GET',
      filter: `[id]=${policyId}`,
      include: ['Accounts', 'Holder', 'ComContract'],
      noTracking: true
    }
  });

  const rows = getRows(RepoLifePolicy && RepoLifePolicy.outData);
  const policy = rows[0];
  if (!policy) {
    throw new Error(`No se encontró la póliza con id ${policyId}.`);
  }

  return policy;
}

function loadPayPlan(policyId) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'PayPlan',
      fields: '*',
      filter: `lifePolicyId = ${policyId} AND cancellationDate IS NULL`,
      noTracking: true
    }
  });

  const rows = getRows(LoadEntities && LoadEntities.outData);
  return rows;
}

function loadTransitAccountBalance(accountId) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'AccountMov',
      fields: 'amount,transactionCode',
      filter: `accountId = ${accountId}`,
      noTracking: true
    }
  });

  const rows = getRows(LoadEntities && LoadEntities.outData);
  return roundMoney(rows.reduce((total, item) => {
    const transactionCode = getTrimmedString(item && item.transactionCode).toUpperCase();
    if (transactionCode === 'PREMIUMPAY') return total;

    const amount = Number(item && item.amount);
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0));
}

function getTransitIncomeType(input) {
  const requestedCode = getTrimmedString(input && input.transitIncomeType);
  if (requestedCode) return requestedCode;

  doCmd({
    cmd: 'RepoIncomeTypeCatalog',
    data: {
      operation: 'GET',
      filter: "internalType = 'DEPOPAYMENT'",
      entity: null,
      bulkJson: null,
      include: null,
      size: 0,
      page: 0,
      showColumnsIfEmpty: false
    }
  });

  const options = getRows(RepoIncomeTypeCatalog && RepoIncomeTypeCatalog.outData);
  const option = options.find(item =>
    getTrimmedString(item && item.internalType).toUpperCase() === 'DEPOPAYMENT'
  );
  const code = getTrimmedString(option && (option.code || option.value));
  if (!code) {
    throw new Error('El tipo de ingreso DEPOPAYMENT no está configurado.');
  }

  return code;
}

function getPremiumIncomeType(input, sourceEntity) {
  const requestedCode = getTrimmedString(input && input.incomeType)
    || getTrimmedString(sourceEntity && sourceEntity.incomeType);
  if (requestedCode) return requestedCode;

  doCmd({
    cmd: 'RepoIncomeTypeCatalog',
    data: {
      operation: 'GET',
      filter: "internalType = 'PREMIUM'",
      entity: null,
      bulkJson: null,
      include: null,
      size: 0,
      page: 0,
      showColumnsIfEmpty: false
    }
  });

  const options = getRows(RepoIncomeTypeCatalog && RepoIncomeTypeCatalog.outData);
  const option = options.find(item =>
    getTrimmedString(item && item.internalType).toUpperCase() === 'PREMIUM'
  );
  const code = getTrimmedString(option && (option.code || option.value));
  if (!code) {
    throw new Error('El tipo de ingreso PREMIUM no está configurado.');
  }

  return code;
}

function getOtherPaymentMethodName() {
  doCmd({
    cmd: 'RepoPaymentMethodCatalog',
    data: {
      operation: 'GET',
      filter: "code = 'OT'",
      entity: null,
      bulkJson: null,
      include: null,
      size: 0,
      page: 0,
      showColumnsIfEmpty: false
    }
  });

  const options = getRows(RepoPaymentMethodCatalog && RepoPaymentMethodCatalog.outData);
  const option = options.find(item => getTrimmedString(item && item.code).toUpperCase() === 'OT');
  return getTrimmedString(option && option.name) || 'OT';
}

function distributePayment(payPlan, amount) {
  const availableAmount = roundMoney(amount);
  let remainingAmount = availableAmount;
  const installments = [];

  const pendingRows = payPlan
    .filter(item => getMoney(item && item.minimum) - getMoney(item && item.payed) > 0)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  for (const item of pendingRows) {
    if (remainingAmount <= 0) break;

    const minimum = roundMoney(getMoney(item.minimum));
    const payed = roundMoney(getMoney(item.payed));
    const pending = roundMoney(minimum - payed);
    const dueAmount = roundMoney(Math.min(remainingAmount, pending));

    if (dueAmount <= 0) continue;

    installments.push({
      ...item,
      dueAmount: dueAmount,
      previousPayed: payed,
      newPayed: roundMoney(payed + dueAmount),
      remaining: roundMoney(pending - dueAmount),
      isPartial: dueAmount < pending
    });

    remainingAmount = roundMoney(remainingAmount - dueAmount);
  }

  return {
    installments: installments,
    appliedAmount: roundMoney(availableAmount - remainingAmount),
    transitAmount: remainingAmount
  };
}

function ensureTransitAccount(policy) {
  const accounts = Array.isArray(policy.Accounts) ? policy.Accounts : [];
  const existing = accounts.find(item =>
    item && String(item.type || '').toUpperCase() === 'TRANSIT'
  );

  if (existing) return existing;

  doCmd({
    cmd: 'RepoAccount',
    data: {
      operation: 'ADD',
      entity: {
        currency: policy.currency || 'USD',
        holderId: policy.holderId,
        type: 'TRANSIT',
        accNo: `TRA${policy.id}`,
        name: 'Cuenta Depósito',
        lifePolicyId: policy.id
      }
    }
  });

  if (!RepoAccount || RepoAccount.ok === false) {
    throw new Error(RepoAccount && RepoAccount.msg
      ? RepoAccount.msg
      : `No se pudo crear la cuenta en tránsito de la póliza ${policy.code || policy.id}.`);
  }

  return RepoAccount.outData;
}

function calculateTotals(details) {
  const appliedAmount = roundMoney(details.reduce((total, item) =>
    total + item.allocation.appliedAmount, 0));
  const transitAmount = roundMoney(details.reduce((total, item) =>
    total + item.allocation.transitAmount, 0));

  return {
    appliedAmount: appliedAmount,
    transitAmount: transitAmount,
    difference: roundMoney(appliedAmount + transitAmount - details.reduce((total, item) => total + item.amount, 0))
  };
}

function validateTotals(totalAmount, totals, creditTotal) {
  if (Math.abs(totals.difference) > 0.01) {
    throw new Error('La distribución del pago no coincide con el monto enviado a tránsito.');
  }

  const credit = roundMoney(creditTotal || 0);
  if (totalAmount < -0.01) {
    if (credit <= 0 || Math.abs(roundMoney(Math.abs(totalAmount) - credit)) > 0.01) {
      throw new Error('El monto negativo no coincide con el saldo a favor aplicado.');
    }
    if (totals.appliedAmount > 0.01 || totals.transitAmount > 0.01) {
      throw new Error('Un monto negativo solo puede aplicarse a cuotas negativas.');
    }
    return;
  }
  if (credit > totals.appliedAmount + 0.01) {
    throw new Error('El saldo a favor aplicado supera las cuotas que se cobran.');
  }

  if (Math.abs(roundMoney(totals.appliedAmount + totals.transitAmount - credit) - totalAmount) > 0.01) {
    throw new Error('El monto aplicado y el monto enviado a tránsito no coinciden con el total del pago.');
  }
}

function createTransfer(input, workspaceId, amount, options) {
  const currency = getTrimmedString(input.currency) || 'USD';
  const paymentMethod = getTrimmedString(input.paymentMethod) || 'ACH';
  const sourceEntity = input && input.transferEntity && typeof input.transferEntity === 'object'
    && !Array.isArray(input.transferEntity)
    ? input.transferEntity
    : null;
  const incomeType = getPremiumIncomeType(input, sourceEntity);
  const entity = sourceEntity
    ? {
        ...sourceEntity,
        currency: sourceEntity.currency || currency,
        amount: amount,
        incomeType: incomeType,
        // Keep the accounting concept expected by UnDoPaymentAllocation.
        concept: 'IW',
        transferWorkspaceId: workspaceId
      }
    : {
        currency: currency,
        amount: amount,
        SplitPayments: [{
          amount: amount,
          paymentMethod: paymentMethod,
          paymentMethodName: getTrimmedString(input.paymentMethodName) || paymentMethod
        }],
        incomeType: incomeType,
        sourceExternal: getTrimmedString(input.sourceExternal) || 'CajaAhUSD',
        destinationAccountId: getPositiveInteger(input.destinationAccountId) || 208,
        isExternal: true,
        // UnDoPaymentAllocation espera la transferencia principal con este concepto.
        concept: 'IW',
        transferWorkspaceId: workspaceId
      };

  doCmd({
    cmd: 'RepoTransfer',
    data: {
      operation: 'ADD',
      entity: entity,
      otherReceivables: []
    }
  });

  if (!RepoTransfer || RepoTransfer.ok === false) {
    throw new Error(RepoTransfer && RepoTransfer.msg
      ? RepoTransfer.msg
      : 'No se pudo registrar la transferencia.');
  }

  const transfer = getRows(RepoTransfer.outData)[0];
  if (!transfer || getPositiveInteger(transfer.id) <= 0) {
    throw new Error('La transferencia no devolvió un identificador válido.');
  }

  // El movimiento debe quedar ejecutado antes de la asignación. Conservamos
  // el objeto original de RepoTransfer para que DoPaymentAllocation reciba la
  // misma estructura que el flujo nativo.
  doCmd({
    cmd: 'DoTransfer',
    data: { transferId: transfer.id, transfer: null }
  });

  if (!DoTransfer || DoTransfer.ok === false) {
    throw new Error(DoTransfer && DoTransfer.msg
      ? DoTransfer.msg
      : 'No se pudo ejecutar la transferencia.');
  }

  return transfer;
}

function createTransitDebitTransfer(input, workspaceId, amount, transitAccountId, details, allocationId) {
  const currency = getTrimmedString(input && input.currency) || 'USD';
  const paymentMethodName = getOtherPaymentMethodName();
  const sourceEntity = input && input.transferEntity && typeof input.transferEntity === 'object'
    && !Array.isArray(input.transferEntity)
    ? input.transferEntity
    : {};
  const policyCodes = Array.from(new Set(details
    .map(item => getTrimmedString(item && item.policy && (item.policy.code || item.policy.id)))
    .filter(code => code.length > 0)));
  const concept = `Pago de póliza ${policyCodes.join(', ')} (de TRÁNSITO)`;
  const transferAmount = roundMoney(amount);
  const relatedAllocationId = getPositiveInteger(allocationId);

  const entity = {
    currency: currency,
    amount: -transferAmount,
    sourceAccountId: null,
    destinationAccountId: transitAccountId,
    concept: concept,
    paymentMethod: 'OT',
    paymentMethodName: paymentMethodName,
    SplitPayments: [{
      paymentMethod: 'OT',
      paymentMethodName: paymentMethodName,
      amount: -transferAmount,
      currency: currency,
      id: 0,
      transferId: 0
    }],
    sourceName: null,
    destinationName: getTrimmedString(sourceEntity.destinationName) || null,
    source: null,
    destination: null,
    AllocationMovements: null,
    id: 0,
    transactionCode: null,
    producer: null,
    lifePolicyId: null,
    date: new Date().toISOString(),
    status: 0,
    executed: false,
    isExternal: true,
    sourceExternal: relatedAllocationId > 0 ? `ALLOCATION:${relatedAllocationId}` : null,
    allocationId: null,
    Allocation: null,
    operatingAccountId: 0,
    claimPaymentId: null,
    ClaimPayment: null,
    SourceAccount: null,
    DestinationAccount: null,
    Movements: null,
    reversalDate: null,
    incomeType: getTransitIncomeType(input),
    IncomeType: null,
    jIncomeTypeForm: null,
    transferWorkspaceId: workspaceId,
    user: getTrimmedString(sourceEntity.user) || null
  };

  doCmd({
    cmd: 'RepoTransfer',
    data: {
      operation: 'ADD',
      entity: entity,
      otherReceivables: []
    }
  });

  if (!RepoTransfer || RepoTransfer.ok === false) {
    throw new Error(RepoTransfer && RepoTransfer.msg
      ? RepoTransfer.msg
      : 'No se pudo registrar la salida de la cuenta en tránsito.');
  }

  const transfer = getRows(RepoTransfer.outData)[0];
  if (!transfer || getPositiveInteger(transfer.id) <= 0) {
    throw new Error('La salida de la cuenta en tránsito no devolvió un identificador válido.');
  }

  doCmd({
    cmd: 'DoTransfer',
    data: { transferId: transfer.id, transfer: null }
  });

  if (!DoTransfer || DoTransfer.ok === false) {
    throw new Error(DoTransfer && DoTransfer.msg
      ? DoTransfer.msg
      : 'No se pudo ejecutar la salida de la cuenta en tránsito.');
  }

  return getRows(DoTransfer.outData)[0] || transfer;
}

function buildPaymentAllocationEntity(input, workspaceId, amount, transfer, details, totals, creditDetails, creditTotal) {
  const installmentPremiums = [];
  const premiums = [];
  const supplementaryPremiums = [];

  details.forEach(item => {
    const policy = item.policy;
    const allocation = item.allocation;
    const currency = policy.currency || input.currency || 'USD';

    allocation.installments.forEach(installment => {
      const credit = roundMoney(installment.compensationAmount || 0);
      installmentPremiums.push({
        lifePolicyId: policy.id,
        payPlanId: installment.id,
        dueAmount: installment.dueAmount,
        moneyInAmount: roundMoney(installment.dueAmount - credit),
        currency: installment.currency || currency,
        compensationAmount: credit,
        ...(credit > 0 ? { compensationType: 'SALDOFAVOR' } : {}),
        transitAmount: 0
      });
      premiums.push({
        Installment: installment,
        comContractId: policy.comContractId,
        comContractName: policy.ComContract && policy.ComContract.name || '',
        concept: 'Premium',
        contractYear: policy.contractYear,
        coveredUntil: policy.end,
        created: policy.dateIncome,
        currency: installment.currency || currency,
        custom: false,
        ...installment,
        payerId: policy.holderId,
        policyCode: policy.code,
        policyHolderName: policy.Holder && policy.Holder.FullName || '',
        sellerName: ''
      });
    });

    if (allocation.transitAmount > 0) {
      supplementaryPremiums.push({
        compensationAmount: 0,
        currency: currency,
        destination: 'TRANSIT',
        transaction: `Depósito REF: ${transfer.id}`,
        lifePolicyId: policy.id,
        moneyInAmount: allocation.transitAmount,
        transitAmount: 0
      });
    }
  });

  // MSN-000175: one line per negative installment the credit takes; PayPremium leaves it at payed - taken.
  creditDetails.forEach(item => {
    const policy = item.policy;
    const currency = policy.currency || input.currency || 'USD';

    item.installments.forEach(installment => {
      installmentPremiums.push({
        lifePolicyId: policy.id,
        payPlanId: installment.id,
        dueAmount: -installment.taken,
        // Native negative applications book the signed amount as money-in;
        // they are not represented as a SALDOFAVOR compensation line.
        moneyInAmount: -installment.taken,
        currency: installment.currency || currency,
        compensationAmount: 0,
        transitAmount: 0
      });

      premiums.push({
        Installment: installment,
        comContractId: policy.comContractId,
        comContractName: policy.ComContract && policy.ComContract.name || '',
        concept: installment.concept || 'Premium',
        contractYear: policy.contractYear,
        coveredUntil: policy.end,
        created: policy.dateIncome,
        currency: installment.currency || currency,
        custom: false,
        ...installment,
        payerId: policy.holderId,
        policyCode: policy.code,
        policyHolderName: policy.Holder && policy.Holder.FullName || '',
        sellerName: ''
      });
    });
  });

  return {
    currency: input.currency || 'USD',
    InstallmentPremiums: installmentPremiums,
    SupplementaryPremiums: supplementaryPremiums.length > 0 ? supplementaryPremiums : null,
    differenceAmount: totals.difference,
    transactionDate: new Date().toISOString(),
    transferAmount: amount,
    fromTransitAmount: 0,
    compensationAmount: amount < -0.01 ? 0 : roundMoney(creditTotal || 0),
    premiumAmount: amount < -0.01 ? amount : totals.appliedAmount,
    supplementaryAmount: totals.transitAmount,
    premiumDifferenceAmount: 0,
    transferWorkspaceId: workspaceId,
    Transfers: transfer ? [transfer] : [],
    Premiums: premiums
  };
}

function getAllocationId(value) {
  const row = getRows(value)[0] || {};
  const nestedAllocation = row && row.Allocation;
  const candidates = [
    row && row.entity && row.entity.id,
    row && row.allocationId,
    row && row.id,
    nestedAllocation && nestedAllocation.id,
    nestedAllocation && nestedAllocation.allocationId
  ];

  for (const candidate of candidates) {
    const id = getPositiveInteger(candidate);
    if (id > 0) return id;
  }

  return 0;
}

function loadAllocationIdByTransferId(transferId) {
  const id = getPositiveInteger(transferId);
  if (id <= 0) return 0;

  doCmd({
    cmd: 'RepoTransfer',
    data: {
      operation: 'GET',
      filter: `id = ${id}`,
      include: ['Allocation'],
      size: 1,
      page: 0
    }
  });

  if (!RepoTransfer || RepoTransfer.ok === false) return 0;
  const row = getRows(RepoTransfer.outData)[0] || {};
  return getPositiveInteger(row.allocationId)
    || getPositiveInteger(row.Allocation && row.Allocation.id)
    || getPositiveInteger(row.Allocation && row.Allocation.allocationId);
}

function loadAllocationIdByCreditDetails(creditDetails) {
  const payPlanIds = Array.from(new Set((Array.isArray(creditDetails) ? creditDetails : [])
    .flatMap(item => Array.isArray(item && item.installments) ? item.installments : [])
    .map(item => getPositiveInteger(item && item.id))
    .filter(id => id > 0)));

  if (payPlanIds.length === 0) return 0;

  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'AllocationInstallment',
      fields: 'allocationId,payPlanId',
      filter: `payPlanId IN (${payPlanIds.join(',')})`,
      size: 100,
      page: 0,
      noTracking: true
    }
  });

  return getRows(LoadEntities && LoadEntities.outData)
    .map(row => getPositiveInteger(row && row.allocationId))
    .find(id => id > 0) || 0;
}

function getRows(value) {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

function getPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function getMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

// MSN-000175: negative installments and partly applied credits keep their sign.
function getSignedMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getTrimmedString(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

function getErrorMessage(error) {
  if (error && error.message) return error.message;
  return String(error || 'Error no especificado');
}
