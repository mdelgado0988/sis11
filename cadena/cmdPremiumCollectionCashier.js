//block
//noreplace

/**
 * @author Michael Delgado
 * @email support@axxis-systems.com
 * @created 2026/08/07
 * @name cmdPremiumCollectionCashier
 * @version 1.0
 * @purpose: Return pending premium collections grouped by policy.
 * @context: {
 *   page?: number,
 *   size?: number,
 *   holderId?: number,
 *   clientId?: number,
 *   lob?: string|number,
 *   policyId?: number,
 *   policyCode?: string,
 *   policyNumber?: string,
 *   issuanceFrom?: string,
 *   issuanceTo?: string,
 *   onlyOverdue?: boolean
 * }
 * @returns: Policy collection summary with pending installments in Cuotas.
 */

try {
  const input = getContextInput(context);
  const page = getPositiveInteger(input && input.page, 1);
  const size = getPositiveInteger(input && input.size, 15);
  const offset = (page - 1) * size;
  const onlyOverdue = input && input.onlyOverdue === true;
  const policyFilter = buildPolicyFilter(input);

  const dataQuery = `
WITH AllInstallments AS (
    SELECT
        pp.[id],
        pp.[lifePolicyId],
        pp.[payerId],
        pp.[numberInYear],
        pp.[contractYear],
        pp.[concept],
        pp.[expected],
        pp.[minimum],
        pp.[currency],
        pp.[payed],
        pp.[dueDate],
        pp.[coveredUntil],
        DATEDIFF(DAY, CAST(pp.[dueDate] AS DATE), CAST(GETDATE() AS DATE)) AS [dueDays],
        CASE
            WHEN CAST(pp.[dueDate] AS DATE) < CAST(GETDATE() AS DATE)
                AND ISNULL(pp.[minimum], 0) - ISNULL(pp.[payed], 0) > 0
                THEN ISNULL(pp.[minimum], 0) - ISNULL(pp.[payed], 0)
            ELSE 0
        END AS [overdueAmount],
        ISNULL(pp.[minimum], 0) - ISNULL(pp.[payed], 0) AS [pendingAmount]
    FROM [PayPlan] pp
    WHERE pp.[cancellationDate] IS NULL
), PendingInstallments AS (
    SELECT *
    FROM AllInstallments ai
    WHERE ${buildPendingInstallmentCondition('ai', onlyOverdue)}
), PolicyCollection AS (
    SELECT
        pol.[id] AS [lifePolicyId],
        pol.[holderId] AS [holderId],
        pol.[code] AS [policy],
        pol.[fiscalNumber] AS [fiscalNumber],
        YEAR(MIN(pi.[dueDate])) AS [year],
        MONTH(MIN(pi.[dueDate])) AS [month],
        lob.[name] AS [lob],
        payer.[payer] AS [payer],
        insured.[insured] AS [insured],
        pol.[activeDate] AS [issuanceDate],
        MAX(pi.[currency]) AS [currency],
        (
            SELECT SUM(ISNULL(allInstallments.[minimum], 0))
            FROM AllInstallments allInstallments
            WHERE allInstallments.[lifePolicyId] = pol.[id]
        ) AS [billed],
        (
            SELECT SUM(ISNULL(allInstallments.[payed], 0))
            FROM AllInstallments allInstallments
            WHERE allInstallments.[lifePolicyId] = pol.[id]
        ) AS [payed],
        (
            SELECT SUM(ISNULL(allInstallments.[overdueAmount], 0))
            FROM AllInstallments allInstallments
            WHERE allInstallments.[lifePolicyId] = pol.[id]
        ) AS [overdue],
        SUM(ISNULL(pi.[pendingAmount], 0)) AS [pending],
        (
            SELECT
                child.[id],
                child.[numberInYear],
                child.[contractYear],
                child.[concept],
                child.[dueDate],
                child.[coveredUntil],
                child.[expected],
                child.[minimum],
                child.[payed],
                child.[pendingAmount],
                child.[currency],
                child.[dueDays]
            FROM PendingInstallments child
            WHERE child.[lifePolicyId] = pol.[id]
            ORDER BY child.[contractYear], child.[numberInYear], child.[dueDate], child.[id]
            FOR JSON PATH
        ) AS [installments]
    FROM PendingInstallments pi
    INNER JOIN [LifePolicy] pol ON pol.[id] = pi.[lifePolicyId]
        AND pol.[activeDate] IS NOT NULL
    LEFT JOIN [Lob] lob ON lob.[code] = pol.[lob]
    OUTER APPLY (
        SELECT TOP 1
            LTRIM(RTRIM(COALESCE(payerContact.[name], '') + ' ' + COALESCE(payerContact.[surname1], '') + ' ' + COALESCE(payerContact.[surname2], ''))) AS [payer]
        FROM [Contact] payerContact
        WHERE payerContact.[id] = pol.[holderId]
    ) payer
    OUTER APPLY (
        SELECT TOP 1
            LTRIM(RTRIM(COALESCE(insuredContact.[name], '') + ' ' + COALESCE(insuredContact.[surname1], '') + ' ' + COALESCE(insuredContact.[surname2], ''))) AS [insured]
        FROM [Insured] insuredRow
        INNER JOIN [Contact] insuredContact ON insuredContact.[id] = insuredRow.[contactId]
        WHERE insuredRow.[lifePolicyId] = pol.[id]
          AND insuredRow.[role] = 0
        ORDER BY insuredRow.[id]
    ) insured
    WHERE 1 = 1
    ${policyFilter}
    GROUP BY
        pol.[id],
        pol.[holderId],
        pol.[code],
        pol.[fiscalNumber],
        lob.[name],
        payer.[payer],
        insured.[insured],
        pol.[activeDate]
)
SELECT
    [lifePolicyId],
    [holderId],
    [policy],
    [fiscalNumber],
    [year],
    [month],
    [lob],
    [payer],
    [insured],
    [currency],
    [billed],
    [payed],
    [overdue],
    [pending],
    [issuanceDate],
    [installments]
FROM PolicyCollection
ORDER BY [lifePolicyId]
OFFSET ${offset} ROWS FETCH NEXT ${size} ROWS ONLY;`;

  doCmd({
    cmd: 'DoQuery',
    data: { sql: dataQuery }
  });

  const dataResponse = getCommandResult('DoQuery');
  validateQueryResponse(dataResponse);

  const countQuery = `
SELECT COUNT(1) AS [total]
FROM (
    SELECT pp.[lifePolicyId]
    FROM [PayPlan] pp
    INNER JOIN [LifePolicy] pol ON pol.[id] = pp.[lifePolicyId]
    WHERE pp.[cancellationDate] IS NULL
      AND pol.[activeDate] IS NOT NULL
      AND ${buildPendingInstallmentCondition('pp', onlyOverdue)}
      ${policyFilter}
    GROUP BY pp.[lifePolicyId]
) totals;`;

  doCmd({
    cmd: 'DoQuery',
    data: { sql: countQuery }
  });

  const countResponse = getCommandResult('DoQuery');
  validateQueryResponse(countResponse);

  const countRows = getRows(countResponse.outData);
  const total = countRows.length > 0 ? getNonNegativeInteger(countRows[0].total) : 0;

  return {
    ok: true,
    msg: 'Cobro de primas recuperado correctamente',
    total: total,
    data: getRows(dataResponse.outData).map(mapPolicyCollection)
  };
} catch (error) {
  throw new TypeError(`@${getErrorMessage(error)}`);
}

