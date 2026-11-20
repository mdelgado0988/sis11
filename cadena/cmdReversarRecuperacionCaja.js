//block
//noreplace
/**
 * Name: cmdReversarRecuperacionCaja
 * Purpose: Regla posterior de UndoTransfer y UnDoPaymentAllocation: cuando se reversa en caja un ingreso que cobró una
 *   recuperación de siniestro (cmdAplicarRecuperacionCaja), la recuperación vuelve a quedar pendiente: su movimiento de
 *   ingreso pasa a estado 0, sin ingreso de caja, con el neto y la moneda de la recuperación.
 * Author: AIDEN (MSN-000219, AXX-10616)
 */
/*
 * Entrada (context): { origin: { cmd, data } } del motor. UndoTransfer trae data.transferId; UnDoPaymentAllocation trae
 *   data.allocationId (se revisan los ingresos de esa aplicación). Para probar: transferId o allocationId en la raíz.
 * Sólo cambia movimientos IncomeExpense con salvageId, en estado 1, de un ingreso ya reversado (status 2 o con fecha de
 *   reversa). Reescribe la fila completa. Un movimiento con id 0 no se toca: el motor lo tomaría como fila nueva, chocaría
 *   con el índice único de salvageId y ese error dejaría la reversa de caja en error aunque ya se hizo; la consulta de
 *   pendientes igual lo ve pendiente porque su ingreso está reversado.
 * Salida: { ok, msg } con las recuperaciones que volvieron a pendiente.
 */
const entrada = context || {};
const datos = (entrada.origin && entrada.origin.data) || {};
const transferId = entero(datos.transferId !== undefined && datos.transferId !== null ? datos.transferId : entrada.transferId);
const allocationId = entero(datos.allocationId !== undefined && datos.allocationId !== null ? datos.allocationId : entrada.allocationId);

const ingresos = transferId > 0 ? [transferId] : (allocationId > 0 ? ingresosDeAplicacion(allocationId) : []);
if (ingresos.length === 0) return { ok: true, msg: 'Sin ingresos de caja que revisar.' };

const movimientos = cargar(
  'IncomeExpense',
  'id,name,isIncome,amount,currency,status,categoryCode,processId,paymentId,transferId,contactId,date,salvageId',
  'transferId IN (' + ingresos.join(',') + ') AND salvageId IS NOT NULL AND status = 1'
);
const devueltas = [];
const omitidas = [];
movimientos.forEach(mov => {
  const ingreso = cargar('Transfer', 'id,status,reversalDate', 'id = ' + entero(mov.transferId))[0];
  if (!ingreso || (Number(ingreso.status) !== 2 && !ingreso.reversalDate)) return;
  const salvageId = entero(mov.salvageId);
  if (entero(mov.id) <= 0) {
    omitidas.push(salvageId + ' (movimiento con id 0, no se puede reescribir)');
    return;
  }
  const recuperacion = cargar('Salvage', 'id,currency,netIncome', 'id = ' + salvageId)[0];
  const fila = Object.assign({}, mov, {
    name: 'Recuperación ' + salvageId + ' · pendiente: el ingreso de caja #' + entero(mov.transferId) + ' se reversó',
    status: 0,
    transferId: null,
    amount: recuperacion ? numero(recuperacion.netIncome) : numero(mov.amount),
    currency: recuperacion && recuperacion.currency ? recuperacion.currency : mov.currency
  });
  const r = doCmd({ cmd: 'RepoIncomeExpense', data: { operation: 'UPDATE', entity: fila } });
  if (!r || r.ok === false) {
    throw new Error('@No se pudo devolver a pendiente la recuperación ' + salvageId + ': ' + mensaje(r));
  }
  devueltas.push(salvageId + ' (ingreso de caja #' + entero(mov.transferId) + ')');
});

const partes = [];
if (devueltas.length) partes.push('Recuperaciones de nuevo pendientes: ' + devueltas.join(', ') + '.');
if (omitidas.length) partes.push('Sin cambios: ' + omitidas.join(', ') + '.');
return { ok: true, msg: partes.length ? partes.join(' ') : 'El ingreso reversado no cobraba recuperaciones.' };

function ingresosDeAplicacion(id) {
  return cargar('Transfer', 'id', 'allocationId = ' + id).map(t => entero(t.id)).filter(n => n > 0);
}

function cargar(entidad, campos, filtro) {
  const r = doCmd({ cmd: 'LoadEntities', data: { entity: entidad, fields: campos, filter: filtro } });
  if (!r || r.ok === false) throw new Error('@No se pudo leer ' + entidad + ': ' + mensaje(r));
  const filas = r.outData === undefined || r.outData === null ? [] : JSON.parse(JSON.stringify(r.outData));
  return Array.isArray(filas) ? filas : [];
}

function texto(valor) {
  return valor === undefined || valor === null ? '' : String(valor).trim();
}

// Entero no negativo escrito sólo con dígitos (admite 12.0 de los números del motor); -1 en cualquier otro caso.
function entero(valor) {
  const t = texto(valor).replace(/\.0+$/, '');
  return /^\d+$/.test(t) ? Number(t) : -1;
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function mensaje(respuesta) {
  return respuesta && respuesta.msg ? String(respuesta.msg) : 'sin respuesta';
}
