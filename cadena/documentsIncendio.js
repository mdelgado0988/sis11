//block
/**
 * Name: documentsIncendio
 * Description: Obtains information in order to print report ofertaincendio.docx
 * Author: Ernesto Garcia
					  
 * Version: 1.0
 * Parameters:
 */

const cobsXTipo = [{tipo: "E", cobs: ["1","3","262","263"]}]
let deduciblesConfig = [];
let limiteConfig = [];

try {
  const row = context?.row || {};
  const policyId = Number(row.policyId || 0);
  const action = String(row.action || '');
  const tipoDoc = String(row.tipo || '');
  const contextFiscalNumber = safeString(row.fiscalNumber || context?.fiscalNumber || "").trim();

  if (!policyId || Number.isNaN(policyId)) {
    return { ok: false, msg: "Debe indicar una póliza válida." };
  }

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
  let cramo = 0;
  
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

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function safeFirst(value) {
    return safeArray(value)[0] || null;
  }

  function safeObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function safeString(value, fallback = "") {
    return value === null || value === undefined ? fallback : String(value);
  }

  function safeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function safeDateText(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return formatdate(date.toISOString().slice(0, 10));
  }

  function getPanamaCurrentDateIso() {
    const panamaOffsetMs = 5 * 60 * 60 * 1000;
    const panamaNow = new Date(Date.now() - panamaOffsetMs);
    const year = panamaNow.getUTCFullYear();
    const month = String(panamaNow.getUTCMonth() + 1).padStart(2, "0");
    const day = String(panamaNow.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function pushIfValid(list, value) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0 && !list.includes(num)) {
      list.push(num);
    }
  }
      
  const vfieldsCotizacion = "lob,productCode,code,id,[start],[end],anualPremium,tax,anualTotal,description,insuredSum,paymentMethod,periodicity,holderId,payerId,cessionBeneficiary,sellerId,policyVersion,fiscalNumber";
  const vfieldsCotizacionAsegurados = "lifePolicyId,contactId";
  
  const vfieldsCoberturas = "lifePolicyId,code,name,description,limit,deductible,basePremium, number";
  const vfieldsCuotas = "lifePolicyId,id,contractYear";
  const vfieldsContacto = "id,name,middlename,surname1,surname2,cnp,nif,isPerson,phone,email"
  const vfieldsAseguradoPhone = "contactId,type,num";
  
  //Carga de datos
  doCmd({cmd:"LoadEntities",data:{entity:"lifepolicy",operatiion:"GET",filter:"id = "+policyId,fields:vfieldsCotizacion}});
  const dataCotizacion = safeFirst(LoadEntities?.outData);
  if (!dataCotizacion) {
    return { ok: false, msg: "No fue posible recuperar la póliza solicitada." };
  }
  cplan = dataCotizacion.productCode;
  cramo = safeNumber(dataCotizacion.lob, 0);
  const fiscalNumber = contextFiscalNumber || safeString(dataCotizacion.fiscalNumber, "").trim();

  setDeduciblesCatalog();
  setLimiteCobertura();
  
  const TarifasCatalog = getTarifasCatalog();  

  doCmd({cmd:"LoadEntities",data:{entity:"insured",operatiion:"GET",filter:"LifePolicyId = "+policyId,fields:vfieldsCotizacionAsegurados}});
  const dataCotizacionAsegurados = safeFirst(LoadEntities?.outData);
  if (!dataCotizacionAsegurados) {
    return { ok: false, msg: "No fue posible recuperar el asegurado de la póliza." };
  }

  doCmd({cmd:"LoadEntities",data:{entity:"lifecoverage",operatiion:"GET",filter:"LifePolicyId = "+policyId,fields:vfieldsCoberturas}});
  const dataCoberturas = safeArray(LoadEntities?.outData);

  //Michael Delgado. GLOB-515: Ordenamos
  dataCoberturas.sort((a, b) => safeNumber(a?.number) - safeNumber(b?.number));

  doCmd({cmd:"RepoPaymentMethodCatalog",data:{operation:"GET"}});
  const dataMetodosPago = safeArray(RepoPaymentMethodCatalog?.outData);

  // doCmd({cmd:"LoadEntities",data:{entity:"PayPlan",operatiion:"GET",filter:"LifePolicyId = "+policyId,fields:vfieldsCuotas}});
   doCmd({cmd:"LoadEntities",data:{entity:"PayPlan",operation:"GET",filter:"cancellationDate IS NULL AND LifePolicyId = "+policyId,fields:vfieldsCuotas}});
  const dataCuotas = safeArray(LoadEntities?.outData);

  doCmd({cmd:"RepoInsuredObject",data:{filter:"LifePolicyId = "+policyId,"operation":"GET"}});
  const dataDT = safeFirst(RepoInsuredObject?.outData);
  
  //Obteniendo la información del DT.
  const jsonString = dataDT ? safeString(dataDT.jValues, "") : ""; 
  let formDataArray = null;
  try {
    formDataArray = jsonString ? JSON.parse(jsonString) : null;
  } catch (error) {
    formDataArray = null;
  }

  if (formDataArray !== null){
    const objetoCamposValores = safeArray(formDataArray).reduce((accumulator, field) => {
      // Excluimos campos sin nombre (como los de tipo 'header')
      if (field && field.name && field.userData && field.userData.length > 0) {
          
          // El nombre del campo es la clave
          const key = field.name;
          
          // El valor es el primer elemento del array userData
          let value = field.userData[0];
          
          // Opcional: Si el campo es numérico, intenta convertir el valor a un número.
          if (field.type === 'number' && value !== "") {
               value = safeNumber(value, 0);
          }
          
          // Agregamos la nueva propiedad al acumulador
          accumulator[key] = value;
      }
      
      // Devolvemos el objeto acumulador para la siguiente iteración
      return accumulator;
    }, {});
  
    //maxteen
    //Inicializo el  DT  
    Riesgo.TipoObjeto = safeString(objetoCamposValores.cmbTipoObjeto);
    Riesgo.SA = safeNumber(objetoCamposValores.txtSA, 0);
    Riesgo.Finca = safeString(objetoCamposValores.txtFinca);
    Riesgo.Rollo = safeString(objetoCamposValores.txtRollo);
    Riesgo.Doc = safeString(objetoCamposValores.txtDoc);
    Riesgo.NumeroPrestamo = safeNumber(objetoCamposValores.txtNoPrestamo, 0);
    Riesgo.NumeroGarantia = safeNumber(objetoCamposValores.txtNoGarantia, 0);
    Riesgo.CategoriaActividad = safeString(objetoCamposValores.cmbCategoriaActividad);
    Riesgo.UsoBien = safeNumber(objetoCamposValores.cmbUsoBien, 0);
    Riesgo.TipoMaterial = safeString(objetoCamposValores.cmbTipoMaterial);
    Riesgo.Area = safeNumber(objetoCamposValores.txtArea, 0);
    Riesgo.CantidadPisos = safeNumber(objetoCamposValores.txtCantidadPisos, 0);
    Riesgo.Descripcion = safeString(objetoCamposValores.Descripcion);
    Riesgo.CodigoPais = safeNumber(objetoCamposValores.cmbPais, 0);
    Riesgo.CodigoProvincia = safeNumber(objetoCamposValores.cmbProvincia, 0);
    Riesgo.CodigoDistrito = safeNumber(objetoCamposValores.cmbMunicipio, 0);
    Riesgo.CodigoCorregimiento = safeString(objetoCamposValores.cmbSector, "0");
    Riesgo.CodigoBarriada = safeString(objetoCamposValores.cmbBarriadas, "0");
    Riesgo.CodigoEdificio = safeNumber(objetoCamposValores.cmbEdificios, 0);
    Riesgo.Manzana = safeString(objetoCamposValores.manzana);
    Riesgo.Casa = safeString(objetoCamposValores.aptoocasa);
    Riesgo.Calle = safeString(objetoCamposValores.calleoavenida);
    Riesgo.CodigoZonaCresta = safeNumber(objetoCamposValores.cmbZonaCresta, 0);
    Riesgo.Direccion = safeString(objetoCamposValores.direccionexacta);
    Riesgo.NombreBarriada = safeString(objetoCamposValores.txtBarriadas);
    Riesgo.NombreEdificio = safeString(objetoCamposValores.txtEdificios);
  };

  //Validación exclusiva
  if (tipoDoc === "E" || tipoDoc === "C") {
    Riesgo.TipoObjeto = tipoDoc === "E" ? "EDIFICIO" : "CONTENIDO";
  }

   //Cargando la dirección del Asegurado  
  doCmd({cmd:"RepoContactAddress",data:{operation:"GET",filter:"contactId = "+ dataCotizacionAsegurados.contactId}})
  const dataAseguradoAddress = safeFirst(RepoContactAddress?.outData) || {};
  var AseguradoAddress = {};
    
  AseguradoAddress.CodigoPais = dataAseguradoAddress.country || "0"; //country
  AseguradoAddress.CodigoProvincia = dataAseguradoAddress.state || 0;    //state
  AseguradoAddress.CodigoMunicipio = dataAseguradoAddress.city || 0; //city    
  AseguradoAddress.Linea1 = dataAseguradoAddress.address1 || ""; //address1
  AseguradoAddress.Linea2 = dataAseguradoAddress.address2 || ""; //address1
  AseguradoAddress.NombrePais = "";
  AseguradoAddress.NombreProvincia = "";
  AseguradoAddress.NombreMunicipio = ""; //Inicializamos por defecto
  
  //Obteniendo los nombres de los códigos
  //País
  doCmd({cmd:"RepoCountryCatalog",data:{operation:"GET", filter: "code="+ AseguradoAddress.CodigoPais}});
  const dataPaisAddress = safeArray(RepoCountryCatalog?.outData);
  
  if (dataPaisAddress != null && dataPaisAddress.length > 0)  {
    AseguradoAddress.NombrePais = dataPaisAddress[0].name || "";    
  };
    
  //Provincia - Estado
  doCmd({cmd:"RepoStateCatalog",data:{operation:"GET", filter: "countryCode="+ AseguradoAddress.CodigoPais + " and code="+ AseguradoAddress.CodigoProvincia}});
  const dataProvinciaAddress = safeArray(RepoStateCatalog?.outData);

  AseguradoAddress.NombreProvincia = ""; //Inicializamos por defecto
  if (dataProvinciaAddress != null && dataProvinciaAddress.length > 0)  {    
    AseguradoAddress.NombreProvincia = dataProvinciaAddress[0].name || "";
  };   
      
  //Municipio - Distrito - Ciudad
  doCmd({cmd:"RepoCityCatalog",data:{operation:"GET", filter: "stateCode=" + AseguradoAddress.CodigoProvincia + "and code="+ AseguradoAddress.CodigoMunicipio}});  
  const dataDistritoAddress = safeArray(RepoCityCatalog?.outData);
  
  if (dataDistritoAddress != null && dataDistritoAddress.length > 0)  {    
    AseguradoAddress.NombreMunicipio = dataDistritoAddress[0].name || "";
  } 
  
  //Obteniendo los nombres de los códigos
  //País
  doCmd({cmd:"RepoCountryCatalog",data:{operation:"GET", filter: "code="+ Riesgo.CodigoPais}});
  const dataPais = safeFirst(RepoCountryCatalog?.outData) || {};
  Riesgo.NombrePais = safeString(dataPais.name);
  
  //Provincia - Estado
  doCmd({cmd:"RepoStateCatalog",data:{operation:"GET", filter: "countryCode="+ Riesgo.CodigoPais + " and code="+ Riesgo.CodigoProvincia}});
  const dataProvincia = safeFirst(RepoStateCatalog?.outData) || {};
  Riesgo.NombreProvincia = safeString(dataProvincia.name);
  
  //Municipio - Distrito - Ciudad
  doCmd({cmd:"RepoCityCatalog",data:{operation:"GET", filter: "stateCode=" + Riesgo.CodigoProvincia + " and code="+ Riesgo.CodigoDistrito}});  
  const dataDistrito = safeFirst(RepoCityCatalog?.outData) || {};
  Riesgo.NombreDistrito = safeString(dataDistrito.name);
  
  //Sector - Corregimiento
  doCmd({cmd:"RepoSectorCatalog",data:{operation:"GET", filter: "cityCode=" + Riesgo.CodigoDistrito + " and code="+ Riesgo.CodigoCorregimiento}});  
  const dataSector = safeFirst(RepoSectorCatalog?.outData) || {};
  Riesgo.NombreCorregimiento = safeString(dataSector.name);
  
  /*//Barriada
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
  });   */ 
  
  Cotizacion.Riesgo = Riesgo; // Se traslada al objeto final los datos del DT.
  
  //Registrando el filtro de la tabla contacto
  xContactsFilterArray.push(1); //Este es el código de la aseguradora Global Panamá.

  pushIfValid(xContactsFilterArray, dataCotizacion.holderId);
  
  pushIfValid(xContactsFilterArray, dataCotizacion.cessionBeneficiary);

  //productor
  pushIfValid(xContactsFilterArray, dataCotizacion.sellerId);
  
  if (dataCotizacionAsegurados !== null)  {
    if (xContactsFilterArray.includes(Number(dataCotizacionAsegurados.contactId)) == false) {
      pushIfValid(xContactsFilterArray, dataCotizacionAsegurados.contactId);
    }    
  };  

  //Carga de datos Contacto
  let dataContacto = [];
  if (xContactsFilterArray.length > 0) {
    doCmd({cmd:"LoadEntities",data:{entity:"Contact",operatiion:"GET",filter:"id in ("+xContactsFilterArray.join(',')+")",fields:vfieldsContacto}});
    dataContacto = safeArray(LoadEntities?.outData);
  }

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
  const dataAseguradoPhone = safeFirst(LoadEntities?.outData);    

  if (dataAseguradoPhone != null){    
    Asegurado.TelefonoCelular = dataAseguradoPhone.num || "";
  };
  
  //doCmd({cmd:"GetPing", data:{mypl: JSON.stringify(contexto)}});

  //return contexto;
  //Cotización - LifePolicy
  Cotizacion.code = dataCotizacion.code;
  Cotizacion.NumeroOferta = dataCotizacion.id;
  Cotizacion.fiscalNumber = fiscalNumber;
  Cotizacion.NumeroRecibo = fiscalNumber;
  Cotizacion.TipoOperacion = safeNumber(dataCotizacion.policyVersion, 0) > 0 ? "Renovación" : "Nueva";
  Cotizacion.Estado = "Vigente"; //Pendiente
  //Cotizacion.FechaInicioVigencia = dataCotizacion.start;
  Cotizacion.FechaInicioVigencia = safeDateText(dataCotizacion.start);
  //Cotizacion.FechaFinVigencia = dataCotizacion.end;
  Cotizacion.FechaFinVigencia = safeDateText(dataCotizacion.end);
  Cotizacion.HoraVigencia = "12:00 AM";
  Cotizacion.PrimaNetaTotal = formateaNumero(dataCotizacion.anualPremium ?? 0);
  Cotizacion.Impuesto = formateaNumero(dataCotizacion.tax ?? 0) ;
  Cotizacion.TotalACobrar = formateaNumero(dataCotizacion.anualTotal ?? 0);
  Cotizacion.Descripcion = dataCotizacion.description || "";
  
  Cotizacion.FechaActual = formatdate(getPanamaCurrentDateIso());
  Cotizacion.Action = '';
  
  Cotizacion.Tomador = Tomador;
  Cotizacion.Asegurado = Asegurado;
  Cotizacion.Acreedor = Acreedor;
  Cotizacion.Aseguradora = Aseguradora;
  Cotizacion.Address = AseguradoAddress;
  Cotizacion.Productor = Productor;

  if(action){
    Cotizacion.Action ='MOVIMIENTO: RENOVACIÓN';
  }
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

  const maxContractYear = dataCuotas.length > 0
    ? Math.max(...dataCuotas.map(row => safeNumber(row.contractYear, 0)))
    : 0;
  
  dataCuotas.forEach(row => {
    if (action) {
      // Solo contar las del año inmediatamente anterior al último
      if (row.contractYear === maxContractYear - 1) {
        AcuerdoPago.NumPagos += 1;
      }
    } else {
      AcuerdoPago.NumPagos += 1;
    }
  });
  //Fin acuerdo pago
  
  Cotizacion.AcuerdoPago = AcuerdoPago;
    
  //Coberturas - LifeCoverage
  Cotizacion.Cobertura = [];
    
  dataCoberturas.forEach((row, index) => {
    const RegistroId = index;
    let DescripcionValor = "";

    const SumaCob256 = dataCoberturas.find(x => Number(x.code) === 256)?.limit ?? 0;

    DescripcionValor = getDescripcionCober(row, TarifasCatalog, cplan, SumaCob256);

    //log(`Deducible result: ${DescripcionValor}`);
    
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
      SumaAsegurada: getLimite(row.limit, cramo, cplan, row.code),
      DeducibleValor: getDeducible(row.deductible, cramo, cplan, row.code),
      PrimaNeta: formateaNumero(row.basePremium ?? 0)
    };
    Cotizacion.Cobertura[RegistroId] = nuevoRegistroCoberturas;    
  });

  if (tipoDoc === "E" || tipoDoc === "C") {

    const cobsxTipo = cobsXTipo.find(x => x.tipo == "E")
    
    if(tipoDoc == "E")
      Cotizacion.Cobertura = Cotizacion.Cobertura.filter(x => cobsxTipo?.cobs.find(b => b == x.code));
    else
      Cotizacion.Cobertura = Cotizacion.Cobertura.filter(x => !cobsxTipo?.cobs.find(b => b == x.code));
      
  }

  return Cotizacion;

} catch (error) {
   return {ok:false , msg: error.toString() }  
}  

