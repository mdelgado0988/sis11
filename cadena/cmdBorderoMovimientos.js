//block
//noreplace
/*
 * Name: cmdBorderoMovimientos
 * AXX-252 - Bordero (Nuevo). Movimientos de reaseguro por emision/endoso.
 * Cada fila expone la VARIACION que causo ese movimiento (posterior - anterior),
 * nunca el saldo vigente repetido. Filtro, agregacion y paginacion en servidor.
 * context: { fdesde:'YYYY-MM-DD', fhasta:'YYYY-MM-DD', ramos:['1','81'], poliza:'FC-', page:1, size:50 }
 *
 * AXX-300 - la consulta solo devuelve movimientos VIGENTES y EJECUTADOS:
 *   poliza emitida  -> LifePolicy.activeDate IS NOT NULL
 *   endoso ejecutado -> Change.status = 1 (solo para movimientos con changeId)
 * Se aplica en servidor, junto a los filtros de periodo y ramo, no en lugar de ellos.
 */
var ctx = context || {};
var fdesde = ctx.fdesde ? String(ctx.fdesde).substring(0,10) : '';
var fhasta = ctx.fhasta ? String(ctx.fhasta).substring(0,10) : '';
var ramos  = ctx.ramos || [];
var poliza = ctx.poliza ? String(ctx.poliza).trim() : '';
var page = parseInt(ctx.page, 10); if (!(page > 0)) { page = 1; }
var size = parseInt(ctx.size, 10); if (!(size > 0)) { size = 50; }
if (size > 500) { size = 500; }
/* AXX-271 - modo exportacion. La grilla sigue topeada en 500 por pagina; la exportacion
   pide el conjunto COMPLETO de la busqueda, con los mismos filtros y el mismo orden,
   resuelto en servidor. El tamano NO lo elige el cliente: se fija al total contado. */
var exportar = (ctx.exportar === true || String(ctx.exportar) === 'true');

function esFecha(s) {
  if (!s || s.length !== 10) { return false; }
  if (s.charAt(4) !== '-' || s.charAt(7) !== '-') { return false; }
  var p = s.split('-');
  if (p.length !== 3) { return false; }
  var y = parseInt(p[0],10), m = parseInt(p[1],10), d = parseInt(p[2],10);
  if (!(y > 1900 && y < 3000)) { return false; }
  if (!(m >= 1 && m <= 12)) { return false; }
  if (!(d >= 1 && d <= 31)) { return false; }
  return (String(y).length === 4 && p[1].length === 2 && p[2].length === 2);
}

var errs = [];
if (!esFecha(fdesde)) { errs.push('Fecha Inicial es obligatoria y debe tener formato YYYY-MM-DD.'); }
if (!esFecha(fhasta)) { errs.push('Fecha Final es obligatoria y debe tener formato YYYY-MM-DD.'); }
if (errs.length === 0 && fdesde > fhasta) { errs.push('La Fecha Inicial debe ser menor o igual a la Fecha Final.'); }
var tieneRamo = Array.isArray(ramos) && ramos.length > 0;
if (!tieneRamo && !poliza) { errs.push('Debe seleccionar al menos un Ramo o indicar una Póliza.'); }
if (errs.length > 0) { throw errs.join(' '); }

var lobList = [];
for (var i = 0; i < ramos.length; i++) {
  var v = String(ramos[i]).split("'").join("''");
  if (v.length > 0) { lobList.push("'" + v + "'"); }
}
var lobIn = lobList.join(',');
var lobPred = tieneRamo ? ('c.LoB IN (' + lobIn + ')') : '1=1';
var polizaSql = poliza.split("'").join("''");
var polizaPred = poliza
  ? "EXISTS (SELECT 1 FROM LifePolicy lp0 WHERE lp0.id = c.lifePolicyId AND lp0.code LIKE '%" + polizaSql + "%')"
  : '1=1';

