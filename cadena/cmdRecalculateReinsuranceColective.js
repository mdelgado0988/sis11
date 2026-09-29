//block
//noreplace

/*
  *@name: cmdRecalculateReinsuranceColective
  *@Purpose: Recalcula el reaseguro de un movimiento de siniestro (reserva o pago) con el límite/prioridad del
  *          contrato definido en la tabla cfgLimiteContratoColectivo (Colectivo de Vida, ramo 20).
  *@Mission: MSN-000053 (global1), 2026-09-29
  *@Input:  { id | payoutId | lifeCoveragePayoutId, simulate?: bool, amount?: number (sólo con simulate) }
  *@Output: { ok, msg, movement, contract, priority, lines[], validation[] }
  *
  * Cálculo, por cada importe del movimiento (reserva y pago):
  *   baseReaseguro  = si |monto| >= prioridad y prioridad > 0 entonces prioridad si no |monto|
  *   montoRetencion = baseReaseguro × porcentajeRetencion      -> línea Cuota Parte, retenido
  *   montoCP        = baseReaseguro × porcentajeCP             -> línea Cuota Parte, cedido
  *   excedente      = si |monto| >= prioridad entonces |monto| - prioridad si no 0 -> línea Excedente, cedido
  *   (con el signo del movimiento: una liberación de reserva negativa se reparte en negativo)
  * Los porcentajes se leen del cálculo "perc" del contrato ({pret, pcp}).
  * Reaseguradores de cada línea: los de la cesión de la cobertura (CessionPart); si no hay, los del contrato.
  * Parte del reasegurador = cedido de la línea (pago) × split / 100, igual que el cálculo nativo.
*/

const TABLE = "cfgLimiteContratoColectivo";
const TOL = 0.005;

const payoutId = Number(context?.id ?? context?.payoutId ?? context?.lifeCoveragePayoutId ?? 0);
const simulate = context?.simulate === true || context?.simulate === "true";
const amountOverride = context?.amount !== undefined && context?.amount !== null && context?.amount !== "" ? toNumber(context.amount) : null;

if (!payoutId) throw new Error("@Indique el id de la reserva o pago (id)");
if (amountOverride !== null && !simulate) throw new Error("@El monto de prueba (amount) sólo se admite con simulate:true");

// 1. Movimiento
const payout = loadOne("LifeCoveragePayout", `id = ${payoutId}`);
if (!payout) throw new Error(`@No existe la reserva/pago ${payoutId}`);

const claim = loadOne("Claim", `id = ${payout.claimId}`, "id,occurrence");
const occurrence = claim?.occurrence ? new Date(claim.occurrence) : new Date(payout.date);
const isPayment = toNumber(payout.payed) != 0;
const reserveAmount = amountOverride !== null && !isPayment ? amountOverride : toNumber(payout.reserved);
const lossAmount = amountOverride !== null && isPayment ? amountOverride : toNumber(payout.payed);

// Este comando aplica exclusivamente al ramo 20, sin restringir sus productos.
const policy = loadOne("LifePolicy", `id = ${payout.lifePolicyId}`, "id,lob,productCode");
if (!policy) throw new Error(`@No existe la póliza ${payout.lifePolicyId} asociada al movimiento ${payoutId}`);
if (String(policy.lob ?? "").trim() !== "20") {
  throw new Error(`@El comando sólo aplica al ramo 20; la póliza ${payout.lifePolicyId} pertenece al ramo ${policy.lob ?? "no informado"}`);
}

// 2. Límites configurados
const limits = readLimits();

// 3. Contrato vigente de la cobertura afectada: cesiones vivas de la cobertura cuyo contrato tiene límite
const cessions = loadMany("Cession", `lifePolicyId = ${payout.lifePolicyId} AND coverageId = ${payout.lifeCoverageId} AND overwritten = 0 AND ISNULL(err, 0) = 0`);
const contractIds = [...new Set(cessions.map(c => c.contractId))];
if (!contractIds.length) throw new Error(`@La cobertura del movimiento ${payoutId} no tiene reaseguro cedido`);

const contracts = loadMany("Contract", `id IN (${contractIds.join(",")})`, "id,code,name,active,effectiveDate,endDate,configJson")
  .filter(c => limits[String(c.code).trim().toUpperCase()] !== undefined)
  .filter(c => c.active !== false)
  .filter(c => (!c.effectiveDate || new Date(c.effectiveDate) <= occurrence) && (!c.endDate || new Date(c.endDate) >= occurrence));

