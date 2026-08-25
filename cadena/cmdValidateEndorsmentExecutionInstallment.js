//block
//noreplace

/*
  *@name: cmdValidateEndorsmentExecutionInstallment
  *@Purpose: Rebuild payplan after endorsment Execution
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 17/06/2026
  *@Input: {changeId}
  *@Output: [{ resultado }]
*/

const n2 = (n) => Number(Number(n || 0).toFixed(2));

try {
  
  const changeId = context.changeId;
  if (!changeId) {
    return { ok: false, msg: "No se encontro el cambio" };
  }

  const change = loadOneEntity("Change", "id, lifePolicyId, jNewPayPlan, informative, Discriminator", `id = ${changeId}`);
  if (!change) {
    return { ok: false, msg: "No se encontro el cambio" };
  }

  const bill = loadOneEntity(
    "Bill",
    "id, changeId, coverages, surcharges, discounts, anualPremium, tax, anualTotal, installment, paymentMethod, periodicity, fee, jFees, jTaxes",
    `changeId = ${change.id}`
  );
  if (!bill) {
    return { ok: false, msg: "No se encontro la Bill del cambio" };
  }

  const billDiff = loadOneEntity(
    "BillDiff",
    "id, changeId, coverages, surcharges, discounts, annualPremium, tax, annualTotal, installment, jFees, jTaxes",
    `changeId = ${change.id}`
  ) ?? {};

  const cuotasCambio = safeJsonArray(change?.jNewPayPlan);
  const cuotasPoliza = getPolicyInstallments(change.lifePolicyId);
  const cuotasBase = cuotasPoliza.length ? cuotasPoliza : cuotasCambio;

  if (!cuotasBase.length) {
    return { ok: false, msg: "No hay cuotas para validar" };
  }

  const totalBill = n2(bill?.annualTotal ?? bill?.anualTotal ?? 0);
  const premiumBill = n2(bill?.anualPremium ?? 0);
  const taxBill = n2(bill?.tax ?? 0);

  const cuotasPagadas = cuotasBase.filter(q => Number(q.payed || 0) > 0);
  const cuotasPendientes = cuotasBase.filter(q => Number(q.payed || 0) <= 0);

  const totalPagado = n2(
    cuotasPagadas.reduce((sum, x) => sum + (Number(x.payed) || 0), 0)
  );

  const totalCuotasBase = n2(
    cuotasBase.reduce((sum, x) => sum + (Number(x.minimum) || 0), 0)
  );

  let cuotasDistribuye = cuotasBase.map(cloneCuota);

  if (cuotasPendientes.length > 0) {
    cuotasDistribuye = distribuirMontoEnCuotas(cuotasDistribuye, premiumBill, taxBill);
  } else {
    const diferencia = n2(totalBill - totalPagado);
    if (Math.abs(diferencia) > 0.01) {
      cuotasDistribuye.push(crearCuotaDiferencia({
        template: cuotasCambio[0] || cuotasBase[0],
        diferencia,
        premiumBill,
        taxBill
      }));
    }
  }

  cuotasDistribuye = normalizeDistributionTotals(cuotasDistribuye, totalBill);

  const nuevoTotal = n2(
    cuotasDistribuye.reduce((sum, x) => sum + (Number(x.minimum) || 0), 0)
  );

  if (change?.id > 0) {
    syncPolicyPayPlan(change, cuotasBase, cuotasDistribuye);
    updateChangePayPlan(change.id, cuotasDistribuye);
  }

  return {
    ok: true,
    msg: Math.abs(nuevoTotal - totalBill) <= 0.01
      ? "Distribuido correctamente"
      : `Distribuido con diferencia de ${n2(nuevoTotal - totalBill).toFixed(2)}`
  };

} catch (error) {
  return { ok: false, msg: error.toString() };
}

