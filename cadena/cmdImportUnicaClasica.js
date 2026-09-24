//block
//noreplace
/**
 * @chain    cmdImportUnicaClasica
 * @category MASIVO
 * @purpose  Operación por fila de la importación «Carga Masiva UNICA CLASICA» (producto UNICA_CLA, ramo 31).
 *           1. Valida la fila con cmdPreValidationUNICA (catálogos, estructura, consistencia, duplicados).
 *           2. Crea la póliza: asegurado = tomador = pagador = casegurado; cesionario = cacreedor (opcional).
 *           3. Crea el objeto asegurado DT_ACCIDENTES_V1 según la configuración del producto; las sumas por
 *              cobertura van a la sección Tarifas (hiddenCobtar) sólo si el producto la tiene configurada.
 *           4. Avanza el flujo WFEmisionRamosTecnicos, cotiza y emite (la póliza queda Activa).
 *           Reaseguro y documentos quedan a cargo de los disparadores y del flujo del producto.
 *           Un error en cualquier paso rechaza la fila con un mensaje que se lee en el módulo de Importaciones.
 * @context  { row:{casegurado, cacreedor, sucursal, frecuenciaPago, formaPago, fdesde, fhasta, sumaAsegurada,
 *           salario, peso, altura, nroPrestamo, tipoPrestamo, cob168, cob168Suma, cob169, cob169Suma}, batchId }
 * @mission  MSN-000027 (global1) — 2026-09-23
 */

const PRODUCT_CODE = "UNICA_CLA";
const OBJECT_CODE = "DT_ACCIDENTES_V1";
const ISSUE_STEP = "Borrador de Póliza";
const FIELDS = ["casegurado", "cacreedor", "sucursal", "frecuenciaPago", "formaPago", "fdesde", "fhasta",
  "sumaAsegurada", "salario", "peso", "altura", "nroPrestamo", "tipoPrestamo",
  "cob168", "cob168Suma", "cob169", "cob169Suma"];
const COBTAR_TABLES = [{ lob: "31", table: "cfgCobtarVida" }, { lob: "20", table: "cfgCobtarVidaColectivo" }, { lob: "71", table: "cfgCobtarVidaIndividual" }];

const args = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});
let policy = null;
let step = "validación";

