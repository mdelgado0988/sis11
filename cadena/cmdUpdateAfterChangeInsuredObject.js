//block
//noreplace
const { row } = context;
doCmd({"cmd":"DoQuery","data":{"sql":"SELECT ch.id changeId, ch.jDetail, ch.status, ch.lifePolicyId, ch.effectiveDate, ch.executionDate, pol.productCode, pol.lob Ramo FROM Change ch INNER JOIN LifePolicy pol ON pol.id = ch.lifePolicyId WHERE ch.id=" + row.changeId}});

var changeEntity = DoQuery.outData[0];
var contextEntity = {row:changeEntity};
var changeEntityString = JSON.stringify(contextEntity);

changeEntityString = changeEntityString.replace(/"/g, '\"');
switch(changeEntity.Ramo){
	case "1":	
      //Michael Delgado. 2026.04.08. GLOB-180. Permitida la contabilización y actualización de sumas a través del endoso.
      doCmd({cmd:'ExeChain',data:{chain:'cmdEndorsementObjectFireProducts', context: changeEntityString }});
        /*switch(changeEntity.productCode){
          case "1_9":
          case "1_17":
            doCmd({cmd:'ExeChain',data:{chain:'cmdEndorsementObjectFireProducts', context: changeEntityString }});
            break;      
        }*/		
    break;
  default:
    break;
}