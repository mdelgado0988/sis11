use sis11
go

DECLARE @Fini DATE = '20260801'
DECLARE @Ffin DATE = '20260810'
DECLARE @lob VARCHAR(50) = '0'
DECLARE @cajero VARCHAR(500) = 'michael.delgado@axxis-systems.com'
DECLARE @asegurado VARCHAR(500) = ''

SELECT
    ROW_NUMBER() OVER(ORDER BY t.id) AS [Id],
    ISNULL(us.nombre, t.[user]) AS [Cajero],
    pay.fiscalNumber AS [No. Recibo],
    t.id AS [Id Trasnferencia],
    pay.cramo AS [cramo],
    pay.ramo AS [Ramo],
    pay.numeroPoliza AS [Numero Poliza],
    pay.asegurado AS [Asegurado],
    CONVERT(VARCHAR(10), DATEADD(HOUR, -5, t.[date]), 103) AS [Fecha de Cobro],
    ISNULL(pay.primaPagado, 0) AS [Prima Pagado],
    ISNULL(pay.impuestos, 0) AS [Impuestos],
    ISNULL(pay.gastos, 0) AS [Gastos],
    ISNULL(t.amount, 0) AS [Monto Cobrado],
    CASE
        WHEN t.concept = 'IW' THEN 'Pago de Prima'
        WHEN t.concept LIKE 'IW %' THEN STUFF(t.concept, 1, 2, 'Pago de Prima')
        ELSE CASE WHEN ISNULL(t.concept, '') = '' THEN ISNULL(itc.[name],'') ELSE ISNULL(t.concept, '') END
    END AS [Descripcion]
FROM dbo.[Transfer] t
LEFT JOIN dbo.IncomeTypeCatalog itc
    ON itc.code = t.incomeType
LEFT JOIN [Usr] us ON us.email = t.[user]
OUTER APPLY
(
    SELECT
        MAX(lp.fiscalNumber) AS fiscalNumber,
        MAX(
            CASE
                WHEN lp.active = 1 THEN 'Activa'
                ELSE 'Inactiva'
            END
        ) AS estadoCuenta,
        MAX(lp.lob) AS cramo,
        MAX(lobCatalog.[name]) AS ramo,
        MAX(lp.code) AS numeroPoliza,
        MAX(
            CASE
                WHEN c.isPerson = 1
                    THEN CONCAT_WS(' ', c.[name], c.surname1, c.surname2)
                ELSE c.surname2
            END
        ) AS asegurado,

        SUM(
            CAST(
                CASE
                    WHEN NULLIF(pp.minimum, 0) IS NULL
                        OR NULLIF(ppd.amount, 0) IS NULL
                        THEN ISNULL(lp.anualPremium / NULLIF(lp.anualTotal, 0), 0)
                    ELSE ISNULL(ppd.amount, 0) / NULLIF(pp.minimum, 0)
                END
                * ISNULL(ai.moneyInAmount, 0)
                AS DECIMAL(18, 2)
            )
        ) AS primaPagado,

        SUM(
            CAST(
                CASE
                    WHEN NULLIF(pp.minimum, 0) IS NULL
                        OR NULLIF(ppd.amount, 0) IS NULL
                        THEN ISNULL(lp.anualPremium / NULLIF(lp.anualTotal, 0), 0)
                    ELSE ISNULL(ppd.amount, 0) / NULLIF(pp.minimum, 0)
                END
                * ISNULL(ai.moneyInAmount, 0)
                * 0.05
                AS DECIMAL(18, 2)
            )
        ) AS impuestos,

        CAST(0 AS DECIMAL(18, 2)) AS gastos
    FROM dbo.Allocation a
    INNER JOIN dbo.AllocationInstallment ai
        ON ai.allocationId = a.id
    LEFT JOIN dbo.LifePolicy lp
        ON lp.id = ai.lifePolicyId
    LEFT JOIN dbo.PayPlan pp
        ON pp.id = ai.payPlanId
    LEFT JOIN dbo.PayPlanDetail ppd
        ON ppd.payPlanId = pp.id
       AND ppd.detail LIKE 'Prima%'
    LEFT JOIN dbo.Contact c
        ON c.id = lp.holderId
    LEFT JOIN dbo.Lob lobCatalog
        ON lobCatalog.code = lp.lob
    WHERE a.id = t.allocationId
) pay
WHERE t.executed = 1
  AND t.isExternal = 1
  AND t.allocationId IS NOT NULL
  AND CAST(DATEADD(HOUR, -5, t.[date]) AS DATE) BETWEEN @Fini AND @Ffin
  AND (
        NULLIF(NULLIF(LTRIM(RTRIM(@lob)), ''), '0') IS NULL
        OR pay.cramo = LTRIM(RTRIM(@lob))
      )
  AND (
        NULLIF(LTRIM(RTRIM(@cajero)), '') IS NULL
        OR t.[user] = LTRIM(RTRIM(@cajero))
      )
  AND (
        NULLIF(LTRIM(RTRIM(@asegurado)), '') IS NULL
        OR pay.asegurado LIKE '%' + LTRIM(RTRIM(@asegurado)) + '%'
      )
