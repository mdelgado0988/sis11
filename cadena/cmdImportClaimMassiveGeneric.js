//block
//noreplace
/**
 * @chain    cmdImportClaimMassiveGeneric
 * @category MASIVO
 * @purpose  Operación por fila del import «Carga Masiva Reclamos Genérico». No hay validación previa: la fila se
 *           valida completa y, si es correcta, se crea SÓLO el reclamo (sin objetos afectados ni reservas) con el
 *           mismo payload que la vista 48 InformaciónResumenDelReclamo. Una fila con errores se rechaza con TODOS sus
 *           motivos (también los mensajes del sistema al crear el reclamo).
 *           - Póliza: Id Poliza = código de la póliza; si el código tiene varias versiones, la vigente a la fecha del
 *             siniestro. Reclamante = contratante (o primer asegurado), como la vista.
 *           - Causa = evento asegurado (código o descripción), validado contra InsuredEventCatalog y la tabla
 *             SysInsuredEventsPerCoverage del producto; la razón del evento y el claimType (mode) salen del evento.
 *           - Ocurrencia: sólo fecha (DD/MM/AAAA, AAAA-MM-DD, … o número de Excel) + Hora opcional (08:00 a. m. por
 *             defecto), en la hora local del ambiente (Main.timeOffset) guardada como instante UTC, como la vista.
 *           - Catálogos por código o descripción: estado, sucursal, ramo, evento, ajustador, reclamante, país,
 *             provincia y ciudad.
 * @context  { row:{fSiniestro, hora, fNotificacion, statSin, usuario, edadConductor, lugar, descripcionSiniestro,
 *           culpabilidad, responsable, cdgocaus, cdgosucu, cdgoramo, numepoli, idPoliza, ajustador, observaciones,
 *           cdgoPais, cdgociu1, cdgoest1, cober15, cober39}, batchId, simulate? }
 *           simulate:true valida la fila y devuelve el reclamo que se crearía, sin grabar nada.
 * @mission  MSN-000088 (globaluat) — 2026-10-21. Base: cmdImportClaimMassive (MSN-000047) y la cadena 851.
 */

const TAG = "Reclamo";
const IMPORT_NAME = "Carga Masiva Reclamos Genérico";
const DEFAULT_COUNTRY = "591";
const DEFAULT_OFFSET = -5;
const DEFAULT_STAGE = { code: "1", name: "NOTIFICADO" };
const DEFAULT_HOUR = 8;
const MOTOR_LOB = "6";
const DESGRAVAMEN_LOB = "20";
const DESGRAVAMEN_PRODUCT = "vid-desemp";
const DETAIL_SECTION = "Detalle del Siniestro";
const EXTRA_SECTION = "InformacionResumenDelReclamo";
const CLAIMANT_TYPES = ["Afectado", "Asegurado", "Tercera Persona"];
const FIELDS = ["fSiniestro", "hora", "fNotificacion", "statSin", "usuario", "edadConductor", "lugar",
  "descripcionSiniestro", "culpabilidad", "responsable", "cdgocaus", "cdgosucu", "cdgoramo", "numepoli",
  "idPoliza", "ajustador", "observaciones", "cdgoPais", "cdgociu1", "cdgoest1", "cober15", "cober39"];
const LABELS = {
  fSiniestro: "Fecha del siniestro", hora: "Hora del siniestro", fNotificacion: "Fecha de notificación",
  statSin: "Estado del siniestro", usuario: "Persona que reporta o notifica", edadConductor: "Edad del conductor",
  lugar: "Lugar del siniestro", descripcionSiniestro: "Descripción del siniestro", culpabilidad: "Indicador de culpabilidad",
  responsable: "Responsable del siniestro", cdgocaus: "Código de causa (evento asegurado)", cdgosucu: "Código de sucursal",
  cdgoramo: "Código de ramo", numepoli: "Número de póliza", idPoliza: "Id Poliza", ajustador: "Ajustador",
  observaciones: "Observaciones", cdgoPais: "Código de país", cdgociu1: "Código de ciudad",
  cdgoest1: "Código de provincia o estado", cober15: "Valor auxiliar de cobertura 15", cober39: "Valor auxiliar de cobertura 39"
};
const COVERAGE_FIELDS = [{ field: "cober15", code: "15" }, { field: "cober39", code: "39" }];

