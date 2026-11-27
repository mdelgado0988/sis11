/**
 * @author aiden_mission_configurator
 * @created 2026-11-09
 * @name CLPlantillasDeTransacciones
 * @version 1.1.0 (2026-11-27, MSN-000285 / AXX-12159, globaluat) Plantilla PagoTesoreria: el catalogo de variables
 *          incluye cmdContabilizaPagoTesoreriaDTO y "View Accounts" abre la tabla cfgTransaccionesTesoreria con las
 *          variables de monto sugeridas en VariableDebito/VariableCredito, la lista de variables de la Descripcion,
 *          un buscador de filas y la validacion de variables antes de guardar.
 * @summary Replica de la vista nativa Contabilidad > Plantillas (#/accounting/templates): pestanas "Lista de
 *          plantillas" y "Plantilla de transacciones", los mismos campos, botones, comandos y mensajes que la
 *          pantalla nativa del front 11.3.47.
 * @issue   MSN-000105 rev 2 (global1). Editor del comportamiento: opcion A (editor integrado), elegida en T03.
 *
 * Alcance pedido: solo esta vista. No modifica la vista nativa ni las plantillas existentes, y llama unicamente los
 * comandos que llama la nativa:
 *   RepoTransactionTemplate GET (lista), ADD / UPDATE {code, name, active, config, jConfig} (Guardar),
 *   y ExeTransactionTemplate {code} (Ejecutar ahora). No ofrece Eliminar: las plantillas se borran desde la nativa.
 *
 * Libreria YAML: no se descarga nada. El motor de vistas personalizadas entrega a cada vista el nombre `yaml`, que es
 * el modulo js-yaml 3.13.1 del front, el mismo `import yaml from "js-yaml"` que usa la pantalla nativa. Guardar hace
 * lo mismo que la nativa: jConfig = JSON.stringify(yaml.safeLoad(config)), y un error de sintaxis se muestra con
 * notification.error({message: error.reason, description: error.message}) (motivo, linea, columna y fragmento).
 *
 * Textos: las mismas claves de traduccion que la nativa con el `t` del scope, asi la vista muestra lo mismo que la
 * nativa en el idioma de la sesion.
 *
 * Notas de plataforma (no borrar):
 *  - Motor react-live 2.4.1 -> buble 0.19.6: sin arrow async, sin ?. ni ??, sin fragmentos <>, sin entidades HTML
 *    en JSX, sin spread de Set y solo ASCII.
 *  - El scope no trae @ant-design/icons, @ant-design/compatible (Form.create) ni CodeMirror: los iconos son los
 *    mismos SVG de antd, Form.create replica rc-form 2.4.12 y el editor del comportamiento es propio (ver
 *    CodeEditorW mas abajo) con la misma API window.global.templateBehaviour.setValue/getValue que usa la nativa.
 */
