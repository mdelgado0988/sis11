//block
//noreplace

/*
  *@name: cmdGetAcummulationSuretyBond
  *@Purpose: Obtiene cúmulo vigente de fianzas según producto y tipo de cúmulo
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 20/04/2026
  *@Modified: 11/11/2026 aiden_mission_configurator (MSN-000189 / AXX-8957): client and economic group
  *           use the contractual accumulation from chain 830 cmdCumuloFianzasPorContacto, matching
  *           view 43 and preserving consortium participation.
  *           - Policy: full policy contractual amount.
  *           - Client: contractual amount of its rows, including the applicable participation when
  *             the contact is a consortium parent or member.
  *           - Economic Group: full contractual accumulation of the parent consortium when the client
  *             is a consortium member; otherwise it uses the client itself.
  *           The current policy or offer is included with its contractual amount. Facultative portions,
  *           100% retained or uninsured sureties, and sureties with status 0 are excluded.
  *@Input: {policyId, type}
  *@Output: [{ accumulationType, limit, accumulation, excede }]
*/

const policyId = context.policyId;
const accumulationType = context?.type ?? "";
let accumulationConfig;
let policy;
let accumulationByPolicy;
let accumulationByClient;
let accumulationByEconomicGroup;
const filasPorContactos = {};
let resultado = [];

try {
  
  setPolicy();
  setAccumulationConfig();

  switch(accumulationType){
    case "policy":
      setAccumulationByPolicy();
      resultado.push({ accumulationType: "Póliza", limit: d(accumulationConfig.find(x => x.accumulationType == "policy")?.limit ?? 0), accumulation: d(accumulationByPolicy) });    
      break;
    case "client":
      setAccumulationByClient();
      resultado.push({ accumulationType: "Cliente", limit: d(accumulationConfig.find(x => x.accumulationType == "client")?.limit ?? 0), accumulation: d(accumulationByClient) });
      break;
    case "economicGroup":
      setAccumulationByEconomicGroup();
      resultado.push({ accumulationType: "Grupo Económico", limit: d(accumulationConfig.find(x => x.accumulationType == "economicGroup")?.limit ?? 0), accumulation: d(accumulationByEconomicGroup) });
      break;
    default:
      setAccumulationByPolicy();
      resultado.push({ accumulationType: "Póliza", limit: d(accumulationConfig.find(x => x.accumulationType == "policy")?.limit ?? 0), accumulation: d(accumulationByPolicy) });    

      setAccumulationByClient();
      resultado.push({ accumulationType: "Cliente", limit: d(accumulationConfig.find(x => x.accumulationType == "client")?.limit ?? 0), accumulation: d(accumulationByClient) });

      setAccumulationByEconomicGroup();
      resultado.push({ accumulationType: "Grupo Económico", limit: d(accumulationConfig.find(x => x.accumulationType == "economicGroup")?.limit ?? 0), accumulation: d(accumulationByEconomicGroup) });
      break
  }
  
  resultado.forEach(x => {
    x.excede = (x.limit <= x.accumulation);
    x.limit = n(x.limit);
    x.accumulation = n(x.accumulation);
  })  
  
  return resultado

} catch (error) {
   throw `@${error.toString()}`;
}

function setAccumulationByPolicy() {
  const filaPoliza = getFilasCumulo([Number(policy.holderId)])
    .find(f => Number(f.polizaId) === Number(policyId));
  accumulationByPolicy = filaPoliza ? d(filaPoliza.sumaContractualPoliza) : 0;
}

function setAccumulationByClient() {
  accumulationByClient = sumarContractual(getFilasCumulo([Number(policy.holderId)]));
}

function setAccumulationByEconomicGroup() {
  const clientId = policy.holderId;
  const consorciosPadre = getConsorciosPadre(clientId);
  const contactosCumulo = consorciosPadre.length ? consorciosPadre : [Number(clientId)];

  // Use the same chain 830 calculation as the client.
  // When the holder is a consortium member, query the parent to obtain the
  // full consortium accumulation instead of the holder's participation only.
  accumulationByEconomicGroup = sumarContractual(
    getFilasCumulo(contactosCumulo)
  );
}

function getConsorciosPadre(clientId) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id <= 0) return [];

  doCmd({cmd: "DoQuery", data: { sql: `
SELECT DISTINCT c.id AS parentId
FROM Contact c
CROSS APPLY OPENJSON(c.jCustomForms) tabs
CROSS APPLY OPENJSON(tabs.[value])
  WITH (fname varchar(100) '$.name', userData nvarchar(max) '$.userData[0]') fld
CROSS APPLY OPENJSON(fld.userData)
  WITH (CodigoSis int '$.CodigoSis') m
WHERE tabs.[key] = 'Consorcios'
  AND fld.fname = 'hiddenValida'
  AND ISJSON(fld.userData) = 1
  AND m.CodigoSis = ${id};` }});
  if (!DoQuery.ok)
    throw new Error("No se pudo consultar el consorcio del cliente: " + DoQuery.msg);

  return [...new Set((DoQuery.outData ?? [])
    .map(x => Number(x.parentId))
    .filter(x => Number.isInteger(x) && x > 0))];
}

