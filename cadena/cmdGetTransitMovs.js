//block
//noreplace

/**
 * @author Michael Delgado
 * @email support@axxis-systems.com
 * @created 2026/08/12
 * @name cmdGetTransitMovs
 * @version 1.0
 * @purpose: Return paginated transit accounts and movements according to the selected filters.
 * @context: {
 *   page?: number,
 *   size?: number,
 *   holderId?: number,
 *   policy?: string|number,
 *   name?: string,
 *   cancellations?: boolean,
 *   onlyWithBalance?: boolean
 * }
 */

try {
  const input = normalizeInput(context);
  const offset = (input.page - 1) * input.size;
  const filter = buildFilter(input);

  const masterSql = `
SELECT
    a.[id],
    a.[holderId],
    a.[lifePolicyId],
    a.[accNo],
    a.[type],
    a.[currency],
    a.[name],
    a.[code],
    pol.[code] AS [policyCode],
    LTRIM(RTRIM(CONCAT(ISNULL(con.[name], ''), ' ', ISNULL(con.[surname1], ''), ' ', ISNULL(con.[surname2], '')))) AS [contactName],
    COUNT(am.[id]) AS [movementCount],
    SUM(ISNULL(am.[amount], 0)) AS [movementBalance]
FROM [Account] a
LEFT JOIN [Contact] con ON con.[id] = a.[holderId]
LEFT JOIN [LifePolicy] pol ON pol.[id] = a.[lifePolicyId]
INNER JOIN [AccountMov] am
    ON am.[accountId] = a.[id]
   AND ${movementPredicate('am', input)}
WHERE ${filter}
GROUP BY
    a.[id], a.[holderId], a.[lifePolicyId], a.[accNo], a.[type], a.[currency],
    a.[name], a.[code], pol.[code], con.[name], con.[surname1], con.[surname2]
ORDER BY a.[id]
OFFSET ${offset} ROWS FETCH NEXT ${input.size} ROWS ONLY;`;

  doCmd({ cmd: "DoQuery", data: { sql: masterSql } });
  const masterResponse = getQueryResult();
  if (!masterResponse.ok) {
    throw new Error(masterResponse.msg || "No fue posible recuperar las cuentas en transito");
  }

  const masterRows = asArray(masterResponse.outData);
  const accountIds = masterRows
    .map(row => toPositiveInteger(row && row.id))
    .filter(id => id > 0);

  const movementsByAccount = loadMovements(accountIds, input);
  const data = masterRows.map(row => ({
    ...row,
    Movements: movementsByAccount[toPositiveInteger(row && row.id)] || []
  }));

  const countSql = `SELECT COUNT(1) AS [total] FROM [Account] a
LEFT JOIN [Contact] con ON con.[id] = a.[holderId]
LEFT JOIN [LifePolicy] pol ON pol.[id] = a.[lifePolicyId]
WHERE ${filter};`;

  doCmd({ cmd: "DoQuery", data: { sql: countSql } });
  const countResponse = getQueryResult();
  if (!countResponse.ok) {
    throw new Error(countResponse.msg || "No fue posible contar las cuentas en transito");
  }

  const countRows = asArray(countResponse.outData);
  const total = countRows.length > 0 ? toPositiveInteger(countRows[0].total) : 0;

  return {
    ok: true,
    msg: "Cuentas en transito cargadas correctamente",
    data,
    total
  };
} catch (error) {
  throw new TypeError(`@${error && error.message ? error.message : String(error)}`);
}

function normalizeInput(source) {
  const value = source && typeof source === "object" ? source : {};
  return {
    page: Math.max(toPositiveInteger(value.page) || 1, 1),
    size: Math.min(Math.max(toPositiveInteger(value.size) || 15, 1), 100),
    holderId: toPositiveInteger(value.holderId),
    policy: normalizeText(value.policy),
    name: normalizeText(value.name),
    cancellations: value.cancellations === true,
    onlyWithBalance: value.onlyWithBalance === true
  };
}

function buildFilter(input) {
  const conditions = [
    "a.[type] = 'TRANSIT'",
    `EXISTS (SELECT 1 FROM [AccountMov] mx WHERE mx.[accountId] = a.[id] AND ${movementPredicate('mx', input)})`
  ];

  if (input.onlyWithBalance) {
    conditions.push(`ISNULL((SELECT SUM(ISNULL(ab.[amount], 0))
      FROM [AccountMov] ab
      WHERE ab.[accountId] = a.[id]
        AND ${movementPredicate('ab', input)}), 0) <> 0`);
  }

  if (input.holderId > 0) {
    conditions.push(`a.[holderId] = ${input.holderId}`);
  }

  if (input.policy) {
    const policyId = toPositiveInteger(input.policy);
    if (policyId > 0) {
      conditions.push(`a.[lifePolicyId] = ${policyId}`);
    } else {
      conditions.push(`pol.[code] LIKE N'${escapeSql(input.policy)}%'`);
    }
  }

  if (input.name) {
    const name = escapeSql(input.name);
    conditions.push(`EXISTS (SELECT 1 FROM [AccountMov] at WHERE at.[accountId] = a.[id] AND ${movementPredicate('at', input)} AND at.[transaction] LIKE N'${name}%')`);
  }

  return conditions.join(" AND ");
}

function loadMovements(accountIds, input) {
  if (!Array.isArray(accountIds) || accountIds.length === 0) {
    return {};
  }

  const ids = accountIds.join(",");
  const sql = `SELECT
    am.[id], am.[accountId], am.[date], am.[transaction], am.[amount],
    am.[amountBalance], am.[transferId], am.[transactionCode], am.[units], am.[unitBalance]
FROM [AccountMov] am
WHERE am.[accountId] IN (${ids})
  AND ${movementPredicate('am', input)}
ORDER BY am.[accountId], am.[date], am.[id];`;

  doCmd({ cmd: "DoQuery", data: { sql } });
  const response = getQueryResult();
  if (!response.ok) {
    throw new Error(response.msg || "No fue posible recuperar los movimientos en transito");
  }

  return asArray(response.outData).reduce((groups, movement) => {
    const accountId = toPositiveInteger(movement && movement.accountId);
    if (accountId <= 0) return groups;
    if (!Array.isArray(groups[accountId])) groups[accountId] = [];
    groups[accountId].push(movement);
    return groups;
  }, {});
}

function movementPredicate(alias, input) {
  if (input && input.cancellations === true) {
    return `ISNULL(${alias}.[transaction], '') = 'Cancellation'`;
  }

  return `ISNULL(${alias}.[transactionCode], '') <> 'PREMIUMPAY'`;
}

function getQueryResult() {
  const result = typeof DoQuery === "undefined" ? null : DoQuery;
  return {
    ok: Boolean(result && result.ok),
    msg: result && result.msg ? result.msg : "",
    outData: result && Array.isArray(result.outData) ? result.outData : []
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value === undefined || value === null ? "" : value).trim();
}

function escapeSql(value) {
  return normalizeText(value).replace(/'/g, "''");
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}
