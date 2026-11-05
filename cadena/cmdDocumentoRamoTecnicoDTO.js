//block
//noreplace

/*
  *@name: cmdDocumentoRamoTecnicoDTO
  *@Purpose: Recupera el DTO para generación de documento de ramos técnicos (general)
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 11/05/2026
  *@Input: {policyId}
  *@Output: [{ resultado }]
  *@Changes: MSN-000151 - ramo 96: dirección completa del tomador, teléfono del asegurado, número de oferta, cuotas de la oferta, coberturas numeradas con límite propio y columna de deducible. Los demás ramos que usan esta cadena no cambian.
*/

const policyId = context.policyId;
const paramPolicyCode = context.policyCode;
const paramAnualPremium = context.premium;
const paramTax = context.tax;
const paramAnualTotal = context.anualTotal;
const paramPayPlan = context.payPlan;
let policy;
let holder;
let seller;
let acreedor;
let insured;
let resultado = {};
let oaUserData;
let limites;
const objectDefinitionCode = 'DT_RAMO_TECNICO';
const hoy = new Date();
const hoyPanama = toPanamaDate(hoy);
const dia = hoyPanama.getUTCDate();
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const mes = meses[hoyPanama.getUTCMonth()];
const anio = hoyPanama.getUTCFullYear();
const celPhoneType = "PHONETYPE2";
const faxPhoneType = "PHONETYPE4";
const telPhoneType = "PHONETYPE1";
const emailType = "EMAILTYPE1";
let currency;

const dataFrecuenciaPago = [
  { code: 'm', name: 'Mensual' },
  { code: 'q', name: 'Trimestral' },
  { code: 's', name: 'Semestral' },
  { code: 'y', name: 'Anual' },
  { code: 'm12', name: 'Pago Único' },
  { code: 'm2', name: 'Bimensual' }
];

const deducibles = [{ productCode: "MQ", text: '10% del valor de la perdida' }]

setPolicy();
setHolder();
setSeller();
setInsured();
setInsuredObject();
setLimites();
setAcreedor();
setCurrency(policy.currency);
// MSN-000151: las correcciones de origen de datos aplican sólo a Ramos Técnicos (ramo 96).
const esRamoTecnico = String(policy.lob ?? '').trim() == '96';

const dateIni = toPanamaDate(policy.start);
const diaIni = dateIni.getUTCDate();
const mesIni = meses[dateIni.getUTCMonth()];
const anioIni = dateIni.getUTCFullYear();

const dateFin = toPanamaDate(policy.end);
const diaFin = dateFin.getUTCDate();
const mesFin = meses[dateFin.getUTCMonth()];
const anioFin = dateFin.getUTCFullYear();

//Datos del pagador
resultado.Tenedor = getNombreCompleto(holder);
resultado.Direccion = esRamoTecnico ? unirDireccion(holder.Addresses?.[0]) : (holder.Addresses?.[0]?.address2 ?? "");
resultado.Telefono = holder.phone ?? "";

//return holder.Phones
resultado.Celular = holder.Phones.find(x => x.type == celPhoneType)?.num ?? "";
resultado.Fax = holder.Phones.find(x => x.type == faxPhoneType)?.num ?? "";
resultado.Correo = holder.email ?? "";
resultado.Email = holder.email ?? "";
resultado.Identificacion = holder.isPerson == true ? holder.cnp : holder.nif;
resultado.Pais = getCatalogValue("RepoCountryCatalog", `code = '${holder.Addresses?.[0]?.country}'`, "name") ?? "";
resultado.Provincia = getCatalogValue("RepoStateCatalog", `countryCode = '${holder.Addresses?.[0]?.country}' AND code = '${holder.Addresses?.[0]?.state}'`, "name") ?? "";
resultado.Ciudad = getCatalogValue("RepoCityCatalog", `stateCode = '${holder.Addresses?.[0]?.state}' AND code = '${holder.Addresses?.[0]?.city}'`, "name") ?? "";

//Datos del asegurado
const fnacimiento = toPanamaDate(insured.birth);
resultado.DiaNac = fnacimiento.getUTCDate();
resultado.MesNac = fnacimiento.getUTCMonth() + 1;
resultado.AnioNac = fnacimiento.getUTCFullYear();
resultado.Asegurado = getNombreCompleto(insured);
resultado.FNacimiento = toFecha(insured.birth);
resultado.IdentificacionAseg = insured.isPerson == true ? insured.cnp : insured.nif;
resultado.insuredCelular = insured.Phones.find(x => x.type == celPhoneType)?.num ?? "";
resultado.insuredCelular = resultado.insuredCelular 
                                  ? resultado.insuredCelular 
                                  : insured.phone 
                                      ? insured.phone 
                                      : "";
