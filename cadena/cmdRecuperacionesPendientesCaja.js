//block
//noreplace
/**
 * Name: cmdRecuperacionesPendientesCaja
 * Purpose: Saldo de recuperaciones a partir de los recibos de caja ejecutados, con su signo.
 *   MSN-000244: un abono parcial no oculta la recuperación; includeSettled permite ajustes negativos.
 *   mode CLAIM devuelve todas las recuperaciones del reclamo para la vista, sin filtros de tipo o estado.
 *   UndoTransfer desactiva el original; UnDoPaymentAllocation conserva original y contrapartida.
 * Author: AIDEN (MSN-000219, MSN-000244)
 */
var TABLA = 'cfgTipoIngresoCajaRecuperacion';

function texto(valor) {
  return valor === undefined || valor === null ? '' : String(valor).trim();
}

function lista(valor) {
  if (valor === undefined || valor === null) return [];
  var copia = JSON.parse(JSON.stringify(valor));
  return Array.isArray(copia) ? copia : [];
}

function entero(valor) {
  var t = texto(valor);
  return /^\d+$/.test(t) ? Number(t) : -1;
}

function mensaje(respuesta) {
  return respuesta && respuesta.msg ? String(respuesta.msg) : 'sin respuesta';
}

function buscarRelacion(codigo) {
  if (!codigo) return null;
  var tabla = doCmd({ cmd: 'GetFullTable', data: { table: TABLA } });
  if (!tabla || tabla.ok === false) {
    throw new Error('@No se pudo leer la tabla ' + TABLA + ': ' + mensaje(tabla));
  }
  var filas = lista(tabla.outData);
  var encabezado = lista(filas[0]).map(texto);
  var colIngreso = encabezado.indexOf('tipoIngreso');
  var colTipo = encabezado.indexOf('tipoRecuperacion');
  var colNombre = encabezado.indexOf('nombreTipoRecuperacion');
  if (colIngreso < 0 || colTipo < 0) {
    throw new Error('@La tabla ' + TABLA + ' no tiene las columnas tipoIngreso y tipoRecuperacion.');
  }
  for (var i = 1; i < filas.length; i++) {
    var fila = lista(filas[i]);
    if (texto(fila[colIngreso]) !== codigo) continue;
    var tipo = entero(fila[colTipo]);
    if (tipo < 0) {
      throw new Error('@La tabla ' + TABLA + ' relaciona el tipo de ingreso ' + codigo + ' con un tipo de recuperación inválido.');
    }
    return { tipo: tipo, nombre: colNombre >= 0 ? texto(fila[colNombre]) : '' };
  }
  return null;
}

var entrada = context || {};
var tipoIngreso = texto(entrada.incomeType);
var claimMode = texto(entrada.mode).toUpperCase() === 'CLAIM';
var salvageId = entero(entrada.salvageId);
var buyerId = entero(entrada.buyerId);
var claimId = entero(entrada.claimId);
// MSN-000245: preserve effective-client lookup, including the claimant for a deductible without a buyer.
var clienteSql = 'CASE WHEN s.buyerId > 0 THEN s.buyerId WHEN s.type = 1 AND c.contactId > 0 THEN c.contactId ELSE NULL END';
if (claimMode && claimId <= 0) throw new Error('@La consulta de saldos requiere un reclamo válido.');
var relacion = claimMode ? null : buscarRelacion(tipoIngreso);
if (!claimMode && !relacion) {
  return { ok: true, incomeType: tipoIngreso, tipoRecuperacion: null, nombreTipoRecuperacion: '', data: [] };
}

