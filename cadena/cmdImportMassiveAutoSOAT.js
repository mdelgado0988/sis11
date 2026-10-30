//block
//noreplace
/**
 * @chain    cmdImportMassiveAutoSOAT
 * @category MASIVO
 * @purpose  Operación por fila de la importación «Carga Masiva Auto Seguro Obligatorio SOAT»: emite una póliza individual del producto SOAT
 *           (ramo 6) por cada línea del archivo. Sin preprocesador: lo correcto se emite y cada fila incorrecta se
 *           rechaza en la misma carga con TODOS sus motivos.
 *           1. Valida: casegurado (id numérico del ente, existente),
 *              cacreedor (opcional; ente existente), Sucursal, Frecuencia_Pago (opciones del producto) y
 *              Forma_Pago por código o texto, Fdesde/Fhasta dd/MM/yyyy (Fdesde < Fhasta, plazo del producto),
 *              catálogos del formulario de auto (form 655) por código o texto, numéricos y largos del formulario,
 *              coberturas obligatorias marcadas, campos de tarifa (tabla cfgCobtarAuto) según su tipo, y que el
 *              vehículo (VIN) no tenga póliza vigente ni se repita en el mismo archivo.
 *           2. Crea la oferta (asegurado = tomador = pagador; acreedor como cesionario), el objeto DTAUT con
 *              hiddenCobtar y recorre el flujo de emisión: valores por defecto, cotización (prima > 0 y ninguna
 *              cobertura en 0 si su tarifa no es 0 por diseño), generación de la oferta, Borrador de Póliza y
 *              emisión. La fila es OK sólo si la póliza queda Activa.
 * @context  { row:{<campos de la importación>}, batchId, configId, configName, simulate? }
 *           simulate:true valida y devuelve la póliza armada sin grabar nada.
 * @mission  MSN-000105 (globaluat) — 2026-10-27. Fuente común de cmdImportMassiveAutoIlocalizada y cmdImportMassiveAutoSOAT.
 */

const CFG = {
 "importName": "Carga Masiva Auto Seguro Obligatorio SOAT",
 "tag": "SOAT",
 "product": "SOAT",
 "coverages": [
  "12",
  "20",
  "14",
  "21",
  "101"
 ],
 "tariffColumns": {},
 "columns": [
  [
   "casegurado",
   "casegurado"
  ],
  [
   "cacreedor",
   "cacreedor"
  ],
  [
   "Sucursal",
   "sucursal"
  ],
  [
   "Frecuencia_Pago",
   "frecuenciaPago"
  ],
  [
   "Forma_Pago",
   "formaPago"
  ],
  [
   "Fdesde",
   "fdesde"
  ],
  [
   "Fhasta",
   "fhasta"
  ],
  [
   "Marca",
   "marca"
  ],
  [
   "Modelo",
   "modelo"
  ],
  [
   "Año",
   "anio"
  ],
  [
   "mvalorOA",
   "mvalorOA"
  ],
  [
   "Color",
   "color"
  ],
  [
   "Puertas",
   "puertas"
  ],
  [
   "Puestos",
   "puestos"
  ],
  [
   "Serie_Chasis",
   "serieChasis"
  ],
  [
   "Serie_Motor",
   "serieMotor"
  ],
  [
   "Placa",
   "placa"
  ],
  [
   "VIN",
   "vin"
  ],
  [
   "No_Prestamo",
   "noPrestamo"
  ],
  [
   "Tipo",
   "tipo"
  ],
  [
   "Uso_Vehiculo",
   "usoVehiculo"
  ],
  [
   "Transmision",
   "transmision"
  ],
  [
   "Cilindros",
   "cilindros"
  ],
  [
   "Combustible",
   "combustible"
  ],
  [
   "Descripcion",
   "descripcion"
  ],
  [
   "Cob_12",
   "cob12"
  ],
  [
   "Cob_20",
   "cob20"
  ],
  [
   "Cob_14",
   "cob14"
  ],
  [
   "Cob_21",
   "cob21"
  ],
  [
   "Cob_101",
   "cob101"
  ]
 ]
};
const OBJECT_CODE = "DTAUT";
const ISSUE_STEP = "Borrador de Póliza";
const START_TIME = "T06:01:00";
const DEFAULT_RECEIPT_TYPE = "1";
const OFFER_DOCUMENT = "Oferta%";
// Declarado antes del bloque principal: en modo //block el código posterior al try no llega a ejecutarse
const ACCENTS = { "Á": "A", "À": "A", "Â": "A", "Ä": "A", "É": "E", "È": "E", "Ê": "E", "Ë": "E", "Í": "I", "Ì": "I", "Î": "I", "Ï": "I",
  "Ó": "O", "Ò": "O", "Ô": "O", "Ö": "O", "Ú": "U", "Ù": "U", "Û": "U", "Ü": "U", "Ñ": "N" };

