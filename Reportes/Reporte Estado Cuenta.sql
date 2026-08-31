use sis11

go

declare @holderId int = 3

SELECT
    c.id AS [Id Holder],
    CASE
        WHEN c.isPerson = 1 THEN
            LTRIM(RTRIM(CONCAT_WS(
                ' ',
                c.[name],
                c.middleName,
                c.surname1,
                c.surname2
            )))
        ELSE c.surname2
    END AS [Nombre Completo],

    CONCAT_WS(
        ' ',
        ca.address1,
        ca.address2
    ) AS [Direccion de Cobro],

    c.phone AS [Telefono],
    celular.num AS [Celular],
    COALESCE(NULLIF(c.email, ''), emailContact.email) AS [Email],
    fax.num AS [Fax],

    CASE
        WHEN c.isPerson = 1 THEN c.cnp
        ELSE c.nif
    END AS [Identificacion Holder]

FROM dbo.Contact c

OUTER APPLY (
    SELECT TOP 1
        address1,
        address2
    FROM dbo.ContactAddress
    WHERE contactId = c.id
    ORDER BY
        CASE
            WHEN UPPER(ISNULL(addressType, '')) IN ('BILLING', 'COBRO')
                THEN 0
            ELSE 1
        END,
        legal DESC,
        id DESC
) ca

OUTER APPLY (
    SELECT TOP 1 num
    FROM dbo.ContactPhone
    WHERE contactId = c.id
      AND type = 'PHONETYPE2'
    ORDER BY id DESC
) celular

OUTER APPLY (
    SELECT TOP 1 num
    FROM dbo.ContactPhone
    WHERE contactId = c.id
      AND type = 'PHONETYPE4'
    ORDER BY id DESC
) fax

OUTER APPLY (
    SELECT TOP 1 email
    FROM dbo.ContactEmail
    WHERE contactId = c.id
    ORDER BY id DESC
) emailContact

WHERE c.id = @HolderId;

go

DECLARE @HolderId INT = 3;
DECLARE @FechaCorte DATE =
    CAST(DATEADD(HOUR, -5, SYSUTCDATETIME()) AS DATE);

SELECT
    lp.lob AS [Codigo Ramo],
    CASE
    WHEN CHARINDEX(' - ', lob.[name]) > 0 THEN
        LTRIM(SUBSTRING(
            lob.[name],
            CHARINDEX(' - ', lob.[name]) + 3,
            LEN(lob.[name])
        ))
    ELSE lob.[name]
	END AS [Ramo],
    lp.fiscalNumber AS [Recibo],
    lp.code AS [Numero Poliza],

	insured.asegurado AS [Nombre Asegurado],
	COALESCE(insured.identificacion, 'No Tiene') AS [Identificacion Asegurado],

    CASE
        WHEN cesionario.id IS NULL THEN 'No Tiene'
        WHEN cesionario.isPerson = 1 THEN
            LTRIM(RTRIM(CONCAT_WS(
                ' ',
                cesionario.[name],
                cesionario.middleName,
                cesionario.surname1,
                cesionario.surname2
            )))
        ELSE cesionario.surname2
    END AS [Cesionario],


    LTRIM(RTRIM(CONCAT_WS(
        ' ',
        holder.[name],
        holder.middleName,
        holder.surname1,
        holder.surname2
    )))
    Holder,
	CASE
        WHEN holder.isPerson = 1
            THEN NULLIF(LTRIM(RTRIM(holder.cnp)), '')
        ELSE NULLIF(LTRIM(RTRIM(holder.nif)), '')
    END AS HolderIdentificacion,

    CONCAT(
        CONVERT(VARCHAR(10), DATEADD(HOUR, -5, lp.[start]), 103),
        ' - ',
        CONVERT(VARCHAR(10), DATEADD(HOUR, -5, lp.[end]), 103)
    ) AS [Vigencia],

    pp.dueDate AS [Fecha Vencimiento],

    NULLIF(pp.minimum, 0) AS [Facturado],
    ISNULL(pp.payed, 0) AS [Pagado],
	NULLIF(pp.minimum, 0) - ISNULL(pp.payed, 0) AS [Pendiente],

    CASE
        WHEN pp.dueDate >= @FechaCorte THEN
            COALESCE(NULLIF(pp.expected, 0), pp.minimum)
            - ISNULL(pp.payed, 0)
        ELSE 0
    END AS [Por Vencer],

    CASE
        WHEN pp.dueDate < @FechaCorte THEN
            COALESCE(NULLIF(pp.expected, 0), pp.minimum)
            - ISNULL(pp.payed, 0)
        ELSE 0
    END AS [Vencido]

FROM dbo.PayPlan pp
INNER JOIN dbo.LifePolicy lp ON lp.id = pp.lifePolicyId
INNER JOIN dbo.Contact holder ON holder.id = lp.holderId
LEFT JOIN dbo.Contact cesionario ON cesionario.id = lp.cessionBeneficiary
LEFT JOIN dbo.Lob lob ON lob.code = lp.lob

OUTER APPLY (
    SELECT TOP (1)
        CONCAT_WS(' ',
            NULLIF(LTRIM(RTRIM(insuredContact.name)), ''),
            NULLIF(LTRIM(RTRIM(insuredContact.middleName)), ''),
            NULLIF(LTRIM(RTRIM(insuredContact.surname1)), ''),
            NULLIF(LTRIM(RTRIM(insuredContact.surname2)), '')
        ) AS asegurado,
        insuredContact.id AS contactId,
        CASE
            WHEN insuredContact.isPerson = 1
                THEN NULLIF(LTRIM(RTRIM(insuredContact.cnp)), '')
            ELSE NULLIF(LTRIM(RTRIM(insuredContact.nif)), '')
        END AS identificacion,
        NULLIF(LTRIM(RTRIM(insuredContact.nationalId)), '') AS cobis
    FROM dbo.Insured insured
    INNER JOIN dbo.Contact insuredContact
        ON insuredContact.id = insured.contactId
    WHERE insured.lifePolicyId = lp.id
      AND insured.role = 0
    ORDER BY insured.id
) insured

WHERE lp.holderId = @holderId 
	AND lp.activeDate IS NOT NULL
	AND lp.entityState = 'ACTIVE'
	AND (lp.active = 1 OR (COALESCE(NULLIF(pp.minimum, 0), pp.expected) - ISNULL(pp.payed, 0)) > 0)
  AND NULLIF(pp.minimum, 0) > ISNULL(pp.payed, 0)

ORDER BY lp.lob, lp.code, pp.dueDate;
