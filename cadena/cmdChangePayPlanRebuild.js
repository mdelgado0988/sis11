//block
//noreplace

/*
  *@name: cmdChangePayPlanRebuild
  *@Purpose: Rebuild the policy payment plan from the payment plan stored in a PayPlanChange endorsement.
  *@Author: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 20/07/2026
  *@Input: { changeId }
  *@Output: { ok, msg }
*/

const n2 = value => Number(Number(value || 0).toFixed(2));

try {
  const changeId = Number(context?.changeId || 0);
  if (!(changeId > 0)) {
    return { ok: false, msg: "No se recibio changeId" };
  }

  const change = loadChange(changeId);
  if (!change) {
    return { ok: false, msg: "No se encontro el endoso" };
  }

  const targetPayPlan = normalizePayPlanList(
    safeJsonArray(change.jNewPayPlan),
    change.lifePolicyId
  );

  if (!targetPayPlan.length) {
    return { ok: false, msg: "El endoso no contiene plan de pago para reconstruir" };
  }

  const billingData = loadBillingData(change);
  rebuildPayPlanDetailsByBilling(targetPayPlan, billingData);

  const currentPayPlan = loadPolicyPayPlan(change.lifePolicyId);
  rebuildPolicyPayPlan(change, currentPayPlan, targetPayPlan);
  updateChangePayPlan(change.id, targetPayPlan);
  updatePolicyPaymentData(change);

  return { ok: true, msg: "Plan de pago reconstruido correctamente" };
} catch (error) {
  return { ok: false, msg: error?.toString?.() || String(error) };
}

function loadChange(changeId) {
  return loadOneEntity(
    "Change",
    "id, lifePolicyId, jNewPayPlan, newPaymentMethod, newFrequency",
    `id = ${sqlNumber(changeId)}`
  );
}

function loadBillingData(change) {
  const policy = loadOneEntity(
    "LifePolicy",
    "id, anualPremium, tax, anualTotal",
    `id = ${sqlNumber(change.lifePolicyId)}`
  );

  return {
    premium: n2(policy?.anualPremium),
    tax: n2(policy?.tax),
    total: n2(policy?.anualTotal)
  };
}

function loadPolicyPayPlan(policyId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "PayPlan",
      filter: `lifePolicyId = ${sqlNumber(policyId)}`,
      noTracking: true,
      fields: "id, lifePolicyId, concept, expected, minimum, payed, payedDate, dueDate, transferId, coveredUntil, allocationDate, contractYear, final, finalDate, numberInYear, allocationId, currency, cancellationDate, compensationDate, custom, created, penaltyInterest, normalDueDate, changeId"
    }
  });

  if (!LoadEntities.ok) {
    throw new Error(LoadEntities.msg);
  }

  return (LoadEntities.outData || []).map(clonePayPlan);
}

function loadPayPlanDetails(payPlanId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "PayPlanDetail",
      filter: `payPlanId = ${sqlNumber(payPlanId)}`,
      noTracking: true,
      fields: "id, payPlanId, amount, concept, detail, [order], paid"
    }
  });

  if (!LoadEntities.ok) {
    throw new Error(LoadEntities.msg);
  }

  return (LoadEntities.outData || []).map(detail => ({
    id: Number(detail?.id || 0),
    payPlanId: Number(detail?.payPlanId || 0),
    amount: n2(detail?.amount),
    concept: detail?.concept || "",
    detail: detail?.detail || "",
    order: Number(detail?.order || 0),
    paid: n2(detail?.paid)
  }));
}

