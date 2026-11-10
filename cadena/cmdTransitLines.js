//block
//noreplace

/**
 * @author AIDEN (MSN-000174)
 * @email support@axxis-systems.com
 * @created 2026/11/09
 * @name cmdTransitLines
 * @version 1.1
 * @purpose: Lines of one transit account with their own available balance, and the record of the lines each cashier
 *   operation takes (refund, premium payment, PPXA, transfer between accounts).
 *   A line is a positive movement (PREMIUMPAY excluded, as in cmdGetTransitMovs).
 *   available = amount - applied - reserved.
 *     applied: executed operations (outgoing movements, executed refund requests).
 *     reserved: refund requests in process and stamped transfers that are not executed yet.
 *   An operation started from the movement detail stamps its lines in a comment of the account
 *   (TRANSIT_LINES|{json}); the server keeps who and when. Operations without a stamp (older ones, or made elsewhere)
 *   take the oldest lines of the same client first and then the oldest lines of the account.
 *   A transfer that leaves and returns to the same account (a refund paid back into it) moves nothing.
 *   A reversal counter-movement first takes the line it reverses.
 * @context: {
 *   mode: 'list' | 'check' | 'stamp',
 *   accountId: number,
 *   page?: number, size?: number,
 *   holderId?: number, transferId?: number, name?: string, cancellations?: boolean, showAll?: boolean,
 *   operation?: 'REFUND' | 'PREMIUM' | 'PPXA' | 'TRANSFER',
 *   amount?: number,
 *   lines?: [{ movId: number, amount: number }],
 *   opTransferId?: number,
 *   opRequestId?: number
 * }
 *   list: the account lines that match the filters (same meaning as cmdGetTransitMovs), one page; name keeps the
 *     lines whose transaction contains it (MSN-000176; it was a prefix).
 *   check: validates `lines` against what is available now, leaving out opTransferId / opRequestId.
 *   stamp: validates again and records `lines` for the operation opTransferId (outgoing transfer) or opRequestId
 *     (refund request). Running it twice for the same operation records it once.
 */

const LINE_EPSILON = 0.005;
const STAMP_PREFIX = 'TRANSIT_LINES|';
const OPERATIONS = ['REFUND', 'PREMIUM', 'PPXA', 'TRANSFER'];

try {
  const input = normalizeInput(context);
  if (input.accountId <= 0) {
    throw new Error('Indique la cuenta en tránsito.');
  }

  const account = loadAccount(input.accountId);
  if (input.mode === 'check') {
    return checkLines(account, input);
  }
  if (input.mode === 'stamp') {
    return stampLines(account, input);
  }
  return listLines(account, input);
} catch (error) {
  throw new TypeError(`@${error && error.message ? error.message : String(error)}`);
}

function normalizeInput(source) {
  const value = source && typeof source === 'object' ? source : {};
  const mode = normalizeText(value.mode).toLowerCase();
  return {
    mode: mode === 'check' || mode === 'stamp' ? mode : 'list',
    accountId: toPositiveInteger(value.accountId),
    page: Math.max(toPositiveInteger(value.page) || 1, 1),
    size: Math.min(Math.max(toPositiveInteger(value.size) || 25, 1), 200),
    holderId: toPositiveInteger(value.holderId),
    transferId: toPositiveInteger(value.transferId),
    name: normalizeText(value.name),
    cancellations: value.cancellations === true,
    showAll: value.showAll === true,
    operation: normalizeText(value.operation).toUpperCase(),
    amount: roundMoney(toNumber(value.amount)),
    lines: normalizeLines(value.lines),
    opTransferId: toPositiveInteger(value.opTransferId),
    opRequestId: toPositiveInteger(value.opRequestId)
  };
}

function normalizeLines(value) {
  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (error) {
      raw = [];
    }
  }
  raw = raw ? JSON.parse(JSON.stringify(raw)) : [];
  if (!Array.isArray(raw)) {
    return [];
  }

  const merged = {};
  const order = [];
  raw.forEach(item => {
    const movId = toPositiveInteger(item && item.movId);
    const amount = roundMoney(toNumber(item && item.amount));
    if (movId <= 0 || amount <= 0) {
      return;
    }
    if (merged[movId] === undefined) {
      merged[movId] = 0;
      order.push(movId);
    }
    merged[movId] = roundMoney(merged[movId] + amount);
  });
  return order.map(movId => ({ movId, amount: merged[movId] }));
}

