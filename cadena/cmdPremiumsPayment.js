//block
//noreplace

/**
 * @author Michael Delgado
 * @email support@axxis-systems.com
 * @created 2026/08/09
 * @name cmdPremiumsPayment
 * @version 1.0
 * @purpose: Apply one payment to multiple policies and send any excess to transit.
 * @context: {
 *   workspaceId: number,
 *   currency?: string,
 *   amount?: number,
 *   payments: [{ policyId: number, amount: number }],
 *   supplementaryPayments?: [{ policyId: number, amount: number }],
 *   transferEntity?: object
 * }
 * @notes:
 *   - The payment is distributed by policy without validating a payer or fiscal receipt.
 *   - Each policy amount is applied to its pending installments in due-date order.
 *   - Supplementary payments are registered directly in the selected policy transit account.
 *   - The transfer entity can be provided by the payment form to preserve split-payment details.
 */

const commandContext = context || {};

try {
  const input = getContextInput(commandContext);
  validateInput(input);

  const workspaceId = getPositiveInteger(input.workspaceId);
  const payments = getPaymentRows(input);
  const supplementaryPayments = getSupplementaryPaymentRows(input);
  const requestedAmount = getMoney(input.amount);
  const calculatedAmount = roundMoney(
    payments.reduce((total, item) => total + item.amount, 0)
    + supplementaryPayments.reduce((total, item) => total + item.amount, 0)
  );
  const totalAmount = requestedAmount > 0 ? requestedAmount : calculatedAmount;

  if (Math.abs(totalAmount - calculatedAmount) > 0.01) {
    throw new Error('El monto total no coincide con la suma de los montos asignados a las pólizas.');
  }

  const details = [];
  for (const payment of payments) {
    const policy = loadPolicy(payment.policyId);
    const payPlan = loadPayPlan(policy.id);
    const allocation = distributePayment(payPlan, payment.amount);

    if (allocation.transitAmount > 0) {
      ensureTransitAccount(policy);
    }

    details.push({
      policy: policy,
      amount: payment.amount,
      allocation: allocation
    });
  }

  for (const supplementaryPayment of supplementaryPayments) {
    const policy = loadPolicy(supplementaryPayment.policyId);
    ensureTransitAccount(policy);
    details.push({
      policy: policy,
      amount: supplementaryPayment.amount,
      allocation: {
        installments: [],
        appliedAmount: 0,
        transitAmount: supplementaryPayment.amount
      }
    });
  }

  const totals = calculateTotals(details);
  validateTotals(totalAmount, totals);

  const transfer = createTransfer(input, workspaceId, totalAmount);
  const entity = buildPaymentAllocationEntity(input, workspaceId, totalAmount, transfer, details, totals);

  doCmd({
    cmd: 'DoPaymentAllocation',
    data: { entity: entity }
  });

  if (!DoPaymentAllocation || DoPaymentAllocation.ok === false) {
    throw new Error(DoPaymentAllocation && DoPaymentAllocation.msg
      ? DoPaymentAllocation.msg
      : 'No fue posible aplicar el pago.');
  }

  return {
    ok: true,
    msg: 'Pago de primas aplicado correctamente',
    data: {
      amount: totalAmount,
      appliedAmount: totals.appliedAmount,
      transitAmount: totals.transitAmount,
      difference: totals.difference,
      policies: details.map(item => ({
        policyId: item.policy.id,
        amount: item.amount,
        appliedAmount: item.allocation.appliedAmount,
        transitAmount: item.allocation.transitAmount,
        installments: item.allocation.installments.map(row => ({
          payPlanId: row.id,
          amount: row.dueAmount
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
  if (payments.length === 0 && supplementaryPayments.length === 0) {
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

function validateTotals(totalAmount, totals) {
  if (Math.abs(totals.difference) > 0.01) {
    throw new Error('La distribución del pago no coincide con el monto enviado a tránsito.');
  }

  if (Math.abs(roundMoney(totals.appliedAmount + totals.transitAmount) - totalAmount) > 0.01) {
    throw new Error('El monto aplicado y el monto enviado a tránsito no coinciden con el total del pago.');
  }
}

function createTransfer(input, workspaceId, amount) {
  const currency = getTrimmedString(input.currency) || 'USD';
  const paymentMethod = getTrimmedString(input.paymentMethod) || 'ACH';
  const sourceEntity = input && input.transferEntity && typeof input.transferEntity === 'object'
    && !Array.isArray(input.transferEntity)
    ? input.transferEntity
    : null;
  const entity = sourceEntity
      ? {
        ...sourceEntity,
        currency: sourceEntity.currency || currency,
        amount: amount,
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
        incomeType: getTrimmedString(input.incomeType) || 'IT7',
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

  doCmd({
    cmd: 'DoTransfer',
    data: { transferId: transfer.id, transfer: null }
  });

  if (!DoTransfer || DoTransfer.ok === false) {
    throw new Error(DoTransfer && DoTransfer.msg
      ? DoTransfer.msg
      : 'No se pudo ejecutar la transferencia.');
  }

  return getRows(DoTransfer.outData)[0] || transfer;
}

function buildPaymentAllocationEntity(input, workspaceId, amount, transfer, details, totals) {
  const installmentPremiums = [];
  const premiums = [];
  const supplementaryPremiums = [];

  details.forEach(item => {
    const policy = item.policy;
    const allocation = item.allocation;
    const currency = policy.currency || input.currency || 'USD';

    allocation.installments.forEach(installment => {
      installmentPremiums.push({
        lifePolicyId: policy.id,
        payPlanId: installment.id,
        dueAmount: installment.dueAmount,
        moneyInAmount: installment.dueAmount,
        currency: installment.currency || currency,
        compensationAmount: 0,
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

  return {
    currency: input.currency || 'USD',
    InstallmentPremiums: installmentPremiums,
    SupplementaryPremiums: supplementaryPremiums.length > 0 ? supplementaryPremiums : null,
    differenceAmount: totals.difference,
    transactionDate: new Date().toISOString(),
    transferAmount: amount,
    fromTransitAmount: 0,
    compensationAmount: 0,
    premiumAmount: totals.appliedAmount,
    supplementaryAmount: totals.transitAmount,
    premiumDifferenceAmount: 0,
    transferWorkspaceId: workspaceId,
    Transfers: [transfer],
    Premiums: premiums
  };
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
