() => {
  const {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Drawer: Panel,
    Form,
    Dropdown,
    Layout,
    InputNumber,
    Menu,
    Row,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    message
  } = A;
  const { TabPane } = Tabs;
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

  const [form] = Form.useForm();
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [branches, setBranches] = React.useState([]);
  const [cashiers, setCashiers] = React.useState([]);
  const [cashierLoading, setCashierLoading] = React.useState(false);
  const [selectedCashierRow, setSelectedCashierRow] = React.useState(null);
  const [transferRows, setTransferRows] = React.useState([]);
  const [transferLoading, setTransferLoading] = React.useState(false);
  const [transferPagination, setTransferPagination] = React.useState({ current: 1, pageSize: 25 });
  const [transferTotal, setTransferTotal] = React.useState(0);
  const [transferScrollY, setTransferScrollY] = React.useState(420);
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
    `;
    document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  React.useEffect(() => {
    loadBranches();
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

        if (rows.length > 0) {
          const selected = selectedCashierRow && rows.find(item => Number(item && item.id) === Number(selectedCashierRow && selectedCashierRow.id));
          setSelectedCashierRow(selected || rows[0]);
        } else {
          setSelectedCashierRow(null);
        }
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
    },
    {
      title: t('Details'),
      key: 'details',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => setSelectedCashierRow(record)}>
          {t('View')}
        </Button>
      )
    }
  ];

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

  return (
    <div className="cashier-supervisor-shell" ref={shellRef}>
        <Layout className="cashier-supervisor-layout">
          <div className="cashier-supervisor-north">
            {renderStatusBar()}
          </div>

          <div className="cashier-supervisor-center" ref={mainViewportRef}>
            <div className="cashier-supervisor-view">
          <Tabs defaultActiveKey="cash-desks" type="card">
            <TabPane
              key="cash-desks"
              tab={<span><CashierIcon /> {t('Cash desks')}</span>}
            >
              <Card size="small" title={t('Cash desk list')}>
                <div className="cashier-supervisor-toolbar">
                  <Space wrap>
                    <Button type="primary" onClick={() => setSearchVisible(true)}>
                      <SearchIcon /> {t('Search')}
                    </Button>
                    <Dropdown
                      overlay={(
                        <Menu>
                          <Menu.Item key="cash-desk-audit" onClick={handleOpenCashDeskAudit}>
                            {t('Cash Desk Audit')}
                          </Menu.Item>
                          <Menu.Item key="cash-desk-detailed-breakdown" onClick={handleOpenCashDeskDetailedBreakdown}>
                            {t('Cash Desk Detailed Breakdown')}
                          </Menu.Item>
                        </Menu>
                      )}
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
            </TabPane>

            <TabPane
              key="details"
              tab={<span><SummaryIcon /> {t('Cash desk details')}</span>}
            >
              <Card size="small" title={t('Selected cash desk summary')}>
                <Descriptions bordered size="small" column={3}>
                  <Descriptions.Item label={t('Branch')}>{selectedCashierRow ? getBranchLabel(selectedCashierRow) : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('Cashier')}>{selectedCashierRow ? getCashierLabel(selectedCashierRow) : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('Cash date')}>{selectedCashierRow ? formatDate(selectedCashierRow.date) : '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('Cash desk')}>{selectedCashierRow && selectedCashierRow.id || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('Status')}>
                    {selectedCashierRow ? t(selectedCashierRow.closed ? 'Closed' : 'Open') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Posted')}>{selectedCashierRow && selectedCashierRow.posted ? t(selectedCashierRow.posted) : '-'}</Descriptions.Item>
                </Descriptions>
              </Card>
            </TabPane>

            <TabPane
              key="premiums"
              tab={<span><PremiumIcon /> {t('Paid premiums')}</span>}
            >
              <Card size="small" title={t('Paid premium list')}>
                <Table
                  rowKey="id"
                  columns={premiumColumns}
                  dataSource={premiumRows}
                  size="small"
                  bordered
                  className="cashier-supervisor-table"
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  scroll={{ x: 900 }}
                />
              </Card>
            </TabPane>

            <TabPane
              key="deposits"
              tab={<span><DepositIcon /> {t('Premium deposits')}</span>}
            >
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
            </TabPane>
          </Tabs>
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
      </div>
  );
}
