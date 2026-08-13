//block
//noreplace

/*
 * @name cmdUpdateRenewalPolicyEventUser
 * @author Michael Delgado
 * @email michael.delgado@axxis.com
 * @created 2026/08/13
 * @version 1.1
 * @purpose Update renewal issuance activity users in batches.
 * @input context.processBatchId Renewal issuance batch identifier.
 * @input context.userEmail User that started the renewal process.
 * @output { ok, msg, updated }
 *
 * The issuance batch creates one PolicyEvent per policy with SUPERVISOR as the
 * technical user. This command reads every policy from the batch and updates
 * the latest eligible issuance event in chunks of 500 policies. Quotation
 * events are explicitly excluded.
 */

try {
  const input = context && typeof context === 'object' ? context : {};
  const batchId = toPositiveInteger(input.processBatchId || input.batchId);
  const userEmail = String(input.userEmail || '').trim();

  if (batchId <= 0) {
    throw new Error('El identificador del lote de emisión es requerido y debe ser válido.');
  }

  if (!userEmail) {
    throw new Error('El usuario que inició la renovación es requerido.');
  }

  const batch = loadBatch(batchId);
  const policyIds = getPolicyIds(batch && batch.jData);
  let updated = 0;

  getChunks(policyIds, 500).forEach(chunk => {
    updated += updateEventUsersBatch(chunk, userEmail);
  });

  return {
    ok: true,
    msg: `Se actualizaron ${updated} actividad(es) de emisión.`,
    updated: updated
  };
} catch (error) {
  return {
    ok: false,
    msg: getErrorMessage(error),
    updated: 0
  };
}

function loadBatch(batchId) {
  doCmd({
    cmd: 'LoadEntity',
    data: {
      entity: 'Batch',
      fields: 'id,jData',
      filter: `id = ${batchId}`,
      noTracking: true
    }
  });

  if (typeof LoadEntity === 'undefined' || !LoadEntity || LoadEntity.ok === false || !LoadEntity.outData) {
    throw new Error(LoadEntity && LoadEntity.msg
      ? LoadEntity.msg
      : `No se encontró el lote de emisión ${batchId}.`);
  }

  return LoadEntity.outData;
}

function getPolicyIds(rawJData) {
  const rows = parseJsonArray(rawJData);
  const ids = [];

  rows.forEach(row => {
    if (!Array.isArray(row)) {
      return;
    }

    const policyId = toPositiveInteger(row[0]);
    if (policyId > 0 && ids.indexOf(policyId) < 0) {
      ids.push(policyId);
    }
  });

  return ids;
}

function updateEventUsersBatch(policyIds, userEmail) {
  if (!Array.isArray(policyIds) || policyIds.length === 0) {
    return 0;
  }

  const ids = policyIds.join(',');
  const safeEmail = escapeSqlString(userEmail);
  const sql = `
    UPDATE eventRow
    SET [user] = '${safeEmail}'
    FROM [PolicyEvent] eventRow
    INNER JOIN (
      SELECT lifePolicyId, MAX(id) AS eventId
      FROM [PolicyEvent]
      WHERE lifePolicyId IN (${ids})
        AND [type] = 'ACTION'
        AND [user] = 'SUPERVISOR'
        AND [name] NOT IN ('Quoted', 'Cotizado')
      GROUP BY lifePolicyId
    ) latestEvent ON latestEvent.eventId = eventRow.id;
    SELECT @@ROWCOUNT AS updated;`;

  doCmd({ cmd: 'DoQuery', data: { sql: sql } });

  if (typeof DoQuery === 'undefined' || !DoQuery || DoQuery.ok === false) {
    throw new Error(DoQuery && DoQuery.msg
      ? DoQuery.msg
      : 'No fue posible actualizar las actividades de emisión.');
  }

  const rows = Array.isArray(DoQuery.outData) ? DoQuery.outData : [];
  return toPositiveInteger(rows.length > 0 ? rows[rows.length - 1].updated : 0);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error('El jData del lote de emisión no contiene un JSON válido.');
  }
}

function toPositiveInteger(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function escapeSqlString(value) {
  return String(value || '').replace(/'/g, "''");
}

function getChunks(values, chunkSize) {
  const source = Array.isArray(values) ? values : [];
  const size = toPositiveInteger(chunkSize) || 500;
  const chunks = [];

  for (let index = 0; index < source.length; index += size) {
    chunks.push(source.slice(index, index + size));
  }

  return chunks;
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error || 'Error desconocido.');
}
