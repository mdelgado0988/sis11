//block
//noreplace
/**
 * Name: cmdRecuperacionesPendientesCaja
 * Purpose: Recuperaciones de siniestro pendientes de cobrar en caja para un tipo de ingreso: las del tipo de
 *   recuperación que la tabla cfgTipoIngresoCajaRecuperacion relaciona con ese tipo de ingreso y que no tienen un pago
 *   aplicado por un ingreso de caja ejecutado y no reversado. La usan el formulario frmAplicacionRecuperacionCaja y la
 *   cadena cmdAplicarRecuperacionCaja.
 * Author: AIDEN (MSN-000219, AXX-10616)
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
var relacion = buscarRelacion(tipoIngreso);
if (!relacion) {
  return { ok: true, incomeType: tipoIngreso, tipoRecuperacion: null, nombreTipoRecuperacion: '', data: [] };
}

var salvageId = entero(entrada.salvageId);
var buyerId = entero(entrada.buyerId);
var claimId = entero(entrada.claimId);

var sql = [
  'SELECT s.id, s.claimId, c.code AS claimCode, p.code AS policyCode, c.occurrence, s.type, st.name AS typeName,',
  ' s.coverageId, cov.name AS coverageName, s.buyerId,',
  " LTRIM(RTRIM(CONCAT_WS(' ', b.name, b.middleName, b.surname1, b.surname2))) AS buyerName,",
  ' s.start, s.currency, s.income, s.expenses, s.netIncome',
  ' FROM Salvage s',
  ' JOIN Claim c ON c.id = s.claimId',
  ' LEFT JOIN LifePolicy p ON p.id = c.lifePolicyId',
  ' LEFT JOIN SalvageType st ON st.id = s.type',
  ' LEFT JOIN LifeCoverage cov ON cov.id = s.coverageId',
  ' LEFT JOIN Contact b ON b.id = s.buyerId',
  ' WHERE s.type = ' + relacion.tipo,
  ' AND s.netIncome > 0',
  " AND ISNULL(s.entityState, '') NOT IN ('CANCELLED', 'REVERTED')",
  salvageId > 0 ? ' AND s.id = ' + salvageId : '',
  buyerId > 0 ? ' AND s.buyerId = ' + buyerId : '',
  claimId > 0 ? ' AND s.claimId = ' + claimId : '',
  ' AND NOT EXISTS (SELECT 1 FROM IncomeExpense ie JOIN Transfer t ON t.id = ie.transferId',
  ' WHERE ie.salvageId = s.id AND ie.status = 1 AND t.status = 1 AND t.reversalDate IS NULL)',
  ' ORDER BY c.code, s.id'
].join('');

var respuesta = doCmd({ cmd: 'DoQuery', data: { sql: sql } });
if (!respuesta || respuesta.ok === false) {
  throw new Error('@No se pudieron leer las recuperaciones pendientes: ' + mensaje(respuesta));
}

return {
  ok: true,
  incomeType: tipoIngreso,
  tipoRecuperacion: relacion.tipo,
  nombreTipoRecuperacion: relacion.nombre,
  data: lista(respuesta.outData)
};
