/**
 * Name: frmAplicacionRecuperacionCaja
 * Purpose: Formulario de los tipos de ingreso de caja que cobran recuperaciones de siniestro (tabla
 *   cfgTipoIngresoCajaRecuperacion). Lista las recuperaciones pendientes del tipo que corresponde
 *   (cadena cmdRecuperacionesPendientesCaja). El cliente es su Comprador o, en deducibles sin Comprador, el asegurado
 *   del reclamo. Lista total, aplicado y pendiente; al elegir una recuperación, su pendiente queda como monto
 *   del pago (editable). La recuperación se guarda sin saldos en hiddenRecuperacion; al ejecutar el
 *   ingreso, cmdAplicarRecuperacionCaja recalcula lo aplicado. Debe seleccionarse una recuperación de un reclamo
 *   antes de ejecutar el ingreso. El borrador permite completar la selección y los datos del cliente.
 * Author: AIDEN (MSN-000219, AXX-10616)
 */
/*
 * Contexto (this) que arma la vista de caja: exe, incomeType (código del tipo de ingreso elegido),
 *   setIncomeAmount(monto) (lo pone en la única forma de pago) y getIncomeCurrency().
 * El campo oculto sólo se escribe por una acción del cajero (elegir o quitar): al abrir un ingreso guardado se
 *   conserva lo guardado y no se cambia el monto.
 * MSN-000243 / AXX-11414: instrucciones coherentes con la selección obligatoria antes de ejecutar.
 * MSN-000245 / AXX-11419: búsqueda por cliente efectivo y nombre inmediato al consultar un reclamo.
 * MSN-000244 / AXX-11417: cobros parciales acumulados; «Incluir cobradas para reversión» permite elegir las cobradas.
 *   El cajero introduce el monto negativo; nunca se fuerza el signo ni se cambia el monto al reabrir.
 */
var me = this;
var CHAIN_PENDIENTES = 'cmdRecuperacionesPendientesCaja';
var recargarPendientes = null;
var buscarClientePorNombre = null;
var invalidarRecuperaciones = null;
var recuperacionActiva = null;

function texto(valor) {
  return valor === undefined || valor === null ? '' : String(valor).trim();
}

