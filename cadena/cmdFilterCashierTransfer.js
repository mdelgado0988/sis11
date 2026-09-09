//block
//noreplace

/**
 * @author Codex
 * @created 2026/09/09
 * @name cmdFilterCashierTransfer
 * @version 1.0
 * @purpose Query cashier transfers through RepoTransfer, group them by allocation
 *          and return a FilterTransfer-compatible movement payload.
 * @context The same filter parameters accepted by FilterTransfer:
 *          workspaceId, groupByAllocation, size, page, currency, allocated,
 *          external, executed, concept, minAmount, maxAmount, month,
 *          claimPaymentId, allocationId, fromDate, toDate, id, paymentMethod
 *          and incomeType.
 * @notes Related transfers are loaded without the workspace restriction so
 *        reversals linked to an allocation are kept in AllocationMovements.
 */

try {
  const input = normalizeInput(context || {});
  const baseFilter = buildFilter(input);
  const transfers = filterByPaymentMethod(loadTransfers(baseFilter), input.paymentMethod);

  const allocationIds = uniquePositiveIds(transfers
    .map(item => item && item.allocationId));
  const relatedTransfers = allocationIds.length > 0
    ? loadTransfers(`allocationId IN (${allocationIds.join(',')}) AND status = 1 AND executed = 1`)
    : [];

  const allTransfers = mergeTransfers(transfers, relatedTransfers);
  const groups = input.groupByAllocation
    ? groupByAllocation(allTransfers, transfers)
    : transfers.map(item => ({
        ...item,
        AllocationMovements: []
      }));

  const filteredGroups = input.cashier
    ? groups.filter(group => getText(group && group.user)
      .toLowerCase()
      .includes(input.cashier.toLowerCase()))
    : groups;
  const start = input.page * input.size;
  const data = filteredGroups.slice(start, start + input.size);

  return data;
} catch (error) {
  throw new TypeError(`@${error && error.message ? error.message : String(error)}`);
}

function normalizeInput(source) {
  let value = source;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (error) {
      value = {};
    }
  }
  value = value && typeof value === 'object' ? value : {};
  return {
    workspaceId: positiveInteger(value.workspaceId),
    groupByAllocation: value.groupByAllocation !== false,
    size: Math.min(Math.max(positiveInteger(value.size) || 15, 1), 5000),
    page: Math.max(integer(value.page), 0),
    currency: getText(value.currency),
    allocated: value.allocated,
    external: value.external,
    executed: value.executed,
    status: value.status === undefined || value.status === null ? null : integer(value.status),
    concept: getText(value.concept),
    minAmount: numericOrNull(value.minAmount),
    maxAmount: numericOrNull(value.maxAmount),
    month: getText(value.month),
    claimPaymentId: positiveInteger(value.claimPaymentId),
    allocationId: positiveInteger(value.allocationId),
    fromDate: getText(value.fromDate),
    toDate: getText(value.toDate),
    id: positiveInteger(value.id),
    paymentMethod: getText(value.paymentMethod),
    incomeType: getText(value.incomeType),
    cashier: getText(value.cashier)
  };
}

function buildFilter(input) {
  const filters = [];
  if (input.workspaceId > 0) {
    filters.push(`(transferWorkspaceId = ${input.workspaceId}
      OR EXISTS (SELECT 1 FROM Allocation a
        WHERE a.id = [Transfer].allocationId
          AND a.transferWorkspaceId = ${input.workspaceId}))`);
  }
  if (typeof input.external === 'boolean') filters.push(`isExternal = ${input.external ? 1 : 0}`);
  if (typeof input.executed === 'boolean') filters.push(`executed = ${input.executed ? 1 : 0}`);
  if (input.status !== null) filters.push(`status = ${input.status}`);
  if (input.currency) filters.push(`currency = N'${escapeSql(input.currency)}'`);
  if (input.concept) filters.push(`[concept] LIKE N'%${escapeSql(input.concept)}%'`);
  if (input.minAmount !== null) filters.push(`amount >= ${input.minAmount}`);
  if (input.maxAmount !== null) filters.push(`amount <= ${input.maxAmount}`);
  if (input.claimPaymentId > 0) filters.push(`claimPaymentId = ${input.claimPaymentId}`);
  if (input.allocationId > 0) filters.push(`allocationId = ${input.allocationId}`);
  if (input.id > 0) filters.push(`id = ${input.id}`);
  if (input.incomeType) filters.push(`incomeType = N'${escapeSql(input.incomeType)}'`);
  if (input.fromDate) filters.push(`[date] >= '${escapeSql(input.fromDate)}'`);
  if (input.toDate) filters.push(`[date] <= '${escapeSql(input.toDate)}'`);

  if (input.month && /^\d{4}-\d{2}$/.test(input.month)) {
    const nextMonth = getNextMonth(input.month);
    filters.push(`[date] >= '${input.month}-01'`);
    filters.push(`[date] < '${nextMonth}-01'`);
  }

  if (input.allocated === true) filters.push('allocationId IS NOT NULL');
  if (input.allocated === false) filters.push('allocationId IS NULL');
  return filters.length > 0 ? filters.join(' AND ') : '1 = 1';
}