function mapPolicyCollection(row) {
  const item = row || {};
  const policyId = getNonNegativeInteger(item.lifePolicyId || item.policyId || item.LifePolicyId);

  return {
    lifePolicyId: policyId,
    policyId: policyId,
    poliza: item.policy || '',
    recibo: item.fiscalNumber || '',
    holderId: getNonNegativeInteger(item.holderId),
    anio: getNonNegativeInteger(item.year),
    mes: getNonNegativeInteger(item.month),
    ramo: item.lob || '',
    pagador: item.payer || '',
    asegurado: item.insured || '',
    moneda: item.currency || '',
    facturado: toNumber(item.billed),
    pagado: toNumber(item.payed),
    vencido: toNumber(item.overdue),
    pendiente: toNumber(item.pending),
    fechaEmision: item.issuanceDate || null,
    Cuotas: parseJsonArray(item.installments)
  };
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function buildPolicyFilter(source) {
  const input = source || {};
  const filters = [];
  const holderValue = input.holderId !== undefined && input.holderId !== null
    ? input.holderId
    : input.clientId;
  const holderId = getOptionalPositiveInteger(holderValue);

  if (holderValue !== undefined && holderValue !== null && String(holderValue).trim() !== '' && holderId <= 0) {
    throw new Error('El identificador del pagador debe ser un número válido.');
  }

  if (holderId > 0) {
    filters.push(`AND pol.[holderId] = ${holderId}`);
  }

  const lob = getTrimmedString(input.lob);
  if (lob) {
    filters.push(`AND pol.[lob] = '${escapeSqlString(lob)}'`);
  }

  const policyCode = getTrimmedString(input.policyCode || input.policyNumber);
  const policyId = getOptionalPositiveInteger(input.policyId);

  if (input.policyId !== undefined && input.policyId !== null && String(input.policyId).trim() !== '' && policyId <= 0) {
    throw new Error('El identificador de la póliza debe ser un número válido.');
  }

  if (policyId > 0) {
    filters.push(`AND pol.[id] = ${policyId}`);
  }

  if (policyCode) {
    filters.push(`AND pol.[code] LIKE N'%${escapeSqlString(policyCode)}%'`);
  }

  const issuanceFrom = getDateFilterValue(input.issuanceFrom || input.emissionFrom);
  const issuanceTo = getDateFilterValue(input.issuanceTo || input.emissionTo);

  if (input.issuanceFrom || input.emissionFrom) {
    if (!issuanceFrom) {
      throw new Error('La fecha inicial de emisión no es válida.');
    }
    filters.push(`AND CAST(pol.[activeDate] AS DATE) >= '${issuanceFrom}'`);
  }

  if (input.issuanceTo || input.emissionTo) {
    if (!issuanceTo) {
      throw new Error('La fecha final de emisión no es válida.');
    }
    filters.push(`AND CAST(pol.[activeDate] AS DATE) <= '${issuanceTo}'`);
  }

  if (issuanceFrom && issuanceTo && issuanceFrom > issuanceTo) {
    throw new Error('El rango de fecha de emisión no es válido.');
  }

  if (input.onlyOverdue === true) {
    filters.push(`AND EXISTS (
        SELECT 1
        FROM [PayPlan] overduePlan
        WHERE overduePlan.[lifePolicyId] = pol.[id]
          AND overduePlan.[cancellationDate] IS NULL
          AND ${buildPendingInstallmentCondition('overduePlan', true)}
      )`);
  }

  return filters.join('\n      ');
}

function buildPendingInstallmentCondition(alias, onlyOverdue) {
  const prefix = alias ? `${alias}.` : '';
  const pendingAmount = `ISNULL(${prefix}[minimum], 0) - ISNULL(${prefix}[payed], 0)`;

  if (onlyOverdue) {
    return `CAST(${prefix}[dueDate] AS DATE) < CAST(GETDATE() AS DATE)
      AND ${pendingAmount} > 0`;
  }

  return `${pendingAmount} <> 0`;
}

function getContextInput(source) {
  if (!source) return {};

  if (typeof source === 'string') {
    try {
      const parsed = JSON.parse(source);
      return getContextInput(parsed);
    } catch (error) {
      return {};
    }
  }

  if (source.row && typeof source.row === 'object') {
    return source.row;
  }

  return typeof source === 'object' ? source : {};
}

function getOptionalPositiveInteger(value) {
  if (value === undefined || value === null || String(value).trim() === '') return 0;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function getDateFilterValue(value) {
  const raw = getTrimmedString(value);
  if (!raw) return '';

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return '';

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return '';
  }

  return raw;
}

function getTrimmedString(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

function escapeSqlString(value) {
  return getTrimmedString(value).replace(/'/g, "''");
}

function getCommandResult(commandName) {
  return typeof globalThis !== 'undefined' && globalThis[commandName]
    ? globalThis[commandName]
    : null;
}

function validateQueryResponse(response) {
  if (!response || response.ok === false) {
    throw new Error(response && response.msg ? response.msg : 'No fue posible recuperar la información de cobro.');
  }
}

function getRows(value) {
  return Array.isArray(value) ? value : [];
}

function getPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function getNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getErrorMessage(error) {
  if (error && error.message) return error.message;
  return String(error || 'Error desconocido');
}