function rebuildPolicyPayPlan(change, currentPayPlan, targetPayPlan) {
  const currentById = new Map(
    (currentPayPlan || [])
      .filter(item => Number(item?.id || 0) > 0)
      .map(item => [Number(item.id), item])
  );

  const currentByKey = new Map(
    (currentPayPlan || [])
      .filter(item => Number(item?.contractYear || 0) > 0 && Number(item?.numberInYear || 0) > 0)
      .map(item => [buildPayPlanMatchKey(item), item])
  );

  const currentByDueDate = new Map(
    (currentPayPlan || [])
      .filter(item => item?.dueDate)
      .map(item => [buildPayPlanDueDateKey(item), item])
  );

  const usedCurrentIds = new Set();
  const sqlParts = [];
  let insertIndex = 0;

  for (const target of targetPayPlan || []) {
    const current = findCurrentPayPlan(target, currentById, currentByKey, currentByDueDate);
    normalizePayPlanDetailsForTarget(target);

    if (current?.id) {
      usedCurrentIds.add(Number(current.id));
      sqlParts.push(buildUpdatePayPlanSql(current.id, change, current, target));
      syncPayPlanDetails(sqlParts, current.id, target, Number(current.payed || 0) > 0.01);
      continue;
    }

    insertIndex += 1;
    const varName = `@NewPayPlanId_${insertIndex}`;
    sqlParts.push(buildInsertPayPlanSql(varName, change, target));
    appendPayPlanDetailInserts(sqlParts, varName, target);
  }

  appendDeleteMissingPayPlans(sqlParts, currentPayPlan, usedCurrentIds);

  if (sqlParts.length) {
    executeSql(sqlParts.join("\n"));
  }
}

function appendDeleteMissingPayPlans(sqlParts, currentPayPlan, usedCurrentIds) {
  for (const current of currentPayPlan || []) {
    const currentId = Number(current?.id || 0);
    if (!currentId || usedCurrentIds.has(currentId)) {
      continue;
    }

    if (Number(current?.payed || 0) > 0.01) {
      throw new Error(`La cuota pagada ${current?.numberInYear || currentId} no esta incluida en el plan modificado`);
    }

    sqlParts.push(`DELETE FROM PayPlanDetail WHERE payPlanId = ${sqlNumber(currentId)};`);
    sqlParts.push(`DELETE FROM PayPlan WHERE id = ${sqlNumber(currentId)};`);
  }
}

function syncPayPlanDetails(sqlParts, payPlanId, target, preservePaid) {
  const targetDetails = Array.isArray(target?.PayPlanDetail) ? target.PayPlanDetail : [];
  if (!targetDetails.length) {
    return;
  }

  const currentDetails = loadPayPlanDetails(payPlanId);
  const currentById = new Map(
    currentDetails
      .filter(detail => Number(detail?.id || 0) > 0)
      .map(detail => [Number(detail.id), detail])
  );
  const currentByOrder = new Map(
    currentDetails
      .filter(detail => Number(detail?.order || 0) > 0)
      .map(detail => [Number(detail.order), detail])
  );
  const usedCurrentIds = new Set();

  for (const detail of targetDetails) {
    const targetId = Number(detail?.id || 0);
    const targetOrder = Number(detail?.order || 0);
    const current = targetId > 0
      ? currentById.get(targetId)
      : (targetOrder > 0 ? currentByOrder.get(targetOrder) : null);

    if (current?.id) {
      usedCurrentIds.add(Number(current.id));
      sqlParts.push(buildUpdatePayPlanDetailSql(current.id, detail, preservePaid ? current.paid : detail?.paid));
      continue;
    }

    sqlParts.push(buildInsertPayPlanDetailSql(payPlanId, detail));
  }

  for (const current of currentDetails) {
    const currentId = Number(current?.id || 0);
    if (!currentId || usedCurrentIds.has(currentId)) {
      continue;
    }

    if (Number(current?.paid || 0) <= 0.01) {
      sqlParts.push(`DELETE FROM PayPlanDetail WHERE id = ${sqlNumber(currentId)};`);
    }
  }
}

