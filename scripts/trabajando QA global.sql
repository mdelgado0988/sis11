USE sis11
GO

SELECT c.id, c.contractId, c.changeId, c.cover, c.sumInsured, c.premium, c.premiumType
		, c.lineId, c.sumInsuredCedant, c.premiumCedant, c.sumInsuredRe, c.premiumRe, c.proportionCed, c.proportionRe
		, c.comissionCedant , c.tax , c.overwritten, c.coSumInsured, c.coPremium
FROM Cession c
INNER JOIN LifeCoverage cob ON cob.id = c.coverageId
WHERE c.lifePolicyId = 4103
AND c.coverageCode = '112'
ORDER BY c.overwritten desc, c.id

SELECT c.id, c.contractId, c.changeId, c.cover, c.premium, c.premiumType
		, c.lineId, c.premiumRe, c.proportionCed, c.proportionRe
		, c.comissionCedant , c.tax , c.overwritten, c.coSumInsured, c.coPremium
FROM Cession c
INNER JOIN LifeCoverage cob ON cob.id = c.coverageId
WHERE c.lifePolicyId = 4105
AND c.coverageCode = '112'
ORDER BY c.overwritten desc, c.id

select id, code, originalPolicyId, version, policyVersion, originalPolicyId, originalStart from LifePolicy where code = 'IN-GL-000722'


select distinct name,type from PolicyEvent

WITH RenewalBatchPolicies AS (     SELECT DISTINCT         TRY_CONVERT(INT, JSON_VALUE(j.value, '$[2]')) AS policyId     FROM Batch b     INNER JOIN ImportConfig ic         ON ic.id = b.importConfigId     CROSS APPLY OPENJSON(         CASE             WHEN ISJSON(b.jData) = 1 THEN b.jData             ELSE '[]'         END     ) j     WHERE ic.category = 'ANNIVERSARYLOTEVIEW'       AND TRY_CONVERT(INT, JSON_VALUE(j.value, '$[2]')) IS NOT NULL )
SELECT     pol.id,     pol.code,     pol.originalPolicyId,     pol.policyVersion,     pol.activeDate,     pol.[start],     pol.[end],     pol.productCode,  
pol.lob 
FROM LifePolicy pol 
WHERE pol.originalPolicyId IS NOT NULL 
AND pol.originalPolicyId > 0 
AND NOT EXISTS (       SELECT 1       FROM RenewalBatchPolicies rb       WHERE rb.policyId = pol.originalPolicyId   )
ORDER BY pol.id DESC;

