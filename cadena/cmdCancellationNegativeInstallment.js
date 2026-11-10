//block
//noreplace

/**
 * @author AIDEN (MSN-000175)
 * @email support@axxis-systems.com
 * @created 2026/11/10
 * @name cmdCancellationNegativeInstallment
 * @version 1.0
 * @purpose: A cancellation that returns premium leaves the refund as a pending negative installment ("Cancellation")
 *   in the payment calendar, to be applied in the cashier, instead of an available balance in the policy's transit
 *   account. Runs after ExeChangeCancellation (post trigger).
 *   1. The core credits the refund to the policy's TRANSIT account (Transfer producer CANCELLATION, code TRANSIT) and
 *      marks the negative installment as paid. This chain posts the mirror movement (same accounts, negative amount),
 *      records in the transit account that it takes that credit line (cmdTransitLines, stamp TRANSFER), so the line
 *      is left with 0 available, and puts the installment back to pending (payed 0, no payed date).
 *   2. A negative installment of an earlier endorsement already applied in part is not cancelled by the core, while
 *      the refund already counts what was applied: its billed amount (minimum) is reduced to the applied amount, so
 *      the rest is not returned twice.
 *   Running it again changes nothing: the mirror movement is found by its concept and the installment is pending.
 * @context: { changeId: number }
 */

const MONEY_EPSILON = 0.005;

try {
  const changeId = toPositiveInteger(context && context.changeId);
  if (changeId <= 0) {
    return { ok: true, skipped: true, msg: 'Sin endoso que revisar.' };
  }

  const change = query(`SELECT c.[id], c.[lifePolicyId], c.[status], c.[Discriminator]
FROM [Change] c
WHERE c.[id] = ${changeId};`)[0];
  if (!change) {
    throw new Error(`El endoso ${changeId} no existe.`);
  }
  if (String(change.Discriminator || '') !== 'CancellationChange') {
    return { ok: true, skipped: true, msg: `El endoso ${changeId} no es una anulación.` };
  }
  if (Number(change.status) !== 1) {
    return { ok: true, skipped: true, msg: `El endoso ${changeId} no está ejecutado; no hay devolución que dejar pendiente.` };
  }

  const policyId = toPositiveInteger(change.lifePolicyId);
  const refundRows = query(`SELECT pp.[id], pp.[minimum], pp.[payed], pp.[allocationId]
FROM [PayPlan] pp
WHERE pp.[lifePolicyId] = ${policyId}
  AND pp.[changeId] = ${changeId}
  AND pp.[concept] = 'Cancellation'
  AND pp.[cancellationDate] IS NULL
  AND pp.[minimum] < 0
ORDER BY pp.[id];`);

  const installments = refundRows.map(row => keepRefundPending(changeId, policyId, row));
  const closedInstallments = closePartlyAppliedNegatives(changeId, policyId);
  const errors = installments.filter(item => item.error).map(item => item.error);

  return {
    ok: errors.length === 0,
    msg: errors.length > 0
      ? errors.join(' ')
      : (installments.length > 0
        ? `Devolución pendiente en la cuota negativa del endoso ${changeId}.`
        : `El endoso ${changeId} no genera devolución.`),
    changeId,
    lifePolicyId: policyId,
    installments,
    closedInstallments
  };
} catch (error) {
  return { ok: false, msg: error && error.message ? error.message : String(error) };
}

