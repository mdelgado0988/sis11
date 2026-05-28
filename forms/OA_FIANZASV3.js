var me = this;
var vDetails = [];
const modulo = window.location.href.split('/')[4].toLowerCase();
let policyId = window.location.href.split('/')[5] ?? 888;
let elementId = 0;
let policy;
let configCobtar;
let avancesProyecto = [];

$("#rut").css({
  backgroundColor: "#f5f5f5",
  cursor: "not-allowed"
});

// 1. RESTRICCIÓN: Solo permitir números y un (1) punto decimal mientras escribe
$("#suma_afianzada").on("keypress", function(e) {
    const charCode = (e.which) ? e.which : e.keyCode;
    const value = $(this).val();

    // Permitir solo números (48-57) y el punto (46)
    if (charCode !== 46 && charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }

    // Evitar más de un punto decimal
    if (charCode === 46 && value.indexOf('.') !== -1) {
        return false;
    }
});

// 2. FORMATEO: Aplicar 999,999.99 al perder el foco
$("#suma_afianzada").on("blur", function() {
    let valor = $(this).val().replace(/[^\d.]/g, "");
    let numero = parseFloat(valor);

    if (!isNaN(numero)) {
        // Formatear con comas y 2 decimales
        let formateado = numero.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        $(this).val(formateado);
    } else {
        $(this).val(""); 
    }
});

// 3. LIMPIEZA: Quitar comas al entrar para poder editar el número
$("#suma_afianzada").on("focus", function() {
    let valor = $(this).val().replace(/,/g, "");
    $(this).val(valor);
});

// 1. RESTRICCIÓN: Solo permitir números y un (1) punto decimal mientras escribe
$("#valor_garantia").on("keypress", function(e) {
    const charCode = (e.which) ? e.which : e.keyCode;
    const value = $(this).val();

    // Permitir solo números (48-57) y el punto (46)
    if (charCode !== 46 && charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }

    // Evitar más de un punto decimal
    if (charCode === 46 && value.indexOf('.') !== -1) {
        return false;
    }
});

// 2. FORMATEO: Aplicar 999,999.99 al perder el foco
$("#valor_garantia").on("blur", function() {
    let valor = $(this).val().replace(/[^\d.]/g, "");    
    const formateado = formatear(valor);
    $(this).val(formateado);
});

// 3. LIMPIEZA: Quitar comas al entrar para poder editar el número
$("#valor_garantia").on("focus", function() {
    let valor = $(this).val().replace(/,/g, "");
    $(this).val(valor);
});

function evitarSugerencias(){
    const input = document.getElementById('nombre');
    //para evitar sugerencias
    input.setAttribute('autocomplete', 'off');    
}

function cargarCumuloAsync() {
  return new Promise(resolve => {
    setTimeout(() => {
      
        me.exe("ExeChain", { chain: "cmdGetAcummulationSuretyBond", context: `{ policyId: ${policyId}, type: '' }` }).then(res => {

            const cumulos = res.outData ?? [];

            const html = cumulos.map(x => `<div>${x.accumulationType} ${x.accumulation} / ${x.limit}</div>`).join("");
            $("#contenedorCobtar .statusBar").empty().html(html);

        });      

      resolve();
    }, 2000);
  });
}

function formatear(valor){
    let numero = parseFloat(valor);

    if (!isNaN(numero)) {
        // Formatear con comas y 2 decimales
        let formateado = numero.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return formateado;
    } else {
        return valor;
    }
}

////////////////////////////////////////////////////////////////////////////////
// Renderización de campos por pestañas
////////////////////////////////////////////////////////////////////////////////

