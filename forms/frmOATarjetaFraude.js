/*
Name: frmOATarjetaFraude
Author: Global
Description: Objeto afectado del reclamo para el ramo 52 (Riesgos Varios, fraude de tarjeta).
             - Lupa junto a Asegurado: busca contactos persona por nombre, cédula o código y al elegir uno carga
               nombre, No. SIS (código del contacto), No. Cobis, cédula, fecha de nacimiento, edad y sexo.
             - No. SIS, No. Cobis y Edad son de solo lectura; la Edad se recalcula desde F. Nacimiento.
             - Listas fijas: Sexo, Tarjeta Habiente, Tipo de Tarjeta, Tipo de Transacción y Lugar del Siniestro.
             - Sin comandos ni triggers: toda la lógica vive en el formulario y solo hace lecturas.
Category: FORM
Version: 1.00
CreateDate: 30-09-2026
*/

var me = this;

(function () {
  var VACIA = 'Seleccione…';
  var READ_ONLY = ['colNoSis', 'colNoCobis', 'colEdad'];
  var NOMBRE_SQL = "(RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(middleName,''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,'')))";

  var CSS = [
    '.oa-tf-readonly{background:#f5f7fa!important;color:#44546a!important;cursor:default}',
    '.oa-tf-buscar{display:flex;gap:4px;position:relative}',
    '.oa-tf-buscar input{flex:1 1 auto}',
    '.oa-tf-btn{flex:0 0 auto;padding:0 9px;border:1px solid #aebfd4;border-radius:5px;background:#fff;cursor:pointer}',
    '.oa-tf-btn:hover{border-color:#1677ff;color:#1677ff}',
    '.oa-tf-resultados{position:absolute;top:100%;left:0;right:0;z-index:1050;background:#fff;border:1px solid #d9d9d9;',
    'border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15);max-height:260px;overflow-y:auto}',
    '.oa-tf-resultado{padding:6px 10px;cursor:pointer;border-bottom:1px solid #f0f0f0}',
    '.oa-tf-resultado:hover{background:#e6f4ff}',
    '.oa-tf-resultado small{color:rgba(0,0,0,.55);margin-left:6px}',
    '.oa-tf-vacio{padding:8px 10px;color:rgba(0,0,0,.45)}',
    '.oa-seccion{color:#15428b;font-weight:600;border-bottom:1px solid #99bbe8;padding-bottom:3px;margin:6px 0 4px}'
  ].join('');

  //////////////////////////////////////////////
  // Utilidades
  //////////////////////////////////////////////

  function rootForm() {
    var $root = $('.rendered-form').first();
    if (!$root.length) $root = $('[name="colTipoTarjeta"]').closest('form');
    return $root;
  }

  function control($root, name) { return $root.find('[name="' + name + '"]'); }

  function valueOf($root, name) {
    var value = control($root, name).val();
    return value === null || value === undefined ? '' : String(value).trim();
  }

  function decodeHtml(v) { return $('<textarea/>').html(v == null ? '' : String(v)).text(); }
  function limpio(v) { return decodeHtml(v).replace(/\s+/g, ' ').trim(); }
  function esc(v) { return $('<div/>').text(v == null ? '' : String(v)).html(); }
  function sql(v) { return String(v).replace(/'/g, "''"); }

  function fire(element, type) {
    if (typeof Event === 'function') element.dispatchEvent(new Event(type, { bubbles: true }));
    else $(element).trigger(type);
  }

  // Asigna el valor y avisa a la pantalla para que lo guarde con el objeto afectado.
  function setValue($root, name, value) {
    var $control = control($root, name);
    if (!$control.length) return;
    var text = value === null || value === undefined ? '' : String(value).trim();
    if ($control.is('select') && text && !$control.find('option').filter(function () { return this.value === text; }).length) {
      $control.append($('<option></option>').attr('value', text).text(text));
    }
    if (String($control.val() || '') === text) return;
    $control.val(text);
    fire($control[0], 'input');
    fire($control[0], 'change');
  }

  function aviso($root, text) {
    $root.find('.oa-tf-status').remove();
    if (!text) return;
    $('<div class="oa-tf-status alert alert-warning"></div>').text(text).prependTo($root);
  }

  function fechaIso(v) {
    var m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[1] + '-' + m[2] + '-' + m[3] : '';
  }

  function edadDesde(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    var hoy = new Date(), mes = Number(m[2]) - 1, dia = Number(m[3]);
    var edad = hoy.getFullYear() - Number(m[1]);
    if (hoy.getMonth() < mes || (hoy.getMonth() === mes && hoy.getDate() < dia)) edad--;
    return edad < 0 || edad > 130 ? '' : edad;
  }

  function edadDe(c) {
    if (c.currentAge !== undefined && c.currentAge !== null && c.currentAge !== '' && !isNaN(c.currentAge)) return Number(c.currentAge);
    return edadDesde(fechaIso(c.birth));
  }

  //////////////////////////////////////////////
  // Presentación
  //////////////////////////////////////////////

  function addStyle($root) {
    if ($root.find('style.oa-tf-style').length) return;
    $('<style class="oa-tf-style"></style>').text(CSS).prependTo($root);
  }

  function lockReadOnly($root) {
    READ_ONLY.forEach(function (name) {
      control($root, name).prop('readonly', true).attr('aria-readonly', 'true').attr('tabindex', '-1')
        .addClass('oa-tf-readonly');
    });
  }

  function deshabilitarAutocompletado($root) {
    $root.attr('autocomplete', 'off');
    $root.find('input, select, textarea')
      .attr('autocomplete', 'off')
      .attr('data-lpignore', 'true');
  }

  // Listas fijas: la opción vacía puede pintarse con el texto como valor; se normaliza a ''.
  function normalizarVacia($root) {
    $root.find('select').each(function () {
      var $sel = $(this);
      var $o = $sel.find('option').first();
      if (!$o.length || $o.text() !== VACIA || $o.attr('value') === '') return;
      var eraElla = $sel.val() === $o.attr('value');
      $o.attr('value', '');
      var guardado = $sel.attr('user-data');
      if (eraElla) {
        $sel.val(guardado && $sel.find('option').filter(function () { return this.value === guardado; }).length ? guardado : '');
      }
    });
  }

  function actualizarEdad($root) {
    var nacimiento = valueOf($root, 'colFechaNacimiento');
    if (nacimiento) setValue($root, 'colEdad', edadDesde(nacimiento));
  }

  function validarAsegurado($root) {
    var $asegurado = control($root, 'colAsegurado').first();
    if (!$asegurado.length || typeof $asegurado[0].setCustomValidity !== 'function') return;
    var id = valueOf($root, 'colContactId') || valueOf($root, 'colNoSis');
    $asegurado[0].setCustomValidity(/^\d+$/.test(id) && Number(id) > 0
      ? '' : 'Seleccione el asegurado con la lupa.');
  }

  //////////////////////////////////////////////
  // Búsqueda del asegurado
  //////////////////////////////////////////////

  function montarBusqueda($root) {
    var $in = control($root, 'colAsegurado');
    if (!$in.length || $in.parent().hasClass('oa-tf-buscar')) return;
    $in.wrap('<div class="oa-tf-buscar"></div>');
    $in.after('<button type="button" class="oa-tf-btn" title="Buscar contacto">&#128269;</button>');
  }

  function cerrarResultados($root) { $root.find('.oa-tf-resultados').remove(); }

  function buscar($root) {
    var $in = control($root, 'colAsegurado');
    var $wrap = $in.closest('.oa-tf-buscar');
    var texto = String($in.val() || '').trim();
    var contactId = /^\d+$/.test(texto) && Number.isSafeInteger(Number(texto)) ? Number(texto) : 0;
    cerrarResultados($root);
    if (texto.length < 3 && !contactId) {
      aviso($root, 'Escriba al menos 3 caracteres del nombre o de la cédula, o el código del contacto, y presione la lupa.');
      return;
    }
    aviso($root, '');

    // CHARINDEX y no LIKE: el filtro de GetContacts rechaza LIKE en medio de la condición.
    var contiene = function (t, col) { return "CHARINDEX(N'" + sql(t) + "', " + col + ') > 0'; };
    var porNombre = texto.split(/\s+/).filter(Boolean).map(function (p) { return contiene(p, NOMBRE_SQL); }).join(' AND ');
    var filtro = 'isPerson=1 AND ((' + porNombre + ') OR ' + contiene(texto, "ISNULL(cnp,'')") + ' OR ' +
      contiene(texto, "ISNULL(nationalId,'')") + ' OR ' + contiene(texto, "ISNULL(passport,'')") +
      (contactId ? ' OR [id]=' + contactId : '') + ')';

    var $res = $('<div class="oa-tf-resultados"><div class="oa-tf-vacio">Buscando…</div></div>');
    $wrap.append($res);
    me.exe('GetContacts', { filter: filtro, size: 10 }).then(function (r) {
      var lista = (r && r.ok !== false && r.outData) || [];
      if (!lista.length) { $res.html('<div class="oa-tf-vacio">Sin coincidencias</div>'); return; }
      $res.empty();
      lista.forEach(function (c) {
        var ced = c.cnp || c.nationalId || c.passport || '';
        $('<div class="oa-tf-resultado" role="option" tabindex="0"></div>')
          .html(esc(limpio(c.FullName)) + '<small>' + esc(ced) + '</small>')
          .data('oaContacto', c)
          .appendTo($res);
      });
    }).catch(function () { $res.html('<div class="oa-tf-vacio">No se pudo buscar</div>'); });
  }

  function elegir($root, c) {
    if (!c) return;
    setValue($root, 'colAsegurado', limpio(c.FullName));
    setValue($root, 'colContactId', c.id);
    setValue($root, 'colNoSis', c.id);
    setValue($root, 'colNoCobis', c.nationalId || '');
    setValue($root, 'colCedula', c.cnp || c.nationalId || c.passport || '');
    var nacimiento = fechaIso(c.birth);
    if (nacimiento) setValue($root, 'colFechaNacimiento', nacimiento);
    setValue($root, 'colEdad', edadDe(c));
    if (c.gender === 'M' || c.gender === 'F') setValue($root, 'colSexo', c.gender);
    validarAsegurado($root);
    cerrarResultados($root);
  }

  //////////////////////////////////////////////
  // Inicio
  //////////////////////////////////////////////

  function initialize() {
    var $root = rootForm();
    if (!$root.length) return;
    addStyle($root);
    deshabilitarAutocompletado($root);
    normalizarVacia($root);
    lockReadOnly($root);
    montarBusqueda($root);
    actualizarEdad($root);
    validarAsegurado($root);

    $root.off('.oaTarjetaFraude')
      .on('click.oaTarjetaFraude', '.oa-tf-btn', function (e) { e.preventDefault(); buscar($root); })
      .on('keydown.oaTarjetaFraude', '[name="colAsegurado"]', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); buscar($root); }
        if (e.key === 'Escape') cerrarResultados($root);
      })
      .on('click.oaTarjetaFraude keydown.oaTarjetaFraude', '.oa-tf-resultado', function (e) {
        if (e.type === 'keydown' && e.key !== 'Enter') return;
        e.preventDefault();
        elegir($root, $(this).data('oaContacto'));
      })
      .on('change.oaTarjetaFraude', '[name="colFechaNacimiento"]', function () { actualizarEdad($root); })
      .on('input.oaTarjetaFraude change.oaTarjetaFraude', '[name="colAsegurado"]', function () { validarAsegurado($root); });
  }

  initialize();
})();
