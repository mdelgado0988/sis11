USE GlobalSIS_AG01;

DECLARE @Ramo INT = 1;

DROP TABLE IF EXISTS IncPolizas;
DROP TABLE IF EXISTS IncRecibos;
DROP TABLE IF EXISTS IncCoberturas;
DROP TABLE IF EXISTS IncReaseguro;

;WITH Polizas AS
(
    SELECT
        p.cpoliza,
        p.fanopol,
        p.fmespol,
        p.cnpoliza,
        LTRIM(RTRIM(p.cplan)) AS cplan,
        COUNT(e.cendoso) AS Movimientos
    FROM dbo.adpoliza AS p
    INNER JOIN dbo.maplanes AS pln
        ON pln.cramo = p.cramo
       AND LTRIM(RTRIM(pln.cplan)) = LTRIM(RTRIM(p.cplan))
    LEFT JOIN dbo.adrecibos AS e
        ON e.cpoliza = p.cpoliza
       AND e.fanopol = p.fanopol
       AND e.fmespol = p.fmespol
    WHERE p.cramo = @Ramo
    GROUP BY
        p.cpoliza,
        p.fanopol,
        p.fmespol,
        p.cnpoliza,
        p.cplan
),
PolizasOrdenadas AS
(
    SELECT
        *,
        ROW_NUMBER() OVER
        (
            PARTITION BY cplan
            ORDER BY Movimientos DESC,
                     cpoliza DESC,
                     fanopol DESC,
                     fmespol DESC
        ) AS Orden
    FROM Polizas
)
SELECT
    cpoliza,
    fanopol,
    fmespol,
    cnpoliza,
    cplan,
    Movimientos
INTO IncPolizas
FROM PolizasOrdenadas
WHERE Orden <= 2;

CREATE INDEX IX_IncPolizas
ON IncPolizas (cpoliza, fanopol, fmespol);

--select * from IncPolizas

SELECT DISTINCT
    r.crecibo,
    r.cproces,
    r.ccerti,

    p.cpoliza,
    p.fanopol,
    p.fmespol,
    p.cnpoliza,
    p.cplan,

    r.cramo,
    LTRIM(RTRIM(pln.xplan)) AS [Plan],
    LTRIM(RTRIM(ram.xdescripcion_l)) AS [Ramo],

    r.itiporec AS [Código tipo recibo],
    LTRIM(RTRIM(trec.xdescripcion_l)) AS [Tipo recibo],

    r.cmoneda AS [Código moneda],
    LTRIM(RTRIM(mon.xdescripcion_l)) AS [Moneda],

    r.femision AS [Fecha emisión],
    r.fdesde AS [Fecha inicio],
    r.fhasta AS [Fecha fin],

    r.mmontorec AS [Monto recibo],
    r.mpagado AS [Monto pagado],
    r.mpendiente AS [Monto pendiente],

    r.casegurado AS [Código asegurado],
    LTRIM(RTRIM(aseg.xcliente)) AS [Asegurado],

    r.ctenedor AS [Código tenedor],
    LTRIM(RTRIM(ten.xcliente)) AS [Tenedor],

    r.cbeneficiario AS [Código beneficiario],
    LTRIM(RTRIM(ben.xcliente)) AS [Beneficiario],

    r.cacreedor AS [Código acreedor],
    LTRIM(RTRIM(acr.xcliente)) AS [Acreedor],

    r.csucur AS [Código sucursal],

    /* Objeto asegurado */
    o.descripcion AS [Descripción objeto asegurado],

    o.ctipo AS [Código tipo de objeto],
    LTRIM(RTRIM(tobj.xtipo)) AS [Tipo de objeto],

    o.mvalor AS [Suma asegurada objeto],

    o.cactividad AS [Código actividad],
    LTRIM(RTRIM(act.xactividad)) AS [Categoría de actividad],

    o.criesgo AS [Código uso del bien],
    LTRIM(RTRIM(rie.xdescripcion_l)) AS [Uso del bien],

    o.ctipofac AS [Código tipo material],
    LTRIM(RTRIM(mat.xcontruc)) AS [Tipo material],

    o.xobsimp AS [Área M2],
    o.xpisos AS [Pisos],

    o.cpais AS [Código país],
    LTRIM(RTRIM(pai.xdescripcion_l)) AS [País],

    o.cestado AS [Código provincia],
    LTRIM(RTRIM(est.xdescripcion_l)) AS [Provincia],

    o.cciudad AS [Código distrito],
    LTRIM(RTRIM(dis.xdescripcion_l)) AS [Distrito],

    o.ccorregi AS [Código corregimiento],
    LTRIM(RTRIM(cor.xdescripcion_l)) AS [Corregimiento],

    o.cbarriada AS [Código barriada],
    LTRIM(RTRIM(bar.xdescripcion_l)) AS [Barriada],

    o.cedificio AS [Código edificio],
    LTRIM(RTRIM(edf.xdescripcion_l)) AS [Edificio],

    o.czonsism AS [Código zona sísmica],
    LTRIM(RTRIM(zsm.xriesgo)) AS [Zona sísmica],

    o.czoninun AS [Zona inundable],
    o.xdirecob AS [Dirección escrita],
    o.xnprestamo AS [Número préstamo],
    o.finca AS [Finca],
    o.rollo AS [Rollo],
    o.documento AS [Documento],
    o.edificio_no AS [Número edificio],
    o.calle_avenida AS [Calle avenida],
    o.xnoperacion AS [Tipo operación],
    o.xngarantia AS [Garantía],

    o.femision AS [Fecha emisión objeto],
    o.fdesde AS [Inicio vigencia objeto],
    o.fhasta AS [Fin vigencia objeto]

