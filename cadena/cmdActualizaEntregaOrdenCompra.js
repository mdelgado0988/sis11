//block
//noreplace
/**
 * Name: cmdActualizaEntregaOrdenCompra
 * Purpose: Guarda en una orden de reparación los dos datos del encabezado de su orden de compra que el usuario digita en la vista 48, «A nombre de» y «Entregar en». Quedan en la propia orden (notas, JSON {aNombreDe, entregarEn}) y se pueden cambiar en cualquier estado de la orden. cmdDocumentoOrdenCompraDTO los imprime; un dato vacío imprime el valor automático.
 * Author: AIDEN mission configurator (MSN-000221, AXX-10778)
 */
/*
 Input (context): { repairOrderId, aNombreDe?, entregarEn?, dryRun? }
 Output: { ok, msg, outData: { repairOrderId, aNombreDe, entregarEn, notes, changed, dryRun } }: lo que queda guardado.
 Rules:
  - repairOrderId entero positivo de una orden existente. Cualquier estado (borrador, activa, liquidada, cancelada): son datos
    del documento, no condiciones de la orden.
  - Texto libre de una línea (un nombre o una dirección): saltos de línea, tabuladores y caracteres de control quedan como un
    espacio, sin espacios al inicio ni al final, hasta 250 caracteres.
  - Un dato vacío o null se borra (el documento vuelve al valor automático); un dato no enviado conserva lo guardado.
  - Las notas conservan cualquier otro miembro que ya tuvieran; un texto que no era JSON se conserva como el miembro «notas»,
    y vuelve a quedar como texto cuando ya no hay datos de entrega.
  - Escribe solo la columna notes con SetField: RepoRepairOrder UPDATE solo edita borradores y vuelve a validar la orden.
    Relee la orden y compara lo guardado. Si dos personas guardan a la vez, queda lo último que se guardó.
 SQL justification: lecturas LoadEntities de una orden por id; una escritura SetField de una sola columna de esa orden con un
  literal N'...' cuyas comillas simples se duplican.
 History: 1.0 2026-11-20 MSN-000221 (AXX-10778), globaluat.
*/

var ctx = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
var maxLength = 250;
var labels = { aNombreDe: 'A nombre de', entregarEn: 'Entregar en' };

function fail(msg, extra) {
  return { ok: false, msg: msg, outData: extra || null };
}

function positiveId(value) {
  var n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

function textOf(value) {
  return value === null || value === undefined ? '' : String(value);
}

function cleanValue(value) {
  return textOf(value).replace(/[\u0000-\u001f\u007f-\u009f\s]+/g, ' ').trim();
}

function loadOrder(id) {
  doCmd({ cmd: 'LoadEntities', data: { entity: 'RepairOrder', fields: 'id, notes', filter: 'id = ' + id } });
  var response = LoadEntities;
  var raw = response && response.ok !== false ? response.outData : null;
  if (!raw || typeof raw.length !== 'number') {
    throw new Error('@No se pudo leer la orden RO-' + id + (response && response.msg ? ': ' + response.msg : '.'));
  }
  return raw.length ? raw[0] : null;
}

function parseNotes(notes) {
  var text = textOf(notes).trim();
  if (!text) return {};
  if (text.charAt(0) === '{') {
    try {
      var data = JSON.parse(text);
      if (data && typeof data === 'object' && Object.prototype.toString.call(data) !== '[object Array]') return data;
    } catch (error) {
      // texto libre que empieza con llave
    }
  }
  return { notas: textOf(notes) };
}

try {
  var repairOrderId = positiveId(ctx.repairOrderId);
  var dryRun = ctx.dryRun === true;
  if (!repairOrderId) return fail('Indique la orden de compra (repairOrderId).');

  var values = {};
  var sent = 0;
  for (var key in labels) {
    if (ctx[key] === undefined) continue;
    if (ctx[key] !== null && typeof ctx[key] !== 'string') return fail('«' + labels[key] + '» debe ser texto.');
    values[key] = cleanValue(ctx[key]);
    if (values[key].length > maxLength) {
      return fail('«' + labels[key] + '» admite hasta ' + maxLength + ' caracteres (tiene ' + values[key].length + ').');
    }
    sent++;
  }
  if (!sent) return fail('Indique «A nombre de» o «Entregar en».');

  var before = loadOrder(repairOrderId);
  if (!before) return fail('No existe la orden RO-' + repairOrderId + '.');
  var data = parseNotes(before.notes);
  for (var name in values) {
    if (values[name]) data[name] = values[name];
    else delete data[name];
  }
  var members = Object.keys(data);
  var notes = !members.length ? null
    : members.length === 1 && members[0] === 'notas' && typeof data.notas === 'string' ? data.notas : JSON.stringify(data);
  var previous = before.notes === null || before.notes === undefined ? null : String(before.notes);
  var result = { repairOrderId: repairOrderId, aNombreDe: cleanValue(data.aNombreDe), entregarEn: cleanValue(data.entregarEn),
    notes: notes, changed: false, dryRun: dryRun };
  if (notes === previous) return { ok: true, msg: 'Los datos de entrega de RO-' + repairOrderId + ' no cambiaron.', outData: result };
  if (dryRun) return { ok: true, msg: 'Validación correcta (simulación): no se grabó nada.', outData: result };

  doCmd({ cmd: 'SetField', data: {
    entity: 'RepairOrder',
    entityId: repairOrderId,
    fieldValue: notes === null ? 'notes = NULL' : "notes = N'" + notes.split("'").join("''") + "'",
    raw: true
  } });
  if (!SetField || SetField.ok === false) {
    return fail('No se pudieron guardar los datos de entrega de RO-' + repairOrderId + (SetField && SetField.msg ? ': ' + SetField.msg : '.'));
  }

  var after = loadOrder(repairOrderId);
  var saved = after && after.notes !== null && after.notes !== undefined ? String(after.notes) : null;
  if (saved !== notes) return fail('El servidor no confirmó los datos de entrega de RO-' + repairOrderId + '.');
  result.changed = true;
  return { ok: true, msg: 'Datos de entrega de RO-' + repairOrderId + ' guardados.', outData: result };
} catch (error) {
  return fail(String(error && error.message ? error.message : error).replace(/^@/, ''));
}
