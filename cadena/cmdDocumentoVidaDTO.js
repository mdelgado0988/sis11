//block
//noreplace

/*
  *@name: cmdDocumentoVidaDTO
  *@Purpose: Recupera el DTO para generación de documento de Vida (general)
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 11/05/2026
  *@Input: {policyId}
  *@Output: [{ resultado }]
*/

const policyId = context.policyId;
let policy;
let holder;
let seller;
let acreedor;
let insured;
let resultado = {};
let oaUserData;
let beneficiariesUserData;
let limites;
let parentescos = [];
const objectDefinitionCode = 'DT_ACCIDENTES_V1';
const beneficiariesObjectDefinitionCode = 'BENEFICIARIOS_VIDA';
const hoy = new Date();
const hoyPanama = toPanamaDate(hoy);
const dia = hoyPanama.getDate();
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const mes = meses[hoyPanama.getMonth()];
const anio = hoyPanama.getFullYear();
const celPhoneType = "PHONETYPE2";
const faxPhoneType = "PHONETYPE4";

const dataFrecuenciaPago = [
  { code: 'm', name: 'Mensual' },
  { code: 'q', name: 'Trimestral' },
  { code: 's', name: 'Semestral' },
  { code: 'y', name: 'Anual' }
];

const PlanConversion = [{ code: "EG1", plan: "Plan 1" }, { code: "EG2", plan: "Plan 2" }, { code: "EG3", plan: "Plan 3" } ,{ code: "EG4", plan: "Plan 4" } ,{ code: "EG5", plan: "Plan 5" },
                        { code: "PP1", plan: "Plan 1" }, { code: "PP2", plan: "Plan 2" }, { code: "APAM1", plan: "Plan 1" }, { code: "APAM2", plan: "Plan 2" }];

const titulosFacturacion = {
  PP1: "PÓLIZA DE VIDA INDIVIDUAL PRÉSTAMO PROTEGIDO 2015-1",
  PP2: "PÓLIZA DE VIDA INDIVIDUAL PRÉSTAMO PROTEGIDO 2015-1",
  TAR_PRO: "POLIZA DE VIDA TCP 2014-1",
  APAM1: "PÓLIZA DE ACCIDENTE PERSONALES DE JUBILADO PROTEGIDO 2015-1",
  APAM2: "PÓLIZA DE ACCIDENTE PERSONALES DE JUBILADO PROTEGIDO 2015-1"
};

setPolicy();
setHolder();
setSeller();
setInsured();
setInsuredObject();
setParentescos();
setLimites();
setAcreedor();
//return holder;

const dateIni = toPanamaDate(policy.start);
const diaIni = dateIni.getDate();
const mesIni = meses[dateIni.getMonth()];
const anioIni = dateIni.getFullYear();

const dateFin = toPanamaDate(policy.end);
const diaFin = dateFin.getDate();
const mesFin = meses[dateFin.getMonth()];
const anioFin = dateFin.getFullYear();

//Datos del pagador
resultado.Tenedor = getNombreCompleto(holder);
resultado.Direccion = holder.Addresses?.[0]?.address2 ?? "";
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
resultado.DiaNac = fnacimiento.getDate();
resultado.MesNac = fnacimiento.getMonth();
resultado.AnioNac = fnacimiento.getFullYear();
resultado.Asegurado = getNombreCompleto(insured);
resultado.FNacimiento = toFecha(insured.birth);
resultado.IdentificacionAseg = insured.isPerson == true ? insured.cnp : insured.nif;

//Datos del corredor
resultado.Corredor = getNombreCompleto(seller);
resultado.Corredor = resultado.Corredor == "" ? "No Tiene" : resultado.Corredor;

//Datos del cesionario
resultado.Acreedor = getNombreCompleto(acreedor);
resultado.Acreedor = resultado.Acreedor == "" ? "No Tiene" : resultado.Acreedor;

//Datos de la póliza
resultado.IdPoliza = policy.id;
resultado.Poliza = policy.code;
resultado.Certificado = 0;
resultado.Moneda = policy.currency;
resultado.Suma = n(policy.insuredSum);
resultado.SumaLetras = numeroALetras(policy.insuredSum ?? 0);
resultado.Desde = toFecha(policy.start);
resultado.Hasta = toFecha(policy.end);
resultado.Hora = "12:00 AM";
resultado.Observaciones = policy.description ?? "";
resultado.Frecuencia = dataFrecuenciaPago.find(x => x.code == policy.periodicity)?.name ?? "";
resultado.Plan = PlanConversion.find(x => x.code == policy.productCode).plan ?? policy.productCode;
resultado.Titulo = titulosFacturacion[policy.productCode] ?? "POLIZA DE VIDA";
resultado.Movimiento = policy.contractYear == 1 ? "Nueva" : "Renovación";