INTO IncRecibos
FROM IncPolizas AS p

INNER JOIN dbo.adrecibos AS r
    ON p.cpoliza = r.cpoliza
   AND p.fanopol = r.fanopol
   AND p.fmespol = r.fmespol

LEFT JOIN dbo.maplanes AS pln
    ON pln.cramo = r.cramo
   AND pln.cplan = p.cplan

LEFT JOIN dbo.maramos AS ram
    ON ram.cramo = r.cramo

LEFT JOIN dbo.macodigos AS trec
    ON trec.xsinonimo = 'itiporec'
   AND trec.ccodigo = r.itiporec

LEFT JOIN dbo.mamonedas AS mon
    ON mon.cmoneda = r.cmoneda

LEFT JOIN dbo.nbcerti AS o
    ON o.cpoliza = r.cpoliza
   AND o.fanopol = r.fanopol
   AND o.fmespol = r.fmespol
   AND o.ccerti = r.ccerti
   AND o.cramo = r.cramo

LEFT JOIN dbo.maentes AS aseg
    ON aseg.cci_rif = r.casegurado

LEFT JOIN dbo.maentes AS ten
    ON ten.cci_rif = r.ctenedor

LEFT JOIN dbo.maentes AS ben
    ON ben.cci_rif = r.cbeneficiario

LEFT JOIN dbo.maentes AS acr
    ON acr.cci_rif = r.cacreedor

LEFT JOIN dbo.matipos AS tobj
    ON tobj.cramo = o.cramo
   AND tobj.ctipo = o.ctipo

LEFT JOIN dbo.mactividad AS act
    ON act.cactividad = o.cactividad

LEFT JOIN dbo.macodigos AS rie
    ON rie.xsinonimo = 'cclarie'
   AND rie.ccodigo = o.criesgo

LEFT JOIN dbo.matipcon AS mat
    ON mat.cramo = o.cramo
   AND mat.ctipcons = o.ctipofac
   AND mat.u_version = 'E'

LEFT JOIN dbo.matiprie AS zsm
    ON zsm.criesgo = o.czonsism

LEFT JOIN dbo.mapaises AS pai
    ON pai.cpais = o.cpais
   AND pai.iestado = 'V'

LEFT JOIN dbo.maestados AS est
    ON est.cpais = o.cpais
   AND est.cestado = o.cestado
   AND est.iestado = 'V'

LEFT JOIN dbo.maciudades AS dis
    ON dis.cpais = o.cpais
   AND dis.cestado = o.cestado
   AND dis.cciudad = o.cciudad
   AND dis.iestado = 'V'

LEFT JOIN dbo.macorregi AS cor
    ON cor.cpais = o.cpais
   AND cor.cestado = o.cestado
   AND cor.cciudad = o.cciudad
   AND cor.ccorregi = o.ccorregi
   AND cor.iestado = 'V'

LEFT JOIN dbo.mabarriada AS bar
    ON bar.cpais = o.cpais
   AND bar.cestado = o.cestado
   AND bar.cciudad = o.cciudad
   AND bar.ccorregi = o.ccorregi
   AND bar.cbarriada = o.cbarriada
   AND bar.iestado = 'V'

LEFT JOIN dbo.maedificios AS edf
    ON edf.cpais = o.cpais
   AND edf.cestado = o.cestado
   AND edf.cciudad = o.cciudad
   AND edf.ccorregi = o.ccorregi
   AND edf.cedificio = o.cedificio
   AND edf.iestado = 'V';
   
   
SELECT
    c.crecibo,
    LTRIM(RTRIM(c.ccober)) AS CodigoCobertura,
    LTRIM(RTRIM(mc.xdescripcion_l)) AS NombreCobertura,
    c.msumaaseg AS SumaCobertura,
    c.mprima AS PrimaCobertura
INTO IncCoberturas
FROM dbo.adpolcob AS c
LEFT JOIN dbo.macoberturas AS mc
    ON mc.cramo = c.cramo
   AND mc.ccobertura = c.ccober
WHERE c.crecibo IN
(
    SELECT crecibo
    FROM IncRecibos
);


SELECT
    r.crecibo,
    x.TipoReaseguro,
    x.Porcentaje,
    x.Suma,
    x.Prima,
    x.Comision,
    x.Impuesto
