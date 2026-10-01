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
let bloquearCoberturas = false;
function isEndorsment() {
    // La pestaña del endoso puede activarse después de cargar el formulario.
    // Evaluar la URL al aplicar las restricciones evita conservar un valor falso inicial.
    return String(window.location.href || '').toLowerCase().includes('tab12');
}
const camposEditablesEnEndoso = new Set([
    'txtCodigoProyecto',
    'txtPeriodoPrueba',
    'txtPeriodoMantenimiento',
    'ckOrdenProceder',
    'txtDescripcion',
    'txtLocalizacion',
    'txtProyecto',
    'cmbRenovacion',
    'txtMotivoRenovacion'
]);

const requiredData = [
    { productCode: "MQ", fields: ["cmbCategoria"] }
]

const cobtarVida = [{ lob: 96, cobtar: "cfgCobtarRamoTecnico"  }, { lob: 52, cobtar: "cfgCobtarRiesgosVarios"  }]

//////////////////////////////////////////////
// Catalogos
//////////////////////////////////////////////

function filtrarActividadEconomica(item) {
    const lob = String(policy?.lob ?? '').trim();
    const productCode = String(policy?.productCode ?? '').trim().toUpperCase();
    // CAR de ramos tecnicos usa exclusivamente las actividades de categoria 3.
    return lob !== '96' || productCode !== 'CAR' || String(item[3] ?? '').trim() === '3';
}

function configurarActividadEconomicaRequerida() {
    if (String(policy?.lob ?? '').trim() !== '52') return;
    $('#cmbActividadEconomica')
        .prop('required', false)
        .removeAttr('required aria-required data-required');
    $('label[for="cmbActividadEconomica"]').each(function () {
        const $label = $(this);
        $label.removeClass('required required-label ant-form-item-required').removeAttr('required aria-required');
        // Algunos renderizadores escriben el asterisco directamente en el texto de la etiqueta.
        $label.contents().filter(function () { return this.nodeType === Node.TEXT_NODE; }).each(function () {
            this.nodeValue = this.nodeValue.replace(/\s*\*\s*$/, '');
        });
        $label.find('.required, .required-label, .ant-form-item-required').remove();
    });
}

async function cargarCatalogos() {
    await Promise.all([
        loadTableQuery({reference:'#cmbPais',tableCommand:'RepoCountryCatalog',filter:`[code]='591'`}),
        loadDataTable({reference:'#cmbActividadEconomica',tableName:'actividad',indexCode:0,indexDisplay:1, filterFunction: filtrarActividadEconomica}),
        loadDataTable({reference:'#cmbZonaCresta',tableName:'ZonaCresta',indexCode:0,indexDisplay:1}),
        loadDataTable({reference:'#cmbUsoBien',tableName:'TablaUsoBien',indexCode:0,indexDisplay:1}),
        loadDataTable({reference:'#cmbMarca',tableName:'tbMarcas',indexCode:1,indexDisplay:2, filterFunction: item => item[3] == "1", sortFunction: (a, b) => a[2].localeCompare(b[2])}),
        loadDataTable({reference:'#cmbCategoria',tableName:'tbCategoriaMaquinaria',indexCode:0,indexDisplay:1})
    ]);
    configurarActividadEconomicaRequerida();
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

        if (!$form.find('#hiddenAdendos').length) {
            $('<input>', {
                type: 'hidden',
                id: 'hiddenAdendos',
                name: 'hiddenAdendos'
            }).appendTo($form);
        }

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
                <div class="tab-link" data-tab="tabRenovacion">Datos Renovación</div>
                <div class="tab-link" data-tab="tab2">Tarifas de Entrada</div>
                <div class="tab-link" data-tab="tab4">Adendos</div>
                </div>

                <div id="tab1" class="tab-content active"></div>
                <div id="tab3" class="tab-content"></div>
                <div id="tabRenovacion" class="tab-content"></div>
                <div id="tab2" class="tab-content"></div>
                <div id="tab4" class="tab-content"></div>
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
        const $tabRenovacion = $("#tabRenovacion");

        const movedRows = new Set();
        const movedRowsRenovacion = new Set();

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

        $(".rtab").each(function () {
            const $row = $(this).closest(".row");

            if ($row.length && !movedRowsRenovacion.has($row[0])) {
                movedRowsRenovacion.add($row[0]);
                $tabRenovacion.append($row);
            }
        });

    }catch(error){
        console.error(error);
    }
}

