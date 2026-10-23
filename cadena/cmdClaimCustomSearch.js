//block
//noreplace
/**
 * @name cmdClaimCustomSearch
 * @category VIEW
 * @description Búsqueda liviana y paginada de reclamos para BusquedaDeReclamos.
 * Reemplaza RepoClaim GET con include de relaciones, devolviendo únicamente los
 * campos utilizados por la grilla y la exportación.
 *
 * @param {string} context.filter Condición WHERE sobre Claim. Debe ser de solo lectura.
 * @param {object} context.affectedObjectFilters Criterios estructurados de objetos afectados.
 * @param {number} context.page Página base 0.
 * @param {number} context.size Registros por página, entre 1 y 500.
 * @param {string} context.orderBy Campo permitido de ordenamiento de la vista.
 * @param {string} context.orderDir ASC o DESC.
 * @returns {{ok:boolean,msg:string,total:number,data:Array}}
 */
const ccsInput = context || {};
const ccsFilter = ccsInput.filter === undefined || ccsInput.filter === null ? '' : String(ccsInput.filter).trim();
const ccsPage = ccsInteger(ccsInput.page, 0);
const ccsSize = ccsInteger(ccsInput.size, 25);
const ccsOrderBy = ccsInput.orderBy === undefined || ccsInput.orderBy === null ? 'id' : String(ccsInput.orderBy).trim();
const ccsOrderDir = String(ccsInput.orderDir || 'DESC').trim().toUpperCase();

if (!(ccsPage >= 0)) return ccsFail('Página inválida');
if (!(ccsSize >= 1 && ccsSize <= 500)) return ccsFail('Tamaño de página inválido (1 a 500)');
if (ccsOrderDir !== 'ASC' && ccsOrderDir !== 'DESC') return ccsFail('Dirección de ordenamiento inválida');

const ccsInvalidFilter = ccsValidateFilter(ccsFilter);
if (ccsInvalidFilter) return ccsFail('Filtro inválido: ' + ccsInvalidFilter);

let ccsAffectedObjectFilter;
try {
  ccsAffectedObjectFilter = ccsBuildAffectedObjectFilter(ccsInput.affectedObjectFilters);
} catch (ccsAffectedObjectError) {
  return ccsFail('Filtro de objeto afectado inválido: ' + ccsAffectedObjectError.message);
}

const ccsOrderFields = {
  id: 'cl.[id]',
  code: 'cl.[code]',
  notification: 'cl.[notification]',
  'Claimer.name': 'claimer.[name]',
  'Contact.name': 'insured.[name]',
  'Policy.code': 'lp.[code]',
  claimType: 'cl.[claimType]',
  'Policy.insuredSum': 'lp.[insuredSum]',
  'Policy.lob': 'lp.[lob]',
  'Policy.productCode': 'lp.[productCode]',
  'Policy.Product.name': 'product.[name]',
  'Stage.name': 'st.[name]'
};
const ccsOrderSql = ccsOrderFields[ccsOrderBy];
if (!ccsOrderSql) return ccsFail('Campo de ordenamiento no permitido');

