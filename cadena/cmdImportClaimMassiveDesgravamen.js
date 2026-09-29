//block
//noreplace
/**
 * @chain    cmdImportClaimMassiveDesgravamen
 * @category MASIVO
 * @purpose  Operación por fila del import «CargaMasivaReclamosDesgravamen». Valida la fila completa y crea el
 *           reclamo en la póliza de IdPoliza igual que la vista 48 (InformaciónResumenDelReclamo): reclamante,
 *           causa + evento asegurado de SysInsuredEventsPerCoverage, ocurrencia, notificación, descripción, los
 *           formularios de Claim.customForms («Detalle del Siniestro» e «InformacionResumenDelReclamo») y un objeto
 *           afectado por cada cobertura marcada (cob_N = N), con el formulario que CustomClaimAffectedObjectConfig
 *           asigna a la cobertura (frmOAAseguradoColectivo), guardado en la sección «ObjetosAfectados» del reclamo
 *           como lo guarda la vista. Rechaza el reclamo duplicado: misma póliza, mismo asegurado (casegurado) y
 *           misma cobertura afectada. Los catálogos aceptan código o texto. Una fila con errores se rechaza con
 *           TODOS sus motivos. No crea reservas, pagos ni triggers.
 * @context  { row:{ajustador, reclamante, causa, fSiniestro, provincia, ciudad, lugar, fNotificacionS,
 *           descripSiniestro, obserAdicional, idPoliza, poliza, casegurado, cedula, fNotificacionP, tipoPrestamo,
 *           monto, letra, saldo, razonFallecimiento, finiPrestamo, fFinPrestamo, edadIngreso, edadFallecimiento,
 *           fFallecimiento, clasificacionF, noPrestamo, cob_20, cob_24, cob_106 … cob_116}, batchId }
 * @mission  MSN-000047 (global1) — 2026-09-29: versión original «cmdImportClaimMassive».
 * @mission  MSN-000052 (global1) — 2026-09-29: renombrada, estructura Desgravamen y objetos afectados.
 */

const TAG = "Reclamo";
const IMPORT_NAME = "CargaMasivaReclamosDesgravamen";
const DEFAULT_COUNTRY = "591";
const DETAIL_SECTION = "Detalle del Siniestro";
const EXTRA_SECTION = "InformacionResumenDelReclamo";
const AFFECTED_SECTION = "ObjetosAfectados";
const AFFECTED_FORM = "frmOAAseguradoColectivo";
const COVERAGE_CODES = ["20", "24", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116"];
const FIELDS = ["ajustador", "reclamante", "causa", "fSiniestro", "provincia", "ciudad", "lugar", "fNotificacionS",
  "descripSiniestro", "obserAdicional", "idPoliza", "poliza", "casegurado", "cedula", "fNotificacionP", "tipoPrestamo",
  "monto", "letra", "saldo", "razonFallecimiento", "finiPrestamo", "fFinPrestamo", "edadIngreso", "edadFallecimiento",
  "fFallecimiento", "clasificacionF", "noPrestamo"].concat(COVERAGE_CODES.map(c => "cob_" + c));

const args = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});
const errors = [];

