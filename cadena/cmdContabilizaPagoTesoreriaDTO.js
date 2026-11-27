//block
//noreplace
/**
 * @author aiden_mission_configurator
 * @created 2026-11-27
 * @name cmdContabilizaPagoTesoreriaDTO
 * @summary Contexto para la plantilla contable PagoTesoreria: pago de solicitudes manuales de tesorería (no pagos de
 *   reclamo). Las líneas salen de la tabla cfgTransaccionesTesoreria según el tipo de pago de la solicitud.
 * @param context.id Id de la solicitud de pago ejecutada (ClaimPayment), sin reclamo.
 * @test: { id: 23 }
 * @version 1.0 (2026-11-27, MSN-000285 / AXX-12159) Devuelve las variables de la solicitud con nombre
 *   (NumeroSolicitud, MontoCheque, MontoPago, Beneficiario, Concepto, NumeroReclamo, CodigoAsegurado, CodigoTipoPago,
 *   TipoPago, Moneda) y en lineas las filas de cfgTransaccionesTesoreria del tipo de pago (IdTransaccion,
 *   NombreTransaccion, Linea, VariableDebito, VariableCredito, CuentaContable, Descripcion) ya resueltas:
 *   VariableDebito y VariableCredito traen MontoCheque, MontoPago o un monto fijo que se contabiliza tal cual;
 *   Descripcion es texto con variables entre llaves, p. ej. {Concepto}. Devuelve [] si la solicitud tiene reclamo
 *   (la contabiliza PagoReclamo) o si su tipo de pago no está en la tabla (la contabiliza PagoSolicitudManual).
 *   Valida que la solicitud esté ejecutada, que las cuentas existan en el catálogo y que el asiento cuadre.
 */

/********************** Utilitarios ************************/

const TABLA_TRANSACCIONES = "cfgTransaccionesTesoreria";
const VARIABLES_MONTO = ["MontoCheque", "MontoPago"];

function texto(valor) {
  return valor === null || valor === undefined ? "" : String(valor).trim();
}

function redondear(valor) {
  return Math.round(((Number(valor) || 0) + Number.EPSILON) * 100) / 100;
}

function leerTabla(nombre) {
  doCmd({
    cmd: "GetFullTable",
    data: {
      table: nombre
    }
  });

  const respuesta = typeof GetFullTable === "undefined" ? null : GetFullTable;
  if (!respuesta || respuesta.ok === false)
    return null;

  const filas = Array.isArray(respuesta.outData) ? respuesta.outData : [];
  const encabezado = filas.length > 0 && Array.isArray(filas[0]) ? filas[0] : [];
  const registros = [];
  for (let i = 1; i < filas.length; i++) {
    const valores = Array.isArray(filas[i]) ? filas[i] : [];
    const registro = {};
    for (let j = 0; j < encabezado.length; j++)
      registro[texto(encabezado[j])] = valores[j];
    registros.push(registro);
  }
  return registros;
}

function nombreContacto(contactoId) {
  if (!(Number(contactoId) > 0))
    return "";

  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Contact",
      filter: `id=${Number(contactoId)}`,
      fields: "name,middleName,surname1,surname2"
    }
  });

  const contacto = LoadEntity.outData;
  if (!contacto)
    return "";
  return [contacto.name, contacto.middleName, contacto.surname1, contacto.surname2]
    .map(texto)
    .filter(function (parte) { return parte != ""; })
    .join(" ");
}

function valorMonto(campo, variables, fila) {
  const valor = texto(campo);
  if (valor == "")
    return 0;
  if (/^-?\d+(\.\d+)?$/.test(valor))
    return redondear(valor);
  if (VARIABLES_MONTO.indexOf(valor) >= 0)
    return redondear(variables[valor]);
  throw `La variable de monto "${valor}" de la línea ${texto(fila.Linea)} del tipo de pago ${texto(fila.IdTransaccion)} en la tabla ${TABLA_TRANSACCIONES} no existe. Use ${VARIABLES_MONTO.join(" o ")}, o un monto fijo`;
}

