//block
//noreplace
/*
 * cmdApplyReaChangeCoverage
 *
 * Versiona el reaseguro completo despues de ejecutar un ChangeCoverage:
 * - lee las cesiones vigentes de la poliza (overwritten = 0);
 * - marca esas cesiones como historicas (overwritten = 1);
 * - crea una nueva fotografia completa con overwritten = 0 y changeId.
 *
 * La distribucion recibida representa el estado final confirmado por la
 * vista para las combinaciones contrato/linea/cobertura afectadas. Las
 * combinaciones no afectadas se copian sin cambios.
 */

const CESSION_COLUMNS = [
  'contractId', 'lifePolicyId', 'coverageId', 'lineId', 'cover', 'LoB',
  'product', 'policyCode', 'start', 'end', 'msg', 'sumInsured', 'premium',
  'premiumType', 'sumInsuredCedant', 'premiumCedant', 'comissionCedant',
  'sumInsuredRe', 'premiumRe', 'err', 'holderName', 'proportionCed',
  'proportionRe', 'currency', 'distributionMode', 'contactId', 'coverageCode',
  'coCommission', 'coPercentage', 'coPremium', 'coSumInsured', 'np',
  'overwritten', 'changeId', 'anniversaryId', 'reserve', 'oldContractId',
  'edited', 'loading', 'loadingCedant', 'loadingRe', 'sumInsuredComputed',
  'fee', 'tax', 'nonTechnicalPremium', 'credit', 'jAmounts',
  'comissionCedantExtra'
];

const CESSION_PART_COLUMNS = [
  'cessionId', 'contactId', 'lineId', 'split', 'sumInsured', 'premium', 'name',
  'liquidationId', 'currency', 'commission', 'tax', 'brokerId', 'reserve', 'fee'
];

const COCESSION_COLUMNS = [
  'lifePolicyId', 'contactId', 'sumInsured', 'premium', 'sumInsuredCeded',
  'premiumCeded', 'commission', 'percentage', 'created', 'leader', 'currency',
  'liquidationId', 'paidOnCollection', 'parentCoCession', 'brokerCommission',
  'tax', 'changeId', 'overwritten', 'allocationId', 'lifeCoverageId', 'brokerId'
];

