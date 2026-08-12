//block
//noreplace

/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026-01-13
 * @name cmdContabilizacionPagoReclamoDTO
 * @version 1.1
 * @purpose Builds the accounting DTO for a claim payment for any line of business.
 * @param context.id ClaimPayment identifier.
 * @test: { id: 18 }
 */

try {
  const paymentId = getPositiveInteger(context && context.id);
  validateInput(paymentId);

  const payment = loadEntity(
    'ClaimPayment',
    `id=${paymentId}`,
    'claimId,total,payoutId,sourceAccountId'
  );
  validatePayment(payment, paymentId);

  const payout = loadEntity(
    'LifeCoveragePayout',
    `id=${getPositiveInteger(payment.payoutId)}`,
    'reserveType,reserved'
  );
  if (!payout) {
    throw new Error('No se recuperó información de la reserva del pago');
  }

  const cededCessions = loadCededCessions(payment.payoutId);
  const cededReserve = sumCededReserve(cededCessions);
  const reinsuranceAmount = calculateProportionalReinsurance(
    cededReserve,
    payment.total,
    payout.reserved
  );

  const account = loadEntity(
    'Account',
    `id=${getPositiveInteger(payment.sourceAccountId)}`,
    'catalogAccountCode'
  );
  if (!account || !getTrimmedString(account.catalogAccountCode)) {
    throw new Error('No se recuperó la cuenta bancaria del pago');
  }

  const claim = loadEntity(
    'Claim',
    `id=${getPositiveInteger(payment.claimId)}`,
    'lifePolicyId'
  );
  if (!claim || getPositiveInteger(claim.lifePolicyId) <= 0) {
    throw new Error('No se recuperó información válida del reclamo');
  }

  const policy = loadEntity(
    'LifePolicy',
    `id=${getPositiveInteger(claim.lifePolicyId)}`,
    null
  );
  if (!policy || !getTrimmedString(policy.lob)) {
    throw new Error('No se recuperó información válida de la póliza');
  }

  const acceptants = getCededAcceptants(
    cededCessions,
    payment.total,
    payout.reserved,
    policy
  );

  const lob = loadEntity(
    'LOB',
    `code='${escapeSqlString(policy.lob)}'`,
    'name'
  );
  if (!lob || !getTrimmedString(lob.name)) {
    throw new Error('No se recuperó el nombre del ramo de la póliza');
  }

  const tipoPago = getTrimmedString(payout.reserveType) === 'IN'
    ? 'PagoReclamo'
    : 'GastoReclamo';
  const conceptoPago = tipoPago === 'GastoReclamo' ? 'Gasto' : 'Pago';
  const codigoPago = tipoPago === 'GastoReclamo'
    ? 'GastosSiniestros'
    : 'PagosSiniestros';

  return [{
    monto: Math.abs(toNumber(payment.total)),
    reaseguroCedido: reinsuranceAmount,
    aceptantes: acceptants,
    cuentaBancaria: getTrimmedString(account.catalogAccountCode),
    reclamoId: getPositiveInteger(payment.claimId),
    code: codigoPago,
    lob: getTrimmedString(policy.lob),
    referencia: `Liquidación Reclamo # ${payment.claimId} Solicitud # ${paymentId}`,
    description: `${conceptoPago} de reclamo ${payment.claimId} Póliza ${getTrimmedString(policy.code)} Solicitud ${paymentId}`,
    unique: `TX-R#${payment.claimId}-S#${paymentId}`,
    ramo: getTrimmedString(lob.name),
    tipoPago: tipoPago,
    id: paymentId
  }];
} catch (error) {
  throw new Error(getErrorMessage(error));
}

function validateInput(paymentId) {
  if (paymentId <= 0) {
    throw new Error('Debe indicar un identificador válido del pago del reclamo');
  }
}

