//block
//noreplace
/*
Name: cmdUpdateContactInfoCashier
Author: aiden_mission_configurator (MSN-000018 / AXX-1465)
Description: Actualiza la informacion de contacto (telefono principal, correo principal,
             telefonos adicionales y correos adicionales) de un contacto y la lleva por el
             flujo de trabajo vigente de modificacion de contactos hasta la aprobacion y la
             ejecucion. Sin triggers: toda la secuencia vive en esta cadena y usa comandos
             nativos.
Category: CONTACT
Version: 1.00
CreateDate: 2026-09-22

Secuencia:
  1. lee el estado actual (sin dejar el contacto trackeado por EF)
  2. aplica las BAJAS de telefonos/correos con RepoContactPhone / RepoContactEmail DELETE,
     que es lo que hace la vista nativa de contacto (la baja no pasa por control de cambios)
  3. arma jBefore / jAfter y crea la solicitud con AddContactChange, que es el comando que
     dispara el flujo de trabajo configurado para la operacion PersonalData
  4. avanza el proceso con GotoStep hasta que entityState sea APROVED
  5. ejecuta el cambio con ExeContactChange
  6. RELEE y devuelve lo que quedo guardado: el ok de los comandos no es el oraculo

Se invoca en DOS fases, las dos contra esta misma cadena. La razon es del motor: el paso del
flujo carga el contacto dentro de la MISMA unidad de trabajo, y la ejecucion del cambio no
puede volver a adjuntarlo ahi. La segunda llamada corre en su propia peticion.
  fase 1: {row:{contactId, phone, email, phones, emails}}
          valida, da de baja, crea la solicitud y lleva el flujo hasta APROVED.
          Devuelve pendingExecution:true con el changeId.
  fase 2: {row:{contactId, executeChangeId:<changeId>}}
          ejecuta la solicitud aprobada y RELEE lo que quedo guardado.

@param {int}    row.contactId  contacto a modificar (obligatorio)
@param {int}    row.executeChangeId  solo fase 2: solicitud aprobada que hay que ejecutar
@param {string} row.phone      telefono principal; omitir para no tocarlo
@param {string} row.email      correo principal; omitir para no tocarlo
@param {array}  row.phones     [{id,num,type}] juego COMPLETO de telefonos adicionales
@param {array}  row.emails     [{id,email,type}] juego COMPLETO de correos adicionales
                               omitir el arreglo = no tocar esa coleccion
                               un id que estaba y ya no viene = baja
*/
var ctx = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});
var row = ctx.row || ctx;

var MAX_PASOS = 12;
var RE_MAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

function txt(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}
function toInt(v) {
  var n = parseInt(v, 10);
  return n > 0 ? n : 0;
}
function q(sql) {
  doCmd({ cmd: 'DoQuery', data: { sql: sql } });
  if (!DoQuery.ok) throw 'Error leyendo el contacto: ' + DoQuery.msg;
  return DoQuery.outData || [];
}
function leerPhones(id) {
  var f = q('SELECT id, contactId, num, type FROM ContactPhone WHERE contactId=' + id + ' ORDER BY id');
  var out = [];
  for (var i = 0; i < f.length; i++) out.push({ id: toInt(f[i].id), contactId: id, num: txt(f[i].num), type: txt(f[i].type) });
  return out;
}
function leerEmails(id) {
  var f = q('SELECT id, contactId, email, type FROM ContactEmail WHERE contactId=' + id + ' ORDER BY id');
  var out = [];
  for (var i = 0; i < f.length; i++) out.push({ id: toInt(f[i].id), contactId: id, email: txt(f[i].email), type: txt(f[i].type) });
  return out;
}
function leerCabecera(id) {
  var f = q('SELECT id, phone, email FROM Contact WHERE id=' + id);
  return f.length ? { phone: txt(f[0].phone), email: txt(f[0].email) } : null;
}

var contactId = toInt(row.contactId);
if (!contactId) return { ok: false, msg: 'Indique el contacto a modificar' };

var cab = leerCabecera(contactId);
if (!cab) return { ok: false, msg: 'El contacto ' + contactId + ' no existe en este ambiente' };

