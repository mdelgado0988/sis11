use sis11

go

DECLARE @TransferWorkSpaceId INT = 86

SELECT
    c.id AS IdCaja,
    c.[user] AS Cajero,
    u.nombre AS NombreCajero,
    CONVERT(VARCHAR(10), DATEADD(HOUR, -5, c.[date]), 103) AS FechaCaja,
    t.id AS IdTransferencia,
    ISNULL(contacto.NombreContacto,'-') NombreContacto,
    CASE WHEN t.concept = 'IW' THEN 'Cobro de prima' ELSE t.concept END AS Concepto,
    b.[name] AS Sucursal
FROM dbo.[Transfer] t
INNER JOIN dbo.TransferWorkspace c ON c.id = t.transferWorkspaceId
LEFT JOIN dbo.Branch b ON b.code = c.branchCode
LEFT JOIN dbo.Usr u ON u.email = c.[user]
LEFT JOIN dbo.IncomeTypeCatalog tp ON tp.code = t.incomeType
OUTER APPLY (
    SELECT
        JSON_VALUE(value, '$.userData[0]') AS NombreContacto
    FROM OPENJSON(t.jIncomeTypeForm)
    WHERE JSON_VALUE(value, '$.name') = 'clientePA'
) contacto
WHERE t.transferWorkspaceId = @TransferWorkSpaceId
AND t.isExternal = 1
AND t.[status] = 1;