function validatePayment(payment, paymentId) {
  if (!payment) {
    throw new Error(`No se recuperó la solicitud de pago ${paymentId}`);
  }

  if (getPositiveInteger(payment.claimId) <= 0) {
    throw new Error('La solicitud de pago no tiene un reclamo válido');
  }

  if (getPositiveInteger(payment.payoutId) <= 0) {
    throw new Error('La solicitud de pago no tiene una reserva válida');
  }

  if (getPositiveInteger(payment.sourceAccountId) <= 0) {
    throw new Error('La solicitud de pago no tiene una cuenta bancaria válida');
  }

  if (!Number.isFinite(Number(payment.total))) {
    throw new Error('La solicitud de pago no tiene un monto válido');
  }
}

function loadEntity(entity, filter, fields) {
  const data = {
    entity: entity,
    operation: 'GET',
    filter: filter,
    noTracking: true
  };

  if (getTrimmedString(fields)) {
    data.fields = fields;
  }

  doCmd({
    cmd: 'LoadEntity',
    data: data
  });

  const response = typeof LoadEntity === 'undefined' ? null : LoadEntity;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg
      ? response.msg
      : `No fue posible recuperar la entidad ${entity}`);
  }

  const outputData = response.outData;
  if (Array.isArray(outputData)) {
    return outputData.length > 0 ? outputData[0] : null;
  }

  return outputData && typeof outputData === 'object' ? outputData : null;
}

function loadCededCessions(payoutId) {
  doCmd({
    cmd: 'RepoLossCession',
    data: {
      operation: 'GET',
      filter: `lifeCoveragePayoutId=${getPositiveInteger(payoutId)}`,
      noTracking: true
    }
  });

  const response = typeof RepoLossCession === 'undefined'
    ? null
    : RepoLossCession;

  if (!response || response.ok === false) {
    throw new Error(response && response.msg
      ? response.msg
      : 'No fue posible recuperar la distribución de reaseguro');
  }

  return getRows(response.outData).filter(item => {
    return getPositiveInteger(item && item.id) > 0;
  });
}

function sumCededReserve(cessions) {
  return getRows(cessions).reduce((total, item) => {
    return total + toNumber(item && item.cededReserve);
  }, 0);
}

function getCededAcceptants(cessions, paymentAmount, payoutReserved, policy) {
  const cessionIds = getRows(cessions)
    .map(item => getPositiveInteger(item && item.id))
    .filter(id => id > 0);

  if (cessionIds.length === 0) {
    return [];
  }

  const parts = loadCessionParts(cessionIds);
  const accountRules = loadReinsuranceAccountRules();
  const paymentRatio = getPaymentRatio(paymentAmount, payoutReserved);
  const cessionsById = {};

  getRows(cessions).forEach(cession => {
    cessionsById[getPositiveInteger(cession.id)] = cession;
  });

  const groupedAcceptants = groupAcceptantsByContact(
    parts,
    cessionsById,
    paymentRatio
  );

  return groupedAcceptants.map(group => {
    const accountRule = getFirstMatchingAccountRule(
      accountRules,
      policy,
      group.lossCession,
      group.lossCessionPart
    );

    return {
      monto: group.monto,
      codigo: group.contactId,
      debe: group.monto > 0 ? group.monto : 0,
      habe: group.monto < 0 ? Math.abs(group.monto) : 0,
      cuentaContable: accountRule
        ? getTrimmedString(accountRule.cdgocont)
        : ''
    };
  });
}

function groupAcceptantsByContact(parts, cessionsById, paymentRatio) {
  const grouped = {};

  // Aggregate the proportional ceded amount before evaluating account formulas.
  getRows(parts).forEach(part => {
    const contactId = getPositiveInteger(part && part.contactId);
    const cession = cessionsById[getPositiveInteger(part.lossCessionId)];
    const cededReserve = toNumber(cession && cession.cededReserve);
    const split = toNumber(part.split) / 100;
    const amount = toDecimal(cededReserve * paymentRatio * split);

    if (contactId <= 0) {
      return;
    }

    if (!grouped[contactId]) {
      grouped[contactId] = {
        contactId: contactId,
        monto: 0,
        lossCession: cession || null,
        lossCessionPart: Object.assign({}, part, {
          contactId: contactId,
          monto: 0,
          amount: 0
        })
      };
    }

    grouped[contactId].monto = toDecimal(grouped[contactId].monto + amount);
    grouped[contactId].lossCessionPart.monto = grouped[contactId].monto;
    grouped[contactId].lossCessionPart.amount = grouped[contactId].monto;
  });

  return Object.keys(grouped).map(contactId => {
    const group = grouped[contactId];
    return {
      contactId: group.contactId,
      monto: toDecimal(group.monto),
      lossCession: group.lossCession,
      lossCessionPart: group.lossCessionPart
    };
  });
}

