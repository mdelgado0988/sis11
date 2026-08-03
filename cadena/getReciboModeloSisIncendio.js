//block
/***********************************************************************************************\
|* @Name: getReciboModeloSisIncendio                                                           *|
|* @Description: Obtains information in order to print report SSSS                             *|
|* @Author: Max Batres                                                                         *|
|* @Category: INTERFACE                                                                        *|
|* @Version: 1.1                                                                               *|
|* @Parameters:                                                                                *|
|*    context.id (int): policy Id                                                              *|
|* @Modify by:                                                                                 *|
|*    Daniel Berrios (19-02-2026): Null validation is added and commented-out code is removed. *|
\***********************************************************************************************/
mi = this;

try {
  //{id : 149} - filter / context en el simulador de fórmula  
  var Cotizacion = {};
  var vname;
  var rangoIngreso;
  var vnacimiento = "";
  var vnacionalidad = "";
  var vresidencia = "";
  var vActividadEconomica ="";
  var vProfesion = "";
  var vfechaVinculacion;
  var xContactsFilterArray = [];
  var xContactsFilter = ""; 
  var action = _action || '';
  const externalFiscalNumber = typeof _fiscalNumber !== "undefined" ? _fiscalNumber : "";
  const inputContext = typeof context !== "undefined" ? context : {};
  const contextFiscalNumber = safeString(inputContext?.row?.fiscalNumber || inputContext?.fiscalNumber || externalFiscalNumber || "").trim();
    
  const vfieldsCotizacion = "id,code,[start],[end],anualPremium,tax,anualTotal,paymentMethod,periodicity,holderId,payerId, fiscalNumber, fee, processId, installment";
  const vfieldsCotizacionAsegurados = "lifePolicyId,contactId";
  const vfieldsAseguradoPhone = "contactId,type,num";
    
  const vfieldsCuotas = "lifePolicyId,id,minimum, numberInYear,contractYear,cancellationDate";
  const vfieldsContacto = "id,name,middlename,surname1,surname2,cnp,nif,isPerson,phone,email"
  
  //Carga de datos
  doCmd({cmd:"LoadEntities",data:{entity:"lifepolicy",operatiion:"GET",filter:"id = "+_id,fields:vfieldsCotizacion}});
  const dataCotizacion = LoadEntities.outData[0];
  const fiscalNumber = contextFiscalNumber || safeString(dataCotizacion?.fiscalNumber, "").trim();

  doCmd({cmd:"LoadEntities",data:{entity:"insured",operatiion:"GET",filter:"LifePolicyId = "+_id,fields:vfieldsCotizacionAsegurados}});
  const dataCotizacionAsegurados = LoadEntities.outData[0];    
  
  doCmd({cmd:"RepoPaymentMethodCatalog",data:{operation:"GET"}});
  const dataMetodosPago = RepoPaymentMethodCatalog.outData;

  // doCmd({cmd:"LoadEntities",data:{entity:"PayPlan",operatiion:"GET",filter:"ISNULL(cancellationDate) AND LifePolicyId = "+_id,fields:vfieldsCuotas}});
  doCmd({cmd:"LoadEntities",data:{entity:"PayPlan",operation:"GET",filter:"cancellationDate IS NULL AND LifePolicyId = "+_id,fields:vfieldsCuotas}});
  const dataCuotas = LoadEntities.outData;  

  //Usuario
  doCmd({cmd:"LoadEntity",data:{entity:"Proceso",operatiion:"GET",filter:`Id = ${dataCotizacion.processId}`,fields:"Usuario"}});
  const UserName = LoadEntity?.outData?.Usuario || "No Registrado";  
   
  //Registrando el filtro de la tabla contacto
  xContactsFilterArray.push(1); //Este es el código de la aseguradora Global Panamá.

  xContactsFilterArray.push(dataCotizacion.holderId);
  
  if (dataCotizacionAsegurados !== null)  {
    if (xContactsFilterArray.includes(dataCotizacionAsegurados.contactId) == false) {
      xContactsFilterArray.push(dataCotizacionAsegurados.contactId);
    }    
  };  

  //Carga de datos Contacto
  doCmd({cmd:"LoadEntities",data:{entity:"Contact",operatiion:"GET",filter:"id in ("+xContactsFilterArray.join(',')+")",fields:vfieldsContacto}});
  const dataContacto = LoadEntities.outData;

  var Aseguradora = {
    ContactId: 1,
    NombreSocial: "",
    Ruc: "",
    LogoRuta: "C:\\images\LOGO_GLOBAL_BANK.PNG"
  };  
  
  var Tomador = {
    ContactId: dataCotizacion.holderId,
    NombreCompleto: ""
  };  
  
  var Asegurado = {
    ContactId: dataCotizacionAsegurados.contactId,
    NombreCompleto: "",
    Identificacion: "",
    DireccionCompleta: "",
    TelefonoContacto: "",
    TelefonoCelular: "",
    TelefonoFax: "",
    Email: "",
    Correo: "",    
  };

  var AseguradoAddress = {
    ContactId: dataCotizacionAsegurados.contactId,
    CodigoPais: "0", //country
    NombrePais: "",
    CodigoProvincia: "0", //state
    NombreProvincia: "",
    CodigoMunicipio: "0", //city
    NombreMunicipio: "",    
    Linea1: "", //address1
    Linea2:"" //address1
  };  
  
  dataContacto.forEach(row => {
    //actualizando datos del tomador
    if (row.id == Tomador.ContactId){
      if (row.isPerson == true){
        Tomador.NombreCompleto = (row.name || "") + " " + (row.middlename ||  "") + " " + (row.surname1 || "") + " " + (row.surname2 || "");
      }
      else{
        Tomador.NombreCompleto = row.surname2 || "";
      }
    };
    //actualizando datos del asegurado
    if (row.id == Asegurado.ContactId){
      if (row.isPerson == true){        
        Asegurado.NombreCompleto = (row.name || "") + " " + (row.middlename ||  "") + " " + (row.surname1 || "") + " " + (row.surname2 || "");
        Asegurado.Identificacion = row.cnp || "";
      }
      else{
        Asegurado.NombreCompleto = row.surname2 || "";
        Asegurado.Identificacion = row.nif || "";
      }
      Asegurado.TelefonoContacto = row.phone || "";
      Asegurado.Email = row.email || "";    
      Asegurado.Correo = row.email || "";          
    };
    //actualizando datos de la aseguradora
    if (row.id == Aseguradora.ContactId){      
      if (row.isPerson == true){        
        Aseguradora.NombreSocial = (row.name || "") + " " + (row.middlename ||  "") + " " + (row.surname1 || "") + " " + (row.surname2 || "");
        Aseguradora.Ruc = row.cnp || "";
      }
      else{
        Aseguradora.NombreSocial = row.surname2 || "";
        Aseguradora.Ruc = row.nif || "";
      }            
    };
  });

  //Cargando la dirección del Asegurado
  doCmd({cmd:"RepoContactAddress",data:{operation:"GET",filter:"contactId = "+Asegurado.ContactId}})
  const dataAseguradoAddress = RepoContactAddress.outData[0];
    
  AseguradoAddress.CodigoPais = dataAseguradoAddress?.country || "0"; //country
  AseguradoAddress.CodigoProvincia = dataAseguradoAddress?.state || 0;    //state
  AseguradoAddress.CodigoMunicipio = dataAseguradoAddress?.city || 0; //city    
  AseguradoAddress.Linea1 = dataAseguradoAddress?.address1 || ""; //address1
  AseguradoAddress.Linea2 = dataAseguradoAddress?.address2 || ""; //address1
  
  //Obteniendo los nombres de los códigos
  //País
  doCmd({cmd:"RepoCountryCatalog",data:{operation:"GET", filter: "code="+ AseguradoAddress.CodigoPais}});
  const dataPais = RepoCountryCatalog.outData;
  
  if (dataPais != null && dataPais.length > 0)  {
    AseguradoAddress.NombrePais = dataPais[0].name || "";    
  };
    
  //Provincia - Estado
  doCmd({cmd:"RepoStateCatalog",data:{operation:"GET", filter: "countryCode="+ AseguradoAddress.CodigoPais + " and code="+ AseguradoAddress.CodigoProvincia}});
  const dataProvincia = RepoStateCatalog.outData;

  if (dataProvincia != null && dataProvincia.length > 0)  {    
    AseguradoAddress.NombreProvincia = dataProvincia[0].name || "";
  };    
    
  //Municipio - Distrito - Ciudad
  doCmd({cmd:"RepoCityCatalog",data:{operation:"GET", filter: "stateCode=" + AseguradoAddress.CodigoProvincia + "and code="+ AseguradoAddress.CodigoMunicipio}});  
  const dataDistrito = RepoCityCatalog.outData;
  
  if (dataDistrito != null && dataDistrito.length > 0)  {    
    AseguradoAddress.NombreMunicipio = dataDistrito[0].name || "";
  };    
  
  //Asegurado.DireccionCompleta = AseguradoAddress.NombrePais + " " + AseguradoAddress.NombreProvincia + " " + AseguradoAddress.NombreMunicipio + " " + AseguradoAddress.Linea1 + " " + AseguradoAddress.Linea2;
  Asegurado.DireccionCompleta = AseguradoAddress.Linea1;
    
  //Obteniendo los teléfonos del asegurado
  doCmd({cmd:"LoadEntities",data:{entity:"ContactPhone",operatiion:"GET",filter:"ContactId = " + Asegurado.ContactId + " and type = 'PHONETYPE2'",fields:vfieldsAseguradoPhone}});
  const dataAseguradoPhone = LoadEntities.outData[0];    

  if (dataAseguradoPhone != null){    
    Asegurado.TelefonoCelular = dataAseguradoPhone.num || "";
  };
  
  //Cotización - LifePolicy
  
  Cotizacion.NumeroOferta = dataCotizacion.id;
  Cotizacion.NumeroPoliza = dataCotizacion.code;
  Cotizacion.NumeroRecibo = fiscalNumber || "N/A";
  Cotizacion.fiscalNumber = fiscalNumber;
  Cotizacion.TipoOperacion = "Nueva"; //Pendiente
  Cotizacion.Estado = "Vigente"; //Pendiente  
  Cotizacion.FIni = formatdate(new Date(dataCotizacion.start).toISOString().slice(0, 10));  
  Cotizacion.FFin = formatdate(new Date(dataCotizacion.end).toISOString().slice(0, 10));
  
  Cotizacion.HoraVigencia = "12:00 AM";
  Cotizacion.PrimaNetaTotal = formateaNumero(dataCotizacion.anualPremium ?? 0);
  Cotizacion.Impuesto = formateaNumero(dataCotizacion.tax ?? 0);
  Cotizacion.Gasto = formateaNumero(dataCotizacion.fee ?? 0);
  Cotizacion.TotalACobrar = formateaNumero(dataCotizacion.anualTotal ?? 0);
  Cotizacion.Descripcion = dataCotizacion.description || "";
  
  Cotizacion.FechaActual = formatdate(new Date().toISOString().slice(0, 10));
  Cotizacion.Action = '';
  
  Cotizacion.Tomador = Tomador;
  Cotizacion.Asegurado = Asegurado;  
  Cotizacion.Aseguradora = Aseguradora;
  Cotizacion.AsegAddress = AseguradoAddress;  
  Cotizacion.Usuario = UserName;
  Cotizacion.Cuotas = dataCuotas;

  if(action){
    Cotizacion.Action ='MOVIMIENTO: RENOVACIÓN';
  }
  //Resumen financiero y pago 
  
  var AcuerdoPago = {
    paymentMethod: dataCotizacion.paymentMethod,
    Forma: "",
    periodicity: dataCotizacion.periodicity,
    Frecuencia: "",
    NumPagos: 0,
    MontoCuota: 0
  };

   if(Cotizacion.Cuotas){
    const counts = Cotizacion.Cuotas.reduce((acc, item) => {
      const key = item.numberInYear;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const cantidadUnicos = Cotizacion.Cuotas.filter(
      item => counts[item.numberInYear] === 1
    ).length;

     AcuerdoPago.NumPagos = cantidadUnicos;

  }

  const dataFrecuenciaPago = [
    { code: 'm', name: 'Mensual' },
    { code: 'q', name: 'Trimestral' },
    { code: 's', name: 'Semestral' },
    { code: 'y', name: 'Anual' }
  ];
  
  dataMetodosPago.forEach(row => {
    if (row.code == AcuerdoPago.paymentMethod){
      AcuerdoPago.Forma = row.name;
    }
  });

  dataFrecuenciaPago.forEach(row => {
    if (row.code == AcuerdoPago.periodicity){
      AcuerdoPago.Frecuencia = row.name;
    }
  });

  const maxContractYear = Math.max(...dataCuotas.map(row => row.contractYear));

  dataCuotas.forEach(row => {
    if (action) {
      if (row.contractYear === maxContractYear -1) {
        AcuerdoPago.NumPagos += 1;
      }
    } else {
      AcuerdoPago.NumPagos += 1;
    }
  });

  AcuerdoPago.MontoCuota = formateaNumero(dataCotizacion.installment || 0);
  
  //Fin acuerdo pago  
  Cotizacion.AcuerdoPago = AcuerdoPago;  
  return Cotizacion;  

} catch (error) {
   return {ok:false,msg:error}  
} 

function formatdate(dates){
  try{
    var dd,mm,yyyy;
    var yyyy = dates.substring(0, 4);
    var mm = dates.substring(7, 5);
    var dd = dates.substring(10, 8);
    dates = dd + '/' + mm + '/' + yyyy;
    return dates;
  }catch{
    return dates
  }    
};

function formatDateTime(dateInput) {
  try{
        
    const date = new Date(dateInput);
    
    if (isNaN(date)) return ""; // validación si no es fecha válida
  
    const pad = (n) => n.toString().padStart(2, '0');
  
    const dd = pad(date.getDate());
    const mm = pad(date.getMonth() + 1); // meses van de 0 a 11
    const yyyy = date.getFullYear();
  
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
  
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  }catch {
    return dateInput;
  }
};

function formateaNumero(v) {
  v = Number(v);
  if (isNaN(v)) return '0.00';
  return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function safeString(value) {
  return value === null || value === undefined ? "" : String(value);
}
