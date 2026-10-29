USE sis11
GO

SELECT c.id, c.contractId, c.changeId, c.cover, c.sumInsured, c.premium, c.premiumType
		, c.lineId, c.sumInsuredCedant, c.premiumCedant, c.sumInsuredRe, c.premiumRe, c.proportionCed, c.proportionRe
		, c.comissionCedant , c.tax , c.overwritten, c.coSumInsured, c.coPremium,c.err, c.msg
		, cob.code
FROM Cession c
INNER JOIN LifeCoverage cob ON cob.id = c.coverageId
WHERE c.lifePolicyId = 4686
/*and cob.code = ''*/
ORDER BY c.overwritten desc, c.id

delete c
FROM Cession c
INNER JOIN LifeCoverage cob ON cob.id = c.coverageId
WHERE c.lifePolicyId = 4600
AND c.changeId = 1685 and c.lineId = 'FRO'
/*and cob.code = ''*/
ORDER BY c.overwritten desc, c.id

SELECT c.id, c.contractId, c.changeId, c.cover, c.sumInsured, c.premium, c.premiumType
		, c.lineId, c.sumInsuredCedant, c.premiumCedant, c.sumInsuredRe, c.premiumRe, c.proportionCed, c.proportionRe
		, c.comissionCedant , c.tax , c.overwritten, c.coSumInsured, c.coPremium,c.err, c.msg
		, cob.code
FROM Cession c
INNER JOIN LifeCoverage cob ON cob.id = c.coverageId
WHERE c.changeId = 1726
ORDER BY c.overwritten desc, c.id

select id, code, originalPolicyId, version, policyVersion, originalPolicyId, originalStart from LifePolicy where code = 'IN-GL-000722'

SELECT c.changeId, c.lineId, c.premiumType, p.contactId, p.lineId, p.sumInsured, p.premium, p.split, p.commission, p.tax
FROM Cession c
INNER JOIN CessionPart p on p.cessionId = c.id
WHERE c.lifePolicyId = 4398
ORDER BY c.overwritten desc, c.id


select distinct name,type from PolicyEvent

WITH RenewalBatchPolicies AS (     SELECT DISTINCT         TRY_CONVERT(INT, JSON_VALUE(j.value, '$[2]')) AS policyId     FROM Batch b     INNER JOIN ImportConfig ic         ON ic.id = b.importConfigId     CROSS APPLY OPENJSON(         CASE             WHEN ISJSON(b.jData) = 1 THEN b.jData             ELSE '[]'         END     ) j     WHERE ic.category = 'ANNIVERSARYLOTEVIEW'       AND TRY_CONVERT(INT, JSON_VALUE(j.value, '$[2]')) IS NOT NULL )
SELECT     pol.id,     pol.code,     pol.originalPolicyId,     pol.policyVersion,     pol.activeDate,     pol.[start],     pol.[end],     pol.productCode,  
pol.lob 
FROM LifePolicy pol 
WHERE pol.originalPolicyId IS NOT NULL 
AND pol.originalPolicyId > 0 
AND NOT EXISTS (       SELECT 1       FROM RenewalBatchPolicies rb       WHERE rb.policyId = pol.originalPolicyId   )
ORDER BY pol.id DESC;

--validando
DECLARE @lifePolicyId INT = 4128;
DECLARE @lineId VARCHAR(50) = 'FAC';

WITH Partes AS (
    SELECT
        cp.cessionId,
        COUNT(*) AS cantidadAceptantes,
        SUM(ISNULL(cp.split, 0)) AS splitAceptantes,
        SUM(ISNULL(cp.sumInsured, 0)) AS sumaAceptantes,
        SUM(ISNULL(cp.premium, 0)) AS primaAceptantes,
        SUM(ISNULL(cp.commission, 0)) AS comisionAceptantes,
        SUM(ISNULL(cp.tax, 0)) AS impuestoAceptantes
    FROM CessionPart cp
    GROUP BY cp.cessionId
)
SELECT
    c.id AS cessionId,
    c.coverageCode,
    c.cover AS cobertura,
    c.lineId,

    c.sumInsuredRe AS sumaEsperada,
    ISNULL(p.sumaAceptantes, 0) AS sumaAceptantes,
    ISNULL(p.sumaAceptantes, 0) - ISNULL(c.sumInsuredRe, 0) AS diferenciaSuma,

    c.premiumRe AS primaEsperada,
    ISNULL(p.primaAceptantes, 0) AS primaAceptantes,
    ISNULL(p.primaAceptantes, 0) - ISNULL(c.premiumRe, 0) AS diferenciaPrima,

    c.comissionCedant AS comisionEsperada,
    ISNULL(p.comisionAceptantes, 0) AS comisionAceptantes,
    ISNULL(p.comisionAceptantes, 0) - ISNULL(c.comissionCedant, 0) AS diferenciaComision,

    c.tax AS impuestoEsperado,
    ISNULL(p.impuestoAceptantes, 0) AS impuestoAceptantes,
    ISNULL(p.impuestoAceptantes, 0) - ISNULL(c.tax, 0) AS diferenciaImpuesto,

    ISNULL(p.splitAceptantes, 0) AS splitAceptantes,
    ISNULL(p.cantidadAceptantes, 0) AS cantidadAceptantes
FROM Cession c
LEFT JOIN Partes p ON p.cessionId = c.id
WHERE c.lifePolicyId = @lifePolicyId
  AND c.lineId = @lineId
  AND c.overwritten = 0
ORDER BY c.coverageCode, c.id;

--con diferencias
WITH Partes AS (
    SELECT
        cp.cessionId,
        SUM(ISNULL(cp.split, 0)) AS splitAceptantes,
        SUM(ISNULL(cp.sumInsured, 0)) AS sumaAceptantes,
        SUM(ISNULL(cp.premium, 0)) AS primaAceptantes,
        SUM(ISNULL(cp.commission, 0)) AS comisionAceptantes,
        SUM(ISNULL(cp.tax, 0)) AS impuestoAceptantes
    FROM CessionPart cp
    GROUP BY cp.cessionId
)
SELECT
    c.id AS cessionId,
    c.coverageCode,
    c.cover AS cobertura,
    c.lineId,
    c.sumInsuredRe - ISNULL(p.sumaAceptantes, 0) AS diferenciaSuma,
    c.premiumRe - ISNULL(p.primaAceptantes, 0) AS diferenciaPrima,
    c.comissionCedant - ISNULL(p.comisionAceptantes, 0) AS diferenciaComision,
    c.tax - ISNULL(p.impuestoAceptantes, 0) AS diferenciaImpuesto,
    100 - ISNULL(p.splitAceptantes, 0) AS diferenciaSplit
FROM Cession c
LEFT JOIN Partes p ON p.cessionId = c.id
WHERE c.lifePolicyId = 4128
  AND c.lineId = 'FAC'
  AND c.overwritten = 0
  AND (
       ABS(c.sumInsuredRe - ISNULL(p.sumaAceptantes, 0)) > 0.01
    OR ABS(c.premiumRe - ISNULL(p.primaAceptantes, 0)) > 0.01
    OR ABS(c.comissionCedant - ISNULL(p.comisionAceptantes, 0)) > 0.01
    OR ABS(c.tax - ISNULL(p.impuestoAceptantes, 0)) > 0.01
    OR ABS(100 - ISNULL(p.splitAceptantes, 0)) > 0.000001
  )
ORDER BY c.coverageCode, c.id;