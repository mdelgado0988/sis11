//block
//noreplace

/*
  *@name: cmdKeepPayPlanOnInformative
  *@Purpose: Keep the payment plan aligned with the snapshot when the endorsement is informational only.
  *@Author: Michael Delgado
  *@Created: 25/06/2026
  *@Input: { changeId }
  *@Output: { ok, msg }
*/

const n2 = value => Number(Number(value || 0).toFixed(2));

try {
  const changeId = Number(context?.changeId || 0);
  if (!changeId) {
    return { ok: false, msg: "No se recibió changeId" };
  }

  const change = loadChange(changeId);
  if (!change) {
    return { ok: false, msg: "No se encontró el cambio" };
  }

  if (!change.informative) {
    return { ok: true, msg: "No es informativo" };
  }

  const snapshot = parseSnapshot(change.jSnapshot);
  const snapshotPayPlan = normalizePayPlanList(
    extractPayPlan(snapshot),
    change.lifePolicyId
  );

  if (!snapshotPayPlan.length) {
    return { ok: false, msg: "El snapshot no contiene PayPlan" };
  }

  const currentPayPlan = loadPolicyPayPlan(change.lifePolicyId);
  hydrateMissingPayPlanDetails(snapshotPayPlan, currentPayPlan);
  syncPolicyPayPlan(change, currentPayPlan, snapshotPayPlan);
  updateChangePayPlan(changeId, snapshotPayPlan);

  return { ok: true, msg: "Se actualizaron las tablas del plan de pago desde el snapshot" };
} catch (error) {
  return { ok: false, msg: error.toString() };
}

function loadChange(changeId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Change",
      fields: "id, lifePolicyId, informative, jSnapshot, jNewPayPlan",
      filter: `id = ${changeId}`,
      noTracking: true
    }
  });

  if (!LoadEntity.ok) {
    throw new Error(LoadEntity.msg);
  }

  return LoadEntity.outData || null;
}

function loadPolicyPayPlan(policyId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "PayPlan",
      filter: `lifepolicyId = ${policyId}`,
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
      filter: `payPlanId = ${payPlanId}`,
      noTracking: true,
      fields: "id, payPlanId, amount, concept, detail, [order], paid"
    }
  });

  if (!LoadEntities.ok) {
    throw new Error(LoadEntities.msg);
  }

  return (LoadEntities.outData || []).map(detail => ({
    id: detail?.id,
    payPlanId: detail?.payPlanId,
    amount: detail?.amount,
    concept: detail?.concept,
    detail: detail?.detail,
    order: detail?.order,
    paid: detail?.paid
  }));
}

function parseSnapshot(snapshotValue) {
  if (!snapshotValue) {
    return {};
  }

  if (typeof snapshotValue === "object") {
    return snapshotValue;
  }

  try {
    return JSON.parse(snapshotValue);
  } catch (error) {
    throw new Error("El snapshot del cambio no es un JSON válido");
  }
}

function extractPayPlan(snapshot) {
  const fromSnapshot =
    snapshot?.PayPlan ??
    snapshot?.payPlan ??
    snapshot?.payplan ??
    [];

  return Array.isArray(fromSnapshot) ? fromSnapshot : [];
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

  const hasDetails = Object.prototype.hasOwnProperty.call(item, "PayPlanDetail");
  const details = Array.isArray(item.PayPlanDetail) ? item.PayPlanDetail : safeJsonArray(item.PayPlanDetail);

  return {
    ...clonePayPlan(item),
    lifePolicyId: Number(item.lifePolicyId || policyId || 0),
    id: Number(item.id || 0),
    numberInYear: Number(item.numberInYear || 0),
    contractYear: Number(item.contractYear || 0),
    expected: n2(item.expected),
    minimum: n2(item.minimum),
    payed: n2(item.payed),
    payedDate: item.payedDate ?? null,
    dueDate: item.dueDate ?? null,
    transferId: item.transferId ?? null,
    coveredUntil: item.coveredUntil ?? null,
    allocationDate: item.allocationDate ?? null,
    final: parseBoolean(item.final),
    finalDate: item.finalDate ?? null,
    allocationId: item.allocationId ?? null,
    currency: item.currency ?? "USD",
    cancellationDate: item.cancellationDate ?? null,
    compensationDate: item.compensationDate ?? null,
    custom: parseBoolean(item.custom),
    created: item.created ?? null,
    penaltyInterest: n2(item.penaltyInterest),
    normalDueDate: item.normalDueDate ?? item.dueDate ?? null,
    changeId: item.changeId ?? null,
    PayPlanDetail: hasDetails ? normalizePayPlanDetails(details) : null
  };
}

