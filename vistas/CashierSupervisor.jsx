() => {
  const {
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Descriptions,
    Drawer: Panel,
    Form,
    Dropdown,
    Layout,
    InputNumber,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    message
  } = A;
  const { Option } = Select;

  const tabIconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1em',
    height: '1em',
    marginRight: 6,
    flex: 'none',
    verticalAlign: 'middle',
    lineHeight: 1,
    color: 'inherit'
  };

  const TabIcon = ({ label, children }) => (
    <span role="img" aria-label={label} className="anticon" style={tabIconStyle}>
      {children}
    </span>
  );

  const SearchIcon = () => (
    <span role="img" aria-label="search" className="anticon anticon-search">
      <svg viewBox="64 64 896 896" focusable="false" data-icon="search" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1C567.4 143.2 492.2 112 412 112s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412s31.3 155.5 87.9 212.1C256.6 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path>
      </svg>
    </span>
  );

  const CashierIcon = () => (
    <TabIcon label="cash desks">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M768 160H256c-53 0-96 43-96 96v416c0 53 43 96 96 96h512c53 0 96-43 96-96V256c0-53-43-96-96-96zm-16 112v80H240v-80h512zm0 128v272H240V400h512z"></path>
        <path d="M304 456h176v72H304zm240 0h112v72H544zM304 576h112v72H304zm160 0h192v72H464z"></path>
      </svg>
    </TabIcon>
  );

  const SummaryIcon = () => (
    <TabIcon label="cash desk details">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 80c203.9 0 368 164.1 368 368S715.9 880 512 880 144 715.9 144 512 308.1 144 512 144z"></path>
        <path d="M512 272a56 56 0 1 0 0 112 56 56 0 0 0 0-112zm-48 176h96v272h-96z"></path>
      </svg>
    </TabIcon>
  );

  const PremiumIcon = () => (
    <TabIcon label="paid premiums">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384S723.7 128 512 128zm0 80c167.7 0 304 136.3 304 304S679.7 816 512 816 208 679.7 208 512 344.3 208 512 208z"></path>
        <path d="M464 336h96l-24 256h-48zM424 624h176v64H424z"></path>
      </svg>
    </TabIcon>
  );

  const DepositIcon = () => (
    <TabIcon label="premium deposits">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 144L320 336h112v224h160V336h112L512 144z"></path>
        <path d="M256 688h512v80H256z"></path>
      </svg>
    </TabIcon>
  );

  const ReportIcon = () => (
    <TabIcon label="reports">
      <svg viewBox="64 64 896 896" width="1.15em" height="1.15em" fill="currentColor" aria-hidden="true">
        <path d="M240 160h320c8.5 0 16.6 3.4 22.6 9.4l160 160c6 6 9.4 14.1 9.4 22.6v448c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V192c0-17.7 14.3-32 32-32zm320 44.1V352h147.9L560 204.1zM304 448h352v56H304zm0 112h352v56H304zm0 112h224v56H304z"></path>
      </svg>
    </TabIcon>
  );

  const RefreshIcon = () => (
    <TabIcon label="refresh">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M480 128c-194.4 0-352 157.6-352 352s157.6 352 352 352c98.1 0 187-40.1 250.8-104.8l-56.6-56.6C626.8 718.6 557.3 752 480 752c-150.2 0-272-121.8-272-272s121.8-272 272-272c73.4 0 139.9 29.1 189 76.4L576 368h224V144l-74.2 74.2C662.6 162.5 577.1 128 480 128z"></path>
      </svg>
    </TabIcon>
  );

  const ExportIcon = () => (
    <TabIcon label="export">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M480 96l192 192h-96v224h-192V288h-96L480 96zm-288 544h96v96h384v-96h96v192H192V640z"></path>
      </svg>
    </TabIcon>
  );

  const [form] = Form.useForm();
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [branches, setBranches] = React.useState([]);
  const [cashiers, setCashiers] = React.useState([]);
  const [cashierLoading, setCashierLoading] = React.useState(false);
  const [selectedCashierRow, setSelectedCashierRow] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('cash-desks');
  const [transferRows, setTransferRows] = React.useState([]);
  const [transferLoading, setTransferLoading] = React.useState(false);
  const [transferPagination, setTransferPagination] = React.useState({ current: 1, pageSize: 25 });
  const [transferTotal, setTransferTotal] = React.useState(0);
  const [transferScrollY, setTransferScrollY] = React.useState(420);
  const [movementRows, setMovementRows] = React.useState([]);
  const [movementLoading, setMovementLoading] = React.useState(false);
  const [movementExportLoading, setMovementExportLoading] = React.useState(false);
  const [movementPagination, setMovementPagination] = React.useState({ current: 1, pageSize: 15 });
  const [movementTotal, setMovementTotal] = React.useState(0);
  const [movementFilters, setMovementFilters] = React.useState({});
  const [movementFilterVisible, setMovementFilterVisible] = React.useState(false);
  const [movementFilterForm] = Form.useForm();
  const [movementSelectedRowKeys, setMovementSelectedRowKeys] = React.useState([]);
  const [movementReports, setMovementReports] = React.useState([]);
  const [movementIncomeTypes, setMovementIncomeTypes] = React.useState([]);
  const [paidPremiumRows, setPaidPremiumRows] = React.useState([]);
  const [paidPremiumLoading, setPaidPremiumLoading] = React.useState(false);
  const [paidPremiumExportLoading, setPaidPremiumExportLoading] = React.useState(false);
  const [paidPremiumPagination, setPaidPremiumPagination] = React.useState({ current: 1, pageSize: 15 });
  const [paidPremiumTotal, setPaidPremiumTotal] = React.useState(0);
  const cashierSearchTimeoutRef = React.useRef(null);
  const shellRef = React.useRef(null);
  const mainViewportRef = React.useRef(null);

  React.useEffect(() => {
    const styleId = 'cashier-supervisor-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .cashier-supervisor-view .cashier-supervisor-toolbar {
        background: #f5f7fb;
        border: 1px solid #e6ebf2;
        border-radius: 6px;
        padding: 10px 12px;
        margin-bottom: 14px;
      }

      .cashier-supervisor-view .ant-form-item {
        margin-bottom: 10px;
      }

      .cashier-supervisor-view .cashier-supervisor-table .ant-table-thead > tr > th,
      .cashier-supervisor-view .cashier-supervisor-table .ant-table-tbody > tr > td {
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-status-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        padding: 9px 12px;
        border: 1px solid #e6ebf2;
        border-radius: 6px;
        background: linear-gradient(90deg, #fbfcff 0%, #f5f7fb 100%);
        height: 100%;
        overflow: hidden;
      }

      .cashier-supervisor-status-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .cashier-supervisor-status-item strong {
        color: #595959;
      }

      .cashier-supervisor-status-open {
        color: #237804;
        background: #f6ffed;
        border-color: #b7eb8f;
      }

      .cashier-supervisor-status-closed {
        color: #ad4e00;
        background: #fff7e6;
        border-color: #ffd591;
      }

      .cashier-supervisor-view .cashier-supervisor-selected-row > td {
        background: #e6f4ff !important;
      }

      .cashier-supervisor-view .ant-table-tbody > tr {
        cursor: pointer;
      }

      .cashier-supervisor-view .ant-table-tbody > tr:hover > td {
        background: #f5faff !important;
      }

      .cashier-supervisor-shell {
        --cashier-supervisor-north-height: 44px;
        height: 100dvh;
        width: 100%;
        min-height: 0;
        overflow: hidden;
        padding: 4px 8px 8px 8px;
        box-sizing: border-box;
      }

      .cashier-supervisor-layout {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: transparent;
      }

      .cashier-supervisor-north {
        flex: 0 0 var(--cashier-supervisor-north-height);
        min-height: 0;
        margin-bottom: 8px;
      }

      .cashier-supervisor-center {
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .cashier-supervisor-view {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .cashier-supervisor-main {
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .cashier-supervisor-view .cashier-supervisor-toolbar {
        flex: 0 0 auto;
      }

      .cashier-supervisor-tab-bar {
        display: flex;
        flex: 0 0 auto;
        gap: 2px;
        border-bottom: 1px solid #d9d9d9;
      }

      .cashier-supervisor-tab {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid transparent;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: #262626;
        cursor: pointer;
        padding: 9px 14px;
        font: inherit;
        line-height: 20px;
      }

      .cashier-supervisor-tab:hover {
        color: #1677ff;
        background: #fafafa;
      }

      .cashier-supervisor-tab:disabled {
        color: #bfbfbf;
        cursor: not-allowed;
        background: transparent;
      }

      .cashier-supervisor-tab.active {
        color: #1677ff;
        border-bottom-color: #1677ff;
      }

      .cashier-supervisor-tab-content {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: auto;
      }

      .cashier-supervisor-tab-content > .ant-card {
        flex: 1 1 auto;
        min-height: 0;
      }

      .cashier-supervisor-view .ant-tabs {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .cashier-supervisor-view .ant-tabs-content-holder {
        flex: 1 1 auto;
        min-height: 0;
      }

      .cashier-supervisor-view .ant-tabs-content {
        height: 100%;
        min-height: 0;
      }

      .cashier-supervisor-view .ant-tabs-tabpane {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .cashier-supervisor-view .ant-tabs-tabpane > .ant-card {
        flex: 1 1 auto;
        min-height: 0;
      }

      .cashier-supervisor-view .ant-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .cashier-supervisor-view .ant-card-body {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .cashier-supervisor-view .cashier-supervisor-table {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }

      .cashier-supervisor-view .cashier-supervisor-table .ant-table-pagination {
        flex: 0 0 auto;
        margin: 4px 0 0 0 !important;
      }

      .cashier-supervisor-view .cashier-supervisor-table .ant-table-body {
        overflow: auto !important;
      }

      .cashier-supervisor-paid-premium-summary {
        padding: 8px 14px 10px 34px;
        background: #fafafa;
        font-size: 12px;
        line-height: 20px;
      }

      .cashier-supervisor-paid-premium-summary-title {
        font-weight: 600;
        color: #262626;
      }

      .cashier-supervisor-paid-premium-summary-line {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        align-items: center;
        color: #434343;
      }

      .cashier-supervisor-paid-premium-summary-complementary {
        margin-top: 2px;
      }

      .cashier-supervisor-reference-cell {
        display: block;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: help;
      }

      .cashier-supervisor-destination-cell {
        display: block;
        max-width: 145px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: help;
      }

      .cashier-supervisor-user-email {
        color: #1677ff;
        cursor: pointer;
        white-space: normal;
      }

      .cashier-supervisor-payment-methods {
        font-size: 11px;
        line-height: 1.2;
        white-space: normal;
        word-break: break-word;
        cursor: pointer;
        color: #1677ff;
      }

      .cashier-supervisor-shell .ant-checkbox-inner {
        border-color: #5b6573;
      }

      .cashier-supervisor-shell .ant-checkbox:hover .ant-checkbox-inner,
      .cashier-supervisor-shell .ant-checkbox-wrapper:hover .ant-checkbox-inner {
        border-color: #1f2937;
      }

      .cashier-supervisor-shell .ant-radio-inner {
        border-color: #5b6573;
        border-width: 2px;
      }

      .cashier-supervisor-shell .ant-radio:hover .ant-radio-inner,
      .cashier-supervisor-shell .ant-radio-wrapper:hover .ant-radio-inner {
        border-color: #1f2937;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  React.useEffect(() => {
    loadBranches();
    loadSupervisorMovementIncomeTypes();
    loadSupervisorMovementReports();
    applyCurrentMonthDefaults();

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const layoutContent = document.querySelector('.ant-layout-content');
    const layoutRoot = document.querySelector('.ant-layout');
    const previousLayoutContentOverflow = layoutContent ? layoutContent.style.overflow : '';
    const previousLayoutRootOverflow = layoutRoot ? layoutRoot.style.overflow : '';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (layoutContent) {
      layoutContent.style.overflow = 'hidden';
    }
    if (layoutRoot) {
      layoutRoot.style.overflow = 'hidden';
    }

    const updateScrollHeight = () => {
      const availableHeight = Math.max(320, Math.floor(window.innerHeight - 12));
      const computed = Math.max(180, Math.floor(availableHeight - 360));
      setTransferScrollY(computed);
    };

    updateScrollHeight();
    const resizeObserver = typeof ResizeObserver !== 'undefined' && shellRef.current
      ? new ResizeObserver(updateScrollHeight)
      : null;

    if (resizeObserver && shellRef.current) {
      resizeObserver.observe(shellRef.current);
    }

    window.addEventListener('resize', updateScrollHeight);

    return () => {
      if (cashierSearchTimeoutRef.current) {
        clearTimeout(cashierSearchTimeoutRef.current);
      }
      window.removeEventListener('resize', updateScrollHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (layoutContent) {
        layoutContent.style.overflow = previousLayoutContentOverflow;
      }
      if (layoutRoot) {
        layoutRoot.style.overflow = previousLayoutRootOverflow;
      }
    };
  }, []);

  React.useEffect(() => {
    setMovementRows([]);
    setMovementTotal(0);
    setMovementSelectedRowKeys([]);
    setPaidPremiumRows([]);
    setPaidPremiumTotal(0);
    if (selectedCashierRow && selectedCashierRow.id) {
      loadSupervisorMovements({
        pagination: { current: 1, pageSize: movementPagination.pageSize },
        filters: movementFilters
      });
      loadSupervisorPaidPremiums({
        pagination: { current: 1, pageSize: paidPremiumPagination.pageSize }
      });
    }
  }, [selectedCashierRow && selectedCashierRow.id]);

  React.useEffect(() => {
    if (!selectedCashierRow && activeTab !== 'cash-desks') {
      setActiveTab('cash-desks');
    }
  }, [selectedCashierRow, activeTab]);

  const premiumRows = [
    { id: 1, payment: 'ROC-000001', policy: 'POL-000001', installment: 1, premium: 120, expenses: 0, tax: 8.4, interest: 0, total: 128.4 },
    { id: 2, payment: 'ROC-000002', policy: 'POL-000002', installment: 1, premium: 95, expenses: 0, tax: 6.65, interest: 0, total: 101.65 }
  ];

  const depositRows = [
    { id: 1, paymentMethod: 'Cash', document: 'DOC-001', bank: 'Sample bank', balance: 50, amount: 180.5 },
    { id: 2, paymentMethod: 'Transfer', document: 'DOC-002', bank: 'Sample bank', balance: 0, amount: 100 }
  ];

  function formatMoney(value) {
    const number = Number(value || 0);
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString('es-ES');
  }

  function getSupervisorMovementChildren(group) {
    if (!group) return [];
    if (Array.isArray(group.AllocationMovements)) return group.AllocationMovements;
    if (Array.isArray(group.movements)) return group.movements;
    if (Array.isArray(group.Movements)) return group.Movements;
    return [];
  }

  function getSupervisorMovementFirst(group) {
    return getSupervisorMovementChildren(group)[0] || group || {};
  }

  function getSupervisorMovementValues(group, field) {
    const values = [group].concat(getSupervisorMovementChildren(group))
      .map(item => item && item[field])
      .filter(value => value !== undefined && value !== null && String(value).trim() !== '')
      .map(value => String(value));
    return Array.from(new Set(values));
  }

  function getSupervisorMovementNames(group, relation, field) {
    const values = [group].concat(getSupervisorMovementChildren(group))
      .map(item => item && item[relation] && item[relation][field])
      .filter(value => value !== undefined && value !== null && String(value).trim() !== '')
      .map(value => String(value));
    return Array.from(new Set(values));
  }

  function getSupervisorDestinationAccounts(group) {
    const values = [group].concat(getSupervisorMovementChildren(group))
      .map(item => {
        const account = item && item.DestinationAccount;
        const id = Number(account && (account.id || account.accountId) || item && item.destinationAccountId || 0);
        const accNo = account && account.accNo ? String(account.accNo) : '';
        const name = account && account.name ? String(account.name) : '';
        return { id, accNo, name };
      })
      .filter(item => item.id > 0 || item.accNo || item.name);

    return values.filter((value, index, items) => items.findIndex(item =>
      (value.id > 0 && item.id === value.id) ||
      (value.id <= 0 && value.accNo && item.accNo === value.accNo) ||
      (value.id <= 0 && !value.accNo && item.name === value.name)
    ) === index);
  }

  function getSupervisorPolicyIds(group) {
    const values = [];
    const add = value => {
      const id = Number(value);
      if (Number.isFinite(id) && id > 0 && values.indexOf(id) < 0) values.push(id);
    };

    [group].concat(getSupervisorMovementChildren(group)).forEach(item => {
      add(item && item.lifePolicyId);
      add(item && item.policyId);

      const allocations = [item && item.Allocation, item && item.allocation]
        .filter(allocation => allocation);
      allocations.forEach(allocation => {
        const installments = allocation.InstallmentPremiums || allocation.installmentPremiums;
        if (Array.isArray(installments)) {
          installments.forEach(installment => add(installment && installment.lifePolicyId));
        }
      });

      const installments = item && (item.InstallmentPremiums || item.installmentPremiums);
      if (Array.isArray(installments)) {
        installments.forEach(installment => add(installment && installment.lifePolicyId));
      }
    });
    return values;
  }

  function renderSupervisorMovementValues(group, field) {
    const values = getSupervisorMovementValues(group, field);
    return values.length ? values.join(', ') : '-';
  }

  function renderSupervisorMovementReference(group) {
    const reference = renderSupervisorMovementValues(group, 'concept');
    if (reference === '-') return reference;

    return (
      <Tooltip title={reference}>
        <span className="cashier-supervisor-reference-cell">{reference}</span>
      </Tooltip>
    );
  }

  function renderSupervisorMovementUser(group) {
    const values = [group].concat(getSupervisorMovementChildren(group))
      .map(item => String(item && item.user || '').trim())
      .filter(value => value);
    const uniqueValues = Array.from(new Set(values));
    if (uniqueValues.length === 0) return '-';

    const displayValues = uniqueValues.map(value => value.split('@')[0]);
    return (
      <Tooltip trigger={['click']} title={uniqueValues.join(', ')}>
        <span className="cashier-supervisor-user-email">
          {displayValues.join(', ')}
        </span>
      </Tooltip>
    );
  }

  function renderSupervisorPolicies(group) {
    const policies = getSupervisorPolicyIds(group);
    if (!policies.length) return '-';
    return (
      <div style={{ fontSize: 11, lineHeight: 1.2 }}>
        {policies.map(policyId => (
          <div key={policyId}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto', lineHeight: 1.2, fontSize: 11 }}
              onClick={() => window.open(`#/lifepolicy/${policyId}`, '_blank', 'noopener,noreferrer')}
            >
              {policyId}
            </Button>
          </div>
        ))}
      </div>
    );
  }

  function renderSupervisorMovementStatus(group) {
    const item = getSupervisorMovementFirst(group);
    const reverted = Boolean(item && (item.reversalDate || item.reversalOfId || item.reversed));
    return <Tag color={reverted ? 'error' : 'success'}>{t(reverted ? 'Reverted' : 'Executed')}</Tag>;
  }

  function renderSupervisorMovementDestination(group) {
    const accounts = getSupervisorDestinationAccounts(group);
    if (accounts.length > 0) {
      const labels = accounts.map(account => account.name || account.accNo || account.id);
      return (
        <Tooltip title={labels.join(', ')}>
          <div className="cashier-supervisor-destination-cell">
            {accounts.map((account, index) => {
              const label = account.name || account.accNo || account.id;
              const content = account.id > 0
                ? (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto', lineHeight: 1.2, display: 'inline', maxWidth: '100%' }}
                    onClick={() => window.open(`#/account/${account.id}`, '_blank', 'noopener,noreferrer')}
                  >
                    {label}
                  </Button>
                )
                : label;

              return (
                <span key={`${account.id || account.accNo || label}-${index}`}>
                  {index > 0 ? ', ' : ''}{content}
                </span>
              );
            })}
          </div>
        </Tooltip>
      );
    }

    return renderSupervisorMovementValues(group, 'destinationAccountId');
  }

  function getSupervisorPaymentMethodValues(group) {
    const values = [];
    const items = [group].concat(getSupervisorMovementChildren(group));

    items.forEach(item => {
      const splitPayments = item && Array.isArray(item.SplitPayments) ? item.SplitPayments : [];
      splitPayments.forEach(payment => {
        const name = payment && (payment.paymentMethodName || (payment.PaymentMethod && payment.PaymentMethod.name));
        if (name) values.push(String(name));
      });

      const directName = item && item.PaymentMethod && item.PaymentMethod.name;
      if (directName) values.push(String(directName));
    });

    return Array.from(new Set(values));
  }

  function getSupervisorPaymentMethodAbbreviation(value) {
    const normalized = String(value || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (normalized === 'CHEQUE') return 'CHE';
    if (normalized === 'TARJETA DE CREDITO') return 'TC';
    if (normalized === 'EFECTIVO') return 'EFE';

    return normalized.replace(/[^A-Z0-9]/g, '').slice(0, 3) || '-';
  }

  function renderSupervisorMovementPaymentMethods(group) {
    const values = getSupervisorPaymentMethodValues(group);
    if (values.length === 0) return '-';

    return (
      <Tooltip trigger={['click']} title={values.join(', ')}>
        <span className="cashier-supervisor-payment-methods">
          {values.map(getSupervisorPaymentMethodAbbreviation).join(', ')}
        </span>
      </Tooltip>
    );
  }

  function getSupervisorAllocationIds(group) {
    const values = [group].concat(getSupervisorMovementChildren(group))
      .map(item => Number(item && (item.allocationId || item.Allocation && item.Allocation.id) || 0))
      .filter(value => Number.isFinite(value) && value > 0);
    return Array.from(new Set(values));
  }

  function renderSupervisorAllocations(group) {
    const allocations = getSupervisorAllocationIds(group);
    if (!allocations.length) return '-';

    return allocations.map(allocationId => (
      <div key={allocationId}>
        <Button
          type="link"
          size="small"
          style={{ padding: 0, height: 'auto', lineHeight: 1.2, fontSize: 11 }}
          onClick={() => window.open(`#/allocation?id=${allocationId}`, '_blank', 'noopener,noreferrer')}
        >
          {allocationId}
        </Button>
      </div>
    ));
  }

  function getSupervisorAppliedInstallments(group) {
    const values = [];
    const items = [group].concat(getSupervisorMovementChildren(group));

    items.forEach(item => {
      const allocations = [item && item.Allocation, item && item.allocation]
        .filter(allocation => allocation);
      allocations.forEach(allocation => {
        const installments = allocation.InstallmentPremiums || allocation.installmentPremiums;
        if (Array.isArray(installments)) values.push(...installments);
      });

      const installments = item && (item.InstallmentPremiums || item.installmentPremiums);
      if (Array.isArray(installments)) values.push(...installments);
    });

    return values.filter((value, index, items) => items.findIndex(item =>
      (value && value.id && item && item.id === value.id) ||
      (value && !value.id && item && item.payPlanId === value.payPlanId && item.lifePolicyId === value.lifePolicyId)
    ) === index);
  }

  const paidPremiumInstallmentColumns = [
    { title: t('Installment'), key: 'installment', width: 90, align: 'center', render: (_, item) => item && (item.numberInYear || item.number || item.payPlanId) || '-' },
    {
      title: t('Policy ID'),
      key: 'policyId',
      width: 100,
      align: 'center',
      render: (_, item) => {
        const policyId = Number(item && item.lifePolicyId);
        return policyId > 0
          ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto', fontSize: 11 }}
              onClick={() => window.open(`#/lifepolicy/${policyId}`, '_blank', 'noopener,noreferrer')}
            >
              {policyId}
            </Button>
          )
          : '-';
      }
    },
    { title: t('Due date'), dataIndex: 'dueDate', key: 'dueDate', width: 115, align: 'center', render: formatDate },
    {
      title: t('Amount applied'),
      key: 'amountApplied',
      width: 125,
      align: 'right',
      render: (_, item) => formatMoney(item && item.amount !== undefined && item.amount !== null
        ? item.amount
        : item && item.minimum !== undefined && item.minimum !== null ? item.minimum : 0)
    }
  ];

  function renderPaidPremiumSummary(group) {
    const installments = getSupervisorAppliedInstallments(group);
    const sortedInstallments = installments.slice().sort((first, second) => {
      const firstPolicyId = Number(first && first.lifePolicyId || 0);
      const secondPolicyId = Number(second && second.lifePolicyId || 0);
      if (firstPolicyId !== secondPolicyId) return firstPolicyId - secondPolicyId;

      const firstReference = Number(first && (first.id || first.payPlanId || first.numberInYear) || 0);
      const secondReference = Number(second && (second.id || second.payPlanId || second.numberInYear) || 0);
      return firstReference - secondReference;
    });
    const currencyValues = getSupervisorMovementValues(group, 'currency');
    const currency = currencyValues.length ? currencyValues[0] : '';

    return (
      <div className="cashier-supervisor-paid-premium-summary">
        <div className="cashier-supervisor-paid-premium-summary-title">
          {t('Installment Premiums')}:
        </div>
        {sortedInstallments.map((installment, index) => {
          const amount = Number(installment && installment.moneyInAmount !== undefined
            ? installment.moneyInAmount
            : 0) || 0;
          const policyId = Number(installment && installment.lifePolicyId || 0);
          const reference = installment && (installment.id || installment.payPlanId || installment.numberInYear);

          return (
            <div key={`${reference || 'installment'}-${index}`} className="cashier-supervisor-paid-premium-summary-line">
              <span>{t('Ref')}:{reference || '-'}</span>
              <span>{t('Amount')}:{formatMoney(amount)}</span>
              <span>{currency}</span>
              <span>{t('Policy')}:</span>
              {policyId > 0 ? (
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: 'auto', lineHeight: 1.2, fontSize: 11 }}
                  onClick={() => window.open(`#/lifepolicy/${policyId}`, '_blank', 'noopener,noreferrer')}
                >
                  {policyId}
                </Button>
              ) : '-'}
            </div>
          );
        })}
        <div className="cashier-supervisor-paid-premium-summary-title cashier-supervisor-paid-premium-summary-complementary">
          {t('Supplementary Premiums')}:
        </div>
      </div>
    );
  }

  function renderSupervisorMovementIncomeTypes(group) {
    const values = getSupervisorMovementNames(group, 'IncomeType', 'name');
    return values.length ? values.join(', ') : renderSupervisorMovementValues(group, 'incomeType');
  }

  function getSupervisorMovementFilterValues() {
    const values = movementFilterForm.getFieldsValue();
    return {
      pending: values && values.pending === true,
      transferId: values && values.transferId,
      amount: values && values.amount,
      incomeType: values && values.incomeType
    };
  }

  function loadSupervisorMovementReports() {
    exe('RepoConfigProfile', { operation: 'GET', filter: null, size: 0, page: 0 })
      .then(response => {
        if (!response || response.ok === false) throw new Error(response && response.msg ? response.msg : t('Reports could not be loaded.'));
        const profile = getRows(response)[0] || {};
        let config = profile.configJson || profile.config || {};
        if (typeof config === 'string') {
          try { config = JSON.parse(config); } catch (error) { config = {}; }
        }
        const reports = config && config.Cashier && Array.isArray(config.Cashier.reports) ? config.Cashier.reports : [];
        setMovementReports(reports.filter(report => report && report.name && report.report));
      })
      .catch(error => {
        setMovementReports([]);
        message.error(error && error.message ? error.message : String(error));
      });
  }

  function loadSupervisorMovementIncomeTypes() {
    exe('RepoIncomeTypeCatalog', { operation: 'GET' })
      .then(response => {
        if (!response || response.ok === false) throw new Error(response && response.msg ? response.msg : t('Income types could not be loaded.'));
        setMovementIncomeTypes(getRows(response).map(item => ({
          value: item && item.code,
          label: getTrimmedString(item && (item.name || item.code))
        })).filter(item => item.value !== undefined && item.value !== null && item.value !== ''));
      })
      .catch(error => {
        setMovementIncomeTypes([]);
        message.error(error && error.message ? error.message : String(error));
      });
  }

  function loadSupervisorMovements(params = {}) {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      setMovementRows([]);
      setMovementTotal(0);
      return;
    }

    const pagination = params.pagination || movementPagination;
    const filters = params.filters || movementFilters;
    const rawAmount = filters && filters.amount;
    const amount = Number(rawAmount);
    const hasAmount = rawAmount !== undefined && rawAmount !== null && rawAmount !== '' && Number.isFinite(amount);
    const transferId = Number(filters && filters.transferId);

    setMovementLoading(true);
    exe('FilterTransfer', {
      workspaceId,
      groupByAllocation: true,
      size: Number(pagination.pageSize) || 15,
      page: Math.max((Number(pagination.current) || 1) - 1, 0),
      currency: null,
      allocated: null,
      external: null,
      executed: filters && filters.pending === true ? false : null,
      concept: null,
      minAmount: hasAmount ? amount : null,
      maxAmount: hasAmount ? amount : null,
      month: null,
      claimPaymentId: null,
      allocationId: null,
      fromDate: null,
      toDate: null,
      id: Number.isInteger(transferId) && transferId > 0 ? transferId : null,
      paymentMethod: null,
      incomeType: getTrimmedString(filters && filters.incomeType) || null
    })
      .then(response => {
        if (!response || response.ok === false) throw new Error(response && response.msg ? response.msg : t('Movements could not be loaded.'));
        const rows = getRows(response).filter(group => !(filters && filters.pending === true && getSupervisorMovementFirst(group).reversalDate));
        setMovementRows(rows);
        setMovementTotal(getResponseTotal(response, rows));
        setMovementPagination({ current: Number(pagination.current) || 1, pageSize: Number(pagination.pageSize) || 15 });
        setMovementSelectedRowKeys([]);
      })
      .catch(error => {
        setMovementRows([]);
        setMovementTotal(0);
        setMovementSelectedRowKeys([]);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setMovementLoading(false));
  }

  function loadSupervisorPaidPremiums(params = {}) {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      setPaidPremiumRows([]);
      setPaidPremiumTotal(0);
      return;
    }

    const pagination = params.pagination || paidPremiumPagination;
    setPaidPremiumLoading(true);
    exe('FilterTransfer', {
      workspaceId,
      groupByAllocation: true,
      size: Number(pagination.pageSize) || 15,
      page: Math.max((Number(pagination.current) || 1) - 1, 0),
      currency: null,
      allocated: true,
      external: null,
      executed: true,
      concept: null,
      minAmount: null,
      maxAmount: null,
      month: null,
      claimPaymentId: null,
      allocationId: null,
      fromDate: null,
      toDate: null,
      id: null,
      paymentMethod: null,
      incomeType: null
    })
      .then(response => {
        if (!response || response.ok === false) throw new Error(response && response.msg ? response.msg : t('Paid premiums could not be loaded.'));
        const rows = getRows(response).filter(group => getSupervisorAllocationIds(group).length > 0);
        setPaidPremiumRows(rows);
        setPaidPremiumTotal(getResponseTotal(response, rows));
        setPaidPremiumPagination({ current: Number(pagination.current) || 1, pageSize: Number(pagination.pageSize) || 15 });
      })
      .catch(error => {
        setPaidPremiumRows([]);
        setPaidPremiumTotal(0);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setPaidPremiumLoading(false));
  }

  async function ensureSupervisorExcelLibrary() {
    if (typeof XLSX !== 'undefined') return true;

    const response = await exe('ExeChain', {
      chain: 'cmdLoadLibrariesGroupedBordereau',
      context: '{}'
    });
    const libraries = response && response.outData ? response.outData : {};
    const xlsxLibrary = libraries.XLSX || libraries.xlsx || libraries.xlsxJs;

    if (typeof xlsxLibrary === 'string') {
      eval(xlsxLibrary);
    } else if (xlsxLibrary) {
      window.XLSX = xlsxLibrary;
    }

    return typeof XLSX !== 'undefined';
  }

  function getSupervisorExportDestination(group) {
    return getSupervisorDestinationAccounts(group)
      .map(account => account.name || account.accNo || account.id)
      .join(', ');
  }

  async function exportPaidPremiums() {
    if (!paidPremiumRows.length) {
      message.info(t('There are no records to export.'));
      return;
    }

    setPaidPremiumExportLoading(true);
    try {
      if (!await ensureSupervisorExcelLibrary()) {
        throw new Error(t('Excel export is not available.'));
      }

      const exportRows = paidPremiumRows.map(group => {
        const item = getSupervisorMovementFirst(group);
        return {
          [t('ID')]: item.id || group.id || '',
          [t('Date')]: formatDate(group.date || item.date),
          [t('Status')]: item.reversalDate || item.reversalOfId || item.reversed
            ? t('Reverted')
            : t('Executed'),
          [t('Origin')]: getSupervisorMovementValues(group, 'sourceExternal').join(', '),
          [t('Destination')]: getSupervisorExportDestination(group),
          [t('Reference')]: getSupervisorMovementValues(group, 'concept').join(', '),
          [t('Received')]: Number(item.amount || 0),
          [t('Amount')]: Number(group.amount || item.amount || 0),
          [t('Currency')]: getSupervisorMovementValues(group, 'currency').join(', '),
          [t('Payment method')]: getSupervisorPaymentMethodValues(group).join(', '),
          [t('Type')]: getSupervisorMovementNames(group, 'IncomeType', 'name').join(', ') || getSupervisorMovementValues(group, 'incomeType').join(', '),
          [t('Policy')]: getSupervisorPolicyIds(group).join(', '),
          [t('Cashier ID')]: group.transferWorkspaceId || item.transferWorkspaceId || '',
          [t('User')]: getSupervisorMovementValues(group, 'user').join(', '),
          [t('Allocation')]: getSupervisorAllocationIds(group).join(', ')
        };
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Paid premiums');
      XLSX.writeFile(workbook, `paid-premiums-${Date.now()}.xlsx`);
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setPaidPremiumExportLoading(false);
    }
  }

  async function exportSupervisorMovements() {
    if (!movementRows.length) {
      message.info(t('There are no records to export.'));
      return;
    }

    setMovementExportLoading(true);
    try {
      if (!await ensureSupervisorExcelLibrary()) {
        throw new Error(t('Excel export is not available.'));
      }

      const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
      const filters = movementFilters || {};
      const rawAmount = filters.amount;
      const amount = Number(rawAmount);
      const hasAmount = rawAmount !== undefined && rawAmount !== null && rawAmount !== '' && Number.isFinite(amount);
      const transferId = Number(filters.transferId);
      const exportResponse = await exe('FilterTransfer', {
        workspaceId,
        groupByAllocation: true,
        size: Math.max(Number(movementTotal) || movementRows.length, movementRows.length),
        page: 0,
        currency: null,
        allocated: null,
        external: null,
        executed: filters.pending === true ? false : null,
        concept: null,
        minAmount: hasAmount ? amount : null,
        maxAmount: hasAmount ? amount : null,
        month: null,
        claimPaymentId: null,
        allocationId: null,
        fromDate: null,
        toDate: null,
        id: Number.isInteger(transferId) && transferId > 0 ? transferId : null,
        paymentMethod: null,
        incomeType: getTrimmedString(filters.incomeType) || null
      });
      if (!exportResponse || exportResponse.ok === false) {
        throw new Error(exportResponse && exportResponse.msg ? exportResponse.msg : t('Movements could not be loaded.'));
      }

      const exportGroups = getRows(exportResponse)
        .filter(group => !(filters.pending === true && getSupervisorMovementFirst(group).reversalDate));
      const exportRows = exportGroups.map(group => {
        const item = getSupervisorMovementFirst(group);
        return {
          [t('ID')]: item.id || group.id || '',
          [t('Date')]: formatDate(group.date || item.date),
          [t('Status')]: item.reversalDate || item.reversalOfId || item.reversed
            ? t('Reverted')
            : t('Executed'),
          [t('Origin')]: getSupervisorMovementValues(group, 'sourceExternal').join(', '),
          [t('Destination')]: getSupervisorExportDestination(group),
          [t('Reference')]: getSupervisorMovementValues(group, 'concept').join(', '),
          [t('Received')]: Number(item.amount || 0),
          [t('Amount')]: Number(group.amount || item.amount || 0),
          [t('Currency')]: getSupervisorMovementValues(group, 'currency').join(', '),
          [t('Payment method')]: getSupervisorPaymentMethodValues(group).join(', '),
          [t('Type')]: getSupervisorMovementNames(group, 'IncomeType', 'name').join(', ') || getSupervisorMovementValues(group, 'incomeType').join(', '),
          [t('Policy')]: getSupervisorPolicyIds(group).join(', '),
          [t('Cashier ID')]: group.transferWorkspaceId || item.transferWorkspaceId || '',
          [t('User')]: getSupervisorMovementValues(group, 'user').join(', '),
          [t('Allocation')]: getSupervisorAllocationIds(group).join(', ')
        };
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Cash desk details');
      XLSX.writeFile(workbook, `cash-desk-details-${Date.now()}.xlsx`);
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setMovementExportLoading(false);
    }
  }

  function openSupervisorMovementReport(report) {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    const reportName = getTrimmedString(report && report.report);
    if (!workspaceId || !reportName) return;
    const ids = movementSelectedRowKeys.map(value => Number(value)).filter(value => Number.isFinite(value) && value > 0);
    const transferId = ids.length ? `[${ids.join(',')}]` : '0';
    window.open(`#/reportview/${reportName}/workspaceId=${workspaceId}&transferId=${transferId}`, '_blank', 'noopener,noreferrer');
  }

  function getMonthRange(dateLike) {
    const base = dateLike ? new Date(dateLike) : new Date();
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return { start, end };
  }

  function formatDateForFilter(dateLike) {
    const date = dateLike && typeof dateLike.toDate === 'function'
      ? dateLike.toDate()
      : new Date(dateLike);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getDatePickerValue(dateLike) {
    if (typeof moment !== 'undefined') {
      return moment(dateLike);
    }

    return new Date(dateLike);
  }

  function getRows(response) {
    const data = response && response.outData;
    if (Array.isArray(data)) {
      return data;
    }
    if (data) {
      return [data];
    }
    return [];
  }

  function getTrimmedString(value) {
    return String(value === undefined || value === null ? '' : value).trim();
  }

  function escapeSqlString(value) {
    return getTrimmedString(value).replace(/'/g, "''");
  }

  function getBranchLabel(record) {
    if (!record) return '-';
    const branch = record.Branch || {};
    return getTrimmedString(branch.name || branch.code || record.branchCode || '-');
  }

  function getCashierLabel(record) {
    if (!record) return '-';
    return getTrimmedString(record.user || '-');
  }

  function loadBranches() {
    exe('RepoBranch', { operation: 'GET' })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Branches could not be loaded.'));
        }

        const rows = getRows(response);
        const options = rows.map(item => {
          const code = getTrimmedString(item && (item.code || item.id || item.branchCode));
          const name = getTrimmedString(item && (item.name || item.description || item.xdescripcion_l || code));
          return {
            value: code,
            label: name || code
          };
        }).filter(item => item.value);

        setBranches(options);
      })
      .catch(error => {
        setBranches([]);
        message.error(error && error.message ? error.message : String(error));
      });
  }

  function applyCurrentMonthDefaults() {
    const range = getMonthRange(new Date());
    form.setFieldsValue({
      dateFrom: getDatePickerValue(range.start),
      dateTo: getDatePickerValue(range.end)
    });
    loadTransferWorkspaces({
      pagination: transferPagination,
      values: {
        dateFrom: range.start,
        dateTo: range.end
      }
    });
  }

  function searchCashiers(value) {
    const text = getTrimmedString(value);

    if (cashierSearchTimeoutRef.current) {
      clearTimeout(cashierSearchTimeoutRef.current);
    }

    if (text.length < 3) {
      setCashiers([]);
      setCashierLoading(false);
      return;
    }

    cashierSearchTimeoutRef.current = setTimeout(() => {
      setCashierLoading(true);
      exe('GetUsers', {
        filter: `email like '${escapeSqlString(text)}%'`
      })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Cashiers could not be loaded.'));
          }

          const rows = getRows(response);
          const options = rows.map(item => {
            const email = getTrimmedString(item && (item.email || item.usrEmail || item.userEmail));
            const name = getTrimmedString(item && (item.name || item.fullName || item.userName || item.username || email));
            return {
              value: email,
              label: name && name !== email ? `${name} (${email})` : email
            };
          }).filter(item => item.value);

          setCashiers(options);
        })
        .catch(error => {
          setCashiers([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => {
          setCashierLoading(false);
        });
    }, 350);
  }

  function normalizeRows(response) {
    const data = response && response.outData;
    if (Array.isArray(data)) {
      return data;
    }
    if (data) {
      return [data];
    }
    return [];
  }

  function getResponseTotal(response, rows) {
    const directTotal = Number(response && response.total);
    if (Number.isFinite(directTotal) && directTotal >= 0) {
      return directTotal;
    }

    const nestedTotal = Number(response && response.outData && response.outData.total);
    if (Number.isFinite(nestedTotal) && nestedTotal >= 0) {
      return nestedTotal;
    }

    return Array.isArray(rows) ? rows.length : 0;
  }

  function buildTransferWorkspaceFilter(values) {
    const filters = [];
    const branchCode = getTrimmedString(values && values.branch);
    const cashier = getTrimmedString(values && values.cashier);
    const cashDeskId = Number(values && values.cashDeskId);
    const status = getTrimmedString(values && values.status);
    const dateFrom = values && values.dateFrom;
    const dateTo = values && values.dateTo;

    if (branchCode) {
      filters.push(`branchCode='${escapeSqlString(branchCode)}'`);
    }

    if (cashier) {
      filters.push(`[user]='${escapeSqlString(cashier)}'`);
    }

    if (Number.isFinite(cashDeskId) && cashDeskId > 0) {
      filters.push(`id=${cashDeskId}`);
    }

    if (status === '0' || status === '1') {
      filters.push(`closed=${Number(status)}`);
    }

    const fromText = formatDateForFilter(dateFrom);
    const toText = formatDateForFilter(dateTo);
    if (fromText && toText) {
      filters.push(`[date] >= '${fromText}' AND [date] <= '${toText}'`);
    } else if (fromText) {
      filters.push(`[date] >= '${fromText}'`);
    } else if (toText) {
      filters.push(`[date] <= '${toText}'`);
    }

    return filters.join(' AND ');
  }

  function loadTransferWorkspaces(params = {}) {
    const values = params.values || form.getFieldsValue();
    const pagination = params.pagination || transferPagination;
    const filter = buildTransferWorkspaceFilter(values);
    const pageSize = Number(pagination && pagination.pageSize) || 25;
    const currentPage = Number(pagination && pagination.current) || 1;
    const backendPage = Math.max(currentPage - 1, 0);

    setTransferLoading(true);

    exe('RepoTransferWorkspace', {
      operation: 'GET',
      include: ['Branch'],
      filter: filter || null,
      size: pageSize,
      page: backendPage
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Cash desks could not be loaded.'));
        }

        const rows = normalizeRows(response);
        const total = getResponseTotal(response, rows);
        setTransferRows(rows);
        setTransferTotal(total);
        setTransferPagination({
          current: currentPage,
          pageSize: pageSize
        });

        // The supervisor view starts without a selected cash desk.
        // Selection is made explicitly by clicking a row.
        setSelectedCashierRow(null);
      })
      .catch(error => {
        setTransferRows([]);
        setSelectedCashierRow(null);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => {
        setTransferLoading(false);
      });
  }

  function handleSearchTransfers() {
    setSearchVisible(false);
    loadTransferWorkspaces({
      pagination: { current: 1, pageSize: transferPagination.pageSize },
      values: form.getFieldsValue()
    });
  }

  function handleClearTransfers() {
    form.resetFields();
    applyCurrentMonthDefaults();
    setSearchVisible(false);
  }

  function handleOpenCashDeskAudit() {
    if (!selectedCashierRow || !selectedCashierRow.id) {
      message.warning(t('Please select a cash desk first'));
      return;
    }

    const workspaceId = selectedCashierRow.id;
    const url = `${window.location.origin}/#/reportview/rptArqueoDeCajaDetallado/workspaceId=${workspaceId}&transferId=0`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleOpenCashDeskDetailedBreakdown() {
    if (!selectedCashierRow || !selectedCashierRow.id) {
      message.warning(t('Please select a cash desk first'));
      return;
    }

    const workspaceId = selectedCashierRow.id;
    const url = `${window.location.origin}/#/reportview/ReporteDeIngresosCaja/workspaceId=${workspaceId}&transferId=0`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleOpenDetailedCashDeskAuditReport() {
    if (!selectedCashierRow || !selectedCashierRow.id) {
      message.warning(t('Please select a cash desk first'));
      return;
    }

    const workspaceId = selectedCashierRow.id;
    const url = `${window.location.origin}/#/reportview/${encodeURIComponent('Arqueo de Caja Detallado')}/TransferWorkSpaceId=${workspaceId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleTableChange(pagination) {
    loadTransferWorkspaces({
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize
      },
      values: form.getFieldsValue()
    });
  }

  const cashierColumns = [
    { title: t('Cash desk id'), dataIndex: 'id', key: 'id', width: 110, align: 'center' },
    {
      title: t('Branch'),
      dataIndex: 'branchCode',
      key: 'branchCode',
      width: 180,
      render: (_, record) => getBranchLabel(record)
    },
    {
      title: t('Cashier'),
      dataIndex: 'user',
      key: 'user',
      width: 280,
      render: (_, record) => getCashierLabel(record)
    },
    {
      title: t('Cash date'),
      dataIndex: 'date',
      key: 'date',
      width: 170,
      align: 'center',
      render: value => formatDate(value)
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (_, record) => {
        const status = record && record.closed ? 'Closed' : 'Open';
        return (
          <Tag className={status === 'Open' ? 'cashier-supervisor-status-open' : 'cashier-supervisor-status-closed'}>
            {t(status)}
          </Tag>
        );
      }
    }
  ];

  const supervisorMovementColumns = [
    {
      title: t('ID'),
      key: 'id',
      width: 90,
      align: 'center',
      render: (_, group) => getSupervisorMovementFirst(group).id || group.id || '-'
    },
    { title: t('Date'), dataIndex: 'date', key: 'date', width: 105, render: formatDate },
    { title: t('Status'), key: 'status', width: 95, render: (_, group) => renderSupervisorMovementStatus(group) },
    { title: t('Origin'), key: 'origin', width: 125, render: (_, group) => renderSupervisorMovementValues(group, 'sourceExternal') },
    { title: t('Destination'), key: 'destination', width: 170, render: (_, group) => renderSupervisorMovementDestination(group) },
    { title: t('Reference'), key: 'reference', width: 180, render: (_, group) => renderSupervisorMovementReference(group) },
    { title: t('Received'), key: 'received', width: 105, align: 'right', render: (_, group) => formatMoney(getSupervisorMovementFirst(group).amount) },
    { title: t('Amount'), key: 'amount', width: 105, align: 'right', render: (_, group) => formatMoney(group.amount || getSupervisorMovementFirst(group).amount) },
    { title: t('Currency'), key: 'currency', width: 80, align: 'center', render: (_, group) => renderSupervisorMovementValues(group, 'currency') },
    { title: t('Payment method'), key: 'paymentMethod', width: 120, render: (_, group) => renderSupervisorMovementPaymentMethods(group) },
    { title: t('Type'), key: 'type', width: 180, render: (_, group) => renderSupervisorMovementIncomeTypes(group) },
    { title: t('Policy'), key: 'policy', width: 110, align: 'center', render: (_, group) => renderSupervisorPolicies(group) },
    { title: t('Cashier ID'), dataIndex: 'transferWorkspaceId', key: 'transferWorkspaceId', width: 90, align: 'center' },
    { title: t('User'), key: 'user', width: 160, render: (_, group) => renderSupervisorMovementUser(group) },
    { title: t('Allocation'), key: 'allocation', width: 90, align: 'center', render: (_, group) => renderSupervisorAllocations(group) }
  ];

  const supervisorMovementDetailColumns = supervisorMovementColumns;

  const premiumColumns = [
    { title: t('Payment'), dataIndex: 'payment', key: 'payment', width: 130 },
    { title: t('Policy'), dataIndex: 'policy', key: 'policy', width: 130 },
    { title: t('Installment'), dataIndex: 'installment', key: 'installment', width: 110, align: 'center' },
    { title: t('Premium'), dataIndex: 'premium', key: 'premium', width: 110, align: 'right', render: formatMoney },
    { title: t('Expenses'), dataIndex: 'expenses', key: 'expenses', width: 110, align: 'right', render: formatMoney },
    { title: t('Tax'), dataIndex: 'tax', key: 'tax', width: 110, align: 'right', render: formatMoney },
    { title: t('Interest'), dataIndex: 'interest', key: 'interest', width: 110, align: 'right', render: formatMoney },
    { title: t('Total'), dataIndex: 'total', key: 'total', width: 120, align: 'right', render: formatMoney }
  ];

  const depositColumns = [
    { title: t('Payment method'), dataIndex: 'paymentMethod', key: 'paymentMethod', width: 160 },
    { title: t('Document'), dataIndex: 'document', key: 'document', width: 140 },
    { title: t('Bank'), dataIndex: 'bank', key: 'bank', width: 160 },
    { title: t('Balance in favor'), dataIndex: 'balance', key: 'balance', width: 150, align: 'right', render: formatMoney },
    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 130, align: 'right', render: formatMoney }
  ];

  function applySupervisorMovementFilters(values) {
    const filters = {
      pending: values && values.pending === true,
      transferId: values && values.transferId,
      amount: values && values.amount,
      incomeType: values && values.incomeType
    };
    setMovementFilters(filters);
    setMovementFilterVisible(false);
    loadSupervisorMovements({
      filters,
      pagination: { current: 1, pageSize: movementPagination.pageSize }
    });
  }

  function clearSupervisorMovementFilters() {
    movementFilterForm.resetFields();
    applySupervisorMovementFilters({});
  }

  const supervisorMovementContent = (
    <Spin spinning={movementExportLoading} tip={t('Exporting...')}>
    <Card size="small">
      <div className="cashier-supervisor-toolbar cashier-supervisor-spaced-toolbar">
        <Button
          className="cashier-supervisor-outline-button"
          onClick={() => setMovementFilterVisible(true)}
          disabled={!selectedCashierRow}
        >
          {t('Filter')}
        </Button>
        <Dropdown
          trigger={['click']}
          placement="bottomLeft"
          menu={{
            items: movementReports.map((report, index) => ({
              key: `${report.report}-${index}`,
              label: t(report.name),
              onClick: () => openSupervisorMovementReport(report)
            }))
          }}
        >
          <Button className="cashier-supervisor-outline-button" disabled={!selectedCashierRow || movementReports.length === 0}>
            <ReportIcon /> {t('Reports')}
          </Button>
        </Dropdown>
        <Button
          className="cashier-supervisor-outline-button"
          onClick={() => loadSupervisorMovements({ pagination: { current: 1, pageSize: movementPagination.pageSize } })}
          loading={movementLoading}
          disabled={!selectedCashierRow}
        >
          {t('Refresh')}
        </Button>
        <Button
          type="primary"
          onClick={exportSupervisorMovements}
          loading={movementExportLoading}
          disabled={!selectedCashierRow || movementRows.length === 0}
        >
          <ExportIcon /> {t('Export')}
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={supervisorMovementColumns}
        dataSource={movementRows}
        size="small"
        bordered
        className="cashier-supervisor-table"
        loading={movementLoading}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: movementSelectedRowKeys,
          onChange: keys => setMovementSelectedRowKeys(keys.length > 0 ? [keys[0]] : [])
        }}
        pagination={{
          current: movementPagination.current,
          pageSize: movementPagination.pageSize,
          total: movementTotal,
          showSizeChanger: true,
          pageSizeOptions: ['15', '25', '50', '100']
        }}
        onChange={pagination => loadSupervisorMovements({
          filters: movementFilters,
          pagination: { current: pagination.current, pageSize: pagination.pageSize }
        })}
        onRow={record => ({
          onClick: event => {
            if (event.target.closest('button, a, input, .ant-checkbox-wrapper, .ant-radio-wrapper')) return;
            const key = record && record.id;
            if (key !== undefined && key !== null) {
              setMovementSelectedRowKeys([key]);
            }
          }
        })}
        scroll={{ x: 2200, y: transferScrollY }}
        expandable={{
          rowExpandable: record => getSupervisorMovementChildren(record).length > 0,
          expandedRowRender: record => (
            <Table
              rowKey={(item, index) => `${item && item.id || 'movement'}-${index}`}
              columns={supervisorMovementDetailColumns}
              dataSource={getSupervisorMovementChildren(record)}
              size="small"
              pagination={false}
              className="cashier-supervisor-installment-menu-table"
            />
          )
        }}
      />
    </Card>
    </Spin>
  );

  function renderStatusBar() {
    const row = selectedCashierRow || {};
    const status = selectedCashierRow ? (selectedCashierRow.closed ? 'Closed' : 'Open') : '-';

    return (
      <div className="cashier-supervisor-status-bar">
        <span className="cashier-supervisor-status-item">
          <strong>{t('Selected cash desk id')}:</strong>
          <span>{row.id || '-'}</span>
        </span>
        <span className="cashier-supervisor-status-item">
          <strong>{t('Cashier')}:</strong>
          <span>{row.cashier || '-'}</span>
        </span>
        <span className="cashier-supervisor-status-item">
          <strong>{t('Cash desk status')}:</strong>
          {status === '-' ? (
            <span>-</span>
          ) : (
            <Tag className={status === 'Open' ? 'cashier-supervisor-status-open' : 'cashier-supervisor-status-closed'}>
              {t(status)}
            </Tag>
          )}
        </span>
      </div>
    );
  }

  const cashDeskTabContent = (
    <Card size="small" title={t('Cash desk list')}>
      <div className="cashier-supervisor-toolbar">
        <Space wrap>
          <Button type="primary" onClick={() => setSearchVisible(true)}>
            <SearchIcon /> {t('Search')}
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'cash-desk-audit',
                  label: t('Detailed cash desk audit'),
                  onClick: handleOpenCashDeskAudit
                },
                {
                  key: 'cash-desk-audit-cashier-route',
                  label: t('Cash Closing Report'),
                  onClick: handleOpenDetailedCashDeskAuditReport
                },
                {
                  key: 'cash-desk-detailed-breakdown',
                  label: t('Cash Desk Detailed Breakdown'),
                  onClick: handleOpenCashDeskDetailedBreakdown
                }
              ]
            }}
            trigger={['click']}
          >
            <Button>
              <ReportIcon /> {t('Reports')}
            </Button>
          </Dropdown>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={cashierColumns}
        dataSource={transferRows}
        size="small"
        bordered
        className="cashier-supervisor-table"
        loading={transferLoading}
        pagination={{
          current: transferPagination.current,
          pageSize: transferPagination.pageSize,
          total: transferTotal,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50', '100']
        }}
        onChange={handleTableChange}
        scroll={{ x: 900, y: transferScrollY }}
        rowClassName={record => selectedCashierRow && selectedCashierRow.id === record.id ? 'cashier-supervisor-selected-row' : ''}
        onRow={record => ({
          onClick: () => setSelectedCashierRow(record)
        })}
      />
    </Card>
  );

  const premiumTabContent = (
    <Card size="small" title={t('Paid premium list')}>
      <div className="cashier-supervisor-toolbar cashier-supervisor-spaced-toolbar">
        <Space>
          <Button
            className="cashier-supervisor-outline-button"
            onClick={() => loadSupervisorPaidPremiums({
              pagination: { current: 1, pageSize: paidPremiumPagination.pageSize }
            })}
            loading={paidPremiumLoading}
            disabled={!selectedCashierRow}
          >
            <RefreshIcon />
            {t('Refresh')}
          </Button>
          <Button
            type="primary"
            onClick={exportPaidPremiums}
            loading={paidPremiumExportLoading}
            disabled={!selectedCashierRow || paidPremiumRows.length === 0}
          >
            <ExportIcon />
            {t('Export')}
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={supervisorMovementColumns}
        dataSource={paidPremiumRows}
        size="small"
        bordered
        className="cashier-supervisor-table"
        loading={paidPremiumLoading}
        pagination={{
          current: paidPremiumPagination.current,
          pageSize: paidPremiumPagination.pageSize,
          total: paidPremiumTotal,
          showSizeChanger: true,
          pageSizeOptions: ['15', '25', '50', '100']
        }}
        onChange={pagination => loadSupervisorPaidPremiums({
          pagination: { current: pagination.current, pageSize: pagination.pageSize }
        })}
        scroll={{ x: 2200, y: transferScrollY }}
        expandable={{
          rowExpandable: record => getSupervisorAppliedInstallments(record).length > 0,
          expandedRowRender: record => renderPaidPremiumSummary(record)
        }}
      />
    </Card>
  );

  const depositTabContent = (
    <Card size="small" title={t('Deposit list')}>
      <Table
        rowKey="id"
        columns={depositColumns}
        dataSource={depositRows}
        size="small"
        bordered
        className="cashier-supervisor-table"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  return (
    <div className="cashier-supervisor-shell" ref={shellRef}>
        <Layout className="cashier-supervisor-layout">
          <div className="cashier-supervisor-north">
            {renderStatusBar()}
          </div>

          <div className="cashier-supervisor-center" ref={mainViewportRef}>
          <div className="cashier-supervisor-view">
          <div className="cashier-supervisor-tab-bar" role="tablist">
            <button type="button" role="tab" aria-selected={activeTab === 'cash-desks'} className={`cashier-supervisor-tab${activeTab === 'cash-desks' ? ' active' : ''}`} onClick={() => setActiveTab('cash-desks')}>
              <CashierIcon /> {t('Cash desks')}
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'details'} disabled={!selectedCashierRow} className={`cashier-supervisor-tab${activeTab === 'details' ? ' active' : ''}`} onClick={() => setActiveTab('details')}>
              <SummaryIcon /> {t('Cash desk details')}
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'premiums'} disabled={!selectedCashierRow} className={`cashier-supervisor-tab${activeTab === 'premiums' ? ' active' : ''}`} onClick={() => setActiveTab('premiums')}>
              <PremiumIcon /> {t('Paid premiums')}
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'deposits'} disabled={!selectedCashierRow} className={`cashier-supervisor-tab${activeTab === 'deposits' ? ' active' : ''}`} onClick={() => setActiveTab('deposits')}>
              <DepositIcon /> {t('Premium deposits')}
            </button>
          </div>
          <div className="cashier-supervisor-tab-content" role="tabpanel">
            {activeTab === 'cash-desks'
              ? cashDeskTabContent
              : activeTab === 'details'
                ? supervisorMovementContent
                : activeTab === 'premiums'
                  ? premiumTabContent
                  : depositTabContent}
          </div>
            </div>
          </div>
        </Layout>

        <Panel
          title={t('Cash desk search')}
          width={520}
          placement="right"
          onClose={() => setSearchVisible(false)}
          visible={searchVisible}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="branch" label={t('Branch')}>
                  <Select allowClear showSearch optionFilterProp="label" placeholder={t('Select a branch')}>
                    {branches.map(item => (
                      <Option key={item.value} value={item.value} label={item.label}>
                        {item.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="cashier" label={t('Cashier User')}>
                  <Select
                    allowClear
                    showSearch
                    filterOption={false}
                    loading={cashierLoading}
                    onSearch={searchCashiers}
                    placeholder={t('Type at least 3 email characters')}
                    notFoundContent={cashierLoading ? t('Loading') : t('Type at least 3 email characters')}
                  >
                    {cashiers.map(item => (
                      <Option key={item.value} value={item.value}>
                        {item.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="cashDeskId" label={t('Cash desk id')}>
                  <InputNumber
                    min={0}
                    precision={0}
                    controls={false}
                    placeholder={t('Type cash desk id')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="status" label={t('Status')}>
                  <Select allowClear placeholder={t('Select a status')}>
                    <Option value="0">{t('Opened')}</Option>
                    <Option value="1">{t('Closed')}</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dateFrom" label={t('Start date')}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dateTo" label={t('End date')}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>

            <Space style={{ display: 'flex', width: '100%' }}>
              <Button type="primary" onClick={handleSearchTransfers}>
                <SearchIcon /> {t('Search')}
              </Button>
              <Button onClick={handleClearTransfers}>
                {t('Clear')}
              </Button>
            </Space>
          </Form>
        </Panel>

        <Panel
          title={t('Movement filters')}
          className="cashier-supervisor-drawer"
          placement="right"
          width={360}
          onClose={() => setMovementFilterVisible(false)}
          visible={movementFilterVisible}
        >
          <Form form={movementFilterForm} layout="vertical" onFinish={applySupervisorMovementFilters}>
            <Form.Item name="pending" valuePropName="checked">
              <Checkbox>{t('Pending to execute')}</Checkbox>
            </Form.Item>
            <Form.Item label={t('Transfer ID')} name="transferId">
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('Amount')} name="amount">
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('Income type')} name="incomeType">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={movementIncomeTypes}
                placeholder={t('Select an income type')}
              />
            </Form.Item>
            <Space>
              <Button onClick={clearSupervisorMovementFilters}>{t('Clear')}</Button>
              <Button type="primary" onClick={() => movementFilterForm.submit()}>{t('Apply')}</Button>
            </Space>
          </Form>
        </Panel>
      </div>
  );
}
