//block
//noreplace

/**
 * @author AIDEN (MSN-000180)
 * @email support@axxis-systems.com
 * @created 2026/11/10
 * @name cmdNegativeInstallmentLastNumber
 * @version 1.0
 * @purpose: The negative installment (credit balance) that a cancellation or an endorsement creates takes the number
 *   of the policy's last installment + 1. A credit installment numbered 0 sits below every premium installment, so
 *   reversing a payment that applied it fails with "The reversion must start with the last installment paid" as soon
 *   as a premium installment of the same year is paid.
 *   Renumbers the change's negative installments that are not cancelled and still have number 0 (the number the core
 *   gives to the rows it creates for a change). Number = highest number among the policy's other installments of the
 *   same contract year (cancelled ones included), or of the whole policy when that year has no other installment,
 *   plus 1. Detail lines labelled "Detalle de cuota #0" take the new number.
 *   Called by cmdCancellationNegativeInstallment (cancellations). cmdValidateEndorsmentExecutionInstallment applies
 *   the same rule inside the payment plan it rebuilds (loadings/discounts and sum insured changes). Running it again
 *   changes nothing: a renumbered installment no longer has number 0.
 * @context: { changeId: number }
 */

try {
  const changeId = toPositiveInteger(context && context.changeId);
  if (changeId <= 0) {
    return { ok: true, skipped: true, msg: 'Sin endoso que revisar.' };
  }

  const change = query(`SELECT c.[id], c.[lifePolicyId]
FROM [Change] c
WHERE c.[id] = ${changeId};`)[0];
  if (!change) {
    throw new Error(`El endoso ${changeId} no existe.`);
  }
  const policyId = toPositiveInteger(change.lifePolicyId);

  const rows = query(`SELECT pp.[id], pp.[contractYear]
FROM [PayPlan] pp
WHERE pp.[lifePolicyId] = ${policyId}
  AND pp.[changeId] = ${changeId}
  AND pp.[minimum] < 0
  AND pp.[cancellationDate] IS NULL
  AND pp.[numberInYear] = 0
ORDER BY pp.[id];`);
  if (rows.length === 0) {
    return {
      ok: true,
      skipped: true,
      msg: `El endoso ${changeId} no tiene cuota negativa con número 0.`,
      changeId,
      lifePolicyId: policyId,
      installments: []
    };
  }

  const ids = rows.map(row => toPositiveInteger(row.id));
  let lastAssigned = 0;
  const installments = rows.map(row => {
    const payPlanId = toPositiveInteger(row.id);
    const contractYear = toInteger(row.contractYear);
    const last = query(`SELECT ISNULL(MAX(CASE WHEN o.[contractYear] = ${contractYear} THEN o.[numberInYear] END), ISNULL(MAX(o.[numberInYear]), 0)) AS [last]
FROM [PayPlan] o
WHERE o.[lifePolicyId] = ${policyId}
  AND o.[id] NOT IN (${ids.join(', ')});`)[0];
    const numberInYear = Math.max(toInteger(last && last.last), lastAssigned) + 1;
    setField('PayPlan', payPlanId, `numberInYear = ${numberInYear}`);
    lastAssigned = numberInYear;

    const details = query(`SELECT d.[id]
FROM [PayPlanDetail] d
WHERE d.[payPlanId] = ${payPlanId}
  AND d.[concept] = 'Detalle de cuota #0';`);
    details.forEach(detail => setField('PayPlanDetail', toPositiveInteger(detail.id), `concept = 'Detalle de cuota #${numberInYear}'`));
    return { payPlanId, contractYear, numberInYear, details: details.length };
  });

  return {
    ok: true,
    msg: `Cuota negativa del endoso ${changeId} numerada como la última + 1: ${installments.map(item => `cuota ${item.payPlanId} con número ${item.numberInYear}`).join(', ')}.`,
    changeId,
    lifePolicyId: policyId,
    installments
  };
} catch (error) {
  return { ok: false, msg: error && error.message ? error.message : String(error) };
}

function setField(entity, entityId, fieldValue) {
  doCmd({ cmd: 'SetField', data: { entity, entityId, fieldValue } });
  const response = typeof SetField === 'undefined' ? null : SetField;
  if (!response || response.ok === false) {
    throw new Error(`No se pudo actualizar ${entity} ${entityId}: ${response && response.msg ? response.msg : 'sin respuesta'}.`);
  }
}

function query(sql) {
  doCmd({ cmd: 'DoQuery', data: { sql } });
  const response = typeof DoQuery === 'undefined' ? null : DoQuery;
  if (!response || response.ok === false) {
    throw new Error(response && response.msg ? response.msg : 'No fue posible leer el plan de pagos.');
  }
  const rows = response.outData;
  return Array.isArray(rows) ? rows : [];
}

function toInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}
