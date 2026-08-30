USE SIS11
GO

DECLARE @TransferWorkspaceId INT = 86;

SELECT
    t.id AS [Id Transferencia],
    tr.id AS [Id Asiento Contable],
    tl.account AS [Codigo Cuenta Contable],
    ca.[name] AS [Descripcion Cuenta Contable],
    tl.debit AS [Debito],
    tl.credit AS [Credito],
    CASE
        WHEN t.concept = 'IW' THEN 'Pago de Prima'
        WHEN t.concept LIKE 'IW %' THEN STUFF(t.concept, 1, 2, 'Pago de Prima')
        ELSE ISNULL(NULLIF(t.concept, ''), itc.[name])
    END AS [Concepto del Pago]
FROM dbo.[Transfer] t
INNER JOIN dbo.[Transaction] tr
    ON (
        t.allocationId IS NOT NULL
        AND tr.[entity] = 'ALLOCATION'
        AND tr.entityId = t.allocationId
    )
    OR (
        tr.[entity] = 'Transfer'
        AND tr.entityId = t.id
        AND NOT EXISTS
        (
            SELECT 1
            FROM dbo.[Transaction] tra
            WHERE tra.[entity] = 'ALLOCATION'
              AND tra.entityId = t.allocationId
        )
    )
INNER JOIN dbo.[TransactionLine] tl
    ON tl.transactionId = tr.id
LEFT JOIN dbo.[CatalogAccount] ca
    ON ca.code = tl.account
LEFT JOIN dbo.IncomeTypeCatalog itc
    ON itc.code = t.incomeType
WHERE t.transferWorkspaceId = @TransferWorkspaceId
  AND t.executed = 1
  AND t.isExternal = 1
ORDER BY
    t.id,
    tr.id,
    tl.[order];

