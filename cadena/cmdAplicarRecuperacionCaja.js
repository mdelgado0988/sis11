//block
//noreplace
/**
 * Name: cmdAplicarRecuperacionCaja
 * Purpose: Cobro en caja, total o parcial, de la recuperación de siniestro elegida en el formulario
 *   frmAplicacionRecuperacionCaja. Como regla previa de DoTransfer exige una recuperación seleccionada para los tipos de
 *   ingreso del formulario 682 y rechaza la que no corresponde (otro tipo, otra moneda, anulada) y el importe que deja el
 *   acumulado cobrado fuera de 0..neto: un abono positivo no supera el pendiente y una reversión negativa no supera lo
 *   cobrado. Como regla posterior (ingreso ejecutado) recalcula el movimiento de ingreso de la recuperación con el
 *   acumulado de los ingresos de caja.
 * Author: AIDEN (MSN-000219, AXX-10616; MSN-000243, AXX-11414; MSN-000244, AXX-11417)
 */
/*
 * Entrada (context): la que arma el motor para una regla, { origin: { cmd: 'DoTransfer', data: { transferId } } }. Para
 *   probar: transferId en la raíz del contexto. El estado del ingreso decide qué se hace: borrador (status 0) se valida,
 *   ejecutado (status 1) se aplica; las dos reglas llaman a esta cadena.
 * Recuperación elegida: campo oculto hiddenRecuperacion de jIncomeTypeForm del ingreso (la fila de
 *   cmdRecuperacionesPendientesCaja en JSON, o sólo su id); sólo se usa su id. La selección es obligatoria si
 *   IncomeTypeCatalog.formId es 682. Los tipos de ingreso de otros formularios conservan su comportamiento.
 * Acumulado: cmdRecuperacionesPendientesCaja con salvageId e includeSettled (paidAmount, pendingAmount, paymentCount,
 *   currencyMismatchCount): la suma con signo de los ingresos de caja ejecutados de la recuperación. Esta cadena nunca suma
 *   sobre el movimiento, así que aplicar dos veces el mismo ingreso no cuenta doble.
 * Movimiento IncomeExpense de la recuperación: proyección del acumulado para las pantallas nativas, no el registro de cada
 *   cobro. Cobrado > 0: monto = cobrado, estado 1; cobrado 0: monto = neto, estado 0 (pendiente, como antes). transferId
 *   queda null; si apunta a un ingreso que no guarda esta recuperación (puente nativo heredado) el movimiento no se toca.
 *   Se reescribe la fila completa (conserva fecha y contacto) sólo si cambia; se crea sólo si hay algo cobrado. Si el
 *   movimiento tiene id 0 el ingreso se rechaza antes de ejecutarse (ver sinIdActualizable).
 * Salida: { ok, msg }. Todo error devuelve ok false (nunca una excepción): en la regla previa corta el DoTransfer.
 * MSN-000243 / AXX-11414: rechazar antes de ejecutar un cobro de siniestros sin recuperación seleccionada.
 * MSN-000244 / AXX-11417: cobros parciales acumulados y reversiones con importe negativo.
 */
const CAMPO = 'hiddenRecuperacion';

const entrada = context || {};
const datos = (entrada.origin && entrada.origin.data) || {};
const transferId = entero(datos.transferId !== undefined && datos.transferId !== null ? datos.transferId : entrada.transferId);
let modo = 'validar';
let recuperacionId = 0;
let projectionSkippedLegacy = false;

try {
  if (transferId <= 0) return sinNumeroDeIngreso();
  const ingreso = leerIngreso();
  if (!ingreso) return { ok: false, msg: 'No se encontró el ingreso de caja #' + transferId + '.' };
  const estado = Number(ingreso.status);
  if (estado === 1) {
    modo = 'aplicar';
    return aplicar(ingreso);
  }
  return estado === 0 ? validar(ingreso) : { ok: true };
} catch (e) {
  return {
    ok: false,
    msg: (modo === 'validar' ? 'No se pudo validar' : 'No se pudo aplicar') +
      (recuperacionId > 0 ? ' la recuperación ' + recuperacionId + ' del' : ' el') + ' ingreso de caja #' + transferId + ': ' + detalle(e)
  };
}

