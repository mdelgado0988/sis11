//block
//noreplace
/**
 * Name: cmdAplicarRecuperacionCaja
 * Purpose: Cobro en caja de la recuperación de siniestro elegida en el formulario frmAplicacionRecuperacionCaja. Como
 *   regla previa de DoTransfer (ingreso aún en borrador) rechaza el ingreso si la recuperación ya no está pendiente, no
 *   es del tipo que corresponde al tipo de ingreso o está en otra moneda; como regla posterior (ingreso ejecutado) deja
 *   el pago en el movimiento de ingreso de la recuperación: estado 1, con el ingreso de caja, su monto y su moneda.
 * Author: AIDEN (MSN-000219, AXX-10616)
 */
/*
 * Entrada (context): la que arma el motor para una regla, { origin: { cmd: 'DoTransfer', data: { transferId } } }. Para
 *   probar: transferId en la raíz del contexto. El estado del ingreso decide qué se hace: borrador (status 0) se valida,
 *   ejecutado (status 1) se aplica; las dos reglas llaman a esta cadena.
 * Recuperación elegida: campo oculto hiddenRecuperacion de jIncomeTypeForm del ingreso (la fila de
 *   cmdRecuperacionesPendientesCaja en JSON). Sin ese valor, o con un tipo de ingreso sin fila en
 *   cfgTipoIngresoCajaRecuperacion, el ingreso sigue como hoy.
 * Pendiente: lo responde cmdRecuperacionesPendientesCaja con salvageId.
 * Pago: el movimiento IncomeExpense de la recuperación (salvageId): ingreso, estado 1, transferId del ingreso, monto y
 *   moneda del ingreso, contacto = comprador (o el cliente del formulario si la recuperación no tiene comprador). Si no
 *   existe se crea; si existe se reescribe la fila completa. Si ese movimiento tiene id 0 el ingreso se rechaza antes de
 *   ejecutarse, porque no se puede reescribir (ver sinIdActualizable).
 * Salida: { ok, msg }. Al validar, ok false corta el DoTransfer y msg es lo que ve el cajero.
 */
const CAMPO = 'hiddenRecuperacion';

const entrada = context || {};
const datos = (entrada.origin && entrada.origin.data) || {};
const transferId = entero(datos.transferId !== undefined && datos.transferId !== null ? datos.transferId : entrada.transferId);
let modo = 'validar';
let recuperacionId = 0;

try {
  const ingreso = leerIngreso();
  if (!ingreso) return { ok: true };
  const estado = Number(ingreso.status);
  if (estado === 1) {
    modo = 'aplicar';
    return aplicar(ingreso);
  }
  return estado === 0 ? validar(ingreso) : { ok: true };
} catch (e) {
  const detalle = e && e.message ? String(e.message).replace(/^@/, '') : String(e);
  if (modo === 'validar' && recuperacionId <= 0) return { ok: true, msg: 'Sin recuperación que validar: ' + detalle };
  return {
    ok: false,
    msg: (modo === 'validar' ? 'No se pudo validar' : 'No se pudo aplicar') + ' la recuperación ' + recuperacionId +
      ' del ingreso de caja #' + transferId + ': ' + detalle
  };
}

function validar(ingreso) {
  const elegida = recuperacionElegida(ingreso);
  if (!elegida) return { ok: true };
  recuperacionId = elegida.id;

  const consulta = pendientes(ingreso.incomeType, recuperacionId);
  if (consulta.tipoRecuperacion === null) return { ok: true };
  const fila = consulta.data[0];
  if (!fila) return { ok: false, msg: motivoNoPendiente(consulta, ingreso) };
  if (sinIdActualizable(movimientoDe(recuperacionId))) return { ok: false, msg: noActualizable() };
  if (texto(fila.currency) !== texto(ingreso.currency)) {
    return {
      ok: false,
      msg: 'La recuperación ' + recuperacionId + ' del siniestro ' + texto(fila.claimCode) + ' está en ' + texto(fila.currency) +
        ' y el ingreso de caja en ' + texto(ingreso.currency) + '. Registre el ingreso en ' + texto(fila.currency) +
        ' o elija otra recuperación.'
    };
  }
  return { ok: true };
}

