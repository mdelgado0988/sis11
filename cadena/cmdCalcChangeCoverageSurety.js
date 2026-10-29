//block
//noreplace
/*
 * cmdCalcChangeCoverageSurety (AXX-299 / GLOB-1201)
 * Pestania 1 del endoso de extension/reduccion de vigencia de Fianzas.
 * Calcula el delta de prima por prorrata, recalcula dependientes y obtiene
 * impuestos/gastos/total del motor nativo (cotizacion de ChangeCoverage).
 * NO persiste: barre el residuo fiscal deshabilitado que deja la cotizacion nativa.
 * context: {policyId, coverageCode, newEnd, surcharge, discount}
 */
const day = 86400000;
const money = function (v) { return Number(Number(v).toFixed(2)); };
const txt = function (v) { return String(v == null ? '' : v).trim(); };
const up = function (v) { return txt(v).toUpperCase(); };
const iso = function (v) { return new Date(v).toISOString().slice(0, 23); };
const errs = [];

const policyId = Number(context.policyId || 0);
const selCode = txt(context.coverageCode);
const rawNewEnd = txt(context.newEnd);
const rawEffectiveDate = txt(context.effectiveDate);
if (!policyId) errs.push('Falta la poliza');
if (!selCode) errs.push('Falta la cobertura a endosar');
if (!rawNewEnd) errs.push('Falta la nueva fecha final');
if (errs.length) throw errs.join(' | ');

function amount(v, label) {
  if (v == null || v === '') return 0;
  const n = Number(v);
  if (!isFinite(n) || n < 0) throw label + ' debe ser un importe no negativo';
  return money(n);
}
const surcharge = amount(context.surcharge, 'Recargo');
const discount = amount(context.discount, 'Descuento');

function stamp(v, label) {
  const s = txt(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) throw '@Fecha invalida: ' + label;
  const rest = s.length > 10 ? s.slice(10) : 'T00:00:00';
  const body = s.slice(0, 10) + (rest.charAt(0) === 'T' ? rest : 'T00:00:00');
  const t = Date.parse(body.charAt(body.length - 1) === 'Z' ? body : body + 'Z');
  if (!isFinite(t)) throw '@Fecha invalida: ' + label;
  return t;
}

const yearsFromCoverageDays = function (days) {
  const duration = Number(days);
  if (!Number.isInteger(duration) || duration <= 0) return 0;
  if (duration % 365 === 0) return duration / 365;
  if (duration % 366 === 0) return duration / 366;
  return 0;
};

const addCoverageDuration = function (timestamp, days) {
  const duration = Number(days);
  if (!isFinite(timestamp) || !Number.isFinite(duration)) return NaN;
  const years = yearsFromCoverageDays(duration);
  if (!years) return timestamp + duration * day;

  // GLOBUAT-392: 365/366 y sus multiplos representan anos calendario.
  // El valor configurado de dias se conserva; solo cambia el calculo de fecha.
  const result = new Date(timestamp);
  const originalMonth = result.getUTCMonth();
  const originalDay = result.getUTCDate();
  result.setUTCFullYear(result.getUTCFullYear() + years);

  // Evita que un aniversario del 29/02 se desplace a marzo en un ano no bisiesto.
  if (originalMonth === 1 && originalDay === 29 && result.getUTCMonth() !== 1) {
    result.setUTCMonth(1, 28);
  }
  return result.getTime();
};

// ---------- barrido del residuo fiscal que dejaron cotizaciones anteriores ----------
const staleFilter = 'lifePolicyId=' + policyId + " AND action='ChangeCoverage' AND changeId IS NULL AND disabled=1";
// lectura por proyeccion: un Repo GET deja la fila trackeada y el DELETE posterior no puede adjuntarla
doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT id FROM TaxGenerated WHERE ' + staleFilter } });
const stale = DoQuery.outData || [];
const swept = [];
for (let i = 0; i < stale.length; i++) {
  doCmd({ cmd: 'RepoTaxGenerated', data: { operation: 'DELETE', entity: { id: Number(stale[i].id) } } });
  if (RepoTaxGenerated.ok) swept.push(Number(stale[i].id));
}

