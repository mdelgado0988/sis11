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
const isTest = context.isTest || false;
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

const reportesEndoso = {
  incendio: {
    conPrima: 'FormatoEndosos.docx',
    sinPrima: 'FormatoEndososSinCobertura.docx'
  },
  fianza: {
    conPrima: 'FormatoEndososFianza.docx',
    sinPrima: 'FormatoEndososSinCoberturaFianza.docx'
  }
};
const { eventName, nombreEndoso } = mapChangeName(changeName);
// return change
// -----------------------------
// 2) Cargar Policy (NO borres Holder/Payer)
// -----------------------------

const dataCotizacionAsegurados = getInsureds(change.lifePolicyId)
const policy = getPolicy(change.lifePolicyId);
const InsuredObject = getInsuredObjects(change);
//return {pol: InsuredObject, change: getChangeInsuredObjects(change) }

/*
if(!policy.productCode === "1_9"){
  return;
}*/

if (!policy) throw `La póliza [${change.lifePolicyId}] no ha sido encontrada.`;

const template = seleccionarReporteEndoso(policy, change, billDiff, reportesEndoso);

const nombreRamo = getNombreRamo(policy);
const nombreProducto = getNombreProducto(policy);

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
  NombreRamo: nombreRamo,
  NombreProducto: nombreProducto,
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

//test mad:
if(isTest){
  //return billDiff;
  const arrayResult = [{ outdata: row }];
  const custom = buildCustomForTemplate({ row, policy, change, arrayResult, billDiff });
  //return custom
  calculateEndorsmentNote(change, changeName, custom, policy);
  return custom;
  //fin test mad
}

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

function getNombreRamo(policy) {
  doCmd({
    cmd: 'RepoLob',
    data: { operation: 'GET', filter: `code = '${String(policy?.lob ?? '').replace(/'/g, "''")}'` }
  });

  const ramo = RepoLob.outData?.[0];
  const nombre = String(ramo?.name ?? '').trim();
  return nombre.replace(/^\s*\d+\s*-\s*/, '').trim().toUpperCase();
}

