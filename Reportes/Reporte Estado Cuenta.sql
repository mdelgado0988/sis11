USE SIS11
GO

DECLARE @holderId INT = null --3;
DECLARE @FechaDesde DATE = NULL;
DECLARE @FechaHasta DATE = null;
DECLARE @FechaCorte DATE = GETDATE()
DECLARE @policyId INT = 1;

SELECT
    holder.id AS [Id Holder],
    MAX(CASE
        WHEN holder.isPerson = 1 THEN LTRIM(RTRIM(CONCAT_WS(
            ' ', holder.[name], holder.middleName, holder.surname1, holder.surname2
        )))
        ELSE holder.surname2
    END) AS [Nombre Completo],
    CONCAT_WS(' ', MAX(direccion.address1), MAX(direccion.address2)) AS [Direccion de Cobro],
    MAX(holder.phone) AS [Telefono],
    MAX(celular.num) AS [Celular],
    COALESCE(MAX(NULLIF(holder.email, '')), MAX(emailContact.email)) AS [Email],
    MAX(fax.num) AS [Fax],
    MAX(CASE
        WHEN holder.isPerson = 1 THEN NULLIF(LTRIM(RTRIM(holder.cnp)), '')
        ELSE NULLIF(LTRIM(RTRIM(holder.nif)), '')
    END) AS [Identificacion Holder],
    lp.lob AS [Codigo Ramo],
    CASE
        WHEN CHARINDEX(' - ', lob.[name]) > 0 THEN LTRIM(SUBSTRING(
            lob.[name], CHARINDEX(' - ', lob.[name]) + 3, LEN(lob.[name])
        ))
        ELSE lob.[name]
    END AS [Ramo],
    lp.fiscalNumber AS [Recibo],
    lp.code AS [Numero Poliza],
    MAX(lp.paymentMethod) AS [Codigo Forma de Pago],
    MAX(COALESCE(paymentMethod.name, lp.paymentMethod)) AS [Forma de Pago],
    MAX(CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(insuredContact.name)), ''),
        NULLIF(LTRIM(RTRIM(insuredContact.middleName)), ''),
        NULLIF(LTRIM(RTRIM(insuredContact.surname1)), ''),
        NULLIF(LTRIM(RTRIM(insuredContact.surname2)), '')
    )) AS [Nombre Asegurado],
    COALESCE(MAX(CASE
        WHEN insuredContact.isPerson = 1 THEN NULLIF(LTRIM(RTRIM(insuredContact.cnp)), '')
        ELSE NULLIF(LTRIM(RTRIM(insuredContact.nif)), '')
    END), 'No Tiene') AS [Identificacion Asegurado],
    MAX(CASE
        WHEN cesionario.id IS NULL THEN 'No Tiene'
        WHEN cesionario.isPerson = 1 THEN LTRIM(RTRIM(CONCAT_WS(
            ' ', cesionario.[name], cesionario.middleName,
            cesionario.surname1, cesionario.surname2
        )))
        ELSE cesionario.surname2
    END) AS [Cesionario],
    MAX(LTRIM(RTRIM(CONCAT_WS(
        ' ', holder.[name], holder.middleName, holder.surname1, holder.surname2
    )))) AS Holder,
    MAX(CASE
        WHEN holder.isPerson = 1 THEN NULLIF(LTRIM(RTRIM(holder.cnp)), '')
        ELSE NULLIF(LTRIM(RTRIM(holder.nif)), '')
    END) AS HolderIdentificacion,
    CONCAT(
        CONVERT(VARCHAR(10), DATEADD(HOUR, -5, lp.[start]), 103),
        ' - ',
        CONVERT(VARCHAR(10), DATEADD(HOUR, -5, lp.[end]), 103)
    ) AS [Vigencia],
    pp.numberInYear AS NumeroCuota,
    CONVERT(VARCHAR(10), DATEADD(HOUR, -5, pp.dueDate), 103) AS [Fecha Vencimiento],
    CASE
        WHEN pp.payedDate IS NOT NULL
         AND (
             (@FechaCorte IS NOT NULL
              AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE) <= @FechaCorte)
             OR
             (@FechaCorte IS NULL AND @FechaDesde IS NOT NULL AND @FechaHasta IS NOT NULL
              AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE)
                  BETWEEN @FechaDesde AND @FechaHasta)
         )
        THEN CONVERT(VARCHAR(10), DATEADD(HOUR, -5, pp.payedDate), 103)
        ELSE NULL
    END AS [Ultima Fecha de Pago],
    NULLIF(pp.minimum, 0) AS [Facturado],
    CASE
        WHEN pp.payedDate IS NOT NULL
         AND (
             (@FechaCorte IS NOT NULL
              AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE) <= @FechaCorte)
             OR
             (@FechaCorte IS NULL AND @FechaDesde IS NOT NULL AND @FechaHasta IS NOT NULL
              AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE)
                  BETWEEN @FechaDesde AND @FechaHasta)
         )
        THEN ISNULL(pp.payed, 0)
        ELSE 0
    END AS [Pagado],
    CASE
        WHEN COALESCE(NULLIF(pp.minimum, 0), pp.expected) -
             CASE WHEN pp.payedDate IS NOT NULL
                       AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE) <=
                           CASE WHEN @FechaCorte IS NOT NULL THEN @FechaCorte ELSE @FechaHasta END
                  THEN ISNULL(pp.payed, 0) ELSE 0 END > 0
        THEN COALESCE(NULLIF(pp.minimum, 0), pp.expected) -
             CASE WHEN pp.payedDate IS NOT NULL
                       AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE) <=
                           CASE WHEN @FechaCorte IS NOT NULL THEN @FechaCorte ELSE @FechaHasta END
                  THEN ISNULL(pp.payed, 0) ELSE 0 END
        ELSE 0
    END AS [Pendiente al corte],
    CASE
        WHEN CAST(DATEADD(HOUR, -5, pp.dueDate) AS DATE) >=
             CASE WHEN @FechaCorte IS NOT NULL THEN @FechaCorte ELSE @FechaHasta END
        THEN CASE
            WHEN COALESCE(NULLIF(pp.minimum, 0), pp.expected) -
                 CASE WHEN pp.payedDate IS NOT NULL
                           AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE) <=
                               CASE WHEN @FechaCorte IS NOT NULL THEN @FechaCorte ELSE @FechaHasta END
                      THEN ISNULL(pp.payed, 0) ELSE 0 END > 0
            THEN COALESCE(NULLIF(pp.minimum, 0), pp.expected) -
                 CASE WHEN pp.payedDate IS NOT NULL
                           AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE) <=
                               CASE WHEN @FechaCorte IS NOT NULL THEN @FechaCorte ELSE @FechaHasta END
                      THEN ISNULL(pp.payed, 0) ELSE 0 END
            ELSE 0
        END
        ELSE 0
    END AS [Por Vencer],
    CASE
        WHEN CAST(DATEADD(HOUR, -5, pp.dueDate) AS DATE) <
             CASE WHEN @FechaCorte IS NOT NULL THEN @FechaCorte ELSE @FechaHasta END
        THEN CASE
            WHEN COALESCE(NULLIF(pp.minimum, 0), pp.expected) -
                 CASE WHEN pp.payedDate IS NOT NULL
                           AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE) <=
                               CASE WHEN @FechaCorte IS NOT NULL THEN @FechaCorte ELSE @FechaHasta END
                      THEN ISNULL(pp.payed, 0) ELSE 0 END > 0
            THEN COALESCE(NULLIF(pp.minimum, 0), pp.expected) -
                 CASE WHEN pp.payedDate IS NOT NULL
                           AND CAST(DATEADD(HOUR, -5, pp.payedDate) AS DATE) <=
                               CASE WHEN @FechaCorte IS NOT NULL THEN @FechaCorte ELSE @FechaHasta END
                      THEN ISNULL(pp.payed, 0) ELSE 0 END
            ELSE 0
        END
        ELSE 0
    END AS [Vencido]