const args = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});
const row = args.row || {};
const simulate = args.simulate === true;
const errors = [];
const cache = {};
let policy = null;
let step = "validación";

try {
  if (cell("casegurado").toLowerCase() === "casegurado") return { ok: true, msg: "Fila de encabezado: se omite." };

  // Producto y formulario del vehículo
  doCmd({ cmd: "RepoProduct", data: { operation: "GET", filter: `code = '${CFG.product}'`, noTracking: true } });
  const productRow = (RepoProduct.outData || [])[0];
  if (!productRow) fail(`El producto ${CFG.product} no existe.`);
  const product = JSON.parse(productRow.configJson || "{}");
  const main = product.Main || {};
  const lob = String(productRow.lobCode);
  doCmd({ cmd: "RepoObjectDefinition", data: { operation: "GET", filter: `code = '${OBJECT_CODE}'`, include: ["Form"], noTracking: true } });
  const definition = (RepoObjectDefinition.outData || [])[0];
  if (!definition || !definition.Form) fail(`No existe el objeto asegurado ${OBJECT_CODE} o su formulario.`);
  const form = JSON.parse(definition.Form.json);
  const formField = name => form.find(f => f.name === name) || {};

  // 1. Validación de la fila completa
  const insured = checkInsured(cell("casegurado"));
  const creditor = checkCreditor(cell("cacreedor"));
  const branch = pick("Sucursal", cell("sucursal"), query("SELECT code, name FROM Branch WHERE active = 1").map(b => ({ code: String(b.code), name: b.name })), true);
  const periodicity = pick("Frecuencia_Pago", cell("frecuenciaPago"), periodicityOptions(product), true);
  const paymentMethod = pick("Forma_Pago", cell("formaPago"), query("SELECT code, name FROM PaymentMethodCatalog").map(p => ({ code: String(p.code), name: p.name })), true);
  const start = parseDate("Fdesde", cell("fdesde"), true);
  const end = parseDate("Fhasta", cell("fhasta"), true);
  const term = checkTerm(start, end, main);
  const vehicle = checkVehicle(lob, formField);
  const coverages = checkCoverages(product);
  const cobtar = checkTariffFields(coverages);
  checkVehicleDuplicates(vehicle, start, end, definition.id);
  if (errors.length) fail(errors.join(" | "));

  // 2. Armado de la póliza y del objeto asegurado
  const startIso = start.iso + START_TIME;
  const endIso = end.iso + START_TIME;
  const insuredName = [insured.name, insured.middleName, insured.surname1, insured.surname2]
    .filter(x => x && String(x).trim()).map(x => String(x).trim()).join(" ") || `Ente ${insured.id}`;
  const insuredEntry = { id: 0, contactId: insured.id, name: insuredName, relationship: 0, Contact: contactOf(insured.id), lifePolicyId: 0, role: 0 };
  const entity = {
    currency: main.currency || "USD",
    Beneficiaries: [], Surcharges: [], Exclusions: [], Coinsureds: [], Clauses: [],
    policyType: "I",
    indexation: 0,
    lob: lob,
    segment: stripCompanyPrefix(main.segment),
    channel: stripCompanyPrefix(main.channel),
    branchCode: branch.code,
    holderId: insured.id,
    payerId: insured.id,
    receiptTypeCode: insured.receiptTypeCode ? String(insured.receiptTypeCode) : DEFAULT_RECEIPT_TYPE,
    MainInsured: insuredEntry,
    Insureds: [insuredEntry],
    insuredSum: vehicle.valor,
    start: startIso,
    end: endIso,
    duration: term.years,
    durationMonths: term.months,
    durationDays: term.days,
    coinsurance: 0,
    groupCoverageType: "DIFFERENT",
    paymentDuration: 0,
    periodicity: periodicity.code,
    paymentMethod: paymentMethod.code,
    installmentSchemeId: installmentScheme((product.Premium || {}).installmentScheme),
    cessionBeneficiary: creditor ? creditor.id : null,
    masterCode: main.masterCode || CFG.product,
    commercial: main.commercial,
    alias: args.batchId ? `${CFG.importName} lote ${args.batchId}` : null,
    version: 1,
    option: 1,
    indexationPeriod: 1,
    indexationStart: 1,
    indexationFrequency: 1,
    productCode: CFG.product,
    Coverages: coverages.map(c => ({
      name: c.name, code: String(c.code), basic: c.basic, description: c.description, mandatory: c.mandatory,
      limit: 0, premium: 0, deductible: 0, insurability: c.insurability, commercialName: c.commercialName,
      internalBonus: c.internalBonus || false, appliesTo: c.appliesTo, number: c.number,
      restrictUserEdition: c.restrictUserEdition, minLimit: -1, maxLimit: -1, loading: 0, extraPremium: 0,
      internalPremium: 0, periodicity: 0, ofnCode: 0
    }))
  };
  const values = {
    tbseriechasis: vehicle.serieChasis,
    tbnumprestamo: vehicle.noPrestamo,
    cmbMarca: code(vehicle.marca),
    tbseriemotor: vehicle.serieMotor,
    cmbtipo: code(vehicle.tipo),
    cmbModelo: code(vehicle.modelo),
    tbplaca: vehicle.placa,
    cmbUsoAuto: code(vehicle.uso),
    txtAnioAuto: vehicle.anio === null ? "" : String(vehicle.anio),
    tbVIN: vehicle.vin,
    txtColorAuto: vehicle.color,
    cmbNoTieneVIN: vehicle.vin ? "No" : "Si",
    txtTransmision: code(vehicle.transmision),
    cmbCilindrosAuto: code(vehicle.cilindros),
    txtPuertasAuto: vehicle.puertas === null ? "" : String(vehicle.puertas),
    txtPuestosAuto: vehicle.puestos === null ? "" : String(vehicle.puestos),
    cmbCombustibleAuto: code(vehicle.combustible),
    txtSA: String(vehicle.valor),
    tbextras: vehicle.descripcion,
    hiddenCobtar: JSON.stringify(cobtar),
    hiddenUbicacion: location(insured.id)
  };
  form.forEach(f => {
    if (f.name && Object.prototype.hasOwnProperty.call(values, f.name) && values[f.name] !== "") f.userData = [values[f.name]];
  });

  if (simulate) {
    const shown = {};
    Object.keys(entity).forEach(k => { if (k !== "MainInsured" && k !== "Insureds") shown[k] = entity[k]; });
    return { ok: true, simulate: true, msg: `Fila válida: se emitiría una póliza ${CFG.product} para el ente ${insured.id}.`, policy: shown, insured: insuredName, objectValues: values };
  }

  // 3. Oferta, objeto asegurado y flujo de emisión
  step = "creación de la oferta";
  doCmd({ cmd: "RepoLifePolicy", data: { operation: "ADD", entity } });
  if (!RepoLifePolicy.ok) fail(`No se pudo crear la oferta: ${RepoLifePolicy.msg}`);
  policy = [].concat(RepoLifePolicy.outData || []).pop();
  if (!policy || !policy.id) fail("La creación de la oferta no devolvió su id.");

  step = "objeto asegurado";
  doCmd({ cmd: "RepoInsuredObject", data: { operation: "ADD", entity: { lifePolicyId: policy.id, objectDefinitionId: definition.id, jValues: JSON.stringify(form) } } });
  if (!RepoInsuredObject.ok) fail(`No se pudo crear el objeto asegurado: ${RepoInsuredObject.msg}`);

  step = "valores por defecto";
  if (policy.processId) advance();

  step = "cotización";
  doCmd({ cmd: "QuotePolicy", data: { policyId: policy.id, dbMode: true, save: true, action: "QUOTE" } });
  if (!QuotePolicy.ok) fail(`La cotización fue rechazada: ${QuotePolicy.msg}`);
  const quoted = quotedCoverages();
  const premium = Math.round(quoted.reduce((s, c) => s + (Number(c.premium) || 0), 0) * 100) / 100;
  const zero = quoted.filter(c => !(Number(c.premium) > 0) && !zeroByDesign(c.code)).map(c => `${c.code} ${c.name}`);
  if (zero.length) fail(`La tarifa no dio prima para ${zero.join(", ")} (revise Año, mvalorOA y los valores _CTARIFA).`);
  if (!(premium > 0)) fail(`La tarifa de ${CFG.product} devolvió prima ${premium}.`);

  step = "generación de la oferta";
  if (policy.processId) {
    for (let i = 0; i < 3 && currentStep() !== ISSUE_STEP; i++) advance();
    if (currentStep() !== ISSUE_STEP) fail(`El flujo no llegó a «${ISSUE_STEP}» (quedó en «${currentStep()}»).`);
  }
  const offers = query(`SELECT COUNT(*) AS n FROM Document WHERE LifePolicyid = ${policy.id} AND name LIKE '${OFFER_DOCUMENT}'`);
  if (!(Number((offers[0] || {}).n) > 0)) fail("No se generó el documento de la oferta.");

  step = "emisión";
  doCmd({ cmd: "IssuePolicy", data: { policyId: policy.id } });
  if (!IssuePolicy.ok) fail(`La emisión fue rechazada: ${IssuePolicy.msg}`);
  doCmd({ cmd: "LoadEntity", data: { entity: "LifePolicy", filter: `id=${policy.id}`, fields: "id, code, active, entityState", noTracking: true } });
  const issued = LoadEntity.outData || {};
  if (!issued.active) fail(`La póliza quedó en estado ${issued.entityState || "desconocido"} en lugar de emitida.`);

  return { ok: true, msg: `Póliza ${issued.code} (${CFG.product}) emitida, id ${policy.id}, prima ${premium}.`, policyId: policy.id, code: issued.code, premium };

} catch (error) {
  const reason = String(error && error.message ? error.message : error).replace(/^@/, "");
  let where = "";
  if (policy && policy.id) {
    let policyCode = policy.code || "";
    try { doCmd({ cmd: "LoadEntity", data: { entity: "LifePolicy", filter: `id=${policy.id}`, fields: "id, code", noTracking: true } }); policyCode = (LoadEntity.outData || {}).code || policyCode; } catch (e) { /* sin número */ }
    where = `Oferta ${policyCode ? policyCode + " " : ""}(id ${policy.id}) creada pero NO emitida; falló en ${step}. `;
  }
  throw new Error(`@${CFG.tag}: ${where}${reason}`);
}

