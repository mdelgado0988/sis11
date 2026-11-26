//block
//noreplace
/**
Name: cmdInformaReaseguroRangos
Purpose: Mantenimiento de los rangos de suma asegurada del perfil de cartera del informe de reaseguro (vista InformeReaseguro). Lee y guarda la tabla cfgInformeReaseguroRangos, que usa solo este informe: rangos Automáticos (por ramo o tipo de fianza, con un juego general) y Dinámicos (un juego único).
Author: aiden_mission_configurator (MSN-000265 / AXX-11812)
SQL justification: lectura sin seguimiento de la fila de la tabla de rangos (id y datos), para poder guardarla en la misma petición sin el choque de seguimiento que deja la lectura nativa de tablas.
*/
/*
Entrada (context):
  { operacion:'GET' }
  { operacion:'SAVE', tipo:'AUTOMATICO'|'DINAMICO', clave:'*'|'<ramo>'|'<ramo>|<cobertura>', descripcion:'...', rangos:[{desde,hasta}] }
     reemplaza el juego (tipo, clave). Con rangos vacío quita el juego; el juego general '*' no puede quedar vacío.
Salida: { tablaId, rangos:[{tipo,clave,descripcion,desde,hasta}] }

Reglas: desde >= 0, desde < hasta y sin solapes dentro del juego. Los huecos entre rangos se permiten (el perfil los informa
como «Sin rango»). DINAMICO tiene un solo juego, con clave '*'.
*/
var TABLA = 'cfgInformeReaseguroRangos';
var CABECERA = ['tipo', 'clave', 'descripcion', 'desde', 'hasta'];
var entrada = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
var operacion = String(entrada.operacion || 'GET').trim().toUpperCase();
function txt(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function num(v) { var n = Number(v); return isFinite(n) ? n : NaN; }
function lista(x) {
  var out = [];
  if (!x || typeof x.length !== 'number') return out;
  for (var i = 0; i < x.length; i++) out.push(x[i]);
  return out;
}
function ordenar(a) {
  function k(x) { return x.tipo + '|' + (x.clave === '*' ? '' : x.clave); }
  a.sort(function (x, y) { var kx = k(x), ky = k(y); return kx !== ky ? (kx < ky ? -1 : 1) : x.desde - y.desde; });
  return a;
}
function leer() {
  doCmd({ cmd: 'DoQuery', data: { sql: "SELECT id, name, data FROM [Table] WHERE name = N'" + TABLA + "'", timeout: 30 } });
  if (!DoQuery.ok) throw new Error('@No se pudo leer la tabla de rangos: ' + DoQuery.msg);
  var res = lista(DoQuery.outData);
  var id = 0, filas = [];
  if (res.length) {
    id = Number(res[0].id) || 0;
    filas = lista(JSON.parse(String(res[0].data || '[]')));
  }
  var rangos = [];
  var cab = filas.length ? lista(filas[0]).map(txt) : [];
  var ix = CABECERA.map(function (c) { return cab.indexOf(c); });
  for (var i = 1; i < filas.length; i++) {
    var f = lista(filas[i]);
    if (!txt(f[ix[0]])) continue;
    rangos.push({ tipo: txt(f[ix[0]]).toUpperCase(), clave: txt(f[ix[1]]), descripcion: txt(f[ix[2]]), desde: num(f[ix[3]]), hasta: num(f[ix[4]]) });
  }
  return { tablaId: id, rangos: ordenar(rangos) };
}

var actual = leer();
if (operacion === 'GET') return actual;
if (operacion !== 'SAVE') throw new Error('@Operación no reconocida: ' + operacion);

var tipo = txt(entrada.tipo).toUpperCase();
var clave = txt(entrada.clave) || '*';
var descripcion = txt(entrada.descripcion) || (clave === '*' ? 'General' : clave);
if (tipo !== 'AUTOMATICO' && tipo !== 'DINAMICO') throw new Error('@El tipo de rango debe ser AUTOMATICO o DINAMICO.');
if (tipo === 'DINAMICO' && clave !== '*') throw new Error('@Los rangos dinámicos son un solo juego (clave *).');
if (!/^[A-Za-z0-9*|]{1,40}$/.test(clave)) throw new Error('@Clave de rango no válida: ' + clave);
var nuevos = lista(entrada.rangos).map(function (r) { return { desde: num(r.desde), hasta: num(r.hasta) }; });
nuevos.sort(function (x, y) { return x.desde - y.desde; });
var errores = [];
nuevos.forEach(function (r, i) {
  if (isNaN(r.desde) || isNaN(r.hasta)) errores.push('Fila ' + (i + 1) + ': desde y hasta deben ser números.');
  else if (r.desde < 0) errores.push('Fila ' + (i + 1) + ': desde no puede ser negativo.');
  else if (r.desde >= r.hasta) errores.push('Fila ' + (i + 1) + ': desde (' + r.desde + ') debe ser menor que hasta (' + r.hasta + ').');
  if (i > 0 && !isNaN(r.desde) && r.desde <= nuevos[i - 1].hasta) errores.push('Fila ' + (i + 1) + ': se solapa con el rango anterior (hasta ' + nuevos[i - 1].hasta + ').');
});
if (!nuevos.length && clave === '*') errores.push('El juego general (*) no puede quedar vacío.');
if (errores.length) throw new Error('@' + errores.join(' '));

var resto = actual.rangos.filter(function (r) { return !(r.tipo === tipo && r.clave === clave); });
nuevos.forEach(function (r) { resto.push({ tipo: tipo, clave: clave, descripcion: descripcion, desde: r.desde, hasta: r.hasta }); });
ordenar(resto);
var matriz = [CABECERA].concat(resto.map(function (r) { return [r.tipo, r.clave, r.descripcion, String(r.desde), String(r.hasta)]; }));
var datos = { name: TABLA, data: JSON.stringify(matriz) };
if (actual.tablaId) datos.id = actual.tablaId;
doCmd({ cmd: 'AddOrUpdateTable', data: datos });
if (!AddOrUpdateTable.ok) throw new Error('@No se pudieron guardar los rangos: ' + AddOrUpdateTable.msg);
return leer();
