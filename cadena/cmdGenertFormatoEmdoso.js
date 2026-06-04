//block
//noreplace
/*
 * @authorJampier Solera
 * @created 2026/02/11
 * @name cmdGenertFormatoEmdoso
 * @version 1.1
 * @summary This command makes Endosos Template Data Builder + GeneratePolicyDoc
*/

const changeId = context.changeId;
const ExeOrgin = context.ExeOrgin;
const xContactsFilterArray = [];
const vfieldsCotizacionAsegurados = "lifePolicyId,contactId";
const vfieldsContacto = "id,name,middlename,surname1,surname2,cnp,nif,isPerson,phone,email"

//Registrando el filtro de la tabla contacto
xContactsFilterArray.push(1); //Este es el código de la aseguradora Global Panamá.

// -----------------------------
// 1) Cargar Change
// -----------------------------
const change = loadOne("Change", `id=${changeId}`);
const billDiff = loadOne("BillDiff", `changeId=${changeId}`) ?? {};
if (!change) throw `El endoso [${changeId}] no existe.`;

const changeName = change.Discriminator || "";
if (changeName == "CancellationChange" && ExeOrgin == 'WF'){
  return;
} 

const template = changeName == "LoadingChange" ? 'FormatoEndososSinCobertura.docx' : 'FormatoEndosos.docx';
const { eventName, nombreEndoso } = mapChangeName(changeName);
// return change
// -----------------------------
// 2) Cargar Policy (NO borres Holder/Payer)
// -----------------------------

const dataCotizacionAsegurados = getInsureds(change.lifePolicyId)
const policy = getPolicy(change.lifePolicyId);
const InsuredObject = getInsuredObjects(change);
//return {pol: InsuredObject, change: getChangeInsuredObjects(change) }

if(!policy.productCode === "1_9"){
  return;
}

if (!policy) throw `La póliza [${change.lifePolicyId}] no ha sido encontrada.`;

//Set contact list to look for data;
setContactsList();

// -----------------------------
// 3) Armar row/outdata base
// -----------------------------
const row = {
  changeName,
  eventName,
  nombreEndoso,
  intermediarychange: changeName === "IntermediaryChange",
  esaumento: true,
  isminoritary: policy.coinsurance === 2,
  commissionOldSeller: [],
  commissionNewSeller: [],
  participantes: [],
  hascoinsurances: false,
  hascommissions: false,
  hastax: !!policy.tax,
  numcoverages: 0,
  totalPercCoInsurances: 0,
  Changeid: change.id,
  Policy: sanitizePolicy(policy),
  Commissions: [],
  Cessions: []
};

// -----------------------------
// 4) Caso especial: IntermediaryChange
// -----------------------------
if (changeName === "IntermediaryChange") {
  if (change.status !== 1) {
    if(ExeOrgin !== "WF")
      throw `El endoso [${changeId}] no se encuentra ejecutado`;
  }

  const rate = 1; // si luego vuelves a calcular coinsurance, lo aplicas aquí
  const { oldSellerId, newSellerId } = change;

  doCmd({
    cmd: "RepoCommission",
    data: { operation: "GET", filter: `lifePolicyId='${policy.id}' and changeId='${changeId}'` }
  });

  policy.oldSellerId = oldSellerId ?? 0;
  if (!xContactsFilterArray.includes(policy.oldSellerId)) {
    xContactsFilterArray.push(policy.oldSellerId);
  }

  const records = (RepoCommission.outData && RepoCommission.outData.records) || [];
  records.forEach(com => {
    if (com.sellerId == oldSellerId && com.credit < 0) {
      row.commissionOldSeller.push({ ...com, credit: round2((com.credit * -1) * rate) });
    } else if (com.sellerId == newSellerId && com.credit > 0) {
      row.commissionNewSeller.push({ ...com, credit: round2(com.credit * rate) });
    }
  });
  
  // 👉 Aquí construimos custom y generamos doc igualmente
  return generateDocWithCustom({ row, policy, change });
}

// -----------------------------
// 5) Normal: details, coveragesDif, etc.
// -----------------------------
const details = safeJson(change.jDetail, {});
row.details = normalizeDetails(details);

