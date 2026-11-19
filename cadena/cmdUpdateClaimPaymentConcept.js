//block
//noreplace
/**
 * Name: cmdUpdateClaimPaymentConcept
 * Purpose: Cambia solo el concepto de un pago de reclamo mientras no tenga solicitud de cheque (egreso). La invoca la vista 48, pestaña Pagos, opción «Modificar concepto». No toca montos, estado, reaseguro ni asientos contables.
 * Author: AIDEN (MSN-000211, AXX-10371)
 */
/*
 Input (context): { claimId, payoutId, concept, dryRun? }
 Output: { ok, msg, outData: { claimId, payoutId, previousConcept, concept, changed, dryRun } }
 Rules:
  - claimId y payoutId enteros positivos; concepto con texto y hasta 250 caracteres (el límite de «Registrar pago»).
  - El reclamo existe y no está finalizado (closed, etapa 7 o F), igual que la vista.
  - El movimiento es un pago del reclamo: reserveType IN y payed > 0 (ni reservas ni contrapartidas de reversión).
  - Estado 0 (pendiente de aprobación) o 1 (aprobado): 2 (revertido) y 3 (aplicado a solicitud) se rechazan.
  - Ninguna solicitud de cheque (ClaimPayment) referencia el movimiento, en ningún estado: ni por payoutId ni en jDetail.
  - Escribe solo la columna concept con SetField: RepoLifeCoveragePayout UPDATE correría los interceptores de alta de
    reservas, que tratan la edición como un movimiento nuevo. Relee el movimiento y compara montos y estado.
 SQL justification: lecturas LoadEntities acotadas por id del reclamo y del movimiento; una escritura SetField de una
  sola columna con un literal N'...' cuyas comillas simples se duplican.
 History: 1.0 2026-11-18 MSN-000211 (AXX-10371).
*/

var ctx = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
var maxLength = 250;

function fail(msg, extra) {
  return { ok: false, msg: msg, outData: extra || null };
}

