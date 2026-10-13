/*
 * @Author Cesar Aguilar
 * @name Fusion-de-Solicitudes
 * @description Vista que permite realizar la fusión de pagos agrupados por beneficiarios
 * @purpose Permite al usuario realizar fusiones de varias solicitudes en una validando el beneficiario y de la misma manera generar el reporte de solicitud de pago.
 * @version 1.0.0
 * @created 2026-10-12
 */
() => {
  const Card = A.Card;
  const Button = A.Button;
  const Table = A.Table;
  const Tooltip = A.Tooltip;
  const Drawer = A.Drawer;
  const Select = A.Select;
  const DatePicker = A.DatePicker;
  const RangePicker = DatePicker && DatePicker.RangePicker;
  const MonthPicker = DatePicker && (DatePicker.MonthPicker || DatePicker);
  const [filtersVisible, setFiltersVisible] = React.useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState([]);
  const Modal = A.Modal;
  const Input = A.Input;
  const Alert = A.Alert;
  const [rows, setRows] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [tableScrollY, setTableScrollY] = React.useState(420);
  const tableGridRef = React.useRef(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [mergeVisible, setMergeVisible] = React.useState(false);
  const [mergeError, setMergeError] = React.useState('');
  const [merging, setMerging] = React.useState(false);
  const mounted = React.useRef(true);
  const queryVersion = React.useRef(0);
  const mergeLock = React.useRef(false);
  const mergeNeedsRefresh = React.useRef(false);
  const loadingRef = React.useRef(false);
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState('');
  const exportLock = React.useRef(false);
  const exportVersion = React.useRef(0);
  const xlsxLibraryPromiseRef = React.useRef(null);
  const [documentOpening, setDocumentOpening] = React.useState(false);
  const [documentError, setDocumentError] = React.useState('');
  const documentLock = React.useRef(false);
  const documentVersion = React.useRef(0);
  const documentWindowRef = React.useRef(null);
  const DOCUMENT_UPLOAD_ENDPOINT = 'https://sisos-api-latest.axxis-systems.net/proxy/upload';
  const closeUnusedDocumentWindow = () => {
    const operation = documentWindowRef.current;
    if (!operation) return;
    if (!operation.opened && operation.window && !operation.window.closed) {
      try { operation.window.close(); } catch (error) { /* Ignore a tab closed by the browser. */ }
    }
    if (documentWindowRef.current === operation) documentWindowRef.current = null;
  };
  const emptyFilters = () => ({ id: '', claimId: '', reference: '', batchId: '', sourceAccountId: '', accountId: '', contactId: '', concept: '', amount: '', amountEnd: '', amountOperator: '', currency: '', paymentMethodCode: '', origin: '', lob: '', claimsFundId: '', createdDay: null, createdMonth: null, dueRange: [], releaseRange: [], branch: '', retrieveAllPages: false });
  const [draftFilters, setDraftFilters] = React.useState(emptyFilters());
  const [filterError, setFilterError] = React.useState('');
  const appliedFilters = React.useRef(emptyFilters());
  const [filterCatalogs, setFilterCatalogs] = React.useState({
    currency: { options: [], loading: false, error: '' },
    paymentMethodCode: { options: [], loading: false, error: '' },
    branch: { options: [], loading: false, error: '' },
    lob: { options: [], loading: false, error: '' },
    claimsFundId: { options: [], loading: false, error: '' }
  });
  const catalogVersion = React.useRef(0);
  const [lookups, setLookups] = React.useState({ claimId: { options: [], loading: false, error: '' }, contactId: { options: [], loading: false, error: '' }, sourceAccountId: { options: [], loading: false, error: '' }, accountId: { options: [], loading: false, error: '' } });
  const lookupTimers = React.useRef({});
  const lookupVersions = React.useRef({ claimId: 0, contactId: 0, sourceAccountId: 0, accountId: 0 });
  const selectedLookupLabels = React.useRef({ claimId: {}, contactId: {}, sourceAccountId: {}, accountId: {} });
  const pageSize = 15;
  const excludedStates = ['EXECUTED', 'REJECTED', 'REVERTED', 'MERGED'];
  const fixedFilter = excludedStates.map(state => "entityState!='" + state + "'").join(' AND ');
  const nativeOrigins = [
    { value: 'claim', label: 'Siniestro' }, { value: 'policy', label: 'Póliza' },
    { value: 'COM', label: 'Liquidación de comisiones' }, { value: 'TAX', label: 'Liquidación de impuestos' },
    { value: 'RE', label: 'Liquidación de reaseguro' }, { value: 'REPROFIT', label: 'Liquidación de la comisión de utilidad del reaseguro' },
    { value: 'COI', label: 'Liquidación de coaseguro' }, { value: 'ANNUITIES', label: 'Renta vitalicia' },
    { value: 'MERGED', label: 'Pagos fusionados' }, { value: 'MANUAL', label: 'Solicitud manual' },
    { value: 'REINST', label: 'Reinsurance Reinstatements' }, { value: 'EXNI', label: 'Non Insurance Expense' },
    { value: 'CLAIMSFUND', label: 'Claims Fund Funding' }, { value: 'SERVICELIQ', label: 'Service Order Liquidation' },
    { value: 'CREDIT', label: 'Credit Payable' }
  ];
  const producerOrigins = new Set(nativeOrigins.map(option => option.value).filter(value => value !== 'claim' && value !== 'policy'));
  const message = (failure, fallback) => failure && typeof failure.msg === 'string' && failure.msg.trim() ? failure.msg : fallback;
  const positiveId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
  const eligible = row => positiveId(row.id) && !excludedStates.includes(row.entityState);
  const isMerged = value => ['merged', 'fusionada'].includes(String(value == null ? '' : value).trim().toLowerCase());
  const toggleRowSelection = row => {
    if (!row || isMerged(row.producer) || loading || merging || mergeVisible) return;
    const key = String(row.id);
    setSelectedRowKeys(previous => previous.includes(key)
      ? previous.filter(item => item !== key) : previous.concat(key));
  };
  const display = value => value == null || value === '' ? '—' : String(value);
  const mergedDisplay = value => isMerged(value)
    ? <span className="fusion-requests-merged">Fusionada</span> : display(value);
  const mergedEllipsisDisplay = value => {
    const merged = isMerged(value);
    const text = merged ? 'Fusionada' : display(value);
    return <Tooltip title={text}><span className={'fusion-requests-ellipsis' + (merged ? ' fusion-requests-merged' : '')}>{text}</span></Tooltip>;
  };
  const ellipsisDisplay = value => {
    const text = display(value);
    return <Tooltip title={text}><span className="fusion-requests-ellipsis">{text}</span></Tooltip>;
  };
  const requestAmountDisplay = (value, row) => {
    const amount = Number(value);
    const tone = Number.isFinite(amount) ? amount > 0 ? 'fusion-requests-amount-positive'
      : amount < 0 ? 'fusion-requests-amount-negative' : '' : '';
    return <span className={tone}>{money(value, row.currency)}</span>;
  };
  const currencyFlag = currency => String(currency || '').trim().toUpperCase() === 'USD' ? '🇺🇸' : '';
  const currencyOptionLabel = (name, currency) => [currencyFlag(currency), name].filter(Boolean).join(' ');
  const claimsFundOptionLabel = row => {
    const name = row && row.name != null && String(row.name).trim() ? String(row.name) : 'Sin nombre';
    const balance = row && Number(row.balance);
    if (!Number.isFinite(balance)) return name;
    const currency = row && row.currency != null && String(row.currency).trim() ? ' ' + String(row.currency) : '';
    return name + ' · ' + balance.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + currency;
  };
  const claimOptionLabel = row => {
    // Use the creation calendar date for display; native date-field parity is not yet proven.
    const date = typeof row.created === 'string' ? row.created.slice(0, 10) : '';
    return String(row.id) + (dateOnly(date) !== '—' ? '-' + date : '');
  };
  const catalogLabel = (key, value) => {
    if (value == null || value === '') return '—';
    const catalog = filterCatalogs[key];
    const option = catalog.options.find(item => item.value === String(value) || (key === 'branch' && item.label === String(value)));
    return option ? option.label : catalog.loading ? 'Cargando nombre…' : 'Nombre no disponible';
  };
  const dateOnly = value => {
    if (typeof value !== 'string') return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?)?$/i.exec(value);
    if (!match || Number(match[1]) < 1000) return '—';
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    const calendar = new Date(Date.UTC(year, month - 1, day));
    if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return '—';
    if (!match[4]) return match[3] + '/' + match[2] + '/' + match[1];
    if (Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6]) > 59) return '—';
    // Repository timestamps without an offset are UTC, matching the claim-summary view.
    const timestamp = value.slice(0, 10) + 'T' + match[4] + ':' + match[5] + ':' + match[6]
      + (match[7] ? '.' + match[7].slice(0, 3) : '') + (match[8] || 'Z');
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? '—' : String(date.getDate()).padStart(2, '0') + '/'
      + String(date.getMonth() + 1).padStart(2, '0') + '/' + date.getFullYear();
  };
  const money = (value, currency) => {
    if (value == null || value === '' || !Number.isFinite(Number(value))) return '—';
    const amount = Number(value);
    if (String(currency || '').trim().toUpperCase() === 'USD') return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'symbol', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return amount.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + catalogLabel('currency', currency);
  };
  const calendarRange = (first, last, unit) => {
    const parse = value => {
      const text = value && typeof value.format === 'function' ? value.format(unit === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD') : String(value || '');
      const pattern = unit === 'month' ? /^(\d{4})-(\d{2})$/ : /^(\d{4})-(\d{2})-(\d{2})$/;
      const match = pattern.exec(text);
      if (!match) throw new Error('Seleccione fechas válidas.');
      const year = Number(match[1]), month = Number(match[2]), day = unit === 'month' ? 1 : Number(match[3]);
      const date = new Date(year, month - 1, day);
      if (year < 1000 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error('Seleccione fechas válidas.');
      return date;
    };
    const start = parse(first), endDay = parse(last);
    if (start > endDay) throw new Error('La fecha final debe ser igual o posterior a la inicial.');
    const next = unit === 'month' ? new Date(endDay.getFullYear(), endDay.getMonth() + 1, 1) : new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate() + 1);
    const end = new Date(next.getTime() - 1000);
    if (end.getUTCFullYear() > 9999) throw new Error('La fecha final está fuera del rango admitido.');
    return [start, end].map(date => date.toISOString().slice(0, 19).replace('T', ' '));
  };
  // Only evidenced predicates are accepted; never interpolate unrestricted expressions.
  const buildFilter = filters => {
    const parts = [fixedFilter];
    ['id', 'claimId', 'batchId', 'sourceAccountId', 'accountId', 'contactId', 'claimsFundId'].forEach(key => {
      const value = String(filters[key] == null ? '' : filters[key]).trim();
      if (!value) return;
      if (!/^[0-9]+$/.test(value) || !positiveId(value)) throw new Error('Los identificadores deben ser enteros positivos.');
      parts.push(key + '=' + Number(value));
    });
    const reference = String(filters.reference == null ? '' : filters.reference).trim();
    if (reference) parts.push("reference LIKE N'%" + reference.replace(/'/g, "''") + "%'");
    const concept = String(filters.concept == null ? '' : filters.concept).trim();
    if (concept) parts.push("concept LIKE N'%" + concept.replace(/'/g, "''") + "%'");
    const amount = String(filters.amount == null ? '' : filters.amount).trim();
    const amountEnd = String(filters.amountEnd == null ? '' : filters.amountEnd).trim();
    const comparison = filters.amountOperator || '';
    if (amount || amountEnd || comparison) {
      if (!['=', '<', '>', 'BETWEEN'].includes(comparison)) throw new Error('Seleccione el modo de comparación del monto.');
      const validDecimal = value => /^-?[0-9]+(?:\.[0-9]+)?$/.test(value) && Number.isFinite(Number(value));
      if (!validDecimal(amount)) throw new Error('Ingrese un monto válido con punto decimal.');
      if (comparison === 'BETWEEN') {
        if (!validDecimal(amountEnd) || Number(amountEnd) < Number(amount)) throw new Error('Ingrese un monto final igual o mayor al inicial.');
        parts.push('total BETWEEN ' + amount + ' AND ' + amountEnd);
      } else parts.push('total' + comparison + amount);
    }
    ['currency', 'paymentMethodCode'].forEach(key => {
      const code = String(filters[key] == null ? '' : filters[key]);
      if (!code.trim()) return;
      parts.push(key + "='" + code.replace(/'/g, "''") + "'");
    });
    const origin = String(filters.origin == null ? '' : filters.origin);
    if (origin === 'claim') parts.push('(claimId is not null)');
    else if (origin === 'policy') parts.push('(lifePolicyId is not null AND producer is null AND claimId is null)');
    else if (origin && producerOrigins.has(origin)) parts.push("producer='" + origin + "'");
    else if (origin) throw new Error('Seleccione un origen disponible.');
    const lob = String(filters.lob == null ? '' : filters.lob);
    if (lob) {
      const escapedLob = lob.replace(/'/g, "''");
      if (origin === 'claim') parts.push("claimId in (SELECT id FROM Claim WHERE lifePolicyId in (SELECT id from LifePolicy where lob='" + escapedLob + "'))");
      else if (origin === 'policy') parts.push("lifePolicyId in (SELECT id from LifePolicy where lob='" + escapedLob + "')");
      else throw new Error('Seleccione Siniestro o Póliza como origen para filtrar por ramo.');
    }
    const dateClause = (field, range, due) => {
      if (!range || !range.length) return;
      if (range.length !== 2 || !range[0] || !range[1]) throw new Error('Complete ambas fechas del rango.');
      const bounds = calendarRange(range[0], range[1]);
      const clause = field + " BETWEEN '" + bounds[0] + "' AND '" + bounds[1] + "'";
      parts.push(due ? "id in (SELECT entityId FROM Proceso WHERE entity='ClaimPayment' AND " + clause + ')' : clause);
    };
    if (filters.createdDay) dateClause('date', [filters.createdDay, filters.createdDay]);
    if (filters.createdMonth) {
      const bounds = calendarRange(filters.createdMonth, filters.createdMonth, 'month');
      parts.push("date BETWEEN '" + bounds[0] + "' AND '" + bounds[1] + "'");
    }
    dateClause('dueDate', filters.dueRange, true);
    dateClause('releaseDate', filters.releaseRange);
    const branch = String(filters.branch == null ? '' : filters.branch).trim();
    if (branch) parts.push("branch='" + branch.replace(/'/g, "''") + "'");
    return parts.join(' AND ');
  };
  const loadPayments = (nextPage) => {
    const queryFilter = buildFilter(appliedFilters.current);
    const version = ++queryVersion.current;
    ++documentVersion.current;
    closeUnusedDocumentWindow();
    if (documentLock.current) { documentLock.current = false; setDocumentOpening(false); }
    const current = () => mounted.current && version === queryVersion.current;
    loadingRef.current = true;
    setLoading(true);
    setPage(nextPage);
    setError('');
    setRows([]);
    setTotal(0);
    setSelectedRowKeys([]);
    setMergeVisible(false);
    return Promise.resolve().then(() => {
      if (!current()) return null;
      return exe('RepoClaimPayment', {
        operation: 'GET', custom: true, filter: queryFilter,
        size: pageSize, page: nextPage - 1
      });
    }).then(response => {
      if (!current()) return;
      if (!response || response.ok !== true) throw new Error(message(response, 'No se pudieron consultar las solicitudes.'));
      if (!Array.isArray(response.outData) || !Number.isSafeInteger(Number(response.total)) || Number(response.total) < 0) {
        throw new Error('La consulta devolvió una respuesta no válida.');
      }
      const ids = response.outData.map(row => row && String(row.id));
      if (response.outData.some(row => !row || !eligible(row)) || new Set(ids).size !== ids.length) {
        throw new Error('La consulta devolvió solicitudes fuera del filtro o identificadores no válidos.');
      }
      setRows(response.outData);
      setTotal(Number(response.total));
      mergeNeedsRefresh.current = false;
    }).catch(failure => {
      if (current()) setError((failure && failure.message) || 'No se pudieron consultar las solicitudes.');
    }).finally(() => {
      if (current()) { loadingRef.current = false; setLoading(false); }
    });
  };
  const loadFilterCatalogs = includeClaimsFund => {
    const version = ++catalogVersion.current;
    const requests = [
      { key: 'currency', command: 'RepoCurrency', payload: { operation: 'GET' } },
      { key: 'paymentMethodCode', command: 'RepoPaymentMethodCatalog', payload: { operation: 'GET' } },
      { key: 'branch', command: 'RepoBranch', payload: { operation: 'GET' } },
      { key: 'lob', command: 'RepoLob', payload: { operation: 'GET' } }
    ];
    if (includeClaimsFund) requests.push({ key: 'claimsFundId', command: 'RepoClaimsFund', payload: { operation: 'GET', include: ['Account', 'Account.Movements'] } });
    return Promise.all(requests.map(({ key, command, payload }) => {
      setFilterCatalogs(previous => Object.assign({}, previous, { [key]: { options: previous[key].options, loading: true, error: '' } }));
      return Promise.resolve().then(() => {
        if (!mounted.current || version !== catalogVersion.current) return null;
        return exe(command, payload);
      }).then(result => {
        if (!mounted.current || version !== catalogVersion.current) return;
        if (!result || result.ok !== true || !Array.isArray(result.outData)) throw new Error('No se pudo cargar el catálogo. Cierre y vuelva a abrir los filtros para reintentar.');
        const seen = new Set();
        const options = [];
        result.outData.forEach(row => {
          const code = key === 'claimsFundId' ? row && row.id : row && ((key === 'branch' || key === 'lob') && row.code != null ? String(row.code) : row.code);
          if ((key === 'claimsFundId' && !positiveId(code)) || (key !== 'claimsFundId' && (typeof code !== 'string' || !code.trim())) || seen.has(String(code))) return;
          const value = key === 'claimsFundId' ? String(Number(code)) : code;
          seen.add(String(code));
          options.push({ value, label: key === 'claimsFundId' ? claimsFundOptionLabel(row) : row.name ? String(row.name) : 'Sin nombre' });
        });
        setFilterCatalogs(previous => Object.assign({}, previous, { [key]: { options, loading: false, error: '' } }));
      }).catch(failure => {
        if (mounted.current && version === catalogVersion.current) setFilterCatalogs(previous => Object.assign({}, previous, { [key]: { options: previous[key].options, loading: false, error: failure.message || 'Catálogo no disponible.' } }));
      });
    }));
  };
  const cancelLookups = () => {
    Object.keys(lookupVersions.current).forEach(key => {
      ++lookupVersions.current[key];
      clearTimeout(lookupTimers.current[key]);
    });
    if (mounted.current) setLookups(previous => Object.keys(previous).reduce((next, key) => { next[key] = Object.assign({}, previous[key], { loading: false }); return next; }, {}));
  };
  const searchLookup = (key, query) => {
    if (!Object.prototype.hasOwnProperty.call(lookupVersions.current, key)) return;
    clearTimeout(lookupTimers.current[key]);
    const version = ++lookupVersions.current[key];
    const search = String(query || '').trim();
    const current = () => mounted.current && lookupVersions.current[key] === version;
    const update = value => { if (current()) setLookups(previous => Object.assign({}, previous, { [key]: value })); };
    if (!search || (key === 'contactId' && search.length < 2 && !/^[0-9]+$/.test(search))) { update({ options: [], loading: false, error: '' }); return; }
    update({ options: [], loading: true, error: '' });
    lookupTimers.current[key] = setTimeout(() => {
      const escaped = search.replace(/'/g, "''").replace(/[%_\[]/g, character => '[' + character + ']');
      const contact = key === 'contactId';
      const claim = key === 'claimId';
      const name = "TRIM(CONCAT_WS(' ', [name], [middlename], [surname1], [surname2])) LIKE N'%" + escaped + "%'";
      const identity = "[cnp] LIKE N'%" + escaped + "%' OR [nif] LIKE N'%" + escaped + "%' OR [passport] LIKE N'%" + escaped + "%'";
      const numeric = /^[0-9]+$/.test(search) && positiveId(search) ? ' OR [id]=' + Number(search) : '';
      const filter = claim ? "id LIKE N'%" + escaped + "%'" : contact ? '(' + name + ' OR ' + identity + numeric + ')' : "accNo LIKE N'%" + escaped + "%'";
      const payload = claim ? { operation: 'GET', filter } : { operation: 'GET', filter, page: 0, size: 15 };
      Promise.resolve().then(() => current() ? exe(claim ? 'RepoClaim' : contact ? 'GetContacts' : 'RepoAccount', payload) : null).then(result => {
        if (!current()) return;
        if (!result || result.ok !== true || !Array.isArray(result.outData)) throw new Error('No se pudo realizar la búsqueda. Intente nuevamente.');
        const seen = new Set();
        const options = [];
        result.outData.forEach(row => {
          const id = row && (row.id || row.Id);
          if (!positiveId(id) || seen.has(String(id))) return;
          const label = claim ? claimOptionLabel(row) : contact ? [row.name, row.middlename, row.surname1, row.surname2].filter(Boolean).join(' ').trim() || 'Sin nombre' : row.accNo;
          if (!label) return;
          seen.add(String(id)); options.push({ value: String(id), label: claim || contact ? String(label) : [String(label), currencyFlag(row.currency)].filter(Boolean).join(' ') });
        });
        update({ options, loading: false, error: '' });
      }).catch(failure => update({ options: [], loading: false, error: failure.message || 'Búsqueda no disponible.' }));
    }, 300);
  };
  const selectLookup = (key, value) => {
    const normalized = value == null ? '' : String(value);
    const option = lookups[key].options.find(item => item.value === normalized);
    if (option) selectedLookupLabels.current[key][normalized] = option.label;
    setDraftFilters(previous => Object.assign({}, previous, { [key]: normalized }));
  };
  const lookupOptions = key => {
    const options = lookups[key].options.slice();
    const value = draftFilters[key];
    if (value && !options.some(option => option.value === value)) options.unshift({ value, label: selectedLookupLabels.current[key][value] || 'Seleccionado' });
    return options;
  };
  const updateFilter = (key, value) => setDraftFilters(previous => Object.assign({}, previous, key === 'origin' && value !== previous.origin ? { lob: '' } : {}, { [key]: value }));
  const applyFilters = () => {
    if (mergeLock.current || loadingRef.current || mergeVisible) return;
    const snapshot = Object.assign({}, draftFilters);
    try {
      ['currency', 'paymentMethodCode', 'lob', 'claimsFundId'].forEach(key => {
        const code = snapshot[key];
        if (code && code !== appliedFilters.current[key] && !filterCatalogs[key].options.some(option => option.value === code)) {
          throw new Error('Seleccione un valor del catálogo disponible.');
        }
      });
      buildFilter(snapshot);
    } catch (failure) { setFilterError(failure.message); return; }
    appliedFilters.current = snapshot;
    setFilterError('');
    setNotice('');
    cancelLookups();
    setFiltersVisible(false);
    return loadPayments(1);
  };
  const resetFilters = () => {
    if (mergeLock.current || loadingRef.current || mergeVisible) return;
    cancelLookups();
    setLookups({ claimId: { options: [], loading: false, error: '' }, contactId: { options: [], loading: false, error: '' }, sourceAccountId: { options: [], loading: false, error: '' }, accountId: { options: [], loading: false, error: '' } });
    selectedLookupLabels.current = { claimId: {}, contactId: {}, sourceAccountId: {}, accountId: {} };
    const empty = emptyFilters();
    appliedFilters.current = empty;
    setDraftFilters(empty);
    setFilterError('');
    setNotice('');
    return loadPayments(1);
  };
  React.useEffect(() => {
    mounted.current = true;
    loadPayments(1);
    return () => { mounted.current = false; ++queryVersion.current; ++catalogVersion.current; ++documentVersion.current; closeUnusedDocumentWindow(); documentLock.current = false; cancelLookups(); };
  }, []);
  React.useEffect(() => {
    const updateScrollHeight = () => {
      const gridHeight = tableGridRef.current ? tableGridRef.current.clientHeight : 0;
      // The table body must leave room for its header and pagination inside the grid.
      if (gridHeight > 0) setTableScrollY(Math.max(180, Math.floor(gridHeight - 96)));
    };
    updateScrollHeight();
    const observer = typeof ResizeObserver === 'function' && tableGridRef.current
      ? new ResizeObserver(updateScrollHeight) : null;
    if (observer) observer.observe(tableGridRef.current);
    window.addEventListener('resize', updateScrollHeight);
    return () => { if (observer) observer.disconnect(); window.removeEventListener('resize', updateScrollHeight); };
  }, []);
  React.useEffect(() => { loadFilterCatalogs(); }, []);
  const validateMerge = selected => {
    if (selected.length < 2) return { error: 'Al menos dos elementos deben de ser seleccionados.' };
    if (selected.some(row => !eligible(row)) || new Set(selected.map(row => Number(row.id))).size !== selected.length) {
      return { error: 'La selección contiene solicitudes no válidas para fusionar.' };
    }
    if (selected.some(row => !positiveId(row.contactId))) return { error: 'No se pudo verificar el identificador del beneficiario.' };
    if (selected.some(row => Number(row.contactId) !== Number(selected[0].contactId))) {
      return { error: 'Todos los ítems seleccionados deben tener el mismo beneficiario.' };
    }
    const currency = selected[0].currency;
    if (!currency || selected.some(row => row.currency !== currency)) return { error: 'Seleccione solicitudes con la misma moneda para mostrar un total válido.' };
    if (selected.some(row => row.total == null || row.total === '' || !Number.isFinite(Number(row.total)))) {
      return { error: 'No se pudo verificar el monto de las solicitudes.' };
    }
    const amount = selected.reduce((sum, row) => sum + Number(row.total), 0);
    if (!Number.isFinite(amount)) return { error: 'El monto de la selección no es válido.' };
    return { amount, currency, beneficiary: display(selected[0].beneficiaryName) };
  };
  const selectedRows = rows.filter(row => selectedRowKeys.includes(String(row.id)));
  const mergeSummary = validateMerge(selectedRows);
  const confirmMerge = () => {
    if (mergeLock.current || exportLock.current || documentLock.current || loadingRef.current || !mergeVisible || !mounted.current) return;
    if (mergeNeedsRefresh.current) {
      setMergeError('Cierre y actualice el listado antes de volver a confirmar una fusión.');
      return;
    }
    const validation = validateMerge(selectedRows);
    if (validation.error || selectedRows.length !== selectedRowKeys.length) {
      setMergeError(validation.error || 'La selección ya no pertenece al listado actual.');
      return;
    }
    mergeLock.current = true;
    setMerging(true);
    setMergeError('');
    setNotice('');
    return Promise.resolve().then(() => {
      if (!mounted.current) return null;
      return exe('MergePayments', { paymentIds: selectedRows.map(row => Number(row.id)) });
    }).then(response => {
      if (!mounted.current) return;
      if (!response || response.ok !== true) throw new Error(message(response, 'No se pudo confirmar la fusión.'));
      setNotice(message(response, 'Pagos fusionados.'));
      return loadPayments(1);
    }).catch(failure => {
      mergeNeedsRefresh.current = true;
      if (mounted.current) setMergeError(((failure && failure.message) || 'No se pudo confirmar la fusión.') + ' Cierre y actualice el listado antes de reintentar.');
    }).finally(() => {
      mergeLock.current = false;
      if (mounted.current) setMerging(false);
    });
  };
  const documentUrl = value => {
    if (typeof value !== 'string' || !/^\/(?!\/)/.test(value) || /[\\\x00-\x1f?#]/.test(value)) return null;
    let decoded;
    try { decoded = decodeURIComponent(value); } catch (error) { return null; }
    if (/%(?:2f|5c)/i.test(value) || /[%\\\x00-\x1f?#]/.test(decoded)
      || decoded.split('/').some(part => part === '.' || part === '..')) return null;
    return value;
  };
  const documentAuthorization = () => {
    let token;
    try {
      token = window.localStorage.getItem('token');
      if (typeof token !== 'string' || /[\x00-\x1f\x7f]/.test(token)) throw new Error('invalid');
      token = token.trim();
      if (token.charAt(0) === '"') token = JSON.parse(token);
      if (typeof token !== 'string' || /[\x00-\x1f\x7f]/.test(token)) throw new Error('invalid');
      token = token.trim().replace(/^Bearer(?: +|$)/i, '');
      if (!/^[A-Za-z0-9._~+\/-]+={0,}$/.test(token)) throw new Error('invalid');
    } catch (error) { throw new Error('document-auth'); }
    return 'Bearer ' + token;
  };
  const documentCanPreview = blob => String(blob && blob.type || '').split(';')[0].trim().toLowerCase() === 'application/pdf';
  const openPaymentDocument = row => {
    const paymentId = Number(row && row.id);
    const claimId = Number(row && row.claimId);
    if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
      setDocumentError('No se pudo verificar el identificador de la solicitud para abrir el documento.');
      return;
    }
    if (!Number.isSafeInteger(claimId) || claimId <= 0) {
      setDocumentError('No se pudo verificar el siniestro de la solicitud para abrir el documento.');
      return;
    }
    if (documentLock.current || exportLock.current || loadingRef.current || mergeLock.current || !mounted.current) return;
    let documentWindow = null;
    try { documentWindow = window.open('about:blank', '_blank'); } catch (error) { documentWindow = null; }
    if (!documentWindow) {
      setDocumentError('El navegador bloqueó la nueva pestaña. Permita ventanas emergentes para abrir el documento.');
      return;
    }
    try { documentWindow.opener = null; } catch (error) { /* The tab may already be navigating. */ }
    const version = ++documentVersion.current;
    documentLock.current = version;
    const operation = { window: documentWindow, version: version, opened: false };
    documentWindowRef.current = operation;
    const reportName = 'Solicitud No. ' + paymentId;
    const template = 'Solcitud de Pago.docx';
    const current = () => mounted.current && documentVersion.current === version;
    const closeUnusedWindow = () => {
      if (documentWindowRef.current === operation) closeUnusedDocumentWindow();
    };
    const exactDocument = document => document && Number(document.claimId) === claimId
      && String(document.fileName || '').trim() === reportName
      && String(document.name || '').trim() === template;
    const navigate = document => {
      const path = documentUrl(document && document.url);
      if (!path) throw new Error('El documento existente no tiene una URL válida.');
      return Promise.resolve().then(() => {
        if (!current()) throw new Error('document-stale');
        const base = new URL('.', DOCUMENT_UPLOAD_ENDPOINT);
        const downloadUrl = new URL(path.indexOf(base.pathname) === 0 ? path : base.pathname + path.slice(1), base.origin);
        return window.fetch(downloadUrl.href, {
          method: 'GET', headers: { Authorization: documentAuthorization() }, credentials: 'include', redirect: 'error', cache: 'no-store'
        });
      }).then(response => {
        if (!current()) throw new Error('document-stale');
        if (!response || !response.ok || response.status === 304) {
          const status = response && Number.isInteger(response.status) && response.status >= 100 && response.status <= 599 ? response.status : 0;
          throw new Error('download-http:' + status);
        }
        return Promise.resolve().then(() => response.blob()).catch(() => { throw new Error('download-body'); });
      }).then(blob => {
        if (!current()) throw new Error('document-stale');
        if (!blob || typeof blob.size !== 'number' || blob.size <= 0 || typeof blob.slice !== 'function' || !documentCanPreview(blob)) {
          throw new Error('download-empty');
        }
        const objectUrl = window.URL.createObjectURL(blob);
        documentWindow.location.href = objectUrl;
        operation.opened = true;
        if (documentWindowRef.current === operation) documentWindowRef.current = null;
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
        setNotice(reportName + ' abierto.');
        return true;
      });
    };
    const loadClaimDocuments = () => Promise.resolve().then(() => {
      if (!current()) throw new Error('document-stale');
      return exe('RepoClaimDocument', { operation: 'GET', filter: 'claimId=' + claimId });
    }).then(result => {
      if (!current()) throw new Error('document-stale');
      if (!result || result.ok !== true || !Array.isArray(result.outData)) {
        throw new Error(message(result, 'No se pudieron consultar los documentos del siniestro.'));
      }
      return result.outData;
    });
    setDocumentOpening(true);
    setDocumentError('');
    setNotice('');
    return loadClaimDocuments().then(documents => {
      const exactDocuments = documents.filter(exactDocument);
      const existing = exactDocuments.find(document => documentUrl(document.url));
      if (existing) return navigate(existing);
      if (exactDocuments.length) throw new Error('El documento existente no tiene una URL válida.');
      return Promise.resolve().then(() => {
        if (!current()) throw new Error('document-stale');
        return exe('ExeChain', {
          chain: 'cmdGenerateClaimDocument',
          context: JSON.stringify({
            claimId: claimId,
            context: { paymentId: paymentId },
            template: template,
            reportName: reportName
          })
        });
      }).then(result => {
        if (!current()) throw new Error('document-stale');
        const generated = result && result.outData && typeof result.outData === 'object' ? result.outData : result;
        if (!result || result.ok !== true || !generated || generated.ok !== true || !documentUrl(generated.url)) {
          throw new Error(generated && generated.msg || message(result, 'No se confirmó la generación del documento.'));
        }
        return loadClaimDocuments();
      }).then(documentsAfterGeneration => {
        const generated = documentsAfterGeneration.find(document => exactDocument(document) && documentUrl(document.url));
        if (!generated) throw new Error('El documento se generó, pero no se encontró registrado para abrirlo.');
        return navigate(generated);
      });
    }).catch(failure => {
      closeUnusedWindow();
      if (current() && (!failure || failure.message !== 'document-stale')) {
        const code = failure && failure.message;
        const http = /^download-http:\d+$/.test(code || '') ? Number(code.split(':')[1]) : 0;
        setDocumentError(code === 'document-auth' ? 'No se pudo autenticar la descarga.'
          : http ? 'No se pudo descargar el archivo (HTTP ' + http + ').'
          : code === 'download-body' ? 'No se pudo leer el archivo recibido.'
          : code === 'download-empty' ? 'El archivo recibido no es un PDF válido.'
          : code || 'No se pudo abrir el documento.');
      }
      return false;
    }).finally(() => {
      if (documentLock.current === version) {
        documentLock.current = false;
        if (mounted.current) setDocumentOpening(false);
      }
    });
  };
  // Reuse the SISos SheetJS loader used by the claim-search and remittance views.
  const usableXlsx = library => Boolean(library && typeof library.writeFile === 'function' && library.utils
    && ['aoa_to_sheet', 'book_new', 'book_append_sheet'].every(key => typeof library.utils[key] === 'function'));
  const availableXlsx = () => {
    const runtime = typeof libs !== 'undefined' && libs ? libs : {};
    const globalLibrary = typeof XLSX !== 'undefined' ? XLSX : (typeof window !== 'undefined' ? window.XLSX : null);
    return [runtime.XLSX, runtime.xlsx, runtime.xlsxJs, globalLibrary].find(usableXlsx);
  };
  const ensureXlsx = () => {
    const existing = availableXlsx();
    if (existing) return Promise.resolve(existing);
    if (xlsxLibraryPromiseRef.current) return xlsxLibraryPromiseRef.current;
    xlsxLibraryPromiseRef.current = Promise.resolve().then(() => exe('ExeChain', { chain: 'cmdLoadLibrariesGroupedBordereau', context: '{}' })).then(response => {
      if (!response || response.ok !== true) throw new Error(message(response, 'No se pudo cargar el componente de Excel.'));
      const loaded = response.outData || {};
      const source = loaded.XLSX || loaded.xlsx || loaded.xlsxJs;
      let evaluated = null;
      if (typeof source === 'string') {
        // Only executable library source returned by the established application chain is evaluated.
        const result = eval(source);
        const globalLibrary = typeof XLSX !== 'undefined' ? XLSX : null;
        evaluated = usableXlsx(globalLibrary) ? globalLibrary : result;
      }
      const library = availableXlsx() || (typeof source !== 'string' ? source : null) || evaluated;
      if (!usableXlsx(library)) throw new Error('El componente de Excel no está disponible.');
      if (typeof window !== 'undefined' && !window.XLSX) window.XLSX = library;
      return library;
    }).finally(() => { xlsxLibraryPromiseRef.current = null; });
    return xlsxLibraryPromiseRef.current;
  };
  const exportMatrix = records => {
    const headers = ['Id', 'Beneficiario', 'Fecha', 'Origen', 'Ref', 'Método de pago', 'Concepto', 'Sucursal', 'Check Num', 'Cuenta origen', 'Cuenta destino', 'Fecha límite de pago', 'Release Date', 'Lote', 'Intercambio', 'Resumen', 'Estado', 'Monto', 'Moneda'];
    const text = value => value == null ? '' : String(value);
    return [headers].concat(records.map(row => {
      if (row.total == null || row.total === '' || !Number.isFinite(Number(row.total))) throw new Error('Una solicitud contiene un monto no válido. No se generó el archivo.');
      return [Number(row.id), text(row.beneficiaryName), dateOnly(row.date), text(row.producer), text(row.reference), catalogLabel('paymentMethodCode', row.paymentMethodCode), text(row.concept), catalogLabel('branch', row.branch), text(row.checkNum), text(row.sourceAccountId), text(row.accountId), '', dateOnly(row.releaseDate), text(row.batchId), text(row.transferId), '', text(row.entityState), Number(row.total), catalogLabel('currency', row.currency)];
    }));
  };
  const cancelExport = () => { ++exportVersion.current; setNotice('Descarga cancelada.'); };
  const downloadPayments = () => {
    if (exportLock.current || documentLock.current || loadingRef.current || mergeLock.current || mergeVisible || !mounted.current) return;
    exportLock.current = true;
    setExporting(true); setExportError(''); setNotice('');
    const version = ++exportVersion.current;
    const query = queryVersion.current;
    const active = () => mounted.current && version === exportVersion.current && query === queryVersion.current;
    const check = () => { if (!active()) throw new Error('La descarga se canceló porque cambió el listado.'); };
    const snapshot = Object.assign({}, appliedFilters.current);
    const loadedRows = rows.slice();
    const collected = [], seen = new Set();
    let expected = null;
    const readPage = index => {
      check();
      return Promise.resolve().then(() => {
        check();
        return exe('RepoClaimPayment', { operation: 'GET', custom: true, filter: buildFilter(snapshot), size: pageSize, page: index });
      }).then(response => {
        check();
        if (!response || response.ok !== true) throw new Error(message(response, 'No se pudieron consultar todas las páginas.'));
        const count = Number(response.total), batch = response.outData;
        if (response.total == null || !Number.isSafeInteger(count) || count < 0 || !Array.isArray(batch) || batch.length > pageSize) throw new Error('La consulta de exportación devolvió una respuesta no válida.');
        if (expected === null) expected = count;
        if (count !== expected) throw new Error('El listado cambió durante la descarga. Actualice y vuelva a intentar.');
        batch.forEach(row => {
          if (!row || !eligible(row) || seen.has(String(row.id))) throw new Error('La descarga contiene solicitudes no válidas o repetidas. Actualice y vuelva a intentar.');
          seen.add(String(row.id)); collected.push(row);
        });
        if (collected.length > expected || (!batch.length && collected.length < expected)) throw new Error('La consulta de exportación quedó incompleta. No se generó el archivo.');
        if (collected.length === expected) return collected;
        if (batch.length !== pageSize) throw new Error('La consulta de exportación quedó incompleta. No se generó el archivo.');
        return readPage(index + 1);
      });
    };
    return Promise.resolve().then(() => {
      check();
      return snapshot.retrieveAllPages ? readPage(0) : loadedRows;
    }).then(records => {
      check();
      if (!records.length) { setNotice('No hay solicitudes para descargar.'); return null; }
      const matrix = exportMatrix(records);
      return ensureXlsx().then(library => {
        check();
        const sheet = library.utils.aoa_to_sheet(matrix);
        records.forEach((row, index) => { const cell = sheet['R' + (index + 2)]; if (cell) cell.z = '#,##0.00'; });
        sheet['!cols'] = matrix[0].map((name, index) => ({ wch: [1, 4, 5, 6].includes(index) ? 28 : 20 }));
        sheet['!autofilter'] = { ref: sheet['!ref'] || 'A1:S1' };
        const workbook = library.utils.book_new();
        library.utils.book_append_sheet(workbook, sheet, 'Solicitudes de pago');
        return Promise.resolve(library.writeFile(workbook, 'solicitudes-de-pago-' + new Date().toISOString().slice(0, 10) + '.xlsx', { bookType: 'xlsx', compression: true })).then(() => {
          if (active()) setNotice(records.length + ' solicitudes descargadas en Excel.');
        });
      });
    }).catch(failure => {
      if (mounted.current && version === exportVersion.current) setExportError((failure && failure.message) || 'No se pudo descargar el archivo Excel.');
    }).finally(() => { exportLock.current = false; if (mounted.current) setExporting(false); });
  };
  const actionPaths = {
    refresh: 'M832 192v224H608l88-88a256 256 0 1 0 72 248h82A336 336 0 1 1 753 271l79-79z',
    download: 'M472 128h80v384h128L512 704 344 512h128V128zM160 800h704v80H160z',
    filter: 'M128 160h768L560 544v256l-96 64V544L128 160z',
    merge: 'M192 128h80v192l200 160V128h80v352l200-160V128h80v232L552 584v152h120L512 896 352 736h120V584L192 360V128z',
    document: 'M224 96h384l192 192v640H224V96zm80 80v672h416V336H560V176H304zm48 256h288v64H352v-64zm0 144h288v64H352v-64z'
  };
  const ActionIcon = (props) => React.createElement('span', { className: 'anticon fusion-requests-action-icon', 'aria-hidden': true },
    React.createElement('svg', { viewBox: '64 64 896 896', width: '1em', height: '1em', fill: 'currentColor', focusable: false },
      React.createElement('path', { d: actionPaths[props.name] })));
  // Only verified API fields are mapped; unknown columns remain blank.
  const columns = [
    { title: 'Acciones', key: 'document', width: 155, render: (value, row) => (
      <Button className="fusion-requests-action" disabled={documentOpening || loading || merging || mergeVisible || exporting} loading={documentOpening} onClick={() => openPaymentDocument(row)}><ActionIcon name="document" />Solicitud</Button>
    ) },
    { title: 'Id', dataIndex: 'id', width: 75, align: 'center' },
    { title: 'Beneficiario', dataIndex: 'beneficiaryName', width: 220, render: ellipsisDisplay },
    { title: 'Fecha', dataIndex: 'date', width: 120, align: 'center', render: dateOnly },
    { title: 'Origen', dataIndex: 'producer', width: 100, align: 'center', render: mergedDisplay },
    { title: 'Ref', dataIndex: 'reference', width: 200, render: mergedDisplay },
    { title: 'Método de pago', dataIndex: 'paymentMethodCode', width: 140, render: value => ellipsisDisplay(catalogLabel('paymentMethodCode', value)) },
    { title: 'Concepto', dataIndex: 'concept', width: 220, ellipsis: true, render: mergedEllipsisDisplay },
    { title: 'Monto de solicitud', dataIndex: 'total', width: 120, align: 'right', render: requestAmountDisplay }
  ].map(column => column.render ? column : Object.assign({}, column, { render: display }));
  const filterFields = [
    { label: 'Id', key: 'id', numeric: true, placeholder: 'Id de solicitud' },
    { label: 'Creado el día', key: 'createdDay', date: true },
    { label: 'Creado el mes', key: 'createdMonth', month: true },
    { label: 'Siniestro', key: 'claimId', lookup: true },
    { label: 'Moneda', key: 'currency', catalog: true },
    { label: 'Monto', key: 'amount', amount: true, full: true },
    { label: 'Origen', key: 'origin', origin: true, full: true },
    { label: 'Ramo', key: 'lob', catalog: true, full: true, hidden: !['claim', 'policy'].includes(draftFilters.origin), disabled: false },
    { label: 'Cuenta de origen', key: 'sourceAccountId', lookup: true, full: true },
    { label: 'Cuenta de destino', key: 'accountId', lookup: true, full: true },
    { label: 'Referencia', key: 'reference', placeholder: 'Texto de referencia' },
    { label: 'Concepto', key: 'concept', placeholder: 'Texto del concepto' },
    { label: 'Sucursal', key: 'branch' },
    { label: 'Beneficiario', key: 'contactId', lookup: true, full: true },
    { label: 'Método de pago', key: 'paymentMethodCode', catalog: true }
  ];
  const popupContainer = trigger => trigger.closest('.ant-drawer-body') || trigger.parentNode;
  const filterBusy = loading || merging || mergeVisible;
  return (
    <div className="fusion-requests-shell">
      <style>{`
        .fusion-requests-shell { color:#1e293b; font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; width:100%; height:calc(100dvh - 72px); min-height:0; padding:4px; box-sizing:border-box; display:flex; flex-direction:column; overflow:hidden; background:#f4f6fa; }
        .fusion-requests-shell * { box-sizing:border-box; }
        .fusion-requests-shell > .fusion-requests-card { flex:1 1 auto; display:flex; flex-direction:column; min-width:0; min-height:0; overflow:hidden; border:1px solid #aebdcd; border-radius:8px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
        .fusion-requests-shell .fusion-requests-card > .ant-card-head { flex:0 0 auto; min-height:50px; padding:2px 8px 4px; background:#f4f6fa; border-bottom:2px solid #1e4b8f; }
        .fusion-requests-shell .fusion-requests-card > .ant-card-head .ant-card-head-wrapper { display:flex; flex-wrap:wrap; align-items:center; gap:8px 16px; }
        .fusion-requests-shell .fusion-requests-card > .ant-card-head .ant-card-head-title { flex:1 1 240px; min-width:0; padding:6px 0; white-space:normal; }
        .fusion-requests-shell .fusion-requests-card > .ant-card-head .ant-card-extra { max-width:100%; margin-left:auto; padding:6px 0; }
        .fusion-requests-shell .fusion-requests-card > .ant-card-body { flex:1 1 auto; min-width:0; min-height:0; padding:4px; display:flex; flex-direction:column; overflow:hidden; }
        .fusion-requests-title { display:flex; align-items:center; gap:12px; color:#15356b; font-size:17px; font-weight:700; letter-spacing:-.01em; line-height:1.3; }
        .fusion-requests-title-mark { width:6px; height:30px; flex:0 0 6px; border-radius:3px; background:#1e4b8f; }
        .fusion-requests-header-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; justify-content:flex-end; }
        .fusion-requests-list-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:8px 0; padding:4px; justify-content:flex-start; }
        .fusion-requests-action.ant-btn { height:32px; padding:0 15px; border-radius:4px; font-size:14px; font-weight:500; box-shadow:none; background:#fff; border-color:#d9d9d9; color:#262626; }
        .fusion-requests-action.ant-btn:not([disabled]):hover, .fusion-requests-action.ant-btn:not([disabled]):focus { border-color:#1890ff; color:#1890ff; }
        .fusion-requests-action.ant-btn-primary { background:#1890ff; border-color:#1890ff; color:#fff; }
        .fusion-requests-action.ant-btn-primary:not([disabled]):hover, .fusion-requests-action.ant-btn-primary:not([disabled]):focus { background:#147bd1; border-color:#147bd1; color:#fff; }
        .fusion-requests-action.fusion-requests-export { background:#60b13d; border-color:#4f9336; color:#fff; }
        .fusion-requests-action.fusion-requests-export:not([disabled]):hover, .fusion-requests-action.fusion-requests-export:not([disabled]):focus { background:#4f9336; border-color:#3f7d2c; color:#fff; }
        .fusion-requests-action.ant-btn[disabled], .fusion-requests-action.ant-btn[disabled]:hover { background:#f1f5f9; border-color:#aebdcd; color:#526174; opacity:1; }
        .fusion-requests-action-icon { display:inline-flex; align-items:center; justify-content:center; width:1em; height:1em; margin-right:6px; vertical-align:middle; line-height:1; }
        .fusion-requests-shell fieldset { flex:0 0 auto; min-width:0; padding:4px 8px; border:1px solid #aebdcd; border-radius:8px; margin:4px 0; }
        .fusion-requests-shell legend { width:auto; margin:0; padding:0 6px; color:#15356b; font-size:12.5px; font-weight:700; line-height:1.4; }
        .fusion-requests-shell .ant-table { color:#183153; font-size:12px; }
        .fusion-requests-shell .ant-table-thead > tr > th { padding:6px 8px; background:#bfbfbf; color:#262626; border-bottom:1px solid #cbd1d8; font-weight:700; white-space:nowrap; }
        .fusion-requests-shell .ant-table-tbody > tr > td { padding:6px 8px; border-bottom:1px solid #cbd1d8; }
        .fusion-requests-shell .ant-table-tbody > tr:hover > td { background:#f5f9ff; }
        .fusion-requests-shell .ant-table-tbody > tr.fusion-requests-selected > td, .fusion-requests-shell .ant-table-tbody > tr.fusion-requests-selected:hover > td { background:#b7d5ff; }
        .fusion-requests-shell .ant-table-tbody > tr { cursor:pointer; }
        .fusion-requests-shell .ant-table-tbody > tr > td .ant-btn { cursor:pointer; }
        .fusion-requests-grid .ant-table-body { overflow-x:scroll!important; overflow-y:scroll!important; scrollbar-gutter:stable; }
        .fusion-requests-amount-positive { color:#238636; font-weight:600; }
        .fusion-requests-amount-negative { color:#cf222e; font-weight:600; }
        .fusion-requests-merged { color:#1677ff; font-weight:600; }
        .fusion-requests-ellipsis { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .fusion-requests-shell .ant-checkbox-inner { width:16px; height:16px; border:1px solid #8f9aa7!important; border-radius:3px; background:#fff; }
        .fusion-requests-shell .ant-checkbox:hover .ant-checkbox-inner, .fusion-requests-shell .ant-checkbox-wrapper:hover .ant-checkbox-inner { border-color:#8da9c2!important; }
        .fusion-requests-shell .ant-checkbox-checked .ant-checkbox-inner { border-color:#1677ff!important; background:#1677ff; }
        .fusion-requests-shell .ant-checkbox-input:focus + .ant-checkbox-inner { border-color:#1677ff!important; box-shadow:0 0 0 2px rgba(22,119,255,.2); }
        .fusion-requests-shell .ant-checkbox-disabled .ant-checkbox-inner { border-color:#b8c4d1!important; background:#f5f5f5; }
        .fusion-requests-shell input[type=checkbox]:not(.ant-checkbox-input) { appearance:none; width:16px; height:16px; margin:0 6px 0 0; vertical-align:-3px; border:1px solid #8f9aa7; border-radius:3px; background:#fff; cursor:pointer; }
        .fusion-requests-shell input[type=checkbox]:not(.ant-checkbox-input):hover { border-color:#8da9c2; }
        .fusion-requests-shell input[type=checkbox]:not(.ant-checkbox-input):focus { outline:0; border-color:#1677ff; box-shadow:0 0 0 2px rgba(22,119,255,.2); }
        .fusion-requests-shell input[type=checkbox]:not(.ant-checkbox-input):checked { border-color:#1677ff; background:#1677ff; }
        .fusion-requests-shell input[type=checkbox]:not(.ant-checkbox-input):checked::after { content:''; display:block; width:4px; height:8px; margin:1px 0 0 4px; border:solid #fff; border-width:0 2px 2px 0; transform:rotate(45deg); }
        .fusion-requests-shell input[type=checkbox]:not(.ant-checkbox-input):disabled { border-color:#b8c4d1; background:#f5f5f5; cursor:not-allowed; }
        .fusion-requests-grid { flex:1 1 0; min-width:0; min-height:0; border:1px solid #aebdcd; border-radius:8px; overflow:hidden; background:#fff; }
        .fusion-requests-hint { margin:4px 0; color:#64748b; font-size:12px; }
        .fusion-requests-section { flex:0 0 auto; display:flex; justify-content:space-between; align-items:center; gap:8px; margin:4px 0; padding:4px 8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fbff; }
        .fusion-requests-section h3 { margin:0; color:#15356b; font-size:12.5px; font-weight:700; }
        .fusion-requests-filter-drawer .ant-drawer-content-wrapper { max-width:100vw; }
        .fusion-requests-filter-drawer .ant-drawer-title { color:#15356b; font-weight:700; }
        .fusion-requests-filter-drawer .ant-drawer-body { padding:16px; }
        .fusion-requests-filter-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px 10px; }
        .fusion-requests-filter-field { min-width:0; display:flex; flex-direction:column; gap:6px; color:#262626; font-size:13px; }
        .fusion-requests-filter-field.fusion-requests-filter-full { grid-column:1 / -1; }
        .fusion-requests-filter-control { width:100%; min-width:0; height:34px; padding:4px 10px; border:1px solid #aebdcd; border-radius:4px; background:#fff; color:#183153; font:inherit; }
        .fusion-requests-filter-control:focus { outline:2px solid #91caff; outline-offset:1px; border-color:#1890ff; }
        .fusion-requests-filter-control:disabled { background:#f1f5f9; color:#64748b; cursor:not-allowed; }
        .fusion-requests-amount-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
        .fusion-requests-filter-pair { display:flex; gap:8px; min-width:0; }
        .fusion-requests-filter-help { color:#64748b; font-size:11px; line-height:1.4; }
        .fusion-requests-filter-note { color:#526174; font-size:12px; line-height:1.5; margin:12px 0; }
        .fusion-requests-filter-actions { display:flex; justify-content:flex-end; margin-top:18px; }
        .fusion-requests-filter-export { display:block; color:#64748b; font-size:12px; margin-top:18px; }
        .fusion-requests-empty { padding:32px 12px; color:#64748b; }
        .fusion-requests-merge-modal .ant-modal-content { border:1px solid #aebdcd; border-radius:6px; overflow:hidden; }
        .fusion-requests-merge-modal .ant-modal-header { padding:12px 20px; border-bottom:1px solid #d9e2ec; background:#f8fbff; }
        .fusion-requests-merge-modal .ant-modal-title { color:#183153; font-weight:600; }
        .fusion-requests-merge-modal .ant-modal-body { padding:20px 24px; }
        .fusion-requests-merge-modal .ant-alert { margin-bottom:12px; }
        .fusion-requests-merge-fields { display:flex; flex-direction:column; gap:14px; }
        .fusion-requests-merge-field { display:flex; flex-direction:column; gap:6px; }
        .fusion-requests-merge-field label { color:#43546d; font-size:12px; font-weight:600; line-height:1.5; }
        .fusion-requests-merge-field .ant-input[readonly] { height:34px; color:#183153; background:#f8fbff; border-color:#aebfd4; border-radius:5px; cursor:default; }
        .fusion-requests-merge-field .ant-input[readonly]:hover { border-color:#8da9c2; }
        .fusion-requests-merge-field .ant-input[readonly]:focus { border-color:#1677ff; box-shadow:0 0 0 2px rgba(22,119,255,.12); }
        .fusion-requests-merge-modal .fusion-requests-merge-count { width:90px; max-width:100%; }
        @media (max-width:480px) { .fusion-requests-filter-grid { grid-template-columns:minmax(0,1fr); } }
      `}</style>
      <Card className="fusion-requests-card" size="small" title={
        <div className="fusion-requests-title"><span className="fusion-requests-title-mark" aria-hidden="true" />Fusión de solicitudes</div>
      } extra={
        <div className="fusion-requests-header-actions" role="group" aria-label="Acciones de solicitudes">
          <Button type="primary" className="fusion-requests-action" disabled={loading || merging || exporting || documentOpening} onClick={() => { if (exportLock.current || documentLock.current) return; setMergeError(''); setMergeVisible(true); }}><ActionIcon name="merge" />Fusionar pagos</Button>
          <Button type="primary" className="fusion-requests-action" aria-controls="fusion-requests-filters" aria-expanded={filtersVisible}
            disabled={loading || merging || mergeVisible} onClick={() => { setDraftFilters(Object.assign({}, appliedFilters.current)); setFilterError(''); setFiltersVisible(true); loadFilterCatalogs(true); }}><ActionIcon name="filter" />Filtrar</Button>
        </div>
      }>
        <div className="fusion-requests-list-actions" role="group" aria-label="Acciones del listado">
          <Button className="fusion-requests-action" disabled={merging || mergeVisible} loading={loading} onClick={() => { setNotice(''); loadPayments(1); }}><ActionIcon name="refresh" />Actualizar</Button>
          <Button className="fusion-requests-action fusion-requests-export" disabled={loading || merging || mergeVisible || exporting || documentOpening} loading={exporting} onClick={downloadPayments}><ActionIcon name="download" />Descarga</Button>
          {exporting && <Button className="fusion-requests-action" onClick={cancelExport}>Cancelar descarga</Button>}
        </div>
        {Object.keys(filterCatalogs).some(key => filterCatalogs[key].error) && <Alert type="warning" showIcon message="Algunos nombres de catálogo no están disponibles. Abra los filtros para reintentar su carga." />}
        {error && <Alert type="error" showIcon message={error} description="Pulse Actualizar para reintentar la consulta." />}
        {exportError && <Alert type="error" showIcon message={exportError} />}
        {documentError && <Alert type="error" showIcon message={documentError} />}
        {notice && <Alert type="success" showIcon message={notice} />}
        <div className="fusion-requests-section">
          <h3>Solicitudes pendientes de ejecución</h3>
          <span className="fusion-requests-hint">{selectedRowKeys.length} seleccionadas</span>
        </div>
        <div ref={tableGridRef} className="fusion-requests-grid">
          <Table size="small" bordered tableLayout="fixed" rowKey={(row) => String(row.id)} columns={columns} dataSource={rows}
            rowSelection={{ type: 'checkbox', selectedRowKeys: selectedRowKeys, onChange: keys => setSelectedRowKeys(keys.map(String)), getCheckboxProps: row => ({ disabled: isMerged(row && row.producer) || loading || merging || mergeVisible }) }}
            rowClassName={(row) => selectedRowKeys.includes(String(row.id)) ? 'fusion-requests-selected' : ''}
            onRow={row => ({
              onClick: event => {
                if (event.target.closest('button,a,input,label,.ant-checkbox-wrapper,.ant-select,.ant-picker')) return;
                toggleRowSelection(row);
              }
            })}
            scroll={{ x: 1200, y: tableScrollY }} loading={loading} pagination={{ current: page, pageSize: pageSize, total: total, showSizeChanger: false, disabled: loading || merging || mergeVisible, onChange: nextPage => loadPayments(nextPage), showTotal: count => count + ' solicitudes' }}
            locale={{ emptyText: <div className="fusion-requests-empty">{error ? 'Consulta no disponible.' : loading ? 'Consultando solicitudes…' : 'No hay solicitudes pendientes para mostrar.'}</div> }} />
        </div>
        <Drawer title="Filtro de pagos" placement="right" visible={filtersVisible} width={560}
          className="fusion-requests-filter-drawer" onClose={() => { cancelLookups(); setFiltersVisible(false); }}>
          <form id="fusion-requests-filters" onSubmit={event => { event.preventDefault(); applyFilters(); }}>
            <Button className="fusion-requests-action" disabled={loading || merging || mergeVisible} onClick={resetFilters}>Restablecer</Button>
            {filterError && <Alert type="error" showIcon message={filterError} />}
            <div className="fusion-requests-filter-grid">
              {filterFields.filter(field => !field.hidden).map((field, index) => {
                const id = 'fusion-filter-' + index;
                const catalog = field.catalog ? filterCatalogs[field.key] : null;
                const lookup = field.lookup ? lookups[field.key] : null;
                const hint = catalog ? catalog.error : lookup ? lookup.error : field.help || '';
                const selectProps = { id, style: { width: '100%' }, getPopupContainer: popupContainer, disabled: filterBusy || field.disabled, allowClear: true, 'aria-label': field.label };
                return <div key={field.label} className={'fusion-requests-filter-field' + (field.full ? ' fusion-requests-filter-full' : '')}>
                  <label htmlFor={id}>{field.label}</label>
                  {field.catalog ? <Select {...selectProps} showSearch optionFilterProp="label" placeholder="Todos los valores"
                    value={draftFilters[field.key] || undefined} loading={catalog.loading}
                    options={catalog.options.concat(draftFilters[field.key] && !catalog.options.some(option => option.value === draftFilters[field.key]) ? [{ value: draftFilters[field.key], label: 'Selección actual' }] : []).filter(option => field.key !== 'currency' || option.value === 'USD').map(option => field.key === 'currency' ? Object.assign({}, option, { label: currencyOptionLabel(option.label, option.value) }) : option)}
                    onChange={value => updateFilter(field.key, value || '')} />
                    : field.lookup ? <Select {...selectProps} showSearch filterOption={false} placeholder={field.key === 'claimId' ? 'Buscar número de siniestro' : field.key === 'contactId' ? 'Buscar nombre o identificación' : 'Buscar número de cuenta'}
                      value={draftFilters[field.key] || undefined} options={lookupOptions(field.key)} loading={lookup.loading}
                      notFoundContent={lookup.loading ? 'Buscando…' : 'Sin resultados'} onSearch={value => searchLookup(field.key, value)} onChange={value => selectLookup(field.key, value)} />
                    : field.date ? <DatePicker id={id} format="DD/MM/YYYY" value={draftFilters[field.key]} disabled={filterBusy} style={{ width: '100%' }} getCalendarContainer={popupContainer} onChange={value => updateFilter(field.key, value)} />
                    : field.month ? <MonthPicker id={id} picker="month" format="MM/YYYY" value={draftFilters[field.key]} disabled={filterBusy} style={{ width: '100%' }} getCalendarContainer={popupContainer} onChange={value => updateFilter(field.key, value)} />
                    : field.range ? <RangePicker id={id} format="DD/MM/YYYY" value={draftFilters[field.key]} disabled={filterBusy} style={{ width: '100%' }} getCalendarContainer={popupContainer} onChange={value => updateFilter(field.key, value || [])} />
                    : field.origin ? <Select {...selectProps} placeholder="Seleccionar origen" value={draftFilters.origin || undefined}
                      options={nativeOrigins} onChange={value => updateFilter('origin', value || '')} />
                    : field.amount ? <div className="fusion-requests-amount-fields">
                      <Select {...selectProps} placeholder="Modo de comparación" value={draftFilters.amountOperator || undefined}
                        options={[{ value: '=', label: 'Igual a' }, { value: '<', label: 'Menor que' }, { value: '>', label: 'Mayor que' }, { value: 'BETWEEN', label: 'Entre' }]}
                        onChange={value => setDraftFilters(previous => Object.assign({}, previous, { amountOperator: value || '', amountEnd: '', amount: value ? previous.amount : '' }))} />
                      <input className="fusion-requests-filter-control" inputMode="decimal" value={draftFilters.amount} placeholder={draftFilters.amountOperator === 'BETWEEN' ? 'Monto inicial' : 'Valor'} aria-label="Monto inicial" disabled={filterBusy} onChange={event => updateFilter('amount', event.target.value)} />
                      {draftFilters.amountOperator === 'BETWEEN' && <input className="fusion-requests-filter-control" inputMode="decimal" value={draftFilters.amountEnd} placeholder="Monto final" aria-label="Monto final" disabled={filterBusy} onChange={event => updateFilter('amountEnd', event.target.value)} />}
                    </div> : field.select ? <Select {...selectProps} disabled placeholder="No disponible" options={[]} />
                    : <input id={id} className="fusion-requests-filter-control" value={field.key ? draftFilters[field.key] : ''} inputMode={field.numeric ? 'numeric' : 'text'} placeholder={field.placeholder}
                      disabled={filterBusy || !field.key} onChange={event => updateFilter(field.key, event.target.value)} />}
                  {hint && <small className="fusion-requests-filter-help">{hint}</small>}
                </div>;
              })}
            </div>
            <label className="fusion-requests-filter-export"><input type="checkbox" checked={draftFilters.retrieveAllPages} disabled={filterBusy} onChange={event => updateFilter('retrieveAllPages', event.target.checked)} /> Recuperar todas las páginas para descargar</label>
            <div className="fusion-requests-filter-actions"><Button htmlType="submit" type="primary" className="fusion-requests-action" disabled={loading || merging || mergeVisible}>Buscar</Button></div>
          </form>
        </Drawer>
        <Modal title="Fusionar pagos" className="fusion-requests-merge-modal" width={520} visible={mergeVisible} closable={!merging} maskClosable={false}
          onCancel={() => { if (!mergeLock.current) setMergeVisible(false); }}
          footer={[
            <Button key="cancel" className="fusion-requests-action" disabled={merging} onClick={() => setMergeVisible(false)}>Cancelar</Button>,
            <Button key="confirm" type="primary" className="fusion-requests-action" loading={merging} disabled={loading || exporting || !!mergeSummary.error} onClick={confirmMerge}>Confirmar</Button>
          ]}>
          {(mergeError || mergeSummary.error) && <Alert type="error" showIcon message={mergeError || mergeSummary.error} />}
          <div className="fusion-requests-merge-fields">
            <div className="fusion-requests-merge-field">
              <label htmlFor="fusion-merge-beneficiary">Beneficiario:</label>
              <Input id="fusion-merge-beneficiary" readOnly value={mergeSummary.beneficiary || '—'} />
            </div>
            <div className="fusion-requests-merge-field">
              <label htmlFor="fusion-merge-amount">Monto:</label>
              <Input id="fusion-merge-amount" readOnly value={mergeSummary.error ? '—' : money(mergeSummary.amount, mergeSummary.currency)} />
            </div>
            <div className="fusion-requests-merge-field">
              <label htmlFor="fusion-merge-count">Elementos seleccionados:</label>
              <Input id="fusion-merge-count" className="fusion-requests-merge-count" readOnly value={selectedRows.length} />
            </div>
          </div>
        </Modal>
      </Card>
    </div>
  );
}
