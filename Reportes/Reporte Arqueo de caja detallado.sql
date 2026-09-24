use sis11

DECLARE @TransferWorkSpaceId INT = 99;

SELECT     t.id AS IdTransferencia,
COALESCE(SUM(CASE WHEN sp.paymentMethod = '1' THEN sp.amount ELSE 0 END), 0) AS Efectivo,   
'0' Recibo, '0' NoCheque,
COALESCE(SUM(CASE WHEN sp.paymentMethod = 'CH' THEN sp.amount ELSE 0 END), 0) AS Cheque,  
COALESCE(SUM(CASE WHEN sp.paymentMethod IN ('TCD', 'TC') THEN sp.amount ELSE 0 END), 0) AS Tarjeta,  
COALESCE(SUM(CASE WHEN sp.paymentMethod NOT IN ('1', 'CH', 'TCD', 'TC') OR sp.paymentMethod IS NULL THEN sp.amount ELSE 0 END), 0) AS Otros,
COALESCE(SUM(sp.amount), 0) AS Total,     t.concept AS Concepto,
CASE
    WHEN incomeType.internalType = 'PREMIUM' THEN COALESCE(policyPayer.Cliente, dynamicForm.Cliente)
    ELSE dynamicForm.Cliente
END AS Cliente
FROM dbo.Transfer t
LEFT JOIN dbo.SplitPayment sp ON sp.transferId = t.id
LEFT JOIN dbo.IncomeTypeCatalog incomeType ON incomeType.code = t.incomeType
OUTER APPLY (
    SELECT TOP (1)
        CASE
            WHEN contact.isPerson = 1
                THEN CONCAT_WS(' ', contact.name, contact.surname1, contact.surname2)
            ELSE contact.surname2
        END AS Cliente
    FROM dbo.AllocationInstallment allocationInstallment
    INNER JOIN dbo.LifePolicy policy ON policy.id = allocationInstallment.lifePolicyId
    INNER JOIN dbo.Contact contact ON contact.id = policy.holderId
    WHERE allocationInstallment.allocationId = t.allocationId
    ORDER BY policy.id
) policyPayer
OUTER APPLY (
    SELECT JSON_VALUE(t.jIncomeTypeForm, '$[0].userData[0]') AS Cliente
) dynamicForm
WHERE t.transferWorkspaceId = @TransferWorkSpaceId   AND t.isExternal = 1
AND t.[status] = 1
GROUP BY     t.id,     t.concept,     t.jIncomeTypeForm, incomeType.internalType,
             policyPayer.Cliente, dynamicForm.Cliente

go

DECLARE @TransferWorkSpaceId INT = 83

SELECT
    c.id AS IdCaja,
    CONVERT(VARCHAR(10), DATEADD(HOUR, -5, MAX(c.[date])), 103) AS FCaja,
    MAX(c.[user]) AS Cajero,
    MAX(b.[name]) AS Sucursal,
    COALESCE(SUM(CASE WHEN ISNULL(tp.internalType, '') NOT LIKE 'DEPOSIT-%' THEN sp.Efectivo ELSE 0 END), 0) AS Efectivo,
    COALESCE(SUM(CASE WHEN ISNULL(tp.internalType, '') NOT LIKE 'DEPOSIT-%' THEN sp.Cheque ELSE 0 END), 0) AS Cheque,
    COALESCE(SUM(CASE WHEN ISNULL(tp.internalType, '') NOT LIKE 'DEPOSIT-%' THEN sp.Tarjeta ELSE 0 END), 0) AS Tarjeta,
    COALESCE(SUM(CASE WHEN ISNULL(tp.internalType, '') NOT LIKE 'DEPOSIT-%' THEN sp.Otros ELSE 0 END), 0) AS Otros,
	COALESCE(SUM(CASE WHEN ISNULL(tp.internalType, '') NOT LIKE 'DEPOSIT-%' THEN sp.Efectivo + sp.Cheque + sp.Tarjeta + sp.Otros ELSE 0 END), 0) AS Ingresos,
    COALESCE(SUM(CASE WHEN ISNULL(tp.internalType, '') LIKE 'DEPOSIT-%' THEN t.amount ELSE 0 END), 0) AS Depositos,
    COALESCE(SUM(CASE WHEN ISNULL(tp.internalType, '') NOT LIKE 'DEPOSIT-%' THEN t.amount ELSE 0 END), 0) AS NetoCaja,
    COALESCE(SUM(CASE WHEN ISNULL(tp.internalType, '') NOT LIKE 'DEPOSIT-%' THEN t.amount ELSE 0 END), 0)
	- COALESCE(SUM(CASE WHEN ISNULL(tp.internalType, '') LIKE 'DEPOSIT-%' THEN t.amount ELSE 0 END), 0) AS SaldoFinal
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
AND t.[status] = 1
GROUP BY c.id
