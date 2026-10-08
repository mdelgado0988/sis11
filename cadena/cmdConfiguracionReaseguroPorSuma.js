//block
//noreplace
/*
  *@name: cmdConfiguracionReaseguroPorSuma
  *@Purpose: Recupera el DTO para generación de documento de fianza (general)
  *@Author: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 21/04/2026
  *@Input: {CodigoContrato, Suma, Prima, SumaCoaseguro?, PrimaCoaseguro?, PolizaId?, CoberturaId?}
  *@Note AXX-302: Suma y Prima son la base A DISTRIBUIR, ya neta de coaseguro.
  *        SumaCoaseguro/PrimaCoaseguro son los importes de coaseguro informados (fuente nativa CoCession),
  *        para trazabilidad y validacion. Ausentes o cero => comportamiento identico al anterior.
  *@Note MSN-000038: entradas opcionales ProductoCodigo y Coberturas [{codigo, suma}] (sumas netas de coaseguro de
  *        todas las coberturas de la poliza). La suma evaluada contra la capacidad es la sumatoria de las coberturas
  *        con isCoverage = Si en cfgCoberturaProductoReaFianza para ese producto. Si la suma evaluada (o la propia
  *        cobertura) supera la ultima Capacidad del contrato, cada cobertura deja en el contrato la fraccion
  *        Capacidad / suma evaluada, repartida RET / CP con la ultima banda, y el excedente va a FAC (suma y prima),
  *        con la misma proporcion en todas las coberturas. Sin Coberturas => igual que antes, salvo que una suma sobre
  *        la capacidad ya no va 100% a FAC sino que se topa en la capacidad.
  *@Output: { pret, pcp, msret, mscp, mpret, mpcp, mccp, micp, pfp, msfp, mpfp, mcfp, mifp, SumaEvaluada, Capacidad, factorContrato }
*/

const CodigoContrato = context.CodigoContrato
const Suma = toNumber(context.Suma || 0);
const Prima = toNumber(context.Prima || 0);
//AXX-302: rubros de coaseguro. Ausentes => 0 => se comporta exactamente como antes.
const SumaCoaseguro = toNumber(context.SumaCoaseguro || 0);
const PrimaCoaseguro = toNumber(context.PrimaCoaseguro || 0);
const PolizaId = context.PolizaId || "n/d";
const CoberturaId = context.CoberturaId || "n/d";

//doCmd({cmd: "GetPing", data: { Suma, Prima, SumaCoaseguro, PrimaCoaseguro, PolizaId, CoberturaId }});

//AXX-302: si la base llega negativa, el coaseguro supera lo emitido. Se detiene con error trazable.
if (Suma < 0)
  throw "cmdConfiguracionReaseguroPorSuma: el coaseguro supera la SUMA emitida. Contrato " + CodigoContrato +
        ", poliza " + PolizaId + ", cobertura " + CoberturaId +
        ". Suma emitida " + n2(Suma + SumaCoaseguro) + ", coaseguro " + SumaCoaseguro + ", a distribuir " + Suma;
if (Prima < 0)
  throw "cmdConfiguracionReaseguroPorSuma: el coaseguro supera la PRIMA emitida. Contrato " + CodigoContrato +
        ", poliza " + PolizaId + ", cobertura " + CoberturaId +
        ". Prima emitida " + n2(Prima + PrimaCoaseguro) + ", coaseguro " + PrimaCoaseguro + ", a distribuir " + Prima;

let reaConfig;
setReaConfig();

//MSN-000038: capacidad = ultimo limite (Capacidad maxima) configurado para el contrato
const ultimaBanda = reaConfig.reduce((m, x) => (!m || x.Capacidad > m.Capacidad) ? x : m, null);
const Capacidad = ultimaBanda && !isNaN(ultimaBanda.Capacidad) ? ultimaBanda.Capacidad : 0;
const SumaEvaluada = getSumaEvaluada();
const SumaReferencia = Math.max(SumaEvaluada, Suma);

if (Capacidad > 0 && SumaReferencia > Capacidad) {
  //Excedente a facultativo, manteniendo la proporcion por cobertura en cada linea (RET, CP, FAC)
  const factorContrato = Capacidad / SumaReferencia;
  const SumaContrato = n2(Suma * factorContrato);
  const PrimaContrato = n2(Prima * factorContrato);
  const xpret = pct(ultimaBanda.PorcentajeRet), xpcp = pct(ultimaBanda.PorcentajeCP),
        xpccp = pct(ultimaBanda.PorcentajeComision), xpicp = pct(ultimaBanda.PorcentajeImpuesto);
  let xmsret = n2(xpret * SumaContrato),
      xmscp = n2(SumaContrato - xmsret),
      xmsfp = n2(Suma - SumaContrato),
      xmpret = n2(xpret * PrimaContrato),
      xmpcp = n2(PrimaContrato - xmpret),
      xmpfp = n2(Prima - PrimaContrato);
  let xmccp = n2(xpccp * xmpcp),
      xmicp = n2(xpicp * xmpcp);
  return { pret: xpret, pcp: xpcp, msret: xmsret, mscp: xmscp, mpret: xmpret, mpcp: xmpcp, mccp: xmccp, micp: xmicp,
          pfp: Suma ? Number((xmsfp / Suma).toFixed(6)) : 0,
          msfp: xmsfp,
          mpfp: xmpfp,
          mcfp: 0,
          mifp: 0,
          SumaEvaluada, Capacidad, factorContrato: Number(factorContrato.toFixed(6)) }
}

