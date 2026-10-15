//block
//noreplace

/*
 * @name cmdUpdateRenewalActuarialAge
 * @purpose Actualiza la edad actuarial del objeto asegurado de una oferta de renovacion.
 * @context { offerPolicyId }
 * @scope Ramos 20, 31 y 71; solo polizas con policyVersion > 0.
 */

try {
  const offerPolicyId = getPositiveInteger(context && context.offerPolicyId);
  if (offerPolicyId <= 0) {
    throw new Error('El identificador de la oferta de renovacion es requerido y debe ser valido.');
  }

  const policy = loadPolicy(offerPolicyId);
  if (!policy) {
    throw new Error(`No se encontro la oferta de renovacion ${offerPolicyId}.`);
  }

  const lob = String(policy.lob || '').trim();
  if (Number(policy.policyVersion || 0) <= 0 || !['20', '31', '71'].includes(lob)) {
    return { ok: true, updated: 0, skipped: 1, msg: 'La oferta no requiere recalculo de edad actuarial.' };
  }

  const startDate = parseDateOnly(policy.start);
  if (!startDate) {
    throw new Error(`La oferta ${offerPolicyId} no tiene una fecha inicial de vigencia valida.`);
  }

  const birthDate = loadMainInsuredBirth(offerPolicyId);
  if (!birthDate) {
    return { ok: true, updated: 0, skipped: 1, msg: 'No se encontro fecha de nacimiento del asegurado principal.' };
  }

  const age = calculateAge(birthDate, startDate);
  const definitionId = loadObjectDefinitionId();
  if (definitionId <= 0) {
    return { ok: true, updated: 0, skipped: 1, msg: 'La poliza no tiene definido el objeto DT_ACCIDENTES_V1.' };
  }

  const objects = loadInsuredObjects(offerPolicyId, definitionId);
  const statements = [];
  objects.forEach(object => {
    const form = parseForm(object && object.jValues);
    const field = form.find(item => item && item.name === 'txtEdadSuscripcion');
    if (!field) return;

    field.userData = [String(age)];
    statements.push(
      `UPDATE InsuredObject SET jValues = '${escapeSql(JSON.stringify(form))}' WHERE id = ${getPositiveInteger(object.id)};`
    );
  });

  if (statements.length) {
    doCmd({ cmd: 'DoQuery', data: { sql: statements.join('\n') } });
    if (typeof DoQuery === 'undefined' || !DoQuery || DoQuery.ok === false) {
      throw new Error(DoQuery && DoQuery.msg
        ? DoQuery.msg
        : 'No fue posible actualizar la edad actuarial de la renovacion.');
    }
  }

  return {
    ok: true,
    updated: statements.length,
    skipped: objects.length - statements.length,
    age: age,
    effectiveDate: policy.start,
    msg: `Edad actuarial actualizada a ${age} para la vigencia de renovacion.`
  };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError('@' + message);
}

function loadPolicy(policyId) {
  doCmd({
    cmd: 'LoadEntity',
    data: {
      entity: 'LifePolicy',
      filter: `id=${policyId}`,
      fields: 'id,lob,policyVersion,[start]',
      noTracking: true
    }
  });

  if (typeof LoadEntity === 'undefined' || !LoadEntity || LoadEntity.ok === false) {
    throw new Error(LoadEntity && LoadEntity.msg
      ? LoadEntity.msg
      : `No fue posible cargar la oferta ${policyId}.`);
  }

  return LoadEntity.outData || null;
}

function loadMainInsuredBirth(policyId) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'Insured',
      fields: 'id,contactId,role',
      filter: `lifePolicyId=${policyId} AND role=0`,
      noTracking: true
    }
  });

  if (typeof LoadEntities === 'undefined' || !LoadEntities || LoadEntities.ok === false) {
    throw new Error(LoadEntities && LoadEntities.msg
      ? LoadEntities.msg
      : `No fue posible cargar el asegurado principal de la oferta ${policyId}.`);
  }

  const insured = Array.isArray(LoadEntities.outData) ? LoadEntities.outData[0] : null;
  const contactId = getPositiveInteger(insured && insured.contactId);
  if (contactId <= 0) return null;

  doCmd({
    cmd: 'LoadEntity',
    data: {
      entity: 'Contact',
      filter: `id=${contactId}`,
      fields: 'id,[birth]',
      noTracking: true
    }
  });

  if (typeof LoadEntity === 'undefined' || !LoadEntity || LoadEntity.ok === false) {
    throw new Error(LoadEntity && LoadEntity.msg
      ? LoadEntity.msg
      : `No fue posible cargar el contacto ${contactId}.`);
  }

  return LoadEntity.outData && LoadEntity.outData.birth;
}

function loadObjectDefinitionId() {
  doCmd({
    cmd: 'RepoObjectDefinition',
    data: {
      operation: 'GET',
      filter: "code = 'DT_ACCIDENTES_V1'",
      noTracking: true
    }
  });

  if (typeof RepoObjectDefinition === 'undefined' || !RepoObjectDefinition || RepoObjectDefinition.ok === false) {
    throw new Error(RepoObjectDefinition && RepoObjectDefinition.msg
      ? RepoObjectDefinition.msg
      : 'No fue posible recuperar la definicion DT_ACCIDENTES_V1.');
  }

  const definition = Array.isArray(RepoObjectDefinition.outData)
    ? RepoObjectDefinition.outData[0]
    : RepoObjectDefinition.outData;
  return getPositiveInteger(definition && definition.id);
}

function loadInsuredObjects(policyId, definitionId) {
  doCmd({
    cmd: 'RepoInsuredObject',
    data: {
      operation: 'GET',
      filter: `lifePolicyId = ${policyId} AND objectDefinitionId = ${definitionId}`,
      noTracking: true
    }
  });

  if (typeof RepoInsuredObject === 'undefined' || !RepoInsuredObject || RepoInsuredObject.ok === false) {
    throw new Error(RepoInsuredObject && RepoInsuredObject.msg
      ? RepoInsuredObject.msg
      : `No fue posible recuperar los objetos asegurados de la oferta ${policyId}.`);
  }

  return Array.isArray(RepoInsuredObject.outData) ? RepoInsuredObject.outData : [];
}

function parseForm(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];

  try {
    const form = JSON.parse(value);
    return Array.isArray(form) ? form : [];
  } catch (error) {
    throw new Error('El formulario DT_ACCIDENTES_V1 no contiene un JSON valido.');
  }
}

function calculateAge(birthValue, effectiveDate) {
  const birth = parseDateOnly(birthValue);
  if (!birth) throw new Error('La fecha de nacimiento del asegurado no es valida.');

  let age = effectiveDate.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = effectiveDate.getUTCMonth() < birth.getUTCMonth()
    || (effectiveDate.getUTCMonth() === birth.getUTCMonth()
      && effectiveDate.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function parseDateOnly(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month
    && date.getUTCDate() === day
    ? date
    : null;
}

function getPositiveInteger(value) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 0;
}

function escapeSql(value) {
  return String(value ?? '').replace(/'/g, "''");
}