function rebuildPayPlanDetailsByBilling(payPlans, billingData) {
  const premiumTotal = n2(billingData?.premium);
  const taxTotal = n2(billingData?.tax);
  const ratioBase = n2(premiumTotal + taxTotal);

  if (!payPlans?.length || Math.abs(ratioBase) <= 0.01) {
    return;
  }

  const taxRatio = clampRatio(taxTotal / ratioBase);
  const editablePayPlans = payPlans.filter(item => n2(item?.minimum) - n2(item?.payed) > 0.01);

  if (!editablePayPlans.length) {
    return;
  }

  const pendingTotal = n2(
    editablePayPlans.reduce((sum, item) => sum + n2(n2(item?.minimum) - n2(item?.payed)), 0)
  );

  if (Math.abs(pendingTotal) <= 0.01) {
    return;
  }

  const pendingTax = n2(pendingTotal * taxRatio);
  const pendingPremium = n2(pendingTotal - pendingTax);
  let accumulatedPremium = 0;
  let accumulatedTax = 0;

  editablePayPlans.forEach((payPlan, index) => {
    const pendingAmount = n2(n2(payPlan?.minimum) - n2(payPlan?.payed));
    const isLast = index === editablePayPlans.length - 1;
    const premium = isLast
      ? n2(pendingPremium - accumulatedPremium)
      : n2(pendingAmount * pendingPremium / pendingTotal);
    const tax = isLast
      ? n2(pendingTax - accumulatedTax)
      : n2(pendingAmount * pendingTax / pendingTotal);
    const normalizedTax = n2(Math.max(0, Math.min(tax, pendingAmount)));
    const normalizedPremium = n2(pendingAmount - normalizedTax);

    if (!isLast) {
      accumulatedPremium = n2(accumulatedPremium + normalizedPremium);
      accumulatedTax = n2(accumulatedTax + normalizedTax);
    }

    payPlan.PayPlanDetail = [
      {
        id: 0,
        payPlanId: Number(payPlan?.id || 0),
        amount: normalizedPremium,
        concept: `Detalle de cuota #${payPlan?.numberInYear || 0}`,
        detail: "Prima Cobertura",
        order: 1,
        paid: 0
      },
      {
        id: 0,
        payPlanId: Number(payPlan?.id || 0),
        amount: normalizedTax,
        concept: `Detalle de cuota #${payPlan?.numberInYear || 0}`,
        detail: "Impuesto de Seguros",
        order: 2,
        paid: 0
      }
    ];
  });
}

function normalizePayPlanDetailsForTarget(payPlan) {
  const pendingAmount = n2(n2(payPlan?.minimum) - n2(payPlan?.payed));
  if (n2(payPlan?.payed) > 0.01 && pendingAmount <= 0.01) {
    payPlan.PayPlanDetail = [];
    return;
  }

  const details = Array.isArray(payPlan?.PayPlanDetail) ? payPlan.PayPlanDetail : [];
  if (!details.length) {
    payPlan.PayPlanDetail = buildDefaultPayPlanDetails(payPlan);
    return;
  }

  payPlan.PayPlanDetail = normalizePayPlanDetails(payPlan, details);
}

