//block
//noreplace
/**
 * @chain    cmdImportMassiveClaimFraude
 * @category MASIVO
 * @purpose  Operación por fila del import «CargaMasivaReclamoFraude» (producto FRAUDE, ramo 52). Valida la fila
 *           completa y crea el reclamo en la póliza de IdPoliza igual que la vista del reclamo: ajustador,
 *           reclamante, causa + evento asegurado de SysInsuredEventsPerCoverage, ocurrencia, notificación,
 *           descripción, los formularios de Claim.customForms que aplican al ramo y UN objeto afectado con el
 *           formulario que CustomClaimAffectedObjectConfig asigna (frmOATarjetaFraude) para la PRIMERA cobertura
 *           válida marcada (cob_N = N), guardado en la sección «ObjetosAfectados» como lo guarda la vista.
 *           Los catálogos aceptan código o texto. Una fila con errores se rechaza con TODOS sus motivos.
 *           Sin preprocesador, sin triggers, sin reservas ni pagos.
 * @context  { row:{ajustador, reclamante, causa, fSiniestro, provincia, ciudad, lugar, fNotificacionS,
 *           descripSiniestro, obserAdicional, idPoliza, poliza, casegurado, cedula, tipoTrajeta, cantSiniestro,
 *           monto, nombreComercio, tarjetaHabitante, tipoTransaccion, lugarSiniestro,
 *           cob_40, cob_401, cob_41, cob_43, cob_109, cob_110}, batchId }
 * @mission  MSN-000072 (global1) — 2026-10-01: creada a partir de cmdImportClaimMassiveDesgravamen (872).
 */

const TAG = "Reclamo";
const IMPORT_NAME = "CargaMasivaReclamoFraude";
const DEFAULT_COUNTRY = "591";
const DEFAULT_TEXT = "NINGUNA";
const MIN_DATE = "1900-01-01";
const DETAIL_SECTION = "Detalle del Siniestro";
const EXTRA_SECTION = "InformacionResumenDelReclamo";
const AFFECTED_SECTION = "ObjetosAfectados";
const AFFECTED_FORM = "frmOATarjetaFraude";
const COVERAGE_CODES = ["40", "401", "41", "43", "109", "110"];
const FIELDS = ["ajustador", "reclamante", "causa", "fSiniestro", "provincia", "ciudad", "lugar", "fNotificacionS",
  "descripSiniestro", "obserAdicional", "idPoliza", "poliza", "casegurado", "cedula", "tipoTrajeta", "cantSiniestro",
  "monto", "nombreComercio", "tarjetaHabitante", "tipoTransaccion", "lugarSiniestro"].concat(COVERAGE_CODES.map(c => "cob_" + c));

const CONTACT_COLS = "id, isPerson, name, middleName, surname1, surname2, cnp, nationalId, passport, gender, birth, state";
let affectedFormCache = null;

const args = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});
const errors = [];

