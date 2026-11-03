//block
//noreplace
/**
 * @chain    cmdListBatchClaims
 * @category VIEW
 * @version  1.0.0
 * @purpose  Reclamos creados por un lote de carga masiva, por fila del lote (vista 63 CargaMasivaDeReclamos: «Ver detalles»
 *           y «Exportar a Excel»). Lee la referencia {loteId, fila, importacionId, importacion} que los comandos de carga
 *           851, 856 y 871 guardan en el campo oculto loteCargaMasiva de «Detalle del Siniestro» (formulario 371) al crear
 *           el reclamo, también cuando la fila terminó después con error. Sólo lectura.
 * @context  { batchId }
 * @returns  { ok, msg, batchId, claims: [{ fila, claimId, code }] }  por fila y reclamo; fila null si la referencia no
 *           la trae. Un lote ejecutado antes de la referencia no devuelve reclamos.
 * @mission  MSN-000135 (globaluat) — 2026-11-03.
 */

const lbcField = "loteCargaMasiva";
const lbcSection = "Detalle del Siniestro";
const lbcArgs = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});

try {
  const batchId = Number(lbcArgs.batchId);
  if (!Number.isSafeInteger(batchId) || batchId <= 0) return { ok: false, msg: "Indique el lote." };

  const claims = lbcQuery("SELECT c.id, c.code, f.val FROM Claim c" +
    " CROSS APPLY OPENJSON(CASE WHEN ISJSON(c.jCustomForms) = 1 THEN c.jCustomForms ELSE '{}' END)" +
    " WITH (det nvarchar(max) '$.\"" + lbcSection + "\"') d" +
    " CROSS APPLY OPENJSON(CASE WHEN ISJSON(d.det) = 1 THEN d.det ELSE '[]' END)" +
    " WITH (name nvarchar(200) '$.name', val nvarchar(4000) '$.userData[0]') f" +
    " WHERE c.jCustomForms LIKE N'%" + lbcField + "%' AND f.name = N'" + lbcField + "'" +
    " AND ISJSON(f.val) = 1 AND JSON_VALUE(f.val, '$.loteId') = '" + batchId + "'")
    .map(x => {
      let ref = {};
      try { ref = JSON.parse(x.val); } catch (e) { ref = {}; }
      const fila = Number(ref.fila);
      return { fila: Number.isSafeInteger(fila) && fila > 0 ? fila : null, claimId: Number(x.id), code: x.code ? String(x.code) : "" };
    })
    .sort((a, b) => (a.fila || 0) - (b.fila || 0) || a.claimId - b.claimId);

  return { ok: true, msg: claims.length + " reclamo(s) del lote " + batchId + ".", batchId: batchId, claims: claims };
} catch (e) {
  return { ok: false, msg: "No se pudieron consultar los reclamos del lote: " + String(e && e.message || e) };
}

function lbcQuery(sql) {
  doCmd({ cmd: "DoQuery", data: { sql: sql } });
  if (!DoQuery.ok) throw new Error(DoQuery.msg || "error de consulta");
  return JSON.parse(JSON.stringify(DoQuery.outData || []));
}