function normalizePayPlanDetails(payPlan, details) {
  const normalized = (details || [])
    .map(detail => ({
      id: Number(detail?.id || 0),
      payPlanId: Number(detail?.payPlanId || 0),
      amount: n2(detail?.amount),
      concept: detail?.concept || `Detalle de cuota #${payPlan?.numberInYear || 0}`,
      detail: detail?.detail || "",
      order: Number(detail?.order || 0),
      paid: n2(detail?.paid)
    }))
    .filter(isValidPayPlanDetail);

  if (!normalized.length) {
    return buildDefaultPayPlanDetails(payPlan);
  }

  const targetTotal = n2(Number(payPlan?.minimum || 0) - Number(payPlan?.payed || 0));
  const detailTotal = n2(normalized.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const diff = n2(targetTotal - detailTotal);

  if (Math.abs(diff) > 0.01) {
    normalized[normalized.length - 1].amount = n2(normalized[normalized.length - 1].amount + diff);
  }

  return normalized;
}

function buildDefaultPayPlanDetails(payPlan) {
  const amount = n2(Number(payPlan?.minimum || 0) - Number(payPlan?.payed || 0));

  return [
    {
      id: 0,
      payPlanId: Number(payPlan?.id || 0),
      amount,
      concept: `Detalle de cuota #${payPlan?.numberInYear || 0}`,
      detail: "Prima Cobertura",
      order: 1,
      paid: 0
    }
  ];
}

function updatePolicyPaymentData(change) {
  const policy = loadOneEntity(
    "LifePolicy",
    "id, paymentMethod, periodicity",
    `id = ${sqlNumber(change.lifePolicyId)}`
  );

  if (!policy) {
    throw new Error("No se encontro la poliza");
  }

  const fieldValues = [];
  const newPaymentMethod = String(change?.newPaymentMethod || "").trim();
  const newFrequency = String(change?.newFrequency || "").trim();

  if (newPaymentMethod && newPaymentMethod !== String(policy?.paymentMethod || "").trim()) {
    fieldValues.push(`paymentMethod=${sqlString(newPaymentMethod)}`);
  }

  if (newFrequency && newFrequency !== String(policy?.periodicity || "").trim()) {
    fieldValues.push(`periodicity=${sqlString(newFrequency)}`);
  }

  if (!fieldValues.length) {
    return;
  }

  doCmd({
    cmd: "SetField",
    data: {
      entity: "LifePolicy",
      entityId: Number(change.lifePolicyId),
      fieldValue: fieldValues.join(","),
      raw: true
    }
  });

  if (!SetField.ok) {
    throw new Error(SetField.msg);
  }
}

function updateChangePayPlan(changeId, payPlan) {
  const cleanPayPlan = (payPlan || []).map(item => {
    const cloned = clonePayPlan(item);
    delete cloned._hasSourceId;
    return cloned;
  });

  doCmd({
    cmd: "SetField",
    data: {
      entity: "Change",
      entityId: changeId,
      fieldValue: `jNewPayPlan=${sqlString(JSON.stringify(cleanPayPlan))}`,
      raw: true
    }
  });

  if (!SetField.ok) {
    throw new Error(SetField.msg);
  }
}

function normalizePayPlanList(payPlanList, policyId) {
  return (payPlanList || [])
    .map(item => normalizePayPlan(item, policyId))
    .filter(item => item !== null);
}

function normalizePayPlan(item, policyId) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return {
    ...clonePayPlan(item),
    _hasSourceId: Object.prototype.hasOwnProperty.call(item, "id"),
    id: Number(item.id || 0),
    lifePolicyId: Number(item.lifePolicyId || policyId || 0),
    concept: item.concept || "Prima",
    expected: n2(item.expected),
    minimum: n2(item.minimum),
    payed: n2(item.payed),
    payedDate: item.payedDate || null,
    dueDate: item.dueDate || null,
    transferId: item.transferId || null,
    coveredUntil: item.coveredUntil || null,
    allocationDate: item.allocationDate || null,
    contractYear: Number(item.contractYear || 0),
    final: parseBoolean(item.final),
    finalDate: item.finalDate || null,
    numberInYear: Number(item.numberInYear || 0),
    allocationId: item.allocationId || null,
    currency: item.currency || "USD",
    cancellationDate: item.cancellationDate || null,
    compensationDate: item.compensationDate || null,
    custom: parseBoolean(item.custom),
    created: item.created || null,
    penaltyInterest: n2(item.penaltyInterest),
    normalDueDate: item.normalDueDate || item.dueDate || null,
    changeId: item.changeId || null,
    PayPlanDetail: Array.isArray(item.PayPlanDetail) ? item.PayPlanDetail : safeJsonArray(item.PayPlanDetail)
  };
}

