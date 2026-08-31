//block
//noreplace

/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2025/11/10
 * @name cmdGenericPayoutValidations
 * @version 1.1
 * @purpose: Validate the required data of a claim payment before continuing.
 * @context: { id: number }
 */

try {
  const processId = toPositiveInteger(context && context.id);
  if (processId <= 0) {
    return buildResult(false, 'No se recibió un identificador de proceso válido.');
  }

  // Resolve the payment associated with the process before validating its data.
  doCmd({
    cmd: 'LoadEntity',
    data: {
      entity: 'ClaimPayment',
      fields: 'id',
      filter: `processId = ${processId}`,
      noTracking: true
    }
  });

  const paymentLookup = getCommandResult('LoadEntity');
  if (!paymentLookup.ok) {
    return buildResult(false, paymentLookup.msg || 'No fue posible cargar el pago.');
  }

  const paymentId = toPositiveInteger(paymentLookup.outData && paymentLookup.outData.id);
  if (paymentId <= 0) {
    return buildResult(false, `No se encontró un pago para el proceso ${processId}.`);
  }

  doCmd({
    cmd: 'RepoClaimPayment',
    data: {
      operation: 'GET',
      filter: `id = ${paymentId}`,
      noTracking: true
    }
  });

  const paymentResponse = getCommandResult('RepoClaimPayment');
  if (!paymentResponse.ok) {
    return buildResult(false, paymentResponse.msg || 'No fue posible cargar el pago.');
  }

  const payment = getFirstRow(paymentResponse.outData);
  if (!payment) {
    return buildResult(false, `No se encontró el pago ${paymentId}.`);
  }

  const requiredFields = {
    sourceAccountId: 'Cuenta Origen',
    paymentType: 'Tipo de Pago'
  };
  const errors = [];

  Object.keys(requiredFields).forEach(field => {
    const value = payment[field];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(requiredFields[field]);
    }
  });

  if (errors.length > 0) {
    return {
      ok: false,
      response: 'No',
      message: `Solicitud incompleta, los siguientes campos son requeridos => ${errors.join(', ')}`
    };
  }

  return {
    ok: true,
    response: 'Si',
    message: 'Validación exitosa.'
  };
} catch (error) {
  return buildResult(false, error && error.message ? error.message : String(error));
}

function getCommandResult(commandName) {
  let result = null;
  if (commandName === 'LoadEntity') {
    result = typeof LoadEntity === 'undefined' ? null : LoadEntity;
  } else if (commandName === 'RepoClaimPayment') {
    result = typeof RepoClaimPayment === 'undefined' ? null : RepoClaimPayment;
  }
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

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function buildResult(ok, message) {
  return {
    ok: ok,
    response: ok ? 'Si' : 'No',
    message: message
  };
}