var base    = "\nWITH scope AS (\n  SELECT DISTINCT c.lifePolicyId FROM Cession c WHERE @@SCOPE@@\n),\nraw AS (\n  SELECT c.id, c.lifePolicyId, c.contractId, c.coverageId, c.lineId, c.LoB AS lob,\n         c.premiumType, c.changeId, c.anniversaryId, c.contactId, c.holderName,\n         c.start AS dstart, c.[end] AS dend, c.overwritten,\n         c.sumInsured, c.proportionRe,\n         c.sumInsuredCedant, c.sumInsuredRe, c.premiumCedant, c.premiumRe,\n         c.nonTechnicalPremium, c.comissionCedant, c.tax,\n         CASE WHEN c.changeId IS NULL AND c.premiumType IN ('CHANGE','CANCELLATION','REVERT')\n              THEN 1 ELSE 0 END AS isRev,\n         CASE WHEN c.changeId IS NOT NULL\n                    AND (c.premiumType = 'CANCELLATION' OR ISNULL(c.sumInsuredRe,0) < 0)\n              THEN 1 ELSE 0 END AS isCanc\n  FROM Cession c\n  INNER JOIN scope sc ON sc.lifePolicyId = c.lifePolicyId\n),\n/* Cambios EJECUTADOS de la poliza, en orden de ejecucion. Es la secuencia con la que se\n   atribuye un retiro: el reverso lo produce el cambio SIGUIENTE al que creo la generacion. */\nchgseq AS (\n  SELECT ch.id, ch.lifePolicyId, ch.executionDate, ch.effectiveDate,\n         ROW_NUMBER() OVER (PARTITION BY ch.lifePolicyId ORDER BY ch.executionDate, ch.id) AS seq\n  FROM Change ch\n  INNER JOIN scope sc ON sc.lifePolicyId = ch.lifePolicyId\n  WHERE ch.status = 1\n),\n/* Particiones RETIRADAS: tienen filas de reverso y ninguna generacion vigente. */\npartwd AS (\n  SELECT r.lifePolicyId, r.contractId, r.coverageId, r.lineId,\n         MAX(CASE WHEN r.isRev = 1 THEN r.id END) AS lastRevId,\n         MAX(CASE WHEN r.isRev = 0 THEN r.id END) AS lastGenId\n  FROM raw r\n  GROUP BY r.lifePolicyId, r.contractId, r.coverageId, r.lineId\n  HAVING SUM(CASE WHEN r.isRev = 1 THEN 1 ELSE 0 END) > 0\n     AND SUM(CASE WHEN r.isRev = 0 AND r.overwritten = 0 THEN 1 ELSE 0 END) = 0\n     AND SUM(CASE WHEN r.isCanc = 1 THEN 1 ELSE 0 END) = 0\n),\n/* El cambio que hizo el retiro: el ejecutado que sigue al que creo la generacion reversada. */\nwdchg AS (\n  SELECT p.lifePolicyId, p.contractId, p.coverageId, p.lineId, p.lastRevId,\n         (SELECT TOP 1 cs2.id FROM chgseq cs2\n           WHERE cs2.lifePolicyId = p.lifePolicyId\n             AND cs2.seq > ISNULL((SELECT cs1.seq FROM chgseq cs1\n                                    WHERE cs1.id = (SELECT TOP 1 g.changeId FROM raw g\n                                                     WHERE g.lifePolicyId = p.lifePolicyId\n                                                       AND g.contractId = p.contractId\n                                                       AND g.coverageId = p.coverageId\n                                                       AND g.lineId = p.lineId\n                                                       AND g.isRev = 0 AND g.id < p.lastRevId\n                                                     ORDER BY g.id DESC)), 0)\n           ORDER BY cs2.seq) AS wdChangeId\n  FROM partwd p\n),\n/* Pasos del recorrido: generaciones y cancelaciones tal cual, mas el paso terminal de retiro. */\nsteps AS (\n  SELECT r.id AS ordId, r.id, r.lifePolicyId, r.contractId, r.coverageId, r.lineId, r.lob,\n         r.premiumType, r.changeId, r.anniversaryId, r.contactId, r.holderName,\n         r.dstart, r.dend, r.isCanc, 0 AS isTerm,\n         r.sumInsured, r.proportionRe, r.overwritten,\n         ISNULL(r.sumInsuredCedant,0) AS vSiCed, ISNULL(r.sumInsuredRe,0) AS vSiRe,\n         ISNULL(r.premiumCedant,0) AS vPrCed, ISNULL(r.premiumRe,0) AS vPrRe,\n         ISNULL(r.nonTechnicalPremium,0) AS vNtp, ISNULL(r.comissionCedant,0) AS vCom,\n         ISNULL(r.tax,0) AS vTax,\n         CASE WHEN r.lifePolicyId IS NULL OR r.lineId IS NULL OR r.contractId IS NULL\n                   OR r.dstart IS NULL OR r.dend IS NULL THEN 1 ELSE 0 END AS filaIncompleta,\n         CASE WHEN r.sumInsuredRe IS NULL OR r.sumInsuredCedant IS NULL OR r.premiumRe IS NULL\n                   OR r.premiumCedant IS NULL OR r.comissionCedant IS NULL OR r.tax IS NULL\n                   OR r.nonTechnicalPremium IS NULL THEN 1 ELSE 0 END AS importeNulo\n  FROM raw r\n  WHERE r.isRev = 0\n  UNION ALL\n  SELECT w.lastRevId AS ordId, w.lastRevId AS id, w.lifePolicyId, w.contractId, w.coverageId,\n         w.lineId, MAX(rr.lob), 'CHANGE', w.wdChangeId, NULL, MAX(rr.contactId), MAX(rr.holderName),\n         MAX(rr.dstart), MAX(rr.dend), 0 AS isCanc, 1 AS isTerm,\n         0, 0, 1,\n         0, 0, 0, 0, 0, 0, 0,\n         0, 0\n  FROM wdchg w\n  INNER JOIN raw rr ON rr.id = w.lastRevId\n  WHERE w.wdChangeId IS NOT NULL\n  GROUP BY w.lastRevId, w.lifePolicyId, w.contractId, w.coverageId, w.lineId, w.wdChangeId\n),\nord AS (\n  SELECT s.*,\n    ROW_NUMBER() OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId,\n                       CASE WHEN s.premiumType='NEW' THEN 1 ELSE 0 END ORDER BY s.ordId) AS newNo,\n    ROW_NUMBER() OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId ORDER BY s.ordId) AS genNo,\n    COUNT(*)    OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId) AS genTot,\n    LAG(CASE WHEN s.isCanc=1 OR s.isTerm=1 THEN 0 ELSE s.vSiCed END,1,0) OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId ORDER BY s.ordId) AS pSiCed,\n    LAG(CASE WHEN s.isCanc=1 OR s.isTerm=1 THEN 0 ELSE s.vSiRe  END,1,0) OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId ORDER BY s.ordId) AS pSiRe,\n    LAG(CASE WHEN s.isCanc=1 OR s.isTerm=1 THEN 0 ELSE s.vPrCed END,1,0) OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId ORDER BY s.ordId) AS pPrCed,\n    LAG(CASE WHEN s.isCanc=1 OR s.isTerm=1 THEN 0 ELSE s.vPrRe  END,1,0) OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId ORDER BY s.ordId) AS pPrRe,\n    LAG(CASE WHEN s.isCanc=1 OR s.isTerm=1 THEN 0 ELSE s.vNtp   END,1,0) OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId ORDER BY s.ordId) AS pNtp,\n    LAG(CASE WHEN s.isCanc=1 OR s.isTerm=1 THEN 0 ELSE s.vCom   END,1,0) OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId ORDER BY s.ordId) AS pCom,\n    LAG(CASE WHEN s.isCanc=1 OR s.isTerm=1 THEN 0 ELSE s.vTax   END,1,0) OVER (PARTITION BY s.lifePolicyId, s.contractId, s.coverageId, s.lineId ORDER BY s.ordId) AS pTax\n  FROM steps s\n),\npmode AS (\n  SELECT c.lifePolicyId,\n    MAX(CASE WHEN (c.changeId IS NULL AND c.premiumType IN ('CHANGE','CANCELLATION','REVERT'))\n                  OR c.overwritten = 1 THEN 1 ELSE 0 END) AS restate\n  FROM Cession c INNER JOIN scope sc ON sc.lifePolicyId = c.lifePolicyId\n  GROUP BY c.lifePolicyId\n),\ndlt AS (\n  SELECT o.id, o.ordId, o.lifePolicyId, o.contractId, o.lob, o.premiumType, o.changeId,\n         o.anniversaryId, o.contactId, o.holderName, o.dstart, o.dend, pm.restate,\n         o.filaIncompleta, o.importeNulo, o.genNo, o.genTot, o.isCanc, o.isTerm,\n         o.coverageId, o.lineId, o.sumInsured, o.proportionRe, o.overwritten,\n         o.vSiRe, o.vPrRe, o.vCom, o.vTax,\n         CASE WHEN UPPER(LTRIM(RTRIM(ISNULL(o.lineId,'')))) LIKE 'FAC%' THEN 'FAC'\n              WHEN UPPER(ISNULL(o.lineId,'')) LIKE '%CUOTA PARTE%' THEN 'CP'\n              WHEN UPPER(ISNULL(o.lineId,'')) LIKE '%EXCEDENTE%' THEN 'EX'\n              ELSE 'OT' END AS bucket,\n    /* Nivel: la resta contra la generacion anterior.\n       Importe: la fila ya ES el movimiento (cancelacion). Retiro: baja a 0. */\n    CASE WHEN o.isCanc=1 THEN o.vSiCed ELSE (CASE WHEN o.isTerm=1 THEN 0 ELSE o.vSiCed END - o.pSiCed) END AS dSiCed,\n    CASE WHEN o.isCanc=1 THEN o.vSiRe  ELSE (CASE WHEN o.isTerm=1 THEN 0 ELSE o.vSiRe  END - o.pSiRe)  END AS dSiRe,\n    CASE WHEN o.isCanc=1 THEN o.vPrCed\n         WHEN pm.restate=1 OR o.isTerm=1 THEN (CASE WHEN o.isTerm=1 THEN 0 ELSE o.vPrCed END - o.pPrCed)\n         ELSE o.vPrCed END AS dPrCed,\n    CASE WHEN o.isCanc=1 THEN o.vPrRe\n         WHEN pm.restate=1 OR o.isTerm=1 THEN (CASE WHEN o.isTerm=1 THEN 0 ELSE o.vPrRe END - o.pPrRe)\n         ELSE o.vPrRe END AS dPrRe,\n    CASE WHEN o.isCanc=1 THEN o.vNtp\n         WHEN pm.restate=1 OR o.isTerm=1 THEN (CASE WHEN o.isTerm=1 THEN 0 ELSE o.vNtp END - o.pNtp)\n         ELSE o.vNtp END AS dNtp,\n    CASE WHEN o.isCanc=1 THEN o.vCom\n         WHEN pm.restate=1 OR o.isTerm=1 THEN (CASE WHEN o.isTerm=1 THEN 0 ELSE o.vCom END - o.pCom)\n         ELSE o.vCom END AS dCom,\n    CASE WHEN o.isCanc=1 THEN o.vTax\n         WHEN pm.restate=1 OR o.isTerm=1 THEN (CASE WHEN o.isTerm=1 THEN 0 ELSE o.vTax END - o.pTax)\n         ELSE o.vTax END AS dTax,\n    CASE WHEN o.changeId IS NOT NULL THEN 'CHG:'+CAST(o.changeId AS varchar(20))\n         WHEN o.anniversaryId IS NOT NULL THEN 'ANN:'+CAST(o.anniversaryId AS varchar(20))\n         WHEN o.premiumType='NEW' THEN 'EMI:'+CAST(o.newNo AS varchar(10))\n         ELSE 'OTR:'+CAST(o.id AS varchar(20)) END AS movKey\n  FROM ord o INNER JOIN pmode pm ON pm.lifePolicyId = o.lifePolicyId\n),\nmv AS (\n  SELECT d.lifePolicyId, d.movKey,\n    MIN(d.lob) AS lob, MIN(d.contractId) AS contractId, MAX(d.restate) AS restate,\n    MAX(d.changeId) AS changeId, MAX(d.anniversaryId) AS anniversaryId,\n    MIN(d.premiumType) AS premiumType, MAX(d.isCanc) AS esCancelacion, MAX(d.isTerm) AS esRetiro,\n    MIN(d.dstart) AS fDesde, MAX(d.dend) AS fHasta,\n    MIN(d.holderName) AS holderName, MIN(d.contactId) AS contactId,\n    MIN(d.ordId) AS minId, MAX(d.ordId) AS maxId, COUNT(*) AS lineas,\n    MAX(d.filaIncompleta) AS filaIncompleta, MAX(d.importeNulo) AS importeNulo,\n    SUM(d.dSiCed) AS sumaRetenida,\n    SUM(d.dSiRe)  AS sumaCedida,\n    SUM(CASE WHEN d.bucket='CP'  THEN d.dSiRe ELSE 0 END) AS sumaCuotaParte,\n    SUM(CASE WHEN d.bucket='EX'  THEN d.dSiRe ELSE 0 END) AS sumaExcedente,\n    SUM(CASE WHEN d.bucket='FAC' THEN d.dSiRe ELSE 0 END) AS sumaFacultativa,\n    SUM(d.dPrCed) AS primaRetenida,\n    SUM(d.dPrRe)  AS primaCedida,\n    SUM(d.dNtp)   AS primaCat,\n    SUM(CASE WHEN d.bucket='CP'  THEN d.dPrRe ELSE 0 END) AS primaCuotaParte,\n    SUM(CASE WHEN d.bucket='EX'  THEN d.dPrRe ELSE 0 END) AS primaExcedente,\n    SUM(CASE WHEN d.bucket='FAC' THEN d.dPrRe ELSE 0 END) AS primaFacultativa,\n    SUM(d.dCom) AS comisionContractual,\n    SUM(CASE WHEN d.bucket='CP'  THEN d.dCom ELSE 0 END) AS comisionCuotaParte,\n    SUM(CASE WHEN d.bucket='EX'  THEN d.dCom ELSE 0 END) AS comisionExcedente,\n    SUM(CASE WHEN d.bucket='FAC' THEN d.dCom ELSE 0 END) AS comisionFacultativa,\n    SUM(d.dTax) AS impuesto,\n    SUM(CASE WHEN d.bucket='CP'  THEN d.dTax ELSE 0 END) AS impuestoCuotaParte,\n    SUM(CASE WHEN d.bucket='EX'  THEN d.dTax ELSE 0 END) AS impuestoExcedente,\n    SUM(CASE WHEN d.bucket='FAC' THEN d.dTax ELSE 0 END) AS impuestoFacultativo\n  FROM dlt d GROUP BY d.lifePolicyId, d.movKey\n),\nres AS (\n  SELECT mv.*,\n    lp.code AS poliza, lp.fiscalNumber AS recibo, lp.productCode AS planProd,\n    ch.Discriminator AS chTipo,\n    ct.effectiveDate AS contratoDesde,\n    LTRIM(RTRIM(ISNULL(ci.name,'')+' '+ISNULL(ci.surname1,'')+' '+ISNULL(ci.surname2,''))) AS asegurado,\n    COALESCE(ch.executionDate, an.executionDate, lp.activeDate, lp.created) AS fechaEmision,\n    CASE WHEN COALESCE(ch.executionDate, an.executionDate, lp.activeDate, lp.created) IS NULL\n         THEN 1 ELSE 0 END AS sinFechaEmision,\n    /* CA18 — la identidad tambien cuenta: sin codigo de poliza la fila va marcada. */\n    CASE WHEN mv.filaIncompleta = 1\n              OR lp.code IS NULL OR LTRIM(RTRIM(lp.code)) = ''\n              OR lp.fiscalNumber IS NULL OR LTRIM(RTRIM(lp.fiscalNumber)) = ''\n              OR mv.contactId IS NULL\n         THEN 1 ELSE 0 END AS incompleta\n    ,\n    /* AXX-300 - poliza emitida/activa: activeDate IS NOT NULL. */\n    CASE WHEN lp.activeDate IS NULL THEN 1 ELSE 0 END AS polizaSinEmitir,\n    /* AXX-300 - endoso ejecutado: status = 1. Solo aplica a los movimientos que\n       NACEN de un endoso; una emision o un aniversario no tienen endoso que exigir. */\n    CASE WHEN mv.changeId IS NOT NULL AND ISNULL(ch.status, -1) <> 1 THEN 1 ELSE 0 END AS endosoNoEjecutado\n  FROM mv\n  INNER JOIN LifePolicy lp ON lp.id = mv.lifePolicyId\n  LEFT JOIN Change ch      ON ch.id = mv.changeId\n  LEFT JOIN Anniversary an ON an.id = mv.anniversaryId\n  LEFT JOIN Contract ct    ON ct.id = mv.contractId\n  LEFT JOIN Contact ci     ON ci.id = mv.contactId\n)";
var tPage   = "\nSELECT r.lifePolicyId AS id, r.lob, r.planProd AS [plan], r.poliza, r.recibo,\n       CASE WHEN r.esRetiro=1 THEN 'RETIRO DE CESION'\n            WHEN r.movKey LIKE 'EMI:%' THEN 'EMISION'\n            WHEN r.movKey LIKE 'ANN:%' THEN 'ANIVERSARIO'\n            WHEN r.esCancelacion=1 OR r.premiumType='CANCELLATION' THEN 'CANCELACION'\n            ELSE ISNULL(r.chTipo,'ENDOSO') END AS tipo,\n       r.holderName AS contratante, r.asegurado,\n       r.fechaEmision, r.fDesde, r.fHasta,\n       (r.sumaRetenida + r.sumaCedida) AS sumaAsegurada100,\n       r.sumaRetenida, r.sumaCedida, r.sumaCuotaParte, r.sumaExcedente, r.sumaFacultativa,\n       (r.primaRetenida + r.primaCedida + r.primaCat) AS primaSuscrita100,\n       r.primaRetenida, r.primaCedida, r.primaCuotaParte, r.primaExcedente,\n       r.primaCat, r.primaFacultativa,\n       r.comisionContractual, r.comisionCuotaParte, r.comisionExcedente, r.comisionFacultativa,\n       r.impuesto, r.impuestoFacultativo,\n       (r.primaCuotaParte - r.comisionCuotaParte - r.impuestoCuotaParte) AS reaseguroCuotaParte,\n       (r.primaExcedente  - r.comisionExcedente  - r.impuestoExcedente)  AS reaseguroExcedente,\n       (r.primaCedida + r.primaFacultativa - r.comisionContractual - r.comisionFacultativa\n        - r.impuesto - r.impuestoFacultativo) AS reaseguroPorPagar,\n       CASE WHEN r.contratoDesde IS NULL THEN '' ELSE FORMAT(r.contratoDesde,'yyyyMM') END AS cserie,\n       r.movKey, r.changeId, r.anniversaryId, r.contractId, r.restate,\n       r.impuestoCuotaParte, r.impuestoExcedente, r.lineas, r.minId,\n       r.sinFechaEmision, r.incompleta AS filaIncompleta, r.importeNulo,\n       r.esRetiro, r.esCancelacion\nFROM res r\nWHERE CAST(r.fechaEmision AS date) BETWEEN '@@FROM@@' AND '@@TO@@'@@LOBPRED@@@@VIGPRED@@\nORDER BY r.poliza, r.fechaEmision, r.minId\nOFFSET @@SKIP@@ ROWS FETCH NEXT @@TAKE@@ ROWS ONLY";
var tCount  = "\n/* AXX-300 - el conteo se hace sobre la poblacion del periodo SIN excluir, y separa\n   con SUM condicionales lo que entra de lo que queda fuera. Asi el total de la grilla\n   y la evidencia de la exclusion salen de una sola consulta, sin sumar un round trip. */\nSELECT ISNULL(SUM(CASE WHEN r.polizaSinEmitir=0 AND r.endosoNoEjecutado=0 THEN 1 ELSE 0 END),0) AS total,\n       COUNT(DISTINCT CASE WHEN r.polizaSinEmitir=0 AND r.endosoNoEjecutado=0 THEN r.lifePolicyId END) AS polizas,\n       ISNULL(SUM(CASE WHEN r.polizaSinEmitir=0 AND r.endosoNoEjecutado=0 AND r.sinFechaEmision=1 THEN 1 ELSE 0 END),0) AS sinFecha,\n       ISNULL(SUM(CASE WHEN r.polizaSinEmitir=0 AND r.endosoNoEjecutado=0 AND r.incompleta=1 THEN 1 ELSE 0 END),0) AS incompletas,\n       ISNULL(SUM(CASE WHEN r.polizaSinEmitir=0 AND r.endosoNoEjecutado=0 AND r.importeNulo=1 THEN 1 ELSE 0 END),0) AS conNulos,\n       ISNULL(SUM(CASE WHEN r.polizaSinEmitir=1 THEN 1 ELSE 0 END),0) AS excPolizaSinEmitir,\n       ISNULL(SUM(CASE WHEN r.endosoNoEjecutado=1 THEN 1 ELSE 0 END),0) AS excEndosoNoEjecutado,\n       ISNULL(SUM(CASE WHEN r.polizaSinEmitir=1 OR r.endosoNoEjecutado=1 THEN 1 ELSE 0 END),0) AS excluidos,\n       COUNT(*) AS totalSinFiltrar\nFROM res r\nWHERE CAST(r.fechaEmision AS date) BETWEEN '@@FROM@@' AND '@@TO@@'@@LOBPRED@@";
var tRecon  = "\n, ded AS (\n  SELECT d.lifePolicyId,\n         SUM(d.dSiRe) AS deltaSumaCedida,\n         SUM(d.dPrRe) AS deltaPrimaCedida,\n         SUM(d.dCom)  AS deltaComision,\n         SUM(d.dTax)  AS deltaImpuesto,\n         MAX(d.restate) AS restate,\n         COUNT(DISTINCT d.movKey) AS movimientos\n  FROM dlt d GROUP BY d.lifePolicyId\n),\n/* Estado reconstruido: ultima generacion viva por particion (0 si fue retirada\n   o cancelada). No usa la resta de deltas. */\nlastgen AS (\n  SELECT o.lifePolicyId, o.contractId, o.coverageId, o.lineId,\n         MAX(o.genNo) AS ultimaGen\n  FROM ord o GROUP BY o.lifePolicyId, o.contractId, o.coverageId, o.lineId\n),\nestado AS (\n  SELECT o.lifePolicyId,\n         SUM(CASE WHEN o.isTerm=1 OR o.isCanc=1 THEN 0 ELSE o.vSiRe END) AS estSuma,\n         SUM(CASE WHEN o.isTerm=1 OR o.isCanc=1 THEN 0\n                  ELSE ISNULL(o.sumInsured,0) * ISNULL(o.proportionRe,0) END) AS estSumaPorProporcion,\n         SUM(CASE WHEN o.isTerm=1 OR o.isCanc=1 THEN 0 ELSE o.vTax END) AS estImpuesto\n  FROM dlt o INNER JOIN lastgen g\n    ON g.lifePolicyId=o.lifePolicyId AND g.contractId=o.contractId\n   AND g.coverageId=o.coverageId AND g.lineId=o.lineId AND g.ultimaGen=o.genNo\n  GROUP BY o.lifePolicyId\n),\n/* Conjunto vigente segun la plataforma. Solo aplicable donde la marca se usa. */\nvigente AS (\n  SELECT c.lifePolicyId,\n         SUM(CASE WHEN c.overwritten=0 THEN ISNULL(c.sumInsuredRe,0) ELSE 0 END) AS sumaVigente,\n         SUM(CASE WHEN c.overwritten=0 THEN ISNULL(c.premiumRe,0) ELSE 0 END) AS primaVigente,\n         SUM(CASE WHEN c.overwritten=1 THEN 1 ELSE 0 END) AS nOvw\n  FROM Cession c INNER JOIN scope sc ON sc.lifePolicyId=c.lifePolicyId\n  GROUP BY c.lifePolicyId\n)\nSELECT e.lifePolicyId, e.restate, e.movimientos,\n       e.deltaSumaCedida, es.estSuma AS estadoSumaCedida,\n       (e.deltaSumaCedida - es.estSuma) AS difTelescopica,\n       es.estSumaPorProporcion,\n       (es.estSuma - es.estSumaPorProporcion) AS difProporcion,\n       v.sumaVigente, v.nOvw,\n       (es.estSuma - v.sumaVigente) AS difVigente,\n       CASE WHEN es.estSuma < -0.005 THEN 1 ELSE 0 END AS estadoNegativo,\n       CASE WHEN ABS(es.estSuma - es.estSumaPorProporcion) > (0.05 + 0.0002 * ABS(es.estSuma)) THEN 1 ELSE 0 END AS fallaProporcion,\n       v.primaVigente, (e.deltaPrimaCedida - v.primaVigente) AS difPrimaVigente,\n       CASE WHEN v.nOvw > 0 AND ABS(es.estSuma - v.sumaVigente) > 0.05 THEN 1 ELSE 0 END AS fallaVigente,\n       CASE WHEN v.nOvw > 0 AND ABS(e.deltaPrimaCedida - v.primaVigente) > 0.05 THEN 1 ELSE 0 END AS fallaPrimaVigente,\n       CASE WHEN ABS(e.deltaSumaCedida - es.estSuma) > 0.05 THEN 1 ELSE 0 END AS fallaTelescopica,\n       CASE WHEN v.nOvw = 0 THEN 1 ELSE 0 END AS controlVigenteNoAplicable,\n       CASE WHEN es.estSuma < -0.005\n              OR ABS(es.estSuma - es.estSumaPorProporcion) > (0.05 + 0.0002 * ABS(es.estSuma))\n              OR (v.nOvw > 0 AND ABS(es.estSuma - v.sumaVigente) > 0.05)\n              OR (v.nOvw > 0 AND ABS(e.deltaPrimaCedida - v.primaVigente) > 0.05)\n              OR ABS(e.deltaSumaCedida - es.estSuma) > 0.05\n            THEN 0 ELSE 1 END AS concilia\nFROM ded e\nINNER JOIN estado es ON es.lifePolicyId = e.lifePolicyId\nINNER JOIN vigente v ON v.lifePolicyId = e.lifePolicyId\nORDER BY CASE WHEN es.estSuma < -0.005\n              OR ABS(es.estSuma - es.estSumaPorProporcion) > (0.05 + 0.0002 * ABS(es.estSuma))\n              OR (v.nOvw > 0 AND ABS(es.estSuma - v.sumaVigente) > 0.05)\n              OR (v.nOvw > 0 AND ABS(e.deltaPrimaCedida - v.primaVigente) > 0.05)\n              OR ABS(e.deltaSumaCedida - es.estSuma) > 0.05\n            THEN 0 ELSE 1 END, e.lifePolicyId";
var tRecSum = "\n, ded AS (\n  SELECT d.lifePolicyId, SUM(d.dSiRe) AS deltaSumaCedida,\n         SUM(d.dPrRe) AS deltaPrimaCedida, MAX(d.restate) AS restate\n  FROM dlt d GROUP BY d.lifePolicyId\n),\nlastgen AS (\n  SELECT o.lifePolicyId, o.contractId, o.coverageId, o.lineId, MAX(o.genNo) AS ultimaGen\n  FROM ord o GROUP BY o.lifePolicyId, o.contractId, o.coverageId, o.lineId\n),\nestado AS (\n  SELECT o.lifePolicyId,\n         SUM(CASE WHEN o.isTerm=1 OR o.isCanc=1 THEN 0 ELSE o.vSiRe END) AS estSuma,\n         SUM(CASE WHEN o.isTerm=1 OR o.isCanc=1 THEN 0\n                  ELSE ISNULL(o.sumInsured,0) * ISNULL(o.proportionRe,0) END) AS estSumaPorProporcion\n  FROM dlt o INNER JOIN lastgen g\n    ON g.lifePolicyId=o.lifePolicyId AND g.contractId=o.contractId\n   AND g.coverageId=o.coverageId AND g.lineId=o.lineId AND g.ultimaGen=o.genNo\n  GROUP BY o.lifePolicyId\n),\nvigente AS (\n  SELECT c.lifePolicyId,\n         SUM(CASE WHEN c.overwritten=0 THEN ISNULL(c.sumInsuredRe,0) ELSE 0 END) AS sumaVigente,\n         SUM(CASE WHEN c.overwritten=0 THEN ISNULL(c.premiumRe,0) ELSE 0 END) AS primaVigente,\n         SUM(CASE WHEN c.overwritten=1 THEN 1 ELSE 0 END) AS nOvw\n  FROM Cession c INNER JOIN scope sc ON sc.lifePolicyId=c.lifePolicyId\n  GROUP BY c.lifePolicyId\n)\nSELECT COUNT(*) AS polizas,\n       SUM(CASE WHEN es.estSuma < -0.005 THEN 1 ELSE 0 END) AS estadoNegativo,\n       SUM(CASE WHEN ABS(es.estSuma - es.estSumaPorProporcion) > (0.05 + 0.0002 * ABS(es.estSuma)) THEN 1 ELSE 0 END) AS fallaProporcion,\n       SUM(CASE WHEN v.nOvw > 0 AND ABS(es.estSuma - v.sumaVigente) > 0.05 THEN 1 ELSE 0 END) AS fallaVigente,\n       SUM(CASE WHEN v.nOvw > 0 AND ABS(e.deltaPrimaCedida - v.primaVigente) > 0.05 THEN 1 ELSE 0 END) AS fallaPrimaVigente,\n       SUM(CASE WHEN ABS(e.deltaSumaCedida - es.estSuma) > 0.05 THEN 1 ELSE 0 END) AS fallaTelescopica,\n       SUM(CASE WHEN v.nOvw = 0 THEN 1 ELSE 0 END) AS sinControlVigente,\n       SUM(CASE WHEN es.estSuma < -0.005\n                  OR ABS(es.estSuma - es.estSumaPorProporcion) > (0.05 + 0.0002 * ABS(es.estSuma))\n                  OR (v.nOvw > 0 AND ABS(es.estSuma - v.sumaVigente) > 0.05)\n                  OR (v.nOvw > 0 AND ABS(e.deltaPrimaCedida - v.primaVigente) > 0.05)\n                  OR ABS(e.deltaSumaCedida - es.estSuma) > 0.05\n                THEN 1 ELSE 0 END) AS descuadres\nFROM ded e\nINNER JOIN estado es ON es.lifePolicyId = e.lifePolicyId\nINNER JOIN vigente v ON v.lifePolicyId = e.lifePolicyId";