try {
  const raw = args.row || {};
  const r = {};
  FIELDS.forEach(f => { r[f] = (raw[f] === null || raw[f] === undefined) ? "" : String(raw[f]).trim(); });

  // Una fila de encabezado que llegue como dato no es un reclamo.
  if (norm(r.fSiniestro) === "FSINIESTRO" || norm(r.idPoliza) === "IDPOLIZA") return { ok: true, msg: "Encabezado omitido." };

  const today = new Date().toISOString().slice(0, 10);
  if (!r.descripSiniestro) r.descripSiniestro = DEFAULT_TEXT;
  if (!r.obserAdicional) r.obserAdicional = DEFAULT_TEXT;

  // 1. Póliza (IdPoliza numérico, vigente; Poliza debe coincidir)
  const policy = findPolicy(r.idPoliza, r.poliza);

  // 2. Fechas del reclamo
  const occurrence = parseOccurrence(r.fSiniestro);
  const notificationDate = required(r.fNotificacionS, "FNotificacionS") ? parseDate(r.fNotificacionS, "FNotificacionS") : null;
  if (occurrence && occurrence.date > today) errors.push(`FSiniestro ${occurrence.date} no puede ser posterior a hoy (${today}).`);
  if (notificationDate && notificationDate > today) errors.push(`FNotificacionS ${notificationDate} no puede ser posterior a hoy (${today}).`);
  if (occurrence && notificationDate && notificationDate < occurrence.date) errors.push(`FNotificacionS ${notificationDate} no puede ser anterior a FSiniestro ${occurrence.date}.`);
  if (occurrence && policy && policy.start && occurrence.date < String(policy.start).slice(0, 10)) {
    errors.push(`FSiniestro ${occurrence.date} es anterior al inicio de vigencia de la póliza ${policy.code} (${String(policy.start).slice(0, 10)}).`);
  }
  // 3. Catálogos del reclamo (código o texto)
  const stage = { code: "1", name: "NOTIFICADO" };
  const adjuster = findAdjuster(r.ajustador);
  const claimer = required(r.reclamante, "Reclamante") ? findContact(r.reclamante, "Reclamante", false) : null;
  const event = policy && required(r.causa, "Causa") ? resolveEvent(r.causa, policy.productCode) : null;
  const geo = resolveGeo(r.provincia, r.ciudad);
  required(r.lugar, "Lugar");

  // 4. Asegurado (casegurado = código del ente) y su cédula
  const insured = findInsured(r.casegurado, r.cedula);

  // 5. Datos de la tarjeta (formulario del objeto afectado)
  const cardValues = cardFields(r);

  // 6. Coberturas: formato estricto; se usa la PRIMERA marcada que exista en la póliza y tenga objeto afectado.
  const marked = markedCoverages(r);
  const chosen = policy && marked.length ? firstValidCoverage(policy, marked) : null;

  // 6b. Numeración: si el contador de Main.claimCode no existe, el sistema guarda el reclamo SIN número y falla.
  if (policy) checkClaimCounters(policy.productCode);

  if (errors.length) fail(errors.join(" | "));

  // 8. Formularios del reclamo y objeto afectado, como los guarda la vista
  const values = {
    ajustadorName: adjuster.name,
    ajustadorEmail: adjuster.email || "",
    hiddenAjustador: String(adjuster.id),
    descripcion: r.obserAdicional,
    cmbProvincia: String(geo.state.code),
    cmbMunicipio: String(geo.city.code),
    lugar: r.lugar
  };
  const objectValues = Object.assign({
    colAsegurado: insured.fullName,
    colNoSis: String(insured.id),
    colNoCobis: insured.nationalId || "",
    colCedula: r.cedula,
    colSexo: insured.gender === "M" || insured.gender === "F" ? insured.gender : "",
    colFechaNacimiento: insured.birth ? String(insured.birth).slice(0, 10) : "",
    colEdad: ageAt(insured.birth ? String(insured.birth).slice(0, 10) : "", occurrence.date),
    colContactId: String(insured.id)
  }, cardValues);
  const jCustomForms = buildCustomForms(values, policy, chosen, objectValues);

  // 9. Creación del reclamo (mismo payload que la vista)
  const notification = notificationDate === occurrence.date ? occurrence.iso : `${notificationDate}T00:00:00Z`;
  const claimerId = Number(claimer.id);
  const coverageCode = String(chosen.coverage.code).trim();
  const entity = {
    lifePolicyId: Number(policy.id),
    claimerId: claimerId,
    nameOfPatient: String(claimerId),
    eventReason: event.reason.code,
    InsuredEvent: event.insured,
    elegibleCoverages: String(chosen.coverage.id),
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
      casegurado: String(insured.id), cobertura: coverageCode, coberturasMarcadas: marked,
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
  const skipped = chosen.skipped.length ? ` Coberturas marcadas no usadas: ${chosen.skipped.join("; ")}.` : "";
  return { ok: true, msg: `Reclamo ${claimCode} creado (id ${claimId}) en la póliza ${policy.code}, cobertura ${coverageCode}, con su objeto afectado.${skipped}`, claimId: claimId, code: claimCode };

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
  const text = String(value === null || value === undefined ? "" : value).trim().toUpperCase();
  // Los catálogos aceptan texto libre: compara A/a, Á/á, À/à, Ä/ä, etc. como la misma vocal.
  const map = {
    "Á": "A", "À": "A", "Â": "A", "Ã": "A", "Ä": "A", "Å": "A",
    "É": "E", "È": "E", "Ê": "E", "Ë": "E",
    "Í": "I", "Ì": "I", "Î": "I", "Ï": "I",
    "Ó": "O", "Ò": "O", "Ô": "O", "Õ": "O", "Ö": "O", "Ø": "O",
    "Ú": "U", "Ù": "U", "Û": "U", "Ü": "U", "Ñ": "N", "Ç": "C"
  };
  return text.replace(/[ÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖØÚÙÛÜÑÇ]/g, c => map[c]).replace(/\s+/g, " ");
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

function findPolicy(idText, codeText) {
  if (!idText) { errors.push("IdPoliza es obligatorio."); return null; }
  if (!/^\d+$/.test(idText)) { errors.push(`IdPoliza '${idText}' debe ser numérico.`); return null; }
  const cols = "id, code, lob, productCode, branchCode, active, start, [end], holderId, policyType, inactiveReason";
  const policy = query(`SELECT ${cols} FROM LifePolicy WHERE id=${Number(idText)}`)[0] || null;
  if (!policy) { errors.push(`IdPoliza ${idText} no existe.`); return null; }
  if (!codeText) errors.push(`Poliza es obligatorio (IdPoliza ${idText} corresponde a la póliza ${policy.code}).`);
  else if (norm(policy.code) !== norm(codeText)) { errors.push(`Poliza '${codeText}' no coincide con la póliza de IdPoliza ${idText} (${policy.code}).`); return null; }
  if (!(policy.active === true || policy.active === 1)) errors.push(`La póliza ${policy.code} (id ${policy.id}) no está vigente${policy.inactiveReason ? ": " + policy.inactiveReason : ""}.`);
  return policy;
}

// Fechas: DD/MM/AAAA (como la vista), AAAA-MM-DD o número de serie de Excel; siempre posteriores a 01/01/1900.
function parseDate(value, label) {
  const text = String(value).trim();
  let y, m, d, match;
  if ((match = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:[ T].*)?$/))) { d = +match[1]; m = +match[2]; y = +match[3]; }
  else if ((match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/))) { y = +match[1]; m = +match[2]; d = +match[3]; }
  else if (/^\d{1,5}(\.\d+)?$/.test(text)) {
    const serial = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(text)) * 86400000);
    y = serial.getUTCFullYear(); m = serial.getUTCMonth() + 1; d = serial.getUTCDate();
  } else { errors.push(`${label} '${text}' debe usar el formato DD/MM/AAAA.`); return null; }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) { errors.push(`${label} '${text}' no es una fecha válida.`); return null; }
  const iso = `${y}-${pad(m)}-${pad(d)}`;
  if (iso <= MIN_DATE) { errors.push(`${label} '${text}' debe ser posterior a 01/01/1900.`); return null; }
  return iso;
}

