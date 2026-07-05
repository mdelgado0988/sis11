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
      </ul>
      <div class="tab-content">
        <div id="tabHome" class="tab-pane active" style="padding: 1em;"></div>
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
    $("#cmbMarca").on("change", changeMarca);
    // Keep the certificate field read-only at all times.
    $("#txtCertificado").prop("readonly", true);
    await loadDataTable({reference:'#cmbMarca',tableName:'TablaMarcas',indexCode:0,indexDisplay:1});
    await loadDataTable({reference:'#cmbtipo',tableName:'tblTipoPorRamo',indexCode:0,indexDisplay:2});
    await loadDataTable({reference:'#cmbUsoAuto',tableName:'tblUsoPorRamo',indexCode:1,indexDisplay:2});
    validaInputs();

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

