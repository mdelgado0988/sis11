/*
Name: frmOAPersonaAseguradaAU
Author: AIDEN (MSN-000063)
Description: Objeto afectado del reclamo (ramo 6, Automóvil): persona asegurada. Carga, en solo lectura, nombre,
             cédula, sexo y estado civil del asegurado principal de la póliza. Motivo es manual, editable y vacío
             en formularios nuevos. Ningún campo obligatorio. Sin fondo amarillo.
             Corre dentro de la vista 48 (resumen del reclamo): context = {policyId, lob, claimId, coverageId, formId}.
             Sin comandos ni triggers: toda la lógica vive en el formulario y solo hace lecturas.
Category: FORM
Version: 1.00
CreateDate: 12-10-2026
*/

var me = this;

(function () {
  // ---------------------------------------------------------------------------------------------
  // Shared core (MSN-000063): scoped to the claim view runtime ($ = this form, exe, context).
  // ---------------------------------------------------------------------------------------------
  var LOB = String(context && context.lob || '6');
  var POLICY_ID = Number(context && context.policyId);
  var VACIA = 'Seleccione…';
  var VEHICLE_FORM_ID = 655;   // form "automovil" of the line 6 insured object DTAUT
  var CSS_BASE = [
    '.oa-au-readonly{background:#f5f5f5!important;color:rgba(0,0,0,.55)!important;cursor:default}',
    'select.oa-au-readonly,input:checkbox.oa-au-readonly{pointer-events:none}',
    '.oa-au-buscar{display:flex;gap:4px;position:relative;align-items:center}',
    '.oa-au-buscar input{flex:1 1 auto}',
    '.oa-au-btn{flex:0 0 auto;padding:2px 8px;border:1px solid #aebfd4;border-radius:5px;background:#fff;cursor:pointer;line-height:22px}',
    '.oa-au-btn:hover{border-color:#1677ff;color:#1677ff}',
    '.oa-au-resultados{position:absolute;top:100%;left:0;right:0;z-index:1050;background:#fff;border:1px solid #d9d9d9;',
    'border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15);max-height:260px;overflow-y:auto}',
    '.oa-au-resultado{padding:6px 10px;cursor:pointer;border-bottom:1px solid #f0f0f0}',
    '.oa-au-resultado:hover{background:#e6f4ff}',
    '.oa-au-resultado small{color:rgba(0,0,0,.55);margin-left:6px}',
    '.oa-au-vacio{padding:8px 10px;color:rgba(0,0,0,.45)}',
    '.oa-au-oculto{display:none!important}'
  ].join('');
  var cache = {};

  function rootForm() {
    var $r = $('.rendered-form').first();
    if (!$r.length) $r = $('[name="' + MARK + '"]').closest('form');
    return $r;
  }
  // formRender names checkbox-group inputs "<name>[]".
  function control($root, name) {
    var $c = $root.find('[name="' + name + '"]');
    return $c.length ? $c : $root.find('[name="' + name + '[]"]');
  }
  function valueOf($root, name) {
    var $c = control($root, name).first();
    if ($c.is(':checkbox')) return $c.prop('checked') ? String($c.val() || 'true') : '';
    var v = $c.val();
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
    if ($c.is(':checkbox')) {
      var on = value === true || value === 'true' || value === $c.val();
      if ($c.prop('checked') === on) return;
      $c.prop('checked', on); fire($c[0], 'change');
      return;
    }
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
    if (v && v !== VACIA) return String(v);
    var ud = $sel.attr('user-data');
    return ud && ud !== VACIA ? String(ud) : '';
  }
  function normalizeEmpty($root) {
    $root.find('select option').each(function () {
      if (this.text === VACIA && this.value !== '') {
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
    $sel.empty().append($('<option></option>').attr('value', '').text(VACIA));
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
  function fullTable(name) {
    return once('t:' + name, function () {
      return exe('GetFullTable', { table: name }).then(function (r) {
        var rows = r && r.ok !== false && Array.isArray(r.outData) ? r.outData.slice(1) : [];
        return rows.filter(function (row) { return Array.isArray(row); });
      });
    });
  }
  function repoCatalog(cmd, filter) {
    return once('c:' + cmd + ':' + (filter || ''), function () {
      var data = { operation: 'GET', size: 2000 };
      if (filter) data.filter = filter;
      return exe(cmd, data).then(function (r) { return r && r.ok !== false && Array.isArray(r.outData) ? r.outData : []; });
    });
  }
  function active(row, col) { var s = String(row[col] == null ? '' : row[col]).trim().toUpperCase(); return s === '' || s === '1' || s === 'V'; }
  function sortByLabel(items) { return items.sort(function (a, b) { return a.label.localeCompare(b.label); }); }

  // Vehicle catalogs: the same tables the policy form "automovil" (DTAUT) reads, filtered by line.
  function tipos() { return fullTable('tblTipoPorRamo').then(function (rows) { return rows.filter(function (r) { return String(r[0]) === LOB && active(r, 4); }).map(function (r) { return { value: String(r[1]), label: limpio(r[2]) }; }); }); }
  function usos() { return fullTable('tblUsoPorRamo').then(function (rows) { return rows.filter(function (r) { return String(r[0]) === LOB && active(r, 4); }).map(function (r) { return { value: String(r[1]), label: limpio(r[2]) }; }); }); }
  function marcas() { return fullTable('tbMarcas').then(function (rows) { return sortByLabel(rows.filter(function (r) { return String(r[0]) === LOB && active(r, 3); }).map(function (r) { return { value: String(r[1]), label: limpio(r[2]) }; })); }); }
  function modelos(marca) { return fullTable('tbModelos').then(function (rows) { return sortByLabel(rows.filter(function (r) { return String(r[0]) === LOB && String(r[1]) === String(marca) && active(r, 4); }).map(function (r) { return { value: String(r[2]), label: limpio(r[3]) }; })); }); }
  // Location catalogs: the native catalogs the other affected-object forms read.
  function codeName(rows) { return sortByLabel(rows.map(function (r) { return { value: String(r.code), label: limpio(r.name) }; })); }
  function paises() { return repoCatalog('RepoCountryCatalog').then(codeName); }
  function provincias(pais) { return pais ? repoCatalog('RepoStateCatalog', "countryCode='" + sql(pais) + "'").then(codeName) : Promise.resolve([]); }
  function ciudades(prov) { return prov ? repoCatalog('RepoCityCatalog', "stateCode='" + sql(prov) + "'").then(codeName) : Promise.resolve([]); }
  function corregimientos(ciudad) { return ciudad ? repoCatalog('RepoSectorCatalog', "cityCode='" + sql(ciudad) + "'").then(codeName) : Promise.resolve([]); }
  function estadosCiviles() { return repoCatalog('RepoMaritalStatusCatalog').then(function (rows) { return rows.map(function (r) { return { value: String(r.id), label: limpio(r.name) }; }); }); }

  // Native style: no yellow background, read-only fields grey.
  function addStyle($root) {
    normalizeEmpty($root);
    if ($root.find('style.oa-au-style').length) return;
    $('<style class="oa-au-style"></style>').text(CSS_BASE + (typeof CSS_EXTRA === 'string' ? CSS_EXTRA : '')).prependTo($root);
  }
  function paintNative($root) {
    $root.attr('autocomplete', 'off');
    $root.find('input, select, textarea').each(function () {
      if (this.type === 'hidden' || this.type === 'checkbox') return;
      var ro = $(this).hasClass('oa-au-readonly');
      this.setAttribute('autocomplete', 'off');
      this.style.setProperty('background-color', ro ? '#f5f5f5' : '#fff', 'important');
      if (ro) this.style.setProperty('color', 'rgba(0,0,0,.55)', 'important'); else this.style.removeProperty('color');
    });
  }

  // Read-only without "disabled": a disabled control is not serialized and its value would not be saved.
  function lockReadOnly($root, names) {
    names.forEach(function (name) {
      var $c = control($root, name);
      $c.addClass('oa-au-readonly').attr({ 'aria-readonly': 'true', tabindex: '-1' }).prop('required', false).removeAttr('required');
      if ($c.is('input:not(:checkbox), textarea')) $c.prop('readonly', true);
    });
    $root.off('.oaAuLock')
      .on('mousedown.oaAuLock keydown.oaAuLock click.oaAuLock', 'select.oa-au-readonly, input:checkbox.oa-au-readonly', function (e) {
        if (e.type === 'keydown' && (e.key === 'Tab' || e.keyCode === 9)) return;
        e.preventDefault();
      })
      .on('change.oaAuLock', '.oa-au-readonly', function () {
        var locked = $(this).data('oaLocked');
        if (locked === undefined) return;
        if (this.type === 'checkbox') { if (this.checked !== (locked === this.value)) { this.checked = locked === this.value; fire(this, 'change'); } return; }
        if (String($(this).val() || '') !== String(locked)) { $(this).val(locked); fire(this, 'change'); }
      });
  }
  function rememberLocked($root, names) {
    names.forEach(function (name) {
      var $c = control($root, name).first();
      if (!$c.length) return;
      $c.data('oaLocked', $c.is(':checkbox') ? ($c.prop('checked') ? $c.val() : '') : String($c.val() || ''));
    });
  }

  // Contact search (magnifier) next to a text field: persons and companies, by name, id number or code.
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

  // Policy data, read only.
  function policyInsured() {
    return once('insured', function () {
      if (!Number.isSafeInteger(POLICY_ID) || POLICY_ID <= 0) return Promise.resolve(null);
      return exe('RepoLifePolicy', { operation: 'GET', filter: 'id=' + POLICY_ID, include: ['Insureds'], noTracking: true }).then(function (r) {
        var p = r && r.outData && r.outData[0];
        if (!p) return null;
        var list = (p.Insureds || []).filter(Boolean);
        var main = list.find(function (i) { return i.role === 0 || i.role === 'MainInsured'; }) || list[0];
        var contactId = Number(main && (main.contactId || main.Contact && main.Contact.id));
        if (!Number.isSafeInteger(contactId) || contactId <= 0) return { policy: p, contact: null };
        return exe('GetContacts', { filter: 'id=' + contactId, size: 1 }).then(function (c) {
          return { policy: p, contact: c && c.outData && c.outData[0] || null };
        });
      });
    });
  }
  // ---------------------------------------------------------------------------------------------
  // frmOAPersonaAseguradaAU (policy insured person, manual motive, nothing required)
  // ---------------------------------------------------------------------------------------------
  var MARK = 'asegMotivo';
  var CSS_EXTRA = '';
  var ALL = ['asegNombre', 'asegCedula', 'asegSexo', 'asegEstadoCivil'];

  function initialize() {
    var $root = rootForm();
    if (!$root.length) return;
    addStyle($root);
    lockReadOnly($root, ALL);
    paintNative($root);
    if (!Number.isSafeInteger(POLICY_ID) || POLICY_ID <= 0) {
      aviso($root, 'No se recibió una póliza válida para cargar el asegurado.');
      return;
    }
    aviso($root, 'Cargando los datos del asegurado de la póliza…', 'info');
    Promise.all([policyInsured(), estadosCiviles()]).then(function (r) {
      var insured = r[0], contact = insured && insured.contact;
      fillSelect($root, 'asegEstadoCivil', r[1], contact && contact.maritalStatus ? String(contact.maritalStatus) : '');
      setValue($root, 'asegNombre', nombreDe(contact));
      setValue($root, 'asegCedula', cedulaDe(contact));
      var sexo = String(contact && (contact.gender || contact.sex) || '').trim().toUpperCase();
      setValue($root, 'asegSexo', sexo === 'M' || sexo === 'F' ? sexo : '');
      setValue($root, 'asegContactId', contact && contact.id || '');
      setValue($root, 'asegPolicyId', POLICY_ID);
      rememberLocked($root, ALL);
      paintNative($root);
      aviso($root, contact ? '' : 'La póliza no tiene un asegurado registrado.');
    }).catch(function (e) {
      console.error('frmOAPersonaAseguradaAU', e);
      aviso($root, 'No fue posible cargar los datos del asegurado.', 'danger');
    });
  }

  initialize();
})();
