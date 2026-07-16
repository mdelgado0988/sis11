//block
//noreplace
/**
 * @author Noel Obando
 * @name cmdCalculateISCancellation
 * @description Calculates the cancellation insurance tax by reusing cmdGetCancellationPremium.
 */

const policyId = Number(context?.policyId ?? 0);
const effectiveDate = String(context?.effectiveDate ?? "").trim();
const rate = Number(context?.rate ?? 1);

if (!Number.isFinite(policyId) || policyId <= 0) {
  throw new Error("La poliza es requerida para calcular el impuesto de cancelacion");
}

if (!effectiveDate) {
  throw new Error("La fecha efectiva es requerida para calcular el impuesto de cancelacion");
}

doCmd({
  cmd: "ExeChain",
  data: {
    chain: "cmdGetCancellationPremium",
    context: JSON.stringify({
      pol: { id: policyId },
      changeDate: effectiveDate
    })
  }
});

if (!ExeChain?.ok) {
  throw new Error(ExeChain?.msg || "No fue posible calcular el impuesto de cancelacion");
}

const result = round2(Number(ExeChain?.outData?.impuesto ?? 0));

return rate ? round2(result * rate) : result;

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}
