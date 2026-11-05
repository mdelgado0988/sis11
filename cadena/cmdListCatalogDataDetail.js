//block
//noreplace
/**
 * @chain    cmdListCatalogDataDetail
 * @category VIEW
 * @version  1.0.0
 * @purpose  Código y descripción de un catálogo de una carga masiva, paginado y con búsqueda (modal «Ver Catálogos» de las
 *           vistas 63 CargaMasivaDeReclamos y 64 CargaMasivaDeEmision). Sólo lectura. La columna se resuelve con
 *           cmdListCatalogData, así que sólo atiende catálogos de las cargas vigentes de la categoría pedida, y devuelve los
 *           mismos valores que acepta la carga. La búsqueda encuentra cualquier coincidencia en el código, la descripción o
 *           el agrupador (provincia, marca), sin distinguir mayúsculas ni tildes. Página desde 0.
 * @context  { category, importId, field, search?, page?: 0.., size?: 1..100 (10) }
 * @returns  { ok, msg, catalog: { importId, importName, field, column, name, parent }, search, total, page, size,
 *           rows: [{ key, code, name, parent }] }
 * @mission  MSN-000119 (globaluat) — 2026-10-30.
 */

const lcddArgs = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});
const lcddCache = {};
const lcddAccents = { "Á": "A", "À": "A", "Â": "A", "Ä": "A", "É": "E", "È": "E", "Ê": "E", "Ë": "E", "Í": "I", "Ì": "I", "Î": "I", "Ï": "I",
  "Ó": "O", "Ò": "O", "Ô": "O", "Ö": "O", "Ú": "U", "Ù": "U", "Û": "U", "Ü": "U", "Ñ": "N" };
const lcddStandardPeriodicity = { y: "Anual", s: "Semestral", q: "Trimestral", m: "Mensual" };

try {
  const category = String(lcddArgs.category || "").trim();
  const importId = Number(lcddArgs.importId);
  const field = String(lcddArgs.field || "").trim();
  const search = String(lcddArgs.search == null ? "" : lcddArgs.search).trim().slice(0, 100);
  let size = Number(lcddArgs.size);
  let page = Number(lcddArgs.page);
  if (!/^[A-Za-z0-9]{1,60}$/.test(category)) return { ok: false, msg: "Indique la categoría de cargas de la vista." };
  if (!(importId > 0) || Math.floor(importId) !== importId) return { ok: false, msg: "Indique la carga del catálogo." };
  if (!/^[A-Za-z0-9]{1,80}$/.test(field)) return { ok: false, msg: "Indique la columna del catálogo." };
  if (!(size >= 1 && size <= 100) || Math.floor(size) !== size) size = 10;
  if (!(page >= 0) || Math.floor(page) !== page) page = 0;

  doCmd({ cmd: "ExeChain", data: { chain: "cmdListCatalogData", context: JSON.stringify({ category: category, resolve: { importId: importId, field: field } }) } });
  if (!ExeChain.ok || !ExeChain.outData) return { ok: false, msg: "No se pudo resolver el catálogo: " + (ExeChain.msg || "sin respuesta") };
  const resolved = JSON.parse(JSON.stringify(ExeChain.outData));
  if (!resolved.ok) return { ok: false, msg: resolved.msg };
  const source = resolved.source;

  const all = lcddLoad(source).map(r => ({
    code: lcddText(r.code), name: lcddText(r.name), parentCode: lcddText(r.parentCode),
    parent: r.parentCode == null || lcddText(r.parentCode) === "" ? "" : lcddText(r.parentCode) + (lcddText(r.parentName) ? " - " + lcddText(r.parentName) : "")
  })).filter(r => r.code !== "");
  all.sort((a, b) => lcddCompare(a.parentCode, b.parentCode) || lcddCompare(a.code, b.code) || lcddCompare(a.name, b.name));

  const key = lcddNorm(search);
  const found = key ? all.filter(r => lcddNorm(r.code).indexOf(key) >= 0 || lcddNorm(r.name).indexOf(key) >= 0 || lcddNorm(r.parent).indexOf(key) >= 0) : all;
  const total = found.length;
  const last = total ? Math.floor((total - 1) / size) : 0;
  if (page > last) page = last;
  const rows = found.slice(page * size, page * size + size).map((r, i) => {
    const row = { key: String(page * size + i), code: r.code, name: r.name };
    if (source.parent) row.parent = r.parent;
    return row;
  });
  return {
    ok: true, msg: total + " registro(s)" + (key ? " que coinciden con «" + search + "»" : "") + ".",
    catalog: resolved.catalog, search: search, total: total, page: page, size: size, rows: rows
  };
} catch (e) {
  return { ok: false, msg: "No se pudo consultar el catálogo: " + String(e && e.message || e) };
}