// ---------- poliza y configuracion de coberturas ----------
doCmd({ cmd: 'RepoLifePolicy', data: { operation: 'GET', filter: 'id=' + policyId, include: ['Coverages'], size: 1 } });
const policy = (RepoLifePolicy.outData || [])[0];
if (!policy) throw '@Poliza ' + policyId + ' no encontrada';
const covs = policy.Coverages || [];
if (!covs.length) throw '@La poliza no tiene coberturas';
const effectiveDateValue = rawEffectiveDate || txt(policy.activeDate) || txt(policy.start);
const effectiveDateTimestamp = stamp(effectiveDateValue, 'fecha efectiva del endoso');

doCmd({ cmd: 'GetFullTable', data: { table: 'cfgCoberturaProductoReaFianza' } });
let table = GetFullTable.outData || [];
if (typeof table === 'string') table = JSON.parse(table);
const cfg = {};
for (let i = 1; i < table.length; i++) {
  const r = table[i];
  if (txt(r[1]) !== txt(policy.productCode)) continue;
  cfg[txt(r[3])] = { coverageCode: txt(r[3]), isCoverage: txt(r[5]), principal: txt(r[7]), parent: txt(r[8]) };
}

const isTechnicalCar = txt(policy.lob) === '96' && up(policy.productCode) === 'CAR';
const technicalCfg = {};
if (isTechnicalCar) {
  doCmd({ cmd: 'GetFullTable', data: { table: 'cfgCoberturaProductoReaTecnicos' } });
  let technicalTable = GetFullTable.outData || [];
  if (typeof technicalTable === 'string') technicalTable = JSON.parse(technicalTable);
  for (let i = 1; i < technicalTable.length; i++) {
    const r = technicalTable[i];
    if (up(r[1]) !== up(policy.productCode)) continue;
    technicalCfg[txt(r[3])] = { coverageCode: txt(r[3]), isCoverage: txt(r[5]), principal: txt(r[7]), parent: txt(r[8]) };
  }
}
const coverageCfg = isTechnicalCar ? technicalCfg : cfg;

const eligible = [];
for (let i = 0; i < covs.length; i++) {
  const c = txt(covs[i].code);
  const row = coverageCfg[c];
  if ((isTechnicalCar && (c === '20' || c === '23')) || c === '313' || (row && row.principal === '-1')) eligible.push(c);
}
if (eligible.indexOf(selCode) < 0) throw 'La cobertura ' + selCode + ' no es endosable en esta poliza. Elegibles: ' + (eligible.join(', ') || 'ninguna');
let howMany = 0;
for (let i = 0; i < covs.length; i++) { if (txt(covs[i].code) === selCode) howMany++; }
if (howMany !== 1) throw '@La cobertura ' + selCode + ' no es univoca en la poliza';

const jOld = JSON.parse(JSON.stringify(covs));
const jNew = JSON.parse(JSON.stringify(covs));

let target = null;
for (let i = 0; i < jNew.length; i++) { if (txt(jNew[i].code) === selCode) target = jNew[i]; }

const start = stamp(target.start, 'inicio vigente');
const oldEnd = stamp(target.end, 'fin vigente');
const newEnd = stamp(rawNewEnd.length <= 10 ? rawNewEnd + txt(target.end).slice(10) : rawNewEnd, 'nueva fecha final');
if (oldEnd <= start) throw '@La vigencia actual de la cobertura es invalida';
if (newEnd <= start) throw '@La nueva fecha final debe ser posterior al inicio de la cobertura (' + iso(start).slice(0, 10) + ')';
if (newEnd === oldEnd) throw '@La nueva fecha final debe ser distinta de la vigente (' + iso(oldEnd).slice(0, 10) + ')';

