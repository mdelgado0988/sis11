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
 *   transferId?: number,
 *   policy?: string|number,
 *   accountName?: string,
 *   accountCode?: string,
 *   currency?: string,
 *   name?: string,
 *   cancellations?: boolean,
 *   onlyWithBalance?: boolean
 * }
 */

try {
  const input = normalizeInput(context);
  const offset = (input.page - 1) * input.size;
  const clientAccounts = loadClientAccounts(input);
  const filter = buildFilter(input, clientAccounts);

  const masterSql = `
SELECT
    a.[id],
    ${input.holderId || 'a.[holderId]'} AS [holderId],
    a.[lifePolicyId],
    a.[accNo],
    a.[type],
    a.[currency],
    a.[name],
    a.[code],
    pol.[code] AS [policyCode],
    LTRIM(RTRIM(CONCAT(ISNULL(con.[name], ''), ' ', ISNULL(con.[surname1], ''), ' ', ISNULL(con.[surname2], '')))) AS [contactName],
    ISNULL(requests.[pendingRefundAmount], 0) AS [pendingRefundAmount],
    CASE WHEN ISNULL(SUM(ISNULL(am.[amount], 0)), 0) - ISNULL(requests.[pendingRefundAmount], 0) < 0 THEN 0 ELSE ISNULL(SUM(ISNULL(am.[amount], 0)), 0) - ISNULL(requests.[pendingRefundAmount], 0) END AS [availableBalance],
    COUNT(am.[id]) AS [movementCount],
    ISNULL(SUM(ISNULL(am.[amount], 0)), 0) AS [movementBalance]
FROM [Account] a
LEFT JOIN [Contact] con ON con.[id] = ${input.holderId || 'a.[holderId]'}
LEFT JOIN [LifePolicy] pol ON pol.[id] = a.[lifePolicyId]
OUTER APPLY (
    SELECT SUM(ISNULL(cp.[total], 0)) AS [pendingRefundAmount]
    FROM [ClaimPayment] cp
    WHERE cp.[sourceAccountId] = a.[id]
      AND cp.[claimId] IS NULL
      AND (${input.holderId} = 0 OR cp.[contactId] = ${input.holderId})
      AND (cp.[producer] IS NULL OR (
        UPPER(ISNULL(cp.[producer], '')) = 'MANUAL'
        AND ISNULL(cp.[paymentType], '') = '15'
      ))
      AND UPPER(ISNULL(cp.[currency], '')) = UPPER(ISNULL(a.[currency], ''))
      AND UPPER(ISNULL(cp.[entityState], '')) NOT IN ('EXECUTED', 'REJECTED')
) requests
LEFT JOIN [AccountMov] am
    ON am.[accountId] = a.[id]
   AND ${movementPredicate('am', {})}
WHERE ${filter}
GROUP BY
    a.[id], a.[holderId], a.[lifePolicyId], a.[accNo], a.[type], a.[currency],
    a.[name], a.[code], pol.[code], con.[name], con.[surname1], con.[surname2],
    requests.[pendingRefundAmount]
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
    ...clientBalance(row, clientAccounts),
    Movements: movementsByAccount[toPositiveInteger(row && row.id)] || []
  }));

  const countSql = `SELECT COUNT(1) AS [total] FROM [Account] a
LEFT JOIN [Contact] con ON con.[id] = ${input.holderId || 'a.[holderId]'}
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
    transferId: toPositiveInteger(value.transferId),
    policyId: toPositiveInteger(value.policyId),
    policy: normalizeText(value.policy),
    accountName: normalizeText(value.accountName),
    accountCode: normalizeText(value.accountCode),
    currency: normalizeText(value.currency).toUpperCase(),
    name: normalizeText(value.name),
    cancellations: value.cancellations === true,
    // A transfer search must include both sides of the movement, even when
    // one side has no positive balance after the transfer.
    onlyWithBalance: value.showAll !== true
      && value.onlyWithBalance !== false
      && toPositiveInteger(value.transferId) <= 0
  };
}