const args = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});
const errors = [];

try {
  const raw = args.row || {};
  const r = {};
  FIELDS.forEach(f => { r[f] = (raw[f] === null || raw[f] === undefined) ? "" : String(raw[f]).trim(); });

  // Una fila de encabezado que llegue como dato no es un reclamo.
  if (["FSINIESTRO", "FECHA DEL SINIESTRO"].indexOf(norm(r.fSiniestro)) !== -1 || ["IDPOLIZA", "ID POLIZA"].indexOf(norm(r.idPoliza)) !== -1) {
    return { ok: true, msg: "Encabezado omitido." };
  }

  const offset = timeOffset();
  const now = Date.now();
  const today = localDay(now, offset);

  // 1. Fechas: ocurrencia (sólo fecha + hora opcional) y notificación
  const occurrence = parseOccurrence(r.fSiniestro, r.hora, offset);
  const notificationDate = required(r.fNotificacion, LABELS.fNotificacion) ? parseDate(r.fNotificacion, LABELS.fNotificacion) : null;
  if (occurrence && occurrence.date > today) errors.push(`${LABELS.fSiniestro} ${show(occurrence.date)} no puede ser posterior a hoy (${show(today)}).`);
  else if (occurrence && occurrence.ms > now) errors.push(`${LABELS.fSiniestro} ${show(occurrence.date)} ${occurrence.hhmm} es posterior a la hora actual.`);
  if (notificationDate && notificationDate > today) errors.push(`${LABELS.fNotificacion} ${show(notificationDate)} no puede ser posterior a hoy (${show(today)}).`);
  if (occurrence && notificationDate && notificationDate < occurrence.date) errors.push(`${LABELS.fNotificacion} ${show(notificationDate)} no puede ser anterior a la ${LABELS.fSiniestro.toLowerCase()} ${show(occurrence.date)}.`);

  // 2. Póliza por su código (Id Poliza): la versión vigente a la fecha del siniestro
  const policy = findPolicy(r.idPoliza, occurrence);

  // 3. Catálogos (código o descripción)
  const stage = r.statSin
    ? pick(query("SELECT code, name FROM ClaimStage WHERE ISNULL(disabled,0)=0"), r.statSin, LABELS.statSin, "estado de reclamo")
    : DEFAULT_STAGE;
  if (policy && r.cdgosucu) {
    const branch = pick(query("SELECT code, name FROM Branch"), r.cdgosucu, LABELS.cdgosucu, "sucursal");
    if (branch && codeKey(branch.code) !== codeKey(policy.branchCode)) errors.push(`${LABELS.cdgosucu} ${r.cdgosucu} no corresponde a la sucursal de la póliza ${policy.code} (${policy.branchCode}).`);
  }
  if (policy && r.cdgoramo) {
    const lobs = query("SELECT code, name FROM Lob").map(x => ({ code: x.code, name: x.name, alias: String(x.name || "").replace(/^\s*\d+\s*-\s*/, "") }));
    const lob = pick(lobs, r.cdgoramo, LABELS.cdgoramo, "ramo");
    if (lob && codeKey(lob.code) !== codeKey(policy.lob)) errors.push(`${LABELS.cdgoramo} ${r.cdgoramo} no corresponde al ramo de la póliza ${policy.code} (${policy.lob}).`);
  }
  const event = policy && required(r.cdgocaus, LABELS.cdgocaus) ? resolveEvent(r.cdgocaus, policy.productCode) : null;
  const adjuster = r.ajustador ? findAdjuster(r.ajustador) : null;
  const claimantType = r.usuario ? findClaimantType(r.usuario) : "";
  const geo = resolveGeo(r.cdgoPais, r.cdgoest1, r.cdgociu1);

  // 4. Datos de auto de la información adicional (la vista sólo los permite en ramo 6)
  const guilty = r.culpabilidad ? yesNo(r.culpabilidad, LABELS.culpabilidad) : false;
  const responsible = r.responsable ? findResponsible(r.responsable) : null;
  const driverAge = r.edadConductor ? age(r.edadConductor) : "";
  if (policy && String(policy.lob).trim() !== MOTOR_LOB && (guilty || responsible || driverAge)) {
    errors.push(`${LABELS.culpabilidad}, ${LABELS.responsable} y ${LABELS.edadConductor} sólo aplican a pólizas de ramo ${MOTOR_LOB} (Automóvil); la póliza ${policy.code} es de ramo ${policy.lob}.`);
  }

  // 5. Coberturas elegibles: todas las de la póliza (como la vista) o sólo las de cober15/cober39 con valor
  const coverages = policy ? eligibleCoverages(policy, r) : [];

  // 6. Desgravamen: una póliza no puede tener otro reclamo del mismo asegurado
  //    en cualquiera de las mismas coberturas. Esta regla sólo aplica a vid-desemp.
  if (policy && isDesgravamen(policy) && coverages.length && errors.length === 0) {
    checkDesgravamenDuplicates(policy, coverages);
  }

  // 7. Numeración: sin el contador de Main.claimCode el sistema guardaría el reclamo SIN número.
  if (policy) checkClaimCounters(policy.productCode);

  if (errors.length) fail(errors.join(" | "));

  // 8. Formularios del reclamo, como los guarda la vista 48
  const values = {
    ajustadorName: adjuster ? adjuster.name : "",
    ajustadorEmail: adjuster ? (adjuster.email || "") : "",
    hiddenAjustador: adjuster ? String(adjuster.id) : "",
    descripcion: r.observaciones,
    tipoReclamante: claimantType,
    culpable: guilty,
    asegurador: responsible === "asegurador",
    pagador: responsible === "pagador",
    otro: responsible === "otro",
    edadConductor: driverAge,
    cmbProvincia: geo.state ? String(geo.state.code) : "",
    cmbMunicipio: geo.city ? String(geo.city.code) : "",
    lugar: r.lugar
  };
  const jCustomForms = buildCustomForms(values);

  // 9. Reclamo (mismo payload que la vista 48 al crear)
  const notification = notificationDate === occurrence.date ? occurrence.iso : utcIso(notificationDate, 0, 0, offset);
  const claimerId = Number(policy.claimerId);
  const entity = {
    lifePolicyId: Number(policy.id),
    claimerId: claimerId,
    nameOfPatient: String(claimerId),
    eventReason: event.reason.code,
    InsuredEvent: event.insured,
    elegibleCoverages: coverages.map(c => Number(c.id)).join(","),
    claimType: event.insured.mode,
    stageCode: String(stage.code),
    occurrence: occurrence.iso,
    notification: notification,
    created: notification,
    id: 0,
    description: r.descripcionSiniestro,
    jCustomForms: jCustomForms,
    contactId: claimerId,
    jMap: JSON.stringify({ cargaMasiva: {
      importacion: IMPORT_NAME, batchId: args.batchId || null, idPoliza: r.idPoliza, numepoli: r.numepoli,
      cdgosucu: r.cdgosucu, cdgoramo: r.cdgoramo, usuario: r.usuario, cdgoPais: geo.country ? String(geo.country.code) : "",
      cober15: r.cober15, cober39: r.cober39
    } })
  };
  const summary = `póliza ${policy.code} (id ${policy.id}), evento ${event.insured.code} ${event.insured.name}, razón ${event.reason.code}, tipo ${event.insured.mode}, estado ${stage.code} ${stage.name}, ocurrencia ${show(occurrence.date)} ${occurrence.hhmm}`;
  if (args.simulate === true) return { ok: true, msg: `Fila válida (simulación, no se grabó): ${summary}.`, entity: entity };

  doCmd({ cmd: "RepoClaim", data: { operation: "ADD", entity: entity } });
  if (!RepoClaim.ok) {
    const addMsg = translate(RepoClaim.msg);
    const partial = findClaim(policy.id, occurrence.stamp16, event.insured.code);
    if (partial) fail(`El reclamo quedó creado con id ${partial.id}${partial.code ? " (" + partial.code + ")" : ""} pero el sistema informó un error: ${addMsg}. Revíselo antes de volver a cargar la fila.`);
    fail(`El sistema no creó el reclamo: ${addMsg}`);
  }
  const created = firstRow(RepoClaim.outData) || {};
  const claimId = created.id;
  const claimCode = created.code || claimId;
  return { ok: true, msg: `Reclamo ${claimCode} creado (id ${claimId}): ${summary}.`, claimId: claimId, code: claimCode };

} catch (error) {
  const reason = error && error.message ? error.message : String(error);
  throw new Error(`@${TAG}: ${reason.replace(/^@/, "")}`);
}

