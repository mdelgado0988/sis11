use sis11

go

DECLARE @workspaceId INT = 55

SELECT
	ROW_NUMBER() OVER (ORDER BY t.Date DESC, lp.contactId, lp.policyCode) AS Id,
    t.[user] AS Cajero,
	t.id [Transfer Id],
    lp.fiscalNumber AS [No. Recibo],
    lp.[Estado Cuenta],
    lp.cramo AS Cramo,
    lp.Ramo,
    lp.policyCode AS [Número Póliza],
    lp.Asegurado,
    (t.[date]) AS [Fecha de Cobro],
    ISNULL(lp.Prima,0) * si.Signo AS [Prima Pagado],
	ISNULL(lp.Impuesto,0) * si.Signo AS Impuestos,
	0 * si.Signo AS Gastos,
	ISNULL(lp.PrimaAFavor,0) * si.Signo AS PrimaAFavor,
    ISNULL(t.amount,0) [Monto Cobrado],
	CASE WHEN tt.name IS NULL AND t.transactionCode = 'CASHDEP' THEN 'Depósito de caja' ELSE tt.name END Descripcion,
    lp.ContactId  AS contactId,
    lp.policyCode AS policyCode,
	t.allocationId
FROM Transfer t    
CROSS APPLY (SELECT CASE WHEN t.amount < 0 THEN -1 ELSE 1 END Signo) si
LEFT JOIN IncomeTypeCatalog tt ON tt.code = t.incomeType
OUTER APPLY (SELECT MAX(c.id) ContactId, MAX(lp.code) policyCode, MAX(lp.fiscalNumber) fiscalNumber, MAX(lp.lob) cramo,
				MAX(CASE 
				WHEN c.isPerson = 1 THEN CONCAT_WS(' ', c.name, c.surname1, c.surname2)
				ELSE c.surname2
				END) AS Asegurado, MAX(rtrim(lo.name)) AS Ramo,
				MAX(CASE WHEN lp.active = 1 THEN 'Activa' ELSE 'Inactiva' END) AS [Estado Cuenta],
				SUM(CAST(ppr2.primaPorcion * ai.moneyInAmount AS DECIMAL(18,2))) Prima,
				SUM(CAST(ppr2.primaPorcion * ai.moneyInAmount * 0.05 AS DECIMAL(18,2))) Impuesto,
				SUM(ISNULL(asu.moneyInAmount,0)) PrimaAFavor
			FROM Allocation a 
			LEFT JOIN AllocationInstallment ai ON ai.allocationId = a.id 
			LEFT JOIN LifePolicy lp ON ai.lifePolicyId = lp.id
			LEFT JOIN PayPlan pp ON pp.id = ai.payPlanId
			LEFT JOIN PayPlanDetail ppd ON ppd.payPlanId = pp.id AND ppd.detail LIKE 'Prima%'
			OUTER APPLY (SELECT CASE WHEN pp.minimum = 0 THEN 0 ELSE ppd.amount / pp.minimum END primaPorcion) ppr
			OUTER APPLY (SELECT CASE WHEN ISNULL(ppr.primaPorcion,0) = 0 
								THEN lp.anualPremium / lp.anualTotal
								ELSE ISNULL(ppr.primaPorcion,0) END primaPorcion) ppr2
			LEFT JOIN AllocationSupplementary asu ON asu.allocationId = a.id
			LEFT JOIN Contact c ON lp.holderId = c.id
			LEFT JOIN Lob lo ON lo.code = lp.lob			
			WHERE a.id = t.allocationId) lp
WHERE t.executed = 1
AND t.isExternal = 1
AND t.transferWorkspaceId = @workspaceId
ORDER BY t.date DESC, lp.contactId, lp.policyCode
