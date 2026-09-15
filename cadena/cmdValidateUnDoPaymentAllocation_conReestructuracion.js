//block
//noreplace

/*
 * @author Michael Delgado
 * @created 2026/06/16
 * @name cmdValidateUnDoPaymentAllocation
 * @version 1.0
 * @Purpose This command validate if an allocation is reverted and have partial payments to preserve correct data.
*/

const allocationId = context?.allocationId ?? 0;
let msg = "Proceso ejecutado correctamente";
const allocationInstallmentRefs = loadAllocationInstallmentRefs(allocationId);
const reversalRecord = axx821Read("Allocation", `id = ${Number(allocationId)}`, "id, reversalDate");
if (reversalRecord.length !== 1 || !reversalRecord[0].reversalDate) return {ok:true,msg:"Allocation not reversed; no reconciliation"};
const zeroRepairs = prepareZeroPaymentRepairs(allocationInstallmentRefs);

if (!allocationInstallmentRefs.length) {
  msg = "No existen cuotas que validar";
} else {
  const payPlanIds = uniqueNumbers(
    allocationInstallmentRefs.map(item => item?.payPlanId).filter(isValidNumber)
  );

  if (!payPlanIds.length) {
    msg = "No existen payPlanId validos";
  } else {
  const installmentPayments = loadAllocationInstallmentsByPayPlanIds(
    allocationInstallmentRefs
      .filter(item => isValidNumber(item?.lifePolicyId) && isValidNumber(item?.payPlanId))
  );

    const allocationIds = uniqueNumbers(
      installmentPayments
        .map(item => item?.allocationId)
        .filter(isValidNumber)
    );

    const transfers = loadTransfersByAllocationIds(allocationIds);
    const transferAllocationIds = uniqueNumbers(
      transfers
        .map(item => item?.allocationId)
        .filter(isValidNumber)
    );
  const appliedInstallmentPayments = installmentPayments.filter(item =>
    isValidNumber(item?.allocationId) && transferAllocationIds.includes(Number(item.allocationId))
  );

  const installments = loadInstallmentsByPayPlanIds(payPlanIds).filter(item =>
    isValidNumber(item?.id) && payPlanIds.includes(Number(item.id))
  );

  const updatedCount = updatePayPlanPaidAmounts(appliedInstallmentPayments, installments, transfers);
  msg = updatedCount
      ? `Se actualizaron ${updatedCount} payplan(s)`
      : "No fue necesario actualizar montos";
  }
}

axx821Apply(zeroRepairs);
return { ok: true, msg, zeroRepairCount: zeroRepairs.length };

function loadAllocationInstallmentRefs(allocationId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "AllocationInstallment",
      filter: `allocationId = ${allocationId}`,
      fields: "lifePolicyId, payPlanId"
    }
  });

  if (!LoadEntities.ok) throw new Error(LoadEntities.msg);
  return asArray(LoadEntities.outData);
}

function loadAllocationInstallmentsByPayPlanIds(refs) {
  if (!Array.isArray(refs) || !refs.length) {
    return [];
  }

  const pairs = refs
    .map(item => ({
      lifePolicyId: Number(item?.lifePolicyId),
      payPlanId: Number(item?.payPlanId)
    }))
    .filter(item => Number.isFinite(item.lifePolicyId) && Number.isFinite(item.payPlanId));

  if (!pairs.length) {
    return [];
  }

  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "AllocationInstallment",
      filter: buildAllocationFilter(pairs),
      fields: "allocationId, lifePolicyId, payPlanId, moneyInAmount, transitAmount, compensationAmount, compensationType"
    }
  });

  if (!LoadEntities.ok) throw new Error(LoadEntities.msg);
  return asArray(LoadEntities.outData);
}

function loadInstallmentsByPayPlanIds(payPlanIds) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "PayPlan",
      filter: `id IN (${payPlanIds.join(",")})`,
      fields: "id, payed"
    }
  });

  if (!LoadEntities.ok) throw new Error(LoadEntities.msg);
  return asArray(LoadEntities.outData);
}

function updatePayPlanPaidAmounts(installmentPayments, installments, transfers) {
  const expectedByPayPlan = groupSumByPayPlanId(installmentPayments.map(item=>({...item,totalPaid:axx821Contribution(item)})), "totalPaid");
  const currentByPayPlan = groupSumByPayPlanId(installments.map(item => ({...item,payPlanId:item.id})), "payed");
  const metadataByPayPlan = buildPayPlanMetadataByPayPlanId(installmentPayments, transfers);
  const payPlans = uniqueNumbers([
    ...Object.keys(expectedByPayPlan || {}),
    ...Object.keys(currentByPayPlan || {})
  ]);

  let updatedCount = 0;

  for (const payPlanId of payPlans) {
    const expectedPaid = round2(expectedByPayPlan[payPlanId] ?? 0);
    const currentPaid = round2(currentByPayPlan[payPlanId] ?? 0);

    axx821SyncPaidDetails(payPlanId, expectedPaid);


    doCmd({
      cmd: "SetField",
      data: {
        entity: "PayPlan",
        entityId: payPlanId,
        fieldValue: `payed = ${expectedPaid}, allocationId = ${metadataByPayPlan[payPlanId]?.allocationId ?? "NULL"}, payedDate = ${formatDateAssignment(metadataByPayPlan[payPlanId]?.payedDate, expectedPaid)}`
      }
    });

    if (!SetField?.ok) throw new Error(SetField?.msg || "Payment update failed");
    if (SetField?.ok) {
      updatedCount += 1;
    }
  }

  return updatedCount;
}

