/**
 * @author aiden_mission_configurator
 * @created 2026-09-22
 * @updated 2026-10-07
 * @name SearchCustomPolicy
 * @summary Busqueda de polizas personalizada. Funciona igual que la busqueda nativa de
 *          polizas (#/policies): mismos filtros (pestanas General, Fechas y Otros), misma
 *          consulta, mismas columnas y mismos comandos de la barra (Guardar seleccion,
 *          Acciones masivas, Filtro). Punto de partida para cambios posteriores.
 * @issue   MSN-000019 / AXX-1480 (version inicial: solo emitidas)
 *          MSN-000083 / AXX-3384 (paridad con la nativa; se quita el filtro fijo de emitidas)
 *
 * Comandos (todos nativos, los mismos que usa la pantalla nativa; sin cadenas ni triggers propios):
 *  - cmdCustomSearchPolicy {filter, size, page}  -> la busqueda liviana de la grilla
 *  - RepoLob, RepoProduct, RepoCurrency, RepoOrganization, RepoSelection GET -> catalogos
 *  - cmdCustomSearchPolicy / GetContacts / GetHoldings -> buscadores de grupo, contacto
 *  - RepoSelection ADD / DELETE -> guardar y borrar selecciones
 *
 * Notas de plataforma (no borrar):
 *  - El motor es react-live 2.4.1 -> buble 0.19.6: nada de arrow async, ni ?., ni ??,
 *    ni fragmentos <>, ni entidades HTML dentro del JSX, ni spread de objetos.
 *  - antd 4 no exporta Icon: los iconos se dibujan como SVG en linea.
 *  - cmdCustomSearchPolicy pagina con "page" BASE 0 y devuelve {data,total}.
 *  - Los rotulos usan las MISMAS claves de traduccion que la nativa: t('Policyholder') etc.
 */
