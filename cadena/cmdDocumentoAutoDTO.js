//block
//noreplace

/*
  *@name: cmdDocumentoAutoDTO
  *@Purpose: Retrieves the DTO for automobile document generation (general).
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 15/07/2026
  *@Input: {policyId}
  *@Output: [{ resultado }]
*/

const policyId = toValidNumber(context?.policyId);
const paramPolicyCode = getTrimmedString(context?.policyCode);
const paramAnualPremium = context?.premium;
const paramTax = context?.tax;
const paramAnualTotal = context?.anualTotal;
const paramPayPlan = normalizeArrayInput(context?.payPlan);
let policy;
let holder;
let seller;
let acreedor;
let insured;
let resultado = {};
let oaUserData;
let limites;
const objectDefinitionCode = 'DTAUT';
const hoy = new Date();
const dia = hoy.getDate();
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const mes = meses[hoy.getMonth()];
const anio = hoy.getFullYear();
const celPhoneType = "PHONETYPE2";
const faxPhoneType = "PHONETYPE4";
const telPhoneType = "PHONETYPE1";
const emailType = "EMAILTYPE1";
let currency;

const dataFrecuenciaPago = [
  { code: 'm', name: 'Mensual' },
  { code: 'q', name: 'Trimestral' },
  { code: 's', name: 'Semestral' },
  { code: 'y', name: 'Anual' }
];

const deducibles = [{ productCode: "MQ", text: '10% del valor de la perdida' }]

if (!policyId) {
  throw new Error('Debe informar el policyId para generar el documento.');
}

policy = getPolicy();
holder = getHolder();
seller = getSeller();
insured = getInsured();
oaUserData = getInsuredObject();
limites = getLimites();
acreedor = getAcreedor();
currency = getCurrency(policy.currency);

const dateIni = new Date(policy.start);
const diaIni = dateIni.getDate();
const mesIni = meses[dateIni.getMonth()];
const anioIni = dateIni.getFullYear();

const dateFin = new Date(policy.end);
const diaFin = dateFin.getDate();
const mesFin = meses[dateFin.getMonth()];
const anioFin = dateFin.getFullYear();

//Datos del pagador
resultado.Tenedor = getNombreCompleto(holder);
resultado.Direccion = holder?.Addresses?.[0]?.address2 ?? "";
resultado.Telefono = holder.phone ?? "";

//return holder.Phones
resultado.Celular = findByType(holder?.Phones, celPhoneType)?.num ?? "";
resultado.Fax = findByType(holder?.Phones, faxPhoneType)?.num ?? "";
resultado.Correo = holder.email ?? "";
resultado.Email = holder.email ?? "";
resultado.Identificacion = holder.isPerson == true ? holder.cnp : holder.nif;
resultado.Pais = getCatalogValue("RepoCountryCatalog", `code = '${escapeSql(holder?.Addresses?.[0]?.country ?? "")}'`, "name") ?? "";
resultado.Provincia = getCatalogValue("RepoStateCatalog", `countryCode = '${escapeSql(holder?.Addresses?.[0]?.country ?? "")}' AND code = '${escapeSql(holder?.Addresses?.[0]?.state ?? "")}'`, "name") ?? "";
resultado.Ciudad = getCatalogValue("RepoCityCatalog", `stateCode = '${escapeSql(holder?.Addresses?.[0]?.state ?? "")}' AND code = '${escapeSql(holder?.Addresses?.[0]?.city ?? "")}'`, "name") ?? "";

//Datos del asegurado
const fnacimiento = parseDateSafe(insured?.birth);
resultado.DiaNac = fnacimiento ? fnacimiento.getDate() : "";
resultado.MesNac = fnacimiento ? fnacimiento.getMonth() : "";
resultado.AnioNac = fnacimiento ? fnacimiento.getFullYear() : "";
resultado.Asegurado = getNombreCompleto(insured);
resultado.FNacimiento = toFecha(insured.birth);
resultado.IdentificacionAseg = insured.isPerson == true ? insured.cnp : insured.nif;
resultado.insuredCelular = findByType(insured?.Phones, celPhoneType)?.num ?? "";
resultado.insuredCelular = resultado.insuredCelular 
                                  ? resultado.insuredCelular 
                                  : insured.phone 
                                      ? insured.phone 
                                      : "";
