//block
//noreplace
/**
 * @chain    cmdPreValidationUNICA
 * @category PREPROCESSOR
 * @purpose  Preprocesador y validador compartido de las cargas masivas UNICA (ramo 31):
 *           «Carga Masiva UNICA CLASICA» (UNICA_CLA) y «Carga Masiva UNICA PREMIUM» (UNICA_PLA).
 * @mission  MSN-000027 (global1) — 2026-09-23
 */

const HEADERS = ["casegurado", "cacreedor", "Sucursal", "Frecuencia_Pago", "Forma_Pago", "Fdesde", "Fhasta",
  "SumaAsegurada", "Salario", "Peso", "Altura", "NroPrestamo", "TipoPrestamo",
  "Cob_168*", "Cob_168_Suma Asegurada", "Cob_169*", "Cob_169_Suma Asegurada"];
// Columnas de cobertura: [índice de la marca, índice de la suma, código de cobertura]
const COVERAGE_COLUMNS = [[13, 14, "168"], [15, 16, "169"]];
const UNICA_PRODUCTS = ["UNICA_CLA", "UNICA_PLA"];
const OBJECT_CODE = "DT_ACCIDENTES_V1";
const MAX_LISTED_ERRORS = 15;
const DEFAULT_RECEIPT_TYPE = "1"; // Recibo
const STANDARD_PERIODICITY = {
  y: ["anual", "annual", "yearly"],
  s: ["semestral", "semiannual"],
  q: ["trimestral", "quarterly"],
  m: ["mensual", "monthly"]
};
const YES = ["s", "si", "x", "1", "y", "yes", "true", "obligatoria"];
const NO = ["", "n", "no", "0", "false"];

const args = typeof context === "string" ? JSON.parse(context || "{}") : (context || {});

try {
  if (Array.isArray(args.cells)) return validateSingleRow(args);
  return validateFile(args);
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  if (Array.isArray(args.cells)) return { ok: false, errors: [`Error interno de validación: ${message}`], data: null };
  return { ok: false, msg: `No se pudo validar el archivo: ${message}` };
}

// ---------------------------------------------------------------------------------------------
// Modos
// ---------------------------------------------------------------------------------------------

function validateSingleRow(input) {
  const productCode = String(input.productCode || "").trim();
  if (!productCode) return { ok: false, errors: ["No se indicó el producto a validar."], data: null };
  const cells = input.cells.map(clean);
  const catalogs = loadCatalogs([productCode], [cells[0], cells[1]]);
  if (!catalogs.products[productCode])
    return { ok: false, errors: [`El producto ${productCode} no existe en el ambiente.`], data: null };
  const result = validateRow(cells, catalogs, [productCode]);
  if (result.errors.length === 0) {
    const duplicated = findIssuedDuplicate(productCode, result.data);
    if (duplicated) result.errors.push(duplicated);
  }
  return { ok: result.errors.length === 0, errors: result.errors, data: result.data };
}

