//block
//noreplace

/*
  *@name: cmdApplyPayPlanDifferenceChangeCoverage
  *@Purpose: Keep the current payment plan and add the difference of a
  *          coverage-change endorsement as one new installment.
  *@Author: OpenAI
  *@Input: { changeId }
  *@Output: { ok, msg, difference }
*/

const round2 = value => Math.round(Number(value || 0) * 100) / 100;

try {
  const changeId = Number(context?.changeId || 0);
  if (!(changeId > 0)) return { ok: false, msg: "No se recibio changeId" };

  const change = loadChange(changeId);
  if (!change) return { ok: false, msg: "No se encontro el endoso" };

  const existing = loadPayPlanByChange(changeId);
  if (existing.length) {
    return { ok: true, msg: "La cuota diferencial ya existe", difference: round2(existing[0].minimum) };
  }

  const oldPlan = parseArray(change.jOldPayPlan);
  const newPlan = parseArray(change.jNewPayPlan).filter(item => !item?.cancellationDate);
  if (!oldPlan.length || !newPlan.length) {
    return { ok: false, msg: "El endoso no contiene jOldPayPlan y jNewPayPlan para calcular la diferencia" };
  }

  const difference = round2(sumPlan(newPlan) - sumPlan(oldPlan));
  if (Math.abs(difference) < 0.01) {
    return { ok: true, msg: "El plan de pagos no tiene diferencia", difference: 0 };
  }

  const currentPlan = loadPolicyPayPlan(change.lifePolicyId);
  const lastNumber = currentPlan.reduce((max, item) => Math.max(max, Number(item.numberInYear || 0)), 0);
  const contractYear = currentPlan.reduce((max, item) => Math.max(max, Number(item.contractYear || 0)), 0) || Number(change.contractYear || 1);
  const currency = String((currentPlan[0] && currentPlan[0].currency) || newPlan[0].currency || "USD");
  const dueDate = noonDate(change.effectiveDate);
  const concept = String((newPlan[0] && newPlan[0].concept) || "Prima");

  insertDifference(change, {
    concept,
    difference,
    numberInYear: lastNumber + 1,
    contractYear,
    currency,
    dueDate
  });

  return { ok: true, msg: "Se agrego la cuota diferencial del endoso", difference };
} catch (error) {
  return { ok: false, msg: error?.toString?.() || String(error) };
}

function loadChange(changeId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Change",
      fields: "id, lifePolicyId, contractYear, effectiveDate, jOldPayPlan, jNewPayPlan",
      filter: `id = ${sqlNumber(changeId)}`,
      noTracking: true
    }
  });
  if (!LoadEntity.ok) throw new Error(LoadEntity.msg);
  return LoadEntity.outData || null;
}

function loadPayPlanByChange(changeId) {
  return loadEntities("PayPlan", `changeId = ${sqlNumber(changeId)}`, "id, minimum");
}

function loadPolicyPayPlan(policyId) {
  return loadEntities(
    "PayPlan",
    `lifePolicyId = ${sqlNumber(policyId)} AND cancellationDate IS NULL`,
    "id, numberInYear, contractYear, currency"
  );
}

function loadEntities(entity, filter, fields) {
  doCmd({
    cmd: "LoadEntities",
    data: { entity, filter, fields, noTracking: true }
  });
  if (!LoadEntities.ok) throw new Error(LoadEntities.msg);
  return Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error("El plan de pagos del endoso no es un JSON valido");
  }
}

function sumPlan(plan) {
  return (plan || []).reduce((total, item) => total + Number(item?.minimum ?? item?.expected ?? 0), 0);
}

function noonDate(value) {
  const raw = String(value || "").slice(0, 10);
  return raw ? raw + "T12:00:00" : null;
}

function insertDifference(change, data) {
  const sql = `
INSERT INTO PayPlan
  (lifePolicyId, concept, expected, minimum, payed, dueDate, coveredUntil,
   contractYear, final, numberInYear, currency, created, normalDueDate, changeId)
VALUES
  (${sqlNumber(change.lifePolicyId)}, ${sqlString(data.concept)},
   ${sqlMoney(data.difference)}, ${sqlMoney(data.difference)}, 0,
   ${sqlDate(data.dueDate)}, ${sqlDate(data.dueDate)},
   ${sqlNumber(data.contractYear)}, 0, ${sqlNumber(data.numberInYear)},
   ${sqlString(data.currency)}, GETDATE(), ${sqlDate(data.dueDate)},
   ${sqlNumber(change.id)});

DECLARE @PayPlanId INT = SCOPE_IDENTITY();
INSERT INTO PayPlanDetail (payPlanId, amount, concept, detail, [order], paid)
VALUES (@PayPlanId, ${sqlMoney(data.difference)},
  ${sqlString("Diferencia del endoso " + change.id)}, ${sqlString("Prima Cobertura")}, 1, 0);`;

  doCmd({ cmd: "DoQuery", data: { sql } });
  if (!DoQuery.ok) throw new Error(DoQuery.msg);
}

function sqlNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? String(number) : "0";
}

function sqlMoney(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(4) : "0.0000";
}

function sqlDate(value) {
  return value ? sqlString(value) : "NULL";
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}