resultado.insuredPhone = insured.Phones.find(x => x.type == telPhoneType)?.num ?? "";
resultado.insuredPhone = resultado.insuredPhone 
                                  ? resultado.insuredPhone 
                                  : "";
if (esRamoTecnico) {
  // Como en el tomador: el teléfono principal del contacto es «Teléfono»; «Celular» sólo si tiene un número de tipo celular.
  resultado.insuredPhone = insured.Phones?.find(x => x.type == telPhoneType)?.num || insured.phone || "";
  resultado.insuredCelular = insured.Phones?.find(x => x.type == celPhoneType)?.num || "";
}
resultado.insuredEmail = insured.Emails.find(x => x.type == emailType)?.num ?? "";
resultado.insuredEmail = resultado.insuredEmail 
                                  ? resultado.insuredEmail 
                                  : insured.email 
                                      ? insured.email
                                      : "";
const addressInsured = Array.isArray(insured?.Addresses) && insured.Addresses.length > 0
  ? insured.Addresses[0]
  : null;
const address1Insured = addressInsured?.address1 ?? "";
const address2Insured = addressInsured?.address2 ?? "";
resultado.insuredAddress = `${address1Insured} ${address2Insured}`.trim();
resultado.insuredPais = getCatalogValue("RepoCountryCatalog", `code = '${addressInsured?.country}'`, "name") ?? "";
resultado.insuredProvincia = getCatalogValue("RepoStateCatalog", `countryCode = '${addressInsured?.country}' AND code = '${addressInsured?.state}'`, "name") ?? "";
resultado.insuredCiudad = getCatalogValue("RepoCityCatalog", `stateCode = '${addressInsured?.state}' AND code = '${addressInsured?.city}'`, "name") ?? "";
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
resultado.Oferta = esRamoTecnico ? getCodigoOferta() : policyId;
resultado.Moneda = policy.currency;
resultado.symbol = currency.symbol;
resultado.Suma = n(policy.insuredSum);
resultado.SumaLetras = numeroALetras(policy.insuredSum ?? 0);
resultado.Desde = toFecha(policy.start);
resultado.Hasta = toFecha(policy.end);
resultado.Hora = getHora(policy.end);
resultado.Observaciones = policy.description ?? "";
resultado.Frecuencia = dataFrecuenciaPago.find(x => x.code == policy.periodicity)?.name ?? "";
resultado.Movimiento = policy.contractYear == 1 ? "Nuevo" : "Renovación"
resultado.TituloMov = Number(policy.policyVersion ?? 0) > 0 ? "Renovación" : "Nueva";
resultado.Prima = n(paramAnualPremium ? paramAnualPremium : (policy.annualPremium ?? 0));
resultado.Impuesto = n(paramTax ? paramTax : (policy.tax ?? 0));
resultado.Total = n(paramAnualTotal ? paramAnualTotal : (policy.annualTotal ?? 0));
resultado.FormaPago = getCatalogValue("RepoPaymentMethodCatalog", `code = '${policy.paymentMethod ?? "-1"}'`, "name") ?? "";
resultado.Cuotas = paramPayPlan ? (paramPayPlan?.length ?? 0) : (policy.PayPlan?.length ?? 0)
// La oferta se genera antes de calcular el plan de pagos: sin plan, se informan las cuotas que tendrá.
if (esRamoTecnico && !resultado.Cuotas) resultado.Cuotas = getCuotasEsperadas();

