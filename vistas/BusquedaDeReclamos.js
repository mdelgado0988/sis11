/*
 * @name BusquedaDeReclamos
 * @description Vista para consultar, filtrar, ordenar y exportar reclamos.
 * @purpose Facilitar la búsqueda de reclamos y el acceso a su resumen y entidades relacionadas.
 * @version 1.0.1
 * @created 2026-09-28
 */
() => {
  const Form = A.Form;
  const Drawer = A.Drawer;
  const Table = A.Table;
  const Input = A.Input;
  const Select = A.Select;
  const DatePicker = A.DatePicker;
  const Button = A.Button;
  const Space = A.Space;
  const Row = A.Row;
  const Col = A.Col;
  const Alert = A.Alert;
  const Tooltip = A.Tooltip;
  const message = A.message;
  const RangePicker = DatePicker.RangePicker;

  const SearchOutlinedIcon = () => (
    <span role="img" aria-label="search" className="anticon anticon-search">
      <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
        <path d="M909.6 854.5 649.9 594.8a278.5 278.5 0 0 0 64.5-177.2c0-152.3-123.5-275.8-275.8-275.8S162.8 265.3 162.8 417.6s123.5 275.8 275.8 275.8c67.5 0 129.3-24.2 177.2-64.5l259.7 259.7a8 8 0 0 0 11.3 0l22.8-22.8a8 8 0 0 0 0-11.3zM438.6 637.4c-121.4 0-219.8-98.4-219.8-219.8s98.4-219.8 219.8-219.8 219.8 98.4 219.8 219.8-98.4 219.8-219.8 219.8z" />
      </svg>
    </span>
  );

  const ReloadOutlinedIcon = () => (
    <span role="img" aria-label="reload" className="anticon anticon-reload">
      <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
        <path d="M909.1 209.3 862.6 364a8 8 0 0 1-10.7 5.1l-147.4-60.8a8 8 0 0 1-1.6-13.8l50.5-32.3A318.8 318.8 0 0 0 512 148c-176.7 0-320 143.3-320 320s143.3 320 320 320c149.4 0 274.8-102.4 310-240.9a8 8 0 0 1 7.8-6.1h49.8a8 8 0 0 1 7.8 9.8C849.5 717.9 696 844 512 844c-207.7 0-376-168.3-376-376S304.3 92 512 92c116.6 0 220.8 53.1 289.8 136.4l35.9-23a8 8 0 0 1 11.2 3.9z" />
      </svg>
    </span>
  );

  const PAGE_SIZE = 25;
  const EXPORT_PAGE_SIZE = 50;
  const EMPTY_VALUE = '';
  const MAX_FILTER_LENGTH = 200;
  const CLAIM_INCLUDES = ['Contact', 'Process', 'Claimer', 'Policy', 'Stage'];
  const AUDIT_STATUS_OPTIONS = [
    { value: 0, label: 'Ninguno' },
    { value: 1, label: 'Listo para auditoría' },
    { value: 2, label: 'Auditado' }
  ];

  const [form] = Form.useForm();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({});
  const [ordering, setOrdering] = React.useState({ orderBy: 'id', orderDir: 'DESC' });
  const [pagination, setPagination] = React.useState({
    current: 1,
    pageSize: PAGE_SIZE,
    total: 0
  });
  const [catalogsLoading, setCatalogsLoading] = React.useState(false);
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [contactSearchLoading, setContactSearchLoading] = React.useState({ claimant: false, insured: false });
  const [policySearchLoading, setPolicySearchLoading] = React.useState(false);
  const [claimantOptions, setClaimantOptions] = React.useState([]);
  const [insuredOptions, setInsuredOptions] = React.useState([]);
  const [policyOptions, setPolicyOptions] = React.useState([]);
  const [lobOptions, setLobOptions] = React.useState([]);
  const [productCatalog, setProductCatalog] = React.useState([]);
  const [stageOptions, setStageOptions] = React.useState([]);

  const listRequestRef = React.useRef(0);
  const mountedRef = React.useRef(true);
  const shellRef = React.useRef(null);
  const catalogRequestRef = React.useRef(0);
  const contactRequestRef = React.useRef({ claimant: 0, insured: 0 });
  const policyRequestRef = React.useRef(0);
  const productRequestRef = React.useRef(0);
  const searchTimersRef = React.useRef({ claimant: null, insured: null, policy: null });
  const xlsxLibraryPromiseRef = React.useRef(null);

  const firstValue = (value) => Array.isArray(value) ? value[0] : value;

  const cleanString = (value) => String(firstValue(value) || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FILTER_LENGTH);

  const escapeFilterString = (value) => cleanString(value).replace(/'/g, "''");

  const positiveInteger = (value, label) => {
    const normalized = cleanString(value);
    if (!normalized) return null;
    const number = Number(normalized);
    if (!/^\d+$/.test(normalized) || !Number.isSafeInteger(number) || number <= 0) {
      throw new Error(label + ' debe ser un número entero válido mayor que cero.');
    }
    return number;
  };

  const formatFilterDate = (value) => {
    if (!value) return '';
    if (typeof value.format === 'function') return value.format('YYYY-MM-DD');
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error('Se recibió una fecha inválida.');
    const pad = (part) => String(part).padStart(2, '0');
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  };

  /*
   * Igual que la lista nativa de reclamos: el día elegido se interpreta en la zona horaria
   * del usuario y se convierte a un rango UTC, que es como se guardan las fechas.
   */
  const userTimeZone = () => {
    try {
      return window.GLOBAL && window.GLOBAL.currentUser && window.GLOBAL.currentUser.timezone
        ? window.GLOBAL.currentUser.timezone
        : undefined;
    } catch (timeZoneError) {
      return undefined;
    }
  };

  const dayBoundsUtc = (day) => {
    if (typeof moment === 'undefined') return { from: day, to: day + ' 23:59:59' };
    const timeZone = userTimeZone();
    const local = timeZone && typeof momentTimezone !== 'undefined' && momentTimezone.tz
      ? momentTimezone.tz(day, 'YYYY-MM-DD', timeZone)
      : moment(day, 'YYYY-MM-DD');
    return {
      from: local.clone().startOf('day').utc().format('YYYY-MM-DD HH:mm:ss'),
      to: local.clone().endOf('day').utc().format('YYYY-MM-DD HH:mm:ss')
    };
  };

  const validateRange = (range, label) => {
    if (!range || !range.length) return null;
    const from = formatFilterDate(range[0]);
    const to = formatFilterDate(range[1]);
    if (!from || !to) throw new Error('Complete el rango de ' + label + '.');
    if (from > to) throw new Error('La fecha inicial de ' + label + ' no puede ser posterior a la fecha final.');
    return { from: dayBoundsUtc(from).from, to: dayBoundsUtc(to).to };
  };

  const auditStatusValue = (value) => {
    const selected = firstValue(value);
    if (selected === null || selected === undefined || String(selected).trim() === '') return null;
    const status = Number(selected);
    if (!AUDIT_STATUS_OPTIONS.some((option) => option.value === status)) {
      throw new Error('Seleccione un estado de auditoría válido.');
    }
    return status;
  };

  const escapeLikeString = (value) => escapeFilterString(value).replace(/[[%_]/g, '[$&]');

  /*
   * Único punto de adaptación del contrato de filtros de RepoClaim.
   * Los nombres corresponden a los campos observados en la vista actual de SISos.
   */
  const buildRepoClaimFilter = (formValues) => {
    const values = formValues || {};
    const conditions = [];
    const id = positiveInteger(values.id, 'ID');
    const masterClaimId = positiveInteger(values.masterClaimId, 'ID de reclamo maestro');
    const occurrence = validateRange(values.occurrence, 'ocurrencia');
    const notification = validateRange(values.notification, 'notificación');
    const createdDay = formatFilterDate(values.date);
    const created = createdDay ? dayBoundsUtc(createdDay) : null;
    const auditStatus = auditStatusValue(values.auditStatus);

    const addText = (field, value) => {
      const normalized = escapeFilterString(value);
      if (normalized) conditions.push(field + " = '" + normalized + "'");
    };

    /* Campos de la póliza o del proceso: el filtro de RepoClaim es SQL sobre el reclamo, se llega por subconsulta. */
    const addPolicyText = (field, value) => {
      const normalized = escapeFilterString(value);
      if (normalized) conditions.push("lifePolicyId in (select id from lifePolicy where " + field + " = N'" + normalized + "')");
    };

    if (id !== null) conditions.push('id = ' + id);
    if (masterClaimId !== null) conditions.push('masterClaimId = ' + masterClaimId);
    const quickFilter = cleanString(values.quickFilter);
    if (quickFilter) {
      if (/^\d+$/.test(quickFilter) && Number.isSafeInteger(Number(quickFilter))) {
        conditions.push('id = ' + Number(quickFilter));
      } else {
        addText('code', quickFilter);
      }
    }
    addText('code', values.code);
    addText('stageCode', values.stageCode);
    if (created) {
      conditions.push("created >= '" + created.from + "'");
      conditions.push("created <= '" + created.to + "'");
    }
    const claimerId = positiveInteger(values.claimantId, 'Reclamante');
    const contactId = positiveInteger(values.insuredId, 'Asegurado');
    const lifePolicyId = positiveInteger(values.lifePolicyId, 'Póliza');
    if (claimerId !== null) conditions.push('claimerId = ' + claimerId);
    if (contactId !== null) conditions.push('contactId = ' + contactId);
    if (lifePolicyId !== null) conditions.push('lifePolicyId = ' + lifePolicyId);
    const status = escapeFilterString(values.status);
    if (status) {
      conditions.push("processId in (select id from Proceso where entityState = N'" + status
        + "' or estado = N'" + status + "')");
    }
    addPolicyText('lob', values.lob);
    addPolicyText('productCode', values.product);
    addText('claimType', values.claimType);
    if (auditStatus !== null) conditions.push('id in (select claimId from Audit where status = ' + auditStatus + ')');
    const migrationCode = escapeLikeString(values.migrationCode);
    if (migrationCode) conditions.push("externalId like N'%" + migrationCode + "%'");
    addText('externalId', values.externalId);

    if (occurrence) {
      conditions.push("occurrence >= '" + occurrence.from + "'");
      conditions.push("occurrence <= '" + occurrence.to + "'");
    }
    if (notification) {
      conditions.push("notification >= '" + notification.from + "'");
      conditions.push("notification <= '" + notification.to + "'");
    }

    return conditions.join(' and ');
  };

  const normalizeClaimResponse = (result) => {
    const source = result && result.outData !== undefined ? result.outData : result;
    let data = [];

    if (Array.isArray(source)) data = source;
    else if (source && Array.isArray(source.data)) data = source.data;
    else if (source && Array.isArray(source.items)) data = source.items;
    else if (source && Array.isArray(source.rows)) data = source.rows;
    else if (source && Array.isArray(source.list)) data = source.list;
    else if (source && Array.isArray(source.results)) data = source.results;

    const totalCandidates = [
      source && !Array.isArray(source) ? source.total : undefined,
      source && !Array.isArray(source) ? source.totalCount : undefined,
      source && !Array.isArray(source) ? source.count : undefined,
      source && !Array.isArray(source) ? source.recordsTotal : undefined,
      source && source.pagination ? source.pagination.total : undefined,
      source && source.meta ? source.meta.total : undefined,
      result && result.total,
      result && result.totalCount,
      result && result.count,
      result && result.recordsTotal,
      result && result.outDataCount
    ];
    const totalValue = totalCandidates.find((value) => value !== null
      && value !== undefined && value !== '' && isFinite(Number(value)));

    return {
      data: data,
      total: totalValue === undefined ? data.length : Math.max(0, Number(totalValue))
    };
  };

  const repoClaimRequest = (page, size, activeFilters, activeOrdering) => {
    const requestOrdering = activeOrdering || ordering;
    return exe('RepoClaim', {
      operation: 'GET',
      include: CLAIM_INCLUDES,
      filter: buildRepoClaimFilter(activeFilters),
      orderBy: requestOrdering.orderBy,
      orderDir: requestOrdering.orderDir,
      page: Math.max(0, Number(page || 0)),
      size: Number(size || PAGE_SIZE)
    });
  };

  const responseRows = (result) => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.outData)) return result.outData;
    if (result.outData && Array.isArray(result.outData.data)) return result.outData.data;
    if (Array.isArray(result.data)) return result.data;
    return [];
  };

  const contactLabel = (contact) => {
    const fullName = cleanString(contact && (contact.FullName || contact.fullName || [
      contact.name,
      contact.middlename,
      contact.surname1,
      contact.surname2
    ].filter(Boolean).join(' ')));
    const identifier = cleanString(contact && (contact.cnp || contact.nif || contact.passport || contact.nationalId));
    const id = Number(contact && (contact.id || contact.Id));
    return (fullName || 'Contacto') + (identifier ? ' | ' + identifier : '') + (id > 0 ? ' | #' + id : '');
  };

  const mapContactOptions = (result) => responseRows(result).map((contact) => {
    const id = Number(contact && (contact.id || contact.Id));
    return { value: id, label: contactLabel(contact) };
  }).filter((option) => Number.isSafeInteger(option.value) && option.value > 0);

  const searchContacts = (kind, searchValue) => {
    const search = cleanString(searchValue);
    const timer = searchTimersRef.current[kind];
    if (timer) window.clearTimeout(timer);
    contactRequestRef.current[kind] += 1;
    const requestId = contactRequestRef.current[kind];
    if (search.length < 2 && !/^\d+$/.test(search)) {
      if (kind === 'claimant') setClaimantOptions([]);
      else setInsuredOptions([]);
      setContactSearchLoading((current) => ({ ...current, [kind]: false }));
      return;
    }

    searchTimersRef.current[kind] = window.setTimeout(() => {
      const escaped = escapeFilterString(search);
      const numericId = /^\d+$/.test(search) && Number.isSafeInteger(Number(search)) ? Number(search) : 0;
      const nameFilter = "TRIM(CONCAT_WS(' ', [name], [middlename], [surname1], [surname2])) LIKE N'%" + escaped + "%'";
      const identityFilter = "[cnp] LIKE N'%" + escaped + "%' OR [nif] LIKE N'%" + escaped
        + "%' OR [passport] LIKE N'%" + escaped + "%'";
      const filter = '([inactive] = 0) AND (' + nameFilter + ' OR ' + identityFilter
        + (numericId > 0 ? ' OR [id] = ' + numericId : '') + ')';
      setContactSearchLoading((current) => ({ ...current, [kind]: true }));
      exe('GetContacts', { operation: 'GET', filter: filter, page: 0, size: 15 })
        .then((result) => {
          if (!mountedRef.current || requestId !== contactRequestRef.current[kind]) return;
          if (!result || result.ok === false) throw new Error(result && result.msg ? result.msg : 'No se pudieron buscar los contactos.');
          const options = mapContactOptions(result);
          if (kind === 'claimant') setClaimantOptions(options);
          else setInsuredOptions(options);
        })
        .catch((searchError) => {
          if (!mountedRef.current || requestId !== contactRequestRef.current[kind]) return;
          if (kind === 'claimant') setClaimantOptions([]);
          else setInsuredOptions([]);
          message.error(searchError && searchError.message ? searchError.message : 'No se pudieron buscar los contactos.');
        })
        .then(() => {
          if (mountedRef.current && requestId === contactRequestRef.current[kind]) {
            setContactSearchLoading((current) => ({ ...current, [kind]: false }));
          }
        });
    }, 400);
  };

  const searchPolicies = (searchValue) => {
    const search = cleanString(searchValue);
    if (searchTimersRef.current.policy) window.clearTimeout(searchTimersRef.current.policy);
    policyRequestRef.current += 1;
    const requestId = policyRequestRef.current;
    if (search.length < 2 && !/^\d+$/.test(search)) {
      setPolicyOptions([]);
      setPolicySearchLoading(false);
      return;
    }
    searchTimersRef.current.policy = window.setTimeout(() => {
      const escaped = escapeFilterString(search);
      const numericId = /^\d+$/.test(search) && Number.isSafeInteger(Number(search)) ? Number(search) : 0;
      const filter = "([code] LIKE N'%" + escaped + "%')" + (numericId > 0 ? ' OR [id] = ' + numericId : '');
      setPolicySearchLoading(true);
      exe('RepoLifePolicy', { operation: 'GET', filter: '(' + filter + ')', page: 0, size: 15 })
        .then((result) => {
          if (!mountedRef.current || requestId !== policyRequestRef.current) return;
          if (!result || result.ok === false) throw new Error(result && result.msg ? result.msg : 'No se pudieron buscar las pólizas.');
          setPolicyOptions(responseRows(result).map((policy) => {
            const id = Number(policy && (policy.id || policy.Id));
            return { value: id, label: cleanString(policy && (policy.code || policy.Code)) || ('#' + id) };
          }).filter((option) => Number.isSafeInteger(option.value) && option.value > 0));
        })
        .catch((searchError) => {
          if (!mountedRef.current || requestId !== policyRequestRef.current) return;
          setPolicyOptions([]);
          message.error(searchError && searchError.message ? searchError.message : 'No se pudieron buscar las pólizas.');
        })
        .then(() => {
          if (mountedRef.current && requestId === policyRequestRef.current) setPolicySearchLoading(false);
        });
    }, 400);
  };

  const loadProducts = (lobCode) => {
    const requestId = productRequestRef.current + 1;
    productRequestRef.current = requestId;
    const normalizedLob = cleanString(lobCode);
    setProductCatalog([]);
    form.setFieldsValue({ product: undefined });
    if (!normalizedLob) {
      setProductsLoading(false);
      return Promise.resolve();
    }
    setProductsLoading(true);
    return exe('RepoProduct', {
      operation: 'GET',
      filter: "lobCode = '" + escapeFilterString(normalizedLob) + "'"
    }).then((result) => {
      if (!mountedRef.current || requestId !== productRequestRef.current) return;
      if (!result || result.ok === false) throw new Error(result && result.msg ? result.msg : 'No se pudieron cargar los productos.');
      setProductCatalog(responseRows(result).map((product) => ({
        value: cleanString(product && product.code),
        label: cleanString(product && (product.name || product.code))
      })).filter((option) => option.value));
    }).catch((catalogError) => {
      if (mountedRef.current && requestId === productRequestRef.current) {
        message.error(catalogError && catalogError.message ? catalogError.message : 'No se pudieron cargar los productos.');
      }
    }).then(() => {
      if (mountedRef.current && requestId === productRequestRef.current) setProductsLoading(false);
    });
  };

  const loadFilterCatalogs = () => {
    const requestId = catalogRequestRef.current + 1;
    catalogRequestRef.current = requestId;
    setCatalogsLoading(true);
    return Promise.all([
      exe('RepoLob', { operation: 'GET' }),
      exe('RepoClaimStage', { operation: 'GET' })
    ]).then((results) => {
      if (!mountedRef.current || requestId !== catalogRequestRef.current) return;
      results.forEach((result) => {
        if (!result || result.ok === false) throw new Error(result && result.msg ? result.msg : 'No se pudieron cargar los catálogos.');
      });
      setLobOptions(responseRows(results[0]).map((lob) => ({
        value: cleanString(lob && lob.code),
        label: cleanString(lob && (lob.name || lob.code))
      })).filter((option) => option.value));
      setStageOptions(responseRows(results[1]).map((stage) => ({
        value: cleanString(stage && (stage.code || stage.stageCode)),
        label: cleanString(stage && (stage.name || stage.description || stage.code))
      })).filter((option) => option.value));
    }).catch((catalogError) => {
      if (mountedRef.current && requestId === catalogRequestRef.current) {
        message.error(catalogError && catalogError.message ? catalogError.message : 'No se pudieron cargar los catálogos.');
      }
    }).then(() => {
      if (mountedRef.current && requestId === catalogRequestRef.current) setCatalogsLoading(false);
    });
  };

  const getValue = (record, paths) => {
    for (let index = 0; index < paths.length; index += 1) {
      const path = paths[index].split('.');
      let value = record;
      for (let part = 0; part < path.length && value !== null && value !== undefined; part += 1) {
        value = value[path[part]];
      }
      if (value !== null && value !== undefined && String(value).trim() !== '') return value;
    }
    return null;
  };

  const displayValue = (value) => value === null || value === undefined
    || String(value).trim() === '' ? EMPTY_VALUE : String(value);

  const personName = (record, relationName, fallbacks) => {
    const relation = record && record[relationName];
    if (relation && typeof relation === 'object') {
      const fullName = [relation.name, relation.surname1, relation.surname2]
        .map(cleanString)
        .filter(Boolean)
        .join(' ');
      if (fullName) return fullName;
    }
    return getValue(record, fallbacks || []);
  };

  const claimPaths = {
    notified: ['notification', 'notificationDate', 'notified', 'notifiedAt', 'created'],
    policy: ['Policy.code', 'Policy.policyCode', 'Policy.number', 'Policy.policyNumber', 'policyCode', 'policy'],
    type: ['claimType', 'ClaimType.code', 'type.code', 'typeCode', 'type'],
    cie: ['cie', 'cieCode', 'CIE', 'diagnosisCode', 'principalDiagnosis.code'],
    insuredAmount: ['Policy.insuredSum', 'insuredAmount', 'sumInsured', 'amountInsured', 'Policy.insuredAmount', 'Policy.sumInsured', 'Policy.amountInsured'],
    branch: ['Policy.lob', 'Policy.lobCode', 'Policy.branchCode', 'Policy.Branch.code', 'Policy.branch.code', 'branch.code', 'Branch.code', 'lob', 'branchCode', 'branch'],
    product: ['Policy.productCode', 'Policy.Product.code', 'Policy.product.code', 'product.code', 'Product.code', 'productCode', 'product'],
    status: ['Process.entityState', 'Process.statusName', 'Process.status.name', 'Process.stateName', 'Process.state.name', 'status.name', 'Status.name', 'statusName', 'status'],
    stage: ['Stage.name', 'Stage.description', 'Stage.code', 'stageCode', 'stage.name', 'stageName', 'stage']
  };

  const validRelatedId = (value) => {
    if ((typeof value !== 'string' && typeof value !== 'number') || !/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  };

  const renderText = (value) => {
    const text = displayValue(value);
    return (
      <Tooltip title={text === EMPTY_VALUE ? '' : text}>
        <span className="busqueda-reclamos-cell">
          {text}
        </span>
      </Tooltip>
    );
  };

  const renderNavigationLink = (value, idValue, route) => {
    const text = displayValue(value);
    const id = validRelatedId(idValue);
    if (text === EMPTY_VALUE || id === null) return renderText(text);
    return (
      <Tooltip title={text}>
        <a className="busqueda-reclamos-cell busqueda-reclamos-link" href={route === 'claim-summary' ? '/#/view/48?claimId=' + id : '/#/' + route + '/' + id}>
          {text}
        </a>
      </Tooltip>
    );
  };

  const renderStatus = (value) => {
    const text = displayValue(value);
    if (text === EMPTY_VALUE) return renderText(text);
    return (
      <Tooltip title={text}>
        <span className="busqueda-reclamos-status">{text}</span>
      </Tooltip>
    );
  };

  const formatDateTime = (value) => {
    if (!value) return EMPTY_VALUE;
    const normalized = typeof value === 'string'
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)
      ? value + 'Z'
      : value;
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return displayValue(value);
    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'America/Managua'
    }).formatToParts(date).reduce((result, part) => {
      if (part.type !== 'literal') result[part.type] = part.value;
      return result;
    }, {});
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return months[Number(parts.month) - 1] + ' ' + parts.day + '° ' + parts.year
      + ', ' + parts.hour + ':' + parts.minute + ':' + parts.second
      + ' ' + String(parts.dayPeriod || '').toLowerCase();
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') return EMPTY_VALUE;
    const amount = Number(value);
    if (!isFinite(amount)) return displayValue(value);
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const renderMoney = (value) => {
    const formatted = formatMoney(value);
    if (formatted === EMPTY_VALUE) return formatted;
    const amount = Number(value);
    const tone = !isFinite(amount) || amount === 0
      ? 'zero'
      : (amount > 0 ? 'positive' : 'negative');
    return (
      <Tooltip title={formatted}>
        <span className={'busqueda-reclamos-cell busqueda-reclamos-amount busqueda-reclamos-amount-' + tone}>{formatted}</span>
      </Tooltip>
    );
  };

  const serverSortProps = (orderBy) => ({
    sorter: true,
    serverOrderBy: orderBy,
    sortOrder: ordering.orderBy === orderBy
      ? (ordering.orderDir === 'ASC' ? 'ascend' : 'descend')
      : null
  });

  const exportCell = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number' && isFinite(value)) return value;
    let text = String(value).replace(/[\r\n]+/g, ' ').trim();
    if (/^[=+\-@\t]/.test(text)) text = "'" + text;
    return text;
  };

  const exportColumns = [
    { title: 'ID', width: 10, value: (record) => getValue(record, ['id', 'Id']) },
    { title: 'Código', width: 18, value: (record) => getValue(record, ['code', 'Code']) },
    { title: 'Notificado', width: 24, value: (record) => formatDateTime(getValue(record, claimPaths.notified)) },
    { title: 'Reclamante', width: 28, value: (record) => personName(record, 'Claimer', ['claimantName', 'claimant']) },
    { title: 'Asegurado', width: 28, value: (record) => personName(record, 'Contact', ['insuredName', 'insured']) },
    { title: 'Póliza', width: 18, value: (record) => getValue(record, claimPaths.policy) },
    { title: 'Tipo', width: 16, value: (record) => getValue(record, claimPaths.type) },
    { title: 'CIE', width: 14, value: (record) => getValue(record, claimPaths.cie) },
    { title: 'Suma asegurada', width: 18, value: (record) => {
      const value = getValue(record, claimPaths.insuredAmount);
      return value !== null && value !== '' && isFinite(Number(value)) ? Number(value) : value;
    } },
    { title: 'Ramo', width: 16, value: (record) => getValue(record, claimPaths.branch) },
    { title: 'Producto', width: 20, value: (record) => getValue(record, claimPaths.product) },
    { title: 'Estado', width: 20, value: (record) => getValue(record, claimPaths.status) },
    { title: 'Stage', width: 20, value: (record) => getValue(record, claimPaths.stage) }
  ];

  const isUsableXlsxExportLibrary = (xlsxLibrary) => Boolean(xlsxLibrary
    && typeof xlsxLibrary.writeFile === 'function'
    && xlsxLibrary.utils
    && typeof xlsxLibrary.utils.aoa_to_sheet === 'function'
    && typeof xlsxLibrary.utils.book_new === 'function'
    && typeof xlsxLibrary.utils.book_append_sheet === 'function');

  const availableXlsxLibrary = () => {
    const runtimeLibraries = typeof libs !== 'undefined' && libs ? libs : {};
    const globalLibrary = typeof XLSX !== 'undefined'
      ? XLSX
      : (typeof window !== 'undefined' ? window.XLSX : null);
    return [runtimeLibraries.XLSX, runtimeLibraries.xlsx, runtimeLibraries.xlsxJs, globalLibrary]
      .find(isUsableXlsxExportLibrary) || null;
  };

  const ensureXlsxLibrary = () => {
    const availableLibrary = availableXlsxLibrary();
    if (availableLibrary) return Promise.resolve(availableLibrary);
    if (xlsxLibraryPromiseRef.current) return xlsxLibraryPromiseRef.current;

    xlsxLibraryPromiseRef.current = exe('ExeChain', {
      chain: 'cmdLoadLibrariesGroupedBordereau',
      context: '{}'
    }).then((response) => {
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : 'No se pudo cargar el componente de Excel de SIS11.');
      }
      const loadedLibraries = response.outData || {};
      const loadedXlsx = loadedLibraries.XLSX || loadedLibraries.xlsx || loadedLibraries.xlsxJs;
      let evaluatedXlsx = null;
      if (typeof loadedXlsx === 'string') {
        const evaluatedResult = eval(loadedXlsx);
        const evaluatedGlobal = typeof XLSX !== 'undefined' ? XLSX : null;
        evaluatedXlsx = isUsableXlsxExportLibrary(evaluatedGlobal) ? evaluatedGlobal : evaluatedResult;
      } else if (loadedXlsx && typeof window !== 'undefined') {
        window.XLSX = loadedXlsx;
      }
      const hydratedLibrary = availableXlsxLibrary()
        || (loadedXlsx && typeof loadedXlsx !== 'string' ? loadedXlsx : null)
        || evaluatedXlsx;
      if (!isUsableXlsxExportLibrary(hydratedLibrary)) {
        throw new Error('El componente de Excel de SIS11 no quedó disponible.');
      }
      if (typeof window !== 'undefined' && !window.XLSX) window.XLSX = hydratedLibrary;
      return hydratedLibrary;
    }).then((xlsxLibrary) => {
      xlsxLibraryPromiseRef.current = null;
      return xlsxLibrary;
    }).catch((xlsxError) => {
      xlsxLibraryPromiseRef.current = null;
      throw xlsxError;
    });
    return xlsxLibraryPromiseRef.current;
  };

  const assertCompleteExportRows = (exportRows, total) => {
    if (exportRows.length !== total) {
      throw new Error('La consulta de exportación quedó incompleta. No se generó ningún archivo.');
    }
    const seenIds = {};
    exportRows.forEach((record) => {
      const id = validRelatedId(getValue(record, ['id', 'Id']));
      if (id === null) return;
      if (seenIds[id]) throw new Error('La consulta de exportación devolvió registros duplicados. No se generó ningún archivo.');
      seenIds[id] = true;
    });
  };

  const downloadFilteredClaims = () => {
    if (loading || exporting) return;
    const appliedFilters = filters;
    const appliedOrdering = ordering;
    setExporting(true);

    repoClaimRequest(0, EXPORT_PAGE_SIZE, appliedFilters, appliedOrdering)
      .then((firstResult) => {
        if (!firstResult || firstResult.ok === false) {
          throw new Error(firstResult && firstResult.msg ? firstResult.msg : 'No se pudieron consultar los reclamos para exportar.');
        }
        const firstPage = normalizeClaimResponse(firstResult);
        if (firstPage.total === 0 || firstPage.data.length === 0) {
          message.warning('No hay información disponible para exportar.');
          return null;
        }
        const pageCount = Math.ceil(firstPage.total / EXPORT_PAGE_SIZE);
        const remainingRequests = [];
        for (let page = 1; page < pageCount; page += 1) {
          remainingRequests.push(repoClaimRequest(page, EXPORT_PAGE_SIZE, appliedFilters, appliedOrdering));
        }
        return Promise.all(remainingRequests).then((remainingResults) => {
          const allRows = firstPage.data.slice();
          remainingResults.forEach((result) => {
            if (!result || result.ok === false) {
              throw new Error(result && result.msg ? result.msg : 'No se pudieron consultar todos los reclamos para exportar.');
            }
            allRows.push.apply(allRows, normalizeClaimResponse(result).data);
          });
          assertCompleteExportRows(allRows, firstPage.total);
          return ensureXlsxLibrary().then((xlsxLibrary) => ({ rows: allRows, xlsxLibrary: xlsxLibrary }));
        });
      })
      .then((exportData) => {
        if (!exportData) return;
        const headers = exportColumns.map((column) => column.title);
        const exportRows = exportData.rows.map((record) => exportColumns.map((column) => exportCell(column.value(record))));
        const worksheet = exportData.xlsxLibrary.utils.aoa_to_sheet([headers].concat(exportRows));
        exportRows.forEach((row, index) => {
          const amountCell = worksheet['I' + (index + 2)];
          if (amountCell && typeof row[8] === 'number') amountCell.z = '#,##0.00';
        });
        worksheet['!cols'] = exportColumns.map((column) => ({ wch: column.width }));
        worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1:M1' };
        const workbook = exportData.xlsxLibrary.utils.book_new();
        exportData.xlsxLibrary.utils.book_append_sheet(workbook, worksheet, 'Reclamos');
        exportData.xlsxLibrary.writeFile(workbook, 'reclamos-' + formatFilterDate(new Date()) + '.xlsx', {
          bookType: 'xlsx',
          compression: true
        });
        message.success('Los reclamos fueron exportados correctamente.');
      })
      .catch((exportError) => {
        message.error(exportError && exportError.message ? exportError.message : 'No se pudieron exportar los reclamos.');
      })
      .then(() => {
        if (mountedRef.current) setExporting(false);
      });
  };

  const columns = [
    {
      title: 'ID',
      key: 'id',
      width: '4%',
      ...serverSortProps('id'),
      render: (_, record) => renderText(getValue(record, ['id', 'Id']))
    },
    {
      title: 'Código',
      key: 'code',
      width: '8%',
      ...serverSortProps('code'),
      render: (_, record) => renderNavigationLink(
        getValue(record, ['code', 'Code']),
        getValue(record, ['id', 'Id']),
        'claim-summary'
      )
    },
    {
      title: 'Notificado',
      key: 'notified',
      width: '10%',
      ...serverSortProps('notification'),
      render: (_, record) => renderText(formatDateTime(getValue(record, claimPaths.notified)))
    },
    {
      title: 'Reclamante',
      key: 'claimant',
      width: '10%',
      ...serverSortProps('Claimer.name'),
      render: (_, record) => renderNavigationLink(
        personName(record, 'Claimer', ['claimantName', 'claimant']),
        getValue(record, ['Claimer.id', 'claimerId']),
        'contact'
      )
    },
    {
      title: 'Asegurado',
      key: 'insured',
      width: '10%',
      ...serverSortProps('Contact.name'),
      render: (_, record) => renderNavigationLink(
        personName(record, 'Contact', ['insuredName', 'insured']),
        getValue(record, ['Contact.id', 'contactId']),
        'contact'
      )
    },
    {
      title: 'Póliza',
      key: 'policy',
      width: '8%',
      ...serverSortProps('Policy.code'),
      render: (_, record) => renderNavigationLink(
        getValue(record, claimPaths.policy),
        getValue(record, ['Policy.id', 'lifePolicyId']),
        'lifePolicy'
      )
    },
    {
      title: 'Tipo',
      key: 'type',
      width: '4%',
      ...serverSortProps('claimType'),
      render: (_, record) => renderText(getValue(record, claimPaths.type))
    },
    {
      title: 'CIE',
      key: 'cie',
      width: '4%',
      ...serverSortProps('principalDiagnosis'),
      render: (_, record) => renderText(getValue(record, claimPaths.cie))
    },
    {
      title: 'Suma asegurada',
      key: 'insuredAmount',
      width: '9%',
      align: 'right',
      ...serverSortProps('Policy.insuredSum'),
      render: (_, record) => renderMoney(getValue(record, claimPaths.insuredAmount))
    },
    {
      title: 'Ramo',
      key: 'branch',
      width: '5%',
      ...serverSortProps('Policy.lob'),
      render: (_, record) => renderText(getValue(record, claimPaths.branch))
    },
    {
      title: 'Producto',
      key: 'product',
      width: '7%',
      ...serverSortProps('Policy.productCode'),
      render: (_, record) => renderText(getValue(record, claimPaths.product))
    },
    {
      title: 'Estado',
      key: 'status',
      width: '8%',
      ...serverSortProps('Process.entityState'),
      render: (_, record) => renderStatus(getValue(record, claimPaths.status))
    },
    {
      title: 'Stage',
      key: 'stage',
      width: '7%',
      ...serverSortProps('Stage.name'),
      render: (_, record) => renderStatus(getValue(record, claimPaths.stage))
    },
    {
      title: 'Resumen',
      key: 'summary',
      width: '6%',
      render: (_, record) => renderNavigationLink(
        'Ver',
        getValue(record, ['id', 'Id']),
        'claim-summary'
      )
    }
  ];

  const loadClaims = (current, pageSize, activeFilters, activeOrdering) => {
    const requestId = listRequestRef.current + 1;
    listRequestRef.current = requestId;
    setLoading(true);
    setError('');

    try {
      buildRepoClaimFilter(activeFilters);
    } catch (validationError) {
      if (requestId === listRequestRef.current) {
        const validationMessage = validationError && validationError.message
          ? validationError.message : 'Revise los criterios de búsqueda.';
        setError(validationMessage);
        setLoading(false);
        message.warning(validationMessage);
      }
      return Promise.resolve();
    }

    const requestOrdering = activeOrdering || ordering;

    return repoClaimRequest(
      Math.max(0, Number(current || 1) - 1),
      Number(pageSize || PAGE_SIZE),
      activeFilters,
      requestOrdering
    )
      .then((result) => {
        if (!mountedRef.current || requestId !== listRequestRef.current) return;
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : 'No se pudieron consultar los reclamos.');
        }

        const normalized = normalizeClaimResponse(result);
        setRows(normalized.data);
        setPagination({
          current: Number(current || 1),
          pageSize: Number(pageSize || PAGE_SIZE),
          total: normalized.total
        });
      })
      .catch((requestError) => {
        if (!mountedRef.current || requestId !== listRequestRef.current) return;
        const requestMessage = requestError && requestError.message
          ? requestError.message : 'No se pudieron consultar los reclamos.';
        setRows([]);
        setPagination({ current: Number(current || 1), pageSize: Number(pageSize || PAGE_SIZE), total: 0 });
        setError(requestMessage);
        message.error(requestMessage);
      })
      .then(() => {
        if (mountedRef.current && requestId === listRequestRef.current) setLoading(false);
      });
  };

  const handleSearch = () => {
    if (exporting) return;
    const values = form.getFieldsValue();
    try {
      buildRepoClaimFilter(values);
    } catch (validationError) {
      const validationMessage = validationError && validationError.message
        ? validationError.message : 'Revise los criterios de búsqueda.';
      setError(validationMessage);
      message.warning(validationMessage);
      return;
    }
    setFilters(values);
    setFilterDrawerOpen(false);
    loadClaims(1, pagination.pageSize || PAGE_SIZE, values);
  };

  const handleReset = () => {
    if (exporting) return;
    form.resetFields();
    setFilters({});
    setError('');
    loadClaims(1, PAGE_SIZE, {});
  };

  const handleTableChange = (nextPagination, tableFilters, sorter, extra) => {
    if (exporting) return;
    if (extra && extra.action === 'sort') {
      const nextOrdering = sorter && sorter.order
        ? {
          orderBy: sorter.column && sorter.column.serverOrderBy
            ? sorter.column.serverOrderBy
            : 'id',
          orderDir: sorter.order === 'descend' ? 'DESC' : 'ASC'
        }
        : { orderBy: 'id', orderDir: 'DESC' };
      setOrdering(nextOrdering);
      loadClaims(1, nextPagination.pageSize || PAGE_SIZE, filters, nextOrdering);
      return;
    }
    loadClaims(nextPagination.current || 1, nextPagination.pageSize || PAGE_SIZE, filters);
  };

  React.useEffect(() => {
    mountedRef.current = true;
    const style = document.createElement('style');
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    let resizeFrame = null;

    const fitShellToViewport = () => {
      const shell = shellRef.current;
      if (!shell) return;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const shellTop = Math.max(0, shell.getBoundingClientRect().top);
      const availableHeight = Math.max(0, Math.floor(viewportHeight - shellTop - 8));
      shell.style.height = availableHeight + 'px';
      shell.style.maxHeight = availableHeight + 'px';
    };

    const scheduleViewportFit = () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(fitShellToViewport);
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    style.setAttribute('data-busqueda-reclamos-style', 'true');
    style.innerHTML = `
      .busqueda-reclamos-shell {
        width: 100%;
        height: 100%;
        max-height: 100%;
        min-height: 0;
        padding: 10px 16px 8px;
        overflow: hidden;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        color: #262626;
        font-size: 13px;
      }

      .busqueda-reclamos-page-header,
      .busqueda-reclamos-error {
        flex: 0 0 auto;
      }

      .busqueda-reclamos-page-header {
        min-height: 108px;
        padding: 14px 24px 17px;
        border: 1px solid #e3e6ea;
        border-radius: 3px;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, .03);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .busqueda-reclamos-breadcrumb {
        display: flex;
        align-items: center;
        gap: 9px;
        color: #999;
        font-size: 14px;
        line-height: 20px;
      }

      .busqueda-reclamos-breadcrumb-separator {
        color: #b7b7b7;
      }

      .busqueda-reclamos-breadcrumb strong {
        color: #555;
        font-weight: 500;
      }

      .busqueda-reclamos-heading-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 0;
      }

      .busqueda-reclamos-heading {
        display: flex;
        align-items: center;
        min-width: 0;
        gap: 12px;
      }

      .busqueda-reclamos-folder {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #d9d9d9;
        position: relative;
        flex: 0 0 38px;
      }

      .busqueda-reclamos-folder::before {
        content: '';
        position: absolute;
        left: 9px;
        top: 12px;
        width: 20px;
        height: 14px;
        border: 2px solid #fff;
        border-radius: 2px;
        box-sizing: border-box;
      }

      .busqueda-reclamos-folder::after {
        content: '';
        position: absolute;
        left: 11px;
        top: 9px;
        width: 9px;
        height: 6px;
        border: 2px solid #fff;
        border-bottom: 0;
        border-radius: 2px 2px 0 0;
        box-sizing: border-box;
      }

      .busqueda-reclamos-title {
        margin: 0;
        color: #4a4a4a;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3;
      }

      .busqueda-reclamos-toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 4px 0;
        border: 1px solid #e6ebf2;
        border-radius: 0;
        background: transparent;
      }

      .busqueda-reclamos-toolbar > .ant-space {
        margin-left: 4px;
        margin-right: 4px;
      }

      .busqueda-reclamos-toolbar .ant-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .busqueda-reclamos-download.ant-btn {
        border-color: #4f9336 !important;
        background: #60b13d !important;
        color: #fff !important;
        text-shadow: none;
      }

      .busqueda-reclamos-toolbar .ant-btn[disabled],
      .busqueda-reclamos-toolbar .ant-btn-disabled {
        border-color: #6f7b88 !important;
        opacity: 1 !important;
      }

      .busqueda-reclamos-download-icon {
        display: inline-block;
        width: 12px;
        height: 14px;
        margin-right: 7px;
        position: relative;
        vertical-align: -2px;
      }

      .busqueda-reclamos-download-icon::before {
        content: '';
        position: absolute;
        left: 5px;
        top: 1px;
        width: 2px;
        height: 7px;
        background: currentColor;
      }

      .busqueda-reclamos-download-icon::after {
        content: '';
        position: absolute;
        left: 2px;
        bottom: 1px;
        width: 8px;
        height: 5px;
        border: solid currentColor;
        border-width: 0 1px 1px;
        box-sizing: border-box;
      }

      .busqueda-reclamos-download-chevron {
        display: inline-block;
        width: 6px;
        height: 6px;
        margin-left: 7px;
        border: solid currentColor;
        border-width: 0 1px 1px 0;
        transform: translateY(-2px) rotate(45deg);
      }

      .busqueda-reclamos-shell .anticon > svg {
        display: inline-block;
        width: 1em;
        height: 1em;
        fill: currentColor;
      }

      .busqueda-reclamos-error {
        margin-top: 8px;
      }

      .busqueda-reclamos-grid {
        flex: 1 1 auto;
        min-height: 0;
        margin: 2px 0 8px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #fff;
        border: 1px solid #cbd1d8;
        box-sizing: border-box;
      }

      .busqueda-reclamos-grid .ant-table-wrapper,
      .busqueda-reclamos-grid .ant-spin-nested-loading,
      .busqueda-reclamos-grid .ant-spin-container,
      .busqueda-reclamos-grid .ant-table,
      .busqueda-reclamos-grid .ant-table-container {
        flex: 1 1 auto;
        height: 100%;
        min-height: 0;
      }

      .busqueda-reclamos-grid .ant-table-wrapper,
      .busqueda-reclamos-grid .ant-spin-container,
      .busqueda-reclamos-grid .ant-table,
      .busqueda-reclamos-grid .ant-table-container {
        display: flex;
        flex-direction: column;
      }

      .busqueda-reclamos-grid .ant-table-body {
        flex: 1 1 auto;
        min-height: 0;
        max-height: none !important;
        position: relative;
        z-index: 1;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        scrollbar-gutter: stable;
      }

      .busqueda-reclamos-grid .ant-table-header {
        flex: 0 0 auto;
        position: relative;
        z-index: 3;
        overflow: hidden !important;
        background: #bfbfbf !important;
      }

      .busqueda-reclamos-grid .ant-table-thead > tr > th {
        height: auto;
        padding: 5px 8px !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        background: #bfbfbf !important;
        color: #404040;
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .busqueda-reclamos-grid .ant-table-thead > tr > th:last-child {
        border-right: 0 !important;
      }

      .busqueda-reclamos-grid .ant-table-tbody > tr > td {
        padding: 5px 8px !important;
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        color: #333;
        font-size: 12px;
        line-height: 18px;
        vertical-align: middle;
      }

      .busqueda-reclamos-grid .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .busqueda-reclamos-grid .ant-table-tbody > tr.ant-table-row-selected > td,
      .busqueda-reclamos-grid .ant-table-tbody > tr.ant-table-row-selected:hover > td {
        background: #86b4ff !important;
      }

      .busqueda-reclamos-grid .ant-table-cell-fix-right {
        background: #fff;
      }

      .busqueda-reclamos-grid .ant-table-pagination {
        flex: 0 0 auto;
        margin: 8px 0 0 !important;
      }

      .busqueda-reclamos-cell {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .busqueda-reclamos-link {
        color: #1890ff;
      }

      .busqueda-reclamos-status {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 1px 7px;
        border: 1px solid #d9d9d9;
        border-radius: 3px;
        background: #fff;
        color: #555;
        font-size: 12px;
        line-height: 20px;
        white-space: nowrap;
      }

      .busqueda-reclamos-amount {
        white-space: nowrap;
      }

      .busqueda-reclamos-amount-positive {
        color: #237804;
      }

      .busqueda-reclamos-amount-negative {
        color: #cf1322;
      }

      .busqueda-reclamos-amount-zero {
        color: #262626;
        font-weight: 400;
      }

      .busqueda-reclamos-filter-form .ant-form-item {
        margin-bottom: 10px !important;
      }

      .busqueda-reclamos-filter-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 4px;
      }

      .busqueda-reclamos-reset.ant-btn {
        border-color: #8f9aa7 !important;
      }

      @media (max-width: 768px) {
        .busqueda-reclamos-shell { padding: 0; }
        .busqueda-reclamos-page-header { border-radius: 0; padding: 10px 12px; }
      }
    `;

    document.head.appendChild(style);
    window.addEventListener('resize', scheduleViewportFit);
    scheduleViewportFit();
    loadFilterCatalogs();
    loadClaims(1, PAGE_SIZE, {}, { orderBy: 'id', orderDir: 'DESC' });

    return () => {
      mountedRef.current = false;
      listRequestRef.current += 1;
      catalogRequestRef.current += 1;
      contactRequestRef.current.claimant += 1;
      contactRequestRef.current.insured += 1;
      policyRequestRef.current += 1;
      productRequestRef.current += 1;
      Object.keys(searchTimersRef.current).forEach((key) => {
        if (searchTimersRef.current[key]) window.clearTimeout(searchTimersRef.current[key]);
      });
      window.removeEventListener('resize', scheduleViewportFit);
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      if (style.parentNode) style.parentNode.removeChild(style);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div ref={shellRef} className="busqueda-reclamos-shell">
      <div className="busqueda-reclamos-page-header">
        <div className="busqueda-reclamos-breadcrumb">
          <span>Inicio</span>
          <span className="busqueda-reclamos-breadcrumb-separator">/</span>
          <strong>Lista de siniestros</strong>
        </div>
        <div className="busqueda-reclamos-heading-row">
          <div className="busqueda-reclamos-heading">
            <span className="busqueda-reclamos-folder" aria-hidden="true" />
            <h2 className="busqueda-reclamos-title">Lista de siniestros</h2>
          </div>
          <div className="busqueda-reclamos-toolbar">
          <Space>
              <Button
                className="busqueda-reclamos-download"
                loading={exporting}
                disabled={loading || exporting}
                onClick={downloadFilteredClaims}
              >
                <span className="busqueda-reclamos-download-icon" aria-hidden="true" />
                <span>Exportar a Excel</span>
              </Button>
              <Button
                type="primary"
                icon={<SearchOutlinedIcon />}
                disabled={loading || exporting}
                onClick={() => setFilterDrawerOpen(true)}
              >
                <span>Filtrar</span>
              </Button>
          </Space>
          </div>
        </div>
      </div>

      {error ? <Alert className="busqueda-reclamos-error" type="error" showIcon message={error} /> : null}

      <div className="busqueda-reclamos-grid">
          <Table
            size="small"
            rowKey={(record, index) => String(getValue(record, ['id', 'Id', 'code', 'Code']) || ('claim-' + index))}
            loading={loading}
            columns={columns}
            dataSource={rows}
            tableLayout="fixed"
            scroll={{ y: '100%' }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              disabled: exporting,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '25', '50'],
              showTotal: (total) => 'Total ' + total + ' items'
            }}
            onChange={handleTableChange}
            locale={{ emptyText: loading ? 'Consultando...' : (error ? 'No fue posible cargar los reclamos' : 'No se encontraron reclamos') }}
          />
      </div>

      <Drawer
          title="Filtros de búsqueda de siniestros"
          placement="right"
          width={510}
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          destroyOnClose={false}
        >
          <Form form={form} className="busqueda-reclamos-filter-form" layout="vertical" size="small">
            <Row gutter={8}>
              <Col span={24}>
                <Form.Item label="Quick Filter" name="quickFilter">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="ID o código del reclamo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ID" name="id">
                  <Input inputMode="numeric" maxLength={16} placeholder="ID del reclamo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ID de reclamo maestro" name="masterClaimId">
                  <Input inputMode="numeric" maxLength={16} placeholder="ID maestro" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Código" name="code">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="Código del reclamo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Stage" name="stageCode">
                  <Select
                    allowClear
                    showSearch
                    loading={catalogsLoading}
                    options={stageOptions}
                    optionFilterProp="label"
                    placeholder="Seleccione el stage"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Fecha" name="date">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Reclamante" name="claimantId">
                  <Select
                    allowClear
                    showSearch
                    filterOption={false}
                    loading={contactSearchLoading.claimant}
                    options={claimantOptions}
                    onSearch={(value) => searchContacts('claimant', value)}
                    placeholder="Escriba nombre, identificación o ID"
                    notFoundContent={contactSearchLoading.claimant ? 'Buscando...' : 'Escriba al menos 2 caracteres'}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Asegurado" name="insuredId">
                  <Select
                    allowClear
                    showSearch
                    filterOption={false}
                    loading={contactSearchLoading.insured}
                    options={insuredOptions}
                    onSearch={(value) => searchContacts('insured', value)}
                    placeholder="Escriba nombre, identificación o ID"
                    notFoundContent={contactSearchLoading.insured ? 'Buscando...' : 'Escriba al menos 2 caracteres'}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Póliza" name="lifePolicyId">
                  <Select
                    allowClear
                    showSearch
                    filterOption={false}
                    loading={policySearchLoading}
                    options={policyOptions}
                    onSearch={searchPolicies}
                    placeholder="Escriba código o ID de póliza"
                    notFoundContent={policySearchLoading ? 'Buscando...' : 'Escriba al menos 2 caracteres'}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Estado" name="status">
                  <Input allowClear placeholder="Escriba el estado" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Ramo" name="lob">
                  <Select
                    allowClear
                    showSearch
                    loading={catalogsLoading}
                    options={lobOptions}
                    optionFilterProp="label"
                    onChange={loadProducts}
                    placeholder="Seleccione el ramo"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Producto" name="product">
                  <Select
                    allowClear
                    showSearch
                    disabled={!form.getFieldValue('lob')}
                    loading={productsLoading}
                    options={productCatalog}
                    optionFilterProp="label"
                    placeholder="Seleccione el producto"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tipo de siniestro" name="claimType">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="Código del tipo de siniestro" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Estado de la auditoría" name="auditStatus">
                  <Select
                    allowClear
                    options={AUDIT_STATUS_OPTIONS}
                    placeholder="Seleccione el estado de auditoría"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Ocurrencia" name="occurrence">
                  <RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Notificación" name="notification">
                  <RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Código de migración" name="migrationCode">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="Código de migración" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="External ID" name="externalId">
                  <Input maxLength={MAX_FILTER_LENGTH} placeholder="External ID" />
                </Form.Item>
              </Col>
            </Row>

            <div className="busqueda-reclamos-filter-actions">
              <Space>
                <Button
                  className="busqueda-reclamos-reset"
                  icon={<ReloadOutlinedIcon />}
                  disabled={loading || exporting}
                  onClick={handleReset}
                >
                  Reestablecer
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlinedIcon />}
                  loading={loading}
                  disabled={exporting}
                  onClick={handleSearch}
                >
                  Búsqueda
                </Button>
              </Space>
            </div>
          </Form>
      </Drawer>
    </div>
  );
}