// ---------------------------------------------------------------------------------------------
// Lectura de la fila

function cell(field) {
  const v = row[field];
  return v === null || v === undefined ? "" : String(v).trim();
}

function fail(message) {
  throw new Error(message);
}

// ---------------------------------------------------------------------------------------------
// Validaciones

function checkInsured(value) {
  if (!value) { errors.push("casegurado es obligatorio."); return null; }
  if (!/^\d+$/.test(value) || Number(value) === 0) { errors.push(`casegurado '${value}' debe ser numérico (código del ente asegurado).`); return null; }
  const found = query(`SELECT id, name, middleName, surname1, surname2, cnp, nationalId, passport, receiptTypeCode FROM Contact WHERE id = ${Number(value)}`);
  if (!found.length) { errors.push(`casegurado ${value} no existe.`); return null; }
  return found[0];
}

function checkCreditor(value) {
  if (!value || /^0+$/.test(value)) return null;
  if (!/^\d+$/.test(value)) { errors.push(`cacreedor '${value}' debe ser numérico (código del ente acreedor).`); return null; }
  const found = query(`SELECT id FROM Contact WHERE id = ${Number(value)}`);
  if (!found.length) { errors.push(`cacreedor ${value} no existe.`); return null; }
  return found[0];
}

function checkTerm(a, b, main) {
  if (!a || !b) return null;
  if (!(a.iso < b.iso)) { errors.push(`Fdesde (${a.text}) debe ser menor que Fhasta (${b.text}).`); return null; }
  const t = termOf(a, b);
  const min = durationMonths(main.minDuration);
  const max = durationMonths(main.maxDuration);
  if (min !== null && t.totalMonths < min) errors.push(`La vigencia ${a.text} - ${b.text} es menor que el plazo mínimo del producto (${monthsText(min)}).`);
  if (max !== null && (t.totalMonths > max || (t.totalMonths === max && t.days > 0))) errors.push(`La vigencia ${a.text} - ${b.text} supera el plazo máximo del producto (${monthsText(max)}).`);
  return t;
}

