//block
//noreplace
/*
 * Name: cmdBorderoMovimientosReaseguradores
 * Borderó de movimientos de reaseguro por aceptante. Mantiene el período y la
 * lógica de diferencias del borderó principal, pero la partición incluye el
 * reasegurador y corredor de CessionPart.
 * context: { fdesde:'YYYY-MM-DD', fhasta:'YYYY-MM-DD', ramos:['1'], poliza:'', page:1, size:50 }
 */
var ctx = context || {};
var fdesde = ctx.fdesde ? String(ctx.fdesde).substring(0, 10) : '';
var fhasta = ctx.fhasta ? String(ctx.fhasta).substring(0, 10) : '';
var ramos = Array.isArray(ctx.ramos) ? ctx.ramos : [];
var poliza = ctx.poliza ? String(ctx.poliza).trim() : '';
var page = parseInt(ctx.page, 10); if (!(page > 0)) page = 1;
var size = parseInt(ctx.size, 10); if (!(size > 0)) size = 50;
if (size > 500) size = 500;
var exportar = ctx.exportar === true || String(ctx.exportar) === 'true';

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}
if (!validDate(fdesde) || !validDate(fhasta) || fdesde > fhasta) throw 'El período es inválido.';
if (!ramos.length && !poliza) throw 'Debe seleccionar al menos un Ramo o indicar una Póliza.';
function quote(value) { return String(value === null || value === undefined ? '' : value).split("'").join("''"); }
var lobIn = ramos.map(function (value) { return "'" + quote(value) + "'"; }).join(',');
var lobFilter = ramos.length ? ' AND c.LoB IN (' + lobIn + ')' : '';
var policyFilter = poliza ? " AND lp.code LIKE '%" + quote(poliza) + "%'" : '';
var fromTo = "'" + quote(fdesde) + "' AND '" + quote(fhasta) + "'";

/* El orden se conserva por la generación de cesión. Al particionar por aceptante
   se obtiene la diferencia real de cada reasegurador, no un saldo repetido. */
