//block
//noreplace
/*
  *@name: cmdFixMissingInstallmentScheme
  *@Purpose: Backfills missing installment scheme data and rebuilds pay plans
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 2026-07-03
  *@Input: none
  *@Output: { ok, msg }
*/

const TARGET_INSTALLMENT_SCHEME_ID = 7;
const n2 = (n) => Number(Number(n || 0).toFixed(2));

try {
  const policies = loadPoliciesWithoutScheme();

  if (!policies.length) {
    return { ok: true, msg: "No se encontraron pólizas con esquema de pago pendiente de corrección." };
  }

  const summary = {
    total: policies.length,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  for (const policy of policies) {
    try {
      const currentPayPlan = loadPolicyPayPlan(policy.id);

      if (!currentPayPlan.length) {
        summary.skipped += 1;
        summary.details.push({
          policyId: policy.id,
          code: policy.code || "",
          result: "skipped",
          msg: "La póliza no tiene cuotas para recalcular."
        });
        continue;
      }

      const targetPayPlan = rebuildPayPlan(policy, currentPayPlan);
      if (!targetPayPlan.length) {
        summary.skipped += 1;
        summary.details.push({
          policyId: policy.id,
          code: policy.code || "",
          result: "skipped",
          msg: "No fue posible reconstruir el plan de pago."
        });
        continue;
      }

      updatePolicyInstallmentScheme(policy.id);
      syncPolicyPayPlan(policy.id, currentPayPlan, targetPayPlan);

      summary.updated += 1;
      summary.details.push({
        policyId: policy.id,
        code: policy.code || "",
        result: "updated",
        msg: "Esquema de pago actualizado y cuotas recalculadas."
      });
    } catch (error) {
      summary.errors += 1;
      summary.details.push({
        policyId: policy.id,
        code: policy.code || "",
        result: "error",
        msg: error?.message || String(error)
      });
    }
  }

  return {
    ok: summary.errors === 0,
    msg: `Procesadas ${summary.total} pólizas. Actualizadas: ${summary.updated}. Omitidas: ${summary.skipped}. Errores: ${summary.errors}.`,
    summary
  };
} catch (error) {
  return { ok: false, msg: error?.message || String(error) };
}

function loadPoliciesWithoutScheme() {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "LifePolicy",
      operation: "GET",
      noTracking: true,
      filter: "installmentSchemeId IS NULL",
      fields: "id, code, anualPremium, tax, anualTotal, installment, paymentMethod, periodicity, [start], [end], installmentSchemeId"
    }
  });

  if (!LoadEntities.ok) {
    throw new Error(LoadEntities.msg);
  }

  return Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
}

function loadPolicyPayPlan(policyId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "PayPlan",
      operation: "GET",
      noTracking: true,
      filter: `lifePolicyId = ${policyId}`,
      fields: "id, lifePolicyId, concept, expected, minimum, payed, payedDate, dueDate, transferId, coveredUntil, allocationDate, contractYear, final, finalDate, numberInYear, allocationId, currency, cancellationDate, compensationDate, custom, created, penaltyInterest, normalDueDate, changeId"
    }
  });

  if (!LoadEntities.ok) {
    throw new Error(LoadEntities.msg);
  }

  return (Array.isArray(LoadEntities.outData) ? LoadEntities.outData : []).map(cloneCuota);
}

function updatePolicyInstallmentScheme(policyId) {
  doCmd({
    cmd: "SetField",
    data: {
      entity: "LifePolicy",
      entityId: policyId,
      fieldValue: `installmentSchemeId=${TARGET_INSTALLMENT_SCHEME_ID}`,
      raw: true
    }
  });

  if (!SetField.ok) {
    throw new Error(SetField.msg);
  }
}

function rebuildPayPlan(policy, currentPayPlan) {
  const cuotas = (currentPayPlan || []).map(cloneCuota);
  if (!cuotas.length) {
    return [];
  }

  const totalBill = n2(policy?.anualTotal ?? n2(policy?.anualPremium || 0) + n2(policy?.tax || 0));
  const premiumBill = n2(policy?.anualPremium || 0);
  const taxBill = n2(policy?.tax || 0);
  const totalPagado = n2(cuotas.reduce((sum, x) => sum + n2(x?.payed || 0), 0));
  const cuotasPendientes = cuotas.filter(q => n2(q?.payed || 0) <= 0.01);

  if (cuotasPendientes.length > 0) {
    distribuirMontoEnCuotas(cuotas, premiumBill, taxBill);
  } else {
    const diferencia = n2(totalBill - totalPagado);
    if (Math.abs(diferencia) > 0.01) {
      cuotas.push(crearCuotaDiferencia({
        template: cuotas[0],
        diferencia,
        premiumBill,
        taxBill
      }));
    }
  }

  return normalizeDistributionTotals(cuotas, totalBill);
}

