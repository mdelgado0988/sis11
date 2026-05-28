use sis11
go

select p.minimum, p.payed, p.payedDate, a.[start], a.anniversary [end] 
from payplan p 
inner join anniversary a on a.lifepolicyid=p.lifepolicyid and a.contractYear = p.contractYear
where p.lifepolicyid  = 1

