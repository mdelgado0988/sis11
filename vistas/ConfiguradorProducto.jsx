/**
 * @name ConfiguradorProducto
 * @summary Configurador de productos: ramo > productos > coberturas > filas del producto y la cobertura en las tablas
 *          cfgCobtar, cfgCoberturaProductoRea y tarificacionSIS9 del ramo, editables en grilla.
 * @author AIDEN (MSN-000278)
 * @created 2026-11-26
 * @version 1.0.0
 * Lectura y guardado por la cadena cmdConfiguradorProducto (servidor, bajo bloqueo, sin triggers).
 * cfgCobtar: type select, readOnly/required casillas ("true"/"false"), catalog con editor de tabla.
 * cfgCoberturaProductoRea: isCoverage casilla ("Si"/"No"), cessionCode numerico, coberturaPrincipal, coverageCodeDep
 *   y sameValidityAs con las coberturas del producto (Ninguna = "-1"), changeable casilla ("true"/"false").
 * tarificacionSIS9: cendoso numerico (36 por defecto; en Incendio QUOTE/ANNIVERSARY), formulas con asistente,
 *   usaProrrata casilla ("true"/"false").
 */
(() => {
  const { useState, useEffect } = React;
  const { Card, Select, Table, Tabs, Button, Space, Tag, Alert, Spin, Modal, Input, InputNumber, Checkbox, Tooltip, Typography, Empty, Radio, AutoComplete, message } = A;

  const CHAIN = 'cmdConfiguradorProducto';
  const MONO = { fontFamily: 'Consolas, Menlo, monospace', fontSize: 12 };
  const FORMULA_COLS = ['condicion', 'prima', 'deducible', 'deducibleMinimo', 'sumaasegurada', 'etiqueta'];
  const COVERAGE_COLS = ['coberturaPrincipal', 'coverageCodeDep', 'sameValidityAs'];
  const JSWORDS = {};
  ['Number', 'Math', 'true', 'false', 'null', 'undefined', 'typeof', 'new', 'Date', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'String', 'Boolean', 'Array', 'Object', 'JSON', 'return', 'var', 'let', 'const', 'function', 'if', 'else', 'in', 'of', 'instanceof', 'NaN', 'Infinity', 'this', 'void'].forEach(function (w) { JSWORDS[w] = true; });
  const NUM_RE = /^-?\d+(\.\d+)?$/;
  const OPS = [
    { value: '===', label: 'es igual a' },
    { value: '==', label: 'es igual a (==)' },
    { value: '!==', label: 'no es igual a' },
    { value: '!=', label: 'no es igual a (!=)' },
    { value: '>', label: 'es mayor que' },
    { value: '>=', label: 'es mayor o igual que' },
    { value: '<', label: 'es menor que' },
    { value: '<=', label: 'es menor o igual que' },
    { value: 'in', label: 'es uno de' }
  ];

  const txt = function (v) { return v === null || v === undefined ? '' : String(v); };
  const assign = function () { return Object.assign.apply(Object, [{}].concat(Array.prototype.slice.call(arguments))); };
  const isTrue = function (v) { return txt(v).trim().toLowerCase() === 'true'; };
  const numOrNull = function (v) { const s = txt(v).trim(); return s === '' || isNaN(Number(s)) ? null : Number(s); };
  const unq = function (s) { s = txt(s).trim(); const m = /^(['"])([\s\S]*)\1$/.exec(s); return m ? m[2] : s; };
  const quoteOf = function (s) { s = txt(s).trim(); return s[0] === '"' || s[0] === "'" ? s[0] : ''; };
  const litOf = function (value, q) {
    const s = txt(value).trim();
    if (q) return q + s.split('\\').join('\\\\').split(q).join('\\' + q) + q;
    if (NUM_RE.test(s)) return s;
    return "'" + s.split('\\').join('\\\\').split("'").join("\\'") + "'";
  };

  const callChain = function (request) {
    return exe('ExeChain', { chain: CHAIN, context: JSON.stringify({ request: request }) }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.msg) || t('Sin respuesta del servidor'));
      const o = r.outData;
      if (!o || o.ok === false) { const e = new Error((o && o.msg) || t('El servidor rechazó la operación')); e.out = o; throw e; }
      return o;
    });
  };

  // ---------- expresiones: análisis y generación ----------
  const exprError = function (s) {
    const f = txt(s).trim();
    if (!f) return null;
    try { new Function('return (' + f + '\n);'); return null; } catch (e) { return String(e && e.message || e); }
  };
  const identsOf = function (s) {
    const clean = txt(s).replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, ' ');
    const re = /(^|[^.\w$])([A-Za-z_$][\w$]*)/g;
    const out = [];
    let m;
    while ((m = re.exec(clean))) { if (!JSWORDS[m[2]] && out.indexOf(m[2]) < 0) out.push(m[2]); }
    return out;
  };
  const scan = function (s, fn) {
    let depth = 0, q = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') { depth++; continue; }
      if (ch === ')' || ch === ']' || ch === '}') { depth--; if (depth < 0) return false; continue; }
      if (fn(ch, i, depth) === false) return false;
    }
    return depth === 0 && !q;
  };
  const balanced = function (s) { return scan(s, function () { return true; }); };
  const matchParen = function (s, start) {
    let depth = 0, q = null;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
      if (ch === '(') depth++;
      else if (ch === ')') { depth--; if (depth === 0) return i; }
    }
    return -1;
  };
  const strip = function (s) {
    s = txt(s).trim();
    while (s[0] === '(' && matchParen(s, 0) === s.length - 1) s = s.slice(1, -1).trim();
    return s;
  };
  const isQ = function (s, i) { return s[i] === '?' && s[i + 1] !== '?' && s[i - 1] !== '?' && s[i + 1] !== '.'; };
  const splitTernary = function (s0) {
    const s = strip(s0);
    let qi = -1;
    scan(s, function (ch, i, d) { if (d === 0 && isQ(s, i)) { qi = i; return false; } });
    if (qi < 0) return null;
    const rest = s.slice(qi + 1);
    let nest = 0, ci = -1;
    scan(rest, function (ch, i, d) {
      if (d !== 0) return;
      if (isQ(rest, i)) nest++;
      else if (ch === ':') { if (nest === 0) { ci = i; return false; } nest--; }
    });
    if (ci < 0) return null;
    return { cond: s.slice(0, qi).trim(), then: rest.slice(0, ci).trim(), otherwise: rest.slice(ci + 1).trim() };
  };
  const ternaryChain = function (s) {
    const branches = [];
    let cur = s, tt;
    while ((tt = splitTernary(cur))) { branches.push({ cond: strip(tt.cond), value: strip(tt.then) }); cur = tt.otherwise; }
    return { branches: branches, otherwise: strip(cur) };
  };
  const LIT = '(?:-?\\d+(?:\\.\\d+)?|"[^"]*"|\'[^\']*\')';
  const ID = '([A-Za-z_$][\\w$]*)';
  const RE_CMP_N = new RegExp('^Number\\(\\s*' + ID + '\\s*\\)\\s*(===|==|!==|!=|>=|<=|>|<)\\s*(' + LIT + ')$');
  const RE_CMP = new RegExp('^' + ID + '\\s*(===|==|!==|!=|>=|<=|>|<)\\s*(' + LIT + ')$');
  const RE_IN = new RegExp('^\\[\\s*((?:' + LIT + ')(?:\\s*,\\s*' + LIT + ')*)?\\s*\\]\\.includes\\(\\s*(?:Number\\(\\s*' + ID + '\\s*\\)|' + ID + ')\\s*\\)$');
  const RE_MAP = /^\{([^{}]*)\}\s*\[\s*([A-Za-z_$][\w$]*)\s*\](?:\s*\?\?\s*([\s\S]+))?$/;
  const splitTop = function (s, op) {
    const parts = [];
    let last = 0;
    scan(s, function (ch, i, d) { if (d === 0 && s.substr(i, op.length) === op) { parts.push(s.slice(last, i)); last = i + op.length; } });
    parts.push(s.slice(last));
    return parts.map(function (p) { return strip(p); });
  };
  const condOf = function (c0) {
    const c = strip(c0);
    if (/^(1\s*===?\s*1|true)$/.test(c)) return { kind: 'always' };
    let m = RE_CMP_N.exec(c);
    if (m) return { kind: 'cmp', v: m[1], num: true, op: m[2], value: m[3] };
    m = RE_IN.exec(c);
    if (m) return { kind: 'in', v: m[2] || m[3], num: !!m[2], values: (m[1] || '').trim() };
    m = RE_CMP.exec(c);
    if (m) return { kind: 'cmp', v: m[1], num: false, op: m[2], value: m[3] };
    const joins = ['&&', '||'];
    for (let j = 0; j < joins.length; j++) {
      const parts = splitTop(c, joins[j]);
      if (parts.length > 1) {
        const sub = parts.map(condOf);
        if (sub.every(function (x) { return x.kind === 'cmp' || x.kind === 'in'; })) return { kind: joins[j] === '&&' ? 'all' : 'any', parts: sub };
      }
    }
    return { kind: 'raw', text: c };
  };
  const mapOf = function (s) {
    const m = RE_MAP.exec(s);
    if (!m) return null;
    const rows = [];
    const entries = m[1].trim() ? splitTop(m[1], ',') : [];
    for (let i = 0; i < entries.length; i++) {
      const e = /^(-?\d+(?:\.\d+)?|"[^"]*"|'[^']*'|[A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/.exec(entries[i]);
      if (!e) return null;
      rows.push({ key: unq(e[1]), q: quoteOf(e[1]), value: e[2].trim() });
    }
    return { mode: 'lookup', style: 'map', v: m[2], num: false, op: '===', rows: rows, otherwise: m[3] ? strip(m[3]) : '' };
  };
  const analyze = function (f) {
    const s = txt(f).trim();
    if (!s) return { mode: 'empty' };
    if (!balanced(s)) return { mode: 'text' };
    const map = mapOf(strip(s));
    if (map) return map;
    const ch = ternaryChain(s);
    if (!ch.branches.length) { const c = condOf(s); return c.kind === 'raw' ? { mode: 'text' } : { mode: 'condition', cond: c }; }
    const conds = ch.branches.map(function (b) { return condOf(b.cond); });
    const c0 = conds[0];
    const lookup = conds.every(function (c) { return c.kind === 'cmp' && (c.op === '===' || c.op === '==') && c.v === c0.v && c.num === c0.num && c.op === c0.op; });
    if (lookup) return { mode: 'lookup', style: 'ternary', v: c0.v, num: c0.num, op: c0.op, rows: ch.branches.map(function (b, i) { return { key: unq(conds[i].value), q: quoteOf(conds[i].value), value: b.value }; }), otherwise: ch.otherwise };
    return { mode: 'rules', rows: ch.branches.map(function (b) { return { cond: b.cond, value: b.value }; }), otherwise: ch.otherwise };
  };
  // modelo de condición: always | raw {text} | list {join, items:[{v, num, op, value, q}]}
  const condModelOf = function (text) {
    const c = condOf(text);
    const item = function (x) { return x.kind === 'in' ? { v: x.v, num: x.num, op: 'in', value: x.values, q: '' } : { v: x.v, num: x.num, op: x.op, value: unq(x.value), q: quoteOf(x.value) }; };
    if (c.kind === 'always') return { kind: 'always' };
    if (c.kind === 'cmp' || c.kind === 'in') return { kind: 'list', join: '&&', items: [item(c)] };
    if (c.kind === 'all' || c.kind === 'any') return { kind: 'list', join: c.kind === 'all' ? '&&' : '||', items: c.parts.map(item) };
    return { kind: 'raw', text: strip(text) };
  };
  const genItem = function (it) {
    const left = it.num ? 'Number(' + txt(it.v).trim() + ')' : txt(it.v).trim();
    if (it.op === 'in') return '[' + txt(it.value).trim() + '].includes(' + left + ')';
    return left + ' ' + it.op + ' ' + litOf(it.value, it.q);
  };
  const genCond = function (m) {
    if (!m || m.kind === 'always') return '1==1';
    if (m.kind === 'raw') return txt(m.text).trim();
    return m.items.map(genItem).join(' ' + m.join + ' ');
  };
  const orUndef = function (s) { return txt(s).trim() || 'undefined'; };
  const genModel = function (m) {
    if (m.mode === 'free') return txt(m.text);
    if (m.mode === 'condition') return genCond(m.cond);
    const d = orUndef(m.otherwise);
    if (m.mode === 'lookup') {
      const rows = m.rows.filter(function (r) { return txt(r.key).trim() !== ''; });
      if (m.style === 'map') return '({' + rows.map(function (r) { return litOf(r.key, r.q) + ':' + orUndef(r.value); }).join(', ') + '}[' + txt(m.v).trim() + '] ?? ' + d + ')';
      let out = '(' + d + ')';
      for (let i = rows.length - 1; i >= 0; i--) {
        const c = (m.num ? 'Number(' + txt(m.v).trim() + ')' : txt(m.v).trim()) + m.op + litOf(rows[i].key, rows[i].q);
        out = '((' + c + ') ? (' + orUndef(rows[i].value) + ') : ' + out + ')';
      }
      return out;
    }
    let out2 = '(' + d + ')';
    for (let i = m.rows.length - 1; i >= 0; i--) out2 = '((' + genCond(m.rows[i].cond) + ') ? (' + orUndef(m.rows[i].value) + ') : ' + out2 + ')';
    return out2;
  };
  const modelOf = function (text) {
    const a = analyze(text);
    if (a.mode === 'lookup') return { mode: 'lookup', style: a.style, v: a.v, num: a.num, op: a.op, rows: a.rows, otherwise: a.otherwise };
    if (a.mode === 'rules') return { mode: 'rules', rows: a.rows.map(function (r) { return { cond: condModelOf(r.cond), value: r.value }; }), otherwise: a.otherwise };
    if (a.mode === 'condition') return { mode: 'condition', cond: condModelOf(text) };
    return { mode: 'free', text: txt(text) };
  };
  const findBlocks = function (s) {
    const out = [];
    let q = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
      if (ch !== '(') continue;
      const j = matchParen(s, i);
      if (j < 0) break;
      const inner = s.slice(i + 1, j);
      const a = analyze(inner);
      if (a.mode === 'lookup' || a.mode === 'rules') { out.push({ start: i + 1, end: j, inner: inner, a: a }); i = j; }
    }
    return out;
  };
  const blockLabel = function (a) {
    if (a.mode === 'lookup') return t('Tabla de valores por') + ' ' + a.v + ' (' + a.rows.length + ')';
    return t('Reglas si / entonces') + ' (' + a.rows.length + ')';
  };

  // ---------- catálogos ----------
  const parseCatalog = function (s0) {
    const s = txt(s0).trim();
    if (!s) return { items: [], style: null };
    if (s[0] !== '[' || s[s.length - 1] !== ']') return null;
    const body = s.slice(1, -1);
    const re = /\{\s*code\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|-?\d+(?:\.\d+)?)\s*,\s*name\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|-?\d+(?:\.\d+)?)\s*\}/g;
    const items = [], seps = [];
    let m, last = 0;
    while ((m = re.exec(body))) {
      const gap = body.slice(last, m.index);
      if (items.length ? !/^\s*,\s*$/.test(gap) : !/^\s*$/.test(gap)) return null;
      if (items.length) seps.push(gap);
      const val = function (tk) { return tk[0] === '"' || tk[0] === "'" ? { v: tk.slice(1, -1).replace(/\\(.)/g, '$1'), q: tk[0] } : { v: tk, q: '' }; };
      const c = val(m[1]), n = val(m[2]);
      items.push({ code: c.v, codeQuoted: c.q, name: n.v, nameQuoted: n.q, raw: m[0] });
      last = re.lastIndex;
    }
    if (!/^\s*$/.test(body.slice(last))) return null;
    const first = items[0] ? items[0].raw : '';
    return { items: items, style: { spaced: /^\{\s/.test(first), sep: seps.length ? seps[0] : ', ', pad: s.match(/^\[(\s*)/)[1], endPad: s.match(/(\s*)\]$/)[1], q: (items[0] && items[0].nameQuoted) || '"' } };
  };
  const serializeCatalog = function (items, style) {
    style = style || { spaced: true, sep: ', ', pad: '', endPad: '', q: '"' };
    if (!items.length) return '';
    const lit = function (v, q) { return q + String(v).split('\\').join('\\\\').split(q).join('\\' + q) + q; };
    const parts = items.map(function (it) {
      const code = txt(it.code).trim();
      let cq = it.codeQuoted !== undefined && it.codeQuoted !== null ? it.codeQuoted : (NUM_RE.test(code) ? '' : style.q);
      if (!cq && !NUM_RE.test(code)) cq = style.q;
      const c = cq ? lit(code, cq) : code;
      const n = lit(txt(it.name), it.nameQuoted || style.q);
      return style.spaced ? '{ code: ' + c + ', name: ' + n + ' }' : '{code:' + c + ',name:' + n + '}';
    });
    return '[' + style.pad + parts.join(style.sep) + style.endPad + ']';
  };

  // ---------- editor de catálogo ----------
  const CatalogEditor = function (props) {
    const [items, setItems] = useState([]);
    const [style, setStyle] = useState(null);
    const [bad, setBad] = useState(false);
    const [raw, setRaw] = useState('');
    useEffect(function () {
      if (!props.open) { setItems([]); setBad(false); return; }
      const p = parseCatalog(props.value);
      if (p) { setItems(p.items.map(function (it, i) { return assign(it, { k: i }); })); setStyle(p.style); setBad(false); }
      else { setItems([]); setStyle(null); setBad(true); setRaw(txt(props.value)); }
    }, [props.open, props.value]);
    if (!props.open) return null;
    const setItem = function (k, patch) { setItems(items.map(function (it) { return it.k === k ? assign(it, patch) : it; })); };
    const move = function (idx, d) { const a = items.slice(); const x = a[idx]; a[idx] = a[idx + d]; a[idx + d] = x; setItems(a); };
    const add = function () {
      const k = items.reduce(function (mx, it) { return Math.max(mx, it.k); }, -1) + 1;
      const lastQ = items.length ? items[items.length - 1].codeQuoted : undefined;
      setItems(items.concat([{ k: k, code: '', name: '', codeQuoted: lastQ, nameQuoted: style ? style.q : '"' }]));
    };
    const codes = items.map(function (it) { return txt(it.code).trim(); });
    const dup = codes.filter(function (c, i) { return c && codes.indexOf(c) !== i; });
    const empty = items.filter(function (it) { return !txt(it.code).trim(); }).length;
    const result = bad ? raw : serializeCatalog(items, style);
    return (
      <Modal className="configurador-producto-catalog-modal" title={t('Catálogo') + (props.title ? ' — ' + props.title : '')} visible width={760} onCancel={props.onCancel}
        okText={t('Aceptar')} cancelText={t('Cancelar')} okButtonProps={{ disabled: !bad && (dup.length > 0 || empty > 0) }}
        onOk={function () { props.onOk(result); }} destroyOnClose>
        {bad ? (
          <div>
            <Alert type="warning" showIcon style={{ marginBottom: 8 }} message={t('El catálogo no tiene la forma [{ code: …, name: … }, …]; edítelo como texto.')} />
            <Input.TextArea style={MONO} autoSize={{ minRows: 3, maxRows: 12 }} value={raw} onChange={function (e) { setRaw(e.target.value); }} />
          </div>
        ) : (
          <div>
            <Table size="small" rowKey="k" pagination={false} dataSource={items} scroll={{ y: 360 }}
              locale={{ emptyText: t('Sin opciones: el catálogo queda vacío') }}
              columns={[
                { title: t('Código (code)'), key: 'code', width: 160, render: function (_, it) { return <Input size="small" style={MONO} value={it.code} status={!txt(it.code).trim() || dup.indexOf(txt(it.code).trim()) >= 0 ? 'error' : undefined} onChange={function (e) { setItem(it.k, { code: e.target.value }); }} />; } },
                { title: t('Nombre (name)'), key: 'name', render: function (_, it) { return <Input size="small" value={it.name} onChange={function (e) { setItem(it.k, { name: e.target.value }); }} />; } },
                { title: '', key: 'a', width: 150, render: function (_, it, idx) { return (
                  <Space size={0}>
                    <Button size="small" type="text" disabled={idx === 0} onClick={function () { move(idx, -1); }}>↑</Button>
                    <Button size="small" type="text" disabled={idx === items.length - 1} onClick={function () { move(idx, 1); }}>↓</Button>
                    <Button size="small" type="link" danger onClick={function () { setItems(items.filter(function (x) { return x.k !== it.k; })); }}>{t('Quitar')}</Button>
                  </Space>); } }
              ]} />
            <Button size="small" style={{ marginTop: 8 }} onClick={add}>{t('Agregar opción')}</Button>
            {dup.length ? <Alert type="error" showIcon style={{ marginTop: 8 }} message={t('Códigos repetidos') + ': ' + dup.join(', ')} /> : null}
            {empty ? <Alert type="error" showIcon style={{ marginTop: 8 }} message={t('Hay opciones sin código')} /> : null}
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <Typography.Text type="secondary">{t('Texto que se guardará')}</Typography.Text>
          <div style={assign(MONO, { background: '#fafafa', border: '1px solid #f0f0f0', padding: 6, marginTop: 4, wordBreak: 'break-all', maxHeight: 120, overflow: 'auto' })}>{result || t('(vacío)')}</div>
        </div>
      </Modal>
    );
  };

  // ---------- editor de condición ----------
  const ConditionEditor = function (props) {
    const m = props.value;
    const vars = props.varOptions;
    const firstVar = vars.length ? vars[0].value : 'VARIABLE';
    const newItem = function () { return { v: firstVar, num: true, op: '===', value: '', q: '' }; };
    if (m.kind === 'always') {
      return (
        <Space wrap>
          <Tag color="green">{t('Siempre')}</Tag>
          <Button size="small" onClick={function () { props.onChange({ kind: 'list', join: '&&', items: [newItem()] }); }}>{t('Poner una condición')}</Button>
        </Space>
      );
    }
    if (m.kind === 'raw') {
      return (
        <div style={{ display: 'flex', gap: 4 }}>
          <Input.TextArea style={MONO} autoSize={{ minRows: 1, maxRows: 4 }} value={m.text} onChange={function (e) { props.onChange({ kind: 'raw', text: e.target.value }); }} />
          <Tooltip title={t('Reemplazar por una condición armada con el asistente')}>
            <Button size="small" onClick={function () { props.onChange({ kind: 'list', join: '&&', items: [newItem()] }); }}>{t('Asistente')}</Button>
          </Tooltip>
        </div>
      );
    }
    const setItem = function (idx, patch) { props.onChange(assign(m, { items: m.items.map(function (it, i) { return i === idx ? assign(it, patch) : it; }) })); };
    return (
      <div>
        {m.items.length > 1 ? (
          <div style={{ marginBottom: 4 }}>
            <Radio.Group size="small" value={m.join} onChange={function (e) { props.onChange(assign(m, { join: e.target.value })); }}>
              <Radio.Button value="&&">{t('Se cumplen todas (Y)')}</Radio.Button>
              <Radio.Button value="||">{t('Se cumple alguna (O)')}</Radio.Button>
            </Radio.Group>
          </div>
        ) : null}
        {m.items.map(function (it, idx) {
          return (
            <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, alignItems: 'center' }}>
              <AutoComplete size="small" style={{ width: 170 }} options={vars} value={it.v} placeholder={t('variable')}
                filterOption={function (input, o) { return txt(o.value).toLowerCase().indexOf(txt(input).toLowerCase()) >= 0; }}
                onChange={function (v) { setItem(idx, { v: v }); }} />
              <Tooltip title={t('Convierte el valor de la variable a número antes de comparar: Number(variable)')}>
                <Checkbox checked={it.num} onChange={function (e) { setItem(idx, { num: e.target.checked }); }}>{t('Número')}</Checkbox>
              </Tooltip>
              <Select size="small" style={{ width: 170 }} value={it.op} options={OPS} onChange={function (v) { setItem(idx, { op: v }); }} />
              <Input size="small" style={assign(MONO, { width: it.op === 'in' ? 200 : 120 })} value={it.value} placeholder={it.op === 'in' ? '1, 2, 3' : t('valor')}
                onChange={function (e) { setItem(idx, { value: e.target.value }); }} />
              {m.items.length > 1 ? <Button size="small" type="link" danger onClick={function () { props.onChange(assign(m, { items: m.items.filter(function (x, i) { return i !== idx; }) })); }}>{t('Quitar')}</Button> : null}
            </div>
          );
        })}
        <Space size={4} wrap>
          <Button size="small" onClick={function () { props.onChange(assign(m, { items: m.items.concat([newItem()]) })); }}>{t('Agregar comparación')}</Button>
          {props.allowAlways ? <Button size="small" onClick={function () { props.onChange({ kind: 'always' }); }}>{t('Siempre')}</Button> : null}
          <Button size="small" onClick={function () { props.onChange({ kind: 'raw', text: genCond(m) }); }}>{t('Escribir como texto')}</Button>
        </Space>
      </div>
    );
  };

  // ---------- asistente de fórmulas ----------
  const FormulaAssistant = function (props) {
    const [model, setModel] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [testVals, setTestVals] = useState({});
    const [testOut, setTestOut] = useState(null);
    const [block, setBlock] = useState(null);
    useEffect(function () {
      if (!props.open) { setModel(null); return; }
      setModel(modelOf(props.value));
      setDirty(false);
      setTestOut(null);
      setBlock(null);
    }, [props.open, props.value]);
    if (!props.open || !model) return null;
    const original = txt(props.value);
    const text = dirty ? genModel(model) : original;
    const err = exprError(text);
    const fields = props.fields || [];
    const vars = props.variables || [];
    const varOptions = [];
    const seen = {};
    const addOpt = function (name, label) { if (!name || seen[name]) return; seen[name] = true; varOptions.push({ value: name, label: label }); };
    fields.filter(function (f) { return f.thisCoverage; }).forEach(function (f) { addOpt(f.name, <span>{f.name} <Typography.Text type="secondary">{t('campo de la cobertura')}{f.description ? ' · ' + f.description : ''}</Typography.Text></span>); });
    fields.filter(function (f) { return !f.thisCoverage; }).forEach(function (f) { addOpt(f.name, <span>{f.name} <Typography.Text type="secondary">{t('campo del producto')}{f.description ? ' · ' + f.description : ''}</Typography.Text></span>); });
    vars.forEach(function (v) { addOpt(v.name, <span>{v.name} <Typography.Text type="secondary">{t('usada en el ramo')} ({v.count})</Typography.Text></span>); });
    const catalogOf = function (name) {
      const f = fields.filter(function (x) { return x.name === name && txt(x.catalog).trim(); }).sort(function (a, b) { return (b.thisCoverage ? 1 : 0) - (a.thisCoverage ? 1 : 0); })[0];
      const p = f ? parseCatalog(f.catalog) : null;
      return p && p.items.length ? p.items : null;
    };
    const change = function (m) { setModel(m); setDirty(true); setTestOut(null); };
    const firstVar = varOptions.length ? varOptions[0].value : 'VARIABLE';
    const isCondCol = props.column === 'condicion';
    const switchMode = function (mode) {
      if (mode === model.mode) return;
      if (mode === 'free') return change({ mode: 'free', text: text });
      if (mode === 'condition') { const c = condModelOf(text); return change({ mode: 'condition', cond: c.kind === 'raw' ? { kind: 'list', join: '&&', items: [{ v: firstVar, num: true, op: '===', value: '', q: '' }] } : c }); }
      const simple = model.mode === 'free' || model.mode === 'condition' ? text : '';
      if (mode === 'lookup') {
        if (model.mode === 'rules') return change({ mode: 'lookup', style: 'ternary', v: firstVar, num: true, op: '===', rows: model.rows.map(function (r) { return { key: '', q: '', value: r.value }; }), otherwise: model.otherwise });
        return change({ mode: 'lookup', style: 'ternary', v: firstVar, num: true, op: '===', rows: [{ key: '', q: '', value: '' }], otherwise: simple });
      }
      if (model.mode === 'lookup') return change({ mode: 'rules', rows: model.rows.map(function (r) { return { cond: { kind: 'list', join: '&&', items: [{ v: model.v, num: model.num, op: model.op || '===', value: r.key, q: r.q }] }, value: r.value }; }), otherwise: model.otherwise });
      return change({ mode: 'rules', rows: [{ cond: { kind: 'list', join: '&&', items: [{ v: firstVar, num: true, op: '===', value: '', q: '' }] }, value: '' }], otherwise: simple });
    };
    const moveIn = function (list, idx, d) { const a = list.slice(); const x = a[idx]; a[idx] = a[idx + d]; a[idx + d] = x; return a; };
    const rowActions = function (list, idx, set) {
      return (
        <Space size={0}>
          <Button size="small" type="text" disabled={idx === 0} onClick={function () { set(moveIn(list, idx, -1)); }}>↑</Button>
          <Button size="small" type="text" disabled={idx === list.length - 1} onClick={function () { set(moveIn(list, idx, 1)); }}>↓</Button>
          <Button size="small" type="link" danger onClick={function () { set(list.filter(function (x, i) { return i !== idx; })); }}>{t('Quitar')}</Button>
        </Space>
      );
    };
    const otherwiseInput = (
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ whiteSpace: 'nowrap' }}>{t('En otro caso')}</span>
        <Input size="small" style={MONO} value={model.otherwise} placeholder={t('sin valor (undefined)')} onChange={function (e) { change(assign(model, { otherwise: e.target.value })); }} />
      </div>
    );

    let editor = null;
    if (model.mode === 'lookup') {
      const cat = catalogOf(model.v);
      const setRows = function (rows) { change(assign(model, { rows: rows })); };
      const setRow = function (idx, patch) { setRows(model.rows.map(function (r, i) { return i === idx ? assign(r, patch) : r; })); };
      const keyName = function (k) { if (!cat) return null; const it = cat.filter(function (c) { return txt(c.code).trim() === txt(k).trim(); })[0]; return it ? it.name : null; };
      editor = (
        <div>
          <Space wrap style={{ marginBottom: 8 }}>
            <span>{t('Variable')}</span>
            <AutoComplete size="small" style={{ width: 220 }} options={varOptions} value={model.v}
              filterOption={function (input, o) { return txt(o.value).toLowerCase().indexOf(txt(input).toLowerCase()) >= 0; }}
              onChange={function (v) { change(assign(model, { v: v })); }} />
            {model.style !== 'map' ? (
              <Tooltip title={t('Convierte el valor de la variable a número antes de comparar: Number(variable)')}>
                <Checkbox checked={model.num} onChange={function (e) { change(assign(model, { num: e.target.checked })); }}>{t('Comparar como número')}</Checkbox>
              </Tooltip>
            ) : <Tag>{t('formato {valor: resultado}[variable]')}</Tag>}
          </Space>
          <Table size="small" rowKey="i" pagination={false} dataSource={model.rows.map(function (r, i) { return assign(r, { i: i }); })}
            locale={{ emptyText: t('Sin valores') }}
            columns={[
              { title: t('Si') + ' ' + (model.v || t('la variable')) + ' ' + t('vale'), key: 'k', width: 260, render: function (_, r) {
                return (
                  <div>
                    {cat ? (
                      <AutoComplete size="small" style={assign(MONO, { width: 230 })} value={r.key}
                        options={cat.map(function (c) { return { value: txt(c.code), label: txt(c.code) + ' — ' + txt(c.name) }; })}
                        onChange={function (v) { setRow(r.i, { key: v }); }} />
                    ) : <Input size="small" style={MONO} value={r.key} onChange={function (e) { setRow(r.i, { key: e.target.value }); }} />}
                    {keyName(r.key) ? <div><Typography.Text type="secondary" style={{ fontSize: 11 }}>{keyName(r.key)}</Typography.Text></div> : null}
                    {model.num && model.style !== 'map' && txt(r.key).trim() && !NUM_RE.test(txt(r.key).trim()) ? <div><Typography.Text type="danger" style={{ fontSize: 11 }}>{t('Con «Comparar como número» el valor debe ser un número')}</Typography.Text></div> : null}
                  </div>
                );
              } },
              { title: t('Resultado'), key: 'v', render: function (_, r) { return <Input size="small" style={MONO} value={r.value} placeholder="undefined" onChange={function (e) { setRow(r.i, { value: e.target.value }); }} />; } },
              { title: '', key: 'a', width: 140, render: function (_, r) { return rowActions(model.rows, r.i, setRows); } }
            ]} />
          <Button size="small" style={{ marginTop: 6 }} onClick={function () { setRows(model.rows.concat([{ key: '', q: model.rows.length ? model.rows[model.rows.length - 1].q : '', value: '' }])); }}>{t('Agregar valor')}</Button>
          {otherwiseInput}
        </div>
      );
    } else if (model.mode === 'rules') {
      const setRows = function (rows) { change(assign(model, { rows: rows })); };
      const setRow = function (idx, patch) { setRows(model.rows.map(function (r, i) { return i === idx ? assign(r, patch) : r; })); };
      editor = (
        <div>
          <Table size="small" rowKey="i" pagination={false} dataSource={model.rows.map(function (r, i) { return assign(r, { i: i }); })}
            locale={{ emptyText: t('Sin reglas') }}
            columns={[
              { title: t('Si se cumple'), key: 'c', render: function (_, r) { return <ConditionEditor value={r.cond} varOptions={varOptions} allowAlways={false} onChange={function (c) { setRow(r.i, { cond: c }); }} />; } },
              { title: t('Entonces'), key: 'v', width: 220, render: function (_, r) { return <Input.TextArea size="small" style={MONO} autoSize={{ minRows: 1, maxRows: 4 }} value={r.value} placeholder="undefined" onChange={function (e) { setRow(r.i, { value: e.target.value }); }} />; } },
              { title: '', key: 'a', width: 140, render: function (_, r) { return rowActions(model.rows, r.i, setRows); } }
            ]} />
          <Button size="small" style={{ marginTop: 6 }} onClick={function () { setRows(model.rows.concat([{ cond: { kind: 'list', join: '&&', items: [{ v: firstVar, num: true, op: '===', value: '', q: '' }] }, value: '' }])); }}>{t('Agregar regla')}</Button>
          {otherwiseInput}
        </div>
      );
    } else if (model.mode === 'condition') {
      editor = <ConditionEditor value={model.cond} varOptions={varOptions} allowAlways={true} onChange={function (c) { change(assign(model, { cond: c })); }} />;
    } else {
      const blocks = findBlocks(text);
      editor = (
        <div>
          <Input.TextArea style={MONO} autoSize={{ minRows: 2, maxRows: 10 }} value={text} onChange={function (e) { change({ mode: 'free', text: e.target.value }); }} />
          {blocks.length ? (
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary">{t('Partes que se pueden editar con el asistente')}</Typography.Text>
              {blocks.map(function (b, i) {
                return (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <Tag color="blue">{blockLabel(b.a)}</Tag>
                    <Typography.Text style={assign(MONO, { maxWidth: 420 })} ellipsis>{b.inner}</Typography.Text>
                    <Button size="small" onClick={function () { setBlock(b); }}>{t('Editar')}</Button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    }

    const testVars = identsOf(text);
    const runTest = function () {
      try {
        const vals = testVars.map(function (n) {
          const s = txt(testVals[n]).trim();
          if (s === '') return undefined;
          if (NUM_RE.test(s)) return Number(s);
          if (s === 'true' || s === 'false') return s === 'true';
          return s;
        });
        const fn = new Function(testVars.join(','), 'return (' + text + '\n);');
        const r = fn.apply(null, vals);
        setTestOut({ ok: true, value: r === undefined ? t('undefined (sin valor)') : JSON.stringify(r) });
      } catch (e) {
        setTestOut({ ok: false, value: String(e && e.message || e) });
      }
    };
    const modes = [{ value: 'lookup', label: t('Tabla de valores') }, { value: 'rules', label: t('Reglas si / entonces') }, { value: 'free', label: t('Fórmula libre') }];
    if (isCondCol || model.mode === 'condition') modes.unshift({ value: 'condition', label: t('Condición') });

    return (
      <Modal className="configurador-producto-formula-modal" title={t('Asistente de fórmula') + ' — ' + props.column} visible width={980} onCancel={props.onCancel} destroyOnClose
        footer={[
          <Button key="reset" disabled={!dirty} onClick={function () { setModel(modelOf(original)); setDirty(false); setTestOut(null); }}>{t('Restablecer')}</Button>,
          <Button key="cancel" onClick={props.onCancel}>{t('Cancelar')}</Button>,
          <Button key="ok" type="primary" disabled={!!err} onClick={function () { props.onOk(text); }}>{t('Aceptar')}</Button>
        ]}>
        <Radio.Group value={model.mode} onChange={function (e) { switchMode(e.target.value); }} optionType="button" buttonStyle="solid" size="small" options={modes} style={{ marginBottom: 12 }} />
        {editor}
        <div style={{ marginTop: 12 }}>
          <Typography.Text type="secondary">{dirty ? t('Fórmula que se guardará') : t('Fórmula actual (sin cambios)')}</Typography.Text>
          <div style={assign(MONO, { background: '#fafafa', border: '1px solid #f0f0f0', padding: 6, marginTop: 4, wordBreak: 'break-all', maxHeight: 140, overflow: 'auto' })}>{text || t('(vacía)')}</div>
          {err ? <Alert type="error" showIcon style={{ marginTop: 6 }} message={t('La fórmula no es válida') + ': ' + err} /> : null}
        </div>
        <Card size="small" style={{ marginTop: 12 }} title={t('Probar la fórmula')}>
          {testVars.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {testVars.map(function (n) {
                return <Input key={n} size="small" style={{ width: 230 }} addonBefore={n} value={testVals[n] || ''} onChange={function (e) { const o = assign(testVals); o[n] = e.target.value; setTestVals(o); }} />;
              })}
            </div>
          ) : <Typography.Text type="secondary">{t('La fórmula no usa variables.')}</Typography.Text>}
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button size="small" disabled={!!err} onClick={runTest}>{t('Calcular')}</Button>
            {testOut ? <Typography.Text type={testOut.ok ? 'success' : 'danger'} style={MONO}>{testOut.value}</Typography.Text> : null}
          </div>
        </Card>
        {varOptions.length ? (
          <div style={{ marginTop: 12 }}>
            <Typography.Text type="secondary">{t('Variables disponibles (clic para agregarla a la fórmula libre)')}</Typography.Text>
            <div style={{ marginTop: 4, maxHeight: 90, overflow: 'auto' }}>
              {varOptions.map(function (o) {
                return <Tag key={o.value} style={{ cursor: model.mode === 'free' ? 'pointer' : 'default', marginBottom: 4 }}
                  onClick={function () { if (model.mode === 'free') change({ mode: 'free', text: (text ? text + ' ' : '') + o.value }); }}>{o.value}</Tag>;
              })}
            </div>
          </div>
        ) : null}
        <FormulaAssistant open={!!block} value={block ? block.inner : ''} column={props.column + ' (' + t('parte') + ')'} fields={fields} variables={vars}
          onCancel={function () { setBlock(null); }}
          onOk={function (inner) { change({ mode: 'free', text: text.slice(0, block.start) + inner + text.slice(block.end) }); setBlock(null); }} />
      </Modal>
    );
  };

  // ---------- pantalla ----------
  const statusTag = function (s) {
    const color = s === 'Activo' ? 'green' : (s === 'Vencido' || s === 'Inactivo') ? 'red' : s === 'Aún no vigente' ? 'orange' : s === 'Obligatoria' ? 'blue' : s === 'No está en el producto' ? 'orange' : 'default';
    return <Tag color={color}>{t(s)}</Tag>;
  };

  const Main = function () {
    const [lobs, setLobs] = useState([]);
    const [lob, setLob] = useState(undefined);
    const [products, setProducts] = useState([]);
    const [prodLoading, setProdLoading] = useState(false);
    const [prodFilter, setProdFilter] = useState('');
    const [product, setProduct] = useState(null);
    const [covData, setCovData] = useState(null);
    const [covLoading, setCovLoading] = useState(false);
    const [coverage, setCoverage] = useState(null);
    const [family, setFamily] = useState(null);
    const [grid, setGrid] = useState(null);
    const [rows, setRows] = useState([]);
    const [gridLoading, setGridLoading] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('products');
    const [seq, setSeq] = useState(1);
    const [catalogEdit, setCatalogEdit] = useState(null);
    const [formulaEdit, setFormulaEdit] = useState(null);

    useEffect(function () {
      callChain({ action: 'lobs' })
        .then(function (o) { setLobs((o.lobs || []).filter(function (l) { return l.products > 0; })); })
        .catch(function (e) { setError(e.message); });
    }, []);

    const guard = function (fn) {
      if (!dirty) { fn(); return; }
      Modal.confirm({
        title: t('Hay cambios sin guardar'),
        content: t('Si continúa, se descartan los cambios de la grilla.'),
        okText: t('Descartar y continuar'),
        cancelText: t('Volver'),
        onOk: function () { setDirty(false); fn(); }
      });
    };
    const clearGrid = function () { setGrid(null); setRows([]); setDirty(false); setFamily(null); };
    const selectLob = function (code) {
      guard(function () {
        setLob(code); setProduct(null); setCovData(null); setCoverage(null); clearGrid(); setTab('products'); setProducts([]); setProdFilter('');
        setProdLoading(true); setError(null);
        callChain({ action: 'products', lobCode: code })
          .then(function (o) { setProducts(o.products || []); })
          .catch(function (e) { setError(e.message); })
          .then(function () { setProdLoading(false); });
      });
    };
    const loadCoverages = function (code) {
      setCovLoading(true);
      return callChain({ action: 'coverages', productCode: code })
        .then(function (o) { setCovData(o); })
        .catch(function (e) { setError(e.message); })
        .then(function () { setCovLoading(false); });
    };
    const selectProduct = function (p) {
      if (!p) return;
      guard(function () {
        setProduct(p); setCoverage(null); setCovData(null); clearGrid(); setTab('coverages'); setError(null);
        loadCoverages(p.code);
      });
    };
    const selectCoverage = function (c) {
      if (!c) return;
      guard(function () { setCoverage(c); clearGrid(); });
    };
    const loadRows = function (fam, cov) {
      setGridLoading(true); setError(null);
      return callChain({ action: 'rows', productCode: product.code, coverageCode: cov.code, family: fam })
        .then(function (o) {
          setGrid(o);
          setRows(o.rows.map(function (x) { return { key: 'p' + x.pos, values: x.values.slice(), isNew: false }; }));
          setDirty(false);
        })
        .catch(function (e) { setError(e.message); setGrid(null); setRows([]); })
        .then(function () { setGridLoading(false); });
    };
    const openFamily = function (fam) {
      guard(function () { setFamily(fam); setGrid(null); setRows([]); loadRows(fam, coverage); });
    };
    const setCell = function (key, i, v) {
      setRows(function (prev) { return prev.map(function (r) { if (r.key !== key) return r; const vals = r.values.slice(); vals[i] = v; return assign(r, { values: vals }); }); });
      setDirty(true);
    };
    const addRow = function () {
      setRows(rows.concat([{ key: 'n' + seq, values: grid.template.slice(), isNew: true }]));
      setSeq(seq + 1); setDirty(true);
    };
    const removeRow = function (key) { setRows(rows.filter(function (r) { return r.key !== key; })); setDirty(true); };
    const moveRow = function (idx, d) { const a = rows.slice(); const x = a[idx]; a[idx] = a[idx + d]; a[idx + d] = x; setRows(a); setDirty(true); };

    const save = function () {
      const h = grid.header;
      const problems = [];
      if (family === 'tar') {
        rows.forEach(function (r, ri) {
          FORMULA_COLS.forEach(function (c) { const i = h.indexOf(c); if (i < 0) return; const e = exprError(r.values[i]); if (e) problems.push(t('Fila') + ' ' + (ri + 1) + ', ' + c + ': ' + e); });
        });
      }
      if (family === 'cob') {
        const ni = h.indexOf('name');
        const names = rows.map(function (r) { return txt(r.values[ni]).trim(); });
        names.forEach(function (n, i) { if (!n) problems.push(t('Fila') + ' ' + (i + 1) + ': ' + t('falta name')); });
      }
      if (problems.length) {
        Modal.error({ title: t('Corrija antes de guardar'), content: <div>{problems.slice(0, 20).map(function (p, i) { return <div key={i}>{p}</div>; })}</div> });
        return;
      }
      setSaving(true); setError(null);
      callChain({ action: 'save', productCode: product.code, coverageCode: coverage.code, family: family, header: h, hash: grid.hash, rows: rows.map(function (r) { return r.values; }) })
        .then(function (o) {
          message.success(o.msg);
          setGrid(assign(grid, { rows: o.rows, hash: o.hash }));
          setRows(o.rows.map(function (x) { return { key: 'p' + x.pos, values: x.values.slice(), isNew: false }; }));
          setDirty(false);
          if (covData) {
            setCovData(assign(covData, { coverages: covData.coverages.map(function (c) {
              if (c.code !== coverage.code) return c;
              const counts = assign(c.counts || {});
              counts[family] = o.saved;
              return assign(c, { counts: counts });
            }) }));
          }
        })
        .catch(function (e) {
          if (e.out && e.out.stale) {
            Modal.warning({ title: t('Las filas cambiaron'), content: e.message, okText: t('Recargar'), onOk: function () { loadRows(family, coverage); } });
          } else {
            setError(e.message);
          }
        })
        .then(function () { setSaving(false); });
    };

    // ---------- celdas ----------
    const checkbox = function (r, i, v, yes, no, isYes) {
      return <Checkbox checked={isYes(v)} onChange={function (e) { setCell(r.key, i, e.target.checked ? yes : no); }} />;
    };
    const typeOptions = function (v) {
      const opts = (grid.typeOptions || []).slice();
      ['text', 'number', 'select'].forEach(function (c) { if (!opts.some(function (o) { return o.toLowerCase() === c; })) opts.push(c); });
      if (txt(v) && opts.indexOf(txt(v)) < 0) opts.unshift(txt(v));
      return opts.map(function (o) { return { value: o, label: o }; });
    };
    const coverageOptions = function (v) {
      const list = (covData && covData.coverages ? covData.coverages : []).filter(function (c) { return c.inProduct; });
      const opts = [{ value: '-1', label: t('Ninguna') + ' (-1)' }].concat(list.map(function (c) { return { value: c.code, label: c.code + ' — ' + c.name }; }));
      const cur = txt(v);
      if (cur !== '' && !opts.some(function (o) { return o.value === cur; })) {
        const sameNum = opts.filter(function (o) { return NUM_RE.test(o.value) && NUM_RE.test(cur.trim()) && Number(o.value) === Number(cur.trim()); })[0];
        if (!sameNum) opts.push({ value: cur, label: cur + ' (' + t('no está en el producto') + ')' });
        else return opts.map(function (o) { return o === sameNum ? { value: cur, label: o.label } : o; });
      }
      return opts;
    };
    const formulaCell = function (r, i, v, name) {
      const e = exprError(v);
      return (
        <div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            <Input.TextArea size="small" autoSize={{ minRows: 1, maxRows: 4 }} style={assign(MONO, { minWidth: 170 })} status={e ? 'error' : undefined}
              value={txt(v)} onChange={function (ev) { setCell(r.key, i, ev.target.value); }} />
            <Tooltip title={t('Asistente de fórmula')}>
              <Button size="small" onClick={function () { setFormulaEdit({ key: r.key, i: i, name: name }); }}>ƒx</Button>
            </Tooltip>
          </div>
          {e ? <Typography.Text type="danger" style={{ fontSize: 11 }}>{e}</Typography.Text> : null}
        </div>
      );
    };
    const catalogCell = function (r, i, v) {
      const p = parseCatalog(v);
      return (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Typography.Text style={assign(MONO, { maxWidth: 280 })} ellipsis={{ tooltip: txt(v) }} type={p ? undefined : 'warning'}>{txt(v) || '—'}</Typography.Text>
          <Button size="small" onClick={function () { setCatalogEdit({ key: r.key, i: i }); }}>{p && p.items.length ? t('Editar') + ' (' + p.items.length + ')' : t('Editar')}</Button>
        </div>
      );
    };
    const cell = function (name, i, r) {
      const v = r.values[i];
      if (family === 'cob') {
        if (name === 'type') return <Select size="small" style={{ width: 110 }} value={txt(v)} options={typeOptions(v)} onChange={function (x) { setCell(r.key, i, x); }} />;
        if (name === 'readOnly' || name === 'required') return checkbox(r, i, v, 'true', 'false', isTrue);
        if (name === 'catalog') return catalogCell(r, i, v);
      } else if (family === 'rea') {
        if (name === 'isCoverage') return checkbox(r, i, v, 'Si', 'No', function (x) { return /^s[ií]$/i.test(txt(x).trim()); });
        if (name === 'changeable') return checkbox(r, i, v, 'true', 'false', isTrue);
        if (name === 'cessionCode') return <InputNumber size="small" style={{ width: 100 }} precision={0} value={numOrNull(v)} onChange={function (x) { setCell(r.key, i, x === null || x === undefined ? '' : String(x)); }} />;
        if (COVERAGE_COLS.indexOf(name) >= 0) return <Select size="small" style={{ width: 240 }} showSearch optionFilterProp="label" value={txt(v)} options={coverageOptions(v)} onChange={function (x) { setCell(r.key, i, x); }} />;
      } else if (family === 'tar') {
        if (name === 'cendoso') {
          if (grid.product.lobCode === '1') {
            const o = ['QUOTE', 'ANNIVERSARY'];
            if (txt(v) && o.indexOf(txt(v)) < 0) o.push(txt(v));
            return <Select size="small" style={{ width: 140 }} value={txt(v)} options={o.map(function (x) { return { value: x, label: x }; })} onChange={function (x) { setCell(r.key, i, x); }} />;
          }
          return <InputNumber size="small" style={{ width: 90 }} precision={0} value={numOrNull(v)} onChange={function (x) { setCell(r.key, i, x === null || x === undefined ? '' : String(x)); }} />;
        }
        if (name === 'usaProrrata') return checkbox(r, i, v, 'true', 'false', isTrue);
        if (FORMULA_COLS.indexOf(name) >= 0) return formulaCell(r, i, v, name);
      }
      return <Input size="small" value={txt(v)} onChange={function (e) { setCell(r.key, i, e.target.value); }} />;
    };
    const WIDTH = { name: 170, description: 220, type: 130, readOnly: 90, required: 90, catalog: 380, isCoverage: 100, cessionCode: 120, coberturaPrincipal: 260, coverageCodeDep: 260, sameValidityAs: 260, changeable: 110, cendoso: 150, usaProrrata: 110 };
    const gridColumns = function () {
      const h = grid.header;
      const cols = [];
      h.forEach(function (name, i) {
        if (name === null || name === undefined || grid.hidden.indexOf(i) >= 0) return;
        cols.push({ title: t(name), key: 'c' + i, width: WIDTH[name] || (FORMULA_COLS.indexOf(name) >= 0 ? 240 : 160), render: function (_, r) { return cell(name, i, r); } });
      });
      cols.push({ title: '', key: 'actions', width: 150, fixed: 'right', render: function (_, r, idx) {
        return (
          <Space size={0}>
            <Button size="small" type="text" disabled={idx === 0} onClick={function () { moveRow(idx, -1); }}>↑</Button>
            <Button size="small" type="text" disabled={idx === rows.length - 1} onClick={function () { moveRow(idx, 1); }}>↓</Button>
            <Button size="small" type="link" danger onClick={function () { removeRow(r.key); }}>{t('Quitar')}</Button>
          </Space>
        );
      } });
      return cols;
    };
    const editingRow = function (ed) { return ed ? rows.filter(function (r) { return r.key === ed.key; })[0] : null; };

    // ---------- secciones ----------
    const productsTab = function () {
      const f = prodFilter.trim().toLowerCase();
      const list = products.filter(function (p) { return !f || p.code.toLowerCase().indexOf(f) >= 0 || p.name.toLowerCase().indexOf(f) >= 0; });
      return (
        <div>
          <Input.Search allowClear placeholder={t('Buscar por código o nombre')} style={{ width: 320, marginBottom: 8 }} value={prodFilter} onChange={function (e) { setProdFilter(e.target.value); }} />
          <Table size="small" rowKey="code" loading={prodLoading} dataSource={list} pagination={{ pageSize: 15, showSizeChanger: false }} scroll={{ y: 'calc(100vh - 430px)' }}
             onRow={function (p) { const selected = product && product.code === p.code; return { onClick: function () { if (!selected) selectProduct(p); }, className: selected ? 'configurador-producto-row-selected' : '', style: { cursor: 'pointer' } }; }}
            locale={{ emptyText: t('El ramo no tiene productos') }}
            columns={[
              { title: t('Código'), dataIndex: 'code', key: 'code', width: 160 },
              { title: t('Nombre'), dataIndex: 'name', key: 'name' },
              { title: t('Estado'), dataIndex: 'status', key: 'status', width: 140, render: function (s) { return statusTag(s); } },
              { title: t('Vigencia'), dataIndex: 'validity', key: 'validity', width: 260, render: function (v, p) {
                return <span>{v}{p.note ? <Tooltip title={p.note}><Tag color="orange" style={{ marginLeft: 6 }}>{t('revisar')}</Tag></Tooltip> : null}</span>;
              } }
            ]} />
        </div>
      );
    };
    const familyButtons = function () {
      const counts = coverage && coverage.counts ? coverage.counts : {};
      const live = covData ? covData.coverages.filter(function (c) { return c.code === coverage.code; })[0] : null;
      const cnt = live && live.counts ? live.counts : counts;
      return (
        <Space wrap>
          {['cob', 'rea', 'tar'].map(function (f) {
            const label = f === 'cob' ? t('Parámetros de entrada') : (f === 'rea' ? t('Configuración de Reaseguro') : t('Tarifas'));
            return <Button key={f} type={family === f ? 'primary' : 'default'} onClick={function () { openFamily(f); }}>{label} ({cnt[f] || 0})</Button>;
          })}
        </Space>
      );
    };
    const gridSection = function () {
      if (!family) return <Typography.Text type="secondary">{t('Elija una tabla para ver y editar sus filas de esta cobertura.')}</Typography.Text>;
      if (gridLoading || !grid) return <Spin />;
      return (
        <div>
          <Space wrap style={{ marginBottom: 8 }}>
            <Button onClick={addRow}>{t('Agregar fila')}</Button>
            <Button type="primary" disabled={!dirty} loading={saving} onClick={save}>{t('Guardar cambios')}</Button>
            <Button disabled={!dirty || saving} onClick={function () { loadRows(family, coverage); }}>{t('Descartar cambios')}</Button>
            <Button disabled={saving} onClick={function () { guard(function () { loadRows(family, coverage); }); }}>{t('Recargar')}</Button>
            <Typography.Text type="secondary">{grid.table.name} · {rows.length} {t('fila(s)')} · {t('columnas de ramo, producto y cobertura ocultas')}</Typography.Text>
            {dirty ? <Tag color="orange">{t('cambios sin guardar')}</Tag> : null}
          </Space>
          <Table className="configurador-producto-config-table" size="small" rowKey="key" pagination={false} dataSource={rows} columns={gridColumns()} scroll={{ x: 'max-content' }}
            locale={{ emptyText: t('Esta cobertura no tiene filas en') + ' ' + grid.table.name }} />
        </div>
      );
    };
    const coveragesTab = function () {
      if (!product) return null;
      return (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Typography.Text strong>{product.code}</Typography.Text> — {product.name} {statusTag(product.status)}
          </div>
          <Table className="configurador-producto-coverages-table" size="small" rowKey="code" loading={covLoading} dataSource={covData ? covData.coverages : []} pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }} scroll={{ y: 306 }}
             onRow={function (c) { const selected = coverage && coverage.code === c.code; return { onClick: function () { if (!selected) selectCoverage(c); }, className: selected ? 'configurador-producto-row-selected' : '', style: { cursor: 'pointer' } }; }}
            locale={{ emptyText: t('El producto no tiene coberturas') }}
            columns={[
              { title: t('Código'), dataIndex: 'code', key: 'code', width: 100 },
              { title: t('Nombre'), dataIndex: 'name', key: 'name' },
              { title: t('Nombre comercial'), dataIndex: 'commercialName', key: 'commercialName' },
              { title: t('Estado'), dataIndex: 'status', key: 'status', width: 220, render: function (s, c) { return <span>{statusTag(s)}{c.basic ? <Tag>{t('Básica')}</Tag> : null}</span>; } }
            ]} />
          {coverage ? (
            <Card size="small" style={{ marginTop: 12 }} title={t('Cobertura') + ' ' + coverage.code + ' — ' + coverage.name}>
              <div style={{ marginBottom: 12 }}>{familyButtons()}</div>
              {gridSection()}
            </Card>
          ) : null}
        </div>
      );
    };

    const catRow = editingRow(catalogEdit);
    const fxRow = editingRow(formulaEdit);
    const tabItems = [{ key: 'products', label: <span className="configurador-producto-tab-products">{t('Productos')}</span>, children: productsTab() }];
    if (product) tabItems.push({ key: 'coverages', label: <span className="configurador-producto-tab-coverages">{t('Coberturas de') + ' ' + product.code}</span>, children: coveragesTab() });

    return (
      <div className="configurador-producto-view">
        <style>{`
          .configurador-producto-view .ant-input,
          .configurador-producto-view .ant-input-affix-wrapper,
          .configurador-producto-view .ant-input-number,
          .configurador-producto-view .ant-select-selector,
          .configurador-producto-view .ant-btn {
            border-color: #8f9aa7 !important;
          }
          .configurador-producto-view .configurador-producto-ramo-select .ant-select-selector {
            background: #f5f7fa !important;
            border: 1px solid #6f7b88 !important;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65) !important;
          }
          .configurador-producto-view .configurador-producto-ramo-select:hover .ant-select-selector {
            background: #ffffff !important;
            border-color: #4f5d6b !important;
          }
          .configurador-producto-view .configurador-producto-ramo-select.ant-select-focused .ant-select-selector {
            background: #ffffff !important;
            border-color: #1677ff !important;
            box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12) !important;
          }
          .configurador-producto-view .ant-btn {
            border-style: solid !important;
            border-width: 1px !important;
          }
          .configurador-producto-view .ant-btn-text,
          .configurador-producto-formula-modal .ant-btn-text,
          .configurador-producto-catalog-modal .ant-btn-text {
            color: #262626 !important;
            border: 1px solid #8f9aa7 !important;
            background: #ffffff !important;
            opacity: 1 !important;
          }
          .configurador-producto-view .ant-btn-text:disabled,
          .configurador-producto-formula-modal .ant-btn-text:disabled,
          .configurador-producto-catalog-modal .ant-btn-text:disabled {
            color: #4f5d6b !important;
            border-color: #8f9aa7 !important;
            background: #f5f7fa !important;
            opacity: 1 !important;
          }
          .configurador-producto-view .ant-input:hover,
          .configurador-producto-view .ant-input-affix-wrapper:hover,
          .configurador-producto-view .ant-input-number:hover,
          .configurador-producto-view .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
          .configurador-producto-view .ant-btn:hover {
            border-color: #6f7b88 !important;
          }
          .configurador-producto-view .ant-input:focus,
          .configurador-producto-view .ant-input-focused,
          .configurador-producto-view .ant-input-affix-wrapper-focused,
          .configurador-producto-view .ant-input-number-focused,
          .configurador-producto-view .ant-input-number:focus-within,
          .configurador-producto-view .ant-select-focused .ant-select-selector {
            border-color: #1677ff !important;
            box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12) !important;
          }
          .configurador-producto-view .ant-table-container,
          .configurador-producto-view .ant-table,
          .configurador-producto-view .ant-table-thead > tr > th,
          .configurador-producto-view .ant-table-tbody > tr > td {
            border-color: #cbd1d8 !important;
          }
          .configurador-producto-view .ant-table-container {
            border: 1px solid #8f9aa7 !important;
            border-radius: 2px;
          }
          .configurador-producto-view .ant-table-body {
            overflow-y: scroll !important;
          }
          .configurador-producto-view .ant-table-content {
            overflow-x: scroll !important;
          }
          .configurador-producto-view .ant-table {
            border: 0 !important;
          }
          .configurador-producto-view .ant-table-thead > tr > th {
            background: #bfbfbf !important;
            color: #262626;
            font-weight: 600;
          }
          .configurador-producto-view .ant-table-tbody > tr:hover > td {
            background: #f5f9ff !important;
          }
          .configurador-producto-view .configurador-producto-row-selected > td,
          .configurador-producto-view .configurador-producto-row-selected:hover > td {
            background: #86b4ff !important;
            color: #262626;
          }
          .configurador-producto-view .ant-btn:disabled,
          .configurador-producto-view .ant-input:disabled,
          .configurador-producto-view .ant-input-number-disabled,
          .configurador-producto-view .ant-select-disabled .ant-select-selector {
            border-color: #6f7b88 !important;
          }
          .configurador-producto-view .configurador-producto-ramo-panel {
            background: #eef2f6 !important;
            border: 1px solid #8f9aa7 !important;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(38, 38, 38, 0.12);
          }
          .configurador-producto-view .configurador-producto-ramo-hint {
            display: block;
            margin-bottom: 8px;
            color: #262626;
            font-size: 13px;
            font-weight: 600;
          }
          .configurador-producto-view .configurador-producto-coverages-table .ant-table-body {
            overflow-y: scroll !important;
          }
          .configurador-producto-view .configurador-producto-coverages-table .ant-table-thead > tr > th,
          .configurador-producto-view .configurador-producto-coverages-table .ant-table-tbody > tr > td {
            padding: 3px 6px !important;
            line-height: 16px;
          }
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody .ant-input,
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody .ant-input-number,
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody .ant-select {
            width: 100% !important;
            box-sizing: border-box;
          }
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody .ant-input-number-input {
            width: 100% !important;
            height: 46px !important;
            box-sizing: border-box;
          }
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody .ant-input,
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody .ant-input-number,
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody .ant-select-selector {
            min-height: 48px !important;
            height: 48px !important;
            box-sizing: border-box;
          }
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody .ant-select-selection-item,
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody .ant-select-selection-placeholder {
            line-height: 46px !important;
          }
          .configurador-producto-view .configurador-producto-config-table .ant-table-tbody td > div > div {
            min-width: 0;
          }
          .configurador-producto-view .configurador-producto-tabs .ant-tabs-tab {
            margin-right: 4px;
            padding: 9px 14px;
            border: 1px solid #cbd1d8;
            border-bottom: 0;
            border-radius: 4px 4px 0 0;
            background: #f5f7fa;
            color: #262626;
            font-weight: 600;
          }
          .configurador-producto-view .configurador-producto-tabs .ant-tabs-tab + .ant-tabs-tab {
            margin-left: 4px !important;
          }
          .configurador-producto-view .configurador-producto-tabs .ant-tabs-tab:hover {
            color: #262626;
          }
          .configurador-producto-view .configurador-producto-tabs .ant-tabs-tab-active {
            background: #ffffff;
          }
          .configurador-producto-view .configurador-producto-tabs .ant-tabs-tab-active .configurador-producto-tab-products {
            color: #237a3b;
            font-weight: 700;
          }
          .configurador-producto-view .configurador-producto-tabs .ant-tabs-tab-active .configurador-producto-tab-coverages {
            color: #1769aa;
            font-weight: 700;
          }
          .configurador-producto-view .configurador-producto-tabs .ant-tabs-tab:has(.configurador-producto-tab-products).ant-tabs-tab-active {
            border-color: #81a982;
            background: #eef8f0;
          }
          .configurador-producto-view .configurador-producto-tabs .ant-tabs-tab:has(.configurador-producto-tab-coverages).ant-tabs-tab-active {
            border-color: #78a9d6;
            background: #edf5fc;
          }
          .configurador-producto-formula-modal .ant-input,
          .configurador-producto-formula-modal .ant-input-affix-wrapper,
          .configurador-producto-formula-modal .ant-input-number,
          .configurador-producto-formula-modal .ant-select-selector,
          .configurador-producto-formula-modal .ant-btn,
          .configurador-producto-formula-modal .ant-radio-button-wrapper,
          .configurador-producto-formula-modal .ant-checkbox-inner {
            border-color: #8f9aa7 !important;
          }
          .configurador-producto-formula-modal .ant-checkbox-inner {
            background: #ffffff !important;
            border-width: 1px !important;
            border-style: solid !important;
          }
          .configurador-producto-formula-modal .ant-btn {
            border-style: solid !important;
            border-width: 1px !important;
          }
          .configurador-producto-formula-modal .ant-input:hover,
          .configurador-producto-formula-modal .ant-input-affix-wrapper:hover,
          .configurador-producto-formula-modal .ant-input-number:hover,
          .configurador-producto-formula-modal .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
          .configurador-producto-formula-modal .ant-btn:hover,
          .configurador-producto-formula-modal .ant-radio-button-wrapper:hover,
          .configurador-producto-formula-modal .ant-checkbox:hover .ant-checkbox-inner {
            border-color: #6f7b88 !important;
          }
          .configurador-producto-formula-modal .ant-checkbox-focused .ant-checkbox-inner {
            border-color: #1677ff !important;
            box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12) !important;
          }
          .configurador-producto-formula-modal .ant-checkbox-checked .ant-checkbox-inner {
            background: #1677ff !important;
            border-color: #1677ff !important;
          }
          .configurador-producto-formula-modal .ant-input:focus,
          .configurador-producto-formula-modal .ant-input-focused,
          .configurador-producto-formula-modal .ant-input-affix-wrapper-focused,
          .configurador-producto-formula-modal .ant-input-number-focused,
          .configurador-producto-formula-modal .ant-input-number:focus-within,
          .configurador-producto-formula-modal .ant-select-focused .ant-select-selector {
            border-color: #1677ff !important;
            box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12) !important;
          }
          .configurador-producto-catalog-modal .ant-input,
          .configurador-producto-catalog-modal .ant-input-affix-wrapper,
          .configurador-producto-catalog-modal .ant-btn {
            border-color: #8f9aa7 !important;
          }
          .configurador-producto-catalog-modal .ant-btn {
            border-style: solid !important;
            border-width: 1px !important;
          }
          .configurador-producto-catalog-modal .ant-input:hover,
          .configurador-producto-catalog-modal .ant-btn:hover {
            border-color: #6f7b88 !important;
          }
          .configurador-producto-catalog-modal .ant-input:focus,
          .configurador-producto-catalog-modal .ant-input-focused {
            border-color: #1677ff !important;
            box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12) !important;
          }
          .configurador-producto-catalog-modal .ant-table-container {
            border: 1px solid #8f9aa7 !important;
          }
          .configurador-producto-formula-modal .ant-table-body,
          .configurador-producto-catalog-modal .ant-table-body {
            overflow-y: scroll !important;
          }
          .configurador-producto-formula-modal .ant-table-content,
          .configurador-producto-catalog-modal .ant-table-content {
            overflow-x: scroll !important;
          }
          .configurador-producto-catalog-modal .ant-table-thead > tr > th,
          .configurador-producto-catalog-modal .ant-table-tbody > tr > td {
            border-color: #cbd1d8 !important;
          }
          .configurador-producto-view .ant-checkbox-inner {
            background: #ffffff !important;
            border: 1px solid #8f9aa7 !important;
          }
          .configurador-producto-view .ant-checkbox:hover .ant-checkbox-inner {
            border-color: #6f7b88 !important;
          }
          .configurador-producto-view .ant-checkbox-checked .ant-checkbox-inner {
            background: #1677ff !important;
            border-color: #1677ff !important;
          }
        `}</style>
        {error ? <Alert type="error" showIcon closable style={{ marginBottom: 12 }} message={error} onClose={function () { setError(null); }} /> : null}
        <Card className="configurador-producto-ramo-panel" size="small" style={{ marginBottom: 12 }}>
          <div className="configurador-producto-ramo-hint">{t('Seleccione primero un ramo para continuar')}</div>
          <Space wrap>
            <span>{t('Ramo')}</span>
            <Select className="configurador-producto-ramo-select" style={{ width: 340 }} placeholder={t('Seleccione un ramo')} value={lob} onChange={selectLob} showSearch optionFilterProp="label"
              options={lobs.map(function (l) { return { value: l.code, label: l.name + ' (' + l.products + ')', disabled: !l.tables }; })} />
          </Space>
        </Card>
        {lob ? (
          <Card size="small">
            <Tabs className="configurador-producto-tabs" activeKey={tab} onChange={setTab} items={tabItems} />
          </Card>
        ) : <Empty description={t('Seleccione un ramo para ver sus productos')} />}
        <CatalogEditor open={!!catRow} value={catRow ? catRow.values[catalogEdit.i] : ''}
          title={catRow && grid ? txt(catRow.values[grid.header.indexOf('name')]) : ''}
          onCancel={function () { setCatalogEdit(null); }}
          onOk={function (s) { setCell(catalogEdit.key, catalogEdit.i, s); setCatalogEdit(null); }} />
        <FormulaAssistant open={!!fxRow} value={fxRow ? txt(fxRow.values[formulaEdit.i]) : ''} column={formulaEdit ? formulaEdit.name : ''}
          fields={grid && grid.fields ? grid.fields : []} variables={grid && grid.variables ? grid.variables : []}
          onCancel={function () { setFormulaEdit(null); }}
          onOk={function (s) { if (s !== txt(fxRow.values[formulaEdit.i])) setCell(formulaEdit.key, formulaEdit.i, s); setFormulaEdit(null); }} />
      </div>
    );
  };
  return Main;
})()