//Datos de Coberturas
const tarifaEntrada = JSON.parse(oaUserData.hiddenCobtar)
doCmd({"cmd":"GetFullTable","data":{"table":"cfgCobtarRamoTecnico"}});
const configCobtar = mapearTablaConfig(GetFullTable.outData ?? []);
resultado.Coberturas = policy.Coverages
  .filter(cov => !esCoberturaClausula(cov))
  .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" }))
  .map(({ code, name, limit, premium, deductible }) => {
    const findCoverage = tarifaEntrada.find(x => x.coverageCode == code);
    const cov = {
      Codigo: code,
      Cobertura: name,
      Limite: n(limit),
      Prima: n(premium),
      Moneda: policy.currency,
      DeductibleCov: montoODefault(deductible),
      Evento: montoODefault(limites.find(x => vEqual(x.Producto) == vEqual(policy.productCode) && vEqual(x.Cobertura) == vEqual(code))?.Limite),
      Deducible: deducibles.find(x => x.productCode == policy.productCode)?.text ?? "",
      DeducibleText: "",
      Porcentaje: findCoverage && findCoverage.Porcentaje ? findCoverage.Porcentaje : 0,
      //findCoverage
    };
    const findDTCoverageDeducible = configCobtar.find(x => x.coverageCode == code && x.name == "Deducible"
      && (!esRamoTecnico || vEqual(x.productCode) == vEqual(policy.productCode)));
    cov.findDTCoverageDeducible = findDTCoverageDeducible;
    if(findDTCoverageDeducible && findDTCoverageDeducible.catalog) {      
       const catalogDeductible = JSON.parse(findDTCoverageDeducible.catalog.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":'));
       const findDescriptionDeductible = catalogDeductible.find(x => x.code == findCoverage?.Deducible);
       cov.DeducibleText = findDescriptionDeductible && findDescriptionDeductible.name ? findDescriptionDeductible.name : "";
    }
    // Ramo 96: «Deducible» muestra la opción de deducible elegida o, si no hay, el monto de deducible de la cobertura.
    if (esRamoTecnico && !cov.Deducible)
      cov.Deducible = textoDeducible(cov.DeducibleText) || (Number(deductible ?? 0) > 0 ? n(deductible) : "");
    return cov;
  });
//Coberturas por suma asegurada, de mayor a menor; a igual suma, el orden de Coberturas (MSN-000147)
resultado.CoberturasPorSuma = resultado.Coberturas
  .map((cov, i) => ({ cov, i, suma: Number(policy.Coverages.find(x => x.code == cov.Codigo)?.limit ?? 0) }))
  .sort((a, b) => (b.suma - a.suma) || (a.i - b.i))
  .map(x => x.cov);

//Datos del DT
resultado.EdadEmi = oaUserData?.txtEdadSuscripcion ?? "0";
resultado.Categoria = getTableValue("tbCategoriaMaquinaria", "code", oaUserData?.cmbCategoria ?? "0", "name");
resultado.Marca = getMarca(oaUserData?.cmbMarca ?? "0");
resultado.Modelo = getModelo(oaUserData?.cmbMarca ?? "0", oaUserData?.cmbModelo ?? "0");
resultado.Serie = oaUserData?.txtSerie ?? "";
resultado.Tipo = oaUserData?.txtTipo ?? "";
resultado.Cantidad = oaUserData?.txtCantidad ?? "0";
resultado.Cantidad = oaUserData?.txtCantidad ?? "0";
resultado.Anio = oaUserData?.txAnio ?? "0";
resultado.Propiedad = oaUserData?.txtPropietario ?? "0";
resultado.SumaDT = n(oaUserData?.txtSA ?? 0);
resultado.PaisDT = getCatalogValue("RepoCountryCatalog", `code = '${oaUserData.cmbPais ?? "0"}'`, "name") ?? "";
resultado.Comentarios = oaUserData?.txtDescripcion ?? "";
//Descripción del riesgo línea por línea, con los saltos y espacios tal como se escribieron (MSN-000147)
const lineasDescripcion = String(resultado.Comentarios).replace(/\r\n?/g, "\n").split("\n");
resultado.ComentariosLineas = lineasDescripcion.map((texto, i) => ({ Linea: texto, Salto: i < lineasDescripcion.length - 1 }));
resultado.userData = oaUserData;
agregarAdendosAlResultado();

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

function agregarAdendosAlResultado() {
  resultado.observacionesEndoso = "";
  const raw = oaUserData?.hiddenAdendos;
  if (!raw) return;

  let adendos;
  try {
    adendos = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    return;
  }

  if (!Array.isArray(adendos)) return;

  resultado.observacionesEndoso = adendos
    .map(adendo => String(adendo?.description ?? "").trim())
    .filter(Boolean)
    .join(", ");

  adendos.forEach(adendo => {
    const codigoAnexo = String(adendo?.idAnexo ?? adendo?.codigoAnexo ?? "").trim();
    const codigoCobertura = String(adendo?.coverageCode ?? adendo?.codigoCobertura ?? "").trim();
    if (!codigoAnexo || !codigoCobertura) return;

    Object.keys(adendo)
      .filter(key => /^Parametro\d+$/i.test(key))
      .sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")))
      .forEach(key => {
        const numeroParametro = key.replace(/\D/g, "");
        const nombreAtributo = `${codigoAnexo}_${codigoCobertura}_${numeroParametro}`;
        resultado[nombreAtributo] = formatearParametroAdendo(adendo[key]);
      });
  });
}

function setPolicy() {
  doCmd({cmd: "RepoLifePolicy", data: { operation: "GET", include: ["Insureds", "Coverages", "PayPlan"], filter: `id = ${policyId}`, noTracking: true }});
  policy = RepoLifePolicy.outData?.[0];
  if(!policy)
    throw new Error(`No se pudo recuperar la póliza: ${RepoLifePolicy.msg}`);
}

function setHolder() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", include: ["Addresses", "Phones", "Emails"], filter: `id = ${policy.holderId}` }});
  holder = GetContacts.outData?.[0];
  if(!holder)
    throw new Error(`No se pudo recuperar el pagador de la póliza: ${GetContacts.msg}`);
}

