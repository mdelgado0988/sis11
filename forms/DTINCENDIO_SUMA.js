/*
Name: DTINCENDIO_SUMA
Author: Ernesto Garcia
Description: Formulario generico
Categpry: FORM
Version: 1.01
CreateDate: 19-11-2025
LastModificate: 22-12-2025 - Mike Ortiz
*/

const me = this;    
const policyId = window.location.href.split('/')[5] || 871;
const isEndorsment = window.location.href.includes('tab12');
let configCobtar;
let isNew = false;
let policy = {};
let insuredObject = {};
let Edificios = [];
let Barriadas = [];
let btnSave = {};
let polizaConfirmada = false;

function setCssStyle(){
    const estilo = document.createElement('style');
    estilo.innerHTML = `
    /* CSS */
    .select-readonly {
        pointer-events: none; /* Bloquea clics del mouse */
        background-color: #e9ecef; 
        color: #6c757d;
        cursor: not-allowed;
        /* Opcional: quitar borde de foco */
        outline: none;
    }`;

    document.head.appendChild(estilo);

}

function setConfigView(){
    setCssStyle()
  const tabsHtml = `
    <ul id="customSectionTabs" class="nav nav-tabs">
        <li class="nav-item"><a href="" data-target="#tabHome" data-toggle="tab" class="nav-link small text-uppercase active">Datos del Objeto</a></li>   
        <li class="nav-item"><a href="" data-target="#tabAddress" data-toggle="tab" class="nav-link small text-uppercase">Dirección del Riesgo</a>
        <li class="nav-item"><a href="" data-target="#tabRenovation" data-toggle="tab" class="nav-link small text-uppercase">Datos Renovación</a>
        <li class="nav-item"><a href="" data-target="#tabTarifas" data-toggle="tab" class="nav-link small text-uppercase">Tarifas</a>
    </li>

    </ul> 
    <div class="tab-content"> 
        <div id="tabHome" class="tab-pane active" style="padding: 1em;">
        </div>
        <div id="tabAddress" class="tab-pane" style="padding: 1em;">
        </div>
        <div id="tabRenovation" class="tab-pane" style="padding: 1em;">
        </div>
        <div id="tabTarifas" class="tab-pane" style="padding: 1em;">
        </div>
    </div>
  `;

    const form = document.getElementById('objectForm') || document.getElementById('fb-renderobjectForm') || document.getElementById('fb-render')
        || document.getElementById('fb-rendernewInsuredObjects') || document.getElementById('fb-renderoldInsuredObjects');
    if(!document.getElementById('customSectionTabs')){
        $(form).append(tabsHtml);
        // Activate the tabs' functionality 
        $('#customSectionTabs a').on('click', function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    }

    $(`#${ form.id }-row-row-1`).appendTo('#tabHome'); // objectForm-row-row-1
    $(`#${ form.id }-row-row-2`).appendTo('#tabAddress');
    $(`#${ form.id }-row-row-3`).appendTo('#tabRenovation');
    $(`#${ form.id }-row-row-4`).appendTo('#tabTarifas');
}

const loadPolicy = async () => {

    const result = await me.exe('RepoLifePolicy', {
        operation: 'GET',
        include: ["Insureds","Coverages"],
        filter: `id=${policyId}`,
        noTracking: true
    });
    policy = result.outData?.[0] || {};

    $("#txtSA").prop("readonly", true);
    //$("#txtSA").val(policy?.insuredSum || '');
};


/********************************************/
/* EVENTOS */
/********************************************/
const changeCountry = async () => {
    const countryCode = $("#cmbPais").val();
    $('#txtEdificios').prop('required', true);
    $('#txtBarriadas').prop('required', true);
    limpiarYBloquear(["#cmbMunicipio","#cmbSector"],false);
    await loadTableQuery({reference:'#cmbProvincia',tableCommand:'RepoStateCatalog',filter:`[countryCode]='${countryCode}'`});
};

const changeProvincia = async () => {
  try {

    const stateCode = $("#cmbProvincia").val();
    $('#txtEdificios').prop('required', true);
    $('#txtBarriadas').prop('required', true);
    limpiarYBloquear(["#cmbSector"],false);
    await loadTableQuery({reference:'#cmbMunicipio',tableCommand:'RepoCityCatalog',filter:`[stateCode]='${stateCode}'`});
    
    //valido selección de la zona cresta
    debugger;
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

const changeMunicipio = async () => {
    const cityCode = $("#cmbMunicipio").val();
    $('#txtEdificios').prop('required', true);
    $('#txtBarriadas').prop('required', true);    
    await loadTableQuery({reference:'#cmbSector',tableCommand:'RepoSectorCatalog',filter:`[cityCode]='${cityCode}'`});
};

const changeSector = async () => {
    limpiarYBloquear(["#txtEdificios"], false);
    limpiarYBloquear(["#txtBarriadas"], false);
    await cargaEdificio(true);
    await cargaBarriada(true);
    
     $('#txtEdificios').prop('required', true);
     $('#txtBarriadas').prop('required', true);
    const barriadas = $('#txtBarriadas').data('source') || [];
    const edificios = $('#txtEdificios').data('source') || [];
  
     if(barriadas.length === 0 && edificios.length === 0){
        me.message.error('No se encontró barriada o edificios en la direccion ingresada')
    }
};

const changeBarriada = async() => {
    $('#txtEdificios').prop('required', false);
    limpiarYBloquear(["#txtEdificios"],true);
}

const changeEdificio = async() => {
    $('#txtBarriadas').prop('required', false);
    limpiarYBloquear(["#txtBarriadas"],true);
    await changeEdifMsg();
}

const loadEventField = async () => {
    $("#cmbPais").on("change", changeCountry);
    $("#cmbProvincia").on("change", changeProvincia);   
    $("#cmbMunicipio").on("change", changeMunicipio);   
    $("#cmbSector").on("change", changeSector);    
    //$("#cmbEdificios").on("change", changeEdificio);   
    //$("#cmbBarriadas").on("change", changeBarriada);   
};

const onDocumentReady = async() => {

    //debugger;
  
    btnSave = $("button.ant-btn.ant-btn-link:contains('Guardar')"); 
    await setConfigView();
    if(isEndorsment){
        soloBloquea(["#cmbTipoObjeto","#cmbUsoBien","#cmbPais","#cmbProvincia","#cmbMunicipio",
            "#txtBarriadas","#cmbSector","#txtEdificios","#manzana","#aptoocasa","#calleoavenida","#cmbZonaCresta","#direccionexacta"
        ],true);

    }
     
    await loadPolicy();

    //Renderización de tab y campos dinámicos
    inyectarEstilosAntdCobtar();

    //Renderizado de opción para agregar coberturas
    await setProductCoverages();
    renderToolbarCoberturas();
    await bindEventosCoberturas();
    await cargarCobtarDinamico();    

    validaInputs();
    await cargarCatalogos();

}

async function cargarCobtarDinamico(){
    await listarCobtar();
    renderTablaAgrupada(configCobtar);
    cargarCobtarDesdeHidden("#hiddenCobtar", "#tabTarifas");
    bindEventosCobtar();
    //Voy a validar si no hay nada en el hidden de cobtar lo voy a cargar con los datos por default
    setDefaultCobtar(); 

    renderFooterTarifas();
    actualizarResumenTarifas();
}

async function cargarCatalogos(){

    $('#txtBarriadas').on('input change', function () {
      const value = $(this).val();
    
      if (!value || value.trim() === '') {
        $('#txtEdificios').prop('disabled', false); // habilitar
      } else {
        $('#txtEdificios').prop('disabled', true); // deshabilitar
      }
    });

    $('#txtEdificios').on('input change', function () {
      const value = $(this).val();
    
      if (!value || value.trim() === '') {
        $('#txtBarriadas').prop('disabled', false); // habilitar
      } else {
        $('#txtBarriadas').prop('disabled', true); // deshabilitar
      }
    });

    await loadDataTable({reference:'#txtSA',tableName:'SumasPorRango',indexCode:1,indexDisplay:1,filterFunction: (item) => item[0] === policy.productCode});
    const TablaTipoObjeto = await loadDataTable({reference:'#cmbTipoObjeto',tableName:'TablaTipoObjeto',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#cmbCategoriaActividad',tableName:'TablaCategoriaActividad',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#cmbUsoBien',tableName:'TablaUsoBien',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#cmbTipoMaterial',tableName:'TablaTipoMaterial',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#cmbZonaCresta',tableName:'ZonaCresta',indexCode:0,indexDisplay:1});

    await loadTableQuery({reference:'#cmbPais',tableCommand:'RepoCountryCatalog',filter:`[code]='591'`});
    const countryCode = $("#cmbPais").val();
    await loadTableQuery({reference:'#cmbProvincia',tableCommand:'RepoStateCatalog',filter:`[countryCode]='${countryCode}'`});

    const stateCode =$("#cmbProvincia").attr('user-data');
    await loadTableQuery({reference:'#cmbMunicipio',tableCommand:'RepoCityCatalog',filter:`[stateCode]='${stateCode}'`});

    const cityCode = $("#cmbMunicipio").attr('user-data');
    await loadTableQuery({reference:'#cmbSector',tableCommand:'RepoSectorCatalog',filter:`[cityCode]='${cityCode}'`});

    cargaBarriada(false);
    cargaEdificio(false);
    
    const codeBarriada =$("#cmbBarriadas").val();
    if (codeBarriada && String(codeBarriada) !== '0') {
        limpiarYBloquear(["#txtEdificios"],true);
    }
         
    const codeEdificios =$("#cmbEdificios").val();
    if (codeEdificios && String(codeEdificios) !== '0') {
        limpiarYBloquear(["#txtBarriadas"],true);
    }  
        
    loadEventField();

    $('#cmbTipoObjeto').on('change', function(event){
      limpiarYBloquear(['#txtBarriadas','#txtEdificios'],false);
      const { target:{ value }} = event;
      if(!value) return;
      const tipoObjeto = TablaTipoObjeto.find(item => item[0] === value);
      if(!tipoObjeto) return;
      limpiarYBloquear(['#txtBarriadas'],tipoObjeto[2] != '*');
      limpiarYBloquear(['#txtEdificios'],tipoObjeto[3] != '*');
    })

    $('#txtSA').on('change', async function(event){
      try {

        //debugger;
        if(!isEndorsment)
        return;

        await changeEdifMsg();
        
      } catch (error) {
       console.error(error) ;
      }      
    })

}

function habilitarSelectFiltrable(config) {
  try { 
    
    const $input  = $('#' + config.inputId);
    const $hidden = $('#' + config.hiddenId);

    if (!$input.length || !$hidden.length) return;
    inyectarCSS();
    
    if ($input.data('filtrable')) return;
    $input.data('filtrable', true);

    const textField  = config.textField  || 'text';
    const valueField = config.valueField || 'value';
    $input.data('source', config.data || []);

    const $wrapper = $('<div>').css('position', 'relative');
    $input.wrap($wrapper);

    const $list = $('<div>', { class: 'dropdown-list' })
        .insertAfter($input);

    function render(items) {
        $list.empty();

        if (!items.length) {
            $list.hide();
            return;
        }

        items.forEach(item => {
            $('<div>', {
                class: 'dropdown-item',
                text: item[textField]
            })
            .data('item', item)
            .appendTo($list);
        });

        $list.show();
    }

    // Filtro
    $input.on('keyup focus', function () {
        const value = $(this).val().toLowerCase();
        const source = $input.data('source') || [];
        const filtered = source.filter(x =>
            String(x[textField]).toLowerCase().includes(value)
        );
        render(filtered);
    });

    // Selección
    $list.on('click', '.dropdown-item', async function () {
        const item = $(this).data('item');
        $input.val(item[textField]);
        $hidden.val(item[valueField] || '0');
        $list.hide();      

        //debugger;
        const id = $input.attr('id');
        if(id == 'txtBarriadas')
          await changeBarriada();
        else
          await changeEdificio();
      
    });

    // Limpieza si el texto no coincide
    $input.on('blur', function () {
        //debugger;
        const source = $input.data('source') || [];
        const match = source.find(x =>
            x[textField] === $input.val()
        );
        if (!match && config.inputId != 'txtBarriadas') {
            $input.val('')
            $hidden.val('0');
        }
      
    });

    // Render inicial
    //render(data);

    $(document).on('click', function (e) {
        if (!$(e.target).closest($input.parent()).length) {
            $list.hide();
        }
    });
    
  } catch (error) {
    console.error(error);
  }
}

function actualizarListaSelectFiltrable(inputId, hiddenId, nuevaData, limpiar) {
  try {   
        
    const $input = $('#' + inputId);
    const $hidden = $('#' + hiddenId);

    if (!$input.length || !$input.data('filtrable')) return;

    $input.data('source', nuevaData || []);
    
    // limpiar selección actual
    if(limpiar){
      $input.val('');
      $hidden.val('0');  
    }
            
  } catch (error) {
    console.error(error);
  }
}

function inyectarCSS() {
  if ($('#css-select-filtrable').length) return;

  const css = `
      .dropdown-list {
          position: absolute;
          border: 1px solid #ccc;
          background: #fff;
          width: 100%;
          max-height: 200px;
          overflow-y: auto;
          z-index: 9999;
          box-sizing: border-box;
      }
      .dropdown-item {
          padding: 6px 10px;
          cursor: pointer;
      }
      .dropdown-item:hover {
          background-color: #eee;
      }

      .select-wrapper {
          position: relative;
      }
      
      .select-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 14px;
          color: #555;
      }

      .select-wrapper {
          position: relative;
      }
      
  `;

  $('<style>', {
      id: 'css-select-filtrable',
      text: css
  }).appendTo('head');
}

const loadDataTable = async ({
    reference,
    tableName,
    indexCode,
    indexDisplay,
    filterFunction = () => true,
    mapFunction = (item) => item
}) => {
  
    $(reference).empty().append('<option value="">Seleccione una opción</option>');;
    const result = await me.exe("GetFullTable", { table: tableName });
    const data = result.outData && result.outData.length > 0 ? result.outData : [];
    data.splice(0, 1);
  
    data.filter(filterFunction).map(mapFunction).forEach(item => {
        $(reference).append(`<option value='${item[indexCode].trim()}'>${item[indexDisplay].trim()}</option>`);
    });
  
    //debugger;
    const dataValue = $(reference).attr('user-data');
    if(!!dataValue){
        $(reference).val(dataValue.trim());
    }
    return data;
}

const loadTableQuery = async({
    reference,
    tableCommand,
    filter,
}) => {
    const result = await me.exe(tableCommand,{
        operation:'GET',
        filter: filter
    });

    const data = result.outData && result.outData.length > 0 ? result.outData : [];
    $(reference).empty().append('<option value="">Seleccione una opción</option>');;

    data.forEach(item => {
        $(reference).append(`<option value='${item.code}' data-risk-zone="${item.riskZone}">${item.name}</option>`);
    });

    const dataValue = $(reference).attr('user-data');
    if(!!dataValue){
        $(reference).val(dataValue);
    }
}

const limpiarYBloquear = (referencias, bloquea) => {
    $.each(referencias, function (index, selector) {
        const $el = $(selector);

        if ($el.is('select')) {
            $el.prop('disabled', bloquea).val(-1)
        } else {
            $el.val('').prop('disabled', bloquea);
        }

        if($el.attr('id') == 'txtEdificios')
          $('#cmbEdificios').val('0');

        if($el.attr('id') == 'txtBarriadas')
          $('#cmbBarriadas').val('0');
      
    });
}

const soloBloquea = (referencias, bloquea) => {
    $.each(referencias, function (_, selector) {
        const $el = $(selector);

        if ($el.is('select')) {
            $el.addClass('select-readonly');
            $el.on('mousedown keydown', function(e) {
                e.preventDefault();
                return false;
            });
        } else {
          
            // Inputs y textarea  
            if($el.attr('id') == 'txtEdificios' || $el.attr('id') == 'txtBarriadas'){
              $el.addClass('select-readonly');
              $el.on('mousedown keydown', function(e) {
                  e.preventDefault();
                  return false;
              });
            }
            else
              $el.prop('readonly', bloquea);
              
        }
    });
}

const loadSQL  = async(query) => {
    const DoQuery = await me.exe("DoQuery",{
        sql: query
    });

    if(!DoQuery.ok)
        return me.messae.error(DoQuery.msg);

    return (DoQuery.outData || [])
}

const cargaEdificio = async(limpiar) => {
  try {   

    const $input = $('#txtEdificios');
    if(limpiar)
      $input.val('');
    
    $input.attr('placeholder', 'Procesando...');    
    
    const cmbpais = $("#cmbPais").val();
    const cmbprovincia = $("#cmbProvincia").val();
    const cmbmunicipio = $("#cmbMunicipio").val();
    const cmbsector = $("#cmbSector").val();
    const defaultValue = $("#cmbEdificios").val();
    
    if(!!cmbpais && !!cmbprovincia && !!cmbmunicipio && !!cmbsector){
        //me.message.loading('Loading...')
        const data = await loadSQL(
            `SELECT
                JSON_VALUE(data.[value],'$[4]') codigo,
                JSON_VALUE(data.[value],'$[5]') descripcion
            FROM [Table] t
            CROSS APPLY OPENJSON(t.data) data
            WHERE t.[name] = 'Edificios'
            AND JSON_VALUE(data.[value],'$[0]') = '${cmbpais}'
            AND JSON_VALUE(data.[value],'$[1]') = '${cmbprovincia}'
            AND JSON_VALUE(data.[value],'$[2]') = '${cmbmunicipio}'
            AND JSON_VALUE(data.[value],'$[3]') = '${cmbsector}'
            ORDER BY JSON_VALUE(data.[value],'$[5]')`
        );

        actualizarListaSelectFiltrable('txtEdificios', 'cmbEdificios', data, limpiar);
        habilitarSelectFiltrable({
            inputId: 'txtEdificios',
            hiddenId: 'cmbEdificios',
            data: data,
            textField: 'descripcion',
            valueField: 'codigo'
        });
  
        if (data?.length > 0)
          $input.attr('placeholder', 'Seleccione un edificio');
        else
          $input.attr('placeholder', '0 Edificios cargados');
       
    }
    
  } catch (error) {
    console.error();
  }
}

const cargaBarriada = async(limpiar) => {
  try {   

    //debugger;
    const $input = $('#txtBarriadas');
    if(limpiar)
      $input.val('');
    
    $input.attr('placeholder', 'Procesando...');    
  
    const cmbsector = $("#cmbSector").val();   
    if(!!cmbsector){
        const data = await loadSQL(
            `SELECT
                JSON_VALUE(data.[value],'$[0]') codigo,
                JSON_VALUE(data.[value],'$[3]') descripcion
            FROM [Table] t
            CROSS APPLY OPENJSON(t.data) data
            WHERE t.[name] = 'Barriadas'
            AND JSON_VALUE(data.[value],'$[1]') = '${cmbsector}'
            ORDER BY JSON_VALUE(data.[value],'$[3]')`
        );
        
      actualizarListaSelectFiltrable('txtBarriadas', 'cmbBarriadas', data, limpiar);
      habilitarSelectFiltrable({
          inputId: 'txtBarriadas',
          hiddenId: 'cmbBarriadas',
          data: data,
          textField: 'descripcion',
          valueField: 'codigo'
      });

      if (data?.length > 0)
        $input.attr('placeholder', 'Seleccione una barriada');
      else
        $input.attr('placeholder', '0 Barriadas cargadas');

    }
    
  } catch (error) {
    console.error(error);
  }
}

const changeEdifMsg = async () => {
  try {
    //debugger;
    me.message.destroy()
    btnSave.prop("disabled", true);
    const countryCode = $("#cmbPais").val(); 
    const estado = $("#cmbProvincia").val();
    const ciudad = $("#cmbMunicipio").val();
    const corregimiento = $("#cmbSector").val();
    const edificio = $("#cmbEdificios").val();
    const edificioLocal = $("#txtEdificios").val();
    const dto = JSON.stringify({
      lob:policy.lob,
      codeCumulo:'Incendio_Cumulo_Edificio',
      pais: countryCode,
      estado: estado,
      ciudad: ciudad,
      corregimiento: corregimiento,
      codigoEdificio: edificio,
      nombreEdificio: edificioLocal
    });

    await me.exe('ExeChain',{
      chain:'cmdValidaCumulosOas',
      context:dto
    }).then(resp => {
      if(!resp.outData){
        btnSave.prop("disabled", false);
        me.message.error('No se pudo recuperar el cumulo',30);
        return;
      }
      
      const {accion, bloquea, msg, ok} = resp.outData;
      if(bloquea){
        me.message.error(msg,30);
        return;
      }

      if(accion == 'none') return;

      btnSave.prop("disabled", false);
      me.message.warning(msg,30);
      //debugger;
      
      //console.log({resp})
    })

  } catch (error) {

    btnSave.prop("disabled", false);
    console.log({error});
  }
  
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Logica de Cobtar
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function listarCobtar(){
    try{
    
        const tableCobtar = await me.exe("GetFullTable", {table : "cfgCobtarIncendio"});
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

function renderTablaAgrupada(data, containerSelector = "#tabTarifas") {
    try{
        
        /*const $container = $(containerSelector);
        $container.empty();*/
        const $container = $(containerSelector);
        // SOLO eliminar tabla previa 
        $container.find(".tabla-ant").remove();

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
  containerSelector = "#tabTarifas"
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

function construirCobtar(containerSelector = "#tabTarifas") {
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
  $("#tabTarifas").on("input change", "input, select", function () {
    const data = construirCobtar("#tabTarifas");
    $("#hiddenCobtar").val(JSON.stringify(data));
    // debug opcional
    console.log(data);
  });
}

function setDefaultCobtar(){
    if($("#hiddenCobtar").val() === ''){
        const data = construirCobtar("#tabTarifas");
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

function vEqual(value){
    const normalizado = value.trim().toUpperCase();
    return normalizado;
}

function inyectarEstilosAntdCobtar() {
  const STYLE_ID = "antd-cobtar-styles";

  // elimina estilos anteriores si existen
  $("#" + STYLE_ID).remove();

  const css = `
    /* ===== CONTENEDOR ===== */
    #tabTarifas {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
      background: #fff;
      border-radius: 6px;
    }

    /* ===== TABLA ===== */
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
    }

    #tabTarifas .tabla-ant tbody tr:hover td {
      background: #fafafa;
    }

    #tabTarifas .tabla-ant td:first-child {
      font-weight: 500;
      background: #fafafa;
    }

    /* ===== INPUTS ===== */
    #tabTarifas .ant-input-custom,
    #tabTarifas .ant-select-custom {
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

    #tabTarifas .ant-input-custom:focus,
    #tabTarifas .ant-select-custom:focus {
      border-color: #1677ff;
      box-shadow: 0 0 0 2px rgba(22,119,255,0.2);
    }

    #tabTarifas .ant-input-custom:disabled,
    #tabTarifas .ant-select-custom:disabled {
      background: #f5f5f5;
      color: rgba(0,0,0,0.4);
      cursor: not-allowed;
    }

    #tabTarifas .readonly-style {
      background-color: #f5f5f5 !important;
      color: #666 !important;
      border: 1px solid #d9d9d9 !important;
      cursor: not-allowed !important;
      pointer-events: none;
      opacity: 1 !important;
    }

    #tabTarifas .required-label::after {
      content: " *";
      color: red;
    }

    /* ===================================================================================== */
    /* TOOLBAR COBERTURAS */
    /* ===================================================================================== */

    #tabTarifas #toolbarCoberturas {
      display: flex !important;
      justify-content: flex-start !important;
      align-items: center;
      width: 100%;
      margin-bottom: 16px;
    }

    #tabTarifas #toolbarCoberturas .ant-btn {
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

    #tabTarifas #footerResumenTarifas{
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
    #tabTarifas #footerResumenTarifas .footer-success-icon{
      width:28px;
      height:28px;
      border-radius:50%;
      background:#52c41a;
      position:relative;
      flex-shrink:0;
    }

    /* dibujar check real */
    #tabTarifas #footerResumenTarifas .footer-success-icon::after{
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
    #tabTarifas #footerResumenTarifas .footer-tarifas-item{
      display:flex;
      flex-direction:column;
      align-items:flex-end;
    }

    /* labels */
    #tabTarifas #footerResumenTarifas .label{
      font-size:11px;
      font-weight:600;
      color:#389e0d;
      text-transform:uppercase;
      letter-spacing:.4px;
      margin-bottom:3px;
    }

    /* valores */
    #tabTarifas #footerResumenTarifas .value{
      font-size:22px;
      line-height:1;
      font-weight:700;
      color:#237804;
      font-variant-numeric: tabular-nums;
    }

    /* =====================================================================================
      BOTON COTIZAR
    ===================================================================================== */

    #tabTarifas .btn-cotizar-cob{

      display:inline-flex !important;

      align-items:center !important;

      justify-content:center !important;

      gap:6px;

    }

    /* icono */
    #tabTarifas .btn-cotizar-icon{

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
  configCoverages = configCoverages.filter(x => x.productCode == policy.productCode);
}

async function setProductCoverages() {
  
  const productJson = await getProduct(policy.lob, policy.productCode);
  const product = productJson.configJson ? JSON.parse(productJson.configJson) : {};
  await setConfigCoverages();

  if(!product){
    me.mensage.error("No se pudo recuperar la configuración del producto");
    return;
  }

  if(!configCoverages){
    me.mensage.error("No se pudo recuperar la configuración de las coberturas del producto");
    return;
  }

  if(product.Coverages.length == 0){
    me.mensage.error("El producto no tiene coberturas asignadas");
    return;
  }

  if(configCoverages.length == 0){
    me.mensage.error("No se encontró configuración de coberturas para saber si suman o no.");
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

    const $tab = $("#tabTarifas");

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

    // polizaConfirmada = policy.active;
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
          await loadPolicy();
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

  $("#tabTarifas").append(html);

}

function actualizarResumenTarifas() {

  let sumaTotal = 0;
  let primaTotal = 0;

  policy.Coverages.forEach(pc => {

    const cfgCob = configCoverages.find(c => c.coverageCode.trim().toUpperCase() == pc.code.trim().toUpperCase());

    if (vEqual(cfgCob?.isCoverage) == vEqual("si"))
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

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