() => {
  const A_ = A;
  const Table = A_.Table;
  const Button = A_.Button;
  const Drawer = A_.Drawer;
  const Input = A_.Input;
  const InputNumber = A_.InputNumber;
  const Select = A_.Select;
  const DatePicker = A_.DatePicker;
  const Space = A_.Space;
  const Tag = A_.Tag;
  const Tooltip = A_.Tooltip;
  const Checkbox = A_.Checkbox;
  const Tabs = A_.Tabs;
  const Popover = A_.Popover;
  const Popconfirm = A_.Popconfirm;
  const Modal = A_.Modal;
  const Switch = A_.Switch;
  const Radio = A_.Radio;
  const message = A_.message;
  const Option = Select.Option;
  const TabPane = Tabs.TabPane;
  const MT = momentTimezone;

  // antd 4 no exporta Icon: el ambiente dibuja los iconos como SVG en linea.
  const svg = (vb, ds) => (
    <span role="img" className="anticon">
      <svg viewBox={vb} focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        {ds.map((d, i) => <path key={i} d={d} />)}
      </svg>
    </span>
  );
  const IcoLock = () => svg("64 64 896 896", ['M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 10-56 0z']);
  const IcoUnlock = () => svg("64 64 896 896", ['M832 464H332V240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v68c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-68c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zm-40 376H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 10-56 0z']);
  const IcoFilter = () => svg("64 64 896 896", ['M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z']);
  const IcoThunder = () => svg("64 64 896 896", ['M848 359.3H627.7L825.8 109c4.1-5.3.4-13-6.3-13H436c-2.8 0-5.5 1.5-6.9 4L170 547.5c-3.1 5.3.7 12 6.9 12h174.4l-89.4 357.6c-1.9 7.8 7.5 13.3 13.3 7.7L853.5 373c5.2-4.9 1.7-13.7-5.5-13.7zM378.2 732.5l60.3-241H281.1l189.6-327.4h224.6L487 427.4h211L378.2 732.5z']);
  const IcoSave = () => svg("64 64 896 896", ['M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z']);
  const IcoUndo = () => svg("64 64 896 896", ['M511.4 124C290.5 124.3 112 303 112 523.9c0 128 60.2 242 153.8 315.2l-37.5 48c-4.1 5.3-.3 13 6.3 12.9l167-.8c5.2 0 9-4.9 7.7-9.9L369.8 727a8 8 0 00-14.1-3L315 776.1c-10.2-8-20-16.7-29.3-26a318.64 318.64 0 01-68.6-101.7C200.4 609 192 567.1 192 523.9s8.4-85.1 25.1-124.5c16.1-38.1 39.2-72.3 68.6-101.7 29.4-29.4 63.6-52.5 101.7-68.6C426.9 212.4 468.8 204 512 204s85.1 8.4 124.5 25.1c38.1 16.1 72.3 39.2 101.7 68.6 29.4 29.4 52.5 63.6 68.6 101.7 16.7 39.4 25.1 81.3 25.1 124.5s-8.4 85.1-25.1 124.5a318.64 318.64 0 01-68.6 101.7c-7.5 7.5-15.3 14.5-23.4 21.2a7.93 7.93 0 00-1.2 11.1l39.4 50.5c2.8 3.5 7.9 4.1 11.4 1.3C854.5 760.8 912 649.1 912 523.9c0-221.1-179.4-400.2-400.6-399.9z']);
  const IcoSearch = () => svg("64 64 896 896", ['M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z']);
  const IcoDelete = () => svg("64 64 896 896", ['M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z']);
  const IcoPlus = () => svg("64 64 896 896", ['M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z','M192 474h672q8 0 8 8v60q0 8-8 8H160q-8 0-8-8v-60q0-8 8-8z']);
  const IcoCopy = () => svg("64 64 896 896", ['M672 128H224c-35.3 0-64 28.7-64 64v512h64V192h448v-64z','M736 224H352c-35.3 0-64 28.7-64 64v512c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V288c0-35.3-28.7-64-64-64zm0 576H352V288h384v512z']);

  // ------------------------------------------------- contexto de la SPA (mismas fuentes que la nativa)
  const W = window;
  const currentUser = () => (W.GLOBAL && W.GLOBAL.currentUser) || null;
  const userOptions = () => (currentUser() && currentUser().userOptions) || {};
  const orgTimezones = () => userOptions().orgTimezones;
  const multiTz = !!userOptions().multiTz;
  const profile = () => (W.global && W.global.configProfile) || {};
  const mainCfg = () => profile().Main || {};
  const getTimeZone = () => {
    if (currentUser()) return currentUser().timezone;
    try { return W.sessionStorage.getItem('pendingTz') || undefined; } catch (e) { return undefined; }
  };
  const listOf = (f) => {
    if (typeof f === 'string') f = f.split(/[,\s]+/).filter(Boolean);
    return f instanceof Array ? f : [];
  };
  const bdFields = () => listOf(mainCfg().businessDateFields);
  const brFields = () => {
    if (!mainCfg().branchTimeZone) return [];
    const bd = bdFields();
    return listOf(mainCfg().branchDateFields).filter((p) => bd.indexOf(p) === -1);
  };
  const bdOn = () => bdFields().length > 0;
  const brOn = () => brFields().length > 0;
  const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
  const bdIsNaive = (d) => typeof d === 'string' && ISO.test(d) && !/[zZ]$/.test(d) && !/[+-]\d{2}:?\d{2}$/.test(d);

  // Mismo calculo de rango de fechas que la nativa (incluye fechas relativas a la sucursal).
  const branchDateBetween = (col, m, unit, branchRelative) => {
    const map = orgTimezones();
    const fmt = unit === 'month' ? 'YYYY-MM' : unit === 'year' ? 'YYYY' : 'YYYY-MM-DD';
    const start = MT(m.format(fmt), fmt).startOf(unit);
    const lo = start.format('YYYY-MM-DD HH:mm:ss');
    const next = start.clone().add(1, unit).format('YYYY-MM-DD HH:mm:ss');
    const toUtc = (naive, tz) => (tz ? MT.tz(naive, 'YYYY-MM-DD HH:mm:ss', tz) : MT(naive, 'YYYY-MM-DD HH:mm:ss')).utc().format('YYYY-MM-DD HH:mm:ss');
    const bare = col.replace(/[[\]]/g, '');
    if ((bdOn() && bdFields().indexOf(bare) !== -1) || (brOn() && brFields().indexOf(bare) !== -1)) return '(' + col + " >= '" + lo + "' AND " + col + " < '" + next + "')";
    if (!branchRelative || !map || !Object.keys(map).length) {
      const tz = getTimeZone();
      return '(' + col + " >= '" + toUtc(lo, tz) + "' AND " + col + " < '" + toUtc(next, tz) + "')";
    }
    const byTz = {};
    Object.keys(map).forEach((id) => { (byTz[map[id]] = byTz[map[id]] || []).push(id); });
    const allIds = Object.keys(map).join(',');
    const clauses = Object.keys(byTz).map((tz) =>
      '(organizationId IN (' + byTz[tz].join(',') + ') AND ' + col + " >= '" + toUtc(lo, tz) + "' AND " + col + " < '" + toUtc(next, tz) + "')");
    clauses.push('((organizationId IS NULL OR organizationId NOT IN (' + allIds + ')) AND ' + col + " >= '" + lo + "' AND " + col + " < '" + next + "')");
    return '(' + clauses.join(' OR ') + ')';
  };

  // Fechas relativas a la sucursal en la grilla (mismo criterio que la nativa).
  const branchShow = (o, tz) => {
    if (o instanceof Array) { o.forEach((x) => branchShow(x, tz)); return; }
    if (!o || typeof o !== 'object') return;
    const map = orgTimezones() || {};
    const tt = (o.organizationId !== null && o.organizationId !== undefined && map[o.organizationId]) || tz;
    Object.keys(o).forEach((k) => {
      const v = o[k];
      if (typeof v === 'string' && ISO.test(v) && !/[+-]\d{2}:\d{2}$/.test(v) && !((bdOn() || brOn()) && !/[zZ]$/.test(v))) o[k] = MT.utc(v).tz(tt || 'UTC').format('YYYY-MM-DDTHH:mm:ssZ');
      else if (v && typeof v === 'object') branchShow(v, tt);
    });
  };
  const branchShowDates = (records) => {
    try {
      const map = orgTimezones() || {};
      records.forEach((rec) => branchShow(rec, (rec && rec.organizationId !== null && rec.organizationId !== undefined && map[rec.organizationId]) || 'UTC'));
    } catch (e) { console.log('branchShowDates failed; leaving response as-is', e); }
    return records;
  };

  const branchMoment = (d) => {
    if (typeof d === 'string' && /[+-]\d{2}:\d{2}$/.test(d)) return MT.parseZone(d);
    if ((bdOn() || brOn()) && bdIsNaive(d)) return MT.utc(d);
    const tz = getTimeZone();
    return tz ? MT.utc(d).tz(tz) : MT.utc(d).local();
  };
  const formatDate = (d) => branchMoment(d).format('MMMM Do YYYY, h:mm:ss a');
  const formatDateShort = (d) => (d ? branchMoment(d).format('YYYY-MM-DD') : '');

  // Mismo color de estado que la nativa.
  const getColor = (s) => {
    if (s === 'DRAFT' || s === 'OPEN') return 'blue';
    if (s === 'ACTIVE' || s === 'APROVED') return 'green';
    if (s === 'INACTIVE' || s === 'REJECTED') return 'red';
    return undefined;
  };
  const getStateText = (s) => {
    if (!s) return '-';
    if (s === 'OFFERED') return 'Ofertado';
    if (s === 'CURRENT') return 'Vigente';
    if (s === 'CANCELLED') return 'Cancelada';
    if (s === 'RENEWED') return 'Renovada';
    return t(s);
  };
  const copyPolicyCode = (value) => {
    const content = value === undefined || value === null ? '' : String(value).trim();
    if (!content || content === '-') return;
    const success = () => message.success(t('Copied to clipboard.'));
    const fallback = () => {
      const input = document.createElement('textarea');
      input.value = content;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try { if (document.execCommand('copy')) success(); }
      finally { document.body.removeChild(input); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(content).then(success).catch(fallback);
    else fallback();
  };
  const copyButton = (value) => (
    <Button type="link" size="small" aria-label={t('Copy')} title={t('Copy')} style={{ padding: '0 0 0 5px', height: 'auto', lineHeight: 1.2 }}
      onClick={(e) => { e.stopPropagation(); copyPolicyCode(value); }}>
      <IcoCopy />
    </Button>
  );

  // ---------------------------------------------------------------------- estado
  const EMPTY = {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [branchRelative, setBranchRelative] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [ready, setReady] = useState(false);

  const [lobs, setLobs] = useState([]);
  const [products, setProducts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selections, setSelections] = useState([]);
  const [opts, setOpts] = useState({ group: [], holder: [], seller: [], holding: [] });
  const [contactSearchBy, setContactSearchBy] = useState('name');

  const [restrVisible, setRestrVisible] = useState(false);
  const [restr, setRestr] = useState({ restricted: false, users: [] });
  const [addUserVisible, setAddUserVisible] = useState(false);
  const [newUser, setNewUser] = useState(undefined);
  const [userGroups, setUserGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [restrLoading, setRestrLoading] = useState(false);

  const [viewH, setViewH] = useState(420);
  const [tableY, setTableY] = useState(240);

  // ------------------------------------------------------------------- utilidades
  const esc = (v) => String(v).split("'").join("''");
  const has = (v) => v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '');
  const setField = (k, v) => setF((prev) => { const n = Object.assign({}, prev); n[k] = v; return n; });
  const setOpt = (k, list) => setOpts((prev) => { const n = Object.assign({}, prev); n[k] = list; return n; });
  const nameExpr = () => {
    const legacy = "(RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,'')))";
    try {
      const c = profile().Contacts ? profile().Contacts.fullNameFields : undefined;
      if (!(c instanceof Array)) return legacy;
      const fields = c.filter((p) => ['name', 'middleName', 'surname1', 'surname2'].indexOf(p) !== -1);
      if (!fields.length) return legacy;
      return '(' + fields.map((p) => "RTRIM(ISNULL([" + p + "],''))").join("+' '+") + ')';
    } catch (e) { return legacy; }
  };

  const currencyRow = (code) => {
    const c = String(code);
    return currencies.filter((p) => p.code === c)[0] || currencies.filter((p) => p.code === c.split('-')[0].substring(0, 3))[0] || null;
  };
  // Mismo formato de moneda que la nativa: decimales y simbolo del catalogo de monedas.
  const formatMoney = (v, currency) => {
    const cur = String(currency || 'USD').substring(0, 3);
    const row = currencyRow(cur);
    const dig = row && Number.isInteger(row.fractionDigits) && row.fractionDigits >= 0 && row.fractionDigits <= 6 ? row.fractionDigits : null;
    const symbol = row && row.symbol && row.symbol !== String.fromCharCode(234) && row.symbol !== '[AED]' ? row.symbol : null;
    const o = dig !== null ? { minimumFractionDigits: dig, maximumFractionDigits: dig } : {};
    let fm;
    try {
      fm = new Intl.NumberFormat(W.localStorage.isoCode || 'en-US', Object.assign({ style: 'currency', currency: cur }, o));
    } catch (e) {
      fm = new Intl.NumberFormat('en-US', Object.assign({ style: 'currency', currency: 'USD' }, o));
    }
    if (!symbol) return fm.format(v);
    return fm.formatToParts(v).map((p) => (p.type === 'currency' ? symbol : p.value)).join('');
  };

  // Comparador (=, >, <, entre) igual al de la nativa.
  const cmpStr = (c) => {
    if (!c || !c.op) return undefined;
    if (c.op === ' BETWEEN ') return has(c.a) && has(c.b) ? ' BETWEEN ' + Number(c.a) + ' AND ' + Number(c.b) : undefined;
    return has(c.a) ? c.op + Number(c.a) : undefined;
  };
  const QUICK = [
    ['HAS_CHANGES', 'Has changes', 'id IN (SELECT lifePolicyId FROM Change)'],
    ['PENDING_CHANGES', 'Has pending change proposals', 'id IN (SELECT lifePolicyId FROM Change WHERE status=0)'],
    ['SCHEDULED_CHANGES', 'Has scheduled changes', 'id IN (SELECT lifePolicyId FROM Change WHERE status=2)'],
    ['FAILED_CHANGES', 'Has failed change executions', 'id IN (SELECT lifePolicyId FROM Change WHERE status=4)'],
    ['RECENTLY_CHANGED', 'Changed in last 30 days', 'id IN (SELECT lifePolicyId FROM Change WHERE status IN (1,3) AND executionDate>DATEADD(day,-30,GETDATE()))'],
    ['GRACE_PERIOD', 'In grace period', 'active=1 AND billingStatus=1'],
    ['LAPSED', 'Lapsed', 'active=1 AND billingStatus=-1'],
    ['EXPIRING_90', 'Expiring in next 90 days', 'active=1 AND [end] BETWEEN GETDATE() AND DATEADD(day,90,GETDATE())'],
    ['NOT_ISSUED', 'Not yet issued', 'activeDate IS NULL'],
    ['PENDING_REQUIREMENTS', 'Pending requirements', 'id IN (SELECT lifePolicyId FROM LifeRequirement WHERE request=1 AND response=0)'],
    ['PAID_UP', 'Paid-Up', 'paidUp=1'],
    ['DEACTIVATED', 'Deactivated', "active=0 AND (inactiveDate IS NOT NULL OR (inactiveReason IS NOT NULL AND inactiveReason<>''))"]
  ];
  const CHANGES = [
    ['AddCertificateChange', 'Add Certificate'], ['RemoveCertificateChange', 'Remove Certificate'], ['CapitalChange', 'Sum Insured'],
    ['TermChange', 'Term'], ['PolicyholderChange', 'Policyholder'], ['CoInsuredChange', 'Co-Insured'], ['BeneficiaryChange', 'Beneficiary'],
    ['CessionBeneficiaryChange', 'Cession Beneficiary'], ['ContingentBeneficiaryChange', 'Contingent Beneficiary'],
    ['InvestmentChange', 'Investment Product'], ['RescueChange', 'Partial Surrender'], ['TotalRescueChange', 'Total Surrender'],
    ['MaturityChange', 'Maturity'], ['IndexationChange', 'Indexation Option'], ['ReAdjustmentChange', 'Re-Adjustment'],
    ['ReEvaluationChange', 'Re-Evaluation'], ['AddCoverageChange', 'Attach Coverage'], ['RemoveCoverageChange', 'Detach Coverage'],
    ['PlanChange', 'Plan'], ['PaidUpChange', 'Paid-Up'], ['PaidUpReinstatementChange', 'Paid-Up Reinstatement'], ['BonusChange', 'Happy Event'],
    ['FrequencyChange', 'Premium Frequency'], ['PayPlanChange', 'Installment Edition'], ['PaymentMethodChange', 'Payment Method'],
    ['CoverageChange', 'Coverage Edition'], ['BenefitChange', 'Benefit Edition'], ['IntermediaryChange', 'Intermediary'],
    ['ReinstatementChange', 'Reinstatement'], ['NotTakenUpChange', 'Not Taken Up'], ['RedirectionChange', 'Redirection'],
    ['SwitchChange', 'Switch'], ['LoadingChange', 'Loading'], ['ClauseChange', 'Clauses'], ['ExclusionChange', 'Exclusions'],
    ['InsuredObjectChange', 'Insured Object'], ['AnnuityBeneficiaryChange', 'Annuity Beneficiary'], ['GroupChange', 'Certificate Group'],
    ['CustomGroupChange', 'Custom Certificate Group'], ['TemporalStatusChange', 'Temporal Status'], ['InformativeChange', 'Informative'],
    ['CancellationChange', 'Cancel']
  ];
  const quickSql = (k) => { const q = QUICK.filter((x) => x[0] === k)[0]; return q ? q[2] : undefined; };
  const val = (lv) => (lv && typeof lv === 'object' ? lv.value : lv);

  // La MISMA consulta que arma la busqueda nativa, en el mismo orden.
  const buildFilter = (v, br) => {
    const q = [];
    if (v.date) q.push(branchDateBetween('created', v.date, 'day', br));
    if (has(v.lob)) q.push("lob='" + esc(v.lob) + "'");
    if (v.product) q.push("productCode='" + esc(val(v.product)) + "'");
    if (has(v.currency)) q.push("currency='" + esc(v.currency) + "'");
    if (has(v.active)) q.push("active='" + esc(v.active) + "'");
    if (cmpStr(v.grossValue)) q.push('grossValue' + cmpStr(v.grossValue));
    if (cmpStr(v.insuredSum)) q.push('insuredSum' + cmpStr(v.insuredSum));
    if (cmpStr(v.paid)) q.push('id in (SELECT lifePolicyId FROM PayPlan GROUP BY lifePolicyId HAVING SUM(payed)' + cmpStr(v.paid) + ')');
    if (has(v.id)) q.push('id=' + parseInt(v.id, 10));
    if (has(v.code)) q.push("code LIKE N'%" + esc(v.code) + "%'");
    if (has(v.policyType)) q.push("policyType='" + esc(v.policyType) + "'");
    if (v.groupPolicyId) q.push('groupPolicyId=' + parseInt(val(v.groupPolicyId), 10));
    if (v.holderId && parseInt(val(v.holderId), 10)) q.push('holderId=' + parseInt(val(v.holderId), 10));
    if (v.sellerId && parseInt(val(v.sellerId), 10)) q.push('sellerId=' + parseInt(val(v.sellerId), 10));
    if (v.holdingId) q.push('holderId in (select id from Contact where holdingId=' + parseInt(val(v.holdingId), 10) + ')');
    if (v.categories && v.categories.length > 0) v.categories.forEach((c) => q.push("id in (select LifePolicyId from PolicyTag where tag='" + esc(c) + "')"));
    if (v.anniversary) {
      const startRange = MT(v.anniversary.format('YYYY-MM-DD'), 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
      const endRange = MT(startRange, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD');
      q.push('CASE WHEN GETUTCDATE()<DATEFROMPARTS(Year(GETUTCDATE()),month([start]),day([start])) THEN ' +
        'DATEFROMPARTS(Year(GETUTCDATE()),month([start]),day([start])) ELSE ' +
        'DATEFROMPARTS(Year(GETUTCDATE())+1,month([start]),day([start])) END ' +
        "BETWEEN '" + startRange + "' AND '" + endRange + "'");
    }
    if (has(v.extPolicy)) q.push("extPolicy='" + esc(v.extPolicy) + "'");
    if (has(v.extCertificate)) q.push("extCertificate='" + esc(v.extCertificate) + "'");
    if (has(v.extBankCertificate)) q.push("extBankCertificate='" + esc(v.extBankCertificate) + "'");
    if (v.expirationDate) q.push(branchDateBetween('[end]', v.expirationDate, 'month', br));
    if (v.startDate) q.push(branchDateBetween('[start]', v.startDate, 'month', br));
    if (has(v.expirationDays)) q.push('[end]<(GETDATE()+' + parseInt(v.expirationDays, 10) + ') and [end]>GETDATE() and active=1');
    if (has(v.change)) q.push("id in (select lifePolicyId from Change where Discriminator='" + esc(v.change) + "')");
    if (has(v.anniversaryCount)) q.push('id in (SELECT lifePolicyId FROM Anniversary GROUP BY lifePolicyId HAVING COUNT(*) = ' + parseInt(v.anniversaryCount, 10) + ')');
    if (has(v.lobType)) q.push("lob in (SELECT code FROM lob WHERE productType='" + esc(v.lobType) + "')");
    if (has(v.savedSelectionId)) q.push("id in (SELECT value from STRING_SPLIT((SELECT REPLACE(REPLACE(jSelection,'[',''),']','') FROM Selection WHERE id = " + parseInt(v.savedSelectionId, 10) + "),',') WHERE TRY_CAST(value as int) IS NOT NULL)");
    if (has(v.restrictedStatus)) q.push("restricted='" + (v.restrictedStatus === 'RESTRICTED' ? 1 : 0) + "'");
    if (has(v.organizationId)) q.push('organizationId=' + parseInt(v.organizationId, 10));
    if (cmpStr(v.certificates)) q.push("id in (SELECT groupPolicyId FROM lifepolicy where policyType='C' GROUP BY groupPolicyId HAVING COUNT(*)" + cmpStr(v.certificates) + ')');
    if (has(v.quickFilter) && quickSql(v.quickFilter)) q.push(quickSql(v.quickFilter));
    return q.join(' AND ');
  };

  // ------------------------------------------------------------------ busqueda
  const searchPolicy = (payload) => exe('ExeChain', {
    chain: 'cmdCustomSearchPolicy',
    context: JSON.stringify(payload)
  }).then((r) => (r && r.ok ? r.outData : r));

  const submit = (v, pag, br) => {
    setLoading(true);
    searchPolicy({
      filter: buildFilter(v, br),
      policyStatus: v.policyStatus,
      size: pag.pageSize,
      page: pag.current - 1
    }).then((r) => {
      setLoading(false);
      if (r && r.ok) {
        const rows = r.data || [];
        setData(branchShowDates(rows));
        setMatches(r.total);
        // Como la nativa: si cambia el total se vuelve a la pagina 1.
        setPagination((prev) => Object.assign({}, prev, { total: r.total, current: prev.total !== r.total ? 1 : prev.current }));
      } else {
        message.error((r && r.msg) || t('Error'));
      }
    });
  };

  const loadCatalogs = () => {
    exe('RepoLob', { operation: 'GET' }).then((r) => { if (r && r.ok) setLobs(r.outData || []); });
    exe('RepoProduct', { operation: 'GET' }).then((r) => {
      if (!(r && r.ok)) return;
      const list = (r.outData || []).map((p) => {
        let cfg = {};
        try { cfg = typeof p.configJson === 'string' ? JSON.parse(p.configJson) : p.configJson || {}; } catch (e) { cfg = {}; }
        const main = (cfg && cfg.Main) || {};
        let disabled = false;
        let hidden = false;
        if (main.active !== undefined && main.active !== null) {
          try { disabled = !eval(main.active); hidden = !!main.hideIfInactive && disabled; } catch (e) { disabled = true; hidden = !!main.hideIfInactive; }
        }
        return { code: p.code, name: p.name, lobCode: p.lobCode, additionalLobs: main.additionalLobs || [], disabled: disabled, hidden: hidden };
      });
      setProducts(list);
    });
    exe('RepoCurrency', { operation: 'GET' }).then((r) => { if (r && r.ok) setCurrencies(r.outData || []); });
    exe('RepoOrganization', { operation: 'GET' }).then((r) => { if (r && r.ok) setOrganizations(r.outData || []); });
  };

  const loadSelections = () => {
    exe('RepoSelection', { operation: 'GET', filter: "entity='LifePolicy'" }).then((r) => { if (r && r.ok) setSelections(r.outData || []); });
  };

  // Parametros de la url que la nativa tambien lee: ?date=, active= y section= (con Main.filterLobBySection).
  const hashParams = () => {
    const out = {};
    const h = W.location.hash || '';
    const qs = h.indexOf('?') === -1 ? '' : h.substring(h.indexOf('?') + 1);
    qs.split('&').forEach((kv) => {
      if (!kv) return;
      const i = kv.indexOf('=');
      const k = decodeURIComponent(i === -1 ? kv : kv.substring(0, i));
      out[k] = i === -1 ? null : decodeURIComponent(kv.substring(i + 1));
    });
    return out;
  };

  useEffect(() => {
    loadCatalogs();
    const p = hashParams();
    const init = {};
    if (p.date) init.date = MT(p.date);
    if (p.active !== undefined) init.active = p.active;
    if (mainCfg().filterLobBySection && p.section) init.lobType = String(p.section).toUpperCase();
    setF(init);
    submit(init, pagination, branchRelative);
    setReady(true);
  }, []);

  useEffect(() => {
    if (filterVisible) loadSelections();
  }, [filterVisible]);

  // ------------------------------------------------------- buscadores remotos
  const searchGroup = (text) => {
    if (!text) return;
    const v = esc(text);
    searchPolicy({ filter: "policyType='G' AND (code LIKE N'%" + v + "%' OR id LIKE N'%" + v + "%')", size: 15, page: 0 }).then((r) => {
      setOpt('group', ((r && r.data) || []).map((p) => ({ value: p.id, label: p.id + '-' + p.code })));
    });
  };
  const contactQuery = (text, by) => {
    const v = esc(text);
    if (by === 'name') {
      if (text.indexOf('!') === 0) {
        if (text.length < 3 || text.indexOf('=') === -1) return null;
        const field = text.substring(1).split('=')[0];
        const fv = text.substring(1).split('=')[1];
        if (!fv || !/^[A-Za-z0-9_]+$/.test(field)) return null;
        return { q: field + " LIKE N'%" + esc(fv) + "%'", field: field };
      }
      if (isNaN(text)) return { q: nameExpr() + " like N'%" + v + "%'", field: null };
      return { q: "cnp LIKE N'%" + v + "%'", field: 'cnp' };
    }
    return { q: by + " LIKE N'%" + v + "%'", field: by };
  };
  const searchHolder = (text) => {
    if (!text) return;
    const cq = contactQuery(text, contactSearchBy);
    if (!cq) return;
    exe('GetContacts', { filter: cq.q, size: 10 }).then((r) => {
      setOpt('holder', ((r && r.outData) || []).map((c) => ({
        value: c.id,
        label: c.FullName + (cq.field && c[cq.field] !== undefined ? ' (' + cq.field + '=' + c[cq.field] + ')' : '') + (c.currentAge < 18 && c.isPerson ? ' - ' + t('Minor') : '')
      })));
    });
  };
  const searchSeller = (text) => {
    if (!text) return;
    const q = isNaN(text) ? nameExpr() + " like N'%" + esc(text) + "%'" : "cnp LIKE N'%" + esc(text) + "%'";
    exe('GetContacts', { filter: '(' + q + ')', size: 10 }).then((r) => {
      setOpt('seller', ((r && r.outData) || []).map((c) => ({ value: c.id, label: c.FullName })));
    });
  };
  const searchHolding = (text) => {
    if (!text) return;
    exe('GetHoldings', { filter: "surname2 LIKE N'%" + esc(text) + "%'" }).then((r) => {
      setOpt('holding', ((r && r.outData) || []).map((c) => ({ value: c.id, label: c.FullName })));
    });
  };

  // ------------------------------------------------------------------ acciones
  const onSearch = () => {
    const pag = Object.assign({}, pagination);
    submit(f, pag, branchRelative);
  };
  const onReset = () => setF({});
  const onTableChange = (pag) => {
    const next = Object.assign({}, pagination, { current: pag.current, pageSize: pag.pageSize });
    setPagination(next);
    submit(f, next, branchRelative);
  };
  const onBranchRelative = (checked) => {
    setBranchRelative(checked);
    submit(f, pagination, checked);
  };

  const deleteSelection = () => {
    exe('RepoSelection', { operation: 'DELETE', entity: { id: f.savedSelectionId } }).then((r) => {
      if (r && r.ok) { setField('savedSelectionId', undefined); loadSelections(); } else message.error(r && r.msg);
    });
  };

  const openRestrictions = () => {
    setRestr({ restricted: false, users: [] });
    setAddUserVisible(false);
    setNewUser(undefined);
    setRestrVisible(true);
    if (!users.length) exe('GetUsers', { include: ['Groups'] }).then((r) => { if (r && r.ok) setUsers(r.outData || []); else message.error(r && r.msg); });
  };
  const addUser = () => {
    if (!newUser) { message.error(t('User') + ': ' + t('required')); return; }
    if (restr.users.filter((u) => u.user === newUser).length) { message.error(t('User already added')); return; }
    setRestr(Object.assign({}, restr, { users: restr.users.concat([{ user: newUser }]) }));
    setNewUser(undefined);
    setAddUserVisible(false);
  };
  const saveRestrictions = () => {
    Modal.confirm({
      title: t('Are you sure?'),
      content: t('This action will limit access to this policy to the selected users only. If you are not among the selected users, you will lose your access.'),
      okText: t('Yes'),
      cancelText: t('No'),
      onOk: () => {
        setRestrLoading(true);
        exe('SetPolicyRestrictions', { policyId: undefined, restricted: restr.restricted, users: restr.users, policyIds: selectedRowKeys }).then((r) => {
          setRestrLoading(false);
          if (r && r.ok) { message.success(t('Saved')); setRestrVisible(false); } else message.error(r && r.msg);
        });
      }
    });
  };

  // ------------------------------------------------- medicion de alto (estandar)
  const measure = () => {
    const root = document.querySelector('.msn19');
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (!rect || rect.height === 0) return;
    let cont = root.parentElement;
    while (cont && cont !== document.body && !/(auto|scroll)/.test(W.getComputedStyle(cont).overflowY)) cont = cont.parentElement;
    const limit = cont && cont !== document.body ? cont.getBoundingClientRect().bottom : W.innerHeight;
    const h = Math.max(200, Math.floor(limit - rect.top - 12));
    setViewH((prev) => (Math.abs(h - prev) > 4 ? h : prev));
    const panel = root.querySelector('.msn19-panel');
    if (!panel) return;
    const body = panel.querySelector('.ant-table-body');
    if (!body) return;
    const pRect = panel.getBoundingClientRect();
    const bRect = body.getBoundingClientRect();
    const bt = parseFloat(W.getComputedStyle(panel).borderTopWidth || 0);
    const above = bRect.top - (pRect.top + bt);
    let below = 0;
    const pager = panel.querySelector('.ant-table-pagination');
    if (pager) {
      const ps = W.getComputedStyle(pager);
      below = pager.getBoundingClientRect().bottom + parseFloat(ps.marginBottom || 0) - bRect.bottom;
    }
    const y = Math.max(90, Math.floor(panel.clientHeight - above - below - 1));
    setTableY((prev) => (Math.abs(y - prev) > 4 ? y : prev));
  };

  useEffect(() => {
    measure();
    const t1 = setTimeout(measure, 0);
    const t2 = setTimeout(measure, 200);
    W.addEventListener('resize', measure);
    const root = document.querySelector('.msn19');
    const tablePanel = root && root.querySelector('.msn19-panel');
    const tableBody = tablePanel && tablePanel.querySelector('.ant-table-body');
    const tableHeader = tablePanel && tablePanel.querySelector('.ant-table-header');
    const syncTableScroll = () => {
      if (tableBody && tableHeader) tableHeader.scrollLeft = tableBody.scrollLeft;
    };
    if (tableBody) {
      tableBody.addEventListener('scroll', syncTableScroll);
      syncTableScroll();
    }
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer && root) observer.observe(root);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      W.removeEventListener('resize', measure);
      if (tableBody) tableBody.removeEventListener('scroll', syncTableScroll);
      if (observer) observer.disconnect();
    };
  });

  // --------------------------------------------------------------------- columnas
  const nowrap = (v) => <div style={{ whiteSpace: 'nowrap' }}>{formatDateShort(v)}</div>;
  const getMainInsured = (r) => {
    if (!r) return {};
    if (r.MainInsured || r.mainInsured) return r.MainInsured || r.mainInsured;
    const insureds = Array.isArray(r.Insureds) ? r.Insureds : [];
    return insureds.filter((x) => Number(x && (x.isMainInsured || x.mainInsured)) === 1 || Number(x && x.role) === 0)[0] || insureds[0] || {};
  };
  const getInsuredContact = (r) => {
    const insured = getMainInsured(r);
    return insured.Contact || insured.contact || insured.Insured || insured.insured || insured;
  };
  const getCatalogName = (value, catalog) => {
    const item = (catalog || []).filter((x) => x && (x.code == value || x.id == value))[0];
    return item && (item.name || item.description || item.code || item.id);
  };
  const getBranchName = (r) => {
    const branch = r && (r.Branch || r.branch);
    return (branch && (branch.name || branch.description || branch.code)) ||
      getCatalogName(r && r.organizationId, organizations) || (r && r.branchCode) || '-';
  };
  const getLobName = (r) => {
    const lob = r && (r.Lob || r.lobObject);
    return (lob && (lob.name || lob.description || lob.code)) || getCatalogName(r && r.lob, lobs) || (r && r.lob) || '-';
  };
  const getProductName = (r) => {
    const product = r && (r.Product || r.product);
    return (product && (product.name || product.description || product.code)) || getCatalogName(r && r.productCode, products) || (r && r.productCode) || '-';
  };
  const getInsuredName = (r) => {
    const contact = getInsuredContact(r);
    const legal = contact && (contact.isPerson === 0 || contact.isPerson === false || String(contact.isPerson) === '0');
    if (legal) return contact.surname2 || contact.name || contact.FullName || '-';
    return [contact.name, contact.surname1].filter(Boolean).join(' ') || contact.FullName || '-';
  };
  const getInsuredIdentification = (r) => {
    const contact = getInsuredContact(r);
    return contact && (contact.isPerson === 0 || contact.isPerson === false || String(contact.isPerson) === '0')
      ? (contact.nif || '-')
      : (contact.cnp || '-');
  };
  const getInsuredCobis = (r) => getInsuredContact(r).nationalId || '-';
  const getCreatedBy = (r) => {
    const process = r && r.Process;
    const value = r && (r.createdBy || r.createdByUser || r.createdByName || r.userName || r.username || r.user ||
      (process && (process.usuario || process.createdBy || process.createdByUser || process.userName || process.username || process.user)));
    if (value && typeof value === 'object') return value.name || value.email || value.userName || value.username || '-';
    return value || '-';
  };
  const columns = [
    { title: 'Sucursal', key: 'branch', render: (v, r) => <span className="msn19-sucursal">{getBranchName(r)}</span> },
    { title: 'Id Póliza', dataIndex: 'id', width: 90, align: 'center', render: (v, r) => <a href={'#/lifePolicy/' + r.id}>{v}</a> },
    { title: 'Póliza', dataIndex: 'code', width: 194, render: (v, r) => <span style={{ display: 'flex', alignItems: 'center' }}><a className="msn19-poliza" href={'#/lifePolicy/' + r.id}>{v || '-'}</a>{copyButton(v)}</span> },
    { title: 'Ramo', key: 'lobName', width: 190, render: (v, r) => {
      const name = getLobName(r);
      return <Tooltip title={name}><span className="msn19-catalogo">{name}</span></Tooltip>;
    } },
    { title: 'Producto', key: 'productName', width: 190, render: (v, r) => {
      const name = getProductName(r);
      return <Tooltip title={name}><span className="msn19-catalogo">{name}</span></Tooltip>;
    } },
    { title: 'Año-Mes', key: 'yearMonth', render: (v, r) => (r.start ? branchMoment(r.start).format('YYYY-MM') : '-') },
    { title: 'Estado', dataIndex: 'policyStatus', align: 'center', render: (v) => <Tag color={v === 'OFFERED' ? 'blue' : (v === 'CURRENT' ? 'green' : (v === 'CANCELLED' ? 'red' : 'orange'))}>{getStateText(v)}</Tag> },
    { title: 'Inicia', dataIndex: 'start', render: nowrap },
    { title: 'Vence', dataIndex: 'end', render: nowrap },
    { title: 'No. Cobis', key: 'cobis', width: 110, align: 'center', render: (v, r) => <span className="msn19-dato-visible">{getInsuredCobis(r)}</span> },
    { title: 'Asegurado', key: 'insuredName', width: 220, render: (v, r) => {
      const name = getInsuredName(r);
      return <Tooltip title={name}><a className="msn19-asegurado" href={'#/contact/' + (getMainInsured(r).contactId || '')}>{name}</a></Tooltip>;
    } },
    { title: 'Identificación', key: 'insuredIdentification', width: 145, render: (v, r) => <span className="msn19-dato-visible">{getInsuredIdentification(r)}</span> },
    { title: 'Usuario', key: 'createdBy', width: 170, render: (v, r) => <span className="msn19-dato-visible">{getCreatedBy(r)}</span> },
    { title: 'Fecha Ingreso', key: 'created', render: (v, r) => (r.created || r.createdDate ? formatDate(r.created || r.createdDate) : '-') }
  ];
  const displayData = branchRelative ? branchShowDates(JSON.parse(JSON.stringify(data || []))) : data;

  // ------------------------------------------------------------------ estandar css
  const css =
    '.msn19{display:flex;flex-direction:column;min-width:0;overflow:hidden;font-size:13px;}' +
    '.msn19 .msn19-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;background:transparent;border:1px solid #e6ebf2;border-radius:6px;padding:10px 12px;margin:0 0 2px 4px;flex-shrink:0;}' +
    '.msn19 .msn19-bar>.ant-space{margin-left:4px;}' +
    '.msn19 .msn19-bar>.msn19-bar-options{margin-left:auto;margin-right:4px;color:#5a6673;}' +
    '.msn19 .msn19-bar .ant-btn{border-color:#8f9aa7;}' +
    '.msn19 .msn19-bar .ant-btn-primary{border-color:#1677ff;}' +
    '.msn19 .msn19-bar .ant-btn[disabled]{border-color:#6f7b88;opacity:1;}' +
    '.msn19 .msn19-panel{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;min-width:0;overflow:hidden;background:#fff;border:1px solid #cbd1d8;}' +
    '.msn19 .msn19-panel .ant-table-wrapper{flex:1 1 auto;min-height:0;min-width:0;}' +
    '.msn19 .ant-table table{table-layout:fixed;}' +
    '.msn19 .ant-table-header{overflow:hidden !important;}' +
    '.msn19 .ant-table-body{min-height:' + tableY + 'px;overflow-y:scroll !important;overflow-x:scroll !important;scrollbar-gutter:stable;}' +
    '.msn19 .ant-table-thead>tr>th{background:#bfbfbf !important;color:#262626;font-weight:600;border-right:1px solid #cbd1d8 !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;white-space:nowrap;}' +
    '.msn19 .ant-table-thead>tr>th:last-child{border-right:none !important;}' +
    '.msn19 .ant-table-thead>tr>th::before{display:none !important;}' +
    '.msn19 .ant-table-selection-column{display:none !important;}' +
    '.msn19 .ant-table-tbody>tr>td{border-right:none !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;white-space:nowrap;}' +
    '.msn19 .msn19-sucursal{color:#0958d9;font-weight:600;}' +
    '.msn19 .msn19-poliza{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.msn19 .msn19-catalogo{display:block;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.msn19 .msn19-asegurado{display:block;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.msn19 .msn19-dato-visible{display:block;min-width:82px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.msn19 .ant-table-tbody>tr.ant-table-row:hover>td{background:#b7d7ff !important;}' +
    '.msn19 .ant-table-tbody>tr.ant-table-row-selected>td,.msn19 .ant-table-tbody>tr.msn19-selected>td{background:#86b4ff !important;}' +
    '.msn19 .ant-table-tbody>tr.ant-table-row-selected:hover>td,.msn19 .ant-table-tbody>tr.msn19-selected:hover>td{background:#86b4ff !important;}' +
    '.msn19 .ant-table-tbody>tr.ant-table-placeholder:hover>td{background:#fff !important;}' +
    '.msn19 .ant-table-pagination.ant-pagination{margin:8px;flex-shrink:0;}' +
    '.msn19 .msn19-btn-sec{border-color:#8f9aa7 !important;}' +
    '.msn19 .ant-btn[disabled],.msn19-drawer .ant-btn[disabled]{border-color:#6f7b88 !important;opacity:1 !important;}' +
    '.msn19-drawer .ant-drawer-body{font-size:13px;}' +
    '.msn19-drawer .msn19-btn-sec{border-color:#8f9aa7 !important;}' +
    '.msn19-drawer .msn19-campo{margin-bottom:12px;width:100%;}' +
    '.msn19-drawer .msn19-rotulo{margin-bottom:4px;}' +
    '.msn19-drawer .msn19-fila{display:flex;gap:5px;}';

  const campo = (rotulo, control, extra) => (
    <div className="msn19-campo" style={extra}>
      <div className="msn19-rotulo">{rotulo}</div>
      {control}
    </div>
  );
  const fila = (a, b) => <div className="msn19-fila">{a}{b}</div>;
  const textInput = (k, ph) => <Input value={f[k]} placeholder={ph} onChange={(e) => setField(k, e.target.value)} />;
  const compare = (k) => {
    const c = f[k] || {};
    const upd = (patch) => setField(k, Object.assign({}, c, patch));
    const isBetween = c.op === ' BETWEEN ';
    return (
      <div style={{ display: 'flex' }}>
        <Select allowClear value={c.op || undefined} onChange={(v) => (v === undefined ? setField(k, undefined) : upd({ op: v }))} style={{ marginRight: 5, width: isBetween ? 200 : '100%' }} placeholder={t('Comparison mode')}>
          <Option value="=">{t('Equal')}</Option>
          <Option value=">">{t('Greater than')}</Option>
          <Option value="<">{t('Less than')}</Option>
          <Option value=" BETWEEN ">{t('Between')}</Option>
        </Select>
        {isBetween ? null : <InputNumber style={{ width: '100%' }} value={c.a} onChange={(v) => upd({ a: v })} placeholder={t('Value')} />}
        {isBetween ? <InputNumber style={{ width: '100%' }} value={c.a} onChange={(v) => upd({ a: v })} placeholder={t('Lower Value')} /> : null}
        {isBetween ? <InputNumber style={{ width: '100%', marginLeft: 5 }} value={c.b} onChange={(v) => upd({ b: v })} placeholder={t('Upper value')} /> : null}
      </div>
    );
  };
  const remote = (k, optKey, onSearchFn, ph, footer) => (
    <Select
      showSearch
      labelInValue
      allowClear
      showArrow={false}
      filterOption={false}
      style={{ width: '100%' }}
      placeholder={ph}
      value={f[k]}
      onSearch={onSearchFn}
      onChange={(v) => setField(k, v)}
      options={opts[optKey]}
      dropdownRender={footer ? (menu) => (
        <div>
          {menu}
          <div style={{ padding: '4px 8px', borderTop: '1px solid #f0f0f0' }} onMouseDown={(e) => e.preventDefault()}>{footer}</div>
        </div>
      ) : undefined}
    />
  );
  const productsForLob = products.filter((p) => !p.hidden && (!f.lob || p.lobCode == f.lob || (p.additionalLobs || []).indexOf(f.lob) !== -1));
  const restrictedUsersCols = [
    { title: t('Authorized Users'), dataIndex: 'user' },
    { title: t('Actions'), key: 'del', render: (v, r) => <Button type="link" icon={<IcoDelete />} onClick={() => setRestr(Object.assign({}, restr, { users: restr.users.filter((u) => u.user !== r.user) }))} /> }
  ];
  const groupsOfUsers = () => {
    const g = [];
    users.forEach((u) => (u.Groups || []).forEach((x) => { if (!g.filter((y) => y.usrGroupId == x.usrGroupId).length) g.push(x); }));
    return g;
  };
  const usersShown = users.filter((u) => (userGroups.length ? userGroups.some((gid) => (u.Groups || []).some((ug) => ug.usrGroupId == gid)) : true));

  return (
    <DefaultPage title={t('Búsqueda de póliza')} icon="file-search" loading={false}>
      <div className="msn19" style={{ height: viewH }}>
        <style>{css}</style>

        <div className="msn19-bar">
          <Space size={8}>
            <Button type="primary" icon={<IcoFilter />} onClick={() => setFilterVisible(true)}>
              Filtrar
            </Button>
            <Button loading={loading} disabled={loading} onClick={() => submit(f, pagination, branchRelative)}>
              Refrescar
            </Button>
          </Space>
          {multiTz ? (
            <span className="msn19-bar-options">
              <Checkbox checked={branchRelative} onChange={(e) => onBranchRelative(e.target.checked)}>
                {t('Branch-relative dates')}
              </Checkbox>
            </span>
          ) : null}
        </div>

        <section className="msn19-panel">
          <Table
            rowKey="id"
            size="small"
            loading={loading}
            columns={columns}
            dataSource={displayData}
            scroll={{ x: 'max-content', y: tableY }}
            onChange={onTableChange}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              size: 'small',
              showTotal: (total) => 'Total ' + total + ' items'
            }}
          />
        </section>

        <Drawer title={t('Policy Filter Search')} className="msn19-drawer" placement="right" width={512} open={filterVisible} onClose={() => setFilterVisible(false)}>
          <div style={{ marginTop: -12 }}>
            <Button icon={<IcoUndo />} size="small" onClick={onReset}>{t('Reset')}</Button>
          </div>
          <Tabs>
            <TabPane tab={t('General')} key="general">
              {fila(
                campo(t('LoB'),
                  <Select showSearch allowClear showArrow style={{ width: '100%' }} placeholder={t('Please select LoB')} value={f.lob}
                    onChange={(v) => setF((prev) => { const n = Object.assign({}, prev, { lob: v }); const pc = val(prev.product); if (pc && !products.filter((p) => p.code === pc && (!v || p.lobCode == v || (p.additionalLobs || []).indexOf(v) !== -1)).length) n.product = undefined; return n; })}>
                    {lobs.map((d) => <Option key={d.code} value={d.code}>{t(d.name)}</Option>)}
                  </Select>),
                campo(t('Product'),
                  <Select labelInValue allowClear showSearch style={{ width: '100%' }} placeholder={t('Please select product')} value={f.product} onChange={(v) => setField('product', v)}>
                    {productsForLob.map((p) => <Option key={p.code} value={p.code} disabled={p.disabled}>{p.name}</Option>)}
                  </Select>)
              )}
              {fila(
                campo(t('Status'),
                  <Select allowClear style={{ width: '100%' }} placeholder="Seleccione estado" value={f.policyStatus} onChange={(v) => setField('policyStatus', v)}>
                    <Option value="OFFERED">Ofertado</Option>
                    <Option value="CURRENT">Vigente</Option>
                    <Option value="CANCELLED">Cancelada</Option>
                    <Option value="RENEWED">Renovada</Option>
                  </Select>),
                campo(t('In Force'),
                  <Select allowClear style={{ width: '100%' }} placeholder={t('Current in force status')} value={f.active} onChange={(v) => setField('active', v)}>
                    <Option value="true">{t('In Force')}</Option>
                    <Option value="false">{t('Not In Force')}</Option>
                  </Select>)
              )}
              {fila(
                campo('Póliza', <Input allowClear style={{ width: '100%' }} placeholder="Código de póliza" value={f.code} onChange={(e) => setField('code', e.target.value)} />),
                campo(t('Id'), <InputNumber style={{ width: '100%' }} placeholder={t('Policy ID')} value={f.id} onChange={(v) => setField('id', v)} />)
              )}
              {fila(
                campo(t('Policy Type'),
                  <Select allowClear style={{ width: '100%' }} value={f.policyType} onChange={(v) => setField('policyType', v)}>
                    <Option value="I">{t('Individual Policy')}</Option>
                    <Option value="G">{t('Group Policy')}</Option>
                    <Option value="C">{t('Certificate')}</Option>
                  </Select>),
                campo(t('LoB Type'),
                  <Select allowClear style={{ width: '100%' }} value={f.lobType} onChange={(v) => setField('lobType', v)}>
                    <Option value="HEALTH">{t('Health')}</Option>
                    <Option value="PROPERTY">{t('Property')}</Option>
                    <Option value="LIFE">{t('Life')}</Option>
                  </Select>)
              )}
              {campo(t('Group Policy'), remote('groupPolicyId', 'group', searchGroup, t('Type to search group policy...')))}
              {campo(t('Policyholder'), remote('holderId', 'holder', searchHolder, t('Type to search contact...'),
                <Radio.Group size="small" value={contactSearchBy} onChange={(e) => setContactSearchBy(e.target.value)}>
                  <Radio value="name">{t('Name')}</Radio>
                  <Radio value="nationalId">{t('National ID')}</Radio>
                  <Radio value="passport">{t('Passport')}</Radio>
                  <Radio value="nif">{t('NIF')}</Radio>
                </Radio.Group>))}
              {campo(t('Seller'), remote('sellerId', 'seller', searchSeller, t('Type to search contact...')))}
            </TabPane>
            <TabPane tab={t('Dates')} key="dates">
              <Space>
                {campo(t('Creation Date'), <DatePicker placeholder={t('Select date')} value={f.date} onChange={(v) => setField('date', v || undefined)} />)}
                {campo(t('Next Anniversary'), <DatePicker picker="month" placeholder={t('Select month')} value={f.anniversary} onChange={(v) => setField('anniversary', v || undefined)} />)}
              </Space>
              <Space>
                {campo(t('Start Date'), <DatePicker picker="month" placeholder={t('Select month')} value={f.startDate} onChange={(v) => setField('startDate', v || undefined)} />)}
                {campo(t('Expiration Date'), <DatePicker picker="month" placeholder={t('Select month')} value={f.expirationDate} onChange={(v) => setField('expirationDate', v || undefined)} />)}
              </Space>
            </TabPane>
            <TabPane tab={t('Other')} key="other">
              {campo(t('Insured Sum'), compare('insuredSum'))}
              {fila(campo(t('External Policy'), textInput('extPolicy')), campo(t('External Certificate'), textInput('extCertificate')))}
              {fila(
                campo(t('External Bank Certificate'), textInput('extBankCertificate')),
                campo(t('Days to expiration'), <InputNumber min={0} style={{ width: '100%' }} placeholder={t('Insert days')} value={f.expirationDays} onChange={(v) => setField('expirationDays', v)} />)
              )}
              {campo(t('Currency'),
                <Select allowClear style={{ width: '100%' }} placeholder={t('Currency')} value={f.currency} onChange={(v) => setField('currency', v)}>
                  {currencies.filter((c) => c.enabled).map((c) => <Option key={c.code} value={c.code}>{c.name}</Option>)}
                </Select>)}
              {campo(t('Certificate Count'), compare('certificates'))}
            </TabPane>
          </Tabs>
          <Button style={{ marginTop: 10 }} type="primary" icon={<IcoSearch />} onClick={onSearch} loading={loading}>
            {t('Search')}
          </Button>
          {matches !== null ? (
            <div style={{ marginTop: 15 }}>
              <Tag>{matches}</Tag> {t('Results')}
            </div>
          ) : null}
        </Drawer>

        <Modal open={restrVisible} onCancel={() => setRestrVisible(false)} title={t('Policy Restrictions')} onOk={saveRestrictions} okText={t('Save')} okButtonProps={{ loading: restrLoading }}>
          <div style={{ display: addUserVisible ? 'none' : 'block' }}>
            {campo(t('Restricted'),
              <Switch checked={restr.restricted} checkedChildren={<IcoLock />} unCheckedChildren={<IcoUnlock />} onChange={(v) => setRestr(Object.assign({}, restr, { restricted: v }))} />)}
            {restr.restricted ? (
              <div>
                <Button type="link" style={{ padding: 0 }} icon={<IcoPlus />} onClick={() => setAddUserVisible(true)}>{t('Add')}</Button>
                <Table size="small" rowKey="user" pagination={false} columns={restrictedUsersCols} dataSource={restr.users} />
              </div>
            ) : null}
          </div>
          {addUserVisible ? (
            <div>
              <Button type="link" onClick={() => setAddUserVisible(false)}>{t('Back')}</Button>
              <Button type="link" icon={<IcoSave />} onClick={addUser}>{t('Save')}</Button>
              {campo(t('Select Groups'),
                <Select mode="multiple" allowClear style={{ width: '100%' }} placeholder={t('Select Groups')} value={userGroups} onChange={(v) => setUserGroups(v)} optionFilterProp="children">
                  {groupsOfUsers().map((g) => <Option key={g.usrGroupId} value={g.usrGroupId}>{g.name}</Option>)}
                </Select>)}
              {campo(t('User'),
                <Select showSearch allowClear style={{ width: '100%' }} placeholder={t('Select User')} value={newUser} onChange={(v) => setNewUser(v)}
                  filterOption={(input, o) => String(o.label || '').toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  options={usersShown.map((u) => ({ value: u.email, label: u.nombre + ' (' + u.email + ')' }))} />)}
            </div>
          ) : null}
        </Modal>
      </div>
    </DefaultPage>
  );
}
