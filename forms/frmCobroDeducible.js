/**
 * Name: frmCobroDeducible
 * Description: Permite seleccionar pagador.
 * Type: FORM
 * Author: 
 * Version: 1
 * Description: Implementación de funcionalidad de autocompletado por Nombre e identificación.
 * -----------------------------------------
 * Cambio: GLOB-638, Mejoras en autocomplete, se muestra mas información del contacto y se permiten búsquedas mixtas por texto e identificación.
 */

  var me = this;
  var table;

  function logica() {
    try {

      const campoPagador = document.getElementById('clientePA');
      //para evitar sugerencias
      campoPagador.setAttribute('autocomplete', 'off');
      agregarAutocomplete(10);
    
      const $form = $(".rendered-form");
      
      // Verificar si la tabla ya existe para evitar duplicados
      if (table && table.length > 0) {
        console.log("La tabla ya existe, no se creará nuevamente");
        return;
      }
    
      // -----------------------------
      // TABLA
      // -----------------------------
      const tableCard = $("<div>", { class: "ant-card ant-card-bordered tabla-siniestros-card", style: "margin-top:10px;" });
      const tableBody = $("<div>", { class: "ant-card-body" });

      const tableContainer = $("<div>", { 
        style: "max-height: 400px; overflow-y: auto; overflow-x: hidden;" 
      });

      table = $(`
          <table class="ant-table" style="width:100%">
              <thead class="ant-table-thead">
                  <tr>
                    <th>Seleccione</th>
                      <th>Nro Siniestro</th>
                      <th>Fecha Siniestro</th>
                      
                  </tr>
              </thead>
              <tbody class="ant-table-tbody">
                  <tr><td colspan="6" style="text-align:center;">No hay registros</td></tr>
              </tbody>
          </table>
      `);

      tableContainer.append(table);
      tableBody.empty();
      tableBody.append(tableContainer);
      tableCard.empty();
      tableCard.append(tableBody);
      $form.append(tableCard);
      
      // Cargar siniestros previos DESPUÉS de crear la tabla
      cargarSiniestrosPrevios();

      } catch (error) {
        console.error("Error en logica:", error);
      }
  }

      
  // -----------------------------
  // RENDERIZAR TABLA
  // -----------------------------
  function renderizarTabla(siniestros) {
      const tbody = table.find("tbody");
      tbody.empty();
  
      if (!siniestros || siniestros.length === 0) {
          tbody.append('<tr><td colspan="4" style="text-align:center;">No hay registros</td></tr>');
          return;
      }
  
      siniestros.forEach((item, index) => {
          const fondoFila = index % 2 === 0 ? "white" : "#d6f0ff";
  
          const tr = $("<tr>");
          const checkbox = $("<input>", {
              type: "checkbox",
              class: "row-selector",
              "data-id": item.id || "",
              "data-codigo-reclamo": item.codigoReclamo || "",
              "data-fecha-siniestro": item.fechaSiniestro || ""
          });
          
          const td0 = $("<td>", { style: "text-align: center;" }).append(checkbox).css("background-color", fondoFila);
          const td1 = $(`<td>${item.codigoReclamo}</td>`).css("background-color", fondoFila);
          const td2 = $(`<td>${item.fechaSiniestro}</td>`).css("background-color", fondoFila);
           tr.append(td0, td1, td2 );
  
          // Efecto hover
          tr.hover(
              function() {
                  $(this).find("td").css("background-color", "#bae7ff");
              },
              function() {
                  $(this).find("td").css("background-color", fondoFila);
              }
          );
  
          tbody.append(tr);
      });
  
      // Event listener para guardar selecciones
      $(".row-selector").off("change").on("change", function() {
          guardarSelecciones();
      });
  
      table.css("background-color", "white");
  }

  function guardarSelecciones() {
      const seleccionados = [];
      $(".row-selector:checked").each(function() {
          const $checkbox = $(this);
          const codigoReclamo = $checkbox.data("codigo-reclamo");
          if (codigoReclamo) {
              seleccionados.push(codigoReclamo);
          }
      });
      
      $("#listasiniestro").val(JSON.stringify(seleccionados));
      console.log("Siniestros seleccionados:", seleccionados);
  }
  
  async function obtenerSiniestros(clienteId) {
    try {
      debugger;
      const datosContacto = { contactId: clienteId };
      const dto = JSON.stringify(datosContacto);
      
      const resp = await me.exe('ExeChain',{
        chain:'getClaimsbyContactId',
        context: dto
      });
      
      if (resp && resp.ok && resp.outData) {
        return resp.outData.outData.value || [];
      } else {
        console.warn("No se encontraron siniestros para el cliente:", clienteId);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener siniestros:", error);
      return [];
    }
  }

  function renderizarTablaSiniestros(siniestros) {
       // 1️⃣ Crear el contenedor dinámicamente
   
    const $contenedor = $('#contenedorTablaSiniestros');
    $contenedor.empty();
    if (siniestros.length === 0) {
      $contenedor.html('<div class="alert alert-info">No se encontraron siniestros.</div>');
      return;
    }
    let tablaHtml = `<table class="table table-bordered" id="tablaSiniestros">
        <thead><tr>
          <th><input type="checkbox" id="checkAllSiniestros"></th>
          <th>Nro. Siniestro</th>
          <th>Fecha </th>
          <th>Monto </th>
        </tr></thead>
        <tbody>`;
    siniestros.forEach(s => {
      tablaHtml += `<tr>
          <td><input type="checkbox" class="chk-siniestro" data-id="${s.id}"></td>
          <td>${s.numeroSiniestro || 'N/A'}</td>
          <td>${s.fechaSiniestro || 'N/A'}</td>
        </tr>`;
    });
    tablaHtml += '</tbody></table>';
    $contenedor.html(tablaHtml);
    $('#checkAllSiniestros').on('change', function() { $('.chk-siniestro').prop('checked', $(this).is(':checked')); });
  }

  async function cargarSiniestrosPrevios() {
    const valorLista = $('#listasiniestro').val();
    const clienteId = $('#hiddenCodigoCliente').val();
    
    if (valorLista && clienteId) {
      try {
        const codigosGuardados = JSON.parse(valorLista);
        console.log("Datos previos encontrados:", codigosGuardados);
        console.log("Cliente ID:", clienteId);
        
        if (codigosGuardados && codigosGuardados.length > 0) {
          // Obtener siniestros del cliente específico
          const todosSiniestros = await obtenerSiniestros(clienteId);
          const siniestrosFiltrados = todosSiniestros.filter(s => 
            codigosGuardados.includes(s.codigoReclamo)
          );
          
          if (siniestrosFiltrados.length > 0) {
            renderizarTabla(siniestrosFiltrados);
            
            setTimeout(() => {
              codigosGuardados.forEach(codigo => {
                $(`.row-selector[data-codigo-reclamo="${codigo}"]`).prop('checked', true);
              });
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error al cargar siniestros previos:", error);
      }
    }
  }

  async function obtenerContactos(pagina, cantidad, search) {
    try {

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
        
        const result = await me.exe("GetContacts", {
            size: cantidad,
            page: pagina,
            filter: filters
        });

        const data = result.outData.map(con => ({
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

            noCobis: con.nationalId ?? '',
            codigo: con.id ?? ''
        }));

        const total = result.total;

        // Retornamos el objeto con items y total
        return { items: data, total: total };

    } catch (error) {
        console.error("Error al obtener contactos:", error);
        return { items: [], total: 0 }; // fallback si falla
    }
  }

  function agregarAutocomplete(cantidadPorPagina = 5) {
    const $input = $('#clientePA');
    const $inputCodigo = $("#hiddenCodigoCliente");    
    let $dropdown;
    let paginaActual = 0;
    let totalResultados = 0;
    let filtroActual = "";

    async function cargarPagina(pagina, filtro) {
      try {         
    
        const data = await obtenerContactos(pagina, cantidadPorPagina, filtro);
        totalResultados = data.total; // si tu API devuelve total de registros
        return data.items; // array [{nombre, codigo}]
      } catch (error) {
        return [];
      }
    }
  
    async function mostrarDropdown(filtro) {
      try {         
    
        filtroActual = filtro;
        paginaActual = 0;
        //debugger;
        const items = await cargarPagina(paginaActual, filtro);
  
        if ($dropdown) $dropdown.remove();
  
        if (!items.length) return;

        const rect = $input[0].getBoundingClientRect();
  
        $dropdown = $("<div></div>").addClass("autocomplete-dropdown").css({
            position: "fixed",
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
            border: "1px solid #d9d9d9",
            background: "#fff",
            "z-index": 10001,
            "max-height": "200px",
            overflow: "auto",
            "box-shadow": "0 2px 8px rgba(0,0,0,0.15)"
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

                // Línea principal: Código + Nombre
                const $line1 = $("<div></div>").html(
                    `<b>${item.codigo || ''}</b> - ${item.nombreCompleto || ''}`
                );

                // Identificación
                const $line2 = $("<div></div>").text(
                    `Identificación: ${item.identificacion || ''}`
                ).css({
                    fontSize: "12px",
                    color: "#666"
                });

                // Cobis
                const $line3 = $("<div></div>").text(
                    `Cobis: ${item.noCobis || ''}`
                ).css({
                    fontSize: "12px",
                    color: "#666"
                });

                // Armar item
                $item.append($line1, $line2, $line3);

                // Hover
                $item.hover(
                    function(){ $(this).css("background","#bae7ff") },
                    function(){ $(this).css("background","white") }
                );

                // Click
                $item.off('click').click(async function (){

                    $input.val(item.nombreCompleto || '');
                    $inputCodigo.val(item.codigo || '');
                    $("#identificacionPagador").val(item.identificacion || '');

                    // Guardo la selección válida
                    $input.data("selectedItem", item);
                    const siniestros = await obtenerSiniestros(item.codigo);
                    if (siniestros && siniestros.length > 0){
                        renderizarTabla(siniestros);
                    } else {
                        renderizarTabla([]);
                    }

                    $dropdown.remove();
                });

                $dropdown.append($item);
            });
  
            // Paginación si hay más de cantidadPorPagina
            const totalPaginas = (Math.ceil(totalResultados / cantidadPorPagina) - 1);
            if (totalPaginas > 0) {
                const $paginacion = $("<div></div>").css({
                    display: "flex", justifyContent: "space-between", padding: "4px 8px", borderTop: "1px solid #d9d9d9"
                });
  
                const $prev = $("<button>«</button>").css({ cursor: "pointer" }).prop("disabled", paginaActual === 0);
                const $next = $("<button>»</button>").css({ cursor: "pointer" }).prop("disabled", paginaActual === totalPaginas);
  
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

        const $form = $input.closest('form');
        $form.append($dropdown);
        activarCerrarDropdown($input, $dropdown);
        
      } catch (error) {
        console.error(error);
      }
    }
  
    $input.off('input').on("input", function() {

        // Invalida selección previa
        $input.data("selectedItem", null);
        $inputCodigo.val('');
        $("#identificacionPagador").val('');

        const valor = $(this).val().trim();

        if (!valor) {
            if ($dropdown) $dropdown.remove();
            return;
        }

        mostrarDropdown(valor);
    });

    $input.off('blur').on("blur", function () {

        const texto = $(this).val().trim();
        const selectedItem = $input.data("selectedItem");

        if (!texto) {
            $inputCodigo.val('');
            $("#identificacionPagador").val('');
            return;
        }

        if (!selectedItem) {

            $(this).val('');
            $inputCodigo.val('');
            $("#identificacionPagador").val('');
            renderizarTabla([]);

        }
    });
          
  }

  function activarCerrarDropdown($input, $dropdown) {
  
      $input.on("mousedown", e => e.stopPropagation());
      $dropdown.on("mousedown", e => e.stopPropagation());
  
      $(document).on("mousedown.dropdown", function (e) {
          if (
              !$input.is(e.target) &&
              !$dropdown.is(e.target) &&
              $dropdown.has(e.target).length === 0
          ) {
              $dropdown.remove();
              $(document).off("mousedown.dropdown");
          }
      });
  }

  function waitForElement(selector) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if ($(selector).length) { clearInterval(interval); resolve($(selector)); }
      }, 100);
    });
  }

  waitForElement('#clientePA').then(() => logica());
