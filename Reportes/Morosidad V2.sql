use sis11
go

DECLARE  @Fecha DATE = '20260501'
		,@ramo varchar(50) = null
		,@producto varchar(50) = null,
		@poliza varchar(50) = null,
		@holder varchar(50) = null

SELECT 

    ROW_NUMBER() OVER (ORDER BY p.code) AS Id,
    ISNULL(p.fiscalNumber, 0) AS Recibo,
    p.code AS [Póliza],
    0 AS Ref_Banco,
    pr.name AS Ramo,
    p.commercial AS [Plan],
    CONVERT(VARCHAR,p.created,103) AS [F. Ingreso],
    CONVERT(VARCHAR,p.[start],103) AS Desde,
    CONVERT(VARCHAR,p.[end],103)   AS Hasta,
    p.holderId AS [Cod. Tenedor],
    c.id [Id Cliente],
    ISNULL(c.nationalId,'0') AS Cobis,

    CASE
        WHEN c.isPerson = 1 THEN CONCAT_WS(' ', c.name, c.surname1, c.surname2)
        ELSE c.surname2
    END AS Cliente,

    CASE WHEN c.isPerson = 1 THEN ISNULL(c.cnp, '0') ELSE '0' END AS [IDENTIDAD PERSONAL],
    CASE WHEN c.isPerson = 0 THEN ISNULL(c.nif, '0') ELSE '0' END AS RUC,
    CASE WHEN c.isPerson = 1 THEN 'NATURAL' ELSE 'JURIDICA' END AS [TIPO PERSONA],
    [cuota].Cuotas,
	ISNULL(pm.name, '') AS [Forma cobro],

    CASE
        WHEN LOWER(ISNULL(p.periodicity,'')) = 'a' THEN 'Anual'
        WHEN LOWER(ISNULL(p.periodicity,'')) = 'y' THEN 'Anual'
        WHEN LOWER(ISNULL(p.periodicity,'')) = 'm' THEN 'Mensual'
        WHEN LOWER(ISNULL(p.periodicity,'')) = 'q' THEN 'Trimestral'
        WHEN LOWER(ISNULL(p.periodicity,'')) = 's' THEN 'Semestral'
        WHEN LOWER(ISNULL(p.periodicity,'')) = 'b' THEN 'Bimensual'
        ELSE ''
    END AS frecuencia,

    ISNULL(oa.NumeroPrestamo,'0') AS Prestamo,
	ISNULL(oa.NumeroFinca,'0') AS Finca,
    ISNULL(s.Facturado, 0) AS Facturado,
    ISNULL([s].Pagado, 0)    AS Pagado,
    ISNULL([s].Pendiente, 0) AS Pendiente,
    ISNULL([s].Corriente, 0) AS Corriente,
    ISNULL([s].[30-60], 0)   AS [30-60],
    ISNULL([s].[60-90], 0)   AS [60-90],
    ISNULL([s].[90-120], 0)  AS [90-120],
    ISNULL([s].[120], 0)     AS [120],
    ISNULL([s].[Por vencer], 0) AS [Por vencer],
    ISNULL([s].[Vencido], 0)    AS [Vencido],
	s.FechaPago [Fecha Último Pago],
	ISNULL(DATEDIFF(DAY, s.FMaxVence, GETDATE()),0) [Dias Vencidos],
    p.branchCode AS [Codigo Ramo],
    CASE WHEN p.active = 1 THEN 'V' ELSE 'I' END AS Estatus,
    0 AS [Tipo Operacion],
    ISNULL(
        CASE
            WHEN ac.isPerson = 1 THEN CONCAT_WS(' ', ac.name, ac.surname1, ac.surname2)
            WHEN ac.id IS NULL THEN 'No Tiene'
            ELSE ac.surname2
        END,
    'No Tiene') AS Acredor,
	ISNULL(
        CASE
            WHEN sl.isPerson = 1 THEN CONCAT_WS(' ', sl.name, sl.surname1, sl.surname2)
            WHEN sl.id IS NULL THEN 'No Tiene'
            ELSE sl.surname2
        END,
    'No Tiene') AS Corredor,
    0 AS Descuento

FROM LifePolicy p
INNER JOIN Product pr ON pr.code = p.productCode
INNER JOIN Contact c  ON c.id = p.holderId
LEFT JOIN Contact ac ON ac.id = p.cessionBeneficiary
LEFT JOIN Contact sl ON sl.id = p.sellerId

OUTER APPLY (
    SELECT
        CONCAT_WS('/',
            (SELECT TOP (1) pp2.numberInYear
             FROM PayPlan pp2
             WHERE pp2.lifePolicyId = p.id
               AND pp2.dueDate <= @Fecha
             ORDER BY pp2.dueDate DESC, pp2.id DESC),
            CAST((SELECT COUNT(1)
                  FROM PayPlan pp3
                  WHERE pp3.lifePolicyId = p.id) AS VARCHAR(10))
        ) AS Cuotas
) AS [cuota]

OUTER APPLY (SELECT TOP (1) 1 Tiene
			 FROM PayPlan pl
			 WHERE pl.lifePolicyId = p.id
			 AND pl.payed = 0 AND pl.minimum > 0) tpl

LEFT JOIN PaymentMethodCatalog pm ON pm.code = p.paymentMethod


