//block
//noreplace

/**
 * @author Michael Delgado
 * @email support@axxis-systems.com
 * @created 2026/08/31
 * @name cmdHistoricalBilling
 * @version 1.0
 * @purpose: Return paginated historical billing rows grouped by policy with policy filters.
 * @context: {
 *   page?: number,
 *   size?: number,
 *   clientId?: number,
 *   policyCode?: string,
 *   policyId?: number,
 *   line?: string,
 *   product?: string,
 *   loanNumber?: string,
 *   plate?: string,
 *   issueFrom?: string,
 *   issueTo?: string,
 *   status?: string
 * }
 */

try {
  const input = normalizeInput(context);
  const offset = (input.page - 1) * input.size;
  const where = buildFilter(input);

  const dataSql = `
WITH BillingRows AS (
    SELECT
        lp.[id] AS [policyId],
        COALESCE(NULLIF(lp.[fiscalNumber], ''), '-') AS [receipt],
        COALESCE(NULLIF(lp.[code], ''), '-') AS [policy],
        CONVERT(VARCHAR(7), MIN(pp.[dueDate]), 120) AS [yearMonth],
        CASE
            WHEN lp.[active] = 1 AND lp.[entityState] = 'ACTIVE' THEN 'ACTIVE'
            ELSE 'INACTIVE'
        END AS [status],
        lp.[start] AS [start],
        MAX(pp.[dueDate]) AS [end],
        SUM(ISNULL(pp.[minimum], pp.[expected])) AS [total],
        SUM(ISNULL(pp.[payed], 0)) AS [paid],
        SUM(ISNULL(pp.[minimum], pp.[expected]) - ISNULL(pp.[payed], 0)) AS [pending]
    FROM [PayPlan] pp
    INNER JOIN [LifePolicy] lp ON lp.[id] = pp.[lifePolicyId]
    LEFT JOIN [Product] pro
        ON pro.[lobCode] = lp.[lob]
       AND pro.[code] = lp.[productCode]
    WHERE 1 = 1
      ${where}
    GROUP BY
        lp.[id],
        lp.[fiscalNumber],
        lp.[code],
        lp.[active],
        lp.[entityState],
        lp.[start]
)
SELECT
    [policyId],
    [receipt],
    [policy],
    [yearMonth],
    [status],
    [start],
    [end],
    [total],
    [paid],
    [pending],
    COUNT(1) OVER() AS [totalRows]
FROM BillingRows
ORDER BY [policyId], [end]
OFFSET ${offset} ROWS FETCH NEXT ${input.size} ROWS ONLY;`;

  doCmd({ cmd: 'DoQuery', data: { sql: dataSql } });
  const dataResponse = getQueryResult();
  if (!dataResponse.ok) {
    throw new Error(dataResponse.msg || 'No fue posible consultar la facturación histórica');
  }

  const data = asArray(dataResponse.outData);
  let total = data.length > 0 ? toNonNegativeInteger(data[0].totalRows) : 0;

  if (data.length === 0) {
    const countSql = `
SELECT COUNT(1) AS [total]
FROM (
    SELECT lp.[id]
    FROM [PayPlan] pp
    INNER JOIN [LifePolicy] lp ON lp.[id] = pp.[lifePolicyId]
    LEFT JOIN [Product] pro
        ON pro.[lobCode] = lp.[lob]
       AND pro.[code] = lp.[productCode]
    WHERE 1 = 1
      ${where}
    GROUP BY lp.[id]
) groupedPolicies;`;

    doCmd({ cmd: 'DoQuery', data: { sql: countSql } });
    const countResponse = getQueryResult();
    if (!countResponse.ok) {
      throw new Error(countResponse.msg || 'No fue posible contar la facturación histórica');
    }

    const countRows = asArray(countResponse.outData);
    total = countRows.length > 0 ? toNonNegativeInteger(countRows[0].total) : 0;
  }

  return {
    ok: true,
    msg: 'Facturación histórica recuperada correctamente',
    data: data.map(mapRow),
    total: total
  };
} catch (error) {
  throw new TypeError(`@${error && error.message ? error.message : String(error)}`);
}

