use sis11

DECLARE @TransferWorkSpaceId INT = 112;

SELECT     t.id AS IdTransferencia,
COALESCE(SUM(CASE WHEN sp.paymentMethod = '1' THEN sp.amount ELSE 0 END), 0) AS Efectivo,   
'0' Recibo, '0' NoCheque,
COALESCE(SUM(CASE WHEN sp.paymentMethod = 'CH' THEN sp.amount ELSE 0 END), 0) AS Cheque,  
COALESCE(SUM(CASE WHEN sp.paymentMethod IN ('TCD', 'TC') THEN sp.amount ELSE 0 END), 0) AS Tarjeta,  
COALESCE(SUM(CASE WHEN sp.paymentMethod NOT IN ('1', 'CH', 'TCD', 'TC') OR sp.paymentMethod IS NULL THEN sp.amount ELSE 0 END), 0) AS Otros,
COALESCE(SUM(sp.amount), 0) AS Total,
CASE
    WHEN incomeType.internalType = 'PREMIUM'
         AND NULLIF(policyPayer.PolicyCode, '') IS NOT NULL
        THEN CONCAT('Aplicación de póliza ', policyPayer.PolicyCode)
    WHEN t.concept = 'Ingreso Vario'
         AND NULLIF(incomeType.name, '') IS NOT NULL
        THEN CONCAT(
            incomeType.name,
            CASE
                WHEN fixedFunds.destinationAccNo IS NOT NULL
                     AND UPPER(LTRIM(RTRIM(destinationAccount.accNo))) = UPPER(fixedFunds.destinationAccNo)
                    THEN ''
                WHEN LTRIM(RTRIM(destinationAccount.name)) COLLATE Latin1_General_100_CI_AI
                     IN ('fondos fijos', 'fixed funds')
                    THEN ''
                WHEN NULLIF(destinationAccount.name, '') IS NOT NULL
                    THEN CONCAT(' a ', destinationAccount.name)
                ELSE ''
            END
        )
    ELSE t.concept
END AS Concepto,
CASE
    WHEN incomeType.internalType = 'PREMIUM' THEN COALESCE(policyPayer.Cliente, dynamicForm.Cliente)
    ELSE dynamicForm.Cliente
END AS Cliente
FROM dbo.Transfer t
LEFT JOIN dbo.SplitPayment sp ON sp.transferId = t.id
LEFT JOIN dbo.IncomeTypeCatalog incomeType ON incomeType.code = t.incomeType
LEFT JOIN dbo.Account destinationAccount ON destinationAccount.id = t.destinationAccountId
OUTER APPLY (
    SELECT TOP (1)
        policy.code AS PolicyCode,
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
OUTER APPLY (
    -- Cashier treats the first configured external destination as Fondo Fijo.
    SELECT TOP (1) LTRIM(RTRIM(destinationAccNo)) AS destinationAccNo
    FROM dbo.ExternalSourceCatalog
) fixedFunds
WHERE t.transferWorkspaceId = @TransferWorkSpaceId   AND t.isExternal = 1
AND t.[status] = 1
GROUP BY     t.id,     t.concept,     t.jIncomeTypeForm, t.destinationAccountId,
             incomeType.internalType, incomeType.name,
             policyPayer.PolicyCode, policyPayer.Cliente, dynamicForm.Cliente,
             destinationAccount.accNo, destinationAccount.name,
             fixedFunds.destinationAccNo