function formatoMonto(valor) {
  var n = Number(valor);
  if (!isFinite(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatoFecha(valor) {
  var t = texto(valor);
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : t;
}

function saldo(rec, campo) {
  var valor = rec ? rec[campo] : null;
  if (valor === undefined || valor === null || texto(valor) === '') return null;
  var n = Number(valor);
  return isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function cobrada(rec) {
  var pendiente = saldo(rec, 'pendingAmount');
  return pendiente !== null && pendiente <= 0;
}

function leerGuardada() {
  var valor = texto($('#hiddenRecuperacion').val());
  if (!valor) return null;
  try {
    var fila = JSON.parse(valor);
    return fila && typeof fila === 'object' && Number(fila.id) > 0 ? fila : null;
  } catch (error) {
    return null;
  }
}

function requiereClienteManual() {
  var seleccion = recuperacionActiva;
  return seleccion && !(Number(seleccion.clientId) > 0) && !(Number(seleccion.buyerId) > 0);
}

function validarCliente() {
  var campo = document.getElementById('clientePA');
  if (!campo || typeof campo.setCustomValidity !== 'function') return;
  var sinResolver = texto(campo.value) && !(Number($('#hiddenCodigoCliente').val()) > 0);
  var sinRecuperacion = !leerGuardada();
  var mensaje = sinResolver
    ? 'Seleccione un cliente de la lista o pulse Buscar para identificarlo.'
    : sinRecuperacion
      ? 'Seleccione al menos una recuperación de la grilla antes de aplicar el pago.'
      : '';
  campo.setCustomValidity(mensaje);
}

function monedaIngreso() {
  try {
    return typeof me.getIncomeCurrency === 'function' ? texto(me.getIncomeCurrency()) : '';
  } catch (error) {
    return '';
  }
}

// -----------------------------
// Cliente resuelto por la consulta de recuperaciones
// -----------------------------
function fijarCliente(rec) {
  var $cliente = $('#clientePA');
  var $codigo = $('#hiddenCodigoCliente');
  var clienteId = Number(rec && rec.clientId);
  if (!(clienteId > 0)) {
    liberarCliente(true);
    return false;
  }
  var nombre = texto(rec.clientName) || ('Contacto ' + clienteId);
  $cliente.val(nombre);
  $codigo.val(String(clienteId));
  $cliente.data('selectedItem', { nombreCompleto: nombre, identificacion: '', noCobis: '', codigo: clienteId });
  $cliente.data('desdeRecuperacion', true);
  $cliente.prop('readonly', true).attr('title', Number(rec.buyerId) > 0
    ? 'Cliente tomado del Comprador de la recuperación' : 'Cliente tomado del asegurado del reclamo');
  $('.autocomplete-dropdown').remove();
  validarCliente();
  return true;
}

function liberarCliente(limpiar) {
  var $cliente = $('#clientePA');
  var desdeRecuperacion = $cliente.data('desdeRecuperacion') === true;
  $cliente.prop('readonly', false).removeAttr('title');
  $cliente.data('desdeRecuperacion', false);
  if (limpiar && desdeRecuperacion) {
    $cliente.val('');
    $('#hiddenCodigoCliente').val('');
    $cliente.data('selectedItem', null);
  }
  validarCliente();
}

// -----------------------------
// Tabla de recuperaciones pendientes
// -----------------------------
function instalarEstilosRecuperacionCaja() {
  if ($('#rec-caja-estilos').length) return;
  $('<style>', { id: 'rec-caja-estilos', type: 'text/css' }).text(`
    .rec-caja-busqueda-fila { font-size: 12px; }
    .rec-caja input:not([type="radio"]):not([type="checkbox"]), .rec-caja select,
    .rec-caja-busqueda-fila input:not([type="radio"]):not([type="checkbox"]), .rec-caja-busqueda-fila select {
      border: 1px solid #56697a !important; border-radius: 5px !important; box-sizing: border-box;
    }
    .rec-caja input:not([type="radio"]):not([type="checkbox"]):focus, .rec-caja select:focus,
    .rec-caja-busqueda-fila input:not([type="radio"]):not([type="checkbox"]):focus, .rec-caja-busqueda-fila select:focus {
      border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(22,119,255,.12) !important; outline: 0;
    }
    .rec-caja input[type="radio"], .rec-caja input[type="checkbox"] { accent-color: #1677ff; }
    .rec-caja .rec-caja-buscar-trigger, .rec-caja-busqueda-fila .rec-caja-buscar-trigger { border: 1px solid #56697a !important; border-radius: 4px; background: #fff; }
    .rec-caja-tabla { table-layout: fixed; font-size: 12px; line-height: 1.25; border: 1px solid #718395 !important; border-collapse: collapse; }
    .rec-caja-tabla th, .rec-caja-tabla td { padding: 5px 7px !important; vertical-align: middle; border: 1px solid #718395 !important; }
    .rec-caja-tabla th { background: #fafafa; color: rgba(0,0,0,.85); font-weight: 600; }
    .rec-caja-tabla th:nth-child(1), .rec-caja-tabla td:nth-child(1) { width: 34px; }
    .rec-caja-tabla th:nth-child(2), .rec-caja-tabla td:nth-child(2) { width: 104px; }
    .rec-caja-tabla th:nth-child(3), .rec-caja-tabla td:nth-child(3) { width: 104px; }
    .rec-caja-tabla th:nth-child(4), .rec-caja-tabla td:nth-child(4) { width: 88px; }
    .rec-caja-tabla th:nth-child(5), .rec-caja-tabla td:nth-child(5) { width: 128px; }
    .rec-caja-tabla th:nth-child(6), .rec-caja-tabla td:nth-child(6) { width: 78px; }
    .rec-caja-tabla th:nth-child(7), .rec-caja-tabla td:nth-child(7) { width: 52px; }
    .rec-caja-tabla th:nth-child(n+8):not(:last-child), .rec-caja-tabla td:nth-child(n+8):not(:last-child) { width: 78px; }
    .rec-caja-tabla th:last-child, .rec-caja-tabla td:last-child { width: 94px; }
    .rec-caja-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rec-caja-num { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; text-align: right; white-space: nowrap; }
    .rec-caja-num.rec-caja-positivo { color: #237804; }
    .rec-caja-num.rec-caja-negativo { color: #cf1322; }
    .rec-caja-estado-celda { color: #666; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `).appendTo('head');
}

function celdaTextoRecuperacion(valor, clase) {
  var valorTexto = texto(valor);
  return $('<td>', { 'class': 'rec-caja-ellipsis' + (clase ? ' ' + clase : '') })
    .attr('title', valorTexto)
    .text(valorTexto);
}

function celdaMontoRecuperacion(valor) {
  if (valor === null || valor === undefined || texto(valor) === '') {
    return $('<td>', { 'class': 'rec-caja-num' });
  }
  var monto = Number(valor);
  var clase = monto > 0 ? ' rec-caja-positivo' : monto < 0 ? ' rec-caja-negativo' : '';
  return $('<td>', { 'class': 'rec-caja-num' + clase })
    .attr('title', formatoMonto(monto))
    .text(formatoMonto(monto));
}

function pintarBase($contenedor, titulo) {
  instalarEstilosRecuperacionCaja();
  var $caja = $('<div>', { 'class': 'rec-caja', style: 'margin-top:10px;' });
  $caja.append($('<div>', { style: 'font-weight:600;margin-bottom:6px;' }).text(titulo));
  $caja.append($('<div>', { 'class': 'rec-caja-estado', style: 'color:#666;font-size:12px;margin-bottom:6px;' }));
  $caja.append($('<input>', {
    type: 'text',
    'class': 'ant-input rec-caja-reclamo',
    placeholder: 'Buscar por ID de reclamo',
    style: 'margin-bottom:6px;'
  }).attr('autocomplete', 'off'));
  $caja.append($('<input>', {
    type: 'text',
    'class': 'ant-input rec-caja-buscar',
    placeholder: 'Buscar por siniestro, póliza o comprador',
    style: 'margin-bottom:6px;display:none;'
  }).attr('autocomplete', 'off'));
  var $cobradas = $('<label>', { style: 'display:inline-flex;align-items:center;gap:6px;margin-bottom:6px;font-size:12px;cursor:pointer;' });
  $cobradas.append($('<input>', { type: 'checkbox', 'class': 'rec-caja-cobradas' }));
  $cobradas.append($('<span>').text('Incluir cobradas para reversión'));
  $caja.append($('<div>').append($cobradas));
  var $tabla = $(
    '<table class="ant-table rec-caja-tabla" style="width:100%;display:none;">' +
    '<thead class="ant-table-thead"><tr>' +
    '<th></th><th>Siniestro</th><th>Póliza</th><th>Cobertura</th><th>Comprador</th><th>Fecha</th><th>Moneda</th>' +
    '<th style="text-align:right;">Total</th><th style="text-align:right;">Aplicado</th><th style="text-align:right;">Pendiente</th><th>Estado</th>' +
    '</tr></thead><tbody class="ant-table-tbody"></tbody></table>'
  );
  $caja.append($('<div>', { style: 'max-height:260px;overflow:auto;' }).append($tabla));
  $caja.append($('<div>', { 'class': 'rec-caja-nota', style: 'margin-top:6px;font-size:12px;' }));
  $caja.append($('<a>', { href: '#', 'class': 'rec-caja-quitar', style: 'display:none;font-size:12px;' }).text('Quitar selección'));
  $contenedor.empty().append($caja);
  return $caja;
}

function pintarFilas($caja, filas, seleccionId) {
  var $tbody = $caja.find('.rec-caja-tabla tbody');
  $tbody.empty();
  filas.forEach(function (rec, indice) {
    var fondo = indice % 2 === 0 ? 'white' : '#f0f7ff';
    var $radio = $('<input>', { type: 'radio', name: 'selRecuperacionCaja', value: String(rec.id) });
    if (Number(rec.id) === Number(seleccionId)) $radio.prop('checked', true);
    var $tr = $('<tr>', { 'data-id': String(rec.id), style: 'cursor:pointer;' });
    $tr.append($('<td>', { style: 'text-align:center;' }).append($radio));
    $tr.append(celdaTextoRecuperacion(rec.claimCode));
    $tr.append(celdaTextoRecuperacion(rec.policyCode));
    $tr.append(celdaTextoRecuperacion(rec.coverageName));
    $tr.append(celdaTextoRecuperacion(texto(rec.buyerName) || 'Sin comprador'));
    $tr.append(celdaTextoRecuperacion(formatoFecha(rec.start)));
    $tr.append(celdaTextoRecuperacion(rec.currency));
    $tr.append(celdaMontoRecuperacion(rec.netIncome));
    var aplicado = saldo(rec, 'paidAmount');
    var pendiente = saldo(rec, 'pendingAmount');
    $tr.append(celdaMontoRecuperacion(aplicado));
    $tr.append(celdaMontoRecuperacion(pendiente));
    var estado = rec.noPendiente ? 'ya no figura como pendiente' : cobrada(rec) ? 'cobrada: sólo reversión' : '';
    $tr.append(celdaTextoRecuperacion(estado, 'rec-caja-estado-celda'));
    $tr.find('td').css('background-color', fondo);
    $tbody.append($tr);
  });
}

function notaSeleccion($caja, rec, montoCargado) {
  var partes = [];
  var aplicado = saldo(rec, 'paidAmount');
  var pendiente = saldo(rec, 'pendingAmount');
  if (aplicado !== null && pendiente !== null) {
    partes.push('Recuperación ' + rec.id + ' del siniestro ' + texto(rec.claimCode) + ': total ' + texto(rec.currency) + ' ' +
      formatoMonto(rec.netIncome) + ', aplicado ' + formatoMonto(aplicado) + ', pendiente ' + formatoMonto(pendiente) + '.');
    if (montoCargado) partes.push(pendiente > 0 ? 'Su pendiente quedó como monto del pago; puede modificarlo.'
      : 'Está cobrada: escriba como monto el valor negativo que se reversa.');
    partes.push(aplicado > 0
      ? 'El monto debe ser distinto de cero, entre ' + formatoMonto(-aplicado) + ' y ' + formatoMonto(pendiente) +
        '; un monto negativo reversa parte de lo aplicado.'
      : 'El monto debe ser mayor que cero y no superar el pendiente.');
  } else {
    partes.push('Recuperación ' + rec.id + ' del siniestro ' + texto(rec.claimCode) + ': ' + texto(rec.currency) + ' ' +
      formatoMonto(rec.netIncome) + '.');
  }
  if (!(Number(rec.clientId) > 0) && !(Number(rec.buyerId) > 0)) partes.push('La recuperación no tiene cliente identificado: seleccione el cliente.');
  var moneda = monedaIngreso();
  var $nota = $caja.find('.rec-caja-nota').empty();
  $nota.append($('<span>').text(partes.join(' ')));
  if (moneda && texto(rec.currency) && moneda !== texto(rec.currency)) {
    $nota.append($('<div>', { style: 'color:#d4380d;' }).text(
      'El ingreso está en ' + moneda + ' y la recuperación en ' + texto(rec.currency) + ': registre el ingreso en ' +
      texto(rec.currency) + ' o no podrá aplicarse.'
    ));
  }
  $caja.find('.rec-caja-quitar').show();
}

function iniciar() {
  var $contenedor = $('#contenedorRecuperaciones');
  if (!$contenedor.length || $contenedor.data('recCajaIniciado')) return;
  $contenedor.data('recCajaIniciado', true);

  var tipoIngreso = texto(me && me.incomeType);
  var $caja = pintarBase($contenedor, 'Recuperaciones pendientes');
  var $estado = $caja.find('.rec-caja-estado');
  var $reclamo = $caja.find('.rec-caja-reclamo').detach();
  var $cliente = $('#clientePA');
  var $clienteCampo = $cliente.closest('.form-group');
  if (!$clienteCampo.length) $clienteCampo = $cliente.parent();
  var $clienteParent = $clienteCampo.parent();
  var $filaBusqueda = $('<div>', {
    'class': 'rec-caja-busqueda-fila',
    style: 'display:flex;align-items:flex-end;gap:6px;width:100%;'
  });
  var $buscar = $('<button>', {
    type: 'button',
    title: 'Buscar',
    'aria-label': 'Buscar cliente o reclamo',
    'class': 'rec-caja-buscar-trigger',
    style: 'width:36px;min-width:36px;height:32px;cursor:pointer;'
  }).text('🔍');
  var $reclamoCampo = $('<div>', {
    'class': 'rec-caja-reclamo-campo',
    style: 'flex:1 1 0;min-width:0;margin:0;'
  });
  $reclamoCampo.append($('<label>', {
    style: 'display:block;margin-bottom:4px;'
  }).text('Reclamo'));
  var $reclamoControl = $('<div>', { style: 'width:100%;' });
  $reclamoControl.append($reclamo.css({ width: '100%', marginBottom: 0 }));
  $reclamoCampo.append($reclamoControl);
  if ($clienteCampo.length) {
    $clienteCampo.css({ flex: '1 1 0', minWidth: 0, width: 'auto', margin: 0 });
  } else {
    $clienteCampo = $('<div>', { style: 'flex:1 1 0;min-width:0;margin:0;' }).append($cliente);
  }
  var $clienteControl = $('<div>', { style: 'width:100%;' });
  $cliente.wrap($clienteControl);
  [$cliente[0], $reclamo[0]].forEach(function (elemento) {
    if (!elemento || !elemento.style || !elemento.style.setProperty) return;
    elemento.style.setProperty('border', '1px solid #56697a', 'important');
    elemento.style.setProperty('border-radius', '5px', 'important');
    elemento.style.setProperty('box-sizing', 'border-box', 'important');
  });
  $clienteCampo.find('.rec-caja-buscar-trigger').remove();
  if ($clienteParent.length) {
    $clienteCampo.replaceWith($filaBusqueda);
  } else {
    $contenedor.prepend($filaBusqueda);
  }
  $filaBusqueda.append($clienteCampo, $reclamoCampo, $buscar);
  var guardada = leerGuardada();
  if (guardada && Number(guardada.buyerId) > 0) {
    fijarCliente({ clientId: guardada.buyerId, clientName: guardada.buyerName, buyerId: guardada.buyerId });
  }
  var consultaActual = 0;
  invalidarRecuperaciones = function () {
    consultaActual++;
    guardada = null;
    recuperacionActiva = null;
    liberarCliente(false);
    clearTimeout($caja.data('recCajaFiltroTimer'));
    $('#hiddenRecuperacion').val('');
    $caja.find('.rec-caja-tabla').hide().find('tbody').empty();
    $caja.find('.rec-caja-nota').empty();
    $caja.find('.rec-caja-quitar').hide();
  };

  if (!tipoIngreso || !me || typeof me.exe !== 'function') {
    $estado.text('No se pudo identificar el tipo de ingreso. No se puede ejecutar sin seleccionar un reclamo.');
    return;
  }

  function cargar(filtros) {
    var consulta = ++consultaActual;
    var contexto = { incomeType: tipoIngreso };
    if ($caja.find('.rec-caja-cobradas').is(':checked')) contexto.includeSettled = true;
    Object.keys(filtros || {}).forEach(function (clave) {
      if (filtros[clave] !== undefined && filtros[clave] !== null && String(filtros[clave]).trim() !== '') {
        contexto[clave] = filtros[clave];
      }
    });
    $estado.text('Cargando recuperaciones pendientes…');
    me.exe('ExeChain', { chain: CHAIN_PENDIENTES, context: JSON.stringify(contexto) })
      .then(function (resp) {
        if (consulta !== consultaActual) return;
        if (!resp || resp.ok === false) throw new Error(resp && resp.msg ? resp.msg : 'sin respuesta');
        var salida = resp.outData && typeof resp.outData === 'object' ? resp.outData : {};
        var filas = Array.isArray(salida.data) ? salida.data : [];
        // Pintar la selección actual, no la capturada antes de la consulta.
        mostrar($caja, salida, filas, leerGuardada());
        if (filtros && filtros.claimId && filas.length) {
          var clienteComun = Number(filas[0].clientId);
          if (clienteComun > 0 && filas.every(function (fila) { return Number(fila.clientId) === clienteComun; })) {
            fijarCliente(filas[0]);
          }
        }
      })
      .catch(function (error) {
        if (consulta !== consultaActual) return;
        $estado.text('No se pudieron cargar las recuperaciones pendientes (' + (error && error.message ? error.message : String(error)) +
          '). No se puede ejecutar sin seleccionar un reclamo.');
      });
  }

  recargarPendientes = function (keepSelection) {
    var clientId = texto($('#hiddenCodigoCliente').val());
    var claimCode = texto($reclamo.val());
    // Sólo el cambio de inclusión conserva la selección; las búsquedas mantienen su invalidación nativa.
    if (keepSelection !== true) invalidarRecuperaciones();
    else if (!clientId && !claimCode) {
      var seleccion = leerGuardada();
      if (seleccion) {
        cargar({ salvageId: seleccion.id });
        return;
      }
    }
    if (!clientId && !claimCode) {
      $estado.text('Busque un cliente o escriba un reclamo para consultar sus recuperaciones.');
      $caja.find('.rec-caja-tabla').hide();
      return;
    }
    if (/^\d+$/.test(claimCode)) {
      cargar({ claimId: claimCode });
    } else {
      if (claimCode) {
        $estado.text('Ingrese el ID numérico del reclamo.');
        $caja.find('.rec-caja-tabla').hide();
        return;
      }
      cargar({ buyerId: clientId });
    }
  };

  function buscarCliente() {
    if (requiereClienteManual()) {
      if (typeof buscarClientePorNombre === 'function') buscarClientePorNombre();
      return;
    }
    invalidarRecuperaciones();
    $reclamo.val('');
    if (texto($('#hiddenCodigoCliente').val())) recargarPendientes();
    else if (typeof buscarClientePorNombre === 'function') buscarClientePorNombre();
  }
  $buscar.on('mousedown', function (event) { event.preventDefault(); });
  $buscar.on('click', function () {
    if (texto($reclamo.val())) recargarPendientes();
    else buscarCliente();
  });
  $cliente.on('keydown', function (event) {
    if (event.key === 'Enter' || event.which === 13) {
      event.preventDefault();
      buscarCliente();
    }
  });
  $reclamo.on('keydown', function (event) {
    if (event.key === 'Enter' || event.which === 13) {
      event.preventDefault();
      recargarPendientes();
    }
  });
  $caja.find('.rec-caja-cobradas').on('change', function () { recargarPendientes(true); });

  $reclamo.off('input').on('input', function () {
    invalidarRecuperaciones();
    $('#clientePA').val('').data('selectedItem', null).data('desdeRecuperacion', false).prop('readonly', false).removeAttr('title');
    $('#hiddenCodigoCliente').val('');
    validarCliente();
    var timer = setTimeout(function () { recargarPendientes(); }, 350);
    $caja.data('recCajaFiltroTimer', timer);
  });

  if (guardada) {
    cargar({ salvageId: guardada.id, includeSettled: true });
  } else {
    $estado.text('Busque un cliente o escriba un reclamo para consultar sus recuperaciones.');
  }
}

function mostrar($caja, salida, filas, guardada) {
  var $estado = $caja.find('.rec-caja-estado');
  var nombreTipo = texto(salida.nombreTipoRecuperacion);
  if (nombreTipo) $caja.children().first().text('Recuperaciones pendientes · ' + nombreTipo);

  var visibles = filas.slice();
  var seleccionId = guardada ? Number(guardada.id) : 0;
  if (guardada && !filas.some(function (f) { return Number(f.id) === seleccionId; })) {
    visibles.unshift(Object.assign({}, guardada, { noPendiente: true }));
  }

  if (salida.tipoRecuperacion === null || salida.tipoRecuperacion === undefined) {
    $estado.text('Este tipo de ingreso no tiene configurada su recuperación de siniestros. No se puede ejecutar; avise a soporte.');
  } else if (!filas.length) {
    $estado.text('No hay recuperaciones pendientes de este tipo. No se puede ejecutar sin seleccionar un reclamo.');
  } else {
    var cobradas = filas.filter(cobrada).length;
    var pendientes = filas.length - cobradas;
    $estado.text('Seleccione el reclamo mediante la recuperación que se cobra (obligatorio para ejecutar). ' + pendientes + ' pendiente' + (pendientes === 1 ? '' : 's') +
      (cobradas ? ', ' + cobradas + ' cobrada' + (cobradas === 1 ? '' : 's') + ' para reversión' : '') + '.');
  }
  if (!guardada) {
    recuperacionActiva = null;
    $caja.find('.rec-caja-nota').empty();
    $caja.find('.rec-caja-quitar').hide();
  }
  if (!visibles.length) {
    $caja.find('.rec-caja-tabla').hide();
    return;
  }

  $caja.find('.rec-caja-tabla').show();
  if (visibles.length > 8) $caja.find('.rec-caja-buscar').show();
  pintarFilas($caja, visibles, seleccionId);
  if (guardada) {
    var actual = visibles.filter(function (f) { return Number(f.id) === seleccionId; })[0] || guardada;
    recuperacionActiva = actual;
    if (!actual.noPendiente) fijarCliente(actual);
    if (!actual.noPendiente && cobrada(actual)) $caja.find('.rec-caja-cobradas').prop('checked', true);
    notaSeleccion($caja, actual, false);
  }

  $caja.find('.rec-caja-tabla tbody').off('click').on('click', 'tr', function (evento) {
    var id = Number($(this).attr('data-id'));
    var rec = visibles.filter(function (f) { return Number(f.id) === id; })[0];
    if (!rec || rec.noPendiente) {
      evento.preventDefault();
      return;
    }
    $(this).find('input[type="radio"]').prop('checked', true);
    var limpia = Object.assign({}, rec);
    delete limpia.noPendiente;
    // Los saldos se leen de la cadena, no del JSON guardado en un recibo.
    delete limpia.paidAmount;
    delete limpia.pendingAmount;
    delete limpia.paymentCount;
    recuperacionActiva = limpia;
    $('#hiddenRecuperacion').val(JSON.stringify(limpia));
    fijarCliente(limpia);
    var montoCargado = false;
    if (typeof me.setIncomeAmount === 'function') {
      var pendiente = saldo(rec, 'pendingAmount');
      // Una cobrada empieza en cero; el cajero introduce el negativo que desea reversar.
      me.setIncomeAmount(pendiente === null ? 0 : Math.max(pendiente, 0));
      montoCargado = true;
    }
    notaSeleccion($caja, rec, montoCargado);
  });

  $caja.find('.rec-caja-quitar').off('click').on('click', function (evento) {
    evento.preventDefault();
    recuperacionActiva = null;
    $('#hiddenRecuperacion').val('');
    $caja.find('input[name="selRecuperacionCaja"]').prop('checked', false);
    liberarCliente(true);
    $caja.find('.rec-caja-nota').empty();
    $(this).hide();
  });

  $caja.find('.rec-caja-buscar').off('input').on('input', function () {
    var filtro = texto($(this).val()).toLowerCase();
    $caja.find('.rec-caja-tabla tbody tr').each(function () {
      var id = Number($(this).attr('data-id'));
      var rec = visibles.filter(function (f) { return Number(f.id) === id; })[0] || {};
      var hay = [rec.claimCode, rec.policyCode, rec.buyerName].map(texto).join(' ').toLowerCase();
      $(this).toggle(!filtro || hay.indexOf(filtro) >= 0);
    });
  });
}

// -----------------------------
// Búsqueda de cliente (la de frmContactoPrimaAnticipada) para cuando no se elige recuperación
// -----------------------------
async function obtenerContactos(pagina, cantidad, search) {
  try {
    search = search.replace(/[%_]/g, '\\$&').replace(/'/g, "''");
    var filters = '(isPerson = 1 OR isPerson = 0)';
    if (/^\d+$/.test(search)) {
      filters += " AND (nationalId = '" + search + "' OR id = " + search + ')';
    } else if (/\d/.test(search)) {
      filters += " AND (cnp LIKE '" + search + "%' OR passport LIKE '" + search + "%' OR nif LIKE '" + search + "%')";
    } else {
      filters += " AND ((isPerson = 1 AND TRIM(CONCAT_WS(' ', name, surname1)) LIKE '" + search + "%')" +
        " OR (isPerson = 0 AND surname2 LIKE '" + search + "%'))";
    }
    var result = await me.exe('GetContacts', { size: cantidad, page: pagina, filter: filters });
    var filas = result && Array.isArray(result.outData) ? result.outData : [];
    var data = filas.map(function (con) {
      return {
        nombreCompleto: [con.name, con.middlename, con.surname1, con.surname2]
          .map(function (x) { return texto(x); })
          .filter(function (x) { return x; })
          .join(' '),
        identificacion: con.isPerson == true ? (con.idType == 'PAS' ? con.passport : con.cnp) : texto(con.nif),
        noCobis: texto(con.nationalId),
        codigo: con.id === undefined || con.id === null ? '' : con.id
      };
    });
    return { items: data, total: result && result.total ? result.total : 0 };
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    return { items: [], total: 0 };
  }
}

function agregarAutocomplete(cantidadPorPagina) {
  var $input = $('#clientePA');
  var $inputCodigo = $('#hiddenCodigoCliente');
  var $dropdown = null;
  var paginaActual = 0;
  var totalResultados = 0;
  var filtroActual = '';
  var busquedaActual = 0;

  async function cargarPagina(pagina, filtro) {
    var data = await obtenerContactos(pagina, cantidadPorPagina, filtro);
    totalResultados = data.total;
    return data.items;
  }

  function elegirCliente(item) {
    busquedaActual++;
    $input.val(item.nombreCompleto || '');
    $inputCodigo.val(item.codigo || '');
    $input.data('selectedItem', item);
    validarCliente();
    if ($dropdown) $dropdown.remove();
    if (requiereClienteManual()) {
      notaSeleccion($('#contenedorRecuperaciones .rec-caja'),
        Object.assign({}, recuperacionActiva, { clientId: item.codigo, clientName: item.nombreCompleto }), false);
      return;
    }
    $('.rec-caja-reclamo').val('');
    if (typeof recargarPendientes === 'function') recargarPendientes();
  }

  function renderItems(items) {
    $dropdown.empty();
    items.forEach(function (item) {
      var $item = $('<div></div>').css({ padding: '8px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column' });
      var $line1 = $('<div></div>');
      $line1.append($('<b></b>').text(texto(item.codigo)), document.createTextNode(' - ' + texto(item.nombreCompleto)));
      var $line2 = $('<div></div>').text('Identificación: ' + texto(item.identificacion)).css({ fontSize: '12px', color: '#666' });
      var $line3 = $('<div></div>').text('Cobis: ' + texto(item.noCobis)).css({ fontSize: '12px', color: '#666' });
      $item.append($line1, $line2, $line3);
      $item.hover(
        function () { $(this).css('background', '#bae7ff'); },
        function () { $(this).css('background', 'white'); }
      );
      $item.on('mousedown', function (event) { event.preventDefault(); });
      $item.off('click').click(function () { elegirCliente(item); });
      $dropdown.append($item);
    });

    var totalPaginas = Math.ceil(totalResultados / cantidadPorPagina) - 1;
    if (totalPaginas > 0) {
      var $paginacion = $('<div></div>').css({ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderTop: '1px solid #d9d9d9' });
      var $prev = $('<button type="button">«</button>').css({ cursor: 'pointer' }).prop('disabled', paginaActual === 0);
      var $next = $('<button type="button">»</button>').css({ cursor: 'pointer' }).prop('disabled', paginaActual === totalPaginas);
      $prev.click(async function () {
        if (paginaActual > 0) {
          paginaActual--;
          renderItems(await cargarPagina(paginaActual, filtroActual));
        }
      });
      $next.click(async function () {
        if (paginaActual < totalPaginas) {
          paginaActual++;
          renderItems(await cargarPagina(paginaActual, filtroActual));
        }
      });
      $paginacion.append($prev, $next);
      $dropdown.append($paginacion);
    }
  }

  async function mostrarDropdown(filtro, elegirUnico) {
    var busqueda = ++busquedaActual;
    try {
      filtroActual = filtro;
      paginaActual = 0;
      var items = await cargarPagina(paginaActual, filtro);
      if (busqueda !== busquedaActual || $input.prop('readonly') || texto($input.val()) !== filtro) return;
      if ($dropdown) $dropdown.remove();
      if (!items.length) {
        $('.rec-caja-estado').text('No se encontraron clientes con ese nombre.');
        return;
      }
      if (elegirUnico && items.length === 1 && totalResultados === 1) {
        elegirCliente(items[0]);
        return;
      }
      if (elegirUnico) $('.rec-caja-estado').text('Seleccione el cliente de la lista para consultar sus recuperaciones.');
      var rect = $input[0] && $input[0].getBoundingClientRect ? $input[0].getBoundingClientRect() : null;
      $dropdown = $('<div></div>').addClass('autocomplete-dropdown').css({
        position: 'fixed',
        top: rect ? rect.bottom : 0,
        left: rect ? rect.left : 0,
        width: rect ? rect.width : $input.outerWidth(),
        border: '1px solid #d9d9d9',
        background: '#fff',
        'z-index': 10001,
        'max-height': '200px',
        overflow: 'auto',
        'box-shadow': '0 2px 8px rgba(0,0,0,0.15)'
      });
      renderItems(items);
      $(document.body).append($dropdown);
      activarCerrarDropdown($input, $dropdown);
    } catch (error) {
      console.error(error);
    }
  }

  buscarClientePorNombre = function () {
    var valor = texto($input.val());
    if (valor) mostrarDropdown(valor, true);
    else $('.rec-caja-estado').text('Escriba el nombre del cliente para buscar.');
  };

  $input.off('input').on('input', function () {
    if ($input.prop('readonly')) return;
    busquedaActual++;
    $input.data('selectedItem', null);
    $inputCodigo.val('');
    if (!requiereClienteManual() && typeof invalidarRecuperaciones === 'function') invalidarRecuperaciones();
    validarCliente();
    var valor = texto($(this).val());
    if (!valor) {
      if ($dropdown) $dropdown.remove();
      return;
    }
    mostrarDropdown(valor);
  });

  $input.off('blur').on('blur', function () {
    if ($input.prop('readonly')) return;
    var valor = texto($(this).val());
    if (!valor) {
      $inputCodigo.val('');
      validarCliente();
      return;
    }
    if (!$input.data('selectedItem')) {
      // Conservar el texto para que el botón Buscar pueda resolverlo; el código sigue vacío.
      $inputCodigo.val('');
    }
    validarCliente();
  });
}

function activarCerrarDropdown($input, $dropdown) {
  $input.on('mousedown', function (e) { e.stopPropagation(); });
  $dropdown.on('mousedown', function (e) { e.stopPropagation(); });
  $(document).on('mousedown.dropdown', function (e) {
    if (!$input.is(e.target) && !$dropdown.is(e.target) && $dropdown.has(e.target).length === 0) {
      $dropdown.remove();
      $(document).off('mousedown.dropdown');
    }
  });
}

function logica() {
  try {
    var campo = document.getElementById('clientePA');
    if (campo) {
      campo.setAttribute('autocomplete', 'off');
      if (texto(campo.value) && texto($('#hiddenCodigoCliente').val()) && !$('#clientePA').data('selectedItem')) {
        $('#clientePA').data('selectedItem', { nombreCompleto: texto(campo.value), codigo: texto($('#hiddenCodigoCliente').val()) });
      }
      validarCliente();
      agregarAutocomplete(10);
    }
    iniciar();
    validarCliente();
  } catch (error) {
    console.error('frmAplicacionRecuperacionCaja:', error);
  }
}

// La vista vuelve a pintar el formulario un par de veces al abrirlo: se espera al definitivo, como el formulario de
// cliente de siempre.
function esperarElemento(selector, intervalo, intentos) {
  return new Promise(function (resolve, reject) {
    var n = 0;
    function revisar() {
      var $el = $(selector);
      if ($el.length) {
        resolve($el);
        return;
      }
      n++;
      if (n >= intentos) {
        reject(new Error('Elemento no encontrado: ' + selector));
        return;
      }
      setTimeout(revisar, intervalo);
    }
    setTimeout(revisar, intervalo);
  });
}

esperarElemento('#contenedorRecuperaciones', 300, 15)
  .then(function () { logica(); })
  .catch(function (error) { console.warn(error && error.message ? error.message : error); });
