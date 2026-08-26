//block
//noreplace
/*
 * @name cmdClearPolicyLoadings
 * @author Codex
 * @version 1.0
 * @purpose Reset renewal coverage/policy premium values and remove loadings.
 * @context.policyId Identifier of the newly generated policy.
 *
 * JIRA GLOB-1172:
 * Loadings and discounts belong to the previous policy period and must not be
 * inherited by the next renewal period.
 */

try {
  const policyId = getPositiveInteger(context && context.policyId);
  if (policyId <= 0) {
    throw new Error("El identificador de la póliza es requerido y debe ser válido.");
  }

  doCmd({
    cmd: "DoQuery",
    data: {
      sql: "UPDATE [LifeCoverage] SET " +
        "[limit] = 0, " +
        "[deductible] = 0, " +
        "[basePremium] = 0, " +
        "[loading] = 0, " +
        "[startBasePremium] = 0, " +
        "[extraPremium] = 0, " +
        "[internalPremium] = 0, " +
        "[baseLimit] = 0, " +
        "[manualPremium] = 0, " +
        "[manualLimit] = 0 " +
        "WHERE [lifePolicyId] = " + policyId + "; " +
        "UPDATE [LifePolicy] SET " +
        "[anualPremium] = 0, " +
        "[anualTotal] = 0, " +
        "[coverages] = 0, " +
        "[discounts] = 0, " +
        "[fee] = 0, " +
        "[installment] = 0, " +
        "[surcharges] = 0, " +
        "[plannedPremium] = 0, " +
        "[grossValue] = 0 " +
        "WHERE [id] = " + policyId + "; " +
        "DELETE l FROM [LifeCoverageLoading] l " +
        "INNER JOIN [LifeCoverage] c ON c.[id] = l.[lifeCoverageId] " +
        "WHERE c.[lifePolicyId] = " + policyId + ";"
    }
  });

  if (typeof DoQuery === "undefined" || !DoQuery || !DoQuery.ok) {
    throw new Error(
      DoQuery && DoQuery.msg
        ? DoQuery.msg
        : "No fue posible limpiar los recargos y descuentos de la póliza."
    );
  }

  return {
    ok: true,
    msg: "Recargos y descuentos limpiados correctamente."
  };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError("@" + message);
}

function getPositiveInteger(value) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 0;
}

/*
  @test
  { policyId: 3934 }
*/