var sql = "\nWITH src AS (\n"
  + " SELECT c.id AS cessionId, c.lifePolicyId, c.contractId, c.coverageId, c.lineId, c.LoB,\n"
  + "        c.changeId, c.anniversaryId, c.premiumType, c.[start] AS cessionStart, c.[end] AS cessionEnd,\n"
  + "        c.contactId AS insuredId, c.holderName, c.coSumInsured, c.coPremium,\n"
  + "        p.id AS partId, p.contactId AS reinsurerId, p.brokerId, p.name AS participantName, p.split,\n"
  + "        ISNULL(p.sumInsured, 0) AS sumInsured, ISNULL(p.premium, 0) AS premium,\n"
  + "        ISNULL(p.commission, 0) AS commission, ISNULL(p.tax, 0) AS tax\n"
  + " FROM Cession c\n"
  + " INNER JOIN CessionPart p ON p.cessionId = c.id\n"
  + " INNER JOIN LifePolicy lp ON lp.id = c.lifePolicyId\n"
  + " WHERE lp.activeDate IS NOT NULL" + lobFilter + policyFilter + "\n"
  + "   AND ((c.changeId IS NOT NULL AND EXISTS (SELECT 1 FROM Change ch0 WHERE ch0.id=c.changeId AND ch0.status=1 AND CAST(ch0.executionDate AS date) BETWEEN " + fromTo + "))\n"
  + "     OR (c.anniversaryId IS NOT NULL AND EXISTS (SELECT 1 FROM Anniversary an0 WHERE an0.id=c.anniversaryId AND CAST(an0.executionDate AS date) BETWEEN " + fromTo + "))\n"
  + "     OR (c.premiumType='NEW' AND CAST(ISNULL(lp.activeDate, lp.created) AS date) BETWEEN " + fromTo + "))\n"
  + "), ord AS (\n"
  + " SELECT s.*,\n"
  + "   LAG(s.sumInsured,1,0) OVER (PARTITION BY s.lifePolicyId,s.contractId,s.coverageId,s.lineId,s.reinsurerId,ISNULL(s.brokerId,0) ORDER BY s.cessionId,s.partId) AS prevSum,\n"
  + "   LAG(s.premium,1,0) OVER (PARTITION BY s.lifePolicyId,s.contractId,s.coverageId,s.lineId,s.reinsurerId,ISNULL(s.brokerId,0) ORDER BY s.cessionId,s.partId) AS prevPremium,\n"
  + "   LAG(s.commission,1,0) OVER (PARTITION BY s.lifePolicyId,s.contractId,s.coverageId,s.lineId,s.reinsurerId,ISNULL(s.brokerId,0) ORDER BY s.cessionId,s.partId) AS prevCommission,\n"
  + "   LAG(s.tax,1,0) OVER (PARTITION BY s.lifePolicyId,s.contractId,s.coverageId,s.lineId,s.reinsurerId,ISNULL(s.brokerId,0) ORDER BY s.cessionId,s.partId) AS prevTax,\n"
  + "   LAG(ISNULL(s.coSumInsured,0),1,0) OVER (PARTITION BY s.lifePolicyId,s.contractId,s.coverageId,s.lineId,s.reinsurerId,ISNULL(s.brokerId,0) ORDER BY s.cessionId,s.partId) AS prevCoSum,\n"
  + "   LAG(ISNULL(s.coPremium,0),1,0) OVER (PARTITION BY s.lifePolicyId,s.contractId,s.coverageId,s.lineId,s.reinsurerId,ISNULL(s.brokerId,0) ORDER BY s.cessionId,s.partId) AS prevCoPremium\n"
  + " FROM src s\n"
  + "), delta AS (\n"
  + " SELECT o.*,\n"
  + "   CASE WHEN o.premiumType='CANCELLATION' THEN o.sumInsured ELSE o.sumInsured-o.prevSum END AS dSum,\n"
  + "   CASE WHEN o.premiumType='CANCELLATION' THEN o.premium ELSE o.premium-o.prevPremium END AS dPremium,\n"
  + "   CASE WHEN o.premiumType='CANCELLATION' THEN o.commission ELSE o.commission-o.prevCommission END AS dCommission,\n"
  + "   CASE WHEN o.premiumType='CANCELLATION' THEN o.tax ELSE o.tax-o.prevTax END AS dTax,\n"
  + "   (ISNULL(o.coSumInsured,0)-o.prevCoSum) * ISNULL(o.split,0)/100.0 AS dCoSum,\n"
  + "   (ISNULL(o.coPremium,0)-o.prevCoPremium) * ISNULL(o.split,0)/100.0 AS dCoPremium\n"
  + " FROM ord o\n"
  + "), grouped AS (\n"
  + " SELECT d.lifePolicyId,d.contractId,d.changeId,d.anniversaryId,d.LoB,d.reinsurerId,d.brokerId,\n"
  + "   MIN(d.cessionId) AS minId, MIN(d.holderName) AS holderName, MIN(d.insuredId) AS insuredId, MIN(d.participantName) AS participantName,\n"
  + "   MIN(d.cessionStart) AS cessionStart, MAX(d.cessionEnd) AS cessionEnd, MIN(d.premiumType) AS premiumType,\n"
  + "   MAX(CASE WHEN d.dSum>0 OR d.dPremium>0 THEN 1 ELSE 0 END) AS hasPositive,\n"
  + "   SUM(d.dSum) AS sumaCedida, SUM(d.dCoSum) AS sumaCoaseguro, SUM(d.dPremium) AS primaCedida,\n"
  + "   SUM(d.dCoPremium) AS primaCoaseguro, SUM(d.dCommission) AS comision, SUM(d.dTax) AS impuesto\n"
  + " FROM delta d\n"
  + " GROUP BY d.lifePolicyId,d.contractId,d.changeId,d.anniversaryId,d.LoB,d.reinsurerId,d.brokerId\n"
  + " HAVING SUM(d.dSum)<>0 OR SUM(d.dPremium)<>0 OR SUM(d.dCommission)<>0 OR SUM(d.dTax)<>0 OR SUM(d.dCoSum)<>0 OR SUM(d.dCoPremium)<>0\n"
  + "), result AS (\n"
  + " SELECT ROW_NUMBER() OVER (ORDER BY lp.code, COALESCE(ch.executionDate,an.executionDate,lp.activeDate,lp.created), g.minId) AS id,\n"
  + "   COALESCE(NULLIF(rr.name,''),NULLIF(rr.surname2,''),NULLIF(g.participantName,''),CASE WHEN g.reinsurerId IS NULL THEN '-' ELSE CONCAT('#',g.reinsurerId) END) AS reasegurador,\n"
  + "   COALESCE(NULLIF(br.name,''),NULLIF(br.surname2,''),CASE WHEN g.brokerId IS NULL THEN '-' ELSE CONCAT('#',g.brokerId) END) AS corredor, g.LoB AS ramo, lp.productCode AS producto, lp.code AS poliza,\n"
  + "   CASE WHEN g.changeId IS NULL AND g.anniversaryId IS NULL THEN 'EMISION'\n"
  + "        WHEN g.anniversaryId IS NOT NULL THEN 'ANIVERSARIO'\n"
  + "        WHEN g.premiumType='CANCELLATION' AND g.hasPositive=0 THEN 'CANCELACION'\n"
  + "        WHEN ch.Discriminator='CoverageChange' AND ISJSON(ch.jAdditional)=1 AND JSON_VALUE(ch.jAdditional,'$.endorsementType')='CHANGE_INSURED_SUM_SURETY' THEN 'CHANGE_INSURED_SUM_SURETY'\n"
  + "        WHEN ch.Discriminator='CoverageChange' AND ISJSON(ch.jAdditional)=1 AND JSON_VALUE(ch.jAdditional,'$.endorsementType')='PROCEEDORDER' THEN 'ProceedOrder'\n"
  + "        WHEN ch.Discriminator='CoverageChange' AND ISJSON(ch.jAdditional)=1 AND JSON_VALUE(ch.jAdditional,'$.endorsementType')='CHANGE_COVERAGE_SURETY' THEN 'ChangeCoverageSurety'\n"
  + "        ELSE ISNULL(ch.Discriminator,'ENDOSO') END AS tipo,\n"
  + "   CASE WHEN g.changeId IS NOT NULL THEN CONCAT('CHG:',g.changeId)\n"
  + "        WHEN g.anniversaryId IS NOT NULL THEN CONCAT('ANN:',g.anniversaryId)\n"
  + "        ELSE 'EMI:1' END AS movKey,\n"
  + "   g.holderName AS contratante, LTRIM(RTRIM(ISNULL(ins.name,'')+' '+ISNULL(ins.surname1,'')+' '+ISNULL(ins.surname2,''))) AS asegurado,\n"
  + "   COALESCE(ch.executionDate,an.executionDate,lp.activeDate,lp.created) AS fechaEmision,\n"
  + "   COALESCE(CASE WHEN g.changeId IS NULL AND g.anniversaryId IS NULL THEN TODATETIMEOFFSET(CAST(emi.[start] AS datetime2),'+00:00') END,TODATETIMEOFFSET(CAST(g.cessionStart AS datetime2),'+00:00')) AS fDesde,\n"
  + "   COALESCE(CASE WHEN g.changeId IS NULL AND g.anniversaryId IS NULL AND ISJSON(emi.jSnapshot)=1 THEN TRY_CONVERT(datetimeoffset,JSON_VALUE(emi.jSnapshot,'$.end')) END,CASE WHEN ISJSON(ch.jDetail)=1 THEN TRY_CONVERT(datetimeoffset,JSON_VALUE(ch.jDetail,'$.policyEnd')) END,TODATETIMEOFFSET(CAST(g.cessionEnd AS datetime2),'+00:00')) AS fHasta,\n"
  + "   g.changeId,g.sumaCedida,g.sumaCoaseguro,g.primaCedida,g.primaCoaseguro,g.comision,g.impuesto,\n"
  + "   g.primaCedida-g.comision-g.impuesto AS reaseguroPorPagar,\n"
  + "   CASE WHEN ct.effectiveDate IS NULL THEN '' ELSE FORMAT(ct.effectiveDate,'yyyyMM') END AS cserie\n"
  + " FROM grouped g\n"
  + " INNER JOIN LifePolicy lp ON lp.id=g.lifePolicyId\n"
  + " LEFT JOIN Change ch ON ch.id=g.changeId\n"
  + " LEFT JOIN Anniversary an ON an.id=g.anniversaryId\n"
  + " OUTER APPLY (SELECT TOP 1 a.[start],a.jSnapshot FROM Anniversary a WHERE a.lifePolicyId=g.lifePolicyId ORDER BY CASE WHEN ISNULL(a.contractYear,0)=1 THEN 0 ELSE 1 END,a.[start],a.id) emi\n"
  + " LEFT JOIN Contract ct ON ct.id=g.contractId\n"
  + " LEFT JOIN Contact rr ON rr.id=g.reinsurerId LEFT JOIN Contact br ON br.id=g.brokerId LEFT JOIN Contact ins ON ins.id=g.insuredId\n"
  + ")\n";
