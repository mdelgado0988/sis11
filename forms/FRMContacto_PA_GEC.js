/**
 * @name FRMContacto_PA_GEC
 * @description Manages the contact information and company/shareholder data for the GEC form.
 * @type FORM
 * @author Michael Delgado
 * @created 2026/09/07
 * @version 1.0
 * @purpose Display, load, and manage related companies and shareholders associated with the contact.
 */

  var mi = this;

  function logica() {
    try {

      const $hidden = $('#hiddenValidaGEC');
      const $form = $hidden.closest('form');
      let empresas = [];
  
      // Contenedor único
      let $contenedor = $form.find("#contenedorEmpresas");
      if ($contenedor.length === 0) {
        $contenedor = $("<div>", { id: "contenedorEmpresas" });
        $form.append($contenedor);
      } else {
        $contenedor.empty();
      }

      $("#modalEmpresa, #modalAccionista, #modalMask").remove();
  
      // Tabla
      const tableCard = $("<div id='tableCard'>", { class: "ant-card ant-card-bordered", style: "margin-top:10px;" });
      const tableBody = $("<div id='tableBody'>", { class: "ant-card-body" });
  
      const table = $(`
        <table class="ant-table" style="width:100%">
          <thead class="ant-table-thead">
            <tr>
              <th>Codigo</th>
              <th>Nombre Empresa</th>
              <th>Accionista</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody class="ant-table-tbody">
            <tr><td colspan="4" style="text-align:center;">No hay registros</td></tr>
          </tbody>
        </table>
      `);
  
      tableBody.append(table);
      tableCard.append(tableBody);
      $contenedor.append(tableCard);

      //campo oculto para manejo de indice de accionistas.
      let $hiddenAcc = $form.find("#empresaIndexAcc");
      if ($hiddenAcc.length === 0) {
          $hiddenAcc = $("<input>", { type: "hidden", id: "empresaIndexAcc", value: "" });
          $form.append($hiddenAcc);
      }
  
      // Botón agregar empresa
      const btnAgregarEmpresa = $('<button class="ant-btn ant-btn-primary" style="margin-bottom:10px">Agregar empresa</button>');
      $contenedor.prepend(btnAgregarEmpresa);
  
      // Máscara común
      const $mask = $('<div id="modalMask"></div>').css({
        position:'fixed', top:0, left:0, width:'100%', height:'100%',
        background:'rgba(0,0,0,0.45)', zIndex:9999, display:'none'
      }).appendTo("body");
  
      // Modal empresa
      const $modalEmpresa = $(`
        <div id="modalEmpresa">
          <h3>Agregar / Editar Empresa</h3>
          <form>
            <div style="margin-bottom:12px;">
              <label>Empresa</label>
              <input type="text" name="Empresa" class="modal-input"/>
            </div>
            <div style="text-align:right; margin-top:16px;">
              <button type="button" class="modal-btn modal-btn-cancel" id="btnCancelarEmpresa">Cancelar</button>
              <button type="button" class="modal-btn modal-btn-save" id="btnGuardarEmpresa">Guardar</button>
            </div>
          </form>
        </div>
      `).css({
        display:'none', position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#fff', padding:'24px', borderRadius:'4px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
        zIndex:10000, width:'400px'
      }).appendTo("body");
  
      // Modal accionista
      const $modalAccionista = $(`
        <div id="modalAccionista">
          <h3>Agregar / Editar Accionista</h3>
          <form>            
            <div style="margin-bottom:12px;">
              <label>Accionista</label>
              <input type="text" name="Accionista" class="modal-input"/>
            </div>
            <div style="text-align:right; margin-top:16px;">
              <button type="button" class="modal-btn modal-btn-cancel" id="btnCancelarAcc">Cancelar</button>
              <button type="button" class="modal-btn modal-btn-save" id="btnGuardarAcc">Guardar</button>
            </div>
          </form>
        </div>
      `).css({
        display:'none', position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#fff', padding:'24px', borderRadius:'4px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
        zIndex:10000, width:'400px'
      }).appendTo("body");
  
      // Funciones abrir/cerrar modales
      function abrirModalEmpresa(data=null, index=null){
        try {         
        
          $modalEmpresa.show(); $mask.show();
          if(data && index!==null){ 
            $modalEmpresa.data("editar",index); 
            $modalEmpresa.find("input[name='Empresa']").val(data.nombreEmpresa);
            $modalEmpresa.find("input[name='PorcentajeEmpresa']").val(data.porcentaje);
            $("#hiddenCodigoContacto").val(data.codigoEmpresa);
          } else {
            $modalEmpresa.find("input").val(""); $modalEmpresa.removeData("editar"); 
          }
          
        } catch (error) {
         console.error(error) ;
        }
      }
      
      function cerrarModalEmpresa()
      { 
        $modalEmpresa.hide();
        $mask.hide(); 
        $modalEmpresa.find("input").val(""); 
        $modalEmpresa.removeData("editar"); 
      }
  
      function abrirModalAccionista(data = null, indices = null, indexEmpresa = null) {
        try {
          
          $modalAccionista.show();
          $mask.show();
      
          const $hiddenAcc = $("#empresaIndexAcc");
      
          // Guardar índice de empresa
          if (indexEmpresa !== null) {
              $hiddenAcc.val(indexEmpresa);
          } else if (indices && indices.empresaIndex !== undefined) {
              $hiddenAcc.val(indices.empresaIndex);
          }
      
          if (data && indices) {
              $modalAccionista.find("input[name='Accionista']").val(data.nombre);
              $modalAccionista.find("input[name='PorcentajeAccionista']").val(data.porcentaje);
              $modalAccionista.data("editar", indices);
          } else {
              $modalAccionista.find("input[name='Accionista']").val("");
              $modalAccionista.find("input[name='PorcentajeAccionista']").val("");
              $modalAccionista.removeData("editar");
          }
        } catch (error) {
          console.error(error);
        }
      }

      function cerrarModalAccionista(){ 
        try {
          
          $modalAccionista.hide();
          $mask.hide();
          $modalAccionista.find("input[name='Accionista']").val(""); 
          $modalAccionista.find("input[name='PorcentajeAccionista']").val("");
          $modalAccionista.removeData("editar"); 
          $("#empresaIndexAcc").val("");

        } catch (error) {
          console.error(error);
        }
      }

      $(document)
      .off("click", "#btnCancelarEmpresa")
      .on("click", "#btnCancelarEmpresa", cerrarModalEmpresa);

      $(document)
      .off("click", "#btnCancelarAcc")
      .on("click", "#btnCancelarAcc", cerrarModalAccionista);
  
      //$("#btnCancelarAcc").click(cerrarModalAccionista);
      btnAgregarEmpresa.click(()=> abrirModalEmpresa());
  
      // ------------------------------
      // Agregar autocomplete a Empresa
      agregarAutocomplete($modalEmpresa, "input[name='Empresa']", 5);
  
      // ------------------------------
      // Guardar empresa
      //$("#btnGuardarEmpresa").click(()=>{
      $(document)
      .off("click", "#btnGuardarEmpresa")
      .on("click", "#btnGuardarEmpresa", function () {
        try {
          const nombre = $modalEmpresa.find("input[name='Empresa']").val().trim();
          const codigo = $("#hiddenCodigoContacto").val();
          if(!nombre){ mostrarMensaje("Debe seleccionar una empresa",'warning',3000); return; }

          const editar = $modalEmpresa.data("editar");
          // AXX-233: el % se retira de la interfaz. El valor historico ya guardado se conserva.
          const porcentaje = (editar!==undefined && empresas[editar] && empresas[editar].porcentaje!==undefined)
            ? empresas[editar].porcentaje : 0;
    
          if(editar!==undefined){
            empresas[editar].nombreEmpresa = nombre;
            empresas[editar].porcentaje = porcentaje;
            empresas[editar].codigoEmpresa = codigo;
          } else {
            empresas.push({
              codigoEmpresa:codigo,
              nombreEmpresa:nombre, 
              porcentaje:porcentaje, 
              accionistas:[]});
          }
          persistirEmpresas(); cerrarModalEmpresa(); renderizarTabla();
          // AXX-233 (CA14): al agregar un integrante se le asigna el grupo economico
          // y se persiste en su formulario 609, sin perder el resto de su informacion.
          if (codigo && editar === undefined) { gecSincronizarIntegrante(codigo); }
        } catch (error) {
          mostrarMensaje(error, 'error', 3000);
        }        
      });
  
      // Guardar accionista
      //$("#btnGuardarAcc").click(()=>{
      $(document)
      .off("click", "#btnGuardarAcc")
      .on("click", "#btnGuardarAcc", function () {           
        try {
          
          const editar = $modalAccionista.data("editar");
          const nombre = $modalAccionista.find("input[name='Accionista']").val().trim();
          if(!nombre){
              mostrarMensaje("Debe indicar el nombre del accionista",'warning',3000);
              return;
          }
          // AXX-233: el % se retira de la interfaz. El valor historico ya guardado se conserva.
          const porcentaje = (editar && empresas[editar.empresaIndex]
              && empresas[editar.empresaIndex].accionistas
              && empresas[editar.empresaIndex].accionistas[editar.accionistaIndex])
            ? (empresas[editar.empresaIndex].accionistas[editar.accionistaIndex].porcentaje || 0) : 0;
      
          const empresaIndex = parseInt($("#empresaIndexAcc").val(), 10);
          if (isNaN(empresaIndex)){
              mostrarMensaje("Error interno: índice de empresa inválido", "error", 3000);
              return;
          }
      
          if(!empresas[empresaIndex].accionistas){
              empresas[empresaIndex].accionistas = [];
          }
      
          const accionistas = empresas[empresaIndex].accionistas;
      
      
          if(editar){
              empresas[editar.empresaIndex].accionistas[editar.accionistaIndex] = {nombre, porcentaje};
          } else {
              accionistas.push({nombre, porcentaje});
              empresas[empresaIndex].accionistas = accionistas;
          }
      
          persistirEmpresas();
          cerrarModalAccionista();
          renderizarTabla();
        } catch (error) {
          console.error(error);
        }
      });
  
      // Renderizar tabla
      /* ------------------------------------------------------------------
       * AXX-248 — detalle de accionistas registrado en frmAccionistasContacto.
       * SOLO CONSULTA VISUAL: se lee del propio contacto de cada empresa y se
       * resuelve en tiempo real. Sin agregar, editar, eliminar ni cambiar %.
       * No toca la captura manual preexistente (hiddenValidaGEC).
       * ---------------------------------------------------------------- */
      const ACC_TAB_666 = 'Accionistas';
      const accSisCache = {};

      // [{id, porcentaje}] guardado en la pestania Accionistas del contacto empresa.
      function accSisLeer(jcf) {
        try {
          const obj = typeof jcf === 'string' ? JSON.parse(jcf || '{}') : (jcf || {});
          const tab = obj[ACC_TAB_666];
          if (!tab) return [];
          const campos = typeof tab === 'string' ? JSON.parse(tab) : tab;
          const f = (campos || []).filter(function (c) { return c && c.name === 'Accionistas'; })[0];
          const raw = (f && f.userData && f.userData[0]) ? String(f.userData[0]).trim() : '';
          if (!raw) return [];
          const arr = JSON.parse(raw);
          return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
      }

      function accSisNombre(c) {
        if (!c) return '';
        if (c.isPerson) return [c.name, c.surname1].filter(function (x) { return String(x || '').trim(); }).join(' ').trim();
        return String(c.surname2 || c.name || '').trim();
      }

      function accSisEsc(s) {
        return String(s === null || s === undefined ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      }

      // CA15/CA16: cada empresa muestra SU propio detalle, aislado por el id de contacto.
      async function accSisPintarFila(tbody, empresa, indexEmpresa) {
        try {
          const codigo = empresa.codigoEmpresa;
          if (!codigo) return;
          let emp = accSisCache['e' + codigo];
          if (!emp) {
            const re = await mi.exe('GetContacts', { filter: 'id = ' + (parseInt(codigo, 10) || 0), size: 1 });
            emp = (re && re.ok && re.outData) ? re.outData[0] : null;
            if (emp) accSisCache['e' + codigo] = emp;
          }
          if (!emp) return;

          const lista = accSisLeer(emp.jCustomForms);
          const $padre = tbody.find('.empresaRow[data-index="' + indexEmpresa + '"]');
          const actualizarContador = function (cantidadSIS) {
            if ($padre.length) {
              $padre.find('.accionistaCount').text(empresa.accionistas.length + cantidadSIS);
            }
          };

          if (!lista.length) {
            actualizarContador(0);
            return;
          }

          // CA10/CA14: los datos del accionista se releen del contacto, no de lo guardado.
          const ids = lista.map(function (a) { return parseInt(a.id, 10) || 0; }).filter(function (i) { return i; });
          const rc = await mi.exe('GetContacts', { size: ids.length, page: 0, filter: 'id IN (' + ids.join(',') + ')' });
          const porId = {};
          if (rc && rc.ok) (rc.outData || []).forEach(function (c) { porId[String(c.id)] = c; });

          const visible = $padre.data('expanded') === true;
          const $ancla = $('.accSisCab_' + indexEmpresa);
          actualizarContador(lista.length);
          if ($ancla.length) return;   // idempotente

          const $cab = $('<tr class="detalleAcc_' + indexEmpresa + ' accSisCab_' + indexEmpresa + '"' +
            ' style="background:#f0f5ff' + (visible ? '' : ';display:none') + '">' +
            '<td></td><td colspan="3" style="font-size:12px;color:#555">' +
            'Accionistas registrados (solo consulta) — Número (SIS) · Nombre · % · COBIS · PEP</td></tr>');

          // Insertar el detalle debajo de su empresa, no al final de la grilla.
          let $insertAfter = tbody.find('.detalleAcc_' + indexEmpresa).last();
          if (!$insertAfter.length) $insertAfter = $padre;
          $insertAfter.after($cab);
          $insertAfter = $cab;

          lista.forEach(function (a) {
            const c = porId[String(a.id)] || null;
            const pep = c ? (c.publicStatus ? 'Sí' : 'No') : '—';
            const cobis = c ? accSisEsc(c.nationalId || '') : '—';
            const $tr = $('<tr class="detalleAcc_' + indexEmpresa + ' accSisRow_' + indexEmpresa + '"' +
              ' style="background:#fafafa' + (visible ? '' : ';display:none') + '">' +
              '<td>' + accSisEsc(a.id) + '</td>' +
              '<td>' + accSisEsc(c ? accSisNombre(c) : '(contacto no disponible)') + '</td>' +
              '<td>' + accSisEsc(a.porcentaje) + '% · COBIS: ' + cobis + ' · PEP: ' + pep + '</td>' +
              '<td style="color:#999;font-size:12px">Solo consulta</td>' +
              '</tr>');
            $insertAfter.after($tr);
            $insertAfter = $tr;
          });
        } catch (e) { console.error('AXX-248 detalle accionistas:', e); }
      }

      function renderizarTabla(){       
        try {
          
          const tbody = table.find("tbody"); 
          tbody.empty();
      
          if(empresas.length === 0){ 
              tbody.append('<tr><td colspan="4" style="text-align:center;">No hay registros</td></tr>'); 
              return; 
          }
          
          empresas.forEach((empresa, indexEmpresa)=>{
              if(!empresa.accionistas) empresa.accionistas = []; // Asegurar arreglo de accionistas
              const totalAcc = empresa.accionistas.reduce((s,a)=> s + (parseFloat(a.porcentaje)||0), 0);
      
              // Fila empresa con ícono desplegable
              const trPadre = $(`
                  <tr class="empresaRow" data-index="${indexEmpresa}" style="background:#e6f7ff; font-weight:bold; cursor:pointer">
                      <td>${empresa.codigoEmpresa}</td>
                      <td>${empresa.nombreEmpresa}</td>
                      <td style="display:flex; align-items:center;">
                          <span class="toggleAcc" style="margin-right:6px; transition: transform 0.2s;">▶</span>
                          Accionistas: <span class="accionistaCount">${empresa.accionistas.length}</span>
                      </td>
                      <td>
                          <button class="ant-btn ant-btn-primary btnAddAccionista" data-index="${indexEmpresa}">+ Accionista</button>
                          <button class="ant-btn ant-btn-default btnEditarEmpresa" data-index="${indexEmpresa}" style="margin-left:4px">Editar</button>
                      </td>
                  </tr>
              `);
              tbody.append(trPadre);
      
              // Filas de accionistas
              empresa.accionistas.forEach((acc, indexAcc)=>{
                  const trAcc = $(`
                      <tr class="detalleAcc_${indexEmpresa}" style="display:none; background:#fafafa">
                          <td></td><td></td>
                          <td>${acc.nombre}</td>
                          <td>
                              <button class="ant-btn ant-btn-small ant-btn-default btnEditarAcc" data-emp="${indexEmpresa}" data-acc="${indexAcc}">Editar</button>
                          </td>
                      </tr>
                  `);
                  tbody.append(trAcc);
              });

              // AXX-248: detalle de accionistas de frmAccionistasContacto, solo consulta.
              accSisPintarFila(tbody, empresa, indexEmpresa);
          });
      
          // Expandir / colapsar accionistas
          $(".empresaRow").off("click").on("click", function(){
            try {
              const indexEmpresa = $(this).data("index");
              const $detalles = $(`.detalleAcc_${indexEmpresa}`);
              $detalles.toggle();
              $(this).data('expanded', $detalles.is(':visible'));
      
              // Rotar ícono
              const $icon = $(this).find(".toggleAcc");
              $icon.css("transform", $detalles.is(":visible") ? "rotate(90deg)" : "rotate(0deg)");
            } catch (error) {
              console.error(error);
            }            
          });
      
          // Botón agregar accionista
          $(".btnAddAccionista").off("click").on("click", function(e){
            try {
              e.stopPropagation();
              const indexEmpresa = $(this).data("index");
              abrirModalAccionista(null, null, indexEmpresa);
            } catch (error) {
             console.error(error);
            }
          });
  
          $(".btnEditarEmpresa").off("click").on("click", function(e){
            try {
              e.stopPropagation();
              const index = $(this).data("index");
              abrirModalEmpresa(empresas[index], index); // Abrir modal con datos para editar
            } catch (error) {
              console.error(error)  ;
            }
          });
      
          // Editar empresa
          $(".btnAddAccionista").off("click").on("click", function(e){
            try {           
              e.stopPropagation();
              const indexEmpresa = $(this).data("index");
              abrirModalAccionista(null, null, indexEmpresa);
            } catch (error) {
              console.error(error);
            }
          });        
      
          // Eliminar / editar accionista
          table.off("click",".btnEliminarAcc").on("click",".btnEliminarAcc",function(e){
            try {
              
              e.stopPropagation();
              const emp = $(this).data("emp");
              const acc = $(this).data("acc");
              empresas[emp].accionistas.splice(acc,1);
              persistirEmpresas();
              renderizarTabla();
            } catch (error) {
              console.error(error);
            }
          });
      
          table.off("click", ".btnEditarAcc").on("click", ".btnEditarAcc", function(e){
            try {
              
              e.stopPropagation();
              const emp = $(this).data("emp");
              const acc = $(this).data("acc");
              abrirModalAccionista(empresas[emp].accionistas[acc], {empresaIndex: emp, accionistaIndex: acc});
            } catch (error) {
              console.error(error);
            }
          });
      
          // Eliminar empresa completa
          table.off("click",".btnEliminarEmpresa").on("click",".btnEliminarEmpresa",function(e){
            try {
              
              e.stopPropagation();
              const index = $(this).data("index");
              empresas.splice(index,1); 
              persistirEmpresas();
              renderizarTabla();
            } catch (error) {
              console.error(error);
            }
          });

        } catch (error) {
          console.error(error);
        }
      }
  
      function persistirEmpresas(){ $("#hiddenValidaGEC").val(JSON.stringify(empresas)); }
      function cargarEmpresasDesdeHidden(){ try{ empresas = $("#hiddenValidaGEC").val().trim()?JSON.parse($("#hiddenValidaGEC").val()):[]; }catch(e){ empresas=[]; } }
  
      /* ------------------------------------------------------------------
       * AXX-233 — carga por defecto de los integrantes del grupo economico
       * y sincronizacion hacia el formulario 609 al agregar uno.
       * ---------------------------------------------------------------- */
      const GEC_TAB_609 = 'Información de Compañías';
      // 🔴 Sin estas colecciones, guardar un contacto que SI las tiene falla con
      // "Object reference not set to an instance of an object" y no escribe nada:
      // la lectura simple las devuelve en null y el guardado no lo tolera.
      const GEC_INCLUDE = ['Roles', 'Phones', 'Emails', 'Addresses', 'Tags', 'Documents',
        'Comments', 'Relationships', 'MedicalHistory', 'FamilyRecord', 'Branches'];

      function gecLeerGrupo(jcf) {
        try {
          const obj = typeof jcf === 'string' ? JSON.parse(jcf || '{}') : (jcf || {});
          const tab = obj[GEC_TAB_609];
          if (!tab) return '';
          const campos = typeof tab === 'string' ? JSON.parse(tab) : tab;
          const f = (campos || []).filter(function (c) { return c && c.name === 'grupoEconomico'; })[0];
          return (f && f.userData && f.userData[0]) ? String(f.userData[0]).trim() : '';
        } catch (e) { return ''; }
      }

      // Grupo economico del contacto abierto: el registrado en el contacto.
      async function gecContextoActual() {
        let contactoId = null;
        try {
          const vForm = (typeof contactForm !== 'undefined' && contactForm) ? contactForm.getFieldsValue() : null;
          if (vForm) {
            contactoId = vForm.id;
            const g = gecLeerGrupo(vForm.jCustomForms);
            if (g) return { contactoId: contactoId, grupo: g };
          }
        } catch (e) { /* se resuelve por API abajo */ }
        if (!contactoId) return { contactoId: null, grupo: '' };
        const r = await mi.exe('GetContacts', { filter: 'id=' + contactoId, size: 1 });
        const c = (r && r.ok && r.outData) ? r.outData[0] : null;
        return { contactoId: contactoId, grupo: c ? gecLeerGrupo(c.jCustomForms) : '' };
      }

      // CA12: la grilla muestra por defecto todos los contactos del mismo grupo.
      // Lo ya guardado se conserva: los integrantes encontrados se AGREGAN.
      async function gecCargarIntegrantes() {
        try {
          const ctx = await gecContextoActual();
          if (!ctx.grupo) return;
          const r = await mi.exe('GetContacts', {
            size: 200, page: 0,
            filter: "jCustomForms LIKE '%GEC#" + ctx.grupo + "#%'"
          });
          if (!r || !r.ok) return;
          const yaEstan = {};
          empresas.forEach(function (e) { yaEstan[String(e.codigoEmpresa)] = true; });
          let agregadas = 0;
          (r.outData || []).forEach(function (c) {
            if (String(c.id) === String(ctx.contactoId)) return;   // el propio contacto no es integrante de si mismo
            if (yaEstan[String(c.id)]) return;                     // ya listado: conserva sus accionistas
            empresas.push({
              codigoEmpresa: c.id,
              nombreEmpresa: String(c.surname2 || c.FullName || '').trim(),
              porcentaje: 0,
              accionistas: []
            });
            agregadas++;
          });
          if (agregadas > 0) { persistirEmpresas(); renderizarTabla(); }
        } catch (e) { console.error('GEC integrantes:', e); }
      }

      // CA14: asigna el grupo al contacto agregado y lo persiste en su 609.
      // Un contacto pertenece a UN solo grupo: reasignar exige confirmacion explicita.
      async function gecAsignarGrupo(contactoId, grupo) {
        const r = await mi.exe('GetContacts', { filter: 'id=' + contactoId, size: 1, include: GEC_INCLUDE });
        const c = (r && r.ok && r.outData) ? r.outData[0] : null;
        if (!c) return { ok: false, msg: 'no se pudo leer el contacto ' + contactoId };

        const actual = gecLeerGrupo(c.jCustomForms);
        if (String(actual) === String(grupo)) return { ok: true, msg: 'ya pertenecia al grupo' };
        if (actual) {
          const seguir = window.confirm(
            'El contacto ya pertenece al grupo economico ' + actual + '.\n\n' +
            'Un contacto solo puede pertenecer a un grupo. Desea reasignarlo al grupo ' + grupo + '?');
          if (!seguir) return { ok: false, msg: 'reasignacion cancelada por el usuario' };
        }

        let obj = {};
        try { obj = JSON.parse(c.jCustomForms || '{}'); } catch (e) { obj = {}; }
        let campos = [];
        try { campos = JSON.parse(obj[GEC_TAB_609] || '[]'); } catch (e) { campos = []; }
        let puso = false, pusoTag = false;
        campos.forEach(function (f) {
          if (f && f.name === 'grupoEconomico') { f.userData = [String(grupo)]; puso = true; }
          if (f && f.name === 'grupoEconomicoTag') { f.userData = ['GEC#' + grupo + '#']; pusoTag = true; }
        });
        if (!puso) {
          campos.push({ type: 'select', required: false, label: 'Grupo Económico',
            className: 'ant-input col-md-6 row-4', name: 'grupoEconomico', access: false,
            multiple: false, values: [], userData: [String(grupo)] });
        }
        if (!pusoTag) {
          campos.push({ type: 'hidden', label: '', className: 'row-4',
            name: 'grupoEconomicoTag', access: false, userData: ['GEC#' + grupo + '#'] });
        }
        obj[GEC_TAB_609] = JSON.stringify(campos);

        // Se reescribe el contacto COMPLETO cambiando solo jCustomForms: un envio
        // parcial deja en null los campos que no viaja.
        const body = {};
        for (const k in c) { if (Object.prototype.hasOwnProperty.call(c, k)) body[k] = c[k]; }
        body.jCustomForms = JSON.stringify(obj);
        await mi.exe('AddOrUpdateContact', body);

        // Verificacion por relectura: el guardado de contactos puede responder
        // ok:false por control de cambios y aun asi haber aplicado lo permitido.
        const v = await mi.exe('GetContacts', { filter: 'id=' + contactoId, size: 1 });
        const ok = !!(v && v.ok && v.outData && v.outData[0] &&
          String(v.outData[0].jCustomForms || '').indexOf('GEC#' + grupo + '#') >= 0);
        return { ok: ok, msg: ok ? 'grupo asignado' : 'el grupo no quedo guardado en el contacto' };
      }

      function gecSincronizarIntegrante(contactoId) {
        gecContextoActual().then(function (ctx) {
          if (!ctx.grupo) {
            mostrarMensaje('Este contacto no tiene grupo economico asignado: el integrante no se sincronizo.', 'warning', 4000);
            return null;
          }
          return gecAsignarGrupo(contactoId, ctx.grupo).then(function (res) {
            mostrarMensaje(res.ok ? 'Integrante sincronizado con el grupo economico.' : ('No se sincronizo: ' + res.msg),
              res.ok ? 'success' : 'warning', 4000);
          });
        }).catch(function (e) { mostrarMensaje('Error sincronizando el integrante: ' + e, 'error', 4000); });
      }

      cargarEmpresasDesdeHidden();
      renderizarTabla();
      gecCargarIntegrantes();

      async function obtenerContactos(pagina, cantidad, filtro) {
        try {
            // Llamada a tu método remoto
            const result = await mi.exe("GetContacts", {
                size: cantidad,
                page: pagina,
                filter: `isPerson = 0 AND surname2 LIKE '${filtro}%'`
            });
    
            const data = result.outData;
            data.forEach(x => {
                if (x.isPerson) {
                    x.nombreCompleto = `${x.name || ""} ${x.middleName || ""} ${x.surname1 || ""} ${x.surname2 || ""}`.trim();
                } else {
                    x.nombreCompleto = (x.surname2 || "").trim();
                }
            });

            const total = result.total;
    
            // Retornamos el objeto con items y total
            return { items: data, total: total };
    
        } catch (error) {
            console.error("Error al obtener consorciados:", error);
            return { items: [], total: 0 }; // fallback si falla
        }
      }

      function agregarAutocomplete($modal, inputSelector, cantidadPorPagina = 5) {
        const $input = $modal.find(inputSelector);
        const $inputCodigo = $('#hiddenCodigoContacto');
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
            const items = await cargarPagina(paginaActual, filtro);
    
            if ($dropdown) $dropdown.remove();
    
            if (!items.length) return;
    
            $dropdown = $("<div></div>").addClass("autocomplete-dropdown").css({
                position: "absolute",
                top: $input.position().top + $input.outerHeight(),
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
                    const $item = $("<div></div>").text(item.nombreCompleto).css({
                        padding: "4px 8px",
                        cursor: "pointer"
                    }).hover(
                        function(){ $(this).css("background","#bae7ff") },
                        function(){ $(this).css("background","white") }
                    ).click(function(){
                        $input.val(item.nombreCompleto);
                        $inputCodigo.val(item.id);
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
            $modal.append($dropdown);
            
          } catch (error) {
            console.error(error);
          }
        }
    
        $input.on("input", function() {
            const valor = $(this).val().trim();
            if (!valor) { if ($dropdown) $dropdown.remove(); return; }
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
  
    } catch(error){
      console.error(error);
    }
  }

  //Grupo económico: GEC
  function validaRolGrupoEconomico() {
    try{

      var vForm = contactForm.getFieldsValue();
      var rolesList = vForm.Roles;
        
      if (rolesList) {
        var esGrupoEconomico = rolesList != null && rolesList.filter(x=> x.role == "GEC")[0] != null;
        validaRolGECPromise(esGrupoEconomico, 200, 20) 
      }
      else
        validaRolGECPromise(false, 200, 20) 
      
    }
    catch(error){
      console.error(error);
    }
  }
  
  function validaRolGECPromise(esGrupoEconomico, interval = 500, maxRetries = 5) {
    let attempts = 0;    
  
    return new Promise(async (resolve, reject) => {
      while (attempts < maxRetries) {
        
        const $tab = $('[data-node-key="customTab_Grupo Económico"]');
  
        if ($tab.length) {
          if(esGrupoEconomico)
            $tab.show();
          else
            $tab.hide();
                      
          //$clase.prop("required", esClienteOEmpleado);              
          resolve(true); // Campo encontrado y configurado
          return;
        }
  
        attempts++;
        await sleep(interval);
      }
  
      console.warn(`Tab not found after ${maxRetries} attempts`);
      reject(false); // No se encontró el campo
    });
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
  waitForElement('#hiddenValidaGEC', { interval: 500, maxRetries: 10 })
    .then(($el) => {
        console.log("Listo, encontrado:", $el);
        logica();
    })
    .catch(err => {
        console.warn(err);
    });


  /* ---------------------------------------------------------------------
   * AXX-270 / GLOB-1216 — Grupo económico: el detalle de accionistas es
   * exclusivamente visual, y tratamiento visual de la pestaña y su grilla.
   *
   * Reglas 6 y 7 / CA-06: en Grupo económico no puede haber ninguna accion
   * funcional de agregar, editar ni eliminar accionistas. Los accionistas se
   * administran unicamente en su formulario propietario (frmAccionistasContacto).
   * Se OCULTAN, no se deshabilitan: un control deshabilitado sigue a la vista.
   *
   * La gestion de EMPRESAS del grupo (agregar / editar empresa participante) no
   * se toca: es pertenencia al grupo, no accionistas.
   *
   * Los datos ya capturados a mano no se borran: siguen viendose, en solo
   * consulta, para no perder informacion (CA-08).
   *
   * Se agrega al final: no modifica ninguna regla anterior de este formulario.
   * ------------------------------------------------------------------- */
  (function axx270SoloConsultaAccionistas() {

    var AXX270_CSS_ID = 'axx270-gec-estilos';

    var AXX270_CSS = [
      /* CA-06: sin acciones funcionales sobre accionistas */
      '#contenedorEmpresas .btnAddAccionista,',
      '#contenedorEmpresas .btnEditarAcc,',
      '#contenedorEmpresas .btnEliminarAcc { display: none !important; }',
      /* contenedor de la pestaña y de la grilla: borde sutil, esquinas suaves */
      '#contenedorEmpresas { border: 1px solid #cbd1d8; border-radius: 6px; padding: 4px; font-size: 13px; }',
      '#contenedorEmpresas #tableCard { border: 1px solid #cbd1d8; border-radius: 6px; }',
      '#contenedorEmpresas #tableCard > .ant-card-body { padding: 4px; }',
      /* grilla compacta: encabezado mas oscuro con separadores verticales */
      '#contenedorEmpresas table.ant-table { border-collapse: collapse; width: 100%; }',
      '#contenedorEmpresas table.ant-table > thead > tr > th {',
      '  background: #bfbfbf; border-right: 1px solid #cbd1d8; border-bottom: 1px solid #cbd1d8;',
      '  padding: 5px 8px; font-size: 12px; line-height: 18px; text-align: left; }',
      '#contenedorEmpresas table.ant-table > thead > tr > th:last-child { border-right: 0; }',
      /* filas: solo separadores horizontales */
      '#contenedorEmpresas table.ant-table > tbody > tr > td {',
      '  border-right: 0; border-bottom: 1px solid #cbd1d8;',
      '  padding: 5px 8px; font-size: 12px; line-height: 18px; }',
      /* estados de fila: hover suave, seleccion mas intensa y con prioridad */
      '#contenedorEmpresas table.ant-table > tbody > tr:hover > td { background: #b7d7ff !important; }',
      '#contenedorEmpresas table.ant-table > tbody > tr.ant-table-row-selected > td,',
      '#contenedorEmpresas table.ant-table > tbody > tr.ant-table-row-selected:hover > td,',
      '#contenedorEmpresas table.ant-table > tbody > tr.gec-selected-row > td,',
      '#contenedorEmpresas table.ant-table > tbody > tr.gec-selected-row:hover > td { background: #86b4ff !important; }',
      '#contenedorEmpresas table.ant-table > tbody > tr.empresaRow { cursor: pointer; }',
      /* barra de acciones y botones que quedan (nivel empresa) */
      '#contenedorEmpresas > .ant-btn { border-radius: 6px; }',
      '#contenedorEmpresas .ant-btn-default { border-color: #8f9aa7; }',
      '#contenedorEmpresas .ant-btn[disabled] { border-color: #6f7b88; opacity: 1; }'
    ].join('\n');

    function axx270Estilos() {
      try {
        if (document.getElementById(AXX270_CSS_ID)) return;
        var st = document.createElement('style');
        st.id = AXX270_CSS_ID;
        st.type = 'text/css';
        st.appendChild(document.createTextNode(AXX270_CSS));
        (document.head || document.documentElement).appendChild(st);
      } catch (e) { console.error('AXX-270 estilos:', e); }
    }

    // Idempotente: la grilla se redibuja (renderizarTabla) y vuelve a poner los
    // botones. El CSS evita el parpadeo; esto los deja ademas no clickeables.
    function axx270SoloConsulta() {
      try {
        var $panel = $('#contenedorEmpresas');
        if (!$panel.length) return;

        $panel.find('.btnAddAccionista, .btnEditarAcc, .btnEliminarAcc').remove();

        // La captura manual preexistente queda visible pero rotulada como consulta.
        $panel.find('tr[class*="detalleAcc_"]').each(function () {
          var $tr = $(this);
          if ($tr.hasClass('axx270-marcada')) return;
          if (/accSisRow_|accSisCab_/.test($tr.attr('class') || '')) return;   // ya son solo consulta
          var $ult = $tr.children('td').last();
          if ($ult.length && !$ult.children().length && !String($ult.text() || '').trim()) {
            $ult.attr('style', 'color:#999;font-size:12px').text('Solo consulta');
          }
          $tr.addClass('axx270-marcada');
        });
      } catch (e) { console.error('AXX-270 solo consulta:', e); }
    }

    axx270Estilos();
    axx270SoloConsulta();

    if (window.__axx270Timer) clearInterval(window.__axx270Timer);
    var axx270Ticks = 0;
    window.__axx270Timer = setInterval(function () {
      if (++axx270Ticks > 2400) { clearInterval(window.__axx270Timer); window.__axx270Timer = null; return; }
      axx270Estilos();
      axx270SoloConsulta();
    }, 500);

  })();
