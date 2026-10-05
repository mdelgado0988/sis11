//block
//noreplace
/*
 * @name cmdUpdateInsuredObjectData
 * @version 1.0
 * @Purpose Sync the insured-object hidden coverage grid (OA_FIANZASV3 for surety
 *          and DT_RAMO_TECNICO for technical lines, field hiddenCobtar) with the
 *          coverage dates actually applied to the policy.
 *          AXX-214 / GLOB-1221, ProceedOrderEndorsement v1.0 section 3.3.
 * @Input  { policyId, syncDays?, syncSums? }  syncDays actualiza 'Duración Días' con la
 *         diferencia entre las fechas de inicio y fin, y
 *         syncSums actualiza la suma afianzada y las sumas existentes en hiddenCobtar para Fianzas.
 * @Output { ok, msg, outData: { insuredObjectId, updated, rows } }
 *
 * Reads the dates from the POLICY (post-execution truth), not from the caller, so the grid
 * can never drift from what ChangeTerm actually applied.
 * Preserves the existing JSON structure, the array-wrapped string storage and the existing
 * date format. Never introduces keys that were not already there.
 */

const formIdFianza = 574;
const keyStart = 'F. Inicial';
const keyEnd = 'F. Final';
const keyDays = 'Duración Días';
const syncDays = !!(context && context.syncDays);
const syncSums = !!(context && context.syncSums);

const policyId = context && context.policyId ? Number(context.policyId) : 0;
if (!policyId) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: falta policyId en el contexto' };
}

var requestedCoverages = [];
try {
  const rawCoverages = context && (context.jNewCoverages || context.coverages);
  requestedCoverages = Array.isArray(rawCoverages)
    ? rawCoverages
    : (rawCoverages ? JSON.parse(String(rawCoverages)) : []);
  if (!Array.isArray(requestedCoverages)) requestedCoverages = [];
} catch (e) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: las coberturas finales del endoso no son JSON valido' };
}

const pad = function (n) { return n < 10 ? '0' + n : String(n); };
const ymd = function (v) {
  if (!v) return null;
  var s = String(v);
  if (s.length >= 10 && s.charAt(4) === '-' && s.charAt(7) === '-') return s.substring(0, 10);
  var d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
};

// 1. the policy and the dates that were actually applied
doCmd({ cmd: 'RepoLifePolicy', data: { operation: 'GET', filter: 'id=' + policyId, include: ['Coverages'] } });
if (!RepoLifePolicy || !RepoLifePolicy.ok) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: no se pudo leer la poliza ' + policyId + ' - ' + ((RepoLifePolicy && RepoLifePolicy.msg) || 'sin respuesta') };
}
const policy = (RepoLifePolicy.outData || [])[0];
if (!policy) return { ok: false, msg: 'cmdUpdateInsuredObjectData: poliza ' + policyId + ' no encontrada' };

const isTechnicalPolicy = ['96', '52'].indexOf(String(policy.lob == null ? '' : policy.lob).trim()) >= 0;
const isSuretyPolicy = ['81', '82', '83', '84'].indexOf(String(policy.lob == null ? '' : policy.lob).trim()) >= 0;
const objectDefinitionCode = isTechnicalPolicy ? 'DT_RAMO_TECNICO' : 'OBJFIANZA';

const byCode = {};
(policy.Coverages || []).forEach(function (c) { byCode[String(c.code).trim()] = c; });

// The endoso has already been applied at this point, so policy.Coverages holds
// the final sum (previous amount plus the endorsed movement).
const coverageSums = {};
let insuredBondSum = null;
if (syncSums && isSuretyPolicy) {
  doCmd({ cmd: 'GetFullTable', data: { table: 'cfgCoberturaProductoReaFianza' } });
  if (!GetFullTable || !GetFullTable.ok) {
    return { ok: false, msg: 'cmdUpdateInsuredObjectData: no se pudo leer la configuración de coberturas de fianza - ' + ((GetFullTable && GetFullTable.msg) || 'sin respuesta') };
  }

  const configRows = GetFullTable.outData || [];
  const headers = Array.isArray(configRows[0]) ? configRows[0] : [];
  const normalizeHeader = function (value) {
    return String(value == null ? '' : value)
      .trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };
  const findColumn = function (names, fallback) {
    const expected = names.map(normalizeHeader);
    const index = headers.findIndex(function (header) {
      return expected.indexOf(normalizeHeader(header)) >= 0;
    });
    return index >= 0 ? index : fallback;
  };
  const productIndex = findColumn(['productCode', 'codigoProducto', 'producto'], 1);
  const coverageIndex = findColumn(['coverageCode', 'codigoCobertura', 'cobertura'], 3);
  const isCoverageIndex = findColumn(['isCoverage', 'suma', 'sumaAsegurada'], 5);
  const productCode = String(policy.productCode == null ? '' : policy.productCode).trim();

  for (let i = 1; i < configRows.length; i++) {
    const row = configRows[i] || [];
    if (String(row[productIndex] == null ? '' : row[productIndex]).trim() !== productCode) continue;
    if (String(row[isCoverageIndex] == null ? '' : row[isCoverageIndex]).trim().toUpperCase() !== 'SI') continue;
    const code = String(row[coverageIndex] == null ? '' : row[coverageIndex]).trim();
    const coverage = byCode[code];
    if (!coverage) continue;
    const finalSum = Number(coverage.limit || 0);
    if (!Number.isFinite(finalSum)) continue;
    coverageSums[code] = finalSum;
  }

  const configuredSums = Object.keys(coverageSums);
  if (configuredSums.length) {
    insuredBondSum = configuredSums.reduce(function (total, code) {
      return total + Number(coverageSums[code] || 0);
    }, 0);
  }
}