/* La compensación permanece intacta. Solo se separa la marca usada para el
   título: un grupo con una línea positiva no se presenta visualmente como
   CANCELACION, aunque sus importes sigan calculándose igual. */
base = base.replace(
  "MIN(d.premiumType) AS premiumType, MAX(d.isCanc) AS esCancelacion, MAX(d.isTerm) AS esRetiro,",
  "MIN(d.premiumType) AS premiumType, MAX(d.isCanc) AS esCancelacion,\n" +
  "    CASE WHEN MAX(CASE WHEN d.vSiRe > 0 OR d.vPrRe > 0 THEN 1 ELSE 0 END) = 1\n" +
  "         THEN 0 ELSE MAX(d.isCanc) END AS esCancelacionVisual, MAX(d.isTerm) AS esRetiro,"
);
base = base.replace(
  "ch.Discriminator AS chTipo,",
  "CASE WHEN ch.Discriminator = 'CoverageChange' AND ISJSON(ch.jAdditional) = 1 AND JSON_VALUE(ch.jAdditional, '$.endorsementType') = 'PROCEEDORDER' THEN 'ProceedOrder' WHEN ch.Discriminator = 'CoverageChange' AND ISJSON(ch.jAdditional) = 1 AND JSON_VALUE(ch.jAdditional, '$.endorsementType') = 'CHANGE_COVERAGE_SURETY' THEN 'ChangeCoverageSurety' ELSE ch.Discriminator END AS chTipo,"
);
tPage = tPage.replace(
  "r.esCancelacion=1 OR r.premiumType='CANCELLATION'",
  "r.esCancelacionVisual=1"
);