function loadAccount(accountId) {
  const rows = query(`SELECT a.[id], a.[accNo], a.[name], a.[type], a.[currency], a.[holderId], a.[lifePolicyId],
    pol.[code] AS [policyCode],
    LTRIM(RTRIM(CONCAT(ISNULL(con.[name], ''), ' ', ISNULL(con.[surname1], ''), ' ', ISNULL(con.[surname2], '')))) AS [contactName]
FROM [Account] a
LEFT JOIN [Contact] con ON con.[id] = a.[holderId]
LEFT JOIN [LifePolicy] pol ON pol.[id] = a.[lifePolicyId]
WHERE a.[id] = ${accountId};`, 'No fue posible leer la cuenta en tránsito.');
  const row = rows[0];
  if (!row) {
    throw new Error(`La cuenta ${accountId} no existe.`);
  }
  if (normalizeText(row.type).toUpperCase() !== 'TRANSIT') {
    throw new Error(`La cuenta ${normalizeText(row.accNo) || accountId} no es una cuenta en tránsito.`);
  }

  const lifePolicyId = toPositiveInteger(row.lifePolicyId);
  return {
    id: accountId,
    accNo: normalizeText(row.accNo),
    name: normalizeText(row.name),
    currency: normalizeText(row.currency).toUpperCase(),
    holderId: toPositiveInteger(row.holderId),
    lifePolicyId: lifePolicyId || null,
    policyCode: normalizeText(row.policyCode),
    contactName: normalizeText(row.contactName),
    shared: lifePolicyId <= 0
  };
}

function storedContactApply(transferAlias, resultAlias, jsonAlias) {
  return `OUTER APPLY (SELECT TOP 1 TRY_CONVERT(int, JSON_VALUE(${jsonAlias}.[value], '$.userData[0]')) AS [contactId]
  FROM OPENJSON(CASE WHEN ISJSON(${transferAlias}.[jIncomeTypeForm]) = 1 THEN ${transferAlias}.[jIncomeTypeForm] ELSE '[]' END) ${jsonAlias}
  WHERE JSON_VALUE(${jsonAlias}.[value], '$.name') = 'hiddenCodigoCliente') ${resultAlias}`;
}

// The other leg of the same cashier operation (same date, cash desk, income type and reference), as MSN-000138/170
// pair them on a shared account: positive legs read the client of the debited account, negative legs the client of the
// credited one.
function pairedLegApply(resultAlias, legAlias, accountAlias, jsonAlias, legSign) {
  const ownSign = legSign === '<' ? '>' : '<';
  return `OUTER APPLY (SELECT TOP 1 COALESCE(${jsonAlias}Contact.[contactId], ${accountAlias}.[holderId]) AS [contactId]
  FROM [Transfer] ${legAlias}
  JOIN [Account] ${accountAlias} ON ${accountAlias}.[id] = ${legAlias}.[destinationAccountId]
  ${storedContactApply(legAlias, jsonAlias + 'Contact', jsonAlias)}
  WHERE stored.[contactId] IS NULL
    AND ISNULL(tr.[isExternal], 0) = 1
    AND tr.[amount] ${ownSign} 0
    AND ${legAlias}.[id] <> tr.[id]
    AND ${legAlias}.[date] = tr.[date]
    AND ISNULL(${legAlias}.[transferWorkspaceId], 0) = ISNULL(tr.[transferWorkspaceId], 0)
    AND ISNULL(${legAlias}.[incomeType], '') = ISNULL(tr.[incomeType], '')
    AND ISNULL(${legAlias}.[concept], '') = ISNULL(tr.[concept], '')
    AND ISNULL(${legAlias}.[isExternal], 0) = 1
    AND ${legAlias}.[amount] ${legSign} 0
    AND ${legAlias}.[executed] = 1
    AND ${legAlias}.[status] = 1
  ORDER BY ${legAlias}.[id]) ${resultAlias}`;
}