// ChangeCoverage may leave the final dates only in the endorsement payload.
// Persist them explicitly so the technical flow behaves like the surety flow.
const finalById = {};
const finalByCode = {};
requestedCoverages.forEach(function (c) {
  if (!c) return;
  const id = Number(c.id || 0);
  const code = String(c.code == null ? '' : c.code).trim();
  if (id > 0) finalById[id] = c;
  if (code) finalByCode[code] = c;
});

const coverageUpdates = [];
(policy.Coverages || []).forEach(function (current) {
  const requested = finalById[Number(current.id)] || finalByCode[String(current.code).trim()];
  if (!requested) return;
  const start = ymd(requested.start);
  const end = ymd(requested.end);
  if (!start || !end) return;
  const currentStart = ymd(current.start);
  const currentEnd = ymd(current.end);
  if (currentStart === start && currentEnd === end) return;
  coverageUpdates.push({ id: Number(current.id), start: start, end: end });
});

for (let i = 0; i < coverageUpdates.length; i++) {
  const update = coverageUpdates[i];
  doCmd({
    cmd: 'SetField',
    data: {
      entity: 'LifeCoverage',
      entityId: update.id,
      fieldValue: "start='" + update.start + "', [end]='" + update.end + "'",
      raw: true
    }
  });
  if (!SetField || !SetField.ok) {
    return { ok: false, msg: 'cmdUpdateInsuredObjectData: fallo al actualizar la vigencia de la cobertura ' + update.id + ' - ' + ((SetField && SetField.msg) || 'sin respuesta') };
  }
  const coverage = (policy.Coverages || []).filter(function (c) { return Number(c.id) === update.id; })[0];
  if (coverage) {
    coverage.start = update.start;
    coverage.end = update.end;
  }
}

// 2. the insured object used by the policy form.
// Read it WITHOUT the repository GET on purpose: that GET makes EF track the entity, and the
// UPDATE below then fails with 'another instance with the same key value is already being
// tracked'. A read-only projection keeps the change tracker clean for the write.
const objectDefinitionFilter = isTechnicalPolicy
  ? "od.code = '" + objectDefinitionCode + "'"
  : 'od.formId = ' + formIdFianza;
doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT TOP 1 io.id, io.objectDefinitionId, io.lifePolicyId, io.jValues, io.jMap, io.jFileUpload, io.alias, io.jDetailList FROM InsuredObject io JOIN ObjectDefinition od ON od.id = io.objectDefinitionId WHERE io.lifePolicyId = ' + policyId + ' AND ' + objectDefinitionFilter, timeout: 60 } });
if (!DoQuery || !DoQuery.ok) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: no se pudo leer el objeto asegurado - ' + ((DoQuery && DoQuery.msg) || 'sin respuesta') };
}
const target = (DoQuery.outData || [])[0];
if (!target) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: la poliza ' + policyId + ' no tiene objeto asegurado para ' + objectDefinitionCode };
}

// 3. the hiddenCobtar field, inside jValues
var fields;
try { fields = JSON.parse(target.jValues || '[]'); } catch (e) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: jValues del objeto ' + target.id + ' no es JSON valido' };
}
const field = fields.filter(function (f) { return f && f.name === 'hiddenCobtar'; })[0];
if (!field) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: el objeto ' + target.id + ' no tiene el campo hiddenCobtar' };
}

// storage format: userData is an array whose first element is the JSON string. Keep it.
const wasArray = Array.isArray(field.userData);
const raw = wasArray ? field.userData[0] : field.userData;
if (raw === undefined || raw === null || String(raw).trim() === '') {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: hiddenCobtar esta vacio en el objeto ' + target.id + ' - no hay grilla que sincronizar' };
}
var grid;
try { grid = JSON.parse(String(raw)); } catch (e) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: hiddenCobtar del objeto ' + target.id + ' no es JSON valido' };
}
if (!Array.isArray(grid) || !grid.length) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: hiddenCobtar del objeto ' + target.id + ' no es una lista de coberturas' };
}

