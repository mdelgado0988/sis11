//block
//noreplace
/**
 * @author Jampier Solera (ref) / Adaptación Contactos
 * @description Consulta centralizada de contactos con filtros (Cédula/RUC, Nombre, COBIS, fechas de registro).
 * @version 1.0.0
 * @created 2026-02-09
 * @name cmdGetContacts
 * @param {number} [page=1] Página de resultados.
 * @param {number} [size=20] Tamaño de página.
 * @param {int} [id] Id
 * @param {string} [gender] Genero
 * @param {string} [name] Nombres.
 * @param {string} [surname1] Apellidos.
 * @param {string} [companyName] Nombre o Razón Social.
 * @param {string} [passport] Pasaporte
 * @param {string} [nationalId] Id de nacionalidad
 * @param {string} [cnp] CNP
 * @param {string} [nif] NIF
 * @param {int} [holdingId] Holder
 * @param {int} [status] Status
 * @param {array string} [roles] Roles
 * @param {string} [roleOr] Comodin or o and
 * @param {int} [isPerson] Tipo de persona
 * @param {string} [birth] Fecha de nacimiento
 */

const { page = 1, size = 20 } = context;

const filters = [];
const sqlText = value => String(value).replace(/'/g, "''");
const sqlInteger = value => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};
const partialSearchFields = [
  { key: 'name', label: 'Nombres' },
  { key: 'surname1', label: 'Apellidos' },
  { key: 'companyName', label: 'Nombre Empresa' }
];

for (const field of partialSearchFields) {
  if (!isNullOrEmpty(context[field.key]) && String(context[field.key]).trim().length < 2) {
    return { ok: false, msg: `${field.label} debe contener al menos 2 caracteres.`, total: 0, data: [] };
  }
}

// Filtro por Id contacto
if (!isNullOrEmpty(context.id)) {
  const contactId = sqlInteger(context.id);
  filters.push(contactId === null ? '1 = 0' : `con.id = ${contactId}`);
}

// Filtro por genero
if (!isNullOrEmpty(context.gender)) {
  filters.push(`con.gender = '${sqlText(context.gender)}'`);
}

// Búsquedas parciales de datos personales y razón social.
if (!isNullOrEmpty(context.name)) {
  filters.push(`ISNULL(con.[name], '') LIKE '%${sqlText(context.name)}%'`);
}

if (!isNullOrEmpty(context.surname1)) {
  filters.push(`ISNULL(con.surname1, '') LIKE '%${sqlText(context.surname1)}%'`);
}

if (!isNullOrEmpty(context.companyName)) {
  filters.push(`ISNULL(con.surname2, '') LIKE '%${sqlText(context.companyName)}%'`);
}

// Filtro por pasaporte
if (!isNullOrEmpty(context.passport)) {
  filters.push(`con.passport = '${sqlText(context.passport)}'`);
}

// Filtro por Id de nacionalidad
if (!isNullOrEmpty(context.nationalId)) {
  filters.push(`con.nationalId = '${sqlText(context.nationalId)}'`);
}

// Filtro por CNP
if (!isNullOrEmpty(context.cnp)) {
  filters.push(`con.cnp = '${sqlText(context.cnp)}'`);
}

// Filtro por NIF
if (!isNullOrEmpty(context.nif)) {
  filters.push(`con.nif = '${sqlText(context.nif)}'`);
}

// Filtro por holdingId
if (!isNullOrEmpty(context.holdingId)) {
  const holdingId = sqlInteger(context.holdingId);
  filters.push(holdingId === null ? '1 = 0' : `con.holdingId = ${holdingId}`);
}

// Filtro por status
if (!isNullOrEmpty(context.status)) {  
  filters.push(`con.inactive = ${String(context.status) === '1' ? 0 : 1}`);
}

