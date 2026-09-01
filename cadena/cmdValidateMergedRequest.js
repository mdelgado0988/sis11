//block
//noreplace

/**
 * @author Michael Delgado
 * @email support@axxis-systems.com
 * @created 2026/09/01
 * @name cmdValidateMergedRequest
 * @version 1.0
 * @purpose: Validate payment type and source account for multiple claim payments.
 * @context: number[] | { ids: number[] }
 */

try {
  const ids = getRequestIds(context);
  if (ids.length === 0) {
    return buildResult(false, 'No se recibió un arreglo de solicitudes válido.');
  }

  const results = [];
  ids.forEach(paymentId => {
    results.push(validatePayment(paymentId));
  });

  const valid = results.every(result => result.ok);
  const invalidResults = results.filter(result => !result.ok);
  const message = valid
    ? 'Validación exitosa.'
    : invalidResults.map(result => `Solicitud ${result.id}: ${result.message}`).join(' | ');

  return buildResult(valid, message);
} catch (error) {
  return buildResult(false, error && error.message ? error.message : String(error));
}

function validatePayment(paymentId) {
  doCmd({
    cmd: 'RepoClaimPayment',
    data: {
      operation: 'GET',
      fields: 'id,paymentType,sourceAccountId',
      filter: `id = ${paymentId}`,
      noTracking: true
    }
  });

  const response = getCommandResult();
  if (!response.ok) {
    return {
      id: paymentId,
      ok: false,
      response: 'No',
      missingFields: [],
      message: response.msg || 'No fue posible cargar la solicitud.'
    };
  }

  const payment = getFirstRow(response.outData);
  if (!payment) {
    return {
      id: paymentId,
      ok: false,
      response: 'No',
      missingFields: [],
      message: `No se encontró la solicitud ${paymentId}.`
    };
  }

  const requiredFields = {
    paymentType: 'Tipo de Pago',
    sourceAccountId: 'Cuenta Origen'
  };
  const missingFields = Object.keys(requiredFields)
    .filter(field => isEmpty(payment[field]))
    .map(field => requiredFields[field]);

  return {
    id: paymentId,
    ok: missingFields.length === 0,
    response: missingFields.length === 0 ? 'Si' : 'No',
    missingFields: missingFields,
    message: missingFields.length === 0
      ? 'Validación exitosa.'
      : `Solicitud incompleta, los siguientes campos son requeridos => ${missingFields.join(', ')}`
  };
}

function getRequestIds(value) {
  const source = Array.isArray(value)
    ? value
    : value && Array.isArray(value.ids)
      ? value.ids
      : [];

  return source
    .map(toPositiveInteger)
    .filter((id, index, list) => id > 0 && list.indexOf(id) === index);
}

function getCommandResult() {
  const result = typeof RepoClaimPayment === 'undefined' ? null : RepoClaimPayment;
  return {
    ok: Boolean(result && result.ok),
    msg: result && result.msg ? result.msg : '',
    outData: result ? result.outData : null
  };
}

function getFirstRow(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value && typeof value === 'object' ? value : null;
}

function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function buildResult(ok, message) {
  return {
    ok: ok,
    msg: message
  };
}
