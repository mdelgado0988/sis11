USE sis11

GO

DECLARE @campo VARCHAR(50) = 'cmbEdificios';
DECLARE @valor VARCHAR(50) = '8080773';
DECLARE @currentYear INT = 2026

SELECT io.lifePolicyId, pol.code, JSON_VALUE(j.value, '$.name') AS name, JSON_VALUE(j.value, '$.userData[0]') AS value
		, f.[start], f.[end], snap.Coverages
FROM insuredObject io
INNER JOIN LifePolicy pol ON pol.id = io.lifePolicyId
LEFT JOIN Anniversary an 
    ON an.lifePolicyId = pol.id 
   AND an.entityState = 'EXECUTED'
OUTER APPLY (
    SELECT 
        ISNULL(an.[start], pol.[start]) AS [start], 
        ISNULL(an.anniversary, pol.[end]) AS [end]
) f
CROSS APPLY OPENJSON(
    CASE
        WHEN ISJSON(io.jValues) = 1 THEN io.jValues
        ELSE '[]'
    END
) j
OUTER APPLY (SELECT 
				js.Coverages
			FROM OPENJSON(an.jSnapshot)
			WITH (
				Coverages    VARCHAR(MAX) '$.Coverages'
			) js) snap
WHERE io.objectDefinitionId = 46
  AND pol.activeDate IS NOT NULL 
  AND pol.active = 1
  AND JSON_VALUE(j.value, '$.name') = @campo
  AND JSON_VALUE(j.value, '$.userData[0]') = @valor
  AND CAST(f.[end] AS DATE) >= DATEFROMPARTS(@currentYear, 1, 1)
  AND CAST(f.[start] AS DATE) <= DATEFROMPARTS(@currentYear, 12, 31);