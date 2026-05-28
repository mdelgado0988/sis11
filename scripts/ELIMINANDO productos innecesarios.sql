use sis11

go

declare @lob varchar(5) = 'VDM';
delete from PayPlanDetail where payPlanId in (select id from PayPlan where lifePolicyId in (select id from LifePolicy where lob = @lob));
delete from payplan where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from Insured where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifeCoverage where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifePolicy where lob = @lob;
delete from product where lobcode = @lob;


declare @lob varchar(5) = 'INC';
delete from PayPlanDetail where payPlanId in (select id from PayPlan where lifePolicyId in (select id from LifePolicy where lob = @lob));
delete from payplan where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from Insured where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifeCoverage where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifePolicy where lob = @lob;
delete from product where lobcode = @lob;

declare @lob varchar(5) = 'FDC';
delete from PayPlanDetail where payPlanId in (select id from PayPlan where lifePolicyId in (select id from LifePolicy where lob = @lob));
delete from payplan where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from Insured where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifeCoverage where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifePolicy where lob = @lob;
delete from product where lobcode = @lob;

declare @lob varchar(5) = 'OSG';
delete from PayPlanDetail where payPlanId in (select id from PayPlan where lifePolicyId in (select id from LifePolicy where lob = @lob));
delete from payplan where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from Insured where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifeCoverage where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifePolicy where lob = @lob;
delete from product where lobcode = @lob;

declare @lob varchar(5) = 'RCG';
delete from PayPlanDetail where payPlanId in (select id from PayPlan where lifePolicyId in (select id from LifePolicy where lob = @lob));
delete from payplan where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from Insured where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifeCoverage where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifePolicy where lob = @lob;
delete from product where lobcode = @lob;

declare @lob varchar(5) = 'OSP';
delete from PayPlanDetail where payPlanId in (select id from PayPlan where lifePolicyId in (select id from LifePolicy where lob = @lob));
delete from payplan where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from Insured where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifeCoverage where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifePolicy where lob = @lob;
delete from product where lobcode = @lob;

declare @lob varchar(5) = 'RV';
delete from PayPlanDetail where payPlanId in (select id from PayPlan where lifePolicyId in (select id from LifePolicy where lob = @lob));
delete from payplan where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from Insured where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifeCoverage where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifePolicy where lob = @lob;
delete from product where lobcode = @lob;

declare @lob varchar(5) = 'TC';
delete from PayPlanDetail where payPlanId in (select id from PayPlan where lifePolicyId in (select id from LifePolicy where lob = @lob));
delete from payplan where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from Insured where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifeCoverage where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifePolicy where lob = @lob;
delete from product where lobcode = @lob;

declare @lob varchar(5) = 'RT';
delete from PayPlanDetail where payPlanId in (select id from PayPlan where lifePolicyId in (select id from LifePolicy where lob = @lob));
delete from payplan where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from Insured where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifeCoverage where lifePolicyId in (select id from LifePolicy where lob = @lob);
delete from LifePolicy where lob = @lob;
delete from product where lobcode = @lob;