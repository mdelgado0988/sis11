//block
//noreplace

/*
  *@name: cmdDocumentoOrdenCompraDTO
  *@Purpose: Retrieves the DTO for the purchase order document «Orden de Compra» (Orden de Compra de Pieza y/o Servicios) of a claim repair order.
  *@Autor: AIDEN
  *@Email: aiden_ia@axxis-systems.com
  *@Created: 19/11/2026
  *@Input: {repairOrderId}
  *@Output: { resultado }
  *@Changes: MSN-000215 - Versión inicial. Plantilla «Orden de Compra.docx», acción PDF de la orden en la vista de reclamo 48. Lo que el sistema no registra sale vacío o en cero.
  *         MSN-000218 - Información de entrega (Entrega*: proveedor de la orden y notas de la orden) y bloque de firmas
  *         (RealizadaPor = quien creó la orden, AutorizadaPor = quien la confirmó, FechaImpresion dd/mm/aaaa en hora de Panamá;
  *         Firma* = firma de perfil uploaded/<email>.png de cada uno, encajada en 170x57 px, vacía si no la subió).
  *         MSN-000221 - ANombreDe y EntregarEn: los valores que el usuario guarda en la orden desde la vista 48 (cadena
  *         cmdActualizaEntregaOrdenCompra, notas de la orden como JSON {aNombreDe, entregarEn}); vacíos = proveedor y
  *         proveedor # reclamo, como antes. Notas y EntregaObservaciones = solo la nota libre de la orden.
*/

const repairOrderId = toValidNumber(context?.repairOrderId ?? context?.order?.id);
const monedaDocumento = "B/.";
const objectDefinitionCode = "DTAUT";
const estadosOrden = { DRAFT: "Borrador", ACTIVE: "Activa", LIQUIDATED: "Liquidada", CANCELLED: "Cancelada" };
const resultado = {};

if (!repairOrderId) {
  throw new Error("@Debe informar el repairOrderId para generar la orden de compra.");
}

const order = getOrder();
const provider = order.Provider || {};
const claim = getClaim(order.claimId);
const policyId = toValidNumber(order.lifePolicyId) || toValidNumber(claim.lifePolicyId);
const policy = getPolicy(policyId);
const oaUserData = getInsuredObject(policyId);

//Encabezado: «A nombre de» y «Entregar en» digitados en la orden (vista 48); vacíos, los automáticos.
const entrega = getEntrega(order.notes);
resultado.Fecha = toFechaMDY(order.confirmedOn || order.created);
resultado.ANombreDe = entrega.aNombreDe || textValue(provider.name);
resultado.EntregarEn = entrega.entregarEn || [textValue(provider.name), textValue(claim.code)].filter(v => v !== "").join(" # ");

//Orden
resultado.OrdenNo = "RO-" + order.id;
resultado.Estado = estadosOrden[order.status] || textValue(order.status);
resultado.Reclamo = textValue(claim.code);
resultado.Poliza = textValue(policy.code);
resultado.Asegurado = getInsuredName(policy);

//Vehículo
resultado.Marca = getMarca(oaUserData.cmbMarca);
resultado.Modelo = getModelo(oaUserData.cmbMarca, oaUserData.cmbModelo);
resultado.Anio = textValue(oaUserData.txtAnioAuto);
resultado.Placa = textValue(oaUserData.tbplaca);
resultado.Chasis = textValue(oaUserData.tbseriechasis) || textValue(oaUserData.tbVIN);
resultado.Motor = textValue(oaUserData.tbseriemotor);

//Detalle: la línea ITBMS viaja en jLines, pero se imprime en el campo separado del documento.
const lineas = parseLines(order.jLines);
let subTotal = 0;
let itbms = 0;
resultado.Lineas = lineas.filter(line => line && !esLineaItbms(line)).map(line => {
  const cant = toNumber(line?.qty);
  const totalLinea = roundMoney(line?.total !== null && line?.total !== undefined ? toNumber(line.total) : cant * toNumber(line?.quotedPrice));
  const precio = line?.quotedPrice ?? line?.agreedPrice ?? line?.publicPrice;
  const precioUnitario = precio !== null && precio !== undefined && precio !== "" ? toNumber(precio) : (cant ? totalLinea / cant : 0);
  subTotal = roundMoney(subTotal + totalLinea);
  return {
    Cant: formatQty(cant),
    Descripcion: [textValue(line?.categoryCode), textValue(line?.description)].filter(v => v !== "").join(" - "),
    PrecioUnitario: money(precioUnitario),
    Descuento: money(0),
    TotalLinea: money(totalLinea)
  };
});
lineas.filter(esLineaItbms).forEach(line => {
  const cant = toNumber(line?.qty);
  const totalLinea = line?.total !== null && line?.total !== undefined
    ? toNumber(line.total) : cant * toNumber(line?.quotedPrice);
  itbms = roundMoney(itbms + totalLinea);
});