function validar(ingreso) {
  const obligatoria = requiereReclamo(ingreso.incomeType);
  const campos = formulario(ingreso);
  const elegida = recuperacionElegida(campos);
  if (!elegida) return obligatoria
    ? { ok: false, msg: 'No se puede ejecutar: debe seleccionar un reclamo en el formulario de cobro de siniestros.' }
    : { ok: true };
  recuperacionId = elegida.id;

  const consulta = saldo(ingreso.incomeType, recuperacionId);
  if (consulta.tipoRecuperacion === null) return obligatoria
    ? { ok: false, msg: 'No se puede ejecutar: el tipo de ingreso no tiene configurada su recuperación de siniestros.' }
    : { ok: true };
  const fila = consulta.fila;
  if (!fila) return { ok: false, msg: motivoNoDisponible(consulta, ingreso) };
  if (sinIdActualizable(movimientoDe(recuperacionId))) return { ok: false, msg: noActualizable() };
  const moneda = texto(fila.currency);
  if (moneda !== texto(ingreso.currency)) {
    return {
      ok: false,
      msg: 'La recuperación ' + recuperacionId + ' del siniestro ' + texto(fila.claimCode) + ' está en ' + moneda +
        ' y el ingreso de caja en ' + texto(ingreso.currency) + '. Registre el ingreso en ' + moneda +
        ' o elija otra recuperación.'
    };
  }
  if (fila.currencyMismatchCount > 0) {
    return {
      ok: false,
      msg: 'La recuperación ' + recuperacionId + ' tiene ' + fila.currencyMismatchCount + ' ingreso(s) de caja en otra moneda y ' +
        'su acumulado no es confiable. Avise a soporte antes de registrar otro cobro.'
    };
  }

  const neto = centavos(fila.netIncome);
  const cobrado = centavos(fila.paidAmount);
  const importe = centavos(numero(ingreso.amount));
  const base = 'la recuperación ' + recuperacionId + ' del siniestro ' + texto(fila.claimCode);
  if (importe === 0) {
    return { ok: false, msg: 'El ingreso de caja #' + transferId + ' no tiene importe: registre un cobro positivo o una reversión negativa de ' + base + '.' };
  }
  if (cobrado + importe > neto) {
    return {
      ok: false,
      msg: 'El cobro de ' + moneda + ' ' + dinero(importe) + ' supera el saldo pendiente de ' + base + ': quedan ' + moneda + ' ' +
        dinero(neto - cobrado) + ' de ' + dinero(neto) + '.'
    };
  }
  if (cobrado + importe < 0) {
    return {
      ok: false,
      msg: 'La reversión de ' + moneda + ' ' + dinero(importe) + ' supera lo cobrado en ' + base + ': cobrado ' + moneda + ' ' +
        dinero(cobrado) + '.'
    };
  }
  return { ok: true };
}

function aplicar(ingreso) {
  const campos = formulario(ingreso);
  const elegida = recuperacionElegida(campos);
  if (!elegida) return { ok: true, msg: 'El ingreso de caja #' + transferId + ' no cobra una recuperación.' };
  recuperacionId = elegida.id;

  const consulta = saldo(ingreso.incomeType, recuperacionId);
  if (consulta.tipoRecuperacion === null) return { ok: true, msg: 'El tipo de ingreso ' + texto(ingreso.incomeType) + ' no cobra recuperaciones.' };
  const fila = consulta.fila;
  if (!fila) throw new Error('@' + motivoNoDisponible(consulta, ingreso));
  if (fila.currencyMismatchCount > 0) throw new Error('@Hay movimientos vinculados en otra moneda; no se puede proyectar el acumulado. Avise a soporte.');
  // El ingreso ya está ejecutado y guarda la recuperación: si el acumulado no lo ve, no se proyecta un saldo viejo.
  if (fila.paymentCount <= 0) throw new Error('@el acumulado de la recuperación todavía no incluye este ingreso ejecutado.');

  const proyeccion = proyectar(fila, entero(valorCampo(campos, 'hiddenCodigoCliente')));
  return {
    ok: true,
    projectionSkippedLegacy: projectionSkippedLegacy,
    msg: 'Recuperación ' + recuperacionId + ' del siniestro ' + texto(fila.claimCode) + ' con el ingreso de caja #' + transferId +
      ': ' + resumen(fila) + '. ' + proyeccion
  };
}

// Los triggers sólo corren en comandos del broker, no en exeSub: sin id no hay un ingreso que se pueda validar.
function sinNumeroDeIngreso() {
  return { ok: false, msg: 'El ingreso de caja no tiene número: no se puede validar su recuperación.' };
}

