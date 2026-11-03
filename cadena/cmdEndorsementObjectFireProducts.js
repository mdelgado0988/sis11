//block
/*
Name: cmdEndorsementObjectFireProducts
Author: Felix Ramirez
Description: This command is to calculate the automatic cover change endorsement that is executed when an insuredobject endorsement is generated.
Category: ENDORSETMENT
Version: 1
Modificated Date: 05-10-2023
*/
doCmd({"cmd":"RepoLifePolicy","data":{"noTracking":true,"operation":"GET","filter":"id="+_row.lifePolicyId,"include":["Coverages", "InsuredObjects"]}});
let poliza = RepoLifePolicy.outData[0];
let changeId = _row.changeId;
//let effectiveDate = _row.effectiveDate;

// Ejecutamos plantilla contable de endoso
const changeData = getChangeData(changeId);
if(!changeData) throw "No se encontró el objeto asegurado.";

const definitions = [45,46,47];
const jInsuredObjects = changeData.jNewInsuredObjects ? JSON.parse(changeData.jNewInsuredObjects) : [];
var jInsuredObject = jInsuredObjects.filter(x=> definitions.includes(x.objectDefinitionId));
var insuredObject = jInsuredObject[0].jValues ? JSON.parse(jInsuredObject[0].jValues) : [];

if(insuredObject.length == 0) throw "No se encontró el objeto asegurado.";

const actualDefinitionId = jInsuredObjects[0].objectDefinitionId;

let objectSA = insuredObject.find(x => x.name == "txtSA");
if(!objectSA) throw "No se encontró el campo de la suma asegurada.";

const sumaAsegurada = parseFloat(objectSA.userData[0]);

var query = "update LifePolicy set insuredSum = " + sumaAsegurada + " where id = " + poliza.id;
doCmd({ "cmd": "DoQuery", "data": { sql: query } });

//MAD: Si es un endoso informativo de cambio de objeto asegurado, no contabilizo, de lo contrario si.
if(changeData.Discriminator == "InsuredObjectChange" && changeData.informative)
    return;

//Michael Delgado. 2026.04.07. GLOB-625. Redistribución de reaseguro.
log("Redistribuyendo reaseguro según registro manual");
doCmd({
  cmd:'ExeChain',
  data: {
      chain: 'cmdRedistribuyeReaseguroEndoso',
      context: '{ changeId: ' + changeId + ' }'
  }
});

doCmd({cmd:'ExeTransactionTemplate',data:{code:'Emision', scanContext:{ id: changeId, tipo: 4 }}});

function getChangeData(changeId) {  
  doCmd({ cmd: "LoadEntity", data:{ entity: "Change", filter: `id= ${changeId}`, fields:"informative, Discriminator, jNewInsuredObjects"}});
  const change = LoadEntity.outData;
  return change;
}