function loadMovementRows(account) {
  const sharedColumns = account.shared
    ? ', pairedSource.[contactId] AS [pairedSourceContactId], pairedTarget.[contactId] AS [pairedTargetContactId]'
    : '';
  const sharedApplies = account.shared
    ? `${pairedLegApply('pairedSource', 'sourceLeg', 'sourceLegAccount', 'sj', '<')}
${pairedLegApply('pairedTarget', 'targetLeg', 'targetLegAccount', 'tj', '>')}`
    : '';

  const rows = query(`SELECT am.[id], am.[date], am.[transaction], am.[amount], am.[transferId], am.[transactionCode],
    tr.[claimPaymentId], tr.[reversalDate], tr.[status] AS [transferStatus],
    stored.[contactId] AS [storedContactId], paid.[contactId] AS [requestContactId]${sharedColumns}
FROM [AccountMov] am
LEFT JOIN [Transfer] tr ON tr.[id] = am.[transferId]
${storedContactApply('tr', 'stored', 'j')}
LEFT JOIN [ClaimPayment] paid ON paid.[id] = tr.[claimPaymentId]
${sharedApplies}
WHERE am.[accountId] = ${account.id}
  AND ISNULL(am.[transactionCode], '') <> 'PREMIUMPAY'
ORDER BY am.[date], am.[id];`, 'No fue posible leer los movimientos de la cuenta en tránsito.');

  return rows.map(row => ({
    id: toPositiveInteger(row.id),
    date: row.date,
    time: toTime(row.date),
    transaction: normalizeText(row.transaction),
    transactionCode: normalizeText(row.transactionCode),
    transferId: toPositiveInteger(row.transferId),
    amount: roundMoney(toNumber(row.amount)),
    claimPaymentId: toPositiveInteger(row.claimPaymentId),
    reversalTime: row.reversalDate ? toTime(row.reversalDate) : 0,
    storedContactId: toPositiveInteger(row.storedContactId),
    requestContactId: toPositiveInteger(row.requestContactId),
    pairedSourceContactId: toPositiveInteger(row.pairedSourceContactId),
    pairedTargetContactId: toPositiveInteger(row.pairedTargetContactId)
  }));
}

// The refund requests that cmdGetTransitMovs counts for the account: same filter, executed ones included.
function loadRequests(account) {
  const rows = query(`SELECT cp.[id], cp.[total], cp.[contactId], cp.[entityState], cp.[date]
FROM [ClaimPayment] cp
WHERE cp.[sourceAccountId] = ${account.id}
  AND cp.[claimId] IS NULL
  AND (cp.[producer] IS NULL OR (
    UPPER(ISNULL(cp.[producer], '')) = 'MANUAL'
    AND ISNULL(cp.[paymentType], '') = '15'
  ))
  AND UPPER(ISNULL(cp.[currency], '')) = '${escapeSql(account.currency)}'
  AND UPPER(ISNULL(cp.[entityState], '')) <> 'REJECTED'
ORDER BY cp.[date], cp.[id];`, 'No fue posible leer las solicitudes de devolución de la cuenta.');

  return rows.map(row => ({
    id: toPositiveInteger(row.id),
    total: roundMoney(toNumber(row.total)),
    contactId: toPositiveInteger(row.contactId),
    state: normalizeText(row.entityState).toUpperCase(),
    executed: normalizeText(row.entityState).toUpperCase() === 'EXECUTED',
    date: row.date,
    time: toTime(row.date)
  }));
}

function loadStamps(accountId) {
  const rows = query(`SELECT c.[id], c.[message], c.[created], c.[user]
FROM [Comment] c
WHERE c.[accountId] = ${accountId}
  AND c.[message] LIKE '${STAMP_PREFIX}%'
ORDER BY c.[id];`, 'No fue posible leer el registro de líneas aplicadas.');

  return rows.map(row => {
    let payload = null;
    try {
      payload = JSON.parse(String(row.message || '').substring(STAMP_PREFIX.length));
    } catch (error) {
      payload = null;
    }
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    return {
      commentId: toPositiveInteger(row.id),
      created: row.created,
      user: normalizeText(row.user),
      op: normalizeText(payload.op).toUpperCase(),
      transferId: toPositiveInteger(payload.transferId),
      requestId: toPositiveInteger(payload.requestId),
      amount: roundMoney(toNumber(payload.amount)),
      lines: normalizeLines(payload.lines)
    };
  }).filter(stamp => stamp && stamp.lines.length > 0);
}

