USE sis11
go

DECLARE @Fecha DATE = GETDATE();

/*

Importe Pendiente
Prima Neta, Impuestos y Gastos (Desglosado).
Estado de Póliza
Vigente, Cancelada por falta de pago, En Gracia.

select top 10 * from payplan

*/

/* =========================================
   CONSULTA FINAL
   ========================================= */
SELECT 

	CASE WHEN c.isPerson = 1 THEN CONCAT_WS(' ', NULLIF(asec.name, ''), NULLIF(asec.middlename, ''), NULLIF(asec.surname1, ''), NULLIF(asec.surname2, '')) ELSE asec.surname2 END Asegurado,
	CASE WHEN c.isPerson = 1 THEN asec.cnp ELSE asec.nif END [Identificación Asegurado],

    p.code AS [Número de póliza],
	ISNULL(pp.changeId,0) [Endoso],

    FORMAT(p.[start], 'dd/MM/yyyy') AS [Desde],
    FORMAT(p.[end], 'dd/MM/yyyy') AS [Hasta],
	

	CONCAT(pp.numberInYear , ' / ', mc.numberInYear) [Cuotas],
	FORMAT(pp.dueDate, 'dd/MM/yyyy') [Fecha de Vencimiento],
	DATEDIFF(DAY, pp.dueDate, @Fecha) [Días Mora],

	(CASE WHEN DATEDIFF(DAY, pp.dueDate, @Fecha) BETWEEN 1 AND 30 THEN '1 - 30'
		  WHEN DATEDIFF(DAY, pp.dueDate, @Fecha) BETWEEN 31 AND 60 THEN '31 - 60'
		  WHEN DATEDIFF(DAY, pp.dueDate, @Fecha) BETWEEN 61 AND 90 THEN '61 - 90'
		  WHEN DATEDIFF(DAY, pp.dueDate, @Fecha) > 90 THEN '+90'
          WHEN DATEDIFF(DAY, pp.dueDate, @Fecha) < 1 THEN '0'
        ELSE '0'
    END) AS [Rango de mora],

    (p.anualPremium) AS [Prima Anual]
	   
FROM LifePolicy p
INNER JOIN Product pr ON p.productCode = pr.code
INNER JOIN Contact c ON p.holderId = c.id
LEFT JOIN insured ase ON ase.lifepolicyId = p.id
LEFT JOIN contact asec ON asec.id = ase.contactId
INNER JOIN PayPlan pp ON p.id = pp.lifePolicyId

OUTER APPLY(SELECT MAX(pp.numberInYear) numberInYear 
			FROM PayPlan pp 
			WHERE p.id = pp.lifePolicyId
			AND pp.payed = 0) mc

WHERE p.active = 1
  AND @Fecha BETWEEN p.[start] AND p.[end]
  AND pp.dueDate <= @Fecha
  AND DATEDIFF(DAY, pp.dueDate, @Fecha) > 30;


  --SELECT TOP 10 * FROM PayPlan
  --SELECT TOP 10 * FROM Transfer