SELECT
    cl.id AS [Id],
    cl.code AS [CODIGO],
    lb.code AS [cramo], -- Campo informativo
    lb.name AS [Ramo],
    lp.code AS [POLIZA],
    NULL AS [COBIS], -- Campo informativo
    con.name + ' ' + ISNULL(con.surname1, '') AS [CLIENTE],
    -- SE AGREGA EL CESSION BENEFICIARY COMO ACREEDOR --
    acon.name + ' ' + ISNULL(acon.surname1, '') AS [ACREEDOR],
    CONVERT(VARCHAR(10), CAST(lp.start AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FDESDE Poliza],
    CONVERT(VARCHAR(10), CAST(lp.[end] AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FHASTA Poliza],
    cl.id AS [NSINIESTRO],
    CONVERT(VARCHAR(10), CAST(cl.occurrence AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FSINIESTRO],
    CASE WHEN cst.code IS NULL THEN 'SIN ESTADO' ELSE UPPER(cst.name) END AS [Estado],
    -- CÁLCULO DE RESERVAS: conserva tanto la reserva como lo ya pagado.
    CAST(r.resPago + r.pagPago + r.resGasto + r.pagGasto AS decimal(18,2)) AS [RESERVA],
    CAST(r.resPago + r.pagPago AS decimal(18,2)) AS [Reserva a PAGO],
    CAST(r.resGasto + r.pagGasto AS decimal(18,2)) AS [Reserva GAST],
    -- DATOS DEL PAGO --
    cp.id AS [SOLICITUD],
    CONVERT(VARCHAR(10), CAST(cp.date AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FSOLICITUD],
    CASE WHEN cp.parentId IS NOT NULL THEN 'Fusionada' ELSE CASE cp.entityState
        WHEN 'StartEvent_1' THEN 'Pendiente'
        WHEN 'Inicio' THEN 'Pendiente'
        WHEN 'APROVED' THEN 'Aprobada'
        WHEN 'EXECUTED' THEN 'Pagada'
        WHEN 'CLOSED' THEN 'Cerrada'
        ELSE ISNULL(cp.entityState, '')
    END END AS [ESTADO DE LA],
    ISNULL(cp.parentId, 0) AS [NOFUSION],
    bcon.name + ' ' + ISNULL(bcon.surname1, '') AS [BENEFICIARIO],
    CAST(ISNULL(cp.grossAmount, ISNULL(cp.total, 0)) - ISNULL(cp.total, 0) AS decimal(18,2)) AS [DEDUCCION],
    CAST(ISNULL(cp.total, 0) AS decimal(18,2)) AS [MONTO_NETO],
    cp.concept AS [CONCEPTO],
    CONVERT(VARCHAR(10), CAST(cp.date AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [Fecha de pago],
    -- COBERTURA Y REASEGURO --
    ISNULL(cv.code, '') AS [NOCOBERTURA],
    ISNULL(cv.name, '') AS [XCOBERTURA],
    CAST(ISNULL(cv.limit, 0) AS decimal(18,2)) AS [SUMAASEGURADA],
    ISNULL(ri.serie, '') AS [Reaseguro serie],
    CAST(ISNULL(ri.pRet, 0) AS decimal(9,4)) AS [% Retencion],
    CAST(ISNULL(ri.pCuota, 0) AS decimal(9,4)) AS [% Cedido],
    CAST(ISNULL(cp.total, 0) * ISNULL(ri.pRet, 0) AS decimal(18,2)) AS [Monto Retencion],
    CAST(ISNULL(cp.total, 0) * ISNULL(ri.pCuota, 0) AS decimal(18,2)) AS [Monto Cedido],
    CAST(ISNULL(cp.total, 0) * ISNULL(ri.pExced, 0) AS decimal(18,2)) AS [Excedente]
FROM ClaimPayment cp
INNER JOIN Claim cl ON cp.claimId = cl.id
INNER JOIN LifePolicy lp ON cl.lifePolicyId = lp.id
INNER JOIN Contact con ON cl.contactId = con.id -- Cliente/Asegurado
INNER JOIN Contact bcon ON cp.contactId = bcon.id -- Beneficiario del pago
-- JOIN PARA OBTENER EL NOMBRE DEL ACREEDOR (CESSION BENEFICIARY) --
LEFT JOIN Contact acon ON lp.cessionBeneficiary = acon.id
INNER JOIN Lob lb ON lp.lob = lb.code
LEFT JOIN ClaimStage cst ON cst.code = cl.stageCode
LEFT JOIN LifeCoveragePayout po ON po.id = cp.payoutId
LEFT JOIN LifeCoverage cv ON cv.id = ISNULL(cp.coverageId, po.lifeCoverageId)
OUTER APPLY (SELECT
    CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN 0 ELSE p.reserved END), 0) AS decimal(18,2)) AS resPago,
    CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN 0 ELSE p.payed END), 0) AS decimal(18,2)) AS pagPago,
    CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN p.reserved ELSE 0 END), 0) AS decimal(18,2)) AS resGasto,
    CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN p.payed ELSE 0 END), 0) AS decimal(18,2)) AS pagGasto
    FROM LifeCoveragePayout p
    WHERE p.claimId = cl.id
) r
OUTER APPLY (SELECT
    x.serie,
    CASE WHEN x.baseL <> 0 THEN x.retL / x.baseL WHEN x.baseR <> 0 THEN x.retR / x.baseR END AS pRet,
    CASE WHEN x.baseL <> 0 THEN x.cuoL / x.baseL WHEN x.baseR <> 0 THEN x.cuoR / x.baseR END AS pCuota,
    CASE WHEN x.baseL <> 0 THEN x.excL / x.baseL WHEN x.baseR <> 0 THEN x.excR / x.baseR END AS pExced
    FROM (
        SELECT
            MIN(k.code) AS serie,
            CAST(MAX(lc.loss) AS float) AS baseL,
            CAST(SUM(lc.retainedLoss) AS float) AS retL,
            CAST(SUM(CASE WHEN lc.lineId IS NULL OR lc.lineId LIKE 'Cuota%' THEN lc.cededLoss ELSE 0 END) AS float) AS cuoL,
            CAST(SUM(CASE WHEN lc.lineId IS NULL OR lc.lineId LIKE 'Cuota%' THEN 0 ELSE lc.cededLoss END) AS float) AS excL,
            CAST(MAX(lc.reserve) AS float) AS baseR,
            CAST(SUM(lc.retainedReserve) AS float) AS retR,
            CAST(SUM(CASE WHEN lc.lineId IS NULL OR lc.lineId LIKE 'Cuota%' THEN lc.cededReserve ELSE 0 END) AS float) AS cuoR,
            CAST(SUM(CASE WHEN lc.lineId IS NULL OR lc.lineId LIKE 'Cuota%' THEN 0 ELSE lc.cededReserve END) AS float) AS excR
        FROM LossCession lc
        LEFT JOIN Contract k ON k.id = lc.contractId
        WHERE cp.payoutId IS NOT NULL
          AND lc.lifeCoveragePayoutId = cp.payoutId
    ) x
) ri
WHERE CAST((cp.date AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) >= CAST(@FechaDesde AS date)
  AND CAST((cp.date AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) <= CAST(@FechaHasta AS date)
AND (ISNULL(@estado, '') = '' OR @estado = CASE WHEN cst.code IS NULL THEN 'SIN ESTADO' ELSE UPPER(cst.name) END)
and (@cliente = '' or con.name + ' ' + ISNULL(con.surname1, '') like '%' + @cliente + '%')
ORDER BY cp.date DESC;