function checkVehicle(lob, formField) {
  const v = {};
  const required = name => formField(name).required === true;
  v.marca = pick("Marca", cell("marca"), table("tbMarcas").filter(r => r.cramo === lob).map(r => ({ code: r.cmarca, name: r.xmarca })), required("cmbMarca"));
  if (v.marca) {
    const models = table("tbModelos").filter(r => r.cramo === lob && r.cmarca === v.marca.code).map(r => ({ code: r.cmodelo, name: r.xmodelo }));
    v.modelo = pick("Modelo", cell("modelo"), models, required("cmbModelo"), `de la marca ${v.marca.name}`);
  } else {
    v.modelo = null;
    if (cell("modelo")) errors.push(`Modelo '${cell("modelo")}' no se puede validar sin una Marca válida.`);
    else if (required("cmbModelo")) errors.push("Modelo es obligatorio.");
  }
  v.tipo = pick("Tipo", cell("tipo"), table("tblTipoPorRamo").filter(r => r.cramo === lob).map(r => ({ code: r.ctipo, name: r.xtipo })), required("cmbtipo"));
  v.uso = pick("Uso_Vehiculo", cell("usoVehiculo"), table("tblUsoPorRamo").filter(r => r.cramo === lob).map(r => ({ code: r.cagrupa, name: r.xdescripcion_l })), required("cmbUsoAuto"));
  v.transmision = pick("Transmision", cell("transmision"), formOptions(formField("txtTransmision")), required("txtTransmision"));
  v.cilindros = pick("Cilindros", cell("cilindros"), formOptions(formField("cmbCilindrosAuto")), required("cmbCilindrosAuto"));
  v.combustible = pick("Combustible", cell("combustible"), formOptions(formField("cmbCombustibleAuto")), required("cmbCombustibleAuto"));
  v.anio = number("Año", cell("anio"), formField("txtAnioAuto"), { integer: true });
  v.valor = number("mvalorOA", cell("mvalorOA"), formField("txtSA"), { required: true, positive: true });
  v.puertas = number("Puertas", cell("puertas"), formField("txtPuertasAuto"), { integer: true });
  v.puestos = number("Puestos", cell("puestos"), formField("txtPuestosAuto"), { integer: true });
  v.color = text("Color", cell("color"), formField("txtColorAuto"));
  v.serieChasis = text("Serie_Chasis", cell("serieChasis"), formField("tbseriechasis"));
  v.serieMotor = text("Serie_Motor", cell("serieMotor"), formField("tbseriemotor"));
  v.placa = text("Placa", cell("placa"), formField("tbplaca"));
  v.vin = text("VIN", cell("vin"), formField("tbVIN"), { optional: true });
  v.noPrestamo = text("No_Prestamo", cell("noPrestamo"), formField("tbnumprestamo"));
  v.descripcion = text("Descripcion", cell("descripcion"), formField("tbextras"));
  return v;
}

