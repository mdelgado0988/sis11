USE SIS11
GO

declare @polizaId  int = 3837
	, @loteId int = 459
delete from LifeCoverage where LifePolicyid in (@polizaId);
delete from Insured where LifePolicyid in (@polizaId);
delete from InsuredObject where LifePolicyid in (@polizaId);
delete from Account where LifePolicyid in (@polizaId);
delete from LifePolicy where id in (@polizaId);

/*--borrar batch*/
delete from batch where id = @loteId;