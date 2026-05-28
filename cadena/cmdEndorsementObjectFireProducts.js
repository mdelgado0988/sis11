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

const definitions = [45,46,47];
var insuredObject = poliza.InsuredObjects.filter(x=> definitions.includes(x.objectDefinitionId));

insuredObject = insuredObject.length > 0 ? insuredObject[0] : null;
if (!insuredObject)
  	throw "No se encontró el objeto asegurado.";

const sumaAsegurada = parseFloat(insuredObject.userData.txtSA);

//Michael Delgado. 2026.04.08. GLOB-180. Que no valide, si está igual que actualice, pero es necesario que continúe a la generación del CD.
/*if(poliza.insuredSum === sumaAsegurada){
    return {
        ok:true,
        msg: 'Endoso de Cambio de Objeto Asegurado sin cambios de suma asegurada'
    }
}*/

//Michael Delgado. 2026.04.08. GLOB-180. Esto no es necesario, el mismo endoso puede generar y debe generar los cambios en la póliza (coberturas, etc).
/*
let coberturasAnteriores = [];
let coberturasActual = [];
let sumAseguradaBasic = 0;
let prima = 0;
coberturasAnteriores = JSON.parse(JSON.stringify(poliza.Coverages));

doCmd({
    cmd: "ExeChain",
    data:{
        chain: "cmdGetGeneralIncendio",
        context: `{poliza:${JSON.stringify(poliza)},action:'QUOTE',extra:null,esEndoso:false}`
    }
});

const coberturasTarificadas = ExeChain.outData ? ExeChain.outData : null;

if(!coberturasTarificadas)
    throw '@No se pudo modificar las coberturas';

for(var indice = 0; indice < poliza.Coverages.length; indice ++){ 
  	let cobertura = poliza.Coverages[indice];
    const currentCob = coberturasTarificadas[cobertura.code];
    if(!currentCob) continue;
  	cobertura.limit = currentCob.limit;
  	cobertura.startLimit = currentCob.limit;  	
  	cobertura.basePremium = currentCob.premium;
  	cobertura.premium = currentCob.premium;
  	cobertura.startBasePremium = currentCob.premium;
  	cobertura.startPremium = currentCob.premium;
    cobertura.deductible = currentCob.dedutible
  	coberturasActual.push(cobertura);
    if(cobertura.basic) sumAseguradaBasic += currentCob.limit;;
}

doCmd({
    cmd:"ChangeCoverage",    
    data:{
        policyId:poliza.id,
        jOldCoverages:JSON.stringify(coberturasAnteriores),
        jNewCoverages:JSON.stringify(coberturasActual),
        effectiveDate:effectiveDate,
        operation:"ADD",
        ignore: 1,
        noTracking: true
	}
});

if(!ChangeCoverage.ok) return ChangeCoverage;

const changeCoverageId = ChangeCoverage.outData.id;

//Se secreo correctamente el endoso ejecutamos accion EXECUTE    
doCmd({
    cmd: "ExeChangeCoverage",
    data: {
        changeId: changeCoverageId,
        exeNow: false,
        operation: "EXECUTE",
        noTracking: true
    }
});

if(!ExeChangeCoverage.ok) return ExeChangeCoverage;
*/

/*
var query = "update Change set newCapital = " + sumAseguradaBasic + ", oldCapital = "+ poliza.insuredSum +" where id = " + changeCoverageId;
doCmd({ "cmd": "DoQuery", "data": { sql: query } });
*/

var query = "update LifePolicy set insuredSum = " + sumaAsegurada + " where id = " + poliza.id;
doCmd({ "cmd": "DoQuery", "data": { sql: query } });

//Michael Delgado. 2026.04.08. GLOB-180. Debido a que el endoso de cambio de cobertura no es necesario, no es necesario generar otro reporte.
/*
//MAD: Creo el documento del cambio según la cadena de reportes
doCmd({cmd:'ExeChain',data:{chain:'cmdGenertFormatoEmdoso', context: `{ changeId: ${changeCoverageId} }`}});
*/

// Ejecutamos plantilla contable de endoso
const changeData = getChangeData(changeId);

//MAD: Si es un endoso informativo de cambio de objeto asegurado, no contabilizo, de lo contrario si.
if(changeData.Discriminator == "InsuredObjectChange" && changeData.informative)
    return;

doCmd({cmd:'ExeTransactionTemplate',data:{code:'EmisionIncendio', scanContext:{ id: changeId, tipo: 4 }}});

function getChangeData(changeId) {  
  doCmd({ cmd: "LoadEntity", data:{ entity: "Change", filter: `id= ${changeId}`, fields:"informative, Discriminator"}});
  const change = LoadEntity.outData;
  return change;
}