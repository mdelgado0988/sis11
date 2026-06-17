//block
//noreplace

/*
  *@name: cmdValidateLoadingInstallment
  *@Purpose: Valida y ajusta cuotas del endoso de recargos/descuentos
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 11/05/2026
  *@Input: {policyId}
  *@Output: [{ resultado }]
*/

const n2 = (n) => Number(Number(n || 0).toFixed(2));

try {
  
  const change = context.change;
  if (!change) {
    return { ok: false, msg: "No se encontró el cambio", cuotas: JSON.stringify([]) };
  }

  const cuotasCambio = safeJsonArray(change?.jNewPayPlan);
  const cuotasPoliza = getPolicyInstallments(change.lifePolicyId);
  const cuotasBase = cuotasPoliza.length ? cuotasPoliza : cuotasCambio;

  if (!cuotasBase.length) {
    return { ok: false, msg: "No hay cuotas para validar", cuotas: JSON.stringify([]) };
  }

  const totalBill = n2(change?.Bill?.annualTotal ?? 0);
  const premiumBill = n2(change?.Bill?.anualPremium ?? 0);
  const taxBill = n2(change?.Bill?.tax ?? 0);

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
    cuotasDistribuye.forEach(x => {
      x.minimum = n2(x.minimum);
      x.expected = n2(x.minimum);
      x.dueAmount = n2(x.minimum);
      x.pendingAmount = n2(x.minimum);
    });
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

  const validation = validateDistribution(cuotasDistribuye, totalBill);
  if (!validation.ok) {
    return { ok: false, msg: validation.msg, cuotas: JSON.stringify([]) };
  }

  const nuevoTotal = n2(
    cuotasDistribuye.reduce((sum, x) => sum + (Number(x.minimum) || 0), 0)
  );

  if (change?.id > 0) {
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

        const saldoCuota = n2(prima + impuesto);
        q.minimum = n2(
          Number(q.payed || 0) + saldoCuota
        );

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
      q.PayPlanDetail = normalizePayPlanDetails(q);
    }

    totalActual = n2(totalActual + q.minimum);

    if (Number(q.payed || 0) <= 0.01 || Math.abs(n2(q.minimum) - n2(q.payed)) > 0.01) {
      adjustableIndexes.push(index);
    }
  });

  const diff = n2(totalBill - totalActual);
  if (Math.abs(diff) > 0.01 && adjustableIndexes.length > 0) {
    const target = normalized[adjustableIndexes[adjustableIndexes.length - 1]];
    target.minimum = n2(target.minimum + diff);
    target.expected = n2(target.minimum);
    target.dueAmount = n2(target.minimum);
    target.pendingAmount = n2(target.minimum);
    target.PayPlanDetail = normalizePayPlanDetails(target);
  }

  return normalized;
}

function normalizePayPlanDetails(payPlan) {
  const baseDetails = Array.isArray(payPlan?.PayPlanDetail) ? payPlan.PayPlanDetail : [];
  const normalized = baseDetails.map(detail => ({
    amount: n2(detail?.amount),
    concept: detail?.concept ?? "",
    detail: detail?.detail ?? "",
    order: Number(detail?.order ?? 0),
    paid: n2(detail?.paid ?? 0)
  }));

  if (!normalized.length) {
    return normalized;
  }

  const targetTotal = n2(payPlan?.minimum ?? 0);
  const currentTotal = n2(normalized.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  const diff = n2(targetTotal - currentTotal);

  if (Math.abs(diff) > 0.01) {
    normalized[normalized.length - 1].amount = n2(normalized[normalized.length - 1].amount + diff);
  }

  return normalized;
}

function validateDistribution(cuotas, totalBill) {
  const totalCuotas = n2((cuotas ?? []).reduce((sum, x) => sum + (Number(x.minimum) || 0), 0));
  const totalDetails = n2(
    (cuotas ?? []).reduce((sum, cuota) => {
      const detalleTotal = Array.isArray(cuota.PayPlanDetail)
        ? cuota.PayPlanDetail.reduce((s, d) => s + (Number(d.amount) || 0), 0)
        : 0;
      return sum + detalleTotal;
    }, 0)
  );

  if (Math.abs(totalCuotas - totalBill) > 0.01) {
    return { ok: false, msg: `Las cuotas no cuadran con el billing. Cuotas=${totalCuotas.toFixed(2)} Bill=${n2(totalBill).toFixed(2)}` };
  }

  if (Math.abs(totalDetails - totalCuotas) > 0.01) {
    return { ok: false, msg: `El detalle no cuadra con el maestro. Maestro=${totalCuotas.toFixed(2)} Detalle=${totalDetails.toFixed(2)}` };
  }

  for (const cuota of cuotas ?? []) {
    const detailTotal = Array.isArray(cuota.PayPlanDetail)
      ? cuota.PayPlanDetail.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
      : 0;

    if (Math.abs(n2(detailTotal) - n2(cuota.minimum)) > 0.01) {
      return {
        ok: false,
        msg: `La cuota #${cuota.numberInYear ?? cuota.id ?? 0} no cuadra con su detalle. Maestro=${n2(cuota.minimum).toFixed(2)} Detalle=${n2(detailTotal).toFixed(2)}`
      };
    }
  }

  return { ok: true, msg: "OK" };
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

function getPolicyInstallments(policyId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "PayPlan",
      filter: `lifepolicyId = ${policyId}`,
      fields: "id, lifePolicyId, concept, expected, minimum, payed, payedDate, dueDate, transferId, coveredUntil, allocationDate, contractYear, final, finalDate, numberInYear, allocationId, currency, cancellationDate, compensationDate, custom, created, penaltyInterest, normalDueDate, changeId"
    }
  });

  if (!LoadEntities.ok) {
    throw new Error(LoadEntities.msg);
  }

  return (LoadEntities.outData ?? []).map(cloneCuota);
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
