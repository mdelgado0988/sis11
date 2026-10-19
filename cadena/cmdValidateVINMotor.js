//block
//noreplace

/*
  *@name: cmdValidateVINMotor
  *@Purpose: Valida que el VIN del vehículo de una póliza de auto (ramo 6) no esté asegurado en otra póliza emitida, activa y vigente en el mismo período
  *@Autor: AIDEN (MSN-000081)
  *@Created: 18/10/2026
  *@Input: {policyId, policy?}  policy = póliza en memoria (opcional; la cotización la envía para validar lo que está en pantalla)
  *@Output: { ok, exists, vin, vins, noVin, vinMissing, policyId, start, end, policies:[{id, code, productCode, start, end, vin}], msg }
  *@Rules:
  *  - VIN = campo tbVIN del objeto asegurado DTAUT; se compara en mayúsculas, sin espacios ni guiones.
  *  - VIN vacío: ok = false (VIN obligatorio), salvo que el vehículo esté marcado «¿No Tiene VIN?» = Si; en ese caso no se busca duplicidad.
  *  - Póliza en conflicto: otra póliza emitida (activeDate no nulo), activa (active = 1), con el mismo VIN y cuya vigencia se cruza
  *    con la de la póliza validada, por día calendario de Panamá: inicio < fin de la validada y fin > inicio de la validada
  *    (una póliza que termina el mismo día en que empieza la validada no cuenta; sin fecha de fin = vigencia abierta).
  *  - Se excluyen la propia póliza, la póliza indicada en su originalPolicyId (la que renueva) y las pólizas cuyo originalPolicyId
  *    es la póliza validada (su propia renovación).
  *  - exists = true si existe al menos una póliza en conflicto; ok = VIN presente (o «¿No Tiene VIN?» = Si) y exists = false.
  *  - Fechas del mensaje en hora local de Panamá (UTC-5, sin horario de verano), como el resto de las validaciones del ambiente.
*/

const OBJECT_CODE = "DTAUT";
const VIN_FIELD = "tbVIN";
const NO_VIN_FIELD = "cmbNoTieneVIN";
const MAX_POLICIES = 5;

try {

  const input = context || {};
  const policyId = Number(input.policyId || 0);
  const inMemory = input.policy ? (typeof input.policy === "string" ? JSON.parse(input.policy) : input.policy) : null;

  if (!policyId && !(inMemory && inMemory.productCode))
    throw new Error("Debe indicar policyId");

  const policy = getPolicy(policyId, inMemory);
  const objectDefinitionId = getObjectDefinitionId();
  const vehicles = getVehicles(policy, inMemory, objectDefinitionId);

  const result = { ok: true, exists: false, vin: "", vins: [], noVin: false, vinMissing: false, policyId: policy.id || null, start: panamaDate(policy.start), end: panamaDate(policy.end), policies: [], msg: "" };

  const missing = vehicles.filter(v => !v.vin && !v.noVin);
  if (vehicles.length == 0 || missing.length > 0) {
    result.ok = false;
    result.vinMissing = true;
    result.msg = "El número VIN del vehículo es obligatorio: regístrelo en los Datos Técnicos del vehículo o marque «¿No Tiene VIN?» = Si.";
    return result;
  }

  const vins = [...new Set(vehicles.filter(v => v.vin).map(v => v.vin))];
  result.vins = vins;
  result.vin = vins[0] || "";
  if (vins.length == 0) {
    result.noVin = true;
    result.msg = "El vehículo está marcado «¿No Tiene VIN?» = Si: no se valida duplicidad de VIN.";
    return result;
  }

  const rows = findConflicts(policy, objectDefinitionId, vins);
  result.policies = rows.map(r => ({ id: r.id, code: r.code, productCode: r.productCode, start: panamaDate(r.startUtc), end: panamaDate(r.endUtc), vin: r.vin }));
  result.exists = rows.length > 0;
  result.ok = !result.exists;
  result.msg = result.exists
    ? describeConflicts(result.policies)
    : `El VIN ${vins.join(", ")} no está asegurado en otra póliza emitida y vigente en el período de la póliza.`;

  return result;

} catch (error) {
  throw `@cmdValidateVINMotor: ${error.toString()}`;
}

function getPolicy(policyId, inMemory) {
  if (inMemory && inMemory.productCode) {
    return {
      id: Number(inMemory.id || policyId || 0),
      code: inMemory.code || "",
      productCode: inMemory.productCode,
      start: utcKey(inMemory.start),
      end: utcKey(inMemory.end),
      originalPolicyId: Number(inMemory.originalPolicyId || 0)
    };
  }

  doCmd({ cmd: "DoQuery", data: { sql: `SELECT id, code, productCode, CONVERT(varchar(19), start, 126) startUtc, CONVERT(varchar(19), [end], 126) endUtc, originalPolicyId FROM LifePolicy WHERE id = ${Number(policyId)}` } });
  if (!DoQuery.ok)
    throw new Error(`Error leyendo la póliza ${policyId}: ${DoQuery.msg}`);
  const row = (DoQuery.outData || [])[0];
  if (!row)
    throw new Error(`No se encontró la póliza ${policyId}`);

  return { id: Number(row.id), code: row.code || "", productCode: row.productCode, start: utcKey(row.startUtc), end: utcKey(row.endUtc), originalPolicyId: Number(row.originalPolicyId || 0) };
}