// ---------------------------------------------------------------- helpers

function fail(message) { throw new Error(message); }

function required(value, label) {
  if (value) return true;
  errors.push(`El campo ${label} es obligatorio.`);
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

// Código numérico sin ceros a la izquierda (la sucursal «001» del banco es la 1).
function codeKey(value) {
  const text = norm(value);
  return /^\d+$/.test(text) ? String(Number(text)) : text;
}

function idKey(value) { return String(value === null || value === undefined ? "" : value).replace(/[\s\-.]/g, "").toUpperCase(); }

// Busca por código y, si no, por descripción (sin distinguir mayúsculas, tildes ni espacios de relleno).
function pick(rows, value, label, what) {
  const key = codeKey(value);
  let found = rows.filter(x => codeKey(x.code) === key);
  if (!found.length) found = rows.filter(x => norm(x.name) === norm(value) || (x.alias && norm(x.alias) === norm(value)));
  if (found.length === 1) return found[0];
  if (found.length > 1) errors.push(`${label} '${value}' es ambiguo: coincide con ${found.length} registros de ${what} (${found.map(x => x.code).join(", ")}). Use el código.`);
  else errors.push(`${label} '${value}' no existe como ${what} (ni por código ni por descripción).`);
  return null;
}

function show(day) { return day ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : ""; }

function pad(n) { const t = String(n); return t.length < 2 ? "0" + t : t; }

// Zona del negocio: Main.timeOffset (horas respecto de UTC; Panamá = -5).
function timeOffset() {
  doCmd({ cmd: "GetConfig", data: { path: "$.Main.timeOffset" } });
  const value = GetConfig.ok ? Number(GetConfig.outData) : NaN;
  return Number.isFinite(value) && Math.abs(value) <= 14 ? value : DEFAULT_OFFSET;
}

function localDay(ms, offset) { return new Date(ms + offset * 3600000).toISOString().slice(0, 10); }

// Día + hora local del negocio → instante UTC (lo mismo que hace la vista con la hora del navegador).
function utcIso(day, hour, minute, offset) {
  const y = Number(day.slice(0, 4)), m = Number(day.slice(5, 7)), d = Number(day.slice(8, 10));
  return new Date(Date.UTC(y, m - 1, d, hour, minute, 0) - offset * 3600000).toISOString();
}

// Fechas: DD/MM/AAAA (también con - o .), D/M/AA, AAAA-MM-DD, AAAA/MM/DD o número de serie de Excel.
// Sólo se toma la fecha: una hora pegada a la fecha se ignora (la hora va en su propia columna).
function parseDate(value, label) {
  const text = String(value).trim();
  let y, m, d, match;
  if ((match = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:[ T].*)?$/))) { d = +match[1]; m = +match[2]; y = +match[3]; }
  else if ((match = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})(?:[ T].*)?$/))) { d = +match[1]; m = +match[2]; y = 2000 + Number(match[3]); }
  else if ((match = text.match(/^(\d{4})[\-\/.](\d{1,2})[\-\/.](\d{1,2})(?:[ T].*)?$/))) { y = +match[1]; m = +match[2]; d = +match[3]; }
  else if (/^\d{5}(\.\d+)?$/.test(text)) {
    const serial = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(text)) * 86400000);
    y = serial.getUTCFullYear(); m = serial.getUTCMonth() + 1; d = serial.getUTCDate();
  } else { errors.push(`${label} '${text}' no tiene un formato de fecha válido (DD/MM/AAAA o AAAA-MM-DD).`); return null; }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) { errors.push(`${label} '${text}' no es una fecha válida.`); return null; }
  return `${y}-${pad(m)}-${pad(d)}`;
}

