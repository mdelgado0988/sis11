//block
//noreplace
/**
Name: cmdInformaReaseguroCumulos
Purpose: Cúmulos del informe de reaseguro (vista InformeReaseguro, pestaña Cúmulos): agrupa las pólizas vigentes a la fecha de cmdInformaReaseguroPolizasVigentes por el criterio elegido (Provincia, Zona Cresta, Plan, Barriada, Edificio, Tarifa, Cliente, Grupo Económico, Tipo Fianza o Póliza), con la opción de mantener la agrupación por ramo. Solo lectura.
Author: aiden_mission_configurator (MSN-000265 / AXX-11812)
*/
/*
Entrada (context): { fecha:'YYYY-MM-DD', tipoRamo:'FIANZAS', ramos:['81'], criterio:1..10, agrupaRamo:true|false }
Salida: { fecha, criterio:{codigo,nombre}, agrupaRamo, filas:[{ramo, descripcion, cantidad, sumas..., primas...}], totales, trazabilidad }

Reglas:
 - Criterios del formulario original: 1 Provincia, 2 Zona Cresta, 3 Plan, 4 Barriada, 5 Edificio, 6 Tarifa (Incendio),
   7 Cliente, 8 Grupo Económico, 9 Tipo Fianza, 10 Póliza.
 - Una póliza sin dato para el criterio cuenta en «(Sin dato)», para que el total coincida con las pólizas vigentes.
 - El criterio Póliza agrega Asegurado, Grupo Económico, Beneficiario, Serie, Fecha desde y Fecha hasta.
*/
var CRITERIOS = {
  1: { nombre: 'Provincia', campo: 'provincia' },
  2: { nombre: 'Zona Cresta', campo: 'zonaCresta' },
  3: { nombre: 'Plan', campo: 'plan' },
  4: { nombre: 'Barriada', campo: 'barriada' },
  5: { nombre: 'Edificio', campo: 'edificio' },
  6: { nombre: 'Tarifa (Incendio)', campo: 'tarifa' },
  7: { nombre: 'Cliente', campo: 'cliente' },
  8: { nombre: 'Grupo Económico', campo: 'grupoEconomico' },
  9: { nombre: 'Tipo Fianza', campo: 'tipoFianza' },
  10: { nombre: 'Póliza', campo: 'poliza' }
};
var CAMPOS = ['sumaAsegurada100', 'sumaRetenida', 'sumaCedida', 'sumaFacultativa', 'sumaCoaseguro', 'primaSuscrita100', 'primaRetenida', 'primaCedida', 'primaCat', 'primaFacultativa', 'primaCoaseguro'];
var entrada = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
var codigo = parseInt(entrada.criterio, 10);
var criterio = CRITERIOS[codigo];
if (!criterio) throw new Error('@Elija un criterio de cúmulo (1 a 10).');
var agrupaRamo = !(entrada.agrupaRamo === false || String(entrada.agrupaRamo) === 'false');
var paginarPolizas = codigo === 10 && num(entrada.pagina) > 0 && num(entrada.tamanoPagina) > 0;
var paginaSolicitada = Math.max(1, Math.floor(num(entrada.pagina)) || 1);
var tamanoSolicitado = Math.max(1, Math.floor(num(entrada.tamanoPagina)) || 50);
function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function r2(v) { return Math.round(num(v) * 100) / 100; }
function txt(v) { return v === null || v === undefined ? '' : String(v).trim(); }

doCmd({ cmd: 'ExeChain', data: { chain: 'cmdInformaReaseguroPolizasVigentes', context: JSON.stringify({
  fecha: entrada.fecha, tipoRamo: entrada.tipoRamo, ramos: entrada.ramos,
  pagina: paginarPolizas ? paginaSolicitada : 0,
  tamanoPagina: paginarPolizas ? tamanoSolicitado : 0
}) } });
if (!ExeChain.ok) throw new Error('@' + String(ExeChain.msg || 'No se pudieron leer las pólizas vigentes.').replace(/^@/, ''));
var base = ExeChain.outData || {};
var polizas = base.filas || [];

var grupos = {}, orden = [];
var totales = { cantidad: 0 };
CAMPOS.forEach(function (c) { totales[c] = 0; });
for (var i = 0; i < polizas.length; i++) {
  var p = polizas[i];
  var valor = txt(p[criterio.campo]) || '(Sin dato)';
  var ramo = agrupaRamo ? txt(p.ramo) : '';
  var k = ramo + '\u0001' + valor + (codigo === 10 ? '\u0001' + p.id : '');
  var g = grupos[k];
  if (!g) {
    g = grupos[k] = { ramo: ramo, descripcion: valor, cantidad: 0 };
    CAMPOS.forEach(function (c) { g[c] = 0; });
    if (codigo === 10) {
      g.polizaId = p.id; g.asegurado = txt(p.asegurado); g.grupoEconomico = txt(p.grupoEconomico); g.beneficiario = txt(p.beneficiario);
      g.serie = txt(p.serie); g.fechaDesde = txt(p.fechaInicial); g.fechaHasta = txt(p.fechaFinal); g.plan = txt(p.plan);
    }
    orden.push(k);
  }
  g.cantidad++;
  totales.cantidad++;
  CAMPOS.forEach(function (c) { g[c] += num(p[c]); totales[c] += num(p[c]); });
}
var filas = orden.map(function (k) {
  var g = grupos[k];
  CAMPOS.forEach(function (c) { g[c] = r2(g[c]); });
  return g;
});
filas.sort(function (a, b) {
  if (a.ramo !== b.ramo) return a.ramo < b.ramo ? -1 : 1;
  return b.sumaAsegurada100 - a.sumaAsegurada100;
});
CAMPOS.forEach(function (c) { totales[c] = r2(totales[c]); });

return {
  fecha: base.fecha,
  tipoRamo: base.tipoRamo,
  ramos: base.ramos,
  criterio: { codigo: codigo, nombre: criterio.nombre },
  agrupaRamo: agrupaRamo,
  filas: filas,
  total: paginarPolizas ? Number(base.total || 0) : filas.length,
  pagina: paginarPolizas ? paginaSolicitada : 0,
  tamanoPagina: paginarPolizas ? tamanoSolicitado : filas.length,
  totales: totales,
  trazabilidad: { polizasVigentes: polizas.length, grupos: filas.length, origen: base.trazabilidad }
};