function setSeller() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", filter: `id = ${policy.sellerId}` }});
  seller = GetContacts.outData?.[0];
  if(!seller)
    seller = {};
}

function setAcreedor() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", filter: `id = ${policy.cessionBeneficiary}` }});
  acreedor = GetContacts.outData?.[0];
  if(!acreedor)
    acreedor = {};
}

function setInsured() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", include: ["Addresses", "Phones", "Emails"], filter: `id = ${policy.MainInsured?.contactId ?? -1}` }});
  insured = GetContacts.outData?.[0];
  if(!insured)
    throw new Error(`No se pudo recuperar el asegurado de la póliza: ${GetContacts.msg}`);
}

function setInsuredObject() {

  doCmd({cmd: "RepoObjectDefinition", data: { operation: "GET", filter: `code = '${objectDefinitionCode}'` }});
  const objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;
  
  if(objectDefinitionId == 0)
    throw new Error(`No se encontró objeto asegurado definido: ${RepoObjectDefinition.msg}`);
  
  doCmd({cmd: "RepoInsuredObject", data: { operation: "GET", filter: `lifePolicyId = ${policyId} AND objectDefinitionId = ${objectDefinitionId}` }});
  oaUserData = RepoInsuredObject.outData?.[0].userData;
  if(!oaUserData)
    throw new Error(`No se pudo recuperar el objeto asegurado: ${RepoInsuredObject.msg}`);
}

function getCatalogValue(catalogName, filter, fieldName) {
  const resultado = doCmd({cmd: catalogName, data: { operation: "GET", filter: filter }});
  return resultado.outData?.[0]?.[fieldName];
}

function getTableValue(tableName, column, row, fieldName) {
  doCmd({"cmd":"GetTable","data":{"table":tableName,"column": column,"row": row,"getColumn": fieldName}});  
  return GetTable.outData ?? "";
}

function getMarca(value) {
  doCmd({"cmd":"GetFullTable","data":{"table":"tbMarcas"}});
  const resultado = GetFullTable.outData ?? [];
  const tabla = mapearTablaConfig(resultado)
  return tabla.find(x => x.cramo == policy.lob && x.cmarca == value).xmarca ?? "";
}

function getModelo(cmarca, cmodelo) {
  doCmd({"cmd":"GetFullTable","data":{"table":"tbModelos"}});
  const resultado = GetFullTable.outData ?? [];
  const tabla = mapearTablaConfig(resultado)
  return tabla.find(x => x.cramo == policy.lob && x.cmarca == cmarca && x.cmodelo == cmodelo).xmodelo ?? "";
}

function setLimites() {

  const tableName = "tbLimiteCobertura";

  doCmd({cmd :"GetFullTable", data: {table: tableName}});

   if(!GetFullTable.ok)
      throw new Error("Error leyendo configuración de límites");

  limites = mapearTablaConfig(GetFullTable.outData ?? []);
  limites = limites.filter(x => vEqual(x.Ramo) == vEqual(policy.lob));
  
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

  const date = toPanamaDate(value);

  // Validar fecha inválida
  if (isNaN(date.getTime())) return "";

  // Las fechas se persisten en UTC y el documento las presenta en horario de
  // Panamá (UTC-5), independientemente de la zona horaria del servidor.
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // meses 0-11
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

function toPanamaDate(value) {
  if (value === null || value === undefined || value === "") return new Date(NaN);

  const utcDate = value instanceof Date
    ? new Date(value.getTime())
    : createUtcDate(value);

  if (Number.isNaN(utcDate.getTime())) return new Date(NaN);

  // Panamá permanece en UTC-5 durante todo el año. Se usan getters UTC
  // sobre la fecha desplazada para no depender del servidor.
  return new Date(utcDate.getTime() - (5 * 60 * 60 * 1000));
}

function createUtcDate(value) {
  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(`${text}T00:00:00.000Z`);
  }

  const ymd = text.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/);
  if (ymd) {
    return new Date(Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])));
  }

  const dmy = text.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (dmy) {
    return new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])));
  }

  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(text)) {
    return new Date(text);
  }

  return new Date(`${text}Z`);
}

