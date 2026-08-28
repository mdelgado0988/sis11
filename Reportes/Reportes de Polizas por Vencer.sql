USE SIS11
GO

--Reportes de Polizas por Vencer

DECLARE @Anio INT = 2026;
DECLARE @Mes INT = 8;
DECLARE @lob VARCHAR(50) = '0';

SELECT
    pol.branchCode AS csucurPOL,
    holder.cnp AS cci_rif,

    CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(holder.name)), ''),
        NULLIF(LTRIM(RTRIM(holder.middleName)), ''),
        NULLIF(LTRIM(RTRIM(holder.surname1)), ''),
        NULLIF(LTRIM(RTRIM(holder.surname2)), '')
    ) AS Tenedor,

    holder.id AS [Tenedor Id],

    pol.id AS [Id Póliza],
    pol.code AS [Póliza],
    pol.groupPolicyId AS [Id Maestra],

    COALESCE(NULLIF(LTRIM(RTRIM(productCatalog.name)), ''), pol.productCode) AS [Plan],

    YEAR(pol.[start]) AS fanopol,

    CONVERT(VARCHAR(10), CAST(pol.[start] AS DATETIME2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [Desde],
    CONVERT(VARCHAR(10), CAST(pol.[end] AS DATETIME2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [Hasta],

    insured.asegurado AS [Asegurado],
    pol.currency AS [Moneda],
    lob.name AS [Ramo],

    insured.contactId AS [Id Asegurado],
    COALESCE(insured.identificacion, 'No Tiene') AS [Identificación Asegurado],
    COALESCE(insured.cobis, 'No Tiene') AS [COBIS Asegurado],
    COALESCE(NULLIF(LTRIM(RTRIM(CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(cession.name)), ''),
        NULLIF(LTRIM(RTRIM(cession.middleName)), ''),
        NULLIF(LTRIM(RTRIM(cession.surname1)), ''),
        NULLIF(LTRIM(RTRIM(cession.surname2)), '')
    ))), ''), 'No Tiene') AS [Cesionario],

    COALESCE(NULLIF(LTRIM(RTRIM(CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(intermediary.name)), ''),
        NULLIF(LTRIM(RTRIM(intermediary.middleName)), ''),
        NULLIF(LTRIM(RTRIM(intermediary.surname1)), ''),
        NULLIF(LTRIM(RTRIM(intermediary.surname2)), '')
    ))), ''), 'No Tiene') AS [Intermediario],

    COALESCE(countryCatalog.name, 'No Tiene') AS Pais,
    COALESCE(stateCatalog.name, 'No Tiene') AS Provincia,
    COALESCE(cityCatalog.name, 'No Tiene') AS Ciudad,

    pol.groupPolicyId AS [Grupo Económico],
    pol.paymentMethod AS [Forma Cobro],
    '' AS [Zona Cobro],

    pol.lob AS [Id Ramo],
    pol.id AS [Oferta],

    MONTH(pol.[start]) AS [Mes Póliza],

    CASE
        WHEN pol.active = 1 THEN 'Activa'
        ELSE 'Inactiva'
    END AS [Estado Póliza],

    CONVERT(VARCHAR(10), CAST(pol.created AS DATETIME2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS [Fecha Registro],

    prc.usuario AS [Usuario],

    0 AS isRen,

    CONVERT(VARCHAR(10), CAST(pol.[start] AS DATETIME2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS fechaCobPrin

FROM dbo.LifePolicy pol

INNER JOIN dbo.Contact holder ON holder.id = pol.holderId
LEFT JOIN dbo.Product productCatalog
    ON productCatalog.code = pol.productCode
   AND productCatalog.lobCode = pol.lob
LEFT JOIN dbo.Lob lob ON lob.code = pol.lob
LEFT JOIN dbo.Proceso prc ON prc.id = pol.processId
LEFT JOIN dbo.Contact cession ON cession.id = pol.cessionBeneficiary
LEFT JOIN dbo.Contact intermediary ON intermediary.id = pol.sellerId
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
    WHERE insured.lifePolicyId = pol.id
      AND insured.role = 0
    ORDER BY insured.id
) insured

OUTER APPLY (
    SELECT TOP (1)
        ca.country,
        ca.state,
        ca.city,
        ca.sector
    FROM dbo.ContactAddress ca
    WHERE ca.contactId = holder.id
    ORDER BY
        CASE WHEN ca.legal = 1 THEN 0 ELSE 1 END,
        ca.id DESC
) addressData

OUTER APPLY (
    SELECT TOP (1) cc.name
    FROM dbo.CountryCatalog cc
    WHERE cc.code = COALESCE(addressData.country, holder.country)
) countryCatalog

OUTER APPLY (
    SELECT TOP (1) sc.name
    FROM dbo.StateCatalog sc
    WHERE sc.countryCode = COALESCE(addressData.country, holder.country)
      AND sc.code = COALESCE(addressData.state, holder.state)
) stateCatalog

OUTER APPLY (
    SELECT TOP (1) city.name
    FROM dbo.CityCatalog city
    WHERE city.stateCode = COALESCE(addressData.state, holder.state)
      AND city.code = COALESCE(addressData.city, holder.city)
) cityCatalog

WHERE pol.entityState = 'ACTIVE'
  AND pol.active = 1 AND pol.activeDate IS NOT NULL

  /* Vigencias que vencen durante el mes indicado.*/
  AND YEAR(pol.[end]) = @Anio AND MONTH(pol.[end]) = @Mes 
  AND pol.lob = (CASE WHEN ISNULL(@lob,'0') = '0' THEN pol.lob ELSE @lob END)

  /* La póliza no debe estar incluida como original de otra renovación.*/
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.LifePolicy renewal
      WHERE renewal.originalPolicyId = pol.id
  )
ORDER BY pol.[end], pol.id;
