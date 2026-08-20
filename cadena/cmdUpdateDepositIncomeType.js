//block
//noreplace

/*
 * @name cmdUpdateDepositIncomeType
 * @author Michael Delgado
 * @created 2026/08/19
 * @version 1.0
 * @purpose Associate the income type with deposits created by DepositCashierPayments.
 * @context Receives the deposit data used to identify the generated Transfer.
 * Required context: workspaceId, destinationAccountId, amount, incomeType and
 * paymentMethod. Optional context: currency and concept.
 *
 * The original DepositCashierPayments command does not persist incomeType.
 * This command is intended to run as a post-execution trigger and updates every
 * matching transfer that still has no income type associated with it.
 */

try {
  const input = context || {};
  const workspaceId = getPositiveInteger(input.workspaceId);
  const destinationAccountId = getPositiveInteger(input.destinationAccountId);
  const amount = toNumber(input.amount);
  const incomeType = getTrimmedString(input.incomeType);
  const paymentMethod = getTrimmedString(input.paymentMethod);
  const currency = getTrimmedString(input.currency);
  const concept = getTrimmedString(input.concept);

  if (workspaceId <= 0) {
    throw new Error("workspaceId es requerido y debe ser válido.");
  }

  if (destinationAccountId <= 0) {
    throw new Error("destinationAccountId es requerido y debe ser válido.");
  }

  if (!Number.isFinite(amount)) {
    throw new Error("amount es requerido y debe ser numérico.");
  }

  if (!incomeType) {
    throw new Error("incomeType es requerido.");
  }

  if (!paymentMethod) {
    throw new Error("paymentMethod es requerido.");
  }

  const transfers = loadMatchingTransfers({
    workspaceId,
    destinationAccountId,
    amount,
    paymentMethod,
    currency,
    concept
  });

  let updated = 0;
  transfers.forEach(transfer => {
    if (updateIncomeType(transfer.id, incomeType)) {
      executeAccountingTemplate(transfer.id);
      updated += 1;
    }
  });

  return {
    ok: true,
    msg: updated
      ? `Se asoció el incomeType a ${updated} transferencia(s).`
      : "No se encontraron transferencias coincidentes pendientes de asociar."
  };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError(`@${message}`);
}

function loadMatchingTransfers(criteria) {
  const filters = [
    `transferWorkspaceId = ${criteria.workspaceId}`,
    `destinationAccountId = ${criteria.destinationAccountId}`,
    `amount = ${criteria.amount}`,
    "(incomeType IS NULL OR incomeType = '')"
  ];

  if (criteria.currency) {
    filters.push(`currency = N'${escapeSqlString(criteria.currency)}'`);
  }

  if (criteria.concept) {
    filters.push(`[concept] = N'${escapeSqlString(criteria.concept)}'`);
  }

  doCmd({
    cmd: "RepoTransfer",
    data: {
      operation: "GET",
      filter: filters.join(" AND "),
      include: ["SplitPayments"],
      noTracking: true
    }
  });

  if (typeof RepoTransfer === "undefined" || !RepoTransfer || RepoTransfer.ok === false) {
    throw new Error(
      RepoTransfer && RepoTransfer.msg
        ? RepoTransfer.msg
        : "No fue posible buscar las transferencias del depósito."
    );
  }

  const transfers = Array.isArray(RepoTransfer.outData) ? RepoTransfer.outData : [];
  return transfers.filter(transfer => hasPaymentMethod(transfer, criteria.paymentMethod));
}

function hasPaymentMethod(transfer, paymentMethod) {
  const expected = getTrimmedString(paymentMethod).toUpperCase();
  const values = [];
  const splitPayments = getSplitPayments(transfer);

  splitPayments.forEach(item => {
    values.push(getProperty(item, "paymentMethod"));
    values.push(getProperty(item, "paymentMethodCode"));
    values.push(getProperty(item, "methodCode"));
    values.push(getNestedProperty(item, "PaymentMethod", "code"));
  });

  values.push(getProperty(transfer, "paymentMethod"));
  values.push(getProperty(transfer, "paymentMethodCode"));
  values.push(getProperty(transfer, "methodCode"));
  values.push(getNestedProperty(transfer, "PaymentMethod", "code"));

  return values.some(value => getTrimmedString(value).toUpperCase() === expected);
}

function getSplitPayments(transfer) {
  const value = getProperty(transfer, "SplitPayments") || getProperty(transfer, "splitPayments");

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  return [];
}

function getProperty(source, propertyName) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const expectedName = String(propertyName).toLowerCase();
  const key = Object.keys(source).find(item => String(item).toLowerCase() === expectedName);
  return key ? source[key] : null;
}

function getNestedProperty(source, parentName, childName) {
  return getProperty(getProperty(source, parentName), childName);
}

function updateIncomeType(transferId, incomeType) {
  doCmd({
    cmd: "SetField",
    data: {
      entity: "Transfer",
      entityId: transferId,
      fieldValue: `incomeType = N'${escapeSqlString(incomeType)}'`
    }
  });

  if (typeof SetField === "undefined" || !SetField || SetField.ok === false) {
    throw new Error(
      SetField && SetField.msg
        ? SetField.msg
        : `No fue posible actualizar la transferencia ${transferId}.`
    );
  }

  return true;
}

function executeAccountingTemplate(transferId) {
  const id = getPositiveInteger(transferId);
  if (id <= 0) {
    throw new Error("No fue posible contabilizar: el id de la transferencia no es válido.");
  }

  doCmd({
    cmd: "ExeTransactionTemplate",
    data: {
      code: "IngresoVarioCaja",
      scanContext: {
        id: id
      }
    }
  });

  if (
    typeof ExeTransactionTemplate === "undefined" ||
    !ExeTransactionTemplate ||
    ExeTransactionTemplate.ok === false
  ) {
    throw new Error(
      ExeTransactionTemplate && ExeTransactionTemplate.msg
        ? ExeTransactionTemplate.msg
        : `No fue posible contabilizar la transferencia ${id}.`
    );
  }
}

function getPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return NaN;
  }

  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : NaN;
}

function getTrimmedString(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''");
}
