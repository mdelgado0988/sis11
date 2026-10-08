/*
Name: frmOAAseguradoColectivo
Author: AIDEN (MSN-000046)
Description: Objeto afectado: Asegurado de Colectivo de Vida.
             - Obligatorios con la marca nativa del formulario (sin fondo amarillo).
             - Listas desde catálogos nativos: Sexo (M/F del contacto), Provincia (provincias de Panamá),
               Sucursal (sucursales), Tipo de Préstamo (tabla tbTipoPrestamoColectivo) y
               Causa de Fallecimiento (tabla tbCausaFallecimiento).
             - Lupa junto a Asegurado: busca contactos persona por nombre o cédula y al elegir uno carga
               nombre, cédula, fecha de nacimiento, edad, sexo y provincia. Todo sigue editable.
             - Al cambiar F. Nacimiento se recalcula la Edad.
Category: FORM
Version: 1.00
CreateDate: 28-09-2026
*/

var me = this;

(function () {

  const NS = "__frmOAAseguradoColectivo";
  const MARK = "colNroPrestamo";   // campo que identifica este formulario en la página
  const STYLE_ID = "frm-oa-asegurado-colectivo-styles";
  const PAIS = "591";                      // Panamá
  const VACIA = "Seleccione…";
  const NOMBRE_SQL = "(RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(middleName,''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,'')))";

  // Un solo controlador por página: la pantalla puede volver a dibujar el formulario al cargar lo guardado.
  const state = window[NS] = window[NS] || { timer: null, seen: false, cat: {} };
  state.me = me;

  //////////////////////////////////////////////
  // Utilidades
  //////////////////////////////////////////////

  function decodeHtml(v) { return $('<textarea/>').html(v == null ? '' : String(v)).text(); }
  function limpio(v) { return decodeHtml(v).replace(/\s+/g, ' ').trim(); }
  function esc(v) { return $('<div/>').text(v == null ? '' : String(v)).html(); }
  function sql(v) { return String(v).replace(/'/g, "''"); }
  function aviso(txt) {
    const m = state.me && state.me.message;
    if (m && typeof m.warning === 'function') m.warning(txt); else console.warn(txt);
  }

  function fechaIso(v) {
    if (!v) return '';
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
  }

  function edadDesde(iso) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    const h = new Date(), y = +m[1], mo = +m[2] - 1, d = +m[3];
    let e = h.getFullYear() - y;
    if (h.getMonth() < mo || (h.getMonth() === mo && h.getDate() < d)) e--;
    return e < 0 || e > 130 ? '' : e;
  }

  function edadDe(c) {
    if (c.currentAge !== undefined && c.currentAge !== null && c.currentAge !== '' && !isNaN(c.currentAge)) return Number(c.currentAge);
    return edadDesde(fechaIso(c.birth));
  }

  const CAMPOS = {
    asegurado: ['colAsegurado', 'colClienteColectivo'], cedula: ['colCedula'], nacimiento: ['colFechaNacimiento'],
    edad: ['colEdad'], notificacion: ['colFechaNotificacion', 'colFNotificacion'], tipoPrestamo: ['colTipoPrestamo'],
    monto: ['colMonto'], letra: ['colLetra'], saldo: ['colSaldo'], noSis: ['colNoSis'], noCobis: ['colNoCobis'],
    sexo: ['colSexo'], edadIngreso: ['colEdadIngreso'], edadFallecimiento: ['colFallecimiento'],
    fechaFallecimiento: ['colFechaFallecimiento'], noPrestamo: ['colNoPrestamo', 'colNroPrestamo'],
    fechaInicial: ['colFechaInicialPrestamo', 'colFechaInicioPrestamo'],
    fechaFinal: ['colFechaFinalPrestamo', 'colFechaFinPrestamo'], sucursal: ['colSucursal'],
    provincia: ['colProvincia'], causa: ['colCausaFallecimiento'], razon: ['colRazonFallecimiento', 'colRazon']
  };

  function controles($form, clave) {
    const nombres = CAMPOS[clave] || [];
    return $form.find('[name]').filter(function () { return nombres.includes(this.name); });
  }

  function grupos($controles) { return $controles.closest('.form-group'); }

  function recordarRequerido($controles) {
    $controles.each(function () {
      const $control = $(this);
      if ($control.attr('data-oa-required') === undefined) $control.attr('data-oa-required', this.required ? 'true' : 'false');
    });
  }

  function requerido($controles, activo) {
    recordarRequerido($controles);
    $controles.each(function () {
      const $control = $(this);
      if (activo) {
        $control.removeAttr('data-oa-skip-validation');
        if ($control.attr('data-oa-required') === 'true') $control.attr('required', 'required');
        else $control.removeAttr('required');
      } else {
        $control.removeAttr('required').attr('data-oa-skip-validation', 'true');
      }
    });
  }

  function visible($controles, activo) {
    if (!activo) requerido($controles, false);
    else requerido($controles, true);
    grupos($controles).toggle(!!activo);
  }

  function valor($form, clave) {
    const $control = controles($form, clave).first();
    return $control.length ? String($control.val() || '').trim() : '';
  }

  function asignar($form, clave, value) {
    const next = value == null ? '' : String(value);
    controles($form, clave).each(function () {
      const $control = $(this);
      if (this.tagName === 'SELECT' && next && !$control.find(`option[value="${next}"]`).length) {
        $control.append($('<option></option>').attr('value', next).text(next));
      }
      $control.val(next).trigger('change');
    });
  }

  function etiqueta($form, clave, texto) {
    controles($form, clave).each(function () {
      const $label = $(this).closest('.form-group').find('label').first();
      if (!$label.length) return;
      if ($label.attr('data-oa-label') === undefined) $label.attr('data-oa-label', $label.text());
      $label.text(texto);
    });
  }

  function restaurarEtiqueta($form, clave) {
    controles($form, clave).each(function () {
      const $label = $(this).closest('.form-group').find('label').first();
      const original = $label.attr('data-oa-label');
      if (original !== undefined) $label.text(original);
    });
  }

  function bloquearCalculados($form) {
    ['edad', 'edadIngreso'].forEach(clave => controles($form, clave)
      .prop('readonly', true).attr('aria-readonly', 'true').addClass('oa-solo-lectura'));
  }

  function edadEnFecha(nacimiento, fecha) {
    const inicio = String(nacimiento || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    const fin = String(fecha || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!inicio || !fin) return '';
    let edad = Number(fin[1]) - Number(inicio[1]);
    if (Number(fin[2]) < Number(inicio[2]) || Number(fin[2]) === Number(inicio[2]) && Number(fin[3]) < Number(inicio[3])) edad--;
    return edad >= 0 && edad <= 130 ? edad : '';
  }

  function actualizarEdades($form) {
    const nacimiento = valor($form, 'nacimiento');
    if (nacimiento) asignar($form, 'edad', edadDesde(nacimiento));
    const edadIngreso = edadEnFecha(nacimiento, valor($form, 'fechaInicial'));
    if (edadIngreso !== '') asignar($form, 'edadIngreso', edadIngreso);
    const edadFallecimiento = edadEnFecha(nacimiento, valor($form, 'fechaFallecimiento'));
    if (edadFallecimiento !== '') asignar($form, 'edadFallecimiento', edadFallecimiento);
  }

  function validarAsegurado($form) {
    const $asegurado = controles($form, 'asegurado').first();
    if (!$asegurado.length || typeof $asegurado[0].setCustomValidity !== 'function') return;
    const id = valor($form, 'noSis') || $form.find('[name="colContactId"]').val();
    $asegurado[0].setCustomValidity(/^\d+$/.test(String(id || '')) && Number(id) > 0
      ? '' : 'Seleccione un asegurado válido mediante la búsqueda.');
  }

  function restaurarReglasBase($form) {
    Object.keys(CAMPOS).forEach(clave => {
      const $control = controles($form, clave);
      visible($control, true);
      restaurarEtiqueta($form, clave);
    });
    requerido(controles($form, 'edadFallecimiento'), false);
    const letra = controles($form, 'letra');
    if (letra.length && !valor($form, 'letra')) asignar($form, 'letra', '0');
  }

  function codigoCobertura(policy) {
    const coverageId = String(context && context.coverageId || '');
    const coverage = ((policy && policy.Coverages) || []).find(c => String(c && c.id) === coverageId) || {};
    return String(coverage.code || coverage.coverageCode || coverage.coverageId || coverage.id || coverageId).trim();
  }

  function aplicarReglasPlan($form, policy) {
    restaurarReglasBase($form);
    const plan = String(policy && (policy.productCode || policy.Product && policy.Product.code) || '').trim();
    const cobertura = codigoCobertura(policy);
    const esColectivoEspecial = String(context && context.lob || '') === '20' && plan === '20_7';
    if (!esColectivoEspecial) return;

    if (['119', '121'].includes(cobertura)) {
      ['tipoPrestamo', 'monto', 'letra', 'noPrestamo'].forEach(clave => requerido(controles($form, clave), false));
      ['noPrestamo', 'sucursal', 'provincia'].forEach(clave => visible(controles($form, clave), false));
      asignar($form, 'sucursal', '-1'); asignar($form, 'provincia', '-1'); asignar($form, 'noPrestamo', '-1');
      etiqueta($form, 'fechaInicial', 'F. de ingreso a la Compañía');
      etiqueta($form, 'fechaFinal', 'F. ingreso al colectivo');
      etiqueta($form, 'saldo', 'Monto de la Cobertura');
    }
    if (cobertura === '122') etiqueta($form, 'causa', 'Causa Invalidez');
    if (cobertura === '125') {
      ['edad', 'saldo'].forEach(clave => visible(controles($form, clave), false));
      requerido(controles($form, 'noPrestamo'), false);
      etiqueta($form, 'noPrestamo', 'Nro. de Factura Reembolsando');
      etiqueta($form, 'fechaInicial', 'F. de ingreso a la Compañía');
      etiqueta($form, 'fechaFinal', 'F. ingreso al colectivo');
    }
    if (cobertura === '126') {
      ['saldo', 'sucursal', 'provincia', 'causa'].forEach(clave => visible(controles($form, clave), false));
      requerido(controles($form, 'noPrestamo'), false);
      asignar($form, 'sucursal', '-1'); asignar($form, 'provincia', '-1');
      etiqueta($form, 'razon', 'Enfermedad Padecida'); etiqueta($form, 'fechaInicial', 'F. de ingreso a la Compañía');
      etiqueta($form, 'fechaFinal', 'F. ingreso al colectivo'); etiqueta($form, 'edadFallecimiento', 'Edad Diagnóstico');
      etiqueta($form, 'fechaFallecimiento', 'F. Diagnóstico'); etiqueta($form, 'noPrestamo', 'Médico Responsable');
    }
    if (cobertura === '124') {
      ['saldo', 'edad', 'causa', 'sucursal'].forEach(clave => visible(controles($form, clave), false));
      etiqueta($form, 'razon', 'Descripción del Accidente'); etiqueta($form, 'provincia', 'Lugar del Accidente');
      etiqueta($form, 'fechaInicial', 'F. de ingreso a la Compañía'); etiqueta($form, 'fechaFinal', 'F. ingreso al colectivo');
      etiqueta($form, 'fechaFallecimiento', 'F. Accidente');
    }
  }

  function cargarReglasPlan($form) {
    const policyId = Number(context && context.policyId);
    if (!Number.isSafeInteger(policyId) || policyId <= 0) return Promise.resolve();
    const policyKey = policyId + ':' + String(context && context.coverageId || '');
    if (state.policyKey !== policyKey) {
      state.policyKey = policyKey;
      state.policy = state.me.exe('RepoLifePolicy', {
      operation: 'GET', include: ['Coverages', 'Product'], filter: 'id=' + policyId, noTracking: true
      }).then(r => r && r.outData && r.outData[0] || {}).catch(() => ({}));
    }
    return state.policy.then(policy => aplicarReglasPlan($form, policy));
  }

  //////////////////////////////////////////////
  // Catálogos (una vez por página)
  //////////////////////////////////////////////

  function catalogo(clave, cmd, data, mapa) {
    if (!state.cat[clave]) {
      state.cat[clave] = state.me.exe(cmd, data)
        .then(r => ((r && r.ok !== false && r.outData) || []).map(mapa).filter(i => i && i.v !== ''))
        .catch(() => { state.cat[clave] = null; return []; });
    }
    return state.cat[clave];
  }

  function filaCatalogo(row) {
    if (!Array.isArray(row) || row.length < 2) return null;
    const valor = limpio(row[0]);
    const texto = limpio(row[1]);
    // GetFullTable can include the spreadsheet-style header as its first row.
    if (!valor || !texto || valor.toLowerCase() === 'valor' && texto.toLowerCase() === 'texto') return null;
    return { v: valor, t: texto };
  }

  const CATALOGOS = {
    provincia: () => catalogo('provincia', 'RepoStateCatalog', { operation: 'GET', filter: `countryCode='${PAIS}'` },
      p => ({ v: String(p.code), t: limpio(p.name) })),
    sucursal: () => catalogo('sucursal', 'RepoBranch', { operation: 'GET' },
      b => ({ v: String(b.code), t: limpio(b.name) })),
    tipoprestamo: () => catalogo('tipoprestamo', 'GetFullTable', { table: 'tbTipoPrestamoColectivo' },
      filaCatalogo),
    causa: () => catalogo('causa', 'GetFullTable', { table: 'tbCausaFallecimiento' },
      filaCatalogo)
  };

  // Valor que debe quedar elegido: el del control si ya es real, si no el guardado (atributo user-data).
  function valorDeseado($sel) {
    const v = $sel.val();
    if (v && v !== VACIA) return String(v);
    const ud = $sel.attr('user-data');
    return ud && ud !== VACIA ? String(ud) : '';
  }

  function llenarSelect($sel, items) {
    const actual = valorDeseado($sel);
    const firma = items.length + '|' + actual;
    if ($sel.attr('data-oa-firma') === firma && $sel.find('option').length >= items.length + 1) return;
    const html = [`<option value="">${VACIA}</option>`]
      .concat(items.map(i => `<option value="${esc(i.v)}">${esc(i.t)}</option>`));
    // Un valor guardado que ya no está en el catálogo se conserva para no perderlo
    if (actual && !items.some(i => i.v === actual)) html.push(`<option value="${esc(actual)}">${esc(actual)}</option>`);
    $sel.html(html.join('')).val(actual);
    $sel.attr('data-oa-firma', items.length + '|' + ($sel.val() || ''));
  }

  // Listas fijas (Sexo, Fallecimiento): la opción vacía se pinta con el texto como valor; se normaliza a ''.
  function normalizarVacia($sel) {
    const $o = $sel.find('option').first();
    if ($o.length && $o.text() === VACIA && $o.attr('value') !== '') {
      const eraElla = $sel.val() === $o.attr('value');
      $o.attr('value', '');
      const ud = $sel.attr('user-data');
      if (eraElla) $sel.val(ud && $sel.find(`option[value="${ud}"]`).length ? ud : '');
    }
  }

  //////////////////////////////////////////////
  // Estilo compacto y consistente con los demás formularios de objetos afectados.
  //////////////////////////////////////////////

  function inyectarEstilos() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
  .frm-oa-colectivo input, .frm-oa-colectivo select, .frm-oa-colectivo textarea,
  .frm-oa-colectivo [required], .frm-oa-colectivo .required { background-color: #fff !important; }
  .frm-oa-colectivo input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), .frm-oa-colectivo select, .frm-oa-colectivo textarea { border: 1px solid #aebfd4 !important; border-radius: 5px !important; box-shadow: none !important; }
  .frm-oa-colectivo input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):hover, .frm-oa-colectivo select:hover, .frm-oa-colectivo textarea:hover { border-color: #8da9c2 !important; }
  .frm-oa-colectivo input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):focus, .frm-oa-colectivo select:focus, .frm-oa-colectivo textarea:focus { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(22,119,255,.12) !important; outline: 0; }
  .frm-oa-colectivo .form-group { margin-bottom: 8px !important; }
  .frm-oa-colectivo .row > [class*="col-md-"] { box-sizing: border-box !important; min-width: 0; }
  .frm-oa-colectivo .row > .col-md-2 { flex: 0 0 16.666667% !important; max-width: 16.666667% !important; }
  .frm-oa-colectivo .row > .col-md-3 { flex: 0 0 25% !important; max-width: 25% !important; }
  .frm-oa-colectivo .row > .col-md-4 { flex: 0 0 33.333333% !important; max-width: 33.333333% !important; }
  .frm-oa-colectivo .row > .col-md-6 { flex: 0 0 50% !important; max-width: 50% !important; }
  .frm-oa-colectivo .row > .col-md-8 { flex: 0 0 66.666667% !important; max-width: 66.666667% !important; }
  .frm-oa-colectivo .row > .col-md-12 { flex: 0 0 100% !important; max-width: 100% !important; }
  .frm-oa-colectivo label { margin-bottom: 2px !important; line-height: 1.2; }
  .frm-oa-colectivo input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), .frm-oa-colectivo select { height: 30px !important; min-height: 30px !important; padding: 3px 8px !important; max-width: 600px; }
  .frm-oa-colectivo textarea { width: 100% !important; min-height: 64px !important; padding: 5px 8px !important; }
  .frm-oa-colectivo .oa-solo-lectura { background-color: #f5f5f5 !important; color: rgba(0,0,0,.45) !important; cursor: default !important; }
  .frm-oa-colectivo .oa-seccion { color: #15428b; font-weight: 600; border-bottom: 1px solid #99bbe8; padding-bottom: 3px; margin: 6px 0 4px; }
  .frm-oa-colectivo .oa-buscar-wrap { display: flex; gap: 4px; position: relative; }
  .frm-oa-colectivo .oa-buscar-wrap input { flex: 1 1 auto; }
  .frm-oa-colectivo .oa-btn-buscar { flex: 0 0 auto; height: 30px; padding: 0 9px; border: 1px solid #aebfd4; border-radius: 5px; background: #fff; cursor: pointer; }
  .frm-oa-colectivo .oa-btn-buscar:hover { border-color: #1677ff; color: #1677ff; }
  .frm-oa-colectivo .oa-resultados { position: absolute; top: 34px; left: 0; right: 0; z-index: 1050; background: #fff; border: 1px solid #d9d9d9; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.15); max-height: 260px; overflow-y: auto; }
  .frm-oa-colectivo .oa-resultado { padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
  .frm-oa-colectivo .oa-resultado:hover { background: #e6f4ff; }
  .frm-oa-colectivo .oa-resultado small { color: rgba(0,0,0,.55); margin-left: 6px; }
  .frm-oa-colectivo .oa-sin-resultados { padding: 8px 10px; color: rgba(0,0,0,.45); }
  `;
    $('<style>', { id: STYLE_ID }).text(css).appendTo('head');
  }

  //////////////////////////////////////////////
  // Búsqueda del asegurado
  //////////////////////////////////////////////

  function montarBusqueda($form) {
    const $in = $form.find('[name="colAsegurado"]');
    if (!$in.length || $in.parent().hasClass('oa-buscar-wrap')) return;
    $in.wrap('<div class="oa-buscar-wrap"></div>');
    $in.after('<button type="button" class="oa-btn-buscar" title="Buscar contacto">&#128269;</button>');
  }

  function cerrarResultados($ctx) { ($ctx || $(document)).find('.oa-resultados.oa-col').remove(); }

  function buscar($form) {
    const $in = $form.find('[name="colAsegurado"]');
    const $wrap = $in.closest('.oa-buscar-wrap');
    const texto = String($in.val() || '').trim();
    const contactId = /^\d+$/.test(texto) && Number.isSafeInteger(Number(texto)) ? Number(texto) : 0;
    cerrarResultados($form);
    if (texto.length < 3 && !contactId) { aviso('Escriba al menos 3 caracteres del nombre o de la cédula, o el código numérico del contacto.'); return; }

    // CHARINDEX y no LIKE: el filtro de GetContacts rechaza un OR pegado a un literal ('...' OR ...).
    const contiene = (t, col) => `CHARINDEX(N'${sql(t)}', ${col}) > 0`;
    const porNombre = texto.split(/\s+/).filter(Boolean).map(p => contiene(p, NOMBRE_SQL)).join(' AND ');
    const filtro = `isPerson=1 AND ((${porNombre}) OR ${contiene(texto, "ISNULL(cnp,'')")} OR ${contiene(texto, "ISNULL(nationalId,'')")} OR ${contiene(texto, "ISNULL(passport,'')")}${contactId ? ' OR [id]=' + contactId : ''})`;

    const $res = $('<div class="oa-resultados oa-col"><div class="oa-sin-resultados">Buscando…</div></div>');
    $wrap.append($res);
    state.me.exe('GetContacts', { filter: filtro, size: 10 }).then(r => {
      const lista = (r && r.ok !== false && r.outData) || [];
      if (!lista.length) { $res.html('<div class="oa-sin-resultados">Sin coincidencias</div>'); return; }
      $res.empty();
      lista.forEach(c => {
        const ced = c.cnp || c.nationalId || c.passport || '';
        $('<div class="oa-resultado"></div>')
          .html(`${esc(limpio(c.FullName))}<small>${esc(ced)}</small>`)
          .data('oaContacto', c)
          .appendTo($res);
      });
    }).catch(e => { $res.html('<div class="oa-sin-resultados">No se pudo buscar</div>'); console.error(e); });
  }

  function elegir($form, c) {
    const set = (n, v) => $form.find(`[name="${n}"]`).val(v == null ? '' : v).trigger('change');
    set('colAsegurado', limpio(c.FullName));
    set('colCedula', c.cnp || c.nationalId || c.passport || '');
    const nac = fechaIso(c.birth);
    if (nac) set('colFechaNacimiento', nac);
    set('colEdad', edadDe(c));
    if (c.gender === 'M' || c.gender === 'F') set('colSexo', c.gender);
    const $prov = $form.find('[name="colProvincia"]');
    if (c.state && $prov.find(`option[value="${String(c.state)}"]`).length) set('colProvincia', String(c.state));
    set('colContactId', c.id);
    set('colNoSis', c.id);
    set('colNoCobis', c.nationalId || '');
    actualizarEdades($form);
    validarAsegurado($form);
    cerrarResultados($form);
  }

  function bloquearIdentificadores($form) {
    $form.find('[name="colNoSis"], [name="colNoCobis"]')
      .prop('readonly', true)
      .attr('aria-readonly', 'true')
      .addClass('oa-solo-lectura');
  }

  function deshabilitarAutocompletado($form) {
    $form.attr('autocomplete', 'off');
    $form.find('input, select, textarea')
      .attr('autocomplete', 'off')
      .attr('data-lpignore', 'true');
  }

  //////////////////////////////////////////////
  // Eventos (delegados: sobreviven al redibujado)
  //////////////////////////////////////////////

  const formDe = el => $(el).closest('form').length ? $(el).closest('form') : $(el).closest('.frm-oa-colectivo');

  $(document)
    .off('.frmOAColectivo')
    .on('click.frmOAColectivo', '.frm-oa-colectivo .oa-btn-buscar', function (e) {
      e.preventDefault();
      buscar(formDe(this));
    })
    .on('keydown.frmOAColectivo', '.frm-oa-colectivo .oa-buscar-wrap input', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); buscar(formDe(this)); }
      if (e.key === 'Escape') cerrarResultados(formDe(this));
    })
    .on('click.frmOAColectivo', '.frm-oa-colectivo .oa-resultado', function (e) {
      e.preventDefault();
      elegir(formDe(this), $(this).data('oaContacto'));
    })
    .on('change.frmOAColectivo', '.frm-oa-colectivo [name="colFechaNacimiento"], .frm-oa-colectivo [name="colFechaInicialPrestamo"], .frm-oa-colectivo [name="colFechaInicioPrestamo"], .frm-oa-colectivo [name="colFechaFallecimiento"]', function () {
      actualizarEdades(formDe(this));
    })
    .on('input.frmOAColectivo change.frmOAColectivo', '.frm-oa-colectivo [name="colAsegurado"]', function () {
      validarAsegurado(formDe(this));
    })
    .on('click.frmOAColectivo', function (e) {
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
    const claves = Object.keys(CATALOGOS);
    const listas = await Promise.all(claves.map(k => CATALOGOS[k]()));
    $forms.each(function () {
      const $form = $(this).addClass('frm-oa-colectivo');
      deshabilitarAutocompletado($form);
      montarBusqueda($form);
      bloquearIdentificadores($form);
      bloquearCalculados($form);
      actualizarEdades($form);
      validarAsegurado($form);
      cargarReglasPlan($form).catch(e => console.error(e));
      claves.forEach((k, i) => {
        if (listas[i].length) $form.find(`select.oa-cat-${k}`).each(function () { llenarSelect($(this), listas[i]); });
      });
      $form.find('select.oa-cat-fija').each(function () { normalizarVacia($(this)); });
    });
  }

  if (!state.timer) {
    state.timer = setInterval(() => { aplicar().catch(e => console.error(e)); }, 400);
  }
  aplicar().catch(e => console.error(e));

}).call(this);
