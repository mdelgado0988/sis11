USE SIS11
GO

SELECT CAST(ROW_NUMBER() OVER (ORDER BY CASE WHEN cs.code IS NULL THEN 2 WHEN TRY_CAST(cs.code AS int) IS NULL THEN 1 ELSE 0 END, TRY_CAST(cs.code AS int), cs.code, cl.notification, cl.id) AS int) AS [ID],
 ISNULL(lb.name, lp.lob) AS [Ramo], lp.code AS [Poliza], cl.id AS [NoSiniestro], cl.code AS [Reclamo],
 CONVERT(VARCHAR(10), CAST(cl.notification AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FNotificacion],
 CONVERT(VARCHAR(10), CAST(cl.created AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FIngreso],
 CONVERT(VARCHAR(10), CAST(cl.occurrence AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FSiniestro],
 CONVERT(VARCHAR(10), CAST(r.fUltReserva AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FUltimaReserva],
 CONVERT(VARCHAR(10), CAST(lp.start AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FDesde],
 CONVERT(VARCHAR(10), CAST(lp.[end] AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [FHasta],
 DATEDIFF(day, cl.occurrence, ISNULL(r.fUltReserva, GETDATE())) AS [DiasDelSiniestro],
 DATEDIFF(day, cl.notification, ISNULL(r.fUltReserva, GETDATE())) AS [DiasNotificacion],
 CASE WHEN cs.code IS NULL THEN 'SIN ESTADO' ELSE UPPER(cs.name) END AS [StatusSini],
 ISNULL(cl.stageCode, '-') AS [CodEstado],
 CAST(CASE WHEN cs.code IS NULL THEN 9999 WHEN TRY_CAST(cs.code AS int) IS NULL THEN 1000 + UNICODE(cs.code) ELSE TRY_CAST(cs.code AS int) END AS int) AS [OrdenEstado],
 COALESCE(NULLIF(c.nationalId, ''), NULLIF(c.fiscalNumber, ''), NULLIF(c.passport, ''), '') AS [CedulaAseg],
 LTRIM(RTRIM(CONCAT(ISNULL(c.name, ''), ' ' + NULLIF(c.surname1, ''), ' ' + NULLIF(c.surname2, '')))) AS [Asegurado],
 cl.description AS [DescripSini], YEAR(CAST((cl.occurrence AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS datetime)) AS [Anio], pr.usuario AS [CreadoPor], aj.ajustador AS [AjustadorSini],
 r.resPago + r.pagPago AS [ReservaPago], r.pagPago AS [PagosRegistrados], r.resPago AS [SaldoPago],
 r.resGasto + r.pagGasto AS [ReservaGasto], r.pagGasto AS [GastosRegistrados], r.resGasto AS [SaldoGasto],
 ISNULL(sv.recup, 0) AS [Recuperaciones],
 CASE WHEN r.resPago > 0 THEN r.resPago ELSE 0 END + CASE WHEN r.resGasto > 0 THEN r.resGasto ELSE 0 END - ISNULL(sv.recup, 0) AS [SaldoGeneral]
FROM Claim cl
INNER JOIN LifePolicy lp ON lp.id = cl.lifePolicyId
LEFT JOIN Lob lb ON lb.code = lp.lob
LEFT JOIN Contact c ON c.id = cl.contactId
LEFT JOIN ClaimStage cs ON cs.code = cl.stageCode
LEFT JOIN Proceso pr ON pr.id = cl.processId
OUTER APPLY (SELECT
   CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN 0 ELSE p.reserved END), 0) AS decimal(18,2)) AS resPago,
   CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN 0 ELSE p.payed END), 0) AS decimal(18,2)) AS pagPago,
   CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN p.reserved ELSE 0 END), 0) AS decimal(18,2)) AS resGasto,
   CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN p.payed ELSE 0 END), 0) AS decimal(18,2)) AS pagGasto,
   MAX(CASE WHEN ISNULL(p.payed, 0) = 0 AND p.reserved <> 0 THEN p.date END) AS fUltReserva
  FROM LifeCoveragePayout p WHERE p.claimId = cl.id) r
OUTER APPLY (SELECT CAST(SUM(s.netIncome) AS decimal(18,2)) AS recup FROM Salvage s WHERE s.claimId = cl.id) sv
OUTER APPLY (SELECT TOP 1 JSON_VALUE(f.value, '$.userData[0]') AS ajustador
  FROM OPENJSON(CASE WHEN ISJSON(cl.jCustomForms) = 1 THEN cl.jCustomForms ELSE '{}' END) fm
  CROSS APPLY OPENJSON(CASE WHEN ISJSON(fm.value) = 1 AND LEFT(LTRIM(fm.value), 1) = '[' THEN fm.value ELSE '[]' END) f
  WHERE fm.[key] = 'Detalle del Siniestro' AND JSON_VALUE(f.value, '$.name') = 'ajustadorName') aj
WHERE (@fechaDesde IS NULL OR @fechaDesde <= '1900-01-01' OR CAST((cl.created AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) >= CAST(@fechaDesde AS date))
  AND (@fechaHasta IS NULL OR @fechaHasta <= '1900-01-01' OR CAST((cl.created AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) <= CAST(@fechaHasta AS date))
  AND (ISNULL(@estado, '') = '' OR ISNULL(cl.stageCode, '-') = @estado)
  AND (ISNULL(@ramo, '') = '' OR lp.lob = @ramo)
ORDER BY [ID]