// Hora (opcional): HH:mm 24 h, h:mm am/pm (también «a. m.»), HHmm, «8» / «8 am» o fracción de día de Excel. Vacía = 08:00.
function parseHour(value) {
  if (!value) return { hour: DEFAULT_HOUR, minute: 0 };
  let text = String(value).trim().toLowerCase().replace(/\s+/g, " ")
    .replace(/a\.?\s?m\.?$/, "am").replace(/p\.?\s?m\.?$/, "pm");
  const inline = text.match(/(\d{1,2}:\d{2})(?::\d{2}(?:\.\d+)?)?\s*(am|pm)?$/);
  if (/[ T]/.test(text) && inline) text = inline[1] + (inline[2] ? " " + inline[2] : "");
  let hour, minute, match;
  if (/^0?\.\d+$/.test(text)) {
    const mins = Math.round(Number(text) * 1440) % 1440;
    hour = Math.floor(mins / 60); minute = mins % 60;
  } else if ((match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*(am|pm)?$/)) || (match = text.match(/^(\d{1,2})(\d{2})\s*(am|pm)?$/)) || (match = text.match(/^(\d{1,2})()\s*(am|pm)?$/))) {
    hour = Number(match[1]); minute = Number(match[2] || 0);
    if (match[3]) {
      if (hour < 1 || hour > 12) { errors.push(`${LABELS.hora} '${value}' no es válida.`); return null; }
      hour = match[3] === "pm" ? (hour % 12) + 12 : hour % 12;
    }
  } else { errors.push(`${LABELS.hora} '${value}' no tiene un formato válido (HH:mm, por ejemplo 08:00 o 2:30 pm).`); return null; }
  if (hour > 23 || minute > 59) { errors.push(`${LABELS.hora} '${value}' no es válida.`); return null; }
  return { hour: hour, minute: minute };
}