function buildPayPlanMetadataByPayPlanId(installmentPayments, transfers) {
  const transferDateByAllocationId = (Array.isArray(transfers) ? transfers : []).reduce((acc, item) => {
    const allocationId = Number(item?.allocationId);
    const date = item?.date;

    if (!Number.isFinite(allocationId) || !date) {
      return acc;
    }

    const current = acc[allocationId];
    if (!current || String(date) > String(current)) {
      acc[allocationId] = date;
    }

    return acc;
  }, {});

  return (Array.isArray(installmentPayments) ? installmentPayments : []).reduce((acc, item) => {
    const payPlanId = Number(item?.payPlanId);
    const allocationId = Number(item?.allocationId);
    const transferDate = transferDateByAllocationId[allocationId];

    if (!Number.isFinite(payPlanId) || !Number.isFinite(allocationId)) {
      return acc;
    }

    const candidate = {
      allocationId,
      payedDate: transferDate || null
    };

    const current = acc[payPlanId];
    if (!current) {
      acc[payPlanId] = candidate;
      return acc;
    }

    const currentDate = current.payedDate ? String(current.payedDate) : "";
    const candidateDate = candidate.payedDate ? String(candidate.payedDate) : "";
    if (!currentDate || candidateDate > currentDate) {
      acc[payPlanId] = candidate;
    }

    return acc;
  }, {});
}

function buildAllocationFilter(pairs) {
  const clauses = pairs.map(item =>
    `(lifePolicyId = ${item.lifePolicyId} AND payPlanId = ${item.payPlanId})`
  );

  return clauses.join(" OR ");
}

