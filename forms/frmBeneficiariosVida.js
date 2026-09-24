/*
Name: frmBeneficiariosVida
Author: AIDEN (MSN-000023)
Description: Beneficiarios de la póliza. El detalle se guarda como JSON (string) en hiddenBeneficiarios.
             Se puede agregar, editar y eliminar mientras la póliza no esté emitida, y siempre en la copia
             editable del endoso de objeto asegurado.
Categpry: FORM
Version: 1.00
CreateDate: 23-09-2026
*/

var me = this;

(function () {

  const NS = "__frmBeneficiariosVida";
  const HIDDEN = "hiddenBeneficiarios";
  const STYLE_ID = "frm-beneficiarios-vida-styles";

  // Un solo controlador por página: el endoso pinta el formulario dos veces (copia actual y copia nueva)
  // y la pantalla vuelve a dibujarlo al cargar los valores guardados.
  const state = window[NS] = window[NS] || { timer: null, seen: false, policyPromise: null, policyId: null, relPromise: null };
  state.me = me;

  const policyIdFromUrl = () => window.location.href.split('/')[5];
  const isEndorsement = () => window.location.href.includes('tab12');

  //////////////////////////////////////////////
  // Datos
  //////////////////////////////////////////////

  function getPolicy() {
    const id = parseInt(policyIdFromUrl(), 10);
    if (!id) return Promise.resolve({});
    if (state.policyPromise && state.policyId === id) return state.policyPromise;
    state.policyId = id;
    state.policyPromise = state.me.exe('RepoLifePolicy', { operation: 'GET', filter: `id=${id}`, noTracking: true })
      .then(r => (r && r.outData && r.outData[0]) || {})
      .catch(() => ({}));
    return state.policyPromise;
  }

  function getParentescos() {
    if (state.relPromise) return state.relPromise;
    state.relPromise = state.me.exe('RepoRelationshipCatalog', { operation: 'GET', filter: `principalType='BENEFICIARY'` })
      .then(r => ((r && r.outData) || []).map(p => ({ id: p.id, name: decodeHtml(p.name) })))
      .catch(() => []);
    return state.relPromise;
  }

  function decodeHtml(v) {
    return $('<textarea/>').html(v == null ? '' : String(v)).text();
  }

  function esc(v) {
    return $('<div/>').text(v == null ? '' : String(v)).html();
  }

  function leer($form) {
    const raw = $form.find(`[name="${HIDDEN}"]`).val();
    if (!raw) return [];
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("JSON inválido en hiddenBeneficiarios");
      return [];
    }
  }

  // Los espacios van escapados (barra invertida + u0020): sigue siendo el mismo JSON al parsearlo, pero sin espacios literales,
  // porque el renderer copia el valor guardado al atributo user-data quitando las palabras repetidas.
  function serializar(rows) {
    return JSON.stringify(rows).split(' ').join(String.fromCharCode(92) + 'u0020');
  }

  function guardar($form, rows) {
    $form.find(`[name="${HIDDEN}"]`).val(serializar(rows)).trigger('change');
  }

  // Igual que el renderer arma el atributo user-data: palabras separadas por espacio, sin repetidas.
  function comoAtributo(v) {
    return String(v).split(' ').filter((x, i, a) => a.indexOf(x) === i).join(' ');
  }

  function fechaRegistro() {
    const f = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())} ${p(f.getHours())}:${p(f.getMinutes())}:${p(f.getSeconds())}`;
  }

  function n2(numero) {
    if (numero === null || numero === undefined || numero === '' || isNaN(numero)) return '';
    return Number(numero).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const redondear2 = v => Math.round(Number(v) * 100) / 100;

  //////////////////////////////////////////////
  // Editabilidad
  //////////////////////////////////////////////

  // Copia actual del endoso: siempre sólo lectura.
  // Si no, manda el botón Guardar/Actualizar del objeto: la pantalla lo deshabilita con la póliza emitida y lo
  // habilita en la copia nueva del endoso de objeto asegurado hasta que el endoso se ejecuta.
  // Respaldo sin botón: en el endoso sólo la copia nueva; fuera del endoso, mientras la póliza no esté emitida.
  function esEditable($form, policy) {
    const id = $form.attr('id');
    if (id === 'fb-renderoldInsuredObjects') return false;
    const $btn = $form.parents().filter(function () { return $(this).children('button').find('.anticon-save').length > 0; })
      .first().children('button').filter(function () { return $(this).find('.anticon-save').length > 0; }).first();
    if ($btn.length) return !$btn.prop('disabled');
    if (isEndorsement()) return id === 'fb-rendernewInsuredObjects';
    return !(policy && policy.active === true);
  }

  //////////////////////////////////////////////
  // Render
  //////////////////////////////////////////////

  function inyectarEstilos() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
  /* ===== CONTENEDOR ===== */
  .frm-benef-vida .contenedorBeneficiarios {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
    font-size: 13px;
    background: #fff;
    border-radius: 6px;
  }

  /* ===== TABS ===== */
  .frm-benef-vida .contenedorBeneficiarios .tabs-header {
    display: flex;
    gap: 2px;
    padding-left: 0 !important;
    margin: 0 !important;
  }
  .frm-benef-vida .contenedorBeneficiarios .tab-link {
    padding: 6px 16px;
    cursor: pointer;
    color: rgba(0,0,0,0.65);
    border: 1px solid #cbd1d8;
    border-radius: 6px 6px 0 0;
    background: #fafafa;
    font-size: 13px;
    position: relative;
    top: 1px;
  }
  .frm-benef-vida .contenedorBeneficiarios .tab-link:hover { color: #1677ff; }
  .frm-benef-vida .contenedorBeneficiarios .tab-link.active {
    color: #1677ff;
    font-weight: 500;
    background: #fff;
    border-top: 2px solid #1677ff;
    border-bottom-color: #fff;
  }
  .frm-benef-vida .contenedorBeneficiarios .tab-content {
    display: none;
    border: 1px solid #cbd1d8;
    border-radius: 0 6px 6px 6px;
    padding: 4px;
  }
  .frm-benef-vida .contenedorBeneficiarios .tab-content.active { display: block; }

  /* ===== BARRA DE BOTONES ===== */
  .frm-benef-vida .benef-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid #e6ebf2;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 2px;
  }
  .frm-benef-vida .benef-toolbar .benef-total { margin-left: auto; font-weight: 500; }
  .frm-benef-vida .benef-toolbar .benef-total.excede { color: #cf1322; }
  .frm-benef-vida .ant-btn { font-size: 13px; }
  .frm-benef-vida .ant-btn:not(.ant-btn-primary):not(.ant-btn-dangerous) { border-color: #8f9aa7; }
  .frm-benef-vida .ant-btn:disabled,
  .frm-benef-vida .ant-btn[disabled] {
    border-color: #6f7b88 !important;
    opacity: 1 !important;
    cursor: not-allowed;
  }

  /* ===== EDITOR ===== */
  .frm-benef-vida .benef-editor {
    border: 1px solid #e6ebf2;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 2px;
    background: #fafcff;
  }
  .frm-benef-vida .benef-editor .benef-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(160px, 1fr));
    gap: 8px 12px;
  }
  .frm-benef-vida .benef-editor label { display: block; margin-bottom: 2px; }
  .frm-benef-vida .benef-editor .required-label::after { content: " *"; color: red; }
  .frm-benef-vida .benef-editor .benef-acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
  .frm-benef-vida .benef-editor .benef-error { color: #cf1322; margin-top: 6px; }

  /* ===== INPUTS ===== */
  .frm-benef-vida .benef-input {
    width: 100%;
    height: 32px;
    padding: 4px 11px;
    font-size: 13px;
    border: 1px solid #b8c4d1 !important;
    border-radius: 6px;
    outline: none;
    box-sizing: border-box;
    background: #fff;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .frm-benef-vida .benef-input:hover { border-color: #8da9c2 !important; }
  .frm-benef-vida .benef-input:focus {
    border-color: #1677ff !important;
    box-shadow: 0 0 0 2px rgba(22,119,255,0.2);
  }
  .frm-benef-vida .benef-input:disabled {
    border-color: #b8c4d1 !important;
    background: #f5f5f5;
    cursor: not-allowed;
  }

  /* ===== GRILLA ===== */
  .frm-benef-vida .tabla-benef-wrap {
    border: 1px solid #cbd1d8;
    border-radius: 6px;
    overflow-x: auto;
  }
  .frm-benef-vida .tabla-benef {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    line-height: 18px;
  }
  .frm-benef-vida .tabla-benef th {
    background: #bfbfbf;
    color: rgba(0,0,0,0.85);
    font-weight: 500;
    padding: 5px 8px;
    text-align: left;
    border-right: 1px solid #cbd1d8;
    border-bottom: 1px solid #cbd1d8;
    white-space: nowrap;
  }
  .frm-benef-vida .tabla-benef th:last-child { border-right: none; }
  .frm-benef-vida .tabla-benef td {
    padding: 5px 8px;
    border-bottom: 1px solid #cbd1d8;
  }
  .frm-benef-vida .tabla-benef tbody tr:last-child td { border-bottom: none; }
  .frm-benef-vida .tabla-benef .num { text-align: right; }
  .frm-benef-vida .tabla-benef tbody tr.benef-row { cursor: pointer; }
  .frm-benef-vida .tabla-benef tbody tr.benef-row:hover td { background: #b7d7ff; }
  .frm-benef-vida .tabla-benef tbody tr.benef-row.benef-selected td,
  .frm-benef-vida .tabla-benef tbody tr.benef-row.benef-selected:hover td { background: #86b4ff; }
  .frm-benef-vida .tabla-benef .benef-vacio td { text-align: center; color: rgba(0,0,0,0.45); padding: 16px 8px; }
  .frm-benef-vida .tabla-benef .benef-acc { white-space: nowrap; text-align: center; }
  .frm-benef-vida .tabla-benef .benef-acc .ant-btn { height: 24px; padding: 0 7px; font-size: 12px; }
  `;
    $('<style>', { id: STYLE_ID }).text(css).appendTo('head');
  }

  function montar($form) {
    const $hidden = $form.find('[name="hiddenFormStyle"]');
    let $c = $form.find('.contenedorBeneficiarios');
    if ($c.length) return $c;

    $form.addClass('frm-benef-vida');
    $c = $(`
      <div class="contenedorBeneficiarios">
        <div class="tabs-wrapper">
          <div class="tabs-header">
            <div class="tab-link active" data-tab="tabBeneficiarios">Beneficiarios</div>
          </div>
          <div class="tab-content active" data-tab-content="tabBeneficiarios">
            <div class="benef-toolbar">
              <button type="button" class="ant-btn ant-btn-primary benef-btn-agregar">+ Agregar beneficiario</button>
              <span class="benef-total"></span>
            </div>
            <div class="benef-editor" style="display:none"></div>
            <div class="tabla-benef-wrap">
              <table class="tabla-benef">
                <thead>
                  <tr>
                    <th>#</th>
                    <th class="num">% Beneficiario</th>
                    <th>Nombre Completo</th>
                    <th>Parentesco</th>
                    <th>Identificación</th>
                    <th>Id</th>
                    <th>Fecha de Registro</th>
                    <th class="benef-acc">Acciones</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`);

    // El encabezado del json queda como título dentro del contenedor, como en DT_ACCIDENTES_V1
    const $header = $form.find('.ptab').first().closest('.row');
    if ($header.length) $header.hide();
    if ($hidden.length) $hidden.closest('form').append($c); else $form.append($c);
    return $c;
  }

  function pintarGrilla($form, editable) {
    const rows = leer($form);
    const $c = $form.find('.contenedorBeneficiarios');
    const $tb = $c.find('.tabla-benef tbody').empty();

    if (!rows.length) {
      $tb.append('<tr class="benef-vacio"><td colspan="8">Sin beneficiarios registrados</td></tr>');
    }
    rows.forEach((r, i) => {
      $tb.append(`
        <tr class="benef-row" data-index="${i}">
          <td>${i + 1}</td>
          <td class="num">${esc(n2(r.porcentaje))}</td>
          <td>${esc(r.nombreCompleto)}</td>
          <td>${esc(r.parentesco)}</td>
          <td>${esc(r.identificacion)}</td>
          <td>${esc(r.id)}</td>
          <td>${esc(r.fechaRegistro)}</td>
          <td class="benef-acc">
            <button type="button" class="ant-btn benef-btn-editar" data-index="${i}" ${editable ? '' : 'disabled'}>Editar</button>
            <button type="button" class="ant-btn ant-btn-dangerous benef-btn-eliminar" data-index="${i}" ${editable ? '' : 'disabled'}>Eliminar</button>
          </td>
        </tr>`);
    });

    const total = redondear2(rows.reduce((s, r) => s + (Number(r.porcentaje) || 0), 0));
    $c.find('.benef-total').text(`Total: ${n2(total)} %`).toggleClass('excede', total > 100);
    $c.find('.benef-btn-agregar').prop('disabled', !editable);
    if (!editable) $c.find('.benef-editor').hide().empty();
  }

  async function abrirEditor($form, index) {
    const rows = leer($form);
    const r = index === null ? {} : (rows[index] || {});
    const parentescos = await getParentescos();
    const $ed = $form.find('.contenedorBeneficiarios .benef-editor');
    const opciones = ['<option value="">Seleccione una opción</option>']
      .concat(parentescos.map(p => `<option value="${esc(p.id)}" ${String(p.id) === String(r.parentescoId) ? 'selected' : ''}>${esc(p.name)}</option>`))
      .join('');

    $ed.attr('data-index', index === null ? '' : index).html(`
      <div class="benef-grid">
        <div><label class="required-label">Porcentaje Beneficiario</label>
          <input type="number" class="benef-input benef-f-porcentaje" step="0.01" min="0.01" max="100" value="${r.porcentaje != null ? esc(r.porcentaje) : ''}"></div>
        <div><label class="required-label">Nombre Completo</label>
          <input type="text" class="benef-input benef-f-nombre" maxlength="200" value="${esc(r.nombreCompleto)}"></div>
        <div><label>Parentesco</label>
          <select class="benef-input benef-f-parentesco">${opciones}</select></div>
        <div><label>Identificación</label>
          <input type="text" class="benef-input benef-f-identificacion" maxlength="50" value="${esc(r.identificacion)}"></div>
        <div><label>Id</label>
          <input type="number" class="benef-input benef-f-id" step="1" min="0" value="${r.id != null ? esc(r.id) : ''}"></div>
        <div><label>Fecha de Registro</label>
          <input type="text" class="benef-input" disabled value="${esc(r.fechaRegistro || 'Automática al aceptar')}"></div>
      </div>
      <div class="benef-error"></div>
      <div class="benef-acciones">
        <button type="button" class="ant-btn benef-btn-cancelar">Cancelar</button>
        <button type="button" class="ant-btn ant-btn-primary benef-btn-aceptar">Aceptar</button>
      </div>`).show();
    $ed.find('.benef-f-porcentaje').trigger('focus');
  }

  function aceptarEditor($form) {
    const $ed = $form.find('.contenedorBeneficiarios .benef-editor');
    const idxAttr = $ed.attr('data-index');
    const index = idxAttr === '' || idxAttr === undefined ? null : parseInt(idxAttr, 10);
    const rows = leer($form);
    const errores = [];

    const pctRaw = String($ed.find('.benef-f-porcentaje').val() || '').trim();
    const pct = redondear2(pctRaw);
    if (pctRaw === '' || isNaN(Number(pctRaw))) errores.push('El porcentaje es obligatorio.');
    else if (pct <= 0 || pct > 100) errores.push('El porcentaje debe ser mayor que 0 y no mayor que 100.');

    const nombre = String($ed.find('.benef-f-nombre').val() || '').trim();
    if (!nombre) errores.push('El nombre completo es obligatorio.');

    const identificacion = String($ed.find('.benef-f-identificacion').val() || '').trim();
    if (identificacion && !/^[A-Za-z0-9-]+$/.test(identificacion)) errores.push('La identificación sólo admite letras, números y guiones.');

    const idRaw = String($ed.find('.benef-f-id').val() || '').trim();
    if (idRaw && !/^\d+$/.test(idRaw)) errores.push('El Id debe ser numérico.');

    const otros = rows.reduce((s, r, i) => s + (i === index ? 0 : (Number(r.porcentaje) || 0)), 0);
    if (!errores.length && redondear2(otros + pct) > 100) errores.push(`La suma de porcentajes no puede superar 100 (quedaría en ${n2(redondear2(otros + pct))}).`);

    if (errores.length) {
      $ed.find('.benef-error').html(errores.map(esc).join('<br>'));
      return;
    }

    const $par = $ed.find('.benef-f-parentesco');
    const parentescoId = $par.val() ? Number($par.val()) : null;
    const fila = {
      porcentaje: pct,
      nombreCompleto: nombre,
      parentescoId: parentescoId,
      parentesco: parentescoId ? $par.find('option:selected').text() : '',
      identificacion: identificacion,
      id: idRaw ? Number(idRaw) : null,
      fechaRegistro: index === null ? fechaRegistro() : (rows[index].fechaRegistro || fechaRegistro())
    };
    if (index === null) rows.push(fila); else rows[index] = fila;
    guardar($form, rows);
    $ed.hide().empty();
    pintarGrilla($form, true);
  }

  function eliminar($form, index) {
    const rows = leer($form);
    const r = rows[index];
    if (!r) return;
    if (!window.confirm(`¿Eliminar al beneficiario ${r.nombreCompleto || ''}?`)) return;
    rows.splice(index, 1);
    guardar($form, rows);
    $form.find('.contenedorBeneficiarios .benef-editor').hide().empty();
    pintarGrilla($form, true);
  }

  //////////////////////////////////////////////
  // Eventos (delegados: sobreviven al redibujado de la pantalla)
  //////////////////////////////////////////////

  const formDe = el => $(el).closest('form');
  const puedeEditar = el => formDe(el).attr('data-benef-editable') === '1';

  $(document)
    .off('.frmBenefVida')
    .on('click.frmBenefVida', '.frm-benef-vida .benef-btn-agregar', function () {
      if (puedeEditar(this)) abrirEditor(formDe(this), null);
    })
    .on('click.frmBenefVida', '.frm-benef-vida .benef-btn-editar', function (e) {
      e.stopPropagation();
      if (puedeEditar(this)) abrirEditor(formDe(this), parseInt($(this).attr('data-index'), 10));
    })
    .on('click.frmBenefVida', '.frm-benef-vida .benef-btn-eliminar', function (e) {
      e.stopPropagation();
      if (puedeEditar(this)) eliminar(formDe(this), parseInt($(this).attr('data-index'), 10));
    })
    .on('click.frmBenefVida', '.frm-benef-vida .benef-btn-cancelar', function () {
      formDe(this).find('.contenedorBeneficiarios .benef-editor').hide().empty();
    })
    .on('click.frmBenefVida', '.frm-benef-vida .benef-btn-aceptar', function () {
      if (puedeEditar(this)) aceptarEditor(formDe(this));
    })
    .on('keydown.frmBenefVida', '.frm-benef-vida .benef-editor input', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (puedeEditar(this)) aceptarEditor(formDe(this)); }
    })
    .on('click.frmBenefVida', '.frm-benef-vida .tabla-benef tr.benef-row', function () {
      $(this).addClass('benef-selected').siblings().removeClass('benef-selected');
    });

  //////////////////////////////////////////////
  // Inicio: reaplicación idempotente
  //////////////////////////////////////////////

  async function aplicar() {
    const $forms = $(`[name="${HIDDEN}"]`).closest('form');
    if (!$forms.length) {
      if (state.seen) { clearInterval(state.timer); state.timer = null; state.seen = false; }
      return;
    }
    state.seen = true;
    inyectarEstilos();
    const policy = await getPolicy();
    $forms.each(function () {
      const $form = $(this);
      // Formulario recién dibujado: el renderer restaura el oculto buscando por id, y con dos copias abiertas
      // (endoso) el valor cae en la otra. El valor propio de cada copia queda en su atributo user-data.
      // Si el valor del campo corresponde al atributo es el propio (y completo); si no, se toma el atributo.
      if (!$form.find('.contenedorBeneficiarios').length) {
        const $h = $form.find(`[name="${HIDDEN}"]`);
        const ud = $h.attr('user-data');
        const v = $h.val() || '';
        if (ud !== undefined && comoAtributo(v) !== ud) $h.val(ud);
      }
      const editable = esEditable($form, policy);
      const firma = (editable ? '1' : '0') + '|' + ($form.find(`[name="${HIDDEN}"]`).val() || '');
      const yaMontado = $form.find('.contenedorBeneficiarios').length > 0;
      $form.attr('data-benef-editable', editable ? '1' : '0');
      montar($form);
      // Repinta sólo si el formulario se redibujó o cambió el valor guardado (no pisa un editor abierto)
      if (!yaMontado || $form.attr('data-benef-firma') !== firma) {
        $form.attr('data-benef-firma', firma);
        pintarGrilla($form, editable);
      }
    });
  }

  if (!state.timer) {
    state.timer = setInterval(() => { aplicar().catch(e => console.error(e)); }, 400);
  }
  aplicar().catch(e => console.error(e));

}).call(this);
