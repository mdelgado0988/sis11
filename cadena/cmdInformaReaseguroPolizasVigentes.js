//block
//noreplace
/**
Name: cmdInformaReaseguroPolizasVigentes
Purpose: Pólizas vigentes a una fecha de cálculo para el informe de reaseguro (vista InformeReaseguro, pestaña Pólizas Vigentes). Las sumas y primas retenidas, cedidas, facultativas y Cat se calculan con el reaseguro vigente de la póliza y su configuración dinámica; la prima suscrita 100% y la vigencia se toman directamente de LifePolicy. Solo lectura. Es la base de cmdInformaReaseguroCumulos y cmdInformaReaseguroPerfilCartera.
Author: aiden_mission_configurator (MSN-000265 / AXX-11812)
*/
/*
Entrada (context): { fecha:'YYYY-MM-DD', ramos:['81','82'], tipoRamo:'FIANZAS'|'INCENDIO'|..., conCoberturas:true|false }
Salida: { fecha, tipoRamo, ramos, filas:[...], totales:{...}, coberturas:[{clave,codigo,nombre}], trazabilidad:{...}, criterio:{...} }

Reglas:
 - Vigente a la fecha D (regla del formulario original: fdesde <= D <= fhasta y no cancelada): emitida (activeDate <= D),
   inicio de la póliza <= D <= fin de la póliza, sin endoso de cancelación ejecutado hasta D y sin fecha de
   inactivación hasta D. Todas las fechas se comparan en hora de Panamá, como el borderó.
 - Reaseguro: suma por póliza de las cesiones vigentes, filtrada por las coberturas configuradas en cfgCoberturaProductoRea... para el ramo y producto.
 - Prima suscrita 100%: valor de LifePolicy.coverages, sin consultar renovaciones ni endosos ejecutados.
 - Póliza vigente sin cesión vigente: suma asegurada 100% de la póliza, reparto en cero y conCesion = false.
 - Fecha cobertura principal: mayor fin de las coberturas básicas, si no de todas, si no fin de la póliza.
 - Rango: límite superior del rango Automático (cfgInformeReaseguroRangos) del ramo o tipo de fianza; si no, el general.

SQL justification: una sola consulta de lectura arma los datos descriptivos de las pólizas vigentes (objeto asegurado,
contratante, grupo económico, catálogos de ubicación y tarifas) y la prima facturada; no hay comando Repo que devuelva esos
datos de miles de pólizas en una llamada. No escribe nada.
*/
var entrada = typeof context === 'string' ? JSON.parse(context || '{}') : (context || {});
var fecha = String(entrada.fecha || '').substring(0, 10);
var tipoRamo = String(entrada.tipoRamo || '').trim().toUpperCase();
var conCoberturas = entrada.conCoberturas === true || String(entrada.conCoberturas) === 'true';
var ramosEntrada = entrada.ramos && typeof entrada.ramos.length === 'number' ? entrada.ramos : [];
var ramos = [];
for (var ri = 0; ri < ramosEntrada.length; ri++) {
  var rv = String(ramosEntrada[ri] === null || ramosEntrada[ri] === undefined ? '' : ramosEntrada[ri]).trim();
  if (/^[A-Za-z0-9]{1,10}$/.test(rv) && ramos.indexOf(rv) < 0) ramos.push(rv);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('@La fecha de cálculo es obligatoria (YYYY-MM-DD).');
if (!ramos.length) throw new Error('@Seleccione al menos un ramo.');

function normCfg(v) { return String(v === null || v === undefined ? '' : v).trim().toUpperCase(); }
function sqlCfg(v) { return String(v === null || v === undefined ? '' : v).split("'").join("''"); }
var cfgCoberturaReaseguro = [
  { lob: 96, name: 'cfgCoberturaProductoReaTecnicos' },
  { lob: 20, name: 'cfgCoberturaProductoReaVidaColectivo' },
  { lob: 31, name: 'cfgCoberturaProductoReaVida' },
  { lob: 71, name: 'cfgCoberturaProductoReaVidaIndividual' },
  { lob: 52, name: 'cfgCoberturaProductoReaRiesgosVarios' },
  { lob: 1, name: 'cfgCoberturaProductoRea' },
  { lob: 6, name: 'cfgCoberturaProductoReaAuto' },
  { lob: 81, name: 'cfgCoberturaProductoReaFianza' },
  { lob: 82, name: 'cfgCoberturaProductoReaFianza' },
  { lob: 83, name: 'cfgCoberturaProductoReaFianza' },
  { lob: 84, name: 'cfgCoberturaProductoReaFianza' }
];
var cfgCoberturaActiva = cfgCoberturaReaseguro.filter(function (cfg) { return ramos.indexOf(String(cfg.lob)) >= 0; });
var cfgNames = [];
for (var cni = 0; cni < cfgCoberturaActiva.length; cni++) {
  if (cfgNames.indexOf(cfgCoberturaActiva[cni].name) < 0) cfgNames.push(cfgCoberturaActiva[cni].name);
}
var cfgSqlNames = cfgNames.map(function (name) { return "'" + sqlCfg(name) + "'"; }).join(',');
if (cfgSqlNames) doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT [name] AS configName, [data] AS configData FROM [Table] WHERE [name] IN (' + cfgSqlNames + ')', timeout: 60 } });
if (cfgSqlNames && !DoQuery.ok) throw new Error('@No se pudo leer la configuración de coberturas de reaseguro: ' + DoQuery.msg);
var configByName = {};
var configRecords = DoQuery.outData || [];
for (var cri = 0; cri < configRecords.length; cri++) {
  var configRecord = configRecords[cri] || {};
  var configName = configRecord.configName || configRecord.ConfigName || configRecord.name || configRecord.Name;
  var configData = configRecord.configData || configRecord.ConfigData || configRecord.data || configRecord.Data;
  if (configName) configByName[String(configName)] = configData;
}
var coveragesThatSum = {};
for (var cmi = 0; cmi < cfgCoberturaActiva.length; cmi++) {
  var cfgMap = cfgCoberturaActiva[cmi];
  if (!Object.prototype.hasOwnProperty.call(configByName, cfgMap.name)) throw '@No se encontró la configuración ' + cfgMap.name + ' en [Table].';
  var cfgRows = configByName[cfgMap.name] || [];
  if (typeof cfgRows === 'string') {
    try { cfgRows = JSON.parse(cfgRows); } catch (e) { throw '@La configuración ' + cfgMap.name + ' no contiene JSON válido.'; }
  }
  if (!Array.isArray(cfgRows) || !cfgRows.length) throw '@La configuración ' + cfgMap.name + ' no tiene el formato esperado.';
  var cfgHeaders = cfgRows[0] || [];
  function cfgIndex(name, fallback) {
    for (var hi = 0; hi < cfgHeaders.length; hi++) if (normCfg(cfgHeaders[hi]) === normCfg(name)) return hi;
    return fallback;
  }
  var ixLob = cfgIndex('lobCode', 0), ixProduct = cfgIndex('productCode', 1), ixCoverage = cfgIndex('coverageCode', 3), ixIncluded = cfgIndex('isCoverage', 5);
  for (var cri2 = 1; cri2 < cfgRows.length; cri2++) {
    var cfgRow = cfgRows[cri2] || [];
    if (normCfg(cfgRow[ixLob]) !== normCfg(cfgMap.lob) || normCfg(cfgRow[ixIncluded]) !== 'SI') continue;
    var cfgKey = [normCfg(cfgMap.lob), normCfg(cfgRow[ixProduct]), normCfg(cfgRow[ixCoverage])].join('|');
    if (cfgKey !== '||') coveragesThatSum[cfgKey] = true;
  }
}
var sumCoverageParts = [];
for (var coverageKey in coveragesThatSum) {
  if (!Object.prototype.hasOwnProperty.call(coveragesThatSum, coverageKey)) continue;
  var coverageParts = coverageKey.split('|');
  sumCoverageParts.push("(UPPER(LTRIM(RTRIM(ISNULL(c.LoB,''))))='" + sqlCfg(coverageParts[0]) + "'"
    + " AND UPPER(LTRIM(RTRIM(ISNULL(p.productCode,''))))='" + sqlCfg(coverageParts[1]) + "'"
    + " AND UPPER(LTRIM(RTRIM(ISNULL(c.coverageCode,''))))='" + sqlCfg(coverageParts[2]) + "')");
}
var sumCoveragePredicate = sumCoverageParts.length ? '(' + sumCoverageParts.join(' OR ') + ')' : '1=0';

function pan(campo) {
  return "CAST(CAST(" + campo + " AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS date)";
}
function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function r2(v) { return Math.round(num(v) * 100) / 100; }
function txt(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function filasDe(lista) {
  var out = [];
  if (!lista || typeof lista.length !== 'number') return out;
  for (var i = 0; i < lista.length; i++) out.push(lista[i]);
  return out;
}

/* 1. Pólizas vigentes a la fecha y sus datos descriptivos. */
var lobIn = ramos.map(function (x) { return "'" + x + "'"; }).join(',');
/* 2. Pólizas vigentes a la fecha y sus datos descriptivos. */
var usaDetalleRamo = tipoRamo === 'FIANZAS' || tipoRamo === 'INCENDIO';
var camposObjeto = tipoRamo === 'FIANZAS'
  ? ['nombre', 'secuestrante', 'desc_objeto_afianzado', 'desc_garantia', 'valor_garantia', 'ivigenciaf']
  : (tipoRamo === 'INCENDIO'
    ? ['cmbPais', 'cmbProvincia', 'cmbMunicipio', 'cmbSector', 'txtBarriadas', 'cmbBarriadas', 'txtEdificios', 'cmbEdificios', 'cmbZonaCresta', 'cmbUsoBien', 'cmbTipoObjeto', 'calleoavenida', 'direccionexacta']
    : []);
var camposObjetoSql = camposObjeto.length ? camposObjeto.map(function (name) { return "'" + sqlCfg(name) + "'"; }).join(',') : "''";
var esIncendio = tipoRamo === 'INCENDIO';
var tablaCtesSql = "tbl AS (SELECT t.name, t.data FROM [Table] t WHERE t.name IN ('cfgGrupoEconomico'))\n"
  + ",tGrupo AS (SELECT x.c0, x.c1 FROM tbl CROSS APPLY OPENJSON(tbl.data) WITH (c0 nvarchar(50) '$[0]', c1 nvarchar(400) '$[1]') x WHERE tbl.name = 'cfgGrupoEconomico')\n";
var catalogJoinsSql = '';
var ubicacionSql = "  cp.provincia AS provincia, cp.distrito AS distrito, cp.corregimiento AS corregimiento,\n"
  + "  cp.barriadaTexto AS barriada, cp.edificioTexto AS edificio, cp.zonaCresta AS zonaCresta, cp.usoBien AS usoBien,\n";
if (esIncendio) {
  tablaCtesSql = "tbl AS (SELECT t.name, t.data FROM [Table] t WHERE t.name IN ('cfgGrupoEconomico','ZonaCresta','TablaUsoBien','Barriadas','Edificios')),\n"
    + "tGrupo AS (SELECT x.c0, x.c1 FROM tbl CROSS APPLY OPENJSON(tbl.data) WITH (c0 nvarchar(50) '$[0]', c1 nvarchar(400) '$[1]') x WHERE tbl.name = 'cfgGrupoEconomico'),\n"
    + "tZona AS (SELECT x.c0, x.c1 FROM tbl CROSS APPLY OPENJSON(tbl.data) WITH (c0 nvarchar(50) '$[0]', c1 nvarchar(400) '$[1]') x WHERE tbl.name = 'ZonaCresta'),\n"
    + "tUso AS (SELECT x.c0, x.c1 FROM tbl CROSS APPLY OPENJSON(tbl.data) WITH (c0 nvarchar(50) '$[0]', c1 nvarchar(400) '$[1]') x WHERE tbl.name = 'TablaUsoBien'),\n"
    + "tBarr AS (SELECT x.c0, x.c3 FROM tbl CROSS APPLY OPENJSON(tbl.data) WITH (c0 nvarchar(50) '$[0]', c3 nvarchar(400) '$[3]') x WHERE tbl.name = 'Barriadas'),\n"
    + "tEdif AS (SELECT x.c3, x.c4, x.c5 FROM tbl CROSS APPLY OPENJSON(tbl.data) WITH (c3 nvarchar(50) '$[3]', c4 nvarchar(50) '$[4]', c5 nvarchar(400) '$[5]') x WHERE tbl.name = 'Edificios')\n";
  ubicacionSql = "  ISNULL(st.name, cp.provincia) AS provincia, ISNULL(ci.name, cp.distrito) AS distrito, ISNULL(se.name, cp.corregimiento) AS corregimiento,\n"
    + "  COALESCE(NULLIF(LTRIM(RTRIM(cp.barriadaTexto)), ''), tBarr.c3) AS barriada,\n"
    + "  COALESCE(NULLIF(LTRIM(RTRIM(cp.edificioTexto)), ''), tEdif.c5) AS edificio,\n"
    + "  COALESCE(tZona.c1, tZona2.c1) AS zonaCresta, tUso.c1 AS usoBien,\n";
  catalogJoinsSql = "OUTER APPLY (SELECT TOP 1 s.name, s.riskZone FROM StateCatalog s WHERE s.[code] = cp.provincia AND s.countryCode = ISNULL(cp.pais, '591')) st\n"
    + "OUTER APPLY (SELECT TOP 1 c.name FROM CityCatalog c WHERE c.[code] = cp.distrito) ci\n"
    + "OUTER APPLY (SELECT TOP 1 s2.name FROM SectorCatalog s2 WHERE s2.[code] = cp.corregimiento) se\n"
    + "OUTER APPLY (SELECT TOP 1 b.c3 FROM tBarr b WHERE b.c0 = cp.barriadaId AND ISNULL(cp.barriadaId, '0') <> '0') tBarr\n"
    + "OUTER APPLY (SELECT TOP 1 e.c5 FROM tEdif e WHERE e.c4 = cp.edificioId AND e.c3 = cp.corregimiento AND ISNULL(cp.edificioId, '0') <> '0') tEdif\n"
    + "LEFT JOIN tZona ON tZona.c0 = cp.zonaCresta\n"
    + "LEFT JOIN tZona tZona2 ON tZona2.c0 = st.riskZone AND tZona.c0 IS NULL\n"
    + "LEFT JOIN tUso ON tUso.c0 = cp.usoBien\n";
}
var objetoCtesSql = usaDetalleRamo
  ? "obj AS (\n"
    + "  SELECT pol.id, o.jValues FROM pol\n"
    + "  OUTER APPLY (SELECT TOP 1 io.jValues FROM InsuredObject io WHERE io.lifePolicyId = pol.id AND ISJSON(io.jValues) = 1\n"
    + "               AND io.jValues LIKE '%userData%' ORDER BY CASE WHEN io.jValues LIKE '%cmbProvincia%' OR io.jValues LIKE '%suma_afianzada%' THEN 0 ELSE 1 END, io.id) o\n"
    + "),\n"
  : "obj AS (SELECT pol.id, CAST(NULL AS nvarchar(max)) AS jValues FROM pol WHERE 1=0),\n";
var paginaSolicitada = Math.max(1, Math.floor(num(entrada.pagina)) || 1);
var tamanoSolicitado = Math.max(1, Math.floor(num(entrada.tamanoPagina)) || 50);
var paginarSql = num(entrada.pagina) > 0 && num(entrada.tamanoPagina) > 0;
var polPageSql = paginarSql
  ? "pol AS (SELECT * FROM polBase ORDER BY lob, [code], id OFFSET " + ((paginaSolicitada - 1) * tamanoSolicitado) + " ROWS FETCH NEXT " + tamanoSolicitado + " ROWS ONLY),\n"
  : "pol AS (SELECT * FROM polBase),\n";
var sql = "DECLARE @d date = '" + fecha + "';\n"
  + "DECLARE @dNext date = DATEADD(day, 1, @d);\n"
  + "DECLARE @utcFrom datetime2 = CONVERT(datetime2, ((CAST(@d AS datetime2) AT TIME ZONE 'SA Pacific Standard Time') AT TIME ZONE 'UTC'));\n"
  + "DECLARE @utcNext datetime2 = CONVERT(datetime2, ((CAST(@dNext AS datetime2) AT TIME ZONE 'SA Pacific Standard Time') AT TIME ZONE 'UTC'));\n"
  + "WITH polBase AS (\n"
  + "  SELECT p.id, p.[code], p.lob, p.productCode, p.holderId, p.insuredSum, p.currency, p.[start], p.[end], p.activeDate,\n"
  + "         p.coverages AS primaPoliza, p.[start] AS inicio\n"
  + "  FROM LifePolicy p\n"
  + "  WHERE p.lob IN (" + lobIn + ") AND p.activeDate IS NOT NULL\n"
  + "    AND p.activeDate < @utcNext\n"
  + "    AND p.[start] < @utcNext AND p.[end] >= @utcFrom\n"
  + "    AND (p.inactiveDate IS NULL OR p.inactiveDate >= @utcNext)\n"
  + "    AND NOT EXISTS (SELECT 1 FROM Change cx WHERE cx.lifePolicyId = p.id AND cx.status = 1\n"
  + "                    AND cx.Discriminator = 'CancellationChange' AND cx.executionDate < @utcNext)\n"
  + "),\n"
  + polPageSql
  + objetoCtesSql
  + "campo AS (\n"
  + "  SELECT obj.id, f.nm, MAX(f.v) AS v\n"
  + "  FROM obj CROSS APPLY OPENJSON(obj.jValues) WITH (nm nvarchar(100) '$.name', v nvarchar(4000) '$.userData[0]') f\n"
  + "  WHERE f.nm IN (" + camposObjetoSql + ")\n"
  + "  GROUP BY obj.id, f.nm\n"
  + "),\n"
  + "cp AS (\n"
  + "  SELECT c.id,\n"
  + "    MAX(CASE WHEN c.nm = 'nombre' THEN c.v END) AS aFavorDe,\n"
  + "    MAX(CASE WHEN c.nm = 'secuestrante' THEN c.v END) AS secuestrante,\n"
  + "    MAX(CASE WHEN c.nm = 'desc_objeto_afianzado' THEN c.v END) AS objetoAfianzado,\n"
  + "    MAX(CASE WHEN c.nm = 'desc_garantia' THEN c.v END) AS descripcionGarantia,\n"
  + "    MAX(CASE WHEN c.nm = 'valor_garantia' THEN c.v END) AS valorGarantia,\n"
  + "    MAX(CASE WHEN c.nm = 'ivigenciaf' THEN c.v END) AS ivigencia,\n"
  + "    MAX(CASE WHEN c.nm = 'cmbPais' THEN c.v END) AS pais,\n"
  + "    MAX(CASE WHEN c.nm = 'cmbProvincia' THEN c.v END) AS provincia,\n"
  + "    MAX(CASE WHEN c.nm = 'cmbMunicipio' THEN c.v END) AS distrito,\n"
  + "    MAX(CASE WHEN c.nm = 'cmbSector' THEN c.v END) AS corregimiento,\n"
  + "    MAX(CASE WHEN c.nm = 'txtBarriadas' THEN c.v END) AS barriadaTexto,\n"
  + "    MAX(CASE WHEN c.nm = 'cmbBarriadas' THEN c.v END) AS barriadaId,\n"
  + "    MAX(CASE WHEN c.nm = 'txtEdificios' THEN c.v END) AS edificioTexto,\n"
  + "    MAX(CASE WHEN c.nm = 'cmbEdificios' THEN c.v END) AS edificioId,\n"
  + "    MAX(CASE WHEN c.nm = 'cmbZonaCresta' THEN c.v END) AS zonaCresta,\n"
  + "    MAX(CASE WHEN c.nm = 'cmbUsoBien' THEN c.v END) AS usoBien,\n"
  + "    MAX(CASE WHEN c.nm = 'cmbTipoObjeto' THEN c.v END) AS tipoObjeto,\n"
  + "    MAX(CASE WHEN c.nm = 'calleoavenida' THEN c.v END) AS calle,\n"
  + "    MAX(CASE WHEN c.nm = 'direccionexacta' THEN c.v END) AS direccion\n"
  + "  FROM campo c GROUP BY c.id\n"
  + "),\n"
  + "grp AS (\n"
  + "  SELECT pol.id, MAX(fld.ud) AS grupoId FROM pol\n"
  + "  JOIN Contact ct ON ct.id = pol.holderId AND ISJSON(ct.jCustomForms) = 1\n"
  + "  CROSS APPLY OPENJSON(ct.jCustomForms) tabs\n"
  + "  CROSS APPLY OPENJSON(tabs.[value]) WITH (fname varchar(100) '$.name', ud nvarchar(100) '$.userData[0]') fld\n"
  + "  WHERE fld.fname = 'grupoEconomico' AND ISNULL(fld.ud, '') <> ''\n"
  + "  GROUP BY pol.id\n"
  + "),\n"
  + tablaCtesSql
  + "SELECT (SELECT COUNT(*) FROM polBase) AS total, (\n"
  + "SELECT pol.id, pol.[code] AS poliza, pol.lob, l.name AS ramo, pol.productCode AS planCodigo, pr.name AS [plan], pol.currency AS moneda,\n"
  + "  " + pan('pol.activeDate') + " AS fechaEmision,\n"
  + "  " + pan('pol.inicio') + " AS fechaInicial,\n"
  + "  " + pan('pol.[end]') + " AS fechaFinal,\n"
  + "  " + pan("COALESCE((SELECT MAX(lc.[end]) FROM LifeCoverage lc WHERE lc.lifePolicyId = pol.id AND lc.basic = 1), (SELECT MAX(lc.[end]) FROM LifeCoverage lc WHERE lc.lifePolicyId = pol.id), pol.[end])") + " AS fechaCobPrincipal,\n"
  + "  DATEDIFF(day, " + pan('pol.inicio') + ", " + pan('pol.[end]') + ") AS vigenciaDias,\n"
  + "  pol.insuredSum AS sumaPoliza, pol.holderId,\n"
  + "  LTRIM(RTRIM(ISNULL(hc.name,'') + ' ' + ISNULL(hc.surname1,'') + ' ' + ISNULL(hc.surname2,''))) AS cliente,\n"
  + "  (SELECT TOP 1 lc.[code] FROM LifeCoverage lc WHERE lc.lifePolicyId = pol.id ORDER BY CASE WHEN lc.basic = 1 THEN 0 ELSE 1 END, lc.id) AS cobPrincipalCodigo,\n"
  + "  (SELECT TOP 1 lc.name FROM LifeCoverage lc WHERE lc.lifePolicyId = pol.id ORDER BY CASE WHEN lc.basic = 1 THEN 0 ELSE 1 END, lc.id) AS cobPrincipal,\n"
  + "  pol.primaPoliza AS primaBase,\n"
  + "  0 AS primaEndosos, 0 AS endosos,\n"
  + "  cp.aFavorDe, cp.secuestrante, cp.objetoAfianzado, cp.descripcionGarantia, cp.valorGarantia, cp.ivigencia,\n"
  + ubicacionSql
  + "  cp.tipoObjeto, cp.calle, cp.direccion,\n"
  + "  tGrupo.c1 AS grupoEconomico\n"
  + "FROM pol\n"
  + "LEFT JOIN Lob l ON l.[code] = pol.lob\n"
  + "LEFT JOIN Product pr ON pr.[code] = pol.productCode\n"
  + "LEFT JOIN Contact hc ON hc.id = pol.holderId\n"
  + "LEFT JOIN cp ON cp.id = pol.id\n"
  + "LEFT JOIN grp ON grp.id = pol.id\n"
  + "LEFT JOIN tGrupo ON tGrupo.c0 = grp.grupoId\n"
  + catalogJoinsSql
  + "ORDER BY pol.lob, pol.[code], pol.id\n"
  + "FOR JSON PATH, INCLUDE_NULL_VALUES) AS j";

doCmd({ cmd: 'DoQuery', data: { sql: sql, timeout: 110 } });
if (!DoQuery.ok) throw new Error('@No se pudieron leer las pólizas vigentes: ' + DoQuery.msg);
var bruto = DoQuery.outData && DoQuery.outData.length ? DoQuery.outData[0].j : null;
var polizas = bruto ? JSON.parse(bruto) : [];
var totalPolizas = Number(DoQuery.outData && DoQuery.outData.length ? DoQuery.outData[0].total : 0) || 0;

/* 3. Reaseguro vigente: solo se consulta para las pólizas ya filtradas como vigentes. */
var cesionesVigentes = [];
var acum = {};
var idsPolizas = polizas.map(function (p) { return Number(p.id); }).filter(function (id) { return id > 0; });
for (var cb = 0; cb < idsPolizas.length; cb += 900) {
  var lotePolizas = idsPolizas.slice(cb, cb + 900).join(',');
  var reaseguroSql = "SELECT c.lifePolicyId AS id, COUNT(*) AS movimientos,\n"
    + "  SUM(CASE WHEN " + sumCoveragePredicate + " THEN ISNULL(c.sumInsuredCedant, 0) ELSE 0 END) AS sumaRetenida,\n"
    + "  SUM(CASE WHEN " + sumCoveragePredicate + " THEN ISNULL(c.sumInsuredRe, 0) ELSE 0 END) AS sumaCedidaTotal,\n"
    + "  SUM(CASE WHEN " + sumCoveragePredicate + " AND UPPER(LTRIM(RTRIM(ISNULL(c.lineId, '')))) LIKE 'FAC%' THEN ISNULL(c.sumInsuredRe, 0) ELSE 0 END) AS sumaFacultativa,\n"
    + "  SUM(ISNULL(c.premiumCedant, 0)) AS primaRetenida,\n"
    + "  SUM(ISNULL(c.premiumRe, 0)) AS primaCedidaTotal,\n"
    + "  SUM(CASE WHEN UPPER(LTRIM(RTRIM(ISNULL(c.lineId, '')))) LIKE 'FAC%' THEN ISNULL(c.premiumRe, 0) ELSE 0 END) AS primaFacultativa,\n"
    + "  SUM(ISNULL(c.nonTechnicalPremium, 0)) AS primaCat,\n"
    + "  SUM(CASE WHEN " + sumCoveragePredicate + " THEN ISNULL(c.sumInsuredCedant, 0) + ISNULL(c.sumInsuredRe, 0) ELSE 0 END) AS sumaAsegurada100\n"
    + "FROM Cession c INNER JOIN LifePolicy p ON p.id = c.lifePolicyId\n"
    + "WHERE c.lifePolicyId IN (" + lotePolizas + ") AND ISNULL(c.overwritten, 0) = 0\n"
    + "GROUP BY c.lifePolicyId";
  doCmd({ cmd: 'DoQuery', data: { sql: reaseguroSql, timeout: 60 } });
  if (!DoQuery.ok) throw new Error('@No se pudo leer el reaseguro vigente: ' + DoQuery.msg);
  cesionesVigentes = cesionesVigentes.concat(filasDe(DoQuery.outData));
}
for (var ci = 0; ci < cesionesVigentes.length; ci++) {
  var cession = cesionesVigentes[ci];
  acum[String(cession.id)] = {
    movimientos: num(cession.movimientos),
    sumaAsegurada100: num(cession.sumaAsegurada100),
    sumaCoaseguro: 0,
    sumaRetenida: num(cession.sumaRetenida),
    sumaCedidaTotal: num(cession.sumaCedidaTotal),
    sumaFacultativa: num(cession.sumaFacultativa),
    primaRetenida: num(cession.primaRetenida),
    primaCedidaTotal: num(cession.primaCedidaTotal),
    primaFacultativa: num(cession.primaFacultativa),
    primaCat: num(cession.primaCat),
    primaCoaseguro: 0
  };
}

/* 4. Rangos automáticos del perfil, para la columna Rango. */
var rangos = [];
doCmd({ cmd: 'GetFullTable', data: { table: 'cfgInformeReaseguroRangos' } });
if (GetFullTable.ok && GetFullTable.outData && GetFullTable.outData.length > 1) {
  var tabla = filasDe(GetFullTable.outData);
  var cab = filasDe(tabla[0]).map(function (h) { return txt(h); });
  var iTipo = cab.indexOf('tipo'), iClave = cab.indexOf('clave'), iDesde = cab.indexOf('desde'), iHasta = cab.indexOf('hasta');
  for (var ti = 1; ti < tabla.length; ti++) {
    var fr = filasDe(tabla[ti]);
    if (txt(fr[iTipo]).toUpperCase() !== 'AUTOMATICO') continue;
    rangos.push({ clave: txt(fr[iClave]), desde: num(fr[iDesde]), hasta: num(fr[iHasta]) });
  }
}
/* Mismas reglas que cmdInformaReaseguroPerfilCartera: suma en unidades enteras; menor que el primer rango, el primero;
   mayor que el último, el último; en un hueco entre rangos, sin rango (null). */
function rangoDe(clave, suma) {
  var propios = rangos.filter(function (x) { return x.clave === clave; });
  var lista = (propios.length ? propios : rangos.filter(function (x) { return x.clave === '*'; }))
    .sort(function (a, b) { return a.desde - b.desde; });
  if (!lista.length) return null;
  var s = Math.floor(num(suma));
  for (var i = 0; i < lista.length; i++) if (s >= lista[i].desde && s <= lista[i].hasta) return lista[i].hasta;
  if (s < lista[0].desde) return lista[0].hasta;
  if (s > lista[lista.length - 1].hasta) return lista[lista.length - 1].hasta;
  return null;
}

/* 4. Coberturas por póliza, solo si se piden. */
var coberturasPorPoliza = {}, coberturas = [], vistas = {};
if (conCoberturas && polizas.length) {
  var ids = polizas.map(function (p) { return p.id; });
  for (var b = 0; b < ids.length; b += 900) {
    var lote = ids.slice(b, b + 900).join(',');
    doCmd({ cmd: 'DoQuery', data: { sql: "SELECT (SELECT lc.lifePolicyId AS p, lp.lob AS l, lc.[code] AS c, MAX(lc.name) AS n, SUM(ISNULL(lc.limit, 0)) AS s FROM LifeCoverage lc JOIN LifePolicy lp ON lp.id = lc.lifePolicyId WHERE lc.lifePolicyId IN (" + lote + ") GROUP BY lc.lifePolicyId, lp.lob, lc.[code] FOR JSON PATH) AS j", timeout: 60 } });
    if (!DoQuery.ok) throw new Error('@No se pudieron leer las coberturas: ' + DoQuery.msg);
    var cj = DoQuery.outData && DoQuery.outData.length && DoQuery.outData[0].j ? JSON.parse(DoQuery.outData[0].j) : [];
    for (var ci2 = 0; ci2 < cj.length; ci2++) {
      var cob = cj[ci2], clave = 'cob' + (txt(cob.l) + 'x' + txt(cob.c)).replace(/[^A-Za-z0-9]/g, '');
      if (!vistas[clave]) { vistas[clave] = true; coberturas.push({ clave: clave, lob: txt(cob.l), codigo: txt(cob.c), nombre: txt(cob.n) }); }
      var pc = coberturasPorPoliza[cob.p] || (coberturasPorPoliza[cob.p] = {});
      pc[clave] = r2(num(pc[clave]) + num(cob.s));
    }
  }
  coberturas.sort(function (x, y) { var a = x.lob + '|' + x.codigo, z = y.lob + '|' + y.codigo; return a < z ? -1 : (a > z ? 1 : 0); });
}

/* 5. Filas del informe. */
var CAMPOS_TOTAL = ['sumaAsegurada100', 'sumaRetenida', 'sumaCedida', 'sumaFacultativa', 'sumaCoaseguro', 'primaSuscrita100', 'primaRetenida', 'primaCedida', 'primaFacultativa', 'primaCat', 'primaCoaseguro'];
var totales = { cantidad: 0 };
CAMPOS_TOTAL.forEach(function (c) { totales[c] = 0; });
var filas = [], conCesion = 0, conDescuadre = 0;
for (var pi = 0; pi < polizas.length; pi++) {
  var p = polizas[pi];
  var ac = acum[String(p.id)];
  var esFianza = ['81', '82', '83', '84'].indexOf(txt(p.lob)) >= 0;
  var fila = {
    id: p.id, poliza: txt(p.poliza) || String(p.id), lob: txt(p.lob), ramo: txt(p.ramo), planCodigo: txt(p.planCodigo), plan: txt(p.plan) || txt(p.planCodigo),
    moneda: txt(p.moneda), fechaEmision: txt(p.fechaEmision), fechaInicial: txt(p.fechaInicial), fechaFinal: txt(p.fechaFinal),
    fechaCobPrincipal: txt(p.fechaCobPrincipal), vigenciaDias: num(p.vigenciaDias),
    cliente: txt(p.cliente), holderId: p.holderId, asegurado: ac && ac.asegurado ? ac.asegurado : txt(p.cliente), serie: ac ? ac.serie : '',
    grupoEconomico: txt(p.grupoEconomico),
    tipoFianza: esFianza ? txt(p.cobPrincipal) : '', tipoFianzaClave: esFianza ? txt(p.lob) + '|' + txt(p.cobPrincipalCodigo) : '',
    garantizadoA: txt(p.objetoAfianzado), beneficiario: txt(p.aFavorDe),
    estadoFianza: esFianza ? (txt(p.ivigencia) === 'A' ? 'Activa' : (txt(p.ivigencia) === 'I' ? 'Inactiva' : 'Pendiente')) : '',
    secuestrante: txt(p.secuestrante), descripcionGarantia: txt(p.descripcionGarantia), valorGarantia: txt(p.valorGarantia),
    tipoRiesgo: txt(p.usoBien), tipoObjeto: txt(p.tipoObjeto), provincia: txt(p.provincia), distrito: txt(p.distrito), corregimiento: txt(p.corregimiento),
    barriada: txt(p.barriada), edificio: txt(p.edificio), zonaCresta: txt(p.zonaCresta), direccion: [txt(p.calle), txt(p.direccion)].filter(function (x) { return x; }).join(' - '),
    conCesion: !!ac, cesionesVigentes: ac ? ac.movimientos : 0,
    sumaAsegurada100: ac ? r2(ac.sumaAsegurada100) : r2(p.sumaPoliza),
    sumaRetenida: ac ? r2(ac.sumaRetenida) : 0,
    sumaCedida: ac ? r2(ac.sumaCedidaTotal - ac.sumaFacultativa) : 0,
    sumaFacultativa: ac ? r2(ac.sumaFacultativa) : 0,
    sumaCoaseguro: ac ? r2(ac.sumaCoaseguro) : 0,
    primaSuscrita100: r2(num(p.primaBase)),
    primaRetenida: ac ? r2(ac.primaRetenida) : 0,
    primaCedida: ac ? r2(ac.primaCedidaTotal - ac.primaFacultativa) : 0,
    primaFacultativa: ac ? r2(ac.primaFacultativa) : 0,
    primaCat: ac ? r2(ac.primaCat) : 0,
    primaCoaseguro: ac ? r2(ac.primaCoaseguro) : 0
  };
  fila.tasa = fila.sumaAsegurada100 ? Math.round(fila.primaSuscrita100 / fila.sumaAsegurada100 * 100 * 10000) / 10000 : 0;
  fila.tarifa = fila.tasa < 0.16 ? 'Residencial' : 'Comercial';
  fila.rango = rangoDe(esFianza ? fila.tipoFianzaClave : fila.lob, fila.sumaAsegurada100);
  if (conCoberturas) {
    var pcs = coberturasPorPoliza[p.id] || {};
    for (var cx = 0; cx < coberturas.length; cx++) fila[coberturas[cx].clave] = num(pcs[coberturas[cx].clave]);
  }
  fila.descuadrePrima = ac ? r2(fila.primaSuscrita100 - (fila.primaRetenida + fila.primaCedida + fila.primaFacultativa + fila.primaCat + fila.primaCoaseguro)) : 0;
  if (Math.abs(fila.descuadrePrima) >= 1) conDescuadre++;
  if (ac) conCesion++;
  totales.cantidad++;
  CAMPOS_TOTAL.forEach(function (c) { totales[c] += fila[c]; });
  filas.push(fila);
}
CAMPOS_TOTAL.forEach(function (c) { totales[c] = r2(totales[c]); });

var totalFilas = paginarSql ? totalPolizas : filas.length;
var pagina = paginarSql ? paginaSolicitada : 0;
var tamanoPagina = paginarSql ? tamanoSolicitado : totalFilas;
var filasSalida = filas;

return {
  fecha: fecha,
  tipoRamo: tipoRamo,
  ramos: ramos,
  filas: filasSalida,
  total: totalFilas,
  pagina: pagina,
  tamanoPagina: tamanoPagina,
  totales: totales,
  coberturas: coberturas,
  trazabilidad: {
    polizasVigentes: totalFilas,
    polizasConCesion: conCesion,
    polizasSinCesion: totalFilas - conCesion,
    cesionesVigentes: cesionesVigentes.length,
    polizasConReaseguroVigente: Object.keys(acum).length,
    polizasConDescuadrePrima: conDescuadre
  },
  criterio: {
    vigencia: 'emitida a la fecha, inicio de la vigencia original <= fecha <= fin de la póliza, sin cancelación ejecutada ni inactivación hasta la fecha (hora de Panamá)',
    reaseguro: 'distribución vigente de Cession por póliza, filtrada con overwritten=0; cedida = contratos, facultativa aparte',
    primaSuscrita: 'prima vigente de la renovacion ejecutada, del snapshot de emision o de la poliza'
  }
};
