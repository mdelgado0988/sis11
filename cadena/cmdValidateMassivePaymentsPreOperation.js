//block
//noreplace
/*
Name: cmdValidateMassivePaymentsPreOperation
Description: Validates every remittance row before massive payment processing starts in database-friendly batches.
Category: MASIVO
Version: 1
*/

const VALIDATION_BATCH_SIZE = 500;
const input = context && typeof context === 'object' ? context : {};
const rows = resolveRows(input);
const errors = [];

if (!rows.length) {
    throw '@La remesa no contiene filas para validar.';
}

if (!input.skipDuplicateValidation) validateDuplicates(rows, errors);
if (!input.skipPremiumIncomeTypeValidation) validatePremiumIncomeType(errors);

const cashDeskCache = {};

// Keep duplicate detection global, but isolate database-backed row validation
// in bounded batches to avoid processing a large remittance in one block.
for (let batchStart = 0; batchStart < rows.length; batchStart += VALIDATION_BATCH_SIZE) {
    const batch = rows.slice(batchStart, batchStart + VALIDATION_BATCH_SIZE);
    batch.forEach(function (row, batchIndex) {
        validateRow(row, batchStart + batchIndex + 1, errors, cashDeskCache);
    });
}

if (errors.length) {
    throw '@PRE OPERATION rechazada. No se realizó ningún cobro. ' + errors.join(' | ');
}

return {
    ok: true,
    outData: rows,
    outDataAux: [],
    msg: 'PRE OPERATION finalizada: ' + rows.length + ' filas válidas.'
};

function resolveRows(source) {
    let sourceRows = [];

    if (Array.isArray(source.rows)) sourceRows = source.rows;
    else if (Array.isArray(source.data)) sourceRows = source.data;
    else if (Array.isArray(source.jData)) sourceRows = source.jData;
    else if (source.batch && source.batch.jData) sourceRows = parseJsonRows(source.batch.jData);

    if (!sourceRows.length && source.batchId) {
        doCmd({
            cmd: 'RepoBatch',
            data: {
                operation: 'GET',
                filter: 'id = ' + Number(source.batchId),
                noTracking: true
            }
        });

        const batchSource = typeof RepoBatch !== 'undefined' && RepoBatch
            ? RepoBatch.outData
            : null;
        const batches = Array.isArray(batchSource)
            ? batchSource
            : (batchSource && Array.isArray(batchSource.data)
                ? batchSource.data
                : (batchSource ? [batchSource] : []));
        const batch = batches.length ? batches[0] : null;
        if (batch) sourceRows = parseJsonRows(batch.jData);
    }

    // A PRE OPERATION may also receive the current row. Use it only when the
    // complete batch is unavailable; duplicate validation requires all rows.
    if (!sourceRows.length && source.row) sourceRows = [source.row];

    if (typeof sourceRows === 'string') sourceRows = parseJsonRows(sourceRows);

    return (Array.isArray(sourceRows) ? sourceRows : []).map(function (row) {
        if (!Array.isArray(row)) return row || {};
        return {
            workspaceId: row[0],
            policyCode: row[1],
            holderId: row[2],
            numRecibo: row[3],
            monto: row[4]
        };
    });
}

function parseJsonRows(value) {
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function validateDuplicates(rowsToValidate, validationErrors) {
    const policyReceipts = {};

    rowsToValidate.forEach(function (row, index) {
        const rowNumber = index + 1;
        const policyCode = normalize(row && row.policyCode).toUpperCase();
        const receiptNumber = normalize(row && row.numRecibo).toUpperCase();

        if (policyCode && receiptNumber) {
            const policyReceiptKey = policyCode + '|' + receiptNumber;
            if (policyReceipts[policyReceiptKey]) {
                validationErrors.push('Fila ' + rowNumber + ': recibo duplicado ' + receiptNumber
                    + ' para la póliza ' + policyCode
                    + ' (también aparece en la fila ' + policyReceipts[policyReceiptKey] + ').');
            } else policyReceipts[policyReceiptKey] = rowNumber;
        }
    });
}

function validatePremiumIncomeType(validationErrors) {
    doCmd({
        cmd: 'RepoIncomeTypeCatalog',
        data: {
            operation: 'GET',
            filter: "internalType = 'PREMIUM'"
        }
    });

    const result = typeof RepoIncomeTypeCatalog !== 'undefined' ? RepoIncomeTypeCatalog : null;
    const incomeTypes = result && Array.isArray(result.outData) ? result.outData : [];
    const premiumType = incomeTypes.find(function (item) {
        return item
            && normalize(item.internalType).toUpperCase() === 'PREMIUM'
            && normalize(item.code) !== '';
    });

    if (!result || result.ok === false || !premiumType) {
        validationErrors.push('Configuración: no existe un tipo de ingreso válido para PREMIUM.');
    }
}

function validateRow(row, rowNumber, validationErrors, cashDeskCache) {
    const prefix = 'Fila ' + rowNumber + ': ';
    const workspaceId = Number(row && row.workspaceId);
    const policyCode = normalize(row && row.policyCode);
    const holderId = Number(row && row.holderId);
    const receiptNumber = normalize(row && row.numRecibo);
    const amount = Number(row && row.monto);

    if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
        validationErrors.push(prefix + 'ID_Caja es obligatorio y debe ser válido.');
    }
    if (!policyCode) validationErrors.push(prefix + 'Codigo_Poliza es obligatorio.');
    if (!Number.isInteger(holderId) || holderId <= 0) {
        validationErrors.push(prefix + 'ID_Cliente es obligatorio y debe ser válido.');
    }
    if (!receiptNumber) validationErrors.push(prefix + 'Numero_Recibo es obligatorio.');
    if (!Number.isFinite(amount) || amount <= 0) {
        validationErrors.push(prefix + 'Monto_Pago debe ser mayor que cero.');
    }

    if (!Number.isInteger(workspaceId) || workspaceId <= 0
        || !policyCode || !Number.isInteger(holderId) || holderId <= 0
        || !receiptNumber || !Number.isFinite(amount) || amount <= 0) return;

    validateCashDesk(workspaceId, prefix, validationErrors, cashDeskCache);

    const reference = findPolicyByReceipt(receiptNumber, policyCode);
    if (!reference) {
        validationErrors.push(prefix + 'no se encontró el recibo o la póliza indicada.');
        return;
    }

    doCmd({
        cmd: 'RepoLifePolicy',
        data: {
            operation: 'GET',
            filter: '[id] = ' + Number(reference.lifePolicyId),
            noTracking: true
        }
    });

    const policies = RepoLifePolicy && Array.isArray(RepoLifePolicy.outData)
        ? RepoLifePolicy.outData
        : [];
    const policy = policies.length ? policies[policies.length - 1] : null;

    if (!policy) {
        validationErrors.push(prefix + 'no se encontró la póliza asociada al recibo.');
        return;
    }

    if (normalize(policy.code).toUpperCase() !== policyCode.toUpperCase()) {
        validationErrors.push(prefix + 'el recibo ' + receiptNumber
            + ' pertenece a la póliza ' + normalize(policy.code)
            + ', no a ' + policyCode + '.');
    }

    if (Number(policy.holderId) !== holderId) {
        validationErrors.push(prefix + 'El contratante proporcionado no pertenece a la poliza.');
    }

    validatePendingInstallments(policy.id, reference.changeId, amount, policyCode, receiptNumber, prefix, validationErrors);
}

