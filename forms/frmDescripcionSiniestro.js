/*
Form: frmDescripcionSiniestro
Autor: Michael Delgado. 
Fecha: 2026.02.03.
Descripción: Genera carga con autocompletado de figuras de contacto y permite la gestión
de datos adicionales del reclamo.
*/

var mi = this;

$('label[for="description"]').text('Descripción del siniestro');

 async function logica() {
    try { 
      await cargarInspectores(false);
      await cargarAjustadores(false);
      $("#inspectorEmail").prop('readonly', true);
      $("#ajustadorEmail").prop('readonly', true);
      inyectarBotonLimpiar('#inspectorName');
      inyectarBotonLimpiar('#ajustadorName');
    } catch (error) {
      console.error(error);
    }
  }

  async function cargarInspectores(limpiar) {
    try {

      const $input = $("#inspectorName");
      $input.attr('placeholder', 'Procesando...');

      const fields = "id, CASE WHEN isPerson = 0 THEN surname2 ELSE name + ' ' + surname1 END name";      
      const filtroRol = "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'INS')";

      const result = await mi.exe("LoadEntities", {
          fields: fields,
          entity: "Contact",
          filter: filtroRol
      });

      const data = result.outData;
      
      actualizarListaSelectFiltrable('inspectorName', 'hiddenInspector', data, limpiar);
      habilitarSelectFiltrable({
          inputId: 'inspectorName',
          hiddenId: 'hiddenInspector',
          data: data,
          textField: 'name',
          valueField: 'id'
      });

      if (data?.length > 0)
        $input.attr('placeholder', 'Seleccione un inspector');
      else
        $input.attr('placeholder', 'Ningún inspector cargado');
      
    } catch (error) {
      console.error(error);
    }
  }

  async function cargarAjustadores(limpiar) {
    try {

      const $input = $("#ajustadorName");
      $input.attr('placeholder', 'Procesando...');

      const fields = "id, CASE WHEN isPerson = 0 THEN surname2 ELSE name + ' ' + surname1 END name";      
      const filtroRol = "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'ADJ')";

      const result = await mi.exe("LoadEntities", {
          fields: fields,
          entity: "Contact",
          filter: filtroRol
      });

      const data = result.outData;
      
      actualizarListaSelectFiltrable('ajustadorName', 'hiddenAjustador', data, limpiar);
      habilitarSelectFiltrable({
          inputId: 'ajustadorName',
          hiddenId: 'hiddenAjustador',
          data: data,
          textField: 'name',
          valueField: 'id'
      });

      if (data?.length > 0)
        $input.attr('placeholder', 'Seleccione un ajustador');
      else
        $input.attr('placeholder', 'Ningún ajustador cargado');
      
    } catch (error) {
      console.error(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  // Métodos de autocompletado para componentes de lista, se evita cargar todo en pantalla.
  ///////////////////////////////////////////////////////////////////////////

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
      const relatedEmailByInput = {
        inspectorName: 'inspectorEmail',
        ajustadorName: 'ajustadorEmail'
      };
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
        const valorSeleccionado = item[valueField] || "0";
        $hidden.val(valorSeleccionado);
        $list.hide();        

        const id = $input.attr('id');
        if(id == 'inspectorName')
          await cargarEmail(valorSeleccionado, 'inspectorEmail');
        else
          await cargarEmail(valorSeleccionado, 'ajustadorEmail');
        
      });
  
      // Limpieza si el texto no coincide
      $input.on('blur', function () {
          const source = $input.data('source') || [];
          const match = source.find(x =>
              x[textField] === $input.val()
          );
          if (!match) {
              $input.val('')
              $hidden.val('0');
              limpiarPorId(relatedEmailByInput[config.inputId]);
          }
        
      });
    
      $(document).on('click', function (e) {
          if (!$(e.target).closest($input.parent()).length) {
              $list.hide();
          }
      });
      
    } catch (error) {
      console.error(error);
    }
  }

  async function cargarEmail(value, field){
    try {

      if(!Number(value))
        return;
      
      const $input = $('#' + field); 

      $input.attr('placeholder', 'Cargando email...');

      const result = await mi.exe("LoadEntity", {
          fields: "email",
          entity: "Contact",
          filter: `id=${value}`
      });

      const email = result?.outData?.email || "";
      $input.attr('placeholder', 'Email no encontrado');
      $input.val(email);
      
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

  function limpiarPorId(id) {
    if (!id) return;

    const $el = $("#" + id);
    if ($el.length) {
      $el.val("").trigger("input").trigger("change");
    }
  }

  //inyectarBotonLimpiar
  function inyectarBotonLimpiar(selector) {
    try {
  
      const relaciones = {
        inspectorName: ["inspectorEmail"],
        ajustadorName: ["ajustadorEmail"]
      };
  
      const $input = $(selector);
      if (!$input.length) return;
  
      const inputId = $input.attr("id");
      if (!inputId) return;
  
      if ($input.data("btnClear")) return;
      if ($input.closest(".ant-select").length > 0) return;
  
      const $parent = $input.parent();
      if ($parent.css("position") === "static") {
        $parent.css("position", "relative");
      }
  
      const $btn = $('<div>✕</div>');
      $btn.css({
        position: "absolute",
        right: '30px',
        width: 16,
        height: 16,
        "line-height": "16px",
        "text-align": "center",
        cursor: "pointer",
        color: "#aaa",
        "z-index": 10,
        "user-select": "none",
        "pointer-events": "auto",
        display: "none"
      });
  
      $btn.on("click", () => {
        // Limpia el actual
        $input.val("").trigger("input").trigger("change");
  
        // Limpia relacionados
        const relacionados = relaciones[inputId] || [];
        relacionados.forEach(id => limpiarPorId(id));
      });
  
      $input.data("btnClear", $btn);
      $parent.append($btn);
  
      function actualizar() {
        if (!$input.is(":visible") || $input.val() === "") {
          $btn.hide();
          return;
        }
  
        const offset = $input.position();
        const height = $input.outerHeight();
  
        $btn.css({
          top: offset.top + (height - 16) / 2,
          display: "block"
        });
      }
  
      $input.on("input change", actualizar);
      $(window).on("resize scroll", actualizar);
      actualizar();
  
      // Observador visibilidad
      const observer = new MutationObserver(() => {
        if (!$input.length || !$input.is(":visible")) {
          $btn.hide();
          return;
        }
        actualizar();
      });
  
      observer.observe(document.body, { childList: true, subtree: true });
  
      // Limpieza si se elimina
      const removerObserver = new MutationObserver(() => {
        if (!document.body.contains($input[0])) {
          $btn.remove();
          $input.off("input change", actualizar);
          $(window).off("resize scroll", actualizar);
          observer.disconnect();
          removerObserver.disconnect();
        }
      });
  
      removerObserver.observe(document.body, { childList: true, subtree: true });
  
    } catch (error) {
      console.log(error);
    }
  }

  // -----------------------------
  // Esperar a que el elemento exista antes de ejecutar logica
  // -----------------------------
  function waitForElement(selector, { interval = 100, maxRetries = 50 } = {}) {
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

  //hide tabs of decision and close
  function hideTabs() {
    try {
      document.querySelector('[data-node-key="decision"]')?.style.setProperty("display", "none");
      document.querySelector('[data-node-key="closure"]')?.style.setProperty("display", "none");
    } catch (error) {
      console.error(error);
    }
  }
  hideTabs();  
  
  // Ejecución
  waitForElement('#inspectorName', { interval: 500, maxRetries: 10 })
    .then(($el) => {
        console.log("Listo, encontrado:", $el);
        logica();
    })
    .catch(err => {
        console.warn(err);
    });