let configAdendos = [];

async function cargarAdendos() {
    try {
        const response = await me.exe("GetFullTable", { table: "cfgAnexoAdendoCobertura" });
        configAdendos = mapearTablaConfig(response.outData ?? []);
        renderTablaAdendos(configAdendos);
        cargarAdendosDesdeHidden();
        bindEventosAdendos();
        setDefaultAdendos();
    } catch (error) {
        configAdendos = [];
        console.error(`Error leyendo configuración de adendos: ${error.toString()}`);
        renderTablaAdendos([]);
        cargarAdendosDesdeHidden();
        bindEventosAdendos();
        setDefaultAdendos();
    }
}

function getAdendoValue(row, names) {
    const keys = Object.keys(row || {});
    const key = keys.find(item => names.includes(String(item).trim().toLowerCase()));
    return key ? row[key] : '';
}

function tipoControlAdendo(tipo, parametro) {
    const normalizedType = String(tipo || '').trim().toLowerCase();
    const normalizedName = String(parametro || '').trim().toLowerCase();

    if (normalizedType === 'fecha' || normalizedType === 'date') return 'date';
    if (normalizedType === 'numero' || normalizedType === 'número' || normalizedType === 'number') return 'number';
    if (normalizedType === 'porcentaje' || normalizedType === 'percent' || normalizedType === '%') return 'percentage';
    if (normalizedType === 'texto' || normalizedType === 'text' || normalizedType === 'string') return 'text';

    if (/fecha|desde|hasta|inicio|final/.test(normalizedName)) return 'date';
    if (/%|porcentaje/.test(normalizedName)) return 'percentage';
    if (/monto|limite|límite|suma|indemn|deducible|valor|semanas|longitud|unidad/.test(normalizedName)) return 'number';
    return 'text';
}