function distribuirMontoEnCuotas(cuotas, montoPrima, montoImpuesto) {

    const nuevoTotal = n2(montoPrima + montoImpuesto);

    const totalPagado = n2(
        cuotas.reduce((acc, q) =>
            acc + Number(q.payed || 0), 0)
    );

    // Cuotas con saldo pendiente
    const pendientes = cuotas.filter(q =>
        Number(q.minimum || 0) !== Number(q.payed || 0)
    );

    if (!pendientes.length) {
        return cuotas;
    }

    const proporcionPrima =
        nuevoTotal !== 0
            ? montoPrima / nuevoTotal
            : 0;

    const proporcionImpuesto =
        nuevoTotal !== 0
            ? montoImpuesto / nuevoTotal
            : 0;

    const primaPagada = n2(
        totalPagado * proporcionPrima
    );

    const impuestoPagado = n2(
        totalPagado * proporcionImpuesto
    );

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

        prima = n2(prima);
        impuesto = n2(impuesto);

        const saldoCuota = n2(prima + impuesto);
        q.minimum = n2(
          Number(q.payed || 0) + saldoCuota
        );
        q.expected = n2(q.minimum);
        q.dueAmount = n2(q.minimum);
        q.pendingAmount = n2(q.minimum);

        q.PayPlanDetail = [
            {
                amount: prima,
                concept: `Detalle de cuota #${q.numberInYear}`,
                detail: "Prima Cobertura",
                order: 1,
                paid: 0,
                normalDueDate: q.normalDueDate || q.dueDate
            },
            {
                amount: impuesto,
                concept: `Detalle de cuota #${q.numberInYear}`,
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

function getPolicyInstallments(policyId) {
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

  return (LoadEntities.outData ?? []).map(cloneCuota);
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

  return LoadEntity.outData ?? null;
}

function updateChangePayPlan(changeId, cuotas) {
  doCmd({
    cmd: "SetField",
    data: {
      entity: "Change",
      entityId: changeId,
      fieldValue: `jNewPayPlan='${JSON.stringify(cuotas)}'`,
      raw: true
    }
  });

  if (!SetField.ok) {
    throw new Error(SetField.msg);
  }
}

function syncPolicyPayPlan(change, currentCuotas, targetCuotas) {
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

      sqlParts.push(buildUpdatePayPlanSql(current.id, change.id, target));
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
    sqlParts.push(buildInsertPayPlanSql(varName, change, target));
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
      filter: `payPlanId = ${payPlanId}`,
      noTracking: true,
      fields: "id, payPlanId, amount, concept, detail, [order], paid"
    }
  });

  if (!LoadEntities.ok) {
    throw new Error(LoadEntities.msg);
  }

  return (LoadEntities.outData ?? []).map(detail => ({
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
      sqlParts.push(
        buildUpdatePayPlanDetailSql(current.id, detail, current.paid)
      );
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

function buildUpdatePayPlanSql(payPlanId, changeId, target) {
  return [
    `UPDATE PayPlan`,
    `SET expected = ${sqlMoney(target?.expected)},`,
    `    minimum = ${sqlMoney(target?.minimum)},`,
    `    changeId = ${sqlNumber(changeId)}`,
    `WHERE id = ${sqlNumber(payPlanId)};`
  ].join("\n");
}

function buildInsertPayPlanSql(varName, change, target) {
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
    sqlNumber(change?.lifePolicyId),
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
    sqlNumber(change?.id),
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
    sqlParts.push(
      buildInsertPayPlanDetailSql(payPlanRef, detail)
    );
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

/*
change: {"id":0,"status":0,"lifePolicyId":3398,"processId":null,"executionDate":"0001-01-01T00:00:00","contractYear":1,"anniversary":0,"creationDate":"2026-06-04T00:00:00Z","effectiveDate":"2026-06-04T23:23:40.478Z","code":null,"note":null,"jDetail":"{\n \"changeDate\": \"2026-06-04\",\n \"policyStart\": \"2026-05-01\",\n \"policyEnd\": \"2027-05-01\",\n \"policyDuration\": 365,\n \"remainingDays\": 331,\n \"prorate\": 0.9068493150684931506849315068,\n \"oldAnnualPremium\": 195.3000,\n \"newAnnualPremium\": 168.05,\n \"annualPremiumDif\": -27.2500,\n \"changeCost\": -24.71,\n \"oldCoverages\": 186.0000,\n \"newCoverages\": 160.05,\n \"coveragesDif\": -25.9500,\n \"coveragesCost\": -23.53,\n \"Coverages\": [\n {\n \"id\": 8873,\n \"code\": \"1\",\n \"oldPremium\": 130.2000,\n \"newPremium\": 112.04,\n \"premiumDif\": -18.1600,\n \"premiumCost\": -16.47\n },\n {\n \"id\": 8874,\n \"code\": \"3\",\n \"oldPremium\": 55.8000,\n \"newPremium\": 48.01,\n \"premiumDif\": -7.7900,\n \"premiumCost\": -7.06\n }\n ],\n \"amountPaid\": 0.0000\n}","jOldCoverages":null,"jNewCoverages":"[{\"priority\":0,\"preserveValues\":false,\"id\":8873,\"lifePolicyId\":3398,\"code\":\"1\",\"name\":\"Incendio/Rayo/Explosión\",\"description\":\"Incendio/Rayo/Explosión\",\"basic\":true,\"periodicity\":0,\"limit\":124000.0,\"startLimit\":124000.0,\"deductible\":0.0,\"number\":1,\"commercialName\":\"Incendio/Rayo/Explosión\",\"solvency2Code\":null,\"ofnCode\":0,\"ofnGroup\":0,\"internalBonus\":false,\"appliesTo\":\"INS\",\"basePremium\":118.07,\"startBasePremium\":118.07,\"loading\":-5.11,\"loadingInsuredSum\":0.0,\"extraPremium\":-6.03,\"premium\":112.04,\"startPremium\":112.04,\"internalPremium\":0.0,\"parent\":null,\"start\":\"2026-05-01T22:05:22.812Z\",\"end\":\"2027-05-01T22:05:22.812Z\",\"ignoreIndexation\":false,\"hasMaturity\":false,\"reStatus\":0,\"manualPremium\":false,\"manualLimit\":false,\"isInternal\":false,\"baseLimit\":0.0,\"limitFactor\":null,\"reinsuranceCode\":null,\"distributionMode\":null,\"parentPercentage\":0.0,\"Payouts\":null,\"Loadings\":[{\"id\":0,\"lifeCoverageId\":0,\"loading\":-5.11,\"riskType\":null,\"notes\":null,\"start\":\"2026-05-02T04:05:22.812Z\",\"end\":\"2027-05-01T22:05:22.812\",\"duration\":null,\"manual\":true,\"insuredSumBased\":false,\"perMille\":false,\"insuredId\":null,\"Insured\":null,\"RiskType\":null}],\"Claims\":null,\"Benefits\":[],\"coContractId\":null,\"CoContract\":null,\"jCustom\":null,\"jPremiumDetail\":null,\"mandatory\":false},{\"priority\":0,\"preserveValues\":false,\"id\":8874,\"lifePolicyId\":3398,\"code\":\"3\",\"name\":\"Extensión de Cobertura Catastrófica\",\"description\":\"Extensión de Cobertura Catastrófica\",\"basic\":true,\"periodicity\":0,\"limit\":124000.0,\"startLimit\":124000.0,\"deductible\":2480.0,\"number\":2,\"commercialName\":\"Extensión de Cobertura Catastrófica\",\"solvency2Code\":null,\"ofnCode\":0,\"ofnGroup\":0,\"internalBonus\":false,\"appliesTo\":\"INS\",\"basePremium\":50.6,\"startBasePremium\":50.6,\"loading\":-5.11,\"loadingInsuredSum\":0.0,\"extraPremium\":-2.59,\"premium\":48.01,\"startPremium\":48.01,\"internalPremium\":0.0,\"parent\":null,\"start\":\"2026-05-01T22:05:22.812Z\",\"end\":\"2027-05-01T22:05:22.812Z\",\"ignoreIndexation\":false,\"hasMaturity\":false,\"reStatus\":0,\"manualPremium\":false,\"manualLimit\":false,\"isInternal\":false,\"baseLimit\":0.0,\"limitFactor\":null,\"reinsuranceCode\":null,\"distributionMode\":null,\"parentPercentage\":0.0,\"Payouts\":null,\"Loadings\":[{\"id\":0,\"lifeCoverageId\":0,\"loading\":-5.11,\"riskType\":null,\"notes\":null,\"start\":\"2026-05-02T04:05:22.812Z\",\"end\":\"2027-05-01T22:05:22.812\",\"duration\":null,\"manual\":true,\"insuredSumBased\":false,\"perMille\":false,\"insuredId\":null,\"Insured\":null,\"RiskType\":null}],\"Claims\":null,\"Benefits\":[],\"coContractId\":null,\"CoContract\":null,\"jCustom\":null,\"jPremiumDetail\":null,\"mandatory\":false}]","jAmendments":null,"jNewPayPlan":"[{\"id\":33571,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":1,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.16835616438356164383561644,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-05-01T22:05:22.812\",\"coveredUntil\":\"2026-06-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.939494\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.16835616438356164383561644,\"pendingAmount\":14.16835616438356164383561644,\"dueDays\":34,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-05-01T22:05:22.812\"},{\"id\":33570,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":2,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-06-01T22:05:22.812\",\"coveredUntil\":\"2026-07-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.939526\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":3,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-06-01T22:05:22.812\"},{\"id\":33568,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":3,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-07-01T22:05:22.812\",\"coveredUntil\":\"2026-08-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.9395354\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-26,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-07-01T22:05:22.812\"},{\"id\":33569,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":4,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-08-01T22:05:22.812\",\"coveredUntil\":\"2026-09-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.9395454\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-57,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-08-01T22:05:22.812\"},{\"id\":33572,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":5,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-09-01T22:05:22.812\",\"coveredUntil\":\"2026-10-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.939554\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-88,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-09-01T22:05:22.812\"},{\"id\":33567,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":6,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-10-01T22:05:22.812\",\"coveredUntil\":\"2026-11-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.9395626\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-118,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-10-01T22:05:22.812\"},{\"id\":33566,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":7,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-11-01T22:05:22.812\",\"coveredUntil\":\"2026-12-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.939572\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-149,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-11-01T22:05:22.812\"},{\"id\":33565,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":8,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-12-01T22:05:22.812\",\"coveredUntil\":\"2027-01-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.9395805\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-179,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-12-01T22:05:22.812\"},{\"id\":33564,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":9,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2027-01-01T22:05:22.812\",\"coveredUntil\":\"2027-02-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.9395889\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-210,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2027-01-01T22:05:22.812\"},{\"id\":33563,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":10,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2027-02-01T22:05:22.812\",\"coveredUntil\":\"2027-03-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.9395988\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-241,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2027-02-01T22:05:22.812\"},{\"id\":33562,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":11,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2027-03-01T22:05:22.812\",\"coveredUntil\":\"2027-04-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.9396071\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-269,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2027-03-01T22:05:22.812\"},{\"id\":33561,\"lifePolicyId\":3398,\"transferId\":null,\"numberInYear\":12,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":14.22,\"minimum\":14.22,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2027-04-01T22:05:22.812\",\"coveredUntil\":\"2027-05-01T22:05:22.812\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-06-04T23:22:37.9396159\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":14.22,\"pendingAmount\":14.2200,\"dueDays\":-300,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2027-04-01T22:05:22.812\"}]","changeIdToBeAmended":null,"jSnapshot":null,"informative":false,"Bill":{"id":0,"changeId":null,"status":0,"type":null,"coverages":160.05,"surcharges":0,"discounts":0,"anualPremium":160.05,"tax":8,"anualTotal":168.05,"annualTotal":168.05,"receiptTypeCode":null,"ReceiptType":null,"fiscalNumber":null,"fee":0,"installment":14,"paymentMethod":"PRO","periodicity":"m","jFees":"[]","jTaxes":"[{\"id\":-2147482636,\"taxSchemeId\":3,\"action\":\"ChangeLoading\",\"lifePolicyId\":3398,\"changeId\":null,\"taxName\":\"Impuesto de Seguros\",\"amount\":8.0,\"currency\":\"USD\",\"created\":\"2026-06-04T23:27:04.4562208Z\",\"liquidationId\":null,\"disabled\":true,\"claimPaymentId\":null,\"ClaimPayment\":null,\"paymentTaxId\":null,\"PaymentTax\":null,\"anniversaryId\":null}]"},"BillDiff":{"id":0,"changeId":0,"coverages":-25.95,"surcharges":0,"discounts":0,"annualPremium":-25.95,"tax":-1.3,"annualTotal":-27.25,"fee":0,"installment":-2.28,"jFees":"[]","jTaxes":"[{\"id\":0,\"taxSchemeId\":0,\"action\":\"LoadingChange\",\"lifePolicyId\":3398,\"changeId\":null,\"taxName\":\"Impuesto de Seguros\",\"amount\":-1.3000,\"currency\":\"USD\",\"created\":\"2026-06-04T23:27:04.479394Z\",\"liquidationId\":null,\"disabled\":false,\"claimPaymentId\":null,\"ClaimPayment\":null,\"paymentTaxId\":null,\"PaymentTax\":null,\"anniversaryId\":null}]"},"BillUnique":null,"Discriminator":null,"cancellationBillId":null,"CancellationBill":null,"Process":null,"Surcharges":null,"Taxes":null,"entityState":"","processState":"","jAdditional":""}
*/
