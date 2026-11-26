//block
//noreplace
/**
Name: cmdInformaReaseguroExportar
Purpose: Exportación a Excel (.xlsx) de la grilla que muestra la vista InformeReaseguro (pólizas vigentes, cúmulos o perfil de cartera): título, filtros aplicados, encabezado, filas y totales, con importes como números (#,##0.00), cantidades enteras, tasas con 4 decimales y fechas como fechas. Devuelve el archivo en base64 para que la vista lo descargue. No lee ni escribe datos del sistema.
Author: aiden_mission_configurator (MSN-000265 / AXX-11812)
*/
/*
Entrada (context): { titulo, filtros:['Fecha de cálculo: 2026-11-25', ...], hoja, archivo,
                     columnas:[{titulo, campo, tipo:'texto'|'num'|'entero'|'tasa'|'fecha', ancho}], filas:[{...}], totales:{...} }
Salida: { archivo, base64, filas, bytes }

Reglas: un valor numérico vacío queda como celda vacía; una fecha YYYY-MM-DD se escribe como fecha de Excel (dd/mm/yyyy);
el resto como texto. ZIP sin compresión (método 0), suficiente para un .xlsx. Límite: 30.000 filas por archivo.
*/
var entrada = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
function txt(v) { return v === null || v === undefined ? '' : String(v); }
function lista(x) {
  var out = [];
  if (!x || typeof x.length !== 'number') return out;
  for (var i = 0; i < x.length; i++) out.push(x[i]);
  return out;
}
var columnas = lista(entrada.columnas).map(function (c) {
  return { titulo: txt(c.titulo), campo: txt(c.campo), tipo: txt(c.tipo || 'texto'), ancho: Number(c.ancho) > 0 ? Number(c.ancho) : 0 };
}).filter(function (c) { return c.campo; });
var filasEntrada = lista(entrada.filas);
if (!columnas.length) throw new Error('@No hay columnas para exportar.');
if (filasEntrada.length > 30000) throw new Error('@Demasiadas filas para un archivo (' + filasEntrada.length + '); acote los filtros.');
var titulo = txt(entrada.titulo) || 'Informe de Reaseguro';
var filtros = lista(entrada.filtros).map(txt).filter(function (x) { return x; });
var totales = entrada.totales || null;
var hoja = (txt(entrada.hoja) || 'Informe').replace(/[\[\]:*?\/\\]/g, ' ').substring(0, 31);
var archivo = (txt(entrada.archivo) || 'InformeReaseguro').replace(/[^A-Za-z0-9 ._()-]/g, '') + '.xlsx';