function normCfg(v) { return String(v === null || v === undefined ? '' : v).trim().toUpperCase(); }
function sqlCfg(v) { return String(v === null || v === undefined ? '' : v).split("'").join("''"); }
var cfgCoberturaReaseguro = [
  { lob: 96, name: 'cfgCoberturaProductoReaTecnicos' },
  { lob: 20, name: 'cfgCoberturaProductoReaVidaColectivo' },
  { lob: 31, name: 'cfgCoberturaProductoReaVida' },
  { lob: 52, name: 'cfgCoberturaProductoReaRiesgosVarios' },
  { lob: 1, name: 'cfgCoberturaProductoRea' },
  { lob: 6, name: 'cfgCoberturaProductoReaAuto' },
  { lob: 81, name: 'cfgCoberturaProductoReaFianza' },
  { lob: 82, name: 'cfgCoberturaProductoReaFianza' },
  { lob: 83, name: 'cfgCoberturaProductoReaFianza' },
  { lob: 84, name: 'cfgCoberturaProductoReaFianza' }
];
var cfgNames = [];
for (var ni = 0; ni < cfgCoberturaReaseguro.length; ni++) {
  if (cfgNames.indexOf(cfgCoberturaReaseguro[ni].name) < 0) cfgNames.push(cfgCoberturaReaseguro[ni].name);
}
var cfgSqlNames = cfgNames.map(function (name) { return "'" + sqlCfg(name) + "'"; }).join(',');
doCmd({
  cmd: 'DoQuery',
  data: {
    sql: 'SELECT [name] AS configName, [data] AS configData FROM [Table] WHERE [name] IN (' + cfgSqlNames + ')',
    timeout: 300
  }
});
if (!DoQuery || !DoQuery.ok) {
  throw 'No fue posible leer la configuración de coberturas de reaseguro: ' + (DoQuery && DoQuery.msg ? DoQuery.msg : 'sin detalle');
}
var configByName = {};
var configRecords = DoQuery.outData || [];
for (var cr = 0; cr < configRecords.length; cr++) {
  var configRecord = configRecords[cr] || {};
  var configName = configRecord.configName || configRecord.ConfigName || configRecord.name || configRecord.Name;
  var configData = configRecord.configData || configRecord.ConfigData || configRecord.data || configRecord.Data;
  if (configName) configByName[String(configName)] = configData;
}
var coveragesThatSum = {};
for (var ci = 0; ci < cfgCoberturaReaseguro.length; ci++) {
  var cfgMap = cfgCoberturaReaseguro[ci];
  if (!Object.prototype.hasOwnProperty.call(configByName, cfgMap.name)) {
    throw 'No se encontró la configuración ' + cfgMap.name + ' en [Table].';
  }
  var cfgRows = configByName[cfgMap.name] || [];
  if (typeof cfgRows === 'string') {
    try { cfgRows = JSON.parse(cfgRows); } catch (e) { throw 'La configuración ' + cfgMap.name + ' no contiene JSON válido.'; }
  }
  if (!Array.isArray(cfgRows) || cfgRows.length < 1) {
    throw 'La configuración ' + cfgMap.name + ' no tiene el formato de tabla esperado.';
  }
  var cfgHeaders = cfgRows[0] || [];
  function cfgIndex(name, fallback) {
    for (var h = 0; h < cfgHeaders.length; h++) {
      if (normCfg(cfgHeaders[h]) === normCfg(name)) return h;
    }
    return fallback;
  }
  var ixLob = cfgIndex('lobCode', 0), ixProduct = cfgIndex('productCode', 1);
  var ixCoverage = cfgIndex('coverageCode', 3), ixIncluded = cfgIndex('isCoverage', 5);
  for (var ri = 1; ri < cfgRows.length; ri++) {
    var cfgRow = cfgRows[ri] || [];
    if (normCfg(cfgRow[ixLob]) !== normCfg(cfgMap.lob) || normCfg(cfgRow[ixIncluded]) !== 'SI') continue;
    var cfgKey = [normCfg(cfgMap.lob), normCfg(cfgRow[ixProduct]), normCfg(cfgRow[ixCoverage])].join('|');
    if (cfgKey !== '||') coveragesThatSum[cfgKey] = true;
  }
}
var coverageGroups = {};
for (var coverageKey in coveragesThatSum) {
  if (!Object.prototype.hasOwnProperty.call(coveragesThatSum, coverageKey)) continue;
  var coverageParts = coverageKey.split('|');
  var groupKey = coverageParts[0] + '|' + coverageParts[1];
  if (!coverageGroups[groupKey]) coverageGroups[groupKey] = { lob: coverageParts[0], product: coverageParts[1], coverages: [] };
  coverageGroups[groupKey].coverages.push(coverageParts[2]);
}
var sumCoverageParts = [];
for (var groupKey in coverageGroups) {
  if (!Object.prototype.hasOwnProperty.call(coverageGroups, groupKey)) continue;
  var group = coverageGroups[groupKey];
  var coverageCodes = group.coverages.map(function (code) { return "'" + sqlCfg(code) + "'"; });
  sumCoverageParts.push("(UPPER(LTRIM(RTRIM(ISNULL(c.LoB,''))))='" + sqlCfg(group.lob) + "'"
    + " AND UPPER(LTRIM(RTRIM(ISNULL(lp.productCode,''))))='" + sqlCfg(group.product) + "'"
    + " AND UPPER(LTRIM(RTRIM(ISNULL(c.coverageCode,'')))) IN (" + coverageCodes.join(',') + '))');
}
var sumCoveragePredicate = sumCoverageParts.length ? '(' + sumCoverageParts.join(' OR ') + ')' : '1=0';
base = base.replace(
  'FROM Cession c\n  INNER JOIN scope sc ON sc.lifePolicyId = c.lifePolicyId\n),\n/* Cambios EJECUTADOS',
  'FROM Cession c\n  INNER JOIN scope sc ON sc.lifePolicyId = c.lifePolicyId\n  INNER JOIN LifePolicy lp ON lp.id = c.lifePolicyId\n),\n/* Cambios EJECUTADOS'
);
base = base.replace(
  'c.sumInsured, c.proportionRe,',
  'c.sumInsured, c.proportionRe, CASE WHEN @@SUMACOB@@ THEN 1 ELSE 0 END AS sumaIncluida,'
);
base = base.replace('r.dstart, r.dend, r.isCanc, 0 AS isTerm,', 'r.dstart, r.dend, r.sumaIncluida, r.isCanc, 0 AS isTerm,');
base = base.replace('MAX(rr.dstart), MAX(rr.dend), 0 AS isCanc, 1 AS isTerm,', 'MAX(rr.dstart), MAX(rr.dend), MAX(rr.sumaIncluida), 0 AS isCanc, 1 AS isTerm,');
base = base.replace('o.anniversaryId, o.contactId, o.holderName,', 'o.anniversaryId, o.sumaIncluida, o.contactId, o.holderName,');
base = base.replace('SUM(d.dSiCed) AS sumaRetenida', 'SUM(CASE WHEN d.sumaIncluida=1 THEN d.dSiCed ELSE 0 END) AS sumaRetenida');
base = base.replace('SUM(d.dSiRe)  AS sumaCedida', 'SUM(CASE WHEN d.sumaIncluida=1 THEN d.dSiRe ELSE 0 END) AS sumaCedida');
base = base.replace("SUM(CASE WHEN d.bucket='CP'  THEN d.dSiRe ELSE 0 END) AS sumaCuotaParte", "SUM(CASE WHEN d.sumaIncluida=1 AND d.bucket='CP' THEN d.dSiRe ELSE 0 END) AS sumaCuotaParte");
base = base.replace("SUM(CASE WHEN d.bucket='EX'  THEN d.dSiRe ELSE 0 END) AS sumaExcedente", "SUM(CASE WHEN d.sumaIncluida=1 AND d.bucket='EX' THEN d.dSiRe ELSE 0 END) AS sumaExcedente");
base = base.replace("SUM(CASE WHEN d.bucket='FAC' THEN d.dSiRe ELSE 0 END) AS sumaFacultativa", "SUM(CASE WHEN d.sumaIncluida=1 AND d.bucket='FAC' THEN d.dSiRe ELSE 0 END) AS sumaFacultativa");