const money = function (value) { return Number(Number(value || 0).toFixed(2)); };
const num = function (value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};
const txt = function (value) { return String(value == null ? '' : value).trim(); };
const clone = function (value) { return JSON.parse(JSON.stringify(value || {})); };
const keyOf = function (item) {
  return Number(item.contractId || 0) + '|' + txt(item.lineId) + '|' + txt(item.coverageCode);
};
const sqlValue = function (value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'string' && value.indexOf('@') === 0) return value;
  if (typeof value === 'object') return "'" + JSON.stringify(value).replace(/'/g, "''") + "'";
  return "'" + String(value).replace(/'/g, "''") + "'";
};

const changeId = Number(context && context.changeId || 0);
if (!changeId) throw 'Falta el identificador del endoso';
const mode = txt(context && context.mode).toUpperCase() || 'FINALIZE';
if (['PREPARE', 'FINALIZE', 'ROLLBACK'].indexOf(mode) < 0) throw 'Modo de aplicacion de reaseguro no valido: ' + mode;
let requestedRows = Array.isArray(context && context.distribution) ? context.distribution : [];
let requestedParts = Array.isArray(context && context.participants) ? context.participants : [];
let requestedCoinsurance = [];

doCmd({ cmd: 'LoadEntity', data: {
  entity: 'Change', fields: 'id,lifePolicyId,status,jNewCoverages,jAdditional',
  filter: 'id = ' + changeId, noTracking: true
} });
const change = LoadEntity.outData;
if (!change) throw 'El endoso ' + changeId + ' no existe';
if (mode === 'FINALIZE' && Number(change.status) !== 1) throw 'El endoso ' + changeId + ' no esta ejecutado';
const policyId = Number(change.lifePolicyId || 0);
if (!policyId) throw 'El endoso no tiene poliza asociada';

if (mode === 'ROLLBACK') {
  const rollbackSql = 'SET XACT_ABORT ON; BEGIN TRANSACTION; '
    + 'DELETE FROM CessionPart WHERE cessionId IN (SELECT id FROM Cession WHERE lifePolicyId = ' + policyId + ' AND changeId = ' + changeId + ' AND overwritten = 0); '
    + 'DELETE FROM Cession WHERE lifePolicyId = ' + policyId + ' AND changeId = ' + changeId + ' AND overwritten = 0; '
    + 'COMMIT TRANSACTION;';
  doCmd({ cmd: 'DoQuery', data: { sql: rollbackSql } });
  if (!DoQuery || DoQuery.ok === false) return { ok: false, stage: 'ROLLBACK', changeId: changeId, policyId: policyId,
    msg: 'No fue posible limpiar las cesiones temporales del endoso: ' + (DoQuery && DoQuery.msg ? DoQuery.msg : 'error de persistencia') };
  return { ok: true, stage: 'ROLLBACK', changeId: changeId, policyId: policyId,
    msg: 'Las cesiones temporales del endoso fueron limpiadas correctamente.' };
}

// La configuracion confirmada se guarda en el propio endoso antes de
// ejecutarlo. Se usa como fuente principal para permitir reintentos sin
// depender del payload temporal de la vista.
let additional = {};
try {
  const rawAdditional = change.jAdditional || '{}';
  additional = typeof rawAdditional === 'string'
    ? JSON.parse(rawAdditional || '{}')
    : (rawAdditional || {});
} catch (error) {
  additional = {};
}
const snapshot = additional.reinsuranceSnapshot;
if (snapshot && Array.isArray(snapshot.distribution)) {
  requestedRows = snapshot.distribution;
  requestedParts = Array.isArray(snapshot.participants) ? snapshot.participants : [];
  requestedCoinsurance = Array.isArray(snapshot.coinsurance) ? snapshot.coinsurance : [];
}
if (!requestedRows.length) throw 'El endoso no tiene distribucion de reaseguro guardada';

let finalCoverages = [];
try { finalCoverages = JSON.parse(change.jNewCoverages || '[]'); }
catch (error) { throw 'El endoso no contiene coberturas finales validas'; }
const coverageByCode = {};
finalCoverages.forEach(function (coverage) { coverageByCode[txt(coverage.code)] = coverage; });

const rowsByKey = {};
requestedRows.forEach(function (row) { rowsByKey[keyOf(row)] = row; });
const partsByKey = {};
requestedParts.forEach(function (part) {
  const key = keyOf(part);
  if (!partsByKey[key]) partsByKey[key] = [];
  partsByKey[key].push(part);
});

// El endoso solo actualiza coaseguradores que ya existen. La compañía no
// llega en este snapshot porque es una línea sintética de la vista.
let currentCoinsurance = [];
let coinsuranceSources = [];
if (requestedCoinsurance.length) {
  doCmd({ cmd: 'LoadEntities', data: {
    entity: 'CoCession',
    filter: 'lifePolicyId = ' + policyId + ' AND parentCoCession IS NULL AND overwritten = 0',
    noTracking: true
  } });
  currentCoinsurance = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
  const currentCoinsuranceIds = {};
  currentCoinsurance.forEach(function (cession) { currentCoinsuranceIds[Number(cession.id)] = cession; });
  const usedCoinsuranceIds = {};
  coinsuranceSources = requestedCoinsurance.map(function (cession) {
    let source = currentCoinsuranceIds[Number(cession.id)];
    if (source && usedCoinsuranceIds[Number(source.id)]) source = null;
    if (!source) {
      source = currentCoinsurance.find(function (current) {
        return !usedCoinsuranceIds[Number(current.id)]
          && Number(current.contactId) === Number(cession.contactId);
      });
    }
    if (source) usedCoinsuranceIds[Number(source.id)] = true;
    return source || null;
  });
  const missingCoinsurance = coinsuranceSources.filter(function (cession) {
    return !cession;
  });
  if (missingCoinsurance.length) {
    throw 'El endoso referencia coaseguradores que no existen en la poliza: ' + requestedCoinsurance
      .filter(function (cession, index) { return !coinsuranceSources[index]; })
      .map(function (cession) { return Number(cession.id || 0) + '/' + Number(cession.contactId || 0); }).join(', ');
  }
}

// Validacion previa: no se escribe nada si el reparto confirmado es invalido.
const errors = [];
requestedRows.forEach(function (row) {
  const ceded = money(row.premiumRe);
  const parts = partsByKey[keyOf(row)] || [];
  if (ceded !== 0 && parts.length) {
    const split = parts.reduce(function (sum, part) { return sum + num(part.split); }, 0);
    if (Math.abs(split - 100) > 0.011) errors.push('linea ' + keyOf(row) + ': los aceptantes suman ' + split + '%');
  }
  if (num(row.sumInsuredMovement) !== 0 &&
      Math.abs(money(row.sumInsuredCedant) + money(row.sumInsuredRe)) > Math.abs(money(row.sumInsuredMovement)) + 0.011) {
    errors.push('cobertura ' + txt(row.coverageCode) + ': la suma retenida mas cedida supera el movimiento');
  }
});
if (errors.length) return { ok: false, stage: 'VALIDATION', changeId: changeId, policyId: policyId,
  errors: errors, msg: 'La distribucion confirmada no es valida: ' + errors.join('; ') };

// Leer solo la version vigente y sus hijos. Las filas overwritten = 1 quedan
// como historial y no vuelven a entrar en la nueva fotografia.
doCmd({ cmd: 'LoadEntities', data: {
  entity: 'Cession', filter: 'lifePolicyId = ' + policyId + ' AND overwritten = 0', noTracking: true
} });
const currentCessions = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
if (!currentCessions.length && mode === 'FINALIZE') throw 'La poliza no tiene reaseguro vigente para versionar';

const insertSql = function (table, columns, entity, overrides) {
  const values = columns.map(function (column) {
    return sqlValue(overrides && overrides[column] !== undefined ? overrides[column] : entity[column]);
  });
  return 'INSERT INTO [' + table + '] (' + columns.map(function (column) { return '[' + column + ']'; }).join(', ') +
    ') VALUES (' + values.join(', ') + ');';
};

if (mode === 'PREPARE') {
  const requestedByKey = {};
  requestedRows.forEach(function (row) { requestedByKey[keyOf(row)] = row; });
  const temporaryByKey = {};
  currentCessions.forEach(function (cession) {
    if (Number(cession.changeId || 0) === changeId && Number(cession.overwritten || 0) === 0) {
      temporaryByKey[keyOf(cession)] = cession;
    }
  });
  const templates = currentCessions.filter(function (cession) {
    return Number(cession.changeId || 0) !== changeId;
  });
  if (!templates.length && !Object.keys(temporaryByKey).length) {
    throw 'No existe una cesion base para preparar el reaseguro del endoso';
  }

  const prepareStatements = ['SET XACT_ABORT ON;', 'BEGIN TRANSACTION;'];
  const preparedKeys = Object.keys(requestedByKey);
  preparedKeys.forEach(function (key, index) {
    const requested = requestedByKey[key];
    const existing = temporaryByKey[key];
    const template = existing || templates.find(function (cession) {
      return txt(cession.coverageCode) === txt(requested.coverageCode);
    }) || templates[0] || currentCessions[0];
    if (!template) throw 'No existe plantilla de cesion para ' + key;

    const overrides = {
      contractId: requested.contractId,
      lineId: requested.lineId,
      coverageCode: requested.coverageCode,
      sumInsuredCedant: money(requested.sumInsuredCedant),
      premiumCedant: money(requested.premiumCedant),
      sumInsuredRe: money(requested.sumInsuredRe),
      premiumRe: money(requested.premiumRe),
      comissionCedant: money(requested.commission),
      participantCommission: money(requested.commission),
      tax: money(requested.tax),
      proportionCed: requested.proportionCed,
      proportionRe: requested.proportionRe,
      changeId: changeId,
      overwritten: 0
    };
    let cessionId;
    if (existing) {
      cessionId = Number(existing.id);
      prepareStatements.push('UPDATE Cession SET '
        + 'contractId = ' + sqlValue(overrides.contractId) + ', lineId = ' + sqlValue(overrides.lineId) + ', '
        + 'coverageCode = ' + sqlValue(overrides.coverageCode) + ', sumInsuredCedant = ' + sqlValue(overrides.sumInsuredCedant) + ', '
        + 'premiumCedant = ' + sqlValue(overrides.premiumCedant) + ', sumInsuredRe = ' + sqlValue(overrides.sumInsuredRe) + ', '
        + 'premiumRe = ' + sqlValue(overrides.premiumRe) + ', comissionCedant = ' + sqlValue(overrides.comissionCedant) + ', '
        + 'tax = ' + sqlValue(overrides.tax)
        + (overrides.proportionCed === undefined ? '' : ', proportionCed = ' + sqlValue(overrides.proportionCed))
        + (overrides.proportionRe === undefined ? '' : ', proportionRe = ' + sqlValue(overrides.proportionRe))
        + ' WHERE id = ' + cessionId + ' AND lifePolicyId = ' + policyId + ' AND changeId = ' + changeId + ';');
      prepareStatements.push('DELETE FROM CessionPart WHERE cessionId = ' + cessionId + ';');
    } else {
      const prepared = clone(template);
      Object.keys(overrides).forEach(function (property) {
        if (overrides[property] !== undefined) prepared[property] = overrides[property];
      });
      prepared.id = 0;
      prepared.lifePolicyId = policyId;
      prepared.premium = money(requested.premiumMovement);
      prepared.sumInsured = money(requested.sumInsuredMovement);
      const variable = '@PreparedCession_' + (index + 1);
      prepareStatements.push('DECLARE ' + variable + ' INT;');
      prepareStatements.push(insertSql('Cession', CESSION_COLUMNS, prepared, { overwritten: 0, changeId: changeId }));
      prepareStatements.push('SET ' + variable + ' = SCOPE_IDENTITY();');
      cessionId = variable;
    }
    (partsByKey[key] || []).forEach(function (part) {
      const child = clone(part);
      child.id = 0;
      child.cessionId = cessionId;
      child.lineId = txt(part.lineId || requested.lineId);
      prepareStatements.push(insertSql('CessionPart', CESSION_PART_COLUMNS, child, {
        cessionId: cessionId,
        reserve: child.reserve == null ? 0 : child.reserve,
        fee: child.fee == null ? 0 : child.fee
      }));
    });
  });
  prepareStatements.push('COMMIT TRANSACTION;');
  doCmd({ cmd: 'DoQuery', data: { sql: prepareStatements.join('\n') } });
  if (!DoQuery || DoQuery.ok === false) return { ok: false, stage: 'PREPARE', changeId: changeId, policyId: policyId,
    msg: 'No fue posible preparar el reaseguro del endoso: ' + (DoQuery && DoQuery.msg ? DoQuery.msg : 'error de persistencia') };
  return { ok: true, stage: 'PREPARE', changeId: changeId, policyId: policyId,
    prepared: preparedKeys.length, msg: 'La distribucion temporal del reaseguro fue preparada correctamente.' };
}

// Reintento idempotente: una ejecucion exitosa deja una sola fila vigente por
// clave y todas esas filas quedan asociadas al mismo changeId. En ese caso no
// se debe volver a sumar el movimiento ni generar otra anulacion.
const activeKeys = {};
let alreadyApplied = true;
for (let i = 0; i < currentCessions.length; i++) {
  const active = currentCessions[i];
  const key = keyOf(active);
  if (Number(active.changeId || 0) !== changeId ||
      txt(active.premiumType).toUpperCase() === 'CANCELLATION' || activeKeys[key]) {
    alreadyApplied = false;
    break;
  }
  activeKeys[key] = true;
}
if (alreadyApplied) {
  return {
    ok: true,
    exact: true,
    retry: true,
    stage: 'ALREADY_APPLIED',
    changeId: changeId,
    policyId: policyId,
    created: currentCessions.length,
    msg: 'El reaseguro del endoso ya estaba aplicado; no se duplicaron cesiones ni aceptantes.'
  };
}
// Las filas nativas del mismo endoso no son la base del nuevo reaseguro.
// Se eliminan antes de leer/versionar la configuracion anterior.
const sourceCessions = currentCessions.filter(function (cession) {
  return Number(cession.changeId || 0) !== changeId;
});
if (!sourceCessions.length) throw 'No hay una configuracion anterior vigente para versionar';
const currentIds = sourceCessions.map(function (cession) { return Number(cession.id); }).filter(Boolean);
doCmd({ cmd: 'LoadEntities', data: {
  entity: 'CessionPart',
  filter: 'cessionId IN (' + currentIds.join(',') + ')', noTracking: true
} });
const currentParts = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
const partsByCession = {};
currentParts.forEach(function (part) {
  const id = Number(part.cessionId);
  if (!partsByCession[id]) partsByCession[id] = [];
  partsByCession[id].push(part);
});
const currentByKey = {};
const sourceRank = function (cession) {
  const isCancellation = txt(cession.premiumType).toUpperCase() === 'CANCELLATION';
  const isOriginal = Number(cession.changeId || 0) === 0;
  return (isOriginal ? 2 : 1) + (isCancellation ? -1 : 0);
};
sourceCessions.forEach(function (cession) {
  const key = keyOf(cession);
  const previous = currentByKey[key];
  // Preferimos la fila base a la fila temporal creada por ChangeCoverage.
  if (!previous || sourceRank(cession) > sourceRank(previous)) {
    currentByKey[key] = cession;
  }
});
const baseCessions = Object.keys(currentByKey).map(function (key) { return currentByKey[key]; });

// Construye el estado final completo. Para una fila afectada, premium es el
// total vigente mas el movimiento del endoso; los importes cedente/cedido,
// comision e impuesto son los valores finales confirmados en la vista.
const finalCessions = baseCessions.map(function (source) {
  const result = clone(source);
  result._sourceId = Number(source.id || 0);
  const requested = rowsByKey[keyOf(source)];
  const coverage = coverageByCode[txt(source.coverageCode)];
  if (requested) {
    result.premium = money(num(source.premium) + num(requested.premiumMovement));
    result.sumInsured = money(num(source.sumInsured) + num(requested.sumInsuredMovement));
    result.sumInsuredCedant = money(requested.sumInsuredCedant);
    result.premiumCedant = money(requested.premiumCedant);
    result.sumInsuredRe = money(requested.sumInsuredRe);
    result.premiumRe = money(requested.premiumRe);
    result.comissionCedant = money(requested.commission);
    result.participantCommission = money(requested.commission);
    result.tax = money(requested.tax);
    if (requested.proportionCed !== undefined) result.proportionCed = requested.proportionCed;
    if (requested.proportionRe !== undefined) result.proportionRe = requested.proportionRe;
    if (coverage) {
      result.start = coverage.start || result.start;
      result.end = coverage.end || result.end;
      result.cover = coverage.name || result.cover;
    }
  }
  result.id = 0;
  result.overwritten = 0;
  result.changeId = changeId;
  return result;
});

// La anulacion se registra como una nueva fila historica con signo inverso.
// Las filas originales permanecen intactas para auditoria y tambien se marcan
// como overwritten = 1 junto con cualquier fila temporal del endoso.
const cancellationCessions = baseCessions.map(function (source) {
  const result = clone(source);
  const negative = function (value) { return money(-num(value)); };
  result.id = 0;
  result.premiumType = 'CANCELLATION';
  result.overwritten = 1;
  result.changeId = changeId;
  result.sumInsured = negative(source.sumInsured);
  result.premium = negative(source.premium);
  result.sumInsuredCedant = negative(source.sumInsuredCedant);
  result.premiumCedant = negative(source.premiumCedant);
  result.sumInsuredRe = negative(source.sumInsuredRe);
  result.premiumRe = negative(source.premiumRe);
  result.comissionCedant = negative(source.comissionCedant);
  result.participantCommission = negative(source.participantCommission);
  result.tax = negative(source.tax);
  result.nonTechnicalPremium = negative(source.nonTechnicalPremium);
  return result;
});

// Soporta nuevas combinaciones de contrato/linea/cobertura.
requestedRows.forEach(function (requested) {
  const key = keyOf(requested);
  if (currentByKey[key]) return;
  let template = sourceCessions.find(function (cession) {
    return txt(cession.coverageCode) === txt(requested.coverageCode);
  }) || sourceCessions[0];
  const created = clone(template);
  const coverage = coverageByCode[txt(requested.coverageCode)] || {};
  created.id = 0;
  created.contractId = requested.contractId;
  created.lineId = requested.lineId;
  created.coverageCode = requested.coverageCode;
  created.coverageId = coverage.id || created.coverageId;
  created.cover = coverage.name || created.cover;
  created.start = coverage.start || created.start;
  created.end = coverage.end || created.end;
  created.sumInsured = money(requested.sumInsuredMovement);
  created.premium = money(requested.premiumMovement);
  created.sumInsuredCedant = money(requested.sumInsuredCedant);
  created.premiumCedant = money(requested.premiumCedant);
  created.sumInsuredRe = money(requested.sumInsuredRe);
  created.premiumRe = money(requested.premiumRe);
  created.comissionCedant = money(requested.commission);
  created.participantCommission = money(requested.commission);
  created.tax = money(requested.tax);
  created.overwritten = 0;
  created.changeId = changeId;
  finalCessions.push(created);
});

const finalParts = [];
const cancellationParts = [];
cancellationCessions.forEach(function (cession, index) {
  const source = baseCessions[index];
  (partsByCession[Number(source.id)] || []).forEach(function (part) {
    const child = clone(part);
    const negative = function (value) { return money(-num(value)); };
    child.id = 0;
    child.cessionId = 0;
    child.sumInsured = negative(part.sumInsured);
    child.premium = negative(part.premium);
    child.commission = negative(part.commission);
    child.tax = negative(part.tax);
    cancellationParts.push({ cession: cession, part: child });
  });
});
finalCessions.forEach(function (cession) {
  const key = keyOf(cession);
  const requested = rowsByKey[key];
  const configuredParts = partsByKey[key] || [];
  if (requested || configuredParts.length) {
    // El snapshot confirmado es la fuente principal. Si por compatibilidad
    // una vista anterior no guardo las partes, se usa la configuracion base.
    const fallbackParts = partsByCession[Number(cession._sourceId || 0)] || [];
    const parts = configuredParts.length ? configuredParts : fallbackParts;
    parts.forEach(function (part) {
      const child = clone(part);
      child.id = 0;
      child.cessionId = 0;
      child.lineId = txt(part.lineId || cession.lineId);
      finalParts.push({ cession: cession, part: child });
    });
  } else {
    (partsByCession[Number(cession._sourceId || cession.id)] || []).forEach(function (part) {
      const child = clone(part);
      child.id = 0;
      child.cessionId = 0;
      finalParts.push({ cession: cession, part: child });
    });
  }
});

// Versionado atomico: primero se anulan las versiones vigentes y luego se
// inserta una nueva fotografia con nuevos identificadores.
const statements = ['BEGIN TRANSACTION;'];
if (requestedCoinsurance.length) {
  statements.push('UPDATE CoCession SET overwritten = 1 WHERE lifePolicyId = ' + policyId
    + ' AND parentCoCession IS NULL AND overwritten = 0;');
  requestedCoinsurance.forEach(function (cession, index) {
    const source = coinsuranceSources[index];
    const next = clone(source);
    next.lifePolicyId = policyId;
    next.contactId = Number(cession.contactId || next.contactId || 0);
    next.sumInsured = money(cession.sumInsured);
    next.premium = money(cession.premium);
    next.sumInsuredCeded = money(cession.sumInsuredCeded);
    next.premiumCeded = money(cession.premiumCeded);
    next.commission = money(cession.commission);
    next.tax = money(cession.tax);
    next.changeId = changeId;
    next.overwritten = 0;
    statements.push(insertSql('CoCession', COCESSION_COLUMNS, next));
  });
}
statements.push('DELETE FROM CessionPart WHERE cessionId IN (SELECT id FROM Cession WHERE lifePolicyId = ' + policyId + ' AND changeId = ' + changeId + ');');
statements.push('DELETE FROM Cession WHERE lifePolicyId = ' + policyId + ' AND changeId = ' + changeId + ';');
statements.push('UPDATE Cession SET overwritten = 1 WHERE lifePolicyId = ' + policyId + ' AND overwritten = 0 AND (changeId IS NULL OR changeId <> ' + changeId + ');');
const cessionsToInsert = cancellationCessions.concat(finalCessions);
cessionsToInsert.forEach(function (cession, index) {
  const variable = '@NewCession_' + (index + 1);
  statements.push('DECLARE ' + variable + ' INT;');
  const isCancellation = txt(cession.premiumType).toUpperCase() === 'CANCELLATION';
  statements.push(insertSql('Cession', CESSION_COLUMNS, cession, {
  overwritten: isCancellation ? 1 : 0,
    changeId: changeId
  }));
  statements.push('SET ' + variable + ' = SCOPE_IDENTITY();');
  cancellationParts.concat(finalParts).filter(function (entry) { return entry.cession === cession; }).forEach(function (entry) {
    statements.push(insertSql('CessionPart', CESSION_PART_COLUMNS, entry.part, {
      cessionId: variable,
      // La columna es obligatoria aunque el snapshot no la incluya.
      reserve: entry.part.reserve == null ? 0 : entry.part.reserve,
      fee: entry.part.fee == null ? 0 : entry.part.fee
    }));
  });
});
statements.push('COMMIT TRANSACTION;');

doCmd({ cmd: 'DoQuery', data: { sql: statements.join('\n') } });
if (!DoQuery || DoQuery.ok === false) {
  return { ok: false, stage: 'PERSISTENCE', changeId: changeId, policyId: policyId,
    msg: 'No fue posible versionar el reaseguro: ' + (DoQuery && DoQuery.msg ? DoQuery.msg : 'error de persistencia') };
}

if (requestedCoinsurance.length) {
  doCmd({ cmd: 'LoadEntities', data: {
    entity: 'CoCession',
    filter: 'lifePolicyId = ' + policyId + ' AND parentCoCession IS NULL AND overwritten = 0',
    noTracking: true
  } });
  const activeCoinsurance = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
  const invalidActiveCoinsurance = activeCoinsurance.filter(function (cession) {
    return Number(cession.changeId) !== changeId;
  });
  if (activeCoinsurance.length !== requestedCoinsurance.length || invalidActiveCoinsurance.length) {
    return { ok: false, stage: 'VERIFY_COINSURANCE', changeId: changeId, policyId: policyId,
      active: activeCoinsurance.length, expected: requestedCoinsurance.length,
      previousActive: invalidActiveCoinsurance.length,
      msg: 'El coaseguro no quedo versionado completamente' };
  }
}

doCmd({ cmd: 'LoadEntities', data: {
  entity: 'Cession', filter: 'lifePolicyId = ' + policyId + ' AND overwritten = 0', noTracking: true
} });
const activeAfter = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
const invalidActive = activeAfter.filter(function (cession) { return Number(cession.changeId) !== changeId; });
if (!activeAfter.length || invalidActive.length) {
  return { ok: false, stage: 'VERIFY', changeId: changeId, policyId: policyId,
    active: activeAfter.length, previousActive: invalidActive.length,
    msg: 'El reaseguro no quedo versionado completamente' };
}

return {
  ok: true, exact: true, stage: 'APPLIED', changeId: changeId, policyId: policyId,
  overwritten: currentCessions.length, created: finalCessions.length,
  cancellationsCreated: cancellationCessions.length,
  participantsCreated: finalParts.length,
  coinsuranceUpdated: requestedCoinsurance.length,
  coinsuranceVersioned: requestedCoinsurance.length,
  msg: 'El reaseguro final fue versionado correctamente: ' + cancellationCessions.length +
    ' anulaciones historicas, ' + finalCessions.length + ' nuevas cesiones vigentes y ' +
    requestedCoinsurance.length + ' coaseguradores versionados.'
};