function fechaDocumento(value) {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date) return toFecha(value);

  const text = String(value).trim();
  // Los parámetros de adendos pueden llegar como input date o ISO UTC. Solo
  // esos patrones se convierten; texto, porcentajes y números quedan intactos.
  if (/^\d{4}-\d{2}-\d{2}(?:T|\s|$)/.test(text)) return toFecha(text);
  const local = /^(\d{2})[/-](\d{2})[/-](\d{4})(?:\s|T|$)/.exec(text);
  return local ? local[1] + "/" + local[2] + "/" + local[3] : value;
}

function formatearParametroAdendo(value) {
  if (value === null || value === undefined || value === "") return "";

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}(?:T|\s|$)/.test(text)
    || /^(\d{2})[/-](\d{2})[/-](\d{4})(?:\s|T|$)/.test(text)) {
    return fechaDocumento(value);
  }

  return /^-?\d+(?:[.,]\d+)?$/.test(text) ? n(text) : value;
}

function getHora(fecha) {
  // El formato de Ramo Técnico maneja la vigencia como fecha de negocio;
  // no debe mostrar la hora convertida desde UTC.
  return "12:00 AM";
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

function montoODefault(value) {
  return value === null || value === undefined || String(value).trim() === "" ? "" : n(value);
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

function setCurrency(currencyCode) {
  doCmd({"cmd":"RepoCurrency","data":{"operation":"GET","filter":"code = '"+currencyCode+"'"}});  
  currency = RepoCurrency.outData?.[0];
  if(!currency)
    throw new Error(`No se pudo recuperar la moneda de la póliza: ${RepoCurrency.msg}`);
  
}

function unirDireccion(address) {
  return [address?.address1, address?.address2]
    .map(v => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

function getCodigoOferta() {
  // En la emisión la póliza todavía tiene en base el código de oferta (con el prefijo); emitida, se le antepone el prefijo del producto.
  const codigo = String(policy.code ?? "").trim();
  if (!codigo) return policyId;
  let prefijo = "";
  try {
    doCmd({cmd: "RepoProduct", data: { operation: "GET", filter: `code = '${policy.productCode}'` }});
    const config = RepoProduct.outData?.[0]?.configJson;
    prefijo = String((typeof config === "string" ? JSON.parse(config) : config)?.Main?.proposalPrefix ?? "").trim();
  } catch (error) {
    prefijo = "";
  }
  return !prefijo || codigo.startsWith(prefijo) ? codigo : prefijo + codigo;
}

function getCuotasEsperadas() {
  // Misma regla que el plan de pagos del primer año: pagos por año según la periodicidad, acotados en contratos de meses.
  let cuotas = pagosPorAnio(policy.periodicity);
  const mesesContrato = Number(policy.durationMonths ?? 0);
  if (Number(policy.duration ?? 0) == 0 && mesesContrato > 0 && Number(policy.paymentDuration ?? 0) == 0 && cuotas > mesesContrato) cuotas = mesesContrato;
  return cuotas;
}

function pagosPorAnio(periodicidad) {
  const texto = String(periodicidad || "y");
  const base = { m: 12, q: 4, s: 2, y: 1, w: 52, d: 365 }[texto.substring(0, 1)] ?? 12;
  if (texto.length == 1) return base;
  const unidad = parseInt(texto.substring(1), 10);
  return Math.floor(base / (Number.isInteger(unidad) && unidad > 0 ? unidad : 1));
}

function esCoberturaClausula({ name, limit }) {
  if (!/^\s*(?:\d|NMA2919|HMACC)/i.test(String(name ?? ""))) return false;
  // Ramo 96: una cobertura numerada con límite propio es cobertura (todas las de RM lo son), no sólo una cláusula.
  return !(esRamoTecnico && Number(limit ?? 0) > 0);
}

function textoDeducible(texto) {
  // Las opciones del catálogo traen el grupo delante («G3|1% Valores en Riesgo…»); el documento muestra sólo la descripción.
  return String(texto ?? "").replace(/^[^|]*\|/, "").trim();
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
