() => {
  const {
    Button,
    Card,
    Drawer,
    Dropdown,
    Form,
    Input,
    Layout,
    Modal,
    Radio,
    Select,
    Space,
    Table,
    Tag,
    message
  } = A;
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

  const CashierIcon = () => (
    <TabIcon label="cash desks">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M768 160H256c-53 0-96 43-96 96v416c0 53 43 96 96 96h512c53 0 96-43 96-96V256c0-53-43-96-96-96zm-16 112v80H240v-80h512zm0 128v272H240V400h512z"></path>
        <path d="M304 456h176v72H304zm240 0h112v72H544zM304 576h112v72H304zm160 0h192v72H464z"></path>
      </svg>
    </TabIcon>
  );

  const HeaderCashierIcon = () => (
    <span role="img" aria-label="cash desks" className="anticon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1em', height: '1em', lineHeight: 1 }}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M768 160H256c-53 0-96 43-96 96v416c0 53 43 96 96 96h512c53 0 96-43 96-96V256c0-53-43-96-96-96zm-16 112v80H240v-80h512zm0 128v272H240V400h512z"></path>
        <path d="M304 456h176v72H304zm240 0h112v72H544zM304 576h112v72H304zm160 0h192v72H464z"></path>
      </svg>
    </span>
  );

  const NewIcon = () => (
    <span role="img" aria-label="new" className="anticon anticon-file-add">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M240 160h320c8.5 0 16.6 3.4 22.6 9.4l160 160c6 6 9.4 14.1 9.4 22.6v448c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V192c0-17.7 14.3-32 32-32zm320 44.1V352h147.9L560 204.1z"></path>
        <path d="M448 448h64v80h80v64h-80v80h-64v-80h-80v-64h80z"></path>
      </svg>
    </span>
  );

  const PremiumIcon = () => (
    <TabIcon label="paid premiums">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384S723.7 128 512 128zm0 80c167.7 0 304 136.3 304 304S679.7 816 512 816 208 679.7 208 512 344.3 208 512 208z"></path>
        <path d="M464 336h96l-24 256h-48zM424 624h176v64H424z"></path>
      </svg>
    </TabIcon>
  );

  const [selectedCashierRow, setSelectedCashierRow] = React.useState(null);
  const [transferRows, setTransferRows] = React.useState([]);
  const [transferLoading, setTransferLoading] = React.useState(false);
  const [transferPagination, setTransferPagination] = React.useState({ current: 1, pageSize: 25 });
  const [transferTotal, setTransferTotal] = React.useState(0);
  const [transferScrollY, setTransferScrollY] = React.useState(420);
  const [branches, setBranches] = React.useState([]);
  const [currentUserEmail, setCurrentUserEmail] = React.useState('');
  const [newCashDeskVisible, setNewCashDeskVisible] = React.useState(false);
  const [newCashDeskLoading, setNewCashDeskLoading] = React.useState(false);
  const [newCashDeskForm] = Form.useForm();
  const [activeTab, setActiveTab] = React.useState('cash-desks');
  const [collectionRows, setCollectionRows] = React.useState([]);
  const [collectionLoading, setCollectionLoading] = React.useState(false);
  const [collectionPagination, setCollectionPagination] = React.useState({ current: 1, pageSize: 15 });
  const [collectionTotal, setCollectionTotal] = React.useState(0);
  const [collectionFilters, setCollectionFilters] = React.useState({});
  const [collectionFilterVisible, setCollectionFilterVisible] = React.useState(false);
  const [collectionFilterForm] = Form.useForm();
  const [collectionLobOptions, setCollectionLobOptions] = React.useState([]);
  const [payerOptions, setPayerOptions] = React.useState([]);
  const [payerLoading, setPayerLoading] = React.useState(false);
  const payerSearchTimer = React.useRef(null);
  const [policyOptions, setPolicyOptions] = React.useState([]);
  const [policyLoading, setPolicyLoading] = React.useState(false);
  const policySearchTimer = React.useRef(null);
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

      .cashier-supervisor-selection-card {
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        background: #fff;
      }

      .cashier-supervisor-selection-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: 100%;
      }

      .cashier-supervisor-selection-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .cashier-supervisor-selection-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #d9d9d9;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }

      .cashier-supervisor-selection-text {
        min-width: 0;
      }

      .cashier-supervisor-selection-title {
        font-size: 18px;
        font-weight: 600;
        color: #262626;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .cashier-supervisor-selection-meta {
        font-size: 12px;
        color: #8c8c8c;
        margin-top: 2px;
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
        --cashier-supervisor-north-height: 78px;
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
        margin-bottom: 8px;
      }

      .cashier-supervisor-tab {
        border: 1px solid transparent;
        border-bottom: 0;
        background: transparent;
        color: #262626;
        cursor: pointer;
        padding: 8px 14px;
        font-size: 13px;
        border-radius: 4px 4px 0 0;
      }

      .cashier-supervisor-tab:hover,
      .cashier-supervisor-tab.active {
        color: #1677ff;
        background: #fff;
        border-color: #d9d9d9;
      }

      .cashier-supervisor-tab-content {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
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

      .cashier-supervisor-installment-menu-table .ant-table-thead > tr > th,
      .cashier-supervisor-installment-menu-table .ant-table-tbody > tr > td {
        padding: 2px 6px !important;
        font-size: 11px;
        line-height: 14px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  React.useEffect(() => {
    loadTransferWorkspaces();
    loadBranches();
    loadCurrentUser();
    loadCollectionLobs();

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

  function formatDateIso(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${year}-${month}-${day}`;
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

  function buildTransferWorkspaceFilter() {
    // Load every open cash desk; the grid remains remotely paginated.
    return 'closed=0';
  }

  function getCurrentUtcDateTime() {
    return new Date().toISOString();
  }

  function loadCurrentUser() {
    exe('GetCurrentUser')
      .then(response => {
        const source = response && response.outData;
        const user = Array.isArray(source) ? source[0] : source;
        const email = getTrimmedString(user && (user.email || user.Email || user.userEmail));

        if (!email) {
          throw new Error(t('The current user could not be identified.'));
        }

        setCurrentUserEmail(email);
      })
      .catch(error => message.error(error && error.message ? error.message : String(error)));
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
          return { value: code, label: name || code };
        }).filter(item => item.value);

        setBranches(options);
      })
      .catch(error => {
        setBranches([]);
        message.error(error && error.message ? error.message : String(error));
      });
  }

  function loadCollectionLobs() {
    exe('RepoLob', { operation: 'GET' })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Lines of business could not be loaded.'));
        }

        const rows = getRows(response);
        const options = rows.map(item => ({
          value: item && item.code,
          label: getTrimmedString(item && (item.name || item.description || item.code))
        })).filter(item => item.value !== undefined && item.value !== null && item.value !== '');

        setCollectionLobOptions(options);
      })
      .catch(error => {
        setCollectionLobOptions([]);
        message.error(error && error.message ? error.message : String(error));
      });
  }

  function searchPayers(value) {
    const text = getTrimmedString(value);
    const isNumericId = /^\d+$/.test(text);

    if (payerSearchTimer.current) {
      clearTimeout(payerSearchTimer.current);
      payerSearchTimer.current = null;
    }

    if (text.length < 3 && !isNumericId) {
      setPayerOptions([]);
      setPayerLoading(false);
      return;
    }

    payerSearchTimer.current = setTimeout(() => {
      const escaped = escapeSqlString(text);
      const numericId = isNumericId ? Number(text) : 0;
      const idFilter = numericId > 0 ? ` OR [id] = ${numericId}` : '';
      const filter = isNumericId && text.length < 3
        ? `(inactive=0) AND [id] = ${numericId}`
        : `(inactive=0) AND (([name] LIKE N'%${escaped}%') OR ([surname1] LIKE N'%${escaped}%') OR ([surname2] LIKE N'%${escaped}%') OR ([cnp] LIKE N'%${escaped}%') OR ([nif] LIKE N'%${escaped}%')${idFilter})`;

      setPayerLoading(true);
      exe('GetContacts', { operation: 'GET', filter: filter, size: 15 })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Payers could not be loaded.'));
          }

          const options = getRows(response).map(contact => {
            const name = getTrimmedString(contact && (contact.FullName || contact.fullName || [
              contact.name,
              contact.surname1,
              contact.surname2
            ].filter(Boolean).join(' ')));
            const identifier = getTrimmedString(contact && (contact.cnp || contact.nif || contact.passport));
            const id = contact && contact.id !== undefined && contact.id !== null ? String(contact.id) : '';

            return {
              value: contact && contact.id,
              label: (
                <div style={{ lineHeight: 1.25 }}>
                  <div>{name || t('Unnamed contact')}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 11 }}>
                    {identifier || t('No identification')} | #{id}
                  </div>
                </div>
              ),
              name: name || t('Unnamed contact'),
              identifier: identifier || t('No identification'),
              contactId: id
            };
          }).filter(item => item.value !== undefined && item.value !== null);

          setPayerOptions(options);
        })
        .catch(error => {
          setPayerOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setPayerLoading(false));
    }, 400);
  }

  function searchPolicies(value) {
    const text = getTrimmedString(value);

    if (policySearchTimer.current) {
      clearTimeout(policySearchTimer.current);
      policySearchTimer.current = null;
    }

    if (!text) {
      setPolicyOptions([]);
      setPolicyLoading(false);
      return;
    }

    policySearchTimer.current = setTimeout(() => {
      const escaped = escapeSqlString(text);
      const isNumeric = /^\d+$/.test(text);
      const filter = isNumeric
        ? `[activeDate] IS NOT NULL AND [id] = ${Number(text)}`
        : `[activeDate] IS NOT NULL AND [code] LIKE N'%${escaped}%'`;

      setPolicyLoading(true);
      exe('RepoLifePolicy', {
        operation: 'GET',
        filter: filter,
        fields: 'id,code,start,end',
        size: 15
      })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Policies could not be loaded.'));
          }

          const options = getRows(response).map(policy => {
            const id = policy && policy.id !== undefined && policy.id !== null ? String(policy.id) : '';
            const code = getTrimmedString(policy && policy.code);
            const validity = `${formatDate(policy && policy.start)} - ${formatDate(policy && policy.end)}`;

            return {
              value: policy && policy.id,
              label: (
                <div style={{ lineHeight: 1.25 }}>
                  <div>{code || id}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 11 }}>{validity} | #{id}</div>
                </div>
              ),
              policyId: policy && policy.id,
              policyCode: code
            };
          }).filter(item => item.value !== undefined && item.value !== null);

          setPolicyOptions(options);
        })
        .catch(error => {
          setPolicyOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setPolicyLoading(false));
    }, 400);
  }

  function openNewCashDeskModal() {
    const date = getCurrentUtcDateTime();
    newCashDeskForm.setFieldsValue({
      user: currentUserEmail,
      date: date,
      branchCode: undefined
    });
    setNewCashDeskVisible(true);
  }

  function closeNewCashDeskModal() {
    setNewCashDeskVisible(false);
    newCashDeskForm.resetFields();
  }

  function createCashDesk(values) {
    const branchCode = getTrimmedString(values && values.branchCode);
    const user = getTrimmedString(currentUserEmail || values && values.user);

    if (!user) {
      message.error(t('The current user could not be identified.'));
      return;
    }

    if (!branchCode) {
      message.warning(t('Select a branch before creating the cash desk.'));
      return;
    }

    setNewCashDeskLoading(true);
    exe('RepoTransferWorkspace', {
      operation: 'ADD',
      entity: {
        date: getCurrentUtcDateTime(),
        branchCode: branchCode,
        user: user
      }
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The cash desk could not be created.'));
        }

        message.success(t('Cash desk created successfully.'));
        closeNewCashDeskModal();
        handleReloadCashDesks();
      })
      .catch(error => message.error(error && error.message ? error.message : String(error)))
      .finally(() => setNewCashDeskLoading(false));
  }

  function loadCollection(params = {}) {
    const pagination = params.pagination || collectionPagination;
    const currentPage = Number(pagination && pagination.current) || 1;
    const pageSize = Number(pagination && pagination.pageSize) || 15;
    const filters = params.filters || collectionFilters || {};

    setCollectionLoading(true);
    const context = JSON.stringify({
      page: currentPage,
      size: pageSize,
      holderId: filters.holderId || null,
      lob: filters.lob || null,
      policyId: filters.policyId ? Number(filters.policyId) : null,
      policyCode: filters.policyCode || null,
      issuanceFrom: filters.issuanceFrom || null,
      issuanceTo: filters.issuanceTo || null
    });

    exe('ExeChain', {
      chain: 'cmdPremiumCollectionCashier',
      context: context
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Premium collections could not be loaded.'));
        }

        const result = response && response.outData && !Array.isArray(response.outData)
          ? response.outData
          : response;
        const rows = Array.isArray(result && result.data)
          ? result.data
          : getRows(response);
        const total = Number(result && result.total);
        setCollectionRows(rows);
        setCollectionTotal(Number.isFinite(total) && total >= 0 ? total : rows.length);
        setCollectionPagination({ current: currentPage, pageSize: pageSize });
      })
      .catch(error => {
        setCollectionRows([]);
        setCollectionTotal(0);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setCollectionLoading(false));
  }

  function applyCollectionFilters(values) {
    const filters = values || {};
    setCollectionFilters(filters);
    setCollectionFilterVisible(false);
    loadCollection({
      pagination: { current: 1, pageSize: collectionPagination.pageSize },
      filters: filters
    });
  }

  function clearCollectionFilters() {
    collectionFilterForm.resetFields();
    setPayerOptions([]);
    setPolicyOptions([]);
    setCollectionFilters({});
    setCollectionRows([]);
    setCollectionTotal(0);
    setCollectionPagination({ current: 1, pageSize: collectionPagination.pageSize });
    setCollectionFilterVisible(false);
  }

  function handleTabChange(key) {
    setActiveTab(key);
  }

  function handleCollectionTableChange(pagination) {
    loadCollection({
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize
      },
      filters: collectionFilters
    });
  }

  function loadTransferWorkspaces(params = {}) {
    const pagination = params.pagination || transferPagination;
    const filter = buildTransferWorkspaceFilter();
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
          setSelectedCashierRow(selected || null);
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

  function handleReloadCashDesks() {
    loadTransferWorkspaces({
      pagination: {
        current: 1,
        pageSize: transferPagination.pageSize
      }
    });
  }

  function handleTableChange(pagination) {
    loadTransferWorkspaces({
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize
      }
    });
  }

  const cashierColumns = [
    {
      title: t('Select'),
      key: 'select',
      width: 125,
      align: 'center',
      render: (_, record) => (
        <span
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onClick={event => event.stopPropagation()}
        >
          <Radio
            checked={Boolean(selectedCashierRow && selectedCashierRow.id === record.id)}
            onChange={() => setSelectedCashierRow(record)}
          />
          <Button type="link" size="small" onClick={() => setSelectedCashierRow(record)}>
            {t('Select')}
          </Button>
        </span>
      )
    },
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
  ];

  const premiumColumns = [
    { title: t('Policy'), dataIndex: 'poliza', key: 'poliza', width: 150 },
    { title: t('Year'), dataIndex: 'anio', key: 'anio', width: 75, align: 'center' },
    { title: t('Month'), dataIndex: 'mes', key: 'mes', width: 75, align: 'center' },
    { title: t('Line of business'), dataIndex: 'ramo', key: 'ramo', width: 140 },
    { title: t('Payer'), dataIndex: 'pagador', key: 'pagador', width: 190, ellipsis: true },
    { title: t('Insured'), dataIndex: 'asegurado', key: 'asegurado', width: 190, ellipsis: true },
    { title: t('Currency'), dataIndex: 'moneda', key: 'moneda', width: 85, align: 'center' },
    { title: t('Billed'), dataIndex: 'facturado', key: 'facturado', width: 110, align: 'right', render: formatMoney },
    { title: t('Paid'), dataIndex: 'pagado', key: 'pagado', width: 110, align: 'right', render: formatMoney },
    {
      title: t('Overdue'),
      dataIndex: 'vencido',
      key: 'vencido',
      width: 165,
      align: 'right',
      render: (value, record) => {
        const installments = record && Array.isArray(record.Cuotas) ? record.Cuotas : [];

        return (
          <Space size={4}>
            <span>{formatMoney(value)}</span>
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              disabled={installments.length === 0}
              dropdownRender={() => (
                <div style={{ width: 620, maxWidth: '80vw', maxHeight: '380px', padding: 8, background: '#fff', borderRadius: 6, boxShadow: '0 6px 16px rgba(0,0,0,.12)', overflow: 'hidden' }}>
                  <div style={{ padding: '4px 8px 8px', fontWeight: 600 }}>
                    {t('Pending installments')} - {record && record.poliza ? record.poliza : '-'}
                  </div>
                  <Table
                    rowKey={item => item && item.id}
                    columns={installmentColumns}
                    dataSource={installments}
                    pagination={false}
                    size="small"
                    bordered
                    className="cashier-supervisor-installment-menu-table"
                    scroll={{ x: 560, y: 280 }}
                  />
                </div>
              )}
            >
              <Button type="link" size="small">{t('View')}</Button>
            </Dropdown>
          </Space>
        );
      }
    },
    { title: t('Pending'), dataIndex: 'pendiente', key: 'pendiente', width: 110, align: 'right', render: formatMoney },
    { title: t('Issuance date'), dataIndex: 'fechaEmision', key: 'fechaEmision', width: 120, align: 'center', render: formatDate },
    {
      title: t('Pending installments'),
      key: 'installments',
      width: 145,
      align: 'center',
      render: (_, record) => Array.isArray(record && record.Cuotas) ? record.Cuotas.length : 0
    }
  ];

  const installmentColumns = [
    { title: t('Installment'), dataIndex: 'numberInYear', key: 'numberInYear', width: 90, align: 'center' },
    { title: t('Contract year'), dataIndex: 'contractYear', key: 'contractYear', width: 110, align: 'center' },
    { title: t('Concept'), dataIndex: 'concept', key: 'concept', width: 130 },
    { title: t('Due date'), dataIndex: 'dueDate', key: 'dueDate', width: 120, align: 'center', render: formatDate },
    { title: t('Pending'), dataIndex: 'pendingAmount', key: 'pendingAmount', width: 110, align: 'right', render: formatMoney }
  ];

  function renderSelectedCashDeskHeader() {
    const row = selectedCashierRow || {};
    const status = selectedCashierRow ? (selectedCashierRow.closed ? 'Closed' : 'Open') : '-';
    const title = row.id ? `${t('Cash desk')} ${row.id}.${formatDateIso(row.date)}.${getBranchLabel(row)}` : t('Cash desk');
    const subtitlePieces = [];

    if (row.user) {
      subtitlePieces.push(`${t('Cashier')}: ${getCashierLabel(row)}`);
    }

    if (status !== '-') {
      subtitlePieces.push(`${t('Cash desk status')}: ${t(status)}`);
    }

    return (
      <Card size="small" className="cashier-supervisor-selection-card" bodyStyle={{ padding: '12px 16px' }}>
        <div className="cashier-supervisor-selection-header">
          <div className="cashier-supervisor-selection-left">
            <div className="cashier-supervisor-selection-icon">
              <HeaderCashierIcon />
            </div>
            <div className="cashier-supervisor-selection-text">
              <div className="cashier-supervisor-selection-title">{title}</div>
              <div className="cashier-supervisor-selection-meta">
                {subtitlePieces.length > 0 ? subtitlePieces.join(' · ') : t('Select a cash desk')}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const cashDeskTabContent = (
    <Card size="small">
      <div className="cashier-supervisor-toolbar">
        <Button type="primary" onClick={openNewCashDeskModal}>
          <NewIcon /> {t('New')}
        </Button>
        <Button disabled={!selectedCashierRow}>
          {t('Close')}
        </Button>
        <Button disabled={!selectedCashierRow}>
          {t('Cash count')}
        </Button>
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

  const premiumCollectionTabContent = (
    <Card size="small">
      <div className="cashier-supervisor-toolbar">
        <Button type="primary" onClick={() => setCollectionFilterVisible(true)}>
          {t('Filter')}
        </Button>
      </div>
      <Table
        rowKey={record => record && record.lifePolicyId ? record.lifePolicyId : record.poliza}
        columns={premiumColumns}
        dataSource={collectionRows}
        size="small"
        bordered
        className="cashier-supervisor-table"
        loading={collectionLoading}
        pagination={{
          current: collectionPagination.current,
          pageSize: collectionPagination.pageSize,
          total: collectionTotal,
          showSizeChanger: true,
          pageSizeOptions: ['15', '25', '50', '100']
        }}
        onChange={handleCollectionTableChange}
        scroll={{ x: 1500, y: transferScrollY }}
      />
    </Card>
  );

  return (
    <div className="cashier-supervisor-shell" ref={shellRef}>
        <Layout className="cashier-supervisor-layout">
          <div className="cashier-supervisor-north">
            {renderSelectedCashDeskHeader()}
          </div>

          <div className="cashier-supervisor-center" ref={mainViewportRef}>
            <div className="cashier-supervisor-view">
          <div className="cashier-supervisor-tab-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cash-desks'}
              className={`cashier-supervisor-tab${activeTab === 'cash-desks' ? ' active' : ''}`}
              onClick={() => handleTabChange('cash-desks')}
            >
              <CashierIcon /> {t('Cash desks')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'premiums'}
              className={`cashier-supervisor-tab${activeTab === 'premiums' ? ' active' : ''}`}
              onClick={() => handleTabChange('premiums')}
            >
              <PremiumIcon /> {t('Premium collections')}
            </button>
          </div>
          <div className="cashier-supervisor-tab-content" role="tabpanel">
            {activeTab === 'premiums' ? premiumCollectionTabContent : cashDeskTabContent}
          </div>
            </div>
          </div>
        </Layout>

        <Modal
          title={t('New cash desk')}
          open={newCashDeskVisible}
          onCancel={closeNewCashDeskModal}
          onOk={() => newCashDeskForm.submit()}
          confirmLoading={newCashDeskLoading}
          destroyOnClose
        >
          <Form form={newCashDeskForm} layout="vertical" onFinish={createCashDesk}>
            <Form.Item label={t('User')} name="user">
              <Input disabled />
            </Form.Item>
            <Form.Item label={t('Date')} name="date">
              <Input disabled />
            </Form.Item>
            <Form.Item
              label={t('Branch')}
              name="branchCode"
              rules={[{ required: true, message: t('Select a branch.') }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder={t('Select a branch')}
                options={branches}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Drawer
          title={t('Premium collection filters')}
          placement="right"
          width={360}
          open={collectionFilterVisible}
          onClose={() => setCollectionFilterVisible(false)}
          destroyOnClose={false}
          footer={(
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={clearCollectionFilters}>{t('Clear')}</Button>
              <Button type="primary" onClick={() => collectionFilterForm.submit()}>{t('Apply')}</Button>
            </div>
          )}
        >
          <Form
            form={collectionFilterForm}
            layout="vertical"
            onFinish={applyCollectionFilters}
          >
            <Form.Item label={t('Payer')} name="holderId">
              <Select
                showSearch
                allowClear
                filterOption={false}
                options={payerOptions}
                loading={payerLoading}
                onSearch={searchPayers}
                optionLabelProp="name"
                placeholder={t('Type at least 3 characters')}
                notFoundContent={t('No payers found')}
              />
            </Form.Item>

            <Form.Item label={t('Line of business')} name="lob">
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                options={collectionLobOptions}
                placeholder={t('Select a line of business')}
              />
            </Form.Item>

            <Form.Item label={t('Policy')} name="policyId">
              <Select
                showSearch
                allowClear
                filterOption={false}
                options={policyOptions}
                loading={policyLoading}
                onSearch={searchPolicies}
                optionLabelProp="policyCode"
                placeholder={t('Type policy id or code')}
                notFoundContent={t('No policies found')}
              />
            </Form.Item>

            <Form.Item label={t('Issuance date from')} name="issuanceFrom">
              <Input type="date" />
            </Form.Item>

            <Form.Item label={t('Issuance date to')} name="issuanceTo">
              <Input type="date" />
            </Form.Item>
          </Form>
        </Drawer>

      </div>
  );
}
