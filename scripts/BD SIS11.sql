use sis11
go

return;

CREATE TABLE [dbo].[Account] ( [id] int IDENTITY(1,1) NOT NULL, [holderId] int NOT NULL, [lifePolicyId] int NULL, [accNo] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL, [currency] nvarchar(MAX) NULL, [investmentPlanCode] nvarchar(450) NULL, [name] nvarchar(MAX) NULL, [contractId] int NULL, [code] nvarchar(MAX) NULL, [bankAccountOpenDate] datetime2 NULL, [bankAccountType] nvarchar(MAX) NULL, [bankCode] nvarchar(450) NULL, [openingAmount] decimal(18,2) NOT NULL, [iban] nvarchar(MAX) NULL, [branchCode] nvarchar(450) NULL, [catalogAccountCode] nvarchar(450) NULL, [creditId] int NULL, [pensionSchemeId] int NULL, [checkBookCode] nvarchar(450) NULL, [fundId] int NULL, [pensionAccountType] nvarchar(MAX) NULL, [pensionMemberId] int NULL );
CREATE TABLE [dbo].[AccountGroup] ( [code] nvarchar(450) NOT NULL, [group] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [currency] nvarchar(MAX) NULL, [accountId] int NOT NULL );
CREATE TABLE [dbo].[AccountMov] ( [id] int IDENTITY(1,1) NOT NULL, [accountId] int NOT NULL, [date] datetime2 NOT NULL, [bid] decimal(18,2) NOT NULL, [ask] decimal(18,2) NOT NULL, [transaction] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [amountToUnits] decimal(18,2) NOT NULL, [units] decimal(18,2) NOT NULL, [transferId] int NOT NULL, [transactionCode] nvarchar(MAX) NULL, [amount_af] decimal(18,2) NOT NULL, [fundingFactor] float NOT NULL, [units_af] decimal(18,2) NOT NULL, [amountBalance] decimal(18,2) NOT NULL, [unitBalance] decimal(18,2) NOT NULL );
CREATE TABLE [dbo].[AccountPending] ( [id] int IDENTITY(1,1) NOT NULL, [accountId] int NOT NULL, [date] datetime2 NOT NULL, [transactionCode] nvarchar(MAX) NULL, [transaction] nvarchar(MAX) NULL, [amount] decimal(18,10) NOT NULL, [yearMonth] int NOT NULL, [amount_af] decimal(18,10) NOT NULL );
CREATE TABLE [dbo].[ActionCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [cmd] nvarchar(MAX) NULL, [data] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[AddressTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [personType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Agent] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [active] bit NOT NULL, [created] datetime2 NOT NULL, [start] datetime2 NULL, [end] datetime2 NULL, [processId] int NULL, [contactId] int NOT NULL, [agentType] nvarchar(450) NULL, [jCustomForms] nvarchar(MAX) NULL, [jTags] nvarchar(MAX) NULL, [license] nvarchar(MAX) NULL, [licenseDate] datetime2 NULL, [note] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[AgentChange] ( [id] int IDENTITY(1,1) NOT NULL, [agentId] int NOT NULL, [processId] int NULL, [creation] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [jBefore] nvarchar(MAX) NULL, [jAfter] nvarchar(MAX) NULL, [status] int NOT NULL, [operation] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[AgentDocument] ( [id] int IDENTITY(1,1) NOT NULL, [agentId] nvarchar(MAX) NULL, [templateName] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [status] nvarchar(450) NULL, [requirementId] int NULL );
CREATE TABLE [dbo].[AgentRequirement] ( [id] int IDENTITY(1,1) NOT NULL, [agentId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [blockLevel] int NOT NULL, [request] bit NOT NULL, [requestDate] datetime2 NULL, [response] bit NOT NULL, [responseDate] datetime2 NULL, [comments] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[AgentType] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Allocation] ( [id] int IDENTITY(1,1) NOT NULL, [date] datetime2 NOT NULL, [automatic] bit NOT NULL, [transferAmount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [deficitSource] nvarchar(MAX) NULL, [differenceAmount] decimal(18,2) NOT NULL, [premiumAmount] decimal(18,2) NOT NULL, [surplusDestination] nvarchar(MAX) NULL, [transactionDate] datetime2 NOT NULL, [fromTransitAmount] decimal(18,2) NOT NULL, [supplementaryAmount] decimal(18,2) NOT NULL, [user] nvarchar(MAX) NULL, [reversalDate] datetime2 NULL, [compensationAmount] decimal(18,2) NOT NULL, [transferWorkspaceId] int NULL );
CREATE TABLE [dbo].[AllocationDocument] ( [id] int IDENTITY(1,1) NOT NULL, [allocationId] int NOT NULL, [name] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [association] nvarchar(MAX) NULL, [status] nvarchar(450) NULL );
CREATE TABLE [dbo].[AllocationInstallment] ( [id] int IDENTITY(1,1) NOT NULL, [allocationId] int NOT NULL, [lifePolicyId] int NOT NULL, [payPlanId] int NOT NULL, [moneyInAmount] decimal(18,2) NOT NULL, [transitAmount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [dueAmount] decimal(18,2) NOT NULL, [compensationAmount] decimal(18,2) NOT NULL, [compensationType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[AllocationSupplementary] ( [id] int IDENTITY(1,1) NOT NULL, [allocationId] int NOT NULL, [lifePolicyId] int NOT NULL, [destination] nvarchar(MAX) NULL, [moneyInAmount] decimal(18,2) NOT NULL, [transitAmount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [accountId] int NOT NULL, [creditId] int NULL );
CREATE TABLE [dbo].[AmlCase] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [processId] int NOT NULL, [created] datetime2 NOT NULL, [entityState] nvarchar(MAX) NULL, [LifePolicyid] int NULL, [note] nvarchar(MAX) NULL, [policyId] int NULL, [lifeRequirementId] int NULL );
CREATE TABLE [dbo].[AmlRiskCatalog] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Anniversary] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [created] datetime2 NOT NULL, [anniversary] datetime2 NOT NULL, [processId] int NULL, [entityState] nvarchar(MAX) NULL, [note] nvarchar(MAX) NULL, [executionDate] datetime2 NULL, [contractYear] int NOT NULL, [start] datetime2 NOT NULL, [duration] int NOT NULL, [indexation] int NOT NULL, [insuredSum] decimal(18,2) NOT NULL, [jSnapshot] nvarchar(MAX) NULL, [periodicity] nvarchar(MAX) NULL, [premium] decimal(18,2) NOT NULL, [fiscalNumber] nvarchar(MAX) NULL, [receiptTypeCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[Annuity] ( [id] int IDENTITY(1,1) NOT NULL, [active] bit NOT NULL, [limit] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [beneficiaryId] int NOT NULL, [start] datetime2 NULL, [end] datetime2 NULL, [endCause] nvarchar(MAX) NULL, [entityState] nvarchar(MAX) NULL, [frequency] nvarchar(MAX) NULL, [destinationAccountId] int NOT NULL, [sourceAccountId] int NOT NULL, [lifePolicyId] int NULL, [claimId] int NULL, [amount] decimal(18,2) NOT NULL, [installments] int NULL, [paymentsMade] int NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [productCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[AnnuityChange] ( [id] int IDENTITY(1,1) NOT NULL, [annuityId] int NOT NULL, [processId] int NULL, [creation] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [jBefore] nvarchar(MAX) NULL, [jAfter] nvarchar(MAX) NULL, [status] int NOT NULL, [operation] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[AnnuityPayment] ( [id] int IDENTITY(1,1) NOT NULL, [annuityId] int NOT NULL, [due] datetime2 NOT NULL, [amount] decimal(18,2) NOT NULL, [ok] bit NOT NULL, [msg] nvarchar(MAX) NULL, [lastExeDate] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [requestId] int NULL );
CREATE TABLE [dbo].[AnnuityProduct] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[App] ( [code] nvarchar(450) NOT NULL, [version] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [icon] nvarchar(MAX) NULL, [author] nvarchar(MAX) NULL, [published] bit NOT NULL, [publishDate] datetime2 NULL, [rating] decimal(18,2) NOT NULL, [installed] bit NOT NULL, [installDate] datetime2 NULL, [enabled] bit NOT NULL, [lastEnabled] datetime2 NULL, [jUserData] nvarchar(MAX) NULL, [jPackage] nvarchar(MAX) NULL, [appType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[AreaServedCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[AreaServedDetailCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [areaServedCode] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[AssetType] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Audit] ( [id] int IDENTITY(1,1) NOT NULL, [claimId] int NOT NULL, [auditDate] datetime2 NOT NULL, [status] int NOT NULL, [summary] nvarchar(MAX) NULL, [formId] int NULL, [jValues] nvarchar(MAX) NULL, [processId] int NULL );
CREATE TABLE [dbo].[AuditLog] ( [id] int IDENTITY(1,1) NOT NULL, [user] nvarchar(MAX) NULL, [date] datetime2 NOT NULL, [cmd] nvarchar(MAX) NULL, [dto] nvarchar(MAX) NULL, [msg] nvarchar(MAX) NULL, [ok] bit NOT NULL, [texe] bigint NOT NULL );
CREATE TABLE [dbo].[Bank] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[BankAccountTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Batch] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [launched] datetime2 NULL, [jData] nvarchar(MAX) NULL, [status] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [records] int NOT NULL, [priority] int NOT NULL, [importConfigId] int NOT NULL, [user] nvarchar(MAX) NULL, [error] int NOT NULL, [success] int NOT NULL, [processingType] int NOT NULL, [dataCols] int NOT NULL, [groupName] nvarchar(MAX) NULL, [restricted] bit NOT NULL );
CREATE TABLE [dbo].[BatchAllowedUsers] ( [id] int IDENTITY(1,1) NOT NULL, [batchId] int NOT NULL, [user] nvarchar(450) NULL );
CREATE TABLE [dbo].[Beneficiary] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [contactId] int NOT NULL, [name] nvarchar(MAX) NULL, [percentage] decimal(18,2) NOT NULL, [mandatory] bit NOT NULL, [type] nvarchar(MAX) NULL, [coverageCode] nvarchar(MAX) NULL, [relationshipId] int NULL, [paymentMethod] nvarchar(MAX) NULL, [branchId] int NULL );
CREATE TABLE [dbo].[Benefit] ( [code] nvarchar(MAX) NULL, [coverageCode] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [copay] decimal(18,2) NULL, [covered] decimal(18,2) NOT NULL, [rule] nvarchar(MAX) NULL, [deductible] decimal(18,2) NULL, [aDeductible] decimal(18,2) NULL, [qDeductible] decimal(18,2) NULL, [mDeductible] decimal(18,2) NULL, [limit] decimal(18,2) NULL, [aLimit] decimal(18,2) NULL, [qLimit] decimal(18,2) NULL, [mLimit] decimal(18,2) NULL, [familyLimit] decimal(18,2) NULL, [lifetimeLimit] decimal(18,2) NULL, [eventaTimes] int NULL, [eventqTimes] int NULL, [eventmTimes] int NULL, [eventdTimes] int NULL, [outOfPocketAnualLimit] decimal(18,2) NULL, [waitingPeriod] int NULL, [id] int IDENTITY(1,1) NOT NULL, [lifeCoverageId] int NOT NULL, [group] nvarchar(MAX) NULL, [group2] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[BenefitOperation] ( [id] int IDENTITY(1,1) NOT NULL, [pensionSchemeId] int NOT NULL, [pensionMemberId] int NOT NULL, [processId] int NULL, [status] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [operationType] int NOT NULL, [amount] decimal(18,2) NOT NULL, [executionDate] datetime2 NULL, [currency] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Bill] ( [id] int IDENTITY(1,1) NOT NULL, [changeId] int NULL, [status] int NOT NULL, [type] nvarchar(MAX) NULL, [coverages] decimal(18,2) NOT NULL, [surcharges] decimal(18,2) NOT NULL, [discounts] decimal(18,2) NOT NULL, [anualPremium] decimal(18,2) NOT NULL, [tax] decimal(18,2) NOT NULL, [anualTotal] decimal(18,2) NOT NULL, [fee] decimal(18,2) NOT NULL, [installment] decimal(18,2) NOT NULL, [paymentMethod] nvarchar(MAX) NULL, [periodicity] nvarchar(MAX) NULL, [fiscalNumber] nvarchar(MAX) NULL, [receiptTypeCode] nvarchar(450) NULL, [jFees] nvarchar(MAX) NULL, [jTaxes] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[BillDiff] ( [id] int IDENTITY(1,1) NOT NULL, [changeId] int NULL, [coverages] decimal(18,2) NOT NULL, [surcharges] decimal(18,2) NOT NULL, [discounts] decimal(18,2) NOT NULL, [annualPremium] decimal(18,2) NOT NULL, [tax] decimal(18,2) NOT NULL, [annualTotal] decimal(18,2) NOT NULL, [fee] decimal(18,2) NOT NULL, [installment] decimal(18,2) NOT NULL, [jFees] nvarchar(MAX) NULL, [jTaxes] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[BillUnique] ( [id] int IDENTITY(1,1) NOT NULL, [changeId] int NULL, [status] int NOT NULL, [charges] decimal(18,2) NOT NULL, [uniqueTax] decimal(18,2) NOT NULL, [concept] nvarchar(MAX) NULL, [dueDate] datetime2 NULL, [fiscalNumber] nvarchar(MAX) NULL, [receiptTypeCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[Branch] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [active] bit NOT NULL, [organizationId] int NULL, [groupId] int NULL );
CREATE TABLE [dbo].[Budget] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [year] int NOT NULL, [status] nvarchar(MAX) NULL, [owner] nvarchar(MAX) NULL, [createdAt] datetime2 NOT NULL, [updatedAt] datetime2 NOT NULL, [defaultScenarioId] int NULL );
CREATE TABLE [dbo].[BudgetActual] ( [id] int IDENTITY(1,1) NOT NULL, [year] int NOT NULL, [month] int NOT NULL, [entityType] nvarchar(MAX) NULL, [entityId] nvarchar(MAX) NULL, [entityName] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [recordedAt] datetime2 NOT NULL, [period] nvarchar(MAX) NULL, [createdAt] datetime2 NOT NULL, [updatedAt] datetime2 NOT NULL );
CREATE TABLE [dbo].[BudgetCategory] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [categoryType] nvarchar(MAX) NULL, [isActive] bit NOT NULL, [order] int NOT NULL, [budgetId] int NOT NULL );
CREATE TABLE [dbo].[BudgetLine] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [budgetId] int NOT NULL, [scenarioId] int NULL, [categoryId] int NOT NULL, [lineType] nvarchar(MAX) NULL, [isActive] bit NOT NULL, [order] int NOT NULL, [jan] decimal(18,2) NOT NULL, [feb] decimal(18,2) NOT NULL, [mar] decimal(18,2) NOT NULL, [apr] decimal(18,2) NOT NULL, [may] decimal(18,2) NOT NULL, [jun] decimal(18,2) NOT NULL, [jul] decimal(18,2) NOT NULL, [aug] decimal(18,2) NOT NULL, [sep] decimal(18,2) NOT NULL, [oct] decimal(18,2) NOT NULL, [nov] decimal(18,2) NOT NULL, [dec] decimal(18,2) NOT NULL, [mappingType] nvarchar(MAX) NULL, [mappingId] nvarchar(MAX) NULL, [mappingName] nvarchar(MAX) NULL, [adjustmentType] nvarchar(MAX) NULL, [adjustmentValue] decimal(18,2) NOT NULL );
CREATE TABLE [dbo].[BudgetScenario] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [budgetId] int NOT NULL, [isDefault] bit NOT NULL, [createdAt] datetime2 NOT NULL, [updatedAt] datetime2 NOT NULL );
CREATE TABLE [dbo].[BulkTransactions] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [jTransactions] nvarchar(MAX) NULL, [status] int NOT NULL, [transactionDate] datetime2 NOT NULL );
CREATE TABLE [dbo].[BusinessTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CalcSheet] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [jData] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CalculationScheme] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [category] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CashFund] ( [id] int IDENTITY(1,1) NOT NULL, [user] nvarchar(450) NULL, [transferWorkspaceId] int NULL, [updated] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [balance] decimal(18,2) NOT NULL );
CREATE TABLE [dbo].[CatalogAccount] ( [code] nvarchar(450) NOT NULL, [parentCode] nvarchar(450) NULL, [name] nvarchar(MAX) NULL, [currency] nvarchar(MAX) NULL, [isDetail] bit NOT NULL, [level] int NOT NULL, [accountType] nvarchar(MAX) NULL, [auxType] nvarchar(MAX) NULL, [nature] nvarchar(MAX) NULL, [businessTypeCode] nvarchar(450) NULL, [jBranches] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CatalogAccountType] ( [name] nvarchar(MAX) NULL, [code] nvarchar(450) NOT NULL );
CREATE TABLE [dbo].[CatalogAuxType] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [entity] nvarchar(MAX) NULL, [values] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Cession] ( [id] int IDENTITY(1,1) NOT NULL, [contractId] int NOT NULL, [lifePolicyId] int NOT NULL, [coverageId] int NOT NULL, [lineId] nvarchar(MAX) NULL, [cover] nvarchar(MAX) NULL, [LoB] nvarchar(MAX) NULL, [product] nvarchar(MAX) NULL, [policyCode] nvarchar(MAX) NULL, [start] datetime2 NOT NULL, [end] datetime2 NULL, [msg] nvarchar(MAX) NULL, [sumInsured] decimal(22,6) NOT NULL, [premium] decimal(22,6) NOT NULL, [premiumType] nvarchar(MAX) NULL, [sumInsuredCedant] decimal(22,6) NOT NULL, [premiumCedant] decimal(22,6) NOT NULL, [comissionCedant] decimal(22,6) NOT NULL, [sumInsuredRe] decimal(22,6) NOT NULL, [premiumRe] decimal(22,6) NOT NULL, [err] bit NOT NULL, [holderName] nvarchar(MAX) NULL, [proportionCed] float NOT NULL, [proportionRe] float NOT NULL, [currency] nvarchar(MAX) NULL, [distributionMode] int NOT NULL, [contactId] int NOT NULL, [coverageCode] nvarchar(MAX) NULL, [coCommission] decimal(22,6) NOT NULL, [coPercentage] decimal(22,6) NOT NULL, [coPremium] decimal(22,6) NOT NULL, [coSumInsured] decimal(22,6) NOT NULL, [np] bit NOT NULL, [overwritten] bit NOT NULL, [changeId] int NULL, [anniversaryId] int NULL, [reserve] decimal(22,6) NOT NULL, [oldContractId] int NULL, [edited] datetime2 NULL, [loading] decimal(22,6) NOT NULL, [loadingCedant] decimal(22,6) NOT NULL, [loadingRe] decimal(22,6) NOT NULL, [sumInsuredComputed] decimal(22,6) NOT NULL, [fee] decimal(22,6) NOT NULL, [tax] decimal(22,6) NOT NULL, [nonTechnicalPremium] decimal(22,6) NOT NULL, [credit] decimal(22,6) NOT NULL );
CREATE TABLE [dbo].[CessionPart] ( [id] int IDENTITY(1,1) NOT NULL, [cessionId] int NOT NULL, [contactId] int NOT NULL, [lineId] nvarchar(MAX) NULL, [split] decimal(22,6) NOT NULL, [sumInsured] decimal(22,6) NOT NULL, [premium] decimal(22,6) NOT NULL, [name] nvarchar(MAX) NULL, [liquidationId] int NULL, [currency] nvarchar(MAX) NULL, [commission] decimal(22,6) NOT NULL, [tax] decimal(22,6) NOT NULL, [brokerId] int NULL, [reserve] decimal(22,6) NOT NULL, [fee] decimal(22,6) NOT NULL );
CREATE TABLE [dbo].[Chain] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [operation] nvarchar(MAX) NULL, [category] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Change] ( [id] int IDENTITY(1,1) NOT NULL, [status] int NOT NULL, [lifePolicyId] int NOT NULL, [effectiveDate] datetime2 NOT NULL, [code] nvarchar(MAX) NULL, [note] nvarchar(MAX) NULL, [Discriminator] nvarchar(MAX) NOT NULL, [oldCapital] decimal(18,2) NULL, [newCapital] decimal(18,2) NULL, [cancellationBillId] int NULL, [executionDate] datetime2 NOT NULL, [jNewCoverages] nvarchar(MAX) NULL, [jOldCoverages] nvarchar(MAX) NULL, [jNewBeneficiaries] nvarchar(MAX) NULL, [jOldBeneficiaries] nvarchar(MAX) NULL, [newInvestmentCode] nvarchar(MAX) NULL, [oldInvestmentCode] nvarchar(MAX) NULL, [byHolder] bit NULL, [reason] nvarchar(MAX) NULL, [accountId] int NULL, [oldAccountValue] decimal(18,2) NULL, [rescueAmount] decimal(18,2) NULL, [policyValue] decimal(18,2) NULL, [reasonCode] nvarchar(MAX) NULL, [daysLapsed] int NULL, [lapseReason] nvarchar(MAX) NULL, [accountType] nvarchar(MAX) NULL, [newIndexation] int NULL, [oldIndexation] int NULL, [jAddedCoverages] nvarchar(MAX) NULL, [jBeforeCoverages] nvarchar(MAX) NULL, [jAfterRemovedCoverages] nvarchar(MAX) NULL, [RemoveCoverageChange_jBeforeCoverages] nvarchar(MAX) NULL, [newPlan] nvarchar(MAX) NULL, [oldPlan] nvarchar(MAX) NULL, [jNTSacum] nvarchar(MAX) NULL, [jTransactions] nvarchar(MAX) NULL, [netTotalSurrenderValue] decimal(18,2) NULL, [reducedSum] decimal(18,2) NULL, [processId] int NULL, [bonusAmount] decimal(18,2) NULL, [bonusTypeCode] nvarchar(MAX) NULL, [bonusReasonCode] nvarchar(MAX) NULL, [destinationAccountType] nvarchar(MAX) NULL, [newFrequency] nvarchar(MAX) NULL, [oldFrequency] nvarchar(MAX) NULL, [newModalPremium] decimal(18,2) NULL, [oldModalPremium] decimal(18,2) NULL, [newCessionBeneficiary] int NULL, [oldCessionBeneficiary] int NULL, [daysInsured] int NULL, [NotTakenUpChange_reason] nvarchar(MAX) NULL, [newPaymentMethod] nvarchar(MAX) NULL, [oldPaymentMethod] nvarchar(MAX) NULL, [newIntermediary] int NULL, [oldIntermediary] int NULL, [newPolicyholder] int NULL, [oldPolicyholder] int NULL, [newIndexationPeriod] int NULL, [newJIndexationPlan] nvarchar(MAX) NULL, [oldIndexationPeriod] int NULL, [oldJIndexationPlan] nvarchar(MAX) NULL, [contractYear] int NOT NULL, [creationDate] datetime2 NOT NULL, [anniversary] int NOT NULL, [jSourceAccounts] nvarchar(MAX) NULL, [jDetail] nvarchar(MAX) NULL, [maturityValue] decimal(18,2) NULL, [jNewInvestmentSelection] nvarchar(MAX) NULL, [jOldInvestmentSelection] nvarchar(MAX) NULL, [RedirectionChange_jNewInvestmentSelection] nvarchar(MAX) NULL, [RedirectionChange_jOldInvestmentSelection] nvarchar(MAX) NULL, [jNewClauses] nvarchar(MAX) NULL, [jOldClauses] nvarchar(MAX) NULL, [jAmendments] nvarchar(MAX) NULL, [jNewExclusions] nvarchar(MAX) NULL, [jOldExclusions] nvarchar(MAX) NULL, [newEnd] datetime2 NULL, [newStart] datetime2 NULL, [oldEnd] datetime2 NULL, [oldStart] datetime2 NULL, [jAddedCertificates] nvarchar(MAX) NULL, [jRemovedCertificates] nvarchar(MAX) NULL, [previousAnniversary] bit NULL, [jNewInsuredObjects] nvarchar(MAX) NULL, [jOldInsuredObjects] nvarchar(MAX) NULL, [newReAdjustment] decimal(18,4) NULL, [oldReAdjustment] decimal(18,4) NULL, [newReEvaluation] decimal(18,4) NULL, [oldReEvaluation] decimal(18,4) NULL, [jNewCoInsureds] nvarchar(MAX) NULL, [jOldCoInsureds] nvarchar(MAX) NULL, [newAnnuityBeneficiary] int NULL, [oldAnnuityBeneficiary] int NULL, [newGroup] nvarchar(MAX) NULL, [oldGroup] nvarchar(MAX) NULL, [jNewPayPlan] nvarchar(MAX) NULL, [cancellationProrateMode] int NULL, [changeIdToBeAmended] int NULL, [jEditedPayPlan] nvarchar(MAX) NULL, [jOldPayPlan] nvarchar(MAX) NULL, [newTemporalStatus] bit NULL, [oldTemporalStatus] bit NULL, [newSellerId] int NULL, [oldSellerId] int NULL, [jNewContingentBeneficiaries] nvarchar(MAX) NULL, [jOldContingentBeneficiaries] nvarchar(MAX) NULL, [newIndexationFrequency] int NULL, [newIndexationStart] int NULL, [oldIndexationFrequency] int NULL, [oldIndexationStart] int NULL, [jSnapshot] nvarchar(MAX) NULL, [newBranchCode] nvarchar(MAX) NULL, [newChannel] nvarchar(MAX) NULL, [newSegment] nvarchar(MAX) NULL, [oldBranchCode] nvarchar(MAX) NULL, [oldChannel] nvarchar(MAX) NULL, [oldSegment] nvarchar(MAX) NULL, [cancellationOption] nvarchar(MAX) NULL, [newComPercentage] decimal(18,4) NULL, [oldComPercentage] decimal(18,4) NULL, [newJComParticipants] nvarchar(MAX) NULL, [oldJComParticipants] nvarchar(MAX) NULL, [informative] bit NOT NULL, [startDate] datetime2 NULL, [jNewSurcharges] nvarchar(MAX) NULL, [jOldSurcharges] nvarchar(MAX) NULL, [CancellationChange_reason] nvarchar(MAX) NULL, [newJCessionBeneficiary] nvarchar(MAX) NULL, [oldJCessionBeneficiary] nvarchar(MAX) NULL, [jAdditional] nvarchar(MAX) NULL, [newIndexationInsuredSum] decimal(18,4) NULL, [newIndexationPremium] decimal(18,4) NULL, [oldIndexationInsuredSum] decimal(18,4) NULL, [oldIndexationPremium] decimal(18,4) NULL, [mode] int NULL );
CREATE TABLE [dbo].[ChangeSurcharge] ( [id] int IDENTITY(1,1) NOT NULL, [changeId] int NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [value] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ChannelCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [segmentCode] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CheckBook] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [counterCode] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Checklist] ( [id] int IDENTITY(1,1) NOT NULL, [checklistTemplateId] int NOT NULL, [checklistTemplateVersion] int NOT NULL, [entityType] nvarchar(MAX) NULL, [entityId] nvarchar(MAX) NULL, [status] int NOT NULL, [startedDate] datetime2 NULL, [completedDate] datetime2 NULL, [startedByUser] nvarchar(MAX) NULL, [completedByUser] nvarchar(MAX) NULL, [progress] decimal(18,2) NOT NULL, [comments] nvarchar(MAX) NULL, [updatedDate] datetime2 NULL );
CREATE TABLE [dbo].[ChecklistItem] ( [id] int IDENTITY(1,1) NOT NULL, [checklistId] int NOT NULL, [checklistTemplateItemId] int NOT NULL, [status] int NOT NULL, [comments] nvarchar(MAX) NULL, [completedByUser] nvarchar(MAX) NULL, [completedDate] datetime2 NULL, [updatedDate] datetime2 NULL );
CREATE TABLE [dbo].[ChecklistTemplate] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [active] bit NOT NULL, [order] int NOT NULL, [version] int NOT NULL, [createdDate] datetime2 NOT NULL, [updatedDate] datetime2 NULL, [createdByUser] nvarchar(MAX) NULL, [updatedByUser] nvarchar(MAX) NULL, [entityType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ChecklistTemplateItem] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [group] nvarchar(MAX) NULL, [item] nvarchar(MAX) NULL, [condition] nvarchar(MAX) NULL, [order] int NOT NULL, [mandatory] bit NOT NULL, [checklistTemplateId] int NOT NULL, [subGroup] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CityCatalog] ( [id] int IDENTITY(1,1) NOT NULL, [stateCode] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Claim] ( [id] int IDENTITY(1,1) NOT NULL, [created] datetime2 NULL, [nameOfPatient] nvarchar(MAX) NULL, [contactId] int NOT NULL, [genderMale] bit NOT NULL, [occurrence] datetime2 NOT NULL, [contactNumber] nvarchar(MAX) NULL, [insuredId] nvarchar(MAX) NULL, [employeeId] nvarchar(MAX) NULL, [companyName] nvarchar(MAX) NULL, [inNetwork] bit NOT NULL, [nameOfDoctor] nvarchar(MAX) NULL, [drContactNumber] nvarchar(MAX) NULL, [disease] nvarchar(MAX) NULL, [clinicalFindings] nvarchar(MAX) NULL, [ailmentDuration] int NOT NULL, [firstConsultation] datetime2 NOT NULL, [pastHistory] nvarchar(MAX) NULL, [provisionalDiagnosis] nvarchar(MAX) NULL, [icd] nvarchar(MAX) NULL, [proposedLOT] nvarchar(MAX) NULL, [investigationalDetails] nvarchar(MAX) NULL, [routeOfDrug] nvarchar(MAX) NULL, [nameOfSurgery] nvarchar(MAX) NULL, [icd10pcs] nvarchar(MAX) NULL, [otherTreatments] nvarchar(MAX) NULL, [howInjury] nvarchar(MAX) NULL, [isRTA] bit NOT NULL, [dateOfInjury] datetime2 NOT NULL, [substanceAbuse] bit NOT NULL, [substanceAbuseTest] bit NOT NULL, [maternityCase] nvarchar(MAX) NULL, [deliveryDate] datetime2 NOT NULL, [feeConsultation] decimal(18,2) NOT NULL, [feeTreatment] decimal(18,2) NOT NULL, [feeSurgery] decimal(18,2) NOT NULL, [feeOther] decimal(18,2) NOT NULL, [feeTotal] decimal(18,2) NOT NULL, [feeDescription] nvarchar(MAX) NULL, [processId] int NULL, [approvalResponse] nvarchar(MAX) NULL, [approvalMotive] nvarchar(MAX) NULL, [approvalComments] nvarchar(MAX) NULL, [claimerId] int NOT NULL, [claimType] nvarchar(MAX) NULL, [lifePolicyId] int NOT NULL, [closed] bit NOT NULL, [closedDate] datetime2 NULL, [closureType] nvarchar(MAX) NULL, [closureComments] nvarchar(MAX) NULL, [closureMotive] nvarchar(MAX) NULL, [insuredEvent] nvarchar(450) NULL, [eventReason] nvarchar(450) NULL, [elegibleCoverages] nvarchar(MAX) NULL, [reEventId] int NULL, [notification] datetime2 NULL, [cashCall] bit NOT NULL, [claimsCooperationClause] bit NOT NULL, [code] nvarchar(MAX) NULL, [jRelated] nvarchar(MAX) NULL, [jCustomForms] nvarchar(MAX) NULL, [cashCallReceived] bit NOT NULL, [jMap] nvarchar(MAX) NULL, [masterClaimId] int NULL, [isMasterClaim] bit NOT NULL, [description] nvarchar(MAX) NULL, [organizationId] int NULL, [paymentMethodCode] nvarchar(MAX) NULL, [stageCode] nvarchar(450) NULL, [externalId] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ClaimDocument] ( [id] int IDENTITY(1,1) NOT NULL, [claimId] int NOT NULL, [LifePolicyid] int NOT NULL, [contactId] int NOT NULL, [name] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [association] nvarchar(MAX) NULL, [status] nvarchar(450) NULL );
CREATE TABLE [dbo].[ClaimEvent] ( [id] int IDENTITY(1,1) NOT NULL, [claimId] int NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL, [user] nvarchar(MAX) NULL, [date] datetime2 NOT NULL );
CREATE TABLE [dbo].[ClaimExpenseCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ClaimPayment] ( [id] int IDENTITY(1,1) NOT NULL, [claimId] int NULL, [contactId] int NOT NULL, [date] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [reference] nvarchar(MAX) NULL, [total] decimal(18,2) NOT NULL, [jDetail] nvarchar(MAX) NULL, [accountId] int NULL, [currency] nvarchar(MAX) NULL, [processId] int NULL, [entityState] nvarchar(MAX) NULL, [lifePolicyId] int NULL, [paymentMethodCode] nvarchar(450) NULL, [sourceAccountId] int NULL, [coverageId] int NULL, [liquidationId] int NULL, [producer] nvarchar(MAX) NULL, [branch] nvarchar(MAX) NULL, [concept] nvarchar(MAX) NULL, [payoutId] int NULL, [providerCode] nvarchar(MAX) NULL, [beneficiaryType] nvarchar(MAX) NULL, [deductions] decimal(18,2) NOT NULL, [grossAmount] decimal(18,2) NOT NULL, [retentions] decimal(18,2) NOT NULL, [taxes] decimal(18,2) NOT NULL, [paymentType] nvarchar(450) NULL, [fiscalNumber] nvarchar(MAX) NULL, [receiptTypeCode] nvarchar(450) NULL, [requiresFiscalNumber] bit NOT NULL, [parentId] int NULL, [transferId] int NULL, [batchId] int NULL, [checkNum] int NULL, [releaseDate] datetime2 NULL, [claimsFundId] int NULL );
CREATE TABLE [dbo].[ClaimsFund] ( [id] int IDENTITY(1,1) NOT NULL, [providerCode] nvarchar(450) NULL, [name] nvarchar(MAX) NULL, [accountId] int NOT NULL, [constitutionAmount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [reconstitutionThresholdAmount] decimal(18,2) NOT NULL, [reconstitutionThresholdPercent] decimal(18,4) NOT NULL, [reconstitutionFrequency] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ClaimStage] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [disabled] bit NOT NULL, [color] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Clause] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [section] nvarchar(MAX) NULL, [text] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [mandatory] bit NOT NULL );
CREATE TABLE [dbo].[Closure] ( [id] int IDENTITY(1,1) NOT NULL, [year] int NOT NULL, [month] int NOT NULL, [status] int NOT NULL, [processId] int NULL );
CREATE TABLE [dbo].[ClosureTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [icon] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ClosureUndoMotiveCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [lobs] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CoCession] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [contactId] int NOT NULL, [sumInsured] decimal(18,2) NOT NULL, [premium] decimal(18,2) NOT NULL, [sumInsuredCeded] decimal(18,2) NOT NULL, [premiumCeded] decimal(18,2) NOT NULL, [commission] decimal(18,2) NOT NULL, [percentage] decimal(18,2) NOT NULL, [created] datetime2 NOT NULL, [leader] bit NOT NULL, [currency] nvarchar(MAX) NULL, [liquidationId] int NULL, [paidOnCollection] bit NOT NULL, [parentCoCession] int NULL, [brokerCommission] decimal(18,2) NOT NULL, [tax] decimal(18,2) NOT NULL, [changeId] int NULL, [overwritten] bit NOT NULL, [allocationId] int NULL, [lifeCoverageId] int NULL, [brokerId] int NULL );
CREATE TABLE [dbo].[CoContract] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [inward] bit NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [currency] nvarchar(MAX) NULL, [active] bit NOT NULL, [createdDate] datetime2 NOT NULL, [effectiveDate] datetime2 NULL, [endDate] datetime2 NULL, [description] nvarchar(MAX) NULL, [operatingAccountId] int NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [processId] int NULL, [formId] int NULL, [jFormValues] nvarchar(MAX) NULL, [paidOnCollection] bit NOT NULL );
CREATE TABLE [dbo].[CoContractParticipant] ( [id] int IDENTITY(1,1) NOT NULL, [coContractId] int NOT NULL, [contactId] int NOT NULL, [lineId] nvarchar(MAX) NULL, [split] decimal(18,2) NOT NULL, [commissionRate] decimal(18,2) NOT NULL, [taxRate] decimal(18,2) NOT NULL, [accountId] int NULL );
CREATE TABLE [dbo].[CoLiquidation] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [description] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [sourceAccountId] int NOT NULL, [destinationAccountId] int NOT NULL, [commission] decimal(18,2) NOT NULL, [created] datetime2 NOT NULL, [premiumCeded] decimal(18,2) NOT NULL, [requestId] int NULL, [brokerCommission] decimal(18,2) NOT NULL, [tax] decimal(18,2) NOT NULL, [claimsCeded] decimal(18,2) NOT NULL, [status] int NOT NULL, [processId] int NULL );
CREATE TABLE [dbo].[CoLossCession] ( [id] int IDENTITY(1,1) NOT NULL, [coCessionId] int NOT NULL, [claimId] int NOT NULL, [lifeCoveragePayoutId] int NOT NULL, [currency] nvarchar(MAX) NULL, [claimOccurrence] datetime2 NOT NULL, [reserve] decimal(18,2) NOT NULL, [retainedReserve] decimal(18,2) NOT NULL, [cededReserve] decimal(18,2) NOT NULL, [loss] decimal(18,2) NOT NULL, [retainedLoss] decimal(18,2) NOT NULL, [cededLoss] decimal(18,2) NOT NULL, [liquidationId] int NULL );
CREATE TABLE [dbo].[ComContract] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [contactId] int NOT NULL, [active] bit NOT NULL, [start] datetime2 NOT NULL, [periodicity] nvarchar(MAX) NULL, [notes] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [end] datetime2 NULL, [operatingAccountId] int NULL, [processId] int NULL, [isUmbrella] bit NOT NULL, [isAdHoc] bit NOT NULL, [comTreeId] int NULL, [agentId] int NULL );
CREATE TABLE [dbo].[ComContractChange] ( [id] int IDENTITY(1,1) NOT NULL, [comContractId] int NOT NULL, [processId] int NULL, [creation] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [jBefore] nvarchar(MAX) NULL, [jAfter] nvarchar(MAX) NULL, [status] int NOT NULL, [operation] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ComLiquidation] ( [id] int IDENTITY(1,1) NOT NULL, [comContractId] int NOT NULL, [currency] nvarchar(MAX) NULL, [commissions] decimal(18,2) NOT NULL, [status] int NOT NULL, [yearMonth] int NOT NULL, [created] datetime2 NOT NULL, [liquidationName] nvarchar(MAX) NULL, [processId] int NULL );
CREATE TABLE [dbo].[ComLiquidationPart] ( [id] int IDENTITY(1,1) NOT NULL, [comLiquidationId] int NOT NULL, [split] decimal(18,2) NOT NULL, [splitCommission] decimal(18,2) NOT NULL, [accountId] int NULL, [contactId] int NOT NULL, [contactName] nvarchar(MAX) NULL, [paymentRequestId] int NULL, [comParticipantId] int NULL, [status] int NOT NULL, [paid] bit NOT NULL );
CREATE TABLE [dbo].[Comment] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NULL, [message] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [likes] nvarchar(MAX) NULL, [contactId] int NULL, [accountId] int NULL, [cardId] int NULL );
CREATE TABLE [dbo].[Commission] ( [id] int IDENTITY(1,1) NOT NULL, [comContractId] int NOT NULL, [lifePolicyId] int NULL, [lineId] nvarchar(MAX) NULL, [eventName] nvarchar(MAX) NULL, [formula] nvarchar(MAX) NULL, [commission] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [err] bit NOT NULL, [msg] nvarchar(MAX) NULL, [distributor] nvarchar(MAX) NULL, [lifeCoverageId] int NULL, [ofnCode] int NOT NULL, [ofnGroup] int NOT NULL, [productCode] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL, [extCode] nvarchar(MAX) NULL, [masterCode] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [version] int NOT NULL, [covCode] nvarchar(MAX) NULL, [origin] int NOT NULL, [comLiquidationId] int NULL, [sellerId] int NULL, [credit] decimal(18,2) NOT NULL, [allocationId] int NULL, [paymentStatus] int NULL, [contractYear] int NULL, [changeId] int NULL );
CREATE TABLE [dbo].[CommunicationsCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [field] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ComParticipant] ( [id] int IDENTITY(1,1) NOT NULL, [comContractId] int NOT NULL, [contactId] int NULL, [lineId] nvarchar(MAX) NULL, [split] decimal(18,2) NOT NULL, [accountId] int NULL, [active] bit NOT NULL, [notes] nvarchar(MAX) NULL, [statusReason] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ComRoleCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ComTree] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [start] datetime2 NOT NULL, [end] datetime2 NULL );
CREATE TABLE [dbo].[ComTreeMember] ( [id] int IDENTITY(1,1) NOT NULL, [comTreeId] int NOT NULL, [position] nvarchar(MAX) NULL, [tier] int NOT NULL, [contactId] int NOT NULL, [supervisorId] int NULL, [percentage] decimal(18,4) NOT NULL, [start] datetime2 NOT NULL, [end] datetime2 NULL, [changeDate] datetime2 NULL, [changeReasonId] int NULL, [changeType] int NULL );
CREATE TABLE [dbo].[ConceptCatalog] ( [operation] nvarchar(MAX) NULL, [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [active] bit NOT NULL );
CREATE TABLE [dbo].[ConfigProfile] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [active] bit NOT NULL, [warningMsg] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ConfigStore] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [category] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Contact] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [surname1] nvarchar(MAX) NULL, [birth] datetime2 NULL, [title] nvarchar(MAX) NULL, [surname2] nvarchar(MAX) NULL, [gender] nvarchar(MAX) NULL, [passport] nvarchar(MAX) NULL, [fiscalNumber] nvarchar(MAX) NULL, [city] nvarchar(MAX) NULL, [country] nvarchar(MAX) NULL, [phone] nvarchar(MAX) NULL, [state] nvarchar(MAX) NULL, [zip] nvarchar(MAX) NULL, [email] nvarchar(MAX) NULL, [isPerson] bit NOT NULL, [idType] nvarchar(MAX) NULL, [nationality] nvarchar(MAX) NULL, [genericField] nvarchar(MAX) NULL, [addressType] nvarchar(MAX) NULL, [maritalStatus] int NOT NULL, [citizenship] nvarchar(MAX) NULL, [occupationId] int NULL, [amlRiskId] int NULL, [risk] int NULL, [bmi] decimal(18,2) NOT NULL, [height] decimal(18,2) NOT NULL, [weight] decimal(18,2) NOT NULL, [income] decimal(18,2) NOT NULL, [incomeCurrency] nvarchar(MAX) NULL, [occupationSectorCode] nvarchar(MAX) NULL, [bank] nvarchar(MAX) NULL, [bankAccount] nvarchar(MAX) NULL, [cnp] nvarchar(MAX) NULL, [coHqCountry] nvarchar(MAX) NULL, [coLegalRepName] nvarchar(MAX) NULL, [coPersonOfContact1] nvarchar(MAX) NULL, [coPersonOfContact2] nvarchar(MAX) NULL, [coTradeRegister] nvarchar(MAX) NULL, [coWeb] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [customerDate] datetime2 NULL, [docsLink] nvarchar(MAX) NULL, [fatcaTaxCode] nvarchar(MAX) NULL, [fatcaTinGinCode] nvarchar(MAX) NULL, [inactive] bit NOT NULL, [marketingAgreement] nvarchar(MAX) NULL, [middleName] nvarchar(MAX) NULL, [migrationCode] nvarchar(MAX) NULL, [nationalId] nvarchar(MAX) NULL, [nationalIdExpiration] datetime2 NULL, [nif] nvarchar(MAX) NULL, [notificationChannel] nvarchar(MAX) NULL, [preferedCommunicationMethod] nvarchar(MAX) NULL, [publicStatus] bit NOT NULL, [workplace] nvarchar(MAX) NULL, [address1] nvarchar(MAX) NULL, [address2] nvarchar(MAX) NULL, [cif] nvarchar(MAX) NULL, [holdingId] int NULL, [updated] datetime2 NULL, [jAmlForm] nvarchar(MAX) NULL, [jCustomForms] nvarchar(MAX) NULL, [fatca] bit NOT NULL, [legalRepresentativeId] int NULL, [personOfContactId] int NULL, [receiptTypeCode] nvarchar(450) NULL, [user] nvarchar(450) NULL, [processId] int NULL, [organizationId] int NULL, [createdBy] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContactAddress] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [addressType] nvarchar(MAX) NULL, [country] nvarchar(MAX) NULL, [state] nvarchar(MAX) NULL, [city] nvarchar(MAX) NULL, [zip] nvarchar(MAX) NULL, [address1] nvarchar(MAX) NULL, [address2] nvarchar(MAX) NULL, [jMap] nvarchar(MAX) NULL, [sector] nvarchar(MAX) NULL, [legal] bit NOT NULL );
CREATE TABLE [dbo].[ContactBranch] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [idAux] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContactChange] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [processId] int NULL, [creation] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [jBefore] nvarchar(MAX) NULL, [jAfter] nvarchar(MAX) NULL, [status] int NOT NULL, [operation] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContactDocument] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [name] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [association] nvarchar(MAX) NULL, [status] nvarchar(450) NULL, [issueId] int NULL );
CREATE TABLE [dbo].[ContactEmail] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [email] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContactFamilyRecord] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [kinship] nvarchar(MAX) NULL, [diagnosis] nvarchar(MAX) NULL, [age] int NOT NULL );
CREATE TABLE [dbo].[ContactIncome] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [contactIncomeTypeCode] nvarchar(450) NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [employerId] int NULL, [branchId] int NULL, [start] datetime2 NOT NULL, [end] datetime2 NULL, [notes] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContactIncomeType] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContactMedicalHistory] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [date] datetime2 NOT NULL, [diagnosis] nvarchar(MAX) NULL, [procedure] nvarchar(MAX) NULL, [medicalProvider] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContactosConError] ( [ContactID] int NOT NULL, [MigrationCode] varchar(255) NULL, [ErrorDate] datetime NULL, [ErrorMessage] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContactPhone] ( [id] int IDENTITY(1,1) NOT NULL, [num] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL, [contactId] int NOT NULL );
CREATE TABLE [dbo].[ContactRole] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [role] nvarchar(450) NULL );
CREATE TABLE [dbo].[Contingent] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [beneficiaryId] int NOT NULL, [contactId] int NOT NULL );
CREATE TABLE [dbo].[Contract] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [inward] bit NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [currency] nvarchar(MAX) NULL, [proportional] bit NOT NULL, [status] nvarchar(MAX) NULL, [createdDate] datetime2 NOT NULL, [effectiveDate] datetime2 NULL, [endDate] datetime2 NULL, [nextAccountDate] datetime2 NULL, [operationalMethod] int NOT NULL, [accountPeriodicty] int NOT NULL, [facultive] bit NOT NULL, [processId] int NULL, [active] bit NOT NULL, [activeDate] datetime2 NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [distributionMode] int NOT NULL, [operatingAccountId] int NULL, [autoReinstatement] bit NOT NULL, [catMinClaimsPerEvent] int NOT NULL, [catastrophic] bit NOT NULL, [minDepositPremium] decimal(18,2) NOT NULL, [description] nvarchar(MAX) NULL, [cashCall] decimal(18,2) NOT NULL, [formId] int NULL, [jFormValues] nvarchar(MAX) NULL, [configStoreId] int NULL );
CREATE TABLE [dbo].[ContractChange] ( [id] int IDENTITY(1,1) NOT NULL, [contractId] int NOT NULL, [processId] int NULL, [creation] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [jBefore] nvarchar(MAX) NULL, [jAfter] nvarchar(MAX) NULL, [status] int NOT NULL, [operation] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContractInstallment] ( [id] int IDENTITY(1,1) NOT NULL, [contractId] int NOT NULL, [installmentNum] int NOT NULL, [payDate] datetime2 NOT NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [contactId] int NULL, [lineId] nvarchar(MAX) NULL, [status] int NOT NULL, [typeCode] nvarchar(450) NULL, [processId] int NULL );
CREATE TABLE [dbo].[ContractInstallmentType] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ContractTag] ( [tag] nvarchar(450) NOT NULL, [contractId] int NOT NULL );
CREATE TABLE [dbo].[ContributionLine] ( [id] int IDENTITY(1,1) NOT NULL, [pensionSchemeId] int NULL, [pensionMemberId] int NULL, [currency] nvarchar(MAX) NULL, [status] int NOT NULL, [year] int NOT NULL, [month] int NOT NULL, [day] int NOT NULL, [payPeriod] int NOT NULL, [date] datetime2 NOT NULL, [basicSalary] decimal(18,2) NOT NULL, [houseAllowance] decimal(18,2) NOT NULL, [grossSalary] decimal(18,2) NOT NULL, [contributionType] int NOT NULL, [ee] decimal(18,2) NOT NULL, [er] decimal(18,2) NOT NULL, [avcEe] decimal(18,2) NOT NULL, [avcEr] decimal(18,2) NOT NULL, [statutoryEe1] decimal(18,2) NOT NULL, [statutoryEr1] decimal(18,2) NOT NULL, [statutoryEe2] decimal(18,2) NOT NULL, [statutoryEr2] decimal(18,2) NOT NULL, [statutoryEe3] decimal(18,2) NOT NULL, [statutoryEr3] decimal(18,2) NOT NULL, [medicalEe] decimal(18,2) NOT NULL, [medicalEr] decimal(18,2) NOT NULL, [groupLifeEr] decimal(18,2) NOT NULL, [groupLastExpenseEr] decimal(18,2) NOT NULL, [statusMsg] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CostCenterCatalog] ( [name] nvarchar(MAX) NULL, [code] nvarchar(450) NOT NULL, [entity] nvarchar(MAX) NULL, [values] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Counter] ( [code] nvarchar(450) NOT NULL, [last] bigint NOT NULL, [digits] int NULL );
CREATE TABLE [dbo].[CountryCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [fatca] bit NOT NULL );
CREATE TABLE [dbo].[Coverage] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Cpt] ( [longDescription] varchar(MAX) NOT NULL, [description] nvarchar(256) NULL, [category] nchar(10) NULL, [level] int NOT NULL, [parent] nvarchar(MAX) NULL, [auditNotes] nvarchar(MAX) NULL, [averageCost] decimal(18,2) NOT NULL, [expectedCost] decimal(18,2) NOT NULL, [rules] nvarchar(MAX) NULL, [code] nvarchar(450) NOT NULL, [formId] int NULL );
CREATE TABLE [dbo].[Credit] ( [id] int IDENTITY(1,1) NOT NULL, [productCode] nvarchar(450) NULL, [contactId] int NOT NULL, [policyId] int NULL, [currency] nvarchar(MAX) NULL, [capital] decimal(18,2) NOT NULL, [interest] decimal(18,4) NOT NULL, [capitalizationMode] nvarchar(MAX) NULL, [capitalizationFrequency] nvarchar(MAX) NULL, [installmentSchemeId] int NULL, [frequency] nvarchar(MAX) NULL, [installments] int NOT NULL, [start] datetime2 NOT NULL, [created] datetime2 NOT NULL, [code] nvarchar(MAX) NULL, [formId] int NULL, [jForm] nvarchar(MAX) NULL, [processId] int NULL, [active] bit NOT NULL, [entityState] nvarchar(MAX) NULL, [total] decimal(18,4) NOT NULL, [blocked] bit NOT NULL, [externalId] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CreditCharge] ( [id] int IDENTITY(1,1) NOT NULL, [creditId] int NOT NULL, [code] nvarchar(MAX) NULL, [concept] nvarchar(MAX) NULL, [currency] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [formId] int NULL, [jValues] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[CreditInstallment] ( [id] int IDENTITY(1,1) NOT NULL, [creditId] int NOT NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [dueDate] datetime2 NOT NULL, [year] int NOT NULL, [num] int NOT NULL, [paid] bit NOT NULL, [paidDate] datetime2 NULL, [capital] decimal(18,2) NOT NULL, [interest] decimal(18,2) NOT NULL, [balance] decimal(18,2) NOT NULL, [expenses] decimal(18,2) NOT NULL, [insurance] decimal(18,2) NOT NULL, [penaltyInterest] decimal(18,2) NOT NULL, [penaltyUpdate] datetime2 NULL );
CREATE TABLE [dbo].[Currency] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [symbol] nvarchar(MAX) NULL, [enabled] bit NOT NULL );
CREATE TABLE [dbo].[Definition] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [xml] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [enabled] bit NOT NULL, [entity] nvarchar(MAX) NULL, [icon] nvarchar(MAX) NULL, [backPermissionGroupId] int NULL, [eventsDisabled] bit NOT NULL, [category] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Diagnosis] ( [code] nvarchar(450) NOT NULL, [icd] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [category] nvarchar(MAX) NULL, [auditNotes] nvarchar(MAX) NULL, [expectedCost] decimal(18,2) NOT NULL, [averageCost] decimal(18,2) NOT NULL, [rules] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[DiagProcedure] ( [id] int IDENTITY(1,1) NOT NULL, [diagnosisCode] nvarchar(450) NULL, [excluded] bit NOT NULL, [rule] nvarchar(MAX) NULL, [auditNotes] nvarchar(MAX) NULL, [cptCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[DiagRequirement] ( [id] int IDENTITY(1,1) NOT NULL, [diagnosisCode] nvarchar(450) NULL, [requirementCode] nvarchar(450) NULL, [document] nvarchar(MAX) NULL, [type] int NOT NULL, [comments] nvarchar(MAX) NULL, [rule] nvarchar(MAX) NULL, [auditNotes] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[DocStatusCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Document] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [name] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [LifePolicyid] int NOT NULL, [created] datetime2 NOT NULL, [association] nvarchar(MAX) NULL, [status] nvarchar(450) NULL );
CREATE TABLE [dbo].[EntityAction] ( [code] nvarchar(450) NOT NULL, [module] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [cmd] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[EntityStateReason] ( [code] nvarchar(450) NOT NULL, [entity] nvarchar(MAX) NULL, [entityState] nvarchar(MAX) NULL, [entityStateReason] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[EventReasonCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [disabled] bit NOT NULL );
CREATE TABLE [dbo].[ExchangeOperation] ( [id] int IDENTITY(1,1) NOT NULL, [accountId] int NOT NULL, [operationName] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [status] int NOT NULL, [processId] int NULL, [reference] nvarchar(MAX) NULL, [entityState] nvarchar(MAX) NULL, [amountEx] decimal(18,2) NOT NULL, [targetCurrency] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ExternalSourceCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [destinationAccNo] nvarchar(MAX) NULL, [formId] int NULL, [closingBalance] decimal(18,2) NULL, [currency] nvarchar(MAX) NULL, [paymentMethods] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Fee] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [anniversaryId] int NULL, [disabled] bit NOT NULL );
CREATE TABLE [dbo].[FieldRule] ( [id] int IDENTITY(1,1) NOT NULL, [entity] nvarchar(MAX) NULL, [field] nvarchar(MAX) NULL, [restricted] bit NOT NULL, [operation] nvarchar(MAX) NULL, [validationRule] nvarchar(MAX) NULL, [required] nvarchar(MAX) NULL, [frontValidation] nvarchar(MAX) NULL, [hidden] bit NOT NULL, [hiddenCondition] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[FiscalDoc] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [active] bit NOT NULL, [numStart] int NOT NULL, [numEnd] int NOT NULL, [numLast] bigint NOT NULL, [created] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [requestNumber] int NOT NULL, [expires] datetime2 NULL, [receiptTypeCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[FiscalDocChange] ( [id] int IDENTITY(1,1) NOT NULL, [fiscalDocId] int NOT NULL, [creation] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [jBefore] nvarchar(MAX) NULL, [jAfter] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[FiscalDocGenerated] ( [id] int IDENTITY(1,1) NOT NULL, [fiscalDocId] int NOT NULL, [action] nvarchar(MAX) NULL, [policyId] int NULL, [receiptTypeCode] nvarchar(450) NULL, [fiscalNumber] nvarchar(MAX) NULL, [user] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [releasedDate] datetime2 NULL, [reassignedDate] datetime2 NULL, [cancelledDate] datetime2 NULL, [billId] int NULL, [claimPaymentId] int NULL, [changeReason] nvarchar(MAX) NULL, [changeType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[FixedAsset] ( [id] int IDENTITY(1,1) NOT NULL, [assetTag] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [category] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [status] nvarchar(MAX) NULL, [location] nvarchar(MAX) NULL, [supplier] nvarchar(MAX) NULL, [model] nvarchar(MAX) NULL, [serialNumber] nvarchar(MAX) NULL, [warranty] nvarchar(MAX) NULL, [notes] nvarchar(MAX) NULL, [purchaseDate] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [depMethod] nvarchar(MAX) NULL, [usefulLife] int NOT NULL, [depreciationRate] decimal(18,4) NOT NULL, [purchasePrice] decimal(18,2) NOT NULL, [depreciationAmount] decimal(18,2) NOT NULL, [currentBookValue] decimal(18,2) NOT NULL, [salvageValue] decimal(18,2) NOT NULL, [disposalDate] datetime2 NULL, [lastDepreciationDate] datetime2 NULL );
CREATE TABLE [dbo].[Form] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [json] nvarchar(MAX) NULL, [logic] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[FraudAnalysis] ( [id] int IDENTITY(1,1) NOT NULL, [claimId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [factor] float NOT NULL, [action] nvarchar(MAX) NULL, [lastChecked] datetime2 NULL );
CREATE TABLE [dbo].[Fund] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [active] bit NOT NULL, [currency] nvarchar(MAX) NULL, [contactId] int NOT NULL, [jCustomForm] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[FundPlan] ( [id] int IDENTITY(1,1) NOT NULL, [fundId] int NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[FundPlanLine] ( [id] int IDENTITY(1,1) NOT NULL, [fundPlanId] int NOT NULL, [percentage] decimal(18,4) NOT NULL, [investmentPlanCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[FundRole] ( [id] int IDENTITY(1,1) NOT NULL, [fundId] int NOT NULL, [fundRoleCatalogCode] nvarchar(450) NULL, [contactId] int NOT NULL );
CREATE TABLE [dbo].[FundRoleCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Funnel] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [contactTag] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[FunnelContact] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [company] nvarchar(MAX) NULL, [email] nvarchar(MAX) NULL, [phone] nvarchar(MAX) NULL, [contactId] int NULL, [funnelId] int NOT NULL, [stageId] int NOT NULL, [value] decimal(18,2) NOT NULL, [probability] decimal(18,4) NOT NULL, [notes] nvarchar(MAX) NULL, [assignedTo] nvarchar(MAX) NULL, [lastActivity] datetime2 NULL, [nextActivity] datetime2 NULL, [tags] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[FunnelContactActivity] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [type] nvarchar(MAX) NULL, [title] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [date] datetime2 NOT NULL, [createdBy] nvarchar(MAX) NULL, [duration] int NULL, [outcome] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [completed] bit NOT NULL, [dueDate] datetime2 NULL, [nextSteps] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[FunnelStage] ( [id] int IDENTITY(1,1) NOT NULL, [funnelId] int NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [color] nvarchar(MAX) NULL, [active] bit NOT NULL, [probability] float NOT NULL, [order] decimal(18,4) NOT NULL, [status] int NOT NULL );
CREATE TABLE [dbo].[GenericCatalog] ( [id] int IDENTITY(1,1) NOT NULL, [module] nvarchar(MAX) NULL, [catalog] nvarchar(MAX) NULL, [display] nvarchar(MAX) NULL, [value] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[GoalDefinition] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [periodStart] datetime2 NOT NULL, [periodDuration] int NOT NULL, [description] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [active] bit NOT NULL, [rewardCurrency] nvarchar(MAX) NULL, [maxPeriods] int NULL );
CREATE TABLE [dbo].[GoalMember] ( [id] int IDENTITY(1,1) NOT NULL, [goalDefinitionId] int NOT NULL, [contactId] int NOT NULL );
CREATE TABLE [dbo].[GoalStatus] ( [id] int IDENTITY(1,1) NOT NULL, [goalMemberId] int NOT NULL, [period] int NOT NULL, [goalStatus] float NOT NULL, [goalUpdated] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [reached] bit NOT NULL, [reward] decimal(18,2) NOT NULL, [goal] float NOT NULL, [goalDefinitionId] int NOT NULL, [paymentId] int NULL );
CREATE TABLE [dbo].[HtmlTemplate] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [template] nvarchar(MAX) NULL, [testContext] nvarchar(MAX) NULL, [chainId] int NULL );
CREATE TABLE [dbo].[IdTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [personType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Imbalance] ( [id] int IDENTITY(1,1) NOT NULL, [workspaceId] int NOT NULL, [paymentMethod] nvarchar(450) NULL, [currency] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [reason] nvarchar(MAX) NULL, [date] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [transferId] int NULL, [processId] int NULL, [destinationAccountId] int NOT NULL, [executed] bit NOT NULL );
CREATE TABLE [dbo].[ImportConfig] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [targetEntity] nvarchar(MAX) NULL, [jMappings] nvarchar(MAX) NULL, [operation] int NOT NULL, [preProcessorId] int NULL, [postOperationId] int NULL, [preOperationId] int NULL, [category] nvarchar(MAX) NULL, [bulk] bit NOT NULL );
CREATE TABLE [dbo].[IncomeCostCenter] ( [id] int IDENTITY(1,1) NOT NULL, [transferId] int NOT NULL, [costCenterCode] nvarchar(450) NULL, [value] nvarchar(MAX) NULL, [valueCode] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[IncomeExpense] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [isIncome] bit NOT NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [status] int NOT NULL, [categoryCode] nvarchar(450) NULL, [processId] int NULL, [paymentId] int NULL, [transferId] int NULL, [contactId] int NULL, [date] datetime2 NOT NULL, [salvageId] int NULL );
CREATE TABLE [dbo].[IncomeExpenseCategory] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [isIncome] bit NOT NULL, [accountId] int NULL );
CREATE TABLE [dbo].[IncomeTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [internalType] nvarchar(MAX) NULL, [formId] int NULL, [showCostCenters] bit NOT NULL );
CREATE TABLE [dbo].[InstallmentScheme] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [active] bit NOT NULL, [start] datetime2 NULL, [end] datetime2 NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [notes] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Insured] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [lifePolicyId] int NOT NULL, [name] nvarchar(MAX) NULL, [relationship] int NOT NULL, [role] int NOT NULL );
CREATE TABLE [dbo].[InsuredEventCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [mode] nvarchar(MAX) NULL, [disabled] bit NOT NULL, [hasHealthProcedures] bit NOT NULL );
CREATE TABLE [dbo].[InsuredObject] ( [id] int IDENTITY(1,1) NOT NULL, [objectDefinitionId] int NOT NULL, [lifePolicyId] int NOT NULL, [jValues] nvarchar(MAX) NULL, [jMap] nvarchar(MAX) NULL, [jFileUpload] nvarchar(MAX) NULL, [alias] nvarchar(MAX) NULL, [jDetailList] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[InvestmentPlan] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [nav] decimal(18,2) NOT NULL, [type] nvarchar(MAX) NULL, [growth1y] decimal(18,2) NOT NULL, [growth3y] decimal(18,2) NOT NULL, [growth5y] decimal(18,2) NOT NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [assetType] nvarchar(450) NULL );
CREATE TABLE [dbo].[InvestmentPlanData] ( [id] int IDENTITY(1,1) NOT NULL, [investmentPlanCode] nvarchar(450) NULL, [date] datetime2 NOT NULL, [bid] decimal(18,10) NOT NULL, [ask] decimal(18,10) NOT NULL, [open] decimal(18,10) NOT NULL, [high] decimal(18,10) NOT NULL, [low] decimal(18,10) NOT NULL, [close] decimal(18,10) NOT NULL, [yield] decimal(18,10) NOT NULL );
CREATE TABLE [dbo].[InvestmentSelection] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [investmentPlanCode] nvarchar(450) NULL, [splitPercent] decimal(18,2) NOT NULL, [validFrom] datetime2 NULL, [validTo] datetime2 NULL, [premiumType] int NOT NULL );
CREATE TABLE [dbo].[Issue] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [title] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [closed] bit NOT NULL, [closeDate] datetime2 NULL, [issueType] nvarchar(MAX) NULL, [processId] int NULL, [issueReason] nvarchar(450) NULL, [externalId] nvarchar(MAX) NULL, [policyId] int NULL, [priorityCode] nvarchar(450) NULL, [benefitId] int NULL, [lifeCoverageId] int NULL );
CREATE TABLE [dbo].[IssueReasonCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [issueType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[IssueTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Job] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [command] nvarchar(MAX) NULL, [cron] nvarchar(MAX) NULL, [lastExecution] datetime2 NULL, [created] datetime2 NOT NULL, [disabled] bit NOT NULL, [lastResultDto] nvarchar(MAX) NULL, [lastResultOk] bit NOT NULL, [lastFinish] datetime2 NULL, [messageId] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[KycCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [group] nvarchar(MAX) NULL, [blockLevel] int NOT NULL, [type] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[KycRequirement] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [code] nvarchar(450) NULL, [name] nvarchar(MAX) NULL, [group] nvarchar(MAX) NULL, [blockLevel] int NOT NULL, [type] nvarchar(MAX) NULL, [status] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [expirationDate] datetime2 NULL, [request] bit NOT NULL, [requestDate] datetime2 NULL, [requestLink] nvarchar(MAX) NULL, [response] bit NOT NULL, [responseDate] datetime2 NULL, [responseLink] nvarchar(MAX) NULL, [approvalDate] datetime2 NULL, [approvedBy] nvarchar(MAX) NULL, [comments] nvarchar(MAX) NULL, [riskLevel] int NULL, [jFormValues] nvarchar(MAX) NULL, [readOnly] bit NOT NULL, [mandatory] bit NOT NULL, [lastUpdated] datetime2 NULL, [updatedBy] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Label] ( [id] int IDENTITY(1,1) NOT NULL, [module] nvarchar(MAX) NULL, [path] nvarchar(MAX) NULL, [label] nvarchar(MAX) NULL, [help] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL, [options] nvarchar(MAX) NULL, [validation] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Language] ( [code] nvarchar(450) NOT NULL, [section] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [isoCode] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[LifeCoverage] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [limit] decimal(18,2) NOT NULL, [deductible] decimal(18,2) NOT NULL, [periodicity] int NOT NULL, [basePremium] decimal(18,2) NOT NULL, [basic] bit NOT NULL, [description] nvarchar(MAX) NULL, [loading] decimal(18,2) NOT NULL, [end] datetime2 NULL, [start] datetime2 NULL, [appliesTo] nvarchar(MAX) NULL, [commercialName] nvarchar(MAX) NULL, [internalBonus] bit NOT NULL, [number] int NOT NULL, [ofnCode] int NOT NULL, [ofnGroup] int NOT NULL, [solvency2Code] nvarchar(MAX) NULL, [startBasePremium] decimal(18,2) NOT NULL, [startLimit] decimal(18,2) NOT NULL, [parent] nvarchar(MAX) NULL, [hasMaturity] bit NOT NULL, [extraPremium] decimal(18,2) NOT NULL, [ignoreIndexation] bit NOT NULL, [internalPremium] decimal(18,2) NOT NULL, [reStatus] int NOT NULL, [manualPremium] bit NOT NULL, [manualLimit] bit NOT NULL, [isInternal] bit NOT NULL, [baseLimit] decimal(18,2) NOT NULL, [limitFactor] float NULL, [loadingInsuredSum] decimal(18,2) NOT NULL, [reinsuranceCode] nvarchar(MAX) NULL, [parentPercentage] decimal(18,4) NOT NULL, [coContractId] int NULL, [jCustom] nvarchar(MAX) NULL, [jPremiumDetail] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[LifeCoverageClaim] ( [id] int IDENTITY(1,1) NOT NULL, [lifeCoverageId] int NOT NULL, [claimId] int NOT NULL, [created] datetime2 NOT NULL, [eventDate] datetime2 NOT NULL, [endEvent] datetime2 NULL, [eventDetails] nvarchar(MAX) NULL, [contractStatusReason] nvarchar(MAX) NULL, [sumAssured] decimal(18,2) NOT NULL, [retainedValue] decimal(18,2) NOT NULL, [calculationDetails] nvarchar(MAX) NULL, [finalIndemnityValue] decimal(18,2) NOT NULL, [Discriminator] nvarchar(MAX) NOT NULL, [bonusPercentage] float NULL, [bonusSumAssured] decimal(18,2) NULL, [convalescenceDaysNumber] int NULL, [coverageEndDate] datetime2 NULL, [daysOfConvalescence] int NULL, [deductibleDays] int NULL, [endDateOfIncapacity] datetime2 NULL, [eventNumber] int NULL, [hospitalized] bit NULL, [maxHospitalizationDays] int NULL, [maxHospitalizationDaysAfterMaturity] int NULL, [minSumAssuredEver] decimal(18,2) NULL, [multiplicationFactor] float NULL, [startDateOfIncapacity] datetime2 NULL, [LifeCoverageClaimDisab_bonusPercentage] float NULL, [LifeCoverageClaimDisab_bonusSumAssured] decimal(18,2) NULL, [finalPercentage] float NULL, [maxPercentage] float NULL, [LifeCoverageClaimDisab_minSumAssuredEver] decimal(18,2) NULL, [newPercentage] float NULL, [usedPercentage] float NULL, [accountValue] decimal(18,2) NULL, [annuityValue] decimal(18,2) NULL, [claimsFileCreation] datetime2 NULL, [contractStartDate] datetime2 NULL, [fractionOfYears] float NULL, [frequency] nvarchar(MAX) NULL, [lastAnnualPremium] decimal(18,2) NULL, [nextDueDate] datetime2 NULL, [partialSurrenderValues] decimal(18,2) NULL, [profitSharingValue] decimal(18,2) NULL, [reducedSumAssured] decimal(18,2) NULL, [LifeCoverageClaimHosp_bonusPercentage] float NULL, [LifeCoverageClaimHosp_bonusSumAssured] decimal(18,2) NULL, [LifeCoverageClaimHosp_coverageEndDate] datetime2 NULL, [daysOfHospitalization] int NULL, [daysOfHospitalizationAfterAnniversary] int NULL, [LifeCoverageClaimHosp_deductibleDays] int NULL, [LifeCoverageClaimHosp_eventNumber] int NULL, [hospitalizationDaysNumber] int NULL, [LifeCoverageClaimHosp_maxHospitalizationDays] int NULL, [LifeCoverageClaimHosp_maxHospitalizationDaysAfterMaturity] int NULL, [LifeCoverageClaimHosp_minSumAssuredEver] decimal(18,2) NULL, [nextAnniversaryDate] datetime2 NULL, [numberOfActiveDays] int NULL, [LifeCoverageClaimSurg_bonusPercentage] float NULL, [LifeCoverageClaimSurg_bonusSumAssured] decimal(18,2) NULL, [LifeCoverageClaimSurg_finalPercentage] float NULL, [LifeCoverageClaimSurg_maxPercentage] float NULL, [LifeCoverageClaimSurg_minSumAssuredEver] decimal(18,2) NULL, [LifeCoverageClaimSurg_newPercentage] float NULL, [LifeCoverageClaimSurg_usedPercentage] float NULL, [claimType] nvarchar(MAX) NULL, [dateOfAdmission] datetime2 NULL, [dateOfDischarge] datetime2 NULL, [LifeCoverageClaimHosp_dateOfAdmission] datetime2 NULL, [LifeCoverageClaimHosp_dateOfDischarge] datetime2 NULL, [jClaimForm] nvarchar(MAX) NULL, [appliesTo] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[LifeCoverageLoading] ( [id] int IDENTITY(1,1) NOT NULL, [lifeCoverageId] int NOT NULL, [loading] decimal(18,4) NOT NULL, [riskType] nvarchar(450) NULL, [end] datetime2 NULL, [notes] nvarchar(MAX) NULL, [start] datetime2 NOT NULL, [manual] bit NOT NULL, [insuredSumBased] bit NOT NULL, [perMille] bit NOT NULL, [duration] int NULL, [insuredId] int NULL );
CREATE TABLE [dbo].[LifeCoveragePayout] ( [id] int IDENTITY(1,1) NOT NULL, [lifeCoverageId] int NOT NULL, [date] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [reserved] decimal(18,2) NOT NULL, [payed] decimal(18,2) NOT NULL, [concept] nvarchar(MAX) NULL, [claimId] int NOT NULL, [lifePolicyId] int NOT NULL, [status] int NOT NULL, [requestedAmount] decimal(18,2) NOT NULL, [deductible] decimal(18,2) NOT NULL, [reserveType] nvarchar(MAX) NULL, [parentCode] nvarchar(MAX) NULL, [expenseType] nvarchar(450) NULL, [jAffectedObjects] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[LifeExclusion] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [rule] nvarchar(MAX) NULL, [value] decimal(18,2) NOT NULL, [mandatory] int NOT NULL, [coverageCode] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[LifePolicy] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [entityState] nvarchar(MAX) NULL, [processId] int NULL, [lob] nvarchar(450) NULL, [productCode] nvarchar(450) NULL, [start] datetime2 NULL, [end] datetime2 NULL, [alias] nvarchar(MAX) NULL, [holderId] int NOT NULL, [insuredSum] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [active] bit NOT NULL, [activeDate] datetime2 NULL, [investmentPlanCode] nvarchar(450) NULL, [anualPremium] decimal(18,2) NOT NULL, [anualTotal] decimal(18,2) NOT NULL, [coverages] decimal(18,2) NOT NULL, [discounts] decimal(18,2) NOT NULL, [fee] decimal(18,2) NOT NULL, [installment] decimal(18,2) NOT NULL, [paymentMethod] nvarchar(MAX) NULL, [periodicity] nvarchar(MAX) NULL, [surcharges] decimal(18,2) NOT NULL, [tax] decimal(18,2) NOT NULL, [plannedPremium] decimal(18,2) NOT NULL, [premiumPlan] nvarchar(MAX) NULL, [option] int NOT NULL, [created] datetime2 NOT NULL, [lastInsuranceCharge] datetime2 NULL, [billingStatus] int NOT NULL, [billingStatusDate] datetime2 NULL, [inactiveDate] datetime2 NULL, [inactiveReason] nvarchar(MAX) NULL, [comContractId] int NULL, [duration] int NOT NULL, [investmentStrategy] nvarchar(MAX) NULL, [plan] nvarchar(MAX) NULL, [paymentDuration] int NOT NULL, [lastUpdate] datetime2 NULL, [grossValue] decimal(18,2) NOT NULL, [indexation] int NOT NULL, [paidUp] bit NOT NULL, [commercial] nvarchar(MAX) NULL, [ifrs17Code] nvarchar(MAX) NULL, [masterCode] nvarchar(MAX) NULL, [version] int NOT NULL, [proposalValidityDate] datetime2 NULL, [proposal_package_reason] nvarchar(MAX) NULL, [proposal_package_status] nvarchar(MAX) NULL, [proposalStartDate] datetime2 NULL, [uwFlag] bit NOT NULL, [amlFlag] bit NOT NULL, [cessionBeneficiary] int NULL, [groupPolicyId] int NULL, [policyType] nvarchar(MAX) NULL, [group] nvarchar(MAX) NULL, [indexationPeriod] int NOT NULL, [jIndexationPlan] nvarchar(MAX) NULL, [jActuarialSheet] nvarchar(MAX) NULL, [lastActuarialUpdate] datetime2 NULL, [sellerId] int NULL, [jProjections] nvarchar(MAX) NULL, [durationMonths] int NOT NULL, [payerId] int NULL, [certificate] int NOT NULL, [coinsurance] int NOT NULL, [changeId] int NULL, [guarantorId] int NULL, [installmentSchemeId] int NULL, [reAdjustment] decimal(18,4) NULL, [reEvaluation] decimal(18,4) NULL, [originalPolicyId] int NULL, [planOptions] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [jComParticipants] nvarchar(MAX) NULL, [channel] nvarchar(MAX) NULL, [segment] nvarchar(MAX) NULL, [fiscalNumber] nvarchar(MAX) NULL, [receiptTypeCode] nvarchar(450) NULL, [extBankCertificate] nvarchar(MAX) NULL, [extCertificate] nvarchar(MAX) NULL, [extPolicy] nvarchar(MAX) NULL, [durationDays] int NOT NULL, [contactBranchId] int NULL, [comPercentage] decimal(18,2) NULL, [commissions] decimal(18,2) NOT NULL, [indexationFrequency] int NOT NULL, [indexationStart] int NOT NULL, [branchCode] nvarchar(450) NULL, [customPayPlan] bit NOT NULL, [jCustomPolicyGroups] nvarchar(MAX) NULL, [codeSuffix] nvarchar(MAX) NULL, [jCustomPlanOptions] nvarchar(MAX) NULL, [organizationId] int NULL, [fronting] bit NOT NULL, [policyVersion] int NOT NULL, [jCertificateGroups] nvarchar(MAX) NULL, [groupCoverageType] nvarchar(MAX) NULL, [umbrellaGroup] nvarchar(450) NULL, [coContractId] int NULL, [penaltyUpdate] datetime2 NULL, [indexationInsuredSum] decimal(18,4) NULL, [indexationPremium] decimal(18,4) NULL, [restricted] bit NOT NULL, [jCessionBeneficiary] nvarchar(MAX) NULL, [payerRelationshipId] int NULL, [originalStart] datetime2 NULL, [claimsFundId] int NULL, [subLob] nvarchar(450) NULL );
CREATE TABLE [dbo].[LifeRequirement] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [blockLevel] int NOT NULL, [tags] nvarchar(MAX) NULL, [request] bit NOT NULL, [requestDate] datetime2 NULL, [requestLink] nvarchar(MAX) NULL, [response] bit NOT NULL, [responseDate] datetime2 NULL, [responseLink] nvarchar(MAX) NULL, [comments] nvarchar(MAX) NULL, [lifePolicyId] int NOT NULL, [jFormValues] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL, [amlCaseId] int NULL, [processId] int NULL, [readOnly] bit NOT NULL );
CREATE TABLE [dbo].[LifeSurcharge] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [rule] nvarchar(MAX) NULL, [value] decimal(18,2) NOT NULL, [mandatory] int NOT NULL, [coverageCode] nvarchar(MAX) NULL, [duration] int NULL, [end] datetime2 NULL, [start] datetime2 NULL );
CREATE TABLE [dbo].[Liquidation] ( [id] int IDENTITY(1,1) NOT NULL, [contractId] int NULL, [participantId] int NOT NULL, [participantName] nvarchar(MAX) NULL, [liquidationName] nvarchar(MAX) NULL, [creation] datetime2 NOT NULL, [from] datetime2 NOT NULL, [to] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [premiums] decimal(18,2) NOT NULL, [claims] decimal(18,2) NOT NULL, [status] int NOT NULL, [commissions] decimal(18,2) NOT NULL, [paymentRequestId] int NULL, [tax] decimal(18,2) NOT NULL, [processId] int NULL, [operationId] bigint NULL, [reserve] decimal(18,2) NOT NULL, [reinstatementPremiums] decimal(18,2) NOT NULL, [claimReserveInterest] decimal(18,2) NOT NULL, [premiumReserveInterest] decimal(18,2) NOT NULL, [claimCededReserve] decimal(18,2) NOT NULL, [fee] decimal(18,2) NOT NULL, [fromAccount] decimal(18,2) NOT NULL );
CREATE TABLE [dbo].[LiquidationCat] ( [id] int IDENTITY(1,1) NOT NULL, [contractId] int NOT NULL, [reEventId] int NOT NULL, [liquidationName] nvarchar(MAX) NULL, [creation] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [premiums] decimal(18,2) NOT NULL, [retainedLoss] decimal(18,2) NOT NULL, [status] int NOT NULL, [cededLoss] decimal(18,2) NOT NULL, [claims] int NOT NULL, [jAffected] nvarchar(MAX) NULL, [line] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[LiveView] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [category] nvarchar(MAX) NULL, [operation] nvarchar(MAX) NULL, [multiComponent] bit NOT NULL );
CREATE TABLE [dbo].[Lob] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [group] nvarchar(MAX) NULL, [ifrsCode] nvarchar(MAX) NULL, [legalCode] nvarchar(MAX) NULL, [productType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Log] ( [id] int IDENTITY(1,1) NOT NULL, [date] datetime2 NOT NULL, [level] int NOT NULL, [transactionCode] nvarchar(MAX) NULL, [msg] nvarchar(MAX) NULL, [user] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[LossCession] ( [id] int IDENTITY(1,1) NOT NULL, [contractId] int NOT NULL, [cessionId] int NULL, [lifeCoveragePayoutId] int NOT NULL, [reserve] decimal(22,6) NOT NULL, [retainedReserve] decimal(22,6) NOT NULL, [cededReserve] decimal(22,6) NOT NULL, [loss] decimal(22,6) NOT NULL, [retainedLoss] decimal(22,6) NOT NULL, [cededLoss] decimal(22,6) NOT NULL, [claimOccurrence] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [liquidationCatId] int NULL, [reinstatementPremium] decimal(22,6) NOT NULL, [exGratia] bit NOT NULL );
CREATE TABLE [dbo].[LossCessionPart] ( [id] int IDENTITY(1,1) NOT NULL, [lossCessionId] int NOT NULL, [name] nvarchar(MAX) NULL, [contactId] int NOT NULL, [lineId] nvarchar(MAX) NULL, [split] decimal(18,4) NOT NULL, [loss] decimal(22,6) NOT NULL, [liquidationId] int NULL, [currency] nvarchar(MAX) NULL, [paid] decimal(22,6) NOT NULL, [brokerId] int NULL );
CREATE TABLE [dbo].[MaritalStatusCatalog] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[MeasurementDefinition] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [calcSheetId] int NOT NULL );
CREATE TABLE [dbo].[Message] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [template] nvarchar(MAX) NULL, [context] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [delivered] datetime2 NULL, [channel] nvarchar(MAX) NULL, [templateName] nvarchar(MAX) NULL, [message] nvarchar(MAX) NULL, [subject] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[MessageAttachment] ( [id] int IDENTITY(1,1) NOT NULL, [messageId] int NOT NULL, [documentId] int NULL, [fileUrl] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[MessageResult] ( [id] nvarchar(450) NOT NULL, [batch] nvarchar(MAX) NULL, [index] int NOT NULL, [ok] bit NOT NULL, [msg] nvarchar(MAX) NULL, [date] datetime2 NOT NULL, [dto] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Movement] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [lifePolicyId] int NOT NULL, [accountId] int NULL, [calculationDate] datetime2 NOT NULL, [description] nvarchar(MAX) NULL, [valueCurrent] decimal(18,2) NOT NULL, [valuePrevious] decimal(18,2) NOT NULL, [lifeCoverageId] int NULL, [contactId] int NULL, [reference] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Msg] ( [id] int IDENTITY(1,1) NOT NULL, [transactionId] nvarchar(MAX) NULL, [jData] nvarchar(MAX) NULL, [date] datetime2 NOT NULL );
CREATE TABLE [dbo].[NetworkCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ObjectDefinition] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [formId] int NULL, [hasMap] bit NOT NULL, [hasFileUpload] bit NOT NULL, [hasDetailList] bit NOT NULL, [objectTypeCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[ObjectType] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ObjectTypeDetail] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [objectTypeCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[Occupation] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [questionnaire] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [invalidityFlag] nvarchar(MAX) NULL, [sectorCode] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[OccupationSector] ( [code] nvarchar(450) NOT NULL, [extCode] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[OperationStatus] ( [code] nvarchar(450) NOT NULL, [created] datetime2 NOT NULL, [updated] datetime2 NOT NULL, [cmd] nvarchar(MAX) NULL, [jEntities] nvarchar(MAX) NULL, [status] int NOT NULL );
CREATE TABLE [dbo].[Organization] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [parentId] int NULL, [defaultCurrency] nvarchar(MAX) NULL, [rootAccount] nvarchar(MAX) NULL, [timezone] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[OrgContact] ( [id] int IDENTITY(1,1) NOT NULL, [organizationId] int NOT NULL, [contactId] int NOT NULL );
CREATE TABLE [dbo].[Participant] ( [id] int IDENTITY(1,1) NOT NULL, [contractId] int NOT NULL, [contactId] int NULL, [lineId] nvarchar(MAX) NULL, [split] decimal(18,2) NOT NULL, [accountId] int NULL, [commissionRate] decimal(18,2) NOT NULL, [taxRate] decimal(18,2) NOT NULL, [brokerId] int NULL, [notes] nvarchar(MAX) NULL, [feeRate] decimal(18,2) NOT NULL );
CREATE TABLE [dbo].[PaymentConceptCatalog] ( [concept] nvarchar(450) NOT NULL );
CREATE TABLE [dbo].[PaymentCostCenter] ( [id] int IDENTITY(1,1) NOT NULL, [claimPaymentId] int NOT NULL, [costCenterCode] nvarchar(450) NULL, [value] nvarchar(MAX) NULL, [valueCode] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PaymentMethodCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [accountId] int NOT NULL, [formId] int NULL, [noDeposit] bit NOT NULL, [module] nvarchar(MAX) NULL, [checkBook] bit NOT NULL );
CREATE TABLE [dbo].[PaymentTax] ( [id] int IDENTITY(1,1) NOT NULL, [paymentId] int NOT NULL, [valueAddedCode] nvarchar(450) NULL, [grossAmount] decimal(18,2) NOT NULL, [rate] decimal(18,2) NOT NULL, [amount] decimal(18,2) NOT NULL, [taxType] nvarchar(MAX) NULL, [taxName] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PaymentTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [showCostCenters] bit NOT NULL );
CREATE TABLE [dbo].[PayoutRequest] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [claimId] int NOT NULL, [lifeCoverageId] int NOT NULL, [date] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [operation] nvarchar(MAX) NULL, [reserveType] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [concept] nvarchar(MAX) NULL, [status] int NOT NULL, [processId] int NULL, [payoutId] int NULL, [jAffectedObjects] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PayPlan] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [concept] nvarchar(MAX) NULL, [expected] decimal(18,2) NOT NULL, [minimum] decimal(18,2) NOT NULL, [payed] decimal(18,2) NOT NULL, [payedDate] datetime2 NULL, [dueDate] datetime2 NOT NULL, [transferId] int NULL, [coveredUntil] datetime2 NOT NULL, [allocationDate] datetime2 NULL, [contractYear] int NOT NULL, [final] bit NOT NULL, [finalDate] datetime2 NULL, [numberInYear] int NOT NULL, [allocationId] int NULL, [currency] nvarchar(MAX) NULL, [cancellationDate] datetime2 NULL, [compensationDate] datetime2 NULL, [custom] bit NOT NULL, [created] datetime2 NULL, [penaltyInterest] decimal(18,2) NOT NULL, [normalDueDate] datetime2 NULL, [changeId] int NULL );
CREATE TABLE [dbo].[PayPlanDetail] ( [id] int IDENTITY(1,1) NOT NULL, [payPlanId] int NOT NULL, [amount] decimal(18,2) NOT NULL, [concept] nvarchar(MAX) NULL, [detail] nvarchar(MAX) NULL, [order] int NOT NULL, [paid] decimal(18,2) NOT NULL );
CREATE TABLE [dbo].[PensionAccountType] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PensionBatchOperation] ( [id] int IDENTITY(1,1) NOT NULL, [pensionSchemeId] int NOT NULL, [batchId] int NULL, [name] nvarchar(MAX) NULL, [processId] int NULL );
CREATE TABLE [dbo].[PensionBeneficiary] ( [id] int IDENTITY(1,1) NOT NULL, [pensionMemberId] int NOT NULL, [contactId] int NOT NULL, [percentage] decimal(18,4) NOT NULL, [relationshipId] int NOT NULL );
CREATE TABLE [dbo].[PensionDocument] ( [id] int IDENTITY(1,1) NOT NULL, [pensionSchemeId] int NOT NULL, [templateName] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [status] nvarchar(450) NULL );
CREATE TABLE [dbo].[PensionMember] ( [id] int IDENTITY(1,1) NOT NULL, [pensionSchemeId] int NOT NULL, [contactId] int NOT NULL, [statusCode] nvarchar(450) NULL, [statusMsg] nvarchar(MAX) NULL, [jProjections] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PensionMemberRequirement] ( [id] int IDENTITY(1,1) NOT NULL, [pensionMemberId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [blockLevel] int NOT NULL, [status] int NOT NULL, [statusDate] datetime2 NULL, [contactDocumentId] int NULL );
CREATE TABLE [dbo].[PensionMemberStatusCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [active] bit NOT NULL, [invalid] bit NOT NULL );
CREATE TABLE [dbo].[PensionProduct] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PensionRequirement] ( [id] int IDENTITY(1,1) NOT NULL, [pensionSchemeId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [blockLevel] int NOT NULL, [status] int NOT NULL, [statusDate] datetime2 NULL, [pensionDocumentId] int NULL );
CREATE TABLE [dbo].[PensionScheme] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [active] bit NOT NULL, [description] nvarchar(MAX) NULL, [start] datetime2 NOT NULL, [end] datetime2 NULL, [establishmentDate] datetime2 NULL, [holderId] int NOT NULL, [pensionType] nvarchar(MAX) NULL, [benefitType] nvarchar(MAX) NULL, [fundType] nvarchar(MAX) NULL, [memberType] nvarchar(MAX) NULL, [currency] nvarchar(450) NULL, [minMembershipAge] int NOT NULL, [maxMembershipAge] int NOT NULL, [minServiceDuration] int NOT NULL, [employerContributionRate] decimal(18,4) NOT NULL, [memberContributionRate] decimal(18,4) NOT NULL, [voluntaryContributionRate] decimal(18,4) NOT NULL, [taxExemptLimit] decimal(18,2) NOT NULL, [earlyRetirementAge] int NULL, [normalRetirementAge] int NOT NULL, [lateRetirementAge] int NULL, [illRetirementAge] int NULL, [processId] int NULL, [productCode] nvarchar(450) NULL, [fundId] int NULL, [jProjections] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Policy] ( [code] nvarchar(450) NOT NULL, [product] nvarchar(MAX) NULL, [contactId] int NOT NULL, [start] datetime2 NOT NULL, [end] datetime2 NOT NULL, [memberSince] datetime2 NOT NULL, [anualLimit] decimal(18,2) NULL, [lifetimeLimit] decimal(18,2) NULL, [covers] nvarchar(MAX) NULL, [benefits] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PolicyAllowedUsers] ( [id] int IDENTITY(1,1) NOT NULL, [policyId] int NOT NULL, [user] nvarchar(450) NULL );
CREATE TABLE [dbo].[PolicyEvent] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [name] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL, [user] nvarchar(MAX) NULL, [date] datetime2 NOT NULL, [description] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PolicyTag] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [tag] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Portfolio] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [legalEntity] nvarchar(MAX) NULL, [fundType] nvarchar(MAX) NULL, [portfolioManager] nvarchar(MAX) NULL, [productLine] nvarchar(MAX) NULL, [investmentStrategy] nvarchar(MAX) NULL, [totalValue] decimal(18,2) NOT NULL, [unrealizedGL] decimal(18,2) NOT NULL, [realizedGL] decimal(18,2) NOT NULL, [dayChange] decimal(18,2) NOT NULL, [dayChangePercent] decimal(18,4) NOT NULL, [currency] nvarchar(MAX) NULL, [isActive] bit NOT NULL, [createdAt] datetime2 NOT NULL, [updatedAt] datetime2 NOT NULL );
CREATE TABLE [dbo].[PortfolioContract] ( [id] int IDENTITY(1,1) NOT NULL, [portfolioDefinitionId] int NOT NULL, [contractType] nvarchar(MAX) NULL, [start] datetime2 NOT NULL, [end] datetime2 NULL, [insuredSum] decimal(18,2) NOT NULL, [value] decimal(18,2) NOT NULL, [created] datetime2 NOT NULL, [lifeCoverageId] int NOT NULL, [currency] nvarchar(MAX) NULL, [lifePolicyId] int NOT NULL, [coverageCode] nvarchar(MAX) NULL, [policyCode] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PortfolioDefinition] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [lob] nvarchar(MAX) NULL, [product] nvarchar(MAX) NULL, [coverage] nvarchar(MAX) NULL, [year] int NOT NULL, [onerousGroup] int NOT NULL, [configJson] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [currency] nvarchar(MAX) NULL, [items] int NOT NULL, [value] decimal(18,2) NOT NULL );
CREATE TABLE [dbo].[PortfolioHolding] ( [id] int IDENTITY(1,1) NOT NULL, [portfolioId] int NOT NULL, [investmentPlanCode] nvarchar(450) NULL, [symbol] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [assetType] nvarchar(450) NULL, [quantity] decimal(18,2) NOT NULL, [avgPrice] decimal(18,2) NOT NULL, [currentPrice] decimal(18,2) NOT NULL, [marketValue] decimal(18,2) NOT NULL, [unrealizedGL] decimal(18,2) NOT NULL, [dayChange] decimal(18,2) NOT NULL, [dayChangePercent] decimal(18,4) NOT NULL, [weight] decimal(18,4) NOT NULL, [createdAt] datetime2 NOT NULL, [updatedAt] datetime2 NOT NULL );
CREATE TABLE [dbo].[PortfolioHoldingMov] ( [id] int IDENTITY(1,1) NOT NULL, [portfolioHoldingId] int NOT NULL, [investmentPlanCode] nvarchar(450) NULL, [movementType] nvarchar(MAX) NULL, [quantity] decimal(18,2) NOT NULL, [price] decimal(18,2) NOT NULL, [amount] decimal(18,2) NOT NULL, [fees] decimal(18,2) NOT NULL, [total] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [account] nvarchar(MAX) NULL, [status] nvarchar(MAX) NULL, [notes] nvarchar(MAX) NULL, [date] datetime2 NOT NULL, [createdAt] datetime2 NOT NULL, [updatedAt] datetime2 NOT NULL );
CREATE TABLE [dbo].[PortfolioTransfer] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [createdBy] nvarchar(MAX) NULL, [executed] datetime2 NULL, [status] nvarchar(MAX) NULL, [destinationContractId] int NOT NULL, [selectionId] int NOT NULL, [scheduled] datetime2 NULL );
CREATE TABLE [dbo].[PresentationDefinition] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [portfolioDefinitionId] int NOT NULL, [measurementDefinitionId] int NOT NULL, [config] nvarchar(MAX) NULL, [jConfig] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[PriorityCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Procedure] ( [id] int IDENTITY(1,1) NOT NULL, [claimId] int NOT NULL, [from] datetime2 NOT NULL, [to] datetime2 NOT NULL, [cpt] nvarchar(450) NULL, [service] nvarchar(MAX) NULL, [total] decimal(18,2) NOT NULL, [company] decimal(18,2) NOT NULL, [insured] decimal(18,2) NOT NULL, [description] nvarchar(MAX) NULL, [providerCode] nvarchar(450) NULL, [status] int NOT NULL, [benefitCode] nvarchar(MAX) NULL, [coverageCode] nvarchar(MAX) NULL, [copayment] decimal(18,2) NULL, [deductible] decimal(18,2) NULL, [rejectionText] nvarchar(MAX) NULL, [jFormValues] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProcedureAdjudication] ( [id] int IDENTITY(1,1) NOT NULL, [procedureId] int NOT NULL, [benefitCode] nvarchar(MAX) NULL, [coverageCode] nvarchar(MAX) NULL, [date] datetime2 NOT NULL, [total] decimal(18,2) NOT NULL, [copay] decimal(18,2) NULL, [covered] decimal(18,2) NOT NULL, [rule] nvarchar(MAX) NULL, [deductible] decimal(18,2) NULL, [aDeductible] decimal(18,2) NULL, [qDeductible] decimal(18,2) NULL, [mDeductible] decimal(18,2) NULL, [limit] decimal(18,2) NULL, [aLimit] decimal(18,2) NULL, [qLimit] decimal(18,2) NULL, [mLimit] decimal(18,2) NULL, [familyLimit] decimal(18,2) NULL, [lifetimeLimit] decimal(18,2) NULL, [eventaTimes] int NULL, [eventqTimes] int NULL, [eventmTimes] int NULL, [eventdTimes] int NULL, [outOfPocketAnualLimit] decimal(18,2) NULL, [waitingPeriod] int NULL, [capped] bit NOT NULL, [PolicyBenefitid] int NULL );
CREATE TABLE [dbo].[Proceso] ( [id] int IDENTITY(1,1) NOT NULL, [definitionId] int NOT NULL, [nombre] nvarchar(MAX) NULL, [finalizado] bit NOT NULL, [iniciando] bit NOT NULL, [estado] nvarchar(MAX) NULL, [estadoId] nvarchar(MAX) NULL, [formId] int NULL, [responsable] nvarchar(450) NULL, [usuario] nvarchar(MAX) NULL, [fInicio] datetime2 NOT NULL, [fFin] datetime2 NULL, [entityState] nvarchar(MAX) NULL, [entity] nvarchar(MAX) NULL, [entityId] nvarchar(MAX) NULL, [entityPath] nvarchar(MAX) NULL, [userActions] nvarchar(MAX) NULL, [grupoId] int NULL, [hasEvents] bit NOT NULL, [stamp] nvarchar(MAX) NULL, [hasTimers] bit NOT NULL, [blockedBy] int NULL, [entityStateReason] nvarchar(MAX) NULL, [eventsDisabled] bit NOT NULL, [entryLogic] nvarchar(MAX) NULL, [dueDate] datetime2 NULL, [progress] int NULL );
CREATE TABLE [dbo].[ProcesoArchivo] ( [id] int IDENTITY(1,1) NOT NULL, [procesoId] int NOT NULL, [stepName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [status] nvarchar(450) NULL );
CREATE TABLE [dbo].[ProcesoDto] ( [id] int IDENTITY(1,1) NOT NULL, [procesoId] int NOT NULL, [estadoId] nvarchar(MAX) NULL, [estado] nvarchar(MAX) NULL, [fIngreso] datetime2 NOT NULL, [dto] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProcesoEtiqueta] ( [id] int IDENTITY(1,1) NOT NULL, [procesoId] int NOT NULL, [nombre] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProcesoEvent] ( [id] int IDENTITY(1,1) NOT NULL, [procesoId] int NOT NULL, [name] nvarchar(MAX) NULL, [date] datetime2 NOT NULL, [ok] bit NOT NULL, [msg] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProcesoMsg] ( [id] int IDENTITY(1,1) NOT NULL, [procesoId] int NOT NULL, [usuario] nvarchar(MAX) NULL, [fecha] datetime2 NOT NULL, [html] nvarchar(MAX) NULL, [estado] nvarchar(MAX) NULL, [estadoId] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProcesoPaso] ( [id] int IDENTITY(1,1) NOT NULL, [procesoId] int NOT NULL, [estadoId] nvarchar(MAX) NULL, [estado] nvarchar(MAX) NULL, [fecha] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [evento] nvarchar(MAX) NULL, [sla] decimal(18,2) NOT NULL, [fechaFin] datetime2 NULL, [tiempo] float NOT NULL, [entityState] nvarchar(MAX) NULL, [entityStateReason] nvarchar(MAX) NULL, [groupId] int NULL );
CREATE TABLE [dbo].[Product] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [lobCode] nvarchar(450) NULL, [environment] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [parentCode] nvarchar(450) NULL, [configJsonOwn] nvarchar(MAX) NULL, [subLobCode] nvarchar(450) NULL, [selfService] bit NOT NULL );
CREATE TABLE [dbo].[ProductHistory] ( [id] int IDENTITY(1,1) NOT NULL, [created] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [code] nvarchar(450) NULL, [name] nvarchar(MAX) NULL, [lobCode] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [configJsonOwn] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProfitCommission] ( [id] int IDENTITY(1,1) NOT NULL, [contractId] int NOT NULL, [schemeId] int NOT NULL, [name] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [start] datetime2 NULL, [end] datetime2 NULL, [perParticipant] bit NOT NULL );
CREATE TABLE [dbo].[ProfitCommissionLiquidation] ( [id] int IDENTITY(1,1) NOT NULL, [profitCommissionId] int NOT NULL, [participantId] int NOT NULL, [participantName] nvarchar(MAX) NULL, [liquidationName] nvarchar(MAX) NULL, [creation] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [total] decimal(18,2) NOT NULL, [status] int NOT NULL, [processId] int NULL, [paymentRequestId] int NULL, [end] datetime2 NOT NULL, [start] datetime2 NOT NULL, [participantAccountId] int NULL, [jDetail] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProfitCommissionParticipant] ( [id] int IDENTITY(1,1) NOT NULL, [profitCommissionId] int NOT NULL, [contactId] int NULL, [split] decimal(18,2) NOT NULL, [accountId] int NULL );
CREATE TABLE [dbo].[Project] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [progress] float NOT NULL, [version] int NOT NULL, [status] nvarchar(MAX) NULL, [owner] nvarchar(MAX) NULL, [jConfig] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProjectTask] ( [id] int IDENTITY(1,1) NOT NULL, [projectId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [start] datetime2 NOT NULL, [end] datetime2 NOT NULL, [progress] float NOT NULL, [level] int NOT NULL, [kind] nvarchar(MAX) NULL, [parentId] int NULL );
CREATE TABLE [dbo].[ProjectTaskCard] ( [id] int IDENTITY(1,1) NOT NULL, [projectTaskColId] int NOT NULL, [projectTaskId] int NOT NULL, [projectId] int NOT NULL, [name] nvarchar(MAX) NULL, [order] decimal(18,4) NOT NULL, [content] nvarchar(MAX) NULL, [user] nvarchar(450) NULL );
CREATE TABLE [dbo].[ProjectTaskCol] ( [id] int IDENTITY(1,1) NOT NULL, [projectTaskId] int NOT NULL, [name] nvarchar(MAX) NULL, [order] decimal(18,4) NOT NULL, [status] int NOT NULL );
CREATE TABLE [dbo].[Provider] ( [code] nvarchar(450) NOT NULL, [legalId] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [cell] nvarchar(MAX) NULL, [phone] nvarchar(MAX) NULL, [email] nvarchar(MAX) NULL, [fax] nvarchar(MAX) NULL, [address] nvarchar(MAX) NULL, [specialties] nvarchar(MAX) NULL, [priority] int NOT NULL, [notes] nvarchar(MAX) NULL, [areaServed] nvarchar(MAX) NULL, [city] nvarchar(MAX) NULL, [country] nvarchar(MAX) NULL, [location] nvarchar(MAX) NULL, [state] nvarchar(MAX) NULL, [networks] nvarchar(MAX) NULL, [jCustomForm] nvarchar(MAX) NULL, [active] bit NOT NULL, [contactId] int NULL, [providerType] nvarchar(MAX) NULL, [processId] int NULL, [providerSubType] nvarchar(MAX) NULL, [areaServedDetail] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProviderChange] ( [id] int IDENTITY(1,1) NOT NULL, [providerCode] nvarchar(450) NULL, [processId] int NULL, [creation] datetime2 NOT NULL, [user] nvarchar(MAX) NULL, [jBefore] nvarchar(MAX) NULL, [jAfter] nvarchar(MAX) NULL, [status] int NOT NULL, [operation] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProviderDocument] ( [id] int IDENTITY(1,1) NOT NULL, [templateName] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [providerCode] nvarchar(450) NULL, [status] nvarchar(450) NULL, [requirementId] int NULL );
CREATE TABLE [dbo].[ProviderPrice] ( [id] int IDENTITY(1,1) NOT NULL, [providerCode] nvarchar(450) NULL, [procedureCode] nvarchar(MAX) NULL, [agreedPrice] decimal(18,2) NOT NULL, [publicPrice] decimal(18,2) NOT NULL, [start] datetime2 NOT NULL, [end] datetime2 NULL, [notes] nvarchar(MAX) NULL, [currency] nvarchar(MAX) NULL, [lob] nvarchar(MAX) NULL, [policyId] int NULL, [specificPrice] bit NOT NULL );
CREATE TABLE [dbo].[ProviderRequirement] ( [id] int IDENTITY(1,1) NOT NULL, [providerCode] nvarchar(450) NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [blockLevel] int NOT NULL, [request] bit NOT NULL, [requestDate] datetime2 NULL, [response] bit NOT NULL, [responseDate] datetime2 NULL, [comments] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ProviderTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [subType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ReasonsCatalog] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [catalog] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ReceiptTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [codeType] nvarchar(MAX) NULL, [digits] int NULL, [prependString] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Reconciliation] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [status] int NOT NULL, [accountId] int NULL, [transactionCount] int NOT NULL, [matchedCount] int NOT NULL, [unmatchedCount] int NOT NULL, [totalAmount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [createdBy] nvarchar(MAX) NULL, [createdDate] datetime2 NOT NULL, [executedDate] datetime2 NULL, [jData] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ReEvent] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [catastrophic] bit NOT NULL, [start] datetime2 NOT NULL, [end] datetime2 NULL );
CREATE TABLE [dbo].[ReinsuranceDocument] ( [id] int IDENTITY(1,1) NOT NULL, [contractCode] nvarchar(MAX) NULL, [templateName] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [status] nvarchar(450) NULL );
CREATE TABLE [dbo].[Relationship] ( [id] int IDENTITY(1,1) NOT NULL, [contactId] int NOT NULL, [relatedId] int NOT NULL, [name] nvarchar(MAX) NULL, [type] nvarchar(MAX) NULL, [contactName] nvarchar(MAX) NULL, [end] datetime2 NULL, [start] datetime2 NULL );
CREATE TABLE [dbo].[RelationshipCatalog] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [principalType] nvarchar(MAX) NULL, [expires] bit NOT NULL, [targetType] nvarchar(MAX) NULL, [rule] nvarchar(MAX) NULL, [nameInverse] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Report] ( [id] int IDENTITY(1,1) NOT NULL, [area] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [restricted] bit NOT NULL );
CREATE TABLE [dbo].[ReportAllowedUsers] ( [id] int IDENTITY(1,1) NOT NULL, [reportId] int NOT NULL, [user] nvarchar(450) NULL );
CREATE TABLE [dbo].[ReqCatalog] ( [code] nvarchar(450) NOT NULL, [document] nvarchar(MAX) NULL, [type] int NOT NULL, [condition] nvarchar(MAX) NULL, [comments] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Requirement] ( [id] int IDENTITY(1,1) NOT NULL, [claimId] int NOT NULL, [code] nvarchar(MAX) NULL, [document] nvarchar(MAX) NULL, [type] int NOT NULL, [date] datetime2 NOT NULL, [tags] nvarchar(MAX) NULL, [request] bit NOT NULL, [requestDate] datetime2 NULL, [requestLink] nvarchar(MAX) NULL, [response] bit NOT NULL, [responseDate] datetime2 NULL, [responseLink] nvarchar(MAX) NULL, [comments] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ReserveSnapshot] ( [id] int IDENTITY(1,1) NOT NULL, [asOfDate] datetime2 NOT NULL, [reserveTypeCode] nvarchar(450) NULL, [reserveLevel] int NOT NULL, [policyId] int NULL, [claimId] int NULL, [productCode] nvarchar(450) NULL, [lobCode] nvarchar(450) NULL, [treatyCode] nvarchar(MAX) NULL, [eventCode] nvarchar(MAX) NULL, [portfolioKey] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ReserveType] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [isClaimBased] bit NOT NULL );
CREATE TABLE [dbo].[RiskAnalysis] ( [id] int IDENTITY(1,1) NOT NULL, [lifePolicyId] int NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [factor] float NOT NULL, [action] nvarchar(MAX) NULL, [lastChecked] datetime2 NULL );
CREATE TABLE [dbo].[RiskClassCatalog] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[RiskTypeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[RoleCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [personType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Rule] ( [id] int IDENTITY(1,1) NOT NULL, [cmd] nvarchar(MAX) NULL, [condition] nvarchar(MAX) NULL, [order] int NOT NULL, [exe] nvarchar(MAX) NULL, [preHook] bit NOT NULL );
CREATE TABLE [dbo].[RuleDmn] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(450) NULL, [xml] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Salvage] ( [id] int IDENTITY(1,1) NOT NULL, [claimId] int NOT NULL, [coverageId] int NOT NULL, [type] int NOT NULL, [buyerId] int NULL, [recovererId] int NULL, [start] datetime2 NULL, [currency] nvarchar(MAX) NULL, [income] decimal(18,2) NOT NULL, [expenses] decimal(18,2) NOT NULL, [netIncome] decimal(18,2) NOT NULL, [entityState] nvarchar(MAX) NULL, [processId] int NULL, [jRetentions] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[SalvageType] ( [id] int NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[SectorCatalog] ( [id] int IDENTITY(1,1) NOT NULL, [cityCode] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[SegmentCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Selection] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [entity] nvarchar(MAX) NULL, [jSelection] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[ServiceLiquidation] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [providerCode] nvarchar(450) NULL, [created] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [status] int NOT NULL, [processId] int NULL, [paymentRequestId] int NULL, [destinationAccountId] int NULL, [sourceAccountId] int NULL );
CREATE TABLE [dbo].[ServiceOrder] ( [id] int IDENTITY(1,1) NOT NULL, [providerCode] nvarchar(450) NULL, [description] nvarchar(MAX) NULL, [price] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [cptCode] nvarchar(450) NULL, [serviceDate] datetime2 NOT NULL, [serviceLiquidationId] int NULL, [created] datetime2 NOT NULL );
CREATE TABLE [dbo].[SpecialtyCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[SplitPayment] ( [id] int IDENTITY(1,1) NOT NULL, [transferId] int NOT NULL, [paymentMethod] nvarchar(450) NULL, [amount] decimal(18,2) NOT NULL, [conversion] bit NOT NULL, [currency] nvarchar(MAX) NULL, [exchangeRate] decimal(18,4) NOT NULL, [amountEx] decimal(18,2) NOT NULL, [formId] int NULL, [jValues] nvarchar(MAX) NULL, [paymentMethodName] nvarchar(MAX) NULL, [depositId] int NULL, [disputeEnd] datetime2 NULL, [disputeStart] datetime2 NULL );
CREATE TABLE [dbo].[StateCatalog] ( [id] int IDENTITY(1,1) NOT NULL, [countryCode] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [riskZone] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[SubLob] ( [code] nvarchar(450) NOT NULL, [lobCode] nvarchar(450) NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[SubParticipant] ( [id] int IDENTITY(1,1) NOT NULL, [participantId] int NOT NULL, [contactId] int NOT NULL, [split] decimal(18,2) NOT NULL, [commissionRate] decimal(18,2) NOT NULL, [taxRate] decimal(18,2) NOT NULL, [notes] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[SurchargeCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Table] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [data] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Tag] ( [tag] nvarchar(450) NOT NULL, [contactId] int NOT NULL );
CREATE TABLE [dbo].[TaxGenerated] ( [id] int IDENTITY(1,1) NOT NULL, [taxSchemeId] int NOT NULL, [action] nvarchar(MAX) NULL, [lifePolicyId] int NULL, [taxName] nvarchar(MAX) NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [changeId] int NULL, [liquidationId] int NULL, [disabled] bit NOT NULL, [claimPaymentId] int NULL, [paymentTaxId] int NULL, [anniversaryId] int NULL );
CREATE TABLE [dbo].[TaxLiquidation] ( [id] int IDENTITY(1,1) NOT NULL, [taxSchemeId] int NOT NULL, [liquidationName] nvarchar(MAX) NULL, [contactId] int NOT NULL, [creation] datetime2 NOT NULL, [currency] nvarchar(MAX) NULL, [taxes] decimal(18,2) NOT NULL, [deducted] decimal(18,2) NOT NULL, [total] decimal(18,2) NOT NULL, [status] int NOT NULL, [from] datetime2 NOT NULL, [to] datetime2 NOT NULL, [taxName] nvarchar(MAX) NULL, [jAffected] nvarchar(MAX) NULL, [processId] int NULL );
CREATE TABLE [dbo].[TaxScheme] ( [id] int IDENTITY(1,1) NOT NULL, [code] nvarchar(MAX) NULL, [name] nvarchar(MAX) NULL, [active] bit NOT NULL, [start] datetime2 NULL, [end] datetime2 NULL, [config] nvarchar(MAX) NULL, [configJson] nvarchar(MAX) NULL, [notes] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Transaction] ( [id] int IDENTITY(1,1) NOT NULL, [date] datetime2 NOT NULL, [effectiveDate] datetime2 NULL, [code] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [status] int NOT NULL, [notes] nvarchar(MAX) NULL, [templateCode] nvarchar(MAX) NULL, [operationCode] int NOT NULL, [entity] nvarchar(MAX) NULL, [entityId] int NOT NULL, [entityLink] nvarchar(MAX) NULL, [reference] nvarchar(MAX) NULL, [manual] bit NOT NULL, [user] nvarchar(MAX) NULL, [processId] int NULL, [closureId] int NULL, [reversalDate] datetime2 NULL, [organizationId] int NULL, [baseCurrency] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[TransactionLine] ( [id] int IDENTITY(1,1) NOT NULL, [order] int NOT NULL, [account] nvarchar(450) NULL, [debit] decimal(22,6) NOT NULL, [symbol] nvarchar(MAX) NULL, [comments] nvarchar(MAX) NULL, [transactionId] int NOT NULL, [credit] decimal(22,6) NOT NULL, [auxId] nvarchar(MAX) NULL, [xChangeRate] decimal(21,12) NULL, [xCredit] decimal(22,6) NULL, [xCurrency] nvarchar(MAX) NULL, [xDebit] decimal(22,6) NULL, [yChangeRate] decimal(21,12) NULL, [zChangeRate] decimal(21,12) NULL, [yDebit] decimal(38,12) NULL, [yCredit] decimal(38,12) NULL, [zDebit] decimal(38,12) NULL, [zCredit] decimal(38,12) NULL );
CREATE TABLE [dbo].[TransactionLineAmount] ( [id] int IDENTITY(1,1) NOT NULL, [transactionLineId] int NOT NULL, [currency] nvarchar(MAX) NULL, [debit] decimal(18,2) NOT NULL, [credit] decimal(18,2) NOT NULL, [rateToTxn] decimal(21,12) NULL, [rateDate] datetime2 NULL, [valuationType] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[TransactionLineAux] ( [id] int IDENTITY(1,1) NOT NULL, [transactionLineId] int NOT NULL, [auxId] nvarchar(MAX) NULL, [auxTypeCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[TransactionLineCostCenter] ( [id] int IDENTITY(1,1) NOT NULL, [transactionLineId] int NOT NULL, [costCenterCode] nvarchar(450) NULL, [valueCode] nvarchar(MAX) NULL, [value] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[TransactionTemplate] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [jConfig] nvarchar(MAX) NULL, [config] nvarchar(MAX) NULL, [active] bit NOT NULL );
CREATE TABLE [dbo].[Transfer] ( [id] int IDENTITY(1,1) NOT NULL, [amount] decimal(18,2) NOT NULL, [currency] nvarchar(MAX) NULL, [concept] nvarchar(MAX) NULL, [sourceAccountId] int NULL, [sourceName] nvarchar(MAX) NULL, [destinationAccountId] int NULL, [destinationName] nvarchar(MAX) NULL, [executed] bit NOT NULL, [status] int NOT NULL, [date] datetime2 NOT NULL, [allocationId] int NULL, [sourceExternal] nvarchar(MAX) NULL, [isExternal] bit NOT NULL, [transactionCode] nvarchar(MAX) NULL, [operatingAccountId] int NOT NULL, [lifePolicyId] int NULL, [producer] nvarchar(MAX) NULL, [reversalDate] datetime2 NULL, [incomeType] nvarchar(450) NULL, [transferWorkspaceId] int NULL, [jForm] nvarchar(MAX) NULL, [formId] int NULL, [processId] int NULL, [claimId] int NULL, [jIncomeTypeForm] nvarchar(MAX) NULL, [reversalCause] nvarchar(MAX) NULL, [reversalSubcause] nvarchar(MAX) NULL, [jReversalFormValues] nvarchar(MAX) NULL, [claimPaymentId] int NULL, [coverageId] int NULL, [user] nvarchar(MAX) NULL, [processIdAux] int NULL, [approvalId] int NULL );
CREATE TABLE [dbo].[TransferDocument] ( [id] int IDENTITY(1,1) NOT NULL, [transferId] int NOT NULL, [name] nvarchar(MAX) NULL, [fileName] nvarchar(MAX) NULL, [url] nvarchar(MAX) NULL, [created] datetime2 NOT NULL, [association] nvarchar(MAX) NULL, [status] nvarchar(450) NULL );
CREATE TABLE [dbo].[TransferReversalCause] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [formId] int NULL );
CREATE TABLE [dbo].[TransferReversalSubcause] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [causeCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[TransferWorkspace] ( [id] int IDENTITY(1,1) NOT NULL, [user] nvarchar(MAX) NULL, [date] datetime2 NOT NULL, [branchCode] nvarchar(450) NULL, [closed] bit NOT NULL );
CREATE TABLE [dbo].[Trigger] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [code] nvarchar(MAX) NULL, [condition] nvarchar(MAX) NULL, [action] nvarchar(MAX) NULL, [enabled] bit NOT NULL, [listensTo] nvarchar(MAX) NULL, [context] nvarchar(MAX) NULL, [logDto] bit NOT NULL, [logToCommand] bit NOT NULL, [uiCode] nvarchar(MAX) NULL, [interceptor] bit NOT NULL, [actionType] int NOT NULL );
CREATE TABLE [dbo].[TriggerLog] ( [id] int IDENTITY(1,1) NOT NULL, [triggerId] int NOT NULL, [entityId] int NOT NULL, [execution] datetime2 NOT NULL, [ok] bit NOT NULL, [msg] nvarchar(MAX) NULL, [dto] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[UmbrellaGroupCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[UserValues] ( [id] int IDENTITY(1,1) NOT NULL, [procesoId] int NOT NULL, [estadoId] nvarchar(MAX) NULL, [estado] nvarchar(MAX) NULL, [formualarioId] int NOT NULL, [json] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[Usr] ( [email] nvarchar(450) NOT NULL, [nombre] nvarchar(MAX) NULL, [esAdmin] bit NOT NULL, [clave] nvarchar(MAX) NULL, [token] nvarchar(MAX) NULL, [otp] nvarchar(MAX) NULL, [blocked] bit NOT NULL, [retries] int NOT NULL, [lastLogin] datetime2 NULL, [lastPasswordChange] datetime2 NULL, [branchCode] nvarchar(450) NULL, [external] bit NOT NULL, [contactId] int NULL, [forcePasswordChange] bit NOT NULL );
CREATE TABLE [dbo].[UsrBranchMembership] ( [id] int IDENTITY(1,1) NOT NULL, [email] nvarchar(450) NULL, [branchCode] nvarchar(450) NULL );
CREATE TABLE [dbo].[UsrChangeHistory] ( [id] int IDENTITY(1,1) NOT NULL, [date] datetime2 NOT NULL, [by] nvarchar(MAX) NULL, [user] nvarchar(MAX) NULL, [userName] nvarchar(MAX) NULL, [action] nvarchar(MAX) NULL, [description] nvarchar(MAX) NULL, [groupName] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[UsrCredential] ( [id] nvarchar(450) NOT NULL, [userId] nvarchar(450) NULL, [publicKey] nvarchar(MAX) NULL, [counter] bigint NOT NULL, [createdAt] datetime2 NOT NULL, [lastUsedAt] datetime2 NOT NULL, [credentialId] nvarchar(MAX) NULL, [transports] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[UsrGroup] ( [id] int IDENTITY(1,1) NOT NULL, [name] nvarchar(MAX) NULL, [jPermissions] nvarchar(MAX) NULL, [jActions] nvarchar(MAX) NULL );
CREATE TABLE [dbo].[UsrGroupMembership] ( [id] int IDENTITY(1,1) NOT NULL, [usrEmail] nvarchar(450) NULL, [usrGroupId] int NOT NULL );
CREATE TABLE [dbo].[UsrGroupOrganization] ( [id] int IDENTITY(1,1) NOT NULL, [usrGroupId] int NOT NULL, [organizationId] int NOT NULL );
CREATE TABLE [dbo].[UsrPassReset] ( [id] int IDENTITY(1,1) NOT NULL, [email] nvarchar(MAX) NULL, [token] nvarchar(MAX) NULL, [tokenExpiry] datetime2 NULL, [ipAddress] nvarchar(MAX) NULL, [userAgent] nvarchar(MAX) NULL, [requestTime] datetime2 NOT NULL, [usedAt] datetime2 NULL, [isSuccess] bit NOT NULL );
CREATE TABLE [dbo].[ValueAddedCatalog] ( [code] nvarchar(450) NOT NULL, [name] nvarchar(MAX) NULL, [rate] decimal(18,4) NOT NULL, [taxType] nvarchar(MAX) NULL );

go

truncate table [Product]

INSERT INTO [dbo].[Product]
(
    [code],
    [name],
    [lobCode],
    [environment],
    [config],
    [configJson],
    [parentCode],
    [configJsonOwn],
    [subLobCode],
    [selfService]
)
VALUES
-- Productos raíz
('PRD_AUTO', 'Seguro de Autos', 'AUTO', 'PROD', NULL,
 '{"requiresInspection":true,"maxCoverage":50000}', NULL,
 '{"uiTheme":"auto"}', 'AUTO_STD', 1),

('PRD_HOGAR', 'Seguro de Hogar', 'HOME', 'PROD', NULL,
 '{"requiresInspection":false,"maxCoverage":100000}', NULL,
 '{"uiTheme":"home"}', 'HOME_STD', 1),

('PRD_SALUD', 'Seguro de Salud', 'HEALTH', 'PROD', NULL,
 '{"network":"premium","copay":20}', NULL,
 '{"uiTheme":"health"}', 'HLT_STD', 0),

-- Hijos de AUTO
('PRD_AUTO_BASIC', 'Auto Básico', 'AUTO', 'PROD', NULL,
 '{"coverage":"basic","deductible":500}', 'PRD_AUTO',
 '{"discount":0}', 'AUTO_BASIC', 1),

('PRD_AUTO_PLUS', 'Auto Plus', 'AUTO', 'PROD', NULL,
 '{"coverage":"plus","deductible":250}', 'PRD_AUTO',
 '{"discount":5}', 'AUTO_PLUS', 1),

('PRD_AUTO_PREMIUM', 'Auto Premium', 'AUTO', 'PROD', NULL,
 '{"coverage":"full","deductible":100}', 'PRD_AUTO',
 '{"discount":10}', 'AUTO_PREMIUM', 1),

-- Hijos de HOGAR
('PRD_HOGAR_BASIC', 'Hogar Básico', 'HOME', 'PROD', NULL,
 '{"coverage":"basic","fire":true}', 'PRD_HOGAR',
 '{"discount":0}', 'HOME_BASIC', 0),

('PRD_HOGAR_FULL', 'Hogar Full', 'HOME', 'PROD', NULL,
 '{"coverage":"full","fire":true,"theft":true}', 'PRD_HOGAR',
 '{"discount":7}', 'HOME_FULL', 0),

-- Hijos de SALUD
('PRD_SALUD_AMB', 'Salud Ambulatorio', 'HEALTH', 'PROD', NULL,
 '{"coverage":"ambulatory","copay":30}', 'PRD_SALUD',
 '{"discount":0}', 'HLT_AMB', 0),

('PRD_SALUD_INT', 'Salud Integral', 'HEALTH', 'PROD', NULL,
 '{"coverage":"integral","copay":10}', 'PRD_SALUD',
 '{"discount":5}', 'HLT_INT', 0);

 
 
 GO

 truncate table [Contact]

 ;WITH N AS (
    SELECT TOP (100)
           ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.objects
)
INSERT INTO [dbo].[Contact]
(
    [name],
    [surname1],
    [surname2],
    [middleName],
    [birth],
    [title],
    [gender],
    [passport],
    [fiscalNumber],
    [city],
    [country],
    [phone],
    [state],
    [zip],
    [email],
    [isPerson],
    [idType],
    [nationality],
    [genericField],
    [addressType],
    [maritalStatus],
    [citizenship],
    [occupationId],
    [amlRiskId],
    [risk],
    [bmi],
    [height],
    [weight],
    [income],
    [incomeCurrency],
    [occupationSectorCode],
    [bank],
    [bankAccount],
    [cnp],
    [coHqCountry],
    [coLegalRepName],
    [coPersonOfContact1],
    [coPersonOfContact2],
    [coTradeRegister],
    [coWeb],
    [created],
    [customerDate],
    [docsLink],
    [fatcaTaxCode],
    [fatcaTinGinCode],
    [inactive],
    [marketingAgreement],
    [migrationCode],
    [nationalId],
    [nationalIdExpiration],
    [nif],
    [notificationChannel],
    [preferedCommunicationMethod],
    [publicStatus],
    [workplace],
    [address1],
    [address2],
    [cif],
    [holdingId],
    [updated],
    [jAmlForm],
    [jCustomForms],
    [fatca],
    [legalRepresentativeId],
    [personOfContactId],
    [receiptTypeCode],
    [user],
    [processId],
    [organizationId],
    [createdBy]
)
SELECT
    CONCAT('Nombre', n),
    CONCAT('Apellido1_', n),
    CONCAT('Apellido2_', n),
    CONCAT('Middle_', n),
    DATEADD(YEAR, -25 - (n % 20), GETDATE()),
    CASE WHEN n % 2 = 0 THEN 'Mr' ELSE 'Ms' END,
    CASE WHEN n % 2 = 0 THEN 'M' ELSE 'F' END,
    CONCAT('P', FORMAT(n, '000000')),
    CONCAT('FISC', FORMAT(n, '000000')),
    'Managua',
    'NI',
    CONCAT('+5058', FORMAT(1000000 + n, '000000')),
    'Managua',
    '11001',
    CONCAT('contact', n, '@mail.com'),
    1,
    'CED',
    'Nicaragüense',
    NULL,
    'HOME',
    (n % 5) + 1,
    'NI',
    (n % 10) + 1,
    (n % 3) + 1,
    (n % 4) + 1,
    CAST(22.5 + (n % 5) AS DECIMAL(18,2)),
    CAST(1.65 + (n % 10) * 0.01 AS DECIMAL(18,2)),
    CAST(60 + (n % 20) AS DECIMAL(18,2)),
    CAST(500 + (n * 10) AS DECIMAL(18,2)),
    'USD',
    'FIN',
    'Banco Nacional',
    CONCAT('ACCT', FORMAT(n, '000000')),
    CONCAT('CNP', FORMAT(n, '000000')),
    'NI',
    CONCAT('Rep Legal ', n),
    CONCAT('Contacto1_', n),
    CONCAT('Contacto2_', n),
    CONCAT('REG', FORMAT(n, '000000')),
    'https://empresa.com',
    GETDATE(),
    GETDATE(),
    NULL,
    CONCAT('FATCA', n),
    CONCAT('TIN', n),
    0,
    'YES',
    CONCAT('MIG', n),
    CONCAT('ID', FORMAT(n, '000000')),
    DATEADD(YEAR, 10, GETDATE()),
    CONCAT('NIF', n),
    'EMAIL',
    'EMAIL',
    0,
    'Empresa XYZ',
    CONCAT('Dirección principal ', n),
    CONCAT('Dirección secundaria ', n),
    CONCAT('CIF', n),
    NULL,
    GETDATE(),
    NULL,
    NULL,
    CASE WHEN n % 2 = 0 THEN 1 ELSE 0 END,
    NULL,
    NULL,
    'DIGITAL',
    'system',
    NULL,
    1,
    'seed-script'
FROM N;

GO


truncate table lob

INSERT INTO [dbo].[Lob]
(
    [code],
    [name],
    [group],
    [ifrsCode],
    [legalCode],
    [productType]
)
VALUES
-- LOB principales (coincide con Product.lobCode)
('AUTO',   'Automóviles',        'P&C',     'IFRS17-PNC', 'LC-AUTO',   'INDIVIDUAL'),
('HOME',   'Hogar',              'P&C',     'IFRS17-PNC', 'LC-HOME',   'INDIVIDUAL'),
('HEALTH', 'Salud',              'LIFE',    'IFRS17-LF',  'LC-HEALTH', 'INDIVIDUAL'),

-- Sub-LOBs (coincide con Product.subLobCode)
('AUTO_STD',     'Auto Estándar',       'P&C', 'IFRS17-PNC', 'LC-AUTO-STD', 'INDIVIDUAL'),
('AUTO_BASIC',   'Auto Básico',         'P&C', 'IFRS17-PNC', 'LC-AUTO-BASIC', 'INDIVIDUAL'),
('AUTO_PLUS',    'Auto Plus',           'P&C', 'IFRS17-PNC', 'LC-AUTO-PLUS', 'INDIVIDUAL'),
('AUTO_PREMIUM', 'Auto Premium',        'P&C', 'IFRS17-PNC', 'LC-AUTO-PREM', 'INDIVIDUAL'),

('HOME_BASIC', 'Hogar Básico', 'P&C', 'IFRS17-PNC', 'LC-HOME-BASIC', 'INDIVIDUAL'),
('HOME_FULL',  'Hogar Full',   'P&C', 'IFRS17-PNC', 'LC-HOME-FULL',  'INDIVIDUAL'),

('HLT_STD',   'Salud Estándar', 'LIFE', 'IFRS17-LF', 'LC-HEALTH-STD', 'INDIVIDUAL'),
('HLT_AMB',   'Salud Ambulatorio', 'LIFE', 'IFRS17-LF', 'LC-HEALTH-AMB', 'INDIVIDUAL'),
('HLT_INT',   'Salud Integral', 'LIFE', 'IFRS17-LF', 'LC-HEALTH-INT', 'INDIVIDUAL');

GO

truncate table lifepolicy

;WITH Numbers AS (
    SELECT TOP (50) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.objects o1 CROSS JOIN sys.objects o2
)
INSERT INTO [dbo].[LifePolicy]
(
    [code],
    [entityState],
    [processId],
    [lob],
    [productCode],
    [start],
    [end],
    [alias],
    [holderId],
    [insuredSum],
    [currency],
    [active],
    [activeDate],
    [investmentPlanCode],
    [anualPremium],
    [anualTotal],
    [coverages],
    [discounts],
    [fee],
    [installment],
    [paymentMethod],
    [periodicity],
    [surcharges],
    [tax],
    [plannedPremium],
    [premiumPlan],
    [option],
    [created],
    [billingStatus],
    [duration],
    [paymentDuration],
    [grossValue],
    [indexation],
    [paidUp],
    [version],
    [uwFlag],
    [amlFlag],
    [indexationPeriod],
    [durationMonths],
    [certificate],
    [coinsurance],
    [commissions],
    [indexationFrequency],
    [indexationStart],
    [customPayPlan],
    [fronting],
    [restricted],
    [subLob],
    [durationDays],
	policyVersion
)
SELECT
    CONCAT('LP-', n),                   -- code
    'ACTIVE',                           -- entityState
    n,                                  -- processId
    CASE WHEN n % 3 = 1 THEN 'AUTO'
         WHEN n % 3 = 2 THEN 'HOME'
         ELSE 'HEALTH' END,             -- lob
    CASE WHEN n % 3 = 1 THEN 'PRD_AUTO_BASIC'
         WHEN n % 3 = 2 THEN 'PRD_HOGAR_FULL'
         ELSE 'PRD_SALUD_INT' END,      -- productCode
    DATEADD(DAY, -n*30, GETDATE()),     -- start
    DATEADD(YEAR, 1, DATEADD(DAY, -n*30, GETDATE())), -- end
    CONCAT('Alias_', n),                -- alias
    (n % 100) + 1,                      -- holderId (1-100)
    CAST(5000 + n*100 AS DECIMAL(18,2)), -- insuredSum
    'USD',                               -- currency
    1,                                   -- active
    GETDATE(),                           -- activeDate
    CONCAT('INVPLAN', n),                -- investmentPlanCode
    CAST(1000 + n*10 AS DECIMAL(18,2)), -- anualPremium
    CAST(1200 + n*12 AS DECIMAL(18,2)), -- anualTotal
    CAST(900 + n*8 AS DECIMAL(18,2)),   -- coverages
    CAST(50 AS DECIMAL(18,2)),          -- discounts
    CAST(20 AS DECIMAL(18,2)),          -- fee
    CAST(80 + n AS DECIMAL(18,2)),      -- installment
    CASE WHEN n % 2 = 0 THEN 'CARD' ELSE 'BANK' END, -- paymentMethod
    'MONTHLY',                           -- periodicity
    CAST(10 AS DECIMAL(18,2)),          -- surcharges
    CAST(120 AS DECIMAL(18,2)),         -- tax
    CAST(1100 + n*10 AS DECIMAL(18,2)), -- plannedPremium
    'PLAN_STANDARD',                     -- premiumPlan
    1,                                   -- option
    GETDATE(),                           -- created
    1,                                   -- billingStatus
    12,                                  -- duration
    12,                                  -- paymentDuration
    CAST(5500 + n*100 AS DECIMAL(18,2)), -- grossValue
    2,                                   -- indexation
    0,                                   -- paidUp
    1,                                   -- version
    1,                                   -- uwFlag
    0,                                   -- amlFlag
    12,                                  -- indexationPeriod
    12,                                  -- durationMonths
    1,                                   -- certificate
    0,                                   -- coinsurance
    CAST(100 AS DECIMAL(18,2)),         -- commissions
    1,                                   -- indexationFrequency
    1,                                   -- indexationStart
    0,                                   -- customPayPlan
    0,                                   -- fronting
    0,                                   -- restricted
    CASE WHEN n % 3 = 1 THEN 'AUTO_BASIC'
         WHEN n % 3 = 2 THEN 'HOME_FULL'
         ELSE 'HLT_INT' END,             -- subLob
    DATEDIFF(DAY, DATEADD(DAY, -n*30, GETDATE()), DATEADD(YEAR, 1, DATEADD(DAY, -n*30, GETDATE()))) -- durationDays
	,0 policyVersion
FROM Numbers;

GO

TRUNCATE TABLE payPlan

;WITH LifePolicies AS (
    SELECT id AS lifePolicyId, start AS policyStart
    FROM [dbo].[LifePolicy]
)
, Numbers AS (
    -- Generamos 12 números para cuotas mensuales
    SELECT TOP (12) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.objects o1 CROSS JOIN sys.objects o2
)
INSERT INTO [dbo].[PayPlan]
(
    lifePolicyId,
    concept,
    expected,
    minimum,
    payed,
    payedDate,
    dueDate,
    transferId,
    coveredUntil,
    allocationDate,
    contractYear,
    final,
    finalDate,
    numberInYear,
    allocationId,
    currency,
    cancellationDate,
    compensationDate,
    custom,
    created,
    penaltyInterest,
    normalDueDate,
    changeId
)
SELECT
    lp.lifePolicyId,
    CONCAT('Cuota ', n.n, ' - Póliza ', lp.lifePolicyId) AS concept,
    CAST(ROUND(1000 + lp.lifePolicyId*10, 2) AS DECIMAL(18,2)) AS expected,
    CAST(ROUND(500 + lp.lifePolicyId*5, 2) AS DECIMAL(18,2)) AS minimum,
    0 AS payed,
    NULL AS payedDate,
    DATEADD(MONTH, n.n, lp.policyStart) AS dueDate,
    NULL AS transferId,
    DATEADD(DAY, 30, DATEADD(MONTH, n.n, lp.policyStart)) AS coveredUntil,
    GETDATE() AS allocationDate,
    YEAR(lp.policyStart) AS contractYear,
    CASE WHEN n.n = 12 THEN 1 ELSE 0 END AS final,
    CASE WHEN n.n = 12 THEN DATEADD(MONTH, n.n, lp.policyStart) ELSE NULL END AS finalDate,
    n.n AS numberInYear,
    NULL AS allocationId,
    'USD' AS currency,
    NULL AS cancellationDate,
    NULL AS compensationDate,
    0 AS custom,
    GETDATE() AS created,
    0 AS penaltyInterest,
    DATEADD(MONTH, n.n, lp.policyStart) AS normalDueDate,
    NULL AS changeId
FROM LifePolicies lp
CROSS JOIN Numbers n
ORDER BY lp.lifePolicyId, n.n;

GO

TRUNCATE TABLE [Insured]

INSERT INTO [dbo].[Insured]
(
    contactId,
    lifePolicyId,
    name,
    relationship,
    role
)
SELECT
    lp.holderId AS contactId,                       -- contactId del holder
    lp.id AS lifePolicyId,                          -- lifePolicyId
    CONCAT(c.name, ' ', c.surname1) AS name,       -- nombre completo desde Contact
    1 AS relationship,                              -- 1 = titular (dummy)
    1 AS role                                       -- 1 = asegurado principal (dummy)
FROM [dbo].[LifePolicy] lp
INNER JOIN [dbo].[Contact] c ON c.id = lp.holderId;

GO

TRUNCATE TABLE Anniversary

-- Script para insertar 100 registros de prueba en Anniversary
INSERT INTO [dbo].[Anniversary]
(
    lifePolicyId,
    created,
    anniversary,
    processId,
    entityState,
    note,
    executionDate,
    contractYear,
    start,
    duration,
    indexation,
    insuredSum,
    jSnapshot,
    periodicity,
    premium,
    fiscalNumber,
    receiptTypeCode
)
SELECT 
    lp.id AS lifePolicyId,
    DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 3650), GETDATE()) AS created, -- hasta 10 años atrás
    lp.[end] AS anniversary, -- dentro del año
    NULL AS processId,
    NULL AS entityState,
    'Nota de prueba' AS note,
    NULL AS executionDate,
    1 AS contractYear,
    lp.[start] AS start,
    ABS(CHECKSUM(NEWID()) % 30) + 1 AS duration,
    ABS(CHECKSUM(NEWID()) % 11) AS indexation, -- 0 a 10%
    lp.insuredSum, -- 1000 a 101000
    NULL AS jSnapshot,
    'Annual' AS periodicity,
    lp.[anualTotal] AS premium, -- 100 a 50100
    NULL AS fiscalNumber,
    'RCPT' + CAST(ABS(CHECKSUM(NEWID()) % 1000) AS nvarchar(10)) AS receiptTypeCode
FROM [dbo].[LifePolicy] lp
ORDER BY NEWID();

INSERT INTO [dbo].[Anniversary]
(
    lifePolicyId,
    created,
    anniversary,
    processId,
    entityState,
    note,
    executionDate,
    contractYear,
    start,
    duration,
    indexation,
    insuredSum,
    jSnapshot,
    periodicity,
    premium,
    fiscalNumber,
    receiptTypeCode
)
SELECT 
    lp.id AS lifePolicyId,
    DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 3650), GETDATE()) AS created, -- hasta 10 años atrás
    DATEADD(YEAR,1,lp.[end]) AS anniversary, -- dentro del año
    NULL AS processId,
    NULL AS entityState,
    'Nota de prueba' AS note,
    NULL AS executionDate,
    2 AS contractYear,
    DATEADD(YEAR,1,lp.[start]) AS start,
    ABS(CHECKSUM(NEWID()) % 30) + 1 AS duration,
    ABS(CHECKSUM(NEWID()) % 11) AS indexation, -- 0 a 10%
    lp.insuredSum - 100, -- 1000 a 101000
    NULL AS jSnapshot,
    'Annual' AS periodicity,
    lp.[anualTotal] - 10 AS premium, -- 100 a 50100
    NULL AS fiscalNumber,
    'RCPT' + CAST(ABS(CHECKSUM(NEWID()) % 1000) AS nvarchar(10)) AS receiptTypeCode
FROM [dbo].[LifePolicy] lp
ORDER BY NEWID();


go

update payplan set contractyear = 1;


GO

select * from [Anniversary] order by lifepolicyid, contractyear
return;
select * from lob
select * from Product
select * from lifepolicy
select * from contact