USE sis11
GO

--Nuevas
;WITH caja AS (
    SELECT TOP (1) id
    FROM [dbo].[TransferWorkspace]
    WHERE closed = 0
      AND [user] = 'michael.delgado@axxis-systems.com'
    ORDER BY 1 DESC
),
cte AS (
    SELECT
        caja.id AS Id_Caja,
        pol.id AS policyId,
        pol.code AS Codigo_Poliza,
        pol.holderId AS ID_Cliente,
        pol.fiscalNumber AS Numero_Recibo,
        CAST(p.minimum AS decimal(18,2)) AS Monto_Pago,
        p.dueDate,
        ROW_NUMBER() OVER (
            PARTITION BY pol.id 
            ORDER BY p.dueDate ASC
        ) AS rn
    FROM caja
    CROSS JOIN LifePolicy pol
    INNER JOIN PayPlan p 
        ON pol.id = p.lifePolicyId 
       AND ISNULL(p.changeId,0) = 0 
       AND p.cancellationDate IS NULL
    WHERE p.payed = 0
      AND p.minimum > 0
      AND pol.activeDate IS NOT NULL
      AND pol.active = 1
      AND pol.fiscalNumber IS NOT NULL
)

SELECT TOP (20)
    Id_Caja,
    Codigo_Poliza,
    ID_Cliente,
    Numero_Recibo,
    Monto_Pago
FROM cte
WHERE rn = 1
ORDER BY dueDate ASC, Codigo_Poliza;

--endosos
;WITH caja AS (SELECT TOP (1) id
FROM [dbo].[TransferWorkspace]
WHERE closed = 0
AND [user] = 'michael.delgado@axxis-systems.com'
ORDER BY 1 DESC)
SELECT TOP (10) caja.id Id_Caja, pol.code Codigo_Poliza , pol.holderId ID_Cliente, b.fiscalNumber Numero_Recibo, CAST(p.minimum AS decimal(18,2)) Monto_Pago
FROM caja
CROSS JOIN LifePolicy pol
INNER JOIN [Change] c ON c.lifePolicyId = pol.id
INNER JOIN bill b ON b.changeId = c.id
INNER JOIN PayPlan p ON pol.id = p.lifePolicyId AND p.changeId = b.changeId AND p.cancellationDate IS NULL
WHERE p.payed = 0
AND minimum > 0
AND b.fiscalNumber IS NOT NULL
AND pol.activeDate IS NOT NULL
AND pol.active = 1
ORDER BY p.dueDate, pol.code

