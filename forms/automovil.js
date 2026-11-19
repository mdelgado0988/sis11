/*
Name: automovil
Author: Michael Delgado
Description: Formulario generico
Categpry: FORM
Version: 1.00
CreateDate: 05-07-2026
*/
const me = this;    
const policyId = window.location.href.split('/')[5] || 3374;
const isEndorsment = window.location.href.includes('tab12');
let policy = {};
let configCobtar = [];
let configCoverages = [];
let productCoverages = [];
let coberturasSeleccionadas = [];
let polizaConfirmada = false;
let marcasCargadas = false; // MSN-000209: la lista de marcas ya se pidió
function polizaEmitidaParaUbicacion() {
    const active = policy?.active;
    const activeDate = policy?.activeDate;
    return (activeDate !== null && activeDate !== undefined && String(activeDate).trim() !== '')
        || active === true || active === 1 || String(active).toLowerCase() === 'true' || String(active) === '1';
}

async function cargarUbicacionAsegurado() {
    const $hidden = $('#hiddenUbicacion');
    if (!$hidden.length || polizaEmitidaParaUbicacion()) return;

    try {
        let insureds = Array.isArray(policy?.Insureds) ? policy.Insureds : [];
        let contactId = policy?.MainInsured?.contactId
            ?? insureds.find(item => Number(item?.role) === 0)?.contactId
            ?? insureds[0]?.contactId;

        if (!contactId) {
            const result = await me.exe('RepoLifePolicy', {
                operation: 'GET', include: ['Insureds'], filter: `id=${policyId}`, noTracking: true
            });
            insureds = result.outData?.[0]?.Insureds ?? [];
            contactId = insureds.find(item => Number(item?.role) === 0)?.contactId ?? insureds[0]?.contactId;
        }
        if (!contactId) return;

        const addressResult = await me.exe('RepoContactAddress', {
            operation: 'GET', filter: `contactId=${Number(contactId)}`, noTracking: true
        });
        const address = addressResult.outData?.[0] ?? {};
        const country = address.country ?? '';
        const state = address.state ?? '';
        const city = address.city ?? '';
        const sector = address.sector ?? address.corregimiento ?? '';
        const escape = value => String(value ?? '').replace(/'/g, "''");
        const lookup = async (command, filter) => {
            if (!filter) return {};
            const result = await me.exe(command, { operation: 'GET', filter, noTracking: true });
            return result.outData?.[0] ?? {};
        };
        const [countryRow, stateRow, cityRow, sectorRow] = await Promise.all([
            lookup('RepoCountryCatalog', country && `code='${escape(country)}'`),
            lookup('RepoStateCatalog', country && state && `countryCode='${escape(country)}' AND code='${escape(state)}'`),
            lookup('RepoCityCatalog', state && city && `stateCode='${escape(state)}' AND code='${escape(city)}'`),
            lookup('RepoSectorCatalog', city && sector && `cityCode='${escape(city)}' AND code='${escape(sector)}'`)
        ]);
        const catalog = (code, row) => ({ codigo: String(code ?? ''), descripcion: String(row?.name ?? '') });
        const direccion = [address.address1, address.address2].filter(Boolean).join(', ');

        $hidden.val(JSON.stringify({
            pais: catalog(country, countryRow),
            provincia: catalog(state, stateRow),
            ciudad: catalog(city, cityRow),
            corregimiento: catalog(sector, sectorRow),
            direccion
        })).trigger('change');
    } catch (error) {
        console.warn('No se pudo cargar la ubicación del asegurado.', error);
    }
}


const changeMarca = async (event) => {
  try {
     const Modelo = $("#cmbModelo").val();
     const Marca = $("#cmbMarca").val();
     // MSN-000209: si la persona cambia la marca, el modelo guardado no se vuelve a
     // elegir solo (el mismo código de modelo existe en otras marcas): queda vacío.
     const cambioDeLaPersona = !!(event && !event.isTrigger);
     await loadDataTableModelo({reference:'#cmbModelo',tableName:'tbModelos',indexCode:2,indexDisplay:3,indexMarca:1,valMarca:Marca,indexRamo:0,valRamo:policy.lob,ordenar:true,restaurarGuardado:!cambioDeLaPersona});
  } catch (error) {
    console.error(`Error seleccionando la Marca: ${error.toString()}`)
  }   
};

function normalizeVINValue(value) {
  return String(value == null ? '' : value).trim();
}

function getVINField() {
  return $("#tbVIN, [name='tbVIN'], [data-name='tbVIN'], [data-field='tbVIN'], input[id*='VIN'], input[name*='VIN']");
}

function getVINSelect() {
  return $("#cmbNoTieneVIN");
}

function ensureVINSelect() {
  try {
    const $tbVIN = getVINField();
    if (!$tbVIN.length || $('#cmbNoTieneVIN').length) {
      return;
    }

    const $select = $(`
      <select id="cmbNoTieneVIN" class="form-control" style="width:auto; min-width:120px; margin-left:10px;">
        <option value="No">No</option>
        <option value="Si">Si</option>
      </select>
    `);

    const $mount = $tbVIN.closest('.input-group, .form-group, .row, .col, .field-container, .form-row').first();
    if ($mount.length) {
      $mount.css('display', 'flex');
      $mount.css('align-items', 'center');
      $mount.css('gap', '8px');
      $mount.append($select);
    } else {
      $tbVIN.last().after($select);
    }

    $select.val('No');
  } catch (error) {
    console.error(`Error creando el select de VIN: ${error.toString()}`);
  }
}

function syncVINSelectState() {
  try {
    const $tbVIN = getVINField();
    const $select = getVINSelect();

    if (!$tbVIN.length || !$select.length) {
      return;
    }

    const value = normalizeVINValue($tbVIN.val());
    const hasValue = value !== '';
    const allowVINEditOnEndorsement = isEndorsment && polizaConfirmada;
    const $vinWrapper = $tbVIN.closest('.ant-form-item').first();

    if (hasValue) {
      $select.val('No');
      $select.prop('disabled', true);
      $tbVIN.prop('disabled', false);
      $tbVIN.prop('required', true);
      $tbVIN.removeClass('vin-optional');
      $tbVIN.attr('aria-required', 'true');
      $vinWrapper.removeClass('vin-no-required');
    } else {
      if (!$select.val()) {
        $select.val('No');
      }
      $select.prop('disabled', false);
      const noTieneVIN = String($select.val() || '').trim().toLowerCase() === 'si';
      $tbVIN.prop('disabled', allowVINEditOnEndorsement ? false : noTieneVIN);
      $tbVIN.prop('required', allowVINEditOnEndorsement || !noTieneVIN);
      $tbVIN.attr('aria-required', allowVINEditOnEndorsement || !noTieneVIN ? 'true' : 'false');
      $tbVIN.toggleClass('vin-optional', !allowVINEditOnEndorsement && noTieneVIN);
      $vinWrapper.toggleClass('vin-no-required', !allowVINEditOnEndorsement && noTieneVIN);
    }

    $tbVIN[0].setCustomValidity('');
  } catch (error) {
    console.error(`Error sincronizando VIN: ${error.toString()}`);
  }
}

function injectVINStyle() {
  try {
    const STYLE_ID = 'vin-antd-v4-style';
    $('#' + STYLE_ID).remove();

    const css = `
      .vin-no-required .ant-form-item-label > label.ant-form-item-required::before,
      .vin-no-required .ant-form-item-label > label::before,
      .vin-no-required label.ant-form-item-required::before,
      .vin-no-required label::before,
      label[for='tbVIN'].ant-form-item-required::before,
      label[for='tbVIN']::before,
      .ant-form-item label[for='tbVIN'].ant-form-item-required::before,
      .ant-form-item label[for='tbVIN']::before {
        display: none !important;
        content: none !important;
      }

      #tbVIN.vin-optional {
        background-color: #fafafa !important;
      }
    `;

    $('<style>', { id: STYLE_ID, type: 'text/css' }).html(css).appendTo('head');
  } catch (error) {
    console.error(`Error aplicando estilos de VIN: ${error.toString()}`);
  }
}

function updateVINRequirement() {
  syncVINSelectState();
}

function prepareTabContainer() {
  try {
    const $certificado = $("#txtCertificado");
    const $form = $certificado.closest("form");

    if (!$form.length) {
      return;
    }

    $form.addClass('automovil-form');

    if ($("#customSectionTabs").length) {
      return;
    }

    const tabsHtml = `
      <ul id="customSectionTabs" class="nav nav-tabs">
        <li class="nav-item">
          <a href="" data-target="#tabHome" data-toggle="tab" class="nav-link small text-uppercase active">Datos Generales</a>
        </li>
        <li class="nav-item">
          <a href="" data-target="#tabTarifas" data-toggle="tab" class="nav-link small text-uppercase">Tarifas</a>
        </li>
      </ul>
      <div class="tab-content">
        <div id="tabHome" class="tab-pane active" style="padding: 1em;"></div>
        <div id="tabTarifas" class="tab-pane" style="padding: 1em;"></div>
      </div>
    `;

    $form.prepend(tabsHtml);

    $("#customSectionTabs a").on("click", function (e) {
      e.preventDefault();
      $(this).tab("show");
    });
  } catch (error) {
    console.error(`Error preparando pestañas: ${error.toString()}`);
  }
}

function moveFieldsToTabHome() {
  try {
    const $tabHome = $("#tabHome");
    if (!$tabHome.length) {
      return;
    }

    const movedRows = new Set();

    $(".ptab").each(function () {
      const $row = $(this).closest(".row");

      if ($row.length && !movedRows.has($row[0])) {
        movedRows.add($row[0]);
        $tabHome.append($row);
      }
    });
  } catch (error) {
    console.error(`Error moviendo campos al tab principal: ${error.toString()}`);
  }
}

function setEstadoCargaInicial(cargando) {
  $('#autoFormLoadStatus').remove();
  if (!cargando || !$('#tabHome').length) return;
  $('<div>', {
    id: 'autoFormLoadStatus',
    class: 'alert alert-info',
    text: 'Cargando datos del vehículo...'
  }).prependTo('#tabHome');
}

const onDocumentReady = async() => {
  
    prepareTabContainer();
    moveFieldsToTabHome();
    setEstadoCargaInicial(true);
    // MSN-000209: Marca y Modelo con búsqueda al escribir.
    activarBuscadorDeLista('#cmbMarca', {
        ayuda: 'Escriba para buscar la marca',
        obligatorio: 'Seleccione una marca de la lista.',
        vacio: 'No hay marcas para elegir.',
        cargando: function () { return !marcasCargadas; }
    });
    activarBuscadorDeLista('#cmbModelo', {
        ayuda: 'Escriba para buscar el modelo',
        obligatorio: 'Seleccione un modelo de la lista.',
        vacio: function () { return $('#cmbMarca').val() ? 'La marca elegida no tiene modelos.' : 'Elija primero la marca.'; },
        cargando: function () { return !!loadDataTableModelo.cargando; }
    });

    try {
      await loadPolicy();
      polizaConfirmada = esPolizaEmitidaCoberturas();

      // Keep the certificate field read-only at all times.
      $("#txtCertificado").prop("readonly", true);

      // These requests only require the policy and can run concurrently. Model
      // loading remains below because it must use the selected brand.
      const initialLoads = await Promise.allSettled([
          cargarUbicacionAsegurado(),
          loadDataTable({reference:'#cmbMarca',tableName:'tbMarcas',indexCode:1,indexDisplay:2,ordenar:true}),
          loadDataTable({reference:'#cmbtipo',tableName:'tblTipoPorRamo',indexCode:1,indexDisplay:2,filter:policy.lob}),
          loadDataTable({reference:'#cmbUsoAuto',tableName:'tblUsoPorRamo',indexCode:1,indexDisplay:2,filter:policy.lob})
      ]);
      const failedLoads = initialLoads.filter(function (item) { return item.status === 'rejected'; });
      if (failedLoads.length) {
          const message = 'No se pudo cargar ' + failedLoads.length + ' catálogo(s) del objeto asegurado.';
          console.error(message, failedLoads);
          if (me.message && me.message.warning) me.message.warning(message);
      }
      await changeMarca();
      $("#cmbMarca").on("change", changeMarca);
      await cargarCobtarDinamico();
      bloquearCamposPolizaEmitida();
      validaInputs();
      injectVINStyle();
      ensureVINSelect();
      syncVINSelectState();
      syncVINSelectWhenReady();
    } catch (error) {
      console.error('No se pudo inicializar el formulario de automóvil.', error);
      if (me.message && me.message.error) me.message.error('No se pudo cargar completamente el formulario de automóvil.');
    } finally {
      marcasCargadas = true;
      setEstadoCargaInicial(false);
    }

}

//////////////////////////////////////////////////////////////////////////////
// Carga de catálogos
//////////////////////////////////////////////////////////////////////////////

async function loadDataTable ({
    reference,
    tableName,
    indexCode,
    indexDisplay,
    filter,
    ordenar,
}) {
    $(reference).empty().append('<option value="">Seleccione una opción</option>');;
    const result = await me.exe("GetFullTable", { table: tableName });
    const data = result.outData && result.outData.length > 0 ? result.outData : [];
    data.splice(0, 1);

    const filteredData = filter === undefined || filter === null || String(filter).trim() === ''
        ? data
        : data.filter(item => String(item && item[0] !== undefined ? item[0] : '').trim() === String(filter).trim());

    // MSN-000209: con ordenar, la lista se muestra en orden alfabético.
    (ordenar ? ordenarPorNombre(filteredData, indexDisplay) : filteredData).forEach(item => {
        $(reference).append('<option value="' + item[indexCode] + '">' + item[indexDisplay] + '</option>');
    });

    const dataValue = $(reference).attr('user-data');
    if(!!dataValue){
        $(reference).val(String(dataValue).trim()).trigger('change');
    }
    return filteredData;
}

async function loadDataTableModelo ({
    reference,
    tableName,
    indexCode,
    indexDisplay,
    indexMarca,
    valMarca,
    indexRamo,
    valRamo,
    ordenar,
    restaurarGuardado = true
}) {
    // MSN-000209: sólo la última carga llena la lista. Si la marca cambia otra vez
    // antes de que llegue la tabla, la carga anterior no agrega sus modelos.
    const turno = loadDataTableModelo.turno = (loadDataTableModelo.turno || 0) + 1;
    loadDataTableModelo.cargando = true;
    $(reference).empty().append('<option value="">Seleccione una opción</option>');;
    let result;
    try {
        result = await me.exe("GetFullTable", { table: tableName });
    } finally {
        if (turno === loadDataTableModelo.turno) loadDataTableModelo.cargando = false;
    }
    if (turno !== loadDataTableModelo.turno) return [];
    const data = result.outData && result.outData.length > 0 ? result.outData : [];
  
    data.splice(0, 1);
    const modelos = [];
    data.forEach(item => {
      const matchesMarca = String(item && item[indexMarca] !== undefined ? item[indexMarca] : '').trim() === String(valMarca == null ? '' : valMarca).trim();
      const matchesRamo = valRamo === undefined || valRamo === null || String(valRamo).trim() === ''
        || String(item && item[indexRamo] !== undefined ? item[indexRamo] : '').trim() === String(valRamo).trim();

      if (matchesMarca && matchesRamo){
        modelos.push(item);
      }
    });
    (ordenar ? ordenarPorNombre(modelos, indexDisplay) : modelos).forEach(item => {
        $(reference).append('<option value="' + item[indexCode] + '">' + item[indexDisplay] + '</option>');
    });

    const dataValue = $(reference).attr('user-data');
    if(restaurarGuardado && !!dataValue){
        $(reference).val(String(dataValue).trim()).trigger('change');
    }
    return data;
}

//////////////////////////////////////////////////////////////////////////////
// Principal function to load data
//////////////////////////////////////////////////////////////////////////////

$(document)
    .promise()
    .then(function () { setTimeout(onDocumentReady, 1000); });

//Validando inputs
function validaInputs() {

    document.addEventListener("invalid", function (e) {

        const field = e.target;
        const $field = $(field);

        // obtener el tab-pane padre
        const $tab = $field.closest(".tab-pane");

        // si existe y no está activo
        if ($tab.length && !$tab.hasClass("active")) {

            const tabId = $tab.attr("id");

            // buscar el nav-link asociado
            const $link = $(`#customSectionTabs a[data-target="#${tabId}"]`);

            // activar tab bootstrap
            $link.tab("show");
        }

        // esperar render y enfocar
        setTimeout(() => {
            field.focus();
        }, 50);

    }, true);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Tariff tab
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function vEqual(value) {
    return String(value || '').trim().toUpperCase();
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function inyectarEstilosAntdCobtar() {
    try {
        const STYLE_ID = 'antd-cobtar-styles';
        $('#' + STYLE_ID).remove();

        const css = `
            #tabTarifas {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
                background: #fff;
                border-radius: 6px;
            }
            #tabTarifas .tabla-ant {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }
            #tabTarifas .tabla-ant th {
                background: #fafafa;
                color: rgba(0,0,0,0.85);
                font-weight: 500;
                border-bottom: 1px solid #f0f0f0;
                padding: 10px;
                text-align: left;
            }
            #tabTarifas .tabla-ant td {
                border-bottom: 1px solid #f0f0f0;
                padding: 8px;
                vertical-align: top;
            }
            #tabTarifas .ant-input-custom,
            #tabTarifas .ant-select-custom {
                width: 100%;
                height: 32px;
                padding: 4px 11px;
                font-size: 14px;
                border: 1px solid #d9d9d9;
                border-radius: 6px;
                box-sizing: border-box;
                background: #fff;
            }
            .automovil-form input:not([type="checkbox"]):not([type="radio"]),
            .automovil-form select,
            .automovil-form textarea {
                border: 1px solid #b8c4d1 !important;
                border-radius: 6px;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .automovil-form input:not([type="checkbox"]):not([type="radio"]):hover,
            .automovil-form select:hover,
            .automovil-form textarea:hover {
                border-color: #8da9c2 !important;
            }
            .automovil-form input:not([type="checkbox"]):not([type="radio"]):focus,
            .automovil-form select:focus,
            .automovil-form textarea:focus {
                border-color: #1677ff !important;
                box-shadow: 0 0 0 2px rgba(22,119,255,0.2);
                outline: none;
            }
            .automovil-form input:not([type="checkbox"]):not([type="radio"]):disabled,
            .automovil-form select:disabled,
            .automovil-form textarea:disabled {
                border-color: #b8c4d1 !important;
                background: #f5f5f5;
            }
            #tabTarifas .readonly-style {
                background-color: #f5f5f5 !important;
                color: #666 !important;
                border: 1px solid #d9d9d9 !important;
                pointer-events: none;
                opacity: 1 !important;
            }
            .auto-issued-readonly {
                background-color: #f5f5f5 !important;
                color: #666 !important;
                border-color: #d9d9d9 !important;
                cursor: not-allowed !important;
                pointer-events: none !important;
            }
            #tabTarifas #toolbarCoberturas {
                display: flex !important;
                justify-content: flex-start !important;
                align-items: center;
                margin-bottom: 16px;
                gap: 8px;
            }
            #tabTarifas #footerResumenTarifas{
                margin-top:16px;
                padding:14px 18px;
                border:1px solid #b7eb8f;
                border-radius:8px;
                background:#f6ffed;
                display:flex;
                align-items:center;
                justify-content:flex-end;
                gap: 22px;
            }
            #tabTarifas #footerResumenTarifas .footer-success-icon{
                width:28px;
                height:28px;
                border-radius:50%;
                background:#52c41a;
                position:relative;
            }
            #tabTarifas #footerResumenTarifas .footer-tarifas-item{
                display:flex;
                flex-direction:column;
                align-items:flex-end;
            }
            #tabTarifas #footerResumenTarifas .label{
                font-size:11px;
                font-weight:600;
                color:#389e0d;
                text-transform:uppercase;
                letter-spacing:.4px;
            }
            #tabTarifas #footerResumenTarifas .value{
                font-size:22px;
                line-height:1;
                font-weight:700;
                color:#1f1f1f;
            }
        `;

        $('<style>', { id: STYLE_ID, type: 'text/css' }).html(css).appendTo('head');
    } catch (error) {
        console.error(error);
    }
}

async function loadPolicy() {
    try {
        const result = await me.exe('RepoLifePolicy', {
            operation: 'GET',
            include: ["Insureds","Coverages"],
            filter: `id=${policyId}`,
            noTracking: true
        });
        policy = result.outData?.[0] || {};

        const formatoN2 = v =>
        (isNaN(v = Number((v || '').toString().replace(/[,\s]/g, ''))) ? 0 : v)
        .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
        const $txtSA = $("#txtSA");
        const currentSA = String($txtSA.val() ?? '').trim();
        const currentSANormalized = currentSA.replace(/[\s,]/g, '');
        const currentSAIsEmptyOrZero = currentSA === '' ||
            (currentSANormalized !== '' && Number(currentSANormalized) === 0);

        const polizaEmitida = esPolizaEmitidaCoberturas();

        // Solo cargar la suma de la póliza la primera vez, mientras se cotiza. Si el
        // campo ya contiene un valor distinto de vacío o cero, se debe respetar. En
        // una póliza emitida la suma de la póliza es el total de sus coberturas, no
        // el valor del vehículo, así que no se usa para completar este campo.
        if (currentSAIsEmptyOrZero && !polizaEmitida) {
            $txtSA.val(policy?.insuredSum || '0');
        }

        // La suma es editable mientras la póliza no esté emitida. Al emitirse queda
        // de solo lectura, nunca deshabilitada: un campo deshabilitado no se guarda
        // y el endoso de objeto asegurado dejaba vacío el valor del vehículo, con lo
        // que el siguiente endoso que recotiza ponía en 0 las coberturas que dependen
        // de él. bloquearCamposPolizaEmitida() la bloquea junto con el resto.
        $txtSA.prop('disabled', false).prop('readonly', polizaEmitida);
        
    } catch (error) {
        console.error(error);
    }
}

async function getProduct(lobCode, productCode) {
    const response = await me.exe('RepoProduct', {
        operation: 'GET',
        filter: "lobCode='" + vEqual(lobCode) + "' AND code='" + vEqual(productCode) + "'"
    });
    return (response && response.outData && response.outData.length > 0) ? response.outData[0] : {};
}

async function setConfigCoverages() {
    const tableNames = ['cfgCoberturaProductoReaAuto'];
    let tableConfig = { ok: false, outData: [] };

    for (let i = 0; i < tableNames.length; i++) {
        tableConfig = await me.exe('GetFullTable', { table: tableNames[i] });
        if (tableConfig && tableConfig.ok) {
            break;
        }
    }

    configCoverages = mapearTablaConfig((tableConfig && tableConfig.outData) ? tableConfig.outData : []);
    configCoverages = configCoverages.filter(function (x) {
        return vEqual(x.productCode) === vEqual(policy.productCode);
    });
}

function esPolizaEmitidaCoberturas() {
    const active = policy?.active;
    const activeDate = policy?.activeDate;
    const tieneFechaEmision = activeDate !== null
        && activeDate !== undefined
        && String(activeDate).trim() !== '';

    return tieneFechaEmision
        || active === true
        || active === 1
        || String(active).toLowerCase() === 'true'
        || String(active) === '1';
}

function bloquearCamposPolizaEmitida() {
    if (!polizaConfirmada) return;

    // Some generated fields are not marked with .ptab and remain outside the
    // custom tabs, so lock the owning form as well as the tariff container.
    const $form = $('#txtCertificado').closest('form');
    const $scope = $form.add('#tabTarifas');
    $scope.find('input:not([type="hidden"]), textarea')
        .prop('readonly', true)
        .attr('aria-readonly', 'true')
        .addClass('auto-issued-readonly');
    $scope.find('select, input[type="checkbox"], input[type="radio"]')
        .addClass('auto-issued-readonly')
        .attr('aria-disabled', 'true')
        .off('.autoIssuedReadonly')
        .on('mousedown.autoIssuedReadonly keydown.autoIssuedReadonly change.autoIssuedReadonly', function (event) {
            event.preventDefault();
            return false;
        });
    $('#btnGestionarCoberturas').prop('disabled', true);

    if (isEndorsment) {
        // En endoso se permite modificar los datos propios del vehículo. Algunos
        // formularios/versiones del objeto usan nombres distintos, por eso se
        // contemplan los identificadores conocidos y sus atributos equivalentes.
        const $editable = $scope.find([
            '#tbextras',
            '#txtColorAuto',
            '#tbplaca',
            '#cmbCombustibleAuto',
            '#cmbMarca',
            '#cmbModelo',
            '#tbVIN',
            '#tbseriechasis',
            '#tbseriemotor',
            '#tbnumprestamo',
            '#cmbUsoAuto',
            '#cmbtipo',
            '#txtTransmision',
            '#cmbCilindrosAuto'
        ].join(', '));
        $editable
            .prop('readonly', false)
            .prop('disabled', false)
            .removeClass('auto-issued-readonly')
            .removeAttr('aria-readonly aria-disabled')
            .off('.autoIssuedReadonly');
    }
}

async function setProductCoverages() {
    polizaConfirmada = esPolizaEmitidaCoberturas();
    const results = await Promise.all([
        getProduct(policy.lob, policy.productCode),
        setConfigCoverages()
    ]);
    const productJson = results[0];
    let product = {};

    try {
        product = productJson.configJson ? JSON.parse(productJson.configJson) : {};
    } catch (error) {
        product = {};
    }

    if (!product || !product.Coverages || !product.Coverages.length) {
        productCoverages = [];
        return;
    }

    productCoverages = product.Coverages.map(function (pc) {
        const polCob = (policy.Coverages || []).find(function (c) {
            return vEqual(c.code) === vEqual(pc.code);
        });
        const cfgCob = (configCoverages || []).find(function (c) {
            return vEqual(c.coverageCode) === vEqual(pc.code);
        });

        return {
            id: 0,
            lifePolicyId: policy.id,
            code: pc.code,
            name: pc.name || 'Cobertura desconocida',
            sumaAsegurada: polCob ? Number(polCob.limit || 0) : 0,
            prima: polCob ? Number(polCob.premium || 0) : 0,
            suma: cfgCob && vEqual(cfgCob.isCoverage) === 'SI' ? 'Si' : 'No',
            mandatory: pc.mandatory ? true : false,
            incluido: polCob ? true : false,
            limit: 0,
            deductible: 0,
            periodicity: 0,
            basePremium: 0,
            basic: pc.basic ? true : false,
            description: pc.description || 'Not Found',
            loading: 0,
            end: policy.end,
            start: policy.start,
            appliesTo: pc.appliesTo || 'INS',
            commercialName: pc.commercialName || 'Not Found',
            internalBonus: pc.internalBonus ? true : false,
            number: pc.number || 0,
            ofnCode: pc.ofnCode || 0,
            ofnGroup: pc.ofnGroup || 0,
            solvency2Code: pc.solvency2Code || null,
            startBasePremium: 0,
            startLimit: 0,
            parent: null,
            hasMaturity: false,
            extraPremium: 0,
            ignoreIndexation: false,
            internalPremium: 0,
            reStatus: 0,
            manualPremium: false,
            manualLimit: false,
            isInternal: false,
            baseLimit: 0,
            limitFactor: null,
            loadingInsuredSum: 0,
            reinsuranceCode: pc.reinsurance || null,
            parentPercentage: 0,
            coContractId: null,
            jCustom: null,
            jPremiumDetail: null,
            distributionMode: null
        };
    });
}

async function cargarCobtarDinamico() {
    try {
        inyectarEstilosAntdCobtar();
        await Promise.all([setProductCoverages(), listarCobtar()]);
        renderTablaAgrupada(configCobtar);
        cargarCobtarDesdeHidden('#hiddenCobtar', '#tabTarifas');
        bindEventosCobtar();
        setDefaultCobtar();
        renderToolbarCoberturas();
        renderFooterTarifas();
        actualizarResumenTarifas();
    } catch (error) {
        console.error(error);
    }
}

async function listarCobtar() {
    try {
        
        const tables = ['cfgCobtarAuto'];
        let tableCobtar = null;

        for (let i = 0; i < tables.length; i++) {
            tableCobtar = await me.exe('GetFullTable', { table: tables[i] });
            if (tableCobtar && tableCobtar.ok) {
                break;
            }
        }

        configCobtar = mapearTablaConfig((tableCobtar && tableCobtar.outData) ? tableCobtar.outData : []);
        configCobtar = configCobtar.filter(function (x) {
            return policy.Coverages && policy.Coverages.find(function (b) {
                return vEqual(b.code) === vEqual(x.coverageCode);
            }) && vEqual(x.productCode) === vEqual(policy.productCode);
        });
    } catch (error) {
        console.error(error);
    }
}

function mapearTablaConfig(data) {
    if (!data || !data.length) return [];
    const headersOriginal = data[0];
    const headers = [];
    const contador = {};

    headersOriginal.forEach(function (h) {
        const key = String(h || '').trim();
        if (contador[key]) {
            contador[key]++;
            headers.push(key + '_' + contador[key]);
        } else {
            contador[key] = 1;
            headers.push(key);
        }
    });

    return data.slice(1).map(function (row) {
        const obj = {};
        headers.forEach(function (col, i) {
            obj[col] = row[i];
        });
        return obj;
    });
}

function agruparData(data) {
    const grupos = {};

    $.each(data || [], function (_, item) {
        const key = item.productCode + '_' + item.coverageCode;
        if (!grupos[key]) {
            grupos[key] = {
                productCode: item.productCode,
                productName: item.productName,
                coverageCode: item.coverageCode,
                coverageName: item.coverageName,
                campos: []
            };
        }

        grupos[key].campos.push({
            name: item.name,
            description: item.description,
            type: item.type,
            catalog: item.catalog,
            readOnly: item.readOnly == 'true' ? true : false,
            required: item.required == 'true' ? true : false
        });
    });

    return Object.values(grupos);
}

function renderTablaAgrupada(data, containerSelector) {
    const selector = containerSelector || '#tabTarifas';
    const $container = $(selector);
    if (!$container.length) return;

    $container.find('.tabla-ant').remove();

    const grupos = agruparData(data);
    if (!grupos.length) return;

    const camposSet = new Set();
    grupos.forEach(function (g) {
        g.campos.forEach(function (c) {
            if (c.name && c.name !== 'none') {
                camposSet.add(c.name);
            }
        });
        g.mapa = {};
        g.campos.forEach(function (c) {
            g.mapa[c.name] = c;
        });
    });

    const columnas = Array.from(camposSet);
    const $table = $('<table>').addClass('tabla-ant');
    const $thead = $('<thead>');
    const $trHead = $('<tr>');
    $trHead.append('<th>Cobertura</th>');
    columnas.forEach(function (col) {
        $('<th>').text(col).appendTo($trHead);
    });
    $thead.append($trHead);
    $table.append($thead);

    const $tbody = $('<tbody>');
    grupos.forEach(function (g) {
        const $tr = $('<tr>');
        $('<td>').html('<div style="display:flex; flex-direction:column;"><span>' + g.coverageName + '</span><span style="font-size:12px; color:rgba(0,0,0,0.45);">Código: ' + g.coverageCode + '</span></div>').appendTo($tr);

        columnas.forEach(function (col) {
            const campo = g.mapa[col];
            const $td = $('<td>');
            if (campo) {
                const type = String(campo.type || '').toLowerCase();
                const desc = campo.description && campo.description !== 'none' ? campo.description : '';
                let $input;

                if (type === 'number') {
                    $input = $('<input>', { type: 'number' }).addClass('ant-input-custom');
                } else if (type === 'select') {
                    $input = $('<select>').addClass('ant-select-custom');
                    let options = [];
                    try {
                        const clean = String(campo.catalog || '')
                            .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
                            .replace(/'/g, '"');
                        options = JSON.parse(clean || '[]');
                    } catch (e) {
                        options = [];
                    }
                    $input.append('<option value="" selected disabled>Seleccione una opción</option>');
                    options.forEach(function (opt) {
                        $('<option>', { value: opt.code, text: opt.name }).appendTo($input);
                    });
                    $input.prop('selectedIndex', 0);
                } else if (type === 'date') {
                    $input = $('<input>', { type: 'date' }).addClass('ant-input-custom');
                } else {
                    $input = $('<input>', { type: 'text' }).addClass('ant-input-custom');
                }

                $input.attr({
                    'data-coverage': g.coverageCode,
                    'data-field': campo.name
                });

                if (!type || type === 'none' || !desc) {
                    $input.prop('disabled', true);
                }
                if (campo.readOnly === true) {
                    $input.prop('readonly', true);
                }
                if (campo.required === true) {
                    $input.prop('required', true);
                }
                if (desc) {
                    $input.attr('placeholder', desc);
                }

                $td.append($input);
            }
            $tr.append($td);
        });

        $tbody.append($tr);
    });

    $table.append($tbody);
    $container.append($table);
}

function cargarCobtarDesdeHidden(hiddenSelector, containerSelector) {
    const raw = $(hiddenSelector).val();
    if (!raw) return;

    let data = [];
    try {
        data = JSON.parse(raw);
    } catch (e) {
        console.error('JSON inválido en hiddenCobtar');
        return;
    }

    $.each(data, function (_, item) {
        const coverage = item.coverageCode;
        $.each(item, function (key, value) {
            if (key === 'coverageCode' || key === 'coverageName') return;
            const $input = $(containerSelector).find('[data-coverage="' + coverage + '"][data-field="' + key + '"]');
            if (!$input.length) return;
            $input.val(value == null ? '' : value).trigger('change');
        });
    });
}

function construirCobtar(containerSelector) {
    const resultado = {};
    $(containerSelector).find('input, select').each(function () {
        const $el = $(this);
        const coverage = $el.data('coverage');
        const field = $el.data('field');
        if (!coverage || !field) return;
        if (!resultado[coverage]) {
            resultado[coverage] = { coverageCode: coverage, coverageName: $el.data('coverage-name') };
        }
        let value = $el.val();
        if ($el.attr('type') === 'number') {
            value = value === '' ? null : Number(value);
        }
        resultado[coverage][field] = value;
    });
    return Object.values(resultado);
}

function bindEventosCobtar() {
    $('#tabTarifas').off('input change').on('input change', 'input, select', function () {
        const data = construirCobtar('#tabTarifas');
        $('#hiddenCobtar').val(JSON.stringify(data));
    });
}

function setDefaultCobtar() {
    if (!polizaConfirmada && $('#hiddenCobtar').val() === '') {
        const data = construirCobtar('#tabTarifas');
        $('#hiddenCobtar').val(JSON.stringify(data));
    }
}

function renderToolbarCoberturas() {
    try {
        const $tab = $('#tabTarifas');
        if (!$tab.length) return;

        $('#toolbarCoberturas').remove();

        const toolbarHtml = `
            <div id="toolbarCoberturas">
                <button type="button" id="btnGestionarCoberturas" class="ant-btn ant-btn-primary btn-gestionar-cob">
                    <span>Gestionar Coberturas</span>
                </button>
            </div>
        `;

        $tab.prepend(toolbarHtml);
        renderModalCoberturas();
    } catch (error) {
        console.error(error);
    }
}

function renderModalCoberturas() {
    try {
        $('#modalCoberturas').remove();

        const rows = (productCoverages || []).map(function (c) {
            return `
                <tr>
                    <td style="text-align:center;">
                        <input type="checkbox" class="chk-cobertura" value="${c.code}" data-mandatory="${c.mandatory}" data-incluido="${c.incluido}" ${c.mandatory || c.incluido ? 'checked' : ''} ${c.mandatory || polizaConfirmada ? 'disabled' : ''}/>
                    </td>
                    <td style="text-align:center;">${c.code}</td>
                    <td>${c.name}</td>
                    <td style="text-align:right;">${formatMoney(c.sumaAsegurada)}</td>
                    <td style="text-align:right;">${formatMoney(c.prima)}</td>
                    <td style="text-align:center;">${c.suma}</td>
                </tr>
            `;
        }).join('');

        const modalHtml = `
            <div id="modalCoberturas" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:99999;">
                <div style="width:900px; max-width:95%; background:#fff; border-radius:8px; overflow:hidden; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); box-shadow:0 10px 30px rgba(0,0,0,.2);">
                    <div style="height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 20px; border-bottom:1px solid #f0f0f0; font-size:16px; font-weight:600;">
                        <span>Gestión de Coberturas</span>
                        <button type="button" id="btnCerrarModalCob" style="border:none; background:none; font-size:24px; cursor:pointer;">×</button>
                    </div>
                    <div style="padding:16px; max-height:500px; overflow:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:14px;">
                            <thead>
                                <tr style="background:#fafafa;">
                                    <th style="width:40px; text-align:center; padding:10px; border-bottom:1px solid #f0f0f0;">
                                        <input type="checkbox" id="chkAllCoberturas" ${polizaConfirmada ? 'disabled' : ''}/>
                                    </th>
                                    <th style="text-align:center; padding:10px; border-bottom:1px solid #f0f0f0;">Código</th>
                                    <th style="text-align:left; padding:10px; border-bottom:1px solid #f0f0f0;">Nombre</th>
                                    <th style="text-align:right; padding:10px; border-bottom:1px solid #f0f0f0;">Suma Asegurada</th>
                                    <th style="text-align:right; padding:10px; border-bottom:1px solid #f0f0f0;">Prima</th>
                                    <th style="text-align:center; padding:10px; border-bottom:1px solid #f0f0f0;">¿Suma?</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                    <div style="padding:16px; border-top:1px solid #f0f0f0; display:flex; justify-content:flex-end;">
                        <button type="button" id="btnGuardarCoberturas" class="ant-btn ant-btn-primary"><span>Guardar</span></button>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHtml);

        if (polizaConfirmada) {
            $('#btnGuardarCoberturas').prop('disabled', true);
        }

    } catch (error) {
        console.error(error);
    }
}

function buildLifeCoverageInsert(coberturasSeleccionadas) {
    const cols = [
        'lifePolicyId','code','name','limit','deductible','periodicity','basePremium','extraPremium','basic','description',
        'loading','start','end','appliesTo','commercialName','internalBonus','number','ofnCode','ofnGroup','solvency2Code',
        'startBasePremium','startLimit','parent','hasMaturity','ignoreIndexation','internalPremium','reStatus','manualPremium',
        'manualLimit','isInternal','baseLimit','limitFactor','loadingInsuredSum','reinsuranceCode','parentPercentage','coContractId',
        'jCustom','jPremiumDetail','distributionMode'
    ];

    function esc(v) { return String(v == null ? '' : v).replace(/'/g, "''"); }
    function fmt(v, key) {
        if (v === null || v === undefined) return 'NULL';
        if (key === 'basic' || key === 'internalBonus' || key === 'hasMaturity' || key === 'ignoreIndexation' || key === 'manualPremium' || key === 'manualLimit' || key === 'isInternal') {
            return v ? 1 : 0;
        }
        if (['lifePolicyId','limit','deductible','periodicity','basePremium','extraPremium','loading','number','ofnCode','ofnGroup','startBasePremium','startLimit','internalPremium','reStatus','baseLimit','loadingInsuredSum','parentPercentage'].indexOf(key) >= 0) {
            return isNaN(v) ? 'NULL' : Number(v);
        }
        if (key === 'start' || key === 'end') return "'" + new Date(v).toISOString() + "'";
        return "'" + esc(v) + "'";
    }

    const valuesSql = (coberturasSeleccionadas || []).map(function (row) {
        return '(' + cols.map(function (col) { return fmt(row[col], col); }).join(', ') + ')';
    }).join(',\n');

    return 'INSERT INTO [lifeCoverage] (' + cols.map(function (c) { return '[' + c + ']'; }).join(', ') + ')\nVALUES\n' + valuesSql + ';';
}

function confirmCoberturas() {
    return new Promise(function (resolve) {
        $('#modalConfirmCoberturas').remove();
        const html = `
            <div id="modalConfirmCoberturas" style="display:block; position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:999999999;">
                <div style="width:420px; max-width:92%; background:#fff; border-radius:8px; overflow:hidden; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); box-shadow:0 6px 20px rgba(0,0,0,.18);">
                    <div style="padding:14px 18px; font-weight:600;">Confirmar cambios</div>
                    <div style="padding:18px;">Al guardar se modificarán coberturas y será necesario cotizar nuevamente.<br><br>¿Desea continuar?</div>
                    <div style="padding:12px 18px; display:flex; justify-content:flex-end; gap:8px;">
                        <button id="btnCancelConfirmCob" class="ant-btn">No</button>
                        <button id="btnOkConfirmCob" class="ant-btn ant-btn-primary">Sí, continuar</button>
                    </div>
                </div>
            </div>
        `;
        $('body').append(html);
        $('#modalConfirmCoberturas').off('click', '#btnCancelConfirmCob').on('click', '#btnCancelConfirmCob', function () {
            $('#modalConfirmCoberturas').remove();
            resolve(false);
        });
        $('#modalConfirmCoberturas').off('click', '#btnOkConfirmCob').on('click', '#btnOkConfirmCob', function () {
            $('#modalConfirmCoberturas').remove();
            resolve(true);
        });
    });
}

function renderFooterTarifas() {
    $('#footerResumenTarifas').remove();
    const html = `
        <div id="footerResumenTarifas">
            <div class="footer-success-icon"></div>
            <div class="footer-tarifas-item">
                <span class="label">Suma Total</span>
                <span class="value" id="lblSumaTotalTarifas">0.00</span>
            </div>
            <div class="footer-tarifas-item">
                <span class="label">Prima Total</span>
                <span class="value" id="lblPrimaTotalTarifas">0.00</span>
            </div>
        </div>
    `;
    $('#tabTarifas').append(html);
}

function actualizarResumenTarifas() {
    let sumaTotal = 0;
    let primaTotal = 0;
    (policy.Coverages || []).forEach(function (pc) {
        const cfgCob = (configCoverages || []).find(function (c) {
            return vEqual(c.coverageCode) === vEqual(pc.code);
        });
        if (cfgCob && vEqual(cfgCob.isCoverage) === 'SI') {
            sumaTotal += Number(pc.limit || 0);
        }
        primaTotal += Number(pc.premium || 0);
    });

    $('#lblSumaTotalTarifas').text(formatMoney(sumaTotal));
    $('#lblPrimaTotalTarifas').text(formatMoney(primaTotal));
}

function renderFormPrincipal() {
    const root = document.getElementById('app') || document.body;
    const btn = root.querySelector('.anticon.anticon-reload') ? root.querySelector('.anticon.anticon-reload').closest('button') : null;
    if (btn) btn.click();
}

$(document).on('click', '#btnGestionarCoberturas', function () {
    $('#modalCoberturas').show();
});

$(document).on('click', '#btnCerrarModalCob', function () {
    $('#modalCoberturas').hide();
});

$(document).on('click', '#modalCoberturas', function (e) {
    if ($(e.target).attr('id') === 'modalCoberturas') {
        $('#modalCoberturas').hide();
    }
});

$(document).on('change', '#chkAllCoberturas', function () {
    const checked = $(this).is(':checked');
    $('.chk-cobertura').not("[data-mandatory='true']").prop('checked', checked);
});

$(document).on('click', '#btnGuardarCoberturas', async function () {
    coberturasSeleccionadas = (productCoverages || []).filter(function (c) {
        const $chk = $('.chk-cobertura[value="' + c.code + '"]');
        const isChecked = $chk.is(':checked');
        return c.mandatory || isChecked;
    });

    if (!coberturasSeleccionadas.length) {
        me.message.warning('Debe seleccionar al menos una cobertura');
        return;
    }

    const ok = await confirmCoberturas();
    if (!ok) return;

    try {
        const query = buildLifeCoverageInsert(coberturasSeleccionadas);
        const resultado = await me.exe('DoQuery', { sql: 'DELETE LifeCoverage WHERE lifePolicyId = ' + policy.id + '; ' + query });
        if (!resultado || !resultado.ok) {
            me.message.error('Error guardando coberturas: ' + (resultado ? resultado.msg : 'sin detalle'));
            return;
        }

        me.message.success('Coberturas guardadas correctamente (' + coberturasSeleccionadas.length + ')', 5);
        $('#modalCoberturas').hide();

        await loadPolicy();
        await cargarCobtarDinamico();
        renderFormPrincipal();
    } catch (e) {
        console.error(e);
        me.message.error('Error al guardar coberturas, contacte a sistemas.');
    }
});

$(document).on("change", "#cmbNoTieneVIN", function () {
  try {
    const $tbVIN = getVINField();
    if (!$tbVIN.length) {
      return;
    }

    const choice = String($(this).val() || '').trim().toLowerCase();
    if (choice === 'si') {
      $tbVIN.val('');
    }

    syncVINSelectState();
  } catch (error) {
    console.error(`Error cambiando estado de VIN: ${error.toString()}`);
  }
});

$(document).on("input change", "#tbVIN", function () {
  syncVINSelectState();
});

function syncVINSelectWhenReady() {
  let tries = 0;
  const timer = setInterval(function () {
    ensureVINSelect();
    syncVINSelectState();

    if (tries >= 20) {
      clearInterval(timer);
      return;
    }

    const hasVINControl = $('#tbVIN').length && $('#cmbNoTieneVIN').length;
    if (hasVINControl) {
      clearInterval(timer);
      return;
    }

    tries += 1;
  }, 250);

  if (window.__vinSelectObserver) {
    window.__vinSelectObserver.disconnect();
  }

  window.__vinSelectObserver = new MutationObserver(function () {
    ensureVINSelect();
    syncVINSelectState();
  });

  window.__vinSelectObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}


//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// MSN-000209: Marca y Modelo en orden alfabético y con búsqueda al escribir.
// El select original sigue siendo el campo que se guarda y se valida (código).
// Mientras se puede editar queda oculto y en su lugar hay un cuadro de texto:
// al escribir se filtra la lista por cualquier parte del nombre, sin distinguir
// mayúsculas ni acentos, y sólo se acepta un valor de la lista. Un clic en el
// campo muestra la lista completa y la "x" limpia el valor. Si el select está
// bloqueado (póliza emitida, endoso) se muestra el select de siempre.
//////////////////////////////////////////////////////////////////////////////

function ordenarPorNombre(filas, indexDisplay) {
    const orden = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
    const nombre = function (fila) {
        return String(fila && fila[indexDisplay] !== undefined && fila[indexDisplay] !== null ? fila[indexDisplay] : '').trim();
    };
    return filas.slice().sort(function (a, b) { return orden.compare(nombre(a), nombre(b)); });
}

function normalizarTextoBusqueda(texto) {
    return String(texto === undefined || texto === null ? '' : texto)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/\s+/g, ' ').trim();
}

function coincideBusqueda(texto, consulta) {
    const nombre = normalizarTextoBusqueda(texto);
    return normalizarTextoBusqueda(consulta).split(' ').filter(Boolean).every(function (palabra) {
        return nombre.indexOf(palabra) !== -1;
    });
}

function instalarEstilosBuscadorLista() {
    const STYLE_ID = 'msn209-buscador-lista';
    if (document.getElementById(STYLE_ID)) return;
    const css = `
        .msn209-buscador { position: relative; display: block; width: 100% !important; max-width: 100%; box-sizing: border-box; margin: 0; }
        .msn209-buscador .msn209-texto { display: block; width: 100% !important; max-width: 100%; box-sizing: border-box; padding-right: 52px !important; text-overflow: ellipsis; margin: 0; }
        .msn209-buscador .msn209-limpiar { position: absolute; right: 26px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: rgba(0,0,0,.45); cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 4px; }
        .msn209-buscador .msn209-limpiar:hover { color: rgba(0,0,0,.85); }
        .msn209-buscador .msn209-flecha { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: rgba(0,0,0,.45); font-size: 10px; pointer-events: none; }
        select.msn209-oculto { display: none !important; }
        .msn209-lista { position: fixed; z-index: 2000; box-sizing: border-box; overflow-y: auto; padding: 4px 0; background: #fff; border-radius: 6px; font-size: 14px;
            box-shadow: 0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05); }
        .msn209-lista .msn209-opcion { padding: 5px 12px; line-height: 22px; cursor: pointer; color: rgba(0,0,0,.85); }
        .msn209-lista .msn209-opcion.msn209-activa { background: #f5f5f5; }
        .msn209-lista .msn209-opcion.msn209-elegida { background: #e6f7ff; font-weight: 600; }
        .msn209-lista .msn209-opcion.msn209-elegida.msn209-activa { background: #bae7ff; }
        .msn209-lista .msn209-sin-opciones { padding: 5px 12px; line-height: 22px; color: rgba(0,0,0,.45); cursor: default; }
    `;
    $('<style>', { id: STYLE_ID, type: 'text/css' }).html(css).appendTo('head');
}

function activarBuscadorDeLista(selector, opciones) {
    try {
        const select = $(selector)[0];
        if (!select || select.tagName !== 'SELECT' || select.multiple) return;
        if (select.getAttribute('data-msn209') === '1') return;
        select.setAttribute('data-msn209', '1');
        instalarEstilosBuscadorLista();

        const cfg = opciones || {};
        const texto = function (valor) { return typeof valor === 'function' ? String(valor() || '') : String(valor || ''); };
        const clave = select.id || select.name || 'lista';

        const caja = document.createElement('div');
        caja.className = 'msn209-buscador';
        const entrada = document.createElement('input');
        entrada.type = 'text';
        // Mantener las mismas clases visuales de los campos normales del objeto
        // asegurado, por ejemplo tbseriemotor: ant-input ptab.
        entrada.className = 'ant-input ptab msn209-texto';
        entrada.placeholder = texto(cfg.ayuda) || 'Escriba para buscar';
        entrada.setAttribute('autocomplete', 'off');
        entrada.setAttribute('role', 'combobox');
        entrada.setAttribute('aria-autocomplete', 'list');
        entrada.setAttribute('aria-expanded', 'false');
        entrada.setAttribute('data-msn209-campo', clave);
        const limpiar = document.createElement('button');
        limpiar.type = 'button';
        limpiar.className = 'msn209-limpiar';
        limpiar.tabIndex = -1;
        limpiar.title = 'Limpiar y ver toda la lista';
        limpiar.setAttribute('aria-label', limpiar.title);
        limpiar.textContent = '\u00d7';
        const flecha = document.createElement('span');
        flecha.className = 'msn209-flecha';
        flecha.setAttribute('aria-hidden', 'true');
        flecha.textContent = '\u25bc';
        caja.appendChild(entrada);
        caja.appendChild(limpiar);
        caja.appendChild(flecha);
        select.parentNode.insertBefore(caja, select.nextSibling);

        let lista = null;
        let visibles = [];
        let activa = -1;
        let consulta = '';
        let firma = '';
        let cambiosDeOpciones = 0;
        let seleccionarAlSoltar = false;
        let navegoConTeclado = false;

        const bloqueado = function () {
            return select.disabled
                || select.getAttribute('aria-disabled') === 'true'
                || $(select).hasClass('auto-issued-readonly')
                || $(select).closest('fieldset[disabled], .disabled').length > 0;
        };
        const opcionesReales = function () {
            return Array.prototype.filter.call(select.options, function (o) { return o.value !== '' && !o.disabled; });
        };
        const cargando = function () { return typeof cfg.cargando === 'function' && !!cfg.cargando(); };
        const elegida = function () {
            const o = select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
            return o && o.value !== '' ? o : null;
        };
        const etiqueta = function () {
            const o = elegida();
            return o ? o.text : '';
        };
        const avisar = function () {
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const actualizarValidez = function () {
            const falta = select.required && !bloqueado() && !elegida();
            entrada.setCustomValidity(falta ? (texto(cfg.obligatorio) || 'Seleccione un valor de la lista.') : '');
        };

        const marcarActiva = function (indice) {
            activa = indice;
            if (!lista) return;
            Array.prototype.forEach.call(lista.children, function (nodo) {
                nodo.classList.toggle('msn209-activa', Number(nodo.getAttribute('data-i')) === activa);
            });
            const nodo = lista.querySelector('[data-i="' + activa + '"]');
            if (!nodo) {
                entrada.removeAttribute('aria-activedescendant');
                return;
            }
            entrada.setAttribute('aria-activedescendant', nodo.id);
            const arriba = nodo.offsetTop;
            const abajo = arriba + nodo.offsetHeight;
            if (arriba < lista.scrollTop) lista.scrollTop = arriba;
            else if (abajo > lista.scrollTop + lista.clientHeight) lista.scrollTop = abajo - lista.clientHeight;
        };

        const cerrar = function () {
            if (lista && lista.parentNode) lista.parentNode.removeChild(lista);
            lista = null;
            visibles = [];
            activa = -1;
            navegoConTeclado = false;
            entrada.setAttribute('aria-expanded', 'false');
            entrada.removeAttribute('aria-activedescendant');
        };

        const posicionar = function () {
            if (!lista) return;
            const r = entrada.getBoundingClientRect();
            const altoVentana = window.innerHeight;
            const anchoVentana = window.innerWidth;
            if (!r.width || r.bottom < 0 || r.top > altoVentana) {
                cerrar();
                return;
            }
            const libreAbajo = altoVentana - r.bottom - 8;
            const libreArriba = r.top - 8;
            lista.style.width = Math.round(r.width) + 'px';
            lista.style.left = Math.round(Math.max(4, Math.min(r.left, anchoVentana - r.width - 4))) + 'px';
            lista.style.maxHeight = '264px';
            const natural = Math.min(lista.scrollHeight, 264);
            const haciaAbajo = libreAbajo >= natural || libreAbajo >= libreArriba;
            const maximo = Math.max(80, Math.min(264, haciaAbajo ? libreAbajo : libreArriba));
            lista.style.maxHeight = maximo + 'px';
            lista.style.top = Math.round(haciaAbajo ? r.bottom + 2 : Math.max(4, r.top - 2 - Math.min(natural, maximo))) + 'px';
        };

        const pintar = function () {
            if (!lista) return;
            const actual = elegida();
            visibles = consulta.trim()
                ? opcionesReales().filter(function (o) { return coincideBusqueda(o.text, consulta); })
                : opcionesReales();
            lista.textContent = '';
            if (!visibles.length) {
                const vacio = document.createElement('div');
                vacio.className = 'msn209-sin-opciones';
                vacio.textContent = cargando() ? 'Cargando...'
                    : consulta.trim() ? 'Sin coincidencias para "' + consulta.trim() + '"'
                    : (texto(cfg.vacio) || 'No hay opciones para elegir.');
                lista.appendChild(vacio);
            }
            const fragmento = document.createDocumentFragment();
            visibles.forEach(function (o, i) {
                const nodo = document.createElement('div');
                nodo.className = 'msn209-opcion' + (o === actual ? ' msn209-elegida' : '');
                nodo.id = 'msn209-' + clave + '-' + i;
                nodo.setAttribute('role', 'option');
                nodo.setAttribute('aria-selected', o === actual ? 'true' : 'false');
                nodo.setAttribute('data-i', String(i));
                nodo.textContent = o.text;
                fragmento.appendChild(nodo);
            });
            lista.appendChild(fragmento);
            posicionar();
            if (activa >= visibles.length) activa = visibles.length - 1;
            marcarActiva(activa);
        };

        const elegir = function (o) {
            if (!o || bloqueado()) return;
            const cambia = select.selectedIndex !== o.index;
            o.selected = true;
            consulta = '';
            entrada.value = o.text;
            cerrar();
            if (cambia) avisar();
            if (document.activeElement === entrada) entrada.select();
            sincronizar();
        };

        const abrir = function () {
            if (bloqueado()) return;
            if (lista) {
                pintar();
                return;
            }
            lista = document.createElement('div');
            lista.className = 'msn209-lista';
            lista.id = 'msn209-lista-' + clave;
            lista.setAttribute('role', 'listbox');
            lista.addEventListener('mousedown', function (e) { e.preventDefault(); });
            lista.addEventListener('click', function (e) {
                const nodo = e.target && e.target.closest ? e.target.closest('.msn209-opcion') : null;
                if (nodo) elegir(visibles[Number(nodo.getAttribute('data-i'))]);
            });
            lista.addEventListener('mousemove', function (e) {
                const nodo = e.target && e.target.closest ? e.target.closest('.msn209-opcion') : null;
                if (nodo && Number(nodo.getAttribute('data-i')) !== activa) marcarActiva(Number(nodo.getAttribute('data-i')));
            });
            document.body.appendChild(lista);
            entrada.setAttribute('aria-expanded', 'true');
            entrada.setAttribute('aria-controls', lista.id);
            activa = -1;
            pintar();
            if (!consulta.trim() && elegida()) marcarActiva(visibles.indexOf(elegida()));
        };

        // Al salir del campo sólo queda un valor de la lista: el que coincide
        // exactamente o el único que cumple lo escrito; si no, el que ya estaba.
        const conciliar = function () {
            const escrito = normalizarTextoBusqueda(entrada.value);
            if (escrito && escrito !== normalizarTextoBusqueda(etiqueta())) {
                const todas = opcionesReales();
                const exactas = todas.filter(function (o) { return normalizarTextoBusqueda(o.text) === escrito; });
                const candidatas = exactas.length ? exactas : todas.filter(function (o) { return coincideBusqueda(o.text, escrito); });
                if (candidatas.length === 1) {
                    elegir(candidatas[0]);
                    return;
                }
            }
            consulta = '';
            entrada.value = etiqueta();
            actualizarValidez();
        };

        const sincronizar = function () {
            if (!document.body.contains(select)) {
                detener();
                return;
            }
            const quieto = bloqueado();
            select.classList.toggle('msn209-oculto', !quieto);
            caja.style.display = quieto ? 'none' : '';
            if (quieto && lista) cerrar();
            const enUso = document.activeElement === entrada;
            const nueva = cambiosDeOpciones + '|' + select.options.length + '|' + select.selectedIndex + '|' + etiqueta() + '|' + quieto + '|' + cargando();
            if (nueva !== firma) {
                firma = nueva;
                entrada.title = etiqueta();
                if (lista) pintar();
            }
            if (!enUso && entrada.value !== etiqueta()) entrada.value = etiqueta();
            limpiar.style.display = !quieto && (entrada.value || elegida()) ? '' : 'none';
            actualizarValidez();
        };

        // Un clic que abre la lista empieza una búsqueda nueva: muestra todo y lo
        // que se escriba reemplaza el texto. Con la lista abierta, el clic sólo
        // ubica el cursor dentro de lo escrito.
        entrada.addEventListener('mousedown', function () {
            if (bloqueado()) return;
            if (document.activeElement !== entrada || !lista) seleccionarAlSoltar = true;
            if (!lista) {
                consulta = '';
                abrir();
            }
        });
        entrada.addEventListener('mouseup', function (e) {
            if (!seleccionarAlSoltar) return;
            seleccionarAlSoltar = false;
            e.preventDefault();
            entrada.select();
        });
        entrada.addEventListener('focus', function () {
            if (!bloqueado()) entrada.select();
        });
        entrada.addEventListener('blur', function () {
            seleccionarAlSoltar = false;
            conciliar();
            cerrar();
            sincronizar();
        });
        entrada.addEventListener('input', function () {
            if (bloqueado()) return;
            consulta = entrada.value;
            navegoConTeclado = false;
            if (!lista) abrir();
            else pintar();
            marcarActiva(visibles.length ? 0 : -1);
            limpiar.style.display = entrada.value || elegida() ? '' : 'none';
        });
        entrada.addEventListener('keydown', function (e) {
            if (bloqueado()) return;
            const tecla = e.key;
            if (tecla === 'ArrowDown' || tecla === 'ArrowUp' || tecla === 'PageDown' || tecla === 'PageUp') {
                e.preventDefault();
                if (!lista) {
                    consulta = '';
                    abrir();
                    if (activa < 0 && visibles.length) marcarActiva(0);
                    return;
                }
                if (!visibles.length) return;
                const paso = tecla === 'ArrowDown' ? 1 : tecla === 'ArrowUp' ? -1 : tecla === 'PageDown' ? 8 : -8;
                marcarActiva(Math.max(0, Math.min(visibles.length - 1, (activa < 0 ? (paso > 0 ? -1 : visibles.length) : activa) + paso)));
                navegoConTeclado = true;
            } else if (tecla === 'Tab') {
                // Tab elige la opción a la que se llegó con las flechas; si no, al salir se concilia.
                if (lista && navegoConTeclado && activa >= 0) elegir(visibles[activa]);
            } else if (tecla === 'Enter') {
                e.preventDefault();
                if (lista && activa >= 0) elegir(visibles[activa]);
                else if (!lista) abrir();
            } else if (tecla === 'Escape' && lista) {
                e.preventDefault();
                e.stopPropagation();
                cerrar();
                consulta = '';
                entrada.value = etiqueta();
                entrada.select();
            }
        });

        limpiar.addEventListener('mousedown', function (e) { e.preventDefault(); });
        limpiar.addEventListener('click', function (e) {
            e.preventDefault();
            if (bloqueado()) return;
            const habia = !!elegida();
            const vacia = Array.prototype.find.call(select.options, function (o) { return o.value === ''; });
            if (vacia) vacia.selected = true;
            else select.selectedIndex = -1;
            consulta = '';
            entrada.value = '';
            if (habia) avisar();
            if (document.activeElement !== entrada) entrada.focus();
            abrir();
            sincronizar();
        });

        if (select.id) {
            $('label[for="' + select.id + '"]').off('click.msn209').on('click.msn209', function (e) {
                if (bloqueado()) return;
                e.preventDefault();
                entrada.focus();
            });
        }

        const observador = new MutationObserver(function () { cambiosDeOpciones += 1; });
        observador.observe(select, { childList: true });
        const alDesplazar = function (e) {
            if (lista && e.target !== lista) posicionar();
        };
        const temporizador = setInterval(sincronizar, 250);
        const detener = function () {
            clearInterval(temporizador);
            observador.disconnect();
            window.removeEventListener('scroll', alDesplazar, true);
            window.removeEventListener('resize', posicionar);
            cerrar();
            if (caja.parentNode) caja.parentNode.removeChild(caja);
        };
        window.addEventListener('scroll', alDesplazar, true);
        window.addEventListener('resize', posicionar);
        sincronizar();
    } catch (error) {
        console.error(`Error activando la búsqueda en ${selector}: ${error.toString()}`);
    }
}