INTO IncReaseguro
FROM dbo.adpolrea AS r
CROSS APPLY
(
    SELECT
        'RET' AS TipoReaseguro,
        r.pret AS Porcentaje,
        r.msret AS Suma,
        r.mpret AS Prima,
        r.mcomision AS Comision,
        CAST(NULL AS DECIMAL(18, 2)) AS Impuesto

    UNION ALL

    SELECT
        'CP',
        r.pcp1,
        r.mscp1,
        r.mpcp1,
        r.mccp1,
        r.micp1

    UNION ALL

    SELECT
        'CAT',
        r.p1e,
        r.ms1e,
        r.mp1e,
        r.mc1e,
        r.mi1e

    UNION ALL

    SELECT
        'CP2',
        r.pcp2,
        r.mscp2,
        r.mpcp2,
        r.mccp2,
        r.micp2

    UNION ALL

    SELECT
        'CAT2',
        r.p2e,
        r.ms2e,
        r.mp2e,
        r.mc2e,
        r.mi2e

    UNION ALL

    SELECT
        'FAC',
        r.pfo,
        r.msfo,
        r.mpfo,
        r.mcfo,
        r.mifo

    UNION ALL

    SELECT
        'FP',
        r.pfp,
        r.msfp,
        r.mpfp,
        r.mcfp,
        r.mifp
) AS x
WHERE r.crecibo IN
(
    SELECT crecibo
    FROM IncRecibos
);


DECLARE @ColumnasCoberturas NVARCHAR(MAX);
DECLARE @ColumnasReaseguro NVARCHAR(MAX);
DECLARE @SQL NVARCHAR(MAX);

SELECT @ColumnasCoberturas =
    STRING_AGG(
        CONVERT(NVARCHAR(MAX),
            '(SELECT MAX(c.SumaCobertura)
              FROM IncCoberturas AS c
              WHERE c.crecibo = rb.crecibo
                AND c.CodigoCobertura = '''
            + REPLACE(CodigoCobertura, '''', '''''')
            + ''') AS '
            + QUOTENAME(
                'Cobertura '
                + CodigoCobertura
                + ' - '
                + ISNULL(NombreCobertura, '')
                + ' - Suma'
              )
            + ',
             (SELECT MAX(c.PrimaCobertura)
              FROM IncCoberturas AS c
              WHERE c.crecibo = rb.crecibo
                AND c.CodigoCobertura = '''
            + REPLACE(CodigoCobertura, '''', '''''')
            + ''') AS '
            + QUOTENAME(
                'Cobertura '
                + CodigoCobertura
                + ' - '
                + ISNULL(NombreCobertura, '')
                + ' - Prima'
              )
        ),
        ','
    )
FROM
(
    SELECT DISTINCT
        CodigoCobertura,
        NombreCobertura
    FROM IncCoberturas
) AS c;


SELECT @ColumnasReaseguro =
    STRING_AGG(
        CONVERT(NVARCHAR(MAX),
            '(SELECT MAX(r.Porcentaje)
              FROM IncReaseguro AS r
              WHERE r.crecibo = rb.crecibo
                AND r.TipoReaseguro = '''
            + TipoReaseguro
            + ''') AS '
            + QUOTENAME(TipoReaseguro + ' - % Dist. Suma')
            + ',
             (SELECT MAX(r.Suma)
              FROM IncReaseguro AS r
              WHERE r.crecibo = rb.crecibo
                AND r.TipoReaseguro = '''
            + TipoReaseguro
            + ''') AS '
            + QUOTENAME(TipoReaseguro + ' - Suma')
            + ',
             (SELECT MAX(r.Prima)
              FROM IncReaseguro AS r
              WHERE r.crecibo = rb.crecibo
                AND r.TipoReaseguro = '''
            + TipoReaseguro
            + ''') AS '
            + QUOTENAME(TipoReaseguro + ' - Prima')
            + ',
             (SELECT MAX(r.Comision)
              FROM IncReaseguro AS r
              WHERE r.crecibo = rb.crecibo
                AND r.TipoReaseguro = '''
            + TipoReaseguro
            + ''') AS '
            + QUOTENAME(TipoReaseguro + ' - Comisión')
            + ',
             (SELECT MAX(r.Impuesto)
              FROM IncReaseguro AS r
              WHERE r.crecibo = rb.crecibo
                AND r.TipoReaseguro = '''
            + TipoReaseguro
            + ''') AS '
            + QUOTENAME(TipoReaseguro + ' - Impuesto')
        ),
        ','
    )
FROM
(
    SELECT DISTINCT
        TipoReaseguro
    FROM IncReaseguro
) AS r;

SET @SQL = N'
SELECT
    rb.*'
    + CASE
        WHEN NULLIF(@ColumnasCoberturas, '') IS NOT NULL
            THEN ',' + @ColumnasCoberturas
        ELSE ''
      END
    + CASE
        WHEN NULLIF(@ColumnasReaseguro, '') IS NOT NULL
            THEN ',' + @ColumnasReaseguro
        ELSE ''
      END
    + N'
FROM IncRecibos AS rb
ORDER BY
    rb.[Plan],
    rb.cpoliza,
    rb.fanopol,
    rb.fmespol,
    rb.crecibo;';

EXEC sys.sp_executesql @SQL;