function loadTransfers(ids) {
  const list = ids.filter(id => id > 0);
  if (list.length === 0) {
    return {};
  }
  const rows = query(`SELECT t.[id], t.[amount], t.[executed], t.[status], t.[destinationAccountId], t.[sourceAccountId]
FROM [Transfer] t
WHERE t.[id] IN (${list.join(',')});`, 'No fue posible leer las transferencias de la cuenta.');
  return rows.reduce((map, row) => {
    map[toPositiveInteger(row.id)] = {
      id: toPositiveInteger(row.id),
      amount: roundMoney(toNumber(row.amount)),
      executed: row.executed === true || Number(row.executed) === 1,
      status: Number(row.status) || 0,
      destinationAccountId: toPositiveInteger(row.destinationAccountId),
      sourceAccountId: toPositiveInteger(row.sourceAccountId)
    };
    return map;
  }, {});
}

function computeLines(account, exclude) {
  const excludeTransferId = toPositiveInteger(exclude && exclude.transferId);
  const excludeRequestId = toPositiveInteger(exclude && exclude.requestId);
  const movements = loadMovementRows(account)
    .filter(movement => !(excludeTransferId > 0 && movement.transferId === excludeTransferId))
    .filter(movement => !(excludeRequestId > 0 && movement.claimPaymentId === excludeRequestId));
  const requests = loadRequests(account)
    .filter(request => request.id !== excludeRequestId);
  const stamps = loadStamps(account.id)
    .filter(stamp => !(excludeTransferId > 0 && stamp.transferId === excludeTransferId))
    .filter(stamp => !(excludeRequestId > 0 && stamp.requestId === excludeRequestId));

  // A transfer whose legs on this account cancel out (money paid back into the same account) moves nothing.
  const byTransfer = {};
  movements.forEach(movement => {
    if (movement.transferId > 0) {
      if (!byTransfer[movement.transferId]) {
        byTransfer[movement.transferId] = [];
      }
      byTransfer[movement.transferId].push(movement);
    }
  });
  Object.keys(byTransfer).forEach(key => {
    const group = byTransfer[key];
    const net = group.reduce((total, movement) => total + movement.amount, 0);
    if (group.length > 1 && Math.abs(net) < LINE_EPSILON
      && group.some(movement => movement.amount > 0) && group.some(movement => movement.amount < 0)) {
      group.forEach(movement => {
        movement.kind = 'NEUTRAL';
      });
    }
  });

  const lines = [];
  const lineById = {};
  const outflows = [];
  movements.forEach(movement => {
    if (movement.kind === 'NEUTRAL') {
      return;
    }
    if (movement.amount > LINE_EPSILON) {
      movement.kind = 'LINE';
      movement.ownerId = lineOwner(movement, account);
      movement.applied = 0;
      movement.reserved = 0;
      movement.applications = [];
      lines.push(movement);
      lineById[movement.id] = movement;
    } else if (movement.amount < -LINE_EPSILON) {
      movement.kind = 'OUT';
      movement.ownerId = outflowOwner(movement, account);
      movement.coveredBy = null;
      outflows.push(movement);
    } else {
      movement.kind = 'NEUTRAL';
    }
  });

  const requestById = {};
  requests.forEach(request => {
    requestById[request.id] = request;
  });
  outflows.forEach(outflow => {
    if (outflow.claimPaymentId > 0 && requestById[outflow.claimPaymentId]) {
      outflow.coveredBy = { type: 'REQUEST', requestId: outflow.claimPaymentId };
    }
  });

  const deficit = { applied: 0, reserved: 0 };
  const state = { lines, lineById, deficit };

  // 1. Stamped operations take exactly the lines they recorded.
  const pendingTransfers = loadTransfers(stamps
    .filter(stamp => stamp.transferId > 0
      && !outflows.some(outflow => outflow.transferId === stamp.transferId))
    .map(stamp => stamp.transferId));
  stamps.forEach(stamp => {
    let kind = '';
    let target = 0;
    if (stamp.transferId > 0) {
      const covered = outflows.filter(outflow => outflow.transferId === stamp.transferId && !outflow.coveredBy);
      if (covered.length > 0) {
        kind = 'applied';
        target = roundMoney(covered.reduce((total, outflow) => total - outflow.amount, 0));
        covered.forEach(outflow => {
          outflow.coveredBy = { type: 'STAMP', commentId: stamp.commentId, op: stamp.op };
        });
      } else {
        const transfer = pendingTransfers[stamp.transferId];
        if (transfer && !transfer.executed && transfer.status !== 2) {
          kind = 'reserved';
          target = Math.abs(transfer.amount);
        }
      }
    } else if (stamp.requestId > 0) {
      const request = requestById[stamp.requestId];
      if (request && !request.stamped) {
        kind = request.executed ? 'applied' : 'reserved';
        target = request.total;
        request.stamped = true;
      }
    }
    if (!kind) {
      return;
    }

    const reference = {
      type: 'STAMP',
      op: stamp.op,
      commentId: stamp.commentId,
      transferId: stamp.transferId || null,
      requestId: stamp.requestId || null,
      user: stamp.user,
      date: stamp.created
    };
    let remaining = roundMoney(target);
    stamp.lines.forEach(entry => {
      if (remaining <= LINE_EPSILON) {
        return;
      }
      const line = lineById[entry.movId];
      const wanted = Math.min(entry.amount, remaining);
      const used = line ? takeFromLine(line, wanted, kind, reference) : 0;
      remaining = roundMoney(remaining - used);
    });
    if (remaining > LINE_EPSILON) {
      consumeOldest(state, remaining, 0, 0, kind, reference);
    }
  });

  // 2. Everything else that left the account, oldest first.
  const events = [];
  outflows.filter(outflow => !outflow.coveredBy).forEach(outflow => {
    events.push({
      time: outflow.time,
      order: outflow.id,
      amount: roundMoney(-outflow.amount),
      ownerId: outflow.ownerId,
      preferredLineId: reversedLineId(outflow, lines),
      reference: {
        type: 'MOVEMENT',
        movementId: outflow.id,
        transferId: outflow.transferId || null,
        transaction: outflow.transaction,
        date: outflow.date
      }
    });
  });
  requests.filter(request => request.executed && !request.stamped).forEach(request => {
    events.push({
      time: request.time,
      order: request.id,
      amount: request.total,
      ownerId: request.contactId,
      preferredLineId: 0,
      reference: { type: 'REQUEST', requestId: request.id, state: request.state, date: request.date }
    });
  });
  events.sort((left, right) => (left.time - right.time) || (left.order - right.order));
  events.forEach(event => consumeOldest(state, event.amount, event.ownerId, event.preferredLineId, 'applied', event.reference));

  // 3. Requests in process reserve what is left, oldest first.
  requests.filter(request => !request.executed && !request.stamped).forEach(request => {
    consumeOldest(state, request.total, request.contactId, 0, 'reserved', {
      type: 'REQUEST',
      requestId: request.id,
      state: request.state,
      date: request.date
    });
  });

  lines.forEach(line => {
    line.applied = roundMoney(line.applied);
    line.reserved = roundMoney(line.reserved);
    line.available = roundMoney(line.amount - line.applied - line.reserved);
  });
  outflows.forEach(outflow => {
    outflow.applied = 0;
    outflow.reserved = 0;
    outflow.available = 0;
  });

  const rows = movements.slice();
  rows.forEach(row => {
    if (row.kind === 'NEUTRAL') {
      row.applied = 0;
      row.reserved = 0;
      row.available = 0;
    }
  });

  const pendingRequests = requests.filter(request => !request.executed);
  return {
    rows,
    lines,
    lineById,
    summary: {
      lineAmount: roundMoney(lines.reduce((total, line) => total + line.amount, 0)),
      applied: roundMoney(lines.reduce((total, line) => total + line.applied, 0)),
      reserved: roundMoney(lines.reduce((total, line) => total + line.reserved, 0)),
      available: roundMoney(lines.reduce((total, line) => total + Math.max(0, line.available), 0)),
      unassigned: roundMoney(deficit.applied + deficit.reserved),
      movementBalance: roundMoney(movements.reduce((total, movement) => total + movement.amount, 0)),
      pendingRefundAmount: roundMoney(pendingRequests.reduce((total, request) => total + request.total, 0)),
      stamps: stamps.length
    }
  };
}