function inicializarTabs(containerSelector = "#contenedorCobtar") {
    try{
        
        
        const $container = $(containerSelector);

        const $tabs = $(`
            <div class="tabs-wrapper">
                <div class="tabs-header">
                <div class="tab-link active" data-tab="tab1">Datos Generales</div>
                <div class="tab-link" data-tab="tab3">Referencias</div>
                <div class="tab-link" data-tab="tab4">Proyecto y Garantías</div>
                <div class="tab-link" data-tab="tab5">Avance de Proyecto</div>
                <div class="tab-link" data-tab="tab2">Tarifas de Entrada</div>
                </div>

                <div id="tab1" class="tab-content active"></div>
                <div id="tab2" class="tab-content"></div>
                <div id="tab3" class="tab-content"></div>
                <div id="tab4" class="tab-content"></div>
                <div id="tab5" class="tab-content"></div>
            </div>
            <div class="statusBar" style="
                margin-top:16px;
                padding:10px 12px;
                border-radius:6px;
                background:#fff1f0;
                border:1px solid #ffa39e;
                color:#cf1322;
                font-size:13px;
            ">
                Cargando cúmulo...
            </div>
            `);

        $container.empty().append($tabs);

        // evento tabs
        $container.off("click", ".tab-link").on("click", ".tab-link", function () {
            const tabId = $(this).data("tab");

            $container.find(".tab-link").removeClass("active");
            $(this).addClass("active");

            $container.find(".tab-content").removeClass("active");
            $container.find("#" + tabId).addClass("active");

            if (tabId === "tab5") {
                renderAvancesProyecto();
            }

        });

        //Cargo la info guardada de avances
        loadSavedAvanceData();

        $container.off("click", "#btnNuevoAvance").on("click", "#btnNuevoAvance", function () {
            abrirModalAvance();
        });

        $container.off("click", ".btnEditarAvance").on("click", ".btnEditarAvance", function () {        
            const index = $(this).data("index");
            abrirModalAvance(avancesProyecto[index], index);
        });

        $container.off("click", ".btnEliminarAvance").on("click", ".btnEliminarAvance", function () {
            const index = $(this).data("index");
            avancesProyecto.splice(index, 1);
            pintarTablaAvances();
            persistirAvanceObra();
        });

    }catch(error){
        console.error(error);
    }
}

function moverCamposATabGeneral() {
    try{
    
        const $tab1 = $("#tab1");
        const $tabReferencias = $("#tab3");
        const $tabProyectos = $("#tab4");

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
            $tabReferencias.append($row);
            }
        });

        $(".ttab").each(function () {
            const $row = $(this).closest(".row");

            if ($row.length && !movedRows.has($row[0])) {
            movedRows.add($row[0]);
            $tabProyectos.append($row);
            }
        });

    }catch(error){
        console.error(error);
    }
}

////////////////////////////////////////////////////////////////////////////////
// TAB de avance de proyecto
////////////////////////////////////////////////////////////////////////////////

function renderAvancesProyecto() {
    try{

        const $tab = $("#tab5");

        $tab.empty();

        $tab.html(`
            <div style="width:100%; display:block;">

                <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                    <button class="ant-btn ant-btn-primary" id="btnNuevoAvance">
                        + Agregar
                    </button>
                </div>

                <table class="tabla-ant" id="tablaAvances" style="width:100%; table-layout:fixed;">
                    <thead>
                        <tr>
                            <th style="width:120px;">Fecha</th>
                            <th>Descripción</th>
                            <th style="width:180px; text-align:center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>

            </div>
        `);

        pintarTablaAvances();

    }catch(error){
        console.error(error);
    }
}

function pintarTablaAvances() {
    try{
     
        const $tbody = $("#tablaAvances tbody");
        $tbody.empty();

        avancesProyecto.forEach((a, index) => {
            $tbody.append(`
            <tr>
                <td>${a.fecha}</td>
                <td>${a.descripcion}</td>
                <td>
                <button class="ant-btn ant-btn-link btnEditarAvance" data-index="${index}">Editar</button>
                <button class="ant-btn ant-btn-link ant-btn-dangerous btnEliminarAvance" data-index="${index}">Eliminar</button>
                </td>
            </tr>
            `);
        });
        
    }catch(error){
        console.error(error);
    }
}

