/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/09/07
 * @name ProceedOrderEndorsement
 * @version 1.1
 * @purpose: Manage proceed-order endorsements by calculating coverage validity changes,
 * executing the ChangeCoverage endorsement, and synchronizing insured-object data.
 * AXX-1978 / GLOBUAT-261: coverage durations come from the insured-object tariff grid
 * (hiddenCobtar "Duración Días"); the endorsement shows no premium information.
 */
() => {
  const { Card, Row, Col, Form, DatePicker, Input, InputNumber, Button, Table, Descriptions, Alert, Tag, Skeleton, Space, Divider, Popconfirm, Spin, Tabs, Empty, Select, message } = A;
  const { TabPane } = Tabs;

  const EditableFormattedNumber = function (props) {
    const decimals = props.decimals === undefined ? 2 : props.decimals;
    const [draft, setDraft] = useState(props.value === null || props.value === undefined ? '' : String(props.value));
    const [focused, setFocused] = useState(false);
    const [valueOnFocus] = useState({ current: '' });

    useEffect(function () {
      if (!focused) setDraft(props.value === null || props.value === undefined ? '' : String(props.value));
    }, [props.value, focused]);

    const displayValue = focused || draft === '' ? draft : Number(draft).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return <Input size="small" inputMode="decimal" disabled={props.disabled} readOnly={props.readOnly}
      value={displayValue} style={{ textAlign: 'right', width: props.width || '100%' }}
      onFocus={function () { valueOnFocus.current = draft; setFocused(true); }}
      onChange={function (event) { setDraft(event.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.')); }}
      onBlur={function () {
        setFocused(false);
        const parsed = draft === '' || draft === '-' || draft === '.' ? 0 : Number(draft);
        const value = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
        const original = valueOnFocus.current === '' ? 0 : Number(valueOnFocus.current);
        if (value !== original) props.onCommit(value);
        setDraft(value.toFixed(decimals));
      }} />;
  };

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
  // AXX-1978: the insured-object tariff tab (hiddenCobtar) stores the configured
  // duration of every coverage. Those days are the source of truth for the view.
  const getTariffDaysByCoverage = (insuredObject) => {
    const raw = getInsuredObjectValue(insuredObject, 'hiddenCobtar');
    const text = Array.isArray(raw) ? raw[0] : raw;
    const rows = parseJson(text, []);
    const byCode = {};
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      if (!row || row.coverageCode === undefined || row.coverageCode === null) return;
      const days = Number(row['Duración Días']);
      byCode[txt(row.coverageCode)] = {
        days: Number.isFinite(days) && days > 0 ? Math.round(days) : null,
        start: toLocalDate(row['F. Inicial']),
        end: toLocalDate(row['F. Final'])
      };
    });
    return byCode;
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
  const [tariffDays, setTariffDays] = useState({});
  const [resultTab, setResultTab] = useState('coverage');
  const [reinsuranceSnapshot, setReinsuranceSnapshot] = useState(null);
  const [reinsuranceBaseline, setReinsuranceBaseline] = useState(null);
  const [reinsuranceLoading, setReinsuranceLoading] = useState(false);
  const [reinsuranceError, setReinsuranceError] = useState('');
  const [reinsuranceConfirmed, setReinsuranceConfirmed] = useState(false);
  const [reinsuranceDetailTab, setReinsuranceDetailTab] = useState('distribution');
  const [reinsuranceContractKey, setReinsuranceContractKey] = useState(null);
  const [reinsuranceLineKey, setReinsuranceLineKey] = useState(null);
  const [reinsuranceLines, setReinsuranceLines] = useState([]);
  const [reinsuranceCoverageConfig, setReinsuranceCoverageConfig] = useState({});
  const [reinsuranceContactNames, setReinsuranceContactNames] = useState({});
  const [reinsuranceContacts, setReinsuranceContacts] = useState([]);
  const [reinsuranceBrokers, setReinsuranceBrokers] = useState([]);
  const [reinsuranceReinsurersReady, setReinsuranceReinsurersReady] = useState(false);
  // The confirmation click can occur immediately after an input blur. Keep
  // the current grid draft synchronously available for that same event.
  let currentReinsuranceLines = reinsuranceLines;

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

  const isTechnicalPolicy = function (currentPolicy) {
    return ['96', '52'].indexOf(txt(currentPolicy && currentPolicy.lob)) >= 0;
  };
  const proceedOrderDefinitionCode = function (currentPolicy) {
    return isTechnicalPolicy(currentPolicy) ? 'DT_RAMO_TECNICO' : 'OBJFIANZA';
  };
  const proceedOrderFieldName = function (currentPolicy) {
    return isTechnicalPolicy(currentPolicy) ? 'ckOrdenProceder' : 'orden_de_proceder';
  };

  const loadProceedOrderInsuredObject = async function (currentPolicy) {
    const definitionCode = proceedOrderDefinitionCode(currentPolicy);
    const definitionResponse = await exe('RepoObjectDefinition', {
      operation: 'GET',
      filter: "code = '" + definitionCode + "'"
    });
    if (!definitionResponse || !definitionResponse.ok) {
      throw new Error(translatedMessage(definitionResponse && definitionResponse.msg, 'The insured-object definition could not be loaded.'));
    }
    const definition = (definitionResponse.outData || [])[0];
    if (!definition || !definition.id) {
      throw new Error(t('The ' + definitionCode + ' insured-object definition was not found.'));
    }

    const insuredResponse = await exe('RepoInsuredObject', {
      operation: 'GET',
      filter: 'lifePolicyId=' + policyId + ' AND objectDefinitionId=' + Number(definition.id),
      include: ['ObjectDefinition']
    });
    if (!insuredResponse || !insuredResponse.ok) {
      throw new Error(translatedMessage(insuredResponse && insuredResponse.msg, 'The insured-object data could not be loaded.'));
    }
    return (insuredResponse.outData || [])[0] || null;
  };

  const loadProceedOrderFlag = async function () {
    const insuredObject = await loadProceedOrderInsuredObject(policy);
    return isCheckedValue(getInsuredObjectValue(insuredObject, proceedOrderFieldName(policy)));
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

        const proceedOrderInsuredObject = await loadProceedOrderInsuredObject(pol);
        const proceedOrderField = proceedOrderFieldName(pol);
        const hasProceedOrder = isCheckedValue(getInsuredObjectValue(proceedOrderInsuredObject, proceedOrderField));
        const configuredDays = getTariffDaysByCoverage(proceedOrderInsuredObject);

        const cfgTableByLob = {
          '96': 'cfgCoberturaProductoReaTecnicos',
          '52': 'cfgCoberturaProductoReaRiesgosVarios',
          '81': 'cfgCoberturaProductoReaFianza',
          '82': 'cfgCoberturaProductoReaFianza',
          '83': 'cfgCoberturaProductoReaFianza',
          '84': 'cfgCoberturaProductoReaFianza'
        };
        const cfgTable = cfgTableByLob[txt(pol.lob)] || 'cfgCoberturaProductoRea';
        const cfgRes = await exe('GetFullTable', { table: cfgTable });
        if (!cfgRes || !cfgRes.ok) {
          throw new Error(translatedMessage(cfgRes && cfgRes.msg, 'The coverage configuration table could not be loaded.'));
        }
        const table = Array.isArray(cfgRes.outData) ? cfgRes.outData : [];
        if (table.length < 2) throw new Error(t(cfgTable + ' returned no configuration rows.'));

        const header = table[0].map((h) => txt(h));
        const idx = {};
        header.forEach((h, i) => { if (idx[h] === undefined) idx[h] = i; });
        const iLob = idx.lobCode, iProd = idx.productCode, iCov = idx.coverageCode;
        const iIsCoverage = idx.isCoverage === undefined ? header.indexOf('isCoverage') : idx.isCoverage;
        const iDep = header.indexOf('coverageCodeDep');
        const iParent = header.indexOf('coberturaPrincipal');
        if (iLob === undefined || iProd === undefined || iCov === undefined) {
          throw new Error(t(cfgTable + ' does not have the expected columns.'));
        }
        const rows = table.slice(1)
          .filter((r) => txt(r[iLob]) === txt(pol.lob) && txt(r[iProd]) === txt(pol.productCode))
          .map((r) => {
            const parent = iParent >= 0 ? txt(r[iParent]) : '';
            const dependency = iParent >= 0
              ? (parent && parent !== '-1' && parent.toUpperCase() !== 'NULL' ? parent : '')
              : (iDep >= 0 ? txt(r[iDep]) : '');
            return { lobCode: txt(r[iLob]), productCode: txt(r[iProd]), coverageCode: txt(r[iCov]), coverageCodeDep: dependency,
              isCoverage: iIsCoverage >= 0 ? isCheckedValue(r[iIsCoverage]) : true };
          });

        // In technical catalogs the parent column points from the dependent
        // coverage to the main one. Mark that referenced row as the main row;
        // coverageCodeDep on the technical row itself is not a parent marker.
        if (iParent >= 0) {
          const referencedParents = rows
            .filter((row) => row.coverageCodeDep !== '')
            .map((row) => row.coverageCodeDep);
          rows.forEach((row) => {
            if (referencedParents.indexOf(row.coverageCode) >= 0) row.coverageCodeDep = row.coverageCode;
          });
        }

        if (!cancelled) {
          setPolicy(pol);
          setCoverages(Array.isArray(pol.Coverages) ? pol.Coverages : []);
          setCfgRows(rows);
          const coverageConfig = {};
          rows.forEach((row) => { coverageConfig[String(row.coverageCode)] = { isCoverage: row.isCoverage !== false }; });
          setReinsuranceCoverageConfig(coverageConfig);
          setProceedOrderEnabled(hasProceedOrder);
          setTariffDays(configuredDays);
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

      .proceed-order-endorsement-view .proceed-order-reinsurance-panel .ant-table {
        border: 1px solid #cbd1d8;
        margin-top: 8px;
        width: 100%;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-panel .ant-table-container,
      .proceed-order-endorsement-view .proceed-order-reinsurance-panel .ant-table-content > table {
        width: 100%;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-panel .ant-input-number-input {
        text-align: right !important;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-panel .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-color: #cbd1d8 !important;
        color: #262626;
        font-size: 12px;
        padding: 5px 8px !important;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-panel .ant-table-tbody > tr > td {
        border-color: #d9e2ec !important;
        font-size: 12px;
        padding: 5px 8px !important;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-panel .proceed-order-reinsurance-selected > td {
        background: #d6e8ff !important;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-panel .proceed-order-reinsurance-total > td {
        background: #86b4ff !important;
        color: #0b1f3a;
        font-weight: 700;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-detail-tabs {
        margin-top: 8px;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-detail-tabs.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
        border: 1px solid #aebdca;
        border-bottom-color: #aebdca;
        border-radius: 5px 5px 0 0;
        margin-right: 2px;
        color: #263746;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-detail-tabs.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
        border-color: #1677ff;
        border-bottom-color: #fff;
        color: #0958d9;
        font-weight: 600;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-detail-tabs > .ant-tabs-content-holder {
        border: 1px solid #aebdca;
        border-top: 0;
        padding: 4px;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-detail-tabs .ant-table-content > table {
        table-layout: fixed;
      }

      .proceed-order-endorsement-view .proceed-order-reinsurance-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        margin-top: 8px;
        background: #e6f4ff;
        border: 1px solid #91caff;
        color: #334155;
        font-size: 12px;
      }

      .proceed-order-endorsement-view .proceed-order-folder-button {
        min-width: 24px;
        padding: 2px 4px;
        margin-left: 4px;
        color: #1677ff;
      }

      .proceed-order-endorsement-view .ant-input,
      .proceed-order-endorsement-view .ant-input-affix-wrapper,
      .proceed-order-endorsement-view .ant-picker,
      .proceed-order-endorsement-view .ant-input-number,
      .proceed-order-endorsement-view .ant-select:not(.ant-select-customize-input) .ant-select-selector {
        border: 1px solid #b8c4d1 !important;
        border-radius: 6px;
      }

      .proceed-order-endorsement-view .ant-input:hover,
      .proceed-order-endorsement-view .ant-input-affix-wrapper:hover,
      .proceed-order-endorsement-view .ant-picker:hover,
      .proceed-order-endorsement-view .ant-input-number:hover,
      .proceed-order-endorsement-view .ant-select:not(.ant-select-disabled):hover .ant-select-selector {
        border-color: #8da9c2 !important;
      }

      .proceed-order-endorsement-view .ant-input:focus,
      .proceed-order-endorsement-view .ant-input-focused,
      .proceed-order-endorsement-view .ant-input-affix-wrapper-focused,
      .proceed-order-endorsement-view .ant-picker-focused,
      .proceed-order-endorsement-view .ant-input-number-focused,
      .proceed-order-endorsement-view .ant-input-number:focus-within,
      .proceed-order-endorsement-view .ant-select-focused .ant-select-selector {
        border-color: #1677ff !important;
        box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2) !important;
      }

      .proceed-order-endorsement-view .ant-input:disabled,
      .proceed-order-endorsement-view .ant-input-affix-wrapper-disabled,
      .proceed-order-endorsement-view .ant-picker-disabled,
      .proceed-order-endorsement-view .ant-input-number-disabled,
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

    // AXX-1978: tariff duration means complete noon-to-noon periods:
    // end = start + days. Without a registered value the current calendar
    // span of the coverage is kept.
    const configuredDaysOf = (code) => {
      const item = tariffDays[txt(code)];
      return item && item.days ? item.days : null;
    };
    const endFromDays = (start, days, fallbackOffset) => {
      if (!start) return null;
      if (days) return addDays(start, days);
      return fallbackOffset == null ? null : addDays(start, fallbackOffset);
    };
    const mainTariff = hasRelationship ? tariffDays[mainCode] : null;
    const mainDateOffset = hasRelationship ? daysBetween(curMainStart, curMainEnd) : null;
    const newMainStart = toLocalDate(effectiveDate);
    const newMainEnd = newMainStart
      ? endFromDays(newMainStart, hasRelationship ? configuredDaysOf(mainCode) : null, mainDateOffset)
      : null;

    const rows = coverages.map((c) => {
      const code = txt(c.code);
      const cfg = cfgByCov[code];
      const curStart = toPolicyLocalDate(c.start);
      const curEnd = toPolicyLocalDate(c.end);
      const dateOffset = daysBetween(curStart, curEnd);
      const configuredDays = configuredDaysOf(code);
      const duration = configuredDays || inclusiveDaysBetween(curStart, curEnd);
      const isMain = hasRelationship && code === mainCode;
      // Configured as taking part in the relationship, and not the main one.
      const isDependent = hasRelationship && !!cfg && cfg.coverageCodeDep !== '' && !isMain;
      const isStandalonePrincipal = !isDependent && !isMain;

      let newStart = null, newEnd = null, note = '';
      if (!newMainStart) {
        note = t('awaiting effective date');
      } else if (!hasRelationship) {
        // Without a configured relationship, each coverage is its own main
        // coverage and keeps its current duration.
        newStart = newMainStart;
        newEnd = endFromDays(newStart, configuredDays, dateOffset);
      } else if (isMain) {
        newStart = newMainStart;
        newEnd = newMainEnd;
      } else if (isDependent) {
        // Assumption 13: keep the CURRENT offset of this dependent relative to the
        // CURRENT main end, read from the policy. No contiguity rule is invented.
        // AXX-1978: the offset is read from the tariff tab when both coverages
        // have their dates registered there.
        const depTariff = tariffDays[code];
        const offset = mainTariff && mainTariff.end && depTariff && depTariff.start
          ? daysBetween(mainTariff.end, depTariff.start)
          : daysBetween(curMainEnd, curStart);
        newStart = addDays(newMainEnd, offset);
        newEnd = endFromDays(newStart, configuredDays, dateOffset);
      } else {
        // A coverage outside the configured dependency chain is its own
        // principal coverage: move it to the effective date and preserve its
        // own duration, just like the configured main coverage.
        newStart = newMainStart;
        newEnd = endFromDays(newStart, configuredDays, dateOffset);
      }

      return {
        key: String(c.id),
        coverageId: c.id,
        code: code,
        name: c.name,
        curStart: curStart, curEnd: curEnd, duration: duration,
        configuredDays: configuredDays,
        newStart: newStart, newEnd: newEnd,
        newDuration: newStart && newEnd ? (configuredDays || inclusiveDaysBetween(newStart, newEnd)) : null,
        isMain: isMain || isStandalonePrincipal, isDependent: isDependent, note: note,
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

  const persistMaximumCoveragePolicyEnd = async function (changeId, jNewCoverages) {
    let coverages = [];
    try {
      coverages = typeof jNewCoverages === 'string' ? JSON.parse(jNewCoverages || '[]') : (jNewCoverages || []);
    } catch (error) {
      throw new Error(t('The endorsement coverages could not be read to save the policy end date.'));
    }
    const policyEnd = coverages.reduce(function (maximum, coverage) {
      const end = fmt(toLocalDate(coverage && coverage.end));
      return end && (!maximum || end > maximum) ? end : maximum;
    }, '');
    if (!policyEnd) throw new Error(t('The endorsement does not contain a valid coverage end date.'));

    const changeResponse = await exe('LoadEntity', {
      entity: 'Change', fields: 'id,jDetail', filter: 'id=' + Number(changeId), noTracking: true
    });
    const data = changeResponse && changeResponse.outData;
    const change = Array.isArray(data) ? (data[0] || {}) : (data || {});
    if (!changeResponse || !changeResponse.ok || !change.id) {
      throw new Error(translatedMessage(changeResponse && changeResponse.msg, 'The endorsement detail could not be loaded.'));
    }
    let detail = {};
    try { detail = JSON.parse(change.jDetail || '{}'); } catch (error) { detail = {}; }
    detail.policyEnd = policyEnd;
    const saved = await exe('SetField', {
      entity: 'Change', entityId: Number(changeId),
      fieldValue: "jDetail='" + JSON.stringify(detail).replace(/'/g, "''") + "'", raw: true
    });
    if (!saved || !saved.ok) {
      throw new Error(translatedMessage(saved && saved.msg, 'The endorsement policy end date could not be saved.'));
    }
    return policyEnd;
  };

  const persistReinsuranceSnapshot = async function (changeId, snapshot) {
    const json = JSON.stringify({
      endorsementType: 'PROCEEDORDER',
      reinsuranceSnapshot: snapshot
    }).replace(/'/g, "''");
    const response = await exe('SetField', {
      entity: 'Change',
      entityId: Number(changeId),
      fieldValue: "jAdditional='" + json + "'",
      raw: true
    });
    if (!response || !response.ok) {
      throw new Error(translatedMessage(response && response.msg, 'The endorsement reinsurance distribution could not be saved.'));
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
      id: cession.id,
      cessionId: cession.id,
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
      include: ['Contact'],
      size: 0
    });
    if (coinsuranceResponse && coinsuranceResponse.ok) {
      const rows = Array.isArray(coinsuranceResponse.outData) ? coinsuranceResponse.outData : [];
      coinsurance = rows.map((cession) => ({
        id: Number(cession.id || 0),
        contactId: Number(cession.contactId || 0),
        contactName: cession.Contact && (cession.Contact.name || cession.Contact.description),
        leader: Number(cession.leader) === 1 || cession.leader === true,
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

  const reinsuranceLineOrder = ['No Técnica', 'Retención', 'Cuota Parte', 'Excedente 1', 'Facultativo', 'Fronting', 'Coaseguro'];
  const reinsuranceNumber = (value) => {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
  };
  const moneyValue = (value) => Number(reinsuranceNumber(value).toFixed(2));
  const finalCoinsuranceBase = function () {
    let quotedCoverages = [];
    try { quotedCoverages = JSON.parse((calculation && calculation.quote && calculation.quote.jNewCoverages) || '[]'); } catch (error) { quotedCoverages = []; }
    const source = quotedCoverages.length ? quotedCoverages : coverages;
    return source.reduce((total, coverage) => {
      const code = String(coverage.code || coverage.coverageCode || '');
      const configuredForSum = !reinsuranceCoverageConfig[code] || reinsuranceCoverageConfig[code].isCoverage !== false;
      if (configuredForSum) total.sum += reinsuranceNumber(coverage.limit || coverage.sumInsured);
      total.premium += reinsuranceNumber(coverage.premium || coverage.newPremium);
      return total;
    }, { sum: 0, premium: 0 });
  };
  const coinsurancePercentage = function (snapshot) {
    return Math.max(0, Math.min(100, (snapshot && snapshot.coinsurance || []).reduce((sum, row) => sum + reinsuranceNumber(row.percentage), 0)));
  };
  const coinsuranceRate = function (snapshot, field) {
    const totals = (snapshot && snapshot.coinsurance || []).reduce((result, row) => {
      result.premium += reinsuranceNumber(row.premiumCeded || row.premium);
      result.value += reinsuranceNumber(row[field]);
      return result;
    }, { premium: 0, value: 0 });
    return totals.premium ? totals.value / totals.premium : 0;
  };
  const buildCoinsuranceRows = function (snapshot) {
    const base = finalCoinsuranceBase();
    const rows = (snapshot && snapshot.coinsurance || []).map((cession, index) => {
      const percentage = reinsuranceNumber(cession.percentage);
      const premium = moneyValue(base.premium * percentage / 100);
      const sourcePremium = reinsuranceNumber(cession.premiumCeded || cession.premium);
      return {
        key: cession.id || String(cession.contactId || '') + '-' + String(index),
        id: Number(cession.id || 0),
        contactId: Number(cession.contactId || 0),
        name: cession.contactName || reinsuranceContactNames[String(cession.contactId)] || String(cession.contactId || '-'),
        leader: cession.leader === true || Number(cession.leader) === 1,
        percentage: percentage,
        sumInsured: moneyValue(base.sum * percentage / 100),
        premium: premium,
        sumInsuredCeded: moneyValue(base.sum * percentage / 100),
        premiumCeded: premium,
        commission: sourcePremium ? moneyValue(premium * reinsuranceNumber(cession.commission) / sourcePremium) : 0,
        tax: sourcePremium ? moneyValue(premium * reinsuranceNumber(cession.tax) / sourcePremium) : 0
      };
    });
    const placedPercentage = rows.reduce((sum, row) => sum + row.percentage, 0);
    const companyPercentage = Math.max(0, 100 - placedPercentage);
    rows.push({
      key: 'company', isCompany: true, name: t('Company'), leader: Number(policy && policy.coinsurance) === 1,
      percentage: companyPercentage,
      sumInsured: moneyValue(base.sum * companyPercentage / 100),
      premium: moneyValue(base.premium * companyPercentage / 100),
      sumInsuredCeded: moneyValue(base.sum * companyPercentage / 100),
      premiumCeded: moneyValue(base.premium * companyPercentage / 100),
      commission: 0, tax: 0
    });
    return rows;
  };
  const applyCoinsuranceToSnapshot = function (snapshot) {
    if (!snapshot) return snapshot;
    const next = JSON.parse(JSON.stringify(snapshot));
    const percentage = coinsurancePercentage(next);
    const reinsuranceFactor = (100 - percentage) / 100;
    if (!next._coinsuranceReinsurancePrepared) {
      const grossByContract = {};
      (next.distribution || []).forEach((row) => {
        const key = String(row.contractId || '');
        if (!grossByContract[key]) grossByContract[key] = { sum: 0, premium: 0 };
        grossByContract[key].sum += reinsuranceNumber(row.sumInsuredCedant) + reinsuranceNumber(row.sumInsuredRe);
        grossByContract[key].premium += reinsuranceNumber(row.premiumCedant) + reinsuranceNumber(row.premiumRe);
        ['sumInsuredCedant', 'sumInsuredRe', 'premiumCedant', 'premiumRe', 'commission', 'tax'].forEach((field) => {
          row[field] = moneyValue(reinsuranceNumber(row[field]) * reinsuranceFactor);
        });
      });
      next._coinsuranceGrossByContract = grossByContract;
      next._coinsuranceReinsurancePrepared = true;
    }
    next.coinsurance = buildCoinsuranceRows(next).filter((row) => !row.isCompany).map((row) => ({
      id: row.id, contactId: row.contactId, contactName: row.name, leader: row.leader,
      percentage: row.percentage, sumInsured: row.sumInsured, premium: row.premium,
      sumInsuredCeded: row.sumInsuredCeded, premiumCeded: row.premiumCeded,
      commission: row.commission, tax: row.tax
    }));
    return next;
  };
  const buildReinsuranceLines = function (snapshot) {
    const rows = snapshot && Array.isArray(snapshot.distribution) ? snapshot.distribution : [];
    const groups = {};
    rows.forEach((row) => {
      const key = String(row.contractId || '') + '|' + String(row.lineId || '');
      if (!groups[key]) groups[key] = {
        key: key,
        contractId: row.contractId,
        lineId: row.lineId || '',
        sum: 0,
        premium: 0,
        sumCedant: 0,
        sumRe: 0,
        premiumCedant: 0,
        premiumRe: 0,
        commission: 0,
        tax: 0,
        rows: []
      };
      const line = groups[key];
      line.rows.push(row);
      const configuredForSum = !reinsuranceCoverageConfig[String(row.coverageCode)]
        || reinsuranceCoverageConfig[String(row.coverageCode)].isCoverage !== false;
      if (configuredForSum) {
        line.sumCedant += Number(row.sumInsuredCedant || 0);
        line.sumRe += Number(row.sumInsuredRe || 0);
      }
      line.premiumCedant += Number(row.premiumCedant || 0);
      line.premiumRe += Number(row.premiumRe || 0);
      line.sum = line.sumCedant + line.sumRe;
      line.premium = line.premiumCedant + line.premiumRe;
      line.commission += Number(row.commission || 0);
      line.tax += Number(row.tax || 0);
    });
    const contracts = {};
    Object.keys(groups).forEach((key) => {
      const line = groups[key];
      const contractKey = String(line.contractId || '');
      if (!contracts[contractKey]) contracts[contractKey] = { contractId: line.contractId, lines: [] };
      contracts[contractKey].lines.push(line);
    });
    const result = [];
    Object.keys(contracts).forEach((contractKey) => {
      const contract = contracts[contractKey];
      const retained = {
        key: contractKey + '|Retención',
        contractId: contract.contractId,
        lineId: 'Retención',
        sum: 0,
        premium: 0,
        sumCedant: 0,
        sumRe: 0,
        premiumCedant: 0,
        premiumRe: 0,
        commission: 0,
        tax: 0,
        rows: []
      };
      contract.lines.forEach((line) => {
        retained.sum += Number(line.sumCedant || 0);
        retained.premium += Number(line.premiumCedant || 0);
        retained.sumCedant += Number(line.sumCedant || 0);
        retained.premiumCedant += Number(line.premiumCedant || 0);
        retained.rows = retained.rows.concat(line.rows || []);
        line.sum = Number(line.sumRe || 0);
        line.premium = Number(line.premiumRe || 0);
        line.sumCedant = 0;
        line.premiumCedant = 0;
        line.sumRe = line.sum;
        line.premiumRe = line.premium;
      });
      contract.lines = contract.lines.filter((line) => String(line.lineId) !== 'Retención');
      contract.lines.push(retained);
      const coinsurancePct = coinsurancePercentage(snapshot);
      const reinsuranceFactor = (100 - coinsurancePct) / 100;
      const remainingContractSum = contract.lines.reduce((sum, line) => sum + Number(line.sum || 0), 0);
      const remainingContractPremium = contract.lines.reduce((sum, line) => sum + Number(line.premium || 0), 0);
      const storedGross = snapshot && snapshot._coinsuranceGrossByContract && snapshot._coinsuranceGrossByContract[String(contract.contractId || '')];
      const grossContractSum = storedGross ? Number(storedGross.sum || 0) : (reinsuranceFactor ? remainingContractSum / reinsuranceFactor : remainingContractSum);
      const grossContractPremium = storedGross ? Number(storedGross.premium || 0) : (reinsuranceFactor ? remainingContractPremium / reinsuranceFactor : remainingContractPremium);
      // Reinsurance only receives the portion not assigned to coinsurance.
      if (!snapshot || !snapshot._coinsuranceReinsurancePrepared) {
        contract.lines.forEach((line) => {
          ['sum', 'premium', 'sumCedant', 'sumRe', 'premiumCedant', 'premiumRe', 'commission', 'tax'].forEach((field) => {
            line[field] = moneyValue(Number(line[field] || 0) * reinsuranceFactor);
          });
        });
      }
      const existing = {};
      contract.lines.forEach((line) => { existing[String(line.lineId)] = line; });
      reinsuranceLineOrder.forEach((lineId) => {
        if (!existing[lineId]) {
          const empty = {
            key: contractKey + '|' + lineId,
            contractId: contract.contractId,
            lineId: lineId,
            sum: 0,
            premium: 0,
            sumCedant: 0,
            sumRe: 0,
            premiumCedant: 0,
            premiumRe: 0,
            commission: 0,
            tax: 0,
            rows: [],
            percentage: 0,
            commissionPercentage: 0,
            taxPercentage: 0
          };
          contract.lines.push(empty);
        }
      });
      const coinsuranceLine = contract.lines.find((line) => String(line.lineId) === 'Coaseguro');
      if (coinsuranceLine) {
        const coinsurancePremium = moneyValue(grossContractPremium * coinsurancePct / 100);
        coinsuranceLine.sum = moneyValue(grossContractSum * coinsurancePct / 100);
        coinsuranceLine.premium = coinsurancePremium;
        coinsuranceLine.commission = moneyValue(coinsurancePremium * coinsuranceRate(snapshot, 'commission'));
        coinsuranceLine.tax = moneyValue(coinsurancePremium * coinsuranceRate(snapshot, 'tax'));
        coinsuranceLine.percentage = coinsurancePct;
        coinsuranceLine.isCoinsurance = true;
      }
      const contractSum = contract.lines.filter((line) => !line.isCoinsurance).reduce((sum, line) => sum + Number(line.sum || 0), 0);
      const contractPremium = contract.lines.filter((line) => !line.isCoinsurance).reduce((sum, line) => sum + Number(line.premium || 0), 0);
      contract.lines.forEach((line) => {
        line.percentage = line.isCoinsurance ? coinsurancePct : (contractSum ? (line.sum / contractSum) * 100 : 0);
        line.commissionPercentage = line.premiumRe ? (line.commission / line.premiumRe) * 100 : 0;
        line.taxPercentage = line.premiumRe ? (line.tax / line.premiumRe) * 100 : 0;
        line.contractSum = contractSum;
        line.contractPremium = contractPremium;
      });
      contract.lines.sort((left, right) => {
        const leftIndex = reinsuranceLineOrder.indexOf(String(left.lineId));
        const rightIndex = reinsuranceLineOrder.indexOf(String(right.lineId));
        return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
      });
      result.push.apply(result, contract.lines);
    });
    return result;
  };

  const loadReinsuranceForView = async function (forceReload) {
    if (reinsuranceLoading || (!forceReload && reinsuranceSnapshot)) return reinsuranceSnapshot;
    setReinsuranceLoading(true);
    setReinsuranceError('');
    try {
      const snapshot = await loadCurrentReinsuranceSnapshot();
      const contactIds = [];
      (snapshot.participants || []).forEach((participant) => {
        if (participant.contactId) contactIds.push(Number(participant.contactId));
        if (participant.brokerId) contactIds.push(Number(participant.brokerId));
      });
      (snapshot.coinsurance || []).forEach((cession) => {
        if (cession.contactId) contactIds.push(Number(cession.contactId));
      });
      const uniqueIds = contactIds.filter((id, index) => id > 0 && contactIds.indexOf(id) === index);
      if (uniqueIds.length) {
        const contacts = await exe('LoadEntities', {
          entity: 'Contact',
          fields: 'id, name, middlename, surname1, surname2, isPerson',
          filter: 'id in (' + uniqueIds.join(',') + ')'
        });
        const directory = {};
        ((contacts && contacts.outData) || []).forEach((contact) => {
          const name = contact.isPerson
            ? [contact.name, contact.middlename || contact.middleName, contact.surname1, contact.surname2].filter(Boolean).join(' ').trim()
            : String(contact.surname2 || contact.name || '').trim();
          if (name) directory[String(contact.id)] = name;
        });
        setReinsuranceContactNames(directory);
      }
      const [brokerResponse, reinsurerResponse] = await Promise.all([
        exe('LoadEntities', {
          entity: 'Contact',
          fields: 'id, name, middlename, surname1, surname2, isPerson',
          filter: "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'REI')"
        }).catch(() => ({ outData: [] })),
        exe('LoadEntities', {
          entity: 'Contact',
          fields: 'id, name, middlename, surname1, surname2, isPerson',
          filter: "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'RIN')"
        }).catch(() => ({ outData: [] }))
      ]);
      const contactLabel = (item) => item.isPerson
        ? [item.name, item.middlename || item.middleName, item.surname1, item.surname2].filter(Boolean).join(' ').trim()
        : String(item.surname2 || item.name || '').trim();
      setReinsuranceBrokers(((brokerResponse && brokerResponse.outData) || [])
        .map((item) => ({ id: Number(item.id), name: contactLabel(item) }))
        .filter((item) => item.id > 0 && item.name));
      setReinsuranceContacts(((reinsurerResponse && reinsurerResponse.outData) || [])
        .map((item) => ({ id: Number(item.id), name: contactLabel(item) }))
        .filter((item) => item.id > 0 && item.name));
      const recalculatedSnapshot = recalculateReinsuranceParticipants(applyCoinsuranceToSnapshot(snapshot));
      setReinsuranceSnapshot(recalculatedSnapshot);
      setReinsuranceBaseline(JSON.parse(JSON.stringify(recalculatedSnapshot)));
      currentReinsuranceLines = buildReinsuranceLines(recalculatedSnapshot);
      setReinsuranceLines(currentReinsuranceLines);
      const first = (recalculatedSnapshot.distribution || [])[0];
      setReinsuranceContractKey(first ? String(first.contractId) : null);
      setReinsuranceLineKey(first ? String(first.contractId) + '|' + String(first.lineId || '') : null);
      setReinsuranceReinsurersReady(false);
      return recalculatedSnapshot;
    } catch (error) {
      setReinsuranceError(translatedMessage(error && error.message, 'The current reinsurance could not be loaded.'));
      setReinsuranceSnapshot(null);
      setReinsuranceBaseline(null);
      currentReinsuranceLines = [];
      setReinsuranceLines(currentReinsuranceLines);
      setReinsuranceConfirmed(false);
      return null;
    } finally {
      setReinsuranceLoading(false);
    }
  };

  const reinsuranceMoney = (value) => {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  };
  const reinsuranceAmountFormatter = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const number = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(number) ? number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
  };
  const reinsuranceAmountParser = (value) => String(value || '').replace(/,/g, '');

  const reinsuranceRows = reinsuranceSnapshot && Array.isArray(reinsuranceSnapshot.distribution)
    ? reinsuranceSnapshot.distribution
    : [];
  const reinsuranceGroups = reinsuranceRows.reduce((groups, row) => {
    const key = String(row.contractId || '');
    if (!groups[key]) groups[key] = {
      key: key,
      policyId: policyId,
      contractId: row.contractId,
      lineId: row.lineId,
      rows: [],
      sum: 0,
      cededSum: 0,
      premium: 0,
      cededPremium: 0,
      retainedSum: 0,
      retainedPremium: 0,
      commission: 0,
      tax: 0
    };
    const group = groups[key];
    group.rows.push(row);
    const configuredForSum = !reinsuranceCoverageConfig[String(row.coverageCode)]
      || reinsuranceCoverageConfig[String(row.coverageCode)].isCoverage !== false;
    if (configuredForSum) {
      group.sum += Number(row.sumInsuredCedant || 0) + Number(row.sumInsuredRe || 0);
      group.cededSum += Number(row.sumInsuredRe || 0);
      group.retainedSum += Number(row.sumInsuredCedant || 0);
    }
    group.premium += Number(row.premiumCedant || 0) + Number(row.premiumRe || 0);
    group.cededPremium += Number(row.premiumRe || 0);
    group.retainedPremium += Number(row.premiumCedant || 0);
    group.commission += Number(row.commission || 0);
    group.tax += Number(row.tax || 0);
    return groups;
  }, {});
  Object.keys(reinsuranceGroups).forEach((key) => {
    const group = reinsuranceGroups[key];
    const gross = reinsuranceSnapshot && reinsuranceSnapshot._coinsuranceGrossByContract
      && reinsuranceSnapshot._coinsuranceGrossByContract[String(group.contractId || '')];
    const percentage = coinsurancePercentage(reinsuranceSnapshot);
    if (gross) {
      const coinsurancePremium = Number(gross.premium || 0) * percentage / 100;
      group.sum = Number(gross.sum || 0);
      group.premium = Number(gross.premium || 0);
      group.commission += moneyValue(coinsurancePremium * coinsuranceRate(reinsuranceSnapshot, 'commission'));
      group.tax += moneyValue(coinsurancePremium * coinsuranceRate(reinsuranceSnapshot, 'tax'));
    }
  });
  const reinsuranceContractRows = Object.keys(reinsuranceGroups).map((key) => reinsuranceGroups[key]);
  const selectedReinsuranceLines = reinsuranceLines.filter((line) => String(line.contractId) === String(reinsuranceContractKey || '').split('|')[0]);
  const updateReinsuranceLine = function (lineKey, field, value) {
    const amount = Number(value || 0);
    const nextLines = currentReinsuranceLines.map((line) => {
      if (line.key !== lineKey) return line;
      if (String(line.lineId) === 'Coaseguro') return line;
      const next = Object.assign({}, line);
      if (field === 'percentage') {
        const percentage = Math.max(0, amount);
        next.percentage = percentage;
        next.sum = Number((Number(line.contractSum || 0) * percentage / 100).toFixed(2));
        next.premium = Number((Number(line.contractPremium || 0) * percentage / 100).toFixed(2));
        const cedantLine = String(line.lineId).toUpperCase() === 'RETENCIÓN' || String(line.lineId).toUpperCase() === 'NO TÉCNICA';
        next.sumCedant = cedantLine ? next.sum : 0;
        next.sumRe = cedantLine ? 0 : next.sum;
        next.premiumCedant = cedantLine ? next.premium : 0;
        next.premiumRe = cedantLine ? 0 : next.premium;
        next.commission = Number((next.premiumRe * Number(line.commissionPercentage || 0) / 100).toFixed(2));
        next.tax = Number((next.premiumRe * Number(line.taxPercentage || 0) / 100).toFixed(2));
      } else {
        next[field] = Math.max(0, amount);
        if (field === 'sum') {
          next.sumCedant = Number(next.sumCedant || 0);
          next.sumRe = Number(next.sumRe || 0);
        }
        if (field === 'premium') {
          next.premiumCedant = Number(next.premiumCedant || 0);
          next.premiumRe = Number(next.premiumRe || 0);
        }
      }
      if (field === 'commissionPercentage') next.commission = Number((next.premiumRe * Math.max(0, amount) / 100).toFixed(2));
      if (field === 'taxPercentage') next.tax = Number((next.premiumRe * Math.max(0, amount) / 100).toFixed(2));
      next.percentage = Number(next.contractSum || 0) ? Number((next.sum / next.contractSum * 100).toFixed(4)) : 0;
      if (field !== 'commission' && field !== 'percentage' && field !== 'premium') next.commissionPercentage = Number(next.premiumRe || 0) ? Number((next.commission / next.premiumRe * 100).toFixed(4)) : 0;
      if (field !== 'tax' && field !== 'percentage' && field !== 'premium') next.taxPercentage = Number(next.premiumRe || 0) ? Number((next.tax / next.premiumRe * 100).toFixed(4)) : 0;
      return next;
    });
    currentReinsuranceLines = nextLines;
    setReinsuranceLines(nextLines);
    setReinsuranceConfirmed(false);
  };

  const buildEditedReinsuranceSnapshot = function () {
    if (!reinsuranceSnapshot) return null;
    const next = JSON.parse(JSON.stringify(reinsuranceSnapshot));
    const lines = currentReinsuranceLines;
    (next.distribution || []).forEach((row) => {
      const configuredForSum = !reinsuranceCoverageConfig[String(row.coverageCode)]
        || reinsuranceCoverageConfig[String(row.coverageCode)].isCoverage !== false;
      const cededLine = lines.find((item) => String(item.contractId) === String(row.contractId) && String(item.lineId || '') === String(row.lineId || ''));
      const retentionLine = lines.find((item) => String(item.contractId) === String(row.contractId) && String(item.lineId) === 'Retención');
      const sourceRows = cededLine && cededLine.rows && cededLine.rows.length ? cededLine.rows : [];
      if (!sourceRows.length) return;
      const sourceRetentionSum = sourceRows.reduce((sum, item) => {
        const configuredForSum = !reinsuranceCoverageConfig[String(item.coverageCode)]
          || reinsuranceCoverageConfig[String(item.coverageCode)].isCoverage !== false;
        return sum + (configuredForSum ? Number(item.sumInsuredCedant || 0) : 0);
      }, 0);
      const sourceCededSum = sourceRows.reduce((sum, item) => {
        const configuredForSum = !reinsuranceCoverageConfig[String(item.coverageCode)]
          || reinsuranceCoverageConfig[String(item.coverageCode)].isCoverage !== false;
        return sum + (configuredForSum ? Number(item.sumInsuredRe || 0) : 0);
      }, 0);
      const sourceRetentionPremium = sourceRows.reduce((sum, item) => sum + Number(item.premiumCedant || 0), 0);
      const sourceCededPremium = sourceRows.reduce((sum, item) => sum + Number(item.premiumRe || 0), 0);
      const factorRetentionSum = sourceRetentionSum ? Number((retentionLine && retentionLine.sum) || 0) / sourceRetentionSum : 1;
      const factorCededSum = sourceCededSum ? Number((cededLine && cededLine.sum) || 0) / sourceCededSum : 1;
      const factorRetentionPremium = sourceRetentionPremium ? Number((retentionLine && retentionLine.premium) || 0) / sourceRetentionPremium : 1;
      const factorCededPremium = sourceCededPremium ? Number((cededLine && cededLine.premium) || 0) / sourceCededPremium : 1;
      const oldPremiumRe = Number(row.premiumRe || 0);
      const sourceLineCommission = Number((cededLine && cededLine.commission) || 0);
      const sourceLineTax = Number((cededLine && cededLine.tax) || 0);
      row.sumInsuredCedant = Number(row.sumInsuredCedant || 0) * factorRetentionSum;
      row.sumInsuredRe = Number(row.sumInsuredRe || 0) * factorCededSum;
      // Las coberturas que no suman para el contrato no deben trasladar su
      // suma a los aceptantes, tal como sucede en cambio de vigencia.
      if (!configuredForSum) {
        row.sumInsuredCedant = 0;
        row.sumInsuredRe = 0;
      }
      row.premiumCedant = Number(row.premiumCedant || 0) * factorRetentionPremium;
      row.premiumRe = Number(row.premiumRe || 0) * factorCededPremium;
      // The reinsurance command versions these proportions, not only the
      // calculated amounts. Keep them in sync with the distribution edited
      // in the grid so a 50/50 change is not restored as the prior split.
      if (retentionLine) row.proportionCed = Number(retentionLine.percentage || 0) / 100;
      if (cededLine) row.proportionRe = Number(cededLine.percentage || 0) / 100;
      // Comisión e impuesto se distribuyen por la prima cedida final. No se
      // usa el valor histórico porque puede ser cero al ingresar una nueva tasa.
      row.commission = Number((sourceLineCommission && Number(cededLine && cededLine.premium || 0)
        ? sourceLineCommission * Number(row.premiumRe || 0) / Number(cededLine.premium || 0)
        : 0).toFixed(2));
      row.tax = Number((sourceLineTax && Number(cededLine && cededLine.premium || 0)
        ? sourceLineTax * Number(row.premiumRe || 0) / Number(cededLine.premium || 0)
        : 0).toFixed(2));
      (next.participants || []).filter((participant) => String(participant.cessionId) === String(row.cessionId || row.id)).forEach((participant) => {
        participant.sumInsured = Number(participant.sumInsured || 0) * factorCededSum;
        participant.premium = Number(participant.premium || 0) * factorCededPremium;
      });
    });
    return applyCoinsuranceToSnapshot(next);
  };

  const validateProceedReinsurance = function (snapshotOverride) {
    const source = snapshotOverride || buildEditedReinsuranceSnapshot() || reinsuranceSnapshot;
    const sourceRows = source && Array.isArray(source.distribution) ? source.distribution : [];
    const errors = [];
    if (!source) {
      errors.push(t('La distribución de reaseguro todavía no está cargada.'));
      return { ok: false, errors: errors };
    }
    if (!sourceRows.length) {
      errors.push(t('La póliza no tiene reaseguro vigente para este endoso.'));
    }
    const percentageByContract = {};
    currentReinsuranceLines.filter((line) => !line.isCoinsurance && String(line.lineId) !== 'Coaseguro').forEach((line) => {
      const key = String(line.contractId || '');
      percentageByContract[key] = (percentageByContract[key] || 0) + Number(line.percentage || 0);
    });
    Object.keys(percentageByContract).forEach((key) => {
      if (Math.abs(percentageByContract[key] - 100) > 0.01) {
        errors.push(t('La distribución del contrato') + ' ' + key + ' ' + t('debe sumar 100%.'));
      }
    });
    const totalsBy = function (rows, keyBuilder) {
      return (rows || []).reduce((result, row) => {
        const key = keyBuilder(row);
        if (!result[key]) result[key] = { sum: 0, premium: 0 };
        const configuredForSum = !reinsuranceCoverageConfig[String(row.coverageCode)]
          || reinsuranceCoverageConfig[String(row.coverageCode)].isCoverage !== false;
        if (configuredForSum) {
          result[key].sum += Number(row.sumInsuredCedant || 0) + Number(row.sumInsuredRe || 0);
        }
        result[key].premium += Number(row.premiumCedant || 0) + Number(row.premiumRe || 0);
        return result;
      }, {});
    };
    const baselineRows = reinsuranceBaseline && Array.isArray(reinsuranceBaseline.distribution)
      ? reinsuranceBaseline.distribution
      : [];
    const verifyTotals = function (label, keyBuilder) {
      const actual = totalsBy(sourceRows, keyBuilder);
      const expected = totalsBy(baselineRows, keyBuilder);
      Object.keys(expected).forEach((key) => {
        const current = actual[key] || { sum: 0, premium: 0 };
        if (Math.abs(current.sum - expected[key].sum) > 0.01 || Math.abs(current.premium - expected[key].premium) > 0.01) {
          errors.push(t('La distribución de ') + label + ' ' + key + ' ' + t('no coincide con el total calculado.'));
        }
      });
    };
    // An edited percentage must only redistribute the quoted final values.
    verifyTotals(t('la cobertura'), (row) => String(row.coverageCode || row.coverageId || ''));
    verifyTotals(t('el contrato'), (row) => String(row.contractId || ''));
    sourceRows.forEach((row) => {
      if ([row.sumInsuredCedant, row.sumInsuredRe, row.premiumCedant, row.premiumRe, row.commission, row.tax]
        .some((value) => Number(value || 0) < -0.01)) {
        errors.push(t('La distribución contiene importes negativos.'));
      }
      const cededSum = Number(row.sumInsuredRe || 0);
      const cededPremium = Number(row.premiumRe || 0);
      if (cededSum > 0.01 || cededPremium > 0.01) {
        const participants = (source.participants || []).filter((participant) =>
          String(participant.cessionId) === String(row.cessionId || row.id)
          || (String(participant.contractId) === String(row.contractId)
            && String(participant.lineId || '') === String(row.lineId || '')
            && String(participant.coverageCode || '') === String(row.coverageCode || ''))
        );
        if (!participants.length) {
          errors.push(t('La línea cedida debe tener aceptantes.'));
        } else {
          const split = participants.reduce((sum, participant) => sum + Number(participant.split || 0), 0);
          const participantSum = participants.reduce((sum, participant) => sum + Number(participant.sumInsured || 0), 0);
          const participantPremium = participants.reduce((sum, participant) => sum + Number(participant.premium || 0), 0);
          const participantCommission = participants.reduce((sum, participant) => sum + Number(participant.commission || 0), 0);
          const participantTax = participants.reduce((sum, participant) => sum + Number(participant.tax || 0), 0);
          if (Math.abs(split - 100) > 0.01) errors.push(t('Los aceptantes deben sumar 100%.'));
          if (Math.abs(participantSum - cededSum) > 0.01) errors.push(t('La suma de aceptantes no coincide con la suma cedida.'));
          if (Math.abs(participantPremium - cededPremium) > 0.01) errors.push(t('La prima de aceptantes no coincide con la prima cedida.'));
          if (Math.abs(participantCommission - Number(row.commission || 0)) > 0.01) errors.push(t('La comisión de aceptantes no coincide con la línea.'));
          if (Math.abs(participantTax - Number(row.tax || 0)) > 0.01) errors.push(t('El impuesto de aceptantes no coincide con la línea.'));
        }
      }
    });
    return { ok: errors.length === 0, errors: errors };
  };

  const confirmProceedReinsurance = function (snapshotOverride) {
    if (reinsuranceLoading) {
      message.info(t('La distribución de reaseguro todavía se está cargando.'));
      return;
    }
    const edited = snapshotOverride || recalculateReinsuranceParticipants(buildEditedReinsuranceSnapshot());
    const validation = validateProceedReinsurance(edited);
    if (!validation.ok) {
      setReinsuranceConfirmed(false);
      setReinsuranceError(validation.errors.join(' '));
      message.error(validation.errors.join(' '));
      return;
    }
    setReinsuranceConfirmed(true);
    setReinsuranceError('');
    message.success(t('El reaseguro está validado y todo está en orden.'));
  };

  const reinsuranceParticipantsFor = (row) => (reinsuranceSnapshot && reinsuranceSnapshot.participants || []).filter((participant) =>
    String(participant.cessionId) === String(row.cessionId || row.id)
    || (String(participant.contractId) === String(row.contractId)
      && String(participant.lineId || '') === String(row.lineId || '')
      && String(participant.coverageCode || '') === String(row.coverageCode || ''))
  );
  const groupReinsuranceParticipants = function (participants) {
    const grouped = {};
    (participants || []).forEach((participant) => {
      const key = String(participant.contactId || '') + '|' + String(participant.brokerId || '') + '|' + String(participant._newKey || '');
      if (!grouped[key]) grouped[key] = Object.assign({}, participant, { split: Number(participant.split || 0), sumInsured: 0, premium: 0, commission: 0, tax: 0 });
      grouped[key].sumInsured += Number(participant.sumInsured || 0);
      grouped[key].premium += Number(participant.premium || 0);
      grouped[key].commission += Number(participant.commission || 0);
      grouped[key].tax += Number(participant.tax || 0);
    });
    return Object.keys(grouped).map((key) => grouped[key]);
  };

  const selectedReinsuranceParticipants = function (line) {
    if (!line || !reinsuranceSnapshot) return [];
    return (reinsuranceSnapshot.participants || []).filter((participant) =>
      String(participant.contractId) === String(line.contractId)
      && String(participant.lineId || '') === String(line.lineId || '')
    );
  };

  // Reproduce the coverage-level allocation used by ChangeCoverageSuretyEndorsement:
  // each reinsurer receives its split of the ceded values for each coverage, with
  // the final participant receiving any rounding remainder.
  const recalculateReinsuranceParticipants = function (snapshot) {
    if (!snapshot) return snapshot;
    (snapshot.distribution || []).forEach((cession) => {
      const participants = (snapshot.participants || []).filter((participant) =>
        String(participant.cessionId || '') === String(cession.cessionId || cession.id || '')
        || (String(participant.contractId) === String(cession.contractId)
          && String(participant.lineId || '') === String(cession.lineId || '')
          && String(participant.coverageCode || '') === String(cession.coverageCode || ''))
      );
      const totalSplit = participants.reduce((sum, participant) => sum + Number(participant.split || 0), 0);
      if (!participants.length || Math.abs(totalSplit - 100) > 0.01) return;
      [
        { participant: 'sumInsured', source: 'sumInsuredRe' },
        { participant: 'premium', source: 'premiumRe' },
        { participant: 'commission', source: 'commission' },
        { participant: 'tax', source: 'tax' }
      ].forEach((field) => {
        const configuredForSum = !reinsuranceCoverageConfig[String(cession.coverageCode)]
          || reinsuranceCoverageConfig[String(cession.coverageCode)].isCoverage !== false;
        const target = field.participant === 'sumInsured' && !configuredForSum
          ? 0
          : Number(cession[field.source] || 0);
        let assigned = 0;
        participants.forEach((participant, index) => {
          const amount = index === participants.length - 1
            ? Number((target - assigned).toFixed(2))
            : Number((target * Number(participant.split || 0) / totalSplit).toFixed(2));
          participant[field.participant] = amount;
          assigned += amount;
        });
      });
    });
    return snapshot;
  };

  const updateReinsuranceParticipant = function (row, field, value) {
    setReinsuranceConfirmed(false);
    setReinsuranceSnapshot((current) => {
      if (!current) return current;
      const next = JSON.parse(JSON.stringify(current));
      const matches = (next.participants || []).filter((participant) =>
        String(participant.contractId) === String(row.contractId)
        && String(participant.lineId || '') === String(row.lineId || '')
        && (row._newKey
          ? String(participant._newKey || '') === String(row._newKey)
          : String(participant.contactId || '') === String(row.contactId || '')
            && String(participant.brokerId || '') === String(row.brokerId || ''))
      );
      if (field === 'contactId' || field === 'brokerId') {
        matches.forEach((participant) => { participant[field] = value; });
        if (field === 'contactId') matches.forEach((participant) => { participant.contactName = (reinsuranceContacts.find((item) => String(item.id) === String(value)) || {}).name || ''; });
        if (field === 'brokerId') matches.forEach((participant) => { participant.brokerName = (reinsuranceBrokers.find((item) => String(item.id) === String(value)) || {}).name || ''; });
      } else if (field === 'split') {
        matches.forEach((participant) => { participant.split = Math.max(0, Number(value || 0)); });
      } else {
        const target = Math.max(0, Number(value || 0));
        const weights = matches.map((participant) => Math.abs(Number(participant[field] || 0)));
        const totalWeight = weights.reduce((sum, item) => sum + item, 0);
        let assigned = 0;
        matches.forEach((participant, index) => {
          const amount = index === matches.length - 1
            ? Number((target - assigned).toFixed(2))
            : Number((totalWeight ? target * weights[index] / totalWeight : target / (matches.length || 1)).toFixed(2));
          participant[field] = amount;
          assigned += amount;
        });
      }
      return field === 'split' ? recalculateReinsuranceParticipants(next) : next;
    });
  };

  const addReinsuranceParticipant = function (line) {
    if (!line || !reinsuranceSnapshot) return;
    const source = (line.rows || [])[0];
    if (!source) return;
    const newParticipantKey = String(Date.now());
    setReinsuranceConfirmed(false);
    setReinsuranceSnapshot((current) => {
      const next = JSON.parse(JSON.stringify(current));
      next.participants = next.participants || [];
      (line.rows || []).forEach((row) => next.participants.push({
        // A single visible reinsurer is represented internally per coverage.
        // The shared key keeps those coverage rows grouped in the grid.
        _newKey: newParticipantKey,
        contractId: line.contractId,
        lineId: line.lineId,
        coverageId: row.coverageId,
        coverageCode: row.coverageCode,
        cessionId: row.cessionId || source.cessionId,
        contactId: null,
        brokerId: null,
        split: 0,
        sumInsured: 0,
        premium: 0,
        commission: 0,
        tax: 0
      }));
      return next;
    });
  };

  const removeReinsuranceParticipant = function (row) {
    setReinsuranceConfirmed(false);
    setReinsuranceSnapshot((current) => {
      if (!current) return current;
      const next = JSON.parse(JSON.stringify(current));
      next.participants = (next.participants || []).filter((participant) => !(
        String(participant.contractId) === String(row.contractId)
        && String(participant.lineId || '') === String(row.lineId || '')
        && (row._newKey
          ? String(participant._newKey || '') === String(row._newKey)
          : String(participant.contactId || '') === String(row.contactId || '')
            && String(participant.brokerId || '') === String(row.brokerId || ''))
      ));
      return next;
    });
  };

  const saveReinsuranceDistributionInMemory = function () {
    const edited = recalculateReinsuranceParticipants(buildEditedReinsuranceSnapshot());
    const validation = validateProceedReinsurance(edited);
    if (!validation.ok) {
      setReinsuranceError(validation.errors.join(' '));
      message.error(validation.errors.join(' '));
      setReinsuranceConfirmed(false);
      return;
    }
    setReinsuranceSnapshot(edited);
    currentReinsuranceLines = buildReinsuranceLines(edited);
    setReinsuranceLines(currentReinsuranceLines);
    setReinsuranceError('');
    setReinsuranceConfirmed(false);
    message.success(t('La distribución de reaseguro fue guardada correctamente.'));
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
    setReinsuranceSnapshot(null);
    setReinsuranceBaseline(null);
    setReinsuranceConfirmed(false);
    setReinsuranceError('');
    setReinsuranceReinsurersReady(false);
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
      // La carga de reaseguro no debe bloquear el resultado de la cotización.
      // La pestaña conserva su propio indicador, igual que cambio de vigencia.
      void loadReinsuranceForView(true);
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
    if (!reinsuranceConfirmed) {
      setResult({ kind: 'error', msg: t('Confirme el reaseguro antes de ejecutar el endoso.') });
      setResultTab('reinsurance');
      message.warning(t('Confirme el reaseguro antes de ejecutar el endoso.'));
      return;
    }
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
      const editedReinsurance = buildEditedReinsuranceSnapshot()
        || applyCoinsuranceToSnapshot(await loadCurrentReinsuranceSnapshot());
      const reinsuranceSnapshot = recalculateReinsuranceParticipants(editedReinsurance);
      if (!reinsuranceSnapshot) throw new Error(t('The reinsurance distribution could not be prepared.'));
      // Solo se persisten los datos de distribución; los auxiliares visuales
      // usados para calcular la porción restante no forman parte del contrato.
      delete reinsuranceSnapshot._coinsuranceReinsurancePrepared;
      delete reinsuranceSnapshot._coinsuranceGrossByContract;
      addPayload.jAdditional = JSON.stringify({
        endorsementType: 'PROCEEDORDER',
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

      await persistMaximumCoveragePolicyEnd(cid, addPayload.jNewCoverages);
      await persistChangePayPlan(cid, calculation.oldPayPlan, calculation.newPayPlan);
      pushStep(t('Save installment dates'), true, t('Pending installment dates were preserved in the endorsement.'));
      // `cmdApplyReaChangeCoverage` reads the snapshot from Change.jAdditional.
      // Persist the confirmed draft explicitly before preparing the version.
      await persistReinsuranceSnapshot(cid, reinsuranceSnapshot);
      pushStep(t('Save reinsurance distribution'), true, '');

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

      // AXX-1978: generated after the validity update so the document shows the new validity.
      try {
        await generateEndorsementDocument(cid);
      } catch (documentError) {
        pushStep(t('Generate the endorsement document'), false, String(documentError && documentError.message ? documentError.message : documentError));
        message.warning(t('The endorsement was applied, but its document could not be generated.') + ' ' + String(documentError && documentError.message ? documentError.message : documentError));
      }

      // --- synchronise the insured object (§3.3)
      const synced = await exe('ExeChain', {
        chain: 'cmdUpdateInsuredObjectData',
        context: JSON.stringify({
          policyId: policyId,
          jNewCoverages: addPayload.jNewCoverages
        })
      });
      let syncData = synced && synced.outData;
      if (typeof syncData === 'string') {
        try { syncData = JSON.parse(syncData); } catch (parseError) { syncData = null; }
      }
      if (!syncData || typeof syncData !== 'object') syncData = synced;
      const syncOk = !!(syncData && syncData.ok === true);
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
        message.warning(t('Partial failure: the endorsement was applied but the insured-object data was not synchronised.') + ' ' + syncMsg);
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
    { title: t('Días (objeto asegurado)'), dataIndex: 'configuredDays', key: 'configuredDays', align: 'right', render: value => (value ? value : '—') },
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
  const reinsuranceContractColumns = [
    { title: t('Policy'), dataIndex: 'policyId', key: 'policyId', width: 90, align: 'center' },
    { title: t('Contract'), dataIndex: 'contractId', key: 'contractId', width: 90, align: 'center' },
    { title: t('Movement'), children: [
      { title: t('Endorsement'), key: 'endorsement', align: 'center', render: () => '0' },
      { title: t('Type'), key: 'type', align: 'center', render: () => t('Extension') }
    ] },
    { title: t('Totals'), children: [
      { title: t('Sum'), dataIndex: 'sum', key: 'sum', align: 'right', render: reinsuranceMoney },
      { title: t('Premium'), dataIndex: 'premium', key: 'premium', align: 'right', render: reinsuranceMoney }
    ] },
    { title: t('Retention'), children: [
      { title: t('Premium'), dataIndex: 'retainedPremium', key: 'retainedPremium', align: 'right', render: reinsuranceMoney },
      { title: t('Sum'), dataIndex: 'retainedSum', key: 'retainedSum', align: 'right', render: reinsuranceMoney }
    ] },
    { title: t('Ceded'), children: [
      { title: t('Premium'), dataIndex: 'cededPremium', key: 'cededPremium', align: 'right', render: reinsuranceMoney },
      { title: t('Sum'), dataIndex: 'cededSum', key: 'cededSum', align: 'right', render: reinsuranceMoney }
    ] },
    { title: t('Other'), children: [
      { title: t('Commission'), dataIndex: 'commission', key: 'commission', align: 'right', render: reinsuranceMoney },
      { title: t('Tax'), dataIndex: 'tax', key: 'tax', align: 'right', render: reinsuranceMoney }
    ] }
  ];
  const reinsuranceCoverageColumns = [
    { title: t('Coverage'), dataIndex: 'coverageCode', key: 'coverageCode', width: 100, align: 'center' },
    { title: t('Sum for contract'), key: 'sum', align: 'right', render: (value, row) => {
      const configuredForSum = !reinsuranceCoverageConfig[String(row.coverageCode)]
        || reinsuranceCoverageConfig[String(row.coverageCode)].isCoverage !== false;
      return reinsuranceMoney(configuredForSum ? Number(row.sumInsuredCedant || 0) + Number(row.sumInsuredRe || 0) : 0);
    } },
    { title: t('Cedant sum'), dataIndex: 'sumInsuredCedant', key: 'sumInsuredCedant', align: 'right', render: reinsuranceMoney },
    { title: t('Reinsurance sum'), dataIndex: 'sumInsuredRe', key: 'sumInsuredRe', align: 'right', render: reinsuranceMoney },
    { title: t('Premium'), key: 'premium', align: 'right', render: (value, row) => reinsuranceMoney(Number(row.premiumCedant || 0) + Number(row.premiumRe || 0)) },
    { title: t('Cedant premium'), dataIndex: 'premiumCedant', key: 'premiumCedant', align: 'right', render: reinsuranceMoney },
    { title: t('Reinsurance premium'), dataIndex: 'premiumRe', key: 'premiumRe', align: 'right', render: reinsuranceMoney },
    { title: t('Commission'), dataIndex: 'commission', key: 'commission', align: 'right', render: reinsuranceMoney },
    { title: t('Tax'), dataIndex: 'tax', key: 'tax', align: 'right', render: reinsuranceMoney }
  ];
  const reinsuranceParticipantColumns = [
    { title: t('Reinsurer'), dataIndex: 'contactId', width: 260, render: (value, row) => <Select size="small" value={value || undefined} placeholder={t('Select')} style={{ width: 245 }} onChange={(next) => updateReinsuranceParticipant(row, 'contactId', next)}>
      {reinsuranceContacts.map((item) => <Select.Option key={String(item.id)} value={item.id}>{item.name}</Select.Option>)}
    </Select> },
    { title: t('Broker'), dataIndex: 'brokerId', width: 200, render: (value, row) => <Select size="small" value={value || undefined} placeholder={t('Select')} style={{ width: 185 }} onChange={(next) => updateReinsuranceParticipant(row, 'brokerId', next)}>
      {reinsuranceBrokers.map((item) => <Select.Option key={String(item.id)} value={item.id}>{item.name}</Select.Option>)}
    </Select> },
    { title: t('Split (%)'), dataIndex: 'split', key: 'split', align: 'right', render: (value, row) => <EditableFormattedNumber decimals={4} value={value} onCommit={(next) => updateReinsuranceParticipant(row, 'split', next)} /> },
    { title: t('Sum'), dataIndex: 'sumInsured', key: 'sumInsured', align: 'right', render: (value, row) => <EditableFormattedNumber value={value} onCommit={(next) => updateReinsuranceParticipant(row, 'sumInsured', next)} /> },
    { title: t('Premium'), dataIndex: 'premium', key: 'premium', align: 'right', render: (value, row) => <EditableFormattedNumber value={value} onCommit={(next) => updateReinsuranceParticipant(row, 'premium', next)} /> },
    { title: t('Commission'), dataIndex: 'commission', key: 'commission', align: 'right', render: (value, row) => <EditableFormattedNumber value={value} onCommit={(next) => updateReinsuranceParticipant(row, 'commission', next)} /> },
    { title: t('Tax'), dataIndex: 'tax', key: 'tax', align: 'right', render: (value, row) => <EditableFormattedNumber value={value} onCommit={(next) => updateReinsuranceParticipant(row, 'tax', next)} /> },
    { title: t('Actions'), width: 90, render: (_, row) => <Button type="link" danger size="small" onClick={() => removeReinsuranceParticipant(row)}>{t('Delete')}</Button> }
  ];
  const reinsuranceCoinsuranceColumns = [
    { title: t('Coinsurer'), dataIndex: 'name', key: 'name' },
    { title: t('Leader'), dataIndex: 'leader', key: 'leader', align: 'center', render: (value) => value ? t('Yes') : t('No') },
    { title: t('Percentage (%)'), dataIndex: 'percentage', key: 'percentage', align: 'right', render: reinsuranceMoney },
    { title: t('Sum'), dataIndex: 'sumInsured', key: 'sumInsured', align: 'right', render: reinsuranceMoney },
    { title: t('Premium'), dataIndex: 'premium', key: 'premium', align: 'right', render: reinsuranceMoney },
    { title: t('Commission'), dataIndex: 'commission', key: 'commission', align: 'right', render: reinsuranceMoney },
    { title: t('Tax'), dataIndex: 'tax', key: 'tax', align: 'right', render: reinsuranceMoney }
  ];
  const renderCoinsuranceTab = () => {
    const rows = buildCoinsuranceRows(reinsuranceSnapshot);
    return <>
      <Alert type="info" showIcon message={t('Coinsurance information')} description={t('The values are calculated from the final endorsement state and are not editable. Reinsurance only distributes the remaining portion.')} />
      <Table size="small" pagination={false} rowKey="key" dataSource={rows} columns={reinsuranceCoinsuranceColumns}
        summary={() => <Table.Summary><Table.Summary.Row className="proceed-order-reinsurance-total">
          <Table.Summary.Cell index={0}><b>{t('Totals')}</b></Table.Summary.Cell>
          <Table.Summary.Cell index={1}></Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">{reinsuranceMoney(rows.reduce((sum, row) => sum + Number(row.percentage || 0), 0))}</Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">{reinsuranceMoney(rows.reduce((sum, row) => sum + Number(row.sumInsured || 0), 0))}</Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">{reinsuranceMoney(rows.reduce((sum, row) => sum + Number(row.premium || 0), 0))}</Table.Summary.Cell>
          <Table.Summary.Cell index={5} align="right">{reinsuranceMoney(rows.reduce((sum, row) => sum + Number(row.commission || 0), 0))}</Table.Summary.Cell>
          <Table.Summary.Cell index={6} align="right">{reinsuranceMoney(rows.reduce((sum, row) => sum + Number(row.tax || 0), 0))}</Table.Summary.Cell>
        </Table.Summary.Row></Table.Summary>} />
    </>;
  };
  const ProceedFolderIcon = () => <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 5.5A1.5 1.5 0 0 1 4.5 4h5l2 2h8A1.5 1.5 0 0 1 21 7.5v11A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13Zm2 2v10.5h14V8.5h-8.33l-2-2H5Z" /></svg>;
  const isReinsuranceReadonlyLine = (row) => String(row && row.lineId) === 'Coaseguro';
  const reinsuranceLineColumns = [
    { title: t('Line'), dataIndex: 'lineId', key: 'lineId', width: 180, align: 'left',
      render: (value, row) => <span>{value}{row.lineId === 'No Técnica' || row.lineId === 'Retención' || row.lineId === 'Coaseguro' ? null : <Button type="link" size="small" className="proceed-order-folder-button"
        onClick={(event) => { event.stopPropagation(); setReinsuranceLineKey(row.key); setReinsuranceReinsurersReady(true); setReinsuranceDetailTab('reinsurers'); }}>
        <ProceedFolderIcon />
      </Button>}</span> },
    { title: t('Percentage (%)'), dataIndex: 'percentage', key: 'percentage', width: 170, align: 'right',
      render: (value, row) => <EditableFormattedNumber disabled={isReinsuranceReadonlyLine(row)} decimals={4} value={value} width={150} onCommit={(next) => updateReinsuranceLine(row.key, 'percentage', next)} /> },
    { title: t('Sum'), dataIndex: 'sum', key: 'sum', width: 170, align: 'right',
      render: (value, row) => <EditableFormattedNumber disabled={isReinsuranceReadonlyLine(row)} value={value} width={145} onCommit={(next) => updateReinsuranceLine(row.key, 'sum', next)} /> },
    { title: t('Premium'), dataIndex: 'premium', key: 'premium', width: 170, align: 'right',
      render: (value, row) => <EditableFormattedNumber disabled={isReinsuranceReadonlyLine(row)} value={value} width={145} onCommit={(next) => updateReinsuranceLine(row.key, 'premium', next)} /> },
    { title: t('Commission %'), dataIndex: 'commissionPercentage', key: 'commissionPercentage', width: 180, align: 'right',
      render: (value, row) => <EditableFormattedNumber disabled={isReinsuranceReadonlyLine(row)} decimals={4} value={value} width={145} onCommit={(next) => updateReinsuranceLine(row.key, 'commissionPercentage', next)} /> },
    { title: t('Commission'), dataIndex: 'commission', key: 'commission', width: 160, align: 'right',
      render: (value, row) => <EditableFormattedNumber disabled={isReinsuranceReadonlyLine(row)} value={value} width={125} onCommit={(next) => updateReinsuranceLine(row.key, 'commission', next)} /> },
    { title: t('Tax %'), dataIndex: 'taxPercentage', key: 'taxPercentage', width: 180, align: 'right',
      render: (value, row) => <EditableFormattedNumber disabled={isReinsuranceReadonlyLine(row)} decimals={4} value={value} width={125} onCommit={(next) => updateReinsuranceLine(row.key, 'taxPercentage', next)} /> },
    { title: t('Tax'), dataIndex: 'tax', key: 'tax', width: 140, align: 'right',
      render: (value, row) => <EditableFormattedNumber disabled={isReinsuranceReadonlyLine(row)} value={value} width={105} onCommit={(next) => updateReinsuranceLine(row.key, 'tax', next)} /> },
    { title: t('Balance'), key: 'balance', width: 140, align: 'right', render: (value, row) => {
      return reinsuranceMoney(row.isCoinsurance ? 0 : Number(row.premium || 0) - Number(row.commission || 0) - Number(row.tax || 0));
    } }
  ];
  const movementReinsuranceParticipantColumns = [
    { title: t('Reinsurer'), dataIndex: 'contactId', align: 'left', render: (value, row) => (reinsuranceContacts.find((item) => String(item.id) === String(value)) || {}).name || row.contactName || row.name || '-' },
    { title: t('Broker'), dataIndex: 'brokerId', align: 'left', render: (value, row) => (reinsuranceBrokers.find((item) => String(item.id) === String(value)) || {}).name || row.brokerName || '-' },
    { title: t('Split (%)'), dataIndex: 'split', align: 'right', render: (value) => Number(value || 0).toFixed(4) + '%' },
    { title: t('Sum'), dataIndex: 'sumInsured', align: 'right', render: reinsuranceMoney },
    { title: t('Premium'), dataIndex: 'premium', align: 'right', render: reinsuranceMoney },
    { title: t('Commission'), dataIndex: 'commission', align: 'right', render: reinsuranceMoney },
    { title: t('Tax'), dataIndex: 'tax', align: 'right', render: reinsuranceMoney }
  ];
  const renderMovementDistributionTab = (group) => {
    const movement = (group && group.rows || []).reduce((total, row) => ({
      sum: total.sum + reinsuranceNumber(row.sumInsuredMovement),
      premium: total.premium + reinsuranceNumber(row.premiumMovement)
    }), { sum: 0, premium: 0 });
    const coinsurancePct = coinsurancePercentage(reinsuranceSnapshot);
    const rows = selectedReinsuranceLines.map((line) => {
      const factor = String(line.lineId) === 'Coaseguro'
        ? coinsurancePct / 100
        : ((100 - coinsurancePct) / 100) * reinsuranceNumber(line.percentage) / 100;
      const premium = moneyValue(movement.premium * factor);
      const sum = moneyValue(movement.sum * factor);
      const commissionRate = reinsuranceNumber(line.premium) ? reinsuranceNumber(line.commission) / reinsuranceNumber(line.premium) : 0;
      const taxRate = reinsuranceNumber(line.premium) ? reinsuranceNumber(line.tax) / reinsuranceNumber(line.premium) : 0;
      return Object.assign({}, line, {
        sum,
        premium,
        commission: moneyValue(premium * commissionRate),
        tax: moneyValue(premium * taxRate)
      });
    });
    const selected = rows.find((row) => row.key === reinsuranceLineKey) || rows[0];
    const participants = selected
      ? groupReinsuranceParticipants((reinsuranceSnapshot && reinsuranceSnapshot.participants || []).filter((item) => String(item.contractId) === String(selected.contractId) && String(item.lineId || '') === String(selected.lineId || ''))).map((item) => {
        const factor = reinsuranceNumber(item.split) / 100;
        return Object.assign({}, item, {
          sumInsured: moneyValue(reinsuranceNumber(selected.sum) * factor),
          premium: moneyValue(reinsuranceNumber(selected.premium) * factor),
          commission: moneyValue(reinsuranceNumber(selected.commission) * factor),
          tax: moneyValue(reinsuranceNumber(selected.tax) * factor)
        });
      })
      : [];
    const columns = reinsuranceLineColumns.map((column) => {
      if (column.dataIndex === 'lineId') return Object.assign({}, column, { render: (value, row) => <span>{value}<Button type="link" size="small" className="proceed-order-folder-button" title={t('View reinsurers')} onClick={(event) => { event.stopPropagation(); setReinsuranceLineKey(row.key); }}><ProceedFolderIcon /></Button></span> });
      if (column.dataIndex === 'percentage' || column.dataIndex === 'commissionPercentage' || column.dataIndex === 'taxPercentage') return Object.assign({}, column, { render: (value) => Number(value || 0).toFixed(4) });
      if (column.dataIndex === 'sum' || column.dataIndex === 'premium' || column.dataIndex === 'commission' || column.dataIndex === 'tax') return Object.assign({}, column, { render: reinsuranceMoney });
      if (column.key === 'balance') return Object.assign({}, column, { render: (value, row) => reinsuranceMoney(Number(row.premium || 0) - Number(row.commission || 0) - Number(row.tax || 0)) });
      return column;
    });
    return <>
      <Alert type="info" showIcon message={t('Distribución del Movimiento')} description={t('Valores informativos calculados únicamente sobre la porción cambiada por el endoso.')} />
      <Table size="small" pagination={false} rowKey="key" dataSource={rows} columns={columns} scroll={{ x: 1490 }} />
      {selected ? <div className="proceed-order-reinsurance-toolbar"><span>{t('Reinsurers')} - {selected.lineId}</span></div> : null}
      {selected ? <Table size="small" pagination={false} rowKey={(row, index) => String(row.contactId || '') + '|' + String(row.brokerId || '') + '|' + index} dataSource={participants} columns={movementReinsuranceParticipantColumns} locale={{ emptyText: t('No reinsurers found.') }} /> : null}
    </>;
  };
  const renderReinsurancePanel = () => {
    const validation = validateProceedReinsurance();
    const selectedGroup = reinsuranceContractRows.find((group) => group.key === reinsuranceContractKey) || reinsuranceContractRows[0];
    const selectedRows = selectedGroup ? selectedGroup.rows : [];
    const selectedLine = reinsuranceLines.find((line) => line.key === reinsuranceLineKey) || selectedReinsuranceLines.find((line) => line.lineId === 'Cuota Parte') || selectedReinsuranceLines[0];
    const participants = selectedLine
      ? (reinsuranceSnapshot && reinsuranceSnapshot.participants || []).filter((participant) => String(participant.contractId) === String(selectedLine.contractId) && String(participant.lineId || '') === String(selectedLine.lineId || ''))
      : [];
    const groupedParticipants = groupReinsuranceParticipants(participants);
    return (
      <div className="proceed-order-reinsurance-panel">
        <Alert type="info" showIcon message={t('Distribución de reaseguro')} />
        <Spin spinning={reinsuranceLoading}>
          {reinsuranceError ? <Alert type="error" showIcon style={{ marginTop: 8 }} message={reinsuranceError} /> : null}
          {!reinsuranceSnapshot && !reinsuranceLoading ? <Empty description={t('No hay datos de reaseguro cargados.')} /> : null}
          {reinsuranceSnapshot && reinsuranceContractRows.length ? (
            <div>
              <Table className="proceed-order-reinsurance-table" size="small" pagination={false} rowKey="key"
                dataSource={reinsuranceContractRows} columns={reinsuranceContractColumns}
                rowClassName={(row) => row.key === reinsuranceContractKey ? 'proceed-order-reinsurance-selected' : ''}
                rowSelection={{
                  type: 'radio',
                  selectedRowKeys: reinsuranceContractKey ? [reinsuranceContractKey] : [],
                  onChange: (keys) => {
                    const selectedKey = keys[0] || null;
                    const selected = reinsuranceContractRows.find((row) => String(row.key) === String(selectedKey));
                    setReinsuranceContractKey(selectedKey);
                    const firstLine = selected
                      ? reinsuranceLines.find((line) => String(line.contractId) === String(selected.contractId) && line.lineId === 'Cuota Parte')
                        || reinsuranceLines.find((line) => String(line.contractId) === String(selected.contractId))
                      : null;
                    setReinsuranceLineKey(firstLine ? firstLine.key : null);
                    setReinsuranceReinsurersReady(false);
                    setReinsuranceDetailTab('distribution');
                  }
                }}
                onRow={(row) => ({ onClick: () => {
                  setReinsuranceContractKey(row.key);
                  const firstLine = reinsuranceLines.find((line) => String(line.contractId) === String(row.contractId) && line.lineId === 'Cuota Parte')
                    || reinsuranceLines.find((line) => String(line.contractId) === String(row.contractId));
                  setReinsuranceLineKey(firstLine ? firstLine.key : null);
                  setReinsuranceReinsurersReady(false);
                  setReinsuranceDetailTab('distribution');
                } })}
                summary={() => (
                  <Table.Summary.Row className="proceed-order-reinsurance-total">
                    <Table.Summary.Cell index={0}></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><b>{t('Totals')}</b></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}></Table.Summary.Cell>
                    <Table.Summary.Cell index={3}></Table.Summary.Cell>
                    <Table.Summary.Cell index={4}></Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">{reinsuranceMoney(reinsuranceContractRows.reduce((sum, row) => sum + row.sum, 0))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">{reinsuranceMoney(reinsuranceContractRows.reduce((sum, row) => sum + row.premium, 0))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">{reinsuranceMoney(reinsuranceContractRows.reduce((sum, row) => sum + row.retainedPremium, 0))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">{reinsuranceMoney(reinsuranceContractRows.reduce((sum, row) => sum + row.retainedSum, 0))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={9} align="right">{reinsuranceMoney(reinsuranceContractRows.reduce((sum, row) => sum + row.cededPremium, 0))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={10} align="right">{reinsuranceMoney(reinsuranceContractRows.reduce((sum, row) => sum + row.cededSum, 0))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={11} align="right">{reinsuranceMoney(reinsuranceContractRows.reduce((sum, row) => sum + row.commission, 0))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={12} align="right">{reinsuranceMoney(reinsuranceContractRows.reduce((sum, row) => sum + row.tax, 0))}</Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
              {selectedGroup ? (
                <Tabs className="proceed-order-reinsurance-detail-tabs" type="card" activeKey={reinsuranceDetailTab} onChange={setReinsuranceDetailTab}>
                  <TabPane tab={t('Distribución del Movimiento')} key="movementDistribution">
                    {renderMovementDistributionTab(selectedGroup)}
                  </TabPane>
                  <TabPane tab={t('Distribution')} key="distribution">
                    <div className="proceed-order-reinsurance-toolbar"><Button type="primary" onClick={saveReinsuranceDistributionInMemory}>{t('Save')}</Button><span>{t('Reinsurance distribution')}</span></div>
                    <Table size="small" pagination={false} rowKey="key" dataSource={selectedReinsuranceLines} columns={reinsuranceLineColumns} scroll={{ x: 1490 }}
                      summary={() => (
                        <Table.Summary.Row className="proceed-order-reinsurance-total">
                          <Table.Summary.Cell index={0}><b>{t('Totals')}</b></Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">{reinsuranceMoney(selectedReinsuranceLines.reduce((sum, row) => sum + (row.isCoinsurance ? 0 : Number(row.percentage || 0)), 0))}</Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="right">{reinsuranceMoney(selectedReinsuranceLines.reduce((sum, row) => sum + Number(row.sum || 0), 0))}</Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="right">{reinsuranceMoney(selectedReinsuranceLines.reduce((sum, row) => sum + Number(row.premium || 0), 0))}</Table.Summary.Cell>
                          <Table.Summary.Cell index={4}></Table.Summary.Cell>
                          <Table.Summary.Cell index={5} align="right">{reinsuranceMoney(selectedReinsuranceLines.reduce((sum, row) => sum + Number(row.commission || 0), 0))}</Table.Summary.Cell>
                          <Table.Summary.Cell index={6}></Table.Summary.Cell>
                          <Table.Summary.Cell index={7} align="right">{reinsuranceMoney(selectedReinsuranceLines.reduce((sum, row) => sum + Number(row.tax || 0), 0))}</Table.Summary.Cell>
                          <Table.Summary.Cell index={8} align="right">{reinsuranceMoney(selectedReinsuranceLines.reduce((sum, row) => sum + (row.isCoinsurance ? 0 : Number(row.premium || 0) - Number(row.commission || 0) - Number(row.tax || 0)), 0))}</Table.Summary.Cell>
                        </Table.Summary.Row>
                      )} />
                  </TabPane>
                  <TabPane tab={t('Reinsurers')} key="reinsurers" disabled={!reinsuranceReinsurersReady}>
                    <Alert type="info" showIcon message={selectedLine ? t('Contract') + ': ' + selectedLine.contractId + ' | ' + t('Line') + ': ' + selectedLine.lineId : t('Select a line')} />
                    {selectedLine ? <div className="proceed-order-reinsurance-toolbar">
                      <Button type="primary" size="small" onClick={() => addReinsuranceParticipant(selectedLine)}>{t('Add reinsurer')}</Button>
                      <Button size="small" onClick={saveReinsuranceDistributionInMemory}>{t('Save distribution')}</Button>
                      <span>{t('Reinsurer distribution')}</span>
                    </div> : null}
                    <Table size="small" pagination={false} rowKey={(row, index) => String(row.contactId || '') + '|' + String(row.brokerId || '') + '|' + String(row._newKey || index)} dataSource={groupedParticipants} columns={reinsuranceParticipantColumns} locale={{ emptyText: t('No reinsurers found.') }} />
                  </TabPane>
                  <TabPane tab={t('Coinsurance')} key="coinsurance">
                    {renderCoinsuranceTab()}
                  </TabPane>
                  <TabPane tab={t('Coverage')} key="coverage">
                    <Table size="small" pagination={false} rowKey={(row) => String(row.coverageId || row.coverageCode)} dataSource={selectedRows} columns={reinsuranceCoverageColumns} />
                  </TabPane>
                </Tabs>
              ) : null}
              {!validation.ok ? <Alert type="error" showIcon message={t('La distribución no permite ejecutar el endoso')} description={validation.errors.join(' ')} /> : <Alert type="success" showIcon message={t('La distribución de reaseguro es válida para ejecutar')} />}
            </div>
          ) : (reinsuranceSnapshot ? <Empty description={t('La póliza no tiene reaseguro vigente para este endoso.')} /> : null)}
        </Spin>
      </div>
    );
  };
  const confirmReinsuranceFromButton = function () {
    setResultTab('reinsurance');
    if (reinsuranceLoading) {
      message.info(t('La distribución de reaseguro todavía se está cargando.'));
      return;
    }
    if (reinsuranceSnapshot) confirmProceedReinsurance();
    else message.error(t('La distribución de reaseguro no pudo cargarse después de calcular el endoso.'));
  };
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
        <Button
          type="primary"
          id="btnConfirmReinsurance"
          loading={reinsuranceLoading}
          disabled={!calculationIsCurrent || executing}
          onClick={confirmReinsuranceFromButton}
        >
          {t('Confirm reinsurance')}
        </Button>
        <Popconfirm
          title={t('Execute endorsement?')}
          description={t('This action will create and execute the endorsement using the current calculation.')}
          okText={t('Yes')}
          cancelText={t('Cancel')}
          onConfirm={onExecute}
          disabled={!proceedOrderEnabled || !isValid || !calculationIsCurrent || !reinsuranceConfirmed || executing}
        >
          <Button
            type="primary"
            id="btnExecute"
            loading={executing}
            disabled={!proceedOrderEnabled || !isValid || !calculationIsCurrent || !reinsuranceConfirmed || executing}
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
        ) : (!reinsuranceConfirmed ? (
          <span style={{ color: '#d48806' }}>{t('Confirm reinsurance before executing the endorsement.')}</span>
        ) : null)))}
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
        <Tabs className="proceed-order-result-tabs" activeKey={resultTab} onChange={(key) => { setResultTab(key); }} type="card">
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
            </Descriptions>
          </TabPane>
          <TabPane tab={t('Reinsurance')} key="reinsurance">
            {renderReinsurancePanel()}
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
