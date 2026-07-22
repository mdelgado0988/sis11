//block
//noreplace

/**
 * @name cmdValidatePolicyReinsuranceAnniversary
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/07/22
 * @version 1.0
 * @purpose Update NEW policy reinsurance cessions to ANNIVERSARY after version validation.
 * @context { policyId: number }
 */

try {
  const policyId = getPositiveInteger(context && context.policyId);
  if (policyId <= 0) {
    throw new Error('El policyId es requerido y debe ser válido.');
  }

  const policy = loadPolicy(policyId);
  const policyVersion = getPositiveInteger(policy && policy.policyVersion);

  if (policyVersion <= 0) {
    throw new Error(`La póliza ${policyId} no tiene una versión válida para actualizar el reaseguro.`);
  }

  const cessions = loadNewCessions(policyId);
  let updated = 0;

  cessions.forEach(cession => {
    updateCessionType(cession.id);
    updated += 1;
  });

  return {
    ok: true,
    msg: updated > 0
      ? `Se actualizaron ${updated} cesión(es) de reaseguro a ANNIVERSARY.`
      : 'No se encontraron cesiones NEW para actualizar.'
  };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError(`@${message}`);
}

function loadPolicy(policyId) {
  doCmd({
    cmd: 'LoadEntity',
    data: {
      entity: 'LifePolicy',
      fields: 'id,policyVersion',
      filter: `id=${policyId}`,
      noTracking: true
    }
  });

  const response = typeof LoadEntity === 'undefined' ? null : LoadEntity;
  if (!response || response.ok === false) {
    throw new Error(
      response && response.msg
        ? response.msg
        : `No fue posible cargar la póliza ${policyId}.`
    );
  }

  return response.outData || null;
}

function loadNewCessions(policyId) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'Cession',
      fields: 'id,premiumType',
      filter: `lifePolicyId=${policyId} AND premiumType='NEW'`,
      noTracking: true
    }
  });

  const response = typeof LoadEntities === 'undefined' ? null : LoadEntities;
  if (!response || response.ok === false) {
    throw new Error(
      response && response.msg
        ? response.msg
        : `No fue posible cargar las cesiones de la póliza ${policyId}.`
    );
  }

  return Array.isArray(response.outData)
    ? response.outData.filter(cession => getPositiveInteger(cession && cession.id) > 0)
    : [];
}

function updateCessionType(cessionId) {
  doCmd({
    cmd: 'SetField',
    data: {
      entity: 'Cession',
      entityId: cessionId,
      fieldValue: "premiumType='ANNIVERSARY'"
    }
  });

  if (typeof SetField === 'undefined' || !SetField || SetField.ok === false) {
    throw new Error(
      SetField && SetField.msg
        ? SetField.msg
        : `No fue posible actualizar la cesión ${cessionId}.`
    );
  }
}

function getPositiveInteger(value) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 0;
}

/*
 * @test
 * { policyId: 3437 }
 */