function renderTablaAdendos(configuracion) {
    const $container = $("#tab4");
    $container.empty();

    const coverageCodes = new Set((policy?.Coverages || [])
        .map(coverage => String(coverage?.code ?? '').trim().toUpperCase())
        .filter(Boolean));
    const lob = String(policy?.lob ?? '').trim();
    const productCode = String(policy?.productCode ?? '').trim().toUpperCase();
    const grouped = new Map();

    (configuracion || [])
        .filter(row => String(getAdendoValue(row, ['cramo'])).trim() === lob)
        .filter(row => {
            const coverageCode = String(getAdendoValue(row, ['ccober'])).trim().toUpperCase();
            return coverageCodes.has(coverageCode);
        })
        .filter(row => {
            const product = String(getAdendoValue(row, ['oplan'])).trim().toUpperCase();
            return !product || product === '0' || product === productCode;
        })
        .forEach(row => {
            const coverageCode = String(getAdendoValue(row, ['ccober'])).trim();
            const coverage = (policy.Coverages || []).find(item =>
                String(item?.code ?? '').trim().toUpperCase() === coverageCode.toUpperCase()
            );
            if (!coverage) return;

            if (!grouped.has(coverageCode.toUpperCase())) {
                grouped.set(coverageCode.toUpperCase(), {
                    code: coverageCode,
                    name: coverage.name || coverage.commercialName || '',
                    idAnexo: String(getAdendoValue(row, ['idanexo'])).trim(),
                    description: String(getAdendoValue(row, ['xdescripcion'])).trim(),
                    parameters: []
                });
            }

            const parameter = String(getAdendoValue(row, ['parametro'])).trim();
            const parameterType = String(getAdendoValue(row, ['ctipo', 'tipo'])).trim();
            const current = grouped.get(coverageCode.toUpperCase());
            if (parameter && !current.parameters.some(item => item.name.toUpperCase() === parameter.toUpperCase())) {
                current.parameters.push({ name: parameter, type: parameterType });
            }
        });

    const rows = Array.from(grouped.values());
    if (!rows.length) {
        $("<div>", {
            class: "adendos-empty",
            text: "No existen adendos configurados para las coberturas agregadas."
        }).appendTo($container);
        return;
    }

    const parameterCount = rows.reduce(
        (max, row) => Math.max(max, row.parameters.length),
        0
    );
    const $table = $("<table>", { class: "tabla-ant tabla-adendos" });
    const $thead = $("<thead>").appendTo($table);
    const $header = $("<tr>").appendTo($thead);

    ["Código", "Nombre de cobertura", "Código del adendo", "Descripción del adendo"]
        .forEach(title => $("<th>", { text: title }).appendTo($header));
    for (let index = 1; index <= parameterCount; index++) {
        $("<th>", { text: `Parametro${index}` }).appendTo($header);
    }

    const $tbody = $("<tbody>").appendTo($table);
    rows.forEach(row => {
        const $tr = $("<tr>").appendTo($tbody);
        [row.code, row.name, row.idAnexo, row.description]
            .forEach(value => $("<td>", { text: value }).appendTo($tr));

        for (let index = 0; index < parameterCount; index++) {
            const parameter = row.parameters[index] || null;
            const $cell = $("<td>").appendTo($tr);
            if (!parameter) continue;

            const controlType = tipoControlAdendo(parameter.type, parameter.name);
            const inputType = controlType === 'date' ? 'date' : controlType === 'number' || controlType === 'percentage' ? 'number' : 'text';

            const $wrapper = $("<div>", {
                class: "adendo-input-wrapper"
            }).appendTo($cell);

            const $input = $("<input>", {
                type: inputType,
                name: `adendo_${row.code}_Parametro${index + 1}`,
                placeholder: parameter.name,
                required: true
            })
                .addClass("ant-input-custom")
                .attr({
                    "data-adendo-cobertura": row.code,
                    "data-adendo-parametro": parameter.name,
                    "data-adendo-tipo": parameter.type,
                    "data-adendo-index": index + 1
                })
                .appendTo($wrapper);

            if (inputType === 'number') {
                const isPercentage = controlType === 'percentage';
                $input.attr({ step: isPercentage ? '0.01' : 'any' });
                if (isPercentage) $input.attr({ min: '0', max: '100' });
            }

            $("<span>", {
                class: "adendo-parametro-ayuda",
                text: parameter.name,
                "aria-hidden": "true"
            }).appendTo($wrapper);

            $wrapper
                .on("mouseenter", function () {
                    $(this).toggleClass("has-value-hover", Boolean($input.val().trim()));
                })
                .on("mouseleave", function () {
                    $(this).removeClass("has-value-hover");
                });

            $input.on("input", function () {
                if ($wrapper.is(":hover")) {
                    $wrapper.toggleClass("has-value-hover", Boolean($(this).val().trim()));
                }
            });
        }
    });

    $container.append($table);
}

function cargarAdendosDesdeHidden() {
    const raw = $("#hiddenAdendos").val();
    if (!raw) return;

    let data = [];
    try {
        data = JSON.parse(raw);
    } catch (error) {
        console.error("JSON inválido en hiddenAdendos");
        return;
    }

    (Array.isArray(data) ? data : []).forEach(item => {
        const coverage = String(item?.coverageCode ?? '').trim();
        if (!coverage) return;

        Object.keys(item).forEach(key => {
            const match = /^Parametro(\d+)$/i.exec(key);
            if (!match) return;

            const $input = $(`#tab4 [data-adendo-cobertura="${coverage}"][data-adendo-index="${match[1]}"]`);
            if ($input.length) {
                $input.val(item[key] ?? '');
            }
        });
    });
}

