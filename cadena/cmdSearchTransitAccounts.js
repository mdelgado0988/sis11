//block
//noreplace

/**
 * @author Michael Delgado
 * @email support@axxis-systems.com
 * @created 2026/08/14
 * @name cmdSearchTransitAccounts
 * @version 1.0
 * @purpose: Search available accounts for cashier income destinations.
 *           The search is not restricted by account type or movement history.
 * @context: {
 *   page?: number,
 *   size?: number,
 *   accountName?: string,
 *   currency?: string,
 *   policy?: string|number,
 *   holderId?: number
 * }
 */

try {
  const input = normalizeInput(context);
  const offset = (input.page - 1) * input.size;
  const filter = buildFilter(input);

  const dataSql = `
SELECT
    a.[id],
    a.[holderId],
    a.[lifePolicyId],
    a.[accNo],
    a.[type],
    a.[currency],
    a.[name],
    pol.[code] AS [policyCode],
    LTRIM(RTRIM(CONCAT(ISNULL(con.[name], ''), ' ', ISNULL(con.[surname1], ''), ' ', ISNULL(con.[surname2], '')))) AS [contactName],
    ISNULL(balance.[movementBalance], 0) AS [movementBalance]
FROM [Account] a
LEFT JOIN [Contact] con ON con.[id] = a.[holderId]
LEFT JOIN [LifePolicy] pol ON pol.[id] = a.[lifePolicyId]
OUTER APPLY (
    SELECT SUM(ISNULL(am.[amount], 0)) AS [movementBalance]
    FROM [AccountMov] am
    WHERE am.[accountId] = a.[id]
      AND ISNULL(am.[transactionCode], '') <> 'PREMIUMPAY'
      AND ISNULL(am.[transactionCode], '') <> 'MONEYOUT'
) balance
WHERE ${filter}
ORDER BY a.[id]
OFFSET ${offset} ROWS FETCH NEXT ${input.size} ROWS ONLY;`;

doCmd({ cmd: 'DoQuery', data: { sql: dataSql } });
const dataResponse = getQueryResult();
if (!dataResponse.ok) {
  throw new Error(dataResponse.msg || 'No fue posible buscar las cuentas en transito');
}

const countSql = `
SELECT COUNT(1) AS [total]
FROM [Account] a
LEFT JOIN [Contact] con ON con.[id] = a.[holderId]
LEFT JOIN [LifePolicy] pol ON pol.[id] = a.[lifePolicyId]
WHERE ${filter};`;

doCmd({ cmd: 'DoQuery', data: { sql: countSql } });
const countResponse = getQueryResult();
if (!countResponse.ok) {
  throw new Error(countResponse.msg || 'No fue posible contar las cuentas en transito');
}

const countRows = asArray(countResponse.outData);
const total = countRows.length > 0 ? toPositiveInteger(countRows[0].total) : 0;

return {
  ok: true,
  msg: 'Cuentas en transito recuperadas correctamente',
  data: asArray(dataResponse.outData),
  total: total
};
} catch (error) {
  throw new TypeError(`@${error && error.message ? error.message : String(error)}`);
}

function normalizeInput(source) {
  const value = source && typeof source === 'object' ? source : {};
  return {
    page: Math.max(toPositiveInteger(value.page) || 1, 1),
    size: Math.min(Math.max(toPositiveInteger(value.size) || 15, 1), 100),
    accountName: normalizeText(value.accountName || value.name),
    currency: normalizeText(value.currency).toUpperCase(),
    policy: normalizeText(value.policy),
    holderId: toPositiveInteger(value.holderId)
  };
}

function buildFilter(input) {
  const conditions = ["1 = 1"];

  if (input.accountName) {
    const accountName = escapeSql(input.accountName);
    conditions.push(`(
      a.[accNo] LIKE N'%${accountName}%'
      OR a.[name] LIKE N'%${accountName}%'
      OR a.[code] LIKE N'%${accountName}%'
    )`);
  }

  if (input.holderId > 0) {
    conditions.push(`a.[holderId] = ${input.holderId}`);
  }

  if (input.currency) {
    conditions.push(`LTRIM(RTRIM(UPPER(ISNULL(a.[currency], '')))) = '${escapeSql(input.currency)}'`);
  }

  if (input.policy) {
    const policyId = toPositiveInteger(input.policy);
    if (policyId > 0) {
      conditions.push(`a.[lifePolicyId] = ${policyId}`);
    } else {
      conditions.push(`pol.[code] LIKE N'${escapeSql(input.policy)}%'`);
    }
  }

  return conditions.join(' AND ');
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

function escapeSql(value) {
  return normalizeText(value).replace(/'/g, "''");
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}