try {
  const raw = args.row || {};
  const r = {};
  FIELDS.forEach(f => { r[f] = (raw[f] === null || raw[f] === undefined) ? "" : String(raw[f]).trim(); });

  // Una fila de encabezado que llegue como dato no es un reclamo.
  if (norm(r.fSiniestro) === "FSINIESTRO" || norm(r.idPoliza) === "IDPOLIZA") return { ok: true, msg: "Encabezado omitido." };

  const today = new Date().toISOString().slice(0, 10);

  // 1. Póliza (IdPoliza; Poliza se valida contra ella)
  const policy = findPolicy(r.idPoliza, r.poliza);

  // 2. Fechas del reclamo
  const occurrence = parseOccurrence(r.fSiniestro);
  const notificationDate = required(r.fNotificacionS, "FNotificacionS") ? parseDate(r.fNotificacionS, "FNotificacionS") : null;
  if (occurrence && occurrence.date > today) errors.push(`FSiniestro ${occurrence.date} no puede ser posterior a hoy (${today}).`);
  if (notificationDate && notificationDate > today) errors.push(`FNotificacionS ${notificationDate} no puede ser posterior a hoy (${today}).`);
  if (occurrence && notificationDate && notificationDate < occurrence.date) errors.push(`FNotificacionS ${notificationDate} no puede ser anterior a FSiniestro ${occurrence.date}.`);
  // 3. Catálogos del reclamo (código o texto)
  const stage = { code: "1", name: "NOTIFICADO" };
  const event = policy && required(r.causa, "Causa") ? resolveEvent(r.causa, policy.productCode) : null;
  const adjuster = r.ajustador ? findAdjuster(r.ajustador) : null;
  const claimer = policy ? (r.reclamante ? findContact(r.reclamante, "Reclamante", false) : { id: Number(policy.holderId) }) : null;
  const geo = resolveGeo(r.provincia, r.ciudad);

  // 4. Coberturas marcadas (cob_N = N) y su formulario de objeto afectado
  const marked = markedCoverages(r);
  const coverages = policy && marked.length ? policyCoverages(policy, marked) : [];
  const rules = policy && coverages.length ? affectedRules(policy, coverages) : {};

  // 4b. Numeración: si el contador de Main.claimCode no existe, el sistema guarda el reclamo SIN número y falla.
  if (policy) checkClaimCounters(policy.productCode);

  // 5. Asegurado y datos del préstamo (formulario del objeto afectado)
  const insured = required(r.casegurado, "casegurado") ? findContact(r.casegurado, "casegurado", true) : null;
  const objectValues = insuredObjectValues(r, insured, policy, geo, coverages, today);

  // 6. Duplicado: misma póliza + mismo asegurado + misma cobertura afectada
  if (policy && insured && coverages.length && errors.length === 0) checkDuplicates(policy, insured, coverages);

  if (errors.length) fail(errors.join(" | "));

  // 7. Formularios del reclamo y objetos afectados, como los guarda la vista 48
  const values = {
    ajustadorName: adjuster ? adjuster.name : "",
    ajustadorEmail: adjuster ? (adjuster.email || "") : "",
    hiddenAjustador: adjuster ? String(adjuster.id) : "",
    descripcion: r.obserAdicional,
    cmbProvincia: geo.state ? String(geo.state.code) : "",
    cmbMunicipio: geo.city ? String(geo.city.code) : "",
    lugar: r.lugar
  };
  const jCustomForms = buildCustomForms(values, coverages, rules, objectValues);

  // 8. Creación del reclamo (mismo payload que la vista 48)
  const notification = notificationDate === occurrence.date ? occurrence.iso : `${notificationDate}T00:00:00Z`;
  const claimerId = Number(claimer.id);
  const entity = {
    lifePolicyId: Number(policy.id),
    claimerId: claimerId,
    nameOfPatient: String(claimerId),
    eventReason: event.reason.code,
    InsuredEvent: event.insured,
    elegibleCoverages: coverages.map(c => Number(c.id)).join(","),
    claimType: String(policy.policyType || "I").trim() || "I",
    stageCode: String(stage.code),
    occurrence: occurrence.iso,
    notification: notification,
    created: notification,
    id: 0,
    description: r.descripSiniestro,
    jCustomForms: jCustomForms,
    contactId: claimerId,
    jMap: JSON.stringify({ cargaMasiva: {
      importacion: IMPORT_NAME, batchId: args.batchId || null, idPoliza: r.idPoliza, poliza: r.poliza,
      casegurado: String(insured.id), coberturas: coverages.map(c => String(c.code).trim()),
      cdgoPais: geo.country ? String(geo.country.code) : ""
    } })
  };
  doCmd({ cmd: "RepoClaim", data: { operation: "ADD", entity: entity } });
  if (!RepoClaim.ok) {
    const addMsg = translate(RepoClaim.msg);
    const partial = query(`SELECT TOP 1 id FROM Claim WHERE lifePolicyId=${policy.id} AND occurrence='${occurrence.stamp}' AND ISNULL(eventReason,'')='${sql(event.reason.code)}' AND created > DATEADD(minute,-10,GETUTCDATE()) ORDER BY id DESC`);
    if (partial.length) fail(`El reclamo quedó creado con id ${partial[0].id} pero el sistema informó un error: ${addMsg}. Revíselo antes de volver a cargar la fila.`);
    fail(`El sistema no creó el reclamo: ${addMsg}`);
  }
  const created = firstRow(RepoClaim.outData) || {};
  const claimId = created.id;
  const claimCode = created.code || claimId;
  return { ok: true, msg: `Reclamo ${claimCode} creado (id ${claimId}) en la póliza ${policy.code} con ${coverages.length} objeto(s) afectado(s): cobertura(s) ${coverages.map(c => String(c.code).trim()).join(", ")}.`, claimId: claimId, code: claimCode };

} catch (error) {
  const reason = error && error.message ? error.message : String(error);
  throw new Error(`@${TAG}: ${reason.replace(/^@/, "")}`);
}

// ---------------------------------------------------------------- helpers

function fail(message) { throw new Error(message); }

function required(value, label) {
  if (value) return true;
  errors.push(`${label} es obligatorio.`);
  return false;
}

