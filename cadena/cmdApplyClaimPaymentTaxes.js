//block
//noreplace
/**
 * Name: cmdApplyClaimPaymentTaxes
 * Purpose: Aplica impuestos, retenciones y deducciones del catálogo de impuestos a la solicitud de cheque de un pago de reclamo
 *  recién creada por DoClaimPayment, igual que Egresos: guarda las líneas de detalle y deja el total en el neto
 *  (bruto + impuestos - retenciones - deducciones). La invoca el trigger trgImpuestosSolicitudChequeDoClaimPayment cuando la
 *  vista 48 (pestaña Pagos, «Solicitud de cheque») envía paymentTaxes con DoClaimPayment; con generateDocument genera después
 *  «Solcitud de Pago.docx», como el trigger 29.
 * Author: AIDEN (MSN-000212, AXX-10554)
 */
/*
 Input (context): { claimId, total, jDetail, paymentTaxes: [{ valueAddedCode, amount }], paymentId?, dryRun?, generateDocument? }
  - total y jDetail son los de DoClaimPayment: el monto bruto y su único movimiento de pago.
  - Sin paymentId se toma la última solicitud de ese reclamo y movimiento creada en los últimos 10 minutos.
 Output: { ok, msg, outData: { paymentId, grossAmount, taxes, retentions, deductions, total, lines, dryRun,
   paymentTaxesApplied, documentGenerated, documentMsg } }
 Rules:
  - Solo tipos TAX, RET y DED del catálogo, sin códigos repetidos, hasta 20 líneas.
  - Monto de la línea: el escrito por el usuario si el tipo es editable (ConfigProfile Payment.editableTaxTypes; por omisión
    DED, RETSALV y ADDSALV, como Egresos); si no, tasa x monto bruto. Redondeo a 2 decimales; todo monto mayor que cero.
  - Neto = bruto + impuestos - retenciones - deducciones, mayor que cero.
  - El movimiento es un pago (reserveType IN) del reclamo. La solicitud no está fusionada ni cerrada, su total es el bruto y
    no tiene impuestos, retenciones, deducciones ni líneas de detalle.
  - Lee la fila completa con LoadEntity (sin seguimiento de EF) y escribe con RepoClaimPayment UPDATE, lo mismo que «Editar
    egreso». Relee montos y líneas.
  - Debe correr en un contexto propio: el trigger es de tipo comando (actionType 0). En el contexto de DoClaimPayment la
    solicitud nueva ya está en seguimiento y el UPDATE falla.
  - Si el documento no se genera, los montos quedan aplicados: documentGenerated=false y documentMsg dicen por qué.
 History: 1.0 2026-11-19 MSN-000212 (AXX-10554). 1.1 2026-11-19: generateDocument; corre en el contexto propio del trigger.
*/

var ctx = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
var supportedTypes = ['TAX', 'RET', 'DED'];
var closedStates = ['EXECUTED', 'REVERTED', 'REJECTED', 'CANCELLED', 'CANCELED', 'MERGED'];

function fail(msg, extra) {
  return { ok: false, msg: msg, outData: extra || null };
}

