USE SIS11
GO

DECLARE @TransferId INT = 7125;

SELECT
    t.id AS TransferId,
    FORMAT(COALESCE(sp.Efectivo, 0), 'N2', 'en-US') AS Efectivo,
    FORMAT(COALESCE(sp.Cheque, 0), 'N2', 'en-US') AS Cheque,
    FORMAT(COALESCE(sp.Tarjeta, 0), 'N2', 'en-US') AS Tarjeta,
    paymentData.NumeroCheque,
    COALESCE(
        NULLIF(LTRIM(RTRIM(CONCAT(bancoCheque.name, ' ', bancoCheque.surname1, ' ', bancoCheque.surname2))), ''),
        paymentData.BancoCheque
    ) AS Banco,
    paymentData.NumeroTarjeta,
    FORMAT(
        CASE
            WHEN COALESCE(sp.CantidadSplitPayments, 0) = 0 THEN COALESCE(a.transferAmount, t.amount, 0)
            ELSE COALESCE(sp.Otros, 0)
        END,
        'N2', 'en-US'
    ) AS Otros,
    CASE
        WHEN COALESCE(sp.CantidadSplitPayments, 0) = 0
            THEN 'Sin detalle de método en la asignación'
        ELSE sp.DetalleOtros
    END AS DetalleOtros
FROM dbo.[Transfer] t
LEFT JOIN dbo.Allocation a
    ON a.id = t.allocationId
OUTER APPLY (
    SELECT
        COUNT_BIG(*) AS CantidadSplitPayments,
        SUM(CASE WHEN categoria.Metodo = 'Efectivo' THEN COALESCE(s.amount, 0) ELSE 0 END) AS Efectivo,
        SUM(CASE WHEN categoria.Metodo = 'Cheque' THEN COALESCE(s.amount, 0) ELSE 0 END) AS Cheque,
        SUM(CASE WHEN categoria.Metodo = 'Tarjeta' THEN COALESCE(s.amount, 0) ELSE 0 END) AS Tarjeta,
        SUM(CASE WHEN categoria.Metodo = 'Otros' THEN COALESCE(s.amount, 0) ELSE 0 END) AS Otros,
        STRING_AGG(
            CASE WHEN categoria.Metodo = 'Otros' THEN
                CONCAT(
                    COALESCE(
                        NULLIF(LTRIM(RTRIM(s.paymentMethodName)), ''),
                        NULLIF(LTRIM(RTRIM(s.paymentMethod)), ''),
                        '(sin método)'
                    ),
                    ': ',
                    FORMAT(COALESCE(s.amount, 0), 'N2', 'en-US')
                )
            END,
            CHAR(13) + CHAR(10)
        ) AS DetalleOtros
    FROM dbo.[Transfer] relatedTransfer
    INNER JOIN dbo.SplitPayment s
        ON s.transferId = relatedTransfer.id
    CROSS APPLY (
        SELECT
            CASE
                WHEN UPPER(LTRIM(RTRIM(ISNULL(s.paymentMethod, ''))))
                         IN ('1', 'EF', 'EFECTIVO')
                  OR UPPER(LTRIM(RTRIM(ISNULL(s.paymentMethodName, ''))))
                         IN ('EFECTIVO', 'CASH')
                    THEN 'Efectivo'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(s.paymentMethod, ''))))
                         IN ('CH', 'CHEQUE')
                  OR UPPER(LTRIM(RTRIM(ISNULL(s.paymentMethodName, ''))))
                         IN ('CHEQUE', 'CHECK')
                    THEN 'Cheque'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(s.paymentMethod, ''))))
                         IN ('TC', 'TCD', 'TARJETA', 'TARJETA DE CREDITO')
                  OR UPPER(LTRIM(RTRIM(ISNULL(s.paymentMethodName, ''))))
                         IN ('TARJETA', 'TARJETA DE CREDITO', 'CREDIT CARD')
                    THEN 'Tarjeta'
                ELSE 'Otros'
            END AS Metodo
    ) categoria
    WHERE (
        (t.allocationId IS NOT NULL AND relatedTransfer.allocationId = t.allocationId)
        OR (t.allocationId IS NULL AND relatedTransfer.id = t.id)
    )
) sp
OUTER APPLY (
    SELECT
        MAX(CASE
            WHEN UPPER(ISNULL(s.paymentMethod, '')) IN ('CH', 'CHEQUE')
              AND JSON_VALUE(fieldData.value, '$.name') = 'numeroCheque'
                THEN JSON_VALUE(fieldData.value, '$.userData[0]')
        END) AS NumeroCheque,
        MAX(CASE
            WHEN UPPER(ISNULL(s.paymentMethod, '')) IN ('CH', 'CHEQUE')
              AND JSON_VALUE(fieldData.value, '$.name') = 'bancoCheque'
                THEN JSON_VALUE(fieldData.value, '$.userData[0]')
        END) AS BancoCheque,
        MAX(CASE
            WHEN UPPER(ISNULL(s.paymentMethod, '')) IN ('TC', 'TCD', 'TARJETA', 'TARJETA DE CREDITO')
              AND JSON_VALUE(fieldData.value, '$.name') IN ('numeroTarjeta', 'numeroTarjetaCredito', 'tarjeta')
                THEN JSON_VALUE(fieldData.value, '$.userData[0]')
        END) AS NumeroTarjeta
    FROM dbo.[Transfer] relatedTransfer
    INNER JOIN dbo.SplitPayment s
        ON s.transferId = relatedTransfer.id
    OUTER APPLY OPENJSON(s.jValues) fieldData
    WHERE (
        (t.allocationId IS NOT NULL AND relatedTransfer.allocationId = t.allocationId)
        OR (t.allocationId IS NULL AND relatedTransfer.id = t.id)
    )
) paymentData
LEFT JOIN dbo.Contact bancoCheque
    ON bancoCheque.id = TRY_CONVERT(INT, paymentData.BancoCheque)
WHERE t.id = @TransferId;