function sql(value) { return String(value).replace(/'/g, "''"); }

function query(text) {
  doCmd({ cmd: "DoQuery", data: { sql: text } });
  if (!DoQuery.ok) fail(`Consulta fallida: ${DoQuery.msg}`);
  return JSON.parse(JSON.stringify(DoQuery.outData || []));
}

function firstRow(data) {
  if (!data) return null;
  if (typeof data.length === "number") return data.length ? JSON.parse(JSON.stringify(data[0])) : null;
  return JSON.parse(JSON.stringify(data));
}

function norm(value) {
  const map = { "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", "Ü": "U", "Ñ": "N" };
  return String(value === null || value === undefined ? "" : value).trim().toUpperCase()
    .replace(/[ÁÉÍÓÚÜÑ]/g, c => map[c]).replace(/\s+/g, " ");
}

function idKey(value) { return String(value === null || value === undefined ? "" : value).replace(/[\s\-.]/g, "").toUpperCase(); }

// Busca por código y, si no, por nombre (sin distinguir mayúsculas ni tildes).
function pick(rows, value, label, what) {
  const key = norm(value);
  let found = rows.filter(x => norm(x.code) === key);
  if (!found.length) found = rows.filter(x => norm(x.name) === key);
  if (found.length === 1) return found[0];
  if (found.length > 1) errors.push(`${label} '${value}' es ambiguo: coincide con ${found.length} ${what}s (${found.map(x => x.code).join(", ")}). Use el código.`);
  else errors.push(`${label} '${value}' no existe como ${what} (ni por código ni por nombre).`);
  return null;
}

// Tablas de configuración valor/texto (GetFullTable), por código o por texto.
function pickTable(table, value, label) {
  doCmd({ cmd: "GetFullTable", data: { table: table, filter: "1=1" } });
  if (!GetFullTable.ok) fail(`No se pudo leer la tabla ${table}: ${GetFullTable.msg}`);
  const rows = JSON.parse(JSON.stringify(GetFullTable.outData || [])).filter(x => Array.isArray(x) && x.length >= 2)
    .map(x => ({ code: String(x[0] === null ? "" : x[0]).trim(), name: String(x[1] === null ? "" : x[1]).trim() }))
    .filter(x => x.code && !(norm(x.code) === "VALOR" && norm(x.name) === "TEXTO"));
  return pick(rows, value, label, `valor de ${table}`);
}

function findPolicy(idText, codeText) {
  if (!idText) { errors.push("IdPoliza es obligatorio."); return null; }
  if (!/^\d+$/.test(idText)) { errors.push(`IdPoliza '${idText}' debe ser numérico.`); return null; }
  const cols = "id, code, lob, productCode, branchCode, active, start, [end], holderId, policyType, inactiveReason";
  const policy = query(`SELECT ${cols} FROM LifePolicy WHERE id=${Number(idText)}`)[0] || null;
  if (!policy) { errors.push(`IdPoliza ${idText} no existe.`); return null; }
  if (codeText && norm(policy.code) !== norm(codeText)) { errors.push(`Poliza '${codeText}' no corresponde a IdPoliza ${idText} (póliza ${policy.code}).`); return null; }
  if (!(policy.active === true || policy.active === 1)) errors.push(`La póliza ${policy.code} (id ${policy.id}) no está vigente${policy.inactiveReason ? ": " + policy.inactiveReason : ""}.`);
  if (!Number(policy.holderId)) errors.push(`La póliza ${policy.code} no tiene contratante.`);
  return policy;
}

// Fechas: DD/MM/AAAA (como la vista), AAAA-MM-DD o número de serie de Excel.
function parseDate(value, label) {
  const text = String(value).trim();
  let y, m, d, match;
  if ((match = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:[ T].*)?$/))) { d = +match[1]; m = +match[2]; y = +match[3]; }
  else if ((match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/))) { y = +match[1]; m = +match[2]; d = +match[3]; }
  else if (/^\d{5}(\.\d+)?$/.test(text)) {
    const serial = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(text)) * 86400000);
    y = serial.getUTCFullYear(); m = serial.getUTCMonth() + 1; d = serial.getUTCDate();
  } else { errors.push(`${label} '${text}' debe usar el formato DD/MM/AAAA.`); return null; }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) { errors.push(`${label} '${text}' no es una fecha válida.`); return null; }
  return `${y}-${pad(m)}-${pad(d)}`;
}

function optionalDate(value, label) { return value ? (parseDate(value, label) || "") : ""; }

function pad(n) { const t = String(n); return t.length < 2 ? "0" + t : t; }