function construirAdendos() {
    const resultado = {};

    $("#tab4 input[data-adendo-cobertura]").each(function () {
        const $input = $(this);
        const coverage = String($input.attr("data-adendo-cobertura") ?? '').trim();
        const index = $input.attr("data-adendo-index");
        if (!coverage || !index) return;

        if (!resultado[coverage]) {
            resultado[coverage] = {
                coverageCode: coverage,
                coverageName: $input.closest("tr").children().eq(1).text().trim(),
                idAnexo: $input.closest("tr").children().eq(2).text().trim(),
                description: $input.closest("tr").children().eq(3).text().trim()
            };
        }

        resultado[coverage][`Parametro${index}`] = $input.val() ?? '';
    });

    return Object.values(resultado);
}

function bindEventosAdendos() {
    $("#tab4")
        .off("input.adendos change.adendos", "input[data-adendo-cobertura]")
        .on("input.adendos change.adendos", "input[data-adendo-cobertura]", function () {
            $("#hiddenAdendos").val(JSON.stringify(construirAdendos()));
        });
}

function setDefaultAdendos() {
    const $hidden = $("#hiddenAdendos");
    $hidden.val(JSON.stringify(construirAdendos()));
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
        const $table = $("<table>", { id: "tablaCobtar" }).addClass("tabla-ant");

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

            const covPolicy = (policy.Coverages || []).find(x => x.code == g.coverageCode);
            const fechaInicialDefault = formatearFecha(policy?.start);
            const fechaFinalDefault = formatearFecha(covPolicy?.end ? covPolicy.end : policy?.end);
            const $tr = $("<tr>")
                .attr("data-coverage-row", g.coverageCode)
                .attr("data-base-start", fechaInicialDefault)
                .attr("data-base-end", fechaFinalDefault);

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
                      type: "text",
                      inputmode: "decimal",
                      step: "0.01"
                    }).addClass("ant-input-custom")
                      .attr("autocomplete", "off");
                    $input.attr("data-numeric-format", "true");

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

                // ===== vigencia de la cobertura =====
                if (name.toLowerCase().includes("f. inicial")) {
                    $input.val(fechaInicialDefault);
                }

                if (name.toLowerCase().includes("f. final")) {
                    $input.val(fechaFinalDefault);
                }

                if (name.toLowerCase().includes("duración")) {
                    $input.on("change", function () {
                        recalcularVigenciasTecnico($container);
                    });
                }
            
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
        recalcularVigenciasTecnico($container);

    }catch(error){
        console.error(error);
    }
}