function aplicar(ingreso) {
  const elegida = recuperacionElegida(ingreso);
  if (!elegida) return { ok: true, msg: 'El ingreso de caja #' + transferId + ' no cobra una recuperación.' };
  recuperacionId = elegida.id;

  const actual = movimientoDe(recuperacionId);
  if (actual && Number(actual.status) === 1 && entero(actual.transferId) === transferId) {
    return { ok: true, msg: 'La recuperación ' + recuperacionId + ' ya estaba aplicada con el ingreso de caja #' + transferId + '.' };
  }
  if (sinIdActualizable(actual)) return { ok: true, msg: noActualizable() + ' No se aplicó.' };

  const consulta = pendientes(ingreso.incomeType, recuperacionId);
  if (consulta.tipoRecuperacion === null) return { ok: true, msg: 'El tipo de ingreso ' + texto(ingreso.incomeType) + ' no cobra recuperaciones.' };
  const fila = consulta.data[0];
  if (!fila) throw new Error('@' + motivoNoPendiente(consulta, ingreso));

  const comprador = entero(fila.buyerId);
  const cliente = entero(valorCampo(ingreso, 'hiddenCodigoCliente'));
  const pago = {
    name: 'Recuperación ' + recuperacionId + ' · siniestro ' + texto(fila.claimCode) + ' · ingreso de caja #' + transferId,
    isIncome: true,
    amount: numero(ingreso.amount),
    currency: texto(ingreso.currency) || texto(fila.currency),
    status: 1,
    transferId: transferId,
    contactId: comprador > 0 ? comprador : (cliente > 0 ? cliente : null),
    salvageId: recuperacionId
  };

  const operacion = actual ? 'UPDATE' : 'ADD';
  const entidad = actual ? Object.assign({}, actual, pago, { date: new Date().toISOString() }) : pago;
  const r = doCmd({ cmd: 'RepoIncomeExpense', data: { operation: operacion, entity: entidad } });
  if (!r || r.ok === false) throw new Error('@' + mensaje(r));
  return {
    ok: true,
    msg: 'Recuperación ' + recuperacionId + ' del siniestro ' + texto(fila.claimCode) + ' aplicada con el ingreso de caja #' +
      transferId + ': ' + pago.currency + ' ' + pago.amount.toFixed(2) + '.'
  };
}

// Ingreso de caja de la regla (sólo las columnas que se usan), o null.
function leerIngreso() {
  if (transferId <= 0) return null;
  const r = doCmd({
    cmd: 'LoadEntity',
    data: { entity: 'Transfer', fields: 'id,incomeType,currency,amount,status,reversalDate,jIncomeTypeForm', filter: 'id = ' + transferId }
  });
  if (!r || r.ok === false) throw new Error('@No se pudo leer el ingreso de caja: ' + mensaje(r));
  return r.outData ? copia(r.outData) : null;
}

// { id } de la recuperación guardada en el formulario del ingreso, o null.
function recuperacionElegida(ingreso) {
  const valor = valorCampo(ingreso, CAMPO);
  if (!valor) return null;
  let fila = null;
  try {
    fila = JSON.parse(valor);
  } catch (e) {
    fila = { id: valor };
  }
  const id = entero(fila && typeof fila === 'object' ? fila.id : fila);
  return id > 0 ? { id: id } : null;
}

function valorCampo(ingreso, nombre) {
  let campos = [];
  try {
    campos = JSON.parse(texto(ingreso.jIncomeTypeForm) || '[]');
  } catch (e) {
    return '';
  }
  if (!Array.isArray(campos)) return '';
  const campo = campos.find(c => c && c.name === nombre);
  if (!campo || campo.userData === undefined || campo.userData === null) return '';
  return texto(Array.isArray(campo.userData) ? campo.userData[0] : campo.userData);
}