function pad(n) { const t = String(n); return t.length < 2 ? "0" + t : t; }

// FSiniestro: fecha con hora opcional (DD/MM/AAAA HH:mm, h:mm am/pm o fracción de Excel); sin hora, 00:00.
function parseOccurrence(dateText) {
  if (!required(dateText, "FSiniestro")) return null;
  const date = parseDate(dateText, "FSiniestro");
  if (!date) return null;
  let hour = 0, minute = 0;
  const text = String(dateText).trim();
  const serial = text.match(/^\d{1,5}(\.\d+)$/);
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
  const text = String(value).replace(/\s/g, "");
  const normalized = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text) ? text.replace(/,/g, "") : text.replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) { errors.push(`${label} '${value}' debe ser numérico.`); return ""; }
  const n = Number(normalized);
  if (integer && Math.floor(n) !== n) { errors.push(`${label} '${value}' debe ser un número entero.`); return ""; }
  if ((min !== undefined && n < min) || (max !== undefined && n > max)) { errors.push(`${label} '${value}' debe ser ${max === undefined ? "mayor o igual a " + min : "entre " + min + " y " + max}.`); return ""; }
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
  let rows = [];
  if (/^\d+$/.test(value)) rows = query(`SELECT ${CONTACT_COLS} FROM Contact WHERE id=${Number(value)}`);
  if (!rows.length) {
    const key = idKey(value);
    rows = query(`SELECT TOP 20 ${CONTACT_COLS} FROM Contact WHERE REPLACE(REPLACE(ISNULL(cnp,''),'-',''),' ','')='${sql(key)}' OR REPLACE(REPLACE(ISNULL(nationalId,''),'-',''),' ','')='${sql(key)}' OR REPLACE(REPLACE(ISNULL(passport,''),'-',''),' ','')='${sql(key)}'`);
  }
  if (!rows.length) {
    const words = norm(value).split(" ").filter(w => w.length > 1);
    if (words.length >= 2) {
      const full = "(RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(middleName,''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,'')))";
      const candidates = query(`SELECT TOP 50 ${CONTACT_COLS} FROM Contact WHERE ${words.map(w => `CHARINDEX(N'${sql(w)}', ${full}) > 0`).join(" AND ")}`);
      rows = candidates.filter(c => norm(contactName(c)) === norm(value));
    }
  }
  if (personOnly) rows = rows.filter(c => !(Number(c.isPerson) === 0 || c.isPerson === false));
  if (rows.length === 1) return Object.assign(rows[0], { fullName: contactName(rows[0]) });
  errors.push(rows.length > 1
    ? `${label} '${value}' es ambiguo (contactos ${rows.map(c => c.id).join(", ")}); use el código del contacto.`
    : `${label} '${value}' no existe como contacto (ni por código, ni por cédula, ni por nombre).`);
  return null;
}

