//block
//noreplace

/**
 * @author Noel Obando
 * @created 2025-12-26
 * @name cmdEmisionIncendioContext
 * @version 1.1
 * @purpose Builds accounting context data for fire issuance and endorsements.
 * @param context.id Policy, change or anniversary identifier.
 * @param context.tipo 0: issuance, 1: cancellation, 2: renewal, 3: insured sum change,
 *                     4: insured object change, 5: loading change.
 */

try {
  const input = context || {};
  const id = toPositiveInteger(input.id);
  const tipo = toInteger(input.tipo, 0);

  validateInput(id, tipo);

  const policy = loadPolicy(buildPolicyFilter(id, tipo));
  if (!policy) {
    throw new Error(`No se encontro la poliza relacionada con el identificador ${id}`);
  }

  const titles = {
    0: 'Emision',
    1: 'Cancelacion',
    2: 'Renovacion',
    3: 'Endoso Suma Asegurada',
    4: 'Endoso Objeto Asegurado',
    5: 'Endoso de Recargo'
  };

  const codes = {
    0: 'EmisionIncendio',
    1: 'CancelacionIncendio',
    2: 'RenovacionIncendio',
    3: 'EndosoSA',
    4: 'EndosoObjetoAsegurado',
    5: 'EndosoRecargo'
  };

  let primaPorCobrar = 0;
  let prima = 0;
  let impuestoPrimasIncendio = 0;
  let gastoPrimaIncendio = 0;
  let cancelacion = false;
  let renovacion = false;
  let cancellationTax = 0;
  let nonCancellationTax = 0;

  const changes = asArray(policy.Changes);
  const change = findChange(changes, id);

  if ([0, 1, 2].includes(tipo)) {
    const baseCoverages = safeJson(change && change.jDetail, {});
    prima = toNumber(baseCoverages.coveragesDif);

    const taxRows = asArray(policy.TaxGenerated);
    cancellationTax = sumTaxRows(taxRows, true);
    nonCancellationTax = sumTaxRows(taxRows, false);
    impuestoPrimasIncendio = toDecimal(cancellationTax - nonCancellationTax);
    gastoPrimaIncendio = toDecimal(prima * 0.02);
    primaPorCobrar = toDecimal(prima + impuestoPrimasIncendio);
    cancelacion = tipo === 1;
    renovacion = tipo === 2;
  } else {
    if (!change) {
      throw new Error(`No se encontro el endoso ${id}`);
    }

    const billDiff = change.BillDiff || null;
    if (!billDiff) {
      prima = toNumber(policy.coverages);
      impuestoPrimasIncendio = sumTaxRows(asArray(policy.TaxGenerated), null);
      primaPorCobrar = toDecimal(prima + impuestoPrimasIncendio);
      gastoPrimaIncendio = toDecimal(prima * 0.02);
    } else {
      const billCoverages = toNumber(billDiff.coverages);
      const billTax = toNumber(billDiff.tax);
      primaPorCobrar = Math.abs(toDecimal(billCoverages + billTax));
      gastoPrimaIncendio = Math.abs(toDecimal(billDiff.fee));
      impuestoPrimasIncendio = Math.abs(toDecimal(billTax));
      prima = Math.abs(toDecimal(billCoverages));
      cancelacion = billCoverages < 0;
    }
  }

  const cessions = getReinsuranceCessions(policy.id, tipo);
  const reaseguroCedido = toDecimal(
    cessions.reduce((total, item) => total + toNumber(item.premiumRe), 0)
  );
  const reaseguroComision = toDecimal(
    cessions.reduce((total, item) => total + toNumber(item.comissionCedant), 0)
  );
  const reaseguroPorPagar = toDecimal(reaseguroCedido - reaseguroComision);
  const title = titles[tipo];
  const productName = policy.Product && policy.Product.name
    ? String(policy.Product.name)
    : '';
  const policyCode = String(policy.code || '');

  return [{
    primaPorCobrar: absoluteAmount(primaPorCobrar),
    prima: absoluteAmount(prima),
    impuestoPrimasIncendio: absoluteAmount(impuestoPrimasIncendio),
    gastoPrimaIncendio: absoluteAmount(gastoPrimaIncendio),
    cancellationTax: absoluteAmount(cancellationTax),
    nonCancellationTax: absoluteAmount(nonCancellationTax),
    daniosPorPagar: absoluteAmount(gastoPrimaIncendio),
    commisiones: absoluteAmount(policy.commissions),
    reservasPorPagar: absoluteAmount(policy.commissions),
    reaseguroCedido: absoluteAmount(reaseguroCedido),
    reaseguroComision: absoluteAmount(reaseguroComision),
    reaseguroPorPagar: absoluteAmount(reaseguroPorPagar),
    anioMes: getAnioMes(policy),
    reference: `${title} Incendio # ${id}`,
    description: `${title} ${productName} Poliza # ${policyCode}`,
    unique: `TX${cancelacion ? '-R' : ''}# ${id}`,
    code: codes[tipo],
    cancelacion: cancelacion,
    renovacion: renovacion,
    Policy: policy
  }];
} catch (error) {
  return {
    ok: false,
    msg: getErrorMessage(error)
  };
}

