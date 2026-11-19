//block
//noreplace
/*
  *@name: cmdConfiguracionContratoReaseguro
  *@Purpose: Devuelve la configuracion de una generacion (vigencia) de contrato de reaseguro desde cfgLimiteContratoReaseguro
  *@Created: 2026-11-19 (MSN-000217)
  *@Input: { IdContrato, CodigoContrato?, productCode?, Moneda? }
  *@Note: la fila se busca SIEMPRE por IdContrato. Con productCode / Moneda se prefiere la fila de ese producto / moneda y
  *       si no existe la de '*'. Los porcentajes de la tabla van en puntos (35 = 35 %) y salen como fraccion (0.35).
  *       Retencion + CP + FAC deben sumar 100: si no, error (los contratos calculan una parte como resto de la otra).
  *       Sin IdContrato (simulador de distribucion, que no pasa el contrato) se resuelve con CodigoContrato como
  *       cmdCoverageAccumulationSum: el primer contrato con ese codigo.
  *@Output: { IdContrato, CodigoContrato, productCode, moneda, limite, tasaRiesgo, pret, pcp, pfac, pcomi, ptax }
*/
const TABLA = "cfgLimiteContratoReaseguro";
const producto = String(context.productCode ?? "").trim().toUpperCase();
const moneda = String(context.Moneda ?? context.currency ?? "").trim().toUpperCase();
const IdContrato = resolverIdContrato(context.IdContrato ?? context.idContrato ?? context.contractId, context.CodigoContrato);

doCmd({ cmd: "GetFullTable", data: { table: TABLA } });
if (!GetFullTable?.ok) throw "@cmdConfiguracionContratoReaseguro: no se pudo leer " + TABLA + ": " + (GetFullTable?.msg ?? "");
const filas = GetFullTable.outData ?? [];
const cab = (filas[0] ?? []).map(h => String(h ?? "").trim().toUpperCase());
const col = n => cab.indexOf(n.toUpperCase());
const iId = col("IdContrato");
if (iId < 0) throw "@" + TABLA + " debe incluir la columna IdContrato";
const val = (r, n) => { const i = col(n); return i < 0 ? "" : String(r[i] ?? "").trim(); };
const comodin = v => v === "" || v === "*";

let candidatas = filas.slice(1).filter(r => num(r[iId]) === IdContrato);
if (!candidatas.length)
  throw "@No hay configuracion en " + TABLA + " para IdContrato " + IdContrato + ". Copie la fila de la vigencia anterior con este IdContrato.";
candidatas = elegir(candidatas, "productCode", producto);
candidatas = elegir(candidatas, "Moneda", moneda);
if (!candidatas.length)
  throw "@No hay configuracion en " + TABLA + " para IdContrato " + IdContrato + (producto ? ", producto " + producto : "") + (moneda ? ", moneda " + moneda : "") + ".";
const fila = candidatas[0];

const pret = pct(val(fila, "PorcentajeRet"));
const pcp = pct(val(fila, "PorcentajeCP"));
const pfac = pct(val(fila, "PorcentajeFAC"));
if (Math.abs(pret + pcp + pfac - 1) > 0.000001)
  throw "@" + TABLA + ", IdContrato " + IdContrato + ": PorcentajeRet + PorcentajeCP + PorcentajeFAC deben sumar 100";

return {
  IdContrato,
  CodigoContrato: val(fila, "CodigoContrato"),
  productCode: val(fila, "productCode"),
  moneda: val(fila, "Moneda"),
  limite: val(fila, "Limite") === "" ? null : num(val(fila, "Limite")),
  tasaRiesgo: val(fila, "TasaRiesgo") === "" ? null : num(val(fila, "TasaRiesgo")),
  pret, pcp, pfac,
  pcomi: pct(val(fila, "PorcentajeComision")),
  ptax: pct(val(fila, "PorcentajeImpuesto"))
};

//prefiere la fila con el valor exacto; si no hay, la de comodin ('*' o vacio). Sin valor pedido no filtra.
function elegir(lista, columna, valor) {
  if (col(columna) < 0 || !valor) return lista;
  const exactas = lista.filter(r => val(r, columna).toUpperCase() === valor);
  return exactas.length ? exactas : lista.filter(r => comodin(val(r, columna)));
}

function pct(v) {
  if (v === "") return 0;
  const n = num(v);
  if (Number.isNaN(n)) throw "@" + TABLA + ", IdContrato " + IdContrato + ": porcentaje no numerico '" + v + "'";
  return Number((n / 100).toFixed(6));
}

function num(v) {
  if (typeof v === "number") return v;
  return Number(String(v ?? "").replace(/,/g, "").trim());
}

function resolverIdContrato(id, codigo) {
  const n = num(id);
  if (n > 0) return n;
  const cod = String(codigo ?? "").trim();
  if (!cod) throw "@cmdConfiguracionContratoReaseguro: falta IdContrato";
  doCmd({ cmd: "GetContracts", data: { filter: "[code]='" + cod.replace(/'/g, "''") + "'", size: 1 } });
  const c = GetContracts?.outData?.[0];
  if (!c?.id) throw "@cmdConfiguracionContratoReaseguro: no existe el contrato " + cod;
  return num(c.id);
}