// casegurado: código numérico del ente; Cedula debe coincidir con su identificación registrada.
function findInsured(code, cedula) {
  const hasCode = required(code, "casegurado");
  const hasId = required(cedula, "Cedula");
  if (!hasCode) return null;
  if (!/^\d+$/.test(code) || Number(code) === 0) { errors.push(`casegurado '${code}' debe ser el código numérico del ente asegurado.`); return null; }
  const rows = query(`SELECT ${CONTACT_COLS} FROM Contact WHERE id=${Number(code)}`);
  if (!rows.length) { errors.push(`casegurado ${code} no existe como ente.`); return null; }
  const insured = Object.assign(rows[0], { fullName: contactName(rows[0]) });
  const ids = [insured.cnp, insured.nationalId, insured.passport].filter(Boolean);
  if (!ids.length) errors.push(`El asegurado ${insured.id} ${insured.fullName} no tiene identificación registrada para validar la Cedula.`);
  else if (hasId && !ids.some(x => idKey(x) === idKey(cedula))) errors.push(`Cedula '${cedula}' no coincide con la identificación registrada del asegurado ${insured.id} ${insured.fullName}.`);
  return insured;
}

// Ajustador: numérico distinto de cero (o su nombre) de un contacto con rol de ajustador (ADJ).
function findAdjuster(value) {
  if (!required(value, "Ajustador")) return null;
  const key = norm(value);
  if (/^\d+(\.0+)?$/.test(key) && Number(key) === 0) { errors.push("Ajustador debe ser distinto de cero."); return null; }
  const rows = query("SELECT c.id, CASE WHEN c.isPerson = 0 THEN c.surname2 ELSE LTRIM(RTRIM(ISNULL(c.name,''))) + ' ' + LTRIM(RTRIM(ISNULL(c.surname1,''))) END name, c.email FROM Contact c WHERE EXISTS (SELECT 1 FROM ContactRole r WHERE r.contactId = c.id AND r.role = 'ADJ')");
  let found = /^\d+(\.0+)?$/.test(key) ? rows.filter(x => String(x.id) === String(Number(key))) : [];
  if (!found.length) found = rows.filter(x => norm(x.name) === key || norm(x.email) === key);
  if (found.length === 1) return found[0];
  errors.push(found.length > 1
    ? `Ajustador '${value}' es ambiguo (${found.map(x => x.id).join(", ")}); use el código del ajustador.`
    : `Ajustador '${value}' no existe en el catálogo de ajustadores (contacto con rol ADJ).`);
  return null;
}

// Causa + evento asegurado, con la misma tabla que usa la vista del reclamo (SysInsuredEventsPerCoverage por producto).
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

