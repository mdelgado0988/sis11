/*
Name: frmOAPersonaAsegurada
Author: AIDEN (MSN-000044)
Description: Objeto afectado: Persona asegurada. Sección «Datos del Asegurado».
             - Recibe el id de la póliza (contexto de la pantalla, campo oculto asegPolicyId o ruta /policy/<id>).
             - Busca el asegurado principal registrado en la póliza y carga Nombre, Cédula, Sexo y Estado Civil.
             - Esos cuatro campos quedan en solo lectura (no deshabilitados, para que se guarden con el formulario).
             - Motivo es el único campo manual y el único obligatorio. Sin fondo amarillo.
             - Estado Civil usa el catálogo nativo de estados civiles; Sexo los valores nativos del contacto (M/F).
Category: FORM
Version: 1.00
CreateDate: 28-09-2026
*/

var me = this;

(function () {

  const NS = "__frmOAPersonaAsegurada";
  const MARK = "asegMotivo";           // campo que identifica este formulario en la página
  const STYLE_ID = "frm-oa-persona-asegurada-styles";
  const AUTO = ["asegNombre", "asegSexo", "asegCedula", "asegEstadoCivil"];

  // Un solo controlador por página: la pantalla puede volver a dibujar el formulario al cargar lo guardado.
  const state = window[NS] = window[NS] || { timer: null, civiles: null, polizas: {}, avisos: {} };
  state.me = me;

  //////////////////////////////////////////////
  // Utilidades
  //////////////////////////////////////////////

  function decodeHtml(v) { return $('<textarea/>').html(v == null ? '' : String(v)).text(); }
  function limpio(v) { return v == null ? '' : String(v).replace(/\s+/g, ' ').trim(); }
  function avisoUnaVez(clave, txt) {
    if (state.avisos[clave]) return;
    state.avisos[clave] = true;
    const m = state.me && state.me.message;
    if (m && typeof m.warning === 'function') m.warning(txt); else console.warn(txt);
  }
  function entero(v) {
    const n = parseInt(v, 10);
    return isNaN(n) || n <= 0 ? null : n;
  }

  //////////////////////////////////////////////
  // Id de la póliza
  //////////////////////////////////////////////

  function policyIdDe($form) {
    // 1) lo que la pantalla pase en el contexto del formulario
    const ctx = state.me || {};
    const deCtx = entero(ctx.policyId) || entero(ctx.lifePolicyId) || entero(ctx.context && (ctx.context.policyId || ctx.context.lifePolicyId));
    if (deCtx) return deCtx;
    // 2) el campo oculto del propio formulario (valor vivo o el guardado)
    const $h = $form.find('[name="asegPolicyId"]');
    const deCampo = entero($h.val()) || entero($h.attr('user-data')) || entero($h.attr('value'));
    if (deCampo) return deCampo;
    // 3) la ruta de la póliza abierta (#/policy/<id>/...)
    const href = String(window.location && window.location.href || '');
    const m = href.match(/\/policy\/(\d+)/i) || href.match(/[?&](?:policyId|lifePolicyId)=(\d+)/i);
    return m ? entero(m[1]) : null;
  }

  //////////////////////////////////////////////
  // Datos (una vez por póliza / por página)
  //////////////////////////////////////////////

  function getCiviles() {
    if (!state.civiles) {
      state.civiles = state.me.exe('RepoMaritalStatusCatalog', { operation: 'GET' })
        .then(r => (r && r.ok ? r.outData || [] : []).map(x => ({ value: String(x.id), label: decodeHtml(x.name) })))
        .catch(() => []);
    }
    return state.civiles;
  }

  function getAsegurado(policyId) {
    if (!state.polizas[policyId]) {
      state.polizas[policyId] = state.me.exe('RepoLifePolicy', {
        operation: 'GET', filter: 'id=' + policyId, include: ['Insureds', 'Coverages'], noTracking: true
      }).then(r => {
        const p = r && r.outData && r.outData[0];
        if (!p) return { error: 'No se encontró la póliza ' + policyId + '.' };
        const insureds = (p.Insureds || []).filter(Boolean);
        const principal = p.MainInsured || insureds.find(i => i.role === 0 || i.role === 'MainInsured') || insureds[0];
        const contactId = entero(principal && (principal.contactId || principal.Contact && principal.Contact.id));
        if (!contactId) return { error: 'La póliza ' + (p.code || policyId) + ' no tiene un asegurado registrado.' };
        // The claim affected-object form reads the policy insured and then uses GetContacts,
        // which exposes the complete contact profile in every screen context.
        return state.me.exe('GetContacts', {
          operation: 'GET', filter: 'id=' + contactId, size: 1
        }).then(contactResult => {
          const raw = contactResult && contactResult.outData;
          const c = Array.isArray(raw) && raw[0] || principal.Contact || principal.contact;
          if (!c || typeof c !== 'object') return { error: 'No se encontró el contacto del asegurado de la póliza.' };
          const nombre = limpio(c.FullName) || limpio([c.name, c.middleName, c.surname1, c.surname2].join(' ')) || limpio(principal.name);
          return {
            policyId: String(policyId),
            contactId: String(c.id || contactId),
            asegNombre: nombre,
            asegCedula: limpio(c.cnp || c.nationalId || c.passport || ''),
            asegSexo: limpio(c.gender || c.sex || ''),
            asegEstadoCivil: c.maritalStatus || c.maritalStatusId ? String(c.maritalStatus || c.maritalStatusId) : ''
          };
        });
      }).catch(e => ({ error: 'No se pudo leer el asegurado de la póliza ' + policyId + '.' }));
    }
    return state.polizas[policyId];
  }

  //////////////////////////////////////////////
  // Presentación
  //////////////////////////////////////////////

  function inyectarEstilos() {
    if (document.getElementById(STYLE_ID)) return;
    $('<style/>', { id: STYLE_ID }).text(`
  .frm-oa-persona-asegurada input, .frm-oa-persona-asegurada select, .frm-oa-persona-asegurada textarea,
  .frm-oa-persona-asegurada [required], .frm-oa-persona-asegurada .required { background-color: #fff !important; }
  .frm-oa-persona-asegurada .form-group { margin-bottom: 8px !important; }
  .frm-oa-persona-asegurada label { margin-bottom: 2px !important; line-height: 1.2; }
  .frm-oa-persona-asegurada input:not([type="hidden"]), .frm-oa-persona-asegurada select { height: 30px !important; min-height: 30px !important; padding: 3px 8px !important; max-width: 600px; }
  .frm-oa-persona-asegurada textarea { width: 100% !important; min-height: 64px !important; padding: 5px 8px !important; }
  .frm-oa-persona-asegurada .oa-solo-lectura { background-color: #f5f5f5 !important; color: rgba(0,0,0,.45) !important; cursor: default !important; }
  .frm-oa-persona-asegurada select.oa-solo-lectura { pointer-events: none; }
  .frm-oa-persona-asegurada .oa-nombre-wrap { position: relative; }
  .frm-oa-persona-asegurada .oa-nombre-wrap input { padding-right: 30px; }
  .frm-oa-persona-asegurada .oa-lupa { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); opacity: .45; pointer-events: none; }
`).appendTo('head');
  }

  function lupaSvg() {
    return '<span class="oa-lupa" title="Dato cargado desde la póliza"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#1f5fa8" stroke-width="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14.5" y2="14.5"/></svg></span>';
  }

  function prepararForm($form) {
    $form.addClass('frm-oa-persona-asegurada');
    AUTO.forEach(n => {
      const $f = $form.find(`[name="${n}"]`);
      if (!$f.length) return;
      $f.addClass('oa-solo-lectura').attr({ tabindex: '-1', 'aria-readonly': 'true' });
      if ($f.is('input, textarea')) $f.prop('readOnly', true).attr('readonly', 'readonly');
    });
    const $n = $form.find('[name="asegNombre"]');
    if ($n.length && !$n.parent().hasClass('oa-nombre-wrap')) {
      $n.wrap('<div class="oa-nombre-wrap"></div>');
      $n.after(lupaSvg());
    }
    const $m = $form.find('[name="' + MARK + '"]');
    if ($m.length && !$m.attr('placeholder')) $m.attr('placeholder', 'INGRESE UNA OBSERVACIÓN');
    // Otros formularios de la página inyectan un amarillo global para [required]: el estilo en línea gana siempre.
    $form.find('input, select, textarea').each(function () {
      if (this.type === 'hidden') return;
      const soloLectura = $(this).hasClass('oa-solo-lectura');
      this.style.setProperty('background-color', soloLectura ? '#f5f5f5' : '#fff', 'important');
      if (soloLectura) this.style.setProperty('color', 'rgba(0,0,0,.45)', 'important');
    });
  }

  // Valor que debe quedar elegido: el del control si ya es real, si no el guardado (atributo user-data).
  function valorGuardado($sel) {
    const v = $sel.val();
    if (v !== undefined && v !== null && v !== '' && $sel.find('option').filter(function () { return this.value === v && this.text !== v; }).length) return v;
    const ud = $sel.attr('user-data');
    return ud ? String(ud) : '';
  }

  function llenarCiviles($sel, items) {
    if ($sel.data('oaLlenado')) return;
    const actual = valorGuardado($sel);
    $sel.empty().append($('<option/>', { value: '', text: '' }));
    items.forEach(it => $sel.append($('<option/>', { value: it.value, text: it.label })));
    $sel.val(actual && $sel.find(`option[value="${actual}"]`).length ? actual : '');
    $sel.data('oaLlenado', true);
  }

  function normalizarVacia($sel) {
    const $o = $sel.find('option').first();
    if ($o.length && $o.text() === '' && $o.attr('value') !== '') $o.attr('value', '');
  }

  function poner($form, name, valor) {
    const $f = $form.find(`[name="${name}"]`);
    if (!$f.length) return;
    const v = valor == null ? '' : String(valor);
    if ($f.is('select') && v !== '' && !$f.find(`option[value="${v}"]`).length) {
      $f.append($('<option/>', { value: v, text: v }));     // valor no previsto: se muestra tal cual, no se pierde
    }
    if ($f.val() !== v) $f.val(v);
  }

  function cargar($form, d) {
    AUTO.forEach(n => poner($form, n, d[n]));
    poner($form, 'asegContactId', d.contactId);
    poner($form, 'asegPolicyId', d.policyId);
    $form.data('oaDatos', d);
  }

  //////////////////////////////////////////////
  // Bloqueo de los campos automáticos (solo lectura)
  //////////////////////////////////////////////

  $(document)
    .off('.frmOAPersonaAsegurada')
    .on('keydown.frmOAPersonaAsegurada mousedown.frmOAPersonaAsegurada', '.frm-oa-persona-asegurada select.oa-solo-lectura', function (e) {
      if (e.type === 'keydown' && (e.key === 'Tab' || e.keyCode === 9)) return;
      e.preventDefault();
    })
    .on('change.frmOAPersonaAsegurada', '.frm-oa-persona-asegurada .oa-solo-lectura', function () {
      const $form = $(this).closest('.frm-oa-persona-asegurada');
      const d = $form.data('oaDatos');
      if (d && d[this.name] !== undefined && $(this).val() !== d[this.name]) poner($form, this.name, d[this.name]);
    });

  //////////////////////////////////////////////
  // Aplicación (idempotente)
  //////////////////////////////////////////////

  async function aplicar() {
    const $forms = $(`[name="${MARK}"]`).map(function () {
      const f = $(this).closest('form, .rendered-form, [id^="fb-render"]').get(0);
      return f || null;
    });
    if (!$forms.length) return;
    inyectarEstilos();
    const civiles = await getCiviles();
    for (const el of $forms.get()) {
      const $form = $(el);
      prepararForm($form);
      normalizarVacia($form.find('[name="asegSexo"]'));
      const $civ = $form.find('[name="asegEstadoCivil"]');
      if (civiles.length) llenarCiviles($civ, civiles); else normalizarVacia($civ);
      const pid = policyIdDe($form);
      if (!pid) { avisoUnaVez('sinPoliza', 'frmOAPersonaAsegurada: no se recibió el id de la póliza; los datos del asegurado no se cargaron.'); continue; }
      const d = await getAsegurado(pid);
      if (d.error) { avisoUnaVez('err' + pid, d.error); continue; }
      cargar($form, d);
    }
  }

  if (state.timer) clearInterval(state.timer);
  aplicar().catch(e => console.error(e));
  state.timer = setInterval(() => {
    if (!$(`[name="${MARK}"]`).length) return;
    aplicar().catch(e => console.error(e));
  }, 400);

})();
