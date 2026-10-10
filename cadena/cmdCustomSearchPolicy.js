//block
//noreplace
/**
 * Name: cmdCustomSearchPolicy
 * Category: VIEW
 * Author: aiden_mission_configurator
 * Creation Date: 2026-10-09
 * Version: 1
 * Mission: MSN-000085 / AXX-3807
 *
 * Busqueda liviana de polizas para la vista 59 (SearchCustomPolicy). Solo lectura.
 * Reemplaza a RepoLifePolicy GET {include:[Holder,Process,Branch,Product,Insureds]} + GetContacts:
 * devuelve en UNA consulta la pagina pedida con solo las columnas que muestra la grilla.
 *
 * @param {string} context.filter  La misma condicion WHERE sobre LifePolicy que arma la vista con sus
 *                                 filtros actuales (General, Fechas, Otros, filtro rapido, seleccion guardada).
 *                                 Vacia = sin filtro. Se valida: solo lectura.
 * @param {number} context.size    Filas por pagina (1..500).
 * @param {number} context.page    Pagina BASE 0 (igual que RepoLifePolicy GET).
 * @param {string} context.policyStatus  OFFERED, CURRENT, CANCELLED o RENEWED.
 * @returns {{ok:boolean, msg:string, total:number, data:Array}} filas con la forma que la vista ya lee:
 *          id, code, lob, productCode, start, end, entityState, policyStatus, created, organizationId, branchCode,
 *          Branch{code,name}, Product{code,name}, Process{usuario}, Insureds[{id,contactId,role,name,Contact}].
 *          Orden: id descendente, igual que RepoLifePolicy GET.
 */
const cspIn = context || {};
const cspFilter = cspIn.filter === undefined || cspIn.filter === null ? '' : String(cspIn.filter).trim();
const cspSize = cspInt(cspIn.size, 20);
const cspPage = cspInt(cspIn.page, 0);
const cspStatus = cspIn.policyStatus === undefined || cspIn.policyStatus === null || cspIn.policyStatus === '' ? '' : String(cspIn.policyStatus).trim().toUpperCase();

if (!(cspSize >= 1 && cspSize <= 500)) return cspFail('Tamaño de página inválido (1 a 500)');
if (!(cspPage >= 0)) return cspFail('Página inválida');
if (cspStatus && ['OFFERED', 'CURRENT', 'CANCELLED', 'RENEWED'].indexOf(cspStatus) === -1) return cspFail('Estado de póliza inválido');
const cspInvalid = cspValidate(cspFilter);
if (cspInvalid) return cspFail('Filtro inválido: ' + cspInvalid);

const cspWhereParts = [];
if (cspFilter) cspWhereParts.push('(' + cspFilter + ')');
if (cspStatus) cspWhereParts.push("[policyStatus] = N'" + cspStatus + "'");
const cspWhere = cspWhereParts.length ? 'WHERE ' + cspWhereParts.join(' AND ') : '';
const cspSql = `
WITH policyState AS (
    SELECT lp.*,
        CASE
            WHEN lp.[activeDate] IS NULL THEN 'OFFERED'
            WHEN lastChange.[Discriminator] = 'CancellationChange' THEN 'CANCELLED'
            WHEN EXISTS (
                SELECT 1
                FROM [LifePolicy] renewed
                WHERE renewed.[originalPolicyId] = lp.[id]
                  AND renewed.[activeDate] IS NOT NULL
            ) THEN 'RENEWED'
            ELSE 'CURRENT'
        END AS [policyStatus]
    FROM [LifePolicy] lp
    OUTER APPLY (
        SELECT TOP 1 chLast.[Discriminator]
        FROM [Change] chLast
        WHERE chLast.[lifePolicyId] = lp.[id]
        ORDER BY COALESCE(chLast.[executionDate], chLast.[creationDate], '19000101') DESC, chLast.[id] DESC
    ) lastChange
),
pg AS (
    SELECT [id], [policyStatus], COUNT(*) OVER() AS totalRows
    FROM policyState
    ${cspWhere}
    ORDER BY [id] DESC
    OFFSET ${cspPage * cspSize} ROWS FETCH NEXT ${cspSize} ROWS ONLY
)
SELECT pg.totalRows,
    p.[id], p.[code], p.[lob], p.[productCode], p.[start], p.[end], p.[entityState], p.[created], pg.[policyStatus],
    p.[organizationId], p.[branchCode],
    b.[name] AS branchName, pr.[name] AS productName, pc.[usuario] AS processUser,
    i.[id] AS insId, i.[contactId] AS insContactId, i.[role] AS insRole, i.[name] AS insName,
    c.[id] AS cId, c.[name] AS cName, c.[surname1] AS cSurname1, c.[surname2] AS cSurname2,
    c.[isPerson] AS cIsPerson, c.[nif] AS cNif, c.[cnp] AS cCnp, c.[nationalId] AS cNationalId
FROM pg
JOIN [LifePolicy] p ON p.[id] = pg.[id]
LEFT JOIN [Branch] b ON b.[code] = p.[branchCode]
LEFT JOIN [Product] pr ON pr.[code] = p.[productCode]
LEFT JOIN [Proceso] pc ON pc.[id] = p.[processId]
OUTER APPLY (
    SELECT TOP 1 ins.[id], ins.[contactId], ins.[role], ins.[name]
    FROM [Insured] ins
    WHERE ins.[lifePolicyId] = p.[id]
    ORDER BY CASE WHEN ISNULL(ins.[role], 0) = 0 THEN 0 ELSE 1 END, ins.[id]
) i
LEFT JOIN [Contact] c ON c.[id] = i.[contactId]
ORDER BY p.[id] DESC`;