resultado.insuredPhone = findByType(insured?.Phones, telPhoneType)?.num ?? "";
resultado.insuredPhone = resultado.insuredPhone 
                                  ? resultado.insuredPhone 
                                  : "";
resultado.insuredEmail = findByType(insured?.Emails, emailType)?.num ?? "";
resultado.insuredEmail = resultado.insuredEmail 
                                  ? resultado.insuredEmail 
                                  : insured.email 
                                      ? insured.email
                                      : "";
const addressInsured = Array.isArray(insured?.Addresses) && insured.Addresses.length > 0 ? insured.Addresses[0] : null;
const address1Insured = addressInsured?.address1 ? addressInsured.address1 : "";
const address2Insured = addressInsured?.address2 ? addressInsured.address2 : "";
resultado.insuredAddress = `${address1Insured} ${address2Insured}`.trim();
resultado.insuredPais = getCatalogValue("RepoCountryCatalog", `code = '${escapeSql(addressInsured?.country ?? "")}'`, "name") ?? "";
resultado.insuredProvincia = getCatalogValue("RepoStateCatalog", `countryCode = '${escapeSql(addressInsured?.country ?? "")}' AND code = '${escapeSql(addressInsured?.state ?? "")}'`, "name") ?? "";
resultado.insuredCiudad = getCatalogValue("RepoCityCatalog", `stateCode = '${escapeSql(addressInsured?.state ?? "")}' AND code = '${escapeSql(addressInsured?.city ?? "")}'`, "name") ?? "";
resultado.insuredName = insured.FullName;

//Datos del corredor
resultado.Corredor = getNombreCompleto(seller);
resultado.Corredor = resultado.Corredor == "" ? "No Tiene" : resultado.Corredor;

//Datos del cesionario
resultado.Acreedor = getNombreCompleto(acreedor);
resultado.Acreedor = resultado.Acreedor == "" ? "No Tiene" : resultado.Acreedor;

//Datos de la póliza
resultado.Poliza = paramPolicyCode ? paramPolicyCode : policy.code;
resultado.Certificado = 0;
resultado.Oferta = policyId;
resultado.Moneda = policy.currency;
resultado.symbol = currency?.symbol ?? "";
resultado.Suma = n(policy.insuredSum);
resultado.SumaLetras = numeroALetras(policy.insuredSum ?? 0);
resultado.Desde = toFecha(policy.start);
resultado.Hasta = toFecha(policy.end);
resultado.Hora = getHora(policy.end);
resultado.Observaciones = policy.description ?? "";
resultado.Frecuencia = dataFrecuenciaPago.find(x => x.code == policy.periodicity)?.name ?? "";
resultado.Movimiento = policy.contractYear == 1 ? "Nuevo" : "Renovación"
resultado.Prima = n(paramAnualPremium ?? policy.annualPremium ?? 0);
resultado.Impuesto = n(paramTax ?? policy.tax ?? 0);
resultado.Total = n(paramAnualTotal ?? policy.annualTotal ?? 0);
resultado.FormaPago = getCatalogValue("RepoPaymentMethodCatalog", `code = '${escapeSql(policy?.paymentMethod ?? "-1")}'`, "name") ?? "";
resultado.Cuotas = Array.isArray(paramPayPlan) ? paramPayPlan.length : (Array.isArray(policy?.PayPlan) ? policy.PayPlan.length : 0)

