//block
//noreplace
/**
 * Name: cmdAjustesOrdenCompra
 * Purpose: Permite líneas de ajuste en negativo en el detalle de una orden de reparación (precio cotizado menor que cero), para que la orden cuadre con la factura del proveedor. El servidor vuelve a cotizar o rechaza toda línea con precio 0 o menor, así que esta cadena corre en dos triggers de RepoRepairOrder ADD/UPDATE: antes del comando aparta los ajustes y deja pasar el resto; después de guardar el borrador los repone en su posición y baja el total.
 * Author: AIDEN mission configurator (MSN-000273, AXX-11988)
 */
/*
 Input: el contexto del trigger { origin }.
  - Antes (interceptor, origin sin outData): origin.data { operation, entity: { id?, jLines } }. Devuelve { ok, msg, merge }: merge
    reemplaza data.entity.jLines por las líneas sin ajustes y deja en data.ajustesOrden el plan para después ('' si no hay ajustes).
  - Después (trigger posterior, origin.ok y origin.outData): origin.data.ajustesOrden; la orden es origin.outData[0].id (o
    data.entity.id). Con context.dryRun calcula y no graba (solo para ensayos).
 Output: { ok, msg, outData }. ok false antes del comando lo detiene y la pantalla muestra msg.
 Rules:
  - Ajuste = línea con precio cotizado menor que cero. Cantidad mayor que cero, artículo existente del catálogo (su categoría es la
    del catálogo, como en las demás líneas), total = redondeo a 2 decimales de cantidad x precio, origen AJUSTE, sin precios de
    referencia. El ITBMS que calcula la pantalla ya usa el sub-total con los ajustes.
  - La orden necesita al menos una línea que no sea ajuste. Si todas las demás líneas traen precio, el total con ajustes debe ser
    mayor que cero; si alguna lo resuelve el servidor, lo comprueba la confirmación (total mayor que cero).
  - Después de guardar: las líneas guardadas deben ser las enviadas sin ajustes; los ajustes vuelven a su posición, se renumeran
    las líneas y total = total guardado + ajustes. Solo en borrador. Relee la orden y compara.
 SQL justification: una lectura parametrizada (getScalar) por ajuste para validar el artículo; lecturas LoadEntities de una orden
  por id; una escritura SetField de las columnas jLines y total de esa orden recién guardada, con un literal N'...' cuyas comillas
  simples se duplican y un número con dos decimales.
 History: 1.0 2026-11-26 MSN-000273 (AXX-11988), globaluat.
*/
var ctx = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
var origen = ctx.origin || {};
var posterior = origen.ok === true && Object.prototype.toString.call(origen.outData) === '[object Array]';
try {
  return posterior ? reponer(origen, ctx.dryRun === true) : apartar(origen);
} catch (error) {
  var detalle = String(error && error.message ? error.message : error).replace(/^@/, '');
  return { ok: false, msg: (posterior ? 'No se pudieron reponer los ajustes en negativo de la orden: ' : 'No se pudieron validar los ajustes en negativo de la orden: ') + detalle };
}

function apartar(o) {
  var datos = o.data || {};
  var op = String(datos.operation || '').toUpperCase();
  if (op !== 'ADD' && op !== 'UPDATE') return { ok: true, msg: 'Sin ajustes que apartar en esta operación.' };
  var e = datos.entity || {};
  var lineas = leerLineas(e.jLines);
  var sinAjustes = { ok: true, msg: 'La orden no trae ajustes en negativo.', merge: { data: { ajustesOrden: '' } } };
  if (!lineas) return sinAjustes;
  var resto = [];
  var ajustes = [];
  var conocido = 0;
  var completo = true;
  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i] || {};
    var precio = numero(l.quotedPrice);
    if (precio < 0) {
      ajustes.push({ pos: i, line: validarAjuste(l, i + 1) });
      continue;
    }
    resto.push(l);
    if (precio > 0 && numero(l.qty) > 0) conocido += redondear(numero(l.qty) * precio);
    else completo = false;
  }
  if (!ajustes.length) return sinAjustes;
  if (!resto.length) return { ok: false, msg: 'La orden solo tiene ajustes en negativo. Agregue al menos un artículo con su precio.' };
  var descuento = 0;
  for (var k = 0; k < ajustes.length; k++) descuento += ajustes[k].line.total;
  var total = redondear(conocido + descuento);
  if (completo && !(total > 0)) {
    return { ok: false, msg: 'Con los ajustes en negativo el total de la orden quedaría en ' + total.toFixed(2) + '. El total debe ser mayor que cero.' };
  }
  var plan = { lineas: lineas.length, ajustes: ajustes };
  return {
    ok: true,
    msg: ajustes.length + ' ajuste(s) en negativo por ' + redondear(descuento).toFixed(2) + ' apartados; se reponen al guardar la orden.',
    merge: { data: { entity: { jLines: JSON.stringify(resto) }, ajustesOrden: JSON.stringify(plan) } }
  };
}

