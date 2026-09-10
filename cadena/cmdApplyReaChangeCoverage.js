//block
//noreplace
/*
 * cmdApplyReaChangeCoverage (AXX-299 / GLOB-1201)
 * Escribe en Cession la distribucion CONFIRMADA del movimiento — la que el usuario aprobo en
 * la pestania 2, incluidas las participaciones editadas de los aceptantes — y comprueba la
 * igualdad EXACTA releyendo. Sin tolerancias.
 *
 * Alcance acotado por diseno: SOLO toca filas cuyo `changeId` es el del endoso recien
 * aplicado. Nunca el saldo historico de la poliza, nunca otro movimiento.
 * Va en un request aparte del que ejecuta el endoso: esas filas las crea `ExeChangeCoverage`
 * y quedan trackeadas, asi que un UPDATE en la misma ejecucion no puede adjuntarlas.
 *
 * 🔴 El porcentaje del aceptante (`CessionPart.split`) NO se escribe con `RepoCessionPart`:
 * ni el ADD ni el UPDATE lo respetan, y los dos contestan `ok:true`. El unico camino que lo
 * escribe es la coleccion hija `Participants` de un `RepoCession UPDATE`.
 *
 * context: {changeId, distribution:[{contractId,lineId,coverageCode,premiumMovement,
 *           sumInsuredMovement,premiumCedant,sumInsuredCedant,premiumRe,sumInsuredRe,
 *           commission,tax}], participants:[{contractId,lineId,coverageCode,contactId,
 *           brokerId,split,sumInsured,premium,commission,tax}]}
 */
const money = function (v) { return Number(Number(v || 0).toFixed(2)); };
const txt = function (v) { return String(v == null ? '' : v).trim(); };

const changeId = Number(context.changeId || 0);
if (!changeId) throw 'Falta el identificador del endoso';
const wanted = context.distribution || [];
if (!wanted.length) throw 'No hay distribucion confirmada que escribir';
const wantedParts = context.participants || [];
const trace = [];
const failed = [];

// ---------- el endoso tiene que estar aplicado ----------
doCmd({ cmd: 'LoadEntities', data: { entity: 'Change', filter: 'id = ' + changeId, noTracking: true } });
const chg = (LoadEntities.outData || [])[0];
if (!chg) throw 'El endoso ' + changeId + ' no existe';
const policyId = Number(chg.lifePolicyId);
if (Number(chg.status) !== 1) throw 'El endoso ' + changeId + ' no esta aplicado (estado ' + chg.status + '): no hay movimiento que distribuir';

