//block
//noreplace
/**
 * Name: cmdValidaSaldoReservaOrden
 * Purpose: Interceptor chain of the repair orders. Refuses to create or edit a draft order (RepoRepairOrder ADD and UPDATE) and to confirm an order (ConfirmRepairOrder) when its total exceeds the available reserve balance of its claim coverage: the coverage reserve balance (reserve minus payments, EX excluded) minus what the other ACTIVE orders of the same claim and coverage still owe (approved minus settled). Drafts are competing quotes and do not count. Returns {ok, msg}.
 * Author: AIDEN mission configurator (MSN-000220, AXX-10617)
 */
/*
 * Input: the interceptor context { origin: { cmd, data } }.
 *  - RepoRepairOrder ADD: data.entity { claimId, coverageId, jLines }. UPDATE: data.entity { id, coverageId, jLines }; the claim is the
 *    stored one, as the command keeps it.
 *  - ConfirmRepairOrder: data.repairOrderId; the stored total is the amount that gets approved.
 * Output: { ok, msg }. ok false stops the command and the screen shows msg (Spanish, the language of the claim screens).
 * Rules:
 *  - Draft total = sum of round(qty x quotedPrice, 2), as the server prices the lines. A line without a quoted price takes its agreedPrice,
 *    or counts 0: the server resolves that price and the confirmation re-checks the stored total. A line with a negative quoted price
 *    is an adjustment (chain cmdAjustesOrdenCompra, MSN-000273) and subtracts, as it does from the saved total.
 *  - A request that is not an ADD, an UPDATE of a draft or the confirmation of a draft passes, and so does one without claim, coverage,
 *    lines or amount: the command's own validations answer it.
 *  - Equal to the available balance passes. A failure while reading refuses the operation (fails closed).
 * SQL justification: one or two parameterized read-only scalars (getScalar) per request: the order being confirmed or edited, and the
 *  reserve balance plus the outstanding balance of the active orders of one claim and coverage. No command is called, nothing is written.
 * History: 2026-11-19 v1 MSN-000220 (AXX-10617), globaluat. 2026-11-26 v1.1 MSN-000273 (AXX-11988): adjustment lines subtract.
 */
var comando = '';
try {
  var origen = (context && context.origin) || {};
  comando = String(origen.cmd || '');
  return validar(comando, origen.data || {});
} catch (e) {
  var detalle = e && e.message ? e.message : String(e);
  return { ok: false, msg: 'No se pudo verificar el saldo de la reserva de la orden de reparación (' + detalle + '). La operación no se realizó; intente de nuevo.' };
}

function validar(cmd, datos) {
  if (cmd === 'ConfirmRepairOrder') return validarConfirmacion(datos);
  if (cmd === 'RepoRepairOrder') {
    var op = String(datos.operation || '').toUpperCase();
    if (op === 'ADD' || op === 'UPDATE') return validarBorrador(op, datos.entity || {});
  }
  return { ok: true, msg: 'Sin validación de saldo de reserva para esta operación.' };
}

function validarConfirmacion(datos) {
  var id = entero(datos.repairOrderId);
  if (!(id > 0)) return { ok: true, msg: 'Sin orden que validar.' };
  var r = getScalar("TOP 1 CONCAT(o.claimId, '|', o.coverageId, '|', o.status, '|', ISNULL(o.total, 0), '|', ISNULL(o.currency, '')) FROM RepairOrder o WHERE o.id = @id", { id: id });
  if (r === null || r === undefined) return { ok: true, msg: 'Orden ' + id + ' no encontrada.' };
  var p = String(r).split('|');
  if (p[2] !== 'DRAFT') return { ok: true, msg: 'La orden RO-' + id + ' no está en borrador.' };
  var total = numero(p[3]);
  if (!(total > 0)) return { ok: true, msg: 'Orden sin importe que validar.' };
  return comparar({ claimId: entero(p[0]), coverageId: entero(p[1]), excluir: id, total: total, moneda: p[4], orden: id, accion: 'CONFIRM' });
}

function validarBorrador(op, e) {
  var id = entero(e.id);
  var claimId = entero(e.claimId);
  var coverageId = entero(e.coverageId);
  var moneda = '';
  if (op === 'UPDATE') {
    if (!(id > 0)) return { ok: true, msg: 'Sin orden que validar.' };
    var r = getScalar("TOP 1 CONCAT(o.claimId, '|', o.coverageId, '|', o.status, '|', ISNULL(o.currency, '')) FROM RepairOrder o WHERE o.id = @id", { id: id });
    if (r === null || r === undefined) return { ok: true, msg: 'Orden ' + id + ' no encontrada.' };
    var p = String(r).split('|');
    if (p[2] !== 'DRAFT') return { ok: true, msg: 'La orden RO-' + id + ' no está en borrador.' };
    claimId = entero(p[0]);
    if (!(coverageId > 0)) coverageId = entero(p[1]);
    moneda = p[3];
  }
  if (!(claimId > 0) || !(coverageId > 0)) return { ok: true, msg: 'Sin reclamo o cobertura que validar.' };
  var total = totalLineas(e.jLines);
  if (!(total > 0)) return { ok: true, msg: 'Orden sin importe que validar.' };
  return comparar({ claimId: claimId, coverageId: coverageId, excluir: op === 'UPDATE' ? id : 0, total: total, moneda: moneda, orden: op === 'UPDATE' ? id : 0, accion: op });
}