function loadTransfers(filter) {
  doCmd({
    cmd: 'RepoTransfer',
    data: {
      operation: 'GET',
      filter,
      include: ['SplitPayments', 'IncomeType', 'DestinationAccount', 'Allocation', 'Allocation.InstallmentPremiums'],
      size: 0,
      page: 0,
      noTracking: true
    }
  });

  if (typeof RepoTransfer === 'undefined' || !RepoTransfer || RepoTransfer.ok === false) {
    throw new Error(RepoTransfer && RepoTransfer.msg
      ? RepoTransfer.msg
      : 'No fue posible consultar los movimientos de caja.');
  }

  return Array.isArray(RepoTransfer.outData) ? RepoTransfer.outData : [];
}

function groupByAllocation(records, selectedRecords) {
  const selectedIds = new Set((selectedRecords || [])
    .map(item => positiveInteger(item && item.id))
    .filter(id => id > 0));
  const groups = new Map();

  records.forEach(item => {
    const allocationId = positiveInteger(item && item.allocationId);
    const status = item && item.status !== undefined && item.status !== null
      ? String(item.status)
      : 'null';
    const key = allocationId > 0
      ? `allocation:${allocationId}:status:${status}`
      : `transfer:${item && item.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  return Array.from(groups.values())
    .filter(items => items.some(item => selectedIds.has(positiveInteger(item && item.id))))
    .map((items, index) => {
      const primary = items.find(item => item && item.isExternal === true && !isReversal(item))
        || items.find(item => item && item.isExternal === true)
        || items[0]
        || {};
      const children = items.filter(item => item !== primary);
      return {
        ...primary,
        id: primary.id || `allocation-${index}`,
        allocationId: primary.allocationId || (children[0] && children[0].allocationId) || null,
        AllocationMovements: children
      };
    });
}

function mergeTransfers(first, second) {
  const result = [];
  const ids = new Set();
  (first || []).concat(second || []).forEach(item => {
    const id = positiveInteger(item && item.id);
    const key = id > 0 ? `id:${id}` : JSON.stringify(item);
    if (ids.has(key)) return;
    ids.add(key);
    result.push(item);
  });
  return result;
}

function filterByPaymentMethod(records, paymentMethod) {
  if (!paymentMethod) return records;
  const expected = paymentMethod.toUpperCase();
  return (records || []).filter(item => {
    const splitPayments = Array.isArray(item && item.SplitPayments)
      ? item.SplitPayments
      : [];
    const values = splitPayments.reduce((result, splitPayment) => result.concat([
      splitPayment && splitPayment.paymentMethod,
      splitPayment && splitPayment.paymentMethodCode,
      splitPayment && splitPayment.methodCode,
      splitPayment && splitPayment.PaymentMethod && splitPayment.PaymentMethod.code
    ]), []);
    values.push(item && item.paymentMethod);
    values.push(item && item.paymentMethodCode);
    values.push(item && item.methodCode);
    return values.some(value => getText(value).toUpperCase() === expected);
  });
}

function uniquePositiveIds(values) {
  return Array.from(new Set((values || []).map(positiveInteger).filter(id => id > 0)));
}

function isReversal(item) {
  if (!item) return false;
  if (item.reversalDate || item.reversalOfId || item.reverted || item.reversed) return true;
  return /reversal|reversion/i.test(getText(item.concept));
}

function getNextMonth(value) {
  const parts = value.split('-').map(Number);
  const year = parts[0] + (parts[1] === 12 ? 1 : 0);
  const month = parts[1] === 12 ? 1 : parts[1] + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function integer(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : 0;
}

function numericOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getText(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

function escapeSql(value) {
  return getText(value).replace(/'/g, "''");
}
