use SisGlobal_AG01
go

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