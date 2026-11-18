//block
//noreplace
/**
 * @name cmdCuotasPersonalizadasFechas
 * @created 2026-11-05 MSN-000152 / AXX-7663 (globaluat)
 * @updated 2026-11-18 MSN-000205 / AXX-10332: Prima mensual = Total anual ÷ N
 * Fechas del plan con «Duración del pago» = Personalizado (N cuotas) que genera la regla
 * «Cuotas personalizadas (Duración del pago) MSN-000152» del esquema 7 INC0001.
 * El esquema regenera las N cuotas un período después del inicio y la regla las corre un período atrás:
 * en inicios de fin de mes la primera queda antes del inicio, y la cobertura de cada cuota queda un período
 * más larga. Aquí: primera cuota en la fecha de inicio, cada vencimiento un período después del
 * anterior (suma secuencial, como el plan nativo: 31/01 -> 28/02 -> 28/03), cada cuota cubierta hasta el
 * vencimiento siguiente y la última hasta el fin de la vigencia o del primer año, lo que llegue antes
 * (si vence después, un período: ese plan no cabe en la vigencia y la validación de emisión lo bloquea).
 * Una póliza sin emitir tiene un solo año de plan: si el plan vigente no tiene exactamente N cuotas, no aplica.
 * No toca los montos de las cuotas. Sí deja la «Prima mensual» de Facturación (cuota modal de la póliza) en
 * Total anual ÷ N redondeado a 2 decimales, como cada cuota del plan: la cotización la calcula con los pagos
 * naturales de la periodicidad (mensual = 12) aunque el plan tenga N cuotas (MSN-000205).
 * Sólo pólizas sin emitir, del esquema 7 (las fechas, además, sin cuotas pagadas) y cuando aplica esa regla:
 * mismo predicado, y se excluyen los casos de las reglas anteriores (EG6 mensual, AXX-1083; la regla
 * Automatic Installment depende de una cadena que no existe en globaluat y, si aplicara, su plan no tendría N cuotas).
 * Contexto: {origin} de los post-triggers de QuotePolicy (save) y MakePayPlan.
 * Responde {ok:true, skipped:true} si no aplica, {ok:true, changed, plan, installment} si aplica
 * (installment = Prima mensual que quedó en la póliza) y {ok:false, msg} si falla. No lanza.
 */
