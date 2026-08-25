//block
//noreplace

/*
  *@name: cmdValidateCapitalInstallment
  *@Purpose: Valida y ajusta cuotas del endoso de cambio de capital
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 25/05/2026
  *@Input: {policyId}
  *@Output: [{ resultado }]
*/

const n2 = (n) => Number(Number(n || 0).toFixed(2));

try {
  
  const change = context.change;

  if(!change?.lifePolicyId){
    return { ok: false, msg: "Póliza no encontrada para construcción de cuotas", cuotas: null };
  }
  
  //doCmd({cmd: "GetPing", data: {change: JSON.stringify(change)}}); 
  const cuotasPago = getPayedInstallment(change.lifePolicyId);  
  let cuotas = change?.jNewPayPlan ? JSON.parse(change?.jNewPayPlan) : [];

  const cuotasPagoFinal = cuotasPago.map(x => ({
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
      changeId: x.changeId
  }));

  //Cuando el endoso no trae cuotas pagadas porque las haya borrado las agregamos para mantener consistencia.
  if(noHayCuotasPagadas(cuotas) && cuotasPagoFinal.length > 0){
     cuotas.push(...cuotasPagoFinal); 
  }

  // Las cuotas nuevas llegan con id = 0. Si existen cuotas pendientes,
  // se eliminan para que su importe sea absorbido por la redistribución.
  cuotas = normalizarCuotasNuevas(cuotas);

  const totalMinimum = Number(
    cuotas.reduce((sum, x) => sum + (Number(x.minimum - (x.payed || 0)) || 0), 0).toFixed(2)
  );
  const totalCalculado = n2(totalMinimum);
  const totalBill = change?.Bill?.annualTotal ?? 0
  const premiumBill = change?.Bill?.anualPremium ?? 0
  const taxBill = change?.Bill?.tax ?? 0
  let cuotasDistribuye = [];
  
  //Ajustamos las cuotas pendientes.
  if(totalCalculado != (premiumBill + taxBill)){
    log("Validando saldo diferente en cuotas");
    
    cuotasDistribuye = distribuirMontoEnCuotas(cuotas, premiumBill, taxBill);    
    //return cuotasDistribuye
    cuotasDistribuye.forEach(x => {
      x.minimum = n2(x.minimum);
      x.expected = n2(x.minimum);      
      x.dueAmount = n2(x.minimum);
      x.pendingAmount = n2(x.minimum);
      //x.concept = x.concept + " (Loadings)";
    });

    if(change?.id > 0) {
      doCmd({cmd: "SetField", data: { entity: "Change", entityId: change.id, fieldValue: `jNewPayPlan='${ JSON.stringify(cuotas) }'`, raw: true }})
      if(!SetField.ok)
        throw new Error(SetField.msg);
    }
        
  }
  return { ok: true, msg: "Distribuido", cuotas: JSON.stringify(cuotasDistribuye), cuotasDet: cuotasDistribuye, calculado: totalCalculado, totalEndoso: totalBill, cuotasOld: cuotas };

} catch (error) {
  return { ok: false, msg: error.toString(), cuotas: JSON.stringify([]) };
}

function distribuirMontoEnCuotas(cuotas, montoPrima, montoImpuesto) {

    // cuotas pendientes
    const pendientes = cuotas.filter(q => !q.payed || q.payed <= 0);

    if (!pendientes.length) {
        log("Ninguna cuota pendiente");
        return cuotas;
    }

    // total plan
    const totalPlan = n2(montoPrima + montoImpuesto);

    // total pagado
    const totalPagado = n2(
        cuotas.reduce((acc, q) =>
            acc + Number(q.payed || 0), 0)
    );

    // proporciones
    const proporcionPrima =
        totalPlan != 0
            ? montoPrima / totalPlan
            : 0;

    const proporcionImpuesto =
        totalPlan != 0
            ? montoImpuesto / totalPlan
            : 0;

    // estimado pagado
    const primaPagada = n2(
        totalPagado * proporcionPrima
    );

    const impuestoPagado = n2(
        totalPagado * proporcionImpuesto
    );

    // saldo REAL (puede ser negativo)
    const saldoPrima = n2(montoPrima - primaPagada);
    const saldoImpuesto = n2(montoImpuesto - impuestoPagado);

    log(`saldoPrima: ${saldoPrima}`);
    log(`saldoImpuesto: ${saldoImpuesto}`);

    const cantidad = pendientes.length;

    const primaBase = n2(saldoPrima / cantidad);
    const impuestoBase = n2(saldoImpuesto / cantidad);

    let acumuladoPrima = 0;
    let acumuladoImpuesto = 0;

    pendientes.forEach((q, index) => {

        let prima;
        let impuesto;

        // última cuota absorbe diferencia
        if (index === cantidad - 1) {

            prima = n2(saldoPrima - acumuladoPrima);
            impuesto = n2(saldoImpuesto - acumuladoImpuesto);

        } else {

            prima = primaBase;
            impuesto = impuestoBase;

            acumuladoPrima = n2(acumuladoPrima + prima);
            acumuladoImpuesto = n2(acumuladoImpuesto + impuesto);
        }

        // total cuota (puede ser negativo)
        q.minimum = n2(prima + impuesto);

        q.PayPlanDetail = [
            {
                amount: prima,
                concept: `Detalle de cuota #${q.numberInYear || (index + 1)}`,
                detail: "Prima Cobertura",
                order: 1,
                paid: 0,
                normalDueDate: q.normalDueDate || q.dueDate
            },
            {
                amount: impuesto,
                concept: `Detalle de cuota #${q.numberInYear || (index + 1)}`,
                detail: "Impuesto de Seguros",
                order: 2,
                paid: 0,
                normalDueDate: q.normalDueDate || q.dueDate
            }
        ];
    });

    return cuotas;
}