var win = "'" + fdesde + "' AND '" + fhasta + "'";
var scope = lobPred + " AND " + polizaPred + " AND ("
  + "(c.changeId IS NOT NULL AND EXISTS (SELECT 1 FROM Change ch WHERE ch.id = c.changeId AND CAST(ch.executionDate AS date) BETWEEN " + win + "))"
  + " OR (c.anniversaryId IS NOT NULL AND EXISTS (SELECT 1 FROM Anniversary an WHERE an.id = c.anniversaryId AND CAST(an.executionDate AS date) BETWEEN " + win + "))"
  + " OR (c.premiumType = 'NEW' AND EXISTS (SELECT 1 FROM LifePolicy lp WHERE lp.id = c.lifePolicyId AND CAST(ISNULL(lp.activeDate, lp.created) AS date) BETWEEN " + win + "))"
  + ")";

function arma(tpl, scopePred, skip, take) {
  var s = base + tpl;
  s = s.split('@@SUMACOB@@').join(sumCoveragePredicate);
  s = s.split('@@SCOPE@@').join(scopePred);
  s = s.split('@@FROM@@').join(fdesde);
  s = s.split('@@TO@@').join(fhasta);
  s = s.split('@@LOBPRED@@').join(tieneRamo ? ' AND r.lob IN (' + lobIn + ')' : '');
  /* AXX-300 alcance 2 - se suma a los filtros existentes, no los reemplaza. */
  s = s.split('@@VIGPRED@@').join(' AND r.polizaSinEmitir = 0 AND r.endosoNoEjecutado = 0');
  s = s.split('@@SKIP@@').join(String(skip));
  s = s.split('@@TAKE@@').join(String(take));
  return s;
}

