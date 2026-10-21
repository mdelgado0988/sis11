//block
//noreplace

/**
 * @name cmdCloseTransferWorkspaceCustom
 * @author AIDEN (MSN-000089)
 * @created 2026/10/21
 * @version 1.1.0
 * @purpose Cierre de caja personalizado.
 *   Hace las mismas validaciones y el mismo proceso, en el mismo orden:
 *     1. La caja existe.
 *     2. Quien cierra es administrador o el usuario dueño de la caja.
 *     3. Cada moneda queda con saldo 0. Del saldo se descuentan los movimientos de fuentes
 *        externas cuyo saldo de cierre no es 0 y los pagos con medios de pago sin depósito.
 *     4. Todos los movimientos que entran al cierre están ejecutados.
 *     5. Marca la caja como cerrada.
 *   Entran al cierre los movimientos de la caja que tienen asignación o, si no la tienen, los de
 *   status distinto de 2 (sólo status 1 si Cashier.balanceExecutedOnly está activo en el perfil
 *   de configuración). Los depósitos de supervisor (transactionCode SUPERDEP) no entran.
 * @context { workspaceId: number, dryRun?: boolean }
 *   dryRun en true corre todas las validaciones y devuelve el resultado sin cerrar la caja.
 * @usage ExeChain { chain: 'cmdCloseTransferWorkspaceCustom', context: '{"workspaceId":113}' }
 *   Responde ok:false con el mensaje de la validación que falla, como el nativo; si pasa,
 *   ok:true y en outData el detalle por moneda (balances) y el estado final de la caja.
 */

const messages = {
  notFound: 'Workspace not found',
  unauthorized: 'No autorizado',
  balance: 'La suma de {0} requiere un saldo final de 0 pero el saldo actual es de {1}',
  notExecuted: 'Todos los movimientos deben de ser ejecutados antes de cerrar la caja',
  notClosed: 'No fue posible marcar la caja {0} como cerrada',
  ok: 'OK'
};

try {
  const input = readContext();
  const workspaceId = toInteger(input.workspaceId);
  const dryRun = isTrue(input.dryRun);
  const sysUser = input.sysUser == null ? '' : String(input.sysUser);
  const sysIsAdmin = isTrue(input.sysIsAdmin);

  // 1. La caja existe
  const workspace = workspaceId > 0 ? loadWorkspace(workspaceId) : null;
  if (!workspace) fail(messages.notFound);

  // 2. Administrador o dueño de la caja
  if (!sysIsAdmin && workspace.user !== sysUser) fail(messages.unauthorized);

  // Movimientos que entran al cierre
  const balanceExecutedOnly = readBalanceExecutedOnly();
  const transfers = loadTransfers(workspaceId, balanceExecutedOnly);

  // 3. Saldo 0 por moneda
  const balances = checkCurrencyBalances(workspaceId, transfers);

  // 4. Todos los movimientos ejecutados
  checkAllExecuted(transfers);

  const result = {
    ok: true,
    msg: messages.ok,
    workspaceId: workspaceId,
    dryRun: dryRun,
    balanceExecutedOnly: balanceExecutedOnly,
    movements: transfers.length,
    balances: balances,
    closed: workspace.closed
  };
  if (dryRun) return result;

  // 5. Cerrar la caja
  closeWorkspace(workspaceId);
  result.closed = true;
  return result;
} catch (error) {
  throw '@' + reasonOf(error);
}

function loadWorkspace(workspaceId) {
  const rows = query('SELECT id, [user], closed FROM TransferWorkspace WHERE id = ' + workspaceId);
  if (!rows.length) return null;
  return {
    id: Number(rows[0].id),
    user: rows[0].user == null ? null : String(rows[0].user),
    closed: isTrue(rows[0].closed)
  };
}

function readBalanceExecutedOnly() {
  doCmd({ cmd: 'GetConfig', data: { path: '$.Cashier.balanceExecutedOnly' } });
  if (typeof GetConfig === 'undefined' || !GetConfig || GetConfig.ok === false) {
    fail(typeof GetConfig !== 'undefined' && GetConfig && GetConfig.msg ? GetConfig.msg : 'GetConfig failed');
  }
  return isTrue(GetConfig.outData);
}

