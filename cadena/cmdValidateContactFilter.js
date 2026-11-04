//block
//noreplace
/**
 * @Author: Michael Delgado
 * @Email: michael.delgado@axxis.com
 * @Created: 2025-10-10
 * @Purpose: Normalize contact filters by matching LIKE values against identification patterns and building exact contact field predicates.
 * @Command: cmdValidateContactFilter
 */

let filter = String(context?.filtros?.filter ?? context?.filter ?? '').trim();

//doCmd({ cmd: 'GetPing', data: { filter } });

const regexEntries = [
    ['AV', /^\d{2}-AV-\d{4}-\d{5}$/],
    ['C', /^\d{2}-\d{4}-\d{5}$/],
    ['CI', /^\d{9}$/],
    ['CO', /^\d{5}$/],
    ['E', /^E -\d{4}-\d{5}$/],
    ['E1', /^E -\d{4}-\d{6}$/],
    ['N', /^N -\d{4}-\d{5}$/],
    ['P', /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{1,13}$/],
    ['PE', /^PE-\d{4}-\d{5}$/],
    ['PI', /^\d{2}-PI-\d{4}-\d{5}$/],
    ['R', /^\d{7}-\d{4}-\d{6}$/],
    ['R2', /^\d{9}-\d-\d{4}$/],
    ['R3', /^\d{9}-\d-\d{4}$/],
    ['RN', /^\d{7}-\d{7}$/],
    ['RU', /^\d{6}-\d{6}-\d{4}$/],
    ['SC', /^\d{11}$/],
    ['SE', /^[A-Za-z0-9]{1,13}$/],
    ['SP', /^\d{11}$/],
    ['NT', /^\d{2}-NT-\d{5}-\d{8}$/]
];

const codeFieldMap = {
    AV: ['cnp'],
    C: ['cnp'],
    CI: ['cnp'],
    CO: ['nif'],
    E: ['cnp'],
    E1: ['cnp'],
    N: ['cnp'],
    P: ['cnp'],
    PE: ['cnp'],
    PI: ['cnp'],
    R: ['nif'],
    R2: ['nif'],
    R3: ['nif'],
    RN: ['nif'],
    RU: ['nif'],
    SC: ['nif'],
    SE: ['nif'],
    SP: ['cnp'],
    NT: ['nif']
};

try {
    if (!filter) {
        return { ok: true, msg: 'Nada que filtrar', filter };
    }

    const filtroOriginal = filter;
    const rewrite = rewriteLikeClauses(filter);
    filter = rewrite.filter;

    // AXX-7406 / ExeControl #11465: numero SIS (id del contacto) y cedula (cnp) en los buscadores de contactos
    const sis = addSisIdLookup(filtroOriginal, filter, context?.filtros);
    filter = sis.filter;
    const cedula = addCnpLookup(filtroOriginal, filter);
    filter = cedula.filter;

    return {
        ok: true,
        msg: (rewrite.changed || sis.changed || cedula.changed) ? 'Filtro sobreescrito' : 'Filtro sin cambios',
        filter,
        clauses: rewrite.clauses,
        sisId: sis.sisId,
        cnpValues: cedula.values
    };
} catch (error) {
    return { ok: false, msg: error.toString(), filter };
}

function rewriteLikeClauses(filtro) {
    const text = String(filtro || '');
    const clauses = [];
    let changed = false;
    const likeRegex = /like\s+N?\s*'((?:''|[^'])*)'/ig;
    const replacements = [];
    let match;

    while ((match = likeRegex.exec(text)) !== null) {
        const likeMatch = match[0];
        const rawValue = match[1];
        const likeValue = unescapeSqlLiteral(String(rawValue || '').replace(/^%+|%+$/g, '').trim());
        const matchedCodes = getMatchedCodes(likeValue);
        const clauseStart = findClauseStart(text, match.index);
        const clauseText = text.slice(clauseStart, match.index + likeMatch.length);
        const clauseInfo = {
            likeValue,
            matchedCodes,
            identifierFields: []
        };

        if (!canRewriteUsurpation(clauseText)) {
            clauses.push(clauseInfo);
            continue;
        }

        if (!matchedCodes.length) {
            if (containsIdentificationField(clauseText)) {
                clauses.push(clauseInfo);
                continue;
            }

            const identifierFields = ['cnp', 'nif'];
            const identifierFilter = buildIdentifierFilter(likeValue, identifierFields);
            clauseInfo.identifierFields = identifierFields;
            clauseInfo.identifierFilter = identifierFilter;
            clauses.push(clauseInfo);
            changed = true;
            replacements.push({
                start: clauseStart,
                end: match.index + likeMatch.length,
                value: `(${clauseText} OR ${identifierFilter})`
            });
            continue;
        }

        const identifierFields = getIdentifierFields(matchedCodes);
        const identifierFilter = buildIdentifierFilter(likeValue, identifierFields);
        clauseInfo.identifierFields = identifierFields;
        clauseInfo.identifierFilter = identifierFilter;
        clauses.push(clauseInfo);
        changed = true;
        replacements.push({
            start: clauseStart,
            end: match.index + likeMatch.length,
            value: `(${clauseText} OR ${identifierFilter})`
        });
    }

    const rewritten = applyReplacements(text, replacements);

    return {
        filter: changed ? rewritten : text,
        changed,
        clauses
    };
}

