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
    throw new Error(`No se encontró la póliza relacionada con el identificador ${id}`);
  }

  const titles = {
    0: 'Emisión',
    1: 'Cancelación',
    2: 'Renovación',
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

  const isCancellation = tipo === 1;
  const isNewOrAnniversary = [0, 2].includes(tipo);

  const changes = asArray(policy.Changes);
  const change = findChange(changes, id);

  let amounts;

  if (isCancellation) {
    amounts = getCancellationAmounts(policy, change);
  } else if (isNewOrAnniversary) {
    amounts = getIssuanceOrRenewalAmounts(policy, tipo);
  } else {
    amounts = getEndorsementAmounts(policy, change, id);
  }

  const {
    primaPorCobrar,
    prima,
    impuestoPrimasIncendio,
    gastoPrimaIncendio,
    cancelacion,
    renovacion,
    cancellationTax,
    nonCancellationTax
  } = amounts;

  const cessions = getReinsuranceCessions(policy.id, tipo, id);
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
    description: `${title} ${productName} Póliza # ${policyCode}`,
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

/**
 * Calculates cancellation amounts from the endorsement detail and tax movements.
 * Cancellation uses the difference between cancellation and non-cancellation taxes.
 */
function getCancellationAmounts(policy, change) {
  const baseCoverages = safeJson(change && change.jDetail, {});
  const prima = toNumber(baseCoverages.coveragesDif);
  const taxRows = asArray(policy.TaxGenerated);
  const cancellationTax = sumTaxRows(taxRows, true);
  const nonCancellationTax = sumTaxRows(taxRows, false);
  const impuestoPrimasIncendio = toDecimal(cancellationTax - nonCancellationTax);

  return {
    prima: prima,
    impuestoPrimasIncendio: impuestoPrimasIncendio,
    gastoPrimaIncendio: toDecimal(prima * 0.02),
    primaPorCobrar: toDecimal(prima + impuestoPrimasIncendio),
    cancelacion: true,
    renovacion: false,
    cancellationTax: cancellationTax,
    nonCancellationTax: nonCancellationTax
  };
}

/**
 * Calculates issuance and renewal amounts from coverage premiums and all taxes.
 */
function getIssuanceOrRenewalAmounts(policy, tipo) {
  const prima = sumCoveragePremiums(policy.Coverages, policy.coverages);
  const impuestoPrimasIncendio = sumTaxRows(asArray(policy.TaxGenerated), null);

  return {
    prima: prima,
    impuestoPrimasIncendio: impuestoPrimasIncendio,
    gastoPrimaIncendio: toDecimal(prima * 0.02),
    primaPorCobrar: toDecimal(prima + impuestoPrimasIncendio),
    cancelacion: false,
    renovacion: tipo === 2,
    cancellationTax: 0,
    nonCancellationTax: 0
  };
}

/**
 * Calculates endorsement amounts from BillDiff, including negative movements.
 */
function getEndorsementAmounts(policy, change, id) {
  if (!change) {
    throw new Error(`No se encontró el endoso ${id}`);
  }

  const billDiff = change.BillDiff || null;
  if (!billDiff) {
    const prima = toNumber(policy.coverages);
    const impuestoPrimasIncendio = sumTaxRows(asArray(policy.TaxGenerated), null);

    return {
      prima: prima,
      impuestoPrimasIncendio: impuestoPrimasIncendio,
      gastoPrimaIncendio: toDecimal(prima * 0.02),
      primaPorCobrar: toDecimal(prima + impuestoPrimasIncendio),
      cancelacion: false,
      renovacion: false,
      cancellationTax: 0,
      nonCancellationTax: 0
    };
  }

  const billCoverages = toNumber(billDiff.coverages);
  const billTax = toNumber(billDiff.tax);

  return {
    prima: Math.abs(toDecimal(billCoverages)),
    impuestoPrimasIncendio: Math.abs(toDecimal(billTax)),
    gastoPrimaIncendio: Math.abs(toDecimal(billDiff.fee)),
    primaPorCobrar: Math.abs(toDecimal(billCoverages + billTax)),
    cancelacion: billCoverages < 0,
    renovacion: false,
    cancellationTax: 0,
    nonCancellationTax: 0
  };
}

function validateInput(id, tipo) {
  if (id <= 0) {
    throw new Error('El identificador recibido no es válido');
  }

  if (![0, 1, 2, 3, 4, 5].includes(tipo)) {
    throw new Error('El tipo de contexto no es válido');
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
      include: ['TaxGenerated', 'Fees', 'Product', 'Coverages', 'Changes.BillDiff']
    }
  });

  const response = typeof RepoLifePolicy === 'undefined' ? null : RepoLifePolicy;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg
      ? response.msg
      : 'No fue posible recuperar la póliza');
  }

  const policies = asArray(response.outData);
  return policies.length > 0 ? policies[0] : null;
}

