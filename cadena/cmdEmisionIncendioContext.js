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
 *                     4: insured object change, 5: loading change, 6: coverage change.
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
  const nombreRamo = getNombreRamo(policy);
  if (!nombreRamo) {
    throw new Error('No se pudo obtener el nombre del ramo de la póliza');
  }

  const isPolicyVersionRenewal = tipo === 0 && toPositiveInteger(policy.policyVersion) > 0;

  const titles = {
    0: 'Emisión',
    1: 'Cancelación',
    2: 'Renovación',
    3: 'Endoso Suma Asegurada',
    4: 'Endoso Objeto Asegurado',
    5: 'Endoso de Recargo',
    6: 'Cambio de Cobertura'
  };

  const codes = {
    0: 'EmisionIncendio',
    1: 'CancelacionIncendio',
    2: 'RenovacionIncendio',
    3: 'EndosoSA',
    4: 'EndosoObjetoAsegurado',
    5: 'EndosoRecargo',
    6: 'CambioCobertura'
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
    amounts = getEndorsementAmounts(policy, change, id, tipo);
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
  const isRenewal = isPolicyVersionRenewal || renovacion;

  const cessions = getReinsuranceCessions(policy.id, tipo, id, change);
  const reaseguroCedido = toDecimal(
    cessions.reduce((total, item) => total + toNumber(item.premiumRe), 0)
  );
  const reaseguroComision = toDecimal(
    cessions.reduce((total, item) => total + toNumber(item.comissionCedant), 0)
  );
  const reaseguroPorPagar = toDecimal(reaseguroCedido - reaseguroComision);
  const hasPremiumMovement = [primaPorCobrar, prima, impuestoPrimasIncendio, gastoPrimaIncendio]
    .some((value) => toDecimal(value) !== 0);
  const hasReinsuranceMovement = [reaseguroCedido, reaseguroComision, reaseguroPorPagar]
    .some((value) => toDecimal(value) !== 0);

  // Do not create an accounting context when the endorsement has no premium
  // or net reinsurance movement. Returning an empty set prevents the template
  // engine from generating a zero-value journal entry.
  if (!hasPremiumMovement && !hasReinsuranceMovement) {
    return [];
  }

  const effectiveTipo = isPolicyVersionRenewal ? 2 : tipo;
  const isLoadingChange = tipo === 5;
  const isLoadingDiscount = isLoadingChange && toNumber(prima) < 0;
  const title = isLoadingChange
    ? (isLoadingDiscount ? 'Endoso de Descuento' : 'Endoso de Recargo')
    : titles[effectiveTipo];
  const referenceTitle = isLoadingChange
    ? (isLoadingDiscount ? 'Endoso Descuento' : 'Endoso Recargo')
    : title;
  const descriptionTitle = isLoadingChange
    ? (isLoadingDiscount ? 'Endoso de Descuento' : 'Endoso de Recargo')
    : title;
  const effectiveCode = effectiveTipo === 0
    ? getEmissionCode(policy.lob)
    : isLoadingChange
    ? (isLoadingDiscount ? 'EndosoDescuento' : 'EndosoRecargo')
    : codes[effectiveTipo];
  const productName = policy.Product && policy.Product.name
    ? String(policy.Product.name)
    : '';
  const policyCode = String(policy.code || '');

  return [{
    primaPorCobrar: toDecimal(primaPorCobrar),
    prima: toDecimal(prima),
    impuestoPrimasIncendio: toDecimal(impuestoPrimasIncendio),
    gastoPrimaIncendio: toDecimal(gastoPrimaIncendio),
    cancellationTax: toDecimal(cancellationTax),
    nonCancellationTax: toDecimal(nonCancellationTax),
    daniosPorPagar: toDecimal(gastoPrimaIncendio),
    commisiones: toDecimal(policy.commissions),
    reservasPorPagar: toDecimal(policy.commissions),
    reaseguroCedido: toDecimal(reaseguroCedido),
    reaseguroComision: toDecimal(reaseguroComision),
    reaseguroPorPagar: toDecimal(reaseguroPorPagar),
    anioMes: getAnioMes(policy),
    reference: `${referenceTitle} ${nombreRamo} # ${id}`,
    description: `${title} ${productName} Póliza # ${policyCode}`,
    unique: `TX${cancelacion ? '-R' : ''}# ${id}`,
    code: effectiveCode,
    ramo: nombreRamo,
    cancelacion: cancelacion,
    renovacion: isRenewal,
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
  const impuestoPrimasIncendio = toDecimal(baseCoverages.taxDif);

  return {
    prima: prima,
    impuestoPrimasIncendio: impuestoPrimasIncendio,
    gastoPrimaIncendio: getGastoPrima(policy, prima),
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
  const taxRows = asArray(policy.TaxGenerated);
  const impuestoPrimasIncendio = taxRows.length > 0
    ? getLatestQuoteTax(taxRows)
    : toDecimal(policy.tax);

  return {
    prima: prima,
    impuestoPrimasIncendio: impuestoPrimasIncendio,
    gastoPrimaIncendio: getGastoPrima(policy, prima),
    primaPorCobrar: toDecimal(prima + impuestoPrimasIncendio),
    cancelacion: false,
    renovacion: tipo === 2,
    cancellationTax: 0,
    nonCancellationTax: 0
  };
}

/**
 * Returns the tax from the latest issuance or renewal tax movement.
 * QUOTE and PREQUOTE apply to issuance; ANNIVERSARY applies to renewals.
 */
function getLatestQuoteTax(rows) {
  const quotationRows = asArray(rows)
    .filter(row => row && ['QUOTE', 'PREQUOTE', 'ANNIVERSARY'].includes(String(row.action || '').toUpperCase()))
    .sort((left, right) => toPositiveInteger(right.id) - toPositiveInteger(left.id));

  return quotationRows.length > 0 ? toNumber(quotationRows[0].amount) : 0;
}

/**
 * Calculates endorsement amounts from BillDiff, including negative movements.
 * The fire expense is calculated as 2% of the endorsement premium except for
 * surety branches, which do not apply this expense.
 */
function getEndorsementAmounts(policy, change, id, tipo) {
  if (!change) {
    throw new Error(`No se encontró el endoso ${id}`);
  }

  const billDiff = change.BillDiff || null;
  if (!billDiff) {
    if (tipo === 6) {
      return {
        prima: 0,
        impuestoPrimasIncendio: 0,
        gastoPrimaIncendio: 0,
        primaPorCobrar: 0,
        cancelacion: false,
        renovacion: false,
        cancellationTax: 0,
        nonCancellationTax: 0
      };
    }
    const prima = toNumber(policy.coverages);
    const impuestoPrimasIncendio = sumTaxRows(asArray(policy.TaxGenerated), null);

    return {
      prima: prima,
      impuestoPrimasIncendio: impuestoPrimasIncendio,
      gastoPrimaIncendio: getGastoPrima(policy, prima),
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
    prima: toDecimal(billCoverages),
    impuestoPrimasIncendio: toDecimal(billTax),
    gastoPrimaIncendio: getGastoPrima(policy, billCoverages),
    primaPorCobrar: toDecimal(billCoverages + billTax),
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

  if (![0, 1, 2, 3, 4, 5, 6].includes(tipo)) {
    throw new Error('El tipo de contexto no es válido');
  }
}

function buildPolicyFilter(id, tipo) {
  if (tipo === 0) {
    return `id=${id}`;
  }

  if ([1, 3, 4, 5, 6].includes(tipo)) {
    return `id IN (SELECT lifePolicyId FROM [Change] WHERE id=${id})`;
  }

  return `id IN (SELECT lifePolicyId FROM [Anniversary] WHERE id=${id})`;
}

function getNombreRamo(policy) {
  const lobCode = String(policy && policy.lob || '').trim().replace(/'/g, "''");
  if (!lobCode) {
    return '';
  }

  doCmd({
    cmd: 'RepoLob',
    data: {
      operation: 'GET',
      filter: `code = '${lobCode}'`,
      noTracking: true
    }
  });

  const ramo = typeof RepoLob !== 'undefined' && Array.isArray(RepoLob.outData)
    ? RepoLob.outData[0]
    : null;
  const nombre = String(ramo && ramo.name || '').trim();

  return nombre.replace(/^\s*[^-]+\s*-\s*/, '').trim();
}

function getEmissionCode(lob) {
  const ramo = String(lob || '').trim();

  if (ramo === '1') {
    return 'EmisionIncendio';
  }

  if (['81', '82', '83', '84'].includes(ramo)) {
    return 'EmisionFianza';
  }

  return 'Emision';
}

function getGastoPrima(policy, prima) {
  const ramo = String(policy && policy.lob || '').trim();
  if (['81', '82', '83', '84'].includes(ramo)) {
    return 0;
  }
  return toDecimal(toNumber(prima) * 0.02);
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
 * their overwritten status. The distribution is combined with the first
 * posterior cession for the same coverage and reinsurance line. If none is
 * available, the latest previous cession is used as a fallback.
 *
 * Cancellation reports use a similar combination, but only with overwritten
 * records whose premium type is CANCELLATION.
 */
function getReinsuranceCessions(policyId, tipo, changeId, change) {
  const isCancellation = tipo === 1;
  const isVariation = tipo === 3 || tipo === 5;
  const isCoverageChange = tipo === 6;
  const additional = safeJson(change && change.jAdditional, {});
  const isUncollectiblePremium = additional.endorsementType === 'UNCOLLECTIBLEPREMIUM';
  const isPreparedCapitalChange = tipo === 3 && additional.endorsementType === 'CHANGE_INSURED_SUM_SURETY';

  // El endoso de prima incobrable solo registra la anulacion negativa que se
  // preparo para este cambio. No debe mezclar anulaciones de otros endosos,
  // aunque sigan activas y tengan el mismo premiumType.
  if (isUncollectiblePremium) {
    return getCessions(`lifePolicyId=${policyId} AND changeId=${changeId} AND overwritten=0 AND premiumType='CANCELLATION'`);
  }

  // Coverage changes in ProceedOrderEndorsement version the complete
  // distribution with a negative cancellation and an identical positive
  // replacement. Accounting must read both sides of this change so the net
  // reinsurance movement is zero.
  if (isCoverageChange || isPreparedCapitalChange) {
    return getCessions(`changeId=${changeId}`);
  }

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
    const currentId = toPositiveInteger(current && current.id);
    const coverageKey = getCoverageKey(current);
    const lineKey = normalizeKey(current && current.lineId);
    const matchKey = `${coverageKey}|${lineKey}`;

    if (!coverageKey || !lineKey || currentId <= 0 || selectedIds[matchKey]) {
      return;
    }

    // Prefer the first posterior distribution for the same coverage and line.
    const next = asArray(candidateCessions)
      .filter(item => item &&
        getCoverageKey(item) === coverageKey &&
        normalizeKey(item.lineId) === lineKey &&
        toPositiveInteger(item.id) > currentId)
      .sort((left, right) => toPositiveInteger(left.id) - toPositiveInteger(right.id))[0];

    // If there is no posterior distribution, use the latest previous one.
    const previous = next || asArray(candidateCessions)
      .filter(item => item &&
        getCoverageKey(item) === coverageKey &&
        normalizeKey(item.lineId) === lineKey &&
        toPositiveInteger(item.id) < currentId)
      .sort((left, right) => toPositiveInteger(right.id) - toPositiveInteger(left.id))[0];

    if (previous) {
      previousCessions.push(previous);
      selectedIds[matchKey] = true;
    }
  });

  return previousCessions;
}

function getCoverageKey(item) {
  const coverageId = toPositiveInteger(item && item.coverageId);
  if (coverageId > 0) {
    return `id:${coverageId}`;
  }

  const coverageName = normalizeKey(item && (item.coverageCode || item.cover));
  return coverageName ? `name:${coverageName}` : '';
}

function normalizeKey(value) {
  return String(value === undefined || value === null ? '' : value).trim().toUpperCase();
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
