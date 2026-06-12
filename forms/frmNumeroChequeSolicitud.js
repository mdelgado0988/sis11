/**
 * name: frmNumeroChequeSolicitud.js
 * Description: form to display the generated check number in the request.
 * Author: Michael Delgado
 * Email: michael.delgado@axxis-systems.com
 * Creation Date: 06/01/2026
 */

    var mi = this;

  async function logica() {
    try {

      showProcessingMask();
      setTimeout(hideProcessingMask, 3000);
      
      $("#numeroCheque").prop('required', true).prop('readOnly', true);

      var idProceso = context?.processId;
      if(!idProceso)
        idProceso = 4985;
            
      //Cargo las chequeras como evento async.
      await generarCheque(idProceso);

      hideProcessingMask();
      
    } catch (error) {
      console.error(error);
      hideProcessingMask();
    }
  }

  async function dameChequeExistente(solicitud){
   try {
            
      var cheque = await mi.exe("GetTable", { 
          table: "SolicitudCheque",
          column: "solicitud",
          getColumn: "cheque",
          row: solicitud
      });
      
      return cheque?.outData ?? "0";
      
    } catch (error) {
      console.error(error);
       return "0";
    }
  }    

  async function generarCheque(idProceso) {
    try {

      var proceso = await mi.exe("LoadEntity", { 
        entity: "proceso",
        filter: "id = " + idProceso
      });

      var data = proceso?.outData;

      if(!data){
        console.error('Proceso inválido');
        return;
      }
      
      var solicitud = data?.entityId;     
      if(!solicitud){
        console.error('No se encontró la solicitud');
        return;
      }

      const tablaChequeId = await dameIdTablaSolicitudCheque();
      if(tablaChequeId <= 0){
        console.error('No se encontró tabla configurada para cheques');
        return;
      }

      let numeroCheque = await dameChequeExistente(solicitud, tablaChequeId);
      
      if(numeroCheque != "0" && numeroCheque != ''){
        $("#numeroCheque").val(numeroCheque);
      }
      else{
        //debo generar un nuevo número para que se guarde.
        numeroCheque = await RegistrarChequeNuevo(tablaChequeId, solicitud, idProceso);
      }

      //Update cheknum on payment tables
      if(numeroCheque && numeroCheque !== "0"){
        await updateChkNumOnPayment(solicitud, numeroCheque);
      }      
                 
    } catch (error) {
      console.error(error);
    }
  }

  async function updateChkNumOnPayment(solicitud, numeroCheque) {
   try {

      const result = await mi.exe("SetField", { entity: "ClaimPayment", entityId: solicitud, fieldValue: `checkNum = ${numeroCheque}` });
        if(!result.ok){
            console.error('Error actualizando número de cheque en tabla de pagos');
        }
    
   } catch (error) {
      console.error(error);
   } 
  } 
    
  async function RegistrarChequeNuevo(tableId, solicitud, procesoId) {
   try {

     var user = await mi.exe("GetCurrentUser");
     const username = user?.outData?.email;
     var contador = await dameContadorChequera(procesoId, solicitud);       
     const fecha = dameFechaActual();

     var cheque = await mi.exe("GetCode", {
       counter:contador
     });

     var numeroCheque = cheque?.outData ?? "0";
     if (numeroCheque === '0'){
      return '0';
     }       
         
     const query = `
     UPDATE [table]
     SET data = JSON_MODIFY(
                   data,
                   'append $',
                   JSON_QUERY('["${solicitud}","${numeroCheque}","${fecha}","${username}"]')
               )
     WHERE id = ${tableId}
       AND ISJSON(data) = 1;
     `;

     var resultado = await mi.exe("DoQuery", {
       sql: query
     })

     if (resultado.ok)
       $("#numeroCheque").val(numeroCheque);

     return numeroCheque;
     
   } catch (error) {
     console.error(error);
     return '0';
   } 
  }

  async function dameContadorChequera(procesoId, solicitud) {
   try {

     
     var formChequera = await mi.exe("DoQuery",{
          sql: "select id from form where name = 'frmCuentaBancariaSolicitud'"        
         });
     var formId = formChequera?.outData?.[0]?.id;

     var valoresChequera = await mi.exe("DoQuery",{
          sql: `select TOP (1) json from userValues where procesoId=${procesoId} and formualarioId=${formId} order by id desc`
         });
     var valoresChequera = JSON.parse(valoresChequera?.outData[0]?.json);
     
     if(!valoresChequera){
       return "NA";
     }

     var idChequera = valoresChequera?.[0]?.userData?.[0] ?? 0;

     if (idChequera <= 0)
       return "NA";

     var cuenta = await mi.exe("LoadEntity",{
          entity: "Account",
          filter: `id=${idChequera}`
         });

     var checkbookCode = cuenta?.outData?.checkBookCode ?? "0";
     if (checkbookCode === '0')
       return "NA";

     var checkbook = await mi.exe("LoadEntity",{
          entity: "CheckBook",
          filter: `code='${checkbookCode}'`
         });

     var counterName = checkbook?.outData?.counterCode;
     
     return counterName ?? "NA";
     
   } catch (error) {
     console.error(error);
     return "NA";
   } 
  }

  async function dameIdTablaSolicitudCheque(){
   try {

      var tablaCheque = await mi.exe("DoQuery",{
        sql: "select id from [table] where name = 'SolicitudCheque'"        
       });
    
      var tablaChequeId = tablaCheque?.outData[0]?.id;

      return tablaChequeId ?? 0;
     
   } catch (error) {
      console.error(error);
   } 
  } 

  function dameFechaActual() {
    const today = new Date();

    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Enero = 0
    const yyyy = today.getFullYear();
    
    const fechaActual = `${dd}-${mm}-${yyyy}`;
    return fechaActual;
  }

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

  waitForElement("#numeroCheque", {
    interval: 100,
    maxRetries: 20
  })
  .then(async ($el) => {
    console.log("Listo, encontrado:", $el);
    await logica();
  })
  .catch(err => {
    console.warn(err);
  });

  function showProcessingMask(text = 'Procesando...') {
    if ($('#ant-processing-mask').length) return;
  
    const mask = `
      <div id="ant-processing-mask"
           style="
             position:fixed;
             inset:0;
             background:rgba(255,255,255,0.65);
             z-index:9999;
             display:flex;
             align-items:center;
             justify-content:center;
           ">
        <div class="ant-spin ant-spin-spinning ant-spin-lg">
          <span class="ant-spin-dot ant-spin-dot-spin">
            <i class="ant-spin-dot-item"></i>
            <i class="ant-spin-dot-item"></i>
            <i class="ant-spin-dot-item"></i>
            <i class="ant-spin-dot-item"></i>
          </span>
          <div class="ant-spin-text">${text}</div>
        </div>
      </div>
    `;
  
    $('body').append(mask);
  }
  
  function hideProcessingMask() {
    $('#ant-processing-mask').remove();
  }