function canRewriteUsurpation(clauseText) {
    const text = normalizeFilterText(clauseText);
    const cnpLikePattern = /(?:^|\(|\s)cnp\s+like\s+N?\s*'((?:''|[^'])*)'/i;
    const fullNamePattern = /\(?\s*RTRIM\s*\(\s*ISNULL\s*\(\s*\[name\]\s*,\s*''\s*\)\s*\)\s*\+\s*' '\s*\+\s*RTRIM\s*\(\s*ISNULL\s*\(\s*surname1\s*,\s*''\s*\)\s*\)\s*\+\s*' '\s*\+\s*RTRIM\s*\(\s*ISNULL\s*\(\s*surname2\s*,\s*''\s*\)\s*\)\s*\)?\s*like\s+N?\s*'((?:''|[^'])*)'/i;

    return cnpLikePattern.test(text) || fullNamePattern.test(text);
}

function normalizeFilterText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function findClauseStart(text, likeIndex) {
    const source = String(text || '');
    const lower = source.toLowerCase();
    let depth = 0;
    let inString = false;
    let lastLogicalEnd = 0;

    for (let i = 0; i < likeIndex; i++) {
        const char = source[i];

        if (char === "'") {
            if (inString && source[i + 1] === "'") {
                i += 1;
                continue;
            }

            inString = !inString;
            continue;
        }

        if (inString) {
            continue;
        }

        if (char === "(") {
            depth += 1;
            continue;
        }

        if (char === ")") {
            depth = Math.max(0, depth - 1);
            continue;
        }

        if (depth === 0) {
            if (isLogicalOperatorAt(lower, i, "and")) {
                lastLogicalEnd = i + 3;
                i += 2;
                continue;
            }

            if (isLogicalOperatorAt(lower, i, "or")) {
                lastLogicalEnd = i + 2;
                i += 1;
                continue;
            }
        }
    }

    let start = lastLogicalEnd;
    while (start < likeIndex && /\s/.test(source[start])) {
        start += 1;
    }

    return start;
}