function takeFromLine(line, amount, kind, reference) {
  const free = roundMoney(line.amount - line.applied - line.reserved);
  const used = roundMoney(Math.min(free, amount));
  if (used <= LINE_EPSILON) {
    return 0;
  }
  line[kind] = roundMoney(line[kind] + used);
  line.applications.push({ ...reference, kind: kind === 'applied' ? 'APPLIED' : 'RESERVED', amount: used });
  return used;
}

// Oldest lines first: the line a reversal undoes, then the client's own lines, then any line of the account.
function consumeOldest(state, amount, ownerId, preferredLineId, kind, reference) {
  let remaining = roundMoney(amount);
  if (preferredLineId > 0 && state.lineById[preferredLineId]) {
    remaining = roundMoney(remaining - takeFromLine(state.lineById[preferredLineId], remaining, kind, reference));
  }
  if (ownerId > 0) {
    state.lines.forEach(line => {
      if (remaining > LINE_EPSILON && line.ownerId === ownerId) {
        remaining = roundMoney(remaining - takeFromLine(line, remaining, kind, reference));
      }
    });
  }
  state.lines.forEach(line => {
    if (remaining > LINE_EPSILON) {
      remaining = roundMoney(remaining - takeFromLine(line, remaining, kind, reference));
    }
  });
  if (remaining > LINE_EPSILON) {
    state.deficit[kind] = roundMoney(state.deficit[kind] + remaining);
  }
}

