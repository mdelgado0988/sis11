use sis11
go

SELECT
    c.id AS cessionId,
    c.lifePolicyId,
    lp.code AS poliza,
    c.coverageId,
    c.coverageCode,
    c.cover,
    c.lineId,
    c.LoB,
    c.premiumType,
    c.changeId,
    ch.executionDate,
    c.sumInsuredRe,
    c.premiumRe,
    c.sumInsuredCedant,
    c.premiumCedant
FROM Cession c
INNER JOIN LifePolicy lp
    ON lp.id = c.lifePolicyId
LEFT JOIN Change ch
    ON ch.id = c.changeId
WHERE c.premiumType = 'CANCELLATION'
  AND c.changeId IS NOT NULL
  AND lp.activeDate IS NOT NULL
  AND ch.status = 1
  AND CAST(ch.executionDate AS date)
      BETWEEN '2026-10-01' AND '2026-10-14'
  AND NOT EXISTS (
      SELECT 1
      FROM CessionPart cp
      WHERE cp.cessionId = c.id
  )
ORDER BY
    ch.executionDate,
    c.lifePolicyId,
    c.changeId,
    c.coverageId;

SELECT
    distinct 
    c.lifePolicyId, c.changeId
FROM Cession c
INNER JOIN LifePolicy lp
    ON lp.id = c.lifePolicyId
LEFT JOIN Change ch
    ON ch.id = c.changeId
WHERE  c.changeId IS NOT NULL
  AND lp.activeDate IS NOT NULL
  AND ch.status = 1
  AND CAST(ch.executionDate AS date)
      BETWEEN '2026-09-01' AND '2026-10-14'
  AND NOT EXISTS (
      SELECT 1
      FROM CessionPart cp
      WHERE cp.cessionId = c.id
  )
ORDER BY 1;

select * from CessionPart where cessionId in (select id from cession where lifePolicyId = 3669)

select * from cession where lifePolicyId = 3669
select * from CessionPart where cessionId in (select id from cession where lifePolicyId = 3669)