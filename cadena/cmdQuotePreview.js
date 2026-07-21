//block
//noreplace

/*
 * @name cmdQuotePreview
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/01/09
 * @version 1.0
 * @purpose Execute the policy quotation and persist the calculated result.
 * @input context.row.lifePolicyId Policy identifier to quote.
 * @output { ok, msg, outData }
 * @example { row: { lifePolicyId: 90 } }
 */

try {
  const policyId = getPolicyId(context);

  if (!policyId) {
    throw new Error('Debe informar un lifePolicyId válido para cotizar la póliza.');
  }

  loadPolicy(policyId);
  const quoteResult = executePolicyQuote(policyId);

  return {
    ok: true,
    msg: quoteResult.msg || `Póliza ${policyId} cotizada correctamente.`,
    outData: quoteResult.outData
  };
} catch (error) {
  return {
    ok: false,
    msg: getErrorMessage(error)
  };
}

function getPolicyId(commandContext) {
  const source = commandContext && commandContext.row
    ? commandContext.row
    : commandContext || {};

  const policyId = Number(source.lifePolicyId || 0);
  return Number.isInteger(policyId) && policyId > 0 ? policyId : 0;
}

function loadPolicy(policyId) {
  doCmd({
    cmd: 'RepoLifePolicy',
    data: {
      operation: 'GET',
      filter: `id = ${policyId}`,
      fields: 'id,productCode'
    }
  });

  validateCommandResult(RepoLifePolicy, 'No fue posible cargar la póliza.');

  const policies = Array.isArray(RepoLifePolicy.outData)
    ? RepoLifePolicy.outData
    : [];
  const policy = policies.length > 0 ? policies[0] : null;

  if (!policy || Number(policy.id || 0) !== policyId) {
    throw new Error(`No se encontró la póliza ${policyId}.`);
  }

  return policy;
}

function executePolicyQuote(policyId) {
  doCmd({
    cmd: 'QuotePolicy',
    data: {
      policyId: policyId,
      dbMode: true,
      save: true,
      action: 'ANNIVERSARY'
    }
  });

  validateCommandResult(QuotePolicy, 'No fue posible cotizar la póliza.');
  return QuotePolicy;
}

function validateCommandResult(result, defaultMessage) {
  if (!result || result.ok !== true) {
    throw new Error(result && result.msg ? result.msg : defaultMessage);
  }
}

function getErrorMessage(error) {
  if (error && error.message) {
    return error.message;
  }

  return String(error || 'Error desconocido al cotizar la póliza.');
}