// ---------- validacion de la distribucion confirmada, antes de escribir nada ----------
const bad = [];
for (let i = 0; i < wanted.length; i++) {
  const w = wanted[i];
  const mov = money(w.premiumMovement);
  const ced = money(w.premiumCedant);
  const re = money(w.premiumRe);
  const sumMov = money(w.sumInsuredMovement);
  const sumCed = money(w.sumInsuredCedant);
  const sumRe = money(w.sumInsuredRe);
  if (Math.abs(ced) + Math.abs(re) > Math.abs(mov) + 0.011) bad.push('cobertura ' + txt(w.coverageCode) + ': retencion mas cedido (' + money(Math.abs(ced) + Math.abs(re)) + ') supera el movimiento (' + mov + ')');
  if (Math.abs(sumCed) + Math.abs(sumRe) > Math.abs(sumMov) + 0.011) bad.push('cobertura ' + txt(w.coverageCode) + ': suma retenida mas cedida (' + money(Math.abs(sumCed) + Math.abs(sumRe)) + ') supera la suma del movimiento (' + sumMov + ')');
  if (mov !== 0 && ced !== 0 && (mov > 0) !== (ced > 0)) bad.push('cobertura ' + txt(w.coverageCode) + ': la retencion tiene signo contrario al movimiento');
  if (mov !== 0 && re !== 0 && (mov > 0) !== (re > 0)) bad.push('cobertura ' + txt(w.coverageCode) + ': el cedido tiene signo contrario al movimiento');
}
const splitByLine = {};
const premiumByLine = {};
const sumByLine = {};
const commissionByLine = {};
const taxByLine = {};
for (let i = 0; i < wantedParts.length; i++) {
  const p = wantedParts[i];
  const k = Number(p.contractId || 0) + '|' + txt(p.lineId) + '|' + txt(p.coverageCode);
  splitByLine[k] = money((splitByLine[k] || 0) + Number(p.split || 0));
  premiumByLine[k] = money((premiumByLine[k] || 0) + money(p.premium));
  sumByLine[k] = money((sumByLine[k] || 0) + money(p.sumInsured));
  commissionByLine[k] = money((commissionByLine[k] || 0) + money(p.commission));
  taxByLine[k] = money((taxByLine[k] || 0) + money(p.tax));
  if (Number(p.split) < 0 || Number(p.split) > 100) bad.push('aceptante ' + p.contactId + ' de la cobertura ' + txt(p.coverageCode) + ': participacion ' + p.split + '% fuera de rango');
}
for (const k in splitByLine) {
  if (!splitByLine.hasOwnProperty(k)) continue;
  if (Math.abs(splitByLine[k] - 100) > 0.01) bad.push('linea ' + k + ': las participaciones suman ' + splitByLine[k] + '% en vez de 100%');
  let cedido = 0;
  let sumaCedida = 0;
  let comision = 0;
  let impuesto = 0;
  for (let i = 0; i < wanted.length; i++) {
    const w = wanted[i];
    const wk = Number(w.contractId || 0) + '|' + txt(w.lineId) + '|' + txt(w.coverageCode);
    if (wk === k) { cedido = money(w.premiumRe); sumaCedida = money(w.sumInsuredRe); comision = money(w.commission); impuesto = money(w.tax); }
  }
  if (Math.abs(premiumByLine[k] - cedido) > 0.011) bad.push('linea ' + k + ': las primas de los aceptantes suman ' + premiumByLine[k] + ' y el cedido confirmado es ' + cedido);
  if (Math.abs(sumByLine[k] - sumaCedida) > 0.011) bad.push('linea ' + k + ': las sumas de los aceptantes suman ' + sumByLine[k] + ' y la suma cedida confirmada es ' + sumaCedida);
  if (Math.abs(commissionByLine[k] - comision) > 0.011) bad.push('linea ' + k + ': las comisiones de los aceptantes suman ' + commissionByLine[k] + ' y la comision confirmada es ' + comision);
  if (Math.abs(taxByLine[k] - impuesto) > 0.011) bad.push('linea ' + k + ': los impuestos de los aceptantes suman ' + taxByLine[k] + ' y el impuesto confirmado es ' + impuesto);
}
if (bad.length) {
  return {
    ok: false, stage: 'VALIDATION', corrected: 0, changeId: changeId, policyId: policyId,
    msg: 'La distribucion confirmada no es valida y no se escribio nada: ' + bad.join('; '),
    errors: bad
  };
}
trace.push('distribucion confirmada validada: ' + wanted.length + ' lineas' + (wantedParts.length ? ' y ' + wantedParts.length + ' participaciones' : ''));

// ---------- filas del movimiento, y solo del movimiento ----------
doCmd({ cmd: 'LoadEntities', data: { entity: 'Cession', filter: 'changeId = ' + changeId, noTracking: true } });
const live = LoadEntities.outData || [];
if (!live.length) {
  return {
    ok: false, stage: 'CESSION', corrected: 0, changeId: changeId, policyId: policyId,
    msg: 'El endoso ' + changeId + ' no dejo cesion del movimiento que corregir. El endoso no se revierte (supuesto 8: error trazable).'
  };
}
const ids = [];
for (let i = 0; i < live.length; i++) ids.push(Number(live[i].id));
doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT id, cessionId, contactId, split, sumInsured, premium, commission, tax, brokerId FROM CessionPart WHERE cessionId IN (' + ids.join(',') + ')' } });
const liveParts = DoQuery.outData || [];

