/**
 * @name  ExclusionCobertura
 * @purpose Endoso de exclusion de coberturas vigentes opcionales del producto (ChangeRemoveCoverage).
 * La informacion especial del endoso viaja en jAdditional del Change (endorsementType EXCLUSIONCOBERTURA).
 */
() => {
  const Tabs = A.Tabs;
  const Table = A.Table;
  const Button = A.Button;
  const Select = A.Select;
  const DatePicker = A.DatePicker;
  const Input = A.Input;
  const Modal = A.Modal;
  const Alert = A.Alert;
  const Spin = A.Spin;
  const Tag = A.Tag;
  const Tooltip = A.Tooltip;
  const Empty = A.Empty;
  const Checkbox = A.Checkbox;

  // ------------------------------------------------------------- configuracion por ramo
  // Misma tabla de tarifas de entrada que usa el formulario del objeto asegurado de cada ramo.
  const COBTAR_POR_RAMO = [
    { lob: 31, table: 'cfgCobtarVida', object: 'DT_ACCIDENTES_V1' },
    { lob: 20, table: 'cfgCobtarVidaColectivo', object: 'DT_ACCIDENTES_V1' },
    { lob: 71, table: 'cfgCobtarVidaIndividual', object: 'DT_ACCIDENTES_V1' },
    { lob: 96, table: 'cfgCobtarRamoTecnico', object: 'DT_RAMO_TECNICO' },
    { lob: 52, table: 'cfgCobtarRiesgosVarios', object: 'DT_RAMO_TECNICO' },
    { lob: 81, table: 'cfgCobtar', object: 'OBJFIANZA' },
    { lob: 82, table: 'cfgCobtar', object: 'OBJFIANZA' },
    { lob: 83, table: 'cfgCobtar', object: 'OBJFIANZA' },
    { lob: 84, table: 'cfgCobtar', object: 'OBJFIANZA' }
  ];
  // Dependencias entre coberturas (cobertura principal) para el calculo de fechas, como en el formulario.
  const DEPENDENCIAS_POR_RAMO = [
    { lob: 96, table: 'cfgCoberturaProductoReaTecnicos' },
    { lob: 20, table: 'cfgCoberturaProductoReaVidaColectivo' },
    { lob: 31, table: 'cfgCoberturaProductoReaVida' },
    { lob: 52, table: 'cfgCoberturaProductoReaRiesgosVarios' },
    { lob: 81, table: 'cfgCoberturaProductoReaFianza' },
    { lob: 82, table: 'cfgCoberturaProductoReaFianza' },
    { lob: 83, table: 'cfgCoberturaProductoReaFianza' },
    { lob: 84, table: 'cfgCoberturaProductoReaFianza' }
  ];
  const ENDORSEMENT_TYPE = 'EXCLUSIONCOBERTURA';

  // ------------------------------------------------------------- utilidades
  const txt = function (v) { return String(v === null || v === undefined ? '' : v).trim(); };
  const up = function (v) { return txt(v).toUpperCase(); };
  const num = function (v) { const n = Number(v); return isFinite(n) ? n : 0; };
  const money = function (v) { return Number(num(v).toFixed(2)); };
  const fmt = function (v) {
    return num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const normalizeNumericInputValue = function (value) {
    let text = String(value === null || value === undefined ? '' : value).replace(/,/g, '').replace(/[^0-9.\-]/g, '');
    const negative = text.indexOf('-') === 0;
    text = text.replace(/-/g, '');
    const dotIndex = text.indexOf('.');
    let integer = dotIndex >= 0 ? text.slice(0, dotIndex) : text;
    const decimals = dotIndex >= 0 ? text.slice(dotIndex + 1).replace(/\./g, '') : '';
    integer = integer.replace(/^0+(?=\d)/, '');
    if (!integer && (dotIndex >= 0 || decimals)) integer = '0';
    return (negative ? '-' : '') + integer + (dotIndex >= 0 ? '.' + decimals.slice(0, 2) : '');
  };
  const formatNumericInputValue = function (value) {
    const normalized = normalizeNumericInputValue(value);
    if (!normalized || normalized === '-') return normalized;
    const negative = normalized.indexOf('-') === 0;
    const unsigned = negative ? normalized.slice(1) : normalized;
    const dotIndex = unsigned.indexOf('.');
    const integer = dotIndex >= 0 ? unsigned.slice(0, dotIndex) : unsigned;
    const decimals = dotIndex >= 0 ? unsigned.slice(dotIndex + 1) : '';
    const grouped = (integer || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (negative ? '-' : '') + grouped + (dotIndex >= 0 ? '.' + decimals : '');
  };
  const parseNumericInputValue = function (value) {
    const normalized = String(value === null || value === undefined ? '' : value).replace(/,/g, '').trim();
    return normalized === '' || normalized === '-' || normalized === '.' ? null : Number(normalized);
  };
  const EditableFormattedNumber = function (props) {
    const decimals = props.decimals === undefined ? 2 : props.decimals;
    const [draft, setDraft] = useState(props.value === null || props.value === undefined ? '' : String(props.value));
    const [focused, setFocused] = useState(false);
    const valueOnFocus = useState({ current: '' })[0];

    useEffect(function () {
      if (!focused) setDraft(props.value === null || props.value === undefined ? '' : String(props.value));
    }, [props.value, focused]);

    const displayValue = focused || draft === '' ? draft : Number(draft).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return <Input size="small" inputMode="decimal" disabled={props.disabled} readOnly={props.readOnly}
      value={displayValue} style={{ width: '100%', textAlign: 'right' }}
      onFocus={function () { valueOnFocus.current = draft; setFocused(true); }}
      onChange={function (event) { setDraft(normalizeNumericInputValue(event.target.value)); }}
      onBlur={function () {
        setFocused(false);
        const value = parseNumericInputValue(draft);
        const original = parseNumericInputValue(valueOnFocus.current);
        const next = Number.isFinite(value) ? value : 0;
        if (next !== (Number.isFinite(original) ? original : 0)) props.onCommit(next);
        setDraft(next.toFixed(decimals));
      }} />;
  };
  const restoreNumericCaret = function (input, original, caret) {
    if (!input || document.activeElement !== input) return;
    const before = original.slice(0, typeof caret === 'number' ? caret : original.length);
    const meaningfulBefore = normalizeNumericInputValue(before).length;
    const formatted = input.value;
    let nextCaret = formatted.length;
    let meaningful = 0;
    for (let index = 0; index < formatted.length; index += 1) {
      if (formatted[index] !== ',') meaningful += 1;
      if (meaningful >= meaningfulBefore) { nextCaret = index + 1; break; }
    }
    input.setSelectionRange(nextCaret, nextCaret);
  };
  const pct = function (v) { return (num(v) * 100).toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' %'; };
  const day10 = function (v) { return v ? String(v).slice(0, 10) : ''; };
  const daysBetween = function (from, to) {
    const start = day10(from);
    const end = day10(to);
    if (!start || !end) return 0;
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    if (isNaN(startDate) || isNaN(endDate)) return 0;
    return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
  };
  const coverageProrate = function (coverage, detail, fallback) {
    const policyDuration = num(detail && detail.policyDuration);
    const coverageStart = day10(coverage && coverage.start);
    const coverageEnd = day10(coverage && coverage.end);
    const effective = effectiveDate ? effectiveDate.format('YYYY-MM-DD') : '';
    if (!policyDuration || !coverageStart || !coverageEnd || !effective) {
      return Math.max(0, Math.min(1, num(fallback)));
    }

    // Las coberturas dependientes pueden iniciar despues de la fecha efectiva
    // y tener una vigencia superior al periodo restante de la poliza.
    const calculationStart = coverageStart > effective ? coverageStart : effective;
    const ratio = daysBetween(calculationStart, coverageEnd) / policyDuration;
    return Math.max(0, Math.min(1, ratio));
  };
  const parseJson = function (v, fallback) {
    if (v === null || v === undefined || v === '') return fallback;
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch (e) { return fallback; }
  };
  const first = function (response) {
    if (!response) return null;
    const data = response.outData;
    return Array.isArray(data) ? (data[0] || null) : (data || null);
  };
  const cleanMessage = function (response) {
    return String((response && response.msg) || '').replace(/formula ->[\s\S]*/, '').trim();
  };
  const signo = function (v) { const n = num(v); return n > 0 ? 'axx-monto-pos' : (n < 0 ? 'axx-monto-neg' : 'axx-monto-cero'); };
  const conSigno = function (v) { const n = num(v); return (n > 0 ? '+' : '') + fmt(n); };
  // Tablas de configuracion (fila 0 = encabezados), igual que mapearTablaConfig del formulario.
  const mapTable = function (data) {
    const rows = parseJson(data, []);
    if (!Array.isArray(rows) || !rows.length) return [];
    const headers = rows[0].map(function (h) { return txt(h); });
    return rows.slice(1).map(function (row) {
      const o = {};
      headers.forEach(function (h, i) { if (o[h] === undefined) o[h] = row[i]; });
      return o;
    });
  };
  // Fechas: mismas funciones que el formulario (sumarDias / formatearFecha) para obtener las mismas fechas.
  const formatearFecha = function (fecha) {
    const f = new Date(fecha);
    if (isNaN(f)) return '';
    const yyyy = f.getFullYear();
    const mm = String(f.getMonth() + 1).padStart(2, '0');
    const dd = String(f.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  };
  const sumarDias = function (fechaStr, dias) {
    if (!fechaStr || !dias) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return '';
    fecha.setDate(fecha.getDate() + Number(dias));
    return formatearFecha(fecha);
  };
  const parseCatalog = function (catalog) {
    try {
      const clean = String(catalog || '').replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":').replace(/'/g, '"');
      const list = JSON.parse(clean || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  };
  const fieldIs = function (name, text) { return txt(name).toLowerCase().indexOf(text) >= 0; };
  const isDateField = function (name) { return fieldIs(name, 'f. inicial') || fieldIs(name, 'f. final'); };
  const coverageByCode = function (list, code) {
    return (list || []).find(function (x) { return up(x.code) === up(code); }) || null;
  };

  const ReturnIcon = function () {
    return <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M10.7 5.3 4 12l6.7 6.7 1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4Z" />
    </svg>;
  };

  // ------------------------------------------------------------- estado
  const [policyId, setPolicyId] = useState(0);
  const [policy, setPolicy] = useState(null);
  const [productCoverages, setProductCoverages] = useState([]);
  const [disabledRemove, setDisabledRemove] = useState(false);
  const [cobtarCfg, setCobtarCfg] = useState([]);
  const [adendoCfg, setAdendoCfg] = useState([]);
  const [depCfg, setDepCfg] = useState([]);
  const [baseCessions, setBaseCessions] = useState([]);
  const [baseParts, setBaseParts] = useState([]);
  const [coinsuranceCessions, setCoinsuranceCessions] = useState([]);
  const [contactNames, setContactNames] = useState({});
  const [payPlan, setPayPlan] = useState([]);
  const [selected, setSelected] = useState([]);
  const [params, setParams] = useState({});
  const [numericDrafts, setNumericDrafts] = useState({});
  const [effectiveDate, setEffectiveDate] = useState(moment());
  const [quote, setQuote] = useState(null);
  const [sim, setSim] = useState(null);
  const [reinsuranceConfirmed, setReinsuranceConfirmed] = useState(false);
  const [reaDetailTab, setReaDetailTab] = useState('distribution');
  const [selectedReinsuranceKey, setSelectedReinsuranceKey] = useState(null);
  const [reinsurersReady, setReinsurersReady] = useState(false);
  const [selectedReinsuranceLineKey, setSelectedReinsuranceLineKey] = useState(null);
  const [tab, setTab] = useState('calc');
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [modal, setModal] = useState(false);
  const [note, setNote] = useState('');
  const [noteTouched, setNoteTouched] = useState(false);
  const [buscarPoliza, setBuscarPoliza] = useState('');
  const [coverageModal, setCoverageModal] = useState(false);
  const [coverageDraft, setCoverageDraft] = useState([]);
  const [showErrors, setShowErrors] = useState(false);
  const [lock] = useState({ busy: false });

  const readPolicyId = function () {
    const href = String(window.location.href || '').replace('#/', '');
    const match = href.match(/[?&]policyId=(\d+)/);
    if (match) return Number(match[1]);
    return context && context.policyId ? Number(context.policyId) : 0;
  };
  const openedWithPolicy = /[?&]policyId=\d+/.test(String(window.location.href || ''));
  const retornarAPoliza = function () { if (policyId) window.location.hash = '#/lifepolicy/' + policyId; };

  // ------------------------------------------------------------- carga
  async function cargar(id) {
    if (!id) return;
    setLoading(true); setError(null); setResult(null); setQuote(null); setSim(null);
    setReinsuranceConfirmed(false); setSelected([]); setParams({}); setNumericDrafts({}); setAdendoValues({}); setShowErrors(false);
    try {
      const r = await exe('RepoLifePolicy', { operation: 'GET', filter: 'id=' + Number(id), include: ['Coverages', 'Product'], size: 1, page: 0 });
      const pol = first(r);
      if (!r || !r.ok || !pol) throw new Error(t('No se encontró la póliza') + ' ' + id);
      const product = pol.Product || {};
      const config = parseJson(product.configJson, {}) || {};
      const main = config.Main || {};
      const disabled = parseJson(main.disabledChanges, []) || [];
      setDisabledRemove(Array.isArray(disabled) && disabled.indexOf('ChangeRemoveCoverage') >= 0);
      setProductCoverages(Array.isArray(config.Coverages) ? config.Coverages : []);

      const lob = num(pol.lob);
      const cobtarRamo = COBTAR_POR_RAMO.find(function (x) { return x.lob === lob; });
      const depRamo = DEPENDENCIAS_POR_RAMO.find(function (x) { return x.lob === lob; });
      const calls = [
        cobtarRamo ? exe('GetFullTable', { table: cobtarRamo.table }) : Promise.resolve(null),
        exe('GetFullTable', { table: depRamo ? depRamo.table : 'cfgCoberturaProductoRea' }),
        exe('GetFullTable', { table: 'cfgAnexoAdendoCobertura' }),
        exe('LoadEntities', { entity: 'Cession', filter: 'lifePolicyId = ' + Number(pol.id) + ' AND overwritten = 0', noTracking: true }),
        exe('RepoPayPlan', { operation: 'GET', filter: 'lifePolicyId=' + Number(pol.id) + ' AND cancellationDate IS NULL', size: 0, page: 0 }),
        exe('RepoCoCession', { operation: 'GET', filter: 'lifePolicyId=' + Number(pol.id) + ' AND parentCoCession IS NULL AND overwritten = 0', include: ['Contact'], size: 0 }).catch(function () { return { outData: [] }; })
      ];
      const res = await Promise.all(calls);
      const productCode = up(pol.productCode);
      setCobtarCfg(res[0] && res[0].ok ? mapTable(res[0].outData).filter(function (x) { return up(x.productCode) === productCode; }) : []);
      setDepCfg(res[1] && res[1].ok ? mapTable(res[1].outData).filter(function (x) { return up(x.productCode) === productCode; }) : []);
      setAdendoCfg(res[2] && res[2].ok ? mapTable(res[2].outData) : []);
      const cessions = res[3] && Array.isArray(res[3].outData) ? res[3].outData.filter(function (c) { return up(c.premiumType) !== 'CANCELLATION'; }) : [];
      setBaseCessions(cessions);
      const plan = res[4] && Array.isArray(res[4].outData) ? res[4].outData.slice() : [];
      setCoinsuranceCessions(res[5] && Array.isArray(res[5].outData) ? res[5].outData : []);
      plan.sort(function (a, b) { return String(a.dueDate).localeCompare(String(b.dueDate)) || (a.id - b.id); });
      setPayPlan(plan);
      let parts = [];
      if (cessions.length) {
        const rp = await exe('LoadEntities', { entity: 'CessionPart', filter: 'cessionId IN (' + cessions.map(function (c) { return Number(c.id); }).join(',') + ')', noTracking: true });
        parts = rp && Array.isArray(rp.outData) ? rp.outData : [];
      }
      setBaseParts(parts);
      const ids = parts.map(function (p) { return Number(p.contactId || 0); }).filter(function (v, i, a) { return v > 0 && a.indexOf(v) === i; });
      if (ids.length) {
        const rc = await exe('LoadEntities', { entity: 'Contact', filter: 'id IN (' + ids.join(',') + ')', noTracking: true });
        const names = {};
        (rc && Array.isArray(rc.outData) ? rc.outData : []).forEach(function (c) {
          names[Number(c.id)] = txt(c.FullName || c.fullName || [c.name, c.surname1, c.surname2].filter(Boolean).join(' ')) || String(c.id);
        });
        setContactNames(names);
      }
      // la vista se habilita recien con toda la configuracion cargada (evita cotizar sin tarifas de entrada)
      setPolicyId(Number(pol.id));
      setPolicy(pol);
    } catch (e) {
      setPolicy(null);
      setError(String(e && e.message ? e.message : e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    const id = readPolicyId();
    if (id) cargar(id);
  }, []);

  async function buscar() {
    const value = txt(buscarPoliza);
    if (!value) return;
    if (/^\d+$/.test(value)) { cargar(Number(value)); return; }
    const r = await exe('RepoLifePolicy', { operation: 'GET', filter: "code='" + value.replace(/'/g, "''") + "'", size: 1, page: 0 });
    const pol = first(r);
    if (!pol) { setError(t('No se encontró la póliza') + ' ' + value); return; }
    cargar(Number(pol.id));
  }

  // ------------------------------------------------------------- coberturas elegibles
  const policyCodes = (policy && policy.Coverages ? policy.Coverages : []).map(function (c) { return up(c.code); });
  const eligible = (policy && policy.Coverages ? policy.Coverages : []).filter(function (c) {
    if (!c || !txt(c.code)) return false;
    if (c.mandatory === true) return false;
    if (c.excluded === true || c.hidden === true) return false;
    return true;
  }).map(function (c) {
    return { code: txt(c.code), name: txt(c.name || c.commercialName || c.description), basic: !!c.basic,
      hasTariff: cobtarCfg.some(function (x) { return up(x.coverageCode) === up(c.code); }),
      premium: num(c.premium || c.annualPremium), limit: num(c.limit || c.sumInsured), start: c.start, end: c.end };
  });

  const coverageInfo = function (code) {
    const current = (policy && policy.Coverages ? policy.Coverages : []).find(function (c) { return up(c.code) === up(code); });
    if (current) return current;
    return eligible.find(function (c) { return up(c.code) === up(code); }) || { code: code, name: '' };
  };
  const FolderIcon = function () {
    return <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M3 5.5A2.5 2.5 0 0 1 5.5 3h5l2 2H18.5A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-11Zm2.5-.5a.5.5 0 0 0-.5.5V7h14v-.5a.5.5 0 0 0-.5-.5h-6.8l-2-1H5.5Z" />
    </svg>;
  };
  const getAdendoValue = function (row, names) {
    const keys = Object.keys(row || {});
    const key = keys.find(function (item) { return names.indexOf(txt(item).toLowerCase()) >= 0; });
    return key ? row[key] : '';
  };
  const tipoControlAdendo = function (tipo, parametro) {
    const normalizedType = txt(tipo).toLowerCase();
    const normalizedName = txt(parametro).toLowerCase();
    if (normalizedType === 'fecha' || normalizedType === 'date') return 'date';
    if (normalizedType === 'numero' || normalizedType === 'número' || normalizedType === 'number') return 'number';
    if (normalizedType === 'porcentaje' || normalizedType === 'percent' || normalizedType === '%') return 'percentage';
    if (normalizedType === 'texto' || normalizedType === 'text' || normalizedType === 'string') return 'text';
    if (/fecha|desde|hasta|inicio|final/.test(normalizedName)) return 'date';
    if (/%|porcentaje/.test(normalizedName)) return 'percentage';
    if (/monto|limite|límite|suma|indemn|deducible|valor|semanas|longitud|unidad/.test(normalizedName)) return 'number';
    return 'text';
  };
  const adendoRows = ENDORSEMENT_TYPE === 'EXCLUSIONCOBERTURA' ? [] : (function () {
    const codes = selected.map(up);
    const grouped = {};
    adendoCfg
      .filter(function (row) { return txt(getAdendoValue(row, ['cramo'])) === txt(policy && policy.lob); })
      .filter(function (row) {
        const code = up(getAdendoValue(row, ['ccober']));
        return code && codes.indexOf(code) >= 0;
      })
      .filter(function (row) {
        const product = up(getAdendoValue(row, ['oplan']));
        return !product || product === '0' || product === up(policy && policy.productCode);
      })
      .forEach(function (row) {
        const code = txt(getAdendoValue(row, ['ccober']));
        const key = up(code);
        if (!grouped[key]) {
          const info = coverageInfo(code);
          grouped[key] = { code: code, name: txt(info.name || info.commercialName || info.description), idAnexo: txt(getAdendoValue(row, ['idanexo'])), description: txt(getAdendoValue(row, ['xdescripcion'])), parameters: [] };
        }
        const parameter = txt(getAdendoValue(row, ['parametro']));
        const parameterType = txt(getAdendoValue(row, ['ctipo', 'tipo']));
        if (parameter && !grouped[key].parameters.some(function (item) { return up(item.name) === up(parameter); })) {
          grouped[key].parameters.push({ name: parameter, type: parameterType });
        }
      });
    return Object.keys(grouped).map(function (key) { return grouped[key]; });
  })();
  useEffect(function () {
    if (tab === 'adendos' && !adendoRows.length) setTab('calc');
  }, [adendoRows.length, tab]);

  const [adendoValues, setAdendoValues] = useState({});
  const setAdendoValue = function (code, name, value) {
    const next = Object.assign({}, adendoValues);
    next[up(code)] = Object.assign({}, next[up(code)] || {});
    next[up(code)][name] = value;
    setAdendoValues(next);
    setQuote(null); setSim(null); setReinsuranceConfirmed(false);
  };
  const buildAdendos = function () {
    return adendoRows.map(function (row) {
      const values = adendoValues[up(row.code)] || {};
      const out = { coverageCode: row.code, coverageName: row.name, idAnexo: row.idAnexo, description: row.description };
      row.parameters.forEach(function (parameter, index) { out['Parametro' + (index + 1)] = txt(values[parameter.name]); });
      return out;
    });
  };
  const adendoErrors = function () {
    const errors = [];
    adendoRows.forEach(function (row) {
      const values = adendoValues[up(row.code)] || {};
      row.parameters.forEach(function (parameter) {
        if (!txt(values[parameter.name])) errors.push(t('Cobertura') + ' ' + row.code + ': ' + t('falta') + ' «' + parameter.name + '».');
      });
    });
    return errors;
  };

  const fieldsOf = function (code) {
    return cobtarCfg.filter(function (x) { return up(x.coverageCode) === up(code); }).map(function (x) {
      const type = txt(x.type).toLowerCase();
      const desc = txt(x.description);
      return {
        name: txt(x.name), description: desc || txt(x.name), type: type,
        catalog: parseCatalog(x.catalog),
        disabled: type === 'none' || desc.toLowerCase() === 'none',
        readOnly: txt(x.readOnly).toLowerCase() === 'true',
        required: txt(x.required).toLowerCase() === 'true'
      };
    });
  };

  // Fechas de las coberturas vigentes seleccionadas para excluir.
  const dependencyOf = function (code) {
    const cfg = depCfg.find(function (x) { return up(x.coverageCode) === up(code); });
    if (!cfg) return '';
    const candidates = [cfg.coverageCodeDep, cfg.coberturaPrincipal];
    for (let i = 0; i < candidates.length; i++) {
      const v = up(candidates[i]);
      if (v && v !== '0' && v !== '-1' && v !== 'NULL' && v !== up(code)) return v;
    }
    return '';
  };
  const computeDates = function (allParams) {
    const out = {};
    const policyStart = formatearFecha(policy && policy.start);
    const policyEnd = formatearFecha(policy && policy.end);
    const existingEnd = function (code) {
      const cov = (policy && policy.Coverages ? policy.Coverages : []).find(function (c) { return up(c.code) === up(code); });
      return cov ? formatearFecha(cov.end) : '';
    };
    const calculating = {};
    const calc = function (code) {
      const k = up(code);
      if (out[k]) return out[k];
      if (calculating[k]) return null;
      calculating[k] = true;
      const values = allParams[k] || {};
      const durationField = fieldsOf(k).find(function (f) { return fieldIs(f.name, 'duraci'); });
      const duration = durationField ? num(values[durationField.name]) : 0;
      let start = policyStart;
      let root = dependencyOf(k);
      let guard = 0;
      while (root && dependencyOf(root) && guard < 10) { root = dependencyOf(root); guard++; }
      if (root) {
        if (selected.map(up).indexOf(root) >= 0) {
          const r = calc(root);
          if (r && r.end) start = r.end;
        } else {
          const e = existingEnd(root);
          if (e) start = e;
        }
      }
      let end = policyEnd;
      if (duration > 0 && start) end = sumarDias(start, duration);
      out[k] = { start: start, end: end };
      calculating[k] = false;
      return out[k];
    };
    selected.forEach(calc);
    return out;
  };
  const dates = computeDates(params);

  const valueFor = function (code, field) {
    const k = up(code);
    const d = dates[k] || {};
    if (fieldIs(field.name, 'f. inicial')) return d.start || '';
    if (fieldIs(field.name, 'f. final')) return d.end || '';
    const v = (params[k] || {})[field.name];
    return v === undefined ? null : v;
  };
  const setValue = function (code, name, value) {
    const k = up(code);
    const next = Object.assign({}, params);
    next[k] = Object.assign({}, next[k] || {});
    next[k][name] = value;
    setParams(next);
    setQuote(null); setSim(null); setReinsuranceConfirmed(false);
  };
  const isEmpty = function (v) { return v === null || v === undefined || txt(v) === ''; };
  const validationErrors = function () {
    const errors = [];
    if (!selected.length) errors.push(t('Seleccione al menos una cobertura opcional.'));
    if (!effectiveDate) errors.push(t('Indique la fecha efectiva del endoso.'));
    if (policy && effectiveDate) {
      const eff = effectiveDate.format('YYYY-MM-DD');
      if (eff < day10(policy.start) || eff > day10(policy.end)) errors.push(t('La fecha efectiva debe estar dentro de la vigencia de la póliza.'));
    }
    return errors;
  };
  // Filas de tarifa de entrada con el mismo formato que hiddenCobtar (construirCobtar del formulario).
  const buildCobtar = function () { return []; };

  const buildCoverageState = function (removedRows) {
    const current = (policy && policy.Coverages ? policy.Coverages : []).map(function (c) {
      const removed = selected.map(up).indexOf(up(c.code)) >= 0;
      return {
        key: 'current-' + txt(c.code), code: txt(c.code), name: txt(c.name || c.commercialName || c.description),
        limit: num(c.limit || c.sumInsured), premium: num(c.premium || c.annualPremium),
        deductible: num(c.deductible), start: c.start, end: c.end, origin: t('Actual'),
        change: removed ? t('Se excluirá') : t('Sin modificación')
      };
    });
    return current;
  };

  // ------------------------------------------------------------- cotizacion
  const buildBasePayload = function () {
    const before = policy && policy.Coverages ? policy.Coverages : [];
    const removed = before.filter(function (c) { return selected.map(up).indexOf(up(c.code)) < 0; });
    return {
      policyId: policyId,
      jBeforeCoverages: JSON.stringify(before),
      jAfterRemovedCoverages: JSON.stringify(removed),
      jAmendments: '[]',
      effectiveDate: effectiveDate.format('YYYY-MM-DD') + 'T12:00:00'
    };
  };

  async function cotizar() {
    const errors = validationErrors();
    setShowErrors(true);
    if (errors.length) { setError(errors.join(' ')); return; }
    setQuoting(true); setError(null); setResult(null); setQuote(null); setSim(null); setReinsuranceConfirmed(false);
    try {
      const payload = Object.assign(buildBasePayload(), { jAdditional: JSON.stringify({ endorsementType: ENDORSEMENT_TYPE, cobtar: [], adendos: [] }) });
      const r = await exe('ChangeRemoveCoverage', payload);
      const o = first(r);
      if (!r || !r.ok || !o) throw new Error(t('No se pudo cotizar el endoso') + ': ' + cleanMessage(r));
      const detail = parseJson(o.jDetail, {}) || {};
      const policyDuration = num(detail.policyDuration) || daysBetween(policy && policy.start, policy && policy.end);
      const effective = effectiveDate.format('YYYY-MM-DD');
      const selectedRows = selected.map(function (code) {
        return eligible.find(function (c) { return up(c.code) === up(code); });
      }).filter(Boolean).map(function (c) {
        const start = day10(c.start) || day10(policy.start);
        const end = day10(c.end) || day10(policy.end);
        const calculationStart = start > effective ? start : effective;
        const duration = daysBetween(start, end) || policyDuration;
        const remainingDays = daysBetween(calculationStart, end);
        const coverageFactor = Math.max(0, Math.min(1, remainingDays / (duration || 1)));
        return { code: txt(c.code), name: txt(c.name), limit: num(c.limit), premium: num(c.premium),
          deductible: 0, prorated: -money(num(c.premium) * coverageFactor), prorate: coverageFactor,
          start: c.start, end: c.end, removed: true };
      });
      const annualMovement = -money(selectedRows.reduce(function (sum, c) { return sum + num(c.premium); }, 0));
      const proratedMovement = money(selectedRows.reduce(function (sum, c) { return sum + num(c.prorated); }, 0));
      const prorate = selectedRows.length ? Math.abs(proratedMovement) / (Math.abs(annualMovement) || 1) : 0;
      const bill = o.Bill || {};
      const diff = o.BillDiff || {};
      const hasBill = Object.keys(bill).length > 0 || Object.keys(diff).length > 0;
      const currentAnnualPremium = (policy && policy.Coverages ? policy.Coverages : [])
        .reduce(function (sum, coverage) { return sum + num(coverage.premium || coverage.annualPremium); }, 0);
      const beforePremium = hasBill ? num(bill.anualPremium) - num(diff.annualPremium) : money(currentAnnualPremium);
      const beforeTax = hasBill ? num(bill.tax) - num(diff.tax) : num(policy.tax);
      const beforeTotal = hasBill ? num(bill.anualTotal) - num(diff.annualTotal) : beforePremium + beforeTax;
      const movementPremium = hasBill ? num(diff.annualPremium) : annualMovement;
      const movementTax = hasBill ? num(diff.tax) : 0;
      const movementTotal = hasBill ? num(diff.annualTotal) : movementPremium + movementTax;
      const before = {
        premium: beforePremium,
        tax: beforeTax,
        total: beforeTotal
      };
      setQuote({
        raw: o, payload: payload, cobtar: [], prorate: prorate, detail: Object.assign({}, detail, {
          policyDuration: policyDuration, remainingDays: Math.round(Math.abs(proratedMovement) / (Math.abs(annualMovement) || 1) * policyDuration)
        }), rows: selectedRows, zero: [],
        jNewPayPlan: parseJson(o.jNewPayPlan, []) || [],
        billing: {
          premium: { before: before.premium, after: hasBill ? num(bill.anualPremium) : money(before.premium + movementPremium), movement: movementPremium, prorated: proratedMovement },
          tax: { before: before.tax, after: hasBill ? num(bill.tax) : money(before.tax + movementTax), movement: movementTax, prorated: 0 },
          total: { before: before.total, after: hasBill ? num(bill.anualTotal) : money(before.total + movementTotal), movement: movementTotal, prorated: proratedMovement }
        },
        stateRows: buildCoverageState(selectedRows)
      });
      setSim(simulate(selectedRows));
    } catch (e) {
      setError(String(e && e.message ? e.message : e));
    } finally {
      setQuoting(false);
    }
  }

  // ------------------------------------------------------------- reaseguro del movimiento
  // La distribucion se muestra sobre el estado final de la poliza: coberturas
  // existentes mas las nuevas del endoso.
  const finalCoverageRows = function (addedRows) {
    const byCode = {};
    (policy && policy.Coverages ? policy.Coverages : []).forEach(function (coverage) {
      const code = up(coverage.code);
      if (!code) return;
      if (selected.map(up).indexOf(code) >= 0) return;
      byCode[code] = {
        code: txt(coverage.code), name: txt(coverage.name || coverage.commercialName || coverage.description),
        limit: num(coverage.limit || coverage.sumInsured), premium: num(coverage.premium || coverage.annualPremium),
        deductible: num(coverage.deductible), isNew: false
      };
    });
    (addedRows || []).filter(function (coverage) { return coverage.removed !== true; }).forEach(function (coverage) {
      const code = up(coverage.code);
      if (!code) return;
      byCode[code] = Object.assign({}, byCode[code] || {}, {
        code: txt(coverage.code), name: txt(coverage.name || coverage.commercialName || coverage.description),
        limit: num(coverage.limit), premium: num(coverage.premium), deductible: num(coverage.deductible), isNew: true,
        prorated: num(coverage.prorated)
      });
    });
    return Object.keys(byCode).map(function (code) { return byCode[code]; });
  };
  const simulate = function (rows) {
    const groups = [];
    baseCessions.forEach(function (c) {
      const key = Number(c.contractId || 0) + '|' + txt(c.lineId);
      if (!groups.some(function (g) { return g.key === key; })) groups.push({ key: key, template: c });
    });
    const out = [];
    const finalRows = finalCoverageRows(rows);
    finalRows.forEach(function (cov) {
      groups.forEach(function (g) {
        const tpl = g.template;
        const source = baseCessions.find(function (cession) {
          const coverageById = (policy && policy.Coverages ? policy.Coverages : []).find(function (item) {
            return String(item.id || '') === String(cession.coverageId || '');
          });
          const cessionCode = cession.coverageCode || cession.code || (coverageById && coverageById.code);
          return String(cession.contractId) === String(tpl.contractId)
            && String(cession.lineId) === String(tpl.lineId)
            && up(cessionCode) === up(cov.code);
        });
        // Las coberturas existentes solo pertenecen a las lineas donde ya
        // existe una cesion. Las nuevas se distribuyen sobre cada plantilla
        // vigente del contrato, como en la vista de cambio de vigencia.
        if (!source && !cov.isNew) return;
        const distributionSource = source || tpl;
        const lineType = normalizeReinsuranceLine(tpl.lineId);
        const isRetentionLine = lineType === 'RET';
        // En varias pólizas la retención se almacena dentro de la línea
        // Cuota Parte, por lo que esa línea debe conservar ambos porcentajes.
        const carriesEmbeddedRetention = lineType === 'CUOTA PARTE';
        const propCed = isRetentionLine || carriesEmbeddedRetention
          ? num(distributionSource.proportionCed !== undefined ? distributionSource.proportionCed : tpl.proportionCed)
          : 0;
        const propRe = isRetentionLine
          ? 0
          : num(distributionSource.proportionRe !== undefined ? distributionSource.proportionRe : tpl.proportionRe);
        const movementPremium = cov.isNew ? money(cov.premium) : 0;
        const prorated = cov.isNew ? money(cov.prorated) : 0;
        const premiumCedant = money(cov.premium * propCed);
        const premiumRe = money(cov.premium * propRe);
        const sumInsuredCedant = money(cov.limit * propCed);
        const commissionRate = num(distributionSource.premiumRe) ? num(distributionSource.comissionCedant || distributionSource.commission) / num(distributionSource.premiumRe) : 0;
        const taxRate = num(distributionSource.premiumRe) ? num(distributionSource.tax) / num(distributionSource.premiumRe) : 0;
        const sourceId = distributionSource.id || tpl.id;
        const parts = baseParts.filter(function (p) { return Number(p.cessionId) === Number(sourceId); }).map(function (p) {
          return { contactId: Number(p.contactId || 0), brokerId: p.brokerId || null, split: num(p.split) };
        });
        const participants = parts.map(function (p) {
          const split = num(p.split) / 100;
          return Object.assign({}, p, {
            sumInsured: money((cov.limit - sumInsuredCedant) * split),
            premium: money(premiumRe * split), commission: money(premiumRe * commissionRate * split), tax: money(premiumRe * taxRate * split)
          });
        });
        out.push({
          key: g.key + '|' + cov.code, contractId: Number(tpl.contractId || 0), lineId: txt(tpl.lineId),
          coverageCode: cov.code, coverageName: cov.name,
          counts: true,
          premiumMovement: movementPremium, prorated: prorated, sumInsuredMovement: cov.isNew ? money(cov.limit) : 0,
          finalPremium: money(cov.premium), finalSum: money(cov.limit),
          proportionCed: propCed, proportionRe: propRe,
          premiumCedant: premiumCedant, premiumRe: premiumRe,
          sumInsuredCedant: sumInsuredCedant, sumInsuredRe: money(cov.limit * propRe),
          commissionRate: commissionRate, taxRate: taxRate,
          commission: money(premiumRe * commissionRate), tax: money(premiumRe * taxRate),
          participants: participants
        });
      });
    });
    return { rows: out, hasContracts: groups.length > 0, finalRows: finalRows };
  };
  const setSplit = function (key, index, value) {
    if (!sim) return;
    const rows = sim.rows.map(function (r) {
      if (r.key !== key) return r;
      const parts = r.participants.map(function (p, i) {
        if (i !== index) return p;
        const split = num(value) / 100;
        return Object.assign({}, p, { split: num(value), sumInsured: money(r.sumInsuredRe * split), premium: money(r.premiumRe * split), commission: money(r.commission * split), tax: money(r.tax * split) });
      });
      return Object.assign({}, r, { participants: parts });
    });
    setSim(Object.assign({}, sim, { rows: rows }));
    setReinsuranceConfirmed(false);
  };
  const validateReinsurance = function () {
    const errors = [];
    if (!sim || !sim.rows || !sim.rows.length) return { ok: false, errors: [t('Cotice el endoso antes de confirmar el reaseguro.')] };
    const byCoverage = {};
    const byLine = {};
    const closeEnough = function (a, b) { return Math.abs(money(a) - money(b)) <= 0.01; };
    sim.rows.forEach(function (r) {
      const groupName = t('Contrato') + ' ' + r.contractId + ' ' + t('línea') + ' ' + r.lineId;
      const negativeFields = [r.premiumCedant, r.premiumRe, r.sumInsuredCedant, r.sumInsuredRe];
      if (negativeFields.some(function (value) { return num(value) < -0.01; })) {
        errors.push(groupName + ': ' + t('la cobertura') + ' ' + r.coverageCode + ' ' + t('tiene importes negativos en su distribución.'));
      }
      const coverageCode = up(r.coverageCode);
      if (!byCoverage[coverageCode]) byCoverage[coverageCode] = { premium: 0, sum: 0, placement: 0, expectedPremium: num(r.finalPremium), expectedSum: num(r.finalSum) };
      byCoverage[coverageCode].premium += num(r.premiumCedant) + num(r.premiumRe);
      byCoverage[coverageCode].sum += num(r.sumInsuredCedant) + num(r.sumInsuredRe);
      byCoverage[coverageCode].placement += num(r.proportionCed) + num(r.proportionRe);

      const lineKey = String(r.contractId) + '|' + String(r.lineId);
      if (!byLine[lineKey]) byLine[lineKey] = { contractId: r.contractId, lineId: r.lineId, cededPremium: 0, cededSum: 0, commission: 0, tax: 0, participants: {} };
      const line = byLine[lineKey];
      line.cededPremium += num(r.premiumRe);
      line.cededSum += num(r.sumInsuredRe);
      line.commission += num(r.commission);
      line.tax += num(r.tax);
      (r.participants || []).forEach(function (participant) {
        const participantKey = String(participant.contactId || '') + '|' + String(participant.brokerId || '');
        if (!line.participants[participantKey]) line.participants[participantKey] = { split: num(participant.split), sumInsured: 0, premium: 0, commission: 0, tax: 0 };
        const item = line.participants[participantKey];
        item.sumInsured += num(participant.sumInsured);
        item.premium += num(participant.premium);
        item.commission += num(participant.commission);
        item.tax += num(participant.tax);
      });
    });
    Object.keys(byLine).forEach(function (key) {
      const line = byLine[key];
      if (line.cededPremium <= 0.01 && line.cededSum <= 0.01) return;
      const participants = Object.keys(line.participants).map(function (participantKey) { return line.participants[participantKey]; });
      if (!participants.length) {
        errors.push(t('Contrato') + ' ' + line.contractId + ' / ' + line.lineId + ': ' + t('un contrato cedido debe tener aceptantes distribuidos al 100%.'));
        return;
      }
      const split = participants.reduce(function (sum, participant) { return sum + num(participant.split); }, 0);
      if (Math.abs(split - 100) > 0.01) errors.push(t('Contrato') + ' ' + line.contractId + ' / ' + line.lineId + ': ' + t('los aceptantes de la línea deben sumar 100%.'));
      if (!closeEnough(participants.reduce(function (sum, participant) { return sum + participant.sumInsured; }, 0), line.cededSum)) errors.push(t('Contrato') + ' ' + line.contractId + ' / ' + line.lineId + ': ' + t('la suma de aceptantes no coincide con la suma cedida.'));
      if (!closeEnough(participants.reduce(function (sum, participant) { return sum + participant.premium; }, 0), line.cededPremium)) errors.push(t('Contrato') + ' ' + line.contractId + ' / ' + line.lineId + ': ' + t('la prima de aceptantes no coincide con la prima cedida.'));
      if (!closeEnough(participants.reduce(function (sum, participant) { return sum + participant.commission; }, 0), line.commission)) errors.push(t('Contrato') + ' ' + line.contractId + ' / ' + line.lineId + ': ' + t('la comisión de aceptantes no coincide con la línea.'));
      if (!closeEnough(participants.reduce(function (sum, participant) { return sum + participant.tax; }, 0), line.tax)) errors.push(t('Contrato') + ' ' + line.contractId + ' / ' + line.lineId + ': ' + t('el impuesto de aceptantes no coincide con la línea.'));
    });
    Object.keys(byCoverage).forEach(function (code) {
      const item = byCoverage[code];
      if (Math.abs(item.placement - 1) > 0.0001) errors.push(t('La colocación de la cobertura') + ' ' + code + ' ' + t('debe sumar 100%.'));
      if (!closeEnough(item.premium, item.expectedPremium)) errors.push(t('La prima distribuida de la cobertura') + ' ' + code + ' ' + t('no coincide con la prima final.'));
      if (!closeEnough(item.sum, item.expectedSum)) errors.push(t('La suma distribuida de la cobertura') + ' ' + code + ' ' + t('no coincide con la suma final.'));
    });
    (contractRows || []).forEach(function (contract) {
      const distributedSum = (contract.lineRows || []).reduce(function (sum, row) { return sum + num(row.sum); }, 0);
      const distributedPremium = (contract.lineRows || []).reduce(function (sum, row) { return sum + num(row.premium); }, 0);
      const distributedPercentage = (contract.lineRows || []).filter(function (row) { return !row.coinsurance; }).reduce(function (sum, row) { return sum + num(row.percentage); }, 0);
      if (Math.abs(distributedPercentage - 100) > 0.01) errors.push(t('Contrato') + ' ' + contract.contractId + ': ' + t('la distribución debe sumar 100%.'));
      if (!closeEnough(distributedSum, contract.finalSum)) errors.push(t('La suma distribuida del contrato') + ' ' + contract.contractId + ' ' + t('no coincide con la suma final.'));
      if (!closeEnough(distributedPremium, contract.finalPremium)) errors.push(t('La prima distribuida del contrato') + ' ' + contract.contractId + ' ' + t('no coincide con la prima final.'));
    });
    return { ok: errors.length === 0, errors: errors };
  };
  const confirmarReaseguro = function () {
    const v = validateReinsurance();
    if (!v.ok) { setError(v.errors.join(' ')); setTab('rea'); return; }
    setError(null);
    setReinsuranceConfirmed(true);
    A.message.success(t('Reaseguro del movimiento confirmado.'));
  };
  const guardarDistribucionMemoria = function () {
    const validation = validateReinsurance();
    if (!validation.ok) {
      setError(validation.errors.join(' '));
      A.message.error(t('La distribución no permite guardar') + ': ' + validation.errors.join(' '));
      return;
    }
    setError(null);
    setReinsuranceConfirmed(false);
    setReinsurersReady(false);
    setReaDetailTab('distribution');
    A.message.success(t('La distribución de reaseguro fue guardada en memoria.'));
  };
  const buildSnapshot = function () {
    const snapshot = {
      distribution: [], participants: [], coinsurance: [],
      sourceCessionIds: baseCessions.map(function (c) { return Number(c.id || 0); }).filter(function (id) { return id > 0; }),
      sourceCoinsuranceIds: []
    };
    (sim ? sim.rows : []).forEach(function (r) {
      snapshot.distribution.push({
        contractId: r.contractId, lineId: r.lineId, coverageCode: r.coverageCode,
        premiumMovement: r.premiumMovement, sumInsuredMovement: r.sumInsuredMovement,
        premiumCedant: r.premiumCedant, sumInsuredCedant: r.sumInsuredCedant,
        premiumRe: r.premiumRe, sumInsuredRe: r.sumInsuredRe,
        commission: r.commission, tax: r.tax, proportionCed: r.proportionCed, proportionRe: r.proportionRe
      });
      r.participants.forEach(function (p) {
        snapshot.participants.push({
          contractId: r.contractId, lineId: r.lineId, coverageCode: r.coverageCode, cessionId: 0,
          contactId: p.contactId, brokerId: p.brokerId, split: p.split,
          sumInsured: money(r.sumInsuredRe * p.split / 100), premium: money(r.premiumRe * p.split / 100),
          commission: money(r.commission * p.split / 100), tax: money(r.tax * p.split / 100)
        });
      });
    });
    return snapshot;
  };

  // ------------------------------------------------------------- ejecucion
  const puedeEjecutar = !!(quote && sim && reinsuranceConfirmed && !running && !disabledRemove && !(result && result.ok));

  async function ejecutar() {
    if (lock.busy || running) return;
    if (!txt(note)) { setNoteTouched(true); return; }
    const v = validateReinsurance();
    if (!v.ok) { setError(v.errors.join(' ')); return; }
    lock.busy = true;
    setRunning(true); setError(null); setModal(false);
    const failures = [];
    let keepLocked = false;
    let changeId = 0;
    let prepared = false;
    let executed = false;
    const snapshot = buildSnapshot();
    const jAdditional = {
      endorsementType: ENDORSEMENT_TYPE,
      effectiveDate: effectiveDate.format('YYYY-MM-DD'),
      coverages: quote.rows.map(function (r) { return { code: r.code, name: r.name, limit: r.limit, premium: r.premium, prorated: r.prorated, deductible: r.deductible }; }),
      cobtar: [],
      adendos: [],
      prorate: quote.prorate,
      premium: quote.billing.premium.movement, tax: quote.billing.tax.movement, total: quote.billing.total.movement,
      proratedPremium: quote.billing.premium.prorated, proratedTotal: quote.billing.total.prorated,
      reinsuranceSnapshot: snapshot
    };
    const runReinsurance = async function (mode) {
      const response = await exe('ExeChain', { chain: 'cmdApplyReaChangeCoverage', context: JSON.stringify({ changeId: changeId, mode: mode }) });
      let data = response && response.outData;
      if (typeof data === 'string') data = parseJson(data, null);
      if (Array.isArray(data) && data.length === 1) data = data[0];
      if (!response || response.ok === false || (data && data.ok === false)) {
        throw new Error((data && data.msg) || cleanMessage(response) || t('No se pudo procesar el reaseguro del endoso'));
      }
      return data || response;
    };
    try {
      // 1. registro del endoso de exclusion
      const created = await exe('ChangeRemoveCoverage', Object.assign({}, quote.payload, {
        jAdditional: JSON.stringify(jAdditional), operation: 'ADD', code: null, note: txt(note)
      }));
      const change = first(created);
      if (!created || !created.ok || !change || !change.id) throw new Error(t('El endoso no pudo ser creado') + ': ' + cleanMessage(created));
      changeId = Number(change.id);
      // cotejo: las coberturas seleccionadas deben quedar fuera del estado final
      const saved = parseJson(change.jAfterRemovedCoverages, []) || [];
      const mismatch = selected.filter(function (code) {
        return saved.some(function (c) { return up(c.code) === up(code); });
      });
      if (mismatch.length) {
        await exe('AbortChange', { changeId: changeId });
        throw new Error(t('La cobertura excluida todavía aparece en el estado registrado; el endoso') + ' ' + changeId + ' ' + t('fue anulado. Vuelva a cotizar.'));
      }
      // 2. aprobacion del circuito
      let processId = Number(change.processId || 0);
      if (!processId) {
        const loaded = first(await exe('LoadEntity', { entity: 'Change', fields: 'id,processId', filter: 'id=' + changeId, noTracking: true }));
        processId = Number(loaded && loaded.processId || 0);
      }
      if (processId) {
        const wf = await exe('GotoStep', { procesoId: processId, estado: 'APROVED' });
        const wfr = Array.isArray(wf) ? (wf[0] || {}) : wf;
        if (!wfr || !wfr.ok) throw new Error(t('No se pudo aprobar el workflow del endoso') + ': ' + cleanMessage(wfr));
      }
      // 3. reaseguro confirmado
      if (snapshot.distribution.length) {
        prepared = true;
        await runReinsurance('PREPARE_EXECUTION');
      }
      // 4. ejecucion del endoso
      const exeResponse = await exe('ExeChangeRemoveCoverage', { changeId: changeId, exeNow: true, operation: 'EXECUTE', noTracking: true });
      if (!exeResponse || !exeResponse.ok) throw new Error(t('El endoso fue creado pero no pudo ejecutarse') + ': ' + cleanMessage(exeResponse));
      executed = true;

      // 5. cuotas del endoso (la ejecucion inmediata no las genera)
      try {
        const ch = first(await exe('LoadEntity', { entity: 'Change', fields: 'id,lifePolicyId,effectiveDate,jNewPayPlan,Discriminator', filter: 'id=' + changeId, noTracking: true }));
        if (ch && txt(ch.jNewPayPlan) && txt(ch.jNewPayPlan) !== '[]') {
          const pp = await exe('MakePayPlan', {
            policyId: policyId, initial: ch.effectiveDate, Change: ch,
            policy: { id: policyId, payerId: policy.payerId, holderId: policy.holderId, contractYear: policy.contractYear, currency: policy.currency }
          });
          if (!pp || !pp.ok) failures.push(t('cuotas del endoso') + ': ' + cleanMessage(pp));
        }
      } catch (ppError) { failures.push(t('cuotas del endoso') + ': ' + String(ppError && ppError.message ? ppError.message : ppError)); }

      // 6. las cesiones del movimiento quedan asociadas a las coberturas vigentes
      try {
        if (snapshot.distribution.length) {
          const covs = await exe('RepoLifePolicy', { operation: 'GET', filter: 'id=' + policyId, include: ['Coverages'], size: 1, page: 0 });
          const ces = await exe('LoadEntities', { entity: 'Cession', filter: 'lifePolicyId = ' + policyId + ' AND changeId = ' + changeId, noTracking: true });
          const covPolicy = first(covs);
          const covList = covPolicy && Array.isArray(covPolicy.Coverages) ? covPolicy.Coverages : [];
          const cesList = ces && Array.isArray(ces.outData) ? ces.outData : [];
          // sin clausuras dentro del bucle: buble convertiria el cuerpo en una funcion no async
          for (var ci = 0; ci < cesList.length; ci++) {
            var c = cesList[ci];
            var cov = coverageByCode(covList, c.coverageCode);
            if (cov && Number(cov.id) !== Number(c.coverageId)) {
              const sf = await exe('SetField', { entity: 'Cession', entityId: Number(c.id), fieldValue: 'coverageId=' + Number(cov.id), raw: true });
              if (!sf || !sf.ok) failures.push(t('cobertura de la cesión') + ' ' + c.id + ': ' + cleanMessage(sf));
            }
          }
        }
      } catch (cesError) { failures.push(t('cobertura de las cesiones') + ': ' + String(cesError && cesError.message ? cesError.message : cesError)); }

      // 7. quitar las tarifas y adendos de las coberturas excluidas de los objetos asegurados
      try {
        const lob = num(policy && policy.lob);
        const ramo = COBTAR_POR_RAMO.find(function (item) { return item.lob === lob; });
        const excludedCodes = selected.map(up);
        const updateHidden = async function (objectCode, hiddenName, label) {
          const definition = first(await exe('RepoObjectDefinition', { operation: 'GET', filter: "code = '" + objectCode + "'", noTracking: true }));
          if (!definition || !definition.id) {
            failures.push(label + ': no se encontró la definición del objeto ' + objectCode);
            return;
          }
          const response = await exe('LoadEntities', {
            entity: 'InsuredObject',
            filter: 'lifePolicyId = ' + policyId + ' AND objectDefinitionId = ' + Number(definition.id),
            noTracking: true
          });
          const objects = response && Array.isArray(response.outData) ? response.outData : [];
          if (!objects.length) {
            failures.push(label + ': la póliza no tiene objeto asegurado ' + objectCode);
            return;
          }
          for (let oi = 0; oi < objects.length; oi++) {
            const object = objects[oi];
            const values = parseJson(object.jValues, []) || [];
            let hidden = values.find(function (item) { return item && item.name === hiddenName; });
            if (!hidden) {
              hidden = { type: 'hidden', name: hiddenName, access: false, userData: ['[]'] };
              values.push(hidden);
            }
            const current = parseJson(Array.isArray(hidden.userData) ? hidden.userData[0] : hidden.userData, []) || [];
            const remaining = current.filter(function (row) {
              const code = row && (row.coverageCode || row.code || row.ccober);
              return excludedCodes.indexOf(up(code)) < 0;
            });
            hidden.userData = [JSON.stringify(remaining)];
            const sql = "jValues=N'" + JSON.stringify(values).replace(/'/g, "''") + "'";
            const saved = await exe('SetField', { entity: 'InsuredObject', entityId: Number(object.id), fieldValue: sql, raw: true });
            if (!saved || !saved.ok) failures.push(label + ' ' + Number(object.id) + ': ' + cleanMessage(saved));
          }
        };

        if (ramo) await updateHidden(ramo.object, 'hiddenCobtar', 'Tarifas de entrada');
        if (lob === 96 || lob === 52) await updateHidden('DT_RAMO_TECNICO', 'hiddenAdendos', 'Adendos');
      } catch (objectError) {
        failures.push(t('datos de las coberturas excluidas') + ': ' + String(objectError && objectError.message ? objectError.message : objectError));
      }

      // 8. documento del endoso
      try {
        const doc = await exe('ExeChain', { chain: 'cmdGenertFormatoEmdoso', context: JSON.stringify({ changeId: changeId }) });
        const data = doc && doc.outData;
        if (!doc || !doc.ok || (data && data.ok === false)) failures.push(t('documento del endoso') + ': ' + ((data && data.msg) || cleanMessage(doc)));
      } catch (docError) { failures.push(t('documento del endoso') + ': ' + String(docError && docError.message ? docError.message : docError)); }

      // 9. lo escrito
      let written = [];
      try {
        const w = await exe('LoadEntities', { entity: 'Cession', filter: 'lifePolicyId = ' + policyId + ' AND changeId = ' + changeId + ' AND overwritten = 0', noTracking: true });
        written = w && Array.isArray(w.outData) ? w.outData.filter(function (c) {
          return quote.rows.some(function (r) { return up(r.code) === up(c.coverageCode); });
        }) : [];
      } catch (wError) { written = []; }
      const message = failures.length
        ? t('El endoso') + ' ' + changeId + ' ' + t('se ejecutó, pero hubo problemas en: ') + failures.join(' | ')
          : t('El endoso') + ' ' + changeId + ' ' + t('se ejecutó correctamente: coberturas excluidas, cuotas generadas y reaseguro aplicado.');
      setResult({ ok: true, changeId: changeId, msg: message, written: written });
      if (failures.length) A.message.warning(message); else A.message.success(message);
      keepLocked = true;
      await new Promise(function (resolve) { setTimeout(resolve, 700); });
      retornarAPoliza();
    } catch (e) {
      if (prepared && !executed && changeId) {
        try { await runReinsurance('ROLLBACK'); } catch (rb) { failures.push(String(rb && rb.message ? rb.message : rb)); }
      }
      const message = String(e && e.message ? e.message : e) + (failures.length ? ' | ' + failures.join(' | ') : '');
      setError(message);
      A.message.error(message);
    } finally {
      if (!keepLocked) lock.busy = false;
      setRunning(false);
    }
  }

  // ------------------------------------------------------------- columnas
  const colsEligible = [
    { title: t('Código'), dataIndex: 'code', width: 90 },
    { title: t('Cobertura'), dataIndex: 'name', width: 440, ellipsis: true },
    { title: t('Prima vigente'), dataIndex: 'premium', width: 150, align: 'right', render: function (v) { return fmt(v); } }
  ];
  const colsQuote = [
    { title: t('Código'), dataIndex: 'code', width: 80 },
    { title: t('Cobertura'), dataIndex: 'name' },
    { title: t('Suma asegurada'), dataIndex: 'limit', align: 'right', width: 140, render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } },
    { title: t('Prima anual'), dataIndex: 'premium', align: 'right', width: 120, render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } },
    { title: t('Prima prorrateada'), dataIndex: 'prorated', align: 'right', width: 140, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Deducible'), dataIndex: 'deductible', align: 'right', width: 110, render: function (v) { return fmt(v); } },
    { title: t('Vigencia'), dataIndex: 'start', width: 190, render: function (v, r) { return day10(r.start) + ' → ' + day10(r.end); } }
  ];
  const colsResumen = [
    { title: t('Concepto'), dataIndex: 'label' },
    { title: t('Anterior (anual)'), dataIndex: 'before', align: 'right', render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Movimiento anual'), dataIndex: 'movement', align: 'right', render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Nuevo (anual)'), dataIndex: 'after', align: 'right', render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } },
    { title: t('A facturar (prorrata)'), dataIndex: 'prorated', align: 'right', render: function (v) { return <b>{fmt(v)}</b>; } }
  ];
  const colsRea = [
    { title: t('Cobertura'), dataIndex: 'coverageCode', width: 100 },
    { title: t('Descripción'), dataIndex: 'coverageName', width: 230, ellipsis: true },
    { title: t('Suma para el contrato'), dataIndex: 'counts', width: 160, render: function (v) { return v ? <Tag color="blue">{t('Sí')}</Tag> : <Tag>{t('No')}</Tag>; } },
    { title: t('Suma movimiento'), dataIndex: 'sumInsuredMovement', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Movimiento'), dataIndex: 'premiumMovement', align: 'right', width: 120, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Base prorrateada'), dataIndex: 'prorated', align: 'right', width: 140, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Pct. Retención'), dataIndex: 'proportionCed', align: 'right', width: 120, render: function (v) { return pct(v); } },
    { title: t('Suma retención'), dataIndex: 'sumInsuredCedant', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Prima retención'), dataIndex: 'premiumCedant', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Pct. Cedido'), dataIndex: 'proportionRe', align: 'right', width: 110, render: function (v) { return pct(v); } },
    { title: t('Suma cedida'), dataIndex: 'sumInsuredRe', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Prima cedida'), dataIndex: 'premiumRe', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Comisión'), dataIndex: 'commission', align: 'right', width: 120, render: function (v) { return fmt(v); } },
    { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 120, render: function (v) { return fmt(v); } }
  ];
  const reinsuranceGroups = (function () {
    const groups = {};
    (sim && sim.rows ? sim.rows : []).forEach(function (row) {
      const key = String(row.contractId) + '|' + String(row.lineId);
      if (!groups[key]) groups[key] = { key: key, contractId: row.contractId, lineId: row.lineId, rows: [] };
      groups[key].rows.push(row);
    });
    return Object.keys(groups).map(function (key) {
      const group = groups[key];
      group.finalSum = money(group.rows.reduce(function (sum, row) { return sum + num(row.finalSum); }, 0));
      group.finalPremium = money(group.rows.reduce(function (sum, row) { return sum + num(row.finalPremium); }, 0));
      group.sumInsuredCedant = money(group.rows.reduce(function (sum, row) { return sum + num(row.sumInsuredCedant); }, 0));
      group.sumInsuredRe = money(group.rows.reduce(function (sum, row) { return sum + num(row.sumInsuredRe); }, 0));
      group.premiumCedant = money(group.rows.reduce(function (sum, row) { return sum + num(row.premiumCedant); }, 0));
      group.premiumRe = money(group.rows.reduce(function (sum, row) { return sum + num(row.premiumRe); }, 0));
      group.commission = money(group.rows.reduce(function (sum, row) { return sum + num(row.commission); }, 0));
      group.tax = money(group.rows.reduce(function (sum, row) { return sum + num(row.tax); }, 0));
      return group;
    });
  })();
  const colsReaContract = [
    { title: t('Contrato'), dataIndex: 'contractId', width: 90 },
    { title: t('Línea'), dataIndex: 'lineId', width: 110 },
    { title: t('Coberturas'), dataIndex: 'rows', width: 90, render: function (v) { return v.length; } },
    { title: t('Suma final'), dataIndex: 'finalSum', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Prima final'), dataIndex: 'finalPremium', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Suma retención'), dataIndex: 'sumInsuredCedant', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Suma cedida'), dataIndex: 'sumInsuredRe', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Prima retención'), dataIndex: 'premiumCedant', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Prima cedida'), dataIndex: 'premiumRe', align: 'right', width: 130, render: function (v) { return fmt(v); } },
    { title: t('Comisión'), dataIndex: 'commission', align: 'right', width: 110, render: function (v) { return fmt(v); } },
    { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 110, render: function (v) { return fmt(v); } }
  ];
  const contractRows = (function () {
    const grouped = {};
    const finalRows = finalCoverageRows(quote && quote.rows ? quote.rows : []);
    const finalSum = money(finalRows.reduce(function (sum, row) { return sum + num(row.limit); }, 0));
    const finalPremium = money(finalRows.reduce(function (sum, row) { return sum + num(row.premium); }, 0));
    reinsuranceGroups.forEach(function (group) {
      const key = String(group.contractId);
       if (!grouped[key]) grouped[key] = {
         key: key, policyId: policy ? policy.id : '', contractId: group.contractId,
         endorsement: result && result.changeId ? result.changeId : 0,
         movementType: t('Exclusión'), lines: [], finalSum: 0, finalPremium: 0,
         sumInsuredCedant: 0, sumInsuredRe: 0, premiumCedant: 0, premiumRe: 0,
         commission: 0, tax: 0
       };
      const contract = grouped[key];
      contract.lines.push(group);
      ['finalSum', 'finalPremium', 'sumInsuredCedant', 'sumInsuredRe', 'premiumCedant', 'premiumRe', 'commission', 'tax'].forEach(function (field) {
        contract[field] = money(contract[field] + num(group[field]));
      });
    });
     return Object.keys(grouped).map(function (key) {
       grouped[key].finalSum = finalSum;
       grouped[key].finalPremium = finalPremium;
       return grouped[key];
     });
  })();
  const normalizeReinsuranceLine = function (value) {
    const line = up(value);
    if (line === 'RET' || line.indexOf('RETENC') >= 0) return 'RET';
    if (line === 'CP' || line.indexOf('CUOTA') >= 0 || line.indexOf('CPEX') >= 0) return 'CUOTA PARTE';
    if (line === 'EX1' || line.indexOf('EXCEDENTE') >= 0) return 'EXCEDENTE 1';
    if (line === 'FAC' || line.indexOf('FACULT') >= 0) return 'FAC';
    if (line === 'FRO' || line.indexOf('FRONT') >= 0) return 'FRO';
    if (line === 'CO' || line.indexOf('COASEG') >= 0) return 'COASEGURO';
    return line;
  };
  const lineDefinitions = [
    { key: 'RET', label: t('Retención'), retention: true },
    { key: 'CUOTA PARTE', label: t('Cuota Parte') },
    { key: 'EXCEDENTE 1', label: t('Excedente 1') },
    { key: 'FAC', label: t('FAC') },
    { key: 'FRO', label: t('Fronting') },
    { key: 'COASEGURO', label: t('Coaseguro'), coinsurance: true }
  ];
  contractRows.forEach(function (contract) {
    const sourceByLine = {};
    contract.lines.forEach(function (group) {
      const key = normalizeReinsuranceLine(group.lineId);
      if (!sourceByLine[key]) sourceByLine[key] = [];
      sourceByLine[key].push(group);
    });
    contract.lineRows = lineDefinitions.map(function (definition) {
      const lineKey = String(contract.contractId) + '|' + String(definition.key);
      const override = sim && sim.lineOverrides ? (sim.lineOverrides[lineKey] || {}) : {};
      const sources = definition.retention
        ? (contract.lines.length ? [contract.lines[0]] : [])
        : (sourceByLine[definition.key] || []);
      const source = sources[0] || null;
      const cededSum = definition.retention ? contract.sumInsuredCedant : sources.reduce(function (sum, group) { return sum + num(group.sumInsuredRe); }, 0);
      const cededPremium = definition.retention ? contract.premiumCedant : sources.reduce(function (sum, group) { return sum + num(group.premiumRe); }, 0);
      const percentage = contract.finalSum ? (cededSum / contract.finalSum) * 100 : 0;
      const commission = definition.retention ? 0 : sources.reduce(function (sum, group) { return sum + num(group.commission); }, 0);
      const tax = definition.retention ? 0 : sources.reduce(function (sum, group) { return sum + num(group.tax); }, 0);
      const rateCommission = cededPremium ? commission / cededPremium * 100 : 0;
      const rateTax = cededPremium ? tax / cededPremium * 100 : 0;
      const displayCommission = override.commission !== undefined ? money(override.commission) : money(commission);
      const displayTax = override.tax !== undefined ? money(override.tax) : money(tax);
      return {
        key: contract.key + '|' + definition.key, contractId: contract.contractId, lineId: definition.key, label: definition.label,
        rows: sources.reduce(function (all, group) { return all.concat(group.rows); }, []), sourceGroups: sources,
        sourceGroupKey: source ? source.key : '', retention: !!definition.retention, coinsurance: !!definition.coinsurance,
        percentage: override.percentage !== undefined ? Number(override.percentage) : Number(percentage.toFixed(4)),
        sum: money(cededSum), premium: money(cededPremium),
        commission: displayCommission,
        tax: displayTax,
        commissionPercentage: override.commissionPercentage !== undefined ? Number(override.commissionPercentage) : Number(rateCommission.toFixed(4)),
        taxPercentage: override.taxPercentage !== undefined ? Number(override.taxPercentage) : Number(rateTax.toFixed(4)),
        reinsuranceBalance: definition.retention ? 0 : money(cededPremium - displayCommission),
         // Como en ChangeCoverageSuretyEndorsement, las lineas sin cesion
         // existente se pueden editar y se crean en memoria al modificarlas.
         canEdit: !definition.coinsurance
       };
    });
  });
   const ensureLineRows = function (next, line) {
     const sourceKeys = line.sourceGroups && line.sourceGroups.length
       ? line.sourceGroups.map(function (source) { return String(source.lineId); })
       : [String(line.lineId)];
     let targetRows = (next.rows || []).filter(function (row) {
       return String(row.contractId) === String(line.contractId) && sourceKeys.indexOf(String(row.lineId)) >= 0;
     });
     if (targetRows.length || !quote || !quote.rows) return targetRows;
     // Las lineas nuevas de reaseguro se distribuyen sobre el estado final
     // completo de la poliza, no solo sobre las coberturas incluidas.
     const participantSource = (next.rows || []).find(function (row) {
       return String(row.contractId) === String(line.contractId)
         && row.participants && row.participants.length;
     });
     const participantTemplate = participantSource
       ? participantSource.participants
       : baseParts.filter(function (part) {
         return baseCessions.some(function (cession) {
           return String(cession.contractId) === String(line.contractId)
             && Number(cession.id || 0) === Number(part.cessionId || 0);
         });
       });
     targetRows = finalCoverageRows(quote.rows).map(function (coverage) {
       return {
         contractId: line.contractId, lineId: line.lineId, coverageCode: coverage.code,
          coverageName: coverage.name, premiumMovement: coverage.isNew ? money(coverage.prorated) : 0,
         prorated: coverage.isNew ? money(coverage.prorated) : 0,
         sumInsuredMovement: coverage.isNew ? money(coverage.limit) : 0,
         finalPremium: money(coverage.premium), finalSum: money(coverage.limit),
         proportionCed: 0, proportionRe: 0, premiumCedant: 0, premiumRe: 0,
         sumInsuredCedant: 0, sumInsuredRe: 0, commission: 0, tax: 0,
         participants: participantTemplate.map(function (participant) {
           return {
             contactId: Number(participant.contactId || 0), brokerId: participant.brokerId || null,
             split: num(participant.split), sumInsured: 0, premium: 0, commission: 0, tax: 0
           };
         })
       };
     });
     next.rows = (next.rows || []).concat(targetRows);
     return targetRows;
   };
   const setLinePercentage = function (line, value) {
     if (!line || line.coinsurance) return;
     const percentage = Math.max(0, Math.min(100, num(value))) / 100;
    setReinsurersReady(false); setReaDetailTab('distribution'); setReinsuranceConfirmed(false);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      const lineKey = String(line.contractId) + '|' + String(line.lineId);
      next.lineOverrides = next.lineOverrides || {};
      next.lineOverrides[lineKey] = Object.assign({}, next.lineOverrides[lineKey] || {}, {
        percentage: Number((percentage * 100).toFixed(4))
      });
      delete next.lineOverrides[lineKey].commission;
      delete next.lineOverrides[lineKey].tax;
       const targetRows = ensureLineRows(next, line).filter(function (row) {
         return !line.retention || String(row.lineId) === String(line.sourceGroups[0] && line.sourceGroups[0].lineId || line.lineId);
       });
      targetRows.forEach(function (row) {
        const finalPremium = num(row.finalPremium);
        const finalSum = num(row.finalSum);
        const previousPremiumRe = num(row.premiumRe);
        const commissionRate = previousPremiumRe ? num(row.commission) / previousPremiumRe : 0;
        const taxRate = previousPremiumRe ? num(row.tax) / previousPremiumRe : 0;
        if (line.retention) {
          row.proportionCed = percentage;
          row.proportionRe = 0;
          row.premiumCedant = money(finalPremium * percentage);
          row.sumInsuredCedant = money(finalSum * percentage);
        } else {
          // Cuota Parte puede almacenar tambien la retencion de la cobertura.
          // Al editar su porcentaje cedido no se debe borrar esa parte.
          if (String(line.lineId) !== 'CUOTA PARTE') row.proportionCed = 0;
          row.proportionRe = percentage;
          row.premiumRe = money(finalPremium * percentage);
          row.sumInsuredRe = money(finalSum * percentage);
          row.commission = money(row.premiumRe * commissionRate);
          row.tax = money(row.premiumRe * taxRate);
        }
        (row.participants || []).forEach(function (participant) {
          const split = num(participant.split) / 100;
          participant.sumInsured = money(row.sumInsuredRe * split);
          participant.premium = money(row.premiumRe * split);
          participant.commission = money(row.commission * split);
          participant.tax = money(row.tax * split);
        });
      });
      return next;
    });
  };
   const setLineRate = function (line, field, value) {
     if (!line || line.retention || line.coinsurance) return;
    const rate = Math.max(0, num(value)) / 100;
    setReinsurersReady(false); setReaDetailTab('distribution'); setReinsuranceConfirmed(false);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      const lineKey = String(line.contractId) + '|' + String(line.lineId);
      next.lineOverrides = next.lineOverrides || {};
      const rateKey = field === 'commission' ? 'commissionPercentage' : 'taxPercentage';
      next.lineOverrides[lineKey] = Object.assign({}, next.lineOverrides[lineKey] || {}, {});
      next.lineOverrides[lineKey][rateKey] = Number((rate * 100).toFixed(4));
      delete next.lineOverrides[lineKey][field];
       ensureLineRows(next, line).forEach(function (row) {
         if (String(row.contractId) !== String(line.contractId)) return;
        row[field] = money(num(row.premiumRe) * rate);
        (row.participants || []).forEach(function (participant) {
          const split = num(participant.split) / 100;
          participant.commission = money(row.commission * split);
          participant.tax = money(row.tax * split);
        });
      });
      return next;
    });
  };
   const setLineAmount = function (line, field, value) {
     if (!line || line.coinsurance) return;
    const target = Math.max(0, money(value));
    setReinsurersReady(false); setReaDetailTab('distribution'); setReinsuranceConfirmed(false);
    setSim(function (current) {
      const next = JSON.parse(JSON.stringify(current));
      const lineKey = String(line.contractId) + '|' + String(line.lineId);
      next.lineOverrides = next.lineOverrides || {};
      next.lineOverrides[lineKey] = Object.assign({}, next.lineOverrides[lineKey] || {});
      if (field === 'sum' || field === 'premium') {
        next.lineOverrides[lineKey].percentage = Number(line.percentage || 0);
      } else if (field === 'commission' || field === 'tax') {
        if (line.retention) return next;
        next.lineOverrides[lineKey][field] = target;
      }
       const targetRows = ensureLineRows(next, line).filter(function (row) {
         return !line.retention || String(row.lineId) === String(line.sourceGroups[0] && line.sourceGroups[0].lineId || line.lineId);
       });
      if (!targetRows.length) return next;
      const amountField = field === 'commission' || field === 'tax'
        ? field
        : (line.retention
          ? (field === 'sum' ? 'sumInsuredCedant' : 'premiumCedant')
          : (field === 'sum' ? 'sumInsuredRe' : 'premiumRe'));
      const currentTotal = targetRows.reduce(function (sum, row) { return sum + num(row[amountField]); }, 0);
      let assigned = 0;
      targetRows.forEach(function (row, index) {
        const currentAmount = num(row[amountField]);
        const nextAmount = index === targetRows.length - 1
          ? money(target - assigned)
          : money(currentTotal > 0 ? target * currentAmount / currentTotal : target / targetRows.length);
        row[amountField] = Math.max(0, nextAmount);
        assigned = money(assigned + row[amountField]);
        if (!line.retention) {
          (row.participants || []).forEach(function (participant) {
            const split = num(participant.split) / 100;
            if (field === 'sum') participant.sumInsured = money(row.sumInsuredRe * split);
            if (field === 'premium') {
              participant.premium = money(row.premiumRe * split);
              participant.commission = money(row.commission * split);
              participant.tax = money(row.tax * split);
            }
            if (field === 'commission') participant.commission = money(row.commission * split);
            if (field === 'tax') participant.tax = money(row.tax * split);
          });
        }
      });
      return next;
    });
  };
   const colsReaContracts = [
     { title: t('Póliza'), dataIndex: 'policyId', width: 100 },
     { title: t('Contrato'), dataIndex: 'contractId', width: 105 },
     { title: t('Movimiento'), children: [
       { title: t('Endoso'), dataIndex: 'endorsement', width: 85 },
       { title: t('Tipo'), dataIndex: 'movementType', width: 100 }
     ] },
     { title: t('Totales'), children: [
       { title: t('Suma'), dataIndex: 'finalSum', align: 'right', width: 125, render: function (v) { return fmt(v); } },
       { title: t('Prima'), dataIndex: 'finalPremium', align: 'right', width: 125, render: function (v) { return fmt(v); } }
     ] },
     { title: t('Retención'), children: [
       { title: t('Prima Ret'), dataIndex: 'premiumCedant', align: 'right', width: 125, render: function (v) { return fmt(v); } },
       { title: t('Suma Ret'), dataIndex: 'sumInsuredCedant', align: 'right', width: 125, render: function (v) { return fmt(v); } }
     ] },
     { title: t('Cedido'), children: [
       { title: t('Prima Ced'), dataIndex: 'premiumRe', align: 'right', width: 125, render: function (v) { return fmt(v); } },
       { title: t('Suma Ced'), dataIndex: 'sumInsuredRe', align: 'right', width: 125, render: function (v) { return fmt(v); } }
     ] },
     { title: t('Otros'), children: [
       { title: t('Comisión'), dataIndex: 'commission', align: 'right', width: 115, render: function (v) { return fmt(v); } },
       { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 115, render: function (v) { return fmt(v); } }
     ] }
   ];
  const colsReaLines = [
    { title: t('Línea'), dataIndex: 'label', width: 150, render: function (v, row) {
      return <span className="axx-rea-line-label"><span>{v}</span>
        {row.sum > 0.01 && !row.retention ? <Button type="text" size="small" className="axx-folder-btn"
          aria-label={t('Ver reaseguradores')} title={t('Ver reaseguradores')}
          onClick={function (event) { event.stopPropagation(); setSelectedReinsuranceLineKey(String(row.contractId) + '|' + String(row.lineId)); setReinsurersReady(true); setReaDetailTab('reinsurers'); }}><FolderIcon /></Button> : null}
      </span>;
    } },
    { title: t('Porcentaje (%)'), dataIndex: 'percentage', align: 'right', width: 135, render: function (v, row) { return <EditableFormattedNumber value={v} decimals={4} disabled={running || (result && result.ok)} readOnly={!row.canEdit} onCommit={function (x) { setLinePercentage(row, x); }} />; } },
    { title: t('Suma'), dataIndex: 'sum', align: 'right', width: 135, render: function (v, row) { return <EditableFormattedNumber value={v} decimals={2} disabled={running || (result && result.ok)} readOnly={!row.canEdit} onCommit={function (x) { setLineAmount(row, 'sum', x); }} />; } },
    { title: t('Prima'), dataIndex: 'premium', align: 'right', width: 135, render: function (v, row) { return <EditableFormattedNumber value={v} decimals={2} disabled={running || (result && result.ok)} readOnly={!row.canEdit} onCommit={function (x) { setLineAmount(row, 'premium', x); }} />; } },
    { title: t('Pct. Comisión'), dataIndex: 'commissionPercentage', align: 'right', width: 135, render: function (v, row) { return <EditableFormattedNumber value={v} decimals={4} disabled={row.retention || !row.canEdit || running || (result && result.ok)} onCommit={function (x) { setLineRate(row, 'commission', x); }} />; } },
    { title: t('Comisión'), dataIndex: 'commission', align: 'right', width: 135, render: function (v, row) { return <EditableFormattedNumber value={v} decimals={2} disabled={row.retention || !row.canEdit || running || (result && result.ok)} readOnly={row.retention || !row.canEdit} onCommit={function (x) { setLineAmount(row, 'commission', x); }} />; } },
    { title: t('Pct. Impuesto'), dataIndex: 'taxPercentage', align: 'right', width: 135, render: function (v, row) { return <EditableFormattedNumber value={v} decimals={4} disabled={row.retention || !row.canEdit || running || (result && result.ok)} onCommit={function (x) { setLineRate(row, 'tax', x); }} />; } },
    { title: t('Impuesto'), dataIndex: 'tax', align: 'right', width: 135, render: function (v, row) { return <EditableFormattedNumber value={v} decimals={2} disabled={row.retention || !row.canEdit || running || (result && result.ok)} readOnly={row.retention || !row.canEdit} onCommit={function (x) { setLineAmount(row, 'tax', x); }} />; } },
    { title: t('Saldo Rea.'), dataIndex: 'reinsuranceBalance', align: 'right', width: 135, render: function (v) { return fmt(v); } }
  ];
  const renderLineParticipants = function (group) {
    const grouped = {};
    group.rows.forEach(function (row) {
      (row.participants || []).forEach(function (participant) {
        const key = String(participant.contactId || '') + '|' + String(participant.brokerId || '');
        if (!grouped[key]) grouped[key] = { key: key, contactId: participant.contactId, brokerId: participant.brokerId, split: num(participant.split), sumInsured: 0, premium: 0, commission: 0, tax: 0 };
        grouped[key].sumInsured += num(participant.sumInsured);
        grouped[key].premium += num(participant.premium);
        grouped[key].commission += num(participant.commission);
        grouped[key].tax += num(participant.tax);
      });
    });
    return Object.keys(grouped).map(function (key) { return grouped[key]; });
  };
  const renderCoinsuranceTab = function () {
    const rows = [];
    const base = finalCoverageRows(quote && quote.rows ? quote.rows : []).reduce(function (total, row) {
      total.sum += num(row.limit); total.premium += num(row.premium); return total;
    }, { sum: 0, premium: 0 });
    (coinsuranceCessions || []).forEach(function (cession, index) {
      const percentage = num(cession.percentage);
      const sourcePremium = num(cession.premiumCeded || cession.premium);
      const contact = cession.Contact || {};
      const commissionRate = sourcePremium ? num(cession.commission) / sourcePremium : 0;
      const taxRate = sourcePremium ? num(cession.tax) / sourcePremium : 0;
      rows.push({ key: String(cession.id || index), name: txt(contact.name || cession.name || cession.contactId || '-'), leader: Number(cession.leader) === 1 || cession.leader === true,
        percentage: percentage, sum: money(base.sum * percentage / 100), premium: money(base.premium * percentage / 100),
        commission: money(base.premium * percentage / 100 * commissionRate), tax: money(base.premium * percentage / 100 * taxRate) });
    });
    const placed = rows.reduce(function (sum, row) { return sum + row.percentage; }, 0);
    rows.push({ key: 'company', name: t('Compañía'), leader: Number(policy && policy.coinsurance) === 1, percentage: Math.max(0, 100 - placed),
      sum: money(base.sum * Math.max(0, 100 - placed) / 100), premium: money(base.premium * Math.max(0, 100 - placed) / 100), commission: 0, tax: 0 });
    return <div className="axx-coaseguro-view">
      <Alert type="info" showIcon message={t('Coaseguro informativo')} description={t('Los valores se calculan con el estado final del endoso y no son editables.')} />
      <Table size="small" pagination={false} rowKey="key" dataSource={rows} columns={[
        { title: t('Coasegurador'), dataIndex: 'name' }, { title: t('Líder'), dataIndex: 'leader', align: 'center', render: function (v) { return v ? t('Sí') : t('No'); } },
        { title: t('Participación %'), dataIndex: 'percentage', align: 'right', render: function (v) { return num(v).toFixed(4) + '%'; } },
        { title: t('Suma'), dataIndex: 'sum', align: 'right', render: function (v) { return fmt(v); } }, { title: t('Prima'), dataIndex: 'premium', align: 'right', render: function (v) { return fmt(v); } },
        { title: t('Comisión'), dataIndex: 'commission', align: 'right', render: function (v) { return fmt(v); } }, { title: t('Impuesto'), dataIndex: 'tax', align: 'right', render: function (v) { return fmt(v); } }
      ]} />
    </div>;
  };
  const renderCoverageLines = function (contract) {
    const coverageMap = {};
    (contract.lines || []).forEach(function (line) {
      (line.rows || []).forEach(function (row) {
        const key = up(row.coverageCode);
        if (!coverageMap[key]) {
          coverageMap[key] = {
            key: key, coverageCode: row.coverageCode, coverageName: row.coverageName,
            counts: false, sumInsuredMovement: 0, premiumMovement: 0, prorated: 0,
            proportionCed: 0, sumInsuredCedant: 0, premiumCedant: 0,
            proportionRe: 0, sumInsuredRe: 0, premiumRe: 0, commission: 0, tax: 0,
            participants: []
          };
        }
        const item = coverageMap[key];
        item.counts = item.counts || row.counts !== false;
        ['sumInsuredMovement', 'premiumMovement', 'prorated', 'sumInsuredCedant', 'premiumCedant', 'sumInsuredRe', 'premiumRe', 'commission', 'tax'].forEach(function (field) {
          item[field] += num(row[field]);
        });
        item.proportionCed += num(row.proportionCed);
        item.proportionRe += num(row.proportionRe);
        (row.participants || []).forEach(function (participant) {
          const participantKey = String(participant.contactId || '') + '|' + String(participant.brokerId || '');
          let target = item.participants.find(function (entry) { return entry.key === participantKey; });
          if (!target) {
            target = { key: participantKey, contactId: participant.contactId, brokerId: participant.brokerId, split: num(participant.split), sumInsured: 0, premium: 0, commission: 0, tax: 0 };
            item.participants.push(target);
          }
          target.sumInsured += num(participant.sumInsured);
          target.premium += num(participant.premium);
          target.commission += num(participant.commission);
          target.tax += num(participant.tax);
        });
      });
    });
    const rows = Object.keys(coverageMap).map(function (key) { return coverageMap[key]; });
    const movement = rows.reduce(function (sum, row) { return sum + num(row.premiumMovement); }, 0);
    const counted = rows.filter(function (row) { return row.counts !== false; }).length;
    return <div key={'coverage-' + String(contract.contractId)} className="axx-rea-line-detail">
      <div className="axx-rea-toolbar">
        <div className="axx-rea-summary">
          <b>{t('Contrato')}:</b> {contract.contractId} {' | '} <b>{t('Línea')}:</b> {t('Distribución final')} {' | '}
          <b>{t('Movimiento')}:</b> {conSigno(movement)} {' | '} <b>{t('Coberturas que suman')}:</b> {counted}/{rows.length}
        </div>
      </div>
      <Table size="small" pagination={false} rowKey="key" dataSource={rows} columns={colsRea} scroll={{ x: 1700 }}
          expandable={{
            expandedRowRender: function (row) {
              const participants = (row.participants || []).map(function (participant, index) {
                return Object.assign({}, participant, { key: String(participant.contactId || '') + '-' + String(participant.brokerId || '') + '-' + index });
              });
              return participants.length ? <Table size="small" pagination={false} rowKey="key" dataSource={participants} columns={[
                { title: t('Reasegurador'), dataIndex: 'contactId', render: function (v) { return contactNames[Number(v)] || v; } },
                { title: t('% Participación'), dataIndex: 'split', align: 'right', render: function (v) { return num(v).toFixed(4) + ' %'; } },
                { title: t('Suma cedida'), dataIndex: 'sumInsured', align: 'right', render: function (v) { return fmt(v); } },
                { title: t('Prima cedida'), dataIndex: 'premium', align: 'right', render: function (v) { return fmt(v); } },
                { title: t('Comisión'), dataIndex: 'commission', align: 'right', render: function (v) { return fmt(v); } },
                { title: t('Impuesto'), dataIndex: 'tax', align: 'right', render: function (v) { return fmt(v); } }
              ]} /> : <Empty description={t('La cobertura no tiene aceptantes registrados.')} />;
            },
            rowExpandable: function (row) { return (row.participants || []).length > 0; }
          }} />
    </div>;
  };
  const colsWritten = [
    { title: t('Cesión'), dataIndex: 'id', width: 90 },
    { title: t('Contrato'), dataIndex: 'contractId', width: 90 },
    { title: t('Cobertura'), dataIndex: 'coverageCode', width: 100 },
    { title: t('Suma'), dataIndex: 'sumInsured', align: 'right', render: function (v) { return fmt(v); } },
    { title: t('Retención'), dataIndex: 'premiumCedant', align: 'right', render: function (v) { return fmt(v); } },
    { title: t('Cedido'), dataIndex: 'premiumRe', align: 'right', render: function (v) { return fmt(v); } },
    { title: t('Comisión'), dataIndex: 'comissionCedant', align: 'right', render: function (v) { return fmt(v); } }
  ];
  const cuotas = (function () {
    if (!quote) return [];
    // El motor puede devolver un jNewPayPlan recalculado aunque el endoso
    // no cambie la facturacion. En ese caso no debe generar diferencias
    // artificiales en la previsualizacion de cuotas.
    const hasBillingVariation = Math.abs(num(quote.billing && quote.billing.premium && quote.billing.premium.movement)) > 0.005
      || Math.abs(num(quote.billing && quote.billing.tax && quote.billing.tax.movement)) > 0.005
      || Math.abs(num(quote.billing && quote.billing.total && quote.billing.total.movement)) > 0.005;
    const nuevas = hasBillingVariation ? (quote.jNewPayPlan || []) : [];
    const rows = [];
    payPlan.forEach(function (p) {
      const n = nuevas.find(function (x) { return Number(x.id) === Number(p.id); });
      rows.push({ key: 'p' + p.id, number: p.numberInYear, concept: p.concept, dueDate: p.dueDate, before: num(p.minimum || p.expected),
        after: n ? num(n.minimum !== undefined && n.minimum !== null ? n.minimum : n.expected) : num(p.minimum || p.expected), paid: num(p.payed) });
    });
    nuevas.filter(function (x) { return !(Number(x.id) > 0) || !payPlan.some(function (p) { return Number(p.id) === Number(x.id); }); }).forEach(function (n, i) {
      rows.push({ key: 'n' + i, number: n.numberInYear, concept: n.concept, dueDate: n.dueDate, before: 0,
        after: num(n.minimum !== undefined && n.minimum !== null ? n.minimum : n.expected), paid: num(n.payed) });
    });
    rows.sort(function (a, b) { return String(a.dueDate).localeCompare(String(b.dueDate)); });
    rows.forEach(function (r) { r.diff = money(r.after - r.before); });
    return rows;
  })();
  const colsCuotas = [
    { title: t('Cuota'), dataIndex: 'number', width: 70 },
    { title: t('Concepto'), dataIndex: 'concept', width: 120 },
    { title: t('Vencimiento'), dataIndex: 'dueDate', width: 120, render: function (v) { return day10(v); } },
    { title: t('Importe actual'), dataIndex: 'before', align: 'right', render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Importe con el endoso'), dataIndex: 'after', align: 'right', render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } },
    { title: t('Diferencia'), dataIndex: 'diff', align: 'right', render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Pagado'), dataIndex: 'paid', align: 'right', render: function (v) { return fmt(v); } }
  ];
  const colsCoverageState = [
    { title: t('Estado'), dataIndex: 'origin', width: 110, render: function (v) { return <Tag color={v === t('Nueva') ? 'blue' : 'default'}>{v}</Tag>; } },
    { title: t('Código'), dataIndex: 'code', width: 90 },
    { title: t('Cobertura'), dataIndex: 'name' },
    { title: t('Suma asegurada'), dataIndex: 'limit', align: 'right', width: 140, render: function (v) { return <span className={signo(v)}>{fmt(v)}</span>; } },
    { title: t('Prima anual'), dataIndex: 'premium', align: 'right', width: 120, render: function (v) { return <span className={signo(v)}>{fmt(v)}</span>; } },
    { title: t('Deducible'), dataIndex: 'deductible', align: 'right', width: 110, render: function (v) { return <span className={signo(v)}>{fmt(v)}</span>; } },
    { title: t('Vigencia'), dataIndex: 'start', width: 190, render: function (v, r) { return day10(r.start) + ' → ' + day10(r.end); } },
    { title: t('Cambio'), dataIndex: 'change', width: 140, render: function (v) {
      const className = v === t('Se excluirá') ? 'axx-monto-neg' : (v === t('Sin modificación') ? 'axx-monto-pos' : '');
      return <span className={className}>{v}</span>;
    } }
  ];

  // ------------------------------------------------------------- tarifas de entrada (render)
  const selectedRows = selected.map(function (code) {
    return eligible.find(function (row) { return up(row.code) === up(code); }) || { code: code, name: '', hasTariff: fieldsOf(code).length > 0 };
  });
  const selectedFieldDefs = [];
  const renderInlineField = function (row, field) {
    const rowField = fieldsOf(row.code).find(function (item) { return up(item.name) === up(field.name); });
    if (!rowField) return null;
    const value = valueFor(row.code, rowField);
    const hardDisabled = running || (result && result.ok);
    const readOnly = !hardDisabled && (rowField.disabled || rowField.readOnly || isDateField(rowField.name));
    const missing = showErrors && rowField.required && !rowField.disabled && !rowField.readOnly && isEmpty(value);
    const common = { size: 'small', style: { width: 170 }, disabled: hardDisabled, readOnly: readOnly };
    let control;
    if (rowField.type === 'select') {
      control = <Select size="small" style={{ width: 170 }} disabled={hardDisabled} open={readOnly ? false : undefined} aria-readonly={readOnly}
        value={isEmpty(value) ? undefined : String(value)} placeholder={t('Seleccione')} onChange={function (v) { setValue(row.code, rowField.name, v); }}>
        {rowField.catalog.map(function (option) { return <Select.Option key={String(option.code)} value={String(option.code)}>{txt(option.name)}</Select.Option>; })}
      </Select>;
    } else if (rowField.type === 'number') {
      const draftKey = up(row.code) + '|' + up(rowField.name);
      const displayedValue = numericDrafts[draftKey] === undefined
        ? (isEmpty(value) ? '' : formatNumericInputValue(value))
        : numericDrafts[draftKey];
      control = <Input {...common} inputMode="decimal" value={displayedValue} placeholder={rowField.description}
        onChange={function (event) {
          const input = event.currentTarget;
          const original = input.value;
          const caret = input.selectionStart;
          const normalized = normalizeNumericInputValue(original);
          const formatted = formatNumericInputValue(normalized);
          const drafts = Object.assign({}, numericDrafts);
          drafts[draftKey] = formatted;
          setNumericDrafts(drafts);
          setValue(row.code, rowField.name, parseNumericInputValue(normalized));
          window.requestAnimationFrame(function () { restoreNumericCaret(input, original, caret); });
        }} onBlur={function () {
          const drafts = Object.assign({}, numericDrafts);
          delete drafts[draftKey];
          setNumericDrafts(drafts);
        }} />;
    } else {
      control = <Input {...common} value={isEmpty(value) ? '' : String(value)} placeholder={rowField.description}
        onChange={function (event) { setValue(row.code, rowField.name, event.target.value); }} />;
    }
    return <div style={missing ? { boxShadow: '0 0 0 1px #ff4d4f', borderRadius: 4 } : null}>{control}</div>;
  };
  const colsSelected = [
    { title: t('Código'), dataIndex: 'code', width: 80 },
    { title: t('Cobertura'), dataIndex: 'name', width: 260, ellipsis: true },
    { title: t('Prima vigente'), dataIndex: 'premium', align: 'right', width: 130, render: function (v) { return fmt(v); } }
  ].concat(selectedFieldDefs.map(function (field) {
    return { title: field.description + (field.required && !field.disabled && !field.readOnly ? ' *' : ''), key: 'field-' + field.name, width: 185,
      render: function (_, row) { return renderInlineField(row, field); } };
  })).concat([{ title: t('Acción'), width: 82, align: 'center', render: function (_, row) {
    return <Button size="small" danger disabled={running || (result && result.ok)} onClick={function () {
      setSelected(selected.filter(function (code) { return up(code) !== up(row.code); }));
      setQuote(null); setSim(null); setReinsuranceConfirmed(false);
    }}>{t('Quitar')}</Button>;
  } }]);
  const adendoParameterCount = adendoRows.reduce(function (max, row) { return Math.max(max, row.parameters.length); }, 0);
  const renderWrappedAdendoText = function (value) {
    const text = txt(value);
    return <Tooltip title={text} placement="topLeft">
      <div className="axx-adendo-text-wrap">{text}</div>
    </Tooltip>;
  };
  const colsAdendos = [
    { title: t('Código'), dataIndex: 'code', width: 68 },
    { title: t('Nombre de cobertura'), dataIndex: 'name', width: 200, render: renderWrappedAdendoText },
    { title: t('Código del adendo'), dataIndex: 'idAnexo', width: 112 },
    { title: t('Descripción del adendo'), dataIndex: 'description', width: 200, render: renderWrappedAdendoText }
  ].concat(Array.from({ length: adendoParameterCount }).map(function (_, index) {
    const position = index + 1;
    return { title: t('Parametro') + position, key: 'parameter-' + position, width: 155, render: function (_, row) {
      const parameter = row.parameters[index];
      if (!parameter) return null;
      const name = parameter.name;
      const controlType = tipoControlAdendo(parameter.type, name);
      const values = adendoValues[up(row.code)] || {};
      const missing = showErrors && !txt(values[name]);
      const common = {
        size: 'small', value: txt(values[name]), status: missing ? 'error' : undefined,
        placeholder: name, disabled: running || (result && result.ok),
        onChange: function (event) { setAdendoValue(row.code, name, event.target.value); }
      };
      let control;
      if (controlType === 'date') control = <Input {...common} type="date" />;
      if (controlType === 'number' || controlType === 'percentage') {
        control = <Input {...common} type="number" step="any"
          min={controlType === 'percentage' ? 0 : undefined}
          max={controlType === 'percentage' ? 100 : undefined} />;
      }
      if (!control) control = <Input {...common} type="text" />;
      return <div className="axx-adendo-input-wrap">
        {control}
        <Tooltip title={name} placement="topLeft">
          <span className="axx-adendo-param-help" aria-hidden="true">{name}</span>
        </Tooltip>
      </div>;
    } };
  }));

  const css = `
.axx299 { display:flex; flex-direction:column; min-width:0; overflow:hidden; font-size:13px; }
.axx299 .axx-topbar { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:4px 0; margin:0 4px 2px 4px;
          background:transparent; border:1px solid #e6ebf2; border-radius:6px; }
.axx299 .axx-topbar > * { margin-left:4px; }
.axx299 .axx-topbar-label { color:#334155; white-space:nowrap; }
.axx299 .axx-topbar-summary { color:#5a6572; white-space:nowrap; font-size:12px; }
.axx299 .axx-topbar .axx-return-btn { margin-left:auto; }
.axx299 .axx-adendo-text-wrap { white-space: normal; overflow-wrap: anywhere; line-height: 1.35; }
.axx299 .axx-adendo-input-wrap { position:relative; min-width:0; }
.axx299 .axx-adendo-input-wrap .ant-input { width:100%; }
.axx299 .axx-adendo-param-help { position:absolute; top:calc(100% + 3px); left:0; z-index:20;
          display:block; width:max-content; max-width:240px; padding:3px 7px; color:#262626;
          background:#fff; border:1px solid #b8c4d1; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,.12);
          font-size:11px; line-height:16px; white-space:normal; pointer-events:none; opacity:0; visibility:hidden;
          transform:translateY(-2px); transition:opacity .15s ease, transform .15s ease, visibility .15s ease; }
.axx299 .axx-adendo-input-wrap:hover .axx-adendo-param-help { opacity:1; visibility:visible; transform:translateY(0); }
.axx299 .axx-status { background:#1677ff; color:#fff;
          padding:4px 10px; border-radius:4px; margin:0 4px 4px 4px; font-size:13px; }
.axx299 .axx-status b { color:#fff; }
.axx299 .axx-tabs { min-width:0; margin:0 4px; }
.axx299 .axx-tabs .ant-tabs-tabpane-hidden { display:none !important; }
.axx299 .axx-tabs .ant-tabs-content { min-width:0; }
.axx299 .axx-tabs .ant-tabs-tabpane-active { min-width:0; }
.axx299 .axx-tabs .ant-tabs-tab { border:1px solid #cbd1d8 !important; border-radius:6px 6px 0 0 !important;
          margin-right:2px !important; background:#f7f9fb; position:relative; }
.axx299 .axx-tabs .ant-tabs-tab-active { border-color:#1677ff !important; background:#fff; }
.axx299 .axx-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color:#1677ff; }
.axx299 .axx-tabs .ant-tabs-tab-active::after { content:''; position:absolute; left:0; right:0; bottom:-1px;
          height:1px; background:#fff; }
.axx299 .axx-panel { border:1px solid #cbd1d8; border-top:none; background:#fff; min-width:0; }
.axx299 .axx-panel .ant-card { border:none; }
.axx299 .axx-panel .ant-card-body { padding:4px; }
.axx299 .ant-table-wrapper { border:1px solid #cbd1d8; min-width:0; }
.axx299 .ant-table-thead > tr > th { background:#bfbfbf !important; color:#262626;
          border-right:1px solid #cbd1d8 !important; border-bottom:1px solid #cbd1d8 !important;
          font-size:12px; line-height:18px; padding:5px 8px !important; }
.axx299 .ant-table-thead > tr > th:last-child { border-right:none !important; }
.axx299 .ant-table-thead > tr > th::before { display:none !important; }
.axx299 .ant-table-tbody > tr > td { border-right:none !important;
          border-bottom:1px solid #cbd1d8 !important; font-size:12px; line-height:18px;
          padding:5px 8px !important; }
.axx299 .ant-table-tbody > tr:hover > td { background:#b7d7ff !important; }
.axx299 .ant-table-tbody > tr.ant-table-row-selected > td { background:#86b4ff !important; }
/* Valores anteriores en rojo, valores nuevos en azul (criterio de la grilla antes/despues) */
.axx299 .axx-antes { color:#cf1322; }
.axx299 .axx-nuevo { color:#1677ff; }
.axx299 .axx-monto-pos { color:#237804; }
.axx299 .axx-monto-neg { color:#cf1322; }
.axx299 .axx-monto-cero { color:#262626; font-weight:normal; }
.axx299 .axx-btn-sec, .axx299-modal .axx-btn-sec { border-color:#8f9aa7 !important; }
.axx299 .ant-btn[disabled], .axx299-modal .ant-btn[disabled] {
          border-color:#6f7b88 !important; opacity:1 !important; }
.axx299 .axx-pie { padding:4px 8px; text-align:right; }
.axx299 .axx-filtros { display:flex; flex-wrap:wrap; align-items:flex-end; gap:10px; padding:6px 4px; }
.axx299 .axx-campo { display:flex; flex-direction:column; }
.axx299 .axx-campo label { font-size:12px; color:#5a6572; margin-bottom:2px; }
.axx299 .axx-section-toolbar { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 8px; margin-bottom:6px; background:#f7f9fb; border:1px solid #d9e2ec; border-radius:4px; }
.axx299-modal .ant-modal-body { font-size:13px; }
.axx299 .axx-aceptantes-barra { display:flex; align-items:center; gap:8px; }
.axx299 .axx-rea-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:6px 8px; margin-bottom:4px; background:#e6f4ff; border:1px solid #91caff; border-radius:4px; color:#1f1f1f; }
.axx299 .axx-rea-toolbar .axx-rea-summary { display:flex; align-items:center; flex-wrap:wrap; gap:4px; font-size:12px; }
.axx299 .axx-rea-toolbar .axx-rea-summary b { color:#1677ff; }
.axx299 .axx-rea-editor { display:flex; flex-wrap:wrap; align-items:flex-end; gap:8px; padding:6px; margin-bottom:4px; background:#f7f9fb; border:1px solid #d9e2ec; }
.axx299 .axx-rea-editor-label { font-weight:600; color:#334155; margin-right:4px; }
.axx299 .axx-rea-editor label { display:flex; flex-direction:column; gap:2px; color:#5a6572; font-size:11px; }
.axx299 .axx-rea-editor .ant-input-number { width:105px; }
.axx299 .axx-rea-line-detail { margin-top:8px; padding:4px; border:1px solid #d9e2ec; background:#fff; }
.axx299 .axx-rea-detail-tabs .ant-table-summary .axx-rea-total-row > td { background:#86b4ff !important; color:#0b1f3a; font-weight:700; }
.axx299 .axx-rea-line-label { display:flex; align-items:center; justify-content:space-between; gap:6px; }
.axx299 .axx-folder-btn { color:#1677ff; min-width:24px; height:24px; padding:2px 4px; }
.axx299 .axx-folder-btn:hover { color:#0958d9; background:#e6f4ff; }
.axx299 .axx-rea-detail-tabs .ant-input-number-input { text-align:right !important; }
.axx299 .axx-coverage-participants { margin:0 8px 4px 24px; padding:6px; background:#f7f9fb; border:1px solid #d9e2ec; }
.axx299 .axx-coverage-participants-title { margin-bottom:4px; color:#334155; font-weight:600; font-size:12px; }
.axx299 .axx-coverage-participants .ant-table-wrapper { border:1px solid #d9e2ec; }
.axx299 .axx-rea-actions { display:flex; align-items:center; gap:8px; padding:6px 8px; margin-bottom:6px; background:#e6f4ff; border:1px solid #91caff; border-radius:4px; color:#334155; font-size:12px; }
.axx299 .axx-execution-mask { position:fixed; inset:0; z-index:1000000; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.58); cursor:wait; }
.axx299 .axx-execution-mask > div { display:flex; align-items:center; gap:10px; padding:14px 18px; background:#fff; border:1px solid #91caff; border-radius:6px; box-shadow:0 4px 16px rgba(0,0,0,.16); color:#1677ff; font-weight:600; }
.axx299-modal .ant-modal-content { border:1px solid #cbd1d8; border-radius:6px; overflow:hidden; }
.axx299-modal .ant-modal-header { padding:8px 12px; border-bottom:1px solid #d9e2ec; }
.axx299-modal .ant-modal-title { font-size:14px; font-weight:600; }
.axx299-modal .ant-modal-close { top:6px; right:8px; }
.axx299-modal .ant-modal-body { padding:8px; }
.axx299-modal .ant-modal-footer { padding:6px 8px; border-top:1px solid #d9e2ec; }
.axx299-modal .ant-table-wrapper { border:1px solid #d9e2ec; }
.axx299-modal .ant-table { font-size:12px; }
.axx299-modal .ant-table-thead > tr > th { padding:4px 6px !important; line-height:16px; }
.axx299-modal .ant-table-tbody > tr > td { padding:3px 6px !important; line-height:16px; }
.axx299-modal .ant-table-tbody > tr > td .ant-tag { margin:0; font-size:11px; line-height:18px; padding:0 5px; }
.axx299-modal .ant-table-selection-column { width:34px; padding-left:6px !important; padding-right:4px !important; }
.axx299 .ant-input:not([type="hidden"]), .axx299 .ant-input-number, .axx299 .ant-select-selector, .axx299 .ant-picker, .axx299-modal .ant-input:not([type="hidden"]), .axx299-modal .ant-input-number, .axx299-modal .ant-select-selector, .axx299-modal .ant-picker {
          border:1px solid #b8c4d1 !important; border-radius:6px !important; transition:border-color .2s, box-shadow .2s; }
.axx299 .ant-input:hover, .axx299 .ant-input-number:hover, .axx299 .ant-select:hover .ant-select-selector, .axx299 .ant-picker:hover, .axx299-modal .ant-input:hover, .axx299-modal .ant-input-number:hover, .axx299-modal .ant-select:hover .ant-select-selector, .axx299-modal .ant-picker:hover {
          border-color:#8da9c2 !important; }
.axx299 .ant-input:focus, .axx299 .ant-input-focused, .axx299 .ant-input-number-focused, .axx299 .ant-select-focused .ant-select-selector, .axx299 .ant-picker-focused, .axx299-modal .ant-input:focus, .axx299-modal .ant-input-focused, .axx299-modal .ant-input-number-focused, .axx299-modal .ant-select-focused .ant-select-selector, .axx299-modal .ant-picker-focused {
          border-color:#1677ff !important; box-shadow:0 0 0 2px rgba(22,119,255,.2) !important; outline:none; }
.axx299 .ant-input[disabled], .axx299 .ant-input-number-disabled, .axx299 .ant-select-disabled .ant-select-selector, .axx299 .ant-picker-disabled, .axx299-modal .ant-input[disabled], .axx299-modal .ant-input-number-disabled, .axx299-modal .ant-select-disabled .ant-select-selector, .axx299-modal .ant-picker-disabled {
          border-color:#b8c4d1 !important; background:#f5f5f5 !important; }
.axx299 .ant-input[readonly], .axx299-modal .ant-input[readonly] {
          background:#fff !important; color:#595959 !important; cursor:default; }
.axx299 .ant-select[aria-readonly="true"] .ant-select-selector {
          background:#fff !important; color:#595959 !important; cursor:default; }
`;

  const statusLine = policy ? (policy.code + ' — ' + ((policy.Product && (policy.Product.name || policy.Product.description)) || policy.productCode)
    + ' — ' + t('Vigencia') + ' ' + day10(policy.start) + ' → ' + day10(policy.end)) : t('Sin póliza');
  const rv = sim ? validateReinsurance() : { ok: false, errors: [] };

  return (
    <DefaultPage title={t('Inclusión de coberturas')} subTitle={policy ? policy.code : ''}>
      <div className="axx299">
        <style>{css}</style>
        {running ? (
          <div className="axx-execution-mask" role="alert" aria-busy="true">
            <div><Spin size="small" /> {t('Procesando endoso, espere por favor...')}</div>
          </div>
        ) : null}

        <div className="axx-status">
          <b>{t('Póliza')}:</b> {statusLine}
          {quote ? <span>{' | '}<b>{t('Movimiento a facturar')}:</b> {fmt(quote.billing.total.prorated)}</span> : null}
          {reinsuranceConfirmed ? <span>{' | '}<b>{t('Reaseguro')}:</b> {t('confirmado')}</span> : null}
        </div>

        <div className="axx-topbar">
          {!openedWithPolicy ? (
            <>
            <span>{t('Póliza')}</span>
            <Input id="txtBuscarPoliza" style={{ width: 200 }} placeholder={t('Número o código')}
              value={buscarPoliza} onChange={function (e) { setBuscarPoliza(e.target.value); }} onPressEnter={buscar} />
            <Button id="btnBuscarPoliza" onClick={buscar} loading={loading}>{t('Cargar póliza')}</Button>
            </>
          ) : null}
          {policy ? (
            <>
              <span className="axx-topbar-label">{t('Fecha efectiva')}</span>
              <DatePicker id="dtEfectiva" value={effectiveDate} format="YYYY-MM-DD" allowClear={false}
                disabled={running || (result && result.ok)}
                onChange={function (d) { setEffectiveDate(d); setQuote(null); setSim(null); setReinsuranceConfirmed(false); }} />
              <Button id="btnCotizar" type="primary" onClick={cotizar} loading={quoting}
                disabled={running || disabledRemove || (result && result.ok)}>
                {t('Calcular endoso')}
              </Button>
              {quote ? <span className="axx-topbar-summary">{t('Prorrata')}: {num(quote.detail.remainingDays)} / {num(quote.detail.policyDuration)} {t('días')} = {num(quote.prorate).toFixed(6)}</span> : null}
            </>
          ) : null}
          <Button id="btnConfirmarReaseguro" type="primary" onClick={confirmarReaseguro} disabled={!quote || running || (result && result.ok)}>
            {t('Confirmar reaseguro')}
          </Button>
          <Button id="btnEjecutar" type="primary" disabled={!puedeEjecutar} loading={running}
            onClick={function () { setNote(''); setNoteTouched(false); setModal(true); }}>
            {t('Ejecutar endoso')}
          </Button>
          <Button className="axx-btn-sec axx-return-btn" icon={<ReturnIcon />} onClick={retornarAPoliza} disabled={!policyId || running}>
            {t('Retornar')}
          </Button>
        </div>

        {disabledRemove ? <Alert type="warning" showIcon message={t('El producto tiene deshabilitado el endoso de exclusión de coberturas (ChangeRemoveCoverage).')} /> : null}
        {policy && policy.active === false ? <Alert type="warning" showIcon message={t('La póliza no está activa.')} /> : null}
        {error ? <Alert className="axx-alerta" type="error" showIcon message={error} closable onClose={function () { setError(null); }} /> : null}
        {result ? (
          <Alert type={result.ok === false ? 'error' : 'success'} showIcon
            message={result.ok === false ? t('El endoso no se completó') : t('Endoso procesado')}
            description={result.msg} closable onClose={function () { setResult(null); }} />
        ) : null}
        {result && result.written && result.written.length ? (
          <div className="axx-panel" style={{ borderTop: '1px solid #cbd1d8' }}>
            <Table size="small" pagination={false} rowKey="id" dataSource={result.written} columns={colsWritten}
              title={function () { return t('Cesión escrita por el endoso'); }} />
          </div>
        ) : null}

        {loading ? <div style={{ padding: 16 }}><Spin /> {t('Cargando póliza...')}</div> : null}
        {!loading && !policy ? <Empty description={t('Abra la vista desde las acciones de la póliza o indique aquí su número o código')} /> : null}

        {policy ? (
          <Tabs className="axx-tabs" activeKey={tab} onChange={setTab} type="card" items={[
            { key: 'calc', label: t('Coberturas y tarifas'), children: (
              <div className="axx-panel" style={{ padding: 8 }}>
                <div className="axx-section-toolbar">
                  <b>{t('Coberturas a excluir')}</b>
                  <Button type="primary" onClick={function () { setCoverageDraft(selected.slice()); setCoverageModal(true); }} disabled={running || disabledRemove || (result && result.ok)}>
                    {t('Excluir cobertura')}
                  </Button>
                </div>
                <Table size="small" rowKey="code" pagination={false} scroll={{ x: 'max-content' }} dataSource={selectedRows} columns={colsSelected}
                  locale={{ emptyText: t('No hay coberturas seleccionadas para excluir.') }}
                  title={function () { return t('Coberturas seleccionadas para excluir'); }} />
                {quote ? (
                  <div style={{ marginTop: 8 }}>
                    {quote.zero.length ? <Alert type="warning" showIcon message={t('Coberturas cotizadas con suma y prima en cero') + ': ' + quote.zero.map(function (z) { return z.code; }).join(', ')} /> : null}
                    <Table size="small" rowKey="code" pagination={false} dataSource={quote.rows} columns={colsQuote}
                      title={function () { return t('Coberturas a excluir (cotizadas)'); }} />
                    <Table size="small" rowKey="label" pagination={false} columns={colsResumen} style={{ marginTop: 8 }}
                      dataSource={[
                        Object.assign({ label: t('Prima') }, quote.billing.premium),
                        Object.assign({ label: t('Impuesto') }, quote.billing.tax),
                        Object.assign({ label: t('Total') }, quote.billing.total)
                      ]} title={function () { return t('Resumen de facturación'); }} />
                  </div>
                ) : null}
              </div>
            ) },
            { key: 'estado', label: t('Estado de coberturas'), children: (
              <div className="axx-panel" style={{ padding: 8 }}>
                {!quote ? <Empty description={t('Calcule el endoso para simular el nuevo estado de la póliza.')} /> : (
                  <Table size="small" rowKey="key" pagination={false} dataSource={quote.stateRows || []} columns={colsCoverageState} scroll={{ x: true }}
                    title={function () { return t('Estado actual y estado simulado después del endoso'); }} />
                )}
              </div>
            ) },
            { key: 'rea', label: t('Reaseguro del movimiento'), children: (
              <div className="axx-panel" style={{ padding: 8 }}>
                {!quote ? <Empty description={t('Calcule el endoso para ver el reaseguro del movimiento.')} /> : null}
                {quote && sim && !sim.hasContracts ? <Alert type="info" showIcon message={t('La póliza no tiene reaseguro vigente: el endoso se ejecuta sin distribución de reaseguro.')} /> : null}
                {quote && sim && sim.rows.length ? (
                  <div>
                    <Alert type="info" showIcon message={t('Distribución de reaseguro sobre el estado final del endoso')}
                      description={t('Las sumas y primas mostradas corresponden al estado final de las coberturas, no únicamente al importe prorrateado del movimiento.')} />
                    <Table className="axx-rea-contracts" size="small" rowKey="key" pagination={false} dataSource={contractRows} columns={colsReaContracts} scroll={{ x: true }}
                      rowSelection={{ type: 'radio', selectedRowKeys: selectedReinsuranceKey ? [selectedReinsuranceKey] : [], onChange: function (keys) {
                        setSelectedReinsuranceKey(keys[0] || null); setSelectedReinsuranceLineKey(null); setReinsurersReady(false); setReaDetailTab('distribution');
                      } }}
                      onRow={function (row) { return { onClick: function () { setSelectedReinsuranceKey(row.key); setSelectedReinsuranceLineKey(null); setReinsurersReady(false); } }; }}
                      title={function () { return t('Contratos de reaseguro'); }} />
                    {contractRows.filter(function (row) { return row.key === selectedReinsuranceKey; }).map(function (contract) {
                      const lines = selectedReinsuranceLineKey ? contract.lines.filter(function (line) {
                         return String(line.contractId) + '|' + normalizeReinsuranceLine(line.lineId) === selectedReinsuranceLineKey;
                       }) : contract.lines;
                      const participants = [];
                      lines.forEach(function (line) { renderLineParticipants(line).forEach(function (participant) { participants.push(Object.assign({}, participant, { key: line.key + '|' + participant.key, coverageCode: line.lineId })); }); });
                      return <Tabs key={contract.key} className="axx-rea-detail-tabs" type="card" activeKey={reaDetailTab} onChange={setReaDetailTab}>
                        <Tabs.TabPane tab={t('Distribución')} key="distribution">
                          <div className="axx-rea-actions">
                            <Button type="primary" onClick={guardarDistribucionMemoria}>{t('Guardar')}</Button>
                            <span>{t('Distribución de reaseguro')}</span>
                          </div>
                          <Table size="small" pagination={false} rowKey="key" dataSource={contract.lineRows} columns={colsReaLines} scroll={{ x: true }} summary={function () {
                            const rows = contract.lineRows || [];
                            const percentage = rows.filter(function (row) { return !row.coinsurance; }).reduce(function (sum, row) { return sum + num(row.percentage); }, 0);
                            const total = function (field) { return rows.reduce(function (sum, row) { return sum + num(row[field]); }, 0); };
                            return <Table.Summary><Table.Summary.Row className="axx-rea-total-row">
                              <Table.Summary.Cell index={0}><b>{t('Totales')}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={1} align="right"><b>{percentage.toFixed(4)}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={2} align="right"><b>{fmt(total('sum'))}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={3} align="right"><b>{fmt(total('premium'))}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={4}></Table.Summary.Cell>
                              <Table.Summary.Cell index={5} align="right"><b>{fmt(total('commission'))}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={6}></Table.Summary.Cell>
                              <Table.Summary.Cell index={7} align="right"><b>{fmt(total('tax'))}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={8} align="right"><b>{fmt(total('reinsuranceBalance'))}</b></Table.Summary.Cell>
                            </Table.Summary.Row></Table.Summary>;
                          }} />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab={t('Reaseguradores')} key="reinsurers" disabled={!reinsurersReady}>
                          {reinsurersReady ? <Table size="small" pagination={false} rowKey="key" dataSource={participants} columns={[
                            { title: t('Línea'), dataIndex: 'coverageCode', width: 100 },
                            { title: t('Reasegurador'), dataIndex: 'contactId', render: function (v) { return contactNames[Number(v)] || v; } },
                            { title: t('% Participación'), dataIndex: 'split', align: 'right', render: function (v) { return num(v).toFixed(2) + ' %'; } },
                            { title: t('Suma cedida'), dataIndex: 'sumInsured', align: 'right', render: function (v) { return fmt(v); } },
                            { title: t('Prima cedida'), dataIndex: 'premium', align: 'right', render: function (v) { return fmt(v); } },
                            { title: t('Comisión'), dataIndex: 'commission', align: 'right', render: function (v) { return fmt(v); } },
                            { title: t('Impuesto'), dataIndex: 'tax', align: 'right', render: function (v) { return fmt(v); } }
                          ]} /> : <Empty description={t('Seleccione la carpeta de una línea cedida para ver sus aceptantes.')} />}
                        </Tabs.TabPane>
                        <Tabs.TabPane tab={t('Coaseguro')} key="coinsurance">
                          {renderCoinsuranceTab()}
                        </Tabs.TabPane>
                        <Tabs.TabPane tab={t('Cobertura')} key="coverage">
                          {renderCoverageLines(contract)}
                        </Tabs.TabPane>
                      </Tabs>;
                    })}
                    {!rv.ok ? <Alert type="error" showIcon style={{ marginTop: 8 }} message={rv.errors.join(' ')} /> : null}
                    <div style={{ marginTop: 8, color: '#5a6572' }}>
                      {reinsuranceConfirmed ? <Tag color="green">{t('Confirmado')}</Tag> : <Tag color="orange">{t('Pendiente de confirmar')}</Tag>}
                      {t('Al ejecutar, esta distribución se guarda en el endoso y se escribe en las cesiones del movimiento.')}
                    </div>
                  </div>
                ) : null}
              </div>
            ) },
            { key: 'cuotas', label: t('Cuotas'), children: (
              <div className="axx-panel" style={{ padding: 8 }}>
                {!quote ? <Empty description={t('Calcule el endoso para previsualizar las cuotas.')} /> : (
                  <Table size="small" rowKey="key" pagination={false} dataSource={cuotas} columns={colsCuotas}
                    title={function () { return t('Previsualización de cuotas con el endoso'); }}
                    summary={function () {
                      const b = cuotas.reduce(function (s, r) { return s + r.before; }, 0);
                      const a = cuotas.reduce(function (s, r) { return s + r.after; }, 0);
                      return <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}><b>{t('Total')}</b></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right"><b>{fmt(b)}</b></Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right"><b>{fmt(a)}</b></Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="right"><b>{conSigno(a - b)}</b></Table.Summary.Cell>
                        <Table.Summary.Cell index={6} />
                      </Table.Summary.Row>;
                    }} />
                )}
              </div>
            ) }
          ]} />
        ) : null}

        <Modal className="axx299-modal" open={coverageModal} visible={coverageModal} title={t('Excluir cobertura')} width={760}
          onCancel={function () { setCoverageModal(false); }} onOk={function () {
            setSelected(coverageDraft.slice()); setQuote(null); setSim(null); setReinsuranceConfirmed(false); setCoverageModal(false);
          }}
          okText={t('Excluir')} cancelText={t('Cancelar')}>
          <Table size="small" rowKey="code" pagination={false} scroll={{ y: 420 }} dataSource={eligible} columns={colsEligible}
            locale={{ emptyText: t('La póliza no tiene coberturas opcionales vigentes para excluir.') }}
            rowSelection={{ selectedRowKeys: coverageDraft, getCheckboxProps: function () { return { disabled: running || (result && result.ok) }; },
              onChange: function (keys) { setCoverageDraft(keys.map(String)); } }} />
        </Modal>
        <Modal open={modal} visible={modal} title={t('Ejecutar endoso de exclusión de coberturas')} onCancel={function () { setModal(false); }}
          onOk={ejecutar} okText={t('Ejecutar')} cancelText={t('Cancelar')} okButtonProps={{ id: 'btnConfirmarEjecucion', disabled: running }}>
          <p>{t('Se excluirán las coberturas')} {quote ? quote.rows.map(function (r) { return r.code; }).join(', ') : ''} {t('con fecha efectiva')} {effectiveDate ? effectiveDate.format('YYYY-MM-DD') : ''}.</p>
          <div>{t('Observación')} *</div>
          <Input.TextArea id="txtObservacion" rows={3} value={note} onChange={function (e) { setNote(e.target.value); }} />
          {noteTouched && !txt(note) ? <div style={{ color: '#cf1322' }}>{t('La observación es obligatoria.')}</div> : null}
        </Modal>
      </div>
    </DefaultPage>
  );
}
