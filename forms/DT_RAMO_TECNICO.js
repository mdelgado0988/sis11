/*
Name: DT_RAMO_TECNICO
Author: Michael Delgado
Description: Formulario generico
Categpry: FORM
Version: 1.0
CreateDate: 01-05-2025
*/

var me = this;
let configCobtar;
let policy;
let policyId = window.location.href.split('/')[5] ?? 3377;
let contact;
let polizaConfirmada = false;

const requiredData = [
    { productCode: "MQ", fields: ["cmbCategoria"] }
]

const cobtarVida = [{ lob: 96, cobtar: "cfgCobtarRamoTecnico"  }, { lob: 52, cobtar: "cfgCobtarRiesgosVarios"  }]

//////////////////////////////////////////////
// Catalogos
//////////////////////////////////////////////

async function cargarCatalogos() {
    await loadTableQuery({reference:'#cmbPais',tableCommand:'RepoCountryCatalog',filter:`[code]='591'`});
    await loadDataTable({reference:'#cmbActividadEconomica',tableName:'actividad',indexCode:0,indexDisplay:1, filterFunction: item => item[3] == "3"});
    await loadDataTable({reference:'#cmbZonaCresta',tableName:'ZonaCresta',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#cmbUsoBien',tableName:'TablaUsoBien',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#cmbMarca',tableName:'tbMarcas',indexCode:1,indexDisplay:2, filterFunction: item => item[3] == "1", sortFunction: (a, b) => a[2].localeCompare(b[2])});
    await loadDataTable({reference:'#cmbCategoria',tableName:'tbCategoriaMaquinaria',indexCode:0,indexDisplay:1});
    $("#cmbProvincia").empty().append('<option value="" selected disabled>Seleccione una opción</option>');
    $("#cmbProvincia").prop("selectedIndex", 0);
    loadEventField();
}

async function loadDataTable({
    reference,
    tableName,
    indexCode,
    indexDisplay,
    filterFunction = () => true,
    sortFunction = null,
    mapFunction = (item) => item
}) {

    $(reference)
        .empty()
        .append('<option value="" selected disabled>Seleccione una opción</option>');

    $(reference).attr('placeholder', 'Procesando...');

    const result = await me.exe("GetFullTable", { table: tableName });

    let data = result.outData?.length
        ? result.outData
        : [];

    data.splice(0, 1);

    data = data.filter(filterFunction);

    if (sortFunction)
        data = data.sort(sortFunction);

    data
        .map(mapFunction)
        .forEach(item => {

            let extraAttributes = '';

            if (tableName.toUpperCase() === 'ACTIVIDAD') {

                extraAttributes = `
                    data-categoria="${item[3] || ''}"
                `;
            }

            $(reference).append(`
                <option
                    value="${item[indexCode]?.trim() || ''}"
                    ${extraAttributes}
                >
                    ${item[indexDisplay]?.trim() || ''}
                </option>
            `);
        });

    $(reference).prop("selectedIndex", 0);

    $(reference).attr(
        'placeholder',
        data.length > 0
            ? 'Seleccione una opción'
            : '0 registros cargados'
    );

    const dataValue = $(reference).attr('user-data');

    if (dataValue) {
        $(reference).val(dataValue.trim());
    }

    return data;
}

async function loadTableQuery ({
    reference,
    tableCommand,
    filter,
}) {

    $(reference).empty().append('<option value="" selected disabled>Seleccione una opción</option>');
    $(reference).attr('placeholder', 'Procesando...');

    const result = await me.exe(tableCommand,{
        operation:'GET',
        filter: filter
    });

    const data = result.outData && result.outData.length > 0 ? result.outData : [];    

    data.forEach(item => {
        $(reference).append(`<option value='${item.code}' data-risk-zone="${item.riskZone}">${item.name}</option>`);
    });

    const dataValue = $(reference).attr('user-data');
    if(!!dataValue){
        $(reference).val(dataValue);
    }

    $(reference).prop("selectedIndex", 0);

    if (data?.length > 0)
        $(reference).attr('placeholder', 'Seleccione un edificio');
    else
        $(reference).attr('placeholder', '0 Edificios cargados');

}

const loadEventField = async () => {
    $("#cmbPais").off("change").on("change", changeCountry);
    $("#cmbProvincia").off("change").on("change", changeProvincia);   
    $("#cmbMarca").off("change").on("change", changeMarca);   
};

const changeCountry = async () => {
    const countryCode = $("#cmbPais").val();
    await loadTableQuery({reference:'#cmbProvincia',tableCommand:'RepoStateCatalog',filter:`[countryCode]='${countryCode}'`});
};

const changeProvincia = async () => {
  try {

    //valido selección de la zona cresta
    const riskZone = $("#cmbProvincia").find(':selected').data('risk-zone');
    if(riskZone){
      $('#cmbZonaCresta').val(riskZone);
      lockSelect('#cmbZonaCresta');
    }
    else{
      $('#cmbZonaCresta').val('');
      unlockSelect('#cmbZonaCresta');
    }
    
  } catch (error) {
    console.error(`Error seleccionando provincia: ${error.toString()}`)
  }
    
};

const changeMarca = async () => {
  try {

    //valido selección de la zona cresta
    const cmarca = $("#cmbMarca").val();
    await loadDataTable({reference:'#cmbModelo',tableName:'tbModelos',indexCode:2,indexDisplay:3, 
        filterFunction: item => item[0] == policy.lob && item[1] == cmarca && item[4] == "1",
        sortFunction: (a, b) => a[3].localeCompare(b[3])});
    
  } catch (error) {
    console.error(`Error seleccionando provincia: ${error.toString()}`)
  }
    
};

function lockSelect(selector) {
  $(selector)
      .data('locked', true)
      .on('mousedown.lock keydown.lock change.lock', function (e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
      });
}

function unlockSelect(selector) {
  $(selector)
      .data('locked', false)
      .off('.lock');
}


//////////////////////////////////////////////
// Logica Tabs
//////////////////////////////////////////////

function prepareContainer(){
    try{
    
        //Creo un div y lo agregamos luego del campo hiddenValida para trabajar con dicho div como contenedor
        const $hidden = $('#hiddenFormStyle');
        const $form = $hidden.closest('form');

        // Contenedor único
        let $contenedor = $form.find("#contenedorCobtar");
        if ($contenedor.length === 0) {
            $contenedor = $("<div>", { id: "contenedorCobtar" });
            $form.append($contenedor);
        } else {
            $contenedor.empty();
        }        

    }
    catch(error){
        console.error(`Error creando contenedor: ${error.toString()}`);
    }

}

function inicializarTabs(containerSelector = "#contenedorCobtar") {
    try{
        
        
        const $container = $(containerSelector);

        const $tabs = $(`
            <div class="tabs-wrapper">
                <div class="tabs-header">
                <div class="tab-link active" data-tab="tab1">Datos Generales</div>
                <div class="tab-link" data-tab="tab3">Datos Adicionales</div>
                <div class="tab-link" data-tab="tab2">Tarifas de Entrada</div>
                </div>

                <div id="tab1" class="tab-content active"></div>
                <div id="tab3" class="tab-content"></div>
                <div id="tab2" class="tab-content"></div>                
            `);

        $container.empty().append($tabs);

        // evento tabs
        $container.off("click", ".tab-link").on("click", ".tab-link", function () {
            const tabId = $(this).data("tab");

            $container.find(".tab-link").removeClass("active");
            $(this).addClass("active");

            $container.find(".tab-content").removeClass("active");
            $container.find("#" + tabId).addClass("active");

        });

    }catch(error){
        console.error(error);
    }
}

function moverCamposATabGeneral() {
    try{
    
        const $tab1 = $("#tab1");
        const $tabAdicionales = $("#tab3");

        const movedRows = new Set();

        $(".ptab").each(function () {
            const $row = $(this).closest(".row");

            if ($row.length && !movedRows.has($row[0])) {
            movedRows.add($row[0]);
            $tab1.append($row);
            }
        });

        $(".stab").each(function () {
            const $row = $(this).closest(".row");

            if ($row.length && !movedRows.has($row[0])) {
            movedRows.add($row[0]);
            $tabAdicionales.append($row);
            }
        });

    }catch(error){
        console.error(error);
    }
}

//Logica de Cobtar
async function listarCobtar(){
    try{

        const cobtarRamo = cobtarVida.find(c => c.lob == policy.lob);
        if(!cobtarRamo){
            console.warn(`No se encontró configuración de cobtar para ramo ${policy.lob}`);
            return;
        }
    
        const tableCobtar = await me.exe("GetFullTable", {table : cobtarRamo.cobtar});
        if(!tableCobtar.ok)
            console.error("Error leyendo configuración de tarifas");

        configCobtar = mapearTablaConfig(tableCobtar.outData ?? []);
        configCobtar = configCobtar.filter(x => policy.Coverages.find(b => vEqual(b.code) == vEqual(x.coverageCode)) && vEqual(x.productCode) == vEqual(policy.productCode));

    }
    catch(error){
        console.error(`Error listando configuración: ${error.toString()}`);
    }
}

function mapearTablaConfig(data) {

  if (!data || !data.length) return [];

  const headersOriginal = data[0];

  // Resolver nombres duplicados
  const headers = [];
  const contador = {};

  headersOriginal.forEach(h => {
    const key = h.trim();

    if (contador[key]) {
      contador[key]++;
      headers.push(`${key}_${contador[key]}`);
    } else {
      contador[key] = 1;
      headers.push(key);
    }
  });

  // Mapear filas
  const result = data.slice(1).map(row => {
    const obj = {};

    headers.forEach((col, i) => {
      obj[col] = row[i];
    });

    return obj;
  });

  return result;
}

function agruparData(data) {
    try{
    
        const grupos = {};

        $.each(data, function (_, item) {
            const key = item.productCode + "_" + item.coverageCode;

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
            readOnly: item.readOnly == "true" ? true : false,
            required: item.required == "true" ? true : false
            });
        });

        return Object.values(grupos);

    }
    catch(error){
        console.error(`Error agrupando configuración: ${error.toString()}`);
    }
}