// ---------- bajas: aceptantes del movimiento que la distribucion confirmada ya no incluye ----------
const removed = [];
for (let i = 0; i < liveParts.length; i++) {
    const cur = liveParts[i];
    let source = null;
    for (let k = 0; k < live.length; k++) { if (Number(live[k].id) === Number(cur.cessionId)) source = live[k]; }
    const cov = source ? txt(source.coverageCode) : '';
    const line = source ? txt(source.lineId) : '';
    const contract = source ? Number(source.contractId || 0) : 0;
    let keep = false;
    for (let k = 0; k < wantedParts.length; k++) {
      if (txt(wantedParts[k].coverageCode) !== cov) continue;
      if (txt(wantedParts[k].lineId) !== line) continue;
      if (Number(wantedParts[k].contractId || 0) !== contract) continue;
      if (Number(wantedParts[k].contactId) !== Number(cur.contactId)) continue;
      if (wantedParts[k].brokerId != null && Number(wantedParts[k].brokerId || 0) !== Number(cur.brokerId || 0)) continue;
      keep = true;
    }
    if (keep) continue;
    doCmd({ cmd: 'LoadEntities', data: { entity: 'CessionPart', filter: 'id = ' + Number(cur.id), noTracking: true } });
    const full = (LoadEntities.outData || [])[0];
    if (!full) { failed.push('aceptante ' + cur.contactId + ': no se pudo leer la participacion ' + cur.id + ' para retirarla'); continue; }
    doCmd({ cmd: 'RepoCessionPart', data: { operation: 'DELETE', entity: full } });
    if (!RepoCessionPart.ok) { failed.push('retiro del aceptante ' + cur.contactId + ' (participacion ' + cur.id + '): ' + RepoCessionPart.msg); continue; }
    removed.push({ partId: Number(cur.id), cessionId: Number(cur.cessionId), contactId: Number(cur.contactId) });
}
if (removed.length) trace.push('participaciones retiradas del movimiento: ' + removed.length);