doCmd({ cmd: 'DoQuery', data: { sql: cspSql } });
const cspQ = typeof DoQuery === 'undefined' ? null : DoQuery;
if (!cspQ || !cspQ.ok) return cspFail(cspQ && cspQ.msg ? cspQ.msg : 'No fue posible consultar las pólizas');
const cspRows = Array.isArray(cspQ.outData) ? cspQ.outData : [];

let cspTotal = cspRows.length ? Number(cspRows[0].totalRows || 0) : 0;
if (!cspRows.length && cspPage > 0) {
    // Pagina fuera de rango: el total sale de un conteo aparte.
    const cspCountSql = `
WITH policyState AS (
    SELECT lp.*,
        CASE
            WHEN lp.[activeDate] IS NULL THEN 'OFFERED'
            WHEN lastChange.[Discriminator] = 'CancellationChange' THEN 'CANCELLED'
            WHEN EXISTS (
                SELECT 1 FROM [LifePolicy] renewed
                WHERE renewed.[originalPolicyId] = lp.[id]
                  AND renewed.[activeDate] IS NOT NULL
            ) THEN 'RENEWED'
            ELSE 'CURRENT'
        END AS [policyStatus]
    FROM [LifePolicy] lp
    OUTER APPLY (
        SELECT TOP 1 chLast.[Discriminator]
        FROM [Change] chLast
        WHERE chLast.[lifePolicyId] = lp.[id]
        ORDER BY COALESCE(chLast.[executionDate], chLast.[creationDate], '19000101') DESC, chLast.[id] DESC
    ) lastChange
)
SELECT COUNT(*) AS total FROM policyState ${cspWhere}`;
    doCmd({ cmd: 'DoQuery', data: { sql: cspCountSql } });
    const cspCq = typeof DoQuery === 'undefined' ? null : DoQuery;
    if (!cspCq || !cspCq.ok) return cspFail(cspCq && cspCq.msg ? cspCq.msg : 'No fue posible contar las pólizas');
    cspTotal = cspCq.outData && cspCq.outData[0] ? Number(cspCq.outData[0].total || 0) : 0;
}

const cspData = cspRows.map(function (r) {
    const insured = r.insId === null || r.insId === undefined ? null : {
        id: r.insId,
        contactId: r.insContactId,
        role: r.insRole,
        name: r.insName,
        Contact: r.cId === null || r.cId === undefined ? null : {
            id: r.cId, name: r.cName, surname1: r.cSurname1, surname2: r.cSurname2,
            isPerson: r.cIsPerson, nif: r.cNif, cnp: r.cCnp, nationalId: r.cNationalId
        }
    };
    return {
        id: r.id,
        code: r.code,
        lob: r.lob,
        productCode: r.productCode,
        start: r.start,
        end: r.end,
        entityState: r.entityState,
        policyStatus: r.policyStatus,
        created: r.created,
        organizationId: r.organizationId,
        branchCode: r.branchCode,
        Branch: r.branchCode ? { code: r.branchCode, name: r.branchName } : null,
        Product: r.productCode ? { code: r.productCode, name: r.productName } : null,
        Process: r.processUser === null || r.processUser === undefined ? null : { usuario: r.processUser },
        Insureds: insured ? [insured] : []
    };
});

return { ok: true, msg: cspData.length + "/" + cspTotal + " records", total: cspTotal, data: cspData };

// Solo lectura: fuera de los literales de texto no se aceptan instrucciones encadenadas,
// comentarios ni sentencias de escritura o de ejecucion.
function cspValidate(f) {
    if (!f) return '';
    if (f.length > 20000) return 'demasiado largo';
    const bare = f.replace(/N?'(?:[^']|'')*'/g, ' 0 ');
    if (bare.indexOf("'") !== -1) return 'comillas sin cerrar';
    if (/;|--|\/\*|\*\/|@/.test(bare)) return 'contiene ; -- /* */ o @';
    const m = bare.match(/\b(insert|update|delete|merge|drop|alter|create|truncate|exec|execute|declare|grant|revoke|deny|into|waitfor|shutdown|backup|restore|dbcc|openrowset|opendatasource|openquery|openxml|bulk|sp_\w*|xp_\w*)\b/i);
    if (m) return 'palabra no permitida «' + m[1] + '»';
    let depth = 0;
    for (let k = 0; k < bare.length; k++) {
        if (bare[k] === '(') depth++;
        else if (bare[k] === ')') { depth--; if (depth < 0) return 'paréntesis desbalanceados'; }
    }
    if (depth !== 0) return 'paréntesis desbalanceados';
    return '';
}

function cspInt(v, def) {
    if (v === undefined || v === null || v === '') return def;
    const n = Number(v);
    return Number.isInteger(n) ? n : NaN;
}

function cspFail(msg) {
    return { ok: false, msg: msg, total: 0, data: [] };
}
