/*
Name: frmOAPersonaAfectadaAU
Author: AIDEN (MSN-000120)
Description: Objeto afectado del reclamo (Automóvil): persona afectada, con el diseño de la imagen «Nuevo Objeto Afectado:
             Persona». Nombre con lupa que busca personas en Contactos (nombre, cédula o código) y llena Nombre,
             Cédula, Sexo y Estado Civil; todo queda editable. Sexo M/F y Estado Civil del catálogo nativo, como la
             ficha del contacto. Obligatorios Nombre, Cédula y Motivo (asterisco nativo, sin fondo amarillo).
             Mismos nombres de campo que frmOAPersonaAseguradaAU (676).
             Corre dentro de la vista 48 (resumen del reclamo): context = {policyId, lob, claimId, coverageId, formId}.
             Sin comandos ni triggers: toda la lógica vive en el formulario y solo hace lecturas.
Category: FORM
Version: 1.00
CreateDate: 31-10-2026
*/

var me = this;

(function () {
  // ---------------------------------------------------------------------------------------------
  // Shared core (MSN-000063, trimmed for MSN-000120): scoped to the claim view runtime ($ = this form, exe, context).
  // ---------------------------------------------------------------------------------------------
  var VACIA = 'Seleccione…';
  var CSS_BASE = [
    '.oa-au-buscar{display:flex;gap:4px;position:relative;align-items:center}',
    '.oa-au-buscar input{flex:1 1 auto}',
    '.oa-au-btn{flex:0 0 auto;padding:2px 8px;border:1px solid #aebfd4;border-radius:5px;background:#fff;cursor:pointer;line-height:22px}',
    '.oa-au-btn:hover{border-color:#1677ff;color:#1677ff}',
    '.oa-au-buscar input:disabled+.oa-au-btn{pointer-events:none;opacity:.4;cursor:default}',
    '.oa-au-resultados{position:absolute;top:100%;left:0;right:0;z-index:1050;background:#fff;border:1px solid #d9d9d9;',
    'border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15);max-height:260px;overflow-y:auto}',
    '.oa-au-resultado{padding:6px 10px;cursor:pointer;border-bottom:1px solid #f0f0f0}',
    '.oa-au-resultado:hover{background:#e6f4ff}',
    '.oa-au-resultado small{color:rgba(0,0,0,.55);margin-left:6px}',
    '.oa-au-vacio{padding:8px 10px;color:rgba(0,0,0,.45)}'
  ].join('');
  var cache = {};

  function rootForm() {
    var $r = $('.rendered-form').first();
    if (!$r.length) $r = $('[name="' + MARK + '"]').closest('form');
    return $r;
  }
  function control($root, name) { return $root.find('[name="' + name + '"]'); }
  function valueOf($root, name) {
    var v = control($root, name).first().val();
    return v === null || v === undefined ? '' : String(v).trim();
  }
  function decodeHtml(v) { return $('<textarea/>').html(v == null ? '' : String(v)).text(); }
  function limpio(v) { return decodeHtml(v).replace(/\s+/g, ' ').trim(); }
  function esc(v) { return $('<div/>').text(v == null ? '' : String(v)).html(); }
  function sql(v) { return String(v).replace(/'/g, "''"); }
  function norm(v) {
    return limpio(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function fire(el, type) {
    if (typeof Event === 'function') el.dispatchEvent(new Event(type, { bubbles: true }));
    else $(el).trigger(type);
  }
  function aviso($root, text, type) {
    $root.find('.oa-au-status').remove();
    if (!text) return;
    $('<div class="oa-au-status alert alert-' + (type || 'warning') + '"></div>').text(text).insertAfter($root.find('style.oa-au-style').first());
  }

  // Empty option of each select: its own text (PLACEHOLDERS) or the generic one.
  function vaciaDe(name) { return typeof PLACEHOLDERS === 'object' && PLACEHOLDERS[name] || VACIA; }
  function esVacia(text) {
    if (text === VACIA) return true;
    if (typeof PLACEHOLDERS !== 'object') return false;
    return Object.keys(PLACEHOLDERS).some(function (k) { return PLACEHOLDERS[k] === text; });
  }

  // Two-way catalog match: the stored value may be the code or the label (accents and case ignored).
  function matchOption($sel, value) {
    var text = value === null || value === undefined ? '' : String(value).trim();
    if (!text) return '';
    var $opts = $sel.find('option');
    var byCode = $opts.filter(function () { return this.value === text; });
    if (byCode.length) return text;
    var n = norm(text);
    var byLabel = $opts.filter(function () { return this.value !== '' && norm(this.text) === n; });
    return byLabel.length ? byLabel.first().val() : null;
  }

  // Assigns a value and tells the view, so it is saved with the affected object.
  function setValue($root, name, value) {
    var $c = control($root, name).first();
    if (!$c.length) return;
    var text = value === null || value === undefined ? '' : String(value).trim();
    if ($c.is('select') && text) {
      var m = matchOption($c, text);
      if (m === null) $c.append($('<option></option>').attr('value', text).text(text));
      else text = m;
    }
    if (String($c.val() || '') === text) return;
    $c.val(text);
    fire($c[0], 'input'); fire($c[0], 'change');
  }

  // Saved value of a select: the live value when it is a real option, else what the renderer left in user-data.
  // formRender paints the empty option with its label as value: that placeholder is not a value.
  function savedValue($sel) {
    var v = $sel.val();
    if (v && !esVacia(v)) return String(v);
    var ud = $sel.attr('user-data');
    return ud && !esVacia(ud) ? String(ud) : '';
  }
  function normalizeEmpty($root) {
    $root.find('select option').each(function () {
      if (esVacia(this.text) && this.value !== '') {
        var $sel = $(this).closest('select'); var was = $sel.val() === this.value;
        this.value = '';
        if (was) $sel.val('');
      }
    });
  }

  function fillSelect($root, name, items, keep) {
    var $sel = control($root, name).first();
    if (!$sel.length) return;
    var actual = keep === undefined ? savedValue($sel) : keep;
    $sel.empty().append($('<option></option>').attr('value', '').text(vaciaDe(name)));
    var seen = {};
    items.forEach(function (it) {
      if (it.value === '' || seen[it.value]) return;
      seen[it.value] = true;
      $sel.append($('<option></option>').attr('value', it.value).text(it.label));
    });
    var m = matchOption($sel, actual);
    if (actual && m === null) { $sel.append($('<option></option>').attr('value', actual).text(actual)); m = actual; }
    $sel.val(m || '');
    if (String(actual || '') !== String(m || '')) { fire($sel[0], 'input'); fire($sel[0], 'change'); }
  }

  function once(key, producer) {
    if (!cache[key]) cache[key] = producer().catch(function () { delete cache[key]; return []; });
    return cache[key];
  }
  function repoCatalog(cmd, filter) {
    return once('c:' + cmd + ':' + (filter || ''), function () {
      var data = { operation: 'GET', size: 2000 };
      if (filter) data.filter = filter;
      return exe(cmd, data).then(function (r) { return r && r.ok !== false && Array.isArray(r.outData) ? r.outData : []; });
    });
  }
  // Native marital status catalog (the one of the contact record): the value is the catalog id.
  function estadosCiviles() { return repoCatalog('RepoMaritalStatusCatalog').then(function (rows) { return rows.map(function (r) { return { value: String(r.id), label: limpio(r.name) }; }); }); }

  // Native style: no yellow background (required = the native asterisk).
  function addStyle($root) {
    normalizeEmpty($root);
    if ($root.find('style.oa-au-style').length) return;
    $('<style class="oa-au-style"></style>').text(CSS_BASE + (typeof CSS_EXTRA === 'string' ? CSS_EXTRA : '')).prependTo($root);
  }
  function paintNative($root) {
    $root.attr('autocomplete', 'off');
    $root.find('input, select, textarea').each(function () {
      if (this.type === 'hidden' || this.type === 'checkbox') return;
      this.setAttribute('autocomplete', 'off');
      this.style.setProperty('background-color', '#fff', 'important');
    });
  }

  // Contact search (magnifier) next to a text field, by name, id number or code. PERSONS_ONLY limits it to natural persons.
  var NOMBRE_SQL = "(RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(middleName,''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,'')))";
  function cedulaDe(c) { return limpio(c && (c.cnp || c.nationalId || c.passport || c.nif) || ''); }
  function nombreDe(c) { return limpio(c && (c.FullName || [c.name, c.middleName, c.surname1, c.surname2].filter(Boolean).join(' ')) || ''); }
  function mountSearch($root, name) {
    var $in = control($root, name).first();
    if (!$in.length || $in.parent().hasClass('oa-au-buscar')) return;
    $in.wrap('<div class="oa-au-buscar"></div>');
    $in.after('<span class="oa-au-btn" role="button" tabindex="0" title="Buscar contacto">&#128269;</span>');
  }
  function closeResults($root) { $root.find('.oa-au-resultados').remove(); }
  function search($root, name, onPick) {
    var $in = control($root, name).first();
    if ($in.prop('disabled') || $in.prop('readonly')) return;
    var $wrap = $in.closest('.oa-au-buscar');
    var texto = String($in.val() || '').trim();
    var id = /^\d+$/.test(texto) && Number.isSafeInteger(Number(texto)) ? Number(texto) : 0;
    closeResults($root);
    if (texto.length < 3 && !id) { aviso($root, 'Escriba al menos 3 caracteres del nombre o de la cédula, o el código del contacto, y presione la lupa.'); return; }
    aviso($root, '');
    // CHARINDEX, not LIKE: the GetContacts filter rejects LIKE in the middle of the condition.
    var contiene = function (t, col) { return "CHARINDEX(N'" + sql(t) + "', " + col + ') > 0'; };
    var porNombre = texto.split(/\s+/).filter(Boolean).map(function (p) { return contiene(p, NOMBRE_SQL); }).join(' AND ');
    var filtro = '((' + porNombre + ') OR ' + contiene(texto, "ISNULL(cnp,'')") + ' OR ' + contiene(texto, "ISNULL(nationalId,'')") +
      ' OR ' + contiene(texto, "ISNULL(passport,'')") + ' OR ' + contiene(texto, "ISNULL(nif,'')") + (id ? ' OR [id]=' + id : '') + ')';
    if (typeof PERSONS_ONLY === 'boolean' && PERSONS_ONLY) filtro = 'isPerson=1 AND ' + filtro;
    var $res = $('<div class="oa-au-resultados"><div class="oa-au-vacio">Buscando…</div></div>');
    $wrap.append($res);
    exe('GetContacts', { filter: filtro, size: 10 }).then(function (r) {
      var lista = (r && r.ok !== false && r.outData) || [];
      if (!lista.length) { $res.html('<div class="oa-au-vacio">Sin coincidencias</div>'); return; }
      $res.empty();
      lista.forEach(function (c) {
        $('<div class="oa-au-resultado" role="option" tabindex="0"></div>')
          .html(esc(nombreDe(c)) + '<small>' + esc(cedulaDe(c)) + '</small>').data('oaContacto', c).appendTo($res);
      });
    }).catch(function () { $res.html('<div class="oa-au-vacio">No se pudo buscar</div>'); });
    $root.off('.oaAuPick').on('click.oaAuPick keydown.oaAuPick', '.oa-au-resultado', function (e) {
      if (e.type === 'keydown' && e.key !== 'Enter') return;
      e.preventDefault();
      onPick($(this).data('oaContacto'));
      closeResults($root);
    });
  }
  function bindSearch($root, name, onPick) {
    mountSearch($root, name);
    $root.off('.oaAuSearch')
      .on('click.oaAuSearch keydown.oaAuSearch', '.oa-au-btn', function (e) {
        if (e.type === 'keydown' && e.key !== 'Enter') return;
        e.preventDefault(); search($root, name, onPick);
      })
      .on('keydown.oaAuSearch', '[name="' + name + '"]', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); search($root, name, onPick); }
        if (e.key === 'Escape') closeResults($root);
      });
  }

  // ---------------------------------------------------------------------------------------------
  // frmOAPersonaAfectadaAU (affected person, editable; the magnifier on Nombre fills Nombre, Cédula, Sexo and Estado Civil)
  // ---------------------------------------------------------------------------------------------
  var MARK = 'asegMotivo';
  var CSS_EXTRA = '';
  var PERSONS_ONLY = true;
  var PLACEHOLDERS = { asegSexo: 'SELECCIONE UN SEXO', asegEstadoCivil: 'SELECCIONE UN ESTADO' };
  var filling = false;

  function pickContact($root, c) {
    if (!c) return;
    var sexo = String(c.gender || c.sex || '').trim().toUpperCase();
    var estadoCivil = c.maritalStatus === null || c.maritalStatus === undefined ? '' : String(c.maritalStatus);
    filling = true;
    try {
      setValue($root, 'asegNombre', nombreDe(c));
      setValue($root, 'asegCedula', cedulaDe(c));
      setValue($root, 'asegSexo', sexo === 'M' || sexo === 'F' ? sexo : '');
      setValue($root, 'asegContactId', c.id);
    } finally {
      filling = false;
    }
    estadosCiviles().then(function (items) {
      if (control($root, 'asegEstadoCivil').first().find('option').length <= 1) fillSelect($root, 'asegEstadoCivil', items);
      setValue($root, 'asegEstadoCivil', estadoCivil);
      paintNative($root);
    });
  }

  function initialize() {
    var $root = rootForm();
    if (!$root.length) return;
    addStyle($root);
    paintNative($root);
    estadosCiviles().then(function (items) {
      fillSelect($root, 'asegEstadoCivil', items);
      paintNative($root);
    }).catch(function (e) {
      console.error('frmOAPersonaAfectadaAU', e);
      aviso($root, 'No fue posible cargar el catálogo de estados civiles.', 'danger');
    });
    bindSearch($root, 'asegNombre', function (c) { pickContact($root, c); });
    // A name or id number typed after choosing a contact no longer belongs to that contact: drop the link.
    $root.off('.oaAfectada').on('input.oaAfectada', '[name="asegNombre"], [name="asegCedula"]', function () {
      if (!filling) setValue($root, 'asegContactId', '');
    });
  }

  initialize();
})();
