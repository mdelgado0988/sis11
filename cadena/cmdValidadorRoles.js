//block
/**
 * 
 * @Author: Michael Delgado
 * @Email: michael.delgado@axxis.com
 * @Created: 2025-10-10
 * @Purpose: Validar campos requeridos según rol seleccionado.
 * @Command: cmdValidadorRoles
 * @returns: cb() si es válido, cb('mensaje') si no es válido
 */
(r,v,cb)=>{
 
  try
  {
    
    //console.log('Validación de Roles: ' + v);
    //var isValid = EsValidoPorRolReasegurador(v);
    var isValid = validaControlesSegunRol(v);
    console.log('Controles aplicados');
    return isValid ? cb() : cb('Revise campos requeridos según rol');

    function validaControlesSegunRol(value){
      try{         

        const { Roles: rolesList = [] } = contactForm.getFieldsValue();

        const tieneRol = (rol) => rolesList.some(x => x.role === rol);
        
        const esCliente         = tieneRol("PRE");
        const esEmpleado        = tieneRol("EMP");
        const esCorredor        = tieneRol("COR");
        const esBanco           = tieneRol("BNK");
        const esGrupoEconomico  = tieneRol("GEC");
        const esConsorcio       = tieneRol("CON");

        controlesRequeridos(esCliente, esEmpleado, esCorredor, esBanco, esGrupoEconomico, esConsorcio);
              
        return true;
      }
      catch(error)
      {
        return false;
      }
    }

    // Función principal que puedes await
    function controlesRequeridos(esCliente, esEmpleado, esCorredor, esBanco, esGrupoEconomico, esConsorcio) {
      try {
        validaRangoIngresoPromise(esCliente, 250, 20);
        validaClaseRiesgoPromise(esCliente || esEmpleado, 250, 20);
        validaRolCorredorPromise(esCorredor, 250, 20);
        validaRolBancoPromise(esBanco, 250, 20);
        validaRolGECPromise(esGrupoEconomico, 250, 20);
        validaRolConsorcioPromise(esConsorcio, 250, 20)
        console.log("Campo #rangoIngreso listo y configurado");
      } catch {
        console.log("No se encontró el campo #rangoIngreso después de los intentos");
      }
    }
    
    // Función sleep que devuelve una promesa que resuelve después de ms milisegundos
    //const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
    function validaRangoIngresoPromise(esCliente, interval = 500, maxRetries = 5) {
      let attempts = 0;
    
      return new Promise((resolve) => {
        function intentar() {
          const $field = $("#rangoIngreso");
    
          if ($field.length) {
            $field.prop("required", esCliente);
            resolve(true);
            return;
          }
    
          attempts++;
    
          if (attempts >= maxRetries) {
            console.warn(`Field #rangoIngreso not found after ${maxRetries} attempts`);
            resolve(false);
            return;
          }
    
          setTimeout(intentar, interval);
        }
    
        intentar();
      });
    }

    function validaClaseRiesgoPromise(esClienteOEmpleado, interval = 500, maxRetries = 5) {
      let attempts = 0;
    
      return new Promise((resolve) => {
        function intentar() {
          const $clase = $("#claseRiesgo");
          const $clasificacion = $("#clasificacionRiesgo");
    
          if ($clase.length && $clasificacion.length) {
            if (esClienteOEmpleado) {
              $clase.val('1');
              $clasificacion.show();
            }
    
            $clase.prop("required", esClienteOEmpleado);
            $clasificacion.prop("required", esClienteOEmpleado);
    
            resolve(true);
            return;
          }
    
          attempts++;
    
          if (attempts >= maxRetries) {
            console.warn(`Field #claseRiesgo not found after ${maxRetries} attempts`);
            resolve(false);
            return;
          }
    
          setTimeout(intentar, interval);
        }
    
        intentar();
      });
    }

    function validaRolBancoPromise(esBanco, interval = 500, maxRetries = 5) {
      let attempts = 0;
    
      return new Promise((resolve) => {
        function intentar() {
          const $field = $("#rutaBanco, label[for='rutaBanco']");
    
          if ($field.length) {
            esBanco ? $field.show() : $field.hide();
    
            $("#rutaBanco").inputmask("remove");
            $('#rutaBanco').inputmask({
              mask: "999999999",
              placeholder: "_",
              showMaskOnHover: false,
              showMaskOnFocus: true
            });
    
            resolve(true);
            return;
          }
    
          attempts++;
    
          if (attempts >= maxRetries) {
            console.warn(`Field #rutaBanco not found after ${maxRetries} attempts`);
            resolve(false);
            return;
          }
    
          setTimeout(intentar, interval);
        }
    
        intentar();
      });
    }

    function validaRolCorredorPromise(esCorredor, interval = 500, maxRetries = 5) {
      let attempts = 0;
    
      return new Promise((resolve) => {
        function intentar() {
          const $field = $("#licenciaCorredor, label[for='licenciaCorredor']");
    
          if ($field.length) {
            esCorredor ? $field.show() : $field.hide();
    
            resolve(true);
            return;
          }
    
          attempts++;
    
          if (attempts >= maxRetries) {
            console.warn(`Field #licenciaCorredor not found after ${maxRetries} attempts`);
            resolve(false);
            return;
          }
    
          setTimeout(intentar, interval);
        }
    
        intentar();
      });
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
 
    function validaRolGECPromise(esGEC, interval = 500, maxRetries = 5) {
      let attempts = 0;

      setCobisDefaultValue(esGEC);

      return new Promise((resolve) => {
        function intentar() {
          const $tab = $('[data-node-key="customTab_Grupo Económico"]');
    
          if ($tab.length) {
            
            esGEC ? $tab.show() : $tab.hide();
            toggleRequiredFields(esGEC);

            resolve(true);
            return;
          }
    
          attempts++;
    
          if (attempts >= maxRetries) {
            console.warn(`Tab not found after ${maxRetries} attempts`);
            resolve(false);
            return;
          }
    
          setTimeout(intentar, interval);
        }
    
        intentar();
      });
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////

    //Información consorcial
    function validaRolConsorcioPromise(esConsorcio, interval = 500, maxRetries = 5) {
      let attempts = 0;
    
      return new Promise((resolve) => {
    
        function intentar() {
          const $tab = $('[data-node-key="customTab_Consorcios"]');
          const $acta = $("#actaConsorcial");
    
          if ($tab.length && $acta.length) {
            $acta.prop("required", esConsorcio);
            resolve(true);
            return;
          }
    
          attempts++;
    
          if (attempts >= maxRetries) {
            console.warn(`Tab not found after ${maxRetries} attempts`);
            resolve(false);
            return;
          }
    
          setTimeout(intentar, interval);
        }
    
        intentar();
      });
    }
    
}
  catch(error)
  {
    console.error(error);
  }
}