function getNombreProducto(policy) {
  doCmd({
    cmd: 'RepoProduct',
    data: { operation: 'GET', filter: `code = '${String(policy?.productCode ?? '').replace(/'/g, "''")}'` }
  });

  const producto = RepoProduct.outData?.[0];
  const nombre = String(producto?.name ?? '').trim();
  const code = String(policy?.productCode ?? '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return nombre.replace(new RegExp(`^\\s*${code}\\s*-\\s*`, 'i'), '').trim().toUpperCase();
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

  const lob = String(policy?.lob ?? '').trim();
  const isSurety = ['81', '82', '83', '84'].includes(lob);
  const objectDefinitionCode = isSurety
    ? 'OBJFIANZA'
    : (policy?.productCode === '1_17' ? 'DTINCENDIO_SUMA' : 'DT_INCENDIO_V3');

  doCmd({
    cmd: 'RepoObjectDefinition',
    data: { operation: 'GET', filter: `code = '${objectDefinitionCode}'` }
  });
  const objectDefinitionId = RepoObjectDefinition.outData?.[0]?.id ?? 0;

  const filter = objectDefinitionId
    ? `lifePolicyId=${change.lifePolicyId} AND objectDefinitionId = ${objectDefinitionId}`
    : `lifePolicyId=${change.lifePolicyId}`;
  doCmd({
    cmd: 'RepoInsuredObject',
    data: { operation: 'GET', filter, include: ['ObjectDefinition'] }
  });

  const insuredObject = (RepoInsuredObject.outData && RepoInsuredObject.outData[0]) || null;
  return normalizeInsuredObject(insuredObject);
}

function getChangeInsuredObjects(change) {
  const newInsuredObjects = parseChangeInsuredObjects(change?.jNewInsuredObjects);
  return newInsuredObjects[0] || { userData: {} };
}

function parseChangeInsuredObjects(rawObjects) {
  const objects = safeJson(rawObjects, []);
  const list = Array.isArray(objects) ? objects : [objects];

  return list.map(object => {
    if (!object || typeof object !== 'object') return { userData: {} };

    const data = safeJson(object.jValues, object.userData || []);
    const fields = Array.isArray(data) ? data : [];
    const userData = Object.fromEntries(
      fields
        .filter(field => field && field.name)
        .map(field => [
          field.name,
          Array.isArray(field.userData) ? field.userData[0] : field.userData
        ])
    );

    return { ...object, userData };
  });
}

function getChangeInsuredObjectValues(change, propertyName) {
  const objects = parseChangeInsuredObjects(change?.[propertyName]);
  const object = objects.find(item => item && item.userData && Object.keys(item.userData).length)
    || objects[0]
    || {};
  return object.userData || {};
}

function normalizeInsuredObject(insuredObject) {
  if (!insuredObject) return { userData: {} };

  let userData = insuredObject.userData;
  if (typeof userData === 'string') {
    try { userData = JSON.parse(userData); } catch (error) { userData = {}; }
  }

  if (!userData && insuredObject.jValues) {
    try { userData = JSON.parse(insuredObject.jValues); } catch (error) { userData = {}; }
  }

  if (Array.isArray(userData)) {
    userData = Object.fromEntries(userData
      .filter(field => field && field.name)
      .map(field => [field.name, Array.isArray(field.userData) ? field.userData[0] : field.userData]));
  }

  insuredObject.userData = userData && typeof userData === 'object' ? userData : {};
  return insuredObject;
}

function isSuretyPolicy(policy) {
  return ['81', '82', '83', '84'].includes(String(policy?.lob ?? '').trim());
}

function getSuretyEndorsementFields(policy) {
  const ramo = String(policy?.lob ?? '').trim();
  const producto = String(policy?.productCode ?? '').trim().toUpperCase();
  const permiteFechaActo = (ramo === '81' && producto === '81PROPUESTA')
    || (ramo === '83' && ['PROPUESTA', 'PROP_GA', 'GPESPECIAL'].includes(producto));

  const fields = [
    { label: 'No. Contrato / No. AutoSecuestro', names: ['txtNumeroContratoFianza', 'txtNumeroContrato', 'text-1770999106315'] },
    { label: 'Valor de Garantía', names: ['valor_garantia'], numeric: true },
    { label: 'Descripción de Garantía', names: ['desc_garantia'] },
    { label: 'Descripción del Objeto Afianzado', names: ['desc_objeto_afianzado'] },
    { label: 'Estado de la Fianza', names: ['cmbEstadoFianza'] }
  ];

  if (permiteFechaActo) {
    fields.push({ label: 'Fecha Acto Público/Licitacion', names: ['f_acto_publico'], date: true });
  }

  return fields;
}

function comparisonValue(value, field) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === null || raw === undefined) return '';

  const text = String(raw).trim();
  if (field.numeric) return numericValue(text).toFixed(6);
  if (field.date) return text.substring(0, 10);
  return text;
}

function displayComparisonValue(value, field, catalogs) {
  const raw = Array.isArray(value) ? value[0] : value;
  const text = raw === null || raw === undefined ? '' : String(raw).trim();
  if (!text) return 'Sin valor';
  if (field.catalog) {
    const [catalogName, valueIndex, textIndex] = field.catalog;
    return catalogText(catalogs?.[catalogName], text, valueIndex, textIndex);
  }
  return field.numeric ? n(numericValue(text)) : text;
}

