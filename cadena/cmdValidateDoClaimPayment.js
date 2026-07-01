//block
//noreplace

/**
 * @name cmdValidateDoClaimPayment
 * @version 1
 * @Author Michael Delgado
 * @Created 2026.06.30
 * @purpose Validates whether a claim payment can be applied based on the available balance per coverage payout.
 * @Input { total, jDetail }
 * @Output { ok, msg }
 */

try {
  const total = Number(context?.total ?? 0);
  const detailItems = parseDetailItems(context?.jDetail);

  if (!total || total === 0) {
    return { ok: false, msg: 'El total del pago debe ser mayor que cero' };
  }

  if (!Array.isArray(detailItems) || detailItems.length === 0) {
    return { ok: false, msg: 'El detalle del pago es inválido o está vacío' };
  }

  const groupedByPayout = groupAmountByPayoutId(detailItems);
  const payoutIds = Object.keys(groupedByPayout)
    .map(id => Number(id))
    .filter(id => id > 0);

  if (payoutIds.length === 0) {
    return { ok: false, msg: 'No se encontraron valores válidos del pago en el detalle del pago' };
  }

  const payoutsById = loadPayoutsById(payoutIds);
  const issues = [];

  for (const payoutId of payoutIds) {
    const requestedAmount = Number(groupedByPayout[payoutId] ?? 0);
    const payout = payoutsById[payoutId];

    if (!payout) {
      issues.push(`No se encontró registro de disponibilidad para el pago ${payoutId}`);
      continue;
    }

    const reservedAmount = Number(payout.reserved ?? 0);
    const requestedAmountValue = Number(payout.requestedAmount ?? 0);
    const availableAmount = Math.abs(reservedAmount + requestedAmountValue);

    if (requestedAmount > availableAmount + 0.0001) {
      issues.push(
        `El item no. ${payoutId} no tiene saldo suficiente. Solicitado: ${formatMoney(requestedAmount)}, disponible: ${formatMoney(availableAmount)}`
      );
    }
  }

  if (issues.length > 0) {
    return { ok: false, msg: issues.join(' | ') };
  }

  return { ok: true, msg: 'La validación del pago de reclamo fue correcta' };
} catch (error) {
  return { ok: false, msg: error?.message || error };
}

function parseDetailItems(rawDetail) {
  try {
    if (rawDetail === null || rawDetail === undefined) {
      return [];
    }

    const parsed = typeof rawDetail === 'string' ? JSON.parse(rawDetail) : rawDetail;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error('Detalle del pago no es un JSON válido');
  }
}

function groupAmountByPayoutId(detailItems) {
  return (detailItems || []).reduce((acc, item) => {
    const payoutId = Number(item?.payoutId ?? 0);
    const amount = Number(item?.amount ?? 0);

    if (!payoutId || Number.isNaN(amount)) {
      return acc;
    }

    if (!acc[payoutId]) {
      acc[payoutId] = 0;
    }

    acc[payoutId] += amount;
    return acc;
  }, {});
}

function loadPayoutsById(payoutIds) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'LifeCoveragePayout',
      fields: 'id, reserved, requestedAmount',
      filter: `id in (${payoutIds.join(',')})`,
      noTracking: true
    }
  });

  const rows = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];

  return rows.reduce((acc, item) => {
    const id = Number(item?.id ?? 0);
    if (id > 0) {
      acc[id] = item;
    }
    return acc;
  }, {});
}

function formatMoney(value) {
  const numberValue = Number(value ?? 0);
  if (Number.isNaN(numberValue)) {
    return '0.00';
  }

  return numberValue.toFixed(2);
}

/*
test:
{
  "total": 300,
  "jDetail": "[{\"num\":1,\"payoutId\":132,\"item\":\"Incendio/Rayo/Explosión\",\"description\":\"pago\",\"amount\":300,\"lifeCoverageId\":8970}]"
}
 */
