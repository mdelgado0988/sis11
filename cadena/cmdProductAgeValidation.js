//block
//noreplace

/*
  *@name: cmdProductAgeValidation
  *@Purpose: Valida la edad del asegurado contra la edad de admisión / cancelación configurada por producto (cfgEdadesAdmisionProducto)
  *@Autor: AIDEN (MSN-000021)
  *@Created: 23/09/2026
  *@Input: {policyId, policy?}  policy = póliza en memoria (opcional; la cotización la envía para validar lo que está en pantalla)
  *@Output: { ok, applies, productCode, policyVersion, ageType, age, limit, excede, msg }
  *@Rules: policyVersion 0 o null -> admissionAge ; policyVersion > 0 -> cancellationAge ; bloquea si edad > límite
*/

const OBJECT_CODE = "DT_ACCIDENTES_V1";
const AGE_FIELD = "txtEdadSuscripcion";
const CONFIG_TABLE = "cfgEdadesAdmisionProducto";

const policyId = context.policyId;
let policy;
let config;
let ages = [];

try {

  if (!policyId && !context.policy)
    throw new Error("Debe indicar policyId");

  setPolicy();
  setConfig();

  const version = Number(policy.policyVersion ?? 0) || 0;
  const ageType = version > 0 ? "cancellationAge" : "admissionAge";
  const result = { ok: true, applies: false, productCode: policy.productCode, policyVersion: policy.policyVersion ?? null, ageType: ageType, age: null, limit: null, excede: false, msg: "" };

  if (!config) {
    result.msg = `El producto ${policy.productCode} no tiene edades configuradas en ${CONFIG_TABLE}`;
    return result;
  }

  const limit = d(config[ageType]);
  result.limit = limit;

  setAges();
  if (ages.length == 0) {
    result.msg = `No se encontró la edad (${AGE_FIELD}) en el objeto asegurado ${OBJECT_CODE}`;
    return result;
  }

  const age = Math.max(...ages);
  result.applies = true;
  result.age = age;
  result.excede = age > limit;
  result.ok = !result.excede;
  result.msg = result.excede
    ? `La edad del asegurado (${age}) supera la edad de ${version > 0 ? "cancelación" : "admisión"} permitida para el producto ${policy.productCode} (${limit})`
    : `Edad del asegurado (${age}) dentro de la edad de ${version > 0 ? "cancelación" : "admisión"} permitida (${limit})`;

  return result;

} catch (error) {
  throw `@cmdProductAgeValidation: ${error.toString()}`;
}

function setPolicy() {
  const inMemory = context.policy ? (typeof context.policy === "string" ? JSON.parse(context.policy) : context.policy) : null;

  if (inMemory && inMemory.productCode) {
    policy = inMemory;
    return;
  }

  doCmd({ cmd: "LoadEntity", data: { entity: "LifePolicy", fields: "id, productCode, policyVersion", filter: `id = ${Number(policyId)}` } });
  policy = LoadEntity.outData;
  if (!policy)
    throw new Error(`No se encontró la póliza ${policyId}`);
}

function setConfig() {
  doCmd({ cmd: "GetFullTable", data: { table: CONFIG_TABLE } });
  if (!GetFullTable.ok)
    throw new Error(`Error leyendo la tabla ${CONFIG_TABLE}`);

  config = mapearTablaConfig(GetFullTable.outData ?? []).find(x => x.productCode == policy.productCode);
}

function setAges() {
  doCmd({ cmd: "LoadEntity", data: { entity: "ObjectDefinition", fields: "id", filter: `code = '${OBJECT_CODE}'` } });
  const objectDefinitionId = LoadEntity.outData?.id;
  if (!objectDefinitionId) return;

  let objects = Array.isArray(policy.InsuredObjects) ? policy.InsuredObjects : null;
  if (!objects) {
    doCmd({ cmd: "LoadEntities", data: { entity: "InsuredObject", fields: "objectDefinitionId, jValues", filter: `lifePolicyId = ${Number(policy.id ?? policyId)} AND objectDefinitionId = ${objectDefinitionId}` } });
    objects = LoadEntities.outData ?? [];
  }

  objects
    .filter(o => o.objectDefinitionId == objectDefinitionId)
    .forEach(o => {
      const fields = typeof o.jValues === "string" ? JSON.parse(o.jValues || "[]") : (o.jValues || []);
      const field = fields.find(f => f && f.name == AGE_FIELD);
      const value = field?.userData?.[0];
      if (value !== null && value !== undefined && String(value).trim() !== "") ages.push(d(value));
    });
}

function mapearTablaConfig(data) {
  if (!data || !data.length) return [];
  const headers = data[0].map(h => String(h).trim());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function d(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const num = Number(String(value).replace(/,/g, '').trim());
  return isNaN(num) ? 0 : num;
}