function lcddLoad(source) {
  if (source.kind === "sql") return lcddQuery(source.sql);
  if (source.kind === "list") return source.values.map(v => ({ code: v[0], name: v[1] }));
  if (source.kind === "table") return lcddTableRows(source);
  if (source.kind === "form") return lcddFormOptions(source);
  if (source.kind === "periodicity") return lcddPeriodicities(source);
  if (source.kind === "tariff") return lcddTariff(source);
  if (source.kind === "events") return lcddEvents();
  throw new Error("tipo de catálogo no soportado: " + source.kind);
}

function lcddTableRows(source) {
  const byLob = r => !source.lobColumn || r[source.lobColumn] === source.lob;
  const parents = {};
  if (source.parentOf) {
    const p = source.parentOf;
    lcddTable(p.table).filter(r => !p.lobColumn || r[p.lobColumn] === source.lob).forEach(r => { if (!(r[p.code] in parents)) parents[r[p.code]] = r[p.label]; });
  }
  return lcddTable(source.table).filter(byLob).map(r => {
    const row = { code: r[source.code], name: r[source.label] };
    if (source.parentOf) { row.parentCode = r[source.parentOf.column]; row.parentName = parents[r[source.parentOf.column]] || ""; }
    return row;
  });
}

function lcddFormOptions(source) {
  let fields;
  if (source.objectCode) {
    doCmd({ cmd: "RepoObjectDefinition", data: { operation: "GET", filter: "code = '" + source.objectCode + "'", include: ["Form"], noTracking: true } });
    if (!RepoObjectDefinition.ok) throw new Error("no se pudo leer el objeto " + source.objectCode + ": " + RepoObjectDefinition.msg);
    const definitions = lcddRows(RepoObjectDefinition.outData);
    if (!definitions.length || !definitions[0].Form || !definitions[0].Form.json) throw new Error("el objeto " + source.objectCode + " no tiene formulario");
    fields = JSON.parse(definitions[0].Form.json);
  } else {
    doCmd({ cmd: "GetForms", data: { filter: "name='" + source.formName + "'" } });
    if (!GetForms.ok) throw new Error("no se pudo leer el formulario " + source.formName + ": " + GetForms.msg);
    const forms = lcddRows(GetForms.outData);
    if (!forms.length || !forms[0].json) throw new Error("no existe el formulario " + source.formName);
    fields = JSON.parse(forms[0].json);
  }
  const fieldDef = (Array.isArray(fields) ? fields : []).find(f => f && f.name === source.field);
  if (!fieldDef) throw new Error("el formulario no tiene el campo " + source.field);
  const exclude = source.exclude || [];
  return (fieldDef.values || []).filter(o => o && o.value !== null && o.value !== undefined && String(o.value) !== "" && exclude.indexOf(String(o.value)) < 0)
    .map(o => ({ code: o.value, name: o.label == null || o.label === "" ? o.value : o.label }));
}

