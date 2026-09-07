/**
 * @name UncollectiblePremiumEndorsement
 * @description Manages the uncollectible premium endorsement process for a policy.
 * @type VIEW
 * @author Michael Delgado
 * @created 2026/09/07
 * @version 1.0
 * @purpose Calculate, review, save, and execute an endorsement for uncollectible premium balances.
 */

() => {
  const { Card, Row, Col, Form, DatePicker, Input, Select, Button, Descriptions, Alert, Tag, Skeleton, Space, Popconfirm, Table, Tabs, message } = A;

  // AXX-253 / GLOB-1209 - Endoso de Prima Incobrable.
  // Accion de poliza (Configuracion avanzada > Policy > customActions). Cotiza con
  // ChangeCancellation y ejecuta con ExeChangeCancellation. El importe es el saldo de prima
  // pendiente: sin fechas, vigencias ni prorratas.
  //
  // AXX-272 / GLOB-1209:
  //  - CA-05: se retira la restriccion por ramo. La vista abre para CUALQUIER ramo. La
  //    elegibilidad por estado de poliza (solo canceladas, CA-09 de AXX-253) SIGUE VIGENTE.
  //  - CA-07/08/09: la vista sobrescribe el jDetail de ESTE endoso dejando cada rubro nuevo en
  //    cero y conservando el anterior. Change.jDetail no lo lee la ejecucion, asi que el ajuste
  //    es representacion y auditoria de este endoso y no altera ningun otro (CA-10).
  //  - CA-11/12: validacion de saldo cero sobre jDetail y sobre Bill. Cualquier diferencia
  //    residual se informa con su rubro y su importe y BLOQUEA Ejecutar. Nunca se redondea una
  //    diferencia a cero para ocultarla.
  //  - CA-13/14/15: Guardar persiste el endoso sin ejecutarlo; Ejecutar revalida contra el
  //    estado actual antes de aplicar y rechaza un calculo obsoleto.
  //
  // Ojo: en una LiveView el motor es buble, asi que todo await va dentro de "async function",
  // nunca de una arrow async. Y ninguna clave de t() puede llevar dos puntos: i18next los trata
  // como separador de namespace y se come la frase.

  const ENDORSEMENT_TYPE = 'UNCOLLECTIBLEPREMIUM';
  const REASON_CATALOG = 'CancellationChange';
  const DEFAULT_REASON_CODE = 'CANCELACION POR FALTA DE PAGO';
  const MONEY_DECIMALS = 2; // precision monetaria oficial del ambiente (Bill y recibo)
  const ZERO_EPS = 0.005;   // medio centavo: por debajo, dos importes son iguales A ESA precision

  // AXX-272 ronda 2, CA-19: la grilla de detalle salio con bordes verticales tambien en las FILAS.
  // El estandar pide lo contrario: en las filas solo separadores horizontales, y los verticales se
  // conservan SIEMPRE en los encabezados. Se acota a esta grilla con la clase axx272-detail para no
  // tocar ninguna otra tabla de la vista ni del sistema.
  const DETAIL_GRID_CSS = [
    '.axx272-detail .ant-table { font-size: 12px; }',
    '.axx272-detail .ant-table-container { border: 1px solid #cbd1d8; }',
    // encabezados: fondo sutilmente mas oscuro y separadores verticales de 1px, siempre
    '.axx272-detail .ant-table-thead > tr > th {',
    '  background: #bfbfbf; font-size: 12px; line-height: 18px; padding: 5px 8px;',
    '  border-right: 1px solid #cbd1d8 !important; border-bottom: 1px solid #cbd1d8 !important; }',
    '.axx272-detail .ant-table-thead > tr > th:last-child { border-right: 0 !important; }',
    // filas: unicamente separadores horizontales, sin bordes verticales
    '.axx272-detail .ant-table-tbody > tr > td {',
    '  font-size: 12px; line-height: 18px; padding: 5px 8px;',
    '  border-right: 0 !important; border-left: 0 !important;',
    '  border-bottom: 1px solid #cbd1d8 !important; }',
    '.axx272-detail .ant-table-tbody > tr:last-child > td { border-bottom: 0 !important; }',
  ].join('\n');

  const VIEW_CSS = [
    '.uncollectible-view { height: 100%; min-height: 100dvh; overflow: hidden; font-size: 13px; }',
    '.uncollectible-view.ant-card { display: flex; flex-direction: column; }',
    '.uncollectible-view .ant-card-head { min-height: 46px; border-bottom: 1px solid #cbd1d8; }',
    '.uncollectible-view .ant-card-head-title { font-size: 16px; font-weight: 600; }',
    '.uncollectible-view > .ant-card-body { flex: 1 1 auto; min-height: 0; }',
    '.uncollectible-summary { border: 1px solid #cbd1d8; }',
    '.uncollectible-summary .ant-descriptions-item-label { background: #f2f4f7; font-size: 12px; }',
    '.uncollectible-summary .ant-descriptions-item-content { font-size: 13px; }',
    '.uncollectible-toolbar { display: flex; align-items: center; min-height: 42px; margin: 0 -4px 2px; padding: 4px 4px 4px 8px; border: 1px solid #e6ebf2; background: transparent; }',
    '.uncollectible-toolbar .ant-btn { border-radius: 6px; }',
    '.uncollectible-toolbar .ant-btn-default { border-color: #8f9aa7; }',
    '.uncollectible-toolbar .ant-btn-dangerous { border-color: #bd4d35; }',
    '.uncollectible-toolbar .ant-btn[disabled] { border-color: #6f7b88; opacity: 1; }',
    '.axx272-detail-tabs { min-height: 0; flex: 1 1 auto; display: flex; flex-direction: column; }',
    '.uncollectible-tabs { min-height: 0; flex: 1 1 auto; display: flex; flex-direction: column; }',
    '.uncollectible-tabs > .ant-tabs-nav { margin-bottom: 2px; }',
    '.uncollectible-tabs.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab { margin-right: 2px; border: 1px solid #cbd1d8; border-bottom: 0; border-radius: 6px 6px 0 0; }',
    '.uncollectible-tabs.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active { border-color: #1677ff; }',
    '.uncollectible-tabs .ant-tabs-content-holder { min-height: 0; overflow: auto; border: 1px solid #cbd1d8; padding: 8px; }',
    '.uncollectible-tabs .ant-tabs-content { height: 100%; }',
    '.uncollectible-tabs .ant-tabs-tabpane { min-height: 0; }',
    '.uncollectible-view .ant-alert { font-size: 13px; }'
  ].join('\n');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [policy, setPolicy] = useState(null);
  const [lobName, setLobName] = useState('');
  const [productName, setProductName] = useState('');
  const [pending, setPending] = useState(null);
  const [pendingBreakdown, setPendingBreakdown] = useState(null);
  const [reasons, setReasons] = useState([]);

  const [causa, setCausa] = useState(undefined);
  const [effectiveDate, setEffectiveDate] = useState(null);
  const [observation, setObservation] = useState('CANCELACIÓN POR SALDO INCOBRABLE');
  const [touched, setTouched] = useState(false);

  const [quoting, setQuoting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [quote, setQuote] = useState(null);
  const [detail, setDetail] = useState(null);       // jDetail de este endoso, ya en cero
  const [residuals, setResiduals] = useState([]);   // rubros que NO quedaron en cero
  const [quotedBalance, setQuotedBalance] = useState(null);
  const [savedChange, setSavedChange] = useState(null);
  const [actionError, setActionError] = useState('');
  const [done, setDone] = useState(null);

  const txt = (v) => String(v === null || v === undefined ? '' : v).trim();
  const responseMessage = (response, fallback) => {
    const direct = txt(response && response.msg);
    if (direct) return direct;

    const hook = response && Array.isArray(response.hooks)
      ? response.hooks.find((h) => h && h.result && txt(h.result.msg))
      : null;
    const hookMessage = hook && hook.result ? txt(hook.result.msg) : '';
    return hookMessage || fallback;
  };

  const round2 = (v) => {
    const n = Number(v || 0);
    if (!isFinite(n)) return 0;
    return Number((Math.round((n + Number.EPSILON) * 100) / 100).toFixed(MONEY_DECIMALS));
  };
  const money = (v) => {
    const n = Number(v || 0);
    const cur = policy && policy.currency ? policy.currency : '';
    // Formato estandar N2: miles con coma y decimales con punto.
    return n.toLocaleString('en-US', { minimumFractionDigits: MONEY_DECIMALS, maximumFractionDigits: MONEY_DECIMALS }) + (cur ? ' ' + cur : '');
  };
  const normalizePendingBreakdown = (value) => {
    const data = value || {};
    const premium = round2(data.pendingPremium || data.premium || 0);
    const tax = round2(data.pendingTax || data.tax || 0);
    const total = round2(data.pendingTotal || data.total || data.pending || (premium + tax));
    return { pendingPremium: premium, pendingTax: tax, pendingTotal: total };
  };
  const firstMoney = function () {
    for (let i = 0; i < arguments.length; i += 1) {
      const n = Number(arguments[i] || 0);
      if (isFinite(n) && Math.abs(n) >= ZERO_EPS) return Math.abs(n);
    }
    return 0;
  };
  const firstMoneyOrNull = function () {
    for (let i = 0; i < arguments.length; i += 1) {
      const n = Number(arguments[i] || 0);
      if (isFinite(n) && Math.abs(n) >= ZERO_EPS) return Math.abs(n);
    }
    return null;
  };

  const getPolicyId = () => {
    try {
      const href = String(window.location.href || '').replace('#/', '');
      const url = new URL(href);
      return Number(url.searchParams.get('policyId') || 0);
    } catch (e) {
      return 0;
    }
  };
  const policyId = getPolicyId();

  const loadAll = async function () {
    setLoading(true);
    setLoadError('');
    try {
      if (!policyId) throw new Error(t('No policy was supplied. Open this view from the policy actions menu.'));

      const polRes = await exe('RepoLifePolicy', { operation: 'GET', filter: 'id = ' + policyId });
      if (!polRes || !polRes.ok) throw new Error((polRes && polRes.msg) || t('The policy could not be read.'));
      const rows = polRes.outData || [];
      if (!rows.length) throw new Error(t('Policy not found') + ' - ' + policyId);
      const pol = rows[0];
      setPolicy(pol);

      const catalogs = await Promise.all([
        exe('RepoLob', {
          operation: 'GET',
          filter: "code = '" + String(pol.lob || '').replace(/'/g, "''") + "'"
        }).catch(() => null),
        exe('RepoProduct', {
          operation: 'GET',
          filter: "code = '" + String(pol.productCode || '').replace(/'/g, "''") + "'"
        }).catch(() => null),
        exe('GetPendingPremiums', { policyId: policyId }).catch(() => null),
        exe('ExeChain', {
          chain: 'cmdGetUncollectiblePremium',
          context: JSON.stringify({ policyId: policyId })
        }).catch(() => null),
        exe('RepoReasonsCatalog', { operation: 'GET', filter: "catalog='" + REASON_CATALOG + "'" }).catch(() => null)
      ]);
      const lobRows = catalogs[0] && catalogs[0].ok ? (catalogs[0].outData || []) : [];
      const productRows = catalogs[1] && catalogs[1].ok ? (catalogs[1].outData || []) : [];
      const lob = lobRows.find((item) => String(item.code) === String(pol.lob));
      const product = productRows.find((item) => String(item.code) === String(pol.productCode));
      setLobName((lob && (lob.name || lob.code)) || pol.lob || '');
      setProductName((product && (product.name || product.code)) || pol.productCode || '');

      const balRes = catalogs[2];
      if (!balRes || !balRes.ok) throw new Error((balRes && balRes.msg) || t('The pending premium balance could not be read.'));
      setPending(balRes.outData || { pending: 0 });

      const uncollectibleRes = catalogs[3];
      if (uncollectibleRes && uncollectibleRes.ok) {
        setPendingBreakdown(normalizePendingBreakdown(uncollectibleRes.outData));
      }

      const catRes = catalogs[4];
      if (catRes && catRes.ok) setReasons(catRes.outData || []);

      // La fecha inicial usa el calendario local del navegador: hoy si la poliza ya inicio,
      // o el inicio de vigencia cuando la poliza comienza en una fecha futura.
      if (typeof moment !== 'undefined') {
        const today = moment();
        const policyStart = pol.start ? moment(pol.start) : null;
        setEffectiveDate(policyStart && policyStart.isAfter(today, 'day') ? policyStart : today);
      }

    } catch (e) {
      setLoadError(String((e && e.message) || e));
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // Selecciona una causa inicial del catalogo, manteniendo el campo editable.
  useEffect(() => {
    if (causa || !reasons.length) return;
    const defaultReason = reasons.find((reason) =>
      String(reason.code || '').trim().toUpperCase() === DEFAULT_REASON_CODE
    );
    if (defaultReason) setCausa(defaultReason.code);
  }, [reasons, causa]);

  // ---------------------------------------------------------------- eligibility
  // AXX-272 CA-05: NO hay restriccion por ramo. La vista abre para cualquier ramo y aplican
  // unicamente los permisos y las reglas generales del sistema. Lo que sigue vigente de
  // AXX-253 es la elegibilidad por estado: solo polizas canceladas, y con saldo positivo.
  const isCancelled = policy
    ? (policy.active === false && (!!policy.inactiveDate || txt(policy.inactiveReason) !== ''))
    : false;
  const pendingAmount = pending ? Number(pending.pending || 0) : 0;
  const hasBalance = pendingAmount > 0;

  let ineligible = '';
  if (policy && !isCancelled) {
    ineligible = t('This action is only available for cancelled policies. This policy is not cancelled.');
  } else if (policy && !hasBalance) {
    ineligible = t('This policy has no positive pending premium balance, so there is nothing to write off.') + ' ' + t('Current balance') + ' - ' + money(pendingAmount) + '.';
  }
  const eligible = !!policy && !ineligible;

  // ---------------------------------------------------------------- validation
  const missing = [];
  if (!txt(causa)) missing.push(t('Cause'));
  if (!effectiveDate) missing.push(t('Effective date'));
  if (!txt(observation)) missing.push(t('Observation'));
  const formValid = missing.length === 0;

  const fmtDate = (d) => (d && d.format ? d.format('YYYY-MM-DD') : '');

  const buildAdditional = () => JSON.stringify({
    endorsementType: ENDORSEMENT_TYPE,
    causa: txt(causa),
    observacion: txt(observation),
    effectiveDate: fmtDate(effectiveDate),
  });

  const buildData = (operation) => {
    const data = {
      policyId: policyId,
      reason: txt(causa),
      byHolder: false,
      effectiveDate: fmtDate(effectiveDate),
      cancellationProrateMode: 2,
      jAdditional: buildAdditional(),
      note: txt(observation),
    };
    if (operation) data.operation = operation;
    return data;
  };

  // ----------------------------------------------- CA-07/08/09: jDetail en cero
  // Reescribe SOLO el detalle de este endoso: cada rubro nuevo queda en cero, el anterior se
  // conserva y la diferencia se reexpresa como nuevo - anterior. Este endoso cancela el saldo
  // completo, sin prorrata, asi que el costo del rubro es la totalidad de lo dado de baja.
  const zeroDetail = (jDetailText, balanceDetail) => {
    let d = {};
    try { d = JSON.parse(jDetailText || '{}'); } catch (e) { d = {}; }
    const balance = balanceDetail || {};
    const pendingTotal = firstMoney(balance.pendingTotal, pendingAmount, d.pendingTotal);
    const pendingTax = firstMoneyOrNull(balance.pendingTax, d.pendingTax);
    const pendingPremium = firstMoneyOrNull(balance.pendingPremium, d.pendingPremium);
    const premiumBalance = pendingPremium !== null ? pendingPremium : round2(Math.max(pendingTotal - (pendingTax || 0), 0));
    const taxBalance = pendingTax !== null ? pendingTax : 0;

    d.pendingPremium = premiumBalance;
    d.pendingTax = taxBalance;
    d.pendingTotal = pendingTotal;

    const pair = (oldKey, newKey, difKey, costKey, forcedOld) => {
      const oldVal = round2(forcedOld);
      d[oldKey] = oldVal;
      d[newKey] = 0;
      d[difKey] = round2(0 - oldVal);
      if (costKey) d[costKey] = round2(0 - oldVal);
    };
    pair('oldAnnualPremium', 'newAnnualPremium', 'annualPremiumDif', 'changeCost', pendingTotal);
    pair('oldCoverages', 'newCoverages', 'coveragesDif', 'coveragesCost', premiumBalance);
    pair('oldTax', 'newTax', 'taxDif', 'taxCost', taxBalance);
    if (Array.isArray(d.Coverages)) {
      const weights = d.Coverages.map((c) => firstMoney(c.pendingPremium, c.newPremium, c.oldPremium));
      const weightTotal = weights.reduce((sum, value) => sum + Number(value || 0), 0);
      let allocated = 0;
      d.Coverages = d.Coverages.map((c, index) => {
        const weight = weights[index] || 0;
        const isLast = index === d.Coverages.length - 1;
        const proportional = weightTotal > 0 ? round2(premiumBalance * weight / weightTotal) : 0;
        const o = isLast ? round2(premiumBalance - allocated) : proportional;
        allocated = round2(allocated + o);
        const n = Object.assign({}, c);
        n.oldPremium = o;
        n.newPremium = 0;
        n.premiumDif = round2(0 - o);
        n.premiumCost = round2(0 - o);
        return n;
      });
    }
    return d;
  };

  // ------------------------------------------------- CA-11/12: regla de bloqueo
  // Devuelve los rubros que NO quedaron compensados, con su diferencia. Para este endoso Bill
  // representa el estado final de facturacion, asi que sus rubros deben quedar en cero. El saldo
  // previo se muestra solo en el comparativo visual usando el saldo pendiente y los auxiliares del
  // calculo, no como saldo final de Bill.
  // Nunca redondea a cero una diferencia distinta de cero para ocultarla: compara contra 0.00
  // en la precision monetaria del ambiente y reporta el importe tal cual.
  const computeResiduals = (d, bill, balance) => {
    const out = [];
    const check = (label, value) => {
      const v = round2(value);
      if (Math.abs(v) >= ZERO_EPS) out.push({ rubro: label, value: v });
    };
    check(t('Annual premium'), d.newAnnualPremium);
    check(t('Coverages'), d.newCoverages);
    check(t('Tax'), d.newTax);
    (d.Coverages || []).forEach((c) => {
      check(t('Coverage premium') + ' ' + (c.code || c.id || ''), c.newPremium);
    });
    if (bill) {
      const billingTotal = bill.anualTotal !== null && bill.anualTotal !== undefined
        ? Number(bill.anualTotal || 0)
        : Number(bill.annualTotal || 0);
      const billingBreakdown = Number(bill.anualPremium || 0)
        + Number(bill.tax || 0)
        + Number(bill.surcharges || 0)
        + Number(bill.discounts || 0)
        + Number(bill.fee || 0);

      check(t('Billing breakdown'), billingBreakdown - billingTotal);
      check(t('Billing total'), billingTotal);
      check(t('Billing installment'), Number(bill.installment || 0));
    }
    return out;
  };

  // ---------------------------------------------------------------- actions
  const onQuote = async function () {
    setTouched(true);
    setActionError('');
    setDone(null);
    if (!formValid) return;
    setQuoting(true);
    try {
      const r = await exe('ChangeCancellation', buildData(null));
      if (!r || !r.ok) {
        const errorMessage = responseMessage(
          r,
          t('The endorsement could not be calculated. The endorsement was NOT applied and the policy was not changed.')
        );
        setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null);
        setActionError(errorMessage);
        message.error(errorMessage);
      } else {
        const pendingDetailRes = await exe('ExeChain', {
          chain: 'cmdGetUncollectiblePremium',
          context: JSON.stringify({ policyId: policyId })
        }).catch(() => null);
        const quoteBreakdown = pendingDetailRes && pendingDetailRes.ok
          ? normalizePendingBreakdown(pendingDetailRes.outData)
          : normalizePendingBreakdown(pendingBreakdown || pending || { pending: pendingAmount });
        if (pendingDetailRes && pendingDetailRes.ok) {
          setPendingBreakdown(quoteBreakdown);
        }
        const d = zeroDetail(r.outData.jDetail, quoteBreakdown);
        const res = computeResiduals(d, r.outData.Bill, pendingAmount);
        setQuote(r.outData);
        setDetail(d);
        setResiduals(res);
        setQuotedBalance(pendingAmount);
        setSavedChange(null);
        if (res.length) message.warning(t('The calculation does not reach a zero balance. Execution is blocked.'));
      }
    } catch (e) {
      setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null);
      setActionError(responseMessage(
        e,
        t('The endorsement could not be calculated. The endorsement was NOT applied and the policy was not changed.')
      ));
    }
    setQuoting(false);
  };

  // Persiste el endoso con su detalle en cero, SIN ejecutarlo (CA-13).
  const saveEndorsement = async function () {
    const saved = await exe('ChangeCancellation', buildData('ADD'));
    if (!saved || !saved.ok || !saved.outData || !saved.outData.id) {
      throw new Error(t('The endorsement could not be saved. The endorsement was NOT applied and the policy was not changed.'));
    }
    const changeId = saved.outData.id;

    // Sobrescribe el detalle de ESTE endoso. El interceptor de este ambiente sobre
    // ChangeCancellation lee policyId y effectiveDate en TODA llamada, UPDATE incluida:
    // tienen que viajar junto a Entity o la actualizacion se rechaza.
    const loaded = await exe('LoadEntity', { entity: 'Change', filter: 'id=' + changeId, noTracking: true });
    if (loaded && loaded.ok && loaded.outData) {
      const ent = Object.assign({}, loaded.outData, { jDetail: JSON.stringify(detail) });
      const upd = await exe('ChangeCancellation', {
        policyId: policyId, effectiveDate: fmtDate(effectiveDate), Entity: ent, operation: 'UPDATE',
      });
      if (!upd || !upd.ok) {
        throw new Error(t('The endorsement was saved as number ') + changeId + t(' but its detail could NOT be written, so it was not executed. Review it from the policy change list.'));
      }
    }

    // CA-17 de AXX-272 / CA-16 de AXX-253: este endoso no genera reaseguro. La rutina de
    // reaseguro sale antes de escribir cuando el cambio esta marcado como informativo. Es una
    // marca por cambio, puesta solo aqui, asi que la cancelacion nativa sigue distribuyendo igual.
    const inf = await exe('SetField', { entity: 'Change', entityId: changeId, fieldValue: 'informative=1' });
    if (!inf || !inf.ok) {
      throw new Error(t('The endorsement was saved as number ') + changeId + t(' but it could NOT be prepared for execution, so it was not applied. Review it from the policy change list.'));
    }
    return { changeId: changeId, processId: Number(saved.outData.processId || 0) };
  };

  const onSave = async function () {
    setTouched(true);
    setActionError('');
    if (!formValid || !quote || !detail) return;
    setSaving(true);
    try {
      const s = await saveEndorsement();
      setSavedChange(s);
      message.success(t('Endorsement saved without executing.') + ' ' + t('Change number') + ' - ' + s.changeId);
    } catch (e) {
      setActionError(String((e && e.message) || e));
      message.error(t('The endorsement could not be saved.'));
    }
    setSaving(false);
  };

  const onExecute = async function () {
    setActionError('');
    if (!formValid || !quote || !detail || !savedChange) return;
    if (residuals.length) {
      setActionError(t('Execution is blocked while a rubro is different from zero.'));
      return;
    }
    setExecuting(true);
    try {
      // CA-15: revalidar contra el estado ACTUAL antes de aplicar. Si el saldo cambio desde el
      // calculo, se rechaza y se pide recalcular en vez de ejecutar con datos obsoletos.
      const fresh = await exe('GetPendingPremiums', { policyId: policyId });
      if (!fresh || !fresh.ok) throw new Error(t('The pending premium balance could not be re-checked, so the endorsement was not executed.'));
      const freshBalance = Number((fresh.outData || {}).pending || 0);
      if (Math.abs(freshBalance - Number(quotedBalance || 0)) >= ZERO_EPS) {
        setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null);
        setPending(fresh.outData);
        throw new Error(t('The pending premium balance changed since the calculation, so the endorsement was not executed. Please calculate again.') +
          ' ' + t('Calculated balance') + ' - ' + money(quotedBalance) + '. ' + t('Current balance') + ' - ' + money(freshBalance) + '.');
      }

      // La ejecucion solo puede utilizar el endoso previamente guardado.
      // No se vuelve a crear ni modificar el endoso desde este flujo.
      const target = savedChange;

      // La cancelacion pasa por su propio flujo de aprobacion: ExeChangeCancellation rechaza un
      // cambio cuyo proceso no fue aprobado.
      let processId = Number(target.processId || 0);
      if (!processId) {
        const ent = await exe('LoadEntity', { entity: 'Change', fields: 'id,processId', filter: 'id=' + target.changeId, noTracking: true });
        if (ent && ent.ok && ent.outData) processId = Number(ent.outData.processId || 0);
      }
      if (processId) {
        const appr = await exe('GotoStep', { procesoId: processId, estado: 'APROVED' });
        const apprRes = Array.isArray(appr) ? (appr[0] || {}) : appr;
        if (!apprRes || !apprRes.ok) {
          throw new Error(t('The endorsement was saved as number ') + target.changeId + t(' but its approval workflow could NOT be advanced, so it was not applied. Review it from the policy change list.'));
        }
      }

      const exeRes = await exe('ExeChangeCancellation', { changeId: target.changeId });
      if (!exeRes || !exeRes.ok) {
        throw new Error(t('The endorsement was saved as number ') + target.changeId + t(' but it could NOT be executed, so it was not applied. Review it from the policy change list.'));
      }
      const after = await exe('GetPendingPremiums', { policyId: policyId });
      setDone({ changeId: target.changeId, balance: after && after.ok ? Number((after.outData || {}).pending || 0) : null });
      message.success(t('Uncollectible premium endorsement applied.') + ' ' + t('Change number') + ' - ' + target.changeId);
      window.location.href = '/#/lifePolicy/' + policyId;
    } catch (e) {
      setActionError(String((e && e.message) || e));
      message.error(t('The endorsement could not be executed.'));
    }
    setExecuting(false);
  };

  // ---------------------------------------------------------------- render
  if (loading) return <Card className="uncollectible-view" title={t('Uncollectible Premium Endorsement')} bodyStyle={{ padding: 12 }}><Skeleton active /></Card>;

  if (loadError) {
    return (
      <Card className="uncollectible-view" title={t('Uncollectible Premium Endorsement')} bodyStyle={{ padding: 12 }}>
        <Alert type="error" showIcon message={t('The endorsement cannot be opened')} description={loadError} />
      </Card>
    );
  }

  const bill = quote && quote.Bill ? quote.Bill : null;
  const reasonOptions = reasons.map((r) => <Select.Option key={r.code} value={r.code}>{t(r.name)}</Select.Option>);
  const zeroOk = !!detail && residuals.length === 0;

  // Montos en grilla: positivo verde, negativo rojo, cero negro y peso normal (CA-19).
  const amountStyle = (v) => {
    const n = Number(v || 0);
    if (Math.abs(n) < ZERO_EPS) return { color: '#262626', fontWeight: 'normal' };
    return { color: n > 0 ? '#237804' : '#cf1322' };
  };
  const amountCell = (v) => <span style={amountStyle(v)}>{money(v)}</span>;

  const parseJDetail = (value) => {
    try {
      if (!value) return {};
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
      return {};
    }
  };

  // Bill ahora representa el estado final de facturacion y puede venir en cero. El "antes" del
  // comparativo debe salir del saldo pendiente real o de los auxiliares del calculo, no de Bill.
  const calculatedDetail = parseJDetail(quote && quote.jDetail);
  const pendingTotal = firstMoney(
    bill && bill.pendingTotal,
    pendingBreakdown && pendingBreakdown.pendingTotal,
    pendingAmount,
    calculatedDetail.pendingTotal
  );
  const pendingTax = firstMoneyOrNull(
    bill && bill.pendingTax,
    pendingBreakdown && pendingBreakdown.pendingTax,
    pending && pending.pendingTax,
    pending && pending.tax,
    calculatedDetail.pendingTax
  );
  const pendingPremium = firstMoneyOrNull(
    bill && bill.pendingPremium,
    pendingBreakdown && pendingBreakdown.pendingPremium,
    pending && pending.pendingPremium,
    pending && pending.premium,
    calculatedDetail.pendingPremium
  );
  const currentAnnual = pendingTotal;
  const currentTax = pendingTax !== null ? pendingTax : 0;
  const currentCoverages = pendingPremium !== null ? pendingPremium : round2(Math.max(pendingTotal - currentTax, 0));
  const calculatedCoverages = Array.isArray(calculatedDetail.Coverages)
    ? calculatedDetail.Coverages
    : (detail && Array.isArray(detail.Coverages) ? detail.Coverages : []);
  const coverageWeights = calculatedCoverages.map((c) => firstMoney(c.pendingPremium, c.newPremium, c.oldPremium));
  const coverageWeightTotal = coverageWeights.reduce((sum, value) => sum + Number(value || 0), 0);
  let allocatedCoverageTotal = 0;

  const detailRows = detail ? [
    { key: 'annual', rubro: t('Annual premium'), old: currentAnnual, neu: detail.newAnnualPremium },
    { key: 'coverages', rubro: t('Coverages'), old: currentCoverages, neu: detail.newCoverages },
    { key: 'tax', rubro: t('Tax'), old: currentTax, neu: detail.newTax },
  ].concat(calculatedCoverages.map((c, i) => {
    const weight = coverageWeights[i] || 0;
    const isLast = i === calculatedCoverages.length - 1;
    const proportionalAmount = coverageWeightTotal > 0
      ? round2(currentCoverages * weight / coverageWeightTotal)
      : 0;
    const coverageAmount = isLast
      ? round2(currentCoverages - allocatedCoverageTotal)
      : proportionalAmount;
    allocatedCoverageTotal = round2(allocatedCoverageTotal + coverageAmount);
    return {
      key: 'cov' + i,
      rubro: t('Coverage premium') + ' ' + (c.code || c.id || ''),
      old: coverageAmount,
      neu: 0,
    };
  })) : [];

  const detailColumns = [
    { title: t('Item'), dataIndex: 'rubro', key: 'rubro' },
    { title: t('Current balance'), dataIndex: 'old', key: 'old', align: 'right', render: (v) => amountCell(v) },
    { title: t('New value'), dataIndex: 'neu', key: 'neu', align: 'right', render: (v) => amountCell(v) },
  ];

  return (
    <Card
      className="uncollectible-view"
      title={t('Uncollectible Premium Endorsement')}
      bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <style>{VIEW_CSS}</style>
      <Descriptions className="uncollectible-summary" size="small" column={3} bordered style={{ marginBottom: 12 }}>
        <Descriptions.Item label={t('Policy')}>{policy.code}</Descriptions.Item>
        <Descriptions.Item label={t('Line of business')}>{lobName || policy.lob}</Descriptions.Item>
        <Descriptions.Item label={t('Product')}>{productName || policy.productCode}</Descriptions.Item>
        <Descriptions.Item label={t('Pending premium balance')} span={2}>
          <b>{money(pendingAmount)}</b>
        </Descriptions.Item>
        <Descriptions.Item label={t('Status')}>
          {isCancelled
            ? <Tag color="red">{t('Cancelled')}</Tag>
            : <Tag color="green">{t('Not cancelled')}</Tag>}
        </Descriptions.Item>
      </Descriptions>

      {!eligible ? (
        <Alert type="warning" showIcon message={t('This endorsement is not available for this policy')} description={ineligible} />
      ) : null}

      {done ? (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('Uncollectible premium endorsement applied.') + ' ' + t('Change number') + ' - ' + done.changeId}
          description={t('Pending premium balance after the endorsement') + ' - ' + money(done.balance) + '. ' + t('The policy accepts no further endorsements; any later change requires a new policy.')}
        />
      ) : null}

      {actionError ? (
        <Alert type="error" showIcon style={{ marginBottom: 12 }} message={t('The endorsement was not applied')} description={actionError} />
      ) : null}

      {eligible && !done ? (
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={t('Cause')} required
                validateStatus={touched && !txt(causa) ? 'error' : ''}
                help={touched && !txt(causa) ? t('This field is required.') : ''}>
                <Select id="causa" value={causa} disabled={!!savedChange} onChange={(v) => { setCausa(v); setTouched(true); setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null); }} placeholder={t('Please select cause')}>
                  {reasonOptions}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('Endorsement effective date')} required
                validateStatus={touched && !effectiveDate ? 'error' : ''}
                help={touched && !effectiveDate ? t('This field is required.') : ''}>
                <DatePicker id="effectiveDate" disabled={!!savedChange} style={{ width: '100%' }} format="YYYY-MM-DD"
                  value={effectiveDate} onChange={(d) => { setEffectiveDate(d); setTouched(true); setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null); }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('Endorsement observation')} required
                validateStatus={touched && !txt(observation) ? 'error' : ''}
                help={touched && !txt(observation) ? t('This field is required.') : ''}>
                <Input.TextArea id="observation" disabled={!!savedChange} rows={2} maxLength={500} value={observation}
                  onChange={(e) => { setObservation(e.target.value); setTouched(true); setQuote(null); setDetail(null); setResiduals([]); setSavedChange(null); }} />
              </Form.Item>
            </Col>
          </Row>

          <div className="uncollectible-toolbar">
            <Space size={8}>
            <Button id="btnQuote" type="primary" disabled={!!savedChange} loading={quoting} onClick={onQuote}>{t('Calculate')}</Button>
            <Button id="btnSave" type="primary" loading={saving} disabled={!quote || !!savedChange} onClick={onSave}>{t('Save endorsement')}</Button>
            <Popconfirm
              title={t('The pending premium balance will be written off and the policy will accept no further endorsements. Continue?')}
              okText={t('Yes')} cancelText={t('No')} disabled={!savedChange || !zeroOk} onConfirm={onExecute}>
              <Button id="btnExecute" type="primary" disabled={!savedChange || !zeroOk} loading={executing}>{t('Execute endorsement')}</Button>
            </Popconfirm>
            {!formValid && touched ? <span style={{ color: '#cf1322' }}>{t('Required') + ' - ' + missing.join(', ')}</span> : null}
            </Space>
          </div>

          {savedChange ? (
            <Alert type="info" showIcon style={{ marginTop: 12 }}
              message={t('Endorsement saved without executing.') + ' ' + t('Change number') + ' - ' + savedChange.changeId}
              description={t('The endorsement is persisted with its detail. It has not been executed yet.')} />
          ) : null}
        </Form>
      ) : null}

      {/* CA-12: rubro y diferencia, y Ejecutar bloqueado */}
      {detail && residuals.length ? (
        <Alert type="error" showIcon style={{ marginTop: 12 }}
          message={t('Execution is blocked while a rubro is different from zero.')}
          description={
            <div>
              <div style={{ marginBottom: 6 }}>{t('The following items did not reach a zero balance. The difference is reported at the official monetary precision and is never rounded to zero.')}</div>
              {residuals.map((r, i) => (
                <div key={i}>• {r.rubro} — {t('residual difference')} <b style={amountStyle(r.value)}>{money(r.value)}</b></div>
              ))}
            </div>
          } />
      ) : null}

      {detail && !residuals.length ? (
        <Alert type="success" showIcon style={{ marginTop: 12 }}
          message={t('The calculation reaches a zero balance in every required item.')}
          description={t('Annual premium, coverages, coverage premiums, tax and billing amounts are all 0.00.')} />
      ) : null}

      {detail || bill ? (
        <div className="axx272-detail-tabs" style={{ marginTop: 16 }}>
          <Tabs className="uncollectible-tabs" defaultActiveKey={detail ? 'endorsement' : 'cancellation'} type="card">
            {detail ? (
              <Tabs.TabPane tab={t('Endorsement detail')} key="endorsement">
                <style>{DETAIL_GRID_CSS}</style>
                <div className="axx272-detail">
                  <Table
                    size="small"
                    bordered
                    pagination={false}
                    rowKey="key"
                    dataSource={detailRows}
                    columns={detailColumns}
                  />
                </div>
              </Tabs.TabPane>
            ) : null}

            {bill ? (
              <Tabs.TabPane tab={t('Cancellation detail')} key="cancellation">
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label={t('Coverage Premiums')}>{money(bill.coverages)}</Descriptions.Item>
                  <Descriptions.Item label={t('Surcharges')}>{money(bill.surcharges)}</Descriptions.Item>
                  <Descriptions.Item label={t('Discounts')}>{money(bill.discounts)}</Descriptions.Item>
                  <Descriptions.Item label={t('Annual Premium')}>{money(bill.anualPremium)}</Descriptions.Item>
                  <Descriptions.Item label={t('Tax')}>{money(bill.tax)}</Descriptions.Item>
                  <Descriptions.Item label={t('Fee')}>{money(bill.fee)}</Descriptions.Item>
                  <Descriptions.Item label={t('Total')}><b>{money(bill.anualTotal)}</b></Descriptions.Item>
                  <Descriptions.Item label={t('Modal Premium')}>{money(bill.installment)}</Descriptions.Item>
                </Descriptions>
                <Alert type="info" showIcon style={{ marginTop: 8 }}
                  message={t('Bill represents the final billing state returned by the calculation. For this endorsement every billing amount must remain at 0.00; the previous balance is shown in the endorsement detail only for comparison.')} />
              </Tabs.TabPane>
            ) : null}
          </Tabs>
        </div>
      ) : null}
    </Card>
  );
}
