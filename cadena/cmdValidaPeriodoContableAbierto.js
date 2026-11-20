//block
//noreplace
/*
 * @name cmdValidaPeriodoContableAbierto
 * @version 1
 * @created 2026-11-04 (MSN-000102, AXX-7417)
 * @purpose Cadena de las reglas de bloqueo previas trgPeriodoCerrado*: rechaza la operación cuando el asiento que
 *          crea, modifica, elimina o contabiliza tiene fecha contable en un período cerrado (Closure.status > 0)
 *          de su organización o de todas (organizationId null).
 * @context El que arma el motor para una regla interceptora: { origin: { cmd, data }, sysOrganization }.
 *          fechaPrueba ('aaaa-mm-dd', opcional) reemplaza la fecha de hoy; sólo para probarla con ExeFormula.
 * Sólo lee (getScalar): no llama comandos. Si algo falla, rechaza la operación (falla cerrada).
 * Criterios:
 *  - RepoTransaction ADD: la fecha contable nueva. UPDATE: la guardada, la nueva y la de los asientos dueños de las
 *    líneas incluidas. DELETE: la guardada. MERGE: rechazado mientras haya algún período cerrado.
 *  - RepoTransactionLineAmount/Aux/CostCenter: la fecha del asiento dueño de la línea. MERGE como arriba.
 *  - PostTransaction: la fecha guardada (hoy si no tiene) y, salvo AUDIT-ADJUSTMENT o
 *    Accounting.preserveManualPostingDate, el mes de hoy, porque contabilizar re-fecha el asiento a hoy.
 *  - ExecuteBulkTransaction (simular y ejecutar): la fecha del lote, contra períodos de todas las organizaciones.
 *  - RepoClosure: el estado sólo cambia con ClosePeriod / UndoClosure; un período cerrado no cambia de año, mes ni
 *    organización y no se elimina; un período se crea abierto; MERGE rechazado.
 *  - Operaciones cuyo asiento se fecha hoy (UTC): el mes de hoy, para la organización de la sesión; con los mismos
 *    filtros que hoy deciden si hay asiento (objeto asegurado sólo EXECUTE, cobro no borrador, reserva sólo ADD,
 *    renovación sólo ramo 1).
 */
const TODAS = 'todas las organizaciones';
const OPERACIONES = {
  IssuePolicy: 'emitir la póliza',
  ExeChangeCancellation: 'ejecutar la anulación de la póliza',
  ExeChangeCoverage: 'ejecutar el endoso de coberturas',
  ExeChangeAddCoverage: 'ejecutar el endoso de alta de cobertura',
  ExeChangeLoading: 'ejecutar el endoso de recargo o descuento',
  ExeChangePolicyCapital: 'ejecutar el endoso de suma asegurada',
  ExeChangeInsuredObject: 'ejecutar el endoso de objeto asegurado',
  ExeAnniversary: 'renovar la póliza',
  DoTransfer: 'registrar la transferencia',
  UndoTransfer: 'anular la transferencia',
  DoPaymentAllocation: 'aplicar el cobro',
  UnDoPaymentAllocation: 'revertir la aplicación del cobro',
  DepositCashierPayments: 'depositar los cobros de caja',
  DoPayment: 'registrar el pago',
  ExeClaimPayment: 'ejecutar el pago del reclamo',
  RepoLifeCoveragePayout: 'registrar la reserva del reclamo'
};
const LINEAS = {
  RepoTransactionLineAmount: 'TransactionLineAmount',
  RepoTransactionLineAux: 'TransactionLineAux',
  RepoTransactionLineCostCenter: 'TransactionLineCostCenter'
};
const CIERRE_ASIENTO = "JOIN Closure c ON c.[year] = YEAR(t.effectiveDate) AND c.[month] = MONTH(t.effectiveDate) AND c.status > 0 " +
  "AND (c.organizationId IS NULL OR c.organizationId = t.organizationId) LEFT JOIN Organization o ON o.id = c.organizationId ";
const DATOS_ASIENTO = "TOP 1 CONCAT(c.[month], '|', c.[year], '|', CONVERT(varchar(10), t.effectiveDate, 103), '|', t.id, '|', ISNULL(o.name, '')) FROM [Transaction] t ";
const ORDEN_ASIENTO = " ORDER BY t.id, CASE WHEN c.organizationId IS NULL THEN 0 ELSE 1 END";