function parseOccurrence(dateText, hourText, offset) {
  const day = required(dateText, LABELS.fSiniestro) ? parseDate(dateText, LABELS.fSiniestro) : null;
  const time = parseHour(hourText);
  if (!day || !time) return null;
  const iso = utcIso(day, time.hour, time.minute, offset);
  return { date: day, hhmm: `${pad(time.hour)}:${pad(time.minute)}`, iso: iso, ms: Date.parse(iso), stamp16: iso.slice(0, 16) };
}

// Póliza por código (Id Poliza). Con varias versiones del mismo código, la que cubre la fecha del siniestro.
function findPolicy(codeText, occurrence) {
  if (!required(codeText, LABELS.idPoliza)) return null;
  const cols = "id, code, lob, productCode, branchCode, active, holderId, inactiveReason, policyVersion, " +
    "CONVERT(varchar(19), start, 126) startText, CONVERT(varchar(19), [end], 126) endText";
  const rows = query(`SELECT ${cols} FROM LifePolicy WHERE code=N'${sql(codeText)}' ORDER BY id`);
  if (!rows.length) { errors.push(`${LABELS.idPoliza} '${codeText}' no existe como código de póliza.`); return null; }
  const covers = p => {
    if (!occurrence) return true;
    const start = p.startText ? Date.parse(p.startText + "Z") : NaN;
    const end = p.endText ? Date.parse(p.endText + "Z") : NaN;
    return (!Number.isFinite(start) || start <= occurrence.ms) && (!Number.isFinite(end) || occurrence.ms < end);
  };
  const period = p => `${show(String(p.startText || "").slice(0, 10))} al ${show(String(p.endText || "").slice(0, 10))}`;
  let policy = null;
  if (rows.length === 1) {
    policy = rows[0];
    if (!covers(policy)) { errors.push(`La ${LABELS.fSiniestro.toLowerCase()} ${show(occurrence.date)} está fuera de la vigencia de la póliza ${policy.code} (${period(policy)}).`); return null; }
  } else {
    let candidates = rows.filter(covers);
    if (candidates.length > 1) {
      const active = candidates.filter(p => p.active === true || p.active === 1);
      if (active.length) candidates = active;
    }
    if (candidates.length === 1) policy = candidates[0];
    else if (!candidates.length) { errors.push(`Ninguna versión de la póliza ${codeText} cubre la ${LABELS.fSiniestro.toLowerCase()} ${show(occurrence.date)} (versiones: ${rows.map(p => "id " + p.id + " del " + period(p)).join("; ")}).`); return null; }
    else { errors.push(`${LABELS.idPoliza} '${codeText}' tiene ${candidates.length} versiones vigentes a la fecha del siniestro (ids ${candidates.map(p => p.id).join(", ")}); no se puede elegir una.`); return null; }
  }
  if (!(policy.active === true || policy.active === 1)) errors.push(`La póliza ${policy.code} (id ${policy.id}) no está vigente${policy.inactiveReason ? ": " + policy.inactiveReason : ""}.`);
  let claimerId = Number(policy.holderId) || 0;
  if (!claimerId) {
    const insured = query(`SELECT TOP 1 contactId FROM Insured WHERE lifePolicyId=${Number(policy.id)} AND contactId IS NOT NULL ORDER BY id`);
    claimerId = insured.length ? Number(insured[0].contactId) : 0;
  }
  if (!claimerId) { errors.push(`La póliza ${policy.code} no tiene contratante ni asegurado para usar como reclamante.`); return null; }
  policy.claimerId = claimerId;
  return policy;
}