// ---------- una escritura por cesion: importes confirmados + aceptantes confirmados ----------
const written = [];
const parts = [];
for (let i = 0; i < wanted.length; i++) {
  const w = wanted[i];
  let row = null;
  for (let k = 0; k < live.length; k++) {
    const c = live[k];
    if (Number(c.contractId) !== Number(w.contractId)) continue;
    if (txt(c.lineId) !== txt(w.lineId)) continue;
    if (txt(c.coverageCode) !== txt(w.coverageCode)) continue;
    row = c;
  }
  if (!row) { failed.push('contrato ' + w.contractId + ' linea ' + txt(w.lineId) + ' cobertura ' + txt(w.coverageCode) + ': no hay cesion del movimiento'); continue; }
  const before = { sumInsured: money(row.sumInsured), sumInsuredCedant: money(row.sumInsuredCedant), sumInsuredRe: money(row.sumInsuredRe), premium: money(row.premium), premiumCedant: money(row.premiumCedant), premiumRe: money(row.premiumRe), comissionCedant: money(row.comissionCedant), tax: money(row.tax) };
  const after = { sumInsured: w.sumInsuredMovement === undefined ? before.sumInsured : money(w.sumInsuredMovement), sumInsuredCedant: w.sumInsuredCedant === undefined ? before.sumInsuredCedant : money(w.sumInsuredCedant), sumInsuredRe: w.sumInsuredRe === undefined ? before.sumInsuredRe : money(w.sumInsuredRe), premium: money(w.premiumMovement), premiumCedant: money(w.premiumCedant), premiumRe: money(w.premiumRe), comissionCedant: w.commission === undefined ? before.comissionCedant : money(w.commission), tax: w.tax === undefined ? before.tax : money(w.tax) };

  const children = [];
  let childChanged = false;
  for (let k = 0; k < wantedParts.length; k++) {
    const p = wantedParts[k];
    if (Number(p.contractId || 0) !== Number(w.contractId || 0)) continue;
    if (txt(p.lineId) !== txt(w.lineId)) continue;
    if (txt(p.coverageCode) !== txt(w.coverageCode)) continue;
    let existing = null;
    for (let j = 0; j < liveParts.length; j++) {
      if (Number(liveParts[j].cessionId) !== Number(row.id)) continue;
      if (Number(liveParts[j].contactId) !== Number(p.contactId)) continue;
      if (p.brokerId != null && Number(liveParts[j].brokerId || 0) !== Number(p.brokerId || 0)) continue;
      existing = liveParts[j];
    }
    const child = {
      id: existing ? Number(existing.id) : 0, cessionId: Number(row.id), contactId: Number(p.contactId),
      lineId: txt(p.lineId) || txt(row.lineId), split: Number(p.split),
      sumInsured: money(p.sumInsured), premium: money(p.premium), commission: p.commission === undefined ? 0 : money(p.commission),
      tax: p.tax === undefined ? 0 : money(p.tax), currency: txt(row.currency), liquidationId: null, reserve: 0,
      brokerId: p.brokerId == null ? null : Number(p.brokerId), Broker: null, fee: 0, jAmounts: null
    };
    children.push(child);
    const cambia = !existing || Number(existing.split) !== child.split || money(existing.sumInsured) !== child.sumInsured || money(existing.premium) !== child.premium || money(existing.commission) !== child.commission || money(existing.tax) !== child.tax || Number(existing.brokerId || 0) !== Number(child.brokerId || 0);
    if (cambia) childChanged = true;
    parts.push({ partId: child.id, cessionId: Number(row.id), contactId: child.contactId, added: !existing, changed: cambia, values: { split: child.split, premium: child.premium, commission: child.commission } });
  }

  const amountsChanged = before.sumInsured !== after.sumInsured || before.sumInsuredCedant !== after.sumInsuredCedant || before.sumInsuredRe !== after.sumInsuredRe || before.premium !== after.premium || before.premiumCedant !== after.premiumCedant || before.premiumRe !== after.premiumRe || before.comissionCedant !== after.comissionCedant || before.tax !== after.tax;
  if (!amountsChanged && !childChanged) { written.push({ cessionId: Number(row.id), coverageCode: txt(w.coverageCode), changed: false, values: after }); continue; }

  const entity = JSON.parse(JSON.stringify(row));
  entity.sumInsured = after.sumInsured;
  entity.sumInsuredCedant = after.sumInsuredCedant;
  entity.sumInsuredRe = after.sumInsuredRe;
  entity.premium = after.premium;
  entity.premiumCedant = after.premiumCedant;
  entity.premiumRe = after.premiumRe;
  entity.comissionCedant = after.comissionCedant;
  entity.participantCommission = after.comissionCedant;
  entity.tax = after.tax;
  // 🔴 la unica via que escribe `split`: la coleccion hija de la propia cesion
  if (children.length) entity.Participants = children;
  doCmd({ cmd: 'RepoCession', data: { operation: 'UPDATE', entity: entity, ignoreInterceptor: true } });
  if (!RepoCession.ok) { failed.push('cesion ' + row.id + ' (' + txt(w.coverageCode) + '): ' + RepoCession.msg); continue; }
  written.push({ cessionId: Number(row.id), coverageCode: txt(w.coverageCode), changed: true, before: before, values: after, participants: children.length });
}