function buildSuretyInsuredObjectChangeNote(change, policy, catalogs) {
  const oldValues = getChangeInsuredObjectValues(change, 'jOldInsuredObjects');
  const newValues = getChangeInsuredObjectValues(change, 'jNewInsuredObjects');

  const changes = getSuretyEndorsementFields(policy)
    .filter(field => {
      const oldValue = field.names.map(name => oldValues?.[name]).find(value => value !== undefined);
      const newValue = field.names.map(name => newValues?.[name]).find(value => value !== undefined);
      return comparisonValue(oldValue, field) !== comparisonValue(newValue, field);
    })
    .map(field => {
      const oldValue = field.names.map(name => oldValues?.[name]).find(value => value !== undefined);
      const newValue = field.names.map(name => newValues?.[name]).find(value => value !== undefined);
      return `${field.label}: ${displayComparisonValue(oldValue, field, catalogs)} => ${displayComparisonValue(newValue, field, catalogs)}`;
    })
    .join(', ');

  return changes ? `Cambios: ${changes}` : '';
}

function numericValue(value) {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasEndorsementPremium(billDiff, change) {
  const premiumValues = [
    billDiff?.annualPremium,
    billDiff?.coverages,
    billDiff?.premium,
    change?.annualPremium,
    change?.premium
  ];

  return premiumValues.some(value => Math.abs(numericValue(value)) > 0.000001);
}

function seleccionarReporteEndoso(policy, change, billDiff, reportes) {
  if (!isSuretyPolicy(policy)) {
    return change.Discriminator === "LoadingChange"
      ? reportes.incendio.sinPrima
      : reportes.incendio.conPrima;
  }

  return hasEndorsementPremium(billDiff, change)
    ? reportes.fianza.conPrima
    : reportes.fianza.sinPrima;
}

function suretyValue(userData, names) {
  for (const name of names) {
    const rawValue = userData?.[name];
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}

function loadSuretyCatalog(table) {
  doCmd({ cmd: 'GetFullTable', data: { table } });
  const result = typeof GetFullTable !== 'undefined' ? GetFullTable : null;
  return result?.ok && Array.isArray(result.outData) ? result.outData : [];
}

function catalogText(rows, value, valueIndex, textIndex) {
  const code = String(value ?? '').trim();
  if (!code || !Array.isArray(rows)) return code;

  const row = rows.slice(1).find(item => String(item?.[valueIndex] ?? '').trim() === code);
  return row?.[textIndex] ?? code;
}

function loadSuretyCatalogs() {
  return {
    claseRiesgo: loadSuretyCatalog('actividadfianza'),
    actividad: loadSuretyCatalog('tbMaActivi'),
    tipoVigencia: loadSuretyCatalog('tipovigencia'),
    vigenciaFianza: loadSuretyCatalog('vigenciafianza'),
    tipoLicitacion: loadSuretyCatalog('tipolicitacion')
  };
}

function buildSuretyRisk(userData, catalogs) {
  const data = userData || {};
  const numeroLicitacion = suretyValue(data, ['n_licitacion']);
  const lookup = catalogs || {};
  return {
    NombreAFavor: suretyValue(data, ['nombre']),
    CodigoSIS: suretyValue(data, ['rut', 'contacto_ruc']),
    Secuestrante: suretyValue(data, ['secuestrante']),
    VigenciaFianza: catalogText(lookup.vigenciaFianza, suretyValue(data, ['vigencia_fianza']), 0, 1),
    OrdenDeProceder: suretyValue(data, ['orden_de_proceder']),
    NumeroContrato: suretyValue(data, ['txtNumeroContrato', 'text-1770999106315']),
    ActoPublico: suretyValue(data, ['n_acto_publico']),
    SolicitudPrecio: suretyValue(data, ['n_sol_precio']),
    Licitacion: numeroLicitacion,
    NumeroLicitacion: numeroLicitacion,
    OrdenCompra: suretyValue(data, ['n_oc']),
    ClaseRiesgo: catalogText(lookup.claseRiesgo, suretyValue(data, ['clase_riesgo']), 0, 1),
    TipoLicitacion: catalogText(lookup.tipoLicitacion, suretyValue(data, ['tipo_licitacion']), 0, 1),
    CompraMenor: suretyValue(data, ['n_compra_menor']),
    RefrendoDeclaracion: suretyValue(data, ['n_contrato']),
    NumeroProyecto: suretyValue(data, ['n_proyecto']),
    FechaActoPublico: suretyValue(data, ['f_acto_publico']),
    Actividad: catalogText(lookup.actividad, suretyValue(data, ['actividad']), 1, 3),
    TipoVigencia: catalogText(lookup.tipoVigencia, suretyValue(data, ['tipo_vigencia']), 0, 1),
    TipoCalendario: catalogText(lookup.tipoVigencia, suretyValue(data, ['tipo_calendario']), 0, 1),
    DiasVigencia: suretyValue(data, ['txtDiasVigencia']),
    SumaAfianzada: suretyValue(data, ['suma_afianzada']),
    ValorGarantia: suretyValue(data, ['valor_garantia']),
    DescripcionObjetoAfianzado: suretyValue(data, ['desc_objeto_afianzado']),
    Observaciones: suretyValue(data, ['observaciones']),
    DescripcionGarantia: suretyValue(data, ['desc_garantia']),
    DescripcionEndoso: suretyValue(data, ['desc_endoso']),
    // Alias utilizado por plantillas que esperan una descripcion generica.
    Descripcion: suretyValue(data, ['desc_objeto_afianzado'])
  };
}

function buildFireRisk(userData, countries, sectors, procincias, Municipios) {
  const data = userData || {};
  return {
    TipoObjeto: data.cmbTipoObjeto,
    NombreDistrito: data.cmbMunicipio
      ? (Municipios.find(itm => itm.code === data.cmbMunicipio)?.name || String(data.cmbMunicipio))
      : '',
    Manzana: data.manzana,
    NombreEdificio: data.txtEdificios ?? '',
    Direccion: data.direccionexacta,
    NombrePais: data.cmbPais
      ? (countries.find(itm => itm.code === data.cmbPais)?.name || String(data.cmbPais))
      : '',
    NombreCorregimiento: data.cmbSector
      ? (sectors.find(itm => itm.code === data.cmbSector)?.name || String(data.cmbSector))
      : '',
    NombreProvincia: data.cmbProvincia
      ? (procincias.find(itm => itm.code === data.cmbProvincia)?.name || String(data.cmbProvincia))
      : '',
    NombreBarriada: data.txtBarriadas ?? '',
    Finca: data.txtFinca,
    Rollo: data.txtRollo,
    Doc: data.txtDoc,
    Descripcion: data.Descripcion,
    Calle: data.calleoavenida ?? ''
  };
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
  const currentNote = String(custom?.Endoso?.DetalleEndoso ?? '').trim();
  if (currentNote && currentNote !== "Sin Detalles")
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

  if (changeName === "InsuredObjectChange" && isSuretyPolicy(policy)) {
    const insuredObjectNote = buildSuretyInsuredObjectChangeNote(change, policy, loadSuretyCatalogs());
    if (insuredObjectNote) custom.Endoso.DetalleEndoso = insuredObjectNote;
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
  const insuredData = InsuredObject.userData || {};
  const suretyCatalogs = isSuretyPolicy(policy) ? loadSuretyCatalogs() : null;
  const riesgo = isSuretyPolicy(policy)
    ? buildSuretyRisk(insuredData, suretyCatalogs)
    : buildFireRisk(insuredData, countries, sectors, procincias, Municipios);

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
  
  const parseUtcDate = (fecha) => {
    if (fecha instanceof Date) {
      return isNaN(fecha.getTime()) ? null : fecha;
    }

    const value = String(fecha || '').trim();
    if (!value) return null;

    // Las fechas de póliza llegan en UTC. Si no traen indicador de zona,
    // se agrega Z para evitar que el servidor las interprete como locales.
    const hasTimeZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
    const d = new Date(hasTimeZone ? value : `${value}Z`);
    return isNaN(d.getTime()) ? null : d;
  };

  const getHora = (fecha) => {
    const d = parseUtcDate(fecha);
    if (!d) return null;

    // Panamá permanece en UTC-5; se ajusta manualmente para no depender de
    // APIs de internacionalización ni de la zona horaria del servidor.
    const panamaDate = new Date(d.getTime() - (5 * 60 * 60 * 1000));
    const hour24 = panamaDate.getUTCHours();
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    const hh = String(hour12).padStart(2, '0');
    const mm = String(panamaDate.getUTCMinutes()).padStart(2, '0');
    const ss = String(panamaDate.getUTCSeconds()).padStart(2, '0');

    return `${hh}:${mm}:${ss} ${period}`;
  };

  const getFechaImpresion = (fecha = new Date()) => {
    const d = parseUtcDate(fecha);
    if (!d) return null;

    // Change.created llega en UTC; la fecha impresa debe corresponder a Panamá.
    const panamaDate = new Date(d.getTime() - (5 * 60 * 60 * 1000));
    const dd = String(panamaDate.getUTCDate()).padStart(2, '0');
    const mm = String(panamaDate.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = panamaDate.getUTCFullYear();
  
    return `${dd}/${mm}/${yyyy}`;
  };

  // Base custom
  const custom = {
    Aseguradora: { NombreSocial: "GLOBAL ASEGURADORA S.A." },
    code: policy?.code || "",
    NombreRamo: row.NombreRamo || "",
    NombreProducto: row.NombreProducto || "",

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

    FechaInicioVigencia: toDate(policy?.start),
    FechaFinVigencia: toDate(policy?.end),
    HoraVigencia: "12:00 AM",
    FechaEfectiva: getFechaImpresion(change?.effectiveDate),
    FechaImpresion: getFechaImpresion(change?.created),

    PrimaNetaTotal: n(policy?.anualPremium),
    Impuesto: n(policy?.tax),
    TotalACobrar: n(policy?.anualTotal),

    Endoso: {
      Id: change?.code ?? "0",
      Nombre: row.nombreEndoso,
      DetalleEndoso: change?.note || "Sin Detalles"
    },
    Riesgo: riesgo
    
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
      let newLimit = changeCov?.limit ?? oldLimit;

      let primaDiff = (changeCovDetail ? n(changeCovDetail.premiumDif) : 0);
      /*if(changeName == 'CancellationChange'){
        primaDiff = (changeCovDetail ? n(changeCovDetail.premiumCost) : 0);
        newLimit = 0;
      }*/

      //Michael Delgado. GLOBUAT-66. Los endosos que no generan prima no deben mostrar nada, ni lo de la póliza      
      return {
        ...polCov,
        premiumDif: endosoSinPrima ? n(0) : primaDiff,
        limitDif: endosoSinPrima ? n(0) : n(newLimit - oldLimit)
      };
      
    });

    //Primas del cambio billDiff
    //Michael Delgado. GLOBUAT-66. Los endosos que no generan prima no deben mostrar nada, ni lo de la póliza
    custom.PrimaNetaTotal = endosoSinPrima ? n(0) : n(billDiff?.annualPremium ?? 0);
    custom.Impuesto = endosoSinPrima ? n(0) : n(billDiff?.tax ?? 0);
    custom.TotalACobrar = endosoSinPrima ? n(0) : n(billDiff?.annualTotal ?? 0);

    if(changeName == 'CancellationChange' && details){
      const primaNetaTotal = details.coveragesDif ?? 0;
      const totalCobro = details.annualPremiumDif ?? 0;
      custom.PrimaNetaTotal = n(primaNetaTotal); //n(details.coveragesDif ?? 0);
      custom.TotalACobrar = n(totalCobro);
      custom.Impuesto = n((totalCobro - primaNetaTotal));
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

    let number = parseNumericLike(value);

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

function parseNumericLike(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number(value);

  let normalized = value.trim().replace(/\s/g, "");
  if (!normalized) return NaN;

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (lastDot >= 0) {
    normalized = normalized.replace(/,/g, "");
  }

  return Number(normalized);
}
