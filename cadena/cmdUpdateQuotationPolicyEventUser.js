//block
//noreplace

/*
 * @name cmdUpdateQuotationPolicyEventUser
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/08/13
 * @version 1.0
 * @purpose Update the user of the quotation event created by a quotation batch.
 * @input context.processBatchId Quotation batch identifier.
 * @input context.userEmail Optional user email. When omitted, the current user is loaded.
 * @output { ok, msg, updated }
 *
 * The quotation command runs inside a batch and therefore creates the PolicyEvent
 * with SUPERVISOR. This command runs after the batch finishes and replaces that
 * technical user only on the latest Quoted/Cotizado action event for each policy.
 */

try {
  const input = context && typeof context === 'object' ? context : {};
  const processBatchId = toPositiveInteger(input.processBatchId || input.batchId);

  if (processBatchId <= 0) {
    throw new Error('El identificador del lote de cotización es requerido y debe ser válido.');
  }

  const userEmail = getUserEmail(input.userEmail);
  if (!userEmail) {
    throw new Error('No fue posible recuperar el usuario que ejecutó la cotización.');
  }

  const batch = loadBatch(processBatchId);
  const policyIds = getPolicyIds(batch && batch.jData);
  if (policyIds.length === 0) {
    return {
      ok: true,
      msg: 'El lote no contiene pólizas para actualizar.',
      updated: 0
    };
  }

  let updated = 0;
  policyIds.forEach(policyId => {
    const eventId = getLatestQuotationEventId(policyId);
    if (eventId <= 0) {
      return;
    }

    updateEventUser(eventId, userEmail);
    updated += 1;
  });

  return {
    ok: true,
    msg: `Se actualizaron ${updated} evento(s) de cotización.`,
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

  if (!LoadEntity || LoadEntity.ok === false || !LoadEntity.outData) {
    throw new Error(LoadEntity && LoadEntity.msg
      ? LoadEntity.msg
      : `No se encontró el lote de cotización ${batchId}.`);
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

    // Quotation batches store the lifePolicyId in the first and third columns.
    [row[2], row[0]].forEach(value => {
      const policyId = toPositiveInteger(value);
      if (policyId > 0 && ids.indexOf(policyId) < 0) {
        ids.push(policyId);
      }
    });
  });

  return ids;
}

function getLatestQuotationEventId(policyId) {
  const sql = `
    SELECT TOP (1) id
    FROM [PolicyEvent]
    WHERE lifePolicyId = ${policyId}
      AND [type] = 'ACTION'
      AND [name] IN ('Quoted', 'Cotizado')
    ORDER BY id DESC;`;

  doCmd({ cmd: 'DoQuery', data: { sql: sql } });

  if (!DoQuery || DoQuery.ok === false) {
    throw new Error(DoQuery && DoQuery.msg
      ? DoQuery.msg
      : `No fue posible buscar el evento de cotización de la póliza ${policyId}.`);
  }

  const rows = Array.isArray(DoQuery.outData) ? DoQuery.outData : [];
  return toPositiveInteger(rows.length > 0 ? rows[0].id : 0);
}

function updateEventUser(eventId, userEmail) {
  doCmd({
    cmd: 'SetField',
    data: {
      entity: 'PolicyEvent',
      entityId: eventId,
      fieldValue: `[user]='${escapeSqlString(userEmail)}'`
    }
  });

  if (!SetField || SetField.ok === false) {
    throw new Error(SetField && SetField.msg
      ? SetField.msg
      : `No fue posible actualizar el usuario del evento ${eventId}.`);
  }
}

function getUserEmail(value) {
  const explicitEmail = String(value || '').trim();
  if (explicitEmail) {
    return explicitEmail;
  }

  doCmd({ cmd: 'GetCurrentUser', data: {} });
  if (!GetCurrentUser || GetCurrentUser.ok === false) {
    return '';
  }

  const source = GetCurrentUser.outData;
  const user = Array.isArray(source) ? source[0] : source;
  return String(user && (user.email || user.Email || user.userEmail) || '').trim();
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
    throw new Error('El jData del lote de cotización no contiene un JSON válido.');
  }
}

function toPositiveInteger(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function escapeSqlString(value) {
  return String(value || '').replace(/'/g, "''");
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error || 'Error desconocido.');
}
