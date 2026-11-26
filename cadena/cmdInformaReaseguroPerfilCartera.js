//block
//noreplace
/**
Name: cmdInformaReaseguroPerfilCartera
Purpose: Perfil de cartera del informe de reaseguro (vista InformeReaseguro, pestaña Perfil de Cartera): reparte las pólizas vigentes a la fecha de cmdInformaReaseguroPolizasVigentes en rangos de suma asegurada 100% (Automático = juego por ramo o tipo de fianza, con el general como respaldo; Dinámico = juego único) leídos con cmdInformaReaseguroRangos, con sumas, primas, Prima Cat y promedios. Solo lectura.
Author: aiden_mission_configurator (MSN-000265 / AXX-11812)
*/
/*
Entrada (context): { fecha:'YYYY-MM-DD', tipoRamo:'FIANZAS', ramos:['81'], tipoRango:'AUTOMATICO'|'DINAMICO', agrupaRamo:true|false }
Salida: { fecha, tipoRango, agrupaRamo, filas:[{grupo, limiteInferior, limiteSuperior, cantidad, sumas..., primas..., sumaPromedio, primaPromedio, tasaPromedio}],
          totales, trazabilidad }

Reglas (las del procedimiento original):
 - La suma se compara en unidades enteras (sin centavos) contra desde <= suma <= hasta.
 - Suma menor que el primer rango del juego: va al primero; mayor que el último: va al último.
 - Suma en un hueco entre rangos: fila «Sin rango» del grupo (el original la descartaba sin aviso).
 - Agrupado por ramo: Fianzas por tipo de fianza, el resto por ramo. Sin agrupar: un solo juego de filas por rango.
 - Cada grupo lista todos los rangos de su juego, también los que quedan en cero.
 - Promedios: suma / cantidad, prima / cantidad y prima / suma x 100.
*/
var CAMPOS = ['sumaAsegurada100', 'sumaRetenida', 'sumaCedida', 'sumaFacultativa', 'sumaCoaseguro', 'primaSuscrita100', 'primaRetenida', 'primaCedida', 'primaFacultativa', 'primaCat', 'primaCoaseguro'];
var entrada = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
var tipoRango = String(entrada.tipoRango || 'AUTOMATICO').trim().toUpperCase();
if (tipoRango !== 'AUTOMATICO' && tipoRango !== 'DINAMICO') throw new Error('@El tipo de rango debe ser AUTOMATICO o DINAMICO.');
var agrupaRamo = !(entrada.agrupaRamo === false || String(entrada.agrupaRamo) === 'false');
function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function r2(v) { return Math.round(num(v) * 100) / 100; }
function r4(v) { return Math.round(num(v) * 10000) / 10000; }
function txt(v) { return v === null || v === undefined ? '' : String(v).trim(); }

doCmd({ cmd: 'ExeChain', data: { chain: 'cmdInformaReaseguroRangos', context: JSON.stringify({ operacion: 'GET' }) } });
if (!ExeChain.ok) throw new Error('@' + String(ExeChain.msg || 'No se pudieron leer los rangos.').replace(/^@/, ''));
var todos = ExeChain.outData && ExeChain.outData.rangos ? ExeChain.outData.rangos : [];
var juegos = {};
for (var ri = 0; ri < todos.length; ri++) {
  var r = todos[ri];
  if (txt(r.tipo) !== tipoRango) continue;
  (juegos[txt(r.clave)] || (juegos[txt(r.clave)] = [])).push({ desde: num(r.desde), hasta: num(r.hasta), descripcion: txt(r.descripcion) });
}
Object.keys(juegos).forEach(function (k) { juegos[k].sort(function (a, b) { return a.desde - b.desde; }); });
if (!juegos['*']) throw new Error('@No hay rangos ' + (tipoRango === 'AUTOMATICO' ? 'automáticos' : 'dinámicos') + ' generales (*) definidos.');

doCmd({ cmd: 'ExeChain', data: { chain: 'cmdInformaReaseguroPolizasVigentes', context: JSON.stringify({ fecha: entrada.fecha, tipoRamo: entrada.tipoRamo, ramos: entrada.ramos }) } });
if (!ExeChain.ok) throw new Error('@' + String(ExeChain.msg || 'No se pudieron leer las pólizas vigentes.').replace(/^@/, ''));
var base = ExeChain.outData || {};
var polizas = base.filas || [];

