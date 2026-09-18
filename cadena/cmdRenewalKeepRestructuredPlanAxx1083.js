//block
//noreplace

/**
 * @name cmdRenewalKeepRestructuredPlanAxx1083
 * @purpose AXX-1083 / GLOBUAT-229. Devuelve la cantidad de cuotas del plan re-estructurado
 *          vigente de la poliza que se esta renovando, para que la renovacion la conserve
 *          en lugar de regenerar el plan por defecto del producto.
 * @context.id Identificador de la poliza de renovacion (la oferta), no la poliza origen.
 * @returns {ok:true, installments:N, sourcePolicyId, periodicity} cuando hay algo que conservar.
 *          {ok:false, msg} en cualquier otro caso: la renovacion sigue con las reglas nativas.
 * @note Se invoca desde la condicion y el extraContext de la regla del InstallmentScheme 7
 *       (INC0001). NUNCA debe lanzar: una excepcion aca aborta MakePayPlan para toda poliza
 *       que use el esquema.
 */

try {
  const policyId = toInt(context && context.id);
  if (policyId <= 0) {
    return { ok: false, msg: "Se requiere el identificador de la poliza." };
  }

  const target = loadOne(
    "LifePolicy",
    "id,originalPolicyId,activeDate,periodicity,tax,anualTotal,duration,durationMonths",
    `id = ${policyId}`
  );
  if (!target) {
    return { ok: false, msg: `No se encontro la poliza ${policyId}.` };
  }

  const sourcePolicyId = toInt(target.originalPolicyId);
  if (sourcePolicyId <= 0) {
    return { ok: false, msg: "La poliza no proviene de una renovacion." };
  }

  // Una re-estructuracion propia de la oferta manda sobre la heredada.
  if (hasExecutedPayPlanChange(policyId)) {
    return { ok: false, msg: "La poliza ya tiene su propia re-estructuracion de cuotas." };
  }

  if (!hasExecutedPayPlanChange(sourcePolicyId)) {
    return { ok: false, msg: `La poliza ${sourcePolicyId} no tiene cuotas re-estructuradas.` };
  }

  const installments = countSourceInstallments(sourcePolicyId);
  if (installments < 1 || installments > 36) {
    return { ok: false, msg: `Cantidad de cuotas fuera de rango (${installments}).` };
  }

  const nativeInstallments = yearlyPayments(target.periodicity);
  if (installments === nativeInstallments) {
    return { ok: false, msg: "El plan re-estructurado coincide con el plan por defecto." };
  }

  // AXX-1081: un plan no puede generar cuotas mas alla de la vigencia. Si el plan de origen
  // ya las tiene (planes viejos, anteriores a esa validacion), no se hereda: la renovacion
  // vuelve al plan por defecto del producto en lugar de propagar un plan inconsistente.
  const termYears = policyTermYears(target);
  if (installments > nativeInstallments * termYears) {
    return {
      ok: false,
      msg: `El plan re-estructurado (${installments} cuotas) excede la vigencia de la renovacion.`
    };
  }

  return {
    ok: true,
    msg: `Se conservan ${installments} cuota(s) del plan re-estructurado de la poliza ${sourcePolicyId}.`,
    installments: installments,
    sourcePolicyId: sourcePolicyId,
    periodicity: String(target.periodicity || "m")
  };
} catch (error) {
  return {
    ok: false,
    msg: error && error.message ? error.message : String(error)
  };
}

function hasExecutedPayPlanChange(policyId) {
  return loadMany(
    "Change",
    "id,lifePolicyId,status",
    `lifePolicyId = ${policyId} AND Discriminator = 'PayPlanChange' AND status = 1`
  ).length > 0;
}

function countSourceInstallments(sourcePolicyId) {
  const rows = loadMany(
    "PayPlan",
    "id,lifePolicyId,contractYear,concept",
    `lifePolicyId = ${sourcePolicyId} AND cancellationDate IS NULL AND concept = 'Premium'`
  );
  if (!rows.length) return 0;

  let maxYear = 0;
  rows.forEach(row => {
    const year = toInt(row && row.contractYear);
    if (year > maxYear) maxYear = year;
  });

  return rows.filter(row => toInt(row && row.contractYear) === maxYear).length;
}

function policyTermYears(policy) {
  let months = toInt(policy && policy.duration) * 12 + toInt(policy && policy.durationMonths);
  if (months <= 0) months = 12;
  const years = Math.ceil(months / 12);
  return years > 0 ? years : 1;
}

function yearlyPayments(value) {
  const raw = String(value === null || value === undefined ? "" : value).trim();
  if (!raw) return 1;

  const period = raw.substring(0, 1);
  const base = { m: 12, q: 4, s: 2, y: 1, w: 52, d: 365 };
  if (raw.length === 1) {
    return Object.prototype.hasOwnProperty.call(base, period) ? base[period] : 12;
  }

  const unit = toInt(raw.substring(1));
  const perYear = { m: 12, q: 12, s: 12, y: 1, w: 52, d: 365 };
  const total = Object.prototype.hasOwnProperty.call(perYear, period) ? perYear[period] : 12;
  if (unit <= 0) return total;

  const result = Math.floor(total / unit);
  return result > 0 ? result : 1;
}

function loadOne(entity, fields, filter) {
  const rows = loadMany(entity, fields, filter);
  return rows.length > 0 ? rows[0] : null;
}

function loadMany(entity, fields, filter) {
  doCmd({
    cmd: "LoadEntities",
    data: { entity: entity, fields: fields, filter: filter, noTracking: true }
  });

  const response = typeof LoadEntities === "undefined" ? null : LoadEntities;
  if (!response || response.ok === false) {
    throw new Error(
      response && response.msg ? response.msg : `No fue posible consultar ${entity}.`
    );
  }

  return Array.isArray(response.outData) ? response.outData : [];
}

function toInt(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

/*
  @test
  { id: 3450 }
*/
