//block
//noreplace

/**
 * @name cmdFiniquitoAU
 * @purpose Builds the vehicle data required by the automobile settlement document.
 * @context { claimId: number, tipo: 0|1 }
 * @tipo 0: insured vehicle, 1: affected vehicle.
 */

const input = context || {};
const claimId = positiveInteger(input.claimId || input.siniestroId || input.id);
const tipo = Number(input.tipo !== undefined ? input.tipo : input.type);

if (claimId <= 0) throw new Error('claimId es obligatorio y debe ser válido.');
if (tipo !== 0 && tipo !== 1) throw new Error('tipo debe ser 0 para asegurado o 1 para afectado.');

const formName = tipo === 0 ? 'frmOAAutomovilAsegurado' : 'frmOAAutomovil';
const result = {
  claimId: claimId,
  tipo: tipo,
  IdReclamo: claimId,
  CodigoReclamo: '',
  NombreAsegurado: '',
  IdentificacionAsegurado: '',
  NumeroPoliza: '',
  FechaOcurrencia: '',
  FechaActual: '',
  Marca: '',
  Modelo: '',
  Anio: '',
  Placa: '',
  Propietario: '',
  PayoutId: ''
};

doCmd({
  cmd: 'RepoClaim',
  data: {
    operation: 'GET',
    filter: `id = ${claimId}`,
    include: ['Policy']
  }
});

const claim = firstRow(RepoClaim && RepoClaim.outData);
if (!claim) throw new Error(`No se encontró el siniestro ${claimId}.`);
result.CodigoReclamo = stringValue(claim.code || claim.claimCode || claim.number);

const policyId = positiveInteger(
  claim.lifePolicyId
  || claim.policyId
  || (claim.Policy && (claim.Policy.id || claim.Policy.lifePolicyId))
);
if (policyId <= 0) throw new Error(`El siniestro ${claimId} no tiene una póliza asociada.`);

doCmd({
  cmd: 'RepoLifePolicy',
  data: {
    operation: 'GET',
    filter: `id = ${policyId}`,
    include: ['Holder', 'Insureds.Contact', 'InsuredObjects']
  }
});

const policy = firstRow(RepoLifePolicy && RepoLifePolicy.outData);
if (!policy) throw new Error(`No se encontró la póliza ${policyId}.`);

const insured = getPolicyInsured(policy);
result.NombreAsegurado = getContactName(insured);
result.IdentificacionAsegurado = getContactIdentifier(insured);
result.NumeroPoliza = stringValue(policy.code || policy.policyCode || policy.number);
result.FechaOcurrencia = formatOccurrencePanama(claim.occurrence);
result.FechaActual = formatOccurrencePanama(new Date().toISOString());

doCmd({
  cmd: 'RepoLifeCoveragePayout',
  data: {
    operation: 'GET',
    filter: `claimId = ${claimId}`,
    size: 0,
    page: 0
  }
});

const payouts = rows(RepoLifeCoveragePayout && RepoLifeCoveragePayout.outData);
const payoutMatch = payouts
  .map(payout => ({ payout: payout, object: findAffectedObject(payout && payout.jAffectedObjects, formName) }))
  .find(item => item.object);

const vehicleObject = payoutMatch && payoutMatch.object;
const policyVehicleObject = tipo === 0 ? findPolicyObject(policy, formName) : null;

if (vehicleObject || policyVehicleObject) {
  const vehicle = getVehicleValues(vehicleObject);
  const policyVehicle = getVehicleValues(policyVehicleObject);
  result.Marca = vehicle.Marca || policyVehicle.Marca;
  result.Modelo = vehicle.Modelo || policyVehicle.Modelo;
  result.Anio = vehicle.Anio || policyVehicle.Anio;
  result.Placa = vehicle.Placa || policyVehicle.Placa;
  result.Propietario = vehicle.Propietario || policyVehicle.Propietario;
}

if (payoutMatch && payoutMatch.payout) result.PayoutId = payoutMatch.payout.id || '';
return result;

function findAffectedObject(raw, expectedFormName) {
  const parsed = parseJson(raw);
  return findFormObject(parsed, expectedFormName);
}

function findPolicyObject(policyValue, expectedFormName) {
  const insuredObjects = Array.isArray(policyValue && policyValue.InsuredObjects)
    ? policyValue.InsuredObjects
    : [];
  for (const insuredObject of insuredObjects) {
    const match = findFormObject(insuredObject, expectedFormName);
    if (match) return match;
  }

  doCmd({
    cmd: 'RepoInsuredObject',
    data: {
      operation: 'GET',
      filter: `lifePolicyId = ${positiveInteger(policyValue && policyValue.id)}`,
      size: 0,
      page: 0
    }
  });
  for (const insuredObject of rows(RepoInsuredObject && RepoInsuredObject.outData)) {
    const match = findFormObject(insuredObject, expectedFormName);
    if (match) return match;
  }
  return null;
}

function findFormObject(value, expectedFormName) {
  if (!value || typeof value !== 'object') return null;
  if (String(value.formName || '').trim() === expectedFormName) return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findFormObject(item, expectedFormName);
      if (match) return match;
    }
    return null;
  }

  for (const key of Object.keys(value)) {
    const match = findFormObject(value[key], expectedFormName);
    if (match) return match;
  }
  return null;
}

