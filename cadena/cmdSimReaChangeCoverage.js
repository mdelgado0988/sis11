//block
//noreplace
/*
 * cmdSimReaChangeCoverage (AXX-299 / GLOB-1201)
 * Pestania 2: simula el reaseguro DEL MOVIMIENTO del endoso de vigencia, sin ejecutar
 * el endoso y sin escribir en Cession. Distribuye solo la diferencia de prima de cada
 * cobertura sobre los contratos vigentes de la poliza, agrupando por contrato y linea,
 * respetando si la cobertura suma o no para el contrato (cfgCoberturaProductoReaFianza),
 * y proyectando los aceptantes de cada linea por su participacion.
 *
 * La prima de reaseguro se reparte sobre la variacion FINAL de la cobertura
 * (incluye recargos y descuentos). El importe prorateado se conserva como dato
 * informativo, pero no puede ser la base porque omite esos ajustes manuales.
 *
 * context: {policyId, rows:[{code, variation, prorated}], participants:[{cessionId, contactId, split}]}
 */
const money = function (v) { return Number(Number(v).toFixed(2)); };
const txt = function (v) { return String(v == null ? '' : v).trim(); };
const up = function (v) { return txt(v).toUpperCase(); };

const policyId = Number(context.policyId || 0);
if (!policyId) throw 'Falta la poliza';
const rows = context.rows || [];
if (!rows.length) throw 'No hay resultado de calculo que distribuir: ejecute primero Calcular endoso';

const delta = {};
const prorated = {};
let movement = 0;
let proratedMovement = 0;
for (let i = 0; i < rows.length; i++) {
  const c = txt(rows[i].code);
  const v = money(rows[i].variation || 0);
  const pr = rows[i].prorated === undefined || rows[i].prorated === null ? v : money(rows[i].prorated);
  delta[c] = v;
  prorated[c] = pr;
  movement = money(movement + v);
  proratedMovement = money(proratedMovement + pr);
}

doCmd({ cmd: 'RepoLifePolicy', data: { operation: 'GET', filter: 'id=' + policyId, include: ['Coverages'], size: 1 } });
const policy = (RepoLifePolicy.outData || [])[0];
if (!policy) throw 'Poliza ' + policyId + ' no encontrada';

doCmd({ cmd: 'GetFullTable', data: { table: 'cfgCoberturaProductoReaFianza' } });
let table = GetFullTable.outData || [];
if (typeof table === 'string') table = JSON.parse(table);
const sums = {};
for (let i = 1; i < table.length; i++) {
  const r = table[i];
  if (txt(r[1]) !== txt(policy.productCode)) continue;
  sums[txt(r[3])] = up(r[5]) === 'SI';
}

// distribucion vigente de la poliza; proyeccion de solo lectura para no trackear filas
doCmd({ cmd: 'LoadEntities', data: { entity: 'Cession', filter: 'lifePolicyId = ' + policyId + ' AND overwritten = 0', noTracking: true } });
const live = LoadEntities.outData || [];
if (!live.length) return { ok: true, persisted: false, policyId: policyId, movement: movement, contracts: [], msg: 'La poliza no tiene reaseguro vigente: el movimiento no genera cesion' };

// una sola linea por contrato + linea + cobertura: la ultima vigente manda
const seen = {};
for (let i = 0; i < live.length; i++) {
  const c = live[i];
  const key = txt(c.contractId) + '|' + txt(c.lineId) + '|' + txt(c.coverageCode);
  if (seen[key] && Number(seen[key].id) > Number(c.id)) continue;
  seen[key] = c;
}
const base = [];
for (const k in seen) { if (seen.hasOwnProperty(k)) base.push(seen[k]); }

// aceptantes de esas lineas
const baseIds = [];
for (let i = 0; i < base.length; i++) baseIds.push(Number(base[i].id));
const partsByCession = {};
if (baseIds.length) {
  doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT id, cessionId, contactId, lineId, split, premium, commission FROM CessionPart WHERE cessionId IN (' + baseIds.join(',') + ')' } });
  const parts = DoQuery.outData || [];
  for (let i = 0; i < parts.length; i++) {
    const cid = Number(parts[i].cessionId);
    if (!partsByCession[cid]) partsByCession[cid] = [];
    partsByCession[cid].push(parts[i]);
  }
}
// participaciones editadas en la pantalla, si las hay
const overrides = {};
const addedByCession = {};
const edited = context.participants || [];
for (let i = 0; i < edited.length; i++) {
  const e = edited[i];
  const cid = Number(e.cessionId);
  overrides[cid + '|' + Number(e.contactId)] = Number(e.split);
  if (!addedByCession[cid]) addedByCession[cid] = [];
  addedByCession[cid].push(Number(e.contactId));
}