function validateFile(input) {
  const text = decodeFile(String(input.fileContent || ""));
  const lines = splitLines(text);
  const firstIndex = lines.findIndex(l => l.text.trim() !== "");
  if (firstIndex < 0) return { ok: false, msg: "Archivo rechazado: el archivo está vacío." };

  const separator = detectSeparator(lines[firstIndex].text);
  const header = fitToTemplate(parseCsvLine(lines[firstIndex].text, separator).map(clean));

  const headerErrors = validateHeader(header);
  if (headerErrors.length > 0)
    return { ok: false, msg: `Archivo rechazado: la plantilla no respeta el formato. ${headerErrors.join(" ")}` };

  const rows = [];
  for (let i = firstIndex + 1; i < lines.length; i++) {
    const cells = fitToTemplate(parseCsvLine(lines[i].text, separator).map(clean));
    if (cells.length === 0 || cells.every(c => c === "")) continue;
    rows.push({ line: lines[i].number, cells });
  }
  if (rows.length === 0) return { ok: false, msg: "Archivo rechazado: no tiene filas de datos debajo del encabezado." };

  const catalogs = loadCatalogs(UNICA_PRODUCTS, rows.reduce((ids, r) => ids.concat([r.cells[0], r.cells[1]]), []));
  const errors = [];
  const seenLoans = {};

  rows.forEach(r => {
    if (r.cells.length !== HEADERS.length) {
      errors.push(`Línea ${r.line}: tiene ${r.cells.length} columnas y la plantilla exige ${HEADERS.length}.`);
      return;
    }
    const result = validateRow(r.cells, catalogs, UNICA_PRODUCTS.filter(p => catalogs.products[p]));
    result.errors.forEach(e => errors.push(`Línea ${r.line}: ${e}`));
    if (result.errors.length === 0 && result.data.loanNumber) {
      const key = `${result.data.insuredId}|${result.data.loanNumber}`;
      if (seenLoans[key])
        errors.push(`Línea ${r.line}: el préstamo ${result.data.loanNumber} del asegurado ${result.data.insuredId} ya viene en la línea ${seenLoans[key]}.`);
      else seenLoans[key] = r.line;
    }
  });

  if (errors.length > 0) {
    const listed = errors.slice(0, MAX_LISTED_ERRORS).join(" ");
    const more = errors.length > MAX_LISTED_ERRORS ? ` … y ${errors.length - MAX_LISTED_ERRORS} error(es) más.` : "";
    return { ok: false, msg: `Archivo rechazado: ${errors.length} error(es) en ${rows.length} fila(s). Corrija y vuelva a cargar. ${listed}${more}` };
  }

  const outData = [HEADERS.slice()].concat(rows.map(r => r.cells));
  return { ok: true, msg: `Archivo validado: ${rows.length} fila(s) listas para procesar.`, outData };
}

// ---------------------------------------------------------------------------------------------
// Validación de una fila
// ---------------------------------------------------------------------------------------------