// Si coveragesDif < 0 no es aumento
if (Number(row.details.coveragesDif || 0) < 0) row.esaumento = false;

// si necesitas Coverages del detalle:
const detCovs = Array.isArray(details.Coverages) ? details.Coverages : [];
row.numcoverages = detCovs.length;

//Michael Delgado. 2026-05-22. GLOB-689. Generamos número de endoso.
generateChangeCode(change);

/*//test mad:
//return billDiff;
const arrayResult = [{ outdata: row }];
const custom = buildCustomForTemplate({ row, policy, change, arrayResult, billDiff });
//return custom
calculateEndorsmentNote(change, changeName, custom, policy);
return custom;
//fin test mad*/

// -----------------------------
// 6) Generar documento con custom (lo que el template pide)
// -----------------------------
return generateDocWithCustom({ row, policy, change, billDiff });

// =====================================================
// Helpers
// =====================================================

function getPolicy(policyId) {
  doCmd({
    cmd: "RepoLifePolicy",
    data: {
      operation: "GET",
      filter: `id=${policyId}`,
      include: [
        "Holder",
        "Holder.Addresses",
        "Holder.Phones",
        "Payer",
        "Coverages",
        "Commissions",
        "CoinsuranceCessions",
        "Cessions",
        "Cessions.Participants"
      ]
    }
  });

  return (RepoLifePolicy.outData && RepoLifePolicy.outData[0]) || null;
    
}

function setContactsList() {
  //Registrando el filtro de la tabla contacto
  xContactsFilterArray.push(1); //Este es el código de la aseguradora Global Panamá.
  
  xContactsFilterArray.push(policy.holderId);
  
  if (policy.cessionBeneficiary !== null){
    xContactsFilterArray.push(policy.cessionBeneficiary);
  };
  
  //Michael Delgado. 2026.03.05. GLOB-523. Validamos Endoso de cambio de Beneficiario
  setCessionBeneficiaryChangeData(change, policy, xContactsFilterArray)
  setCapitalChangeData(change, policy);
  setFrequencyChangeData(change, policy);
  
  //productor
  if (policy.sellerId !== null){
    xContactsFilterArray.push(policy.sellerId);
  };
  
  if (dataCotizacionAsegurados !== null)  {
    if (xContactsFilterArray.includes(dataCotizacionAsegurados.contactId) == false) {
      xContactsFilterArray.push(dataCotizacionAsegurados.contactId);
    }    
  };  
}

function getInsureds(lifePolicyId) {
  doCmd({
    cmd:"LoadEntities",
    data:{
      entity:"insured",
      operatiion:"GET",
      filter:"LifePolicyId = " + lifePolicyId,
      fields:vfieldsCotizacionAsegurados
    }
  });
  
  const dataCotizacionAsegurados = LoadEntities.outData[0];
  return dataCotizacionAsegurados;
}

function getInsuredObjects(change) {

  if(changeName === 'InsuredObjectChange')
    return getChangeInsuredObjects(change);

  let objectDefinitionId = 0;

  if(policy?.productCode === '1_17'){
    doCmd({"cmd":"RepoObjectDefinition","data":{"operation":"GET","filter":"code = 'DTINCENDIO_SUMA'"}});
    objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;
  }
  else {
    doCmd({"cmd":"RepoObjectDefinition","data":{"operation":"GET","filter":"code = 'DT_INCENDIO_V3'"}});
    objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;
  }

  doCmd({
    "cmd": "RepoInsuredObject",
    "data": {
      operation: "GET",
      filter: `lifePolicyId=${change.lifePolicyId} AND objectDefinitionId = ${objectDefinitionId}`,
        "include": [
            "ObjectDefinition"
        ]
    }
  })
  
  const InsuredObject = (RepoInsuredObject.outData && RepoInsuredObject.outData[0]) || null;
  return InsuredObject
}

function getChangeInsuredObjects(change) {
  const newInsuredObjects = JSON.parse(change.jNewInsuredObjects)?.[0] ?? {};

  if(newInsuredObjects){
    const data = JSON.parse(newInsuredObjects.jValues) ?? [];
    const userData = Object.fromEntries(
      data
        .filter(x => x.name && x.userData?.length)
        .map(x => [x.name, x.userData[0]])
    );
    newInsuredObjects.userData = userData;
  } 
  
  return newInsuredObjects;
}

