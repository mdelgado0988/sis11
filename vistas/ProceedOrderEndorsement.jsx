/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/09/07
 * @name ProceedOrderEndorsement
 * @version 1.0
 * @purpose: Manage proceed-order endorsements by calculating coverage validity changes,
 * executing the ChangeCoverage endorsement, and synchronizing insured-object data.
 */
() => {
  const { Card, Row, Col, Form, DatePicker, Input, Button, Table, Descriptions, Alert, Tag, Skeleton, Space, Divider, Popconfirm, Spin, Tabs, message } = A;
  const { TabPane } = Tabs;

  // ---------------------------------------------------------------- utilities
  // Date rule (§2.3): every date is handled as a CALENDAR date in the browser
  // local zone, normalised to local midnight. Date-only values stay unchanged;
  // timestamp values with an explicit zone are converted to the browser locale.
  const toLocalDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    if (value && typeof value.toDate === 'function') {
      const m = value.toDate();
      return new Date(m.getFullYear(), m.getMonth(), m.getDate());
    }
    const rawValue = String(value);
    // ISO timestamps with an explicit zone must be converted to the browser's
    // local calendar date before comparison. Date-only values are already
    // calendar dates and must not be shifted by the browser timezone.
    if (rawValue.includes('T') && /(?:Z|[+-]\d{2}:?\d{2})$/.test(rawValue)) {
      const instant = new Date(rawValue);
      if (!Number.isNaN(instant.getTime())) {
        return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
      }
    }
    const raw = rawValue.slice(0, 10);
    const parts = raw.split('-');
    if (parts.length !== 3) return null;
    const y = Number(parts[0]), mo = Number(parts[1]), d = Number(parts[2]);
    if (!y || !mo || !d) return null;
    return new Date(y, mo - 1, d);
  };
  const fmt = (date) => {
    if (!date) return '';
    const p = (n) => (n < 10 ? '0' + n : String(n));
    return date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate());
  };
  const fmtAtNoon = (value) => {
    const raw = String(value == null ? '' : value).trim();
    const datePart = raw.match(/^\d{4}-\d{2}-\d{2}/);
    if (datePart) return datePart[0] + 'T12:00:00Z';
    const calendarDate = toLocalDate(value);
    const calendar = fmt(calendarDate);
    return calendar ? calendar + 'T12:00:00Z' : '';
  };
  const toPolicyLocalDate = (value) => {
    if (!value) return null;
    if (value instanceof Date || (value && typeof value.toDate === 'function')) return toLocalDate(value);
    const raw = String(value).trim();
    if (!raw) return null;
    // LifePolicy dates are persisted at midnight by the API. Apply the same
    // UTC-to-browser-local conversion used by the policy screens, including
    // responses that omit the explicit Z suffix.
    const source = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw)
      ? raw
      : (raw.includes('T') ? raw + 'Z' : raw + 'T00:00:00Z');
    const instant = new Date(source);
    if (Number.isNaN(instant.getTime())) return toLocalDate(raw);
    return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
  };
  const DAY = 86400000;
  const daysBetween = (a, b) => (!a || !b ? null : Math.round((b.getTime() - a.getTime()) / DAY));
  const inclusiveDaysBetween = (a, b) => {
    const days = daysBetween(a, b);
    return days == null ? null : days + 1;
  };
  const addDays = (date, n) => (!date || n == null ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
  const addMonths = (date, months) => {
    if (!date || !Number.isFinite(months)) return null;
    const result = new Date(date.getFullYear(), date.getMonth(), 1);
    result.setMonth(result.getMonth() + months);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(date.getDate(), lastDay));
    return result;
  };
  const txt = (v) => String(v == null ? '' : v).trim();
  const translatedMessage = (value, fallback) => value ? t(String(value)) : t(fallback);
  const parseJson = (value, fallback) => {
    if (typeof value !== 'string') return value == null ? fallback : value;
    try { return JSON.parse(value); } catch (error) { return fallback; }
  };
  const getInsuredObjectValue = (insuredObject, fieldName) => {
    if (!insuredObject) return null;
    let values = parseJson(insuredObject.userData, insuredObject.userData);
    if (!values || (typeof values === 'object' && !Array.isArray(values) && !Object.keys(values).length)) {
      values = parseJson(insuredObject.jValues, insuredObject.jValues);
    }
    if (Array.isArray(values)) {
      const field = values.find((item) => item && txt(item.name) === fieldName);
      return field ? field.userData : null;
    }
    return values && typeof values === 'object' ? values[fieldName] : null;
  };
  const isCheckedValue = (value) => {
    const values = Array.isArray(value) ? value : [value];
    return values.some((item) => {
      const normalized = txt(item).toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'si' || normalized === 'sí';
    });
  };
  const billingFields = [
    { label: 'Coverages', keys: ['coverages'] },
    { label: 'Surcharges', keys: ['surcharges'] },
    { label: 'Discounts', keys: ['discounts'] },
    { label: 'Annual premium', keys: ['anualPremium', 'annualPremium'] },
    { label: 'Tax', keys: ['tax'] },
    { label: 'Annual total', keys: ['anualTotal', 'annualTotal'] },
    { label: 'Installment', keys: ['installment'] },
    { label: 'Fee', keys: ['fee'] },
  ];
  const getBillAmount = (bill, keys) => {
    const source = bill || {};
    const key = keys.find((item) => source[item] !== undefined && source[item] !== null);
    const value = key === undefined ? 0 : Number(source[key]);
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  };
  const validateBilling = (quoteData, currentBill) => {
    const quoteBill = quoteData && quoteData.Bill;
    const billDiff = quoteData && quoteData.BillDiff;
    if (!quoteBill || !billDiff || !currentBill) {
      return {
        ok: false,
        msg: t('The calculation did not return Bill, BillDiff, or the current policy billing data.')
      };
    }

    const diffErrors = billingFields
      .map((field) => ({
        label: t(field.label),
        value: getBillAmount(billDiff, field.keys)
      }))
      .filter((item) => item.value !== 0);

    const billErrors = billingFields
      .map((field) => ({
        label: t(field.label),
        current: getBillAmount(currentBill, field.keys),
        calculated: getBillAmount(quoteBill, field.keys)
      }))
      .filter((item) => item.current !== item.calculated);

    const details = [];
    if (diffErrors.length) {
      details.push(t('BillDiff contains non-zero amounts: ') + diffErrors
        .map((item) => item.label + ' (' + item.value.toFixed(2) + ')')
        .join(', '));
    }
    if (billErrors.length) {
      details.push(t('Bill differs from the current policy billing: ') + billErrors
        .map((item) => item.label + ' (' + item.current.toFixed(2) + ' → ' + item.calculated.toFixed(2) + ')')
        .join(', '));
    }

    return {
      ok: details.length === 0,
      msg: details.join(' ')
    };
  };
  const getCurrentPolicyBill = (currentPolicy) => {
    if (!currentPolicy) return null;
    if (currentPolicy.Bill) return currentPolicy.Bill;
    return {
      coverages: currentPolicy.coverages !== undefined
        ? currentPolicy.coverages
        : currentPolicy.anualPremium,
      surcharges: currentPolicy.surcharges,
      discounts: currentPolicy.discounts,
      anualPremium: currentPolicy.anualPremium,
      tax: currentPolicy.tax,
      anualTotal: currentPolicy.anualTotal,
      annualTotal: currentPolicy.annualTotal,
      installment: currentPolicy.installment,
      fee: currentPolicy.fee
    };
  };

  // ---------------------------------------------------------------- state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [policy, setPolicy] = useState(null);
  const [coverages, setCoverages] = useState([]);
  const [cfgRows, setCfgRows] = useState([]);
  const [effectiveDate, setEffectiveDate] = useState(null);
  const [observation, setObservation] = useState('');
  const [touched, setTouched] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [processingEndorsement, setProcessingEndorsement] = useState(false);
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [changeId, setChangeId] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [premiumValidationError, setPremiumValidationError] = useState('');
  const [proceedOrderEnabled, setProceedOrderEnabled] = useState(false);

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

  const loadProceedOrderFlag = async function () {
    const definitionResponse = await exe('RepoObjectDefinition', {
      operation: 'GET',
      filter: "code = 'OBJFIANZA'"
    });
    if (!definitionResponse || !definitionResponse.ok) {
      throw new Error(translatedMessage(definitionResponse && definitionResponse.msg, 'The insured-object definition could not be loaded.'));
    }
    const definition = (definitionResponse.outData || [])[0];
    if (!definition || !definition.id) {
      throw new Error(t('The OBJFIANZA insured-object definition was not found.'));
    }

    const insuredResponse = await exe('RepoInsuredObject', {
      operation: 'GET',
      filter: 'lifePolicyId=' + policyId + ' AND objectDefinitionId=' + Number(definition.id),
      include: ['ObjectDefinition']
    });
    if (!insuredResponse || !insuredResponse.ok) {
      throw new Error(translatedMessage(insuredResponse && insuredResponse.msg, 'The insured-object data could not be loaded.'));
    }
    const insuredObject = (insuredResponse.outData || [])[0];
    return isCheckedValue(getInsuredObjectValue(insuredObject, 'orden_de_proceder'));
  };

  // ---------------------------------------------------------------- data load
  useEffect(() => {
    let cancelled = false;
    const load = async function () {
      setLoading(true);
      setLoadError('');
      try {
        if (!policyId) {
          throw new Error(t('No policy was supplied. Open this view with ?policyId=<id>.'));
        }
        const polRes = await exe('RepoLifePolicy', { operation: 'GET', filter: 'id = ' + policyId, include: ['Product', 'Coverages'] });
        if (!polRes || !polRes.ok) {
          throw new Error(translatedMessage(polRes && polRes.msg, 'The policy could not be loaded.'));
        }
        const pol = (polRes.outData || [])[0];
        if (!pol) throw new Error(t('Policy not found: ') + policyId);

        const hasProceedOrder = await loadProceedOrderFlag();

        const cfgRes = await exe('GetFullTable', { table: 'cfgCoberturaProductoReaFianza' });
        if (!cfgRes || !cfgRes.ok) {
          throw new Error(translatedMessage(cfgRes && cfgRes.msg, 'The coverage configuration table could not be loaded.'));
        }
        const table = Array.isArray(cfgRes.outData) ? cfgRes.outData : [];
        if (table.length < 2) throw new Error(t('cfgCoberturaProductoReaFianza returned no configuration rows.'));

        const header = table[0].map((h) => txt(h));
        const idx = {};
        header.forEach((h, i) => { if (idx[h] === undefined) idx[h] = i; });
        const iLob = idx.lobCode, iProd = idx.productCode, iCov = idx.coverageCode;
        const iDep = header.indexOf('coverageCodeDep');
        if (iLob === undefined || iProd === undefined || iCov === undefined || iDep < 0) {
          throw new Error(t('cfgCoberturaProductoReaFianza does not have the expected columns.'));
        }
        const rows = table.slice(1)
          .filter((r) => txt(r[iLob]) === txt(pol.lob) && txt(r[iProd]) === txt(pol.productCode))
          .map((r) => ({ lobCode: txt(r[iLob]), productCode: txt(r[iProd]), coverageCode: txt(r[iCov]), coverageCodeDep: txt(r[iDep]) }));

        if (!cancelled) {
          setPolicy(pol);
          setCoverages(Array.isArray(pol.Coverages) ? pol.Coverages : []);
          setCfgRows(rows);
          setProceedOrderEnabled(hasProceedOrder);
        }
      } catch (err) {
        if (!cancelled) setLoadError(translatedMessage(err && err.message ? err.message : String(err), 'The view could not be loaded.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [policyId]);

  useEffect(() => {
    const styleId = 'proceed-order-endorsement-grid-style';
    if (document.getElementById(styleId)) return undefined;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .proceed-order-endorsement-view .proceed-order-coverage-table {
        border: 1px solid #cbd1d8;
      }

      .proceed-order-endorsement-view.ant-card > .ant-card-head {
        padding: 0 4px;
      }

      .proceed-order-endorsement-view.ant-card > .ant-card-body {
        padding: 4px !important;
      }

      .proceed-order-endorsement-view .proceed-order-coverage-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border: 1px solid #cbd1d8 !important;
        color: #262626;
        font-size: 12px;
        line-height: 18px;
        padding: 5px 8px !important;
      }

      .proceed-order-endorsement-view .proceed-order-coverage-table .ant-table-tbody > tr > td {
        border-top: 1px solid #cbd1d8 !important;
        border-left: 0 !important;
        border-right: 0 !important;
        font-size: 12px;
        line-height: 18px;
        padding: 5px 8px !important;
      }

      .proceed-order-endorsement-view .proceed-order-coverage-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .proceed-order-endorsement-view .proceed-order-result-tabs > .ant-tabs-nav {
        margin: 0;
        border-bottom: 1px solid #cbd1d8;
      }

      .proceed-order-endorsement-view .proceed-order-result-tabs.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
        margin: 0 2px 0 0;
        padding: 7px 12px;
        background: #f5f5f5;
        border: 1px solid #cbd1d8;
        border-radius: 6px 6px 0 0;
        color: #262626;
      }

      .proceed-order-endorsement-view .proceed-order-result-tabs.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab:hover {
        border-color: #8da9c2;
        color: #0b3f7d;
      }

      .proceed-order-endorsement-view .proceed-order-result-tabs.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
        background: #fff;
        border-color: #1677ff;
        border-bottom-color: #fff;
      }

      .proceed-order-endorsement-view .proceed-order-result-tabs > .ant-tabs-content-holder {
        border: 1px solid #cbd1d8;
        border-top: 0;
        padding: 8px;
      }

      .proceed-order-endorsement-view .ant-input,
      .proceed-order-endorsement-view .ant-input-affix-wrapper,
      .proceed-order-endorsement-view .ant-picker,
      .proceed-order-endorsement-view .ant-select:not(.ant-select-customize-input) .ant-select-selector {
        border: 1px solid #b8c4d1 !important;
        border-radius: 6px;
      }

      .proceed-order-endorsement-view .ant-input:hover,
      .proceed-order-endorsement-view .ant-input-affix-wrapper:hover,
      .proceed-order-endorsement-view .ant-picker:hover,
      .proceed-order-endorsement-view .ant-select:not(.ant-select-disabled):hover .ant-select-selector {
        border-color: #8da9c2 !important;
      }

      .proceed-order-endorsement-view .ant-input:focus,
      .proceed-order-endorsement-view .ant-input-focused,
      .proceed-order-endorsement-view .ant-input-affix-wrapper-focused,
      .proceed-order-endorsement-view .ant-picker-focused,
      .proceed-order-endorsement-view .ant-select-focused .ant-select-selector {
        border-color: #1677ff !important;
        box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2) !important;
      }

      .proceed-order-endorsement-view .ant-input:disabled,
      .proceed-order-endorsement-view .ant-input-affix-wrapper-disabled,
      .proceed-order-endorsement-view .ant-picker-disabled,
      .proceed-order-endorsement-view .ant-select-disabled .ant-select-selector {
        border-color: #b8c4d1 !important;
        background: #f5f5f5 !important;
        cursor: not-allowed;
        opacity: 1;
      }

      .proceed-order-endorsement-view .proceed-order-action-bar {
        background: transparent !important;
        border: 1px solid #e6ebf2 !important;
        border-radius: 6px;
        padding: 10px 12px !important;
      }

      .proceed-order-endorsement-view .proceed-order-action-bar .ant-btn:not(.ant-btn-primary) {
        border-color: #8f9aa7;
      }

      .proceed-order-endorsement-view .proceed-order-action-bar .ant-btn:disabled {
        border-color: #6f7b88;
        opacity: 1;
      }

      .proceed-order-endorsement-view .proceed-order-context-summary {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        margin-left: 8px;
        color: #262626;
        font-size: 13px;
        line-height: 18px;
        white-space: nowrap;
      }

      .proceed-order-endorsement-view .proceed-order-context-summary strong {
        font-weight: 600;
      }

      @media (max-width: 900px) {
        .proceed-order-endorsement-view .proceed-order-context-summary {
          flex-wrap: wrap;
          white-space: normal;
        }
      }

      .proceed-order-endorsement-view .proceed-order-summary-table .ant-descriptions-view {
        border: 1px solid #cbd1d8 !important;
      }

      .proceed-order-endorsement-view .proceed-order-summary-table .ant-descriptions-row > th,
      .proceed-order-endorsement-view .proceed-order-summary-table .ant-descriptions-row > td {
        border-color: #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .proceed-order-endorsement-view .proceed-order-summary-table .ant-descriptions-item-label {
        background: #bfbfbf !important;
        color: #262626;
        font-weight: 600;
      }

      .proceed-order-execution-mask {
        position: fixed;
        inset: 0;
        z-index: 1000000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.62);
        cursor: wait;
      }

      .proceed-order-execution-mask > div {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        background: #fff;
        border: 1px solid #91caff;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
        color: #1677ff;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  // ------------------------------------------------- coverage date calculation
  // §2.3: when a main/dependent relationship exists, the main coverage is the
  // configured row whose coverageCodeDep equals its own coverageCode. Products
  // without that relationship treat every coverage independently.
  const model = (() => {
    if (!policy || !coverages.length) return null;

    const cfgByCov = {};
    cfgRows.forEach((r) => { cfgByCov[r.coverageCode] = r; });

    const mainCfg = cfgRows.filter((r) => r.coverageCodeDep !== '' && r.coverageCodeDep === r.coverageCode);
    const dependentCfg = cfgRows.filter((r) => r.coverageCodeDep !== '' && r.coverageCodeDep !== r.coverageCode);
    // Several self-referencing rows mean that the product lists independent
    // coverages. It is only ambiguous when those rows coexist with dependents.
    if (mainCfg.length > 1 && dependentCfg.length > 0) {
      return { error: t('More than one main coverage is configured for this product: ') + mainCfg.map((r) => r.coverageCode).join(', ') };
    }
    const hasRelationship = mainCfg.length === 1 && dependentCfg.length > 0;
    const mainCode = hasRelationship ? mainCfg[0].coverageCode : '';

    const mainCov = hasRelationship
      ? coverages.find((c) => txt(c.code) === mainCode)
      : null;
    if (hasRelationship && !mainCov) {
      return { error: t('The configured main coverage (') + mainCode + t(') is not present on this policy.') };
    }

    const curMainStart = mainCov ? toPolicyLocalDate(mainCov.start) : null;
    const curMainEnd = mainCov ? toPolicyLocalDate(mainCov.end) : null;
    if (hasRelationship && (!curMainStart || !curMainEnd)) {
      return { error: t('The main coverage has no usable start/end dates.') };
    }

    const mainDateOffset = hasRelationship ? daysBetween(curMainStart, curMainEnd) : null;
    const newMainStart = toLocalDate(effectiveDate);
    const newMainEnd = newMainStart ? addDays(newMainStart, mainDateOffset) : null;

    const rows = coverages.map((c) => {
      const code = txt(c.code);
      const cfg = cfgByCov[code];
      const curStart = toPolicyLocalDate(c.start);
      const curEnd = toPolicyLocalDate(c.end);
      const dateOffset = daysBetween(curStart, curEnd);
      const duration = inclusiveDaysBetween(curStart, curEnd);
      const isMain = hasRelationship && code === mainCode;
      // Configured as taking part in the relationship, and not the main one.
      const isDependent = hasRelationship && !!cfg && cfg.coverageCodeDep !== '' && !isMain;

      let newStart = null, newEnd = null, note = '';
      if (!newMainStart) {
        note = t('awaiting effective date');
      } else if (!hasRelationship) {
        // Without a configured relationship, each coverage is its own main
        // coverage and keeps its current duration.
        newStart = newMainStart;
        newEnd = dateOffset == null ? null : addDays(newStart, dateOffset);
      } else if (isMain) {
        newStart = newMainStart;
        newEnd = newMainEnd;
      } else if (isDependent) {
        // Assumption 13: keep the CURRENT offset of this dependent relative to the
        // CURRENT main end, read from the policy. No contiguity rule is invented.
        const offset = daysBetween(curMainEnd, curStart);
        newStart = addDays(newMainEnd, offset);
        newEnd = dateOffset == null ? null : addDays(newStart, dateOffset);
      } else {
        newStart = curStart;
        newEnd = curEnd;
        note = cfg ? t('not part of the relationship') : t('not configured');
      }

      return {
        key: String(c.id),
        coverageId: c.id,
        code: code,
        name: c.name,
        premium: c.basePremium,
        curStart: curStart, curEnd: curEnd, duration: duration,
        newStart: newStart, newEnd: newEnd,
        newDuration: inclusiveDaysBetween(newStart, newEnd),
        isMain: isMain, isDependent: isDependent, note: note,
      };
    });

    return {
      mainCode: mainCode,
      mainRow: rows.find((r) => r.isMain),
      rows: rows,
      curBondStart: rows.reduce((a, r) => (r.curStart && (!a || r.curStart < a) ? r.curStart : a), null),
      curBondEnd: rows.reduce((a, r) => (r.curEnd && (!a || r.curEnd > a) ? r.curEnd : a), null),
      newBondStart: rows.reduce((a, r) => (r.newStart && (!a || r.newStart < a) ? r.newStart : a), null),
      newBondEnd: rows.reduce((a, r) => (r.newEnd && (!a || r.newEnd > a) ? r.newEnd : a), null),
    };
  })();

  // ---------------------------------------------------------------- validation
  const missing = [];
  if (!effectiveDate) missing.push(t('Change date'));
  const policyStartDate = policy ? toPolicyLocalDate(policy.start) : null;
  const effectiveDateValue = toLocalDate(effectiveDate);
  const policyStartKey = fmt(policyStartDate);
  const effectiveDateKey = fmt(effectiveDateValue);
  const effectiveDateError = policyStartKey && effectiveDateKey
    && effectiveDateKey <= policyStartKey
    ? t('The date cannot be equal to or earlier than the policy issue/start date.')
    : '';
  if (effectiveDateError) missing.push(effectiveDateError);
  if (!txt(observation)) missing.push(t('Endorsement observation'));
  const endorsementDataIsValid = missing.length === 0 && !!model && !model.error;
  const isValid = endorsementDataIsValid;
  const calculationKey = fmt(effectiveDateValue) + '|' + txt(observation);
  const calculationIsCurrent = !!calculation
    && calculation.key === calculationKey
    && !!calculation.quote;

  // ------------------------------------------------------ execution (stage 2)
  // §4 flow. Every step reports its own failure; nothing downstream runs after a
  // failed step, and success is announced only once BOTH the endorsement and the
  // insured-object sync have completed (§3.4).
  const pushStep = (name, ok, msg) => setSteps((prev) => prev.concat([{ name: name, ok: ok, msg: msg || '' }]));

  const reloadPolicy = async function () {
    const res = await exe('RepoLifePolicy', { operation: 'GET', filter: 'id = ' + policyId, include: ['Product', 'Coverages'] });
    if (res && res.ok) {
      const fresh = (res.outData || [])[0];
      if (fresh) { setPolicy(fresh); setCoverages(Array.isArray(fresh.Coverages) ? fresh.Coverages : []); }
    }
  };

  const loadPayPlanSnapshot = async function () {
    const response = await exe('RepoPayPlan', {
      operation: 'GET',
      filter: 'lifePolicyId=' + Number(policyId) + ' AND cancellationDate IS NULL',
      include: ['PayPlanDetail'],
      size: 0
    });
    if (!response || !response.ok) {
      throw new Error(translatedMessage(response && response.msg, 'The current payment plan could not be loaded.'));
    }
    return Array.isArray(response.outData) ? response.outData : [];
  };

  const getPayPlanFrequencyMonths = function () {
    const value = txt(
      policy && (policy.periodicity || policy.frequency || policy.paymentFrequency || policy.frecuencia)
    ).toLowerCase();
    if (['y', 'year', 'yearly', 'annual', 'anual', '12'].includes(value)) return 12;
    if (['s', 'semiannual', 'semi-annual', 'semestral', 'semestrally', '6'].includes(value)) return 6;
    if (['t', 'quarter', 'quarterly', 'trimestral', 'trimestralmente', '3'].includes(value)) return 3;
    if (['b', 'bimonthly', 'bi-monthly', 'bimensual', 'bimestral', '2'].includes(value)) return 2;
    return 1;
  };

  const recalculateAdjustablePayPlanDates = function (payPlan, firstDueDate, frequencyMonths) {
    const rows = Array.isArray(payPlan) ? payPlan : [];
    let pendingIndex = 0;
    return rows.map((installment) => {
      const row = { ...installment };
      const concept = txt(row.concept || row.Concept).toUpperCase();
      const dueDateKey = row.dueDate !== undefined ? 'dueDate' : (row.DueDate !== undefined ? 'DueDate' : null);
      const normalDueDateKey = row.normalDueDate !== undefined ? 'normalDueDate' : (row.NormalDueDate !== undefined ? 'NormalDueDate' : null);
      const paidValue = row.payed !== undefined
        ? Number(row.payed)
        : (row.paid !== undefined ? Number(row.paid) : 0);
      const installmentAmount = row.minimum !== undefined
        ? Number(row.minimum)
        : Number(row.expected);
      const isFullyPaid = Number.isFinite(paidValue)
        && Number.isFinite(installmentAmount)
        && paidValue >= installmentAmount - 0.005;
      const isCancellation = concept === 'CANCELLATION' || row.cancellationDate;

      // Only fully paid installments remain locked. Pending and partially paid
      // installments are rebuilt from the endorsement date; cancellation rows
      // keep their original dates.
      if (!dueDateKey || isFullyPaid || isCancellation || !firstDueDate || !Number.isFinite(frequencyMonths)) {
        return row;
      }

      const nextDueDate = addMonths(firstDueDate, pendingIndex * frequencyMonths);
      pendingIndex += 1;
      row[dueDateKey] = fmtAtNoon(nextDueDate);
      if (normalDueDateKey) {
        row[normalDueDateKey] = fmtAtNoon(nextDueDate);
      }
      return row;
    });
  };

  const getCoverageChangePayload = function (effectiveDateValue, oldPayPlan, newPayPlan) {
    const oldCoverages = coverages.map((coverage) => ({ ...coverage }));
    const newCoverages = coverages.map((coverage) => {
      const row = model.rows.filter((item) => item.code === txt(coverage.code))[0];
      const changedCoverage = { ...coverage };
      if (row && row.newStart && row.newEnd) {
        changedCoverage.start = fmtAtNoon(row.newStart);
        changedCoverage.end = fmtAtNoon(row.newEnd);
      }
      return changedCoverage;
    });

    return {
      policyId: policyId,
      jOldCoverages: JSON.stringify(oldCoverages),
      jNewCoverages: JSON.stringify(newCoverages),
      newStart: model.mainRow && model.mainRow.newStart ? fmtAtNoon(model.mainRow.newStart) : '',
      newEnd: model.mainRow && model.mainRow.newEnd ? fmtAtNoon(model.mainRow.newEnd) : '',
      effectiveDate: fmtAtNoon(effectiveDateValue),
      jOldPayPlan: Array.isArray(oldPayPlan) ? JSON.stringify(oldPayPlan) : null,
      jNewPayPlan: Array.isArray(newPayPlan) ? JSON.stringify(newPayPlan) : null,
      jEditedPayPlan: Array.isArray(newPayPlan) ? JSON.stringify(newPayPlan) : null,
      jAdditional: JSON.stringify({ endorsementType: 'PROCEEDORDER' })
    };
  };

  const persistChangePayPlan = async function (changeId, oldPayPlan, newPayPlan) {
    const oldPlanJson = JSON.stringify(Array.isArray(oldPayPlan) ? oldPayPlan : []).replace(/'/g, "''");
    const newPlanJson = JSON.stringify(Array.isArray(newPayPlan) ? newPayPlan : []).replace(/'/g, "''");
    const response = await exe('SetField', {
      entity: 'Change',
      entityId: Number(changeId),
      fieldValue: "jOldPayPlan='" + oldPlanJson + "',jNewPayPlan='" + newPlanJson + "',jEditedPayPlan='" + newPlanJson + "'",
      raw: true
    });
    if (!response || !response.ok) {
      throw new Error(translatedMessage(response && response.msg, 'The endorsement payment plan could not be saved.'));
    }
  };

  const updateExecutedPayPlanDates = async function (plannedPayPlan) {
    const response = await exe('RepoPayPlan', {
      operation: 'GET',
      filter: 'lifePolicyId=' + Number(policyId) + ' AND cancellationDate IS NULL',
      include: ['PayPlanDetail'],
      size: 0
    });
    if (!response || !response.ok) {
      throw new Error(translatedMessage(response && response.msg, 'The executed payment plan could not be loaded.'));
    }

    const currentRows = Array.isArray(response.outData) ? response.outData : [];
    const targetRows = Array.isArray(plannedPayPlan) ? plannedPayPlan : [];
    const findTarget = (current) => targetRows.find((target) => (
      Number(target && target.numberInYear) === Number(current && current.numberInYear)
      && Number(target && target.contractYear || 0) === Number(current && current.contractYear || 0)
    ));

    for (const current of currentRows) {
      const target = findTarget(current);
      const concept = txt(current && (current.concept || current.Concept)).toUpperCase();
      const paidValue = current && current.payed !== undefined
        ? Number(current.payed)
        : Number(current && current.paid || 0);
      const installmentAmount = current && current.minimum !== undefined
        ? Number(current.minimum)
        : Number(current && current.expected);
      const isFullyPaid = Number.isFinite(paidValue)
        && Number.isFinite(installmentAmount)
        && paidValue >= installmentAmount - 0.005;
      const targetDueDate = target && (target.dueDate || target.normalDueDate);

      if (!current || !Number(current.id) || !target || !targetDueDate || isFullyPaid || concept === 'CANCELLATION' || current.cancellationDate) {
        continue;
      }

      const dueDate = fmtAtNoon(targetDueDate).replace(/'/g, "''");
      const update = await exe('SetField', {
        entity: 'PayPlan',
        entityId: Number(current.id),
        fieldValue: "dueDate='" + dueDate + "',normalDueDate='" + dueDate + "'",
        raw: true
      });
      if (!update || !update.ok) {
        throw new Error(translatedMessage(update && update.msg, 'The executed payment plan dates could not be updated.'));
      }
    }
  };

  // This endorsement does not change premium, sum insured or reinsurance
  // percentages. We still version the current reinsurance so the new
  // ChangeCoverage has its own active snapshot, just like the surety view.
  const loadCurrentReinsuranceSnapshot = async function () {
    const cessionResponse = await exe('RepoCession', {
      operation: 'GET',
      filter: 'lifePolicyId=' + policyId + ' AND overwritten=0'
    });
    if (!cessionResponse || !cessionResponse.ok) {
      throw new Error(translatedMessage(cessionResponse && cessionResponse.msg, 'The current reinsurance could not be loaded.'));
    }

    const cessions = Array.isArray(cessionResponse.outData) ? cessionResponse.outData : [];
    if (!cessions.length) {
      throw new Error(t('The policy has no active reinsurance to version.'));
    }

    const cessionIds = cessions.map((cession) => Number(cession.id || 0)).filter((id) => id > 0);
    const partsResponse = cessionIds.length
      ? await exe('LoadEntities', {
        entity: 'CessionPart',
        filter: 'cessionId IN (' + cessionIds.join(',') + ')',
        noTracking: true
      })
      : { ok: true, outData: [] };
    if (!partsResponse || partsResponse.ok === false) {
      throw new Error(translatedMessage(partsResponse && partsResponse.msg, 'The current reinsurance acceptants could not be loaded.'));
    }

    const parts = Array.isArray(partsResponse.outData) ? partsResponse.outData : [];
    const cessionsById = {};
    cessions.forEach((cession) => { cessionsById[String(cession.id)] = cession; });
    const distribution = cessions.map((cession) => ({
      contractId: cession.contractId,
      lineId: cession.lineId,
      coverageId: cession.coverageId,
      coverageCode: cession.coverageCode,
      premiumMovement: 0,
      sumInsuredMovement: 0,
      premiumCedant: cession.premiumCedant,
      sumInsuredCedant: cession.sumInsuredCedant,
      premiumRe: cession.premiumRe,
      sumInsuredRe: cession.sumInsuredRe,
      commission: cession.comissionCedant,
      tax: cession.tax,
      proportionCed: cession.proportionCed,
      proportionRe: cession.proportionRe
    }));
    const participants = parts.map((part) => {
      const source = cessionsById[String(part.cessionId)] || {};
      return {
        contractId: source.contractId,
        lineId: part.lineId || source.lineId,
        coverageId: source.coverageId,
        coverageCode: source.coverageCode,
        cessionId: part.cessionId,
        contactId: part.contactId,
        brokerId: part.brokerId,
        split: part.split,
        sumInsured: part.sumInsured,
        premium: part.premium,
        commission: part.commission,
        tax: part.tax
      };
    });

    let coinsurance = [];
    const coinsuranceResponse = await exe('RepoCoCession', {
      operation: 'GET',
      filter: 'lifePolicyId=' + policyId + ' AND parentCoCession IS NULL AND overwritten=0',
      size: 0
    });
    if (coinsuranceResponse && coinsuranceResponse.ok) {
      const rows = Array.isArray(coinsuranceResponse.outData) ? coinsuranceResponse.outData : [];
      coinsurance = rows.map((cession) => ({
        id: Number(cession.id || 0),
        contactId: Number(cession.contactId || 0),
        percentage: cession.percentage,
        sumInsured: cession.sumInsured,
        premium: cession.premium,
        sumInsuredCeded: cession.sumInsuredCeded,
        premiumCeded: cession.premiumCeded,
        commission: cession.commission,
        tax: cession.tax
      }));
    }

    return {
      distribution: distribution,
      participants: participants,
      coinsurance: coinsurance,
      sourceCessionIds: cessionIds,
      sourceCoinsuranceIds: coinsurance.map((cession) => Number(cession.id || 0)).filter((id) => id > 0)
    };
  };

  const approveEndorsementWorkflow = async function (processId) {
    const procesoId = Number(processId || 0);
    if (!procesoId) {
      throw new Error(t('The endorsement workflow process could not be determined.'));
    }

    const result = await exe('GotoStep', {
      procesoId: procesoId,
      estado: 'APROVED'
    });
    const response = Array.isArray(result) ? (result[0] || {}) : result;
    if (!response || !response.ok) {
      throw new Error(translatedMessage(response && response.msg, 'The endorsement workflow could not be approved.'));
    }
    return response;
  };

  const onCalculate = async function () {
    setTouched(true);
    if (!isValid) {
      message.error(t('Required: ') + missing.join(', '));
      return;
    }

    setExecuting(true);
    setSteps([]);
    setResult(null);
    setChangeId(null);
    setCalculation(null);
    setPremiumValidationError('');

    try {
      const eff = fmt(toLocalDate(effectiveDate));
      const oldPayPlan = await loadPayPlanSnapshot();
      const newPayPlan = recalculateAdjustablePayPlanDates(
        oldPayPlan,
        toLocalDate(eff),
        getPayPlanFrequencyMonths()
      );
      const quote = await exe('ChangeCoverage', getCoverageChangePayload(eff, oldPayPlan, newPayPlan));

      if (!quote || !quote.ok || !quote.outData) {
        pushStep(t('Calculate the coverage change'), false, translatedMessage(quote && quote.msg, 'no response'));
        const quoteError = t('The endorsement could not be calculated. ') + translatedMessage(quote && quote.msg, '');
        setResult({ kind: 'error', msg: quoteError });
        message.error(quoteError);
        return;
      }

      const billingValidation = validateBilling(quote.outData, getCurrentPolicyBill(policy));
      if (!billingValidation.ok) {
        setPremiumValidationError(billingValidation.msg);
        pushStep(t('Billing invariant'), false, billingValidation.msg);
        setResult({
          kind: 'error',
          msg: t('The endorsement was blocked because the calculation changes the policy billing. ') + billingValidation.msg
        });
        message.warning(billingValidation.msg);
        return;
      }

      // CA6 / assumption 16: premium, tax and reinsurance must not move.
      let oldCovs = [], newCovs = [];
      try { oldCovs = JSON.parse(quote.outData.jOldCoverages || '[]'); } catch (e) { oldCovs = []; }
      try { newCovs = JSON.parse(quote.outData.jNewCoverages || '[]'); } catch (e) { newCovs = []; }
      const moved = [];
      newCovs.forEach((nc) => {
        const oc = oldCovs.filter((x) => txt(x.code) === txt(nc.code))[0];
        if (oc && Number(oc.premium) !== Number(nc.premium)) moved.push(txt(nc.code) + ': ' + oc.premium + ' → ' + nc.premium);
      });

      if (moved.length) {
        pushStep(t('Premium invariant (CA6)'), false, moved.join(' · '));
        const premiumError = t('Stopped: the term change would alter the premium, which CA6 forbids. Nothing was calculated. ') + moved.join(' · ');
        setResult({ kind: 'error', msg: premiumError });
        message.error(premiumError);
        return;
      }

      setCalculation({ key: calculationKey, quote: quote.outData, oldPayPlan: oldPayPlan, newPayPlan: newPayPlan });
      pushStep(t('Calculate the coverage change'), true, '');
      pushStep(t('Billing invariant'), true, t('Bill matches the current policy and BillDiff is zero.'));
      pushStep(t('Premium invariant (CA6)'), true, t('premium, sum insured and reinsurance unchanged'));
      setResult({ kind: 'calculated', msg: t('Calculation completed. Review the coverage changes before executing the endorsement.') });
      message.success(t('Calculation completed successfully.'));
    } catch (err) {
      const errorMessage = err && err.message ? err.message : String(err);
      pushStep(t('Calculate the term change'), false, translatedMessage(errorMessage, 'Unexpected error'));
      const calculationError = translatedMessage(errorMessage, 'The endorsement could not be calculated.');
      setResult({ kind: 'error', msg: calculationError });
      message.error(calculationError);
    } finally {
      setExecuting(false);
    }
  };

  const generateEndorsementDocument = async function (changeId) {
    const response = await exe('ExeChain', {
      chain: 'cmdGenertFormatoEmdoso',
      context: JSON.stringify({ changeId: Number(changeId) })
    });
    const data = response && response.outData;
    if (!response || !response.ok || (data && data.ok === false)) {
      throw new Error((data && data.msg) || (response && response.msg) || t('The endorsement document could not be generated.'));
    }
  };

  const runReinsuranceMode = async function (endorsementChangeId, mode) {
    const response = await exe('ExeChain', {
      chain: 'cmdApplyReaChangeCoverage',
      context: JSON.stringify({ changeId: Number(endorsementChangeId), mode: mode })
    });
    let result = response && response.outData;
    if (typeof result === 'string') {
      try { result = JSON.parse(result); } catch (error) { result = null; }
    }
    if (Array.isArray(result) && result.length === 1) result = result[0];
    if (!response || response.ok === false || !result || result.ok === false) {
      throw new Error((result && result.msg) || (response && response.msg) || t('The reinsurance operation failed.'));
    }
    return result;
  };

  const onExecute = async function () {
    setTouched(true);
    let currentProceedOrderEnabled = false;
    try {
      currentProceedOrderEnabled = await loadProceedOrderFlag();
    } catch (validationError) {
      message.error(translatedMessage(validationError && validationError.message, 'The insured-object data could not be validated.'));
      return;
    }
    setProceedOrderEnabled(currentProceedOrderEnabled);
    if (!currentProceedOrderEnabled) {
      setCalculation(null);
      message.error(t('The policy does not have the Proceed Order option selected. To execute this endorsement, select it on the policy first.'));
      return;
    }
    if (!endorsementDataIsValid) { message.error(t('Required: ') + missing.join(', ')); return; }
    if (!calculationIsCurrent) {
      message.warning(t('The endorsement data changed or has not been calculated. Calculate again before executing.'));
      return;
    }
    setExecuting(true);
    setProcessingEndorsement(true);
    setSteps([]);
    setResult(null);
    setChangeId(null);
    let keepProcessingMask = false;
    let reinsurancePrepared = false;
    let reinsuranceExecuted = false;
    let reinsuranceFinalized = false;
    let executionChangeId = 0;
    try {
      const eff = fmt(toLocalDate(effectiveDate));

      // --- generate the endorsement
      const addPayload = getCoverageChangePayload(
        eff,
        calculation.oldPayPlan,
        calculation.newPayPlan
      );
      const reinsuranceSnapshot = await loadCurrentReinsuranceSnapshot();
      addPayload.jAdditional = JSON.stringify({
        endorsementType: 'PROCEEDORDER',
        preserveActiveReinsurance: true,
        reinsuranceSnapshot: reinsuranceSnapshot
      });
      Object.keys(calculation.quote).forEach((k) => { if (addPayload[k] === undefined) addPayload[k] = calculation.quote[k]; });
      addPayload.operation = 'ADD';
      addPayload.note = txt(observation);
      addPayload.code = null;
      const created = await exe('ChangeCoverage', addPayload);
      if (!created || !created.ok || !created.outData || !created.outData.id) {
        pushStep(t('Generate the endorsement'), false, translatedMessage(created && created.msg, 'no endorsement was returned'));
        const createError = t('The endorsement was not generated. ') + translatedMessage(created && created.msg, '');
        setResult({ kind: 'error', msg: createError });
        message.error(createError);
        return;
      }
      const cid = created.outData.id;
      executionChangeId = Number(cid || 0);
      setChangeId(cid);
      pushStep(t('Generate the endorsement'), true, t('endorsement ') + cid);

      await persistChangePayPlan(cid, calculation.oldPayPlan, calculation.newPayPlan);
      pushStep(t('Save installment dates'), true, t('Pending installment dates were preserved in the endorsement.'));

      await approveEndorsementWorkflow(created.outData.processId);
      pushStep(t('Approve endorsement workflow'), true, '');

      // Fully version reinsurance before execution so accounting hooks read
      // the cancellation and the replacement distribution during execution.
      reinsurancePrepared = true;
      const prepared = await runReinsuranceMode(cid, 'PREPARE_EXECUTION');
      pushStep(t('Prepare reinsurance'), true, translatedMessage(prepared.msg, ''));

      // --- execute
      const executed = await exe('ExeChangeCoverage', { changeId: cid, exeNow: true, operation: 'EXECUTE', noTracking: true });
      if (!executed || !executed.ok) {
        if (reinsurancePrepared) {
          await runReinsuranceMode(cid, 'ROLLBACK');
          reinsurancePrepared = false;
        }
        pushStep(t('Execute the endorsement'), false, translatedMessage(executed && executed.msg, 'no response'));
        const executeError = t('The endorsement was generated but NOT executed. ') + translatedMessage(executed && executed.msg, '');
        setResult({ kind: 'error', msg: executeError });
        message.error(executeError);
        return;
      }
      // A future effective date makes the engine SCHEDULE the endorsement (status 2) instead
      // of applying it. That is not a failure, but it is not success either: the coverage
      // dates have not moved, so saying "applied" would be false.
      const execStatus = Number(executed.outData && executed.outData.status);
      if (execStatus === 2) {
        if (reinsurancePrepared && !reinsuranceExecuted) {
          await runReinsuranceMode(cid, 'ROLLBACK');
          reinsurancePrepared = false;
        }
        pushStep(t('Execute the endorsement'), true, t('scheduled for ') + eff + t(' — not applied yet'));
        await reloadPolicy();
        setResult({ kind: 'partial', msg: t('Endorsement ') + cid + t(' was generated and SCHEDULED for ') + eff + t('. The coverage dates have not changed yet, so the insured-object data was not synchronised.') });
        message.warning(t('The endorsement was scheduled, not applied.'));
        return;
      }
      reinsuranceExecuted = true;
      pushStep(t('Execute the endorsement'), true, translatedMessage(executed.msg, ''));

      // Finalize immediately after execution. No document, validity or insured
      // object operation should be able to leave the PREPARE rows active.
      let reinsurance;
      try {
        reinsurance = await runReinsuranceMode(cid, 'FINALIZE');
      } catch (reinsuranceException) {
        reinsurance = { ok: false, msg: String(reinsuranceException && reinsuranceException.message ? reinsuranceException.message : reinsuranceException) };
      }
      if (!reinsurance || !reinsurance.ok) {
        try {
          await runReinsuranceMode(cid, 'ROLLBACK');
          reinsurancePrepared = false;
        } catch (rollbackError) {
          // The final error below remains the primary execution result.
        }
        const reinsuranceError = t('The endorsement was applied, but the reinsurance could not be versioned. ') + translatedMessage(reinsurance && reinsurance.msg, 'no response');
        pushStep(t('Version reinsurance'), false, reinsuranceError);
        setResult({ kind: 'partial', msg: reinsuranceError });
        message.error(reinsuranceError);
        return;
      }
      reinsuranceFinalized = true;
      pushStep(t('Version reinsurance'), true, translatedMessage(reinsurance.msg, ''));

      try {
        await updateExecutedPayPlanDates(calculation.newPayPlan);
        pushStep(t('Update installment dates'), true, t('Pending installment dates were updated after execution.'));
      } catch (payPlanError) {
        const payPlanMessage = translatedMessage(payPlanError && payPlanError.message, 'The installment dates could not be updated after execution.');
        pushStep(t('Update installment dates'), false, payPlanMessage);
        setResult({ kind: 'partial', msg: t('The endorsement was applied, but the installment dates could not be updated. ') + payPlanMessage });
        message.error(t('The endorsement was applied, but the installment dates could not be updated.'));
        return;
      }

      try {
        await generateEndorsementDocument(cid);
      } catch (documentError) {
        pushStep(t('Generate the endorsement document'), false, String(documentError && documentError.message ? documentError.message : documentError));
        message.warning(t('The endorsement was applied, but its document could not be generated.') + ' ' + String(documentError && documentError.message ? documentError.message : documentError));
      }

      // ChangeCoverage updates the coverages but does not necessarily update the
      // LifePolicy validity. Persist the dates represented by the endorsement.
      const executedData = executed.outData && Array.isArray(executed.outData)
        ? executed.outData[0]
        : (executed.outData || {});
      const endorsementCoverages = executedData.jNewCoverages
        || created.outData.jNewCoverages
        || addPayload.jNewCoverages;
      let maxCoverageEnd = '';
      try {
        const coverageList = typeof endorsementCoverages === 'string'
          ? JSON.parse(endorsementCoverages)
          : endorsementCoverages;
        (Array.isArray(coverageList) ? coverageList : []).forEach((coverage) => {
          const end = toLocalDate(coverage.end);
          if (end && (!maxCoverageEnd || end > toLocalDate(maxCoverageEnd))) maxCoverageEnd = fmt(end);
        });
      } catch (errorCoverageDates) {
        maxCoverageEnd = '';
      }

      // Read the coverages after execution as the source of truth. The
      // endorsement response can contain a pre-execution JSON snapshot whose
      // date differs from the value finally persisted by ChangeCoverage.
      const persistedPolicyResponse = await exe('RepoLifePolicy', {
        operation: 'GET',
        filter: 'id = ' + policyId,
        include: ['Coverages']
      });
      const persistedPolicy = persistedPolicyResponse && persistedPolicyResponse.ok
        ? (Array.isArray(persistedPolicyResponse.outData)
          ? persistedPolicyResponse.outData[0]
          : persistedPolicyResponse.outData)
        : null;
      const persistedCoverages = persistedPolicy
        && (persistedPolicy.Coverages || persistedPolicy.coveragesList);
      if (Array.isArray(persistedCoverages)) {
        persistedCoverages.forEach((coverage) => {
          const end = toLocalDate(coverage.end);
          if (end && (!maxCoverageEnd || end > toLocalDate(maxCoverageEnd))) maxCoverageEnd = fmt(end);
        });
      }
      const policyStart = eff;
      const policyEnd = maxCoverageEnd || executedData.newEnd || created.outData.newEnd || addPayload.newEnd;
      if (!policyStart || !policyEnd) {
        const validityError = t('The endorsement was applied, but its new policy validity dates were not returned.');
        pushStep(t('Update policy validity'), false, validityError);
        setResult({ kind: 'partial', msg: validityError });
        message.error(validityError);
        return;
      }

      const policyUpdate = await exe('SetField', {
        entity: 'LifePolicy',
        entityId: policyId,
        fieldValue: "[start]='" + fmtAtNoon(policyStart) + "', [end]='" + fmtAtNoon(policyEnd) + "'",
        raw: true
      });
      if (!policyUpdate || !policyUpdate.ok) {
        const validityError = t('The endorsement was applied, but the policy validity could not be updated. ') + translatedMessage(policyUpdate && policyUpdate.msg, 'no response');
        pushStep(t('Update policy validity'), false, validityError);
        setResult({ kind: 'partial', msg: validityError });
        message.error(validityError);
        return;
      }
      pushStep(t('Update policy validity'), true, policyStart + ' -> ' + policyEnd);

      // --- synchronise the insured object (§3.3)
      const synced = await exe('ExeChain', { chain: 'cmdUpdateInsuredObjectData', context: JSON.stringify({ policyId: policyId }) });
      const syncData = synced && synced.outData;
      const syncOk = !!(synced && synced.ok && syncData && syncData.ok);
      const syncMsg = translatedMessage((syncData && syncData.msg) || (synced && synced.msg), 'no response');
      pushStep(t('Synchronise the insured object'), syncOk, syncMsg);

      await reloadPolicy();

      if (syncOk) {
        setResult({ kind: 'success', msg: t('Endorsement ') + cid + t(' applied and insured-object data synchronised.') });
        message.success(t('The endorsement was applied successfully.'));
        keepProcessingMask = true;
        setTimeout(() => { window.location.href = policyHref; }, 500);
      } else {
        // §3.4: never hide a partial failure behind a generic success message.
        setResult({ kind: 'partial', msg: t('PARTIAL: endorsement ') + cid + t(' WAS applied to the policy, but the insured-object synchronisation failed — ') + syncMsg });
        message.warning(t('Partial failure: the endorsement was applied but the insured-object data was not synchronised.'));
      }
    } catch (err) {
      if (reinsurancePrepared && !reinsuranceFinalized && executionChangeId) {
        try {
          await runReinsuranceMode(executionChangeId, 'ROLLBACK');
        } catch (rollbackError) {
          // Keep the original error visible; the temporary cleanup is best effort.
        }
      }
      const errorMessage = err && err.message ? err.message : String(err);
      pushStep(t('Unexpected error'), false, translatedMessage(errorMessage, 'Unexpected error'));
      const executionError = translatedMessage(errorMessage, 'Unexpected error');
      setResult({ kind: 'error', msg: executionError });
      message.error(executionError);
    } finally {
      setExecuting(false);
      if (!keepProcessingMask) setProcessingEndorsement(false);
    }
  };

  // ---------------------------------------------------------------- rendering
  const dateCell = (d, days) => (
    <span>{d ? fmt(d) : <span style={{ color: '#bfbfbf' }}>—</span>}{days != null && d ? <span style={{ color: '#8c8c8c' }}> ({days}d)</span> : null}</span>
  );
  const amountCell = (value, emptyValue) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return emptyValue || '—';
    const color = amount > 0 ? '#198754' : (amount < 0 ? '#d32f2f' : '#262626');
    return <span style={{ color: color }}>{amount.toFixed(2)}</span>;
  };

  const columns = [
    { title: t('Coverage ID'), dataIndex: 'coverageId', key: 'coverageId',
      render: (v, r) => <span>{v} {r.isMain ? <Tag color="blue">{t('Main')}</Tag> : (r.isDependent ? <Tag>{t('Dependent')}</Tag> : null)}</span> },
    { title: t('Code'), dataIndex: 'code', key: 'code' },
    { title: t('Coverage name'), dataIndex: 'name', key: 'name' },
    { title: t('Premium'), dataIndex: 'premium', key: 'premium', align: 'right', render: value => amountCell(value) },
    { title: t('Start date (before)'), key: 'cs', render: (v, r) => dateCell(r.curStart) },
    { title: t('End date (before)'), key: 'ce', render: (v, r) => dateCell(r.curEnd, r.duration) },
    { title: t('Start date (after)'), key: 'ns', render: (v, r) => dateCell(r.newStart) },
    { title: t('End date (after)'), key: 'ne', render: (v, r) => dateCell(r.newEnd, r.newDuration) },
    { title: t('Note'), dataIndex: 'note', key: 'note' },
  ];
  const policyHref = policyId > 0 ? '/#/lifePolicy/' + policyId : '/#/home';
  const payPlanPreviewRows = calculation && Array.isArray(calculation.oldPayPlan)
    ? calculation.oldPayPlan.map((oldInstallment, index) => {
      const newInstallment = calculation.newPayPlan && calculation.newPayPlan[index] || oldInstallment;
      const amount = oldInstallment && (oldInstallment.minimum !== undefined
        ? oldInstallment.minimum
        : oldInstallment.expected);
      return {
        key: String(oldInstallment && (oldInstallment.id || oldInstallment.numberInYear) || index),
        number: oldInstallment && (oldInstallment.numberInYear || oldInstallment.number || index + 1),
        amount: amount,
        paid: oldInstallment && (oldInstallment.payed !== undefined ? oldInstallment.payed : oldInstallment.paid),
        oldDueDate: oldInstallment && (oldInstallment.dueDate || oldInstallment.normalDueDate || oldInstallment.coveredUntil),
        newDueDate: newInstallment && (newInstallment.dueDate || newInstallment.normalDueDate || newInstallment.coveredUntil)
      };
    })
    : [];
  const payPlanPreviewColumns = [
    { title: t('Installment no.'), dataIndex: 'number', key: 'number', width: 120, align: 'center' },
    { title: t('Installment amount'), dataIndex: 'amount', key: 'amount', width: 150, align: 'right', render: value => amountCell(value) },
    { title: t('Paid'), dataIndex: 'paid', key: 'paid', width: 130, align: 'right', render: value => amountCell(value, '0.00') },
    { title: t('Previous due date'), dataIndex: 'oldDueDate', key: 'oldDueDate', width: 170, align: 'center', render: value => value ? <span style={{ color: '#d32f2f' }}>{fmt(toPolicyLocalDate(value))}</span> : '—' },
    { title: t('New due date'), dataIndex: 'newDueDate', key: 'newDueDate', width: 170, align: 'center', render: value => value ? <span style={{ color: '#1677ff' }}>{fmt(toPolicyLocalDate(value))}</span> : '—' }
  ];
  const accrualPremium = (() => {
    if (!model || !model.curBondStart || !model.curBondEnd || !effectiveDateValue) return null;
    const premiumCandidates = [
      policy && policy.anualPremium,
      policy && policy.annualPremium,
      policy && policy.grossValue,
      model.rows.reduce((total, row) => total + Number(row.premium || 0), 0)
    ];
    const premium = premiumCandidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value));
    if (!Number.isFinite(premium)) return null;

    const totalDays = Math.max(1, daysBetween(model.curBondStart, model.curBondEnd) || 0);
    const elapsedDays = Math.min(
      totalDays,
      Math.max(0, daysBetween(model.curBondStart, effectiveDateValue) || 0)
    );
    const earned = Math.max(0, premium) * (elapsedDays / totalDays);
    return { earned: earned, deferred: Math.max(0, premium) - earned };
  })();

  if (loading) return <Card title={t('Proceed Order endorsement')}><Skeleton active /></Card>;

  if (loadError) {
    return <Card title={t('Proceed Order endorsement')}>
      <Alert type="error" showIcon message={t('The view could not be loaded')} description={loadError} />
    </Card>;
  }

  return (
    <Card className="proceed-order-endorsement-view" title={<span>{t('Proceed Order endorsement')} {policy ? <Tag color="blue">{policy.code || ('#' + policy.id)}</Tag> : null}</span>}>
      {processingEndorsement ? (
        <div className="proceed-order-execution-mask" role="alert" aria-busy="true">
          <div><Spin size="small" /> {t('Processing endorsement, please wait...')}</div>
        </div>
      ) : null}
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message={t('Proceed Order endorsement')}
        description={t('Preview the resulting dates, then execute. Execution generates a ChangeCoverage endorsement, executes it and synchronises the insured-object data. Nothing is written until you press Execute.')} />

      {!proceedOrderEnabled ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('Proceed Order endorsement cannot be executed')}
          description={t('The policy does not have the Proceed Order option selected. To execute this endorsement, select it on the policy first.')}
        />
      ) : null}

      {premiumValidationError ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('Endorsement blocked: billing would change')}
          description={premiumValidationError}
        />
      ) : null}

      <div className="proceed-order-action-bar" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        marginBottom: 12,
        background: '#e6f4ff',
        border: '1px solid #91caff',
        borderRadius: 6
      }}>
        <Button
          type="primary"
          id="btnCalculate"
          loading={executing}
          disabled={!isValid || executing}
          onClick={onCalculate}
        >
          {t('Calculate')}
        </Button>
        <Popconfirm
          title={t('Execute endorsement?')}
          description={t('This action will create and execute the endorsement using the current calculation.')}
          okText={t('Yes')}
          cancelText={t('Cancel')}
          onConfirm={onExecute}
          disabled={!proceedOrderEnabled || !isValid || !calculationIsCurrent || executing}
        >
          <Button
            type="primary"
            id="btnExecute"
            loading={executing}
            disabled={!proceedOrderEnabled || !isValid || !calculationIsCurrent || executing}
          >
            {t('Execute endorsement')}
          </Button>
        </Popconfirm>
        {!proceedOrderEnabled ? (
          <span style={{ color: '#cf1322' }}>{t('Select the Proceed Order option on the policy before continuing.')}</span>
        ) : (!isValid ? (
          <span style={{ color: '#cf1322' }}>{t('Required: ') + missing.join(', ')}</span>
        ) : (!calculationIsCurrent ? (
          <span style={{ color: '#d48806' }}>
            {calculation
              ? t('The endorsement data changed. Calculate again before executing.')
            : t('Calculate before executing the endorsement.')}
          </span>
        ) : null))}
        <span className="proceed-order-context-summary">
          <span><strong>{t('Policy start date')}:</strong> {fmt(policyStartDate) || '—'}</span>
          <span><strong>{t('Policy')}:</strong> {policy ? (policy.code || policy.id) : '—'}</span>
          <span><strong>{t('Product')}:</strong> {policy
            ? ((policy.Product && policy.Product.name)
              || (policy.product && policy.product.name)
              || policy.productName
              || policy.productCode
              || '—')
            : '—'}</span>
        </span>
        <span style={{ flex: 1 }} />
        <Button type="default" href={policyHref}>
          {t('Back to policy')}
        </Button>
      </div>

      <Card
        size="small"
        type="inner"
        title={t('Endorsement data')}
        headStyle={{
          background: '#bfbfbf',
          borderBottom: '1px solid #cbd1d8',
          color: '#262626',
          fontWeight: 600
        }}
        bodyStyle={{ padding: 12 }}
        style={{
          marginBottom: 12,
          border: '1px solid #cbd1d8',
          borderRadius: 2
        }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t('Change date')} required
              validateStatus={touched && (!effectiveDate || effectiveDateError) ? 'error' : ''}
              help={touched && !effectiveDate
                ? t('This field is required.')
                : (touched && effectiveDateError ? effectiveDateError : '')}>
              <DatePicker style={{ width: '100%' }} id="effectiveDate" format="YYYY-MM-DD"
                value={effectiveDate} onChange={(v) => { setEffectiveDate(v); setTouched(true); }} />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item label={t('Endorsement observation')} required
              validateStatus={touched && !txt(observation) ? 'error' : ''}
              help={touched && !txt(observation) ? t('This field is required.') : ''}>
              <Input id="observation" value={observation} maxLength={500}
                onChange={(e) => { setObservation(e.target.value); setTouched(true); }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {model && model.error
        ? <Alert type="error" showIcon message={t('The coverage relationship could not be resolved')} description={model.error} />
        : null}

      {model && !model.error ? (
        <Tabs className="proceed-order-result-tabs" defaultActiveKey="coverage" type="card">
          <TabPane tab={t('Coverage comparison')} key="coverage">
            <Divider orientation="left">{t('Coverage comparison')}</Divider>
            <Table className="proceed-order-coverage-table" size="small" pagination={false} rowKey="key" dataSource={model.rows} columns={columns} />

            <Divider orientation="left">{t('Bond validity summary')}</Divider>
            <Descriptions className="proceed-order-summary-table" size="small" column={2} bordered>
              <Descriptions.Item label={t('Start before endorsement')}>{fmt(model.curBondStart)}</Descriptions.Item>
              <Descriptions.Item label={t('End before endorsement')}>{fmt(model.curBondEnd)}</Descriptions.Item>
              <Descriptions.Item label={t('Start after endorsement')}>{model.newBondStart ? fmt(model.newBondStart) : '—'}</Descriptions.Item>
              <Descriptions.Item label={t('End after endorsement')}>{model.newBondEnd ? fmt(model.newBondEnd) : '—'}</Descriptions.Item>
              <Descriptions.Item label={t('Main coverage (from configuration)')}>{model.mainCode}</Descriptions.Item>
              <Descriptions.Item label={t('Main coverage duration (days)')}>
                {model.mainRow ? model.mainRow.duration + ' → ' + (model.mainRow.newDuration == null ? '—' : model.mainRow.newDuration) : ''}
              </Descriptions.Item>
              <Descriptions.Item label={t('Earned premium')}>
                {accrualPremium ? amountCell(accrualPremium.earned, '—') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('Unearned premium')}>
                {accrualPremium ? amountCell(accrualPremium.deferred, '—') : '—'}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
          <TabPane tab={t('Installment preview')} key="installments">
            {!calculationIsCurrent ? (
              <Alert
                type="info"
                showIcon
                message={t('Calculate the endorsement to preview the installment dates.')}
                style={{ marginBottom: 12 }}
              />
            ) : null}
            <Table
              className="proceed-order-coverage-table"
              size="small"
              bordered
              pagination={false}
              rowKey="key"
              dataSource={calculationIsCurrent ? payPlanPreviewRows : []}
              columns={payPlanPreviewColumns}
              locale={{ emptyText: t('Calculate the endorsement to preview the installment dates.') }}
              scroll={{ x: 760 }}
            />
          </TabPane>
        </Tabs>
      ) : null}
    </Card>
  );
}
