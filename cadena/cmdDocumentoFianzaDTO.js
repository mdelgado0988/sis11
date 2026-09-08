//block
//noreplace

/*
  *@name: cmdDocumentoFianzaDTO
  *@Purpose: Recupera el DTO para generación de documento de fianza (general)
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 21/04/2026
  *@Input: {policyId}
  *@Output: [{ resultado }]
*/

const policyId = context.policyId;
let policy;
let holder;
let resultado = {};
let oaUserData;
const objectDefinitionCode = 'OBJFIANZA';
const telPhoneType = "PHONETYPE1";
const celPhoneType = "PHONETYPE2";
const faxPhoneType = "PHONETYPE4";
const emailType = "EMAILTYPE1";
let seller;
const hoy = new Date();
const partesHoy = partesFechaPanama(hoy);
const dia = partesHoy.dia;
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const mes = meses[partesHoy.mes - 1];
const anio = partesHoy.anio;

setPolicy();
setHolder();
setInsuredObject();
setSeller();

const dateIni = fechaComoUTC(policy.start);
const partesIni = partesFechaPanama(dateIni) || { dia: "", mes: 1, anio: "" };
const diaIni = partesIni.dia;
const mesIni = meses[partesIni.mes - 1];
const anioIni = partesIni.anio;

const dateFin = fechaComoUTC(policy.end);
const partesFin = partesFechaPanama(dateFin) || { dia: "", mes: 1, anio: "" };
const diaFin = partesFin.dia;
const mesFin = meses[partesFin.mes - 1];
const anioFin = partesFin.anio;

//Cargamos la información del reporte, agregar los nuevos campos necesarios para los próximos reportes
resultado.NumeroFianza = policy?.code ?? ""; //AXX-304 R2: poliza sin numero emitido -> vacio, no null
resultado.Tenedor = getNombreCompleto(holder);
resultado.AFavor = oaUserData?.nombre ?? "No Definido";
resultado.Descripcion = oaUserData?.desc_objeto_afianzado ?? "";
resultado.FechaActoPublico = toFecha(oaUserData?.f_acto_publico);
resultado.ActoPublico = oaUserData?.n_acto_publico ?? "";
resultado.Moneda = policy.currency;
resultado.Suma = n(policy.insuredSum);
resultado.SumaLetras = numeroALetras(policy.insuredSum ?? 0);
resultado.DiasVigencia = oaUserData?.txtDiasVigencia ?? 0;
resultado.NumeroContrato = oaUserData?.txtNumeroContrato ?? "0";

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

//=== AXX-304 / GLOB-1198 - marcadores de poliza_fianzas.docx (aditivo: no altera ninguna propiedad previa) ===
//Datos de contacto del tenedor (holder real de la poliza)
const dirTenedor = Array.isArray(holder?.Addresses) && holder.Addresses.length > 0 ? holder.Addresses[0] : null;
resultado.IdentificacionTenedor = (holder?.isPerson == true ? holder?.cnp : holder?.nif) ?? "";
resultado.DireccionTenedor = `${dirTenedor?.address1 ?? ""} ${dirTenedor?.address2 ?? ""}`.trim();
resultado.TelefonoTenedor = findByType(holder?.Phones, telPhoneType)?.num ?? holder?.phone ?? "";
resultado.CelularTenedor = findByType(holder?.Phones, celPhoneType)?.num ?? "";
resultado.FaxTenedor = findByType(holder?.Phones, faxPhoneType)?.num ?? "";
resultado.EmailTenedor = findByType(holder?.Emails, emailType)?.num ?? holder?.email ?? "";
resultado.PaisTenedor = getCatalogValue("RepoCountryCatalog", `code = '${escapeSql(dirTenedor?.country ?? "")}'`, "name") ?? "";
resultado.ProvinciaTenedor = getCatalogValue("RepoStateCatalog", `countryCode = '${escapeSql(dirTenedor?.country ?? "")}' AND code = '${escapeSql(dirTenedor?.state ?? "")}'`, "name") ?? "";
resultado.CiudadTenedor = getCatalogValue("RepoCityCatalog", `stateCode = '${escapeSql(dirTenedor?.state ?? "")}' AND code = '${escapeSql(dirTenedor?.city ?? "")}'`, "name") ?? "";

//Vigencia
resultado.Desde = toFecha(policy?.start);
resultado.Hasta = toFecha(policy?.end);

//Objeto asegurado: identificacion del contacto A Favor y numero de licitacion
resultado.IdentificacionAFavor = getIdentificacionAFavor();
resultado.Licitacion = oaUserData?.n_licitacion ?? "";

