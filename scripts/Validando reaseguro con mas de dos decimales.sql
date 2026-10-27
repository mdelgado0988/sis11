use sis11

go

SELECT TOP 5
    c.id AS cessionId,
    c.lifePolicyId,
    lp.code AS policyCode,
    c.LoB AS ramo,
    lp.productCode AS producto,
    x.campo,
    x.monto
FROM Cession c
INNER JOIN LifePolicy lp
    ON lp.id = c.lifePolicyId
CROSS APPLY (
    VALUES
        ('sumInsured',       c.sumInsured),
        ('premium',          c.premium),
        ('sumInsuredCedant', c.sumInsuredCedant),
        ('premiumCedant',    c.premiumCedant),
        ('sumInsuredRe',     c.sumInsuredRe),
        ('premiumRe',        c.premiumRe),
        ('commission',       c.comissionCedant),
        ('tax',              c.tax)
) x(campo, monto)
WHERE c.overwritten = 0
  AND x.monto IS NOT NULL
  AND ABS(
        CAST(x.monto AS decimal(38,10))
        - CAST(ROUND(x.monto, 2) AS decimal(38,10))
      ) > 0.00000001
ORDER BY c.lifePolicyId DESC;