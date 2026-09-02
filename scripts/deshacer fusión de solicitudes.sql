use sis11
go

declare @solicitud int = 175;
update claimPayment set parentId = null, entityState = 'DRAFT' where parentId = @solicitud;
delete claimPayment where id = @solicitud;

select * 
from claimPayment where id = 163

select * from claimPayment where parentId = 172
select * from claimPayment where id = 163

update claimPayment set parentId = null, entityState = 'DRAFT' where id in (158,157)

update claimPayment set entityState = 'APROVED' where id = 171

select * from Proceso where id in (select processId from claimPayment where id = 171)