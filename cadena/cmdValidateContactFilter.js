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

    const rewrite = rewriteLikeClauses(filter);
    filter = rewrite.filter;

    return {
        ok: true,
        msg: rewrite.changed ? 'Filtro sobreescrito' : 'Filtro sin cambios',
        filter,
        clauses: rewrite.clauses
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
