//block
//noreplace

/*
 * @name cmdPaginationBatch
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/07/21
 * @version 1.0
 * @purpose: Return paginated batch records for a configured import category.
 * @context: { row: { currentPage, pageSize, batchCode } }
 */

const input = context && context.row ? context.row : {};
const currentPage = getPositiveInteger(input.currentPage, 1);
const pageSize = getPositiveInteger(input.pageSize, 25);
const batchCode = getTrimmedString(input.batchCode);

if (!batchCode) {
  return buildError('El código del lote es requerido.');
}

const dataQuery = `
DECLARE @pagenum AS INT = ${currentPage}, @pagesize AS INT = ${pageSize};
SELECT
    b.[id],
    b.[name],
    b.[created],
    b.[records],
    COALESCE(b.[error], 0) + COALESCE(b.[success], 0) AS [processed],
    b.[launched],
    b.[status],
    COALESCE(b.[success], 0) AS [success],
    COALESCE(b.[error], 0) AS [error],
    b.[user],
    pro.[estado] AS [estadoWf],
    pro.[id] AS [wfId],
    pro.[estadoId] AS [estadoWfId],
    b.[jData]
FROM [Batch] b
JOIN [ImportConfig] ic ON b.[importConfigId] = ic.[id]
LEFT JOIN [Proceso] pro ON pro.[entity] = 'BATCH'
    AND b.[id] = TRY_CAST(pro.[entityId] AS INT)
WHERE ic.[category] = ${toSqlString(batchCode)}
ORDER BY b.[id] DESC
OFFSET (@pagenum - 1) * @pagesize ROWS
FETCH NEXT @pagesize ROWS ONLY;`;

const dataResponse = runDoQuery(dataQuery);
if (!isSuccessfulResponse(dataResponse)) {
  return buildError(getResponseMessage(dataResponse, 'No fue posible consultar los lotes.'));
}

const data = normalizeBatchRows(dataResponse.outData);

const countQuery = `
SELECT COUNT(1) AS [total]
FROM [Batch] b
JOIN [ImportConfig] ic ON b.[importConfigId] = ic.[id]
WHERE ic.[category] = ${toSqlString(batchCode)};`;

const countResponse = runDoQuery(countQuery);
if (!isSuccessfulResponse(countResponse)) {
  return buildError(getResponseMessage(countResponse, 'No fue posible contar los lotes.'));
}

const countRows = Array.isArray(countResponse.outData) ? countResponse.outData : [];
const total = countRows.length > 0 ? getNonNegativeInteger(countRows[0].total, 0) : 0;

return {
  ok: true,
  total: total,
  data: data
};

function runDoQuery(sql) {
  doCmd({
    cmd: 'DoQuery',
    data: { sql: sql }
  });

  return typeof DoQuery === 'undefined' ? null : DoQuery;
}

function normalizeBatchRows(value) {
  const rows = Array.isArray(value) ? value : [];

  return rows.map(row => {
    const normalized = row && typeof row === 'object' ? row : {};
    const items = parseJsonArray(normalized.jData);
    const skipped = items.reduce((totalSkipped, item) => {
      return totalSkipped + (Array.isArray(item) && getTrimmedString(item[3]) === 'No' ? 1 : 0);
    }, 0);

    normalized.processed = Math.max(
      getNonNegativeInteger(normalized.processed, 0) - skipped,
      0
    );
    normalized.skipped = skipped;

    return normalized;
  });
}

function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  const text = getTrimmedString(value);
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function getPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function getNonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function getTrimmedString(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function toSqlString(value) {
  return `N'${getTrimmedString(value).replace(/'/g, "''")}'`;
}

function isSuccessfulResponse(response) {
  return Boolean(response && response.ok !== false && Array.isArray(response.outData));
}

function getResponseMessage(response, fallback) {
  return response && response.msg ? String(response.msg) : fallback;
}

function buildError(message) {
  return {
    ok: false,
    msg: message,
    total: 0,
    data: []
  };
}

/*
 * @test
 * { row: { currentPage: 1, pageSize: 20, batchCode: 'ANNIVERSARYLOTEVIEW' } }
 */