const durationDays = (oldEnd - start) / day;
const deltaDays = (newEnd - oldEnd) / day;
if (!isFinite(durationDays) || durationDays <= 0) {
  throw '@La cobertura ' + selCode + ' tiene una vigencia de cero dias o invalida; no se puede calcular la prorrata';
}
const direction = deltaDays > 0 ? 'EXTENSION' : 'REDUCCION';
const oldPremium = Number(target.premium == null ? Number(target.basePremium || 0) + Number(target.extraPremium || 0) : target.premium);
if (!isFinite(oldPremium) || oldPremium < 0) throw '@La prima vigente de la cobertura es invalida';
// Una cobertura con loading tiene dos componentes. Si la prima bruta se
// prorratea dentro de basePremium, ChangeCoverage vuelve a sumar el loading.
// Se prorratean base y extra por separado para que el snapshot cotizado sea
// consistente con la prima que finalmente se persiste.
const configuredBasePremium = Number(target.basePremium);
const configuredExtraPremium = Number(target.extraPremium);
const hasBasePremium = isFinite(configuredBasePremium) && configuredBasePremium >= 0;
const oldBasePremium = hasBasePremium
  ? configuredBasePremium
  : Math.max(0, oldPremium - (isFinite(configuredExtraPremium) ? configuredExtraPremium : 0));
const oldExtraPremium = isFinite(configuredExtraPremium)
  ? configuredExtraPremium
  : oldPremium - oldBasePremium;
const baseDelta = money(oldBasePremium / durationDays * deltaDays);
const extraDelta = money(oldExtraPremium / durationDays * deltaDays);
const proratedBasePremium = money(oldBasePremium + baseDelta);
const proratedExtraPremium = money(oldExtraPremium + extraDelta);
// 🔴 Los ajustes manuales entran en la prima de la cobertura ANTES de cotizar. Si se aplican
// sólo a la presentacion, el motor nativo calcula impuesto y total sin ellos y la ejecucion
// los pierde: es lo que reprobo la primera ronda de pruebas (defectos 1 y CA15).
const adjust = money(surcharge - discount);
const newBasePremium = money(proratedBasePremium + adjust);
const loadingRate = Number(target.loading);
const loadingMatchesExtra = isFinite(loadingRate)
  && Math.abs(oldExtraPremium - money(oldBasePremium * loadingRate / 100)) <= 0.01;
const newExtraPremium = loadingMatchesExtra
  ? money(newBasePremium * loadingRate / 100)
  : proratedExtraPremium;
const proratedPremium = money(proratedBasePremium + proratedExtraPremium);
const newPremium = money(newBasePremium + newExtraPremium);
if (newPremium < 0) throw '@El ajuste dejaria la prima de la cobertura en negativo';

target.end = iso(newEnd);
target.premium = newPremium;
target.basePremium = newBasePremium;
target.extraPremium = newExtraPremium;

const rows = [{
  code: selCode, name: target.name, reason: 'SELECTED',
  oldStart: iso(start), newStart: iso(start), oldEnd: iso(oldEnd), newEnd: iso(newEnd),
  oldPremium: money(oldPremium), newPremium: newPremium, variation: money(newPremium - oldPremium),
  proratedVariation: money(proratedPremium - oldPremium), deltaDays: deltaDays
}];

