//block
//noreplace
/*
  @Autor: Michael Delgado.
  @Name: cmdClaimReserveClosing
  @Email: michael.delgado@axxis-systems.com
  @Fecha: 2026.07.02
  @Description: Close claim reserve balances by coverage, separating payment and expense buckets.
  @Version: 1.0
  @Parameters:
    {"claimId":123}
*/

const claimIdResult = getValidId(context?.claimId, "claimId");
if (!claimIdResult.ok) {
  return claimIdResult;
}

const claimResult = loadClaim(claimIdResult.value);
if (!claimResult.ok) {
  return claimResult;
}

const currentUserResult = getCurrentUser();
if (!currentUserResult.ok) {
  return currentUserResult;
}

const reserves = loadClaimReserves(claimIdResult.value);
if (!reserves.length) {
  return { ok: true, msg: "No existen reservas para cerrar." };
}

const groups = groupReservesByCoverageAndBucket(reserves);
const entitiesToInsert = buildReserveClosingEntities(groups, claimResult.value, currentUserResult.value);

if (!entitiesToInsert.length) {
  return { ok: true, msg: "No hay saldos de reservas pendientes para cerrar.", entitiesToInsert: [] };
}

let created = 0;

// The framework persists each ADD independently, so we first build the full payload
// list and only then execute the inserts. The runtime does not expose a transaction
// wrapper for chained commands, so validation remains separated from persistence.
for (const entity of entitiesToInsert) {
  doCmd({
    cmd: "RepoLifeCoveragePayout",
    data: {
      operation: "ADD",
      entity: entity
    }
  });

  if (!RepoLifeCoveragePayout?.ok) {
    return {
      ok: false,
      msg: `Error al cerrar la reserva de la cobertura ${entity.lifeCoverageId}: ${RepoLifeCoveragePayout?.msg || "Error desconocido"}`,
      entitiesToInsert
    };
  }

  created += 1;
}

return {
  ok: true,
  msg: `Cierre de reservas ejecutado correctamente. Creadas: ${created}.`,
  entitiesToInsert
};

/////////////////////////////////////////////////////////////////////////////
/// Helpers
/////////////////////////////////////////////////////////////////////////////

function getValidId(value, fieldName) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, msg: `El campo ${fieldName} es obligatorio y debe ser un numero valido.` };
  }

  return { ok: true, value: id };
}

function loadClaim(claimId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Claim",
      fields: "id, code, lifePolicyId",
      filter: `id = ${claimId}`,
      noTracking: true
    }
  });

  const claim = LoadEntity?.outData || null;
  if (!claim?.id) {
    return { ok: false, msg: `No se encontro el reclamo ${claimId}.` };
  }

  if (!Number.isInteger(Number(claim.lifePolicyId)) || Number(claim.lifePolicyId) <= 0) {
    return { ok: false, msg: `El reclamo ${claimId} no tiene poliza asociada.` };
  }

  return {
    ok: true,
    value: {
      id: Number(claim.id),
      code: claim.code || "",
      lifePolicyId: Number(claim.lifePolicyId)
    }
  };
}

function loadClaimReserves(claimId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "LifeCoveragePayout",
      fields: "id, lifeCoverageId, reserved, payed, reserveType, expenseType",
      filter: `claimId = ${claimId} AND status <> 2`,
      noTracking: true
    }
  });

  return Array.isArray(LoadEntities?.outData) ? LoadEntities.outData : [];
}

function groupReservesByCoverageAndBucket(reserves) {
  const map = new Map();

  for (const item of Array.isArray(reserves) ? reserves : []) {
    const lifeCoverageId = Number(item?.lifeCoverageId ?? 0);
    if (!Number.isInteger(lifeCoverageId) || lifeCoverageId <= 0) {
      continue;
    }

    const bucket = getReserveBucket(item);
    const key = `${lifeCoverageId}|${bucket}`;

    if (!map.has(key)) {
      map.set(key, {
        lifeCoverageId,
        bucket,
        items: []
      });
    }

    map.get(key).items.push(item);
  }

  return [...map.values()];
}

function buildReserveClosingEntities(groups, claim, userEmail) {
  const entities = [];

  for (const group of Array.isArray(groups) ? groups : []) {
    // In this reserve model, reserved already stores the signed reserve balance,
    // so the closing amount is derived directly from reserved only.
    const balance = round2(
      group.items.reduce((sum, item) => {
        const reserved = Number(item?.reserved ?? 0);
        return sum + reserved;
      }, 0)
    );

    if (balance === 0) {
      continue;
    }

    const firstItem = group.items[0];
    const closingAmount = round2(balance);
    const entity = {
      id: 0,
      lifePolicyId: claim.lifePolicyId,
      claimId: claim.id,
      lifeCoverageId: group.lifeCoverageId,
      date: new Date().toISOString(),
      user: userEmail,
      reserved: -closingAmount,
      amount: -closingAmount,
      payed: 0,
      concept: buildConcept(group.bucket, claim.code),
      operation: "RESERVE",
      status: 1,
      requestedAmount: 0,
      deductible: 0,
      parentCode: null,
      reserveType: firstItem?.reserveType ?? null,
      expenseType: firstItem?.expenseType ?? null,
      ClaimExpense: null,
      jAffectedObjects: null
    };

    entities.push(entity);
  }

  return entities;
}

function getReserveBucket(item) {
  const reserveType = String(item?.reserveType ?? "").trim().toUpperCase();

  // The dataset uses reserveType as the actual bucket discriminator.
  // expenseType may be empty even for expense reserves.
  if (reserveType === "EX") {
    return "EXPENSE";
  }

  return "PAYMENT";
}

function buildConcept(bucket, claimCode) {
  const bucketLabel = bucket === "EXPENSE" ? "gasto" : "pago";
  const suffix = claimCode ? ` ${claimCode}` : "";
  return `Cierre de reserva de ${bucketLabel}${suffix}`.trim();
}

function getCurrentUser() {
  doCmd({
    cmd: "GetCurrentUser",
    data: {}
  });

  const email = GetCurrentUser?.outData?.email || "";
  if (!email) {
    return { ok: false, msg: "No se pudo identificar el usuario actual." };
  }

  return { ok: true, value: email };
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}
