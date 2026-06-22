//block
//noreplace
/** 
*Author: Mike Ortiz
*Creation Date: 2025-11-26
*Last Modification Author: Mike Ortiz
*Last Modification Date: 2025-11-26
*Version Number: 1
* Command Chain creado para realizar una búsqueda avanzada para los productos del ramo incendio
* @param {string} row.country Codigo del distrito
* @param {string} row.provincia Codigo del estado
* @param {string} row.municipio Codigo del sector
* @param {string} row.sector direccion de la calle
* @param {number} row.buildingType Tipo de propiedad. 1=edificio, 2=barriada
* @param {string} row.searchName Nombre genérico de edificio o barriada
*/
/*
Name: cmdAdvanceSearchPolicyFire
Author: Mike Ortiz
Description: Optimizing query.
Category: VIEW
Version: 1.00
CreateDate: 07-02-2024
*/
let extraParametros = '';
let extraParametroDate = '';
let extraParametrosHead = '';
let extraFilterBuilding = '';
let filterLine = '';
let filtro = '';
let field = [];
let values = [];

const { row } =context;
const isEdificio = Number(row.buildingType) === 1 || row.edificio === 1 || row.edificio === '1' || row.edificio === true;
const isBarriada = Number(row.buildingType) === 2 || row.barriada === 1 || row.barriada === '1' || row.barriada === true;
const buildingSearchText = row.searchName || row.buildingName || row.barriada || '';

//doCmd({cmd:'GetPing', data: { row: JSON.stringify(row)}});

if(row.country){
  filtro +=  isEdificio ?
           `and JSON_VALUE(data.[value],'$[0]') = '${row.country}'` :
           `and p.[code] = '${row.country}'`;

}
if(row.provincia) {
   filtro +=  isEdificio ? 
              `and JSON_VALUE(data.[value],'$[1]') =  '${row.provincia}'`:
              `and s.[code] = '${row.provincia}'`;

}
if(row.municipio) {  
   filtro +=   isEdificio ? 
              `and JSON_VALUE(data.[value],'$[2]') =  '${row.municipio}'`:
              `and m.[code] = '${row.municipio}'`;
 
}
if(row.sector) {
   filtro +=  isEdificio ? 
              `and JSON_VALUE(data.[value],'$[3]') =  '${row.sector}'`:
              `and c.[code] = '${row.sector}'`;
 
}
if(buildingSearchText){
   filtro +=  isEdificio ? 
              `and JSON_VALUE(data.[value],'$[5]') LIKE '%${buildingSearchText}%'`:
              `and data.descBuilding LIKE '%${buildingSearchText}%'`;
 
}

if(isEdificio){
    extraFilterBuilding = `  
    WITH TableBuilding AS (
        SELECT  
          JSON_VALUE(data.[value],'$[4]') buildingCode,
          MAX(JSON_VALUE(data.[value],'$[5]')) descBuilding
        FROM [Table] t
        CROSS APPLY OPENJSON(t.data) data
        WHERE t.[name] = 'Edificios'
        ${filtro}
        GROUP BY JSON_VALUE(data.[value],'$[0]'),JSON_VALUE(data.[value],'$[4]')
  )`;
  filterLine = 'cmbEdificios';
}

if(isBarriada){
extraFilterBuilding = `  
    WITH TableBuilding AS (
        SELECT  
        data.buildingCode buildingCode,
        MAX(data.descBuilding) descBuilding
        FROM (
          SELECT 
            JSON_VALUE(tb.[value],'$[0]') buildingCode,
            JSON_VALUE(tb.[value],'$[1]') sectorId,
            JSON_VALUE(tb.[value],'$[3]') descBuilding
          FROM [Table] t
          CROSS APPLY OPENJSON(t.data) tb
          WHERE t.[name] = 'Barriadas'
        ) AS data
        JOIN SectorCatalog c ON data.[sectorId] = c.[code]
        JOIN CityCatalog m ON c.[cityCode] = m.[code]
        JOIN StateCatalog s ON m.[stateCode] = s.[code]
        JOIN CountryCatalog p ON s.[countryCode] = p.[code]    
        WHERE data.buildingCode IS NOT NULL AND data.buildingCode != ''
        ${filtro}
        GROUP BY data.buildingCode
  )`;

filterLine = 'cmbMunicipio';
}