let comando = '';
try {
  const origen = (context && context.origin) || {};
  comando = String(origen.cmd || '');
  return validar(comando, origen.data || {});
} catch (e) {
  const detalle = e && e.message ? e.message : String(e);
  return { ok: false, msg: 'No se pudo validar el período contable' + (comando ? ' (' + comando + ')' : '') + ': ' + detalle + '. La operación no se ejecutó.' };
}

function validar(cmd, datos) {
  if (cmd === 'RepoTransaction') return validarAsiento(datos);
  if (LINEAS[cmd]) return validarLineas(cmd, datos);
  if (cmd === 'PostTransaction') return validarContabilizacion(datos);
  if (cmd === 'ExecuteBulkTransaction') return validarCargaMasiva(datos);
  if (cmd === 'RepoClosure') return validarPeriodo(datos);
  if (OPERACIONES[cmd]) return validarOperacion(cmd, datos);
  return { ok: true, msg: 'Sin validación de período para ' + (cmd || 'este comando') + '.' };
}

function validarAsiento(datos) {
  const op = operacion(datos);
  const e = campo(datos, 'entity') || {};
  if (op === 'MERGE') return validarMerge('asientos');
  if (op === 'ADD') {
    const f = partesFecha(campo(e, 'effectiveDate'));
    if (!f) return { ok: true, msg: 'Asiento sin fecha contable: se valida al contabilizarlo.' };
    const p = cerradoMes(f.y, f.m, org(campo(e, 'organizationId')));
    if (p) return { ok: false, msg: 'No se puede crear el asiento: su fecha contable (' + fmtFecha(f) + ') está en el período ' + fmtPeriodo(p.mes, p.anio) + ', cerrado (' + p.alcance + '). Usá una fecha de un período abierto.' };
    return { ok: true, msg: 'Período ' + fmtPeriodo(f.m, f.y) + ' abierto.' };
  }
  if (op !== 'UPDATE' && op !== 'DELETE') return { ok: true, msg: 'Operación ' + op + ' sin validación de período.' };
  const id = entero(campo(e, 'id'));
  const verbo = op === 'UPDATE' ? 'modificar' : 'eliminar';
  if (id > 0) {
    const g = cerradoAsientos([id], [0]);
    if (g) return { ok: false, msg: 'No se puede ' + verbo + ' el asiento ' + id + ': su fecha contable (' + g.fecha + ') está en el período ' + fmtPeriodo(g.mes, g.anio) + ', cerrado (' + g.alcance + '). Reabrí el período con UndoClosure o registrá el ajuste en un período abierto.' };
  }
  if (op === 'UPDATE') {
    const f = partesFecha(campo(e, 'effectiveDate'));
    if (f) {
      const p = cerradoMes(f.y, f.m, org(campo(e, 'organizationId')));
      if (p) return { ok: false, msg: 'No se puede modificar el asiento ' + id + ': la nueva fecha contable (' + fmtFecha(f) + ') está en el período ' + fmtPeriodo(p.mes, p.anio) + ', cerrado (' + p.alcance + '). Usá una fecha de un período abierto.' };
    }
    const asientos = [0];
    const lineas = [0];
    const lista = campo(e, 'Lines');
    if (Array.isArray(lista)) {
      for (const l of lista) {
        const t = entero(campo(l, 'transactionId'));
        if (t > 0 && t !== id) asientos.push(t);
        const li = entero(campo(l, 'id'));
        if (li > 0) lineas.push(li);
      }
    }
    if (asientos.length > 1 || lineas.length > 1) {
      const o = cerradoAsientos(asientos, lineas);
      if (o) return { ok: false, msg: 'No se puede modificar el asiento ' + id + ': el pedido incluye líneas del asiento ' + o.id + ', cuya fecha contable (' + o.fecha + ') está en el período ' + fmtPeriodo(o.mes, o.anio) + ', cerrado (' + o.alcance + ').' };
    }
  }
  return { ok: true, msg: 'Asiento ' + id + ': período abierto.' };
}