// FSiniestro: fecha con hora opcional (DD/MM/AAAA HH:mm, h:mm am/pm o fracción de Excel); sin hora, 00:00.
function parseOccurrence(dateText) {
  if (!required(dateText, "FSiniestro")) return null;
  const date = parseDate(dateText, "FSiniestro");
  if (!date) return null;
  let hour = 0, minute = 0;
  const text = String(dateText).trim();
  const serial = text.match(/^\d{5}(\.\d+)$/);
  const inline = text.match(/[ T](\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])?\.?\s*m?\.?$/i);
  if (serial) { const mins = Math.round(Number("0" + serial[1]) * 1440); hour = Math.floor(mins / 60) % 24; minute = mins % 60; }
  else if (inline) {
    hour = Number(inline[1]); minute = Number(inline[2]);
    const half = inline[3] ? inline[3].toLowerCase() : "";
    if (half) {
      if (hour < 1 || hour > 12) { errors.push(`FSiniestro '${dateText}': la hora no es válida.`); return null; }
      hour = half === "p" ? (hour % 12) + 12 : hour % 12;
    }
    if (hour > 23 || minute > 59) { errors.push(`FSiniestro '${dateText}': la hora no es válida.`); return null; }
  }
  const hhmm = `${pad(hour)}:${pad(minute)}`;
  return { date: date, iso: `${date}T${hhmm}:00Z`, stamp: `${date}T${hhmm}:00` };
}

function number(value, label, integer, min, max) {
  if (!value) return "";
  const text = String(value).replace(/\s/g, "");
  const normalized = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text) ? text.replace(/,/g, "") : text.replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) { errors.push(`${label} '${value}' debe ser numérico.`); return ""; }
  const n = Number(normalized);
  if (integer && Math.floor(n) !== n) { errors.push(`${label} '${value}' debe ser un número entero.`); return ""; }
  if ((min !== undefined && n < min) || (max !== undefined && n > max)) { errors.push(`${label} '${value}' debe estar entre ${min} y ${max}.`); return ""; }
  return String(n);
}

function contactName(c) {
  const parts = Number(c.isPerson) === 0 || c.isPerson === false
    ? [c.surname2 || c.name]
    : [c.name, c.middleName, c.surname1, c.surname2];
  return parts.map(p => String(p || "").trim()).filter(Boolean).join(" ").replace(/\s+/g, " ");
}

// Contacto por id (código SIS), por cédula/pasaporte o por nombre completo.
function findContact(value, label, personOnly) {
  const cols = "id, isPerson, name, middleName, surname1, surname2, cnp, nationalId, passport, gender, birth, state";
  let rows = [];
  if (/^\d+$/.test(value)) rows = query(`SELECT ${cols} FROM Contact WHERE id=${Number(value)}`);
  if (!rows.length) {
    const key = idKey(value);
    rows = query(`SELECT TOP 20 ${cols} FROM Contact WHERE REPLACE(REPLACE(ISNULL(cnp,''),'-',''),' ','')='${sql(key)}' OR REPLACE(REPLACE(ISNULL(nationalId,''),'-',''),' ','')='${sql(key)}' OR REPLACE(REPLACE(ISNULL(passport,''),'-',''),' ','')='${sql(key)}'`);
  }
  if (!rows.length) {
    const words = norm(value).split(" ").filter(w => w.length > 1);
    if (words.length >= 2) {
      const full = "(RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(middleName,''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,'')))";
      const candidates = query(`SELECT TOP 50 ${cols} FROM Contact WHERE ${words.map(w => `CHARINDEX(N'${sql(w)}', ${full}) > 0`).join(" AND ")}`);
      rows = candidates.filter(c => norm(contactName(c)) === norm(value));
    }
  }
  if (personOnly) rows = rows.filter(c => !(Number(c.isPerson) === 0 || c.isPerson === false));
  if (rows.length === 1) return Object.assign(rows[0], { fullName: contactName(rows[0]) });
  errors.push(rows.length > 1
    ? `${label} '${value}' es ambiguo (contactos ${rows.map(c => c.id).join(", ")}); use el código del contacto.`
    : `${label} '${value}' no existe como contacto${personOnly ? " persona" : ""} (ni por código, ni por cédula, ni por nombre).`);
  return null;
}

function findAdjuster(value) {
  const rows = query("SELECT c.id, CASE WHEN c.isPerson = 0 THEN c.surname2 ELSE c.name + ' ' + c.surname1 END name, c.email FROM Contact c WHERE EXISTS (SELECT 1 FROM ContactRole r WHERE r.contactId = c.id AND r.role = 'ADJ')");
  const key = norm(value);
  let found = /^\d+$/.test(key) ? rows.filter(x => String(x.id) === key) : [];
  if (!found.length) found = rows.filter(x => norm(x.name) === key || norm(x.email) === key);
  if (found.length === 1) return found[0];
  errors.push(found.length > 1
    ? `Ajustador '${value}' es ambiguo (${found.map(x => x.id).join(", ")}); use el id del contacto.`
    : `Ajustador '${value}' no es un contacto con rol de ajustador (ADJ).`);
  return null;
}