function getObjectDefinitionId() {
  doCmd({ cmd: "LoadEntity", data: { entity: "ObjectDefinition", fields: "id", filter: `code = '${OBJECT_CODE}'` } });
  const id = Number(LoadEntity.outData?.id || 0);
  if (!id)
    throw new Error(`No existe el objeto asegurado ${OBJECT_CODE}`);
  return id;
}

function getVehicles(policy, inMemory, objectDefinitionId) {
  let objects = inMemory && Array.isArray(inMemory.InsuredObjects) ? inMemory.InsuredObjects.filter(o => o && o.objectDefinitionId == objectDefinitionId) : [];
  if (objects.length == 0 && policy.id > 0) {
    doCmd({ cmd: "LoadEntities", data: { entity: "InsuredObject", fields: "objectDefinitionId, jValues", filter: `lifePolicyId = ${policy.id} AND objectDefinitionId = ${objectDefinitionId}` } });
    if (!LoadEntities.ok)
      throw new Error(`Error leyendo los objetos asegurados de la póliza ${policy.id}: ${LoadEntities.msg}`);
    objects = LoadEntities.outData || [];
  }

  return objects.map(o => {
    const fields = typeof o.jValues === "string" ? JSON.parse(o.jValues || "[]") : (o.jValues || []);
    return { vin: normalizeVin(fieldValue(fields, VIN_FIELD)), noVin: String(fieldValue(fields, NO_VIN_FIELD)).trim().toLowerCase() == "si" };
  });
}

function findConflicts(policy, objectDefinitionId, vins) {
  const norm = x => `UPPER(REPLACE(REPLACE(LTRIM(RTRIM(${x})), ' ', ''), '-', ''))`;
  const vinExpr = norm("COALESCE(JSON_VALUE(f.value, '$.userData[0]'), JSON_VALUE(f.value, '$.value'))");
  const list = vins.map(v => `'${v.replace(/'/g, "''")}'`).join(", ");

  const localDay = col => `CAST(DATEADD(hour, -5, ${col}) AS date)`;
  const startDay = panamaDay(policy.start);
  const endDay = panamaDay(policy.end);
  const where = ["p.activeDate IS NOT NULL", "p.active = 1"];
  where.push(`(p.[end] IS NULL OR ${localDay("p.[end]")} > ${startDay ? `'${startDay}'` : localDay("GETUTCDATE()")})`);
  if (endDay) where.push(`${localDay("p.start")} < '${endDay}'`);
  if (policy.id > 0) where.push(`p.id <> ${policy.id}`, `(p.originalPolicyId IS NULL OR p.originalPolicyId <> ${policy.id})`);
  if (policy.originalPolicyId > 0) where.push(`p.id <> ${policy.originalPolicyId}`);

  const sql = `SELECT TOP ${MAX_POLICIES} l.id, l.code, l.productCode, CONVERT(varchar(19), l.start, 126) startUtc, CONVERT(varchar(19), l.[end], 126) endUtc, x.vin `
    + `FROM (SELECT p.id, p.code, p.productCode, p.start, p.[end] FROM LifePolicy p WHERE ${where.join(" AND ")}) l `
    + `CROSS APPLY (SELECT TOP 1 ${vinExpr} vin FROM InsuredObject io CROSS APPLY OPENJSON(CASE WHEN ISJSON(io.jValues) = 1 THEN io.jValues ELSE '[]' END) f `
    + `WHERE io.lifePolicyId = l.id AND io.objectDefinitionId = ${objectDefinitionId} AND JSON_VALUE(f.value, '$.name') = '${VIN_FIELD}' AND ${vinExpr} IN (${list})) x `
    + `ORDER BY l.start, l.id`;

  doCmd({ cmd: "DoQuery", data: { sql: sql } });
  if (!DoQuery.ok)
    throw new Error(`Error buscando pólizas con el VIN ${vins.join(", ")}: ${DoQuery.msg}`);
  return DoQuery.outData || [];
}

function describeConflicts(policies) {
  const list = policies.map(p => `${p.code} (vigente del ${p.start} al ${p.end || "sin fecha de fin"})`);
  const vin = [...new Set(policies.map(p => p.vin))].join(", ");
  return policies.length == 1
    ? `El VIN ${vin} ya está asegurado en la póliza ${list[0]}, emitida y activa en el período de esta póliza.`
    : `El VIN ${vin} ya está asegurado en las pólizas ${list.join(", ")}, emitidas y activas en el período de esta póliza.`;
}

function fieldValue(fields, name) {
  const field = (fields || []).find(f => f && f.name == name);
  if (!field) return "";
  const value = Array.isArray(field.userData) && field.userData.length ? field.userData[0] : field.value;
  return value === null || value === undefined ? "" : String(value);
}

function normalizeVin(value) {
  return String(value || "").trim().toUpperCase().replace(/[\s-]/g, "");
}

function utcKey(value) {
  if (value === null || value === undefined || String(value).trim() === "") return "";
  if (value instanceof Date) return isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 19);
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00:00`;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) {
    const parsed = new Date(text);
    return isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 19);
  }
  const m = text.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : "";
}

function panamaDate(key) {
  if (!key) return "";
  const parsed = new Date(`${key}Z`);
  if (isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - 5 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, "0");
  return `${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)}/${local.getUTCFullYear()}`;
}

function panamaDay(key) {
  if (!key) return "";
  const parsed = new Date(`${key}Z`);
  if (isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - 5 * 60 * 60 * 1000);
  const day = local.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}