// Ingreso de caja de la regla (sólo las columnas que se usan), o null.
function leerIngreso() {
  const r = doCmd({
    cmd: 'LoadEntity',
    data: { entity: 'Transfer', fields: 'id,incomeType,currency,amount,status,reversalDate,jIncomeTypeForm', filter: 'id = ' + transferId }
  });
  if (!r || r.ok === false) throw new Error('@No se pudo leer el ingreso de caja: ' + mensaje(r));
  return r.outData ? copia(r.outData) : null;
}

function requiereReclamo(tipoIngreso) {
  const codigo = texto(tipoIngreso);
  if (!codigo) return false;
  const r = doCmd({
    cmd: 'RepoIncomeTypeCatalog',
    data: { operation: 'GET', filter: "code = '" + codigo.replace(/'/g, "''") + "'", size: 1 }
  });
  if (!r || r.ok === false) throw new Error('@No se pudo validar el tipo de ingreso: ' + mensaje(r));
  const filas = copia(r.outData);
  return Array.isArray(filas) && filas.length > 0 && Number(filas[0].formId) === 682;
}

// Campos de jIncomeTypeForm del ingreso. Vacío es un ingreso sin formulario; un JSON ilegible es un error.
function formulario(transfer) {
  const valor = texto(transfer.jIncomeTypeForm);
  if (!valor) return [];
  let campos;
  try {
    campos = JSON.parse(valor);
  } catch (e) {
    throw new Error('@el formulario del ingreso de caja #' + entero(transfer.id) + ' no se puede leer.');
  }
  if (!Array.isArray(campos)) throw new Error('@el formulario del ingreso de caja #' + entero(transfer.id) + ' no se puede leer.');
  return campos;
}

function valorCampo(campos, nombre) {
  const campo = campos.find(c => c && c.name === nombre);
  if (!campo || campo.userData === undefined || campo.userData === null) return '';
  const valor = Array.isArray(campo.userData) ? campo.userData[0] : campo.userData;
  if (valor !== null && typeof valor === 'object') return JSON.stringify(valor);
  return texto(valor);
}

// { id } de la recuperación guardada en el formulario (la fila en JSON o sólo el id; admite 58.0), o null sin elección.
function recuperacionElegida(campos) {
  const valor = valorCampo(campos, CAMPO);
  if (!valor) return null;
  let id = valor;
  if (valor.charAt(0) === '{') {
    try {
      id = JSON.parse(valor).id;
    } catch (e) {
      throw new Error('@la recuperación guardada en el formulario no se puede leer.');
    }
  }
  const numeroId = entero(id);
  if (numeroId <= 0) throw new Error('@la recuperación guardada en el formulario no tiene un id válido.');
  return { id: numeroId };
}

// Acumulado de la recuperación para el tipo de ingreso (incluye las ya cobradas, para poder reversarlas).
function saldo(tipoIngreso, salvageId) {
  const resultado = exeChain({ incomeType: texto(tipoIngreso), salvageId: salvageId, includeSettled: true });
  const tipo = resultado.tipoRecuperacion === undefined ? null : resultado.tipoRecuperacion;
  return {
    tipoRecuperacion: tipo,
    nombreTipoRecuperacion: texto(resultado.nombreTipoRecuperacion),
    fila: tipo === null ? null : filaDe(resultado, salvageId)
  };
}

function exeChain(contexto) {
  const r = doCmd({ cmd: 'ExeChain', data: { chain: 'cmdRecuperacionesPendientesCaja', context: JSON.stringify(contexto) } });
  if (!r || r.ok === false) throw new Error('@No se pudo consultar el acumulado de la recuperación: ' + mensaje(r));
  const salida = copia(r.outData);
  const resultado = Array.isArray(salida) ? salida[0] : salida;
  if (!resultado || typeof resultado !== 'object' || resultado.ok === false || !Array.isArray(resultado.data)) {
    throw new Error('@La consulta del acumulado de recuperaciones no devolvió datos válidos.');
  }
  return resultado;
}

// La fila de la recuperación con su acumulado en números, o null si no figura. Sin acumulado numérico es un error.
function filaDe(resultado, salvageId) {
  const filas = Array.isArray(resultado.data) ? resultado.data : [];
  const fila = filas.find(f => f && entero(f.id) === salvageId);
  if (!fila) return null;
  ['netIncome', 'paidAmount', 'pendingAmount', 'paymentCount', 'currencyMismatchCount'].forEach(campo => {
    const valor = numeroEstricto(fila[campo]);
    if (!Number.isFinite(valor)) {
      throw new Error('@cmdRecuperacionesPendientesCaja no devolvió ' + campo + ' de la recuperación ' + salvageId + '.');
    }
    fila[campo] = valor;
  });
  return fila;
}

// Proyecta el acumulado en el movimiento IncomeExpense de la recuperación. Devuelve lo hecho, para el mensaje.
function proyectar(fila, cliente) {
  const id = entero(fila.id);
  const actual = movimientoDe(id);
  if (sinIdActualizable(actual)) return 'El movimiento de ingreso tiene id 0 y no se actualizó (avise a soporte).';
  if (actual && puenteNativo(actual, id)) {
    projectionSkippedLegacy = true;
    return 'El movimiento de ingreso sigue enlazado al ingreso de caja #' + entero(actual.transferId) + ', que no guarda esta ' +
      'recuperación, y no se modificó.';
  }
  const cobrado = numero(fila.paidAmount);
  const neto = numero(fila.netIncome);
  const moneda = texto(fila.currency);
  if (!actual && cobrado <= 0) return 'Sin movimiento de ingreso que actualizar.';
  const base = 'Recuperación ' + id + ' · siniestro ' + texto(fila.claimCode);
  const proyeccion = {
    name: cobrado > 0 ? base + ' · cobrado ' + moneda + ' ' + cobrado.toFixed(2) + ' de ' + neto.toFixed(2) : base + ' · pendiente',
    isIncome: true,
    amount: cobrado > 0 ? cobrado : neto,
    currency: moneda,
    status: cobrado > 0 ? 1 : 0,
    transferId: null,
    salvageId: id
  };
  if (actual && centavos(actual.amount) === centavos(proyeccion.amount) && Number(actual.status) === proyeccion.status &&
    entero(actual.transferId) <= 0 && texto(actual.currency) === moneda) {
    return 'El movimiento de ingreso ya estaba al día.';
  }
  const comprador = entero(fila.buyerId);
  const contacto = comprador > 0 ? comprador : (cliente > 0 ? cliente : null);
  const entidad = actual
    ? Object.assign({}, actual, proyeccion, {
      contactId: entero(actual.contactId) > 0 ? actual.contactId : contacto,
      date: texto(actual.date) || new Date().toISOString()
    })
    : Object.assign({}, proyeccion, { contactId: contacto, date: new Date().toISOString() });
  const r = doCmd({ cmd: 'RepoIncomeExpense', data: { operation: actual ? 'UPDATE' : 'ADD', entity: entidad } });
  if (!r || r.ok === false) throw new Error('@No se pudo actualizar el movimiento de ingreso de la recuperación ' + id + ': ' + mensaje(r));
  return 'Movimiento de ingreso ' + (actual ? 'actualizado' : 'creado') + '.';
}

// true si el movimiento apunta a un ingreso que no guarda esta recuperación en hiddenRecuperacion: lo dejó el flujo nativo
// (o no se puede leer), y su enlace se conserva sin tocar.
function puenteNativo(movimiento, salvageId) {
  const apuntado = entero(movimiento.transferId);
  if (apuntado <= 0) return false;
  const r = doCmd({ cmd: 'LoadEntity', data: { entity: 'Transfer', fields: 'id,jIncomeTypeForm', filter: 'id = ' + apuntado } });
  if (!r || r.ok === false) throw new Error('@No se pudo leer el ingreso de caja #' + apuntado + ': ' + mensaje(r));
  const transfer = r.outData ? copia(r.outData) : null;
  if (!transfer) return true;
  try {
    const marca = recuperacionElegida(formulario(transfer));
    return !(marca && marca.id === salvageId);
  } catch (e) {
    return true;
  }
}

function resumen(fila) {
  const moneda = texto(fila.currency);
  return 'cobrado ' + moneda + ' ' + numero(fila.paidAmount).toFixed(2) + ' de ' + numero(fila.netIncome).toFixed(2) +
    ', pendiente ' + numero(fila.pendingAmount).toFixed(2);
}

// Por qué la recuperación elegida no figura para el tipo de ingreso.
function motivoNoDisponible(consulta, ingreso) {
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
  return base + ' está anulada o no tiene importe neto. Elija otra recuperación o quite la selección.';
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

// Número sin valor por defecto: vacío o null no es 0.
function numeroEstricto(valor) {
  if (valor === undefined || valor === null || texto(valor) === '') return NaN;
  return Number(valor);
}

function centavos(valor) {
  return Math.round(Number(valor) * 100);
}

function dinero(centimos) {
  return (centimos / 100).toFixed(2);
}

function detalle(e) {
  return e && e.message ? String(e.message).replace(/^@/, '') : String(e);
}

function mensaje(respuesta) {
  return respuesta && respuesta.msg ? String(respuesta.msg) : 'sin respuesta';
}
