//block
//noreplace

/*
  *@name: cmdCalCumuloEdificio
  *@Purpose: Calcula el cumulo de edificio para una poliza usando la configuracion del edificio y el cumulo personalizado.
  *@Author: Axxis Systems
  *@Created: 01/01/2026
  *@Input: { policyId, fDesde, currency, insuredSum, contractId, lob }
  *@Output: { ok, msg, outData }
*/

let inicio = Date.now();

const { policyId, fDesde, currency, insuredSum, contractId, lob} = context;


doCmd({ cmd: "RepoInsuredObject", data: { operation: "GET", filter: `lifePolicyId = ${policyId}`, include: ["ObjectDefinition"] } });
const definitions = ['DT_INCENDIO_V3','1_9_DT_INCENDIO','DTINCENDIO_SUMA'];
const edificio = RepoInsuredObject.outData.find(item => definitions.includes(item.ObjectDefinition?.code));
if (!edificio || !edificio.userData) {
  throw '@No se encontró un objeto asegurado válido para calcular el cúmulo';
}
const { cmbEdificios, cmbBarriadas } = edificio.userData;
const cumulusField = hasValue(cmbEdificios) ? 'cmbEdificios' : 'cmbBarriadas';
let configuracionCumulo;

// log(`Cargado objeto asegurado, tiempo: ${Date.now() - inicio }`);
inicio = Date.now();

if(!hasValue(cmbEdificios) && !hasValue(cmbBarriadas))
  throw '@No se seleccionÃ³ edificio ni barriada';

setConfiguracion();

// log(`Cargado tabla configuraciÃ³n, tiempo: ${Date.now() - inicio }`);

const limite = parseFloat(configuracionCumulo?.[0].capacity ?? 0);

const fechaEvaluar = new Date(fDesde);
const currentYear = fechaEvaluar.getFullYear();

inicio = Date.now();

doCmd({
  cmd: 'GetCustomCumulus',
  data: {
    rangeStart: `${currentYear}-01-01`,
    rangeEnd: `${currentYear}-12-31`,
    cumulusField,
    currency: currency,
    lob: lob
  }
});

if(!GetCustomCumulus.ok){
  throw GetCustomCumulus.msg;
}

// log(`Calculando cÃºmulo, tiempo: ${Date.now() - inicio }`);
inicio = Date.now();

//MAD: GLOB-742. Esto me lee incluso la pÃ³liza emitida, en endosos me estÃ¡ dando problemas asÃ­ que lo haremos diferente
//const record = GetCustomCumulus.outData.find(item => item.cumulusField === cmbEdificios);
//const resto = (record?.sumInsured ?? 0) < limite ? limite - (record?.sumInsured ?? 0) : 0;
const fieldValue = cumulusField === 'cmbEdificios' ? cmbEdificios : cmbBarriadas;
const listadoData = GetCustomCumulus.outData.find(item => item.cumulusField === fieldValue);
const cumuloTotal = (listadoData?.Items || [])
  .flatMap(x => x.Items || [])
  .reduce((acc, x) =>
    x.Policy?.id !== policyId
      ? acc + Number(x.Policy?.insuredSum || 0)
      : acc
  , 0);

const resto = cumuloTotal < limite ? limite - cumuloTotal : 0;
const restoSum = insuredSum < resto ? insuredSum : resto;

// log(`Fin, tiempo: ${Date.now() - inicio }`);

return {
  ok: true,
  limite: limite,
  cumulo: cumuloTotal,
  resto: resto,
  restoSum: restoSum
}

function setConfiguracion() {

  doCmd({cmd :"GetFullTable", data: {table: "tblCapacidadEdificios"}});

   if(!GetFullTable.ok)
      console.error("Error leyendo configuraciÃ³n de cÃºmulo");

  configuracionCumulo = mapearTablaConfig(GetFullTable.outData ?? []);
  configuracionCumulo = configuracionCumulo.filter(x => x.contractId == contractId && x.currency == currency);
  
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

function hasValue(value) {
  const text = String(value ?? '').trim();
  return text !== '' && text !== '0';
}