function validarLineas(cmd, datos) {
  const op = operacion(datos);
  if (op === 'MERGE') return validarMerge('líneas de asientos');
  const e = campo(datos, 'entity') || {};
  const lineas = [0];
  const filas = [0];
  const li = entero(campo(e, 'transactionLineId'));
  if (li > 0) lineas.push(li);
  const fi = entero(campo(e, 'id'));
  if (fi > 0) filas.push(fi);
  if (lineas.length === 1 && filas.length === 1) return { ok: true, msg: 'Sin línea que validar.' };
  const r = getScalar(DATOS_ASIENTO + CIERRE_ASIENTO +
    "WHERE t.id IN (SELECT l.transactionId FROM TransactionLine l WHERE l.id IN @lineas OR l.id IN (SELECT x.transactionLineId FROM " + LINEAS[cmd] + " x WHERE x.id IN @filas))" +
    ORDEN_ASIENTO, { lineas: lineas, filas: filas });
  const p = leerPeriodo(r);
  if (p) return { ok: false, msg: 'No se pueden modificar las líneas del asiento ' + p.id + ': su fecha contable (' + p.fecha + ') está en el período ' + fmtPeriodo(p.mes, p.anio) + ', cerrado (' + p.alcance + '). Reabrí el período con UndoClosure o registrá el ajuste en un período abierto.' };
  return { ok: true, msg: 'Línea de un asiento en período abierto.' };
}

function validarContabilizacion(datos) {
  const id = entero(campo(datos, 'transactionId'));
  if (!(id > 0)) return { ok: true, msg: 'Sin asiento que validar.' };
  const r = getScalar("TOP 1 CONCAT(ISNULL(CONVERT(varchar(10), t.effectiveDate, 23), ''), '|', ISNULL(CAST(t.organizationId AS varchar(12)), ''), '|', ISNULL(t.code, '')) FROM [Transaction] t WHERE t.id = @id", { id: id });
  if (r === null || r === undefined) return { ok: true, msg: 'Asiento ' + id + ' no encontrado.' };
  const g = String(r).split('|');
  const hoy = fechaHoy();
  const guardada = g[0] ? partesFecha(g[0]) : null;
  const f = guardada || hoy;
  const o = org(g[1] === '' ? null : g[1]);
  const ajuste = g.slice(2).join('|') === 'AUDIT-ADJUSTMENT';
  const p = cerradoMes(f.y, f.m, o);
  if (p) return { ok: false, msg: 'No se puede contabilizar el asiento ' + id + ': ' + (guardada ? 'su fecha contable (' + fmtFecha(f) + ')' : 'no tiene fecha contable y tomaría la de hoy (' + fmtFecha(f) + ', UTC), que') + ' está en el período ' + fmtPeriodo(p.mes, p.anio) + ', cerrado (' + p.alcance + ').' + (ajuste ? ' Los ajustes de auditoría (AUDIT-ADJUSTMENT) en períodos cerrados están bloqueados: reabrí el período con UndoClosure.' : ' Cambiá la fecha a un período abierto.') };
  if (!ajuste && !preservaFecha()) {
    const q = cerradoMes(hoy.y, hoy.m, o);
    if (q) return { ok: false, msg: 'No se puede contabilizar el asiento ' + id + ': al contabilizarlo queda fechado hoy (' + fmtFecha(hoy) + ', UTC), en el período ' + fmtPeriodo(q.mes, q.anio) + ', que está cerrado (' + q.alcance + ').' };
  }
  return { ok: true, msg: 'Asiento ' + id + ': período ' + fmtPeriodo(f.m, f.y) + ' abierto.' };
}

function validarCargaMasiva(datos) {
  const id = entero(campo(datos, 'bulkTransactionId'));
  const accion = campo(datos, 'simulate') ? 'simular' : 'ejecutar';
  if (!(id > 0)) return { ok: true, msg: 'Sin lote que validar.' };
  const r = getScalar("TOP 1 CONVERT(varchar(10), b.transactionDate, 23) FROM BulkTransactions b WHERE b.id = @id", { id: id });
  if (r === null || r === undefined) return { ok: true, msg: 'Lote ' + id + ' no encontrado.' };
  const f = partesFecha(String(r));
  const p = cerradoMes(f.y, f.m, -1);
  if (p) return { ok: false, msg: 'No se puede ' + accion + ' la carga masiva ' + id + ': su fecha (' + fmtFecha(f) + ') está en el período ' + fmtPeriodo(p.mes, p.anio) + ', cerrado (' + p.alcance + '). No se crea ningún asiento del lote: cambiá la fecha del lote a un período abierto o reabrí el período con UndoClosure.' };
  return { ok: true, msg: 'Lote ' + id + ': período ' + fmtPeriodo(f.m, f.y) + ' abierto.' };
}

