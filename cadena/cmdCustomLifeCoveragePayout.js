//block
//noreplace
/*
 * @name cmdCustomLifeCoveragePayout
 * @version 1
 * @purpose Crea un pago de LifeCoveragePayout sin que la regla nativa asigne el
 *          deducible al primer movimiento. Se usa únicamente para coberturas
 *          que tienen deducible; el movimiento queda pendiente (status 0) y
 *          la vista lo aprueba posteriormente con DoPayment.
 *
 * Contexto aceptado:
 * {
 *   claimId, lifePolicyId, lifeCoverageId, amount, concept,
 *   jAffectedObjects, entity: { ... }
 * }
 */

const input = context || {};
const source = input.entity && typeof input.entity === 'object' ? input.entity : input;

try {
  const claimId = positiveId(first(source.claimId, input.claimId));
  const policyId = positiveId(first(source.lifePolicyId, input.lifePolicyId));
  const coverageId = positiveId(first(source.lifeCoverageId, input.lifeCoverageId));
  const amount = money(first(source.amount, source.payed, input.amount));
  const concept = String(first(source.concept, input.concept) || '').trim();
  const affectedObjects = first(source.jAffectedObjects, input.jAffectedObjects);

  if (!claimId || !policyId || !coverageId) {
    return fail('claimId, lifePolicyId y lifeCoverageId son obligatorios.');
  }
  if (amount === null || amount === 0) return fail('El monto del pago no puede ser cero.');
  if (!concept) return fail('El concepto del pago es obligatorio.');

  const claim = loadOne('Claim', 'id,lifePolicyId', 'id = ' + claimId);
  if (!claim) return fail('No se encontró el reclamo ' + claimId + '.');
  if (Number(claim.lifePolicyId) !== policyId) return fail('La póliza no corresponde al reclamo.');

  const policy = loadOne('LifePolicy', 'id,currency', 'id = ' + policyId);
  if (!policy) return fail('No se encontró la póliza ' + policyId + '.');
  const currency = String(policy.currency || '').trim().toUpperCase();
  if (!currency) return fail('La póliza no tiene una moneda válida.');

  const coverage = loadOne('LifeCoverage', 'id,lifePolicyId,deductible',
    'id = ' + coverageId + ' AND lifePolicyId = ' + policyId);
  if (!coverage) return fail('La cobertura no corresponde a la póliza.');
  const deductible = money(coverage.deductible);
  if (deductible === null || deductible <= 0) {
    return fail('Este comando solo aplica a coberturas con deducible mayor que cero.');
  }

  const entity = {
    operation: 'PAY',
    lifePolicyId: policyId,
    claimId: claimId,
    lifeCoverageId: coverageId,
    amount: amount,
    reserved: -amount,
    payed: amount,
    concept: concept,
    status: 0,
    requestedAmount: 0,
    deductible: 0,
    reserveType: 'IN',
    currency: currency,
    expenseType: null,
    parentCode: null,
    jAffectedObjects: affectedObjects == null ? null : String(affectedObjects)
  };

  const period = validateOpenPeriod(entity);
  if (!period.ok) return period;

  const balances = loadBalances(claimId, coverageId);
  if (amount > 0 && amount > balances.coverageBalance) {
    return fail('El monto supera el saldo reservado disponible de la cobertura. Disponible: ' + formatMoney(balances.coverageBalance) + '.');
  }
  if (amount > 0 && amount > balances.claimBalance) {
    return fail('El monto supera el saldo disponible del reclamo. Disponible: ' + formatMoney(balances.claimBalance) + '.');
  }

  const sql = 'INSERT INTO LifeCoveragePayout '
    + '(lifeCoverageId, [date], [user], reserved, payed, concept, claimId, lifePolicyId, status, requestedAmount, deductible, reserveType, parentCode, expenseType, jAffectedObjects, originalAmount, currency) '
    + 'VALUES (' + coverageId + ', GETUTCDATE(), ' + sqlText(currentUser()) + ', '
    + sqlNumber(-amount) + ', ' + sqlNumber(amount) + ', ' + sqlText(concept) + ', '
    + claimId + ', ' + policyId + ', 0, 0, 0, ' + sqlText('IN') + ', NULL, NULL, '
    + (entity.jAffectedObjects == null ? 'NULL' : sqlText(entity.jAffectedObjects)) + ', ' + sqlNumber(Math.abs(amount)) + ', ' + sqlText(currency) + '); '
    + 'SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;';

  doCmd({ cmd: 'DoQuery', data: { sql: sql } });
  if (!DoQuery || DoQuery.ok === false) return fail(DoQuery && DoQuery.msg || 'No fue posible crear el pago personalizado.');
  const row = Array.isArray(DoQuery.outData) ? DoQuery.outData[0] : DoQuery.outData;
  const id = positiveId(row && row.id);
  if (!id) return fail('El pago se insertó sin un identificador verificable.');

  return {
    ok: true,
    id: id,
    claimId: claimId,
    lifePolicyId: policyId,
    lifeCoverageId: coverageId,
    amount: amount,
    deductible: 0,
    status: 0,
    coverageBalanceBefore: balances.coverageBalance,
    claimBalanceBefore: balances.claimBalance,
    msg: 'Pago personalizado creado sin aplicar deducible. Queda pendiente de aprobación.'
  };
} catch (error) {
  return fail(error && error.message ? error.message : String(error));
}