function normalizarCuotasNuevas(cuotas) {
    const nuevas = cuotas.filter(q => Number(q && q.id || 0) === 0);

    if (!nuevas.length) {
        return cuotas;
    }

    const pendientes = cuotas.filter(q =>
        Number(q && q.id || 0) !== 0 && (!q.payed || Number(q.payed) <= 0)
    );

    if (pendientes.length > 0) {
        return cuotas.filter(q => Number(q && q.id || 0) !== 0);
    }

    // Cuando la cuota nueva es la única del plan, se conserva como primera cuota.
    if (cuotas.length === 1) {
        const cuotaNueva = cuotas[0];
        cuotaNueva.numberInYear = 1;
        cuotaNueva.contractYear = 1;
        return cuotas;
    }

    // Sin cuotas pendientes no existe una cuota destino para redistribuirla.
    return cuotas.filter(q => Number(q && q.id || 0) !== 0);
}

function getPayedInstallment(policyId) {
  doCmd({cmd: "LoadEntities", data: { entity: "PayPlan", filter: `lifepolicyId = ${policyId} AND payed <> 0` }});
  
  if (!LoadEntities.ok)
    throw new Error(LoadEntities.msg);
  
  return LoadEntities.outData ?? [];
}

function noHayCuotasPagadas(cuotas) {
  const resultado =
    cuotas.every(q => !q.payed || q.payed <= 0);
  return resultado;
}

