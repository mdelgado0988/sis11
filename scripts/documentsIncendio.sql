//block
/**
 * Name: documentIncendio
 * Description: Obtains information in order to print report ofertaincendio.docx
 * Author: Ernesto Garcia
					  
 * Version: 1.0
 * Parameters:
 */
mi = this;

try {
  let policyId = _row.policyId;
 
  // let policyId = 229;
  var Cotizacion = {};
  //var contextoCoberturas = {};
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
  let cplan="";

  var Riesgo = {
      TipoObjeto: "", //Tipo de Objeto (Nuevo) - cmbTipoObjeto
      SA: 0, //Suma Asegurada - txtSA
      Finca: "", //Finca - txtFinca 
      Rollo: "", //Rollo - txtRollo
      Doc: "", //Doc - txtDoc
      NumeroPrestamo: 0, //No. Préstamo - txtNoPrestamo
      NumeroGarantia: 0, //No. Garantía - txtNoGarantia
      CategoriaActividad: "", //Categoría de Actividad - cmbCategoriaActividad
      UsoBien: 0, //Uso del Bien - cmbUsoBien
      TipoMaterial: "", //Tipo Material - cmbTipoMaterial
      Area: 0, //Área (M2) - txtArea
      CantidadPisos: 0, //Cantidad de Pisos - txtCantidadPisos
      Descripcion: "", //Descripción - Descripcion      
      CodigoPais: 0, //País - cmbPais
      NombrePais: "",
      CodigoProvincia: 0, //Provincia - cmbProvincia
      NombreProvincia: "",
      CodigoDistrito: 0, //Distrito - cmbMunicipio
      NombreDistrito: "",
      CodigoCorregimiento: "0", //Corregimiento - cmbSector
      NombreCorregimiento: "",
      CodigoBarriada: "0", //Barriada - cmbBarriadas
      NombreBarriada: "",
      CodigoEdificio: 0, //Edificio - cmbBarriadas
      NombreEdificio: "",
      Manzana: "", //Manzana - manzana
      Casa: "", //apto o Casa No - aptoocasa
      Calle: "", //Calle o Avenida - calleoavenida
      CodigoZonaCresta: 0, //Zona Cresta - cmbZonaCresta
      NombreZonaCresta: "",
      Direccion: "" //Direccion Exacta - direccionexacta   
  };
      
  const vfieldsCotizacion = "productCode,code,id,[start],[end],anualPremium,tax,anualTotal,description,insuredSum,paymentMethod,periodicity,holderId,payerId,cessionBeneficiary, sellerId";
  const vfieldsCotizacionAsegurados = "lifePolicyId,contactId";
  
  const vfieldsCoberturas = "lifePolicyId,code,name,description,limit,deductible,basePremium";
  const vfieldsCuotas = "lifePolicyId,id";
  const vfieldsContacto = "id,name,middlename,surname1,surname2,cnp,nif,isPerson,phone,email"
  const vfieldsAseguradoPhone = "contactId,type,num";
  
  //Carga de datos
  doCmd({cmd:"LoadEntities",data:{entity:"lifepolicy",operatiion:"GET",filter:"id = "+policyId,fields:vfieldsCotizacion}});
  const dataCotizacion = LoadEntities.outData[0];
  cplan = dataCotizacion.productCode;
  
  const TarifasCatalog = getTarifasCatalog();  
  
  doCmd({cmd:"LoadEntities",data:{entity:"insured",operatiion:"GET",filter:"LifePolicyId = "+policyId,fields:vfieldsCotizacionAsegurados}});
  const dataCotizacionAsegurados = LoadEntities.outData[0];

  doCmd({cmd:"LoadEntities",data:{entity:"lifecoverage",operatiion:"GET",filter:"LifePolicyId = "+policyId,fields:vfieldsCoberturas}});
  const dataCoberturas = LoadEntities.outData;

  doCmd({cmd:"RepoPaymentMethodCatalog",data:{operation:"GET"}});
  const dataMetodosPago = RepoPaymentMethodCatalog.outData;

  doCmd({cmd:"LoadEntities",data:{entity:"PayPlan",operatiion:"GET",filter:"LifePolicyId = "+policyId,fields:vfieldsCuotas}});
  const dataCuotas = LoadEntities.outData;  

  doCmd({cmd:"RepoInsuredObject",data:{filter:"LifePolicyId = "+policyId,"operation":"GET"}});
  const dataDT = RepoInsuredObject.outData[0];
  
  //Obteniendo la información del DT.
  const jsonString = dataDT ? dataDT.jValues : ""; 
  
  const formDataArray = (jsonString == "") ? null : JSON.parse(jsonString);   

  if (formDataArray !== null){
    const objetoCamposValores = formDataArray.reduce((accumulator, field) => {
      // Excluimos campos sin nombre (como los de tipo 'header')
      if (field.name && field.userData && field.userData.length > 0) {
          
          // El nombre del campo es la clave
          const key = field.name;
          
          // El valor es el primer elemento del array userData
          let value = field.userData[0];
          
          // Opcional: Si el campo es numérico, intenta convertir el valor a un número.
          if (field.type === 'number' && value !== "") {
               value = Number(value);
          }
          
          // Agregamos la nueva propiedad al acumulador
          accumulator[key] = value;
      }
      
      // Devolvemos el objeto acumulador para la siguiente iteración
      return accumulator;
    }, {});
  
    //maxteen
    //Inicializo el  DT  
    Riesgo.TipoObjeto = objetoCamposValores.cmbTipoObjeto;
    Riesgo.SA = objetoCamposValores.txtSA;
    Riesgo.Finca = objetoCamposValores.txtFinca;
    Riesgo.Rollo = objetoCamposValores.txtRollo;
    Riesgo.Doc = objetoCamposValores.txtDoc;
    Riesgo.NumeroPrestamo = objetoCamposValores.txtNoPrestamo;
    Riesgo.NumeroGarantia = objetoCamposValores.txtNoGarantia;
    Riesgo.CategoriaActividad = objetoCamposValores.cmbCategoriaActividad;
    Riesgo.UsoBien = objetoCamposValores.cmbUsoBien;
    Riesgo.TipoMaterial = objetoCamposValores.cmbTipoMaterial;
    Riesgo.Area = objetoCamposValores.txtArea;
    Riesgo.CantidadPisos = objetoCamposValores.txtCantidadPisos;
    Riesgo.Descripcion = objetoCamposValores.Descripcion;
    Riesgo.CodigoPais = objetoCamposValores.cmbPais;
    //Riesgo.NombrePais = objetoCamposValores.
    Riesgo.CodigoProvincia = objetoCamposValores.cmbProvincia;
    //Riesgo.NombreProvincia = objetoCamposValores.
    Riesgo.CodigoDistrito = objetoCamposValores.cmbMunicipio;
    //Riesgo.NombreDistrito = objetoCamposValores.
    Riesgo.CodigoCorregimiento = objetoCamposValores.cmbSector;
    //Riesgo.NombreCorregimiento = objetoCamposValores.
    Riesgo.CodigoBarriada = objetoCamposValores.cmbBarriadas;
    //Riesgo.NombreBarriada = objetoCamposValores.
    Riesgo.CodigoEdificio = objetoCamposValores.cmbEdificios;
    //Riesgo.NombreEdificio = objetoCamposValores.
    Riesgo.Manzana = objetoCamposValores.manzana;
    Riesgo.Casa = objetoCamposValores.aptoocasa;
    Riesgo.Calle = objetoCamposValores.calleoavenida;
    Riesgo.CodigoZonaCresta = objetoCamposValores.cmbZonaCresta;
    //Riesgo.NombreZonaCresta = objetoCamposValores.
    Riesgo.Direccion = objetoCamposValores.direccionexacta;
  };

   //Cargando la dirección del Asegurado  
  doCmd({cmd:"RepoContactAddress",data:{operation:"GET",filter:"contactId = "+ dataCotizacionAsegurados.contactId}})
  const dataAseguradoAddress = RepoContactAddress.outData[0];
  var AseguradoAddress = {};
    
  AseguradoAddress.CodigoPais = dataAseguradoAddress.country || "0"; //country
  AseguradoAddress.CodigoProvincia = dataAseguradoAddress.state || 0;    //state
  AseguradoAddress.CodigoMunicipio = dataAseguradoAddress.city || 0; //city    
  AseguradoAddress.Linea1 = dataAseguradoAddress.address1 || ""; //address1
  AseguradoAddress.Linea2 = dataAseguradoAddress.address2 || ""; //address1
  
  //Obteniendo los nombres de los códigos
  //País
  doCmd({cmd:"RepoCountryCatalog",data:{operation:"GET", filter: "code="+ AseguradoAddress.CodigoPais}});
  const dataPaisAddress = RepoCountryCatalog.outData;
  
  if (dataPaisAddress != null && dataPaisAddress.length > 0)  {
    AseguradoAddress.NombrePais = dataPaisAddress[0].name || "";    
  };
    
  //Provincia - Estado
  doCmd({cmd:"RepoStateCatalog",data:{operation:"GET", filter: "countryCode="+ AseguradoAddress.CodigoPais + " and code="+ AseguradoAddress.CodigoProvincia}});
  const dataProvinciaAddress = RepoStateCatalog.outData;

  if (dataProvinciaAddress != null && dataProvinciaAddress.length > 0)  {    
    AseguradoAddress.NombreProvincia = dataProvinciaAddress[0].name || "";
  };    
    
  //Municipio - Distrito - Ciudad
  doCmd({cmd:"RepoCityCatalog",data:{operation:"GET", filter: "stateCode=" + AseguradoAddress.CodigoProvincia + "and code="+ AseguradoAddress.CodigoMunicipio}});  
  const dataDistritoAddress = RepoCityCatalog.outData;
  
  if (dataDistritoAddress != null && dataDistritoAddress.length > 0)  {    
    AseguradoAddress.NombreMunicipio = dataDistritoAddress[0].name || "";
  };  
  
  //Obteniendo los nombres de los códigos
  //País
  doCmd({cmd:"RepoCountryCatalog",data:{operation:"GET", filter: "code="+ Riesgo.CodigoPais}});
  const dataPais = RepoCountryCatalog.outData[0];
  Riesgo.NombrePais = dataPais.name;
  
  //Provincia - Estado
  doCmd({cmd:"RepoStateCatalog",data:{operation:"GET", filter: "countryCode="+ Riesgo.CodigoPais + " and code="+ Riesgo.CodigoProvincia}});
  const dataProvincia = RepoStateCatalog.outData[0];
  Riesgo.NombreProvincia = dataProvincia.name;
  
  //Municipio - Distrito - Ciudad
  doCmd({cmd:"RepoCityCatalog",data:{operation:"GET", filter: "stateCode=" + Riesgo.CodigoProvincia + " and code="+ Riesgo.CodigoDistrito}});  
  const dataDistrito = RepoCityCatalog.outData[0];
  Riesgo.NombreDistrito = dataDistrito.name;
  
  //Sector - Corregimiento
  doCmd({cmd:"RepoSectorCatalog",data:{operation:"GET", filter: "cityCode=" + Riesgo.CodigoDistrito + " and code="+ Riesgo.CodigoCorregimiento}});  
  const dataSector = RepoSectorCatalog.outData[0];
  Riesgo.NombreCorregimiento = dataSector.name;
  
  //Barriada
  //table: Barriadas    
  const dataBarriada = doCmd({cmd:"GetFullTable",data:{table:"Barriadas"}}).outData;  
  dataBarriada.forEach(item => {
    if (item[1] === Riesgo.CodigoCorregimiento && item[0] === Riesgo.CodigoBarriada){
          Riesgo.NombreBarriada = item[3];
        };
  });  
  //Edificio
  //table: Edificios
  const dataEdificio = doCmd({cmd:"GetFullTable",data:{table:"Edificios"}}).outData;  
  dataEdificio.forEach(item => {
    if (item[0] === Riesgo.CodigoPais && item[1] === Riesgo.CodigoProvincia && item[2] === Riesgo.CodigoDistrito && item[3] === Riesgo.CodigoCorregimiento && item[4] === Riesgo.CodigoEdificio){
          Riesgo.NombreEdificio = item[5];
        };
  });    
  
  Cotizacion.Riesgo = Riesgo; // Se traslada al objeto final los datos del DT.
  
  //Registrando el filtro de la tabla contacto
  xContactsFilterArray.push(1); //Este es el código de la aseguradora Global Panamá.

  xContactsFilterArray.push(dataCotizacion.holderId);
  
  if (dataCotizacion.cessionBeneficiary !== null){
    xContactsFilterArray.push(dataCotizacion.cessionBeneficiary);
  };

  //productor
  if (dataCotizacion.sellerId !== null){
    xContactsFilterArray.push(dataCotizacion.sellerId);
  };
  
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
    Correo: ""
  };

  var Acreedor = {
    ContactId: dataCotizacion.cessionBeneficiary || 0,
    NombreCompleto: "No Tiene",    
    Identificacion: ""
  };  

  var Productor = {
    ContactId: dataCotizacion.sellerId || 0,
    NombreCompleto: "No Tiene",    
    Identificacion: ""
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
    
    //actualizando datos del acreedor
    if (row.id == Acreedor.ContactId){
      if (row.isPerson == true){        
        Acreedor.NombreCompleto = (row.name || "") + " " + (row.middlename ||  "") + " " + (row.surname1 || "") + " " + (row.surname2 || "");
        Acreedor.Identificacion = row.cnp || "";
      }
      else{
        Acreedor.NombreCompleto = row.surname2 || "";
        Acreedor.Identificacion = row.nif || "";
      }         
      Acreedor.NombreCompleto = Acreedor.NombreCompleto != '' ? Acreedor.NombreCompleto : "No Tiene";
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

    //actualizando datos del productor
    if (row.id == Productor.ContactId){
      if (row.isPerson == true){
        Productor.NombreCompleto = (row.name || "") + " " + (row.middlename ||  "") + " " + (row.surname1 || "") + " " + (row.surname2 || "");
      }
      else{
        Productor.NombreCompleto = row.surname2 || "";
      }
    };
    
  });

  //Obteniendo los teléfonos del asegurado
  doCmd({cmd:"LoadEntities",data:{entity:"ContactPhone",operatiion:"GET",filter:"ContactId = " + Asegurado.ContactId + " and type = 'PHONETYPE2'",fields:vfieldsAseguradoPhone}});
  const dataAseguradoPhone = LoadEntities.outData[0];    

  if (dataAseguradoPhone != null){    
    Asegurado.TelefonoCelular = dataAseguradoPhone.num || "";
  };
  
  //doCmd({cmd:"GetPing", data:{mypl: JSON.stringify(contexto)}});

  //return contexto;
  //Cotización - LifePolicy
  Cotizacion.code = dataCotizacion.code;
  Cotizacion.NumeroOferta = dataCotizacion.id;
  Cotizacion.TipoOperacion = "Nueva"; //Pendiente
  Cotizacion.Estado = "Vigente"; //Pendiente
  //Cotizacion.FechaInicioVigencia = dataCotizacion.start;
  Cotizacion.FechaInicioVigencia = formatdate(new Date(dataCotizacion.start).toISOString().slice(0, 10));
  //Cotizacion.FechaFinVigencia = dataCotizacion.end;
  Cotizacion.FechaFinVigencia = formatdate(new Date(dataCotizacion.end).toISOString().slice(0, 10));
  Cotizacion.HoraVigencia = "12:00 AM";
  Cotizacion.PrimaNetaTotal = formateaNumero(dataCotizacion.anualPremium ?? 0);
  Cotizacion.Impuesto = formateaNumero(dataCotizacion.tax ?? 0) ;
  Cotizacion.TotalACobrar = formateaNumero(dataCotizacion.anualTotal ?? 0);
  Cotizacion.Descripcion = dataCotizacion.description || "";
  
  Cotizacion.FechaActual = formatdate(new Date().toISOString().slice(0, 10));
  
  Cotizacion.Tomador = Tomador;
  Cotizacion.Asegurado = Asegurado;
  Cotizacion.Acreedor = Acreedor;
  Cotizacion.Aseguradora = Aseguradora;
  Cotizacion.Address = AseguradoAddress;
  Cotizacion.Productor = Productor;
  
  //Resumen financiero y pago 
  
  var AcuerdoPago = {
    paymentMethod: dataCotizacion.paymentMethod,
    Forma: "",
    periodicity: dataCotizacion.periodicity,
    Frecuencia: "",
    NumPagos: 0    
  };

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

  dataCuotas.forEach(row => {
    AcuerdoPago.NumPagos += 1;
  })
  //Fin acuerdo pago
  
  Cotizacion.AcuerdoPago = AcuerdoPago;
   
 
  //Coberturas - LifeCoverage
  Cotizacion.Cobertura = [];
  
  dataCoberturas.forEach((row, index) => {
    const RegistroId = index;
    let DescripcionValor = "";

    DescripcionValor = getDescripcionCober(row.code, TarifasCatalog, cplan);
    if(row.code == 3){
      
    }
    if(DescripcionValor==""){
      DescripcionValor =  row.deductible;
    }
    
   /*  if(row.code == 3){
     throw DescripcionValor  
    }*/ 
    const nuevoRegistroCoberturas = {
      lifePolicyId: row.lifePolicyId,
      code: row.code,
      name: row.name,
      Descripcion: DescripcionValor,
      SumaAsegurada: formateaNumero(row.limit ?? 0),
      DeducibleValor: row.deductible,
      PrimaNeta: formateaNumero(row.basePremium ?? 0)
    };
    Cotizacion.Cobertura[RegistroId] = nuevoRegistroCoberturas;    
  });

  //return dataPais[0].name;
  //return Riesgo;
  //return formDataArray;
  //return objetoCamposValores;
  //return dataPais;
  //return dataProvincia;
  //return dataMunicipio;
  //return dataSector;
  //return dataBarriada;
  //return Cotizacion.Riesgo;
  //return jsonString;
  //return dataDT;
  //return Cotizacion.AcuerdoPago.paymentMethod;
  //return Asegurado;
  //return Aseguradora;
  //return Acreedor;
  //return Tomador;
  //return dataContacto;
  //return xContactsFilterArray
  //return xContactsFilter;
  //return dataFrecuenciaPago;
  //return dataMetodosPago;
  //return dataCoberturas;
  //return AcuerdoPago;  
  return Cotizacion;
  //return dataCoberturas;

} catch (error) {
   return {ok:false , msg: error.toString() }  
}  

function getTarifasCatalog() {
  
  doCmd({ cmd: "GetFullTable", data: { table: "tarificacionsis9" } });
  let rows = GetFullTable.outData.splice(1);
  
  return rows.map(row =>({
            cramo:row[0],
            codigoplan:row[1],
            ccobertura:row[2],
            cendoso:row[3],	
            condicion:row[4],
            prima:row[5],
            deducible:row[6],
            sumaasegurada:row[7],
            etiqueta:row[8]
        }));
}

function getDescripcionCober(ccober, TarifasCatalog, cplan) {
      let rowdescripcion;
      let returnDescripcion="";
      
        rowdescripcion = TarifasCatalog.find(x => x.cramo == 1 && x.codigoplan == cplan && x.ccobertura == Number(ccober));
  if (rowdescripcion) {
          returnDescripcion = rowdescripcion.etiqueta;
  }
  return returnDescripcion;
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
