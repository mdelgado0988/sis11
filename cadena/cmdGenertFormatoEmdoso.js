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
    sinPrima: 'FormatoEndososSinCoberturaFianza.docx',
    ordenProceder: 'EndosoOrdenProcederFianza.docx',
    cambioSuma: 'EndosoCambioSumaFianza.docx',
    cambioVigencia: 'EndosoCambioVigenciaFianza.docx'
  },
  vida: {
    conPrima: 'FormatoEndososVida.docx',
    sinPrima: 'FormatoEndososSinCoberturaVida.docx'
  },
  ramoTecnico: {
    conPrima: 'FormatoEndososRT.docx',
    sinPrima: 'FormatoEndososSinCoberturaRT.docx'
  },
  vidaTarjetaProtegida: 'FormatoEndososVidaTarjetaProtegida.docx'
  
};
const reporteCambioBeneficiarioVida = 'FormatoEndososCambioBeneficiario.docx';
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

const beneficiaryDocumentPlan = getBeneficiaryDocumentPlan(change);
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
  calculateEndorsmentNote(change, changeName, custom, policy);
  if (esCambioBeneficiarioVida(policy, beneficiaryDocumentPlan)) {
    return {
      template: reporteCambioBeneficiarioVida,
      data: datosCambioBeneficiarioVida(
        buildBeneficiaryTemplateData(policy.id, beneficiaryDocumentPlan.beneficiaryUserData),
        custom
      )
    };
  }
  if (beneficiaryDocumentPlan.hasBeneficiary) {
    const beneficiaryData = buildBeneficiaryTemplateData(policy.id, beneficiaryDocumentPlan.beneficiaryUserData);
    return beneficiaryDocumentPlan.hasOtherObjects
      ? {
        normal: { template, data: custom },
        beneficiaries: { template: 'Sub_Beneficiarios.docx', data: beneficiaryData }
      }
      : { template: 'Sub_Beneficiarios.docx', data: beneficiaryData };
  }
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
  if (isSuretyPolicy(policy)) {
    const beneficiaryId = Number(InsuredObject?.userData?.contactid || InsuredObject?.userData?.cci_rif_afavor || 0);
    if (beneficiaryId > 0 && !xContactsFilterArray.includes(beneficiaryId)) {
      xContactsFilterArray.push(beneficiaryId);
    }
  }
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
  const objectDefinitionCode = isAutoPolicy(policy)
    ? 'DTAUT'
    : isTechnicalPolicy(policy)
    ? 'DT_RAMO_TECNICO'
    : isLifePolicyLob(lob)
    ? 'DT_ACCIDENTES_V1'
    : isSurety
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

    const data = safeJson(object.jValues || object.userData, {});
    const userData = Array.isArray(data)
      ? Object.fromEntries(data
        .filter(field => field && field.name)
        .map(field => [
          field.name,
          Array.isArray(field.userData) ? field.userData[0] : field.userData
        ]))
      : data && typeof data === 'object' ? data : {};

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

function getBeneficiaryDocumentPlan(change) {
  if (changeName !== 'InsuredObjectChange') {
    return { hasBeneficiary: false, hasOtherObjects: false };
  }

  const newObjects = parseChangeInsuredObjects(change?.jNewInsuredObjects)
    .filter(item => item && Object.keys(item).length);
  const objects = newObjects.length ? newObjects : parseChangeInsuredObjects(change?.jOldInsuredObjects)
    .filter(item => item && Object.keys(item).length);

  if (!objects.length) {
    return { hasBeneficiary: false, hasOtherObjects: false };
  }

  doCmd({
    cmd: 'RepoObjectDefinition',
    data: { operation: 'GET', filter: "code = 'BENEFICIARIOS_VIDA'" }
  });

  const beneficiaryDefinitionId = String(RepoObjectDefinition.outData?.[0]?.id ?? '');
  const beneficiaryCode = 'BENEFICIARIOS_VIDA';
  const definitionCode = object => String(
    object?.ObjectDefinition?.code ?? object?.objectDefinitionCode ?? object?.definitionCode ?? ''
  ).trim().toUpperCase();
  const definitionId = object => String(
    object?.objectDefinitionId ?? object?.ObjectDefinitionId ?? ''
  ).trim();
  const isBeneficiary = object => definitionCode(object) === beneficiaryCode
    || (!!beneficiaryDefinitionId && definitionId(object) === beneficiaryDefinitionId);
  const beneficiaryObject = objects.find(isBeneficiary);

  return {
    hasBeneficiary: !!beneficiaryObject,
    hasOtherObjects: objects.some(object => !isBeneficiary(object)),
    beneficiaryUserData: beneficiaryObject?.userData || {}
  };
}