if (contracts.length == 0) throw new Error(`@No hay contrato vigente con límite en ${TABLE} para la cobertura del movimiento ${payoutId}`);
if (contracts.length > 1) throw new Error(`@Hay más de un contrato vigente con límite para la cobertura: ${contracts.map(c => c.code).join(", ")}`);

const contract = contracts[0];
const priority = limits[String(contract.code).trim().toUpperCase()];
const perc = readPercentages(contract);

// cesión por línea: la que cubre la fecha de ocurrencia; si ninguna la cubre, la última (mayor id)
const warnings = [];
const inPeriod = c => (!c.start || new Date(c.start) <= occurrence) && (!c.end || new Date(c.end) >= occurrence);
const lineCessions = {};
for (const c of cessions.filter(x => x.contractId == contract.id).sort((a, b) => a.id - b.id)) {
  const prev = lineCessions[c.lineId];
  if (!prev || inPeriod(c) || !inPeriod(prev)) lineCessions[c.lineId] = c;
}
for (const l of Object.keys(lineCessions))
  if (!inPeriod(lineCessions[l])) warnings.push(`La cesión ${lineCessions[l].id} de la línea ${l} no cubre la fecha de ocurrencia; se usa la última de la cobertura`);
const cpLineId = Object.keys(lineCessions).find(l => /cuota/i.test(l)) ?? "Cuota Parte";
const exLineId = Object.keys(lineCessions).find(l => /exceden|surplus/i.test(l))
  ?? (contract.configJson ? (safeJson(contract.configJson, {}).Lines ?? []).map(l => String(l.id)).find(l => /exceden|surplus/i.test(l)) : null)
  ?? "Excedente 1";

// 4. Cálculo
const res = split(reserveAmount, priority, perc);
const los = split(lossAmount, priority, perc);

// 5. Reaseguro actual del movimiento
const current = loadLossCessions(`lifeCoveragePayoutId = ${payoutId}`);
const currentIds = current.map(x => x.id);
const currentParts = currentIds.length ? loadMany("LossCessionPart", `lossCessionId IN (${currentIds.join(",")})`) : [];
if (currentParts.some(p => p.liquidationId)) throw new Error(`@El reaseguro del movimiento ${payoutId} ya está en una liquidación: no se recalcula`);

const plan = [
  { lineId: cpLineId, retainedReserve: res.ret, cededReserve: res.cp, retainedLoss: los.ret, cededLoss: los.cp },
  { lineId: exLineId, retainedReserve: 0, cededReserve: res.ex, retainedLoss: 0, cededLoss: los.ex }
];

const lines = [];
for (const p of plan) {
  const existing = current.find(x => x.contractId == contract.id && x.lineId == p.lineId);
  const cession = lineCessions[p.lineId];
  const needed = p.cededReserve != 0 || p.cededLoss != 0 || p.retainedReserve != 0 || p.retainedLoss != 0;
  if (!existing && !needed) continue;
  if (!existing && !cession) throw new Error(`@La cobertura no tiene cesión en la línea ${p.lineId} del contrato ${contract.code} para ceder ${p.cededReserve || p.cededLoss}`);

  const entity = existing ? {
    id: existing.id,
    contractId: existing.contractId,
    cessionId: existing.cessionId,
    lineId: existing.lineId,
    lifeCoveragePayoutId: existing.lifeCoveragePayoutId,
    currency: existing.currency,
    claimOccurrence: existing.claimOccurrence,
    reinstatementPremium: existing.reinstatementPremium,
    liquidationCatId: existing.liquidationCatId,
    exGratia: existing.exGratia
  } : {
    id: 0, contractId: contract.id, cessionId: cession.id, lineId: p.lineId, lifeCoveragePayoutId: payoutId,
    currency: payout.currency ?? cession.currency, claimOccurrence: claim?.occurrence ?? payout.date,
    reinstatementPremium: 0, liquidationCatId: null, exGratia: payout.reserveType == "EXGRATIA"
  };
  delete entity.Contract; delete entity.Cession; delete entity.Payout; delete entity.LiquidationCat;
  entity.reserve = reserveAmount;
  entity.retainedReserve = p.retainedReserve;
  entity.cededReserve = p.cededReserve;
  entity.loss = lossAmount;
  entity.retainedLoss = p.retainedLoss;
  entity.cededLoss = p.cededLoss;
  entity.jAmounts = null;
  entity.Participants = buildParticipants(entity, existing ? currentParts.filter(x => x.lossCessionId == existing.id) : [], cession, contract);
  lines.push(entity);
}

