/*
Name: frmDTIncendio
Author: Ernesto Garcia
Description: Formulario generico
Categpry: FORM
Version: 1.01
CreateDate: 19-11-2025
LastModificate: 22-12-2025 - Mike Ortiz
*/

const me = this;    
const policyId = window.location.href.split('/')[5] || 793;
const isEndorsment = window.location.href.includes('tab12');
let isNew = false;
let policy = {};
let insuredObject = {};
let Edificios = [];
let Barriadas = [];
let btnSave = {};

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
    </li>

    </ul> 
    <div class="tab-content"> 
        <div id="tabHome" class="tab-pane active" style="padding: 1em;">
        </div>
        <div id="tabAddress" class="tab-pane" style="padding: 1em;">
        </div>
        <div id="tabRenovation" class="tab-pane" style="padding: 1em;">
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
  
}

const loadPolicy = async () => {
    const result = await me.exe('LoadEntity',{
        entity:'LifePolicy',
        fields: '[id],[insuredSum],[productCode],[lob]',
        filter: `id=${policyId}`
    })
    
    policy = result.outData && result.outData!=null ? result.outData : {};

    const formatoN2 = v =>
    (isNaN(v = Number((v || '').toString().replace(/[,\s]/g, ''))) ? 0 : v)
      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
    $("#txtSA").prop("readonly", true);
    if(!isEndorsment)
      $("#txtSADisplay").prop("readonly", true);
    $("#txtSA").val(policy?.insuredSum || '0');
    $("#txtSADisplay").val(formatoN2(policy?.insuredSum || 0));  
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
        limpiarYBloquear(["#txtEdificios"], true);
        me.message.error('No se encontro barriada o edificios en la direccion ingresada')
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

    //Agregamos evento al input de suma asegurada txtSADisplay para actualizar automáticamente el campo oculto txtSA con el valor numérico sin formato
    $('#txtSADisplay').on('input', function () {
        debugger;
        const value = $(this).val();
        const numericValue = value.replace(/[^0-9.-]+/g, '');
        //Validamos que numericValue sea un número válido antes de asignarlo a txtSA
        if (!isNaN(numericValue) && numericValue.trim() !== '') {
            $('#txtSA').val(numericValue);
            } else {
            $('#txtSA').val('0'); // O puedes dejarlo vacío o con un valor predeterminado
        }
    });
  
    await loadPolicy();

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

$(document)
    .promise()
    .then(setTimeout(onDocumentReady, 1000));
