//block
//noreplace

/**
 * @name cmdFiniquitoAU
 * @purpose Builds the vehicle and person data required by the automobile settlement document.
 * @context { claimId: number, tipo: 0|1|2|3 }
 * @tipo 0: vehículo asegurado; formulario frmOAAutomovilAsegurado.
 * @tipo 1: vehículo afectado; formulario frmOAAutomovil.
 * @tipo 2: persona afectada; formulario frmOAPersonaAfectada, devuelve Beneficiario y Afectado.
 * @tipo 3: persona asegurada; formulario frmOAPersonaAseguradaAU, devuelve Asegurado.
 */

const input = context || {};
const claimId = positiveInteger(input.claimId || input.siniestroId || input.id);
const tipo = Number(input.tipo !== undefined ? input.tipo : input.type);

if (claimId <= 0) throw new Error('claimId es obligatorio y debe ser válido.');
const formNameByType = {
  0: 'frmOAAutomovilAsegurado',
  1: 'frmOAAutomovil',
  2: 'frmOAPersonaAfectada',
  3: 'frmOAPersonaAseguradaAU'
};
if (!Object.prototype.hasOwnProperty.call(formNameByType, tipo)) {
  throw new Error('tipo debe ser 0, 1, 2 o 3.');
}

const formName = formNameByType[tipo];
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
  Conductor: '',
  IdentificacionAfectado: '',
  Beneficiario: {},
  Afectado: {},
  Asegurado: {},
  PayoutId: '',
  Monto: '0.00',
  MontoLetras: ''
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

const payoutObject = payoutMatch && payoutMatch.object;
const policyVehicleObject = tipo === 0 ? findPolicyObject(policy, formName) : null;

if (tipo === 0 || tipo === 1) {
  const vehicle = getVehicleValues(payoutObject);
  const policyVehicle = getVehicleValues(policyVehicleObject);
  result.Marca = vehicle.Marca || policyVehicle.Marca;
  result.Modelo = vehicle.Modelo || policyVehicle.Modelo;
  result.Anio = vehicle.Anio || policyVehicle.Anio;
  result.Placa = vehicle.Placa || policyVehicle.Placa;
  result.Propietario = vehicle.Propietario || policyVehicle.Propietario;
  result.Conductor = vehicle.Conductor || policyVehicle.Conductor;
  if (tipo === 1) result.IdentificacionAfectado = vehicle.IdentificacionAfectado;
}

if (tipo === 2 && payoutObject) {
  const people = getAffectedPersonValues(payoutObject);
  result.Beneficiario = people.Beneficiario;
  result.Afectado = people.Afectado;
}

if (tipo === 3 && payoutObject) result.Asegurado = getInsuredPersonValues(payoutObject);

if (payoutMatch && payoutMatch.payout) {
  const payout = payoutMatch.payout;
  result.PayoutId = payout.id || '';
  const payoutAmount = getPayoutAmount(payout);
  result.Monto = formatAmount(payoutAmount);
  result.MontoLetras = amountToWords(payoutAmount);
}
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
    Propietario: getCollectedValue(values, ['propietario', 'oapropietario', 'owner', 'nombrepropietario', 'txtpropietario']),
    Conductor: getCollectedValue(values, ['oaconductor', 'conductor', 'driver', 'nombreconductor']),
    IdentificacionAfectado: getCollectedValue(values, ['oacod'])
  };
}

function getAffectedPersonValues(object) {
  const values = {};
  collectValues(object, values);
  return {
    Beneficiario: {
      Nombre: getCollectedValue(values, ['bennombre']),
      Identificacion: getCollectedValue(values, ['bencedula']),
      Edad: getCollectedValue(values, ['benedad']),
      Nacionalidad: getCountryText(getCollectedValue(values, ['bennacionalidad'])),
      Relacion: getRelationshipText(getCollectedValue(values, ['benrelacion']))
    },
    Afectado: {
      Nombre: getCollectedValue(values, ['incnombre']),
      Identificacion: getCollectedValue(values, ['inccedula']),
      Edad: getCollectedValue(values, ['incedad']),
      NumeroTarjeta: getCollectedValue(values, ['incnotarjeta']),
      Sexo: getGenderText(getCollectedValue(values, ['incsexo'])),
      Nacionalidad: getCountryText(getCollectedValue(values, ['incnacionalidad'])),
      Motivo: getCollectedValue(values, ['incmotivo']),
      FechaEvento: getCollectedValue(values, ['incfechaevento'])
    }
  };
}