// 6. Validación antes de grabar
const validation = validate(lines, reserveAmount, lossAmount);
if (validation.length) throw new Error("@Diferencias en el reaseguro calculado: " + validation.join("; "));

const summary = {
  ok: true,
  movement: { id: payoutId, type: isPayment ? "PAGO" : "RESERVA", claimId: payout.claimId, reserve: reserveAmount, loss: lossAmount, currency: payout.currency },
  contract: { id: contract.id, code: contract.code, retention: perc.pret, quotaShare: perc.pcp },
  priority,
  warnings,
  reserve: res,
  payment: los,
  lines: lines.map(l => ({ id: l.id, lineId: l.lineId, reserve: l.reserve, retainedReserve: l.retainedReserve, cededReserve: l.cededReserve, loss: l.loss, retainedLoss: l.retainedLoss, cededLoss: l.cededLoss,
    participants: l.Participants.map(q => ({ id: q.id, contactId: q.contactId, name: q.name, split: q.split, loss: q.loss })) }))
};

if (simulate) {
  summary.msg = "Simulación: no se grabó nada";
  return summary;
}

// 7. Grabar (una operación por línea, con sus reaseguradores)
for (const l of lines) {
  if (l.id) {
    updateExistingLossCession(l);
  } else {
    doCmd({ cmd: "RepoLossCession", data: { operation: "ADD", entity: l } });
    if (!RepoLossCession || RepoLossCession.ok === false) throw new Error(`@No se pudo grabar la línea ${l.lineId}: ${RepoLossCession?.msg}`);
  }
}

// 8. Releer y validar lo grabado
const saved = loadLossCessions(`lifeCoveragePayoutId = ${payoutId} AND contractId = ${contract.id}`);
const savedParts = saved.length ? loadMany("LossCessionPart", `lossCessionId IN (${saved.map(x => x.id).join(",")})`) : [];
const savedLines = saved.map(s => ({ ...s, Participants: savedParts.filter(p => p.lossCessionId == s.id) }));
const after = validate(savedLines, reserveAmount, lossAmount);
for (const l of lines) {
  const s = savedLines.find(x => x.lineId == l.lineId);
  if (!s) { after.push(`línea ${l.lineId} no grabada`); continue; }
  for (const f of ["retainedReserve", "cededReserve", "retainedLoss", "cededLoss"])
    if (Math.abs(toNumber(s[f]) - l[f]) > TOL) after.push(`${l.lineId}.${f} grabado ${s[f]} <> calculado ${l[f]}`);
}
if (after.length) throw new Error("@Diferencias después de grabar: " + after.join("; "));

summary.lines = savedLines.map(l => ({ id: l.id, lineId: l.lineId, reserve: l.reserve, retainedReserve: l.retainedReserve, cededReserve: l.cededReserve, loss: l.loss, retainedLoss: l.retainedLoss, cededLoss: l.cededLoss,
  participants: l.Participants.map(q => ({ id: q.id, contactId: q.contactId, name: q.name, split: q.split, loss: q.loss })) }));
summary.msg = `Reaseguro del movimiento ${payoutId} recalculado sin diferencias`;
return summary;

//////////////////////////////////////////////////////////////////

function split(amount, prio, pc) {
  const sign = amount < 0 ? -1 : 1;
  const abs = Math.abs(amount);
  const base = (abs >= prio && prio > 0) ? prio : abs;
  const ex = (prio > 0 && abs >= prio) ? abs - prio : 0;
  const cp = n2(base * pc.pcp);
  const ret = n2(base - cp);           // base × %retención, absorbe el redondeo para que ret + cp = base
  return { amount: amount, base: n2(sign * base), ret: n2(sign * ret), cp: n2(sign * cp), ex: n2(sign * ex) };
}