function keepRefundPending(changeId, policyId, row) {
  const payPlanId = toPositiveInteger(row.id);
  const amount = roundMoney(-toNumber(row.minimum));
  const result = { payPlanId, amount };

  const credit = query(`SELECT TOP 1 t.[id], t.[sourceAccountId], t.[destinationAccountId]
FROM [Transfer] t
INNER JOIN [Account] a ON a.[id] = t.[destinationAccountId]
WHERE t.[lifePolicyId] = ${policyId}
  AND t.[producer] = 'CANCELLATION'
  AND t.[transactionCode] = 'TRANSIT'
  AND a.[type] = 'TRANSIT'
  AND ISNULL(t.[status], 0) <> 2
  AND t.[amount] > 0
  AND ABS(t.[amount] - ${amount}) < ${MONEY_EPSILON}
  AND NOT EXISTS (
    SELECT 1 FROM [Transfer] m
    WHERE m.[lifePolicyId] = t.[lifePolicyId]
      AND m.[producer] = 'CANCELLATION'
      AND m.[amount] < 0
      AND m.[concept] LIKE CONCAT('%(transferencia ', t.[id], ')%')
  )
ORDER BY t.[id] DESC;`)[0];

  if (credit) {
    const creditId = toPositiveInteger(credit.id);
    const transitAccountId = toPositiveInteger(credit.destinationAccountId);
    const concept = `Anulación ${changeId} (transferencia ${creditId}): la devolución queda como cuota negativa pendiente`;
    doCmd({
      cmd: 'DoRawTransfer',
      data: {
        save: true,
        transferInfo: {
          sourceAccountId: toPositiveInteger(credit.sourceAccountId),
          destAccountId: transitAccountId,
          amount: -amount,
          af_amount: 0,
          code: 'TRANSIT',
          concept,
          producer: 'CANCELLATION',
          lifePolicyId: policyId
        }
      }
    });
    const raw = typeof DoRawTransfer === 'undefined' ? null : DoRawTransfer;
    const mirror = raw && raw.outData ? (raw.outData.Transfer || raw.outData.transfer) : null;
    const mirrorId = toPositiveInteger(mirror && mirror.id);
    if (!raw || raw.ok === false || mirrorId <= 0) {
      result.error = `No se pudo compensar el abono a tránsito ${creditId}: ${raw && raw.msg ? raw.msg : 'sin respuesta'}.`;
      return result;
    }
    result.transitCreditTransferId = creditId;
    result.mirrorTransferId = mirrorId;
    result.transitAccountId = transitAccountId;

    const line = query(`SELECT TOP 1 m.[id]
FROM [AccountMov] m
WHERE m.[transferId] = ${creditId}
  AND m.[accountId] = ${transitAccountId}
  AND m.[amount] > 0
ORDER BY m.[id];`)[0];
    if (line) {
      doCmd({
        cmd: 'ExeChain',
        data: {
          chain: 'cmdTransitLines',
          context: JSON.stringify({
            mode: 'stamp',
            accountId: transitAccountId,
            operation: 'TRANSFER',
            opTransferId: mirrorId,
            amount,
            lines: [{ movId: toPositiveInteger(line.id), amount }]
          })
        }
      });
      const stamp = typeof ExeChain === 'undefined' ? null : ExeChain;
      result.lineStamped = !!(stamp && stamp.ok !== false && stamp.outData && stamp.outData.ok !== false);
      if (!result.lineStamped) {
        result.stampMsg = stamp && stamp.msg ? stamp.msg : 'sin respuesta';
      }
    }
  } else {
    result.transitCredit = 'none';
  }

  const settled = Math.abs(toNumber(row.payed) - toNumber(row.minimum)) < MONEY_EPSILON;
  if (settled && toPositiveInteger(row.allocationId) <= 0) {
    doCmd({ cmd: 'SetField', data: { entity: 'PayPlan', fieldValue: 'payed = 0, payedDate = NULL', entityId: payPlanId } });
    const update = typeof SetField === 'undefined' ? null : SetField;
    if (!update || update.ok === false) {
      result.error = `No se pudo dejar pendiente la cuota ${payPlanId}: ${update && update.msg ? update.msg : 'sin respuesta'}.`;
      return result;
    }
    result.pending = true;
  } else {
    result.pending = Math.abs(toNumber(row.payed)) < MONEY_EPSILON;
  }
  return result;
}

function closePartlyAppliedNegatives(changeId, policyId) {
  const rows = query(`SELECT pp.[id], pp.[minimum], pp.[payed]
FROM [PayPlan] pp
WHERE pp.[lifePolicyId] = ${policyId}
  AND ISNULL(pp.[changeId], 0) <> ${changeId}
  AND pp.[cancellationDate] IS NULL
  AND pp.[minimum] < 0
  AND ISNULL(pp.[payed], 0) < 0
  AND ISNULL(pp.[payed], 0) > pp.[minimum] + ${MONEY_EPSILON}
ORDER BY pp.[id];`);

  return rows.map(row => {
    const payPlanId = toPositiveInteger(row.id);
    const applied = roundMoney(toNumber(row.payed));
    doCmd({ cmd: 'SetField', data: { entity: 'PayPlan', fieldValue: `minimum = ${applied}`, entityId: payPlanId } });
    const update = typeof SetField === 'undefined' ? null : SetField;
    return {
      payPlanId,
      minimumBefore: roundMoney(toNumber(row.minimum)),
      minimumAfter: applied,
      ok: !!update && update.ok !== false
    };
  });
}

function query(sql) {
  doCmd({ cmd: 'DoQuery', data: { sql } });
  const response = typeof DoQuery === 'undefined' ? null : DoQuery;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg ? response.msg : 'No fue posible leer los datos de la anulación.');
  }
  const rows = response.outData;
  return Array.isArray(rows) ? rows : [];
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function roundMoney(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}