function lcddPeriodicities(source) {
  const products = lcddQuery("SELECT TOP 1 JSON_QUERY(configJson, '$.Premium') premium FROM Product WHERE code = N'" + String(source.product).replace(/'/g, "''") + "' AND ISJSON(configJson) = 1");
  if (!products.length) throw new Error("no existe el producto " + source.product);
  const premium = products[0].premium ? JSON.parse(products[0].premium) : {};
  const out = [];
  const add = (code, name) => { const c = lcddText(code); if (c && !out.some(o => o.code === c)) out.push({ code: c, name: lcddText(name) || c }); };
  if (source.style === "unica") {
    (premium.periodicity || []).forEach(p => {
      if (typeof p === "string") { if (lcddPerYear(p) > 0) add(p, lcddStandardPeriodicity[p] || p); }
      else if (p && Array.isArray(p.custom)) p.custom.forEach(c => { if (c && lcddPerYear(c.expression) > 0) add(c.expression, c.name); });
    });
    return out;
  }
  const walk = item => {
    if (!item) return;
    if (typeof item === "string") { add(item, item); return; }
    if (Array.isArray(item)) { item.forEach(walk); return; }
    if (item.custom) walk(item.custom);
    if (item.expression || item.code || item.value) add(item.expression || item.code || item.value, item.name || item.label);
  };
  walk(premium.periodicity);
  if (!out.length) add(premium.defaultPeriodicity || "m12", "Anual");
  return out;
}

function lcddPerYear(code) {
  const c = String(code || "").trim();
  if (c === "y") return 1;
  if (c === "s") return 2;
  if (c === "q") return 4;
  if (c === "m") return 12;
  const custom = c.match(/^m(\d+)$/);
  return custom && Number(custom[1]) > 0 ? 12 / Number(custom[1]) : 0;
}

function lcddTariff(source) {
  const row = lcddTable("cfgCobtarAuto").find(r => lcddNorm(r.productCode) === lcddNorm(source.product)
    && String(r.coverageCode) === source.coverage && r.name === source.tariffField);
  if (!row) return [];
  try {
    const clean = String(row.catalog || "").replace(/([{,]\s*)(\w+)\s*:/g, "$1\"$2\":").replace(/'/g, "\"");
    return (JSON.parse(clean || "[]") || []).map(o => ({ code: o.code, name: o.name }));
  } catch (e) {
    throw new Error("la lista de la cobertura " + source.coverage + " en cfgCobtarAuto no se puede leer");
  }
}

function lcddEvents() {
  const reasons = {};
  lcddQuery("SELECT code FROM EventReasonCatalog WHERE ISNULL(disabled, 0) = 0").forEach(r => { reasons[lcddText(r.code)] = true; });
  const used = {};
  lcddTable("SysInsuredEventsPerCoverage").forEach(r => {
    if (!reasons[r.EventReason]) return;
    String(r.InsuredEvents || "").split(",").forEach(e => { const c = e.trim(); if (c) used[c] = true; });
  });
  return lcddQuery("SELECT code, name FROM InsuredEventCatalog WHERE ISNULL(disabled, 0) = 0").filter(e => used[lcddText(e.code)]);
}

function lcddTable(name) {
  if (lcddCache[name]) return lcddCache[name];
  doCmd({ cmd: "GetFullTable", data: { table: name } });
  if (!GetFullTable.ok) throw new Error("no se pudo leer la tabla " + name + ": " + GetFullTable.msg);
  const data = JSON.parse(JSON.stringify(GetFullTable.outData || []));
  const keys = (data[0] || []).map(h => lcddText(h));
  lcddCache[name] = data.slice(1).filter(r => Array.isArray(r)).map(r => {
    const o = {};
    keys.forEach((k, i) => { if (k && !(k in o)) o[k] = lcddText(r[i]); });
    return o;
  });
  return lcddCache[name];
}

function lcddQuery(sql) {
  doCmd({ cmd: "DoQuery", data: { sql: sql } });
  if (!DoQuery.ok) throw new Error(DoQuery.msg || "error de consulta");
  return JSON.parse(JSON.stringify(DoQuery.outData || []));
}

function lcddRows(value) {
  const data = JSON.parse(JSON.stringify(value || []));
  return Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
}

function lcddText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function lcddNorm(value) {
  return lcddText(value).toUpperCase().replace(/[ÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜÑ]/g, ch => lcddAccents[ch]).replace(/\s+/g, " ");
}

function lcddCompare(x, y) {
  const a = lcddText(x), b = lcddText(y);
  const na = /^\d+$/.test(a), nb = /^\d+$/.test(b);
  if (na && nb && Number(a) !== Number(b)) return Number(a) - Number(b);
  if (na !== nb) return na ? -1 : 1;
  const ua = lcddNorm(a), ub = lcddNorm(b);
  return ua < ub ? -1 : ua > ub ? 1 : 0;
}