// ---------- relectura y comprobacion EXACTA ----------
doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT id, contractId, lineId, coverageCode, sumInsured, sumInsuredCedant, sumInsuredRe, premium, premiumCedant, premiumRe, comissionCedant, tax FROM Cession WHERE changeId=' + changeId } });
const back = DoQuery.outData || [];
const mismatch = [];
for (let i = 0; i < wanted.length; i++) {
  const w = wanted[i];
  let hit = null;
  for (let k = 0; k < back.length; k++) {
    const c = back[k];
    if (Number(c.contractId) !== Number(w.contractId)) continue;
    if (txt(c.lineId) !== txt(w.lineId)) continue;
    if (txt(c.coverageCode) !== txt(w.coverageCode)) continue;
    hit = c;
  }
  if (!hit) { mismatch.push('cobertura ' + txt(w.coverageCode) + ': no quedo cesion'); continue; }
  if (money(w.sumInsuredMovement) !== money(hit.sumInsured)) mismatch.push('cobertura ' + txt(w.coverageCode) + ': suma del movimiento confirmada ' + money(w.sumInsuredMovement) + ' y escrita ' + money(hit.sumInsured));
  if (money(w.sumInsuredCedant) !== money(hit.sumInsuredCedant)) mismatch.push('cobertura ' + txt(w.coverageCode) + ': suma retenida confirmada ' + money(w.sumInsuredCedant) + ' y escrita ' + money(hit.sumInsuredCedant));
  if (money(w.sumInsuredRe) !== money(hit.sumInsuredRe)) mismatch.push('cobertura ' + txt(w.coverageCode) + ': suma cedida confirmada ' + money(w.sumInsuredRe) + ' y escrita ' + money(hit.sumInsuredRe));
  if (money(w.premiumMovement) !== money(hit.premium)) mismatch.push('cobertura ' + txt(w.coverageCode) + ': movimiento confirmado ' + money(w.premiumMovement) + ' y escrito ' + money(hit.premium));
  if (money(w.premiumCedant) !== money(hit.premiumCedant)) mismatch.push('cobertura ' + txt(w.coverageCode) + ': retencion confirmada ' + money(w.premiumCedant) + ' y escrita ' + money(hit.premiumCedant));
  if (money(w.premiumRe) !== money(hit.premiumRe)) mismatch.push('cobertura ' + txt(w.coverageCode) + ': cedido confirmado ' + money(w.premiumRe) + ' y escrito ' + money(hit.premiumRe));
  if (money(w.commission) !== money(hit.comissionCedant)) mismatch.push('cobertura ' + txt(w.coverageCode) + ': comision confirmada ' + money(w.commission) + ' y escrita ' + money(hit.comissionCedant));
  if (money(w.tax) !== money(hit.tax)) mismatch.push('cobertura ' + txt(w.coverageCode) + ': impuesto confirmado ' + money(w.tax) + ' y escrito ' + money(hit.tax));
}
const ids2 = [];
for (let i = 0; i < back.length; i++) ids2.push(Number(back[i].id));
doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT id, cessionId, contactId, split, sumInsured, premium, commission, tax, brokerId FROM CessionPart WHERE cessionId IN (' + ids2.join(',') + ')' } });
const backParts = DoQuery.outData || [];
if (wantedParts.length) {
  for (let i = 0; i < wantedParts.length; i++) {
    const w = wantedParts[i];
    let cession = null;
    for (let k = 0; k < back.length; k++) {
      if (Number(back[k].contractId || 0) !== Number(w.contractId || 0)) continue;
      if (txt(back[k].lineId) !== txt(w.lineId)) continue;
      if (txt(back[k].coverageCode) === txt(w.coverageCode)) cession = back[k];
    }
    if (!cession) continue;
    let hit = null;
    for (let k = 0; k < backParts.length; k++) {
      if (Number(backParts[k].cessionId) !== Number(cession.id)) continue;
      if (Number(backParts[k].contactId) !== Number(w.contactId)) continue;
      hit = backParts[k];
    }
    if (!hit) { mismatch.push('aceptante ' + w.contactId + ' de ' + txt(w.coverageCode) + ': no quedo participacion'); continue; }
    if (Number(w.split) !== Number(hit.split)) mismatch.push('aceptante ' + w.contactId + ' de ' + txt(w.coverageCode) + ': participacion confirmada ' + w.split + '% y escrita ' + hit.split + '%');
    if (w.brokerId != null && Number(w.brokerId || 0) !== Number(hit.brokerId || 0)) mismatch.push('aceptante ' + w.contactId + ' de ' + txt(w.coverageCode) + ': corredor confirmado ' + w.brokerId + ' y escrito ' + hit.brokerId);
    if (money(w.sumInsured) !== money(hit.sumInsured)) mismatch.push('aceptante ' + w.contactId + ' de ' + txt(w.coverageCode) + ': suma confirmada ' + money(w.sumInsured) + ' y escrita ' + money(hit.sumInsured));
    if (money(w.premium) !== money(hit.premium)) mismatch.push('aceptante ' + w.contactId + ' de ' + txt(w.coverageCode) + ': prima confirmada ' + money(w.premium) + ' y escrita ' + money(hit.premium));
    if (money(w.commission) !== money(hit.commission)) mismatch.push('aceptante ' + w.contactId + ' de ' + txt(w.coverageCode) + ': comision confirmada ' + money(w.commission) + ' y escrita ' + money(hit.commission));
    if (money(w.tax) !== money(hit.tax)) mismatch.push('aceptante ' + w.contactId + ' de ' + txt(w.coverageCode) + ': impuesto confirmado ' + money(w.tax) + ' y escrito ' + money(hit.tax));
  }
  for (let k = 0; k < backParts.length; k++) {
    const cur = backParts[k];
      let cov = '';
      let line = '';
      let contract = 0;
      for (let j = 0; j < back.length; j++) {
        if (Number(back[j].id) !== Number(cur.cessionId)) continue;
        cov = txt(back[j].coverageCode);
        line = txt(back[j].lineId);
        contract = Number(back[j].contractId || 0);
      }
      let esperado = false;
      for (let j = 0; j < wantedParts.length; j++) {
      if (txt(wantedParts[j].coverageCode) !== cov) continue;
      if (txt(wantedParts[j].lineId) !== line) continue;
      if (Number(wantedParts[j].contractId || 0) !== contract) continue;
      if (Number(wantedParts[j].contactId) !== Number(cur.contactId)) continue;
      esperado = true;
    }
    if (!esperado) mismatch.push('aceptante ' + cur.contactId + ' de ' + cov + ': quedo una participacion que la distribucion confirmada no incluye');
  }
}