// ---------- fase 2: ejecutar una solicitud ya aprobada ----------
var aEjecutar = toInt(row.executeChangeId);
if (aEjecutar) {
  var fila = q('SELECT id, contactId, status FROM ContactChange WHERE id=' + aEjecutar);
  if (!fila.length) return { ok: false, msg: 'La solicitud de cambio ' + aEjecutar + ' no existe' };
  if (toInt(fila[0].contactId) !== contactId) return { ok: false, msg: 'La solicitud ' + aEjecutar + ' no pertenece al contacto ' + contactId };
  if (parseInt(fila[0].status, 10) === 1) {
    return { ok: true, changed: false, executed: true, contactId: contactId, changeId: aEjecutar,
      msg: 'La solicitud ' + aEjecutar + ' ya estaba ejecutada',
      phone: cab.phone, email: cab.email, phones: leerPhones(contactId), emails: leerEmails(contactId) };
  }
  doCmd({ cmd: 'ExeContactChange', data: { changeId: aEjecutar } });
  if (!ExeContactChange.ok) {
    return { ok: false, changed: true, executed: false, contactId: contactId, changeId: aEjecutar,
      msg: 'No se pudo ejecutar la solicitud aprobada ' + aEjecutar + ': ' + ExeContactChange.msg };
  }
  var cabX = leerCabecera(contactId) || { phone: '', email: '' };
  return { ok: true, changed: true, executed: true, contactId: contactId, changeId: aEjecutar,
    msg: 'Solicitud ' + aEjecutar + ' ejecutada',
    phone: cabX.phone, email: cabX.email, phones: leerPhones(contactId), emails: leerEmails(contactId) };
}

var phonesAntes = leerPhones(contactId);
var emailsAntes = leerEmails(contactId);

// ---------- normalizacion y validacion de lo que llega ----------
var tocaPhones = row.phones !== undefined && row.phones !== null;
var tocaEmails = row.emails !== undefined && row.emails !== null;
var errores = [];

var phonesPedidos = [];
if (tocaPhones) {
  var pin = row.phones || [];
  for (var i = 0; i < pin.length; i++) {
    var num = txt(pin[i].num);
    if (num === '') { errores.push('Hay un telefono adicional sin numero'); continue; }
    if (num.length > 50) { errores.push('El telefono ' + num + ' supera los 50 caracteres'); continue; }
    phonesPedidos.push({ id: toInt(pin[i].id), contactId: contactId, num: num, type: txt(pin[i].type) });
  }
}
var emailsPedidos = [];
if (tocaEmails) {
  var ein = row.emails || [];
  for (var j = 0; j < ein.length; j++) {
    var dir = txt(ein[j].email);
    if (dir === '') { errores.push('Hay un correo adicional sin direccion'); continue; }
    if (!RE_MAIL.test(dir)) { errores.push('Direccion de correo invalida: ' + dir); continue; }
    emailsPedidos.push({ id: toInt(ein[j].id), contactId: contactId, email: dir, type: txt(ein[j].type) });
  }
}
var phonePpal = row.phone === undefined || row.phone === null ? cab.phone : txt(row.phone);
var emailPpal = row.email === undefined || row.email === null ? cab.email : txt(row.email);
if (emailPpal !== '' && !RE_MAIL.test(emailPpal)) errores.push('Direccion de correo principal invalida: ' + emailPpal);
if (errores.length) return { ok: false, msg: errores.join(' / ') };

// ---------- bajas: igual que la vista nativa, se aplican de una ----------
var bajas = [];
if (tocaPhones) {
  for (var b = 0; b < phonesAntes.length; b++) {
    var pid = phonesAntes[b].id, sigue = false;
    for (var s = 0; s < phonesPedidos.length; s++) if (phonesPedidos[s].id === pid) sigue = true;
    if (!sigue) {
      doCmd({ cmd: 'RepoContactPhone', data: { operation: 'DELETE', entity: { id: pid } } });
      if (!RepoContactPhone.ok) return { ok: false, msg: 'No se pudo eliminar el telefono ' + pid + ': ' + RepoContactPhone.msg };
      bajas.push({ tipo: 'telefono', id: pid, valor: phonesAntes[b].num });
    }
  }
}
if (tocaEmails) {
  for (var c = 0; c < emailsAntes.length; c++) {
    var eid = emailsAntes[c].id, sigueE = false;
    for (var s2 = 0; s2 < emailsPedidos.length; s2++) if (emailsPedidos[s2].id === eid) sigueE = true;
    if (!sigueE) {
      doCmd({ cmd: 'RepoContactEmail', data: { operation: 'DELETE', entity: { id: eid } } });
      if (!RepoContactEmail.ok) return { ok: false, msg: 'No se pudo eliminar el correo ' + eid + ': ' + RepoContactEmail.msg };
      bajas.push({ tipo: 'correo', id: eid, valor: emailsAntes[c].email });
    }
  }
}

// ---------- jBefore / jAfter sobre el estado ya sin las bajas ----------
var phonesBase = [], emailsBase = [];
for (var pb = 0; pb < phonesAntes.length; pb++) {
  var viva = false;
  for (var pb2 = 0; pb2 < bajas.length; pb2++) if (bajas[pb2].tipo === 'telefono' && bajas[pb2].id === phonesAntes[pb].id) viva = true;
  if (!viva) phonesBase.push(phonesAntes[pb]);
}
for (var eb = 0; eb < emailsAntes.length; eb++) {
  var vivaE = false;
  for (var eb2 = 0; eb2 < bajas.length; eb2++) if (bajas[eb2].tipo === 'correo' && bajas[eb2].id === emailsAntes[eb].id) vivaE = true;
  if (!vivaE) emailsBase.push(emailsAntes[eb]);
}