try {
  // 1. Validación
  const row = args.row || {};
  const cells = FIELDS.map(f => (row[f] === null || row[f] === undefined) ? "" : String(row[f]).trim());
  doCmd({ cmd: "ExeChain", data: { chain: "cmdPreValidationUNICA", context: JSON.stringify({ productCode: PRODUCT_CODE, cells }) } });
  if (!ExeChain.ok) fail(`No se pudo validar la fila: ${ExeChain.msg}`);
  const validation = ExeChain.outData || {};
  if (!validation.ok) fail(`Fila rechazada: ${(validation.errors || []).join(" | ")}`);
  const d = validation.data;

  // 2. Producto y asegurado
  step = "lectura del producto";
  doCmd({ cmd: "RepoProduct", data: { operation: "GET", filter: `code = '${PRODUCT_CODE}'`, noTracking: true } });
  const productRow = (RepoProduct.outData || [])[0];
  if (!productRow) fail(`El producto ${PRODUCT_CODE} no existe.`);
  const product = JSON.parse(productRow.configJson || "{}");
  const main = product.Main || {};

  doCmd({ cmd: "GetContacts", data: { filter: `id=${d.insuredId}` } });
  const insured = (GetContacts.outData || [])[0];
  if (!insured) fail(`casegurado ${d.insuredId} no existe como contacto.`);
  const insuredName = [insured.name, insured.middleName, insured.surname1, insured.surname2].filter(v => v && String(v).trim()).join(" ");

  // 3. Póliza
  step = "creación de la póliza";
  const includedCodes = d.coverages.map(c => c.code);
  const coverages = (product.Coverages || [])
    .filter(c => c.mandatory === true || includedCodes.includes(String(c.code)))
    .map(c => ({
      name: c.name, code: c.code, basic: c.basic, description: c.description, mandatory: c.mandatory,
      limit: 0, premium: 0, deductible: 0, insurability: c.insurability, commercialName: c.commercialName,
      internalBonus: c.internalBonus || false, appliesTo: c.appliesTo, number: c.number,
      restrictUserEdition: c.restrictUserEdition, beneficiaries: c.beneficiaries,
      minLimit: -1, maxLimit: -1, loading: 0, extraPremium: 0, internalPremium: 0, periodicity: 0, ofnCode: 0
    }));
  const clauses = (product.Clauses || [])
    .filter(c => c.selected === true)
    .map(c => ({ code: c.code, section: c.section, text: c.text, mandatory: c.mandatory, selected: c.selected }));
  const installmentSchemeId = findInstallmentScheme((product.Premium || {}).installmentScheme);
  const insuredEntry = { id: 0, contactId: d.insuredId, name: insuredName, relationship: 0, Contact: insured, lifePolicyId: 0, role: 0 };

  const entity = {
    currency: main.currency || "USD",
    Beneficiaries: [], Surcharges: [], Exclusions: [], Coinsureds: [],
    Clauses: clauses,
    policyType: "I",
    indexation: 0,
    lob: String(productRow.lobCode),
    segment: stripCompanyPrefix(main.segment),
    channel: stripCompanyPrefix(main.channel),
    branchCode: d.branchCode,
    holderId: d.insuredId,
    payerId: d.insuredId,
    cessionBeneficiary: d.cessionId,
    paymentMethod: d.paymentMethod,
    receiptTypeCode: d.receiptTypeCode,
    MainInsured: insuredEntry,
    Insureds: [insuredEntry],
    insuredSum: d.insuredSum,
    start: `${d.start}T12:00:00`,
    end: `${d.end}T12:00:00`,
    duration: d.termYears,
    durationMonths: d.termMonths,
    durationDays: d.extraDays,
    coinsurance: 0,
    groupCoverageType: "DIFFERENT",
    paymentDuration: 0,
    periodicity: d.periodicity,
    installmentSchemeId,
    masterCode: main.masterCode || PRODUCT_CODE,
    commercial: main.commercial,
    version: 1,
    option: 1,
    indexationPeriod: 1,
    indexationStart: 1,
    indexationFrequency: 1,
    productCode: PRODUCT_CODE,
    Coverages: coverages
  };
  doCmd({ cmd: "RepoLifePolicy", data: { operation: "ADD", entity } });
  if (!RepoLifePolicy.ok) fail(`No se pudo crear la póliza: ${RepoLifePolicy.msg}`);
  policy = [].concat(RepoLifePolicy.outData || []).pop();
  if (!policy || !policy.id) fail("La creación de la póliza no devolvió su id.");

  // 4. Objeto asegurado según la configuración del producto
  step = "objeto asegurado";
  addInsuredObject(policy, d, productRow, insured);

  // 5. Flujo: Registro de la oferta -> Valores por Defecto -> Generar cotización
  step = "avance del flujo a cotización";
  if (policy.processId) advance();
  // Valores por Defecto asigna el cesionario de la compañía cuando viene vacío; la carga pide emitir sin cesionario.
  if (!d.cessionId) setField("cessionBeneficiary=NULL");

  // 6. Cotización (el flujo pasa a Generar Documento)
  step = "cotización";
  doCmd({ cmd: "QuotePolicy", data: { policyId: policy.id, dbMode: true, save: true, action: "QUOTE" } });
  if (!QuotePolicy.ok) fail(`La cotización fue rechazada: ${QuotePolicy.msg}`);

  // 7. Flujo hasta Borrador de Póliza y emisión (el flujo pasa a Activa)
  step = "avance del flujo a emisión";
  if (policy.processId) {
    for (let i = 0; i < 3 && currentStep() !== ISSUE_STEP; i++) advance();
    if (currentStep() !== ISSUE_STEP) fail(`El flujo no llegó a «${ISSUE_STEP}» (quedó en «${currentStep()}»).`);
  }
  step = "emisión";
  doCmd({ cmd: "IssuePolicy", data: { policyId: policy.id } });
  if (!IssuePolicy.ok) fail(`La emisión fue rechazada: ${IssuePolicy.msg}`);

  doCmd({ cmd: "LoadEntity", data: { entity: "LifePolicy", filter: `id=${policy.id}`, fields: "id, code, active, entityState", noTracking: true } });
  const issued = LoadEntity.outData || {};
  if (!issued.active) fail(`La póliza quedó en estado ${issued.entityState || "desconocido"} en lugar de emitida.`);

  doCmd({ cmd: "DoQuery", data: { sql: `SELECT COUNT(*) n FROM PayPlan WHERE lifePolicyId = ${policy.id} AND cancellationDate IS NULL` } });
  const installments = ((DoQuery.outData || [])[0] || {}).n;
  return { ok: true, msg: `Póliza ${issued.code} emitida (id ${policy.id}): frecuencia ${d.periodicity}, ${installments} cuota(s).`, policyId: policy.id, code: issued.code, installments };

} catch (error) {
  const reason = String(error && error.message ? error.message : error).replace(/^@/, "");
  const where = policy && policy.id
    ? `Póliza id ${policy.id}${policy.code ? ` (${policy.code})` : ""} creada pero NO emitida; falló en ${step}. Anúlela o complétela desde Pólizas. `
    : "";
  throw new Error(`@${PRODUCT_CODE}: ${where}${reason}`);
}

// ---------------------------------------------------------------------------------------------

function fail(message) {
  throw new Error(message);
}

function stripCompanyPrefix(value) {
  const s = String(value || "");
  return s.length <= 3 ? s : s.slice(3);
}