function validateInput(id, tipo) {
  if (id <= 0) {
    throw new Error('El identificador recibido no es valido');
  }

  if (![0, 1, 2, 3, 4, 5].includes(tipo)) {
    throw new Error('El tipo de contexto no es valido');
  }
}

function buildPolicyFilter(id, tipo) {
  if (tipo === 0) {
    return `id=${id}`;
  }

  if ([1, 3, 4, 5].includes(tipo)) {
    return `id IN (SELECT lifePolicyId FROM [Change] WHERE id=${id})`;
  }

  return `id IN (SELECT lifePolicyId FROM [Anniversary] WHERE id=${id})`;
}

function loadPolicy(filter) {
  doCmd({
    cmd: 'RepoLifePolicy',
    data: {
      operation: 'GET',
      noTracking: true,
      filter: filter,
      include: ['TaxGenerated', 'Fees', 'Product', 'Changes.BillDiff']
    }
  });

  const response = typeof RepoLifePolicy === 'undefined' ? null : RepoLifePolicy;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg
      ? response.msg
      : 'No fue posible recuperar la poliza');
  }

  const policies = asArray(response.outData);
  return policies.length > 0 ? policies[0] : null;
}

function getReinsuranceCessions(policyId, tipo) {
  let cessions = getCessions(`lifePolicyId=${policyId} AND overwritten=0`);

  // Cancellation reports combine the active cancellation movement with the
  // overwritten historical reversal to preserve the complete reinsurance amount.
  if (tipo === 1) {
    const overwrittenCessions = getCessions(
      `lifePolicyId=${policyId} AND overwritten=1 AND premiumType='CANCELLATION'`
    );

    cessions = cessions
      .concat(overwrittenCessions)
      .filter(item => item && item.premiumType === 'CANCELLATION');
  }

  return cessions;
}

function getCessions(filter) {
  doCmd({
    cmd: 'RepoCession',
    data: {
      operation: 'GET',
      filter: filter
    }
  });

  const response = typeof RepoCession === 'undefined' ? null : RepoCession;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg
      ? response.msg
      : 'No fue posible recuperar las cesiones de reaseguro');
  }

  return asArray(response.outData).filter(item => item && typeof item === 'object');
}

function findChange(changes, changeId) {
  return changes.find(item => item && Number(item.id) === changeId) || null;
}

function sumTaxRows(rows, cancellationOnly) {
  return rows
    .filter(row => row && (cancellationOnly === null ||
      (cancellationOnly && row.action === 'ChangeCancellation') ||
      (!cancellationOnly && row.action !== 'ChangeCancellation')))
    .reduce((total, row) => total + toNumber(row.amount), 0);
}

function safeJson(value, fallback) {
  if (!value) return fallback;

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function getAnioMes(policy) {
  const value = policy && (policy.activeDate || policy.start);
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';

  const months = {
    0: 'Ene', 1: 'Feb', 2: 'Mar', 3: 'Abr', 4: 'May', 5: 'Jun',
    6: 'Jul', 7: 'Ago', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dic'
  };

  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toDecimal(value) {
  return Number((Math.round((toNumber(value) + Number.EPSILON) * 100) / 100).toFixed(2));
}

function absoluteAmount(value) {
  return Math.abs(toDecimal(value));
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function toInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function getErrorMessage(error) {
  if (error && error.message) return error.message;
  return String(error || 'Error desconocido');
}
