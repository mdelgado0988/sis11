//block
//noreplace
/*
 * @name cmdUpdateRenewalPolicyIssuanceBatch
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/07/21
 * @version 1.0
 * @purpose Update Batch.success with the number of issued renewal policies.
 * @context.loteId Renewal issuance batch identifier.
 */

try {
  const loteId = getPositiveInteger(context && context.loteId);
  if (loteId <= 0) {
    throw new Error("El identificador del lote es requerido y debe ser válido.");
  }

  const batch = loadBatch(loteId);
  if (!batch) {
    throw new Error("No se encontró el lote " + loteId + ".");
  }

  const rows = parseBatchRows(batch.jData);
  const policyIds = getPolicyIds(rows);
  const renewedCount = countRenewedPolicies(policyIds);

  updateBatchResults(loteId, renewedCount);

  return {
    ok: true,
  msg: "Lote " + loteId + " actualizado. " + renewedCount + " póliza(s) renovada(s) de " + policyIds.length + "."
  };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError("@"+message);
}

function loadBatch(loteId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Batch",
      fields: "id,jData",
      filter: "id=" + loteId,
      noTracking: true
    }
  });

  if (typeof LoadEntity === "undefined" || !LoadEntity || !LoadEntity.ok) {
    throw new Error(
      LoadEntity && LoadEntity.msg
        ? LoadEntity.msg
        : "No fue posible cargar el lote " + loteId + "."
    );
  }

  return LoadEntity.outData || null;
}

function parseBatchRows(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  let rows;
  try {
    rows = JSON.parse(value);
  } catch (error) {
    throw new Error("El jData del lote no contiene un JSON válido.");
  }

  if (!Array.isArray(rows)) {
    throw new Error("El jData del lote debe contener un arreglo válido.");
  }

  return rows;
}

function getPolicyIds(rows) {
  return rows
    .map(row => {
      if (Array.isArray(row)) {
        const offerPolicyId = getPositiveInteger(row[4]);
        return offerPolicyId > 0
          ? offerPolicyId
          : getPositiveInteger(row[0]);
      }

      if (row && typeof row === "object") {
        return getPositiveInteger(row.policyId || row.lifePolicyId);
      }

      return 0;
    })
    .filter((value, index, values) => value > 0 && values.indexOf(value) === index);
}

function countRenewedPolicies(policyIds) {
  if (!policyIds.length) {
    return 0;
  }

  doCmd({
    cmd: "LoadEntities",
    data: {
      entity: "LifePolicy",
      fields: "id,activeDate",
      filter: "id in (" + policyIds.join(",") + ")",
      noTracking: true
    }
  });

  if (typeof LoadEntities === "undefined" || !LoadEntities || !LoadEntities.ok) {
    throw new Error(
      LoadEntities && LoadEntities.msg
        ? LoadEntities.msg
        : "No fue posible validar las pólizas renovadas."
    );
  }

  const policies = Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
  return policies.filter(policy => hasValue(policy && policy.activeDate)).length;
}

function updateBatchResults(loteId, renewedCount) {
  doCmd({
    cmd: "SetField",
    data: {
      entity: "Batch",
      entityId: loteId,
      fieldValue: "[success]=" + renewedCount + ",[launched]=GETDATE()"
    }
  });

  if (typeof SetField === "undefined" || !SetField || !SetField.ok) {
    throw new Error(
      SetField && SetField.msg
        ? SetField.msg
        : "No fue posible actualizar los resultados del lote " + loteId + "."
    );
  }
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function getPositiveInteger(value) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 0;
}

/*
  @test
  { loteId: 330 }
*/
