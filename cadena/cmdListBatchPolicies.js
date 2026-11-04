//block
//noreplace
/**
 * @chain    cmdListBatchPolicies
 * @category VIEW
 * @version  1.0.0
 * @purpose  Pólizas creadas por un lote de carga masiva de emisión, por fila del lote (vista 64 CargaMasivaDeEmision:
 *           «Ver detalles» y «Exportar a Excel»). Lee el objeto «Lote de carga masiva» (definición LOTE_CARGA_MASIVA,
 *           formulario LoteCargaMasiva) que las cadenas de carga 837, 838, 877 y 878 agregan a la póliza al crearla,
 *           también cuando la fila terminó después con error. Sólo lectura.
 * @context  { batchId }
 * @returns  { ok, msg, batchId, policies: [{ fila, policyId, code, active }] } por fila y póliza; fila null si el objeto
 *           no la trae. Un lote ejecutado antes del objeto no devuelve pólizas.
 * @mission  MSN-000142 (globaluat) — 2026-11-04.
 */

const lbpObjectCode = "LOTE_CARGA_MASIVA";
const lbpArgs = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});

try {
  const batchId = Number(lbpArgs.batchId);
  if (!Number.isSafeInteger(batchId) || batchId <= 0) return { ok: false, msg: "Indique el lote." };

  const policies = lbpQuery("SELECT io.lifePolicyId, lp.code, lp.active, " + lbpField("fila") + " AS fila" +
    " FROM InsuredObject io" +
    " JOIN ObjectDefinition od ON od.id = io.objectDefinitionId AND od.code = '" + lbpObjectCode + "'" +
    " JOIN LifePolicy lp ON lp.id = io.lifePolicyId" +
    " WHERE " + lbpField("loteId") + " = N'" + batchId + "'")
    .map(x => {
      const fila = Number(x.fila);
      return {
        fila: Number.isSafeInteger(fila) && fila > 0 ? fila : null,
        policyId: Number(x.lifePolicyId),
        code: x.code ? String(x.code) : "",
        active: x.active === true || x.active === 1
      };
    })
    .sort((a, b) => (a.fila || 0) - (b.fila || 0) || a.policyId - b.policyId);

  return { ok: true, msg: policies.length + " póliza(s) del lote " + batchId + ".", batchId: batchId, policies: policies };
} catch (e) {
  return { ok: false, msg: "No se pudieron consultar las pólizas del lote: " + String(e && e.message || e) };
}

function lbpField(name) {
  return "(SELECT TOP 1 f.val FROM OPENJSON(CASE WHEN ISJSON(io.jValues) = 1 THEN io.jValues ELSE '[]' END)" +
    " WITH (name nvarchar(200) '$.name', val nvarchar(4000) '$.userData[0]') f WHERE f.name = N'" + name + "')";
}

function lbpQuery(sql) {
  doCmd({ cmd: "DoQuery", data: { sql: sql } });
  if (!DoQuery.ok) throw new Error(DoQuery.msg || "error de consulta");
  return JSON.parse(JSON.stringify(DoQuery.outData || []));
}