function findInstallmentScheme(code) {
  // Convenio de pago por defecto del producto, como lo propone la pantalla de pólizas.
  if (!code) return null;
  doCmd({ cmd: "DoQuery", data: { sql: `SELECT id FROM InstallmentScheme WHERE code = '${String(code).replace(/'/g, "''")}'` } });
  const found = (DoQuery.outData || [])[0];
  return found ? found.id : null;
}

function setField(fieldValue) {
  doCmd({ cmd: "SetField", data: { entity: "LifePolicy", entityId: policy.id, fieldValue } });
  if (!SetField.ok) fail(`No se pudo actualizar la póliza (${fieldValue}): ${SetField.msg}`);
}

function advance() {
  doCmd({ cmd: "GotoStep", data: { procesoId: policy.processId, estado: "_next" } });
  if (!GotoStep.ok) fail(`El flujo no avanzó: ${GotoStep.msg}`);
}

function currentStep() {
  doCmd({ cmd: "LoadEntity", data: { entity: "Proceso", filter: `id=${policy.processId}`, fields: "id, estado", noTracking: true } });
  return (LoadEntity.outData || {}).estado;
}

function addInsuredObject(policy, d, productRow, insured) {
  doCmd({ cmd: "RepoObjectDefinition", data: { operation: "GET", filter: `code = '${OBJECT_CODE}'`, include: ["Form"], noTracking: true } });
  const definition = (RepoObjectDefinition.outData || [])[0];
  if (!definition || !definition.Form) fail(`No existe el objeto asegurado ${OBJECT_CODE} o su formulario.`);
  const form = JSON.parse(definition.Form.json);
  const productCurrency = (JSON.parse(productRow.configJson || "{}").Main || {}).currency || "USD";

  const values = {
    txtEdadSuscripcion: String(ageToday(insured.birth)),
    txtSumaAsegurada: formatAmount(d.insuredSum),
    hiddenCobtar: JSON.stringify(buildCobtar(d, productRow))
  };
  if (d.salary !== null) {
    values.txtSalario = String(d.salary);
    const currencyField = form.find(f => f.name === "cmbMonedaSalario");
    if (currencyField && (currencyField.values || []).some(v => v.value === productCurrency)) values.cmbMonedaSalario = productCurrency;
  }
  if (d.weight !== null) values.txtPeso = String(d.weight);
  if (d.height !== null) values.txtAltura = String(d.height);
  if (d.loanNumber) values.txtNoPrestamo = String(d.loanNumber);
  if (d.loanType) values.cmbTipoPrestamo = d.loanType;

  form.forEach(field => {
    if (field.name && Object.prototype.hasOwnProperty.call(values, field.name)) field.userData = [values[field.name]];
  });

  doCmd({ cmd: "RepoInsuredObject", data: { operation: "ADD", entity: { lifePolicyId: policy.id, objectDefinitionId: definition.id, jValues: JSON.stringify(form) } } });
  if (!RepoInsuredObject.ok) fail(`No se pudo crear el objeto asegurado: ${RepoInsuredObject.msg}`);
}

function buildCobtar(d, productRow) {
  // Sección Tarifas del objeto asegurado: sólo si el producto tiene campos configurados para la cobertura.
  const source = COBTAR_TABLES.find(t => t.lob === String(productRow.lobCode));
  if (!source) return [];
  doCmd({ cmd: "GetFullTable", data: { table: source.table } });
  if (!GetFullTable.ok || !(GetFullTable.outData || []).length) return [];
  const [header, ...rows] = GetFullTable.outData;
  const col = name => header.findIndex(h => String(h).trim() === name);
  const iProduct = col("productCode"), iCoverage = col("coverageCode"), iCoverageName = col("coverageName"), iName = col("name"), iDescription = col("description");
  const result = [];
  d.coverages.forEach(coverage => {
    const fields = rows.filter(r => String(r[iProduct]).trim() === PRODUCT_CODE && String(r[iCoverage]).trim() === coverage.code);
    if (fields.length === 0) return;
    const entry = { coverageCode: coverage.code, coverageName: fields[0][iCoverageName] || coverage.name };
    fields.forEach(f => { if (f[iName] && f[iName] !== "none") entry[f[iName]] = null; });
    const sumField = fields.find(f => /suma|capital|^sa$/i.test(String(f[iName]).trim()) || /suma asegurada|capital/i.test(String(f[iDescription] || "")));
    if (sumField && coverage.sum !== null) entry[sumField[iName]] = coverage.sum;
    result.push(entry);
  });
  return result;
}

function ageToday(birth) {
  const b = new Date(birth);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  if (today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--;
  return age;
}

function formatAmount(value) {
  const fixed = Number(value).toFixed(2);
  const [integer, decimals] = fixed.split(".");
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimals}`;
}