const ccsWhereParts = [];
if (ccsFilter) ccsWhereParts.push('(' + ccsFilter + ')');
if (ccsAffectedObjectFilter) ccsWhereParts.push('(' + ccsAffectedObjectFilter + ')');
const ccsWhere = ccsWhereParts.length ? 'WHERE ' + ccsWhereParts.join(' AND ') : '';
const ccsOffset = ccsPage * ccsSize;
const ccsSql = `
WITH filtered AS (
    SELECT cl.[id], COUNT_BIG(1) OVER() AS totalRows
    FROM [Claim] cl
    ${ccsWhere}
),
matched AS (
    SELECT filtered.[id], filtered.totalRows,
        ROW_NUMBER() OVER (ORDER BY ${ccsOrderSql} ${ccsOrderDir}, cl.[id] DESC) AS rowNumber
    FROM filtered
    INNER JOIN [Claim] cl ON cl.[id] = filtered.[id]
    LEFT JOIN [Contact] claimer ON claimer.[id] = cl.[claimerId]
    LEFT JOIN [Contact] insured ON insured.[id] = cl.[contactId]
    LEFT JOIN [LifePolicy] lp ON lp.[id] = cl.[lifePolicyId]
    LEFT JOIN [Product] product ON product.[code] = lp.[productCode]
    LEFT JOIN [ClaimStage] st ON st.[code] = cl.[stageCode]
)
SELECT matched.totalRows,
    cl.[id], cl.[code], cl.[notification], cl.[created], cl.[occurrence], cl.[claimType],
    cl.[claimerId], cl.[contactId], cl.[lifePolicyId], cl.[processId], cl.[stageCode], cl.[externalId],
    claimer.[name] AS claimerName, claimer.[middlename] AS claimerMiddlename,
    claimer.[surname1] AS claimerSurname1, claimer.[surname2] AS claimerSurname2,
    insured.[name] AS insuredName, insured.[middlename] AS insuredMiddlename,
    insured.[surname1] AS insuredSurname1, insured.[surname2] AS insuredSurname2,
    lp.[code] AS policyCode, lp.[lob] AS policyLob, lp.[productCode] AS policyProductCode,
    product.[name] AS policyProductName,
    lp.[insuredSum] AS policyInsuredSum,
    st.[code] AS stageCodeValue, st.[name] AS stageName
FROM matched
INNER JOIN [Claim] cl ON cl.[id] = matched.[id]
LEFT JOIN [Contact] claimer ON claimer.[id] = cl.[claimerId]
LEFT JOIN [Contact] insured ON insured.[id] = cl.[contactId]
LEFT JOIN [LifePolicy] lp ON lp.[id] = cl.[lifePolicyId]
LEFT JOIN [Product] product ON product.[code] = lp.[productCode]
LEFT JOIN [ClaimStage] st ON st.[code] = cl.[stageCode]
WHERE matched.rowNumber > ${ccsOffset}
  AND matched.rowNumber <= ${ccsOffset + ccsSize}
ORDER BY matched.rowNumber`;

doCmd({ cmd: 'DoQuery', data: { sql: ccsSql } });
const ccsQuery = typeof DoQuery === 'undefined' ? null : DoQuery;
if (!ccsQuery || !ccsQuery.ok) return ccsFail(ccsQuery && ccsQuery.msg ? ccsQuery.msg : 'No fue posible consultar los reclamos');
const ccsRows = Array.isArray(ccsQuery.outData) ? ccsQuery.outData : [];

let ccsTotal = ccsRows.length ? Number(ccsRows[0].totalRows || 0) : 0;
if (!ccsRows.length && ccsPage > 0) {
  doCmd({ cmd: 'DoQuery', data: { sql: 'SELECT COUNT_BIG(1) AS total FROM [Claim] cl ' + ccsWhere } });
  const ccsCount = typeof DoQuery === 'undefined' ? null : DoQuery;
  if (!ccsCount || !ccsCount.ok) return ccsFail(ccsCount && ccsCount.msg ? ccsCount.msg : 'No fue posible contar los reclamos');
  ccsTotal = ccsCount.outData && ccsCount.outData[0] ? Number(ccsCount.outData[0].total || 0) : 0;
}

const ccsData = ccsRows.map(function (row) {
  const claimer = row.claimerId === null || row.claimerId === undefined ? null : {
    id: row.claimerId,
    name: row.claimerName,
    middlename: row.claimerMiddlename,
    surname1: row.claimerSurname1,
    surname2: row.claimerSurname2
  };
  const insured = row.contactId === null || row.contactId === undefined ? null : {
    id: row.contactId,
    name: row.insuredName,
    middlename: row.insuredMiddlename,
    surname1: row.insuredSurname1,
    surname2: row.insuredSurname2
  };
  const policy = row.lifePolicyId === null || row.lifePolicyId === undefined ? null : {
    id: row.lifePolicyId,
    code: row.policyCode,
    lob: row.policyLob,
    productCode: row.policyProductCode,
    Product: row.policyProductCode ? { code: row.policyProductCode, name: row.policyProductName } : null,
    insuredSum: row.policyInsuredSum
  };
  const stage = row.stageCodeValue === null || row.stageCodeValue === undefined ? null : {
    code: row.stageCodeValue,
    name: row.stageName
  };
  return {
    id: row.id,
    code: row.code,
    notification: row.notification,
    created: row.created,
    occurrence: row.occurrence,
    claimType: row.claimType,
    claimerId: row.claimerId,
    contactId: row.contactId,
    lifePolicyId: row.lifePolicyId,
    processId: row.processId,
    stageCode: row.stageCode,
    externalId: row.externalId,
    Claimer: claimer,
    Contact: insured,
    Policy: policy,
    Stage: stage
  };
});

return { ok: true, msg: ccsData.length + '/' + ccsTotal + ' records', total: ccsTotal, data: ccsData };