function getTarifasCatalog() {

  const clean = v =>
  String(v ?? '')
    .replace(/\\/g, '')     // quita backslashes
    .replace(/"+/g, '')     // quita todas las "
    .replace(/'+/g, '')     // quita todas las '
    .trim();

  doCmd({ cmd: "GetFullTable", data: { table: "tarificacionsis9" } });
  let rows = Array.isArray(GetFullTable?.outData) ? GetFullTable.outData.slice(1) : [];

  return rows.map(row => ({
    cramo: clean(row[0]),
    codigoplan: clean(row[1]),
    ccobertura: clean(row[2]),
    cendoso: clean(row[3]),
    condicion: clean(row[4]),
    prima: clean(row[5]),
    deducible: clean(row[6]),
    sumaasegurada: clean(row[7]),
    etiqueta: clean(row[8])
  }));
}

function getDescripcionCober(coverage, TarifasCatalog, cplan, SumaCob256) {
  let rowdescripcion;
  let returnDescripcion="";
  
  rowdescripcion = TarifasCatalog.find(x => x.cramo == 1 && x.codigoplan == cplan && x.ccobertura == Number(coverage.code));
    
  if (rowdescripcion) {
    returnDescripcion = simulateTarifa(rowdescripcion.etiqueta, coverage, SumaCob256);
    //log(`Descripción deducible: ${returnDescripcion}`);
  }
  return returnDescripcion;
}

function simulateTarifa(tarifa, coverage, SumaCob256) {
  try {

    //log("Iniciando simulación");
    
    let sumaasegurada256 = SumaCob256;

    let varG = " sumaasegurada256=" + sumaasegurada256 + ";";
    varG = varG + " limitCob=" + coverage.limit + ";";

    // VARIABLES GLOBALES CONFIGURACION DE INCENDIO POR COBERTURA
    // EN FOR DE COBERTURAS
    //log("Evaluando variables");
    let CCOBER = coverage.code;
    let basePremiumInput = coverage.basePremium || 0;
    let dedutibleInput = coverage.deductible ?? coverage.dedutible ?? 0;
    let limitInput = coverage.limit || 0;

    varG = varG + " basePremiumInput=" + basePremiumInput + ";";
    varG = varG + " dedutibleInput=" + dedutibleInput + ";";
    varG = varG + " limitInput=" + limitInput + ";";

    varG = varG + " CCOBER=" + CCOBER + ";";
    let pprima = "0";
    varG = varG + " pprima=" + pprima + ";";
    varG = varG + " msumaaseg=" + limitInput + ";";
    
    let evalTarifa = varG + ' ' + tarifa;

    //log("Evaluando deducible");
    //log(`Tarifa: ${tarifa}`);
    //log(`Eval Tarifa: ${evalTarifa}`);

    let deductibleReturn = eval(evalTarifa) ?? tarifa;

    //log(`Result: ${deductibleReturn}`);
    
    return deductibleReturn;
    
  } catch (error) {
    //log(`Error evaluación: ${error.toString()}`);
    return tarifa;
  }
}

function setDeduciblesCatalog() {
  
  doCmd({ cmd: "GetFullTable", data: { table: "cfgDeducibleIncendio" } });
  let rows = Array.isArray(GetFullTable?.outData) ? GetFullTable.outData.slice(1) : [];
  
  deduciblesConfig = rows.map(row =>({
            cramo:row[0],
            cplan:row[1],
            ccober:row[2],
            descripcion:row[3]
        }));
}

function setLimiteCobertura() {
  
  doCmd({ cmd: "GetFullTable", data: { table: "tbLimiteCobertura" } });
  let rows = Array.isArray(GetFullTable?.outData) ? GetFullTable.outData.slice(1) : [];
  
  limiteConfig = rows.map(row =>({
            cramo:row[0],
            cplan:row[1],
            ccober:row[2],
            limite:row[3]
        }));
}

function getDeducible(deducible, cramo, cplan, ccober) {

  const config = deduciblesConfig.find(x => x.cramo == cramo && x.cplan == cplan && x.ccober == ccober);
  log(`parametros dedu: cober => ${ccober}, ramo => ${cramo}, plan => ${cplan}`);
  log(`config dedu: ${JSON.stringify(config)}`);
  if(config && deducible == 0){
    log(`config dedu: ${JSON.stringify(config)}`);
    return config.descripcion ?? formateaNumero(deducible);
  }
  return formateaNumero(deducible);
  
}

function getLimite(limite, cramo, cplan, ccober) {

  const config = limiteConfig.find(x => x.cramo == cramo && x.cplan == cplan && x.ccober == ccober);
  log(`parametros limit: cober => ${ccober}, ramo => ${cramo}, plan => ${cplan}`);
  log(`config limit: ${JSON.stringify(config)}`);
  if(config){
    return config.limite ?? formateaNumero(limite ?? 0);
  }
  return formateaNumero(limite ?? 0);
  
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