const total = roundMoney(subTotal + itbms);
const deducible = 0;
resultado.Moneda = monedaDocumento;
resultado.SubTotal = money(subTotal);
resultado.Itbms = money(itbms);
resultado.Total = money(total);
resultado.Deducible = money(deducible);
resultado.PagoAseguradora = money(total - deducible);
resultado.Proveedor = textValue(provider.code);
resultado.Notas = entrega.notas;

//Información de entrega: lo que SisOS guarda del proveedor de la orden, y las notas de la orden.
const providerContact = getContact(provider.contactId);
resultado.EntregaLugar = textValue(provider.name);
resultado.EntregaDireccion = cleanText(provider.address) || uniqueJoin([provider.city, provider.state, provider.country], ", ");
resultado.EntregaTelefono = uniqueJoin([cleanText(provider.phone) || cleanText(providerContact.phone), provider.cell], " / ");
resultado.EntregaCorreo = cleanText(provider.email) || cleanText(providerContact.email);
resultado.EntregaObservaciones = entrega.notas;

//Firmas: quien creó la orden y quien la confirmó (vacío mientras es borrador), con su firma de perfil si la subió.
resultado.RealizadaPor = userName(order.user);
resultado.FechaImpresion = toFechaDMY(new Date().toISOString());
resultado.AutorizadaPor = userName(order.confirmedBy);
resultado.FirmaRealizadaPor = profileSignature(order.user);
resultado.FirmaAutorizadaPor = profileSignature(order.confirmedBy);

return resultado;

function getOrder() {
  doCmd({ cmd: "RepoRepairOrder", data: { operation: "GET", filter: `id = ${repairOrderId}`, include: ["Provider"] } });
  if (!RepoRepairOrder.ok) {
    throw new Error(`@No se pudo recuperar la orden RO-${repairOrderId}: ${RepoRepairOrder.msg}`);
  }
  const data = Array.isArray(RepoRepairOrder.outData) ? RepoRepairOrder.outData[0] : null;
  if (!data) {
    throw new Error(`@No existe la orden RO-${repairOrderId}.`);
  }
  return data;
}

//Notas de la orden: JSON {aNombreDe, entregarEn, notas?} guardado por cmdActualizaEntregaOrdenCompra, o una nota libre.
function getEntrega(notes) {
  const text = textValue(notes);
  const libre = { aNombreDe: "", entregarEn: "", notas: text };
  if (text.charAt(0) !== "{") return libre;
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) return libre;
    return { aNombreDe: textValue(data.aNombreDe), entregarEn: textValue(data.entregarEn), notas: textValue(data.notas) };
  } catch (error) {
    return libre;
  }
}

function getClaim(claimId) {
  const id = toValidNumber(claimId);
  if (!id) return {};
  doCmd({ cmd: "RepoClaim", data: { operation: "GET", filter: `id = ${id}` } });
  if (!RepoClaim.ok) return {};
  return (Array.isArray(RepoClaim.outData) ? RepoClaim.outData[0] : null) || {};
}

function getPolicy(id) {
  if (!id) return {};
  doCmd({ cmd: "RepoLifePolicy", data: { operation: "GET", include: ["Holder", "Insureds.Contact"], filter: `id = ${id}`, noTracking: true } });
  if (!RepoLifePolicy.ok) return {};
  return (Array.isArray(RepoLifePolicy.outData) ? RepoLifePolicy.outData[0] : null) || {};
}

