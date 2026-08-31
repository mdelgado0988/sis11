use sis11
go

declare @solicitud int = 166;
update claimPayment set parentId = null, entityState = 'DRAFT' where parentId = @solicitud;
delete claimPayment where id = @solicitud;

select * 
from claimPayment where id = 163

select * from claimPayment where parentId = 163
select * from claimPayment where id = 163

update claimPayment set parentId = null, entityState = 'DRAFT' where id in (158,157)