function setCessionBeneficiaryChangeData(change, policy, xContactsFilterArray) {

  if(changeName !== "CessionBeneficiaryChange")
    return;
    
  const newCessionBeneficiary = change.newCessionBeneficiary ?? 0;
  const oldCessionBeneficiary = change.oldCessionBeneficiary ?? (policy.cessionBeneficiary ?? 0);
  xContactsFilterArray.push(newCessionBeneficiary);
  policy.cessionBeneficiary = newCessionBeneficiary;
  policy.oldCessionBeneficiary = oldCessionBeneficiary;
 
}

function setCapitalChangeData(change, policy) {

  if(changeName !== "CapitalChange")
    return;
    
  const newCapital = change.newCapital ?? 0;
  const olCapital = change.olCapital ?? (policy.insuredSum ?? 0);
  policy.newCapital = newCapital;
  policy.olCapital = olCapital;
 
}

function setFrequencyChangeData(change, policy) {

  if(changeName !== "FrequencyChange")
    return;
    
  const newFrequency = change.newFrequency ?? "";
  const oldFrequency = change.oldFrequency ?? (policy.insuredSum ?? "");
  policy.newFrequency = newFrequency;
  policy.oldFrequency = oldFrequency;
 
}

function calculateEndorsmentNote(change, changeName, custom, policy) {
  
  if(custom.Endoso.DetalleEndoso !== "Sin Detalles")
    return;

  if(changeName == "CessionBeneficiaryChange"){
    custom.Endoso.DetalleEndoso = `Cambio de acreedor, anterior: ${custom?.AcreedorAnterior?.NombreCompleto ?? "No Tiene"} => nuevo: ${custom?.Acreedor?.NombreCompleto ?? "No Tiene"}`
  }

  if(changeName == "IntermediaryChange"){
    custom.Endoso.DetalleEndoso = `Cambio de intermediario, anterior: ${custom?.ProductorAnterior?.NombreCompleto ?? "No Tiene"} => nuevo: ${custom?.Productor?.NombreCompleto ?? "No Tiene"}`
  }

  if(changeName == "CapitalChange"){
    custom.Endoso.DetalleEndoso = `Cambio de suma asegurada, anterior: ${n(policy.olCapital ?? 0)} => nueva: ${n(policy.newCapital ?? 0)}`
  }

  if(changeName == "FrequencyChange"){
    custom.Endoso.DetalleEndoso = `Cambio de frecuencia, anterior: ${frequencyName(policy.oldFrequency ?? "No Tiene")} => nueva: ${frequencyName(policy.newFrequency ?? "No Tiene")}`
  }
      
}

function frequencyName(value) {
  const map = {
    m: "Mensual",
    b: "Bimensual",
    t: "Trimestral",
    y: "Anual",
    c: "Contado",
    q: "Semestral",
    s: "Semestral"
  };

  return map[value] ?? value;
}

function getEndorsmentTitle(discriminator) {
  const map = {
    CancellationChange: "Cancelación",
    CessionBeneficiaryChange: "Cambio de Acreedor",
    IntermediaryChange: "Cambio de Intermediario",
    CapitalChange: "Cambio de Suma Asegurada",
    FrequencyChange: "Frecuencia de Pago",
    InsuredObjectChange: "Cambio de Objeto Asegurado",
    CoverageChange: "Cambio de Cobertura",
    PolicySurchargeChange: "Cambio de Recargos/Descuentos",
    AddCoverageChange: "Inclusión de Cobertura",
    RemoveCoverageChange: "Exclusión de Cobertura",
    BeneficiaryChange: "Cambio de Beneficiario",
    PayPlanChange: "Cambio de Plan de Pago",
    CoverageChangeTechData: "Cambio de Cobertura Técnica",
    ClauseChange: "Cambio de Cláusulas",
    ExclusionChange: "Cambio de Exclusiones",
    LoadingChange: "Cambio de Recargos/Descuentos"
  };

  return map[discriminator] || discriminator;
}