// Causa + evento asegurado, con la misma tabla que usa la vista 48 (SysInsuredEventsPerCoverage por producto).
function resolveEvent(value, productCode) {
  const reasons = query("SELECT code, name, ISNULL(disabled,0) disabled FROM EventReasonCatalog");
  const events = query("SELECT code, name, mode, ISNULL(disabled,0) disabled, hasHealthProcedures FROM InsuredEventCatalog");
  doCmd({ cmd: "GetFullTable", data: { table: "SysInsuredEventsPerCoverage", filter: "1=1" } });
  if (!GetFullTable.ok) fail(`No se pudo leer la tabla SysInsuredEventsPerCoverage: ${GetFullTable.msg}`);
  const matrix = JSON.parse(JSON.stringify(GetFullTable.outData || []));
  const header = (matrix[0] || []).map(h => String(h).trim());
  const iProduct = header.indexOf("Product"), iReason = header.indexOf("EventReason"), iEvents = header.indexOf("InsuredEvents");
  const mapping = {};
  matrix.slice(1).forEach(row => {
    if (String(row[iProduct] || "").trim() !== String(productCode).trim()) return;
    const reason = String(row[iReason] || "").trim();
    if (!reason) return;
    mapping[reason] = (mapping[reason] || []).concat(String(row[iEvents] || "").split(",").map(s => s.trim()).filter(Boolean));
  });
  const productHasTable = Object.keys(mapping).length > 0;
  const key = norm(value);
  const activeReasons = reasons.filter(x => !(x.disabled === true || x.disabled === 1));
  const activeEvents = events.filter(x => !(x.disabled === true || x.disabled === 1));
  const scopeReasons = productHasTable ? activeReasons.filter(x => mapping[x.code]) : activeReasons;

  let reason = null, insured = null;
  let hits = scopeReasons.filter(x => norm(x.code) === key);
  if (!hits.length) hits = scopeReasons.filter(x => norm(x.name) === key);
  if (hits.length > 1) { errors.push(`Causa '${value}' es ambigua (${hits.map(x => x.code).join(", ")}); use el código.`); return null; }
  if (hits.length === 1) reason = hits[0];
  else {
    // También se acepta el evento asegurado (código o nombre): la causa se deduce de la tabla del producto.
    const scopeEvents = productHasTable ? activeEvents.filter(e => Object.keys(mapping).some(k => mapping[k].indexOf(e.code) !== -1)) : activeEvents;
    let ev = scopeEvents.filter(x => norm(x.code) === key);
    if (!ev.length) ev = scopeEvents.filter(x => norm(x.name) === key);
    if (ev.length === 1) {
      insured = ev[0];
      const owners = productHasTable ? scopeReasons.filter(x => (mapping[x.code] || []).indexOf(insured.code) !== -1) : [];
      if (owners.length === 1) reason = owners[0];
      else if (owners.length > 1) { errors.push(`Causa '${value}' es un evento asegurado de varias causas (${owners.map(x => x.code).join(", ")}); indique la causa.`); return null; }
      else { errors.push(`Causa '${value}' es un evento asegurado sin causa configurada para el producto ${productCode}; indique la causa.`); return null; }
    } else {
      errors.push(productHasTable
        ? `Causa '${value}' no es una causa configurada para el producto ${productCode} (válidas: ${scopeReasons.map(x => x.code + " " + x.name).join(", ")}).`
        : `Causa '${value}' no existe como causa de reclamo (ni por código ni por nombre).`);
      return null;
    }
  }
  if (!insured && productHasTable) {
    const allowed = (mapping[reason.code] || []).map(code => activeEvents.find(e => e.code === code)).filter(Boolean);
    if (!allowed.length) { errors.push(`La causa ${reason.code} no tiene eventos asegurados activos para el producto ${productCode}.`); return null; }
    insured = allowed.find(e => norm(e.name).indexOf("SIN ASIGNAR") === 0) || allowed[0];
  }
  return {
    reason: reason,
    insured: insured ? { code: insured.code, name: String(insured.name).trim(), mode: insured.mode, disabled: false, hasHealthProcedures: insured.hasHealthProcedures === true || insured.hasHealthProcedures === 1 } : null
  };
}

