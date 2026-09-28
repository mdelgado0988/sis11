/*
Name: frmOAPersonaAfectada
Author: AIDEN (MSN-000043)
Description: Objeto afectado: Persona. Dos secciones (Beneficiario; Incapacitado/Fallecido).
             - Obligatorios con fondo amarillo.
             - Nacionalidad y Relación se cargan de los catálogos nativos (países; parentescos de beneficiario).
               Sexo usa los valores nativos del contacto (M/F), declarados en el formulario.
             - Lupa junto a Nombre: busca contactos persona por nombre o cédula y al elegir uno carga
               nombre, cédula y edad. Todo sigue editable.
Category: FORM
Version: 1.00
CreateDate: 28-09-2026
*/

var me = this;

(function () {

  const NS = "__frmOAPersonaAfectada";
  const MARK = "incMotivo";            // campo que identifica este formulario en la página
  const STYLE_ID = "frm-oa-persona-afectada-styles";
  const SECCIONES = [
    { nombre: "benNombre", cedula: "benCedula", edad: "benEdad", contacto: "benContactId" },
    { nombre: "incNombre", cedula: "incCedula", edad: "incEdad", contacto: "incContactId" }
  ];
  const NOMBRE_SQL = "(RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(middleName,''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,'')))";

  // Un solo controlador por página: la pantalla puede volver a dibujar el formulario al cargar lo guardado.
  const state = window[NS] = window[NS] || { timer: null, seen: false, paises: null, relaciones: null };
  state.me = me;

  //////////////////////////////////////////////
  // Utilidades
  //////////////////////////////////////////////

  function decodeHtml(v) { return $('<textarea/>').html(v == null ? '' : String(v)).text(); }
  function esc(v) { return $('<div/>').text(v == null ? '' : String(v)).html(); }
  function sql(v) { return String(v).replace(/'/g, "''"); }
  function aviso(txt) {
    const m = state.me && state.me.message;
    if (m && typeof m.warning === 'function') m.warning(txt); else console.warn(txt);
  }

  function edadDe(c) {
    if (c.currentAge !== undefined && c.currentAge !== null && c.currentAge !== '' && !isNaN(c.currentAge)) return Number(c.currentAge);
    if (!c.birth) return '';
    const b = new Date(c.birth), h = new Date();
    if (isNaN(b.getTime())) return '';
    let e = h.getFullYear() - b.getFullYear();
    if (h.getMonth() < b.getMonth() || (h.getMonth() === b.getMonth() && h.getDate() < b.getDate())) e--;
    return e < 0 ? '' : e;
  }

  //////////////////////////////////////////////
  // Catálogos nativos (una vez por página)
  //////////////////////////////////////////////

  function getPaises() {
    if (!state.paises) {
      state.paises = state.me.exe('RepoCountryCatalog', { operation: 'GET' })
        .then(r => ((r && r.outData) || []).map(p => ({ v: String(p.code), t: decodeHtml(p.name) }))
          .sort((a, b) => a.t.localeCompare(b.t)))
        .catch(() => { state.paises = null; return []; });
    }
    return state.paises;
  }

  function getRelaciones() {
    if (!state.relaciones) {
      state.relaciones = state.me.exe('RepoRelationshipCatalog', { operation: 'GET', filter: "principalType='BENEFICIARY'" })
        .then(r => ((r && r.outData) || []).map(p => ({ v: String(p.id), t: decodeHtml(p.name) })))
        .catch(() => { state.relaciones = null; return []; });
    }
    return state.relaciones;
  }

  // Valor que debe quedar elegido: el del control si ya es real, si no el guardado (atributo user-data).
  function valorDeseado($sel) {
    const v = $sel.val();
    if (v && v !== 'Seleccione…') return String(v);
    const ud = $sel.attr('user-data');
    return ud && ud !== 'Seleccione…' ? String(ud) : '';
  }

  function llenarSelect($sel, items) {
    const actual = valorDeseado($sel);
    const firma = items.length + '|' + actual;
    if ($sel.attr('data-oa-firma') === firma && $sel.find('option').length === items.length + 1) return;
    const html = ['<option value="">Seleccione…</option>']
      .concat(items.map(i => `<option value="${esc(i.v)}">${esc(i.t)}</option>`));
    // Un valor guardado que ya no está en el catálogo se conserva para no perderlo
    if (actual && !items.some(i => i.v === actual)) html.push(`<option value="${esc(actual)}">${esc(actual)}</option>`);
    $sel.html(html.join('')).val(actual);
    $sel.attr('data-oa-firma', items.length + '|' + ($sel.val() || ''));
  }

  // Lista fija (Sexo): la opción vacía se pinta con el texto como valor; se normaliza a ''.
  function normalizarVacia($sel) {
    const $o = $sel.find('option').first();
    if ($o.length && $o.text() === 'Seleccione…' && $o.attr('value') !== '') {
      const eraElla = $sel.val() === $o.attr('value');
      $o.attr('value', '');
      const ud = $sel.attr('user-data');
      if (eraElla) $sel.val(ud && $sel.find(`option[value="${ud}"]`).length ? ud : '');
    }
  }

  //////////////////////////////////////////////
  // Estilo
  //////////////////////////////////////////////

  function inyectarEstilos() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
  .frm-oa-persona input, .frm-oa-persona select, .frm-oa-persona textarea { background-color: #fff !important; }
  .frm-oa-persona .form-group { margin-bottom: 8px !important; }
  /* Keep the form-builder grid widths inclusive of their horizontal padding. */
  .frm-oa-persona .row > [class*="col-md-"] { box-sizing: border-box !important; min-width: 0; }
  .frm-oa-persona .row > .col-md-2 { flex: 0 0 16.666667% !important; max-width: 16.666667% !important; }
  .frm-oa-persona .row > .col-md-3 { flex: 0 0 25% !important; max-width: 25% !important; }
  .frm-oa-persona .row > .col-md-4 { flex: 0 0 33.333333% !important; max-width: 33.333333% !important; }
  .frm-oa-persona .row > .col-md-6 { flex: 0 0 50% !important; max-width: 50% !important; }
  .frm-oa-persona .row > .col-md-8 { flex: 0 0 66.666667% !important; max-width: 66.666667% !important; }
  .frm-oa-persona .row > .col-md-12 { flex: 0 0 100% !important; max-width: 100% !important; }
  .frm-oa-persona label { margin-bottom: 2px !important; line-height: 1.2; }
  .frm-oa-persona input:not([type="hidden"]), .frm-oa-persona select { height: 30px !important; min-height: 30px !important; padding: 3px 8px !important; max-width: 600px; }
  .frm-oa-persona textarea { width: 100% !important; min-height: 64px !important; padding: 5px 8px !important; }
  .frm-oa-persona .oa-seccion { color: #15428b; font-weight: 600; border-bottom: 1px solid #99bbe8; padding-bottom: 3px; margin: 6px 0 4px 0; }
  .frm-oa-persona .oa-buscar-wrap { display: flex; gap: 4px; position: relative; }
  .frm-oa-persona .oa-buscar-wrap input { flex: 1 1 auto; }
  .frm-oa-persona .oa-btn-buscar { flex: 0 0 auto; height: 30px; padding: 0 9px; border: 1px solid #b8c4d1; border-radius: 4px; background: #fff; cursor: pointer; }
  .frm-oa-persona .oa-btn-buscar:hover { border-color: #1677ff; color: #1677ff; }
  .frm-oa-persona .oa-resultados { position: absolute; top: 32px; left: 0; right: 0; z-index: 1050; background: #fff; border: 1px solid #b8c4d1; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,.15); max-height: 260px; overflow-y: auto; }
  .frm-oa-persona .oa-resultado { padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
  .frm-oa-persona .oa-resultado:hover { background: #e6f4ff; }
  .frm-oa-persona .oa-resultado small { color: rgba(0,0,0,.55); margin-left: 6px; }
  .frm-oa-persona .oa-sin-resultados { padding: 8px 10px; color: rgba(0,0,0,.45); }
  `;
    $('<style>', { id: STYLE_ID }).text(css).appendTo('head');
  }

  function quitarResaltadoRequerido($form) {
    // Some host forms add a global required-field color after this form has rendered.
    $form.find('input, select, textarea').each(function () {
      if (this.type !== 'hidden') this.style.setProperty('background-color', '#fff', 'important');
    });
  }

  //////////////////////////////////////////////
  // Búsqueda de contacto
  //////////////////////////////////////////////

  function montarBusqueda($form, s) {
    const $in = $form.find(`[name="${s.nombre}"]`);
    if (!$in.length || $in.parent().hasClass('oa-buscar-wrap')) return;
    $in.wrap('<div class="oa-buscar-wrap"></div>');
    $in.after(`<button type="button" class="oa-btn-buscar" title="Buscar contacto" data-oa-nombre="${s.nombre}">&#128269;</button>`);
  }

  function cerrarResultados($ctx) { ($ctx || $(document)).find('.oa-resultados').remove(); }

  function buscar($form, nombreCampo) {
    const s = SECCIONES.find(x => x.nombre === nombreCampo);
    const $in = $form.find(`[name="${s.nombre}"]`);
    const $wrap = $in.closest('.oa-buscar-wrap');
    const texto = String($in.val() || '').trim();
    const esCodigoContacto = /^\d+$/.test(texto);
    cerrarResultados($form);
    if (!esCodigoContacto && texto.length < 3) { aviso('Escriba al menos 3 caracteres del nombre o de la cédula para buscar.'); return; }

    // CHARINDEX y no LIKE: el filtro de GetContacts rechaza un OR pegado a un literal ('...' OR ...).
    const contiene = (t, col) => `CHARINDEX(N'${sql(t)}', ${col}) > 0`;
    const porNombre = texto.split(/\s+/).filter(Boolean).map(p => contiene(p, NOMBRE_SQL)).join(' AND ');
    const filtro = esCodigoContacto
      ? `isPerson=1 AND id=${Number(texto)}`
      : `isPerson=1 AND ((${porNombre}) OR ${contiene(texto, "ISNULL(cnp,'')")} OR ${contiene(texto, "ISNULL(nationalId,'')")} OR ${contiene(texto, "ISNULL(passport,'')")})`;

    const $res = $('<div class="oa-resultados"><div class="oa-sin-resultados">Buscando…</div></div>');
    $wrap.append($res);
    state.me.exe('GetContacts', { filter: filtro, size: 10 }).then(r => {
      const lista = (r && r.ok !== false && r.outData) || [];
      if (!lista.length) { $res.html('<div class="oa-sin-resultados">Sin coincidencias</div>'); return; }
      $res.empty();
      lista.forEach(c => {
        const ced = c.cnp || c.nationalId || c.passport || '';
        $('<div class="oa-resultado"></div>')
          .html(`${esc(String(c.FullName || '').trim())}<small>${esc(ced)}</small>`)
          .data('oaContacto', c)
          .appendTo($res);
      });
    }).catch(e => { $res.html('<div class="oa-sin-resultados">No se pudo buscar</div>'); console.error(e); });
  }

  function elegir($form, nombreCampo, c) {
    const s = SECCIONES.find(x => x.nombre === nombreCampo);
    const set = (n, v) => $form.find(`[name="${n}"]`).val(v == null ? '' : v).trigger('change');
    set(s.nombre, String(c.FullName || '').replace(/\s+/g, ' ').trim());
    set(s.cedula, c.cnp || c.nationalId || c.passport || '');
    set(s.edad, edadDe(c));
    set(s.contacto, c.id);
    if (s.nombre === 'incNombre') {
      set('incSexo', c.gender || '');
      set('incNacionalidad', c.citizenship || '');
    }
    cerrarResultados($form);
  }

  //////////////////////////////////////////////
  // Eventos (delegados: sobreviven al redibujado)
  //////////////////////////////////////////////

  const formDe = el => $(el).closest('form').length ? $(el).closest('form') : $(el).closest('.frm-oa-persona');

  $(document)
    .off('.frmOAPersona')
    .on('click.frmOAPersona', '.frm-oa-persona .oa-btn-buscar', function (e) {
      e.preventDefault();
      buscar(formDe(this), $(this).attr('data-oa-nombre'));
    })
    .on('keydown.frmOAPersona', '.frm-oa-persona .oa-buscar-wrap input', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); buscar(formDe(this), $(this).attr('name')); }
      if (e.key === 'Escape') cerrarResultados(formDe(this));
    })
    .on('click.frmOAPersona', '.frm-oa-persona .oa-resultado', function (e) {
      e.preventDefault();
      const nombreCampo = $(this).closest('.oa-buscar-wrap').find('input').attr('name');
      elegir(formDe(this), nombreCampo, $(this).data('oaContacto'));
    })
    .on('click.frmOAPersona', function (e) {
      if (!$(e.target).closest('.oa-buscar-wrap').length) cerrarResultados();
    });

  //////////////////////////////////////////////
  // Inicio: reaplicación idempotente
  //////////////////////////////////////////////

  async function aplicar() {
    const $forms = $(`[name="${MARK}"]`).map(function () {
      const $f = $(this).closest('form');
      return ($f.length ? $f : $(this).closest('.rendered-form').parent())[0];
    });
    if (!$forms.length) {
      if (state.seen) { clearInterval(state.timer); state.timer = null; state.seen = false; }
      return;
    }
    state.seen = true;
    inyectarEstilos();
    const [paises, relaciones] = await Promise.all([getPaises(), getRelaciones()]);
    $forms.each(function () {
      const $form = $(this).addClass('frm-oa-persona');
      quitarResaltadoRequerido($form);
      SECCIONES.forEach(s => montarBusqueda($form, s));
      $form.find('select.oa-cat-pais').each(function () { if (paises.length) llenarSelect($(this), paises); });
      $form.find('select.oa-cat-relacion').each(function () { if (relaciones.length) llenarSelect($(this), relaciones); });
      $form.find('select.oa-cat-sexo').each(function () { normalizarVacia($(this)); });
    });
  }

  if (!state.timer) {
    state.timer = setInterval(() => { aplicar().catch(e => console.error(e)); }, 400);
  }
  aplicar().catch(e => console.error(e));

}).call(this);
