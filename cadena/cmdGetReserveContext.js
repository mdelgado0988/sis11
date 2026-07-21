//block
//noreplace

/**
 * @author Noel Obando
 * @email noel.obando@axxis-systems.com
 * @created 2026-01-07
 * @name cmdGetReserveContext
 * @version 1.1
 * @purpose Builds the accounting context for claim reserve movements.
 * @param context.id LifeCoveragePayout identifier.
 */

try {
  const reserveId = getPositiveInteger(context && context.id);
  validateInput(reserveId);

  const reserve = loadReserve(reserveId);
  validateReserve(reserve, reserveId);

  const cededReserve = getCededReserve(reserveId);
  const claim = loadClaim(reserve.claimId);
  validateClaim(claim, reserve);

  const policy = claim.Policy;
  const coverage = findCoverage(policy.Coverages, reserve.lifeCoverageId);
  if (!coverage) {
    throw new Error('No se encontró la cobertura relacionada con la reserva');
  }

  const reserved = toNumber(reserve.reserved);
  const payed = toNumber(reserve.payed);
  const isPayment = payed !== 0;
  const prefix = reserved > 0 ? 'Apertura/Aumento' : 'Cierre/Disminución';
  const claimCode = getTrimmedString(claim.code) || String(claim.id);
  const policyCode = getTrimmedString(policy.code);

  return [{
    id: reserveId,
    reserved: Math.abs(reserved),
    payed: Math.abs(payed),
    ceded: Math.abs(cededReserve),
    increase: reserved > 0,
    reference: isPayment
      ? `TX-${reserveId} Pago Siniestro`
      : `TX-${reserveId} Reserva Siniestro`,
    description: isPayment
      ? `Pago de siniestro Póliza #${policyCode} - Reclamo #${claimCode}`
      : `${prefix} de reserva de siniestro Póliza #${policyCode} - Reclamo #${claimCode}`,
    currency: getTrimmedString(policy.currency),
    Claim: claim,
    Policy: policy,
    Coverage: coverage
  }];
} catch (error) {
  throw new Error(getErrorMessage(error));
}

function validateInput(reserveId) {
  if (reserveId <= 0) {
    throw new Error('Debe indicar un identificador válido de la reserva');
  }
}

function validateReserve(reserve, reserveId) {
  if (!reserve) {
    throw new Error(`No se encontró la reserva ${reserveId}`);
  }

  if (getPositiveInteger(reserve.claimId) <= 0) {
    throw new Error('La reserva no tiene un reclamo válido');
  }

  if (getPositiveInteger(reserve.lifeCoverageId) <= 0) {
    throw new Error('La reserva no tiene una cobertura válida');
  }
}

function loadReserve(reserveId) {
  doCmd({
    cmd: 'RepoLifeCoveragePayout',
    data: {
      operation: 'GET',
      filter: `id=${reserveId}`,
      noTracking: true
    }
  });

  return getFirstRow(getCommandResult('RepoLifeCoveragePayout'));
}

function getCededReserve(reserveId) {
  doCmd({
    cmd: 'RepoLossCession',
    data: {
      operation: 'GET',
      filter: `lifeCoveragePayoutId=${reserveId}`,
      noTracking: true
    }
  });

  const response = getCommandResult('RepoLossCession');
  validateCommandResponse(response, 'No fue posible recuperar las cesiones del siniestro');

  return getRows(response.outData).reduce((total, item) => {
    return total + toNumber(item && item.cededReserve);
  }, 0);
}

function loadClaim(claimId) {
  doCmd({
    cmd: 'RepoClaim',
    data: {
      operation: 'GET',
      filter: `id=${getPositiveInteger(claimId)}`,
      include: ['Policy.Coverages'],
      noTracking: true
    }
  });

  return getFirstRow(getCommandResult('RepoClaim'));
}

function validateClaim(claim, reserve) {
  if (!claim) {
    throw new Error(`No se encontró el reclamo ${reserve.claimId}`);
  }

  if (!claim.Policy) {
    throw new Error('El reclamo no tiene una póliza relacionada');
  }

  if (!Array.isArray(claim.Policy.Coverages)) {
    throw new Error('La póliza no tiene coberturas disponibles');
  }
}

function findCoverage(coverages, coverageId) {
  const id = getPositiveInteger(coverageId);
  return getRows(coverages).find(item => {
    return item && getPositiveInteger(item.id) === id;
  }) || null;
}

function getCommandResult(commandName) {
  return typeof globalThis !== 'undefined' && globalThis[commandName]
    ? globalThis[commandName]
    : null;
}

function validateCommandResponse(response, fallbackMessage) {
  if (!response || response.ok === false) {
    throw new Error(response && response.msg ? response.msg : fallbackMessage);
  }
}

function getRows(value) {
  return Array.isArray(value) ? value : [];
}

function getFirstRow(response) {
  validateCommandResponse(response, 'No fue posible recuperar la información solicitada');
  const rows = getRows(response.outData);
  return rows.length > 0 ? rows[0] : null;
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

function getErrorMessage(error) {
  if (error && error.message) return error.message;
  return String(error || 'Error desconocido');
}
