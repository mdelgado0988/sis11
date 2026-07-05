/*
Name: frmDTIncendio
Author: Michael Delgado
Description: Formulario generico
Categpry: FORM
Version: 1.00
CreateDate: 05-07-2026
*/
const me = this;    
const policyId = window.location.href.split('/')[5] || 3374;
let policy = {};
let configCobtar = [];
let configCoverages = [];
let productCoverages = [];
let coberturasSeleccionadas = [];
let polizaConfirmada = false;

const changeMarca = async () => {
  try {
     const Modelo = $("#cmbModelo").val();
     const Marca = $("#cmbMarca").val();
      debugger;
     await loadDataTableModelo({reference:'#cmbModelo',tableName:'TablaModelos',indexCode:1,indexDisplay:2,indexMarca:0,valMarca:Marca});
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
      $tbVIN.prop('disabled', noTieneVIN);
      $tbVIN.prop('required', !noTieneVIN);
      $tbVIN.attr('aria-required', noTieneVIN ? 'false' : 'true');
      $tbVIN.toggleClass('vin-optional', noTieneVIN);
      $vinWrapper.toggleClass('vin-no-required', noTieneVIN);
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


const onDocumentReady = async() => {
  
    prepareTabContainer();
    moveFieldsToTabHome();

    await loadPolicy();

    $("#cmbMarca").on("change", changeMarca);
    // Keep the certificate field read-only at all times.
    $("#txtCertificado").prop("readonly", true);
    await loadDataTable({reference:'#cmbMarca',tableName:'TablaMarcas',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#cmbtipo',tableName:'tblTipoPorRamo',indexCode:0,indexDisplay:2});
    await loadDataTable({reference:'#cmbUsoAuto',tableName:'tblUsoPorRamo',indexCode:1,indexDisplay:2});
    await cargarCobtarDinamico();
    validaInputs();
    injectVINStyle();
    ensureVINSelect();
    syncVINSelectState();
    syncVINSelectWhenReady();

}

//////////////////////////////////////////////////////////////////////////////
// Carga de catálogos
//////////////////////////////////////////////////////////////////////////////

async function loadDataTable ({
    reference,
    tableName,
    indexCode,
    indexDisplay,
}) {
    $(reference).empty().append('<option value="">Seleccione una opción</option>');;
    const result = await me.exe("GetFullTable", { table: tableName });
    const data = result.outData && result.outData.length > 0 ? result.outData : [];
    data.splice(0, 1);
    data.forEach(item => {
        $(reference).append('<option value="' + item[indexCode] + '">' + item[indexDisplay] + '</option>');
    });

    const dataValue = $(reference).attr('user-data');
    if(!!dataValue){
        $(reference).val(dataValue);
    }
    return data;
}

async function loadDataTableModelo ({
    reference,
    tableName,
    indexCode,
    indexDisplay,
    indexMarca,
    valMarca
}) {
    $(reference).empty().append('<option value="">Seleccione una opción</option>');;
    const result = await me.exe("GetFullTable", { table: tableName });
    const data = result.outData && result.outData.length > 0 ? result.outData : [];
  
    data.splice(0, 1);
    data.forEach(item => {
      if (valMarca == item[indexCode]){
        $(reference).append('<option value="' + item[indexCode] + '">' + item[indexDisplay] + '</option>');
      }
    });

    const dataValue = $(reference).attr('user-data');
    if(!!dataValue){
        $(reference).val(dataValue);
    }
    return data;
}

//////////////////////////////////////////////////////////////////////////////
// Principal function to load data
//////////////////////////////////////////////////////////////////////////////

$(document)
    .promise()
    .then(setTimeout(onDocumentReady, 1000));

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
            #tabTarifas .readonly-style {
                background-color: #f5f5f5 !important;
                color: #666 !important;
                border: 1px solid #d9d9d9 !important;
                pointer-events: none;
                opacity: 1 !important;
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
        const result = await me.exe('LoadEntity', {
            entity: 'LifePolicy',
            fields: '[id],[lob],[productCode],[insuredSum],[start],[end],[active]',
            filter: 'id=' + policyId,
            noTracking: true
        });

        policy = (result && result.outData) ? result.outData : {};
        if ($.isArray(policy)) {
            policy = policy[0] || {};
        }
        polizaConfirmada = policy && policy.active ? true : false;

        const coverages = await me.exe('LoadEntities', {
            entity: 'LifeCoverage',
            fields: 'code,name,basic,[start],[end],limit,premium,mandatory,description,reinsurance,commercialName,appliesTo,number',
            filter: 'lifePolicyId=' + policyId,
            noTracking: true
        });

        policy.Coverages = (coverages && coverages.outData) ? coverages.outData : [];
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
    const tableNames = ['cfgCobtarAuto', 'cfgCobtarVida', 'cfgCobtar'];
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

async function setProductCoverages() {
    const productJson = await getProduct(policy.lob, policy.productCode);
    let product = {};

    try {
        product = productJson.configJson ? JSON.parse(productJson.configJson) : {};
    } catch (error) {
        product = {};
    }

    await setConfigCoverages();

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
        await setProductCoverages();
        await listarCobtar();
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
    if ($('#hiddenCobtar').val() === '') {
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