function renderTablaAgrupada(data, containerSelector = "#tab2") {
    try{
        
        const $container = $(containerSelector);

        // Eliminar únicamente la tabla anterior
        $container.find("#tablaCobtar").remove();

        const grupos = agruparData(data);
        if (!grupos.length) return;

        // ===== columnas (campos únicos) =====
        const camposSet = new Set();

        grupos.forEach(g => {
            g.campos.forEach(c => {
            if (c.name && c.name !== "none") {
                camposSet.add(c.name);
            }
            });

            // indexación rápida
            g.mapa = {};
            g.campos.forEach(c => {
            g.mapa[c.name] = c;
            });
        });

        const columnas = Array.from(camposSet);
        
        // ===== tabla =====
        const $table = $("<table>").addClass("tabla-ant");

        // ===== header =====
        const $thead = $("<thead>");
        const $trHead = $("<tr>");

        $trHead.append("<th>Cobertura</th>");

        columnas.forEach(col => {
            $("<th>").text(col).appendTo($trHead);
        });

        $thead.append($trHead);
        $table.append($thead);

        // ===== body =====
        const $tbody = $("<tbody>");

        grupos.forEach(g => {

            const $tr = $("<tr>");

            // columna fija
            $("<td>")
            .html(`
                <div style="display:flex; flex-direction:column;">
                <span>${g.coverageName}</span>
                <span style="font-size:12px; color:rgba(0,0,0,0.45);">
                    Código: ${g.coverageCode}
                </span>
                </div>
            `)
            .appendTo($tr);

            // ===== columnas dinámicas =====
            columnas.forEach(col => {
            const campo = g.mapa[col];
            const $td = $("<td>");

            if (campo) {
                const type = (campo.type || "").toLowerCase();
                const name = campo.name || "";
                const desc = campo.description && campo.description !== "none"
                ? campo.description
                : "";

                const isDisabled =
                !type || type === "none" || !desc;

                const isReadOnly = campo.readOnly === true;
                const isRequired = campo.required === true;

                let $input;

                // ===== tipo =====
                if (type === "number") {
                    $input = $("<input>", { 
                      type: "number",
                      step: "0.01"
                    }).addClass("ant-input-custom");

                } else if (type === "select") {

                    $input = $("<select>")
                        .addClass("ant-select-custom");

                    let options = [];

                    try {
                        const clean = campo.catalog
                        ?.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
                        ?.replace(/'/g, '"');

                        options = JSON.parse(clean || "[]");
                    } catch {
                        options = [];
                    }

                    $input.append('<option value="" selected disabled>Seleccione una opción</option>');

                    options.forEach(opt => {
                        $("<option>", {
                        value: opt.code,
                        text: opt.name
                        }).appendTo($input);
                    });

                    $input.prop("selectedIndex", 0);

                } else if (type === "text") {
                $input = $("<input>", { type: "text" })
                    .addClass("ant-input-custom");

                } else if (type === "date") {
                $input = $("<input>", { type: "date" })
                    .addClass("ant-input-custom");

                } else {
                $input = $("<input>", { type: "text" })
                    .addClass("ant-input-custom");
                }

                // ===== atributos =====
                $input.attr({
                "data-coverage": g.coverageCode,
                "data-field": name
                });
            
                // ===== disabled =====
                if (isDisabled) {
                $input.prop("disabled", true);
                }

                // ===== readonly =====
                if (isReadOnly) {
                    $input.prop("readonly", true);
                }

                // ===== required =====
                if (isRequired) {
                    $input.prop("required", true);
                }

                isRequired

                // ===== placeholder =====
                if (desc) {
                $input.attr("placeholder", desc);
                }

                $td.append($input);
            }

            $tr.append($td);
            });

            $tbody.append($tr);
        });

        $table.append($tbody);
        $container.append($table);

    }catch(error){
        console.error(error);
    }
}

function cargarCobtarDesdeHidden(
  hiddenSelector = "#hiddenCobtar",
  containerSelector = "#tab2"
) {

  const raw = $(hiddenSelector).val();

  if (!raw) return;

  let data = [];
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("JSON inválido en hiddenCobtar");
    return;
  }

  // recorrer cada objeto (cada cobertura)
  $.each(data, function (_, item) {
    const coverage = item.coverageCode;

    // recorrer propiedades dinámicas (SA, CGRUPO, etc)
    $.each(item, function (key, value) {
      if (key === "coverageCode" || key === "coverageName") return;

      const $input = $(containerSelector).find(
        `[data-coverage="${coverage}"][data-field="${key}"]`
      );

      if (!$input.length) return;

      // ===== SET VALUE SEGÚN TIPO =====
      if ($input.is("select")) {
        $input.val(value);
      } else if ($input.attr("type") === "number") {
        $input.val(value != null ? Number(value) : "");
      } else {
        $input.val(value ?? "");
      }

      // dispara change por si tienes lógica reactiva
      $input.trigger("change");
    });
  });
}