function generateDocWithCustom({ row, policy, change, billDiff }) {
  const arrayResult = [{ outdata: row }];

  const custom = buildCustomForTemplate({ row, policy, change, arrayResult, billDiff });
  custom.TituloEndosoCan = getEndorsmentTitle(change.Discriminator);
  custom.TituloEndosoCanEfectiva= '';
  custom.TituloCanceFecha= '';
  
  if(change.Discriminator == "CancellationChange"){
    custom.TituloEndosoCanEfectiva  = 'Cancelación Efectiva';
    custom.TituloCanceFecha  = `Desde: ${toDate(change.effectiveDate)}`;
  }

  calculateEndorsmentNote(change, changeName, custom, policy);

  // return custom
  doCmd({ "cmd": "RepoDocument", "data": { "operation": "ADD", "entity": { "fileName": template, "LifePolicyid": policy.id } } });
  doCmd({ "cmd": "GenerateDoc", "data": { "template": template, "data": custom, "async": false } });

  const docId = RepoDocument.outData[0].id;
  const fileName = `${GenerateDoc.outData.fileName}_${row.Changeid}`;
  const name = `${GenerateDoc.outData.fileName}_${row.Changeid}`;
  const url = GenerateDoc.outData.url;
  
  //setDocField(docId, `fileName='${change.Discriminator}_${fileName}'`);
  //setDocField(docId, `name='Recibo Endoso ${change.Discriminator}-${row.Changeid}'`);
  setDocField(docId, `fileName='Endoso de ${custom.TituloEndosoCan}'`);
  setDocField(docId, `name='Documento de Endoso'`);
  setDocField(docId, `url='${url}'`);
  setDocField(docId, "created=GETDATE()");


  return GenerateDoc.msg || "OK";
}