function loadTransfers(workspaceId, balanceExecutedOnly) {
  const statusFilter = balanceExecutedOnly ? 't.status = 1' : 't.status <> 2';
  const rows = query(
    'SELECT t.id AS transferId, t.executed, t.currency AS transferCurrency, t.amount AS transferAmount, ' +
    't.sourceExternal, s.id AS splitId, s.currency AS splitCurrency, s.amount AS splitAmount, ' +
    's.amountEx AS splitAmountEx, s.conversion, s.paymentMethod, pm.noDeposit ' +
    'FROM [Transfer] t ' +
    'LEFT JOIN SplitPayment s ON s.transferId = t.id ' +
    'LEFT JOIN PaymentMethodCatalog pm ON pm.code = s.paymentMethod ' +
    'WHERE t.transferWorkspaceId = ' + workspaceId + ' ' +
    'AND (t.allocationId IS NOT NULL OR ' + statusFilter + ') ' +
    "AND (t.transactionCode IS NULL OR t.transactionCode <> 'SUPERDEP') " +
    'ORDER BY t.id, s.id'
  );
  const transfers = [];
  const byId = {};
  rows.forEach(function (row) {
    const id = Number(row.transferId);
    let transfer = byId[id];
    if (!transfer) {
      transfer = {
        id: id,
        executed: isTrue(row.executed),
        currency: row.transferCurrency == null ? null : String(row.transferCurrency),
        amount: toScaled(row.transferAmount),
        sourceExternal: row.sourceExternal == null ? null : String(row.sourceExternal),
        payments: []
      };
      byId[id] = transfer;
      transfers.push(transfer);
    }
    if (row.splitId != null) {
      const conversion = isTrue(row.conversion);
      transfer.payments.push({
        id: Number(row.splitId),
        currency: row.splitCurrency == null ? null : String(row.splitCurrency),
        amount: toScaled(conversion ? row.splitAmountEx : row.splitAmount),
        paymentMethod: row.paymentMethod == null ? null : String(row.paymentMethod),
        noDeposit: isTrue(row.noDeposit)
      });
    }
  });
  return transfers;
}

function loadExemptSources() {
  const rows = query('SELECT code FROM ExternalSourceCatalog WHERE closingBalance IS NULL OR closingBalance <> 0');
  return rows.map(function (row) { return String(row.code); });
}

function checkCurrencyBalances(workspaceId, transfers) {
  const summary = loadCashierIncomeSummary(workspaceId);
  if (summary.length) return checkCurrencyBalancesFromSummary(summary);

  // Fallback para ambientes donde el resumen nativo no devuelve partidas.
  return checkCurrencyBalancesFromTransfers(transfers);
}

function loadCashierIncomeSummary(workspaceId) {
  doCmd({ cmd: 'GetCashierIncomeSummary', data: { workspaceId: workspaceId } });
  if (typeof GetCashierIncomeSummary === 'undefined' || !GetCashierIncomeSummary || GetCashierIncomeSummary.ok === false) {
    fail(typeof GetCashierIncomeSummary !== 'undefined' && GetCashierIncomeSummary && GetCashierIncomeSummary.msg
      ? GetCashierIncomeSummary.msg
      : 'GetCashierIncomeSummary failed');
  }
  const out = GetCashierIncomeSummary.outData || {};
  return Array.isArray(out.summary) ? out.summary : [];
}

function checkCurrencyBalancesFromSummary(summary) {
  const groups = [];
  summary.forEach(function (row) {
    const currency = row.currency == null || String(row.currency).trim() === '' ? 'USD' : String(row.currency);
    let group = null;
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].currency === currency) { group = groups[i]; break; }
    }
    if (!group) {
      group = { currency: currency, amount: 0, deposit: 0, cashFund: 0, pending: 0 };
      groups.push(group);
    }

    // Misma normalización que cmdGetCashierBalanceSummary: un depósito siempre
    // reduce el saldo disponible, aun si su signo contable viene invertido.
    const amount = Math.abs(toScaled(row.amount));
    const deposit = Math.abs(toScaled(row.deposit));
    const cashFund = toScaled(row.cashFund);
    group.amount += amount;
    group.deposit += deposit;
    group.cashFund += cashFund;
    group.pending += Math.max(0, amount - deposit + cashFund);
  });

  groups.forEach(function (group) {
    if (group.pending !== 0) {
      fail(fillMessage(messages.balance, [group.currency, formatAmount(group.pending)]));
    }
  });

  return groups.map(function (group) {
    return {
      currency: group.currency,
      balance: formatAmount(group.amount),
      exempt: formatAmount(group.deposit),
      excluded: formatAmount(group.cashFund),
      pending: formatAmount(group.pending)
    };
  });
}