//Datos de Coberturas
const tarifaEntrada = parseJsonArray(oaUserData?.hiddenCobtar);
doCmd({"cmd":"GetFullTable","data":{"table":"cfgCobtarRamoTecnico"}});
resultado.Coberturas = (Array.isArray(policy?.Coverages) ? policy.Coverages : [])
  .sort((a, b) => Number(a.number ?? 0) - Number(b.number ?? 0))
  .map(({ code, name, limit, premium, deductible }) => {
    const findCoverage = Array.isArray(tarifaEntrada) ? tarifaEntrada.find(x => x.coverageCode == code) : null;
    const cov = {
      Codigo: code,
      Cobertura: name,
      Limite: n(limit),
      Prima: n(premium),
      Moneda: policy.currency,
      DeductibleCov: deductible,
      Evento: limites.find(x => vEqual(x.Producto) == vEqual(policy.productCode) && vEqual(x.Cobertura) == vEqual(code))?.Limite ?? "",
      Porcentaje: findCoverage && findCoverage.Porcentaje ? findCoverage.Porcentaje : 0,
      //findCoverage
    };         
    return cov;
  });

//Datos del DT
resultado.Marca = getMarca(oaUserData?.cmbMarca ?? "0");
resultado.Modelo = getModelo(oaUserData?.cmbMarca ?? "0", oaUserData?.cmbModelo ?? "0");
resultado.Anio = oaUserData?.txtAnioAuto ?? "0";
resultado.Color = oaUserData?.txtColorAuto ?? "";
resultado.Chasis = oaUserData?.tbseriechasis ?? "";
resultado.VIN = oaUserData?.tbVIN ?? "";
resultado.Motor = oaUserData?.tbseriemotor ?? "";
resultado.Tipo = getTipo(oaUserData?.cmbtipo ?? oaUserData?.txtTipo ?? "0");
resultado.Uso = getUso(oaUserData?.cmbUsoAuto ?? oaUserData?.txtUsoAuto ?? "0");
resultado.Capacidad = oaUserData?.txtPuestosAuto ?? "0";
resultado.Placa = oaUserData?.tbplaca ?? "";
resultado.SumaAsegurada = n(oaUserData?.txtSA ?? 0);
resultado.userData = oaUserData;

//Fecha actual
resultado.DiaFecha = dia;
resultado.MesFecha = mes;
resultado.AnioFecha = anio;
resultado.FechaActual = toFecha(hoy);

resultado.DiaVigenciaIni = diaIni;
resultado.MesVigenciaIni = mesIni;
resultado.AnioVigenciaIni = anioIni;
resultado.DiaVigenciaFin = diaFin;
resultado.MesVigenciaFin = mesFin;
resultado.AnioVigenciaFin = anioFin;

resultado.NombreEncargado = "";
resultado.TituloEncargado = "";

//n_acto_publico

return resultado;

function getPolicy() {
  doCmd({cmd: "RepoLifePolicy", data: { operation: "GET", include: ["Insureds", "Coverages", "PayPlan"], filter: `id = ${policyId}`, noTracking: true }});
  if (!RepoLifePolicy.ok) {
    throw new Error(`No se pudo recuperar la póliza: ${RepoLifePolicy.msg}`);
  }
  const data = Array.isArray(RepoLifePolicy.outData) ? RepoLifePolicy.outData[0] : null;
  if(!data)
    throw new Error(`No se pudo recuperar la póliza: ${RepoLifePolicy.msg}`);
  return data;
}

function getHolder() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", include: ["Addresses", "Phones", "Emails"], filter: `id = ${toValidNumber(policy?.holderId) || -1}` }});
  if (!GetContacts.ok) {
    throw new Error(`No se pudo recuperar el pagador de la póliza: ${GetContacts.msg}`);
  }
  const data = Array.isArray(GetContacts.outData) ? GetContacts.outData[0] : null;
  if(!data)
    throw new Error(`No se pudo recuperar el pagador de la póliza: ${GetContacts.msg}`);
  return data;
}

function getSeller() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", filter: `id = ${toValidNumber(policy?.sellerId) || -1}` }});
  if (!GetContacts.ok) {
    return {};
  }
  const data = Array.isArray(GetContacts.outData) ? GetContacts.outData[0] : null;
  return data || {};
}

function getAcreedor() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", filter: `id = ${toValidNumber(policy?.cessionBeneficiary) || -1}` }});
  if (!GetContacts.ok) {
    return {};
  }
  const data = Array.isArray(GetContacts.outData) ? GetContacts.outData[0] : null;
  return data || {};
}

