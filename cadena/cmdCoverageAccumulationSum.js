//block
//noreplace
/*
 * @name cmdCoverageAccumulationSum
 * @Purpose Suma de la póliza según cfgCoberturaProductoReaTecnicos, capacidad del contrato (cfgLimiteContratoColectivo)
 *          y excedente FAC proporcional por cobertura, cuadrado al centavo con el total de la póliza.
 * @Input { pol, cov, contrato? (CPCAR), pret? (% de retención del contrato) }
 * @Output { sumaPoliza, limite, sumaDistribuye, excedente, suma, prima, sumaContrato, sumaFac, primaContrato, primaFac,
 *           ced, re, cedantPremium, reinsurerPremium }
 */
const TABLA_COBERTURAS = "cfgCoberturaProductoReaTecnicos";
const TABLA_LIMITES = "cfgLimiteContratoColectivo";

const pol = context.pol;
const cov = context.cov;
const contrato = String(context.contrato || "CPCAR").trim().toUpperCase();
const pret = num(context.pret);
if (!pol || !cov) throw new Error("cmdCoverageAccumulationSum: el contexto debe incluir pol y cov");

const suman = coberturasQueSuman();
const limite = leerLimite();
const coberturas = (Array.isArray(pol.Coverages) ? pol.Coverages : []).filter(c => suman.has(norm(c.code)));

const sumaPoliza = n2(coberturas.reduce((s, c) => s + num(c.limit), 0));
const sumaDistribuye = Math.min(sumaPoliza, limite);
const excedente = n2(sumaPoliza - sumaDistribuye);
const factorFac = sumaPoliza > 0 ? excedente / sumaPoliza : 0;

// Cada total de póliza se reparte por cobertura; el residuo de redondeo va a la cobertura de mayor suma.
const primaPoliza = n2(coberturas.reduce((s, c) => s + prima(c), 0));
const fac = repartir(coberturas.map(c => num(c.limit)), excedente);
const facPrima = repartir(coberturas.map(prima), n2(primaPoliza * factorFac));
const contratoSuma = coberturas.map((c, k) => n2(num(c.limit) - fac[k]));
const contratoPrima = coberturas.map((c, k) => n2(prima(c) - facPrima[k]));
const ret = repartir(contratoSuma, n2(sumaDistribuye * pret));
const retPrima = repartir(contratoPrima, n2((primaPoliza - n2(primaPoliza * factorFac)) * pret));

const i = indice(coberturas, cov);
const suma = num(cov.limit);
const primaCov = prima(cov);
const sumaFac = i >= 0 ? fac[i] : n2(suma * factorFac);
const primaFac = i >= 0 ? facPrima[i] : n2(primaCov * factorFac);
const sumaContrato = n2(suma - sumaFac);
const primaContrato = n2(primaCov - primaFac);
const ced = i >= 0 ? ret[i] : n2(sumaContrato * pret);
const cedantPremium = i >= 0 ? retPrima[i] : n2(primaContrato * pret);

return {
  contrato, sumaPoliza, limite, sumaDistribuye, excedente,
  suma, prima: primaCov, sumaContrato, sumaFac, primaContrato, primaFac,
  ced, re: n2(sumaContrato - ced), cedantPremium, reinsurerPremium: n2(primaContrato - cedantPremium)
};

function coberturasQueSuman() {
  doCmd({ cmd: "GetFullTable", data: { table: TABLA_COBERTURAS, filter: "1=1" } });
  const rows = GetFullTable?.outData;
  if (!GetFullTable?.ok || !Array.isArray(rows) || rows.length < 2) throw new Error(`No fue posible leer ${TABLA_COBERTURAS}`);
  const set = new Set();
  rows.slice(1).forEach(r => {
    if (norm(r[1]) === norm(pol.productCode) && norm(r[5]) === "SI") set.add(norm(r[3]));
  });
  return set;
}

function leerLimite() {
  doCmd({ cmd: "GetFullTable", data: { table: TABLA_LIMITES, filter: "1=1" } });
  const rows = GetFullTable?.outData;
  if (!GetFullTable?.ok || !Array.isArray(rows) || rows.length < 2) throw new Error(`No fue posible leer ${TABLA_LIMITES}`);
  const head = rows[0].map(h => norm(h));
  const iCod = head.indexOf("CODIGOCONTRATO"), iLim = head.indexOf("LIMITE");
  const fila = rows.slice(1).find(r => norm(r[iCod]) === contrato);
  const valor = fila ? num(fila[iLim]) : 0;
  if (!(valor > 0)) throw new Error(`No hay límite de capacidad para el contrato ${contrato} en ${TABLA_LIMITES}`);
  return valor;
}

function repartir(pesos, total) {
  const base = pesos.reduce((s, v) => s + v, 0);
  const partes = pesos.map(v => (base ? n2(v * total / base) : 0));
  if (partes.length && base) {
    let mayor = 0;
    pesos.forEach((v, k) => { if (v > pesos[mayor]) mayor = k; });
    partes[mayor] = n2(partes[mayor] + total - partes.reduce((s, v) => s + v, 0));
  }
  return partes;
}

function indice(lista, c) {
  let k = c.id ? lista.findIndex(x => x.id === c.id) : -1;
  if (k < 0) k = lista.findIndex(x => norm(x.code) === norm(c.code));
  return k;
}

function prima(c) { return num(c.premium ?? c.basePremium); }
function num(v) { return Number(String(v ?? 0).replace(/,/g, "").trim()) || 0; }
function norm(v) { return String(v ?? "").trim().toUpperCase(); }
function n2(v) { return Math.round((Number(v) || 0) * 100 + (v >= 0 ? 1e-9 : -1e-9)) / 100; }