function getInsuredObject(id) {
  if (!id) return {};
  doCmd({ cmd: "RepoObjectDefinition", data: { operation: "GET", filter: `code = '${objectDefinitionCode}'` } });
  const objectDefinitionId = RepoObjectDefinition.ok ? toValidNumber(RepoObjectDefinition.outData?.[0]?.id) : 0;
  if (!objectDefinitionId) return {};
  doCmd({ cmd: "RepoInsuredObject", data: { operation: "GET", filter: `lifePolicyId = ${id} AND objectDefinitionId = ${objectDefinitionId}` } });
  if (!RepoInsuredObject.ok) return {};
  const userData = RepoInsuredObject.outData?.[0]?.userData;
  if (!userData) return {};
  if (typeof userData === "string") {
    try { return JSON.parse(userData) || {}; } catch (e) { return {}; }
  }
  return userData;
}

function getInsuredName(policyValue) {
  const mainInsured = policyValue?.MainInsured;
  const fromInsured = textValue(mainInsured?.name) || contactName(mainInsured?.Contact);
  if (fromInsured) return fromInsured;
  const holder = policyValue?.Holder;
  return textValue(holder?.FullName) || contactName(holder);
}

function contactName(contact) {
  if (!contact) return "";
  return [contact.name, contact.middlename, contact.surname1, contact.surname2]
    .filter(v => typeof v === "string" && v.trim() !== "")
    .map(v => v.trim())
    .join(" ");
}

function getMarca(value) {
  const code = textValue(value);
  if (!code) return "";
  doCmd({ cmd: "GetFullTable", data: { table: "tbMarcas" } });
  if (!GetFullTable.ok) return "";
  const rows = normalizeFullTableRows(GetFullTable.outData);
  const match = rows.find(row => {
    if (Array.isArray(row)) {
      return String(row[1] ?? row[0] ?? "").trim() == code;
    }
    return String(row?.NUMEROMARCA ?? row?.numeromarca ?? row?.cmarca ?? row?.CMARCA ?? row?.code ?? "").trim() == code;
  });
  if (!match) return "";
  if (Array.isArray(match)) {
    return String(match[2] ?? match[1] ?? "").trim();
  }
  return String(match?.MARCA ?? match?.marca ?? match?.name ?? match?.description ?? "").trim();
}

function getModelo(cmarca, cmodelo) {
  const marca = textValue(cmarca);
  const modelo = textValue(cmodelo);
  if (!modelo) return "";
  doCmd({ cmd: "GetFullTable", data: { table: "tbModelos" } });
  if (!GetFullTable.ok) return "";
  const rows = normalizeFullTableRows(GetFullTable.outData);
  const match = rows.find(row => {
    if (Array.isArray(row)) {
      // tbModelos: ramo[0], marca[1], codigo[2], texto[3].
      return String(row[1] ?? "").trim() == marca && String(row[2] ?? "").trim() == modelo;
    }
    return String(row?.NUMEROMARCA ?? row?.numeromarca ?? row?.cmarca ?? row?.CMARCA ?? row?.marca ?? "").trim() == marca
      && String(row?.NUMEROMODELO ?? row?.numeromodelo ?? row?.cmodelo ?? row?.CMODELO ?? row?.modelo ?? "").trim() == modelo;
  });
  if (!match) return "";
  if (Array.isArray(match)) {
    return String(match[3] ?? match[2] ?? "").trim();
  }
  return String(match?.NOMBREMODELO ?? match?.nombremodelo ?? match?.name ?? "").trim();
}

function normalizeFullTableRows(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const firstRow = data[0];
  if (!Array.isArray(firstRow)) return data;
  const hasHeaderLikeValues = firstRow.every(item => typeof item === "string");
  return hasHeaderLikeValues ? data.slice(1) : data;
}

