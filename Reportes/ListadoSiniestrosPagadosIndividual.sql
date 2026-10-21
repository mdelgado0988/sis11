SELECT CAST(ROW_NUMBER() OVER (ORDER BY ISNULL(cp.date, cp.releaseDate), cp.id) AS int) AS [Id],
 cl.id AS [CODIGO], lp.lob AS [cramo], ISNULL(lb.name, lp.lob) AS [Ramo], lp.code AS [POLIZA],
 ISNULL(c.nationalId, '') AS [COBIS],
 LTRIM(RTRIM(CONCAT(ISNULL(c.name, ''), ' ' + NULLIF(c.surname1, ''), ' ' + NULLIF(c.surname2, '')))) AS [CLIENTE],
 ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(ac.name, ''), ' ' + NULLIF(ac.surname1, ''), ' ' + NULLIF(ac.surname2, '')))), ''), 'NO TIENE') AS [ACREEDOR],
 CONVERT(VARCHAR(10), CAST(lp.start AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FDesdePoliza],
 CONVERT(VARCHAR(10), CAST(lp.[end] AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FHastaPoliza],
 cl.code AS [NSINIESTRO], CONVERT(VARCHAR(10), CAST(cl.occurrence AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FSINIESTRO],
 CASE WHEN cs.code IS NULL THEN 'SIN ESTADO' ELSE UPPER(cs.name) END AS [Estado],
 r.resPago + r.pagPago + r.resGasto + r.pagGasto AS [RESERVA], r.resPago + r.pagPago AS [RPago], r.resGasto + r.pagGasto AS [RGasto],
 cp.id AS [SOLICITUD], CONVERT(VARCHAR(10), CAST(cp.date AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FSOLICITUD],
 CASE cp.entityState WHEN 'StartEvent_1' THEN 'Pendiente' WHEN 'Inicio' THEN 'Pendiente' WHEN 'APROVED' THEN 'Aprobada' WHEN 'EXECUTED' THEN 'Pagada' WHEN 'CLOSED' THEN 'Cerrada' ELSE ISNULL(cp.entityState, '') END AS [ESTADOSOL],
 ISNULL(cp.parentId, 0) AS [NOFUSION],
 ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(bc.name, ''), ' ' + NULLIF(bc.surname1, ''), ' ' + NULLIF(bc.surname2, '')))), ''), '') AS [BENEFICIARIO],
 CAST(ISNULL(cp.grossAmount, cp.total) - cp.total AS decimal(18,2)) AS [DEDUCCION],
 CAST(cp.total AS decimal(18,2)) AS [MONTO_NETO],
 COALESCE(NULLIF(cp.concept, ''), CASE WHEN ISJSON(cp.jDetail) = 1 THEN JSON_VALUE(cp.jDetail, '$[0].description') END, po.concept, '') AS [CONCEPTO],
 CONVERT(VARCHAR(10), CAST(ISNULL(cp.date, cp.releaseDate) AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FechaPago],
 cv.code AS [NOCOBERTURA], cv.name AS [XCOBERTURA], CAST(cv.limit AS decimal(18,2)) AS [SUMAASEGURADA],
 ISNULL(ri.serie, '') AS [serie],
 CAST(ISNULL(ri.pRet, 0) * 100 AS decimal(9,2)) AS [ret],
 CAST(ISNULL(ri.pCuota, 0) * 100 AS decimal(9,2)) AS [cp],
 CAST(cp.total * ISNULL(ri.pRet, 0) AS decimal(18,2)) AS [MontoRetencion],
 CAST(cp.total * ISNULL(ri.pCuota, 0) AS decimal(18,2)) AS [MontoCP],
 CAST(cp.total * ISNULL(ri.pExced, 0) AS decimal(18,2)) AS [Excedente]
FROM ClaimPayment cp
INNER JOIN Claim cl ON cl.id = cp.claimId
INNER JOIN LifePolicy lp ON lp.id = cl.lifePolicyId
LEFT JOIN Lob lb ON lb.code = lp.lob
LEFT JOIN Contact c ON c.id = cl.contactId
LEFT JOIN Contact ac ON ac.id = lp.cessionBeneficiary
LEFT JOIN Contact bc ON bc.id = cp.contactId
LEFT JOIN ClaimStage cs ON cs.code = cl.stageCode
LEFT JOIN LifeCoveragePayout po ON po.id = cp.payoutId
LEFT JOIN LifeCoverage cv ON cv.id = ISNULL(cp.coverageId, po.lifeCoverageId)
OUTER APPLY (SELECT
   CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN 0 ELSE p.reserved END), 0) AS decimal(18,2)) AS resPago,
   CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN 0 ELSE p.payed END), 0) AS decimal(18,2)) AS pagPago,
   CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN p.reserved ELSE 0 END), 0) AS decimal(18,2)) AS resGasto,
   CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN p.payed ELSE 0 END), 0) AS decimal(18,2)) AS pagGasto
  FROM LifeCoveragePayout p WHERE p.claimId = cl.id) r
OUTER APPLY (SELECT x.serie,
   CASE WHEN x.baseL <> 0 THEN x.retL / x.baseL WHEN x.baseR <> 0 THEN x.retR / x.baseR END AS pRet,
   CASE WHEN x.baseL <> 0 THEN x.cuoL / x.baseL WHEN x.baseR <> 0 THEN x.cuoR / x.baseR END AS pCuota,
   CASE WHEN x.baseL <> 0 THEN x.excL / x.baseL WHEN x.baseR <> 0 THEN x.excR / x.baseR END AS pExced
  FROM (SELECT MIN(k.code) AS serie,
     CAST(MAX(lc.loss) AS float) AS baseL, CAST(SUM(lc.retainedLoss) AS float) AS retL,
     CAST(SUM(CASE WHEN lc.lineId IS NULL OR lc.lineId LIKE 'Cuota%' THEN lc.cededLoss ELSE 0 END) AS float) AS cuoL,
     CAST(SUM(CASE WHEN lc.lineId IS NULL OR lc.lineId LIKE 'Cuota%' THEN 0 ELSE lc.cededLoss END) AS float) AS excL,
     CAST(MAX(lc.reserve) AS float) AS baseR, CAST(SUM(lc.retainedReserve) AS float) AS retR,
     CAST(SUM(CASE WHEN lc.lineId IS NULL OR lc.lineId LIKE 'Cuota%' THEN lc.cededReserve ELSE 0 END) AS float) AS cuoR,
     CAST(SUM(CASE WHEN lc.lineId IS NULL OR lc.lineId LIKE 'Cuota%' THEN 0 ELSE lc.cededReserve END) AS float) AS excR
    FROM LossCession lc LEFT JOIN Contract k ON k.id = lc.contractId
    WHERE cp.payoutId IS NOT NULL AND lc.lifeCoveragePayoutId = cp.payoutId) x) ri
WHERE ISNULL(cp.entityState, '') NOT IN ('REJECTED', 'REVERTED')
  AND (@fechaDesde IS NULL OR @fechaDesde <= '1900-01-01' OR CAST((cp.date AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) >= CAST(@fechaDesde AS date))
  AND (@fechaHasta IS NULL OR @fechaHasta <= '1900-01-01' OR CAST((cp.date AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) <= CAST(@fechaHasta AS date))
  AND (ISNULL(@ramo, '') = '' OR lp.lob = @ramo)
ORDER BY [Id]
