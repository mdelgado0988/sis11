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
const fatalErrors = [];

if (!rows.length) {
    throw '@La remesa no contiene filas para validar.';
}

if (!input.skipDuplicateValidation) validateDuplicates(rows, errors);
if (!input.skipPremiumIncomeTypeValidation) validatePremiumIncomeType(fatalErrors);

const cashDeskCache = {};

// Keep duplicate detection global, but isolate database-backed row validation
// in bounded batches to avoid processing a large remittance in one block.
for (let batchStart = 0; batchStart < rows.length; batchStart += VALIDATION_BATCH_SIZE) {
    const batch = rows.slice(batchStart, batchStart + VALIDATION_BATCH_SIZE);
    batch.forEach(function (row, batchIndex) {
        validateRow(row, batchStart + batchIndex + 1, errors, cashDeskCache);
    });
}

if (fatalErrors.length) {
    throw '@PRE OPERATION rechazada. No se realizó ningún cobro. ' + fatalErrors.join(' | ');
}

return {
    ok: true,
    outData: rows,
    outDataAux: [],
    validationErrors: errors.map(function (error) {
        return formatValidationError(error, rows, Number(input.rowOffset) || 0);
    }),
    msg: errors.length
        ? 'PRE OPERATION finalizada con ' + errors.length + ' inconsistencia(s) de fila. Las filas válidas pueden procesarse.'
        : 'PRE OPERATION finalizada: ' + rows.length + ' filas válidas.'
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
            policyId: row[3],
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
    const policyPayments = {};

    rowsToValidate.forEach(function (row, index) {
        const rowNumber = index + 1;
        const policyId = normalize(row && row.policyId);
        const amount = Number(row && row.monto);
        const amountKey = Number.isFinite(amount) ? amount.toFixed(2) : '';

        if (policyId && amountKey) {
            const policyPaymentKey = policyId + '|' + amountKey;
            if (policyPayments[policyPaymentKey]) {
                validationErrors.push('Fila ' + rowNumber + ': póliza duplicada ' + policyId
                    + ' (también aparece en la fila ' + policyPayments[policyPaymentKey] + ').');
            } else policyPayments[policyPaymentKey] = rowNumber;
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

function formatValidationError(error, sourceRows, rowOffset) {
    const text = String(error || '');
    const rowMatch = text.match(/^Fila\s+(\d+):\s*(.*)$/i);
    const localRowNumber = rowMatch ? Number(rowMatch[1]) : 0;
    const rowNumber = localRowNumber > 0 ? localRowNumber + rowOffset : 0;
    const row = localRowNumber > 0 && sourceRows[localRowNumber - 1] ? sourceRows[localRowNumber - 1] : {};
    const detail = rowMatch ? rowMatch[2] : text;
    const duplicateMatch = detail.match(/póliza duplicada\s+(\S+).*?fila\s+(\d+)/i);

    return {
        row: rowNumber > 0 ? String(rowNumber) : '',
        policyId: row && row.policyId !== undefined ? String(row.policyId) : '',
        policyCode: row && row.policyCode !== undefined ? String(row.policyCode) : '',
        duplicateRow: duplicateMatch ? duplicateMatch[2] : '',
        detail: detail
    };
}

function validateRow(row, rowNumber, validationErrors, cashDeskCache) {
    const prefix = 'Fila ' + rowNumber + ': ';
    const workspaceId = Number(row && row.workspaceId);
    const policyCode = normalize(row && row.policyCode);
    const holderId = Number(row && row.holderId);
    const policyId = Number(row && row.policyId);
    const amount = Number(row && row.monto);

    if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
        validationErrors.push(prefix + 'ID_Caja es obligatorio y debe ser válido.');
    }
    if (!policyCode) validationErrors.push(prefix + 'Codigo_Poliza es obligatorio.');
    if (!Number.isInteger(holderId) || holderId <= 0) {
        validationErrors.push(prefix + 'ID_Cliente es obligatorio y debe ser válido.');
    }
    if (!Number.isInteger(policyId) || policyId <= 0) {
        validationErrors.push(prefix + 'ID_Poliza es obligatorio y debe ser válido.');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        validationErrors.push(prefix + 'Monto_Pago debe ser mayor que cero.');
    }

    if (!Number.isInteger(workspaceId) || workspaceId <= 0
        || !policyCode || !Number.isInteger(holderId) || holderId <= 0
        || !Number.isInteger(policyId) || policyId <= 0
        || !Number.isFinite(amount) || amount <= 0) return;

    validateCashDesk(workspaceId, prefix, validationErrors, cashDeskCache);

    doCmd({
        cmd: 'RepoLifePolicy',
        data: {
            operation: 'GET',
            filter: '[id] = ' + policyId,
            noTracking: true
        }
    });

    const policies = RepoLifePolicy && Array.isArray(RepoLifePolicy.outData)
        ? RepoLifePolicy.outData
        : [];
    const policy = policies.length ? policies[policies.length - 1] : null;

    if (!policy) {
        validationErrors.push(prefix + 'no se encontró la póliza indicada.');
        return;
    }

    if (normalize(policy.code).toUpperCase() !== policyCode.toUpperCase()) {
        validationErrors.push(prefix + 'el código de póliza no coincide con la póliza indicada.');
    }

    if (Number(policy.holderId) !== holderId) {
        validationErrors.push(prefix + 'El contratante proporcionado no pertenece a la poliza.');
    }

    validatePendingInstallments(policy.id, amount, policyCode, prefix, validationErrors);
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

function validatePendingInstallments(policyId, amount, policyCode, prefix, validationErrors) {
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

    installments.sort(function (left, right) {
        return new Date(left.dueDate) - new Date(right.dueDate);
    });

    if (!installments.length) {
        validationErrors.push(prefix + 'no hay primas pendientes para la póliza '
            + policyCode + '.');
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

function number2(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Number(number.toFixed(2));
}