function esNumero(v) { return v !== null && v !== undefined && v !== '' && !isNaN(Number(v)) && isFinite(Number(v)); }
function xmlTexto(s) {
  return txt(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function letraColumna(i) {
  var s = ''; i = i + 1;
  while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
  return s;
}
function serialFecha(v) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(txt(v));
  if (!m) return null;
  return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000);
}
/* Cadena binaria (un carácter por byte) en UTF-8. */
function utf8(s) {
  var out = [], tramo = [];
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c < 0x80) { tramo.push(c); }
    else {
      if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
        var d = s.charCodeAt(i + 1);
        if (d >= 0xDC00 && d <= 0xDFFF) { c = 0x10000 + ((c - 0xD800) << 10) + (d - 0xDC00); i++; }
      }
      if (c < 0x800) tramo.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) tramo.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else tramo.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    if (tramo.length >= 4096) { out.push(String.fromCharCode.apply(null, tramo)); tramo = []; }
  }
  if (tramo.length) out.push(String.fromCharCode.apply(null, tramo));
  return out.join('');
}
var CRC = [];
for (var n = 0; n < 256; n++) { var cc = n; for (var k = 0; k < 8; k++) cc = (cc & 1) ? (0xEDB88320 ^ (cc >>> 1)) : (cc >>> 1); CRC[n] = cc >>> 0; }
function crc32(b) {
  var crc = 0xFFFFFFFF;
  for (var i = 0; i < b.length; i++) crc = CRC[(crc ^ b.charCodeAt(i)) & 255] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function le(v, largo) { var r = ''; for (var i = 0; i < largo; i++) { r += String.fromCharCode(v & 255); v = v >>> 8; } return r; }
var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64(b) {
  var out = [], i, v;
  for (i = 0; i + 2 < b.length; i += 3) {
    v = (b.charCodeAt(i) << 16) | (b.charCodeAt(i + 1) << 8) | b.charCodeAt(i + 2);
    out.push(B64.charAt((v >> 18) & 63) + B64.charAt((v >> 12) & 63) + B64.charAt((v >> 6) & 63) + B64.charAt(v & 63));
  }
  if (b.length - i === 1) { v = b.charCodeAt(i) << 16; out.push(B64.charAt((v >> 18) & 63) + B64.charAt((v >> 12) & 63) + '=='); }
  else if (b.length - i === 2) { v = (b.charCodeAt(i) << 16) | (b.charCodeAt(i + 1) << 8); out.push(B64.charAt((v >> 18) & 63) + B64.charAt((v >> 12) & 63) + B64.charAt((v >> 6) & 63) + '='); }
  return out.join('');
}
function zip(archivos) {
  var ahora = new Date();
  var hora = ((ahora.getUTCHours() & 31) << 11) | ((ahora.getUTCMinutes() & 63) << 5) | (Math.floor(ahora.getUTCSeconds() / 2) & 31);
  var dia = (((ahora.getUTCFullYear() - 1980) & 127) << 9) | (((ahora.getUTCMonth() + 1) & 15) << 5) | (ahora.getUTCDate() & 31);
  var partes = [], central = [], largo = 0, largoCentral = 0;
  for (var i = 0; i < archivos.length; i++) {
    var a = archivos[i], nombre = utf8(a.nombre), crc = crc32(a.datos);
    var local = le(0x04034b50, 4) + le(20, 2) + le(0x0800, 2) + le(0, 2) + le(hora, 2) + le(dia, 2) + le(crc, 4)
      + le(a.datos.length, 4) + le(a.datos.length, 4) + le(nombre.length, 2) + le(0, 2) + nombre;
    var cen = le(0x02014b50, 4) + le(20, 2) + le(20, 2) + le(0x0800, 2) + le(0, 2) + le(hora, 2) + le(dia, 2) + le(crc, 4)
      + le(a.datos.length, 4) + le(a.datos.length, 4) + le(nombre.length, 2) + le(0, 2) + le(0, 2) + le(0, 2) + le(0, 2) + le(0, 4)
      + le(largo, 4) + nombre;
    partes.push(local, a.datos); largo += local.length + a.datos.length;
    central.push(cen); largoCentral += cen.length;
  }
  var fin = le(0x06054b50, 4) + le(0, 2) + le(0, 2) + le(archivos.length, 2) + le(archivos.length, 2) + le(largoCentral, 4) + le(largo, 4) + le(0, 2);
  return partes.join('') + central.join('') + fin;
}

/* Hoja. Estilos: 1 importe, 2 negrita, 3 título, 4 encabezado, 5 importe negrita, 6 entero, 7 entero negrita, 8 tasa, 9 fecha. */
var filasXml = [], r = 0;
function celdaTexto(c, v, s) { return '<c r="' + letraColumna(c) + r + '" t="inlineStr"' + (s ? ' s="' + s + '"' : '') + '><is><t xml:space="preserve">' + xmlTexto(v) + '</t></is></c>'; }
function celdaNumero(c, v, s) { return '<c r="' + letraColumna(c) + r + '" s="' + s + '"><v>' + String(Number(v)) + '</v></c>'; }
/* La fila r se numera ANTES de armar sus celdas: las referencias de celda (A7, B7...) llevan el mismo número que la fila. */
function agregarFila(celdas, alto) {
  filasXml.push('<row r="' + r + '"' + (alto ? ' ht="' + alto + '" customHeight="1"' : '') + '>' + celdas.join('') + '</row>');
}
function celdaDe(c, i, v, negrita) {
  if (v === null || v === undefined || v === '') return '';
  if (c.tipo === 'num') return esNumero(v) ? celdaNumero(i, v, negrita ? 5 : 1) : celdaTexto(i, v, negrita ? 2 : 0);
  if (c.tipo === 'entero') return esNumero(v) ? celdaNumero(i, v, negrita ? 7 : 6) : celdaTexto(i, v, negrita ? 2 : 0);
  if (c.tipo === 'tasa') return esNumero(v) ? celdaNumero(i, v, 8) : celdaTexto(i, v, 0);
  if (c.tipo === 'fecha') { var sf = serialFecha(v); return sf !== null ? celdaNumero(i, sf, 9) : celdaTexto(i, v, 0); }
  return celdaTexto(i, v, negrita ? 2 : 0);
}
r++; filasXml.push('<row r="' + r + '">' + celdaTexto(0, titulo, 3) + '</row>');
filtros.forEach(function (f) { r++; filasXml.push('<row r="' + r + '">' + celdaTexto(0, f, 2) + '</row>'); });
r++;
r++;
var filaEncabezado = r;
agregarFila(columnas.map(function (c, i) { return celdaTexto(i, c.titulo, 4); }), 30);
for (var fi = 0; fi < filasEntrada.length; fi++) {
  var f = filasEntrada[fi] || {};
  r++;
  var celdas = [];
  for (var ci = 0; ci < columnas.length; ci++) celdas.push(celdaDe(columnas[ci], ci, f[columnas[ci].campo], false));
  agregarFila(celdas);
}
if (totales) {
  r++;
  r++;
  var ct = [];
  for (var ti = 0; ti < columnas.length; ti++) {
    var col = columnas[ti];
    if (ti === 0 && !(col.tipo === 'num' || col.tipo === 'entero')) ct.push(celdaTexto(0, 'TOTAL', 2));
    else if (col.tipo === 'num' || col.tipo === 'entero' || col.tipo === 'tasa') ct.push(celdaDe(col, ti, totales[col.campo], true));
  }
  agregarFila(ct);
}
var cols = columnas.map(function (c, i) {
  var w = c.ancho || Math.min(50, Math.max(c.tipo === 'texto' ? 14 : 16, Math.ceil(c.titulo.length * 1.1)));
  return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
}).join('');
var NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
var REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
var PKG = 'http://schemas.openxmlformats.org/package/2006/relationships';
var CAB = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
var hojaXml = CAB + '<worksheet xmlns="' + NS + '" xmlns:r="' + REL + '"><sheetViews><sheetView workbookViewId="0"><pane ySplit="' + filaEncabezado + '" topLeftCell="A' + (filaEncabezado + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
  + '<sheetFormatPr defaultRowHeight="15"/><cols>' + cols + '</cols><sheetData>' + filasXml.join('') + '</sheetData>'
  + '<autoFilter ref="A' + filaEncabezado + ':' + letraColumna(columnas.length - 1) + (filaEncabezado + filasEntrada.length) + '"/>'
  + '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup orientation="landscape"/></worksheet>';
var estilos = CAB + '<styleSheet xmlns="' + NS + '"><numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="0.0000"/><numFmt numFmtId="166" formatCode="dd/mm/yyyy"/></numFmts>'
  + '<fonts count="3"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="14"/><name val="Calibri"/><family val="2"/></font></fonts>'
  + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/><bgColor indexed="64"/></patternFill></fill></fills>'
  + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="10"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
  + '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
  + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
  + '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>'
  + '<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
  + '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="3" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
  + '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>'
  + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
var libro = CAB + '<workbook xmlns="' + NS + '" xmlns:r="' + REL + '"><sheets><sheet name="' + xmlTexto(hoja) + '" sheetId="1" r:id="rId1"/></sheets>'
  + '<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">\'' + xmlTexto(hoja).replace(/'/g, "''") + '\'!$A$' + filaEncabezado + ':$' + letraColumna(columnas.length - 1) + '$' + (filaEncabezado + filasEntrada.length) + '</definedName></definedNames></workbook>';
var libroRels = CAB + '<Relationships xmlns="' + PKG + '"><Relationship Id="rId1" Type="' + REL + '/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="' + REL + '/styles" Target="styles.xml"/></Relationships>';
var rels = CAB + '<Relationships xmlns="' + PKG + '"><Relationship Id="rId1" Type="' + REL + '/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="' + PKG + '/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="' + REL + '/extended-properties" Target="docProps/app.xml"/></Relationships>';
var tipos = CAB + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
  + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
  + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
  + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
  + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
  + '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>';
var core = CAB + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
  + '<dc:title>' + xmlTexto(titulo) + '</dc:title><dc:creator>SISos</dc:creator>'
  + '<dcterms:created xsi:type="dcterms:W3CDTF">' + new Date().toISOString().substring(0, 19) + 'Z</dcterms:created></cp:coreProperties>';
var app = CAB + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>SISos</Application></Properties>';
var binario = zip([
  { nombre: '[Content_Types].xml', datos: utf8(tipos) },
  { nombre: '_rels/.rels', datos: utf8(rels) },
  { nombre: 'docProps/core.xml', datos: utf8(core) },
  { nombre: 'docProps/app.xml', datos: utf8(app) },
  { nombre: 'xl/workbook.xml', datos: utf8(libro) },
  { nombre: 'xl/_rels/workbook.xml.rels', datos: utf8(libroRels) },
  { nombre: 'xl/styles.xml', datos: utf8(estilos) },
  { nombre: 'xl/worksheets/sheet1.xml', datos: utf8(hojaXml) }
]);
return { archivo: archivo, base64: base64(binario), filas: filasEntrada.length, bytes: binario.length };