function normalizeInput(source) {
  const value = source && typeof source === 'object' ? source : {};
  return {
    page: Math.max(toPositiveInteger(value.page) || 1, 1),
    size: Math.min(Math.max(toPositiveInteger(value.size) || 25, 1), 25),
    clientId: toPositiveInteger(value.clientId),
    policyCode: normalizeText(value.policyCode),
    policyId: toPositiveInteger(value.policyId),
    line: normalizeText(value.line),
    product: normalizeText(value.product),
    loanNumber: normalizeText(value.loanNumber),
    plate: normalizeText(value.plate),
    issueFrom: normalizeDate(value.issueFrom),
    issueTo: normalizeDate(value.issueTo),
    status: normalizeText(value.status).toUpperCase()
  };
}

function buildFilter(input) {
  const conditions = [];

  if (input.clientId > 0) conditions.push(`AND lp.[holderId] = ${input.clientId}`);
  if (input.policyId > 0) conditions.push(`AND lp.[id] = ${input.policyId}`);
  if (input.policyCode) conditions.push(`AND lp.[code] LIKE N'${escapeSql(input.policyCode)}%'`);
  if (input.line) conditions.push(`AND lp.[lob] = N'${escapeSql(input.line)}'`);
  if (input.product) conditions.push(`AND lp.[productCode] = N'${escapeSql(input.product)}'`);
  if (input.status === 'ACTIVE') conditions.push(`AND lp.[active] = 1 AND lp.[entityState] = 'ACTIVE'`);
  if (input.status === 'INACTIVE') conditions.push(`AND (lp.[active] = 0 OR lp.[entityState] <> 'ACTIVE')`);

  if (input.issueFrom) {
    conditions.push(`AND lp.[activeDate] >= DATEADD(HOUR, 5, CAST('${escapeSql(input.issueFrom)}' AS DATETIME2))`);
  }
  if (input.issueTo) {
    conditions.push(`AND lp.[activeDate] < DATEADD(HOUR, 5, DATEADD(DAY, 1, CAST('${escapeSql(input.issueTo)}' AS DATETIME2)))`);
  }
  if (input.loanNumber) {
    conditions.push(`AND EXISTS (
      SELECT 1 FROM [InsuredObject] io
      WHERE io.[lifePolicyId] = lp.[id]
        AND io.[jValues] LIKE N'%${escapeSql(input.loanNumber)}%'
    )`);
  }
  if (input.plate) {
    conditions.push(`AND EXISTS (
      SELECT 1 FROM [InsuredObject] io
      WHERE io.[lifePolicyId] = lp.[id]
        AND io.[jValues] LIKE N'%${escapeSql(input.plate)}%'
    )`);
  }

  return conditions.join('\n      ');
}

function mapRow(row) {
  const item = row || {};
  return {
    key: String(item.policyId || 0),
    policyId: item.policyId || 0,
    payPlanId: 0,
    receipt: item.receipt || '-',
    policy: item.policy || '-',
    yearMonth: item.yearMonth || '-',
    status: item.status || '-',
    start: item.start || null,
    end: item.end || null,
    total: toNumber(item.total),
    paid: toNumber(item.paid),
    pending: toNumber(item.pending)
  };
}

function getQueryResult() {
  const result = typeof DoQuery === 'undefined' ? null : DoQuery;
  return {
    ok: Boolean(result && result.ok),
    msg: result && result.msg ? result.msg : '',
    outData: result && Array.isArray(result.outData) ? result.outData : []
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

function normalizeDate(value) {
  const date = normalizeText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

function escapeSql(value) {
  return normalizeText(value).replace(/'/g, "''");
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function toNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
