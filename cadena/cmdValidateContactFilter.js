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
    ['P', /^[A-Za-z0-9]{1,13}$/],
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
    C: ['nif'],
    CI: ['cnp'],
    CO: ['nif'],
    E: ['cnp'],
    E1: ['cnp'],
    N: ['cnp'],
    P: ['passport', 'cnp'],
    PE: ['cnp'],
    PI: ['cnp'],
    R: ['nif'],
    R2: ['nif'],
    R3: ['nif'],
    RN: ['nif'],
    RU: ['nif'],
    SC: ['nif'],
    SE: ['passport'],
    SP: ['cnp'],
    NT: ['nif']
};

try {
    if (!filter) {
        return { ok: true, msg: 'Nada que filtrar', filter };
    }

    const likeValue = extractLikeValue(filter);
    const matchedCodes = getMatchedCodes(likeValue);

    if (!matchedCodes.length) {
        if (containsIdentificationField(filter)) {
            return {
                ok: true,
                msg: 'Filtro sin cambios',
                filter,
                likeValue,
                matchedCodes
            };
        }

        const fallbackFilter = buildIdentifierFilter(likeValue, ['cnp', 'nif']);
        filter = `(${filter}) OR (${fallbackFilter})`;

        return {
            ok: true,
            msg: 'Filtro sobreescrito',
            filter,
            likeValue,
            matchedCodes,
            identifierFields: ['cnp', 'nif'],
            identifierFilter: fallbackFilter
        };
    }

    const identifierFields = getIdentifierFields(matchedCodes);
    const identifierFilter = buildIdentifierFilter(likeValue, identifierFields);
    filter = `(${filter}) OR (${identifierFilter})`;

    return {
        ok: true,
        msg: 'Filtro sobreescrito',
        filter,
        likeValue,
        matchedCodes,
        identifierFields,
        identifierFilter
    };
} catch (error) {
    return { ok: false, msg: error.toString(), filter };
}

function extractLikeValue(filtro) {
    const text = String(filtro || '').replace(/\s+/g, ' ');
    const match = text.match(/like\s+N?\s*'([^']+)'/i);

    if (!match || !match[1]) {
        return '';
    }

    return String(match[1]).replace(/^%+|%+$/g, '').trim();
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

    return ['cnp', 'nif', 'passport'];
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
    return /\b(cnp|nif|passport)\b/i.test(String(filtro || ''));
}

function escapeSql(value) {
    return String(value ?? '').replace(/'/g, "''");
}
