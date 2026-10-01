//block
/**
 * Name: cmdGeneraReaseguro
 * Description: Genera el reaseguro de la póliza
 * Author: Max Batres
 * Date: 20260102 07:57:57 p. m.
 * Category: INTERFACE
 * Version: 1.0
 * Parameters:
   _id = PolicyId,
   _delete: true or false
 * Simulación:
   {NumeroOferta : 326, applyContract: false}
 */
mi = this;

try {
  //{id : 326} - filter / context en el simulador de fórmula  
  let inicio = Date.now();
    
  //Paso 1. Primero borro los datos de reaseguro si se indica con el parámetro: applyContract.
  let PolicyId = _NumeroOferta
  let applyContract = _applyContract || false;
  let reinsurancePreview = null;
   
  if (applyContract) { 
    DeleteCessions(PolicyId); 
    log(`Borrando cesiones, tiempo: ${(Date.now() - inicio).toFixed(2)} ms`); 
    inicio = Date.now();
    
    reinsurancePreview = ComputeRe(PolicyId);    
    log(`Calculando reaseguro, tiempo: ${(Date.now() - inicio).toFixed(2)} ms`);
    inicio = Date.now();

    // La generación ya creó las cesiones; se limpian sus reaseguradores FAC
    // sin modificar la configuración global del contrato.
    if (ReComputeRe.ok) {
      const removedParts = clearRdfacFacCessionParts(PolicyId);
      log(`Eliminando reaseguradores RDFAC/FAC: ${removedParts}, tiempo: ${(Date.now() - inicio).toFixed(2)} ms`);
      inicio = Date.now();
    }
  }

  //Paso 2. Obteniendo los datos del reaseguro por cobertura y contrato.
  var vCessions = [];
  var cessionsResults = [];
  var cessionsResultsSummary = [];  
  let cessionsContract = {
    RET: 0,
    CP: 0,
    FAC: 0
  };
  
  doCmd({ cmd: "LoadEntities", data: { entity: "Cession", filter: `lifePolicyId=${PolicyId}` } });  
  if (!LoadEntities.ok || !LoadEntities.outData || LoadEntities.outData.length == 0) {    
      vCessions = reinsurancePreview && reinsurancePreview.cessions ? reinsurancePreview.cessions : [];      
  } else {
      vCessions = LoadEntities.outData;      
  };
  
  vCessions.forEach(row => {
    cessionsResultsSummary.push({
      id: row.id,
      lifePolicyId: row.lifePolicyId,
      policyCode: row.policyCode,
      coverageCode: row.coverageCode,
      cover: row.cover,
      lineId: row.lineId,
      sumInsured: row.sumInsured,
      premium: row.premium,
      sumInsuredRe: row.sumInsuredRe,
      premiumRe: row.premiumRe,
      sumInsuredCedant: row.sumInsuredCedant,
      premiumCedant: row.premiumCedant,
      /*Colocación x reasegurador*/      
      //sumaCed: row.Participants[0].sumInsured || 0,
      //primaCed: row.Participants[0].premium || 0,
      /*Fin*/
      hasError: row.err,
      msg: row.msg
    })
  });  

  log(`Cargando nuevo reaseguro, tiempo: ${(Date.now() - inicio).toFixed(2)} ms`);
  inicio = Date.now();

  //Paso 4. Agregando el formulario de reaseguro
  addDistRea(PolicyId);

  log(`Guardando Objeto Distribución, tiempo: ${(Date.now() - inicio).toFixed(2)} ms`);
  inicio = Date.now();

  /*
  let hasError = vCessions.some(cession => cession.err == true);      
  let needsFacultative = vCessions.some(cession => cession.lineId === 'FAC');
  cessionsResults.push({
      //policy: policy,
      //reinsurancePreview: vCessions,
      reinsurancePreview: cessionsResultsSummary,
      hasError: hasError,
      needsFacultative: needsFacultative
  });        
  */
  //var msg = "probando";
  //return me.message.warning(msg,30);
  //return cessionsContract;
  //return vCessions;
  return cessionsResultsSummary;  

} catch (error) {
   return {ok: false, msg: error.toString()}
}  