// Provincia y Ciudad de Panamá (país por defecto de la vista), por código o por nombre.
function resolveGeo(stateText, cityText) {
  const result = { country: null, state: null, city: null };
  const countries = query(`SELECT code, name FROM CountryCatalog WHERE code='${DEFAULT_COUNTRY}'`);
  result.country = countries[0] || null;
  if (!result.country || (!stateText && !cityText)) return result;
  const states = query(`SELECT code, name FROM StateCatalog WHERE countryCode='${sql(result.country.code)}'`);
  if (stateText) result.state = pick(states, stateText, "Provincia", `provincia de ${result.country.name}`);
  if (!cityText) return result;
  if (stateText && !result.state) return result;
  const stateCodes = result.state ? [result.state.code] : states.map(s => s.code);
  if (!stateCodes.length) { errors.push(`Ciudad '${cityText}': el país ${result.country.name} no tiene provincias.`); return result; }
  const cities = query(`SELECT code, name, stateCode FROM CityCatalog WHERE stateCode IN (${stateCodes.map(c => "'" + sql(c) + "'").join(",")})`);
  result.city = pick(cities, cityText, "Ciudad", result.state ? `ciudad de ${result.state.name}` : "ciudad");
  if (result.city && !result.state) result.state = states.find(s => String(s.code) === String(result.city.stateCode)) || null;
  return result;
}

// cob_N: se afecta la cobertura N cuando la celda trae el mismo número N; vacía = no afectada.
function markedCoverages(r) {
  const codes = [];
  COVERAGE_CODES.forEach(code => {
    const value = r["cob_" + code];
    if (!value) return;
    const n = String(value).trim().replace(/\.0+$/, "");
    if (n === code) codes.push(code);
    else errors.push(`cob_${code} '${value}' no es válido: para afectar la cobertura escriba ${code}, o deje la celda vacía.`);
  });
  if (!codes.length && !errors.some(e => e.indexOf("cob_") === 0)) errors.push("Marque al menos una cobertura (cob_20 … cob_116) con su número.");
  return codes;
}

function policyCoverages(policy, codes) {
  const rows = query(`SELECT id, code, name FROM LifeCoverage WHERE lifePolicyId=${policy.id}`);
  const chosen = [];
  codes.forEach(code => {
    const hit = rows.filter(c => String(c.code).trim() === code);
    if (!hit.length) errors.push(`cob_${code}: la póliza ${policy.code} no tiene la cobertura ${code}.`);
    else chosen.push(hit[0]);
  });
  return chosen;
}

// CustomClaimAffectedObjectConfig: la regla más específica (ramo, producto, cobertura) del formulario del objeto.
function affectedRules(policy, coverages) {
  doCmd({ cmd: "GetFullTable", data: { table: "CustomClaimAffectedObjectConfig", filter: "1=1" } });
  if (!GetFullTable.ok) fail(`No se pudo leer la tabla CustomClaimAffectedObjectConfig: ${GetFullTable.msg}`);
  const matrix = JSON.parse(JSON.stringify(GetFullTable.outData || []));
  const header = (matrix[0] || []).map(h => String(h).trim().toLowerCase());
  const at = name => header.indexOf(name.toLowerCase());
  if (["Lob", "ProductCode", "CoverageCode", "FormId", "Description", "MaxObjects", "Active"].some(h => at(h) < 0)) fail("La tabla CustomClaimAffectedObjectConfig no tiene el formato esperado.");
  doCmd({ cmd: "GetForms", data: { filter: `name='${AFFECTED_FORM}'` } });
  const form = firstRow(GetForms.outData);
  if (!form || !form.id || !form.json) fail(`No existe el formulario ${AFFECTED_FORM}.`);
  const productCode = String(policy.productCode).trim(), lob = String(policy.lob).trim();
  const rules = matrix.slice(1).map(row => ({
    lob: String(row[at("Lob")] || "").trim(), product: String(row[at("ProductCode")] || "").trim(),
    coverage: String(row[at("CoverageCode")] || "").trim(), formId: Number(row[at("FormId")]),
    description: String(row[at("Description")] || "").trim(), active: String(row[at("Active")] || "").trim().toLowerCase()
  })).filter(x => x.active === "true" && x.lob === lob && x.formId === Number(form.id));
  const result = {};
  coverages.forEach(coverage => {
    const code = String(coverage.code).trim();
    const matches = rules.filter(x => (x.product === "*" || x.product === productCode) && (x.coverage === "*" || x.coverage === code));
    if (!matches.length) { errors.push(`La cobertura ${code} del producto ${productCode} no tiene el formulario ${AFFECTED_FORM} configurado en CustomClaimAffectedObjectConfig.`); return; }
    const score = x => Number(x.product !== "*") + Number(x.coverage !== "*");
    matches.sort((a, b) => score(b) - score(a));
    result[coverage.id] = { formId: Number(form.id), formName: form.name, json: form.json, description: matches[0].description || "Objeto afectado" };
  });
  return result;
}

