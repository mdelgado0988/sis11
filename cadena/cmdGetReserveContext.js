//block
//noreplace

/**
 * @author Noel Obando
 * @email noel.obando@axxis-systems.com
 * @created 2026-01-07
 * @name cmdGetReserveContext
 * @version 1.3
 * @purpose Builds the accounting context for claim reserve movements.
 * @param context.id LifeCoveragePayout identifier.
 * @changes 1.2 (MSN-000271) Returns ramo: the name of the policy's line of business (catalog
 *          LOB, without its code), for the concept of the ReservaSiniestro lines.
 * @changes 1.3 (MSN-000283) Resolves the account of every ReservaSiniestro line from the table
 *          CuentasReservaReclamo, as cmdEmisionIncendioContext does for issuance: the column
 *          "<ramo>-<producto>" when it has a value for the line, otherwise the column of the
 *          ramo. Returned as cuentaVariacion, cuentaObligaciones, cuentaVariacionRea and
 *          cuentaObligacionRea.
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
  const ramo = getNombreRamo(policy);
  const cuentas = getCuentasContables(policy);

  return [{
    ...cuentas,
    id: reserveId,
    reserved: Math.abs(reserved),
    payed: Math.abs(payed),
    ceded: Math.abs(cededReserve),
    increase: reserved > 0,
    reference: `TX-${reserveId} Reserva Siniestro`,
    description: `${prefix} de reserva de siniestro Póliza #${policyCode} - Reclamo #${claimCode}`,
    ramo: ramo,
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

/**
 * MSN-000271: nombre del ramo de la póliza (catálogo LOB, sin el código: "6 - Automóvil" → "Automóvil").
 * Sin ramo o sin nombre devuelve '' y la plantilla omite el ramo del concepto.
 */
function getNombreRamo(policy) {
  const lobCode = getTrimmedString(policy && policy.lob).replace(/'/g, "''");
  if (!lobCode) {
    return '';
  }

  doCmd({
    cmd: 'RepoLob',
    data: {
      operation: 'GET',
      filter: `code = '${lobCode}'`,
      noTracking: true
    }
  });

  const response = getCommandResult('RepoLob');
  const ramo = response && response.ok !== false && Array.isArray(response.outData)
    ? response.outData[0]
    : null;

  return getTrimmedString(ramo && ramo.name).replace(/^\s*[^-]+\s*-\s*/, '').trim();
}

/**
 * MSN-000283: resolves the account of each ReservaSiniestro line from CuentasReservaReclamo.
 * Rows are the template lines (column "Cuenta"); columns are the ramo code ("52") or a
 * product of that ramo ("52-FRAUDE"). A product cell with a value wins; an empty or missing
 * product cell falls back to the ramo column.
 */
function getCuentasContables(policy) {
  const tableName = 'CuentasReservaReclamo';
  const lines = {
    cuentaVariacion: 'Variacion',
    cuentaObligaciones: 'Obligaciones',
    cuentaVariacionRea: 'VariacionRea',
    cuentaObligacionRea: 'ObligacionRea'
  };

  doCmd({
    cmd: 'GetFullTable',
    data: { table: tableName }
  });

  const response = getCommandResult('GetFullTable');
  const rows = response && response.ok !== false && response.outData
    ? JSON.parse(JSON.stringify(response.outData))
    : [];
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error(`No se encontró la tabla de cuentas ${tableName}`);
  }

  const header = getRows(rows[0]).map(normalizeKey);
  const lob = getTrimmedString(policy && policy.lob);
  const product = getTrimmedString(policy && (policy.productCode || (policy.Product && policy.Product.code)));
  const lobIndex = lob ? header.indexOf(normalizeKey(lob)) : -1;
  const productIndex = lob && product ? header.indexOf(normalizeKey(`${lob}-${product}`)) : -1;

  const result = {};
  Object.keys(lines).forEach(field => {
    const row = rows.find(item => Array.isArray(item) && normalizeKey(item[0]) === normalizeKey(lines[field]));
    const productAccount = row && productIndex > 0 ? getTrimmedString(row[productIndex]) : '';
    const lobAccount = row && lobIndex > 0 ? getTrimmedString(row[lobIndex]) : '';
    result[field] = productAccount || lobAccount;
  });

  return result;
}

function normalizeKey(value) {
  return getTrimmedString(value).toUpperCase();
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