function textoDescripcion(plantilla, variables, fila) {
  return texto(plantilla).replace(/\{(\w+)\}/g, function (marca, nombre) {
    if (!Object.prototype.hasOwnProperty.call(variables, nombre))
      throw `La variable {${nombre}} de la descripción de la línea ${texto(fila.Linea)} del tipo de pago ${texto(fila.IdTransaccion)} en la tabla ${TABLA_TRANSACCIONES} no existe`;
    return texto(variables[nombre]);
  });
}

/********************** Datos de la solicitud de pago ************************/

log('Iniciando recuperación DTO pago tesorería');

const id = Number(context.id ?? 0);
if (!(id > 0))
  throw "No se recibió el id de la solicitud de pago";

log('Recuperando datos del pago');

doCmd({
  cmd: "RepoClaimPayment",
  data: {
    operation: "GET",
    filter: `id=${id} OR parentId=${id}`
  }
});

if (!RepoClaimPayment || RepoClaimPayment.ok === false)
  throw "No se pudo leer la solicitud de pago";

const solicitudes = Array.isArray(RepoClaimPayment.outData) ? RepoClaimPayment.outData : [];
const payment = solicitudes.find(function (s) { return Number(s.id) === id; });
if (!payment)
  throw "No se recuperó ninguna solicitud";

const esUnificada = texto(payment.producer).toUpperCase() == "MERGED";
const tieneReclamo = esUnificada
  ? solicitudes.some(function (s) { return Number(s.parentId) === id && Number(s.claimId) > 0; })
  : Number(payment.claimId) > 0;

if (tieneReclamo) {
  log('Solicitud de reclamo: la contabiliza PagoReclamo');
  return [];
}

const tipoPagoCode = texto(payment.paymentType);
if (tipoPagoCode == "")
  throw "Solicitud no posee un tipo de pago válido";

/********************** Transacciones del tipo de pago ************************/

log('Recuperando transacciones del tipo de pago');

const transacciones = leerTabla(TABLA_TRANSACCIONES);
if (!transacciones)
  throw `No se pudo leer la tabla ${TABLA_TRANSACCIONES}`;

const filasTipoPago = transacciones
  .filter(function (fila) { return texto(fila.IdTransaccion) == tipoPagoCode; })
  .sort(function (a, b) { return (Number(texto(a.Linea)) || 0) - (Number(texto(b.Linea)) || 0); });

if (filasTipoPago.length == 0) {
  log(`El tipo de pago ${tipoPagoCode} no está en ${TABLA_TRANSACCIONES}: lo contabiliza PagoSolicitudManual`);
  return [];
}

if (texto(payment.entityState) != "EXECUTED")
  throw `La solicitud ${id} no está ejecutada (estado ${texto(payment.entityState)}); se contabiliza al ejecutar el pago`;

/********************** Datos del tipo de pago ************************/

doCmd({
  cmd: "LoadEntity",
  data: {
    entity: "PaymentTypeCatalog",
    filter: `code='${tipoPagoCode}'`,
    fields: "name"
  }
});

const tipoPagoData = LoadEntity.outData;
if (!tipoPagoData)
  throw `El tipo de pago ${tipoPagoCode} no existe en el catálogo de tipos de pago`;

const tipoPago = texto(tipoPagoData.name);

/********************** Reclamo y asegurado ************************/

let numeroReclamo = "";
if (Number(payment.claimId) > 0) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Claim",
      filter: `id=${Number(payment.claimId)}`,
      fields: "code"
    }
  });
  numeroReclamo = LoadEntity.outData ? texto(LoadEntity.outData.code) : "";
}

let codigoAsegurado = "";
if (Number(payment.lifePolicyId) > 0) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "LifePolicy",
      filter: `id=${Number(payment.lifePolicyId)}`,
      fields: "holderId"
    }
  });
  codigoAsegurado = LoadEntity.outData ? texto(LoadEntity.outData.holderId) : "";
}