OUTER APPLY (
    SELECT
        SUM(ISNULL(NULLIF(pp.expected,0), pp.minimum)) AS Facturado,
		
        SUM(ISNULL(pp.payed,0)) AS Pagado,
		CONVERT(VARCHAR,MAX(pp.payedDate),103) AS FechaPago,

		MAX(CASE
              WHEN pp.dueDate <= @Fecha AND ISNULL(pp.payed, 0) < ISNULL(NULLIF(pp.expected, 0), pp.minimum)
              THEN pp.dueDate
              ELSE null
        END) AS FMaxVence,

        SUM(ISNULL(NULLIF(pp.expected,0), pp.minimum) - ISNULL(pp.payed,0)) AS Pendiente,

        SUM(CASE
              WHEN pp.dueDate <= @Fecha
               AND DATEDIFF(DAY, pp.dueDate, @Fecha) BETWEEN 1 AND 30
               AND ISNULL(pp.payed, 0) < ISNULL(NULLIF(pp.expected, 0), pp.minimum)
              THEN (ISNULL(NULLIF(pp.expected,0), pp.minimum) - ISNULL(pp.payed,0))
              ELSE 0
        END) AS Corriente,

        SUM(CASE
              WHEN pp.dueDate <= @Fecha
               AND DATEDIFF(DAY, pp.dueDate, @Fecha) BETWEEN 31 AND 60
               AND ISNULL(pp.payed, 0) < ISNULL(NULLIF(pp.expected, 0), pp.minimum)
              THEN (ISNULL(NULLIF(pp.expected,0), pp.minimum) - ISNULL(pp.payed,0))
              ELSE 0
        END) AS [30-60],

        SUM(CASE
              WHEN pp.dueDate <= @Fecha
               AND DATEDIFF(DAY, pp.dueDate, @Fecha) BETWEEN 61 AND 90
               AND ISNULL(pp.payed, 0) < ISNULL(NULLIF(pp.expected, 0), pp.minimum)
              THEN (ISNULL(NULLIF(pp.expected,0), pp.minimum) - ISNULL(pp.payed,0))
              ELSE 0
        END) AS [60-90],

        SUM(CASE
              WHEN pp.dueDate <= @Fecha
               AND DATEDIFF(DAY, pp.dueDate, @Fecha) BETWEEN 91 AND 120
               AND ISNULL(pp.payed, 0) < ISNULL(NULLIF(pp.expected, 0), pp.minimum)
              THEN (ISNULL(NULLIF(pp.expected,0), pp.minimum) - ISNULL(pp.payed,0))
              ELSE 0
        END) AS [90-120],

        SUM(CASE
              WHEN pp.dueDate <= @Fecha
               AND DATEDIFF(DAY, pp.dueDate, @Fecha) > 120
               AND ISNULL(pp.payed, 0) < ISNULL(NULLIF(pp.expected, 0), pp.minimum)
              THEN (ISNULL(NULLIF(pp.expected,0), pp.minimum) - ISNULL(pp.payed,0))
              ELSE 0
        END) AS [120],

        SUM(CASE
              WHEN pp.dueDate > @Fecha
               AND ISNULL(pp.payed, 0) < ISNULL(NULLIF(pp.expected, 0), pp.minimum)
              THEN (ISNULL(NULLIF(pp.expected,0), pp.minimum) - ISNULL(pp.payed,0))
              ELSE 0
        END) AS [Por vencer],

        SUM(CASE
              WHEN pp.dueDate <= @Fecha
               AND ISNULL(pp.payed, 0) < ISNULL(NULLIF(pp.expected, 0), pp.minimum)
              THEN (ISNULL(NULLIF(pp.expected,0), pp.minimum) - ISNULL(pp.payed,0))
              ELSE 0
        END) AS [Vencido]

    FROM PayPlan pp
    WHERE pp.lifePolicyId = p.id
) AS [s]

/*-- Objeto Asegurado */
OUTER APPLY (
    SELECT TOP (1)
        MAX(CASE 
                WHEN JSON_VALUE(component.value, '$.name') = 'txtFinca'
                THEN JSON_VALUE(component.value, '$.userData[0]')
            END) AS NumeroFinca,

        MAX(CASE 
                WHEN JSON_VALUE(component.value, '$.name') = 'txtNoPrestamo'
                THEN JSON_VALUE(component.value, '$.userData[0]')
            END) AS NumeroPrestamo
    FROM insuredObject io
    CROSS APPLY OPENJSON(
        CASE 
            WHEN ISJSON(io.jValues) = 1 THEN io.jValues
            ELSE '[]'
        END
    ) component
    WHERE io.lifePolicyId = p.id
      AND ISJSON(component.value) = 1
      AND JSON_VALUE(component.value, '$.name') IN ('txtFinca', 'txtNoPrestamo')
) oa

WHERE
    @Fecha BETWEEN p.[start] AND p.[end]
    AND (@ramo IS NULL OR p.lob = @ramo)
    AND (@poliza IS NULL OR p.code = @poliza)
    AND (@producto IS NULL OR p.productCode = @producto)
    AND (@holder IS NULL OR p.holderId = @holder)
	AND (CASE WHEN p.active = 1 THEN 1 ELSE ISNULL(tpl.Tiene,0) END) = 1
	AND activeDate IS NOT NULL
	AND ISNULL([s].Pendiente, 0) <> 0

ORDER BY p.code;