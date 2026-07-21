//block
//noreplace
/** 
*Author: Mike Ortiz
*Creation Date: 2025-12-04
*Last Modification Author: Mike Ortiz
*Last Modification Date: 2025-12-04
*Version Number: 1
* Command Chain creado para realizar una búsqueda pagina para renovacion por lotes de poliza
* @param {string} row.policyId Id de la poliza
* @param {string} row.ramo Codigo del ramo
* @param {string} row.producto Codigo del producto
* @param {string} row.sucursal Codigo de sucursal
* @param {string} row.tipoPoliza Tipo de poliza
* @param {Date} row.venceDesde Rango inicial de busqueda
* @param {Date} row.venceHasta Rango final de busqueda
* @param {number} row.venceEn Dias en rango
*/
/*
Name: cmdPolicyFilterLoteRenew
Category: VIEW
*/
const { row } = context;
let filtro = '';
let querySql = '';
let cteQuery = '';
if(row.policyId){
    filtro += ` AND pol.[id]=${row.policyId}`;
}
if(row.ramo){
    filtro += ` AND pol.[lob]='${row.ramo}'`;
}
if(row.producto){
    filtro += ` AND pol.[productCode]='${row.producto}'`;
}
if(row.sucursal){
    filtro += ` AND pol.[branchCode]='${row.sucursal}'`;
}
if(row.tipoPoliza){
    filtro += ` AND pol.[policyType]  <= '${row.tipoPoliza}'`;
}
if(row.venceDesde){
    filtro += ` AND pol.[end] >= '${row.venceDesde}'`;
}
if(row.venceHasta){
    filtro += ` AND pol.[end] <= '${row.venceHasta}'`;
  
}
if(row.venceEn){
  filtro += ` AND CAST(pol.[end] AS DATE) <= DATEADD(DAY, ${row.venceEn}, CAST(GETDATE() AS DATE))`;  
}

cteQuery = `
WITH BatchCreated AS (
SELECT 
  B.id AS batchId,
  TRY_CAST(JSON_VALUE(J.value, '$[0]') AS INT) AS anniversaryId,
  TRY_CAST(JSON_VALUE(J.value, '$[3]') AS CHAR(2)) AS renovar
FROM [Batch] AS B
JOIN [ImportConfig] ic ON b.importConfigId = ic.id
CROSS APPLY OPENJSON(B.jData) AS J
WHERE 
    ic.[category] = 'ANNIVERSARYLOTEVIEW'
    AND  ISJSON(B.jData) > 0
    AND TRY_CAST(JSON_VALUE(J.value, '$[0]') AS INT) IS NOT NULL
    AND TRY_CAST(JSON_VALUE(J.value, '$[3]') AS CHAR(2)) = 'Si'
)`;

querySql =`
${cteQuery}
SELECT 
    pol.[id] AS 'codigo',
    pol.[code] AS 'poliza',
    YEAR(pol.[start]) AS 'anio',
    MONTH(pol.[start]) AS 'mes',
    lob.[name] AS 'ramo',
    pro.[name] AS 'plan',
    COALESCE(process.[estado],pol.[entityState],'') AS 'estado',
    CASE 
        WHEN pol.[policyType] = 'I' THEN 'Póliza Individual'
        WHEN pol.[policyType] = 'G' THEN 'Poliza de Grupo'
        ELSE 'Certificado'
    END AS 'tipoPoliza',
    pol.[start] AS 'inicia',
    pol.[end] AS 'vence',
    TRIM(CONCAT_WS(' ', con.[name], con.[surname1], con.[surname2])) AS 'asegurado',
    DATEDIFF(DAY, GETDATE(), pol.[end]) AS 'diasV',
    '0' AS 'oferta',
    CalculoPago.[pending] AS 'pendiente',
    pol.[created] AS 'fechaCreacion',
    ani.[id] AS 'aniversarioId',
    COALESCE(btC.[batchId],0) batchId,
    CASE WHEN ISNULL(oa.estadoRenovacion, 'Sin Accion') = 'No Renovar' THEN 0 ELSE 1 END bRenovar
FROM LifePolicy pol
JOIN Product pro ON pol.[productCode] = pro.[code]
JOIN Lob lob ON pol.[lob] = lob.[code]
JOIN Insured aseg ON pol.[id] = aseg.[lifePolicyId] AND aseg.[role] =0
JOIN Contact con ON aseg.[contactId] = con.[id]
JOIN Anniversary ani ON pol.[id] = ani.[lifePolicyId]
LEFT JOIN BatchCreated btC ON ani.[id] = btC.[anniversaryId]
LEFT JOIN Proceso process ON pol.[processId] = process.[id]

OUTER APPLY (SELECT JSON_VALUE(j.userData, '$[0]') AS estadoRenovacion
            FROM insuredObject io
            CROSS APPLY OPENJSON(io.jValues)
            WITH (
                name NVARCHAR(100) '$.name',
                userData NVARCHAR(MAX) '$.userData' AS JSON
            ) j
            WHERE io.lifePolicyId = pol.id AND j.name = 'cmbRenovacion') oa

CROSS APPLY (
    SELECT SUM(pay.[minimum]) AS [pending]
    FROM PayPlan pay
    WHERE pay.[lifePolicyId] = pol.[id]
      AND pay.[payedDate] IS NULL
      AND pay.[payed] = 0
) CalculoPago

WHERE pol.[entityState] = 'ACTIVE'
AND pol.[active] = 1
AND ani.[executionDate] IS NULL
AND ani.[processId] IS NULL
${filtro}
`;

let paginationHeader = `
DECLARE @pagenum  AS INT = ${row.currentPage}, @pagesize AS INT = ${row.pageSize}; `;

let paginationFooter = `
ORDER BY pol.[id]
OFFSET (@pagenum - 1) * @pagesize ROWS 
FETCH NEXT @pagesize ROWS ONLY; `;

let sqlCommand = `
${paginationHeader}
${querySql}
${paginationFooter}
`;

doCmd({
    cmd:'DoQuery',
    data: {
        sql: sqlCommand
    }
});

let dataPaginada = DoQuery.outData;


let queryCountSql = `
SELECT COUNT(1) AS total
FROM LifePolicy pol
JOIN Product pro ON pol.[productCode] = pro.[code]
JOIN Lob lob ON pol.[lob] = lob.[code]
JOIN Insured aseg ON pol.[id] = aseg.[lifePolicyId] AND aseg.[role] =0
JOIN Contact con ON aseg.[contactId] = con.[id]
LEFT JOIN Proceso process ON pol.[processId] = process.[id]
CROSS APPLY (
    SELECT SUM(pay.[minimum]) AS [pending]
    FROM PayPlan pay
    WHERE pay.[lifePolicyId] = pol.[id]
      AND pay.[payedDate] IS NULL
      AND pay.[payed] = 0
) CalculoPago

WHERE pol.[entityState] = 'ACTIVE'
AND pol.[active] = 1
${filtro}
`;


doCmd({
    cmd:'DoQuery',
    data: {
        sql: queryCountSql
    }
});
let totalDatos = DoQuery.outData[0].total;

return {
    ok: true,
    total: totalDatos,
    data: dataPaginada
}