function validarPeriodo(datos) {
  const op = operacion(datos);
  const e = campo(datos, 'entity') || {};
  if (op === 'MERGE') return { ok: false, msg: 'No se permite el reemplazo masivo (MERGE) de períodos contables: el estado de un período sólo cambia con ClosePeriod (cerrar) y UndoClosure (reabrir).' };
  const estadoNuevo = entero(campo(e, 'status'));
  if (op === 'ADD') {
    if (estadoNuevo !== 0) return { ok: false, msg: 'Un período se crea abierto (estado 0): para cerrarlo usá ClosePeriod.' };
    return { ok: true, msg: 'Alta de un período abierto.' };
  }
  if (op !== 'UPDATE' && op !== 'DELETE') return { ok: true, msg: 'Operación ' + op + ' sin validación de período.' };
  const id = entero(campo(e, 'id'));
  if (!(id > 0)) return { ok: true, msg: 'Sin período que validar.' };
  const r = getScalar("TOP 1 CONCAT(c.[month], '|', c.[year], '|', c.status, '|', ISNULL(CAST(c.organizationId AS varchar(12)), '')) FROM Closure c WHERE c.id = @id", { id: id });
  if (r === null || r === undefined) return { ok: true, msg: 'Período ' + id + ' no encontrado.' };
  const g = String(r).split('|');
  const mes = Number(g[0]);
  const anio = Number(g[1]);
  const estado = Number(g[2]);
  const orgGuardada = g[3] === '' ? null : Number(g[3]);
  const nombre = fmtPeriodo(mes, anio);
  if (op === 'DELETE') {
    if (estado > 0) return { ok: false, msg: 'No se puede eliminar el período ' + nombre + ': está cerrado. Reabrilo con UndoClosure.' };
    return { ok: true, msg: 'Período ' + nombre + ' abierto.' };
  }
  if (estadoNuevo !== estado) return { ok: false, msg: 'El estado del período ' + nombre + ' no se cambia editándolo: se cierra con ClosePeriod y se reabre con UndoClosure.' };
  if (estado > 0) {
    const v = campo(e, 'organizationId');
    const orgNueva = v === null || v === undefined || v === '' ? null : Number(v);
    if (entero(campo(e, 'year')) !== anio || entero(campo(e, 'month')) !== mes || orgNueva !== orgGuardada)
      return { ok: false, msg: 'El período ' + nombre + ' está cerrado: no se puede cambiar su año, mes ni organización. Reabrilo con UndoClosure.' };
  }
  return { ok: true, msg: 'Período ' + nombre + ': sin cambio de estado.' };
}

function validarOperacion(cmd, datos) {
  if (cmd === 'RepoLifeCoveragePayout' && operacion(datos) !== 'ADD') return { ok: true, msg: 'Esta operación no genera asiento contable.' };
  if (cmd === 'ExeChangeInsuredObject' && operacion(datos) !== 'EXECUTE') return { ok: true, msg: 'Esta operación no genera asiento contable.' };
  if (cmd === 'DoPaymentAllocation' && campo(datos, 'draft')) return { ok: true, msg: 'Cobro en borrador: no genera asiento contable.' };
  if (cmd === 'ExeAnniversary') {
    const aniversario = entero(campo(datos, 'anniversaryId'));
    const ramo = aniversario > 0 ? getScalar("TOP 1 p.lob FROM LifePolicy p WHERE p.id IN (SELECT a.lifePolicyId FROM Anniversary a WHERE a.id = @id)", { id: aniversario }) : null;
    if (ramo === null || ramo === undefined || String(ramo) !== '1') return { ok: true, msg: 'Esta renovación no genera asiento contable.' };
  }
  const hoy = fechaHoy();
  const s = context.sysOrganization;
  const o = s && entero(s.id) > 0 ? entero(s.id) : -1;
  const p = cerradoMes(hoy.y, hoy.m, o);
  if (p) return { ok: false, msg: 'No se puede ' + OPERACIONES[cmd] + ': su asiento contable quedaría fechado hoy (' + fmtFecha(hoy) + ', UTC), en el período ' + fmtPeriodo(p.mes, p.anio) + ', que está cerrado (' + p.alcance + '). Reabrí el período con UndoClosure para operar.' };
  return { ok: true, msg: 'Período ' + fmtPeriodo(hoy.m, hoy.y) + ' abierto (hoy ' + fmtFecha(hoy) + ', UTC).' };
}

