USE sis11
GO

SELECT id, contractId, changeId, cover, sumInsured, premium, premiumType, lineId, sumInsuredCedant, premiumCedant, comissionCedant, sumInsuredRe, premiumRe, tax
		, overwritten
FROM Cession
WHERE lifePolicyId = 1441
ORDER BY overwritten desc, id

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