function reversedLineId(outflow, lines) {
  if (!/\((Reversión|Reversion|Reversal)\)\s*$/i.test(outflow.transaction)) {
    return 0;
  }
  const amount = Math.abs(outflow.amount);
  const line = lines.find(item => item.reversalTime > 0
    && Math.abs(item.reversalTime - outflow.time) <= 2000
    && Math.abs(item.amount - amount) < LINE_EPSILON);
  return line ? line.id : 0;
}

function lineOwner(movement, account) {
  if (movement.storedContactId > 0) {
    return movement.storedContactId;
  }
  if (account.shared && movement.pairedSourceContactId > 0) {
    return movement.pairedSourceContactId;
  }
  return account.holderId;
}

function outflowOwner(movement, account) {
  if (movement.storedContactId > 0) {
    return movement.storedContactId;
  }
  if (account.shared && movement.requestContactId > 0) {
    return movement.requestContactId;
  }
  if (account.shared && movement.pairedTargetContactId > 0) {
    return movement.pairedTargetContactId;
  }
  return account.holderId;
}

function listLines(account, input) {
  const state = computeLines(account, {});
  let rows = state.rows;

  if (input.holderId > 0) {
    const holderIds = loadHolderMovementIds(account.id, input.holderId);
    rows = rows.filter(row => holderIds[row.id] === true);
  }
  if (input.transferId > 0) {
    rows = rows.filter(row => row.transferId === input.transferId);
  }
  if (input.name) {
    const text = input.name.toLowerCase();
    rows = rows.filter(row => row.transaction.toLowerCase().indexOf(text) >= 0);
  }
  if (input.cancellations) {
    rows = rows.filter(row => row.transaction === 'Cancellation');
  }
  if (!input.showAll) {
    rows = rows.filter(row => row.kind === 'LINE' && row.available > LINE_EPSILON);
  }

  const lineRows = rows.filter(row => row.kind === 'LINE');
  const totals = {
    rows: rows.length,
    lines: lineRows.length,
    amount: roundMoney(lineRows.reduce((total, row) => total + row.amount, 0)),
    applied: roundMoney(lineRows.reduce((total, row) => total + row.applied, 0)),
    reserved: roundMoney(lineRows.reduce((total, row) => total + row.reserved, 0)),
    available: roundMoney(lineRows.reduce((total, row) => total + Math.max(0, row.available), 0))
  };

  const offset = (input.page - 1) * input.size;
  const page = rows.slice(offset, offset + input.size);
  const names = loadContactNames(page.map(row => row.ownerId));

  return {
    ok: true,
    msg: 'Líneas de la cuenta en tránsito cargadas correctamente',
    account: { ...publicAccount(account), ...state.summary },
    data: page.map(row => publicRow(row, names)),
    total: rows.length,
    totals
  };
}