// Provincia y Ciudad (obligatorias) del país por defecto de la vista, por código o por nombre.
function resolveGeo(stateText, cityText) {
  const result = { country: null, state: null, city: null };
  const hasState = required(stateText, "Provincia");
  const hasCity = required(cityText, "Ciudad");
  const countries = query(`SELECT code, name FROM CountryCatalog WHERE code='${DEFAULT_COUNTRY}'`);
  result.country = countries[0] || null;
  if (!result.country) { errors.push(`No existe el país ${DEFAULT_COUNTRY} para validar Provincia y Ciudad.`); return result; }
  const states = query(`SELECT code, name FROM StateCatalog WHERE countryCode='${sql(result.country.code)}'`);
  if (hasState) result.state = pick(states, stateText, "Provincia", `provincia de ${result.country.name}`);
  if (!hasCity || (hasState && !result.state)) return result;
  const cities = query(`SELECT code, name, stateCode FROM CityCatalog WHERE stateCode='${sql(result.state.code)}'`);
  result.city = pick(cities, cityText, "Ciudad", `ciudad de ${result.state.name}`);
  return result;
}

// Lista de un campo select del formulario: se acepta el valor o el texto de la opción (sin tildes ni mayúsculas).
function selectValue(fields, name, value, label) {
  if (!required(value, label)) return "";
  const field = fields.find(f => f && f.name === name);
  const options = field && Array.isArray(field.values) ? field.values.filter(o => o && o.value !== "" && o.value !== null && o.value !== undefined) : [];
  if (!options.length) return String(value);
  const key = norm(value);
  const hit = options.find(o => norm(o.value) === key) || options.find(o => norm(o.label) === key);
  if (hit) return String(hit.value);
  errors.push(`${label} '${value}' no es válido (válidos: ${options.map(o => o.label).join(", ")}).`);
  return "";
}

// Datos específicos del fraude de tarjeta → campos del formulario frmOATarjetaFraude.
function cardFields(r) {
  const form = affectedForm();
  const fields = JSON.parse(form.json);
  const cant = required(r.cantSiniestro, "CantSiniestro") ? number(r.cantSiniestro, "CantSiniestro", true, 1) : "";
  const monto = required(r.monto, "Monto") ? number(r.monto, "Monto", false, 0.01) : "";
  required(r.nombreComercio, "NombreComercio");
  return {
    colTipoTarjeta: selectValue(fields, "colTipoTarjeta", r.tipoTrajeta, "TipoTrajeta"),
    colTarjetaHabiente: selectValue(fields, "colTarjetaHabiente", r.tarjetaHabitante, "TarjetaHabitante"),
    colTipoTransaccion: selectValue(fields, "colTipoTransaccion", r.tipoTransaccion, "TipoTransaccion"),
    colLugarSiniestro: selectValue(fields, "colLugarSiniestro", r.lugarSiniestro, "LugarSiniestro"),
    colCantTransacciones: cant,
    colMonto: monto,
    colComercios: r.nombreComercio
  };
}

function affectedForm() {
  if (affectedFormCache) return affectedFormCache;
  doCmd({ cmd: "GetForms", data: { filter: `name='${AFFECTED_FORM}'` } });
  const form = firstRow(GetForms.outData);
  if (!form || !form.id || !form.json) fail(`No existe el formulario ${AFFECTED_FORM}.`);
  affectedFormCache = form;
  return form;
}

// cob_N: se marca la cobertura N cuando la celda trae exactamente N; vacía = no aplica.
function markedCoverages(r) {
  const codes = [];
  let bad = false;
  COVERAGE_CODES.forEach(code => {
    const value = r["cob_" + code];
    if (!value) return;
    const n = String(value).trim().replace(/\.0+$/, "");
    if (n === code) codes.push(code);
    else { bad = true; errors.push(`cob_${code} '${value}' no es válido: para marcar la cobertura escriba ${code}, o deje la celda vacía.`); }
  });
  if (!codes.length && !bad) errors.push(`Marque al menos una cobertura (${COVERAGE_CODES.map(c => "cob_" + c).join(", ")}) con su código.`);
  return codes;
}

