use sis11

go

declare @transferId int = 46

SELECT
  ROW_NUMBER() OVER (ORDER BY x.[Fecha de Cobro] DESC, x.contactId, x.policyCode) AS Id,
  x.Cajero,
  x.[No. Recibo],
  x.[Estado Cuenta],
  x.Cramo,
  x.Ramo,
  x.[Número Póliza],
  x.Asegurado,
  x.[Fecha de Cobro],
  x.[Prima Pagado],
  x.Impuestos,
  x.Gastos,
  x.[Monto Cobrado],
  x.Descripcion
FROM (
    SELECT
        MIN(t.[user]) AS Cajero,
        lp.fiscalNumber AS [No. Recibo],
        CASE WHEN lp.active = 1 THEN 'Activa' ELSE 'Inactiva' END AS [Estado Cuenta],
        lp.branchCode AS Cramo,
        lp.lob AS Ramo,
        lp.code AS [Número Póliza],
        CASE 
            WHEN c.isPerson = 1 THEN CONCAT_WS(' ', c.name, c.surname1, c.surname2)
            ELSE c.surname2
        END AS Asegurado,
        MAX(t.[date]) AS [Fecha de Cobro],
        SUM(ISNULL(t.amount,0)) AS [Prima Pagado],

        -- Impuesto UNA sola vez por póliza (evita duplicación por el join)
        MAX(ISNULL(lp.tax,0)) AS Impuestos,

        SUM(ISNULL(pcc.Gastos,0)) AS Gastos,

        -- Total = sum(movimientos + gastos) + impuesto UNA vez
        SUM(ISNULL(t.amount,0) + ISNULL(pcc.Gastos,0)) + MAX(ISNULL(lp.tax,0)) AS [Monto Cobrado],

        STRING_AGG(CONCAT_WS(' | ', lp.code, t.concept, t.id), '; ') AS Descripcion,

        c.id  AS contactId,
        lp.code AS policyCode
    FROM Transfer t
    LEFT JOIN Allocation a ON t.allocationId = a.id
    LEFT JOIN AllocationInstallment ai ON a.id = ai.allocationId
    LEFT JOIN LifePolicy lp ON ai.lifePolicyId = lp.id
    LEFT JOIN Contact c ON lp.holderId = c.id
    LEFT JOIN (
        SELECT claimPaymentId, SUM(TRY_CONVERT(decimal(18,2), value)) AS Gastos
        FROM PaymentCostCenter
        GROUP BY claimPaymentId
    ) pcc ON pcc.claimPaymentId = t.claimPaymentId
    WHERE t.executed = 1
    AND t.transferWorkspaceId = @transferId
    
    GROUP BY
        c.id,
        lp.fiscalNumber,
        lp.active,
        lp.branchCode,
        lp.lob,
        lp.code,
        CASE 
            WHEN c.isPerson = 1 THEN CONCAT_WS(' ', c.name, c.surname1, c.surname2)
            ELSE c.surname2
        END
) x
ORDER BY x.[Fecha de Cobro] DESC, x.contactId, x.policyCode