function getInsured() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", include: ["Addresses", "Phones", "Emails"], filter: `id = ${toValidNumber(policy?.MainInsured?.contactId) || -1}` }});
  if (!GetContacts.ok) {
    throw new Error(`No se pudo recuperar el asegurado de la póliza: ${GetContacts.msg}`);
  }
  const data = Array.isArray(GetContacts.outData) ? GetContacts.outData[0] : null;
  if(!data)
    throw new Error(`No se pudo recuperar el asegurado de la póliza: ${GetContacts.msg}`);
  return data;
}

function getInsuredObject() {

  doCmd({cmd: "RepoObjectDefinition", data: { operation: "GET", filter: `code = '${objectDefinitionCode}'` }});
  if (!RepoObjectDefinition.ok) {
    throw new Error(`No se encontró objeto asegurado definido: ${RepoObjectDefinition.msg}`);
  }
  const objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;
  
  if(objectDefinitionId == 0)
    throw new Error(`No se encontró objeto asegurado definido: ${RepoObjectDefinition.msg}`);
  
  doCmd({cmd: "RepoInsuredObject", data: { operation: "GET", filter: `lifePolicyId = ${policyId} AND objectDefinitionId = ${objectDefinitionId}` }});
  if (!RepoInsuredObject.ok) {
    throw new Error(`No se pudo recuperar el objeto asegurado: ${RepoInsuredObject.msg}`);
  }
  const data = normalizeObject(RepoInsuredObject.outData?.[0]?.userData);
  if(!data || Object.keys(data).length === 0)
    throw new Error(`No se pudo recuperar el objeto asegurado: ${RepoInsuredObject.msg}`);
  return data;
}

function getCatalogValue(catalogName, filter, fieldName) {
  doCmd({cmd: catalogName, data: { operation: "GET", filter: filter }});
  const catalogResult = globalThis[catalogName];
  if (!catalogResult?.ok) {
    return "";
  }
  return catalogResult?.outData?.[0]?.[fieldName] ?? "";
}

function getTableValue(tableName, column, row, fieldName) {
  doCmd({"cmd":"GetTable","data":{"table":tableName,"column": column,"row": row,"getColumn": fieldName}});  
  if (!GetTable.ok) {
    return "";
  }
  return GetTable.outData ?? "";
}

function getMarca(value) {
  doCmd({"cmd":"GetFullTable","data":{"table":"TablaMarcas"}});
  if (!GetFullTable.ok) return "";
  const rows = normalizeFullTableRows(GetFullTable.outData);
  const match = rows.find(row => {
    if (Array.isArray(row)) {
      return String(row[0] ?? '').trim() == String(value ?? '').trim();
    }

    return String(row?.NUMEROMARCA ?? row?.numeromarca ?? row?.code ?? '').trim() == String(value ?? '').trim();
  });

  if (!match) return "";

  if (Array.isArray(match)) {
    return String(match[1] ?? '').trim();
  }

  return String(match?.MARCA ?? match?.marca ?? match?.name ?? '').trim();
}

function getModelo(cmarca, cmodelo) {
  doCmd({"cmd":"GetFullTable","data":{"table":"TablaModelos"}});
  if (!GetFullTable.ok) return "";
  const rows = normalizeFullTableRows(GetFullTable.outData);
  const match = rows.find(row => {
    if (Array.isArray(row)) {
      return String(row[0] ?? '').trim() == String(cmarca ?? '').trim()
        && String(row[1] ?? '').trim() == String(cmodelo ?? '').trim();
    }

    return String(row?.NUMEROMARCA ?? row?.numeromarca ?? row?.marca ?? '').trim() == String(cmarca ?? '').trim()
      && String(row?.NUMEROMODELO ?? row?.numeromodelo ?? row?.modelo ?? '').trim() == String(cmodelo ?? '').trim();
  });

  if (!match) return "";

  if (Array.isArray(match)) {
    return String(match[2] ?? '').trim();
  }

  return String(match?.NOMBREMODELO ?? match?.nombremodelo ?? match?.name ?? '').trim();
}

