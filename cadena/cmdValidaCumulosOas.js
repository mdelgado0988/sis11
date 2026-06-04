//block
//noreplace

//doCmd({cmd: "GetPing", data: { contexto: JSON.stringify(context) }});

const {lob,codeCumulo,pais,estado,ciudad,corregimiento,codigoEdificio,nombreEdificio} = context;

if(!codigoEdificio || codigoEdificio == "0"){
  return {
        ok: true,
        accion: 'none',
        msg: '',
        bloquea: false
    }
}

const cumuloResult = getCumuloConfig(lob, codeCumulo);

if(!cumuloResult.ok){
    return {
        ok: false,
        cumulo: 'restriccion',
        msg: 'No se pudo recuperar el cúmulo de la póliza',
        bloquea: false
    }
}

const cumulo = cumuloResult?.cumulo;

if(!cumulo){
    return {
        ok: true,
        accion: 'none',
        msg: '',
        bloquea: false
    }
}

const contrato = getContract(cumulo);

if(!contrato){
    return {
        ok: false,
        accion: cumulo.accion,
        msg: 'No se pudo recuperar contrato de reaseguro',
        bloquea: cumulo.accion == 'restriccion'
    }
}

doCmd({
  cmd:'DoQuery',
  data: {
    sql: `
WITH TableBuilding AS 
(
    SELECT 
        pais,
        estado,
        ciudad,
        corregimiento,
        buildingCode,
        descBuilding
    FROM [Table] t
    CROSS APPLY OPENJSON(t.data)
        WITH (
            pais           varchar(50) '$[0]',
            estado         varchar(50) '$[1]',
            ciudad         varchar(50) '$[2]',
            corregimiento  varchar(50) '$[3]',
            buildingCode   varchar(50) '$[4]',
            descBuilding   varchar(200) '$[5]'
        ) AS data
    WHERE t.[name] = 'Edificios'
      AND pais = '${pais}'
      AND estado = '${estado}'
      AND ciudad = '${ciudad}'
      AND corregimiento = '${corregimiento}'
      AND buildingCode = '${codigoEdificio}'
)
SELECT
    tb.pais,
    tb.estado,
    tb.ciudad,
    tb.corregimiento,
    tb.buildingCode,
    tb.descBuilding,
    SUM(pol.insuredSum) total,
    FORMAT(SUM(pol.insuredSum), '#,##0.00', 'en-US') AS cumulo
FROM LifePolicy pol 
JOIN InsuredObject obj 
      ON obj.lifepolicyid = pol.id
     AND obj.objectDefinitionId IN (19,45,46,47)
CROSS APPLY OPENJSON(obj.jvalues)
    WITH (
        name     varchar(50) '$.name',
        userData varchar(50) '$.userData[0]'
    ) field
JOIN TableBuilding tb 
      ON field.userData = tb.buildingCode
WHERE pol.lob = '${lob}'
  AND pol.active = 1
  AND pol.activeDate IS NOT NULL
  AND field.name = 'cmbEdificios'
GROUP BY 
    tb.pais,
    tb.estado,
    tb.ciudad,
    tb.corregimiento,
    tb.buildingCode,
    tb.descBuilding;`
  }
});

if(!DoQuery.ok){
    return {
        ok: false,
        accion: 'none',
        msg: 'No se pudo recuperar el cumulo de la poliza',
        bloquea: cumulo.accion == 'restriccion'
    }
}


if(DoQuery.ok && DoQuery.total == 0){
    return {
        ok: false,
        accion: cumulo.accion,
        msg: `Suma asegurada acumulada para el edificio ${nombreEdificio || "No Tiene"} bajo contrato ${contrato.name} es de ${contrato.currency} 0.00`,
        bloquea: cumulo.accion == 'restriccion'
    }
}

const edificio = DoQuery.outData[0];
return {
  ok: true,
  accion: cumulo.accion,
  msg: `Suma asegurada acumulada para el edificio ${edificio.descBuilding || "No Tiene"} bajo contrato ${contrato.name} es de ${contrato.currency} ${edificio.cumulo}`,
  bloquea: cumulo.accion == 'restriccion' && cumulo.monto <= edificio.total
}

function getCumuloConfig(lob, codeCumulo) {
  
  doCmd({
      cmd:'GetFullTable',
      data:{
          table: 'tblGestiondeCumulos',
      }
  })
  
  if(!GetFullTable.ok){
      return {
          ok: false,
          cumulo: []
      }
  }
  
  const cumulo = GetFullTable.outData.splice(1)
                            .map(item =>  {
                                  return {
                                    lob: item[2],
                                    code: item[4],
                                    contract: item[3],
                                    description: item[5],
                                    monto: parseFloat(item[6] || 0),
                                    accion: item[7].toLowerCase(),
                                    estado: item[8].toLowerCase()
                                  }
                              }).find( item => item.estado == 'v' && item.lob == lob && item.code == codeCumulo);

   return {
    ok: true,
    cumulo: cumulo
   }
  
}

function getContract(cumulo) {
  doCmd({
      cmd:'GetContracts',
      data:{
          filter:`[code]='${cumulo.contract}'`,
          size:1
      }
  });
        
  const contrato = GetContracts.outData?.[0];
  return contrato
}
    