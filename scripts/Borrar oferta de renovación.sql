USE SIS11
GO

declare @polizaId  int = 1616
	, @loteId int = 318
delete from TaxGenerated where LifePolicyid in (@polizaId);
delete from LifeCoverage where LifePolicyid in (@polizaId);
delete from Insured where LifePolicyid in (@polizaId);
delete from InsuredObject where LifePolicyid in (@polizaId);
delete from Account where LifePolicyid in (@polizaId);
delete from LifePolicy where id in (@polizaId);

/*--borrar batch*/
delete from batch where id = @loteId;

return
select id, code, originalPolicyId, version, policyVersion, originalPolicyId, originalStart from LifePolicy where code = 'IN-GL-000722'