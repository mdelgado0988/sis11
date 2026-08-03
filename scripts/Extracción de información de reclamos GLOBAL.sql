USE SISGLOBAL_AG01

go

;WITH UltimosSiniestros AS
(
    SELECT TOP (50)
        s.*
    FROM dbo.MSiniestros AS s
    WHERE EXISTS
    (
        SELECT 1
        FROM dbo.DReservas AS r
        WHERE r.NSiniestro = s.NSiniestro
    )
    AND EXISTS
    (
        SELECT 1
        FROM dbo.DPagosSin AS p
        WHERE p.NSiniestro = s.NSiniestro
    )
	AND EXISTS
    (
        SELECT 1
        FROM dbo.DGastoSin AS p
        WHERE p.NSiniestro = s.NSiniestro
    )
    ORDER BY
        s.Fingreso DESC,
        s.NSiniestro DESC
),
Reservas AS
(
    SELECT
        d.NSiniestro,
        STRING_AGG
        (
            CONVERT
            (
                VARCHAR(MAX),
                'Reserva Id => ' + CONVERT(VARCHAR(30), d.IDReserva)
                + ' - Monto: '
                + CONVERT(VARCHAR(30), CAST(d.Reserva AS DECIMAL(18, 2)))
            ),
            ' | '
        ) WITHIN GROUP (ORDER BY d.IDReserva) AS DetalleReservas
    FROM dbo.DReservas AS d
    INNER JOIN UltimosSiniestros AS s
        ON s.NSiniestro = d.NSiniestro
    GROUP BY d.NSiniestro
),
Pagos AS
(
    SELECT
        d.NSiniestro,
        STRING_AGG
        (
            CONVERT
            (
                VARCHAR(MAX),
                'Pago Id => ' + CONVERT(VARCHAR(30), d.IDPago)
                + ' - Monto: '
                + CONVERT(VARCHAR(30), CAST(d.Pago AS DECIMAL(18, 2)))
            ),
            ' | '
        ) WITHIN GROUP (ORDER BY d.IDPago) AS DetallePagos
    FROM dbo.DPagosSin AS d
    INNER JOIN UltimosSiniestros AS s
        ON s.NSiniestro = d.NSiniestro
    GROUP BY d.NSiniestro
),
Gastos AS
(
    SELECT
        d.NSiniestro,
        STRING_AGG
        (
            CONVERT
            (
                VARCHAR(MAX),
                'Gasto Id => ' + CONVERT(VARCHAR(30), d.IDGasto)
                + ' - Monto: '
                + CONVERT(VARCHAR(30), CAST(d.Gasto AS DECIMAL(18, 2)))
            ),
            ' | '
        ) WITHIN GROUP (ORDER BY d.IDGasto) AS DetalleGastos
    FROM dbo.DGastoSin AS d
    INNER JOIN UltimosSiniestros AS s
        ON s.NSiniestro = d.NSiniestro
    GROUP BY d.NSiniestro
)
SELECT
    s.NSiniestro AS [Número de siniestro],
    s.csinies_ref AS [Siniestro relacionado],

    s.Fingreso AS [Fecha ingreso],
    s.FNotificacion AS [Fecha notificación],
    s.FSiniestro AS [Fecha siniestro],
    s.Hora AS [Hora],

    s.numepoli AS [Número póliza],
    s.numecerti AS [Certificado],
    s.numereci AS [Recibo],
    s.nano AS [Año póliza],

    s.cdgoramo AS [Código ramo],
    LTRIM(RTRIM(ram.xdescripcion_l)) AS [Ramo],

    s.cplan AS [Código plan],
    LTRIM(RTRIM(pln.xplan)) AS [Plan],

    s.cdgosucu AS [Código sucursal],
    LTRIM(RTRIM(suc.xdescripcion_l)) AS [Sucursal],

    s.StatSin AS [Código estado],
    LTRIM(RTRIM(estSin.xdescripcion_l)) AS [Estado siniestro],

    s.ajustador AS [Código ajustador],
    LTRIM(RTRIM(aju.xcliente)) AS [Ajustador],

    s.cdgocaus AS [Código causa],
    LTRIM(RTRIM(cau.xcausa)) AS [Causa],

    s.numecedu_ase AS [Código asegurado],
    LTRIM(RTRIM(aseg.xcliente)) AS [Asegurado],

    adp.ctenedor AS [Código contratante],
    LTRIM(RTRIM(contr.xcliente)) AS [Contratante],

    s.cdgoPais AS [Código país],
    LTRIM(RTRIM(pai.xdescripcion_l)) AS [País],

    s.cdgociu1 AS [Código ciudad],
    LTRIM(RTRIM(ciudad.xdescripcion_l)) AS [Ciudad],

    s.cdgoest1 AS [Código provincia],
    LTRIM(RTRIM(prov.xdescripcion_l)) AS [Provincia],

    LTRIM(RTRIM(s.Lugar)) AS [Lugar],
    LTRIM(RTRIM(s.tipocober)) AS [Cobertura afectada],

    LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), s.DescripcionSiniestro)))
        AS [Descripción del siniestro],

    LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), s.Observaciones)))
        AS [Observaciones],

    s.Culpabilidad AS [Culpabilidad],
    s.PosibleRecupero AS [Posible recupero],
    s.PT AS [Pérdida total],
    s.TipoPerdidaTotal AS [Tipo pérdida total],

    s.Reservado AS [Total reservado],
    s.Pagado AS [Total pagado],
    s.Gastado AS [Total gastos],
    s.Recuperaciones AS [Total recuperaciones],
    s.SaldoReserva AS [Saldo reserva],

    r.DetalleReservas AS [Detalle reservas],
    p.DetallePagos AS [Detalle pagos],
    g.DetalleGastos AS [Detalle gastos]