function validarAjuste(l, num) {
  var cantidad = numero(l.qty);
  if (!(cantidad > 0)) throw new Error('@Línea ' + num + ': la cantidad del ajuste debe ser mayor que cero.');
  var codigo = String(l.cptCode || '').trim();
  if (!codigo) throw new Error('@Línea ' + num + ': indique el artículo del ajuste.');
  var r = getScalar("TOP 1 CONCAT(ISNULL(c.parent, ''), '|', ISNULL(c.description, '')) FROM Cpt c WHERE c.code = @code", { code: codigo });
  if (r === null || r === undefined) throw new Error('@Línea ' + num + ': el artículo ' + codigo + ' no existe.');
  var p = String(r).split('|');
  var precio = numero(l.quotedPrice);
  var descripcion = String(l.description || '').trim() || p.slice(1).join('|');
  return {
    categoryCode: p[0] || l.categoryCode || null,
    cptCode: codigo,
    description: descripcion,
    qty: cantidad,
    quotedPrice: precio,
    publicPrice: null,
    agreedPrice: null,
    priceSource: 'AJUSTE',
    overAgreed: false,
    overPublic: false,
    total: redondear(cantidad * precio)
  };
}

function reponer(o, simulacion) {
  var datos = o.data || {};
  var texto = String(datos.ajustesOrden || '');
  if (!texto) return { ok: true, msg: 'La orden no trae ajustes en negativo.' };
  var plan = JSON.parse(texto);
  var ajustes = plan && plan.ajustes;
  if (!ajustes || !ajustes.length) return { ok: true, msg: 'La orden no trae ajustes en negativo.' };
  var primera = o.outData[0] || {};
  var id = entero(primera.id) || entero(datos.entity && datos.entity.id);
  if (!(id > 0)) throw new Error('@no se identificó la orden guardada.');
  var orden = leerOrden(id);
  if (!orden) throw new Error('@la orden RO-' + id + ' no existe.');
  if (orden.status !== 'DRAFT') throw new Error('@la orden RO-' + id + ' no está en borrador.');
  var guardadas = leerLineas(orden.jLines) || [];
  if (guardadas.length !== entero(plan.lineas) - ajustes.length) {
    throw new Error('@RO-' + id + ' guardó ' + guardadas.length + ' línea(s) y se esperaban ' + (entero(plan.lineas) - ajustes.length) + '.');
  }
  var porPosicion = {};
  var descuento = 0;
  for (var k = 0; k < ajustes.length; k++) {
    porPosicion[ajustes[k].pos] = ajustes[k].line;
    descuento += numero(ajustes[k].line.total);
  }
  var finales = [];
  var siguiente = 0;
  for (var i = 0; i < entero(plan.lineas); i++) {
    var linea = porPosicion[i] ? porPosicion[i] : guardadas[siguiente++];
    linea = Object.assign({}, linea, { num: finales.length + 1 });
    finales.push(linea);
  }
  var total = redondear(numero(orden.total) + descuento);
  var jLines = JSON.stringify(finales);
  var resultado = { repairOrderId: id, lines: finales.length, adjustments: ajustes.length, adjustmentTotal: redondear(descuento),
    savedTotal: numero(orden.total), total: total, dryRun: simulacion };
  if (simulacion) return { ok: true, msg: 'Simulación: RO-' + id + ' quedaría con total ' + total.toFixed(2) + '. No se grabó nada.', outData: resultado };
  doCmd({ cmd: 'SetField', data: {
    entity: 'RepairOrder',
    entityId: id,
    fieldValue: "jLines = N'" + jLines.split("'").join("''") + "', total = " + total.toFixed(2),
    raw: true
  } });
  if (!SetField || SetField.ok === false) throw new Error('@' + (SetField && SetField.msg ? SetField.msg : 'el servidor no grabó la orden.'));
  var despues = leerOrden(id);
  if (!despues || String(despues.jLines) !== jLines || redondear(numero(despues.total)) !== total) {
    throw new Error('@el servidor no confirmó las líneas y el total de RO-' + id + '.');
  }
  return { ok: true, msg: 'RO-' + id + ': ' + ajustes.length + ' ajuste(s) en negativo repuestos, total ' + total.toFixed(2) + '.', outData: resultado };
}

function leerOrden(id) {
  doCmd({ cmd: 'LoadEntities', data: { entity: 'RepairOrder', fields: 'id, status, total, jLines', filter: 'id = ' + id } });
  var respuesta = LoadEntities;
  var filas = respuesta && respuesta.ok !== false ? respuesta.outData : null;
  if (!filas || typeof filas.length !== 'number') {
    throw new Error('@no se pudo leer la orden RO-' + id + (respuesta && respuesta.msg ? ': ' + respuesta.msg : '.'));
  }
  return filas.length ? filas[0] : null;
}

function leerLineas(j) {
  if (typeof j !== 'string' || !j.trim()) return null;
  var lineas;
  try { lineas = JSON.parse(j); } catch (x) { return null; }
  return Object.prototype.toString.call(lineas) === '[object Array]' ? lineas : null;
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