// Filtro por roles, con comodines And y Or
if (Array.isArray(context.roles) && context.roles.length > 0) {
  const roles = context.roles.filter(role => !isNullOrEmpty(role)).map(sqlText);
  if (roles.length === 0) {
    filters.push('1 = 0');
  } else if (context.roleOr) {
    let sqlRolesOr=`SELECT contactId FROM ContactRole WHERE role IN ('${roles.join("','")}') GROUP BY contactId`;
    doCmd({ cmd: 'DoQuery', data: { sql: sqlRolesOr } });    
    if (!DoQuery.ok) return { ok: false, msg: DoQuery.msg, total: 0, data: [] };
    let contactOrIds = (DoQuery.outData || []).map(x=> x.contactId);    
    filters.push(contactOrIds.length > 0 ? `(con.id IN (${contactOrIds.join(",")}))` : '1 = 0');
  }else{
    let sqlRolesAnd=`SELECT contactId,COUNT(contactId) count FROM ContactRole WHERE role IN ('${roles.join("','")}') GROUP BY contactId having COUNT(contactId) = ${roles.length}`;
    doCmd({ cmd: 'DoQuery', data: { sql: sqlRolesAnd } });
    if (!DoQuery.ok) return { ok: false, msg: DoQuery.msg, total: 0, data: [] };
    let contactAndIds = (DoQuery.outData || []).map(x=> x.contactId);
    filters.push(contactAndIds.length > 0 ? `(con.id IN (${contactAndIds.join(",")}))` : '1 = 0');
  }
}

// Filtro por status
if (!isNullOrEmpty(context.isPerson)) {  
  const isPerson = sqlInteger(context.isPerson);
  filters.push(isPerson === 0 || isPerson === 1 ? `con.isPerson = ${isPerson}` : '1 = 0');
}

// Filtro por Tipo de persona
if (!isNullOrEmpty(context.birth)) {  
  filters.push(`con.birth = '${sqlText(context.birth)}'`);
}


const where = `
WHERE 1=1
${filters.length > 0 ? `AND ${filters.join(' AND ')}` : ''}
`;

const sql = `
SELECT
  COUNT(*) OVER() AS total,

  -- Columnas requeridas por la vista
  con.id                                     AS id,
  con.id                                     AS sisCode,
  ISNULL(con.nationalId,0)  AS cobisCode,

  -- Estado (ajusta según tu modelo: con.estado / con.entityState / con.isActive / con.isProspect)
  -- Aquí dejo un ejemplo simple basado en isActive si existe.
   CASE WHEN con.inactive = 1 THEN 'Inactivo' ELSE  'Activo' END AS status,
  CASE WHEN con.isPerson = 1 THEN 'Persona Natural' ELSE 'Persona Jurídica' END AS type,

  -- Cédula / RUC según tipo
  CASE WHEN con.isPerson = 1 THEN  ISNULL(con.cnp,0) ELSE  ISNULL(con.nif,0) END AS documentId,

  -- Nombre completo o razón social
  CASE
    WHEN con.isPerson = 1 THEN TRIM(CONCAT(
      ISNULL(con.[name],''),' ',
      ISNULL(con.[middlename],''),' ',
      ISNULL(con.[surname1],''),' ',
      ISNULL(con.[surname2],'')
    ))
    ELSE ISNULL(con.[surname2],'Sin Registrar')
  END                                        AS fullName,
  con.publicStatus   AS pep,
  addr.address                              AS address,
  ISNULL(con.phone,0)                       AS phone,
  con.created                              AS registrationDate
FROM Contact con
OUTER APPLY (
  SELECT TOP 1
    LTRIM(RTRIM(
      ISNULL(ca.address1, '') +
      CASE WHEN NULLIF(LTRIM(RTRIM(ca.address1)), '') IS NOT NULL
              AND NULLIF(LTRIM(RTRIM(ca.address2)), '') IS NOT NULL THEN ' ' ELSE '' END +
      ISNULL(ca.address2, '')
    )) AS address
  FROM ContactAddress ca
  WHERE ca.contactId = con.id
  ORDER BY ca.id
) addr
${where}
ORDER BY con.id DESC
OFFSET (${page} - 1) * ${size} ROWS
FETCH NEXT ${size} ROWS ONLY;
`;

doCmd({ cmd: 'DoQuery', data: { sql } });

return {
  ok: DoQuery.ok,
  msg: DoQuery.msg,
  total: DoQuery.ok && DoQuery.outData.length > 0 ? DoQuery.outData[0].total : 0,
  data: DoQuery.outData || []
};

function isNullOrEmpty(value) {
  return typeof value === 'undefined' ||
    value === null || !value ||
    String(value).trim() === '';
}