const byContract = {};
const order = [];
const warnings = [];
for (let i = 0; i < base.length; i++) {
  const c = base[i];
  const code = txt(c.coverageCode);
  if (delta[code] === undefined) continue;
  const line = txt(c.lineId);
  const lineUp = up(line);
  const key = txt(c.contractId) + '|' + line;
  if (!byContract[key]) {
    byContract[key] = {
      contractId: Number(c.contractId), lineId: line,
      facultative: lineUp === 'FAC' || lineUp === 'FRO',
      currency: txt(c.currency) || txt(policy.currency),
      rows: [], participants: [],
      totals: { movement: 0, prorated: 0, cedant: 0, re: 0, commission: 0, nonTechnical: 0, sumInsuredCounted: 0, coveragesCounted: 0, participantSplit: 0 }
    };
    order.push(key);
  }
  const grp = byContract[key];
  const dv = money(delta[code]);
  const pv = money(prorated[code]);
  const pCed = Number(c.proportionCed || 0);
  const pRe = Number(c.proportionRe || 0);
  const commissionBase = Number(c.comissionCedant == null ? c.participantCommission : c.comissionCedant) || 0;
  const commissionRate = Number(c.premium) === 0 ? 0 : commissionBase / Number(c.premium);
  const counts = sums[code] === true;
  // La variacion final incluye el recargo/descuento aplicado a la cobertura.
  const cedant = money(dv * pCed);
  const re = money(dv * pRe);
  const commission = money(dv * commissionRate);
  const nonTechnical = money(dv - cedant - re);
  grp.rows.push({
    coverageCode: code, cover: txt(c.cover), counts: counts,
    premiumMovement: dv, proratedMovement: pv,
    proportionCed: pCed, proportionRe: pRe,
    premiumCedant: cedant, premiumRe: re, nonTechnicalPremium: nonTechnical,
    sumInsured: Number(c.sumInsured || 0), sumInsuredCounted: counts ? Number(c.sumInsured || 0) : 0,
    commission: commission, currency: txt(c.currency) || txt(policy.currency),
    basedOnCessionId: Number(c.id)
  });
  grp.totals.movement = money(grp.totals.movement + dv);
  grp.totals.prorated = money(grp.totals.prorated + pv);
  grp.totals.cedant = money(grp.totals.cedant + cedant);
  grp.totals.re = money(grp.totals.re + re);
  grp.totals.commission = money(grp.totals.commission + commission);
  grp.totals.nonTechnical = money(grp.totals.nonTechnical + nonTechnical);
  if (counts) {
    grp.totals.sumInsuredCounted = grp.totals.sumInsuredCounted + Number(c.sumInsured || 0);
    grp.totals.coveragesCounted = grp.totals.coveragesCounted + 1;
  }

  // aceptantes de esta linea: el cedido se reparte por su participacion
  const parts = (partsByCession[Number(c.id)] || []).slice();
  // una edicion puede nombrar a un aceptante que todavia no participa del movimiento: se agrega
  const namedHere = addedByCession[Number(c.id)] || [];
  for (let k = 0; k < namedHere.length; k++) {
    let yaEsta = false;
    for (let j = 0; j < parts.length; j++) { if (Number(parts[j].contactId) === namedHere[k]) yaEsta = true; }
    if (!yaEsta) parts.push({ id: 0, cessionId: Number(c.id), contactId: namedHere[k], lineId: txt(c.lineId), split: 0, premium: 0, commission: 0, isNew: true });
  }
  let splitSum = 0;
  for (let k = 0; k < parts.length; k++) {
    const pt = parts[k];
    const ov = overrides[Number(c.id) + '|' + Number(pt.contactId)];
    const split = ov === undefined || !isFinite(ov) ? Number(pt.split || 0) : ov;
    splitSum = splitSum + split;
    grp.participants.push({
      cessionId: Number(c.id), coverageCode: code, contactId: Number(pt.contactId),
      lineId: txt(pt.lineId), split: split, edited: ov !== undefined, added: pt.isNew === true,
      premium: money(re * split / 100), commission: money(commission * split / 100)
    });
  }
  if (parts.length && Math.abs(splitSum - 100) > 0.01) {
    warnings.push('Contrato ' + c.contractId + ' linea ' + line + ' cobertura ' + code + ': las participaciones suman ' + money(splitSum) + '% en vez de 100%');
  }
  if (!parts.length && grp.facultative) {
    warnings.push('Contrato ' + c.contractId + ' linea ' + line + ': facultativo sin aceptantes, hay que distribuirlos antes de ejecutar');
  }
}

// participantes configurados en cada contrato: son los aceptantes elegibles de la linea
const contractIds = [];
for (let i = 0; i < order.length; i++) {
  const cid = byContract[order[i]].contractId;
  if (contractIds.indexOf(cid) < 0) contractIds.push(cid);
}
const eligible = {};
if (contractIds.length) {
  doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT id, contractId, contactId, lineId, split FROM Participant WHERE contractId IN (' + contractIds.join(',') + ')' } });
  const partRows = DoQuery.outData || [];
  for (let i = 0; i < partRows.length; i++) {
    const r = partRows[i];
    const k = Number(r.contractId);
    if (!eligible[k]) eligible[k] = [];
    eligible[k].push({ contactId: Number(r.contactId), lineId: txt(r.lineId), contractSplit: Number(r.split) });
  }
}

const contracts = [];
let distributed = 0;
for (let i = 0; i < order.length; i++) {
  const g = byContract[order[i]];
  distributed = money(distributed + g.totals.movement);
  let ps = 0;
  for (let k = 0; k < g.participants.length; k++) ps = money(ps + g.participants[k].premium);
  g.totals.participantPremium = ps;
  g.contractParticipants = eligible[g.contractId] || [];
  contracts.push(g);
}

return {
  ok: true,
  persisted: false,
  scope: 'MOVEMENT_ONLY',
  basis: 'FINAL_COVERAGE_MOVEMENT',
  policyId: policyId,
  policyCode: policy.code,
  currency: policy.currency,
  movement: movement,
  proratedMovement: proratedMovement,
  distributed: distributed,
  balanced: money(movement - distributed) === 0,
  warnings: warnings,
  contracts: contracts
};