function positiveId(value) {
  var n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

function load(entity, fields, filter) {
  doCmd({ cmd: 'LoadEntities', data: { entity: entity, fields: fields, filter: filter } });
  var response = LoadEntities;
  var raw = response && response.ok !== false ? response.outData : null;
  if (!raw || typeof raw.length !== 'number') {
    throw new Error('@No se pudo leer ' + entity + (response && response.msg ? ': ' + response.msg : '.'));
  }
  var rows = [];
  for (var i = 0; i < raw.length; i++) rows.push(raw[i]);
  return rows;
}

function linksPayout(request, payoutId) {
  if (positiveId(request.payoutId) === payoutId) return true;
  var text = request.jDetail === null || request.jDetail === undefined ? '' : String(request.jDetail).trim();
  if (!text) return false;
  var detail;
  try {
    detail = JSON.parse(text);
  } catch (error) {
    return new RegExp('"payoutId"\\s*:\\s*"?' + payoutId + '"?(?![0-9])').test(text);
  }
  var items = Object.prototype.toString.call(detail) === '[object Array]' ? detail : [detail];
  return items.some(function (item) { return !!item && positiveId(item.payoutId) === payoutId; });
}

function sameAmount(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.005;
}

try {
  var claimId = positiveId(ctx.claimId);
  var payoutId = positiveId(ctx.payoutId);
  var dryRun = ctx.dryRun === true;
  var concept = typeof ctx.concept === 'string' ? ctx.concept.split(String.fromCharCode(0)).join('').trim() : '';

  if (!claimId || !payoutId) return fail('Indique el reclamo y el pago cuyo concepto se modifica.');
  if (!concept) return fail('El concepto no puede quedar vacío.');
  if (concept.length > maxLength) return fail('El concepto admite hasta ' + maxLength + ' caracteres (tiene ' + concept.length + ').');

  var claims = load('Claim', 'id, closed, stageCode', 'id = ' + claimId);
  if (claims.length !== 1) return fail('No se encontró el reclamo ' + claimId + '.');
  var claim = claims[0];
  var stage = String(claim.stageCode === null || claim.stageCode === undefined ? '' : claim.stageCode).trim().toUpperCase();
  if (claim.closed === true || String(claim.closed).trim().toLowerCase() === 'true' || stage === '7' || stage === 'F') {
    return fail('El reclamo ' + claimId + ' está finalizado: el concepto de sus pagos ya no se modifica.');
  }

  var fields = 'id, claimId, reserveType, payed, reserved, status, concept';
  var payouts = load('LifeCoveragePayout', fields, 'id = ' + payoutId);
  if (payouts.length !== 1 || positiveId(payouts[0].claimId) !== claimId) {
    return fail('El pago ' + payoutId + ' no pertenece al reclamo ' + claimId + '.');
  }
  var before = payouts[0];
  if (String(before.reserveType || '').trim().toUpperCase() !== 'IN' || !(Number(before.payed) > 0)) {
    return fail('El movimiento ' + payoutId + ' no es un pago registrado: solo se modifica el concepto de un pago (no de una reserva ni de una reversión).');
  }
  var status = Number(before.status);
  if (status === 2) return fail('El pago ' + payoutId + ' está revertido: su concepto ya no se modifica.');
  if (status === 3) return fail('El pago ' + payoutId + ' ya está aplicado a una solicitud de cheque: su concepto no se puede modificar.');
  if (status !== 0 && status !== 1) return fail('El pago ' + payoutId + ' tiene un estado no reconocido (' + before.status + '): su concepto no se modifica.');

  var candidates = load('ClaimPayment', 'id, claimId, payoutId, entityState, jDetail',
    'payoutId = ' + payoutId + ' or claimId = ' + claimId + " or jDetail like '%" + payoutId + "%'");
  var linked = candidates.filter(function (request) { return linksPayout(request, payoutId); })
    .map(function (request) { return Number(request.id); });
  if (linked.length) {
    return fail('El pago ' + payoutId + ' ya tiene la solicitud de cheque ' + linked.join(', ') + ': su concepto no se puede modificar.',
      { claimId: claimId, payoutId: payoutId, requests: linked });
  }

  var previous = before.concept === null || before.concept === undefined ? '' : String(before.concept);
  var result = { claimId: claimId, payoutId: payoutId, previousConcept: previous, concept: concept, changed: false, dryRun: dryRun };
  if (previous === concept) return { ok: true, msg: 'El concepto no cambió.', outData: result };
  if (dryRun) return { ok: true, msg: 'Validación correcta (simulación): no se grabó nada.', outData: result };

  doCmd({ cmd: 'SetField', data: {
    entity: 'LifeCoveragePayout',
    entityId: payoutId,
    fieldValue: "concept = N'" + concept.split("'").join("''") + "'",
    raw: true
  } });
  if (!SetField || SetField.ok === false) {
    return fail('No se pudo guardar el concepto' + (SetField && SetField.msg ? ': ' + SetField.msg : '.'));
  }

  var after = load('LifeCoveragePayout', fields, 'id = ' + payoutId)[0];
  if (!after || String(after.concept === null || after.concept === undefined ? '' : after.concept) !== concept) {
    return fail('El servidor no confirmó el nuevo concepto del pago ' + payoutId + '.');
  }
  if (!sameAmount(after.payed, before.payed) || !sameAmount(after.reserved, before.reserved)
    || Number(after.status) !== status || positiveId(after.claimId) !== claimId) {
    return fail('El concepto se guardó, pero el movimiento ' + payoutId + ' no coincide con la lectura previa: revíselo.');
  }
  result.changed = true;
  return { ok: true, msg: 'Concepto del pago ' + payoutId + ' actualizado.', outData: result };
} catch (error) {
  return fail(String(error && error.message ? error.message : error).replace(/^@/, ''));
}