function getTipo(ctipo) {
  doCmd({"cmd":"GetFullTable","data":{"table":"tblTipoPorRamo"}});
  if (!GetFullTable.ok) return "";

  const rows = normalizeFullTableRows(GetFullTable.outData);
  const match = rows.find(row => {
    if (Array.isArray(row)) {
      return String(row[0] ?? '').trim() == String(policy?.lob ?? '').trim()
        && String(row[1] ?? '').trim() == String(ctipo ?? '').trim();
    }

    return String(row?.cramo ?? row?.CRAMO ?? '').trim() == String(policy?.lob ?? '').trim()
      && String(row?.ctipo ?? row?.CTIPO ?? '').trim() == String(ctipo ?? '').trim();
  });

  if (!match) return "";

  if (Array.isArray(match)) {
    return String(match[2] ?? '').trim();
  }

  return String(match?.xtipo ?? match?.XTIPO ?? match?.name ?? '').trim();
}

function getUso(cuso) {
  doCmd({"cmd":"GetFullTable","data":{"table":"tblUsoPorRamo"}});
  if (!GetFullTable.ok) return "";

  const rows = normalizeFullTableRows(GetFullTable.outData);
  const match = rows.find(row => {
    if (Array.isArray(row)) {
      return String(row[0] ?? '').trim() == String(policy?.lob ?? '').trim()
        && String(row[1] ?? '').trim() == String(cuso ?? '').trim();
    }

    return String(row?.cramo ?? row?.CRAMO ?? '').trim() == String(policy?.lob ?? '').trim()
      && String(row?.cagrupa ?? row?.CAGRUPA ?? '').trim() == String(cuso ?? '').trim();
  });

  if (!match) return "";

  if (Array.isArray(match)) {
    return String(match[2] ?? '').trim();
  }

  return String(match?.xdescripcion_l ?? match?.XDESCRIPCION_L ?? match?.name ?? '').trim();
}

function getLimites() {

  const tableName = "tbLimiteCobertura";

  doCmd({cmd :"GetFullTable", data: {table: tableName}});

   if(!GetFullTable.ok)
      throw new Error("Error leyendo configuración de límites");

  const data = mapearTablaConfig(GetFullTable.outData ?? []);
  return data.filter(x => vEqual(x.Ramo) == vEqual(policy.lob));
  
}

function mapearTablaConfig(data) {

  if (!data || !data.length) return [];

  const headersOriginal = data[0];

  // Resolver nombres duplicados
  const headers = [];
  const contador = {};

  headersOriginal.forEach(h => {
    const key = h.trim();

    if (contador[key]) {
      contador[key]++;
      headers.push(`${key}_${contador[key]}`);
    } else {
      contador[key] = 1;
      headers.push(key);
    }
  });

  // Mapear filas
  const result = data.slice(1).map(row => {
    const obj = {};

    headers.forEach((col, i) => {
      obj[col] = row[i];
    });

    return obj;
  });

  return result;
}

function vEqual(value) {
  return String(value || '').trim().toUpperCase()
}

function toValidNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getTrimmedString(value) {
  return String(value ?? '').trim();
}

