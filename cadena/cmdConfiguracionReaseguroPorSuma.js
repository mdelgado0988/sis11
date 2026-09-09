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
  *@Output: { pret, pcp, msret, mscp, mpret, mpcp, mccp, micp, pfp, msfp, mcfp, mifp }
*/

const CodigoContrato = context.CodigoContrato
const Suma = toNumber(context.Suma || 0);
const Prima = toNumber(context.Prima || 0);
//AXX-302: rubros de coaseguro. Ausentes => 0 => se comporta exactamente como antes.
const SumaCoaseguro = toNumber(context.SumaCoaseguro || 0);
const PrimaCoaseguro = toNumber(context.PrimaCoaseguro || 0);
const PolizaId = context.PolizaId || "n/d";
const CoberturaId = context.CoberturaId || "n/d";

doCmd({cmd: "GetPing", data: { Suma, Prima, SumaCoaseguro, PrimaCoaseguro, PolizaId, CoberturaId }});

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

const config = reaConfig.find(x => Suma >= x.RangoSumaInicial && Suma <= x.RangoSumaFinal);

if(!config)
  return { pret: 0, pcp: 0, msret: 0, mscp: 0, mccp: 0, micp: 0, pfp: 100.00, msfp: Suma, mpfp: Prima, mcfp: 0, mifp: 0 }

//return config
let pret = n2(config.PorcentajeRet / 100),
      pcp = n2(config.PorcentajeCP / 100),
      pccp = n2(config.PorcentajeComision / 100),
      picp = n2(config.PorcentajeImpuesto / 100);
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
        mifp: 0 }

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