function validateRow(cells, catalogs, productCodes) {
  const errors = [];
  const data = {};

  // casegurado: contacto persona, activo y con fecha de nacimiento. Es también el pagador.
  const insured = cells[0];
  if (!insured) errors.push("casegurado es obligatorio.");
  else if (!/^\d+$/.test(insured)) errors.push(`casegurado «${insured}» debe ser el código numérico de un contacto.`);
  else {
    const contact = catalogs.contacts[Number(insured)];
    if (!contact) errors.push(`casegurado ${insured} no existe como contacto.`);
    else if (contact.inactive) errors.push(`casegurado ${insured} es un contacto inactivo.`);
    else if (!contact.isPerson) errors.push(`casegurado ${insured} no es una persona física.`);
    else if (!contact.birth) errors.push(`casegurado ${insured} no tiene fecha de nacimiento; es necesaria para la edad de suscripción.`);
    else {
      data.insuredId = Number(insured);
      data.insuredBirth = contact.birth;
      // Tipo de comprobante: el de la ficha del contacto (como la pantalla); si no tiene, Recibo.
      data.receiptTypeCode = contact.receiptTypeCode ? String(contact.receiptTypeCode) : DEFAULT_RECEIPT_TYPE;
    }
  }

  // cacreedor: opcional; vacío o cero = sin cesionario.
  const creditor = cells[1];
  data.cessionId = null;
  if (creditor && creditor !== "0") {
    if (!/^\d+$/.test(creditor)) errors.push(`cacreedor «${creditor}» debe ser el código numérico de un contacto, o vacío/0 para emitir sin cesionario.`);
    else if (Number(creditor) !== 0) {
      const contact = catalogs.contacts[Number(creditor)];
      if (!contact) errors.push(`cacreedor ${creditor} no existe como contacto.`);
      else if (contact.inactive) errors.push(`cacreedor ${creditor} es un contacto inactivo.`);
      else data.cessionId = Number(creditor);
    }
  }

  // Sucursal: código o nombre del catálogo de sucursales.
  const branch = findInCatalog(catalogs.branches, cells[2]);
  if (!cells[2]) errors.push("Sucursal es obligatoria.");
  else if (!branch) errors.push(`Sucursal «${cells[2]}» no existe. Valores válidos: ${catalogs.branches.map(b => b.code).join(", ")}.`);
  else data.branchCode = branch.code;

  // Forma_Pago: código o nombre del catálogo de formas de pago de emisión.
  const method = findInCatalog(catalogs.paymentMethods, cells[4]);
  if (!cells[4]) errors.push("Forma_Pago es obligatoria.");
  else if (!method) errors.push(`Forma_Pago «${cells[4]}» no existe. Valores válidos: ${catalogs.paymentMethods.map(p => p.code).join(", ")}.`);
  else data.paymentMethod = method.code;

  // Fechas de vigencia.
  const start = parseDate(cells[5]);
  const end = parseDate(cells[6]);
  if (!cells[5]) errors.push("Fdesde es obligatoria.");
  else if (!start) errors.push(`Fdesde «${cells[5]}» no es una fecha válida (use DD/MM/AAAA o AAAA-MM-DD).`);
  if (!cells[6]) errors.push("Fhasta es obligatoria.");
  else if (!end) errors.push(`Fhasta «${cells[6]}» no es una fecha válida (use DD/MM/AAAA o AAAA-MM-DD).`);
  if (start && end) {
    if (end.time <= start.time) errors.push(`Fhasta (${end.iso}) debe ser posterior a Fdesde (${start.iso}).`);
    else {
      data.start = start.iso;
      data.end = end.iso;
      Object.assign(data, termBetween(start, end));
    }
  }

  // Importes.
  const insuredSum = parseAmount(cells[7]);
  if (!cells[7]) errors.push("SumaAsegurada es obligatoria.");
  else if (insuredSum === null || insuredSum <= 0) errors.push(`SumaAsegurada «${cells[7]}» debe ser un importe mayor que cero.`);
  else data.insuredSum = insuredSum;

  [[8, "Salario", "salary"], [9, "Peso", "weight"], [10, "Altura", "height"]].forEach(([i, label, key]) => {
    if (!cells[i]) { data[key] = null; return; }
    const value = parseAmount(cells[i]);
    if (value === null || value < 0) errors.push(`${label} «${cells[i]}» debe ser un número mayor o igual a cero.`);
    else data[key] = value;
  });

  // Préstamo.
  data.loanNumber = cells[11] || null;
  if (cells[11] && !/^\d+$/.test(cells[11])) errors.push(`NroPrestamo «${cells[11]}» debe ser numérico (el campo No. de Préstamo del objeto asegurado es numérico).`);
  data.loanType = null;
  if (cells[12]) {
    const loanType = findInCatalog(catalogs.loanTypes, cells[12]);
    if (!loanType) errors.push(`TipoPrestamo «${cells[12]}» no existe en el formulario ${OBJECT_CODE}. Valores válidos: ${catalogs.loanTypes.map(t => t.code).join(", ")}.`);
    else data.loanType = loanType.code;
  }

  // Validaciones que dependen del producto: frecuencia, coberturas y duración.
  // En modo archivo no se sabe qué importación se eligió: la fila es válida si lo es para alguno de los productos UNICA.
  let productErrors = null;
  for (const productCode of productCodes) {
    const product = catalogs.products[productCode];
    const own = validateAgainstProduct(cells, product, data);
    if (own.errors.length === 0) { productErrors = []; Object.assign(data, own.data); data.productCode = productCode; break; }
    if (productErrors === null) productErrors = own.errors;
  }
  (productErrors || []).forEach(e => errors.push(e));

  return { errors, data };
}