function buildFilter(input, clientAccounts) {
  const conditions = ["a.[type] = 'TRANSIT'"];

  if (input.policyId > 0) {
    conditions.push(`a.[lifePolicyId] = ${input.policyId}`);
  }

  if (input.onlyWithBalance) {
    conditions.push(`ROUND((
      ISNULL((SELECT SUM(ISNULL(ab.[amount], 0))
        FROM [AccountMov] ab
        WHERE ab.[accountId] = a.[id]
          AND ${movementPredicate('ab', {})}), 0)
      - ISNULL((SELECT SUM(ISNULL(cp.[total], 0))
        FROM [ClaimPayment] cp
        WHERE cp.[sourceAccountId] = a.[id]
          AND cp.[claimId] IS NULL
      AND (${input.holderId} = 0 OR cp.[contactId] = ${input.holderId})
          AND (cp.[producer] IS NULL OR (
            UPPER(ISNULL(cp.[producer], '')) = 'MANUAL'
            AND ISNULL(cp.[paymentType], '') = '15'
          ))
          AND UPPER(ISNULL(cp.[currency], '')) = UPPER(ISNULL(a.[currency], ''))
          AND UPPER(ISNULL(cp.[entityState], '')) NOT IN ('EXECUTED', 'REJECTED')), 0)
    ), 2) <> 0`);
  }

  if (input.cancellations) { conditions.push("EXISTS (SELECT 1 FROM [AccountMov] cm WHERE cm.[accountId]=a.[id] AND cm.[transaction]='Cancellation')"); }
  if (input.holderId > 0) {
    // MSN-000170: the accounts where the client has movements come from loadClientAccounts; with "only with balance"
    // the client's own balance must not be zero, and on a shared (non-policy) account it must be in his favour.
    conditions.push(input.cancellations
      ? `EXISTS (SELECT 1 FROM [AccountMov] contactMovement WHERE contactMovement.[accountId]=a.[id] AND ${movementPredicate('contactMovement', input)})`
      : `a.[id] IN (${idList(clientAccounts)})`);
    if (input.onlyWithBalance) {
      conditions.push(`a.[id] IN (${idList(clientAccounts.filter(item => Number(item.clientBalance) > 0
        || (item.lifePolicyId != null && Number(item.clientBalance) < 0)))})`);
    }
  }

  if (input.transferId > 0) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM [AccountMov] transferMovement
      WHERE transferMovement.[accountId] = a.[id]
        AND transferMovement.[transferId] = ${input.transferId}
    )`);
  }

  if (input.policy) {
    conditions.push(`pol.[code] LIKE N'%${escapeSql(input.policy)}%'`);
  }

  if (input.accountName) {
    conditions.push(`a.[name] LIKE N'%${escapeSql(input.accountName)}%'`);
  }

  if (input.accountCode) {
    conditions.push(`a.[accNo] LIKE N'%${escapeSql(input.accountCode)}%'`);
  }

  if (input.currency) {
    conditions.push(`UPPER(ISNULL(a.[currency], '')) = '${escapeSql(input.currency)}'`);
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

// MSN-000170: per account, the movements of the client (the same ones the detail lists) and the client's pending
// requests, read once for the filter and the master row.
function loadClientAccounts(input) {
  if (!(input.holderId > 0)) {
    return [];
  }

  const sql = `SELECT clientMovements.[accountId], clientMovements.[lifePolicyId], clientMovements.[movementCount], clientMovements.[movementBalance],
    ROUND(clientMovements.[movementBalance] - ISNULL(clientRequests.[pendingRefundAmount], 0), 2) AS [clientBalance]
