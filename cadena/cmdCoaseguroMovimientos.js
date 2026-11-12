//block
//noreplace
/*
 * Name: cmdCoaseguroMovimientos
 * MSN-000188 - Coaseguro por movimiento de una poliza (vista 35 PolicyBilling, pestana Coaseguro).
 * Cada fila expone la VARIACION que causo ese movimiento en el reparto de coaseguro
 * (posterior - anterior), nunca el saldo vigente repetido: una fila por coasegurador y una
 * por la participacion propia. La suma de todas las filas de la poliza es su reparto vigente
 * (0 si la poliza esta cancelada).
 * context: { policyId: 5105 } o { poliza: 'FC-001373' }
 *
 * Origen: CoCession a nivel de poliza (sin las filas generadas al cobro ni las de cobertura),
 * en orden de id, con la misma reconstruccion que el bordero de la pestana Reaseguro:
 *   - cada fila nueva (no reverso) es una generacion del coasegurador y aporta
 *     generacion - generacion anterior del mismo coasegurador (LAG);
 *   - las filas de reverso son asiento tecnico y no aportan, salvo cuando el movimiento deja al
 *     coasegurador sin fila nueva (cancelacion, retiro): ese movimiento resta su ultima generacion.
 * Movimientos: emision (filas sin changeId grabadas hasta 10 minutos despues de emitir), cada
 * endoso ejecutado (Change.status = 1, como las otras pestanas) y cada lote posterior sin
 * changeId (renovacion o ajuste).
 * Participacion propia: el 100% del movimiento menos lo cedido a los coaseguradores; el 100%
 * sale de la cadena de generaciones de un coasegurador presente en el movimiento.
 * Solo lectura: DoQuery SELECT y GetConfig del nombre de la compania.
 */
var ctx = context || {};
var policyId = parseInt(ctx.policyId, 10);
var poliza = ctx.poliza ? String(ctx.poliza).trim() : '';
if (!(policyId > 0) && !poliza) { throw 'Debe indicar la poliza (policyId o poliza).'; }

