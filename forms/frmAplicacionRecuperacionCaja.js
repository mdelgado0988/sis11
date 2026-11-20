/**
 * Name: frmAplicacionRecuperacionCaja
 * Purpose: Formulario de los tipos de ingreso de caja que cobran recuperaciones de siniestro (tabla
 *   cfgTipoIngresoCajaRecuperacion). Lista las recuperaciones pendientes del tipo que corresponde
 *   (cadena cmdRecuperacionesPendientesCaja). Al elegir una, el cliente es su Comprador, su neto queda como monto
 *   del pago (editable) y la recuperación completa se guarda en el campo oculto hiddenRecuperacion; al ejecutar el
 *   ingreso, cmdAplicarRecuperacionCaja la da por cobrada. Sin elección, o sin recuperaciones pendientes, el ingreso
 *   sigue como hoy: búsqueda de cliente (la misma de frmContactoPrimaAnticipada).
 * Author: AIDEN (MSN-000219, AXX-10616)
 */
/*
 * Contexto (this) que arma la vista de caja: exe, incomeType (código del tipo de ingreso elegido),
 *   setIncomeAmount(monto) (lo pone en la única forma de pago) y getIncomeCurrency().
 * El campo oculto sólo se escribe por una acción del cajero (elegir o quitar): al abrir un ingreso guardado se
 *   conserva lo guardado y no se cambia el monto.
 */
var me = this;
var CHAIN_PENDIENTES = 'cmdRecuperacionesPendientesCaja';

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

function monedaIngreso() {
  try {
    return typeof me.getIncomeCurrency === 'function' ? texto(me.getIncomeCurrency()) : '';
  } catch (error) {
    return '';
  }
}

// -----------------------------
// Cliente: el Comprador de la recuperación, o la búsqueda de siempre
// -----------------------------
function fijarCliente(rec) {
  var $cliente = $('#clientePA');
  var $codigo = $('#hiddenCodigoCliente');
  var compradorId = Number(rec && rec.buyerId);
  if (!(compradorId > 0)) {
    // Sin Comprador: el cajero elige el cliente; si el campo tenía el Comprador de otra recuperación, se vacía.
    liberarCliente(true);
    return false;
  }
  var nombre = texto(rec.buyerName) || ('Contacto ' + compradorId);
  $cliente.val(nombre);
  $codigo.val(String(compradorId));
  $cliente.data('selectedItem', { nombreCompleto: nombre, identificacion: '', noCobis: '', codigo: compradorId });
  $cliente.data('desdeComprador', true);
  $cliente.prop('readonly', true).attr('title', 'Cliente tomado del Comprador de la recuperación');
  $('.autocomplete-dropdown').remove();
  return true;
}

function liberarCliente(limpiar) {
  var $cliente = $('#clientePA');
  var desdeComprador = $cliente.data('desdeComprador') === true;
  $cliente.prop('readonly', false).removeAttr('title');
  $cliente.data('desdeComprador', false);
  if (limpiar && desdeComprador) {
    $cliente.val('');
    $('#hiddenCodigoCliente').val('');
    $cliente.data('selectedItem', null);
  }
}

// -----------------------------
// Tabla de recuperaciones pendientes
// -----------------------------
function pintarBase($contenedor, titulo) {
  var $caja = $('<div>', { 'class': 'rec-caja', style: 'margin-top:10px;' });
  $caja.append($('<div>', { style: 'font-weight:600;margin-bottom:6px;' }).text(titulo));
  $caja.append($('<div>', { 'class': 'rec-caja-estado', style: 'color:#666;font-size:12px;margin-bottom:6px;' }));
  $caja.append($('<input>', {
    type: 'text',
    'class': 'ant-input rec-caja-buscar',
    placeholder: 'Buscar por siniestro, póliza o comprador',
    autocomplete: 'off',
    style: 'margin-bottom:6px;display:none;'
  }));
  var $tabla = $(
    '<table class="ant-table rec-caja-tabla" style="width:100%;display:none;">' +
    '<thead class="ant-table-thead"><tr>' +
    '<th></th><th>Siniestro</th><th>Póliza</th><th>Cobertura</th><th>Comprador</th><th>Fecha</th><th>Moneda</th>' +
    '<th style="text-align:right;">Monto</th>' +
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
    $tr.append($('<td>').text(texto(rec.claimCode)));
    $tr.append($('<td>').text(texto(rec.policyCode)));
    $tr.append($('<td>').text(texto(rec.coverageName)));
    $tr.append($('<td>').text(texto(rec.buyerName) || 'Sin comprador'));
    $tr.append($('<td>').text(formatoFecha(rec.start)));
    $tr.append($('<td>').text(texto(rec.currency)));
    $tr.append($('<td>', { style: 'text-align:right;' }).text(formatoMonto(rec.netIncome)));
    if (rec.noPendiente) $tr.append($('<td>', { style: 'color:#d4380d;font-size:12px;' }).text('ya no figura como pendiente'));
    $tr.find('td').css('background-color', fondo);
    $tbody.append($tr);
  });
}