function ccsInteger(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function ccsBuildAffectedObjectFilter(input) {
  const filters = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const criteria = [];
  const prefilters = [];
  const addText = function (fields, value) {
    const text = ccsAffectedObjectText(value);
    if (!text) return;
    const escapedText = ccsEscapeLike(text);
    prefilters.push("cl.[jCustomForms] LIKE N'%" + escapedText + "%'");
    criteria.push({
      fields: fields,
      comparison: "affectedValue.[value] LIKE N'%" + escapedText + "%'"
    });
  };

  addText(['asegCedula', 'colCedula', 'ownerIdNumber', 'benCedula', 'incCedula'], filters.identification);
  addText(['tbplaca'], filters.licensePlate);
  addText(['tbVIN'], filters.vin);
  addText(['colNoSis'], filters.sisNumber);
  addText(['colNoCobis'], filters.cobisNumber);

  const notificationDate = ccsAffectedObjectDate(filters.notificationDate);
  if (notificationDate) criteria.push({
    fields: ['colFechaNotificacion'],
    comparison: "affectedValue.[value] = N'" + notificationDate + "'"
  });
  if (notificationDate) prefilters.push("cl.[jCustomForms] LIKE N'%" + notificationDate + "%'");
  if (!criteria.length) return '';

  const fieldExists = function (fields, comparison) {
    return `EXISTS (
      SELECT 1
      FROM OPENJSON(COALESCE(JSON_QUERY(affectedObject.[value], '$.fields'), N'[]')) affectedField
      CROSS APPLY OPENJSON(COALESCE(JSON_QUERY(affectedField.[value], '$.userData'), N'[]')) affectedValue
      WHERE JSON_VALUE(affectedField.[value], '$.name') IN (${fields.map(function (field) { return "N'" + field + "'"; }).join(', ')})
        AND ${comparison}
    )`;
  };

  return `${prefilters.join('\n    AND ')}
    AND cl.[jCustomForms] LIKE N'%"ObjetosAfectados"%'
    AND EXISTS (
      SELECT 1
      FROM OPENJSON(CASE WHEN ISJSON(cl.[jCustomForms]) = 1 THEN cl.[jCustomForms] ELSE N'{}' END) customSection
      CROSS APPLY OPENJSON(CASE WHEN ISJSON(customSection.[value]) = 1 THEN customSection.[value] ELSE N'[]' END) affectedObject
      WHERE customSection.[key] = N'ObjetosAfectados'
        AND ${criteria.map(function (criterion) { return fieldExists(criterion.fields, criterion.comparison); }).join('\n        AND ')}
    )`;
}

function ccsAffectedObjectText(value) {
  if (value === undefined || value === null) return '';
  const text = String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length > 200) throw new Error('texto demasiado largo');
  return text;
}

function ccsAffectedObjectDate(value) {
  const text = ccsAffectedObjectText(value);
  if (!text) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('fecha inválida');
  return text;
}

function ccsEscapeLike(value) {
  return String(value)
    .replace(/'/g, "''")
    .replace(/\[/g, '[[]')
    .replace(/\]/g, '[]]')
    .replace(/%/g, '[%]')
    .replace(/_/g, '[_]');
}

function ccsValidateFilter(filter) {
  if (!filter) return '';
  if (filter.length > 20000) return 'demasiado largo';
  const bare = filter.replace(/N?'(?:[^']|'')*'/g, ' 0 ');
  if (bare.indexOf("'") !== -1) return 'comillas sin cerrar';
  if (/;|--|\/\*|\*\/|@/.test(bare)) return 'contiene ; -- /* */ o @';
  const blocked = bare.match(/\b(insert|update|delete|merge|drop|alter|create|truncate|exec|execute|declare|grant|revoke|deny|into|waitfor|shutdown|backup|restore|dbcc|openrowset|opendatasource|openquery|openxml|bulk|sp_\w*|xp_\w*)\b/i);
  if (blocked) return 'palabra no permitida «' + blocked[1] + '»';
  let depth = 0;
  for (let index = 0; index < bare.length; index += 1) {
    if (bare[index] === '(') depth += 1;
    else if (bare[index] === ')') {
      depth -= 1;
      if (depth < 0) return 'paréntesis desbalanceados';
    }
  }
  return depth === 0 ? '' : 'paréntesis desbalanceados';
}

function ccsFail(message) {
  return { ok: false, msg: message, total: 0, data: [] };
}