function formatdate(dates){
  try{
    var dd,mm,yyyy;
    var yyyy = dates.substring(0, 4);
    var mm = dates.substring(7, 5);
    var dd = dates.substring(10, 8);
    dates = dd + '/' + mm + '/' + yyyy;
    return dates;
  }catch{
    return dates
  }    
};

function formatDateTime(dateInput) {
  try{
        
    const date = new Date(dateInput);
    
    if (isNaN(date)) return ""; // validación si no es fecha válida
  
    const pad = (n) => n.toString().padStart(2, '0');
  
    const dd = pad(date.getDate());
    const mm = pad(date.getMonth() + 1); // meses van de 0 a 11
    const yyyy = date.getFullYear();
  
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
  
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  }catch {
    return dateInput;
  }
};

//Inicio de código de reaseguros  
function DeleteCessions(PolId) {      
        //doCmd({cmd:"RepoCession", data:{operation:"DELETE", entity:{id:cessionId}}});
        //doCmd({ cmd: "DoQuery", data: { sql: `DELETE c FROM Cession c INNER JOIN LifePolicy p ON p.[Id] = c.lifePolicyId WHERE p.[Id] = ${PolId}` } });
        doCmd({ cmd: "DoQuery", data: { sql: `DELETE c FROM Cession c WHERE c.lifePolicyId = ${PolId}` } });
        doCmd({ cmd: "DoQuery", data: { sql: `DELETE cp FROM CessionPart cp INNER JOIN Cession c ON c.[Id] = cp.cessionId INNER JOIN LifePolicy p ON p.[Id] = c.lifePolicyId WHERE p.[Id] = ${PolId}` } });
};

function ComputeRe(policyId) {
    doCmd({ cmd: "ReComputeRe", data: { policyId: policyId } });
    return ReComputeRe.ok ? ReComputeRe.outData : null;
};    

function clearRdfacFacCessionParts(policyId) {
    doCmd({ cmd: "DoQuery", data: { sql: `
        DELETE cp
        FROM CessionPart cp
        INNER JOIN Cession cs ON cs.id = cp.cessionId
        INNER JOIN Contract ct ON ct.id = cs.contractId
        WHERE cs.lifePolicyId = ${Number(policyId)}
          AND UPPER(LTRIM(RTRIM(ISNULL(ct.code, '')))) = 'RDFAC'
          AND UPPER(LTRIM(RTRIM(ISNULL(cp.lineId, '')))) = 'FAC';
        SELECT @@ROWCOUNT AS deleted;
    ` } });
    if (!DoQuery.ok) throw new Error(`No se pudieron eliminar los reaseguradores de RDFAC/FAC: ${DoQuery.msg}`);
    const result = Array.isArray(DoQuery.outData) ? DoQuery.outData[0] : null;
    return Number(result && result.deleted) || 0;
}

function addDistRea(lifePolicyId) {

  doCmd({cmd: "RepoObjectDefinition", data: { operation: "GET", filter: "code = 'DISTREA'", include:["Form"], noTracking: true}});
  const distReaForm = RepoObjectDefinition.outData?.[0]?.Form;  
  if(!distReaForm)
    return;

  const {
    id: objectDefinitionId   
  } = RepoObjectDefinition.outData?.[0] || {};

  doCmd({cmd: "RepoInsuredObject", data: { operation: "GET", filter: `lifePolicyId = ${lifePolicyId} AND objectDefinitionId = ${objectDefinitionId}`, noTracking: true }});
  
  if(RepoInsuredObject?.total > 0)
    return 'ya existe';

  const entity = {id: 0,
                  objectDefinitionId: objectDefinitionId,
                  lifePolicyId: lifePolicyId,
                  jValues: distReaForm.json,
                  jMap: null,
                  jFileUpload: null,
                  alias: null,
                  jDetailList: null,
                  ObjectDefinition: null,
                  userData: JSON.stringify([])
                 };

  doCmd({cmd: "RepoInsuredObject", data: { operation: "ADD", entity: entity, noTracking: true }});
  if(!RepoInsuredObject.ok)
    throw new Error(RepoInsuredObject.msg);
  
}