// La primera cobertura marcada (en el orden de la plantilla) que exista en la póliza y tenga configuración de
// objeto afectado en CustomClaimAffectedObjectConfig. Si ninguna es válida, la fila se rechaza con los motivos.
function firstValidCoverage(policy, codes) {
  const rows = query(`SELECT id, code, name FROM LifeCoverage WHERE lifePolicyId=${policy.id}`);
  const form = affectedForm();
  doCmd({ cmd: "GetFullTable", data: { table: "CustomClaimAffectedObjectConfig", filter: "1=1" } });
  if (!GetFullTable.ok) fail(`No se pudo leer la tabla CustomClaimAffectedObjectConfig: ${GetFullTable.msg}`);
  const matrix = JSON.parse(JSON.stringify(GetFullTable.outData || []));
  const header = (matrix[0] || []).map(h => String(h).trim().toLowerCase());
  const at = name => header.indexOf(name.toLowerCase());
  if (["Lob", "ProductCode", "CoverageCode", "FormId", "Description", "MaxObjects", "Active"].some(h => at(h) < 0)) fail("La tabla CustomClaimAffectedObjectConfig no tiene el formato esperado.");
  const productCode = String(policy.productCode).trim(), lob = String(policy.lob).trim();
  const rules = matrix.slice(1).map(row => ({
    lob: String(row[at("Lob")] || "").trim(), product: String(row[at("ProductCode")] || "").trim(),
    coverage: String(row[at("CoverageCode")] || "").trim(), formId: Number(row[at("FormId")]),
    description: String(row[at("Description")] || "").trim(), active: String(row[at("Active")] || "").trim().toLowerCase()
  })).filter(x => x.active === "true" && (x.lob === "*" || x.lob === lob) && x.formId === Number(form.id));
  const skipped = [];
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const coverage = rows.find(c => String(c.code).trim() === code);
    if (!coverage) { skipped.push(`cob_${code}: la póliza ${policy.code} no tiene la cobertura ${code}`); continue; }
    const matches = rules.filter(x => (x.product === "*" || x.product === productCode) && (x.coverage === "*" || x.coverage === code));
    if (!matches.length) { skipped.push(`cob_${code}: la cobertura ${code} del producto ${productCode} no tiene configuración de objeto afectado (${AFFECTED_FORM}) en CustomClaimAffectedObjectConfig`); continue; }
    const score = x => Number(x.lob !== "*") + Number(x.product !== "*") + Number(x.coverage !== "*");
    matches.sort((a, b) => score(b) - score(a));
    return { coverage: coverage, rule: { formId: Number(form.id), formName: form.name, json: form.json, description: matches[0].description || "Objeto afectado" }, skipped: skipped };
  }
  errors.push(`Ninguna cobertura marcada es válida: ${skipped.join("; ")}.`);
  return null;
}

function ageAt(birth, date) {
  if (!birth || !date) return "";
  const b = birth.split("-").map(Number), d = date.split("-").map(Number);
  let age = d[0] - b[0];
  if (d[1] < b[1] || (d[1] === b[1] && d[2] < b[2])) age--;
  return age >= 0 ? String(age) : "";
}

// Una sección de Claim.customForms aplica si no tiene condición de texto o si su condición vale para la póliza.
function sectionApplies(entry, policy) {
  const condition = entry.condition;
  if (typeof condition !== "string" || !condition.trim()) return true;
  try { return !!(new Function("pol", `return (${condition});`))(policy); } catch (e) { return false; }
}

// Claim.customForms del perfil (una sección por formulario, con userData) y la sección de objetos afectados.
function buildCustomForms(values, policy, chosen, objectValues) {
  doCmd({ cmd: "GetConfig", data: { path: "$.Claim.customForms" } });
  const entries = JSON.parse(JSON.stringify(GetConfig.outData || []));
  const outer = {};
  entries.forEach(entry => {
    if (!entry || !entry.name || !entry.formId) return;
    if (entry.name !== DETAIL_SECTION && entry.name !== EXTRA_SECTION && !sectionApplies(entry, policy)) return;
    doCmd({ cmd: "GetForms", data: { filter: `id=${Number(entry.formId)}` } });
    const form = firstRow(GetForms.outData);
    if (!form || !form.json) fail(`No se encontró el formulario ${entry.formId} de la sección ${entry.name}.`);
    outer[entry.name] = JSON.stringify(fillFields(JSON.parse(form.json), values));
  });
  if (!outer[DETAIL_SECTION] || !outer[EXTRA_SECTION]) fail(`Claim.customForms debe tener las secciones «${DETAIL_SECTION}» y «${EXTRA_SECTION}».`);
  const rule = chosen.rule;
  outer[AFFECTED_SECTION] = JSON.stringify([{
    key: `AffectedObject_${chosen.coverage.id}_${rule.formId}_1`,
    coverageId: Number(chosen.coverage.id), formId: rule.formId, description: rule.description,
    formName: rule.formName, fields: fillFields(JSON.parse(rule.json), objectValues)
  }]);
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
