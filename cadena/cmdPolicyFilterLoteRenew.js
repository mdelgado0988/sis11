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
* @param {string} row.venceHastaExclusive Limite UTC exclusivo del dia siguiente al rango final
* @param {number} row.venceEn Dias en rango
*
* Date rule: LifePolicy dates are stored and compared in UTC. Date-only
* filters from the view represent Panama calendar dates and arrive as UTC
* boundaries, so the query must not use the server or browser local zone.
*/
/*
Name: cmdPolicyFilterLoteRenew
Category: VIEW
*/
const row = context && context.row ? context.row : {};
let filtro = '';
let querySql = '';
let cteQuery = '';
const policyId = getPositiveInteger(row.policyId);
const venceEn = getNonNegativeInteger(row.venceEn);
const hasExplicitExpirationRange = Boolean(row.venceDesde || row.venceHasta);
const renewalStatus = getTrimmedString(row.estadoRenovacion).toUpperCase();

if(row.policyId && policyId <= 0){
    return buildResult(false, 'El identificador de póliza no es válido');
}

if(policyId > 0){
    filtro += ` AND pol.[id]=${policyId}`;
}
if(row.ramo){
    filtro += ` AND pol.[lob]=${sqlString(row.ramo)}`;
}
if(row.producto){
    filtro += ` AND pol.[productCode]=${sqlString(row.producto)}`;
}
if(row.sucursal){
    filtro += ` AND pol.[branchCode]=${sqlString(row.sucursal)}`;
}
if(row.tipoPoliza){
    filtro += ` AND pol.[policyType]=${sqlString(row.tipoPoliza)}`;
}
if(renewalStatus === 'SIN_ACCION'){
    filtro += ' AND reno.id IS NULL';
}
if(renewalStatus === 'EN_PROGRESO'){
    filtro += ' AND reno.id IS NOT NULL AND reno.activeDate IS NULL';
}
if(renewalStatus === 'RENOVADA'){
    filtro += ' AND reno.id IS NOT NULL AND reno.activeDate IS NOT NULL';
}
if(row.venceDesde){
    filtro += ` AND pol.[end] >= ${sqlString(row.venceDesde)}`;
}
if(row.venceHasta){
    filtro += ` AND pol.[end] <= ${sqlString(row.venceHasta)}`;
}
if(row.venceHastaExclusive){
    filtro = filtro.replace(
        `AND pol.[end] <= ${sqlString(row.venceHasta)}`,
        `AND pol.[end] < ${sqlString(row.venceHastaExclusive)}`
    );
}
// An explicit expiration range takes precedence over the relative-day filter.
// Applying both conditions would exclude valid policies unintentionally.
if(!hasExplicitExpirationRange && row.venceEn && venceEn >= 0){
  // Calculate the current Panama day from UTC and compare UTC boundaries.
  // The relative filter includes already expired policies and limits only
  // the upper bound to the configured number of days ahead.
  const panamaDayUtc = "DATEADD(HOUR, 5, CAST(CAST(DATEADD(HOUR, -5, SYSUTCDATETIME()) AS DATE) AS DATETIME2))";
  filtro += ` AND pol.[end] < DATEADD(DAY, ${venceEn + 1}, ${panamaDayUtc})`;
}