function checkCoverages(product) {
  const list = [];
  const productCoverages = product.Coverages || [];
  CFG.coverages.forEach(cov => {
    const header = `Cob_${cov}`;
    const raw = cell(`cob${cov}`);
    const pc = productCoverages.find(c => String(c.code) === cov);
    if (!pc) { errors.push(`La cobertura ${cov} de la columna ${header} no existe en el producto ${CFG.product}.`); return; }
    const flag = coverageFlag(raw, cov);
    if (flag === null) { errors.push(`${header} '${raw}' no es una marca válida (use 1/0, S/N, SI/NO, X o el código de la cobertura).`); return; }
    if (pc.mandatory && !flag) errors.push(`La cobertura obligatoria ${cov} ${pc.name} debe venir marcada en ${header}.`);
    if (flag) list.push(pc);
  });
  productCoverages.filter(c => c.mandatory && CFG.coverages.indexOf(String(c.code)) < 0)
    .forEach(c => errors.push(`La cobertura obligatoria ${c.code} ${c.name} del producto no tiene columna en la importación.`));
  if (!list.length) errors.push("El vehículo no tiene coberturas marcadas.");
  return list;
}

function coverageFlag(raw, cov) {
  const s = norm(raw);
  if (s === "" || s === "0" || s === "N" || s === "NO" || s === "FALSE") return false;
  if (s === "1" || s === "S" || s === "SI" || s === "X" || s === "TRUE" || s === "Y" || s === "YES" || sameCode(s, cov)) return true;
  return null;
}

// Campos de tarifa de cada cobertura (tabla cfgCobtarAuto, la misma que dibuja la pestaña Tarifas del formulario)
function checkTariffFields(coverages) {
  const cfg = table("cfgCobtarAuto").filter(r => norm(r.productCode) === norm(CFG.product));
  const out = [];
  coverages.forEach(pc => {
    const fields = cfg.filter(r => String(r.coverageCode) === String(pc.code) && r.name && r.name !== "none");
    if (!fields.length) return;
    const entry = { coverageCode: Number(pc.code) };
    fields.forEach(fc => {
      const column = (CFG.tariffColumns[String(pc.code)] || {})[fc.name];
      let value = null;
      if (column) {
        const raw = cell(column.field);
        if (!raw) {
          if (String(fc.required).toLowerCase() === "true") errors.push(`${column.header} es obligatorio porque la cobertura ${pc.code} ${pc.name} está marcada.`);
        } else {
          value = typedValue(column.header, raw, fc);
        }
      }
      entry[fc.name] = value;
    });
    out.push(entry);
  });
  Object.keys(CFG.tariffColumns).forEach(cov => Object.keys(CFG.tariffColumns[cov]).forEach(name => {
    const column = CFG.tariffColumns[cov][name];
    if (!cfg.some(r => String(r.coverageCode) === cov && r.name === name)) errors.push(`La configuración de tarifas (cfgCobtarAuto) no tiene el campo ${name} de la cobertura ${cov} que alimenta ${column.header}.`);
    else if (cell(column.field) && !coverages.some(pc => String(pc.code) === cov)) errors.push(`${column.header} trae valor pero la cobertura ${cov} no está marcada.`);
  }));
  return out;
}

function typedValue(header, raw, fc) {
  const type = String(fc.type || "").toLowerCase();
  if (type === "select") {
    const hit = pick(header, raw, catalogOptions(fc.catalog), true);
    return hit ? hit.code : null;
  }
  if (type === "number") return number(header, raw, {}, {});
  if (type === "date") {
    const d = parseDate(header, raw, true);
    return d ? d.iso : null;
  }
  return raw;
}