function getVehicleValues(object) {
  const values = {};
  collectValues(object, values);
  const marcaCode = getCollectedValue(values, ['marca', 'cmbmarca', 'brand']);
  const modeloCode = getCollectedValue(values, ['modelo', 'cmbmodelo', 'model']);
  return {
    Marca: getMarcaTexto(marcaCode),
    Modelo: getModeloTexto(marcaCode, modeloCode),
    Anio: getCollectedValue(values, ['ano', 'anio', 'year', 'año', 'txtanioauto']),
    Placa: getCollectedValue(values, ['placa', 'tbplaca', 'plate', 'licenseplate']),
    Propietario: getCollectedValue(values, ['propietario', 'oapropietario', 'owner', 'nombrepropietario', 'txtpropietario'])
  };
}

function collectValues(value, target) {
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    value.forEach(item => collectValues(item, target));
    return;
  }

  const fieldName = normalizeKey(value.name || value.fieldName || value.label);
  if (isVehicleField(fieldName)) {
    const fieldValue = extractValue(value.value !== undefined ? value.value : value.userData);
    if (fieldValue !== '') target[fieldName] = fieldValue;
  }

  Object.keys(value).forEach(key => {
    const normalizedKey = normalizeKey(key);
    const current = value[key];
    if (normalizedKey && isVehicleField(normalizedKey)) {
      const extracted = extractValue(current);
      if (extracted !== '') target[normalizedKey] = extracted;
    }
    if (current && typeof current === 'object') collectValues(current, target);
  });
}

function isVehicleField(key) {
  return ['marca', 'brand', 'modelo', 'model', 'ano', 'anio', 'year', 'placa',
    'plate', 'licenseplate', 'propietario', 'owner', 'nombrepropietario', 'cmbmarca',
    'cmbmodelo', 'txtanioauto', 'tbplaca', 'txtpropietario', 'oapropietario'].includes(key);
}

function getCollectedValue(values, aliases) {
  for (const alias of aliases) {
    const value = values[normalizeKey(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function getMarcaTexto(value) {
  const code = stringValue(value);
  if (!code) return '';

  doCmd({ cmd: 'GetFullTable', data: { table: 'tbMarcas' } });
  const catalog = GetFullTable && GetFullTable.ok && Array.isArray(GetFullTable.outData)
    ? GetFullTable.outData
    : [];
  const row = catalog.slice(1).find(item => Array.isArray(item)
    ? stringValue(item[1]) === code
    : stringValue(item.cmarca || item.code || item.id) === code);
  return stringValue(Array.isArray(row) ? row[2] : row && (row.name || row.nombre)) || code;
}

function getModeloTexto(marca, value) {
  const marcaCode = stringValue(marca);
  const modeloCode = stringValue(value);
  if (!modeloCode) return '';

  doCmd({ cmd: 'GetFullTable', data: { table: 'tbModelos' } });
  const catalog = GetFullTable && GetFullTable.ok && Array.isArray(GetFullTable.outData)
    ? GetFullTable.outData
    : [];
  const row = catalog.slice(1).find(item => {
    if (Array.isArray(item)) return stringValue(item[1]) === marcaCode && stringValue(item[2]) === modeloCode;
    return stringValue(item.cmarca || item.marca || item.brandCode) === marcaCode
      && stringValue(item.cmodelo || item.code || item.id) === modeloCode;
  });
  return stringValue(Array.isArray(row) ? row[3] : row && (row.name || row.nombre)) || modeloCode;
}

function extractValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value).trim();
  if (Array.isArray(value)) return value.length ? extractValue(value[0]) : '';
  return extractValue(value.value !== undefined ? value.value
    : value.userData !== undefined ? value.userData
      : value.text !== undefined ? value.text : '');
}

function getPolicyInsured(policyValue) {
  const insureds = Array.isArray(policyValue && policyValue.Insureds) ? policyValue.Insureds : [];
  const insured = insureds[0];
  return (insured && (insured.Contact || insured.contact)) || insured || policyValue.Holder || policyValue.holder || {};
}

function getContactName(contact) {
  if (!contact) return '';
  const direct = contact.fullName || contact.FullName || contact.name;
  if (direct && (!contact.surname1 && !contact.surname2 && !contact.middlename)) return String(direct).trim();
  return [contact.name, contact.middlename, contact.surname1, contact.surname2]
    .filter(value => value !== null && value !== undefined && String(value).trim() !== '')
    .map(value => String(value).trim())
    .join(' ');
}

function getContactIdentifier(contact) {
  return stringValue(contact && (contact.cnp || contact.nif || contact.identification || contact.identifier));
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function parseJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (error) { return null; }
}

function firstRow(value) {
  return Array.isArray(value) ? value[0] : value || null;
}

function rows(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function stringValue(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function formatOccurrencePanama(value) {
  const text = stringValue(value);
  if (!text) return '';

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T00:00:00Z`
    : /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)
      ? text
      : `${text}Z`;
  const utcDate = new Date(normalized);
  if (Number.isNaN(utcDate.getTime())) return '';

  const panamaDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000));
  const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  return `${weekdays[panamaDate.getUTCDay()]}, ${panamaDate.getUTCDate()} del mes ${months[panamaDate.getUTCMonth()]} de ${panamaDate.getUTCFullYear()}`;
}