function buildCustomForTemplate({ policy, row, change, coverages, primas, billDiff }) {
  const holder = policy?.Holder || {};
  const payer  = policy?.Payer  || {};

  // Nombre completo seguro
  const holderFullName =
    holder.FullName ||
    [holder.name, holder.surname1, holder.surname2].filter(Boolean).join(" ") ||
    "";

    //Carga de datos Contacto
  doCmd({cmd:"LoadEntities",data:{entity:"Contact",operatiion:"GET",filter:"id in ("+xContactsFilterArray.join(',')+")",fields:vfieldsContacto}});
  const dataContacto = LoadEntities.outData;

  // Catalogos (si estas funciones se llaman muchas veces, esto conviene cachearlo fuera)
  doCmd({ cmd: "RepoCountryCatalog", data: { operation: "GET" } });
  const countries = Array.isArray(RepoCountryCatalog.outData) ? RepoCountryCatalog.outData : [];

  doCmd({ cmd: "RepoSectorCatalog", data: { operation: "GET" } });
  const sectors = Array.isArray(RepoSectorCatalog.outData) ? RepoSectorCatalog.outData : [];

  doCmd({ cmd: "RepoStateCatalog", data: { operation: "GET" } });
  const procincias = Array.isArray(RepoStateCatalog.outData) ? RepoStateCatalog.outData : [];

  doCmd({ cmd: "RepoCityCatalog", data: { operation: "GET" } });
  const Municipios = Array.isArray(RepoCityCatalog.outData) ? RepoCityCatalog.outData : [];
  
  const addr = (holder.Addresses && holder.Addresses[0]) || {};

  // Lookups seguros (sin [0].name)
  const sectorName = addr.sector
    ? (sectors.find(itm => itm.id === Number(addr.sector))?.name || String(addr.sector))
    : "No Tiene";

  const countryName = addr.country
    ? (countries.find(itm => itm.code === addr.country)?.name || String(addr.country))
    : "No Tiene";

  const linea2 = addr.address1 ? String(addr.address1) : "";

  // Phones seguro (sin reventar si viene vacío)
  const celPhone = holder?.Phones?.find(p => p.type === "PHONETYPE2")?.num ?? "No Tiene";

  // Si tienes email plano ok, si no, intenta buscarlo en Emails
  const email = holder.email || holder?.Emails?.[0]?.email || "No Tiene";
  
  const getHora = (fecha) => {
    const d = (fecha instanceof Date) ? fecha : new Date(fecha);
    if (isNaN(d)) return null;
  
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
  
    return `${hh}:${mm}:${ss}`;
  };

  const getFechaImpresion = (fecha = new Date()) => {
    const d = (fecha instanceof Date) ? fecha : new Date(fecha);
    if (isNaN(d)) return null;
  
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
  
    return `${dd}/${mm}/${yyyy}`;
  };

  // Base custom
  const custom = {
    Aseguradora: { NombreSocial: "GLOBAL ASEGURADORA S.A." },
    code: policy?.code || "",

    Tomador: { NombreCompleto: holderFullName },

    Asegurado: {
      NombreCompleto: holderFullName,
      Identificacion: holder.cnp || holder.nit || "No Tiene",
      TelefonoContacto: holder.phone ||"No Tiene",
      TelefonoFax: "No Tiene",
      TelefonoCelular: celPhone,
      Email: email
    },

    Address: {
      Linea2: linea2,
      NombrePais: countryName,
      NombreProvincia: sectorName,
      NombreDistrito : InsuredObject.userData.cmbMunicipio?  (Municipios.find(itm => itm.code === InsuredObject.userData.cmbMunicipio)?.name || String(InsuredObject.userData.cmbMunicipio)): "",
    },

    Acreedor:{
      ContactId: policy.cessionBeneficiary ?? 0,
      NombreCompleto: "No Tiene",    
      Identificacion: ""
    },
  
    AcreedorAnterior:{
      ContactId: policy.oldCessionBeneficiary ?? 0,
      NombreCompleto: "No Tiene",    
      Identificacion: ""
    },
  
    Productor:{
      ContactId: policy.sellerId || 0,
      NombreCompleto: "No Tiene",    
      Identificacion: ""
    }, 
      
    ProductorAnterior:{
    ContactId: policy.oldSellerId || 0,
    NombreCompleto: "No Tiene",    
    Identificacion: ""
  },

    FechaInicioVigencia: toDate(change?.effectiveDate),
    FechaFinVigencia: toDate(policy?.end),
    HoraVigencia: getHora(change?.effectiveDate),
    FechaImpresion: getFechaImpresion(),

    PrimaNetaTotal: n(policy?.anualPremium),
    Impuesto: n(policy?.tax),
    TotalACobrar: n(policy?.anualTotal),

    Endoso: {
      Id: change?.code ?? "0",
      Nombre: row.nombreEndoso,
      DetalleEndoso: change?.note || "Sin Detalles"
    },
    Riesgo:{
      TipoObjeto : InsuredObject.userData.cmbTipoObjeto,
      NombreDistrito : InsuredObject.userData.cmbMunicipio?  (Municipios.find(itm => itm.code === InsuredObject.userData.cmbMunicipio)?.name || String(InsuredObject.userData.cmbMunicipio)): "",
      Manzana : InsuredObject.userData.manzana,
      NombreEdificio : InsuredObject.userData.txtEdificios ?? "",
      Direccion :InsuredObject.userData.direccionexacta,
      NombrePais : InsuredObject.userData.cmbPais? (countries.find(itm => itm.code === InsuredObject.userData.cmbPais)?.name || String(InsuredObject.userData.cmbPais)): "",
      NombreCorregimiento : InsuredObject.userData.cmbSector ? (sectors.find(itm => itm.code === InsuredObject.userData.cmbSector)?.name || String(InsuredObject.userData.cmbSector)): "",
      NombreProvincia :InsuredObject.userData.cmbProvincia ? (procincias.find(itm => itm.code === InsuredObject.userData.cmbProvincia)?.name || String(InsuredObject.userData.cmbProvincia)): "",
      NombreBarriada : InsuredObject.userData.txtBarriadas ?? "",
      Finca : InsuredObject.userData.txtFinca,
      Rollo : InsuredObject.userData.txtRollo,
      Doc : InsuredObject.userData.txtDoc,
      Descripcion : InsuredObject.userData.Descripcion,
      Calle: InsuredObject.userData.calleoavenida ?? ""
    }
    
  };

  dataContacto.forEach(row => {

    actualizarEntidad(row, custom.Tomador);
  
    actualizarEntidad(row, custom.Asegurado, {
      identificacion: true,
      telefono: true,
      email: true
    });
    
    actualizarEntidad(row, custom.Acreedor, {
      identificacion: true,
      defaultNombre: "No Tiene"
    });
    
    actualizarEntidad(row, custom.AcreedorAnterior, {
      identificacion: true,
      defaultNombre: "No Tiene"
    });
    
    actualizarEntidad(row, custom.Productor);
    
    actualizarEntidad(row, custom.ProductorAnterior);
    
  });

  if (true) {

    let changeCoverages = [];
    let oldCoverages = [];
    if(change.jNewCoverages)
      changeCoverages = JSON.parse(change.jNewCoverages);

    if(change.jOldCoverages)
      oldCoverages = JSON.parse(change.jOldCoverages);

    const details = change.jDetail ? JSON.parse(change.jDetail) : {};
    const changeCoveragesDetails = details.Coverages ?? [];
    const endosoSinPrima = endosoNoGeneraPrima(change);

    //custom.Endoso.details = details;
    custom.Endoso.Coberturas = policy.Coverages.map(polCov => {
      const changeCov = changeCoverages.find(c => c.code == polCov.code);
      const oldChangeCov = oldCoverages.find(c => c.code == polCov.code);
      const changeCovDetail = changeCoveragesDetails.find(c => c.code == polCov.code);

      const oldLimit = oldChangeCov?.limit ?? (polCov?.limit ?? 0);
      const newLimit = changeCov?.limit ?? oldLimit;

      //Michael Delgado. GLOBUAT-66. Los endosos que no generan prima no deben mostrar nada, ni lo de la póliza      
      return {
        ...polCov,
        premiumDif: endosoSinPrima ? n(0) : (changeCovDetail ? n(changeCovDetail.premiumDif) : 0),
        limitDif: endosoSinPrima ? n(0) : n(newLimit - oldLimit)
      };
      
    });

    //Primas del cambio billDiff
    //Michael Delgado. GLOBUAT-66. Los endosos que no generan prima no deben mostrar nada, ni lo de la póliza
    custom.PrimaNetaTotal = endosoSinPrima ? n(0) : n(billDiff?.annualPremium ?? 0);
    custom.Impuesto = endosoSinPrima ? n(0) : n(billDiff?.tax ?? 0);
    custom.TotalACobrar = endosoSinPrima ? n(0) : n(billDiff?.annualTotal ?? 0);

    if(changeName == 'CancellationChange' && details){
      custom.PrimaNetaTotal = n(details.coveragesDif ?? 0);
      custom.TotalACobrar = n(details.annualPremiumDif ?? 0);
      custom.Impuesto = n(custom.TotalACobrar - custom.PrimaNetaTotal);
    }

    if(custom.Endoso.Coberturas){
      custom.Endoso.Coberturas.forEach(x => {
        x.limit = n(x.limit);
        x.premiumDif = n(x.premiumDif);
        x.deductible = endosoSinPrima ? n(0) : n(x.deductible);
      })
    };

    //Ordenamos coberturas
    custom.Endoso.Coberturas.sort((a, b) => {
      const na = Number(a.number) || 0;
      const nb = Number(b.number) || 0;
      return na - nb;
    });

    custom.Endoso.Primas = primas || {
      PrimaNeta: n(custom.PrimaNetaTotal),
      Impuesto: n(custom.Impuesto),
      Total: n(custom.TotalACobrar)
    };
  }

  return custom;
}