function comparar(o) {
  var r = getScalar("CONCAT(" +
    "ISNULL((SELECT SUM(p.reserved) FROM LifeCoveragePayout p WHERE p.claimId = @claimId AND p.lifeCoverageId = @coverageId AND (p.reserveType IS NULL OR p.reserveType <> 'EX')), 0), '|', " +
    "ISNULL((SELECT SUM(CASE WHEN ISNULL(o.approvedAmount, 0) > ISNULL(o.settledAmount, 0) THEN ISNULL(o.approvedAmount, 0) - ISNULL(o.settledAmount, 0) ELSE 0 END) FROM RepairOrder o " +
    "WHERE o.claimId = @claimId AND o.coverageId = @coverageId AND o.status = 'ACTIVE' AND o.id <> @excluir), 0), '|', " +
    "ISNULL((SELECT TOP 1 pol.currency FROM Claim cl JOIN LifePolicy pol ON pol.id = cl.lifePolicyId WHERE cl.id = @claimId), ''), '|', " +
    "ISNULL((SELECT STRING_AGG(CONCAT('RO-', o.id), ', ') WITHIN GROUP (ORDER BY o.id) FROM RepairOrder o WHERE o.claimId = @claimId AND o.coverageId = @coverageId " +
    "AND o.status = 'ACTIVE' AND o.id <> @excluir AND ISNULL(o.approvedAmount, 0) > ISNULL(o.settledAmount, 0)), ''), '|', " +
    "ISNULL((SELECT TOP 1 c.name FROM LifeCoverage c WHERE c.id = @coverageId), ''))",
    { claimId: o.claimId, coverageId: o.coverageId, excluir: o.excluir });
  if (r === null || r === undefined) return { ok: false, msg: 'No se pudo leer el saldo de la reserva de la cobertura. La operación no se realizó; intente de nuevo.' };
  var p = String(r).split('|');
  var reserva = numero(p[0]);
  var comprometido = numero(p[1]);
  var moneda = o.moneda || p[2] || '';
  var activas = p[3] || '';
  var cobertura = p.slice(4).join('|') || String(o.coverageId);
  var disponible = redondear(reserva - comprometido);
  if (redondear(o.total - disponible) <= 0) {
    return { ok: true, msg: 'Saldo de reserva suficiente: disponible ' + monto(disponible, moneda) + ', orden ' + monto(o.total, moneda) + '.' };
  }
  var quien = o.orden > 0 ? 'La orden RO-' + o.orden + ' por ' : 'La orden por ';
  var desglose = comprometido > 0
    ? ' (saldo de reserva ' + monto(reserva, moneda) + ' menos ' + monto(comprometido, moneda) + ' de órdenes activas: ' + activas + ')'
    : ' (saldo de reserva de la cobertura; no hay otras órdenes activas)';
  var resultado = o.accion === 'CONFIRM' ? 'No se confirmó la orden.'
    : (o.accion === 'UPDATE' ? 'No se guardaron los cambios de la orden.' : 'No se generó la orden.');
  return {
    ok: false,
    msg: 'Monto excede al saldo de reserva. ' + quien + monto(o.total, moneda) + ' supera el saldo disponible de la cobertura ' + cobertura +
      ': ' + monto(disponible > 0 ? disponible : 0, moneda) + desglose + '. ' + resultado + ' Aumente la reserva de la cobertura o reduzca el monto de la orden.'
  };
}

function totalLineas(j) {
  var lineas = j;
  if (typeof j === 'string') {
    if (!j.trim()) return 0;
    try { lineas = JSON.parse(j); } catch (x) { return 0; }
  }
  if (!Array.isArray(lineas)) return 0;
  var total = 0;
  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i] || {};
    var cantidad = numero(l.qty);
    var precio = numero(l.quotedPrice);
    if (precio < 0) {
      if (cantidad > 0) total += redondear(cantidad * precio);
      continue;
    }
    if (!(precio > 0)) precio = numero(l.agreedPrice);
    if (cantidad > 0 && precio > 0) total += redondear(cantidad * precio);
  }
  return redondear(total);
}

function numero(v) {
  var n = Number(v);
  return isFinite(n) ? n : 0;
}

function entero(v) {
  var n = parseInt(v, 10);
  return isFinite(n) ? n : 0;
}

function redondear(x) {
  var signo = x < 0 ? -1 : 1;
  return signo * Math.round(Math.abs(x) * 100 + 1e-7) / 100;
}

function monto(n, moneda) {
  var s = Math.abs(redondear(n)).toFixed(2);
  var entera = s.split('.')[0];
  var grupos = '';
  while (entera.length > 3) {
    grupos = ',' + entera.slice(-3) + grupos;
    entera = entera.slice(0, -3);
  }
  return (moneda ? moneda + ' ' : '') + (n < 0 ? '-' : '') + entera + grupos + '.' + s.split('.')[1];
}