function normalizeArrayInput(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeFullTableRows(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const firstRow = data[0];
  if (!Array.isArray(firstRow)) {
    return data;
  }

  const hasHeaderLikeValues = firstRow.every(item => typeof item === 'string');
  return hasHeaderLikeValues ? data.slice(1) : data;
}

function findByType(list, type) {
  if (!Array.isArray(list)) {
    return null;
  }

  return list.find(item => item?.type == type) ?? null;
}

function parseDateSafe(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function escapeSql(value) {
  return String(value ?? '').replace(/'/g, "''");
}

function getNombreCompleto(contact) {
    return [
        contact?.name,
        contact?.middlename,
        contact?.surname1,
        contact?.surname2
    ]
    .filter(v => typeof v === "string" && v.trim() !== "")
    .map(v => v.trim())
    .join(" ");
}

function toFecha(value) {
  if (!value) return "";

  const date = (value instanceof Date) ? value : new Date(value);

  // Validar fecha inválida
  if (isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // meses 0-11
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getHora(fecha) {
  const date = new Date(fecha);

  if (isNaN(date)) return "";

  let horas = date.getHours();
  const minutos = String(date.getMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "pm" : "am";

  horas = horas % 12 || 12;

  return `${String(horas).padStart(2, "0")}:${minutos} ${periodo}`;
}

function n(value) {
    if (value === null || value === undefined) return "0.00";

    let str = String(value).trim();

    if (str === "") return "0.00";

    // Detectar negativo
    const isNegative = /^-/.test(str);

    // Limpiar: dejar solo dígitos, coma, punto y signo
    str = str.replace(/[^\d.,-]/g, '');

    // Quitar signo para procesar
    str = str.replace('-', '');

    // Identificar separador decimal (último . o ,)
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    const decimalIndex = Math.max(lastDot, lastComma);

    let integerPart = '';
    let decimalPart = '';

    if (decimalIndex !== -1) {
        integerPart = str.substring(0, decimalIndex);
        decimalPart = str.substring(decimalIndex + 1);
    } else {
        integerPart = str;
    }

    // Limpiar separadores de miles en la parte entera
    integerPart = integerPart.replace(/[.,]/g, '');

    let number = parseFloat(integerPart + '.' + (decimalPart || '0'));

    if (isNaN(number)) number = 0;

    // Redondear a 2 decimales
    number = Math.round(number * 100) / 100;

    // Separar nuevamente
    let [intPart, decPart] = number.toFixed(2).split('.');

    // Agregar separador de miles
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return (isNegative ? '-' : '') + intPart + '.' + decPart;
}

function numeroALetras(num) {
  const unidades = [
    "", "UNO", "DOS", "TRES", "CUATRO", "CINCO",
    "SEIS", "SIETE", "OCHO", "NUEVE"
  ];

  const decenas = [
    "", "DIEZ", "VEINTE", "TREINTA", "CUARENTA",
    "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"
  ];

  const especiales = [
    "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE",
    "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"
  ];

  const centenas = [
    "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS",
    "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS",
    "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"
  ];

  function convertirMenorMil(n) {
    if (n === 0) return "";
    if (n === 100) return "CIEN";

    let texto = "";

    if (n >= 100) {
      texto += centenas[Math.floor(n / 100)] + " ";
      n = n % 100;
    }

    if (n >= 10 && n < 20) {
      return texto + especiales[n - 10];
    }

    if (n >= 20) {
      let d = Math.floor(n / 10);
      let u = n % 10;

      if (n === 20) return texto + "VEINTE";
      if (n < 30) return texto + "VEINTI" + unidades[u].toLowerCase();

      texto += decenas[d];
      if (u > 0) texto += " Y " + unidades[u];
      return texto;
    }

    if (n > 0) {
      texto += unidades[n];
    }

    return texto;
  }

  function convertir(n) {
    if (n === 0) return "CERO";

    let resultado = "";

    let millones = Math.floor(n / 1000000);
    let miles = Math.floor((n % 1000000) / 1000);
    let cientos = n % 1000;

    if (millones > 0) {
      resultado += (millones === 1 ? "UN MILLÓN" : convertirMenorMil(millones) + " MILLONES") + " ";
    }

    if (miles > 0) {
      resultado += (miles === 1 ? "MIL" : convertirMenorMil(miles) + " MIL") + " ";
    }

    if (cientos > 0) {
      resultado += convertirMenorMil(cientos);
    }

    return resultado.trim();
  }

  // Manejo de decimales (moneda)
  const partes = num.toString().split(".");
  const entero = parseInt(partes[0], 10);
  const decimal = partes[1] ? partes[1].substring(0, 2).padEnd(2, "0") : "00";

  return `${convertir(entero)} CON ${decimal}/100`;
}

function getCurrency(currencyCode) {
  doCmd({"cmd":"RepoCurrency","data":{"operation":"GET","filter":"code = '"+currencyCode+"'"}});  
  const data = RepoCurrency.outData?.[0];
  if(!data)
    throw new Error(`No se pudo recuperar la moneda de la póliza: ${RepoCurrency.msg}`);
  return data;
}