// 4. the date and sum keys must ALREADY exist - we never introduce a format that was not there
const hasDates = grid.filter(function (row) {
  return row && Object.prototype.hasOwnProperty.call(row, keyStart) && Object.prototype.hasOwnProperty.call(row, keyEnd);
}).length;
if (!hasDates && !(syncSums && isSuretyPolicy && insuredBondSum !== null)) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: hiddenCobtar del objeto ' + target.id + ' no tiene las columnas "' + keyStart + '" / "' + keyEnd + '", asi que no hay fechas que actualizar sin inventar un formato nuevo' };
}

// 5. update in place, preserving every other key
var updated = 0;
var missing = [];
const detail = [];
var updatedSumRows = 0;
const isSumField = function (key) {
  const normalized = String(key == null ? '' : key)
    .trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.]/g, '')
    .replace(/\s+/g, ' ');
  return ['sa', 'suma', 'suma asegurada'].indexOf(normalized) >= 0;
};
grid.forEach(function (row) {
  if (!row) return;
  var code = String(row.coverageCode == null ? '' : row.coverageCode).trim();
  var cov = byCode[code];
  var rowUpdated = false;
  var detailRow = { coverageCode: code };

  if (Object.prototype.hasOwnProperty.call(row, keyStart) && Object.prototype.hasOwnProperty.call(row, keyEnd)) {
    if (!cov) {
      missing.push(code);
    } else {
      var s = ymd(cov.start), e = ymd(cov.end);
      if (!s || !e) {
        missing.push(code);
      } else {
        detailRow.from = row[keyStart] + '..' + row[keyEnd];
        detailRow.to = s + '..' + e;
        row[keyStart] = s;
        row[keyEnd] = e;
        if (syncDays && Object.prototype.hasOwnProperty.call(row, keyDays)) {
          row[keyDays] = Math.round((Date.parse(e + 'T00:00:00Z') - Date.parse(s + 'T00:00:00Z')) / 86400000);
        }
        rowUpdated = true;
      }
    }
  }

  if (syncSums && Object.prototype.hasOwnProperty.call(coverageSums, code)) {
    const sumFields = Object.keys(row).filter(isSumField);
    if (sumFields.length) {
      sumFields.forEach(function (fieldName) { row[fieldName] = coverageSums[code]; });
      detailRow.sum = coverageSums[code];
      updatedSumRows++;
      rowUpdated = true;
    }
  }

  if (rowUpdated) {
    detail.push(detailRow);
    updated++;
  }
});
let updatedBondSum = false;
if (syncSums && isSuretyPolicy && insuredBondSum !== null) {
  const bondSumField = fields.filter(function (item) {
    return item && String(item.name == null ? '' : item.name).trim().toLowerCase() === 'suma_afianzada';
  })[0];
  if (bondSumField) {
    if (Array.isArray(bondSumField.userData)) {
      bondSumField.userData = [String(insuredBondSum)];
    } else {
      bondSumField.userData = String(insuredBondSum);
    }
    updatedBondSum = true;
  }
}
if (!updated && !updatedBondSum) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: ninguna fila de hiddenCobtar ni la suma afianzada pudieron sincronizarse con la poliza (codigos sin correspondencia: ' + missing.join(', ') + ')' };
}

// 6. put it back in exactly the same shape and persist the WHOLE object
const serialized = JSON.stringify(grid);
if (wasArray) { field.userData = [serialized]; } else { field.userData = serialized; }
const entity = {
  id: target.id,
  objectDefinitionId: target.objectDefinitionId,
  lifePolicyId: target.lifePolicyId,
  jValues: JSON.stringify(fields),
  jMap: target.jMap,
  jFileUpload: target.jFileUpload,
  alias: target.alias,
  jDetailList: target.jDetailList
};
doCmd({ cmd: 'RepoInsuredObject', data: { operation: 'UPDATE', entity: entity } });
if (!RepoInsuredObject || !RepoInsuredObject.ok) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: fallo al guardar el objeto asegurado ' + target.id + ' - ' + ((RepoInsuredObject && RepoInsuredObject.msg) || 'sin respuesta') };
}

return {
  ok: true,
  msg: 'hiddenCobtar sincronizado: ' + updated + ' cobertura(s) actualizada(s) en el objeto asegurado ' + target.id
    + (updatedBondSum ? '; suma afianzada actualizada a ' + insuredBondSum : '')
    + (missing.length ? ' (sin correspondencia: ' + missing.join(', ') + ')' : ''),
  outData: {
    insuredObjectId: target.id,
    updated: updated,
    updatedSumRows: updatedSumRows,
    insuredBondSum: updatedBondSum ? insuredBondSum : null,
    unmatched: missing,
    rows: detail
  }
};
