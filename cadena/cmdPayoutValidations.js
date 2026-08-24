//block
//noreplace

/*
 * @name cmdPayoutValidations
 * @version 1.1
 * @purpose Validate the required data of a claim payment request.
 * @context Receives context.id with the RepoClaimPayment identifier.
 */

try {
  const input = context || {};
  const paymentId = getPositiveInteger(input.id);

  if (paymentId <= 0) {
    return {
      ok: true,
      response: 'No',
      message: 'No hay un identificador de pago válido para validar.'
    };
  }

  const payment = loadPayment(paymentId);
  if (!payment) {
    return {
      ok: true,
      response: 'No',
      message: `No se encontró el pago ${paymentId}.`
    };
  }

  const errors = getMissingFields(payment);
  if (errors.length > 0) {
    return {
      ok: true,
      response: 'No',
      message: `Solicitud incompleta, los siguientes campos son requeridos: ${errors.join(', ')}.`
    };
  }

  return {
    ok: true,
    response: 'Si',
    message: 'Validación exitosa.'
  };
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new TypeError(`@${message}`);
}

function getPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function getRows(value) {
  return value && Array.isArray(value.outData) ? value.outData : [];
}

function getTrimmedString(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function loadPayment(paymentId) {
  const result = doCmd({
    cmd: 'RepoClaimPayment',
    data: {
      operation: 'GET',
      filter: `id=${paymentId}`,
      noTracking: true
    }
  });

  if (!result || result.ok === false) {
    throw new Error(result && result.msg
      ? result.msg
      : 'No fue posible recuperar el pago.');
  }

  return getRows(result)[0] || null;
}

function getMissingFields(payment) {
  const requiredFields = [
    { name: 'sourceAccountId', label: 'Cuenta Origen' },
    { name: 'paymentType', label: 'Tipo de Pago' }
  ];

  return requiredFields
    .filter(field => isEmptyValue(payment[field.name]))
    .map(field => field.label);
}

function isEmptyValue(value) {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return getTrimmedString(value) === '';
  }

  return false;
}