function buildParticipants(line, existingParts, cession, contract) {
  let source = cession ? loadMany("CessionPart", `cessionId = ${cession.id}`) : [];
  if (!source.length) source = loadMany("Participant", `contractId = ${contract.id} AND lineId = '${String(line.lineId).replace(/'/g, "''")}'`);
  if (!source.length) {
    if (line.cededReserve != 0 || line.cededLoss != 0) throw new Error(`@La línea ${line.lineId} no tiene reaseguradores configurados`);
    return [];
  }
  const totalSplit = source.reduce((s, x) => s + toNumber(x.split), 0);
  if (Math.abs(totalSplit - 100) > 0.0001) throw new Error(`@Los reaseguradores de la línea ${line.lineId} suman ${totalSplit}% y no 100%`);

  const parts = source.map(src => {
    const prev = existingParts.find(x => x.contactId == src.contactId);
    const q = prev ? { ...prev } : { id: 0, lossCessionId: line.id || 0, contactId: src.contactId, liquidationId: null, paid: 0, jAmounts: null };
    delete q.Contact; delete q.Broker; delete q.SubParts;
    q.name = src.name ?? prev?.name ?? null;
    q.lineId = line.lineId;
    q.split = toNumber(src.split);
    q.brokerId = src.brokerId ?? null;
    q.currency = line.currency;
    q.loss = n2(line.cededLoss * q.split / 100);
    q.jAmounts = null;
    return q;
  });
  // el residuo del redondeo va al reasegurador de mayor participación
  const diff = n2(line.cededLoss - parts.reduce((s, q) => s + q.loss, 0));
  if (diff != 0) parts.sort((a, b) => b.split - a.split)[0].loss = n2(parts[0].loss + diff);
  // reaseguradores que ya no están en la línea: su parte queda en cero
  for (const prev of existingParts.filter(x => !source.some(s => s.contactId == x.contactId))) {
    const q = { ...prev, split: 0, loss: 0, jAmounts: null };
    delete q.Contact; delete q.Broker; delete q.SubParts;
    parts.push(q);
  }
  return parts;
}

function validate(ls, reserveAmt, lossAmt) {
  const out = [];
  const sr = n2(ls.reduce((s, l) => s + toNumber(l.retainedReserve) + toNumber(l.cededReserve), 0));
  const sl = n2(ls.reduce((s, l) => s + toNumber(l.retainedLoss) + toNumber(l.cededLoss), 0));
  if (Math.abs(sr - n2(reserveAmt)) > TOL) out.push(`reserva distribuida ${sr} <> reserva ${reserveAmt}`);
  if (Math.abs(sl - n2(lossAmt)) > TOL) out.push(`pago distribuido ${sl} <> pago ${lossAmt}`);
  for (const l of ls) {
    const ps = (l.Participants ?? []).filter(p => toNumber(p.split) != 0);
    if (!ps.length) continue;
    const ssplit = ps.reduce((s, p) => s + toNumber(p.split), 0);
    const sloss = n2(ps.reduce((s, p) => s + toNumber(p.loss), 0));
    if (Math.abs(ssplit - 100) > 0.0001) out.push(`${l.lineId}: participación de reaseguradores ${ssplit}%`);
    if (Math.abs(sloss - n2(l.cededLoss)) > TOL) out.push(`${l.lineId}: reaseguradores ${sloss} <> cedido de la línea ${l.cededLoss}`);
  }
  return out;
}

function readLimits() {
  doCmd({ cmd: "GetFullTable", data: { table: TABLE, filter: "1=1" } });
  let rows = GetFullTable?.outData;
  if (typeof rows === "string") rows = JSON.parse(rows);
  if (!Array.isArray(rows) || rows.length < 1) throw new Error(`@No existe la tabla ${TABLE} (${GetFullTable?.msg ?? ""})`);
  const head = rows[0].map(h => String(h ?? "").trim().toLowerCase());
  const iCode = head.indexOf("codigocontrato");
  const iLim = head.indexOf("limite");
  if (iCode < 0 || iLim < 0) throw new Error(`@La tabla ${TABLE} debe tener las columnas CodigoContrato y Limite`);
  const out = {};
  for (const row of rows.slice(1)) {
    if (!row || row[iCode] === null || row[iCode] === undefined || String(row[iCode]).trim() === "") continue;
    out[String(row[iCode]).trim().toUpperCase()] = toNumber(row[iLim]);
  }
  return out;
}