function findCurrentPayPlan(target, currentById, currentByKey, currentByDueDate) {
  const targetId = Number(target?.id || 0);
  if (!(targetId > 0) && target?._hasSourceId) {
    return null;
  }

  if (targetId > 0 && currentById.has(targetId)) {
    return currentById.get(targetId);
  }

  const key = buildPayPlanMatchKey(target);
  if (currentByKey.has(key)) {
    return currentByKey.get(key);
  }

  const dueDateKey = buildPayPlanDueDateKey(target);
  if (dueDateKey && currentByDueDate.has(dueDateKey)) {
    return currentByDueDate.get(dueDateKey);
  }

  return null;
}

function buildUpdatePayPlanSql(payPlanId, change, current, target) {
  const keepPaid = Number(current?.payed || 0) > 0.01;
  const payedValue = keepPaid ? current?.payed : target?.payed;
  const payedDateValue = keepPaid ? current?.payedDate : target?.payedDate;

  return [
    "UPDATE PayPlan",
    `SET lifePolicyId = ${sqlNumber(target?.lifePolicyId || change?.lifePolicyId)},`,
    `    concept = ${sqlString(target?.concept)},`,
    `    expected = ${sqlMoney(target?.expected)},`,
    `    minimum = ${sqlMoney(target?.minimum)},`,
    `    payed = ${sqlMoney(payedValue)},`,
    `    payedDate = ${sqlDate(payedDateValue)},`,
    `    dueDate = ${sqlDate(target?.dueDate)},`,
    `    transferId = ${sqlNullableNumber(target?.transferId)},`,
    `    coveredUntil = ${sqlDate(target?.coveredUntil)},`,
    `    allocationDate = ${sqlDate(target?.allocationDate)},`,
    `    contractYear = ${sqlNumber(target?.contractYear)},`,
    `    final = ${sqlBoolean(target?.final)},`,
    `    finalDate = ${sqlDate(target?.finalDate)},`,
    `    numberInYear = ${sqlNumber(target?.numberInYear)},`,
    `    allocationId = ${sqlNullableNumber(target?.allocationId)},`,
    `    currency = ${sqlString(target?.currency || "USD")},`,
    `    cancellationDate = ${sqlDate(target?.cancellationDate)},`,
    `    compensationDate = ${sqlDate(target?.compensationDate)},`,
    `    custom = ${sqlBoolean(target?.custom)},`,
    `    penaltyInterest = ${sqlMoney(target?.penaltyInterest)},`,
    `    normalDueDate = ${sqlDate(target?.normalDueDate)},`,
    `    changeId = ${sqlNumber(change?.id)}`,
    `WHERE id = ${sqlNumber(payPlanId)};`
  ].join("\n");
}

function buildInsertPayPlanSql(varName, change, target) {
  const created = target?.created || new Date().toISOString();
  const fields = [
    "lifePolicyId",
    "concept",
    "expected",
    "minimum",
    "payed",
    "payedDate",
    "dueDate",
    "transferId",
    "coveredUntil",
    "allocationDate",
    "contractYear",
    "final",
    "finalDate",
    "numberInYear",
    "allocationId",
    "currency",
    "cancellationDate",
    "compensationDate",
    "custom",
    "created",
    "penaltyInterest",
    "normalDueDate",
    "changeId"
  ];

  const values = [
    sqlNumber(change?.lifePolicyId),
    sqlString(target?.concept),
    sqlMoney(target?.expected),
    sqlMoney(target?.minimum),
    sqlMoney(target?.payed),
    sqlDate(target?.payedDate),
    sqlDate(target?.dueDate),
    sqlNullableNumber(target?.transferId),
    sqlDate(target?.coveredUntil),
    sqlDate(target?.allocationDate),
    sqlNumber(target?.contractYear),
    sqlBoolean(target?.final),
    sqlDate(target?.finalDate),
    sqlNumber(target?.numberInYear),
    sqlNullableNumber(target?.allocationId),
    sqlString(target?.currency || "USD"),
    sqlDate(target?.cancellationDate),
    sqlDate(target?.compensationDate),
    sqlBoolean(target?.custom),
    sqlDate(created),
    sqlMoney(target?.penaltyInterest),
    sqlDate(target?.normalDueDate),
    sqlNumber(change?.id)
  ];

  return [
    `DECLARE ${varName} INT;`,
    `INSERT INTO PayPlan (${fields.join(", ")})`,
    `VALUES (${values.join(", ")});`,
    `SET ${varName} = SCOPE_IDENTITY();`
  ].join("\n");
}

