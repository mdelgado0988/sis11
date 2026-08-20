//block
//noreplace

/*
 * @name cmdCancelAllocationTransaction
 * @author Michael Delgado
 * @created 2026/08/19
 * @version 1.0
 * @purpose Reverse the accounting transaction associated with an allocation.
 * @context Receives allocationId.
 *
 * The original accounting entry is located by Entity = ALLOCATION and
 * entityId. The reversal is created through ReverseTransaction.
 */

try {
  const allocationId = getPositiveInteger(context && context.allocationId);

  if (allocationId <= 0) {
    throw new Error("allocationId es requerido y debe ser válido.");
  }

  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "[Transaction]",
      fields: "id,reversalOfId",
      filter: `[Entity] = N'ALLOCATION' AND entityId = ${allocationId} AND reversalOfId IS NULL`,
      noTracking: true
    }
  });

  if (typeof LoadEntities === "undefined" || !LoadEntities || LoadEntities.ok === false) {
    throw new Error(
      LoadEntities && LoadEntities.msg
        ? LoadEntities.msg
        : "No fue posible localizar la transacción contable."
    );
  }

  const transactions = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
  const transactionIds = transactions
    .map(transaction => getPositiveInteger(transaction && transaction.id))
    .filter(transactionId => transactionId > 0);

  if (transactionIds.length === 0) {
    throw new Error(
      `No se encontraron transacciones contables asociadas al allocationId ${allocationId}.`
    );
  }

  const reversals = [];

  for (const transactionId of transactionIds) {
    doCmd({
      cmd: "ReverseTransaction",
      data: {
        transactionId: transactionId,
        notes: null
      }
    });

    if (typeof ReverseTransaction === "undefined" || !ReverseTransaction || ReverseTransaction.ok === false) {
      throw new Error(
        ReverseTransaction && ReverseTransaction.msg
          ? ReverseTransaction.msg
          : `No fue posible revertir la transacción contable ${transactionId}.`
      );
    }

    reversals.push({
      transactionId: transactionId,
      result: ReverseTransaction.outData || null,
      msg: ReverseTransaction.msg || null
    });
  }

  return {
    ok: true,
    msg: `${reversals.length} transacciones contables revertidas correctamente.`,
    outData: reversals
  };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError(`@${message}`);
}

function getPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}
