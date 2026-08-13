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

const policyId = getPolicyId(context);
const userEmail = getUserEmail(context);

if (!policyId) {
  throw new Error('Debe informar un lifePolicyId válido para cotizar la póliza.');
}

loadPolicy(policyId);
const quoteResult = executePolicyQuote(policyId);
updateQuotationEventUser(policyId, userEmail);
const documentResult = generateQuotationDocument(policyId);

if (!documentResult.ok) {
  return {
    ok: false,
    msg: `Póliza ${policyId} cotizada correctamente, pero falló la generación del documento: ${documentResult.msg || 'No fue posible generar el documento de cotización.'}`,
    outData: quoteResult.outData
  };
}

if (documentResult.skipped) {
  return {
    ok: true,
    msg: `${quoteResult.msg || `Póliza ${policyId} cotizada correctamente.`} ${documentResult.msg || 'No se generó documento de cotización.'}`,
    outData: quoteResult.outData
  };
}

return {
  ok: true,
  msg: documentResult.msg || quoteResult.msg || `Póliza ${policyId} cotizada correctamente y documento generado.`,
  outData: quoteResult.outData
};


function getPolicyId(commandContext) {
  const source = commandContext && commandContext.row
    ? commandContext.row
    : commandContext || {};

  const policyId = Number(source.lifePolicyId || source[0] || 0);
  return Number.isInteger(policyId) && policyId > 0 ? policyId : 0;
}

function getUserEmail(commandContext) {
  const source = commandContext && commandContext.row
    ? commandContext.row
    : commandContext || {};
  const value = String(source.userEmail || source[4] || '').trim();

  if (!value) {
    throw new Error('Debe informar un userEmail válido para actualizar el evento de cotización.');
  }

  return value;
}

function updateQuotationEventUser(policyId, userEmail) {
  const sql = `
    UPDATE eventRow
    SET [user] = '${escapeSqlString(userEmail)}'
    FROM [PolicyEvent] eventRow
    INNER JOIN (
      SELECT TOP (1) id AS eventId
      FROM [PolicyEvent]
      WHERE lifePolicyId = ${policyId}
        AND [type] = 'ACTION'
        AND [name] IN ('Quoted', 'Cotizado')
      ORDER BY id DESC
    ) latestEvent ON latestEvent.eventId = eventRow.id;`;

  doCmd({ cmd: 'DoQuery', data: { sql: sql } });

  if (typeof DoQuery === 'undefined' || !DoQuery || DoQuery.ok === false) {
    throw new Error(DoQuery && DoQuery.msg
      ? DoQuery.msg
      : `No fue posible actualizar el usuario del evento de cotización de la póliza ${policyId}.`);
  }
}

function escapeSqlString(value) {
  return String(value || '').replace(/'/g, "''");
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
    throw new Error(`@No se encontró la póliza ${policyId}.`);
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

function generateQuotationDocument(policyId) {
  doCmd({
    cmd: 'ExeChain',
    data: {
      chain: 'cmdGenerateQuotationDoc',
      context: `{id:${policyId}}`
    }
  });

  return ExeChain || { ok: false, msg: 'No fue posible generar el documento de cotización.' };
}

function validateCommandResult(result, defaultMessage) {
  if (!result || result.ok !== true) {
    const message = result && result.msg ? result.msg : defaultMessage;
    throw new Error(`@${message}`);
  }
}

function getErrorMessage(error) {
  if (error && error.message) {
    return error.message;
  }

  return String(error || 'Error desconocido al cotizar la póliza.');
}


