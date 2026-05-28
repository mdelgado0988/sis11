//block
//noreplace

const { policyId, fDesde, currency, insuredSum, contractId} = context;

doCmd({cmd: "GetPing", data: {datos: JSON.stringify({ policyId, fDesde, currency, insuredSum, contractId })}});

doCmd({ cmd: "RepoInsuredObject", data: { operation: "GET", filter: `lifePolicyId = ${policyId}`, include: ["ObjectDefinition"] } });
const definitions = ['DT_INCENDIO_V3','1_9_DT_INCENDIO','DTINCENDIO_SUMA'];
const edificio = RepoInsuredObject.outData.find(item => definitions.includes(item.ObjectDefinition.code));
const { cmbEdificios } = edificio.userData;
let configuracionCumulo;

if(isNaN(cmbEdificios))
  throw '@No se seleccionó edificio';

setConfiguracion();

const limite = parseFloat(configuracionCumulo?.[0].capacity ?? 0);

const fechaEvaluar = new Date(fDesde);
const currentYear = fechaEvaluar.getFullYear();

doCmd({
  cmd: 'GetCustomCumulus',
  data: {
    rangeStart: `${currentYear}-01-01`,
    rangeEnd: `${currentYear}-12-31`,
    cumulusField: 'cmbEdificios',
    currency: currency
  }
});

if(!GetCustomCumulus.ok){
  throw GetCustomCumulus.msg;
}

const record = GetCustomCumulus.outData.find(item => item.cumulusField === cmbEdificios);
const resto = (record?.sumInsured ?? 0) < limite ? limite - (record?.sumInsured ?? 0) : 0;
const restoSum = insuredSum < resto ? insuredSum : resto;
return {
  ok: true,
  limite: limite,
  cumulo: record?.sumInsured ?? 0,
  resto: resto,
  restoSum: restoSum
}

function setConfiguracion() {

  doCmd({cmd :"GetFullTable", data: {table: "tblCapacidadEdificios"}});

   if(!GetFullTable.ok)
      console.error("Error leyendo configuración de cúmulo");

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