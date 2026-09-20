USE SIS11
GO

DECLARE @TransferId INT = 3310;

SELECT
    t.id AS TransferId,
    FORMAT(COALESCE(SUM(CASE WHEN UPPER(ISNULL(sp.paymentMethod, '')) IN ('1', 'EF', 'EFECTIVO') THEN sp.amount ELSE 0 END), 0), 'N2', 'en-US') AS Efectivo,
    FORMAT(COALESCE(SUM(CASE WHEN UPPER(ISNULL(sp.paymentMethod, '')) IN ('CH', 'CHEQUE') THEN sp.amount ELSE 0 END), 0), 'N2', 'en-US') AS Cheque,
    FORMAT(COALESCE(SUM(CASE WHEN UPPER(ISNULL(sp.paymentMethod, '')) IN ('TC', 'TCD', 'TARJETA') THEN sp.amount ELSE 0 END), 0), 'N2', 'en-US') AS Tarjeta,
    FORMAT(COALESCE(SUM(CASE WHEN UPPER(ISNULL(sp.paymentMethod, '')) NOT IN
        ('1', 'EF', 'EFECTIVO', 'CH', 'CHEQUE', 'TC', 'TCD', 'TARJETA')
        THEN sp.amount ELSE 0 END), 0), 'N2', 'en-US') AS Otros,
    COALESCE(NULLIF(LTRIM(RTRIM(paymentData.NumeroCheque)), ''), 'No Disponible') AS NumeroCheque,
    COALESCE(
        NULLIF(LTRIM(RTRIM(CONCAT(bancoCheque.name, ' ', bancoCheque.surname1, ' ', bancoCheque.surname2))), ''),
        NULLIF(LTRIM(RTRIM(paymentData.BancoCheque)), ''),
        'No Disponible'
    ) AS Banco,
    COALESCE(NULLIF(LTRIM(RTRIM(paymentData.NumeroTarjeta)), ''), 'No Disponible') AS NumeroTarjeta,
    paymentData.DetalleFormularioDinamico
FROM dbo.[Transfer] t
INNER JOIN dbo.TransferWorkspace tw
    ON tw.id = t.transferWorkspaceId
LEFT JOIN dbo.Usr u
    ON u.email = tw.[user]
LEFT JOIN dbo.SplitPayment sp
    ON sp.transferId = t.id
OUTER APPLY (
    SELECT
        MAX(CASE WHEN JSON_VALUE(value, '$.name') = 'clientePA'
            THEN JSON_VALUE(value, '$.userData[0]') END) AS ClientePA,
        MAX(CASE WHEN JSON_VALUE(value, '$.name') = 'pagador'
            THEN JSON_VALUE(value, '$.userData[0]') END) AS Pagador,
        MAX(CASE WHEN JSON_VALUE(value, '$.name') = 'cliente'
            THEN JSON_VALUE(value, '$.userData[0]') END) AS Cliente,
        MAX(CASE WHEN JSON_VALUE(value, '$.name') = 'contacto'
            THEN JSON_VALUE(value, '$.userData[0]') END) AS Contacto
    FROM OPENJSON(t.jIncomeTypeForm)
) formData
OUTER APPLY (
    SELECT
        MAX(CASE WHEN UPPER(ISNULL(sp2.paymentMethod, '')) IN ('CH', 'CHEQUE')
            AND JSON_VALUE(fieldData.value, '$.name') = 'numeroCheque'
            THEN JSON_VALUE(fieldData.value, '$.userData[0]') END) AS NumeroCheque,
        MAX(CASE WHEN UPPER(ISNULL(sp2.paymentMethod, '')) IN ('CH', 'CHEQUE')
            AND JSON_VALUE(fieldData.value, '$.name') = 'bancoCheque'
            THEN JSON_VALUE(fieldData.value, '$.userData[0]') END) AS BancoCheque,
        MAX(CASE WHEN UPPER(ISNULL(sp2.paymentMethod, '')) IN ('TC', 'TCD', 'TARJETA', 'TARJETA DE CREDITO')
            AND JSON_VALUE(fieldData.value, '$.name') IN ('numeroTarjeta', 'numeroTarjetaCredito', 'tarjeta')
            THEN JSON_VALUE(fieldData.value, '$.userData[0]') END) AS NumeroTarjeta,
        MAX(detailData.DetalleFormularioDinamico) AS DetalleFormularioDinamico
    FROM dbo.SplitPayment sp2
    OUTER APPLY OPENJSON(sp2.jValues) fieldData
    OUTER APPLY (
        SELECT STRING_AGG(
            CONCAT(
                COALESCE(NULLIF(methodData.paymentMethodName, ''), methodData.paymentMethod),
                ': ',
                COALESCE(NULLIF(methodData.jValues, ''), '[]')
            ),
            CHAR(13) + CHAR(10)
        ) AS DetalleFormularioDinamico
        FROM (
            SELECT DISTINCT
                paymentMethod,
                paymentMethodName,
                jValues
            FROM dbo.SplitPayment
            WHERE transferId = t.id
        ) methodData
    ) detailData
    WHERE sp2.transferId = t.id
) paymentData
LEFT JOIN dbo.Contact bancoCheque
    ON bancoCheque.id = TRY_CONVERT(INT, paymentData.BancoCheque)
WHERE t.id = @TransferId
GROUP BY
    t.id,
    t.amount,
    t.concept,
    tw.[user],
    u.nombre,
    t.jIncomeTypeForm,
    formData.ClientePA,
    formData.Pagador,
    formData.Cliente,
    formData.Contacto,
    paymentData.NumeroCheque,
    paymentData.BancoCheque,
    paymentData.NumeroTarjeta,
    paymentData.DetalleFormularioDinamico,
    bancoCheque.name,
    bancoCheque.surname1,
    bancoCheque.surname2;