function yesNo(value, label) {
  const key = norm(value);
  if (["1", "S", "SI", "Y", "YES", "X", "TRUE", "VERDADERO", "CULPABLE"].indexOf(key) !== -1) return true;
  if (["0", "N", "NO", "FALSE", "FALSO", "NO CULPABLE"].indexOf(key) !== -1) return false;
  errors.push(`${label} '${value}' debe ser 1 (culpable) o 0 (no culpable).`);
  return false;
}

function findResponsible(value) {
  const options = { A: "asegurador", ASEGURADOR: "asegurador", ASEGURADO: "asegurador", P: "pagador", PAGADOR: "pagador", O: "otro", OTRO: "otro", TERCERO: "otro" };
  const hit = options[norm(value)];
  if (hit) return hit;
  errors.push(`${LABELS.responsable} '${value}' debe ser Asegurador (A), Pagador (P) u Otro (O).`);
  return null;
}

function age(value) {
  const text = String(value).trim();
  if (text === "0") return "";
  if (!/^\d{1,3}$/.test(text) || Number(text) < 14 || Number(text) > 110) { errors.push(`${LABELS.edadConductor} '${value}' no es una edad válida (14 a 110).`); return ""; }
  return String(Number(text));
}

// «Reclamante» de la vista 48: Afectado, Asegurado o Tercera Persona.
function findClaimantType(value) {
  const key = norm(value);
  const hit = CLAIMANT_TYPES.find(t => norm(t) === key) || (key === "TERCERO" ? "Tercera Persona" : null);
  if (hit) return hit;
  errors.push(`${LABELS.usuario} '${value}' debe ser Afectado, Asegurado o Tercera Persona (el «Reclamante» de la vista de reclamos).`);
  return "";
}

// Ajustador: contacto con rol ADJ, por código (id), identificación (cédula / documento), nombre o correo.
function findAdjuster(value) {
  const rows = query("SELECT c.id, CASE WHEN c.isPerson = 0 THEN c.surname2 ELSE c.name + ' ' + c.surname1 END name, c.email, c.cnp, c.nationalId, c.passport FROM Contact c WHERE EXISTS (SELECT 1 FROM ContactRole r WHERE r.contactId = c.id AND r.role = 'ADJ')");
  const key = norm(value), doc = idKey(value);
  let found = /^\d+$/.test(key) ? rows.filter(x => String(x.id) === key) : [];
  if (!found.length && doc) found = rows.filter(x => [x.cnp, x.nationalId, x.passport].some(v => v && idKey(v) === doc));
  if (!found.length) found = rows.filter(x => norm(x.name) === key || norm(x.email) === key);
  if (found.length === 1) return found[0];
  errors.push(found.length > 1
    ? `${LABELS.ajustador} '${value}' es ambiguo (contactos ${found.map(x => x.id).join(", ")}); use el código del contacto.`
    : `${LABELS.ajustador} '${value}' no es un contacto con rol de ajustador (ni por código, ni por identificación, ni por nombre).`);
  return null;
}