const input = context || {};
const original = input.origin || {};
const fromQuote = original.cmd === 'QuotePolicy';
const quoted = fromQuote ? (original.outData || [])[0] : null;
const policyId = Number(quoted ? quoted.id : (original.data || {}).policyId);
const skip = msg => ({ok: true, skipped: true, policyId: policyId, msg: msg});
try {
  if (!Number.isInteger(policyId) || policyId <= 0) return skip('Sin póliza');
  if (fromQuote && !(original.data || {}).save) return skip('Cotización sin guardar');

  doCmd({cmd: 'LoadEntities', data: {entity: 'LifePolicy', fields: 'id,productCode,periodicity,paymentDuration,activeDate,active,start,[end],installmentSchemeId,anualTotal,installment', filter: 'id=' + policyId, noTracking: true}});
  if (!LoadEntities.ok || !LoadEntities.outData || LoadEntities.outData.length !== 1) return {ok: false, policyId: policyId, msg: 'No se pudo leer la póliza ' + policyId};
  const pol = LoadEntities.outData[0];
  if (pol.active || pol.activeDate) return skip('Póliza emitida');
  if (Number(pol.installmentSchemeId) !== 7) return skip('Otro esquema de cuotas');
  if (!pol.start) return skip('Póliza sin fecha de inicio');

  // mismo predicado que la condición de la regla del esquema
  const per = String(pol.periodicity || '');
  const unit = per.length > 1 ? parseInt(per.substring(1), 10) : 0;
  const kind = per.charAt(0);
  const base = kind === 'm' ? 12 : kind === 'q' ? 4 : kind === 's' ? 2 : 0;
  const yearly = per.length > 1 ? Math.trunc(base / (unit || 1)) : base;
  const qty = Number(pol.paymentDuration);
  const natural = per === 'm1' ? 10 : yearly;
  if (!(Number.isInteger(qty) && qty > 0 && yearly > 1 && qty !== natural)) return skip('No es un plan de cuotas personalizadas');
  // reglas anteriores del esquema: si alguna aplica, el plan no es de esta regla
  if (pol.productCode === 'EG6' && per === 'm') return skip('EG6 mensual: regla propia');
  doCmd({cmd: 'ExeChain', data: {chain: 'cmdRenewalKeepRestructuredPlanAxx1083', context: JSON.stringify({id: policyId})}});
  if (ExeChain.ok && ExeChain.outData && ExeChain.outData.ok === true) return skip('Renovación con plan reestructurado (AXX-1083)');

  doCmd({cmd: 'LoadEntities', data: {entity: 'PayPlan', fields: '*', filter: 'lifePolicyId=' + policyId + ' AND cancellationDate IS NULL', noTracking: true}});
  if (!LoadEntities.ok) return {ok: false, policyId: policyId, msg: 'No se pudo leer el plan de cuotas de la póliza ' + policyId};
  const rows = (LoadEntities.outData || []).sort((a, b) => a.contractYear - b.contractYear || a.numberInYear - b.numberInYear);
  if (rows.length !== qty) return skip('El plan tiene ' + rows.length + ' cuotas y no ' + qty);

  // Prima mensual = Total anual ÷ N, en centavos y redondeo al alejarse de cero, como el cálculo de la cotización
  const cents = Math.round(Number(pol.anualTotal || 0) * 100);
  const modalCents = (cents < 0 ? -1 : 1) * Math.floor((2 * Math.abs(cents) + qty) / (2 * qty));
  const modal = modalCents / 100;
  let installment = Number(pol.installment);
  if (Math.round(installment * 100) !== modalCents) {
    doCmd({cmd: 'SetPolicyField', data: {policyId: policyId, fieldValue: 'installment=' + modal.toFixed(2)}});
    if (!SetPolicyField.ok) return {ok: false, policyId: policyId, msg: 'No se pudo ajustar la Prima mensual de la póliza ' + policyId + ': ' + SetPolicyField.msg};
    installment = modal;
  }
  if (rows.some(x => Number(x.payed) > 0)) return {ok: true, skipped: true, policyId: policyId, installment: installment, msg: 'Hay cuotas con pagos'};

  const toDate = v => { const s = String(v); return new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(s) ? s : s + 'Z'); };
  const addMonths = (d, m) => {
    const r = new Date(d.getTime());
    const day = r.getUTCDate();
    r.setUTCDate(1);
    r.setUTCMonth(r.getUTCMonth() + m);
    const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
    r.setUTCDate(Math.min(day, last));
    return r;
  };
  const months = kind === 'm' ? (unit || 1) : kind === 'q' ? (unit || 3) : (unit || 6);
  const start = toDate(pol.start);
  const yearEnd = addMonths(start, 12);
  const end = pol.end ? toDate(pol.end) : null;
  const termEnd = end && end.getTime() < yearEnd.getTime() ? end : yearEnd;
  const due = [start];
  for (let i = 1; i < qty; i++) due.push(addMonths(due[i - 1], months));
  const lastDue = due[qty - 1];
  const until = due.map((d, i) => i + 1 < qty ? due[i + 1] : (lastDue.getTime() <= termEnd.getTime() ? termEnd : addMonths(lastDue, months)));

  const same = (a, b) => a != null && toDate(a).getTime() === b.getTime();
  let changed = 0;
  for (let i = 0; i < qty; i++) {
    const row = rows[i];
    if (same(row.dueDate, due[i]) && same(row.normalDueDate, due[i]) && same(row.coveredUntil, until[i])) continue;
    row.dueDate = due[i].toISOString();
    row.normalDueDate = row.dueDate;
    row.coveredUntil = until[i].toISOString();
    delete row.LifePolicy;
    doCmd({cmd: 'RepoPayPlan', data: {operation: 'UPDATE', entity: row}});
    if (!RepoPayPlan.ok) return {ok: false, policyId: policyId, changed: changed, installment: installment, msg: 'No se pudo ajustar la cuota ' + row.numberInYear + ': ' + RepoPayPlan.msg};
    changed++;
  }
  // el resultado lleva los detalles de la respuesta original para que la pantalla los siga mostrando
  const originalRows = fromQuote ? ((quoted && quoted.PayPlan) || []) : (original.outData || []);
  for (const row of rows) {
    const match = originalRows.find(x => x.id === row.id);
    if (match) row.PayPlanDetail = match.PayPlanDetail;
  }
  return {ok: true, policyId: policyId, changed: changed, plan: rows, installment: installment, msg: 'Cuotas personalizadas: ' + qty + ' cuotas, ' + changed + ' fechas ajustadas, Prima mensual ' + installment.toFixed(2)};
} catch (ex) {
  return {ok: false, policyId: policyId, msg: 'No se pudieron ajustar las cuotas personalizadas: ' + (ex && ex.message ? ex.message : ex)};
}
