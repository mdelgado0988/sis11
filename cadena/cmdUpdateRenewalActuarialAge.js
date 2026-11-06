//block
//noreplace

/*
 * @name cmdUpdateRenewalActuarialAge
 * @purpose Actualiza la edad actuarial y la depreciacion del objeto asegurado de una oferta de renovacion.
 * @context { offerPolicyId }
 * @scope Ramos 20, 31 y 71 para edad actuarial; ramo 6 para depreciacion. Solo polizas con policyVersion > 0.
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
  if (Number(policy.policyVersion || 0) <= 0) {
    return { ok: true, updated: 0, skipped: 1, msg: 'La oferta no requiere recalculo de edad actuarial.' };
  }

  if (lob === '6') {
    return updateAutoDepreciation(offerPolicyId, policy);
  }

  if (!['20', '31', '71'].includes(lob)) {
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
      fields: 'id,lob,productCode,policyVersion,[start]',
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

function updateAutoDepreciation(policyId, policy) {
  const configuration = loadAutoDepreciationConfiguration(policy && policy.productCode);
  if (!configuration) {
    return {
      ok: true,
      updated: 0,
      skipped: 1,
      msg: 'No existe una configuracion vigente de depreciacion para el plan de Automoviles.'
    };
  }

  const type = normalize(configuration.tipo_depreciacion);
  if (type === 'A' || type === 'N') {
    return {
      ok: true,
      updated: 0,
      skipped: 1,
      depreciationType: type,
      percentage: 0,
      msg: `No se aplica depreciacion para el tipo ${type}.`
    };
  }

  if (type !== 'P') {
    throw new Error(`Tipo de depreciacion invalido para el plan ${policy.productCode}: ${configuration.tipo_depreciacion}`);
  }

  const percentage = configuration.porcentaje_depreciacion === null
    || configuration.porcentaje_depreciacion === undefined
    || String(configuration.porcentaje_depreciacion).trim() === ''
    ? 0
    : Number(configuration.porcentaje_depreciacion);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error(`El porcentaje de depreciacion del plan ${policy.productCode} debe ser numerico y estar entre 0 y 100.`);
  }

  const insuredObject = loadAutoInsuredObject(policyId);
  if (!insuredObject) {
    return { ok: true, updated: 0, skipped: 1, percentage: percentage, msg: 'No se encontro el objeto asegurado DTAUT.' };
  }

  const fields = parseForm(insuredObject.jValues);
  const sumField = fields.find(item => item && normalize(item.name) === 'TXTSA');
  if (!sumField) {
    return { ok: true, updated: 0, skipped: 1, percentage: percentage, msg: 'No se encontro el campo txtSA en el objeto DTAUT.' };
  }

  const currentSum = parseNumericField(sumField.userData);
  if (!Number.isFinite(currentSum) || currentSum < 0) {
    throw new Error('La suma asegurada txtSA del objeto DTAUT no es numerica y valida.');
  }

  const newSum = roundMoney(currentSum - (currentSum * percentage / 100));
  setFieldUserData(sumField, newSum);
  saveInsuredObject(insuredObject, JSON.stringify(fields));

  return {
    ok: true,
    updated: 1,
    skipped: 0,
    depreciationType: type,
    percentage: percentage,
    previousSum: currentSum,
    newSum: newSum,
    msg: `Depreciacion de Automovil aplicada: ${currentSum} -> ${newSum} (${percentage}%).`
  };
}

function loadAutoDepreciationConfiguration(productCode) {
  doCmd({ cmd: 'GetFullTable', data: { table: 'cfgTarifaDepreciacionAuto' } });
  const response = typeof GetFullTable === 'undefined' ? null : GetFullTable;
  if (!response || response.ok === false || !Array.isArray(response.outData)) {
    throw new Error(response && response.msg
      ? response.msg
      : 'No fue posible leer la tabla cfgTarifaDepreciacionAuto.');
  }

  const rows = mapTableByHeaders(response.outData);
  const plan = normalize(productCode);
  return rows.find(row => normalize(row.cramo) === '6'
    && normalize(row.estado_plan) === 'V'
    && normalize(row.cplan) === plan) || null;
}

function mapTableByHeaders(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const first = data[0];
  const headers = (Array.isArray(first) ? first : Object.keys(first || {}).map(key => first[key]))
    .map(value => normalize(value));

  return data.slice(1).map(row => {
    const values = Array.isArray(row) ? row : Object.keys(row || {}).map(key => row[key]);
    const result = {};
    headers.forEach((header, index) => { result[header.toLowerCase()] = values[index]; });
    return result;
  });
}

function loadAutoInsuredObject(policyId) {
  doCmd({ cmd: 'LoadEntity', data: {
    entity: 'ObjectDefinition',
    fields: 'id,code',
    filter: "code = 'DTAUT'",
    noTracking: true
  } });
  if (typeof LoadEntity === 'undefined' || !LoadEntity || LoadEntity.ok === false) {
    throw new Error(LoadEntity && LoadEntity.msg
      ? LoadEntity.msg
      : 'No fue posible recuperar la definicion DTAUT.');
  }

  const definition = LoadEntity.outData;
  const definitionId = getPositiveInteger(definition && definition.id);
  if (definitionId <= 0) throw new Error('No se encontro la definicion DTAUT.');

  doCmd({ cmd: 'LoadEntity', data: {
    entity: 'InsuredObject',
    fields: 'id,objectDefinitionId,lifePolicyId,jValues',
    filter: `lifePolicyId = ${policyId} AND objectDefinitionId = ${definitionId}`,
    noTracking: true
  } });
  if (typeof LoadEntity === 'undefined' || !LoadEntity || LoadEntity.ok === false) {
    throw new Error(LoadEntity && LoadEntity.msg
      ? LoadEntity.msg
      : `No fue posible recuperar el objeto DTAUT de la oferta ${policyId}.`);
  }

  return LoadEntity.outData || null;
}

function saveInsuredObject(object, jValues) {
  doCmd({
    cmd: 'SetField',
    data: {
      entity: 'InsuredObject',
      entityId: object.id,
      fieldValue: `jValues='${escapeSql(jValues)}'`,
      raw: true
    }
  });
  if (typeof SetField === 'undefined' || !SetField || !SetField.ok) {
    throw new Error(SetField && SetField.msg
      ? SetField.msg
      : `No fue posible guardar el objeto asegurado ${object.id}.`);
  }
}

function parseForm(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];

  try {
    const form = JSON.parse(value);
    return Array.isArray(form) ? form : [];
  } catch (error) {
    throw new Error('El objeto asegurado no contiene un JSON valido en jValues.');
  }
}

function parseNumericField(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === null || raw === undefined || String(raw).trim() === '') return NaN;
  const normalized = String(raw).replace(/,/g, '').trim();
  return Number(normalized);
}

function setFieldUserData(field, value) {
  field.userData = Array.isArray(field.userData) ? [String(value)] : String(value);
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalize(value) {
  return String(value === null || value === undefined ? '' : value).trim().toUpperCase();
}

function escapeSql(value) {
  return String(value === null || value === undefined ? '' : value).replace(/'/g, "''");
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