function nuevaFila(grupo, rango, orden) {
  var f = { grupo: grupo, limiteInferior: rango ? rango.desde : null, limiteSuperior: rango ? rango.hasta : null, sinRango: !rango, cantidad: 0 };
  CAMPOS.forEach(function (c) { f[c] = 0; });
  return f;
}
var grupos = {}, ordenGrupos = [], sinRango = 0;
for (var i = 0; i < polizas.length; i++) {
  var p = polizas[i];
  var esFianza = txt(p.tipoFianzaClave) !== '';
  var claveJuego = tipoRango === 'DINAMICO' ? '*' : (esFianza ? txt(p.tipoFianzaClave) : txt(p.lob));
  if (!juegos[claveJuego]) claveJuego = '*';
  var juego = juegos[claveJuego];
  var nombreGrupo = agrupaRamo ? (esFianza ? (txt(p.tipoFianza) || txt(p.ramo)) : txt(p.ramo)) : '';
  var kg = nombreGrupo + '\u0001' + claveJuego;
  var g = grupos[kg];
  if (!g) {
    g = grupos[kg] = { nombre: nombreGrupo, filas: juego.map(function (rg, ix) { return nuevaFila(nombreGrupo, rg, ix); }), sinRango: null };
    ordenGrupos.push(kg);
  }
  var suma = Math.floor(num(p.sumaAsegurada100));
  var destino = null;
  for (var j = 0; j < juego.length; j++) if (suma >= juego[j].desde && suma <= juego[j].hasta) { destino = g.filas[j]; break; }
  if (!destino && suma < juego[0].desde) destino = g.filas[0];
  if (!destino && suma > juego[juego.length - 1].hasta) destino = g.filas[juego.length - 1];
  if (!destino) { destino = g.sinRango || (g.sinRango = nuevaFila(nombreGrupo, null, 9999)); sinRango++; }
  destino.cantidad++;
  CAMPOS.forEach(function (c) { destino[c] += num(p[c]); });
}

var filas = [];
ordenGrupos.sort(function (a, b) { return grupos[a].nombre < grupos[b].nombre ? -1 : (grupos[a].nombre > grupos[b].nombre ? 1 : 0); });
var mezcla = {}, ordenMezcla = [];
ordenGrupos.forEach(function (kg) {
  var g = grupos[kg];
  var lista = g.filas.concat(g.sinRango ? [g.sinRango] : []);
  lista.forEach(function (f) {
    if (agrupaRamo) { filas.push(f); return; }
    var km = f.sinRango ? 'sin' : f.limiteInferior + '-' + f.limiteSuperior;
    var m = mezcla[km];
    if (!m) { m = mezcla[km] = nuevaFila('', f.sinRango ? null : { desde: f.limiteInferior, hasta: f.limiteSuperior }, f.sinRango ? 9999 : f.limiteInferior); ordenMezcla.push(km); }
    m.cantidad += f.cantidad;
    CAMPOS.forEach(function (c) { m[c] += f[c]; });
  });
});
if (!agrupaRamo) {
  ordenMezcla.sort(function (a, b) { return mezcla[a].sinRango - mezcla[b].sinRango || mezcla[a].limiteInferior - mezcla[b].limiteInferior; });
  ordenMezcla.forEach(function (km) { filas.push(mezcla[km]); });
}
var totales = { cantidad: 0 };
CAMPOS.forEach(function (c) { totales[c] = 0; });
filas.forEach(function (f) {
  CAMPOS.forEach(function (c) { f[c] = r2(f[c]); totales[c] += f[c]; });
  totales.cantidad += f.cantidad;
  f.sumaPromedio = f.cantidad ? r2(f.sumaAsegurada100 / f.cantidad) : 0;
  f.primaPromedio = f.cantidad ? r2(f.primaSuscrita100 / f.cantidad) : 0;
  f.tasaPromedio = f.sumaAsegurada100 ? r4(f.primaSuscrita100 / f.sumaAsegurada100 * 100) : 0;
});
CAMPOS.forEach(function (c) { totales[c] = r2(totales[c]); });
totales.sumaPromedio = totales.cantidad ? r2(totales.sumaAsegurada100 / totales.cantidad) : 0;
totales.primaPromedio = totales.cantidad ? r2(totales.primaSuscrita100 / totales.cantidad) : 0;
totales.tasaPromedio = totales.sumaAsegurada100 ? r4(totales.primaSuscrita100 / totales.sumaAsegurada100 * 100) : 0;

return {
  fecha: base.fecha,
  tipoRamo: base.tipoRamo,
  ramos: base.ramos,
  tipoRango: tipoRango,
  agrupaRamo: agrupaRamo,
  filas: filas,
  totales: totales,
  trazabilidad: { polizasVigentes: polizas.length, polizasSinRango: sinRango, juegosUsados: ordenGrupos.length, origen: base.trazabilidad }
};
