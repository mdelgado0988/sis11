USE SIS11

GO

DECLARE  @fstart DATE = '20260317'
        ,@fend DATE =  '20260317'
		,@ramo varchar(50) = null
		,@producto varchar(50) = null

/* INFORMACIÓN DE PÓLIZAS (NUEVO/RENOVACION) */
SELECT 
    lp.code AS Poliza,
    lp.lob AS [Ramo],
    ISNULL(lob.name, lp.lob) AS [Ramo Descripción],
    prod.name AS [Plan],
    CONVERT(VARCHAR, c.birth, 103) AS FechaNacimiento,
    CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(c.name)), ''),
        NULLIF(LTRIM(RTRIM(c.middleName)), ''),
        NULLIF(LTRIM(RTRIM(c.surname1)), ''),
        NULLIF(LTRIM(RTRIM(c.surname2)), '')
    ) AS Cliente,
    ISNULL(an.fiscalNumber, '0') AS Recibo,
    CONVERT(VARCHAR, an.created, 103) AS FechaIngreso,
    CONVERT(VARCHAR, an.created, 103) AS FechaEmision,
    ISNULL(refe.ReferidoName, '') AS [Referido por],
    ISNULL(prc.usuario, '') AS Usuario,
    CONVERT(VARCHAR, an.[start], 103) AS Desde,
    CONVERT(VARCHAR, an.[anniversary], 103) AS Hasta,
    CASE WHEN an.contractYear = 1 THEN 'Nueva' ELSE 'Renovación' END AS Tipo,

    ISNULL(pym.name, '') AS recursopago,
    CASE snap.periodicity 
        WHEN 'y' THEN 'Anual'
        WHEN 'm' THEN 'Mensual'
        WHEN 'b' THEN 'Bimensual'
        WHEN 's' THEN 'Semestral'
        WHEN 'q' THEN 'Trimestral'
        ELSE lp.periodicity 
    END AS [Forma pago],

    ISNULL(snap.insuredSum,0) AS [Suma Aseg],
    ISNULL(snap.surcharges,0) AS Recargos,
    ISNULL(snap.discounts,0) AS Descuentos,
    ISNULL(snap.anualPremium,0) AS [Prima Neta],
    ISNULL(snap.tax,0) AS Impuesto,
    ISNULL(snap.fee,0) AS [Otros Gastos],
    ISNULL(snap.anualTotal,0) AS Monto,
    ISNULL(c.nationalId, '0') AS Cobis,
    re.selectReferido_valor,
    ISNULL(gar.txtNoGarantia_valor, '') AS [Nro Garantia],
    ISNULL(tobj.cmbTipoObjeto_valor, '') AS [Edificio],
    ISNULL(pre.txtNoPrestamo_valor, '') AS [Nro Prestamo],
    CASE cr.claseRiesgo_valor
        WHEN '1' THEN 'Alto'
        WHEN '3' THEN 'Medio'
        WHEN '2' THEN 'Bajo'
        ELSE 'No ha seleccionado'
    END AS [Clase de Riesgo],
    ISNULL(CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(br.name)), ''),
        NULLIF(LTRIM(RTRIM(br.middleName)), ''),
        NULLIF(LTRIM(RTRIM(br.surname1)), ''),
        NULLIF(LTRIM(RTRIM(br.surname2)), '')
    ), 'No Tiene') AS [Corredor de Seguros],
    benf.name AS Beneficiario,
    NULL AS [Descrip Objeto Afianzado],
    ISNULL(CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(acre.name)), ''),
        NULLIF(LTRIM(RTRIM(acre.middleName)), ''),
        NULLIF(LTRIM(RTRIM(acre.surname1)), ''),
        NULLIF(LTRIM(RTRIM(acre.surname2)), '')
    ), 'No Tiene') AS Acreedor,
    ISNULL(c.nationalId, '0') AS [Cuenta Cobis],
    CASE WHEN lp.coinsurance > 0 THEN 'Si' ELSE 'No' END AS Coaseguro,
    NULL AS [Es lider],
    ISNULL(cc.name, '') AS Canal

FROM lifePolicy lp
LEFT JOIN Anniversary an ON an.lifePolicyId = lp.id

/* información de la póliza según snapshot  */
OUTER APPLY (SELECT 
				js.insuredSum,
				js.surcharges,
				js.discounts,
				js.anualPremium,
				js.tax,
				js.fee,
				js.anualTotal,
				js.paymentMethod,
				js.periodicity,
				js.channel,
				js.sellerId,
				js.cessionBeneficiary
			FROM OPENJSON(an.jSnapshot)
			WITH (
				insuredSum    DECIMAL(18,2) '$.insuredSum',
				surcharges    DECIMAL(18,2) '$.surcharges',
				discounts     DECIMAL(18,2) '$.discounts',
				anualPremium  DECIMAL(18,2) '$.anualPremium',
				tax           DECIMAL(18,2) '$.tax',
				fee           DECIMAL(18,2) '$.fee',
				anualTotal    DECIMAL(18,2) '$.anualTotal',
				paymentMethod VARCHAR(50) '$.paymentMethod',
				periodicity   VARCHAR(50) '$.periodicity',
				channel		  VARCHAR(50) '$.channel',
				sellerId NUMERIC(11,0) '$.sellerId',
				cessionBeneficiary NUMERIC(11,0) '$.cessionBeneficiary'
			) js) snap

