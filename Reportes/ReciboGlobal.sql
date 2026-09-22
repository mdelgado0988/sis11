use sis11
go

declare @transferId int = 7198

SELECT 
    t.id TransferId,
    CASE WHEN pol.id IS NULL THEN
        ISNULL((SELECT TOP 1 JSON_VALUE(value, '$.userData[0]') 
        FROM OPENJSON(jIncomeTypeForm) 
        WHERE JSON_VALUE(value, '$.name') = 'pagador'), '')
    ELSE
    ISNULL(h.name,'') + ' ' + ISNULL(h.surname1, '') + ' ' + ISNULL(h.surname2, '') 
    END AS asegurado,

	FORMAT(CAST(t.date AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 'dd/MM/yyyy') AS FechaPago,

    CASE
        WHEN at.detailId IS NULL THEN t.amount
        ELSE SUM(COALESCE(at.moneyInAmount, 0) + COALESCE(at.transitAmount, 0)) OVER (PARTITION BY t.id)
    END AS monto_transaccion,
    'CONVERTIR_A_LETRAS(' + CAST(
        CASE WHEN at.detailId IS NULL THEN t.amount
             ELSE COALESCE(at.moneyInAmount, 0) + COALESCE(at.transitAmount, 0)
        END AS VARCHAR
    ) + ')' AS monto_en_letras,
    ISNULL(tc.name, 'Pago de Prima') AS concepto_pago,
    ISNULL(CAST(pol.id AS VARCHAR(15)), 'S/N') AS nro_factura,
    pol.code AS nro_póliza,
    IsNULL(pp.numberInYear,0) AS nro_cuota,
    CASE WHEN at.isTransit = 1 THEN COALESCE(at.transitAmount, 0) ELSE 0 END AS o_pagos,
    montos.primas AS primas,
    COALESCE(montos.gastos_de, 0) AS gastos_de,
    COALESCE(montos.impuesto, 0) AS impuesto,
    COALESCE(montos.interes, 0) AS interes,
    CASE WHEN at.detailId IS NULL THEN t.amount
         ELSE COALESCE(at.moneyInAmount, 0) + COALESCE(at.transitAmount, 0)
    END AS total
	,at.moneyInAmount montoPagadoCuota
	,pt.*
	,COALESCE(at.transitAmount, 0) AS [Transito]

FROM transfer AS t 
	OUTER APPLY (
		SELECT
			ai.id AS detailId,
			0 AS detailOrder,
			0 AS isTransit,
			ai.allocationId,
			ai.lifePolicyId,
			ai.payPlanId,
			ai.moneyInAmount,
			CAST(0 AS DECIMAL(18,2)) AS transitAmount
		FROM AllocationInstallment ai
		WHERE ai.allocationId = t.allocationId

		UNION ALL

		SELECT
			-ai.id AS detailId,
			1 AS detailOrder,
			1 AS isTransit,
			ai.allocationId,
			ai.lifePolicyId,
			CAST(NULL AS INT) AS payPlanId,
			CAST(0 AS DECIMAL(18,2)) AS moneyInAmount,
			ai.transitAmount
		FROM AllocationInstallment ai
		WHERE ai.allocationId = t.allocationId
			AND ai.transitAmount > 0

		UNION ALL

		SELECT
			supplementary.id AS detailId,
			2 AS detailOrder,
			1 AS isTransit,
			supplementary.allocationId,
			supplementary.lifePolicyId,
			CAST(NULL AS INT) AS payPlanId,
			CAST(0 AS DECIMAL(18,2)) AS moneyInAmount,
			supplementary.moneyInAmount AS transitAmount
		FROM AllocationSupplementary supplementary
		WHERE supplementary.allocationId = t.allocationId
	) at
	LEFT JOIN Allocation ad ON ad.id = t.allocationId
    LEFT JOIN lifePolicy AS pol ON at.lifePolicyId = pol.id 
    LEFT JOIN PayPlan AS pp ON at.payPlanId = pp.id 
    LEFT JOIN Contact AS h ON pol.holderId = h.Id
    LEFT JOIN IncomeTypeCatalog tc ON tc.code = t.incomeType	
	OUTER APPLY (SELECT SUM(CASE WHEN pd.detail LIKE '%Prima%' THEN pd.amount ELSE 0 END) Prima
						, SUM(CASE WHEN pd.detail LIKE '%Impuesto%' THEN pd.amount ELSE 0 END) Impuesto
						, SUM(CASE WHEN pd.detail LIKE '%Gasto%' THEN pd.amount ELSE 0 END) Gasto
                    , SUM(CASE WHEN pd.detail LIKE N'%Inter%' THEN pd.amount ELSE 0 END) Interes
				 FROM PayPlanDetail pd 
				 WHERE pd.payPlanId = pp.id) dd

	OUTER APPLY (SELECT CASE WHEN pp.minimum  = 0 THEN 0 ELSE ISNULL(dd.Prima,0) / pp.minimum END pPrima
						, CASE WHEN pp.minimum  = 0 THEN 0 ELSE ISNULL(dd.Impuesto,0) / pp.minimum END pImpuesto
						, CASE WHEN pp.minimum  = 0 THEN 0 ELSE ISNULL(dd.Gasto,0) / pp.minimum END pGasto
						, CASE WHEN pp.minimum  = 0 THEN 0 ELSE ISNULL(dd.Interes,0) / pp.minimum END pInteres) pt

	OUTER APPLY (SELECT CAST(pt.pGasto * at.moneyInAmount AS DECIMAL(18,2)) AS gastos_de,
						CAST(pt.pInteres * at.moneyInAmount AS DECIMAL(18,2)) AS interes) AS montosNoGravables
	OUTER APPLY (SELECT CAST(
						(at.moneyInAmount - COALESCE(montosNoGravables.gastos_de, 0) - COALESCE(montosNoGravables.interes, 0)) / 1.05
						AS DECIMAL(18,2)) AS primaBase) AS baseImpuesto
	OUTER APPLY (SELECT
						CAST(
							at.moneyInAmount
							- COALESCE(montosNoGravables.gastos_de, 0)
							- COALESCE(montosNoGravables.interes, 0)
							- ROUND(baseImpuesto.primaBase * 0.05, 2)
							AS DECIMAL(18,2)) AS primas,
						CAST(ROUND(baseImpuesto.primaBase * 0.05, 2) AS DECIMAL(18,2)) AS impuesto,
						COALESCE(montosNoGravables.gastos_de, 0) AS gastos_de,
						COALESCE(montosNoGravables.interes, 0) AS interes) AS montos
WHERE t.id = @transferId