// La causa es el evento asegurado; la razón sale de la tabla SysInsuredEventsPerCoverage del producto (como la vista).
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
  const active = x => !(x.disabled === true || x.disabled === 1);
  const scopeReasons = reasons.filter(x => active(x) && mapping[x.code]);
  const scopeEvents = events.filter(e => active(e) && scopeReasons.some(x => mapping[x.code].indexOf(e.code) !== -1));
  if (!scopeEvents.length) { errors.push(`El producto ${productCode} no tiene eventos asegurados configurados para reclamos (tabla SysInsuredEventsPerCoverage).`); return null; }
  const key = norm(value);
  let matches = scopeEvents.filter(x => norm(x.code) === key);
  if (!matches.length) matches = scopeEvents.filter(x => norm(x.name) === key);
  if (matches.length !== 1) {
    if (matches.length > 1) errors.push(`${LABELS.cdgocaus} '${value}' es ambiguo (${matches.map(x => x.code).join(", ")}); use el código.`);
    else {
      const known = events.some(x => norm(x.code) === key || norm(x.name) === key);
      const valid = scopeEvents.map(x => `${x.code} ${String(x.name).trim()}`);
      errors.push(`${LABELS.cdgocaus} '${value}' ${known ? "existe en el catálogo de eventos asegurados pero no está configurado" : "no existe como evento asegurado"} para el producto ${productCode} (válidos: ${valid.slice(0, 30).join(", ")}${valid.length > 30 ? ", …" : ""}).`);
    }
    return null;
  }
  const insured = matches[0];
  const owners = scopeReasons.filter(x => mapping[x.code].indexOf(insured.code) !== -1);
  if (owners.length !== 1) {
    errors.push(`El evento asegurado ${insured.code} tiene ${owners.length} razones de evento configuradas para el producto ${productCode} (${owners.map(x => x.code).join(", ")}); no se puede calcular la razón.`);
    return null;
  }
  const mode = String(insured.mode || "").trim();
  if (!mode) { errors.push(`El evento asegurado ${insured.code} no tiene tipo de reclamo (mode) configurado.`); return null; }
  return {
    reason: owners[0],
    insured: { code: String(insured.code).trim(), name: String(insured.name).trim(), mode: mode, disabled: false, hasHealthProcedures: insured.hasHealthProcedures === true || insured.hasHealthProcedures === 1 }
  };
}

// País (por defecto Panamá, el de la vista), provincia del país y ciudad de la provincia; código o descripción.
function resolveGeo(countryText, stateText, cityText) {
  const result = { country: null, state: null, city: null };
  result.country = pick(query("SELECT code, name FROM CountryCatalog"), countryText || DEFAULT_COUNTRY, LABELS.cdgoPais, "país");
  if (!result.country || (!stateText && !cityText)) return result;
  const states = query(`SELECT code, name FROM StateCatalog WHERE countryCode=N'${sql(result.country.code)}'`);
  if (stateText) result.state = pick(states, stateText, LABELS.cdgoest1, `provincia de ${result.country.name}`);
  if (!cityText || (stateText && !result.state)) return result;
  const stateCodes = result.state ? [result.state.code] : states.map(s => s.code);
  if (!stateCodes.length) { errors.push(`${LABELS.cdgociu1} '${cityText}': el país ${result.country.name} no tiene provincias.`); return result; }
  const cities = query(`SELECT code, name, stateCode FROM CityCatalog WHERE stateCode IN (${stateCodes.map(c => "N'" + sql(c) + "'").join(",")})`);
  result.city = pick(cities, cityText, LABELS.cdgociu1, result.state ? `ciudad de ${result.state.name}` : `ciudad de ${result.country.name}`);
  if (result.city && !result.state) result.state = states.find(s => String(s.code) === String(result.city.stateCode)) || null;
  return result;
}

// Valor auxiliar de cobertura: vacío, 0 o N = no afectada; un importe > 0, S o X = afectada.
function flagged(value, label) {
  const key = norm(value);
  if (!key || ["N", "NO", "FALSE", "FALSO"].indexOf(key) !== -1) return false;
  if (["S", "SI", "Y", "YES", "X", "TRUE", "VERDADERO"].indexOf(key) !== -1) return true;
  const text = key.replace(/\s/g, "");
  const normalized = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text) ? text.replace(/,/g, "") : text.replace(",", ".");
  if (/^\d+(\.\d+)?$/.test(normalized)) return Number(normalized) > 0;
  errors.push(`${label} '${value}' debe ser un importe mayor o igual a 0 (o S/N).`);
  return false;
}

function eligibleCoverages(policy, r) {
  const rows = query(`SELECT id, code FROM LifeCoverage WHERE lifePolicyId=${Number(policy.id)}`);
  const marked = COVERAGE_FIELDS.filter(f => flagged(r[f.field], LABELS[f.field]));
  let chosen = rows;
  if (marked.length) {
    chosen = [];
    marked.forEach(f => {
      const hit = rows.filter(c => String(c.code).trim() === f.code);
      if (!hit.length) errors.push(`${LABELS[f.field]}: la póliza ${policy.code} no tiene la cobertura ${f.code}.`);
      chosen = chosen.concat(hit);
    });
  }
  const seen = {};
  chosen = chosen.filter(c => Number(c.id) > 0 && !seen[c.id] && (seen[c.id] = true));
  if (!chosen.length && !marked.length) errors.push(`La póliza ${policy.code} no tiene coberturas para el reclamo.`);
  return chosen;
}