var countSql = sql + 'SELECT COUNT(*) AS total,COUNT(DISTINCT poliza) AS polizas FROM result';
doCmd({ cmd:'DoQuery', data:{ sql:countSql, timeout:300 } });
if (!DoQuery || !DoQuery.ok) throw 'No fue posible contar el borderó por reasegurador: ' + (DoQuery && DoQuery.msg ? DoQuery.msg : 'sin detalle');
var summary = DoQuery.outData && DoQuery.outData[0] || {};
var total = Number(summary.total || 0);
if (exportar) size = Math.min(Math.max(total, 1), 50000);
var skip = (page - 1) * size;
doCmd({ cmd:'DoQuery', data:{ sql:sql + 'SELECT * FROM result ORDER BY poliza,fechaEmision,id OFFSET ' + skip + ' ROWS FETCH NEXT ' + size + ' ROWS ONLY', timeout:300 } });
if (!DoQuery || !DoQuery.ok) throw 'No fue posible obtener el borderó por reasegurador: ' + (DoQuery && DoQuery.msg ? DoQuery.msg : 'sin detalle');
return { filas:DoQuery.outData || [],total:total,polizas:Number(summary.polizas || 0),page:page,size:size,paginas:size ? Math.ceil(total/size) : 0,exportacion:exportar };