function validateAgainstProduct(cells, product, base) {
  const errors = [];
  const data = {};

  const periodicity = findPeriodicity(product, cells[3]);
  if (!cells[3]) errors.push("Frecuencia_Pago es obligatoria.");
  else if (!periodicity) errors.push(`Frecuencia_Pago «${cells[3]}» no está configurada en ${product.code}. Valores válidos: ${product.periodicities.map(p => `${p.code} (${p.label})`).join(", ")}.`);
  else {
    data.periodicity = periodicity.code;
    data.paymentsPerYear = periodicity.perYear;
    if (base.termMonthsTotal) data.installments = Math.max(1, Math.ceil(periodicity.perYear * base.termMonthsTotal / 12));
  }

  if (base.termMonthsTotal) {
    if (product.maxMonths && (base.termMonthsTotal > product.maxMonths || (base.termMonthsTotal === product.maxMonths && base.extraDays > 0)))
      errors.push(`La vigencia de ${base.start} a ${base.end} supera la duración máxima del producto ${product.code} (${product.maxMonths} meses).`);
    if (product.minMonths && base.termMonthsTotal < product.minMonths)
      errors.push(`La vigencia de ${base.start} a ${base.end} es menor que la duración mínima del producto ${product.code} (${product.minMonths} meses).`);
  }

  data.coverages = [];
  COVERAGE_COLUMNS.forEach(([flagIndex, sumIndex, code]) => {
    const flagHeader = HEADERS[flagIndex];
    const sumHeader = HEADERS[sumIndex];
    const coverage = product.coverages.find(c => String(c.code) === code);
    const flag = norm(cells[flagIndex]);
    let included;
    if (YES.includes(flag) || flag === code) included = true;
    else if (NO.includes(flag)) included = false;
    else { errors.push(`${flagHeader} «${cells[flagIndex]}» no es válido: use S/1 para incluir la cobertura o N/0/vacío para excluirla.`); return; }

    let sum = null;
    if (cells[sumIndex]) {
      sum = parseAmount(cells[sumIndex]);
      if (sum === null || sum < 0) { errors.push(`${sumHeader} «${cells[sumIndex]}» debe ser un importe mayor o igual a cero.`); return; }
    }

    if (!coverage) {
      if (included) errors.push(`La cobertura ${code} no está configurada en el producto ${product.code}.`);
      return;
    }
    if (coverage.mandatory && !included)
      errors.push(`${flagHeader}: la cobertura ${code} (${coverage.name}) es obligatoria en ${product.code}; marque S o 1.`);
    if (!included && sum)
      errors.push(`${sumHeader} trae ${sum} pero la cobertura ${code} no está incluida.`);
    if (included) data.coverages.push({ code, name: coverage.name, sum: sum || null });
  });

  return { errors, data };
}

function findIssuedDuplicate(productCode, data) {
  if (!data || !data.loanNumber || !data.insuredId) return null;
  const sql = `SELECT TOP 1 lp.id, lp.code FROM LifePolicy lp
    JOIN InsuredObject io ON io.lifePolicyId = lp.id
    JOIN ObjectDefinition od ON od.id = io.objectDefinitionId AND od.code = '${OBJECT_CODE}'
    CROSS APPLY OPENJSON(io.jValues) WITH (name NVARCHAR(200) '$.name', ud NVARCHAR(MAX) '$.userData' AS JSON) f
    WHERE lp.productCode = '${sqlText(productCode)}' AND lp.active = 1 AND lp.holderId = ${Number(data.insuredId)}
      AND f.name = 'txtNoPrestamo' AND JSON_VALUE(f.ud, '$[0]') = '${sqlText(data.loanNumber)}'`;
  doCmd({ cmd: "DoQuery", data: { sql } });
  if (!DoQuery.ok) throw new Error(`No se pudo comprobar duplicados: ${DoQuery.msg}`);
  const found = (DoQuery.outData || [])[0];
  return found ? `Ya existe la póliza emitida ${found.code} (id ${found.id}) de ${productCode} para el asegurado ${data.insuredId} y el préstamo ${data.loanNumber}.` : null;
}

// ---------------------------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------------------------

