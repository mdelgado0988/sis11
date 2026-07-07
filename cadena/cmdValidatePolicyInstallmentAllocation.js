//block
//noreplace

/*
 * @author Michael Delgado
 * @created 2026/07/06
 * @name cmdValidatePolicyInstallmentAllocation
 * @version 1.0
 * @Purpose Validate a policy installment allocation and update PayPlan paid date with UTC time.
 */

const policyId = Number(context?.policyId ?? 0);
const payPlanId = Number(context?.payPlanId ?? 0);

try {
  if (!isValidNumber(policyId)) {
    return { ok: false, msg: "El policyId es requerido y debe ser válido" };
  }

  if (!isValidNumber(payPlanId)) {
    return { ok: false, msg: "El payPlanId es requerido y debe ser válido" };
  }

  const payPlan = loadOneEntity(
    "PayPlan",
    "id, lifePolicyId, payedDate",
    `id = ${payPlanId} AND lifePolicyId = ${policyId}`
  );

  if (!payPlan) {
    return { ok: false, msg: "No se encontró el plan de pago para la póliza indicada" };
  }

  const utcDateTime = new Date().toISOString();

  doCmd({
    cmd: "SetField",
    data: {
      entity: "PayPlan",
      entityId: payPlanId,
      fieldValue: `payedDate = '${escapeSqlString(utcDateTime)}'`,
      raw: true
    }
  });

  if (!SetField?.ok) {
    return { ok: false, msg: SetField?.msg || "No fue posible actualizar la fecha de pago" };
  }

  return {
    ok: true,
    msg: "Fecha de pago actualizada correctamente"
  };
} catch (error) {
  return { ok: false, msg: error?.toString?.() || String(error) };
}

function loadOneEntity(entity, fields, filter) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity,
      fields,
      filter,
      noTracking: true
    }
  });

  if (!LoadEntity?.ok) {
    throw new Error(LoadEntity?.msg || `No fue posible cargar ${entity}`);
  }

  return LoadEntity.outData ?? null;
}

function isValidNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function escapeSqlString(value) {
  return String(value ?? "").replace(/'/g, "''");
}
