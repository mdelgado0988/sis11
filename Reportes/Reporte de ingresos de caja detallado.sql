use sis11

go

DECLARE @transferId INT = 55

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
        t.[user] AS Cajero,
        lp.fiscalNumber AS [No. Recibo],
        lp.[Estado Cuenta],
        lp.cramo AS Cramo,
        lp.Ramo,
        lp.code AS [Número Póliza],
        lp.Asegurado,
        (t.[date]) AS [Fecha de Cobro],
        (ISNULL(t.amount,0)) AS [Prima Pagado],

        /*-- Impuesto UNA sola vez por póliza (evita duplicación por el join)*/
        /*(ISNULL(lp.tax,0)) AS Impuestos,*/
		 0 AS Impuestos,
		 0 AS Gastos,

        /*(ISNULL(pcc.Gastos,0)) AS Gastos,*/

        /*-- Total = sum(movimientos + gastos) + impuesto UNA vez*/
        ISNULL(t.amount,0) [Monto Cobrado],
		lp.Descripcion,
        

        lp.id  AS contactId,
        lp.code AS policyCode
    FROM Transfer t    
	OUTER APPLY (SELECT c.id, lp.code, lp.fiscalNumber, lp.lob cramo,
					CASE 
					WHEN c.isPerson = 1 THEN CONCAT_WS(' ', c.name, c.surname1, c.surname2)
					ELSE c.surname2
					END AS Asegurado, rtrim(lo.name) AS Ramo,
					CASE WHEN lp.active = 1 THEN 'Activa' ELSE 'Inactiva' END AS [Estado Cuenta],
					STRING_AGG(CONCAT_WS(' | ', lp.code, t1.concept, t1.id), '; ') AS Descripcion
				 FROM Allocation a 
				 LEFT JOIN AllocationInstallment ai ON ai.allocationId = a.id 
				 INNER JOIN [Transfer] t1 On t1.allocationId = a.id
				 LEFT JOIN LifePolicy lp ON ai.lifePolicyId = lp.id
				 LEFT JOIN Contact c ON lp.holderId = c.id
				 LEFT JOIN Lob lo ON lo.code = lp.lob
				 WHERE a.id = t.allocationId
				 GROUP BY
					c.id,
					lp.fiscalNumber,
					lp.active,
					lp.lob,
					lo.name,
					lp.code,
					CASE 
						WHEN c.isPerson = 1 THEN CONCAT_WS(' ', c.name, c.surname1, c.surname2)
						ELSE c.surname2
					END) lp
    WHERE t.executed = 1
    AND t.transferWorkspaceId = @transferId
) x
ORDER BY x.[Fecha de Cobro] DESC, x.contactId, x.policyCode