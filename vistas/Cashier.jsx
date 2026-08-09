() => {
  const {
    Button,
    Card,
    DatePicker,
    Drawer,
    Dropdown,
    Form,
    Input,
    Layout,
    Modal,
    Popconfirm,
    Popover,
    Radio,
    Select,
    Space,
    Table,
    Tag,
    Tabs,
    Tooltip,
    InputNumber,
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

  const ExecuteMovementIcon = () => (
    <span role="img" aria-label="caret-right" className="anticon anticon-caret-right">
      <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M715.8 493.5L335 165.1c-14.2-12.2-35-1.2-35 18.5v656.8c0 19.7 20.8 30.7 35 18.5l380.8-328.4c10.9-9.4 10.9-27.6 0-37z"></path>
      </svg>
    </span>
  );

  const RevertMovementIcon = () => (
    <span role="img" aria-label="undo" className="anticon anticon-undo">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M511.4 124C290.5 124.3 112 303 112 523.9c0 128 60.2 242 153.8 315.2l-37.5 48c-4.1 5.3-.3 13 6.3 12.9l167-.8c5.2 0 9-4.9 7.7-9.9L369.8 727a8 8 0 00-14.1-3L315 776.1c-10.2-8-20-16.7-29.3-26a318.64 318.64 0 01-68.6-101.7C200.4 609 192 567.1 192 523.9s8.4-85.1 25.1-124.5c16.1-38.1 39.2-72.3 68.6-101.7 29.4-29.4 63.6-52.5 101.7-68.6C426.9 212.4 468.8 204 512 204s85.1 8.4 124.5 25.1c38.1 16.1 72.3 39.2 101.7 68.6 29.4 29.4 52.5 63.6 68.6 101.7 16.7 39.4 25.1 81.3 25.1 124.5s-8.4 85.1-25.1 124.5a318.64 318.64 0 01-68.6 101.7c-7.5 7.5-15.3 14.5-23.4 21.2a7.93 7.93 0 00-1.2 11.1l39.4 50.5c2.8 3.5 7.9 4.1 11.4 1.3C854.5 760.8 912 649.1 912 523.9c0-221.1-179.4-400.2-400.6-399.9z"></path>
      </svg>
    </span>
  );

  const DeleteMovementIcon = () => (
    <span role="img" aria-label="delete" className="anticon anticon-delete">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path>
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

  const MovementIcon = () => (
    <TabIcon label="movements">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M128 192h768v96H128zm0 272h768v96H128zm0 272h768v96H128z"></path>
        <path d="M224 128h96v672h-96zm480 0h96v672h-96z"></path>
      </svg>
    </TabIcon>
  );

  const InstallmentsIcon = () => (
    <span role="img" aria-label="installments" className="anticon anticon-search">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M637 566.7h-30.8l-11-10.6C643.9 507.2 672 436.1 672 359.5 672 187.5 532.5 48 360.5 48S49 187.5 49 359.5 188.5 671 360.5 671c76.6 0 147.7-28.1 196.6-76.8l10.6 11v30.8l214.3 214.3 63.7-63.7L637 566.7zM360.5 585C235.9 585 135 484.1 135 359.5S235.9 134 360.5 134 586 234.9 586 359.5 485.1 585 360.5 585z"></path>
      </svg>
    </span>
  );

  const FileTextOutlined = () => (
    <span role="img" aria-label="file-text" className="anticon anticon-file-text">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M832 64H192c-35.3 0-64 28.7-64 64v768c0 35.3 28.7 64 64 64h640c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64zm-32 800H224V160h576v704z"></path>
        <path d="M288 288h448v64H288zm0 144h448v64H288zm0 144h288v64H288z"></path>
      </svg>
    </span>
  );

  const FilterOutlined = () => (
    <span role="img" aria-label="filter" className="anticon anticon-filter">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M904 160H120c-4.4 0-8 3.6-8 8v72c0 2.2.9 4.2 2.5 5.7L416 546.2V808c0 2.8 1.5 5.4 3.9 6.8l128 72c5.3 3 12.1-.8 12.1-6.8V546.2l301.5-300.5A8 8 0 00864 240v-72c0-4.4-3.6-8-8-8z"></path>
      </svg>
    </span>
  );

  const ReloadOutlined = () => (
    <span role="img" aria-label="reload" className="anticon anticon-reload">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.8-5-.9-10.5-5.9-12.2l-56.7-19.5c-4.2-1.4-8.9.7-10.3 4.9-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-8.9-13-6.2z"></path>
      </svg>
    </span>
  );

  const ClearOutlined = () => (
    <span role="img" aria-label="clear" className="anticon anticon-close-circle">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 816c-203.9 0-368-164.1-368-368s164.1-368 368-368 368 164.1 368 368-164.1 368-368 368z"></path>
        <path d="M646.4 377.6L512 512 377.6 377.6l-56.6 56.6L455.4 568l-134.4 134.4 56.6 56.6L512 624.6l134.4 134.4 56.6-56.6L568.6 568 703 433.6z"></path>
      </svg>
    </span>
  );

  const LockOutlined = () => (
    <span role="img" aria-label="lock" className="anticon anticon-lock">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M832 384h-56V256C776 114.6 661.4 0 520 0h-16C362.6 0 248 114.6 248 256v128h-56c-17.7 0-32 14.3-32 32v512c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V416c0-17.7-14.3-32-32-32zM328 256c0-97.2 78.8-176 176-176h16c97.2 0 176 78.8 176 176v128H328V256zm464 624H232V464h560v416z"></path>
        <path d="M512 560c-44.2 0-80 35.8-80 80 0 29.6 16.1 55.4 40 69.3V784h80v-74.7c23.9-13.9 40-39.7 40-69.3 0-44.2-35.8-80-80-80z"></path>
      </svg>
    </span>
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
  const [newIncomeForm] = Form.useForm();
  const [activeTab, setActiveTab] = React.useState('cash-desks');
  const [movementRows, setMovementRows] = React.useState([]);
  const [movementLoading, setMovementLoading] = React.useState(false);
  const [movementPagination, setMovementPagination] = React.useState({ current: 1, pageSize: 15 });
  const [movementTotal, setMovementTotal] = React.useState(0);
  const [movementActionId, setMovementActionId] = React.useState(0);
  const [movementSelectedRowKeys, setMovementSelectedRowKeys] = React.useState([]);
  const [movementViewVisible, setMovementViewVisible] = React.useState(false);
  const [movementViewRecord, setMovementViewRecord] = React.useState(null);
  const [cashierReports, setCashierReports] = React.useState([]);
  const [collectionRows, setCollectionRows] = React.useState([]);
  const [collectionLoading, setCollectionLoading] = React.useState(false);
  const [collectionPagination, setCollectionPagination] = React.useState({ current: 1, pageSize: 15 });
  const [collectionTotal, setCollectionTotal] = React.useState(0);
  const [collectionFilters, setCollectionFilters] = React.useState({});
  const [collectionFilterVisible, setCollectionFilterVisible] = React.useState(false);
  const [collectionSelectedRowKeys, setCollectionSelectedRowKeys] = React.useState([]);
  const [collectionChargeVisible, setCollectionChargeVisible] = React.useState(false);
  const [collectionExpectedAmount, setCollectionExpectedAmount] = React.useState(0);
  const [collectionChargeStep, setCollectionChargeStep] = React.useState('payment');
  const [collectionPolicyRows, setCollectionPolicyRows] = React.useState([]);
  const [collectionSupplementaryRows, setCollectionSupplementaryRows] = React.useState([]);
  const [collectionExternalPolicyVisible, setCollectionExternalPolicyVisible] = React.useState(false);
  const [collectionExternalPolicyOptions, setCollectionExternalPolicyOptions] = React.useState([]);
  const [collectionExternalPolicyLoading, setCollectionExternalPolicyLoading] = React.useState(false);
  const [collectionExternalPolicyTargetKey, setCollectionExternalPolicyTargetKey] = React.useState(null);
  const [collectionPaymentExecuting, setCollectionPaymentExecuting] = React.useState(false);
  const collectionExternalPolicySearchTimer = React.useRef(null);
  const [collectionFilterForm] = Form.useForm();
  const [collectionLobOptions, setCollectionLobOptions] = React.useState([]);
  const [payerOptions, setPayerOptions] = React.useState([]);
  const [payerLoading, setPayerLoading] = React.useState(false);
  const payerSearchTimer = React.useRef(null);
  const [policyOptions, setPolicyOptions] = React.useState([]);
  const [policyLoading, setPolicyLoading] = React.useState(false);
  const policySearchTimer = React.useRef(null);
  const [currencyOptions, setCurrencyOptions] = React.useState([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = React.useState([]);
  const [incomeTypeOptions, setIncomeTypeOptions] = React.useState([]);
  const [externalSourceOptions, setExternalSourceOptions] = React.useState([]);
  const [newIncomePayments, setNewIncomePayments] = React.useState([
    { key: 1, methodCode: undefined, amount: '' }
  ]);
  const [newIncomeDynamicForms, setNewIncomeDynamicForms] = React.useState({});
  const [newIncomeTypeDynamicForm, setNewIncomeTypeDynamicForm] = React.useState(null);
  const [newIncomeActiveFormKey, setNewIncomeActiveFormKey] = React.useState(null);
  const newIncomeFormRefs = React.useRef({});
  const newIncomeTypeFormRef = React.useRef(null);
  const shellRef = React.useRef(null);
  const mainViewportRef = React.useRef(null);

  React.useEffect(() => {
    const styleId = 'cashier-supervisor-style';
    const previousStyle = document.getElementById(styleId);
    if (previousStyle) previousStyle.remove();

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

      .cashier-supervisor-premium-toolbar {
        display: flex;
        align-items: center;
        gap: 0;
      }

      .cashier-supervisor-premium-toolbar .ant-btn {
        min-width: 96px;
        border-radius: 0;
        box-shadow: none;
      }

      .cashier-supervisor-premium-toolbar .ant-btn:first-child {
        border-radius: 0;
        color: #1677ff;
        background: transparent;
        border-color: #1677ff;
      }

      .cashier-supervisor-premium-toolbar .ant-btn:first-child:hover,
      .cashier-supervisor-premium-toolbar .ant-btn:first-child:focus {
        color: #4096ff;
        background: #e6f4ff;
        border-color: #4096ff;
      }

      .cashier-supervisor-premium-toolbar .ant-btn:last-child {
        border-radius: 0;
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
        font-size: 13px;
        line-height: 20px;
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
        font-size: 13px;
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

      .cashier-supervisor-tab:disabled {
        color: #bfbfbf;
        cursor: not-allowed;
        background: #fafafa;
        border-color: transparent;
      }

      .cashier-supervisor-tab-content {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
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

      .cashier-supervisor-view .ant-tabs-tabpane.ant-tabs-tabpane-hidden {
        display: none;
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

      .cashier-supervisor-payment-methods {
        font-size: 11px;
        line-height: 1.2;
        white-space: normal;
        word-break: break-word;
        cursor: pointer;
        color: #1677ff;
      }

      .cashier-supervisor-user-email {
        color: #1677ff;
        cursor: pointer;
        white-space: normal;
      }

      .cashier-supervisor-movement-actions {
        justify-content: center;
      }

      .cashier-supervisor-movement-actions .ant-btn {
        font-size: 21px;
        padding: 1px 4px;
      }

      .cashier-supervisor-movement-actions .ant-btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        line-height: 1;
        overflow: visible;
      }

      .cashier-supervisor-movement-actions .anticon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        font-size: 18px;
        line-height: 1;
        overflow: visible;
      }

      .cashier-supervisor-movement-actions .anticon svg {
        display: block;
        width: 1em;
        height: 1em;
        overflow: visible;
      }

      .cashier-supervisor-movement-table .ant-table-tbody > tr > td {
        white-space: pre-line;
      }

      .cashier-supervisor-shell .ant-checkbox-inner {
        border-color: #5b6573;
      }

      .cashier-supervisor-shell .ant-checkbox:hover .ant-checkbox-inner {
        border-color: #1f2937;
      }

      .cashier-supervisor-new-income-card {
        width: 100%;
        max-width: none;
        align-self: flex-start;
      }

      .cashier-supervisor-view .cashier-supervisor-new-income-card {
        height: auto;
        min-height: 100%;
      }

      .cashier-supervisor-view .cashier-supervisor-new-income-card .ant-card-body {
        overflow: visible;
      }

      .cashier-supervisor-new-income-actions {
        display: flex;
        align-items: center;
        gap: 14px;
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 8px;
        margin-bottom: 12px;
      }

      .cashier-supervisor-new-income-actions .ant-btn {
        padding-left: 8px;
        padding-right: 8px;
      }

      .cashier-supervisor-new-income-actions .ant-btn-primary {
        padding-left: 15px;
        padding-right: 15px;
      }

      .cashier-supervisor-new-income-form {
        flex: 0 0 calc(40% - 12px);
        max-width: calc(40% - 12px);
        min-width: 0;
      }

      .cashier-supervisor-new-income-columns {
        display: flex;
        align-items: flex-start;
        gap: 24px;
        width: 100%;
      }

      .cashier-supervisor-new-income-dynamic-panel {
        flex: 0 0 calc(60% - 12px);
        max-width: calc(60% - 12px);
        min-width: 0;
      }

      .cashier-supervisor-dynamic-form-card {
        border: 0;
        border-radius: 0;
        padding: 0;
        background: transparent;
        margin-bottom: 12px;
      }

      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        margin: 0 -6px;
        width: 100%;
      }

      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form > .rendered-form,
      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .rendered-form > .row {
        width: 100%;
      }

      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form > .rendered-form > .row {
        display: flex;
        flex-wrap: wrap;
      }

      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-form-field {
        box-sizing: border-box;
        flex: 0 0 100%;
        max-width: 100%;
        padding: 0 6px;
        margin-bottom: 12px;
      }

      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-col-4 {
        flex-basis: 33.333333%;
        max-width: 33.333333%;
      }

      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-col-6 {
        flex-basis: 50%;
        max-width: 50%;
      }

      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-col-8 {
        flex-basis: 66.666667%;
        max-width: 66.666667%;
      }

      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-col-12 {
        flex-basis: 100%;
        max-width: 100%;
      }

      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-form-field input,
      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-form-field select,
      .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-form-field textarea {
        width: 100%;
        box-sizing: border-box;
      }

      .cashier-supervisor-dynamic-form-error {
        color: #cf1322;
        margin-bottom: 8px;
      }

      @media (max-width: 900px) {
        .cashier-supervisor-center {
          overflow: auto;
        }

        .cashier-supervisor-view {
          height: auto;
          min-height: 100%;
          overflow: visible;
        }

        .cashier-supervisor-tab-content {
          flex: 0 0 auto;
          overflow: visible;
        }

        .cashier-supervisor-new-income-card {
          height: auto;
          overflow: visible;
        }

        .cashier-supervisor-new-income-columns {
          flex-direction: column;
        }

        .cashier-supervisor-new-income-dynamic-panel,
        .cashier-supervisor-new-income-form {
          flex: 1 1 100%;
          max-width: 100%;
          min-width: 0;
        }

        .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-col-4,
        .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-col-6,
        .cashier-supervisor-dynamic-form-card > form.cashier-dynamic-rendered-form .cashier-dynamic-col-8 {
          flex-basis: 100% !important;
          max-width: 100% !important;
        }

      }

      .cashier-supervisor-section-title {
        background: #f5f6fa;
        border-radius: 8px;
        color: #262626;
        font-weight: 600;
        padding: 7px 12px;
        margin: 8px 0;
      }

      .cashier-supervisor-payment-method-row {
        display: flex;
        gap: 2px;
        width: 100%;
      }

      .cashier-supervisor-payment-method-row > .ant-select,
      .cashier-supervisor-payment-method-row > .ant-input-affix-wrapper {
        flex: 0 0 calc(50% - 1px);
        width: calc(50% - 1px) !important;
        min-width: 0;
      }

      .cashier-supervisor-payment-actions {
        display: flex;
        gap: 3px;
        margin: 2px 0 10px;
      }

      .cashier-supervisor-payment-actions .ant-btn {
        padding: 0 6px;
        font-size: 18px;
        line-height: 20px;
      }

      .cashier-supervisor-new-income-card .ant-form-item {
        margin-bottom: 10px;
      }

      .cashier-supervisor-new-income-difference {
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin: 2px 0 10px;
      }

      .cashier-supervisor-collection-allocation-card {
        width: 100%;
        max-height: calc(100vh - 150px);
        overflow-y: auto;
      }

      .cashier-supervisor-collection-allocation-actions {
        display: flex;
        justify-content: flex-start;
        gap: 8px;
        margin-bottom: 10px;
      }

      .cashier-supervisor-collection-allocation-card .ant-table-cell {
        vertical-align: middle;
      }

      .cashier-supervisor-collection-installments {
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-installments-popup {
        max-height: 220px;
        min-width: 190px;
        overflow-y: auto;
        font-size: 12px;
        line-height: 20px;
      }

      .cashier-supervisor-collection-policy-table .ant-btn {
        font-size: 18px;
        padding: 0 4px;
      }

      .cashier-supervisor-collection-policy-table,
      .cashier-supervisor-collection-supplementary-table {
        height: 240px;
        overflow: auto;
      }

      .cashier-supervisor-collection-policy-table .ant-table-thead > tr > th,
      .cashier-supervisor-collection-policy-table .ant-table-tbody > tr > td,
      .cashier-supervisor-collection-supplementary-table .ant-table-thead > tr > th,
      .cashier-supervisor-collection-supplementary-table .ant-table-tbody > tr > td {
        padding: 2px 6px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-collection-policy-table .ant-input-number,
      .cashier-supervisor-collection-supplementary-table .ant-input-number,
      .cashier-supervisor-collection-policy-table .ant-input-number-input,
      .cashier-supervisor-collection-supplementary-table .ant-input-number-input {
        min-height: 24px;
        height: 24px;
        text-align: right;
        padding-right: 12px !important;
      }

      .cashier-supervisor-collection-supplementary-table {
        height: 120px;
      }

      .cashier-supervisor-collection-allocation-summary {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px 20px;
        margin-top: 12px;
        padding: 10px 12px;
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        background: #fafafa;
      }

      .cashier-supervisor-collection-allocation-error {
        color: #cf1322;
      }

      .cashier-supervisor-readonly-field {
        margin-bottom: 10px;
      }

      .cashier-supervisor-readonly-field label {
        display: block;
        margin-bottom: 4px;
        color: #1f1f1f;
      }

      .cashier-supervisor-movement-view-content .ant-input[disabled] {
        color: #595959;
        background: #fff;
        border-color: #d9d9d9;
        cursor: default;
        opacity: 1;
        -webkit-text-fill-color: #595959;
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
    loadNewIncomeCatalogs();

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

  function loadNewIncomeCatalogs() {
    Promise.all([
      exe('RepoCurrency', { operation: 'GET', filter: 'enabled = 1' }),
      exe('RepoPaymentMethodCatalog', { operation: 'GET' }),
      exe('RepoIncomeTypeCatalog', { operation: 'GET' }),
      exe('RepoExternalSourceCatalog', { operation: 'GET' })
    ])
      .then(responses => {
        const currencyResponse = responses[0];
        const paymentResponse = responses[1];
        const incomeResponse = responses[2];
        const sourceResponse = responses[3];

        if (!currencyResponse || currencyResponse.ok === false) {
          throw new Error(currencyResponse && currencyResponse.msg ? currencyResponse.msg : t('Currencies could not be loaded.'));
        }
        if (!paymentResponse || paymentResponse.ok === false) {
          throw new Error(paymentResponse && paymentResponse.msg ? paymentResponse.msg : t('Payment methods could not be loaded.'));
        }
        if (!incomeResponse || incomeResponse.ok === false) {
          throw new Error(incomeResponse && incomeResponse.msg ? incomeResponse.msg : t('Income types could not be loaded.'));
        }
        if (!sourceResponse || sourceResponse.ok === false) {
          throw new Error(sourceResponse && sourceResponse.msg ? sourceResponse.msg : t('External sources could not be loaded.'));
        }

        setCurrencyOptions(getRows(currencyResponse).map(item => ({
          value: item && item.code,
          label: `${item && item.symbol ? item.symbol : ''} ${getTrimmedString(item && item.name)}`.trim()
        })).filter(item => item.value));
        setPaymentMethodOptions(getRows(paymentResponse).map(item => ({
          value: item && item.code,
          label: getTrimmedString(item && item.name),
          formId: Number(item && item.formId) > 0 ? Number(item.formId) : 0
        })).filter(item => item.value));
        setIncomeTypeOptions(getRows(incomeResponse).map(item => ({
          value: item && item.code,
          label: getTrimmedString(item && item.name),
          formId: Number(item && item.formId) > 0 ? Number(item.formId) : 0,
          internalType: getTrimmedString(item && item.internalType)
        })).filter(item => item.value));
        const sourceOptions = getRows(sourceResponse).map(item => ({
          value: item && item.code,
          label: getTrimmedString(item && item.name),
          destinationAccNo: getTrimmedString(item && item.destinationAccNo)
        })).filter(item => item.value);
        setExternalSourceOptions(sourceOptions);
        if (sourceOptions.length === 1) {
          newIncomeForm.setFieldsValue({ destination: sourceOptions[0].value });
        }
      })
      .catch(error => message.error(error && error.message ? error.message : String(error)));
  }

  function parseIncomeAmount(value) {
    const normalized = getTrimmedString(value).replace(/[$,\s]/g, '');
    const amount = Number(normalized);
    return Number.isFinite(amount) && amount >= 0 ? amount : 0;
  }

  function getNewIncomeTotal() {
    return newIncomePayments.reduce((total, payment) => total + parseIncomeAmount(payment.amount), 0);
  }

  function getNewIncomeDifference() {
    if (!collectionChargeVisible) return getNewIncomeTotal();
    return getNewIncomeTotal() - collectionExpectedAmount;
  }

  function getPaymentFormId(methodCode) {
    const option = paymentMethodOptions.find(item => item && item.value === methodCode);
    return option && Number(option.formId) > 0 ? Number(option.formId) : 0;
  }

  function getIncomeTypeFormId(incomeTypeCode) {
    const option = incomeTypeOptions.find(item => item && item.value === incomeTypeCode);
    return option && Number(option.formId) > 0 ? Number(option.formId) : 0;
  }

  function activateNewIncomePaymentForm(paymentKey, control) {
    setNewIncomeActiveFormKey(String(paymentKey));
    if (control && typeof control.focus === 'function') {
      setTimeout(() => control.focus(), 0);
    }
  }

  function loadNewIncomeDynamicForm(paymentKey, formId) {
    if (!formId) return;

    setNewIncomeDynamicForms(forms => ({
      ...forms,
      [paymentKey]: { formId: formId, form: null, loading: true, error: '' }
    }));

    exe('GetForms', { filter: `id=${formId}` })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The payment form could not be loaded.'));
        }

        const form = getRows(response)[0];
        if (!form) {
          throw new Error(t('The payment form was not found.'));
        }

        setNewIncomeDynamicForms(forms => ({
          ...forms,
          [paymentKey]: { formId: formId, form: form, loading: false, error: '' }
        }));
      })
      .catch(error => {
        setNewIncomeDynamicForms(forms => ({
          ...forms,
          [paymentKey]: { formId: formId, form: null, loading: false, error: error && error.message ? error.message : String(error) }
        }));
        message.error(error && error.message ? error.message : String(error));
      });
  }

  function updateNewIncomePaymentMethod(key, value) {
    const formId = getPaymentFormId(value);

    setNewIncomePayments(rows => rows.map(row => row.key === key
      ? { ...row, methodCode: value }
      : row));

    if (formId > 0) {
      loadNewIncomeDynamicForm(key, formId);
      return;
    }

    setNewIncomeDynamicForms(forms => {
      const nextForms = { ...forms };
      delete nextForms[key];
      return nextForms;
    });
  }

  function updateNewIncomeType(value) {
    const formId = getIncomeTypeFormId(value);

    if (formId > 0) {
      setNewIncomeTypeDynamicForm({ formId: formId, form: null, loading: true, error: '' });

      exe('GetForms', { filter: `id=${formId}` })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('The income type form could not be loaded.'));
          }

          const form = getRows(response)[0];
          if (!form) {
            throw new Error(t('The income type form was not found.'));
          }

          setNewIncomeTypeDynamicForm({ formId: formId, form: form, loading: false, error: '' });
        })
        .catch(error => {
          setNewIncomeTypeDynamicForm({
            formId: formId,
            form: null,
            loading: false,
            error: error && error.message ? error.message : String(error)
          });
          message.error(error && error.message ? error.message : String(error));
        });
      return;
    }

    setNewIncomeTypeDynamicForm(null);
  }

  function updateNewIncomePayment(key, field, value) {
    setNewIncomePayments(rows => rows.map(row => row.key === key
      ? { ...row, [field]: value }
      : row));
  }

  function addNewIncomePayment() {
    setNewIncomePayments(rows => rows.concat({
      key: Date.now(),
      methodCode: undefined,
      amount: ''
    }));
  }

  function removeNewIncomePayment(key) {
    setNewIncomePayments(rows => rows.length > 1 ? rows.filter(row => row.key !== key) : rows);
    if (newIncomeActiveFormKey === String(key)) {
      setNewIncomeActiveFormKey(null);
    }
    setNewIncomeDynamicForms(forms => {
      const nextForms = { ...forms };
      delete nextForms[key];
      return nextForms;
    });
  }

  function clearNewIncomeForm() {
    newIncomeForm.resetFields();
    setNewIncomePayments([{ key: Date.now(), methodCode: undefined, amount: '' }]);
    setCollectionExpectedAmount(0);
    setNewIncomeDynamicForms({});
    setNewIncomeTypeDynamicForm(null);
    setNewIncomeActiveFormKey(null);
    if (externalSourceOptions.length === 1) {
      newIncomeForm.setFieldsValue({ destination: externalSourceOptions[0].value });
    }
  }

  function evalNewIncomeFormLogic(source, contextValue) {
    if (!source) return;
    return function () {
      return eval(source);
    }.call(contextValue);
  }

  function validateDynamicIncomeForms() {
    if (newIncomeTypeDynamicForm) {
      if (newIncomeTypeDynamicForm.loading) {
        message.warning(t('Please wait until the income type form finishes loading.'));
        return false;
      }

      const typeContainer = document.getElementById('cashier-income-type-form')
        || newIncomeTypeFormRef.current;
      if (newIncomeTypeDynamicForm.error) {
        message.error(newIncomeTypeDynamicForm.error);
        return false;
      }

      if (typeContainer) {
        const requiredControls = typeContainer.querySelectorAll('[required]');
        for (const control of requiredControls) {
          const value = control && control.value !== undefined ? String(control.value).trim() : '';
          if (!value || (typeof control.checkValidity === 'function' && !control.checkValidity())) {
            if (typeof control.focus === 'function') control.focus();
            message.error(t('Complete the required fields in the income type form.'));
            return false;
          }
        }
      }
    }

    for (const payment of newIncomePayments) {
      const config = newIncomeDynamicForms[payment.key];
      if (!config) continue;

      if (config.loading) {
        activateNewIncomePaymentForm(payment.key);
        message.warning(t('Please wait until the payment form finishes loading.'));
        return false;
      }

      if (config.error) {
        activateNewIncomePaymentForm(payment.key);
        message.error(config.error);
        return false;
      }

      const container = document.getElementById(`cashier-payment-form-${payment.key}`)
        || newIncomeFormRefs.current[payment.key];
      const definition = getDynamicFormDefinition(config.form);
      const requiredFields = Array.isArray(definition)
        ? definition.filter(field => field && field.required && field.name)
        : [];

      if (!container && requiredFields.length > 0) {
        activateNewIncomePaymentForm(payment.key);
        message.error(t('Complete the required fields in the payment form.'));
        return false;
      }

      if (requiredFields.length > 0) {
        const values = getDynamicFormValues(container);
        const missingField = requiredFields.some(field => {
          const value = values[field.name];
          if (field.type === 'checkbox') return value !== true;
          if (Array.isArray(value)) return value.length === 0;
          return String(value === undefined || value === null ? '' : value).trim() === '';
        });

        if (missingField) {
          activateNewIncomePaymentForm(payment.key);
          message.error(t('Complete the required fields in the payment form.'));
          return false;
        }
      }

      if (!container) continue;

      const requiredControls = container.querySelectorAll('[required]');
      for (const control of requiredControls) {
        const value = control && control.value !== undefined ? String(control.value).trim() : '';
        if (!value || (typeof control.checkValidity === 'function' && !control.checkValidity())) {
          activateNewIncomePaymentForm(payment.key, control);
          message.error(t('Complete the required fields in the payment form.'));
          return false;
        }
      }
    }

    return true;
  }

  function getDynamicIncomeFormValues(paymentKey) {
    const container = document.getElementById(`cashier-payment-form-${paymentKey}`)
      || newIncomeFormRefs.current[paymentKey];
    return getDynamicFormValues(container);
  }

  function getDynamicFormValues(container) {
    const values = {};
    if (!container) return values;

    container.querySelectorAll('[name]').forEach(control => {
      const name = control.getAttribute('name');
      if (!name) return;

      if (control.type === 'checkbox') {
        values[name] = Boolean(control.checked);
      } else if (control.type === 'radio') {
        if (control.checked) values[name] = control.value;
      } else {
        values[name] = control.value;
      }
    });

    return values;
  }

  function getStoredDynamicFormValues(form) {
    const definition = getDynamicFormDefinition(form);
    const values = {};
    if (!definition) return values;

    definition.forEach(field => {
      if (!field || !field.name || !Array.isArray(field.userData)) return;
      values[field.name] = field.userData.length === 1
        ? field.userData[0]
        : field.userData;
    });

    return values;
  }

  function getDynamicFormDefinition(form) {
    if (!form) return null;

    let definition = form.json;
    if (typeof definition === 'string') {
      try {
        definition = JSON.parse(definition);
      } catch (error) {
        return null;
      }
    }

    return Array.isArray(definition) ? definition : null;
  }

  function applyDynamicFormLayout(container) {
    if (!container) return;

    container.classList.add('cashier-dynamic-rendered-form');
    container.querySelectorAll('.rendered-form > .row').forEach(row => {
      row.style.display = 'flex';
      row.style.flexWrap = 'wrap';
      row.style.width = '100%';
    });
    const controls = container.querySelectorAll('[class*="col-md-"]');

    controls.forEach(control => {
      const field = control.closest('.form-group') || control.parentElement;
      if (!field || field === container) return;

      field.classList.add('cashier-dynamic-form-field');
      field.style.boxSizing = 'border-box';
      field.style.paddingLeft = '6px';
      field.style.paddingRight = '6px';
      field.style.marginBottom = '12px';
      const className = String(control.className || '');
      const match = className.match(/\bcol-md-(4|6|8|12)\b/);
      const columnUnits = match ? Number(match[1]) : 12;
      const columnSize = (columnUnits / 12) * 100;
      field.classList.add(`cashier-dynamic-col-${columnUnits}`);
      field.style.flex = `0 0 ${columnSize}%`;
      field.style.maxWidth = `${columnSize}%`;
      control.style.width = '100%';
      control.style.maxWidth = '100%';
      control.style.boxSizing = 'border-box';
    });
  }

  function getDynamicIncomeFormJson(paymentKey) {
    const config = newIncomeDynamicForms[paymentKey];
    const container = document.getElementById(`cashier-payment-form-${paymentKey}`)
      || newIncomeFormRefs.current[paymentKey];
    return getDynamicFormJson(config, container);
  }

  function getIncomeTypeFormJson() {
    const container = document.getElementById('cashier-income-type-form')
      || newIncomeTypeFormRef.current;
    return getDynamicFormJson(newIncomeTypeDynamicForm, container);
  }

  function getDynamicFormJson(config, container) {
    if (!config || !config.form) return null;

    const definition = getDynamicFormDefinition(config.form);
    if (!definition) return null;

    const values = container
      ? getDynamicFormValues(container)
      : getStoredDynamicFormValues(config.form);
    const updatedDefinition = definition.map(field => {
      const name = field && field.name;
      if (!name || !Object.prototype.hasOwnProperty.call(values, name)) return field;

      const value = values[name];
      const userData = Array.isArray(value) ? value : [value];
      const updatedField = {
        ...field,
        userData: userData.map(item => String(item === undefined || item === null ? '' : item))
      };

      if (Array.isArray(field.values)) {
        const selectedValues = Array.isArray(value) ? value.map(item => String(item)) : [String(value)];
        updatedField.values = field.values.map(option => ({
          ...option,
          selected: selectedValues.indexOf(String(option && option.value)) >= 0
        }));
      }

      return updatedField;
    });

    return JSON.stringify(updatedDefinition);
  }

  function getNewIncomeTransferEntity(formValues, destinationAccountId) {
    const currency = getTrimmedString(formValues.currency);
    const sourceExternal = getTrimmedString(formValues.destination);
    const incomeType = getTrimmedString(formValues.incomeType);

    return {
      currency: currency,
      amount: getNewIncomeTotal(),
      SplitPayments: newIncomePayments.map(payment => {
        const paymentOption = paymentMethodOptions.find(item => item && item.value === payment.methodCode);
        const formId = getPaymentFormId(payment.methodCode);
        const dynamicFormJson = formId > 0 ? getDynamicIncomeFormJson(payment.key) : null;

        return {
          paymentMethod: payment.methodCode,
          formId: formId,
          paymentMethodName: paymentOption && paymentOption.label ? paymentOption.label : payment.methodCode,
          amount: parseIncomeAmount(payment.amount),
          id: 0,
          transferId: 0,
          concept: null,
          conversion: false,
          currency: currency,
          exchangeRate: 0,
          amountEx: 0,
          jValues: dynamicFormJson,
          depositId: null,
          disputeStart: null,
          disputeEnd: null,
          disputeStatus: 0
        };
      }),
      incomeType: incomeType,
      sourceExternal: sourceExternal,
      destinationAccountId: destinationAccountId,
      jIncomeTypeForm: getIncomeTypeFormJson(),
      isExternal: true,
      concept: 'IW',
      transferWorkspaceId: Number(selectedCashierRow && selectedCashierRow.id),
      user: currentUserEmail
    };
  }

  function resolveNewIncomeDestinationAccount(formValues) {
    const sourceOption = externalSourceOptions.find(item => item && item.value === formValues.destination);
    const accountNo = getTrimmedString(sourceOption && sourceOption.destinationAccNo);
    if (!accountNo) {
      return Promise.reject(new Error(t('The destination account is not configured.')));
    }

    return exe('RepoAccount', {
      operation: 'GET',
      filter: `accNo = '${escapeSqlString(accountNo)}'`,
      size: 1,
      page: 0
    }).then(response => {
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The destination account could not be loaded.'));
      }

      const account = getRows(response)[0];
      const accountId = Number(account && account.id);
      if (!Number.isFinite(accountId) || accountId <= 0) {
        throw new Error(t('The destination account could not be identified.'));
      }

      return accountId;
    });
  }

  async function handleNewIncomeExecute() {
    if (!validateDynamicIncomeForms()) return;

    try {
      const formValues = await newIncomeForm.validateFields();
      if (!getTrimmedString(formValues.incomeType)) {
        message.error(t('Select an income type.'));
        return;
      }

      const selectedIncomeType = incomeTypeOptions.find(item => item && item.value === formValues.incomeType);
      const isPremiumIncomeType = getTrimmedString(selectedIncomeType && selectedIncomeType.internalType)
        .toUpperCase() === 'PREMIUM';
      if (isPremiumIncomeType && !collectionChargeVisible) {
        message.error(t('Premium collections must be created from the Collect action.'));
        return;
      }

      if (!getTrimmedString(currentUserEmail)) {
        message.error(t('The current user could not be identified.'));
        return;
      }

      if (getNewIncomeTotal() <= 0) {
        message.error(t('Enter at least one payment amount greater than zero.'));
        return;
      }

      if (newIncomePayments.some(payment => !payment.methodCode || parseIncomeAmount(payment.amount) <= 0)) {
        message.error(t('Complete the payment method and amount for every payment.'));
        return;
      }

      const destinationAccountId = await resolveNewIncomeDestinationAccount(formValues);
      const entity = getNewIncomeTransferEntity(formValues, destinationAccountId);
      const response = await exe('RepoTransfer', {
        operation: 'ADD',
        entity: entity,
        otherReceivables: [],
        execute: false
      });

      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The income could not be created.'));
      }

      const createdTransfer = getRows(response)[0] || {};
      const transferId = Number(createdTransfer.id || createdTransfer.transferId || 0);
      if (!Number.isFinite(transferId) || transferId <= 0) {
        throw new Error(t('The payment was created, but its movement identifier could not be identified.'));
      }

      const paymentAmount = getNewIncomeTotal();
      const paymentConcept = getTrimmedString(createdTransfer.concept || entity.concept || 'IW');
      clearNewIncomeForm();
      setCollectionChargeVisible(false);
      showNewIncomeExecutionConfirm({
        id: transferId,
        amount: paymentAmount,
        concept: paymentConcept
      });
    } catch (error) {
      message.error(error && error.message ? error.message : t('The income could not be created.'));
    }
  }

  function showNewIncomeExecutionConfirm(payment) {
    const transferId = Number(payment && payment.id);
    if (!Number.isFinite(transferId) || transferId <= 0) {
      message.error(t('The movement identifier is invalid.'));
      return;
    }

    const openMovements = () => {
      setActiveTab('movements');
      loadMovements({
        pagination: {
          current: 1,
          pageSize: movementPagination.pageSize
        }
      });
    };

    Modal.confirm({
      title: t('Payment created'),
      content: (
        <div>
          <div>{t('The payment was created successfully.')}</div>
          <div><strong>{t('ID')}:</strong> {transferId}</div>
          <div><strong>{t('Amount')}:</strong> {formatMoney(payment.amount)}</div>
          <div><strong>{t('Concept')}:</strong> {payment.concept || '-'}</div>
          <div style={{ marginTop: 8 }}>{t('Do you want to execute this payment now?')}</div>
        </div>
      ),
      okText: t('Yes'),
      cancelText: t('No'),
      onOk: () => {
        openMovements();
        executeMovement({ id: transferId });
      },
      onCancel: openMovements
    });
  }

  React.useEffect(() => {
    Object.keys(newIncomeDynamicForms).forEach(paymentKey => {
      const config = newIncomeDynamicForms[paymentKey];
      const container = document.getElementById(`cashier-payment-form-${paymentKey}`)
        || newIncomeFormRefs.current[paymentKey];

      if (!config || config.loading || !config.form || !container) return;
      if (typeof $ === 'undefined' || !$.fn || typeof $.fn.formRender !== 'function') return;

      const formData = getDynamicFormDefinition(config.form);
      if (!formData) return;

      const formSignature = JSON.stringify(formData);
      if (container.dataset.formSignature === formSignature) return;

      container.innerHTML = '';
      $(container).formRender({ formData: formData });
      applyDynamicFormLayout(container);
      container.dataset.formSignature = formSignature;

      try {
        evalNewIncomeFormLogic(config.form.logic, { exe: exe });
      } catch (error) {
        message.error(error && error.message ? error.message : String(error));
      }
    });
  }, [newIncomeDynamicForms]);

  React.useEffect(() => {
    const config = newIncomeTypeDynamicForm;
    const container = document.getElementById('cashier-income-type-form')
      || newIncomeTypeFormRef.current;

    if (!config || config.loading || !config.form || !container) return;
    if (typeof $ === 'undefined' || !$.fn || typeof $.fn.formRender !== 'function') return;

    const formData = getDynamicFormDefinition(config.form);
    if (!formData) return;

    container.innerHTML = '';
    $(container).formRender({ formData: formData });
    applyDynamicFormLayout(container);

    try {
      evalNewIncomeFormLogic(config.form.logic, { exe: exe });
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    }
  }, [newIncomeTypeDynamicForm]);

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

  function searchCollectionExternalPolicies(value) {
    const text = getTrimmedString(value);

    if (collectionExternalPolicySearchTimer.current) {
      clearTimeout(collectionExternalPolicySearchTimer.current);
      collectionExternalPolicySearchTimer.current = null;
    }

    if (!text) {
      setCollectionExternalPolicyOptions([]);
      setCollectionExternalPolicyLoading(false);
      return;
    }

    collectionExternalPolicySearchTimer.current = setTimeout(() => {
      const escaped = escapeSqlString(text);
      const isNumeric = /^\d+$/.test(text);
      const listedPolicyIds = collectionPolicyRows
        .map(row => Number(row && row.policyId))
        .filter(policyId => Number.isFinite(policyId) && policyId > 0);
      const excludedPolicyFilter = listedPolicyIds.length > 0
        ? ` AND [id] NOT IN (${listedPolicyIds.join(',')})`
        : '';
      const filter = isNumeric
        ? `[activeDate] IS NOT NULL AND [id] = ${Number(text)}${excludedPolicyFilter}`
        : `[activeDate] IS NOT NULL AND [code] LIKE N'%${escaped}%'${excludedPolicyFilter}`;

      setCollectionExternalPolicyLoading(true);
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

          setCollectionExternalPolicyOptions(getRows(response).map(policy => ({
              policyId: Number(policy && policy.id),
              policyCode: getTrimmedString(policy && policy.code),
              start: policy && policy.start,
              end: policy && policy.end
            }))
            .filter(item => item.policyId > 0)
            .filter((item, index, options) => options.findIndex(option => option.policyId === item.policyId) === index));
        })
        .catch(error => {
          setCollectionExternalPolicyOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setCollectionExternalPolicyLoading(false));
    }, 400);
  }

  function openCollectionExternalPolicySearch(key) {
    setCollectionExternalPolicyTargetKey(key || null);
    setCollectionExternalPolicyOptions([]);
    setCollectionExternalPolicyVisible(true);
  }

  function selectCollectionExternalPolicy(policy) {
    const policyId = Number(policy && policy.policyId);
    if (!Number.isFinite(policyId) || policyId <= 0) return;

    const targetKey = collectionExternalPolicyTargetKey;
    const currentRow = collectionSupplementaryRows.find(row => String(row.key) === String(targetKey));
    if (currentRow) {
      setCollectionSupplementaryRows(rows => rows.map(row => String(row.key) === String(targetKey)
        ? { ...row, policyId: policyId, policy: policy.policyCode }
        : row));
    } else {
      setCollectionSupplementaryRows(rows => rows.concat({
        key: `supplementary-${Date.now()}-${rows.length}`,
        policyId: policyId,
        policy: policy.policyCode,
        amount: 0
      }));
    }

    setCollectionExternalPolicyVisible(false);
    setCollectionExternalPolicyTargetKey(null);
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

  function loadCashierReports() {
    exe('RepoConfigProfile', {
      operation: 'GET',
      filter: null,
      size: 0,
      page: 0
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Reports could not be loaded.'));
        }

        const profile = getRows(response)[0] || {};
        let config = profile.configJson || profile.config || {};
        if (typeof config === 'string') {
          try {
            config = JSON.parse(config);
          } catch (error) {
            config = {};
          }
        }

        const reports = config && config.Cashier && Array.isArray(config.Cashier.reports)
          ? config.Cashier.reports
          : [];

        setCashierReports(reports.filter(report => report && report.name && report.report));
      })
      .catch(error => {
        setCashierReports([]);
        message.error(error && error.message ? error.message : String(error));
      });
  }

  function openCashierReport(report) {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    const reportName = getTrimmedString(report && report.report);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0 || !reportName) return;

    const transferIds = movementSelectedRowKeys
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value > 0);
    const transferId = transferIds.length > 0 ? `[${transferIds.join(',')}]` : '0';

    window.open(
      `#/reportview/${reportName}/workspaceId=${workspaceId}&transferId=${transferId}`,
      '_blank',
      'noopener,noreferrer'
    );
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
        setCollectionRows(rows.map(row => {
          const source = row || {};
          const policyId = Number(source.lifePolicyId || source.policyId || source.LifePolicyId || source.id || 0);
          return {
            ...source,
            lifePolicyId: Number.isFinite(policyId) && policyId > 0 ? policyId : 0,
            policyId: Number.isFinite(policyId) && policyId > 0 ? policyId : 0
          };
        }));
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
    const source = values || {};
    const filters = {
      ...source,
      issuanceFrom: formatCollectionFilterDate(source.issuanceFrom),
      issuanceTo: formatCollectionFilterDate(source.issuanceTo)
    };
    setCollectionFilters(filters);
    setCollectionFilterVisible(false);
    loadCollection({
      pagination: { current: 1, pageSize: collectionPagination.pageSize },
      filters: filters
    });
  }

  function formatCollectionFilterDate(value) {
    if (!value) return null;
    if (typeof value.format === 'function') return value.format('YYYY-MM-DD');
    return getTrimmedString(value) || null;
  }

  function clearCollectionFilters() {
    collectionFilterForm.resetFields();
    setPayerOptions([]);
    setPolicyOptions([]);
    setCollectionFilters({});
    setCollectionRows([]);
    setCollectionTotal(0);
    setCollectionSelectedRowKeys([]);
    setCollectionPagination({ current: 1, pageSize: collectionPagination.pageSize });
    setCollectionFilterVisible(false);
  }

  function getCollectionRowKey(record) {
    const policyId = Number(record && record.lifePolicyId);
    return Number.isFinite(policyId) && policyId > 0
      ? String(policyId)
      : String(record && record.poliza ? record.poliza : '');
  }

  function getSelectedCollectionRows() {
    const selectedKeys = collectionSelectedRowKeys.map(key => String(key));
    return collectionRows.filter(row => selectedKeys.indexOf(getCollectionRowKey(row)) >= 0);
  }

  function openCollectionCharge() {
    const selectedRows = getSelectedCollectionRows();
    if (selectedRows.length === 0) {
      message.warning(t('Select at least one policy to collect.'));
      return;
    }

    const selectedHolderIds = selectedRows.map(row => Number(row && row.holderId));
    const holderIds = Array.from(new Set(selectedHolderIds));

    if (selectedHolderIds.some(holderId => !Number.isFinite(holderId) || holderId <= 0)) {
      message.error(t('The selected policies do not have a valid payer.'));
      return;
    }

    if (holderIds.length !== 1) {
      message.error(t('Select policies with the same payer.'));
      return;
    }

    const amount = selectedRows.reduce((total, row) => {
      const overdue = Number(row && row.vencido || 0);
      return total + (Number.isFinite(overdue) ? overdue : 0);
    }, 0);
    const expectedAmount = Math.max(amount, 0);

    clearNewIncomeForm();
    setCollectionChargeStep('payment');
    setCollectionPolicyRows([]);
    setCollectionSupplementaryRows([]);
    setCollectionExpectedAmount(expectedAmount);
    setNewIncomePayments([{ key: Date.now(), methodCode: undefined, amount: expectedAmount.toFixed(2) }]);

    const premiumIncomeType = incomeTypeOptions.find(item =>
      getTrimmedString(item && item.internalType).toUpperCase() === 'PREMIUM'
    );
    if (!premiumIncomeType) {
      message.error(t('The premium collection income type is not configured.'));
      return;
    }

    newIncomeForm.setFieldsValue({ incomeType: premiumIncomeType.value });
    updateNewIncomeType(premiumIncomeType.value);
    setCollectionChargeVisible(true);
  }

  function getCollectionPaymentAmount() {
    return Number(getNewIncomeTotal().toFixed(2));
  }

  function getCollectionPolicyPending(row) {
    const pending = Number(row && row.pendiente);
    return Number.isFinite(pending) && pending > 0 ? Number(pending.toFixed(2)) : 0;
  }

  function getCollectionPolicyIdentifier(row) {
    const policyId = getCollectionPolicyNumericId(row);
    if (Number.isFinite(policyId) && policyId > 0) return policyId;
    return getTrimmedString(row && (row.policy || row.poliza));
  }

  function getCollectionPolicyNumericId(row) {
    const values = [row && row.lifePolicyId, row && row.policyId, row && row.id];

    for (let index = 0; index < values.length; index += 1) {
      const policyId = Number(values[index]);
      if (Number.isFinite(policyId) && policyId > 0) return policyId;
    }

    const policyCode = getTrimmedString(row && (row.policy || row.poliza));
    if (policyCode) {
      const sourceRow = collectionRows.find(item =>
        getTrimmedString(item && (item.poliza || item.policy)) === policyCode
      );
      const sourcePolicyId = Number(sourceRow && (sourceRow.lifePolicyId || sourceRow.policyId || sourceRow.id));
      if (Number.isFinite(sourcePolicyId) && sourcePolicyId > 0) return sourcePolicyId;
    }

    return 0;
  }

  function buildCollectionAllocationPreview() {
    const selectedRows = getSelectedCollectionRows();
    let remainingAmount = getCollectionPaymentAmount();

    const policyRows = selectedRows.map(row => {
      const pendingAmount = getCollectionPolicyPending(row);
      const amount = Math.min(pendingAmount, Math.max(remainingAmount, 0));
      remainingAmount = Number((remainingAmount - amount).toFixed(2));

      return {
        key: getCollectionRowKey(row),
        policyId: getCollectionPolicyIdentifier(row),
        policy: getTrimmedString(row && row.poliza),
        pendingAmount: pendingAmount,
        amount: Number(amount.toFixed(2)),
        installments: Array.isArray(row && row.Cuotas) ? row.Cuotas : []
      };
    });

    const excessAmount = Number(Math.max(remainingAmount, 0).toFixed(2));
    const firstPolicy = policyRows[0];
    const supplementaryRows = excessAmount > 0 && firstPolicy
      ? [{
          key: `supplementary-${Date.now()}`,
          policyId: firstPolicy.policyId,
          policy: firstPolicy.policy,
          amount: excessAmount
        }]
      : [];

    setCollectionPolicyRows(policyRows);
    setCollectionSupplementaryRows(supplementaryRows);
    setCollectionChargeStep('allocation');
  }

  async function handleCollectionNext() {
    if (!validateDynamicIncomeForms()) return;

    try {
      const formValues = await newIncomeForm.validateFields();
      if (!getTrimmedString(formValues && formValues.incomeType)) {
        message.error(t('Select an income type.'));
        return;
      }

      if (getNewIncomeTotal() <= 0) {
        message.error(t('Enter at least one payment amount greater than zero.'));
        return;
      }

      if (newIncomePayments.some(payment => !payment.methodCode || parseIncomeAmount(payment.amount) <= 0)) {
        message.error(t('Complete the payment method and amount for every payment.'));
        return;
      }

      buildCollectionAllocationPreview();
    } catch (error) {
      message.error(error && error.message ? error.message : t('Complete the payment information.'));
    }
  }

  function canExecuteCollectionPayment() {
    const paymentTotal = getCollectionPaymentAmount();
    const supplementaryExpected = getCollectionSupplementaryExpected();
    const supplementaryTotal = getCollectionSupplementaryTotal();
    const difference = Number((supplementaryExpected - supplementaryTotal).toFixed(2));
    const hasInvalidPolicyAmount = collectionPolicyRows.some(row =>
      Number(row && row.amount) > Number(row && row.pendingAmount) + 0.01
    );

    return paymentTotal > 0
      && !hasInvalidPolicyAmount
      && Math.abs(difference) <= 0.01;
  }

  async function handleCollectionPaymentExecute() {
    if (collectionChargeStep !== 'allocation') return;

    const paymentTotal = getCollectionPaymentAmount();
    const policyTotal = getCollectionPolicyTotal();
    const supplementaryExpected = getCollectionSupplementaryExpected();
    const supplementaryTotal = getCollectionSupplementaryTotal();
    const difference = Number((supplementaryExpected - supplementaryTotal).toFixed(2));

    if (Math.abs(difference) > 0.01) {
      message.error(t('The complementary premium distribution must match the excess exactly.'));
      return;
    }

    if (collectionPolicyRows.some(row => Number(row.amount) > Number(row.pendingAmount) + 0.01)) {
      message.error(t('A policy amount cannot exceed its pending balance.'));
      return;
    }

    const payments = collectionPolicyRows
      .filter(row => Number(row && row.amount) > 0)
      .map(row => ({
        policyId: getCollectionPolicyNumericId(row),
        amount: Number(Number(row && row.amount).toFixed(2))
      }));
    const supplementaryPayments = collectionSupplementaryRows
      .filter(row => Number(row && row.amount) > 0)
      .map(row => ({
        policyId: getCollectionPolicyNumericId(row),
        amount: Number(Number(row && row.amount).toFixed(2))
      }));

    if (payments.some(row => !Number.isFinite(row.policyId) || row.policyId <= 0)
      || supplementaryPayments.some(row => !Number.isFinite(row.policyId) || row.policyId <= 0)) {
      message.error(t('Every payment detail must have a valid policy.'));
      return;
    }

    if (Math.abs(Number((policyTotal + supplementaryTotal - paymentTotal).toFixed(2))) > 0.01) {
      message.error(t('The payment distribution does not match the payment total.'));
      return;
    }

    try {
      const formValues = await newIncomeForm.validateFields();
      const destinationAccountId = await resolveNewIncomeDestinationAccount(formValues);
      const transferEntity = getNewIncomeTransferEntity(formValues, destinationAccountId);

      setCollectionPaymentExecuting(true);
      const response = await exe('ExeChain', {
        chain: 'cmdPremiumsPayment',
        context: JSON.stringify({
          workspaceId: Number(selectedCashierRow && selectedCashierRow.id),
          currency: getTrimmedString(formValues && formValues.currency),
          amount: paymentTotal,
          payments: payments,
          supplementaryPayments: supplementaryPayments,
          transferEntity: transferEntity
        })
      });

      const result = response && response.outData && !Array.isArray(response.outData)
        ? response.outData
        : response;
      if (!result || result.ok === false) {
        throw new Error(result && result.msg ? result.msg : t('The premium payment could not be executed.'));
      }

      message.success(t('Premium payment executed successfully.'));
      setCollectionChargeVisible(false);
      setCollectionChargeStep('payment');
      setCollectionPolicyRows([]);
      setCollectionSupplementaryRows([]);
      setCollectionSelectedRowKeys([]);
      clearNewIncomeForm();
      loadCollection({
        pagination: {
          current: 1,
          pageSize: collectionPagination.pageSize
        },
        filters: collectionFilters
      });
    } catch (error) {
      message.error(error && error.message ? error.message : t('The premium payment could not be executed.'));
    } finally {
      setCollectionPaymentExecuting(false);
    }
  }

  function updateCollectionPolicyAmount(key, value) {
    setCollectionPolicyRows(rows => rows.map(row => {
      if (String(row.key) !== String(key)) return row;
      const amount = Number(value);
      const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
      return {
        ...row,
        amount: Number(Math.min(safeAmount, row.pendingAmount).toFixed(2))
      };
    }));
  }

  function getCollectionPolicyTotal() {
    return Number(collectionPolicyRows
      .reduce((total, row) => total + (Number(row && row.amount) || 0), 0)
      .toFixed(2));
  }

  function getCollectionSupplementaryExpected() {
    return Number(Math.max(getCollectionPaymentAmount() - getCollectionPolicyTotal(), 0).toFixed(2));
  }

  function getCollectionSupplementaryTotal() {
    return Number(collectionSupplementaryRows
      .reduce((total, row) => total + (Number(row && row.amount) || 0), 0)
      .toFixed(2));
  }

  function updateCollectionSupplementaryAmount(key, value) {
    const expected = getCollectionSupplementaryExpected();
    setCollectionSupplementaryRows(rows => rows.map(row => {
      if (String(row.key) !== String(key)) return row;
      const amount = Number(value);
      const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
      return {
        ...row,
        amount: Number(Math.min(safeAmount, expected).toFixed(2))
      };
    }));
  }

  function updateCollectionSupplementaryPolicy(key, policyId) {
    const selectedPolicy = collectionPolicyRows.find(row => String(row && row.policyId) === String(policyId));
    const externalPolicy = collectionExternalPolicyOptions.find(row => String(row && row.policyId) === String(policyId));
    if (!selectedPolicy && !externalPolicy) return;

    const nextPolicyId = selectedPolicy
      ? selectedPolicy.policyId
      : Number(externalPolicy.policyId);
    const nextPolicy = selectedPolicy
      ? getTrimmedString(selectedPolicy.poliza)
      : getTrimmedString(externalPolicy.policyCode);

    setCollectionSupplementaryRows(rows => rows.map(row => String(row.key) === String(key)
      ? { ...row, policyId: nextPolicyId, policy: nextPolicy }
      : row));
  }

  function addCollectionSupplementaryRow() {
    const availablePolicy = collectionPolicyRows.find(policy => !collectionSupplementaryRows.some(row =>
      String(row && row.policyId) === String(policy && policy.policyId)
    ));

    setCollectionSupplementaryRows(rows => rows.concat({
      key: `supplementary-${Date.now()}-${rows.length}`,
      policyId: availablePolicy ? availablePolicy.policyId : 0,
      policy: availablePolicy ? getTrimmedString(availablePolicy.policy) : '',
      amount: 0
    }));
  }

  function removeCollectionSupplementaryRow(key) {
    setCollectionSupplementaryRows(rows => rows.filter(row => String(row.key) !== String(key)));
  }

  function handleTabChange(key) {
    if (key !== 'cash-desks' && !selectedCashierRow) return;

    setActiveTab(key);
    if (key === 'movements' && selectedCashierRow && selectedCashierRow.id) {
      loadMovements({
        pagination: {
          current: 1,
          pageSize: movementPagination.pageSize
        }
      });
    }
  }

  function selectCashDesk(record) {
    setSelectedCashierRow(record || null);
    if (!record) {
      setActiveTab('cash-desks');
    }
  }

  React.useEffect(() => {
    if (!selectedCashierRow && activeTab !== 'cash-desks') {
      setActiveTab('cash-desks');
    }
  }, [selectedCashierRow, activeTab]);

  React.useEffect(() => {
    loadCashierReports();
  }, []);

  function getMovementChildren(group) {
    if (Array.isArray(group && group.AllocationMovements)) {
      return group.AllocationMovements.filter(item => item);
    }

    return group ? [group] : [];
  }

  function hasMovementDetails(group) {
    return Boolean(group && Array.isArray(group.AllocationMovements) && group.AllocationMovements.length > 0);
  }

  function getMovementFirst(group) {
    return getMovementChildren(group)[0] || {};
  }

  function openMovementView(group) {
    setMovementViewRecord(group || null);
    setMovementViewVisible(Boolean(group));
  }

  function getMovementPaymentRows(group) {
    const rows = [];
    const items = [group].concat(getMovementChildren(group));

    items.forEach(item => {
      const splitPayments = item && Array.isArray(item.SplitPayments) ? item.SplitPayments : [];
      splitPayments.forEach(payment => {
        rows.push({
          method: getTrimmedString(payment && (payment.paymentMethodName
            || (payment.PaymentMethod && payment.PaymentMethod.name)
            || payment.paymentMethod)),
          amount: Number(payment && payment.amount) || 0,
          currency: getTrimmedString(payment && payment.currency),
          form: payment && (payment.jValues || payment.jValue || payment.formValues)
        });
      });
    });

    return rows.filter((row, index, values) => values.findIndex(item =>
      item.method === row.method
      && item.amount === row.amount
      && item.currency === row.currency
      && String(item.form || '') === String(row.form || '')
    ) === index);
  }

  function getMovementFormFields(form) {
    if (!form) return [];

    let parsed = form;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (error) {
        return [];
      }
    }

    const fields = Array.isArray(parsed)
      ? parsed
      : (parsed && Array.isArray(parsed.fields) ? parsed.fields : []);

    return fields
      .filter(field => field
        && field.name
        && !String(field.name).toLowerCase().startsWith('hidden'))
      .map(field => ({
        label: getTrimmedString(field.label || field.name),
        value: Array.isArray(field.userData) ? field.userData.join(', ') : getTrimmedString(field.userData)
      }));
  }

  function getMovementViewValue(group, field) {
    const first = getMovementFirst(group);
    return group && group[field] !== undefined && group[field] !== null
      ? group[field]
      : first && first[field];
  }

  function renderMovementViewContent(group) {
    if (!group) return null;

    const paymentRows = getMovementPaymentRows(group);
    const incomeType = getMovementIncomeTypeValues(group).join(', ');
    const destination = getMovementDestinationValues(group).map(item => item.accNo || item.id).join(', ');
    const currency = getTrimmedString(getMovementViewValue(group, 'currency'));
    const amount = Number(getMovementViewValue(group, 'amount')) || 0;
    const concept = getTrimmedString(getMovementViewValue(group, 'concept'));
    const sourceExternal = getTrimmedString(getMovementViewValue(group, 'sourceExternal'));
    const incomeTypeForm = getMovementViewValue(group, 'jIncomeTypeForm');
    const dynamicFormItems = paymentRows
      .map((payment, index) => ({
        payment: payment,
        fields: getMovementFormFields(payment.form),
        index: index
      }))
      .filter(item => item.fields.length > 0)
      .map(item => ({
        key: `payment-form-${item.index}`,
        label: item.payment.method || `${t('Payment method')} ${item.index + 1}`,
        children: (
          <div className="cashier-supervisor-dynamic-form-card">
            {item.fields.map(field => (
              <div key={field.label} className="cashier-supervisor-readonly-field">
                <label>{field.label}</label>
                <Input disabled value={field.value || '-'} />
              </div>
            ))}
          </div>
        )
      }));
    const incomeTypeFields = getMovementFormFields(incomeTypeForm);

    if (incomeTypeFields.length > 0) {
      dynamicFormItems.push({
        key: 'income-type-form',
        label: t('Income type'),
        children: (
          <div className="cashier-supervisor-dynamic-form-card">
            {incomeTypeFields.map(field => (
              <div key={field.label} className="cashier-supervisor-readonly-field">
                <label>{field.label}</label>
                <Input disabled value={field.value || '-'} />
              </div>
            ))}
          </div>
        )
      });
    }

    return (
      <div className="cashier-supervisor-new-income-columns cashier-supervisor-movement-view-content">
        <div className="cashier-supervisor-new-income-form">
          <div className="cashier-supervisor-section-title">{t('Payment method(s)')}</div>
          {paymentRows.length > 0
            ? paymentRows.map((payment, index) => (
              <div key={`${payment.method}-${index}`} className="cashier-supervisor-payment-entry">
                <div className="cashier-supervisor-payment-method-row">
                  <Input disabled value={payment.method || '-'} />
                  <Input disabled value={formatMoney(payment.amount)} prefix={payment.currency || currency || '$'} />
                </div>
              </div>
            ))
            : <Input disabled value="-" />}

          <div className="cashier-supervisor-section-title">{t('Internal account information')}</div>
          <div className="cashier-supervisor-readonly-field">
            <label>{t('Income type')}</label>
            <Input disabled value={incomeType || '-'} />
          </div>
          <div className="cashier-supervisor-readonly-field">
            <label>{t('Destination')}</label>
            <Input disabled value={destination || '-'} />
          </div>
          <div className="cashier-supervisor-readonly-field">
            <label>{t('Currency')}</label>
            <Input disabled value={currency || '-'} />
          </div>
          <div className="cashier-supervisor-readonly-field">
            <label>{t('Amount to pay')}</label>
            <Input disabled value={formatMoney(amount)} />
          </div>
        </div>

        <div className="cashier-supervisor-new-income-dynamic-panel">
          <div className="cashier-supervisor-section-title">{t('Payment details')}</div>
          <div className="cashier-supervisor-readonly-field">
            <label>{t('Source')}</label>
            <Input disabled value={sourceExternal || '-'} />
          </div>
          <div className="cashier-supervisor-readonly-field">
            <label>{t('Concept')}</label>
            <Input disabled value={concept || '-'} />
          </div>
          <div className="cashier-supervisor-readonly-field">
            <label>{t('User')}</label>
            <Input disabled value={getTrimmedString(getMovementViewValue(group, 'user')) || '-'} />
          </div>
          {dynamicFormItems.length > 0 && (
            <>
              <div className="cashier-supervisor-section-title">{t('Aditional Data')}</div>
              <Tabs items={dynamicFormItems} />
            </>
          )}
        </div>
      </div>
    );
  }

  function getMovementValues(group, field) {
    return getMovementChildren(group)
      .map(item => item && item[field])
      .filter(value => value !== undefined && value !== null && String(value) !== '')
      .map(value => String(value));
  }

  function getPolicyValues(group) {
    const directValues = getMovementValues(group, 'lifePolicyId');
    const installmentValues = [];

    const collectInstallmentPolicies = item => {
      const installments = item && item.Allocation && Array.isArray(item.Allocation.InstallmentPremiums)
        ? item.Allocation.InstallmentPremiums
        : [];

      installments.forEach(installment => {
        if (installment && installment.lifePolicyId !== undefined && installment.lifePolicyId !== null) {
          installmentValues.push(String(installment.lifePolicyId));
        }
      });
    };

    collectInstallmentPolicies(group);
    getMovementChildren(group).forEach(collectInstallmentPolicies);

    return Array.from(new Set(directValues.concat(installmentValues)));
  }

  function getMovementDetailRows(group) {
    const installments = group && group.Allocation && Array.isArray(group.Allocation.InstallmentPremiums)
      ? group.Allocation.InstallmentPremiums
      : [];

    return getMovementChildren(group).map(item => {
      const concept = String(item && item.concept || '');
      const referenceMatch = concept.match(/REF\s+(\d+)/i);
      const payPlanId = referenceMatch ? Number(referenceMatch[1]) : 0;
      const installment = installments.find(row => Number(row && row.payPlanId) === payPlanId);

      return {
        ...item,
        lifePolicyId: item && item.lifePolicyId
          ? item.lifePolicyId
          : installment && installment.lifePolicyId
      };
    });
  }

  function renderMovementStatus(group) {
    const movements = getMovementChildren(group);
    const isReverted = [group].concat(movements).some(item => Boolean(item && (
      item.reverted ||
      item.reversalDate ||
      (item.Allocation && (item.Allocation.reverted || item.Allocation.reversalDate))
    )));

    if (isReverted) {
      return <Tag color="red">{t('Reverted')}</Tag>;
    }

    return getMovementFirst(group).status
      ? <Tag color="green">{t('Executed')}</Tag>
      : <Tag>{t('Pending')}</Tag>;
  }

  function isMovementReverted(group) {
    return [group].concat(getMovementChildren(group)).some(item => Boolean(item && (
      item.reverted ||
      item.reversalDate ||
      (item.Allocation && (item.Allocation.reverted || item.Allocation.reversalDate))
    )));
  }

  function renderMovementActions(group) {
    const first = getMovementFirst(group);
    const transferId = Number(group && group.id || first.id || 0);
    const reverted = isMovementReverted(group);
    const executed = Boolean(first.executed || first.status);

    return (
      <Space size={4} className="cashier-supervisor-movement-actions">
        <Popconfirm
          title={t('Are you sure?')}
          placement="top"
          okText={t('Yes')}
          cancelText={t('No')}
          onConfirm={() => executeMovement(group)}
        >
          <Tooltip title={t('Execute movement')}>
            <Button
              type="link"
              size="small"
              aria-label={t('Execute movement')}
              loading={movementActionId === transferId}
              disabled={executed || reverted}
              icon={<ExecuteMovementIcon />}
            />
          </Tooltip>
        </Popconfirm>
        <Tooltip title={t('Revert movement')}>
          <Button
            type="link"
            size="small"
            aria-label={t('Revert movement')}
            disabled={!executed || reverted}
            icon={<RevertMovementIcon />}
          />
        </Tooltip>
        <Popconfirm
          title={t('Are you sure you want to delete this movement?')}
          placement="top"
          okText={t('Yes')}
          cancelText={t('No')}
          onConfirm={() => deleteMovement(group)}
        >
          <Tooltip title={t('Delete movement')}>
            <Button
              type="link"
              size="small"
              aria-label={t('Delete movement')}
              loading={movementActionId === transferId}
              disabled={executed || reverted}
              icon={<DeleteMovementIcon />}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    );
  }

  function renderMovementValues(group, field, color) {
    const values = getMovementValues(group, field);
    if (values.length === 0) return '-';

    return values.map((item, index) => (
      <div key={`${item}-${index}`} style={color ? { color: color } : undefined}>
        {item}
      </div>
    ));
  }

  function getMovementDestinationValues(group) {
    const values = [group].concat(getMovementChildren(group))
      .map(item => {
        const account = item && item.DestinationAccount;
        return account
          ? {
              id: Number(account.id || account.accountId || (item && item.destinationAccountId) || 0),
              accNo: getTrimmedString(account.accNo)
            }
          : null;
      })
      .filter(value => value && (value.accNo || value.id > 0));

    return values.filter((value, index, items) => items.findIndex(item =>
      (value.id > 0 && item.id === value.id) || (value.id <= 0 && item.accNo === value.accNo)
    ) === index);
  }

  function getMovementIncomeTypeValues(group) {
    const values = [group].concat(getMovementChildren(group))
      .map(item => item && item.IncomeType && item.IncomeType.name)
      .filter(value => value !== undefined && value !== null && String(value) !== '')
      .map(value => String(value));

    return Array.from(new Set(values));
  }

  function renderMovementIncomeType(group) {
    const values = getMovementIncomeTypeValues(group);
    if (values.length === 0) return '-';

    return values.map((item, index) => <div key={`${item}-${index}`}>{item}</div>);
  }

  function renderMovementDestination(group) {
    const values = getMovementDestinationValues(group);
    if (values.length === 0) return '-';

    return values.map((item, index) => (
      <div key={`${item.id || item.accNo}-${index}`}>
        {item.id > 0
          ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto' }}
              onClick={() => window.open(`#/account/${item.id}`, '_blank', 'noopener,noreferrer')}
            >
              {item.accNo || item.id}
            </Button>
          )
          : item.accNo}
      </div>
    ));
  }

  function getMovementPaymentMethodValues(group) {
    const values = [];
    const items = [group].concat(getMovementChildren(group));

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

  function renderMovementPaymentMethods(group) {
    const values = getMovementPaymentMethodValues(group);
    if (values.length === 0) return '-';

    const abbreviations = values.map(getPaymentMethodAbbreviation);

    return (
      <Tooltip trigger={['click']} title={values.join(', ')}>
        <span className="cashier-supervisor-payment-methods">
          {abbreviations.join(', ')}
        </span>
      </Tooltip>
    );
  }

  function getPaymentMethodAbbreviation(value) {
    const normalized = getTrimmedString(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (normalized === 'CHEQUE') return 'CHE';
    if (normalized === 'TARJETA DE CREDITO') return 'TC';
    if (normalized === 'EFECTIVO') return 'EFE';

    return normalized.replace(/[^A-Z0-9]/g, '').slice(0, 3) || '-';
  }

  function renderMovementUser(group) {
    const values = [group].concat(getMovementChildren(group))
      .map(item => getTrimmedString(item && item.user))
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

  function renderMovementOrigin(group) {
    const values = [group].concat(getMovementChildren(group))
      .map(item => item && item.sourceExternal)
      .filter(value => value !== undefined && value !== null && String(value) !== '')
      .map(value => String(value));
    const uniqueValues = Array.from(new Set(values));

    if (uniqueValues.length === 0) return '-';
    return uniqueValues.map((item, index) => <div key={`${item}-${index}`}>{item}</div>);
  }

  function loadMovements(params = {}) {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      setMovementRows([]);
      setMovementTotal(0);
      return;
    }

    const pagination = params.pagination || movementPagination;
    const pageSize = Number(pagination && pagination.pageSize) || 15;
    const currentPage = Number(pagination && pagination.current) || 1;

    setMovementLoading(true);
    exe('FilterTransfer', {
      workspaceId: workspaceId,
      groupByAllocation: true,
      size: pageSize,
      page: Math.max(currentPage - 1, 0),
      currency: null,
      allocated: null,
      external: null,
      executed: null,
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
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Movements could not be loaded.'));
        }

        const groups = getRows(response);
        const rows = groups.map((group, index) => {
          const children = getMovementChildren(group);
          const first = children[0] || {};
          const policyValues = getPolicyValues(group);
          const policies = policyValues.join('\n');

          return {
            ...first,
            ...group,
            id: group.id || first.id || `allocation-${index}`,
            amount: Number(group.amount !== undefined && group.amount !== null ? group.amount : first.amount || 0),
            lifePolicyId: policies
          };
        });
        setMovementRows(rows);
        setMovementSelectedRowKeys([]);
        setMovementTotal(getResponseTotal(response, groups));
        setMovementPagination({ current: currentPage, pageSize: pageSize });
      })
      .catch(error => {
        setMovementRows([]);
        setMovementSelectedRowKeys([]);
        setMovementTotal(0);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => {
        setMovementLoading(false);
      });
  }

  function handleMovementTableChange(pagination) {
    loadMovements({
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize
      }
    });
  }

  function executeMovement(group) {
    const transferId = Number(group && group.id);
    if (!Number.isFinite(transferId) || transferId <= 0) {
      message.error(t('The movement identifier is invalid.'));
      return;
    }

    setMovementActionId(transferId);
    exe('DoTransfer', {
      transferId: transferId,
      transfer: null
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The movement could not be executed.'));
        }

        message.success(t('Movement executed successfully.'));
        loadMovements({ pagination: movementPagination });
      })
      .catch(error => {
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => {
        setMovementActionId(0);
      });
  }

  function deleteMovement(group) {
    const first = getMovementFirst(group);
    const transferId = Number(group && group.id || first.id || 0);
    if (!Number.isFinite(transferId) || transferId <= 0) {
      message.error(t('The movement identifier is invalid.'));
      return;
    }

    const reverted = isMovementReverted(group);
    const executed = Boolean(first.executed || first.status);
    if (executed || reverted) {
      message.warning(t('Executed or reverted movements cannot be deleted.'));
      return;
    }

    setMovementActionId(transferId);
    exe('RepoTransfer', {
      operation: 'DELETE',
      entity: { id: transferId }
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The movement could not be deleted.'));
        }

        message.success(t('Movement deleted successfully.'));
        loadMovements({ pagination: movementPagination });
      })
      .catch(error => {
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => {
        setMovementActionId(0);
      });
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
          selectCashDesk(selected || null);
        } else {
          selectCashDesk(null);
        }
      })
      .catch(error => {
        setTransferRows([]);
        selectCashDesk(null);
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
            onChange={() => selectCashDesk(record)}
          />
          <Button type="link" size="small" onClick={() => selectCashDesk(record)}>
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

  const movementColumns = [
    { title: t('Actions'), key: 'actions', width: 130, align: 'center', render: (_, group) => renderMovementActions(group) },
    { title: t('ID'), key: 'id', width: 125, align: 'center', render: (value, group) => (
      <div style={{ whiteSpace: 'nowrap' }}>
        <span>{group.id || getMovementFirst(group).id || '-'}</span>
        {' '}
        <Button type="link" size="small" onClick={() => openMovementView(group)}>{t('View')}</Button>
      </div>
    ) },
    { title: t('Date'), dataIndex: 'date', key: 'date', width: 125, render: formatDateIso },
    { title: t('Status'), key: 'status', width: 105, render: (_, group) => renderMovementStatus(group) },
    { title: t('Origin'), key: 'sourceExternal', width: 135, render: (_, group) => renderMovementOrigin(group) },
    { title: t('Destination'), key: 'destinationAccount', width: 145, render: (_, group) => renderMovementDestination(group) },
    { title: t('Reference'), dataIndex: 'concept', key: 'concept', width: 135 },
    { title: t('Received'), dataIndex: 'amount', key: 'received', width: 110, align: 'right', render: formatMoney },
    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 110, align: 'right', render: formatMoney },
    { title: t('Currency'), dataIndex: 'currency', key: 'currency', width: 85, align: 'center' },
    { title: t('Payment method'), key: 'paymentMethod', width: 100, render: (_, group) => renderMovementPaymentMethods(group) },
    { title: t('Type'), key: 'incomeType', width: 190, render: (_, group) => renderMovementIncomeType(group) },
    { title: t('Policy'), key: 'lifePolicyId', width: 120, align: 'center', render: (value, record) => {
      const values = getPolicyValues(record);
      return values.length > 0
        ? values.map((item, index) => {
          const policyId = Number(item);
          return (
            <div key={`${item}-${index}`}>
              {Number.isFinite(policyId) && policyId > 0
                ? (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto' }}
                    onClick={() => window.open(`#/lifepolicy/${policyId}`, '_blank', 'noopener,noreferrer')}
                  >
                    {item}
                  </Button>
                )
                : item}
            </div>
          );
        })
        : '-';
    } },
    { title: t('Executed'), dataIndex: 'executed', key: 'executed', width: 85, align: 'center', render: value => value ? '✓' : '-' },
    { title: t('Cashier ID'), dataIndex: 'transferWorkspaceId', key: 'transferWorkspaceId', width: 95, align: 'center' },
    { title: t('User'), dataIndex: 'user', key: 'user', width: 150, render: (_, group) => renderMovementUser(group) },
    {
      title: t('Allocation'),
      dataIndex: 'allocationId',
      key: 'allocationId',
      width: 95,
      align: 'center',
      render: value => {
        const allocationId = Number(value);
        return Number.isFinite(allocationId) && allocationId > 0
          ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto' }}
              onClick={() => window.open(`#/allocation?id=${allocationId}`, '_blank', 'noopener,noreferrer')}
            >
              {allocationId}
            </Button>
          )
          : '-';
      }
    },
    { title: t('Linked'), key: 'linked', width: 80, align: 'center', render: () => '-' },
    { title: t('Workflow'), key: 'workflow', width: 125, render: () => <Tag>{t('No workflow')}</Tag> }
  ];

  const movementDetailColumns = movementColumns
    .filter(column => column.key !== 'actions' && column.key !== 'workflow')
    .map(column => {
    if (column.key !== 'id') return column;

    return {
      ...column,
      render: (_, group) => group.id || getMovementFirst(group).id || '-'
    };
    });

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
        <Button type="primary" icon={<NewIcon />} onClick={openNewCashDeskModal}>
          {t('New')}
        </Button>
        <Button icon={<LockOutlined />} disabled={!selectedCashierRow}>
          {t('Close')}
        </Button>
        <Button icon={<FileTextOutlined />} disabled={!selectedCashierRow}>
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
          onClick: () => selectCashDesk(record)
        })}
      />
    </Card>
  );

  const premiumCollectionTabContent = (
    <Card size="small">
      <div className="cashier-supervisor-toolbar cashier-supervisor-premium-toolbar">
        <Button type="primary" icon={<FilterOutlined />} onClick={() => setCollectionFilterVisible(true)}>
          {t('Filter')}
        </Button>
        <Button
          type="primary"
          onClick={openCollectionCharge}
          disabled={collectionSelectedRowKeys.length === 0}
        >
          {t('Collect')}
        </Button>
      </div>
      <Table
        rowKey={getCollectionRowKey}
        columns={premiumColumns}
        dataSource={collectionRows}
        size="small"
        bordered
        className="cashier-supervisor-table"
        loading={collectionLoading}
        rowSelection={{
          selectedRowKeys: collectionSelectedRowKeys,
          onChange: keys => setCollectionSelectedRowKeys(keys)
        }}
        onRow={record => ({
          onClick: event => {
            if (event.target.closest('button, a, input, .ant-checkbox-wrapper')) return;

            const key = getCollectionRowKey(record);
            setCollectionSelectedRowKeys(keys => {
              const normalizedKeys = keys.map(item => String(item));
              return normalizedKeys.indexOf(String(key)) >= 0
                ? normalizedKeys.filter(item => item !== String(key))
                : keys.concat(key);
            });
          }
        })}
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

  const movementsTabContent = (
    <Card size="small">
      <div className="cashier-supervisor-toolbar">
        <Dropdown
          trigger={['click']}
          placement="bottomLeft"
          menu={{
            items: cashierReports.map((report, index) => ({
              key: `${report.report}-${index}`,
              label: t(report.name),
              onClick: () => openCashierReport(report)
            }))
          }}
        >
          <Button type="link" icon={<FileTextOutlined />} disabled={!selectedCashierRow || cashierReports.length === 0}>
            {t('Reports')}
          </Button>
        </Dropdown>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadMovements({ pagination: { current: 1, pageSize: movementPagination.pageSize } })}
          loading={movementLoading}
          disabled={!selectedCashierRow}
        >
          {t('Refresh')}
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={movementColumns}
        dataSource={movementRows}
        size="small"
        bordered
        className="cashier-supervisor-movement-table cashier-supervisor-table"
        loading={movementLoading}
        rowSelection={{
          selectedRowKeys: movementSelectedRowKeys,
          onChange: keys => setMovementSelectedRowKeys(keys)
        }}
        pagination={{
          current: movementPagination.current,
          pageSize: movementPagination.pageSize,
          total: movementTotal,
          showSizeChanger: true,
          pageSizeOptions: ['15', '25', '50', '100']
        }}
        onChange={handleMovementTableChange}
        scroll={{ x: 2600, y: transferScrollY }}
        expandable={{
          rowExpandable: record => hasMovementDetails(record),
          expandedRowRender: record => (
            <Table
              rowKey="id"
              columns={movementDetailColumns}
              dataSource={getMovementDetailRows(record)}
              size="small"
              pagination={false}
              className="cashier-supervisor-installment-menu-table"
            />
          )
        }}
      />
    </Card>
  );

  const renderCollectionAllocationContent = () => {
    const paymentTotal = getCollectionPaymentAmount();
    const policyTotal = getCollectionPolicyTotal();
    const expectedSupplementary = getCollectionSupplementaryExpected();
    const supplementaryTotal = getCollectionSupplementaryTotal();
    const difference = Number((expectedSupplementary - supplementaryTotal).toFixed(2));
    const policyOptions = collectionPolicyRows.map(row => ({
      value: row && row.policyId,
      label: getTrimmedString(row && row.policy)
    })).filter(option => option.value !== '' && option.value !== null && option.value !== undefined && option.value !== 0);
    const externalPolicyOptions = collectionExternalPolicyOptions.map(policy => ({
      value: policy.policyId,
      label: policy.policyCode || String(policy.policyId)
    }));
    const supplementaryPolicyOptions = policyOptions.concat(externalPolicyOptions)
      .filter((option, index, options) => options.findIndex(item => item.value === option.value) === index);

    const policyColumns = [
      {
        title: t('Policy'),
        dataIndex: 'policy',
        key: 'policy'
      },
      {
        title: t('Policy ID'),
        key: 'policyId',
        width: 90,
        align: 'center',
        render: (_, record) => {
          const policyId = getCollectionPolicyNumericId(record);
          return policyId > 0 ? policyId : '-';
        }
      },
      {
        title: t('Pending'),
        dataIndex: 'pendingAmount',
        key: 'pendingAmount',
        align: 'right',
        render: value => formatMoney(value)
      },
      {
        title: t('Amount to apply'),
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        render: (value, record) => (
          <InputNumber
            min={0}
            max={record.pendingAmount}
            precision={2}
            value={value}
            onChange={nextValue => updateCollectionPolicyAmount(record.key, nextValue)}
            style={{ width: '100%' }}
          />
        )
      },
      {
        title: t('Installments'),
        key: 'installments',
        align: 'center',
        render: (_, record) => (
          <Popover
            title={t('Installment details')}
            trigger="click"
            content={(
              <div className="cashier-supervisor-installments-popup">
                {record.installments.length === 0
                  ? t('No pending installments.')
                  : record.installments.map(item => (
                    <div key={item.id || `${record.key}-${item.numberInYear}`}>
                      <strong>{`${t('Installment')} ${item.numberInYear || '-'}`}</strong>
                      {`: ${formatMoney(item.pendingAmount)}`}
                    </div>
                  ))}
              </div>
            )}
          >
            <Button type="link" title={t('View installments')}>
              <InstallmentsIcon />
            </Button>
          </Popover>
        )
      }
    ];

    const supplementaryColumns = [
      {
        title: t('Policy'),
        dataIndex: 'policy',
        key: 'policy',
        render: (value, record) => (
          <div style={{ display: 'flex', gap: 4, width: '100%' }}>
            <Select
              value={record.policyId}
              options={supplementaryPolicyOptions}
              onChange={nextValue => updateCollectionSupplementaryPolicy(record.key, nextValue)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <Button
              type="link"
              onClick={() => openCollectionExternalPolicySearch(record.key)}
              title={t('Search policy')}
            >
              {t('Search')}
            </Button>
          </div>
        )
      },
      {
        title: t('Policy ID'),
        key: 'policyId',
        width: 90,
        align: 'center',
        render: (_, record) => {
          const policyId = getCollectionPolicyNumericId(record);
          return policyId > 0 ? policyId : '-';
        }
      },
      {
        title: t('Amount to apply'),
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        render: (value, record) => (
          <InputNumber
            min={0}
            max={expectedSupplementary}
            precision={2}
            value={value}
            onChange={nextValue => updateCollectionSupplementaryAmount(record.key, nextValue)}
            style={{ width: '100%' }}
          />
        )
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 80,
        render: (_, record) => (
          <Button type="link" onClick={() => removeCollectionSupplementaryRow(record.key)}>
            {t('Remove')}
          </Button>
        )
      }
    ];

    return (
      <Card size="small" className="cashier-supervisor-collection-allocation-card">
        <div className="cashier-supervisor-collection-allocation-actions">
          <Button onClick={() => setCollectionChargeStep('payment')}>{t('Back')}</Button>
          <Popconfirm
            title={t('Are you sure you want to apply this payment?')}
            placement="top"
            okText={t('Yes')}
            cancelText={t('No')}
            onConfirm={handleCollectionPaymentExecute}
          >
            <Button
              type="primary"
              disabled={!canExecuteCollectionPayment()}
              loading={collectionPaymentExecuting}
            >
              {t('Execute payment')}
            </Button>
          </Popconfirm>
        </div>
        <div className="cashier-supervisor-section-title">{t('Premium to apply')}</div>
        <div className="cashier-supervisor-collection-policy-table">
          <Table
            rowKey="key"
            columns={policyColumns}
            dataSource={collectionPolicyRows}
            size="small"
            pagination={false}
            bordered
          />
        </div>
        <div className="cashier-supervisor-section-title">{t('Complementary premiums')}</div>
        {expectedSupplementary > 0 ? (
          <>
            <div className="cashier-supervisor-collection-supplementary-table">
              <Table
                rowKey="key"
                columns={supplementaryColumns}
                dataSource={collectionSupplementaryRows}
                size="small"
                pagination={false}
                bordered
              />
            </div>
            <Button type="link" onClick={addCollectionSupplementaryRow}>
              + {t('Add row')}
            </Button>
          </>
        ) : (
          <div>{t('There is no complementary premium to distribute.')}</div>
        )}
        <div className="cashier-supervisor-collection-allocation-summary">
          <div><strong>{t('Payment total')}:</strong> {formatMoney(paymentTotal)}</div>
          <div><strong>{t('Premiums')}:</strong> {formatMoney(policyTotal)}</div>
          <div><strong>{t('Complementary expected')}:</strong> {formatMoney(expectedSupplementary)}</div>
          <div><strong>{t('Complementary assigned')}:</strong> {formatMoney(supplementaryTotal)}</div>
          <div className={difference === 0 ? '' : 'cashier-supervisor-collection-allocation-error'}>
            <strong>{t('Difference')}:</strong> {formatMoney(difference)}
          </div>
        </div>
      </Card>
    );
  };

  const renderNewIncomeContent = (collectionMode) => (
    <Card size="small" className="cashier-supervisor-new-income-card">
      <div className="cashier-supervisor-new-income-actions">
        <Button
          type="primary"
          icon={<ExecuteMovementIcon />}
          onClick={collectionMode ? handleCollectionNext : handleNewIncomeExecute}
        >
          {t(collectionMode ? 'Next' : 'Execute')}
        </Button>
        {!collectionMode && (
          <Button type="link" icon={<ClearOutlined />} onClick={clearNewIncomeForm}>
            {t('Clear')}
          </Button>
        )}
      </div>

      <div className="cashier-supervisor-new-income-columns">
        <div className="cashier-supervisor-new-income-form">
        <div className="cashier-supervisor-section-title">{t('Payment method(s)')}</div>
        {newIncomePayments.map(payment => (
          <div key={payment.key} className="cashier-supervisor-payment-entry">
            <div className="cashier-supervisor-payment-method-row">
              <Select
                value={payment.methodCode}
                placeholder={t('Payment method')}
                options={paymentMethodOptions}
                onChange={value => updateNewIncomePaymentMethod(payment.key, value)}
              />
              <Input
                value={payment.amount}
                prefix="$"
                inputMode="decimal"
                onChange={event => updateNewIncomePayment(payment.key, 'amount', event.target.value)}
              />
            </div>
            <div className="cashier-supervisor-payment-actions">
              <Button type="link">$</Button>
              <Button type="link" disabled={newIncomePayments.length === 1} onClick={() => removeNewIncomePayment(payment.key)}>-</Button>
              <Button type="link" onClick={addNewIncomePayment}>+</Button>
            </div>
          </div>
        ))}

        <div className="cashier-supervisor-section-title">{t('Internal account information')}</div>
          <Form form={newIncomeForm} layout="vertical" initialValues={{ currency: 'USD' }}>
            <Form.Item label={t('Income type')} name="incomeType">
            <Select
              style={{ width: '100%' }}
              options={collectionChargeVisible
                ? incomeTypeOptions
                : incomeTypeOptions.filter(item =>
                  getTrimmedString(item && item.internalType).toUpperCase() !== 'PREMIUM'
                )}
              disabled={collectionChargeVisible}
              onChange={updateNewIncomeType}
            />
          </Form.Item>
          <Form.Item
            label={t('Destination')}
            required
            name="destination"
          >
            <Select placeholder={t('External source')} style={{ width: '100%' }} options={externalSourceOptions} />
          </Form.Item>
          <Form.Item
            label={t('Currency')}
            required
            name="currency"
          >
            <Select
              style={{ width: '100%' }}
              options={currencyOptions}
            />
          </Form.Item>
          <Form.Item
            label={t('Amount to pay')}
            required
          >
            <Input disabled value={`$${formatMoney(getNewIncomeTotal())}`} />
          </Form.Item>
          <div className="cashier-supervisor-new-income-difference">
            <div>{t('Difference')}</div>
            <strong>${formatMoney(getNewIncomeDifference())}</strong>
          </div>
        </Form>
        </div>
        <div className="cashier-supervisor-new-income-dynamic-panel">
          <div className="cashier-supervisor-section-title">
            {t('Payment method form')}
          </div>
          <Tabs
            items={newIncomePayments
              .filter(payment => Boolean(newIncomeDynamicForms[payment.key]))
              .map((payment, index) => {
                const dynamicForm = newIncomeDynamicForms[payment.key];
                const paymentMethod = paymentMethodOptions.find(option => option.value === payment.methodCode);
                const tabLabel = paymentMethod && paymentMethod.label
                  ? paymentMethod.label
                  : `${t('Payment method')} ${index + 1}`;

                return {
                  key: String(payment.key),
                  label: tabLabel,
                  forceRender: true,
                  children: (
                    <div className="cashier-supervisor-dynamic-form-card">
                      {dynamicForm.loading && <div>{t('Loading form...')}</div>}
                      {dynamicForm.error && <div className="cashier-supervisor-dynamic-form-error">{dynamicForm.error}</div>}
                      <form
                        id={`cashier-payment-form-${payment.key}`}
                        ref={element => {
                          if (element) newIncomeFormRefs.current[payment.key] = element;
                          else delete newIncomeFormRefs.current[payment.key];
                        }}
                      />
                    </div>
                  )
                };
              })}
            activeKey={newIncomeActiveFormKey !== null ? String(newIncomeActiveFormKey) : undefined}
            onChange={key => setNewIncomeActiveFormKey(String(key))}
            destroyInactiveTabPane={false}
          />
          {newIncomeTypeDynamicForm && (
            <>
              <div className="cashier-supervisor-section-title">
                {t('Income type form')}
              </div>
              <div className="cashier-supervisor-dynamic-form-card">
                {newIncomeTypeDynamicForm.loading && <div>{t('Loading form...')}</div>}
                {newIncomeTypeDynamicForm.error && (
                  <div className="cashier-supervisor-dynamic-form-error">
                    {newIncomeTypeDynamicForm.error}
                  </div>
                )}
                <form id="cashier-income-type-form" ref={newIncomeTypeFormRef} />
              </div>
            </>
          )}
        </div>
      </div>
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
              disabled={!selectedCashierRow}
              className={`cashier-supervisor-tab${activeTab === 'premiums' ? ' active' : ''}`}
              onClick={() => handleTabChange('premiums')}
            >
              <PremiumIcon /> {t('Premium collections')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'new-income'}
              disabled={!selectedCashierRow}
              className={`cashier-supervisor-tab${activeTab === 'new-income' ? ' active' : ''}`}
              onClick={() => handleTabChange('new-income')}
            >
              {t('New income')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'movements'}
              disabled={!selectedCashierRow}
              className={`cashier-supervisor-tab${activeTab === 'movements' ? ' active' : ''}`}
              onClick={() => handleTabChange('movements')}
            >
              <MovementIcon /> {t('Movements')}
            </button>
          </div>
          <div className="cashier-supervisor-tab-content" role="tabpanel">
            {activeTab === 'premiums'
              ? premiumCollectionTabContent
              : activeTab === 'new-income'
                ? renderNewIncomeContent()
                : activeTab === 'movements'
                  ? movementsTabContent
                  : cashDeskTabContent}
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

        <Modal
          title={t('Payment details')}
          open={movementViewVisible}
          onCancel={() => {
            setMovementViewVisible(false);
            setMovementViewRecord(null);
          }}
          footer={null}
          width={1000}
          destroyOnClose
        >
          {renderMovementViewContent(movementViewRecord)}
        </Modal>

        <Modal
          title={t('Collect premiums')}
          open={collectionChargeVisible}
          onCancel={() => {
            setCollectionChargeVisible(false);
            setCollectionChargeStep('payment');
            setCollectionPolicyRows([]);
            setCollectionSupplementaryRows([]);
            clearNewIncomeForm();
          }}
          footer={null}
          width={1100}
          destroyOnClose={false}
        >
          <Tabs
            activeKey={collectionChargeStep}
            onChange={key => setCollectionChargeStep(key)}
            items={[
              {
                key: 'payment',
                label: t('Payment information'),
                children: renderNewIncomeContent(true)
              },
              {
                key: 'allocation',
                label: t('Payment allocation'),
                disabled: collectionChargeStep !== 'allocation',
                children: renderCollectionAllocationContent()
              }
            ]}
          />
        </Modal>

        <Modal
          title={t('Search policy')}
          open={collectionExternalPolicyVisible}
          onCancel={() => {
            setCollectionExternalPolicyVisible(false);
            setCollectionExternalPolicyTargetKey(null);
          }}
          footer={null}
          width={720}
          destroyOnClose={false}
        >
          <Input.Search
            allowClear
            autoFocus
            placeholder={t('Search by policy number or code')}
            onChange={event => searchCollectionExternalPolicies(event && event.target ? event.target.value : '')}
            onSearch={searchCollectionExternalPolicies}
            loading={collectionExternalPolicyLoading}
          />
          <Table
            rowKey="policyId"
            size="small"
            bordered
            loading={collectionExternalPolicyLoading}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            dataSource={collectionExternalPolicyOptions}
            columns={[
              {
                title: t('Policy'),
                dataIndex: 'policyCode',
                key: 'policyCode'
              },
              {
                title: t('Validity'),
                key: 'validity',
                render: (_, record) => `${formatDate(record.start)} - ${formatDate(record.end)}`
              },
              {
                title: t('ID'),
                dataIndex: 'policyId',
                key: 'policyId'
              },
              {
                title: t('Actions'),
                key: 'actions',
                width: 100,
                render: (_, record) => (
                  <Button type="link" onClick={() => selectCollectionExternalPolicy(record)}>
                    {t('Select')}
                  </Button>
                )
              }
            ]}
          />
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
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label={t('Issuance date to')} name="issuanceTo">
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Drawer>

      </div>
  );
}
