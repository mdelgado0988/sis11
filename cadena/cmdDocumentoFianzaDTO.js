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
const hoy = new Date();
const dia = hoy.getDate();
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const mes = meses[hoy.getMonth()];
const anio = hoy.getFullYear();

setPolicy();
setHolder();
setInsuredObject();

const dateIni = new Date(policy.start);
const diaIni = dateIni.getDate();
const mesIni = meses[dateIni.getMonth()];
const anioIni = dateIni.getFullYear();

const dateFin = new Date(policy.end);
const diaFin = dateFin.getDate();
const mesFin = meses[dateFin.getMonth()];
const anioFin = dateFin.getFullYear();

//Cargamos la información del reporte, agregar los nuevos campos necesarios para los próximos reportes
resultado.NumeroFianza = policy.code;
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

return resultado;

function setPolicy() {
  doCmd({cmd: "RepoLifePolicy", data: { operation: "GET", filter: `id = ${policyId}` }});
  policy = RepoLifePolicy.outData?.[0];
  if(!policy)
    throw new Error(`No se pudo recuperar la póliza: ${RepoLifePolicy.msg}`);
}

function setHolder() {
  doCmd({cmd: "GetContacts", data: { operation: "GET", filter: `id = ${policy.holderId}` }});
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

  const date = (value instanceof Date) ? value : new Date(value);

  // Validar fecha inválida
  if (isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // meses 0-11
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
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