// Valores del formulario frmOAAseguradoColectivo, con los mismos datos que carga su lupa de asegurado.
function insuredObjectValues(r, insured, policy, geo, coverages, today) {
  const loanType = required(r.tipoPrestamo, "TipoPrestamo") ? pickTable("tbTipoPrestamoColectivo", r.tipoPrestamo, "TipoPrestamo") : null;
  const deathCoverage = coverages.some(c => norm(c.name).indexOf("MUERTE") !== -1);
  const cause = r.clasificacionF ? pickTable("tbCausaFallecimiento", r.clasificacionF, "ClasificacionF") : null;
  if (deathCoverage && !r.clasificacionF) errors.push("ClasificacionF es obligatorio para una cobertura de muerte.");
  if (deathCoverage && !r.fFallecimiento) errors.push("FFallecimiento es obligatorio para una cobertura de muerte.");
  const fNotificacionP = required(r.fNotificacionP, "FNotificacionP") ? optionalDate(r.fNotificacionP, "FNotificacionP") : "";
  const finiPrestamo = required(r.finiPrestamo, "FiniPrestamo") ? optionalDate(r.finiPrestamo, "FiniPrestamo") : "";
  const fFinPrestamo = optionalDate(r.fFinPrestamo, "FFinPrestamo");
  const fFallecimiento = optionalDate(r.fFallecimiento, "FFallecimiento");
  if (finiPrestamo && fFinPrestamo && fFinPrestamo < finiPrestamo) errors.push(`FFinPrestamo ${fFinPrestamo} no puede ser anterior a FiniPrestamo ${finiPrestamo}.`);
  if (fFallecimiento && fFallecimiento > today) errors.push(`FFallecimiento ${fFallecimiento} no puede ser posterior a hoy (${today}).`);
  if (fNotificacionP && fNotificacionP > today) errors.push(`FNotificacionP ${fNotificacionP} no puede ser posterior a hoy (${today}).`);
  const monto = required(r.monto, "Monto") ? number(r.monto, "Monto", false, 0) : "";
  const letra = number(r.letra, "Letra", false, 0) || "0";
  const saldo = number(r.saldo, "Saldo", false, 0);
  const edadIngreso = required(r.edadIngreso, "EdadIngreso") ? number(r.edadIngreso, "EdadIngreso", true, 0, 120) : "";
  const edadFallecimiento = number(r.edadFallecimiento, "EdadFallecimiento", true, 0, 120);
  required(r.noPrestamo, "NoPrestamo");
  if (!insured) return null;
  const contactIds = [insured.cnp, insured.nationalId, insured.passport].filter(Boolean);
  if (r.cedula && contactIds.length && !contactIds.some(x => idKey(x) === idKey(r.cedula))) {
    errors.push(`Cedula '${r.cedula}' no corresponde al asegurado ${insured.id} ${insured.fullName} (${contactIds.join(" / ")}).`);
  }
  const cedula = r.cedula || contactIds[0] || "";
  if (!cedula) errors.push("Cedula es obligatoria: el asegurado no tiene cédula registrada.");
  const birth = insured.birth ? String(insured.birth).slice(0, 10) : "";
  const gender = insured.gender === "M" || insured.gender === "F" ? insured.gender : "";
  const province = geo.state ? String(geo.state.code) : (insured.state ? String(insured.state) : "");
  const calculatedDeathAge = ageAt(birth, fFallecimiento);
  return {
    colAsegurado: insured.fullName,
    colNoSis: String(insured.id),
    colNoCobis: insured.nationalId || "",
    colCedula: cedula,
    colSexo: gender,
    colFechaNacimiento: birth,
    colEdad: edadFallecimiento || ageAt(birth, fFallecimiento || today),
    colFechaInicioPrestamo: finiPrestamo,
    colFechaNotificacion: fNotificacionP,
    colFechaFinPrestamo: fFinPrestamo,
    colTipoPrestamo: loanType ? loanType.code : "",
    colEdadIngreso: edadIngreso,
    colFallecimiento: calculatedDeathAge === "" ? 0 : Number(calculatedDeathAge),
    colMonto: monto,
    colLetra: letra,
    colFechaFallecimiento: fFallecimiento,
    colSaldo: saldo,
    colCausaFallecimiento: cause ? cause.code : "",
    colRazonFallecimiento: r.razonFallecimiento,
    colNroPrestamo: r.noPrestamo,
    colSucursal: policy ? String(policy.branchCode || "").trim() : "",
    colProvincia: province,
    colContactId: String(insured.id)
  };
}

function ageAt(birth, date) {
  if (!birth || !date) return "";
  const b = birth.split("-").map(Number), d = date.split("-").map(Number);
  let age = d[0] - b[0];
  if (d[1] < b[1] || (d[1] === b[1] && d[2] < b[2])) age--;
  return age >= 0 ? String(age) : "";
}

