//block
//noreplace

/*
 * @name: cmdGetCancellationPremium
 * @Purpose: Build a movement-by-movement cancellation premium breakdown.
 * @Autor: Michael Delgado
 * @Email: michael.delgado@axxis-systems.com
 * @Created: 21/05/2026
 * @Input: { pol, changeDate }
 * @Output: Array
 */

try {

  //doCmd({cmd: "GetPing", data: { contexto: JSON.stringify(context) } });

  const input = normalizeInput(context);
  const policy = loadPolicy(input.pol);
  const movementsData = loadMovements(policy.id);
  const payPlans = loadPolicyPayPlan(policy.id);
  const cancellationDate = input.changeDate;

  const movements = [];

  const anniversaryMovement = buildAnniversaryMovement(policy, movementsData.anniversaries, cancellationDate);
  if (anniversaryMovement) {
    movements.push(anniversaryMovement);
  }

  const endorsementMovements = buildEndorsementMovements(
    policy,
    movementsData.changes,
    cancellationDate,
    anniversaryMovement?.contractYear
  );
  movements.push(...endorsementMovements);

  const primasCanceladas = sumMovementValues(movements, "primaNoDevengada");
  const impuestosCancelados = sumMovementValues(movements, "impuestoNoDevengado");
  const totalCancelado = round2(primasCanceladas + impuestosCancelados);
  const totalPagado = getPaidAmount(payPlans);
  const issuanceSource = getOriginalIssuanceSource(movementsData.anniversaries, policy);

  const primaActual = round2(toNumber(policy?.annualPremium ?? policy?.anualPremium ?? 0));
  const impuestoActual = round2(toNumber(policy?.tax ?? 0));
  const totalActual = round2(toNumber(policy?.annualTotal ?? policy?.anualTotal ?? 0));
  const paidAmounts = calculatePaidByIssuanceProportion(
    totalPagado,
    issuanceSource,
    primaActual,
    totalActual
  );

  const primaFinal = round2(primaActual - primasCanceladas - paidAmounts.prima);
  const impuestoFinal = round2(impuestoActual - impuestosCancelados - paidAmounts.impuesto);
  const totalFinal = round2(totalActual - totalCancelado - totalPagado);

  return {
    prima: primaFinal,
    impuesto: impuestoFinal,
    total: totalFinal,
    primaCancelada: round2(primasCanceladas),
    impuestoCancelado: round2(impuestosCancelados),
    totalCancelado: totalCancelado,
    primaNoDevengada: round2(primasCanceladas),
    impuestoNoDevengado: round2(impuestosCancelados),
    pagado: totalPagado,
    pagadoPrima: paidAmounts.prima,
    pagadoImpuesto: paidAmounts.impuesto,
    primaActual: primaActual,
    impuestoActual: impuestoActual,
    totalActual: totalActual,
    movimientos: movements,
    cancellationDate: cancellationDate
  };
} catch (error) {
  throw new Error(error?.toString?.() || String(error));
}

function normalizeInput(source) {
  const pol = source?.pol ?? source?.policy ?? source?._pol ?? null;
  const policyId = Number(pol?.id ?? pol?.lifePolicyId ?? 0);

  if (!Number.isFinite(policyId) || policyId <= 0) {
    throw new Error("La poliza es requerida para calcular la cancelacion");
  }

  return {
    pol,
    policyId,
    totalDays: toNumber(source?.totalDays ?? 0),
    pastDays: Math.max(toInteger(source?.pastDays ?? 0), 0),
    changeDate: normalizeChangeDate(source?.changeDate ?? source?.changeDateTime ?? source?.effectiveDate)
  };
}

function normalizeChangeDate(value) {
  const raw = normalizeText(value);

  if (!raw) {
    throw new Error("La fecha de cancelacion es requerida");
  }

  return raw;
}

