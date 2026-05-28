/**
 * Form: FRMContacto_PA_Consorcio
 * Author: Michael Delgado.
 * Email: michael.delgado@axxis-systems.com
 * Created: 2025-01-01
 * Version: 1.0
 * Description: Permite incluir información del consorcio y sus participantes
 * Nota: Evento que valida el rol seleccionado se hace en el comando: cmdValidadorRoles
 */
var me = this;

function logica() {
  try{   

    //Marco el control de número de acta consorcial como obligatorio
    if(esContactoConsorcio()){
        $("#actaConsorcial").prop("required", true);
    }
    
    //Creo un div y lo agregamos luego del campo hiddenValida para trabajar con dicho div como contenedor
    const $hidden = $('#hiddenValida');
    const $form = $hidden.closest('form');
    let consorcios = []; // CRUD en memoria

    // Contenedor único
    let $contenedor = $form.find("#contenedorConsorcios");
    if ($contenedor.length === 0) {
        $contenedor = $("<div>", { id: "contenedorConsorcios" });
        $form.append($contenedor);
    } else {
        $contenedor.empty();
    }


    // -----------------------------
    // TABLA
    // -----------------------------
    const tableCard = $("<div>", { class: "ant-card ant-card-bordered", style: "margin-top:10px;" });
    const tableBody = $("<div>", { class: "ant-card-body" });

    const table = $(`
        <table class="ant-table" style="width:100%">
            <thead class="ant-table-thead">
                <tr>                    
                    <th>Código SIS</th>
                    <th>Nombre Consorciados</th>
                    <th>Nombre Empresa</th>
                    <th>Porcentaje</th>                    
                    <th>Código COBIS</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody class="ant-table-tbody">
                <tr><td colspan="6" style="text-align:center;">No hay registros</td></tr>
            </tbody>
        </table>
    `);

    tableBody.empty();
    tableBody.append(table);
    tableCard.empty();
    tableCard.append(tableBody);
    $contenedor.append(tableCard);

    // -----------------------------
    // BOTÓN PARA ABRIR MODAL
    // -----------------------------
    const $containerActa = $("#actaConsorcial").parent();

    let btnAgregar = $containerActa.find(".btn-agregar-consorcio");
    if (btnAgregar.length === 0) {
        btnAgregar = $('<button class="ant-btn ant-btn-primary btn-agregar-consorcio" style="margin-bottom:10px">Agregar Consorcio</button>');
        
        $containerActa.append(btnAgregar);

        $containerActa.css({
            display: "flex",
            gap: "8px",
            alignItems: "center"
        });
    }

    $('label[for="actaConsorcial"]').css({
        width: "100px",
        display: "inline-block",
        whiteSpace: "nowrap"
    });
    
    // -----------------------------
    // MODAL
    // -----------------------------  
    
    // -----------------------------
    // ESTILOS INLINE SIMULANDO ANT-D
    // -----------------------------
    const styles = `
        .modal-input {
            width:100%; 
            padding:4px 11px; 
            border:1px solid #d9d9d9; 
            border-radius:4px; 
            outline:none; 
            box-sizing:border-box;
            font-family: inherit;
            font-size: 14px;
            transition: all 0.2s;
        }
        .modal-input:focus {
            border-color: #40a9ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
        .modal-btn {
            padding:6px 15px; 
            border:none; 
            border-radius:4px; 
            cursor:pointer;
            font-family: inherit;
            font-size: 14px;
        }
        .modal-btn-cancel {
            background:#f0f0f0; 
            margin-right:8px;
        }
        .modal-btn-save {
            background:#1890ff; 
            color:white;
        }
    `;
    $("head").append(`<style>${styles}</style>`);
    
    // -----------------------------
    // MÁSCARA Y MODAL
    // -----------------------------
    const $mask = $('<div></div>').css({
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.45)',
        zIndex: 9999,
        display: 'none'
    });
    
    const $modalContent = $(`
        <div>
            <h3 style="margin-bottom:16px; font-size:16px; font-weight:500;">Consorcio</h3>
            <form>
                <div style="margin-bottom:12px;">
                    <label>Nombre Consorciados</label>
                    <input type="text" name="NombreConsorciados" class="modal-input"/>
                </div>
                <div style="margin-bottom:12px;">
                    <label>Nombre Empresa</label>
                    <input 
                        type="text" 
                        name="NombreEmpresa" 
                        class="modal-input"
                        placeholder="Digite el Nombre/Id/Identificación/Cobis de la empresa"
                    />
                </div>
                <div style="margin-bottom:12px;">
                    <label>Porcentaje</label>
                    <input type="number" name="Porcentaje" class="modal-input"/>
                </div>
                <div>
                    <input type="hidden" id="hiddenCodigoSisConsorcio" name="hiddenCodigoSisConsorcio" />
                </div>
                <div>
                    <input type="hidden" id="hiddenCodigoCobisConsorcio" name="hiddenCodigoCobisConsorcio" />
                </div>
                <div style="text-align:right; margin-top:16px;">
                    <button type="button" class="modal-btn modal-btn-cancel" id="btnCancelar">Cancelar</button>
                    <button type="button" class="modal-btn modal-btn-save" id="btnGuardar">Guardar</button>
                </div>
            </form>
        </div>
    `).css({
        display: 'none',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff',
        padding: '24px',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000,
        width: '400px',
        fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
        fontSize: '14px', // tamaño típico de AntD
        color: 'rgba(0,0,0,0.85)'
    });
    
    $("body").append($mask).append($modalContent);
    
    // -----------------------------
    // FUNCIONES MODAL
    // -----------------------------
    function abrirModal(data = null, index = null) {
        $modalContent.show();
        $mask.show();

        if (data) {
            $modalContent.find("input[name='NombreConsorciados']").val(data.NombreConsorciados);
            $modalContent.find("input[name='hiddenCodigoSisConsorcio']").val(data.CodigoSis);
            $modalContent.find("input[name='NombreEmpresa']").val(data.NombreEmpresa);
            $modalContent.find("input[name='Porcentaje']").val(formatearNumero(data.Porcentaje));
            $modalContent.find("input[name='hiddenCodigoCobisConsorcio']").val(data.CodigoCobis);
            $modalContent.data("editarIndex", index); // Guardamos el índice
        } else {
            $modalContent.find("input").val("");
        }
    }

    function cerrarModal() {
        $modalContent.hide();
        $mask.hide();
        $modalContent.find("input").val("");
    }

    // Abrir modal solo si estás en la pestaña correcta
    if(btnAgregar){
        btnAgregar.click(() => {
            abrirModal();
        });
    }
      
    $modalContent.find("#btnCancelar").click(cerrarModal);

    // -----------------------------
    // GUARDAR DATOS
    // -----------------------------
    $modalContent.find("#btnGuardar").click(function() {
        // Leer valores del formulario
        const indexEditar = $modalContent.data("editarIndex");
      
        const nuevoConsorcio = {
            NombreConsorciados: $modalContent.find('input[name="NombreConsorciados"]').val().trim(),
            NombreEmpresa: $modalContent.find('input[name="NombreEmpresa"]').val().trim(),
            Porcentaje: parseFloat($modalContent.find('input[name="Porcentaje"]').val()),
            CodigoSis: parseInt($("#hiddenCodigoSisConsorcio").val(), 10),
            CodigoCobis: parseInt($("#hiddenCodigoCobisConsorcio").val(), 10)
        };        
    
        // Validación completa
        if (
            !nuevoConsorcio.NombreConsorciados ||
            !nuevoConsorcio.NombreEmpresa ||
            isNaN(nuevoConsorcio.CodigoSis) || nuevoConsorcio.CodigoSis < 0 ||
            isNaN(nuevoConsorcio.Porcentaje) || nuevoConsorcio.Porcentaje < 0 || nuevoConsorcio.Porcentaje > 100
        ) {
            mostrarMensaje("Todos los campos son obligatorios. Porcentaje debe ser un número entre 0 y 100, y los códigos enteros ≥ 0.", 'warning', 3000);
            return;
        }
    
        // Validar sumatoria de porcentajes
        const totalPorcentaje = consorcios.reduce((sum, c, idx) => sum + (idx === indexEditar ? 0 : c.Porcentaje), 0) + nuevoConsorcio.Porcentaje;
        if (totalPorcentaje > 100) {
            mostrarMensaje(`La suma de porcentajes no puede superar 100. Actualmente suma ${totalPorcentaje - nuevoConsorcio.Porcentaje}.`, 'warning', 3000);
            return;
        }

        // Validar unicidad de Código SIS y Código COBIS
        const existeCodigoSis = consorcios.some((c, idx) => idx !== indexEditar && c.CodigoSis === nuevoConsorcio.CodigoSis && c.CodigoSis != 0);
        const existeCodigoCobis = consorcios.some((c, idx) => idx !== indexEditar && c.CodigoCobis === nuevoConsorcio.CodigoCobis && c.CodigoCobis != 0);
    
        if (existeCodigoSis || existeCodigoCobis) {
            mostrarMensaje(`Código SIS o Código COBIS ya existen en otro registro.`, 'warning', 3000);
            return;
        }
    
        // Agregar o actualizar registro
        if (indexEditar !== undefined) {
            consorcios[indexEditar] = nuevoConsorcio;
            $modalContent.removeData("editarIndex");
        } else {
            consorcios.push(nuevoConsorcio);
        }
          
        // Limpiar y cerrar modal
        persistirConsorcios();
        cerrarModal();
    
        // Mostrar en consola
        console.log("Consorcios actuales:", consorcios);
        renderizarTabla();
      
    });

    
    // -----------------------------
    // RENDERIZAR TABLA
    // -----------------------------
    function renderizarTabla() {
        const tbody = table.find("tbody");
        tbody.empty();
    
        if (consorcios.length === 0) {
            tbody.append('<tr><td colspan="6" style="text-align:center;">No hay registros</td></tr>');
            return;
        }
    
        consorcios.forEach((item, index) => {
            const fondoFila = index % 2 === 0 ? "white" : "#d6f0ff";
    
            const tr = $("<tr>");
            const td1 = $(`<td>${item.CodigoSis}</td>`).css("background-color", fondoFila);
            const td2 = $(`<td>${item.NombreConsorciados}</td>`).css("background-color", fondoFila);
            const td3 = $(`<td>${item.NombreEmpresa}</td>`).css("background-color", fondoFila);
            const td4 = $(`<td>${formatearNumero(item.Porcentaje)}</td>`).css("background-color", fondoFila);            
            const td5 = $(`<td>${item.CodigoCobis}</td>`).css("background-color", fondoFila);
            const td6 = $(`
                <td>
                    <button class="ant-btn ant-btn-small ant-btn-default btnEditar">Editar</button>
                    <button class="ant-btn ant-btn-small ant-btn-danger btnEliminar" style="margin-left:4px">Eliminar</button>
                </td>
            `).css("background-color", fondoFila);
    
            tr.append(td1, td2, td3, td4, td5, td6);
    
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
    
        table.css("background-color", "white");
    }
    
    // -----------------------------
    // EDITAR Y ELIMINAR
    // -----------------------------
    table.off("click", ".btnEliminar").on("click", ".btnEliminar", function() {
        const index = $(this).closest("tr").index();
        consorcios.splice(index, 1);
        renderizarTabla();
        persistirConsorcios();
    });

    table.off("click", ".btnEditar").on("click", ".btnEditar", function() {
        const index = $(this).closest("tr").index();
        abrirModal(consorcios[index], index);
    });

    // ------------------------------
    // Agregar autocomplete a Empresa
    agregarAutocomplete($modalContent, "input[name='NombreEmpresa']", 5);

    function persistirConsorcios() {
      try {     
        // Convertir el array de consorcios a JSON
        const jsonConsorcios = JSON.stringify(consorcios);
    
        // Asignar al campo hidden
        $("#hiddenValida").val(jsonConsorcios);
        
      } catch (error) {
        mostrarMensaje('Problema de conexión, registro no agregado', 'error', 3000);
      }
    }
  
    function cargarConsorciosDesdeHidden() {
      const valorHidden = $("#hiddenValida").val().trim();
  
      if (!valorHidden) {
          // Si el hidden está vacío, inicializamos el array vacío
          consorcios = [];
          return;
      }
  
      try {
          const data = JSON.parse(valorHidden);
  
          // Validamos que sea un array
          if (Array.isArray(data)) {
              consorcios = data;
          } else {
              console.warn("El contenido del hidden no es un array válido.");
              consorcios = [];
          }
      } catch (e) {
          console.error("Error al parsear JSON del hidden:", e);
          consorcios = [];
      }
    }

    //Lo ultimo que hago es validar si tengo datos y llenar por defecto
    cargarConsorciosDesdeHidden();
    renderizarTabla();

  }catch(error){
    console.error(error);
  }

}

//////////////////////////////////////////////////////////////////////////////////////////
//AUTOCOMPLETE PARA MIEMBROS DEL CONSORCIO
//////////////////////////////////////////////////////////////////////////////////////////

async function obtenerContactos(pagina, cantidad, search) {
    try {
        
        //reemplazamos cualquier caracter especial para evitar inyección de código o errores en la consulta
        search = search.replace(/[%_]/g, '\\$&');

        // filtro por nombre (puedes ampliar luego)
        let filters = `isPerson = 0`;

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
        
        const response = await me.exe("GetContacts", {
            size: cantidad,
            page: pagina,
            filter: filters
        });

        const data = response.outData.map(con => ({
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

            noCobis: con.nationalId ?? 0,
            codigo: con.id ?? 0
        }));

        const total = response.total;

        // Retornamos el objeto con items y total
        return { items: data, total: total };

    } catch (error) {
        console.error("Error al obtener consorciados:", error);
        return { items: [], total: 0 }; // fallback si falla
    }
}

function agregarAutocomplete($modal, inputSelector, cantidadPorPagina = 5) {
    const $input = $modal.find(inputSelector);
    const $inputCodigo = $('#hiddenCodigoSisConsorcio');
    const $inputCodigoCobis = $('#hiddenCodigoCobisConsorcio');
    let paginaActual = 0;
    let totalResultados = 0;
    let filtroActual = "";
    let $dropdown;

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
        const items = await cargarPagina(paginaActual, filtro);

        if (!items.length) return;

        if ($dropdown) {
            $dropdown.remove();
            $dropdown = null;
        }

        const offset = $input.offset();
        
        // crear dropdown
        $dropdown = $("<div></div>")
            .addClass("autocomplete-dropdown")
            .css({
                border: "1px solid #d9d9d9",
                background: "#fff",
                zIndex: 10001,
                maxHeight: "200px",
                overflow: "auto",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
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
                
                $item.click(function(){
                    $input.val(item.nombreCompleto);
                    $inputCodigo.val(item.codigo);
                    $inputCodigoCobis.val(item.noCobis);
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
        //$modal.append($dropdown);
        // SIEMPRE al body (fuera del modal)
        $("body").append($dropdown);

        // posicionar inicialmente
        posicionarDropdown($input, $dropdown);
        
        
        } catch (error) {
        console.error(error);
        }
    }

    $input.on("input", function() {
        const valor = $(this).val().trim();
        if (!valor) {
        if ($dropdown) {
            $dropdown.remove();
            $dropdown = null;
        }
        return;
    }

        mostrarDropdown(valor);
    });

    // Cerrar dropdown al hacer clic fuera **del modal**
    $modal.on("mousedown", function(e) {
        // Si el clic no es en el input ni dentro del dropdown
        if ($dropdown && !$input.is(e.target) && !$dropdown.is(e.target) && $dropdown.has(e.target).length === 0) {
            $dropdown.remove();
        }
    });
    
}

function posicionarDropdown($input, $dropdown) {
    const offset = $input.offset();

    $dropdown.css({
        position: "absolute",
        top: offset.top + $input.outerHeight(),
        left: offset.left,
        width: $input.outerWidth()
    });
}

//////////////////////////////////////////////////////////////////////////////////////////
//generales
//////////////////////////////////////////////////////////////////////////////////////////

function esContactoConsorcio() {
    try{

        if(!contactForm){
            //a modo de prueba
            return true;
        }

        var vForm = contactForm.getFieldsValue();
        var rolesList = vForm?.Roles ?? [];
            
        if (rolesList) {
            var esConsorcio = rolesList != null && rolesList.filter(x=> x.role == "CON")[0] != null;
            return esConsorcio;
        }

        return false;
    
    }
    catch(error){
        console.error(error);
    }
}

function mostrarMensaje(msg, tipo = 'success', duracion = 3000) {
    // Crear contenedor si no existe
    let $container = $("#custom-ant-toast-container");
    if (!$container.length) {
        $container = $('<div id="custom-ant-toast-container"></div>').css({
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)', // centrado horizontal
        width: 'auto',
        'max-width': '400px',
        'z-index': 9999,
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center'
        });
        $('body').append($container);
    }

    // Crear mensaje
    const $msg = $('<div></div>').text(msg).css({
        padding: '8px 16px',
        margin: '8px 0',
        'border-radius': '4px',
        color: '#fff',
        'box-shadow': '0 2px 8px rgba(0,0,0,0.15)',
        opacity: 0,
        transition: 'opacity 0.3s, transform 0.3s',
        transform: 'translateY(-10px)',
        'background-color':
        tipo === 'success' ? '#52c41a' :
        tipo === 'error' ? '#ff4d4f' :
        tipo === 'warning' ? '#faad14' : '#1890ff',
        'text-align': 'center',
        width: '100%',
        'box-sizing': 'border-box'
    });

    $container.append($msg);

    // Animación entrada
    setTimeout(() => {
        $msg.css({ opacity: 1, transform: 'translateY(0)' });
    }, 50);

    // Desaparece después de duración
    setTimeout(() => {
        $msg.css({ opacity: 0, transform: 'translateY(-10px)' });
        setTimeout(() => $msg.remove(), 300);
    }, duracion);

}

function formatearNumero(valor) {
    if (valor === null || valor === undefined) return "0.00";

    // eliminar comas si vienen como separador de miles
    const limpio = String(valor).replace(/,/g, "");

    const numero = parseFloat(limpio);

    if (isNaN(numero)) return "0.00";

    return numero.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
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
waitForElement("#hiddenValida", { interval: 500, maxRetries: 10 })
    .then(($el) => {
        console.log("Listo, encontrado:", $el);
        logica();
    })
    .catch(err => {
        console.warn(err);
    });