FROM (SELECT cb.[accountId], ca.[lifePolicyId], ca.[currency], COUNT(cb.[id]) AS [movementCount], SUM(ISNULL(cb.[amount], 0)) AS [movementBalance]
  FROM [AccountMov] cb
  JOIN [Account] ca ON ca.[id] = cb.[accountId]
  WHERE ca.[type] = 'TRANSIT'
    AND ${movementPredicate('cb', { holderId: input.holderId })}
  GROUP BY cb.[accountId], ca.[lifePolicyId], ca.[currency]) clientMovements
OUTER APPLY (
  SELECT SUM(ISNULL(cp.[total], 0)) AS [pendingRefundAmount]
  FROM [ClaimPayment] cp
  WHERE cp.[sourceAccountId] = clientMovements.[accountId]
    AND cp.[claimId] IS NULL
    AND cp.[contactId] = ${input.holderId}
    AND (cp.[producer] IS NULL OR (
      UPPER(ISNULL(cp.[producer], '')) = 'MANUAL'
      AND ISNULL(cp.[paymentType], '') = '15'
    ))
    AND UPPER(ISNULL(cp.[currency], '')) = UPPER(ISNULL(clientMovements.[currency], ''))
    AND UPPER(ISNULL(cp.[entityState], '')) NOT IN ('EXECUTED', 'REJECTED')
) clientRequests;`;

  doCmd({ cmd: "DoQuery", data: { sql } });
  const response = getQueryResult();
  if (!response.ok) {
    throw new Error(response.msg || "No fue posible calcular el saldo del cliente en las cuentas en transito");
  }
  return response.outData;
}

// MSN-000170: with a client in the search the master row carries the client's own balance. A shared (non-policy)
// account holds money of several clients, so the available amount is never more than the account itself has available.
function clientBalance(row, clientAccounts) {
  const id = toPositiveInteger(row && row.id);
  const client = clientAccounts.find(item => toPositiveInteger(item && item.accountId) === id);
  if (!client || Number(client.movementCount) === Number(row.movementCount)) {
    return {};
  }

  const movementBalance = Number(client.movementBalance) || 0;
  const clientAvailable = Math.max(0, movementBalance - (Number(row.pendingRefundAmount) || 0));
  return {
    movementCount: Number(client.movementCount) || 0,
    movementBalance,
    availableBalance: Math.round(Math.min(clientAvailable, Number(row.availableBalance) || 0) * 1000000) / 1000000
  };
}

function idList(items) {
  const ids = items.map(item => toPositiveInteger(item && item.accountId)).filter(id => id > 0);
  return ids.length > 0 ? ids.join(",") : "0";
}

function movementPredicate(alias, input) {
  const parts = [];
  if (input && input.holderId > 0) {
    // Persisted contact on the movement wins; legacy movements retain account-holder lookup.
    // MSN-000138: an income with no persisted contact on a shared (non-policy) account belongs to the
    // contact whose account was debited by the same cashier operation (PPXA: same date, cash desk,
    // income type and reference). Only the filter changes; stored data is read as it is.
    // MSN-000170: money that leaves a shared account for the client is the client's too: an outflow paid by a payment
    // request whose beneficiary is the client, or the outgoing leg of a cashier operation whose income leg landed in an
    // account of the client (same date, cash desk, income type and reference).
    parts.push(`EXISTS (SELECT 1 FROM [Transfer] contactTransfer JOIN [Account] contactAccount ON contactAccount.[id]=${alias}.[accountId]
      OUTER APPLY (SELECT TOP 1 TRY_CONVERT(int,JSON_VALUE(j.[value],'$.userData[0]')) AS contactId
        FROM OPENJSON(CASE WHEN ISJSON(contactTransfer.[jIncomeTypeForm])=1 THEN contactTransfer.[jIncomeTypeForm] ELSE '[]' END) j
        WHERE JSON_VALUE(j.[value],'$.name')='hiddenCodigoCliente') storedContact
      WHERE contactTransfer.[id]=${alias}.[transferId]
        AND (COALESCE(storedContact.contactId,contactAccount.[holderId])=${input.holderId}
          OR (storedContact.contactId IS NULL
            AND contactAccount.[lifePolicyId] IS NULL
            AND ISNULL(contactTransfer.[isExternal],0)=1
            AND contactTransfer.[amount]>0
            AND EXISTS (SELECT 1 FROM [Transfer] sourceTransfer JOIN [Account] sourceAccount ON sourceAccount.[id]=sourceTransfer.[destinationAccountId]
              OUTER APPLY (SELECT TOP 1 TRY_CONVERT(int,JSON_VALUE(sj.[value],'$.userData[0]')) AS contactId
                FROM OPENJSON(CASE WHEN ISJSON(sourceTransfer.[jIncomeTypeForm])=1 THEN sourceTransfer.[jIncomeTypeForm] ELSE '[]' END) sj
                WHERE JSON_VALUE(sj.[value],'$.name')='hiddenCodigoCliente') sourceContact
              WHERE sourceTransfer.[id]<>contactTransfer.[id]
                AND sourceTransfer.[date]=contactTransfer.[date]
                AND ISNULL(sourceTransfer.[transferWorkspaceId],0)=ISNULL(contactTransfer.[transferWorkspaceId],0)
                AND ISNULL(sourceTransfer.[incomeType],'')=ISNULL(contactTransfer.[incomeType],'')
                AND ISNULL(sourceTransfer.[concept],'')=ISNULL(contactTransfer.[concept],'')
                AND ISNULL(sourceTransfer.[isExternal],0)=1
                AND sourceTransfer.[amount]<0
                AND sourceTransfer.[executed]=1
                AND sourceTransfer.[status]=1
                AND COALESCE(sourceContact.contactId,sourceAccount.[holderId])=${input.holderId}))
          OR (storedContact.contactId IS NULL
            AND contactAccount.[lifePolicyId] IS NULL
            AND ${alias}.[amount]<0
            AND EXISTS (SELECT 1 FROM [ClaimPayment] paidRequest
              WHERE paidRequest.[id]=contactTransfer.[claimPaymentId]
                AND paidRequest.[contactId]=${input.holderId}))
          OR (storedContact.contactId IS NULL
            AND contactAccount.[lifePolicyId] IS NULL
            AND ISNULL(contactTransfer.[isExternal],0)=1
            AND contactTransfer.[amount]<0
            AND EXISTS (SELECT 1 FROM [Transfer] targetTransfer JOIN [Account] targetAccount ON targetAccount.[id]=targetTransfer.[destinationAccountId]
              OUTER APPLY (SELECT TOP 1 TRY_CONVERT(int,JSON_VALUE(tj.[value],'$.userData[0]')) AS contactId
                FROM OPENJSON(CASE WHEN ISJSON(targetTransfer.[jIncomeTypeForm])=1 THEN targetTransfer.[jIncomeTypeForm] ELSE '[]' END) tj
                WHERE JSON_VALUE(tj.[value],'$.name')='hiddenCodigoCliente') targetContact
              WHERE targetTransfer.[id]<>contactTransfer.[id]
                AND targetTransfer.[date]=contactTransfer.[date]
                AND ISNULL(targetTransfer.[transferWorkspaceId],0)=ISNULL(contactTransfer.[transferWorkspaceId],0)
                AND ISNULL(targetTransfer.[incomeType],'')=ISNULL(contactTransfer.[incomeType],'')
                AND ISNULL(targetTransfer.[concept],'')=ISNULL(contactTransfer.[concept],'')
                AND ISNULL(targetTransfer.[isExternal],0)=1
                AND targetTransfer.[amount]>0
                AND targetTransfer.[executed]=1
                AND targetTransfer.[status]=1
                AND COALESCE(targetContact.contactId,targetAccount.[holderId])=${input.holderId}))))`);
  }
  parts.push(baseMovementPredicate(alias,input));
  return parts.join(' AND ');
}

function baseMovementPredicate(alias, input) {
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