function recalcularVigenciasTecnico($container = $("#tab2")) {
    try {
        const rows = {};
        $container.find("tr[data-coverage-row]").each(function () {
            const $row = $(this);
            const code = String($row.attr("data-coverage-row") || "").trim();
            if (code) rows[code.toUpperCase()] = $row;
        });

        const configByCode = {};
        (configCoverages || []).forEach(config => {
            const code = String(config.coverageCode || "").trim().toUpperCase();
            if (code) configByCode[code] = config;
        });

        const calculated = {};
        const calculating = new Set();
        const resolvingRoot = new Set();
        const getField = ($row, text) => $row.find("input[data-field]").filter(function () {
            return String($(this).attr("data-field") || "").toLowerCase().includes(text);
        }).first();

        const getRootCoverageCode = code => {
            const normalizedCode = String(code || "").trim().toUpperCase();
            if (!normalizedCode || resolvingRoot.has(normalizedCode)) return normalizedCode;

            const config = configByCode[normalizedCode];
            const principal = String(config?.coberturaPrincipal ?? config?.coverageCodeDep ?? "").trim();
            if (!principal || principal === "0" || principal === "-1" || principal.toUpperCase() === "NULL"
                || principal.toUpperCase() === normalizedCode) return normalizedCode;

            resolvingRoot.add(normalizedCode);
            const root = getRootCoverageCode(principal);
            resolvingRoot.delete(normalizedCode);
            return root || normalizedCode;
        };

        const calculate = code => {
            const normalizedCode = String(code || "").trim().toUpperCase();
            if (!normalizedCode || calculated[normalizedCode]) return calculated[normalizedCode];

            const $row = rows[normalizedCode];
            if (!$row || !$row.length) return null;
            if (calculating.has(normalizedCode)) {
                console.warn(`Dependencia circular de vigencia en cobertura ${normalizedCode}`);
                return null;
            }

            calculating.add(normalizedCode);
            const config = configByCode[normalizedCode];
            const principal = String(config?.coberturaPrincipal ?? config?.coverageCodeDep ?? "").trim();
            const $duration = getField($row, "duración");
            const duration = Number($duration.val()) || 0;
            const $start = getField($row, "f. inicial");
            const $end = getField($row, "f. final");
            if (!$start.length || !$end.length) {
                calculated[normalizedCode] = null;
                calculating.delete(normalizedCode);
                return null;
            }

            const policyStart = formatearFecha(policy?.start);
            let start = String(policyStart || $row.attr("data-base-start") || $start.val() || "");
            let end = String($row.attr("data-base-end") || $end.val() || "");

            if (principal && principal !== "0" && principal !== "-1" && principal.toUpperCase() !== "NULL") {
                const rootCode = getRootCoverageCode(normalizedCode);
                const principalResult = calculate(rootCode);
                if (principalResult?.end) start = principalResult.end;
            }

            if (start) $start.val(start).prop("disabled", true);
            if (duration > 0 && start) end = sumarDiasTecnico(start, duration);
            if (end) $end.val(end).prop("disabled", true);

            const result = { start, end };
            calculated[normalizedCode] = result;
            calculating.delete(normalizedCode);
            return result;
        };

        Object.keys(rows).forEach(calculate);
    } catch (error) {
        console.error(`Error calculando vigencias de coberturas: ${error.toString()}`);
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
      } else if ($input.attr("data-numeric-format") === "true") {
        $input.val(value != null ? formatNumericInputValue(value) : "");
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
            if ($el.attr("data-numeric-format") === "true") {
                value = parseNumericInputValue(value);
            }

            resultado[coverage][field] = value;
            });

        return Object.values(resultado);

    }catch(error){
        console.error(error);
    }
}

function bindEventosCobtar() {
  $("#tab2")
    .off("input change", "input, select")
    .on("input change", "input, select", function (event) {
    if ($(this).attr("data-numeric-format") === "true") {
      formatNumericInput(this, event.type === "input");
    }
    const data = construirCobtar("#tab2");
    $("#hiddenCobtar").val(JSON.stringify(data));
    // debug opcional
    console.log(data);
  });
}

function normalizeNumericInputValue(value) {
  let text = String(value ?? "").replace(/,/g, "").replace(/[^0-9.\-]/g, "");
  const negative = text.startsWith("-");
  text = text.replace(/-/g, "");
  const dotIndex = text.indexOf(".");
  let integer = dotIndex >= 0 ? text.slice(0, dotIndex) : text;
  let decimals = dotIndex >= 0 ? text.slice(dotIndex + 1).replace(/\./g, "") : "";
  integer = integer.replace(/^0+(?=\d)/, "");
  if (!integer && (dotIndex >= 0 || decimals)) integer = "0";
  return (negative ? "-" : "") + integer + (dotIndex >= 0 ? "." + decimals.slice(0, 2) : "");
}

function formatNumericInputValue(value) {
  const normalized = normalizeNumericInputValue(value);
  if (!normalized || normalized === "-") return normalized;
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const dotIndex = unsigned.indexOf(".");
  const integer = dotIndex >= 0 ? unsigned.slice(0, dotIndex) : unsigned;
  const decimals = dotIndex >= 0 ? unsigned.slice(dotIndex + 1) : "";
  const grouped = (integer || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (negative ? "-" : "") + grouped + (dotIndex >= 0 ? "." + decimals : "");
}

function parseNumericInputValue(value) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  return normalized === "" || normalized === "-" || normalized === "." ? null : Number(normalized);
}

