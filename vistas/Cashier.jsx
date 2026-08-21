() => {
  const {
    Button,
    Checkbox,
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
    Slider,
    Space,
    Spin,
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

  const TabIcon = ({ label, iconClass, children }) => (
    <span role="img" aria-label={label} className={`anticon ${iconClass || ''}`} style={tabIconStyle}>
      {children}
    </span>
  );

  const CashierIcon = () => (
    <TabIcon label="bank" iconClass="anticon-bank">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M128 384L512 96l384 288v80H128v-80zm80 128h608v320h80v80H128v-80h80V512zm80 0v320h96V512h-96zm176 0v320h96V512h-96zm176 0v320h96V512h-96z"></path>
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
    <TabIcon label="dollar-circle" iconClass="anticon-dollar-circle">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384S723.7 128 512 128zm0 80c167.7 0 304 136.3 304 304S679.7 816 512 816 208 679.7 208 512 344.3 208 512 208z"></path>
        <path d="M560 328h-96v48h-48v80h48v32h-48v80h48v48h96v-48h48v-80h-48v-32h48v-80h-48v-48zm-96 128h96v32h-96v-32zm0 112h96v32h-96v-32z"></path>
      </svg>
    </TabIcon>
  );

  const NewIncomeIcon = () => (
    <TabIcon label="plus-circle" iconClass="anticon-plus-circle">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 816c-203.9 0-368-164.1-368-368s164.1-368 368-368 368 164.1 368 368-164.1 368-368 368z"></path>
        <path d="M480 288h64v192h192v64H544v192h-64V544H288v-64h192z"></path>
      </svg>
    </TabIcon>
  );

  const MovementIcon = () => (
    <TabIcon label="unordered-list" iconClass="anticon-unordered-list">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M128 224h96v96h-96zm192 0h576v96H320zm-192 240h96v96h-96zm192 0h576v96H320zm-192 240h96v96h-96zm192 0h576v96H320z"></path>
      </svg>
    </TabIcon>
  );

  const BalanceIcon = () => (
    <TabIcon label="bar-chart" iconClass="anticon-bar-chart">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M128 768h768v96H128zM224 416h112v304H224zm232-176h112v480H456zm232 96h112v384H688z"></path>
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

  const CheckOutlined = () => (
    <span role="img" aria-label="check" className="anticon anticon-check">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M880 256L384 752 144 512l56-56 184 184 440-440z"></path>
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

  const EditMovementIcon = () => (
    <span role="img" aria-label="edit" className="anticon anticon-edit">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M257.7 752c-2.6 0-5.2-.3-7.8-.8l-141.2-28.2c-18.1-3.6-31.4-19.5-31.4-38 0-2.6.3-5.2.8-7.8l28.2-141.2c1.4-7.1 4.8-13.7 10-18.9L620.7 12.7l202.6 202.6-504.6 504.6c-16.3 16.3-38.1 25.4-61 25.4zM694.2 158.6L158.6 694.2l84.9 17 535.6-535.6-84.9-17zM783.6 286.1L581 83.5l62.2-62.2c12.5-12.5 32.8-12.5 45.3 0l157.3 157.3c12.5 12.5 12.5 32.8 0 45.3l-62.2 62.2z"></path>
      </svg>
    </span>
  );

  const PolicyIcon = () => (
    <span style={tabIconStyle}>
      <FileTextOutlined />
    </span>
  );

  const DownloadOutlined = () => (
    <span role="img" aria-label="download" className="anticon anticon-download">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M505.7 661a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z"></path>
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

  const TransferAccountIcon = () => (
    <span role="img" aria-label="transfer" className="anticon anticon-swap">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M120 320h552l-96-96 56-56 192 192-192 192-56-56 96-96H120v-80z"></path>
        <path d="M904 704H352l96 96-56 56-192-192 192-192 56 56-96 96h552v80z"></path>
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
  const [transferFilters, setTransferFilters] = React.useState({});
  const [transferFilterVisible, setTransferFilterVisible] = React.useState(false);
  const [transferFilterForm] = Form.useForm();
  const [branches, setBranches] = React.useState([]);
  const [currentUserEmail, setCurrentUserEmail] = React.useState('');
  const [newCashDeskVisible, setNewCashDeskVisible] = React.useState(false);
  const [newCashDeskLoading, setNewCashDeskLoading] = React.useState(false);
  const [closeCashDeskLoading, setCloseCashDeskLoading] = React.useState(false);
  const [newCashDeskForm] = Form.useForm();
  const [depositVisible, setDepositVisible] = React.useState(false);
  const [depositSubmitting, setDepositSubmitting] = React.useState(false);
  const [depositForm] = Form.useForm();
  const [depositExpectedAmount, setDepositExpectedAmount] = React.useState(0);
  const [uniqueDeposit, setUniqueDeposit] = React.useState(true);
  const [newIncomeForm] = Form.useForm();
  const [activeTab, setActiveTab] = React.useState('cash-desks');
  const [movementRows, setMovementRows] = React.useState([]);
  const [movementLoading, setMovementLoading] = React.useState(false);
  const [movementPagination, setMovementPagination] = React.useState({ current: 1, pageSize: 15 });
  const [movementTotal, setMovementTotal] = React.useState(0);
  const [movementFilters, setMovementFilters] = React.useState({});
  const [movementFilterVisible, setMovementFilterVisible] = React.useState(false);
  const [movementFilterForm] = Form.useForm();
  const [movementActionId, setMovementActionId] = React.useState(0);
  const [movementSelectedRowKeys, setMovementSelectedRowKeys] = React.useState([]);
  const [movementViewVisible, setMovementViewVisible] = React.useState(false);
  const [movementViewRecord, setMovementViewRecord] = React.useState(null);
  const [movementEditVisible, setMovementEditVisible] = React.useState(false);
  const [movementEditRecord, setMovementEditRecord] = React.useState(null);
  const [movementEditLoading, setMovementEditLoading] = React.useState(false);
  const [balanceRows, setBalanceRows] = React.useState([]);
  const [balanceLoading, setBalanceLoading] = React.useState(false);
  const [transitAccountRows, setTransitAccountRows] = React.useState([]);
  const [selectedTransitAccountId, setSelectedTransitAccountId] = React.useState(null);
  const [transitAccountLoading, setTransitAccountLoading] = React.useState(false);
  const [transitAccountPagination, setTransitAccountPagination] = React.useState({ current: 1, pageSize: 15 });
  const [transitAccountTotal, setTransitAccountTotal] = React.useState(0);
  const [transitAccountFilters, setTransitAccountFilters] = React.useState({});
  const [transitHasSearched, setTransitHasSearched] = React.useState(false);
  const [transitFilterVisible, setTransitFilterVisible] = React.useState(false);
  const [transitDetailPagination, setTransitDetailPagination] = React.useState({});
  const [transitFilterForm] = Form.useForm();
  const [refundMoneyVisible, setRefundMoneyVisible] = React.useState(false);
  const [refundMoneyForm] = Form.useForm();
  const [accountTransferVisible, setAccountTransferVisible] = React.useState(false);
  const [accountTransferForm] = Form.useForm();
  const accountTransferAmount = Form.useWatch('amount', accountTransferForm);
  const [accountTransferSourceBalance, setAccountTransferSourceBalance] = React.useState(0);
  const [accountTransferAccountOptions, setAccountTransferAccountOptions] = React.useState([]);
  const [accountTransferAccountLoading, setAccountTransferAccountLoading] = React.useState(false);
  const accountTransferAccountSearchTimer = React.useRef(null);
  const [reversalVisible, setReversalVisible] = React.useState(false);
  const [reversalCatalogLoading, setReversalCatalogLoading] = React.useState(false);
  const [reversalLoading, setReversalLoading] = React.useState(false);
  const [reversalCauses, setReversalCauses] = React.useState([]);
  const [reversalSubcauses, setReversalSubcauses] = React.useState([]);
  const [reversalRecord, setReversalRecord] = React.useState(null);
  const [reversalCause, setReversalCause] = React.useState(undefined);
  const [reversalSubcause, setReversalSubcause] = React.useState(undefined);
  const [reversalCreditFunds, setReversalCreditFunds] = React.useState(false);
  const [reversalAccountId, setReversalAccountId] = React.useState(undefined);
  const [reversalAccountOptions, setReversalAccountOptions] = React.useState([]);
  const [reversalAccountLoading, setReversalAccountLoading] = React.useState(false);
  const [reversalFormConfig, setReversalFormConfig] = React.useState(null);
  const [cashierReports, setCashierReports] = React.useState([]);
  const [cashDeskAuditVisible, setCashDeskAuditVisible] = React.useState(false);
  const [cashDeskAuditLoading, setCashDeskAuditLoading] = React.useState(false);
  const [cashDeskAudit, setCashDeskAudit] = React.useState(null);
  const [collectionRows, setCollectionRows] = React.useState([]);
  const [collectionLoading, setCollectionLoading] = React.useState(false);
  const [collectionPagination, setCollectionPagination] = React.useState({ current: 1, pageSize: 15 });
  const [collectionTotal, setCollectionTotal] = React.useState(0);
  const [collectionExecutionTime, setCollectionExecutionTime] = React.useState(0);
  const [premiumExportLoading, setPremiumExportLoading] = React.useState(false);
  const [collectionFilters, setCollectionFilters] = React.useState({});
  const [collectionFilterVisible, setCollectionFilterVisible] = React.useState(false);
  const [collectionSelectedRowKeys, setCollectionSelectedRowKeys] = React.useState([]);
  const [collectionChargeVisible, setCollectionChargeVisible] = React.useState(false);
  const [transitCollectionMode, setTransitCollectionMode] = React.useState(false);
  const [transitCollectionAccount, setTransitCollectionAccount] = React.useState(null);
  const [transitCollectionPolicyRow, setTransitCollectionPolicyRow] = React.useState(null);
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
  const [newIncomeAccountSearchForm] = Form.useForm();
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
  const [newIncomeDestinationAccountOptions, setNewIncomeDestinationAccountOptions] = React.useState([]);
  const [newIncomeDestinationAccountLoading, setNewIncomeDestinationAccountLoading] = React.useState(false);
  const [newIncomeAccountSearchVisible, setNewIncomeAccountSearchVisible] = React.useState(false);
  const [accountTransferSearchTarget, setAccountTransferSearchTarget] = React.useState(null);
  const [newIncomeAccountSearchRows, setNewIncomeAccountSearchRows] = React.useState([]);
  const [newIncomeAccountSearchLoading, setNewIncomeAccountSearchLoading] = React.useState(false);
  const [newIncomeAccountSearchPagination, setNewIncomeAccountSearchPagination] = React.useState({ current: 1, pageSize: 10 });
  const [newIncomeAccountSearchTotal, setNewIncomeAccountSearchTotal] = React.useState(0);
  const [newIncomeTypeCode, setNewIncomeTypeCode] = React.useState(undefined);
  const [depositAccountOptions, setDepositAccountOptions] = React.useState([]);
  const [newIncomePayments, setNewIncomePayments] = React.useState([
    { key: 1, methodCode: undefined, amount: '' }
  ]);
  const [newIncomeDynamicForms, setNewIncomeDynamicForms] = React.useState({});
  const [newIncomeTypeDynamicForm, setNewIncomeTypeDynamicForm] = React.useState(null);
  const [newIncomeActiveFormKey, setNewIncomeActiveFormKey] = React.useState(null);
  const newIncomeFormRefs = React.useRef({});
  const newIncomeTypeFormRef = React.useRef(null);
  const newIncomeDestinationSearchTimer = React.useRef(null);
  const reversalFormRef = React.useRef(null);
  const shellRef = React.useRef(null);
  const mainViewportRef = React.useRef(null);

  React.useEffect(() => {
    if (!accountTransferVisible || !Array.isArray(currencyOptions) || currencyOptions.length === 0) return;

    const currentCurrency = accountTransferForm.getFieldValue('currency');
    if (!currentCurrency) {
      accountTransferForm.setFieldsValue({ currency: currencyOptions[0].value });
    }
  }, [accountTransferVisible, currencyOptions]);

  React.useEffect(() => {
    if (!transitFilterVisible || !Array.isArray(currencyOptions) || currencyOptions.length !== 1) return;

    const currentCurrency = transitFilterForm.getFieldValue('currency');
    if (!currentCurrency) {
      transitFilterForm.setFieldsValue({ currency: currencyOptions[0].value });
    }
  }, [transitFilterVisible, currencyOptions]);

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

      .cashier-supervisor-premium-pay-button.ant-btn,
      .cashier-supervisor-premium-pay-button.ant-btn-primary {
        color: #fff !important;
        background: #1677ff !important;
        border-color: #1677ff !important;
      }

      .cashier-supervisor-premium-pay-button.ant-btn:hover,
      .cashier-supervisor-premium-pay-button.ant-btn:focus,
      .cashier-supervisor-premium-pay-button.ant-btn-primary:hover,
      .cashier-supervisor-premium-pay-button.ant-btn-primary:focus {
        color: #fff !important;
        background: #4096ff !important;
        border-color: #4096ff !important;
      }

      .cashier-supervisor-spaced-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .cashier-supervisor-outline-button.ant-btn {
        color: #1677ff;
        background: transparent;
        border-color: #1677ff;
        border-radius: 0;
        box-shadow: none;
      }

      .cashier-supervisor-outline-button.ant-btn:hover,
      .cashier-supervisor-outline-button.ant-btn:focus {
        color: #4096ff;
        background: #e6f4ff;
        border-color: #4096ff;
      }

      .cashier-supervisor-outline-button.ant-btn:disabled {
        color: rgba(0, 0, 0, 0.25);
        background: #f5f5f5;
        border-color: #d9d9d9;
      }

      .cashier-supervisor-success-button.ant-btn {
        color: #389e0d;
        background: #f6ffed;
        border-color: #52c41a;
        border-radius: 0;
        box-shadow: none;
      }

      .cashier-supervisor-success-button.ant-btn:hover,
      .cashier-supervisor-success-button.ant-btn:focus {
        color: #237804;
        background: #d9f7be;
        border-color: #389e0d;
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

      .cashier-supervisor-audit-summary {
        border: 1px solid #91caff;
        background: #fff;
        padding: 10px;
        color: #262626;
      }

      .cashier-supervisor-audit-currency {
        text-align: right;
        font-weight: 600;
        margin-bottom: 6px;
      }

      .cashier-supervisor-audit-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        line-height: 1.35;
      }

      .cashier-supervisor-audit-row strong {
        min-width: 90px;
        text-align: right;
        font-weight: 400;
      }

      .cashier-supervisor-audit-total {
        font-weight: 600;
      }

      .cashier-supervisor-audit-total strong {
        font-weight: 600;
      }

      .cashier-supervisor-audit-spacer {
        height: 10px;
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

      .cashier-supervisor-tab-content.cashier-supervisor-tab-content-premiums {
        overflow: hidden;
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

      .cashier-supervisor-premium-spin {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        overflow: hidden;
      }

      .cashier-supervisor-premium-spin > .ant-spin-container {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .cashier-supervisor-premium-spin > .ant-spin-container > .ant-card {
        flex: 1 1 auto;
        min-height: 0;
      }

      .cashier-supervisor-tab-content-premiums .cashier-supervisor-table .ant-table-content {
        overflow-y: hidden !important;
      }

      .cashier-supervisor-tab-content-premiums .cashier-supervisor-table .ant-table,
      .cashier-supervisor-tab-content-premiums .cashier-supervisor-table .ant-table-container,
      .cashier-supervisor-tab-content-premiums .cashier-supervisor-table .ant-table-tbody,
      .cashier-supervisor-tab-content-premiums .cashier-supervisor-table .ant-spin-nested-loading,
      .cashier-supervisor-tab-content-premiums .cashier-supervisor-table .ant-card,
      .cashier-supervisor-tab-content-premiums .cashier-supervisor-table .ant-card-body {
        overflow-y: hidden !important;
      }

      .cashier-supervisor-tab-content-premiums .cashier-supervisor-table .ant-table-body {
        overflow-y: auto !important;
      }

      .cashier-supervisor-account-search-table .ant-table-body {
        overflow-x: scroll !important;
        overflow-y: scroll !important;
        scrollbar-gutter: stable;
      }

      .cashier-supervisor-account-search-table .ant-table-content {
        overflow-x: scroll !important;
        scrollbar-gutter: stable;
      }

      .cashier-supervisor-account-search-table .ant-table-thead > tr > th,
      .cashier-supervisor-account-search-table .ant-table-tbody > tr > td {
        padding: 2px 6px !important;
        line-height: 16px;
      }

      .cashier-supervisor-account-search-table .cashier-supervisor-account-select-cell {
        min-width: 82px;
        height: 22px;
        padding: 0 4px;
        line-height: 20px;
        text-align: center;
        white-space: nowrap;
      }

      .cashier-supervisor-account-search-table .cashier-supervisor-account-cell {
        display: block;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .cashier-supervisor-account-search-table .ant-table-tbody > tr {
        cursor: pointer;
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

      .cashier-supervisor-transit-detail .ant-table-thead > tr > th,
      .cashier-supervisor-transit-detail .ant-table-tbody > tr > td {
        padding: 3px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-transit-detail {
        padding: 8px 16px 16px;
        background: #fafafa;
        overflow: visible;
      }

      .cashier-supervisor-transit-detail .ant-table-pagination {
        margin-bottom: 4px !important;
      }

      .cashier-supervisor-shell .ant-checkbox-inner {
        border-color: #5b6573;
      }

      .cashier-supervisor-shell .ant-checkbox:hover .ant-checkbox-inner {
        border-color: #1f2937;
      }

      .cashier-supervisor-drawer .ant-checkbox-inner {
        border-color: #5b6573;
      }

      .cashier-supervisor-drawer .ant-checkbox:hover .ant-checkbox-inner {
        border-color: #1f2937;
      }

      .cashier-supervisor-shell .ant-radio-inner {
        border-color: #5b6573;
        border-width: 2px;
      }

      .cashier-supervisor-shell .ant-radio:hover .ant-radio-inner {
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

      .cashier-supervisor-tab-content.cashier-supervisor-tab-content-new-income {
        flex: 0 0 auto;
        overflow: visible;
      }

      .cashier-supervisor-center.cashier-supervisor-center-new-income {
        flex: 0 0 calc(100dvh - 180px - var(--cashier-supervisor-north-height) - 8px);
        height: calc(100dvh - 180px - var(--cashier-supervisor-north-height) - 8px);
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        display: block;
      }

      .cashier-supervisor-center.cashier-supervisor-center-new-income .cashier-supervisor-view {
        height: auto;
        min-height: 100%;
        overflow: visible;
      }

      .cashier-supervisor-tab-content-new-income .cashier-supervisor-new-income-card {
        height: auto !important;
        min-height: 0 !important;
      }

      .cashier-supervisor-tab-content-new-income .cashier-supervisor-new-income-card .ant-card-body {
        flex: 0 0 auto !important;
        overflow: visible !important;
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

  React.useEffect(() => {
    if (!getTrimmedString(currentUserEmail)) {
      return;
    }

    loadTransferWorkspaces({
      filters: transferFilters,
      pagination: { current: 1, pageSize: transferPagination.pageSize }
    });
  }, [currentUserEmail]);

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

  function buildTransferWorkspaceFilter(filters = transferFilters) {
    // Only open cash desks owned by the current session user are shown.
    const sessionUser = getTrimmedString(currentUserEmail);
    if (!sessionUser) {
      return '1=0';
    }

    let filter = `closed=0 AND [user] = N'${escapeSqlString(sessionUser)}'`;
    const source = filters || {};

    if (source.dateFrom) {
      filter += ` AND [date] >= N'${escapeSqlString(source.dateFrom)}'`;
    }

    if (source.dateToExclusive) {
      filter += ` AND [date] < N'${escapeSqlString(source.dateToExclusive)}'`;
    }

    return filter;
  }

  function formatTransferFilterBoundary(value, addDay) {
    if (!value || typeof value.format !== 'function') {
      return '';
    }

    const parts = value.format('YYYY-MM-DD').split('-').map(Number);
    if (parts.length !== 3 || parts.some(item => !Number.isInteger(item))) {
      return '';
    }

    const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
    if (addDay) {
      utcDate.setUTCDate(utcDate.getUTCDate() + 1);
    }

    const year = utcDate.getUTCFullYear();
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day} 00:00:00.000`;
  }

  function applyTransferFilters(values) {
    const nextFilters = {
      dateFrom: formatTransferFilterBoundary(values && values.dateFrom, false),
      dateToExclusive: formatTransferFilterBoundary(values && values.dateTo, true)
    };

    setTransferFilters(nextFilters);
    setTransferFilterVisible(false);
    loadTransferWorkspaces({
      filters: nextFilters,
      pagination: { current: 1, pageSize: transferPagination.pageSize }
    });
  }

  function clearTransferFilters() {
    transferFilterForm.resetFields();
    setTransferFilters({});
    setTransferFilterVisible(false);
    loadTransferWorkspaces({
      filters: {},
      pagination: { current: 1, pageSize: transferPagination.pageSize }
    });
  }

  function loadTransitAccounts(params = {}) {
    const pagination = params.pagination || transitAccountPagination;
    const filters = params.filters || transitAccountFilters;
    const pageSize = Number(pagination && pagination.pageSize) || 15;
    const currentPage = Number(pagination && pagination.current) || 1;

    setTransitAccountLoading(true);
    exe('ExeChain', {
      chain: 'cmdGetTransitMovs',
      context: JSON.stringify({
        page: currentPage,
        size: pageSize,
        holderId: filters && filters.holderId !== undefined && filters.holderId !== null
          ? filters.holderId
          : '',
        policy: getTrimmedString(filters && filters.policy),
        accountName: getTrimmedString(filters && filters.accountName),
        accountCode: getTrimmedString(filters && filters.accountCode),
        currency: getTrimmedString(filters && filters.currency),
        name: getTrimmedString(filters && filters.name),
        cancellations: filters && filters.cancellations === true,
        onlyWithBalance: filters && filters.onlyWithBalance === true
      })
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Transit accounts could not be loaded.'));
        }

        const payload = response.outData && typeof response.outData === 'object'
          ? response.outData
          : {};
        const rows = Array.isArray(payload.data) ? payload.data : [];
        setTransitAccountRows(rows);
        setSelectedTransitAccountId(current => rows.some(row => Number(row && row.id) === Number(current))
          ? current ? String(current) : null
          : null);
        setTransitAccountTotal(Number(payload.total) || 0);
        setTransitAccountPagination({ current: currentPage, pageSize });
      })
      .catch(error => {
        setTransitAccountRows([]);
        setSelectedTransitAccountId(null);
        setTransitAccountTotal(0);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setTransitAccountLoading(false));
  }

  function getTransitMovements(account) {
    const movements = getRows({ outData: account && account.Movements });
    const visibleMovements = movements.filter(item => {
      const transactionCode = getTrimmedString(item && item.transactionCode).toUpperCase();
      const amount = Number(item && item.amount);
      return transactionCode !== 'PREMIUMPAY'
        && transactionCode !== 'MONEYOUT'
        && Number.isFinite(amount);
    });

    if (transitAccountFilters && transitAccountFilters.cancellations === true) {
      return visibleMovements.filter(item => getTrimmedString(item && item.transaction) === 'Cancellation');
    }

    return visibleMovements;
  }

  function getTransitAccountBalance(account) {
    return getTransitMovements(account).reduce((total, movement) => {
      const amount = Number(movement && movement.amount);
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }

  function getTransitAccountLabel(account) {
    return {
      policy: getTrimmedString(account && (account.policyCode || account.lifePolicyCode || account.lifePolicyId)) || '-',
      contact: getTrimmedString(account && (account.contactName || account.holderName || account.holderId)) || '-'
    };
  }

  function applyTransitFilters(values) {
    const nextFilters = {
      holderId: values && values.contact !== undefined && values.contact !== null ? values.contact : '',
      policy: getTrimmedString(values && values.policy),
      accountName: getTrimmedString(values && values.accountName),
      accountCode: getTrimmedString(values && values.accountCode),
      currency: getTrimmedString(values && values.currency),
      name: getTrimmedString(values && values.name),
      cancellations: values && values.cancellations === true,
      onlyWithBalance: values && values.onlyWithBalance === true
    };
    setTransitAccountFilters(nextFilters);
    setTransitHasSearched(true);
    setTransitFilterVisible(false);
    loadTransitAccounts({
      filters: nextFilters,
      pagination: { current: 1, pageSize: transitAccountPagination.pageSize }
    });
  }

  function clearTransitFilters() {
    transitFilterForm.resetFields();
    if (Array.isArray(currencyOptions) && currencyOptions.length === 1) {
      transitFilterForm.setFieldsValue({ currency: currencyOptions[0].value });
    }
    setTransitAccountFilters({});
    setTransitHasSearched(false);
    setTransitAccountRows([]);
    setSelectedTransitAccountId(null);
    setTransitAccountTotal(0);
    setTransitFilterVisible(false);
  }

  function handleTransitTableChange(pagination) {
    loadTransitAccounts({
      filters: transitAccountFilters,
      pagination: { current: pagination.current, pageSize: pagination.pageSize }
    });
  }

  function getTransitDetailPage(accountId, total) {
    const page = transitDetailPagination[accountId] || { current: 1, pageSize: 10 };
    return { ...page, total };
  }

  function setTransitDetailPage(accountId, pagination) {
    setTransitDetailPagination(current => ({
      ...current,
      [accountId]: { current: pagination.current, pageSize: pagination.pageSize }
    }));
  }

  function getTransitSourceAccountOptions() {
    return transitAccountRows
      .map(account => {
        const label = getTransitAccountLabel(account);
        const accountId = Number(account && account.id) || 0;
        if (accountId <= 0) return null;

        return {
          value: accountId,
          label: `${getTrimmedString(account && account.accNo) || '-'} - ${getTrimmedString(account && account.name) || '-'} - ${getTrimmedString(account && account.currency) || '-'}`,
          accountLabel: label
        };
      })
      .filter(option => option);
  }

  function openRefundMoneyModal() {
    const selectedAccount = transitAccountRows.find(row => Number(row && row.id) === Number(selectedTransitAccountId));

    if (!selectedAccount) {
      message.warning(t('Select a transit account first.'));
      return;
    }

    const selectedCurrency = getTrimmedString(selectedAccount.currency).toUpperCase();
    const currency = currencyOptions.some(option => getTrimmedString(option && option.value).toUpperCase() === selectedCurrency)
      ? selectedCurrency
      : currencyOptions[0] && currencyOptions[0].value;

    refundMoneyForm.setFieldsValue({
      currency: currency,
      sourceAccount: Number(selectedAccount.id),
      sourcePercentage: 100,
      amount: Math.max(0, getAuditNumber(selectedAccount.movementBalance)),
      paymentMethod: undefined,
      beneficiary: currentUserEmail || '',
      reference: ''
    });
    setRefundMoneyVisible(true);
  }

  function closeRefundMoneyModal() {
    setRefundMoneyVisible(false);
    refundMoneyForm.resetFields();
  }

  function submitRefundMoneyRequest() {
    message.info(t('The refund request form is ready for processing.'));
  }

  function openAccountTransferModal() {
    accountTransferForm.resetFields();
    setAccountTransferSourceBalance(0);
    setAccountTransferSearchTarget(null);
    setAccountTransferAccountOptions([]);
    accountTransferForm.setFieldsValue({
      currency: currencyOptions[0] && currencyOptions[0].value,
      externalSource: false
    });
    setAccountTransferVisible(true);
  }

  function closeAccountTransferModal() {
    if (accountTransferAccountSearchTimer.current) {
      clearTimeout(accountTransferAccountSearchTimer.current);
      accountTransferAccountSearchTimer.current = null;
    }
    setAccountTransferVisible(false);
    setAccountTransferSourceBalance(0);
    setAccountTransferSearchTarget(null);
    setAccountTransferAccountOptions([]);
    accountTransferForm.resetFields();
  }

  function searchAccountTransferAccounts(value) {
    const text = getTrimmedString(value);
    const currency = getTrimmedString(accountTransferForm.getFieldValue('currency')).toUpperCase();

    if (accountTransferAccountSearchTimer.current) {
      clearTimeout(accountTransferAccountSearchTimer.current);
      accountTransferAccountSearchTimer.current = null;
    }

    if (!text) {
      setAccountTransferAccountOptions([]);
      return;
    }

    if (!currency) {
      setAccountTransferAccountOptions([]);
      message.warning(t('Select a currency before searching accounts.'));
      return;
    }

    accountTransferAccountSearchTimer.current = setTimeout(() => {
      setAccountTransferAccountLoading(true);
      exe('ExeChain', {
        chain: 'cmdSearchTransitAccounts',
        context: JSON.stringify({ page: 1, size: 10, accountName: text, currency: currency })
      })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Accounts could not be loaded.'));
          }

          setAccountTransferAccountOptions(
            mapTransitAccountOptions(getAccountSearchRows(response))
              .filter(option => getTrimmedString(option && option.account && option.account.currency).toUpperCase() === currency)
          );
        })
        .catch(error => {
          setAccountTransferAccountOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setAccountTransferAccountLoading(false));
    }, 250);
  }

  function handleAccountTransferCurrencyChange(value) {
    if (accountTransferAccountSearchTimer.current) {
      clearTimeout(accountTransferAccountSearchTimer.current);
      accountTransferAccountSearchTimer.current = null;
    }

    accountTransferForm.setFieldsValue({
      currency: value,
      sourceAccount: undefined,
      sourceName: '',
      destinationAccount: undefined,
      destinationName: ''
    });
    setAccountTransferSourceBalance(0);
    setAccountTransferAccountOptions([]);
  }

  function updateAccountTransferContact(fieldName, accountId) {
    const selectedOption = accountTransferAccountOptions.find(option => Number(option && option.value) === Number(accountId));
    const account = selectedOption && selectedOption.account;
    const contactName = getTrimmedString(account && (account.contactName || account.holderName || account.holder));
    const targetField = fieldName === 'sourceAccount' ? 'sourceName' : 'destinationName';

    if (fieldName === 'sourceAccount') {
      const balance = Number(account && account.movementBalance);
      setAccountTransferSourceBalance(Number.isFinite(balance) ? balance : 0);
    }

    accountTransferForm.setFieldsValue({ [targetField]: contactName });
  }

  function getAccountTransferSourceBalance() {
    const balance = Number(accountTransferSourceBalance);
    return Number.isFinite(balance) ? balance : 0;
  }

  async function submitAccountTransfer(values) {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    const sourceAccountId = Number(values && values.sourceAccount);
    const destinationAccountId = Number(values && values.destinationAccount);
    const amount = Number(values && values.amount);

    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      message.error(t('Select an open cash desk first.'));
      return;
    }

    if (!Number.isFinite(sourceAccountId) || sourceAccountId <= 0
      || !Number.isFinite(destinationAccountId) || destinationAccountId <= 0) {
      message.error(t('Select both source and destination accounts.'));
      return;
    }

    if (sourceAccountId === destinationAccountId) {
      message.error(t('Source and destination accounts must be different.'));
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      message.error(t('Enter an amount greater than zero.'));
      return;
    }

    const availableBalance = getAccountTransferSourceBalance();
    if (amount > availableBalance) {
      message.error(
        `${t('The source account does not have enough balance.')} ${t('Available')}: ${formatMoney(availableBalance)}.`
      );
      return;
    }

    const depositPaymentType = incomeTypeOptions.find(item =>
      getTrimmedString(item && item.internalType).toUpperCase() === 'DEPOPAYMENT'
      || getTrimmedString(item && (item.value || item.code)).toUpperCase() === 'DEPOPAYMENT'
    );
    if (!depositPaymentType) {
      message.error(t('The DEPOPAYMENT income type is not configured.'));
      return;
    }

    const currency = getTrimmedString(values && values.currency);
    const concept = getTrimmedString(values && values.reference);
    const sourceName = getTrimmedString(values && values.sourceName);
    const destinationName = getTrimmedString(values && values.destinationName);
    const incomeType = getTrimmedString(depositPaymentType.value || depositPaymentType.code);
    const date = getCurrentUtcDateTime();

    // Each movement points only to its destination account, matching the cash income model.
    const buildTransferEntity = (transferAmount, destinationAccount, accountName) => ({
      currency: currency,
      amount: transferAmount,
      sourceAccountId: null,
      destinationAccountId: destinationAccount,
      concept: concept,
      paymentMethod: 'OT',
      paymentMethodName: 'OT',
      SplitPayments: [{
        paymentMethod: 'OT',
        paymentMethodName: 'OT',
        amount: transferAmount,
        currency: currency,
        id: 0,
        transferId: 0
      }],
      sourceName: null,
      destinationName: accountName,
      source: null,
      destination: null,
      AllocationMovements: null,
      id: 0,
      transactionCode: null,
      producer: null,
      lifePolicyId: null,
      date: date,
      status: 0,
      executed: false,
      isExternal: true,
      sourceExternal: null,
      allocationId: null,
      Allocation: null,
      operatingAccountId: 0,
      claimPaymentId: null,
      ClaimPayment: null,
      SourceAccount: null,
      DestinationAccount: null,
      Movements: null,
      reversalDate: null,
      incomeType: incomeType,
      IncomeType: null,
      jIncomeTypeForm: null,
      transferWorkspaceId: workspaceId,
      user: currentUserEmail || null
    });

    const outgoingEntity = buildTransferEntity(-amount, sourceAccountId, sourceName);
    const incomingEntity = buildTransferEntity(amount, destinationAccountId, destinationName);

    async function createTransfer(transferEntity) {
      const response = await exe('RepoTransfer', {
        operation: 'ADD',
        entity: transferEntity,
        bulkJson: null,
        filter: null,
        include: null,
        size: 0,
        page: 0,
        execute: false,
        otherReceivables: null
      });

      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The account transfer could not be created.'));
      }

      const createdRows = getRows(response);
      const createdTransfer = createdRows[0]
        || (response && response.outData && !Array.isArray(response.outData) ? response.outData : {});
      const transferId = Number(createdTransfer && (createdTransfer.id || createdTransfer.transferId));
      if (!Number.isFinite(transferId) || transferId <= 0) {
        throw new Error(t('The transfer was created, but its movement identifier could not be identified.'));
      }

      return { id: transferId, amount: transferEntity.amount, concept: transferEntity.concept };
    }

    try {
      const outgoingTransfer = await createTransfer(outgoingEntity);
      const incomingTransfer = await createTransfer(incomingEntity);

      closeAccountTransferModal();
      loadMovements({ pagination: { current: 1, pageSize: movementPagination.pageSize } });
      showAccountTransferExecutionConfirm([outgoingTransfer, incomingTransfer]);
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    }
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
      exe('RepoExternalSourceCatalog', { operation: 'GET' }),
      exe('RepoAccountGroup', { operation: 'GET', filter: "[group]='DEPOSITS'" })
    ])
      .then(responses => {
        const currencyResponse = responses[0];
        const paymentResponse = responses[1];
        const incomeResponse = responses[2];
        const sourceResponse = responses[3];
        const depositAccountResponse = responses[4];

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
        if (!depositAccountResponse || depositAccountResponse.ok === false) {
          throw new Error(depositAccountResponse && depositAccountResponse.msg
            ? depositAccountResponse.msg
            : t('Deposit accounts could not be loaded.'));
        }

        setCurrencyOptions(getRows(currencyResponse).map(item => ({
          value: item && item.code,
          label: `${item && item.symbol ? item.symbol : ''} ${getTrimmedString(item && item.name)}`.trim()
        })).filter(item => item.value));
        const cashierPaymentMethodCodes = ['1', 'CH', 'TCD', 'OT'];
        setPaymentMethodOptions(getRows(paymentResponse)
          .filter(item => cashierPaymentMethodCodes.indexOf(getTrimmedString(item && item.code)) >= 0)
          .map(item => ({
            value: item && item.code,
            label: getTrimmedString(item && item.name),
            formId: Number(item && item.formId) > 0 ? Number(item.formId) : 0
          }))
          .filter(item => item.value));
        setIncomeTypeOptions(getRows(incomeResponse).map(item => ({
          value: item && item.code,
          label: getTrimmedString(item && item.name),
          name: getTrimmedString(item && item.name),
          formId: Number(item && item.formId) > 0 ? Number(item.formId) : 0,
          internalType: getTrimmedString(item && item.internalType)
        })).filter(item => item.value));
        const sourceOptions = getRows(sourceResponse).map(item => ({
          value: item && item.code,
          label: getTrimmedString(item && item.name),
          destinationAccNo: getTrimmedString(item && item.destinationAccNo)
        })).filter(item => item.value);
        setExternalSourceOptions(sourceOptions);
        setDepositAccountOptions(getRows(depositAccountResponse).map(item => ({
          value: Number(item && item.accountId),
          label: getTrimmedString(item && item.name),
          code: getTrimmedString(item && item.code),
          currency: getTrimmedString(item && item.currency)
        })).filter(item => Number.isFinite(item.value) && item.value > 0));
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

  function getDepositIncomeTypeOptions() {
    return incomeTypeOptions.filter(item =>
      getTrimmedString(item && item.internalType).toUpperCase().startsWith('DEPOSIT-')
    );
  }

  function updateDepositIncomeType(value) {
    const selected = getDepositIncomeTypeOptions().find(item => item && item.value === value);
    const typeNames = [
      getTrimmedString(selected && (selected.name || selected.label)),
      getTrimmedString(selected && selected.internalType)
    ];
    let destinationId = 0;

    typeNames.some(typeName => {
      const parts = typeName.split('-');
      const candidate = Number(getTrimmedString(parts[parts.length - 1]));
      if (Number.isFinite(candidate) && candidate > 0) {
        destinationId = candidate;
        return true;
      }
      return false;
    });

    const depositAccount = depositAccountOptions.find(item =>
      getTrimmedString(item && item.code) === String(destinationId)
    );

    depositForm.setFieldsValue({
      incomeType: value,
      destination: depositAccount && Number.isFinite(Number(depositAccount.value))
        ? Number(depositAccount.value)
        : undefined
    });
  }

  function applyMovementFilters(values) {
    const transferId = Number(values && values.transferId);
    const rawAmount = values && values.amount;
    const hasAmount = rawAmount !== null && rawAmount !== undefined && rawAmount !== '';
    const amount = Number(rawAmount);
    const incomeType = getTrimmedString(values && values.incomeType);
    const nextFilters = {
      pending: values && values.pending === true,
      transferId: Number.isInteger(transferId) && transferId > 0 ? transferId : null,
      amount: hasAmount && Number.isFinite(amount) && amount >= 0 ? amount : null,
      incomeType: incomeType || null
    };

    setMovementFilters(nextFilters);
    setMovementFilterVisible(false);
    loadMovements({
      filters: nextFilters,
      pagination: { current: 1, pageSize: movementPagination.pageSize }
    });
  }

  function clearMovementFilters() {
    movementFilterForm.resetFields();
    setMovementFilters({});
    setMovementFilterVisible(false);
    loadMovements({
      filters: {},
      pagination: { current: 1, pageSize: movementPagination.pageSize }
    });
  }

  function limitIncomeAmountDecimals(value) {
    const raw = getTrimmedString(value).replace(',', '.');
    if (!raw) return '';
    if (!/^\d*(\.\d*)?$/.test(raw)) return null;

    const parts = raw.split('.');
    if (parts.length === 1) return parts[0];

    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }

  function getNewIncomeTotal() {
    return newIncomePayments.reduce((total, payment) => total + parseIncomeAmount(payment.amount), 0);
  }

  function getNewIncomeDifference() {
    if (!collectionChargeVisible) return getNewIncomeTotal();
    return getNewIncomeTotal() - collectionExpectedAmount;
  }

  function getPaymentFormId(methodCode) {
    const code = getTrimmedString(methodCode);
    const option = paymentMethodOptions.find(item => item && getTrimmedString(item.value) === code);
    return option && Number(option.formId) > 0 ? Number(option.formId) : 0;
  }

  function getIncomeTypeOption(incomeTypeCode) {
    const code = getTrimmedString(incomeTypeCode);
    return incomeTypeOptions.find(item => item && getTrimmedString(item.value) === code);
  }

  function getIncomeTypeFormId(incomeTypeCode) {
    const option = getIncomeTypeOption(incomeTypeCode);
    return option && Number(option.formId) > 0 ? Number(option.formId) : 0;
  }

  function isTransitIncomeType(incomeTypeCode) {
    const option = getIncomeTypeOption(incomeTypeCode);
    const internalType = getTrimmedString(option && option.internalType).toUpperCase();
    return ['TRANSIT', 'DEPOPAYMENT'].includes(internalType);
  }

  function isVisibleNewIncomeType(option) {
    const internalType = getTrimmedString(option && option.internalType).toUpperCase();
    return !internalType.startsWith('DEPOSIT-');
  }

  function activateNewIncomePaymentForm(paymentKey, control) {
    setNewIncomeActiveFormKey(String(paymentKey));
    if (control && typeof control.focus === 'function') {
      setTimeout(() => control.focus(), 0);
    }
  }

  function loadNewIncomeDynamicForm(paymentKey, formId, savedValues) {
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

        const loadedForm = getRows(response)[0];
        const form = mergeDynamicFormValues(loadedForm, savedValues);
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
    setNewIncomeTypeCode(value);
    newIncomeForm.setFieldsValue({ destination: undefined });
    setNewIncomeDestinationAccountOptions([]);

    if (!isTransitIncomeType(value) && externalSourceOptions.length === 1) {
      newIncomeForm.setFieldsValue({ destination: externalSourceOptions[0].value });
    }

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

  function ensureNewIncomeTypeFormLoaded() {
    if (!collectionChargeVisible || !newIncomeTypeCode || newIncomeTypeDynamicForm) return;

    const formId = getIncomeTypeFormId(newIncomeTypeCode);
    if (formId <= 0) return;

    updateNewIncomeType(newIncomeTypeCode);
  }

  function searchNewIncomeDestinationAccounts(value) {
    const text = getTrimmedString(value);

    if (newIncomeDestinationSearchTimer.current) {
      clearTimeout(newIncomeDestinationSearchTimer.current);
      newIncomeDestinationSearchTimer.current = null;
    }

    if (!text) {
      setNewIncomeDestinationAccountOptions([]);
      return;
    }

    newIncomeDestinationSearchTimer.current = setTimeout(() => {
      setNewIncomeDestinationAccountLoading(true);
      exe('ExeChain', {
        chain: 'cmdSearchTransitAccounts',
        context: JSON.stringify({ page: 1, size: 10, accountName: text })
      })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Accounts could not be loaded.'));
          }

          setNewIncomeDestinationAccountOptions(mapTransitAccountOptions(getAccountSearchRows(response)));
        })
        .catch(error => {
          setNewIncomeDestinationAccountOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setNewIncomeDestinationAccountLoading(false));
    }, 250);
  }

  function getAccountSearchRows(response) {
    const result = response && response.outData && !Array.isArray(response.outData)
      ? response.outData
      : response;
    return Array.isArray(result && result.data) ? result.data : getRows(response);
  }

  function getCurrencyName(currency) {
    const code = getTrimmedString(currency).toUpperCase();
    const names = {
      USD: 'Dólar Estadounidense',
      EUR: 'Euro',
      PAB: 'Balboa',
      GBP: 'Libra Esterlina',
      CAD: 'Dólar Canadiense',
      MXN: 'Peso Mexicano',
      COP: 'Peso Colombiano',
      CRC: 'Colón Costarricense',
      GTQ: 'Quetzal',
      HNL: 'Lempira',
      NIO: 'Córdoba'
    };
    return names[code] || code;
  }

  function mapTransitAccountOptions(rows) {
    return (Array.isArray(rows) ? rows : []).map(account => {
      const id = Number(account && (account.id || account.accountId));
      const accNo = getTrimmedString(account && account.accNo);
      const name = getTrimmedString(account && account.name);
      const policyCode = getTrimmedString(account && account.policyCode);
      const contactName = getTrimmedString(account && account.contactName);
      const currency = getTrimmedString(account && account.currency).toUpperCase();
      const currencyName = getCurrencyName(currency);
      const details = [
        accNo && accNo !== name ? accNo : '',
        policyCode ? `${t('Policy')}: ${policyCode}` : '',
        contactName ? `${t('Contact')}: ${contactName}` : ''
      ]
        .filter(Boolean);

      return {
        value: id,
        label: (
          <div style={{ lineHeight: 1.25 }}>
            <div>
              {name || accNo || t('Unnamed account')} - {currencyName}
            </div>
            {details.map((detail, index) => (
              <div key={`${id}-${index}`} style={{ color: '#8c8c8c', fontSize: 11 }}>{detail}</div>
            ))}
          </div>
        ),
        accountLabel: (
          <span>
            {name || accNo || t('Unnamed account')} - {currencyName}
          </span>
        ),
        shortAccountLabel: `${name || accNo || t('Unnamed account')} - ${accNo || '-'}`,
        account: account
      };
    }).filter(option => Number.isFinite(option.value) && option.value > 0);
  }

  function loadNewIncomeAccountSearch(values, pagination) {
    const source = values || newIncomeAccountSearchForm.getFieldsValue();
    const currentPage = Number(pagination && pagination.current) || 1;
    const pageSize = Number(pagination && pagination.pageSize) || 10;
    const contactId = Number(source.contact);
    const isAccountTransferSearch = accountTransferSearchTarget === 'sourceAccount'
      || accountTransferSearchTarget === 'destinationAccount';
    const transferCurrency = isAccountTransferSearch
      ? getTrimmedString(accountTransferForm.getFieldValue('currency')).toUpperCase()
      : '';

    setNewIncomeAccountSearchLoading(true);
    exe('ExeChain', {
      chain: 'cmdSearchTransitAccounts',
      context: JSON.stringify({
        page: currentPage,
        size: pageSize,
        accountName: source.accountName || '',
        policy: source.policy || '',
        holderId: Number.isFinite(contactId) && contactId > 0 ? contactId : 0,
        currency: transferCurrency || undefined
      })
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Accounts could not be loaded.'));
        }

        const result = response && response.outData && !Array.isArray(response.outData)
          ? response.outData
          : response;
        const rows = getAccountSearchRows(response);
        setNewIncomeAccountSearchRows(transferCurrency
          ? rows.filter(account => getTrimmedString(account && account.currency).toUpperCase() === transferCurrency)
          : rows);
        setNewIncomeAccountSearchTotal(Number(result && result.total) || 0);
        setNewIncomeAccountSearchPagination({ current: currentPage, pageSize: pageSize });
      })
      .catch(error => {
        setNewIncomeAccountSearchRows([]);
        setNewIncomeAccountSearchTotal(0);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setNewIncomeAccountSearchLoading(false));
  }

  function openNewIncomeAccountSearch(targetField) {
    newIncomeAccountSearchForm.resetFields();
    setAccountTransferSearchTarget(targetField || null);
    setNewIncomeAccountSearchRows([]);
    setNewIncomeAccountSearchTotal(0);
    setNewIncomeAccountSearchPagination({ current: 1, pageSize: 10 });
    setNewIncomeAccountSearchVisible(true);
  }

  function clearNewIncomeAccountSearch() {
    newIncomeAccountSearchForm.resetFields();
    setNewIncomeAccountSearchRows([]);
    setNewIncomeAccountSearchTotal(0);
  }

  function selectNewIncomeDestinationAccount(account) {
    const id = Number(account && (account.id || account.accountId));
    if (!Number.isFinite(id) || id <= 0) return;

    if (accountTransferSearchTarget === 'newIncomeDestination') {
      const options = mapTransitAccountOptions([account]);
      const selectedOption = options[0];
      if (!selectedOption) return;

      setNewIncomeDestinationAccountOptions(current => [selectedOption].concat(
        current.filter(item => Number(item && item.value) !== id)
      ));
      newIncomeForm.setFieldsValue({ destination: selectedOption.value });
      setAccountTransferSearchTarget(null);
      setNewIncomeAccountSearchVisible(false);
      return;
    }

    if (accountTransferSearchTarget === 'sourceAccount'
      || accountTransferSearchTarget === 'destinationAccount') {
      const targetField = accountTransferSearchTarget;
      const targetName = targetField === 'sourceAccount' ? 'sourceName' : 'destinationName';
      const contactName = getTrimmedString(account && (account.contactName || account.holderName || account.holder));
      const options = mapTransitAccountOptions([account]);

      setAccountTransferAccountOptions(current => options.concat(
        current.filter(item => Number(item.value) !== id)
      ));
      accountTransferForm.setFieldsValue({
        [targetField]: id,
        [targetName]: contactName
      });
      if (targetField === 'sourceAccount') {
        const balance = Number(account && account.movementBalance);
        setAccountTransferSourceBalance(Number.isFinite(balance) ? balance : 0);
      }
      setAccountTransferSearchTarget(null);
      setNewIncomeAccountSearchVisible(false);
      return;
    }

    const options = mapTransitAccountOptions([account]);
    const selectedOption = options[0];
    if (!selectedOption) return;

    setNewIncomeDestinationAccountOptions(current => [selectedOption].concat(
      current.filter(item => Number(item && item.value) !== id)
    ));
    newIncomeForm.setFieldsValue({ destination: selectedOption.value });
    setNewIncomeAccountSearchVisible(false);
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
    setNewIncomeTypeCode(undefined);
    setNewIncomeDestinationAccountOptions([]);
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

  function mergeDynamicFormValues(form, savedValues) {
    if (!form || !savedValues) return form;

    let values = savedValues;
    if (typeof values === 'string') {
      try {
        values = JSON.parse(values);
      } catch (error) {
        return form;
      }
    }

    const savedDefinition = Array.isArray(values)
      ? values
      : (values && Array.isArray(values.fields) ? values.fields : []);
    if (savedDefinition.length === 0) return form;

    const savedByName = {};
    savedDefinition.forEach(field => {
      if (field && field.name && Object.prototype.hasOwnProperty.call(field, 'userData')) {
        savedByName[field.name] = field;
      }
    });

    const definition = getDynamicFormDefinition(form);
    if (!definition) return form;

    const merged = definition.map(field => {
      const savedField = field && savedByName[field.name];
      if (!savedField) return field;

      const userData = Array.isArray(savedField.userData)
        ? savedField.userData
        : [savedField.userData];
      const nextField = { ...field, userData: userData.map(value => String(value === null || value === undefined ? '' : value)) };

      if (Array.isArray(field.values)) {
        const selectedValues = userData.map(value => String(value));
        nextField.values = field.values.map(option => ({
          ...option,
          selected: selectedValues.indexOf(String(option && option.value)) >= 0
        }));
      }

      return nextField;
    });

    return { ...form, json: JSON.stringify(merged) };
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
    const incomeType = getTrimmedString(formValues.incomeType);
    const transitIncome = isTransitIncomeType(incomeType);
    const sourceExternal = transitIncome ? null : getTrimmedString(formValues.destination);
    const concept = collectionChargeVisible ? 'Aplicación de prima' : 'Ingreso Vario';

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
      concept: concept,
      transferWorkspaceId: Number(selectedCashierRow && selectedCashierRow.id),
      user: currentUserEmail
    };
  }

  function resolveNewIncomeDestinationAccount(formValues) {
    if (isTransitIncomeType(formValues && formValues.incomeType)) {
      const accountId = Number(formValues && formValues.destination);
      if (!Number.isFinite(accountId) || accountId <= 0) {
        return Promise.reject(new Error(t('Select a destination account.')));
      }

      return Promise.resolve(accountId);
    }

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
      const formValues = transitCollectionMode
        ? newIncomeForm.getFieldsValue()
        : await newIncomeForm.validateFields();
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
      const paymentConcept = getTrimmedString(createdTransfer.concept || entity.concept || 'Ingreso Vario');
      const paymentConceptLabel = getTrimmedString(selectedIncomeType && selectedIncomeType.label)
        || paymentConcept;
      clearNewIncomeForm();
      setCollectionChargeVisible(false);
      showNewIncomeExecutionConfirm({
        id: transferId,
        amount: paymentAmount,
        concept: paymentConcept,
        conceptLabel: paymentConceptLabel
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
          <div><strong>{t('Concept')}:</strong> {payment.conceptLabel || payment.concept || '-'}</div>
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

  async function executeAccountTransferPair(transfers) {
    const validTransfers = Array.isArray(transfers)
      ? transfers.filter(item => Number(item && item.id) > 0)
      : [];

    if (validTransfers.length !== 2) {
      message.error(t('Both account transfer movements are required.'));
      return;
    }

    try {
      setMovementActionId(validTransfers[0].id);
      for (let index = 0; index < validTransfers.length; index += 1) {
        const transferId = Number(validTransfers[index].id);
        const response = await exe('DoTransfer', {
          transferId: transferId,
          transfer: null
        });

        if (!response || response.ok === false) {
          throw new Error(response && response.msg
            ? response.msg
            : t('The account transfer movement could not be executed.'));
        }
      }

      message.success(t('The outgoing and incoming movements were executed successfully.'));
      loadMovements({ pagination: movementPagination });
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setMovementActionId(0);
    }
  }

  function showAccountTransferExecutionConfirm(transfers) {
    const validTransfers = Array.isArray(transfers)
      ? transfers.filter(item => Number(item && item.id) > 0)
      : [];

    if (validTransfers.length !== 2) {
      message.error(t('Both account transfer movements are required.'));
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
      title: t('Account transfer created'),
      content: (
        <div>
          <div>{t('The account transfer movements were created successfully.')}</div>
          <div style={{ marginTop: 8 }}>{t('Approval will execute both the outgoing and incoming movements.')}</div>
          <div>
            <strong>{t('Outgoing movement ID')}:</strong> {validTransfers[0].id}
            {' - '}
            {formatMoney(Math.abs(Number(validTransfers[0].amount) || 0))}
          </div>
          <div>
            <strong>{t('Incoming movement ID')}:</strong> {validTransfers[1].id}
            {' - '}
            {formatMoney(Math.abs(Number(validTransfers[1].amount) || 0))}
          </div>
          <div style={{ marginTop: 8 }}>{t('Do you want to execute both movements now?')}</div>
        </div>
      ),
      okText: t('Yes'),
      cancelText: t('No'),
      onOk: () => {
        openMovements();
        return executeAccountTransferPair(validTransfers);
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
    if (!config || config.loading || !config.form) return undefined;

    let cancelled = false;
    let attempts = 0;
    const retryTimers = [];
    const scheduleRetry = () => {
      const timer = setTimeout(render, 100);
      retryTimers.push(timer);
    };
    const render = () => {
      if (cancelled) return;

      if (typeof $ === 'undefined' || !$.fn || typeof $.fn.formRender !== 'function') {
        if (attempts < 10) {
          attempts += 1;
          scheduleRetry();
        }
        return;
      }

      const container = document.getElementById('cashier-income-type-form')
        || newIncomeTypeFormRef.current;
      if (!container) {
        if (attempts < 10) {
          attempts += 1;
          scheduleRetry();
        }
        return;
      }

      const formData = getDynamicFormDefinition(config.form);
      if (!formData) {
        setNewIncomeTypeDynamicForm(current => current && current.formId === config.formId
          ? { ...current, error: t('The income type form definition is invalid.') }
          : current);
        return;
      }

      container.innerHTML = '';
      $(container).formRender({ formData: formData });
      applyDynamicFormLayout(container);

      try {
        evalNewIncomeFormLogic(config.form.logic, { exe: exe });
      } catch (error) {
        message.error(error && error.message ? error.message : String(error));
      }
    };

    render();
    const initialTimer = setTimeout(render, 0);
    retryTimers.push(initialTimer);
    const modalTimer = setTimeout(render, 80);

    return () => {
      cancelled = true;
      retryTimers.forEach(timer => clearTimeout(timer));
      clearTimeout(modalTimer);
    };
  }, [newIncomeTypeDynamicForm, collectionChargeVisible, movementEditVisible]);

  React.useEffect(() => {
    ensureNewIncomeTypeFormLoaded();
  }, [collectionChargeVisible, incomeTypeOptions, newIncomeTypeCode, newIncomeTypeDynamicForm]);

  React.useEffect(() => {
    const config = reversalFormConfig;
    const container = document.getElementById('cashier-reversal-form') || reversalFormRef.current;

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
      const messageText = error && error.message ? error.message : String(error);
      setReversalFormConfig(current => current
        ? { ...current, error: messageText, loading: false }
        : current);
      message.error(messageText);
    }
  }, [reversalFormConfig]);

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

  function getDepositExpectedAmount(paymentMethod, currency) {
    const method = getTrimmedString(paymentMethod).toUpperCase();
    const selectedCurrency = getTrimmedString(currency).toUpperCase();
    const row = balanceRows.find(item =>
      (
        getTrimmedString(item && item.paymentMethodCode).toUpperCase() === method
        || getTrimmedString(item && item.paymentMethod).toUpperCase() === method
      )
      && getTrimmedString(item && item.currency).toUpperCase() === selectedCurrency
    );

    if (!row) return 0;

    const amount = getAuditNumber(row.amount);
    const deposit = getAuditNumber(row.deposit);
    const cashFund = getAuditNumber(row.assignedFund);

    // Deposits are returned with their accounting sign, so the available balance
    // must include the previous deposit and the assigned cash fund.
    return Math.max(0, amount + deposit + cashFund);
  }

  function getBalanceAvailableAmount(row) {
    const amount = getAuditNumber(row && row.amount);
    const deposit = getAuditNumber(row && row.deposit);
    const cashFund = getAuditNumber(row && row.assignedFund);
    return Math.max(0, amount + deposit + cashFund);
  }

  function getUniqueDepositRows(currency) {
    const selectedCurrency = getTrimmedString(currency).toUpperCase();

    return balanceRows
      .map(row => ({
        row: row,
        amount: getBalanceAvailableAmount(row),
        paymentMethod: getTrimmedString(row && (row.paymentMethodCode || row.paymentMethod))
      }))
      .filter(item => getTrimmedString(item.row && item.row.currency).toUpperCase() === selectedCurrency)
      .filter(item => item.amount > 0 && item.paymentMethod);
  }

  function getUniqueDepositExpectedAmount(currency) {
    return getUniqueDepositRows(currency).reduce((total, item) => total + item.amount, 0);
  }

  function openNewDepositModal() {
    const firstCurrency = currencyOptions[0] && currencyOptions[0].value;
    const expectedAmount = getUniqueDepositExpectedAmount(firstCurrency);

    depositForm.setFieldsValue({
      incomeType: undefined,
      uniqueDeposit: true,
      paymentMethod: undefined,
      currency: firstCurrency,
      amount: undefined,
      expectedAmount: expectedAmount,
      difference: expectedAmount,
      destination: undefined,
      reference: ''
    });
    setUniqueDeposit(true);
    setDepositExpectedAmount(expectedAmount);
    setDepositVisible(true);
  }

  function handleDepositValuesChange(changedValues, allValues) {
    const isUniqueDeposit = allValues && allValues.uniqueDeposit !== false;
    const expectedAmount = isUniqueDeposit
      ? getUniqueDepositExpectedAmount(allValues && allValues.currency)
      : getDepositExpectedAmount(allValues && allValues.paymentMethod, allValues && allValues.currency);
    const depositedAmount = getAuditNumber(allValues && allValues.amount);
    setDepositExpectedAmount(expectedAmount);
    depositForm.setFieldsValue({
      expectedAmount: expectedAmount,
      difference: expectedAmount - depositedAmount
    });
  }

  function updateDepositDifference(value) {
    const expectedAmount = getAuditNumber(depositForm.getFieldValue('expectedAmount'));
    depositForm.setFieldsValue({
      difference: expectedAmount - getAuditNumber(value)
    });
  }

  function useDepositExpectedAmount() {
    const expectedAmount = getAuditNumber(depositForm.getFieldValue('expectedAmount'));
    depositForm.setFieldsValue({
      amount: expectedAmount,
      difference: 0
    });
  }

  function handleUniqueDepositChange(event) {
    const checked = Boolean(event && event.target && event.target.checked);
    setUniqueDeposit(checked);
    const currency = depositForm.getFieldValue('currency');
    const paymentMethod = depositForm.getFieldValue('paymentMethod');
    const expectedAmount = checked
      ? getUniqueDepositExpectedAmount(currency)
      : getDepositExpectedAmount(paymentMethod, currency);
    const depositedAmount = getAuditNumber(depositForm.getFieldValue('amount'));
    setDepositExpectedAmount(expectedAmount);
    depositForm.setFieldsValue({
      uniqueDeposit: checked,
      paymentMethod: checked ? undefined : paymentMethod,
      expectedAmount: expectedAmount,
      difference: expectedAmount - depositedAmount
    });
  }

  function closeNewDepositModal() {
    if (depositSubmitting) return;
    setDepositVisible(false);
    depositForm.resetFields();
    setDepositExpectedAmount(0);
  }

  async function createDeposit(values) {
    if (depositSubmitting) return;
    setDepositSubmitting(true);

    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    const amount = getAuditNumber(values && values.amount);
    const isUniqueDeposit = values && values.uniqueDeposit !== false;

    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      message.warning(t('Select a cash desk first.'));
      setDepositSubmitting(false);
      return;
    }

    if (amount <= 0) {
      message.warning(t('Enter a deposited amount greater than zero.'));
      setDepositSubmitting(false);
      return;
    }

    const expectedAmount = getAuditNumber(values && values.expectedAmount);
    if (amount > expectedAmount + 0.01) {
      message.warning(t('The deposited amount cannot exceed the expected amount.'));
      setDepositSubmitting(false);
      return;
    }

    try {
      const destinationAccountId = Number(values && values.destination);
      if (!Number.isFinite(destinationAccountId) || destinationAccountId <= 0) {
        message.warning(t('Select a destination account.'));
        return;
      }

      const currency = getTrimmedString(values && values.currency);
      const incomeType = getTrimmedString(values && values.incomeType);
      const concept = getTrimmedString(values && values.reference);
      const depositRows = isUniqueDeposit
        ? getUniqueDepositRows(currency)
        : [{
          row: null,
          amount: getAuditNumber(values && values.expectedAmount),
          paymentMethod: getTrimmedString(values && values.paymentMethod)
        }];

      if (depositRows.length === 0) {
        message.warning(t('There are no balances available for the selected currency.'));
        setDepositSubmitting(false);
        return;
      }

      let remainingAmount = amount;
      const responses = [];

      for (const depositRow of depositRows) {
        if (remainingAmount <= 0) break;

        const rowAmount = isUniqueDeposit ? depositRow.amount : getAuditNumber(values && values.expectedAmount);
        const depositAmount = Math.min(remainingAmount, rowAmount);
        if (depositAmount <= 0) continue;

        const response = await exe('DepositCashierPayments', {
          workspaceId: workspaceId,
          incomeType: incomeType,
          paymentMethod: depositRow.paymentMethod,
          currency: currency,
          amountAtSight: depositAmount,
          amount: depositAmount,
          dif: rowAmount - depositAmount,
          destinationAccountId: destinationAccountId,
          concept: concept,
          externalSource: null
        });

        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The deposit could not be created.'));
        }

        responses.push(response);
        remainingAmount -= depositAmount;
      }

      if (remainingAmount > 0.01) {
        throw new Error(t('The deposited amount could not be fully distributed among the available balances.'));
      }

      message.success(
        isUniqueDeposit
          ? t('Deposits created successfully.')
          : (responses[0] && responses[0].msg) || t('Deposit created successfully.')
      );
      closeNewDepositModal();
      loadMovements({
        pagination: {
          current: 1,
          pageSize: movementPagination.pageSize
        }
      });
      loadCashDeskBalances();
      if (cashDeskAuditVisible) openCashDeskAudit();
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setDepositSubmitting(false);
    }
  }

  function closeCashDesk() {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);

    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      message.warning(t('Select an open cash desk before closing it.'));
      return;
    }

    if (selectedCashierRow && selectedCashierRow.closed) {
      message.warning(t('The selected cash desk is already closed.'));
      return;
    }

    setCloseCashDeskLoading(true);
    exe('CloseTransferWorkspace', { workspaceId: workspaceId })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg
            ? response.msg
            : t('The cash desk could not be closed.'));
        }

        message.success(response.msg || t('Cash desk closed successfully.'));
        handleReloadCashDesks();
      })
      .catch(error => {
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setCloseCashDeskLoading(false));
  }

  function getAuditNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function getAuditPaymentMethod(item) {
    const splitPayments = item && Array.isArray(item.SplitPayments) ? item.SplitPayments : [];
    const splitMethod = splitPayments[0] && (
      splitPayments[0].paymentMethodName ||
      splitPayments[0].paymentMethod ||
      splitPayments[0].PaymentMethod && splitPayments[0].PaymentMethod.name
    );
    return getTrimmedString(
      splitMethod ||
      item && item.paymentMethodName ||
      item && item.paymentMethod ||
      item && item.PaymentMethod && item.PaymentMethod.name
    ).toUpperCase();
  }

  function buildCashDeskAudit(rows, response) {
    const values = { cash: 0, cheque: 0, card: 0, other: 0, deposits: 0 };

    rows.forEach(row => {
      const items = Array.isArray(row && row.SplitPayments) && row.SplitPayments.length > 0
        ? row.SplitPayments
        : [row];

      items.forEach(item => {
        const amount = getAuditNumber(item && (item.amount !== undefined ? item.amount : row && row.amount));
        const method = getAuditPaymentMethod(item && item !== row ? item : row);

        if (method.indexOf('EFECT') >= 0 || method === 'EFE') values.cash += amount;
        else if (method.indexOf('CHEQ') >= 0 || method === 'CHE') values.cheque += amount;
        else if (method.indexOf('TARJ') >= 0 || method.indexOf('CRED') >= 0 || method === 'TC') values.card += amount;
        else values.other += amount;

        const concept = getTrimmedString(row && (row.concept || row.reference));
        if (/deposit|depósito|deposito/i.test(concept)) values.deposits += amount;
      });
    });

    const total = values.cash + values.cheque + values.card + values.other;
    const workspace = selectedCashierRow || {};
    const deposits = getAuditNumber(
      workspace.deposits !== undefined ? workspace.deposits :
        workspace.depositAmount !== undefined ? workspace.depositAmount : values.deposits
    );
    const endBalance = getAuditNumber(
      workspace.endBalance !== undefined ? workspace.endBalance :
        workspace.balance !== undefined ? workspace.balance : total - deposits
    );

    return {
      cash: values.cash,
      cheque: values.cheque,
      card: values.card,
      other: values.other,
      total: getAuditNumber(workspace.totalCash !== undefined ? workspace.totalCash : total),
      deposits: deposits,
      netIncome: total - deposits,
      endBalance: endBalance,
      currency: getTrimmedString(workspace.currency || response && response.currency || 'USD') || 'USD'
    };
  }

  function buildCashDeskAuditFromSummary(summary) {
    const values = { cash: 0, cheque: 0, card: 0, other: 0 };
    let total = 0;
    let deposits = 0;
    let cashFund = 0;
    let currency = 'USD';

    (Array.isArray(summary) ? summary : []).forEach(row => {
      const amount = getAuditNumber(row && row.amount);
      const method = getTrimmedString(row && (row.paymentMethodName || row.paymentMethod)).toUpperCase();
      currency = getTrimmedString(row && row.currency) || currency;
      total += amount;
      deposits += getAuditNumber(row && row.deposit);
      cashFund += getAuditNumber(row && row.cashFund);

      if (method.indexOf('EFECT') >= 0 || method === 'EFE') values.cash += amount;
      else if (method.indexOf('CHEQ') >= 0 || method === 'CHE') values.cheque += amount;
      else if (method.indexOf('TARJ') >= 0 || method.indexOf('CRED') >= 0 || method === 'TC') values.card += amount;
      else values.other += amount;
    });

    return {
      cash: values.cash,
      cheque: values.cheque,
      card: values.card,
      other: values.other,
      total: total,
      deposits: deposits,
      netIncome: total + deposits,
      endBalance: total + deposits + cashFund,
      currency: currency
    };
  }

  function openCashDeskAudit() {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      message.warning(t('Select a cash desk first.'));
      return;
    }

    setCashDeskAuditVisible(true);
    setCashDeskAuditLoading(true);
    exe('GetCashierIncomeSummary', { workspaceId: workspaceId })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Cash desk audit could not be loaded.'));
        }

        const summary = response.outData && Array.isArray(response.outData.summary)
          ? response.outData.summary
          : [];
        setCashDeskAudit(buildCashDeskAuditFromSummary(summary));
      })
      .catch(error => {
        setCashDeskAudit(null);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setCashDeskAuditLoading(false));
  }

  function getBalancePaymentMethod(item) {
    const splitPayments = item && Array.isArray(item.SplitPayments) ? item.SplitPayments : [];
    const payment = splitPayments[0] || item || {};
    return getTrimmedString(
      payment.paymentMethodName ||
      payment.paymentMethod ||
      payment.PaymentMethod && payment.PaymentMethod.name
    ).toUpperCase() || t('Other').toUpperCase();
  }

  function loadCashDeskBalances() {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      setBalanceRows([]);
      return;
    }

    setBalanceLoading(true);
    exe('GetCashierIncomeSummary', { workspaceId: workspaceId })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Balances could not be loaded.'));
        }

        const summary = response.outData && Array.isArray(response.outData.summary)
          ? response.outData.summary
          : [];

        setBalanceRows(summary.map((item, index) => ({
          key: getTrimmedString(item && item.code) || `balance-${index}`,
          paymentMethodCode: getTrimmedString(item && item.paymentMethod),
          paymentMethod: getTrimmedString(item && item.paymentMethodName) || getBalancePaymentMethod(item),
          currency: getTrimmedString(item && item.currency) || 'USD',
          assignedFund: getAuditNumber(item && item.cashFund),
          amount: getAuditNumber(item && item.amount),
          deposit: getAuditNumber(item && item.deposit),
          difference: getAuditNumber(item && item.dif)
        })));
      })
      .catch(error => {
        setBalanceRows([]);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setBalanceLoading(false));
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

    if (!hasCollectionFilters(filters)) {
      setCollectionRows([]);
      setCollectionTotal(0);
      setCollectionExecutionTime(0);
      return;
    }

    setCollectionLoading(true);
    const context = JSON.stringify({
      page: currentPage,
      size: pageSize,
      holderId: filters.holderId || null,
      lob: filters.lob || null,
      policyId: filters.policyId ? Number(filters.policyId) : null,
      policyCode: filters.policyCode || null,
      issuanceFrom: filters.issuanceFrom || null,
      issuanceTo: filters.issuanceTo || null,
      onlyOverdue: filters.onlyOverdue === true
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
        const executionTime = Number(response && response.texe);
        setCollectionRows(normalizeCollectionRows(rows));
        setCollectionTotal(Number.isFinite(total) && total >= 0 ? total : rows.length);
        setCollectionExecutionTime(Number.isFinite(executionTime) && executionTime >= 0 ? executionTime : 0);
        setCollectionPagination({ current: currentPage, pageSize: pageSize });
      })
      .catch(error => {
        setCollectionRows([]);
        setCollectionTotal(0);
        setCollectionExecutionTime(0);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setCollectionLoading(false));
  }

  function normalizeCollectionRows(rows) {
    return (Array.isArray(rows) ? rows : []).map(row => {
      const source = row || {};
      const policyId = Number(source.lifePolicyId || source.policyId || source.LifePolicyId || source.id || 0);
      return {
        ...source,
        lifePolicyId: Number.isFinite(policyId) && policyId > 0 ? policyId : 0,
        policyId: Number.isFinite(policyId) && policyId > 0 ? policyId : 0
      };
    });
  }

  function buildCollectionContext(filters, page, size) {
    const source = filters || {};
    return JSON.stringify({
      page: page,
      size: size,
      holderId: source.holderId || null,
      lob: source.lob || null,
      policyId: source.policyId ? Number(source.policyId) : null,
      policyCode: source.policyCode || null,
      issuanceFrom: source.issuanceFrom || null,
      issuanceTo: source.issuanceTo || null,
      onlyOverdue: source.onlyOverdue === true
    });
  }

  function hasCollectionFilters(filters) {
    const source = filters || {};
    return [
      source.holderId,
      source.lob,
      source.policyId,
      source.policyCode,
      source.issuanceFrom,
      source.issuanceTo
    ].some(value => value !== undefined && value !== null && String(value).trim() !== '')
      || source.onlyOverdue === true;
  }

  async function ensureCashierExcelLibrary() {
    if (typeof XLSX !== 'undefined') {
      return true;
    }

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

  async function exportPremiumCollections(exportType) {
    if (!hasCollectionFilters(collectionFilters)) {
      message.warning(t('Apply at least one premium filter before exporting.'));
      return;
    }

    setPremiumExportLoading(true);

    try {
      const requestedSize = Number(collectionTotal) > 0 ? Number(collectionTotal) : 10000;
      const response = await exe('ExeChain', {
        chain: 'cmdPremiumCollectionCashier',
        context: buildCollectionContext(collectionFilters, 1, requestedSize)
      });

      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('Premium collections could not be exported.'));
      }

      const result = response && response.outData && !Array.isArray(response.outData)
        ? response.outData
        : response;
      const sourceRows = Array.isArray(result && result.data) ? result.data : getRows(response);
      const rows = normalizeCollectionRows(sourceRows);

      if (rows.length === 0) {
        message.info(t('There are no records to export.'));
        return;
      }

      if (!await ensureCashierExcelLibrary()) {
        throw new Error(t('Excel export is not available.'));
      }

      const exportRows = exportType === 'remittance'
        ? rows.map(row => ({
          cnpoliza: row.poliza || '',
          ctenedor: row.holderId || '',
          crecibo: row.recibo || '',
          monto: Number(row.pendiente || 0)
        }))
        : rows.map(row => ({
          [t('Policy')]: row.poliza || '',
          [t('Receipt')]: row.recibo || '',
          [t('Year-Month')]: `${row.anio || ''}-${String(row.mes || '').padStart(2, '0')}`,
          [t('Line of business')]: row.ramo || '',
          [t('Payer')]: row.pagador || '',
          [t('Insured')]: row.asegurado || '',
          [t('Currency')]: row.moneda || '',
          [t('Billed')]: Number(row.facturado || 0),
          [t('Paid')]: Number(row.pagado || 0),
          [t('Overdue')]: Number(row.vencido || 0),
          [t('Pending')]: Number(row.pendiente || 0),
          [t('Issuance date')]: row.fechaEmision || '',
          [t('Pending installments')]: Array.isArray(row.Cuotas) ? row.Cuotas.length : 0
        }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, exportType === 'remittance' ? 'Remittance' : 'Premium detail');
      XLSX.writeFile(workbook, `premium-collections-${exportType}-${Date.now()}.xlsx`);
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setPremiumExportLoading(false);
    }
  }

  function applyCollectionFilters(values) {
    const source = values || {};
    const filters = {
      ...source,
      onlyOverdue: source.onlyOverdue === true,
      issuanceFrom: formatCollectionFilterDate(source.issuanceFrom),
      issuanceTo: formatCollectionFilterDate(source.issuanceTo)
    };

    const hasIssuanceFrom = Boolean(filters.issuanceFrom);
    const hasIssuanceTo = Boolean(filters.issuanceTo);
    if (hasIssuanceFrom !== hasIssuanceTo) {
      message.warning(t('Complete both issuance date filters.'));
      return;
    }

    if (hasIssuanceFrom && filters.issuanceFrom > filters.issuanceTo) {
      message.warning(t('The issuance start date cannot be later than the end date.'));
      return;
    }

    if (!hasCollectionFilters(filters)) {
      message.warning(t('Select at least one premium filter.'));
      return;
    }

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
    setCollectionExecutionTime(0);
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
    if (transitCollectionMode && transitCollectionPolicyRow) {
      return [transitCollectionPolicyRow];
    }

    const selectedKeys = collectionSelectedRowKeys.map(key => String(key));
    return collectionRows.filter(row => selectedKeys.indexOf(getCollectionRowKey(row)) >= 0);
  }

  function getCollectionSelectionSummary() {
    return getSelectedCollectionRows().reduce((summary, row) => ({
      count: summary.count + 1,
      overdue: summary.overdue + (Number(row && row.vencido) || 0),
      pending: summary.pending + (Number(row && row.pendiente) || 0)
    }), { count: 0, overdue: 0, pending: 0 });
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
    setTransitCollectionMode(false);
    setTransitCollectionAccount(null);
    setTransitCollectionPolicyRow(null);
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

  async function openTransitPremiumCollection() {
    const account = transitAccountRows.find(row =>
      Number(row && row.id) === Number(selectedTransitAccountId)
    );
    const policyId = Number(account && (account.lifePolicyId || account.policyId));
    const availableAmount = Number(getTransitAccountBalance(account).toFixed(2));

    if (!account || !Number.isFinite(policyId) || policyId <= 0) {
      message.warning(t('The selected transit account does not have a valid policy.'));
      return;
    }

    if (availableAmount <= 0) {
      message.warning(t('The selected transit account has no available balance.'));
      return;
    }

    try {
      const response = await exe('ExeChain', {
        chain: 'cmdPremiumCollectionCashier',
        context: JSON.stringify({ policyId: policyId, page: 1, size: 1, onlyOverdue: false })
      });
      const payload = response && response.outData && typeof response.outData === 'object'
        ? response.outData
        : {};
      const policyRows = Array.isArray(payload.data) ? payload.data : [];
      const policyRow = policyRows[0];

      if (!policyRow) {
        message.warning(t('The policy associated with the transit account has no pending premiums.'));
        return;
      }

      const policyPending = getCollectionPolicyPending(policyRow);
      const collectionAmount = Math.min(availableAmount, policyPending);
      if (collectionAmount <= 0) {
        message.warning(t('The policy associated with the transit account has no pending premiums.'));
        return;
      }

      clearNewIncomeForm();
      setTransitCollectionMode(true);
      setTransitCollectionAccount({ ...account, availableAmount: availableAmount });
      setTransitCollectionPolicyRow(policyRow);
      setCollectionChargeStep('payment');
      setCollectionPolicyRows([]);
      setCollectionSupplementaryRows([]);
      setCollectionExpectedAmount(collectionAmount);
      const transitPaymentKey = Date.now();
      setNewIncomePayments([{ key: transitPaymentKey, methodCode: 'OT', amount: collectionAmount.toFixed(2) }]);
      updateNewIncomePaymentMethod(transitPaymentKey, 'OT');

      const premiumIncomeType = incomeTypeOptions.find(item =>
        getTrimmedString(item && item.internalType).toUpperCase() === 'PREMIUM'
      );
      if (!premiumIncomeType) {
        message.error(t('The premium collection income type is not configured.'));
        return;
      }

      newIncomeForm.setFieldsValue({
        incomeType: premiumIncomeType.value,
        currency: getTrimmedString(account.currency) || 'USD'
      });
      updateNewIncomeType(premiumIncomeType.value);
      setCollectionChargeVisible(true);
    } catch (error) {
      message.error(error && error.message ? error.message : t('The policy premiums could not be loaded.'));
    }
  }

  function getCollectionPaymentAmount() {
    return Number(getNewIncomeTotal().toFixed(2));
  }

  function getCollectionPolicyPending(row) {
    const pending = Number(row && row.pendiente);
    return Number.isFinite(pending) && pending > 0 ? Number(pending.toFixed(2)) : 0;
  }

  function getCollectionPolicyOverdue(row) {
    const overdue = Number(row && row.vencido);
    return Number.isFinite(overdue) && overdue > 0 ? Number(overdue.toFixed(2)) : 0;
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

      return {
        key: getCollectionRowKey(row),
        policyId: getCollectionPolicyIdentifier(row),
        policy: getTrimmedString(row && row.poliza),
        pendingAmount: pendingAmount,
        overdueAmount: Math.min(getCollectionPolicyOverdue(row), pendingAmount),
        amount: 0,
        installments: Array.isArray(row && row.Cuotas) ? row.Cuotas : []
      };
    });

    // First apply the payment to each policy's overdue amount.
    policyRows.forEach(row => {
      const amount = Math.min(row.overdueAmount, Math.max(remainingAmount, 0));
      row.amount = Number(amount.toFixed(2));
      remainingAmount = Number((remainingAmount - amount).toFixed(2));
    });

    // If overdue amounts are fully covered, apply the remaining payment to the
    // unpaid balance before treating it as supplementary premium.
    policyRows.forEach(row => {
      const availablePending = Math.max(row.pendingAmount - row.amount, 0);
      const additionalAmount = Math.min(availablePending, Math.max(remainingAmount, 0));
      row.amount = Number((row.amount + additionalAmount).toFixed(2));
      remainingAmount = Number((remainingAmount - additionalAmount).toFixed(2));
    });

    const excessAmount = Number(Math.max(remainingAmount, 0).toFixed(2));
    const firstPolicy = policyRows[0];
    const supplementaryRows = !transitCollectionMode && excessAmount > 0 && firstPolicy
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
    if (!transitCollectionMode && !validateDynamicIncomeForms()) return;

    try {
      const formValues = transitCollectionMode
        ? newIncomeForm.getFieldsValue()
        : await newIncomeForm.validateFields();
      if (!getTrimmedString(formValues && formValues.incomeType)) {
        message.error(t('Select an income type.'));
        return;
      }

      if (getNewIncomeTotal() <= 0) {
        message.error(t('Enter at least one payment amount greater than zero.'));
        return;
      }

      if (transitCollectionMode) {
        const amount = getCollectionPaymentAmount();
        const availableAmount = Number(transitCollectionAccount && transitCollectionAccount.availableAmount) || 0;
        const policyPending = getCollectionPolicyPending(transitCollectionPolicyRow);

        if (amount > availableAmount + 0.01) {
          message.error(t('The amount cannot exceed the transit account balance.'));
          return;
        }

        if (amount > policyPending + 0.01) {
          message.error(t('The amount cannot exceed the pending premium of the policy.'));
          return;
        }
      }

      if (!transitCollectionMode && newIncomePayments.some(payment => !payment.methodCode || parseIncomeAmount(payment.amount) <= 0)) {
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
    const policyTotal = getCollectionPolicyTotal();
    const supplementaryExpected = getCollectionSupplementaryExpected();
    const supplementaryTotal = getCollectionSupplementaryTotal();
    const difference = Number((supplementaryExpected - supplementaryTotal).toFixed(2));
    const hasInvalidPolicyAmount = collectionPolicyRows.some(row =>
      Number(row && row.amount) > Number(row && row.pendingAmount) + 0.01
    );
    const transitAmount = Number(transitCollectionAccount && transitCollectionAccount.availableAmount) || 0;
    const transitValid = !transitCollectionMode
      || (paymentTotal <= transitAmount + 0.01 && Math.abs(policyTotal - paymentTotal) <= 0.01);

    return paymentTotal > 0
      && !hasInvalidPolicyAmount
      && Math.abs(difference) <= 0.01
      && transitValid;
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

    if (transitCollectionMode) {
      const transitAmount = Number(transitCollectionAccount && transitCollectionAccount.availableAmount) || 0;
      if (paymentTotal > transitAmount + 0.01) {
        message.error(t('The amount cannot exceed the transit account balance.'));
        return;
      }

      if (Math.abs(policyTotal - paymentTotal) > 0.01 || supplementaryTotal > 0) {
        message.error(t('The transit premium distribution must be applied entirely to the policy.'));
        return;
      }
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
      const formValues = transitCollectionMode
        ? newIncomeForm.getFieldsValue()
        : await newIncomeForm.validateFields();
      const destinationAccountId = transitCollectionMode
        ? 0
        : await resolveNewIncomeDestinationAccount(formValues);
      const transferEntity = getNewIncomeTransferEntity(
        formValues,
        transitCollectionMode ? 208 : destinationAccountId
      );

      setCollectionPaymentExecuting(true);
      const response = await exe('ExeChain', {
        chain: 'cmdPremiumsPayment',
        context: JSON.stringify({
          workspaceId: Number(selectedCashierRow && selectedCashierRow.id),
          currency: getTrimmedString(formValues && formValues.currency),
          amount: paymentTotal,
          payments: payments,
          supplementaryPayments: supplementaryPayments,
          sourceTransitAccountId: transitCollectionMode
            ? Number(transitCollectionAccount && transitCollectionAccount.id)
            : 0,
          transferEntity: transferEntity
        })
      });

      const result = response && response.outData && !Array.isArray(response.outData)
        ? response.outData
        : response;
      if (!result || result.ok === false) {
        throw new Error(result && result.msg ? result.msg : t('The premium payment could not be executed.'));
      }

      const refreshTransitAccounts = transitCollectionMode;
      message.success(t('Premium payment executed successfully.'));
      setCollectionChargeVisible(false);
      setCollectionChargeStep('payment');
      setCollectionPolicyRows([]);
      setCollectionSupplementaryRows([]);
      setCollectionSelectedRowKeys([]);
      setTransitCollectionMode(false);
      setTransitCollectionAccount(null);
      setTransitCollectionPolicyRow(null);
      clearNewIncomeForm();
      loadCollection({
        pagination: {
          current: 1,
          pageSize: collectionPagination.pageSize
        },
        filters: collectionFilters
      });

      if (refreshTransitAccounts) {
        setActiveTab('movements');
        loadMovements({
          pagination: {
            current: 1,
            pageSize: movementPagination.pageSize
          },
          filters: movementFilters
        });
        loadTransitAccounts({
          filters: transitAccountFilters,
          pagination: {
            current: transitAccountPagination.current,
            pageSize: transitAccountPagination.pageSize
          }
        });
      }
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
    if (transitCollectionMode) return 0;
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

    if (key === 'balances' && selectedCashierRow && selectedCashierRow.id) {
      loadCashDeskBalances();
    }

  }

  function selectCashDesk(record) {
    setSelectedCashierRow(record || null);
    setSelectedTransitAccountId(null);
    if (!record) {
      setActiveTab('cash-desks');
      setBalanceRows([]);
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

  async function handleMovementEditSave() {
    if (!movementEditRecord || !validateDynamicIncomeForms()) return;

    try {
      const formValues = await newIncomeForm.validateFields();
      if (!getTrimmedString(formValues.incomeType)) {
        message.error(t('Select an income type.'));
        return;
      }
      if (newIncomePayments.some(payment => !payment.methodCode || parseIncomeAmount(payment.amount) <= 0)) {
        message.error(t('Complete the payment method and amount for every payment.'));
        return;
      }

      const first = getMovementFirst(movementEditRecord);
      const destinationAccountId = await resolveNewIncomeDestinationAccount(formValues);
      const originalItem = getMovementEditableItem(movementEditRecord);
      const transferId = Number(movementEditRecord.id || first.id || originalItem.id || 0);
      const originalSplitPayments = Array.isArray(originalItem && originalItem.SplitPayments)
        ? originalItem.SplitPayments
        : [];
      const splitPayments = newIncomePayments.map((payment, index) => {
        const originalPayment = originalSplitPayments[index] || {};
        const paymentOption = paymentMethodOptions.find(option => option && option.value === payment.methodCode);
        const formId = getPaymentFormId(payment.methodCode);

        return {
          ...originalPayment,
          paymentMethod: payment.methodCode,
          paymentMethodName: paymentOption && paymentOption.label ? paymentOption.label : payment.methodCode,
          amount: parseIncomeAmount(payment.amount),
          currency: getTrimmedString(formValues.currency) || originalPayment.currency,
          formId: formId,
          jValues: formId > 0 ? getDynamicIncomeFormJson(payment.key) : null
        };
      });

      const entity = {
        id: transferId,
        currency: getTrimmedString(formValues.currency) || originalItem.currency,
        amount: getNewIncomeTotal(),
        SplitPayments: splitPayments,
        incomeType: originalItem.incomeType,
        sourceExternal: originalItem.sourceExternal,
        destinationAccountId: destinationAccountId,
        jIncomeTypeForm: getIncomeTypeFormJson(),
        concept: originalItem.concept,
        transferWorkspaceId: originalItem.transferWorkspaceId,
        isExternal: originalItem.isExternal
      };

      setMovementEditLoading(true);
      const response = await exe('RepoTransfer', {
        operation: 'UPDATE',
        entity: entity,
        execute: false
      });
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The movement could not be updated.'));
      }

      message.success(t('Movement updated successfully.'));
      closeMovementEdit();
      loadMovements({ pagination: movementPagination });
    } catch (error) {
      message.error(error && error.message ? error.message : t('The movement could not be updated.'));
    } finally {
      setMovementEditLoading(false);
    }
  }

  function getMovementEditableItem(group) {
    const items = [group].concat(getMovementChildren(group)).filter(item => item);
    return items.find(item => Array.isArray(item.SplitPayments) && item.SplitPayments.length > 0)
      || getMovementFirst(group);
  }

  function isPremiumMovement(group) {
    return [group].concat(getMovementChildren(group)).some(item =>
      getTrimmedString(item && item.transactionCode).toUpperCase() === 'PREMIUMPAY'
    );
  }

  function getMovementEditDestinationOption(item) {
    const account = item && item.DestinationAccount;
    const accountId = Number(item && item.destinationAccountId || account && (account.id || account.accountId) || 0);
    if (!Number.isFinite(accountId) || accountId <= 0) return null;

    const options = account ? mapTransitAccountOptions([{ ...account, id: accountId }]) : [];
    if (options.length > 0) return options[0];

    return {
      value: accountId,
      label: String(accountId),
      accountLabel: String(accountId),
      shortAccountLabel: String(accountId),
      account: account || { id: accountId }
    };
  }

  async function openMovementEdit(group) {
    const first = getMovementFirst(group);
    const transferId = Number(group && group.id || first.id || 0);
    const executed = Boolean((group && (group.executed || group.status)) || first.executed || first.status);

    if (!Number.isFinite(transferId) || transferId <= 0 || executed || isMovementReverted(group)) {
      message.warning(t('Only pending movements can be edited.'));
      return;
    }
    if (isPremiumMovement(group)) {
      message.warning(t('Premium payment movements cannot be edited.'));
      return;
    }

    const item = getMovementEditableItem(group);
    const splitPayments = Array.isArray(item && item.SplitPayments) ? item.SplitPayments : [];
    const incomeType = getTrimmedString(item && item.incomeType)
      || getTrimmedString(item && item.IncomeType && (item.IncomeType.code || item.IncomeType.value));
    const transitIncome = isTransitIncomeType(incomeType);
    const destinationOption = getMovementEditDestinationOption(item);
    const paymentRows = splitPayments.length > 0 ? splitPayments : [{ amount: item && item.amount }];

    clearNewIncomeForm();
    setMovementEditRecord(group);
    setNewIncomeTypeCode(incomeType || undefined);
    setNewIncomeDestinationAccountOptions(transitIncome && destinationOption ? [destinationOption] : []);
    newIncomeForm.setFieldsValue({
      incomeType: incomeType || undefined,
      destination: transitIncome
        ? (destinationOption ? destinationOption.value : undefined)
        : getTrimmedString(item && item.sourceExternal) || undefined,
      currency: getTrimmedString(item && item.currency) || 'USD'
    });
    setNewIncomePayments(paymentRows.map((payment, index) => ({
      key: `movement-${transferId}-${index}`,
      methodCode: getTrimmedString(payment && payment.paymentMethod),
      amount: limitIncomeAmountDecimals(payment && payment.amount) || ''
    })));
    setNewIncomeDynamicForms({});
    setNewIncomeTypeDynamicForm(null);
    setNewIncomeActiveFormKey(null);
    setMovementEditVisible(true);

    paymentRows.forEach((payment, index) => {
      const methodCode = getTrimmedString(payment && payment.paymentMethod);
      const formId = Number(payment && payment.formId) || getPaymentFormId(methodCode);
      if (formId > 0) {
        loadNewIncomeDynamicForm(`movement-${transferId}-${index}`, formId, payment && (payment.jValues || payment.jValue || payment.formValues));
      }
    });

    const incomeTypeFormId = getIncomeTypeFormId(incomeType);
    const savedIncomeTypeForm = item && item.jIncomeTypeForm;
    if (incomeTypeFormId > 0) {
      setNewIncomeTypeDynamicForm({ formId: incomeTypeFormId, form: null, loading: true, error: '' });
      try {
        const response = await exe('GetForms', { filter: `id=${incomeTypeFormId}` });
        if (!response || response.ok === false) throw new Error(response && response.msg ? response.msg : t('The income type form could not be loaded.'));
        const loadedForm = getRows(response)[0];
        if (!loadedForm) throw new Error(t('The income type form was not found.'));
        setNewIncomeTypeDynamicForm({
          formId: incomeTypeFormId,
          form: mergeDynamicFormValues(loadedForm, savedIncomeTypeForm),
          loading: false,
          error: ''
        });
      } catch (error) {
        setNewIncomeTypeDynamicForm({ formId: incomeTypeFormId, form: null, loading: false, error: error && error.message ? error.message : String(error) });
      }
    }
  }

  function closeMovementEdit() {
    setMovementEditVisible(false);
    setMovementEditRecord(null);
    clearNewIncomeForm();
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
    const premiumMovement = isPremiumMovement(group);

    return (
      <Space size={4} className="cashier-supervisor-movement-actions">
        {!executed && !reverted && !premiumMovement && (
          <Tooltip title={t('Edit movement')}>
            <Button
              type="link"
              size="small"
              aria-label={t('Edit movement')}
              onClick={() => openMovementEdit(group)}
              icon={<EditMovementIcon />}
            />
          </Tooltip>
        )}
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
            onClick={() => openReversalModal(group)}
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
        <Tooltip title={item.accNo || item.id}>
          {item.id > 0
            ? (
              <Button
                type="link"
                size="small"
                style={{
                  padding: 0,
                  height: 'auto',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  verticalAlign: 'bottom'
                }}
                onClick={() => window.open(`#/account/${item.id}`, '_blank', 'noopener,noreferrer')}
              >
                {item.accNo || item.id}
              </Button>
            )
            : (
              <span style={{
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'bottom'
              }}>
                {item.accNo}
              </span>
            )}
        </Tooltip>
      </div>
    ));
  }

  function renderMovementReference(group) {
    const reference = getTrimmedString(group && group.concept);
    if (!reference) return '-';

    return (
      <Tooltip title={reference}>
        <span style={{
          display: 'block',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: 'default'
        }}>
          {reference}
        </span>
      </Tooltip>
    );
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
    const filters = params.filters || movementFilters;
    const pageSize = Number(pagination && pagination.pageSize) || 15;
    const currentPage = Number(pagination && pagination.current) || 1;
    const transferId = Number(filters && filters.transferId);
    const rawAmount = filters && filters.amount;
    const hasAmount = rawAmount !== null && rawAmount !== undefined && rawAmount !== '';
    const amount = Number(rawAmount);
    const incomeType = getTrimmedString(filters && filters.incomeType);

    setMovementLoading(true);
    exe('FilterTransfer', {
      workspaceId: workspaceId,
      groupByAllocation: true,
      size: pageSize,
      page: Math.max(currentPage - 1, 0),
      currency: null,
      allocated: null,
      external: null,
      executed: filters && filters.pending === true ? false : null,
      concept: null,
      minAmount: hasAmount && Number.isFinite(amount) && amount >= 0 ? amount : null,
      maxAmount: hasAmount && Number.isFinite(amount) && amount >= 0 ? amount : null,
      month: null,
      claimPaymentId: null,
      allocationId: null,
      fromDate: null,
      toDate: null,
      id: Number.isInteger(transferId) && transferId > 0 ? transferId : null,
      paymentMethod: null,
      incomeType: incomeType || null
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Movements could not be loaded.'));
        }

        const allGroups = getRows(response);
        // FilterTransfer can return reverted records together with executed=false.
        // When the user requests pending movements, exclude them explicitly from the result.
        const groups = filters && filters.pending === true
          ? allGroups.filter(group => !isMovementReverted(group))
          : allGroups;
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
      filters: movementFilters,
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

  function getMovementAllocationId(group) {
    const first = getMovementFirst(group);
    const candidates = [
      group && group.allocationId,
      group && group.Allocation && group.Allocation.id,
      first && first.allocationId,
      first && first.Allocation && first.Allocation.id
    ];
    const allocationId = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return allocationId || 0;
  }

  function loadReversalCatalogs() {
    setReversalCatalogLoading(true);
    return Promise.all([
      exe('RepoTransferReversalCause', {
        operation: 'GET',
        entity: null,
        bulkJson: null,
        filter: null,
        include: null,
        size: 0,
        page: 0,
        showColumnsIfEmpty: false
      }),
      exe('RepoTransferReversalSubcause', {
        operation: 'GET',
        entity: null,
        bulkJson: null,
        filter: null,
        include: null,
        size: 0,
        page: 0,
        showColumnsIfEmpty: false
      })
    ])
      .then(results => {
        results.forEach(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Reversal options could not be loaded.'));
          }
        });

        setReversalCauses(getRows(results[0]));
        setReversalSubcauses(getRows(results[1]));
      })
      .finally(() => setReversalCatalogLoading(false));
  }

  function loadReversalCauseForm(causeCode) {
    const cause = reversalCauses.find(item => getTrimmedString(item && item.code) === getTrimmedString(causeCode));
    const formId = Number(cause && cause.formId);

    if (!Number.isFinite(formId) || formId <= 0) {
      setReversalFormConfig(null);
      return;
    }

    setReversalFormConfig({ formId: formId, form: null, loading: true, error: '' });
    exe('GetForms', { filter: `id=${formId}` })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The reversal form could not be loaded.'));
        }

        const form = getRows(response)[0];
        if (!form) {
          throw new Error(t('The reversal form was not found.'));
        }

        setReversalFormConfig({ formId: formId, form: form, loading: false, error: '' });
      })
      .catch(error => {
        const messageText = error && error.message ? error.message : String(error);
        setReversalFormConfig({ formId: formId, form: null, loading: false, error: messageText });
        message.error(messageText);
      });
  }

  function searchReversalAccounts(value) {
    const text = getTrimmedString(value);
    if (!text) {
      setReversalAccountOptions([]);
      return;
    }

    setReversalAccountLoading(true);
    exe('RepoAccount', {
      operation: 'GET',
      filter: `accNo LIKE N'%${escapeSqlString(text)}%'`,
      size: 10,
      page: 0
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Accounts could not be loaded.'));
        }

        setReversalAccountOptions(getRows(response).map(account => {
          const id = Number(account && account.id);
          const accNo = getTrimmedString(account && account.accNo);
          const name = getTrimmedString(account && account.name);
          return {
            value: id,
            label: name ? `${accNo} - ${name}` : accNo
          };
        }).filter(option => Number.isFinite(option.value) && option.value > 0));
      })
      .catch(error => {
        setReversalAccountOptions([]);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setReversalAccountLoading(false));
  }

  function openReversalModal(group) {
    const first = getMovementFirst(group);
    const executed = Boolean(first.executed || first.status);
    if (!executed || isMovementReverted(group)) {
      message.warning(t('Only executed and non-reverted movements can be reverted.'));
      return;
    }

    const allocationId = getMovementAllocationId(group);
    setReversalRecord({
      group: group,
      allocationId: allocationId > 0 ? allocationId : null
    });
    setReversalCause(undefined);
    setReversalSubcause(undefined);
    setReversalCreditFunds(false);
    setReversalAccountId(undefined);
    setReversalAccountOptions([]);
    setReversalFormConfig(null);
    setReversalVisible(true);
    loadReversalCatalogs().catch(error => {
      setReversalVisible(false);
      message.error(error && error.message ? error.message : String(error));
    });
  }

  function executeReversal() {
    const allocationIdValue = Number(reversalRecord && reversalRecord.allocationId);
    const allocationId = Number.isFinite(allocationIdValue) && allocationIdValue > 0
      ? allocationIdValue
      : null;
    const transferId = Number(reversalRecord && reversalRecord.group && reversalRecord.group.id);
    const cause = getTrimmedString(reversalCause);
    const subcause = getTrimmedString(reversalSubcause);

    if (!Number.isFinite(transferId) || transferId <= 0) {
      message.error(t('The movement identifier is invalid.'));
      return;
    }

    if (!cause) {
      message.warning(t('Select a reversal cause.'));
      return;
    }

    if (!subcause) {
      message.warning(t('Select a reversal subcause.'));
      return;
    }

    if (reversalFormConfig) {
      if (reversalFormConfig.loading) {
        message.warning(t('Please wait until the reversal form finishes loading.'));
        return;
      }

      if (reversalFormConfig.error) {
        message.error(reversalFormConfig.error);
        return;
      }

      const formDefinition = getDynamicFormDefinition(reversalFormConfig.form);
      const requiredFields = Array.isArray(formDefinition)
        ? formDefinition.filter(field => field && field.required && field.name)
        : [];
      const formContainer = document.getElementById('cashier-reversal-form') || reversalFormRef.current;
      const formValues = getDynamicFormValues(formContainer);
      const missingField = requiredFields.some(field => {
        const value = formValues[field.name];
        if (field.type === 'checkbox') return value !== true;
        if (Array.isArray(value)) return value.length === 0;
        return String(value === undefined || value === null ? '' : value).trim() === '';
      });

      if (missingField) {
        message.error(t('Complete the required fields in the reversal form.'));
        return;
      }
    }

    const accountId = Number(reversalAccountId);
    if (reversalCreditFunds && (!Number.isFinite(accountId) || accountId <= 0)) {
      message.warning(t('Select the account to credit.'));
      return;
    }

    setReversalLoading(true);
    const reversalCommand = allocationId > 0
      ? 'UnDoPaymentAllocation'
      : 'UndoTransfer';

    const reversalFormValues = reversalFormConfig
      ? getDynamicFormJson(reversalFormConfig, document.getElementById('cashier-reversal-form') || reversalFormRef.current)
      : null;

    const reversalPayload = reversalCommand === 'UnDoPaymentAllocation'
      ? {
          allocationId: allocationId,
          reversalCause: cause,
          reversalSubcause: subcause,
          jReversalFormValues: reversalFormValues
        }
      : {
          transferId: transferId,
          reversalCause: cause,
          reversalSubcause: subcause,
          jReversalFormValues: reversalFormValues,
          creditFundsToAccountId: reversalCreditFunds ? accountId : null,
          workspaceId: Number(selectedCashierRow && selectedCashierRow.id) || null,
          transferWorkspaceId: Number(selectedCashierRow && selectedCashierRow.id) || null
        };

    exe(reversalCommand, reversalPayload)
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The payment could not be reverted.'));
        }

        message.success(response.msg || t('Payment reverted successfully.'));
        setReversalVisible(false);
        setReversalRecord(null);
        loadMovements({ pagination: movementPagination });
      })
      .catch(error => message.error(error && error.message ? error.message : String(error)))
      .finally(() => setReversalLoading(false));
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
    const filter = buildTransferWorkspaceFilter(params.filters || transferFilters);
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
      filters: transferFilters,
      pagination: {
        current: 1,
        pageSize: transferPagination.pageSize
      }
    });
  }

  function handleTableChange(pagination) {
    loadTransferWorkspaces({
      filters: transferFilters,
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
    {
      title: t('Policy'),
      dataIndex: 'poliza',
      key: 'poliza',
      width: 150,
      render: (value, record) => {
        const policyId = Number(record && record.lifePolicyId);
        return Number.isFinite(policyId) && policyId > 0
          ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto' }}
              onClick={() => window.open(`#/lifepolicy/${policyId}`, '_blank', 'noopener,noreferrer')}
            >
              {value || policyId}
            </Button>
          )
          : (value || '-');
      }
    },
    { title: t('Receipt'), dataIndex: 'recibo', key: 'recibo', width: 100 },
    {
      title: t('Year-Month'),
      key: 'period',
      width: 100,
      align: 'center',
      render: (_, record) => `${record && record.anio ? record.anio : ''}-${String(record && record.mes ? record.mes : '').padStart(2, '0')}`
    },
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
      width: 145,
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

  const balanceColumns = [
    { title: t('Payment method'), dataIndex: 'paymentMethod', key: 'paymentMethod', width: 180 },
    { title: t('Currency'), dataIndex: 'currency', key: 'currency', width: 90, align: 'center' },
    { title: t('Assigned fund'), dataIndex: 'assignedFund', key: 'assignedFund', width: 130, align: 'right', render: formatMoney },
    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 130, align: 'right', render: formatMoney },
    { title: t('Deposit'), dataIndex: 'deposit', key: 'deposit', width: 120, align: 'right', render: formatMoney },
    {
      title: t('Difference'),
      dataIndex: 'difference',
      key: 'difference',
      width: 130,
      align: 'right',
      render: value => <span style={{ color: Number(value) < 0 ? '#ff4d4f' : undefined }}>{formatMoney(value)}</span>
    }
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
    { title: t('Date'), dataIndex: 'date', key: 'date', width: 105, render: formatDateIso },
    { title: t('Status'), key: 'status', width: 95, render: (_, group) => renderMovementStatus(group) },
    { title: t('Origin'), key: 'sourceExternal', width: 125, render: (_, group) => renderMovementOrigin(group) },
    { title: t('Destination'), key: 'destinationAccount', width: 190, render: (_, group) => renderMovementDestination(group) },
    { title: t('Reference'), key: 'concept', width: 150, render: (_, group) => renderMovementReference(group) },
    { title: t('Received'), dataIndex: 'amount', key: 'received', width: 110, align: 'right', render: formatMoney },
    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 110, align: 'right', render: formatMoney },
    { title: t('Currency'), dataIndex: 'currency', key: 'currency', width: 85, align: 'center' },
    { title: t('Payment method'), key: 'paymentMethod', width: 100, render: (_, group) => renderMovementPaymentMethods(group) },
    { title: t('Type'), key: 'incomeType', width: 190, render: (_, group) => renderMovementIncomeType(group) },
    { title: t('Policy'), key: 'lifePolicyId', width: 120, align: 'center', render: (value, record) => {
      const values = getPolicyValues(record);
      return values.length > 0
        ? <div style={{ fontSize: 11, lineHeight: 1.2 }}>
          {values.map((item, index) => {
          const policyId = Number(item);
          return (
            <div key={`${item}-${index}`}>
              {Number.isFinite(policyId) && policyId > 0
                ? (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto', fontSize: 11, lineHeight: 1.2 }}
                    onClick={() => window.open(`#/lifepolicy/${policyId}`, '_blank', 'noopener,noreferrer')}
                  >
                    {item}
                  </Button>
                )
                : item}
            </div>
          );
          })}
        </div>
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
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            disabled={!selectedCashierRow}
            onClick={openCashDeskAudit}
          >
            {t('View cash desk audit')}
          </Button>
        </div>
      </Card>
    );
  }

  const cashDeskTabContent = (
    <Card size="small">
      <div className="cashier-supervisor-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button type="primary" icon={<NewIcon />} onClick={openNewCashDeskModal}>
            {t('New')}
          </Button>
          <Popconfirm
            title={t('Close cash desk')}
            description={t('Are you sure you want to close the selected cash desk?')}
            okText={t('Yes')}
            cancelText={t('No')}
            onConfirm={closeCashDesk}
            disabled={!selectedCashierRow || Boolean(selectedCashierRow && selectedCashierRow.closed) || closeCashDeskLoading}
          >
            <Button
              type="danger"
              icon={<LockOutlined />}
              loading={closeCashDeskLoading}
              disabled={!selectedCashierRow || Boolean(selectedCashierRow && selectedCashierRow.closed)}
            >
              {t('Close')}
            </Button>
          </Popconfirm>
          <Button className="cashier-supervisor-outline-button" icon={<FileTextOutlined />} disabled={!selectedCashierRow}>
            {t('Cash count')}
          </Button>
        </Space>
        <Button className="cashier-supervisor-outline-button" icon={<FilterOutlined />} onClick={() => setTransferFilterVisible(true)}>
          {t('Filter')}
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

  const balancesTabContent = (
    <Card size="small">
      <div className="cashier-supervisor-toolbar cashier-supervisor-spaced-toolbar">
        <Button
          type="primary"
          icon={<NewIcon />}
          disabled={!selectedCashierRow}
          onClick={openNewDepositModal}
        >
          {t('New deposit')}
        </Button>
        <Button
          className="cashier-supervisor-outline-button"
          icon={<ReloadOutlined />}
          loading={balanceLoading}
          disabled={!selectedCashierRow}
          onClick={loadCashDeskBalances}
        >
          {t('Refresh')}
        </Button>
      </div>
      <Table
        rowKey="key"
        columns={balanceColumns}
        dataSource={balanceRows}
        size="small"
        bordered
        className="cashier-supervisor-table"
        loading={balanceLoading}
        pagination={false}
        scroll={{ x: 780, y: 420 }}
      />
    </Card>
  );

  const transitAccountColumns = [
    {
      title: t('Account'),
      dataIndex: 'accNo',
      key: 'accNo',
      width: 150,
      render: value => getTrimmedString(value) || '-'
    },
    {
      title: t('Name'),
      dataIndex: 'name',
      key: 'name',
      width: 210,
      render: value => getTrimmedString(value) || '-'
    },
    {
      title: t('Policy'),
      key: 'policy',
      width: 150,
      render: (_, record) => getTransitAccountLabel(record).policy
    },
    {
      title: t('Contact'),
      key: 'contact',
      width: 220,
      render: (_, record) => getTransitAccountLabel(record).contact
    },
    {
      title: t('Currency'),
      dataIndex: 'currency',
      key: 'currency',
      width: 100,
      align: 'center'
    },
    {
      title: t('Balance'),
      key: 'balance',
      width: 130,
      align: 'right',
      render: (_, record) => formatMoney(getTransitAccountBalance(record))
    },
    {
      title: t('Movements'),
      key: 'movementCount',
      width: 110,
      align: 'center',
      render: (_, record) => getTransitMovements(record).length
    }
  ];

  const transitPremiumsTabContent = (
    <Card size="small">
      <div className="cashier-supervisor-toolbar cashier-supervisor-spaced-toolbar">
        <Button type="primary" icon={<FilterOutlined />} onClick={() => setTransitFilterVisible(true)}>
          {t('Filter')}
        </Button>
        <Button
          className="cashier-supervisor-outline-button"
          icon={<RevertMovementIcon />}
          disabled={!transitHasSearched || !selectedTransitAccountId}
          onClick={openRefundMoneyModal}
        >
          {t('Return money')}
        </Button>
        <Button
          type="primary"
          icon={<PolicyIcon />}
          disabled={!transitHasSearched || !selectedTransitAccountId}
          onClick={openTransitPremiumCollection}
        >
          {t('Collect premium')}
        </Button>
        <Button className="cashier-supervisor-success-button" icon={<TransferAccountIcon />} onClick={openAccountTransferModal}>
          {t('Transfer between accounts')}
        </Button>
        <Button
          className="cashier-supervisor-outline-button"
          icon={<ReloadOutlined />}
          loading={transitAccountLoading}
          disabled={!transitHasSearched}
          onClick={() => loadTransitAccounts({
            filters: transitAccountFilters,
            pagination: { current: 1, pageSize: transitAccountPagination.pageSize }
          })}
        >
          {t('Refresh')}
        </Button>
      </div>
      <Table
        rowKey={record => String(record && record.id)}
        columns={transitAccountColumns}
        dataSource={transitAccountRows}
        size="small"
        bordered
        className="cashier-supervisor-table"
        loading={transitAccountLoading}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectedTransitAccountId ? [String(selectedTransitAccountId)] : [],
          onChange: keys => setSelectedTransitAccountId(keys.length > 0 ? String(keys[0]) : null)
        }}
        onRow={record => ({
          onClick: event => {
            if (event.target.closest('button, a, input, .ant-checkbox-wrapper, .ant-radio-wrapper')) return;
            setSelectedTransitAccountId(record && record.id !== undefined && record.id !== null
              ? String(record.id)
              : null);
          }
        })}
        pagination={{
          current: transitAccountPagination.current,
          pageSize: transitAccountPagination.pageSize,
          total: transitAccountTotal,
          showSizeChanger: true,
          pageSizeOptions: ['15', '25', '50', '100']
        }}
        onChange={handleTransitTableChange}
        scroll={{ x: 900, y: transferScrollY }}
        expandable={{
          rowExpandable: record => getTransitMovements(record).length > 0,
          expandedRowRender: record => {
            const movements = getTransitMovements(record);
            const accountId = Number(record && record.id) || 0;
            const page = getTransitDetailPage(accountId, movements.length);
            const start = (page.current - 1) * page.pageSize;
            const detailRows = movements.slice(start, start + page.pageSize);

            return (
              <div className="cashier-supervisor-transit-detail">
                <Table
                  rowKey={item => String(item && item.id)}
                  size="small"
                  bordered
                  pagination={{
                    current: page.current,
                    pageSize: page.pageSize,
                    total: page.total,
                    showSizeChanger: false,
                    onChange: nextPage => setTransitDetailPage(accountId, nextPage)
                  }}
                  columns={[
                    { title: t('Movement ID'), dataIndex: 'id', key: 'id', width: 120, align: 'center' },
                    { title: t('Date'), dataIndex: 'date', key: 'date', width: 180, align: 'center', render: value => formatDate(value) },
                    { title: t('Transaction'), dataIndex: 'transaction', key: 'transaction' },
                    { title: t('Transaction code'), dataIndex: 'transactionCode', key: 'transactionCode', width: 220 },
                    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 130, align: 'right', render: value => formatMoney(value) }
                  ]}
                  dataSource={detailRows}
                  className="cashier-supervisor-transit-detail"
                />
              </div>
            );
          }
        }}
      />
    </Card>
  );

  const premiumCollectionSelectionSummary = getCollectionSelectionSummary();

  const premiumCollectionTabContent = (
    <Spin className="cashier-supervisor-premium-spin" spinning={premiumExportLoading} tip={t('Exporting...')}>
      <Card size="small">
      <div className="cashier-supervisor-toolbar cashier-supervisor-premium-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button type="primary" icon={<FilterOutlined />} onClick={() => setCollectionFilterVisible(true)}>
            {t('Filter')}
          </Button>
          <Button
            className="cashier-supervisor-premium-pay-button"
            type="primary"
            onClick={openCollectionCharge}
            disabled={collectionSelectedRowKeys.length === 0}
          >
            {t('Collect')}
          </Button>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'detail',
                  label: t('Export detail'),
                  onClick: () => exportPremiumCollections('detail')
                },
                {
                  key: 'remittance',
                  label: t('Remittance format'),
                  onClick: () => exportPremiumCollections('remittance')
                }
              ]
            }}
          >
            <Button className="cashier-supervisor-outline-button" icon={<DownloadOutlined />} loading={premiumExportLoading} disabled={premiumExportLoading}>
              {t('Export')}
            </Button>
          </Dropdown>
        </Space>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', color: '#595959', fontSize: 12 }}>
          <span>{t('Selected')}: <strong>{premiumCollectionSelectionSummary.count}</strong></span>
          <span style={{ color: '#1677ff' }}>{t('Overdue')}: <strong>{formatMoney(premiumCollectionSelectionSummary.overdue)}</strong></span>
          <span style={{ color: '#cf1322' }}>{t('Pending')}: <strong>{formatMoney(premiumCollectionSelectionSummary.pending)}</strong></span>
        </div>
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
          pageSizeOptions: ['15', '25', '50', '100'],
          showTotal: total => (
            <span className="cashier-supervisor-pagination-summary">
              {t('Total records')}: {total} | {t('Time')}: {collectionExecutionTime.toFixed(2)} {t('milliseconds')}
            </span>
          )
        }}
        onChange={handleCollectionTableChange}
        scroll={{ x: 1500, y: transferScrollY }}
      />
      </Card>
    </Spin>
  );

  const movementsTabContent = (
    <Card size="small">
      <div className="cashier-supervisor-toolbar cashier-supervisor-spaced-toolbar">
        <Button
          className="cashier-supervisor-outline-button"
          icon={<FilterOutlined />}
          onClick={() => setMovementFilterVisible(true)}
          disabled={!selectedCashierRow}
        >
          {t('Filter')}
        </Button>
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
          <Button className="cashier-supervisor-outline-button" icon={<FileTextOutlined />} disabled={!selectedCashierRow || cashierReports.length === 0}>
            {t('Reports')}
          </Button>
        </Dropdown>
        <Button
          className="cashier-supervisor-outline-button"
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
    const difference = transitCollectionMode
      ? Number((paymentTotal - policyTotal).toFixed(2))
      : Number((expectedSupplementary - supplementaryTotal).toFixed(2));
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
        {!transitCollectionMode && (
          <>
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
          </>
        )}
        <div className="cashier-supervisor-collection-allocation-summary">
          <div><strong>{t('Payment total')}:</strong> {formatMoney(paymentTotal)}</div>
          <div><strong>{t('Premiums')}:</strong> {formatMoney(policyTotal)}</div>
          {!transitCollectionMode && (
            <>
              <div><strong>{t('Complementary expected')}:</strong> {formatMoney(expectedSupplementary)}</div>
              <div><strong>{t('Complementary assigned')}:</strong> {formatMoney(supplementaryTotal)}</div>
            </>
          )}
          <div className={difference === 0 ? '' : 'cashier-supervisor-collection-allocation-error'}>
            <strong>{t('Difference')}:</strong> {formatMoney(difference)}
          </div>
        </div>
      </Card>
    );
  };

  const renderNewIncomeContent = (collectionMode, editMode) => (
    <Card size="small" className="cashier-supervisor-new-income-card">
      <div className="cashier-supervisor-new-income-actions">
        <Button
          type="primary"
          icon={<ExecuteMovementIcon />}
          loading={editMode ? movementEditLoading : false}
          onClick={collectionMode ? handleCollectionNext : (editMode ? handleMovementEditSave : handleNewIncomeExecute)}
        >
          {t(collectionMode ? 'Next' : (editMode ? 'Save' : 'Execute'))}
        </Button>
        {!collectionMode && (
          <Button
            className="cashier-supervisor-outline-button"
            icon={<ClearOutlined />}
            onClick={editMode ? closeMovementEdit : clearNewIncomeForm}
          >
            {t(editMode ? 'Cancel' : 'Clear')}
          </Button>
        )}
      </div>

      <div className="cashier-supervisor-new-income-columns">
        <div className="cashier-supervisor-new-income-form">
        <div className="cashier-supervisor-section-title">{t('Payment method(s)')}</div>
        {transitCollectionMode ? (
          <div className="cashier-supervisor-payment-entry">
            <div className="cashier-supervisor-payment-method-row">
              <Select
                value="OT"
                options={paymentMethodOptions.filter(option => option && option.value === 'OT')}
                disabled
              />
              <Input
                value={newIncomePayments[0] && newIncomePayments[0].amount}
                prefix="$"
                inputMode="decimal"
                onChange={event => {
                  const nextValue = limitIncomeAmountDecimals(event && event.target ? event.target.value : '');
                  if (nextValue !== null) {
                    updateNewIncomePayment(newIncomePayments[0].key, 'amount', nextValue);
                  }
                }}
              />
            </div>
          </div>
        ) : newIncomePayments.map(payment => (
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
                onChange={event => {
                  const nextValue = limitIncomeAmountDecimals(event && event.target ? event.target.value : '');
                  if (nextValue !== null) {
                    updateNewIncomePayment(payment.key, 'amount', nextValue);
                  }
                }}
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
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) => getTrimmedString(option && option.label).toLowerCase().indexOf(getTrimmedString(input).toLowerCase()) >= 0}
              options={collectionChargeVisible
                ? incomeTypeOptions.filter(isVisibleNewIncomeType)
                : incomeTypeOptions.filter(item =>
                  getTrimmedString(item && item.internalType).toUpperCase() !== 'PREMIUM'
                  && isVisibleNewIncomeType(item)
                )}
              disabled={collectionChargeVisible || editMode}
              onChange={updateNewIncomeType}
            />
          </Form.Item>
          <Form.Item
            label={t('Destination')}
            required
          >
            {isTransitIncomeType(newIncomeTypeCode)
              ? (
                <Input.Group compact style={{ display: 'flex', width: '100%' }}>
                  <Form.Item
                    name="destination"
                    noStyle
                    rules={[{ required: true, message: t('Please select an account.') }]}
                  >
                    <Select
                      showSearch
                      allowClear
                      filterOption={false}
                      optionLabelProp="accountLabel"
                      placeholder={t('Search account')}
                      style={{ width: 'calc(100% - 40px)' }}
                      options={newIncomeDestinationAccountOptions}
                      loading={newIncomeDestinationAccountLoading}
                      onSearch={searchNewIncomeDestinationAccounts}
                      notFoundContent={newIncomeDestinationAccountLoading ? t('Loading...') : null}
                    />
                  </Form.Item>
                  <Button
                    icon={<InstallmentsIcon />}
                    aria-label={t('Search accounts')}
                    onClick={() => openNewIncomeAccountSearch('newIncomeDestination')}
                    style={{ width: 40 }}
                  />
                </Input.Group>
              )
              : (
                <Form.Item
                  name="destination"
                  noStyle
                  rules={[{ required: true, message: t('Please select a destination.') }]}
                >
                  <Select
                    placeholder={t('External source')}
                    style={{ width: '100%' }}
                    options={externalSourceOptions}
                  />
                </Form.Item>
              )}
          </Form.Item>
          <Form.Item
            label={t('Currency')}
            required
            name="currency"
          >
            <Select
              style={{ width: '100%' }}
              options={currencyOptions}
              disabled={Boolean(editMode)}
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

          <div
            className={`cashier-supervisor-center${activeTab === 'new-income' ? ' cashier-supervisor-center-new-income' : ''}`}
            ref={mainViewportRef}
          >
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
              <PolicyIcon /> {t('Premium collections')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'new-income'}
              disabled={!selectedCashierRow}
              className={`cashier-supervisor-tab${activeTab === 'new-income' ? ' active' : ''}`}
              onClick={() => handleTabChange('new-income')}
            >
              <NewIncomeIcon /> {t('New income')}
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
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'transit-premiums'}
              disabled={!selectedCashierRow}
              className={`cashier-supervisor-tab${activeTab === 'transit-premiums' ? ' active' : ''}`}
              onClick={() => handleTabChange('transit-premiums')}
            >
              <PremiumIcon /> {t('Transit premiums')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'balances'}
              disabled={!selectedCashierRow}
              className={`cashier-supervisor-tab${activeTab === 'balances' ? ' active' : ''}`}
              onClick={() => handleTabChange('balances')}
            >
              <BalanceIcon /> {t('Balances')}
            </button>
          </div>
          <div
            className={`cashier-supervisor-tab-content${activeTab === 'premiums'
              ? ' cashier-supervisor-tab-content-premiums'
              : activeTab === 'new-income'
                ? ' cashier-supervisor-tab-content-new-income'
                : ''}`}
            role="tabpanel"
          >
            {activeTab === 'premiums'
              ? premiumCollectionTabContent
              : activeTab === 'new-income'
                ? renderNewIncomeContent()
                : activeTab === 'movements'
                  ? movementsTabContent
                  : activeTab === 'balances'
                    ? balancesTabContent
                    : activeTab === 'transit-premiums'
                      ? transitPremiumsTabContent
                    : cashDeskTabContent}
          </div>
            </div>
          </div>
        </Layout>

        <Drawer
          title={t('Cash desk audit')}
          placement="right"
          width={360}
          open={cashDeskAuditVisible}
          onClose={() => setCashDeskAuditVisible(false)}
          destroyOnClose={false}
        >
          {cashDeskAuditLoading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>{t('Loading...')}</div>
          ) : cashDeskAudit ? (
            <div className="cashier-supervisor-audit-summary">
              <div className="cashier-supervisor-audit-currency">{cashDeskAudit.currency}</div>
              <div className="cashier-supervisor-audit-row"><span>{t('Cash')}</span><strong>{formatMoney(cashDeskAudit.cash)}</strong></div>
              <div className="cashier-supervisor-audit-row"><span>{t('Cheque')}</span><strong>{formatMoney(cashDeskAudit.cheque)}</strong></div>
              <div className="cashier-supervisor-audit-row"><span>{t('Card')}</span><strong>{formatMoney(cashDeskAudit.card)}</strong></div>
              <div className="cashier-supervisor-audit-row"><span>{t('Other')}</span><strong>{formatMoney(cashDeskAudit.other)}</strong></div>
              <div className="cashier-supervisor-audit-row cashier-supervisor-audit-total"><span>{t('Cash desk total')}</span><strong>{formatMoney(cashDeskAudit.total)}</strong></div>
              <div className="cashier-supervisor-audit-spacer"></div>
              <div className="cashier-supervisor-audit-row"><span>{t('Deposits')}</span><strong>{formatMoney(cashDeskAudit.deposits)}</strong></div>
              <div className="cashier-supervisor-audit-row"><span>{t('Net income')}</span><strong>{formatMoney(cashDeskAudit.netIncome)}</strong></div>
              <div className="cashier-supervisor-audit-row cashier-supervisor-audit-total"><span>{t('End balance')}</span><strong>{formatMoney(cashDeskAudit.endBalance)}</strong></div>
            </div>
          ) : (
            <div style={{ padding: 12 }}>{t('No audit information available.')}</div>
          )}
        </Drawer>

        <Modal
          title={t('Reversal details')}
          open={reversalVisible}
          onCancel={() => setReversalVisible(false)}
          onOk={executeReversal}
          okText={t('Reverse')}
          cancelText={t('Cancel')}
          okButtonProps={{ danger: true, loading: reversalLoading }}
          confirmLoading={reversalLoading || reversalCatalogLoading}
          destroyOnClose={false}
        >
          <Form layout="vertical">
            <Form.Item label={t('Cause')} required>
              <Select
                value={reversalCause}
                loading={reversalCatalogLoading}
                placeholder={t('Please select the reversal cause')}
                options={reversalCauses.map(cause => ({
                  value: cause && cause.code,
                  label: cause && cause.name
                }))}
                onChange={value => {
                  setReversalCause(value);
                  setReversalSubcause(undefined);
                  loadReversalCauseForm(value);
                }}
              />
            </Form.Item>
            <Form.Item label={t('Subcause')} required>
              <Select
                value={reversalSubcause}
                disabled={!reversalCause}
                loading={reversalCatalogLoading}
                placeholder={t('Please select the reversal subcause')}
                options={reversalSubcauses
                  .filter(item => getTrimmedString(item && item.causeCode) === getTrimmedString(reversalCause))
                  .map(item => ({
                    value: item && item.code,
                    label: item && item.name
                  }))}
                onChange={setReversalSubcause}
              />
            </Form.Item>
            {reversalFormConfig && (
              <div className="cashier-supervisor-dynamic-form-card">
                {reversalFormConfig.loading && <div>{t('Loading form...')}</div>}
                {reversalFormConfig.error && (
                  <div className="cashier-supervisor-dynamic-form-error">
                    {reversalFormConfig.error}
                  </div>
                )}
                <form id="cashier-reversal-form" ref={reversalFormRef} />
              </div>
            )}
            <Form.Item label={t('Options')}>
              <Checkbox
                checked={reversalCreditFunds}
                onChange={event => {
                  const checked = Boolean(event.target.checked);
                  setReversalCreditFunds(checked);
                  if (!checked) {
                    setReversalAccountId(undefined);
                    setReversalAccountOptions([]);
                  }
                }}
              >
                {t('Credit funds to the account')}
              </Checkbox>
            </Form.Item>
            {reversalCreditFunds && (
              <Form.Item label={t('Account')} required>
                <Select
                  showSearch
                  allowClear
                  filterOption={false}
                  value={reversalAccountId}
                  options={reversalAccountOptions}
                  loading={reversalAccountLoading}
                  placeholder={t('Type to search account')}
                  onSearch={searchReversalAccounts}
                  onChange={setReversalAccountId}
                  notFoundContent={t('No accounts found')}
                />
              </Form.Item>
            )}
          </Form>
        </Modal>

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
          title={t('Deposit')}
          open={depositVisible}
          onCancel={closeNewDepositModal}
          onOk={() => depositForm.submit()}
          okText={t('Deposit')}
          cancelText={t('Cancel')}
          confirmLoading={depositSubmitting}
          maskClosable={!depositSubmitting}
          closable={!depositSubmitting}
          destroyOnClose={false}
        >
          <Spin spinning={depositSubmitting} tip={t('Processing deposit...')}>
            <Form
              form={depositForm}
              layout="vertical"
              onValuesChange={handleDepositValuesChange}
              onFinish={createDeposit}
            >
            <Space align="center" size={16} style={{ display: 'flex', marginBottom: 8 }}>
              <span>{t('Payment method')}</span>
              <Form.Item name="uniqueDeposit" valuePropName="checked" noStyle>
                <Checkbox onChange={handleUniqueDepositChange}>
                  {t('Single deposit')}
                </Checkbox>
              </Form.Item>
            </Space>

            {!uniqueDeposit && (
              <Form.Item
                name="paymentMethod"
                rules={[{ required: true, message: t('Select a payment method.') }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('Payment method')}
                  options={paymentMethodOptions}
                />
              </Form.Item>
            )}

            <Form.Item
              label={t('Currency')}
              name="currency"
              rules={[{ required: true, message: t('Select a currency.') }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder={t('Currency')}
                options={currencyOptions}
              />
            </Form.Item>

            <Form.Item
              label={t('Deposited amount')}
              name="amount"
              rules={[{ required: true, message: t('Enter the deposited amount.') }]}
            >
              <InputNumber
                min={0}
                max={depositExpectedAmount}
                precision={2}
                style={{ width: '100%' }}
                onChange={updateDepositDifference}
                addonAfter={(
                  <Tooltip title={t('Use the total expected amount')}>
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={useDepositExpectedAmount}
                    />
                  </Tooltip>
                )}
              />
            </Form.Item>

            <Space size={12} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Form.Item label={t('Expected amount')} name="expectedAmount" style={{ flex: 1 }}>
                <InputNumber disabled precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label={t('Difference')} name="difference" style={{ flex: 1 }}>
                <InputNumber
                  disabled
                  precision={2}
                  style={{
                    width: '100%',
                    color: Math.abs(getAuditNumber(depositForm.getFieldValue('difference'))) < 0.01 ? '#52c41a' : undefined
                  }}
                />
              </Form.Item>
            </Space>

            <Form.Item
              label={t('Income type')}
              name="incomeType"
              rules={[{ required: true, message: t('Select an income type.') }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder={t('Select an income type')}
                options={getDepositIncomeTypeOptions()}
                onChange={updateDepositIncomeType}
              />
            </Form.Item>

            <Form.Item
              label={t('Destination')}
              name="destination"
              rules={[{ required: true, message: t('Select a destination.') }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder={t('Select an account')}
                options={depositAccountOptions}
              />
            </Form.Item>

            <Form.Item label={t('Reference')} name="reference">
              <Input />
            </Form.Item>
            </Form>
          </Spin>
        </Modal>

        <Modal
          title={t('Money withdrawal request')}
          open={refundMoneyVisible}
          onCancel={closeRefundMoneyModal}
          onOk={() => refundMoneyForm.submit()}
          okText={t('Request')}
          cancelText={t('Cancel')}
          destroyOnClose={false}
        >
          <Form
            form={refundMoneyForm}
            layout="vertical"
            onFinish={submitRefundMoneyRequest}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                label={t('Currency')}
                name="currency"
                rules={[{ required: true, message: t('Select a currency.') }]}
              >
                <Select disabled options={currencyOptions} placeholder={t('Currency')} />
              </Form.Item>

              <Form.Item
                label={t('Source account')}
                name="sourceAccount"
                rules={[{ required: true, message: t('Select a source account.') }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={getTransitSourceAccountOptions()}
                  placeholder={t('Source account')}
                  notFoundContent={t('Search and select a transit account first.')}
                />
              </Form.Item>

              <Form.Item
                label={t('Amount')}
                name="amount"
                rules={[{ required: true, message: t('Enter an amount.') }]}
              >
                <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label={t('Source account percentage')} name="sourcePercentage">
                <Slider min={0} max={100} tooltip={{ formatter: value => `${value}%` }} />
              </Form.Item>
            </div>

            <Form.Item
              label={t('Payment method')}
              name="paymentMethod"
              rules={[{ required: true, message: t('Select a payment method.') }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={paymentMethodOptions}
                placeholder={t('Payment method')}
              />
            </Form.Item>

            <Form.Item
              label={t('Beneficiary')}
              name="beneficiary"
              rules={[{ required: true, message: t('Enter a beneficiary.') }]}
            >
              <Input disabled />
            </Form.Item>

            <Form.Item label={t('Reference')} name="reference">
              <Input />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('Manual account transfer')}
          open={accountTransferVisible}
          onCancel={closeAccountTransferModal}
          onOk={() => accountTransferForm.submit()}
          okText={t('Execute')}
          cancelText={t('Cancel')}
          destroyOnClose={false}
          width={900}
        >
          <Form
            form={accountTransferForm}
            layout="vertical"
            onFinish={submitAccountTransfer}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div className="cashier-supervisor-section-title">{t('Source information')}</div>
                <Form.Item
                  label={t('Currency')}
                  name="currency"
                  rules={[{ required: true, message: t('Select a currency.') }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={currencyOptions}
                    placeholder={t('Currency')}
                    onChange={handleAccountTransferCurrencyChange}
                  />
                </Form.Item>
                <Form.Item
                  label={t('Amount')}
                  name="amount"
                  rules={[{ required: true, message: t('Enter an amount.') }]}
                >
                  <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  label={t('Reference')}
                  name="reference"
                  rules={[{ required: true, message: t('Enter a reference.') }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item shouldUpdate>
                  {() => {
                    const availableBalance = getAccountTransferSourceBalance();
                    const transferAmount = Number(accountTransferAmount);
                    const safeTransferAmount = Number.isFinite(transferAmount) ? transferAmount : 0;
                    const finalBalance = availableBalance - safeTransferAmount;
                    const renderSummaryAmount = amount => (
                      <strong style={{ color: amount < 0 ? '#cf1322' : undefined }}>
                        {formatMoney(amount)}
                      </strong>
                    );

                    return (
                      <div className="cashier-supervisor-account-transfer-summary">
                        <div><span>{t('Available balance')}: </span>{renderSummaryAmount(availableBalance)}</div>
                        <div><span>{t('Amount to transfer')}: </span>{renderSummaryAmount(safeTransferAmount)}</div>
                        <div><span>{t('Final balance')}: </span>{renderSummaryAmount(finalBalance)}</div>
                      </div>
                    );
                  }}
                </Form.Item>
                {/* External source is kept disabled until its transfer flow is defined. */}
              </div>

              <div>
                <div className="cashier-supervisor-section-title">{t('Account information')}</div>
                <Form.Item
                  label={t('Source account')}
                >
                  <Input.Group compact style={{ display: 'flex', width: '100%' }}>
                    <Form.Item
                      name="sourceAccount"
                      noStyle
                      rules={[{ required: true, message: t('Select a source account.') }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        filterOption={false}
                        optionFilterProp="label"
                        optionLabelProp="shortAccountLabel"
                        options={accountTransferAccountOptions}
                        loading={accountTransferAccountLoading}
                        placeholder={t('Type to search account')}
                        onSearch={searchAccountTransferAccounts}
                        onChange={value => updateAccountTransferContact('sourceAccount', value)}
                        notFoundContent={accountTransferAccountLoading ? t('Loading...') : t('Type to search account')}
                        style={{ width: 'calc(100% - 40px)' }}
                      />
                    </Form.Item>
                    <Button
                      icon={<InstallmentsIcon />}
                      aria-label={t('Search accounts')}
                      onClick={() => openNewIncomeAccountSearch('sourceAccount')}
                      style={{ width: 40 }}
                    />
                  </Input.Group>
                </Form.Item>
                <Form.Item label={t('Source name')} name="sourceName">
                  <Input />
                </Form.Item>
                <Form.Item
                  label={t('Destination account')}
                >
                  <Input.Group compact style={{ display: 'flex', width: '100%' }}>
                    <Form.Item
                      name="destinationAccount"
                      noStyle
                      rules={[{ required: true, message: t('Select a destination account.') }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        filterOption={false}
                        optionFilterProp="label"
                        optionLabelProp="shortAccountLabel"
                        options={accountTransferAccountOptions}
                        loading={accountTransferAccountLoading}
                        placeholder={t('Type to search account')}
                        onSearch={searchAccountTransferAccounts}
                        onChange={value => updateAccountTransferContact('destinationAccount', value)}
                        notFoundContent={accountTransferAccountLoading ? t('Loading...') : t('Type to search account')}
                        style={{ width: 'calc(100% - 40px)' }}
                      />
                    </Form.Item>
                    <Button
                      icon={<InstallmentsIcon />}
                      aria-label={t('Search accounts')}
                      onClick={() => openNewIncomeAccountSearch('destinationAccount')}
                      style={{ width: 40 }}
                    />
                  </Input.Group>
                </Form.Item>
                <Form.Item label={t('Destination name')} name="destinationName">
                  <Input />
                </Form.Item>
              </div>
            </div>
          </Form>
        </Modal>

        <Modal
          title={t('Edit movement')}
          open={movementEditVisible}
          onCancel={closeMovementEdit}
          footer={null}
          width={1100}
          destroyOnClose={false}
        >
          {renderNewIncomeContent(false, true)}
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
            setTransitCollectionMode(false);
            setTransitCollectionAccount(null);
            setTransitCollectionPolicyRow(null);
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
          title={t('Search accounts')}
          open={newIncomeAccountSearchVisible}
          onCancel={() => {
            setNewIncomeAccountSearchVisible(false);
            setAccountTransferSearchTarget(null);
          }}
          footer={null}
          width={900}
          destroyOnClose={false}
        >
          <Form
            form={newIncomeAccountSearchForm}
            layout="vertical"
            onFinish={values => loadNewIncomeAccountSearch(values, { current: 1, pageSize: newIncomeAccountSearchPagination.pageSize })}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Form.Item label={t('Account name')} name="accountName">
                <Input allowClear placeholder={t('Search by account name')} />
              </Form.Item>
              <Form.Item label={t('Policy')} name="policy">
                <Input allowClear placeholder={t('Search by policy id or code')} />
              </Form.Item>
              <Form.Item label={t('Contact')} name="contact">
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
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
              <Button onClick={clearNewIncomeAccountSearch}>{t('Clear')}</Button>
              <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>{t('Search')}</Button>
            </div>
          </Form>
          <Table
            className="cashier-supervisor-account-search-table"
            rowKey={record => String(record && record.id)}
            size="small"
            bordered
            loading={newIncomeAccountSearchLoading}
            dataSource={newIncomeAccountSearchRows}
            columns={[
              {
                title: t('Select'),
                key: 'action',
                width: 90,
                align: 'center',
                fixed: 'left',
                render: (_, record) => (
                  <Tooltip title={t('Select')}>
                    <Button
                      className="cashier-supervisor-account-select-cell"
                      type="link"
                      aria-label={t('Select')}
                      icon={<CheckOutlined />}
                      onClick={() => selectNewIncomeDestinationAccount(record)}
                    />
                  </Tooltip>
                )
              },
              {
                title: t('Account'),
                dataIndex: 'accNo',
                key: 'accNo',
                width: 140,
                render: value => (
                  <Tooltip title={getTrimmedString(value)}>
                    <span className="cashier-supervisor-account-cell">{getTrimmedString(value) || '-'}</span>
                  </Tooltip>
                )
              },
              {
                title: t('Name'),
                dataIndex: 'name',
                key: 'name',
                width: 180,
                render: value => (
                  <Tooltip title={getTrimmedString(value)}>
                    <span className="cashier-supervisor-account-cell">{getTrimmedString(value) || '-'}</span>
                  </Tooltip>
                )
              },
              { title: t('Policy'), dataIndex: 'policyCode', key: 'policyCode', width: 160 },
              {
                title: t('Balance'),
                key: 'currencyBalance',
                width: 140,
                align: 'right',
                render: (_, record) => (
                  <Tooltip
                    title={`${getTrimmedString(record && record.currency) || '-'} ${formatMoney(record && record.movementBalance !== undefined && record.movementBalance !== null ? record.movementBalance : 0)}`}
                  >
                    <span className="cashier-supervisor-account-cell">
                      {getTrimmedString(record && record.currency) || '-'} {formatMoney(record && record.movementBalance !== undefined && record.movementBalance !== null ? record.movementBalance : 0)}
                    </span>
                  </Tooltip>
                )
              },
              {
                title: t('Contact'),
                dataIndex: 'contactName',
                key: 'contactName',
                width: 180,
                render: value => (
                  <Tooltip title={getTrimmedString(value)}>
                    <span className="cashier-supervisor-account-cell">{getTrimmedString(value) || '-'}</span>
                  </Tooltip>
                )
              }
            ]}
            onRow={record => ({
              onClick: () => selectNewIncomeDestinationAccount(record)
            })}
            pagination={{
              current: newIncomeAccountSearchPagination.current,
              pageSize: newIncomeAccountSearchPagination.pageSize,
              total: newIncomeAccountSearchTotal,
              showSizeChanger: false,
              onChange: (current, pageSize) => loadNewIncomeAccountSearch(
                newIncomeAccountSearchForm.getFieldsValue(),
                { current: current, pageSize: pageSize }
              )
            }}
            scroll={{ x: 900, y: 300 }}
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
          title={t('Cash desk filters')}
          className="cashier-supervisor-drawer"
          placement="right"
          width={360}
          open={transferFilterVisible}
          onClose={() => setTransferFilterVisible(false)}
          destroyOnClose={false}
          footer={(
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={clearTransferFilters}>{t('Clear')}</Button>
              <Button type="primary" onClick={() => transferFilterForm.submit()}>{t('Apply')}</Button>
            </div>
          )}
        >
          <Form
            form={transferFilterForm}
            layout="vertical"
            onFinish={applyTransferFilters}
          >
            <Form.Item label={t('Start date')} name="dateFrom">
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                allowClear
              />
            </Form.Item>
            <Form.Item label={t('End date')} name="dateTo">
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                allowClear
              />
            </Form.Item>
          </Form>
        </Drawer>

        <Drawer
          title={t('Movement filters')}
          className="cashier-supervisor-drawer"
          placement="right"
          width={360}
          open={movementFilterVisible}
          onClose={() => setMovementFilterVisible(false)}
          destroyOnClose={false}
          footer={(
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={clearMovementFilters}>{t('Clear')}</Button>
              <Button type="primary" onClick={() => movementFilterForm.submit()}>{t('Apply')}</Button>
            </div>
          )}
        >
          <Form
            form={movementFilterForm}
            layout="vertical"
            onFinish={applyMovementFilters}
          >
            <Form.Item name="pending" valuePropName="checked">
              <Checkbox>{t('Pending to execute')}</Checkbox>
            </Form.Item>

            <Form.Item label={t('Transfer ID')} name="transferId">
              <InputNumber
                min={1}
                precision={0}
                style={{ width: '100%' }}
                placeholder={t('Transfer ID')}
              />
            </Form.Item>

            <Form.Item label={t('Amount')} name="amount">
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder={t('Amount')}
              />
            </Form.Item>

            <Form.Item label={t('Income type')} name="incomeType">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={incomeTypeOptions}
                placeholder={t('Select an income type')}
              />
            </Form.Item>
          </Form>
        </Drawer>

        <Drawer
          title={t('Premium collection filters')}
          className="cashier-supervisor-drawer"
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

            <Form.Item label={t('Policy')} name="policyCode">
              <Input
                allowClear
                placeholder={t('Enter the complete policy code')}
              />
            </Form.Item>

            <Form.Item label={t('Issuance date from')} name="issuanceFrom">
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label={t('Issuance date to')} name="issuanceTo">
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="onlyOverdue" valuePropName="checked">
              <Checkbox>{t('Only overdue')}</Checkbox>
            </Form.Item>
          </Form>
        </Drawer>

        <Drawer
          title={t('Transit premium filters')}
          className="cashier-supervisor-drawer"
          placement="right"
          width={360}
          open={transitFilterVisible}
          onClose={() => setTransitFilterVisible(false)}
          destroyOnClose={false}
          footer={(
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={clearTransitFilters}>{t('Clear')}</Button>
              <Button type="primary" onClick={() => transitFilterForm.submit()}>{t('Apply')}</Button>
            </div>
          )}
        >
          <Form
            form={transitFilterForm}
            layout="vertical"
            onFinish={applyTransitFilters}
          >
            <Form.Item label={t('Contact')} name="contact">
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
            <Form.Item label={t('Policy')} name="policy">
              <Input
                allowClear
                placeholder={t('Enter the complete policy code')}
              />
            </Form.Item>
            <Form.Item label={t('Account name')} name="accountName">
              <Input allowClear placeholder={t('Search by account name')} />
            </Form.Item>
            <Form.Item label={t('Account code')} name="accountCode">
              <Input allowClear placeholder={t('Search by account code')} />
            </Form.Item>
            <Form.Item label={t('Currency')} name="currency">
              <Select
                allowClear
                options={currencyOptions}
                placeholder={t('Currency')}
              />
            </Form.Item>
            <Form.Item label={t('Transaction')} name="name">
              <Input allowClear placeholder={t('Search by transaction')} />
            </Form.Item>
            <Form.Item name="cancellations" valuePropName="checked">
              <Checkbox>{t('Search cancellations')}</Checkbox>
            </Form.Item>
            <Form.Item name="onlyWithBalance" valuePropName="checked">
              <Checkbox>{t('Only accounts with balance')}</Checkbox>
            </Form.Item>
          </Form>
        </Drawer>

      </div>
  );
}
