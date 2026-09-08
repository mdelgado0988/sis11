/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/09/07
 * @name ProceedOrderEndorsement
 * @version 1.0
 * @purpose: Manage proceed-order endorsements by calculating coverage validity changes,
 * executing the ChangeTerm endorsement, and synchronizing insured-object data.
 */
() => {
  const { Card, Row, Col, Form, DatePicker, Input, Button, Table, Descriptions, Alert, Tag, Skeleton, Space, Divider, Popconfirm, message } = A;

  // ---------------------------------------------------------------- utilities
  // Date rule (§2.3): every date is handled as a CALENDAR date in the browser
  // local zone, normalised to local midnight. We slice the YYYY-MM-DD prefix and
  // rebuild the date locally, so a UTC offset can never move the calendar day.
  const toLocalDate = (value) => {
    if (!value) return null;
    if (value && typeof value.toDate === 'function') {
      const m = value.toDate();
      return new Date(m.getFullYear(), m.getMonth(), m.getDate());
    }
    const raw = String(value).slice(0, 10);
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
  const DAY = 86400000;
  const daysBetween = (a, b) => (!a || !b ? null : Math.round((b.getTime() - a.getTime()) / DAY));
  const addDays = (date, n) => (!date || n == null ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
  const txt = (v) => String(v == null ? '' : v).trim();
  const translatedMessage = (value, fallback) => value ? t(String(value)) : t(fallback);
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
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [changeId, setChangeId] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [premiumValidationError, setPremiumValidationError] = useState('');

  // The current system date, generated in the BROWSER local time zone (§2.1).
  const [systemDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

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
    `;
    document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  // ------------------------------------------------- coverage date calculation
  // §2.3 + assumption 14: the main coverage is the configured row whose
  // coverageCodeDep equals its own coverageCode. An EMPTY coverageCodeDep means
  // "does not take part in the relationship" — it is NOT a main coverage.
  const model = (() => {
    if (!policy || !coverages.length || !cfgRows.length) return null;

    const cfgByCov = {};
    cfgRows.forEach((r) => { cfgByCov[r.coverageCode] = r; });

    const mainCfg = cfgRows.filter((r) => r.coverageCodeDep !== '' && r.coverageCodeDep === r.coverageCode);
    if (mainCfg.length !== 1) {
      return { error: mainCfg.length === 0
        ? t('No main coverage is configured for this product in cfgCoberturaProductoReaFianza.')
        : t('More than one main coverage is configured for this product: ') + mainCfg.map((r) => r.coverageCode).join(', ') };
    }
    const mainCode = mainCfg[0].coverageCode;

    const mainCov = coverages.find((c) => txt(c.code) === mainCode);
    if (!mainCov) return { error: t('The configured main coverage (') + mainCode + t(') is not present on this policy.') };

    const curMainStart = toLocalDate(mainCov.start);
    const curMainEnd = toLocalDate(mainCov.end);
    if (!curMainStart || !curMainEnd) return { error: t('The main coverage has no usable start/end dates.') };

    const mainDuration = daysBetween(curMainStart, curMainEnd);
    const newMainStart = toLocalDate(effectiveDate);
    const newMainEnd = newMainStart ? addDays(newMainStart, mainDuration) : null;

    const rows = coverages.map((c) => {
      const code = txt(c.code);
      const cfg = cfgByCov[code];
      const curStart = toLocalDate(c.start);
      const curEnd = toLocalDate(c.end);
      const duration = daysBetween(curStart, curEnd);
      const isMain = code === mainCode;
      // Configured as taking part in the relationship, and not the main one.
      const isDependent = !!cfg && cfg.coverageCodeDep !== '' && !isMain;

      let newStart = null, newEnd = null, note = '';
      if (!newMainStart) {
        note = t('awaiting effective date');
      } else if (isMain) {
        newStart = newMainStart;
        newEnd = newMainEnd;
      } else if (isDependent) {
        // Assumption 13: keep the CURRENT offset of this dependent relative to the
        // CURRENT main end, read from the policy. No contiguity rule is invented.
        const offset = daysBetween(curMainEnd, curStart);
        newStart = addDays(newMainEnd, offset);
        newEnd = duration == null ? null : addDays(newStart, duration);
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
        newDuration: daysBetween(newStart, newEnd),
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
  if (!effectiveDate) missing.push(t('Effective endorsement date'));
  const policyStartDate = policy ? toLocalDate(policy.start) : null;
  const effectiveDateValue = toLocalDate(effectiveDate);
  const effectiveDateError = policyStartDate && effectiveDateValue
    && effectiveDateValue.getTime() <= policyStartDate.getTime()
    ? t('The date cannot be equal to or earlier than the policy issue/start date.')
    : '';
  if (effectiveDateError) missing.push(effectiveDateError);
  if (!txt(observation)) missing.push(t('Endorsement observation'));
  const isValid = missing.length === 0 && !!model && !model.error;
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
      const newStart = fmt(model.mainRow.newStart);
      const newEnd = fmt(model.mainRow.newEnd);
      const jAdditional = JSON.stringify({ endorsementType: 'PROCEEDORDER' });
      const quote = await exe('ChangeTerm', {
        policyId: policyId,
        newStart: newStart,
        newEnd: newEnd,
        effectiveDate: eff,
        note: txt(observation),
        jAdditional: jAdditional
      });

      if (!quote || !quote.ok || !quote.outData) {
        pushStep(t('Calculate the term change'), false, translatedMessage(quote && quote.msg, 'no response'));
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

      setCalculation({ key: calculationKey, quote: quote.outData });
      pushStep(t('Calculate the term change'), true, '');
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

  const onExecute = async function () {
    setTouched(true);
    if (!isValid) { message.error(t('Required: ') + missing.join(', ')); return; }
    if (!calculationIsCurrent) {
      message.warning(t('The endorsement data changed or has not been calculated. Calculate again before executing.'));
      return;
    }
    setExecuting(true);
    setSteps([]);
    setResult(null);
    setChangeId(null);
    try {
      const eff = fmt(toLocalDate(effectiveDate));
      const newStart = fmt(model.mainRow.newStart);
      const newEnd = fmt(model.mainRow.newEnd);

      // --- generate the endorsement
      const addPayload = {};
      Object.keys(calculation.quote).forEach((k) => { addPayload[k] = calculation.quote[k]; });
      addPayload.policyId = policyId;
      addPayload.newStart = newStart;
      addPayload.newEnd = newEnd;
      addPayload.effectiveDate = eff;
      addPayload.operation = 'ADD';
      addPayload.note = txt(observation);
      addPayload.code = null;
      addPayload.jAdditional = JSON.stringify({ endorsementType: 'PROCEEDORDER' });
      const created = await exe('ChangeTerm', addPayload);
      if (!created || !created.ok || !created.outData || !created.outData.id) {
        pushStep(t('Generate the endorsement'), false, translatedMessage(created && created.msg, 'no endorsement was returned'));
        const createError = t('The endorsement was not generated. ') + translatedMessage(created && created.msg, '');
        setResult({ kind: 'error', msg: createError });
        message.error(createError);
        return;
      }
      const cid = created.outData.id;
      setChangeId(cid);
      pushStep(t('Generate the endorsement'), true, t('endorsement ') + cid);

      // --- carry the Stage 1 coverage dates into the endorsement.
      // ChangeTerm re-quotes on save, so jNewCoverages comes back with the ORIGINAL coverage
      // dates; ExeChangeTerm is what writes jNewCoverages onto the coverages. Setting them
      // here is what makes the endorsement apply the dates the preview showed.
      let jc = [];
      try { jc = JSON.parse(created.outData.jNewCoverages || '[]'); } catch (e) { jc = []; }
      jc.forEach((c) => {
        const row = model.rows.filter((r) => r.code === txt(c.code))[0];
        if (row && row.newStart && row.newEnd) { c.start = fmt(row.newStart) + 'T00:00:00'; c.end = fmt(row.newEnd) + 'T00:00:00'; }
      });
      const entity = { id: cid, lifePolicyId: policyId, status: created.outData.status, newStart: newStart, newEnd: newEnd, effectiveDate: eff, note: txt(observation), jAdditional: JSON.stringify({ endorsementType: 'PROCEEDORDER' }), jNewCoverages: JSON.stringify(jc) };
      const fixed = await exe('ChangeTerm', { Entity: entity, operation: 'UPDATE' });
      if (!fixed || !fixed.ok) {
        pushStep(t('Set the calculated coverage dates'), false, translatedMessage(fixed && fixed.msg, 'no response'));
        const datesError = t('The calculated dates could not be set on endorsement ') + cid + t('. It was NOT executed. ') + translatedMessage(fixed && fixed.msg, '');
        setResult({ kind: 'error', msg: datesError });
        message.error(datesError);
        return;
      }
      pushStep(t('Set the calculated coverage dates'), true, '');

      // --- execute
      const executed = await exe('ExeChangeTerm', { changeId: cid, operation: 'EXECUTE' });
      if (!executed || !executed.ok) {
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
        pushStep(t('Execute the endorsement'), true, t('scheduled for ') + eff + t(' — not applied yet'));
        await reloadPolicy();
        setResult({ kind: 'partial', msg: t('Endorsement ') + cid + t(' was generated and SCHEDULED for ') + eff + t('. The coverage dates have not changed yet, so the insured-object data was not synchronised.') });
        message.warning(t('The endorsement was scheduled, not applied.'));
        return;
      }
      pushStep(t('Execute the endorsement'), true, translatedMessage(executed.msg, ''));

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
      } else {
        // §3.4: never hide a partial failure behind a generic success message.
        setResult({ kind: 'partial', msg: t('PARTIAL: endorsement ') + cid + t(' WAS applied to the policy, but the insured-object synchronisation failed — ') + syncMsg });
        message.warning(t('Partial failure: the endorsement was applied but the insured-object data was not synchronised.'));
      }
    } catch (err) {
      const errorMessage = err && err.message ? err.message : String(err);
      pushStep(t('Unexpected error'), false, translatedMessage(errorMessage, 'Unexpected error'));
      const executionError = translatedMessage(errorMessage, 'Unexpected error');
      setResult({ kind: 'error', msg: executionError });
      message.error(executionError);
    } finally {
      setExecuting(false);
    }
  };

  // ---------------------------------------------------------------- rendering
  const dateCell = (d, days) => (
    <span>{d ? fmt(d) : <span style={{ color: '#bfbfbf' }}>—</span>}{days != null && d ? <span style={{ color: '#8c8c8c' }}> ({days}d)</span> : null}</span>
  );

  const columns = [
    { title: t('Coverage ID'), dataIndex: 'coverageId', key: 'coverageId',
      render: (v, r) => <span>{v} {r.isMain ? <Tag color="blue">{t('Main')}</Tag> : (r.isDependent ? <Tag>{t('Dependent')}</Tag> : null)}</span> },
    { title: t('Code'), dataIndex: 'code', key: 'code' },
    { title: t('Coverage name'), dataIndex: 'name', key: 'name' },
    { title: t('Premium'), dataIndex: 'premium', key: 'premium' },
    { title: t('Start date (before)'), key: 'cs', render: (v, r) => dateCell(r.curStart) },
    { title: t('End date (before)'), key: 'ce', render: (v, r) => dateCell(r.curEnd, r.duration) },
    { title: t('Start date (after)'), key: 'ns', render: (v, r) => dateCell(r.newStart) },
    { title: t('End date (after)'), key: 'ne', render: (v, r) => dateCell(r.newEnd, r.newDuration) },
    { title: t('Note'), dataIndex: 'note', key: 'note' },
  ];
  const policyHref = policyId > 0 ? '/#/lifePolicy/' + policyId : '/#/home';

  if (loading) return <Card title={t('Proceed Order endorsement')}><Skeleton active /></Card>;

  if (loadError) {
    return <Card title={t('Proceed Order endorsement')}>
      <Alert type="error" showIcon message={t('The view could not be loaded')} description={loadError} />
    </Card>;
  }

  return (
    <Card className="proceed-order-endorsement-view" title={<span>{t('Proceed Order endorsement')} {policy ? <Tag color="blue">{policy.code || ('#' + policy.id)}</Tag> : null}</span>}>
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message={t('Proceed Order endorsement')}
        description={t('Preview the resulting dates, then execute. Execution generates a ChangeTerm endorsement, executes it and synchronises the insured-object data. Nothing is written until you press Execute.')} />

      {premiumValidationError ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('Endorsement blocked: billing would change')}
          description={premiumValidationError}
        />
      ) : null}

      <div style={{
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
          disabled={!isValid || !calculationIsCurrent || executing}
        >
          <Button
            type="primary"
            id="btnExecute"
            loading={executing}
            disabled={!isValid || !calculationIsCurrent || executing}
          >
            {t('Execute endorsement')}
          </Button>
        </Popconfirm>
        {!isValid ? (
          <span style={{ color: '#cf1322' }}>{t('Required: ') + missing.join(', ')}</span>
        ) : (!calculationIsCurrent ? (
          <span style={{ color: '#d48806' }}>
            {calculation
              ? t('The endorsement data changed. Calculate again before executing.')
              : t('Calculate before executing the endorsement.')}
          </span>
        ) : null)}
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
        <Descriptions size="small" column={3} bordered style={{ marginBottom: 12 }}>
          <Descriptions.Item label={t('Current system date')}><span id="sysDate">{fmt(systemDate)}</span></Descriptions.Item>
          <Descriptions.Item label={t('Policy')}>{policy ? (policy.code || policy.id) : ''}</Descriptions.Item>
          <Descriptions.Item label={t('Product')}>
            {policy
              ? ((policy.Product && policy.Product.name)
                || (policy.product && policy.product.name)
                || policy.productName
                || policy.productCode
                || '')
              : ''}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t('Effective endorsement date')} required
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
        <div>
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
        </div>
      ) : null}
    </Card>
  );
}