FROM UltimosSiniestros AS s

LEFT JOIN dbo.adpoliza AS adp
    ON adp.cpoliza = s.cpoliza
   AND adp.fanopol = s.fanopol
   AND adp.fmespol = s.fmespol

LEFT JOIN dbo.maramos AS ram
    ON ram.cramo = s.cdgoramo

LEFT JOIN dbo.maplanes AS pln
    ON pln.cramo = s.cdgoramo
   AND pln.cplan = s.cplan

LEFT JOIN dbo.masucur AS suc
    ON suc.csucur = s.cdgosucu

LEFT JOIN dbo.macodigos AS estSin
    ON estSin.xsinonimo = 'statsin'
   AND estSin.ccodigo = s.StatSin

LEFT JOIN dbo.macausasin AS cau
    ON cau.cramo = s.cdgoramo
   AND cau.ccausa = s.cdgocaus

LEFT JOIN dbo.maentes AS aju
    ON aju.cci_rif = s.ajustador

LEFT JOIN dbo.maentes AS aseg
    ON aseg.cci_rif = s.numecedu_ase

LEFT JOIN dbo.maentes AS contr
    ON contr.cci_rif = adp.ctenedor

LEFT JOIN dbo.mapaises AS pai
    ON pai.cpais = s.cdgoPais

LEFT JOIN dbo.maciudades AS ciudad
    ON ciudad.cpais = s.cdgoPais
   AND ciudad.cciudad = TRY_CONVERT(INT, s.cdgociu1)
   AND ciudad.cestado = TRY_CONVERT(INT, s.cdgoest1)

LEFT JOIN dbo.maestados AS prov
    ON prov.cpais = s.cdgoPais
   AND prov.cestado = TRY_CONVERT(INT, s.cdgoest1)

LEFT JOIN Reservas AS r
    ON r.NSiniestro = s.NSiniestro

LEFT JOIN Pagos AS p
    ON p.NSiniestro = s.NSiniestro

LEFT JOIN Gastos AS g
    ON g.NSiniestro = s.NSiniestro

ORDER BY
    s.Fingreso DESC,
    s.NSiniestro DESC;
