use sis11

go

declare @transferId varchar(50) = '455';

SELECT 
    t.id TransferId,
    CASE WHEN pol.id IS NULL THEN
        ISNULL((SELECT TOP 1 JSON_VALUE(value, '$.userData[0]') 
        FROM OPENJSON(jIncomeTypeForm) 
        WHERE JSON_VALUE(value, '$.name') = 'pagador'), '')
    ELSE
    ISNULL(h.name,'') + ' ' + ISNULL(h.surname1, '') + ' ' + ISNULL(h.surname2, '') 
    END AS asegurado,


    t.amount AS monto_transaccion,
    'CONVERTIR_A_LETRAS(' + CAST(at.moneyInAmount AS VARCHAR) + ')' AS monto_en_letras,
    ISNULL(tc.name, 'Pago de Prima') AS concepto_pago,
    ISNULL(pol.fiscalNumber, 'S/N') AS nro_factura,
    pol.code AS nro_póliza,
    IsNULL(pp.numberInYear,0) AS nro_cuota,
    '' AS o_pagos,
    montos.primas + (tt.total - at.moneyInAmount) primas,
	montos.gastos_de,
	montos.impuesto,
    montos.interes,
    tt.total + (tt.total - at.moneyInAmount) AS total
	,at.moneyInAmount montoPagadoCuota
	,pt.*
	,ad.supplementaryAmount [Transito]

FROM transfer AS t 
	LEFT JOIN allocationInstallment at ON at.allocationId = t.allocationId
	LEFT JOIN Allocation ad ON ad.id = at.allocationId
    LEFT JOIN lifePolicy AS pol ON at.lifePolicyId = pol.id 
    LEFT JOIN PayPlan AS pp ON at.payPlanId = pp.id 
    LEFT JOIN Contact AS h ON pol.holderId = h.Id
    LEFT JOIN IncomeTypeCatalog tc ON tc.code = t.incomeType	
	OUTER APPLY (SELECT SUM(CASE WHEN pd.detail LIKE '%Prima%' THEN pd.amount ELSE 0 END) Prima
						, SUM(CASE WHEN pd.detail LIKE '%Impuesto%' THEN pd.amount ELSE 0 END) Impuesto
						, SUM(CASE WHEN pd.detail LIKE '%Gasto%' THEN pd.amount ELSE 0 END) Gasto
						, SUM(CASE WHEN pd.detail LIKE '%Interes%' THEN pd.amount ELSE 0 END) Interes
				 FROM PayPlanDetail pd 
				 WHERE pd.payPlanId = pp.id) dd

	OUTER APPLY (SELECT dd.Prima / pp.minimum pPrima
						, dd.Impuesto / pp.minimum pImpuesto
						, dd.Gasto / pp.minimum pGasto
						, dd.Interes / pp.minimum pInteres) pt

	OUTER APPLY (SELECT CAST(pt.pPrima * at.moneyInAmount AS DECIMAL(18,2)) AS primas,
						CAST(pt.pImpuesto * at.moneyInAmount AS DECIMAL(18,2)) AS impuesto,
						CAST(pt.pGasto * at.moneyInAmount AS DECIMAL(18,2)) AS gastos_de,
						CAST(pt.pInteres * at.moneyInAmount AS DECIMAL(18,2)) AS interes) AS montos
	OUTER APPLY (SELECT (montos.primas + montos.impuesto + montos.interes + montos.gastos_de) total) tt
WHERE t.id = (select top 1 value from STRING_SPLIT(@transferId,','))