if (failed.length || mismatch.length) {
  return {
    ok: false, stage: 'APPLY', exact: false, changeId: changeId, policyId: policyId,
    written: written, participants: parts, removed: removed,
    persistedDistribution: back, persistedParticipants: backParts,
    errors: failed.concat(mismatch),
    msg: 'ATENCION: el endoso ' + changeId + ' esta aplicado y la distribucion confirmada NO quedo escrita exacta: ' + failed.concat(mismatch).join('; ') + '. El endoso no se revierte (supuesto 8: error trazable).',
    trace: trace
  };
}

let changed = 0;
for (let i = 0; i < written.length; i++) { if (written[i].changed) changed++; }
trace.push('cesiones escritas con los importes confirmados: ' + changed);
trace.push('relectura: la cesion y las participaciones escritas son identicas a las confirmadas, sin tolerancia');

return {
  ok: true,
  exact: true,
  stage: 'APPLIED',
  changeId: changeId,
  policyId: policyId,
  corrected: changed,
  written: written,
  participants: parts,
  removed: removed,
  persistedDistribution: back,
  persistedParticipants: backParts,
  trace: trace,
  msg: 'La distribucion confirmada quedo escrita exacta en el movimiento ' + changeId + (changed ? ' (' + changed + ' cesion(es) escrita(s) con los importes y aceptantes confirmados).' : ' (ya coincidia).')
};
