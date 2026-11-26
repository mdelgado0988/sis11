//block
//noreplace
/**
Name: cmdInformaReaseguroCatalogos
Purpose: Catálogos de filtros de la vista InformeReaseguro: tipos de ramo del formulario original con sus ramos, ramos, tipos de fianza (cobertura principal de las fianzas emitidas) y los criterios de cúmulo que aplican a cada tipo de ramo. Solo lectura.
Author: aiden_mission_configurator (MSN-000265 / AXX-11812)
*/
/*
Entrada (context): {} (sin parámetros)
Salida: { tiposRamo:[{codigo,nombre,ramos:[...],esFianza,esIncendio,criterios:[...],criterioDefecto}],
          ramos:[{codigo,nombre,tipoRamo}], tiposFianza:[{clave,lob,codigo,nombre}], criterios:[{codigo,nombre,campo}] }

Reglas:
 - Tipos de ramo del formulario original, con los ramos de este ambiente que les corresponden.
 - Criterios de cúmulo: para Fianzas Plan, Cliente, Grupo Económico, Tipo Fianza y Póliza (por defecto Póliza);
   para el resto Provincia, Zona Cresta, Plan, Barriada, Edificio, Tarifa, Cliente y Grupo Económico (por defecto Provincia).
 - Tipo de fianza = cobertura principal de las pólizas de fianza emitidas; la clave es ramo|código de cobertura.

SQL justification: lectura de los nombres de ramo y de las coberturas principales distintas de las fianzas emitidas, en una
consulta; no hay comando Repo que devuelva esa lista distinta. No escribe nada.
*/
var TIPOS = [
  { codigo: 'COLVIDA', nombre: 'Colectivo de Vida', ramos: ['20'] },
  { codigo: 'FIANZAS', nombre: 'Fianzas', ramos: ['81', '82', '83', '84'] },
  { codigo: 'INCENDIO', nombre: 'Incendio y Líneas Aliadas', ramos: ['1'] },
  { codigo: 'DANOS', nombre: 'Otros Seguros de Daños', ramos: ['52', '96', '6'] },
  { codigo: 'VIDAIND', nombre: 'Vida Individual', ramos: ['71', '31'] }
];
var CRITERIOS = [
  { codigo: 1, nombre: 'Provincia', campo: 'provincia' },
  { codigo: 2, nombre: 'Zona Cresta', campo: 'zonaCresta' },
  { codigo: 3, nombre: 'Plan', campo: 'plan' },
  { codigo: 4, nombre: 'Barriada', campo: 'barriada' },
  { codigo: 5, nombre: 'Edificio', campo: 'edificio' },
  { codigo: 6, nombre: 'Tarifa (Incendio)', campo: 'tarifa' },
  { codigo: 7, nombre: 'Cliente', campo: 'cliente' },
  { codigo: 8, nombre: 'Grupo Económico', campo: 'grupoEconomico' },
  { codigo: 9, nombre: 'Tipo Fianza', campo: 'tipoFianza' },
  { codigo: 10, nombre: 'Póliza', campo: 'poliza' }
];
function txt(v) { return v === null || v === undefined ? '' : String(v).trim(); }

var todos = [];
TIPOS.forEach(function (t) { t.ramos.forEach(function (r) { todos.push("'" + r + "'"); }); });
var sql = "SELECT (SELECT l.[code] AS codigo, l.name AS nombre FROM Lob l WHERE l.[code] IN (" + todos.join(',') + ") ORDER BY l.[code] FOR JSON PATH) AS ramos,\n"
  + " (SELECT x.lob, x.codigo, MAX(x.nombre) AS nombre FROM (\n"
  + "    SELECT p.lob, (SELECT TOP 1 lc.[code] FROM LifeCoverage lc WHERE lc.lifePolicyId = p.id ORDER BY CASE WHEN lc.basic = 1 THEN 0 ELSE 1 END, lc.id) AS codigo,\n"
  + "           (SELECT TOP 1 lc.name FROM LifeCoverage lc WHERE lc.lifePolicyId = p.id ORDER BY CASE WHEN lc.basic = 1 THEN 0 ELSE 1 END, lc.id) AS nombre\n"
  + "    FROM LifePolicy p WHERE p.lob IN ('81','82','83','84') AND p.activeDate IS NOT NULL) x\n"
  + "  WHERE x.codigo IS NOT NULL GROUP BY x.lob, x.codigo ORDER BY x.lob, x.codigo FOR JSON PATH) AS fianzas";
doCmd({ cmd: 'DoQuery', data: { sql: sql, timeout: 60 } });
if (!DoQuery.ok) throw new Error('@No se pudieron leer los catálogos: ' + DoQuery.msg);
var fila = DoQuery.outData && DoQuery.outData.length ? DoQuery.outData[0] : {};
var lobs = fila.ramos ? JSON.parse(fila.ramos) : [];
var fianzas = fila.fianzas ? JSON.parse(fila.fianzas) : [];

var nombres = {};
lobs.forEach(function (l) { nombres[txt(l.codigo)] = txt(l.nombre); });
var ramos = [];
TIPOS.forEach(function (t) {
  t.ramos.forEach(function (r) { ramos.push({ codigo: r, nombre: nombres[r] || r, tipoRamo: t.codigo }); });
});
var tiposRamo = TIPOS.map(function (t) {
  var esFianza = t.codigo === 'FIANZAS';
  return {
    codigo: t.codigo, nombre: t.nombre, ramos: t.ramos, esFianza: esFianza, esIncendio: t.codigo === 'INCENDIO',
    criterios: esFianza ? [3, 7, 8, 9, 10] : [1, 2, 3, 4, 5, 6, 7, 8],
    criterioDefecto: esFianza ? 10 : 1
  };
});
var tiposFianza = fianzas.map(function (f) {
  return { clave: txt(f.lob) + '|' + txt(f.codigo), lob: txt(f.lob), codigo: txt(f.codigo), nombre: txt(f.nombre), ramo: nombres[txt(f.lob)] || txt(f.lob) };
});

return { tiposRamo: tiposRamo, ramos: ramos, tiposFianza: tiposFianza, criterios: CRITERIOS };