FROM dbo.PayPlan pp
INNER JOIN dbo.LifePolicy lp ON lp.id = pp.lifePolicyId
INNER JOIN dbo.Contact holder ON holder.id = lp.holderId
LEFT JOIN dbo.Contact cesionario ON cesionario.id = lp.cessionBeneficiary
LEFT JOIN dbo.Lob lob ON lob.code = lp.lob
LEFT JOIN dbo.PaymentMethodCatalog paymentMethod
    ON paymentMethod.code = lp.paymentMethod
LEFT JOIN dbo.PayPlan pendingPayPlan
    ON pendingPayPlan.lifePolicyId = lp.id
   AND @FechaCorte IS NOT NULL
   AND COALESCE(NULLIF(pendingPayPlan.minimum, 0), pendingPayPlan.expected) -
       CASE
           WHEN pendingPayPlan.payedDate IS NOT NULL
            AND CAST(DATEADD(HOUR, -5, pendingPayPlan.payedDate) AS DATE) <= @FechaCorte
           THEN ISNULL(pendingPayPlan.payed, 0)
           ELSE 0
       END > 0
LEFT JOIN dbo.ContactAddress direccion ON direccion.contactId = holder.id
LEFT JOIN dbo.ContactPhone celular
    ON celular.contactId = holder.id AND celular.type = 'PHONETYPE2'
LEFT JOIN dbo.ContactPhone fax
    ON fax.contactId = holder.id AND fax.type = 'PHONETYPE4'
LEFT JOIN dbo.ContactEmail emailContact ON emailContact.contactId = holder.id
LEFT JOIN dbo.Insured insured
    ON insured.lifePolicyId = lp.id AND insured.role = 0
LEFT JOIN dbo.Contact insuredContact ON insuredContact.id = insured.contactId
WHERE (@HolderId IS NULL OR lp.holderId = @HolderId)
  AND (@PolicyId IS NULL OR lp.id = @PolicyId)
  AND (
      (@PolicyId IS NOT NULL)
      OR
      (@FechaCorte IS NOT NULL
       AND CAST(DATEADD(HOUR, -5, lp.[start]) AS DATE) <= @FechaCorte
       AND pendingPayPlan.lifePolicyId IS NOT NULL)
      OR
      (@FechaCorte IS NULL AND @FechaDesde IS NOT NULL AND @FechaHasta IS NOT NULL
       AND lp.activeDate IS NOT NULL
       AND CAST(DATEADD(HOUR, -5, lp.[start]) AS DATE) <= @FechaHasta
       AND CAST(DATEADD(HOUR, -5, lp.[end]) AS DATE) >= @FechaDesde)
  )
GROUP BY
    holder.id,
    lp.lob,
    lob.[name],
    lp.fiscalNumber,
    lp.code,
    lp.[start],
    lp.[end],
    pp.numberInYear,
    pp.dueDate,
    pp.minimum,
    pp.expected,
    pp.payed,
    pp.payedDate
ORDER BY lp.lob, lp.code, pp.dueDate;
