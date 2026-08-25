//block
//noreplace

/*
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/07/10
 * @name cmdValidateTransferPreviousData
 * @version 1.0
 * @Purpose Validate that the transfer workspace belongs to the same sysUser executing the action.
 * @Input { sysUser, transferWorkspaceId?, transferId?, allocationId? }
 * @Behavior If transferWorkspaceId is provided, the command validates that workspace directly.
 *           If transferId is provided, the command first resolves the workspace from Transfer.transferWorkspaceId
 *           and then validates the workspace owner.
 *           If allocationId is provided, the command first resolves the workspace from Allocation.transferWorkspaceId
 *           and then validates the workspace owner.
 *           The SUPERVISOR user bypasses the workspace ownership validation.
 *           If more than one identifier is provided, they must resolve to the same workspace.
 * @Output { ok, msg }
 */

try {
  const sysUser = normalizeText(context?.sysUser);
  const transferWorkspaceIdInput = Number(context?.transferWorkspaceId ?? 0);
  const transferIdInput = Number(context?.transferId ?? 0);
  const allocationIdInput = Number(context?.allocationId ?? 0);

  if (!sysUser) {
    return { ok: false, msg: "No se recibió el usuario de contexto." };
  }

  if (sysUser === "supervisor") {
    return {
      ok: true,
      msg: "OK",
      skipped: true
    };
  }

  const hasWorkspaceId = isValidId(transferWorkspaceIdInput);
  const hasTransferId = isValidId(transferIdInput);
  const hasAllocationId = isValidId(allocationIdInput);

  if (!hasWorkspaceId && !hasTransferId && !hasAllocationId) {
    return { ok: false, msg: "Debe enviar transferWorkspaceId, transferId o allocationId para validar la caja." };
  }

  const workspaceSources = [];

  if (hasWorkspaceId) {
    workspaceSources.push({
      source: "transferWorkspaceId",
      input: transferWorkspaceIdInput,
      value: transferWorkspaceIdInput
    });
  }

  if (hasTransferId) {
    workspaceSources.push({
      source: "transferId",
      input: transferIdInput,
      value: resolveTransferWorkspaceIdFromTransfer(transferIdInput)
    });
  }

  if (hasAllocationId) {
    workspaceSources.push({
      source: "allocationId",
      input: allocationIdInput,
      value: resolveTransferWorkspaceIdFromAllocation(allocationIdInput)
    });
  }

  const invalidSources = workspaceSources.filter(item => !isValidId(item?.value));
  if (invalidSources.length) {
    const invalidLabel = invalidSources
      .map(item => `${item.source}=${item.input}`)
      .join(", ");

    return {
      ok: false,
      msg: `No fue posible identificar la caja para: ${invalidLabel}.`
    };
  }

  const resolvedWorkspaceSources = workspaceSources;

  const transferWorkspaceId = hasWorkspaceId
    ? transferWorkspaceIdInput
    : Number(resolvedWorkspaceSources[0].value);

  const workspaceMismatch = resolvedWorkspaceSources.some(item => Number(item.value) !== Number(transferWorkspaceId));
  if (workspaceMismatch) {
    const expectedSources = resolvedWorkspaceSources
      .map(item => `${item.source}:${Number(item.value)}`)
      .join(", ");

    return {
      ok: false,
      msg: `Los identificadores enviados no corresponden a la misma caja. Resueltos: ${expectedSources}.`
    };
  }

  const transferWorkspace = loadTransferWorkspace(transferWorkspaceId);
  if (!transferWorkspace) {
    return { ok: false, msg: "No se encontró la caja indicada." };
  }

  const workspaceUser = normalizeText(transferWorkspace?.user);
  if (!workspaceUser) {
    return { ok: false, msg: "No fue posible identificar el usuario de la caja indicada." };
  }

  if (workspaceUser !== sysUser) {
    return {
      ok: false,
      msg: `No puede ejecutar la acción porque la caja pertenece a otro usuario. Caja validada: ${transferWorkspaceId}.`
    };
  }

  return {
    ok: true,
    msg: "OK",
    source: hasWorkspaceId ? "transferWorkspaceId" : hasTransferId ? "transferId" : "allocationId",
    transferWorkspaceId
  };
} catch (error) {
  return { ok: false, msg: error.toString() };
}

function loadTransferWorkspace(transferWorkspaceId) {
  doCmd({
    cmd: "RepoTransferWorkspace",
    data: {
      operation: "GET",
      filter: `id=${transferWorkspaceId}`
    }
  });

  if (!RepoTransferWorkspace?.ok) {
    throw new Error(RepoTransferWorkspace?.msg || "No fue posible consultar la caja.");
  }

  return Array.isArray(RepoTransferWorkspace.outData)
    ? RepoTransferWorkspace.outData[0] ?? null
    : null;
}

function resolveTransferWorkspaceIdFromTransfer(transferId) {
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "Transfer",
      fields: "id, transferWorkspaceId",
      filter: `id = ${transferId}`,
      noTracking: true
    }
  });

  if (!LoadEntities?.ok) {
    throw new Error(LoadEntities?.msg || "No fue posible consultar el transfer.");
  }

  const transfer = Array.isArray(LoadEntities.outData) ? LoadEntities.outData[0] ?? null : null;
  const workspaceId = Number(transfer?.transferWorkspaceId ?? 0);

  return isValidId(workspaceId) ? workspaceId : null;
}

function resolveTransferWorkspaceIdFromAllocation(allocationId) {
  // Allocation stores the workspace directly in Allocation.transferWorkspaceId, so we resolve the workspace from there.
  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "Allocation",
      fields: "id, transferWorkspaceId",
      filter: `id = ${allocationId}`,
      noTracking: true
    }
  });

  if (!LoadEntities?.ok) {
    throw new Error(LoadEntities?.msg || "No fue posible consultar la asignación.");
  }

  const allocation = Array.isArray(LoadEntities.outData) ? LoadEntities.outData[0] ?? null : null;
  const workspaceId = Number(allocation?.transferWorkspaceId ?? 0);

  return isValidId(workspaceId) ? workspaceId : null;
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidId(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}