//Datos de montos 
resultado.Prima = n(policy.anualPremium ?? 0);
resultado.Impuesto = n(policy.tax ?? 0);
resultado.Total = n(policy.anualTotal ?? 0);
resultado.FormaPago = getCatalogValue("RepoPaymentMethodCatalog", `code = '${policy.paymentMethod ?? "-1"}'`, "name") ?? "";

//Datos del DT
resultado.EdadEmi = oaUserData?.txtEdadSuscripcion ?? "0";
resultado.Categoria = oaUserData?.CodigoCategoriaActividad ?? "0";
resultado.Cuotas = policy.PayPlan?.length ?? 0
resultado.Ocupacion = getTableValue("actividad", "cactividad", oaUserData?.cmbOcupacion ?? "0", "xactividad");
resultado.Cobtar = oaUserData?.hiddenCobtar ? JSON.parse(oaUserData.hiddenCobtar) : [];
const beneficiarios = obtenerBeneficiarios(
  beneficiariesUserData?.hiddenBeneficiarios,
  policy.start,
  parentescos
);
resultado.Beneficiarios = beneficiarios;
resultado.TotalPorcentajeBeneficiarios = n(
  beneficiarios.reduce((total, beneficiario) => total + aNumero(beneficiario.porcentaje), 0)
);

//Datos de las coberturas
resultado.Coberturas = policy.Coverages.map(({ code, name, limit, premium }) => {

  const evento = limites.find(
    x =>
      vEqual(x.Producto) == vEqual(policy.productCode) &&
      vEqual(x.Cobertura) == vEqual(code)
  )?.Limite ?? "";

  return {
    Codigo: code,
    Cobertura: name,
    Limite: n(limit),
    Prima: n(premium),
    Moneda: policy.currency,
    Evento: typeof evento === "string"
      ? evento.replace(/\{limite\}/gi, n(limit))
      : evento,
    Asegurados: resultado.Cobtar.find(x => x.coverageCode == code)?.Asegurados ?? ""
  };
});

//Fecha actual
resultado.DiaFecha = dia;
resultado.MesFecha = mes;
resultado.AnioFecha = anio;
resultado.FechaActual = toFecha(new Date());

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
  doCmd({cmd: "RepoLifePolicy", data: { operation: "GET", include: ["Insureds", "Coverages", "PayPlan"], filter: `id = ${policyId}` }});
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
  doCmd({cmd: "GetContacts", data: { operation: "GET", filter: `id = ${policy.MainInsured?.contactId ?? -1}` }});
  insured = GetContacts.outData?.[0];
  if(!insured)
    throw new Error(`No se pudo recuperar el asegurado de la póliza: ${GetContacts.msg}`);
}

function setInsuredObject() {
  oaUserData = loadInsuredObjectData(objectDefinitionCode, true);
  beneficiariesUserData = loadInsuredObjectData(beneficiariesObjectDefinitionCode, false);

  if(!oaUserData)
    throw new Error('No se pudo recuperar el objeto asegurado de accidentes personales');
}

function setParentescos() {
  const respuesta = doCmd({cmd: "RepoRelationshipCatalog", data: {
    operation: "GET",
    filter: "principalType = 'BENEFICIARY'"
  }});

  parentescos = (respuesta?.outData ?? []).map(item => ({
    id: item.id,
    name: decodificarHtml(item.name)
  }));
}

function loadInsuredObjectData(code, required) {
  doCmd({cmd: "RepoObjectDefinition", data: { operation: "GET", filter: `code = '${code}'` }});
  const objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;

  if (objectDefinitionId === 0) {
    if (required) {
      throw new Error(`No se encontró objeto asegurado definido: ${code}`);
    }
    return null;
  }

  doCmd({cmd: "RepoInsuredObject", data: {
    operation: "GET",
    filter: `lifePolicyId = ${policyId} AND objectDefinitionId = ${objectDefinitionId}`
  }});

  return RepoInsuredObject.outData?.[0]?.userData ?? null;
}

