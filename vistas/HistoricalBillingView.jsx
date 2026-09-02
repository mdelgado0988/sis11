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
    InputNumber,
    Modal,
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

  const PaymentTabIcon = () => (
    <span role="img" aria-label="payments" className="anticon anticon-dollar" style={tabIconStyle}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm42-405.8v-89.5c36.7 7.1 68.8 22.7 96.1 46.7l36.4-47.3c-38.3-34.5-82.4-55.1-132.5-61.9v-41.5h-42.2v40.3c-39.2 2.6-70.7 15.6-94.6 38.9-23.8 23.3-35.8 52.8-35.8 88.4 0 37.5 11.5 65.6 34.7 84.3 23.1 18.8 54.9 32.6 95.7 41.5v92.4c-42.1-7.5-82.4-28-120.6-61.4l-41.1 46.1c46.3 43.2 100.2 68.5 161.7 75.9v52.2h42.2v-51.2c40.3-2.3 72.6-15 96.9-38.2 24.3-23.2 36.4-53.3 36.4-90.2 0-35.7-11.6-62.8-34.9-81.4-23.4-18.7-56-33.5-97.8-44.1zm-42-10.2c-26.8-7.7-45.8-16.2-57.1-25.5-11.3-9.2-17-21.6-17-37.1 0-15.3 6.2-27.5 18.6-36.6 12.4-9.1 30.9-14.5 55.5-16.2v115.4zm42 203.4V553.7c28.2 8.1 48.2 17.1 60 27.1 11.8 10 17.7 23.1 17.7 39.3 0 16.4-6.5 29.3-19.5 38.7-13 9.4-32.4 14.9-58.2 16.6z"></path>
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
  const [collectionCutoffValue, setCollectionCutoffValue] = React.useState(undefined);
  const [collectionPaymentMethodOptions, setCollectionPaymentMethodOptions] = React.useState([]);
  const [relationshipOptions, setRelationshipOptions] = React.useState([]);
  const [renewalInfo, setRenewalInfo] = React.useState(null);
  const [accountingInfo, setAccountingInfo] = React.useState(null);
  const [policyLoading, setPolicyLoading] = React.useState(false);
  const [paymentRows, setPaymentRows] = React.useState([]);
  const [paymentsLoading, setPaymentsLoading] = React.useState(false);
  const paymentsLoadedPolicyRef = React.useRef(null);
  const [activeTab, setActiveTab] = React.useState('search');
  const [restructureModalOpen, setRestructureModalOpen] = React.useState(false);
  const [restructureLoading, setRestructureLoading] = React.useState(false);
  const [restructurePreviewRows, setRestructurePreviewRows] = React.useState([]);
  const [restructurePreviewDirty, setRestructurePreviewDirty] = React.useState(false);
  const [policyReloadToken, setPolicyReloadToken] = React.useState(0);
  const [restructureForm] = Form.useForm();
  const [endorsementForm] = Form.useForm();
  const [endorsementModalOpen, setEndorsementModalOpen] = React.useState(false);
  const [collectionMethodForm] = Form.useForm();
  const [collectionMethodModalOpen, setCollectionMethodModalOpen] = React.useState(false);
  const [collectionMethodChanging, setCollectionMethodChanging] = React.useState(false);
  const [collectionMethodDynamicForm, setCollectionMethodDynamicForm] = React.useState(null);

  React.useEffect(() => {
    loadCatalogs();
  }, []);

  React.useEffect(() => {
    const policyId = Number(selectedRow && selectedRow.policyId) || 0;
    if (!policyId) {
      setPolicyInfo(null);
      setCollectionCutoffValue(undefined);
      setRenewalInfo(null);
      setAccountingInfo(null);
      setPaymentRows([]);
      setPaymentsLoading(false);
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
  }, [selectedRow ? selectedRow.policyId : 0, policyReloadToken]);

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

      .historical-billing-modal .historical-billing-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #e6f7ff !important;
        border: 1px solid #91caff !important;
        border-radius: 0 !important;
        padding: 4px !important;
        margin-bottom: 4px;
      }

      .historical-billing-modal .historical-billing-toolbar .ant-btn {
        border-radius: 6px;
        font-size: 13px;
      }

      .historical-billing-modal .historical-billing-table {
        border: 1px solid #cbd1d8;
      }

      .historical-billing-modal .historical-billing-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .historical-billing-modal .historical-billing-table .ant-table-tbody > tr > td {
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
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

      .historical-billing-view .historical-billing-money-positive,
      .historical-billing-modal .historical-billing-money-positive { color: #237804; }
      .historical-billing-view .historical-billing-money-negative,
      .historical-billing-modal .historical-billing-money-negative { color: #cf1322; }
      .historical-billing-view .historical-billing-money-zero,
      .historical-billing-modal .historical-billing-money-zero { color: #262626; }
      .historical-billing-view .historical-billing-money-deferred,
      .historical-billing-modal .historical-billing-money-deferred { color: #1677ff; }
      .historical-billing-view .historical-billing-installment-status-pending { color: #cf1322; font-weight: 500; }
      .historical-billing-view .historical-billing-installment-status-paid { color: #237804; font-weight: 500; }
      .historical-billing-modal .historical-billing-table .ant-table-body { overflow-y: scroll !important; }

      .historical-billing-modal .historical-billing-dynamic-form-card {
        border: 0;
        border-radius: 0;
        padding: 0;
        background: transparent;
        margin-bottom: 12px;
      }

      .historical-billing-modal .historical-billing-dynamic-rendered-form {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        margin: 0 -6px;
        width: 100%;
      }

      .historical-billing-modal .historical-billing-dynamic-rendered-form > .rendered-form,
      .historical-billing-modal .historical-billing-dynamic-rendered-form .rendered-form > .row {
        width: 100%;
      }

      .historical-billing-modal .historical-billing-dynamic-rendered-form .rendered-form > .row {
        display: flex;
        flex-wrap: wrap;
      }

      .historical-billing-modal .historical-billing-dynamic-form-field {
        box-sizing: border-box;
        flex: 0 0 100%;
        max-width: 100%;
        padding: 0 6px;
        margin-bottom: 12px;
      }

      .historical-billing-modal .historical-billing-dynamic-col-4 {
        flex-basis: 33.333333%;
        max-width: 33.333333%;
      }

      .historical-billing-modal .historical-billing-dynamic-col-6 {
        flex-basis: 50%;
        max-width: 50%;
      }

      .historical-billing-modal .historical-billing-dynamic-col-8 {
        flex-basis: 66.666667%;
        max-width: 66.666667%;
      }

      .historical-billing-modal .historical-billing-dynamic-col-12 {
        flex-basis: 100%;
        max-width: 100%;
      }

      .historical-billing-modal .historical-billing-dynamic-form-field input,
      .historical-billing-modal .historical-billing-dynamic-form-field select,
      .historical-billing-modal .historical-billing-dynamic-form-field textarea {
        width: 100%;
        box-sizing: border-box;
      }

      .historical-billing-modal .historical-billing-form-error {
        color: #cf1322;
        margin-bottom: 8px;
      }

      @media (max-width: 900px) {
        .historical-billing-modal .historical-billing-dynamic-col-4,
        .historical-billing-modal .historical-billing-dynamic-col-6,
        .historical-billing-modal .historical-billing-dynamic-col-8 {
          flex-basis: 100% !important;
          max-width: 100% !important;
        }
      }
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
      exe('RepoProduct', { operation: 'GET' }),
      exe('RepoPaymentMethodCatalog', { operation: 'GET' }),
      exe('RepoRelationshipCatalog', { operation: 'GET', filter: "principalType = 'PERSON'" })
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
      setCollectionPaymentMethodOptions(getRows(responses[2]).map(item => ({
        value: text(item && item.code),
        label: text(item && (item.name || item.code)),
        formId: number(item && item.formId)
      })).filter(item => item.value));
      setRelationshipOptions(getRows(responses[3]).map(item => ({
        value: text(item && item.id),
        label: text(item && item.name)
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
      const contactNameFilter = `(([isPerson] = 1 AND CONCAT_WS(' ', [name], [surname1]) LIKE N'${escaped}%') OR ([isPerson] = 0 AND [surname2] LIKE N'${escaped}%'))`;
      const filter = isNumericId && query.length < 3
        ? `(inactive=0) AND [id] = ${numericId}`
        : `(inactive=0) AND (${contactNameFilter} OR ([cnp] LIKE N'%${escaped}%') OR ([nif] LIKE N'%${escaped}%')${idFilter})`;

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
    paymentsLoadedPolicyRef.current = null;
    setPaymentRows([]);
    setSelectedRow(null);
    setPolicyInfo(null);
    setActiveTab('search');
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
    paymentsLoadedPolicyRef.current = null;
    setPaymentRows([]);
    setPaymentsLoading(false);
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

  function entityField(entity, names) {
    if (Array.isArray(entity)) return entity.length ? entityField(entity[0], names) : '';
    if (!entity) return '';
    if (entity.Contact || entity.contact) return entityField(entity.Contact || entity.contact, names);
    for (let index = 0; index < names.length; index += 1) {
      const value = text(entity[names[index]]);
      if (value) return value;
    }
    return '';
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

  function renderAllocationLink(value) {
    const allocationId = Number(value || 0);
    if (!(allocationId > 0)) return '-';
    return (
      <Button
        type="link"
        size="small"
        style={{ padding: 0, height: 'auto', lineHeight: 1.2, fontSize: 12 }}
        onClick={event => {
          event.stopPropagation();
          window.open(`#/allocation?id=${allocationId}`, '_blank', 'noopener,noreferrer');
        }}
      >
        {allocationId}
      </Button>
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
    paymentsLoadedPolicyRef.current = null;
    setPaymentRows([]);
    setCollectionCutoffValue(undefined);
    setPolicyLoading(true);
    setSelectedRow(record);
    setActiveTab('general');
  }

  function loadPolicyPayments(policyId) {
    const id = Number(policyId) || 0;
    if (!id || paymentsLoadedPolicyRef.current === id) return;

    paymentsLoadedPolicyRef.current = id;
    setPaymentsLoading(true);
    exe('RepoTransfer', {
      operation: 'GET',
      filter: `([Transfer].lifePolicyId = ${id} OR EXISTS (SELECT 1 FROM AllocationInstallment ai WHERE ai.allocationId = [Transfer].allocationId AND ai.lifePolicyId = ${id})) AND [Transfer].[status] in (1,2) AND [Transfer].[executed] = 1 AND [Transfer].[isExternal] = 1`,
      include: ['Allocation', 'Allocation.InstallmentPremiums', 'TransferWorkspace', 'IncomeType'],
      noTracking: true
    }).then(response => {
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('Payments could not be loaded.'));
      }
      setPaymentRows(getRows(response));
    }).catch(error => {
      paymentsLoadedPolicyRef.current = null;
      setPaymentRows([]);
      message.error(error && error.message ? error.message : t('Payments could not be loaded.'));
    }).finally(() => setPaymentsLoading(false));
  }

  function handleTabChange(tabKey) {
    if (tabKey === 'payments' && selectedRow) {
      loadPolicyPayments(selectedRow.policyId);
    }
    setActiveTab(tabKey);
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
    { title: t('Installment Number'), dataIndex: 'numberInYear', key: 'numberInYear', width: 100, align: 'center' },
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
  const detailMainInsured = firstEntity(detailPolicy, ['MainInsured', 'mainInsured'])
    || (Array.isArray(detailPolicy.Insureds)
      ? detailPolicy.Insureds.find(item => Number(item && (item.isMainInsured || item.mainInsured)) === 1)
      : null)
    || {};
  const mainInsuredRelationship = detailMainInsured.relationship;
  const mainInsuredRelationshipCode = mainInsuredRelationship && typeof mainInsuredRelationship === 'object'
    ? (mainInsuredRelationship.code !== undefined && mainInsuredRelationship.code !== null
      ? mainInsuredRelationship.code
      : mainInsuredRelationship.id)
    : mainInsuredRelationship;
  const mainInsuredRelationshipName = mainInsuredRelationship && typeof mainInsuredRelationship === 'object'
    ? (mainInsuredRelationship.name || mainInsuredRelationship.description || mainInsuredRelationship.label)
    : (detailMainInsured.Relationship && (detailMainInsured.Relationship.name || detailMainInsured.Relationship.description || detailMainInsured.Relationship.label));
  const relationshipCatalogOption = relationshipOptions.find(item =>
    text(item && item.value) === text(mainInsuredRelationshipCode)
  );
  const collectionPayerId = entityField(detailHolder, ['cnp', 'nif', 'nationalId', 'identification']) || '-';
  const collectionPayerName = entityName(detailHolder);
  const collectionPayerRelationship = Number(mainInsuredRelationshipCode) === 0
    ? t('Principal')
    : text(relationshipCatalogOption && relationshipCatalogOption.label || mainInsuredRelationshipName || mainInsuredRelationshipCode) || '-';
  const collectionPayerNationality = entityField(detailHolder, ['nationality', 'nationalityName', 'country']) || '-';
  const collectionPayerPhone = entityField(detailHolder, ['phone', 'telephone', 'phoneNumber']) || '-';
  const collectionPayerEmail = entityField(detailHolder, ['email', 'emailAddress']) || '-';
  const collectionZone = text(detailPolicy.collectionZone || detailPolicy.collectionZoneName || detailPolicy.collectionZoneCode || detailPolicy.zone) || '-';
  const collectionExecutive = text(detailPolicy.collectionExecutive || detailPolicy.collectionExecutiveName || detailPolicy.executive) || '-';
  const collectionCollector = text(detailPolicy.collector || detailPolicy.collectorName || detailPolicy.collectionUser) || '-';
  const collectionMethodCode = text(detailPolicy.paymentMethodCode || detailPolicy.collectionMethod || detailPolicy.paymentMethod);
  const collectionMethodOption = collectionPaymentMethodOptions.find(item => text(item && item.value) === collectionMethodCode);
  const collectionMethod = text(collectionMethodOption && collectionMethodOption.label || detailPolicy.collectionMethodName || detailPolicy.paymentMethodName || collectionMethodCode) || '-';
  React.useEffect(() => {
    const value = text(detailPolicy.collectionCutoff || detailPolicy.cutoffDate || detailPolicy.cutoff);
    setCollectionCutoffValue(['1', '2', '3', '4', '5'].includes(value) ? value : undefined);
  }, [policyInfo]);
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

  function getPaymentMovementChildren(group) {
    if (!group) return [];
    if (Array.isArray(group.AllocationMovements)) return group.AllocationMovements;
    if (Array.isArray(group.movements)) return group.movements;
    if (Array.isArray(group.Movements)) return group.Movements;
    return [];
  }

  function getPaymentAppliedInstallments(group) {
    const values = [];
    const appendInstallments = installments => {
      if (Array.isArray(installments)) values.push(...installments);
      else if (installments && typeof installments === 'object') values.push(installments);
    };
    [group].concat(getPaymentMovementChildren(group)).forEach(item => {
      const allocations = [item && item.Allocation, item && item.allocation].filter(Boolean);
      allocations.forEach(allocation => {
        const installments = allocation.InstallmentPremiums || allocation.installmentPremiums || allocation.AllocationInstallments || allocation.allocationInstallments;
        appendInstallments(installments);
      });
      const installments = item && (item.InstallmentPremiums || item.installmentPremiums || item.AllocationInstallments || item.allocationInstallments);
      appendInstallments(installments);
    });
    return values.filter((value, index, items) => items.findIndex(item =>
      (value && item && value.id && item.id === value.id) ||
      (value && item && !value.id && !item.id && value.payPlanId === item.payPlanId && value.lifePolicyId === item.lifePolicyId)
    ) === index);
  }

  function getPaymentReference(group, item) {
    const reference = text(group && (group.reference || group.Reference)) || text(item && (item.reference || item.Reference));
    const conceptValue = text(group && group.concept) || text(item && item.concept);
    const concept = conceptValue
      .replace(/^IW\b/, 'Pago de prima')
      .replace(/Reversal of/g, 'Reversión de');
    return [concept, reference].filter(Boolean).join(' - ') || '-';
  }

  const paymentGridRows = paymentRows.map((group, index) => {
    const movementChildren = getPaymentMovementChildren(group);
    const item = movementChildren.find(movement => Number(movement && movement.id) === Number(group && group.id))
      || movementChildren.find(movement => movement && movement.isExternal === true)
      || movementChildren[0]
      || group
      || {};
    const installments = getPaymentAppliedInstallments(group);
    const allocation = group && (group.Allocation || group.allocation);
    const paymentAmount = number(group && group.amount) || number(item && item.amount) || installments.reduce((total, installment) => total + firstNumber(installment, ['moneyInAmount', 'amount', 'premiumAmount'], 0), 0);
    const complementaryAmount = installments.reduce((total, installment) => total + firstNumber(installment, ['complementaryAmount', 'moneyComplementary', 'supplementaryAmount', 'supplementary'], 0), 0) || firstNumber(allocation, ['supplementaryAmount'], 0);
    const workspace = group && (group.TransferWorkspace || group.transferWorkspace)
      || allocation && (allocation.TransferWorkspace || allocation.transferWorkspace);
    const paymentPolicy = detailPolicy.code || generalData.policy || '-';
    const paymentProduct = detailPolicy.Product || detailPolicy.product || {};
    const paymentLineCode = text(detailPolicy.lob || detailPolicy.lobCode || detailPolicy.lineCode || paymentProduct.lob || paymentProduct.lobCode || paymentProduct.line);
    const paymentLineCatalog = lineOptions.find(option => text(option && option.value) === paymentLineCode);
    const paymentLine = text(detailPolicy.lineName || detailPolicy.lobName || paymentLineCatalog && paymentLineCatalog.label || paymentProduct.lobName || paymentProduct.lineName || paymentProduct.name || paymentLineCode);
    const directPayPlanIds = [group, item].concat(getPaymentMovementChildren(group)).map(value => Number(value && (value.payPlanId || value.PayPlanId))).filter(value => Number.isFinite(value) && value > 0);
    const fallbackInstallments = directPayPlanIds.map(payPlanId => detailPolicy.PayPlan && detailPolicy.PayPlan.find(payPlan => Number(payPlan && payPlan.id) === payPlanId)).filter(Boolean);
    const paymentInstallments = installments.length ? installments : fallbackInstallments;
    const paymentInstallmentsWithPlan = paymentInstallments.map(installment => {
      const payPlanId = Number(installment && (installment.payPlanId || installment.PayPlanId) || 0);
      const payPlan = payPlanId > 0 && Array.isArray(detailPolicy.PayPlan)
        ? detailPolicy.PayPlan.find(item => Number(item && item.id) === payPlanId)
        : null;
      return payPlan ? { ...payPlan, ...installment } : installment;
    });
    const paymentInstallmentNumbers = Array.from(new Set(
      paymentInstallmentsWithPlan
        .map(installment => installment.numberInYear || installment.NumberInYear || installment.number || installment.PayPlan && installment.PayPlan.numberInYear)
        .filter(Boolean)
        .map(value => String(value))
    )).join(', ');
    return {
      key: `${item.id || group.id || 'payment'}-${index}`,
      cashDate: workspace && (workspace.date || workspace.Date) || group.date || item.date,
      currency: text(group.currency || item.currency || allocation && allocation.currency) || '-',
      observations: getPaymentReference(group, item),
      transferId: item.id || group.id || '-',
      allocationId: allocation && allocation.id || group && group.allocationId || item && item.allocationId || '-',
      line: paymentLine || '-',
      policy: paymentPolicy,
      installment: paymentInstallmentNumbers || '-',
      paid: paymentAmount,
      complementary: complementaryAmount,
      cashier: text(workspace && workspace.user || group.user || item.user) || '-',
      payer: entityName(detailHolder)
    };
  });

  const paymentColumns = [
    { title: t('Cash desk date'), dataIndex: 'cashDate', key: 'cashDate', width: 120, align: 'center', render: formatDate },
    { title: t('Currency'), dataIndex: 'currency', key: 'currency', width: 90, align: 'center' },
    { title: t('Observations'), dataIndex: 'observations', key: 'observations', width: 240, ellipsis: true },
    { title: t('Transfer ID'), dataIndex: 'transferId', key: 'transferId', width: 110, align: 'center' },
    { title: t('Allocation ID'), dataIndex: 'allocationId', key: 'allocationId', width: 110, align: 'center', render: renderAllocationLink },
    { title: t('Line of business'), dataIndex: 'line', key: 'line', width: 170, ellipsis: true },
    { title: t('Policy'), dataIndex: 'policy', key: 'policy', width: 150, render: (value) => renderPolicyLink(value, detailPolicy.id || generalData.policyId) },
    { title: t('Installment no.'), dataIndex: 'installment', key: 'installment', width: 110, align: 'center' },
    { title: t('Paid'), dataIndex: 'paid', key: 'paid', width: 120, align: 'right', render: renderMoney },
    { title: t('Supplementary premiums'), dataIndex: 'complementary', key: 'complementary', width: 160, align: 'right', render: renderMoney },
    { title: t('Cashier'), dataIndex: 'cashier', key: 'cashier', width: 220, ellipsis: true },
    { title: t('Payer'), dataIndex: 'payer', key: 'payer', width: 220, ellipsis: true, render: value => renderContactLink(detailHolder, value) }
  ];
  const paymentTotalPaid = paymentGridRows.reduce((total, row) => total + number(row.paid), 0);
  const paymentTotalComplementary = paymentGridRows.reduce((total, row) => total + number(row.complementary), 0);

  const restructureFrequencyOptions = [
    { value: 'm', label: t('Monthly'), months: 1 },
    { value: 'b', label: t('Bimonthly'), months: 2 },
    { value: 't', label: t('Quarterly'), months: 3 },
    { value: 's', label: t('Semiannual'), months: 6 },
    { value: 'y', label: t('Annual'), months: 12 }
  ];

  function getRestructureFrequencyMonths(value) {
    const option = restructureFrequencyOptions.find(item => item.value === text(value).toLowerCase());
    return option ? option.months : 1;
  }

  function openRestructureModal() {
    const currentFrequency = text(detailPolicy.periodicity).toLowerCase();
    restructureForm.setFieldsValue({
      newFrequency: restructureFrequencyOptions.some(item => item.value === currentFrequency) ? currentFrequency : 'm',
      newInstallments: installmentRows.length || 1,
      effectiveDate: typeof moment !== 'undefined' && detailPolicy.start ? moment(detailPolicy.start) : null,
      startDate: typeof moment !== 'undefined' && detailPolicy.start ? moment(detailPolicy.start) : null,
      description: ''
    });
    setRestructurePreviewRows([]);
    setRestructurePreviewDirty(false);
    setRestructureModalOpen(true);
  }

  function calculateRestructure(values) {
    const currentRows = installmentRows.slice();
    const desiredInstallments = Number(values && values.newInstallments);
    const paidRows = currentRows.filter(row => number(row && row.payed) > 0);
    const startDate = values && values.startDate;
    const policyStart = detailPolicy.start && typeof moment !== 'undefined' ? moment(detailPolicy.start) : null;
    const policyEnd = detailPolicy.end && typeof moment !== 'undefined' ? moment(detailPolicy.end) : null;
    const frequencyMonths = getRestructureFrequencyMonths(values && values.newFrequency);

    if (!desiredInstallments || desiredInstallments < 1 || desiredInstallments % 1 !== 0) {
      throw new Error(t('The installment count must be a positive integer.'));
    }
    if (desiredInstallments <= paidRows.length) {
      throw new Error(t('The number of installments must be greater than the paid installments.'));
    }
    if (!startDate || typeof startDate.isValid !== 'function' || !startDate.isValid()) {
      throw new Error(t('The start date is required.'));
    }
    if (policyStart && startDate.isBefore(policyStart, 'day')) {
      throw new Error(t('The start date cannot be earlier than the policy start date.'));
    }
    if (policyEnd && startDate.isAfter(policyEnd, 'day')) {
      throw new Error(t('The start date cannot be later than the policy end date.'));
    }

    const pendingAmount = currentRows.reduce((total, row) => total + number(row && row.minimum) - number(row && row.payed), 0);
    const remainingSlots = desiredInstallments - paidRows.length;
    const baseCents = Math.max(0, Math.round(pendingAmount * 100));
    const centsPerRow = Math.floor(baseCents / remainingSlots);
    const remainder = baseCents - centsPerRow * remainingSlots;
    const unpaidRows = currentRows.filter(row => number(row && row.payed) <= 0);
     const lockedRows = paidRows.map(row => ({
       ...row,
       dueAmount: 0,
       pendingAmount: 0,
       pending: false,
       edited: false,
       PayPlanDetail: Array.isArray(row && row.PayPlanDetail)
         ? row.PayPlanDetail.map(detail => ({ ...detail }))
         : []
     }));
    const newRows = [];

    for (let index = 0; index < remainingSlots; index += 1) {
      const originalRow = unpaidRows[index] || null;
      const sourceRow = originalRow || unpaidRows[unpaidRows.length - 1] || {};
      const dueDate = startDate.clone().add(frequencyMonths * index, 'months');
      const coveredUntil = dueDate.clone().add(frequencyMonths, 'months');
      const amount = (centsPerRow + (index === remainingSlots - 1 ? remainder : 0)) / 100;
      const dueDateIso = toRestructureUtcIso(dueDate);
      const coveredUntilIso = toRestructureUtcIso(coveredUntil);
      const edited = !!originalRow && (
        String(sourceRow.dueDate || sourceRow.normalDueDate || '') !== String(dueDateIso) ||
        number(sourceRow.minimum) !== amount ||
        number(sourceRow.expected) !== amount
      );

      newRows.push({
        ...sourceRow,
        id: originalRow && originalRow.id != null ? originalRow.id : 0,
        tempKey: `restructure-preview-${index + 1}`,
        numberInYear: paidRows.length + index + 1,
        minimum: amount,
        expected: amount,
        dueAmount: amount,
        pendingAmount: amount,
        payed: 0,
        payedDate: null,
        dueDate: dueDateIso,
        normalDueDate: dueDateIso,
        coveredUntil: coveredUntilIso,
        pending: true,
        final: index === remainingSlots - 1,
        edited,
        PayPlanDetail: Array.isArray(sourceRow.PayPlanDetail)
          ? sourceRow.PayPlanDetail.map(detail => ({ ...detail }))
          : []
      });
    }

    setRestructurePreviewRows(lockedRows.concat(newRows));
    setRestructurePreviewDirty(false);
    message.success(t('Preview updated successfully'));
  }

  function openEndorsementModal() {
    if (!restructurePreviewRows.length) {
      message.warning(t('Calculate the new installments before executing the endorsement.'));
      return;
    }
    if (restructurePreviewDirty) {
      message.warning(t('Calculate the new installments again before executing the endorsement.'));
      return;
    }

    restructureForm.validateFields(['newFrequency', 'newInstallments', 'startDate']).then(values => {
      endorsementForm.setFieldsValue({
        effectiveDate: values.startDate || (typeof moment !== 'undefined' && detailPolicy.start ? moment(detailPolicy.start) : null),
        description: ''
      });
      setEndorsementModalOpen(true);
    }).catch(() => {});
  }

  function getRestructureDueDateMoment(row) {
    if (!row || typeof moment === 'undefined') return null;
    const value = row.dueDate || row.normalDueDate || row.coveredUntil;
    if (!value) return null;
    const date = moment(value);
    return date.isValid() ? date : null;
  }

  function toRestructureUtcIso(dateLike) {
    if (!dateLike || typeof dateLike.year !== 'function') return null;
    const utcDate = new Date(Date.UTC(
      dateLike.year(),
      dateLike.month(),
      dateLike.date(),
      dateLike.hour(),
      dateLike.minute(),
      dateLike.second(),
      dateLike.millisecond()
    ));
    return utcDate.toISOString();
  }

  function updateRestructureDueDate(rowIndex, selectedDate) {
    if (!selectedDate || typeof selectedDate.isValid !== 'function' || !selectedDate.isValid()) {
      message.error(t('The due date is required.'));
      return;
    }

    setRestructurePreviewRows(previousRows => {
      const nextRows = previousRows.slice();
      const currentRow = nextRows[rowIndex];
      if (!currentRow || number(currentRow.payed) > 0) return previousRows;

      const previousDate = getRestructureDueDateMoment(nextRows[rowIndex - 1]);
      const nextDate = getRestructureDueDateMoment(nextRows[rowIndex + 1]);
      if (previousDate && selectedDate.isBefore(previousDate, 'day')) {
        message.error(t('The due date cannot be earlier than the previous installment date.'));
        return previousRows;
      }
      if (nextDate && selectedDate.isAfter(nextDate, 'day')) {
        message.error(t('The due date cannot be greater than the next installment date.'));
        return previousRows;
      }

      const updatedDate = toRestructureUtcIso(selectedDate);
      if (!updatedDate) return previousRows;
      nextRows[rowIndex] = {
        ...currentRow,
        dueDate: updatedDate,
        normalDueDate: updatedDate,
        edited: true
      };
      return nextRows;
    });
    setRestructurePreviewDirty(false);
  }

  function getResponseId(response, fieldName) {
    const first = getRows(response)[0] || {};
    return number(response && response[fieldName]) || number(response && response.id) || number(first[fieldName]) || number(first.id);
  }

  function buildRestructureEffectiveDate(value) {
    if (!value || typeof value.toDate !== 'function') return '';
    const selectedDate = value.toDate();
    const now = new Date();
    const date = new Date(Date.UTC(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds()
    ));
    const pad = part => String(part).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.${milliseconds}0000`;
  }

  function parsePaymentMethodSelectedDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }
    if (typeof value.format === 'function') return parsePaymentMethodSelectedDate(value.format('YYYY-MM-DD'));
    const raw = text(value);
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parts = raw.split('-');
      const date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function parsePaymentMethodUtcDate(value) {
    const raw = text(value);
    if (!raw) return null;
    const utcValue = /z$/i.test(raw) || /[+-]\d{2}:?\d{2}$/i.test(raw) ? raw : `${raw}Z`;
    const date = new Date(utcValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatPaymentMethodUtcDateTime7(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const pad = value => String(value).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.${milliseconds}0000`;
  }

  function buildPaymentMethodEffectiveDate(policyStart, value) {
    const selectedDate = parsePaymentMethodSelectedDate(value);
    if (!selectedDate) return null;
    const now = new Date();
    const startDate = parsePaymentMethodUtcDate(policyStart);
    const selectedTime = Date.UTC(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds()
    );
    if (startDate && selectedTime < startDate.getTime()) {
      return formatPaymentMethodUtcDateTime7(new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCDate(),
        startDate.getUTCHours(),
        startDate.getUTCMinutes(),
        startDate.getUTCSeconds(),
        startDate.getUTCMilliseconds()
      )));
    }
    return formatPaymentMethodUtcDateTime7(new Date(selectedTime));
  }

  async function executeRestructure(values) {
    if (!restructurePreviewRows.length) {
      throw new Error(t('Calculate the new installments before executing the endorsement.'));
    }
    const effectiveDate = buildRestructureEffectiveDate(values && values.effectiveDate);
    if (!effectiveDate || !values.startDate || !text(values && values.description)) {
      throw new Error(t('The effective date and endorsement description are required.'));
    }

    const editedPayPlan = restructurePreviewRows.map(row => {
      const cloned = {
        ...row,
        PayPlanDetail: Array.isArray(row && row.PayPlanDetail)
          ? row.PayPlanDetail.map(detail => ({ ...detail }))
          : []
      };
      delete cloned.tempKey;
      return cloned;
    });
    const changeResponse = await exe('ChangePayPlan', {
      policyId: detailPolicy.id || selectedRow.policyId,
      effectiveDate: effectiveDate,
      operation: 'ADD',
      code: null,
      note: text(values.description),
      changeIdToBeAmended: null,
      jEditedPayPlan: JSON.stringify(editedPayPlan),
      Surcharges: []
    });
    if (!changeResponse || !changeResponse.ok) {
      throw new Error(changeResponse && changeResponse.msg ? changeResponse.msg : t('The endorsement could not be created.'));
    }

    const changeId = getResponseId(changeResponse, 'changeId');
    if (!(changeId > 0)) throw new Error(t('The endorsement change could not be determined.'));
    const previousFrequency = escapeSql(detailPolicy.periodicity);
    const newFrequency = escapeSql(values && values.newFrequency);
    const currentPaymentMethod = escapeSql(detailPolicy.paymentMethodCode || detailPolicy.paymentMethod);
    const changeFields = await exe('SetField', {
      entity: 'Change',
      entityId: changeId,
      fieldValue: `newPaymentMethod='${currentPaymentMethod}',oldPaymentMethod='${currentPaymentMethod}',newFrequency='${newFrequency}',oldFrequency='${previousFrequency}'`
    });
    if (!changeFields || changeFields.ok === false) {
      throw new Error(changeFields && changeFields.msg ? changeFields.msg : t('The endorsement fields could not be updated.'));
    }
    const changeEntity = await exe('LoadEntity', { entity: 'Change', fields: 'id,processId', filter: `id=${changeId}`, noTracking: true });
    const processId = getResponseId(changeEntity, 'processId');
    if (!(processId > 0)) throw new Error(t('The endorsement workflow process could not be determined.'));
    const approval = await exe('GotoStep', { procesoId: processId, estado: 'APROVED' });
    if (!approval || approval.ok === false) throw new Error(approval && approval.msg ? approval.msg : t('The endorsement workflow could not be approved.'));
     const executeResponse = await exe('ExeChangePayPlan', { changeId: changeId, operation: 'EXECUTE', exeNow: true });
     if (!executeResponse || !executeResponse.ok) throw new Error(executeResponse && executeResponse.msg ? executeResponse.msg : t('The endorsement could not be executed.'));

     setRestructureModalOpen(false);
     setEndorsementModalOpen(false);
     setRestructurePreviewRows([]);
     setRestructurePreviewDirty(false);
     restructureForm.resetFields();
     endorsementForm.resetFields();
     setPolicyReloadToken(value => value + 1);
    message.success(executeResponse.msg || t('Endorsement executed successfully'));
   }

  function openCollectionMethodModal() {
    collectionMethodForm.resetFields();
    setCollectionMethodDynamicForm(null);
    collectionMethodForm.setFieldsValue({
      effectiveDate: typeof moment !== 'undefined'
        ? (detailPolicy.start ? moment(detailPolicy.start) : moment())
        : null,
      newPaymentMethod: undefined,
      observations: ''
    });
    setCollectionMethodModalOpen(true);
  }

  function getCollectionMethodFormId(methodCode) {
    const option = collectionPaymentMethodOptions.find(item => item && text(item.value) === text(methodCode));
    return option && number(option.formId) > 0 ? number(option.formId) : 0;
  }

  function loadCollectionMethodDynamicForm(methodCode) {
    const formId = getCollectionMethodFormId(methodCode);
    if (!formId) {
      setCollectionMethodDynamicForm(null);
      return;
    }

    setCollectionMethodDynamicForm({ formId, form: null, loading: true, error: '' });
    exe('GetForms', { filter: `id=${formId}` })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The payment form could not be loaded.'));
        }
        const form = getRows(response)[0];
        if (!form) throw new Error(t('The payment form was not found.'));
        setCollectionMethodDynamicForm({ formId, form, loading: false, error: '' });
      })
      .catch(error => {
        setCollectionMethodDynamicForm({
          formId,
          form: null,
          loading: false,
          error: error && error.message ? error.message : String(error)
        });
      });
  }

  async function executeCollectionMethodChange(values) {
    const policyId = Number(detailPolicy.id || selectedRow && selectedRow.policyId) || 0;
    if (!policyId) throw new Error(t('Select a policy before changing the collection method.'));
    const effectiveDate = buildPaymentMethodEffectiveDate(detailPolicy.start, values && values.effectiveDate);
    const newPaymentMethod = text(values && values.newPaymentMethod);
    const observations = text(values && values.observations);
    if (!effectiveDate || !newPaymentMethod || !observations) {
      throw new Error(t('The effective date, new payment method and observations are required.'));
    }

    setCollectionMethodChanging(true);
    try {
      const response = await exe('ChangePaymentMethod', {
        policyId: policyId,
        newPaymentMethod: newPaymentMethod,
        effectiveDate: effectiveDate,
        note: observations,
        informative: true,
        operation: 'ADD'
      });
      if (!response || !response.ok) {
        throw new Error(response && response.msg ? response.msg : t('The collection method could not be changed.'));
      }
      const changeId = getResponseId(response, 'changeId');
      if (!(changeId > 0)) throw new Error(t('The endorsement change could not be determined.'));
      const changeEntity = await exe('LoadEntity', { entity: 'Change', fields: 'id,processId', filter: `id=${changeId}`, noTracking: true });
      const processId = getResponseId(changeEntity, 'processId');
      if (!(processId > 0)) throw new Error(t('The endorsement workflow process could not be determined.'));
      const approval = await exe('GotoStep', { procesoId: processId, estado: 'APROVED' });
      if (!approval || !approval.ok) throw new Error(approval && approval.msg ? approval.msg : t('The endorsement workflow could not be approved.'));
      const executeResponse = await exe('ExeChangePaymentMethod', { changeId: changeId, operation: 'EXECUTE', exeNow: true });
      if (!executeResponse || !executeResponse.ok) throw new Error(executeResponse && executeResponse.msg ? executeResponse.msg : t('The collection method could not be changed.'));
      setCollectionMethodModalOpen(false);
      collectionMethodForm.resetFields();
      setPolicyReloadToken(value => value + 1);
      message.success(executeResponse.msg || response.msg || t('Collection method changed successfully.'));
    } finally {
      setCollectionMethodChanging(false);
    }
  }

  React.useEffect(() => {
    const config = collectionMethodDynamicForm;
    if (!config || config.loading || !config.form) return undefined;
    if (typeof $ === 'undefined' || !$.fn || typeof $.fn.formRender !== 'function') return undefined;

    const container = document.getElementById('historical-billing-collection-method-form');
    if (!container) return undefined;

    let formData = config.form.json;
    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch (error) {
        setCollectionMethodDynamicForm(current => current && current.formId === config.formId
          ? { ...current, form: null, error: t('The payment form definition is invalid.') }
          : current);
        return undefined;
      }
    }
    if (!Array.isArray(formData)) return undefined;

    container.innerHTML = '';
    $(container).formRender({ formData });
    container.classList.add('historical-billing-dynamic-rendered-form');
    container.querySelectorAll('.rendered-form > .row, .rendered-form .row').forEach(row => {
      row.style.display = 'flex';
      row.style.flexWrap = 'wrap';
      row.style.width = '100%';
    });
    container.querySelectorAll('[class*="col-md-"]').forEach(control => {
      const field = control.closest('.form-group') || control.parentElement;
      if (!field || field === container) return;

      field.classList.add('historical-billing-dynamic-form-field');
      field.style.boxSizing = 'border-box';
      field.style.paddingLeft = '6px';
      field.style.paddingRight = '6px';
      field.style.marginBottom = '12px';

      const match = String(control.className || '').match(/\bcol-md-(4|6|8|12)\b/);
      const columnUnits = match ? Number(match[1]) : 12;
      const columnSize = (columnUnits / 12) * 100;
      field.classList.add(`historical-billing-dynamic-col-${columnUnits}`);
      field.style.flex = `0 0 ${columnSize}%`;
      field.style.maxWidth = `${columnSize}%`;
      control.style.width = '100%';
      control.style.maxWidth = '100%';
      control.style.boxSizing = 'border-box';
    });

    if (config.form.logic) {
      try {
        function runDynamicFormLogic() {
          return eval(config.form.logic);
        }
        runDynamicFormLogic.call({ exe });
      } catch (error) {
        message.error(error && error.message ? error.message : String(error));
      }
    }

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [collectionMethodDynamicForm]);

  return (
    <div className="historical-billing-view">
      <Card size="small">
        <Spin spinning={loading || policyLoading}>
         <Tabs className="historical-billing-tabs" activeKey={activeTab} onChange={handleTabChange} type="card">
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
                <>
                  <div className="historical-billing-toolbar">
                    <Button type="primary" onClick={openRestructureModal}>{t('Restructure installments')}</Button>
                  </div>
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
                </>
              )}
            </div>
          </TabPane>
          <TabPane tab={<span><PaymentTabIcon />{t('Payments')}</span>} key="payments" disabled={!selectedRow}>
            <div className="historical-billing-filter-panel">
              {!selectedRow ? (
                <div className="historical-billing-general-empty">{t('Select a policy from the search results to view its payments.')}</div>
              ) : (
                <Table
                  className="historical-billing-table"
                  rowKey="key"
                  size="small"
                  bordered
                  loading={paymentsLoading}
                  columns={paymentColumns}
                  dataSource={paymentGridRows}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={8}>
                          <strong>{t('Totals')}</strong> | {t('Payments')}: {paymentGridRows.length}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8} align="right">{renderMoney(paymentTotalPaid)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={9} align="right">{renderMoney(paymentTotalComplementary)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={10} colSpan={2}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                  pagination={false}
                  scroll={{ x: 1820, y: 'calc(100dvh - 310px)' }}
                  locale={{ emptyText: t('No payments found.') }}
                />
              )}
            </div>
          </TabPane>
          <TabPane tab={<span><PaymentTabIcon />{t('Collection information')}</span>} key="collection-info" disabled={!selectedRow}>
            <div className="historical-billing-filter-panel">
              {!selectedRow ? (
                <div className="historical-billing-general-empty">{t('Select a policy from the search results to view its collection information.')}</div>
              ) : (
                <Row gutter={12}>
                  <Col xs={24} lg={12}>
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('Payer information')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Relationship')}</div><div className="historical-billing-data-value">{collectionPayerRelationship}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Payer ID')}</div><div className="historical-billing-data-value">{renderCopyableText(collectionPayerId)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Payer name')}</div><div className="historical-billing-data-value">{renderCopyableText(collectionPayerName || '-')}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Payer nationality')}</div><div className="historical-billing-data-value">{collectionPayerNationality}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Payer phone')}</div><div className="historical-billing-data-value">{renderCopyableText(collectionPayerPhone)}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Payer email')}</div><div className="historical-billing-data-value">{renderCopyableText(collectionPayerEmail)}</div></div>
                    </div>
                  </Col>
                  <Col xs={24} lg={12}>
                    <div className="historical-billing-data-card">
                      <div className="historical-billing-section-title">{t('Collection information')}</div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Collection zone')}</div><div className="historical-billing-data-value">{collectionZone}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Collection executive')}</div><div className="historical-billing-data-value">{collectionExecutive}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Collector')}</div><div className="historical-billing-data-value">{collectionCollector}</div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Collection method')}</div><div className="historical-billing-data-value">
                        <span>{collectionMethod}</span>
                        <Button type="link" size="small" onClick={openCollectionMethodModal}>{t('Change')}</Button>
                      </div></div>
                      <div className="historical-billing-data-row"><div className="historical-billing-data-label">{t('Collection cutoff')}</div><div className="historical-billing-data-value">
                        <Select
                          value={collectionCutoffValue}
                          placeholder={t('Select...')}
                          onChange={setCollectionCutoffValue}
                          style={{ minWidth: 160 }}
                        >
                          <Option value="1">1</Option>
                          <Option value="2">2</Option>
                          <Option value="3">3</Option>
                          <Option value="4">4</Option>
                          <Option value="5">5</Option>
                        </Select>
                      </div></div>
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          </TabPane>
        </Tabs>
        <Modal
          className="historical-billing-modal"
          title={t('Change collection method')}
          open={collectionMethodModalOpen}
          onCancel={() => setCollectionMethodModalOpen(false)}
          footer={null}
          width="520px"
          destroyOnClose
          bodyStyle={{ padding: 12 }}
        >
          <Form
            form={collectionMethodForm}
            layout="vertical"
            onFinish={values => executeCollectionMethodChange(values)
              .catch(error => message.error(error && error.message ? error.message : t('The collection method could not be changed.')))}
          >
            <Form.Item label={t('Endorsement effective date')} name="effectiveDate" rules={[{ required: true, message: t('Select the endorsement effective date.') }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('New payment method')} name="newPaymentMethod" rules={[{ required: true, message: t('Select the new payment method.') }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={collectionPaymentMethodOptions}
                placeholder={t('Select...')}
                onChange={loadCollectionMethodDynamicForm}
              />
            </Form.Item>
            {collectionMethodDynamicForm && (
              <div className="historical-billing-dynamic-form-card">
                {collectionMethodDynamicForm.loading && <Spin size="small" />}
                {collectionMethodDynamicForm.error && (
                  <div className="historical-billing-form-error">{collectionMethodDynamicForm.error}</div>
                )}
                {!collectionMethodDynamicForm.loading && !collectionMethodDynamicForm.error && (
                  <div id="historical-billing-collection-method-form" className="historical-billing-dynamic-form" />
                )}
              </div>
            )}
            <Form.Item label={t('Observations')} name="observations" rules={[{ required: true, message: t('Enter the observations.') }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <div className="historical-billing-toolbar" style={{ justifyContent: 'flex-end' }}>
              <Button type="primary" htmlType="submit" loading={collectionMethodChanging}>{t('Execute')}</Button>
            </div>
          </Form>
        </Modal>
        <Modal
          className="historical-billing-modal"
          title={t('Restructure installments')}
          open={restructureModalOpen}
          onCancel={() => setRestructureModalOpen(false)}
          footer={null}
          width="49vw"
          destroyOnClose
           bodyStyle={{ padding: 12, height: 'calc(68vh - 24px)', overflow: 'hidden' }}
        >
          <Spin spinning={restructureLoading}>
            <Form
              form={restructureForm}
              layout="vertical"
              onValuesChange={() => setRestructurePreviewDirty(true)}
            >
              <div className="historical-billing-toolbar">
                <Button type="primary" htmlType="button" onClick={() => restructureForm.validateFields(['newFrequency', 'newInstallments', 'startDate']).then(calculateRestructure).catch(() => {})}>
                  {t('Calculate installments')}
                </Button>
                <Button type="primary" htmlType="button" onClick={openEndorsementModal} loading={restructureLoading}>
                  {t('Execute endorsement')}
                </Button>
              </div>
              <Row gutter={12}>
                <Col xs={24} md={6}>
                  <Form.Item label={t('New payment frequency')} name="newFrequency" rules={[{ required: true, message: t('Select the new payment frequency.') }]}>
                    <Select options={restructureFrequencyOptions} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item label={t('Number of installments')} name="newInstallments" rules={[{ required: true, message: t('Enter the number of installments.') }]}>
                    <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item label={t('Start date')} name="startDate" rules={[{ required: true, message: t('Select the start date.') }]}>
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Table
                className="historical-billing-table"
                size="small"
                bordered
                pagination={false}
                rowKey={(row, index) => String(row && row.id ? `${row.id}-${index}` : index)}
                dataSource={restructurePreviewRows}
                columns={[
                   { title: t('Installment'), dataIndex: 'numberInYear', key: 'numberInYear', width: 78, align: 'center' },
                   { title: t('Concept'), dataIndex: 'concept', key: 'concept', width: 150, ellipsis: true },
                   { title: t('Amount due'), dataIndex: 'minimum', key: 'minimum', width: 112, align: 'right', render: value => renderMoney(value) },
                   { title: t('Paid'), dataIndex: 'payed', key: 'payed', width: 100, align: 'right', render: value => renderMoney(value) },
                   {
                     title: t('Due date'),
                     dataIndex: 'dueDate',
                     key: 'dueDate',
                     width: 155,
                     align: 'center',
                     render: (value, row, index) => {
                       const isPaid = number(row && row.payed) > 0;
                       return (
                         <DatePicker
                           value={getRestructureDueDateMoment(row)}
                           allowClear={false}
                           disabled={isPaid}
                           format="DD/MM/YYYY"
                           style={{ width: '100%' }}
                           disabledDate={currentDate => {
                             if (isPaid || !currentDate) return false;
                             const previousDate = getRestructureDueDateMoment(restructurePreviewRows[index - 1]);
                             const nextDate = getRestructureDueDateMoment(restructurePreviewRows[index + 1]);
                             return !!((previousDate && currentDate.isBefore(previousDate, 'day')) || (nextDate && currentDate.isAfter(nextDate, 'day')));
                           }}
                           onChange={selectedDate => updateRestructureDueDate(index, selectedDate)}
                         />
                       );
                     }
                   },
                   {
                     title: t('Status'),
                     key: 'status',
                     width: 92,
                     align: 'center',
                     render: (_, row) => {
                       const isPaid = number(row && row.payed) > 0;
                       return (
                         <span
                           className={`historical-billing-installment-status-${isPaid ? 'paid' : 'pending'}`}
                            style={{ color: isPaid ? '#cf1322' : '#237804', fontWeight: 500 }}
                         >
                           {isPaid ? t('Paid') : t('Pending')}
                         </span>
                       );
                     }
                   }
                 ]}
                 tableLayout="fixed"
                 scroll={{ x: 687, y: 360 }}
                locale={{ emptyText: t('Calculate the new installments to preview them.') }}
              />
            </Form>
          </Spin>
        </Modal>
        <Modal
          className="historical-billing-modal"
          title={t('Execute endorsement')}
          open={endorsementModalOpen}
          onCancel={() => setEndorsementModalOpen(false)}
          footer={null}
          width="520px"
          destroyOnClose
          bodyStyle={{ padding: 12 }}
        >
          <Form
            form={endorsementForm}
            layout="vertical"
            onFinish={values => {
              setRestructureLoading(true);
              executeRestructure({ ...restructureForm.getFieldsValue(true), ...values })
                .catch(error => message.error(error && error.message ? error.message : t('The endorsement could not be executed.')))
                .finally(() => setRestructureLoading(false));
            }}
          >
            <Form.Item label={t('Endorsement effective date')} name="effectiveDate" rules={[{ required: true, message: t('Select the endorsement effective date.') }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('Endorsement description')} name="description" rules={[{ required: true, message: t('Enter an endorsement description.') }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <div className="historical-billing-toolbar" style={{ justifyContent: 'flex-end' }}>
              <Button type="primary" htmlType="submit" loading={restructureLoading}>{t('Execute endorsement')}</Button>
            </div>
          </Form>
        </Modal>
        </Spin>
      </Card>
    </div>
  );
}