function pendientes(tipoIngreso, salvageId) {
  const r = doCmd({
    cmd: 'ExeChain',
    data: { chain: 'cmdRecuperacionesPendientesCaja', context: JSON.stringify({ incomeType: texto(tipoIngreso), salvageId: salvageId }) }
  });
  if (!r || r.ok === false) throw new Error('@No se pudo consultar la recuperación: ' + mensaje(r));
  const salida = copia(r.outData);
  const resultado = Array.isArray(salida) ? salida[0] : salida;
  if (!resultado || typeof resultado !== 'object') throw new Error('@La consulta de recuperaciones pendientes no devolvió datos.');
  return {
    tipoRecuperacion: resultado.tipoRecuperacion === undefined ? null : resultado.tipoRecuperacion,
    nombreTipoRecuperacion: texto(resultado.nombreTipoRecuperacion),
    data: Array.isArray(resultado.data) ? resultado.data : []
  };
}

// Por qué la recuperación elegida no figura como pendiente para el tipo de ingreso.
function motivoNoPendiente(consulta, ingreso) {
  const base = 'La recuperación ' + recuperacionId;
  const r = doCmd({
    cmd: 'LoadEntity',
    data: { entity: 'Salvage', fields: 'id,claimId,type,netIncome,entityState', filter: 'id = ' + recuperacionId }
  });
  const rec = r && r.outData ? copia(r.outData) : null;
  if (!rec) return base + ' elegida en el ingreso ya no existe. Elija otra recuperación o quite la selección.';
  if (entero(rec.type) !== entero(consulta.tipoRecuperacion)) {
    return base + ' no es de tipo ' + consulta.nombreTipoRecuperacion + ', el que corresponde al tipo de ingreso ' +
      texto(ingreso.incomeType) + '. Elija otra recuperación o cambie el tipo de ingreso.';
  }
  const aplicado = movimientoDe(recuperacionId);
  if (aplicado && Number(aplicado.status) === 1 && entero(aplicado.transferId) > 0 && entero(aplicado.transferId) !== transferId) {
    return base + ' ya fue cobrada con el ingreso de caja #' + entero(aplicado.transferId) + '. Elija otra recuperación o quite la selección.';
  }
  return base + ' ya no está pendiente (anulada o sin saldo). Elija otra recuperación o quite la selección.';
}

// Un movimiento con id 0 (la primera fila de una tabla vaciada y renumerada desde 0) no se puede reescribir por Repo:
// el motor lo toma como fila nueva y choca con el índice único de salvageId, y ese error deja la operación de caja en
// error aunque ya se haya hecho. Por eso se valida antes de ejecutar y nunca se intenta escribir.
function sinIdActualizable(movimiento) {
  return Boolean(movimiento) && entero(movimiento.id) <= 0;
}

function noActualizable() {
  return 'El movimiento de ingreso de la recuperación ' + recuperacionId + ' tiene id 0 y el sistema no puede ' +
    'actualizarlo, así que esta recuperación no se puede cobrar en caja. Avise a soporte.';
}

// El movimiento de ingreso de la recuperación (el de menor id si hubiera más de uno), fila completa, o null.
function movimientoDe(salvageId) {
  const r = doCmd({
    cmd: 'LoadEntities',
    data: {
      entity: 'IncomeExpense',
      fields: 'id,name,isIncome,amount,currency,status,categoryCode,processId,paymentId,transferId,contactId,date,salvageId',
      filter: 'salvageId = ' + salvageId
    }
  });
  if (!r || r.ok === false) throw new Error('@No se pudo leer el movimiento de la recuperación: ' + mensaje(r));
  const filas = copia(r.outData);
  if (!Array.isArray(filas) || filas.length === 0) return null;
  return filas.sort((a, b) => Number(a.id) - Number(b.id))[0];
}

function copia(valor) {
  return valor === undefined || valor === null ? null : JSON.parse(JSON.stringify(valor));
}

function texto(valor) {
  return valor === undefined || valor === null ? '' : String(valor).trim();
}

// Entero no negativo escrito sólo con dígitos (admite 12.0 de los números del motor); -1 en cualquier otro caso.
function entero(valor) {
  const t = texto(valor).replace(/\.0+$/, '');
  return /^\d+$/.test(t) ? Number(t) : -1;
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function mensaje(respuesta) {
  return respuesta && respuesta.msg ? String(respuesta.msg) : 'sin respuesta';
}
