USE SIS11

GO

DECLARE  @fstart DATE = '20261001'
        ,@fend DATE =  '20261030'
		,@ramo varchar(50) = 20
		,@producto varchar(50) = 'GAP'

/* INFORMACIÓN DE PÓLIZAS (NUEVO) */
SELECT 
    lp.code AS Poliza,
    lp.lob AS [Ramo],

    prod.name AS [Plan],
    CONVERT(VARCHAR, c.birth, 103) AS FechaNacimiento,
    CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(c.name)), ''),
        NULLIF(LTRIM(RTRIM(c.middleName)), ''),
        NULLIF(LTRIM(RTRIM(c.surname1)), ''),
        NULLIF(LTRIM(RTRIM(c.surname2)), '')
    ) AS Cliente,
	CASE WHEN ISNULL(an.contractYear,0) = 1 THEN ISNULL(fr.fiscalNumber,'0') ELSE ISNULL(an.fiscalNumber,ISNULL(lp.fiscalNumber,'0')) END AS Recibo,
	FORMAT(CAST(lp.activeDate AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 'dd/MM/yyyy HH:mm:ss') AS FechaIngreso,
    CONVERT(VARCHAR, CAST(lp.activeDate AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS FechaEmision,	
    ISNULL(refe.ReferidoName, '') AS [Referido por],
    ISNULL(prcp.usuario, '') AS Usuario,
    CONVERT(VARCHAR, CAST(an.[start] AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS Desde,
    CONVERT(VARCHAR, CAST(an.[anniversary] AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS Hasta,
    CASE WHEN ISNULL(lp.policyVersion,0) = 0 THEN 'Nueva' ELSE 'Renovación' END AS Tipo,

    ISNULL(pym.name, '') AS recursopago,
    CASE WHEN lp.lob='81' THEN COALESCE(axxPay.name,
 CASE LOWER(TRIM(COALESCE(snap.periodicity,lp.periodicity))) WHEN 'y' THEN 'Anual' WHEN 's' THEN 'Semestral' WHEN 'q' THEN 'Trimestral' WHEN 'm' THEN 'Mensual' WHEN 'b' THEN 'Bimensual'
 ELSE CONCAT(N'Sin descripciÃ³n configurada (', COALESCE(snap.periodicity,lp.periodicity), ')') END)
 ELSE CASE snap.periodicity 
        WHEN 'y' THEN 'Anual'
        WHEN 'm' THEN 'Mensual'
        WHEN 'b' THEN 'Bimensual'
        WHEN 's' THEN 'Semestral'
        WHEN 'q' THEN 'Trimestral'
        ELSE lp.periodicity 
    END END AS [Forma pago],

    ISNULL(sumaAseg.sumaAseg,0) AS [Suma Aseg],
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
    CASE
        WHEN NULLIF(LTRIM(RTRIM(CONCAT_WS(' ',
            NULLIF(LTRIM(RTRIM(br.name)), ''),
            NULLIF(LTRIM(RTRIM(br.middleName)), ''),
            NULLIF(LTRIM(RTRIM(br.surname1)), ''),
            NULLIF(LTRIM(RTRIM(br.surname2)), '')
        ))), '') IS NULL THEN 'No Tiene'
        ELSE LTRIM(RTRIM(CONCAT_WS(' ',
            NULLIF(LTRIM(RTRIM(br.name)), ''),
            NULLIF(LTRIM(RTRIM(br.middleName)), ''),
            NULLIF(LTRIM(RTRIM(br.surname1)), ''),
            NULLIF(LTRIM(RTRIM(br.surname2)), ''))
        ))
    END AS [Corredor de Seguros],
    CASE WHEN lp.productCode='81FIAGCCOG' THEN COALESCE(axxBondBeneficiary.name, CASE WHEN lp.lob='81' THEN CASE WHEN ISNULL(acref.Acreedor,'')='' THEN 'No Tiene' ELSE acref.Acreedor END ELSE ISNULL(benf.name, 'No Tiene') END) ELSE CASE WHEN lp.lob='81' THEN CASE WHEN ISNULL(acref.Acreedor,'')='' THEN 'No Tiene' ELSE acref.Acreedor END ELSE ISNULL(benf.name, 'No Tiene') END END AS Beneficiario,
    CASE WHEN lp.lob='81' THEN axxObject.description ELSE NULL END AS [Descrip Objeto Afianzado],
    CASE WHEN ISNULL(acref.Acreedor, '') = '' THEN 'No Tiene' ELSE acref.Acreedor END Acreedor,
    ISNULL(c.nationalId, '0') AS [Cuenta Cobis],
    CASE WHEN lp.coinsurance > 0 THEN 'Si' ELSE 'No' END AS Coaseguro,
    CASE WHEN lp.coinsurance > 0 THEN 'Si' ELSE 'No' END AS [Es lider],
    ISNULL(cc.name, '') AS Canal

FROM lifePolicy lp
LEFT JOIN Anniversary an ON an.lifePolicyId = lp.id AND an.contractYear = 1
LEFT JOIN [dbo].[FiscalDocGenerated] fr ON fr.policyId = lp.id AND fr.[action] = 'IssuePolicy'

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
				js.cessionBeneficiary,
				js.fiscalNumber
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
				fiscalNumber VARCHAR(50) '$.fiscalNumber',
				cessionBeneficiary NUMERIC(11,0) '$.cessionBeneficiary'
			) js) snap

OUTER APPLY (
    SELECT SUM(CASE WHEN cfg.isCoverage IN ('1', 'Si', 'si', 'TRUE', 'true') THEN ISNULL(cov.insuredSum,0) ELSE 0 END) AS sumaAseg
    FROM OPENJSON(an.jSnapshot)
    WITH (
        Coverages NVARCHAR(MAX) '$.Coverages' AS JSON
    ) snapCoverages

    OUTER APPLY OPENJSON(snapCoverages.Coverages)
    WITH (
        coverageCode INT '$.code',
        insuredSum DECIMAL(18,2) '$.limit'
    ) cov

    OUTER APPLY (
        SELECT TOP 1
            JSON_VALUE(RowData,'$[0]') AS lobCode,
            JSON_VALUE(RowData,'$[1]') AS productCode,
            JSON_VALUE(RowData,'$[3]') AS coverageCode,
            JSON_VALUE(RowData,'$[5]') AS isCoverage
        FROM (
            SELECT [key] AS RowNumber, value AS RowData
            FROM [Table]
            CROSS APPLY OPENJSON(
                SUBSTRING(data, CHARINDEX('[[', data), LEN(data))
            )
            WHERE name = CASE lp.lob
                WHEN '96' THEN 'cfgCoberturaProductoReaTecnicos'
                WHEN '20' THEN 'cfgCoberturaProductoReaVidaColectivo'
                WHEN '31' THEN 'cfgCoberturaProductoReaVida'
                WHEN '71' THEN 'cfgCoberturaProductoReaVidaIndividual'
                WHEN '52' THEN 'cfgCoberturaProductoReaRiesgosVarios'
                WHEN '6' THEN 'cfgCoberturaProductoReaAuto'
                WHEN '81' THEN 'cfgCoberturaProductoReaFianza'
                WHEN '82' THEN 'cfgCoberturaProductoReaFianza'
                WHEN '83' THEN 'cfgCoberturaProductoReaFianza'
                WHEN '84' THEN 'cfgCoberturaProductoReaFianza'
                ELSE 'cfgCoberturaProductoRea'
            END
        ) x
        WHERE RowNumber > 0
          AND JSON_VALUE(RowData,'$[0]') = lp.lob
          AND JSON_VALUE(RowData,'$[1]') = lp.productCode
          AND JSON_VALUE(RowData,'$[3]') = CAST(cov.coverageCode AS VARCHAR(50))
    ) cfg
) sumaAseg
/* FIN - información de la póliza según snapshot  */

OUTER APPLY (SELECT TOP 1 mi.id, mi.contactId FROM Insured mi WHERE mi.lifePolicyId = lp.id AND mi.role = 0 ORDER BY mi.id) mainIns /* MSN-000035: cliente = asegurado principal */
LEFT JOIN Contact c ON c.id = COALESCE(mainIns.contactId, lp.holderId)        
LEFT JOIN Contact br ON br.id = snap.sellerId
LEFT JOIN Contact acre ON acre.id = snap.cessionBeneficiary
OUTER APPLY (SELECT ISNULL(CONCAT_WS(' ',
				NULLIF(LTRIM(RTRIM(acre.name)), ''),
				NULLIF(LTRIM(RTRIM(acre.middleName)), ''),
				NULLIF(LTRIM(RTRIM(acre.surname1)), ''),
				NULLIF(LTRIM(RTRIM(acre.surname2)), '')
			), 'No Tiene') AS Acreedor, acre.id) acref
LEFT JOIN Product prod ON prod.code = lp.productCode
LEFT JOIN Proceso prcp ON prcp.id = lp.processId
LEFT JOIN ChannelCatalog cc ON cc.code = snap.channel
/* MSN-000035: beneficiario = todo asegurado de la póliza que no sea el asegurado principal */
OUTER APPLY (SELECT STRING_AGG(COALESCE(NULLIF(LTRIM(RTRIM(CONCAT_WS(' ',
                NULLIF(LTRIM(RTRIM(oc.name)), ''),
                NULLIF(LTRIM(RTRIM(oc.middleName)), ''),
                NULLIF(LTRIM(RTRIM(oc.surname1)), ''),
                NULLIF(LTRIM(RTRIM(oc.surname2)), '')))), ''), LTRIM(RTRIM(oi.name))), ', ') WITHIN GROUP (ORDER BY oi.id) AS name
             FROM Insured oi LEFT JOIN Contact oc ON oc.id = oi.contactId
             WHERE oi.lifePolicyId = lp.id AND oi.id <> ISNULL(mainIns.id, -1) AND oi.contactId <> ISNULL(mainIns.contactId, -1)) benf
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
    WHERE c.id = COALESCE(mainIns.contactId, lp.holderId)
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

OUTER APPLY (SELECT TOP 1 ch.jSnapshot FROM [Change] ch WHERE ch.lifePolicyId=lp.id AND ch.status=1 AND JSON_QUERY(ch.jSnapshot,'$.InsuredObjects') IS NOT NULL ORDER BY ch.executionDate,ch.id) axxHistory
OUTER APPLY (SELECT COALESCE(JSON_QUERY(an.jSnapshot,'$.InsuredObjects'),JSON_QUERY(axxHistory.jSnapshot,'$.InsuredObjects'),(SELECT io.jValues FROM InsuredObject io WHERE io.lifePolicyId=lp.id ORDER BY io.id FOR JSON PATH)) objects) axxObjects
OUTER APPLY (SELECT TOP 1 fld.description
 FROM OPENJSON(CASE WHEN ISJSON(axxObjects.objects)=1 THEN axxObjects.objects ELSE '[]' END) obj
 CROSS APPLY OPENJSON(obj.value) WITH (jValues nvarchar(max) '$.jValues') vals
 CROSS APPLY OPENJSON(CASE WHEN ISJSON(vals.jValues)=1 THEN vals.jValues ELSE '[]' END)
 WITH (name nvarchar(100) '$.name',description nvarchar(max) '$.userData[0]') fld
 WHERE fld.name='desc_objeto_afianzado' ORDER BY TRY_CONVERT(int,obj.[key])) axxObject
OUTER APPLY (SELECT TOP 1 JSON_VALUE(custom.value,'$.name') name
 FROM OPENJSON(prod.configJson,'$.Premium.periodicity') opt
 CROSS APPLY OPENJSON(CASE WHEN opt.type=5 THEN opt.value ELSE '{}' END,'$.custom') custom
 WHERE LOWER(JSON_VALUE(custom.value,'$.expression'))=LOWER(TRIM(COALESCE(snap.periodicity,lp.periodicity)))) axxPay
OUTER APPLY (SELECT TOP 1 NULLIF(LTRIM(RTRIM(fld.nameValue)),'') name
 FROM OPENJSON(CASE WHEN ISJSON(axxObjects.objects)=1 THEN axxObjects.objects ELSE '[]' END) obj
 CROSS APPLY OPENJSON(obj.value) WITH (jValues nvarchar(max) '$.jValues') vals
 CROSS APPLY OPENJSON(CASE WHEN ISJSON(vals.jValues)=1 THEN vals.jValues ELSE '[]' END)
 WITH (fieldName nvarchar(100) '$.name',nameValue nvarchar(max) '$.userData[0]') fld
 WHERE fld.fieldName='nombre' AND NULLIF(LTRIM(RTRIM(fld.nameValue)),'') IS NOT NULL
 ORDER BY TRY_CONVERT(int,obj.[key])) axxBondBeneficiary
WHERE CAST(lp.activeDate AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS date) BETWEEN CAST(@fstart AS DATE) AND CAST(@fend AS DATE)
AND (@ramo IS NULL OR lp.lob = @ramo)
AND (@producto IS NULL OR lp.productCode = @producto)

UNION ALL

/* INFORMACIÓN DE ENDOSOS SEGÚN SU DETALLE */
SELECT 
    lp.code AS Poliza,
    lp.lob AS [Ramo],

    prod.name AS [Plan],
    CONVERT(VARCHAR, c.birth, 103) AS FechaNacimiento,
    CONCAT_WS(' ',
        NULLIF(LTRIM(RTRIM(c.name)), ''),
        NULLIF(LTRIM(RTRIM(c.middleName)), ''),
        NULLIF(LTRIM(RTRIM(c.surname1)), ''),
        NULLIF(LTRIM(RTRIM(c.surname2)), '')
    ) AS Cliente,
    ISNULL(bed.fiscalNumber, '0') AS Recibo,
	FORMAT(CAST(ed.executionDate AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 'dd/MM/yyyy HH:mm:ss') AS FechaIngreso,
    CONVERT(VARCHAR, CAST(ed.executionDate AS datetime2) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS FechaEmision,
    ISNULL(refe.ReferidoName, '') AS [Referido por],
    ISNULL(prc.usuario, '') AS Usuario,
    CASE WHEN ed.Discriminator = 'CancellationChange' THEN CONVERT(VARCHAR, ed.effectiveDate, 103)
		 ELSE CONVERT(VARCHAR, ISNULL(ed.newStart, lp.[start]) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) END AS Desde,
    CONVERT(VARCHAR, ISNULL(ed.newEnd, lp.[end]) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time', 103) AS Hasta
    ,CASE 
		WHEN ed.Discriminator = 'AddCoverageChange' THEN 'Adición de Cobertura'
		WHEN ed.Discriminator = 'BeneficiaryChange' THEN 'Cambio de Beneficiario'
		WHEN ed.Discriminator = 'BenefitChange' THEN 'Cambio de Beneficio'
		WHEN ed.Discriminator = 'CancellationChange' THEN 'Cancelación'
		WHEN ed.Discriminator = 'CapitalChange' THEN 'Cambio de Suma Asegurada'
		WHEN ed.Discriminator = 'CessionBeneficiaryChange' THEN 'Cambio de Acreedor'
		WHEN ed.Discriminator = 'ClauseChange' THEN 'Cambio de Cláusula'
		WHEN ed.Discriminator = 'ContingentBeneficiaryChange' THEN 'Cambio de Beneficiario Contingente'
		WHEN ed.Discriminator = 'CoverageChange' THEN 'Cambio de Cobertura'
		WHEN ed.Discriminator = 'CoverageChangeTechData' THEN 'Cambio Técnico de Cobertura'
		WHEN ed.Discriminator = 'ExclusionChange' THEN 'Cambio de Exclusión'
		WHEN ed.Discriminator = 'FrequencyChange' THEN 'Cambio de Frecuencia'
		WHEN ed.Discriminator = 'InformativeChange' THEN 'Cambio Informativo'
		WHEN ed.Discriminator = 'InsuredObjectChange' THEN 'Cambio de Objeto Asegurado'
		WHEN ed.Discriminator = 'IntermediaryChange' THEN 'Cambio de Intermediario'
		WHEN ed.Discriminator = 'LoadingChange' AND ISNULL(mo.Monto,0) > 0 THEN 'Cambio de Recargo de Póliza'
		WHEN ed.Discriminator = 'LoadingChange' AND ISNULL(mo.Monto,0) < 0 THEN 'Cambio de Descuento de Póliza'
		WHEN ed.Discriminator = 'LoadingChange' THEN 'Cambio de Recargo de Póliza'
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
    ,CASE WHEN lp.lob='81' THEN COALESCE(axxPay.name,
 CASE LOWER(TRIM(COALESCE(bed.periodicity,JSON_VALUE(ed.jSnapshot,'$.periodicity'),lp.periodicity))) WHEN 'y' THEN 'Anual' WHEN 's' THEN 'Semestral' WHEN 'q' THEN 'Trimestral' WHEN 'm' THEN 'Mensual' WHEN 'b' THEN 'Bimensual'
 ELSE CONCAT(N'Sin descripciÃ³n configurada (', COALESCE(bed.periodicity,JSON_VALUE(ed.jSnapshot,'$.periodicity'),lp.periodicity), ')') END)
 ELSE CASE SUBSTRING(TRIM(ISNULL(bed.periodicity, lp.periodicity)),1,1)
        WHEN 'y' THEN 'Anual'
        WHEN 'm' THEN 'Mensual'
        WHEN 'b' THEN 'Bimensual'
        WHEN 's' THEN 'Semestral'
        WHEN 'q' THEN 'Trimestral'
        ELSE TRIM(ISNULL(bed.periodicity, lp.periodicity))
    END END AS [Forma pago]
    ,CASE WHEN lp.lob='81' AND ed.Discriminator='CapitalChange' AND ed.newCapital>ed.oldCapital THEN ed.newCapital WHEN ed.Discriminator = 'CancellationChange' THEN ISNULL(sumaAsegCancela.sumaAseg,0) 
		ELSE ISNULL(sumaAsegNew.sumaAseg,0) - ISNULL(sumaAsegOld.sumaAseg,0) END 
		AS [Suma Aseg]
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
    ,CASE
        WHEN NULLIF(LTRIM(RTRIM(CONCAT_WS(' ',
            NULLIF(LTRIM(RTRIM(br.name)), ''),
            NULLIF(LTRIM(RTRIM(br.middleName)), ''),
            NULLIF(LTRIM(RTRIM(br.surname1)), ''),
            NULLIF(LTRIM(RTRIM(br.surname2)), '')
        ))), '') IS NULL THEN 'No Tiene'
        ELSE LTRIM(RTRIM(CONCAT_WS(' ',
            NULLIF(LTRIM(RTRIM(br.name)), ''),
            NULLIF(LTRIM(RTRIM(br.middleName)), ''),
            NULLIF(LTRIM(RTRIM(br.surname1)), ''),
            NULLIF(LTRIM(RTRIM(br.surname2)), ''))
        ))
    END AS [Corredor de Seguros]
    ,CASE WHEN lp.productCode='81FIAGCCOG' THEN COALESCE(axxBondBeneficiary.name, CASE WHEN lp.lob='81' THEN CASE WHEN ISNULL(bf.name,'')='' THEN 'No Tiene' ELSE bf.name END ELSE ISNULL(benf.name, 'No Tiene') END) ELSE CASE WHEN lp.lob='81' THEN CASE WHEN ISNULL(bf.name,'')='' THEN 'No Tiene' ELSE bf.name END ELSE ISNULL(benf.name, 'No Tiene') END END AS Beneficiario
    ,CASE WHEN lp.lob='81' THEN axxObject.description ELSE NULL END AS [Descrip Objeto Afianzado]
    ,CASE WHEN ISNULL(bf.name,'') = '' THEN 'No Tiene' ELSE bf.name END AS Acreedor
    ,ISNULL(c.nationalId, '0') AS [Cuenta Cobis]
    ,CASE WHEN lp.coinsurance > 0 THEN 'Si' ELSE 'No' END AS Coaseguro
    ,CASE WHEN lp.coinsurance > 0 THEN 'Si' ELSE 'No' END AS [Es lider]
    ,ISNULL(cc.name, '') AS Canal

FROM lifePolicy lp
INNER JOIN [Change] ed ON ed.lifePolicyId = lp.id AND ed.status = '1'
LEFT JOIN Proceso pr ON pr.id = ed.processId
LEFT JOIN Bill bed ON bed.changeId = ed.id
LEFT JOIN BillDiff bfed ON bfed.changeId = ed.id
OUTER APPLY (SELECT TOP 1 mi.id, mi.contactId FROM Insured mi WHERE mi.lifePolicyId = lp.id AND mi.role = 0 ORDER BY mi.id) mainIns /* MSN-000035: cliente = asegurado principal */
LEFT JOIN Contact c ON c.id = COALESCE(mainIns.contactId, ed.newPolicyholder, lp.holderId)
LEFT JOIN Contact br ON br.id = ISNULL(ed.newSellerId, lp.sellerId)
LEFT JOIN Product prod ON prod.code = lp.productCode
LEFT JOIN Proceso prc ON prc.id = ed.processId
LEFT JOIN PaymentMethodCatalog pym ON pym.code = ISNULL(ed.newpaymentMethod, lp.paymentMethod)
LEFT JOIN ChannelCatalog cc ON cc.code = ISNULL(ed.newChannel , lp.channel)
/* MSN-000035: beneficiario = todo asegurado de la póliza que no sea el asegurado principal */
OUTER APPLY (SELECT STRING_AGG(COALESCE(NULLIF(LTRIM(RTRIM(CONCAT_WS(' ',
                NULLIF(LTRIM(RTRIM(oc.name)), ''),
                NULLIF(LTRIM(RTRIM(oc.middleName)), ''),
                NULLIF(LTRIM(RTRIM(oc.surname1)), ''),
                NULLIF(LTRIM(RTRIM(oc.surname2)), '')))), ''), LTRIM(RTRIM(oi.name))), ', ') WITHIN GROUP (ORDER BY oi.id) AS name
             FROM Insured oi LEFT JOIN Contact oc ON oc.id = oi.contactId
             WHERE oi.lifePolicyId = lp.id AND oi.id <> ISNULL(mainIns.id, -1) AND oi.contactId <> ISNULL(mainIns.contactId, -1)) benf
LEFT JOIN lob lob ON lob.code = lp.lob

/* Valores monetarios => si no hay billDiff, que tome lo que genera Bill, (Cancelaciones por ejem)  */
OUTER APPLY (SELECT 
				js.surcharges,
				js.discounts,
				js.anualPremium,
				js.tax,
				js.fee,
				js.anualTotal
			FROM OPENJSON(ed.jSnapshot)
			WITH (
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
				) mo

OUTER APPLY (
    SELECT SUM(CASE WHEN cfg.isCoverage IN ('1', 'Si', 'si', 'TRUE', 'true') THEN ISNULL(cov.insuredSum,0) ELSE 0 END) AS sumaAseg
    FROM OPENJSON(ed.jNewCoverages)
    WITH (
        coverageCode INT '$.code',
        insuredSum DECIMAL(18,2) '$.limit'
    ) cov
		
    OUTER APPLY (
        SELECT TOP 1
            JSON_VALUE(RowData,'$[0]') AS lobCode,
            JSON_VALUE(RowData,'$[1]') AS productCode,
            JSON_VALUE(RowData,'$[3]') AS coverageCode,
            JSON_VALUE(RowData,'$[5]') AS isCoverage
        FROM (
            SELECT [key] AS RowNumber, value AS RowData
            FROM [Table]
            CROSS APPLY OPENJSON(
                SUBSTRING(data, CHARINDEX('[[', data), LEN(data))
            )
            WHERE name = CASE lp.lob
                WHEN '96' THEN 'cfgCoberturaProductoReaTecnicos'
                WHEN '20' THEN 'cfgCoberturaProductoReaVidaColectivo'
                WHEN '31' THEN 'cfgCoberturaProductoReaVida'
                WHEN '71' THEN 'cfgCoberturaProductoReaVidaIndividual'
                WHEN '52' THEN 'cfgCoberturaProductoReaRiesgosVarios'
                WHEN '6' THEN 'cfgCoberturaProductoReaAuto'
                WHEN '81' THEN 'cfgCoberturaProductoReaFianza'
                WHEN '82' THEN 'cfgCoberturaProductoReaFianza'
                WHEN '83' THEN 'cfgCoberturaProductoReaFianza'
                WHEN '84' THEN 'cfgCoberturaProductoReaFianza'
                ELSE 'cfgCoberturaProductoRea'
            END
        ) x
        WHERE RowNumber > 0
          AND JSON_VALUE(RowData,'$[0]') = lp.lob
          AND JSON_VALUE(RowData,'$[1]') = lp.productCode
          AND JSON_VALUE(RowData,'$[3]') = CAST(cov.coverageCode AS VARCHAR(50))
    ) cfg
) sumaAsegNew

OUTER APPLY (
    SELECT SUM(CASE WHEN cfg.isCoverage IN ('1', 'Si', 'si', 'TRUE', 'true') THEN ISNULL(cov.insuredSum,0) ELSE 0 END) AS sumaAseg
    FROM OPENJSON(ed.jOldCoverages)
    WITH (
        coverageCode INT '$.code',
        insuredSum DECIMAL(18,2) '$.limit'
    ) cov
		
    OUTER APPLY (
        SELECT TOP 1
            JSON_VALUE(RowData,'$[0]') AS lobCode,
            JSON_VALUE(RowData,'$[1]') AS productCode,
            JSON_VALUE(RowData,'$[3]') AS coverageCode,
            JSON_VALUE(RowData,'$[5]') AS isCoverage
        FROM (
            SELECT [key] AS RowNumber, value AS RowData
            FROM [Table]
            CROSS APPLY OPENJSON(
                SUBSTRING(data, CHARINDEX('[[', data), LEN(data))
            )
            WHERE name = CASE lp.lob
                WHEN '96' THEN 'cfgCoberturaProductoReaTecnicos'
                WHEN '20' THEN 'cfgCoberturaProductoReaVidaColectivo'
                WHEN '31' THEN 'cfgCoberturaProductoReaVida'
                WHEN '71' THEN 'cfgCoberturaProductoReaVidaIndividual'
                WHEN '52' THEN 'cfgCoberturaProductoReaRiesgosVarios'
                WHEN '6' THEN 'cfgCoberturaProductoReaAuto'
                WHEN '81' THEN 'cfgCoberturaProductoReaFianza'
                WHEN '82' THEN 'cfgCoberturaProductoReaFianza'
                WHEN '83' THEN 'cfgCoberturaProductoReaFianza'
                WHEN '84' THEN 'cfgCoberturaProductoReaFianza'
                ELSE 'cfgCoberturaProductoRea'
            END
        ) x
        WHERE RowNumber > 0
          AND JSON_VALUE(RowData,'$[0]') = lp.lob
          AND JSON_VALUE(RowData,'$[1]') = lp.productCode
          AND JSON_VALUE(RowData,'$[3]') = CAST(cov.coverageCode AS VARCHAR(50))
    ) cfg
) sumaAsegOld

OUTER APPLY (SELECT SUM(CASE WHEN cfg.isCoverage IN ('1', 'Si', 'si', 'TRUE', 'true') THEN -ISNULL(cov.limit,0) ELSE 0 END) AS sumaAseg
			 FROM LifeCoverage cov
			 OUTER APPLY (
				SELECT TOP 1
					JSON_VALUE(RowData,'$[0]') AS lobCode,
					JSON_VALUE(RowData,'$[1]') AS productCode,
					JSON_VALUE(RowData,'$[3]') AS coverageCode,
					JSON_VALUE(RowData,'$[5]') AS isCoverage
				FROM (
					SELECT [key] AS RowNumber, value AS RowData
					FROM [Table]
					CROSS APPLY OPENJSON(
						SUBSTRING(data, CHARINDEX('[[', data), LEN(data))
					)
					WHERE name = CASE lp.lob
					    WHEN '96' THEN 'cfgCoberturaProductoReaTecnicos'
					    WHEN '20' THEN 'cfgCoberturaProductoReaVidaColectivo'
					    WHEN '31' THEN 'cfgCoberturaProductoReaVida'
					    WHEN '71' THEN 'cfgCoberturaProductoReaVidaIndividual'
					    WHEN '52' THEN 'cfgCoberturaProductoReaRiesgosVarios'
					    WHEN '6' THEN 'cfgCoberturaProductoReaAuto'
					    WHEN '81' THEN 'cfgCoberturaProductoReaFianza'
					    WHEN '82' THEN 'cfgCoberturaProductoReaFianza'
					    WHEN '83' THEN 'cfgCoberturaProductoReaFianza'
					    WHEN '84' THEN 'cfgCoberturaProductoReaFianza'
					    ELSE 'cfgCoberturaProductoRea'
					END
				) x
				WHERE RowNumber > 0
				  AND JSON_VALUE(RowData,'$[0]') = lp.lob
				  AND JSON_VALUE(RowData,'$[1]') = lp.productCode
				  AND JSON_VALUE(RowData,'$[3]') = CAST(cov.code AS VARCHAR(50))
			) cfg
			WHERE cov.lifePolicyId = lp.id) sumaAsegCancela

/* Valores del OA */
OUTER APPLY (SELECT MAX(datos.cmbTipoObjeto_valor) cmbTipoObjeto_valor
					, MAX(datos.selectReferido_valor) selectReferido_valor
					, MAX(datos.txtNoPrestamo_valor) txtNoPrestamo_valor
					, MAX(datos.txtNoGarantia_valor) txtNoGarantia_valor
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
    WHERE c.id = COALESCE(mainIns.contactId, ed.newPolicyholder, lp.holderId)
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

OUTER APPLY (SELECT TOP 1 ch.jSnapshot FROM [Change] ch WHERE ch.lifePolicyId=lp.id AND ch.status=1 AND (ch.executionDate>ed.executionDate OR (ch.executionDate=ed.executionDate AND ch.id>ed.id)) AND JSON_QUERY(ch.jSnapshot,'$.InsuredObjects') IS NOT NULL ORDER BY ch.executionDate,ch.id) axxHistory
OUTER APPLY (SELECT COALESCE(NULLIF(ed.jNewInsuredObjects,''),JSON_QUERY(axxHistory.jSnapshot,'$.InsuredObjects'),(SELECT io.jValues FROM InsuredObject io WHERE io.lifePolicyId=lp.id ORDER BY io.id FOR JSON PATH),JSON_QUERY(ed.jSnapshot,'$.InsuredObjects')) objects) axxObjects
OUTER APPLY (SELECT TOP 1 fld.description
 FROM OPENJSON(CASE WHEN ISJSON(axxObjects.objects)=1 THEN axxObjects.objects ELSE '[]' END) obj
 CROSS APPLY OPENJSON(obj.value) WITH (jValues nvarchar(max) '$.jValues') vals
 CROSS APPLY OPENJSON(CASE WHEN ISJSON(vals.jValues)=1 THEN vals.jValues ELSE '[]' END)
 WITH (name nvarchar(100) '$.name',description nvarchar(max) '$.userData[0]') fld
 WHERE fld.name='desc_objeto_afianzado' ORDER BY TRY_CONVERT(int,obj.[key])) axxObject
OUTER APPLY (SELECT TOP 1 JSON_VALUE(custom.value,'$.name') name
 FROM OPENJSON(prod.configJson,'$.Premium.periodicity') opt
 CROSS APPLY OPENJSON(CASE WHEN opt.type=5 THEN opt.value ELSE '{}' END,'$.custom') custom
 WHERE LOWER(JSON_VALUE(custom.value,'$.expression'))=LOWER(TRIM(COALESCE(bed.periodicity,JSON_VALUE(ed.jSnapshot,'$.periodicity'),lp.periodicity)))) axxPay
OUTER APPLY (SELECT TOP 1 NULLIF(LTRIM(RTRIM(fld.nameValue)),'') name
 FROM OPENJSON(CASE WHEN ISJSON(axxObjects.objects)=1 THEN axxObjects.objects ELSE '[]' END) obj
 CROSS APPLY OPENJSON(obj.value) WITH (jValues nvarchar(max) '$.jValues') vals
 CROSS APPLY OPENJSON(CASE WHEN ISJSON(vals.jValues)=1 THEN vals.jValues ELSE '[]' END)
 WITH (fieldName nvarchar(100) '$.name',nameValue nvarchar(max) '$.userData[0]') fld
 WHERE fld.fieldName='nombre' AND NULLIF(LTRIM(RTRIM(fld.nameValue)),'') IS NOT NULL
 ORDER BY TRY_CONVERT(int,obj.[key])) axxBondBeneficiary
WHERE CAST(ed.executionDate AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS date) BETWEEN CAST(@fstart AS DATE) AND CAST(@fend AS DATE)
AND (@ramo IS NULL OR lp.lob = @ramo)
AND (@producto IS NULL OR lp.productCode = @producto)
/*AND ISNULL(mo.Monto,0) <> 0 */