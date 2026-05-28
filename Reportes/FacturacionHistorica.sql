USE SIS11

GO

DECLARE  @fstart DATE = '20250317'
        ,@fend DATE =  '20260317'
		,@ramo varchar(50) = null
		,@producto varchar(50) = null

/* INFORMACIÓN DE PÓLIZAS (NUEVO) */
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
    ISNULL(ISNULL(an.fiscalNumber, lp.fiscalNumber),'0') AS Recibo,
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

/*-- Acreedor*/
OUTER APPLY (
    SELECT TOP (1) 
        CASE 
            WHEN bf.isPerson = 1 
            THEN CONCAT_WS(' ',
                NULLIF(LTRIM(RTRIM(bf.name)), ''),
                NULLIF(LTRIM(RTRIM(bf.surname1)), ''),
                NULLIF(LTRIM(RTRIM(bf.surname2)), '')
            )
            ELSE LTRIM(RTRIM(bf.surname2))
        END AS name
    FROM contact bf
    WHERE bf.id = lp.cessionBeneficiary
) bf

WHERE CAST(an.created AS date) BETWEEN CAST(@fstart AS DATE) AND CAST(@fend AS DATE)
AND (@ramo IS NULL OR lp.lob = @ramo)
AND (@producto IS NULL OR lp.productCode = @producto)


UNION ALL

/* INFORMACIÓN DE ENDOSOS SEGÚN SU DETALLE */
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
    ISNULL(bed.fiscalNumber, '0') AS Recibo,
    CONVERT(VARCHAR, ed.creationDate, 103) AS FechaIngreso,
    CONVERT(VARCHAR, ed.effectiveDate, 103) AS FechaEmision,
    ISNULL(refe.ReferidoName, '') AS [Referido por],
    ISNULL(prc.usuario, '') AS Usuario,
    CONVERT(VARCHAR, ISNULL(ed.newStart, lp.[start]), 103) AS Desde,
    CONVERT(VARCHAR, ISNULL(ed.newEnd, lp.[end]), 103) AS Hasta
    ,CASE 
		WHEN ed.Discriminator = 'AddCoverageChange' THEN 'Adición de Cobertura'
		WHEN ed.Discriminator = 'BeneficiaryChange' THEN 'Cambio de Beneficiario'
		WHEN ed.Discriminator = 'BenefitChange' THEN 'Cambio de Beneficio'
		WHEN ed.Discriminator = 'CancellationChange' THEN 'Cancelación'
		WHEN ed.Discriminator = 'CapitalChange' THEN 'Cambio de Suma Asegurada'
		WHEN ed.Discriminator = 'CessionBeneficiaryChange' THEN 'Cambio de Cesionario'
		WHEN ed.Discriminator = 'ClauseChange' THEN 'Cambio de Cláusula'
		WHEN ed.Discriminator = 'ContingentBeneficiaryChange' THEN 'Cambio de Beneficiario Contingente'
		WHEN ed.Discriminator = 'CoverageChange' THEN 'Cambio de Cobertura'
		WHEN ed.Discriminator = 'CoverageChangeTechData' THEN 'Cambio Técnico de Cobertura'
		WHEN ed.Discriminator = 'ExclusionChange' THEN 'Cambio de Exclusión'
		WHEN ed.Discriminator = 'FrequencyChange' THEN 'Cambio de Frecuencia'
		WHEN ed.Discriminator = 'InformativeChange' THEN 'Cambio Informativo'
		WHEN ed.Discriminator = 'InsuredObjectChange' THEN 'Cambio de Objeto Asegurado'
		WHEN ed.Discriminator = 'IntermediaryChange' THEN 'Cambio de Intermediario'
		WHEN ed.Discriminator = 'LoadingChange' THEN 'Cambio de Recargo/Descuento'
		WHEN ed.Discriminator = 'PayPlanChange' THEN 'Cambio de Plan de Pago'
		WHEN ed.Discriminator = 'PolicyholderChange' THEN 'Cambio de Tomador'
		WHEN ed.Discriminator = 'PolicySurchargeChange' AND ISNULL(mo.Monto,0) > 0 THEN 'Cambio de Recargo de Póliza'
		WHEN ed.Discriminator = 'PolicySurchargeChange' AND ISNULL(mo.Monto,0) < 0 THEN 'Cambio de Descuento de Póliza'
		WHEN ed.Discriminator = 'PolicySurchargeChange' THEN 'Cambio de Recargo de Póliza'
		WHEN ed.Discriminator = 'ReinstatementChange' THEN 'Reistitución de Suma Asegurada'
		WHEN ed.Discriminator = 'TemporalStatusChange' THEN 'Cambio de Estado Temporal'
		WHEN ed.Discriminator = 'TermChange' THEN 'Cambio de Vigencia'
		ELSE ed.Discriminator
	END AS Tipo
    ,ISNULL(pym.name, '') AS recursopago
    ,CASE SUBSTRING(TRIM(ISNULL(bed.periodicity, lp.periodicity)),1,1)
        WHEN 'y' THEN 'Anual'
        WHEN 'm' THEN 'Mensual'
        WHEN 'b' THEN 'Bimensual'
        WHEN 's' THEN 'Semestral'
        WHEN 'q' THEN 'Trimestral'
        ELSE TRIM(ISNULL(bed.periodicity, lp.periodicity))
    END AS [Forma pago]
    ,ISNULL(mo.Suma,(ISNULL(ed.newCapital,0) - ISNULL(ed.oldCapital,0))) AS [Suma Aseg]
	,mo.Recargos
	,mo.Descuentos
	,mo.[Prima Neta]
	,mo.Impuesto
	,mo.[Otros Gastos]
	,mo.Monto    
    ,ISNULL(c.nationalId, '0') AS Cobis
    ,oa.selectReferido_valor
    ,ISNULL(oa.txtNoGarantia_valor, '') AS [Nro Garantia]
    ,ISNULL(oa.cmbTipoObjeto_valor, '') AS [Edificio]
    ,ISNULL(oa.txtNoPrestamo_valor, '') AS [Nro Prestamo]
    ,CASE cr.claseRiesgo_valor
        WHEN '1' THEN 'Alto'
        WHEN '3' THEN 'Medio'
        WHEN '2' THEN 'Bajo'
        ELSE 'No ha seleccionado'
    END AS [Clase de Riesgo]
    ,ISNULL(CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(br.name)), ''),
        NULLIF(LTRIM(RTRIM(br.middleName)), ''),
        NULLIF(LTRIM(RTRIM(br.surname1)), ''),
        NULLIF(LTRIM(RTRIM(br.surname2)), '')
    ), 'No Tiene') AS [Corredor de Seguros]
    ,benf.name AS Beneficiario
    ,NULL AS [Descrip Objeto Afianzado]
    ,bf.name AS Acreedor
    ,ISNULL(c.nationalId, '0') AS [Cuenta Cobis]
    ,CASE WHEN lp.coinsurance > 0 THEN 'Si' ELSE 'No' END AS Coaseguro
    ,NULL AS [Es lider]
    ,ISNULL(cc.name, '') AS Canal