function loadCatalogs(productCodes, contactValues) {
  const catalogs = { products: {}, contacts: {}, branches: [], paymentMethods: [], loanTypes: [] };

  doCmd({ cmd: "RepoProduct", data: { operation: "GET", filter: `code IN (${productCodes.map(p => `'${sqlText(p)}'`).join(",")})`, noTracking: true } });
  if (!RepoProduct.ok) throw new Error(`No se pudo leer la configuración de producto: ${RepoProduct.msg}`);
  (RepoProduct.outData || []).forEach(p => { catalogs.products[p.code] = readProduct(p); });

  const ids = Array.from(new Set(contactValues.filter(v => /^\d+$/.test(String(v || "").trim())).map(v => Number(v)).filter(v => v > 0)));
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    doCmd({ cmd: "DoQuery", data: { sql: `SELECT id, isPerson, inactive, birth, receiptTypeCode FROM Contact WHERE id IN (${chunk.join(",")})` } });
    if (!DoQuery.ok) throw new Error(`No se pudieron leer los contactos: ${DoQuery.msg}`);
    (DoQuery.outData || []).forEach(c => { catalogs.contacts[c.id] = c; });
  }

  doCmd({ cmd: "DoQuery", data: { sql: "SELECT code, name FROM Branch" } });
  if (!DoQuery.ok) throw new Error(`No se pudo leer el catálogo de sucursales: ${DoQuery.msg}`);
  catalogs.branches = (DoQuery.outData || []).map(b => ({ code: String(b.code).trim(), name: String(b.name || "").trim() }));

  doCmd({ cmd: "RepoPaymentMethodCatalog", data: { operation: "GET", size: 1000, noTracking: true } });
  if (!RepoPaymentMethodCatalog.ok) throw new Error(`No se pudo leer el catálogo de formas de pago: ${RepoPaymentMethodCatalog.msg}`);
  catalogs.paymentMethods = (RepoPaymentMethodCatalog.outData || [])
    .filter(p => !p.module || p.module === "ISSUANCE")
    .map(p => ({ code: String(p.code).trim(), name: String(p.name || "").trim() }));

  doCmd({ cmd: "RepoObjectDefinition", data: { operation: "GET", filter: `code = '${OBJECT_CODE}'`, include: ["Form"], noTracking: true } });
  const definition = (RepoObjectDefinition.outData || [])[0];
  if (!definition || !definition.Form) throw new Error(`No existe el objeto asegurado ${OBJECT_CODE} o su formulario.`);
  const loanField = JSON.parse(definition.Form.json).find(f => f.name === "cmbTipoPrestamo");
  catalogs.loanTypes = ((loanField && loanField.values) || [])
    .filter(v => v.value && v.value !== "option-1")
    .map(v => ({ code: String(v.value).trim(), name: String(v.label || "").trim() }));

  return catalogs;
}

function readProduct(product) {
  const config = product.configJson ? JSON.parse(product.configJson) : {};
  const main = config.Main || {};
  const premium = config.Premium || {};
  const periodicities = [];
  (premium.periodicity || []).forEach(p => {
    if (typeof p === "string") {
      periodicities.push({ code: p, label: (STANDARD_PERIODICITY[p] || [p])[0], names: [p].concat(STANDARD_PERIODICITY[p] || []), perYear: paymentsPerYear(p) });
    } else if (p && Array.isArray(p.custom)) {
      p.custom.forEach(c => periodicities.push({ code: c.expression, label: c.name, names: [c.expression, c.name], perYear: paymentsPerYear(c.expression) }));
    }
  });
  return {
    code: product.code,
    currency: main.currency || "USD",
    periodicities: periodicities.filter(p => p.perYear > 0),
    coverages: (config.Coverages || []).map(c => ({ code: String(c.code), name: c.name, mandatory: c.mandatory === true })),
    maxMonths: durationMonths(main.maxDuration),
    minMonths: durationMonths(main.minDuration)
  };
}

function paymentsPerYear(code) {
  const c = String(code || "").trim();
  if (c === "y") return 1;
  if (c === "s") return 2;
  if (c === "q") return 4;
  if (c === "m") return 12;
  const custom = c.match(/^m(\d+)$/);
  if (custom && Number(custom[1]) > 0) return 12 / Number(custom[1]);
  return 0;
}

function durationMonths(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value * 12;
  const s = String(value).trim();
  if (/^\d+$/.test(s)) return Number(s) * 12;
  const ym = s.match(/^(\d+)m(\d+)$/);
  return ym ? Number(ym[1]) * 12 + Number(ym[2]) : 0;
}

function findPeriodicity(product, value) {
  const v = norm(value);
  if (!v) return null;
  return product.periodicities.find(p => p.names.some(n => norm(n) === v)) || null;
}

function findInCatalog(list, value) {
  const v = norm(value);
  if (!v) return null;
  return list.find(i => norm(i.code) === v) || list.find(i => norm(i.name) === v) || null;
}

// ---------------------------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------------------------

