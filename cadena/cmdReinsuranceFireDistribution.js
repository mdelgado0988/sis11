//block
/*
 * @author Michael Delgado
 * @email michael.delgado@axxis.com
 * @created 2026/07/07
 * @name cmdReinsuranceFireDistribution
 * @version 1.0
 * @Purpose Reinsurance fire distribution command.
 * @Input { _pol, cov, context }
 * @Output { ok, msg, outData }
 */
//doCmd({cmd: "GetPing", data: {contexto: JSON.stringify(context)}});

const n2 = value => Number(Number(value || 0).toFixed(2));
const pol = context?.pol ?? null;
const cov = context?.cov ?? null;
const cfgCoberturaReaseguro = [
  { lob: 1, name: "cfgCoberturaProductoRea" }
];

if (!pol || !cov) {
  throw new Error("El contexto debe incluir pol y cov");
}

const coverageConfig = loadCoverageConfig(pol);
const sumaCoberturasRiesgoReaseguro = sumReinsuranceRiskCoverages(pol?.Coverages, coverageConfig);
// Suma de las coberturas que conforman el riesgo de reaseguro.

const contextoCumulo = JSON.stringify({ policyId: pol.id });

doCmd({
  cmd: "ExeChain",
  data: {
    chain: "cmdCalculateFireLocationAccumulation",
    context: contextoCumulo
  }
});

if (!ExeChain?.ok) {
  throw new Error(ExeChain?.msg || "No fue posible ejecutar cmdCalCumuloEdificios");
}

const resultado = ExeChain?.outData ?? {};

resultado.coverageCode = cov.code;
resultado.sumaCoberturasRiesgoReaseguro = sumaCoberturasRiesgoReaseguro;
resultado.primaNoTecnica = Math.round((cov.premium * 0.1) * 100) / 100;
resultado.primaTecnica = n2(cov.premium - resultado.primaNoTecnica);
const resto = resultado.resto;
resultado.suma = cov.limit;
resultado.prima = cov.premium;
resultado.sumaDistribuye = Math.min(resultado.sumaCoberturasRiesgoReaseguro, resto);

//Calculo si existe algo facultativo que distribuir (Suma total de coberturas - resto según cúmulo)
resultado.sumaFacultativaExceso = n2(resultado.sumaCoberturasRiesgoReaseguro - resultado.sumaDistribuye);
resultado.proporcionFac = safeDivide(resultado.sumaFacultativaExceso, resultado.sumaCoberturasRiesgoReaseguro);
resultado.proporcionContrato = 1.00 - resultado.proporcionFac;

//resultado.proporcionDistribuye = (resultado.sumaDistribuye / resultado.suma);
resultado.primaContrato = n2(resultado.proporcionContrato * resultado.primaTecnica);
resultado.sumaContrato = n2(resultado.suma * resultado.proporcionContrato);
resultado.re = n2(resultado.sumaContrato * 0.65);
resultado.ced = n2(resultado.sumaContrato - resultado.re);

//calculos finales
resultado.cedantPremium = n2(resultado.primaContrato * 0.35);
resultado.reinsurerPremium = n2(resultado.primaContrato - (resultado.cedantPremium));
resultado.primaFac = n2(resultado.primaTecnica - (resultado.cedantPremium + resultado.reinsurerPremium));
resultado.sumaFac = n2(resultado.suma - (resultado.re + resultado.ced));

validatePremiumTotals(resultado);

//doCmd({cmd: "GetPing", data: {resultado: resultado}});

return resultado;

function loadCoverageConfig(policy) {
  const tableName = cfgCoberturaReaseguro.find(x => normalizeCondition(x.lob) === normalizeCondition(policy?.lob))?.name
    ?? "cfgCoberturaProductoRea";

  doCmd({ cmd: "GetFullTable", data: { table: tableName } });

  if (!GetFullTable?.ok) {
    throw new Error(GetFullTable?.msg || `No fue posible cargar ${tableName}`);
  }

  const config = mapearTablaConfig(GetFullTable.outData ?? []);
  return config.filter(item =>
    normalizeCondition(item.productCode) === normalizeCondition(policy?.productCode)
  );
}

function sumReinsuranceRiskCoverages(coverages, config) {
  const coverageList = Array.isArray(coverages) ? coverages : [];
  const coverageConfig = Array.isArray(config) ? config : [];
  const calculatedCodes = new Set();

  return n2(
    coverageList.reduce((sum, coverage) => {
      const coverageCode = normalizeCondition(coverage?.code ?? coverage?.coverageCode ?? coverage?.id);
      if (!coverageCode || calculatedCodes.has(coverageCode)) {
        return sum;
      }

      const configItem = coverageConfig.find(item =>
        normalizeCondition(item.coverageCode) === coverageCode
      );

      if (!configItem || normalizeCondition(configItem.isCoverage) !== "SI") {
        return sum;
      }

      calculatedCodes.add(coverageCode);
      return sum + Number(coverage?.limit ?? 0);
    }, 0)
  );
}

function mapearTablaConfig(data) {
  if (!Array.isArray(data) || !data.length) {
    return [];
  }

  const headersOriginal = data[0];
  const headers = [];
  const contador = {};

  headersOriginal.forEach(h => {
    const key = String(h ?? "").trim();

    if (contador[key]) {
      contador[key]++;
      headers.push(`${key}_${contador[key]}`);
    } else {
      contador[key] = 1;
      headers.push(key);
    }
  });

  return data.slice(1).map(row => {
    const obj = {};

    headers.forEach((col, i) => {
      obj[col] = row[i];
    });

    return obj;
  });
}

function normalizeCondition(value) {
  return String(value ?? "").trim().toUpperCase();
}

function safeDivide(numerator, denominator) {
  const den = Number(denominator ?? 0);
  if (!Number.isFinite(den) || den === 0) {
    return 0;
  }

  return Number(numerator ?? 0) / den;
}

function validatePremiumTotals(resultado) {
  const totalAllocated = n2(
    Number(resultado?.primaFac ?? 0)
    + Number(resultado?.cedantPremium ?? 0)
    + Number(resultado?.reinsurerPremium ?? 0)
  );
  const basePremium = n2(resultado?.primaTecnica ?? 0);

  if (totalAllocated > basePremium) {
    throw new Error("La suma de primaFac, cedantPremium y reinsurerPremium no puede exceder la prima tecnica");
  }
}

/*
test:
pol:
  id: 3437
  currency: USD
  start: "2026-07-01"
  lob: 1
  productCode: "MULTI"
  Coverages:
  - code: 1
    limit: 5000000
    premium: 3250.00
  - code: 3
    limit: 5000000
    premium: 2250.00
  - code: 252
    limit: 20000
    premium: 0
cov:
  code: 1
  limit: 5000000
  premium: 3250.00
*/
