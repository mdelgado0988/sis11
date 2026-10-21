SELECT x.[Siniestro], x.[Poliza], x.[Asegurado], x.[Plan], x.[Comentarios], x.[Cobertura], x.[FAcc], x.[FMovReserva],
 x.[Categoria], x.[TipoMovimiento], x.[ReservaPagos], x.[ReservaGastos], x.[FPago], x.[PagoGasto], x.[FSolicitud],
 x.[Solicitud], x.[Deduccion], x.[MontoCK], x.[EstatusCK], x.[Orden], x.[ClaimId], x.[MovId]
FROM (
 SELECT CAST(NULL AS nvarchar(40)) AS [Siniestro], CAST(NULL AS nvarchar(60)) AS [Poliza], CAST(NULL AS nvarchar(300)) AS [Asegurado],
  CAST(NULL AS nvarchar(200)) AS [Plan], CAST(NULL AS nvarchar(500)) AS [Comentarios], CAST(NULL AS nvarchar(200)) AS [Cobertura],
  CAST(NULL AS varchar(10)) AS [FAcc], CONVERT(VARCHAR(10), r.desde, 103) AS [FMovReserva], CAST(NULL AS nvarchar(40)) AS [Categoria],
  CAST('Saldo Anterior' AS nvarchar(40)) AS [TipoMovimiento],
  CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN 0 ELSE ISNULL(p.reserved, 0) END), 0) AS decimal(18,2)) AS [ReservaPagos],
  CAST(ISNULL(SUM(CASE WHEN p.reserveType = 'EX' THEN ISNULL(p.reserved, 0) ELSE 0 END), 0) AS decimal(18,2)) AS [ReservaGastos],
  CAST(NULL AS varchar(10)) AS [FPago], CAST(0 AS decimal(18,2)) AS [PagoGasto], CAST(NULL AS varchar(10)) AS [FSolicitud],
  CAST(NULL AS int) AS [Solicitud], CAST(0 AS decimal(18,2)) AS [Deduccion], CAST(0 AS decimal(18,2)) AS [MontoCK],
  CAST(NULL AS nvarchar(40)) AS [EstatusCK], 0 AS [Orden], CAST(NULL AS int) AS [ClaimId], CAST(NULL AS int) AS [MovId], CAST(r.desde AS datetime2) AS [FMovReservaOrden]
 FROM (SELECT CASE WHEN @fechaDesde IS NULL OR @fechaDesde <= '1900-01-02'
        THEN DATEFROMPARTS(YEAR(CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS date)), MONTH(CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS date)), 1)
        ELSE CAST(@fechaDesde AS date) END AS desde) r
 LEFT JOIN (LifeCoveragePayout p
   INNER JOIN Claim cl ON cl.id = p.claimId
   INNER JOIN LifePolicy lp ON lp.id = cl.lifePolicyId)
  ON CAST((p.date AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) < r.desde
  AND (NULLIF(LTRIM(RTRIM(@ramo)), '') IS NULL OR lp.lob = LTRIM(RTRIM(@ramo)))
  AND (NULLIF(LTRIM(RTRIM(@siniestro)), '') IS NULL OR cl.code = LTRIM(RTRIM(@siniestro)) OR CAST(cl.id AS varchar(20)) = LTRIM(RTRIM(@siniestro)))
 GROUP BY r.desde
 UNION ALL
 SELECT COALESCE(NULLIF(cl.code, ''), CAST(cl.id AS varchar(20))), lp.code,
  LTRIM(RTRIM(CONCAT(ISNULL(c.name, ''), ' ' + NULLIF(c.surname1, ''), ' ' + NULLIF(c.surname2, '')))),
  ISNULL(pd.name, lp.productCode), p.concept, lc.name,
  CONVERT(VARCHAR(10), CAST(cl.occurrence AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103),
  CONVERT(VARCHAR(10), CAST(p.date AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103),
  CASE WHEN ISNULL(p.payed, 0) <> 0 THEN CASE WHEN p.reserveType = 'EX' THEN 'Registro de Gasto' ELSE 'Registro de Pago' END
       ELSE CASE WHEN p.reserveType = 'EX' THEN 'Reserva de Gasto' ELSE 'Reserva de Pago' END END,
  CASE WHEN ISNULL(p.payed, 0) > 0 THEN CASE WHEN p.reserveType = 'EX' THEN 'Registro de Gasto' ELSE 'Registro de Pago' END
       WHEN ISNULL(p.payed, 0) < 0 THEN CASE WHEN p.reserveType = 'EX' THEN 'Anulación de Gasto' ELSE 'Anulación de Pago' END
       WHEN p.concept LIKE 'Cierre de reserva%' THEN 'Cierre Reserva'
       WHEN ISNULL(p.reserved, 0) >= 0 AND NOT EXISTS (SELECT 1 FROM LifeCoveragePayout q WHERE q.claimId = p.claimId
            AND q.lifeCoverageId = p.lifeCoverageId AND ISNULL(q.reserveType, 'IN') = ISNULL(p.reserveType, 'IN')
            AND (q.date < p.date OR (q.date = p.date AND q.id < p.id))) THEN 'Apertura Inicial'
       WHEN ISNULL(p.reserved, 0) > 0 THEN 'Aumento'
       WHEN ISNULL(p.reserved, 0) < 0 THEN 'Disminución'
       ELSE 'Ajuste' END,
  CAST(CASE WHEN p.reserveType = 'EX' THEN 0 ELSE ISNULL(p.reserved, 0) END AS decimal(18,2)),
  CAST(CASE WHEN p.reserveType = 'EX' THEN ISNULL(p.reserved, 0) ELSE 0 END AS decimal(18,2)),
  CASE WHEN ISNULL(p.payed, 0) <> 0 THEN CONVERT(VARCHAR(10), CAST(p.date AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) END,
  CAST(ISNULL(p.payed, 0) AS decimal(18,2)),
  CONVERT(VARCHAR(10), CAST(op.fecha AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103), op.solicitud,
  CAST(ISNULL(op.deduccion, 0) AS decimal(18,2)), CAST(ISNULL(op.monto, 0) AS decimal(18,2)),
  CASE WHEN op.solicitud IS NOT NULL THEN
         CASE op.estado WHEN 'EXECUTED' THEN 'Ejecutada' WHEN 'APROVED' THEN 'Aprobada' WHEN 'APPROVED' THEN 'Aprobada'
           WHEN 'REVERTED' THEN 'Reversada' WHEN 'REJECTED' THEN 'Rechazada' WHEN 'CLOSED' THEN 'Cerrada' ELSE 'Pendiente' END
       WHEN ISNULL(p.payed, 0) <> 0 THEN 'Sin Solicitud' END,
  1, cl.id, p.id, CAST(p.date AS datetime2)
 FROM LifeCoveragePayout p
 INNER JOIN Claim cl ON cl.id = p.claimId
 INNER JOIN LifePolicy lp ON lp.id = cl.lifePolicyId
 LEFT JOIN LifeCoverage lc ON lc.id = p.lifeCoverageId
 LEFT JOIN Contact c ON c.id = cl.contactId
 LEFT JOIN Product pd ON pd.code = lp.productCode
 OUTER APPLY (SELECT TOP 1 cp.id AS solicitud, cp.date AS fecha, cp.entityState AS estado,
    (SELECT SUM(ISNULL(c2.deductions, 0)) FROM ClaimPayment c2 WHERE c2.payoutId = p.id) AS deduccion,
    (SELECT SUM(ISNULL(c2.total, 0)) FROM ClaimPayment c2 WHERE c2.payoutId = p.id) AS monto
   FROM ClaimPayment cp WHERE cp.payoutId = p.id ORDER BY cp.id DESC) op
 WHERE CAST((p.date AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) >= CASE WHEN @fechaDesde IS NULL OR @fechaDesde <= '1900-01-02'
        THEN DATEFROMPARTS(YEAR(CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS date)), MONTH(CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS date)), 1)
        ELSE CAST(@fechaDesde AS date) END
  AND CAST((p.date AT TIME ZONE 'UTC') AT TIME ZONE 'SA Pacific Standard Time' AS date) <= CASE WHEN @fechaHasta IS NULL OR @fechaHasta <= '1900-01-02'
        THEN EOMONTH(CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS date))
        ELSE CAST(@fechaHasta AS date) END
  AND (NULLIF(LTRIM(RTRIM(@ramo)), '') IS NULL OR lp.lob = LTRIM(RTRIM(@ramo)))
  AND (NULLIF(LTRIM(RTRIM(@siniestro)), '') IS NULL OR cl.code = LTRIM(RTRIM(@siniestro)) OR CAST(cl.id AS varchar(20)) = LTRIM(RTRIM(@siniestro)))
) x
ORDER BY x.[Orden], x.[ClaimId], x.[FMovReservaOrden], x.[MovId]
