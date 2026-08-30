USE SIS11
GO

DECLARE @workspaceid INT = 86;

SELECT
    tl.account AS [Codigo Cuenta Contable],
    ca.[name] AS [Descripcion Cuenta Contable],
    SUM(tl.debit) AS [Debito],
    SUM(tl.credit) AS [Credito]
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
WHERE t.transferWorkspaceId = @workspaceid
  AND t.executed = 1
  AND t.isExternal = 1
GROUP BY tl.account, ca.[name]
ORDER BY 1;