function getNombreCompleto(row){
  if (row.isPerson) {
    return [
      row.name || "",
      row.middlename || "",
      row.surname1 || "",
      row.surname2 || ""
    ].join(" ").trim();
  }
  
  return row.surname2 || "";
}

function getIdentificacion(row){
  return row.isPerson ? (row.cnp || "") : (row.nif || "");
}

function actualizarEntidad(row, entidad, opciones = {}) {

  if (!entidad || row.id != entidad.ContactId) 
    return;

  entidad.NombreCompleto = getNombreCompleto(row);

  if (opciones.identificacion)
    entidad.Identificacion = getIdentificacion(row);

  if (opciones.telefono)
    entidad.TelefonoContacto = row.phone || "";

  if (opciones.email){
    entidad.Email = row.email || "";
    entidad.Correo = row.email || "";
  }

  if (opciones.defaultNombre){
    entidad.NombreCompleto = entidad.NombreCompleto || opciones.defaultNombre;
  }
}

function endosoNoGeneraPrima(change) {  
    if(change.Discriminator == "CessionBeneficiaryChange" || change.Discriminator == "IntermediaryChange")
        return true;

    if(change.Discriminator == "InsuredObjectChange" && change.informative)
        return true;

  return false;
}

function generateChangeCode(change) {

  const hasValue = value => value !== null && value !== undefined && String(value).trim() !== '';

  //Si no tiene código y el endoso está confirmado le generamos uno.
  // && change?.status == "1"
  if(!hasValue(change?.code)){
    const contextChain = JSON.stringify({ changeId: change.id });    
    doCmd({cmd: "ExeChain", data: { chain: "cmdGeneraConsecutivoEndoso", context: contextChain }});
    change.code = ExeChain.outData?.code ?? "0";    
  }
  
}