function esCambioBeneficiarioVida(policy, plan) {
  return isLifePolicyLob(policy?.lob) && !!plan?.hasBeneficiary;
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

function isTechnicalPolicy(policy) {
  return ['96', '52'].includes(String(policy?.lob ?? '').trim());
}

function isAutoPolicy(policy) {
  return String(policy?.lob ?? '').trim() === '6';
}

function getTipoAsegurado(policy) {
  const lob = String(policy?.lob ?? '').trim();
  const productCode = String(policy?.productCode ?? '').trim().toUpperCase();

  return lob === '96' && productCode === 'MQ'
    ? 'Operado por:'
    : 'Asegurado:';
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

function tipoCambioCobertura(change) {
  const discriminator = String(change?.Discriminator || '').trim().toUpperCase();
  const additional = safeJson(change?.jAdditional, {}) || {};
  const endorsementType = String(additional?.endorsementType || '').trim().toUpperCase();
  return { discriminator, endorsementType };
}

function esCambioCobertura(change) {
  const type = tipoCambioCobertura(change);
  return type.discriminator === 'ADDCOVERAGECHANGE'
    || type.discriminator === 'REMOVECOVERAGECHANGE'
    || type.discriminator === 'CHANGEADDCOVERAGE'
    || type.discriminator === 'CHANGEREMOVECOVERAGE'
    || type.endorsementType === 'INCLUSIONCOBERTURA'
    || type.endorsementType === 'EXCLUSIONCOBERTURA';
}

function esExclusionCobertura(change) {
  const type = tipoCambioCobertura(change);
  return type.discriminator === 'REMOVECOVERAGECHANGE'
    || type.discriminator === 'CHANGEREMOVECOVERAGE'
    || type.endorsementType === 'EXCLUSIONCOBERTURA';
}

function seleccionarReporteEndoso(policy, change, billDiff, reportes) {
  if (esEndosoTarjetaProtegida(change)) {
    return reportes.vidaTarjetaProtegida;
  }

  const autoChangeType = tipoCambioCobertura(change);
  const esCambioSumaAuto = isAutoPolicy(policy) && (
    autoChangeType.discriminator === 'CAPITALCHANGE'
    || (
      ['COVERAGECHANGE', 'CHANGECOVERAGE'].includes(autoChangeType.discriminator)
      && autoChangeType.endorsementType === 'CHANGE_INSURED_SUM_SURETY'
    )
  );

  if (esCambioSumaAuto) {
    return 'AdendoAumentoAUTO.docx';
  }

  // Los cambios de coberturas deben usar siempre el formato con la seccion
  // de coberturas, aunque el movimiento no genere prima.
  const esCambioCoberturaActual = esCambioCobertura(change);

  if (isLifePolicyLob(policy?.lob)) {
    return esCambioCoberturaActual || hasEndorsementPremium(billDiff, change)
      ? reportes.vida.conPrima
      : reportes.vida.sinPrima;
  }

  if (isTechnicalPolicy(policy)) {
    return esCambioCoberturaActual || hasEndorsementPremium(billDiff, change)
      ? reportes.ramoTecnico.conPrima
      : reportes.ramoTecnico.sinPrima;
  }

  const endorsementType = tipoCambioCobertura(change).endorsementType;
  if (isSuretyPolicy(policy) && endorsementType === 'PROCEEDORDER') {
    return reportes.fianza.ordenProceder;
  }
  if (isSuretyPolicy(policy) && endorsementType === 'CHANGE_INSURED_SUM_SURETY') {
    return reportes.fianza.cambioSuma;
  }
  if (isSuretyPolicy(policy) && endorsementType === 'CHANGE_COVERAGE_SURETY') {
    return reportes.fianza.cambioVigencia;
  }

  if (!isSuretyPolicy(policy)) {
    return change.Discriminator === "LoadingChange" && !esCambioCoberturaActual
      ? reportes.incendio.sinPrima
      : reportes.incendio.conPrima;
  }

  return esCambioCoberturaActual || hasEndorsementPremium(billDiff, change)
    ? reportes.fianza.conPrima
    : reportes.fianza.sinPrima;
}

function esEndosoTarjetaProtegida(change) {
  const additional = safeJson(change?.jAdditional, {});
  const tipo = String(additional?.endorsementType ?? '').trim().toUpperCase();
  const esCambioCapital = change?.Discriminator === 'CapitalChange'
    || change?.Discriminator === 'ChangePolicyCapital'
    || change?.action === 'ChangePolicyCapital';
  return esCambioCapital && tipo === 'CHANGE_PROTECTED_CARD';
}

function isLifePolicyLob(lob) {
  return ['20', '31', '71'].includes(String(lob ?? '').trim());
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

function repoCatalogText(rows, value) {
  const code = String(value ?? '').trim();
  if (!code || !Array.isArray(rows)) return code;

  const row = rows.find(item => String(item?.code ?? item?.id ?? '').trim() === code);
  return row?.name ?? code;
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

function loadLifeCatalogs() {
  return {
    actividad: loadSuretyCatalog('actividad'),
    tipoPrestamo: loadSuretyCatalog('tbTipoPrestamo'),
    producto: loadSuretyCatalog('tbProductoVida')
  };
}

function loadTechnicalCatalogs() {
  return {
    actividad: loadSuretyCatalog('actividad'),
    zonaCresta: loadSuretyCatalog('ZonaCresta'),
    usoBien: loadSuretyCatalog('TablaUsoBien'),
    marcas: loadSuretyCatalog('tbMarcas'),
    categorias: loadSuretyCatalog('tbCategoriaMaquinaria'),
    modelos: loadSuretyCatalog('tbModelos')
  };
}

function buildLifeRisk(userData, catalogs) {
  const data = userData || {};
  const lookup = catalogs || {};
  const profesionAltoRiesgo = suretyValue(data, ['chkProfesionAltoRiesgo']);

  const monedas = {
    USD: 'Dólar Estadounidense',
    PAB: 'Balboa'
  };

  const renovaciones = {
    'Sin Accion': 'Sin Accion',
    'Aviso Vto.': 'Aviso Vto.',
    'Lista Renovar': 'Lista Renovar',
    'No Renovar': 'No Renovar',
    'Renovada': 'Renovada',
    'Procesando': 'Procesando',
    'NR: Alta Siniestralidad': 'NR: Alta Siniestralidad',
    'NR: Riesgo Agravado': 'NR: Riesgo Agravado',
    'NR: Renuncia Colaborador': 'NR: Renuncia Colaborador',
    'NR: Póliza Financiada': 'NR: Póliza Financiada'
  };

  return {
    EdadSuscripcion: suretyValue(data, ['txtEdadSuscripcion']),
    SumaAsegurada: suretyValue(data, ['txtSumaAsegurada']),
    SumaReExcedente: suretyValue(data, ['txtSumaExcedente']),
    NoCobis: suretyValue(data, ['txtNoCobis']),
    Altura: suretyValue(data, ['txtAltura']),
    Peso: suretyValue(data, ['txtPeso']),
    Ocupacion: catalogText(lookup.actividad, suretyValue(data, ['cmbOcupacion']), 0, 1),
    CodigoOcupacion: suretyValue(data, ['cmbOcupacion']),
    CategoriaOcupacion: suretyValue(data, ['CodigoCategoriaActividad']),
    MonedaSalario: monedas[suretyValue(data, ['cmbMonedaSalario'])]
      || suretyValue(data, ['cmbMonedaSalario']),
    Salario: suretyValue(data, ['txtSalario']),
    ProfesionAltoRiesgo: ['1', 'true', 'si', 'sí'].includes(String(profesionAltoRiesgo).trim().toLowerCase()) ? 'Sí' : 'No',
    NoPrestamo: suretyValue(data, ['txtNoPrestamo']),
    TipoPrestamo: catalogText(lookup.tipoPrestamo, suretyValue(data, ['cmbTipoPrestamo']), 0, 1),
    CodigoTipoPrestamo: suretyValue(data, ['cmbTipoPrestamo']),
    PolizaCobis: suretyValue(data, ['txtPolizaCobis']),
    Producto: catalogText(lookup.producto, suretyValue(data, ['cmbProducto']), 0, 1),
    CodigoProducto: suretyValue(data, ['cmbProducto']),
    Observaciones: suretyValue(data, ['txtObservaciones']),
    EstadoRenovacion: renovaciones[suretyValue(data, ['cmbRenovacion'])]
      || suretyValue(data, ['cmbRenovacion']),
    MotivoRenovacion: suretyValue(data, ['txtMotivoRenovacion'])
  };
}

function buildTechnicalRisk(userData, catalogs, countries, provinces) {
  const data = userData || {};
  const lookup = catalogs || {};
  const value = name => suretyValue(data, [name]);
  const countryCode = value('cmbPais');
  const provinceCode = value('cmbProvincia');

  return {
    // Conserva todos los datos originales del objeto para que las plantillas
    // puedan consumir cualquier campo adicional sin perder información.
    ...data,

    Actividad: catalogText(lookup.actividad, value('cmbActividadEconomica'), 0, 1),
    CodigoActividadEconomica: value('cmbActividadEconomica'),
    CodigoProyecto: value('txtCodigoProyecto'),
    NumeroProyecto: value('txtCodigoProyecto'),
    PeriodoPrueba: value('txtPeriodoPrueba'),
    SumaAsegurada: value('txtSA'),
    SumaAfianzada: value('txtSA'),
    UsoBien: catalogText(lookup.usoBien, value('cmbUsoBien'), 0, 1),
    CodigoUsoBien: value('cmbUsoBien'),
    PeriodoMantenimiento: value('txtPeriodoMantenimiento'),
    Pais: repoCatalogText(countries, countryCode),
    CodigoPais: countryCode,
    Provincia: repoCatalogText(provinces, provinceCode),
    CodigoProvincia: provinceCode,
    ZonaCresta: catalogText(lookup.zonaCresta, value('cmbZonaCresta'), 0, 1),
    CodigoZonaCresta: value('cmbZonaCresta'),
    OrdenProceder: value('ckOrdenProceder'),
    Descripcion: value('txtDescripcion'),
    DescripcionObjeto: value('txtDescripcion'),
    Localizacion: value('txtLocalizacion'),
    Proyecto: value('txtProyecto'),
    Categoria: catalogText(lookup.categorias, value('cmbCategoria'), 0, 1),
    CodigoCategoria: value('cmbCategoria'),
    Marca: catalogText(lookup.marcas, value('cmbMarca'), 1, 2),
    CodigoMarca: value('cmbMarca'),
    Modelo: catalogText(lookup.modelos, value('cmbModelo'), 2, 3),
    CodigoModelo: value('cmbModelo'),
    Anio: value('txAnio'),
    Serie: value('txtSerie'),
    Tipo: value('txtTipo'),
    PropiedadEquipo: value('txtPropietario'),
    Cantidad: value('txtCantidad'),
    EstadoRenovacion: value('cmbRenovacion'),
    MotivoRenovacion: value('txtMotivoRenovacion'),

    // Alias utilizados por las plantillas RT actuales.
    NombreAFavor: value('txtPropietario'),
    ClaseRiesgo: catalogText(lookup.zonaCresta, value('cmbZonaCresta'), 0, 1),
    FechaActoPublico: value('txtPeriodoPrueba'),
    NumeroLicitacion: value('txtPeriodoMantenimiento'),
    NumeroContrato: value('txtSerie'),
    ActoPublico: value('ckOrdenProceder')
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
  const olCapital = change.oldCapital ?? change.olCapital ?? (policy.insuredSum ?? 0);
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

  if (esCambioBeneficiarioVida(policy, beneficiaryDocumentPlan)) {
    custom.Endoso.DetalleEndoso = "Modificación de Beneficiarios";
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
    ChangeAddCoverage: "Inclusión de Cobertura",
    ChangeRemoveCoverage: "Exclusión de Cobertura",
    BeneficiaryChange: "Cambio de Beneficiario",
    PayPlanChange: "Cambio de Plan de Pago",
    CoverageChangeTechData: "Cambio de Cobertura Técnica",
    ClauseChange: "Cambio de Cláusulas",
    ExclusionChange: "Cambio de Exclusiones",
    LoadingChange: "Cambio de Recargos/Descuentos"
  };

  return map[discriminator] || discriminator;
}

function getEndorsementTitleForChange(change) {
  const additional = safeJson(change && change.jAdditional, {}) || {};
  const endorsementType = String(additional.endorsementType || '').trim().toUpperCase();
  const titlesByType = {
    CHANGE_COVERAGE_SURETY: 'Cambio de Vigencia de Cobertura',
    CHANGE_INSURED_SUM_SURETY: 'Cambio de Suma de Cobertura',
    PROCEEDORDER: 'Orden de proceder'
  };

  return titlesByType[endorsementType] || getEndorsmentTitle(change && change.Discriminator);
}

function generateDocWithCustom({ row, policy, change, billDiff }) {
  const arrayResult = [{ outdata: row }];

  const custom = buildCustomForTemplate({ row, policy, change, arrayResult, billDiff });
  custom.TituloEndosoCan = getEndorsementTitleForChange(change);
  custom.TituloEndosoCanEfectiva= '';
  custom.TituloCanceFecha= '';
  
  if(change.Discriminator == "CancellationChange"){
    custom.TituloEndosoCanEfectiva  = 'Cancelación Efectiva';
    custom.TituloCanceFecha  = `Desde: ${toDate(change.effectiveDate)}`;
  }

  calculateEndorsmentNote(change, changeName, custom, policy);

  const isLifeBeneficiaryChange = esCambioBeneficiarioVida(policy, beneficiaryDocumentPlan);
  const templates = isLifeBeneficiaryChange
    ? [reporteCambioBeneficiarioVida]
    : beneficiaryDocumentPlan.hasBeneficiary
    ? (beneficiaryDocumentPlan.hasOtherObjects
      ? [template, 'Sub_Beneficiarios.docx']
      : ['Sub_Beneficiarios.docx'])
    : [template];

  const messages = templates.map(templateName => {
    const isLifeBeneficiaryTemplate = templateName === reporteCambioBeneficiarioVida;
    const isBeneficiaryTemplate = templateName === 'Sub_Beneficiarios.docx' || isLifeBeneficiaryTemplate;
    const beneficiaryData = isBeneficiaryTemplate
      ? incluirEndosoEnDatosBeneficiarios(
        buildBeneficiaryTemplateData(policy.id, beneficiaryDocumentPlan.beneficiaryUserData),
        custom
      ) : null;
    const documentData = isLifeBeneficiaryTemplate
      ? beneficiaryData.custom
      : (beneficiaryData || custom);
    const documentTitle = isBeneficiaryTemplate
      ? 'Endoso de Beneficiarios'
      : 'Endoso de ' + custom.TituloEndosoCan;
    return generateEndorsementDocument(templateName, documentData, policy.id, documentTitle,
      isBeneficiaryTemplate ? 'Documento de Endoso de Beneficiarios' : 'Documento de ' + custom.TituloEndosoCan);
  });

  return messages.filter(Boolean).join(' | ') || 'OK';
}

function buildBeneficiaryTemplateData(policyId, beneficiariesUserData) {
  doCmd({
    cmd: 'ExeChain',
    data: {
      chain: 'cmdDocumentoVidaDTO',
      context: JSON.stringify({ policyId, beneficiariesUserData: beneficiariesUserData || {} })
    }
  });

  if (!ExeChain.ok || !ExeChain.outData) {
    throw new Error(ExeChain.msg || 'No fue posible obtener los datos de beneficiarios.');
  }

  return {
    custom: applyChangedBeneficiaries(ExeChain.outData, beneficiariesUserData)
  };
}

function loadAutoCatalogs() {
  return {
    marcas: loadSuretyCatalog('tbMarcas'),
    modelos: loadSuretyCatalog('tbModelos'),
    tipos: loadSuretyCatalog('tblTipoPorRamo'),
    usos: loadSuretyCatalog('tblUsoPorRamo')
  };
}

function autoCatalogText(rows, value, valueIndex, textIndex, predicate) {
  const code = String(value ?? '').trim();
  if (!code || !Array.isArray(rows)) return code;

  const row = rows.slice(1).find(item => {
    if (!Array.isArray(item)) return false;
    return String(item[valueIndex] ?? '').trim() === code
      && (!predicate || predicate(item));
  });

  return String(row?.[textIndex] ?? code).trim();
}

function buildAutoRisk(userData, catalogs, policy) {
  const data = userData || {};
  const lookup = catalogs || {};
  const lob = String(policy?.lob ?? '').trim();
  const marca = suretyValue(data, ['cmbMarca']);
  const modelo = suretyValue(data, ['cmbModelo']);
  const tipo = suretyValue(data, ['cmbtipo', 'txtTipo']);
  const uso = suretyValue(data, ['cmbUsoAuto', 'txtUsoAuto']);

  return {
    ...data,
    Marca: autoCatalogText(lookup.marcas, marca, 1, 2),
    CodigoMarca: marca,
    Modelo: autoCatalogText(
      lookup.modelos,
      modelo,
      2,
      3,
      row => String(row[0] ?? '').trim() === lob
        && String(row[1] ?? '').trim() === String(marca).trim()
    ),
    CodigoModelo: modelo,
    Anio: suretyValue(data, ['txtAnioAuto']),
    Color: suretyValue(data, ['txtColorAuto']),
    Chasis: suretyValue(data, ['tbseriechasis']),
    VIN: suretyValue(data, ['tbVIN']),
    Motor: suretyValue(data, ['tbseriemotor']),
    Tipo: autoCatalogText(
      lookup.tipos,
      tipo,
      1,
      2,
      row => String(row[0] ?? '').trim() === lob
    ),
    CodigoTipo: tipo,
    Uso: autoCatalogText(
      lookup.usos,
      uso,
      1,
      2,
      row => String(row[0] ?? '').trim() === lob
    ),
    CodigoUso: uso,
    Capacidad: suretyValue(data, ['txtPuestosAuto']),
    Placa: suretyValue(data, ['tbplaca']),
    SumaAsegurada: suretyValue(data, ['txtSA'])
  };
}

function incluirEndosoEnDatosBeneficiarios(beneficiaryData, custom) {
  const beneficiaryDto = beneficiaryData?.custom || {};
  return {
    ...beneficiaryData,
    custom: {
      ...beneficiaryDto,
      // El DTO del endoso conserva los objetos anidados que usan las plantillas.
      ...custom,
      Beneficiarios: beneficiaryDto.Beneficiarios || [],
      TotalPorcentajeBeneficiarios: beneficiaryDto.TotalPorcentajeBeneficiarios || n(0),
      // El detalle del endoso se construye en el DTO base y debe prevalecer.
      Endoso: custom?.Endoso || beneficiaryDto.Endoso || {}
    }
  };
}

function datosCambioBeneficiarioVida(beneficiaryData, custom) {
  return incluirEndosoEnDatosBeneficiarios(beneficiaryData, custom).custom;
}

function buildSuretyDocumentData({ policy, change, insuredData, holder, contacts, countries, provinces, cities, sectors }) {
  const data = insuredData || {};
  const allContacts = Array.isArray(contacts) ? contacts : [];
  const contactById = id => allContacts.find(contact => Number(contact.id) === Number(id));
  const holderData = contactById(policy.holderId) || holder || {};
  const seller = contactById(policy.sellerId) || {};
  const beneficiary = contactById(data.contactid || data.cci_rif_afavor) || {};
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dateParts = value => {
    const raw = String(value || '').trim();
    const date = raw ? new Date(/\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T12:00:00Z' : raw) : null;
    if (!date || Number.isNaN(date.getTime())) return { day: '', month: 1, year: '' };
    const panama = new Date(date.getTime() - (5 * 60 * 60 * 1000));
    return { day: panama.getUTCDate(), month: panama.getUTCMonth() + 1, year: panama.getUTCFullYear() };
  };
  const formatDate = value => {
    const parts = dateParts(value);
    return parts.year ? String(parts.day).padStart(2, '0') + '/' + String(parts.month).padStart(2, '0') + '/' + parts.year : '';
  };
  const fullName = contact => contact?.isPerson === false
    ? String(contact?.surname2 || contact?.name || '').trim()
    : [contact?.name, contact?.middlename, contact?.surname1, contact?.surname2].filter(Boolean).join(' ').trim();
  const phoneByType = (list, type) => (Array.isArray(list) ? list.find(item => item?.type === type) : null)?.num || '';
  const address = Array.isArray(holderData.Addresses) ? holderData.Addresses[0] || {} : {};
  const start = dateParts(policy.start);
  const end = dateParts(policy.end);
  const today = dateParts(new Date());
  const endPlusThirty = new Date(String(policy.end || '').slice(0, 10) + 'T12:00:00Z');
  if (!Number.isNaN(endPlusThirty.getTime())) endPlusThirty.setUTCDate(endPlusThirty.getUTCDate() + 30);
  const endPlusThirtyParts = dateParts(endPlusThirty);
  const policyDays = start.year && end.year
    ? Math.round((new Date(String(policy.end).slice(0, 10) + 'T12:00:00Z') - new Date(String(policy.start).slice(0, 10) + 'T12:00:00Z')) / 86400000)
    : 0;
  const vigencia = suretyVigenciaText(policyDays, suretyValue(data, ['tipo_calendario']));
  const nuevaVigenciaTexto = suretyChangedCoverageTerm(change, months, dateParts);
  const coverages = Array.isArray(policy.Coverages) ? policy.Coverages.slice().sort((left, right) => Number(left.number || 0) - Number(right.number || 0)) : [];
  const vices = coverages.find(coverage => String(coverage.code || '') === '314');
  const vicesEnd = vices ? dateParts(vices.end) : { day: '', month: 1, year: '' };
  const insuredSum = Number(policy.insuredSum || 0);
  const changedInsuredSum = suretyChangedInsuredSum(policy, change);
  const beneficiaryId = beneficiary?.isPerson === false ? beneficiary.nif : beneficiary.cnp;
  const country = (countries || []).find(item => String(item.code || '') === String(address.country || ''))?.name || '';
  const province = (provinces || []).find(item => String(item.code || '') === String(address.state || ''))?.name || '';
  const city = (cities || []).find(item => String(item.code || '') === String(address.city || ''))?.name || '';
  const district = (sectors || []).find(item => String(item.id || item.code || '') === String(address.sector || ''))?.name || '';
  const sumLetters = suretyNumberToWords(insuredSum).toUpperCase().replace(/\s+CON\s+(\d{2}\/100)$/, ' BALBOAS CON $1');
  const fromText = start.day + ' DE ' + String(months[start.month - 1] || '').toUpperCase() + ' DEL ' + start.year;
  const untilText = end.day + ' DE ' + String(months[end.month - 1] || '').toUpperCase() + ' DEL ' + end.year;
  const result = {
    NumeroFianza: policy.code || '', Tenedor: fullName(holderData), AFavor: suretyValue(data, ['nombre']) || 'No Definido',
    Descripcion: suretyValue(data, ['desc_objeto_afianzado']), Secuestrante: suretyValue(data, ['secuestrante']),
    FechaActoPublico: formatDate(suretyValue(data, ['f_acto_publico'])), ActoPublico: suretyValue(data, ['n_acto_publico']),
    Moneda: 'B/.', Suma: n(insuredSum), SumaLetras: sumLetters, DiasVigencia: policyDays,
    NumeroContrato: suretyValue(data, ['txtNumeroContrato', 'txtNumeroContratoFianza', 'text-1770999106315']) || '0',
    DiaFecha: today.day, MesFecha: months[today.month - 1], AnioFecha: today.year, FechaActual: formatDate(new Date()),
    FechaActualTextoMin: today.day + ' del mes de ' + String(months[today.month - 1] || '').toLowerCase() + ' de ' + today.year,
    DiaVigenciaIni: start.day, MesVigenciaIni: months[start.month - 1], AnioVigenciaIni: start.year,
    DiaVigenciaFin: end.day, MesVigenciaFin: months[end.month - 1], AnioVigenciaFin: end.year,
    DesdeTexto: fromText, HastaTexto: untilText,
    Hasta2Texto: endPlusThirtyParts.day + ' DE ' + String(months[endPlusThirtyParts.month - 1] || '').toUpperCase() + ' DEL ' + endPlusThirtyParts.year,
    FechaFinVicioTexto: vicesEnd.year ? vicesEnd.day + ' DE ' + String(months[vicesEnd.month - 1] || '').toUpperCase() + ' DEL ' + vicesEnd.year : '',
    DiasVigenciaTexto: vigencia.texto + ' A PARTIR DEL ' + fromText, VigenciaTexto: vigencia.texto,
    NuevaVigenciaTexto: nuevaVigenciaTexto,
    SumaTextoTotal: ('B/. ' + n(insuredSum) + ' ' + sumLetters).trim().toUpperCase(),
    SumaCambioTexto: changedInsuredSum === null ? '' : suretyAmountText(changedInsuredSum),
    MonedaMonto: ('B/. ' + n(insuredSum)).trim(), Prestamo: '', TipoLicitacion: '', NombreEncargado: '', TituloEncargado: '',
    IdentificacionTenedor: holderData.isPerson === true ? holderData.cnp || '' : holderData.nif || '',
    DireccionTenedor: [address.address1, address.address2, district].filter(Boolean).join(', '), TelefonoTenedor: phoneByType(holderData.Phones, 'PHONETYPE1') || holderData.phone || '',
    CelularTenedor: phoneByType(holderData.Phones, 'PHONETYPE2'), FaxTenedor: phoneByType(holderData.Phones, 'PHONETYPE4'),
    EmailTenedor: phoneByType(holderData.Emails, 'EMAILTYPE1') || holderData.email || '', PaisTenedor: country, ProvinciaTenedor: province, CiudadTenedor: city,
    Desde: formatDate(policy.start), Hasta: formatDate(policy.end), IdentificacionAFavor: beneficiaryId || suretyValue(data, ['contacto_ruc', 'rut']),
    Licitacion: suretyValue(data, ['n_licitacion']), Prima: n(policy.annualPremium || 0), Gastos: n(policy.fee || 0), Impuestos: n(policy.tax || 0), Total: n(policy.annualTotal || 0),
    TipoMovimiento: Number(policy.contractYear || 0) === 1 ? 'Nuevo' : 'Renovación', Corredor: fullName(seller) || 'No Tiene', Oferta: policy.id,
    Coberturas: coverages.map(coverage => ({ Codigo: coverage.code, Cobertura: coverage.name || '', Limite: n(coverage.limit), Prima: n(coverage.premium), Moneda: 'B/.' }))
  };
  return result;
}

function suretyChangedInsuredSum(policy, change) {
  if (tipoCambioCobertura(change).endorsementType !== 'CHANGE_INSURED_SUM_SURETY') return null;

  const changedCoverages = safeJson(change?.jNewCoverages, []);
  const previousCoverages = safeJson(change?.jOldCoverages, []);
  if (!Array.isArray(changedCoverages) || !Array.isArray(previousCoverages)) return 0;

  const configTable = loadSuretyCatalog('cfgCoberturaProductoReaFianza');
  const headers = Array.isArray(configTable[0]) ? configTable[0].map(value => String(value || '').trim().toLowerCase()) : [];
  const productIndex = headers.indexOf('productcode');
  const coverageIndex = headers.indexOf('coveragecode');
  const sumsIndex = headers.indexOf('iscoverage');
  const productCode = String(policy?.productCode || '').trim();
  const configuredCoverages = new Set(
    configTable.slice(1)
      .filter(row => Array.isArray(row) && String(row[productIndex >= 0 ? productIndex : 1] || '').trim() === productCode)
      .filter(row => String(row[sumsIndex >= 0 ? sumsIndex : 5] || '').trim().toUpperCase() === 'SI')
      .map(row => String(row[coverageIndex >= 0 ? coverageIndex : 3] || '').trim())
      .filter(Boolean)
  );

  return changedCoverages.reduce((total, coverage) => {
    const code = String(coverage?.code || '').trim();
    if (!configuredCoverages.has(code)) return total;

    const previousCoverage = previousCoverages.find(item => String(item?.code || '').trim() === code) || {};
    const currentLimit = numericValue(coverage?.limit ?? coverage?.sumInsured);
    const previousLimit = numericValue(previousCoverage?.limit ?? previousCoverage?.sumInsured);
    return total + currentLimit - previousLimit;
  }, 0);
}

function suretyAmountText(value) {
  const amount = numericValue(value);
  const letters = suretyNumberToWords(Math.abs(amount))
    .toUpperCase()
    .replace(/\s+CON\s+(\d{2}\/100)$/, ' BALBOAS CON $1');
  const prefix = amount < 0 ? '-B/. ' : 'B/. ';
  return prefix + n(Math.abs(amount)) + ' (' + (amount < 0 ? 'MENOS ' : '') + letters + ')';
}

function suretyChangedCoverageTerm(change, months, dateParts) {
  if (tipoCambioCobertura(change).endorsementType !== 'CHANGE_COVERAGE_SURETY') return '';

  const additional = safeJson(change?.jAdditional, {}) || {};
  const coverageCode = String(additional.coverageCode || '').trim();
  const newCoverages = safeJson(change?.jNewCoverages, []);
  const oldCoverages = safeJson(change?.jOldCoverages, []);
  const changedCoverage = Array.isArray(newCoverages)
    ? newCoverages.find(coverage => String(coverage?.code || '').trim() === coverageCode)
      || newCoverages.find(coverage => {
        const previous = Array.isArray(oldCoverages)
          ? oldCoverages.find(item => String(item?.code || '').trim() === String(coverage?.code || '').trim())
          : null;
        return previous && (String(previous.start || '') !== String(coverage.start || '') || String(previous.end || '') !== String(coverage.end || ''));
      })
    : null;
  const startValue = change?.newStart || changedCoverage?.start;
  const endValue = change?.newEnd || changedCoverage?.end;
  const previousCoverage = Array.isArray(oldCoverages) && changedCoverage
    ? oldCoverages.find(item => String(item?.code || '').trim() === String(changedCoverage.code || '').trim())
    : null;
  const previousEndValue = previousCoverage?.end;
  const start = dateParts(startValue);
  const end = dateParts(endValue);
  const endDate = new Date(String(endValue || '').slice(0, 10) + 'T12:00:00Z');
  const previousEndDate = new Date(String(previousEndValue || '').slice(0, 10) + 'T12:00:00Z');
  if (!start.year || !end.year || Number.isNaN(endDate.getTime()) || Number.isNaN(previousEndDate.getTime())) return '';

  const days = Math.round((endDate - previousEndDate) / 86400000);
  const period = days + ' ' + (Math.abs(days) === 1 ? 'DÍA' : 'DÍAS');
  const longDate = value => value.day + ' DE ' + String(months[value.month - 1] || '').toUpperCase() + ' DE ' + value.year;
  return period + ' A PARTIR DE ' + longDate(start) + ', ES DECIR QUE PERMANECERÁ VIGENTE HASTA EL ' + longDate(end);
}

function suretyVigenciaText(daysValue, calendarType) {
  const days = Number(daysValue || 0);
  const type = String(calendarType || '').trim();
  let period = Math.round(days);
  let unit = period === 1 ? 'DÍA' : 'DÍAS';

  if (type === '2') {
    period = Math.round(days / 30);
    unit = period === 1 ? 'MES' : 'MESES';
  } else if (type === '3') {
    period = Math.round(days / 365);
    unit = period === 1 ? 'AÑO' : 'AÑOS';
  }

  return { period, texto: period + ' ' + unit };
}

function suretyNumberToWords(value) {
  const units = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const special = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  const belowThousand = number => {
    if (!number) return '';
    if (number === 100) return 'CIEN';
    let text = number >= 100 ? hundreds[Math.floor(number / 100)] + ' ' : '';
    number %= 100;
    if (number >= 10 && number < 20) return text + special[number - 10];
    if (number >= 20) return text + (number === 20 ? 'VEINTE' : (number < 30 ? 'VEINTI' + units[number % 10].toLowerCase() : tens[Math.floor(number / 10)] + (number % 10 ? ' Y ' + units[number % 10] : '')));
    return text + units[number];
  };
  const numeric = Number(value || 0);
  const whole = Math.floor(Math.abs(numeric));
  const millions = Math.floor(whole / 1000000), thousands = Math.floor((whole % 1000000) / 1000), hundredsPart = whole % 1000;
  const text = [millions ? (millions === 1 ? 'UN MILLÓN' : belowThousand(millions) + ' MILLONES') : '', thousands ? (thousands === 1 ? 'MIL' : belowThousand(thousands) + ' MIL') : '', belowThousand(hundredsPart)].filter(Boolean).join(' ') || 'CERO';
  const decimals = String(Math.round((Math.abs(numeric) % 1) * 100)).padStart(2, '0');
  return text + ' CON ' + decimals + '/100';
}

function applyChangedBeneficiaries(documentData, beneficiariesUserData) {
  const custom = { ...(documentData || {}) };
  const raw = beneficiariesUserData?.hiddenBeneficiarios;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = safeJson(value, []);
  const beneficiaries = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.beneficiarios) ? parsed.beneficiarios : [];

  custom.Beneficiarios = beneficiaries.map((beneficiary, index) => {
    const item = beneficiary && typeof beneficiary === 'object' ? beneficiary : {};
    const identification = String(item.identificacion ?? '').trim();
    return {
      ...item,
      Numero: index + 1,
      identificacion: identification,
      nombreCompleto: item.nombreCompleto ?? '',
      parentesco: item.parentesco ?? '',
      menorEdad: identification ? 'No' : 'Si',
      porcentaje: n(item.porcentaje ?? 0)
    };
  });
  custom.TotalPorcentajeBeneficiarios = n(custom.Beneficiarios.reduce(
    (total, beneficiary) => total + numericValue(beneficiary.porcentaje), 0
  ));
  return custom;
}

function generateEndorsementDocument(templateName, documentData, policyId, documentTitle, documentName) {
  doCmd({
    cmd: 'RepoDocument',
    data: { operation: 'ADD', entity: { fileName: templateName, LifePolicyid: policyId } }
  });
  const docId = RepoDocument.outData?.[0]?.id;
  if (!docId) throw new Error(`No fue posible crear el registro del documento ${templateName}.`);

  doCmd({ cmd: 'GenerateDoc', data: { template: templateName, data: documentData, async: false } });
  if (!GenerateDoc.ok || !GenerateDoc.outData?.url) {
    throw new Error(GenerateDoc.msg || `No fue posible generar el documento ${templateName}.`);
  }

  setDocField(docId, `fileName='${documentTitle.replace(/'/g, "''")}'`);
  setDocField(docId, `name='${documentName.replace(/'/g, "''")}'`);
  setDocField(docId, `url='${String(GenerateDoc.outData.url).replace(/'/g, "''")}'`);
  setDocField(docId, 'created=GETDATE()');
  return GenerateDoc.msg || 'OK';
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
  const isLife = isLifePolicyLob(policy?.lob);
  const lifeCatalogs = isLife ? loadLifeCatalogs() : null;
  const technicalCatalogs = isTechnicalPolicy(policy) ? loadTechnicalCatalogs() : null;
  const autoCatalogs = isAutoPolicy(policy) ? loadAutoCatalogs() : null;
  const riesgo = isAutoPolicy(policy)
    ? buildAutoRisk(insuredData, autoCatalogs, policy)
    : isTechnicalPolicy(policy)
    ? buildTechnicalRisk(insuredData, technicalCatalogs, countries, procincias)
    : isSuretyPolicy(policy)
      ? buildSuretyRisk(insuredData, suretyCatalogs)
    : isLife
      ? buildLifeRisk(insuredData, lifeCatalogs)
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

  const esCambioCapital = change?.Discriminator === 'CapitalChange';
  const sumaAnterior = esCambioCapital
    ? n(change?.oldCapital ?? change?.olCapital ?? policy?.olCapital ?? 0)
    : 0;
  const sumaActual = esCambioCapital
    ? n(change?.newCapital ?? policy?.newCapital ?? 0)
    : 0;

  // Base custom
  const custom = {
    Aseguradora: { NombreSocial: "GLOBAL ASEGURADORA S.A." },
    code: policy?.code || "",
    TipAseg: getTipoAsegurado(policy),
    NombreRamo: row.NombreRamo || "",
    NombreProducto: row.NombreProducto || "",

    Tomador: {
      NombreCompleto: holderFullName,
      Identificacion: holder.cnp || holder.nit || "No Tiene"
    },

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
      NombreDistrito: InsuredObject.userData.cmbMunicipio
        ? (Municipios.find(itm => itm.code === InsuredObject.userData.cmbMunicipio)?.name
          || String(InsuredObject.userData.cmbMunicipio))
        : "",
      NombreCiudad: InsuredObject.userData.cmbMunicipio
        ? (Municipios.find(itm => itm.code === InsuredObject.userData.cmbMunicipio)?.name
          || String(InsuredObject.userData.cmbMunicipio))
        : "",
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
      DetalleEndoso: change?.note || "Sin Detalles",
      SumaAnterior: sumaAnterior,
      SumaActual: sumaActual
    },
    AseguradosCambioSuma: obtenerAseguradosCambioSuma(change),
    Riesgo: riesgo
    
  };

  // The surety DTO remains the single source for every fianza-document field.
  // It is intentionally absent from non-surety endorsement payloads.
  if (isSuretyPolicy(policy)) {
    custom.DocumentoFianza = buildSuretyDocumentData({
      policy, change, insuredData, holder, contacts: dataContacto,
      countries, provinces: procincias, cities: Municipios, sectors
    });
  }

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

    // Para inclusion/exclusion el documento solo debe recibir las coberturas
    // involucradas en el movimiento, no el inventario completo de la poliza.
    const additional = safeJson(change.jAdditional, {}) || {};
    const additionalCoverages = Array.isArray(additional.coverages) ? additional.coverages : [];
    const codeOf = coverage => String(coverage?.code ?? '').trim();
    const isCoverageSetChange = esCambioCobertura(change);
    const isCoverageRemoval = esExclusionCobertura(change);
    const additionalCodes = additionalCoverages.map(codeOf).filter(Boolean);
    const oldCodes = oldCoverages.map(codeOf).filter(Boolean);
    const newCodes = changeCoverages.map(codeOf).filter(Boolean);
    let affectedCodes = additionalCodes;

    if (!affectedCodes.length && isCoverageSetChange && !isCoverageRemoval) {
      affectedCodes = newCodes.filter(code => !oldCodes.includes(code));
    }
    if (!affectedCodes.length && isCoverageRemoval) {
      affectedCodes = oldCodes.filter(code => !newCodes.includes(code));
    }
    if (!affectedCodes.length && isCoverageSetChange) {
      affectedCodes = changeCoveragesDetails.map(codeOf).filter(Boolean);
    }
    if (!isCoverageSetChange) {
      affectedCodes = (policy.Coverages || []).map(codeOf).filter(Boolean);
    }

    const coverageSource = code => {
      const fromAdditional = additionalCoverages.find(item => codeOf(item) === code);
      const fromChange = changeCoverages.find(item => codeOf(item) === code);
      const fromOld = oldCoverages.find(item => codeOf(item) === code);
      const fromPolicy = (policy.Coverages || []).find(item => codeOf(item) === code);
      return Object.assign({}, fromPolicy || {}, fromOld || {}, fromChange || {}, fromAdditional || {}, { code });
    };

    custom.Endoso.Coberturas = affectedCodes.map(code => {
      const source = coverageSource(code);
      const oldChangeCov = oldCoverages.find(c => codeOf(c) === code);
      const changeCov = changeCoverages.find(c => codeOf(c) === code);
      const changeCovDetail = changeCoveragesDetails.find(c => codeOf(c) === code);

      if (!isCoverageSetChange) {
        const polCov = (policy.Coverages || []).find(c => codeOf(c) === code) || source;
        const oldLimit = oldChangeCov?.limit ?? (polCov?.limit ?? 0);
        const newLimit = changeCov?.limit ?? oldLimit;
        const primaDiff = changeCovDetail ? n(changeCovDetail.premiumDif) : 0;
        return {
          ...polCov,
          premiumDif: endosoSinPrima ? n(0) : primaDiff,
          limitDif: endosoSinPrima ? n(0) : n(newLimit - oldLimit)
        };
      }

      const oldLimit = oldChangeCov?.limit ?? source?.limit ?? 0;
      const newLimit = isCoverageRemoval
        ? 0
        : (changeCov?.limit ?? source?.limit ?? oldLimit);
      const defaultPremiumDif = isCoverageRemoval
        ? -n(oldChangeCov?.premium ?? source?.premium ?? 0)
        : n(changeCov?.premium ?? source?.premium ?? 0);
      const primaDiff = changeCovDetail
        ? n(changeCovDetail.premiumDif ?? changeCovDetail.premiumCost ?? defaultPremiumDif)
        : defaultPremiumDif;

      return {
        ...source,
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
    case "ChangeAddCoverage": return { ...base, nombreEndoso: "Incluir cobertura" };
    case "ChangeRemoveCoverage": return { ...base, nombreEndoso: "Excluir Cobertura" };
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

function obtenerAseguradosCambioSuma(change) {
  const additional = safeJson(change?.jAdditional, {});
  return Array.isArray(additional?.insureds) ? additional.insureds : [];
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