var antes = { phone: cab.phone, email: cab.email, Phones: phonesBase, Emails: emailsBase };
var despues = {
  phone: phonePpal,
  email: emailPpal,
  Phones: tocaPhones ? phonesPedidos : phonesBase,
  Emails: tocaEmails ? emailsPedidos : emailsBase
};

if (JSON.stringify(antes) === JSON.stringify(despues)) {
  return {
    ok: true, changed: bajas.length > 0, executed: bajas.length > 0,
    msg: bajas.length ? 'Se aplicaron ' + bajas.length + ' baja(s). No hay altas ni modificaciones que aprobar.' : 'No hay cambios para aplicar',
    contactId: contactId, bajas: bajas,
    phone: cab.phone, email: cab.email, phones: phonesBase, emails: emailsBase
  };
}

// ---------- solicitud de cambio: aca nace el flujo de trabajo ----------
doCmd({ cmd: 'AddContactChange', data: {
  contactId: contactId,
  jBefore: JSON.stringify(antes),
  jAfter: JSON.stringify(despues),
  operation: 'PersonalData'
} });
if (!AddContactChange.ok) return { ok: false, msg: 'No se pudo registrar la solicitud de cambio: ' + AddContactChange.msg, bajas: bajas };

var lista = AddContactChange.outData || [];
var mio = null;
for (var k = 0; k < lista.length; k++) if (!mio || toInt(lista[k].id) > toInt(mio.id)) mio = lista[k];
if (!mio) return { ok: false, msg: 'La solicitud de cambio no devolvio identificador', bajas: bajas };

var changeId = toInt(mio.id);
var proceso = mio.Process;
if (!proceso || !toInt(proceso.id)) {
  return { ok: false, changeId: changeId, bajas: bajas,
    msg: 'La solicitud ' + changeId + ' se creo sin flujo de trabajo asociado. Revise la asignacion de flujos para la operacion PersonalData.' };
}
var processId = toInt(proceso.id);
var nombreFlujo = txt(proceso.nombre);
var entityState = txt(proceso.entityState);
var finalizado = proceso.finalizado === true;
var pasos = [{ estado: txt(proceso.estado), estadoId: txt(proceso.estadoId), entityState: entityState }];

// ---------- se valida y se avanza el flujo vigente hasta la aprobacion ----------
var vueltas = 0;
while (entityState !== 'APROVED' && !finalizado && vueltas < MAX_PASOS) {
  vueltas++;
  doCmd({ cmd: 'GotoStep', data: { procesoId: processId, estado: '_next' } });
  if (!GotoStep.ok) {
    return { ok: true, changed: true, executed: false, contactId: contactId, changeId: changeId,
      processId: processId, entityState: entityState, pasos: pasos, bajas: bajas, flujo: nombreFlujo,
      msg: 'La solicitud ' + changeId + ' quedo pendiente en el flujo "' + nombreFlujo + '" (' + entityState + '): ' + GotoStep.msg };
  }
  var o = GotoStep.outData || {};
  entityState = txt(o.entityState);
  finalizado = o.finalizado === true;
  pasos.push({ estado: txt(o.estado), estadoId: txt(o.estadoId), entityState: entityState });
}

if (entityState !== 'APROVED') {
  return { ok: true, changed: true, executed: false, contactId: contactId, changeId: changeId,
    processId: processId, entityState: entityState, pasos: pasos, bajas: bajas, flujo: nombreFlujo,
    msg: 'La solicitud ' + changeId + ' quedo pendiente de aprobacion en el flujo "' + nombreFlujo + '" (estado ' + entityState + ')' };
}

// ---------- aprobado: la ejecucion va en la segunda llamada ----------
// El paso del flujo dejo el contacto adjunto a esta unidad de trabajo (la condicion del
// gateway lo carga para evaluar si cambio la identificacion), asi que ExeContactChange no
// puede volver a adjuntarlo aca. Se devuelve el trabajo listo y la fase 2 lo ejecuta.
return {
  ok: true, changed: true, executed: false, pendingExecution: true,
  contactId: contactId, changeId: changeId, processId: processId, flujo: nombreFlujo,
  entityState: entityState, pasos: pasos, bajas: bajas,
  msg: 'Solicitud ' + changeId + ' aprobada por el flujo "' + nombreFlujo + '". Falta ejecutarla.'
};