// Each receipt belongs to its saved recovery. The scalar link is a fallback only for legacy/native receipts
// without a valid saved identifier. It is preserved by the projection; DISTINCT prevents duplicate counting.
// JSON guards cover malformed old forms and both scalar and array userData representations.
// Untagged legacy links count only while unreversed: an allocation's untagged inverse has no recovery binding.
var sql = [
  'WITH Selected AS (',
  ' SELECT s.id, s.claimId, c.code AS claimCode, p.code AS policyCode, c.occurrence, s.type, st.name AS typeName,',
  ' s.coverageId, cov.name AS coverageName, s.buyerId,',
  " LTRIM(RTRIM(CONCAT_WS(' ', b.name, b.middleName, b.surname1, b.surname2))) AS buyerName,",
  ' ' + clienteSql + ' AS clientId,',
  " LTRIM(RTRIM(CONCAT_WS(' ', cl.name, cl.middleName, cl.surname1, cl.surname2))) AS clientName,",
  ' s.start, s.currency, s.income, s.expenses, s.netIncome',
  ' FROM Salvage s JOIN Claim c ON c.id=s.claimId',
  ' LEFT JOIN LifePolicy p ON p.id=c.lifePolicyId',
  ' LEFT JOIN SalvageType st ON st.id=s.type',
  ' LEFT JOIN LifeCoverage cov ON cov.id=s.coverageId',
  ' LEFT JOIN Contact b ON b.id=s.buyerId',
  ' LEFT JOIN Contact cl ON cl.id=' + clienteSql + ' WHERE 1=1',
  claimMode ? '' : ' AND s.type=' + relacion.tipo + ' AND s.netIncome>0',
  claimMode ? '' : " AND ISNULL(s.entityState,'') NOT IN ('CANCELLED','REVERTED')",
  salvageId > 0 ? ' AND s.id=' + salvageId : '',
  !claimMode && buyerId > 0 ? ' AND ' + clienteSql + '=' + buyerId : '',
  claimId > 0 ? ' AND s.claimId=' + claimId : '',
  '), ReceiptPayload AS (',
  ' SELECT t.id,t.amount,t.currency,t.status,t.reversalDate,ie.salvageId AS legacySalvageId,',
  " COALESCE(JSON_VALUE(f.field,'$.userData[0]'),JSON_QUERY(f.field,'$.userData[0]'),",
  " JSON_VALUE(f.field,'$.userData')) AS selection",
  ' FROM Transfer t LEFT JOIN IncomeExpense ie ON ie.transferId=t.id',
  ' OUTER APPLY (SELECT TOP 1',
  " CASE WHEN j.type=5 THEN j.value ELSE '{}' END AS field",
  " FROM OPENJSON(CASE WHEN ISJSON(t.jIncomeTypeForm)=1 THEN t.jIncomeTypeForm ELSE '[]' END) j",
  " WHERE JSON_VALUE(CASE WHEN j.type=5 THEN j.value ELSE '{}' END,'$.name')='hiddenRecuperacion'",
  ' ORDER BY TRY_CONVERT(int,j.[key])) f',
  ' WHERE t.executed=1 AND t.isExternal=1 AND t.sourceAccountId IS NULL',
  '), ReceiptIds AS (',
  ' SELECT r.*,TRY_CONVERT(decimal(18,4),COALESCE(',
  " JSON_VALUE(CASE WHEN ISJSON(r.selection)=1 THEN r.selection ELSE '{}' END,'$.id'),r.selection)) AS selectedId",
  ' FROM ReceiptPayload r',
  '), ReceiptLinks AS (',
  ' SELECT DISTINCT r.id,r.amount,r.currency,COALESCE(',
  ' CASE WHEN r.selectedId>0 AND r.selectedId=FLOOR(r.selectedId) THEN TRY_CONVERT(int,r.selectedId) END,',
  ' CASE WHEN r.status=1 AND r.reversalDate IS NULL THEN r.legacySalvageId END) AS salvageId FROM ReceiptIds r',
  '), Ledger AS (',
  ' SELECT s.id,SUM(CASE WHEN r.currency=s.currency THEN r.amount ELSE 0 END) AS paidAmount,',
  ' COUNT(r.id) AS paymentCount,',
  ' SUM(CASE WHEN r.id IS NOT NULL AND r.currency<>s.currency THEN 1 ELSE 0 END) AS currencyMismatchCount',
  ' FROM Selected s LEFT JOIN ReceiptLinks r ON r.salvageId=s.id GROUP BY s.id)',
  ' SELECT s.*,COALESCE(l.paidAmount,0) AS paidAmount,',
  ' s.netIncome-COALESCE(l.paidAmount,0) AS pendingAmount,',
  ' COALESCE(l.paymentCount,0) AS paymentCount,COALESCE(l.currencyMismatchCount,0) AS currencyMismatchCount',
  ' FROM Selected s LEFT JOIN Ledger l ON l.id=s.id',
  ' ORDER BY s.claimCode,s.id'
].join('');

var respuesta = doCmd({ cmd: 'DoQuery', data: { sql: sql } });
if (!respuesta || respuesta.ok === false) {
  throw new Error('@No se pudieron leer los saldos de recuperaciones: ' + mensaje(respuesta));
}
var filas = lista(respuesta.outData).map(function (fila) {
  fila.paidAmount = Number(Number(fila.paidAmount).toFixed(2));
  fila.pendingAmount = Number(Number(fila.pendingAmount).toFixed(2));
  fila.paymentCount = Number(fila.paymentCount);
  fila.currencyMismatchCount = Number(fila.currencyMismatchCount);
  return fila;
});
if (!claimMode && entrada.includeSettled !== true && salvageId <= 0) {
  filas = filas.filter(function (fila) { return fila.pendingAmount > 0; });
}
return {
  ok: true,
  incomeType: tipoIngreso,
  tipoRecuperacion: relacion ? relacion.tipo : null,
  nombreTipoRecuperacion: relacion ? relacion.nombre : '',
  data: filas
};
