//block
//noreplace
/*
    *Name: cmdPaginationBatchDetail
    *Author: Michael  Delgado.
    *Date: 2026.01.08.
    *Description: Get renovation batch details with pagination.
    *Input: { loteId: 59, currentPage: 1, pageSize: 25 }
    *output: { ok, tota, data }
*/

const { loteId, currentPage, pageSize } = context;

const sqlCommand = `DECLARE @pagenum  AS INT = ${currentPage}, @pagesize AS INT = ${pageSize}, @loteId AS INT = ${loteId};

SELECT 
    JSON_VALUE(item.value, '$[0]') AS anniversaryId,
    JSON_VALUE(item.value, '$[2]') AS lifePolicyId,
    COALESCE(
        TRY_CAST(JSON_VALUE(item.value, '$[4]') AS INT),
        TRY_CAST(JSON_VALUE(item.value, '$[2]') AS INT)
    ) AS newLifePolicyId,
    COALESCE(pro.name, nlp.productCode, '') producto,
    nlp.code poliza,
    ISNULL(ep.PrimaPura,0) prima,
    CASE WHEN ISNULL(lp.surcharges,0) = 0 AND ISNULL(ep.extraprima,0) > 0 THEN ISNULL(ep.extraprima,0) ELSE lp.surcharges END recargo,
    CASE WHEN ISNULL(lp.discounts,0) = 0 AND ISNULL(ep.extraprima,0) < 0 THEN ISNULL(ep.extraprima,0) ELSE lp.discounts END descuento,
    lp.anualPremium primaNeta,
    lp.tax impuesto,
    lp.fee gasto,
    lp.anualTotal facturado,
    ISNULL(c.pagado,0) pagado,
    ISNULL(c.pendiente,0) pendiente,
    CASE WHEN lp.anualTotal = 0 THEN 0 ELSE ISNULL(c.pagado,0) / lp.anualTotal END * 100 porcentajepagado,
    CASE WHEN lp.anualTotal = 0 THEN 0 ELSE ISNULL(c.pendiente,0) / lp.anualTotal END * 100 porcentajependiente,
    ISNULL(s.cantidad,0) siniestros,
    CONVERT(VARCHAR,nlp.[start],103) inicio,
    CONVERT(VARCHAR,nlp.[end],103) vence,
    nlp.anualPremium primaCotizada,
    CASE WHEN nlp.[activeDate] IS NULL THEN 'No' ELSE 'Si' END AS renovar
FROM [Batch] b
CROSS APPLY OPENJSON(b.jData) AS item
INNER JOIN LifePolicy lp ON lp.id = TRY_CAST(JSON_VALUE(item.value, '$[2]') AS INT)
INNER JOIN LifePolicy nlp ON nlp.id = TRY_CAST(JSON_VALUE(item.value, '$[4]') AS INT)
LEFT JOIN Product pro ON pro.code = nlp.productCode
OUTER APPLY (SELECT MAX(c.contractYear) contractYear
             FROM PayPlan c
             WHERE c.lifePolicyId = lp.id) cm
OUTER APPLY (SELECT SUM(c.extrapremium) ExtraPrima, SUM(c.basePremium) PrimaPura
             FROM LifeCoverage c
             WHERE c.lifePolicyId = lp.id) ep
OUTER APPLY (SELECT SUM(c.payed) pagado, SUM(c.minimum - c.payed) pendiente
             FROM PayPlan c
             WHERE c.lifePolicyId = lp.id AND c.contractYear = cm.contractYear) c
OUTER APPLY (SELECT COUNT(1) cantidad
             FROM Claim c
             WHERE c.lifePolicyId = lp.id) s
WHERE b.id = @loteId
ORDER BY JSON_VALUE(item.value, '$[0]')
OFFSET (@pagenum - 1) * @pagesize ROWS
FETCH NEXT @pagesize ROWS ONLY;`;

doCmd({
    cmd:'DoQuery',
    data: {
        sql: sqlCommand
    }
});

//return DoQuery?.outData

const dataPaginada = DoQuery?.outData?.map(x => ({
  lifePolicyId: x.lifePolicyId,
  newLifePolicyId: x.newLifePolicyId,
  anniversaryId: x.anniversaryId,
  producto: x.producto,
  poliza: x.poliza,
  prima: x.prima,
  recargo: x.recargo,
  descuento: x.descuento,
  primaNeta: x.primaNeta,
  impuesto: x.impuesto,
  gasto: x.gasto,
  facturado: x.facturado,
  pagado: x.pagado,
  pendiente: x.pendiente,
  porcentajepagado: x.porcentajepagado,
  porcentajependiente: x.porcentajependiente,
  siniestros: x.siniestros,
  inicio: x.inicio,
  vence: x.vence,
  primaCotizada: x.primaCotizada,
  renovar: x.renovar
})) || [];

//return dataPaginada;

const sqlCommandCount = 
`SELECT 
    COUNT(1) total
FROM [Batch] b
CROSS APPLY OPENJSON(b.jData) AS item
WHERE b.id = '${loteId}'`;

doCmd({
    cmd:'DoQuery',
    data: {
        sql: sqlCommandCount
    }
});
const totalDatos = DoQuery?.outData[0]?.total ?? 0;

return {
    ok: true,
    total: totalDatos,
    data: dataPaginada
}