function checkLines(account, input) {
  const state = computeLines(account, { transferId: input.opTransferId, requestId: input.opRequestId });
  validateSelection(account, state, input);
  return {
    ok: true,
    msg: 'Las líneas seleccionadas tienen saldo disponible.',
    account: { ...publicAccount(account), ...state.summary },
    amount: roundMoney(input.lines.reduce((total, entry) => total + entry.amount, 0)),
    lines: input.lines.map(entry => ({ ...entry, available: state.lineById[entry.movId].available }))
  };
}

function stampLines(account, input) {
  if (OPERATIONS.indexOf(input.operation) < 0) {
    throw new Error('Indique la operación: REFUND, PREMIUM, PPXA o TRANSFER.');
  }
  if (input.opTransferId <= 0 && input.opRequestId <= 0) {
    throw new Error('Indique la transferencia o la solicitud de la operación.');
  }
  if (input.opTransferId > 0 && input.opRequestId > 0) {
    throw new Error('Indique sólo la transferencia o sólo la solicitud de la operación.');
  }

  const existing = loadStamps(account.id).find(stamp =>
    (input.opTransferId > 0 && stamp.transferId === input.opTransferId)
    || (input.opRequestId > 0 && stamp.requestId === input.opRequestId));
  if (existing) {
    return {
      ok: true,
      msg: 'La operación ya tenía sus líneas registradas.',
      duplicate: true,
      commentId: existing.commentId,
      lines: existing.lines
    };
  }

  if (input.opRequestId > 0) {
    const request = query(`SELECT cp.[id], cp.[total], cp.[sourceAccountId], cp.[entityState]
FROM [ClaimPayment] cp WHERE cp.[id] = ${input.opRequestId};`, 'No fue posible leer la solicitud.')[0];
    if (!request || toPositiveInteger(request.sourceAccountId) !== account.id) {
      throw new Error(`La solicitud ${input.opRequestId} no sale de la cuenta ${account.accNo}.`);
    }
    if (normalizeText(request.entityState).toUpperCase() === 'REJECTED') {
      throw new Error(`La solicitud ${input.opRequestId} está rechazada.`);
    }
    if (Math.abs(roundMoney(toNumber(request.total)) - input.amount) > LINE_EPSILON) {
      throw new Error(`La solicitud ${input.opRequestId} es por ${formatAmount(toNumber(request.total))}, no por ${formatAmount(input.amount)}.`);
    }
  } else {
    const transfer = loadTransfers([input.opTransferId])[input.opTransferId];
    if (!transfer || transfer.destinationAccountId !== account.id || transfer.amount >= 0) {
      throw new Error(`La transferencia ${input.opTransferId} no descuenta de la cuenta ${account.accNo}.`);
    }
    if (transfer.status === 2) {
      throw new Error(`La transferencia ${input.opTransferId} está reversada.`);
    }
    if (Math.abs(Math.abs(transfer.amount) - input.amount) > LINE_EPSILON) {
      throw new Error(`La transferencia ${input.opTransferId} es por ${formatAmount(Math.abs(transfer.amount))}, no por ${formatAmount(input.amount)}.`);
    }
  }

  const state = computeLines(account, { transferId: input.opTransferId, requestId: input.opRequestId });
  validateSelection(account, state, input);

  const message = STAMP_PREFIX + JSON.stringify({
    v: 1,
    op: input.operation,
    transferId: input.opTransferId || null,
    requestId: input.opRequestId || null,
    amount: input.amount,
    lines: input.lines
  });
  doCmd({ cmd: 'RepoComment', data: { operation: 'ADD', entity: { accountId: account.id, message } } });
  const result = typeof RepoComment === 'undefined' ? null : RepoComment;
  if (!result || result.ok === false) {
    throw new Error(result && result.msg ? result.msg : 'No fue posible registrar las líneas aplicadas.');
  }
  const saved = Array.isArray(result.outData) ? result.outData[0] : result.outData;

  return {
    ok: true,
    msg: 'Líneas aplicadas registradas.',
    duplicate: false,
    commentId: toPositiveInteger(saved && saved.id),
    lines: input.lines
  };
}