function validarMerge(que) {
  const r = getScalar("TOP 1 CONCAT(c.[month], '|', c.[year], '|', '', '|', '', '|', ISNULL(o.name, '')) FROM Closure c LEFT JOIN Organization o ON o.id = c.organizationId WHERE c.status > 0 ORDER BY c.[year], c.[month]");
  const p = leerPeriodo(r);
  if (p) return { ok: false, msg: 'No se permite el reemplazo masivo (MERGE) de ' + que + ' mientras haya períodos cerrados (por ejemplo ' + fmtPeriodo(p.mes, p.anio) + ', ' + p.alcance + '). Usá altas, ediciones y borrados individuales.' };
  return { ok: true, msg: 'Sin períodos cerrados.' };
}

function cerradoAsientos(asientos, lineas) {
  return leerPeriodo(getScalar(DATOS_ASIENTO + CIERRE_ASIENTO +
    "WHERE t.id IN @asientos OR t.id IN (SELECT l.transactionId FROM TransactionLine l WHERE l.id IN @lineas)" + ORDEN_ASIENTO,
    { asientos: asientos, lineas: lineas }));
}

function cerradoMes(anio, mes, organizacion) {
  return leerPeriodo(getScalar("TOP 1 CONCAT(c.[month], '|', c.[year], '|', '', '|', '', '|', ISNULL(o.name, '')) FROM Closure c LEFT JOIN Organization o ON o.id = c.organizationId " +
    "WHERE c.status > 0 AND c.[year] = @anio AND c.[month] = @mes AND (c.organizationId IS NULL OR c.organizationId = @org) " +
    "ORDER BY CASE WHEN c.organizationId IS NULL THEN 0 ELSE 1 END, c.id", { anio: anio, mes: mes, org: organizacion }));
}

function leerPeriodo(r) {
  if (r === null || r === undefined) return null;
  const p = String(r).split('|');
  const nombre = p.slice(4).join('|');
  return { mes: Number(p[0]), anio: Number(p[1]), fecha: p[2] || '', id: p[3] ? Number(p[3]) : 0, alcance: nombre ? 'organización ' + nombre : TODAS };
}

function preservaFecha() {
  try {
    const v = getScalar("TOP 1 CASE WHEN ISJSON(p.configJson) = 1 THEN JSON_VALUE(p.configJson, '$.Accounting.preserveManualPostingDate') END FROM ConfigProfile p WHERE p.active = 1");
    return String(v).toLowerCase() === 'true';
  } catch (e) {
    return false;
  }
}

function fechaHoy() {
  const prueba = context && context.fechaPrueba ? partesFecha(context.fechaPrueba) : null;
  if (prueba) return prueba;
  const d = new Date();
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

function partesFecha(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:[.,]\d+)?)?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!m[7] || m[7].toUpperCase() === 'Z') return { y: y, m: mo, d: d };
    const signo = m[7].charAt(0) === '-' ? -1 : 1;
    const zona = m[7].substring(1).replace(':', '');
    const minutos = Number(zona.substring(0, 2)) * 60 + (zona.length > 2 ? Number(zona.substring(2, 4)) : 0);
    const u = new Date(Date.UTC(y, mo - 1, d, Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)) - signo * minutos * 60000);
    return { y: u.getUTCFullYear(), m: u.getUTCMonth() + 1, d: u.getUTCDate() };
  }
  const t = new Date(s);
  if (isNaN(t.getTime())) throw new Error('fecha contable no reconocida (' + s + ')');
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function org(v) {
  const n = entero(v);
  return n > 0 ? n : -1;
}

function operacion(datos) {
  return String(campo(datos, 'operation') || '').toUpperCase();
}

function campo(o, nombre) {
  if (o === null || o === undefined || typeof o !== 'object') return undefined;
  if (nombre in o) return o[nombre];
  const buscado = nombre.toLowerCase();
  const clave = Object.keys(o).find(function (k) { return k.toLowerCase() === buscado; });
  return clave === undefined ? undefined : o[clave];
}

function entero(v) {
  const n = Number(v);
  return isFinite(n) ? Math.trunc(n) : 0;
}

function fmtPeriodo(mes, anio) {
  return (mes < 10 ? '0' : '') + mes + '/' + anio;
}

function fmtFecha(f) {
  return (f.d < 10 ? '0' : '') + f.d + '/' + (f.m < 10 ? '0' : '') + f.m + '/' + f.y;
}
