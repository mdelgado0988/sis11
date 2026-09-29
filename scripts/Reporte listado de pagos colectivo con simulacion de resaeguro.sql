USE GlobalSIS_AG01

go

SELECT top (1)
    MS.cproces AS CODIGO,
    MS.cdgoramo AS 'cramo',
    MS.Ramo,
    MS.numepoli AS 'POLIZA',
    MS.numecedu_ase AS 'COBIS',
    MS.Asegurado AS 'CLIENTE',
    MS.xacreedor AS 'ACREEDOR',
    CONVERT(NVARCHAR, MS.fdesde, 103) AS 'FDESDE Poliza',
    CONVERT(NVARCHAR, MS.fhasta, 103) AS 'FHASTA Poliza',
    MS.NSiniestro AS 'NSINIESTRO',
    CONVERT(NVARCHAR, FSiniestro, 103) AS 'FSINIESTRO',

    (
        SELECT xdescripcion_l
        FROM dbo.macodigos
        WHERE xsinonimo = 'statsin'
          AND ccodigo = MS.StatSin
    ) AS Estado,

    'RESERVA' = ISNULL(
        (
            SELECT SUM(ISNULL(RE.Reserva, 0))
            FROM SisGlobal_AG01..DReservas RE
            WHERE RE.NSiniestro = MS.NSiniestro
              AND RE.catres IN (1, 2)
              AND RE.Serie = (
                  CASE
                      WHEN PG.Solicitud > 0 THEN PG.Serie
                      ELSE GT.Serie
                  END
              )
        ),
        0
    ),

    'R. PAGO' = ISNULL(
        (
            SELECT SUM(ISNULL(RE.Reserva, 0))
            FROM SisGlobal_AG01..DReservas RE
            WHERE RE.NSiniestro = MS.NSiniestro
              AND RE.catres = 1
              AND RE.Serie = PG.Serie
        ),
        0
    ),

    'R. GASTO' = ISNULL(
        (
            SELECT SUM(ISNULL(RE.Reserva, 0))
            FROM SisGlobal_AG01..DReservas RE
            WHERE RE.NSiniestro = MS.NSiniestro
              AND RE.catres = 2
              AND RE.Serie = GT.Serie
        ),
        0
    ),

    SOLI.numesoli AS 'SOLICITUD',
    CONVERT(NVARCHAR, SOLI.fingreso, 103) AS FSOLICITUD,

    (
        SELECT mc.xdescripcion_l
        FROM dbo.macodigos mc
        WHERE mc.xsinonimo = 'statsoli'
          AND mc.ccodigo = SOLI.statsoli
    ) AS ESTADOSOL,

    CASE
        WHEN SOLI.statsoli = 'U'
        THEN (
            SELECT TOP (1) uso.nuevonro
            FROM SisGlobal_AG01..usolicit uso
            WHERE uso.numesoli = SOLI.numesoli
              AND uso.statreg NOT IN ('R')
        )
        ELSE 0
    END AS NOFUSION,

    SOLI.xbeneficiario + ' ' + SOLI.xbenadic AS 'BENEFICIARIO',
    SOLI.mnto_ded AS 'DEDUCCION',
    SOLI.mnto_cheque AS 'MONTO_NETO',
    SOLI.concepto AS 'CONCEPTO',

    ISNULL(
        CONVERT(VARCHAR, SOLI.fingreso, 103),
        ''
    ) AS 'Fecha de pago',

    CASE
        WHEN PG.Solicitud > 0 THEN PG.Serie
        ELSE GT.Serie
    END AS 'NOCOBERTURA',

    (
        SELECT UPPER(MACOB.xdescripcion_l)
        FROM GlobalSIS_AG01..macoberturas MACOB
        WHERE CAST(MACOB.ccobertura AS INT) = (
            CASE
                WHEN PG.Solicitud > 0 THEN PG.Serie
                ELSE GT.Serie
            END
        )
        AND MACOB.cramo = MS.cdgoramo
    ) AS XCOBERTURA,

    (
        SELECT SUM(adp.msumaaseg)
        FROM GlobalSIS_AG01..adpolcob adp
        WHERE adp.cproces = MS.cproces
          AND CAST(adp.ccober AS INT) = (
              CASE
                  WHEN PG.Solicitud > 0 THEN PG.Serie
                  ELSE GT.Serie
              END
          )
    ) AS 'SUMAASEGURADA',

    ISNULL(
        (
            SELECT TOP (1) co.cserie
            FROM contratos co
            WHERE co.ccontrea =
                CASE
                    WHEN MS.cdgoramo = 20
                         AND MS.cplan = 'vid-desemp'
                        THEN 12
                    WHEN MS.cdgoramo = 52
                         AND MS.cplan = 'FRAUDE'
                        THEN 9
                END
              AND PG.fecha BETWEEN co.fdesde AND co.fhasta
        ),
        ''
    ) AS serie,

    ISNULL(
        (
            SELECT TOP (1)
                SUBSTRING(
                    MSUMA,
                    CHARINDEX('*', MSUMA) + 1,
                    10
                )
            FROM contratos co
            WHERE co.ccontrea =
                CASE
                    WHEN MS.cdgoramo = 20
                         AND MS.cplan = 'vid-desemp'
                        THEN 12
                    WHEN MS.cdgoramo = 52
                         AND MS.cplan = 'FRAUDE'
                        THEN 9
                END
              AND PG.fecha BETWEEN co.fdesde AND co.fhasta
              AND co.itipocont = 'RET'
        ),
        0
    ) AS ret,

    ISNULL(
        (
            SELECT TOP (1)
                SUBSTRING(
                    MSUMA,
                    CHARINDEX('*', MSUMA) + 1,
                    10
                )
            FROM contratos co
            WHERE co.ccontrea =
                CASE
                    WHEN MS.cdgoramo = 20
                         AND MS.cplan = 'vid-desemp'
                        THEN 12
                    WHEN MS.cdgoramo = 52
                         AND MS.cplan = 'FRAUDE'
                        THEN 9
                END
              AND PG.fecha BETWEEN co.fdesde AND co.fhasta
              AND co.itipocont = 'CP'
        ),
        0
    ) AS cp,

    CASE
        WHEN SOLI.mnto_pago >= MS.prioridad
             AND MS.prioridad > 0
        THEN
            MS.prioridad *
            ISNULL(
                (
                    SELECT TOP (1)
                        SUBSTRING(
                            MSUMA,
                            CHARINDEX('*', MSUMA) + 1,
                            10
                        )
                    FROM contratos co
                    WHERE co.ccontrea =
                        CASE
                            WHEN MS.cdgoramo = 20
                                 AND MS.cplan = 'vid-desemp'
                                THEN 12
                            WHEN MS.cdgoramo = 52
                                 AND MS.cplan = 'FRAUDE'
                                THEN 9
                        END
                      AND PG.fecha BETWEEN co.fdesde AND co.fhasta
                      AND co.itipocont = 'RET'
                ),
                0
            )
        ELSE
            SOLI.mnto_pago *
            ISNULL(
                (
                    SELECT TOP (1)
                        SUBSTRING(
                            MSUMA,
                            CHARINDEX('*', MSUMA) + 1,
                            10
                        )
                    FROM contratos co
                    WHERE co.ccontrea =
                        CASE
                            WHEN MS.cdgoramo = 20
                                 AND MS.cplan = 'vid-desemp'
                                THEN 12
                            WHEN MS.cdgoramo = 52
                                 AND MS.cplan = 'FRAUDE'
                                THEN 9
                        END
                      AND PG.fecha BETWEEN co.fdesde AND co.fhasta
                      AND co.itipocont = 'RET'
                ),
                0
            )
    END AS 'Monto Retencion',

    CASE
        WHEN SOLI.mnto_pago >= MS.prioridad
             AND MS.prioridad > 0
        THEN
            MS.prioridad *
            ISNULL(
                (
                    SELECT TOP (1)
                        SUBSTRING(
                            MSUMA,
                            CHARINDEX('*', MSUMA) + 1,
                            10
                        )
                    FROM contratos co
                    WHERE co.ccontrea =
                        CASE
                            WHEN MS.cdgoramo = 20
                                 AND MS.cplan = 'vid-desemp'
                                THEN 12
                            WHEN MS.cdgoramo = 52
                                 AND MS.cplan = 'FRAUDE'
                                THEN 9
                        END
                      AND PG.fecha BETWEEN co.fdesde AND co.fhasta
                      AND co.itipocont = 'CP'
                ),
                0
            )
        ELSE
            SOLI.mnto_pago *
            ISNULL(
                (
                    SELECT TOP (1)
                        SUBSTRING(
                            MSUMA,
                            CHARINDEX('*', MSUMA) + 1,
                            10
                        )
                    FROM contratos co
                    WHERE co.ccontrea =
                        CASE
                            WHEN MS.cdgoramo = 20
                                 AND MS.cplan = 'vid-desemp'
                                THEN 12
                            WHEN MS.cdgoramo = 52
                                 AND MS.cplan = 'FRAUDE'
                                THEN 9
                        END
                      AND PG.fecha BETWEEN co.fdesde AND co.fhasta
                      AND co.itipocont = 'CP'
                ),
                0
            )
    END AS 'Monto CP',

    CASE
        WHEN MS.Pagado >= MS.prioridad
             AND MS.prioridad > 0
             AND ISNULL(
                    (
                        SELECT TOP (1) co.cserie
                        FROM contratos co
                        WHERE co.ccontrea =
                            CASE
                                WHEN MS.cdgoramo = 20
                                     AND MS.cplan = 'vid-desemp'
                                    THEN 12
                                WHEN MS.cdgoramo = 52
                                     AND MS.cplan = 'FRAUDE'
                                    THEN 9
                            END
                          AND PG.fecha BETWEEN co.fdesde AND co.fhasta
                    ),
                    ''
                 ) <> 0
             AND NOT ISNULL(
                    (
                        SELECT TOP (1) co.cserie
                        FROM contratos co
                        WHERE co.ccontrea =
                            CASE
                                WHEN MS.cdgoramo = 20
                                     AND MS.cplan = 'vid-desemp'
                                    THEN 12
                                WHEN MS.cdgoramo = 52
                                     AND MS.cplan = 'FRAUDE'
                                    THEN 9
                            END
                          AND PG.fecha BETWEEN co.fdesde AND co.fhasta
                    ),
                    ''
                 ) IS NULL
        THEN MS.Pagado - MS.prioridad
        ELSE 0
    END AS 'Excedente'

FROM SisGlobal_AG01..dsolicit SOLI
INNER JOIN GlobalSIS_AG01..v_siniestro_colectivo MS
    ON MS.NSiniestro = SOLI.numesini
LEFT OUTER JOIN SisGlobal_AG01..wdsolicit WDSOL
    ON SOLI.numesoli = WDSOL.numesoli
LEFT OUTER JOIN SisGlobal_AG01..DPagosSin PG
    ON PG.Solicitud = SOLI.numesoli
LEFT OUTER JOIN SisGlobal_AG01..DGastoSin GT
    ON GT.Solicitud = SOLI.numesoli

WHERE ms.cdgoramo = 20 AND SOLI.statsoli NOT IN ('R', 'B')
    AND MS.NSiniestro > 0;