function checkCurrencyBalancesFromTransfers(transfers) {
  const groups = [];
  transfers.forEach(function (transfer) {
    transfer.payments.forEach(function (payment) {
      let group = null;
      for (let i = 0; i < groups.length; i++) {
        if (groups[i].currency === payment.currency) { group = groups[i]; break; }
      }
      if (!group) {
        group = { currency: payment.currency, balance: 0 };
        groups.push(group);
      }
      group.balance += payment.amount;
    });
  });

  const exemptSources = groups.some(function (group) { return group.balance !== 0; }) ? loadExemptSources() : [];
  const balances = [];
  groups.forEach(function (group) {
    let exempt = 0;
    let excluded = 0;
    if (group.balance !== 0) {
      transfers.forEach(function (transfer) {
        if (transfer.currency === group.currency && exemptSources.indexOf(transfer.sourceExternal) >= 0) exempt += transfer.amount;
        transfer.payments.forEach(function (payment) {
          if (payment.noDeposit && payment.currency === group.currency) excluded += payment.amount;
        });
      });
      const pending = group.balance - exempt - excluded;
      if (pending !== 0) {
        fail(fillMessage(messages.balance, [group.currency == null ? '' : group.currency, formatAmount(pending)]));
      }
    }
    balances.push({
      currency: group.currency,
      balance: formatAmount(group.balance),
      exempt: formatAmount(exempt),
      excluded: formatAmount(excluded),
      pending: formatAmount(group.balance - exempt - excluded)
    });
  });
  return balances;
}

function checkAllExecuted(transfers) {
  if (transfers.some(function (transfer) { return !transfer.executed; })) fail(messages.notExecuted);
}

function closeWorkspace(workspaceId) {
  doCmd({ cmd: 'SetField', data: { entity: 'TransferWorkspace', entityId: workspaceId, fieldValue: 'closed = 1' } });
  if (typeof SetField === 'undefined' || !SetField || SetField.ok === false) {
    fail(typeof SetField !== 'undefined' && SetField && SetField.msg ? SetField.msg : fillMessage(messages.notClosed, [workspaceId]));
  }
  const workspace = loadWorkspace(workspaceId);
  if (!workspace || !workspace.closed) fail(fillMessage(messages.notClosed, [workspaceId]));
}

function query(sql) {
  doCmd({ cmd: 'DoQuery', data: { sql: sql } });
  if (typeof DoQuery === 'undefined' || !DoQuery || DoQuery.ok === false) {
    fail(typeof DoQuery !== 'undefined' && DoQuery && DoQuery.msg ? DoQuery.msg : 'DoQuery failed');
  }
  const out = DoQuery.outData;
  const rows = [];
  if (out && typeof out.length === 'number') {
    for (let i = 0; i < out.length; i++) rows.push(out[i]);
  }
  return rows;
}

function readContext() {
  if (context && typeof context === 'object') return context;
  if (typeof context === 'string' && context.trim()) return JSON.parse(context);
  return {};
}

function toInteger(value) {
  const number = Number(value);
  return isFinite(number) && Math.floor(number) === number ? number : 0;
}

function toScaled(value) {
  const number = Number(value);
  return isFinite(number) ? Math.round(number * 100000) : 0;
}

function formatAmount(scaled) {
  const abs = Math.abs(scaled);
  const units = Math.floor(abs / 100000);
  const decimals = String(abs % 100000);
  return (scaled < 0 ? '-' : '') + units + '.' + '00000'.slice(decimals.length) + decimals;
}

function isTrue(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
}

function fillMessage(template, values) {
  return String(template).replace(/\{(\d+)\}/g, function (match, index) {
    const value = values[Number(index)];
    return value == null ? '' : String(value);
  });
}

function fail(message) {
  throw new Error(message);
}

function reasonOf(error) {
  const text = error && error.message ? error.message : String(error);
  return text.replace(/^@+/, '');
}
