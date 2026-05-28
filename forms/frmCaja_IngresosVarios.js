/**
 * Name: frmCaja_IngresosVarios
 * Description: Permite seleccionar pagador.
 * Type: FORM
 * Author: 
 * Version: 1
 * -----------------------------------------
 * Version: 2
 * Task: 114763
 * Description: Implementación de funcionalidad de autocompletado por Nombre e identificación.
 * Cambio: GLOB-638, Mejoras en autocomplete, se muestra mas información del contacto y se permiten búsquedas mixtas por texto e identificación.
 * -----------------------------------------
 */
var me = this;
var vDetails=[];
let elementId = 0;

$("#identificacionPagador").attr('readOnly',true);

/********Inicio de funciones para autocompletar*******************/
setTimeout(setAutoComplete, 500)

async function setAutoComplete() {
    const campoPagador = document.getElementById('pagador');
    //para evitar sugerencias
    campoPagador.setAttribute('name', 'no-autocomplete');
    campoPagador.setAttribute('autocomplete', 'off');
    await autocomplete(campoPagador);
}

async function getContacts(search = "") {
    debugger;

    try
    {           

        //reemplazamos cualquier caracter especial para evitar inyección de código o errores en la consulta
        search = search.replace(/[%_]/g, '\\$&');

        // filtro por nombre (puedes ampliar luego)
        let filters = `isPerson = 1`;

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

        const response = await me.exe('GetContacts', { 
            size: 200,  //solo los primeros 200 resultados para evitar saturar el sistema
            filter: filters 
        });

        return response.outData.map(con => ({
            nombreContacto: [
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

            noCobis: con.nationalId ?? '',
            codigo: con.id ?? ''
        }));

    }catch(error)
    {
        console.error("Error en SetAutoComplete:", error);
        return [];
    }
}

function autocomplete(input) {
    let currentFocus;
    let debounceTimer;

    input.addEventListener("input", async function () {
        debugger;
        let val = this.value;
        closeAllLists();

        //si val es numérico busco aunque tenga un caracter, si es texto, respeto los dos caracteres para evitar consultas innecesarias
        const isNumeric = /^\d+$/.test(val);
        if (!val || (isNumeric && val.length < 1) || (!isNumeric && val.length < 2)) return; // evita consultas innecesarias

        currentFocus = -1;

        // debounce (evita saturar backend)
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {

            const arrayOfValues = await getContacts(val);

            let a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            this.parentNode.appendChild(a);

            arrayOfValues.forEach(item => {
                let b = document.createElement('div');

                b.innerHTML = `
                    <div style="display:flex; flex-direction:column; padding:8px 12px;">
                        <div>
                            <b>${item.codigo || ''}</b> - ${item.nombreContacto || ''}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            Identificación: ${item.identificacion || ''}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            Cobis: ${item.noCobis || ''}
                        </div>
                    </div>
                `;

                b.addEventListener("click", function () {
                    $("#pagador").val(item.nombreContacto || '');
                    $("#identificacionPagador").val(item.identificacion || '');
                    closeAllLists();
                });

                a.appendChild(b);
            });

        }, 300); // delay 300ms
    });

    input.addEventListener("keydown", function (e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");

        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1 && x) x[currentFocus].click();
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = x.length - 1;
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        let x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != input) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });

    addStyles();
}

function addStyles(){
    let cssTemplate = `
    /*when hovering an item:*/
    .autocomplete-items div:hover {
    background-color: DodgerBlue !important; 
    color: #ffffff; 
    }

    /*when navigating through the items using the arrow keys:*/
    .autocomplete-active {
    background-color: DodgerBlue !important; 
    color: #ffffff; 
    }
    `;

    let link = document.createElement('style');
    link.innerHTML = cssTemplate;
    $('head').append(link)
    
}
/********Fin de funciones para autocompletar*********************/

async function establecePagador() {
  //debugger;
  /*
  let sqlStr = "SELECT jIncomeTypeForm FROM Transfer WHERE processId="+me.processId;
  let datRegistro = await me.exe("DoQuery", { sql: sqlStr });
  if (!(datRegistro.outData == null || datRegistro.outData.length == 0)) {
    const datosForm = JSON.parse(datRegistro.outData[0].jIncomeTypeForm);
    const pagadorId = datosForm.filter(x=> x.name.toLowerCase() == 'pagador')[0].userData;
    $("#pagadorId").val(pagadorId);
  }*/
  
 };

/*async function cargaPagadores() {
  //debugger;
  $("#pagadorId").empty().append('<option>' + "Seleccione el pagador" + '</option>');
  var sqlStr = "SELECT con.id FROM Contact con INNER JOIN ContactRole conRole ON con.id = conRole.contactId INNER JOIN RoleCatalog catRole ON conRole.role = catRole.code WHERE catRole.name='Pagador'";
  let pagadores = await me.exe("DoQuery", { sql: sqlStr });
  for (var i = 0; i < pagadores.outData.length; i++) {
    let contacto = await me.exe("GetContacts", { filter: 'id =' + pagadores.outData[i].id});
    $("#pagadorId").append('<option value="' + pagadores.outData[i].id + '">' + contacto.outData[0].FullName + '</option>')
    //formInstance1.userData.filter(x => x.name == 'pagadorId')[0].values.push({label: contacto.outData[0].FullName, value: pagadores.outData[i].id, selected: false});
  }
  if($("#pagadorId").attr('user-data'))
   $("#pagadorId").val($("#pagadorId").attr('user-data'));
};

setTimeout(() => {  
  me = this;
  cargaPagadores();
  //establecePagador();
  
}, 1500);*/