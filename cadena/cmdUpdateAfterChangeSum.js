//block
//noreplace

/*
 * @name cmdUpdateAfterChangeSum
 * @purpose Updates the insured sum in the policy coverages and in the
 * insured-object form after a capital change.
 * @context { lifePolicyId, newInsuredSum }
 */

try {
  const policyId = getPositiveInteger(context && context.lifePolicyId);
  const insuredSum = getValidAmount(context && context.newInsuredSum);

  if (policyId <= 0) {
    throw new Error("El identificador de la póliza es requerido y debe ser válido.");
  }

  doCmd({
    cmd: "RepoInsuredObject",
    data: {
      operation: "GET",
      filter: "lifePolicyId = " + policyId,
      include: ["ObjectDefinition", "ObjectDefinition.Form"]
    }
  });

  if (typeof RepoInsuredObject === "undefined" || !RepoInsuredObject || !RepoInsuredObject.ok) {
    throw new Error(
      RepoInsuredObject && RepoInsuredObject.msg
        ? RepoInsuredObject.msg
        : "No fue posible recuperar el objeto asegurado de la póliza."
    );
  }

  const insuredObjects = Array.isArray(RepoInsuredObject.outData)
    ? RepoInsuredObject.outData
    : [];
  const insuredObjectCodes = [
    "1_9_DT_INCENDIO",
    "DT_INCENDIO_V3",
    "DTINCENDIO_SUMA"
  ];
  const insuredObjectsToUpdate = insuredObjects.filter(item =>
    item &&
    item.ObjectDefinition &&
    insuredObjectCodes.indexOf(item.ObjectDefinition.code) >= 0 &&
    getPositiveInteger(item.id) > 0
  );

  let sql =
    "UPDATE LifeCoverage SET [limit] = " + insuredSum +
    ", [startLimit] = " + insuredSum +
    " WHERE [lifePolicyId] = " + policyId + ";";

  insuredObjectsToUpdate.forEach(insuredObject => {
    const customForm = safeJsonArray(insuredObject.jValues);
    const inputValues = insuredObject.userData && typeof insuredObject.userData === "object"
      ? insuredObject.userData
      : {};

    inputValues.txtSA = insuredSum;
    inputValues.txtSADisplay = insuredSum;

    customForm.forEach(input => {
      if (!input || !input.name) {
        return;
      }

      if (Object.prototype.hasOwnProperty.call(inputValues, input.name)) {
        input.userData = [inputValues[input.name]];
      }
    });

    sql +=
      " UPDATE InsuredObject SET jValues = '" +
      escapeSqlString(JSON.stringify(customForm)) +
      "' WHERE id = " + getPositiveInteger(insuredObject.id) + ";";
  });

  doCmd({
    cmd: "DoQuery",
    data: { sql: sql }
  });

  if (typeof DoQuery === "undefined" || !DoQuery || !DoQuery.ok) {
    throw new Error(
      DoQuery && DoQuery.msg
        ? DoQuery.msg
        : "No fue posible actualizar la suma asegurada."
    );
  }

  return {
    ok: true,
    msg: "Actualización completada"
  };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError("@" + message);
}

function getPositiveInteger(value) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 0;
}

function getValidAmount(value) {
  if (value === null || typeof value === "undefined" || value === "") {
    throw new Error("La suma asegurada es requerida.");
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error("La suma asegurada debe ser un valor numérico mayor o igual a cero.");
  }

  return Number(numberValue.toFixed(6));
}

function safeJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error("El formulario del objeto asegurado no contiene un JSON válido.");
  }
}

function escapeSqlString(value) {
  return String(value || "").replace(/'/g, "''");
}
