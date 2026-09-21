//block
//noreplace

/**
 * @name cmdGetCashierBalanceSummary
 * @author Michael Delgado
 * @created 2026/09/21
 * @version 1.0
 * @purpose Return the cashier income summary with a consistent deposit sign
 * and normalized available balance.
 * @context: { workspaceId: number }
 */

try {
  const input = context && typeof context === 'object' ? context : {};
  const workspaceId = toPositiveInteger(input.workspaceId);

  if (workspaceId <= 0) {
    throw new Error('workspaceId es requerido y debe ser válido.');
  }

  doCmd({
    cmd: 'GetCashierIncomeSummary',
    data: { workspaceId: workspaceId }
  });

  if (typeof GetCashierIncomeSummary === 'undefined'
    || !GetCashierIncomeSummary
    || GetCashierIncomeSummary.ok === false) {
    throw new Error(
      GetCashierIncomeSummary && GetCashierIncomeSummary.msg
        ? GetCashierIncomeSummary.msg
        : 'No fue posible recuperar el resumen de caja.'
    );
  }

  const source = GetCashierIncomeSummary.outData && !Array.isArray(GetCashierIncomeSummary.outData)
    ? GetCashierIncomeSummary.outData
    : {};
  const summary = Array.isArray(source.summary) ? source.summary : [];
  const normalized = summary.map((row, index) => normalizeRow(row, index));

  return {
    ok: true,
    msg: 'Resumen de caja normalizado correctamente.',
    workspaceId: workspaceId,
    summary: normalized
  };
} catch (error) {
  throw new TypeError(`@${error && error.message ? error.message : String(error)}`);
}

function normalizeRow(row, index) {
  const source = row && typeof row === 'object' ? row : {};
  const amount = toNumber(source.amount);
  const deposit = Math.abs(toNumber(source.deposit));
  const cashFund = toNumber(source.cashFund);
  const availableBalance = Math.max(0, Math.abs(amount) - deposit + cashFund);

  return {
    ...source,
    code: text(source.code) || `balance-${index}`,
    amount: amount,
    deposit: deposit === 0 ? 0 : -deposit,
    cashFund: cashFund,
    dif: availableBalance,
    difference: availableBalance,
    availableBalance: availableBalance
  };
}

function text(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}