LEFT JOIN Contact c ON c.id = lp.holderId        
LEFT JOIN Contact br ON br.id = snap.sellerId
LEFT JOIN Contact acre ON acre.id = snap.cessionBeneficiary
LEFT JOIN Product prod ON prod.code = lp.productCode
LEFT JOIN Proceso prc ON prc.id = an.processId
LEFT JOIN ChannelCatalog cc ON cc.code = snap.channel
LEFT JOIN Insured benf ON benf.LifePolicyId = lp.id
LEFT JOIN lob lob ON lob.code = lp.lob
LEFT JOIN PaymentMethodCatalog pym ON pym.code = snap.paymentMethod

/*-- Referido: valor seleccionado*/
OUTER APPLY (
    SELECT TOP 1
        CASE 
            WHEN ISJSON(component.value) = 1 
            THEN JSON_VALUE(component.value, '$.userData[0]')
            ELSE NULL
        END AS selectReferido_valor
    FROM insuredObject io
    CROSS APPLY OPENJSON(
        CASE 
            WHEN ISJSON(io.jValues) = 1 THEN io.jValues
            ELSE '[]'
        END
    ) component
    WHERE io.lifePolicyId = lp.id
      AND CASE 
            WHEN ISJSON(component.value) = 1 
            THEN JSON_VALUE(component.value, '$.name')
            ELSE NULL
          END = 'selectReferido'
) re

/*-- Referido: nombre desde tabla*/
OUTER APPLY (
    SELECT TOP 1
        CAST(JSON_VALUE(r2.value, '$[0]') AS VARCHAR(100)) AS ReferidoId,
        JSON_VALUE(r2.value, '$[1]') AS ReferidoName
    FROM dbo.[Table] tblRef
    CROSS APPLY OPENJSON(
        CASE 
            WHEN ISJSON(tblRef.data) = 1 THEN tblRef.data
            ELSE '[]'
        END
    ) r2
    WHERE tblRef.name = 'tblReferido'
      AND r2.[key] > 0
      AND ISJSON(r2.value) = 1
      AND CAST(JSON_VALUE(r2.value, '$[0]') AS VARCHAR(100)) = re.selectReferido_valor
) refe

/*-- Número de Préstamo*/
OUTER APPLY (
    SELECT TOP 1
        CASE 
            WHEN ISJSON(component.value) = 1 
            THEN JSON_VALUE(component.value, '$.userData[0]')
            ELSE NULL
        END AS txtNoPrestamo_valor
    FROM insuredObject io
    CROSS APPLY OPENJSON(
        CASE 
            WHEN ISJSON(io.jValues) = 1 THEN io.jValues
            ELSE '[]'
        END
    ) component
    WHERE io.lifePolicyId = lp.id
      AND CASE 
            WHEN ISJSON(component.value) = 1 
            THEN JSON_VALUE(component.value, '$.name')
            ELSE NULL
          END = 'txtNoPrestamo'
) pre

/*-- Número de Garantía*/
OUTER APPLY (
    SELECT TOP 1
        CASE 
            WHEN ISJSON(component.value) = 1 
            THEN JSON_VALUE(component.value, '$.userData[0]')
            ELSE NULL
        END AS txtNoGarantia_valor
    FROM insuredObject io
    CROSS APPLY OPENJSON(
        CASE 
            WHEN ISJSON(io.jValues) = 1 THEN io.jValues
            ELSE '[]'
        END
    ) component
    WHERE io.lifePolicyId = lp.id
      AND CASE 
            WHEN ISJSON(component.value) = 1 
            THEN JSON_VALUE(component.value, '$.name')
            ELSE NULL
          END = 'txtNoGarantia'
) gar

/*-- Tipo de Objeto*/
OUTER APPLY (
    SELECT TOP 1
        CASE 
            WHEN ISJSON(component.value) = 1 
            THEN JSON_VALUE(component.value, '$.userData[0]')
            ELSE NULL
        END AS cmbTipoObjeto_valor
    FROM insuredObject io
    CROSS APPLY OPENJSON(
        CASE 
            WHEN ISJSON(io.jValues) = 1 THEN io.jValues
            ELSE '[]'
        END
    ) component
    WHERE io.lifePolicyId = lp.id
      AND CASE 
            WHEN ISJSON(component.value) = 1 
            THEN JSON_VALUE(component.value, '$.name')
            ELSE NULL
          END = 'cmbTipoObjeto'
) tobj

/*-- Clase de Riesgo*/
OUTER APPLY (
    SELECT TOP 1
        CASE 
            WHEN ISJSON(campo.value) = 1 
            THEN JSON_VALUE(campo.value, '$.userData[0]')
            ELSE NULL
        END AS claseRiesgo_valor
    FROM OPENJSON(
        CASE 
            WHEN ISJSON(c.jCustomForms) = 1 THEN c.jCustomForms
            ELSE '{}'
        END
    ) formulario
    CROSS APPLY OPENJSON(
        CASE 
            WHEN ISJSON(formulario.value) = 1 THEN formulario.value
            ELSE '[]'
        END
    ) campo
    WHERE c.id = lp.holderId
      AND (
            formulario.[key] = N'Información adicional'
            OR formulario.[key] = 'Informacion adicional'
            OR formulario.[key] LIKE N'%Informaci%n adicional%'
          )
      AND CASE 
            WHEN ISJSON(campo.value) = 1 
            THEN JSON_VALUE(campo.value, '$.name')
            ELSE NULL
          END = 'ClaseRiesgo'
) cr

WHERE CAST(an.created AS date) BETWEEN CAST(@fstart AS DATE) AND CAST(@fend AS DATE)
AND (@ramo IS NULL OR lp.lob = @ramo)
AND (@producto IS NULL OR lp.productCode = @producto)