function termBetween(start, end) {
  let months = (end.y - start.y) * 12 + (end.m - start.m);
  let days = end.d - start.d;
  if (days < 0) {
    months -= 1;
    const previousMonthDays = new Date(Date.UTC(end.y, end.m - 1, 0)).getUTCDate();
    days += previousMonthDays;
  }
  return { termMonthsTotal: months, termYears: Math.floor(months / 12), termMonths: months % 12, extraDays: days };
}

function parseDate(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  let y, m, d;
  let match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/);
  if (match) { y = +match[1]; m = +match[2]; d = +match[3]; }
  else {
    match = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (!match) return null;
    d = +match[1]; m = +match[2]; y = +match[3];
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { y, m, d, iso, time: date.getTime() };
}

function parseAmount(value) {
  let s = String(value === null || value === undefined ? "" : value).trim().replace(/\s+/g, "");
  if (!s) return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  else s = s.replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 100) / 100;
}

function norm(value) {
  return String(value === null || value === undefined ? "" : value)
    .trim().toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u");
}

function clean(value) {
  return String(value === null || value === undefined ? "" : value).replace(/^﻿/, "").trim();
}

function sqlText(value) {
  return String(value).replace(/'/g, "''");
}

function validateHeader(header) {
  const errors = [];
  if (header.length !== HEADERS.length)
    errors.push(`El encabezado tiene ${header.length} columnas y la plantilla exige exactamente ${HEADERS.length}, en este orden: ${HEADERS.join(" | ")}.`);
  const wrong = [];
  for (let i = 0; i < Math.min(header.length, HEADERS.length); i++) {
    if (header[i] !== HEADERS[i]) wrong.push(`columna ${i + 1} dice «${header[i]}» y debe decir «${HEADERS[i]}»`);
  }
  if (wrong.length > 0) errors.push(`Nombres de columna distintos a la plantilla: ${wrong.join("; ")}.`);
  return errors;
}

function fitToTemplate(cells) {
  // Excel suele dejar separadores de más al final: se descartan sólo si esas celdas sobrantes están vacías.
  const out = cells.slice();
  while (out.length > HEADERS.length && out[out.length - 1] === "") out.pop();
  return out;
}

function decodeFile(binary) {
  // El formulario lee el archivo como cadena binaria: si los bytes son UTF-8 se decodifican; si no, quedan como Latin-1.
  let text = binary;
  if (/[\u0080-ÿ]/.test(binary)) {
    const decoded = decodeUtf8(binary);
    if (decoded !== null) text = decoded;
  }
  return text.replace(/^﻿/, "");
}

function decodeUtf8(binary) {
  let out = "";
  for (let i = 0; i < binary.length; i++) {
    const c = binary.charCodeAt(i);
    if (c > 0xff) return null;
    if (c < 0x80) { out += binary[i]; continue; }
    let extra, code;
    if (c >= 0xc2 && c <= 0xdf) { extra = 1; code = c & 0x1f; }
    else if (c >= 0xe0 && c <= 0xef) { extra = 2; code = c & 0x0f; }
    else if (c >= 0xf0 && c <= 0xf4) { extra = 3; code = c & 0x07; }
    else return null;
    if (i + extra >= binary.length) return null;
    for (let k = 1; k <= extra; k++) {
      const cc = binary.charCodeAt(i + k);
      if ((cc & 0xc0) !== 0x80) return null;
      code = (code << 6) | (cc & 0x3f);
    }
    i += extra;
    out += String.fromCodePoint(code);
  }
  return out;
}

function splitLines(text) {
  return text.split(/\r\n|\n|\r/).map((line, i) => ({ number: i + 1, text: line }));
}

function detectSeparator(headerLine) {
  const candidates = [";", ",", "\t", "|"];
  const exact = candidates.find(s => parseCsvLine(headerLine, s).length === HEADERS.length);
  if (exact) return exact;
  let best = ",", bestCount = 0;
  candidates.forEach(s => { const n = parseCsvLine(headerLine, s).length; if (n > bestCount) { best = s; bestCount = n; } });
  return best;
}

function parseCsvLine(line, separator) {
  const cells = [];
  let current = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') quoted = false;
      else current += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === separator) { cells.push(current); current = ""; }
    else current += ch;
  }
  cells.push(current);
  return cells;
}