function catalogOptions(catalog) {
  try {
    const clean = String(catalog || "").replace(/([{,]\s*)(\w+)\s*:/g, "$1\"$2\":").replace(/'/g, "\"");
    return (JSON.parse(clean || "[]") || []).map(o => ({ code: String(o.code), name: String(o.name) }));
  } catch (e) {
    return [];
  }
}

// El VIN no debe tener una póliza vigente (activa y con vigencia que se cruce) ni repetirse en el mismo archivo.
function checkVehicleDuplicates(v, start, end, definitionId) {
  const keys = [["tbVIN", "VIN", v.vin, "vin"]]
    .filter(k => k[2]).map(k => [k[0], k[1], vehicleKey(k[2]), k[3]]);
  if (!keys.length) return;
  inFileDuplicates(keys);
  if (!start || !end) return;
  const cond = keys.map(k => `(v.campo = '${k[0]}' AND v.valor = '${sqlText(k[2])}')`).join(" OR ");
  const found = query(`SELECT TOP 5 l.id, l.code, l.productCode, CONVERT(varchar(10), l.start, 103) AS desde, CONVERT(varchar(10), l.[end], 103) AS hasta, v.campo FROM LifePolicy l JOIN InsuredObject io ON io.lifePolicyId = l.id AND io.objectDefinitionId = ${Number(definitionId)} CROSS APPLY (SELECT JSON_VALUE(f.value, '$.name') AS campo, UPPER(REPLACE(LTRIM(RTRIM(JSON_VALUE(f.value, '$.userData[0]'))), ' ', '')) AS valor FROM OPENJSON(CASE WHEN ISJSON(io.jValues) = 1 THEN io.jValues END) f) v WHERE l.active = 1 AND CONVERT(date, l.[end]) > '${start.iso}' AND CONVERT(date, l.start) < '${end.iso}' AND (${cond})`);
  found.forEach(p => {
    const k = keys.find(x => x[0] === p.campo) || [p.campo, p.campo];
    errors.push(`El vehículo ya tiene la póliza vigente ${p.code} (${p.productCode}, ${p.desde} a ${p.hasta}) con el mismo ${k[1]}.`);
  });
}

function inFileDuplicates(keys) {
  if (!args.batchId) return;
  doCmd({ cmd: "LoadEntity", data: { entity: "Batch", filter: `id = ${Number(args.batchId)}`, fields: "id, jData", noTracking: true } });
  let rows = [];
  try { rows = JSON.parse((LoadEntity.outData || {}).jData || "[]"); } catch (e) { return; }
  keys.forEach(k => {
    const index = CFG.columns.findIndex(c => c[1] === k[3]);
    if (index < 0) return;
    const count = rows.filter(r => Array.isArray(r) && r.length > index && r[index] !== null && r[index] !== undefined && vehicleKey(String(r[index])) === k[2]).length;
    if (count > 1) errors.push(`${k[1]} ${k[2]} se repite en ${count} filas de este archivo: se rechazan todas, deje una sola.`);
  });
}

function vehicleKey(value) {
  return String(value).toUpperCase().replace(/\s+/g, "");
}

// ---------------------------------------------------------------------------------------------
// Catálogos y formatos

function pick(label, value, items, required, scope) {
  if (!value) { if (required) errors.push(`${label} es obligatorio.`); return null; }
  const byCode = items.filter(i => sameCode(i.code, value));
  if (byCode.length === 1) return byCode[0];
  const key = matchKey(value);
  const byName = byCode.length ? [] : items.filter(i => matchKey(i.name) === key);
  if (byName.length === 1) return byName[0];
  if (byCode.length > 1 || byName.length > 1) {
    errors.push(`${label} '${value}' es ambiguo (códigos ${(byCode.length ? byCode : byName).map(i => i.code).join(", ")}): use el código.`);
    return null;
  }
  const hint = items.length && items.length <= 15 ? ` Valores válidos: ${items.map(i => i.code === i.name ? i.code : `${i.code} = ${i.name}`).join("; ")}.` : "";
  errors.push(`${label} '${value}' no corresponde a su catálogo${scope ? " " + scope : ""}.${hint}`);
  return null;
}

function sameCode(a, b) {
  const x = String(a === null || a === undefined ? "" : a).trim();
  const y = String(b === null || b === undefined ? "" : b).trim();
  if (!x || !y) return false;
  if (x.toUpperCase() === y.toUpperCase()) return true;
  return /^\d+$/.test(x) && /^\d+$/.test(y) && Number(x) === Number(y);
}

function norm(value) {
  return String(value === null || value === undefined ? "" : value).toUpperCase()
    .replace(/[ÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜÑ]/g, ch => ACCENTS[ch]).replace(/\s+/g, " ").trim();
}

// Textos de montos ("5,000.00 / 10,000.00") se comparan por sus números
function matchKey(value) {
  const s = norm(value);
  if (/^[\d.,\s\/]+$/.test(s) && /\d/.test(s)) {
    return s.split("/").map(p => { const n = Number(p.replace(/[\s,]/g, "")); return isNaN(n) ? p.trim() : String(n); }).join("/");
  }
  return s;
}

function formOptions(field) {
  return (field.values || []).filter(o => String(o.value || "") !== "").map(o => ({ code: String(o.value), name: String(o.label || o.value) }));
}

function periodicityOptions(product) {
  const out = [];
  const add = (c, n) => { if (c && !out.some(o => o.code === String(c))) out.push({ code: String(c), name: String(n || c) }); };
  const walk = item => {
    if (!item) return;
    if (typeof item === "string") { add(item, item); return; }
    if (Array.isArray(item)) { item.forEach(walk); return; }
    if (item.custom) walk(item.custom);
    if (item.expression || item.code || item.value) add(item.expression || item.code || item.value, item.name || item.label);
  };
  walk((product.Premium || {}).periodicity);
  if (!out.length) add((product.Premium || {}).defaultPeriodicity || "m12", "Anual");
  return out;
}

function number(label, raw, field, opts) {
  const o = opts || {};
  if (!raw) { if (o.required || field.required === true) errors.push(`${label} es obligatorio.`); return null; }
  const s = raw.replace(/\s/g, "");
  if (!/^-?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/.test(s)) { errors.push(`${label} '${raw}' debe ser numérico.`); return null; }
  const n = Number(s.replace(/,/g, ""));
  if (o.integer && Math.floor(n) !== n) { errors.push(`${label} '${raw}' debe ser un número entero.`); return null; }
  if (o.positive && !(n > 0)) { errors.push(`${label} '${raw}' debe ser mayor que cero.`); return null; }
  const min = field.min !== undefined && field.min !== null && field.min !== "" ? Number(field.min) : null;
  const max = field.max !== undefined && field.max !== null && field.max !== "" ? Number(field.max) : null;
  if (min !== null && n < min) { errors.push(`${label} '${raw}' es menor que el mínimo permitido (${min}).`); return null; }
  if (max !== null && n > max) { errors.push(`${label} '${raw}' supera el máximo permitido (${max}).`); return null; }
  return n;
}

function text(label, raw, field, opts) {
  if (!raw) { if (field.required === true && !(opts && opts.optional)) errors.push(`${label} es obligatorio.`); return ""; }
  const max = Number(field.maxlength || 0);
  if (max > 0 && raw.length > max) { errors.push(`${label} '${raw}' supera el largo máximo de ${max} caracteres.`); return ""; }
  if (/[\u0000-\u001f]/.test(raw)) { errors.push(`${label} contiene caracteres no válidos.`); return ""; }
  return raw;
}

function parseDate(label, raw, required) {
  if (!raw) { if (required) errors.push(`${label} es obligatoria.`); return null; }
  // Excel puede enviar la fecha como número serial (p. ej. 46692), incluso si la celda está formateada como fecha.
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (isFinite(serial) && serial > 0) {
      const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);
      if (!isNaN(dt.getTime())) {
        const y = dt.getUTCFullYear(), mo = dt.getUTCMonth() + 1, d = dt.getUTCDate();
        return { y: y, m: mo, d: d, iso: `${y}-${pad(mo)}-${pad(d)}`, text: raw };
      }
    }
  }
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (!m) { errors.push(`${label} '${raw}' debe tener formato dd/MM/yyyy.`); return null; }
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) { errors.push(`${label} '${raw}' no es una fecha válida.`); return null; }
  return { y: y, m: mo, d: d, iso: `${y}-${pad(mo)}-${pad(d)}`, text: raw };
}

