use sis11
go


DECLARE @TransferWorkSpaceId INT = 83

SELECT
    c.id AS IdCaja,
    CONVERT(VARCHAR(10), DATEADD(HOUR, -5, MAX(c.[date])), 103) AS FCaja,
    MAX(c.[user]) AS Cajero,
    MAX(b.[name]) AS Sucursal,
    COALESCE(SUM(sp.Efectivo), 0) AS Efectivo,
    COALESCE(SUM(sp.Cheque), 0) AS Cheque,
    COALESCE(SUM(sp.Tarjeta), 0) AS Tarjeta,
    COALESCE(SUM(sp.Otros), 0) AS Otros,
    COALESCE(SUM(sp.Efectivo + sp.Cheque + sp.Tarjeta + sp.Otros), 0) AS Depositos
FROM dbo.[Transfer] t
INNER JOIN dbo.TransferWorkspace c ON c.id = t.transferWorkspaceId
LEFT JOIN dbo.Branch b ON b.code = c.branchCode
LEFT JOIN (
    SELECT
        transferId,
        SUM(CASE WHEN paymentMethod = '1' THEN amount ELSE 0 END) AS Efectivo,
        SUM(CASE WHEN paymentMethod = 'CH' THEN amount ELSE 0 END) AS Cheque,
        SUM(CASE WHEN paymentMethod IN ('TCD', 'TC') THEN amount ELSE 0 END) AS Tarjeta,
        SUM(CASE
            WHEN paymentMethod NOT IN ('1', 'CH', 'TCD', 'TC')
              OR paymentMethod IS NULL
            THEN amount
            ELSE 0
        END) AS Otros
    FROM dbo.SplitPayment
    GROUP BY transferId
) sp ON sp.transferId = t.id
LEFT JOIN dbo.IncomeTypeCatalog tp ON tp.code = t.incomeType
WHERE t.transferWorkspaceId = @TransferWorkSpaceId AND t.isExternal = 1
AND ISNULL(tp.internalType, '') LIKE 'DEPOSIT-%'
AND t.[status] = 1
GROUP BY c.id

GO

DECLARE @TransferWorkSpaceId INT = 86;

SELECT
    c.id AS IdCaja,
    t.id AS IdTransferencia,
    t.amount AS Monto,
    sp.amount AS MontoCheque,
    sp.currency AS Moneda,
    sp.paymentMethod AS MetodoPago,
    sp.paymentMethodName AS MetodoPagoNombre,
    ISNULL(JSON_VALUE(numeroCheque.value, '$.userData[0]'),'0') AS NumeroCheque,
    JSON_VALUE(fechaCheque.value, '$.userData[0]') AS FechaCheque,
    bancoForm.BancoId,
    ISNULL(CASE
        WHEN banco.isPerson = 0 THEN ISNULL(banco.surname2,'No Asignado')
        ELSE CASE WHEN LTRIM(RTRIM(CONCAT(ISNULL(banco.name, ''),' ',ISNULL(banco.surname1, '')))) = '' THEN 'No Asignado'
				ELSE LTRIM(RTRIM(CONCAT(ISNULL(banco.name, ''),' ',ISNULL(banco.surname1, '')))) END
    END,'No Asignado') AS Banco
FROM dbo.[Transfer] t
INNER JOIN dbo.TransferWorkspace c
    ON c.id = t.transferWorkspaceId
INNER JOIN dbo.SplitPayment sp
    ON sp.transferId = t.id
LEFT JOIN dbo.IncomeTypeCatalog tp
    ON tp.code = t.incomeType
OUTER APPLY (
    SELECT value
    FROM OPENJSON(sp.jValues)
    WHERE JSON_VALUE(value, '$.name') = 'numeroCheque'
) numeroCheque
OUTER APPLY (
    SELECT value
    FROM OPENJSON(sp.jValues)
    WHERE JSON_VALUE(value, '$.name') = 'fechaCheque'
) fechaCheque
OUTER APPLY (
    SELECT JSON_VALUE(value, '$.userData[0]') AS BancoId
    FROM OPENJSON(sp.jValues)
    WHERE JSON_VALUE(value, '$.name') = 'bancoCheque'
) bancoForm
LEFT JOIN dbo.Contact banco
    ON banco.id = TRY_CONVERT(INT, bancoForm.BancoId)
WHERE t.transferWorkspaceId = @TransferWorkSpaceId
  AND t.isExternal = 1
  AND t.[status] = 1
  AND sp.paymentMethod = 'CH'
  AND ISNULL(tp.internalType, '') NOT LIKE 'DEPOSIT-%';