FROM lifePolicy lp
INNER JOIN Change ed ON ed.lifePolicyId = lp.id AND ed.status = '1'
INNER JOIN Bill bed ON bed.changeId = ed.id
LEFT JOIN BillDiff bfed ON bfed.changeId = ed.id
LEFT JOIN Contact c ON c.id = ISNULL(ed.newPolicyholder, lp.holderId)
LEFT JOIN Contact br ON br.id = ISNULL(ed.newSellerId, lp.sellerId)
LEFT JOIN Product prod ON prod.code = lp.productCode
LEFT JOIN Proceso prc ON prc.id = ed.processId
LEFT JOIN PaymentMethodCatalog pym ON pym.code = ISNULL(ed.newpaymentMethod, lp.paymentMethod)
LEFT JOIN ChannelCatalog cc ON cc.code = ISNULL(ed.newChannel , lp.channel)
LEFT JOIN Insured benf ON benf.LifePolicyId = lp.id
LEFT JOIN lob lob ON lob.code = lp.lob

/* Valores monetarios => si no hay billDiff, que tome lo que genera Bill, (Cancelaciones por ejem)  */
OUTER APPLY (SELECT 
				js.insuredSum,
				js.surcharges,
				js.discounts,
				js.anualPremium,
				js.tax,
				js.fee,
				js.anualTotal
			FROM OPENJSON(ed.jSnapshot)
			WITH (
				insuredSum    DECIMAL(18,2) '$.insuredSum',
				surcharges    DECIMAL(18,2) '$.surcharges',
				discounts     DECIMAL(18,2) '$.discounts',
				anualPremium  DECIMAL(18,2) '$.anualPremium',
				tax           DECIMAL(18,2) '$.tax',
				fee           DECIMAL(18,2) '$.fee',
				anualTotal    DECIMAL(18,2) '$.anualTotal'
			) js) snap