function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

function addMonths(p, n) {
  const first = new Date(Date.UTC(p.y, p.m - 1 + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(p.d, last));
}

function termOf(a, b) {
  const bt = Date.UTC(b.y, b.m - 1, b.d);
  let months = (b.y - a.y) * 12 + (b.m - a.m);
  while (months > 0 && addMonths(a, months) > bt) months--;
  const days = Math.round((bt - addMonths(a, months)) / 86400000);
  return { years: Math.floor(months / 12), months: months % 12, days: days, totalMonths: months };
}

function durationMonths(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value * 12;
  const s = String(value).trim();
  let m = /^(\d+)m(\d+)$/.exec(s);
  if (m) return Number(m[1]) * 12 + Number(m[2]);
  m = /^(\d+)$/.exec(s);
  return m ? Number(m[1]) * 12 : null;
}

function monthsText(months) {
  const y = Math.floor(months / 12), m = months % 12;
  return [y ? `${y} año${y > 1 ? "s" : ""}` : "", m ? `${m} mes${m > 1 ? "es" : ""}` : ""].filter(Boolean).join(" y ") || "0 meses";
}

// ---------------------------------------------------------------------------------------------
// Lecturas del ambiente

function query(sql) {
  doCmd({ cmd: "DoQuery", data: { sql: sql } });
  if (!DoQuery.ok) fail(`Consulta fallida: ${DoQuery.msg}`);
  return JSON.parse(JSON.stringify(DoQuery.outData || []));
}

function table(name) {
  if (cache[name]) return cache[name];
  doCmd({ cmd: "GetFullTable", data: { table: name } });
  if (!GetFullTable.ok) fail(`No se pudo leer la tabla ${name}: ${GetFullTable.msg}`);
  const data = JSON.parse(JSON.stringify(GetFullTable.outData || []));
  const seen = {};
  const keys = (data[0] || []).map(h => {
    const k = String(h === null || h === undefined ? "" : h).trim();
    seen[k] = (seen[k] || 0) + 1;
    return seen[k] > 1 ? `${k}_${seen[k]}` : k;
  });
  cache[name] = data.slice(1).map(r => {
    const o = {};
    keys.forEach((k, i) => { o[k] = r[i] === null || r[i] === undefined ? "" : String(r[i]).trim(); });
    return o;
  });
  return cache[name];
}

function contactOf(id) {
  doCmd({ cmd: "GetContacts", data: { filter: `id=${Number(id)}` } });
  return (GetContacts.outData || [])[0] || null;
}

function code(item) {
  return item ? item.code : "";
}

function stripCompanyPrefix(value) {
  const s = String(value || "");
  return s.length <= 3 ? s : s.slice(3);
}

function installmentScheme(schemeCode) {
  if (!schemeCode) return null;
  const found = query(`SELECT id FROM InstallmentScheme WHERE code = '${sqlText(schemeCode)}'`);
  return found.length ? found[0].id : null;
}

// Ubicación del asegurado, como la arma el formulario de auto en hiddenUbicacion
function location(contactId) {
  const res = doCmd({ cmd: "RepoContactAddress", data: { operation: "GET", filter: `contactId=${Number(contactId)}`, noTracking: true } });
  const a = ((res && res.outData) || [])[0];
  if (!a) return "";
  const esc = s => String(s === null || s === undefined ? "" : s).replace(/'/g, "''");
  const lookup = (command, filter) => {
    if (!filter) return {};
    const r = doCmd({ cmd: command, data: { operation: "GET", filter: filter, noTracking: true } });
    return ((r && r.outData) || [])[0] || {};
  };
  const country = a.country || "", state = a.state || "", city = a.city || "", sector = a.sector || a.corregimiento || "";
  const cat = (c, r) => ({ codigo: String(c || ""), descripcion: String((r && r.name) || "") });
  return JSON.stringify({
    pais: cat(country, lookup("RepoCountryCatalog", country && `code='${esc(country)}'`)),
    provincia: cat(state, lookup("RepoStateCatalog", country && state && `countryCode='${esc(country)}' AND code='${esc(state)}'`)),
    ciudad: cat(city, lookup("RepoCityCatalog", state && city && `stateCode='${esc(state)}' AND code='${esc(city)}'`)),
    corregimiento: cat(sector, lookup("RepoSectorCatalog", city && sector && `cityCode='${esc(city)}' AND code='${esc(sector)}'`)),
    direccion: [a.address1, a.address2].filter(Boolean).join(", ")
  });
}

function advance() {
  doCmd({ cmd: "GotoStep", data: { procesoId: policy.processId, estado: "_next" } });
  if (!GotoStep.ok) fail(`El flujo no avanzó: ${GotoStep.msg}`);
}

function currentStep() {
  doCmd({ cmd: "LoadEntity", data: { entity: "Proceso", filter: `id=${policy.processId}`, fields: "id, estado", noTracking: true } });
  return (LoadEntity.outData || {}).estado;
}

function quotedCoverages() {
  doCmd({ cmd: "RepoLifePolicy", data: { operation: "GET", filter: `id=${policy.id}`, include: ["Coverages"], noTracking: true } });
  const pol = (RepoLifePolicy.outData || [])[0] || {};
  return (pol.Coverages || []).map(c => ({ code: String(c.code), name: c.name, premium: Number(c.premium) || 0 }));
}

// Una cobertura cuya tarifa vale 0 en todas sus filas (p. ej. SOBAT o asistencia) cotiza 0 por diseño
function zeroByDesign(cov) {
  const rows = table("tarificacionSIS9Auto").filter(r => norm(r.codigoplan) === norm(CFG.product) && String(r.ccobertura) === String(cov));
  if (!rows.length) return false;
  return rows.every(r => /^0+(\.0+)?$/.test(String(r.prima).trim()));
}

function sqlText(value) {
  return String(value).replace(/'/g, "''");
}