function construirCobtar(containerSelector = "#tab2") {
    try{
        
        const resultado = {};

        $(containerSelector)
            .find("input, select")
            .each(function () {
            const $el = $(this);

            const coverage = $el.data("coverage");
            const coverageName = $el.data("coverage-name");
            const field = $el.data("field");

            if (!coverage || !field) return;

            if (!resultado[coverage]) {
                resultado[coverage] = {
                coverageCode: coverage,
                coverageName: coverageName
                };
            }

            let value = $el.val();

            // normalizar valores
            if ($el.attr("type") === "number") {
                value = value === "" ? null : Number(value);
            }

            resultado[coverage][field] = value;
            });

        return Object.values(resultado);

    }catch(error){
        console.error(error);
    }
}

function bindEventosCobtar() {
  $("#tab2").on("input change", "input, select", function () {
    const data = construirCobtar("#tab2");
    $("#hiddenCobtar").val(JSON.stringify(data));
    // debug opcional
    console.log(data);
  });
}

function setDefaultCobtar(){
    if($("#hiddenCobtar").val() === ''){
        const data = construirCobtar("#tab2");
        $("#hiddenCobtar").val(JSON.stringify(data));
    }    
}

function formatearFecha(fecha) {
    const f = new Date(fecha);
    if (isNaN(f)) return "";

    const yyyy = f.getFullYear();
    const mm = String(f.getMonth() + 1).padStart(2, "0");
    const dd = String(f.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}

//Estilos
function inyectarEstilosAntdCobtar() {
  const STYLE_ID = "antd-cobtar-styles";

  // elimina estilos anteriores si existen
  $("#" + STYLE_ID).remove();

  const css = `
  /* ===== CONTENEDOR ===== */
  #contenedorCobtar {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
    background: #fff;
    border-radius: 6px;
  }

  /* ===== TABS ===== */
  #contenedorCobtar .tabs-header {
    display: flex;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }

  #contenedorCobtar .tab-link {
    padding: 12px 16px;
    cursor: pointer;
    color: rgba(0,0,0,0.65);
    position: relative;
    transition: all 0.3s;
    font-size: 14px;
  }

  #contenedorCobtar .tab-link:hover {
    color: #1677ff;
  }

  #contenedorCobtar .tab-link.active {
    color: #1677ff;
    font-weight: 500;
  }

  #contenedorCobtar .tab-link.active::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #1677ff;
  }

  #contenedorCobtar .tab-content {
    display: none;
  }

  #contenedorCobtar .tab-content.active {
    display: block;
  }

  /* ===== TABLA ===== */
  #contenedorCobtar .tabla-ant {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  #contenedorCobtar .tabla-ant th {
    background: #fafafa;
    color: rgba(0,0,0,0.85);
    font-weight: 500;
    border-bottom: 1px solid #f0f0f0;
    padding: 10px;
    text-align: left;
  }

  #contenedorCobtar .tabla-ant td {
    border-bottom: 1px solid #f0f0f0;
    padding: 8px;
  }

  #contenedorCobtar .tabla-ant tbody tr:hover td {
    background: #fafafa;
  }

  #contenedorCobtar .tabla-ant td:first-child {
    font-weight: 500;
    background: #fafafa;
  }

  /* ===== INPUTS ===== */
  #contenedorCobtar .ant-input-custom,
  #contenedorCobtar .ant-select-custom {
    width: 100%;
    height: 32px;
    padding: 4px 11px;
    font-size: 14px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    transition: all 0.2s;
    outline: none;
    box-sizing: border-box;
    background: #fff;
  }

  #contenedorCobtar .ant-input-custom:focus,
  #contenedorCobtar .ant-select-custom:focus {
    border-color: #1677ff;
    box-shadow: 0 0 0 2px rgba(22,119,255,0.2);
  }

    #contenedorCobtar .ant-input-custom:disabled,
    #contenedorCobtar .ant-select-custom:disabled {
        background: #f5f5f5;
        color: rgba(0,0,0,0.4);
        cursor: not-allowed;
    }

    #contenedorCobtar .tabs-header {
        display: flex;
        padding-left: 0 !important;
        margin: 0 !important;
    }

    #contenedorCobtar .tabs-header > li {
        display: flex !important;        /* elimina list-item */
        align-items: center;
        list-style: none !important;
    }

    .readonly-style {
        background-color: #f5f5f5 !important;
        color: #666 !important;
        border: 1px solid #d9d9d9 !important;
        cursor: not-allowed !important;
        pointer-events: none;
        opacity: 1 !important;
    }

    .required-label::after{
        content: " *";
        color: red;
    }

    /* ===================================================================================== */
    /* TOOLBAR COBERTURAS */
    /* ===================================================================================== */

    #tab2 #toolbarCoberturas {
        display: flex !important;
        justify-content: flex-start !important;
        align-items: center;
        width: 100%;

        padding-top: 12px;
        margin-bottom: 16px;
    }

    #tab2 #toolbarCoberturas .ant-btn {
      float: none !important;
      text-align: initial !important;
    }

    /* ===================================================================================== */
    /* MODAL COBERTURAS */
    /* ===================================================================================== */

    #modalCoberturas.modal-cob-overlay{
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.45);
      z-index:99999;

      display:none;

      align-items:center;
      justify-content:center;
    }

    #modalCoberturas .modal-cob-container{
      width:900px;
      max-width:95%;
      background:#fff;
      border-radius:8px;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(0,0,0,.2);
    }

    #modalCoberturas .modal-cob-header{
      height:56px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:0 20px;
      border-bottom:1px solid #f0f0f0;
      font-size:16px;
      font-weight:600;
    }

    #modalCoberturas .modal-close{
      border:none;
      background:none;
      font-size:24px;
      cursor:pointer;
    }

    #modalCoberturas .modal-cob-body{
      padding:16px;
      max-height:500px;
      overflow:auto;
    }

    /* ===================================================================================== */
    /* TABLA MODAL */
    /* ===================================================================================== */

    #modalCoberturas .tabla-cob-modal{
      width:100%;
      border-collapse:collapse;
    }

    #modalCoberturas .tabla-cob-modal th{
      background:#fafafa;
      border-bottom:1px solid #f0f0f0;
      padding:10px;
      text-align:left;
    }

    #modalCoberturas .tabla-cob-modal td{
      padding:10px;
      border-bottom:1px solid #f0f0f0;
    }

    #modalCoberturas .tabla-cob-modal tbody tr:hover{
      background:#fafafa;
    }

    /* ===================================================================================== */
    /* FOOTER MODAL */
    /* ===================================================================================== */

    #modalCoberturas .modal-cob-footer{
      padding:16px;
      border-top:1px solid #f0f0f0;
      display:flex;
      justify-content:flex-end;
    }

    /* =====================================================================================
      FOOTER RESUMEN TARIFAS
    ===================================================================================== */

    #tab2 #footerResumenTarifas{
      margin-top:16px;
      padding:14px 18px;
      border:1px solid #b7eb8f;
      border-radius:8px;
      background:#f6ffed;
      display:flex;
      align-items:center;
      gap:32px;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
      width:100%;
      justify-content:flex-start;
      box-sizing:border-box;
    }

    /* icon success */
    #tab2 #footerResumenTarifas .footer-success-icon{
      width:28px;
      height:28px;
      border-radius:50%;
      background:#52c41a;
      position:relative;
      flex-shrink:0;
    }

    /* dibujar check real */
    #tab2 #footerResumenTarifas .footer-success-icon::after{
      content:"";
      position:absolute;
      left:9px;
      top:5px;
      width:7px;
      height:12px;
      border:solid #fff;
      border-width:0 2px 2px 0;
      transform:rotate(45deg);
    }

    /* bloques */
    #tab2 #footerResumenTarifas .footer-tarifas-item{
      display:flex;
      flex-direction:column;
      align-items:flex-end;
    }

    /* labels */
    #tab2 #footerResumenTarifas .label{
      font-size:11px;
      font-weight:600;
      color:#389e0d;
      text-transform:uppercase;
      letter-spacing:.4px;
      margin-bottom:3px;
    }

    /* valores */
    #tab2 #footerResumenTarifas .value{
      font-size:22px;
      line-height:1;
      font-weight:700;
      color:#237804;
      font-variant-numeric: tabular-nums;
    }

    /* =====================================================================================
      BOTON COTIZAR
    ===================================================================================== */

    #tab2 .btn-cotizar-cob{

      display:inline-flex !important;

      align-items:center !important;

      justify-content:center !important;

      gap:6px;

    }

    /* icono */
    #tab2 .btn-cotizar-icon{

      display:inline-flex;

      align-items:center;
      justify-content:center;

      width:14px;
      height:14px;

      font-size:12px;
      line-height:1;

      border:1px solid currentColor;
      border-radius:50%;

      position:relative;
      top:-1px;

    }

  `;

  $("<style>", {
    id: STYLE_ID,
    type: "text/css"
  }).html(css).appendTo("head");
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Toolbar + Modal Coberturas + footer resumen
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

let coberturasSeleccionadas = [];
let productCoverages = [];

const cfgCoberturaReaseguro = [
  { lob: 96, name: "cfgCoberturaProductoReaTecnicos" },
  { lob: 20, name: "cfgCoberturaProductoReaVidaColectivo" },
  { lob: 31, name: "cfgCoberturaProductoReaVida" },
  { lob: 52, name: "cfgCoberturaProductoReaRiesgosVarios" },
  { lob: 1, name: "cfgCoberturaProductoRea" },
  { lob: 81, name: "cfgCoberturaProductoRea" },
  { lob: 82, name: "cfgCoberturaProductoRea" },
  { lob: 83, name: "cfgCoberturaProductoRea" }
]

async function getProduct(lobCode, productCode) {

  const RepoProduct = await me.exe("RepoProduct", {
      operation: "GET",
      filter: ` lobCode = '${lobCode}' AND code = '${productCode}'`
    });

  const product = RepoProduct.outData[0];
  return product
}

let configCoverages = []
async function setConfigCoverages(){
  const tableName = cfgCoberturaReaseguro.find(x => x.lob == policy.lob)?.name ?? "cfgCoberturaProductoRea";
  const tableConfig = await me.exe("GetFullTable", { table: tableName });
  configCoverages = mapearTablaConfig(tableConfig.outData ?? []);
  configCoverages = configCoverages.filter(x => vEqual(x.productCode) == vEqual(policy.productCode));
}

async function setProductCoverages() {
  
  const productJson = await getProduct(policy.lob, policy.productCode);
  const product = productJson.configJson ? JSON.parse(productJson.configJson) : {};
  await setConfigCoverages();

  if(!product){
    console.error("No se pudo recuperar la configuración del producto");
    return;
  }

  if(!configCoverages){
    console.error("No se pudo recuperar la configuración de las coberturas del producto");
    return;
  }

  if(product.Coverages.length == 0){
    console.error("El producto no tiene coberturas asignadas");
    return;
  }

  if(configCoverages.length == 0){
    console.error("No se encontró configuración de coberturas para saber si suman o no.");
    return;
  }

  //Hacer cruce entre policyCoverages y product.Coverages y obtener información de sumaAsegurad ay prima de las coberturas de la póliza, para luego renderizarlas en el modal y permitir su edición
  productCoverages = product.Coverages.map(pc => {
    const polCob = policy.Coverages.find(c => c.code.trim().toUpperCase() == pc.code.trim().toUpperCase());
    const cfgCob = configCoverages.find(c => c.coverageCode.trim().toUpperCase() == pc.code.trim().toUpperCase());
    return {
      id: 0,
      lifePolicyId: policy.id,
      code: pc.code,
      name: pc?.name ?? "Cobertura desconocida",
      sumaAsegurada: polCob ? (polCob?.limit || 0) : 0,
      prima: polCob ? (polCob?.premium || 0) : 0,
      suma: cfgCob ? (cfgCob.isCoverage.toUpperCase() == "SI" ? "Si" : "No") : "No",
      mandatory: pc?.mandatory ?? false,
      incluido: polCob ? true : false,
      limit: 0,
      deductible: 0,
      periodicity: 0,
      basePremium: 0,
      basic: pc?.basic ?? false,
      description: pc?.description ?? "Not Found",
      loading: 0,
      end: policy.end,
      start: policy.start,
      appliesTo: pc?.appliesTo ?? "INS",
      commercialName: pc?.commercialName ?? "Not Found",
      internalBonus: pc?.internalBonus ?? false,
      number: pc?.number ?? 0,
      ofnCode: pc?.ofnCode ?? 0,
      ofnGroup: pc?.ofnGroup ?? 0,
      solvency2Code: pc?.solvency2Code ?? null,
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
      reinsuranceCode: pc?.reinsurance ?? null,
      parentPercentage: 0,
      coContractId: null,
      jCustom: null,
      jPremiumDetail: null,
      distributionMode: null
    }
  });

}

function renderToolbarCoberturas() {

  try {

    const $tab = $("#tab2");

    if (!$tab.length)
      return;

    // evita duplicados por rerender
    $("#toolbarCoberturas").remove();

    const toolbarHtml = `
      <div id="toolbarCoberturas">

        <button
          type="button"
          id="btnGestionarCoberturas"
          class="ant-btn ant-btn-primary btn-gestionar-cob"
        >

          <span class="btn-gestionar-icon">
            💾
          </span>

          <span>
            Gestionar Coberturas
          </span>

        </button>

        <!--<button
          type="button"
          id="btnCotizarCoberturas"
          class="ant-btn ant-btn-primary btn-cotizar-cob"
          style="margin-left:5px; margin-right:5px;"
        >

          <span class="btn-cotizar-icon">
            €
          </span>

          <span>
            Cotizar
          </span>

        </button>-->

      </div>
    `;

    // insertar siempre arriba
    $tab.prepend(toolbarHtml);

    polizaConfirmada = policy.active;
    // if(polizaConfirmada){      
    //   $("#btnCotizarCoberturas").prop("disabled", true);
    // }

    // //Evento de cotización
    // $(document)
    // .off("click", "#btnCotizarCoberturas")
    // .on("click", "#btnCotizarCoberturas", async function () {

    //   try{

    //     $("#btnCotizarCoberturas").prop("disabled", true);

    //     const resultado = await me.exe("QuotePolicy", { policyId: policy.id, policy: null, dbMode: true, save: true, action: "PREQUOTE" });
    //     if(!resultado.ok){
    //       me.message.error(`Error cotizando coberturas: ${resultado.msg}`);
    //       return;
    //     }

    //     policy = resultado.outData[0];
    //     me.message.success(`Cálculos finalizados, verifique el resumen de suma y prima`,5);
    //     actualizarResumenTarifas();
    //     await setProductCoverages();
    //     renderModalCoberturas();

    //     //Actualizo el formulario principal en caso de existir
    //     renderFormPrincipal();

    //   }catch(ex){
    //     me.message.error(`Error cotizando coberturas: ${ex.toString()}`);
    //   }
    //   finally{
    //     $("#btnCotizarCoberturas").prop("disabled", false);
    //   }      

    // });
        
    // render modal una sola vez
    renderModalCoberturas();

  } catch (error) {

    console.error(
      `Error renderizando toolbar coberturas: ${error.toString()}`
    );

  }

}

function renderModalCoberturas() {

  try {

    $("#modalCoberturas").remove();

    const rows = productCoverages.map(c => `
      <tr>

        <td style="text-align:center;">
          <input
            type="checkbox"
            class="chk-cobertura"
            value="${c.code}"
            data-mandatory="${c.mandatory}"
            data-incluido="${c.incluido}"
            ${c.mandatory || c.incluido ? 'checked' : ''}
            ${c.mandatory || polizaConfirmada ? 'disabled' : ''}
          />
        </td>

        <td style="text-align:center;">
          ${c.code}
        </td>

        <td>
          ${c.name}
        </td>

        <td style="text-align:right;">
          ${formatMoney(c.sumaAsegurada)}
        </td>

        <td style="text-align:right;">
          ${formatMoney(c.prima)}
        </td>

        <td style="text-align:center;">
          ${c.suma.trim().toUpperCase() == "SI" ? 'Sí' : 'No'}
        </td>

      </tr>
    `).join("");

    const modalHtml = `
      <div
        id="modalCoberturas"
        style="
          display:none;
          position:fixed;
          top:0;
          left:0;
          width:100vw;
          height:100vh;
          background:rgba(0,0,0,.45);
          z-index:999999999;
        "
      >

        <div
          style="
            width:900px;
            max-width:95%;
            background:#fff;
            border-radius:8px;
            overflow:hidden;
            position:absolute;
            top:50%;
            left:50%;
            transform:translate(-50%, -50%);
            box-shadow:0 10px 30px rgba(0,0,0,.2);
          "
        >

          <div
            style="
              height:56px;
              display:flex;
              align-items:center;
              justify-content:space-between;
              padding:0 20px;
              border-bottom:1px solid #f0f0f0;
              font-size:16px;
              font-weight:600;
            "
          >

            <span>Gestión de Coberturas</span>

            <button
              type="button"
              id="btnCerrarModalCob"
              style="
                border:none;
                background:none;
                font-size:24px;
                cursor:pointer;
              "
            >
              ×
            </button>

          </div>

          <div
            style="
              padding:16px;
              max-height:500px;
              overflow:auto;
            "
          >

            <table
              style="
                width:100%;
                border-collapse:collapse;
                font-size:14px;
              "
            >

              <thead>

                <tr style="background:#fafafa;">

                  <th style="
                    width:40px;
                    text-align:center;
                    padding:10px;
                    border-bottom:1px solid #f0f0f0;
                  ">

                    <input
                      type="checkbox"
                      id="chkAllCoberturas"
                      ${polizaConfirmada ? 'disabled': ''}
                    />

                  </th>

                  <th style="
                    text-align:center;
                    padding:10px;
                    border-bottom:1px solid #f0f0f0;
                  ">
                    Código
                  </th>

                  <th style="
                    text-align:left;
                    padding:10px;
                    border-bottom:1px solid #f0f0f0;
                  ">
                    Nombre
                  </th>

                  <th style="
                    text-align:right;
                    padding:10px;
                    border-bottom:1px solid #f0f0f0;
                  ">
                    Suma Asegurada
                  </th>

                  <th style="
                    text-align:right;
                    padding:10px;
                    border-bottom:1px solid #f0f0f0;
                  ">
                    Prima
                  </th>

                  <th style="
                    text-align:center;
                    padding:10px;
                    border-bottom:1px solid #f0f0f0;
                  ">
                    ¿Suma?
                  </th>

                </tr>

              </thead>

              <tbody>
                ${rows}
              </tbody>

            </table>

          </div>

          <div
            style="
              padding:16px;
              border-top:1px solid #f0f0f0;
              display:flex;
              justify-content:flex-end;
            "
          >

            <button
              type="button"
              id="btnGuardarCoberturas"
              class="ant-btn ant-btn-primary"
            >
              <span>Guardar</span>
            </button>

          </div>

        </div>

      </div>
    `;

    $("body").append(modalHtml);

    if(polizaConfirmada){      
      $("#btnGuardarCoberturas").prop("disabled", true);
    }

  } catch (error) {

    console.error(error);

  }

}

async function bindEventosCoberturas() {

  $(document)
    .off("change", "#chkAllCoberturas")
    .on("change", "#chkAllCoberturas", function () {

      const checked = $(this).is(":checked");

      $(".chk-cobertura")
        .not("[data-mandatory='true']")
        .prop("checked", checked);

    });

  $(document)
    .off("click", "#btnGestionarCoberturas")
    .on("click", "#btnGestionarCoberturas", function () {

      $("#modalCoberturas").show();

    });

  $(document)
    .off("click", "#btnCerrarModalCob")
    .on("click", "#btnCerrarModalCob", function () {

      $("#modalCoberturas").hide();

    });

  $(document)
    .off("click", "#modalCoberturas")
    .on("click", "#modalCoberturas", function (e) {

      if ($(e.target).attr("id") === "modalCoberturas") {
        $("#modalCoberturas").hide();
      }

    });

    $(document)
      .off("click", "#btnGuardarCoberturas")
      .on("click", "#btnGuardarCoberturas", async function () {

        coberturasSeleccionadas = productCoverages.filter(c => {
          const $chk = $(`.chk-cobertura[value="${c.code}"]`);
          const isChecked = $chk.is(":checked");
          return c.mandatory || isChecked;
        });

        if (!coberturasSeleccionadas.length) {
          me.message.warning("Debe seleccionar al menos una cobertura");
          return;
        }

        const ok = await confirmCoberturas();
        if (!ok) return;

        try {

          const query = buildLifeCoverageInsert(coberturasSeleccionadas);
          const resultado = await me.exe("DoQuery", { sql: `DELETE LifeCoverage WHERE lifepolicyId = ${policy.id}; ${query}` });

          if(!resultado.ok){
            me.message.error(`Error guardando coberturas: ${resultado.msg}`);
            return;
          }     

          me.message.success(`Coberturas guardadas correctamente (${coberturasSeleccionadas.length})`,5);

          $("#modalCoberturas").hide();

          //Cargo el cobtar por si hay nuevas coberturas.          
          debugger;
          policy = await getPolicy();
          await cargarCobtarDinamico();
          await setProductCoverages();
          renderModalCoberturas();

          //Actualizo el formulario principal en caso de existir
          renderFormPrincipal();

        } catch (e) {
          console.error(e);
          me.message.error("Error al guardar coberturas, contacte a sistemas.");
        }

      });

}

function buildLifeCoverageInsert(coberturasSeleccionadas) {

    const lifeCoverageColumns = [
        { key: "lifePolicyId", type: "number" },
        { key: "code", type: "string" },
        { key: "name", type: "string" },
        { key: "limit", type: "number" },
        { key: "deductible", type: "number" },
        { key: "periodicity", type: "number" },
        { key: "basePremium", type: "number" },
        { key: "extraPremium", type: "number" },
        { key: "basic", type: "boolean" },
        { key: "description", type: "string" },
        { key: "loading", type: "number" },
        { key: "start", type: "date" },
        { key: "end", type: "date" },
        { key: "appliesTo", type: "string" },
        { key: "commercialName", type: "string" },
        { key: "internalBonus", type: "boolean" },
        { key: "number", type: "number" },
        { key: "ofnCode", type: "number" },
        { key: "ofnGroup", type: "number" },
        { key: "solvency2Code", type: "string" },
        { key: "startBasePremium", type: "number" },
        { key: "startLimit", type: "number" },
        { key: "parent", type: "string" },
        { key: "hasMaturity", type: "boolean" },
        { key: "ignoreIndexation", type: "boolean" },
        { key: "internalPremium", type: "number" },
        { key: "reStatus", type: "number" },
        { key: "manualPremium", type: "boolean" },
        { key: "manualLimit", type: "boolean" },
        { key: "isInternal", type: "boolean" },
        { key: "baseLimit", type: "number" },
        { key: "limitFactor", type: "string" },
        { key: "loadingInsuredSum", type: "number" },
        { key: "reinsuranceCode", type: "string" },
        { key: "parentPercentage", type: "number" },
        { key: "coContractId", type: "string" },
        { key: "jCustom", type: "string" },
        { key: "jPremiumDetail", type: "string" },
        { key: "distributionMode", type: "string" }
    ];

    const escapeString = (v) =>
        String(v ?? "").replace(/'/g, "''");

    const formatValue = (value, type) => {
        if (value === null || value === undefined) return "NULL";

        switch (type) {
            case "number":
                return isNaN(value) ? "NULL" : value;

            case "boolean":
                return value ? 1 : 0;

            case "date":
                return `'${new Date(value).toISOString()}'`;

            default:
                return `'${escapeString(value)}'`;
        }
    };

    const columnsSql = lifeCoverageColumns
        .map(c => `[${c.key}]`)
        .join(", ");

    const valuesSql = coberturasSeleccionadas.map(row => {
        const values = lifeCoverageColumns.map(col =>
            formatValue(row[col.key], col.type)
        );

        return `(${values.join(", ")})`;
    });

    return `
INSERT INTO [lifeCoverage] (${columnsSql})
VALUES
${valuesSql.join(",\n")};
    `.trim();
}

function confirmCoberturas() {

  return new Promise((resolve, reject) => {

    $("#modalConfirmCoberturas").remove();

    const html = `
      <div id="modalConfirmCoberturas" style="
        display:block;
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.45);
        z-index:999999999;
      ">
        <div style="
          width:420px;
          max-width:92%;
          background:#fff;
          border-radius:8px;
          overflow:hidden;
          position:absolute;
          top:50%;
          left:50%;
          transform:translate(-50%, -50%);
          box-shadow:0 6px 20px rgba(0,0,0,.18);
        ">

          <div style="padding:14px 18px; font-weight:600;">
            Confirmar cambios
          </div>

          <div style="padding:18px;">
            Al guardar se modificarán coberturas y será necesario cotizar nuevamente.
            <br><br>
            ¿Desea continuar?
          </div>

          <div style="
            padding:12px 18px;
            display:flex;
            justify-content:flex-end;
            gap:8px;
          ">

            <button id="btnCancelConfirmCob" class="ant-btn">
              No
            </button>

            <button id="btnOkConfirmCob" class="ant-btn ant-btn-primary">
              Sí, continuar
            </button>

          </div>

        </div>
      </div>
    `;

    $("body").append(html);

    $("#modalConfirmCoberturas")
      .off("click", "#btnCancelConfirmCob")
      .on("click", "#btnCancelConfirmCob", function () {
        $("#modalConfirmCoberturas").remove();
        resolve(false); // 👈 cancelado
      });

    $("#modalConfirmCoberturas")
      .off("click", "#btnOkConfirmCob")
      .on("click", "#btnOkConfirmCob", function () {
        $("#modalConfirmCoberturas").remove();
        resolve(true); // 👈 confirmado
      });

  });

}

function formatMoney(value) {

  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

}

function renderFooterTarifas() {

  $("#footerResumenTarifas").remove();

  const html = `
    <div id="footerResumenTarifas">

      <div class="footer-success-icon"></div>

      <div class="footer-tarifas-item">
        <span class="label">
          Suma Total
        </span>

        <span
          class="value"
          id="lblSumaTotalTarifas"
        >
          0.00
        </span>
      </div>

      <div class="footer-tarifas-item">
        <span class="label">
          Prima Total
        </span>

        <span
          class="value"
          id="lblPrimaTotalTarifas"
        >
          0.00
        </span>
      </div>

    </div>
  `;

  $("#tab2").append(html);

}

function actualizarResumenTarifas() {

  let sumaTotal = 0;
  let primaTotal = 0;

  policy.Coverages.forEach(pc => {

    const cfgCob = configCoverages.find(c => c.coverageCode.trim().toUpperCase() == pc.code.trim().toUpperCase());

    if (vEqual((cfgCob?.isCoverage || "")) == vEqual("si"))
      sumaTotal += Number(pc.limit || 0);
    
    primaTotal += Number(pc.premium || 0);

  });

  $("#lblSumaTotalTarifas")
    .text(formatMoney(sumaTotal));

  $("#lblPrimaTotalTarifas")
    .text(formatMoney(primaTotal));

}

function renderFormPrincipal(){
  const root = document.getElementById("app") || document.body;
  const btn = root.querySelector('.anticon.anticon-reload')?.closest('button');
  if (btn) btn.click();
}

//////////////////////////////////////////////
// Loading
//////////////////////////////////////////////

async function getPolicy() {
  
    const result = await me.exe('RepoLifePolicy', {
        operation: 'GET',
        include: ["Insureds","Coverages"],
        filter: `id=${policyId}`,
        noTracking: true
    });
    const poliza = result.outData?.[0] || {};

    return poliza;

}

function setDefaultData(){
    $("#txtSA").val(n2(policy.insuredSum));    
    $("#txtSA").addClass("readonly-style");

    //busco el código del producto de policy en el arreglo requiredData para obtener los campos requeridos de dicho producto y marcar dichos campos como requeridos en la interfaz
    const producto = requiredData.find(p => p.productCode === policy.productCode);
    if(producto && producto.fields){
        producto.fields.forEach(campo => {
            $(`#${campo}`).attr("required", true);
            $(`label[for="${campo}"]`).addClass('required-label');
        });
    }

    /*//Agrego evento al seleccionar un item en el cmbOcupacion para cargar la categoría en el campo CodigoCategoriaActividad
    $("#cmbOcupacion").off("change").on("change", function(){
        const categoria = $(this)
            .find("option:selected")
            .attr("data-categoria") || '';
        $("#CodigoCategoriaActividad").val(categoria);
    });*/

}

//////////////////////////////////////////////////////
// Inicialización
//////////////////////////////////////////////////////

$(function () {
  setTimeout(() => {
    initForm();
  }, 150); 
});

async function initForm() {

  const maxIntentos = 10;
  const delay = 250;

  for (let intento = 0; intento < maxIntentos; intento++) {

    const $hidden = $("#hiddenFormStyle");

    if ($("#contenedorCobtar").length) return;

    if ($hidden.length) {     

        //Cargamos información
        getPolicy().then(async result => {

            policy = result;

            //Renderización de tab y campos dinámicos
            inyectarEstilosAntdCobtar();
            prepareContainer();        
            inicializarTabs("#contenedorCobtar");    
            moverCamposATabGeneral();   

            setDefaultData();

            //Renderizado de opción para agregar coberturas
            await setProductCoverages();
            renderToolbarCoberturas();
            await bindEventosCoberturas();

            await cargarCobtarDinamico();
            validaInputs();

            await cargarCatalogos();

        });

        return;
    }

    await esperar(delay);
  }

  console.warn("No se encontró #hiddenDistribucionReaseguro");
}

async function cargarCobtarDinamico(){
    await listarCobtar();
    renderTablaAgrupada(configCobtar);
    cargarCobtarDesdeHidden("#hiddenCobtar", "#tab2");
    bindEventosCobtar();
    //Voy a validar si no hay nada en el hidden de cobtar lo voy a cargar con los datos por default
    setDefaultCobtar(); 

    renderFooterTarifas();
    actualizarResumenTarifas();
}

//Validando inputs
function validaInputs(){
    document.addEventListener("invalid", function (e) {
        const field = e.target;
        const $field = $(field);

        const $tab = $field.closest(".tab-content");

        if ($tab.length && !$tab.hasClass("active")) {
            const tabId = $tab.attr("id");

            const $container = $tab.closest(".tabs-wrapper");

            // activar header
            $container.find(".tab-link").removeClass("active");
            $container.find(`.tab-link[data-tab="${tabId}"]`).addClass("active");

            // activar contenido
            $container.find(".tab-content").removeClass("active");
            $tab.addClass("active");
        }

        // esperar render y enfocar
        setTimeout(() => {
            field.focus();
        }, 50);

    }, true); 
}

//función para formatear número en formato {0:N2}
function n2(numero) {
    if (isNaN(numero)) {
        return numero;
    }   
    return Number(numero).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function vEqual(value){
    const normalizado = value.trim().toUpperCase();
    return normalizado;
}

function formatearFecha(fecha) {
    const f = new Date(fecha);
    if (isNaN(f)) return "";

    const yyyy = f.getFullYear();
    const mm = String(f.getMonth() + 1).padStart(2, "0");
    const dd = String(f.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}