function distribuirMontoEnCuotas(cuotas, montoPrima, montoImpuesto) {
  const pendientes = cuotas.filter(q => n2(q?.payed || 0) <= 0.01);
  if (!pendientes.length) {
    return cuotas;
  }

  const totalPlan = n2(montoPrima + montoImpuesto);
  const totalPagado = n2(cuotas.reduce((acc, q) => acc + n2(q?.payed || 0), 0));

  const proporcionPrima = totalPlan !== 0 ? montoPrima / totalPlan : 0;
  const proporcionImpuesto = totalPlan !== 0 ? montoImpuesto / totalPlan : 0;

  const primaPagada = n2(totalPagado * proporcionPrima);
  const impuestoPagado = n2(totalPagado * proporcionImpuesto);

  const saldoPrima = n2(montoPrima - primaPagada);
  const saldoImpuesto = n2(montoImpuesto - impuestoPagado);

  const cantidad = pendientes.length;
  const primaBase = n2(saldoPrima / cantidad);
  const impuestoBase = n2(saldoImpuesto / cantidad);

  let acumuladoPrima = 0;
  let acumuladoImpuesto = 0;

  pendientes.forEach((q, index) => {
    let prima;
    let impuesto;

    if (index === cantidad - 1) {
      prima = n2(saldoPrima - acumuladoPrima);
      impuesto = n2(saldoImpuesto - acumuladoImpuesto);
    } else {
      prima = primaBase;
      impuesto = impuestoBase;
      acumuladoPrima = n2(acumuladoPrima + prima);
      acumuladoImpuesto = n2(acumuladoImpuesto + impuesto);
    }

    const saldoCuota = n2(prima + impuesto);
    q.minimum = n2(n2(q.payed || 0) + saldoCuota);
    q.expected = n2(q.minimum);
    q.dueAmount = n2(q.minimum);
    q.pendingAmount = n2(q.minimum);

    q.PayPlanDetail = [
      {
        amount: prima,
        concept: `Detalle de cuota #${q.numberInYear || 0}`,
        detail: "Prima Cobertura",
        order: 1,
        paid: 0,
        normalDueDate: q.normalDueDate || q.dueDate
      },
      {
        amount: impuesto,
        concept: `Detalle de cuota #${q.numberInYear || 0}`,
        detail: "Impuesto de Seguros",
        order: 2,
        paid: 0,
        normalDueDate: q.normalDueDate || q.dueDate
      }
    ];
  });

  return cuotas;
}

function normalizeDistributionTotals(cuotas, totalBill) {
  const normalized = (cuotas ?? []).map(cloneCuota);
  if (!normalized.length) {
    return normalized;
  }

  let totalActual = 0;
  const adjustableIndexes = [];

  normalized.forEach((q, index) => {
    q.payed = n2(q.payed ?? 0);
    q.minimum = n2(q.minimum ?? 0);
    q.expected = n2(q.expected ?? q.minimum);
    q.dueAmount = n2(q.dueAmount ?? q.minimum);
    q.pendingAmount = n2(q.pendingAmount ?? q.minimum);

    if (Array.isArray(q.PayPlanDetail) && q.PayPlanDetail.length > 0) {
      q.PayPlanDetail = normalizePayPlanDetails(q, q.PayPlanDetail);
    }

    totalActual = n2(totalActual + q.minimum);

    if (Number(q.payed || 0) <= 0.01 || Math.abs(n2(q.minimum) - n2(q.payed)) > 0.01) {
      adjustableIndexes.push(index);
    }
  });

  const diff = n2(totalBill - totalActual);
  if (Math.abs(diff) > 0.01 && adjustableIndexes.length > 0) {
    const index = adjustableIndexes[adjustableIndexes.length - 1];
    const target = normalized[index];
    target.minimum = n2(target.minimum + diff);
    target.expected = n2(target.minimum);
    target.dueAmount = n2(target.minimum);
    target.pendingAmount = n2(target.minimum);
    target.PayPlanDetail = normalizePayPlanDetails(target, target.PayPlanDetail);
  }

  return normalized;
}