/*
{"id":0,"status":0,"lifePolicyId":3295,"processId":null,"executionDate":"0001-01-01T00:00:00","contractYear":1,"anniversary":0,"creationDate":"2026-05-21T00:00:00Z","effectiveDate":"2026-05-21T20:25:29.785Z","code":null,"note":null,"jDetail":"{\n \"changeDate\": \"2026-05-21\",\n \"policyStart\": \"2026-05-21\",\n \"policyEnd\": \"2027-05-21\",\n \"policyDuration\": 365,\n \"remainingDays\": 365,\n \"prorate\": 1.0,\n \"oldAnnualPremium\": 63.0000,\n \"newAnnualPremium\": 56.7,\n \"annualPremiumDif\": -6.3000,\n \"changeCost\": -6.30,\n \"oldCoverages\": 60.0000,\n \"newCoverages\": 54.0,\n \"coveragesDif\": -6.0000,\n \"coveragesCost\": -6.00,\n \"Coverages\": [\n {\n \"id\": 8112,\n \"code\": \"1\",\n \"oldPremium\": 42.0000,\n \"newPremium\": 37.8,\n \"premiumDif\": -4.2000,\n \"premiumCost\": -4.20\n },\n {\n \"id\": 8113,\n \"code\": \"3\",\n \"oldPremium\": 18.0000,\n \"newPremium\": 16.2,\n \"premiumDif\": -1.8000,\n \"premiumCost\": -1.80\n }\n ],\n \"amountPaid\": 0.0000\n}","jOldCoverages":null,"jNewCoverages":"[{\"priority\":0,\"preserveValues\":false,\"id\":8112,\"lifePolicyId\":3295,\"code\":\"1\",\"name\":\"Incendio/Rayo/Explosión\",\"description\":\"Incendio/Rayo/Explosión\",\"basic\":true,\"periodicity\":0,\"limit\":40000.0,\"startLimit\":40000.0,\"deductible\":0.0,\"number\":1,\"commercialName\":\"Incendio/Rayo/Explosión\",\"solvency2Code\":null,\"ofnCode\":0,\"ofnGroup\":0,\"internalBonus\":false,\"appliesTo\":\"INS\",\"basePremium\":42.0,\"startBasePremium\":42.0,\"loading\":-10.0,\"loadingInsuredSum\":0.0,\"extraPremium\":-4.2,\"premium\":37.8,\"startPremium\":37.8,\"internalPremium\":0.0,\"parent\":null,\"start\":\"2026-05-21T17:44:50.189Z\",\"end\":\"2027-05-21T17:44:50.189Z\",\"ignoreIndexation\":false,\"hasMaturity\":false,\"reStatus\":0,\"manualPremium\":false,\"manualLimit\":false,\"isInternal\":false,\"baseLimit\":0.0,\"limitFactor\":null,\"reinsuranceCode\":null,\"distributionMode\":null,\"parentPercentage\":0.0,\"Payouts\":null,\"Loadings\":[{\"id\":1896,\"lifeCoverageId\":8112,\"loading\":0.0,\"riskType\":\"OCCUPATIONAL\",\"notes\":null,\"start\":\"2025-05-05T17:44:50.189\",\"end\":\"2026-05-05T17:44:50.189\",\"duration\":1,\"manual\":true,\"insuredSumBased\":false,\"perMille\":false,\"insuredId\":null,\"Insured\":null,\"RiskType\":null},{\"id\":0,\"lifeCoverageId\":0,\"loading\":-10.0,\"riskType\":null,\"notes\":null,\"start\":\"2026-05-21T23:44:50.189Z\",\"end\":\"2027-05-21T17:44:50.189\",\"duration\":null,\"manual\":true,\"insuredSumBased\":false,\"perMille\":false,\"insuredId\":null,\"Insured\":null,\"RiskType\":null}],\"Claims\":null,\"Benefits\":[],\"coContractId\":null,\"CoContract\":null,\"jCustom\":null,\"jPremiumDetail\":null,\"mandatory\":false},{\"priority\":0,\"preserveValues\":false,\"id\":8113,\"lifePolicyId\":3295,\"code\":\"3\",\"name\":\"Extensión de Cobertura Catastrófica\",\"description\":\"Extensión de Cobertura Catastrófica\",\"basic\":false,\"periodicity\":0,\"limit\":40000.0,\"startLimit\":40000.0,\"deductible\":800.0,\"number\":2,\"commercialName\":\"Extensión de Cobertura Catastrófica\",\"solvency2Code\":null,\"ofnCode\":0,\"ofnGroup\":0,\"internalBonus\":false,\"appliesTo\":\"INS\",\"basePremium\":18.0,\"startBasePremium\":18.0,\"loading\":-10.0,\"loadingInsuredSum\":0.0,\"extraPremium\":-1.8,\"premium\":16.2,\"startPremium\":16.2,\"internalPremium\":0.0,\"parent\":null,\"start\":\"2026-05-21T17:44:50.189Z\",\"end\":\"2027-05-21T17:44:50.189Z\",\"ignoreIndexation\":false,\"hasMaturity\":false,\"reStatus\":0,\"manualPremium\":false,\"manualLimit\":false,\"isInternal\":false,\"baseLimit\":0.0,\"limitFactor\":null,\"reinsuranceCode\":null,\"distributionMode\":null,\"parentPercentage\":0.0,\"Payouts\":null,\"Loadings\":[{\"id\":1897,\"lifeCoverageId\":8113,\"loading\":0.0,\"riskType\":\"OCCUPATIONAL\",\"notes\":null,\"start\":\"2025-05-05T17:44:50.189\",\"end\":\"2026-05-05T17:44:50.189\",\"duration\":1,\"manual\":true,\"insuredSumBased\":false,\"perMille\":false,\"insuredId\":null,\"Insured\":null,\"RiskType\":null},{\"id\":0,\"lifeCoverageId\":0,\"loading\":-10.0,\"riskType\":null,\"notes\":null,\"start\":\"2026-05-21T23:44:50.189Z\",\"end\":\"2027-05-21T17:44:50.189\",\"duration\":null,\"manual\":true,\"insuredSumBased\":false,\"perMille\":false,\"insuredId\":null,\"Insured\":null,\"RiskType\":null}],\"Claims\":null,\"Benefits\":[],\"coContractId\":null,\"CoContract\":null,\"jCustom\":null,\"jPremiumDetail\":null,\"mandatory\":false}]","jAmendments":null,"jNewPayPlan":"[{\"id\":32268,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":1,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.6700,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-05-21T17:44:50.189\",\"coveredUntil\":\"2026-06-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6193539\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.6700,\"pendingAmount\":4.6700,\"dueDays\":0,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-05-21T17:44:50.189\"},{\"id\":32265,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":2,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-06-21T17:44:50.189\",\"coveredUntil\":\"2026-07-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6193851\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-30,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-06-21T17:44:50.189\"},{\"id\":32267,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":3,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-07-21T17:44:50.189\",\"coveredUntil\":\"2026-08-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6193929\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-60,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-07-21T17:44:50.189\"},{\"id\":32266,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":4,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-08-21T17:44:50.189\",\"coveredUntil\":\"2026-09-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6194001\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-91,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-08-21T17:44:50.189\"},{\"id\":32269,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":5,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-09-21T17:44:50.189\",\"coveredUntil\":\"2026-10-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6194071\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-122,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-09-21T17:44:50.189\"},{\"id\":32264,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":6,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-10-21T17:44:50.189\",\"coveredUntil\":\"2026-11-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6194168\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-152,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-10-21T17:44:50.189\"},{\"id\":32263,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":7,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-11-21T17:44:50.189\",\"coveredUntil\":\"2026-12-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6194237\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-183,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-11-21T17:44:50.189\"},{\"id\":32262,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":8,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2026-12-21T17:44:50.189\",\"coveredUntil\":\"2027-01-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6194306\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-213,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2026-12-21T17:44:50.189\"},{\"id\":32261,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":9,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2027-01-21T17:44:50.189\",\"coveredUntil\":\"2027-02-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6194378\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-244,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2027-01-21T17:44:50.189\"},{\"id\":32260,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":10,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2027-02-21T17:44:50.189\",\"coveredUntil\":\"2027-03-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6194473\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-275,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2027-02-21T17:44:50.189\"},{\"id\":32259,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":11,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2027-03-21T17:44:50.189\",\"coveredUntil\":\"2027-04-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6194543\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-303,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2027-03-21T17:44:50.189\"},{\"id\":32258,\"lifePolicyId\":3295,\"transferId\":null,\"numberInYear\":12,\"contractYear\":1,\"concept\":\"Prima\",\"expected\":4.73,\"minimum\":4.73,\"currency\":\"USD\",\"payed\":0.0000,\"final\":false,\"finalDate\":null,\"allocationDate\":null,\"payedDate\":null,\"dueDate\":\"2027-04-21T17:44:50.189\",\"coveredUntil\":\"2027-05-21T17:44:50.189\",\"changeId\":null,\"Change\":null,\"penaltyInterest\":0.0000,\"created\":\"2026-05-21T19:52:22.6194612\",\"Transfer\":null,\"allocationId\":null,\"cancellationDate\":null,\"compensationDate\":null,\"dueAmount\":4.73,\"pendingAmount\":4.7300,\"dueDays\":-334,\"pending\":true,\"custom\":false,\"PayPlanDetail\":null,\"normalDueDate\":\"2027-04-21T17:44:50.189\"}]","changeIdToBeAmended":null,"jSnapshot":null,"informative":false,"Bill":{"id":0,"changeId":null,"status":0,"type":null,"coverages":54,"surcharges":0,"discounts":0,"anualPremium":54,"tax":2.7,"anualTotal":56.7,"annualTotal":56.7,"receiptTypeCode":null,"ReceiptType":null,"fiscalNumber":null,"fee":0,"installment":4.73,"paymentMethod":"PRO","periodicity":"m","jFees":"[]","jTaxes":"[{\"id\":-2147482489,\"taxSchemeId\":3,\"action\":\"ChangeLoading\",\"lifePolicyId\":3295,\"changeId\":null,\"taxName\":\"Impuesto de Seguros\",\"amount\":2.7,\"currency\":\"USD\",\"created\":\"2026-05-21T20:28:23.8746088Z\",\"liquidationId\":null,\"disabled\":true,\"claimPaymentId\":null,\"ClaimPayment\":null,\"paymentTaxId\":null,\"PaymentTax\":null,\"anniversaryId\":null}]"},"BillDiff":{"id":0,"changeId":0,"coverages":-6,"surcharges":0,"discounts":0,"annualPremium":-6,"tax":-0.3,"annualTotal":-6.3,"fee":0,"installment":-0.52,"jFees":"[]","jTaxes":"[{\"id\":0,\"taxSchemeId\":0,\"action\":\"LoadingChange\",\"lifePolicyId\":3295,\"changeId\":null,\"taxName\":\"Impuesto de Seguros\",\"amount\":-0.3000,\"currency\":\"USD\",\"created\":\"2026-05-21T20:28:23.9631757Z\",\"liquidationId\":null,\"disabled\":false,\"claimPaymentId\":null,\"ClaimPayment\":null,\"paymentTaxId\":null,\"PaymentTax\":null,\"anniversaryId\":null}]"},"BillUnique":null,"Discriminator":null,"cancellationBillId":null,"CancellationBill":null,"Process":null,"Surcharges":null,"Taxes":null,"entityState":"","processState":"","jAdditional":""}
*/