(function () {
  var Button = A.Button;
  var message = A.message;
  var notification = A.notification;
  var Table = A.Table;
  var Tabs = A.Tabs;
  var Input = A.Input;
  var Popconfirm = A.Popconfirm;
  var Switch = A.Switch;
  var Row = A.Row;
  var Col = A.Col;
  var Radio = A.Radio;
  var Drawer = A.Drawer;
  var Modal = A.Modal;
  var Tooltip = A.Tooltip;
  var Tag = A.Tag;
  var Alert = A.Alert;
  var Select = A.Select;
  var useRef = React.useRef;
  var useMemo = React.useMemo;
  var useContext = React.useContext;
  var useLayoutEffect = React.useLayoutEffect;

  /* TPL:BEGIN */
  /* ---------- Template logic (pure, no React) ----------
     Converts the template YAML to the basic-mode model (header + grid lines) and back, locates YAML lines for error
     messages, validates templates and holds the variables catalog. `yaml` is js-yaml 3.13.1 from the view scope, the
     same module the native screen uses, so jConfig = JSON.stringify(yaml.safeLoad(config)) stays identical.
     Model: { header: {key: value} without Lines, linesPos: index of Lines among the keys, lines: [{section: [comment
     lines], values: {key: value}}], stray: comments that do not sit right before a line (lost when regenerating) }. */
  var TPL = (function () {
    var LINE_COLUMNS = ["account", "debit", "credit", "comments", "condition", "map", "order"];
    var NUMERIC_KEYS = { debit: true, credit: true, order: true, status: true, entityId: true, organizationId: true };
    var SCAN_FIELDS = { cmd: true, chain: true, context: true, include: true };
    var KEY_RE = /^([A-Za-z_][A-Za-z0-9_]*)\s*:(?:\s|$)/;

    var isPlainObject = function (v) { return v !== null && typeof v === "object" && !Array.isArray(v); };
    var clone = function (v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); };
    var sameData = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
    var pad = function (n) { return new Array(n + 1).join(" "); };

    var parse = function (text) {
      try {
        return { ok: true, data: yaml.safeLoad(text) };
      } catch (e) {
        var mark = e && e.mark ? e.mark : null;
        var msg = e && e.message ? e.message : String(e);
        return { ok: false, error: { reason: e && e.reason ? e.reason : msg, message: msg, line: mark ? mark.line + 1 : 1, column: mark ? mark.column + 1 : 1 } };
      }
    };
    var plainError = function (reason, line) { return { ok: false, error: { reason: reason, message: reason, line: line || 1, column: 1 } }; };

    /* Line map of the YAML text: top-level and nested header keys, the Lines items with their keys, the comment lines
       right before each item (its section) and the count of the other comments. */
    var scanLayout = function (text) {
      var rows = String(text === undefined || text === null ? "" : text).split("\n");
      var layout = { header: {}, linesLine: 0, items: [], stray: 0 };
      var inLines = false, itemIndent = -1, keyIndent = -1, pending = [], current = null, stack = [];
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i].replace(/\s+$/, "");
        var n = i + 1;
        if (!row.trim()) continue;
        var indent = /^\s*/.exec(row)[0].length;
        var body = row.slice(indent);
        if (body.charAt(0) === "#") {
          if (inLines && !(current && indent > itemIndent)) pending.push(body);
          else layout.stray++;
          continue;
        }
        if (indent === 0) {
          layout.stray += pending.length;
          pending = [];
          inLines = false;
          current = null;
          var top = KEY_RE.exec(body);
          stack = top ? [{ indent: 0, key: top[1] }] : [];
          if (top) {
            layout.header[top[1]] = n;
            if (top[1] === "Lines") { inLines = true; layout.linesLine = n; }
          }
          continue;
        }
        if (inLines) {
          var dash = /^-(\s+|$)(.*)$/.exec(body);
          if (dash && (itemIndent < 0 || indent === itemIndent)) {
            itemIndent = indent;
            keyIndent = indent + 1 + dash[1].length;
            current = { line: n, keys: {}, section: pending };
            pending = [];
            layout.items.push(current);
            var first = KEY_RE.exec(dash[2]);
            if (first) current.keys[first[1]] = n;
          } else if (current && indent === keyIndent) {
            var key = KEY_RE.exec(body);
            if (key && !(key[1] in current.keys)) current.keys[key[1]] = n;
          }
          continue;
        }
        var nested = KEY_RE.exec(body);
        if (nested && stack.length) {
          while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
          stack.push({ indent: indent, key: nested[1] });
          layout.header[stack.map(function (s) { return s.key; }).join(".")] = n;
        }
      }
      layout.stray += pending.length;
      return layout;
    };
    var locate = function (layout, path) {
      if (!layout || !path || !path.length) return 1;
      if (path[0] === "Lines" && path.length > 1 && typeof path[1] === "number") {
        var item = layout.items[path[1]];
        if (!item) return layout.linesLine || 1;
        if (path.length > 2 && item.keys[path[2]]) return item.keys[path[2]];
        return item.line;
      }
      for (var k = path.length; k > 0; k--) {
        var key = path.slice(0, k).join(".");
        if (layout.header[key]) return layout.header[key];
      }
      return 1;
    };

    var emptyModel = function () {
      return {
        header: { scanCommand: { cmd: "ExeChain", data: { chain: "", context: "{id:_id}" } }, reference: "_reference", status: 1, code: "", description: "_description", entity: "", entityId: "_id" },
        linesPos: 7,
        lines: [],
        stray: 0
      };
    };
    var toModel = function (text) {
      var src = String(text === undefined || text === null ? "" : text);
      if (!src.trim()) return { ok: true, model: emptyModel(), empty: true };
      var p = parse(src);
      if (!p.ok) return p;
      var data = p.data;
      if (data === undefined || data === null) return { ok: true, model: emptyModel(), empty: true };
      if (!isPlainObject(data)) return plainError("La plantilla debe ser una lista de claves (clave: valor), no un valor suelto ni una lista.", 1);
      var layout = scanLayout(src);
      var header = {}, linesPos = -1;
      Object.keys(data).forEach(function (k, i) {
        if (k === "Lines") linesPos = i;
        else header[k] = clone(data[k]);
      });
      var raw = data.Lines;
      if (raw !== undefined && raw !== null && !Array.isArray(raw)) return plainError("Lines debe ser una lista de l\u00edneas (cada una empieza con \"- \").", layout.header.Lines);
      raw = raw || [];
      for (var i = 0; i < raw.length; i++) {
        if (!isPlainObject(raw[i])) return plainError("La l\u00ednea " + (i + 1) + " de Lines debe tener claves (account, debit, ...).", layout.items[i] ? layout.items[i].line : layout.header.Lines);
      }
      var aligned = layout.items.length === raw.length;
      var stray = layout.stray;
      if (!aligned) layout.items.forEach(function (it) { stray += it.section.length; });
      var lines = raw.map(function (item, idx) {
        return { section: aligned ? layout.items[idx].section.slice() : [], values: clone(item) };
      });
      return { ok: true, model: { header: header, linesPos: linesPos, lines: lines, stray: stray }, layout: layout };
    };

    /* ---- model -> YAML: readable output, checked against js-yaml so it always loads back to the same data ---- */
    var loadsAs = function (text, value) {
      try { return sameData(yaml.safeLoad("k: " + text), { k: value }); } catch (e) { return false; }
    };
    var scalarText = function (v) {
      if (typeof v === "string") {
        if (v.length && v.indexOf("\n") < 0 && v === v.trim() && loadsAs(v, v)) return v;
        return JSON.stringify(v);
      }
      if (v === null) return "null";
      return String(v);
    };
    var keyText = function (k) { return /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : JSON.stringify(k); };
    var emitMap, emitList;
    emitMap = function (obj, indent) {
      var out = "";
      Object.keys(obj).forEach(function (k) {
        var v = obj[k];
        if (v === undefined) return;
        var head = pad(indent) + keyText(k) + ":";
        if (isPlainObject(v)) out += Object.keys(v).length ? head + "\n" + emitMap(v, indent + 2) : head + " {}\n";
        else if (Array.isArray(v)) out += v.length ? head + "\n" + emitList(v, indent + 2) : head + " []\n";
        else out += head + " " + scalarText(v) + "\n";
      });
      return out;
    };
    emitList = function (arr, indent) {
      var out = "";
      arr.forEach(function (el) {
        if (isPlainObject(el) && Object.keys(el).length) out += pad(indent) + "- " + emitMap(el, indent + 2).slice(indent + 2);
        else if (isPlainObject(el) || Array.isArray(el)) out += pad(indent) + "- " + JSON.stringify(el) + "\n";
        else out += pad(indent) + "- " + scalarText(el) + "\n";
      });
      return out;
    };
    var linesPosition = function (model) {
      var count = Object.keys(model.header).length;
      return model.linesPos < 0 || model.linesPos > count ? count : model.linesPos;
    };
    var modelData = function (model) {
      var keys = Object.keys(model.header), pos = linesPosition(model), out = {};
      for (var i = 0; i <= keys.length; i++) {
        if (i === pos) out.Lines = model.lines.map(function (l) { return clone(l.values); });
        if (i < keys.length && model.header[keys[i]] !== undefined) out[keys[i]] = clone(model.header[keys[i]]);
      }
      return out;
    };
    var emitLines = function (lines) {
      if (!lines.length) return "Lines: []\n";
      var out = "Lines:\n";
      lines.forEach(function (l) {
        (l.section || []).forEach(function (c) { out += "  " + c + "\n"; });
        out += emitList([l.values], 2);
      });
      return out;
    };
    var toYaml = function (model) {
      var keys = Object.keys(model.header), pos = linesPosition(model), out = "";
      for (var i = 0; i <= keys.length; i++) {
        if (i === pos) out += emitLines(model.lines);
        if (i < keys.length) {
          var one = {};
          one[keys[i]] = model.header[keys[i]];
          out += emitMap(one, 0);
        }
      }
      var expected = modelData(model);
      try {
        if (sameData(yaml.safeLoad(out), expected)) return out;
      } catch (e) {
        //falls through to the plain dump
      }
      return yaml.safeDump(expected, { lineWidth: -1, noRefs: true });
    };

    /* ---- grid and form edits (immutable) ---- */
    var cellValue = function (key, text) {
      if (text === undefined || text === null) return undefined;
      var s = String(text).trim();
      if (!s) return undefined;
      if (NUMERIC_KEYS[key] && /^-?\d+(\.\d+)?$/.test(s)) return Number(s);
      return s;
    };
    var withLines = function (model, lines) { return Object.assign({}, model, { lines: lines }); };
    var setLineValue = function (model, index, key, text) {
      var lines = model.lines.slice();
      var values = Object.assign({}, lines[index].values);
      var v = cellValue(key, text);
      if (v === undefined) delete values[key];
      else values[key] = v;
      lines[index] = Object.assign({}, lines[index], { values: values });
      return withLines(model, lines);
    };
    var newLine = function () { return { section: [], values: { account: "", debit: 0, credit: 0, order: "_lineNumber" } }; };
    //adds an empty line at the end, or right after `afterIndex` (end of the section shown in the grid)
    var addLine = function (model, afterIndex) {
      var lines = model.lines.slice();
      if (typeof afterIndex === "number" && afterIndex >= 0 && afterIndex < lines.length) lines.splice(afterIndex + 1, 0, newLine());
      else lines.push(newLine());
      return withLines(model, lines);
    };
    var duplicateLine = function (model, index) {
      var lines = model.lines.slice();
      lines.splice(index + 1, 0, { section: [], values: clone(lines[index].values) });
      return withLines(model, lines);
    };
    var removeLine = function (model, index) {
      var lines = model.lines.slice();
      lines.splice(index, 1);
      return withLines(model, lines);
    };
    var moveLine = function (model, index, delta) {
      var to = index + delta;
      if (to < 0 || to >= model.lines.length) return model;
      var lines = model.lines.slice();
      var moved = lines.splice(index, 1)[0];
      lines.splice(to, 0, moved);
      return withLines(model, lines);
    };
    var sectionText = function (section) {
      return (section || []).map(function (c) { return c.replace(/^#+\s*/, "").replace(/\s*#*\s*$/, ""); }).join(" | ");
    };
    /* Blocks of lines the grid can show one at a time. When some line has two or more comment lines (EMISION + Primas),
       only those start a block, named after their first comment; otherwise every commented line starts one. Lines
       before the first block form "Sin seccion". No comments at all = no blocks. */
    var sectionBlocks = function (model) {
      var lines = model.lines, minLen = 1;
      if (lines.some(function (l) { return (l.section || []).length >= 2; })) minLen = 2;
      var cleanName = function (c) { return c.replace(/^[#\s*]+/, "").replace(/[#\s*]+$/, "") || "Secci\u00f3n"; };
      var blocks = [];
      lines.forEach(function (l, i) {
        var sec = l.section || [];
        if (sec.length >= minLen) blocks.push({ name: cleanName(sec[0]), start: i, end: i });
        else if (!blocks.length) blocks.push({ name: "Sin secci\u00f3n", start: i, end: i });
        else blocks[blocks.length - 1].end = i;
      });
      return blocks.length === 1 && blocks[0].name === "Sin secci\u00f3n" ? [] : blocks;
    };
    var setSection = function (model, index, text) {
      if (text === sectionText(model.lines[index].section)) return model;
      var parts = String(text || "").split("|").map(function (s) { return s.trim(); }).filter(Boolean);
      var lines = model.lines.slice();
      lines[index] = Object.assign({}, lines[index], { section: parts.map(function (s) { return "# " + s; }) });
      return withLines(model, lines);
    };
    var headerValue = function (model, field) {
      var h = model.header;
      if (SCAN_FIELDS[field]) {
        var sc = isPlainObject(h.scanCommand) ? h.scanCommand : {};
        if (field === "cmd") return sc.cmd;
        return isPlainObject(sc.data) ? sc.data[field] : undefined;
      }
      return h[field];
    };
    var setHeaderValue = function (model, field, text) {
      var v = cellValue(field, text);
      if (SCAN_FIELDS[field]) {
        var header = Object.assign({}, model.header);
        var sc = Object.assign({}, isPlainObject(header.scanCommand) ? header.scanCommand : {});
        if (field === "cmd") {
          if (v === undefined) delete sc.cmd;
          else sc.cmd = v;
        } else {
          var data = Object.assign({}, isPlainObject(sc.data) ? sc.data : {});
          if (v === undefined) delete data[field];
          else data[field] = v;
          sc.data = data;
        }
        if (!("scanCommand" in model.header)) return insertHeaderKey(model, "scanCommand", sc);
        header.scanCommand = sc;
        return Object.assign({}, model, { header: header });
      }
      if (field in model.header) {
        var keys = Object.keys(model.header), next = {}, pos = model.linesPos;
        keys.forEach(function (k, i) {
          if (k !== field) next[k] = model.header[k];
          else if (v !== undefined) next[k] = v;
          else if (i < pos) pos--;
        });
        return Object.assign({}, model, { header: next, linesPos: pos });
      }
      if (v === undefined) return model;
      return insertHeaderKey(model, field, v);
    };
    //a new header key goes right before Lines, so Lines stays the last block
    var insertHeaderKey = function (model, field, value) {
      var keys = Object.keys(model.header), pos = linesPosition(model), next = {};
      keys.forEach(function (k, i) {
        if (i === pos) next[field] = value;
        next[k] = model.header[k];
      });
      if (pos >= keys.length) next[field] = value;
      return Object.assign({}, model, { header: next, linesPos: pos + 1 });
    };
    var extraKeys = function (values) { return Object.keys(values || {}).filter(function (k) { return LINE_COLUMNS.indexOf(k) < 0; }); };
    var extraText = function (values) {
      var extras = {};
      extraKeys(values).forEach(function (k) { extras[k] = values[k]; });
      return emitMap(extras, 0);
    };
    var setLineExtra = function (model, index, text) {
      var p = parse(text);
      if (!p.ok) return p;
      var extras = p.data === undefined || p.data === null ? {} : p.data;
      if (!isPlainObject(extras)) return plainError("Escrib\u00ed una clave por rengl\u00f3n con el formato clave: valor.", 1);
      var clash = Object.keys(extras).filter(function (k) { return LINE_COLUMNS.indexOf(k) >= 0; });
      if (clash.length) return plainError("La clave " + clash[0] + " tiene su propia columna en la grilla; editala ah\u00ed.", 1);
      var old = model.lines[index].values, values = {};
      Object.keys(old).forEach(function (k) {
        if (LINE_COLUMNS.indexOf(k) >= 0) values[k] = old[k];
        else if (k in extras) values[k] = extras[k];
      });
      Object.keys(extras).forEach(function (k) { if (!(k in values)) values[k] = extras[k]; });
      var lines = model.lines.slice();
      lines[index] = Object.assign({}, lines[index], { values: values });
      return { ok: true, model: withLines(model, lines) };
    };

    /* ---- variables catalog: [name, description, purpose, usage] ----
       chains: fields each scan chain returns (documented from global1). Add a chain here when a new template uses it,
       so its variables can be checked. */
    var entries = function (rows) { return rows.map(function (r) { return { name: r[0], description: r[1], purpose: r[2], usage: r[3] }; }); };
    var CATALOG = {
      chains: {
        cmdGetAnticipoContext: {
          template: "CobroAnticipo", trigger: "Disparador 14 (DoTransfer), scanContext {id}",
          fields: entries([
            ["_id", "Id de la transferencia.", "Identificar el movimiento que origina el asiento.", "entityId: _id"],
            ["_amount", "Importe de la transferencia.", "Importe del d\u00e9bito o cr\u00e9dito.", "debit: _amount"],
            ["_currency", "Moneda de la transferencia.", "Elegir la cuenta por moneda en una tabla de reglas.", "getColumn:_currency"],
            ["_reference", "Texto TX-Anticipo#<id>.", "Referencia del asiento; evita duplicados.", "reference: _reference"],
            ["_description", "Texto Cobro Anticipo de Prima #<id> - <cliente>.", "Descripci\u00f3n del asiento.", "description: _description"],
            ["_fecha", "Fecha de la transferencia (aaaa.mm.dd).", "Armar comentarios con la fecha.", "comments: \"'Dep\u00f3sito ' + _fecha\""]
          ])
        },
        cmdGetReserveContext: {
          template: "ReservaIncendio", trigger: "Disparadores 12 (RepoLifeCoveragePayout ADD) y 80 (DoPayment), scanContext {id}",
          fields: entries([
            ["_id", "Id de la reserva.", "Identificar el movimiento de reserva.", "entityId: _id"],
            ["_reserved", "Movimiento de reserva en valor absoluto.", "Importe del asiento de reserva.", "debit: _increase ? _reserved:0"],
            ["_payed", "Importe pagado.", "Asientos de pago contra la reserva.", "credit: _payed"],
            ["_ceded", "Reserva cedida al reaseguro.", "L\u00edneas de reaseguro.", "condition: _ceded>0"],
            ["_increase", "Verdadero si es apertura o aumento de reserva.", "Decidir el sentido del asiento.", "debit: _increase ? _reserved:0"],
            ["_reference", "Texto TX-<id> Reserva Siniestro.", "Referencia del asiento; evita duplicados.", "reference: _reference"],
            ["_description", "Descripci\u00f3n del movimiento de reserva.", "Descripci\u00f3n del asiento.", "description: _description"],
            ["_currency", "Moneda de la p\u00f3liza.", "Elegir la cuenta por moneda.", "getColumn:_currency"],
            ["_Claim", "Reclamo completo.", "Leer datos del reclamo con punto.", "comments: \"'Reclamo ' + _Claim.id\""],
            ["_Policy", "P\u00f3liza completa (id, lob, ...).", "Leer datos de la p\u00f3liza con punto.", "getColumn:_Policy.lob"],
            ["_Coverage", "Cobertura completa.", "Leer datos de la cobertura con punto.", "comments: _Coverage.code"]
          ])
        },
        cmdEmisionIncendioContext: {
          template: "EmisionIncendio", trigger: "Disparadores 4, 6, 9, 40 y 97, scanContext {id, tipo}",
          fields: entries([
            ["_cuentaPrimaxCobrar", "Cuenta de primas por cobrar (tabla CuentasEmisionGeneral).", "Cuenta de la l\u00ednea.", "account: _cuentaPrimaxCobrar"],
            ["_cuentaPrima", "Cuenta de primas emitidas.", "Cuenta de la l\u00ednea.", "account: _cuentaPrima"],
            ["_cuentaImpuestoPrimas", "Cuenta del impuesto sobre primas.", "Cuenta de la l\u00ednea.", "account: _cuentaImpuestoPrimas"],
            ["_cuentaCoaseguro", "Cuenta de coaseguro por pagar.", "Cuenta de la l\u00ednea.", "account: _cuentaCoaseguro"],
            ["_cuentaGastosPrimas", "Cuenta de gasto de impuesto de primas.", "Cuenta de la l\u00ednea.", "account: _cuentaGastosPrimas"],
            ["_cuentaDaniosxPagar", "Cuenta de impuesto de da\u00f1os por pagar.", "Cuenta de la l\u00ednea.", "account: _cuentaDaniosxPagar"],
            ["_cuentaComision", "Cuenta de comisiones de corredores.", "Cuenta de la l\u00ednea.", "account: _cuentaComision"],
            ["_cuentaReservasxPagar", "Cuenta de comisiones por pagar.", "Cuenta de la l\u00ednea.", "account: _cuentaReservasxPagar"],
            ["_cuentaReaseguroCedido", "Cuenta de primas cedidas.", "Cuenta de la l\u00ednea.", "account: _cuentaReaseguroCedido"],
            ["_cuentaReaseguroComision", "Cuenta de comisiones por cesi\u00f3n.", "Cuenta de la l\u00ednea.", "account: _cuentaReaseguroComision"],
            ["_cuentaReaseguroxPagar", "Cuenta de reaseguros por pagar.", "Cuenta de la l\u00ednea.", "account: _cuentaReaseguroxPagar"],
            ["_primaPorCobrar", "Prima por cobrar.", "Importe de la l\u00ednea.", "debit: '_primaPorCobrar > 0 ? _primaPorCobrar : 0'"],
            ["_prima", "Prima emitida.", "Importe de la l\u00ednea.", "credit: '_prima > 0 ? _prima : 0'"],
            ["_impuestoPrimasIncendio", "Impuesto sobre primas (5 %).", "Importe de la l\u00ednea.", "credit: _impuestoPrimasIncendio"],
            ["_coaseguroPorPagar", "Coaseguro por pagar.", "Importe de la l\u00ednea.", "credit: _coaseguroPorPagar"],
            ["_gastoPrimaIncendio", "Gasto de impuesto de primas (2 %).", "Importe de la l\u00ednea.", "debit: _gastoPrimaIncendio"],
            ["_daniosPorPagar", "Impuesto de da\u00f1os por pagar (2 %).", "Importe de la l\u00ednea.", "credit: _daniosPorPagar"],
            ["_commisiones", "Comisiones de la p\u00f3liza.", "Importe de la l\u00ednea.", "debit: _commisiones"],
            ["_reservasPorPagar", "Comisiones por pagar de la p\u00f3liza.", "Importe de la l\u00ednea.", "credit: _reservasPorPagar"],
            ["_reaseguroCedido", "Prima cedida al reaseguro.", "Importe de la l\u00ednea.", "debit: _reaseguroCedido"],
            ["_reaseguroComision", "Comisi\u00f3n por cesi\u00f3n de primas.", "Importe de la l\u00ednea.", "credit: _reaseguroComision"],
            ["_reaseguroPorPagar", "Reaseguro por pagar.", "Importe de la l\u00ednea.", "credit: _reaseguroPorPagar"],
            ["_cancellationTax", "Impuesto de la cancelaci\u00f3n.", "Importe de la l\u00ednea.", "debit: _cancellationTax"],
            ["_nonCancellationTax", "Impuesto cuando no es cancelaci\u00f3n.", "Importe de la l\u00ednea.", "debit: _nonCancellationTax"],
            ["_anioMes", "Texto <mes> <a\u00f1o>.", "Armar comentarios del per\u00edodo.", "comments: \"'Primas del mes de ' + _anioMes\""],
            ["_reference", "Referencia del movimiento.", "Referencia del asiento; evita duplicados.", "reference: _reference"],
            ["_description", "Descripci\u00f3n del movimiento.", "Descripci\u00f3n del asiento.", "description: _description"],
            ["_unique", "Clave \u00fanica del movimiento.", "Clave para uniqueKey.", "uniqueKey: _unique"],
            ["_code", "C\u00f3digo del asiento (EmisionIncendio, CancelacionIncendio, EndosoSA, ...).", "C\u00f3digo del asiento.", "code: _code"],
            ["_ramo", "Ramo de la p\u00f3liza.", "Comentarios o tablas por ramo.", "comments: \"'Ramo ' + _ramo\""],
            ["_cancelacion", "Verdadero si es una cancelaci\u00f3n.", "Elegir el bloque de l\u00edneas.", "condition: _prima != 0 && (_cancelacion)"],
            ["_renovacion", "Verdadero si es una renovaci\u00f3n.", "Condiciones de renovaci\u00f3n.", "condition: _renovacion"],
            ["_Policy", "P\u00f3liza completa (id, lob, ...).", "Leer datos de la p\u00f3liza con punto.", "entityId: _Policy.id"]
          ])
        },
        cmdContabilizacionPagoReclamoDTO: {
          template: "PagoReclamo", trigger: "Disparador 16 (ExeClaimPayment), scanContext {id}; include: aceptantes",
          fields: entries([
            ["_id", "Id del pago del reclamo.", "Identificar el pago.", "entityId: _id"],
            ["_monto", "Importe del pago.", "Importe de la l\u00ednea.", "debit: _monto"],
            ["_tipoPago", "Tipo de pago (fila de la tabla de reglas).", "Elegir la cuenta en GetTable.", "row:_tipoPago"],
            ["_lob", "Ramo (columna de la tabla de reglas).", "Elegir la cuenta en GetTable.", "getColumn:_lob"],
            ["_reclamoId", "Id del reclamo.", "Armar comentarios.", "comments: \"'Siniestro ' + _reclamoId\""],
            ["_ramo", "Nombre del ramo.", "Armar comentarios.", "comments: \"' de ' + _ramo\""],
            ["_cuentaBancaria", "Cuenta contable del banco del pago.", "Cuenta de la l\u00ednea.", "account: _cuentaBancaria"],
            ["_aceptantes", "Lista de aceptantes (cuentaContable, debe, habe).", "Crear una l\u00ednea por aceptante con map.", "map: _aceptantes"],
            ["_referencia", "Referencia del pago.", "Referencia del asiento; evita duplicados.", "reference: _referencia"],
            ["_unique", "Clave \u00fanica del pago.", "Clave para uniqueKey.", "uniqueKey: _unique"],
            ["_code", "C\u00f3digo del asiento.", "C\u00f3digo del asiento.", "code: _code"],
            ["_description", "Descripci\u00f3n del pago.", "Descripci\u00f3n del asiento.", "description: _description"]
          ])
        },
        cmdGetPremiumContext: {
          template: "COBROPRIMAINCENDIO", trigger: "Disparador 10 (DoPaymentAllocation), scanContext {id}",
          fields: entries([
            ["_id", "Id de la aplicaci\u00f3n del cobro.", "Identificar el cobro.", "entityId: _id"],
            ["_prima", "Prima cobrada.", "Importe de la l\u00ednea.", "credit: _prima"],
            ["_moneda", "Moneda del cobro.", "Elegir la cuenta por moneda.", "getColumn:_moneda"],
            ["_impuesto", "Impuesto cobrado.", "Importe de la l\u00ednea.", "credit: _impuesto"],
            ["_primaxpagar", "Prima por pagar.", "Importe de la l\u00ednea.", "debit: _primaxpagar"],
            ["_cuentaBanco", "Cuenta bancaria del cobro.", "Cuenta contable de la l\u00ednea bancaria.", "account: _cuentaBanco"],
            ["_cuentaFondosFijos", "Cuenta de fondos fijos.", "Cuenta contable de la l\u00ednea de fondos fijos.", "account: _cuentaFondosFijos"],
            ["_cuentaPrima", "Cuenta de prima cobrada.", "Cuenta contable de la l\u00ednea de prima.", "account: _cuentaPrima"],
            ["_cuentaImpuestoPrimas", "Cuenta del impuesto sobre primas.", "Cuenta contable de la l\u00ednea de impuesto.", "account: _cuentaImpuestoPrimas"],
            ["_cuentaImpuestoPrimasCredito", "Cuenta de cr\u00e9dito del impuesto sobre primas.", "Cuenta contable de la l\u00ednea de cr\u00e9dito del impuesto.", "account: _cuentaImpuestoPrimasCredito"],
            ["_cuentaDaniosxPagar", "Cuenta de da\u00f1os por pagar.", "Cuenta contable de la l\u00ednea de da\u00f1os por pagar.", "account: _cuentaDaniosxPagar"],
            ["_cuentaDaniosxPagarCredito", "Cuenta de cr\u00e9dito de da\u00f1os por pagar.", "Cuenta contable de la l\u00ednea de cr\u00e9dito de da\u00f1os por pagar.", "account: _cuentaDaniosxPagarCredito"],
            ["_reference", "Referencia del cobro.", "Referencia del asiento; evita duplicados.", "reference: _reference"],
            ["_poliza", "P\u00f3liza completa (code, ...).", "Leer datos de la p\u00f3liza con punto.", "comments: _poliza.code"]
          ])
        },
        cmdContabilizaPagoTesoreriaDTO: {
          template: "PagoTesoreria", trigger: "Vista 82 CLPagos al ejecutar la solicitud (sin disparador), scanContext {id}; l\u00edneas de la tabla cfgTransaccionesTesoreria",
          tableVariables: {
            amountColumns: ["VariableDebito", "VariableCredito"],
            amounts: ["MontoCheque", "MontoPago"],
            textColumns: ["Descripcion"],
            text: ["NumeroSolicitud", "MontoCheque", "MontoPago", "Beneficiario", "Concepto", "NumeroReclamo", "CodigoAsegurado", "CodigoTipoPago", "TipoPago", "Moneda"]
          },
          fields: entries([
            ["_id", "Id de la solicitud de pago.", "Identificar la solicitud.", "entityId: _id"],
            ["_lineas", "L\u00edneas de cfgTransaccionesTesoreria del tipo de pago, ya resueltas (linea, cuenta, debe, haber, descripcion).", "Crear una l\u00ednea por fila con map.", "map: _lineas"],
            ["_NumeroSolicitud", "Id de la solicitud ({NumeroSolicitud} en la tabla).", "Armar comentarios.", "comments: \"'Solicitud ' + _NumeroSolicitud\""],
            ["_MontoCheque", "Monto neto del cheque o transferencia (total de la solicitud).", "Importe en VariableDebito o VariableCredito de la tabla.", "debit: _MontoCheque"],
            ["_MontoPago", "Monto bruto del pago (el neto si la solicitud no tiene bruto).", "Importe en VariableDebito o VariableCredito de la tabla.", "credit: _MontoPago"],
            ["_Beneficiario", "Nombre completo del beneficiario.", "Descripci\u00f3n de la l\u00ednea ({Beneficiario}).", "comments: _Beneficiario"],
            ["_Concepto", "Concepto de la solicitud.", "Descripci\u00f3n de la l\u00ednea ({Concepto}).", "comments: _Concepto"],
            ["_NumeroReclamo", "C\u00f3digo del reclamo de la solicitud (vac\u00edo si no tiene).", "Descripci\u00f3n de la l\u00ednea ({NumeroReclamo}).", "comments: _NumeroReclamo"],
            ["_CodigoAsegurado", "Id del contratante de la p\u00f3liza de la solicitud (vac\u00edo si no tiene).", "Descripci\u00f3n de la l\u00ednea ({CodigoAsegurado}).", "comments: _CodigoAsegurado"],
            ["_CodigoTipoPago", "C\u00f3digo del tipo de pago (IdTransaccion de la tabla).", "Armar comentarios.", "comments: _CodigoTipoPago"],
            ["_TipoPago", "Nombre del tipo de pago.", "Armar comentarios.", "comments: _TipoPago"],
            ["_Moneda", "Moneda de la solicitud.", "Elegir la cuenta por moneda.", "getColumn:_Moneda"],
            ["_tipoPagoCode", "C\u00f3digo del tipo de pago (igual que en cmdContabilizacionSolicitudDTO).", "Armar comentarios.", "comments: _tipoPagoCode"],
            ["_tipoPago", "Nombre del tipo de pago (igual que en cmdContabilizacionSolicitudDTO).", "Armar comentarios.", "comments: _tipoPago"],
            ["_totalDebe", "Suma de los d\u00e9bitos de las l\u00edneas.", "Control del cuadre.", "condition: _totalDebe != 0"],
            ["_totalHaber", "Suma de los cr\u00e9ditos de las l\u00edneas.", "Control del cuadre.", "condition: _totalHaber != 0"],
            ["_referencia", "Texto Pago Tesorer\u00eda Solicitud # <id>.", "Referencia del asiento.", "reference: _referencia"],
            ["_unique", "Clave TX-PT#<id>.", "Clave para uniqueKey; evita duplicados.", "uniqueKey: _unique"],
            ["_code", "C\u00f3digo del asiento (PagoTesoreria).", "C\u00f3digo del asiento.", "code: _code"],
            ["_description", "Texto Pago de Solicitud <id> <tipo de pago>.", "Descripci\u00f3n del asiento.", "description: _description"]
          ])
        }
      },
      engine: entries([
        ["_lineNumber", "N\u00famero de la l\u00ednea que se est\u00e1 creando (1, 2, 3...; solo cuenta las creadas).", "Ordenar las l\u00edneas.", "order: _lineNumber"],
        ["_lineIndex", "Posici\u00f3n desde 0 de la l\u00ednea en Lines, se cree o no.", "Distinguir l\u00edneas de la plantilla.", "comments: \"'L\u00ednea ' + _lineIndex\""],
        ["_item", "En una l\u00ednea con map: el elemento actual de la lista.", "Leer datos de cada elemento.", "account: _item.cuentaContable"],
        ["_mapIndex", "En una l\u00ednea con map: n\u00famero del elemento desde 0.", "Numerar los elementos.", "comments: \"'Aceptante ' + _mapIndex\""],
        ["_line", "La l\u00ednea ya calculada (account, debit, credit, order, comments, auxId).", "Usarla en moneda, Amounts, aux y costCenters.", "condition: _line.debit > 0"],
        ["_diff", "Descuadre acumulado: d\u00e9bitos menos cr\u00e9ditos.", "Calcular una l\u00ednea de cuadre.", "debit: '_diff < 0 ? -_diff : 0'"],
        ["_diffDebit", "Lo que falta al d\u00e9bito para cuadrar.", "L\u00ednea de cuadre.", "debit: _diffDebit"],
        ["_diffCredit", "Lo que falta al cr\u00e9dito para cuadrar.", "L\u00ednea de cuadre.", "credit: _diffCredit"],
        ["_diffs", "Descuadre por moneda de los Amounts.", "Cuadre multimoneda.", "debit: _diffs.USD"],
        ["_baseCurrency", "Moneda base calculada en la cabecera.", "Comparar o elegir monedas.", "condition: _baseCurrency == 'USD'"],
        ["_yCurrency", "Moneda de reporte Y del perfil (Accounting.yCurrency).", "Importes en moneda de reporte.", "yCurrency: _yCurrency"],
        ["_zCurrency", "Moneda de reporte Z del perfil (Accounting.zCurrency).", "Importes en moneda de reporte.", "zCurrency: _zCurrency"],
        ["_extra", "Solo desde el cierre de per\u00edodo: closureId, year, month.", "Plantillas de cierre.", "comments: \"'Cierre ' + _extra.year\""],
        ["_auxType", "Dentro de aux: la fila del tipo de auxiliar (code, name, entity).", "Condiciones por tipo de auxiliar.", "condition: _auxType.code == 'Coasegurador'"],
        ["_costCenterCode", "Dentro de la condici\u00f3n de un centro de costo: su c\u00f3digo.", "Condiciones por centro de costo.", "condition: _costCenterCode == 'SUCURSAL'"]
      ]),
      session: entries([
        ["_sysUser", "Usuario que ejecuta la plantilla.", "Dejar rastro de qui\u00e9n gener\u00f3 el asiento.", "comments: \"'Generado por ' + _sysUser\""],
        ["_sysIsAdmin", "Verdadero si el usuario es administrador.", "Condiciones por permisos.", "condition: _sysIsAdmin"],
        ["_sysUserGroups", "Grupos del usuario.", "Condiciones por grupo.", "condition: _sysUserGroups.length > 0"],
        ["_sysOrganization", "Organizaci\u00f3n del usuario ({id, code} o vac\u00edo).", "Asignar la organizaci\u00f3n.", "organizationId: _sysOrganization.id"],
        ["_sysSubOrganizations", "Suborganizaciones del usuario.", "Condiciones por organizaci\u00f3n.", "condition: _sysSubOrganizations.length > 0"],
        ["_sysExternal", "Verdadero si el usuario es externo.", "Condiciones por tipo de usuario.", "condition: !_sysExternal"]
      ]),
      scan: entries([
        ["_<clave>", "Dentro de scanCommand: cada clave del scanContext que manda el disparador (en global1, _id y _tipo).", "Pasarle a la cadena el movimiento a contabilizar.", "context: \"{id:_id,tipo:_tipo}\""],
        ["_extra.<clave>", "Dentro de scanCommand: datos del cierre de per\u00edodo (closureId, year, month).", "Plantillas de cierre.", "context: \"{year:_extra.year}\""]
      ]),
      functions: entries([
        ["exe(GetTable,...)", "Lee una tabla de reglas: exe(GetTable,table:'Tabla',column:'Cuenta',row:'Fila',getColumn:_moneda).", "Elegir la cuenta seg\u00fan moneda, ramo u otro dato.", "account: exe(GetTable,table:'CuentasAnticipoxMoneda',column:'Cuenta',row:'Banco',getColumn:_currency)"],
        ["'texto'", "Texto fijo: va entre comillas simples dentro de comillas dobles. No uses guion bajo adentro.", "C\u00f3digos, cuentas y comentarios fijos.", "code: \"'AnticipoPrima'\""],
        ["condici\u00f3n ? a : b", "Ternario de JavaScript. Si tiene dos puntos con espacio, la f\u00f3rmula va entre comillas.", "Elegir d\u00e9bito o cr\u00e9dito seg\u00fan el signo.", "debit: '_monto > 0 ? _monto : 0'"]
      ])
    };
    //only chain and engine variables are shown to users: session data, scanCommand internals and functions stay out of
    //the catalog view (the validation still knows them)
    var catalogGroups = function (chain) {
      var info = chain ? CATALOG.chains[chain] : null;
      return [
        { key: "chain", title: "Datos de la cadena " + (chain || "(sin cadena)"), info: info || null, items: info ? info.fields : [] },
        { key: "engine", title: "Variables del motor", items: CATALOG.engine }
      ];
    };

    /* ---- validation: engine rules documented for ExeTransactionTemplate ---- */
    var HEADER_KEYS = ["scanCommand", "uniqueKey", "reference", "code", "description", "status", "entity", "entityId", "organizationId", "baseCurrency", "effectiveDate", "Lines"];
    var HEADER_FORMULAS = ["uniqueKey", "reference", "code", "description", "status", "entityId", "organizationId", "baseCurrency", "effectiveDate"];
    var CURRENCY_KEYS = ["xCurrency", "xDebit", "xCredit", "xChangeRate", "yCurrency", "yChangeRate", "yDebit", "yCredit", "zCurrency", "zChangeRate", "zDebit", "zCredit"];
    var LINE_FORMULAS = ["account", "debit", "credit", "order", "comments", "auxId", "condition", "map", "mapCondition", "auxArray"].concat(CURRENCY_KEYS);
    var LINE_KEYS = LINE_FORMULAS.concat(["Amounts", "aux", "costCenters"]);
    var ENGINE_ROOTS = {}, SESSION_ROOTS = {};
    CATALOG.engine.forEach(function (v) { ENGINE_ROOTS[v.name.slice(1)] = true; });
    CATALOG.session.forEach(function (v) { SESSION_ROOTS[v.name.slice(1)] = true; });
    var JS_WORDS = ["true", "false", "null", "undefined", "NaN", "Infinity"];
    var LEVEL_ORDER = { error: 0, warning: 1, info: 2 };

    //variables (_name, _a.b) and fixed texts ('...' or "...") of a formula
    var formulaTokens = function (src) {
      var s = String(src), vars = [], literals = [], i = 0;
      while (i < s.length) {
        var ch = s.charAt(i);
        if (ch === "'" || ch === "\"") {
          var j = i + 1;
          while (j < s.length && s.charAt(j) !== ch) j += s.charAt(j) === "\\" ? 2 : 1;
          literals.push(s.slice(i + 1, j));
          i = j + 1;
          continue;
        }
        if (ch === "_" && (i === 0 || !/[A-Za-z0-9_$.]/.test(s.charAt(i - 1)))) {
          var m = /^_([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)/.exec(s.slice(i));
          if (m) {
            vars.push(m[1]);
            i += m[0].length;
            continue;
          }
        }
        i++;
      }
      return { vars: vars, literals: literals };
    };
    var syntaxHint = function (reason) {
      if (/bad indentation/.test(reason)) return "Aline\u00e1 la clave con las dem\u00e1s de su bloque: mismos espacios al inicio del rengl\u00f3n.";
      if (/incomplete explicit mapping pair/.test(reason)) return "Pon\u00e9 la f\u00f3rmula entre comillas cuando tiene dos puntos seguidos de espacio, por ejemplo debit: '_monto > 0 ? _monto : 0'.";
      if (/multiline key may not be an implicit key/.test(reason)) return "Si la f\u00f3rmula empieza con comilla simple, envolvela en comillas dobles: code: \"'Cobro' + _id\".";
      if (/duplicated mapping key/.test(reason)) return "Quit\u00e1 la clave repetida: cada clave va una sola vez por bloque.";
      return "Revis\u00e1 el rengl\u00f3n indicado: sangr\u00eda, comillas y el formato clave: valor.";
    };
    var isEmptyValue = function (v) { return v === undefined || v === null || (typeof v === "string" && !v.trim()); };
    var isFormulaType = function (v) { return typeof v === "string" || typeof v === "number"; };
    var suggestKey = function (k, list) {
      var low = k.toLowerCase();
      for (var i = 0; i < list.length; i++) if (list[i].toLowerCase() === low && list[i] !== k) return list[i];
      return null;
    };

    var validate = function (text, ctx) {
      ctx = ctx || {};
      var src = String(text === undefined || text === null ? "" : text);
      var p = parse(src);
      if (!p.ok) {
        var se = p.error;
        return {
          ok: false, syntax: se, variables: [], accounts: [],
          issues: [{ level: "error", path: [], line: se.line, column: se.column, field: "", message: "YAML mal formado: " + se.reason, hint: syntaxHint(se.reason), detail: se.message }]
        };
      }
      var layout = scanLayout(src);
      var issues = [], variables = {}, accounts = [], unverified = [];
      var add = function (level, path, message, hint) {
        var field = "";
        for (var k = path.length - 1; k >= 0; k--) if (typeof path[k] === "string") { field = path[k]; break; }
        issues.push({ level: level, path: path, line: locate(layout, path), field: field, message: message, hint: hint });
      };
      var data = p.data;
      var result = function () {
        issues = issues.map(function (it, idx) { return { it: it, idx: idx }; }).sort(function (a, b) {
          return a.it.line - b.it.line || LEVEL_ORDER[a.it.level] - LEVEL_ORDER[b.it.level] || a.idx - b.idx;
        }).map(function (x) { return x.it; });
        return {
          ok: !issues.some(function (i) { return i.level === "error"; }),
          syntax: null,
          issues: issues,
          variables: Object.keys(variables).map(function (k) { return variables[k]; }),
          accounts: accounts
        };
      };
      if (data === undefined || data === null) {
        add("error", [], "La plantilla est\u00e1 vac\u00eda.", "Complet\u00e1 la cabecera (scanCommand, code, description, status, entity) y al menos una l\u00ednea en Lines.");
        return result();
      }
      if (!isPlainObject(data)) {
        add("error", [], "La plantilla debe ser una lista de claves (clave: valor).", "Empez\u00e1 cada rengl\u00f3n de la cabecera con su clave, por ejemplo code: _code.");
        return result();
      }

      //header keys
      Object.keys(data).forEach(function (k) {
        if (HEADER_KEYS.indexOf(k) >= 0) return;
        if (k === "unique") {
          add("warning", [k], "El motor no usa la clave unique.", "Para evitar asientos duplicados us\u00e1 uniqueKey; sin uniqueKey el motor descarta una reference que la plantilla ya gener\u00f3.");
          return;
        }
        var sug = suggestKey(k, HEADER_KEYS);
        add("warning", [k], "El motor ignora la clave " + k + (sug ? "; \u00bfquisiste decir " + sug + "?" : "."), sug ? "Las claves distinguen may\u00fasculas: renombrala a " + sug + "." : "Borrala o revis\u00e1 el nombre. Claves de cabecera v\u00e1lidas: " + HEADER_KEYS.join(", ") + ".");
      });

      //scanCommand
      var sc = data.scanCommand, chain = null;
      if (sc === undefined || sc === null) {
        add("error", ["scanCommand"], "Falta scanCommand, el comando que trae las filas a contabilizar.", "Sin scanCommand el motor responde \u00abscanCommand parameter not found in template configuration\u00bb. Ejemplo: scanCommand con cmd: ExeChain y data: {chain: miCadena, context: \"{id:_id}\"}.");
      } else if (!isPlainObject(sc) || typeof sc.cmd !== "string" || !sc.cmd.trim()) {
        add("error", ["scanCommand", "cmd"], "scanCommand debe tener cmd con el nombre del comando.", "En global1 todas las plantillas usan cmd: ExeChain con data.chain y data.context.");
      } else if (sc.cmd === "ExeChain") {
        var scData = isPlainObject(sc.data) ? sc.data : {};
        if (typeof scData.chain !== "string" || !scData.chain.trim()) add("error", ["scanCommand", "data", "chain"], "Falta la cadena (chain) del scanCommand.", "Indic\u00e1 la cadena que devuelve las filas, por ejemplo chain: cmdGetAnticipoContext.");
        else chain = scData.chain.trim();
      }
      var chainInfo = chain ? CATALOG.chains[chain] || null : null;
      var chainRoots = {};
      if (chainInfo) chainInfo.fields.forEach(function (f) { chainRoots[f.name.slice(1).split(".")[0]] = true; });

      //variables and fixed texts of a formula
      var scanFormula = function (value, path, opts) {
        if (typeof value !== "string") return;
        var v = value.trim();
        if (!opts.allowBare && /^[A-Za-z][A-Za-z0-9]*$/.test(v) && JS_WORDS.indexOf(v) < 0) {
          add("error", path, v + " no es una variable ni un texto: le falta el guion bajo o las comillas.", "Sin guion bajo el motor lo toma como un nombre de JavaScript y falla con \u00ab" + v + " is not defined\u00bb. Si es un dato de la fila escrib\u00ed _" + v + "; si es un texto fijo, \"'" + v + "'\".");
          return;
        }
        var tk = formulaTokens(v);
        tk.literals.forEach(function (lit) {
          if (lit.indexOf("_") < 0) return;
          add("warning", path, "El texto fijo '" + lit + "' tiene guion bajo.", "El motor cambia cada _ por context., tambi\u00e9n dentro de un texto: '" + lit + "' llega como '" + lit.replace(/_/g, "context.") + "'. Us\u00e1 guion medio.");
        });
        tk.vars.forEach(function (name) {
          var root = name.split(".")[0];
          var entry = variables[name] || (variables[name] = { name: name, root: root, known: null, source: "", uses: 0 });
          entry.uses++;
          if (ENGINE_ROOTS[root]) {
            entry.known = true;
            entry.source = "engine";
            if ((root === "item" || root === "mapIndex") && !opts.inMap) add("error", path, "_" + root + " solo existe en las l\u00edneas con map.", "Agreg\u00e1 map: _lista a la l\u00ednea para crear una l\u00ednea por elemento, o us\u00e1 otra variable.");
            if (root === "line" && opts.group !== "after" && opts.group !== "aux" && opts.group !== "costCenters") add("warning", path, "_line todav\u00eda no est\u00e1 calculada en " + (path[2] || path[0]) + ".", "_line sirve en las claves de moneda, Amounts, aux y costCenters, que se calculan despu\u00e9s de la l\u00ednea.");
            if (root === "auxType" && opts.group !== "aux") add("warning", path, "_auxType solo existe dentro de aux.", "Us\u00e1 _auxType en auxId o condition de un elemento de aux.");
            if (root === "costCenterCode" && opts.group !== "costCenters") add("warning", path, "_costCenterCode solo existe dentro de costCenters.", "Us\u00e1 _costCenterCode en la condition de un centro de costo.");
            if (root === "extra") add("info", path, "_extra solo tiene datos cuando la plantilla corre desde el cierre de per\u00edodo.", "Fuera del cierre (disparadores o Ejecutar ahora) _extra llega vac\u00edo.");
            return;
          }
          if (SESSION_ROOTS[root]) {
            entry.known = true;
            entry.source = "session";
            return;
          }
          if (chainInfo) {
            if (chainRoots[root]) {
              entry.known = true;
              entry.source = "chain";
              return;
            }
            entry.known = false;
            var key = path[2] || path[0];
            var effect = key === "account" ? " Como es la cuenta, el asiento se rechaza con \u00abAll lines must have an account\u00bb." : (NUMERIC_KEYS[key] ? " En " + key + " el valor vac\u00edo no se puede convertir a n\u00famero y la corrida falla." : "");
            add("warning", path, "La cadena " + chain + " no devuelve _" + root + ".", "La f\u00f3rmula dar\u00e1 vac\u00edo." + effect + " Revis\u00e1 el nombre en el cat\u00e1logo de variables o agreg\u00e1 el dato a la cadena.");
            return;
          }
          if (unverified.indexOf(root) < 0) unverified.push(root);
        });
      };

      //required header values and types
      ["code", "description"].forEach(function (k) {
        var v = data[k];
        var what = k === "code" ? "el c\u00f3digo del asiento" : "la descripci\u00f3n del asiento";
        var example = k === "code" ? "code: \"'AnticipoPrima'\" o code: _code" : "description: _description o description: \"'Cobro ' + _id\"";
        if (isEmptyValue(v)) add("error", [k], "Falta " + k + ", " + what + ".", "Es obligatorio para el motor. Ejemplo: " + example + ".");
        else if (!isFormulaType(v)) add("error", [k], k + " debe ser una f\u00f3rmula de texto.", "Ejemplo: " + example + ".");
      });
      if (isEmptyValue(data.status)) add("error", ["status"], "Falta status, el estado con que nace el asiento.", "Us\u00e1 status: 1 (contabilizado) o status: 0 (borrador).");
      else if (typeof data.status === "number" && data.status !== 0 && data.status !== 1) add("warning", ["status"], "status " + data.status + " no es un estado de asiento esperado.", "Us\u00e1 1 (contabilizado) o 0 (borrador).");
      else if (!isFormulaType(data.status)) add("error", ["status"], "status debe ser un n\u00famero o una f\u00f3rmula.", "Us\u00e1 status: 1 (contabilizado) o status: 0 (borrador).");
      if (isEmptyValue(data.entity)) add("error", ["entity"], "Falta entity, la entidad que origina el asiento.", "Es un texto literal, por ejemplo entity: Transfer, LifePolicy o ClaimPayment.");
      else if (typeof data.entity !== "string") add("error", ["entity"], "entity debe ser un texto literal.", "Por ejemplo entity: Transfer.");
      else if (/^['"]/.test(data.entity.trim()) || data.entity.indexOf("_") >= 0) add("warning", ["entity"], "entity es un texto literal: el motor no lo eval\u00faa.", "Se guarda tal cual, con comillas o guiones bajos incluidos. Escribilo sin comillas ni variables, por ejemplo entity: Transfer.");
      ["entityId", "organizationId", "uniqueKey", "reference", "baseCurrency", "effectiveDate"].forEach(function (k) {
        if (data[k] !== undefined && data[k] !== null && !isFormulaType(data[k])) add("error", [k], k + " debe ser un n\u00famero o una f\u00f3rmula.", "Ejemplo: " + k + ": _id.");
      });
      HEADER_FORMULAS.forEach(function (k) { scanFormula(data[k], [k], { group: "header" }); });

      //Lines
      var lines = data.Lines;
      if (lines === undefined || lines === null) {
        var lower = Object.keys(data).filter(function (k) { return k !== "Lines" && k.toLowerCase() === "lines"; });
        add("error", ["Lines"], "Falta Lines, la lista de l\u00edneas del asiento.", lower.length ? "Las claves distinguen may\u00fasculas: renombr\u00e1 " + lower[0] + " a Lines." : "Agreg\u00e1 Lines con al menos una l\u00ednea.");
      } else if (!Array.isArray(lines)) {
        add("error", ["Lines"], "Lines debe ser una lista de l\u00edneas.", "Cada l\u00ednea empieza con un guion: - account: _cuenta.");
      } else if (!lines.length) {
        add("error", ["Lines"], "Lines debe tener al menos una l\u00ednea.", "Agreg\u00e1 las l\u00edneas del asiento con su cuenta, d\u00e9bito o cr\u00e9dito y order.");
      } else {
        lines.forEach(function (line, i) {
          var n = i + 1;
          var P = function () { return ["Lines", i].concat(Array.prototype.slice.call(arguments)); };
          if (!isPlainObject(line)) {
            add("error", P(), "La l\u00ednea " + n + " no tiene claves.", "Cada l\u00ednea es un bloque clave: valor (account, debit, credit, order...).");
            return;
          }
          Object.keys(line).forEach(function (k) {
            if (LINE_KEYS.indexOf(k) >= 0) return;
            var sug = suggestKey(k, LINE_KEYS);
            var hint = k === "currency" ? "Para moneda extranjera us\u00e1 xCurrency con xDebit y xCredit." : (sug ? "Las claves distinguen may\u00fasculas: renombrala a " + sug + "." : "Borrala o revis\u00e1 el nombre.");
            add("warning", P(k), "El motor ignora la clave " + k + " en la l\u00ednea " + n + (sug ? "; \u00bfquisiste decir " + sug + "?" : "."), hint);
          });
          var acc = line.account;
          if (isEmptyValue(acc)) {
            add("error", P("account"), "La l\u00ednea " + n + " no tiene account.", "El motor rechaza el asiento con \u00abAll lines must have an account\u00bb. Us\u00e1 una variable (_cuentaPrima), una tabla (exe(GetTable,...)) o una cuenta fija entre comillas: \"'110.03.01'\".");
          } else if (typeof acc === "number" || (typeof acc === "string" && /^[0-9][0-9.\-]*$/.test(acc.trim()))) {
            add("error", P("account"), "La cuenta " + acc + " de la l\u00ednea " + n + " est\u00e1 sin comillas.", "Una cuenta fija es un texto: escribila account: \"'" + acc + "'\".");
          } else if (typeof acc !== "string") {
            add("error", P("account"), "account de la l\u00ednea " + n + " debe ser una f\u00f3rmula de texto.", "Ejemplo: account: _cuentaPrima.");
          } else {
            var lit = /^'([^'_]+)'$/.exec(acc.trim());
            if (lit) {
              var code = lit[1].trim();
              if (accounts.indexOf(code) < 0) accounts.push(code);
              var known = ctx.accounts ? ctx.accounts[code] : undefined;
              if (known && known.exists === false) add("error", P("account"), "La cuenta '" + code + "' de la l\u00ednea " + n + " no existe en el plan de cuentas.", "La base rechaza el asiento por la clave for\u00e1nea con CatalogAccount. Eleg\u00ed una cuenta existente.");
              else if (known && known.isDetail === false) add("warning", P("account"), "La cuenta '" + code + "' de la l\u00ednea " + n + " no es de detalle.", "La base la acepta, pero lo habitual es contabilizar en cuentas de detalle.");
            }
          }
          if (isEmptyValue(line.order)) add("error", P("order"), "La l\u00ednea " + n + " no tiene order.", "Es obligatorio: us\u00e1 order: _lineNumber para numerar las l\u00edneas en orden.");
          ["debit", "credit", "order"].forEach(function (k) {
            if (line[k] !== undefined && line[k] !== null && !isFormulaType(line[k])) add("error", P(k), k + " de la l\u00ednea " + n + " debe ser un n\u00famero o una f\u00f3rmula.", "Ejemplo: " + k + ": _monto o " + k + ": 0.");
          });
          if (typeof line.debit === "number" && typeof line.credit === "number" && line.debit !== 0 && line.credit !== 0) add("error", P("debit"), "La l\u00ednea " + n + " tiene debit y credit distintos de 0.", "El motor rechaza el asiento con \u00abCannot credit and debit same account at the same time\u00bb. Dej\u00e1 uno de los dos en 0.");
          ["condition", "mapCondition", "comments", "auxId"].forEach(function (k) {
            if (line[k] !== undefined && line[k] !== null && (typeof line[k] === "object")) add("error", P(k), k + " de la l\u00ednea " + n + " debe ser una f\u00f3rmula.", "Ejemplo: condition: _monto != 0.");
          });
          if (line.map !== undefined && typeof line.map !== "string") add("error", P("map"), "map de la l\u00ednea " + n + " debe ser una f\u00f3rmula que devuelva una lista.", "Ejemplo: map: _aceptantes.");
          if (line.mapCondition !== undefined && line.map === undefined) add("warning", P("mapCondition"), "mapCondition de la l\u00ednea " + n + " no tiene efecto sin map.", "Agreg\u00e1 map: _lista o quit\u00e1 mapCondition.");
          ["x", "y", "z"].forEach(function (c) {
            if ((line[c + "Debit"] !== undefined || line[c + "Credit"] !== undefined) && line[c + "Currency"] === undefined) add("warning", P(line[c + "Debit"] !== undefined ? c + "Debit" : c + "Credit"), c + "Debit / " + c + "Credit de la l\u00ednea " + n + " sin " + c + "Currency: el motor los ignora.", "Agreg\u00e1 " + c + "Currency con el c\u00f3digo de moneda o quit\u00e1 esos importes.");
          });
          if (line.auxArray !== undefined) add("info", P("auxArray"), "auxArray solo funciona si el perfil tiene Accounting.templateAuxArray = true.", "Si el perfil no lo tiene, us\u00e1 aux con auxTypeCode y auxId.");
          var inMap = line.map !== undefined;
          LINE_FORMULAS.forEach(function (k) { scanFormula(line[k], P(k), { inMap: inMap, group: CURRENCY_KEYS.indexOf(k) >= 0 ? "after" : "line" }); });
          if (line.aux !== undefined) {
            if (!Array.isArray(line.aux)) add("error", P("aux"), "aux de la l\u00ednea " + n + " debe ser una lista.", "Cada elemento: - auxTypeCode: Coasegurador / auxId: _coaseguradorId.");
            else line.aux.forEach(function (a, j) {
              if (!isPlainObject(a)) { add("error", P("aux"), "El elemento " + (j + 1) + " de aux de la l\u00ednea " + n + " no tiene claves.", "Us\u00e1 auxTypeCode y auxId."); return; }
              if (isEmptyValue(a.auxTypeCode)) add("warning", P("aux"), "Al auxiliar " + (j + 1) + " de la l\u00ednea " + n + " le falta auxTypeCode: el motor lo ignora.", "auxTypeCode es un c\u00f3digo literal de CatalogAuxType.");
              else if (ctx.auxTypes && ctx.auxTypes.indexOf(String(a.auxTypeCode)) < 0) add("warning", P("aux"), "El tipo de auxiliar " + a.auxTypeCode + " (l\u00ednea " + n + ") no existe en CatalogAuxType: el motor lo ignora.", "Tipos disponibles: " + (ctx.auxTypes.join(", ") || "ninguno") + ".");
              if (isEmptyValue(a.auxId)) add("warning", P("aux"), "Al auxiliar " + (j + 1) + " de la l\u00ednea " + n + " le falta auxId: el motor lo ignora.", "auxId es una f\u00f3rmula, por ejemplo auxId: _agenteId.");
              scanFormula(a.auxId, P("aux"), { inMap: inMap, group: "aux" });
              scanFormula(a.condition, P("aux"), { inMap: inMap, group: "aux" });
            });
          }
          if (line.costCenters !== undefined) {
            if (!Array.isArray(line.costCenters)) add("error", P("costCenters"), "costCenters de la l\u00ednea " + n + " debe ser una lista.", "Cada elemento: - code: SUCURSAL / value: _poliza.sucursal.");
            else line.costCenters.forEach(function (c, j) {
              if (!isPlainObject(c)) { add("error", P("costCenters"), "El elemento " + (j + 1) + " de costCenters de la l\u00ednea " + n + " no tiene claves.", "Us\u00e1 code y value."); return; }
              if (isEmptyValue(c.code)) add("error", P("costCenters"), "Al centro de costo " + (j + 1) + " de la l\u00ednea " + n + " le falta code.", "code es un c\u00f3digo literal de CostCenterCatalog.");
              else if (ctx.costCenters && ctx.costCenters.indexOf(String(c.code)) < 0) add("warning", P("costCenters"), "El centro de costo " + c.code + " (l\u00ednea " + n + ") no existe en CostCenterCatalog.", "Centros disponibles: " + (ctx.costCenters.join(", ") || "ninguno") + ".");
              if (isEmptyValue(c.value)) add("error", P("costCenters"), "Al centro de costo " + (j + 1) + " de la l\u00ednea " + n + " le falta value.", "value sin guion bajo es un c\u00f3digo fijo; con guion bajo, la ruta de un dato de la fila (_poliza.sucursal).");
              else scanFormula(c.value, P("costCenters"), { inMap: inMap, group: "costCenters", allowBare: true });
              scanFormula(c.condition, P("costCenters"), { inMap: inMap, group: "costCenters" });
            });
          }
          if (line.Amounts !== undefined) {
            if (!Array.isArray(line.Amounts)) add("error", P("Amounts"), "Amounts de la l\u00ednea " + n + " debe ser una lista.", "Cada elemento: currency, debit, credit, rateToTxn, rateDate, valuationType.");
            else line.Amounts.forEach(function (a, j) {
              if (!isPlainObject(a)) { add("error", P("Amounts"), "El importe " + (j + 1) + " de Amounts de la l\u00ednea " + n + " no tiene claves.", "Us\u00e1 currency, debit y credit."); return; }
              if (isEmptyValue(a.currency)) add("warning", P("Amounts"), "El importe " + (j + 1) + " de Amounts de la l\u00ednea " + n + " no tiene currency: el motor lo ignora.", "Agreg\u00e1 currency con el c\u00f3digo de moneda.");
              ["debit", "credit"].forEach(function (k) {
                if (a[k] === undefined || a[k] === null) add("error", P("Amounts"), "Al importe " + (j + 1) + " de Amounts de la l\u00ednea " + n + " le falta " + k + ".", "debit y credit son obligatorios en cada elemento de Amounts (pod\u00e9s usar 0).");
              });
              ["currency", "debit", "credit", "rateToTxn", "rateDate"].forEach(function (k) { scanFormula(a[k], P("Amounts"), { inMap: inMap, group: "after" }); });
            });
          }
        });
      }

      if (unverified.length) {
        var where = chain ? ["scanCommand", "data", "chain"] : ["scanCommand"];
        var label = chain ? "La cadena " + chain + " no est\u00e1 en el cat\u00e1logo" : "El scanCommand no usa una cadena del cat\u00e1logo";
        add("info", where, label + ": no se pueden verificar " + unverified.map(function (r) { return "_" + r; }).join(", ") + ".", "Confirm\u00e1 que la cadena devuelva esos campos. Para verificarlos, agreg\u00e1 la cadena a CATALOG.chains en la vista.");
      }
      return result();
    };

    return {
      CATALOG: CATALOG,
      catalogGroups: catalogGroups,
      validate: validate,
      formulaTokens: formulaTokens,
      LINE_COLUMNS: LINE_COLUMNS,
      parse: parse,
      scanLayout: scanLayout,
      locate: locate,
      emptyModel: emptyModel,
      toModel: toModel,
      toYaml: toYaml,
      modelData: modelData,
      setLineValue: setLineValue,
      addLine: addLine,
      duplicateLine: duplicateLine,
      removeLine: removeLine,
      moveLine: moveLine,
      sectionText: sectionText,
      sectionBlocks: sectionBlocks,
      setSection: setSection,
      headerValue: headerValue,
      setHeaderValue: setHeaderValue,
      extraKeys: extraKeys,
      extraText: extraText,
      setLineExtra: setLineExtra
    };
  })();
  /* TPL:END */

  /* ---------- iconos: los mismos glifos outlined de @ant-design/icons ---------- */
  var ICON_PATHS = {"check":{"vb":"64 64 896 896","p":["M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"]},"delete":{"vb":"64 64 896 896","p":["M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"]},"file":{"vb":"64 64 896 896","p":["M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494z"]},"folder-open":{"vb":"64 64 896 896","p":["M928 444H820V330.4c0-17.7-14.3-32-32-32H473L355.7 186.2a8.15 8.15 0 00-5.5-2.2H96c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h698c13 0 24.8-7.9 29.7-20l134-332c1.5-3.8 2.3-7.9 2.3-12 0-17.7-14.3-32-32-32zM136 256h188.5l119.6 114.4H748V444H238c-13 0-24.8 7.9-29.7 20L136 643.2V256zm635.3 512H159l103.3-256h612.4L771.3 768z"]},"reload":{"vb":"64 64 896 896","p":["M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z"]},"rocket":{"vb":"64 64 896 896","p":["M864 736c0-111.6-65.4-208-160-252.9V317.3c0-15.1-5.3-29.7-15.1-41.2L536.5 95.4C530.1 87.8 521 84 512 84s-18.1 3.8-24.5 11.4L335.1 276.1a63.97 63.97 0 00-15.1 41.2v165.8C225.4 528 160 624.4 160 736h156.5c-2.3 7.2-3.5 15-3.5 23.8 0 22.1 7.6 43.7 21.4 60.8a97.2 97.2 0 0043.1 30.6c23.1 54 75.6 88.8 134.5 88.8 29.1 0 57.3-8.6 81.4-24.8 23.6-15.8 41.9-37.9 53-64a97 97 0 0043.1-30.5 97.52 97.52 0 0021.4-60.8c0-8.4-1.1-16.4-3.1-23.8H864zM762.3 621.4c9.4 14.6 17 30.3 22.5 46.6H700V558.7a211.6 211.6 0 0162.3 62.7zM388 483.1V318.8l124-147 124 147V668H388V483.1zM239.2 668c5.5-16.3 13.1-32 22.5-46.6 16.3-25.2 37.5-46.5 62.3-62.7V668h-84.8zm388.9 116.2c-5.2 3-11.2 4.2-17.1 3.4l-19.5-2.4-2.8 19.4c-5.4 37.9-38.4 66.5-76.7 66.5-38.3 0-71.3-28.6-76.7-66.5l-2.8-19.5-19.5 2.5a27.7 27.7 0 01-17.1-3.5c-8.7-5-14.1-14.3-14.1-24.4 0-10.6 5.9-19.4 14.6-23.8h231.3c8.8 4.5 14.6 13.3 14.6 23.8-.1 10.2-5.5 19.6-14.2 24.5zM464 400a48 48 0 1096 0 48 48 0 10-96 0z"]},"save":{"vb":"64 64 896 896","p":["M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z"]},"stop":{"vb":"64 64 896 896","p":["M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372 0-89 31.3-170.8 83.5-234.8l523.3 523.3C682.8 852.7 601 884 512 884zm288.5-137.2L277.2 223.5C341.2 171.3 423 140 512 140c205.4 0 372 166.6 372 372 0 89-31.3 170.8-83.5 234.8z"]}};
  //AntdIcon 4.x: role/aria-label, rest props on the span, ref forwarded, tabIndex -1 with onClick.
  //props.legacy = Icon of @ant-design/compatible (adds the type attribute)
  var ICON_OWN = ["type", "legacy", "className", "spin", "rotate", "tabIndex", "onClick", "twoToneColor"];
  var Ico = React.forwardRef(function (props, ref) {
    var def = ICON_PATHS[props.type] || { vb: "64 64 896 896", p: [] };
    var paths = def.p;
    var rest = {};
    Object.keys(props).forEach(function (k) { if (ICON_OWN.indexOf(k) < 0) rest[k] = props[k]; });
    if (props.legacy) rest.type = props.type;
    var iconTabIndex = props.tabIndex;
    if (iconTabIndex === undefined && props.onClick) iconTabIndex = -1;
    var cls = "anticon anticon-" + props.type + (props.spin ? " anticon-spin" : "") + (props.className ? " " + props.className : "");
    return (
      <span role="img" aria-label={props.type} {...rest} ref={ref} tabIndex={iconTabIndex} onClick={props.onClick} className={cls}>
        <svg viewBox={def.vb} focusable="false" data-icon={props.type} width="1em" height="1em" fill="currentColor" aria-hidden="true">
          {paths.map(function (d, i) { return <path key={i} d={d} />; })}
        </svg>
      </span>
    );
  });

  /* ---------- @ant-design/compatible Form.create = rc-form 2.4.12 (createBaseForm + createFieldsStore) ----------
     Port of the parts these screens use. Field names are flat (no "a.b"), so the nested-name helpers collapse to
     plain keys. Validation = async-validator for the rule shapes used here ({required, message}). */
  var FIELD_META_PROP = "data-__meta";
  var FIELD_DATA_PROP = "data-__field";
  //rc-form utils.supportRef: plain function components get no ref (FieldElemWrapper tracks them); forwardRef/class do
  var supportRef = function (node) {
    var type = node.type;
    if (type && typeof Symbol === "function" && type.$$typeof === Symbol.for("react.memo")) type = type.type;
    if (typeof type === "function" && !(type.prototype && type.prototype.render)) return false;
    return true;
  };
  var hasRules = function (validate) {
    if (validate) return validate.some(function (item) { return item.rules && item.rules.length; });
    return false;
  };
  var normalizeValidateRules = function (validate, rules, validateTrigger) {
    var validateRules = validate.map(function (item) {
      var newItem = Object.assign({}, item, { trigger: item.trigger || [] });
      if (typeof newItem.trigger === "string") newItem.trigger = [newItem.trigger];
      return newItem;
    });
    if (rules) validateRules.push({ trigger: validateTrigger ? [].concat(validateTrigger) : [], rules: rules });
    return validateRules;
  };
  var getValidateTriggers = function (validateRules) {
    var out = [];
    validateRules.filter(function (item) { return !!item.rules && item.rules.length; }).forEach(function (item) {
      item.trigger.forEach(function (tr) { if (out.indexOf(tr) < 0) out.push(tr); });
    });
    return out;
  };
  var getValueFromEvent = function (e) {
    if (!e || !e.target) return e;
    var target = e.target;
    return target.type === "checkbox" ? target.checked : target.value;
  };
  //async-validator 1.x: a rule whose only key (besides message) is "required" uses the required validator, which
  //types the value itself; empty = undefined/null, [] for arrays, "" for strings
  var asyncIsEmpty = function (value, type) {
    if (value === undefined || value === null) return true;
    if (type === "array" && Array.isArray(value) && !value.length) return true;
    if (type === "string" && typeof value === "string" && !value) return true;
    return false;
  };
  var runRules = function (name, rules, value) {
    var errors = [];
    (rules || []).forEach(function (rule) {
      if (typeof rule.validator === "function") {
        rule.validator(rule, value, function (msg) { if (msg) errors.push({ message: msg.message || msg, field: name }); }, {}, {});
        return;
      }
      var keys = Object.keys(rule).filter(function (k) { return k !== "message"; });
      var type = keys.length === 1 && keys[0] === "required" ? (Array.isArray(value) ? "array" : typeof value) : (rule.type || "string");
      if (rule.required && asyncIsEmpty(value, type)) errors.push({ message: rule.message || name + " is required", field: name });
    });
    return errors.length ? errors : undefined;
  };
  var FieldsStore = function () {
    this.fields = {};
    this.fieldsMeta = {};
  };
  FieldsStore.prototype.getFieldMeta = function (name) {
    this.fieldsMeta[name] = this.fieldsMeta[name] || {};
    return this.fieldsMeta[name];
  };
  FieldsStore.prototype.getValueFromFields = function (name, fields) {
    var field = fields[name];
    if (field && "value" in field) return field.value;
    var fieldMeta = this.getFieldMeta(name);
    return fieldMeta && fieldMeta.initialValue;
  };
  FieldsStore.prototype.getAllFieldsName = function () { return Object.keys(this.fieldsMeta); };
  FieldsStore.prototype.getValidFieldsName = function () {
    var me = this;
    return Object.keys(this.fieldsMeta).filter(function (name) { return !me.getFieldMeta(name).hidden; });
  };
  FieldsStore.prototype.flattenRegisteredFields = function (fields) {
    var valid = this.getAllFieldsName();
    var out = {};
    if (!fields) return out;
    Object.keys(fields).forEach(function (k) { if (valid.indexOf(k) >= 0) out[k] = fields[k]; });
    return out;
  };
  FieldsStore.prototype.setFields = function (fields) {
    var me = this;
    var nowFields = Object.assign({}, this.fields, fields);
    var nowValues = {};
    Object.keys(this.fieldsMeta).forEach(function (f) { nowValues[f] = me.getValueFromFields(f, nowFields); });
    Object.keys(nowValues).forEach(function (f) {
      var value = nowValues[f];
      var fieldMeta = me.getFieldMeta(f);
      if (fieldMeta && fieldMeta.normalize) {
        var nowValue = fieldMeta.normalize(value, me.getValueFromFields(f, me.fields), nowValues);
        if (nowValue !== value) nowFields[f] = Object.assign({}, nowFields[f], { value: nowValue });
      }
    });
    this.fields = nowFields;
  };
  FieldsStore.prototype.resetFields = function () {
    var fields = this.fields;
    return this.getAllFieldsName().reduce(function (acc, name) {
      var field = fields[name];
      if (field && "value" in field) acc[name] = {};
      return acc;
    }, {});
  };
  FieldsStore.prototype.setFieldsAsDirty = function () {
    var me = this;
    Object.keys(this.fields).forEach(function (name) {
      var field = me.fields[name];
      var fieldMeta = me.fieldsMeta[name];
      if (field && fieldMeta && hasRules(fieldMeta.validate)) me.fields[name] = Object.assign({}, field, { dirty: true });
    });
  };
  FieldsStore.prototype.getField = function (name) { return Object.assign({}, this.fields[name], { name: name }); };
  FieldsStore.prototype.getFieldValuePropValue = function (fieldMeta) {
    var field = this.getField(fieldMeta.name);
    var fieldValue = "value" in field ? field.value : fieldMeta.initialValue;
    if (fieldMeta.getValueProps) return fieldMeta.getValueProps(fieldValue);
    var o = {};
    o[fieldMeta.valuePropName] = fieldValue;
    return o;
  };
  FieldsStore.prototype.getFieldValue = function (name) { return this.getValueFromFields(name, this.fields); };
  FieldsStore.prototype.getFieldsValue = function (names) {
    var me = this;
    return (names || this.getValidFieldsName()).reduce(function (acc, f) {
      acc[f] = me.getFieldValue(f);
      return acc;
    }, {});
  };
  FieldsStore.prototype.getFieldError = function (name) {
    var errors = this.getField(name).errors;
    return errors ? errors.map(function (e) { return e && e.message ? e.message : e; }) : errors;
  };
  FieldsStore.prototype.clearField = function (name) {
    delete this.fields[name];
    delete this.fieldsMeta[name];
  };

  //rc-form FieldElemWrapper: a decorated element mounted/unmounted marks the field as in the DOM / clears it
  var FieldElemWrapper = class extends React.Component {
    componentDidMount() {
      var form = this.props.form;
      form.domFields[this.props.name] = true;
      form.recoverClearedField(this.props.name);
    }
    componentWillUnmount() {
      var form = this.props.form;
      var name = this.props.name;
      var fieldMeta = form.fieldsStore.getFieldMeta(name);
      if (!fieldMeta.preserve) {
        form.clearedFieldMetaCache[name] = { field: form.fieldsStore.getField(name), meta: fieldMeta };
        form.clearField(name);
      }
      delete form.domFields[name];
    }
    render() {
      return this.props.children;
    }
  };

  var createForm = function (WrappedComponent) {
    return class extends React.Component {
      constructor(props) {
        super(props);
        var me = this;
        this.fieldsStore = new FieldsStore();
        this.cachedBind = {};
        this.clearedFieldMetaCache = {};
        this.renderFields = {};
        this.domFields = {};
        this.instances = {};
        ["getFieldDecorator", "getFieldProps", "setFields", "setFieldsValue", "resetFields", "validateFields", "clearField", "recoverClearedField", "onCollect", "onCollectValidate", "saveRef"].forEach(function (k) {
          me[k] = me[k].bind(me);
        });
      }
      componentDidMount() { this.cleanUpUselessFields(); }
      componentDidUpdate() { this.cleanUpUselessFields(); }
      cleanUpUselessFields() {
        var me = this;
        var removed = this.fieldsStore.getAllFieldsName().filter(function (field) {
          var fieldMeta = me.fieldsStore.getFieldMeta(field);
          return !me.renderFields[field] && !me.domFields[field] && !fieldMeta.preserve;
        });
        removed.forEach(function (n) { me.clearField(n); });
        this.renderFields = {};
      }
      clearField(name) {
        this.fieldsStore.clearField(name);
        delete this.instances[name];
        delete this.cachedBind[name];
      }
      //rc-form saveRef: antd Input/InputNumber/Checkbox/AutoComplete/pickers set their ref with useImperativeHandle without
      //deps, so on every re-render the ref is called with null (field cleared and cached) and again with the handle (field
      //recovered through fieldsStore.setFields, which runs every normalize, and its meta moved to the end)
      saveRef(name, _, component) {
        if (!component) {
          var fm = this.fieldsStore.getFieldMeta(name);
          if (!fm.preserve) {
            this.clearedFieldMetaCache[name] = { field: this.fieldsStore.getField(name), meta: fm };
            this.clearField(name);
          }
          delete this.domFields[name];
          return;
        }
        this.domFields[name] = true;
        this.recoverClearedField(name);
        var fieldMeta = this.fieldsStore.getFieldMeta(name);
        if (fieldMeta) {
          var ref = fieldMeta.ref;
          if (ref) {
            if (typeof ref === "function") ref(component);
            else if (Object.prototype.hasOwnProperty.call(ref, "current")) ref.current = component;
          }
        }
        this.instances[name] = component;
      }
      recoverClearedField(name) {
        if (this.clearedFieldMetaCache[name]) {
          var f = {};
          f[name] = this.clearedFieldMetaCache[name].field;
          this.fieldsStore.setFields(f);
          this.fieldsStore.fieldsMeta[name] = this.clearedFieldMetaCache[name].meta;
          delete this.clearedFieldMetaCache[name];
        }
      }
      onCollectCommon(name, action, args) {
        var fieldMeta = this.fieldsStore.getFieldMeta(name);
        if (fieldMeta[action]) fieldMeta[action].apply(fieldMeta, args);
        else if (fieldMeta.originalProps && fieldMeta.originalProps[action]) fieldMeta.originalProps[action].apply(fieldMeta.originalProps, args);
        var value = fieldMeta.getValueFromEvent ? fieldMeta.getValueFromEvent.apply(fieldMeta, args) : getValueFromEvent.apply(undefined, args);
        var field = this.fieldsStore.getField(name);
        return { name: name, field: Object.assign({}, field, { value: value, touched: true }), fieldMeta: fieldMeta };
      }
      onCollect(name_, action) {
        var args = Array.prototype.slice.call(arguments, 2);
        var c = this.onCollectCommon(name_, action, args);
        this.fieldsStore.setFieldsAsDirty();
        var nf = {};
        nf[c.name] = Object.assign({}, c.field, { dirty: hasRules(c.fieldMeta.validate) });
        this.setFields(nf);
      }
      onCollectValidate(name_, action) {
        var args = Array.prototype.slice.call(arguments, 2);
        var c = this.onCollectCommon(name_, action, args);
        var newField = Object.assign({}, c.field, { dirty: true });
        this.fieldsStore.setFieldsAsDirty();
        this.validateFieldsInternal([newField], { action: action, options: {} });
      }
      getCacheBind(name, action, fn) {
        if (!this.cachedBind[name]) this.cachedBind[name] = {};
        var cache = this.cachedBind[name];
        if (!cache[action] || cache[action].oriFn !== fn) cache[action] = { fn: fn.bind(this, name, action), oriFn: fn };
        return cache[action].fn;
      }
      getFieldDecorator(name, fieldOption) {
        var me = this;
        var props = this.getFieldProps(name, fieldOption);
        return function (fieldElem) {
          me.renderFields[name] = true;
          var fieldMeta = me.fieldsStore.getFieldMeta(name);
          var originalProps = fieldElem.props;
          fieldMeta.originalProps = originalProps;
          fieldMeta.ref = fieldElem.ref;
          var decorated = React.cloneElement(fieldElem, Object.assign({}, props, me.fieldsStore.getFieldValuePropValue(fieldMeta)));
          return supportRef(fieldElem) ? decorated : <FieldElemWrapper name={name} form={me}>{decorated}</FieldElemWrapper>;
        };
      }
      getFieldProps(name, usersFieldOption) {
        var me = this;
        usersFieldOption = usersFieldOption || {};
        delete this.clearedFieldMetaCache[name];
        var fieldOption = Object.assign({ name: name, trigger: "onChange", valuePropName: "value", validate: [] }, usersFieldOption);
        var rules = fieldOption.rules;
        var trigger = fieldOption.trigger;
        var validateTrigger = fieldOption.validateTrigger === undefined ? trigger : fieldOption.validateTrigger;
        var validate = fieldOption.validate;
        var fieldMeta = this.fieldsStore.getFieldMeta(name);
        if ("initialValue" in fieldOption) fieldMeta.initialValue = fieldOption.initialValue;
        var inputProps = Object.assign({}, this.fieldsStore.getFieldValuePropValue(fieldOption), { ref: this.getCacheBind(name, name + "__ref", this.saveRef) });
        inputProps.id = name;
        var validateRules = normalizeValidateRules(validate, rules, validateTrigger);
        var validateTriggers = getValidateTriggers(validateRules);
        validateTriggers.forEach(function (action) {
          if (inputProps[action]) return;
          inputProps[action] = me.getCacheBind(name, action, me.onCollectValidate);
        });
        if (trigger && validateTriggers.indexOf(trigger) === -1) inputProps[trigger] = this.getCacheBind(name, trigger, this.onCollect);
        var meta = Object.assign({}, fieldMeta, fieldOption, { validate: validateRules });
        this.fieldsStore.fieldsMeta[name] = meta;
        inputProps[FIELD_META_PROP] = meta;
        inputProps[FIELD_DATA_PROP] = this.fieldsStore.getField(name);
        this.renderFields[name] = true;
        return inputProps;
      }
      getRules(fieldMeta, action) {
        var out = [];
        fieldMeta.validate.filter(function (item) { return !action || item.trigger.indexOf(action) >= 0; }).forEach(function (item) { out = out.concat(item.rules); });
        return out;
      }
      setFields(fields, callback) {
        this.fieldsStore.setFields(this.fieldsStore.flattenRegisteredFields(fields));
        this.forceUpdate(callback);
      }
      setFieldsValue(changedValues, callback) {
        var fieldsMeta = this.fieldsStore.fieldsMeta;
        var values = this.fieldsStore.flattenRegisteredFields(changedValues);
        var newFields = Object.keys(values).reduce(function (acc, name) {
          if (fieldsMeta[name]) acc[name] = { value: values[name] };
          return acc;
        }, {});
        this.setFields(newFields, callback);
      }
      resetFields() {
        var newFields = this.fieldsStore.resetFields();
        if (Object.keys(newFields).length > 0) this.setFields(newFields);
        this.clearedFieldMetaCache = {};
      }
      validateFieldsInternal(fields, opts, callback) {
        var me = this;
        var allRules = {};
        var allValues = {};
        var allFields = {};
        var alreadyErrors = {};
        fields.forEach(function (field) {
          var name = field.name;
          if (field.dirty === false) {
            if (field.errors) alreadyErrors[name] = { errors: field.errors };
            return;
          }
          var fieldMeta = me.fieldsStore.getFieldMeta(name);
          var newField = Object.assign({}, field);
          newField.errors = undefined;
          newField.validating = true;
          newField.dirty = true;
          allRules[name] = me.getRules(fieldMeta, opts.action);
          allValues[name] = newField.value;
          allFields[name] = newField;
        });
        this.setFields(allFields);
        Object.keys(allValues).forEach(function (f) { allValues[f] = me.fieldsStore.getFieldValue(f); });
        if (callback && Object.keys(allFields).length === 0) {
          callback(Object.keys(alreadyErrors).length === 0 ? null : alreadyErrors, this.fieldsStore.getFieldsValue(opts.fieldNames));
          return;
        }
        var errorsGroup = Object.assign({}, alreadyErrors);
        Object.keys(allRules).forEach(function (name) {
          var errs = runRules(name, allRules[name], allValues[name]);
          if (errs) errorsGroup[name] = { errors: errs };
        });
        var nowAllFields = {};
        Object.keys(allRules).forEach(function (name) {
          var fieldErrors = errorsGroup[name];
          var nowField = me.fieldsStore.getField(name);
          nowField.errors = fieldErrors && fieldErrors.errors;
          nowField.value = allValues[name];
          nowField.validating = false;
          nowField.dirty = false;
          nowAllFields[name] = nowField;
        });
        this.setFields(nowAllFields);
        if (callback) callback(Object.keys(errorsGroup).length === 0 ? null : errorsGroup, this.fieldsStore.getFieldsValue(opts.fieldNames));
      }
      validateFields(ns, opt, cb) {
        var me = this;
        var callback = typeof ns === "function" ? ns : typeof opt === "function" ? opt : cb;
        var fieldNames = this.fieldsStore.getValidFieldsName();
        var fields = fieldNames.filter(function (name) {
          return hasRules(me.fieldsStore.getFieldMeta(name).validate);
        }).map(function (name) {
          var field = me.fieldsStore.getField(name);
          field.value = me.fieldsStore.getFieldValue(name);
          return field;
        });
        if (!fields.length) {
          if (callback) callback(null, this.fieldsStore.getFieldsValue(fieldNames));
          return;
        }
        this.validateFieldsInternal(fields, { fieldNames: fieldNames, options: {} }, callback);
      }
      getForm() {
        var s = this.fieldsStore;
        return {
          getFieldsValue: s.getFieldsValue.bind(s),
          getFieldValue: s.getFieldValue.bind(s),
          getFieldError: s.getFieldError.bind(s),
          setFieldsValue: this.setFieldsValue,
          setFields: this.setFields,
          getFieldDecorator: this.getFieldDecorator,
          getFieldProps: this.getFieldProps,
          validateFields: this.validateFields,
          resetFields: this.resetFields
        };
      }
      render() {
        return <WrappedComponent {...this.props} form={this.getForm()} />;
      }
    };
  };

  //@ant-design/compatible Form / Form.Item (DOM of ant-legacy-form)
  var LegacyFormContext = React.createContext({ labelAlign: "right", vertical: false });
  var LegacyForm = function (props) {
    var layout = props.layout || "horizontal";
    var cls = ["ant-legacy-form"];
    if (layout === "horizontal") cls.push("ant-legacy-form-horizontal");
    if (layout === "vertical") cls.push("ant-legacy-form-vertical");
    if (layout === "inline") cls.push("ant-legacy-form-inline");
    if (props.hideRequiredMark) cls.push("ant-legacy-form-hide-required-mark");
    if (props.className) cls.push(props.className);
    var colon = props.colon === undefined ? true : props.colon;
    return (
      <LegacyFormContext.Provider value={{ wrapperCol: props.wrapperCol, labelAlign: props.labelAlign, labelCol: props.labelCol, vertical: layout === "vertical", colon: colon }}>
        <form style={props.style} onSubmit={props.onSubmit || function (e) { e.preventDefault(); }} className={cls.join(" ")}>
          {props.children}
        </form>
      </LegacyFormContext.Provider>
    );
  };
  var getControls = function (children, recursively) {
    var controls = [];
    var arr = React.Children.toArray(children);
    for (var i = 0; i < arr.length; i += 1) {
      if (!recursively && controls.length > 0) break;
      var child = arr[i];
      if (child.type && (child.type === LegacyFormItem || child.type.displayName === "FormItem")) continue;
      if (!child.props) continue;
      if (FIELD_META_PROP in child.props) controls.push(child);
      else if (child.props.children) controls = controls.concat(getControls(child.props.children, recursively));
    }
    return controls;
  };
  var LegacyFormItem = function (props) {
    var ctx = useContext(LegacyFormContext);
    var rootRef = useRef(null);
    var onlyControl = getControls(props.children, false)[0] || null;
    var childProp = function (p) { return onlyControl && onlyControl.props && onlyControl.props[p]; };
    var field = childProp(FIELD_DATA_PROP);
    var meta = childProp(FIELD_META_PROP);
    var help = props.help;
    if (help === undefined && onlyControl) {
      help = "";
      if (field.errors) {
        help = field.errors.map(function (e) { return e.message; }).reduce(function (cur, item) { return cur.concat([" ", item]); }, []).slice(1);
      }
    }
    var validateStatus = props.validateStatus;
    if (validateStatus === undefined && onlyControl) {
      validateStatus = "";
      if (field.validating) validateStatus = "validating";
      else if (field.errors) validateStatus = "error";
      else {
        var fv = "value" in field ? field.value : meta.initialValue;
        if (fv !== undefined && fv !== null && fv !== "") validateStatus = "success";
      }
    }
    var required = props.required;
    if (required === undefined) {
      required = false;
      if (onlyControl) {
        var validate = (meta || {}).validate || [];
        required = validate.filter(function (item) { return !!item.rules; }).some(function (item) { return item.rules.some(function (rule) { return rule.required; }); });
      }
    }
    var id = props.id || childProp("id");
    var helpShow = !!(help && (Array.isArray(help) ? help.length : true));
    var itemCls = "ant-legacy-form-item" + (helpShow ? " ant-legacy-form-item-with-help" : "") + (props.className ? " " + props.className : "");
    var labelCol = ("labelCol" in props ? props.labelCol : ctx.labelCol) || {};
    var labelAlign = "labelAlign" in props ? props.labelAlign : ctx.labelAlign;
    var computedColon = props.colon === true || (ctx.colon !== false && props.colon !== false);
    var haveColon = computedColon && !ctx.vertical;
    var labelChildren = props.label;
    if (haveColon && typeof props.label === "string" && props.label.trim() !== "") labelChildren = props.label.replace(/[\uFF1A:]\s*$/, "");
    var labelClassName = [required ? "ant-legacy-form-item-required" : "", !computedColon ? "ant-legacy-form-item-no-colon" : ""].filter(Boolean).join(" ");
    var labelColCls = ["ant-legacy-form-item-label", labelAlign === "left" ? "ant-legacy-form-item-label-left" : "", labelCol.className || ""].filter(Boolean).join(" ");
    var wrapperCol = ("wrapperCol" in props ? props.wrapperCol : ctx.wrapperCol) || {};
    var wrapperCls = ["ant-legacy-form-item-control-wrapper", wrapperCol.className || ""].filter(Boolean).join(" ");
    var ctrlCls = "ant-legacy-form-item-control";
    if (validateStatus) {
      ctrlCls = ["ant-legacy-form-item-control", props.hasFeedback || validateStatus === "validating" ? "has-feedback" : "", validateStatus === "success" ? "has-success" : "", validateStatus === "warning" ? "has-warning" : "", validateStatus === "error" ? "has-error" : "", validateStatus === "validating" ? "is-validating" : ""].filter(Boolean).join(" ");
    }
    var onLabelClick = function () {
      if (!id || !rootRef.current) return;
      var control = rootRef.current.querySelector('[id="' + id + '"]');
      if (control && control.focus) control.focus();
    };
    var rest = {};
    var omitKeys = ["prefixCls", "style", "className", "children", "id", "htmlFor", "label", "labelAlign", "labelCol", "wrapperCol", "help", "extra", "validateStatus", "hasFeedback", "required", "colon"];
    Object.keys(props).forEach(function (k) { if (omitKeys.indexOf(k) < 0) rest[k] = props[k]; });
    var labelColProps = Object.assign({}, labelCol, { className: labelColCls });
    var wrapperColProps = Object.assign({}, wrapperCol, { className: wrapperCls });
    return (
      <Row className={itemCls} style={props.style} {...rest} ref={rootRef}>
        {props.label ? (
          <Col {...labelColProps}>
            <label htmlFor={props.htmlFor || id} className={labelClassName} title={typeof props.label === "string" ? props.label : ""} onClick={onLabelClick}>
              {labelChildren}
            </label>
          </Col>
        ) : null}
        <LegacyFormContext.Provider value={{ vertical: ctx.vertical }}>
          <Col {...wrapperColProps}>
            <div className={ctrlCls}>
              <span className="ant-legacy-form-item-children">{props.children}</span>
              {helpShow ? <div className="ant-legacy-form-explain">{help}</div> : null}
              {props.extra ? <div className="ant-legacy-form-extra">{props.extra}</div> : null}
            </div>
          </Col>
        </LegacyFormContext.Provider>
      </Row>
    );
  };
  LegacyForm.Item = LegacyFormItem;
  LegacyForm.create = function () { return createForm; };


  var FormItem = LegacyForm.Item;

  /* ---------- Shared/CodeEditorW ----------
     La nativa edita el comportamiento con CodeMirror 6 (basicSetup + modo YAML), que no esta en el scope de una vista
     personalizada. Este editor propio mantiene:
       - la API de compatibilidad de la nativa: window.global[divId].setValue(texto) / getValue();
       - el contenedor div#divId.CodeMirror[dir=ltr] (el borde y el alto automatico que la SPA le da a la nativa);
       - el aspecto del tema claro de CodeMirror 6: numeros de linea, linea activa, foco punteado, letra monoespaciada
         con interlineado 1.4, tabulacion de 4 y los colores del modo YAML (@codemirror/legacy-modes 6.3.3 con el
         defaultHighlightStyle de @codemirror/language 6.8.0);
       - las teclas de CodeMirror que importan al escribir YAML: Tab / Mayus+Tab y Ctrl+] / Ctrl+[ (sangrar o quitar
         sangria de las lineas seleccionadas, de a 2 espacios), Enter (nueva linea con la sangria de la linea),
         Retroceso dentro de la sangria (vuelve a la columna de sangria anterior), Inicio (primer caracter y luego
         inicio de la linea), Ctrl+/ (comentar o descomentar con #) y deshacer / rehacer del navegador;
       - los saltos de linea normalizados a \n como CodeMirror: getValue devuelve el mismo texto que la nativa.
     No trae: autocompletado de comandos (Ctrl+Espacio), clic sobre chain / formId, plegado, busqueda (Ctrl+F) ni
     cierre automatico de parentesis y comillas. */
  var CM_TAB = 4;
  var CM_UNIT = 2;
  //@codemirror/language 6.8.0: countCol y StringStream (lo que usa el modo yaml)
  var cmCountCol = function (string, end, tabSize) {
    if (end == null) {
      end = string.search(/[^\s\u00a0]/);
      if (end == -1) end = string.length;
    }
    var n = 0;
    for (var i = 0; i < end; i++) {
      if (string.charCodeAt(i) == 9) n += tabSize - (n % tabSize);
      else n++;
    }
    return n;
  };
  var CmStream = function (string, tabSize) {
    this.string = string;
    this.tabSize = tabSize;
    this.pos = 0;
    this.start = 0;
  };
  CmStream.prototype.eol = function () { return this.pos >= this.string.length; };
  CmStream.prototype.sol = function () { return this.pos == 0; };
  CmStream.prototype.peek = function () { return this.string.charAt(this.pos) || undefined; };
  CmStream.prototype.next = function () { if (this.pos < this.string.length) return this.string.charAt(this.pos++); };
  CmStream.prototype.skipToEnd = function () { this.pos = this.string.length; };
  CmStream.prototype.indentation = function () { return cmCountCol(this.string, null, this.tabSize); };
  CmStream.prototype.match = function (pattern, consume, caseInsensitive) {
    if (typeof pattern == "string") {
      var cased = function (str) { return caseInsensitive ? str.toLowerCase() : str; };
      var substr = this.string.substr(this.pos, pattern.length);
      if (cased(substr) == cased(pattern)) {
        if (consume !== false) this.pos += pattern.length;
        return true;
      }
      return null;
    }
    var match = this.string.slice(this.pos).match(pattern);
    if (match && match.index > 0) return null;
    if (match && consume !== false) this.pos += match[0].length;
    return match;
  };
  //@codemirror/legacy-modes 6.3.3 mode/yaml.js, misma logica
  var yamlCons = ["true", "false", "on", "off", "yes", "no"];
  var yamlKeywordRegex = new RegExp("\\b((" + yamlCons.join(")|(") + "))$", "i");
  var yamlMode = {
    token: function (stream, state) {
      var ch = stream.peek();
      var esc = state.escaped;
      state.escaped = false;
      if (ch == "#" && (stream.pos == 0 || /\s/.test(stream.string.charAt(stream.pos - 1)))) {
        stream.skipToEnd();
        return "comment";
      }
      if (stream.match(/^('([^']|\\.)*'?|"([^"]|\\.)*"?)/)) return "string";
      if (state.literal && stream.indentation() > state.keyCol) {
        stream.skipToEnd();
        return "string";
      } else if (state.literal) {
        state.literal = false;
      }
      if (stream.sol()) {
        state.keyCol = 0;
        state.pair = false;
        state.pairStart = false;
        if (stream.match("---")) return "def";
        if (stream.match("...")) return "def";
        if (stream.match(/^\s*-\s+/)) return "meta";
      }
      if (stream.match(/^(\{|\}|\[|\])/)) {
        if (ch == "{") state.inlinePairs++;
        else if (ch == "}") state.inlinePairs--;
        else if (ch == "[") state.inlineList++;
        else state.inlineList--;
        return "meta";
      }
      if (state.inlineList > 0 && !esc && ch == ",") {
        stream.next();
        return "meta";
      }
      if (state.inlinePairs > 0 && !esc && ch == ",") {
        state.keyCol = 0;
        state.pair = false;
        state.pairStart = false;
        stream.next();
        return "meta";
      }
      if (state.pairStart) {
        if (stream.match(/^\s*(\||\>)\s*/)) {
          state.literal = true;
          return "meta";
        }
        if (stream.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i)) return "variable";
        if (state.inlinePairs == 0 && stream.match(/^\s*-?[0-9\.\,]+\s?$/)) return "number";
        if (state.inlinePairs > 0 && stream.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/)) return "number";
        if (stream.match(yamlKeywordRegex)) return "keyword";
      }
      if (!state.pair && stream.match(/^\s*(?:[,\[\]{}&*!|>'"%@`][^\s'":]|[^,\[\]{}#&*!|>'"%@`])[^#]*?(?=\s*:($|\s))/)) {
        state.pair = true;
        state.keyCol = stream.indentation();
        return "atom";
      }
      if (state.pair && stream.match(/^:\s*/)) {
        state.pairStart = true;
        return "meta";
      }
      state.pairStart = false;
      state.escaped = (ch == "\\");
      stream.next();
      return null;
    },
    startState: function () {
      return { pair: false, pairStart: false, keyCol: 0, inlinePairs: 0, inlineList: 0, literal: false, escaped: false };
    }
  };
  //defaultHighlightStyle (@codemirror/language 6.8.0) aplicado a los tokens del modo yaml; "variable" no tiene color
  var YAML_COLORS = { comment: "#940", string: "#a11", def: "#00f", meta: "#404740", number: "#164", keyword: "#708", atom: "#219" };
  //StreamLanguage: una linea por vez con el estado del modo arrastrado de la linea anterior
  var highlightYaml = function (doc) {
    var state = yamlMode.startState();
    return doc.split("\n").map(function (line) {
      var parts = [];
      var stream = new CmStream(line, CM_TAB);
      while (!stream.eol()) {
        stream.start = stream.pos;
        var style = null;
        for (var i = 0; i < 10; i++) {
          style = yamlMode.token(stream, state);
          if (stream.pos > stream.start) break;
        }
        if (stream.pos <= stream.start) {
          stream.pos = line.length;
          style = null;
        }
        var color = style ? YAML_COLORS[style] : undefined;
        var piece = line.slice(stream.start, stream.pos);
        var last = parts[parts.length - 1];
        if (last && last.color === color) last.text += piece;
        else parts.push({ text: piece, color: color });
      }
      return parts;
    });
  };

  //---- comandos de edicion (@codemirror/commands 6.2.4 y @codemirror/state 6.2.1, para una sola seleccion) ----
  var cmLineStart = function (text, pos) { return pos <= 0 ? 0 : text.lastIndexOf("\n", pos - 1) + 1; };
  var cmLineEnd = function (text, pos) { var i = text.indexOf("\n", pos); return i < 0 ? text.length : i; };
  var cmCountColumn = function (string) {
    var n = 0;
    for (var i = 0; i < string.length; i++) {
      if (string.charCodeAt(i) == 9) n += CM_TAB - (n % CM_TAB);
      else n++;
    }
    return n;
  };
  var cmSpaces = function (cols) { var r = ""; for (var i = 0; i < cols; i++) r += " "; return r; };
  var cmLeading = function (s) { return /^\s*/.exec(s)[0]; };
  //changeBySelectedLine: las lineas que toca la seleccion; si la seleccion termina justo al inicio de una linea, esa
  //linea queda fuera
  var cmSelectedLines = function (text, from, to) {
    var out = [];
    for (var pos = from; pos <= to;) {
      var ls = cmLineStart(text, pos), le = cmLineEnd(text, pos);
      if (from == to || to > ls) out.push({ from: ls, to: le, text: text.slice(ls, le) });
      pos = le + 1;
    }
    return out;
  };
  //ChangeSet.mapPos con cambios ordenados {from, to, insert}
  var cmMapPos = function (changes, pos, assoc) {
    var posA = 0, posB = 0;
    for (var i = 0; i < changes.length; i++) {
      var c = changes[i];
      if (c.from > pos) return posB + (pos - posA);
      posB += c.from - posA;
      posA = c.from;
      var len = c.to - c.from, ins = c.insert.length;
      if (c.to > pos || (c.to == pos && assoc < 0 && !len)) return pos == posA || assoc < 0 ? posB : posB + ins;
      posB += ins;
      posA = c.to;
    }
    return posB + (pos - posA);
  };
  //EditorSelection.map: un cursor con assoc; un rango con su inicio en 1 y su fin en -1
  var cmMapSel = function (changes, anchor, head, assoc) {
    if (anchor == head) {
      var p = cmMapPos(changes, head, assoc);
      return { anchor: p, head: p };
    }
    var from = cmMapPos(changes, Math.min(anchor, head), 1), to = cmMapPos(changes, Math.max(anchor, head), -1);
    return anchor < head ? { anchor: from, head: to } : { anchor: to, head: from };
  };
  var cmIndentMore = function (text, anchor, head) {
    var changes = cmSelectedLines(text, Math.min(anchor, head), Math.max(anchor, head)).map(function (l) {
      return { from: l.from, to: l.from, insert: cmSpaces(CM_UNIT) };
    });
    return { changes: changes, anchor: cmMapPos(changes, anchor, 1), head: cmMapPos(changes, head, 1) };
  };
  var cmIndentLess = function (text, anchor, head) {
    var changes = [];
    cmSelectedLines(text, Math.min(anchor, head), Math.max(anchor, head)).forEach(function (l) {
      var space = cmLeading(l.text);
      if (!space) return;
      var insert = cmSpaces(Math.max(0, cmCountColumn(space) - CM_UNIT)), keep = 0;
      while (keep < space.length && keep < insert.length && space.charCodeAt(keep) == insert.charCodeAt(keep)) keep++;
      changes.push({ from: l.from + keep, to: l.from + space.length, insert: insert.slice(keep) });
    });
    return { changes: changes, anchor: cmMapPos(changes, anchor, 1), head: cmMapPos(changes, head, 1) };
  };
  //insertNewlineAndIndent (6.2.4): el modo yaml no calcula sangria y CodeMirror repite tantos espacios como caracteres
  //en blanco tenga la linea al inicio (un tabulador cuenta uno); entre (), [] o {} abre una linea mas
  var cmNewlineAndIndent = function (text, anchor, head) {
    var from = Math.min(anchor, head), to = Math.max(anchor, head);
    var lineFrom = cmLineStart(text, from), lineTo = cmLineEnd(text, from), lineText = text.slice(lineFrom, lineTo);
    var explode = from == to && /\(\)|\[\]|\{\}/.test(text.slice(Math.max(0, from - 1), from + 1));
    var indent = cmLeading(lineText).length;
    while (to < lineTo && /\s/.test(text.charAt(to))) to++;
    if (explode) to = from;
    else if (from > lineFrom && from < lineFrom + 100 && !/\S/.test(lineText.slice(0, from))) from = lineFrom;
    var insert = "\n" + cmSpaces(indent);
    if (explode) insert += "\n" + cmSpaces(cmCountColumn(cmLeading(text.slice(lineFrom, from))));
    var cursor = from + 1 + indent;
    return { changes: [{ from: from, to: to, insert: insert }], anchor: cursor, head: cursor };
  };
  //deleteCharBackward dentro de la sangria: borra hasta la columna de sangria anterior
  var cmDeleteIndentBackward = function (text, anchor, head) {
    if (anchor != head) return null;
    var lineFrom = cmLineStart(text, head);
    if (!(head > lineFrom && head - lineFrom <= 100)) return null;
    var before = text.slice(lineFrom, head);
    if (/[^ \t]/.test(before) || before.charAt(before.length - 1) == "\t") return null;
    var drop = cmCountColumn(before) % CM_UNIT || CM_UNIT, target = head;
    for (var i = 0; i < drop && before.charAt(before.length - 1 - i) == " "; i++) target--;
    if (target >= head - 1) return null;
    return { changes: [{ from: target, to: head, insert: "" }], anchor: target, head: target };
  };
  //cursorLineBoundaryBackward: primero al final de la sangria, despues al inicio de la linea
  var cmHomeTarget = function (text, head) {
    var lineFrom = cmLineStart(text, head), lineTo = cmLineEnd(text, head);
    var space = cmLeading(text.slice(lineFrom, Math.min(lineFrom + 100, lineTo))).length;
    return space && head != lineFrom + space ? lineFrom + space : lineFrom;
  };
  //toggleComment con el comentario de linea del modo yaml (#)
  var cmToggleLineComment = function (text, anchor, head) {
    var token = "#", lines = [], minIndent = 1e9;
    cmSelectedLines(text, Math.min(anchor, head), Math.max(anchor, head)).forEach(function (l) {
      var indent = cmLeading(l.text).length;
      if (indent < l.text.length && indent < minIndent) minIndent = indent;
      lines.push({ from: l.from, text: l.text, indent: indent, empty: indent == l.text.length, comment: l.text.slice(indent, indent + token.length) == token ? indent : -1, single: false });
    });
    if (minIndent < 1e9) lines.forEach(function (l) { if (l.indent < l.text.length) l.indent = minIndent; });
    if (lines.length == 1) lines[0].single = true;
    var changes = [];
    if (lines.some(function (l) { return l.comment < 0 && (!l.empty || l.single); })) {
      lines.forEach(function (l) { if (l.single || !l.empty) changes.push({ from: l.from + l.indent, to: l.from + l.indent, insert: token + " " }); });
      var sel = cmMapSel(changes, anchor, head, 1);
      return { changes: changes, anchor: sel.anchor, head: sel.head };
    }
    if (lines.some(function (l) { return l.comment >= 0; })) {
      lines.forEach(function (l) {
        if (l.comment < 0) return;
        var f = l.from + l.comment, e = f + token.length;
        if (text.charAt(e) == " ") e++;
        changes.push({ from: f, to: e, insert: "" });
      });
      var sel2 = cmMapSel(changes, anchor, head, -1);
      return { changes: changes, anchor: sel2.anchor, head: sel2.head };
    }
    return null;
  };
  var cmApply = function (text, changes) {
    var out = "", last = 0;
    changes.forEach(function (c) {
      out += text.slice(last, c.from) + c.insert;
      last = c.to;
    });
    return out + text.slice(last);
  };
  var cmNormalize = function (v) { return v === undefined || v === null ? "" : String(v).replace(/\r\n?/g, "\n"); };
  var cmMaxLineNumber = function (lines) {
    var last = 9;
    while (last < lines) last = last * 10 + 9;
    return last;
  };
  var CM_CSS =
    ".clcm-editor{position:relative;box-sizing:border-box;display:flex;flex-direction:column}" +
    ".clcm-editor.clcm-focused{outline:1px dotted #212121}" +
    ".clcm-scroller{display:flex;align-items:flex-start;font-family:monospace;line-height:1.4;height:100%;overflow-x:auto;position:relative;z-index:0}" +
    ".clcm-gutters{flex-shrink:0;display:flex;align-self:stretch;box-sizing:border-box;position:sticky;left:0;z-index:200;background-color:#f5f5f5;color:#6c6c6c;border-right:1px solid #ddd}" +
    ".clcm-gutter{display:flex;flex-direction:column;flex-shrink:0;box-sizing:border-box;padding-top:4px;overflow:hidden}" +
    ".clcm-gutterElement{box-sizing:border-box}" +
    ".clcm-lineNumbers .clcm-gutterElement{padding:0 3px 0 5px;min-width:20px;text-align:right;white-space:nowrap}" +
    ".clcm-foldGutter span{padding:0 1px}" +
    ".clcm-spacer{visibility:hidden;pointer-events:none;height:0;overflow:hidden}" +
    ".clcm-activeLineGutter{background-color:#e2f2ff}" +
    ".clcm-body{position:relative;flex-grow:2;flex-shrink:0;align-self:stretch}" +
    ".clcm-content{margin:0;display:block;white-space:pre;word-wrap:normal;box-sizing:border-box;padding:4px 0;position:relative;pointer-events:none;tab-size:4;-moz-tab-size:4}" +
    ".clcm-line{display:block;padding:0 2px 0 6px}" +
    ".clcm-activeLine{background-color:#cceeff44}" +
    ".clcm-input{position:absolute;top:0;left:0;width:100%;height:100%;margin:0;border:0;outline:none;resize:none;overflow:hidden;" +
    "padding:4px 2px 4px 6px;box-sizing:border-box;background:transparent;color:transparent;caret-color:black;font:inherit;" +
    "font-family:monospace;line-height:1.4;white-space:pre;word-wrap:normal;tab-size:4;-moz-tab-size:4}" +
    ".clcm-input::selection{background:#86b4ff !important;color:transparent}" +
    ".clcm-input::-moz-selection{background:#86b4ff !important;color:transparent}";
  var cmSetSelection = function (ta, anchor, head) {
    if (anchor <= head) ta.setSelectionRange(anchor, head, "forward");
    else ta.setSelectionRange(head, anchor, "backward");
  };

  var CodeEditorW = function (props) {
    var divId = props.divId ? props.divId : "myCodeMirror";
    var initial = useMemo(function () { return cmNormalize(props.value); }, []);
    var s1 = useState(initial), doc = s1[0], setDoc = s1[1];
    var s2 = useState(0), head = s2[0], setHead = s2[1];
    var s3 = useState(false), focused = s3[0], setFocused = s3[1];
    var docRef = useRef(initial);
    var taRef = useRef(null);
    var pendingSel = useRef(null);
    var onChangeRef = useRef(props.onChange);
    onChangeRef.current = props.onChange;
    var setText = function (v) {
      docRef.current = v;
      setDoc(v);
      if (onChangeRef.current) onChangeRef.current(v);
    };

    useEffect(function () {
      //back compatibility: la nativa lee y escribe el editor por window.global[divId]
      if (!window.global) window.global = {};
      window.global[divId] = {
        setValue: function (v) {
          pendingSel.current = { anchor: 0, head: 0 };
          setHead(0);
          setText(cmNormalize(v));
        },
        getValue: function () { return docRef.current; },
        //moves the cursor to a 1-based line and column and brings that line into view (error list of the basic mode)
        goToLine: function (line, column) {
          var ta = taRef.current;
          if (!ta) return;
          var text = docRef.current, pos = 0;
          for (var l = 1; l < line; l++) {
            var nl = text.indexOf("\n", pos);
            if (nl < 0) break;
            pos = nl + 1;
          }
          var lineEnd = text.indexOf("\n", pos);
          if (lineEnd < 0) lineEnd = text.length;
          pos = Math.min(lineEnd, pos + Math.max(0, (column || 1) - 1));
          ta.focus();
          cmSetSelection(ta, pos, pos);
          setHead(pos);
          var root = document.getElementById(divId);
          var lineEl = root ? root.querySelectorAll(".clcm-content .clcm-line")[line - 1] : null;
          if (lineEl && lineEl.scrollIntoView) lineEl.scrollIntoView({ block: "center" });
        }
      };
    }, []);
    useLayoutEffect(function () {
      var ta = taRef.current;
      if (!ta || !pendingSel.current) return;
      cmSetSelection(ta, pendingSel.current.anchor, pendingSel.current.head);
      pendingSel.current = null;
    });

    var syncHead = function () {
      var ta = taRef.current;
      if (ta) setHead(ta.selectionDirection == "backward" ? ta.selectionStart : ta.selectionEnd);
    };
    //cada edicion pasa por execCommand para que Ctrl+Z / Ctrl+Y del navegador la deshagan y rehagan
    var applyEdit = function (ta, res) {
      var text = ta.value;
      if (res.changes.length) {
        var expected = cmApply(text, res.changes);
        var blockFrom = res.changes[0].from, blockTo = res.changes[res.changes.length - 1].to;
        var blockNew = expected.slice(blockFrom, expected.length - (text.length - blockTo));
        ta.setSelectionRange(blockFrom, blockTo);
        var ok = false;
        try {
          ok = blockNew.length ? document.execCommand("insertText", false, blockNew) : document.execCommand("delete", false, null);
        } catch (e) {
          ok = false;
        }
        if (!ok || ta.value !== expected) {
          pendingSel.current = { anchor: res.anchor, head: res.head };
          setText(expected);
          setHead(res.head);
          return;
        }
      }
      cmSetSelection(ta, res.anchor, res.head);
      setHead(res.head);
    };
    var onKeyDown = function (e) {
      if (e.nativeEvent && e.nativeEvent.isComposing) return;
      var ta = e.target, text = ta.value;
      var back = ta.selectionDirection == "backward";
      var anchor = back ? ta.selectionEnd : ta.selectionStart, cur = back ? ta.selectionStart : ta.selectionEnd;
      var mod = e.ctrlKey || e.metaKey;
      var res = null;
      if (e.key == "Tab" && !mod && !e.altKey) res = e.shiftKey ? cmIndentLess(text, anchor, cur) : cmIndentMore(text, anchor, cur);
      else if (mod && !e.altKey && !e.shiftKey && e.key == "]") res = cmIndentMore(text, anchor, cur);
      else if (mod && !e.altKey && !e.shiftKey && e.key == "[") res = cmIndentLess(text, anchor, cur);
      else if (mod && !e.altKey && e.key == "/") res = cmToggleLineComment(text, anchor, cur) || { changes: [], anchor: anchor, head: cur };
      else if (e.key == "Enter" && !mod && !e.altKey && !e.shiftKey) res = cmNewlineAndIndent(text, anchor, cur);
      else if (e.key == "Backspace" && !mod && !e.altKey) res = cmDeleteIndentBackward(text, anchor, cur);
      else if (e.key == "Home" && !mod && !e.altKey) {
        var target = cmHomeTarget(text, cur);
        res = { changes: [], anchor: e.shiftKey ? anchor : target, head: target };
      }
      if (!res) return;
      e.preventDefault();
      applyEdit(ta, res);
    };

    var lines = useMemo(function () { return highlightYaml(doc); }, [doc]);
    var activeLine = 0;
    for (var i = 0, h = Math.min(head, doc.length); i < h; i++) if (doc.charCodeAt(i) == 10) activeLine++;
    var cls = function (base, idx) { return base + (idx == activeLine ? (base == "clcm-line" ? " clcm-activeLine" : " clcm-activeLineGutter") : ""); };
    return (
      <div>
        <style>{CM_CSS}</style>
        <div id={divId} className="CodeMirror" dir="ltr">
          <div className={"clcm-editor" + (focused ? " clcm-focused" : "")}>
            <div className="clcm-scroller">
              <div className="clcm-gutters" aria-hidden="true">
                <div className="clcm-gutter clcm-lineNumbers">
                  <div className="clcm-gutterElement clcm-spacer">{String(cmMaxLineNumber(lines.length))}</div>
                  {lines.map(function (l, n) { return <div key={n} className={cls("clcm-gutterElement", n)}>{n + 1}</div>; })}
                </div>
                <div className="clcm-gutter clcm-foldGutter">
                  <div className="clcm-gutterElement clcm-spacer"><span>{"\u203a"}</span></div>
                  {lines.map(function (l, n) { return <div key={n} className={cls("clcm-gutterElement", n)}><br /></div>; })}
                </div>
              </div>
              <div className="clcm-body">
                <textarea
                  ref={taRef}
                  className="clcm-input"
                  value={doc}
                  wrap="off"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  translate="no"
                  onChange={function (e) { setText(e.target.value); syncHead(); }}
                  onKeyDown={onKeyDown}
                  onSelect={syncHead}
                  onFocus={function () { setFocused(true); }}
                  onBlur={function () { setFocused(false); }}
                  onScroll={function (e) { e.target.scrollTop = 0; e.target.scrollLeft = 0; }}
                />
                <div className="clcm-content" aria-hidden="true">
                  {lines.map(function (parts, n) {
                    return (
                      <div key={n} className={cls("clcm-line", n)}>
                        {parts.length ? parts.map(function (p, k) { return p.color ? <span key={k} style={{ color: p.color }}>{p.text}</span> : p.text; }) : <br />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div />
        <div />
      </div>
    );
  };


  /* ---------- Basic mode, checks and variables catalog ----------
     Basic mode edits the template as a header form plus a grid of lines and writes the YAML with TPL.toYaml; advanced
     mode is the native editor. The YAML is only regenerated when something changed in basic mode, so a template that
     is just opened or viewed keeps its original text. Save and Execute Now run TPL.validate first: errors block,
     warnings ask for confirmation. */
  /* ---------- Standard view styles (copied verbatim from CLTransaccionesContables: INSTRUCCIONES_DISENO_VISTAS_V2) ---------- */
  var TX_CSS = [
    ".tx-shell { --view-ink:#1e293b; --view-muted:#64748b; --view-line:#e2e8f0; --view-line-strong:#cbd5e1; --view-page:#f4f6fa; --view-brand:#1e4b8f; --view-brand-dark:#15356b; --view-good:#137a4c; --view-bad:#cf1322; }",
    ".tx-shell { width:100%; height:calc(100dvh - 72px); min-height:0; padding:4px; box-sizing:border-box; display:flex; flex-direction:column; background:var(--view-page); color:var(--view-ink); font:13px/1.45 -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif; }",
    ".tx-shell *, .tx-shell *::before, .tx-shell *::after { box-sizing:border-box; }",
    ".tx-card { flex:1 1 auto; display:flex; flex-direction:column; min-width:0; min-height:0; background:#fff; border:1px solid #aebdcd; border-radius:8px; box-shadow:0 1px 2px rgba(15,23,42,.04); overflow:hidden; }",
    ".tx-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:50px; padding:6px 8px; background:var(--view-page); border-bottom:2px solid var(--view-brand); }",
    ".tx-title { display:flex; align-items:center; gap:12px; color:var(--view-brand-dark); font-size:17px; font-weight:700; letter-spacing:-.01em; line-height:1.3; }",
    ".tx-title-mark { width:6px; height:30px; flex:0 0 6px; border-radius:3px; background:var(--view-brand); }",
    ".tx-body { flex:1 1 auto; min-width:0; min-height:0; padding:4px; display:flex; flex-direction:column; }",
    ".tx-tabs { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; }",
    ".tx-tabs > .ant-tabs-content-holder { flex:1 1 auto; min-height:0; overflow:hidden; }",
    ".tx-tabs > .ant-tabs-content-holder > .ant-tabs-content { height:100%; }",
    ".tx-tabs > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane-active { height:100%; }",
    ".tx-pane-list { height:100%; min-height:0; display:flex; flex-direction:column; }",
    ".tx-pane-list > .tx-toolbar { flex:0 0 auto; }",
    ".tx-pane-scroll { height:100%; min-height:0; overflow:auto; }",
    ".tx-tabs > .ant-tabs-nav, .tx-tabs > .ant-tabs-bar { margin:0 0 4px; border-bottom:1px solid var(--view-line-strong); }",
    ".tx-tabs > .ant-tabs-nav .ant-tabs-nav-list { gap:2px; flex-wrap:wrap; }",
    ".tx-tabs .ant-tabs-tab { height:36px; margin:0 !important; padding:0 13px !important; background:transparent; border:0; border-bottom:2px solid transparent; color:var(--view-muted); font-size:12.5px; font-weight:500; display:inline-flex; align-items:center; }",
    ".tx-tabs .ant-tabs-tab:hover { color:var(--view-brand-dark); }",
    ".tx-tabs .ant-tabs-tab-active { border-bottom-color:var(--view-brand); }",
    ".tx-tabs .ant-tabs-tab-active, .tx-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color:var(--view-brand); font-weight:700; }",
    ".tx-tabs .ant-tabs-ink-bar { display:none; }",
    ".tx-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; min-height:32px; margin:4px 0; padding:4px; background:#eaf1fb; border:1px solid #c7d9f2; border-radius:8px; }",
    ".tx-toolbar .ant-dropdown-button, .tx-toolbar .ant-btn-group { display:inline-flex !important; width:auto !important; flex:0 0 auto; }",
    ".tx-toolbar-light { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:4px 0; }",
    ".tx-action.ant-btn, .tx-action .ant-btn { height:32px; padding:0 15px; border-radius:4px; font-size:14px; font-weight:500; box-shadow:none; background:#fff; border-color:#8c9db3; color:#262626; }",
    ".tx-action.ant-btn:not([disabled]):hover, .tx-action.ant-btn:not([disabled]):focus, .tx-action .ant-btn:not([disabled]):hover { border-color:#1890ff; color:#1890ff; }",
    ".tx-action.ant-btn-primary { background:#1890ff; border-color:#1890ff; color:#fff; }",
    ".tx-action.ant-btn-primary:not([disabled]):hover, .tx-action.ant-btn-primary:not([disabled]):focus { background:#147bd1; border-color:#147bd1; color:#fff; }",
    ".tx-action.tx-report { background:#dd603d; border-color:#bd4d35; color:#fff; }",
    ".tx-action.tx-report:not([disabled]):hover, .tx-action.tx-report:not([disabled]):focus { background:#bd4d35; border-color:#a3402c; color:#fff; }",
    ".tx-action.tx-warning { background:#faad14; border-color:#d48806; color:#fff; }",
    ".tx-action.tx-warning:not([disabled]):hover, .tx-action.tx-warning:not([disabled]):focus { background:#d48806; border-color:#ad6800; color:#fff; }",
    ".tx-action.tx-danger { background:#ff4d4f; border-color:#cf1322; color:#fff; }",
    ".tx-action.tx-danger:not([disabled]):hover, .tx-action.tx-danger:not([disabled]):focus { background:#cf1322; border-color:#a8071a; color:#fff; }",
    ".tx-action.tx-success { background:#60b13d; border-color:#4f9336; color:#fff; }",
    ".tx-action.tx-success:not([disabled]):hover, .tx-action.tx-success:not([disabled]):focus { background:#4f9336; border-color:#3f7a2b; color:#fff; }",
    ".tx-action.ant-btn[disabled], .tx-action.ant-btn[disabled]:hover, .tx-action .ant-btn[disabled] { background:#f1f5f9; border-color:#aebdcd; color:#526174; opacity:1; }",
    ".tx-section { margin:4px 0; padding:4px 8px 8px; border:1px solid #aebdcd; border-radius:8px; background:#fff; }",
    ".tx-section-title { margin:0 0 4px; padding:0; color:var(--view-brand-dark); font-size:12.5px; font-weight:700; letter-spacing:.01em; line-height:1.6; border-bottom:1px solid var(--view-line); }",
    ".tx-shell .ant-legacy-form-item-label label { color:var(--view-muted); font-size:12px; font-weight:500; }",
    ".tx-link-bar { display:flex; flex-wrap:wrap; gap:16px; align-items:center; margin:4px 0; padding:4px 8px; border:1px solid var(--view-line-strong); border-radius:6px; background:#f8fbff; }",
    ".tx-link-bar a { cursor:pointer; color:var(--view-brand); font-weight:600; }",
    ".tx-lines-head { padding:5px 0; margin-bottom:4px; background:#bfbfbf; color:#262626; font-size:12px; border-radius:4px 4px 0 0; }",
    ".tx-grid { flex:1 1 auto; min-width:0; min-height:0; display:flex; flex-direction:column; border:1px solid #aebdcd; border-radius:8px; overflow:hidden; background:#fff; }",
    ".tx-grid::-webkit-scrollbar { display:none; width:0; height:0; }",
    ".tx-grid .ant-table-wrapper, .tx-grid .ant-spin-nested-loading, .tx-grid .ant-spin-container { flex:1 1 auto; min-width:0; min-height:0; height:100%; display:flex; flex-direction:column; }",
    ".tx-grid .ant-table { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; }",
    ".tx-grid .ant-table-container { flex:1 1 auto; min-height:0; overflow:hidden; display:flex; flex-direction:column; }",
    ".tx-grid .ant-table-content { flex:1 1 auto; min-height:0; overflow:auto; }",
    ".tx-grid .ant-table-thead > tr > th { position:sticky; top:0; z-index:2; }",
    ".tx-grid .ant-table-pagination.ant-pagination { flex:0 0 auto; position:static; z-index:2; margin:0; padding:6px 8px; background:#f8fbff; border:1px solid #9fb1c5; border-radius:0 0 7px 7px; }",
    /* Input standard: search filters (drawer) and transaction detail */
    ".tx-shell .ant-input, .tx-shell .ant-input-number, .tx-shell .ant-picker, .tx-shell .ant-input-affix-wrapper, .tx-shell .ant-select:not(.ant-select-customize-input) .ant-select-selector, .tx-drawer .ant-input, .tx-drawer .ant-input-number, .tx-drawer .ant-picker, .tx-drawer .ant-input-affix-wrapper, .tx-drawer .ant-select:not(.ant-select-customize-input) .ant-select-selector { border-color:#8c9db3; border-radius:4px; }",
    ".tx-shell .ant-input:hover, .tx-shell .ant-input:focus, .tx-shell .ant-input-number:hover, .tx-shell .ant-input-number-focused, .tx-shell .ant-picker:hover, .tx-shell .ant-picker-focused, .tx-shell .ant-select:not(.ant-select-disabled):hover .ant-select-selector, .tx-shell .ant-select-focused .ant-select-selector, .tx-drawer .ant-input:hover, .tx-drawer .ant-input:focus, .tx-drawer .ant-input-number:hover, .tx-drawer .ant-input-number-focused, .tx-drawer .ant-picker:hover, .tx-drawer .ant-picker-focused, .tx-drawer .ant-select:not(.ant-select-disabled):hover .ant-select-selector, .tx-drawer .ant-select-focused .ant-select-selector { border-color:#1890ff; }",
    ".tx-shell .ant-input[disabled], .tx-shell .ant-input-number-disabled, .tx-shell .ant-picker-disabled, .tx-shell .ant-select-disabled .ant-select-selector, .tx-drawer .ant-input[disabled], .tx-drawer .ant-input-number-disabled, .tx-drawer .ant-picker-disabled, .tx-drawer .ant-select-disabled .ant-select-selector { background:#f1f5f9; border-color:#aebdcd; color:#526174; }",
    ".tx-shell .ant-input-number-disabled .ant-input-number-input, .tx-shell .ant-picker-disabled input, .tx-drawer .ant-input-number-disabled .ant-input-number-input, .tx-drawer .ant-picker-disabled input { color:#526174; }",
    /* Checkbox standard: visible border in every checkbox of the view */
    ".tx-shell .ant-checkbox-inner, .tx-drawer .ant-checkbox-inner { border:1px solid #6b7c93; border-radius:3px; }",
    ".tx-shell .ant-checkbox-wrapper:hover .ant-checkbox-inner, .tx-shell .ant-checkbox:hover .ant-checkbox-inner, .tx-drawer .ant-checkbox-wrapper:hover .ant-checkbox-inner { border-color:#1890ff; }",
    ".tx-shell .ant-checkbox-checked .ant-checkbox-inner, .tx-drawer .ant-checkbox-checked .ant-checkbox-inner { background-color:#1890ff; border-color:#1890ff; }",
    ".tx-shell .ant-table { color:#183153; font-size:12px; }",
    ".tx-shell .ant-table-thead > tr > th { padding:4px 6px; line-height:18px; background:#bfbfbf; color:#262626; border-bottom:1px solid #cbd1d8; font-weight:700; white-space:nowrap; }",
    ".tx-shell .ant-table-tbody > tr > td { padding:1px 6px; line-height:16px; white-space:nowrap; border-bottom:1px solid #b8c4d1; }",
    ".tx-grid .ant-table-tbody .ant-btn-link { height:20px; padding:0 4px; line-height:18px; }",
    ".tx-shell .ant-table-tbody > tr:hover > td { background:#b7d7ff; }",
    ".tx-shell .ant-table-pagination { margin:8px; }"
  ].join("\n");

  var TPL_CSS = [
    ".tpl-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0 8px}",
    ".tpl-header-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px 12px}",
    ".tpl-field-label{display:block;font-size:12px;color:#64748b;margin-bottom:2px}",
    ".tpl-mono,.tpl-mono input,.tpl-mono textarea,input.tpl-mono{font-family:monospace}",
    ".tpl-cell-error,.tx-shell .ant-input.tpl-cell-error{border-color:#cf1322 !important;background:#fff1f0}",
    ".tpl-cell-warning,.tx-shell .ant-input.tpl-cell-warning{border-color:#d48806 !important;background:#fffbe6}",
    ".tpl-cell-area.ant-input{padding:3px 7px;line-height:18px;font-size:12px;resize:none;word-break:break-all}",
    ".tpl-extra-error{color:#cf1322 !important}",
    ".tpl-extra-warning{color:#d48806 !important}",
    ".tpl-row-focus td{background:#e6f4ff !important}",
    ".tpl-row-error td:first-child{box-shadow:inset 3px 0 0 #cf1322}",
    ".tpl-row-warning td:first-child{box-shadow:inset 3px 0 0 #d48806}",
    ".tpl-issues{margin:0}",
    ".tpl-issues .ant-alert{padding:6px 10px}",
    ".tpl-issues .ant-table{font-size:12px}",
    ".tpl-issues .ant-table-thead > tr > th{padding:4px 6px;line-height:18px}",
    ".tpl-issues .ant-table-tbody > tr > td{padding:3px 6px;line-height:16px;border-bottom:1px solid #b8c4d1}",
    ".tpl-issue-row{cursor:pointer}",
    ".tpl-detail{white-space:pre;font-family:monospace;font-size:12px;margin:4px 0 0;color:#475569;overflow-x:auto}",
    ".tpl-help{color:var(--view-muted);font-size:12px;margin:4px 0}",
    ".tpl-form-row{display:flex;gap:5px;align-items:flex-start}",
    ".tpl-mode{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0}",
    ".tpl-mode > span:first-child{color:var(--view-muted);font-weight:500;font-size:12px}",
    ".tpl-subtitle{color:var(--view-brand-dark);font-size:12px;font-weight:700;margin:6px 0 4px}",
    ".tpl-grid{border:1px solid #aebdcd;border-radius:8px;overflow:hidden;background:#fff}",
    ".tpl-grid .ant-table-tbody > tr > td{padding:4px 6px}",
    ".tpl-account-actions{display:flex;gap:8px;margin-bottom:8px}",
    ".tpl-account-selector{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px 8px;background:#f5f7fa;border:1px solid #d9e1ea;border-radius:6px}",
    ".tpl-account-selector-label{flex:0 0 auto;color:#4a5a6a;font-size:12px;font-weight:600}",
    ".tpl-account-hint{margin-bottom:8px;color:#4a5a6a;font-size:12px}",
    ".tpl-account-table{border:1px solid #aebdcd;border-radius:6px;overflow:hidden}",
    ".tpl-account-table .ant-table-thead > tr > th{height:30px;padding:0 6px !important;line-height:30px;vertical-align:middle;background:#bfbfbf}",
    ".tpl-account-table .ant-table-tbody > tr{height:30px !important}",
    ".tpl-account-table .ant-table-tbody > tr > td{height:30px !important;padding:0 6px !important;line-height:0 !important;font-size:0;vertical-align:middle;border-bottom:1px solid #b8c4d1}",
    ".tpl-account-table .ant-table-body{padding-top:0 !important}",
    ".tpl-account-table .ant-table-body > table{margin-top:0 !important}",
    ".tpl-account-table .ant-table-tbody:before{display:none !important;content:none !important}",
    ".tpl-account-table .ant-table-tbody > tr > td .ant-input-sm, .tpl-account-table .ant-table-tbody > tr > td .ant-input{display:block;width:100% !important;height:28px !important;min-height:28px;margin:0 !important;padding:1px 7px;line-height:24px;box-sizing:border-box}",
    ".tpl-account-table .ant-table-tbody > tr > td .ant-select{display:block;width:100% !important;height:28px !important;line-height:28px}",
    ".tpl-account-table .ant-table-tbody > tr > td .ant-select-selector{width:100% !important;height:28px !important;line-height:26px !important}",
    ".tpl-account-table .ant-input, .tpl-account-table .ant-select:not(.ant-select-customize-input) .ant-select-selector, .tpl-account-selector .ant-select:not(.ant-select-customize-input) .ant-select-selector{border-color:#8c9db3;border-radius:4px}",
    ".tpl-account-table .ant-input:hover, .tpl-account-table .ant-input:focus, .tpl-account-table .ant-select:not(.ant-select-disabled):hover .ant-select-selector, .tpl-account-table .ant-select-focused .ant-select-selector, .tpl-account-selector .ant-select:not(.ant-select-disabled):hover .ant-select-selector, .tpl-account-selector .ant-select-focused .ant-select-selector{border-color:#1890ff}",
    ".tpl-account-table .ant-table-body{overflow-y:scroll !important;scrollbar-width:auto;scrollbar-gutter:stable}",
    ".tpl-account-table .ant-table-body::-webkit-scrollbar{width:12px;height:12px}",
    ".tpl-account-table .ant-table-body::-webkit-scrollbar-track{background:#f1f1f1}",
    ".tpl-account-table .ant-table-body::-webkit-scrollbar-thumb{background:#9aa7b5;border-radius:6px;border:2px solid #f1f1f1}",
    ".tpl-warn-box{margin:4px 0;padding:6px 10px;border:1px solid #f1d9ab;border-radius:6px;background:#fdf3e3;color:#9a5b12}",
    ".tpl-var-group{margin-bottom:12px}",
    ".tpl-var-name{font-family:monospace;font-weight:600;white-space:nowrap}",
    ".tpl-var-usage{font-family:monospace;font-size:12px;word-break:break-all}"
  ].join("\n");

  var LEVEL_LABEL = { error: "Error", warning: "Advertencia", info: "Aviso" };
  var LEVEL_COLOR = { error: "red", warning: "orange", info: "blue" };
  var HEADER_FIELDS = [
    { key: "cmd", label: "Comando de escaneo", ph: "ExeChain" },
    { key: "chain", label: "Cadena (chain)", ph: "cmdGetAnticipoContext", mono: true },
    { key: "context", label: "Contexto de la cadena", ph: "{id:_id}", mono: true },
    { key: "include", label: "Include de la cadena", ph: "aceptantes", mono: true },
    { key: "code", label: "C\u00f3digo del asiento", ph: "'AnticipoPrima' o _code", mono: true },
    { key: "description", label: "Descripci\u00f3n", ph: "_description", mono: true },
    { key: "status", label: "Estado (1 contabilizado, 0 borrador)", ph: "1" },
    { key: "entity", label: "Entidad (texto literal)", ph: "Transfer" },
    { key: "entityId", label: "Id de la entidad", ph: "_id", mono: true },
    { key: "reference", label: "Referencia", ph: "_reference", mono: true },
    { key: "uniqueKey", label: "Clave \u00fanica (uniqueKey)", ph: "_unique", mono: true },
    { key: "effectiveDate", label: "Fecha efectiva", ph: "'2026-11-30'", mono: true },
    { key: "organizationId", label: "Organizaci\u00f3n", ph: "_sysOrganization.id", mono: true },
    { key: "baseCurrency", label: "Moneda base", ph: "'USD'", mono: true }
  ];
  var FORM_HEADER_KEYS = ["scanCommand", "code", "description", "status", "entity", "entityId", "reference", "uniqueKey", "effectiveDate", "organizationId", "baseCurrency"];
  var LINE_FIELDS = [
    { key: "account", title: "Cuenta", width: 420, ph: "_cuenta o exe(GetTable,...)" },
    { key: "debit", title: "D\u00e9bito", width: 300, ph: "_monto o 0" },
    { key: "credit", title: "Cr\u00e9dito", width: 300, ph: "_monto o 0" },
    { key: "comments", title: "Comentario", width: 380, ph: "'Texto ' + _dato" },
    { key: "condition", title: "Condici\u00f3n", width: 320, ph: "_monto != 0" },
    { key: "map", title: "Map (lista)", width: 170, ph: "_aceptantes" },
    { key: "order", title: "Orden", width: 140, ph: "_lineNumber" }
  ];

  var cellText = function (v) {
    if (v === undefined || v === null) return "";
    if (typeof v === "object") return null;
    return String(v);
  };
  //issues grouped by grid cell ("L<index>:<key>", "L<index>:" for the whole line) or header field ("H:<key>")
  var issueKey = function (path) {
    if (path[0] === "Lines" && typeof path[1] === "number") return "L" + path[1] + ":" + (path[2] || "");
    if (path[0] === "scanCommand") return "H:" + (path[2] || (path[1] === "cmd" ? "cmd" : "chain"));
    return "H:" + (path[0] || "");
  };
  var indexIssues = function (result) {
    var map = {};
    if (!result) return map;
    result.issues.forEach(function (it) {
      var key = issueKey(it.path);
      (map[key] = map[key] || []).push(it);
    });
    return map;
  };
  var statusOf = function (list) {
    if (!list || !list.length) return "";
    if (list.some(function (i) { return i.level === "error"; })) return "error";
    if (list.some(function (i) { return i.level === "warning"; })) return "warning";
    return "";
  };
  var tipOf = function (list) { return list && list.length ? list.map(function (i) { return i.message; }).join(" ") : undefined; };
  var countLevel = function (result, level) { return result ? result.issues.filter(function (i) { return i.level === level; }).length : 0; };
  var plural = function (n, one, many) { return n + " " + (n === 1 ? one : many); };

  //text cell that keeps its own draft and commits on blur or Enter, so typing spaces or partial formulas is not reformatted
  var CellInput = function (props) {
    var s1 = useState(props.value), draft = s1[0], setDraft = s1[1];
    useEffect(function () { setDraft(props.value); }, [props.value]);
    if (props.value === null) {
      return (
        <Tooltip title={"Valor con estructura: editalo en modo avanzado."}>
          <Input size="small" value={"(estructura)"} disabled />
        </Tooltip>
      );
    }
    var commit = function () { if (draft !== props.value) props.onCommit(draft); };
    var cls = (props.mono ? "tpl-mono" : "") + (props.status ? " tpl-cell-" + props.status : "");
    //grid cells grow downwards for long formulas; Enter commits instead of adding a line break (formulas are one line)
    var input = props.multiline ? (
      <Input.TextArea className={cls + " tpl-cell-area"} value={draft} placeholder={props.placeholder} autoSize={{ minRows: 1, maxRows: 6 }} onChange={function (e) { setDraft(e.target.value.replace(/[\r\n]+/g, " ")); }} onBlur={commit} onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); commit(); } }} />
    ) : (
      <Input size="small" className={cls} value={draft} placeholder={props.placeholder} onChange={function (e) { setDraft(e.target.value); }} onBlur={commit} onPressEnter={commit} />
    );
    return props.tip ? <Tooltip title={props.tip}>{input}</Tooltip> : input;
  };

  var HeaderForm = function (props) {
    var model = props.model;
    var extras = Object.keys(model.header).filter(function (k) { return FORM_HEADER_KEYS.indexOf(k) < 0; });
    return (
      <div className="tx-section">
        <h3 className="tx-section-title">{"Cabecera del asiento"}</h3>
        <div className="tpl-header-grid">
          {HEADER_FIELDS.map(function (f) {
            var list = props.issues["H:" + f.key];
            return (
              <div key={f.key}>
                <span className="tpl-field-label">{f.label}</span>
                <CellInput value={cellText(TPL.headerValue(model, f.key))} placeholder={f.ph} mono={f.mono} status={statusOf(list)} tip={tipOf(list)} onCommit={function (v) { props.onChange(TPL.setHeaderValue(model, f.key, v)); }} />
              </div>
            );
          })}
        </div>
        {extras.length ? (
          <div className="tpl-help">
            {"Otras claves de la cabecera (se conservan; editalas en modo avanzado): "}
            {extras.map(function (k) {
              var list = props.issues["H:" + k];
              return (
                <Tooltip key={k} title={tipOf(list) || "Se guarda tal cual."}>
                  <Tag color={statusOf(list) === "error" ? "red" : statusOf(list) === "warning" ? "orange" : undefined}>{k}</Tag>
                </Tooltip>
              );
            })}
          </div>
        ) : null}
        <div className="tpl-help">{"Texto fijo entre comillas simples ('AnticipoPrima'); datos de la fila con guion bajo (_monto). Mir\u00e1 el cat\u00e1logo de variables para ver cu\u00e1les existen."}</div>
      </div>
    );
  };

  var LinesGrid = function (props) {
    var model = props.model;
    var s1 = useState(null), extraEdit = s1[0], setExtraEdit = s1[1];
    //section shown in the grid: index of TPL.sectionBlocks, "all", or null = first section (the model can arrive after
    //the grid mounts, so the default is resolved on every render instead of once)
    var s2 = useState(null), blockSel = s2[0], setBlockSel = s2[1];
    var blocks = TPL.sectionBlocks(model);
    var shownIndex = blockSel === null ? 0 : blockSel;
    var shown = shownIndex !== "all" && blocks[shownIndex] ? blocks[shownIndex] : null;
    var firstShown = shown ? shown.start : 0, lastShown = shown ? shown.end : model.lines.length - 1;
    //an issue picked in a hidden line opens the section that holds it
    useEffect(function () {
      var row = props.focusRow;
      if (row === null || row === undefined || !shown || (row >= shown.start && row <= shown.end)) return;
      var holder = -1;
      blocks.forEach(function (b, k) { if (row >= b.start && row <= b.end) holder = k; });
      setBlockSel(holder >= 0 ? holder : "all");
    }, [props.focusRow]);
    var change = function (next) { props.onChange(next); };
    var openExtra = function (index) {
      setExtraEdit({ index: index, text: TPL.extraText(model.lines[index].values), error: null });
    };
    var saveExtra = function () {
      var res = TPL.setLineExtra(model, extraEdit.index, extraEdit.text);
      if (!res.ok) {
        setExtraEdit(Object.assign({}, extraEdit, { error: res.error }));
        return;
      }
      change(res.model);
      setExtraEdit(null);
    };
    var columns = [
      {
        title: "#", key: "n", width: 48, fixed: "left",
        render: function (v, row) {
          var list = props.issues["L" + row.index + ":"];
          return <Tooltip title={tipOf(list)}><span>{row.index + 1}</span></Tooltip>;
        }
      },
      {
        title: "Secci\u00f3n", key: "section", width: 220,
        render: function (v, row) {
          return <CellInput value={TPL.sectionText(row.line.section)} placeholder={"Comentario de grupo"} onCommit={function (text) { change(TPL.setSection(model, row.index, text)); }} />;
        }
      }
    ].concat(LINE_FIELDS.map(function (f) {
      return {
        title: f.title, key: f.key, width: f.width,
        render: function (v, row) {
          var list = props.issues["L" + row.index + ":" + f.key];
          return <CellInput mono multiline value={cellText(row.line.values[f.key])} placeholder={f.ph} status={statusOf(list)} tip={tipOf(list)} onCommit={function (text) { change(TPL.setLineValue(model, row.index, f.key, text)); }} />;
        }
      };
    })).concat([
      {
        title: "Otras claves", key: "extra", width: 130,
        render: function (v, row) {
          var keys = TPL.extraKeys(row.line.values);
          var list = [];
          keys.forEach(function (k) { list = list.concat(props.issues["L" + row.index + ":" + k] || []); });
          var st = statusOf(list);
          return (
            <Tooltip title={tipOf(list) || (keys.length ? keys.join(", ") : "aux, costCenters, Amounts, moneda extranjera")}>
              <Button size="small" type="link" className={st ? "tpl-extra-" + st : ""} onClick={function () { openExtra(row.index); }}>
                {keys.length ? plural(keys.length, "clave", "claves") : "Agregar"}
              </Button>
            </Tooltip>
          );
        }
      },
      {
        title: "Acciones", key: "actions", width: 230, fixed: "right",
        render: function (v, row) {
          var i = row.index;
          return (
            <span style={{ whiteSpace: "nowrap" }}>
              <Button size="small" type="link" disabled={i === firstShown} onClick={function () { change(TPL.moveLine(model, i, -1)); }}>{"Subir"}</Button>
              <Button size="small" type="link" disabled={i === lastShown} onClick={function () { change(TPL.moveLine(model, i, 1)); }}>{"Bajar"}</Button>
              <Button size="small" type="link" onClick={function () { change(TPL.duplicateLine(model, i)); }}>{"Duplicar"}</Button>
              <Popconfirm title={"\u00bfEliminar la l\u00ednea " + (i + 1) + "?"} onConfirm={function () { change(TPL.removeLine(model, i)); }}>
                <Button size="small" type="link" danger>{"Eliminar"}</Button>
              </Popconfirm>
            </span>
          );
        }
      }
    ]);
    var data = model.lines.map(function (line, index) { return { key: index, index: index, line: line }; }).filter(function (row) {
      return !shown || (row.index >= shown.start && row.index <= shown.end);
    });
    var rowClass = function (row) {
      var all = [];
      Object.keys(props.issues).forEach(function (k) { if (k.indexOf("L" + row.index + ":") === 0) all = all.concat(props.issues[k]); });
      var st = statusOf(all);
      return (props.focusRow === row.index ? "tpl-row-focus " : "") + (st ? "tpl-row-" + st : "");
    };
    return (
      <div className="tx-section">
        <h3 className="tx-section-title">{"L\u00edneas del asiento"}</h3>
        {blocks.length ? (
          <div className="tpl-toolbar">
            <span>{"Secci\u00f3n:"}</span>
            <Select size="small" style={{ minWidth: 260 }} value={shown ? shownIndex : "all"} onChange={function (v) { setBlockSel(v); }}>
              {blocks.map(function (b, k) { return <Select.Option key={k} value={k}>{b.name + " (" + plural(b.end - b.start + 1, "l\u00ednea", "l\u00edneas") + ")"}</Select.Option>; })}
              <Select.Option key="all" value="all">{"Todas las l\u00edneas (" + model.lines.length + ")"}</Select.Option>
            </Select>
            <span className="tpl-help">{"Mostrando " + data.length + " de " + model.lines.length + " l\u00edneas."}</span>
          </div>
        ) : null}
        <div className="tpl-grid">
          <Table size="small" columns={columns} dataSource={data} pagination={false} scroll={{ x: 2700 }} rowClassName={rowClass} />
        </div>
        <Button className="tx-action" style={{ marginTop: 8 }} icon={<Ico type="file" />} onClick={function () { change(TPL.addLine(model, shown ? shown.end : undefined)); }}>{shown ? "Agregar l\u00ednea en " + shown.name : "Agregar l\u00ednea"}</Button>
        <div className="tpl-help">{"D\u00e9bito y cr\u00e9dito aceptan un n\u00famero o una f\u00f3rmula; si tiene dos puntos con espacio, el YAML la pone entre comillas solo. Orden suele ser _lineNumber."}</div>
        <Modal
          visible={!!extraEdit}
          title={extraEdit ? "Otras claves de la l\u00ednea " + (extraEdit.index + 1) : ""}
          okText={"Aplicar"}
          cancelText={"Cancelar"}
          onOk={saveExtra}
          onCancel={function () { setExtraEdit(null); }}
          width={640}
        >
          {extraEdit ? (
            <div>
              <div className="tpl-help">{"Formato YAML clave: valor. Sirve para aux, costCenters, Amounts, auxId, mapCondition, xCurrency / xDebit / xCredit y auxArray. Las columnas de la grilla no van ac\u00e1."}</div>
              <Input.TextArea className="tpl-mono" autoSize={{ minRows: 6, maxRows: 18 }} value={extraEdit.text} onChange={function (e) { setExtraEdit(Object.assign({}, extraEdit, { text: e.target.value, error: null })); }} />
              {extraEdit.error ? <Alert style={{ marginTop: 8 }} type="error" showIcon message={extraEdit.error.reason} description={<div className="tpl-detail">{extraEdit.error.message}</div>} /> : null}
            </div>
          ) : null}
        </Modal>
      </div>
    );
  };

  var IssuesPanel = function (props) {
    var result = props.result;
    if (!result) return null;
    var errs = countLevel(result, "error"), warns = countLevel(result, "warning"), infos = countLevel(result, "info");
    var summary = errs ? plural(errs, "error", "errores") : warns ? "Sin errores" : "La plantilla no tiene errores ni advertencias";
    if (errs || warns) summary += (warns ? ", " + plural(warns, "advertencia", "advertencias") : "");
    if (infos) summary += ", " + plural(infos, "aviso", "avisos");
    var type = errs ? "error" : warns ? "warning" : "success";
    var where = function (it) {
      if (props.mode === "basic" && !result.syntax) {
        if (it.path[0] === "Lines" && typeof it.path[1] === "number") return "Fila " + (it.path[1] + 1) + (it.field && it.field !== "Lines" ? " \u00b7 " + it.field : "");
        return "Cabecera" + (it.field ? " \u00b7 " + it.field : "");
      }
      return "L\u00ednea " + it.line + (it.column ? ", columna " + it.column : "") + (it.field ? " \u00b7 " + it.field : "");
    };
    var columns = [
      { title: "Nivel", key: "level", width: 110, render: function (v, it) { return <Tag color={LEVEL_COLOR[it.level]}>{LEVEL_LABEL[it.level]}</Tag>; } },
      { title: "Ubicaci\u00f3n", key: "where", width: 190, render: function (v, it) { return where(it); } },
      { title: "Problema", key: "message", render: function (v, it) { return <div>{it.message}{it.detail ? <div className="tpl-detail">{it.detail}</div> : null}</div>; } },
      { title: "C\u00f3mo corregirlo", key: "hint", render: function (v, it) { return it.hint; } }
    ];
    return (
      <div className="tpl-issues">
        <Alert type={type} showIcon message={summary} description={errs || warns || infos ? "Hac\u00e9 clic en un problema para ir a la fila o a la l\u00ednea del YAML." : undefined} closable onClose={props.onClose} />
        {result.issues.length ? (
          <Table
            size="small"
            style={{ marginTop: 8 }}
            columns={columns}
            dataSource={result.issues.map(function (it, i) { return Object.assign({ key: i }, it); })}
            pagination={result.issues.length > 10 ? { pageSize: 10, size: "small" } : false}
            rowClassName={function () { return "tpl-issue-row"; }}
            onRow={function (it) { return { onClick: function () { props.onPick(it); } }; }}
          />
        ) : null}
      </div>
    );
  };

  var copyText = function (text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { message.success("Copiado: " + text); }, function () { message.info(text); });
        return;
      }
    } catch (e) {
      //clipboard not available: show the text instead
    }
    message.info(text);
  };
  var VariablesDrawer = function (props) {
    var s1 = useState(""), filter = s1[0], setFilter = s1[1];
    var s2 = useState(props.chain || ""), chain = s2[0], setChain = s2[1];
    useEffect(function () { if (props.visible) setChain(props.chain || ""); }, [props.visible, props.chain]);
    var needle = filter.trim().toLowerCase();
    var match = function (v) { return !needle || (v.name + " " + v.description + " " + v.purpose + " " + v.usage).toLowerCase().indexOf(needle) >= 0; };
    var chainNames = Object.keys(TPL.CATALOG.chains);
    var options = chainNames.indexOf(chain) < 0 && chain ? [chain].concat(chainNames) : chainNames;
    var columns = [
      { title: "Variable", key: "name", width: 170, render: function (v, it) { return <a className="tpl-var-name" onClick={function () { copyText(it.name); }}>{it.name}</a>; } },
      { title: "Descripci\u00f3n", dataIndex: "description", key: "description" },
      { title: "Prop\u00f3sito", dataIndex: "purpose", key: "purpose" },
      { title: "Uso", key: "usage", render: function (v, it) { return <span className="tpl-var-usage">{it.usage}</span>; } }
    ];
    var used = props.result ? props.result.variables : [];
    var usedLabel = function (v) {
      if (v.known === true) return { color: "green", text: v.source === "chain" ? "De la cadena" : v.source === "engine" ? "Del motor" : "De sesi\u00f3n" };
      if (v.known === false) return { color: "red", text: "La cadena no la devuelve" };
      return { color: "default", text: "Sin verificar" };
    };
    return (
      <Drawer className="tx-drawer" title={"Cat\u00e1logo de variables"} width={760} visible={props.visible} onClose={props.onClose}>
        <div className="tpl-help">{"Las variables empiezan con guion bajo: el motor cambia cada _ por context. y lee ese dato de la fila que devuelve la cadena del scanCommand. Hac\u00e9 clic en un nombre para copiarlo."}</div>
        <div className="tpl-toolbar">
          <Input.Search allowClear placeholder={"Buscar variable"} style={{ width: 260 }} value={filter} onChange={function (e) { setFilter(e.target.value); }} />
          <Select style={{ width: 300 }} value={chain || undefined} placeholder={"Cadena"} onChange={function (v) { setChain(v); }}>
            {options.map(function (c) { return <Select.Option key={c} value={c}>{c}</Select.Option>; })}
          </Select>
        </div>
        {used.length ? (
          <div className="tpl-var-group">
            <h3 className="tx-section-title">{"Usadas en esta plantilla"}</h3>
            {used.map(function (v) {
              var lb = usedLabel(v);
              return <Tooltip key={v.name} title={lb.text}><Tag color={lb.color}>{"_" + v.name}</Tag></Tooltip>;
            })}
          </div>
        ) : null}
        {TPL.catalogGroups(chain).map(function (g) {
          var items = g.items.filter(match);
          return (
            <div key={g.key} className="tpl-var-group">
              <h3 className="tx-section-title">{g.title}</h3>
              {g.key === "chain" && g.info ? <div className="tpl-help">{"Plantilla: " + g.info.template + " \u00b7 " + g.info.trigger}</div> : null}
              {g.key === "chain" && !g.info ? <Alert type="info" showIcon message={chain ? "La cadena " + chain + " no est\u00e1 en el cat\u00e1logo: sus campos no se pueden verificar." : "La plantilla no tiene cadena en el scanCommand."} /> : null}
              {items.length ? <Table size="small" columns={columns} dataSource={items.map(function (it) { return Object.assign({ key: it.name }, it); })} pagination={false} /> : null}
            </div>
          );
        })}
      </Drawer>
    );
  };

  /* ---------- Accounting/TransactionTemplate (pestana "Plantilla de transacciones") ---------- */
  var TransactionTemplate = function (props) {
    var s1 = useState(false), loading = s1[0], setLoading = s1[1];
    var s2 = useState("ADD"), mode = s2[0], setMode = s2[1];
    var s3 = useState(false), executing = s3[0], setExecuting = s3[1];
    var s4 = useState("basic"), editorMode = s4[0], setEditorMode = s4[1];
    var s5 = useState(TPL.emptyModel()), model = s5[0], setModel = s5[1];
    var s6 = useState(false), basicDirty = s6[0], setBasicDirty = s6[1];
    var s7 = useState(null), result = s7[0], setResult = s7[1];
    var s8 = useState(false), showIssues = s8[0], setShowIssues = s8[1];
    var s9 = useState(false), varsOpen = s9[0], setVarsOpen = s9[1];
    var s10 = useState(null), focusRow = s10[0], setFocusRow = s10[1];
    var s11 = useState(false), checking = s11[0], setChecking = s11[1];
    var s12 = useState(0), editTick = s12[0], setEditTick = s12[1];
    var s13 = useState(false), issuesModalOpen = s13[0], setIssuesModalOpen = s13[1];
    var s14 = useState(false), accountsModalOpen = s14[0], setAccountsModalOpen = s14[1];
    var s15 = useState(false), accountsLoading = s15[0], setAccountsLoading = s15[1];
    var s16 = useState(false), accountsSaving = s16[0], setAccountsSaving = s16[1];
    var s17 = useState(null), accountsTable = s17[0], setAccountsTable = s17[1];
    var s18 = useState(null), accountsTableId = s18[0], setAccountsTableId = s18[1];
    var s19 = useState(null), selectedTransactionKey = s19[0], setSelectedTransactionKey = s19[1];
    var savedConfig = useRef(null);
    var checkCtx = useRef({ accounts: {}, auxTypes: null, costCenters: null });

    var editor = function () { return window.global.templateBehaviour; };
    var currentText = function () { return editorMode === "basic" && basicDirty ? TPL.toYaml(model) : editor().getValue(); };

    useEffect(function () {
      if (props.value) {
        props.form.setFieldsValue(props.value);
        var config = props.value.config ? props.value.config : "";
        editor().setValue(config);
        savedConfig.current = config;
        var opened = TPL.toModel(config);
        setModel(opened.ok ? opened.model : TPL.emptyModel());
        setEditorMode(opened.ok ? "basic" : "advanced");
        setBasicDirty(false);
        setResult(TPL.validate(config, checkCtx.current));
        setShowIssues(!!config.trim());
        setMode("UPDATE");
      } else {
        props.form.resetFields();
        editor().setValue("");
        savedConfig.current = null;
        setModel(TPL.emptyModel());
        setEditorMode("basic");
        setBasicDirty(true);
        setResult(null);
        setShowIssues(false);
        setMode("ADD");
      }
      setFocusRow(null);
    }, [props.value]);

    //live checks while editing (without the slower catalog lookups, which run on Validate, Save and Execute Now)
    useEffect(function () {
      if (!showIssues) return;
      var timer = setTimeout(function () { setResult(TPL.validate(currentText(), checkCtx.current)); }, 300);
      return function () { clearTimeout(timer); };
    }, [model, editTick, editorMode, showIssues]);

    var onBasicChange = function (next) {
      setModel(next);
      setBasicDirty(true);
    };
    var openIssues = function () {
      if (result) {
        setIssuesModalOpen(true);
        return;
      }
      runChecks().then(function () { setIssuesModalOpen(true); });
    };
    //writes the basic-mode changes into the YAML editor; comments that are not right before a line are lost
    var syncFromBasic = function (then) {
      if (editorMode !== "basic" || !basicDirty) {
        then();
        return;
      }
      var apply = function () {
        editor().setValue(TPL.toYaml(model));
        setBasicDirty(false);
        then();
      };
      if (model.stray > 0) {
        Modal.confirm({
          title: "Se van a perder " + plural(model.stray, "comentario", "comentarios") + " del YAML",
          content: "El YAML se genera desde la grilla y solo conserva los comentarios que est\u00e1n justo antes de una l\u00ednea (la columna Secci\u00f3n). \u00bfContinuar?",
          okText: "Continuar",
          cancelText: "Cancelar",
          onOk: apply
        });
        return;
      }
      apply();
    };
    var switchMode = function (target) {
      if (target === editorMode) return;
      if (target === "advanced") {
        syncFromBasic(function () { setEditorMode("advanced"); });
        return;
      }
      var text = editor().getValue();
      var res = TPL.toModel(text);
      if (!res.ok) {
        setResult(TPL.validate(text, checkCtx.current));
        setShowIssues(true);
        notification.error({ message: "No se puede abrir en modo b\u00e1sico", description: res.error.reason + " (l\u00ednea " + res.error.line + "). Corregilo en el YAML." });
        return;
      }
      setModel(res.model);
      setBasicDirty(false);
      setEditorMode("basic");
    };

    //catalog lookups for the checks: fixed accounts, auxiliary types and cost centers
    var loadContext = function (text, first) {
      var ctx = checkCtx.current, jobs = [];
      var pending = (first.accounts || []).filter(function (c) { return !(c in ctx.accounts); });
      if (pending.length) {
        var filter = "code IN (" + pending.map(function (c) { return "'" + c + "'"; }).join(",") + ")";
        jobs.push(exe("RepoCatalogAccount", { operation: "GET", filter: filter, size: pending.length }).then(function (r) {
          if (!r || !r.ok) return;
          var found = {};
          (r.outData || []).forEach(function (a) { found[a.code] = a; });
          pending.forEach(function (c) {
            var a = found[c];
            ctx.accounts[c] = a ? { exists: true, isDetail: a.isDetail === undefined ? undefined : !!a.isDetail } : { exists: false };
          });
        }));
      }
      if (ctx.auxTypes === null && /\baux:/.test(text)) {
        jobs.push(exe("RepoCatalogAuxType", { operation: "GET" }).then(function (r) {
          if (r && r.ok) ctx.auxTypes = (r.outData || []).map(function (x) { return String(x.code); });
        }));
      }
      if (ctx.costCenters === null && /\bcostCenters:/.test(text)) {
        jobs.push(exe("RepoCostCenterCatalog", { operation: "GET" }).then(function (r) {
          if (r && r.ok) ctx.costCenters = (r.outData || []).map(function (x) { return String(x.code); });
        }));
      }
      return Promise.all(jobs).then(function () { return ctx; }, function () { return ctx; });
    };
    var runChecks = function () {
      var text = currentText();
      var first = TPL.validate(text, checkCtx.current);
      setChecking(true);
      return loadContext(text, first).then(function (ctx) {
        var res = TPL.validate(text, ctx);
        setChecking(false);
        setResult(res);
        setShowIssues(true);
        return res;
      });
    };
    //errors block the action, warnings ask for confirmation
    var guard = function (verb, then) {
      runChecks().then(function (res) {
        var errs = countLevel(res, "error"), warns = countLevel(res, "warning");
        if (errs) {
          notification.error({ message: "La plantilla tiene " + plural(errs, "error", "errores"), description: "Corregilos antes de " + verb + ". Est\u00e1n en la lista de problemas, con su fila o l\u00ednea." });
          return;
        }
        if (warns) {
          Modal.confirm({
            title: "La plantilla tiene " + plural(warns, "advertencia", "advertencias"),
            content: "Revisalas en la lista de problemas. \u00bfQuer\u00e9s " + verb + " de todos modos?",
            okText: "S\u00ed, " + verb,
            cancelText: "Revisar",
            onOk: then
          });
          return;
        }
        then();
      });
    };
    var onValidate = function () {
      runChecks().then(function (res) {
        if (res.ok && !countLevel(res, "warning")) message.success("La plantilla no tiene errores ni advertencias.");
      });
    };
    var onPickIssue = function (it) {
      if (editorMode === "basic" && !(result && result.syntax)) {
        setFocusRow(it.path[0] === "Lines" && typeof it.path[1] === "number" ? it.path[1] : null);
        return;
      }
      var go = function () { setTimeout(function () { editor().goToLine(it.line, it.column); }, 50); };
      if (editorMode === "basic") {
        setEditorMode("advanced");
        go();
        return;
      }
      go();
    };

    var onSave = function () {
      props.form.validateFields(function (err, values) {
        if (err) return;
        values.config = window.global.templateBehaviour.getValue();
        //yaml validation: `yaml` del scope es js-yaml 3.13.1, el mismo modulo que importa la nativa
        try {
          var result = yaml.safeLoad(values.config);
          values.jConfig = JSON.stringify(result);
        } catch (error) {
          notification["error"]({
            message: error.reason,
            description: error.message
          });
          return;
        }
        //Activo sin tocar en un alta llega undefined (la nativa no lo manda); se manda false, lo que muestra el switch
        if (values.active === undefined) values.active = false;
        setLoading(true);

        exe("RepoTransactionTemplate", { operation: mode, entity: values }).then(function (r) {
          setLoading(false);
          if (r.ok) {
            message.success(r.msg);
            savedConfig.current = values.config;
            if (mode == "ADD") {
              props.onAdd(values);
              setMode("UPDATE");
            } else {
              props.onUpdate(values);
            }
          } else {
            message.error(r.msg);
          }
        });
      });
    };
    var onSaveClick = function () {
      props.form.validateFields(function (err) {
        if (err) return;
        syncFromBasic(function () { guard("guardar", onSave); });
      });
    };
    var onExecute = function () {
      props.form.validateFields(function (err, values) {
        if (err) return;
        setExecuting(true);
        exe("ExeTransactionTemplate", { code: values.code }).then(function (r) {
          setExecuting(false);
          if (r.ok) {
            message.success(r.msg);
          } else {
            message.error(r.msg);
          }
        });
      });
    };
    //Execute Now runs the saved template and writes real entries: check it and say so before running
    var onExecuteClick = function () {
      props.form.validateFields(function (err) {
        if (err) return;
        var unsaved = basicDirty || editor().getValue() !== savedConfig.current;
        guard("ejecutar", function () {
          Modal.confirm({
            title: "\u00bfEjecutar la plantilla ahora?",
            content: (unsaved ? "Hay cambios sin guardar: se ejecuta la versi\u00f3n guardada, no la que ves en pantalla. " : "") + "Ejecutar ahora genera asientos reales y no tiene modo de prueba.",
            okText: "Ejecutar",
            cancelText: "Cancelar",
            onOk: onExecute
          });
        });
      });
    };
    var field = props.form.getFieldDecorator;
    var issues = showIssues && editorMode === "basic" ? indexIssues(result) : {};
    var issueCount = result && result.issues ? result.issues.length : 0;
    var liveEditor = window.global && window.global.templateBehaviour;
    var chain = TPL.headerValue(editorMode === "basic" || !liveEditor ? model : (TPL.toModel(liveEditor.getValue()).model || model), "chain");
    var accountTableByChain = {
      cmdEmisionIncendioContext: "CuentasEmisionGeneral",
      cmdGetPremiumContext: "CuentasCobroPrimasxLob",
      cmdIngresoVarioCajaDTO: "CuentaCajaIngresoVario",
      // PagoReclamo is configured in the YAML through the PagoReclamo row
      // of the general accounts table.
      cmdContabilizacionPagoReclamoDTO: "CuentasEmisionGeneral",
      cmdGetReserveContext: "CuentasReservaReclamo",
      // PagoTesoreria (MSN-000285): one row per accounting line of each payment type.
      cmdContabilizaPagoTesoreriaDTO: "cfgTransaccionesTesoreria"
    };
    var accountTableName = accountTableByChain[chain] || null;
    var tableVariables = chain && TPL.CATALOG.chains[chain] && TPL.CATALOG.chains[chain].tableVariables ? TPL.CATALOG.chains[chain].tableVariables : null;
    var cellText = function (value) { return value === undefined || value === null ? "" : String(value).trim(); };
    var tableVariableErrors = function (table) {
      if (!tableVariables || !table || !table.length) return [];
      var headers = table[0].map(cellText);
      var fixedAmount = /^-?\d+(\.\d+)?$/;
      var errors = [];
      table.slice(1).forEach(function (row, i) {
        var label = "Fila " + (i + 1) + (cellText(row[0]) ? " (" + cellText(row[0]) + ")" : "");
        tableVariables.amountColumns.forEach(function (column) {
          var value = cellText(row[headers.indexOf(column)]);
          if (headers.indexOf(column) >= 0 && value && !fixedAmount.test(value) && tableVariables.amounts.indexOf(value) < 0)
            errors.push(label + ", " + column + ": \"" + value + "\" no es " + tableVariables.amounts.join(" ni ") + " ni un monto fijo");
        });
        tableVariables.textColumns.forEach(function (column) {
          if (headers.indexOf(column) < 0) return;
          (cellText(row[headers.indexOf(column)]).match(/\{(\w+)\}/g) || []).forEach(function (mark) {
            var name = mark.slice(1, -1);
            if (tableVariables.text.indexOf(name) < 0) errors.push(label + ", " + column + ": {" + name + "} no es una variable de la plantilla");
          });
        });
      });
      return errors;
    };
    var loadAccountsTable = function () {
      if (!accountTableName) return;
      setAccountsLoading(true);
      Promise.all([
        exe("GetFullTable", { table: accountTableName }),
        exe("DoQuery", { sql: "SELECT id FROM [Table] WHERE name='" + accountTableName + "'" })
      ]).then(function (responses) {
        var tableResult = responses[0], idResult = responses[1];
        var rows = tableResult && tableResult.ok && Array.isArray(tableResult.outData) ? tableResult.outData : null;
        var idRows = idResult && idResult.ok && Array.isArray(idResult.outData) ? idResult.outData : [];
        var tableId = idRows.length ? (idRows[0].id === undefined ? idRows[0].Id : idRows[0].id) : null;
        if (!rows || !rows.length || tableId === null || tableId === undefined) {
          message.error(t("The account table could not be loaded"));
          return;
        }
        setAccountsTable(rows.map(function (row) { return Array.isArray(row) ? row.slice() : []; }));
        setAccountsTableId(tableId);
        setSelectedTransactionKey(null);
        setAccountsModalOpen(true);
      }).catch(function () {
        message.error(t("The account table could not be loaded"));
      }).then(function () { setAccountsLoading(false); });
    };
    var updateAccountCell = function (rowIndex, columnIndex, value) {
      setAccountsTable(function (current) {
        if (!current) return current;
        var next = current.map(function (row) { return row.slice(); });
        if (!next[rowIndex]) next[rowIndex] = [];
        next[rowIndex][columnIndex] = value;
        return next;
      });
    };
    var accountHeaders = accountsTable && accountsTable.length ? accountsTable[0] : [];
    var accountHeaderIndex = function (name) {
      var expected = String(name).trim().toLowerCase();
      for (var i = 0; i < accountHeaders.length; i++) {
        if (cellText(accountHeaders[i]).toLowerCase() === expected) return i;
      }
      return -1;
    };
    var transactionIdIndex = accountHeaderIndex("IdTransaccion");
    var transactionNameIndex = accountHeaderIndex("NombreTransaccion");
    var transactionKeyForRow = function (row) {
      var id = transactionIdIndex >= 0 ? cellText(row[transactionIdIndex]) : "";
      var name = transactionNameIndex >= 0 ? cellText(row[transactionNameIndex]) : "";
      return id + "::" + name;
    };
    var transactionOptions = [];
    if (accountsTable && accountsTable.length) {
      accountsTable.slice(1).forEach(function (row) {
        var key = transactionKeyForRow(row);
        if (transactionOptions.some(function (item) { return item.value === key; })) return;
        var id = transactionIdIndex >= 0 ? cellText(row[transactionIdIndex]) : "";
        var name = transactionNameIndex >= 0 ? cellText(row[transactionNameIndex]) : "";
        transactionOptions.push({ value: key, label: name || (id ? "Transacción " + id : "Transacción") , search: (id + " " + name).toLowerCase() });
      });
    }
    useEffect(function () {
      var exists = transactionOptions.some(function (item) { return item.value === selectedTransactionKey; });
      if (!exists && selectedTransactionKey !== null) setSelectedTransactionKey(null);
    }, [accountsTable]);
    var addAccountRow = function () {
      if (!selectedTransactionKey) {
        message.warning("Seleccioná una transacción antes de agregar una línea");
        return;
      }
      setAccountsTable(function (current) {
        if (!current || !current.length) return current;
        var headers = current[0];
        var idIndex = headers.map(cellText).map(function (value) { return value.toLowerCase(); }).indexOf("idtransaccion");
        var nameIndex = headers.map(cellText).map(function (value) { return value.toLowerCase(); }).indexOf("nombretransaccion");
        var source = current.slice(1).filter(function (row) { return transactionKeyForRow(row) === selectedTransactionKey; })[0];
        if (!source) return current;
        var newRow = headers.map(function () { return ""; });
        if (idIndex >= 0) newRow[idIndex] = source[idIndex];
        if (nameIndex >= 0) newRow[nameIndex] = source[nameIndex];
        var lastIndex = -1;
        current.slice(1).forEach(function (row, index) {
          if (transactionKeyForRow(row) === selectedTransactionKey) lastIndex = index + 1;
        });
        return current.slice(0, lastIndex + 1).concat([newRow], current.slice(lastIndex + 1));
      });
    };
    var deleteAccountRow = function (rowIndex) {
      setAccountsTable(function (current) {
        if (!current || rowIndex < 1 || rowIndex >= current.length) return current;
        return current.slice(0, rowIndex).concat(current.slice(rowIndex + 1));
      });
    };
    var saveAccountsTable = function () {
      if (!accountsTable || accountsTableId === null || accountsTableId === undefined || !accountTableName) return;
      var variableErrors = tableVariableErrors(accountsTable);
      if (variableErrors.length) {
        Modal.error({
          title: "La tabla no se guard\u00f3: revis\u00e1 las variables",
          width: 640,
          content: <div>{variableErrors.slice(0, 15).map(function (e, i) { return <div key={i}>{e}</div>; })}{variableErrors.length > 15 ? <div>{"... y " + (variableErrors.length - 15) + " m\u00e1s"}</div> : null}</div>
        });
        return;
      }
      setAccountsSaving(true);
      exe("AddOrUpdateTable", { id: accountsTableId, name: accountTableName, data: JSON.stringify(accountsTable) }).then(function (r) {
        if (r && r.ok) message.success(t("Account table saved successfully"));
        else message.error(r && r.msg ? r.msg : t("The account table could not be saved"));
      }).catch(function () {
        message.error(t("The account table could not be saved"));
      }).then(function () { setAccountsSaving(false); });
    };
    var accountColumns = accountsTable && accountsTable.length ? accountsTable[0].map(function (header, columnIndex) {
      if (columnIndex === transactionIdIndex || columnIndex === transactionNameIndex) return null;
      var headerKey = cellText(header).toLowerCase();
      var columnWidth = headerKey === "linea" ? 70
        : headerKey === "variabledebito" || headerKey === "variablecredito" ? 150
          : headerKey === "cuentacontable" ? 220
            : headerKey === "descripcion" ? 360
              : 150;
      return {
        title: String(header === undefined || header === null ? "" : header),
        key: "account-column-" + columnIndex,
        dataIndex: "c" + columnIndex,
        width: columnWidth,
        render: function (value, record) {
          var text = value === undefined || value === null ? "" : String(value);
          var setCell = function (v) { updateAccountCell(record.rowIndex, columnIndex, v); };
          if (tableVariables && A.AutoComplete && tableVariables.amountColumns.indexOf(cellText(header)) >= 0) {
            var AmountInput = A.AutoComplete;
            return <AmountInput size="small" style={{ width: 150 }} value={text} onChange={setCell}
              options={tableVariables.amounts.map(function (v) { return { value: v }; })}
              filterOption={function (input, option) { return String(option.value).toLowerCase().indexOf(String(input).toLowerCase()) >= 0; }} />;
          }
          return <Input size="small" value={text} onChange={function (e) { setCell(e.target.value); }} />;
        }
      };
    }).filter(function (item) { return !!item; }) : [];
    var accountRows = accountsTable ? accountsTable.slice(1).map(function (row, rowIndex) {
      var item = { key: "account-row-" + rowIndex, rowIndex: rowIndex + 1 };
      (accountsTable[0] || []).forEach(function (header, columnIndex) { item["c" + columnIndex] = row[columnIndex]; });
      return item;
    }).filter(function (item) {
      var row = accountsTable[item.rowIndex];
      return selectedTransactionKey !== null && transactionKeyForRow(row) === selectedTransactionKey;
    }) : [];
    accountColumns.push({
      title: t("Actions"),
      key: "account-actions",
      width: 90,
      render: function (value, record) {
        return <Button type="link" danger onClick={function () { deleteAccountRow(record.rowIndex); }}>{t("Delete")}</Button>;
      }
    });
    return (
      <div className="tx-pane-list">
        <style>{TPL_CSS}</style>
        <div className="tx-toolbar">
          <Button type="primary" className="tx-action" icon={<Ico type="save" />} onClick={onSaveClick} loading={loading}>
            {t("Save")}
          </Button>
          <Button className="tx-action tx-warning" icon={<Ico type="rocket" />} disabled={mode == "ADD"} onClick={onExecuteClick} loading={executing}>
            {t("Execute Now")}
          </Button>
          <Button className="tx-action" icon={<Ico type="check" />} onClick={onValidate} loading={checking}>
            {"Validar"}
          </Button>
          <Button className="tx-action" icon={<Ico type="file" />} onClick={openIssues} loading={checking}>
            {t("View mismatches")} {"(" + issueCount + ")"}
          </Button>
          {accountTableName ? <Button className="tx-action" icon={<Ico type="file" />} onClick={loadAccountsTable} loading={accountsLoading}>
            {t("View Accounts")}
          </Button> : null}
          <Button className="tx-action" icon={<Ico type="file" />} onClick={function () { setVarsOpen(true); }}>
            {"Variables"}
          </Button>
        </div>
        <div className="tx-pane-scroll">
        <div className="tx-section">
        <div className="tpl-form-row">
          <FormItem label={t("Template Code")}>{field("code", { rules: [{ required: true }] })(<Input disabled={mode == "UPDATE"} />)}</FormItem>
          <FormItem label={t("Template Name")} style={{ marginLeft: 5, flex: 1 }}>
            {field("name", { rules: [{ required: true }] })(<Input />)}
          </FormItem>
          <FormItem label={t("Active")} style={{ marginLeft: 5 }}>
            {field("active", { valuePropName: "checked" })(<Switch />)}
          </FormItem>
        </div>
        <div className="tpl-mode">
          <span>{"Modo de edici\u00f3n:"}</span>
          <Radio.Group value={editorMode} buttonStyle="solid" onChange={function (e) { switchMode(e.target.value); }}>
            <Radio.Button value="basic">{"B\u00e1sico (grilla)"}</Radio.Button>
            <Radio.Button value="advanced">{"Avanzado (YAML)"}</Radio.Button>
          </Radio.Group>
          {editorMode === "basic" && basicDirty && mode == "UPDATE" ? <Tag color="orange">{"Cambios sin pasar al YAML"}</Tag> : null}
        </div>
        </div>

        <Modal
          visible={issuesModalOpen}
          title={t("Mismatches") + " (" + issueCount + ")"}
          footer={null}
          width={1200}
          onCancel={function () { setIssuesModalOpen(false); }}
        >
          {issuesModalOpen ? <IssuesPanel result={result} mode={editorMode} onPick={onPickIssue} onClose={function () { setIssuesModalOpen(false); }} /> : null}
        </Modal>

        <Modal
          visible={accountsModalOpen}
          title={t("Accounts") + " - " + (accountTableName || "")}
          width={1200}
          footer={null}
          onCancel={function () { setAccountsModalOpen(false); }}
        >
          <div className="tpl-account-actions">
            <Button className="tx-action" icon={<Ico type="file" />} onClick={addAccountRow} disabled={!selectedTransactionKey}>
              {"Agregar línea"}
            </Button>
            <Button type="primary" className="tx-action" icon={<Ico type="save" />} onClick={saveAccountsTable} loading={accountsSaving}>
              {t("Save")}
            </Button>
            <Button className="tx-action" onClick={function () { setAccountsModalOpen(false); }}>
              {t("Close")}
            </Button>
          </div>
          <div className="tpl-account-selector">
            <span className="tpl-account-selector-label">{"Transacción"}</span>
            <Select
              showSearch
              allowClear
              value={selectedTransactionKey || undefined}
              placeholder={"Buscar por nombre o ID"}
              style={{ flex: 1, minWidth: 280 }}
              optionFilterProp="label"
              filterOption={function (input, option) { return String(option.props.label || "").toLowerCase().indexOf(String(input || "").toLowerCase()) >= 0; }}
              onChange={function (value) { setSelectedTransactionKey(value || null); }}
            >
              {transactionOptions.map(function (item) {
                return <Select.Option key={item.value} value={item.value} label={item.search}>{item.label}</Select.Option>;
              })}
            </Select>
          </div>
          {tableVariables ? (
            <div className="tpl-account-hint">
              {"D\u00e9bito y cr\u00e9dito: " + tableVariables.amounts.join(", ") + " o un monto fijo (se contabiliza tal cual). Descripci\u00f3n: texto con variables entre llaves: " + tableVariables.text.map(function (v) { return "{" + v + "}"; }).join(" ")}
            </div>
          ) : null}
          <div className="tpl-account-table">
            <Table size="small" bordered tableLayout="fixed" rowKey="key" columns={accountColumns} dataSource={accountRows} pagination={false} scroll={{ x: 1050, y: 520 }} />
          </div>
        </Modal>

        {editorMode === "basic" ? (
          <div>
            {model.stray > 0 ? <div className="tpl-warn-box">{"Esta plantilla tiene " + plural(model.stray, "comentario", "comentarios") + " que no est\u00e1n justo antes de una l\u00ednea. Si cambi\u00e1s algo en modo b\u00e1sico, se pierden al generar el YAML."}</div> : null}
            <HeaderForm model={model} issues={issues} onChange={onBasicChange} />
            <LinesGrid key={props.value ? props.value.code : "new"} model={model} issues={issues} focusRow={focusRow} onChange={onBasicChange} />
          </div>
        ) : null}

        <div className="tx-section" style={{ display: editorMode === "advanced" ? "block" : "none" }}>
          <h3 className="tx-section-title">{t("Behaviour")}</h3>
          <CodeEditorW divId="templateBehaviour" onChange={function () { setEditTick(function (n) { return n + 1; }); }} />
        </div>
        </div>
        <VariablesDrawer visible={varsOpen} chain={chain} result={result} onClose={function () { setVarsOpen(false); }} />
      </div>
    );
  };
  var TransactionTemplateForm = LegacyForm.create()(TransactionTemplate);


  /* ---------- Accounting/TransactionTemplates (pagina y pestana "Lista de plantillas") ---------- */
  var TransactionTemplates = function (props) {
    var s1 = useState(false), loading = s1[0], setLoading = s1[1];
    var s2 = useState([]), templates = s2[0], setTemplates = s2[1];
    var s3 = useState(), selectedTemplate = s3[0], setSelectedTemplate = s3[1];
    var s4 = useState("list"), activeTab = s4[0], setActiveTab = s4[1];

    useEffect(function () { load(); }, []);

    var load = function () {
      setLoading(true);
      exe("RepoTransactionTemplate", { operation: "GET" }).then(function (r) {
        setLoading(false);
        if (r.ok) {
          setTemplates(r.outData);
        } else {
          message.error(r.msg);
        }
      });
    };
    var onOpenTemplate = function (record) {
      setSelectedTemplate(record);
      setActiveTab("template");
      console.log(record, "OPEN");
    };
    var onNew = function () {
      setSelectedTemplate(undefined);
      setActiveTab("template");
    };
    var onAdd = function (record) {
      setTemplates(templates.concat([record]));
    };
    var onUpdate = function (record) {
      setTemplates(templates.map(function (r) { return r.code == record.code ? record : r; }));
    };
    return (
      <div className="tx-shell">
        <style>{TX_CSS}</style>
        <div className="tx-card">
          <div className="tx-head">
            <div className="tx-title"><span className="tx-title-mark" aria-hidden="true" />{t("Transaction Templates")}</div>
          </div>
          <div className="tx-body">
        <Tabs className="tx-tabs" activeKey={activeTab} onChange={function (v) { setActiveTab(v); }}>
          <Tabs.TabPane key="list" tab={t("Template List")}>
            <div className="tx-pane-list">
            <div className="tx-toolbar">
              <Button className="tx-action" icon={<Ico type="file" />} onClick={onNew}>
                {t("New")}
              </Button>
              <Button className="tx-action" icon={<Ico type="reload" />} onClick={load}>
                {t("Reload")}
              </Button>
            </div>
            <div className="tx-grid">
            <Table dataSource={templates} rowKey="code" loading={loading} size="small" tableLayout="fixed">
              <Table.Column title={t("Code")} dataIndex="code" width={220} />
              <Table.Column title={t("Title")} dataIndex="name" />
              <Table.Column title={t("Active")} dataIndex="active" width={90} align="center" render={function (v) { return <Ico legacy type={v ? "check" : "stop"} />; }} />
              <Table.Column
                title={t("Actions")}
                key="actions"
                width={120}
                align="center"
                render={function (v, r) {
                  return (
                    <span>
                      <Button type="link" icon={<Ico type="folder-open" />} onClick={function () { onOpenTemplate(r); }}>
                        {t("Open")}
                      </Button>
                    </span>
                  );
                }}
              />
            </Table>
            </div>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane key="template" tab={t("Transaction Template")}>
            <TransactionTemplateForm value={selectedTemplate} onAdd={onAdd} onUpdate={onUpdate} />
          </Tabs.TabPane>
        </Tabs>
          </div>
        </div>
      </div>
    );
  };

  //test seam: only the local smoke test defines __TPL_TEST__; in the platform scope it does not exist
  if (typeof __TPL_TEST__ !== "undefined") __TPL_TEST__({ TPL: TPL, HeaderForm: HeaderForm, LinesGrid: LinesGrid, IssuesPanel: IssuesPanel, VariablesDrawer: VariablesDrawer, TransactionTemplateForm: TransactionTemplateForm });

  return TransactionTemplates;
})()