function getInsuredPersonValues(object) {
  const values = {};
  collectValues(object, values);
  return {
    Nombre: getCollectedValue(values, ['asegnombre']),
    Identificacion: getCollectedValue(values, ['asegcedula']),
    Sexo: getGenderText(getCollectedValue(values, ['asegsexo'])),
    EstadoCivil: getMaritalStatusText(getCollectedValue(values, ['asegestadocivil'])),
    Motivo: getCollectedValue(values, ['asegmotivo'])
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
    'cmbmodelo', 'txtanioauto', 'tbplaca', 'txtpropietario', 'oapropietario', 'oaconductor',
    'conductor', 'driver', 'nombreconductor', 'oacod', 'bennombre', 'bencedula', 'benedad',
    'bennacionalidad', 'benrelacion', 'incnombre', 'inccedula', 'incedad', 'incnotarjeta',
    'incsexo', 'incnacionalidad', 'incmotivo', 'incfechaevento', 'asegnombre', 'asegcedula',
    'asegsexo', 'asegestadocivil', 'asegmotivo'].includes(key);
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
  const rows = catalog.slice(1);
  const matchesModel = item => Array.isArray(item)
    ? stringValue(item[2]) === modeloCode || stringValue(item[3]) === modeloCode
    : stringValue(item.cmodelo || item.code || item.id) === modeloCode
      || stringValue(item.xmodelo || item.nombre || item.name) === modeloCode;
  const belongsToBrand = (item, brand) => Array.isArray(item)
    ? stringValue(item[1]) === brand
    : stringValue(item.cmarca || item.marca || item.brandCode) === brand;
  const modelRows = rows.filter(matchesModel);
  let row = modelRows.find(item => belongsToBrand(item, marcaCode));

  // Some affected-object forms store the selected brand label instead of its code.
  if (!row && marcaCode) {
    doCmd({ cmd: 'GetFullTable', data: { table: 'tbMarcas' } });
    const brands = GetFullTable && GetFullTable.ok && Array.isArray(GetFullTable.outData)
      ? GetFullTable.outData.slice(1)
      : [];
    const normalizedBrand = marcaCode.toUpperCase();
    const brand = brands.find(item => (Array.isArray(item)
      ? stringValue(item[2])
      : stringValue(item.xmarca || item.nombre || item.name)).toUpperCase() === normalizedBrand);
    const resolvedBrandCode = brand && stringValue(Array.isArray(brand) ? brand[1] : brand.cmarca || brand.code || brand.id);
    if (resolvedBrandCode) row = modelRows.find(item => belongsToBrand(item, resolvedBrandCode));
  }

  // Model codes are normally unique; use the single match when the stored brand is unavailable.
  if (!row && modelRows.length === 1) row = modelRows[0];
  return stringValue(Array.isArray(row) ? row[3] : row && (row.xmodelo || row.nombre || row.name)) || modeloCode;
}

function getCountryText(value) {
  return getCatalogText('RepoCountryCatalog', value, 'code', 'name');
}

function getRelationshipText(value) {
  return getCatalogText('RepoRelationshipCatalog', value, 'id', 'name', "principalType='BENEFICIARY'");
}

function getMaritalStatusText(value) {
  return getCatalogText('RepoMaritalStatusCatalog', value, 'id', 'name');
}

function getCatalogText(command, value, codeField, descriptionField, filter) {
  const code = stringValue(value);
  if (!code) return '';

  doCmd({
    cmd: command,
    data: {
      operation: 'GET',
      filter: filter,
      size: 0,
      page: 0
    }
  });

  const response = command === 'RepoCountryCatalog'
    ? RepoCountryCatalog
    : command === 'RepoRelationshipCatalog'
      ? RepoRelationshipCatalog
      : RepoMaritalStatusCatalog;
  const match = rows(response && response.outData)
    .find(item => stringValue(item && item[codeField]) === code);
  return stringValue(match && match[descriptionField]) || code;
}

function getGenderText(value) {
  const code = stringValue(value).toUpperCase();
  if (code === 'M') return 'Masculino';
  if (code === 'F') return 'Femenino';
  return stringValue(value);
}

function getPayoutAmount(payout) {
  const value = payout && payout.payed !== undefined && payout.payed !== null
    ? payout.payed
    : payout && payout.originalAmount;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0.00';
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function amountToWords(value) {
  const amount = Math.abs(Number(value) || 0);
  const totalCents = Math.round(amount * 100);
  const integer = Math.floor(totalCents / 100);
  const cents = String(totalCents % 100).padStart(2, '0');
  const prefix = Number(value) < 0 ? 'Menos ' : '';
  return `${prefix}${numberToSpanish(integer)} con ${cents}/100`;
}

function numberToSpanish(value) {
  const number = Math.floor(Math.abs(Number(value) || 0));
  if (number === 0) return 'Cero';

  const units = ['', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
  const teens = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'];
  const tens = ['', '', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'];
  const hundreds = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos'];

  function underThousand(n) {
    if (n === 0) return '';
    if (n === 100) return 'Cien';
    const hundred = hundreds[Math.floor(n / 100)];
    const rest = n % 100;
    let text = hundred;
    if (rest >= 10 && rest < 20) text += `${text ? ' ' : ''}${teens[rest - 10]}`;
    else if (rest >= 20) text += `${text ? ' ' : ''}${tens[Math.floor(rest / 10)]}${rest % 10 ? ` y ${units[rest % 10]}` : ''}`;
    else if (rest > 0) text += `${text ? ' ' : ''}${units[rest]}`;
    return text;
  }

  const millions = Math.floor(number / 1000000);
  const thousands = Math.floor((number % 1000000) / 1000);
  const remainder = number % 1000;
  const parts = [];
  if (millions) parts.push(millions === 1 ? 'Un Millón' : `${underThousand(millions)} Millones`);
  if (thousands) parts.push(thousands === 1 ? 'Mil' : `${underThousand(thousands)} Mil`);
  if (remainder) parts.push(underThousand(remainder));
  return parts.join(' ');
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