CROSS APPLY (SELECT CASE WHEN ed.Discriminator = 'CancellationChange' THEN ISNULL(bed.surcharges,0) - ISNULL(snap.surcharges,0) ELSE ISNULL(bfed.surcharges,0) END AS Recargos
				,CASE WHEN ed.Discriminator = 'CancellationChange' THEN ISNULL(bed.discounts,0) - ISNULL(snap.discounts,0) ELSE ISNULL(bfed.discounts,0) END AS Descuentos
				,CASE WHEN ed.Discriminator = 'CancellationChange' THEN ISNULL(bed.anualPremium,0) - ISNULL(snap.anualPremium,0) ELSE ISNULL(bfed.annualPremium,0) END AS [Prima Neta]
				,CASE WHEN ed.Discriminator = 'CancellationChange' THEN ISNULL(bed.tax,0) - ISNULL(snap.tax,0) ELSE ISNULL(bfed.tax,0) END AS Impuesto
				,CASE WHEN ed.Discriminator = 'CancellationChange' THEN ISNULL(bed.fee,0) - ISNULL(snap.fee,0) ELSE ISNULL(bfed.fee,0) END AS [Otros Gastos]
				,CASE WHEN ed.Discriminator = 'CancellationChange' THEN ISNULL(bed.anualTotal,0) - ISNULL(snap.anualTotal,0) ELSE ISNULL(bfed.annualTotal,0) END AS Monto
				,CASE WHEN ed.Discriminator = 'CancellationChange' THEN 0 - ISNULL(snap.insuredSum,0) ELSE null END AS Suma
				) mo

/* Valores del OA */
OUTER APPLY (SELECT datos.*
			FROM OPENJSON(ed.jNewInsuredObjects) obj
			CROSS APPLY OPENJSON(obj.value) jValues
			OUTER APPLY (SELECT 

							MAX(CASE 
								WHEN JSON_VALUE(v.value, '$.name') = 'selectReferido'
								THEN JSON_VALUE(v.value, '$.userData[0]')
							END) AS selectReferido_valor,

							MAX(CASE 
								WHEN JSON_VALUE(v.value, '$.name') = 'txtNoPrestamo'
								THEN JSON_VALUE(v.value, '$.userData[0]')
							END) AS txtNoPrestamo_valor,

							MAX(CASE 
								WHEN JSON_VALUE(v.value, '$.name') = 'txtNoGarantia'
								THEN JSON_VALUE(v.value, '$.userData[0]')
							END) AS txtNoGarantia_valor,

							MAX(CASE 
								WHEN JSON_VALUE(v.value, '$.name') = 'cmbTipoObjeto'
								THEN JSON_VALUE(v.value, '$.userData[0]')
							END) AS cmbTipoObjeto_valor

						FROM OPENJSON(jValues.value) v
					) datos
			WHERE jValues.[key] = 'jValues') oa

/* Referido: nombre desde tabla */
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
      AND CAST(JSON_VALUE(r2.value, '$[0]') AS VARCHAR(100)) = oa.selectReferido_valor
) refe

/* Clase de Riesgo*/
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

/* Acreedor*/
OUTER APPLY (
    SELECT TOP (1) 
        CASE 
            WHEN bf.isPerson = 1 
            THEN CONCAT_WS(' ',
                NULLIF(LTRIM(RTRIM(bf.name)), ''),
                NULLIF(LTRIM(RTRIM(bf.surname1)), ''),
                NULLIF(LTRIM(RTRIM(bf.surname2)), '')
            )
            ELSE LTRIM(RTRIM(bf.surname2))
        END AS name
    FROM contact bf
    WHERE bf.id = ISNULL(ed.newCessionBeneficiary, lp.cessionBeneficiary)
) bf

WHERE CAST(ed.effectiveDate AS date) BETWEEN CAST(@fstart AS DATE) AND CAST(@fend AS DATE)
AND (@ramo IS NULL OR lp.lob = @ramo)
AND (@producto IS NULL OR lp.productCode = @producto)
AND ISNULL(mo.Monto,0) <> 0
