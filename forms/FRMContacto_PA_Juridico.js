/**
 * @name FRMContacto_PA_Juridico
 * @description Administra la información jurídica del contacto y sus datos de compañía.
 * @type FORM
 * @author Michael Delgado
 * @created 2026/09/16
 * @version 1.0
 * @purpose Configura los campos jurídicos según el tipo de compañía y el rol del contacto.
 */

  async function logica() {
    try {
      validaRol(500, 10);

      var tipoEmpresa = document.getElementById('tipoEmpresa').getAttribute('user-data');      
      if (!tipoEmpresa)
        tipoEmpresa = 0;   

      if(tipoEmpresa <= 0)
        $("#tipoEmpresa").prop("selectedIndex", -1);
      
      console.log("Validación de rol completada");
    } catch (error) {
      console.error("Error en logica():", error.message);
    }
  }

  async function validaRol() {
    try {

      //debugger;
      const $rutaBanco = $("#rutaBanco, label[for='rutaBanco']");
      
      if (typeof contactForm !== "undefined" && contactForm)
      {
                        
        const vForm = contactForm.getFieldsValue();
        const rolesList = vForm?.Roles;
          
        if (rolesList) {
          const esBanco = rolesList.some(x => x.role === "BNK");
              
          $("#rutaBanco").inputmask("remove");
          $("#rutaBanco").inputmask({
            mask: "999999999",
            placeholder: "_",
            showMaskOnHover: false,
            showMaskOnFocus: true
          });
  
          if(esBanco) 
            $rutaBanco.show() ;
          else 
            $rutaBanco.hide();
  
          return true; // ← resolve
        }        

      }
      else
          $rutaBanco.hide();

    } catch (error) {
      console.error("Error en validaRolPromise:", error);
    }
  }

  

  function waitForElement(selector, { interval = 100, maxRetries = 50 } = {}) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      let timeoutId;
  
      const check = () => {
        try {
          const $el = $(selector);
  
          if ($el.length) {
            clearTimeout(timeoutId);
            resolve($el);
            return;
          }
  
          attempts++;
          if (attempts >= maxRetries) {
            clearTimeout(timeoutId);
            reject(new Error(`Elemento no encontrado: ${selector}`));
            return;
          }
  
          timeoutId = setTimeout(check, interval);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      };
  
      check();
    });
  }

  // Ejecución
  waitForElement("#rutaBanco", { interval: 500, maxRetries: 10 })
  .then(() => logica()) // logica ahora maneja async correctamente
  .catch(err => {
    console.warn("Error esperando el elemento:", err.message);
  });
  /* ---------------------------------------------------------------------
   * AXX-233 — Grupo Economico en el formulario 609.
   *
   * Por que esto es asi: la pestaña se dibuja DOS veces. Primero con la
   * definicion del formulario y despues, encima, con la instantanea guardada
   * del contacto. Un contacto guardado antes de que el campo existiera no lo
   * trae en su instantanea, asi que el segundo dibujado lo borra; y uno que
   * si lo trae lo guarda con la lista de opciones vacia, asi que el
   * desplegable queda sin opciones. Por eso el campo se vuelve a asegurar
   * despues de cada dibujado, en vez de una sola vez al cargar.
   *
   * El guardado no necesita nada extra: se arma con la definicion del
   * formulario mas los valores que encuentre en el DOM por nombre, asi que
   * alcanza con que los controles esten presentes y con su valor puesto.
   *
   * Se agrega al final: no modifica ninguna regla anterior de este formulario.
   * ------------------------------------------------------------------- */
  var miGEC = this;
  var GEC_TAB = 'Información de Compañías';
  var GEC_VAR = 'customContactForm_' + GEC_TAB;
  var GEC_VACIO = '(Sin grupo económico)';

  var gecCatalogo = null;   // [{id, nombre, vigente}]
  var gecValor = '';        // el grupo del contacto; sigue al usuario cuando cambia
  var gecListo = false;

  function gecTag(id) { return id ? ('GEC#' + id + '#') : ''; }

  function gecContenedor() {
    var i = window[GEC_VAR];
    return (i && i.instanceContainers && i.instanceContainers[0]) ? i.instanceContainers[0] : null;
  }

  function gecContactoId() {
    try {
      var v = (typeof contactForm !== 'undefined' && contactForm) ? contactForm.getFieldsValue() : null;
      if (v && v.id) return String(v.id);
    } catch (e) { /* sigue por la URL */ }
    var m = String(window.location && window.location.pathname || '').match(/\/contact\/(\d+)/);
    return m ? m[1] : null;
  }

  function gecParsearCatalogo(outData) {
    var arr = Array.isArray(outData) ? outData : [];
    return arr.slice(1)
      .filter(function (r) {
        return Array.isArray(r) && r.some(function (c) { return c !== null && String(c).trim() !== ''; });
      })
      .map(function (r) {
        return {
          id: String(r[0] === null || r[0] === undefined ? '' : r[0]).trim(),
          nombre: String(r[1] === null || r[1] === undefined ? '' : r[1]).trim(),
          vigente: String(r[2] === null || r[2] === undefined ? '' : r[2]).trim() === '1' ? '1' : '0'
        };
      });
  }

  function gecLeerGuardado(jcf) {
    try {
      var obj = typeof jcf === 'string' ? JSON.parse(jcf || '{}') : (jcf || {});
      var tab = obj[GEC_TAB];
      if (!tab) return '';
      var campos = typeof tab === 'string' ? JSON.parse(tab) : tab;
      var f = (campos || []).filter(function (c) { return c && c.name === 'grupoEconomico'; })[0];
      return (f && f.userData && f.userData[0]) ? String(f.userData[0]).trim() : '';
    } catch (e) { return ''; }
  }

  // Opciones a mostrar: solo las vigentes, mas el grupo guardado si quedo
  // inactivo — ese valor se conserva y se muestra, no se pierde en silencio.
  function gecOpciones() {
    var op = (gecCatalogo || []).filter(function (x) { return x.vigente === '1'; });
    if (gecValor && !op.some(function (x) { return x.id === gecValor; })) {
      var previo = (gecCatalogo || []).filter(function (x) { return x.id === gecValor; })[0];
      if (previo) op = op.concat([{ id: previo.id, nombre: previo.nombre + ' (no vigente)', vigente: previo.vigente }]);
    }
    return op;
  }

  function gecAsegurar() {
    try {
      if (!gecListo) return;
      var cont = gecContenedor();
      if (!cont) return;
      var $cont = $(cont);

      // 1. el desplegable: si el ultimo dibujado se lo llevo, se vuelve a poner
      var $sel = $cont.find('select[name="grupoEconomico"]');
      if (!$sel.length) {
        var $wrap = $('<div class="formbuilder-select form-group field-grupoEconomico"></div>');
        $wrap.append($('<label>').attr('for', 'grupoEconomico').text('Grupo Económico'));
        $sel = $('<select>').attr({ name: 'grupoEconomico', id: 'grupoEconomico' })
          .addClass('ant-input col-md-6 row-4');
        $wrap.append($sel);
        $cont.append($wrap);
      }

      // 2. las opciones: si vienen vacias (instantanea con values:[]) se repueblan
      var esperadas = gecOpciones();
      if ($sel.find('option').length !== esperadas.length + 1) {
        $sel.empty();
        $sel.append($('<option>').val('').text(GEC_VACIO));
        esperadas.forEach(function (o) { $sel.append($('<option>').val(o.id).text(o.nombre)); });
      }

      // 3. el valor: gecValor sigue al usuario, asi que reaplicarlo no le pisa la eleccion
      if (String($sel.val() || '') !== String(gecValor || '')) $sel.val(gecValor || '');

      // 4. la marca consultable
      var $tag = $cont.find('[name="grupoEconomicoTag"]');
      if (!$tag.length) {
        $tag = $('<input>').attr({ type: 'hidden', name: 'grupoEconomicoTag', id: 'grupoEconomicoTag' });
        $cont.append($tag);
      }
      var marca = gecTag(String($sel.val() || ''));
      if (String($tag.val() || '') !== marca) $tag.val(marca);
    } catch (e) { console.error('GEC asegurar:', e); }
  }

  async function gecPreparar() {
    try {
      var r = await miGEC.exe('GetFullTable', { table: 'cfgGrupoEconomico' });
      gecCatalogo = (r && r.ok) ? gecParsearCatalogo(r.outData) : [];

      // El valor guardado no se puede leer del DOM: el segundo dibujado ya lo
      // borro. Se lee del contacto.
      gecValor = '';
      var id = gecContactoId();
      if (id) {
        var c = await miGEC.exe('GetContacts', { filter: 'id=' + id, size: 1 });
        if (c && c.ok && c.outData && c.outData[0]) gecValor = gecLeerGuardado(c.outData[0].jCustomForms);
      }
      gecListo = true;
      gecAsegurar();
    } catch (error) {
      console.error('Error preparando el catalogo de grupos economicos:', error);
    }
  }

  /* ---------------------------------------------------------------------
   * AXX-270 / GLOB-1216 — visibilidad de la pestaña de Grupo económico.
   *
   * Antes la pestaña se mostraba u ocultaba segun el rol de contacto GEC,
   * desde la cadena VALIDATOR cmdValidadorRoles. Ese rol se retiro, asi que
   * la condicion pasa a ser la que pide el requerimiento: la pestaña se ve
   * cuando el contacto tiene informado el campo Grupo Económico de
   * Información de Compañías, y no se ve cuando no lo tiene.
   *
   * Vive aca porque este formulario ya conoce el valor (gecValor) y ya tiene
   * el bucle idempotente que repone el campo tras cada dibujado: la pestaña
   * sigue al desplegable sin recargar la pantalla.
   *
   * Cadena vacia o solo espacios cuenta como sin grupo. Un contacto persona
   * no tiene Información de Compañías, asi que gecValor queda vacio y la
   * pestaña no se muestra.
   * ------------------------------------------------------------------- */
  function gecPestana() {
    try {
      if (!gecListo) return;
      var $tab = $('[data-node-key="customTab_Grupo Económico"]');
      if (!$tab.length) return;
      if (String(gecValor || '').trim() !== '') $tab.show(); else $tab.hide();
    } catch (e) { console.error('GEC pestaña:', e); }
  }

  $(document).off('change.gec').on('change.gec', 'select[name="grupoEconomico"]', function () {
    gecValor = String($(this).val() || '');
    window.__gecGrupoEconomicoPendiente = gecValor;
    gecAsegurar();
    gecPestana();
    $(document).trigger('gec:grupoEconomicoChanged', [gecValor]);
  });

  // El campo se re-asegura tras cada redibujado de la pestaña. Es barato
  // (dos consultas al DOM) y no vuelve a pedir el catalogo.
  if (window.__gecTimer) clearInterval(window.__gecTimer);
  var gecTicks = 0;
  window.__gecTimer = setInterval(function () {
    if (++gecTicks > 2400) { clearInterval(window.__gecTimer); window.__gecTimer = null; return; }
    gecAsegurar();
    gecPestana();
  }, 500);

  gecPreparar();