function obtenerBeneficiarios(valor, fechaInicioPoliza, catalogoParentescos) {
  try {
    if (!valor) return [];

    const parsed = typeof valor === "string" ? JSON.parse(valor) : valor;
    const lista = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.beneficiarios)
        ? parsed.beneficiarios
        : [];

    const periodoPoliza = obtenerPeriodoPoliza(fechaInicioPoliza);

    return lista.map((beneficiario, index) => {
      const datos = beneficiario && typeof beneficiario === "object"
        ? beneficiario
        : { Valor: beneficiario };
      const tieneIdentificacion = tieneIdentificacionBeneficiario(datos);
      const menorEdad = tieneIdentificacion ? "No" : "Si";
      const nombreParentesco = obtenerNombreParentesco(datos, catalogoParentescos);
      const datosSalida = {
        ...datos,
        parentesco: nombreParentesco || datos.parentesco || "",
        NombreParentesco: nombreParentesco,
        AnioPoliza: periodoPoliza.anio,
        MesPoliza: periodoPoliza.mes,
        menorEdad,
        porcentaje: n(datos.porcentaje ?? 0)
      };

      return {
        Numero: index + 1,
        ...datosSalida,
        Atributos: [
          ...Object.entries(datosSalida).map(([atributo, dato]) => ({
            Atributo: atributo,
            Valor: dato === null || dato === undefined
              ? ""
              : typeof dato === "object"
                ? JSON.stringify(dato)
                : String(dato)
          })),
        ]
      };
    });
  } catch (error) {
    return [];
  }
}

function obtenerNombreParentesco(datos, catalogoParentescos) {
  const id = datos.parentescoId ?? (
    datos.parentesco !== null && datos.parentesco !== undefined && /^\d+$/.test(String(datos.parentesco).trim())
      ? datos.parentesco
      : null
  );

  const parentesco = (catalogoParentescos ?? []).find(item => String(item.id) === String(id));
  return parentesco?.name ?? (
    datos.parentesco !== null && datos.parentesco !== undefined && !/^\d+$/.test(String(datos.parentesco).trim())
      ? String(datos.parentesco)
      : ""
  );
}

function obtenerPeriodoPoliza(fecha) {
  const fechaParseada = toPanamaDate(fecha);
  if (isNaN(fechaParseada.getTime())) return { anio: "", mes: "" };

  return {
    anio: fechaParseada.getFullYear(),
    mes: meses[fechaParseada.getMonth()] ?? ""
  };
}

function decodificarHtml(valor) {
  return String(valor ?? "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function aNumero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  const normalizado = String(valor ?? "").replace(/,/g, "").trim();
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

function tieneIdentificacionBeneficiario(datos) {
  const llave = Object.keys(datos).find(key => {
    const normalizada = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return /identific|document|cedula|pasaporte|passport|cnp|nif|dni/.test(normalizada);
  });

  const valor = llave ? datos[llave] : null;
  return valor !== null && valor !== undefined && String(valor).trim() !== "";
}

function getCatalogValue(catalogName, filter, fieldName) {
  const resultado = doCmd({cmd: catalogName, data: { operation: "GET", filter: filter }});
  return resultado.outData?.[0]?.[fieldName];
}

function getTableValue(tableName, column, row, fieldName) {
  doCmd({"cmd":"GetTable","data":{"table":"actividad","column": column,"row": row,"getColumn": fieldName}});
  return GetTable.outData ?? "";
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

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // meses 0-11
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getHora(fecha) {
  const date = toPanamaDate(fecha);

  if (isNaN(date)) return "";

  let horas = date.getHours();
  const minutos = String(date.getMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "pm" : "am";

  horas = horas % 12 || 12;

  return `${String(horas).padStart(2, "0")}:${minutos} ${periodo}`;
}

function toPanamaDate(value) {
  if (value === null || value === undefined || value === "") return new Date(NaN);

  const utcDate = value instanceof Date
    ? new Date(value.getTime())
    : crearFechaUtc(value);

  if (isNaN(utcDate.getTime())) return new Date(NaN);

  // Panamá permanece en UTC-5 durante todo el año.
  return new Date(utcDate.getTime() - (5 * 60 * 60 * 1000));
}

function crearFechaUtc(value) {
  const texto = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return new Date(`${texto}T00:00:00.000Z`);
  }

  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(texto)) {
    return new Date(texto);
  }

  return new Date(`${texto}Z`);
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