let paginationHeader = `
DECLARE @pagenum  AS INT = ${row.currentPage}, @pagesize AS INT = ${row.pageSize}; `;

let paginationFooter = `
ORDER BY buildingcode
OFFSET (@pagenum - 1) * @pagesize ROWS 
FETCH NEXT @pagesize ROWS ONLY; `;

let sqlCommand = `
${paginationHeader}
${extraFilterBuilding}
SELECT buildingCode, descBuilding FROM TableBuilding 
${paginationFooter}
`

let counterSQL = `
${extraFilterBuilding}
SELECT  COUNT(1) as total 
FROM TableBuilding
`;

sqlCommand = `
${counterSQL}`;

doCmd({"cmd":"DoQuery","data":{"sql": sqlCommand}});
let totalDatos = DoQuery.outData[0].total;

extraParametrosHead = `
${paginationHeader}
${extraFilterBuilding}
    SELECT         
        tb.buildingcode buildingCode,
        tb.descBuilding buildingName,
        COUNT(pol.lifePolicyId) AS cantidad,
        SUM(COALESCE(pol.insuredSum,0)) AS sumatoria,
        AVG(COALESCE(pol.insuredSum,0)) AS promedio
    FROM tablebuilding tb
    LEFT JOIN (
        SELECT 
            obj.lifepolicyid,
            pol.insuredSum,
            field.name AS field,
            field.userdata AS value
        FROM LifePolicy pol 
        JOIN InsuredObject obj ON obj.lifepolicyid = pol.id    
        CROSS APPLY Openjson(obj.jvalues) 
        WITH ( 
            name varchar(50) '$.name',
            userdata varchar(50) '$.userData[0]' 
        ) AS field
        WHERE obj.objectDefinitionId IN (19,45,46,47) 
          AND pol.lob = '1' 
          /* GLOB-328: Validamos igual que validación de cúmulo, solo pólizas vigentes */
          AND pol.active = 1
          AND pol.activeDate IS NOT NULL
          AND field.[name] = '${filterLine}'
          
    ) AS pol 
        ON tb.[buildingcode] = pol.[value]
    GROUP BY 
        tb.buildingcode,tb.descBuilding
${paginationFooter}
`;
  extraParametros = `
  ${extraFilterBuilding}
    SELECT 
        pol.id,
        pol.[code] codigoPoliza,
        pol.[start] fInicio,  
        pol.[end] fFin,    
        pol.insuredSum,
        pro.name AS producto, 
        CASE 
            WHEN holder.isPerson = 1 THEN CONCAT(holder.name, ' ', holder.surname1) 
            ELSE holder.surname1 
        END AS asegurado,
        tb.buildingCode
    FROM LifePolicy pol 
    JOIN Product pro ON pol.productCode = pro.[code]
    JOIN Contact holder ON holder.id = pol.holderId
    JOIN InsuredObject obj ON obj.lifepolicyid = pol.id 
        AND obj.objectDefinitionId IN (19,45,46,47) 

    CROSS APPLY OPENJSON(obj.jvalues) 
    WITH ( 
        name varchar(50) '$.name',
        userData varchar(50) '$.userData[0]' 
    ) AS field 

    JOIN tablebuilding tb ON field.[name] = '${filterLine}' AND field.userData = tb.buildingcode
    WHERE pol.lob = '1'     
    /* GLOB-328: Validamos igual que validación de cúmulo, solo pólizas vigentes */
    AND pol.active = 1
    AND pol.activeDate IS NOT NULL
  `;


doCmd({"cmd":"DoQuery","data":{"sql": extraParametrosHead}});
let dataPaginada = DoQuery.outData;

doCmd({"cmd":"DoQuery","data":{"sql": extraParametros}});
let dataInterior = DoQuery.outData || [];

const dataOrdenada = agruparDetalles(dataPaginada, dataInterior);

return {
  	ok: true,
	total: totalDatos,  	
  	data: dataOrdenada
};

function agruparDetalles(encabezados, detalles) {

    // Primero agrupo los detalles por código para acceso rápido
    const mapa = detalles.reduce((acc, det) => {
        if (!acc[det.buildingCode]) acc[det.buildingCode] = [];
        acc[det.buildingCode].push(det);
        return acc;
    }, {});

    // Luego asigno a cada encabezado su lista de detalles
    return encabezados.map(enc => ({
        ...enc,
        polizas: mapa[enc.buildingCode] || []   // si no hay detalles → []
    }));
}
