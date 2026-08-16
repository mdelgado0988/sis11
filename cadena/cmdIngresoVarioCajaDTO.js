//block
/*
    Name: cmdIngresoVarioCajaDTO
    Author: Michael Delgado.
    Created: 2026.02.0.04
    Purpose: Obtiene DTO para la contabilización de ingresos varios en caja.
    Test: { id: 386 }
*/

const transferId = Number(context && context.id || 0);

if (!Number.isFinite(transferId) || transferId <= 0) {
  throw new TypeError("@El id de la transferencia es requerido y debe ser válido");
}

doCmd({
  cmd: "LoadEntity",
  data: {
    entity: "Transfer",
    fields: "incomeType,amount,jIncomeTypeForm",
    filter: `id = ${transferId}`
  }
})

const transfer = LoadEntity && LoadEntity.outData ? LoadEntity.outData : {};
const incomeType = transfer.incomeType === undefined || transfer.incomeType === null
  ? "0"
  : String(transfer.incomeType);
const amount = toNumber(transfer.amount);
const incomeTypeForm = safeJson(transfer.jIncomeTypeForm, []);
const clientePAField = Array.isArray(incomeTypeForm)
  ? incomeTypeForm.find(field => field && field.name === "clientePA")
  : null;
const clientePA = clientePAField && Array.isArray(clientePAField.userData)
  ? clientePAField.userData[0]
  : clientePAField && clientePAField.userData !== undefined && clientePAField.userData !== null
    ? clientePAField.userData
    : null;

doCmd({
  cmd: "LoadEntity",
  data: {
    entity: "IncomeTypeCatalog",
    fields: "name,internalType",
    filter: `code = '${incomeType}'`
  }
})

const incomeTypeCatalog = LoadEntity && LoadEntity.outData ? LoadEntity.outData : {};
const incomeTypeName = incomeTypeCatalog.name === undefined || incomeTypeCatalog.name === null
  ? "Sin Asignar"
  : String(incomeTypeCatalog.name);
const internalType = String(incomeTypeCatalog.internalType || "").trim().toUpperCase();
const isSalvage = internalType === "SALVAGE";
const montoFactorNeto = isSalvage ? round2(amount / 1.07) : 0;
const montoFactor = isSalvage ? round2(montoFactorNeto * 0.07) : 0;
const netoCaja = montoFactorNeto !== 0 ? montoFactorNeto : amount;
const accountingRows = loadIncomeTypeAccountingConfig();
const accountingConfig = accountingRows
  .find(row => String(row.incomeType || "").trim() === incomeType.trim()) || {};
const factorAccountingConfig = isSalvage
  ? accountingRows.find(row => String(row.incomeType || "").trim() === "ITBS") || {}
  : {};
const debe = getText(accountingConfig.debe);
const habe = getText(accountingConfig.habe);
const cuentaITBS = getText(factorAccountingConfig.habe);
const xDebit = replaceClientPlaceholder(accountingConfig.xDebit, clientePA);
const xCredit = replaceClientPlaceholder(accountingConfig.xCredit, clientePA);

const reference = `Ingreso de caja # ${transferId}`;
const description = `Ingreso de caja # ${transferId} en concepto de ${incomeTypeName}`;

return [{
  id: transferId,
  incomeType: incomeType,
  reference: reference,
  description: description,
  amount: amount,
  tipo: incomeTypeName,
  clientePA: clientePA,
  debe: debe,
  habe: habe,
  cuentaITBS: cuentaITBS,
  xDebit: xDebit,
  xCredit: xCredit,
  MontoFactor: montoFactor,
  MontoFactorNeto: montoFactorNeto,
  netoCaja: netoCaja
}]

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function round2(value) {
  return Number(toNumber(value).toFixed(2));
}

function safeJson(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function loadIncomeTypeAccountingConfig() {
  doCmd({
    cmd: "GetFullTable",
    data: {
      table: "CuentaCajaIngresoVario"
    }
  });

  const response = typeof GetFullTable === "undefined" ? null : GetFullTable;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg
      ? response.msg
      : "No fue posible cargar la configuraciÃ³n contable de ingresos varios");
  }

  const tableRows = Array.isArray(response.outData) ? response.outData : [];
  if (tableRows.length === 0) return [];
  if (!Array.isArray(tableRows[0])) return tableRows;

  const headers = tableRows[0].map(header => getText(header));
  return tableRows.slice(1).map(row => {
    const values = Array.isArray(row) ? row : [];
    const mappedRow = {};

    headers.forEach((header, index) => {
      if (header) mappedRow[header] = values[index];
    });

    return mappedRow;
  });
}

function replaceClientPlaceholder(value, clientValue) {
  return getText(value).replace(/\[cliente\]/gi, getText(clientValue));
}

function getText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}
