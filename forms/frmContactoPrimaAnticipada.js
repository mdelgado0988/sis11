  /*
  Form: frmContactoPrimaAnticipada
  Michael Delgado.
  2025.12.29
  Nuevo formulario para búsqueda de contactos
  Ref: Pago anticipado caja
  * Cambio: GLOB-638, Mejoras en autocomplete, se muestra mas información del contacto y se permiten búsquedas mixtas por texto e identificación.
  */

  var mi = this;

  function logica() {
    try {

      // Agregar autocomplete a Empresa
      //debugger;
      const campoPagador = document.getElementById('clientePA');
        //para evitar sugerencias
        campoPagador.setAttribute('name', 'no-autocomplete');
        campoPagador.setAttribute('autocomplete', 'off');
      agregarAutocomplete(10);
      
    } catch (error) {
      
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
        
        const result = await mi.exe("GetContacts", {
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
        console.error("Error al obtener consorciados:", error);
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
  
        $dropdown = $("<div></div>").addClass("autocomplete-dropdown").css({
            position: "absolute",
            top: $input.position().bottom + $input.outerHeight(),
            left: $input.position().left,
            width: $input.outerWidth(),
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
                $item.click(function(){
                    $input.val(item.nombreCompleto || '');
                    $inputCodigo.val(item.codigo || '');
                    $("#identificacionPagador").val(item.identificacion || '');
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
  
    $input.on("input", function() {
        //debugger;
        const valor = $(this).val().trim();
        if (!valor) { if ($dropdown) $dropdown.remove(); return; }
        mostrarDropdown(valor);
    });

    $input.on("click", function () {
        const valor = $(this).val().trim();
    
        if (valor.length > 0) {
            $(this).trigger("input"); // dispara la búsqueda
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
  
  // Ejecución
  waitForElement('#clientePA', { interval: 500, maxRetries: 10 })
    .then(($el) => {
        console.log("Listo, encontrado:", $el);
        logica();
    })
    .catch(err => {
        console.warn(err);
    });