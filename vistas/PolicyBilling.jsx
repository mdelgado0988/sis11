/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/09/07
 * @name PolicyBilling
 * @version 1.0
 * @purpose: Display policy billing receipts, endorsements, premiums, taxes, and installment details.
 */
()=>{
  const { useEffect, useState } = React;
  const {
    Table,
    Button,
    Modal,
    Tabs,
    Row,
    Col,
    Descriptions,
    Empty,
    Spin,
    message,
    Tooltip
  } = A;
  const { TabPane } = Tabs;

  const BackIcon = () => (
    <span role="img" aria-label="arrow-left" className="anticon anticon-arrow-left">
      <svg viewBox="64 64 896 896" focusable="false" data-icon="arrow-left" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M869 491H291.3l219.5-219.5c3.1-3.1 3.1-8.2 0-11.3l-45.3-45.3a8.2 8.2 0 0 0-11.3 0L156.7 507.4a8.2 8.2 0 0 0 0 11.3l297.5 297.5a8.2 8.2 0 0 0 11.3 0l45.3-45.3a8.2 8.2 0 0 0 0-11.3L291.3 533H869c4.4 0 8-3.6 8-8v-26c0-4.4-3.6-8-8-8z"></path>
      </svg>
    </span>
  );

  const SummaryIcon = () => <i className="bi bi-file-text" aria-hidden="true" />;
  const InstallmentIcon = () => <i className="bi bi-calendar3" aria-hidden="true" />;
  const RefreshIcon = () => <i className="bi bi-arrow-clockwise" aria-hidden="true" />;

  const [policyId, setPolicyId] = useState(0);
  const [policy, setPolicy] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('movements');
  const [reinsuranceRows, setReinsuranceRows] = useState([]);
  const [reinsuranceLoaded, setReinsuranceLoaded] = useState(false);
  const [reinsuranceLoading, setReinsuranceLoading] = useState(false);
  const policyHref = policy && policy.id ? `/#/lifePolicy/${policy.id}` : '#/home';

  useEffect(() => {
    const id = getPolicyId();
    setPolicyId(id);
    if (id > 0) {
      loadPolicy(id);
    } else {
      message.error(t('A valid policy identifier was not provided.'));
    }
  }, []);

  useEffect(() => {
    const styleId = 'policy-billing-compact-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .policy-billing-table .ant-table-thead > tr > th,
      .policy-billing-table .ant-table-tbody > tr > td,
      .policy-billing-table .ant-table-summary > tr > td {
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .policy-billing-table .ant-table-container,
      .policy-billing-installments .ant-table-container {
        border: 1px solid #cbd1d8;
        border-radius: 4px;
        overflow: hidden;
      }

      .policy-billing-table .ant-table-thead > tr > th,
      .policy-billing-installments .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        color: #262626;
        font-weight: 600;
      }

      .policy-billing-table .ant-table-thead > tr > th:last-child,
      .policy-billing-installments .ant-table-thead > tr > th:last-child {
        border-right: 0 !important;
      }

      .policy-billing-table .ant-table-tbody > tr > td,
      .policy-billing-installments .ant-table-tbody > tr > td,
      .policy-billing-table .ant-table-summary > tr > td,
      .policy-billing-installments .ant-table-summary > tr > td {
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
      }

      .policy-billing-table .ant-table-tbody > tr:hover > td,
      .policy-billing-installments .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .policy-billing-table .ant-table-tbody > tr.ant-table-row-selected > td,
      .policy-billing-installments .ant-table-tbody > tr.ant-table-row-selected > td {
        background: #86b4ff !important;
      }

      .policy-billing-table .policy-billing-total-row > td,
      .policy-billing-table .policy-billing-total-row > td * {
        font-weight: 700 !important;
      }

      .policy-billing-installments .ant-table-thead > tr > th,
      .policy-billing-installments .ant-table-tbody > tr > td,
      .policy-billing-installments .ant-table-summary > tr > td {
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .policy-billing-installments .policy-billing-installment-total-row > td,
      .policy-billing-installments .policy-billing-installment-total-row > td * {
        font-weight: 700 !important;
      }

      .policy-billing-table .policy-billing-row-new > td {
        background: #e6f4ff !important;
      }

      .policy-billing-table .policy-billing-row-cancellation > td {
        background: #fff1f0 !important;
      }

      .policy-billing-table .policy-billing-row-endorsement > td {
        background: #f6ffed !important;
      }

      .policy-billing-cancellation-amount {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 1px;
      }

      .policy-billing-cancellation-paid {
        color: #1677ff;
        font-size: 10px;
        line-height: 14px;
        white-space: nowrap;
      }

      .policy-billing-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .policy-billing-actions .policy-billing-back {
        border-color: #8c8c8c;
        color: #262626;
        font-weight: 500;
      }

      .policy-billing-ellipsis {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  function getPolicyId() {
    const contextId = typeof context !== 'undefined' && context
      ? Number(context.policyId || context.id || 0)
      : 0;

    if (contextId > 0) {
      return contextId;
    }

    try {
      const href = String(window.location.href || '').replace('#/', '');
      const url = new URL(href);
      return Number(url.searchParams.get('policyId') || 0);
    } catch (error) {
      return 0;
    }
  }

  function loadPolicy(id) {
    setLoading(true);

    exe('RepoLifePolicy', {
      operation: 'GET',
      filter: `id=${id}`,
      include: ['PayPlan', 'Changes.Bill', 'Changes.BillDiff', 'Anniversaries'],
      noTracking: true
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg
            ? response.msg
            : t('The policy could not be loaded.'));
        }

        const responseData = response && response.outData;
        const rows = Array.isArray(responseData)
          ? responseData
          : responseData
            ? [responseData]
            : [];
        const loadedPolicy = rows.length > 0 ? rows[0] : null;
        if (!loadedPolicy) {
          throw new Error(`${t('Policy not found')}: ${id}.`);
        }

        setPolicy(loadedPolicy);
        setReceipts(buildReceiptRows(loadedPolicy));
      })
      .catch(error => {
        setPolicy(null);
        setReceipts([]);
        message.error(error && error.message ? error.message : t('An unexpected error occurred.'));
      })
      .finally(() => setLoading(false));
  }

  function apiDate(value) {
    const raw = String(value || '');
    return raw.length >= 10 ? raw.substring(0, 10) : '';
  }

  function getReinsuranceContext() {
    const from = apiDate(policy && (policy.created || policy.start || policy.activeDate));
    const to = apiDate(policy && policy.end) || new Date().toISOString().substring(0, 10);
    return {
      fdesde: from || to,
      fhasta: to,
      ramos: [],
      poliza: policy && (policy.code || '') || String(policy && policy.id || ''),
      page: 1,
      size: 500
    };
  }

  async function loadReinsurance(force) {
    if (!policy || !policy.id || reinsuranceLoading) return;
    if (reinsuranceLoaded && !force) return;

    setReinsuranceLoading(true);
    try {
      const response = await exe('ExeChain', {
        chain: 'cmdBorderoMovimientos',
        context: JSON.stringify(getReinsuranceContext())
      });
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The reinsurance could not be loaded.'));
      }
      const rows = response.outData && Array.isArray(response.outData.filas)
        ? response.outData.filas
        : [];
      setReinsuranceRows(rows);
      setReinsuranceLoaded(true);
    } catch (error) {
      setReinsuranceRows([]);
      message.error(error && error.message ? error.message : t('The reinsurance could not be loaded.'));
    } finally {
      setReinsuranceLoading(false);
    }
  }

  function refreshPolicy() {
    if (policyId <= 0) return;
    loadPolicy(policyId);
    if (reinsuranceLoaded) loadReinsurance(true);
  }

  function buildReceiptRows(loadedPolicy) {
    const payPlans = Array.isArray(loadedPolicy && loadedPolicy.PayPlan)
      ? loadedPolicy.PayPlan
      : [];
    const changes = Array.isArray(loadedPolicy && loadedPolicy.Changes)
      ? loadedPolicy.Changes.filter(change => Number(change && change.status) === 1)
      : [];

    const paymentGroups = {};
    payPlans.forEach(payPlan => {
      const groupId = payPlan && payPlan.changeId ? String(payPlan.changeId) : 'policy';
      const group = paymentGroups[groupId] || {
        receiptAmount: 0,
        paid: 0,
        start: null,
        end: null,
        source: []
      };
      const amount = Number(payPlan && (payPlan.expected || payPlan.minimum || 0)) || 0;
      const dueDate = payPlan && payPlan.dueDate;
      group.receiptAmount += amount;
      group.paid += Number(payPlan && payPlan.payed) || 0;
      group.start = group.start || dueDate;
      group.end = dueDate || group.end;
      group.source.push(payPlan);
      paymentGroups[groupId] = group;
    });

    function getBillValues(bill, fallback) {
      const currentBill = bill || {};
      const backup = fallback || {};
      const hasPremiumBreakdown = currentBill.coverages !== undefined
        || currentBill.surcharges !== undefined
        || currentBill.discounts !== undefined;
      const premium = Number(currentBill.coverages || 0) || 0;
      const discounts = Number(currentBill.discounts || 0) || 0;
      const surcharges = Number(currentBill.surcharges || 0) || 0;
      return {
        receiptNumber: currentBill.fiscalNumber || backup.fiscalNumber || '-',
        receiptAmount: Number(currentBill.anualTotal || currentBill.annualTotal || 0) || 0,
        premium,
        discounts,
        surcharges,
        grossPremium: hasPremiumBreakdown
          ? premium + discounts + surcharges
          : Number(currentBill.anualPremium || currentBill.annualPremium || 0) || 0,
        tax: Number(currentBill.tax || 0) || 0,
        expenses: Number(currentBill.fee || 0) || 0,
        paidAmount: Number(currentBill.amountPaid || 0) || 0
      };
    }

    function parseJsonObject(value) {
      if (value && typeof value === 'object') {
        return value;
      }

      if (typeof value !== 'string' || !value.trim()) {
        return {};
      }

      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    function parseJsonArray(value) {
      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value !== 'string' || !value.trim()) {
        return [];
      }

      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function isActualPlanEndorsement(change) {
      const additional = parseJsonObject(change && change.jAdditional);
      const type = String(additional.endorsementType || '').trim().toUpperCase();
      return [
        'CHANGE_COVERAGE_SURETY',
        'CHANGE_INSURED_SUM_SURETY',
        'PROCEEDORDER'
      ].indexOf(type) >= 0;
    }

    function installmentAmount(installment) {
      const minimum = Number(installment && installment.minimum);
      const expected = Number(installment && installment.expected);
      return Number.isFinite(minimum) && minimum !== 0
        ? minimum
        : (Number.isFinite(expected) ? expected : 0);
    }

    function buildMovementInstallments(change, currentPayPlans, billDiff, billFallback) {
      const oldPlan = parseJsonArray(change && change.jOldPayPlan);
      const oldById = {};
      oldPlan.forEach(installment => {
        const id = Number(installment && installment.id);
        if (id > 0) oldById[String(id)] = installment;
      });

      const changeId = String(change && change.id || '');
      const rows = (Array.isArray(currentPayPlans) ? currentPayPlans : []).reduce((result, current) => {
        const currentId = Number(current && current.id);
        if (currentId <= 0) return result;
        const previous = oldById[String(currentId)];
        const belongsToChange = String(current && current.changeId || '') === changeId
          || String(current && current.Change && current.Change.id || '') === changeId;
        const movement = previous
          ? installmentAmount(current) - installmentAmount(previous)
          : (belongsToChange ? installmentAmount(current) : 0);

        if (Math.abs(movement) < 0.005) return result;
        result.push({
          ...current,
          expected: Number(movement.toFixed(2)),
          minimum: Number(movement.toFixed(2)),
          payed: 0,
          cancellationDate: null
        });
        return result;
      }, []);

      if (rows.length) return rows;

      // Si no hay una relación histórica confiable, no mostramos el plan final
      // completo. Usamos únicamente sus cuotas reales y distribuimos el importe
      // diferencial del endoso; las cuotas sintéticas (id 0) quedan excluidas.
      const newPlan = parseJsonArray(change && change.jNewPayPlan)
        .filter(installment => Number(installment && installment.id) > 0);
      const sourcePlan = newPlan.length
        ? newPlan
        : (Array.isArray(currentPayPlans) ? currentPayPlans : [])
          .filter(installment => Number(installment && installment.id) > 0);
      if (!sourcePlan.length) return [];

      const snapshotDifferences = sourcePlan.map(current => {
        const previous = oldById[String(Number(current && current.id))];
        return previous
          ? installmentAmount(current) - installmentAmount(previous)
          : 0;
      });
      const differenceTotal = snapshotDifferences.reduce((total, amount) => total + amount, 0);
      const detail = parseJsonObject(change && change.jDetail);
      const diffBill = getBillValues(billDiff, billFallback);
      const movementTotal = Number(diffBill.receiptAmount)
        || Number(detail.annualPremiumDif)
        || Number(detail.changeCost)
        || 0;
      const targetTotal = Math.abs(differenceTotal) >= 0.005
        ? differenceTotal
        : movementTotal;
      if (Math.abs(targetTotal) < 0.005) return [];

      let distributed = 0;
      return sourcePlan.map((current, index) => {
        const isLast = index === sourcePlan.length - 1;
        const sourceAmount = installmentAmount(current);
        const sourceTotal = sourcePlan.reduce((total, row) => total + installmentAmount(row), 0);
        const amount = isLast
          ? Number((targetTotal - distributed).toFixed(2))
          : Number((targetTotal * (sourceTotal ? sourceAmount / sourceTotal : 1 / sourcePlan.length)).toFixed(2));
        distributed += amount;
        return {
          ...current,
          expected: amount,
          minimum: amount,
          payed: 0,
          cancellationDate: null
        };
      });
    }

    function distributeReceiptAmount(installments, receiptAmount) {
      const sourceRows = Array.isArray(installments) ? installments : [];
      const rows = sourceRows.filter(installment => {
        const minimum = Number(installment && installment.minimum);
        const expected = Number(installment && installment.expected);
        const baseAmount = Number.isFinite(minimum) && minimum !== 0
          ? minimum
          : (Number.isFinite(expected) ? expected : 0);
        const paid = Number(installment && installment.payed) || 0;

        return !(baseAmount > 0 && paid >= baseAmount);
      });

      if (rows.length === 0) {
        return [];
      }

      const sourceAmounts = rows.map(installment => {
        const minimum = Number(installment && installment.minimum);
        const expected = Number(installment && installment.expected);
        const baseAmount = Number.isFinite(minimum) && minimum !== 0
          ? minimum
          : (Number.isFinite(expected) ? expected : 0);
        const paid = Number(installment && installment.payed) || 0;
        return Math.max(baseAmount - paid, 0);
      });
      const sourceTotal = sourceAmounts.reduce((total, amount) => total + amount, 0);
      const paidTotal = sourceRows.reduce((total, installment) => {
        return total + (Number(installment && installment.payed) || 0);
      }, 0);
      const receiptValue = Number(receiptAmount) || 0;
      const targetTotal = receiptValue < 0
        ? receiptValue
        : Math.max(receiptValue - paidTotal, 0);

      if (sourceTotal === 0) {
        let distributedWithoutProportion = 0;
        return rows.map((installment, index) => {
          const isLast = index === rows.length - 1;
          const amount = isLast
            ? Number((targetTotal - distributedWithoutProportion).toFixed(2))
            : Number((targetTotal / rows.length).toFixed(2));
          distributedWithoutProportion += amount;
          const paid = Number(installment && installment.payed) || 0;
          const displayedAmount = paid + amount;
          return {
            ...installment,
            minimum: installment && installment.cancellationDate
              ? displayedAmount * -1
              : displayedAmount
          };
        });
      }

      let distributed = 0;
      return rows.map((installment, index) => {
        const isLast = index === rows.length - 1;
        const amount = isLast
          ? Number((targetTotal - distributed).toFixed(2))
          : Number((targetTotal * sourceAmounts[index] / sourceTotal).toFixed(2));

        distributed += amount;
        const paid = Number(installment && installment.payed) || 0;
        const displayedAmount = paid + amount;
        return {
          ...installment,
          minimum: installment && installment.cancellationDate
            ? displayedAmount * -1
            : displayedAmount
        };
      });
    }

    function keepInstallmentAmounts(installments) {
      const rows = Array.isArray(installments) ? installments : [];

      return rows.map(installment => {
        const minimum = Number(installment && installment.minimum);
        const expected = Number(installment && installment.expected);
        const amount = Number.isFinite(minimum) && minimum !== 0
          ? minimum
          : (Number.isFinite(expected) ? expected : 0);

        return {
          ...installment,
          minimum: installment && installment.cancellationDate ? amount * -1 : amount
        };
      });
    }

    function buildInvoiceRow(config) {
      const billValues = getBillValues(config.bill, config.fallback);
      const paymentGroup = config.paymentGroup || {};
      const receiptAmount = billValues.receiptAmount || paymentGroup.receiptAmount || 0;
      const paid = config.paidOverride !== undefined
        ? Number(config.paidOverride) || 0
        : (Math.abs(Number(paymentGroup.paid) || 0) > 0
          ? Number(paymentGroup.paid) || 0
          : billValues.paidAmount || 0);
      const isCancellation = !!config.isCancellation;
      const installments = config.movementInstallments
        ? (Array.isArray(config.installments) ? config.installments : [])
        : config.keepInstallmentAmounts
        ? keepInstallmentAmounts(config.installments)
        : distributeReceiptAmount(config.installments, receiptAmount);

      return {
        key: config.key,
        recordType: config.recordType,
        receiptNumber: billValues.receiptNumber,
        receiptAmount,
        paid,
        pending: receiptAmount - paid,
        startDate: config.startDate || paymentGroup.start,
        startDateWithoutTimezone: !!config.startDateWithoutTimezone,
        endDate: config.endDate || paymentGroup.end,
        movementType: config.movementType,
        premium: billValues.premium,
        discounts: billValues.discounts,
        surcharges: billValues.surcharges,
        grossPremium: billValues.grossPremium,
        tax: billValues.tax,
        expenses: billValues.expenses,
        incomeDate: config.incomeDate,
        id: config.id,
        changeId: config.changeId,
        status: config.status,
        source: config.source,
        installments,
        movementInstallments: !!config.movementInstallments,
        isCancellation,
        cancellationBreakdown: isCancellation
          ? buildCancellationBreakdown(billValues, paid)
          : null
      };
    }

    function isCancellationChange(change) {
      const discriminator = String(change && change.Discriminator || '').toUpperCase();
      return discriminator.indexOf('CANCELLATION') >= 0;
    }

    function getMovementType(change) {
      const discriminator = String(change && change.Discriminator || '');
      const discriminatorKey = discriminator.toUpperCase();
      const additional = parseJsonObject(change && change.jAdditional);
      const rawEndorsementType = String(additional.endorsementType || '').trim();
      const endorsementType = rawEndorsementType.toUpperCase();
      if (endorsementType === 'CHANGE_INSURED_SUM_SURETY') {
        return rawEndorsementType;
      }
      if (endorsementType === 'PROCEEDORDER') return 'ProceedOrder';
      if (endorsementType === 'CHANGE_COVERAGE_SURETY') return 'ChangeCoverageSurety';
      if (discriminatorKey !== 'COVERAGECHANGE' && discriminatorKey !== 'CAPITALCHANGE') {
        return discriminator || t('Endorsement');
      }
      return discriminator;
    }

    function buildCancellationBill(changeDetail) {
      const annualPremiumDif = Number(changeDetail && changeDetail.annualPremiumDif) || 0;
      const coveragesDif = Number(changeDetail && changeDetail.coveragesDif) || 0;

      return {
        anualPremium: annualPremiumDif,
        annualPremium: annualPremiumDif,
        anualTotal: annualPremiumDif,
        annualTotal: annualPremiumDif,
        coverages: coveragesDif,
        tax: annualPremiumDif - coveragesDif,
        discounts: 0,
        surcharges: 0,
        fee: 0,
        amountPaid: Number(changeDetail && changeDetail.amountPaid) || 0
      };
    }

    function buildCancellationBreakdown(billValues, paidValue) {
      const fields = ['receiptAmount', 'premium', 'discounts', 'surcharges', 'grossPremium', 'tax', 'expenses'];
      const totalValue = Number(billValues && billValues.receiptAmount) || 0;
      const totalBasis = Math.abs(totalValue);
      const paidTotal = Math.min(Math.abs(Number(paidValue) || 0), totalBasis);
      const componentFields = ['premium', 'discounts', 'surcharges', 'tax', 'expenses'];
      const componentBasis = componentFields.reduce((total, field) => (
        total + Math.abs(Number(billValues && billValues[field]) || 0)
      ), 0);
      const result = {};
      let distributedPaid = 0;
      const activeComponents = componentFields.filter(field => (
        Math.abs(Number(billValues && billValues[field]) || 0) > 0
      ));
      const lastComponent = activeComponents[activeComponents.length - 1] || null;

      componentFields.forEach(field => {
        const value = Number(billValues && billValues[field]) || 0;
        const absoluteValue = Math.abs(value);
        const rawPaidPart = componentBasis > 0
          ? paidTotal * absoluteValue / componentBasis
          : 0;
        const paidPart = field === lastComponent
          ? 0
          : Math.floor((rawPaidPart + 0.0000001) * 100) / 100;
        result[field] = { value, paid: paidPart };
        distributedPaid += paidPart;
      });

      if (lastComponent) {
        result[lastComponent].paid = Number((paidTotal - distributedPaid).toFixed(2));
      }

      fields.forEach(field => {
        const value = Number(billValues && billValues[field]) || 0;
        let paidPart = result[field] ? result[field].paid : 0;
        if (field === 'receiptAmount') paidPart = paidTotal;
        if (field === 'grossPremium') {
          paidPart = componentFields.slice(0, 3).reduce((total, component) => (
            total + (result[component] ? result[component].paid : 0)
          ), 0);
        }
        const signedPaidPart = value < 0 ? -paidPart : paidPart;
        result[field] = {
          net: Number((value - signedPaidPart).toFixed(2)),
          paid: paidPart
        };
      });

      return result;
    }

    function getChangePaidAmount(change, changeDetail) {
      const changePayPlan = parseJsonArray(change && change.jNewPayPlan);
      const paidOutsideCancellation = changePayPlan
        .filter(installment => String(installment && installment.concept || '').toUpperCase() !== 'CANCELLATION')
        .reduce((total, installment) => (
          total + (Number(installment && installment.payed) || 0)
        ), 0);
      if (Math.abs(paidOutsideCancellation) > 0) return paidOutsideCancellation;
      return Number(changeDetail && changeDetail.amountPaid) || 0;
    }

    const basePaymentGroup = paymentGroups.policy || {};
    const anniversaries = Array.isArray(loadedPolicy && loadedPolicy.Anniversaries)
      ? loadedPolicy.Anniversaries
      : [];
    const issuanceAnniversary = anniversaries
      .slice()
      .sort((left, right) => {
        const leftInitial = Number(left && left.contractYear) === 1 ? 0 : 1;
        const rightInitial = Number(right && right.contractYear) === 1 ? 0 : 1;
        if (leftInitial !== rightInitial) return leftInitial - rightInitial;
        return String(left && left.start || '').localeCompare(String(right && right.start || ''));
      })[0] || null;
    const anniversarySnapshot = parseJsonObject(issuanceAnniversary && issuanceAnniversary.jSnapshot);
    const snapshotBill = anniversarySnapshot && anniversarySnapshot.Bill
      ? anniversarySnapshot.Bill
      : anniversarySnapshot;
    const baseBill = snapshotBill && Object.keys(snapshotBill).length > 0
      ? snapshotBill
      : loadedPolicy && loadedPolicy.Bill;
    const policyVersion = Number(loadedPolicy && loadedPolicy.policyVersion) || 0;
    const baseRow = buildInvoiceRow({
      key: `policy-${loadedPolicy && loadedPolicy.id ? loadedPolicy.id : 'base'}`,
      recordType: 'Receipt',
      bill: baseBill,
      fallback: loadedPolicy,
      paymentGroup: basePaymentGroup,
      startDate: issuanceAnniversary && issuanceAnniversary.start || loadedPolicy && loadedPolicy.start,
      endDate: anniversarySnapshot && anniversarySnapshot.end || loadedPolicy && loadedPolicy.end,
      movementType: t(policyVersion > 0 ? 'Anniversary' : 'New Policy'),
      incomeDate: loadedPolicy && (loadedPolicy.activeDate || loadedPolicy.start),
      id: loadedPolicy && loadedPolicy.id,
      installments: anniversarySnapshot && anniversarySnapshot.PayPlan,
      source: loadedPolicy
    });

    const changeRows = changes.map((change, index) => {
      const changeId = change && change.id ? String(change.id) : '';
      const changeDetail = parseJsonObject(change && change.jDetail);
      const changeAdditional = parseJsonObject(change && change.jAdditional);
      const isCoverageTermChange = String(changeAdditional && changeAdditional.endorsementType || '')
        .trim()
        .toUpperCase() === 'CHANGE_COVERAGE_SURETY';
      const cancellationChange = isCancellationChange(change);
      const actualPlanEndorsement = isActualPlanEndorsement(change);
      const discriminator = String(change && change.Discriminator || '').toUpperCase();
      const informativeObjectChange = discriminator === 'INSUREDOBJECTCHANGE'
        || change && change.informative === true;
      return buildInvoiceRow({
        key: `change-${changeId || index}`,
        recordType: 'Endorsement',
        bill: cancellationChange
          ? buildCancellationBill(changeDetail)
          : change && change.BillDiff,
        fallback: change && change.Bill,
        // Informative changes must not inherit the policy payment plan amount.
        paymentGroup: informativeObjectChange ? {} : paymentGroups[changeId],
        startDate: isCoverageTermChange
          ? (changeDetail.policyStart || (change && (change.effectiveDate || change.executionDate)))
          : (change && (change.effectiveDate || change.executionDate)),
        startDateWithoutTimezone: isCoverageTermChange,
        endDate: changeDetail.policyEnd || (paymentGroups[changeId] && paymentGroups[changeId].end),
        movementType: change && getMovementType(change),
        incomeDate: change && change.executionDate,
        id: change && change.id,
        changeId: change && change.id,
        status: change && change.status,
        installments: actualPlanEndorsement
          ? buildMovementInstallments(change, payPlans, change && change.BillDiff, change && change.Bill)
          : parseJsonArray(change && change.jNewPayPlan),
        movementInstallments: actualPlanEndorsement,
        isCancellation: cancellationChange,
        paidOverride: cancellationChange
          ? getChangePaidAmount(change, changeDetail)
          : undefined,
        keepInstallmentAmounts: cancellationChange,
        source: change
      });
    });

    return [baseRow].concat(changeRows).sort((left, right) => {
      const leftDate = new Date(left.incomeDate || left.startDate || 0).getTime();
      const rightDate = new Date(right.incomeDate || right.startDate || 0).getTime();
      return leftDate - rightDate;
    });
  }

  function formatDate(value, includeTime) {
    const raw = String(value || '').trim();
    if (!raw) {
      return '-';
    }

    // All persisted dates are UTC. Date-only values are midnight UTC, so they
    // must follow the same browser-local conversion as timestamp values.
    const utcValue = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? `${raw}T00:00:00Z`
      : (/z$/i.test(raw) || /[+-]\d{2}:?\d{2}$/i.test(raw) ? raw : `${raw}Z`);
    const date = new Date(utcValue);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    if (!includeTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  function formatDateWithoutTimezone(value) {
    const raw = String(value || '').trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (!match) return '-';
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  function isLiteralCoverageTermReinsurance(record) {
    const type = String(record && record.tipo || '').trim().toUpperCase();
    return type === 'CHANGECOVERAGESURETY'
      || type === 'CHANGE_COVERAGE_SURETY'
      || type === 'PROCEEDORDER';
  }

  function formatMoney(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) {
      return '0.00';
    }

    const parts = amount.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${parts[0]}.${parts[1]}`;
  }

  function translateReinsuranceType(value) {
    const key = String(value || '').trim();
    const translations = {
      EMISION: 'Emisión',
      ANIVERSARIO: 'Aniversario',
      CANCELACION: 'Cancelación',
      'RETIRO DE CESION': 'Retiro de cesión',
      ENDOSO: 'Endoso',
      AddCoverageChange: 'Alta de cobertura',
      BeneficiaryChange: 'Cambio de beneficiarios',
      BenefitChange: 'Cambio de beneficio',
      CancellationChange: 'Cancelación',
      CapitalChange: 'Cambio de capital',
      CessionBeneficiaryChange: 'Cambio de beneficiario de cesión',
      ClauseChange: 'Cambio de cláusulas',
      ContingentBeneficiaryChange: 'Cambio de beneficiario contingente',
      CoverageChange: 'Cambio de coberturas',
      CoverageChangeTechData: 'Cambio de datos técnicos de cobertura',
      ExclusionChange: 'Cambio de exclusiones',
      FrequencyChange: 'Cambio de frecuencia',
      InformativeChange: 'Cambio informativo',
      InsuredObjectChange: 'Cambio de objeto asegurado',
      IntermediaryChange: 'Cambio de intermediario',
      LoadingChange: 'Recargo / Descuento',
      PaymentMethodChange: 'Cambio de medio de pago',
      PayPlanChange: 'Cambio de plan de pagos',
      PolicyholderChange: 'Cambio de tomador',
      PolicySurchargeChange: 'Cambio de recargos de póliza',
      ReinstatementChange: 'Rehabilitación',
      RemoveCoverageChange: 'Baja de cobertura',
      TemporalStatusChange: 'Cambio de estado temporal',
      TermChange: 'Cambio de vigencia',
      ProceedOrder: 'Orden de proceder',
      ChangeCoverageSurety: 'Cambio de vigencia de cobertura',
      CHANGE_COVERAGE_SURETY: 'Cambio de vigencia de cobertura',
      CHANGE_INSURED_SUM_SURETY: 'Cambio de suma de cobertura'
    };
    return translations[key] || (typeof t === 'function' && t(key) !== key ? t(key) : key) || '-';
  }

  function reinsuranceRemainder(total, parts) {
    const amount = Number(total || 0);
    const used = (parts || []).reduce((sum, part) => sum + (Number(part) || 0), 0);
    return amount - used;
  }

  function renderReinsuranceTotals(rows) {
    const totals = (rows || []).reduce((result, row) => {
      result.insuredSum += Number(row && row.sumaAsegurada100) || 0;
      result.cedantSum += Number(row && row.sumaRetenida) || 0;
      result.cededSum += Number(row && row.sumaCedida) || 0;
      result.retSum += Number(row && row.sumaRetenida) || 0;
      result.quotaSum += Number(row && row.sumaCuotaParte) || 0;
      result.excessSum += Number(row && row.sumaExcedente) || 0;
      result.facSum += Number(row && row.sumaFacultativa) || 0;
      result.froSum += reinsuranceRemainder(row && row.sumaCedida, [row && row.sumaCuotaParte, row && row.sumaExcedente, row && row.sumaFacultativa]);
      result.totalPremium += Number(row && row.primaSuscrita100) || 0;
      result.cedantPremium += Number(row && row.primaRetenida) || 0;
      result.cededPremium += Number(row && row.primaCedida) || 0;
      result.retPremium += Number(row && row.primaRetenida) || 0;
      result.quotaPremium += Number(row && row.primaCuotaParte) || 0;
      result.excessPremium += Number(row && row.primaExcedente) || 0;
      result.facPremium += Number(row && row.primaFacultativa) || 0;
      result.contractualCommission += Number(row && row.comisionContractual) || 0;
      result.quotaCommission += Number(row && row.comisionCuotaParte) || 0;
      result.excessCommission += Number(row && row.comisionExcedente) || 0;
      result.facCommission += Number(row && row.comisionFacultativa) || 0;
      result.totalTax += Number(row && row.impuesto) || 0;
      result.quotaTax += Number(row && row.impuestoCuotaParte) || 0;
      result.excessTax += Number(row && row.impuestoExcedente) || 0;
      result.facTax += Number(row && row.impuestoFacultativo) || 0;
      return result;
    }, {
      insuredSum: 0, cedantSum: 0, cededSum: 0, retSum: 0, quotaSum: 0,
      excessSum: 0, facSum: 0, totalPremium: 0, cedantPremium: 0, cededPremium: 0,
      retPremium: 0, quotaPremium: 0, excessPremium: 0, facPremium: 0,
      contractualCommission: 0, quotaCommission: 0, excessCommission: 0, facCommission: 0,
      totalTax: 0, quotaTax: 0, excessTax: 0, facTax: 0
    });
    const money = value => renderColoredMoney(value);
    const cells = [
      totals.insuredSum, totals.cedantSum, totals.cededSum, totals.retSum,
      totals.quotaSum, totals.excessSum, totals.facSum,
      totals.totalPremium, totals.cedantPremium, totals.cededPremium, totals.retPremium,
      totals.quotaPremium, totals.excessPremium, totals.facPremium,
      totals.contractualCommission, totals.quotaCommission, totals.excessCommission, totals.facCommission,
      totals.totalTax, totals.quotaTax, totals.excessTax, totals.facTax
    ];

    return (
      <Table.Summary>
        <Table.Summary.Row className="policy-billing-total-row">
          <Table.Summary.Cell index={0} colSpan={4}><strong>{t('Total')}</strong></Table.Summary.Cell>
          {cells.map((value, index) => (
            <Table.Summary.Cell key={index} index={index + 4} align="right">
              {money(value)}
            </Table.Summary.Cell>
          ))}
        </Table.Summary.Row>
      </Table.Summary>
    );
  }

  function reinsuranceColumns() {
    const money = value => renderColoredMoney(value);
    return [
      { title: t('Endorsement'), dataIndex: 'changeId', key: 'changeId', width: 95, align: 'center', render: value => value || '-' },
      { title: t('Type'), dataIndex: 'tipo', key: 'tipo', width: 150, ellipsis: true, render: value => {
        const label = translateReinsuranceType(value);
        return <Tooltip title={label}><span className="policy-billing-ellipsis">{label}</span></Tooltip>;
      } },
      { title: t('Start date'), dataIndex: 'fDesde', key: 'fDesde', width: 105, align: 'center', render: (value, record) => isLiteralCoverageTermReinsurance(record) ? formatDateWithoutTimezone(value) : formatDate(value) },
      { title: t('End date'), dataIndex: 'fHasta', key: 'fHasta', width: 105, align: 'center', render: value => formatDate(value) },
      {
        title: t('Sums'),
        children: [
          { title: t('Insured sum'), dataIndex: 'sumaAsegurada100', key: 'sumaAsegurada100', width: 125, align: 'right', render: money },
          { title: `${t('Sum')} ${t('Cedant')}`, dataIndex: 'sumaRetenida', key: 'sumaRetenida', width: 120, align: 'right', render: money },
          { title: t('Ceded sum'), dataIndex: 'sumaCedida', key: 'sumaCedida', width: 120, align: 'right', render: money },
          { title: 'RET', dataIndex: 'sumaRetenida', key: 'ret', width: 105, align: 'right', render: money },
          { title: 'Cuota Parte', dataIndex: 'sumaCuotaParte', key: 'cuotaParte', width: 120, align: 'right', render: money },
          { title: 'Excedente 1', dataIndex: 'sumaExcedente', key: 'excedente', width: 120, align: 'right', render: money },
          { title: 'FAC', dataIndex: 'sumaFacultativa', key: 'fac', width: 105, align: 'right', render: money }
        ]
      },
      {
        title: t('Premiums'),
        children: [
          { title: `${t('Total')} ${t('Premium')}`, dataIndex: 'primaSuscrita100', key: 'primaSuscrita100', width: 125, align: 'right', render: money },
          { title: `${t('Premium')} ${t('Cedant')}`, dataIndex: 'primaRetenida', key: 'primaRetenida', width: 120, align: 'right', render: money },
          { title: t('Ceded Premium'), dataIndex: 'primaCedida', key: 'primaCedida', width: 120, align: 'right', render: money },
          { title: 'RET', dataIndex: 'primaRetenida', key: 'retPremium', width: 105, align: 'right', render: money },
          { title: 'Cuota Parte', dataIndex: 'primaCuotaParte', key: 'cuotaPartePremium', width: 120, align: 'right', render: money },
          { title: 'Excedente 1', dataIndex: 'primaExcedente', key: 'excedentePremium', width: 120, align: 'right', render: money },
          { title: 'FAC', dataIndex: 'primaFacultativa', key: 'facPremium', width: 105, align: 'right', render: money }
        ]
      },
      {
        title: t('Commissions'),
        children: [
          { title: `${t('Total Commission')}`, dataIndex: 'comisionContractual', key: 'comisionContractual', width: 125, align: 'right', render: money },
          { title: 'Cuota Parte', dataIndex: 'comisionCuotaParte', key: 'comisionCuotaParte', width: 120, align: 'right', render: money },
          { title: 'Excedente 1', dataIndex: 'comisionExcedente', key: 'comisionExcedente', width: 120, align: 'right', render: money },
          { title: 'FAC', dataIndex: 'comisionFacultativa', key: 'comisionFacultativa', width: 105, align: 'right', render: money }
        ]
      },
      {
        title: t('Taxes'),
        children: [
          { title: `${t('Total')} ${t('Tax')}`, dataIndex: 'impuesto', key: 'impuesto', width: 105, align: 'right', render: money },
          { title: 'Cuota Parte', dataIndex: 'impuestoCuotaParte', key: 'impuestoCuotaParte', width: 120, align: 'right', render: money },
          { title: 'Excedente 1', dataIndex: 'impuestoExcedente', key: 'impuestoExcedente', width: 120, align: 'right', render: money },
          { title: 'FAC', dataIndex: 'impuestoFacultativo', key: 'impuestoFacultativo', width: 105, align: 'right', render: money }
        ]
      }
    ];
  }

  function renderColoredMoney(value) {
    const amount = Number(value || 0);
    const color = amount > 0
      ? '#237804'
      : amount < 0
        ? '#cf1322'
        : '#262626';

    return <span style={{ color }}>{formatMoney(value)}</span>;
  }

  function renderBillingAmount(value, record, fieldName) {
    if (!record || !record.isCancellation || !record.cancellationBreakdown) {
      return renderColoredMoney(value);
    }

    const breakdown = record.cancellationBreakdown[fieldName] || {
      net: Number(value) || 0,
      paid: 0
    };

    return (
      <div className="policy-billing-cancellation-amount">
        <div>{renderColoredMoney(breakdown.net)}</div>
        <div className="policy-billing-cancellation-paid">
          {t('Paid')}: {formatMoney(breakdown.paid)}
        </div>
      </div>
    );
  }

  function renderTotals(rows) {
    const totals = (rows || []).reduce((result, row) => {
      result.receiptAmount += Number(row && row.receiptAmount) || 0;
      result.paid += Number(row && row.paid) || 0;
      result.pending += Number(row && row.pending) || 0;
      result.premium += Number(row && row.premium) || 0;
      result.discounts += Number(row && row.discounts) || 0;
      result.surcharges += Number(row && row.surcharges) || 0;
      result.grossPremium += Number(row && row.grossPremium) || 0;
      result.tax += Number(row && row.tax) || 0;
      result.expenses += Number(row && row.expenses) || 0;
      return result;
    }, {
      receiptAmount: 0,
      paid: 0,
      pending: 0,
      premium: 0,
      discounts: 0,
      surcharges: 0,
      grossPremium: 0,
      tax: 0,
      expenses: 0
    });

    return (
      <Table.Summary>
        <Table.Summary.Row className="policy-billing-total-row">
          <Table.Summary.Cell index={0} colSpan={4}>
            <strong>{t('Total')}</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">{renderColoredMoney(totals.receiptAmount)}</Table.Summary.Cell>
          <Table.Summary.Cell index={5} />
          <Table.Summary.Cell index={6} />
          <Table.Summary.Cell index={7} />
          <Table.Summary.Cell index={8} align="right">{renderColoredMoney(totals.premium)}</Table.Summary.Cell>
          <Table.Summary.Cell index={9} align="right">{renderColoredMoney(totals.discounts)}</Table.Summary.Cell>
          <Table.Summary.Cell index={10} align="right">{renderColoredMoney(totals.surcharges)}</Table.Summary.Cell>
          <Table.Summary.Cell index={11} align="right">{renderColoredMoney(totals.grossPremium)}</Table.Summary.Cell>
          <Table.Summary.Cell index={12} align="right">{renderColoredMoney(totals.tax)}</Table.Summary.Cell>
          <Table.Summary.Cell index={13} align="right">{renderColoredMoney(totals.expenses)}</Table.Summary.Cell>
          <Table.Summary.Cell index={14} />
        </Table.Summary.Row>
      </Table.Summary>
    );
  }

  function getSortedInstallments(receipt) {
    const installments = receipt && Array.isArray(receipt.installments)
      ? receipt.installments
      : [];

    return installments.slice().sort((left, right) => {
      const leftNumber = Number(left && left.numberInYear) || 0;
      const rightNumber = Number(right && right.numberInYear) || 0;
      return leftNumber - rightNumber;
    });
  }

  function getBillingRowClass(record) {
    if (record && record.recordType === 'Receipt') {
      return 'policy-billing-row-new';
    }

    const movementType = String(record && record.movementType || '').toUpperCase();
    if (movementType.indexOf('CANCELLATION') >= 0) {
      return 'policy-billing-row-cancellation';
    }

    return 'policy-billing-row-endorsement';
  }

  function renderInstallmentTotals(rows) {
    const totalMinimum = (rows || []).reduce((total, row) => {
      return total + (Number(row && row.minimum) || 0);
    }, 0);

    return (
      <Table.Summary>
        <Table.Summary.Row className="policy-billing-installment-total-row">
          <Table.Summary.Cell index={0} colSpan={3}>
            <strong>{t('Total')}</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">
            {renderColoredMoney(totalMinimum)}
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  }

  function openDetail(receipt) {
    setSelectedReceipt(receipt);
    setDetailVisible(true);
  }

  function closeDetail() {
    setDetailVisible(false);
    setSelectedReceipt(null);
  }

  const columns = [
    {
      title: t('Details'),
      key: 'detail',
      width: 90,
      fixed: 'left',
      render: (_, record) => (
        <Button type="link" onClick={() => openDetail(record)}>
          {t('View')}
        </Button>
      )
    },
    { title: t('Type'), dataIndex: 'recordType', key: 'recordType', width: 70, align: 'center', render: value => t(value) },
    { title: t('Id'), dataIndex: 'id', key: 'id', width: 55, align: 'center' },
    { title: t('Receipt number'), dataIndex: 'receiptNumber', key: 'receiptNumber', width: 120, align: 'center' },
    {
      title: t('Receipt amount'),
      dataIndex: 'receiptAmount',
      key: 'receiptAmount',
      width: 130,
      align: 'right',
      render: (value, record) => renderBillingAmount(value, record, 'receiptAmount')
    },
    {
      title: t('Start date'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 105,
      align: 'center',
      render: (value, record) => record && record.startDateWithoutTimezone
        ? formatDateWithoutTimezone(value)
        : formatDate(value)
    },
    {
      title: t('End date'),
      dataIndex: 'endDate',
      key: 'endDate',
      width: 105,
      align: 'center',
      render: value => formatDate(value)
    },
    {
      title: t('Type'),
      dataIndex: 'movementType',
      key: 'movementType',
      width: 220,
      ellipsis: true,
      render: value => {
        const label = value ? t(String(value)) : '-';
        return (
          <Tooltip title={label}>
            <span className="policy-billing-ellipsis">{label}</span>
          </Tooltip>
        );
      }
    },
    { title: t('Premium'), dataIndex: 'premium', key: 'premium', width: 110, align: 'right', render: (value, record) => renderBillingAmount(value, record, 'premium') },
    { title: t('Discounts'), dataIndex: 'discounts', key: 'discounts', width: 110, align: 'right', render: (value, record) => renderBillingAmount(value, record, 'discounts') },
    { title: t('Surcharges'), dataIndex: 'surcharges', key: 'surcharges', width: 110, align: 'right', render: (value, record) => renderBillingAmount(value, record, 'surcharges') },
    { title: t('Gross premium'), dataIndex: 'grossPremium', key: 'grossPremium', width: 120, align: 'right', render: (value, record) => renderBillingAmount(value, record, 'grossPremium') },
    { title: t('Tax'), dataIndex: 'tax', key: 'tax', width: 100, align: 'right', render: (value, record) => renderBillingAmount(value, record, 'tax') },
    { title: t('Expenses'), dataIndex: 'expenses', key: 'expenses', width: 100, align: 'right', render: (value, record) => renderBillingAmount(value, record, 'expenses') },
    { title: t('Income date'), dataIndex: 'incomeDate', key: 'incomeDate', width: 135, align: 'center', render: value => formatDate(value, true) }
  ];

  const installmentColumns = [
    { title: t('Id'), dataIndex: 'id', key: 'id', width: 90 },
    { title: t('Installment number'), dataIndex: 'numberInYear', key: 'numberInYear', width: 150, align: 'center' },
    { title: t('Due date'), dataIndex: 'dueDate', key: 'dueDate', width: 150, render: value => formatDate(value) },
    {
      title: selectedReceipt && selectedReceipt.movementInstallments ? t('Variación') : t('Minimum'),
      dataIndex: 'minimum',
      key: 'minimum',
      width: 130,
      align: 'right',
      render: value => renderColoredMoney(value)
    }
  ];

  return (
    <DefaultPage
      title={policy ? `${t('Policy billing')}: ${policy.code || policyId}` : t('Policy billing')}
      subTitle={policy ? `${t('Currency')}: ${policy.currency || '-'}` : t('Receipts and movements')}
      icon="file-text"
      extra={(
        <span className="policy-billing-actions">
          <Button type="primary" onClick={refreshPolicy} loading={loading || reinsuranceLoading}>
            <RefreshIcon /> {t('Actualizar')}
          </Button>
          <Button type="default" className="policy-billing-back" href={policyHref}>
            <BackIcon /> {t('Back')}
          </Button>
        </span>
      )}
    >
      <Tabs
        activeKey={activeMainTab}
        onChange={key => {
          setActiveMainTab(key);
          if (key === 'reinsurance') loadReinsurance(false);
        }}
      >
        <TabPane key="movements" tab={t('Movements')}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              {loading ? (
                <Spin />
              ) : receipts.length === 0 ? (
                <Empty description={t('No receipts or endorsements to display.')} />
              ) : (
                <Table
                  rowKey="key"
                  columns={columns}
                  dataSource={receipts}
                  loading={loading}
                  size="small"
                  className="policy-billing-table"
                  rowClassName={getBillingRowClass}
                  pagination={{ pageSize: 25, showSizeChanger: false }}
                  scroll={{ x: 1200 }}
                  summary={() => renderTotals(receipts)}
                />
              )}
            </Col>
          </Row>
        </TabPane>
        <TabPane key="reinsurance" tab={t('Reinsurance')}>
          {!reinsuranceLoaded && !reinsuranceLoading ? (
            <Empty description={t('Select the tab to load reinsurance movements.')} />
          ) : (
            <Table
              rowKey={(row, index) => [row.id, row.changeId, row.movKey, index].join('-')}
              columns={reinsuranceColumns()}
              dataSource={reinsuranceRows}
              loading={reinsuranceLoading}
              size="small"
              className="policy-billing-table"
              pagination={{ pageSize: 25, showSizeChanger: false }}
              scroll={{ x: 2500 }}
              summary={rows => renderReinsuranceTotals(rows)}
              locale={{ emptyText: t('No reinsurance movements to display.') }}
            />
          )}
        </TabPane>
      </Tabs>

      <Modal
        title={selectedReceipt ? `${t('Details')}: ${t(selectedReceipt.recordType)}` : t('Receipt details')}
        open={detailVisible}
        onCancel={closeDetail}
        footer={null}
        width={850}
      >
        {selectedReceipt ? (
          <Tabs defaultActiveKey="summary">
            <TabPane
              key="summary"
              tab={<span><SummaryIcon /> {t('Summary')}</span>}
            >
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label={t('Receipt number')}>{selectedReceipt.receiptNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('Endorsement')}>{selectedReceipt.changeId || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('Movement type')}>
                  {selectedReceipt.movementType ? t(String(selectedReceipt.movementType)) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('Receipt amount')}>{formatMoney(selectedReceipt.receiptAmount)}</Descriptions.Item>
                <Descriptions.Item label={t('Start date')}>{formatDate(selectedReceipt.startDate)}</Descriptions.Item>
                <Descriptions.Item label={t('End date')}>{formatDate(selectedReceipt.endDate)}</Descriptions.Item>
                <Descriptions.Item label={t('Premium')}>{formatMoney(selectedReceipt.premium)}</Descriptions.Item>
                <Descriptions.Item label={t('Discounts')}>{formatMoney(selectedReceipt.discounts)}</Descriptions.Item>
                <Descriptions.Item label={t('Surcharges')}>{formatMoney(selectedReceipt.surcharges)}</Descriptions.Item>
                <Descriptions.Item label={t('Gross premium')}>{formatMoney(selectedReceipt.grossPremium)}</Descriptions.Item>
                <Descriptions.Item label={t('Tax')}>{formatMoney(selectedReceipt.tax)}</Descriptions.Item>
                <Descriptions.Item label={t('Expenses')}>{formatMoney(selectedReceipt.expenses)}</Descriptions.Item>
                <Descriptions.Item label={t('Income date')}>{formatDate(selectedReceipt.incomeDate, true)}</Descriptions.Item>
              </Descriptions>
            </TabPane>
            <TabPane
              key="installments"
              tab={<span><InstallmentIcon /> {t('Installment image')}</span>}
            >
              <Table
                rowKey={(installment, index) => String(installment && installment.id ? installment.id : index)}
                columns={installmentColumns}
                dataSource={getSortedInstallments(selectedReceipt)}
                pagination={false}
                size="small"
                className="policy-billing-installments"
                summary={rows => renderInstallmentTotals(rows)}
              />
            </TabPane>
          </Tabs>
        ) : null}
      </Modal>
    </DefaultPage>
  );
}