function normalizePayPlanDetails(payPlan, details) {
  const normalized = (details ?? []).map(detail => ({
    amount: n2(detail?.amount),
    concept: detail?.concept ?? "",
    detail: detail?.detail ?? "",
    order: Number(detail?.order ?? 0),
    paid: n2(detail?.paid ?? 0)
  }));

  if (!normalized.length) {
    return normalized;
  }

  const targetTotal = n2((payPlan?.minimum ?? 0) - (payPlan?.payed ?? 0));
  let detailTotal = n2(normalized.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  const diff = n2(targetTotal - detailTotal);

  if (Math.abs(diff) > 0.01) {
    normalized[normalized.length - 1].amount = n2(normalized[normalized.length - 1].amount + diff);
    detailTotal = n2(normalized.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  }

  return normalized;
}

function syncPolicyPayPlan(policyId, currentCuotas, targetCuotas) {
  const currentById = new Map(
    (currentCuotas ?? [])
      .filter(x => Number(x?.id || 0) > 0)
      .map(x => [Number(x.id), x])
  );

  const sqlParts = [];
  let newIndex = 0;

  for (const target of targetCuotas ?? []) {
    const targetId = Number(target?.id || 0);
    const current = targetId > 0 ? currentById.get(targetId) : null;

    if (current) {
      if (!shouldTouchPayPlan(current, target)) {
        continue;
      }

      sqlParts.push(buildUpdatePayPlanSql(current.id, target));
      if (Number(current?.payed ?? 0) > 0.01) {
        const currentDetails = loadPayPlanDetails(current.id);
        syncPayPlanDetailsKeepingHistory(sqlParts, current.id, target, currentDetails);
      } else {
        sqlParts.push(`DELETE FROM PayPlanDetail WHERE payPlanId = ${current.id};`);
        appendPayPlanDetailInserts(sqlParts, current.id, target);
      }
      continue;
    }

    newIndex += 1;
    const varName = `@NewPayPlanId_${newIndex}`;
    sqlParts.push(buildInsertPayPlanSql(varName, policyId, target));
    appendPayPlanDetailInserts(sqlParts, varName, target);
  }

  if (!sqlParts.length) {
    return;
  }

  executeSql(sqlParts.join("\n"));
}

function loadPayPlanDetails(payPlanId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "PayPlanDetail",
      operation: "GET",
      noTracking: true,
      filter: `payPlanId = ${payPlanId}`,
      fields: "id, payPlanId, amount, concept, detail, [order], paid"
    }
  });

  if (!LoadEntities.ok) {
    throw new Error(LoadEntities.msg);
  }

  return (Array.isArray(LoadEntities.outData) ? LoadEntities.outData : []).map(detail => ({
    id: detail?.id,
    payPlanId: detail?.payPlanId,
    amount: detail?.amount,
    concept: detail?.concept,
    detail: detail?.detail,
    order: detail?.order,
    paid: detail?.paid
  }));
}

function syncPayPlanDetailsKeepingHistory(sqlParts, payPlanId, target, currentDetails) {
  const targetDetails = Array.isArray(target?.PayPlanDetail) ? target.PayPlanDetail : [];
  if (!targetDetails.length) {
    return;
  }

  const currentByOrder = new Map(
    (currentDetails ?? [])
      .filter(detail => Number(detail?.order ?? 0) > 0)
      .map(detail => [Number(detail.order), detail])
  );
  const usedCurrentIds = new Set();

  for (const detail of targetDetails) {
    const order = Number(detail?.order ?? 0);
    const current = currentByOrder.get(order);

    if (current?.id) {
      usedCurrentIds.add(Number(current.id));
      sqlParts.push(buildUpdatePayPlanDetailSql(current.id, detail, current.paid));
      continue;
    }

    sqlParts.push(buildInsertPayPlanDetailSql(payPlanId, detail));
  }

  for (const current of currentDetails ?? []) {
    const currentId = Number(current?.id ?? 0);
    if (!currentId || usedCurrentIds.has(currentId)) {
      continue;
    }

    if (Number(current?.paid ?? 0) <= 0.01) {
      sqlParts.push(`DELETE FROM PayPlanDetail WHERE id = ${sqlNumber(currentId)};`);
    }
  }
}

function shouldTouchPayPlan(current, target) {
  const currentPayed = n2(current?.payed ?? 0);
  const currentMinimum = n2(current?.minimum ?? 0);
  const hasPayment = currentPayed > 0.01;
  const hasPartialPayment = hasPayment && Math.abs(currentPayed - currentMinimum) > 0.01;
  const changedAmounts =
    Math.abs(n2(current?.expected ?? 0) - n2(target?.expected ?? 0)) > 0.01 ||
    Math.abs(n2(current?.minimum ?? 0) - n2(target?.minimum ?? 0)) > 0.01;

  return changedAmounts && (!hasPayment || hasPartialPayment);
}