function notaSeleccion($caja, rec, montoCargado) {
  var partes = [];
  partes.push('Recuperación ' + rec.id + ' del siniestro ' + texto(rec.claimCode) + ': ' + texto(rec.currency) + ' ' +
    formatoMonto(rec.netIncome) + '.');
  if (montoCargado) partes.push('Su neto quedó como monto del pago; puede modificarlo.');
  if (!(Number(rec.buyerId) > 0)) partes.push('La recuperación no tiene Comprador: seleccione el cliente.');
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
  var guardada = leerGuardada();
  if (guardada && Number(guardada.buyerId) > 0) fijarCliente(guardada);

  if (!tipoIngreso || !me || typeof me.exe !== 'function') {
    $estado.text('No se pudo identificar el tipo de ingreso: registre el ingreso como siempre.');
    return;
  }

  $estado.text('Cargando recuperaciones pendientes…');
  me.exe('ExeChain', { chain: CHAIN_PENDIENTES, context: JSON.stringify({ incomeType: tipoIngreso }) })
    .then(function (resp) {
      if (!resp || resp.ok === false) throw new Error(resp && resp.msg ? resp.msg : 'sin respuesta');
      var salida = resp.outData && typeof resp.outData === 'object' ? resp.outData : {};
      var filas = Array.isArray(salida.data) ? salida.data : [];
      mostrar($caja, salida, filas, guardada);
    })
    .catch(function (error) {
      $estado.text('No se pudieron cargar las recuperaciones pendientes (' + (error && error.message ? error.message : String(error)) +
        '). Puede registrar el ingreso como siempre.');
    });
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
    $estado.text('Este tipo de ingreso no cobra recuperaciones: registre el ingreso como siempre.');
  } else if (!filas.length) {
    $estado.text('No hay recuperaciones pendientes de este tipo: registre el ingreso como siempre.');
  } else {
    $estado.text('Elija la recuperación que se cobra (opcional). ' + filas.length + ' pendiente' + (filas.length === 1 ? '' : 's') + '.');
  }
  if (!visibles.length) return;

  $caja.find('.rec-caja-tabla').show();
  if (visibles.length > 8) $caja.find('.rec-caja-buscar').show();
  pintarFilas($caja, visibles, seleccionId);
  if (guardada) {
    var actual = visibles.filter(function (f) { return Number(f.id) === seleccionId; })[0] || guardada;
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
    $('#hiddenRecuperacion').val(JSON.stringify(limpia));
    fijarCliente(limpia);
    var montoCargado = false;
    if (typeof me.setIncomeAmount === 'function') {
      me.setIncomeAmount(Number(limpia.netIncome) || 0);
      montoCargado = true;
    }
    notaSeleccion($caja, limpia, montoCargado);
  });

  $caja.find('.rec-caja-quitar').off('click').on('click', function (evento) {
    evento.preventDefault();
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

  async function cargarPagina(pagina, filtro) {
    var data = await obtenerContactos(pagina, cantidadPorPagina, filtro);
    totalResultados = data.total;
    return data.items;
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
      $item.off('click').click(function () {
        $input.val(item.nombreCompleto || '');
        $inputCodigo.val(item.codigo || '');
        $input.data('selectedItem', item);
        $dropdown.remove();
      });
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

  async function mostrarDropdown(filtro) {
    try {
      filtroActual = filtro;
      paginaActual = 0;
      var items = await cargarPagina(paginaActual, filtro);
      if ($dropdown) $dropdown.remove();
      if (!items.length) return;
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

  $input.off('input').on('input', function () {
    if ($input.prop('readonly')) return;
    $input.data('selectedItem', null);
    $inputCodigo.val('');
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
      return;
    }
    if (!$input.data('selectedItem')) {
      $(this).val('');
      $inputCodigo.val('');
    }
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
      agregarAutocomplete(10);
    }
    iniciar();
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