function validateSelection(account, state, input) {
  if (input.lines.length === 0) {
    throw new Error('Seleccione al menos una línea con saldo disponible.');
  }
  const total = roundMoney(input.lines.reduce((sum, entry) => sum + entry.amount, 0));
  if (input.amount > 0 && Math.abs(total - input.amount) > LINE_EPSILON) {
    throw new Error(`Las líneas suman ${formatAmount(total)} y la operación es por ${formatAmount(input.amount)}.`);
  }
  input.lines.forEach(entry => {
    const line = state.lineById[entry.movId];
    if (!line) {
      throw new Error(`El movimiento ${entry.movId} no es una línea de entrada de la cuenta ${account.accNo}.`);
    }
    if (entry.amount - line.available > LINE_EPSILON) {
      throw new Error(`La línea ${entry.movId} tiene disponible ${formatAmount(line.available)} y se le quieren aplicar ${formatAmount(entry.amount)}.`);
    }
  });
}

function loadHolderMovementIds(accountId, holderId) {
  const rows = query(`SELECT am.[id]
FROM [AccountMov] am
WHERE am.[accountId] = ${accountId}
  AND ${movementPredicate('am', { holderId })};`, 'No fue posible filtrar los movimientos del contacto.');
  return rows.reduce((map, row) => {
    map[toPositiveInteger(row.id)] = true;
    return map;
  }, {});
}

function loadContactNames(ids) {
  const list = Array.from(new Set(ids.filter(id => id > 0)));
  if (list.length === 0) {
    return {};
  }
  const rows = query(`SELECT con.[id], LTRIM(RTRIM(CONCAT(ISNULL(con.[name], ''), ' ', ISNULL(con.[surname1], ''), ' ', ISNULL(con.[surname2], '')))) AS [contactName]
FROM [Contact] con WHERE con.[id] IN (${list.join(',')});`, 'No fue posible leer los contactos.');
  return rows.reduce((map, row) => {
    map[toPositiveInteger(row.id)] = normalizeText(row.contactName);
    return map;
  }, {});
}

function publicAccount(account) {
  return {
    id: account.id,
    accNo: account.accNo,
    name: account.name,
    currency: account.currency,
    holderId: account.holderId,
    lifePolicyId: account.lifePolicyId,
    policyCode: account.policyCode,
    contactName: account.contactName,
    shared: account.shared
  };
}

function publicRow(row, names) {
  return {
    id: row.id,
    date: row.date,
    transaction: row.transaction,
    transactionCode: row.transactionCode,
    transferId: row.transferId || null,
    amount: row.amount,
    kind: row.kind,
    applied: row.applied || 0,
    reserved: row.reserved || 0,
    available: row.kind === 'LINE' ? row.available : 0,
    ownerId: row.ownerId || null,
    ownerName: row.ownerId ? names[row.ownerId] || '' : '',
    applications: row.kind === 'LINE' ? row.applications : [],
    coveredBy: row.kind === 'OUT' ? row.coveredBy : null
  };
}

// Same predicate as cmdGetTransitMovs (MSN-000138/170): which movements belong to the client.
function movementPredicate(alias, input) {
  const parts = [];
  if (input && input.holderId > 0) {
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
  parts.push(`ISNULL(${alias}.[transactionCode], '') <> 'PREMIUMPAY'`);
  return parts.join(' AND ');
}

function query(sql, failure) {
  doCmd({ cmd: 'DoQuery', data: { sql } });
  const result = typeof DoQuery === 'undefined' ? null : DoQuery;
  if (!result || result.ok === false) {
    throw new Error(result && result.msg ? result.msg : failure);
  }
  return Array.isArray(result.outData) ? JSON.parse(JSON.stringify(result.outData)) : [];
}

function toTime(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function formatAmount(value) {
  return roundMoney(value).toFixed(2);
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