function loadTransfersByAllocationIds(allocationIds) {
  if (!Array.isArray(allocationIds) || !allocationIds.length) return [];
  return axx821Read("Allocation", "id IN ("+allocationIds.join(",")+") AND reversalDate IS NULL", "id, transactionDate").map(item=>({allocationId:item.id,date:item.transactionDate}));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function groupSumByPayPlanId(items, amountField) {
  return (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const payPlanId = Number(item?.payPlanId);
    const amount = Number(item?.[amountField] ?? 0);

    if (!Number.isFinite(payPlanId)) {
      return acc;
    }

    if (!acc[payPlanId]) {
      acc[payPlanId] = 0;
    }

    acc[payPlanId] += Number.isFinite(amount) ? amount : 0;
    return acc;
  }, {});
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function formatDateAssignment(value, expectedPaid) {
  if (!Number.isFinite(Number(expectedPaid)) || Number(expectedPaid) <= 0.01) {
    return "NULL";
  }

  if (!value) {
    return "NULL";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function isValidNumber(value) {
  return value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value));
}

function uniqueNumbers(values) {
  return [...new Set(values.map(Number).filter(Number.isFinite))];
}

// AXX-821: prepare all zero-payment repairs before the legacy updater writes.
function prepareZeroPaymentRepairs(refs) {
  const updates=[];
  for(const policyId of uniqueNumbers(refs.map(x=>x.lifePolicyId).filter(isValidNumber))) {
    const links=axx821Read('AllocationInstallment',`lifePolicyId = ${policyId}`,'allocationId, payPlanId, moneyInAmount, transitAmount, compensationAmount, compensationType');
    const ids=uniqueNumbers(links.map(x=>x.allocationId).filter(isValidNumber));
    if(!ids.length)continue;
    const allocations=axx821Read('Allocation',`id IN (${ids.join(',')})`,'id, reversalDate');
    if(allocations.length!==ids.length)throw new Error('AXX821: incomplete allocation history');
    const live=allocations.filter(x=>!x.reversalDate).map(x=>Number(x.id));
    const plans=axx821Read('PayPlan',`lifePolicyId = ${policyId}`,'id, minimum, expected, payed, allocationId, dueDate, contractYear, numberInYear, cancellationDate');
    if(plans.some(x=>Number(x.payed)!==0&&!ids.includes(Number(x.allocationId))))throw new Error('AXX821: payment without matching allocation; reconciliation stopped');
    if(links.some(x=>live.includes(Number(x.allocationId))&&axx821Contribution(x)!==0))continue;
    doCmd({cmd:'GetPolicyChanges',data:{policyId}});if(!GetPolicyChanges.ok)throw new Error(GetPolicyChanges.msg);
    const changes=(GetPolicyChanges.outData||[]).filter(x=>x.Discriminator==="PayPlanChange"&&[1,3].includes(Number(x.status))).sort((a,b)=>String(b.executionDate||'').localeCompare(String(a.executionDate||''))||Number(b.id)-Number(a.id));
    let ordered=[];let billing=null;
    if(changes[0]?.Discriminator==='PayPlanChange') {
      doCmd({cmd:'GetPolicyChanges',data:{changeId:Number(changes[0].id)}});if(!GetPolicyChanges.ok)throw new Error(GetPolicyChanges.msg);
      const change=GetPolicyChanges.outData;const targets=JSON.parse(change.jNewPayPlan||'[]').filter(x=>!x.cancellationDate&&Number(x.minimum)>0);
      for(const target of targets){const matches=plans.filter(x=>Number(x.id)===Number(target.id)||(Number(x.contractYear)===Number(target.contractYear)&&Number(x.numberInYear)===Number(target.numberInYear)&&String(x.dueDate).slice(0,10)===String(target.dueDate).slice(0,10)));if(matches.length!==1||Number(matches[0].minimum)!==Number(target.minimum))throw new Error('AXX821: current plan differs from latest executed change');ordered.push(matches[0]);}
      if(new Set(ordered.map(x=>x.id)).size!==ordered.length||ordered.length!==plans.filter(x=>!x.cancellationDate&&Number(x.minimum)>0).length)throw new Error('AXX821: latest change does not cover current active plan');
      billing=change.Bill;
      if(!billing||Number(billing.anualPremium)+Number(billing.tax)<=0)throw new Error('AXX821: missing change billing basis');
    }
    const allDetails=new Map();for(const plan of plans)allDetails.set(Number(plan.id),axx821Read('PayPlanDetail',`payPlanId = ${Number(plan.id)}`,'id, amount, paid, [order], detail'));
    const total=round2(ordered.reduce((a,x)=>a+Number(x.minimum),0));
    const totalTax=billing?round2(total*Number(billing.tax)/(Number(billing.anualPremium)+Number(billing.tax))):0;let taxSum=0;
    const rebuildIds=new Set();
    for(let i=0;i<ordered.length;i++){
      const plan=ordered[i],details=allDetails.get(Number(plan.id));const premium=details.find(x=>Number(x.order)===1&&x.detail==='Prima Cobertura'),tax=details.find(x=>Number(x.order)===2&&x.detail==='Impuesto de Seguros');
      if(details.length!==2||!premium||!tax)throw new Error('AXX821: unexpected installment components');
      const taxAmount=round2(Math.max(0,Math.min(Number(plan.minimum),i===ordered.length-1?round2(totalTax-taxSum):round2(Number(plan.minimum)*totalTax/total))));taxSum=round2(taxSum+taxAmount);
      updates.push({entity:'PayPlanDetail',entityId:Number(premium.id),fieldValue:`amount = ${round2(Number(plan.minimum)-taxAmount)}, paid = 0`},{entity:'PayPlanDetail',entityId:Number(tax.id),fieldValue:`amount = ${taxAmount}, paid = 0`});rebuildIds.add(Number(plan.id));
    }
    for(const plan of plans){if(!rebuildIds.has(Number(plan.id)))for(const detail of allDetails.get(Number(plan.id)))if(Number(detail.paid)!==0)updates.push({entity:'PayPlanDetail',entityId:Number(detail.id),fieldValue:'paid = 0'});updates.push({entity:'PayPlan',entityId:Number(plan.id),fieldValue:'payed = 0, allocationId = NULL, payedDate = NULL, allocationDate = NULL, transferId = NULL'});}
  }
  return updates;
}
function axx821Read(entity,filter,fields){doCmd({cmd:'LoadEntities',data:{entity,filter,fields,noTracking:true}});if(!LoadEntities.ok)throw new Error(LoadEntities.msg);return Array.isArray(LoadEntities.outData)?LoadEntities.outData:[];}
function axx821Apply(updates){for(const data of updates){doCmd({cmd:'SetField',data});if(!SetField.ok)throw new Error(SetField.msg);}}
function axx821SyncPaidDetails(payPlanId,paid){doCmd({cmd:'RepoPayPlan',data:{operation:'GET',filter:`id=${Number(payPlanId)}`,include:['PayPlanDetail'],size:1}});if(!RepoPayPlan.ok||RepoPayPlan.outData?.length!==1)throw new Error('AXX821: installment details unavailable');const details=RepoPayPlan.outData[0].PayPlanDetail||[];let remaining=round2(paid);const updates=[];for(const detail of details){const value=round2(Math.min(Math.max(0,Number(detail.amount)),remaining));remaining=round2(remaining-value);if(Number(detail.paid)!==value)updates.push({entity:'PayPlanDetail',entityId:Number(detail.id),fieldValue:`paid = ${value}`});}if(details.length&&remaining>0)throw new Error('AXX821: installment components do not cover remaining payment');axx821Apply(updates);}
function axx821Contribution(x){return Number(x.moneyInAmount||0)+Number(x.transitAmount||0)+(x.compensationType==="PARTIAL"?0:Number(x.compensationAmount||0));}