/********************** Variables de la solicitud ************************/

log('Armando variables de la solicitud');

const montoCheque = redondear(payment.total);
const montoBruto = redondear(payment.grossAmount);

const variables = {
  NumeroSolicitud: id,
  MontoCheque: montoCheque,
  MontoPago: montoBruto != 0 ? montoBruto : montoCheque,
  Beneficiario: nombreContacto(payment.contactId),
  Concepto: texto(payment.concept),
  NumeroReclamo: numeroReclamo,
  CodigoAsegurado: codigoAsegurado,
  CodigoTipoPago: tipoPagoCode,
  TipoPago: tipoPago,
  Moneda: texto(payment.currency)
};

/********************** Líneas del asiento ************************/

log('Resolviendo líneas de la tabla de transacciones');

const lineas = [];
for (let i = 0; i < filasTipoPago.length; i++) {
  const fila = filasTipoPago[i];
  const debe = valorMonto(fila.VariableDebito, variables, fila);
  const haber = valorMonto(fila.VariableCredito, variables, fila);
  if (debe == 0 && haber == 0)
    continue;

  const linea = texto(fila.Linea);
  if (debe != 0 && haber != 0)
    throw `La línea ${linea} del tipo de pago ${tipoPagoCode} en la tabla ${TABLA_TRANSACCIONES} tiene débito y crédito a la vez`;

  const cuenta = texto(fila.CuentaContable);
  if (cuenta == "")
    throw `La línea ${linea} del tipo de pago ${tipoPagoCode} en la tabla ${TABLA_TRANSACCIONES} no tiene cuenta contable`;

  lineas.push({
    linea: Number(linea) || i + 1,
    cuenta: cuenta,
    debe: debe,
    haber: haber,
    descripcion: textoDescripcion(fila.Descripcion, variables, fila)
  });
}

if (lineas.length == 0) {
  log('La solicitud no tiene montos que contabilizar');
  return [];
}

/********************** Validación de cuentas ************************/

log('Validando cuentas contables');

const cuentasValidadas = {};
for (let i = 0; i < lineas.length; i++) {
  const cuenta = lineas[i].cuenta;
  if (cuentasValidadas[cuenta])
    continue;

  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "CatalogAccount",
      filter: `code='${cuenta.replace(/'/g, "''")}'`,
      fields: "code"
    }
  });

  if (!LoadEntity.outData)
    throw `La cuenta contable ${cuenta} (tipo de pago ${tipoPagoCode}, línea ${lineas[i].linea}) no existe en el catálogo de cuentas. Corríjala en la tabla ${TABLA_TRANSACCIONES}`;
  cuentasValidadas[cuenta] = true;
}

/********************** Cuadre del asiento ************************/

let totalDebe = 0;
let totalHaber = 0;
for (let i = 0; i < lineas.length; i++) {
  totalDebe += lineas[i].debe;
  totalHaber += lineas[i].haber;
}
totalDebe = redondear(totalDebe);
totalHaber = redondear(totalHaber);

if (totalDebe != totalHaber)
  throw `El asiento del tipo de pago ${tipoPagoCode} (${tipoPago}) de la solicitud ${id} no cuadra: débitos ${totalDebe}, créditos ${totalHaber}. Revise los montos fijos de la tabla ${TABLA_TRANSACCIONES}`;

/********************** Retornando DTO ************************/

log('Retornando DTO');

return [Object.assign({}, variables, {
  lineas: lineas,
  totalDebe: totalDebe,
  totalHaber: totalHaber,
  tipoPagoCode: tipoPagoCode,
  tipoPago: tipoPago,
  code: "PagoTesoreria",
  referencia: `Pago Tesorería Solicitud # ${id}`,
  description: `Pago de Solicitud ${id} ${tipoPago}`,
  unique: `TX-PT#${id}`,
  id: id
})];