function hydrateMissingPayPlanDetails(targetPayPlans, currentPayPlans) {
  const currentById = new Map(
    (currentPayPlans || [])
      .filter(item => Number(item?.id || 0) > 0)
      .map(item => [Number(item.id), item])
  );
  const currentByNumber = new Map(
    (currentPayPlans || [])
      .filter(item => Number(item?.numberInYear || 0) > 0)
      .map(item => [Number(item.numberInYear), item])
  );

  for (const target of targetPayPlans || []) {
    const hasTargetDetails = Array.isArray(target?.PayPlanDetail);
    if (hasTargetDetails) {
      continue;
    }

    const current = findCurrentPayPlan(target, currentById, currentByNumber);
    if (current?.id) {
      const currentDetails = loadPayPlanDetails(current.id);
      if (currentDetails.length) {
        target.PayPlanDetail = currentDetails.map(detail => ({
          id: detail.id,
          payPlanId: detail.payPlanId,
          amount: detail.amount,
          concept: detail.concept,
          detail: detail.detail,
          order: detail.order,
          paid: detail.paid
        }));
      }
    }
  }
}

function normalizePayPlanDetails(details) {
  return (details || [])
    .map(detail => ({
      id: Number(detail?.id || 0),
      payPlanId: Number(detail?.payPlanId || 0),
      amount: n2(detail?.amount),
      concept: detail?.concept ?? "",
      detail: detail?.detail ?? "",
      order: Number(detail?.order || 0),
      paid: n2(detail?.paid)
    }))
    .filter(isValidPayPlanDetail);
}