function parseLines(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function esLineaItbms(line) {
  const code = textValue(line?.cptCode || line?.code).toUpperCase();
  const category = textValue(line?.categoryCode || line?.category).toUpperCase();
  const description = textValue(line?.description).toUpperCase();
  return code === "ITBMS" || category === "IMPUESTOS" && /\bITBMS\b/.test(description);
}

function getContact(id) {
  const contactId = toValidNumber(id);
  if (!contactId) return {};
  doCmd({ cmd: "GetContacts", data: { filter: `id = ${contactId}`, size: 1 } });
  if (!GetContacts.ok) return {};
  return (Array.isArray(GetContacts.outData) ? GetContacts.outData[0] : null) || {};
}

// Nombre del usuario (Usr.nombre) en mayúsculas, como en el formato; el correo si no se encuentra.
function userName(email) {
  const id = textValue(email);
  if (!id) return "";
  doCmd({ cmd: "GetUsers", data: { filter: `email = '${id.replace(/'/g, "''")}'` } });
  const user = GetUsers.ok && Array.isArray(GetUsers.outData) ? GetUsers.outData[0] : null;
  return (textValue(user?.nombre) || id).toUpperCase();
}

// Firma de perfil (Mi perfil › Firma digital = uploaded/<email>.png) como valor de un tag de imagen de la plantilla:
// "<email>.png!ancho!alto" encajada en 170x57 px manteniendo la proporción; "" si el usuario no subió firma.
function profileSignature(email) {
  const id = textValue(email);
  if (!id) return "";
  const fileName = id + ".png";
  doCmd({ cmd: "GetFile", data: { fileName: "uploaded/" + fileName, decodeString: false } });
  const base64 = GetFile.ok ? GetFile.outData?.base64 : null;
  if (!base64) return "";
  const maxW = 170, maxH = 57;
  const size = imageSize(base64) || { w: maxW, h: maxH };
  const k = Math.min(1, maxW / size.w, maxH / size.h);
  return fileName + "!" + Math.max(1, Math.round(size.w * k)) + "!" + Math.max(1, Math.round(size.h * k));
}

// Ancho y alto en px de un PNG o JPEG en base64 (un .png puede ser JPEG por dentro); null si no se reconoce.
function imageSize(b64) {
  let b = base64Bytes(b64, 64);
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) {
    const w = ((b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]) >>> 0;
    const h = ((b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]) >>> 0;
    return w && h ? { w, h } : null;
  }
  if (b[0] === 0xFF && b[1] === 0xD8) {
    b = base64Bytes(b64, 400000);
    let i = 2;
    while (i + 9 < b.length && b[i] === 0xFF) {
      const m = b[i + 1];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        const h = (b[i + 5] << 8) | b[i + 6], w = (b[i + 7] << 8) | b[i + 8];
        return w && h ? { w, h } : null;
      }
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
  }
  return null;
}

function base64Bytes(b64, maxChars) {
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const s = String(b64 || "").replace(/^data:[^,]*,/, "").replace(/[^A-Za-z0-9+/]/g, "").slice(0, maxChars);
  const out = [];
  for (let i = 0; i + 3 < s.length; i += 4) {
    const n = (abc.indexOf(s[i]) << 18) | (abc.indexOf(s[i + 1]) << 12) | (abc.indexOf(s[i + 2]) << 6) | abc.indexOf(s[i + 3]);
    out.push((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  return out;
}

// Texto sin los "null"/"undefined" que dejan las concatenaciones de dirección del proveedor.
function cleanText(value) {
  return textValue(value).replace(/\b(null|undefined)\b/gi, " ").replace(/\s+/g, " ").replace(/^[\s,]+|[\s,]+$/g, "");
}

function uniqueJoin(values, separator) {
  const seen = [];
  values.map(cleanText).forEach(v => { if (v !== "" && seen.indexOf(v) < 0) seen.push(v); });
  return seen.join(separator);
}

function toFechaDMY(value) {
  const mdy = toFechaMDY(value);
  if (!mdy) return "";
  const parts = mdy.split("/");
  return `${parts[1]}/${parts[0]}/${parts[2]}`;
}

function toFechaMDY(value) {
  const text = textValue(value);
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return "";
  // Las fechas del repositorio están en UTC; Panamá es UTC-5 todo el año.
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
  const panama = new Date(utc - (5 * 60 * 60 * 1000));
  const month = String(panama.getUTCMonth() + 1).padStart(2, "0");
  const day = String(panama.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${panama.getUTCFullYear()}`;
}

function money(value) {
  const amount = roundMoney(toNumber(value));
  const parts = Math.abs(amount).toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (amount < 0 ? "-" : "") + parts.join(".");
}

function formatQty(value) {
  const qty = toNumber(value);
  return Number.isInteger(qty) ? String(qty) : String(Math.round(qty * 100) / 100);
}

function roundMoney(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toValidNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function textValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}
