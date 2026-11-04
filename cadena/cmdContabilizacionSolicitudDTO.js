//block
//noreplace
/**
 * @author Michael Delgado
 * @created 2026-01-15
 * @name cmdContabilizacionSolicitudDTO
 * @summary Contexto para plantilla contable de pago de solicitudes de pago, no pagos de reclamo.
 * @param context.id Id del pago, debe ser un pago de solicitud.
 * @test: { id: 23 }
 * @version 1.1 (2026-11-04, AXX-7255 / ExeControl 11385) Devuelve cuentaDebe y cuentaHabe del tipo de pago (tabla
 *   CuentaTipoPagoSolicitud). Si la fila no trae CuentaHabe, el Haber es la cuenta contable de la cuenta origen de la
 *   solicitud y, si no tiene, la de la tabla CuentaOrigenAutomatica (IdCuenta, CodigoCuenta, CuentaContable).
 *   Devuelve tipoPago para el texto de las líneas.
 */

/********************** Utilitarios ************************/

function texto(valor) {
  return valor === null || valor === undefined ? "" : String(valor).trim();
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

function cuentaContableDeCuenta(cuentaId) {
  if (!(Number(cuentaId) > 0))
    return "";

  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "Account",
      filter: `id=${Number(cuentaId)}`,
      fields: "catalogAccountCode"
    }
  });

  const cuenta = LoadEntity.outData;
  return cuenta ? texto(cuenta.catalogAccountCode) : "";
}

/********************** Datos de la solicitud de pago ************************/

log('Iniciando recuperación DTO pago');

doCmd({ 
  cmd: "GetPing",
  data: {
    contexto: context.id
  }
}); 

const id = context.id ?? 0;

log('Recuperando datos del pago');

doCmd({
  cmd: "LoadEntity",
  data: {
    entity: "ClaimPayment",
    filter: `id=${id}`,
    fields: "claimId,total,processId,payoutId, sourceAccountId, paymentType"
  }
});

const payment  = LoadEntity.outData;
if(!payment)
  throw "No se recuperó ninguna solicitud";

if(payment.claimId && payment.claimId > 0)
  throw "Esto es una solicitud de reclamo";

const tipoPagoCode = payment.paymentType ?? "0";

if(tipoPagoCode == "0" || tipoPagoCode == "")
  throw "Solicitud no posee un tipo de pago válido";

/********************** Datos del tipo de pago ************************/

doCmd({
  cmd: "LoadEntity",
  data: {
    entity: "PaymentTypeCatalog",
    filter: `code=${tipoPagoCode}`,
    fields: "name"
  }
});

const tipoPagoData = LoadEntity.outData;
if(!tipoPagoData)
  throw "No se recuperó ningún tipo de pago válido";

const tipoPago = texto(tipoPagoData.name);

if(tipoPago == "")
  throw "No se recuperó ningún tipo de pago válido";

/********************** Cuentas del tipo de pago ************************/

log('Recuperando cuentas del tipo de pago');

const cuentasTipoPago = leerTabla("CuentaTipoPagoSolicitud");
if(!cuentasTipoPago)
  throw "No se pudo leer la tabla CuentaTipoPagoSolicitud";

let filaTipoPago = null;
for (let i = 0; i < cuentasTipoPago.length; i++) {
  if (texto(cuentasTipoPago[i].CodigoTipoPago) == texto(tipoPagoCode)) {
    filaTipoPago = cuentasTipoPago[i];
    break;
  }
}

if(!filaTipoPago)
  throw `El tipo de pago ${tipoPagoCode} (${tipoPago}) no está configurado en la tabla CuentaTipoPagoSolicitud`;

const cuentaDebe = texto(filaTipoPago.CuentaDebe);
if(cuentaDebe == "")
  throw `El tipo de pago ${tipoPagoCode} (${tipoPago}) no tiene CuentaDebe en la tabla CuentaTipoPagoSolicitud`;

/********************** Datos de la cuenta origen ************************/

log('Recuperando cuenta contable de la cuenta origen');

const cuentaOrigenId = payment.sourceAccountId ?? null;
const cuentaBancaria = cuentaContableDeCuenta(cuentaOrigenId);

let cuentaHabe = texto(filaTipoPago.CuentaHabe);
let cuentaOrigenAutomatica = false;
let cuentaOrigenAutomaticaId = null;

if(cuentaHabe == "") {
  cuentaHabe = cuentaBancaria;

  if(cuentaHabe == "") {
    log('La cuenta origen no tiene cuenta contable: se usa la tabla CuentaOrigenAutomatica');

    const automaticas = leerTabla("CuentaOrigenAutomatica");
    if(!automaticas)
      throw `La cuenta origen ${cuentaOrigenId} no tiene cuenta contable y no se pudo leer la tabla CuentaOrigenAutomatica`;

    for (let i = 0; i < automaticas.length && cuentaHabe == ""; i++) {
      const idAutomatica = Number(texto(automaticas[i].IdCuenta)) || null;
      cuentaHabe = texto(automaticas[i].CuentaContable);
      if(cuentaHabe == "")
        cuentaHabe = cuentaContableDeCuenta(idAutomatica);
      if(cuentaHabe != "")
        cuentaOrigenAutomaticaId = idAutomatica;
    }

    if(cuentaHabe == "")
      throw `La cuenta origen ${cuentaOrigenId} no tiene cuenta contable y la tabla CuentaOrigenAutomatica no define una`;

    cuentaOrigenAutomatica = true;
  }

  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "CatalogAccount",
      filter: `code='${cuentaHabe.replace(/'/g, "''")}'`,
      fields: "code"
    }
  });

  if(!LoadEntity.outData)
    throw `La cuenta contable ${cuentaHabe} no existe en el catálogo de cuentas`;
}

const notaCuentaOrigen = cuentaOrigenAutomatica
  ? ` (cuenta origen automática${cuentaOrigenAutomaticaId ? " " + cuentaOrigenAutomaticaId : ""})`
  : "";

/********************** Retornando DTO ************************/

log('Retornando DTO');

return [{ 
  monto: payment.total,
  cuentaBancaria: cuentaBancaria,
  cuentaDebe: cuentaDebe,
  cuentaHabe: cuentaHabe,
  cuentaOrigenId: cuentaOrigenId,
  cuentaOrigenAutomatica: cuentaOrigenAutomatica,
  cuentaOrigenAutomaticaId: cuentaOrigenAutomaticaId,
  notaCuentaOrigen: notaCuentaOrigen,
  tipoPago: tipoPago,
  code: "PagoSolicitud",
  referencia: `Pago de Solicitud # ${id}`,
  description: `Pago de Solicitud ${id} ${tipoPago}`,
  tipoPagoCode: tipoPagoCode,
  unique: `TX-S#${id}`,
  id: id
}]
