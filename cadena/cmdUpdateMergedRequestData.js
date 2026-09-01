//block
//noreplace

/**
 * @author Michael Delgado
 * @email support@axxis-systems.com
 * @created 2026/09/01
 * @name cmdUpdateMergedRequestData
 * @version 1.0
 * @purpose: Copy payment data from merged claim payments to the parent request.
 * @context: number[] | { ids: number[] }
 */

try {
  const ids = getRequestIds(context);
  if (ids.length === 0) {
    return buildResult(false, 'No se recibió un arreglo de solicitudes válido.');
  }

  doCmd({
    cmd: 'DoQuery',
    data: {
      sql: `
SELECT TOP 1 parentId
FROM ClaimPayment
WHERE id IN (${ids.join(',')})
  AND parentId IS NOT NULL
ORDER BY id;`
    }
  });

  const parentLookup = getQueryResult();
  if (!parentLookup.ok) {
    return buildResult(false, parentLookup.msg || 'No fue posible localizar la solicitud principal.');
  }

  const parentRow = getFirstRow(parentLookup.outData);
  const requestId = toPositiveInteger(parentRow && parentRow.parentId);
  if (requestId <= 0) {
    return buildResult(false, 'No se encontró un parentId válido en las solicitudes recibidas.');
  }

  doCmd({
    cmd: 'DoQuery',
    data: {
      sql: `
SELECT
    MAX(CASE WHEN NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(100), paymentMethodCode))), '') IS NOT NULL
             THEN paymentMethodCode END) AS paymentMethodCode,
    MAX(CASE WHEN NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(100), branch))), '') IS NOT NULL
             THEN branch END) AS branch,
    MAX(CASE WHEN NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(100), paymentType))), '') IS NOT NULL
             THEN paymentType END) AS paymentType,
    MAX(sourceAccountId) AS sourceAccountId,
    MAX(accountId) AS accountId
FROM ClaimPayment
WHERE parentId = ${requestId};`
    }
  });

  const queryResult = getQueryResult();
  if (!queryResult.ok) {
    return buildResult(false, queryResult.msg || 'No fue posible leer las solicitudes fusionadas.');
  }

  const mergedData = getFirstRow(queryResult.outData);
  if (!mergedData || !hasData(mergedData)) {
    return buildResult(false, `No se encontraron datos válidos en las solicitudes fusionadas de ${requestId}.`);
  }

  const fieldValues = [];
  addStringField(fieldValues, 'paymentMethodCode', mergedData.paymentMethodCode);
  addStringField(fieldValues, 'branch', mergedData.branch);
  addStringField(fieldValues, 'paymentType', mergedData.paymentType);
  addNumericField(fieldValues, 'sourceAccountId', mergedData.sourceAccountId);
  addNumericField(fieldValues, 'accountId', mergedData.accountId);

  doCmd({
    cmd: 'SetField',
    data: {
      entity: 'ClaimPayment',
      entityId: requestId,
      fieldValue: fieldValues.join(',')
    }
  });

  const updateResult = typeof SetField === 'undefined' ? null : SetField;
  if (!updateResult || updateResult.ok === false) {
    return buildResult(false, updateResult && updateResult.msg
      ? updateResult.msg
      : 'No fue posible actualizar la solicitud principal.');
  }

  return buildResult(true, `Solicitud ${requestId} actualizada correctamente.`);
} catch (error) {
  return buildResult(false, error && error.message ? error.message : String(error));
}

function getQueryResult() {
  const result = typeof DoQuery === 'undefined' ? null : DoQuery;
  return {
    ok: Boolean(result && result.ok),
    msg: result && result.msg ? result.msg : '',
    outData: result ? result.outData : null
  };
}

function getRequestIds(value) {
  const source = Array.isArray(value)
    ? value
    : value && Array.isArray(value.ids)
      ? value.ids
      : [];

  return source
    .map(toPositiveInteger)
    .filter((id, index, list) => id > 0 && list.indexOf(id) === index);
}

function getFirstRow(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value && typeof value === 'object' ? value : null;
}

function hasData(data) {
  return !isEmpty(data.paymentMethodCode) ||
    !isEmpty(data.branch) ||
    !isEmpty(data.paymentType) ||
    !isEmpty(data.sourceAccountId) ||
    !isEmpty(data.accountId);
}

function addStringField(fields, name, value) {
  if (!isEmpty(value)) fields.push(`[${name}]=${sqlString(value)}`);
}

function addNumericField(fields, name, value) {
  if (!isEmpty(value)) fields.push(`[${name}]=${toNumber(value)}`);
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function buildResult(ok, msg) {
  return {
    ok: ok,
    msg: msg
  };
}
