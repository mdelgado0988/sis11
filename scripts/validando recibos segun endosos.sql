use sis11

go

select top 10 b.changeId
,b.status
,b.type
,b.coverages
,b.surcharges
,b.discounts
,b.anualPremium
,b.tax
,b.anualTotal
,b.fee
,b.installment
,b.fiscalNumber
from bill b 
inner join change c on c.id = b.changeid
where c.lifepolicyid=517 and c.[status] = 1

select id
	,lifePolicyId 
	,concept 
	,expected 
	,minimum 
	,payed 
	,payedDate 
	,dueDate 
	,transferId 
	,coveredUntil 
	,allocationDate 
	,contractYear 
	,final 
	,finalDate 
	,numberInYear 
	,allocationId 
	,currency 
	,cancellationDate 
	,compensationDate 
	,custom 
	,created 
	,penaltyInterest 
	,normalDueDate 
	,changeId
from payplan
where lifepolicyid= 517