// El rango se determina con la suma acumulada de todas las coberturas que
// participan en el reaseguro, pero los importes se calculan para la cobertura actual.
const config = reaConfig.find(x => SumaReferencia >= x.RangoSumaInicial && SumaReferencia <= x.RangoSumaFinal);

if(!config)
  return { pret: 0, pcp: 0, msret: 0, mscp: 0, mpret: 0, mpcp: 0, mccp: 0, micp: 0, pfp: 100.00, msfp: Suma, mpfp: Prima, mcfp: 0, mifp: 0, SumaEvaluada, Capacidad, factorContrato: 0 }

//return config
//MSN-000038: porcentajes sin redondear a 2 decimales (5.5% se leia como 6% y 94.5% como 94%)
let pret = pct(config.PorcentajeRet),
      pcp = pct(config.PorcentajeCP),
      pccp = pct(config.PorcentajeComision),
      picp = pct(config.PorcentajeImpuesto);
let msret = n2(pret * Suma), 
      mscp = n2(pcp * Suma), 
      mpret = n2(pret * Prima),
      mpcp = n2(pcp * Prima);
let mccp = n2(pccp * mpcp), 
      micp = n2(picp * mpcp);

//Ajusto diferencias de centavos
mpret += n2(Prima - (mpret + mpcp));

return { pret, pcp, msret, mscp, mpret, mpcp, mccp, micp,         
        pfp: 0,
        msfp: 0,
        mpfp: 0,
        mcfp: 0,
        mifp: 0,
        SumaEvaluada, Capacidad, factorContrato: 1 }

//MSN-000038: sumatoria (neta de coaseguro) de las coberturas de la poliza con isCoverage = Si para el producto.
//Sin Coberturas o sin el producto en la tabla => la propia Suma (comportamiento por cobertura).
function getSumaEvaluada() {
  const coberturas = Array.isArray(context.Coberturas) ? context.Coberturas : [];
  const producto = String(context.ProductoCodigo || "").trim();
  if (!coberturas.length || !producto) return Suma;

  doCmd({cmd :"GetFullTable", data: {table: "cfgCoberturaProductoReaFianza"}});
  if(!GetFullTable.ok)
    throw "cmdConfiguracionReaseguroPorSuma: no se pudo leer cfgCoberturaProductoReaFianza: " + GetFullTable.msg;

  const filas = mapearTablaConfig(GetFullTable.outData ?? [])
    .filter(x => String(x.productCode || "").trim() == producto);
  if (!filas.length) return Suma;

  const suman = filas
    .filter(x => String(x.isCoverage || "").trim().toUpperCase() == "SI")
    .map(x => String(x.coverageCode || "").trim());

  return n2(coberturas
    .filter(c => suman.includes(String(c.codigo || "").trim()))
    .reduce((t, c) => t + toNumber(c.suma || 0), 0));
}

function pct(value) {
  return Number((toNumber(value) / 100).toFixed(6));
}

function setReaConfig() {

  doCmd({cmd :"GetFullTable", data: {table: "cfgContratoReaseguroPorSuma"}});

   if(!GetFullTable.ok)
      console.error("Error leyendo configuración de contrato");

  reaConfig = mapearTablaConfig(GetFullTable.outData ?? []);
  reaConfig = reaConfig.filter(x => x.CodigoContrato == CodigoContrato);

  reaConfig.forEach(x => {
    x["PorcentajeRet"] = toNumber(x["PorcentajeRet"]);
    x["PorcentajeCP"] = toNumber(x["PorcentajeCP"]);
    x["Capacidad"] = toNumber(x["Capacidad"]);
    x["PorcentajeComision"] = toNumber(x["PorcentajeComision"]);
    x["PorcentajeImpuesto"] = toNumber(x["PorcentajeImpuesto"]);
    x["RangoSumaInicial"] = toNumber(x["RangoSumaInicial"]);
    x["RangoSumaFinal"] = toNumber(x["RangoSumaFinal"]);
  });
  
}

function mapearTablaConfig(data) {

  if (!data || !data.length) return [];

  const headersOriginal = data[0];

  // Resolver nombres duplicados
  const headers = [];
  const contador = {};

  headersOriginal.forEach(h => {
    const key = h.trim();

    if (contador[key]) {
      contador[key]++;
      headers.push(`${key}_${contador[key]}`);
    } else {
      contador[key] = 1;
      headers.push(key);
    }
  });

  // Mapear filas
  const result = data.slice(1).map(row => {
    const obj = {};

    headers.forEach((col, i) => {
      obj[col] = row[i];
    });

    return obj;
  });

  return result;
}

function toNumber(value) {
  // Si ya es número, retornarlo (validando NaN)
  if (typeof value === 'number') {
    return Number.isNaN(value) ? NaN : value;
  }

  // Si no es string ni number, no es válido
  if (typeof value !== 'string') return NaN;

  // Elimina separadores de miles (comas)
  const normalized = value.replace(/,/g, '');

  // Convierte a número
  return Number(normalized);
}

function n2(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return NaN;

  return Number(value.toFixed(2)); // devuelve string
}

/*
test: 
CodigoContrato: CPF
Suma: 450000
*/
