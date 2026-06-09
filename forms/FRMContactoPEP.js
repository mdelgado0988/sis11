/*
  Michael Delgado
  Form: FRMContactoPEP
  2025.11.11.
  Valida la disponibilidad del formulario según una vez renderizado en el DOM.
*/

  var mi = this;

  console.log("Cargando datos PEP");

  const inf =  $(".ant-tabs-tab:contains('Información personalizada')");

  inf.on("click", function() {
    let esBanco = false;
    const valoresContacto = contactForm.getFieldsValue(); 
    
    if(valoresContacto.Roles){
      esBanco = valoresContacto.Roles.some(r => r.role === "BNK");
    }
      
    if (esBanco) {
         $(".ant-tabs-tab:contains('Datos Bancarios Institucionales')").show(); 
    } else {
          $(".ant-tabs-tab:contains('Datos Bancarios Institucionales')").hide();
    }
  });

  //Validamos campo NIF o número cobis.
  validaTipoPersona();

  //Formateamos fechas
  formatearFechas();

  function validaTipoPersona() {
    try {

      const $isPerson = $("#isPerson");      
      var valorEsPersona = $isPerson.attr("aria-checked") === "true";

      $("#nif").attr("autocomplete", "off");
      $("#cnp").attr("autocomplete", "off");
      $("#surname2").attr("autocomplete", "off");
  
      //oculto NIF según sea el tipo de persona
      if(valorEsPersona){
        $("#nif, label[for='nif']").hide();
        $("#nif").prop("required", false);

        $("#surname2, label[for='surname2']").hide();
        $("#surname2").prop("required", false);

        validaTipoDocumento();        
      }
      else{
        $("#nif, label[for='nif']").show();
        $("#nif").prop("required", true);          
        $("#surname2, label[for='surname2']").show();
        $("#surname2").prop("required", true);
      }
            
    } catch (error) {
      console.log("Error validando número cobis");
    }
  }

  function validaTipoDocumento() {
    try {

      const $cnp = $("#cnp");
      const { idType } = contactForm.getFieldsValue();
        
      //oculto NIF según sea el tipo de persona
      if(idType?.trim()){
        $cnp
          .css("pointer-events", "")
          .css("background-color", "");
      }
      else{        
        $cnp
          .css("pointer-events", "none")
          .css("background-color", "#f5f5f5");
      }
      
    } catch (error) {
      console.log("Error validando identificación");
    }
  }

  function formatearFechas() {
    try {
      $('code').not('[data-formateado]').each(function () {
        const texto = $(this).text().trim();
        if (!/^\d{4}-\d{2}-\d{2}T/.test(texto)) return;

        const fecha = new Date(texto);
        if (isNaN(fecha)) return;

        $(this)
          .text(
              fecha.toLocaleString('es-MX', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                  /*hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'*/
              })
          )
          .attr('data-formateado', 'true');
      });
    } catch (error) {
      console.error(`Error formateando fechas: ${error.toString()}`);
    }
    
  }

  function inicializaBarriadas() {
    try{
      //load streets list
      setTimeout(async () => {      
          await CargarCalles();        
          const inputStreet = document.getElementById("address1");
          establecerAutoCompletado(inputStreet, 0);
      }, 500)
    
      $(document).on('click', 'div.ant-tabs-tab-btn:contains("Por favor ingresar nueva dirección")', function () {
        setAutoCompleteNewTab();      
      });
    } 
    catch(error){
      console.error(error);
    }
  }
  
  function logica() {
    try{
      const $publicStatus = $("#publicStatus");
      const $isPerson = $("#isPerson");
  
      const isFamilySelected = $("#isFamily").val() === '1';    
      familyFieldsVisibility(isFamilySelected);
    
      $("#isFamily").on("change", function() {        
        const visibility = $(this).val() === '1';
        familyFieldsVisibility(visibility);      
        console.log("Valor seleccionado:", $(this).val());
      });
  
      const isActualyChecked = $publicStatus.attr("aria-checked") === "true";
      if(!isActualyChecked) {
        clearFields();
        disableFields(true);
      }
    
      $publicStatus.on("click", function() {
        const valor = $(this).attr("aria-checked") === "true";
        const isChecked = !valor; // hago esto porque el valor no está actualizado pero se actualizará
        
        if (isChecked){
          disableFields(false);
        }
        else {
          clearFields();
          disableFields(true);
        }      
      });

      var TypeContact = $isPerson.attr("aria-checked") === "true";
      hideCustomTab(TypeContact);
      disabledRequiredItems(TypeContact);
      hideCustomTabConsorcio(TypeContact);

      $isPerson.on("click", function() {      
        try{
          var esPersona = $(this).attr("aria-checked") === "true";
          esPersona = !esPersona;

          //Validamos el perfil si es GEC o no.
          const { Roles: rolesList = [] } = contactForm.getFieldsValue();                   
          const tieneRol = (rol) => rolesList.some(x => x.role === rol);
          const esGrupoEconomico  = tieneRol("GEC");

          setCobisDefaultValue(esGrupoEconomico);

          if(esPersona){
            $("#nif, label[for='nif']").hide();
            $("#nif").prop("required", false);
    
            $("#surname2, label[for='surname2']").hide();
            $("#surname2").prop("required", false);
    
            validaTipoDocumento();        
            toggleRequiredFields(false);
          }
          else{
            $("#nif, label[for='nif']").show();
            $("#nif").prop("required", true);          
            $("#surname2, label[for='surname2']").show();
            $("#surname2").prop("required", true);
            toggleRequiredFields(esGrupoEconomico);
          }

          //Validación campos: Si es persona actividad económica y profesión serán obligatorios, sino, no
          $("#profesion").prop("required", esPersona);
          $("#actividadEconomica").prop("required", esPersona);
          //fin
          
          hideCustomTab(esPersona);
          disabledRequiredItems(esPersona);
          hideCustomTabConsorcio(esPersona);
          validaTipoClienteFE(esPersona, true);
          
        }catch(error){
          console.error(error);
        }             
      });

    }
    catch(error){
      console.warn(error);
    }
  }

    //////////////////////////////////////////////////////////////////////////////////////////
    //Grupo económico: GEC
    //////////////////////////////////////////////////////////////////////////////////////////

    function setCobisDefaultValue(esGEC) {
      const { isPerson } = contactForm.getFieldsValue();

      $('#nationalId').prop('readonly', false);
      
      if (!isPerson) {
          contactForm.setFieldsValue({
              nationalId: 0
          });
        
          $('#nationalId').prop('readonly', esGEC);
      }
    }

    // Caché global mientras viva el formulario
    window._gecRequiredFieldsCache = window._gecRequiredFieldsCache || null;
    
    function toggleRequiredFields(esGEC) {
    
        // Guardar estado original una sola vez
        if (esGEC && !window._gecRequiredFieldsCache) {
    
            window._gecRequiredFieldsCache = [];
    
            $('[required]').each(function () {
                window._gecRequiredFieldsCache.push(this);
            });
        }
    
        // Ocultar validaciones requeridas
        if (esGEC) {
    
            window._gecRequiredFieldsCache.forEach(function (el) {
                if (el && el.isConnected) {
                    el.removeAttribute('required');
                    el.required = false;
                }
            });
    
            return;
        }
    
        // Restaurar estado original
        if (window._gecRequiredFieldsCache) {
    
            window._gecRequiredFieldsCache.forEach(function (el) {
                if (el && el.isConnected) {
                    el.setAttribute('required', '');
                    el.required = true;
                }
            });
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////

  const tiposClientePN = [
    { descripcion: "Personal Natural Contribuyente", valor: "PNC" },
    { descripcion: "Consumidor Final", valor: "CNF" }
  ];

  const tiposClientePJ = [
    { descripcion: "Gobierno", valor: "GOB" },
    { descripcion: "Empresa", valor: "EMP" },
    { descripcion: "Extranjero con Pasaporte o VAT ID", valor: "EPV" }
  ];

  function validaTipoClienteFE(esPersona, reiniciaCambio) {
    try {

      waitForElement("#tipoClienteFE", {
        interval: 250,
        maxRetries: 20
      })
      .then(($el) => {
        try {         

          var $tipoCliente = $("#tipoClienteFE");
          var valorActual = $tipoCliente.val();
          var arreglo;
          $tipoCliente.empty();
  
          if(esPersona)
            arreglo = tiposClientePN;
          else
            arreglo = tiposClientePJ

          $tipoCliente.prepend('<option value="" disabled selected>Seleccione el tipo de cliente</option>');
          arreglo.forEach(item => {
            $tipoCliente.append('<option value="' + item.valor + '">' + item.descripcion + '</option>');
          });  
          
          if (reiniciaCambio)
            $tipoCliente.val("");
          else{
            if(valorActual)
              $("#tipoCliente option[value='" + valorActual + "']").attr("selected", true);
          }
          
        } catch (errorx) {
          console.error(errorx);
        }
        
      })
      .catch(err => {
        console.warn(err);
      });
      
    } catch (error) {
      console.error(error);
    }
  }

  function hideCustomTab(esPersona, attempt = 0) {
    const el = $('[data-node-key="customTab_Información de Compañías"]');    
  
    if (el.length) {
      if(!esPersona){
        el.closest('.ant-tabs-tab').show();
      }
      else{
        el.closest('.ant-tabs-tab').hide();
      }
      return;
    }
  
    if (attempt < 10) {
      setTimeout(() => hideCustomTab(esPersona, attempt + 1), 300);
    }
  }    

  function hideCustomTabConsorcio(esPersona, attempt = 0) {
    const el = $('[data-node-key="customTab_Consorcios"]');
  
    if (el.length) {
      if(!esPersona){
        el.closest('.ant-tabs-tab').show();
      }
      else{
        el.closest('.ant-tabs-tab').hide();
      }
      return;
    }
  
    if (attempt < 10) {
      setTimeout(() => hideCustomTabConsorcio(esPersona, attempt + 1), 300);
    }
  }

  function disabledRequiredItems(esPersona, attempt = 0){
    const el = $('[data-node-key="customTab_Información de Compañías"]'); 
    if (el.length) {
      if(!esPersona){
        $("#tipoEmpresa").prop("disabled", false);
      }
      else{
        $("#tipoEmpresa").prop("disabled", true);
      }
      return;
    }  
    if (attempt < 10) {
      setTimeout(() => disabledRequiredItems(esPersona, attempt + 1), 300);
    }
  }

  function disableFields(value) {
    try {
      $("#familyName").prop("disabled", value);     
      $("#relation").prop("disabled", value);
      $("#period").prop("disabled", value);
      $("#position").prop("disabled", value);
      $("#description").prop("disabled", value);
      $("#isFamily").prop("disabled", value);
    } catch (error) {
     console.error(error) ;
    }    
  }

  function clearFields() {
    try {
      $("#familyName").val("");
      $("#relation").val("");
      $("#period").val("");
      $("#position").val("");
      $("#description").val("");
      $("#isFamily").val("0");
      familyFieldsVisibility(false);
    } catch (error) {
      console.error(error);
    }    
  }

  function familyFieldsVisibility(value) {
    try {     
    
      const $nameField = $("#familyName, label[for='familyName']");
      const $relationField = $("#relation, label[for='relation']");
      if (value){
          $nameField.show();
          $relationField.show();        
        }
        else {
          $nameField.hide();
          $relationField.hide();
          $("#familyName").val("");
          $("#relation").val("");
        }
      $nameField.prop("required", value);
      $relationField.prop("required", value);
    } catch (error) {
     console.error(error) ;
    }
  }

  // Ejecución
  //onReady(500, 10); // intenta hasta 10 veces cada 500ms

  ////////////////////////////////////////////////////////////////////////////////////

  /*
    Michael Delgado.
    2025.11.14.
    Función para convertir control con autocompletado para barrios
    Referencia: Desarrollo de Noel de Fatum
  */
  function autocomplete(inp, arr, index) {    
    try{
           
      /*the autocomplete function takes two arguments,
      the text field element and an array of possible autocompleted values:*/
      var currentFocus;

      function showAutoCompleteList(e, field) {
        try {

          
          var a, b, i, val = field.value;
          /*close any already open lists of autocompleted values*/
          closeAllLists(field);            
          
          const tabObjetivo = Array.from(document.querySelectorAll('.ant-tabs-tab')).find(tab => {
              const btn = tab.querySelector('.ant-tabs-tab-btn');
              return btn && btn.innerText.trim() === "Por favor ingresar nueva dirección" 
               && btn.getAttribute('aria-selected') === 'true';
            });

          const tabKey = tabObjetivo.querySelector('.ant-tabs-tab-btn').getAttribute('aria-controls');
          const tabPanel = document.getElementById(tabKey);
          if (!tabPanel) {
            console.warn("Address tab not found");
            return null;
          }

          // Buscar el select dentro del panel activo
          const sectorSelect = tabPanel.querySelector('#sectorSelect');
          if (!sectorSelect) {
            console.warn("Sector not found");
            return null;
          }

          var currentNeighborhood = sectorSelect?.parentNode.parentNode.querySelector('.ant-select-selection-item')?.innerText;
          
          //var currentNeighborhood = addressForm[tabIndex].getFieldsValue().location.sector.toString(); //document.querySelector("#sectorSelect").parentNode.parentNode.querySelector(".ant-select-selection-item").outerText;
          //var currentNeighborhood = document.querySelector("#sectorSelect").parentNode.parentNode.querySelector(".ant-select-selection-item").outerText;
          
          if (!val && !currentNeighborhood) return false;
          currentFocus = -1;         
          
          a = document.createElement("DIV");
          a.setAttribute("id", field.id + "autocomplete-list");
          a.setAttribute("class", "autocomplete-items"); //rc-virtual-list-holder-inner            
          a._input = field; // <-- guardamos el input que generó esta lista
          //this.parentNode.appendChild(a);   

          // Posicionar el div como un select flotante
          const rect = field.getBoundingClientRect();
          a.style.position = "absolute";
          a.style.top = (rect.bottom + window.scrollY) + "px";
          a.style.left = (rect.left + window.scrollX) + "px";
          a.style.width = rect.width + "px";
          a.style.border = "1px solid #d4d4d4";
          a.style.backgroundColor = "#fff";
          a.style.zIndex = 9999;
          a.style.maxHeight = "200px";
          a.style.overflowY = "auto";
          a.style.boxShadow = "0px 2px 6px rgba(0,0,0,0.2)";
          a.style.borderRadius = "4px";
          a.style.cursor = "pointer";          // manito
          
          // Añadir al body para que se superponga a todo
          document.body.appendChild(a);
          
          const searchValues = arr.filter(n => n.neighborhood == currentNeighborhood).map(s => s.street);
         
          searchValues.forEach(sv => {
          if (sv.substr(0, val.length).toUpperCase() === val.toUpperCase()) {
              const b = document.createElement("DIV");

              // estilo como un select nativo
              b.style.cursor = "pointer";          // manito
              b.style.padding = "5px 10px";        // padding a izquierda y derecha
              b.style.borderBottom = "1px solid #eee"; // separación entre registros
              b.style.backgroundColor = "#fff";
      
              // crear el texto con negritas
              const strongPart = document.createElement("strong");
              strongPart.textContent = sv.substr(0, val.length);
              b.appendChild(strongPart);
      
              b.appendChild(document.createTextNode(sv.substr(val.length)));
      
              // input oculto
              const hiddenInput = document.createElement("input");
              hiddenInput.type = "hidden";
              hiddenInput.value = sv;
              b.appendChild(hiddenInput);
      
              b.addEventListener("click", () => {
                  if (window.addressForm)
                      window.addressForm[index].setFieldsValue({ [field.id]: hiddenInput.value });
                  closeAllLists(field);
              });
      
              a.appendChild(b);
            }
          });
          
        }
        catch(errori){
          console.error(errori);
        }
      }
            
      /*execute a function when someone writes in the text field:*/
      inp.addEventListener("input", function (e) { showAutoCompleteList(e, this); });
      inp.addEventListener("focus", function(e) { showAutoCompleteList(e, this); });
        
      /*execute a function presses a key on the keyboard:*/
      inp.addEventListener("keydown", function (e) {
          try{
            
            var x = document.getElementById(this.id + "autocomplete-list");
            if (x) x = x.getElementsByTagName("div");
            if (e.keyCode == 40) {
                currentFocus++;
                addActive(x);
            } else if (e.keyCode == 38) { //up
                currentFocus--;
                addActive(x);
            } else if (e.keyCode == 13) {
                e.preventDefault();
                if (currentFocus > -1) {
                    if (x) x[currentFocus].click();
                }
            }

          }
          catch(errorb){
            console.error(errorb);
          }
        
      });
        
      /* Execute validation on selected suggestions */
      inp.addEventListener("focusout", (event) => {
          try{
            const value = (event.target.value || "").toUpperCase();
            if (!value && !window.addressForm) return false;            
            const isValid = arr.some(i => i.street.toUpperCase().includes(value.toUpperCase()));
            if (isValid && window.addressForm[index])
                window.addressForm[index].setFieldsValue({ [inp.id]: value })
            else {
                window.addressForm[index].setFieldsValue({ [inp.id]: "" });
                alert("You must select a valid street.")
            }
            return true;

          }
          catch(errorc){
            console.error(errorc);
            return false;
          }
      });
        
      function addActive(x) {
          try{            
          
            /*a function to classify an item as "active":*/
            if (!x) return false;
            /*start by removing the "active" class on all items:*/
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            /*add class "autocomplete-active":*/
            x[currentFocus].classList.add("autocomplete-active");

          }
          catch(errord){
            console.error(errord);
            return false;
          }
      }
        
      function removeActive(x) {
        try{
          
          /*a function to remove the "active" class from all autocomplete items:*/
          for (var i = 0; i < x.length; i++) {
              x[i].classList.remove("autocomplete-active");
          }
        }
        catch(errorr){
          console.error(errorr);
        }
      }
        
      function closeAllLists(exceptInput) {
        try {
          const lists = document.getElementsByClassName("autocomplete-items");
          for (let i = lists.length - 1; i >= 0; i--) {
              const list = lists[i];

              //const inputId = list.id.replace("autocomplete-list", "");              
              //const input = document.getElementById(inputId);              
              const input = list._input;
              if (input !== exceptInput) {
                  list.remove();
              }
          }
        } catch (error) {
            console.error(error);
        }
      }
      
      /*execute a function when someone clicks in the document:*/
      document.addEventListener("click", function (e) {
          closeAllLists(e.target);
      });

   }
   catch(error){
     console.error(error);
   }
        
}

  async function CargarCalles() {
    try{
      
      const GetFullTable = await mi.exe("GetFullTable", { table: "Barriadas" });
      const data = GetFullTable.outData;
  
      data.splice(0, 1)
      const values = data.map(street => {
          const item = {};
          item["neighborhood"] = street[2];
          item["street"] = street[3];
          return item;
      });
      window.sessionStorage.setItem('streets', JSON.stringify(values));
      
    }
    catch(error){
      console.error(error);
    }
  }

  function establecerAutoCompletado(inputStreet, index) {
    autocomplete(inputStreet, JSON.parse(window.sessionStorage.getItem('streets')), index);
  } 
  
  function setAutoCompleteNewTab() {
    try{
      
      setTimeout(() => {

        // Buscar todos los inputs con id address1
        const direcciones = document.querySelectorAll("input[id='address1']");

        if (!direcciones.length) {
            console.warn("No se encontró ningún input address1");
            return;
        }

        // Tomamos el último (el más reciente)
        const input = direcciones[direcciones.length - 1];

        // Validar si ya se inicializó
        if (input.dataset.autocompleteInitialized) return;

        // Marcar como inicializado
        input.dataset.autocompleteInitialized = "true";

        // Llamamos tu método
        establecerAutoCompletado(input, direcciones.length - 1);
  
      }, 500);
            
    }
    catch(error){
      console.error(error);
    }
  }
  
  /////////////////////////////////////////////////////////////////
  document.addEventListener("click", function (e) {
    const tab = e.target.closest('[data-node-key="aml"]');
    if (!tab) return;

    // Aquí cambias la etiqueta
    $('.ant-tabs-tab[data-node-key="amlIncomeInfo"] .ant-tabs-tab-btn').text("Información de ingresos");
  });
 
  /////////////////////////////////////////////////////////////////////////

  waitForElement("#familyName", {
        interval: 250,
        maxRetries: 20
      })
      .then(($el) => {
        try {         

          if ($el.length) {
            setTimeout(() => {
              logica();          
              inicializaBarriadas();
            }, 200);            
            return;
          }
      
          attempts++;
          if (attempts < maxRetries) {
            setTimeout(isReady, interval); // reintenta después de `interval` ms
          } else {
            console.warn(`Fields not found after ${maxRetries} attempts`);
          }
          
        } catch (errorx) {
          console.error(errorx);
        }
        
      })
      .catch(err => {
        console.warn(err);
      });

  function waitForElement(selector, {
    interval = 100,
    maxRetries = 50
  } = {}) {
  
    return new Promise((resolve, reject) => {
      let attempts = 0;
      let timeoutId;
  
      const check = () => {
        const $el = $(selector);
  
        if ($el.length) {
          clearTimeout(timeoutId);
          resolve($el);
          return;
        }
  
        attempts++;
        if (attempts >= maxRetries) {
          clearTimeout(timeoutId);
          reject(`Elemento no encontrado: ${selector}`);
          return;
        }
  
        timeoutId = setTimeout(check, interval);
      };
  
      timeoutId = setTimeout(check, interval);
    });
  }