function isLogicalOperatorAt(text, index, operator) {
    const before = index === 0 ? " " : text[index - 1];
    const after = text[index + operator.length] || " ";

    return text.slice(index, index + operator.length) === operator
        && /\s|\(/.test(before)
        && /\s|\(/.test(after);
}

function applyReplacements(text, replacements) {
    if (!Array.isArray(replacements) || replacements.length === 0) {
        return text;
    }

    const ordered = replacements.sort((a, b) => b.start - a.start);
    let result = String(text || '');

    for (const item of ordered) {
        result = result.slice(0, item.start) + item.value + result.slice(item.end);
    }

    return result;
}

function getMatchedCodes(value) {
    const text = String(value || '').trim();
    if (!text) {
        return [];
    }

    const matches = [];

    for (const [code, regex] of regexEntries) {
        if (regex.test(text)) {
            matches.push(code);
        }
    }

    return Array.from(new Set(matches));
}

function getIdentifierFields(codes) {
    const fields = (codes || []).flatMap(code => codeFieldMap[code] || []);
    const uniqueFields = Array.from(new Set(fields));

    if (uniqueFields.length) {
        return uniqueFields;
    }

    return ['cnp', 'nif'];
}

function buildIdentifierFilter(value, fields) {
    const safeValue = escapeSql(value);
    const fieldList = Array.isArray(fields) ? fields : [fields];
    const predicates = fieldList
        .map(field => String(field || '').trim().toLowerCase())
        .filter(Boolean)
        .map(field => `${field} = '${safeValue}'`);

    return `(${predicates.join(' OR ')})`;
}

function containsIdentificationField(filtro) {
    return /\b(cnp|nif)\b/i.test(String(filtro || ''));
}

function escapeSql(value) {
    return String(value ?? '').replace(/'/g, "''");
}

function unescapeSqlLiteral(value) {
    return String(value ?? '').replace(/''/g, "'");
}

/**
 * AXX-7406 / ExeControl #11465 - Busqueda de clientes por numero SIS (id del contacto).
 * Los buscadores de Contratante, Asegurado y Pagador mandan un numero como cnp LIKE N'%<n>%'.
 * Se agrega la coincidencia exacta id = <n>, sin quitar la busqueda por cedula ni la de RUC.
 * En la lista desplegable (size <= 10, primera pagina) el contacto del id va siempre dentro de la pagina:
 * id = <n> mas los primeros size-1 del resto. Un numero que empieza con 0 es un trozo de cedula, no un id.
 */
function addSisIdLookup(original, filtro, datos) {
    const text = String(filtro || '');
    const exact = /^\(?\s*cnp\s+LIKE\s+N?'%([1-9]\d{0,8})%'\s*\)?$/i.exec(String(original || '').trim());

    if (!exact) {
        return { changed: false, sisId: null, filter: text };
    }

    const sisId = parseInt(exact[1], 10);
    const size = Number(datos?.size || 0);
    const page = Number(datos?.page || 0);

    if (size > 0 && size <= 10 && page === 0) {
        return {
            changed: true,
            sisId,
            filter: `(id = ${sisId} OR id IN (SELECT TOP ${size - 1} cx.id FROM Contact cx WHERE (${text}) AND cx.id <> ${sisId} ORDER BY cx.id))`
        };
    }

    return { changed: true, sisId, filter: `(${text} OR id = ${sisId})` };
}

/**
 * AXX-7406 / ExeControl #11465 - Busqueda por cedula (cnp) desde el cuadro de nombre.
 * Si el texto buscado por nombre tiene algun digito, se busca tambien en cnp, completo o en parte.
 * La cedula panamena escrita sin ceros o sin espacio (8-888-1234, E-8-123, PE-3-45, 8-AV-1-2)
 * se compara ademas con la forma en que se guarda (08-0888-01234, E -0008-00123, PE-0003-00045, 08-AV-0001-00002).
 */
function addCnpLookup(original, filtro) {
    const text = String(filtro || '');
    const nameSearch = /^\(?\s*\((?:\s*RTRIM\s*\(\s*ISNULL\s*\(\s*\[?(?:name|middleName|surname1|surname2)\]?\s*,\s*''\s*\)\s*\)\s*(?:\+\s*' '\s*\+)?)+\)\s*like\s+N?'%((?:''|[^'])*)%'\s*\)?$/i.exec(String(original || '').trim());

    if (!nameSearch) {
        return { changed: false, values: [], filter: text };
    }

    const value = unescapeSqlLiteral(nameSearch[1]).trim();

    if (!/\d/.test(value)) {
        return { changed: false, values: [], filter: text };
    }

    const forms = cedulaForms(value).filter(form => form !== value);
    const predicates = [`cnp LIKE N'%${escapeSql(value)}%'`].concat(forms.map(form => `cnp = N'${escapeSql(form)}'`));

    return { changed: true, values: [value].concat(forms), filter: `(${text} OR ${predicates.join(' OR ')})` };
}

function cedulaForms(value) {
    const text = String(value || '').toUpperCase().replace(/\s+/g, '');
    const pad = (digits, size) => String(digits).padStart(size, '0');
    let match = /^(\d{1,2})-(\d{1,4})-(\d{1,5})$/.exec(text);

    if (match) {
        return [`${pad(match[1], 2)}-${pad(match[2], 4)}-${pad(match[3], 5)}`];
    }

    match = /^(\d{1,2})-?(AV|PI)-(\d{1,4})-(\d{1,5})$/.exec(text);
    if (match) {
        return [`${pad(match[1], 2)}-${match[2]}-${pad(match[3], 4)}-${pad(match[4], 5)}`];
    }

    match = /^(E|N)-(\d{1,4})-(\d{1,6})$/.exec(text);
    if (match) {
        const forms = [`${match[1]} -${pad(match[2], 4)}-${pad(match[3], 6)}`];
        if (match[3].length <= 5) {
            forms.unshift(`${match[1]} -${pad(match[2], 4)}-${pad(match[3], 5)}`);
        }
        return forms;
    }

    match = /^PE-(\d{1,4})-(\d{1,5})$/.exec(text);
    if (match) {
        return [`PE-${pad(match[1], 4)}-${pad(match[2], 5)}`];
    }

    return [];
}
