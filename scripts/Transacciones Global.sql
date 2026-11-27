use SisGlobal_AG01
go

return;
DECLARE @Columnas NVARCHAR(MAX);
DECLARE @ColumnasSelect NVARCHAR(MAX);
DECLARE @SQL NVARCHAR(MAX);

SELECT
    @Columnas = STRING_AGG(QUOTENAME(linea), ','),
    @ColumnasSelect = STRING_AGG(
        'ISNULL(' + QUOTENAME(linea) + ', '''') AS ' + QUOTENAME(linea),
        ','
    )
FROM (
    SELECT DISTINCT
        CONVERT(VARCHAR(50), linea) AS linea
    FROM DAUTOCAJA_NET
    WHERE linea IS NOT NULL
) AS L;

SET @SQL = N'
WITH Datos AS
(
    SELECT
        m.NASIPRE,
        m.Descripcion,
        m.stat,
        CONVERT(VARCHAR(50), d.linea) AS linea,
        CONCAT_WS(''.'',
            NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(50), d.n1))), ''''),
            NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(50), d.n2))), ''''),
            NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(50), d.n3))), ''''),
            NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(50), d.n4))), ''''),
            NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(50), d.n5))), ''''),
            NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(50), d.n6))), ''''),
            NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(50), d.n7))), ''''),
            NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(50), d.n8))), ''''),
            NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(50), d.n9))), '''')
        ) AS Cuenta
    FROM MAUTOCAJA_NET AS m
    INNER JOIN DAUTOCAJA_NET AS d
        ON d.NASIPRE = m.NASIPRE
    WHERE m.btesoreria = 1
	AND m.nasipre in (2,8,25,60,73,75,84,85,477,600,781,782,783,784,785,786,787,788,789,790,791,792,793,795
	,796,797,799,800,803,804,805,806,807,811,823,828,829,830,831,832,833,834,835,836,837,838,839,861,873,874,885
	,888,892,895,898,982,990,1470,1748,1852)
)
SELECT
    NASIPRE [Transaccion],
    Descripcion [Nombre],
    stat [Estado],
    ' + @ColumnasSelect + '
FROM Datos
PIVOT
(
    MAX(Cuenta)
    FOR linea IN (' + @Columnas + ')
) AS P;
';

EXEC sp_executesql @SQL;

SELECT *
FROM mautocaja_net
WHERE nasipre in (8,25,60,73,75,84,85,477,600,781,782,783,784,785,786,787,788,789,790,791,792,793,795
	,796,797,799,800,803,804,805,806,807,811,828,829,830,831,832,833,834,835,836,837,838,839,861,873,874,885
	,888,892,895,898,982,990,1470,1748,1852)

SELECT nasipre,linea,debe,haber,
    CONCAT_WS('.',
        NULLIF(LTRIM(RTRIM(CONVERT(varchar(100), n1))), ''),
        NULLIF(LTRIM(RTRIM(CONVERT(varchar(100), n2))), ''),
        NULLIF(LTRIM(RTRIM(CONVERT(varchar(100), n3))), ''),
        NULLIF(LTRIM(RTRIM(CONVERT(varchar(100), n4))), ''),
        NULLIF(LTRIM(RTRIM(CONVERT(varchar(100), n5))), ''),
        NULLIF(LTRIM(RTRIM(CONVERT(varchar(100), n6))), ''),
        NULLIF(LTRIM(RTRIM(CONVERT(varchar(100), n7))), ''),
        NULLIF(LTRIM(RTRIM(CONVERT(varchar(100), n8))), ''),
        NULLIF(LTRIM(RTRIM(CONVERT(varchar(100), n9))), '')
    ) AS niveles,
    descrip
FROM dautocaja_net
WHERE nasipre IN (8,25,60,73,75,84,85,477,600,781,782,783,784,785,786,787,788,789,
    790,791,792,793,795,796,797,799,800,803,804,805,806,807,811,828,
    829,830,831,832,833,834,835,836,837,838,839,861,873,874,885,888,
    892,895,898,982,990,1470,1748,1852);

Crear configuración de contabilización para solicitudes de pago manuales.
Actualmente Existe la vista con id 82 para pagos de Solicitudes.

Quiero que estas solicitudes se contabilicen según el tipo de pago.
Se deberá cargar y configurar las cuentas contables según cada tipo de pago. Adjuntaré excel con la configuración de los tipos de pagos.


Actualmente en catálogo existen 3 Registros importantes que son usados en otros procesos:
1. Gastos Siniestros (id 1)
2. Pagos Siniestros (id 10)
3. Primas a devolver (id 2)

Quiero montar el nuevo catálogo según listado adjunto y eliminar el resto de opciones que no se usen respetando estas 3 anteriores