function loadOne(entity, fields, filter) {
  doCmd({ cmd: 'LoadEntity', data: { entity: entity, fields: fields, filter: filter, noTracking: true } });
  return LoadEntity && LoadEntity.ok !== false ? LoadEntity.outData || null : null;
}

function loadBalances(claimId, coverageId) {
  doCmd({ cmd: 'LoadEntities', data: {
    entity: 'LifeCoveragePayout',
    fields: 'claimId,lifeCoverageId,status,reserved,payed,reserveType',
    filter: 'claimId = ' + claimId + ' AND status <> 2 AND reserveType = \'IN\'',
    noTracking: true
  } });
  const rows = LoadEntities && Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
  const balance = (items) => round2(items.reduce((total, row) => {
    const status = Number(row.status);
    if (status === 0 || status === 1) return total + number(row.reserved);
    if (status === 3) return total - number(row.payed);
    return total;
  }, 0));
  return {
    coverageBalance: balance(rows.filter((row) => Number(row.lifeCoverageId) === coverageId)),
    claimBalance: balance(rows)
  };
}

function validateOpenPeriod(entity) {
  doCmd({ cmd: 'ExeChain', data: {
    chain: 'cmdValidaPeriodoContableAbierto',
    context: JSON.stringify({
      origin: { cmd: 'RepoLifeCoveragePayout', data: { operation: 'ADD', entity: entity } },
      sysOrganization: input.sysOrganization || null,
      fechaPrueba: input.fechaPrueba || null
    })
  } });
  const result = ExeChain && ExeChain.outData ? ExeChain.outData : ExeChain;
  return result && result.ok === false
    ? { ok: false, msg: result.msg || 'El período contable está cerrado.' }
    : { ok: true };
}

function currentUser() {
  return first(input.user, input.usuario, input.userName, input.email, '');
}

function first() {
  for (let i = 0; i < arguments.length; i += 1) {
    if (arguments[i] !== null && arguments[i] !== undefined && arguments[i] !== '') return arguments[i];
  }
  return null;
}

function positiveId(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? round2(n) : null;
}

function round2(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }

function formatMoney(value) { return round2(value).toFixed(2); }

function sqlNumber(value) { return formatMoney(value); }

function sqlText(value) { return value == null ? 'NULL' : "N'" + String(value).replace(/'/g, "''") + "'"; }

function fail(message) { return { ok: false, msg: message }; }