//Datos economicos de la poliza
resultado.Prima = n(policy?.annualPremium ?? 0);
resultado.Gastos = n(policy?.fee ?? 0);
resultado.Impuestos = n(policy?.tax ?? 0);
resultado.Total = n(policy?.annualTotal ?? 0);

//Encabezado del documento
resultado.TipoMovimiento = policy?.contractYear == 1 ? "Nuevo" : "Renovación";
resultado.Corredor = getNombreCompleto(seller) == "" ? "No Tiene" : getNombreCompleto(seller);
resultado.Oferta = policyId;

//Bloque repetible de coberturas
resultado.Coberturas = (Array.isArray(policy?.Coverages) ? policy.Coverages : [])
  .sort((a, b) => Number(a.number ?? 0) - Number(b.number ?? 0))
  .map(({ code, name, limit, premium }) => ({
    Codigo: code,
    Cobertura: name ?? "",
    Limite: n(limit),
    Prima: n(premium),
    Moneda: policy?.currency ?? ""
  }));
//=== fin AXX-304 ===


//=== AXX-304 R2 — un dato ausente sale vacio, nunca "undefined" en el documento ===
for (const clave of Object.keys(resultado)) {
  if (resultado[clave] === null || resultado[clave] === undefined) resultado[clave] = "";
}

return resultado;

function setPolicy() {
  doCmd({cmd: "RepoLifePolicy", data: { operation: "GET", include: ["Coverages"], filter: `id = ${policyId}` }});
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

  const parts = partesFechaPanama(fechaComoUTC(value));
  if (!parts) return "";
  return `${parts.dia}/${parts.mes}/${parts.anio}`;
}

function fechaComoUTC(value) {
  if (value instanceof Date) return value;
  const text = String(value ?? '').trim();
  if (!text) return null;

  // Las fechas de la BD sin zona se interpretan como UTC para evitar que
  // el huso horario del servidor cambie el dia del documento.
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(`${text}T12:00:00Z`);
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d{1,7})?)?$/.test(text)) {
    return new Date(`${text.replace(' ', 'T')}Z`);
  }
  return new Date(text);
}

function partesFechaPanama(value) {
  const date = value instanceof Date ? value : fechaComoUTC(value);
  if (!date || isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Panama',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const result = {};
  parts.forEach(part => {
    if (part.type === 'year') result.anio = Number(part.value);
    if (part.type === 'month') result.mes = Number(part.value);
    if (part.type === 'day') result.dia = Number(part.value);
  });
  return result;
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

function setSeller() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", filter: `id = ${Number(policy?.sellerId) || -1}` }});
  seller = (GetContacts.ok && Array.isArray(GetContacts.outData) ? GetContacts.outData[0] : null) || {};
}

function getIdentificacionAFavor() {
  const contacto = getContactoAFavor();
  if (contacto) return ((contacto.isPerson == true ? contacto.cnp : contacto.nif) ?? "");
  //AXX-304 R2: sin contacto resoluble se devuelve lo que la pantalla capturo, nunca undefined
  return oaUserData?.contacto_ruc ? oaUserData.contacto_ruc : (oaUserData?.rut ?? "");
}

function getContactoAFavor() {
  //1) vinculo explicito, cuando la pantalla lo informa
  const contactId = Number(oaUserData?.contactid);
  if (Number.isFinite(contactId) && contactId > 0) {
    doCmd({cmd: "GetContacts", data: { operation: "GET", filter: `id = ${contactId}` }});
    const porId = GetContacts.ok && Array.isArray(GetContacts.outData) ? GetContacts.outData[0] : null;
    if (porId) return porId;
  }
  //2) el "Codigo SIS" del objeto asegurado es el nif del contacto; solo se acepta si identifica a UNO
  const codigo = String(oaUserData?.rut ?? "").trim();
  if (codigo !== "") {
    doCmd({cmd: "GetContacts", data: { operation: "GET", filter: `nif = '${escapeSql(codigo)}'`, size: 2 }});
    const filas = GetContacts.ok && Array.isArray(GetContacts.outData) ? GetContacts.outData : [];
    if (filas.length === 1) return filas[0];
  }
  return null;
}

function findByType(list, type) {
  if (!Array.isArray(list)) return null;
  return list.find(item => item?.type == type) ?? null;
}

function escapeSql(value) {
  return String(value ?? '').replace(/'/g, "''");
}

function getCatalogValue(catalogName, filter, fieldName) {
  doCmd({cmd: catalogName, data: { operation: "GET", filter: filter }});
  const catalogResult = globalThis[catalogName];
  if (!catalogResult?.ok) return "";
  return catalogResult?.outData?.[0]?.[fieldName] ?? "";
}