function loadPolicy(pol) {
  const policyId = Number(pol?.id ?? pol?.lifePolicyId ?? 0);
  
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "LifePolicy",
      fields: "id, start, [end], anualPremium, tax, anualTotal, currency",
      filter: `id = ${policyId}`,
      noTracking: true
    }
  });

  if (!LoadEntity?.ok) {
    throw new Error(LoadEntity?.msg || "No fue posible recuperar la poliza");
  }

  const policy = LoadEntity?.outData ?? null;
  if (!policy) {
    throw new Error("No se encontro la poliza");
  }

  return {
    ...policy,
    annualPremium: policy?.annualPremium ?? policy?.anualPremium ?? 0,
    annualTotal: policy?.annualTotal ?? policy?.anualTotal ?? 0
  };
}

function loadMovements(policyId) {
  const anniversaries = loadAnniversaries(policyId);
  const changes = loadChanges(policyId).map(change => ({
    ...change,
    BillDiff: loadBillDiff(change?.id)
  }));

  return { anniversaries, changes };
}

function loadPolicyPayPlan(policyId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "PayPlan",
      fields: "id, lifePolicyId, contractYear, minimum, payed, payedDate, cancellationDate",
      filter: `lifePolicyId = ${policyId}`,
      noTracking: true
    }
  });

  if (!LoadEntities?.ok) {
    throw new Error(LoadEntities?.msg || "No fue posible recuperar los pagos de la poliza");
  }

  return asArray(LoadEntities?.outData);
}

function loadAnniversaries(policyId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "Anniversary",
      fields: "id, lifePolicyId, contractYear, entityState, executionDate, start, anniversary, jSnapshot",
      filter: `lifePolicyId = ${policyId}`,
      noTracking: true
    }
  });

  if (!LoadEntities?.ok) {
    throw new Error(LoadEntities?.msg || "No fue posible recuperar los aniversarios");
  }

  return asArray(LoadEntities?.outData);
}

function loadChanges(policyId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "Change",
      fields: "id, lifePolicyId, Discriminator, executionDate, effectiveDate, creationDate, jDetail, contractYear",
      filter: `lifePolicyId = ${policyId} AND status = 1`,
      noTracking: true
    }
  });

  if (!LoadEntities?.ok) {
    throw new Error(LoadEntities?.msg || "No fue posible recuperar los endosos");
  }

  return asArray(LoadEntities?.outData);
}

function loadBillDiff(changeId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "BillDiff",
      fields: "id, changeId, coverages, surcharges, discounts, annualPremium, tax, annualTotal, fee, installment, jFees, jTaxes",
      filter: `changeId = ${changeId}`,
      noTracking: true
    }
  });

  if (!LoadEntities?.ok) {
    return null;
  }

  return asArray(LoadEntities?.outData)[0] ?? null;
}

function buildAnniversaryMovement(policy, anniversaries, cancellationDate) {
  const anniversary = anniversaries
    .filter(item => isExecuted(item))
    .sort((a, b) => compareDatesDesc(a?.executionDate ?? a?.anniversary, b?.executionDate ?? b?.anniversary))[0]
    ?? anniversaries[0]
    ?? null;

  const source = getFinancialSource(anniversary?.jsnapshot ?? anniversary ?? policy);

  const start = anniversary?.start ?? policy?.start;
  const end = anniversary?.anniversary ?? policy?.end;

  if (!start || !end) {
    return null;
  }

  return buildMovement({
    movementType: "ANIVERSARIO",
    movementName: "Prima original",
    source,
    start,
    end,
    cancellationDate,
    contractYear: anniversary?.contractYear ?? null,
    referenceId: anniversary?.id ?? policy?.id ?? 0
  });
}

function buildEndorsementMovements(policy, changes, cancellationDate, contractYear) {
  const rows = asArray(changes)
    .filter(change => Number(change?.id ?? 0) > 0)
    .filter(change => contractYear === null || contractYear === undefined || Number(change?.contractYear ?? 0) === Number(contractYear))
    .sort((a, b) => compareDatesAsc(a?.executionDate ?? a?.effectiveDate, b?.executionDate ?? b?.effectiveDate));

  return rows
    .map(change => {
      const billDiff = getFinancialSource(change?.BillDiff ?? change?.billDiff ?? change?.Bill ?? change?.bill ?? change?.jDetail);

      if (!billDiff || !hasAnyMoneyValue(billDiff)) {
        return null;
      }

      const start = change?.effectiveDate ?? change?.creationDate ?? policy?.start;
      const end = policy?.end;

      if (!start || !end) {
        return null;
      }

      return buildMovement({
        movementType: "ENDOSO",
        movementName: change?.Discriminator ?? "Endoso",
        source: billDiff,
        start,
        end,
        cancellationDate,
        contractYear: change?.contractYear ?? contractYear ?? null,
        referenceId: change?.id ?? 0
      });
    })
    .filter(Boolean);
}