function clonePayPlan(item) {
  return JSON.parse(JSON.stringify(item || {}));
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

function syncPolicyPayPlan(change, currentPayPlans, targetPayPlans) {
  const currentById = new Map(
    (currentPayPlans || [])
      .filter(item => Number(item?.id || 0) > 0)
      .map(item => [Number(item.id), item])
  );
  const currentByKey = new Map(
    (currentPayPlans || [])
      .filter(item => Number(item?.contractYear || 0) > 0 && Number(item?.numberInYear || 0) > 0)
      .map(item => [buildPayPlanMatchKey(item), item])
  );
  const currentByDueDate = new Map(
    (currentPayPlans || [])
      .filter(item => item?.dueDate)
      .map(item => [buildPayPlanDueDateKey(item), item])
  );

  const matchedCurrentIds = new Set();
  const sqlParts = [];
  let newIndex = 0;

  for (const target of targetPayPlans || []) {
    const current = findCurrentPayPlan(target, currentById, currentByKey, currentByDueDate);

    if (current?.id) {
      matchedCurrentIds.add(Number(current.id));
      sqlParts.push(buildUpdatePayPlanSql(current.id, change.id, current, target));
      syncPayPlanDetails(sqlParts, current.id, target, Number(current.payed || 0) > 0.01);
      continue;
    }

    newIndex += 1;
    const varName = `@NewPayPlanId_${newIndex}`;
    sqlParts.push(buildInsertPayPlanSql(varName, change, target));
    appendPayPlanDetailInserts(sqlParts, varName, target);
  }

  for (const current of currentPayPlans || []) {
    const currentId = Number(current?.id || 0);
    if (!currentId || matchedCurrentIds.has(currentId)) {
      continue;
    }

    if (Number(current?.payed || 0) <= 0.01) {
      sqlParts.push(`DELETE FROM PayPlanDetail WHERE payPlanId = ${sqlNumber(currentId)};`);
      sqlParts.push(`DELETE FROM PayPlan WHERE id = ${sqlNumber(currentId)};`);
    }
  }

  if (!sqlParts.length) {
    return;
  }

  executeSql(sqlParts.join("\n"));
}

function findCurrentPayPlan(target, currentById, currentByKey, currentByDueDate) {
  const targetId = Number(target?.id || 0);
  if (targetId > 0 && currentById.has(targetId)) {
    return currentById.get(targetId);
  }

  const matchKey = buildPayPlanMatchKey(target);
  if (currentByKey.has(matchKey)) {
    return currentByKey.get(matchKey);
  }

  const dueDateKey = buildPayPlanDueDateKey(target);
  if (dueDateKey && currentByDueDate.has(dueDateKey)) {
    return currentByDueDate.get(dueDateKey);
  }

  return null;
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

function buildUpdatePayPlanSql(payPlanId, changeId, current, target) {
  const keepPaid = Number(current?.payed || 0) > 0.01;
  const payedValue = keepPaid ? current?.payed : target?.payed;
  const payedDateValue = keepPaid ? current?.payedDate : target?.payedDate;

  return [
    `UPDATE PayPlan`,
    `SET lifePolicyId = ${sqlNumber(target?.lifePolicyId ?? current?.lifePolicyId)},`,
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
    `    changeId = ${sqlNumber(changeId)}`,
    `WHERE id = ${sqlNumber(payPlanId)};`
  ].join("\n");
}

function buildInsertPayPlanSql(varName, change, target) {
  const created = target?.created || new Date().toISOString();
  const fieldList = [
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
    `INSERT INTO PayPlan (${fieldList.join(", ")})`,
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
  const fields = [
    "payPlanId",
    "amount",
    "concept",
    "detail",
    "[order]",
    "paid"
  ];

  const values = [
    payPlanRef,
    sqlMoney(detail?.amount),
    sqlString(detail?.concept),
    sqlString(detail?.detail),
    sqlNumber(detail?.order),
    sqlMoney(detail?.paid)
  ];

  return [
    `INSERT INTO PayPlanDetail (${fields.join(", ")})`,
    `VALUES (${values.join(", ")});`
  ].join("\n");
}

function buildUpdatePayPlanDetailSql(detailId, detail, paid) {
  return [
    `UPDATE PayPlanDetail`,
    `SET amount = ${sqlMoney(detail?.amount)},`,
    `    concept = ${sqlString(detail?.concept)},`,
    `    detail = ${sqlString(detail?.detail)},`,
    `    [order] = ${sqlNumber(detail?.order)},`,
    `    paid = ${sqlMoney(paid)}`,
    `WHERE id = ${sqlNumber(detailId)};`
  ].join("\n");
}

function updateChangePayPlan(changeId, payPlan) {
  doCmd({
    cmd: "SetField",
    data: {
      entity: "Change",
      entityId: changeId,
      fieldValue: `jNewPayPlan=${sqlString(JSON.stringify(payPlan))}`,
      raw: true
    }
  });

  if (!SetField.ok) {
    throw new Error(SetField.msg);
  }
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

function sqlNumber(value) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? String(num) : "0";
}

function buildPayPlanMatchKey(item) {
  const contractYear = Number(item?.contractYear || 0);
  const numberInYear = Number(item?.numberInYear || 0);
  return `${contractYear}|${numberInYear}`;
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
  if (!text) {
    return false;
  }

  if (["true", "1", "y", "yes", "si", "sí"].includes(text)) {
    return true;
  }

  if (["false", "0", "n", "no"].includes(text)) {
    return false;
  }

  return Boolean(value);
}

function isValidPayPlanDetail(detail) {
  const hasAmount = Number.isFinite(Number(detail?.amount));
  const hasConcept = String(detail?.concept ?? "").trim().length > 0;
  const hasOrder = Number.isFinite(Number(detail?.order));
  return hasAmount && hasConcept && hasOrder;
}

function sqlMoney(value) {
  const num = Number(value ?? 0);
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

  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
}