doCmd({ cmd: 'DoQuery', data: { sql: arma(tCount, scope, 0, 0), timeout: 300 } });
if (!DoQuery.ok) { throw 'Error al contar movimientos: ' + DoQuery.msg; }
var cab = DoQuery.outData && DoQuery.outData.length > 0 ? DoQuery.outData[0] : null;
var total = cab ? cab.total : 0;
var polizas = cab ? cab.polizas : 0;
var sinFecha = cab ? cab.sinFecha : 0;
var incompletas = cab ? cab.incompletas : 0;
var conNulos = cab ? cab.conNulos : 0;
var excSinEmitir = cab ? cab.excPolizaSinEmitir : 0;
var excNoEjecutado = cab ? cab.excEndosoNoEjecutado : 0;
var excluidos = cab ? cab.excluidos : 0;
var totalSinFiltrar = cab ? cab.totalSinFiltrar : 0;

if (exportar) { page = 1; size = (total > 0 ? total : 1); if (size > 50000) { size = 50000; } }
var skip = (page - 1) * size;
doCmd({ cmd: 'DoQuery', data: { sql: arma(tPage, scope, skip, size), timeout: 300 } });
if (!DoQuery.ok) { throw 'Error al obtener movimientos: ' + DoQuery.msg; }
var filas = DoQuery.outData || [];