// Claim.customForms del perfil: una sección por formulario, con sus campos y userData, como los serializa la vista.
function buildCustomForms(values) {
  doCmd({ cmd: "GetConfig", data: { path: "$.Claim.customForms" } });
  const entries = JSON.parse(JSON.stringify(GetConfig.outData || []));
  const outer = {};
  entries.forEach(entry => {
    if (!entry || !entry.name || !entry.formId) return;
    doCmd({ cmd: "GetForms", data: { filter: `id=${Number(entry.formId)}` } });
    const form = firstRow(GetForms.outData);
    if (!form || !form.json) fail(`No se encontró el formulario ${entry.formId} de la sección ${entry.name}.`);
    const fields = JSON.parse(form.json);
    fields.forEach(field => {
      if (!field || !field.name || field.type === "header" || field.type === "paragraph") return;
      const has = Object.prototype.hasOwnProperty.call(values, field.name);
      if (field.type === "checkbox-group") field.userData = has && values[field.name] === true ? ["true"] : [];
      else field.userData = [has && values[field.name] !== null && values[field.name] !== undefined ? String(values[field.name]) : ""];
    });
    outer[entry.name] = JSON.stringify(fields);
  });
  if (!outer[DETAIL_SECTION] || !outer[EXTRA_SECTION]) fail(`Claim.customForms debe tener las secciones «${DETAIL_SECTION}» y «${EXTRA_SECTION}».`);
  return JSON.stringify(outer);
}

function findClaim(policyId, stamp16, eventCode) {
  const rows = query(`SELECT TOP 1 id, code FROM Claim WHERE lifePolicyId=${Number(policyId)} AND CONVERT(varchar(16), occurrence, 126)='${sql(stamp16)}' AND ISNULL(insuredEvent,'')=N'${sql(eventCode)}' ORDER BY id DESC`);
  return rows.length ? rows[0] : null;
}

function isDesgravamen(policy) {
  return codeKey(policy.lob) === codeKey(DESGRAVAMEN_LOB) && norm(policy.productCode) === norm(DESGRAVAMEN_PRODUCT);
}

// Unicidad de Desgravamen: misma póliza + mismo asegurado + misma cobertura.
// En el genérico el asegurado es el claimerId que se resuelve desde la póliza.
function checkDesgravamenDuplicates(policy, coverages) {
  const rows = query(`SELECT id, code, claimerId, elegibleCoverages FROM Claim WHERE lifePolicyId=${Number(policy.id)} AND claimerId=${Number(policy.claimerId)}`);
  const requested = coverages.map(c => Number(c.id)).filter(Number.isSafeInteger);
  rows.forEach(claim => {
    const existing = String(claim.elegibleCoverages || "").split(",")
      .map(v => Number(String(v).trim())).filter(Number.isSafeInteger);
    const overlap = requested.filter(id => existing.indexOf(id) !== -1);
    if (!overlap.length) return;
    const codes = overlap.map(id => {
      const coverage = coverages.find(c => Number(c.id) === id);
      return coverage ? String(coverage.code).trim() : String(id);
    });
    errors.push(`Ya existe el reclamo ${claim.code || claim.id} (id ${claim.id}) de la póliza ${policy.code} para el asegurado ${policy.claimerId} en la cobertura(s) ${codes.join(", ")}.`);
  });
}

function checkClaimCounters(productCode) {
  const rows = query(`SELECT JSON_VALUE(configJson,'$.Main.claimCode') claimCode FROM Product WHERE code=N'${sql(productCode)}' AND ISJSON(configJson)=1`);
  const formula = rows.length ? String(rows[0].claimCode || "") : "";
  const pattern = /counter\s*:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(formula)) !== null) {
    if (!query(`SELECT code FROM Counter WHERE code=N'${sql(match[1])}'`).length) {
      errors.push(`El producto ${productCode} no tiene el contador de numeración de reclamos '${match[1]}': el reclamo quedaría sin número. Configure el contador antes de cargar esta fila.`);
    }
  }
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
