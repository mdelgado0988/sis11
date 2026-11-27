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
 * @version 1.2 (2026-11-26, AXX-11903 / MSN-000272) Retención de ITBMS tecleada en la vista 82 (línea RET código 5):
 *   devuelve itbmsRetenido (suma de las líneas RET código 5 de la solicitud y, si es una solicitud unificada, de sus
 *   hijas), montoDebe = total + itbmsRetenido y cuentaItbmsRetenido (280.02.01.15.01.00.00.00.000, validada en el
 *   catálogo cuando hay ITBMS). Sin ITBMS, montoDebe = total y el asiento no cambia.
 * @version 1.3 (2026-11-27, AXX-12159 / MSN-000285) Los tipos de pago con líneas en la tabla cfgTransaccionesTesoreria
 *   se contabilizan con la plantilla PagoTesoreria: para ellos esta cadena ejecuta ExeTransactionTemplate
 *   PagoTesoreria con la solicitud (la plantilla no repite un asiento ya generado) y devuelve [], así
 *   PagoSolicitudManual no genera un segundo asiento. Si PagoTesoreria falla, la cadena lanza su mensaje.
 */

/********************** Utilitarios ************************/

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

/********************** Tipos de pago de la plantilla PagoTesoreria ************************/

const transaccionesTesoreria = leerTabla("cfgTransaccionesTesoreria") || [];
if (transaccionesTesoreria.some(f => texto(f.IdTransaccion) == texto(tipoPagoCode))) {
  log(`El tipo de pago ${tipoPagoCode} se contabiliza con la plantilla PagoTesoreria (tabla cfgTransaccionesTesoreria)`);
  doCmd({
    cmd: "ExeTransactionTemplate",
    data: {
      code: "PagoTesoreria",
      scanContext: { id: id }
    }
  });
  const asiento = typeof ExeTransactionTemplate === "undefined" ? null : ExeTransactionTemplate;
  if (!asiento || asiento.ok === false)
    throw `La plantilla PagoTesoreria no generó el asiento de la solicitud ${id}: ${asiento ? asiento.msg : "sin respuesta"}`;
  log(`Solicitud ${id}: ${asiento.msg}`);
  return [];
}

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

/********************** Retención de ITBMS ************************/

log('Recuperando retención de ITBMS');

const CUENTA_ITBMS_RETENIDO = "280.02.01.15.01.00.00.00.000";

doCmd({
  cmd: "RepoClaimPayment",
  data: {
    operation: "GET",
    filter: `id=${Number(id)} OR parentId=${Number(id)}`,
    include: ["Taxes"]
  }
});

if(!RepoClaimPayment || RepoClaimPayment.ok === false)
  throw "No se pudieron leer las retenciones de la solicitud";

let itbmsRetenido = 0;
const solicitudes = Array.isArray(RepoClaimPayment.outData) ? RepoClaimPayment.outData : [];
for (let i = 0; i < solicitudes.length; i++) {
  const lineas = Array.isArray(solicitudes[i].Taxes) ? solicitudes[i].Taxes : [];
  for (let j = 0; j < lineas.length; j++)
    if(texto(lineas[j].valueAddedCode) == "5" && texto(lineas[j].taxType) == "RET")
      itbmsRetenido += Number(lineas[j].amount) || 0;
}
itbmsRetenido = redondear(itbmsRetenido);

const montoDebe = redondear(Number(payment.total) + itbmsRetenido);

if(itbmsRetenido != 0) {
  doCmd({
    cmd: "LoadEntity",
    data: {
      entity: "CatalogAccount",
      filter: `code='${CUENTA_ITBMS_RETENIDO}'`,
      fields: "code"
    }
  });

  if(!LoadEntity.outData)
    throw `La cuenta contable ${CUENTA_ITBMS_RETENIDO} de la retención de ITBMS no existe en el catálogo de cuentas`;
}

/********************** Retornando DTO ************************/

log('Retornando DTO');

return [{ 
  monto: payment.total,
  montoDebe: montoDebe,
  itbmsRetenido: itbmsRetenido,
  cuentaItbmsRetenido: CUENTA_ITBMS_RETENIDO,
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
