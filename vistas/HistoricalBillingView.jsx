/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/08/31
 * @name HistoricalBillingView
 * @version 1.0
 * @purpose: Display historical billing installments with policy and insured-object filters.
 */

() => {
  const {
    Button,
    Card,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tabs,
    message
  } = A;
  const { Option } = Select;
  const { TabPane } = Tabs;

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

  const SearchTabIcon = () => (
    <span role="img" aria-label="search" className="anticon anticon-search" style={tabIconStyle}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M909.6 854.5L649.9 594.8A314.3 314.3 0 0 0 712 412c0-166.8-135.2-302-302-302S108 245.2 108 412s135.2 302 302 302a299.5 299.5 0 0 0 182.8-62.1l259.7 259.7a8 8 0 0 0 11.3 0l45.8-45.8a8 8 0 0 0 0-11.3zM410 634c-122.6 0-222-99.4-222-222s99.4-222 222-222 222 99.4 222 222-99.4 222-222 222z"></path>
      </svg>
    </span>
  );

  const GeneralDataTabIcon = () => (
    <span role="img" aria-label="information" className="anticon anticon-info-circle" style={tabIconStyle}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-48-272h96V432h-96v180zm0-276h96v-96h-96v96z"></path>
      </svg>
    </span>
  );

  const CoverageTabIcon = () => (
    <span role="img" aria-label="coverages" className="anticon anticon-safety-certificate" style={tabIconStyle}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M866 169L512 64 158 169v257c0 234.7 143.9 443.2 354 514 210.1-70.8 354-279.3 354-514V169zm-76 257c0 193.2-114.1 365.6-278 431.2C348.1 791.6 234 619.2 234 426V224l278-82.4L790 224v202z"></path>
        <path d="M464 512l-72-72-56 56 128 128 224-224-56-56z"></path>
      </svg>
    </span>
  );

  const InstallmentTabIcon = () => (
    <span role="img" aria-label="installments" className="anticon anticon-calendar" style={tabIconStyle}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M880 184H744v-48c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v48H352v-48c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v48H144c-4.4 0-8 3.6-8 8v648c0 4.4 3.6 8 8 8h736c4.4 0 8-3.6 8-8V192c0-4.4-3.6-8-8-8zM240 248h544v112H240V248zm584 520H176V424h648v344z"></path>
        <path d="M280 496h80v80h-80zm160 0h80v80h-80zm160 0h80v80h-80zM280 624h80v80h-80zm160 0h80v80h-80zm160 0h80v80h-80z"></path>
      </svg>
    </span>
  );

  const CopyIcon = () => (
    <span role="img" aria-label="copy" className="anticon anticon-copy" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1em', height: '1em', lineHeight: 1 }}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M832 64H296c-17.7 0-32 14.3-32 32v96h64v-64h472v472h-64v64h96c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32z"></path>
        <path d="M696 224H160c-17.7 0-32 14.3-32 32v672c0 17.7 14.3 32 32 32h536c17.7 0 32-14.3 32-32V256c0-17.7-14.3-32-32-32zm-32 672H192V288h472v608z"></path>
      </svg>
    </span>
  );

  const [filterForm] = Form.useForm();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [filterVisible, setFilterVisible] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 25 });
  const [total, setTotal] = React.useState(0);
  const [executionTime, setExecutionTime] = React.useState('0.00 milisegundos');
  const [clientOptions, setClientOptions] = React.useState([]);
  const [clientLoading, setClientLoading] = React.useState(false);
  const clientSearchTimer = React.useRef(null);
  const [lineOptions, setLineOptions] = React.useState([]);
  const [productOptions, setProductOptions] = React.useState([]);
  const [productCatalog, setProductCatalog] = React.useState([]);
  const [selectedLine, setSelectedLine] = React.useState('');
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [policyInfo, setPolicyInfo] = React.useState(null);
  const [renewalInfo, setRenewalInfo] = React.useState(null);
  const [accountingInfo, setAccountingInfo] = React.useState(null);
  const [policyLoading, setPolicyLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('search');

  React.useEffect(() => {
    loadCatalogs();
  }, []);

  React.useEffect(() => {
    const policyId = Number(selectedRow && selectedRow.policyId) || 0;
    if (!policyId) {
      setPolicyInfo(null);
      setRenewalInfo(null);
      setAccountingInfo(null);
      setPolicyLoading(false);
      return undefined;
    }

    setPolicyLoading(true);
    setRenewalInfo(null);
    setAccountingInfo(null);

    const policyRequest = exe('RepoLifePolicy', {
      operation: 'GET',
      filter: `id=${policyId}`,
      include: ['PayPlan', 'Product', 'Branch', 'Holder', 'Payer', 'Insureds', 'Coverages', 'Commissions', 'Cessions', 'Anniversaries'],
      noTracking: true
    });
    const renewalRequest = exe('LoadEntities', {
      entity: 'LifePolicy',
      fields: 'id,activeDate',
      filter: `originalPolicyId=${policyId}`,
      noTracking: true
    });
    const accountingRequest = exe('LoadEntities', {
      entity: '[Transaction]',
      fields: '[id],[entity],[entityId],[effectiveDate]',
      filter: `[entity] = N'LifePolicy' AND [entityId] = ${policyId}`,
      noTracking: true
    });

    policyRequest.then(response => {
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The policy could not be loaded.'));
      }
      const records = getRows(response);
      setPolicyInfo(records.length ? records[0] : null);
    }).catch(error => {
      setPolicyInfo(null);
      message.error(error && error.message ? error.message : t('The policy could not be loaded.'));
    }).finally(() => setPolicyLoading(false));

    renewalRequest.then(response => {
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The renewal status could not be loaded.'));
      }
      setRenewalInfo(getRows(response)[0] || null);
    }).catch(error => {
      setRenewalInfo(null);
      message.error(error && error.message ? error.message : t('The renewal status could not be loaded.'));
    });

    accountingRequest.then(response => {
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The accounting status could not be loaded.'));
      }
      const entries = getRows(response).sort((left, right) => {
        const leftDate = new Date(left && left.effectiveDate || 0).getTime();
        const rightDate = new Date(right && right.effectiveDate || 0).getTime();
        return rightDate - leftDate;
      });
      setAccountingInfo(entries[0] || null);
    }).catch(error => {
      setAccountingInfo(null);
      message.error(error && error.message ? error.message : t('The accounting status could not be loaded.'));
    });
  }, [selectedRow ? selectedRow.policyId : 0]);

  React.useEffect(() => {
    const styleId = 'historical-billing-view-style';
    const style = document.getElementById(styleId) || document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .historical-billing-view {
        width: 100%;
        height: 100%;
        min-height: calc(100dvh - 96px);
        overflow: hidden;
      }

      .historical-billing-view > .ant-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .historical-billing-view > .ant-card > .ant-card-body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: 4px !important;
        overflow: hidden;
      }

      .historical-billing-view .historical-billing-toolbar {
        flex: none;
        background: #e6f7ff !important;
        border: 1px solid #91caff !important;
        border-radius: 0 !important;
        padding: 4px 0 !important;
        margin: -4px -4px 2px;
        box-shadow: 0 1px 3px rgba(22, 119, 255, 0.12);
      }

      .historical-billing-view .historical-billing-toolbar > :first-child {
        margin-left: 4px;
      }

      .historical-billing-view .historical-billing-toolbar .ant-btn {
        border-radius: 6px;
        font-size: 13px;
      }

      .historical-billing-view .historical-billing-table {
        height: 100%;
        border: 1px solid #cbd1d8;
      }

      .historical-billing-view .ant-spin-nested-loading,
      .historical-billing-view .ant-spin-container {
        flex: 1;
        min-height: 0;
        height: 100%;
      }

      .historical-billing-view .historical-billing-table .ant-table-container {
        min-height: 0;
      }

      .historical-billing-view .historical-billing-table .ant-table-body {
        overflow-x: scroll !important;
        overflow-y: scroll !important;
        scrollbar-gutter: stable;
      }

      .historical-billing-view .historical-billing-table .ant-table-content {
        overflow-x: scroll !important;
        scrollbar-gutter: stable;
      }

      .historical-billing-view .historical-billing-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .historical-billing-view .historical-billing-table .ant-table-tbody > tr > td {
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .historical-billing-view .historical-billing-tabs {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .historical-billing-view .historical-billing-tabs > .ant-tabs-nav {
        margin-bottom: 2px;
        border-bottom: 1px solid #cbd1d8;
      }

      .historical-billing-view .historical-billing-tabs > .ant-tabs-nav .ant-tabs-tab {
        margin: 0 2px 0 0;
        border: 1px solid #cbd1d8;
        border-bottom: 0;
        border-radius: 6px 6px 0 0;
      }

      .historical-billing-view .historical-billing-tabs > .ant-tabs-nav .ant-tabs-tab-active {
        border-color: #1677ff;
        border-bottom-color: #fff;
      }

      .historical-billing-view .historical-billing-tabs > .ant-tabs-content-holder {
        flex: 1;
        min-height: 0;
      }

      .historical-billing-view .historical-billing-tabs .ant-tabs-tabpane {
        height: 100%;
        overflow: hidden;
      }

      .historical-billing-view .historical-billing-filter-panel {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        padding: 4px;
      }

      .historical-billing-view .historical-billing-filter-panel > .ant-spin-nested-loading {
        flex: 1;
        min-height: 0;
      }

      .historical-billing-view .historical-billing-section-title {
        background: #bfbfbf;
        border: 1px solid #cbd1d8;
        padding: 5px 8px;
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
      }

      .historical-billing-view .historical-billing-data-card {
        border: 1px solid #cbd1d8;
        margin-bottom: 8px;
      }

      .historical-billing-view .historical-billing-data-row {
        display: grid;
        grid-template-columns: 150px 1fr;
        border-bottom: 1px solid #cbd1d8;
        min-height: 30px;
      }

      .historical-billing-view .historical-billing-data-row:last-child {
        border-bottom: 0;
      }

      .historical-billing-view .historical-billing-data-label,
      .historical-billing-view .historical-billing-data-value {
        padding: 5px 8px;
        font-size: 12px;
        line-height: 18px;
      }

      .historical-billing-view .historical-billing-data-label {
        font-weight: 600;
        background: #f5f5f5;
        border-right: 1px solid #cbd1d8;
      }

      .historical-billing-view .historical-billing-general-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 300px;
        gap: 8px;
        height: 100%;
        overflow: auto;
      }

      .historical-billing-view .historical-billing-general-main,
      .historical-billing-view .historical-billing-general-summary {
        min-width: 0;
      }

      .historical-billing-view .historical-billing-general-summary .historical-billing-data-card {
        margin-bottom: 8px;
      }

      .historical-billing-view .historical-billing-general-empty {
        padding: 24px;
        text-align: center;
      }

      @media (max-width: 900px) {
        .historical-billing-view .historical-billing-general-layout {
          grid-template-columns: 1fr;
        }
      }

      .historical-billing-view .historical-billing-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .historical-billing-view .historical-billing-table .ant-table-tbody > tr {
        cursor: pointer;
      }

      .historical-billing-view .historical-billing-table .historical-billing-selected-row > td,
      .historical-billing-view .historical-billing-table .historical-billing-selected-row:hover > td {
        background: #86b4ff !important;
      }

      .historical-billing-view .historical-billing-money-positive { color: #237804; }
      .historical-billing-view .historical-billing-money-negative { color: #cf1322; }
      .historical-billing-view .historical-billing-money-zero { color: #262626; }
      .historical-billing-view .historical-billing-money-deferred { color: #1677ff; }
    `;
    if (!style.parentNode) document.head.appendChild(style);

    return () => {
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) currentStyle.remove();
    };
  }, []);

  function getRows(response) {
    const data = response && response.outData;
    if (Array.isArray(data)) return data;
    if (data) return [data];
    return [];
  }

  function getFirstRow(value) {
    if (Array.isArray(value)) return value[0] || null;
    return value && typeof value === 'object' ? value : null;
  }

  function text(value) {
    return String(value === undefined || value === null ? '' : value).trim();
  }

  function escapeSql(value) {
    return text(value).replace(/'/g, "''");
  }

  function number(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
  }

  function formatMoney(value) {
    const fixed = number(value).toFixed(2);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${parts[0]}.${parts[1]}`;
  }

  function renderMoney(value, extraClass) {
    const amount = number(value);
    let className = 'historical-billing-money-zero';
    if (amount > 0) className = 'historical-billing-money-positive';
    if (amount < 0) className = 'historical-billing-money-negative';
    if (extraClass) className += ` ${extraClass}`;
    return <span className={className}>{formatMoney(amount)}</span>;
  }

  function formatDate(value) {
    const raw = text(value);
    if (!raw) return '-';
    const date = new Date(/z$/i.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`);
    if (Number.isNaN(date.getTime())) return raw;
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  function calculatePremiumAccrual(startValue, endValue, premiumValue) {
    const startText = text(startValue);
    const endText = text(endValue);
    if (!startText || !endText) return null;

    const start = new Date(startText);
    const end = new Date(endText);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;

    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const today = new Date();
    const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.ceil((endDay - startDay) / millisecondsPerDay));
    const elapsedDays = Math.min(totalDays, Math.max(0, Math.floor((currentDay - startDay) / millisecondsPerDay)));
    const premium = Math.max(0, number(premiumValue));
    const earned = premium * (elapsedDays / totalDays);

    return {
      totalDays,
      elapsedDays,
      earned,
      deferred: premium - earned
    };
  }

  function formatPickerDate(value) {
    if (!value || typeof value.format !== 'function') return '';
    return value.format('YYYY-MM-DD');
  }

  function loadCatalogs() {
    Promise.all([
      exe('RepoLob', { operation: 'GET' }),
      exe('RepoProduct', { operation: 'GET' })
    ]).then(responses => {
      setLineOptions(getRows(responses[0]).map(item => ({
        value: text(item && item.code),
        label: text(item && (item.name || item.code))
      })).filter(item => item.value));
      setProductOptions([]);
      setProductCatalog(getRows(responses[1]).map(item => ({
        value: text(item && item.code),
        label: text(item && (item.name || item.code)),
        line: text(item && (item.lobCode || item.lob))
      })).filter(item => item.value));
    }).catch(error => {
      message.error(error && error.message ? error.message : t('Catalogs could not be loaded.'));
    });
  }

  function searchClients(value) {
    const query = text(value);
    const isNumericId = /^\d+$/.test(query);

    if (clientSearchTimer.current) {
      clearTimeout(clientSearchTimer.current);
      clientSearchTimer.current = null;
    }

    if (query.length < 3 && !isNumericId) {
      setClientOptions([]);
      setClientLoading(false);
      return;
    }

    clientSearchTimer.current = setTimeout(() => {
      const escaped = escapeSql(query);
      const numericId = isNumericId ? Number(query) : 0;
      const idFilter = numericId > 0 ? ` OR [id] = ${numericId}` : '';
      const filter = isNumericId && query.length < 3
        ? `(inactive=0) AND [id] = ${numericId}`
        : `(inactive=0) AND (([name] LIKE N'%${escaped}%') OR ([surname1] LIKE N'%${escaped}%') OR ([surname2] LIKE N'%${escaped}%') OR ([cnp] LIKE N'%${escaped}%') OR ([nif] LIKE N'%${escaped}%')${idFilter})`;

      setClientLoading(true);
      exe('GetContacts', { operation: 'GET', filter: filter, size: 15 })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Clients could not be loaded.'));
          }

          const options = getRows(response).map(contact => {
            const name = text(contact && (contact.FullName || contact.fullName || [
              contact.name,
              contact.surname1,
              contact.surname2
            ].filter(Boolean).join(' ')));
            const identifier = text(contact && (contact.cnp || contact.nif || contact.passport));
            const id = contact && contact.id !== undefined && contact.id !== null ? String(contact.id) : '';

            return {
              value: contact && contact.id,
              label: `${name || t('Unnamed contact')} | ${identifier || t('No identification')} | #${id}`,
              id: contact && contact.id,
              name: name || t('Unnamed contact'),
              identifier: identifier || t('No identification'),
              contactId: id
            };
          }).filter(item => item.value !== undefined && item.value !== null);

          setClientOptions(options);
        })
        .catch(error => {
          setClientOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setClientLoading(false));
    }, 400);
  }

  function search(values, nextPagination) {
    const hasFilter = Boolean(
      Number(values && values.clientId) > 0 ||
      text(values && values.policyCode) ||
      Number(values && values.policyId) > 0 ||
      text(values && values.line) ||
      text(values && values.product) ||
      text(values && values.loanNumber) ||
      text(values && values.plate) ||
      values && values.issueFrom ||
      values && values.issueTo ||
      text(values && values.status)
    );

    if (!hasFilter) {
      message.warning(t('Select at least one filter before searching.'));
      return;
    }

    const issueFrom = values && values.issueFrom;
    const issueTo = values && values.issueTo;
    if (Boolean(issueFrom) !== Boolean(issueTo)) {
      message.warning(t('Select both the issuance start and end dates.'));
      return;
    }
    if (issueFrom && issueTo && issueFrom.valueOf() > issueTo.valueOf()) {
      message.warning(t('The issuance start date cannot be later than the end date.'));
      return;
    }

    setFilterVisible(false);
    setLoading(true);
    setSearched(true);
    const currentPagination = nextPagination || { current: 1, pageSize: pagination.pageSize };
    const startTime = performance.now();
    exe('ExeChain', {
      chain: 'cmdHistoricalBilling',
      context: JSON.stringify({
        page: currentPagination.current,
        size: currentPagination.pageSize,
        clientId: Number(values && values.clientId) || 0,
        policyCode: text(values && values.policyCode),
        policyId: Number(values && values.policyId) || 0,
        line: text(values && values.line),
        product: text(values && values.product),
        loanNumber: text(values && values.loanNumber),
        plate: text(values && values.plate),
        issueFrom: formatPickerDate(values && values.issueFrom),
        issueTo: formatPickerDate(values && values.issueTo),
        status: text(values && values.status)
      })
    }).then(response => {
      if (!response || response.ok === false) throw new Error(response && response.msg ? response.msg : t('Historical billing could not be loaded.'));
      const payload = response && response.outData && !Array.isArray(response.outData)
        ? response.outData
        : {};
      const billingRows = Array.isArray(payload.data) ? payload.data : [];
      setRows(billingRows);
      setTotal(Number(payload.total) >= 0 ? Number(payload.total) : 0);
      setPagination(currentPagination);
    }).catch(error => {
      setRows([]);
      setTotal(0);
      message.error(error && error.message ? error.message : String(error));
    }).finally(() => {
      setExecutionTime(`${(performance.now() - startTime).toFixed(2)} milisegundos`);
      setLoading(false);
    });
  }

  function handleSearch(values) {
    search(values, { current: 1, pageSize: pagination.pageSize });
  }

  function handleTableChange(nextPagination) {
    search(filterForm.getFieldsValue(), {
      current: nextPagination.current,
      pageSize: nextPagination.pageSize
    });
  }

  function handleLineChange(value) {
    const line = text(value);
    setSelectedLine(line);
    filterForm.setFieldsValue({ product: undefined });
    setProductOptions(line
      ? productCatalog.filter(item => item.line === line)
      : []);
  }

  function renderCoverageIndicators(coverage) {
    const indicators = [];
    if (coverage && coverage.basic) indicators.push(t('Basic'));
    if (coverage && coverage.mandatory) indicators.push(t('Mandatory'));
    if (coverage && coverage.appliesTo) indicators.push(text(coverage.appliesTo));
    return indicators.length ? indicators.join(' / ') : '-';
  }

  function clearFilters() {
    filterForm.resetFields();
    setClientOptions([]);
    setSelectedLine('');
    setProductOptions([]);
    setRows([]);
    setTotal(0);
    setExecutionTime('0.00 milisegundos');
    setSearched(false);
    setSelectedRow(null);
    setPolicyInfo(null);
    setActiveTab('search');
    setPagination({ current: 1, pageSize: 25 });
  }

  function entityName(entity) {
    if (!entity) return '-';
    if (Array.isArray(entity)) return entity.length ? entityName(entity[0]) : '-';
    if (entity.Contact || entity.contact || entity.Insured || entity.insured) {
      return entityName(entity.Contact || entity.contact || entity.Insured || entity.insured);
    }
    return text(entity.FullName || entity.fullName || [
      entity.name,
      entity.middlename,
      entity.surname1,
      entity.surname2
    ].filter(Boolean).join(' ') || entity.description || entity.id) || '-';
  }

  function entityId(entity) {
    if (!entity) return 0;
    if (Array.isArray(entity)) return entity.length ? entityId(entity[0]) : 0;
    if (entity.Contact || entity.contact || entity.Insured || entity.insured) {
      return entityId(entity.Contact || entity.contact || entity.Insured || entity.insured);
    }
    const id = Number(entity.id || entity.contactId || entity.ContactId);
    return Number.isInteger(id) && id > 0 ? id : 0;
  }

  function copyToClipboard(value) {
    const content = text(value);
    if (!content || content === '-') return;

    const notifySuccess = () => message.success(t('Copied to clipboard.'));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(notifySuccess).catch(() => {
        copyToClipboardFallback(content, notifySuccess);
      });
      return;
    }
    copyToClipboardFallback(content, notifySuccess);
  }

  function copyToClipboardFallback(content, onSuccess) {
    const input = document.createElement('textarea');
    input.value = content;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    try {
      if (document.execCommand('copy')) onSuccess();
    } finally {
      document.body.removeChild(input);
    }
  }

  function renderCopyButton(value) {
    const content = text(value);
    if (!content || content === '-') return null;
    return (
      <Button
        type="link"
        size="small"
        aria-label={t('Copy')}
        title={t('Copy')}
        style={{ padding: '0 0 0 5px', height: 'auto', lineHeight: 1.2, fontSize: 12 }}
        onClick={event => {
          event.stopPropagation();
          copyToClipboard(content);
        }}
      >
        <CopyIcon />
      </Button>
    );
  }

  function renderCopyableText(value) {
    const label = text(value) || '-';
    return <span>{label}{renderCopyButton(label)}</span>;
  }

  function renderPolicyLink(value, policyId) {
    const id = Number(policyId || 0);
    const label = text(value) || (id > 0 ? String(id) : '-');
    if (!id) return renderCopyableText(label);
    return (
      <span>
        <Button
          type="link"
          size="small"
          style={{ padding: 0, height: 'auto', lineHeight: 1.2, fontSize: 12 }}
          onClick={event => {
            event.stopPropagation();
            window.open(`#/lifepolicy/${id}`, '_blank', 'noopener,noreferrer');
          }}
        >
          {label}
        </Button>
        {renderCopyButton(label)}
      </span>
    );
  }

  function renderContactLink(entity, fallback) {
    const id = entityId(entity);
    const label = fallback || entityName(entity);
    if (!id || label === '-') return renderCopyableText(label);
    return (
      <span>
        <Button
          type="link"
          size="small"
          style={{ padding: 0, height: 'auto', lineHeight: 1.2, fontSize: 12 }}
          onClick={event => {
            event.stopPropagation();
            window.open(`#/contact/${id}`, '_blank', 'noopener,noreferrer');
          }}
        >
          {label}
        </Button>
        {renderCopyButton(label)}
      </span>
    );
  }

  function firstEntity(policy, names) {
    for (let index = 0; index < names.length; index += 1) {
      if (policy && policy[names[index]]) return policy[names[index]];
    }
    return null;
  }

  function firstNumber(source, names, fallback) {
    for (let index = 0; index < names.length; index += 1) {
      const value = Number(source && source[names[index]]);
      if (Number.isFinite(value)) return value;
    }
    return fallback === undefined ? 0 : fallback;
  }

  function getSelectedPayPlan(policy) {
    const plans = policy && Array.isArray(policy.PayPlan) ? policy.PayPlan : [];
    const selectedPayPlanId = Number(selectedRow && selectedRow.payPlanId) || 0;
    return plans.find(plan => Number(plan && plan.id) === selectedPayPlanId) || plans[0] || {};
  }

  function handleRowSelect(record) {
    setPolicyLoading(true);
    setSelectedRow(record);
    setActiveTab('general');
  }

  const columns = [
    { title: t('Receipt'), dataIndex: 'receipt', key: 'receipt', width: 120 },
    { title: t('Policy ID'), dataIndex: 'policyId', key: 'policyId', width: 95, align: 'center', render: value => renderPolicyLink(value, value) },
    { title: t('Policy'), dataIndex: 'policy', key: 'policy', width: 150, render: (value, record) => renderPolicyLink(value, record && record.policyId) },
    { title: t('Year-Month'), dataIndex: 'yearMonth', key: 'yearMonth', width: 105, align: 'center' },
    { title: t('Status'), dataIndex: 'status', key: 'status', width: 110, render: value => t(value || '') },
    { title: t('Start'), dataIndex: 'start', key: 'start', width: 110, align: 'center', render: formatDate },
    { title: t('End date'), dataIndex: 'end', key: 'end', width: 110, align: 'center', render: formatDate },
    { title: t('Total'), dataIndex: 'total', key: 'total', width: 110, align: 'right', render: renderMoney },
    { title: t('Paid'), dataIndex: 'paid', key: 'paid', width: 110, align: 'right', render: renderMoney },
    { title: t('Pending'), dataIndex: 'pending', key: 'pending', width: 110, align: 'right', render: renderMoney }
  ];

  const coverageColumns = [
    { title: t('Code'), dataIndex: 'code', key: 'code', width: 100, align: 'center' },
    { title: t('Name'), dataIndex: 'name', key: 'name', width: 260 },
    { title: t('Indicators'), key: 'indicators', width: 180, render: (_, coverage) => renderCoverageIndicators(coverage) },
    { title: t('Insured sum'), key: 'limit', width: 130, align: 'right', render: (_, coverage) => renderMoney(firstNumber(coverage, ['limit', 'insuredSum'], 0)) },
    { title: t('Base premium'), key: 'basePremium', width: 130, align: 'right', render: (_, coverage) => renderMoney(firstNumber(coverage, ['basePremium'], 0)) },
    { title: t('Loading/Discount'), key: 'loading', width: 150, align: 'right', render: (_, coverage) => renderMoney(firstNumber(coverage, ['loading'], 0)) },
    { title: t('Extra premium'), key: 'extraPremium', width: 130, align: 'right', render: (_, coverage) => renderMoney(firstNumber(coverage, ['extraPremium'], 0)) },
    { title: t('Monthly premium'), key: 'monthlyPremium', width: 140, align: 'right', render: (_, coverage) => renderMoney(firstNumber(coverage, ['monthlyPremium', 'monthly', 'premium'], 0)) },
    { title: t('Deductible'), key: 'deductible', width: 120, align: 'right', render: (_, coverage) => renderMoney(firstNumber(coverage, ['deductible'], 0)) }
  ];

  const installmentColumns = [
    { title: t('Installment Id'), dataIndex: 'id', key: 'id', width: 90, align: 'center' },
    { title: t('Concept'), dataIndex: 'concept', key: 'concept', width: 180 },
    { title: t('Amount due'), key: 'amountDue', width: 130, align: 'right', render: (_, installment) => renderMoney(firstNumber(installment, ['minimum', 'expected'], 0)) },
    { title: t('Paid'), key: 'paid', width: 110, align: 'right', render: (_, installment) => renderMoney(firstNumber(installment, ['payed', 'paid'], 0)) },
    { title: t('Payment date'), key: 'paymentDate', width: 125, align: 'center', render: (_, installment) => formatDate(installment && (installment.payedDate || installment.paymentDate)) },
    { title: t('Due date'), dataIndex: 'dueDate', key: 'dueDate', width: 125, align: 'center', render: formatDate },
    { title: t('Installment'), dataIndex: 'numberInYear', key: 'numberInYear', width: 100, align: 'center' },
    { title: t('Contract year'), dataIndex: 'contractYear', key: 'contractYear', width: 120, align: 'center' }
  ];
  const generalData = selectedRow || {};
  const detailPolicy = policyInfo || {};
  const detailPayPlan = getSelectedPayPlan(detailPolicy);
  const detailGross = firstNumber(detailPolicy, ['anualPremium', 'annualPremium'], Number(generalData.total) || 0);
  const detailExpenses = firstNumber(detailPolicy, ['fee', 'expenses', 'fees'], 0);
  const detailOtherExpenses = firstNumber(detailPolicy, ['otherExpenses', 'otherFee'], 0);
  const detailTax = firstNumber(detailPolicy, ['tax', 'taxes'], 0);
  const detailInterest = firstNumber(detailPolicy, ['interest', 'interests'], 0);
  const detailTotal = firstNumber(detailPolicy, ['anualTotal', 'annualTotal'], Number(generalData.total) || 0);
  const detailPaid = firstNumber(detailPayPlan, ['payed', 'paid'], Number(generalData.paid) || 0);
  const detailPending = detailTotal - detailPaid;
  const detailPremium = firstNumber(detailPolicy, ['coverages', 'premium'], detailGross);
  const detailCoinsurance = firstNumber(detailPolicy, ['coinsurance', 'coInsurance', 'coInsurancePremium'], 0);
  const detailAccrual = calculatePremiumAccrual(detailPolicy.start || generalData.start, detailPolicy.end || generalData.end, detailGross);
  const detailEarned = detailAccrual ? detailAccrual.earned : firstNumber(detailPolicy, ['earnedPremium', 'accruedPremium', 'devengada'], 0);
  const detailDeferred = detailAccrual ? detailAccrual.deferred : firstNumber(detailPolicy, ['deferredPremium', 'diferida'], 0);
  const detailInsuredSum = firstNumber(detailPolicy, ['insuredSum', 'sumInsured'], 0);
  const detailCoinsuranceSum = firstNumber(detailPolicy, ['coinsuranceSum', 'coInsuranceSum'], 0);
  const detailNetSum = detailInsuredSum - detailCoinsuranceSum;
  const detailProductionCommission = firstNumber(detailPolicy, ['commissions', 'commission'], 0);
  const detailCoinsuranceCommission = firstNumber(detailPolicy, ['coinsuranceCommission', 'coInsuranceCommission'], 0);
  const installmentRows = Array.isArray(detailPolicy.PayPlan)
    ? detailPolicy.PayPlan.slice().sort((left, right) => {
      const yearDifference = Number(left && left.contractYear || 0) - Number(right && right.contractYear || 0);
      if (yearDifference !== 0) return yearDifference;
      return Number(left && left.numberInYear || 0) - Number(right && right.numberInYear || 0);
    })
    : [];
  const coverageRows = Array.isArray(detailPolicy.Coverages) ? detailPolicy.Coverages : [];
  const sumCoverageField = fields => coverageRows.reduce((total, coverage) => total + firstNumber(coverage, fields, 0), 0);
  const totalInstallmentDue = installmentRows.reduce((total, installment) => total + firstNumber(installment, ['minimum', 'expected'], 0), 0);
  const totalInstallmentPaid = installmentRows.reduce((total, installment) => total + firstNumber(installment, ['payed', 'paid'], 0), 0);
  const detailHolder = firstEntity(detailPolicy, ['Holder', 'holder', 'Payer', 'payer']);
  const detailInsured = firstEntity(detailPolicy, ['Insureds', 'Insured', 'insured']);
  const detailBeneficiary = detailInsured;
  const detailCreditor = firstEntity(detailPolicy, ['CessionBeneficiary', 'cessionBeneficiary', 'Creditor', 'creditor']);
  const detailBranch = firstEntity(detailPolicy, ['Branch', 'branch']);
  const detailAnniversary = detailPolicy.Anniversaries && detailPolicy.Anniversaries[0] ? detailPolicy.Anniversaries[0] : {};
  const detailPolicyVersion = detailPolicy.policyVersion === null || detailPolicy.policyVersion === undefined
    ? 0
    : Number(detailPolicy.policyVersion);
  const detailPolicyType = detailPolicyVersion >= 1 ? t('Renewal') : t('New');
  const detailRenewal = renewalInfo
    ? (renewalInfo.activeDate ? t('Renewed') : t('In progress'))
    : t('No action');
  const detailAccountingDate = accountingInfo && accountingInfo.effectiveDate;
  const detailBeneficiaryName = entityName(detailBeneficiary) === '-' ? t('No Tiene') : entityName(detailBeneficiary);
  const detailCreditorName = entityName(detailCreditor) === '-' ? t('No Tiene') : entityName(detailCreditor);

  return (
    <div className="historical-billing-view">
      <Card size="small">
        <Spin spinning={loading || policyLoading}>
        <Tabs className="historical-billing-tabs" activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane tab={<span><SearchTabIcon />{t('Search')}</span>} key="search">
            <div className="historical-billing-filter-panel">
              <div className="historical-billing-toolbar">
                <Button type="primary" onClick={() => setFilterVisible(true)}>{t('Filter')}</Button>
              </div>
              <Drawer
                title={t('Historical billing filters')}
                className="historical-billing-drawer"
                placement="right"
                width={420}
                open={filterVisible}
                onClose={() => setFilterVisible(false)}
              >
                <Form form={filterForm} layout="vertical" onFinish={handleSearch}>
                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.Item label={t('Client')} name="clientId">
                        <Select showSearch allowClear filterOption={false} loading={clientLoading} onSearch={searchClients} options={clientOptions} placeholder={t('Search client')} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label={t('Policy code')} name="policyCode"><Input /></Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={t('Policy ID')} name="policyId"><Input type="number" min={1} /></Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label={t('Line of business')} name="line"><Select allowClear options={lineOptions} onChange={handleLineChange} /></Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={t('Product')} name="product">
                        <Select allowClear disabled={!selectedLine} showSearch optionFilterProp="label" options={productOptions} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label={t('Loan number')} name="loanNumber"><Input /></Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={t('Plate')} name="plate"><Input /></Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label={t('Issuance date from')} name="issueFrom"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={t('Issuance date to')} name="issueTo"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.Item label={t('Policy status')} name="status">
                        <Select allowClear>
                          <Option value="ACTIVE">{t('Active')}</Option>
                          <Option value="INACTIVE">{t('Inactive')}</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space>
                    <Button type="primary" htmlType="submit">{t('Search')}</Button>
                    <Button onClick={clearFilters}>{t('Clear')}</Button>
                  </Space>
                </Form>
              </Drawer>
              <Spin spinning={loading}>
                <Table
                  className="historical-billing-table"
                  rowKey="key"
                  size="small"
                  bordered
                  columns={columns}
                  dataSource={rows}
                  onRow={record => ({ onClick: () => handleRowSelect(record) })}
                  rowClassName={record => selectedRow && selectedRow.key === record.key ? 'historical-billing-selected-row' : ''}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total,
                    showSizeChanger: true,
                    pageSizeOptions: ['15', '25'],
                    showTotal: () => <span>{t('Total records')}: {total} | {t('Time')}: {executionTime}</span>
                  }}
                  onChange={handleTableChange}
                  scroll={{ x: 1000, y: 'calc(100dvh - 310px)' }}
                />
              </Spin>
            </div>
          </TabPane>
          <TabPane tab={<span><GeneralDataTabIcon />{t('General data')}</span>} key="general" disabled={!selectedRow}>
            <div className="historical-billing-filter-panel">
              {!selectedRow ? (
                <div className="historical-billing-general-empty">{t('Select a record from the search results to view its general data.')}</div>
              ) : policyLoading ? (
                <Spin spinning />
              ) : (
                <div className="historical-billing-general-layout">
                  <div className="historical-billing-general-main">
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('References')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Invoice number')}</div><div className="historical-billing-data-value">{renderCopyableText(detailPolicy.fiscalNumber || generalData.receipt || '-')}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Invoice total')}</div><div className="historical-billing-data-value">{renderMoney(detailTotal)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Type')}</div><div className="historical-billing-data-value">{detailPolicyType}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Policy')}</div><div className="historical-billing-data-value">{renderPolicyLink(detailPolicy.code || generalData.policy, detailPolicy.id || generalData.policyId)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Branch')}</div><div className="historical-billing-data-value">{entityName(detailBranch) || text(detailPolicy.branchCode) || '-'}</div></div>
                    </div>
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('Entities')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Policyholder')}</div><div className="historical-billing-data-value">{renderContactLink(detailHolder, entityName(detailHolder))}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Insured')}</div><div className="historical-billing-data-value">{renderContactLink(detailInsured, entityName(detailInsured))}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Beneficiary')}</div><div className="historical-billing-data-value">{renderContactLink(detailBeneficiary, detailBeneficiaryName)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Creditor')}</div><div className="historical-billing-data-value">{renderContactLink(detailCreditor, detailCreditorName)}</div></div>
                    </div>
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('Status')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Renewal')}</div><div className="historical-billing-data-value">{detailRenewal}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Posted')}</div><div className="historical-billing-data-value">{accountingInfo ? t('Yes') : t('No')}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Collection')}</div><div className="historical-billing-data-value">{text(detailPolicy.collectionStatus || detailPolicy.collection) || '-'}</div></div>
                    </div>
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('Dates')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Start')}</div><div className="historical-billing-data-value">{formatDate(detailPolicy.start || generalData.start)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('End date')}</div><div className="historical-billing-data-value">{formatDate(detailPolicy.end || generalData.end)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Issued')}</div><div className="historical-billing-data-value">{formatDate(detailPolicy.activeDate || detailPolicy.issueDate)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Paid through')}</div><div className="historical-billing-data-value">{formatDate(detailPolicy.paidUntil || detailPayPlan.dueDate)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Accounted')}</div><div className="historical-billing-data-value">{formatDate(detailAccountingDate)}</div></div>
                    </div>
                  </div>
                  <div className="historical-billing-general-summary">
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('Invoice')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Gross')}</div><div className="historical-billing-data-value">{renderMoney(detailGross)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Expenses')}</div><div className="historical-billing-data-value">{renderMoney(detailExpenses)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Other expenses')}</div><div className="historical-billing-data-value">{renderMoney(detailOtherExpenses)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Taxes')}</div><div className="historical-billing-data-value">{renderMoney(detailTax)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Interest')}</div><div className="historical-billing-data-value">{renderMoney(detailInterest)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Total')}</div><div className="historical-billing-data-value">{renderMoney(detailTotal)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Paid')}</div><div className="historical-billing-data-value">{renderMoney(detailPaid)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Pending')}</div><div className="historical-billing-data-value">{renderMoney(detailPending)}</div></div>
                    </div>
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('Premiums')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Gross')}</div><div className="historical-billing-data-value">{renderMoney(detailGross)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Coinsurance')}</div><div className="historical-billing-data-value">{renderMoney(detailCoinsurance)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Net')}</div><div className="historical-billing-data-value">{renderMoney(detailPremium)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Earned')}</div><div className="historical-billing-data-value">{renderMoney(detailEarned)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Deferred')}</div><div className="historical-billing-data-value">{renderMoney(detailDeferred, 'historical-billing-money-deferred')}</div></div>
                    </div>
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('Sums')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Gross sum')}</div><div className="historical-billing-data-value">{renderMoney(detailInsuredSum)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Coinsurance')}</div><div className="historical-billing-data-value">{renderMoney(detailCoinsuranceSum)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Net sum')}</div><div className="historical-billing-data-value">{renderMoney(detailNetSum)}</div></div>
                    </div>
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('Commissions')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Production')}</div><div className="historical-billing-data-value">{renderMoney(detailProductionCommission)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Coinsurance')}</div><div className="historical-billing-data-value">{renderMoney(detailCoinsuranceCommission)}</div></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPane>
          <TabPane tab={<span><CoverageTabIcon />{t('Coverages')}</span>} key="coverages" disabled={!selectedRow}>
            <div className="historical-billing-filter-panel">
              {!selectedRow ? (
                <div className="historical-billing-general-empty">{t('Select a policy from the search results to view its coverages.')}</div>
              ) : (
                <Table
                  className="historical-billing-table"
                  rowKey={(coverage, index) => String(coverage && (coverage.id || coverage.code) || index)}
                  size="small"
                  bordered
                  columns={coverageColumns}
                  dataSource={coverageRows}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}><strong>{t('Totals')}</strong></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">{renderMoney(sumCoverageField(['limit', 'insuredSum']))}</Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">{renderMoney(sumCoverageField(['basePremium']))}</Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="right">{renderMoney(sumCoverageField(['loading']))}</Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="right">{renderMoney(sumCoverageField(['extraPremium']))}</Table.Summary.Cell>
                        <Table.Summary.Cell index={7} align="right">{renderMoney(sumCoverageField(['monthlyPremium', 'monthly', 'premium']))}</Table.Summary.Cell>
                        <Table.Summary.Cell index={8}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                  pagination={false}
                  scroll={{ x: 1200, y: 'calc(100dvh - 310px)' }}
                  locale={{ emptyText: t('No coverages found.') }}
                />
              )}
            </div>
          </TabPane>
          <TabPane tab={<span><InstallmentTabIcon />{t('Installments')}</span>} key="installments" disabled={!selectedRow}>
            <div className="historical-billing-filter-panel">
              {!selectedRow ? (
                <div className="historical-billing-general-empty">{t('Select a policy from the search results to view its installments.')}</div>
              ) : (
                <Table
                  className="historical-billing-table"
                  rowKey={(installment, index) => String(installment && installment.id || index)}
                  size="small"
                  bordered
                  columns={installmentColumns}
                  dataSource={installmentRows}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2}><strong>{t('Totals')}</strong></Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">{renderMoney(totalInstallmentDue)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">{renderMoney(totalInstallmentPaid)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={4} colSpan={2}>{t('Total installments')}: {installmentRows.length}</Table.Summary.Cell>
                        <Table.Summary.Cell index={6}></Table.Summary.Cell>
                        <Table.Summary.Cell index={7}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                  pagination={false}
                  scroll={{ x: 980, y: 'calc(100dvh - 310px)' }}
                  locale={{ emptyText: t('No installments found.') }}
                />
              )}
            </div>
          </TabPane>
        </Tabs>
        </Spin>
      </Card>
    </div>
  );
}