function loadCessionParts(cessionIds) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'LossCessionPart',
      operation: 'GET',
      filter: `lossCessionId IN (${cessionIds.join(',')})`,
      noTracking: true
    }
  });

  const response = typeof LoadEntities === 'undefined' ? null : LoadEntities;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg
      ? response.msg
      : 'No fue posible recuperar los aceptantes del reaseguro');
  }

  return getRows(response.outData);
}

function loadReinsuranceAccountRules() {
  doCmd({
    cmd: 'GetFullTable',
    data: {
      table: 'CuentaReaseguradorReclamo'
    }
  });

  const response = typeof GetFullTable === 'undefined' ? null : GetFullTable;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg
      ? response.msg
      : 'No fue posible recuperar la configuración de cuentas de reaseguro');
  }

  const tableRows = getRows(response.outData);
  if (tableRows.length < 2) {
    return [];
  }

  const headers = getRows(tableRows[0]).map(header => {
    return getTrimmedString(header);
  });

  if (headers.length === 0) {
    throw new Error('La tabla de cuentas de reaseguro no tiene encabezados');
  }

  return tableRows.slice(1).map(row => {
    const values = getRows(row);
    const accountRule = {};

    headers.forEach((header, index) => {
      if (header) {
        accountRule[header] = values[index];
      }
    });

    return accountRule;
  }).filter(rule => {
    return getTrimmedString(rule.formula);
  });
}

function getFirstMatchingAccountRule(rules, policy, lossCession, lossCessionPart) {
  const formulaContext = {
    policy: policy,
    poliza: policy,
    lossCession: lossCession,
    lossCessionPart: lossCessionPart
  };

  return getRows(rules).find(rule => {
    return evaluateAccountFormula(rule.formula, formulaContext);
  }) || null;
}

function evaluateAccountFormula(formula, formulaContext) {
  const expression = getTrimmedString(formula);
  if (!expression) {
    return false;
  }

  try {
    // Account formulas are trusted configuration maintained in the database.
    const evaluator = new Function(
      'context',
      'policy',
      'poliza',
      'lossCession',
      'lossCessionPart',
      `return Boolean(${expression});`
    );

    return evaluator(
      formulaContext,
      formulaContext.policy,
      formulaContext.poliza,
      formulaContext.lossCession,
      formulaContext.lossCessionPart
    ) === true;
  } catch (error) {
    throw new Error(`No fue posible evaluar la fórmula de cuenta de reaseguro: ${getErrorMessage(error)}`);
  }
}

function getPaymentRatio(paymentAmount, payoutReserved) {
  const payment = toNumber(paymentAmount);
  const reserved = toNumber(payoutReserved);

  if (reserved === 0 || payment === 0) {
    return 0;
  }

  return payment / reserved;
}

function calculateProportionalReinsurance(cededReserve, paymentAmount, payoutReserved) {
  const paid = toNumber(paymentAmount);
  const baseAmount = toNumber(payoutReserved);

  if (baseAmount === 0 || paid === 0) {
    return 0;
  }

  return Math.abs(toDecimal(toNumber(cededReserve) * (paid / baseAmount)));
}

function getPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function getTrimmedString(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toDecimal(value) {
  return Number((Math.round((toNumber(value) + Number.EPSILON) * 100) / 100).toFixed(2));
}

function getRows(value) {
  return Array.isArray(value) ? value : [];
}

function escapeSqlString(value) {
  return getTrimmedString(value).replace(/'/g, "''");
}

function getErrorMessage(error) {
  if (error && error.message) return error.message;
  return String(error || 'Error desconocido');
}