function abrirModalAvance(data = null, index = null) {
    try{
    
        const isEdit = data !== null;
        
        const $modalContent = $(`
            <div>
                <h3 style="margin-bottom:16px; font-size:16px; font-weight:500;">
                    ${isEdit ? "Editar Avance" : "Nuevo Avance"}
                </h3>

                <form>

                    <div style="margin-bottom:12px;">
                        <label style="display:block; margin-bottom:4px; font-size:13px; color:rgba(0,0,0,0.85);">
                            Fecha
                        </label>
                        <input type="date" id="avFecha"
                            style="
                                width:100%;
                                height:32px;
                                padding:4px 11px;
                                font-size:14px;
                                border:1px solid #d9d9d9;
                                border-radius:6px;
                                outline:none;
                                box-sizing:border-box;
                            "
                        />
                    </div>

                    <div style="margin-bottom:12px;">
                        <label style="display:block; margin-bottom:4px; font-size:13px;">
                            Descripción
                        </label>
                        <textarea id="avDescripcion"
                            style="
                                width:100%;
                                min-height:70px;
                                padding:6px 11px;
                                font-size:14px;
                                border:1px solid #d9d9d9;
                                border-radius:6px;
                                outline:none;
                                box-sizing:border-box;
                                resize:vertical;
                            "
                        ></textarea>
                    </div>

                    <div style="text-align:right; margin-top:16px;">
                        <button type="button" id="btnCancelarAvance"
                            style="
                                padding:4px 14px;
                                border-radius:6px;
                                border:1px solid #d9d9d9;
                                background:#fff;
                                cursor:pointer;
                                margin-right:8px;
                            "
                        >
                            Cancelar
                        </button>

                        <button type="button" id="btnGuardarAvance"
                            style="
                                padding:4px 14px;
                                border-radius:6px;
                                border:1px solid #1677ff;
                                background:#1677ff;
                                color:#fff;
                                cursor:pointer;
                            "
                        >
                            Guardar
                        </button>
                    </div>

                </form>
            </div>
        `).css({
            display: 'none',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: '24px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            width: '420px',
            maxWidth: '90vw',
            fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial`,
            fontSize: '14px',
            color: 'rgba(0,0,0,0.85)'
        });

        const $mask = $('<div></div>').css({
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 9999
        });

        $("body").append($mask).append($modalContent);

        $mask.show();
        $modalContent.show();

        if (isEdit) {
            $modalContent.find("#avFecha").val(data.fecha || "");
            $modalContent.find("#avDescripcion").val(data.descripcion || "");
        }

        $modalContent.find("input, textarea").on("input", function () {
            $(this).css({
                border: "1px solid #d9d9d9",
                boxShadow: "none"
            });
            $(this).next(".error-msg").remove();
        });

        $modalContent.find("#btnCancelarAvance").on("click", function () {
            $mask.remove();
            $modalContent.remove();
        });

        $modalContent.find("#btnGuardarAvance").on("click", function () {

            const $fecha = $modalContent.find("#avFecha");
            const $desc  = $modalContent.find("#avDescripcion");

            let isValid = true;

            $modalContent.find(".error-msg").remove();

            // reset visual
            [$fecha, $desc].forEach($el => {
                $el.css({
                    border: "1px solid #d9d9d9",
                    boxShadow: "none"
                });
            });

            // validar fecha
            if (!$fecha.val()) {
                isValid = false;
                marcarError($fecha);
            }

            // validar descripción
            if (!$desc.val().trim()) {
                isValid = false;
                marcarError($desc);
            }

            if (!isValid) return;

            const obj = {
                fecha: $fecha.val(),
                descripcion: $desc.val()
            };

            if (isEdit) {
                avancesProyecto[index] = obj;
            } else {
                avancesProyecto.push(obj);
            }

            $mask.remove();
            $modalContent.remove();
            pintarTablaAvances();
            persistirAvanceObra();
        });

        function marcarError($el, mensaje = "Campo requerido") {

            $el.css({
                border: "1px solid #ff4d4f",
                boxShadow: "0 0 0 2px rgba(255,77,79,0.2)"
            });

            // eliminar mensaje previo
            $el.next(".error-msg").remove();

            // agregar mensaje
            $(`<div class="error-msg" style="
                color:#ff4d4f;
                font-size:12px;
                margin-top:4px;
            ">${mensaje}</div>`).insertAfter($el);
        }

    }catch(error){
        console.error(error);
    }

}

function persistirAvanceObra(){
    $("#hiddenAvanceProyecto").val(JSON.stringify(avancesProyecto ?? []));
}

function loadSavedAvanceData(){
    try{

        if($("#hiddenAvanceProyecto").val() == '')
            return;

        avancesProyecto = JSON.parse($("#hiddenAvanceProyecto").val());
    } catch(error){
        console.error(`Error cargando avances del proyecto: ${error.toString()}`);
    }    
}

////////////////////////////////////////////////////////////////////////////////
// SECCIÓN DE TARIFAS MANUALES
////////////////////////////////////////////////////////////////////////////////

function prepareContainer(){
    try{
    
        //Creo un div y lo agregamos luego del campo hiddenValida para trabajar con dicho div como contenedor
        const $hidden = $('#hiddenCobtar');
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

async function listarCobtar(){
    try{
    
        const tableCobtar = await me.exe("GetFullTable", {table : "cfgCobtar"});
        if(!tableCobtar.ok)
            console.error("Error leyendo configuración de tarifas");

        configCobtar = mapearTablaConfig(tableCobtar.outData ?? []);
        configCobtar = configCobtar.filter(x => policy.Coverages.find(b => b.code == x.coverageCode) && x.productCode == policy.productCode);

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
        $container.empty();

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

            // ===== constante fecha inicial =====
            const covPolicy = policy.Coverages.find(x => x.code == g.coverageCode);
            const isBasic = covPolicy?.basic ?? false;
            const FECHA_INICIAL_DEFAULT = formatearFecha(covPolicy?.start ? covPolicy.start : (isBasic ? policy?.start : policy?.end));
            const FECHA_FINAL_DEFAULT = formatearFecha(covPolicy?.end ? covPolicy.end : policy.end);

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

            let fechaInicial = FECHA_INICIAL_DEFAULT;
            let diasVigencia = 0;

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
                $input = $("<input>", { type: "number" })
                    .addClass("ant-input-custom");

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

                // ===== lógica especial =====

                // F. Inicial
                if (name.toLowerCase().includes("f. inicial")) {
                    $input.val(FECHA_INICIAL_DEFAULT);
                    fechaInicial = FECHA_INICIAL_DEFAULT;
                }

                // F. Final
                if (name.toLowerCase().includes("f. final")) {
                    $input.val(FECHA_FINAL_DEFAULT);
                }

                // Vigencia (días)
                if (name.toLowerCase().includes("duración")) {
                $input.on("change", function () {
                    diasVigencia = Number($(this).val()) || 0;

                    const fechaFinal = sumarDias(fechaInicial, diasVigencia);

                    $tr.find("input[data-field*='Final']").val(fechaFinal);
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

//Estilos
function inyectarEstilosAntdCobtar() {
  const STYLE_ID = "antd-cobtar-styles";

  // evita duplicados
  if ($("#" + STYLE_ID).length) return;

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

  `;

  $("<style>", {
    id: STYLE_ID,
    type: "text/css"
  }).html(css).appendTo("head");
}

function sumarDias(fechaStr, dias) {
    if (!fechaStr || !dias) return "";

    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return "";

    fecha.setDate(fecha.getDate() + Number(dias));
    return fecha.toISOString().split("T")[0]; // yyyy-MM-dd
}

function formatearFecha(fecha) {
    const f = new Date(fecha);
    if (isNaN(f)) return "";

    const yyyy = f.getFullYear();
    const mm = String(f.getMonth() + 1).padStart(2, "0");
    const dd = String(f.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}

//////////////////////////////////////////////////////////////////////////////////////////
//AUTOCOMPLETE QUE PERMITE BÚSQUEDA POR CÓDIGOS, NOMBRES Y IDs
//////////////////////////////////////////////////////////////////////////////////////////

async function obtenerContactos(pagina, cantidad, search) {
    try {
        
        //reemplazamos cualquier caracter especial para evitar inyección de código o errores en la consulta
        search = search.replace(/[%_]/g, '\\$&');

        // filtro por nombre (puedes ampliar luego)
        let filters = `isPerson = 0`;

        //si search es numérico, también busco por identificación y nationalId (noCobis)
        const isNumeric = /^\d+$/.test(search);
        if(isNumeric) {
            filters += ` AND (nationalId = '${search}' OR id = ${search})`;
        }
        else {

            //si trae números y texto lo busco como identificación, sino, como nombre
            //Valida si trae números
            const hasNumbers = /\d/.test(search);
            if (hasNumbers) {
                filters += ` AND (cnp LIKE '${search}%' OR passport LIKE '${search}%' OR nif LIKE '${search}%')`;
            } else {
                filters += `AND TRIM(CONCAT_WS(' ', name, middlename, surname1, surname2)) LIKE '${search}%'`;
            }
        }
        
        const response = await me.exe("GetContacts", {
            size: cantidad,
            page: pagina,
            filter: filters
        });

        const data = response.outData.map(con => ({
            nombreCompleto: [
                con.name,
                con.middlename,
                con.surname1,
                con.surname2
            ]
            .map(x => (x ?? '').trim())
            .filter(x => x)
            .join(' '),

            identificacion: con.isPerson == true 
                ? (con.idType == "PAS" ? con.passport : con.cnp) 
                : (con.nif ?? ''),

            noCobis: con.nationalId ?? 0,
            codigo: con.id ?? 0
        }));

        const total = response.total;

        // Retornamos el objeto con items y total
        return { items: data, total: total };

    } catch (error) {
        console.error("Error al obtener consorciados:", error);
        return { items: [], total: 0 }; // fallback si falla
    }
}

function agregarAutocomplete(inputSelector, cantidadPorPagina = 5) {
    try {
        const $input = $(inputSelector);
        let paginaActual = 0;
        let totalResultados = 0;
        let filtroActual = "";
        let $dropdown;

        // control de selección válida
        let selectedId = null;

        function limpiarCampos() {
            $input.val("");
            $("#rut").val("");
            $("#cci_rif_afavor").val("");
            selectedId = null;
        }

        async function cargarPagina(pagina, filtro) {
            try {
                const data = await obtenerContactos(pagina, cantidadPorPagina, filtro);
                totalResultados = data.total;
                return data.items;
            } catch (error) {
                return [];
            }
        }

        async function mostrarDropdown(filtro) {
            try {
                filtroActual = filtro;
                paginaActual = 0;
                const items = await cargarPagina(paginaActual, filtro);

                if (!items.length) return;

                if ($dropdown) {
                    $dropdown.remove();
                    $dropdown = null;
                }

                $dropdown = $("<div></div>")
                    .addClass("autocomplete-dropdown")
                    .css({
                        border: "1px solid #d9d9d9",
                        background: "#fff",
                        zIndex: 10001,
                        maxHeight: "200px",
                        overflow: "auto",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                    });

                function renderItems(items) {
                    try {
                        $dropdown.empty();

                        items.forEach(item => {
                            const $item = $("<div></div>").css({
                                padding: "8px 12px",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column"
                            });

                            const $line1 = $("<div></div>").html(
                                `<b>${item.codigo || ''}</b> - ${item.nombreCompleto || ''}`
                            );

                            const $line2 = $("<div></div>").text(
                                `Identificación: ${item.identificacion || ''}`
                            ).css({ fontSize: "12px", color: "#666" });

                            const $line3 = $("<div></div>").text(
                                `Cobis: ${item.noCobis || ''}`
                            ).css({ fontSize: "12px", color: "#666" });

                            $item.append($line1, $line2, $line3);

                            $item.hover(
                                function () { $(this).css("background", "#bae7ff"); },
                                function () { $(this).css("background", "white"); }
                            );

                            $item.click(function () {
                                selectedId = item.codigo; // ✅ selección válida

                                $input.val(item.nombreCompleto);
                                $("#rut").val(item.identificacion);
                                $("#cci_rif_afavor").val(item.codigo);

                                if ($dropdown) {
                                    $dropdown.remove();
                                    $dropdown = null;
                                }

                                cargaContacto();
                            });

                            $dropdown.append($item);
                        });

                        const totalPaginas = Math.ceil(totalResultados / cantidadPorPagina) - 1;

                        if (totalPaginas > 0) {
                            const $paginacion = $("<div></div>").css({
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "4px 8px",
                                borderTop: "1px solid #d9d9d9"
                            });

                            const $prev = $("<button>«</button>")
                                .prop("disabled", paginaActual === 0);

                            const $next = $("<button>»</button>")
                                .prop("disabled", paginaActual === totalPaginas);

                            $prev.click(async () => {
                                if (paginaActual > 0) {
                                    paginaActual--;
                                    const items = await cargarPagina(paginaActual, filtroActual);
                                    renderItems(items);
                                }
                            });

                            $next.click(async () => {
                                if (paginaActual < totalPaginas) {
                                    paginaActual++;
                                    const items = await cargarPagina(paginaActual, filtroActual);
                                    renderItems(items);
                                }
                            });

                            $paginacion.append($prev, $next);
                            $dropdown.append($paginacion);
                        }

                    } catch (error) {
                        console.error(error);
                    }
                }

                renderItems(items);

                $("body").append($dropdown);
                posicionarDropdown($input, $dropdown);

            } catch (error) {
                console.error(error);
            }
        }

        // input handler
        $input.off("input").on("input", function () {
            const valor = $(this).val().trim();

            selectedId = null; // ❌ invalida selección

            if (!valor) {
                limpiarCampos();
                if ($dropdown) {
                    $dropdown.remove();
                    $dropdown = null;
                }
                return;
            }

            mostrarDropdown(valor);
        });

        // click fuera
        $(document).off("mousedown.dropdownClose").on("mousedown.dropdownClose", function (e) {
            if (
                $dropdown &&
                !$input.is(e.target) &&
                !$dropdown.is(e.target) &&
                $dropdown.has(e.target).length === 0
            ) {
                $dropdown.remove();
                $dropdown = null;

                // si no seleccionó nada válido → limpiar
                if (!selectedId) {
                    limpiarCampos();
                }
            }
        });

    } catch (error) {
        console.error(`Error en autocomplete: ${error.toString()}`);
    }
}

function posicionarDropdown($input, $dropdown) {
    const offset = $input.offset();

    $dropdown.css({
        position: "absolute",
        top: offset.top + $input.outerHeight(),
        left: offset.left,
        width: $input.outerWidth()
    });
}

function cargaContacto() {
    const rutVal = $("#rut").val();
    if (!rutVal) return;

    me.exe("GetCurrentUser").then(j => {
        var ejec = j.outData.email;
        const vquery = `
            SELECT detalle.IDCONTACTO AS IDCONTACTO
            FROM [Table] tbl
            CROSS APPLY OPENJSON([tbl].[data]) WITH ( CORREO NVARCHAR(MAX) '$[1]', IDCONTACTO NVARCHAR(MAX) '$[2]' ) AS detalle
            WHERE [tbl].[id]='1166' AND detalle.CORREO = '${ejec}'`;

        me.exe('DoQuery', { sql: vquery }).then(h => {
            if (!h.outData || h.outData.length === 0) return;
            var idcontacto = h.outData[0].IDCONTACTO;
            var nid = "'" + rutVal + "'";
            
            const consulta = `
                SELECT con.* FROM Contact con
                INNER JOIN (
                    SELECT id AS contactId, MIN(CASE WHEN LOWER(dto.name) = 'ejecutivo1' THEN ISNULL(dto.userData,'') END) ej1
                    FROM Contact CROSS APPLY OPENJSON(genericField) WITH (name NVARCHAR(MAX) '$.name', userData NVARCHAR(MAX) '$.userData[0]') dto 
                    GROUP BY id 
                ) datForm ON con.id = datForm.contactId AND datForm.ej1='${idcontacto}'
                WHERE con.nif=${nid}`;

            me.exe("DoQuery", { sql: consulta }).then(mOutData => {
                if (mOutData.outData && mOutData.outData[0]) {
                    $('.nocontacto').hide();
                    let contact = mOutData.outData[0];
                    $("#contactid, #cci_rif_afavor-preview").val(contact.id);
                    let nombreComp = contact.isPerson === false ? contact.surname2 : `${contact.name} ${contact.surname1} ${contact.surname2}`;
                    $("#nombre").val(nombreComp).removeClass("has-custom-error").addClass("ant-input");
                    $(".nombre1").remove();
                } else {
                    $("#contactid, #nombre").val("");
                    $(".nombre1").remove();
                    $("#nombre").parent().append('<span class="text-danger nombre1">No encontrado o no asignado</span>');
                    $("#nombre").addClass("has-custom-error");
                }
                if (typeof puedeContinuar === "function") puedeContinuar();
            });
        });
    });
}

const loadDataTable = async ({
    reference,
    tableName,
    indexCode,
    indexDisplay,
}) => {
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
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const onDocumentReady = async () => {    
    
    //Renderización de tab y campos dinámicos
    inyectarEstilosAntdCobtar();
    prepareContainer();        
    inicializarTabs("#contenedorCobtar");    
    moverCamposATabGeneral();   
    evitarSugerencias();
    agregarAutocomplete("#nombre");
    
    policy = await getPolicyData(policyId);
    
    $('#policyStart').val(policy.Start);
    $('#policyEnd').val(policy.End);
    $('#suma_afianzada').prop("readOnly", true);
    $('#suma_afianzada').val(formatear(policy.insuredSum));
    await listarCobtar();    
    renderTablaAgrupada(configCobtar);
    validaInputs();
    cargarCobtarDesdeHidden("#hiddenCobtar", "#tab2");
    bindEventosCobtar();

    //Voy a validar si no hay nada en el hidden de cobtar lo voy a cargar con los datos por default
    setDefaultCobtar();    

    await loadDataTable({reference:'#clase_riesgo',tableName:'actividadfianza',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#actividad',tableName:'actividadfianza',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#tipo_vigencia',tableName:'tipovigencia',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#vigencia_fianza',tableName:'vigenciafianza',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#tipo_licitacion',tableName:'tipolicitacion',indexCode:0,indexDisplay:1});
    cargarCumuloAsync();

};

async function getPolicyData(policyId) {
    const result = await me.exe('LoadEntity', {
        entity: 'LifePolicy',
        fields: '[id],[insuredSum],[start],[end], productCode',
        filter: `id=${policyId}`,
        noTracking: true
    });
    let policy = result.outData || {};

    const coverages = await me.exe('LoadEntities', {
        entity: 'LifeCoverage',
        fields: 'code, name, basic, [start], [end]',
        filter: `lifePolicyId = ${policyId}`,
        noTracking: true
    });
    policy.Coverages = coverages.outData ?? [];

    return policy;
}

$(document).ready(() => {
    setTimeout(onDocumentReady, 500);
});

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