function buildUpdatePayPlanSql(payPlanId, target) {
  return [
    `UPDATE PayPlan`,
    `SET expected = ${sqlMoney(target?.expected)},`,
    `    minimum = ${sqlMoney(target?.minimum)}`,
    `WHERE id = ${sqlNumber(payPlanId)};`
  ].join("\n");
}

function buildInsertPayPlanSql(varName, policyId, target) {
  const created = target?.created || new Date().toISOString();
  const fieldList = [
    "lifePolicyId",
    "numberInYear",
    "contractYear",
    "concept",
    "expected",
    "minimum",
    "currency",
    "payed",
    "final",
    "finalDate",
    "allocationDate",
    "payedDate",
    "dueDate",
    "coveredUntil",
    "transferId",
    "changeId",
    "penaltyInterest",
    "created",
    "allocationId",
    "cancellationDate",
    "compensationDate",
    "custom",
    "normalDueDate"
  ];

  const values = [
    sqlNumber(policyId),
    sqlNumber(target?.numberInYear),
    sqlNumber(target?.contractYear),
    sqlString(target?.concept),
    sqlMoney(target?.expected),
    sqlMoney(target?.minimum),
    sqlString(target?.currency || "USD"),
    sqlMoney(target?.payed ?? 0),
    sqlBoolean(target?.final),
    sqlDate(target?.finalDate),
    sqlDate(target?.allocationDate),
    sqlDate(target?.payedDate),
    sqlDate(target?.dueDate),
    sqlDate(target?.coveredUntil),
    sqlNullableNumber(target?.transferId),
    "NULL",
    sqlMoney(target?.penaltyInterest ?? 0),
    sqlDate(created),
    sqlNullableNumber(target?.allocationId),
    sqlDate(target?.cancellationDate),
    sqlDate(target?.compensationDate),
    sqlBoolean(target?.custom),
    sqlDate(target?.normalDueDate)
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
  if (!details.length) {
    return;
  }

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
    sqlMoney(detail?.paid ?? 0)
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

function executeSql(sql) {
  doCmd({ cmd: "DoQuery", data: { sql } });

  if (!DoQuery.ok) {
    throw new Error(DoQuery.msg);
  }
}

function sqlNumber(value) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? String(num) : "0";
}

function sqlMoney(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) {
    return "0.00";
  }

  return num.toFixed(2);
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

function cloneCuota(x) {
  return {
    id: x.id,
    lifePolicyId: x.lifePolicyId,
    concept: x.concept,
    expected: x.expected,
    minimum: x.minimum,
    payed: x.payed,
    payedDate: x.payedDate,
    dueDate: x.dueDate,
    transferId: x.transferId,
    coveredUntil: x.coveredUntil,
    allocationDate: x.allocationDate,
    contractYear: x.contractYear,
    final: x.final,
    finalDate: x.finalDate,
    numberInYear: x.numberInYear,
    allocationId: x.allocationId,
    currency: x.currency,
    cancellationDate: x.cancellationDate,
    compensationDate: x.compensationDate,
    custom: x.custom,
    created: x.created,
    penaltyInterest: x.penaltyInterest,
    normalDueDate: x.normalDueDate,
    changeId: x.changeId,
    dueAmount: x.dueAmount,
    pendingAmount: x.pendingAmount,
    PayPlanDetail: Array.isArray(x.PayPlanDetail) ? x.PayPlanDetail : x.PayPlanDetail
  };
}

function crearCuotaDiferencia({ template, diferencia, premiumBill, taxBill }) {
  const base = cloneCuota(template || {});
  const nuevoTotal = n2(premiumBill + taxBill);
  const proporcionPrima = nuevoTotal !== 0 ? premiumBill / nuevoTotal : 0;
  const proporcionImpuesto = nuevoTotal !== 0 ? taxBill / nuevoTotal : 0;
  const prima = n2(diferencia * proporcionPrima);
  const impuesto = n2(diferencia * proporcionImpuesto);

  return {
    ...base,
    id: 0,
    payed: 0,
    payedDate: null,
    allocationId: null,
    transferId: null,
    minimum: n2(diferencia),
    expected: n2(diferencia),
    dueAmount: n2(diferencia),
    pendingAmount: n2(diferencia),
    PayPlanDetail: [
      {
        amount: prima,
        concept: `Detalle de cuota #${base.numberInYear ?? 0}`,
        detail: "Prima Cobertura",
        order: 1,
        paid: 0,
        normalDueDate: base.normalDueDate || base.dueDate
      },
      {
        amount: impuesto,
        concept: `Detalle de cuota #${base.numberInYear ?? 0}`,
        detail: "Impuesto de Seguros",
        order: 2,
        paid: 0,
        normalDueDate: base.normalDueDate || base.dueDate
      }
    ]
  };
}