function appendPayPlanDetailInserts(sqlParts, payPlanRef, target) {
  const details = Array.isArray(target?.PayPlanDetail) ? target.PayPlanDetail : [];
  for (const detail of details) {
    sqlParts.push(buildInsertPayPlanDetailSql(payPlanRef, detail));
  }
}

function buildInsertPayPlanDetailSql(payPlanRef, detail) {
  return [
    "INSERT INTO PayPlanDetail (payPlanId, amount, concept, detail, [order], paid)",
    `VALUES (${payPlanRef}, ${sqlMoney(detail?.amount)}, ${sqlString(detail?.concept)}, ${sqlString(detail?.detail)}, ${sqlNumber(detail?.order)}, ${sqlMoney(detail?.paid)});`
  ].join("\n");
}

function buildUpdatePayPlanDetailSql(detailId, detail, paid) {
  return [
    "UPDATE PayPlanDetail",
    `SET amount = ${sqlMoney(detail?.amount)},`,
    `    concept = ${sqlString(detail?.concept)},`,
    `    detail = ${sqlString(detail?.detail)},`,
    `    [order] = ${sqlNumber(detail?.order)},`,
    `    paid = ${sqlMoney(paid)}`,
    `WHERE id = ${sqlNumber(detailId)};`
  ].join("\n");
}

function loadOneEntity(entity, fields, filter) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity,
      fields,
      filter,
      noTracking: true
    }
  });

  if (!LoadEntity.ok) {
    throw new Error(LoadEntity.msg);
  }

  return LoadEntity.outData || null;
}

function executeSql(sql) {
  doCmd({
    cmd: "DoQuery",
    data: { sql }
  });

  if (!DoQuery.ok) {
    throw new Error(DoQuery.msg);
  }
}

function buildPayPlanMatchKey(item) {
  return `${Number(item?.contractYear || 0)}|${Number(item?.numberInYear || 0)}`;
}

function buildPayPlanDueDateKey(item) {
  return normalizeDateKey(item?.dueDate);
}

function normalizeDateKey(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function clampRatio(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  if (number > 1) {
    return 1;
  }

  return number;
}

function isValidPayPlanDetail(detail) {
  const hasAmount = Number.isFinite(Number(detail?.amount));
  const hasConcept = String(detail?.concept || "").trim().length > 0;
  const hasOrder = Number.isFinite(Number(detail?.order));
  return hasAmount && hasConcept && hasOrder;
}

function parseBoolean(value) {
  if (value === true || value === false) {
    return value;
  }

  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const text = String(value).trim().toLowerCase();
  if (!text || ["false", "0", "n", "no"].includes(text)) {
    return false;
  }

  return ["true", "1", "y", "yes", "si"].includes(text) ? true : Boolean(value);
}

function safeJsonArray(raw) {
  try {
    if (!raw) {
      return [];
    }

    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function clonePayPlan(item) {
  return JSON.parse(JSON.stringify(item || {}));
}

function sqlNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? String(num) : "0";
}

function sqlMoney(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toFixed(4) : "0.0000";
}

function sqlNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }

  return sqlNumber(value);
}

function sqlBoolean(value) {
  return value ? "1" : "0";
}

function sqlDate(value) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }

  return sqlString(value);
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}