function buildMovement({ movementType, movementName, source, start, end, cancellationDate, contractYear, referenceId }) {
  const movementStart = toDateOnly(start);
  const movementEnd = toDateOnly(end);
  const cancelDate = toDateOnly(cancellationDate);

  const totalDays = Math.max(daysBetween(movementStart, movementEnd), 0);
  const pastDays = clamp(daysBetween(movementStart, cancelDate), 0, totalDays);
  const daysNotEarned = Math.max(totalDays - pastDays, 0);
  const prorrata = totalDays === 0 ? 0 : round6(daysNotEarned / totalDays);

  const prima = round2(
    firstMoneyValue(source, ["annualPremium", "anualPremium", "premium", "coverages", "coveragesCost", "premiumDif", "changeCost", "amount"])
  );
  const impuesto = round2(
    firstMoneyValue(source, ["tax", "impuesto", "taxDif", "taxCost"])
  );

  const primaDevengada = round2(prima * (totalDays === 0 ? 0 : (pastDays / totalDays)));
  const impuestoDevengado = round2(impuesto * (totalDays === 0 ? 0 : (pastDays / totalDays)));
  const primaNoDevengada = round2(prima * prorrata);
  const impuestoNoDevengado = round2(impuesto * prorrata);
  const totalNoDevengado = round2(primaNoDevengada + impuestoNoDevengado);
  const totalDevengado = round2(primaDevengada + impuestoDevengado);

  return {
    movimiento: movementType,
    referencia: movementName,
    contractYear: contractYear ?? null,
    referenciaId: referenceId,
    prima,
    impuesto,
    vigenciaInicio: formatDateTime(start),
    vigenciaFin: formatDateTime(end),
    totalDays,
    pastDays,
    daysNotEarned,
    diasDevengados: pastDays,
    diasTotales: totalDays,
    diasNoDevengados: daysNotEarned,
    prorrata,
    primaDevengada,
    impuestoDevengado,
    primaNoDevengada,
    impuestoNoDevengado,
    totalDevengado,
    totalNoDevengado
  };
}

function getFinancialSource(source) {
  const candidates = [
    source,
    source?.Bill,
    source?.bill,
    parseJson(source?.jSnapshot),
    parseJson(source?.jBill),
    parseJson(source?.jData)
  ];

  for (const candidate of candidates) {
    if (candidate && hasAnyMoneyValue(candidate)) {
      return candidate;
    }
  }

  return source || null;
}

function getOriginalIssuanceSource(anniversaries, policy) {
  const issuance = asArray(anniversaries)
    .filter(item => isExecuted(item))
    .sort((a, b) => compareDatesAsc(a?.executionDate ?? a?.start, b?.executionDate ?? b?.start))[0]
    || asArray(anniversaries)[0]
    || null;

  return getFinancialSource(issuance || policy) || policy;
}

function calculatePaidByIssuanceProportion(totalPaid, issuanceSource, policyPremium, policyTotal) {
  const issuancePremium = firstMoneyValue(issuanceSource, ["annualPremium", "anualPremium", "premium"]);
  const issuanceTax = firstMoneyValue(issuanceSource, ["tax", "impuesto"]);
  const issuanceTotal = firstMoneyValue(issuanceSource, ["annualTotal", "anualTotal", "total"])
    || round2(issuancePremium + issuanceTax);
  const paid = round2(totalPaid);

  if (Math.abs(issuanceTotal) <= 0.01) {
    const fallbackTotal = round2(policyTotal);
    if (Math.abs(fallbackTotal) <= 0.01) {
      return { prima: paid, impuesto: 0 };
    }

    const fallbackPremium = round2(paid * (policyPremium / fallbackTotal));
    return {
      prima: fallbackPremium,
      impuesto: round2(paid - fallbackPremium)
    };
  }

  return {
    prima: round2(paid * (issuancePremium / issuanceTotal)),
    impuesto: round2(paid * (issuanceTax / issuanceTotal))
  };
}

