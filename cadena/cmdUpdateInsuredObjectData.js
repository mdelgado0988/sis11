//block
//noreplace
/*
 * @name cmdUpdateInsuredObjectData
 * @version 1.0
 * @Purpose Sync the insured-object hidden coverage grid (OA_FIANZASV3 for surety
 *          and DT_RAMO_TECNICO for technical lines, field hiddenCobtar) with the
 *          coverage dates actually applied to the policy.
 *          AXX-214 / GLOB-1221, ProceedOrderEndorsement v1.0 section 3.3.
 * @Input  { policyId, syncDays? }  syncDays (AXX-2420): tambien actualiza 'Duración Días' (inclusive) si la columna existe.
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
const objectDefinitionCode = isTechnicalPolicy ? 'DT_RAMO_TECNICO' : 'OBJFIANZA';

const byCode = {};
(policy.Coverages || []).forEach(function (c) { byCode[String(c.code).trim()] = c; });

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

// 4. the date keys must ALREADY exist - we never introduce a format that was not there
const hasDates = grid.filter(function (row) {
  return row && Object.prototype.hasOwnProperty.call(row, keyStart) && Object.prototype.hasOwnProperty.call(row, keyEnd);
}).length;
if (!hasDates) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: hiddenCobtar del objeto ' + target.id + ' no tiene las columnas "' + keyStart + '" / "' + keyEnd + '", asi que no hay fechas que actualizar sin inventar un formato nuevo' };
}

// 5. update in place, preserving every other key
var updated = 0;
var missing = [];
const detail = [];
grid.forEach(function (row) {
  if (!row || !Object.prototype.hasOwnProperty.call(row, keyStart) || !Object.prototype.hasOwnProperty.call(row, keyEnd)) return;
  var code = String(row.coverageCode == null ? '' : row.coverageCode).trim();
  var cov = byCode[code];
  if (!cov) { missing.push(code); return; }
  var s = ymd(cov.start), e = ymd(cov.end);
  if (!s || !e) { missing.push(code); return; }
  detail.push({ coverageCode: code, from: row[keyStart] + '..' + row[keyEnd], to: s + '..' + e });
  row[keyStart] = s;
  row[keyEnd] = e;
  if (syncDays && Object.prototype.hasOwnProperty.call(row, keyDays)) {
    row[keyDays] = Math.round((Date.parse(e + 'T00:00:00Z') - Date.parse(s + 'T00:00:00Z')) / 86400000) + 1;
  }
  updated++;
});
if (!updated) {
  return { ok: false, msg: 'cmdUpdateInsuredObjectData: ninguna fila de hiddenCobtar pudo casarse con una cobertura de la poliza (codigos sin correspondencia: ' + missing.join(', ') + ')' };
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
  msg: 'hiddenCobtar sincronizado: ' + updated + ' cobertura(s) actualizada(s) en el objeto asegurado ' + target.id + (missing.length ? ' (sin correspondencia: ' + missing.join(', ') + ')' : ''),
  outData: { insuredObjectId: target.id, updated: updated, unmatched: missing, rows: detail }
};
