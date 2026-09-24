//block
//noreplace

/*
 * @name cmdActualizarValoresRenovacionGAP
 * @purpose Accumulates the monthly GAP value in the renewal offer form.
 * @context { offerPolicyId }
 * @scope Only lob 20 and product GAP.
 */

try {
  const offerPolicyId = getPositiveInteger(context && context.offerPolicyId);
  if (offerPolicyId <= 0) {
    throw new Error('El identificador de la oferta es requerido y debe ser válido.');
  }

  const offerIds = [offerPolicyId];

  if (!offerIds.length) {
    return { ok: true, updated: 0, skipped: 0, msg: 'No se encontró una oferta GAP del ramo 20.' };
  }

  const policies = loadGapOffers(offerIds);
  if (!policies.length) {
    return { ok: true, updated: 0, skipped: offerIds.length, msg: 'El lote no contiene ofertas GAP del ramo 20.' };
  }

  const definitionId = loadObjectDefinitionId();
  if (definitionId <= 0) {
    throw new Error('No existe el objeto asegurado DT_ACCIDENTES_V1.');
  }

  const statements = [];
  let updated = 0;
  let skipped = offerIds.length - policies.length;

  policies.forEach(policy => {
    const insuredObject = loadInsuredObject(policy.id, definitionId);
    if (!insuredObject) {
      skipped += 1;
      return;
    }

    const form = parseForm(insuredObject.jValues);
    const fields = getFormFields(form);
    if (!fields.valorActual || !fields.montoMensual || !fields.valorFinal || !fields.valorFaltante) {
      skipped += 1;
      return;
    }

    const valorActual = parseAmount(getFieldValue(fields.valorActual));
    const montoMensual = parseAmount(getFieldValue(fields.montoMensual));
    const valorFinal = parseAmount(getFieldValue(fields.valorFinal));
    const nuevoValorActual = valorActual + montoMensual;
    const nuevoValorFaltante = valorFinal - nuevoValorActual;

    setFieldValue(fields.valorActual, formatNumericValue(nuevoValorActual));
    setFieldValue(fields.valorFaltante, formatNumericValue(nuevoValorFaltante));

    statements.push(
      `UPDATE InsuredObject SET jValues = '${escapeSql(JSON.stringify(form))}' WHERE id = ${getPositiveInteger(insuredObject.id)};`
    );
    updated += 1;
  });

  if (statements.length) {
    doCmd({ cmd: 'DoQuery', data: { sql: statements.join('\n') } });
    if (typeof DoQuery === 'undefined' || !DoQuery || DoQuery.ok === false) {
      throw new Error(DoQuery && DoQuery.msg
        ? DoQuery.msg
        : 'No fue posible actualizar los valores de las ofertas GAP.');
    }
  }

  return {
    ok: true,
    updated: updated,
    skipped: skipped,
    msg: `Se actualizaron ${updated} oferta(s) GAP del ramo 20.`
  };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError('@' + message);
}

function loadGapOffers(offerIds) {
  doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'LifePolicy',
      fields: 'id,lob,productCode',
      filter: `id in (${offerIds.join(',')}) AND lob = 20 AND productCode = 'GAP'`,
      noTracking: true
    }
  });

  if (typeof LoadEntities === 'undefined' || !LoadEntities || LoadEntities.ok === false) {
    throw new Error(LoadEntities && LoadEntities.msg
      ? LoadEntities.msg
      : 'No fue posible recuperar las ofertas GAP del ramo 20.');
  }

  return Array.isArray(LoadEntities.outData) ? LoadEntities.outData : [];
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
      : 'No fue posible recuperar la definición DT_ACCIDENTES_V1.');
  }

  const definition = Array.isArray(RepoObjectDefinition.outData)
    ? RepoObjectDefinition.outData[0]
    : RepoObjectDefinition.outData;
  return getPositiveInteger(definition && definition.id);
}

function loadInsuredObject(policyId, definitionId) {
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
      : `No fue posible recuperar el objeto asegurado de la oferta ${policyId}.`);
  }

  return Array.isArray(RepoInsuredObject.outData) ? RepoInsuredObject.outData[0] : null;
}

function parseForm(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];

  try {
    const form = JSON.parse(value);
    return Array.isArray(form) ? form : [];
  } catch (error) {
    throw new Error('El formulario DT_ACCIDENTES_V1 de la oferta no contiene un JSON válido.');
  }
}

function getFormFields(form) {
  return {
    valorActual: form.find(field => field && field.name === 'txtValorActual'),
    montoMensual: form.find(field => field && field.name === 'txtMontoMensual'),
    valorFinal: form.find(field => field && field.name === 'txtValorFinal'),
    valorFaltante: form.find(field => field && field.name === 'txtValorFaltante')
  };
}

function getFieldValue(field) {
  return Array.isArray(field && field.userData) ? field.userData[0] : '';
}

function setFieldValue(field, value) {
  field.userData = [value];
}

function parseAmount(value) {
  const numberValue = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumericValue(value) {
  return Number(Number(value || 0).toFixed(2)).toString();
}

function escapeSql(value) {
  return String(value ?? '').replace(/'/g, "''");
}

function getPositiveInteger(value) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 0;
}