function positiveId(value) {
  var n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

// Mismo redondeo que la vista 48 (roundMoney).
function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function plain(value) {
  return value === undefined || value === null ? null : JSON.parse(JSON.stringify(value));
}

function rowsOf(raw) {
  var rows = [];
  if (raw && typeof raw.length === 'number') for (var i = 0; i < raw.length; i++) rows.push(plain(raw[i]));
  return rows;
}

function loadRows(entity, fields, filter) {
  doCmd({ cmd: 'LoadEntities', data: { entity: entity, fields: fields, filter: filter } });
  var response = LoadEntities;
  if (!response || response.ok === false || !response.outData || typeof response.outData.length !== 'number') {
    throw new Error('No se pudo leer ' + entity + (response && response.msg ? ': ' + response.msg : '.'));
  }
  return rowsOf(response.outData);
}

function detailPayoutIds(rawDetail) {
  var detail = typeof rawDetail === 'string' ? JSON.parse(rawDetail || '[]') : rawDetail;
  var items = Object.prototype.toString.call(detail) === '[object Array]' ? detail : [];
  var ids = [];
  items.forEach(function (item) {
    var id = positiveId(item && item.payoutId);
    if (id && ids.indexOf(id) === -1) ids.push(id);
  });
  return ids;
}

function editableTaxTypes() {
  doCmd({ cmd: 'RepoConfigProfile', data: { operation: 'GET', filter: '1=1', noTracking: true } });
  var response = RepoConfigProfile;
  var rows = response && response.ok !== false ? rowsOf(response.outData) : [];
  var profile = rows.length ? JSON.parse(rows[rows.length - 1].configJson || '{}') : {};
  var configured = profile && profile.Payment ? profile.Payment.editableTaxTypes : null;
  var source = Object.prototype.toString.call(configured) === '[object Array]' ? configured : ['DED', 'RETSALV', 'ADDSALV'];
  return source.map(function (type) { return String(type || '').trim().toUpperCase(); });
}

function taxCatalog() {
  doCmd({ cmd: 'RepoValueAddedCatalog', data: { operation: 'GET' } });
  var response = RepoValueAddedCatalog;
  if (!response || response.ok === false) {
    throw new Error('No se pudo leer el catálogo de impuestos' + (response && response.msg ? ': ' + response.msg : '.'));
  }
  return rowsOf(response.outData);
}

try {
  var claimId = positiveId(ctx.claimId);
  var gross = money(ctx.total);
  var requested = ctx.paymentTaxes;
  if (typeof requested === 'string') requested = JSON.parse(requested || '[]');
  if (Object.prototype.toString.call(requested) !== '[object Array]') return fail('Las líneas de impuestos y deducciones no son válidas.');
  if (!claimId) return fail('Debe indicar el reclamo de la solicitud.');
  if (!(gross > 0) || Math.abs(gross - Number(ctx.total)) > 0.000001) return fail('El monto bruto de la solicitud no es válido.');
  if (requested.length === 0) return fail('No se recibieron impuestos, retenciones ni deducciones.');
  if (requested.length > 20) return fail('Una solicitud admite hasta 20 líneas de impuestos, retenciones y deducciones.');

  var payoutIds = detailPayoutIds(ctx.jDetail);
  if (payoutIds.length !== 1) return fail('La solicitud debe corresponder a un único movimiento de pago.');
  var payoutId = payoutIds[0];
  var payouts = loadRows('LifeCoveragePayout', 'id, claimId, reserveType', 'id=' + payoutId);
  if (payouts.length !== 1 || positiveId(payouts[0].claimId) !== claimId) return fail('El movimiento ' + payoutId + ' no pertenece al reclamo ' + claimId + '.');
  if (String(payouts[0].reserveType || '').trim().toUpperCase() !== 'IN') {
    return fail('Los impuestos, retenciones y deducciones solo se aplican a solicitudes de pagos, no de gastos.');
  }

  var catalog = taxCatalog();
  var editable = editableTaxTypes();
  var seen = {};
  var lines = [];
  for (var i = 0; i < requested.length; i++) {
    var item = requested[i] || {};
    var code = String(item.valueAddedCode === undefined || item.valueAddedCode === null ? '' : item.valueAddedCode).trim();
    var entry = catalog.filter(function (row) { return String(row.code).trim() === code; })[0];
    if (!code || !entry) return fail('El código «' + (code || '(vacío)') + '» no existe en el catálogo de impuestos.');
    if (seen[code]) return fail('«' + entry.name + '» está repetido.');
    seen[code] = true;
    var type = String(entry.taxType || '').trim().toUpperCase();
    if (supportedTypes.indexOf(type) === -1) return fail('«' + entry.name + '» no es un impuesto, una retención ni una deducción.');
    var rate = Number(entry.rate) || 0;
    var isEditable = editable.indexOf(type) !== -1;
    var typed = Number(item.amount);
    if (isEditable && (!Number.isFinite(typed) || Math.abs(money(typed) - typed) > 0.000001)) {
      return fail('El monto de «' + entry.name + '» no es válido.');
    }
    var amount = isEditable ? money(typed) : money(rate * gross);
    if (!(amount > 0)) return fail('El monto de «' + entry.name + '» debe ser mayor que cero.');
    lines.push({ id: 0, valueAddedCode: code, taxType: type, taxName: entry.name, rate: rate, amount: amount, grossAmount: gross });
  }

  var sumOf = function (taxType) {
    return money(lines.filter(function (line) { return line.taxType === taxType; })
      .reduce(function (sum, line) { return sum + line.amount; }, 0));
  };
  var taxes = sumOf('TAX');
  var retentions = sumOf('RET');
  var deductions = sumOf('DED');
  var net = money(gross + taxes - retentions - deductions);
  if (!(net > 0)) return fail('El monto neto a pagar (' + net.toFixed(2) + ') debe ser mayor que cero.');

  var paymentId = positiveId(ctx.paymentId);
  var candidates = loadRows('ClaimPayment', 'id', paymentId ? 'id=' + paymentId
    : 'claimId=' + claimId + ' AND payoutId=' + payoutId + ' AND [date] >= DATEADD(minute, -10, GETUTCDATE()) ORDER BY id DESC');
  if (!candidates.length) return fail('No se encontró la solicitud de cheque del movimiento ' + payoutId + '.');
  paymentId = positiveId(candidates[0].id);

  doCmd({ cmd: 'LoadEntity', data: { entity: 'ClaimPayment', fields: '*', filter: 'id=' + paymentId } });
  var payment = LoadEntity && LoadEntity.ok !== false ? plain(LoadEntity.outData) : null;
  if (!payment || positiveId(payment.id) !== paymentId) return fail('No se pudo leer la solicitud ' + paymentId + '.');
  if (positiveId(payment.claimId) !== claimId || positiveId(payment.payoutId) !== payoutId) {
    return fail('La solicitud ' + paymentId + ' no corresponde al reclamo y movimiento indicados.');
  }
  if (payment.parentId || String(payment.producer || '').trim().toUpperCase() === 'MERGED'
    || closedStates.indexOf(String(payment.entityState || '').trim().toUpperCase()) !== -1) {
    return fail('La solicitud ' + paymentId + ' ya fue fusionada, ejecutada o cerrada.');
  }
  if (money(payment.grossAmount) !== gross || money(payment.total) !== gross
    || money(payment.taxes) !== 0 || money(payment.retentions) !== 0 || money(payment.deductions) !== 0) {
    return fail('La solicitud ' + paymentId + ' no coincide con el monto bruto o ya tiene impuestos, retenciones o deducciones.');
  }
  if (loadRows('PaymentTax', 'id', 'paymentId=' + paymentId).length) {
    return fail('La solicitud ' + paymentId + ' ya tiene líneas de impuestos o deducciones.');
  }

  lines.forEach(function (line) { line.paymentId = paymentId; });
  var result = { paymentId: paymentId, grossAmount: gross, taxes: taxes, retentions: retentions, deductions: deductions,
    total: net, lines: lines, dryRun: ctx.dryRun === true };
  if (ctx.dryRun === true) return { ok: true, msg: 'Simulación: la solicitud ' + paymentId + ' quedaría en ' + net.toFixed(2) + '.', outData: result };

  var entity = Object.assign({}, payment, { taxes: taxes, retentions: retentions, deductions: deductions, total: net, Taxes: lines });
  doCmd({ cmd: 'RepoClaimPayment', data: { operation: 'UPDATE', entity: entity } });
  if (!RepoClaimPayment || RepoClaimPayment.ok === false) {
    return fail('No se pudieron guardar los impuestos y deducciones de la solicitud ' + paymentId
      + (RepoClaimPayment && RepoClaimPayment.msg ? ': ' + RepoClaimPayment.msg : '.'));
  }

  var saved = loadRows('ClaimPayment', 'grossAmount, taxes, retentions, deductions, total', 'id=' + paymentId)[0] || {};
  var savedLines = loadRows('PaymentTax', 'valueAddedCode, amount', 'paymentId=' + paymentId);
  var linesMatch = savedLines.length === lines.length && lines.every(function (line) {
    return savedLines.some(function (row) { return String(row.valueAddedCode).trim() === line.valueAddedCode && money(row.amount) === line.amount; });
  });
  if (money(saved.grossAmount) !== gross || money(saved.taxes) !== taxes || money(saved.retentions) !== retentions
    || money(saved.deductions) !== deductions || money(saved.total) !== net || !linesMatch) {
    return fail('La solicitud ' + paymentId + ' no quedó con los montos esperados. Revísela en Egresos.', result);
  }
  result.paymentTaxesApplied = true;
  var msg = 'Solicitud ' + paymentId + ': bruto ' + gross.toFixed(2) + ', neto ' + net.toFixed(2) + '.';
  if (ctx.generateDocument === true) {
    doCmd({ cmd: 'GenerateClaimDoc', data: { claimId: claimId, template: 'Solcitud de Pago.docx' } });
    result.documentGenerated = !!GenerateClaimDoc && GenerateClaimDoc.ok === true;
    result.documentMsg = GenerateClaimDoc && GenerateClaimDoc.msg ? String(GenerateClaimDoc.msg) : null;
    if (!result.documentGenerated) msg += ' El documento de la solicitud no se generó' + (result.documentMsg ? ': ' + result.documentMsg : '.');
  }
  return { ok: true, msg: msg, outData: result };
} catch (error) {
  return fail(String(error && error.message ? error.message : error).replace(/^@/, ''));
}
