/**
 * Form: FRMContacto_PA_Consorcio
 * Author: Michael Delgado.
 * Email: michael.delgado@axxis-systems.com
 * Created: 2025-01-01
 * Version: 1.2
 * Description: Permite incluir información del consorcio y sus participantes
 * Nota: Evento que valida el rol seleccionado se hace en el comando: cmdValidadorRoles
 *
 * v1.1 (2026-09-04, AXX-249 / GLOB-1218 revisión 1):
 *   - Se elimina la captura manual de Nombre Consorciados; el nombre se deriva del contacto
 *     Consorcio seleccionado y sólo se persiste la referencia {Porcentaje, CodigoSis, CodigoCobis}.
 *
 * v1.2 (2026-09-06, AXX-249 revisión 2, CA-01 a CA-05):
 *   - CA-01: al editar un consorciado ya persistido no se exige volver a seleccionarlo.
 *   - CA-02: el campo Nombre Consorciados no se renderiza en el modal (ni alta ni edición).
 *   - CA-03: tras un alta correcta el modal se cierra y la grilla se actualiza.
 *   - CA-04: si el servicio falla o el contacto no existe, el modal queda abierto, se conservan
 *     los datos y se muestra el mensaje traducido al idioma de la sesión.
 *   - CA-05: el estado de la grilla se lee y se escribe SIEMPRE en el campo hiddenValida, y un
 *     vigilante idempotente reconstruye la grilla si el segundo dibujado de la pestaña la borra.
 *   - El nombre mostrado sale de UN solo campo del contacto (FullName), no de una concatenación.
 */
var me = this;

//Claves de mensaje. Se traducen con GetTranslation contra el idioma de la sesión; si no hay
//traducción cargada, el propio texto es el mensaje (es el mismo criterio del pack de idioma).
var MSG_SELECCION = "Debe seleccionar el contacto Consorcio de la lista";
var MSG_PORCENTAJE = "El porcentaje debe ser un número entre 0 y 100";
var MSG_SUMA = "La suma de porcentajes no puede superar 100";
var MSG_DUPLICADO = "Ese contacto Consorcio ya está en la lista";
var MSG_ERROR_SERVICIO = "No se pudo validar el contacto Consorcio. Revise la conexión e intente nuevamente";
var MSG_INEXISTENTE = "El contacto Consorcio seleccionado ya no existe o no está disponible";
var MSG_AGREGADO = "Consorciado agregado";
var MSG_ACTUALIZADO = "Consorciado actualizado";
var MSG_GUARDANDO = "Guardando...";
var MSG_GUARDAR = "Guardar";