// Reclamo duplicado: otro reclamo de la póliza con un objeto afectado del mismo asegurado en la misma cobertura.
function checkDuplicates(policy, insured, coverages) {
  const ids = coverages.map(c => Number(c.id));
  const claims = query(`SELECT id, code, jCustomForms FROM Claim WHERE lifePolicyId=${policy.id} AND jCustomForms LIKE '%${AFFECTED_SECTION}%'`);
  claims.forEach(claim => {
    let stored = [];
    try {
      const outer = JSON.parse(claim.jCustomForms || "{}");
      stored = JSON.parse(outer[AFFECTED_SECTION] || "[]");
    } catch (e) { stored = []; }
    (Array.isArray(stored) ? stored : []).forEach(entry => {
      if (!entry || ids.indexOf(Number(entry.coverageId)) === -1) return;
      const field = name => ((entry.fields || []).find(f => f && f.name === name) || {}).userData || [];
      const who = [].concat(field("colContactId"), field("colNoSis")).map(String);
      if (who.indexOf(String(insured.id)) === -1) return;
      const coverage = coverages.find(c => Number(c.id) === Number(entry.coverageId));
      errors.push(`Ya existe el reclamo ${claim.code || claim.id} (id ${claim.id}) de la póliza ${policy.code} para el asegurado ${insured.id} ${insured.fullName} en la cobertura ${String(coverage.code).trim()}.`);
    });
  });
}

// Claim.customForms del perfil (una sección por formulario, con userData) y la sección de objetos afectados.
function buildCustomForms(values, coverages, rules, objectValues) {
  doCmd({ cmd: "GetConfig", data: { path: "$.Claim.customForms" } });
  const entries = JSON.parse(JSON.stringify(GetConfig.outData || []));
  const outer = {};
  entries.forEach(entry => {
    if (!entry || !entry.name || !entry.formId) return;
    doCmd({ cmd: "GetForms", data: { filter: `id=${Number(entry.formId)}` } });
    const form = firstRow(GetForms.outData);
    if (!form || !form.json) fail(`No se encontró el formulario ${entry.formId} de la sección ${entry.name}.`);
    outer[entry.name] = JSON.stringify(fillFields(JSON.parse(form.json), values));
  });
  if (!outer[DETAIL_SECTION] || !outer[EXTRA_SECTION]) fail(`Claim.customForms debe tener las secciones «${DETAIL_SECTION}» y «${EXTRA_SECTION}».`);
  outer[AFFECTED_SECTION] = JSON.stringify(coverages.map(coverage => {
    const rule = rules[coverage.id];
    return {
      key: `AffectedObject_${coverage.id}_${rule.formId}_1`,
      coverageId: Number(coverage.id), formId: rule.formId, description: rule.description,
      formName: rule.formName, fields: fillFields(JSON.parse(rule.json), objectValues)
    };
  }));
  return JSON.stringify(outer);
}

function fillFields(fields, values) {
  fields.forEach(field => {
    if (!field || !field.name || field.type === "header" || field.type === "paragraph") return;
    const has = Object.prototype.hasOwnProperty.call(values, field.name);
    if (field.type === "checkbox-group") field.userData = has && values[field.name] === true ? ["true"] : [];
    else field.userData = [has && values[field.name] !== null && values[field.name] !== undefined ? String(values[field.name]) : ""];
  });
  return fields;
}

function checkClaimCounters(productCode) {
  const rows = query(`SELECT JSON_VALUE(configJson,'$.Main.claimCode') claimCode FROM Product WHERE code='${sql(productCode)}' AND ISJSON(configJson)=1`);
  const formula = rows.length ? String(rows[0].claimCode || "") : "";
  const counters = [];
  const pattern = /counter\s*:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(formula)) !== null) counters.push(match[1]);
  counters.forEach(code => {
    if (!query(`SELECT code FROM Counter WHERE code='${sql(code)}'`).length) {
      errors.push(`El producto ${productCode} no tiene el contador de numeración de reclamos '${code}': el reclamo quedaría sin número. Configure el contador antes de cargar esta fila.`);
    }
  });
}

function translate(message) {
  const text = String(message || "");
  const known = [
    [/Occurrence date must be before today/i, "La fecha de ocurrencia no puede ser posterior a hoy"],
    [/Notification date must be before today/i, "La fecha de notificación no puede ser posterior a hoy"],
    [/Occurrence date must be after policy start date/i, "La fecha de ocurrencia es anterior al inicio de la póliza"],
    [/Policy is inactive since/i, "La póliza está inactiva"],
    [/Policy not found/i, "La póliza no existe"]
  ];
  const hit = known.find(k => k[0].test(text));
  return hit ? `${hit[1]} (${text})` : text;
}
