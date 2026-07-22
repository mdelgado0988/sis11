//block
//noreplace
/*
 * @name cmdRenewalPolicyIssuance
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/07/21
 * @version 1.0
 * @purpose Update the renewal workflow user, approve the workflow, and issue the policy.
 * @context.row.policyId Policy identifier to issue.
 * @context.row.loteId Renewal batch identifier used to validate the request context.
 * @context.row.userEmail User assigned to the policy workflow process.
 * @behavior The command does not issue a policy when activeDate is already populated.
 * @note Batch-level duplicate validation is performed before batch creation. This
 *       chain runs inside the active issuance batch and must not block itself.
 */

try {
  const row = getContextRow();
  const policyId = getPositiveInteger(row.policyId);
  const loteId = getPositiveInteger(row.loteId);
  const userEmail = getTrimmedString(row.userEmail);

  validateInput(policyId, loteId, userEmail);

  const policy = loadPolicy(policyId);
  if (!policy) {
    return {
      ok: false,
      msg: `No se encontró la póliza ${policyId}.`
    };
  }

  if (hasActiveDate(policy.activeDate)) {
    return {
      ok: false,
      msg: `La póliza ${policyId} ya está emitida.`
    };
  }

  validatePolicyQuotation(policyId);

  const processId = getPositiveInteger(policy.processId);
  if (processId <= 0) {
    return {
      ok: false,
      msg: `La póliza ${policyId} no tiene un proceso de workflow válido.`
    };
  }

  updateProcessUser(processId, userEmail);
  approveWorkflow(processId);
  issuePolicy(policyId);

  return {
    ok: true,
    msg: `La póliza ${policyId} fue emitida correctamente.`
  };
} catch (error) {
  const message = error && error.message
    ? error.message
    : String(error);

  throw new TypeError(`@${message}`);
}

function getContextRow() {
  if (!context || !context.row || typeof context.row !== "object" || Array.isArray(context.row)) {
    throw new Error("El contexto debe contener un objeto row válido.");
  }

  return context.row;
}

function validateInput(policyId, loteId, userEmail) {
  if (policyId <= 0) {
    throw new Error("El identificador de póliza es requerido y debe ser válido.");
  }

  if (loteId <= 0) {
    throw new Error("El identificador de lote es requerido y debe ser válido.");
  }

  if (!userEmail || !isValidEmail(userEmail)) {
    throw new Error("El correo del usuario es requerido y debe ser válido.");
  }
}

function loadPolicy(policyId) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "LifePolicy",
      filter: `id=${policyId}`,
      fields: "id,activeDate,processId",
      noTracking: true
    }
  });

  if (typeof LoadEntity === "undefined" || !LoadEntity || !LoadEntity.ok) {
    throw new Error(
      LoadEntity && LoadEntity.msg
        ? LoadEntity.msg
        : `No fue posible cargar la póliza ${policyId}.`
    );
  }

  return LoadEntity.outData || null;
}

function validatePolicyQuotation(policyId) {
  const policyEvents = loadEntities(
    'PolicyEvent',
    'id,lifePolicyId,name',
    `lifePolicyId=${policyId} AND name IN ('Quoted','Cotizado')`
  );

  if (policyEvents.length === 0) {
    throw new Error(`La póliza ${policyId} debe cotizarse antes de emitirse.`);
  }

  const payPlans = loadEntities(
    'PayPlan',
    'id,lifePolicyId',
    `lifePolicyId=${policyId}`
  );

  if (payPlans.length === 0) {
    throw new Error(`La póliza ${policyId} no tiene plan de pago. Debe cotizarse antes de emitirse.`);
  }
}

function loadEntities(entity, fields, filter) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: entity,
      fields: fields,
      filter: filter,
      noTracking: true
    }
  });

  const response = typeof LoadEntities === 'undefined' ? null : LoadEntities;
  if (!response || response.ok === false) {
    throw new Error(
      response && response.msg
        ? response.msg
        : `No fue posible consultar la entidad ${entity}.`
    );
  }

  return Array.isArray(response.outData) ? response.outData : [];
}

function updateProcessUser(processId, userEmail) {
  doCmd({
    cmd: "SetField",
    data: {
      entity: "Proceso",
      entityId: processId,
      fieldValue: `[Usuario]='${escapeSqlString(userEmail)}'`
    }
  });

  if (typeof SetField === "undefined" || !SetField || !SetField.ok) {
    throw new Error(
      SetField && SetField.msg
        ? SetField.msg
        : `No fue posible actualizar el usuario del proceso ${processId}.`
    );
  }
}

function approveWorkflow(processId) {
  doCmd({
    cmd: "GotoStep",
    data: {
      procesoId: processId,
      estado: "ACTIVE"
    }
  });

  if (typeof GotoStep === "undefined" || !GotoStep || !GotoStep.ok) {
    throw new Error(
      GotoStep && GotoStep.msg
        ? GotoStep.msg
        : `No fue posible aprobar el workflow ${processId}.`
    );
  }
}

function issuePolicy(policyId) {
  doCmd({
    cmd: "IssuePolicy",
    data: {
      policyId: policyId,
      state: "ACTIVE"
    }
  });

  if (typeof IssuePolicy === "undefined" || !IssuePolicy || !IssuePolicy.ok) {
    throw new Error(
      IssuePolicy && IssuePolicy.msg
        ? IssuePolicy.msg
        : `No fue posible emitir la póliza ${policyId}.`
    );
  }
}

function hasActiveDate(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function getPositiveInteger(value) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 0;
}

function getTrimmedString(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeSqlString(value) {
  return String(value === null || value === undefined ? "" : value).replace(/'/g, "''");
}

/*
  @test
  { row: { policyId: 3490, loteId: 330, userEmail: "usuario@empresa.com" } }
*/