function getValidSuretySql(policyAlias) {
  return `NOT EXISTS (
    SELECT 1
    FROM InsuredObject io
    CROSS APPLY OPENJSON(CASE WHEN ISJSON(io.jValues) = 1 THEN io.jValues ELSE N'[]' END) field
    WHERE io.lifePolicyId = ${policyAlias}.id
      AND JSON_VALUE(field.value, '$.name') = 'cmbEstadoFianza'
      AND LTRIM(RTRIM(COALESCE(JSON_VALUE(field.value, '$.userData[0]'), ''))) = '0'
  )`;
}

// Filas de la cadena 830 (la de la vista 43) para los contactos, con la póliza u oferta en curso.
function getFilasCumulo(contactIds) {
  const clave = contactIds.join(",");
  if (filasPorContactos[clave]) return filasPorContactos[clave];

  doCmd({cmd: "ExeChain", data: { chain: "cmdCumuloFianzasPorContacto",
    context: JSON.stringify({ row: { contactIds: contactIds, incluirPolizaId: Number(policyId) } }) }});
  const salida = JSON.parse(JSON.stringify(ExeChain.outData ?? null));
  if (!ExeChain.ok || !salida || salida.ok !== true)
    throw new Error("No se pudo calcular el cúmulo de fianzas: " + (salida?.msg ?? ExeChain.msg));

  // Una participación (póliza, contacto) cuenta una sola vez: con el consorcio y su integrante
  // en la lista, la parte del integrante viene desde los dos.
  const vistas = {};
  const filas = (salida.data ?? []).filter(f => {
    const k = `${f.polizaId}|${f.contactoFilaId}`;
    if (vistas[k]) return false;
    vistas[k] = true;
    return true;
  });
  const noVigentes = getFianzasNoVigentes(filas.map(f => Number(f.polizaId)));
  filasPorContactos[clave] = filas.filter(f => !noVigentes.includes(Number(f.polizaId)));
  return filasPorContactos[clave];
}

// Fianzas con estado de fianza 0: no forman cúmulo (la vista 43 las descarta igual).
function getFianzasNoVigentes(ids) {
  const unicos = [...new Set(ids)].filter(x => x > 0);
  if (!unicos.length) return [];
  doCmd({cmd: "DoQuery", data: { sql: `SELECT p.id FROM LifePolicy p WHERE p.id IN (${unicos.join(",")}) AND NOT ${getValidSuretySql('p')};` }});
  if (!DoQuery.ok)
    throw new Error("No se pudo leer el estado de las fianzas: " + DoQuery.msg);
  return JSON.parse(JSON.stringify(DoQuery.outData ?? [])).map(x => Number(x.id));
}

function sumarContractual(filas) {
  return filas.reduce((a, f) => a + d(f.sumaContractual), 0);
}

function setPolicy() {
  doCmd({cmd: "LoadEntity", data:{ entity: "LifePolicy", fields: "productCode, insuredSum, holderId", filter: `id = ${policyId}`}});
  policy = LoadEntity.outData;
  if(!policy)
    throw new Error("No se encontró la póliza indicada ");
}

function setAccumulationConfig() {

  doCmd({cmd :"GetFullTable", data: {table: "cfgCumuloFianzaPorTipo"}});

   if(!GetFullTable.ok)
      console.error("Error leyendo configuración de tarifas");

  accumulationConfig = mapearTablaConfig(GetFullTable.outData ?? []);
  accumulationConfig = accumulationConfig.filter(x => x.productCode == policy.productCode);
  
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

function n(value) {
  // null / undefined / vacío → 0.00
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }

  let num = value;

  // Si es string, normalizar (quitar comas)
  if (typeof num === 'string') {
    num = num.replace(/,/g, '').trim();
  }

  num = Number(num);

  // No numérico → 0.00
  if (isNaN(num)) {
    num = 0;
  }

  // Redondear a 2 decimales
  const fixed = num.toFixed(2); // string

  let [entero, decimal] = fixed.split('.');

  // Agregar separadores de miles
  entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${entero}.${decimal}`;
}

function d(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  let str = String(value).trim();

  // Detectar cuál es el separador decimal (última aparición de . o ,)
  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');

  let decimalSeparator = null;

  if (lastDot > lastComma) {
    decimalSeparator = '.';
  } else if (lastComma > lastDot) {
    decimalSeparator = ',';
  }

  // Remover separadores de miles (el opuesto al decimal)
  if (decimalSeparator === '.') {
    str = str.replace(/,/g, '');
  } else if (decimalSeparator === ',') {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // No hay decimal claro → quitar todo lo que no sea número o signo
    str = str.replace(/[^\d-]/g, '');
  }

  const num = Number(str);

  return isNaN(num) ? 0 : num;
}