function hasAnyMoneyValue(source) {
  if (!source || typeof source !== "object") {
    return false;
  }

  const keys = ["annualPremium", "anualPremium", "premium", "coverages", "coveragesCost", "tax", "amount", "changeCost", "taxCost", "premiumDif", "taxDif"];
  return keys.some(key => isFiniteNumber(source?.[key]));
}

function firstMoneyValue(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (isFiniteNumber(value)) {
      return toNumber(value);
    }
  }

  return 0;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function isExecuted(item) {
  return normalizeText(item?.entityState).toUpperCase() === "EXECUTED";
}

function compareDatesAsc(a, b) {
  return toMillis(a) - toMillis(b);
}

function compareDatesDesc(a, b) {
  return toMillis(b) - toMillis(a);
}

function toMillis(value) {
  const date = parseDateOnly(value);
  return date ? Date.UTC(date.year, date.month - 1, date.day) : 0;
}

function daysBetween(start, end) {
  const s = parseDateOnly(start);
  const e = parseDateOnly(end);

  if (!s || !e) {
    return 0;
  }

  const startUtc = Date.UTC(s.year, s.month - 1, s.day);
  const endUtc = Date.UTC(e.year, e.month - 1, e.day);

  return Math.floor((endUtc - startUtc) / 86400000);
}

function parseDateOnly(value) {
  const raw = normalizeText(value);
  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw) || /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.\d+)?Z$/i.test(raw)) {
    return {
      year: Number(raw.substring(0, 4)),
      month: Number(raw.substring(5, 7)),
      day: Number(raw.substring(8, 10))
    };
  }

  const date = toPanamaDate(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}

function toDateOnly(value) {
  const parts = parseDateOnly(value);
  if (!parts) {
    return "";
  }

  return `${pad2(parts.year)}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function formatDateTime(value) {
  const raw = normalizeText(value);
  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw} 00:00:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.\d+)?Z$/i.test(raw)) {
    return `${raw.substring(0, 10)} 00:00:00`;
  }

  const date = toPanamaDate(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function addDaysToDate(value, days) {
  const date = parseDateOnly(value);
  if (!date) {
    return "";
  }

  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  utc.setUTCDate(utc.getUTCDate() + toInteger(days));

  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
}

function parseJson(value) {
  try {
    if (!value) {
      return null;
    }

    if (typeof value === "object") {
      return value;
    }

    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function toPanamaDate(value) {
  const raw = normalizeText(value);
  if (!raw) {
    return new Date(NaN);
  }

  const hasTimezone = /z$/i.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw);
  const utcValue = hasTimezone ? raw : `${raw}Z`;
  const date = new Date(utcValue);

  if (Number.isNaN(date.getTime())) {
    return date;
  }

  return new Date(date.getTime() - (5 * 60 * 60 * 1000));
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [value];
}

function clamp(value, min, max) {
  return Math.min(Math.max(toInteger(value), min), max);
}

function isFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric);
}

function toNumber(value) {
  return Number(Number(value ?? 0).toFixed(6));
}

function toInteger(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
}

function round2(value) {
  return Number(Number(value ?? 0).toFixed(2));
}

function round6(value) {
  return Number(Number(value ?? 0).toFixed(6));
}

function pad2(value) {
  return String(value ?? 0).padStart(2, "0");
}

function sumMovementValues(rows, key) {
  return asArray(rows).reduce((sum, row) => sum + Number(row?.[key] ?? 0), 0);
}

function getPaidAmount(payPlans) {
  return round2(asArray(payPlans)
    .reduce((sum, item) => sum + toNumber(item?.payed ?? 0), 0));
}

/*
test:
pol:
  id: 3440

totalDays: 365
pastDays: 190
changeDate: "2026-06-01"
 */