// En CAR, ramo 96, la cobertura 20 es la principal de mantenimiento aunque
// algunas instalaciones antiguas no tengan marcada la relacion en la tabla.
const selectedIsTechnicalCarPrincipal = isTechnicalCar && selCode === '20';
if ((coverageCfg[selCode] && coverageCfg[selCode].principal === '-1') || selectedIsTechnicalCarPrincipal) {
  for (let i = 0; i < jNew.length; i++) {
    const c = jNew[i];
    const code = txt(c.code);
    if (code === selCode) continue;
    const row = coverageCfg[code];
    const isConfiguredDependent = row && row.parent === selCode;
    const isTechnicalCarMaintenance = selectedIsTechnicalCarPrincipal && code === '23';
    if (!isConfiguredDependent && !isTechnicalCarMaintenance) continue;
    const ps = stamp(c.start, 'inicio dependiente ' + code);
    const pe = stamp(c.end, 'fin dependiente ' + code);
    if (pe <= ps) throw '@La vigencia de la cobertura dependiente ' + code + ' es invalida';
    // Every configured dependent coverage follows the new end of the
    // principal coverage, regardless of its previous start date. Its own
    // duration is preserved when calculating the new end.
    // GLOBUAT-392: durations that are multiples of 365/366 are evaluated as
    // calendar years, avoiding a leap-day offset while retaining the value in days.
    c.start = iso(newEnd);
    c.end = iso(addCoverageDuration(newEnd, (pe - ps) / day));
    rows.push({
      code: code, name: c.name, reason: 'DEPENDENT',
      oldStart: iso(ps), newStart: c.start, oldEnd: iso(pe), newEnd: c.end,
      oldPremium: money(c.premium), newPremium: money(c.premium), variation: 0, deltaDays: 0
    });
  }
}

// La grilla debe mostrar el estado completo de la poliza: ademas de la
// cobertura seleccionada y sus dependientes, se muestran las demas coberturas
// sin cambio para que el usuario pueda distinguirlas en el endoso.
const displayedCodes = {};
for (let i = 0; i < rows.length; i++) displayedCodes[rows[i].code] = true;
for (let i = 0; i < jNew.length; i++) {
  const coverage = jNew[i];
  const code = txt(coverage.code);
  if (!code || displayedCodes[code]) continue;
  const coverageStart = stamp(coverage.start, 'inicio cobertura ' + code);
  const coverageEnd = stamp(coverage.end, 'fin cobertura ' + code);
  rows.push({
    code: code,
    name: coverage.name,
    reason: 'UNCHANGED',
    oldStart: iso(coverageStart),
    newStart: iso(coverageStart),
    oldEnd: iso(coverageEnd),
    newEnd: iso(coverageEnd),
    oldPremium: money(coverage.premium),
    newPremium: money(coverage.premium),
    variation: 0,
    proratedVariation: 0,
    deltaDays: 0
  });
}

// ChangeCoverage recalcula la poliza completa. Una sola cobertura con inicio y
// fin iguales hace que el motor nativo intente dividir entre cero, por lo que
// se valida el conjunto final antes de invocarlo y se devuelve el codigo exacto.
function validateCoverageValidity(list, label) {
  for (let i = 0; i < list.length; i++) {
    const coverage = list[i] || {};
    const code = txt(coverage.code) || ('en indice ' + i);
    const coverageStart = stamp(coverage.start, label + ' de la cobertura ' + code);
    const coverageEnd = stamp(coverage.end, label + ' de la cobertura ' + code);
    if (coverageEnd <= coverageStart) {
      throw '@La cobertura ' + code + ' tiene una vigencia invalida (' + iso(coverage.start).slice(0, 10) + ' a ' + iso(coverage.end).slice(0, 10) + '). La fecha final debe ser posterior a la inicial';
    }
  }
}

validateCoverageValidity(jOld, 'vigencia actual');
validateCoverageValidity(jNew, 'vigencia resultante');