/* Conciliacion (CA17). Se corre sobre las mismas polizas del periodo, no sobre la pagina,
   para que el resultado no dependa de por donde se este paginando. El estado se calcula
   por una via independiente de la resta de deltas: la ultima generacion por particion. */
doCmd({ cmd: 'DoQuery', data: { sql: arma(tRecSum, scope, 0, 0), timeout: 300 } });
if (!DoQuery.ok) { throw 'Error al conciliar: ' + DoQuery.msg; }
var resu = DoQuery.outData && DoQuery.outData.length > 0 ? DoQuery.outData[0] : null;
var descuadres = resu ? resu.descuadres : 0;
var ctrlNegativo = resu ? resu.estadoNegativo : 0;
var ctrlProporcion = resu ? resu.fallaProporcion : 0;
var ctrlVigente = resu ? resu.fallaVigente : 0;
var ctrlPrimaVigente = resu ? resu.fallaPrimaVigente : 0;
var ctrlTelescopico = resu ? resu.fallaTelescopica : 0;
var ctrlNoAplicable = resu ? resu.sinControlVigente : 0;

doCmd({ cmd: 'DoQuery', data: { sql: arma(tRecon, scope, 0, 0), timeout: 300 } });
if (!DoQuery.ok) { throw 'Error al conciliar (detalle): ' + DoQuery.msg; }
var conciliacion = DoQuery.outData || [];

