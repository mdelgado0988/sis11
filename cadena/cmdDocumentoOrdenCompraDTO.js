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

//Encabezado
resultado.Fecha = toFechaMDY(order.confirmedOn || order.created);
resultado.ANombreDe = textValue(provider.name);
resultado.EntregarEn = [textValue(provider.name), textValue(claim.code)].filter(v => v !== "").join(" # ");

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
resultado.Notas = textValue(order.notes);

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