// The native engine exposes only "divide by zero". Keep the original values,
// but fail earlier with enough context to identify the zero-valued input.
const nativeInputWarnings = [];
const policyDuration = Number(policy.duration);
// duration is the number of complete years. A value of 0 is valid for a
// policy whose term is represented by durationMonths/durationDays.
if (policy.duration != null && policy.duration !== '' && (!isFinite(policyDuration) || policyDuration < 0)) {
  nativeInputWarnings.push('policy.duration=' + txt(policy.duration));
}
for (let i = 0; i < jNew.length; i++) {
  const coverage = jNew[i] || {};
  const code = txt(coverage.code) || ('indice ' + i);
  const premium = Number(coverage.premium);
  const basePremium = Number(coverage.basePremium);
  const coveragePeriodicity = Number(coverage.periodicity);
  if (!isFinite(premium) || premium < 0) nativeInputWarnings.push('cobertura ' + code + '.premium=' + txt(coverage.premium));
  if (!isFinite(basePremium) || basePremium < 0) nativeInputWarnings.push('cobertura ' + code + '.basePremium=' + txt(coverage.basePremium));
  // Coverage periodicity 0 is retained as-is because payment periodicity is
  // defined at policy level (for this policy: periodicity "m").
  if (!isFinite(coveragePeriodicity)) nativeInputWarnings.push('cobertura ' + code + '.periodicity=' + txt(coverage.periodicity));
}
if (nativeInputWarnings.length) {
  throw '@Entradas potencialmente invalidas para ChangeCoverage: ' + nativeInputWarnings.join('; ');
}

// ---------- motor nativo: impuestos, gastos y total ----------
const effectiveDate = iso(effectiveDateTimestamp);
const quoteData = {
  policyId: policyId,
  jOldCoverages: JSON.stringify(jOld),
  jNewCoverages: JSON.stringify(jNew),
  effectiveDate: effectiveDate,
  // This is a quote only. The actual Change with operation ADD is created by
  // the view after the calculation and confirmation steps.
  ignore: 1,
  noTracking: true
};
doCmd({ cmd: 'ChangeCoverage', data: quoteData });
if (!ChangeCoverage.ok) throw '@El motor de calculo nativo rechazo la cotizacion: ' + ChangeCoverage.msg;
const quoted = ChangeCoverage.outData;
const bill = quoted.Bill || {};

// la cotizacion nativa devuelve las coberturas con sus fechas ORIGINALES: se reinyectan las calculadas
const quotedCovs = JSON.parse(quoted.jNewCoverages || '[]');
for (let i = 0; i < quotedCovs.length; i++) {
  const q = quotedCovs[i];
  let snapshot = null;
  for (let s = 0; s < jNew.length; s++) {
    if (txt(jNew[s].code) === txt(q.code)) { snapshot = jNew[s]; break; }
  }
  if (snapshot) {
    const snapshotPremium = money(snapshot.premium);
    const nativePremium = money(q.premium);
    const snapshotHasLoading = Math.abs(Number(snapshot.loading || 0)) > 0.0000001
      || Math.abs(Number(snapshot.extraPremium || 0)) > 0.01;
    const nativeDroppedLoading = snapshotHasLoading
      && Math.abs(Number(q.loading || 0)) <= 0.0000001
      && Math.abs(Number(q.extraPremium || 0)) <= 0.01;
    // ChangeCoverage puede devolver el loading como 0 aunque el snapshot de
    // entrada ya contenga la prima final. En ese caso, el snapshot calculado
    // por esta cadena es la fuente autorizada para la vista y la ejecucion.
    if (nativeDroppedLoading || Math.abs(nativePremium - snapshotPremium) > 0.01) {
      q.basePremium = snapshot.basePremium;
      q.extraPremium = snapshot.extraPremium;
      q.premium = snapshot.premium;
      q.loading = snapshot.loading;
      q.loadingInsuredSum = snapshot.loadingInsuredSum;
    }
  }
  for (let k = 0; k < rows.length; k++) {
    if (txt(q.code) !== rows[k].code) continue;
    q.start = rows[k].newStart;
    q.end = rows[k].newEnd;
  }
}
quoted.jNewCoverages = JSON.stringify(quotedCovs);