function sqlTexto(v) { return String(v === null || v === undefined ? '' : v).split("'").join("''"); }
function numero(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function redondea(v) { return Math.round(numero(v) * 1000000) / 1000000; }
function texto(v) { return v === null || v === undefined ? '' : String(v); }

var filtroPoliza = policyId > 0 ? 'lp.id = ' + policyId : "lp.code = '" + sqlTexto(poliza) + "'";
doCmd({
  cmd: 'DoQuery',
  data: {
    sql: "SELECT TOP 1 lp.id, lp.code, lp.coinsurance, lp.extPolicy, lp.currency,"
      + " CONVERT(varchar(33), lp.start, 127) AS inicio, CONVERT(varchar(33), lp.[end], 127) AS fin,"
      + " CONVERT(varchar(33), lp.activeDate, 127) AS emitida,"
      + " CONVERT(varchar(33), emi.start, 127) AS emisionDesde,"
      + " JSON_VALUE(CASE WHEN ISJSON(emi.jSnapshot) = 1 THEN emi.jSnapshot ELSE '{}' END, '$.end') AS emisionHasta,"
      + " (SELECT COUNT(*) FROM Anniversary anr WHERE anr.lifePolicyId = lp.id AND ISNULL(anr.contractYear, 0) > 1) AS renovaciones"
      + " FROM LifePolicy lp"
      + " OUTER APPLY (SELECT TOP 1 an0.start, an0.jSnapshot FROM Anniversary an0 WHERE an0.lifePolicyId = lp.id"
      + " ORDER BY CASE WHEN ISNULL(an0.contractYear, 0) = 1 THEN 0 ELSE 1 END, an0.start, an0.id) emi"
      + " WHERE " + filtroPoliza + " ORDER BY lp.id DESC",
    timeout: 120
  }
});
if (!DoQuery || !DoQuery.ok) {
  throw 'No fue posible leer la poliza: ' + (DoQuery && DoQuery.msg ? DoQuery.msg : 'sin detalle');
}
var pol = DoQuery.outData && DoQuery.outData.length > 0 ? DoQuery.outData[0] : null;
if (!pol) { throw 'No se encontro la poliza ' + (poliza || policyId) + '.'; }
var modoCoaseguro = numero(pol.coinsurance);

doCmd({
  cmd: 'DoQuery',
  data: {
    sql: "SELECT cc.id, cc.contactId, cc.percentage, CAST(cc.leader AS int) AS lider,"
      + " cc.sumInsured, cc.premium, cc.sumInsuredCeded, cc.premiumCeded, cc.commission, cc.changeId,"
      + " CONVERT(varchar(33), cc.created, 127) AS creado,"
      + " LTRIM(RTRIM(REPLACE(ISNULL(ct.name, '') + ' ' + ISNULL(ct.surname1, '') + ' ' + ISNULL(ct.surname2, ''), '  ', ' '))) AS coasegurador,"
      + " ch.Discriminator AS discriminador, ch.status AS estadoEndoso,"
      + " CONVERT(varchar(33), ch.executionDate, 127) AS fechaEjecucion,"
      + " CONVERT(varchar(33), ch.effectiveDate, 127) AS fechaEfectiva,"
      + " JSON_VALUE(CASE WHEN ISJSON(ch.jAdditional) = 1 THEN ch.jAdditional ELSE '{}' END, '$.endorsementType') AS tipoEndoso,"
      + " JSON_VALUE(CASE WHEN ISJSON(ch.jDetail) = 1 THEN ch.jDetail ELSE '{}' END, '$.policyStart') AS inicioDetalle,"
      + " JSON_VALUE(CASE WHEN ISJSON(ch.jDetail) = 1 THEN ch.jDetail ELSE '{}' END, '$.policyEnd') AS finDetalle,"
      + " CASE WHEN cc.changeId IS NOT NULL THEN NULL"
      + "      WHEN lp.activeDate IS NULL OR cc.created <= DATEADD(minute, 10, lp.activeDate) THEN 0"
      + "      ELSE DENSE_RANK() OVER (PARTITION BY CASE WHEN cc.changeId IS NULL AND lp.activeDate IS NOT NULL"
      + "             AND cc.created > DATEADD(minute, 10, lp.activeDate) THEN 1 ELSE 0 END"
      + "             ORDER BY CONVERT(varchar(16), cc.created, 120)) END AS lote"
      + " FROM CoCession cc"
      + " INNER JOIN LifePolicy lp ON lp.id = cc.lifePolicyId"
      + " LEFT JOIN Contact ct ON ct.id = cc.contactId"
      + " LEFT JOIN Change ch ON ch.id = cc.changeId"
      + " WHERE cc.lifePolicyId = " + numero(pol.id)
      + " AND cc.parentCoCession IS NULL AND cc.allocationId IS NULL AND cc.lifeCoverageId IS NULL"
      + " ORDER BY cc.id",
    timeout: 120
  }
});
if (!DoQuery || !DoQuery.ok) {
  throw 'No fue posible leer el coaseguro de la poliza: ' + (DoQuery && DoQuery.msg ? DoQuery.msg : 'sin detalle');
}
var registros = DoQuery.outData || [];

var compania = '';
if (registros.length > 0) {
  try {
    doCmd({ cmd: 'GetConfig', data: { path: '$.Main.company' } });
    if (GetConfig && GetConfig.ok && typeof GetConfig.outData === 'string') { compania = GetConfig.outData.trim(); }
  } catch (e) { compania = ''; }
}
var nombrePropio = compania || 'Participaci\u00f3n propia';
var textoLider = 'Esta aseguradora es l\u00edder';
var textoSeguidor = 'Otra aseguradora es l\u00edder';

/* 1. Movimiento de cada fila. */
var movimientos = [];
var porClave = {};
var incluidos = [];
var excluidas = 0;
for (var i = 0; i < registros.length; i++) {
  var r = registros[i];
  var clave;
  if (r.changeId !== null && r.changeId !== undefined) {
    if (numero(r.estadoEndoso) !== 1) { excluidas++; continue; }
    clave = 'END:' + r.changeId;
  } else if (numero(r.lote) > 0) {
    clave = 'LOT:' + numero(r.lote);
  } else {
    clave = 'EMI';
  }
  var mov = porClave[clave];
  if (!mov) {
    mov = { clave: clave, partes: {}, orden: [], primerId: numero(r.id), creado: texto(r.creado), muestra: r };
    porClave[clave] = mov;
    movimientos.push(mov);
  }
  if (texto(r.creado) < mov.creado) { mov.creado = texto(r.creado); }
  incluidos.push({ fila: r, mov: mov });
}

/* 2. Variacion por coasegurador (LAG de generaciones; los reversos solo cuentan como retiro). */
var medidas = ['si100', 'pr100', 'sic', 'prc', 'com'];
function esReverso(f) {
  return numero(f.sumInsured) < 0 || numero(f.premium) < 0 || numero(f.sumInsuredCeded) < 0 || numero(f.premiumCeded) < 0;
}
function medidasDe(f) {
  return { si100: numero(f.sumInsured), pr100: numero(f.premium), sic: numero(f.sumInsuredCeded),
    prc: numero(f.premiumCeded), com: numero(f.commission) };
}
function ceros() { return { si100: 0, pr100: 0, sic: 0, prc: 0, com: 0 }; }

var conNueva = {};
for (var n1 = 0; n1 < incluidos.length; n1++) {
  if (!esReverso(incluidos[n1].fila)) {
    conNueva[incluidos[n1].mov.clave + '|' + numero(incluidos[n1].fila.contactId)] = true;
  }
}
var previa = {};
var retirado = {};
for (var n2 = 0; n2 < incluidos.length; n2++) {
  var fr = incluidos[n2].fila;
  var mf = incluidos[n2].mov;
  var cid = numero(fr.contactId);
  var p = mf.partes[cid];
  if (!p) {
    p = { contactId: cid, nombre: texto(fr.coasegurador), si100: 0, pr100: 0, sic: 0, prc: 0, com: 0,
      pct: null, pctReverso: null, lider: null, liderReverso: null, nuevas: 0, reversos: 0 };
    mf.partes[cid] = p;
    mf.orden.push(cid);
  }
  var anterior = previa[cid] || ceros();
  var k;
  if (!esReverso(fr)) {
    var actual = medidasDe(fr);
    for (k = 0; k < medidas.length; k++) { p[medidas[k]] += actual[medidas[k]] - anterior[medidas[k]]; }
    previa[cid] = actual;
    p.nuevas++;
    p.pct = numero(fr.percentage);
    p.lider = numero(fr.lider) === 1;
  } else {
    p.reversos++;
    if (p.pctReverso === null) { p.pctReverso = numero(fr.percentage); }
    if (p.liderReverso === null) { p.liderReverso = numero(fr.lider) === 1; }
    var claveRetiro = mf.clave + '|' + cid;
    if (!conNueva[claveRetiro] && !retirado[claveRetiro]) {
      for (k = 0; k < medidas.length; k++) { p[medidas[k]] -= anterior[medidas[k]]; }
      previa[cid] = ceros();
      retirado[claveRetiro] = true;
    }
  }
}

/* 3. Orden de presentacion: emision, luego por fecha de ejecucion del endoso (o grabacion del lote). */
function fechaOrden(m) {
  if (m.clave === 'EMI') { return ''; }
  if (m.clave.indexOf('END:') === 0 && m.muestra.fechaEjecucion) { return texto(m.muestra.fechaEjecucion); }
  return m.creado;
}
movimientos.sort(function (a, b) {
  var fa = fechaOrden(a), fb = fechaOrden(b);
  if (fa < fb) { return -1; }
  if (fa > fb) { return 1; }
  return a.primerId - b.primerId;
});

function tipoMovimiento(m) {
  if (m.clave === 'EMI') { return 'EMISION'; }
  if (m.clave.indexOf('LOT:') === 0) { return numero(pol.renovaciones) > 0 ? 'ANIVERSARIO' : 'AJUSTE'; }
  var s = m.muestra;
  var tipoEndoso = texto(s.tipoEndoso).toUpperCase();
  if (s.discriminador === 'CancellationChange') { return 'CANCELACION'; }
  if (s.discriminador === 'CoverageChange' && tipoEndoso === 'CHANGE_INSURED_SUM_SURETY') { return 'CHANGE_INSURED_SUM_SURETY'; }
  if (s.discriminador === 'CoverageChange' && tipoEndoso === 'PROCEEDORDER') { return 'ProceedOrder'; }
  if (s.discriminador === 'CoverageChange' && tipoEndoso === 'CHANGE_COVERAGE_SURETY') { return 'ChangeCoverageSurety'; }
  return texto(s.discriminador) || 'ENDOSO';
}

/* Mismo criterio de fechas que el bordero de reaseguro (pestana Reaseguro de la vista). */
function fechasMovimiento(m) {
  if (m.clave === 'EMI') {
    return { desde: pol.emisionDesde || pol.inicio || null, hasta: pol.emisionHasta || pol.fin || null, sinZona: 0 };
  }
  if (m.clave.indexOf('LOT:') === 0) {
    return { desde: m.creado || null, hasta: pol.fin || null, sinZona: 0 };
  }
  var s = m.muestra;
  var tipoEndoso = texto(s.tipoEndoso).toUpperCase();
  var desde = s.fechaEfectiva || null;
  if (s.discriminador !== 'CancellationChange' && tipoEndoso === 'CHANGE_COVERAGE_SURETY' && s.inicioDetalle) {
    desde = s.inicioDetalle;
  }
  if (s.finDetalle) { return { desde: desde, hasta: s.finDetalle, sinZona: 1 }; }
  return { desde: desde, hasta: pol.fin || null, sinZona: 0 };
}

var nombreLider = '';
var filas = [];
var numeroFila = 0;
function armaFila(m, datos) {
  numeroFila++;
  return {
    n: numeroFila,
    movKey: m.movKey,
    changeId: m.changeId,
    tipo: m.tipo,
    fechaMovimiento: m.fechaMovimiento,
    fDesde: m.fechas.desde,
    fHasta: m.fechas.hasta,
    fHastaSinZona: m.fechas.sinZona,
    contactId: datos.contactId,
    esPropia: datos.esPropia,
    coasegurador: datos.nombre,
    lider: datos.lider,
    tipoCoaseguro: datos.lider ? textoLider : textoSeguidor,
    aseguradoraLider: m.aseguradoraLider,
    sumaAsegurada: redondea(datos.suma),
    porcentaje: redondea(datos.porcentaje),
    prima: redondea(datos.prima),
    comision: redondea(datos.comision),
    polizaLider: m.polizaLider
  };
}

/* 4. Filas: coaseguradores del movimiento (por contactId) y la participacion propia. */
for (var mi = 0; mi < movimientos.length; mi++) {
  var mv = movimientos[mi];
  var orden = mv.orden.slice(0);
  orden.sort(function (a, b) { return a - b; });

  /* El 100% del movimiento: un coasegurador que sigue (reverso y nueva), si no uno con nueva, si no el primero. */
  var base = null;
  for (var b1 = 0; b1 < orden.length && !base; b1++) {
    if (mv.partes[orden[b1]].nuevas > 0 && mv.partes[orden[b1]].reversos > 0) { base = mv.partes[orden[b1]]; }
  }
  for (var b2 = 0; b2 < orden.length && !base; b2++) {
    if (mv.partes[orden[b2]].nuevas > 0) { base = mv.partes[orden[b2]]; }
  }
  if (!base && orden.length > 0) { base = mv.partes[orden[0]]; }

  /* Una sola aseguradora lidera: coinsurance 1 = la propia, 2 = el coasegurador marcado como lider.
     Con 1 se ignora la marca de las filas; con otros modos manda la marca. */
  var liderMovimiento = '';
  var hayLiderExterno = false;
  for (var ci = 0; ci < orden.length; ci++) {
    var pc = mv.partes[orden[ci]];
    pc.esLider = modoCoaseguro === 1 ? false : (pc.lider !== null ? pc.lider : pc.liderReverso === true);
    if (pc.esLider) { hayLiderExterno = true; if (!liderMovimiento) { liderMovimiento = pc.nombre; } }
  }
  var propiaLider = modoCoaseguro === 1 || (modoCoaseguro !== 2 && !hayLiderExterno);
  if (propiaLider) { liderMovimiento = nombrePropio; }
  if (liderMovimiento) { nombreLider = liderMovimiento; }

  var movimientoFila = {
    movKey: mv.clave,
    changeId: mv.clave.indexOf('END:') === 0 ? numero(mv.muestra.changeId) : null,
    tipo: tipoMovimiento(mv),
    fechas: fechasMovimiento(mv),
    aseguradoraLider: liderMovimiento,
    polizaLider: propiaLider ? texto(pol.code) : texto(pol.extPolicy)
  };
  movimientoFila.fechaMovimiento = mv.clave === 'EMI' ? (pol.emitida || null)
    : (movimientoFila.changeId ? (mv.muestra.fechaEjecucion || null) : (mv.creado || null));
  var cedidoSuma = 0, cedidoPrima = 0, pctCedido = 0;
  for (var fi = 0; fi < orden.length; fi++) {
    var pf = mv.partes[orden[fi]];
    var pctFila = pf.pct !== null ? pf.pct : (pf.pctReverso !== null ? pf.pctReverso : 0);
    cedidoSuma += pf.sic;
    cedidoPrima += pf.prc;
    pctCedido += pctFila;
    filas.push(armaFila(movimientoFila, { contactId: pf.contactId, esPropia: false, nombre: pf.nombre, lider: pf.esLider,
      suma: pf.sic, porcentaje: pctFila, prima: pf.prc, comision: pf.com }));
  }
  if (base) {
    filas.push(armaFila(movimientoFila, { contactId: null, esPropia: true, nombre: nombrePropio, lider: propiaLider,
      suma: base.si100 - cedidoSuma, porcentaje: 100 - pctCedido, prima: base.pr100 - cedidoPrima, comision: 0 }));
  }
}

return {
  filas: filas,
  total: filas.length,
  movimientos: movimientos.length,
  policyId: numero(pol.id),
  poliza: texto(pol.code),
  moneda: texto(pol.currency),
  coaseguro: modoCoaseguro,
  aseguradoraLider: nombreLider,
  trazabilidad: {
    filasLeidas: registros.length,
    filasDeEndososNoEjecutados: excluidas
  },
  criterio: {
    origen: 'CoCession a nivel de poliza, sin las filas generadas al cobro (parentCoCession, allocationId) ni las de cobertura (lifeCoverageId), en orden de id. Cada fila nueva aporta su diferencia con la generacion anterior del mismo coasegurador (como el bordero de reaseguro); los reversos solo cuentan cuando el movimiento deja al coasegurador sin fila nueva (cancelacion o retiro).',
    participacionPropia: '100% del movimiento (cadena de un coasegurador presente en el movimiento) menos lo cedido; su comision es 0.',
    redondeo: 'precision completa redondeada a 6 decimales; el redondeo a 2 decimales es de presentacion'
  }
};