return {
  filas: filas,
  total: total,
  polizas: polizas,
  page: page,
  size: size,
  exportacion: exportar,
  paginas: (size > 0 ? Math.ceil(total / size) : 0),
  conciliacion: conciliacion,
  descuadres: descuadres,
  controles: {
    estadoNegativo: ctrlNegativo,
    identidadDeProporcion: ctrlProporcion,
    conjuntoVigente: ctrlVigente,
    primaVigente: ctrlPrimaVigente,
    telescopico: ctrlTelescopico,
    sinControlDeVigencia: ctrlNoAplicable
  },
  trazabilidad: {
    movimientosSinFechaEmision: sinFecha,
    movimientosConFilaIncompleta: incompletas,
    movimientosConImporteNulo: conNulos,
    /* AXX-300 - la exclusion es observable: lo que quedo fuera y por que. */
    movimientosEnElPeriodo: totalSinFiltrar,
    excluidosPorPolizaSinEmitir: excSinEmitir,
    excluidosPorEndosoNoEjecutado: excNoEjecutado,
    excluidosEnTotal: excluidos
  },
  criterio: {
    fdesde: fdesde, fhasta: fhasta, ramos: ramos, poliza: poliza, exportacion: exportar,
    origenEstado: 'reconstruccion sobre el ledger de cesiones (LAG por poliza+contrato+cobertura+linea, ordenado por id). Las filas de reverso son asiento tecnico y no se listan, salvo cuando dejan la particion sin cesion vigente: ese retiro SI se emite como movimiento. Las filas de cancelacion y las de importe negativo se toman tal cual, sin restarles la generacion anterior.',
    redondeo: 'precision completa en el calculo; el redondeo a 2 decimales es de presentacion',
    vigencia: 'AXX-300: solo movimientos de polizas emitidas (activeDate IS NOT NULL) y, cuando el movimiento nace de un endoso, solo si ese endoso esta ejecutado (Change.status = 1). Se aplica en servidor sobre la consulta de pagina y la de conteo, sumandose a los filtros de periodo y ramo, sin reemplazarlos. Emisiones y aniversarios no tienen endoso asociado y quedan gobernados solo por la condicion de poliza emitida. Las consultas de conciliacion corren sobre la poblacion completa y no cambian.'
  }
};