cteQuery = `
WITH BatchCreated AS (
SELECT 
  MAX(B.id) AS batchId,
  TRY_CAST(JSON_VALUE(J.value, '$[2]') AS INT) AS lifePolicyId,
  MAX(TRY_CAST(JSON_VALUE(J.value, '$[3]') AS CHAR(2))) AS renovar
FROM [Batch] AS B
JOIN [ImportConfig] ic ON b.importConfigId = ic.id
CROSS APPLY OPENJSON(B.jData) AS J
WHERE 
    ic.[category] = 'ANNIVERSARYLOTEVIEW'
    AND  ISJSON(B.jData) > 0
    AND TRY_CAST(JSON_VALUE(J.value, '$[2]') AS INT) IS NOT NULL
GROUP BY TRY_CAST(JSON_VALUE(J.value, '$[2]') AS INT)
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
    CASE WHEN reno.id IS NOT NULL AND reno.activeDate IS NULL THEN 'En Proceso'
        WHEN reno.id IS NOT NULL AND reno.activeDate IS NOT NULL THEN 'Renovada' ELSE 'Sin Acción' END AS 'estado',
    CASE 
        WHEN pol.[policyType] = 'I' THEN 'Individual'
        WHEN pol.[policyType] = 'G' THEN 'Grupal'
        ELSE 'Certificado'
    END AS 'tipoPoliza',
    pol.[start] AS 'inicia',
    pol.[end] AS 'vence',
    TRIM(CONCAT_WS(' ', con.[name], con.[surname1], con.[surname2])) AS 'asegurado',
    DATEDIFF(DAY, GETDATE(), pol.[end]) AS 'diasV',
    ISNULL(reno.id,0) AS 'oferta',
    CalculoPago.[pending] AS 'pendiente',
    pol.[created] AS 'fechaCreacion',
    pol.[id] AS 'lifePolicyId',
    COALESCE(btC.[batchId],0) batchId,
    CASE WHEN ISNULL(oa.estadoRenovacion, 'Sin Accion') = 'No Renovar' THEN 0 ELSE 1 END bRenovar,
    pol.originalPolicyId
FROM LifePolicy pol
JOIN Product pro ON pol.[productCode] = pro.[code]
JOIN Lob lob ON pol.[lob] = lob.[code]
JOIN Insured aseg ON pol.[id] = aseg.[lifePolicyId] AND aseg.[role] =0
JOIN Contact con ON aseg.[contactId] = con.[id]
LEFT JOIN (
    SELECT originalPolicyId, MAX(id) AS latestRenewalId
    FROM LifePolicy
    WHERE originalPolicyId IS NOT NULL
    GROUP BY originalPolicyId
) latestRenewal ON latestRenewal.originalPolicyId = pol.id
LEFT JOIN LifePolicy reno ON reno.id = latestRenewal.latestRenewalId
LEFT JOIN BatchCreated btC ON pol.[id] = btC.[lifePolicyId]

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
AND pol.[activeDate] IS NOT NULL
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

const queryResponse = typeof DoQuery === 'undefined' ? null : DoQuery;
if (!queryResponse || !queryResponse.ok) {
    return buildResult(false, queryResponse && queryResponse.msg ? queryResponse.msg : 'No fue posible consultar las pólizas');
}

let dataPaginada = Array.isArray(queryResponse.outData) ? queryResponse.outData : [];


let queryCountSql = `
SELECT COUNT(1) AS total
FROM LifePolicy pol
LEFT JOIN (
    SELECT originalPolicyId, MAX(id) AS latestRenewalId
    FROM LifePolicy
    WHERE originalPolicyId IS NOT NULL
    GROUP BY originalPolicyId
) latestRenewal ON latestRenewal.originalPolicyId = pol.id
LEFT JOIN LifePolicy reno ON reno.id = latestRenewal.latestRenewalId

WHERE pol.[entityState] = 'ACTIVE'
AND pol.[active] = 1
AND pol.[activeDate] IS NOT NULL
${filtro}
`;


doCmd({
    cmd:'DoQuery',
    data: {
        sql: queryCountSql
    }
});
const countResponse = typeof DoQuery === 'undefined' ? null : DoQuery;
if (!countResponse || !countResponse.ok) {
    return buildResult(false, countResponse && countResponse.msg ? countResponse.msg : 'No fue posible contar las pólizas');
}

let totalDatos = Array.isArray(countResponse.outData) && countResponse.outData[0]
    ? Number(countResponse.outData[0].total || 0)
    : 0;

return {
    ok: true,
    total: totalDatos,
    data: dataPaginada
}

function sqlString(value){
    return `N'${String(value || '').replace(/'/g, "''")}'`;
}

function getPositiveInteger(value){
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : 0;
}

function getNonNegativeInteger(value){
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : 0;
}

function getTrimmedString(value){
    return value === null || value === undefined ? '' : String(value).trim();
}

function buildResult(ok, msg){
    return { ok: ok, msg: msg, total: 0, data: [] };
}
