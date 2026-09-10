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
const iso = function (v) { return new Date(v).toISOString().slice(0, 23); };
const errs = [];

const policyId = Number(context.policyId || 0);
const selCode = txt(context.coverageCode);
const rawNewEnd = txt(context.newEnd);
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

doCmd({ cmd: 'GetFullTable', data: { table: 'cfgCoberturaProductoReaFianza' } });
let table = GetFullTable.outData || [];
if (typeof table === 'string') table = JSON.parse(table);
const cfg = {};
for (let i = 1; i < table.length; i++) {
  const r = table[i];
  if (txt(r[1]) !== txt(policy.productCode)) continue;
  cfg[txt(r[3])] = { coverageCode: txt(r[3]), isCoverage: txt(r[5]), principal: txt(r[7]), parent: txt(r[8]) };
}

const eligible = [];
for (let i = 0; i < covs.length; i++) {
  const c = txt(covs[i].code);
  const row = cfg[c];
  if (c === '313' || (row && row.principal === '-1')) eligible.push(c);
}
if (eligible.indexOf(selCode) < 0) throw 'La cobertura ' + selCode + ' no es endosable en esta poliza. Elegibles: ' + (eligible.join(', ') || 'ninguna');
let howMany = 0;
for (let i = 0; i < covs.length; i++) { if (txt(covs[i].code) === selCode) howMany++; }
if (howMany !== 1) throw '@La cobertura ' + selCode + ' no es univoca en la poliza';

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
const direction = deltaDays > 0 ? 'EXTENSION' : 'REDUCCION';
const oldPremium = Number(target.premium == null ? Number(target.basePremium || 0) + Number(target.extraPremium || 0) : target.premium);
if (!isFinite(oldPremium) || oldPremium < 0) throw '@La prima vigente de la cobertura es invalida';
const rawDelta = money(oldPremium / durationDays * deltaDays);
// 🔴 Los ajustes manuales entran en la prima de la cobertura ANTES de cotizar. Si se aplican
// sólo a la presentacion, el motor nativo calcula impuesto y total sin ellos y la ejecucion
// los pierde: es lo que reprobo la primera ronda de pruebas (defectos 1 y CA15).
const adjust = money(surcharge - discount);
const proratedPremium = money(oldPremium + rawDelta);
const newPremium = money(proratedPremium + adjust);
if (newPremium < 0) throw '@El ajuste dejaria la prima de la cobertura en negativo';

target.end = iso(newEnd);
target.premium = newPremium;
target.basePremium = money(Number(target.basePremium == null ? oldPremium : target.basePremium) + rawDelta + adjust);

const rows = [{
  code: selCode, name: target.name, reason: 'SELECTED',
  oldStart: iso(start), newStart: iso(start), oldEnd: iso(oldEnd), newEnd: iso(newEnd),
  oldPremium: money(oldPremium), newPremium: newPremium, variation: money(rawDelta + adjust),
  proratedVariation: rawDelta, deltaDays: deltaDays
}];

if (cfg[selCode] && cfg[selCode].principal === '-1') {
  for (let i = 0; i < jNew.length; i++) {
    const c = jNew[i];
    const code = txt(c.code);
    if (code === selCode) continue;
    const row = cfg[code];
    if (!row || row.parent !== selCode) continue;
    const ps = stamp(c.start, 'inicio dependiente ' + code);
    const pe = stamp(c.end, 'fin dependiente ' + code);
    if (pe <= ps) throw '@La vigencia de la cobertura dependiente ' + code + ' es invalida';
    // Every configured dependent coverage follows the new end of the
    // principal coverage, regardless of its previous start date. Its own
    // duration is preserved when calculating the new end.
    c.start = iso(newEnd);
    c.end = iso(newEnd + (pe - ps));
    rows.push({
      code: code, name: c.name, reason: 'DEPENDENT',
      oldStart: iso(ps), newStart: c.start, oldEnd: iso(pe), newEnd: c.end,
      oldPremium: money(c.premium), newPremium: money(c.premium), variation: 0, deltaDays: 0
    });
  }
}

// ---------- motor nativo: impuestos, gastos y total ----------
const effectiveDate = new Date().toISOString().slice(0, 10) + 'T00:00:00';
const quoteData = {
  policyId: policyId,
  jOldCoverages: JSON.stringify(covs),
  jNewCoverages: JSON.stringify(jNew),
  effectiveDate: effectiveDate
};
doCmd({ cmd: 'ChangeCoverage', data: quoteData });
if (!ChangeCoverage.ok) throw '@El motor de calculo nativo rechazo la cotizacion: ' + ChangeCoverage.msg;
const quoted = ChangeCoverage.outData;
const bill = quoted.Bill || {};
const diff = quoted.BillDiff || {};

// la cotizacion nativa devuelve las coberturas con sus fechas ORIGINALES: se reinyectan las calculadas
const quotedCovs = JSON.parse(quoted.jNewCoverages || '[]');
for (let i = 0; i < quotedCovs.length; i++) {
  const q = quotedCovs[i];
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
// El Bill nativo YA lleva los ajustes dentro, porque viajaron en la prima de la cobertura.
const finalPremium = money(bill.anualPremium == null ? bill.annualPremium : bill.anualPremium);
const finalTax = money(bill.tax);
const finalFee = money(bill.fee);
const finalTotal = money(bill.annualTotal == null ? bill.anualTotal : bill.annualTotal);
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
      premium: money(diff.annualPremium),
      tax: money(diff.tax),
      fee: money(diff.fee),
      total: money(diff.annualTotal),
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