function logica() {
  try {

    cargarTraducciones();

    //Marco el control de número de acta consorcial como obligatorio
    if (esContactoConsorcio()) {
      $("#actaConsorcial").prop("required", true);
    }

    montarEstilos();
    montarContenedor();
    montarBoton();
    montarModal();
    renderizarTabla();
    arrancarVigilante();

  } catch (error) {
    console.error(error);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//ESTADO — vive en el campo hiddenValida, no en una variable de la clausura.
//La pestaña se dibuja dos veces y cada dibujado ejecuta la lógica de nuevo: si el estado
//viviera en una variable, la instancia que guarda y la que dibuja serían distintas.
//////////////////////////////////////////////////////////////////////////////////////////

function leerConsorcios() {
  try {
    const raw = ($("#hiddenValida").val() || "").trim();
    if (!raw) return [];
    const datos = JSON.parse(raw);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.warn("El contenido de hiddenValida no es un arreglo válido.", error);
    return [];
  }
}

function escribirConsorcios(filas) {
  $("#hiddenValida").val(JSON.stringify(filas || []));
}

//////////////////////////////////////////////////////////////////////////////////////////
//TRADUCCIÓN — usa el pack de idioma del producto para el idioma de la sesión
//////////////////////////////////////////////////////////////////////////////////////////

window.axx249Traducciones = window.axx249Traducciones || null;

function idiomaSesion() {
  try {
    return (window.localStorage && localStorage.language) || "es";
  } catch (error) {
    return "es";
  }
}

function cargarTraducciones() {
  if (window.axx249Traducciones) return Promise.resolve(window.axx249Traducciones);
  return me.exe("GetTranslation", { language: idiomaSesion() })
    .then(r => {
      window.axx249Traducciones = (r && r.ok && r.outData) ? r.outData : {};
      return window.axx249Traducciones;
    })
    .catch(error => {
      console.warn("No se pudo cargar el pack de idioma:", error);
      window.axx249Traducciones = {};
      return window.axx249Traducciones;
    });
}

function tr(clave) {
  const mapa = window.axx249Traducciones || {};
  const valor = mapa[clave];
  return (valor && String(valor).trim()) ? String(valor) : clave;
}

//////////////////////////////////////////////////////////////////////////////////////////
//MONTAJE — todo idempotente: si el elemento ya está, se reusa y se reatan los manejadores
//////////////////////////////////////////////////////////////////////////////////////////

function montarEstilos() {
  if ($("#estilosConsorcio").length) return;
  $("head").append(`
    <style id="estilosConsorcio">
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
      .modal-btn-cancel { background:#f0f0f0; margin-right:8px; }
      .modal-btn-save { background:#1890ff; color:white; }
      .modal-btn[disabled] { opacity:0.65; cursor:default; }
    </style>
  `);
}

function montarContenedor() {
  const $hidden = $("#hiddenValida");
  if ($hidden.length === 0) return false;
  const $form = $hidden.closest("form");

  let $contenedor = $form.find("#contenedorConsorcios");
  if ($contenedor.length === 0) {
    $contenedor = $("<div>", { id: "contenedorConsorcios" });
    $form.append($contenedor);
  }

  if ($contenedor.find("table.tablaConsorcios").length === 0) {
    $contenedor.empty().append(`
      <div class="ant-card ant-card-bordered" style="margin-top:10px;">
        <div class="ant-card-body">
          <table class="ant-table tablaConsorcios" style="width:100%; background-color:white;">
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
        </div>
      </div>
    `);
  }

  //Manejadores por delegación y con namespace: reatarlos no los duplica
  $contenedor.off("click.axx249").on("click.axx249", ".btnEliminar", function () {
    const index = $(this).closest("tr").index();
    const filas = leerConsorcios();
    if (index < 0 || index >= filas.length) return;
    filas.splice(index, 1);
    escribirConsorcios(filas);
    renderizarTabla();
  });

  $contenedor.on("click.axx249", ".btnEditar", function () {
    const index = $(this).closest("tr").index();
    const filas = leerConsorcios();
    if (index < 0 || index >= filas.length) return;
    abrirModal(filas[index], index);
  });

  return true;
}

function montarBoton() {
  const $containerActa = $("#actaConsorcial").parent();
  if ($containerActa.length === 0) return;

  let $btn = $containerActa.find(".btn-agregar-consorcio");
  if ($btn.length === 0) {
    $btn = $('<button type="button" class="ant-btn ant-btn-primary btn-agregar-consorcio" style="margin-bottom:10px">Agregar Consorciados</button>');
    $containerActa.append($btn);
    $containerActa.css({ display: "flex", gap: "8px", alignItems: "center" });
  }

  $btn.off("click.axx249").on("click.axx249", function () {
    abrirModal();
  });

  $('label[for="actaConsorcial"]').css({
    width: "100px",
    display: "inline-block",
    whiteSpace: "nowrap"
  });
}

//CA-02: el modal NO tiene campo Nombre Consorciados — ni etiqueta, ni input, ni placeholder.
//El nombre se obtiene del contacto seleccionado y se muestra en la grilla.
function montarModal() {
  if ($("#modalConsorcio").length === 0) {

    const $mask = $('<div id="modalConsorcioMask"></div>').css({
      position: "fixed",
      top: 0, left: 0,
      width: "100%", height: "100%",
      background: "rgba(0,0,0,0.45)",
      zIndex: 9999,
      display: "none"
    });

    const $modal = $(`
      <div id="modalConsorcio">
        <h3 style="margin-bottom:16px; font-size:16px; font-weight:500;">Consorcio</h3>
        <form onsubmit="return false;">
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
      display: "none",
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#fff",
      padding: "24px",
      borderRadius: "4px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 10000,
      width: "400px",
      fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
      fontSize: "14px",
      color: "rgba(0,0,0,0.85)"
    });

    $("body").append($mask).append($modal);
  }

  $("#btnCancelar").off("click.axx249").on("click.axx249", cerrarModal);
  $("#btnGuardar").off("click.axx249").on("click.axx249", guardarConsorciado);

  agregarAutocomplete($("#modalConsorcio"), "input[name='NombreEmpresa']", 5);
}

//El segundo dibujado de la pestaña reemplaza el formulario entero y se lleva la grilla puesta.
//Este vigilante la repone y la vuelve a pintar cuando el valor guardado cambia.
function arrancarVigilante() {
  if (window.axx249Tick) {
    clearInterval(window.axx249Tick);
    window.axx249Tick = null;
  }

  let ausencias = 0;

  window.axx249Tick = setInterval(function () {
    try {
      if ($("#hiddenValida").length === 0) {
        ausencias++;
        if (ausencias > 30) {
          clearInterval(window.axx249Tick);
          window.axx249Tick = null;
        }
        return;
      }
      ausencias = 0;

      if ($("#contenedorConsorcios table.tablaConsorcios").length === 0) {
        montarContenedor();
        montarBoton();
        renderizarTabla();
        return;
      }

      if ($(".btn-agregar-consorcio").length === 0) montarBoton();

      if (($("#hiddenValida").val() || "") !== (window.axx249UltimoHidden || "")) {
        renderizarTabla();
      }

      if (esContactoConsorcio()) $("#actaConsorcial").prop("required", true);

    } catch (error) {
      console.error(error);
    }
  }, 600);
}

//////////////////////////////////////////////////////////////////////////////////////////
//MODAL
//////////////////////////////////////////////////////////////////////////////////////////

function abrirModal(fila, index) {
  const $modal = $("#modalConsorcio");
  if ($modal.length === 0) return;

  $("#btnGuardar").prop("disabled", false).text(tr(MSG_GUARDAR));

  if (fila) {
    //Edición: se recuerda la referencia ya persistida para no exigir volver a seleccionarla (CA-01)
    const nombre = nombreDeContacto(fila.CodigoSis, fila.NombreEmpresa || fila.NombreConsorciados);
    $modal.find("input[name='NombreEmpresa']").val(nombre);
    $modal.find("input[name='Porcentaje']").val(formatearNumero(fila.Porcentaje));
    $("#hiddenCodigoSisConsorcio").val(fila.CodigoSis || "");
    $("#hiddenCodigoCobisConsorcio").val(fila.CodigoCobis || 0);
    $modal.data("editarIndex", index);
    $modal.data("codigoSisOriginal", parseInt(fila.CodigoSis, 10) || 0);
    $modal.data("codigoCobisOriginal", parseInt(fila.CodigoCobis, 10) || 0);
    $modal.data("nombreOriginal", nombre || "");
  } else {
    $modal.find("input").val("");
    $modal.removeData("editarIndex");
    $modal.removeData("codigoSisOriginal");
    $modal.removeData("codigoCobisOriginal");
    $modal.removeData("nombreOriginal");
  }

  $modal.show();
  $("#modalConsorcioMask").show();
}

function cerrarModal() {
  const $modal = $("#modalConsorcio");
  $modal.hide();
  $("#modalConsorcioMask").hide();
  $modal.find("input").val("");
  $modal.removeData("editarIndex");
  $modal.removeData("codigoSisOriginal");
  $modal.removeData("codigoCobisOriginal");
  $modal.removeData("nombreOriginal");
  $(".autocomplete-dropdown").remove();
}

//Lee el contacto antes de aceptar la fila. Es lo que permite distinguir un contacto inexistente
//de una caída del servicio, y es la ruta de error de CA-04.
async function buscarContacto(id) {
  try {
    const r = await me.exe("GetContacts", { operation: "GET", filter: "id = " + id, size: 1 });
    if (!r || r.ok === false) return { ok: false };
    const contacto = (r.outData || [])[0];
    if (!contacto) return { ok: true, existe: false };
    return { ok: true, existe: true, nombre: nombreCompletoDeContacto(contacto) };
  } catch (error) {
    console.error("Error al validar el contacto Consorcio:", error);
    return { ok: false };
  }
}

async function guardarConsorciado() {
  const $modal = $("#modalConsorcio");
  const $btn = $("#btnGuardar");

  const indexEditar = $modal.data("editarIndex");
  const esEdicion = (indexEditar !== undefined && indexEditar !== null);

  const porcentaje = parseFloat($modal.find("input[name='Porcentaje']").val());
  let codigoSis = parseInt($("#hiddenCodigoSisConsorcio").val(), 10);
  let codigoCobis = parseInt($("#hiddenCodigoCobisConsorcio").val(), 10);

  //CA-01: en edición, si el usuario no tocó el contacto, vale la referencia ya persistida
  if (esEdicion && !(codigoSis > 0)) {
    const nombreActual = ($modal.find("input[name='NombreEmpresa']").val() || "").trim();
    const nombreOriginal = ($modal.data("nombreOriginal") || "").trim();
    if (nombreActual === nombreOriginal) {
      codigoSis = parseInt($modal.data("codigoSisOriginal"), 10) || 0;
      codigoCobis = parseInt($modal.data("codigoCobisOriginal"), 10) || 0;
    }
  }

  if (!(codigoSis > 0)) {
    mostrarMensaje(tr(MSG_SELECCION), "warning", 4000);
    return;
  }
  if (isNaN(codigoCobis) || codigoCobis < 0) codigoCobis = 0;

  if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    mostrarMensaje(tr(MSG_PORCENTAJE), "warning", 4000);
    return;
  }

  const filas = leerConsorcios();

  const totalPorcentaje = filas.reduce(function (suma, c, i) {
    return suma + (i === indexEditar ? 0 : (parseFloat(c.Porcentaje) || 0));
  }, 0) + porcentaje;
  if (totalPorcentaje > 100) {
    mostrarMensaje(tr(MSG_SUMA) + " (" + formatearNumero(totalPorcentaje - porcentaje) + ")", "warning", 4000);
    return;
  }

  //Unicidad: se conserva tal cual estaba antes de AXX-249 — por Código SIS y por Código COBIS,
  //ignorando los ceros. No se agrega ninguna regla de unicidad nueva.
  const duplicadoSis = filas.some(function (c, i) {
    return i !== indexEditar && parseInt(c.CodigoSis, 10) === codigoSis && codigoSis !== 0;
  });
  const duplicadoCobis = filas.some(function (c, i) {
    return i !== indexEditar && parseInt(c.CodigoCobis, 10) === codigoCobis && codigoCobis !== 0;
  });
  if (duplicadoSis || duplicadoCobis) {
    mostrarMensaje(tr(MSG_DUPLICADO), "warning", 4000);
    return;
  }

  //CA-04: si esto falla, el modal queda abierto y con los datos puestos
  $btn.prop("disabled", true).text(tr(MSG_GUARDANDO));
  const contacto = await buscarContacto(codigoSis);
  $btn.prop("disabled", false).text(tr(MSG_GUARDAR));

  if (!contacto.ok) {
    mostrarMensaje(tr(MSG_ERROR_SERVICIO), "error", 6000);
    return;
  }
  if (!contacto.existe) {
    mostrarMensaje(tr(MSG_INEXISTENTE), "error", 6000);
    return;
  }

  window.mapaNombresConsorciados[codigoSis] = contacto.nombre;

  //Sólo se persiste la referencia al contacto y el porcentaje; el nombre se resuelve al mostrar
  const fila = { Porcentaje: porcentaje, CodigoSis: codigoSis, CodigoCobis: codigoCobis };
  if (esEdicion) filas[indexEditar] = fila; else filas.push(fila);

  escribirConsorcios(filas);

  //CA-03: primero se actualiza la grilla, después se cierra el modal
  renderizarTabla();
  cerrarModal();
  mostrarMensaje(tr(esEdicion ? MSG_ACTUALIZADO : MSG_AGREGADO), "success", 3000);
}

//////////////////////////////////////////////////////////////////////////////////////////
//GRILLA
//////////////////////////////////////////////////////////////////////////////////////////

function renderizarTabla() {
  const $tbody = $("#contenedorConsorcios table.tablaConsorcios tbody");
  if ($tbody.length === 0) return;

  const filas = leerConsorcios();
  window.axx249UltimoHidden = $("#hiddenValida").val() || "";

  pintarFilas(filas);

  //El nombre no está guardado: se resuelve desde el contacto y se repinta cuando llega.
  resolverNombres(filas.map(function (f) { return f.CodigoSis; })).then(function () {
    if (($("#hiddenValida").val() || "") === (window.axx249UltimoHidden || "")) {
      pintarFilas(leerConsorcios());
    }
  });
}

function pintarFilas(filas) {
  const $tbody = $("#contenedorConsorcios table.tablaConsorcios tbody");
  if ($tbody.length === 0) return;
  $tbody.empty();

  if (!filas.length) {
    $tbody.append('<tr><td colspan="6" style="text-align:center;">No hay registros</td></tr>');
    return;
  }

  filas.forEach(function (item, index) {
    const fondoFila = index % 2 === 0 ? "white" : "#d6f0ff";
    const nombre = nombreDeContacto(item.CodigoSis, item.NombreConsorciados);
    const nombreEmpresa = nombreDeContacto(item.CodigoSis, item.NombreEmpresa);

    const tr = $("<tr>");
    const td1 = $("<td>").text(item.CodigoSis).css("background-color", fondoFila);
    const td2 = $("<td>").text(nombre).css("background-color", fondoFila);
    const td3 = $("<td>").text(nombreEmpresa).css("background-color", fondoFila);
    const td4 = $("<td>").text(formatearNumero(item.Porcentaje)).css("background-color", fondoFila);
    const td5 = $("<td>").text(item.CodigoCobis).css("background-color", fondoFila);
    const td6 = $(`
      <td>
        <button type="button" class="ant-btn ant-btn-small ant-btn-default btnEditar">Editar</button>
        <button type="button" class="ant-btn ant-btn-small ant-btn-danger btnEliminar" style="margin-left:4px">Eliminar</button>
      </td>
    `).css("background-color", fondoFila);

    tr.append(td1, td2, td3, td4, td5, td6);

    tr.hover(
      function () { $(this).find("td").css("background-color", "#bae7ff"); },
      function () { $(this).find("td").css("background-color", fondoFila); }
    );

    $tbody.append(tr);
  });
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
            nombreCompleto: nombreCompletoDeContacto(con),

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
                
                $item.off("click.axx249").on("click.axx249", function(){
                    $input.val(item.nombreCompleto);
                    $inputCodigo.val(item.codigo);
                    $inputCodigoCobis.val(item.noCobis);
                    //El nombre mostrado en la grilla sale del contacto Consorcio elegido
                    window.mapaNombresConsorciados[item.codigo] = item.nombreCompleto;
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

    $input.off("input.axx249").on("input.axx249", function() {
        //Tipear invalida la selección anterior: sin contacto elegido no hay referencia.
        //En edición, guardarConsorciado repone la referencia original si el texto no cambió (CA-01).
        $inputCodigo.val("");
        $inputCodigoCobis.val("");

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
    $modal.off("mousedown.axx249").on("mousedown.axx249", function(e) {
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
//NOMBRE DEL CONSORCIADO — SIEMPRE DERIVADO DEL CONTACTO CONSORCIO SELECCIONADO
//No se captura a mano y no se guarda copia: se resuelve desde el contacto relacionado.
//////////////////////////////////////////////////////////////////////////////////////////

window.mapaNombresConsorciados = window.mapaNombresConsorciados || {};

//El nombre sale de UN solo campo del contacto — FullName, que es el nombre que el propio
//producto compone — y NO de concatenar name+surname. Concatenar duplicaba la razón social
//de las empresas, que la traen repetida en dos campos ("BANCO GENERAL BANCO GENERAL").
function nombreCompletoDeContacto(con) {
    if (!con) return "";
    const candidatos = [con.FullName, con.fullName, con.surname2, con.name];
    for (let i = 0; i < candidatos.length; i++) {
        const v = (candidatos[i] ?? '').toString().trim();
        if (v) return v;
    }
    return "";
}

//Devuelve el nombre del contacto ya resuelto. `respaldo` sólo cubre filas históricas
//guardadas antes de este cambio, que no tienen contacto relacionado.
function nombreDeContacto(codigoSis, respaldo) {
    const id = parseInt(codigoSis, 10);
    if (!(id > 0)) return respaldo || "";
    const nombre = window.mapaNombresConsorciados[id];
    if (nombre) return nombre;
    return respaldo || "";
}

//Una sola lectura para todos los contactos de la grilla.
async function resolverNombres(codigos) {
    try {
        const ids = (codigos || [])
            .map(x => parseInt(x, 10))
            .filter(x => x > 0)
            .filter((x, i, a) => a.indexOf(x) === i)
            .filter(x => !window.mapaNombresConsorciados[x]);

        if (!ids.length) return window.mapaNombresConsorciados;

        const respuesta = await me.exe("GetContacts", {
            operation: "GET",
            filter: `id in (${ids.join(",")})`,
            size: ids.length
        });

        (respuesta?.outData ?? []).forEach(con => {
            window.mapaNombresConsorciados[con.id] = nombreCompletoDeContacto(con);
        });

        return window.mapaNombresConsorciados;
    } catch (error) {
        console.error("Error al resolver el nombre de los consorciados:", error);
        return window.mapaNombresConsorciados;
    }
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
