USE sis11
GO

SELECT id, contractId, changeId, cover, sumInsured, premium, premiumType, lineId, sumInsuredCedant, premiumCedant, comissionCedant, sumInsuredRe, premiumRe, tax
		, overwritten
FROM Cession
WHERE lifePolicyId = 1456
ORDER BY overwritten desc, id