function sanitizePolicy(policy) {
  // si quieres enviar policy sin "basura" muy grande al template
  return {
    id: policy.id,
    code: policy.code,
    start: policy.start,
    end: policy.end,
    currency: policy.currency,
    anualPremium: policy.anualPremium,
    tax: policy.tax,
    anualTotal: policy.anualTotal,
    Holder: policy.Holder || {},
    Payer: policy.Payer || {}
  };
}

function setDocField(docId, fieldValue) {
  doCmd({ cmd: "SetField", data: { entity: "Document", entityId: docId, fieldValue } });
}

function loadOne(entity, filter) {
  doCmd({ cmd: "LoadEntities", data: { entity, filter } });
  return (LoadEntities.outData && LoadEntities.outData[0]) || null;
}

function mapChangeName(name) {
  const base = { eventName: "Policy_Change", nombreEndoso: "Suma Asegurada" };
  switch (name) {
    case "CapitalChange": return { ...base, nombreEndoso: "Suma Asegurada" };
    case "IntermediaryChange": return { ...base, nombreEndoso: "Intermediario" };
    case "TermChange": return { ...base, nombreEndoso: "Período" };
    case "AddCoverageChange": return { ...base, nombreEndoso: "Incluir cobertura" };
    case "RemoveCoverageChange": return { ...base, nombreEndoso: "Excluir Cobertura" };
    default: return base;
  }
}

function safeJson(raw, fallback) {
  try {
    if (!raw || !String(raw).trim()) return fallback;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    return fallback;
  }
}

function normalizeDetails(d) {
  // garantiza llaves y evita undefined
  return {
    ...d,
    coveragesDif: Number(d.coveragesDif ?? d.coveragesDif ?? 0),
    coveragesdif: Number(d.coveragesDif ?? 0)
  };
}

function round2(x) { return Number(parseFloat(x || 0).toFixed(2)); }

function n(x) {
  return formatN2(x, {
    thousandSeparator: ',',
    decimalSeparator: '.',
    fallback: '0.00'
  }); 
}

function toDate(dt) {

  const d = (dt instanceof Date) ? dt : new Date(dt);
  if (isNaN(d)) return null;

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
  
  //return dt ? String(dt).substring(0, 10) : ""; 
}

function formatN2(value, options = {}) {
    const {
        thousandSeparator = '.',
        decimalSeparator = ',',
        fallback = '0,00',
        allowNegative = true
    } = options;

    if (value === null || value === undefined) return fallback;

    let normalized = value;

    if (typeof normalized === 'string') {
        normalized = normalized
            .trim()
            .replace(/\s/g, '')
            .replace(/,/g, '.'); // tolera decimal con coma
    }

    let number = Number(normalized);

    if (!Number.isFinite(number)) return fallback;
    if (!allowNegative && number < 0) return fallback;

    const isNegative = number < 0;
    number = Math.abs(number);

    // Redondeo real a 2 decimales (evita errores binarios típicos)
    number = Math.round((number + Number.EPSILON) * 100) / 100;

    let [integerPart, decimalPart] = number.toFixed(2).split('.');

    // Separador de miles manual
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

    return (isNegative ? '-' : '') + integerPart + decimalSeparator + decimalPart;
}