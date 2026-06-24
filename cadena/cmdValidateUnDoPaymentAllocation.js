//block
//noreplace

/*
 * @author Michael Delgado
 * @created 2026/06/16
 * @name cmdValidateUnDoPaymentAllocation
 * @version 1.0
 * @Purpose This command validate if an allocation is reverted and have partial payments to preserve correct data.
*/

const allocationId = context?.allocationId ?? 3189;
let msg = "Proceso ejecutado correctamente";
const allocationInstallmentRefs = loadAllocationInstallmentRefs(allocationId);

if (!allocationInstallmentRefs.length) {
  msg = "No existen cuotas que validar";
} else {
  const payPlanIds = uniqueNumbers(
    allocationInstallmentRefs.map(item => item?.payPlanId).filter(isValidNumber)
  );

  if (!payPlanIds.length) {
    msg = "No existen payPlanId validos";
  } else {
  const installmentPayments = loadAllocationInstallmentsByPayPlanIds(
    allocationInstallmentRefs
      .filter(item => isValidNumber(item?.lifePolicyId) && isValidNumber(item?.payPlanId))
  );

    const allocationIds = uniqueNumbers(
      installmentPayments
        .map(item => item?.allocationId)
        .filter(isValidNumber)
    );

    const transfers = loadTransfersByAllocationIds(allocationIds);
    const transferAllocationIds = uniqueNumbers(
      transfers
        .map(item => item?.allocationId)
        .filter(isValidNumber)
    );
  const appliedInstallmentPayments = installmentPayments.filter(item =>
    isValidNumber(item?.allocationId) && transferAllocationIds.includes(Number(item.allocationId))
  );

  const installments = loadInstallmentsByPayPlanIds(payPlanIds).filter(item =>
    isValidNumber(item?.id) && payPlanIds.includes(Number(item.id))
  );

  const updatedCount = updatePayPlanPaidAmounts(appliedInstallmentPayments, installments, transfers);
  msg = updatedCount
      ? `Se actualizaron ${updatedCount} payplan(s)`
      : "No fue necesario actualizar montos";
  }
}

return { ok: true, msg };

function loadAllocationInstallmentRefs(allocationId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "AllocationInstallment",
      filter: `allocationId = ${allocationId}`,
      fields: "lifePolicyId, payPlanId"
    }
  });

  return asArray(LoadEntities.outData);
}

function loadAllocationInstallmentsByPayPlanIds(refs) {
  if (!Array.isArray(refs) || !refs.length) {
    return [];
  }

  const pairs = refs
    .map(item => ({
      lifePolicyId: Number(item?.lifePolicyId),
      payPlanId: Number(item?.payPlanId)
    }))
    .filter(item => Number.isFinite(item.lifePolicyId) && Number.isFinite(item.payPlanId));

  if (!pairs.length) {
    return [];
  }

  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "AllocationInstallment",
      filter: buildAllocationFilter(pairs),
      fields: "allocationId, lifePolicyId, payPlanId, moneyInAmount"
    }
  });

  return asArray(LoadEntities.outData);
}

function loadInstallmentsByPayPlanIds(payPlanIds) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "PayPlan",
      filter: `id IN (${payPlanIds.join(",")})`,
      fields: "id, payed"
    }
  });

  return asArray(LoadEntities.outData);
}

function updatePayPlanPaidAmounts(installmentPayments, installments, transfers) {
  const expectedByPayPlan = groupSumByPayPlanId(installmentPayments, "moneyInAmount");
  const currentByPayPlan = groupSumByPayPlanId(installments, "payed");
  const metadataByPayPlan = buildPayPlanMetadataByPayPlanId(installmentPayments, transfers);
  const payPlans = uniqueNumbers([
    ...Object.keys(expectedByPayPlan || {}),
    ...Object.keys(currentByPayPlan || {})
  ]);

  let updatedCount = 0;

  for (const payPlanId of payPlans) {
    const expectedPaid = round2(expectedByPayPlan[payPlanId] ?? 0);
    const currentPaid = round2(currentByPayPlan[payPlanId] ?? 0);

    if (expectedPaid === currentPaid) {
      continue;
    }

    doCmd({
      cmd: "SetField",
      data: {
        entity: "PayPlan",
        entityId: payPlanId,
        fieldValue: `payed = ${expectedPaid}, allocationId = ${metadataByPayPlan[payPlanId]?.allocationId ?? "NULL"}, payedDate = ${formatDateAssignment(metadataByPayPlan[payPlanId]?.payedDate, expectedPaid)}`
      }
    });

    if (SetField?.ok) {
      updatedCount += 1;
    }
  }

  return updatedCount;
}

function buildPayPlanMetadataByPayPlanId(installmentPayments, transfers) {
  const transferDateByAllocationId = (Array.isArray(transfers) ? transfers : []).reduce((acc, item) => {
    const allocationId = Number(item?.allocationId);
    const date = item?.date;

    if (!Number.isFinite(allocationId) || !date) {
      return acc;
    }

    const current = acc[allocationId];
    if (!current || String(date) > String(current)) {
      acc[allocationId] = date;
    }

    return acc;
  }, {});

  return (Array.isArray(installmentPayments) ? installmentPayments : []).reduce((acc, item) => {
    const payPlanId = Number(item?.payPlanId);
    const allocationId = Number(item?.allocationId);
    const transferDate = transferDateByAllocationId[allocationId];

    if (!Number.isFinite(payPlanId) || !Number.isFinite(allocationId)) {
      return acc;
    }

    const candidate = {
      allocationId,
      payedDate: transferDate || null
    };

    const current = acc[payPlanId];
    if (!current) {
      acc[payPlanId] = candidate;
      return acc;
    }

    const currentDate = current.payedDate ? String(current.payedDate) : "";
    const candidateDate = candidate.payedDate ? String(candidate.payedDate) : "";
    if (!currentDate || candidateDate > currentDate) {
      acc[payPlanId] = candidate;
    }

    return acc;
  }, {});
}

function buildAllocationFilter(pairs) {
  const clauses = pairs.map(item =>
    `(lifePolicyId = ${item.lifePolicyId} AND payPlanId = ${item.payPlanId})`
  );

  return clauses.join(" OR ");
}

function loadTransfersByAllocationIds(allocationIds) {
  if (!Array.isArray(allocationIds) || !allocationIds.length) {
    return [];
  }

  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "Transfer",
      filter: `allocationId IN (${allocationIds.join(",")}) and isExternal = 1 AND status = 1 AND concept NOT LIKE 'IW%Reversal of %'`,
      fields: "allocationId, date"
    }
  });

  return asArray(LoadEntities.outData);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function groupSumByPayPlanId(items, amountField) {
  return (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const payPlanId = Number(item?.payPlanId);
    const amount = Number(item?.[amountField] ?? 0);

    if (!Number.isFinite(payPlanId)) {
      return acc;
    }

    if (!acc[payPlanId]) {
      acc[payPlanId] = 0;
    }

    acc[payPlanId] += Number.isFinite(amount) ? amount : 0;
    return acc;
  }, {});
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function formatDateAssignment(value, expectedPaid) {
  if (!Number.isFinite(Number(expectedPaid)) || Number(expectedPaid) <= 0.01) {
    return "NULL";
  }

  if (!value) {
    return "NULL";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function isValidNumber(value) {
  return value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value));
}

function uniqueNumbers(values) {
  return [...new Set(values.map(Number).filter(Number.isFinite))];
}
