//block
//noreplace

/*
  *@name: cmdGetAcummulationSuretyBond
  *@Purpose: Obtiene cúmulo vigente de fianzas según producto y tipo de cúmulo
  *@Autor: Michael Delgado
  *@Email: michael.delgado@axxis-systems.com
  *@Created: 20/04/2026
  *@Input: {policyId, type}
  *@Output: [{ accumulationType, limit, accumulation }]
*/

const policyId = context.policyId;
const accumulationType = context?.type ?? "";
const objectDefinitionCode = "OBJFIANZA";
let objectDefinitionId;
let oaUserData;
let principal;
let accumulationConfig;
let policy;
let accumulationByPolicy;
let accumulationByClient;
let accumulationByEconomicGroup;
const ramos = ["81"]
let resultado = [];

try {
    
  setPolicy();
  setInsuredObject();
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
  accumulationByPolicy = policy.insuredSum;
}

function setAccumulationByClient() {

  const clientId = policy.holderId;
  const filterRamos = ramos.map(x => `'${x}'`).join(',');

  /*const query = `SELECT SUM(P.insuredSum) suma
  FROM InsuredObject t
  INNER JOIN LifePolicy p ON p.id = t.lifePolicyId
  CROSS APPLY OPENJSON(t.jValues) WITH (
      name NVARCHAR(100),
      userData NVARCHAR(MAX) AS JSON
  ) j
  CROSS APPLY OPENJSON(j.userData) ud
  WHERE t.objectDefinitionId = ${objectDefinitionId} AND j.name = 'rut'
    AND ud.value = '${clientId}'
    AND CAST(GETDATE() AS date) BETWEEN CAST(p.[start] AS DATE) AND CAST(p.[end] AS DATE)
    AND p.activeDate IS NOT NULL AND p.active = 1;`*/

  const query = `SELECT SUM(P.insuredSum) suma
  FROM LifePolicy p
  WHERE p.holderId = ${clientId} AND p.lob in (${filterRamos})
    AND CAST(GETDATE() AS date) BETWEEN CAST(p.[start] AS DATE) AND CAST(p.[end] AS DATE)
    AND p.activeDate IS NOT NULL AND p.active = 1;`
  
  doCmd({cmd: "DoQuery", data: { sql: query }});
    
  accumulationByClient = DoQuery.outData?.[0]?.suma ?? 0;
  accumulationByClient += policy.insuredSum; //sumamos la oferta para que forme parte del cúmulo
}

function setAccumulationByEconomicGroup() {

  const clientId = policy.holderId;
  const filterRamos = ramos.map(x => `'${x}'`).join(',');
  doCmd({cmd: "LoadEntity", data: { entity: "Contact", fields: "jCustomForms", filter: `id = ${clientId}` }});
  const jCustomForms = LoadEntity.outData?.jCustomForms;

  const customForms = jCustomForms ? JSON.parse(jCustomForms) : [];
  if(customForms.length == 0){
    setDefaultaccumulationByEconomicGroup();
  }

  const jGECForm = customForms["Grupo Económico"];
  if(!jGECForm){
    setDefaultaccumulationByEconomicGroup();
    return;
  }

  const GECForm = jGECForm ? JSON.parse(jGECForm) : [];
  if(!GECForm){
    setDefaultaccumulationByEconomicGroup();
    return;
  }

  const jConfig = GECForm.find(x => x.name == "hiddenValidaGEC")?.userData?.[0];
  const GEC = jConfig ? JSON.parse(jConfig) : [];

  if(GEC.length == 0){
    setDefaultaccumulationByEconomicGroup();
    return;
  }
  
  const integrantes = GEC
  .map(x => `${x.codigoEmpresa}`)
  .join(',');

  const query = `SELECT SUM(P.insuredSum) suma
  FROM LifePolicy p
  WHERE p.holderId in  (${integrantes},${clientId}) AND p.lob in (${filterRamos})
    AND CAST(GETDATE() AS date) BETWEEN CAST(p.[start] AS DATE) AND CAST(p.[end] AS DATE)
    AND p.activeDate IS NOT NULL AND p.active = 1;`
  
  doCmd({cmd: "DoQuery", data: { sql: query }});

  accumulationByEconomicGroup = DoQuery.outData?.[0]?.suma ?? 0;
  accumulationByEconomicGroup += policy.insuredSum; //sumamos la oferta para que forme parte del cúmulo
  
}

function setDefaultaccumulationByEconomicGroup() {
  //if(!accumulationByClient) setAccumulationByClient();
  accumulationByEconomicGroup = 0//accumulationByClient;
}

function setPolicy() {
  doCmd({cmd: "LoadEntity", data:{ entity: "LifePolicy", fields: "productCode, insuredSum, holderId", filter: `id = ${policyId}`}});
  policy = LoadEntity.outData;
  if(!policy)
    throw new Error("No se encontró la póliza indicada ");
}

function setInsuredObject() {
  
  doCmd({cmd: "RepoObjectDefinition", data:{ operation: "GET", filter: `code = '${objectDefinitionCode}'`}});
  objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;
  if(objectDefinitionId == 0)
    throw new Error("No se encontró configuración del objeto asegurado ")
  
  doCmd({
      cmd: "RepoInsuredObject",
      data: {
          operation: 'GET',
          filter: `lifePolicyId = ${policyId} and objectDefinitionId in (${objectDefinitionId})`,
          noTracking: true
      }
  });

  if (!(RepoInsuredObject.total > 0) || !RepoInsuredObject.outData) {
      throw ' Debe Guardar el Objeto Asegurado'
  }

  oaUserData = RepoInsuredObject.outData[0].userData;

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