const prevPremium = money(policy.annualPremium);
const prevTax = money(policy.tax);
const prevFee = money(policy.fee);
const prevTotal = money(policy.annualTotal);
// La cotizacion nativa puede devolver un Bill sin loading aunque jNew ya lo
// haya calculado. La facturacion debe usar la suma del snapshot final que se
// enviara, no la cobertura mutilada que devolvio el motor.
const finalPremium = money(quotedCovs.reduce(function (sum, coverage) {
  return sum + Number(coverage.premium || 0);
}, 0));
const nativePremium = money(bill.anualPremium == null ? bill.annualPremium : bill.anualPremium);
const nativeTaxRate = nativePremium === 0 ? 0 : Number(bill.tax || 0) / nativePremium;
const finalTax = money(finalPremium * nativeTaxRate);
const finalFee = money(bill.fee);
const finalTotal = money(finalPremium + finalTax + finalFee);
bill.coverages = finalPremium;
bill.surcharges = 0;
bill.discounts = 0;
bill.anualPremium = finalPremium;
bill.annualPremium = finalPremium;
bill.tax = finalTax;
bill.anualTotal = finalTotal;
bill.annualTotal = finalTotal;
bill.installment = finalTotal;
// La columna «calculado» es el mismo movimiento SIN los ajustes manuales; se deriva con la tasa
// efectiva de la propia cotizacion, y reproduce exactamente la cotizacion sin ajustes.
const taxRate = finalPremium === 0 ? 0 : finalTax / finalPremium;
const calcPremium = money(finalPremium - adjust);
const calcTax = money(calcPremium * taxRate);
const calcFee = finalFee;
const calcTotal = money(calcPremium + calcTax + calcFee);
rows[0].adjustedPremium = rows[0].newPremium;
rows[0].proratedPremium = proratedPremium;
rows[0].surcharge = surcharge;
rows[0].discount = discount;
rows[0].adjustment = adjust;

const detail = JSON.parse(quoted.jDetail || '{}');
// prorrateo por cobertura: es la base sobre la que el endoso reparte la cesion del movimiento
const detailCovs = detail.Coverages || [];
for (let i = 0; i < rows.length; i++) {
  rows[i].prorated = 0;
  for (let k = 0; k < detailCovs.length; k++) {
    if (txt(detailCovs[k].code) !== rows[i].code) continue;
    rows[i].prorated = money(detailCovs[k].premiumCost);
  }
}

doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT id FROM TaxGenerated WHERE ' + staleFilter } });
const residue = [];
const left = DoQuery.outData || [];
for (let i = 0; i < left.length; i++) residue.push(Number(left[i].id));

return {
  ok: true,
  persisted: false,
  policyId: policyId,
  policyCode: policy.code,
  currency: policy.currency,
  direction: direction,
  deltaDays: deltaDays,
  durationDays: durationDays,
  eligibleCodes: eligible,
  effectiveDate: effectiveDate,
  rows: rows,
  billing: {
    // Prima lleva SOLO la prima; los ajustes van en su propia fila. Asi
    // Prima + Ajustes + Gasto + Impuesto = Total en las tres columnas (CA15).
    premium: { before: prevPremium, calculated: calcPremium, after: finalPremium },
    adjustments: { before: 0, calculated: 0, after: adjust },
    fee: { before: prevFee, calculated: calcFee, after: finalFee },
    tax: { before: prevTax, calculated: calcTax, after: finalTax },
    total: { before: prevTotal, calculated: calcTotal, after: finalTotal },
    consistent: money(calcPremium + adjust + finalFee + finalTax) === finalTotal,
    movement: {
      premium: money(finalPremium - prevPremium),
      tax: money(finalTax - prevTax),
      fee: money(finalFee - prevFee),
      total: money(finalTotal - prevTotal),
      prorated: money(detail.coveragesCost)
    },
    currency: policy.currency,
    adjustmentUnit: 'CURRENCY_AMOUNT'
  },
  quote: quoted,
  quoteInput: quoteData,
  taxResidue: residue,
  taxSwept: swept,
  detail: detail
};