function formatNumericInput(input, preserveCaret) {
  if (!input) return;
  const original = String(input.value ?? "");
  const start = typeof input.selectionStart === "number" ? input.selectionStart : original.length;
  const before = original.slice(0, start);
  const normalizedBefore = normalizeNumericInputValue(before);
  const formatted = formatNumericInputValue(original);
  input.value = formatted;

  if (preserveCaret && document.activeElement === input) {
    let meaningful = 0;
    let caret = formatted.length;
    for (let index = 0; index < formatted.length; index += 1) {
      if (formatted[index] !== ",") meaningful += 1;
      if (meaningful >= normalizedBefore.length) {
        caret = index + 1;
        break;
      }
    }
    input.setSelectionRange(caret, caret);
  }
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

function sumarDiasTecnico(fechaStr, dias) {
    if (!fechaStr || !dias) return "";

    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return "";

    fecha.setDate(fecha.getDate() + Number(dias));
    return formatearFecha(fecha);
}

//Estilos
function inyectarEstilosAntdCobtar() {
  const STYLE_ID = "antd-cobtar-styles";

  $("#hiddenFormStyle").closest("form").addClass("dt-ramo-tecnico-form");

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

  /* ===== ADENDOS ===== */
  #tab4 {
    overflow: visible;
  }

  #tab4 .tabla-adendos {
    width: 100%;
    border: 1px solid #cbd1d8;
    border-collapse: collapse;
    table-layout: auto;
    font-size: 12px;
    line-height: 18px;
  }

  #tab4 .tabla-adendos th {
    background: #bfbfbf;
    color: #262626;
    font-weight: 600;
    border: 1px solid #cbd1d8;
    padding: 5px 8px;
    text-align: left;
    white-space: nowrap;
  }

  #tab4 .tabla-adendos td {
    border-top: 1px solid #cbd1d8;
    border-bottom: 1px solid #cbd1d8;
    border-left: 0;
    border-right: 0;
    padding: 5px 8px;
    vertical-align: middle;
  }

  #tab4 .tabla-adendos tbody tr:hover td {
    background: #b7d7ff;
  }

  #tab4 .tabla-adendos td:first-child {
    font-weight: 500;
    background: #fafafa;
  }

  #tab4 .tabla-adendos tbody tr:hover td:first-child {
    background: #b7d7ff;
  }

  #tab4 .adendo-input-wrapper {
    position: relative;
    min-width: 140px;
  }

  #tab4 .adendo-input-wrapper .ant-input-custom {
    width: 100%;
    height: 32px;
    padding: 4px 11px;
    color: #262626;
    background: #fff;
    border: 1px solid #b8c4d1;
    border-radius: 6px;
    box-sizing: border-box;
  }

  #tab4 .adendo-input-wrapper .ant-input-custom::placeholder {
    color: #3f4b57 !important;
    opacity: 1 !important;
  }

  #tab4 .adendo-input-wrapper .ant-input-custom:hover {
    border-color: #8da9c2;
  }

  #tab4 .adendo-input-wrapper .ant-input-custom:focus {
    border-color: #1677ff;
    box-shadow: 0 0 0 2px rgba(22,119,255,0.2);
    outline: none;
  }

  #tab4 .adendo-parametro-ayuda {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 20;
    display: block;
    width: max-content;
    max-width: 240px;
    padding: 4px 8px;
    color: #262626;
    background: #fff;
    border: 1px solid #b8c4d1;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    font-size: 11px;
    line-height: 16px;
    white-space: normal;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-2px);
    transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
  }

  #tab4 .adendo-input-wrapper.has-value-hover .adendo-parametro-ayuda {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
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

    /* ===== INPUTS DEL FORMULARIO ===== */
    .dt-ramo-tecnico-form input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),
    .dt-ramo-tecnico-form select,
    .dt-ramo-tecnico-form textarea {
        border: 1px solid #b8c4d1 !important;
        border-radius: 6px;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .dt-ramo-tecnico-form input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):hover,
    .dt-ramo-tecnico-form select:hover,
    .dt-ramo-tecnico-form textarea:hover {
        border-color: #8da9c2 !important;
    }

    .dt-ramo-tecnico-form input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):focus,
    .dt-ramo-tecnico-form select:focus,
    .dt-ramo-tecnico-form textarea:focus {
        border-color: #1677ff !important;
        box-shadow: 0 0 0 2px rgba(22,119,255,0.2);
        outline: none;
    }

    .dt-ramo-tecnico-form input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):disabled,
    .dt-ramo-tecnico-form select:disabled,
    .dt-ramo-tecnico-form textarea:disabled {
        border-color: #b8c4d1 !important;
        background: #f5f5f5;
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
    polizaConfirmada = esPolizaEmitida();
    bloquearCoberturas = polizaConfirmada;

    const toolbarHtml = `
      <div id="toolbarCoberturas">

        <button
          type="button"
          id="btnGestionarCoberturas"
          class="ant-btn ant-btn-primary btn-gestionar-cob"
          ${bloquearCoberturas ? 'disabled' : ''}
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
            ${c.mandatory || bloquearCoberturas ? 'disabled' : ''}
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
                      ${bloquearCoberturas ? 'disabled': ''}
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

    if(bloquearCoberturas){
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
          await cargarAdendos();
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

function esPolizaEmitida() {
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

function aplicarRestriccionesEdicion() {
    const $form = $('#hiddenFormStyle').closest('form');
    if (esPolizaEmitida()) {
        $form.find('input, select, textarea').each(function () {
            const $campo = $(this);
            if ($campo.attr('type') === 'hidden') return;

            if ($campo.is(':checkbox, :radio')) {
                $campo.prop('disabled', true);
            } else if ($campo.is('select')) {
                $campo.css({
                    pointerEvents: 'none',
                    backgroundColor: '#f5f5f5',
                    color: '#8c8c8c'
                });
            } else {
                $campo.prop('readonly', true);
            }
        });
    }

    if (!isEndorsment()) return;

    $form.find('input, select, textarea').each(function () {
        const $campo = $(this);
        const id = $campo.attr('id');
        if (id && camposEditablesEnEndoso.has(id)) {
            $campo
                .prop('disabled', false)
                .prop('readonly', false)
                .css({ pointerEvents: '', backgroundColor: '', color: '' })
                .removeClass('disabled readonly-style select-readonly');
        }
    });

    habilitarOrdenProcederEnEndoso();
}

function habilitarOrdenProcederEnEndoso() {
    if (!isEndorsment()) return;

    let $campos = $('#ckOrdenProceder, input[name="ckOrdenProceder"]')
        .add($('input, button').filter(function () {
            const texto = String($(this).attr('id') || '') + ' ' + String($(this).attr('name') || '');
            return texto.toLowerCase().replace(/[^a-z0-9]/g, '').includes('ordenproceder');
        }));

    // Si el motor no conserva el id del control, ubicamos el input asociado
    // a la etiqueta visible "Orden de Proceder".
    $('label').filter(function () {
        return $(this).text().trim().toLowerCase() === 'orden de proceder';
    }).each(function () {
        const $label = $(this);
        const forId = $label.attr('for');
        if (forId) $campos = $campos.add($('#' + forId));
        $campos = $campos.add($label.closest('.form-group, .ant-form-item, .field, td, div').find('input, button'));
    });

    $campos
        .prop('disabled', false)
        .prop('readonly', false)
        .removeAttr('disabled')
        .removeAttr('aria-disabled')
        .css({ pointerEvents: '', backgroundColor: '', color: '' })
        .removeClass('disabled readonly-style select-readonly');
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
            aplicarRestriccionesEdicion();

            setDefaultData();

            //Renderizado de opción para agregar coberturas
            await setProductCoverages();
            renderToolbarCoberturas();
            await bindEventosCoberturas();

            await cargarCobtarDinamico();
            await cargarAdendos();
            aplicarRestriccionesEdicion();
            validaInputs();

            await cargarCatalogos();
            aplicarRestriccionesEdicion();
            if (isEndorsment()) {
                // Algunos controles base se repintan al finalizar la carga de
                // catalogos; reaplicar el desbloqueo deja el checkbox editable.
                setTimeout(habilitarOrdenProcederEnEndoso, 0);
                setTimeout(habilitarOrdenProcederEnEndoso, 300);
                setTimeout(habilitarOrdenProcederEnEndoso, 1000);
            }

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