function readPercentages(c) {
  const cfg = safeJson(c.configJson, {});
  const calc = (cfg.Calculations ?? []).find(x => String(x.name).toLowerCase() == "perc");
  const f = String(calc?.formula ?? "");
  const pret = f.match(/pret\s*:\s*([0-9.]+)/);
  const pcp = f.match(/pcp\s*:\s*([0-9.]+)/);
  if (!pret || !pcp) throw new Error(`@El contrato ${c.code} no tiene configurados los porcentajes de retención y cuota parte (cálculo perc)`);
  const r = { pret: Number(pret[1]), pcp: Number(pcp[1]) };
  if (Math.abs(r.pret + r.pcp - 1) > 0.000001) throw new Error(`@Retención ${r.pret} + cuota parte ${r.pcp} del contrato ${c.code} no suman 100%`);
  return r;
}

function loadOne(entity, filter, fields) {
  const data = { entity, filter, noTracking: true };
  if (fields) data.fields = fields;
  doCmd({ cmd: "LoadEntity", data });
  return LoadEntity?.outData ?? null;
}

function loadMany(entity, filter, fields) {
  const data = { entity, filter, noTracking: true };
  if (fields) data.fields = fields;
  doCmd({ cmd: "LoadEntities", data });
  const out = LoadEntities?.outData;
  return Array.isArray(out) ? out : [];
}

function loadLossCessions(filter) {
  doCmd({ cmd: "RepoLossCession", data: { operation: "GET", filter, noTracking: true } });
  const response = typeof RepoLossCession === "undefined" ? null : RepoLossCession;
  if (!response || response.ok === false) {
    throw new Error(`@No fue posible recuperar las cesiones del movimiento: ${response?.msg ?? "respuesta no disponible"}`);
  }
  return Array.isArray(response.outData) ? response.outData : [];
}

function updateExistingLossCession(line) {
  const fieldValue = [
    `contractId=${toNumber(line.contractId)}`,
    `cessionId=${toNumber(line.cessionId)}`,
    `lineId=${sqlString(line.lineId)}`,
    `lifeCoveragePayoutId=${toNumber(line.lifeCoveragePayoutId)}`,
    `currency=${sqlString(line.currency)}`,
    `claimOccurrence=${sqlString(line.claimOccurrence)}`,
    `reinstatementPremium=${toNumber(line.reinstatementPremium)}`,
    `liquidationCatId=${line.liquidationCatId == null ? "NULL" : toNumber(line.liquidationCatId)}`,
    `exGratia=${line.exGratia ? 1 : 0}`,
    `reserve=${toNumber(line.reserve)}`,
    `retainedReserve=${toNumber(line.retainedReserve)}`,
    `cededReserve=${toNumber(line.cededReserve)}`,
    `loss=${toNumber(line.loss)}`,
    `retainedLoss=${toNumber(line.retainedLoss)}`,
    `cededLoss=${toNumber(line.cededLoss)}`,
    "jAmounts=NULL"
  ].join(",");
  doCmd({ cmd: "SetField", data: { entity: "LossCession", entityId: line.id, fieldValue } });
  if (typeof SetField === "undefined" || !SetField || SetField.ok === false) {
    throw new Error(`@No se pudo grabar la línea ${line.lineId}: ${SetField?.msg ?? "error actualizando LossCession"}`);
  }

  for (const participant of line.Participants || []) {
    if (!participant.id) continue;
    const participantFields = [
      `contactId=${toNumber(participant.contactId)}`,
      `lineId=${sqlString(participant.lineId)}`,
      `split=${toNumber(participant.split)}`,
      `brokerId=${participant.brokerId == null ? "NULL" : toNumber(participant.brokerId)}`,
      `currency=${sqlString(participant.currency)}`,
      `loss=${toNumber(participant.loss)}`,
      "jAmounts=NULL"
    ].join(",");
    doCmd({ cmd: "SetField", data: { entity: "LossCessionPart", entityId: participant.id, fieldValue: participantFields } });
    if (typeof SetField === "undefined" || !SetField || SetField.ok === false) {
      throw new Error(`@No se pudo actualizar el participante de la línea ${line.lineId}: ${SetField?.msg ?? "error actualizando LossCessionPart"}`);
    }
  }
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function safeJson(v, fb) {
  if (!v) return fb;
  try { return typeof v === "string" ? JSON.parse(v) : v; } catch (e) { return fb; }
}

function toNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  return Number(String(v).replace(/,/g, "").trim()) || 0;
}

function n2(v) {
  const x = Number(v || 0);
  return Math.sign(x) * Math.round((Math.abs(x) + Number.EPSILON) * 100) / 100;
}
