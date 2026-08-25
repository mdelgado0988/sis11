//block
//noreplace
/*
 * @name cmdClearPolicyLoadings
 * @author Codex
 * @version 1.0
 * @purpose Remove loadings and discounts from the coverages of a renewed policy.
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
      sql: "DELETE FROM LifeCoverageLoading " +
        "WHERE lifeCoverageId IN (" +
        "SELECT id FROM LifeCoverage WHERE lifePolicyId = " + policyId + "); " +
        "UPDATE LifeCoverage SET loading = 0 WHERE lifePolicyId = " + policyId + ";"
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