function validateCashDesk(workspaceId, prefix, validationErrors, cache) {
    if (cache[workspaceId] === true) return;
    if (cache[workspaceId] === false) {
        validationErrors.push(prefix + 'la caja ' + workspaceId + ' no existe o está cerrada.');
        return;
    }

    doCmd({
        cmd: 'LoadEntity',
        data: {
            entity: 'TransferWorkspace',
            fields: '[id],[user],[closed]',
            filter: '[id] = ' + workspaceId + ' AND [closed] = 0',
            noTracking: true
        }
    });

    const isOpen = !!(LoadEntity && LoadEntity.outData && Number(LoadEntity.outData.id) === workspaceId);
    cache[workspaceId] = isOpen;
    if (!isOpen) validationErrors.push(prefix + 'la caja ' + workspaceId + ' no existe o está cerrada.');
}

function findPolicyByReceipt(receiptNumber, policyCode) {
    const escapedReceipt = escapeSql(receiptNumber);
    const escapedPolicyCode = escapeSql(policyCode);
    const query = "SELECT TOP 1 receipt.lifePolicyId, receipt.changeId "
        + "FROM ("
        + " SELECT lp.id AS lifePolicyId, 0 AS changeId, 0 AS sourceOrder"
        + " FROM LifePolicy lp WHERE lp.fiscalNumber = N'" + escapedReceipt + "'"
        + " AND lp.code = N'" + escapedPolicyCode + "'"
        + " UNION ALL"
        + " SELECT c.lifePolicyId, b.changeId, 1 AS sourceOrder"
        + " FROM Bill b INNER JOIN [Change] c ON c.id = b.changeId"
        + " INNER JOIN LifePolicy lp ON lp.id = c.lifePolicyId"
        + " WHERE b.fiscalNumber = N'" + escapedReceipt + "'"
        + " AND lp.code = N'" + escapedPolicyCode + "'"
        + ") receipt ORDER BY receipt.sourceOrder";

    doCmd({ cmd: 'DoQuery', data: { sql: query } });
    const results = DoQuery && Array.isArray(DoQuery.outData) ? DoQuery.outData : [];
    return results.length ? results[0] : null;
}

function validatePendingInstallments(policyId, changeId, amount, policyCode, receiptNumber, prefix, validationErrors) {
    doCmd({
        cmd: 'LoadEntities',
        data: {
            entity: 'PayPlan',
            filter: 'lifePolicyId = ' + Number(policyId) + ' AND cancellationDate IS NULL',
            noTracking: true
        }
    });

    let installments = LoadEntities && Array.isArray(LoadEntities.outData)
        ? LoadEntities.outData.slice()
        : [];

    installments = installments.filter(function (item) {
        const pending = number2(Number(item.minimum || 0) - Number(item.payed || 0));
        return pending > 0;
    });

    if (Number(changeId) > 0) {
        installments = installments.filter(function (item) {
            return Number(item.changeId) === Number(changeId);
        });
    }

    installments.sort(function (left, right) {
        return new Date(left.dueDate) - new Date(right.dueDate);
    });

    if (!installments.length) {
        validationErrors.push(prefix + 'no hay primas pendientes para la póliza '
            + policyCode + ', recibo ' + receiptNumber + '.');
        return;
    }

    let available = number2(amount);
    let applied = 0;

    installments.forEach(function (item) {
        if (available <= 0) return;
        const pending = number2(Number(item.minimum || 0) - Number(item.payed || 0));
        const applyAmount = Math.min(available, pending);
        if (applyAmount > 0) {
            applied = number2(applied + applyAmount);
            available = number2(available - applyAmount);
        }
    });

    if (applied <= 0) {
        validationErrors.push(prefix + 'el monto no puede aplicarse a las primas pendientes.');
    }
}

function normalize(value) {
    return String(value === null || value === undefined ? '' : value).trim();
}

function escapeSql(value) {
    return normalize(value).replace(/'/g, "''");
}

function number2(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Number(number.toFixed(2));
}