/**
 * Retrieves the reinsurance cessions used by the accounting context.
 *
 * Types 3 and 5 represent CapitalChange and LoadingChange endorsements. For
 * these types, all cessions are retrieved directly by changeId, regardless of
 * their overwritten status. The distribution is then combined with the first
 * cession found after it for each coverage, regardless of overwritten status.
 * If no later cession is available, the latest previous cession is used as a
 * fallback.
 *
 * Cancellation reports use a similar combination, but only with overwritten
 * records whose premium type is CANCELLATION.
 */
function getReinsuranceCessions(policyId, tipo, changeId) {
  const isCancellation = tipo === 1;
  const isVariation = tipo === 3 || tipo === 5;

  if (isVariation) {
    const changeCessions = getCessions(`changeId=${changeId}`);
    const policyCessions = getCessions(`lifePolicyId=${policyId}`);
    const adjacentCessions = getPreviousCoverageCessions(changeCessions, policyCessions);

    return mergeUniqueCessions(changeCessions.concat(adjacentCessions));
  }

  let cessions = getCessions(`lifePolicyId=${policyId} AND overwritten=0`);

  // Cancellation reports combine the active cancellation movement with the
  // overwritten historical reversal to preserve the complete reinsurance amount.
  if (isCancellation) {
    const overwrittenCessions = getCessions(
      `lifePolicyId=${policyId} AND overwritten=1 AND premiumType='CANCELLATION'`
    );

    cessions = cessions
      .concat(overwrittenCessions)
      .filter(item => item && item.premiumType === 'CANCELLATION');
  }

  return cessions;
}

function getPreviousCoverageCessions(currentCessions, candidateCessions) {
  const selectedIds = {};
  const previousCessions = [];

  asArray(currentCessions).forEach(current => {
    const coverageId = toPositiveInteger(current && current.coverageId);
    const currentId = toPositiveInteger(current && current.id);

    if (coverageId <= 0 || currentId <= 0 || selectedIds[coverageId]) {
      return;
    }

    // Prefer the first distribution after the current one.
    const next = asArray(candidateCessions)
      .filter(item => item &&
        toPositiveInteger(item.coverageId) === coverageId &&
        toPositiveInteger(item.id) > currentId)
      .sort((left, right) => toPositiveInteger(left.id) - toPositiveInteger(right.id))[0];

    // Use the latest previous distribution only when no later one exists.
    const previous = next || asArray(candidateCessions)
      .filter(item => item &&
        toPositiveInteger(item.coverageId) === coverageId &&
        toPositiveInteger(item.id) < currentId)
      .sort((left, right) => toPositiveInteger(right.id) - toPositiveInteger(left.id))[0];

    if (previous) {
      previousCessions.push(previous);
      selectedIds[coverageId] = true;
    }
  });

  return previousCessions;
}

function mergeUniqueCessions(cessions) {
  const uniqueIds = {};

  return asArray(cessions).filter(item => {
    const id = toPositiveInteger(item && item.id);
    if (id <= 0 || uniqueIds[id]) {
      return false;
    }

    uniqueIds[id] = true;
    return true;
  });
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

function sumCoveragePremiums(coverages, fallback) {
  const rows = asArray(coverages);
  if (rows.length === 0) {
    return toDecimal(fallback);
  }

  return toDecimal(rows.reduce((total, coverage) => {
    return total + toNumber(coverage && coverage.premium);
  }, 0));
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
