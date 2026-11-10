/**
 * @author Michael Delgado
 * @created 2026/09/09
 * @name Cashier
 * @version 1.0
 * @purpose: Manage cashier workspaces, movements, payments and premium reversals.
 */
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
    Row,
    Col,
    Select,
    Switch,
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

  const CopyOutlined = () => (
    <span role="img" aria-label="copy" className="anticon anticon-copy">
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M832 64H296c-17.7 0-32 14.3-32 32v96h64v-64h472v472h-64v64h96c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32z"></path>
        <path d="M696 224H160c-17.7 0-32 14.3-32 32v672c0 17.7 14.3 32 32 32h536c17.7 0 32-14.3 32-32V256c0-17.7-14.3-32-32-32zm-32 672H192V288h472v608z"></path>
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
  const [movementPayerOptions, setMovementPayerOptions] = React.useState([]);
  const [movementPayerLoading, setMovementPayerLoading] = React.useState(false);
  const [movementActionId, setMovementActionId] = React.useState(0);
  const [movementSelectedRowKeys, setMovementSelectedRowKeys] = React.useState([]);
  const [movementViewVisible, setMovementViewVisible] = React.useState(false);
  const [movementViewRecord, setMovementViewRecord] = React.useState(null);
  const [movementEditVisible, setMovementEditVisible] = React.useState(false);
  const [movementEditRecord, setMovementEditRecord] = React.useState(null);
  const [movementEditLoading, setMovementEditLoading] = React.useState(false);
  const [premiumReversalVisible, setPremiumReversalVisible] = React.useState(false);
  const [premiumReversalRows, setPremiumReversalRows] = React.useState([]);
  const [premiumReversalLoading, setPremiumReversalLoading] = React.useState(false);
  const [premiumReversalPagination, setPremiumReversalPagination] = React.useState({ current: 1, pageSize: 15 });
  const [premiumReversalTotal, setPremiumReversalTotal] = React.useState(0);
  const [premiumReversalFilters, setPremiumReversalFilters] = React.useState({});
  const [premiumReversalFilterForm] = Form.useForm();
  const [balanceRows, setBalanceRows] = React.useState([]);
  const [balanceLoading, setBalanceLoading] = React.useState(false);
  const [transitAccountRows, setTransitAccountRows] = React.useState([]);
  const [transitAccountLoading, setTransitAccountLoading] = React.useState(false);
  const [transitExportLoading, setTransitExportLoading] = React.useState(false);
  const [transitAccountPagination, setTransitAccountPagination] = React.useState({ current: 1, pageSize: 25 });
  const [transitAccountTotal, setTransitAccountTotal] = React.useState(0);
  const [transitAccountFilters, setTransitAccountFilters] = React.useState({ showAll: false });
  const [transitHasSearched, setTransitHasSearched] = React.useState(false);
  const [transitFilterVisible, setTransitFilterVisible] = React.useState(false);
  const [transitInnerTab, setTransitInnerTab] = React.useState('accounts');
  const [transitDetailAccount, setTransitDetailAccount] = React.useState(null);
  const [transitLineRows, setTransitLineRows] = React.useState([]);
  const [transitLineLoading, setTransitLineLoading] = React.useState(false);
  const [transitLinePagination, setTransitLinePagination] = React.useState({ current: 1, pageSize: 25 });
  const [transitLineTotal, setTransitLineTotal] = React.useState(0);
  const [transitLineTotals, setTransitLineTotals] = React.useState({});
  const [transitLineAccountSummary, setTransitLineAccountSummary] = React.useState(null);
  const [transitLineSelection, setTransitLineSelection] = React.useState({});
  const [transitFilterForm] = Form.useForm();
  const [refundMoneyVisible, setRefundMoneyVisible] = React.useState(false);
  const [refundMoneySubmitting, setRefundMoneySubmitting] = React.useState(false);
  const [refundMoneyForm] = Form.useForm();
  const [refundAccountCreateVisible, setRefundAccountCreateVisible] = React.useState(false);
  const [refundAccountCreateLoading, setRefundAccountCreateLoading] = React.useState(false);
  const [refundAccountCreateForm] = Form.useForm();
  const [accountTransferVisible, setAccountTransferVisible] = React.useState(false);
  const [accountTransferForm] = Form.useForm();
  const accountTransferAmount = Form.useWatch('amount', accountTransferForm);
  const [accountTransferSourceBalance, setAccountTransferSourceBalance] = React.useState(0);
  const [accountTransferAccountOptions, setAccountTransferAccountOptions] = React.useState([]);
  const [accountTransferSourceOption, setAccountTransferSourceOption] = React.useState(null);
  const [accountTransferAccountLoading, setAccountTransferAccountLoading] = React.useState(false);
  const accountTransferAccountSearchTimer = React.useRef(null);
  const [ppxaApplyVisible, setPpxaApplyVisible] = React.useState(false);
  const [ppxaApplyLoading, setPpxaApplyLoading] = React.useState(false);
  const [ppxaApplyAccountOptions, setPpxaApplyAccountOptions] = React.useState([]);
  const [ppxaApplyAccountLoading, setPpxaApplyAccountLoading] = React.useState(false);
  const [ppxaApplyForm] = Form.useForm();
  const ppxaApplyAccountSearchTimer = React.useRef(null);
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
  const [reversalClientId, setReversalClientId] = React.useState(undefined);
  const [operationClientOptions, setOperationClientOptions] = React.useState([]);
  const [operationClientLoading, setOperationClientLoading] = React.useState(false);
  const operationClientSearchTimer = React.useRef(null);
  const [restructurePromptVisible, setRestructurePromptVisible] = React.useState(false);
  const [restructurePromptLoading, setRestructurePromptLoading] = React.useState(false);
  const [cashierRestructureVisible, setCashierRestructureVisible] = React.useState(false);
  const [cashierRestructureLoading, setCashierRestructureLoading] = React.useState(false);
  const [cashierRestructurePolicy, setCashierRestructurePolicy] = React.useState(null);
  const [cashierRestructureRows, setCashierRestructureRows] = React.useState([]);
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
  const [customerStatementVisible, setCustomerStatementVisible] = React.useState(false);
  const [customerStatementDateMode, setCustomerStatementDateMode] = React.useState('cutoff');
  const [collectionChargeVisible, setCollectionChargeVisible] = React.useState(false);
  const [transitCollectionMode, setTransitCollectionMode] = React.useState(false);
  const [transitCollectionAccount, setTransitCollectionAccount] = React.useState(null);
  const [transitCollectionPolicyRow, setTransitCollectionPolicyRow] = React.useState(null);
  const [transitCollectionPolicyRows, setTransitCollectionPolicyRows] = React.useState([]);
  const [transitCollectionPolicySelectionVisible, setTransitCollectionPolicySelectionVisible] = React.useState(false);
  const [transitCollectionPolicySelection, setTransitCollectionPolicySelection] = React.useState([]);
  const [transitCollectionPolicyLoading, setTransitCollectionPolicyLoading] = React.useState(false);
  const [collectionExpectedAmount, setCollectionExpectedAmount] = React.useState(0);
  const [collectionChargeStep, setCollectionChargeStep] = React.useState('payment');
  const [collectionPolicyRows, setCollectionPolicyRows] = React.useState([]);
  const [collectionSupplementaryRows, setCollectionSupplementaryRows] = React.useState([]);
  const [collectionCreditRows, setCollectionCreditRows] = React.useState([]);
  const [collectionExternalPolicyVisible, setCollectionExternalPolicyVisible] = React.useState(false);
  const [collectionExternalPolicyOptions, setCollectionExternalPolicyOptions] = React.useState([]);
  const [collectionExternalPolicyLoading, setCollectionExternalPolicyLoading] = React.useState(false);
  const [collectionExternalPolicyTargetKey, setCollectionExternalPolicyTargetKey] = React.useState(null);
  const [collectionPaymentExecuting, setCollectionPaymentExecuting] = React.useState(false);
  const collectionExternalPolicySearchTimer = React.useRef(null);
  const [collectionFilterForm] = Form.useForm();
  const [customerStatementForm] = Form.useForm();
  const [newIncomeAccountSearchForm] = Form.useForm();
  const [collectionLobOptions, setCollectionLobOptions] = React.useState([]);
  const [payerOptions, setPayerOptions] = React.useState([]);
  const [payerLoading, setPayerLoading] = React.useState(false);
  const payerSearchTimer = React.useRef(null);
  const movementPayerSearchTimer = React.useRef(null);
  const [refundBeneficiaryOptions, setRefundBeneficiaryOptions] = React.useState([]);
  const [refundDestinationAccountOptions, setRefundDestinationAccountOptions] = React.useState([]);
  const [refundDestinationAccountLoading, setRefundDestinationAccountLoading] = React.useState(false);
  const [refundNeedsManualDestination, setRefundNeedsManualDestination] = React.useState(false);
  const [refundBeneficiaryLoading, setRefundBeneficiaryLoading] = React.useState(false);
  const refundBeneficiarySearchTimer = React.useRef(null);
  const refundDestinationAccountSearchTimer = React.useRef(null);
  const [policyOptions, setPolicyOptions] = React.useState([]);
  const [policyLoading, setPolicyLoading] = React.useState(false);
  const policySearchTimer = React.useRef(null);
  const [currencyOptions, setCurrencyOptions] = React.useState([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = React.useState([]);
  const [allPaymentMethodOptions, setAllPaymentMethodOptions] = React.useState([]);
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
  const [newIncomeTransitContact, setNewIncomeTransitContact] = React.useState(null);
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

      .cashier-supervisor-view .cashier-grid-money-positive {
        color: #237804;
        font-weight: normal;
      }

      .cashier-supervisor-view .cashier-grid-money-negative {
        color: #cf1322;
        font-weight: normal;
      }

      .cashier-supervisor-view .cashier-grid-money-zero {
        color: #262626;
        font-weight: normal;
      }

      .cashier-supervisor-reversal-modal .cashier-premium-reversal-table .ant-table-thead > tr > th,
      .cashier-supervisor-reversal-modal .cashier-premium-reversal-table .ant-table-tbody > tr > td {
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-reversal-modal .cashier-premium-reversal-table .ant-table-body {
        overflow-x: scroll !important;
        overflow-y: scroll !important;
        scrollbar-gutter: stable;
      }

      .cashier-supervisor-reversal-modal .cashier-supervisor-table {
        border: 1px solid #cbd1d8 !important;
      }

      .cashier-supervisor-reversal-modal .cashier-supervisor-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
      }

      .cashier-supervisor-reversal-modal .cashier-supervisor-table .ant-table-tbody > tr > td {
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
      }

      .cashier-supervisor-reversal-modal .cashier-supervisor-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .cashier-supervisor-reversal-modal .ant-input,
      .cashier-supervisor-reversal-modal .ant-input-number,
      .cashier-supervisor-reversal-modal .ant-picker,
      .cashier-supervisor-reversal-modal .ant-select-selector {
        border: 1px solid #b8c4d1 !important;
        border-radius: 6px !important;
      }

      .cashier-supervisor-reversal-modal .ant-input:focus,
      .cashier-supervisor-reversal-modal .ant-input-number-focused,
      .cashier-supervisor-reversal-modal .ant-picker-focused,
      .cashier-supervisor-reversal-modal .ant-select-focused .ant-select-selector {
        border-color: #1677ff !important;
        box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2) !important;
      }

      .cashier-supervisor-reversal-modal .ant-input:hover,
      .cashier-supervisor-reversal-modal .ant-input-number:hover,
      .cashier-supervisor-reversal-modal .ant-picker:hover,
      .cashier-supervisor-reversal-modal .ant-select:not(.ant-select-disabled):hover .ant-select-selector {
        border-color: #8da9c2 !important;
      }

      .cashier-supervisor-reversal-modal .ant-input:disabled,
      .cashier-supervisor-reversal-modal .ant-input-number-disabled,
      .cashier-supervisor-reversal-modal .ant-picker-disabled,
      .cashier-supervisor-reversal-modal .ant-select-disabled .ant-select-selector {
        border-color: #b8c4d1 !important;
        background: #f5f5f5 !important;
        cursor: not-allowed;
      }

      .cashier-supervisor-reversal-modal .ant-form-item-label > label {
        color: #1f1f1f;
        font-weight: 600;
      }

      .cashier-supervisor-reversal-modal .ant-modal-content {
        border: 1px solid #cbd1d8;
        border-radius: 6px;
      }

      .cashier-supervisor-reversal-modal .ant-modal-header {
        border-bottom: 1px solid #cbd1d8;
      }

      .cashier-supervisor-refund-modal .ant-modal-content {
        border: 1px solid #cbd1d8;
        border-radius: 6px;
      }

      .cashier-supervisor-refund-modal .ant-modal-header {
        border-bottom: 1px solid #cbd1d8;
        margin-bottom: 12px;
      }

      .cashier-supervisor-refund-grid {
        display: grid;
        grid-template-columns: minmax(0, .9fr) minmax(0, 1.35fr);
        gap: 16px;
      }

      .cashier-supervisor-refund-grid .ant-form-item { min-width: 0; }
      .cashier-supervisor-refund-grid .ant-select { width: 100%; min-width: 0; }
      .cashier-supervisor-refund-grid .ant-select-selection-item,
      .cashier-supervisor-refund-grid .ant-select-selection-placeholder {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      @media (max-width: 640px) {
        .cashier-supervisor-refund-grid { grid-template-columns: minmax(0, 1fr); }
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

      .cashier-transit-inner-tabs > .ant-tabs-nav {
        margin-bottom: 8px;
      }

      .cashier-transit-lines-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 8px 24px;
        padding: 8px 12px;
        margin-bottom: 8px;
        background: #fafafa;
        border: 1px solid #f0f0f0;
        border-radius: 4px;
      }

      .cashier-transit-lines-header > div {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 16px;
      }

      .cashier-transit-lines-selection {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 16px;
        padding: 6px 12px;
        margin-bottom: 8px;
        background: #e6f4ff;
        border: 1px solid #91caff;
        border-radius: 4px;
      }

      .cashier-transit-lines-note {
        margin-bottom: 12px;
        padding: 6px 10px;
        background: #f6ffed;
        border: 1px solid #b7eb8f;
        border-radius: 4px;
      }

      .cashier-transit-lines-empty {
        padding: 32px 16px;
        text-align: center;
        color: #8c8c8c;
      }

      .cashier-transit-lines-table .ant-table-tbody > tr.cashier-transit-lines-closed > td {
        color: #8c8c8c;
        background: #fafafa;
      }

      .cashier-transit-lines-applied {
        cursor: help;
        border-bottom: 1px dotted #8c8c8c;
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
        border: 1px solid #cbd1d8;
        border-radius: 6px;
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

      .cashier-supervisor-view .cashier-supervisor-new-income-actions.cashier-supervisor-toolbar {
        border-bottom: 0;
        padding-bottom: 4px;
        margin-bottom: 2px;
      }

      .cashier-supervisor-view .cashier-supervisor-new-income-actions.cashier-supervisor-toolbar > .ant-btn:first-child {
        margin-left: 4px;
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

      .cashier-supervisor-new-income-card .cashier-supervisor-section-title {
        background: #bfbfbf;
        border: 1px solid #e6ebf2;
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

      .cashier-supervisor-collection-payment-modal .ant-modal-content {
        border: 1px solid #cbd1d8;
        border-radius: 6px;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-collection-allocation-card {
        border: 1px solid #cbd1d8;
        border-radius: 6px;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-collection-allocation-card > .ant-card-body {
        padding: 4px !important;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-collection-allocation-actions {
        align-items: center;
        background: #e6f7ff;
        border: 1px solid #91caff;
        border-radius: 0;
        padding: 4px 0;
        margin-bottom: 2px;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-collection-allocation-actions > .ant-btn:first-child {
        margin-left: 4px;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-collection-allocation-actions > .ant-btn:last-child {
        margin-right: 4px;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-section-title {
        background: #bfbfbf;
        border: 1px solid #cbd1d8;
        border-radius: 6px;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-table {
        border: 1px solid #cbd1d8;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-table .ant-table-tbody > tr > td {
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
      }

      .cashier-supervisor-collection-payment-modal .cashier-supervisor-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .cashier-supervisor-transit-policy-modal .ant-modal-content {
        border: 1px solid #cbd1d8;
        border-radius: 6px;
      }

      .cashier-supervisor-transit-policy-modal .ant-modal-header {
        border-bottom: 1px solid #cbd1d8;
        margin-bottom: 12px;
      }

      .cashier-supervisor-transit-policy-modal .cashier-supervisor-transit-policy-table {
        border: 1px solid #cbd1d8;
      }

      .cashier-supervisor-transit-policy-modal .cashier-supervisor-transit-policy-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-transit-policy-modal .cashier-supervisor-transit-policy-table .ant-table-tbody > tr > td {
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-transit-policy-modal .cashier-supervisor-transit-policy-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .cashier-supervisor-transit-policy-modal .cashier-supervisor-transit-policy-table .ant-table-tbody > tr.ant-table-row-selected > td {
        background: #86b4ff !important;
      }

      .cashier-supervisor-transit-policy-modal .ant-checkbox-inner {
        border: 1px solid #8f9aa7 !important;
        border-radius: 4px;
      }

      .cashier-supervisor-transit-policy-modal .ant-checkbox:hover .ant-checkbox-inner,
      .cashier-supervisor-transit-policy-modal .ant-checkbox-wrapper:hover .ant-checkbox-inner {
        border-color: #1677ff !important;
      }

      .cashier-supervisor-transit-policy-modal .ant-checkbox-checked .ant-checkbox-inner,
      .cashier-supervisor-transit-policy-modal .ant-checkbox-indeterminate .ant-checkbox-inner {
        background: #1677ff !important;
        border-color: #1677ff !important;
      }

      .cashier-supervisor-transit-policy-modal .ant-modal-footer {
        border-top: 1px solid #cbd1d8;
      }

      .cashier-supervisor-transit-policy-modal .ant-modal-footer .ant-btn:not(.ant-btn-primary) {
        border-color: #8f9aa7;
      }

      .cashier-supervisor-restructure-modal .ant-modal-content {
        border: 1px solid #cbd1d8;
        border-radius: 6px;
      }

      .cashier-supervisor-restructure-modal .ant-modal-header {
        border-bottom: 1px solid #cbd1d8;
        margin-bottom: 12px;
      }

      .cashier-supervisor-restructure-modal .cashier-supervisor-restructure-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding: 8px 10px;
        background: #e6f4ff;
        border: 1px solid #91caff;
        border-radius: 6px;
        color: #1f1f1f;
      }

      .cashier-supervisor-restructure-modal .cashier-supervisor-restructure-table {
        border: 1px solid #cbd1d8;
      }

      .cashier-supervisor-restructure-modal .cashier-supervisor-restructure-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-restructure-modal .cashier-supervisor-restructure-table .ant-table-tbody > tr > td {
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-restructure-modal .cashier-supervisor-restructure-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .cashier-supervisor-restructure-modal .cashier-supervisor-restructure-table .cashier-supervisor-restructure-proposed {
        color: #237804;
        font-weight: 600;
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

      /* Shared visual standard for every Cashier tab. */
      .cashier-supervisor-view {
        font-size: 13px;
      }

      .cashier-supervisor-view .cashier-supervisor-toolbar {
        background: #e6f7ff !important;
        border: 1px solid #91caff !important;
        border-radius: 0 !important;
        padding: 4px 0 !important;
        margin-bottom: 2px !important;
        margin-top: -4px;
        margin-left: -4px;
        margin-right: -4px;
        box-shadow: 0 1px 3px rgba(22, 119, 255, 0.12);
      }

      .cashier-supervisor-view .cashier-supervisor-toolbar > .ant-space {
        margin-left: 4px;
      }

      .cashier-supervisor-view .cashier-supervisor-toolbar > :first-child {
        margin-left: 4px;
      }

      .cashier-supervisor-view .cashier-supervisor-toolbar > :last-child {
        margin-right: 4px;
      }

      .cashier-supervisor-view .cashier-supervisor-toolbar .ant-btn {
        border-radius: 6px;
        font-size: 13px;
      }

      .cashier-supervisor-view .cashier-supervisor-outline-button.ant-btn {
        border-color: #8f9aa7;
      }

      .cashier-supervisor-view .cashier-supervisor-outline-button.ant-btn:disabled,
      .cashier-supervisor-view .cashier-supervisor-success-button.ant-btn:disabled {
        color: #7b8794;
        background: #f5f5f5;
        border-color: #6f7b88;
        opacity: 1;
      }

      .cashier-supervisor-view .cashier-supervisor-export-button.ant-btn {
        color: #fff;
        background: #60b13d;
        border-color: #4f9336;
      }

      .cashier-supervisor-view .cashier-supervisor-report-button.ant-btn {
        color: #fff;
        background: #dd603d;
        border-color: #bd4d35;
      }

      .cashier-supervisor-view .cashier-supervisor-tab-bar {
        gap: 2px;
        margin-bottom: 2px;
        border-bottom-color: #cbd1d8;
      }

      .cashier-supervisor-view .cashier-supervisor-tab {
        border: 1px solid #cbd1d8;
        border-bottom: 0;
        border-radius: 6px 6px 0 0;
      }

      .cashier-supervisor-view .cashier-supervisor-tab.active {
        border-color: #1677ff;
        border-bottom-color: #fff;
      }

      .cashier-supervisor-view .cashier-supervisor-tab:disabled {
        border-color: #cbd1d8;
      }

      .cashier-supervisor-view .cashier-supervisor-table {
        border: 1px solid #cbd1d8;
      }

      .cashier-supervisor-view .cashier-supervisor-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-view .cashier-supervisor-table .ant-table-tbody > tr > td {
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        font-size: 12px;
        line-height: 18px;
      }

      .cashier-supervisor-view .cashier-supervisor-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .cashier-supervisor-view .cashier-supervisor-table .ant-table-tbody > tr.cashier-supervisor-selected-row > td,
      .cashier-supervisor-view .cashier-supervisor-table .ant-table-tbody > tr.ant-table-row-selected > td {
        background: #86b4ff !important;
      }

      .cashier-supervisor-view .cashier-supervisor-table .ant-table-tbody > tr.cashier-supervisor-selected-row:hover > td,
      .cashier-supervisor-view .cashier-supervisor-table .ant-table-tbody > tr.ant-table-row-selected:hover > td {
        background: #86b4ff !important;
      }

      .cashier-supervisor-view .ant-card:has(.cashier-supervisor-table) .ant-card-body {
        padding: 4px !important;
      }

      .cashier-supervisor-view .cashier-supervisor-status-bar {
        background: linear-gradient(90deg, #e6f4ff 0%, #4096ff 100%);
        color: #fff;
      }

      .cashier-supervisor-view .cashier-supervisor-status-bar .cashier-supervisor-status-item strong {
        color: #fff;
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
      const computed = Math.max(180, Math.floor(availableHeight - 340));
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

  function renderGridMoney(value) {
    const amount = Number(value || 0);
    let className = 'cashier-grid-money-zero';

    if (Number.isFinite(amount) && amount > 0) {
      className = 'cashier-grid-money-positive';
    } else if (Number.isFinite(amount) && amount < 0) {
      className = 'cashier-grid-money-negative';
    }

    return <span className={className}>{formatMoney(value)}</span>;
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

  function getRefundPaymentMethodOptions() {
    return allPaymentMethodOptions.filter(option => {
      const code = getTrimmedString(option && option.value).toUpperCase();
      const label = getTrimmedString(option && option.label)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

      const isCheque = code === 'CH' || label === 'CHEQUE';
      const isAccountTransfer = label.indexOf('TRANSFERENCIA') >= 0
        && label.indexOf('CUENTA') >= 0;

      return isCheque || isAccountTransfer;
    });
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
    const pageSize = Number(pagination && pagination.pageSize) || 25;
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
        transferId: filters && filters.transferId !== undefined && filters.transferId !== null
          ? filters.transferId
          : '',
        policy: getTrimmedString(filters && filters.policy),
        accountName: getTrimmedString(filters && filters.accountName),
        accountCode: getTrimmedString(filters && filters.accountCode),
        currency: getTrimmedString(filters && filters.currency),
        name: getTrimmedString(filters && filters.name),
        cancellations: filters && filters.cancellations === true,
        onlyWithBalance: !(filters && filters.showAll === true),
        // MSN-000174: the movements of one account are read in its detail tab, line by line.
        includeMovements: false
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
        setTransitAccountTotal(Number(payload.total) || 0);
        setTransitAccountPagination({ current: currentPage, pageSize });
      })
      .catch(error => {
        setTransitAccountRows([]);
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
        && Number.isFinite(amount);
    });

    if (transitAccountFilters && transitAccountFilters.cancellations === true) {
      return visibleMovements.filter(item => getTrimmedString(item && item.transaction) === 'Cancellation');
    }

    return visibleMovements;
  }

  function getTransitAccountBalance(account) {
    const availableBalance = Number(account && account.availableBalance);
    const reportedMovementBalance = Number(account && account.movementBalance);
    const movementBalance = getTransitMovements(account).reduce((total, movement) => {
      const amount = Number(movement && movement.amount);
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
    const pendingRefundAmount = Number(account && account.pendingRefundAmount);
    const hasPendingRefund = Number.isFinite(pendingRefundAmount) && pendingRefundAmount > 0;

    // Some account responses still expose the gross movement balance as availableBalance.
    // Reconcile it only when it matches movementBalance, so already-net balances are not
    // reduced twice.
    if (Number.isFinite(availableBalance)) {
      const isGrossBalance = Number.isFinite(reportedMovementBalance)
        && Math.abs(availableBalance - reportedMovementBalance) < 0.005;
      if (hasPendingRefund && isGrossBalance) {
        return Math.max(0, reportedMovementBalance - pendingRefundAmount);
      }
      return availableBalance;
    }

    return Math.max(0, movementBalance - (hasPendingRefund ? pendingRefundAmount : 0));
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
      transferId: Number(values && values.transferId) > 0 ? Number(values.transferId) : '',
      policy: getTrimmedString(values && values.policy),
      accountName: getTrimmedString(values && values.accountName),
      accountCode: getTrimmedString(values && values.accountCode),
      currency: getTrimmedString(values && values.currency),
      name: getTrimmedString(values && values.name),
      cancellations: values && values.cancellations === true,
      showAll: values && values.showAll === true
    };
    setTransitAccountFilters(nextFilters);
    setTransitHasSearched(true);
    setTransitFilterVisible(false);
    resetTransitDetail();
    loadTransitAccounts({
      filters: nextFilters,
      pagination: { current: 1, pageSize: transitAccountPagination.pageSize }
    });
  }

  // A new search closes the detail; the selected lines stay selected until they are used or cleared.
  function resetTransitDetail() {
    setTransitInnerTab('accounts');
    setTransitDetailAccount(null);
    setTransitLineRows([]);
    setTransitLineTotal(0);
    setTransitLineTotals({});
    setTransitLineAccountSummary(null);
  }

  function clearTransitFilters() {
    transitFilterForm.resetFields();
    transitFilterForm.setFieldsValue({ showAll: false });
    if (Array.isArray(currencyOptions) && currencyOptions.length === 1) {
      transitFilterForm.setFieldsValue({ currency: currencyOptions[0].value });
    }
    setTransitAccountFilters({ showAll: false });
    setTransitHasSearched(false);
    setTransitAccountRows([]);
    setTransitAccountTotal(0);
    setTransitFilterVisible(false);
    resetTransitDetail();
  }

  function handleTransitTableChange(pagination) {
    loadTransitAccounts({
      filters: transitAccountFilters,
      pagination: { current: pagination.current, pageSize: pagination.pageSize }
    });
  }

  async function exportTransitAccounts() {
    if (!transitHasSearched) {
      message.warning(t('Apply a transit amount filter before exporting.'));
      return;
    }

    setTransitExportLoading(true);
    try {
      if (!await ensureCashierExcelLibrary()) {
        throw new Error(t('Excel export is not available.'));
      }

      const pageSize = 100;
      const allRows = [];
      let currentPage = 1;
      let total = 0;

      while (currentPage === 1 || allRows.length < total) {
        const filters = transitAccountFilters || {};
        const response = await exe('ExeChain', {
          chain: 'cmdGetTransitMovs',
          context: JSON.stringify({
            page: currentPage,
            size: pageSize,
            holderId: filters.holderId !== undefined && filters.holderId !== null ? filters.holderId : '',
            transferId: filters.transferId !== undefined && filters.transferId !== null ? filters.transferId : '',
            policy: getTrimmedString(filters.policy),
            accountName: getTrimmedString(filters.accountName),
            accountCode: getTrimmedString(filters.accountCode),
            currency: getTrimmedString(filters.currency),
            name: getTrimmedString(filters.name),
            cancellations: filters.cancellations === true,
            onlyWithBalance: filters.showAll !== true
          })
        });

        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Transit accounts could not be exported.'));
        }

        const payload = response.outData && typeof response.outData === 'object'
          ? response.outData
          : {};
        const rows = Array.isArray(payload.data) ? payload.data : [];
        total = Number(payload.total) || allRows.length + rows.length;
        allRows.push(...rows);

        if (rows.length === 0 || rows.length < pageSize) break;
        currentPage += 1;
      }

      if (allRows.length === 0) {
        message.info(t('There are no transit amounts to export.'));
        return;
      }

      const masterRows = allRows.map(account => ({
        [t('Account ID')]: account.id || '',
        [t('Account')]: account.accNo || '',
        [t('Name')]: account.name || '',
        [t('Policy')]: getTransitAccountLabel(account).policy,
        [t('Contact')]: getTransitAccountLabel(account).contact,
        [t('Currency')]: account.currency || '',
        [t('Balance')]: Number(getTransitAccountBalance(account).toFixed(2)),
        [t('Movement balance')]: Number(account.movementBalance || 0),
        [t('Pending refund')]: Number(account.pendingRefundAmount || 0),
        [t('Movements')]: getTransitMovements(account).length
      }));

      const detailRows = allRows.flatMap(account => getTransitMovements(account).map(movement => ({
        [t('Account ID')]: account.id || '',
        [t('Account')]: account.accNo || '',
        [t('Policy')]: getTransitAccountLabel(account).policy,
        [t('Contact')]: getTransitAccountLabel(account).contact,
        [t('Currency')]: account.currency || '',
        [t('Movement ID')]: movement.id || '',
        [t('Date')]: movement.date ? formatDate(movement.date) : '',
        [t('Transaction')]: movement.transaction || '',
        [t('Transaction code')]: movement.transactionCode || '',
        [t('Amount')]: Number(movement.amount || 0),
        [t('Amount balance')]: Number(movement.amountBalance || 0),
        [t('Transfer ID')]: movement.transferId || '',
        [t('Units')]: Number(movement.units || 0),
        [t('Unit balance')]: Number(movement.unitBalance || 0)
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(masterRows), 'Maestro');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows), 'Detalle');
      XLSX.writeFile(workbook, `transit-amounts-${Date.now()}.xlsx`);
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setTransitExportLoading(false);
    }
  }

  // MSN-000174: the detail tab works line by line. Each incoming movement of a transit account
  // is a line with its own available amount (cmdTransitLines); the operations take selected lines.
  function getTransitTime(value) {
    const time = value ? new Date(value).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  }

  function getTransitLineFilterContext(filters) {
    const source = filters || {};
    return {
      holderId: source.holderId !== undefined && source.holderId !== null ? source.holderId : '',
      transferId: source.transferId !== undefined && source.transferId !== null ? source.transferId : '',
      name: getTrimmedString(source.name),
      cancellations: source.cancellations === true,
      showAll: source.showAll === true
    };
  }

  function loadTransitLines(params = {}) {
    const account = params.account || transitDetailAccount;
    const accountId = Number(account && account.id) || 0;
    if (accountId <= 0) return Promise.resolve();

    const filters = params.filters || transitAccountFilters;
    const pagination = params.pagination || transitLinePagination;
    const pageSize = Number(pagination && pagination.pageSize) || 25;
    const currentPage = Number(pagination && pagination.current) || 1;

    setTransitLineLoading(true);
    return exe('ExeChain', {
      chain: 'cmdTransitLines',
      context: JSON.stringify({
        mode: 'list',
        accountId: accountId,
        page: currentPage,
        size: pageSize,
        ...getTransitLineFilterContext(filters)
      })
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The movements of the transit account could not be loaded.'));
        }

        const payload = response.outData && typeof response.outData === 'object' && !Array.isArray(response.outData)
          ? response.outData
          : {};
        const rows = Array.isArray(payload.data) ? payload.data : [];
        setTransitLineRows(rows);
        setTransitLineTotal(Number(payload.total) || 0);
        setTransitLineTotals(payload.totals && typeof payload.totals === 'object' ? payload.totals : {});
        setTransitLineAccountSummary(payload.account && typeof payload.account === 'object' ? payload.account : null);
        setTransitLinePagination({ current: currentPage, pageSize });
        // A selected line keeps the available amount the server reports now.
        setTransitLineSelection(current => {
          const next = { ...current };
          rows.forEach(row => {
            const key = String(row && row.id);
            if (!next[key]) return;
            const available = getAuditNumber(row.available);
            if (row.kind !== 'LINE' || available <= 0.005) {
              delete next[key];
            } else {
              next[key] = { ...next[key], available: available };
            }
          });
          return next;
        });
      })
      .catch(error => {
        setTransitLineRows([]);
        setTransitLineTotal(0);
        setTransitLineTotals({});
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => setTransitLineLoading(false));
  }

  function openTransitAccountDetail(account) {
    const accountId = Number(account && account.id) || 0;
    if (accountId <= 0) return;

    setTransitDetailAccount(account);
    setTransitInnerTab('lines');
    setTransitLineRows([]);
    setTransitLineTotal(0);
    setTransitLineTotals({});
    setTransitLineAccountSummary(null);
    loadTransitLines({
      account: account,
      pagination: { current: 1, pageSize: transitLinePagination.pageSize }
    });
  }

  function handleTransitLineTableChange(pagination) {
    loadTransitLines({
      pagination: {
        current: pagination && pagination.current,
        pageSize: pagination && pagination.pageSize
      }
    });
  }

  function isTransitLineSelectable(row) {
    return Boolean(row) && row.kind === 'LINE' && getAuditNumber(row.available) > 0.005;
  }

  function getTransitLineSelectionEntries() {
    return Object.keys(transitLineSelection || {})
      .map(key => transitLineSelection[key])
      .filter(entry => entry && Number(entry.movId) > 0 && getAuditNumber(entry.available) > 0.005)
      .sort((left, right) => (getTransitTime(left.date) - getTransitTime(right.date))
        || (Number(left.movId) - Number(right.movId)));
  }

  function toggleTransitLineSelection(rows, selected) {
    const account = transitDetailAccount;
    const accountId = Number(account && account.id) || 0;
    if (accountId <= 0) return;

    setTransitLineSelection(current => {
      const next = { ...current };
      (Array.isArray(rows) ? rows : []).forEach(row => {
        const key = String(row && row.id);
        if (!row || !key) return;
        if (!selected) {
          delete next[key];
          return;
        }
        if (!isTransitLineSelectable(row)) return;
        next[key] = {
          key: key,
          movId: Number(row.id),
          accountId: accountId,
          account: account,
          available: getAuditNumber(row.available),
          amount: getAuditNumber(row.amount),
          date: row.date,
          transaction: row.transaction,
          ownerId: row.ownerId,
          ownerName: row.ownerName
        };
      });
      return next;
    });
  }

  function clearTransitLineSelection() {
    setTransitLineSelection({});
  }

  function getTransitSourceAccountOptions() {
    const accounts = transitAccountRows.slice();
    getSelectedTransitAccounts().forEach(account => {
      if (!accounts.some(row => Number(row && row.id) === Number(account && account.id))) {
        accounts.push(account);
      }
    });

    return accounts
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

  function getSelectedTransitAccountIds() {
    return Array.from(new Set(getTransitLineSelectionEntries().map(entry => String(entry.accountId))));
  }

  function getSelectedTransitAccounts() {
    const accounts = {};
    getTransitLineSelectionEntries().forEach(entry => {
      const key = String(entry.accountId);
      if (!accounts[key]) {
        accounts[key] = entry.account || { id: entry.accountId };
      }
    });
    return Object.keys(accounts).map(key => accounts[key]);
  }

  function getSingleSelectedTransitAccount(actionMessage) {
    const accounts = getSelectedTransitAccounts();
    if (accounts.length !== 1) {
      message.warning(actionMessage || t('Select lines of a single transit account for this action.'));
      return null;
    }

    return accounts[0];
  }

  function getSelectedTransitLineEntries(accountId) {
    return getTransitLineSelectionEntries()
      .filter(entry => !accountId || Number(entry.accountId) === Number(accountId));
  }

  function getSelectedTransitLinesTotal(accountId) {
    return Number(getSelectedTransitLineEntries(accountId)
      .reduce((total, entry) => total + getAuditNumber(entry.available), 0)
      .toFixed(2));
  }

  function getSelectedTransitAccountsSummary() {
    const accounts = getSelectedTransitAccounts();
    const currencies = Array.from(new Set(accounts
      .map(account => getTrimmedString(account && account.currency).toUpperCase())
      .filter(Boolean)));
    const total = getSelectedTransitLinesTotal();
    return { accounts, currencies, total };
  }

  // The amount is taken from the oldest selected lines first; the last line used may be partial.
  function distributeTransitLines(amount, entries) {
    let remaining = Number(getAuditNumber(amount).toFixed(2));
    const lines = [];
    (Array.isArray(entries) ? entries : []).forEach(entry => {
      if (remaining <= 0) return;
      const used = Number(Math.min(getAuditNumber(entry.available), remaining).toFixed(2));
      if (used <= 0) return;
      lines.push({ movId: Number(entry.movId), accountId: Number(entry.accountId), amount: used });
      remaining = Number((remaining - used).toFixed(2));
    });
    if (remaining > 0.005) {
      throw new Error(t('The amount cannot exceed the available balance of the selected lines.'));
    }
    return lines;
  }

  function sumTransitLines(lines) {
    return Number((Array.isArray(lines) ? lines : [])
      .reduce((total, line) => total + getAuditNumber(line && line.amount), 0)
      .toFixed(2));
  }

  function groupTransitLinesByAccount(lines) {
    return (Array.isArray(lines) ? lines : []).reduce((groups, line) => {
      const key = String(line.accountId);
      if (!groups[key]) groups[key] = [];
      groups[key].push(line);
      return groups;
    }, {});
  }

  async function runTransitLinesChain(context, failureMessage) {
    const response = await exe('ExeChain', {
      chain: 'cmdTransitLines',
      context: JSON.stringify(context)
    });
    if (!response || response.ok === false) {
      throw new Error(response && response.msg ? response.msg : failureMessage);
    }

    return response.outData && typeof response.outData === 'object' && !Array.isArray(response.outData)
      ? response.outData
      : {};
  }

  function checkTransitLines(accountId, amount, lines) {
    return runTransitLinesChain({
      mode: 'check',
      accountId: Number(accountId),
      amount: Number(getAuditNumber(amount).toFixed(2)),
      lines: lines.map(line => ({ movId: line.movId, amount: line.amount }))
    }, t('The selected lines could not be validated.'));
  }

  function stampTransitLines(accountId, operation, reference, amount, lines) {
    return runTransitLinesChain({
      mode: 'stamp',
      accountId: Number(accountId),
      operation: operation,
      opTransferId: Number(reference && reference.transferId) || 0,
      opRequestId: Number(reference && reference.requestId) || 0,
      amount: Number(getAuditNumber(amount).toFixed(2)),
      lines: lines.map(line => ({ movId: line.movId, amount: line.amount }))
    }, t('The applied lines could not be recorded.'));
  }

  // Pending transfers created by an operation that could not record its lines are removed again.
  async function deletePendingTransitTransfers(transfers) {
    for (const transfer of (Array.isArray(transfers) ? transfers : [])) {
      const id = Number(transfer && transfer.id) || 0;
      if (id <= 0) continue;
      await exe('RepoTransfer', {
        operation: 'DELETE',
        entity: { id: id }
      });
    }
  }

  function refreshTransitAfterOperation() {
    setTransitLineSelection({});
    loadTransitAccounts({
      filters: transitAccountFilters,
      pagination: {
        current: transitAccountPagination.current,
        pageSize: transitAccountPagination.pageSize
      }
    });
    if (transitDetailAccount) {
      loadTransitLines({
        account: transitDetailAccount,
        pagination: transitLinePagination
      });
    }
  }

  function renderTransitSelectionNote(accountId) {
    const entries = getSelectedTransitLineEntries(accountId);
    return (
      <div className="cashier-transit-lines-note">
        {t('Selected lines')}: <strong>{entries.length}</strong>
        {' · '}
        {t('Available to apply')}: <strong>{formatMoney(getSelectedTransitLinesTotal(accountId))}</strong>
        {' · '}
        {t('A partial amount is taken from the oldest selected lines first.')}
      </div>
    );
  }

  // MSN-000176: a transit operation (PPXA, manual account transfer, premium reversal credited to an account)
  // references a client the way the cash income form does: the «Cliente» fields of jIncomeTypeForm (clientePA,
  // hiddenCodigoCliente), which the Contact filter of the transit tab reads.
  function buildClientReferenceForm(client) {
    const id = Number(client && client.id);
    const name = getTrimmedString(client && client.name);
    if (!Number.isFinite(id) || id <= 0 || !name) return null;

    return JSON.stringify([
      {
        type: 'text',
        required: true,
        label: 'Cliente',
        placeholder: 'Digite un nombre para buscar un cliente',
        className: 'ant-input col-md-12 row-1',
        name: 'clientePA',
        access: false,
        subtype: 'text',
        userData: [name]
      },
      {
        type: 'hidden',
        name: 'hiddenCodigoCliente',
        access: false,
        userData: [String(id)]
      }
    ]);
  }

  function getFormClient(form) {
    let fields = form;
    if (typeof fields === 'string') {
      try {
        fields = JSON.parse(fields);
      } catch (error) {
        return null;
      }
    }
    if (!Array.isArray(fields)) return null;

    const getValue = fieldName => {
      const field = fields.find(item => item && item.name === fieldName);
      return getTrimmedString(field && (Array.isArray(field.userData) ? field.userData[0] : field.userData));
    };
    const id = Number(getValue('hiddenCodigoCliente'));
    const name = getValue('clientePA');
    return Number.isFinite(id) && id > 0 && name ? { id: id, name: name } : null;
  }

  // The movement text is the reference followed by the client name, unless the reference already holds the name.
  function buildClientReferenceText(reference, client) {
    const text = getTrimmedString(reference);
    const name = getTrimmedString(client && client.name);
    if (!name || text.toLowerCase().indexOf(name.toLowerCase()) >= 0) return text;
    return text ? `${text} - ${name}` : name;
  }

  // Own accounts do not determine the client, as in the cash income (updateNewIncomeTransitContact).
  function getDefaultOperationClient(client) {
    const id = Number(client && client.id);
    const name = getTrimmedString(client && client.name);
    return Number.isFinite(id) && id > 0 && name && name.toUpperCase().indexOf('ASEGURADORA GLOBAL') < 0
      ? { id: id, name: name }
      : null;
  }

  // The client of the given selected lines, or null when they belong to more than one client.
  function getTransitLinesClient(entries) {
    const owners = {};
    (Array.isArray(entries) ? entries : []).forEach(entry => {
      const id = Number(entry && entry.ownerId);
      if (Number.isFinite(id) && id > 0) {
        owners[id] = getTrimmedString(entry.ownerName) || owners[id] || '';
      }
    });
    const ids = Object.keys(owners);
    return ids.length === 1 && owners[ids[0]] ? { id: Number(ids[0]), name: owners[ids[0]] } : null;
  }

  // Default client of an operation on selected lines: the holder of their accounts when they all have the same
  // one, else the client the lines belong to.
  function getSelectedTransitLinesDefaultClient(accounts, entries) {
    const holders = (Array.isArray(accounts) ? accounts : [])
      .map(account => getDefaultOperationClient(getTransitAccountContact(account)));
    const holderIds = Array.from(new Set(holders.map(holder => (holder ? holder.id : 0))));
    if (holders.length > 0 && holderIds.length === 1 && holderIds[0] > 0) return holders[0];
    return getDefaultOperationClient(getTransitLinesClient(entries));
  }

  // The outgoing movement of an account keeps the client of the lines it takes.
  function getTransitLinesOwnerForm(lines) {
    const taken = {};
    (Array.isArray(lines) ? lines : []).forEach(line => {
      taken[String(line && line.movId)] = true;
    });
    return buildClientReferenceForm(getTransitLinesClient(
      getTransitLineSelectionEntries().filter(entry => taken[String(entry.movId)])
    ));
  }

  function mapOperationClientOption(contact) {
    const id = Number(contact && contact.id);
    const name = getTrimmedString(contact && (contact.FullName || contact.fullName || [
      contact.name,
      contact.surname1,
      contact.surname2
    ].filter(Boolean).join(' '))) || String(id);
    const identifier = getTrimmedString(contact && (contact.identifier || contact.cnp || contact.nif || contact.passport));

    return {
      value: id,
      id: id,
      name: name,
      label: (
        <div style={{ lineHeight: 1.25 }}>
          <div>{name}</div>
          <div style={{ color: '#8c8c8c', fontSize: 11 }}>
            {`${t('ID')}: ${id}${identifier ? ` | ${identifier}` : ''}`}
          </div>
        </div>
      )
    };
  }

  function fetchOperationClients(filter, size) {
    return exe('GetContacts', { operation: 'GET', filter: filter, size: size || 15 })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Clients could not be loaded.'));
        }

        return getRows(response)
          .map(mapOperationClientOption)
          .filter(option => Number.isFinite(option.id) && option.id > 0);
      });
  }

  function searchOperationClients(value) {
    const searchText = getTrimmedString(value);
    const isNumericId = /^\d+$/.test(searchText);

    if (operationClientSearchTimer.current) {
      clearTimeout(operationClientSearchTimer.current);
      operationClientSearchTimer.current = null;
    }

    if (!searchText || (!isNumericId && searchText.length < 3)) {
      setOperationClientLoading(false);
      return;
    }

    operationClientSearchTimer.current = setTimeout(() => {
      const escaped = escapeSqlString(searchText);
      const filter = isNumericId
        ? `(inactive=0) AND [id] = ${Number(searchText)}`
        : `(inactive=0) AND (([name] LIKE N'%${escaped}%') OR ([surname1] LIKE N'%${escaped}%') OR ([surname2] LIKE N'%${escaped}%') OR ([cnp] LIKE N'%${escaped}%') OR ([nif] LIKE N'%${escaped}%'))`;

      setOperationClientLoading(true);
      fetchOperationClients(filter, 15)
        .then(options => setOperationClientOptions(options))
        .catch(error => {
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setOperationClientLoading(false));
    }, 400);
  }

  // Shows the default client as the only option and returns its id for the field.
  function presetOperationClient(client) {
    if (operationClientSearchTimer.current) {
      clearTimeout(operationClientSearchTimer.current);
      operationClientSearchTimer.current = null;
    }
    setOperationClientLoading(false);
    setOperationClientOptions(client ? [mapOperationClientOption(client)] : []);
    return client ? client.id : undefined;
  }

  function getOperationClient(clientId) {
    const option = operationClientOptions.find(item => Number(item && item.id) === Number(clientId));
    return option && Number(option.id) > 0 ? { id: Number(option.id), name: getTrimmedString(option.name) } : null;
  }

  function renderOperationClientSelect(value, onChange) {
    return (
      <Select
        showSearch
        allowClear
        filterOption={false}
        value={value}
        onChange={onChange}
        options={operationClientOptions}
        loading={operationClientLoading}
        onSearch={searchOperationClients}
        optionLabelProp="name"
        placeholder={t('Type at least 3 characters')}
        notFoundContent={operationClientLoading ? t('Loading...') : t('No contacts found')}
      />
    );
  }

  // The client of a reversed premium payment: the «Cliente» of its income, else the holder of the paid policy accounts.
  function presetReversalClient(record) {
    const allocationId = Number(record && record.allocationId) || 0;
    if (allocationId <= 0 || reversalClientId) return;

    const formClient = getDefaultOperationClient(getFormClient(getMovementViewValue(record.group, 'jIncomeTypeForm')));
    if (formClient) {
      setReversalClientId(presetOperationClient(formClient));
      return;
    }

    setOperationClientLoading(true);
    fetchOperationClients(`[id] IN (SELECT a.[holderId] FROM [Account] a INNER JOIN [Transfer] tr ON tr.[destinationAccountId] = a.[id] WHERE tr.[allocationId] = ${allocationId} AND tr.[transactionCode] = 'PREMIUMPAY')`, 2)
      .then(options => {
        const client = options.length === 1 ? getDefaultOperationClient(options[0]) : null;
        if (!client) return;
        setOperationClientOptions(current => (current.some(item => Number(item && item.id) === client.id)
          ? current
          : [mapOperationClientOption(client)].concat(current)));
        setReversalClientId(current => current || client.id);
      })
      .catch(error => message.error(error && error.message ? error.message : String(error)))
      .finally(() => setOperationClientLoading(false));
  }

  // The credits a reversal creates (TRANSIT transfers of the allocation into the chosen account) keep the client
  // chosen in the reversal, so the Contact filter of the transit tab finds them.
  async function stampReversalCreditClient(allocationId, accountId, client) {
    const failure = t('The reversal was applied, but the client could not be saved on the credited movement.');
    const form = buildClientReferenceForm(client);
    const response = await exe('RepoTransfer', {
      operation: 'GET',
      filter: `allocationId = ${Number(allocationId)} AND transactionCode = 'TRANSIT' AND destinationAccountId = ${Number(accountId)}`,
      size: 100,
      page: 0
    });
    const credits = response && response.ok !== false
      ? getRows(response).filter(item => Number(item && item.id) > 0)
      : [];
    if (!form || !credits.length) throw new Error(failure);

    for (const credit of credits) {
      const result = await exe('SetField', {
        entity: 'Transfer',
        entityId: Number(credit.id),
        fieldValue: `jIncomeTypeForm=N'${escapeSqlString(form)}'`,
        raw: true
      });
      if (!result || result.ok === false) throw new Error(failure);
    }
  }

  function closePpxaApplyModal() {
    if (ppxaApplyAccountSearchTimer.current) {
      clearTimeout(ppxaApplyAccountSearchTimer.current);
      ppxaApplyAccountSearchTimer.current = null;
    }
    setPpxaApplyVisible(false);
    setPpxaApplyAccountOptions([]);
    presetOperationClient(null);
    ppxaApplyForm.resetFields();
  }

  function searchPpxaApplyAccounts(value) {
    const query = getTrimmedString(value);
    const currency = getTrimmedString(ppxaApplyForm.getFieldValue('currency')).toUpperCase();

    if (ppxaApplyAccountSearchTimer.current) {
      clearTimeout(ppxaApplyAccountSearchTimer.current);
      ppxaApplyAccountSearchTimer.current = null;
    }
    if (!query || !currency) {
      setPpxaApplyAccountOptions([]);
      return;
    }

    ppxaApplyAccountSearchTimer.current = setTimeout(() => {
      setPpxaApplyAccountLoading(true);
      exe('ExeChain', {
        chain: 'cmdSearchTransitAccounts',
        context: JSON.stringify({ page: 1, size: 10, accountName: query, currency: currency, showAll: true })
      })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Accounts could not be loaded.'));
          }
          setPpxaApplyAccountOptions(mapTransitAccountOptions(getAccountSearchRows(response))
            .filter(option => getTrimmedString(option && option.account && option.account.currency).toUpperCase() === currency));
        })
        .catch(error => {
          setPpxaApplyAccountOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setPpxaApplyAccountLoading(false));
    }, 250);
  }

  async function openPpxaApplyModal() {
    const summary = getSelectedTransitAccountsSummary();
    if (!summary.accounts.length) {
      message.warning(t('Select at least one line with available balance.'));
      return;
    }
    if (summary.currencies.length !== 1) {
      message.error(t('All selected transit accounts must have the same currency.'));
      return;
    }
    if (summary.total <= 0) {
      message.warning(t('The selected transit accounts have no available balance.'));
      return;
    }

    ppxaApplyForm.resetFields();
    setPpxaApplyAccountOptions([]);
    ppxaApplyForm.setFieldsValue({
      currency: summary.currencies[0],
      amount: Number(summary.total.toFixed(2)),
      reference: '',
      client: presetOperationClient(getSelectedTransitLinesDefaultClient(summary.accounts, getTransitLineSelectionEntries()))
    });
    setPpxaApplyVisible(true);
    setPpxaApplyAccountLoading(true);
    try {
      const response = await exe('RepoAccount', {
        operation: 'GET',
        filter: "accNo = 'PPXA'",
        size: 25,
        page: 0
      });
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The PPXA account could not be loaded.'));
      }
      const ppxaAccounts = getRows(response).filter(account =>
        getTrimmedString(account && account.accNo).toUpperCase() === 'PPXA'
        && getTrimmedString(account && account.currency).toUpperCase() === summary.currencies[0]
      );
      setPpxaApplyAccountOptions(mapTransitAccountOptions(ppxaAccounts));
      if (ppxaAccounts.length > 0) {
        ppxaApplyForm.setFieldsValue({ destinationAccount: Number(ppxaAccounts[0].id) });
      }
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setPpxaApplyAccountLoading(false);
    }
  }

  async function submitPpxaApply(values) {
    const summary = getSelectedTransitAccountsSummary();
    const destinationAccountId = Number(values && values.destinationAccount);
    const amount = Number(values && values.amount);
    const currency = getTrimmedString(values && values.currency).toUpperCase();
    const reference = getTrimmedString(values && values.reference);
    const client = getOperationClient(values && values.client);
    const destination = ppxaApplyAccountOptions.find(option => Number(option && option.value) === destinationAccountId);
    const destinationAccount = destination && destination.account;

    if (!summary.accounts.length) {
      message.error(t('Select at least one line with available balance.'));
      return;
    }
    if (summary.currencies.length !== 1 || summary.currencies[0] !== currency) {
      message.error(t('All selected transit accounts must have the same currency.'));
      return;
    }
    if (!Number.isFinite(destinationAccountId) || destinationAccountId <= 0) {
      message.error(t('Select a destination account.'));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      message.error(t('Enter an amount greater than zero.'));
      return;
    }
    if (amount > summary.total + 0.005) {
      message.error(t('The amount cannot exceed the available balance of the selected lines.'));
      return;
    }
    if (!reference) {
      message.error(t('Enter a reference.'));
      return;
    }
    if (!client) {
      message.error(t('Select a client.'));
      return;
    }
    if (summary.accounts.some(account => Number(account && account.id) === destinationAccountId)) {
      message.error(t('The destination account cannot be one of the selected source accounts.'));
      return;
    }

    const ppxaIncomeType = incomeTypeOptions.find(item =>
      getTrimmedString(item && item.internalType).toUpperCase() === 'PPXA'
    );
    if (!ppxaIncomeType) {
      message.error(t('The PPXA income type is not configured.'));
      return;
    }

    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      message.error(t('Select an open cash desk first.'));
      return;
    }

    setPpxaApplyLoading(true);
    const date = getCurrentUtcDateTime();
    const incomeType = getTrimmedString(ppxaIncomeType.value || ppxaIncomeType.code);
    const destinationName = getTrimmedString(destinationAccount && (destinationAccount.name || destinationAccount.accNo)) || 'PPXA';
    const concept = buildClientReferenceText(reference, client);
    const buildTransferEntity = (transferAmount, destinationId, destinationLabel, incomeForm) => ({
      currency: currency,
      amount: transferAmount,
      sourceAccountId: null,
      destinationAccountId: destinationId,
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
      destinationName: destinationLabel,
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
      jIncomeTypeForm: incomeForm || null,
      transferWorkspaceId: workspaceId,
      user: currentUserEmail || null
    });

    try {
      // The amount is taken from the selected lines, oldest first, across the selected accounts.
      const ppxaLines = distributeTransitLines(amount, getTransitLineSelectionEntries());
      const ppxaLinesByAccount = groupTransitLinesByAccount(ppxaLines);
      const sourceAccounts = summary.accounts.filter(account => ppxaLinesByAccount[String(account && account.id)]);
      for (const account of sourceAccounts) {
        const accountLines = ppxaLinesByAccount[String(account.id)];
        await checkTransitLines(account.id, sumTransitLines(accountLines), accountLines);
      }

      const createdTransfers = [];
      try {
        for (const account of sourceAccounts) {
          const accountLines = ppxaLinesByAccount[String(account.id)];
          const transferAmount = sumTransitLines(accountLines);
          if (transferAmount <= 0) continue;

          const sourceId = Number(account && account.id);
          const sourceName = getTrimmedString(account && (account.name || account.accNo)) || String(sourceId);
          const outgoing = await exe('RepoTransfer', {
            operation: 'ADD',
            entity: buildTransferEntity(-transferAmount, sourceId, sourceName, getTransitLinesOwnerForm(accountLines)),
            otherReceivables: [],
            execute: false
          });
          if (!outgoing || outgoing.ok === false) {
            throw new Error(outgoing && outgoing.msg ? outgoing.msg : t('The PPXA source transfer could not be created.'));
          }

          const outgoingTransfer = getRows(outgoing)[0] || {};
          const outgoingId = Number(outgoingTransfer.id || outgoingTransfer.transferId || 0);
          if (!Number.isFinite(outgoingId) || outgoingId <= 0) {
            throw new Error(t('The PPXA source transfer was created, but its movement identifier could not be identified.'));
          }
          createdTransfers.push({ id: outgoingId, amount: -transferAmount });
          await stampTransitLines(sourceId, 'PPXA', { transferId: outgoingId }, transferAmount, accountLines);
        }

        const response = await exe('RepoTransfer', {
          operation: 'ADD',
          entity: buildTransferEntity(amount, destinationAccountId, destinationName, buildClientReferenceForm(client)),
          otherReceivables: [],
          execute: false
        });
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The PPXA transfer could not be created.'));
        }

        const createdTransfer = getRows(response)[0] || {};
        const transferId = Number(createdTransfer.id || createdTransfer.transferId || 0);
        if (!Number.isFinite(transferId) || transferId <= 0) {
          throw new Error(t('The PPXA transfer was created, but its movement identifier could not be identified.'));
        }
        createdTransfers.push({ id: transferId, amount: amount });
      } catch (error) {
        await deletePendingTransitTransfers(createdTransfers);
        throw error;
      }

      for (const transfer of createdTransfers) {
        const executeResponse = await exe('DoTransfer', {
          transferId: transfer.id,
          transfer: null
        });
        if (!executeResponse || executeResponse.ok === false) {
          throw new Error(executeResponse && executeResponse.msg
            ? executeResponse.msg
            : t('The PPXA transfer movement could not be executed.'));
        }
      }

      closePpxaApplyModal();
      refreshTransitAfterOperation();
      message.success(t('The PPXA transfers were executed successfully.'));
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setPpxaApplyLoading(false);
    }
  }

  function openRefundMoneyModal() {
    const selectedAccount = getSingleSelectedTransitAccount(t('Select lines of a single transit account to return money.'));

    if (!selectedAccount) {
      return;
    }

    const selectedCurrency = getTrimmedString(selectedAccount.currency).toUpperCase();
    const currency = currencyOptions.some(option => getTrimmedString(option && option.value).toUpperCase() === selectedCurrency)
      ? selectedCurrency
      : currencyOptions[0] && currencyOptions[0].value;

    const beneficiary = getTrimmedString(selectedAccount.contactName || selectedAccount.holderName || selectedAccount.holder);
    const beneficiaryId = Number(selectedAccount.holderId || selectedAccount.contactId);
    const defaultBeneficiaryOption = Number.isFinite(beneficiaryId) && beneficiaryId > 0
      ? {
        value: beneficiaryId,
        name: beneficiary || t('Policy holder'),
        identifier: t('Policy holder'),
        label: (
          <div style={{ lineHeight: 1.25 }}>
            <div>{beneficiary || t('Policy holder')}</div>
            <div style={{ color: '#8c8c8c', fontSize: 11 }}>{t('Policy holder')} | #{beneficiaryId}</div>
          </div>
        )
      }
      : null;
    // A refund must always identify the beneficiary's destination account.
    // For the policy holder, its policy account is the initial destination.
    const needsManualDestination = true;
    const isPolicyBeneficiary = Number.isFinite(beneficiaryId)
      && beneficiaryId > 0
      && beneficiaryId === Number(selectedAccount.holderId || selectedAccount.contactId)
      && Number(selectedAccount.lifePolicyId || selectedAccount.policyId) > 0;
    const defaultDestinationOption = isPolicyBeneficiary
      ? mapTransitAccountOptions([selectedAccount])[0]
      : null;
    setRefundNeedsManualDestination(needsManualDestination);
    setRefundDestinationAccountOptions(defaultDestinationOption ? [defaultDestinationOption] : []);
    setRefundBeneficiaryOptions(defaultBeneficiaryOption ? [defaultBeneficiaryOption] : []);
    refundMoneyForm.setFieldsValue({
      currency: currency,
      sourceAccount: Number(selectedAccount.id),
      sourcePercentage: 100,
      amount: getSelectedTransitLinesTotal(selectedAccount.id),
      paymentMethod: undefined,
      beneficiary: defaultBeneficiaryOption ? beneficiaryId : undefined,
      accountId: defaultDestinationOption ? defaultDestinationOption.value : undefined,
      reference: ''
    });
    setRefundMoneyVisible(true);
    if (needsManualDestination && defaultBeneficiaryOption) {
      loadRefundDestinationAccounts('');
    }
  }

  function requiresManualRefundDestination(beneficiaryId, account) {
    const selectedBeneficiaryId = Number(beneficiaryId);
    const policyId = Number(account && (account.lifePolicyId || account.policyId));
    const holderId = Number(account && (account.holderId || account.contactId));
    return !Number.isFinite(policyId) || policyId <= 0
      || !Number.isFinite(holderId) || holderId <= 0
      || selectedBeneficiaryId !== holderId;
  }

  function openRefundAccountCreateModal() {
    const beneficiaryId = Number(refundMoneyForm.getFieldValue('beneficiary'));
    const currency = getTrimmedString(refundMoneyForm.getFieldValue('currency')).toUpperCase();
    if (!Number.isFinite(beneficiaryId) || beneficiaryId <= 0) {
      message.warning(t('Select a beneficiary before creating a destination account.'));
      return;
    }

    refundAccountCreateForm.setFieldsValue({
      name: '',
      currency: currency || undefined
    });
    setRefundAccountCreateVisible(true);
  }

  async function submitRefundAccountCreate(values) {
    const beneficiaryId = Number(refundMoneyForm.getFieldValue('beneficiary'));
    const name = getTrimmedString(values && values.name);
    const currency = getTrimmedString(values && values.currency).toUpperCase();
    if (!Number.isFinite(beneficiaryId) || beneficiaryId <= 0) {
      message.error(t('The beneficiary is invalid.'));
      return;
    }

    if (!name || !currency) return;

    setRefundAccountCreateLoading(true);
    try {
      const suffix = String(Date.now()).slice(-8);
      const accountNo = `DEV${beneficiaryId}-${suffix}`;
      const response = await exe('RepoAccount', {
        operation: 'ADD',
        entity: {
          id: 0,
          holderId: beneficiaryId,
          lifePolicyId: null,
          accNo: accountNo,
          type: 'TRANSIT',
          currency: currency,
          investmentPlanCode: null,
          name: name,
          contractId: null,
          code: 'REFUND',
          bankAccountOpenDate: null,
          bankAccountType: null,
          bankCode: null,
          openingAmount: 0,
          iban: null,
          branchCode: null,
          catalogAccountCode: null,
          creditId: null,
          pensionSchemeId: null,
          checkBookCode: null,
          fundId: null,
          pensionAccountType: null,
          pensionMemberId: null
        }
      });
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The destination account could not be created.'));
      }

      let createdAccount = getRows(response)[0]
        || (response.outData && !Array.isArray(response.outData) ? response.outData : null);
      let accountId = Number(createdAccount && (createdAccount.id || createdAccount.accountId));
      if (!Number.isFinite(accountId) || accountId <= 0) {
        const lookupResponse = await exe('RepoAccount', {
          operation: 'GET',
          filter: `holderId = ${beneficiaryId} AND accNo = '${escapeSqlString(accountNo)}'`,
          size: 1,
          page: 0
        });
        if (!lookupResponse || lookupResponse.ok === false) {
          throw new Error(lookupResponse && lookupResponse.msg
            ? lookupResponse.msg
            : t('The destination account could not be recovered after it was created.'));
        }
        createdAccount = getRows(lookupResponse)[0] || null;
        accountId = Number(createdAccount && (createdAccount.id || createdAccount.accountId));
      }
      if (!Number.isFinite(accountId) || accountId <= 0) {
        throw new Error(t('The destination account was created, but its identifier could not be identified.'));
      }

      const account = {
        ...createdAccount,
        id: accountId,
        holderId: beneficiaryId,
        name: getTrimmedString(createdAccount && createdAccount.name) || name,
        accNo: getTrimmedString(createdAccount && createdAccount.accNo) || accountNo,
        type: getTrimmedString(createdAccount && createdAccount.type) || 'TRANSIT',
        currency: getTrimmedString(createdAccount && createdAccount.currency) || currency
      };
      const option = mapTransitAccountOptions([account])[0];
      if (option) {
        setRefundDestinationAccountOptions(current => [option].concat(
          current.filter(item => Number(item && item.value) !== accountId)
        ));
      }
      refundMoneyForm.setFieldsValue({ accountId: accountId });
      setRefundAccountCreateVisible(false);
      refundAccountCreateForm.resetFields();
      message.success(t('Destination account created successfully.'));
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setRefundAccountCreateLoading(false);
    }
  }

  function updateRefundPercentage(value) {
    const percentage = Number(value);
    const selectedAccount = getSingleSelectedTransitAccount(t('Select lines of a single transit account to return money.'));
    if (!selectedAccount) return;
    const availableAmount = getSelectedTransitLinesTotal(selectedAccount.id);

    if (!Number.isFinite(percentage)) return;

    refundMoneyForm.setFieldsValue({
      sourcePercentage: percentage,
      amount: Number((availableAmount * percentage / 100).toFixed(2))
    });
  }

  function generateRefundReference() {
    const values = refundMoneyForm.getFieldsValue();
    const amount = getAuditNumber(values && values.amount);
    const currency = getTrimmedString(values && values.currency);
    const beneficiaryId = Number(values && values.beneficiary);
    const beneficiaryOption = refundBeneficiaryOptions.find(option => Number(option && option.value) === beneficiaryId);
    const beneficiary = getTrimmedString(beneficiaryOption && beneficiaryOption.name) || String(values && values.beneficiary || '');

    refundMoneyForm.setFieldsValue({
      reference: `${t('Refund of')} ${amount.toFixed(2)} ${currency} ${t('to')} ${beneficiary}`.trim()
    });
  }

  function closeRefundMoneyModal() {
    if (refundBeneficiarySearchTimer.current) {
      clearTimeout(refundBeneficiarySearchTimer.current);
      refundBeneficiarySearchTimer.current = null;
    }
    if (refundDestinationAccountSearchTimer.current) {
      clearTimeout(refundDestinationAccountSearchTimer.current);
      refundDestinationAccountSearchTimer.current = null;
    }
    setRefundMoneyVisible(false);
    setRefundBeneficiaryOptions([]);
    setRefundDestinationAccountOptions([]);
    setRefundDestinationAccountLoading(false);
    setRefundNeedsManualDestination(false);
    setRefundAccountCreateVisible(false);
    refundAccountCreateForm.resetFields();
    refundMoneyForm.resetFields();
  }

  function getRefundFixedFundsOption() {
    // RepoExternalSourceCatalog returns the fixed-funds destination first.
    return externalSourceOptions[0] || null;
  }

  function getRefundIncomeType() {
    return incomeTypeOptions.find(item =>
      getTrimmedString(item && item.internalType).toUpperCase() === 'REFUND'
    );
  }

  async function resolveRefundDestinationAccount() {
    const fixedFundsOption = getRefundFixedFundsOption();
    if (!fixedFundsOption) {
      throw new Error(t('The Fixed funds destination is not configured.'));
    }

    const destinationAccountId = await resolveNewIncomeDestinationAccount({
      incomeType: 'REFUND',
      destination: fixedFundsOption.value
    });

    return {
      option: fixedFundsOption,
      accountId: destinationAccountId
    };
  }

  async function createRefundTransfer(values, selectedAccount, lifePolicyId, total, requestId) {
    const refundIncomeType = getRefundIncomeType();
    if (!refundIncomeType) {
      throw new Error(t('The REFUND income type is not configured.'));
    }

    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    const sourceAccountId = Number(values && values.sourceAccount);
    const currency = getTrimmedString(values && values.currency);
    const paymentMethod = getTrimmedString(values && values.paymentMethod);
    const reference = getTrimmedString(values && values.reference);
    const transferReference = `Sol. ${requestId} ${reference}`.trim();
    const beneficiaryId = Number(values && values.beneficiary);
    const beneficiaryOption = refundBeneficiaryOptions.find(option => Number(option && option.value) === beneficiaryId);
    const beneficiary = getTrimmedString(beneficiaryOption && beneficiaryOption.name);
    const incomeType = getTrimmedString(refundIncomeType.value || refundIncomeType.code);
    const refundDestination = await resolveRefundDestinationAccount();
    const paymentMethodOption = getRefundPaymentMethodOptions().find(item =>
      getTrimmedString(item && item.value) === paymentMethod
    );
    const paymentMethodName = getTrimmedString(paymentMethodOption && paymentMethodOption.label) || paymentMethod;

    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      throw new Error(t('Select an open cash desk first.'));
    }

    const transferResponse = await exe('RepoTransfer', {
      operation: 'ADD',
      entity: {
        currency: currency,
        amount: Number(total.toFixed(2)),
        sourceAccountId: sourceAccountId,
        sourceName: getTrimmedString(selectedAccount && selectedAccount.name),
        destinationAccountId: refundDestination.accountId,
        destinationName: beneficiary,
        sourceExternal: refundDestination.option.value,
        concept: transferReference,
        paymentMethod: paymentMethod,
        paymentMethodName: paymentMethodName,
        SplitPayments: [{
          paymentMethod: paymentMethod,
          paymentMethodName: paymentMethodName,
          amount: Number(total.toFixed(2)),
          currency: currency,
          id: 0,
          transferId: 0
        }],
        transactionCode: 'REFUND',
        ...(Number(lifePolicyId) > 0 ? { lifePolicyId: Number(lifePolicyId) } : {}),
        date: getCurrentUtcDateTime(),
        status: 0,
        executed: false,
        isExternal: true,
        incomeType: incomeType,
        transferWorkspaceId: workspaceId,
        user: currentUserEmail || null
      },
      otherReceivables: []
    });

    if (!transferResponse || transferResponse.ok === false) {
      throw new Error(transferResponse && transferResponse.msg
        ? transferResponse.msg
        : t('The refund transfer could not be created.'));
    }

    const transferRows = getRows(transferResponse);
    const transfer = transferRows[0]
      || (transferResponse.outData && !Array.isArray(transferResponse.outData)
        ? transferResponse.outData
        : null);
    const transferId = Number(transfer && (transfer.id || transfer.transferId));
    if (!Number.isFinite(transferId) || transferId <= 0) {
      throw new Error(t('The refund transfer was created, but its identifier could not be identified.'));
    }

    const executionResponse = await exe('DoTransfer', { transferId: transferId, transfer: null });
    if (!executionResponse || executionResponse.ok === false) {
      throw new Error(executionResponse && executionResponse.msg
        ? executionResponse.msg
        : t('The refund transfer could not be executed.'));
    }

    return transferId;
  }

  async function submitRefundMoneyRequest(values) {
    const selectedAccount = getSingleSelectedTransitAccount(t('Select lines of a single transit account to return money.'));
    const selectedPolicyId = Number(selectedAccount && (selectedAccount.lifePolicyId || selectedAccount.policyId));
    const lifePolicyId = Number.isFinite(selectedPolicyId) && selectedPolicyId > 0 ? selectedPolicyId : null;
    const sourceAccountId = Number(values && values.sourceAccount);
    const contactId = Number(values && values.beneficiary);
    const total = getAuditNumber(values && values.amount);

    if (!selectedAccount) {
      return;
    }

    if (!Number.isFinite(sourceAccountId) || sourceAccountId <= 0) {
      message.error(t('The source account is invalid.'));
      return;
    }

    if (!Number.isFinite(contactId) || contactId <= 0) {
      message.error(t('The beneficiary is invalid.'));
      return;
    }

    const branch = getTrimmedString(
      selectedCashierRow && (
        selectedCashierRow.branchCode
        || (selectedCashierRow.Branch && (selectedCashierRow.Branch.code || selectedCashierRow.Branch.id))
      )
    );
    if (!branch) {
      message.error(t('The open cash desk has no branch configured.'));
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      message.error(t('Enter a valid amount.'));
      return;
    }

    if (total > getSelectedTransitLinesTotal(selectedAccount.id) + 0.005) {
      message.error(t('The amount cannot exceed the available balance of the selected lines.'));
      return;
    }

    const manualDestinationRequired = refundNeedsManualDestination
      || requiresManualRefundDestination(contactId, selectedAccount);
    const manualDestinationAccountId = Number(values && values.accountId);
    if (manualDestinationRequired
      && (!Number.isFinite(manualDestinationAccountId) || manualDestinationAccountId <= 0)) {
      message.error(t('Select a destination account.'));
      return;
    }

    setRefundMoneySubmitting(true);
    try {
      const refundLines = distributeTransitLines(total, getSelectedTransitLineEntries(selectedAccount.id));
      await checkTransitLines(selectedAccount.id, total, refundLines);

      const requestCommand = !manualDestinationRequired && lifePolicyId !== null
        ? 'DoPaymentRequest'
        : 'DoManualPaymentRequest';
      const requestPayload = {
        contactId: contactId,
        currency: getTrimmedString(values && values.currency),
        grossAmount: Number(total.toFixed(2)),
        paymentMethodCode: getTrimmedString(values && values.paymentMethod),
        branch: branch,
        receiptTypeCode: '1',
        paymentType: '15',
        taxes: 0,
        retentions: 0,
        deductions: 0,
        total: total,
        sourceAccountId: sourceAccountId,
        requiresFiscalNumber: false,
        fiscalNumber: null,
        reference: getTrimmedString(values && values.reference),
        concept: 'Devoluciones de primas por cargo a cuentas o préstamos del cliente',
        noWorkflow: false,
        Taxes: null,
        CostCenters: null
      };

      if (requestCommand === 'DoPaymentRequest') {
        requestPayload.lifePolicyId = lifePolicyId;
      } else {
        requestPayload.accountId = manualDestinationAccountId;
        requestPayload.producer = 'MANUAL';
      }

      const response = await exe(requestCommand, requestPayload);

      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The refund request could not be created.'));
      }

      const requestRows = getRows(response);
      const request = requestRows[0]
        || (response.outData && !Array.isArray(response.outData) && typeof response.outData === 'object'
          ? response.outData
          : null);
      const requestMessage = getTrimmedString(response && response.msg);
      const requestMatch = requestMessage.match(/(?:Solicitud|Request)\s+(\d+)\s+(?:creada|created)/i);
      const requestId = Number(request && (request.id || request.requestId))
        || Number(response && response.outData)
        || (requestMatch ? Number(requestMatch[1]) : 0);

      if (!Number.isFinite(requestId) || requestId <= 0) {
        throw new Error(t('The refund request was created, but its identifier could not be identified.'));
      }

      // The request now holds the lines it takes; if that cannot be recorded it still reserves the oldest ones.
      let refundLinesWarning = '';
      try {
        await stampTransitLines(selectedAccount.id, 'REFUND', { requestId: requestId }, total, refundLines);
      } catch (stampError) {
        refundLinesWarning = stampError && stampError.message ? stampError.message : String(stampError);
      }

      await createRefundTransfer(
        values,
        selectedAccount,
        requestCommand === 'DoPaymentRequest' ? lifePolicyId : null,
        total,
        requestId
      );

      message.success(response.msg || t('Refund request and transfer created successfully.'));
      if (refundLinesWarning) {
        message.warning(`${t('The request was created, but its lines could not be recorded')}: ${refundLinesWarning}`);
      }
      closeRefundMoneyModal();
      refreshTransitAfterOperation();
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setRefundMoneySubmitting(false);
    }
  }

  function openAccountTransferModal() {
    const account = getSingleSelectedTransitAccount(t('Select lines of a single transit account to transfer them.'));
    if (!account) return;

    const available = getSelectedTransitLinesTotal(account.id);
    accountTransferForm.resetFields();
    setAccountTransferSourceBalance(available);
    setAccountTransferSearchTarget(null);
    setAccountTransferAccountOptions([]);
    setAccountTransferSourceOption(mapTransitAccountOptions([account])[0] || null);
    accountTransferForm.setFieldsValue({
      currency: getTrimmedString(account.currency).toUpperCase() || (currencyOptions[0] && currencyOptions[0].value),
      externalSource: false,
      sourceAccount: Number(account.id),
      sourceName: getTrimmedString(account.contactName || account.holderName || account.holder),
      amount: available,
      client: presetOperationClient(getSelectedTransitLinesDefaultClient([account], getSelectedTransitLineEntries(account.id)))
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
    setAccountTransferSourceOption(null);
    presetOperationClient(null);
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
        context: JSON.stringify({ page: 1, size: 10, accountName: text, currency: currency, showAll: true })
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

  function updateAccountTransferDestinationContact(accountId) {
    const selectedOption = accountTransferAccountOptions.find(option => Number(option && option.value) === Number(accountId));
    const account = selectedOption && selectedOption.account;
    accountTransferForm.setFieldsValue({
      destinationName: getTrimmedString(account && (account.contactName || account.holderName || account.holder))
    });
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

    const client = getOperationClient(values && values.client);
    if (!client) {
      message.error(t('Select a client.'));
      return;
    }

    const currency = getTrimmedString(values && values.currency);
    const concept = buildClientReferenceText(values && values.reference, client);
    const sourceName = getTrimmedString(values && values.sourceName);
    const destinationName = getTrimmedString(values && values.destinationName);
    const incomeType = getTrimmedString(depositPaymentType.value || depositPaymentType.code);
    const date = getCurrentUtcDateTime();

    // Each movement points only to its destination account, matching the cash income model.
    const buildTransferEntity = (transferAmount, destinationAccount, accountName, incomeForm) => ({
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
      jIncomeTypeForm: incomeForm || null,
      transferWorkspaceId: workspaceId,
      user: currentUserEmail || null
    });

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
      const transferLines = distributeTransitLines(amount, getSelectedTransitLineEntries(sourceAccountId));
      await checkTransitLines(sourceAccountId, amount, transferLines);
      const outgoingEntity = buildTransferEntity(-amount, sourceAccountId, sourceName, getTransitLinesOwnerForm(transferLines));
      const incomingEntity = buildTransferEntity(amount, destinationAccountId, destinationName, buildClientReferenceForm(client));

      const createdTransfers = [];
      try {
        const outgoingTransfer = await createTransfer(outgoingEntity);
        createdTransfers.push(outgoingTransfer);
        const incomingTransfer = await createTransfer(incomingEntity);
        createdTransfers.push(incomingTransfer);
        await stampTransitLines(sourceAccountId, 'TRANSFER', { transferId: outgoingTransfer.id }, amount, transferLines);
      } catch (error) {
        await deletePendingTransitTransfers(createdTransfers);
        throw error;
      }

      closeAccountTransferModal();
      refreshTransitAfterOperation();
      loadMovements({ pagination: { current: 1, pageSize: movementPagination.pageSize } });
      showAccountTransferExecutionConfirm(createdTransfers);
    } catch (error) {
      message.error(error && error.message ? error.message : String(error));
    }
  }

  function getCurrentUtcDateTime() {
    return new Date().toISOString();
  }

  function getDatePickerValue(dateLike) {
    if (typeof moment !== 'undefined') {
      return moment(dateLike);
    }

    return new Date(dateLike);
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
        const paymentMethods = getRows(paymentResponse);
        setAllPaymentMethodOptions(paymentMethods.map(item => ({
          value: item && item.code,
          label: getTrimmedString(item && item.name),
          formId: Number(item && item.formId) > 0 ? Number(item.formId) : 0
        })).filter(item => item.value));
        const cashierPaymentMethodCodes = ['DEP', 'CH', 'TCD', 'OT'];
        setPaymentMethodOptions(paymentMethods
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
    return Number.isFinite(amount) ? amount : 0;
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
    const payer = movementPayerOptions.find(item => String(item.value) === String(values && values.payerId));
    const nextFilters = {
      pending: values && values.pending === true,
      transferId: Number.isInteger(transferId) && transferId > 0 ? transferId : null,
      amount: hasAmount && Number.isFinite(amount) && amount >= 0 ? amount : null,
      incomeType: incomeType || null,
      policy: getTrimmedString(values && values.policy) || null,
      payerId: payer && Number(payer.id) > 0 ? Number(payer.id) : null,
      payerName: payer && payer.name ? payer.name : null
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
    if (movementPayerSearchTimer.current) {
      clearTimeout(movementPayerSearchTimer.current);
      movementPayerSearchTimer.current = null;
    }
    setMovementPayerOptions([]);
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
    if (!/^-?\d*(\.\d*)?$/.test(raw)) return null;

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
    return ['TRANSIT', 'DEPOPAYMENT', 'PPXA', 'REFUND'].includes(internalType);
  }

  function isVisibleNewIncomeType(option, includeRefund = false) {
    const internalType = getTrimmedString(option && option.internalType).toUpperCase();
    return !internalType.startsWith('DEPOSIT-') && (includeRefund || internalType !== 'REFUND');
  }

  function normalizeIncomeTypeFormName(value) {
    return getTrimmedString(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '');
  }

  function isPremiumContactForm(form) {
    return ['name', 'code', 'formName'].some(property =>
      normalizeIncomeTypeFormName(form && form[property]) === 'frmcontactoprimaanticipada'
    );
  }

  function getPremiumContactFormContext(form) {
    const baseContext = { exe: exe };
    if (!collectionChargeVisible || !isPremiumContactForm(form)) return baseContext;

    const selectedRow = getSelectedCollectionRows()[0] || {};
    const policyRow = transitCollectionPolicyRow || {};
    const account = transitCollectionAccount || {};
    const policyId = Number(
      selectedRow.lifePolicyId
      || selectedRow.policyId
      || policyRow.lifePolicyId
      || policyRow.policyId
      || account.lifePolicyId
      || account.policyId
      || 0
    );
    const holderId = Number(
      selectedRow.holderId
      || policyRow.holderId
      || account.holderId
      || account.contactId
      || 0
    );
    const holderName = getTrimmedString(
      selectedRow.payer
      || selectedRow.holderName
      || selectedRow.holder
      || policyRow.payer
      || policyRow.holderName
      || account.contactName
      || account.holderName
      || account.holder
    );
    const params = {
      policyId: Number.isFinite(policyId) && policyId > 0 ? policyId : 0,
      holderId: Number.isFinite(holderId) && holderId > 0 ? holderId : 0,
      holderName: holderName
    };

    return {
      ...baseContext,
      ...params,
      params: params
    };
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

  async function loadPpxaNewIncomeDestination(currencyValue) {
    const currency = getTrimmedString(currencyValue).toUpperCase();
    if (!currency) {
      setNewIncomeDestinationAccountOptions([]);
      newIncomeForm.setFieldsValue({ destination: undefined });
      return;
    }

    setNewIncomeDestinationAccountLoading(true);
    try {
      const response = await exe('RepoAccount', {
        operation: 'GET',
        filter: "accNo = 'PPXA'",
        size: 25,
        page: 0
      });
      if (!response || response.ok === false) {
        throw new Error(response && response.msg ? response.msg : t('The PPXA account could not be loaded.'));
      }

      const options = mapTransitAccountOptions(getRows(response).filter(account =>
        getTrimmedString(account && account.accNo).toUpperCase() === 'PPXA'
        && getTrimmedString(account && account.currency).toUpperCase() === currency
      ));
      setNewIncomeDestinationAccountOptions(options);
      newIncomeForm.setFieldsValue({ destination: options.length > 0 ? options[0].value : undefined });
      updateNewIncomeTransitContact(options[0] && options[0].account, 'PPXA');
    } catch (error) {
      setNewIncomeDestinationAccountOptions([]);
      newIncomeForm.setFieldsValue({ destination: undefined });
      message.error(error && error.message ? error.message : String(error));
    } finally {
      setNewIncomeDestinationAccountLoading(false);
    }
  }

  function updateNewIncomeType(value) {
    setNewIncomeTypeCode(value);
    setNewIncomeTransitContact(null);
    newIncomeForm.setFieldsValue({ destination: undefined });
    setNewIncomeDestinationAccountOptions([]);

    const selectedIncomeType = getIncomeTypeOption(value);
    const internalType = getTrimmedString(selectedIncomeType && selectedIncomeType.internalType).toUpperCase();
    if (internalType === 'PPXA') {
      const currency = newIncomeForm.getFieldValue('currency')
        || (currencyOptions[0] && currencyOptions[0].value);
      loadPpxaNewIncomeDestination(currency);
    }

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
        context: JSON.stringify({ page: 1, size: 10, accountName: text, showAll: true })
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

  function isFixedFundsTransitAccount(account) {
    const fixedFundsOption = externalSourceOptions[0];
    const fixedFundsAccountNo = getTrimmedString(fixedFundsOption && fixedFundsOption.destinationAccNo).toUpperCase();
    const accountNo = getTrimmedString(account && account.accNo).toUpperCase();
    const accountName = getTrimmedString(account && account.name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return Boolean(fixedFundsAccountNo && accountNo === fixedFundsAccountNo)
      || accountName === 'fondos fijos'
      || accountName === 'fixed funds';
  }

  function getTransitAccountContact(account) {
    const contact = account && (account.Contact || account.Holder || account.contact || account.holder);
    const contactId = Number(
      account && (account.contactId || account.holderId || account.payerId)
      || contact && contact.id
    );
    const contactName = getTrimmedString(
      account && (account.contactName || account.holderName || account.holder)
      || contact && (contact.FullName || contact.fullName || [contact.name, contact.surname1, contact.surname2].filter(Boolean).join(' '))
    );

    if (!Number.isFinite(contactId) || contactId <= 0) return null;

    return {
      id: contactId,
      name: contactName || String(contactId),
      accountId: Number(account && (account.id || account.accountId)) || 0
    };
  }

  function updateNewIncomeTransitContact(account, incomeTypeCode) {
    const canSyncContact = collectionChargeVisible
      || (!movementEditVisible && activeTab === 'new-income');
    if (!canSyncContact
      || !isTransitIncomeType(incomeTypeCode || newIncomeTypeCode)
      || isFixedFundsTransitAccount(account)) {
      setNewIncomeTransitContact(null);
      return;
    }

    const contact = getTransitAccountContact(account);
    const isGlobalContact = getTrimmedString(contact && contact.name)
      .toUpperCase()
      .indexOf('ASEGURADORA GLOBAL') >= 0;

    // Las cuentas propias no determinan el cliente del ingreso. Para las de
    // terceros, el cliente se toma de la cuenta y no puede modificarse.
    setNewIncomeTransitContact(contact && !isGlobalContact ? contact : null);
  }

  function applyNewIncomeTransitContact(container) {
    const contact = newIncomeTransitContact;
    if (!container) return;

    if (!contact) {
      container.querySelectorAll('[data-transit-contact-locked="true"]').forEach(control => {
        control.disabled = false;
        control.readOnly = false;
        control.removeAttribute('data-transit-contact-locked');
        control.removeAttribute('aria-disabled');
        control.value = '';
      });
      const previousContactCodeInput = container.querySelector('#hiddenCodigoCliente');
      if (previousContactCodeInput) previousContactCodeInput.value = '';
      return;
    }

    const contactInput = container.querySelector('#clientePA');
    const contactCodeInput = container.querySelector('#hiddenCodigoCliente');
    const identificationInput = container.querySelector('#identificacionPagador');
    if (contactInput) {
      contactInput.value = contact.name;
      contactInput.disabled = true;
      contactInput.readOnly = true;
      contactInput.setAttribute('data-transit-contact-locked', 'true');
      contactInput.setAttribute('aria-disabled', 'true');
      if (typeof $ !== 'undefined') {
        $(contactInput).data('selectedItem', {
          codigo: contact.id,
          nombreCompleto: contact.name
        });
      }
    }
    if (contactCodeInput) {
      contactCodeInput.value = String(contact.id);
      if (!contactCodeInput.getAttribute('name')) {
        contactCodeInput.setAttribute('name', 'hiddenCodigoCliente');
      }
    }
    if (identificationInput) {
      identificationInput.disabled = true;
      identificationInput.setAttribute('data-transit-contact-locked', 'true');
      identificationInput.setAttribute('aria-disabled', 'true');
    }

    container.querySelectorAll('[name]').forEach(control => {
      const normalizedName = getTrimmedString(control.getAttribute('name'))
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const isContactField = ['contact', 'contactid', 'contactname', 'holderid', 'payerid'].includes(normalizedName);
      if (!isContactField) return;

      if (control.tagName.toLowerCase() === 'select'
        && !Array.from(control.options).some(option => String(option.value) === String(contact.id))) {
        control.add(new Option(contact.name, String(contact.id)));
      }

      control.value = normalizedName === 'contactname' ? contact.name : String(contact.id);
      control.setAttribute('data-transit-contact-locked', 'true');
      control.disabled = true;
      control.readOnly = true;
      control.setAttribute('aria-disabled', 'true');
    });
  }

  function loadNewIncomeAccountSearch(values, pagination, targetOverride) {
    const source = values || newIncomeAccountSearchForm.getFieldsValue();
    const currentPage = Number(pagination && pagination.current) || 1;
    const pageSize = Number(pagination && pagination.pageSize) || 10;
    const searchTarget = targetOverride || accountTransferSearchTarget;
    const isRefundAccountSearch = searchTarget === 'refundDestinationAccount';
    const contactId = isRefundAccountSearch
      ? Number(refundMoneyForm.getFieldValue('beneficiary'))
      : Number(source.contact);
    const isAccountTransferSearch = searchTarget === 'sourceAccount'
      || searchTarget === 'destinationAccount';
    const transferCurrency = isRefundAccountSearch
      ? getTrimmedString(refundMoneyForm.getFieldValue('currency')).toUpperCase()
      : isAccountTransferSearch
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
        currency: transferCurrency || undefined,
        includeAllTypes: isRefundAccountSearch,
        showAll: true
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

  function openRefundDestinationAccountSearch() {
    const beneficiaryId = Number(refundMoneyForm.getFieldValue('beneficiary'));
    if (!Number.isFinite(beneficiaryId) || beneficiaryId <= 0) {
      message.warning(t('Select a beneficiary before searching for a destination account.'));
      return;
    }

    newIncomeAccountSearchForm.resetFields();
    setAccountTransferSearchTarget('refundDestinationAccount');
    setNewIncomeAccountSearchRows([]);
    setNewIncomeAccountSearchTotal(0);
    setNewIncomeAccountSearchPagination({ current: 1, pageSize: 10 });
    newIncomeAccountSearchForm.setFieldsValue({ contact: beneficiaryId });
    setNewIncomeAccountSearchVisible(true);
    loadNewIncomeAccountSearch(
      { contact: beneficiaryId, accountName: '', policy: '' },
      { current: 1, pageSize: 10 },
      'refundDestinationAccount'
    );
  }

  function loadRefundDestinationAccounts(value) {
    const accountName = getTrimmedString(value);
    const beneficiaryId = Number(refundMoneyForm.getFieldValue('beneficiary'));
    const currency = getTrimmedString(refundMoneyForm.getFieldValue('currency')).toUpperCase();

    if (refundDestinationAccountSearchTimer.current) {
      clearTimeout(refundDestinationAccountSearchTimer.current);
      refundDestinationAccountSearchTimer.current = null;
    }

    if (!Number.isFinite(beneficiaryId) || beneficiaryId <= 0 || !currency) {
      setRefundDestinationAccountOptions([]);
      return;
    }

    refundDestinationAccountSearchTimer.current = setTimeout(() => {
      setRefundDestinationAccountLoading(true);
      exe('ExeChain', {
        chain: 'cmdSearchTransitAccounts',
        context: JSON.stringify({
          page: 1,
          size: 50,
          accountName: accountName,
          policy: '',
          holderId: beneficiaryId,
          currency: currency,
          includeAllTypes: true,
          showAll: true
        })
      })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Accounts could not be loaded.'));
          }

          const options = mapTransitAccountOptions(getAccountSearchRows(response))
            .filter(option => getTrimmedString(option && option.account && option.account.currency).toUpperCase() === currency);
          setRefundDestinationAccountOptions(options);
        })
        .catch(error => {
          setRefundDestinationAccountOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setRefundDestinationAccountLoading(false));
    }, 250);
  }

  function clearNewIncomeAccountSearch() {
    const keepRefundBeneficiary = accountTransferSearchTarget === 'refundDestinationAccount'
      ? Number(refundMoneyForm.getFieldValue('beneficiary'))
      : 0;
    newIncomeAccountSearchForm.resetFields();
    if (keepRefundBeneficiary > 0) {
      newIncomeAccountSearchForm.setFieldsValue({ contact: keepRefundBeneficiary });
    }
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
      updateNewIncomeTransitContact(account);
      setAccountTransferSearchTarget(null);
      setNewIncomeAccountSearchVisible(false);
      return;
    }

    if (accountTransferSearchTarget === 'destinationAccount') {
      const contactName = getTrimmedString(account && (account.contactName || account.holderName || account.holder));
      const options = mapTransitAccountOptions([account]);

      setAccountTransferAccountOptions(current => options.concat(
        current.filter(item => Number(item.value) !== id)
      ));
      accountTransferForm.setFieldsValue({
        destinationAccount: id,
        destinationName: contactName
      });
      setAccountTransferSearchTarget(null);
      setNewIncomeAccountSearchVisible(false);
      return;
    }

    if (accountTransferSearchTarget === 'refundDestinationAccount') {
      const options = mapTransitAccountOptions([account]);
      const selectedOption = options[0];
      if (!selectedOption) return;

      setRefundDestinationAccountOptions(current => [selectedOption].concat(
        current.filter(option => Number(option && option.value) !== id)
      ));
      refundMoneyForm.setFieldsValue({ accountId: id });
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
    setNewIncomeTransitContact(null);
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

      const typeContainer = document.getElementById(`cashier-income-type-form-${getNewIncomeFormScope()}`)
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

      const container = document.getElementById(`cashier-payment-form-${payment.key}-${getNewIncomeFormScope()}`)
        || newIncomeFormRefs.current[payment.key];
      const definition = getPaymentFormDefinition(getDynamicFormDefinition(config.form));
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
    const container = document.getElementById(`cashier-payment-form-${paymentKey}-${getNewIncomeFormScope()}`)
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

    if (!Array.isArray(definition)) return null;

    // Some saved payment forms contain duplicated controls with the same name.
    // Keep one definition per field so the form is rendered only once.
    const fieldNames = new Set();
    return definition.filter(field => {
      const name = getTrimmedString(field && field.name);
      if (!name) return true;
      if (fieldNames.has(name)) return false;
      fieldNames.add(name);
      return true;
    });
  }

  function normalizePaymentFormFieldText(value) {
    return getTrimmedString(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .replace(/\d+$/, '');
  }

  function getPaymentFormFieldKey(field) {
    const name = normalizePaymentFormFieldText(field && field.name);
    const label = normalizePaymentFormFieldText(field && field.label);

    if (name.includes('numerocheque') || label.includes('numerodecheque')) return 'numeroCheque';
    if (name.includes('fechacheque') || label.includes('fechadelcheque')) return 'fechaCheque';
    if (name.includes('bancocheque') || label === 'banco') return 'bancoCheque';
    if (name.includes('numerotarjeta') || label.includes('numerodetarjeta')) return 'numeroTarjeta';
    return '';
  }

  function getPaymentFormDefinition(formData) {
    const seen = new Set();
    return (Array.isArray(formData) ? formData : []).filter(field => {
      const key = getPaymentFormFieldKey(field);
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function removeDuplicatedPaymentRenderedFields(container) {
    if (!container) return;

    const seen = new Set();
    const groups = [];
    const registeredGroups = new Set();

    container.querySelectorAll('label').forEach(label => {
      const group = label.closest('.form-group') || label.parentElement;
      if (!group || group === container || registeredGroups.has(group)) return;
      registeredGroups.add(group);
      groups.push(group);
    });

    container.querySelectorAll('[name]').forEach(control => {
      const group = control.closest('.form-group') || control.parentElement;
      if (!group || group === container || registeredGroups.has(group)) return;
      registeredGroups.add(group);
      groups.push(group);
    });

    groups.forEach(group => {
      const label = group.querySelector('label');
      const control = group.querySelector('[name]');
      const key = getPaymentFormFieldKey({
        label: label ? label.textContent : '',
        name: control ? control.getAttribute('name') : ''
      });

      if (!key) return;
      if (!seen.has(key)) {
        seen.add(key);
        return;
      }

      group.remove();
    });
  }

  function schedulePaymentRenderedFieldsCleanup(container) {
    removeDuplicatedPaymentRenderedFields(container);
    [0, 100, 300].forEach(delay => {
      setTimeout(() => removeDuplicatedPaymentRenderedFields(container), delay);
    });
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
    const container = document.getElementById(`cashier-payment-form-${paymentKey}-${getNewIncomeFormScope()}`)
      || newIncomeFormRefs.current[paymentKey];
    return getDynamicFormJson(config, container, form => getPaymentFormDefinition(getDynamicFormDefinition(form)));
  }

  function getIncomeTypeFormJson() {
    const container = document.getElementById(`cashier-income-type-form-${getNewIncomeFormScope()}`)
      || newIncomeTypeFormRef.current;
    return getDynamicFormJson(newIncomeTypeDynamicForm, container);
  }

  function getNewIncomeFormScope() {
    if (movementEditVisible) return 'edit';
    if (collectionChargeVisible) return 'premium';
    return 'new';
  }

  function getDynamicFormJson(config, container, getDefinition) {
    if (!config || !config.form) return null;

    const definition = typeof getDefinition === 'function'
      ? getDefinition(config.form)
      : getDynamicFormDefinition(config.form);
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

      if (getNewIncomeTotal() === 0) {
        message.error(t('The total payment amount cannot be zero.'));
        return;
      }

      const invalidPaymentAmount = newIncomePayments.some(payment => {
        const amount = parseIncomeAmount(payment.amount);
        return !payment.methodCode || (transitCollectionMode ? amount <= 0 : amount === 0);
      });
      if (invalidPaymentAmount) {
        message.error(t('Complete the payment method and enter a non-zero amount for every payment.'));
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

    if (validTransfers.length < 2) {
      message.error(t('The account transfer movements are required.'));
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

    if (validTransfers.length < 2) {
      message.error(t('The account transfer movements are required.'));
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
          <div style={{ marginTop: 8 }}>{t('Approval will execute all outgoing and incoming movements.')}</div>
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
          <div style={{ marginTop: 8 }}>{t('Do you want to execute all movements now?')}</div>
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
      if (!config || config.loading || !config.form) return;
      if (typeof $ === 'undefined' || !$.fn || typeof $.fn.formRender !== 'function') return;

      const formData = getPaymentFormDefinition(getDynamicFormDefinition(config.form));
      if (!formData) return;

      document.querySelectorAll(`[id^="cashier-payment-form-${paymentKey}-"]`).forEach(container => {
        const formSignature = JSON.stringify(formData);
        if (container.dataset.formSignature === formSignature) {
          schedulePaymentRenderedFieldsCleanup(container);
          return;
        }

        container.innerHTML = '';
        $(container).formRender({ formData: formData });
        schedulePaymentRenderedFieldsCleanup(container);
        applyDynamicFormLayout(container);
        container.dataset.formSignature = formSignature;

        try {
          evalNewIncomeFormLogic(config.form.logic, { exe: exe });
          schedulePaymentRenderedFieldsCleanup(container);
        } catch (error) {
          message.error(error && error.message ? error.message : String(error));
        }
      });
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

      const containers = document.querySelectorAll('[id^="cashier-income-type-form-"]');
      if (!containers.length) {
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

      containers.forEach(container => {
        container.innerHTML = '';
        $(container).formRender({ formData: formData });
        applyDynamicFormLayout(container);
        applyNewIncomeTransitContact(container);

        try {
          evalNewIncomeFormLogic(config.form.logic, getPremiumContactFormContext(config.form));
          applyNewIncomeTransitContact(container);
        } catch (error) {
          message.error(error && error.message ? error.message : String(error));
        }
      });
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
  }, [newIncomeTypeDynamicForm, newIncomeTransitContact, collectionChargeVisible, movementEditVisible, activeTab]);

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

  function searchMovementPayers(value) {
    const searchText = getTrimmedString(value);
    const isNumericId = /^\d+$/.test(searchText);

    if (movementPayerSearchTimer.current) {
      clearTimeout(movementPayerSearchTimer.current);
      movementPayerSearchTimer.current = null;
    }

    if ((!isNumericId && searchText.length < 3) || !searchText) {
      setMovementPayerOptions([]);
      setMovementPayerLoading(false);
      return;
    }

    movementPayerSearchTimer.current = setTimeout(() => {
      const escaped = escapeSqlString(searchText);
      const filter = isNumericId
        ? `[id] = ${Number(searchText)}`
        : `(([name] LIKE N'%${escaped}%') OR ([surname1] LIKE N'%${escaped}%') OR ([surname2] LIKE N'%${escaped}%') OR ([cnp] LIKE N'%${escaped}%') OR ([nif] LIKE N'%${escaped}%'))`;

      setMovementPayerLoading(true);
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
            const id = Number(contact && contact.id);

            return {
              value: id,
              id: id,
              name: name || String(id),
              identifier: identifier
            };
          }).filter(item => Number.isFinite(item.id) && item.id > 0);

          setMovementPayerOptions(options);
        })
        .catch(error => {
          setMovementPayerOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setMovementPayerLoading(false));
    }, 400);
  }

  function searchRefundBeneficiaries(value) {
    const text = getTrimmedString(value);
    const isNumericId = /^\d+$/.test(text);

    if (refundBeneficiarySearchTimer.current) {
      clearTimeout(refundBeneficiarySearchTimer.current);
      refundBeneficiarySearchTimer.current = null;
    }

    if (text.length < 3 && !isNumericId) {
      setRefundBeneficiaryOptions([]);
      setRefundBeneficiaryLoading(false);
      return;
    }

    refundBeneficiarySearchTimer.current = setTimeout(() => {
      const escaped = escapeSqlString(text);
      const numericId = isNumericId ? Number(text) : 0;
      const idFilter = numericId > 0 ? ` OR [id] = ${numericId}` : '';
      const filter = isNumericId && text.length < 3
        ? `(inactive=0) AND [id] = ${numericId}`
        : `(inactive=0) AND (([name] LIKE N'%${escaped}%') OR ([surname1] LIKE N'%${escaped}%') OR ([surname2] LIKE N'%${escaped}%') OR ([cnp] LIKE N'%${escaped}%') OR ([nif] LIKE N'%${escaped}%')${idFilter})`;

      setRefundBeneficiaryLoading(true);
      exe('GetContacts', { operation: 'GET', filter: filter, size: 15 })
        .then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('Beneficiaries could not be loaded.'));
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
              name: name || t('Unnamed contact'),
              identifier: identifier || t('No identification'),
              label: (
                <div style={{ lineHeight: 1.25 }}>
                  <div>{name || t('Unnamed contact')}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 11 }}>
                    {identifier || t('No identification')} | #{id}
                  </div>
                </div>
              )
            };
          }).filter(item => item.value !== undefined && item.value !== null);

          setRefundBeneficiaryOptions(options);
        })
        .catch(error => {
          setRefundBeneficiaryOptions([]);
          message.error(error && error.message ? error.message : String(error));
        })
        .finally(() => setRefundBeneficiaryLoading(false));
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
        ? `[activeDate] IS NOT NULL AND ([id] = ${Number(text)} OR [code] LIKE N'%${escaped}%')`
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

    return getBalanceAvailableAmount(row);
  }

  function getBalanceAvailableAmount(row) {
    return getAuditNumber(row && row.amount) + getAuditNumber(row && row.deposit);
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
      .filter(item => item.amount !== 0 && item.paymentMethod);
  }

  function getUniqueDepositExpectedAmount(currency) {
    return getUniqueDepositRows(currency).reduce((total, item) => total + item.amount, 0);
  }

  function getDepositPaymentMethodOptions() {
    const options = [];
    balanceRows.forEach(row => {
      const code = getTrimmedString(row && (row.paymentMethodCode || row.paymentMethod));
      if (!code || getBalanceAvailableAmount(row) === 0
        || options.some(option => option.value.toUpperCase() === code.toUpperCase())) return;
      const method = allPaymentMethodOptions.find(option =>
        getTrimmedString(option && option.value).toUpperCase() === code.toUpperCase());
      options.push({
        value: code,
        label: (method && method.label) || getTrimmedString(row && row.paymentMethod) || code
      });
    });
    return options;
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
    setDepositVisible(true);
  }

  function handleDepositValuesChange(changedValues, allValues) {
    const isUniqueDeposit = allValues && allValues.uniqueDeposit !== false;
    const expectedAmount = isUniqueDeposit
      ? getUniqueDepositExpectedAmount(allValues && allValues.currency)
      : getDepositExpectedAmount(allValues && allValues.paymentMethod, allValues && allValues.currency);
    const depositedAmount = getAuditNumber(allValues && allValues.amount);
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
  }

  async function createDeposit(values) {
    if (depositSubmitting) return;
    setDepositSubmitting(true);

    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    const enteredAmount = values && values.amount;
    const amount = Number(enteredAmount);
    const isUniqueDeposit = values && values.uniqueDeposit !== false;

    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      message.warning(t('Select a cash desk first.'));
      setDepositSubmitting(false);
      return;
    }

    if (enteredAmount === undefined || enteredAmount === null || enteredAmount === ''
      || !Number.isFinite(amount)) {
      message.warning(t('Enter the deposited amount.'));
      setDepositSubmitting(false);
      return;
    }

    const currency = getTrimmedString(values && values.currency);
    const paymentMethod = getTrimmedString(values && values.paymentMethod);
    const expectedAmount = isUniqueDeposit
      ? getUniqueDepositExpectedAmount(currency)
      : getDepositExpectedAmount(paymentMethod, currency);
    if (!isUniqueDeposit && !paymentMethod) {
      message.warning(t('Select a payment method.'));
      setDepositSubmitting(false);
      return;
    }
    const depositRows = isUniqueDeposit
      ? getUniqueDepositRows(currency)
      : [{
        row: null,
        amount: expectedAmount,
        paymentMethod: paymentMethod
      }];
    if (depositRows.length === 0 || (!isUniqueDeposit && expectedAmount === 0)) {
      message.warning(t('There is no available balance for the selected deposit.'));
      setDepositSubmitting(false);
      return;
    }

    const isFullDeposit = Math.abs(amount - expectedAmount) < 1e-8;
    const hasMixedSigns = depositRows.some(row => row.amount > 0)
      && depositRows.some(row => row.amount < 0);
    // Mixed-sign partial allocations have no defined accounting allocation rule.
    if (isUniqueDeposit && hasMixedSigns && !isFullDeposit) {
      message.warning(t('Hay saldos de signos distintos. Use el saldo completo o deposite por método de pago.'));
      setDepositSubmitting(false);
      return;
    }
    if (!isFullDeposit && (amount === 0 || Math.sign(amount) !== Math.sign(expectedAmount))) {
      message.warning(t('El importe debe tener el mismo signo que el saldo disponible y no puede ser cero.'));
      setDepositSubmitting(false);
      return;
    }
    if (!isFullDeposit && Math.abs(amount) > Math.abs(expectedAmount)) {
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

      const incomeType = getTrimmedString(values && values.incomeType);
      const concept = getTrimmedString(values && values.reference);

      let remainingAmount = amount;
      const responses = [];

      for (const depositRow of depositRows) {
        if (!isFullDeposit && Math.abs(remainingAmount) < 1e-8) break;

        const rowAmount = depositRow.amount;
        const depositAmount = isFullDeposit
          ? rowAmount
          : Math.sign(rowAmount) * Math.min(Math.abs(remainingAmount), Math.abs(rowAmount));
        if (depositAmount === 0) continue;

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

      if (Math.abs(remainingAmount) >= 1e-8) {
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
    exe('ExeChain', {
      chain: 'cmdCloseTransferWorkspaceCustom',
      context: JSON.stringify({ workspaceId: workspaceId })
    })
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
    let currency = 'USD';

    (Array.isArray(summary) ? summary : []).forEach(row => {
      const amount = getAuditNumber(row && row.amount);
      const method = getTrimmedString(row && (row.paymentMethodName || row.paymentMethod)).toUpperCase();
      currency = getTrimmedString(row && row.currency) || currency;
      total += amount;
      deposits += getAuditNumber(row && row.deposit);

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
      endBalance: (Array.isArray(summary) ? summary : [])
        .reduce((balance, row) => balance + getBalanceAvailableAmount(row), 0),
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
    exe('ExeChain', {
      chain: 'cmdGetCashierBalanceSummary',
      context: JSON.stringify({ workspaceId: workspaceId })
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Cash desk audit could not be loaded.'));
        }

        const payload = response.outData && !Array.isArray(response.outData)
          ? response.outData
          : {};
        const summary = Array.isArray(payload.summary)
          ? payload.summary
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
    exe('ExeChain', {
      chain: 'cmdGetCashierBalanceSummary',
      context: JSON.stringify({ workspaceId: workspaceId })
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Balances could not be loaded.'));
        }

        const payload = response.outData && !Array.isArray(response.outData)
          ? response.outData
          : {};
        const summary = Array.isArray(payload.summary)
          ? payload.summary
          : [];

        const rows = summary.map((item, index) => ({
          key: getTrimmedString(item && item.code) || `balance-${index}`,
          paymentMethodCode: getTrimmedString(item && item.paymentMethod),
          paymentMethod: getTrimmedString(item && item.paymentMethodName) || getBalancePaymentMethod(item),
          currency: getTrimmedString(item && item.currency) || 'USD',
          assignedFund: getAuditNumber(item && item.cashFund),
          amount: getAuditNumber(item && item.amount),
          deposit: getAuditNumber(item && item.deposit),
          difference: getAuditNumber(item && (item.difference !== undefined ? item.difference : item.dif))
        }));
        setBalanceRows(rows);
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

  function isCashReceiptReport(report) {
    const normalize = value => getTrimmedString(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const name = normalize(report && report.name);
    const reportCode = normalize(report && report.report);

    return (name.includes('recibo') && name.includes('caja'))
      || ['reciboglobal', 'reciboglobaloriginal', 'recibodecaja', 'roc', 'rociv'].includes(name)
      || ['reciboglobal', 'reciboglobaloriginal', 'recibodecaja', 'roc', 'rociv'].includes(reportCode);
  }

  function translateCashReceiptText(key, fallback) {
    const value = t(key);
    return value && value !== key ? value : fallback;
  }

  // ReciboGlobal and ROC_IV certify money received at the cash desk: they are issued only for the
  // main movement of a row, never for a payment detail or for a movement the system generates internally.
  function getCashReceiptBlockReason(movement) {
    if (!movement || movement.isExternal !== true) return 'detail';

    const source = getTrimmedString(movement.sourceExternal).toUpperCase();
    const internalType = getTrimmedString(movement.IncomeType && movement.IncomeType.internalType).toUpperCase();
    if (
      source.startsWith('ALLOCATION:')
      || /\sDEP$/.test(source)
      || internalType.startsWith('DEPOSIT-')
      || internalType === 'DEPOPAYMENT'
      || internalType === 'PPXA'
    ) {
      return 'internal';
    }

    return Number(movement.amount) > 0 ? '' : 'outflow';
  }

  function getCashReceiptBlockedMessage(transfer) {
    const messages = {
      detail: [
        'The cash receipt is only issued for the main movement. Movement {id} is a payment detail.',
        'El recibo de caja sólo se emite para el movimiento principal. El movimiento {id} es un detalle de pago.'
      ],
      internal: [
        'The cash receipt is only issued for the main movement. Movement {id} is an internal system movement.',
        'El recibo de caja sólo se emite para el movimiento principal. El movimiento {id} es un movimiento interno del sistema.'
      ],
      outflow: [
        'The cash receipt is only issued for the main movement. Movement {id} is not an income.',
        'El recibo de caja sólo se emite para el movimiento principal. El movimiento {id} no es un ingreso.'
      ]
    };
    const [key, fallback] = messages[transfer && transfer.blockReason] || messages.detail;
    return translateCashReceiptText(key, fallback).replace('{id}', String(transfer && transfer.transferId));
  }

  function getSelectedCashierReportTransfers() {
    const selectedGroups = movementSelectedRowKeys
      .map(key => movementRows.find(row => String(row && row.id) === String(key)))
      .filter(Boolean);
    const transfers = [];

    selectedGroups.forEach(group => {
      const transferId = Number(group && group.id);
      if (!Number.isFinite(transferId) || transferId <= 0) return;
      transfers.push({
        transferId: transferId,
        allocationId: getMovementAllocationId(group),
        blockReason: getCashReceiptBlockReason(group)
      });
    });

    return Array.from(new Map(transfers.map(item => [item.transferId, item])).values());
  }

  function openCashierReport(report) {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    const reportName = getTrimmedString(report && report.report);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0 || !reportName) return;

    const transferIds = movementSelectedRowKeys
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value > 0);

    if (!isCashReceiptReport(report)) {
      const transferId = transferIds.length > 0 ? transferIds[0] : '0';
      window.open(
        `#/reportview/${reportName}/workspaceId=${workspaceId}&transferId=${transferId}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    const selectedTransfers = getSelectedCashierReportTransfers();
    if (selectedTransfers.length === 0) return;

    const blockedTransfer = selectedTransfers.find(item => item.blockReason);
    if (blockedTransfer) {
      message.warning(getCashReceiptBlockedMessage(blockedTransfer));
      return;
    }

    const allocatedTransfers = selectedTransfers.filter(item => item.allocationId > 0);
    const unallocatedTransfers = selectedTransfers.filter(item => item.allocationId <= 0);

    if (allocatedTransfers.length > 0) {
      const transferId = allocatedTransfers[0].transferId;
      window.open(
        `#/reportview/${reportName}/workspaceId=${workspaceId}&transferId=${transferId}`,
        '_blank',
        'noopener,noreferrer'
      );
    }

    unallocatedTransfers.forEach(item => {
      window.open(
        `#/reportview/ROC_IV/workspaceId=${workspaceId}&transferId=${item.transferId}`,
        '_blank',
        'noopener,noreferrer'
      );
    });
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
          Codigo_Poliza: row.poliza || '',
          ID_Cliente: row.holderId || '',
          ID_Poliza: row.lifePolicyId || row.policyId || '',
          Monto_Pago: Number(row.pendiente || 0)
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

  function openCustomerStatement() {
    setCustomerStatementDateMode('cutoff');
    setCustomerStatementVisible(true);
    customerStatementForm.setFieldsValue({
      holderId: undefined,
      policyId: undefined,
      fechaCorte: getDatePickerValue(new Date()),
      fechaDesde: undefined,
      fechaHasta: undefined
    });
  }

  function generateCustomerStatement(values) {
    const holderId = Number(values && values.holderId);
    const policyId = Number(values && values.policyId);
    const formatReportDate = value => values && value && typeof value.format === 'function'
      ? value.format('YYYY-MM-DD')
      : '';
    const fechaCorte = formatReportDate(values && values.fechaCorte);
    const fechaDesde = formatReportDate(values && values.fechaDesde);
    const fechaHasta = formatReportDate(values && values.fechaHasta);

    if ((!Number.isInteger(holderId) || holderId <= 0)
      && (!Number.isInteger(policyId) || policyId <= 0)) {
      message.error(t('Select a contact or a policy.'));
      return;
    }

    if (customerStatementDateMode === 'cutoff' && !fechaCorte) {
      message.error(t('Please select a cutoff date.'));
      return;
    }

    if (customerStatementDateMode === 'range' && (!fechaDesde || !fechaHasta)) {
      message.error(t('Please select both range dates.'));
      return;
    }

    const params = [
      `holderId=${Number.isInteger(holderId) && holderId > 0 ? holderId : ''}`,
      `policyId=${Number.isInteger(policyId) && policyId > 0 ? policyId : ''}`,
      `FechaCorte=${customerStatementDateMode === 'cutoff' ? encodeURIComponent(fechaCorte) : encodeURIComponent('(none)')}`,
      `FechaDesde=${customerStatementDateMode === 'range' ? encodeURIComponent(fechaDesde) : encodeURIComponent('(none)')}`,
      `FechaHasta=${customerStatementDateMode === 'range' ? encodeURIComponent(fechaHasta) : encodeURIComponent('(none)')}`
    ];

    const url = `${window.location.origin}/#/reportview/EstadoCuentaCliente/${params.join('&')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setCustomerStatementVisible(false);
  }

  function getCollectionRowKey(record) {
    const policyId = Number(record && record.lifePolicyId);
    return Number.isFinite(policyId) && policyId > 0
      ? String(policyId)
      : String(record && record.poliza ? record.poliza : '');
  }

  function getSelectedCollectionRows() {
    if (transitCollectionMode && transitCollectionPolicyRows.length > 0) {
      return transitCollectionPolicyRows;
    }
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
    // MSN-000175: the selected policies' credit balance lowers the cash to collect.
    const creditAmount = selectedRows.reduce((total, row) => total + getCollectionPolicyCredit(row), 0);
    const expectedAmount = Number(Math.max(amount - creditAmount, 0).toFixed(2));

    clearNewIncomeForm();
    setTransitCollectionMode(false);
    setTransitCollectionAccount(null);
    setTransitCollectionPolicyRow(null);
    setTransitCollectionPolicyRows([]);
    setTransitCollectionPolicySelection([]);
    setTransitCollectionPolicySelectionVisible(false);
    setCollectionChargeStep('payment');
    setCollectionPolicyRows([]);
    setCollectionSupplementaryRows([]);
    setCollectionCreditRows([]);
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
    const account = getSingleSelectedTransitAccount(t('Select lines of a single transit account to collect a premium.'));
    if (!account) return;

    const transitLineEntries = getSelectedTransitLineEntries(account.id);
    const availableAmount = getSelectedTransitLinesTotal(account.id);
    const policyCode = getTrimmedString(account && (account.policyCode || account.lifePolicyCode || account.policy));

    if (!policyCode) {
      message.warning(t('The selected transit account does not have a valid policy code.'));
      return;
    }

    if (availableAmount <= 0) {
      message.warning(t('The selected transit account has no available balance.'));
      return;
    }

    try {
      setTransitCollectionPolicyLoading(true);
      const response = await exe('ExeChain', {
        chain: 'cmdPremiumCollectionCashier',
        context: JSON.stringify({ policyCode: policyCode, page: 1, size: 10000, onlyOverdue: false })
      });
      const payload = response && response.outData && typeof response.outData === 'object'
        ? response.outData
        : {};
      const policyRows = (Array.isArray(payload.data) ? payload.data : [])
        .filter(row => getCollectionPolicyPending(row) > 0);

      if (policyRows.length === 0) {
        message.warning(t('No policy with pending premiums was found for this policy code.'));
        return;
      }

      setTransitCollectionAccount({ ...account, availableAmount: availableAmount, transitLineEntries: transitLineEntries });
      setTransitCollectionPolicyRows(policyRows);
      setTransitCollectionPolicySelection(policyRows.length === 1
        ? [String(getCollectionRowKey(policyRows[0]))]
        : []);

      if (policyRows.length > 1) {
        setTransitCollectionPolicySelectionVisible(true);
        return;
      }

      openTransitPremiumCollectionForPolicies(policyRows, {
        ...account,
        availableAmount: availableAmount,
        transitLineEntries: transitLineEntries
      });
    } catch (error) {
      message.error(error && error.message ? error.message : t('The policy premiums could not be loaded.'));
    } finally {
      setTransitCollectionPolicyLoading(false);
    }
  }

  function openTransitPremiumCollectionForPolicies(policyRows, accountOverride) {
    const selectedPolicies = Array.isArray(policyRows) ? policyRows.filter(Boolean) : [];
    const sourceAccount = accountOverride || transitCollectionAccount;
    const availableAmount = Number(sourceAccount && sourceAccount.availableAmount) || 0;
    const policyPending = selectedPolicies.reduce((total, row) => total + getCollectionPolicyPending(row), 0);
    const collectionAmount = Math.min(availableAmount, policyPending);

    if (selectedPolicies.length === 0 || collectionAmount <= 0) {
      message.warning(t('Select at least one policy with pending premiums.'));
      return;
    }

    clearNewIncomeForm();
    setTransitCollectionMode(true);
    setTransitCollectionAccount(sourceAccount);
    setTransitCollectionPolicyRows(selectedPolicies);
    setTransitCollectionPolicyRow(selectedPolicies[0]);
    setCollectionChargeStep('payment');
    setCollectionPolicyRows([]);
    setCollectionSupplementaryRows([]);
    setCollectionCreditRows([]);
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
      currency: getTrimmedString(sourceAccount && sourceAccount.currency) || 'USD'
    });
    updateNewIncomeType(premiumIncomeType.value);
    setTransitCollectionPolicySelectionVisible(false);
    setCollectionChargeVisible(true);
  }

  function confirmTransitPremiumPolicySelection() {
    const selectedKeys = (Array.isArray(transitCollectionPolicySelection)
      ? transitCollectionPolicySelection
      : []).map(value => String(value));
    const selectedPolicies = transitCollectionPolicyRows.filter(row =>
      selectedKeys.indexOf(String(getCollectionRowKey(row))) >= 0
    );

    if (selectedPolicies.length === 0) {
      message.warning(t('Select at least one policy with pending premiums.'));
      return;
    }

    openTransitPremiumCollectionForPolicies(selectedPolicies);
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

  // MSN-000175: the pending negative installments of a policy are credit balance that pays the payer's premiums.
  function getCollectionInstallmentPending(installment) {
    const pending = Number(installment && installment.pendingAmount);
    return Number.isFinite(pending) ? pending : 0;
  }

  function getCollectionPolicyGrossPending(row) {
    const installments = Array.isArray(row && row.Cuotas) ? row.Cuotas : [];
    if (installments.length === 0) return getCollectionPolicyPending(row);
    return Number(installments
      .reduce((total, item) => total + Math.max(getCollectionInstallmentPending(item), 0), 0)
      .toFixed(2));
  }

  function getCollectionPolicyCredit(row) {
    const installments = Array.isArray(row && row.Cuotas) ? row.Cuotas : [];
    return Number(installments
      .reduce((total, item) => total + Math.max(-getCollectionInstallmentPending(item), 0), 0)
      .toFixed(2));
  }

  function getSelectedCollectionCredit() {
    if (transitCollectionMode) return 0;
    return Number(getSelectedCollectionRows()
      .reduce((total, row) => total + getCollectionPolicyCredit(row), 0)
      .toFixed(2));
  }

  function getCollectionCreditTotal() {
    if (transitCollectionMode) return 0;
    return Number(collectionCreditRows
      .reduce((total, row) => total + (Number(row && row.amount) || 0), 0)
      .toFixed(2));
  }

  function updateCollectionCreditAmount(key, value) {
    setCollectionCreditRows(rows => rows.map(row => {
      if (String(row.key) !== String(key)) return row;
      const amount = Number(value);
      const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
      return {
        ...row,
        amount: Number(Math.min(safeAmount, row.availableAmount).toFixed(2))
      };
    }));
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

  function getCollectionPolicyOldestDueDate(row) {
    const installments = Array.isArray(row && row.Cuotas) ? row.Cuotas : [];
    const timestamps = installments
      .map(item => new Date(item && item.dueDate).getTime())
      .filter(value => Number.isFinite(value));
    return timestamps.length > 0 ? Math.min(...timestamps) : Number.MAX_SAFE_INTEGER;
  }

  function buildCollectionAllocationPreview() {
    const selectedRows = getSelectedCollectionRows()
      .slice()
      .sort((left, right) => getCollectionPolicyOldestDueDate(left) - getCollectionPolicyOldestDueDate(right));

    // MSN-000175: in a collection the premium to apply is the positive pending; a policy with only credit balance goes to the credit table.
    const policyRows = selectedRows
      .filter(row => transitCollectionMode || getCollectionPolicyGrossPending(row) > 0 || getCollectionPolicyCredit(row) <= 0)
      .map(row => {
        const pendingAmount = transitCollectionMode
          ? getCollectionPolicyPending(row)
          : getCollectionPolicyGrossPending(row);

        return {
          key: getCollectionRowKey(row),
          policyId: getCollectionPolicyIdentifier(row),
          policy: getTrimmedString(row && row.poliza),
          pendingAmount: pendingAmount,
          overdueAmount: Math.min(getCollectionPolicyOverdue(row), pendingAmount),
          amount: 0,
          installments: Array.isArray(row && row.Cuotas)
            ? row.Cuotas.filter(item => transitCollectionMode || getCollectionInstallmentPending(item) > 0)
            : []
        };
      });

    // MSN-000175: the credit balance pays the premiums before the cash, up to the premium pending.
    let creditToApply = Number(policyRows.reduce((total, row) => total + row.pendingAmount, 0).toFixed(2));
    const creditRows = transitCollectionMode ? [] : selectedRows
      .filter(row => getCollectionPolicyCredit(row) > 0)
      .map(row => {
        const availableAmount = getCollectionPolicyCredit(row);
        const amount = Number(Math.min(availableAmount, Math.max(creditToApply, 0)).toFixed(2));
        creditToApply = Number((creditToApply - amount).toFixed(2));

        return {
          key: `credit-${getCollectionRowKey(row)}`,
          policyId: getCollectionPolicyIdentifier(row),
          policy: getTrimmedString(row && row.poliza),
          availableAmount: availableAmount,
          amount: amount,
          installments: (Array.isArray(row && row.Cuotas) ? row.Cuotas : [])
            .filter(item => getCollectionInstallmentPending(item) < 0)
        };
      });
    let remainingAmount = Number((getCollectionPaymentAmount()
      + creditRows.reduce((total, row) => total + row.amount, 0)).toFixed(2));

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
    setCollectionCreditRows(creditRows);
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

      // MSN-000175: a payment fully covered by the selected policies' credit balance carries no cash.
      const creditOnly = !transitCollectionMode && getNewIncomeTotal() <= 0 && getSelectedCollectionCredit() > 0;
      if (getNewIncomeTotal() <= 0 && !creditOnly) {
        message.error(t('Enter at least one payment amount greater than zero.'));
        return;
      }

      if (transitCollectionMode) {
        const amount = getCollectionPaymentAmount();
        const availableAmount = Number(transitCollectionAccount && transitCollectionAccount.availableAmount) || 0;
        const policyPending = getSelectedCollectionRows()
          .reduce((total, row) => total + getCollectionPolicyPending(row), 0);

        if (amount > availableAmount + 0.01) {
          message.error(t('The amount cannot exceed the transit account balance.'));
          return;
        }

        if (amount > policyPending + 0.01) {
          message.error(t('The amount cannot exceed the pending premium of the policy.'));
          return;
        }
      }

      if (!transitCollectionMode && !creditOnly && newIncomePayments.some(payment => !payment.methodCode || parseIncomeAmount(payment.amount) <= 0)) {
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
    const creditTotal = getCollectionCreditTotal();
    const creditValid = creditTotal <= policyTotal + 0.01
      && !collectionCreditRows.some(row => Number(row && row.amount) > Number(row && row.availableAmount) + 0.01);

    return (paymentTotal > 0 || creditTotal > 0)
      && !hasInvalidPolicyAmount
      && Math.abs(difference) <= 0.01
      && transitValid
      && creditValid;
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

    // MSN-000175: credit balance applied from the selected policies' pending negative installments.
    const creditTotal = getCollectionCreditTotal();
    if (collectionCreditRows.some(row => Number(row.amount) > Number(row.availableAmount) + 0.01)) {
      message.error(t('El saldo a favor aplicado de una póliza no puede superar su disponible.'));
      return;
    }

    if (creditTotal > policyTotal + 0.01) {
      message.error(t('El saldo a favor aplicado no puede superar las primas a aplicar.'));
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
    const credits = transitCollectionMode ? [] : collectionCreditRows
      .filter(row => Number(row && row.amount) > 0)
      .map(row => ({
        policyId: getCollectionPolicyNumericId(row),
        amount: Number(Number(row && row.amount).toFixed(2))
      }));

    if (payments.some(row => !Number.isFinite(row.policyId) || row.policyId <= 0)
      || supplementaryPayments.some(row => !Number.isFinite(row.policyId) || row.policyId <= 0)
      || credits.some(row => !Number.isFinite(row.policyId) || row.policyId <= 0)) {
      message.error(t('Every payment detail must have a valid policy.'));
      return;
    }

    if (Math.abs(Number((policyTotal + supplementaryTotal - paymentTotal - creditTotal).toFixed(2))) > 0.01) {
      message.error(t('The payment distribution does not match the payment total.'));
      return;
    }

    try {
      const formValues = transitCollectionMode
        ? newIncomeForm.getFieldsValue()
        : await newIncomeForm.validateFields();
      // MSN-000175: a payment paid only with credit balance moves no money, so it has no transfer.
      const cashless = !transitCollectionMode && paymentTotal <= 0;
      const destinationAccountId = transitCollectionMode || cashless
        ? 0
        : await resolveNewIncomeDestinationAccount(formValues);
      const transferEntity = cashless
        ? null
        : getNewIncomeTransferEntity(
          formValues,
          transitCollectionMode ? 208 : destinationAccountId
        );

      setCollectionPaymentExecuting(true);
      const transitLines = transitCollectionMode
        ? distributeTransitLines(paymentTotal, transitCollectionAccount && transitCollectionAccount.transitLineEntries)
        : [];
      if (transitCollectionMode) {
        await checkTransitLines(transitCollectionAccount && transitCollectionAccount.id, paymentTotal, transitLines);
      }
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
          transferEntity: transferEntity,
          credits: credits
        })
      });

      const result = response && response.outData && !Array.isArray(response.outData)
        ? response.outData
        : response;
      if (!result || result.ok === false) {
        throw new Error(result && result.msg ? result.msg : t('The premium payment could not be executed.'));
      }

      let transitLinesWarning = '';
      if (transitCollectionMode) {
        const transitTransfer = result && result.data && result.data.transitTransfer;
        const transitTransferId = Number(transitTransfer && transitTransfer.id) || 0;
        try {
          if (transitTransferId <= 0) {
            throw new Error(t('The transit debit transfer could not be identified.'));
          }
          await stampTransitLines(transitCollectionAccount.id, 'PREMIUM', { transferId: transitTransferId }, paymentTotal, transitLines);
        } catch (stampError) {
          transitLinesWarning = stampError && stampError.message ? stampError.message : String(stampError);
        }
      }

      const refreshTransitAccounts = transitCollectionMode;
      message.success(t('Premium payment executed successfully.'));
      if (transitLinesWarning) {
        message.warning(`${t('The payment was applied, but its lines could not be recorded')}: ${transitLinesWarning}`);
      }
      setCollectionChargeVisible(false);
      setCollectionChargeStep('payment');
      setCollectionPolicyRows([]);
      setCollectionSupplementaryRows([]);
      setCollectionCreditRows([]);
      setCollectionSelectedRowKeys([]);
      setTransitCollectionMode(false);
      setTransitCollectionAccount(null);
      setTransitCollectionPolicyRow(null);
      setTransitCollectionPolicyRows([]);
      setTransitCollectionPolicySelection([]);
      setTransitCollectionPolicySelectionVisible(false);
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
        refreshTransitAfterOperation();
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
    return Number(Math.max(getCollectionPaymentAmount() + getCollectionCreditTotal() - getCollectionPolicyTotal(), 0).toFixed(2));
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
    setTransitHasSearched(false);
    setTransitAccountRows([]);
    setTransitAccountTotal(0);
    resetTransitDetail();
    setTransitLineSelection({});
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
    return group && group.id ? group : getMovementChildren(group)[0] || {};
  }

  async function handleMovementEditSave() {
    if (!movementEditRecord || !validateDynamicIncomeForms()) return;

    try {
      const formValues = await newIncomeForm.validateFields();
      if (!getTrimmedString(formValues.incomeType)) {
        message.error(t('Select an income type.'));
        return;
      }
      if (newIncomePayments.some(payment => !payment.methodCode || parseIncomeAmount(payment.amount) === 0)) {
        message.error(t('Complete the payment method and enter a non-zero amount for every payment.'));
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

  function openDetailedCashDeskAuditReport() {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      message.warning(t('Select a cash desk first.'));
      return;
    }

    window.open(
      `#/reportview/${encodeURIComponent('Arqueo de Caja Detallado')}/TransferWorkSpaceId=${workspaceId}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function openSupervisorDetailedCashDeskAuditReport() {
    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      message.warning(t('Select a cash desk first.'));
      return;
    }

    window.open(
      `${window.location.origin}/#/reportview/rptArqueoDeCajaDetallado/workspaceId=${workspaceId}&transferId=0`,
      '_blank',
      'noopener,noreferrer'
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

    const first = getMovementFirst(group);
    const executed = Boolean(first.executed || first.status);
    return executed
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
        const id = Number(account && (account.id || account.accountId) || (item && item.destinationAccountId) || 0);
        const displayText = getTrimmedString(account && (account.name || account.accNo || account.code))
          || getTrimmedString(item && item.destinationName)
          || getTrimmedString(item && item.destinationAccountId);
        const tooltipText = [
          displayText,
          getTrimmedString(account && account.accNo)
        ].filter((value, index, values) => value && values.indexOf(value) === index).join(' - ');
        return displayText || id > 0
          ? { id: Number.isFinite(id) ? id : 0, accNo: displayText, tooltip: tooltipText || displayText }
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

    const primaryValue = values[0];
    const tooltipText = values
      .map(item => item.tooltip || item.accNo || item.id)
      .filter((value, index, items) => value && items.indexOf(value) === index)
      .join(' - ');

    return (
      <div
        style={{
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        <Tooltip title={tooltipText}>
          {primaryValue.id > 0
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
                onClick={() => window.open(`#/account/${primaryValue.id}`, '_blank', 'noopener,noreferrer')}
              >
                {primaryValue.accNo || primaryValue.id}
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
                {primaryValue.accNo}
              </span>
            )}
        </Tooltip>
      </div>
    );
  }

  function renderMovementReference(group) {
    const reference = getTrimmedString(group && group.concept);
    if (!reference) return '-';
    const displayReference = reference === 'IW'
      ? t('Premium Payment')
      : reference;

    return (
      <Tooltip title={displayReference}>
        <span style={{
          display: 'block',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: 'default'
        }}>
          {displayReference}
        </span>
      </Tooltip>
    );
  }

  function copyPolicyCode(value) {
    const content = getTrimmedString(value);
    if (!content) return;

    const notifySuccess = () => message.success(t('Copied to clipboard.'));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(notifySuccess).catch(() => {
        copyPolicyCodeFallback(content, notifySuccess);
      });
      return;
    }
    copyPolicyCodeFallback(content, notifySuccess);
  }

  function copyPolicyCodeFallback(content, onSuccess) {
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

  function getPremiumReversalPaymentMethods(record) {
    const splitPayments = Array.isArray(record && record.SplitPayments) ? record.SplitPayments : [];
    const values = splitPayments
      .map(item => getTrimmedString(item && (item.paymentMethodName || item.paymentMethod)))
      .filter(value => value);
    return Array.from(new Set(values)).join(', ') || '-';
  }

  function getPremiumReversalDestinationNames(record) {
    const values = [record].concat(getMovementChildren(record))
      .map(item => {
        const account = item && (item.DestinationAccount || item.destinationAccount);
        return getTrimmedString(account && (account.name || account.accNo))
          || getTrimmedString(item && item.destinationName)
          || getTrimmedString(item && item.destinationAccountId);
      })
      .filter(value => value);

    return Array.from(new Set(values)).join(', ') || '-';
  }

  function getPremiumReversalPolicyIds(record) {
    const directValue = record && (record.lifePolicyId || record.policyId || record.LifePolicyId);
    const values = [directValue]
      .concat(getPolicyValues(record))
      .filter(value => value !== undefined && value !== null && String(value) !== '')
      .reduce((result, value) => result.concat(String(value).split(/[\r\n,]+/)), [])
      .map(value => Number(String(value).trim()))
      .filter(value => Number.isInteger(value) && value > 0);

    return Array.from(new Set(values));
  }

  function getPremiumReversalType(record) {
    const incomeType = record && record.IncomeType;
    return getTrimmedString(incomeType && incomeType.name)
      || getTrimmedString(record && record.transactionCode)
      || '-';
  }

  function renderPremiumReversalText(value, maxWidth) {
    const text = getTrimmedString(value) || '-';
    return (
      <Tooltip title={text} trigger={['click', 'hover']}>
        <span
          style={{
            display: 'inline-block',
            maxWidth: maxWidth || 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            verticalAlign: 'middle'
          }}
        >
          {text}
        </span>
      </Tooltip>
    );
  }

  function loadPremiumReversalMovements(params = {}) {
    const source = params.filters || premiumReversalFilters || {};
    const pagination = params.pagination || premiumReversalPagination;
    const pageSize = Number(pagination && pagination.pageSize) || 15;
    const currentPage = Number(pagination && pagination.current) || 1;
    const workspaceId = Number(source.workspaceId);
    const rawAmount = source.amount;
    const hasAmount = rawAmount !== null && rawAmount !== undefined && rawAmount !== '';
    const amount = Number(rawAmount);
    const transferId = Number(source.transferId);
    const cashier = getTrimmedString(source.cashier).toLowerCase();
    const transferFilterParts = [
      'isExternal = 1',
      'status = 1',
      'executed = 1',
      'allocationId IS NOT NULL',
      'exists (select 1 from TransferWorkSpace t where t.id = [Transfer].transferWorkSpaceId AND t.closed = 1)'
    ];

    if (Number.isInteger(workspaceId) && workspaceId > 0) {
      transferFilterParts.push(`transferWorkspaceId = ${workspaceId}`);
    }
    if (Number.isInteger(transferId) && transferId > 0) {
      transferFilterParts.push(`id = ${transferId}`);
    }
    const allocationId = Number(source.allocationId);
    if (Number.isInteger(allocationId) && allocationId > 0) {
      transferFilterParts.push(`allocationId = ${allocationId}`);
    }
    if (hasAmount && Number.isFinite(amount)) {
      transferFilterParts.push(`amount >= ${amount}`);
      transferFilterParts.push(`amount <= ${amount}`);
    }
    if (source.fromDate) {
      transferFilterParts.push(`date >= '${escapeSqlString(source.fromDate)}'`);
    }
    if (source.toDate) {
      transferFilterParts.push(`date <= '${escapeSqlString(source.toDate)}'`);
    }

    setPremiumReversalLoading(true);
    exe('RepoTransfer', {
      operation: 'GET',
      filter: transferFilterParts.join(' AND '),
      include: ['SplitPayments', 'IncomeType', 'Allocation', 'Allocation.InstallmentPremiums'],
      size: cashier ? 0 : pageSize,
      page: cashier ? 0 : Math.max(currentPage - 1, 0)
    })
      .then(response => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('Premium reversals could not be loaded.'));
        }

        const allGroups = getRows(response);
        const rows = allGroups.map((group, index) => {
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
        if (cashier) {
          const filteredRows = rows.filter(item => getTrimmedString(item && item.user).toLowerCase().indexOf(cashier) >= 0);
          const start = (currentPage - 1) * pageSize;
          setPremiumReversalRows(filteredRows.slice(start, start + pageSize));
          setPremiumReversalTotal(filteredRows.length);
          setPremiumReversalPagination({ current: currentPage, pageSize: pageSize });
          return;
        }

        setPremiumReversalRows(rows);
        setPremiumReversalTotal(getResponseTotal(response, rows));
        setPremiumReversalPagination({ current: currentPage, pageSize: pageSize });
      })
      .catch(error => {
        setPremiumReversalRows([]);
        setPremiumReversalTotal(0);
        message.error(error && error.message ? error.message : String(error));
      })
      .finally(() => {
        setPremiumReversalLoading(false);
      });
  }

  function openPremiumReversalModal() {
    setPremiumReversalFilters({});
    premiumReversalFilterForm.resetFields();
    setPremiumReversalVisible(true);
  }

  function applyPremiumReversalFilters(values) {
    const workspaceId = Number(values && values.workspaceId);
    const transferId = Number(values && values.transferId);
    const allocationId = Number(values && values.allocationId);
    const rawAmount = values && values.amount;
    const hasAmount = rawAmount !== null && rawAmount !== undefined && rawAmount !== '';
    const nextFilters = {
      workspaceId: Number.isInteger(workspaceId) && workspaceId > 0 ? workspaceId : null,
      cashier: getTrimmedString(values && values.cashier),
      transferId: Number.isInteger(transferId) && transferId > 0 ? transferId : null,
      allocationId: Number.isInteger(allocationId) && allocationId > 0 ? allocationId : null,
      amount: hasAmount && Number.isFinite(Number(rawAmount)) ? Number(rawAmount) : null,
      fromDate: formatTransferFilterBoundary(values && values.dateFrom, false),
      toDate: formatTransferFilterBoundary(values && values.dateTo, true)
    };
    setPremiumReversalFilters(nextFilters);
    loadPremiumReversalMovements({
      filters: nextFilters,
      pagination: { current: 1, pageSize: premiumReversalPagination.pageSize }
    });
  }

  function clearPremiumReversalFilters() {
    premiumReversalFilterForm.resetFields();
    setPremiumReversalFilters({});
    setPremiumReversalRows([]);
    setPremiumReversalTotal(0);
    setPremiumReversalPagination({ current: 1, pageSize: premiumReversalPagination.pageSize });
  }

  function handlePremiumReversalTableChange(pagination) {
    loadPremiumReversalMovements({
      filters: premiumReversalFilters,
      pagination: { current: pagination.current, pageSize: pagination.pageSize }
    });
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
    exe('ExeChain', {
      chain: 'cmdFilterCashierTransfer',
      context: JSON.stringify({
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
        incomeType: incomeType || null,
        policy: getTrimmedString(filters && filters.policy) || null,
        payerId: Number(filters && filters.payerId) > 0 ? Number(filters.payerId) : null,
        payerName: getTrimmedString(filters && filters.payerName) || null
      })
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

        const alphabetical = function (left, right) {
          const leftName = getTrimmedString(left && left.name);
          const rightName = getTrimmedString(right && right.name);
          const byName = leftName.localeCompare(rightName, 'es', { sensitivity: 'base' });
          return byName || getTrimmedString(left && left.code).localeCompare(getTrimmedString(right && right.code), 'es', { sensitivity: 'base' });
        };
        setReversalCauses(getRows(results[0]).slice().sort(alphabetical));
        setReversalSubcauses(getRows(results[1]).slice().sort(alphabetical));
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
    setReversalClientId(undefined);
    presetOperationClient(null);
    setReversalVisible(true);
    loadReversalCatalogs().catch(error => {
      setReversalVisible(false);
      message.error(error && error.message ? error.message : String(error));
    });
  }

  function getCashierMovementPolicyId(group) {
    const policyId = getPolicyValues(group).map(value => Number(value)).find(value => Number.isFinite(value) && value > 0);
    return policyId || Number(group && (group.policyId || group.lifePolicyId)) || 0;
  }

  function getCashierPayPlanAmount(row) {
    const value = row && (row.minimum !== undefined && row.minimum !== null
      ? row.minimum
      : row.expected);
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  }

  function getCashierPayPlanPaid(row) {
    const value = row && (row.payed !== undefined && row.payed !== null ? row.payed : row.paid);
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  }

  function buildCashierRestructurePreview(policy) {
    const payPlan = Array.isArray(policy && policy.PayPlan)
      ? policy.PayPlan.slice().sort((left, right) => Number(left && (left.numberInYear || left.number || 0)) - Number(right && (right.numberInYear || right.number || 0)))
      : [];
    const collectibleRows = payPlan.filter(row => String(row && row.concept || '').toUpperCase() !== 'CANCELLATION');
    const paidRows = collectibleRows.filter(row => {
      const amount = getCashierPayPlanAmount(row);
      return amount > 0 && getCashierPayPlanPaid(row) >= amount - 0.005;
    });
    const editableRows = collectibleRows.filter(row => paidRows.indexOf(row) < 0);
    const totalPendingPlan = editableRows.reduce((total, row) => total + getCashierPayPlanAmount(row), 0);
    const remainingSlots = editableRows.length;
    if (!remainingSlots || totalPendingPlan <= 0) return [];

    const baseCents = Math.round(totalPendingPlan * 100);
    const regularCents = Math.floor(baseCents / remainingSlots);
    const remainder = baseCents - regularCents * remainingSlots;
    let editableIndex = 0;

    return collectibleRows.map(row => {
      const isPaid = paidRows.indexOf(row) >= 0;
      const proposedAmount = isPaid
        ? getCashierPayPlanAmount(row)
        : (regularCents + (editableIndex++ === remainingSlots - 1 ? remainder : 0)) / 100;
      return {
        key: String(row && row.id || `${editableIndex}-${row && row.numberInYear || ''}`),
        id: row && row.id,
        number: row && (row.numberInYear || row.number || row.installmentNumber),
        dueDate: row && (row.dueDate || row.normalDueDate || row.coveredUntil),
        currentAmount: getCashierPayPlanAmount(row),
        paid: getCashierPayPlanPaid(row),
        proposedAmount: proposedAmount,
        fullyPaid: isPaid,
        source: row
      };
    });
  }

  function hasDifferentFullyPendingAmounts(rows) {
    const amounts = rows
      .filter(row => !row.fullyPaid && row.paid <= 0.005 && row.currentAmount > 0)
      .map(row => Math.round(row.currentAmount * 100));
    return new Set(amounts).size > 1;
  }

  async function inspectPolicyAfterReversal(group) {
    const policyId = getCashierMovementPolicyId(group);
    if (!policyId) return;

    setRestructurePromptLoading(true);
    try {
      const response = await exe('RepoLifePolicy', {
        operation: 'GET',
        filter: `id=${policyId}`,
        include: ['PayPlan', 'Product', 'Holder'],
        noTracking: true
      });
      if (!response || response.ok === false) return;

      const policy = getRows(response)[0] || null;
      const previewRows = buildCashierRestructurePreview(policy);
      if (!policy || !hasDifferentFullyPendingAmounts(previewRows)) return;

      setCashierRestructurePolicy(policy);
      setCashierRestructureRows(previewRows);
      setRestructurePromptVisible(true);
    } catch (error) {
      message.warning(error && error.message ? error.message : t('The policy payment plan could not be validated.'));
    } finally {
      setRestructurePromptLoading(false);
    }
  }

  function openCashierRestructure() {
    setRestructurePromptVisible(false);
    setCashierRestructureVisible(true);
  }

  function getCashierRestructureEffectiveDate(policy) {
    const now = new Date();
    const policyStart = policy && policy.start ? new Date(policy.start) : null;
    if (policyStart && !Number.isNaN(policyStart.getTime()) && policyStart.getTime() > now.getTime()) {
      return policyStart;
    }
    return now;
  }

  async function executeCashierRestructure() {
    const policy = cashierRestructurePolicy;
    const rows = cashierRestructureRows;
    const policyId = Number(policy && policy.id);
    if (!policyId || !rows.length) return;

    setCashierRestructureLoading(true);
    try {
      const editedPayPlan = rows.map((row, index) => {
        const paidAmount = row.paid || 0;
        const pendingAmount = Math.max(0, row.proposedAmount - paidAmount);
        return {
          ...row.source,
          minimum: row.proposedAmount,
          expected: row.proposedAmount,
          dueAmount: pendingAmount,
          pendingAmount: pendingAmount,
          pending: pendingAmount > 0,
          edited: Math.abs(row.currentAmount - row.proposedAmount) > 0.005,
          final: index === rows.length - 1,
          PayPlanDetail: Array.isArray(row.source && row.source.PayPlanDetail)
            ? row.source.PayPlanDetail.map(detail => ({ ...detail }))
            : []
        };
      }).concat(
        (Array.isArray(policy.PayPlan) ? policy.PayPlan : [])
          .filter(row => String(row && row.concept || '').toUpperCase() === 'CANCELLATION')
          .map(row => ({
            ...row,
            PayPlanDetail: Array.isArray(row && row.PayPlanDetail)
              ? row.PayPlanDetail.map(detail => ({ ...detail }))
              : []
          }))
      );
      const effectiveDate = getCashierRestructureEffectiveDate(policy).toISOString();
      const changeResponse = await exe('ChangePayPlan', {
        policyId: policyId,
        effectiveDate: effectiveDate,
        operation: 'ADD',
        code: null,
        note: 'Reestructuración automática posterior a reversión de pago',
        changeIdToBeAmended: null,
        jEditedPayPlan: JSON.stringify(editedPayPlan),
        Surcharges: []
      });
      if (!changeResponse || changeResponse.ok === false) {
        throw new Error(changeResponse && changeResponse.msg ? changeResponse.msg : t('The installment restructuring could not be created.'));
      }

      const first = getRows(changeResponse)[0] || {};
      const changeId = Number(changeResponse.changeId || changeResponse.id || first.changeId || first.id);
      if (!(changeId > 0)) throw new Error(t('The restructuring endorsement could not be determined.'));

      const previousFrequency = escapeSqlString(policy.periodicity);
      const paymentMethod = escapeSqlString(policy.paymentMethodCode || policy.paymentMethod);
      const changeFields = await exe('SetField', {
        entity: 'Change',
        entityId: changeId,
        fieldValue: `newPaymentMethod='${paymentMethod}',oldPaymentMethod='${paymentMethod}',newFrequency='${previousFrequency}',oldFrequency='${previousFrequency}'`
      });
      if (!changeFields || changeFields.ok === false) {
        throw new Error(changeFields && changeFields.msg ? changeFields.msg : t('The restructuring endorsement fields could not be updated.'));
      }

      const changeEntity = await exe('LoadEntity', {
        entity: 'Change',
        fields: 'id,processId',
        filter: `id=${changeId}`,
        noTracking: true
      });
      const changeRow = getRows(changeEntity)[0] || {};
      const processId = Number(changeEntity && (changeEntity.processId || changeEntity.id) || changeRow.processId);
      if (!(processId > 0)) throw new Error(t('The restructuring workflow could not be determined.'));

      const approval = await exe('GotoStep', { procesoId: processId, estado: 'APROVED' });
      if (!approval || approval.ok === false) {
        throw new Error(approval && approval.msg ? approval.msg : t('The restructuring workflow could not be approved.'));
      }
      const executeResponse = await exe('ExeChangePayPlan', { changeId: changeId, operation: 'EXECUTE', exeNow: true });
      if (!executeResponse || executeResponse.ok === false) {
        throw new Error(executeResponse && executeResponse.msg ? executeResponse.msg : t('The installment restructuring could not be executed.'));
      }

      setCashierRestructureVisible(false);
      setCashierRestructurePolicy(null);
      setCashierRestructureRows([]);
      message.success(t('The installment restructuring was applied. You can review the policy now.'));
      loadMovements({ pagination: movementPagination });
    } catch (error) {
      message.error(error && error.message ? error.message : t('The installment restructuring could not be completed.'));
    } finally {
      setCashierRestructureLoading(false);
    }
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

    // A premium payment credited to an account keeps its income: only the premiums are reverted and the funds go
    // to that account, with the client chosen here.
    const creditClient = allocationId > 0 && reversalCreditFunds ? getOperationClient(reversalClientId) : null;
    if (allocationId > 0 && reversalCreditFunds && !creditClient) {
      message.warning(t('Select a client.'));
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
          workspaceId: Number(selectedCashierRow && selectedCashierRow.id) || null,
          reversalCause: cause,
          reversalSubcause: subcause,
          jReversalFormValues: reversalFormValues,
          creditFundsToAccountId: creditClient ? accountId : null
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

    const workspaceId = Number(selectedCashierRow && selectedCashierRow.id) || null;
    const loadTransitDebit = allocationId > 0 && workspaceId > 0 && !creditClient
      ? exe('RepoTransfer', {
          operation: 'GET',
          filter: `transferWorkspaceId = ${workspaceId} AND sourceExternal = 'ALLOCATION:${allocationId}'`,
          size: 25,
          page: 0
        }).then(response => {
          if (!response || response.ok === false) {
            throw new Error(response && response.msg ? response.msg : t('The related transit movement could not be loaded.'));
          }

          return getRows(response).find(item =>
            Number(item && item.id) > 0
            && Number(item && item.amount) < 0
            && Boolean(item && item.executed)
            && !item.reversalDate
          ) || null;
        })
      : Promise.resolve(null);

    loadTransitDebit
      .then(transitDebit => exe(reversalCommand, reversalPayload).then(response => ({ response, transitDebit })))
      .then(({ response, transitDebit }) => {
        if (!response || response.ok === false) {
          throw new Error(response && response.msg ? response.msg : t('The payment could not be reverted.'));
        }

        if (transitDebit) {
          return exe('UndoTransfer', {
            transferId: Number(transitDebit.id),
            reversalCause: cause,
            reversalSubcause: subcause,
            jReversalFormValues: reversalFormValues,
            creditFundsToAccountId: null,
            workspaceId: workspaceId,
            transferWorkspaceId: workspaceId
          }).then(transitResponse => {
            if (!transitResponse || transitResponse.ok === false) {
              throw new Error(transitResponse && transitResponse.msg
                ? transitResponse.msg
                : t('The related transit movement could not be reverted.'));
            }
            return response;
          });
        }

        return response;
      })
      .then(response => {
        if (!creditClient) return response;
        return stampReversalCreditClient(allocationId, accountId, creditClient)
          .catch(error => message.warning(error && error.message ? error.message : String(error)))
          .then(() => response);
      })
      .then(response => {

        message.success(response.msg || t('Payment reverted successfully.'));
        setReversalVisible(false);
        setReversalRecord(null);
        loadMovements({ pagination: movementPagination });
        if (premiumReversalVisible) {
          loadPremiumReversalMovements({
            filters: premiumReversalFilters,
            pagination: premiumReversalPagination
          });
        }
        inspectPolicyAfterReversal(reversalRecord && reversalRecord.group);
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
            <span style={{ whiteSpace: 'nowrap' }}>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto' }}
                onClick={() => window.open(`#/lifepolicy/${policyId}`, '_blank', 'noopener,noreferrer')}
              >
                {value || policyId}
              </Button>
              <Button
                type="link"
                size="small"
                aria-label={t('Copy')}
                title={t('Copy')}
                style={{ padding: '0 0 0 5px', height: 'auto', lineHeight: 1.2 }}
                onClick={event => {
                  event.stopPropagation();
                  copyPolicyCode(value || policyId);
                }}
              >
                <CopyOutlined />
              </Button>
            </span>
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
    { title: t('Billed'), dataIndex: 'facturado', key: 'facturado', width: 110, align: 'right', render: renderGridMoney },
    { title: t('Paid'), dataIndex: 'pagado', key: 'pagado', width: 110, align: 'right', render: renderGridMoney },
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
            {renderGridMoney(value)}
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
    { title: t('Pending'), dataIndex: 'pendiente', key: 'pendiente', width: 110, align: 'right', render: renderGridMoney },
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
    { title: t('Pending'), dataIndex: 'pendingAmount', key: 'pendingAmount', width: 110, align: 'right', render: renderGridMoney }
  ];

  const balanceColumns = [
    { title: t('Payment method'), dataIndex: 'paymentMethod', key: 'paymentMethod', width: 180 },
    { title: t('Currency'), dataIndex: 'currency', key: 'currency', width: 90, align: 'center' },
    { title: t('Assigned fund'), dataIndex: 'assignedFund', key: 'assignedFund', width: 130, align: 'right', render: renderGridMoney },
    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 130, align: 'right', render: renderGridMoney },
    { title: t('Deposit'), dataIndex: 'deposit', key: 'deposit', width: 120, align: 'right', render: renderGridMoney },
    {
      title: t('Difference'),
      dataIndex: 'difference',
      key: 'difference',
      width: 130,
      align: 'right',
      render: renderGridMoney
    }
  ];

  const premiumReversalColumns = [
    {
      title: t('Actions'),
      key: 'actions',
      width: 70,
      align: 'center',
      render: (_, record) => {
        const first = getMovementFirst(record);
        const executed = Boolean(first && (first.executed || first.status));
        const reverted = isMovementReverted(record);
        const isReversal = [record].concat(getMovementChildren(record)).some(item =>
          Boolean(item && (item.reversalOfId || item.ReversalOf))
        );

        return (
          <Tooltip title={t('Revert movement')}>
            <Button
              type="link"
              size="small"
              aria-label={t('Revert movement')}
              disabled={!executed || reverted || isReversal}
              onClick={() => openReversalModal(record)}
              icon={<RevertMovementIcon />}
            />
          </Tooltip>
        );
      }
    },
    { title: t('ID'), dataIndex: 'id', key: 'id', width: 80, align: 'center' },
    { title: t('Date'), dataIndex: 'date', key: 'date', width: 110, render: formatDateIso },
    {
      title: t('Origin'),
      key: 'origin',
      width: 125,
      render: (_, record) => renderPremiumReversalText(record && (record.sourceName || record.sourceExternal || record.sourceAccountId), 105)
    },
    {
      title: t('Destination'),
      key: 'destination',
      width: 150,
      render: (_, record) => renderPremiumReversalText(getPremiumReversalDestinationNames(record), 130)
    },
    {
      title: t('Reference'),
      key: 'reference',
      width: 160,
      render: (_, record) => {
        const reference = record && (record.reference || record.concept);
        const displayReference = getTrimmedString(reference) === 'IW'
          ? t('Premium Payment')
          : reference;
        return renderPremiumReversalText(displayReference, 140);
      }
    },
    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 110, align: 'right', render: renderGridMoney },
    { title: t('Currency'), dataIndex: 'currency', key: 'currency', width: 85, align: 'center' },
    { title: t('Type'), key: 'type', width: 135, render: (_, record) => renderPremiumReversalText(getPremiumReversalType(record), 115) },
    { title: t('Payment method'), key: 'paymentMethod', width: 125, render: (_, record) => renderPremiumReversalText(getPremiumReversalPaymentMethods(record), 105) },
    {
      title: t('Policy ID'),
      key: 'lifePolicyId',
      width: 105,
      align: 'center',
      render: (_, record) => {
        const policyIds = getPremiumReversalPolicyIds(record);
        return policyIds.length > 0
          ? (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', fontSize: 11, lineHeight: 1.1 }}>
              {policyIds.map(policyId => (
                <Button
                  key={policyId}
                  type="link"
                  size="small"
                  style={{ padding: 0, height: 'auto', lineHeight: 1.1, fontSize: 11 }}
                  onClick={() => window.open(`#/lifepolicy/${policyId}`, '_blank', 'noopener,noreferrer')}
                >
                  {policyId}
                </Button>
              ))}
            </div>
          )
          : '-';
      }
    },
    {
      title: t('Allocation'),
      dataIndex: 'allocationId',
      key: 'allocationId',
      width: 105,
      align: 'center',
      render: value => {
        const allocationId = Number(value);
        return Number.isInteger(allocationId) && allocationId > 0
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
    { title: t('Cash desk ID'), dataIndex: 'transferWorkspaceId', key: 'transferWorkspaceId', width: 105, align: 'center', render: value => value || '-' },
    { title: t('User'), dataIndex: 'user', key: 'user', width: 180, render: value => renderPremiumReversalText(value, 160) }
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
    { title: t('Received'), dataIndex: 'amount', key: 'received', width: 110, align: 'right', render: renderGridMoney },
    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 110, align: 'right', render: renderGridMoney },
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
          <Dropdown
            trigger={['click']}
            placement="bottomLeft"
            disabled={!selectedCashierRow}
            menu={{
              items: [
                {
                  key: 'cash-desk-audit',
                  label: 'Arqueo de Caja (En pantalla)',
                  onClick: openCashDeskAudit
                },
                {
                  key: 'detailed-cash-desk-audit',
                  label: 'Informe de Cierre de Caja',
                  onClick: openDetailedCashDeskAuditReport
                },
                {
                  key: 'supervisor-detailed-cash-desk-audit',
                  label: 'Arqueo de Caja Detallado',
                  onClick: openSupervisorDetailedCashDeskAuditReport
                }
              ]
            }}
          >
            <Button className="cashier-supervisor-outline-button" icon={<FileTextOutlined />} disabled={!selectedCashierRow}>
              Reportes de Caja
            </Button>
          </Dropdown>
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
        scroll={{ x: 780, y: transferScrollY }}
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
      title: t('Requests in process'),
      key: 'pendingRefundAmount',
      width: 150,
      align: 'right',
      render: (_, record) => renderGridMoney(record && record.pendingRefundAmount)
    },
    {
      title: t('Balance'),
      key: 'balance',
      width: 130,
      align: 'right',
      render: (_, record) => renderGridMoney(getTransitAccountBalance(record))
    },
    {
      title: t('Movements'),
      key: 'movementCount',
      width: 110,
      align: 'center',
      render: (_, record) => (Array.isArray(record && record.Movements) && record.Movements.length > 0
        ? getTransitMovements(record).length
        : Number(record && record.movementCount) || 0)
    },
    {
      title: t('Detail'),
      key: 'detail',
      width: 130,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Button
          size="small"
          type={Number(record && record.id) === Number(transitDetailAccount && transitDetailAccount.id) ? 'primary' : 'default'}
          onClick={() => openTransitAccountDetail(record)}
        >
          {t('View detail')}
        </Button>
      )
    }
  ];

  const transitOperationLabels = {
    REFUND: t('Return money'),
    PREMIUM: t('Collect premium'),
    PPXA: t('Apply pending premiums (PPXA)'),
    TRANSFER: t('Transfer between accounts')
  };

  function describeTransitApplication(item) {
    const amount = formatMoney(item && item.amount);
    const reserved = item && item.kind === 'RESERVED' ? ` (${t('Reserved')})` : '';
    if (item && item.type === 'STAMP') {
      const label = transitOperationLabels[item.op] || getTrimmedString(item.op);
      const reference = Number(item.requestId) > 0
        ? `${t('Request')} ${item.requestId}`
        : `${t('Transfer ID')} ${item.transferId}`;
      const author = [getTrimmedString(item.user), item.date ? formatDate(item.date) : ''].filter(Boolean).join(' ');
      return `${label} · ${reference} · ${amount}${reserved}${author ? ` · ${author}` : ''}`;
    }
    if (item && item.type === 'REQUEST') {
      return `${t('Refund request')} ${item.requestId} · ${amount}${reserved}`;
    }
    return `${t('Movement')} ${item && item.movementId} · ${getTrimmedString(item && item.transaction)} · ${amount}${reserved}`;
  }

  function renderTransitApplications(record, kind) {
    if (!record || record.kind !== 'LINE') return '-';
    const value = kind === 'RESERVED' ? record.reserved : record.applied;
    const items = (Array.isArray(record.applications) ? record.applications : [])
      .filter(item => item && item.kind === kind);
    if (!items.length) return renderGridMoney(value);

    return (
      <Tooltip
        title={(
          <div>
            {items.map((item, index) => <div key={index}>{describeTransitApplication(item)}</div>)}
          </div>
        )}
      >
        <span className="cashier-transit-lines-applied">{renderGridMoney(value)}</span>
      </Tooltip>
    );
  }

  function renderTransitLineAvailable(record) {
    if (record && record.kind === 'LINE') {
      return <strong>{renderGridMoney(record.available)}</strong>;
    }
    if (record && record.kind === 'NEUTRAL') {
      return <Tag>{t('No effect')}</Tag>;
    }

    const coveredBy = record && record.coveredBy;
    const label = coveredBy && coveredBy.type === 'STAMP'
      ? transitOperationLabels[coveredBy.op] || getTrimmedString(coveredBy.op)
      : coveredBy && coveredBy.type === 'REQUEST'
        ? `${t('Refund request')} ${coveredBy.requestId}`
        : '';
    return label
      ? <Tooltip title={label}><Tag>{t('Outgoing')}</Tag></Tooltip>
      : <Tag>{t('Outgoing')}</Tag>;
  }

  const transitLineColumns = [
    { title: t('Movement ID'), dataIndex: 'id', key: 'id', width: 95, align: 'center' },
    { title: t('Date'), dataIndex: 'date', key: 'date', width: 100, align: 'center', render: value => formatDate(value) },
    { title: t('Transaction'), dataIndex: 'transaction', key: 'transaction', width: 190, render: value => getTrimmedString(value) || '-' },
    { title: t('Transaction code'), dataIndex: 'transactionCode', key: 'transactionCode', width: 110, render: value => getTrimmedString(value) || '-' },
    { title: t('Transfer ID'), dataIndex: 'transferId', key: 'transferId', width: 90, align: 'center', render: value => value || '-' },
    {
      title: t('Client'),
      dataIndex: 'ownerName',
      key: 'ownerName',
      width: 190,
      render: (value, record) => getTrimmedString(value) || (record && record.ownerId) || '-'
    },
    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 105, align: 'right', render: renderGridMoney },
    { title: t('Applied'), key: 'applied', width: 105, align: 'right', render: (_, record) => renderTransitApplications(record, 'APPLIED') },
    { title: t('Reserved'), key: 'reserved', width: 105, align: 'right', render: (_, record) => renderTransitApplications(record, 'RESERVED') },
    { title: t('Available'), key: 'available', width: 115, align: 'right', render: (_, record) => renderTransitLineAvailable(record) }
  ];

  const transitLineSelectionEntries = getTransitLineSelectionEntries();
  const transitSelectedAccountCount = getSelectedTransitAccountIds().length;
  const transitDetailAccountId = Number(transitDetailAccount && transitDetailAccount.id) || 0;
  const transitDetailSelectedKeys = transitLineSelectionEntries
    .filter(entry => Number(entry.accountId) === transitDetailAccountId)
    .map(entry => String(entry.movId));
  const transitLineSummary = transitLineAccountSummary || {};

  const transitSelectionBar = (
    <div className="cashier-transit-lines-selection">
      <span>{t('Selected lines')}: <strong>{transitLineSelectionEntries.length}</strong></span>
      <span>{t('Available to apply')}: <strong>{formatMoney(getSelectedTransitLinesTotal())}</strong></span>
      {transitSelectedAccountCount > 0 ? (
        <span>
          {t('Accounts')}: <strong>{getSelectedTransitAccounts().map(account => getTrimmedString(account && account.accNo) || account.id).join(', ')}</strong>
          {transitSelectedAccountCount > 1 ? ` (${t('only PPXA combines several accounts')})` : ''}
        </span>
      ) : null}
      <Button size="small" disabled={!transitLineSelectionEntries.length} onClick={clearTransitLineSelection}>
        {t('Clear selection')}
      </Button>
    </div>
  );

  const transitAccountsPane = (
    <>
      <div className="cashier-supervisor-toolbar cashier-supervisor-spaced-toolbar">
        <Button type="primary" icon={<FilterOutlined />} onClick={() => setTransitFilterVisible(true)}>
          {t('Filter')}
        </Button>
        <Button
          className="cashier-supervisor-outline-button"
          icon={<DownloadOutlined />}
          loading={transitExportLoading}
          disabled={!transitHasSearched || transitExportLoading}
          onClick={exportTransitAccounts}
        >
          {t('Export Excel')}
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
      {transitLineSelectionEntries.length ? transitSelectionBar : null}
      <Table
        rowKey={record => String(record && record.id)}
        columns={transitAccountColumns}
        dataSource={transitAccountRows}
        size="small"
        bordered
        className="cashier-supervisor-table"
        loading={transitAccountLoading}
        pagination={{
          current: transitAccountPagination.current,
          pageSize: transitAccountPagination.pageSize,
          total: transitAccountTotal,
          showSizeChanger: true,
          pageSizeOptions: ['15', '25', '50', '100']
        }}
        onChange={handleTransitTableChange}
        scroll={{ x: 1100, y: transferScrollY }}
      />
    </>
  );

  const transitLinesPane = !transitDetailAccount ? (
    <div className="cashier-transit-lines-empty">
      {t('Use View detail on an account to see its movements here.')}
    </div>
  ) : (
    <>
      <div className="cashier-transit-lines-header">
        <div>
          <strong>{getTrimmedString(transitDetailAccount.accNo) || '-'}</strong>
          <span>{getTrimmedString(transitDetailAccount.name) || '-'}</span>
          <span>{t('Policy')}: {getTransitAccountLabel(transitDetailAccount).policy}</span>
          <span>{t('Contact')}: {getTransitAccountLabel(transitDetailAccount).contact}</span>
          <span>{t('Currency')}: {getTrimmedString(transitDetailAccount.currency) || '-'}</span>
        </div>
        <div>
          <span>{t('Available to apply')}: <strong>{formatMoney(transitLineSummary.available)}</strong></span>
          <span>{t('Reserved')}: <strong>{formatMoney(transitLineSummary.reserved)}</strong></span>
          <span>{t('Applied')}: <strong>{formatMoney(transitLineSummary.applied)}</strong></span>
        </div>
      </div>
      <div className="cashier-supervisor-toolbar cashier-supervisor-spaced-toolbar">
        <Button
          className="cashier-supervisor-outline-button"
          icon={<RevertMovementIcon />}
          disabled={transitSelectedAccountCount !== 1}
          onClick={openRefundMoneyModal}
        >
          {t('Return money')}
        </Button>
        <Button
          type="primary"
          icon={<PolicyIcon />}
          disabled={transitSelectedAccountCount !== 1}
          loading={transitCollectionPolicyLoading}
          onClick={openTransitPremiumCollection}
        >
          {t('Collect premium')}
        </Button>
        <Button
          type="primary"
          icon={<TransferAccountIcon />}
          disabled={transitSelectedAccountCount === 0}
          onClick={openPpxaApplyModal}
        >
          {t('Apply pending premiums (PPXA)')}
        </Button>
        <Button
          className="cashier-supervisor-success-button"
          icon={<TransferAccountIcon />}
          disabled={transitSelectedAccountCount !== 1}
          onClick={openAccountTransferModal}
        >
          {t('Transfer between accounts')}
        </Button>
        <Button
          className="cashier-supervisor-outline-button"
          icon={<ReloadOutlined />}
          loading={transitLineLoading}
          onClick={() => loadTransitLines({ pagination: transitLinePagination })}
        >
          {t('Refresh')}
        </Button>
      </div>
      {transitSelectionBar}
      <Table
        rowKey={record => String(record && record.id)}
        columns={transitLineColumns}
        dataSource={transitLineRows}
        size="small"
        bordered
        className="cashier-supervisor-table cashier-transit-lines-table"
        loading={transitLineLoading}
        rowClassName={record => (isTransitLineSelectable(record) ? '' : 'cashier-transit-lines-closed')}
        rowSelection={{
          type: 'checkbox',
          preserveSelectedRowKeys: true,
          selectedRowKeys: transitDetailSelectedKeys,
          getCheckboxProps: record => ({ disabled: !isTransitLineSelectable(record) }),
          onSelect: (record, selected) => toggleTransitLineSelection([record], selected),
          onSelectAll: (selected, selectedRows, changeRows) => toggleTransitLineSelection(changeRows, selected)
        }}
        onRow={record => ({
          onClick: event => {
            if (event.target.closest('button, a, input, .ant-checkbox-wrapper')) return;
            if (!isTransitLineSelectable(record)) return;
            toggleTransitLineSelection([record], transitDetailSelectedKeys.indexOf(String(record.id)) < 0);
          }
        })}
        pagination={{
          current: transitLinePagination.current,
          pageSize: transitLinePagination.pageSize,
          total: transitLineTotal,
          showSizeChanger: true,
          pageSizeOptions: ['15', '25', '50', '100'],
          showTotal: total => `${t('Movements')}: ${total}`
        }}
        onChange={handleTransitLineTableChange}
        scroll={{ x: 1200, y: transferScrollY }}
      />
    </>
  );

  const transitPremiumsTabContent = (
    <Card size="small">
      <Tabs
        className="cashier-transit-inner-tabs"
        activeKey={transitInnerTab}
        onChange={key => setTransitInnerTab(key)}
        items={[
          { key: 'accounts', label: t('Accounts'), children: transitAccountsPane },
          { key: 'lines', label: t('Movement detail'), children: transitLinesPane }
        ]}
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
            className="cashier-supervisor-report-button"
            onClick={openCustomerStatement}
          >
            {t('Customer account statement')}
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
        <Button
          className="cashier-supervisor-outline-button"
          icon={<RevertMovementIcon />}
          onClick={openPremiumReversalModal}
        >
          {t('Premium reversals')}
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
        rowClassName={record => movementSelectedRowKeys.some(key => String(key) === String(record && record.id))
          ? 'cashier-supervisor-selected-row'
          : ''}
        onRow={record => ({
          onClick: event => {
            if (event.target.closest('button, a, input, .ant-dropdown, .ant-pagination')) return;
            setMovementSelectedRowKeys(record && record.id !== undefined && record.id !== null
              ? [String(record.id)]
              : []);
          }
        })}
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
    const creditTotal = getCollectionCreditTotal();
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
        render: renderGridMoney
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

    // MSN-000175: credit balance of the selected policies (pending negative installments).
    const creditColumns = [
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
        title: t('Available'),
        dataIndex: 'availableAmount',
        key: 'availableAmount',
        align: 'right',
        render: renderGridMoney
      },
      {
        title: t('Amount to apply'),
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        render: (value, record) => (
          <InputNumber
            min={0}
            max={record.availableAmount}
            precision={2}
            value={value}
            onChange={nextValue => updateCollectionCreditAmount(record.key, nextValue)}
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
                {record.installments.map(item => (
                  <div key={item.id || `${record.key}-${item.numberInYear}`}>
                    <strong>{item.concept || t('Installment')}</strong>
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
            className="cashier-supervisor-table"
            pagination={false}
            bordered
          />
        </div>
        {!transitCollectionMode && collectionCreditRows.length > 0 && (
          <>
            <div className="cashier-supervisor-section-title">{t('Saldo a favor')}</div>
            <div className="cashier-supervisor-collection-policy-table">
              <Table
                rowKey="key"
                columns={creditColumns}
                dataSource={collectionCreditRows}
                size="small"
                className="cashier-supervisor-table"
                pagination={false}
                bordered
              />
            </div>
          </>
        )}
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
                    className="cashier-supervisor-table"
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
          {!transitCollectionMode && creditTotal > 0 && (
            <div><strong>{t('Saldo a favor aplicado')}:</strong> {formatMoney(creditTotal)}</div>
          )}
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

  const renderNewIncomeContent = (collectionMode, editMode, formScope) => (
    <Card size="small" className="cashier-supervisor-new-income-card">
      <div className="cashier-supervisor-new-income-actions cashier-supervisor-toolbar">
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
                ? incomeTypeOptions.filter(item => isVisibleNewIncomeType(item))
                : incomeTypeOptions.filter(item =>
                  getTrimmedString(item && item.internalType).toUpperCase() !== 'PREMIUM'
                  && isVisibleNewIncomeType(item, true)
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
                      onChange={value => {
                        const selectedOption = newIncomeDestinationAccountOptions.find(option => String(option && option.value) === String(value));
                        updateNewIncomeTransitContact(selectedOption && selectedOption.account);
                      }}
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
              onChange={value => {
                const selectedIncomeType = getIncomeTypeOption(newIncomeTypeCode);
                const internalType = getTrimmedString(selectedIncomeType && selectedIncomeType.internalType).toUpperCase();
                if (internalType === 'PPXA') {
                  loadPpxaNewIncomeDestination(value);
                }
              }}
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
                        id={`cashier-payment-form-${payment.key}-${formScope}`}
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
                <form id={`cashier-income-type-form-${formScope}`} ref={newIncomeTypeFormRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );

  // Keep the three flows isolated at their entry points while sharing only the
  // proven field and validation layout.
  const renderNewIncomeForm = () => renderNewIncomeContent(false, false, 'new');
  const renderPremiumPaymentForm = () => renderNewIncomeContent(true, false, 'premium');
  const renderMovementEditForm = () => renderNewIncomeContent(false, true, 'edit');

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
                ? renderNewIncomeForm()
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
                  } else {
                    presetReversalClient(reversalRecord);
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
            {reversalCreditFunds && Number(reversalRecord && reversalRecord.allocationId) > 0 && (
              <Form.Item label={t('Client')} required>
                {renderOperationClientSelect(reversalClientId, setReversalClientId)}
              </Form.Item>
            )}
          </Form>
        </Modal>

        <Modal
          title={t('Installment restructuring')}
          className="cashier-supervisor-restructure-modal"
          open={restructurePromptVisible}
          onCancel={() => setRestructurePromptVisible(false)}
          onOk={openCashierRestructure}
          okText={t('Yes, restructure')}
          cancelText={t('No')}
          confirmLoading={restructurePromptLoading}
          destroyOnClose
        >
          <p>{t('The policy has fully pending installments with different amounts.')}</p>
          <p>{t('Would you like to apply a proportional installment restructuring?')}</p>
        </Modal>

        <Modal
          title={t('Proposed installment restructuring')}
          className="cashier-supervisor-restructure-modal"
          open={cashierRestructureVisible}
          onCancel={() => setCashierRestructureVisible(false)}
          onOk={executeCashierRestructure}
          okText={t('Confirm restructuring')}
          cancelText={t('Cancel')}
          confirmLoading={cashierRestructureLoading}
          width={760}
          destroyOnClose
        >
          <div className="cashier-supervisor-restructure-summary">
            <strong>{t('Effective date')}:</strong>
            <span>{formatDate(getCashierRestructureEffectiveDate(cashierRestructurePolicy))}</span>
          </div>
          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="key"
            className="cashier-supervisor-restructure-table"
            dataSource={cashierRestructureRows}
            columns={[
              { title: t('Installment'), dataIndex: 'number', key: 'number', align: 'center', width: 110 },
              { title: t('Due date'), dataIndex: 'dueDate', key: 'dueDate', align: 'center', render: value => formatDate(value) },
              { title: t('Current amount'), dataIndex: 'currentAmount', key: 'currentAmount', align: 'right', render: value => formatMoney(value) },
              { title: t('Proposed amount'), dataIndex: 'proposedAmount', key: 'proposedAmount', align: 'right', render: value => <span className="cashier-supervisor-restructure-proposed">{formatMoney(value)}</span> }
            ]}
            locale={{ emptyText: t('No installments found.') }}
          />
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
                  options={getDepositPaymentMethodOptions()}
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

            <Form.Item
              label={t('Reference')}
              name="reference"
              rules={[{ required: true, message: t('Enter a reference.') }]}
            >
              <Input />
            </Form.Item>
            </Form>
          </Spin>
        </Modal>

        <Modal
          title={t('Money withdrawal request')}
          className="cashier-supervisor-refund-modal"
          width={720}
          style={{ maxWidth: 'calc(100vw - 32px)' }}
          open={refundMoneyVisible}
          onCancel={closeRefundMoneyModal}
          onOk={() => refundMoneyForm.submit()}
          confirmLoading={refundMoneySubmitting}
          okText={t('Request')}
          cancelText={t('Cancel')}
          destroyOnClose={false}
        >
          <Form
            form={refundMoneyForm}
            layout="vertical"
            onFinish={submitRefundMoneyRequest}
          >
            {renderTransitSelectionNote()}
            <div className="cashier-supervisor-refund-grid">
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
                  options={getTransitSourceAccountOptions()}
                  placeholder={t('Source account')}
                  disabled
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
                label={t('Source account percentage')}
                name="sourcePercentage"
                rules={[{ required: true, message: t('Enter a percentage.') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  onChange={updateRefundPercentage}
                />
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
                options={getRefundPaymentMethodOptions()}
                placeholder={t('Payment method')}
              />
            </Form.Item>

            <Form.Item
              label={t('Beneficiary')}
              name="beneficiary"
              rules={[{ required: true, message: t('Enter a beneficiary.') }]}
            >
              <Select
                showSearch
                allowClear
                filterOption={false}
                optionLabelProp="name"
                options={refundBeneficiaryOptions}
                loading={refundBeneficiaryLoading}
                onSearch={searchRefundBeneficiaries}
                onChange={value => {
                  refundMoneyForm.setFieldsValue({ accountId: undefined });
                  setRefundDestinationAccountOptions([]);
                  const needsManualDestination = true;
                  setRefundNeedsManualDestination(needsManualDestination);
                  if (value && needsManualDestination) {
                    loadRefundDestinationAccounts('');
                  }
                }}
                placeholder={t('Search beneficiary')}
                notFoundContent={refundBeneficiaryLoading ? t('Loading...') : t('Type at least 3 characters')}
              />
            </Form.Item>

            {refundNeedsManualDestination && (
              <Form.Item label={t('Destination account')}>
                <Input.Group compact style={{ display: 'flex', width: '100%' }}>
                  <Form.Item
                    name="accountId"
                    noStyle
                    preserve={false}
                    rules={[{ required: true, message: t('Select a destination account.') }]}
                  >
                    <Select
                      showSearch
                      allowClear
                      filterOption={false}
                      optionFilterProp="label"
                      optionLabelProp="shortAccountLabel"
                      options={refundDestinationAccountOptions}
                      loading={refundDestinationAccountLoading}
                      placeholder={t('Search destination account')}
                      style={{ width: 'calc(100% - 40px)' }}
                      onSearch={loadRefundDestinationAccounts}
                      notFoundContent={refundDestinationAccountLoading ? t('Loading...') : t('No accounts found')}
                      onChange={value => {
                        if (!value) setRefundDestinationAccountOptions([]);
                      }}
                    />
                  </Form.Item>
                  <Button
                    icon={<InstallmentsIcon />}
                    aria-label={t('Search accounts')}
                    onClick={openRefundDestinationAccountSearch}
                    style={{ width: 40 }}
                  />
                </Input.Group>
                <Button
                  type="link"
                  size="small"
                  icon={<NewIcon />}
                  disabled={!refundMoneyForm.getFieldValue('beneficiary')}
                  onClick={openRefundAccountCreateModal}
                  style={{ marginTop: 6, paddingLeft: 0 }}
                >
                  {t('Create destination account')}
                </Button>
              </Form.Item>
            )}

            <Form.Item
              label={t('Reference')}
              name="reference"
              rules={[{ required: true, message: t('Enter a reference.') }]}
            >
              <Input
                addonAfter={(
                  <Tooltip title={t('Generate an automatic refund reference')}>
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={generateRefundReference}
                    />
                  </Tooltip>
                )}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('Create destination account')}
          open={refundAccountCreateVisible}
          onCancel={() => {
            setRefundAccountCreateVisible(false);
            refundAccountCreateForm.resetFields();
          }}
          onOk={() => refundAccountCreateForm.submit()}
          confirmLoading={refundAccountCreateLoading}
          okText={t('Create')}
          cancelText={t('Cancel')}
          destroyOnClose={false}
        >
          <Form form={refundAccountCreateForm} layout="vertical" onFinish={submitRefundAccountCreate}>
            <Form.Item
              label={t('Account name')}
              name="name"
              rules={[{ required: true, message: t('Enter the account name.') }]}
            >
              <Input autoFocus maxLength={120} />
            </Form.Item>
            <Form.Item
              label={t('Currency')}
              name="currency"
              rules={[{ required: true, message: t('Select a currency.') }]}
            >
              <Select options={currencyOptions} placeholder={t('Currency')} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('Apply pending premiums (PPXA)')}
          className="cashier-supervisor-collection-payment-modal"
          open={ppxaApplyVisible}
          onCancel={closePpxaApplyModal}
          onOk={() => ppxaApplyForm.submit()}
          okText={t('Execute')}
          cancelText={t('Cancel')}
          confirmLoading={ppxaApplyLoading || ppxaApplyAccountLoading}
          destroyOnClose={false}
          width={620}
        >
          <Form form={ppxaApplyForm} layout="vertical" onFinish={submitPpxaApply}>
            {renderTransitSelectionNote()}
            <Form.Item label={t('Currency')} name="currency">
              <Select disabled options={currencyOptions} />
            </Form.Item>
            <Form.Item
              label={t('Amount')}
              name="amount"
              rules={[{ required: true, message: t('Enter an amount.') }]}
            >
              <InputNumber min={0} max={getSelectedTransitLinesTotal()} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label={t('Destination account')}
              name="destinationAccount"
              rules={[{ required: true, message: t('Select a destination account.') }]}
            >
              <Select
                showSearch
                allowClear
                filterOption={false}
                optionFilterProp="label"
                optionLabelProp="shortAccountLabel"
                options={ppxaApplyAccountOptions}
                loading={ppxaApplyAccountLoading}
                placeholder={t('Search account')}
                onSearch={searchPpxaApplyAccounts}
                notFoundContent={ppxaApplyAccountLoading ? t('Loading...') : t('No accounts found')}
              />
            </Form.Item>
            <Form.Item
              label={t('Client')}
              name="client"
              rules={[{ required: true, message: t('Select a client.') }]}
            >
              {renderOperationClientSelect()}
            </Form.Item>
            <Form.Item
              label={t('Reference')}
              name="reference"
              rules={[{ required: true, message: t('Enter a reference.') }]}
            >
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
            {renderTransitSelectionNote()}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div className="cashier-supervisor-section-title">{t('Source information')}</div>
                <Form.Item
                  label={t('Currency')}
                  name="currency"
                  rules={[{ required: true, message: t('Select a currency.') }]}
                >
                  <Select disabled options={currencyOptions} placeholder={t('Currency')} />
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
                <Form.Item
                  label={t('Client')}
                  name="client"
                  rules={[{ required: true, message: t('Select a client.') }]}
                >
                  {renderOperationClientSelect()}
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
                  name="sourceAccount"
                  rules={[{ required: true, message: t('Select a source account.') }]}
                >
                  <Select
                    disabled
                    optionLabelProp="shortAccountLabel"
                    options={accountTransferSourceOption ? [accountTransferSourceOption] : []}
                  />
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
                        onChange={updateAccountTransferDestinationContact}
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
          {renderMovementEditForm()}
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
          title={t('Select policies for premium payment')}
          className="cashier-supervisor-transit-policy-modal"
          open={transitCollectionPolicySelectionVisible}
          onCancel={() => {
            setTransitCollectionPolicySelectionVisible(false);
            setTransitCollectionPolicySelection([]);
            setTransitCollectionPolicyRows([]);
            setTransitCollectionAccount(null);
          }}
          width={900}
          destroyOnClose
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setTransitCollectionPolicySelectionVisible(false);
                setTransitCollectionPolicySelection([]);
                setTransitCollectionPolicyRows([]);
                setTransitCollectionAccount(null);
              }}
            >
              {t('Cancel')}
            </Button>,
            <Button
              key="continue"
              type="primary"
              loading={transitCollectionPolicyLoading}
              onClick={confirmTransitPremiumPolicySelection}
            >
              {t('Continue')}
            </Button>
          ]}
        >
          <Table
            rowKey={record => String(getCollectionRowKey(record))}
            size="small"
            bordered
            className="cashier-supervisor-transit-policy-table"
            loading={transitCollectionPolicyLoading}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: transitCollectionPolicySelection,
              onChange: keys => setTransitCollectionPolicySelection(keys.map(key => String(key)))
            }}
            columns={[
              { title: t('Policy ID'), dataIndex: 'lifePolicyId', key: 'lifePolicyId', width: 100, align: 'center' },
              { title: t('Policy'), dataIndex: 'poliza', key: 'poliza', width: 180 },
              {
                title: t('Validity'),
                key: 'validity',
                width: 210,
                render: (_, record) => `${formatDate(record && record.vigenciaDesde)} - ${formatDate(record && record.vigenciaHasta)}`
              },
              { title: t('Pending'), dataIndex: 'pendiente', key: 'pendiente', align: 'right', render: renderGridMoney },
              { title: t('Overdue'), dataIndex: 'vencido', key: 'vencido', align: 'right', render: renderGridMoney }
            ]}
            dataSource={transitCollectionPolicyRows}
            pagination={false}
          />
        </Modal>

        <Modal
          title={t('Collect premiums')}
          className="cashier-supervisor-collection-payment-modal"
          open={collectionChargeVisible}
          onCancel={() => {
            setCollectionChargeVisible(false);
            setTransitCollectionMode(false);
            setTransitCollectionAccount(null);
            setTransitCollectionPolicyRow(null);
            setTransitCollectionPolicyRows([]);
            setTransitCollectionPolicySelection([]);
            setTransitCollectionPolicySelectionVisible(false);
            setCollectionChargeStep('payment');
            setCollectionPolicyRows([]);
            setCollectionSupplementaryRows([]);
            setCollectionCreditRows([]);
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
                children: renderPremiumPaymentForm()
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
                  allowClear={accountTransferSearchTarget !== 'refundDestinationAccount'}
                  disabled={accountTransferSearchTarget === 'refundDestinationAccount'}
                  filterOption={false}
                  options={accountTransferSearchTarget === 'refundDestinationAccount'
                    ? refundBeneficiaryOptions
                    : payerOptions}
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
                    title={`${getTrimmedString(record && record.currency) || '-'} ${formatMoney(getTransitAccountBalance(record))}`}
                  >
                    <span className="cashier-supervisor-account-cell">
                      {getTrimmedString(record && record.currency) || '-'} {formatMoney(getTransitAccountBalance(record))}
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

        <Modal
          title={t('Premium reversals')}
          className="cashier-supervisor-reversal-modal"
          open={premiumReversalVisible}
          onCancel={() => setPremiumReversalVisible(false)}
          footer={null}
          width={1160}
          destroyOnClose={false}
        >
          <Form
            form={premiumReversalFilterForm}
            layout="vertical"
            onFinish={applyPremiumReversalFilters}
          >
            <Row gutter={12}>
              <Col span={6}>
                <Form.Item label={t('Cash desk ID')} name="workspaceId">
                  <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={t('Cashier')} name="cashier">
                  <Input allowClear />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={t('Transfer ID')} name="transferId">
                  <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={t('Allocation ID')} name="allocationId">
                  <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={t('Amount')} name="amount">
                  <InputNumber precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={t('Start date')} name="dateFrom">
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" allowClear />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={t('End date')} name="dateTo">
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" allowClear />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button onClick={clearPremiumReversalFilters}>{t('Clear')}</Button>
              <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
                {t('Search')}
              </Button>
            </Space>
          </Form>
          <Table
            rowKey="id"
            columns={premiumReversalColumns}
            dataSource={premiumReversalRows}
            size="small"
            bordered
            className="cashier-supervisor-table cashier-premium-reversal-table"
            loading={premiumReversalLoading}
            pagination={{
              current: premiumReversalPagination.current,
              pageSize: premiumReversalPagination.pageSize,
              total: premiumReversalTotal,
              showSizeChanger: true,
              pageSizeOptions: ['15', '25', '50', '100']
            }}
            onChange={handlePremiumReversalTableChange}
            scroll={{ x: 1500, y: 420 }}
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

            <Form.Item label={t('Policy')} name="policy">
              <Input
                allowClear
                placeholder={t('Search by policy or code')}
              />
            </Form.Item>

            <Form.Item label={t('Client')} name="payerId">
              <Select
                allowClear
                showSearch
                filterOption={false}
                loading={movementPayerLoading}
                onSearch={searchMovementPayers}
                optionLabelProp="label"
                placeholder={t('Search client')}
                notFoundContent={movementPayerLoading ? t('Loading') : t('Type at least 3 characters')}
              >
                {movementPayerOptions.map(item => (
                  <Option key={item.id} value={item.id} label={item.name}>
                    <div>
                      <div>{item.name}</div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {`${t('ID')}: ${item.id}${item.identifier ? ` | ${item.identifier}` : ''}`}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
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

        <Modal
          title={t('Customer account statement')}
          open={customerStatementVisible}
          onCancel={() => setCustomerStatementVisible(false)}
          footer={null}
          destroyOnClose={false}
        >
          <Form
            form={customerStatementForm}
            layout="vertical"
            onFinish={generateCustomerStatement}
          >
            <Form.Item
              label={t('Contact')}
              name="holderId"
            >
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

            <Form.Item
              label={t('Policy')}
              name="policyId"
            >
              <Select
                showSearch
                allowClear
                filterOption={false}
                options={policyOptions}
                loading={policyLoading}
                onSearch={searchPolicies}
                optionLabelProp="policyCode"
                placeholder={t('Search by policy id or code')}
                notFoundContent={t('No policies found')}
              />
            </Form.Item>

            <Form.Item label={t('Date filter')}>
              <Switch
                checked={customerStatementDateMode === 'cutoff'}
                checkedChildren={t('Cutoff')}
                unCheckedChildren={t('Range')}
                onChange={checked => {
                  const nextMode = checked ? 'cutoff' : 'range';
                  setCustomerStatementDateMode(nextMode);
                  customerStatementForm.setFieldsValue({
                    fechaCorte: nextMode === 'cutoff' ? getDatePickerValue(new Date()) : undefined,
                    fechaDesde: undefined,
                    fechaHasta: undefined
                  });
                }}
              />
            </Form.Item>

            {customerStatementDateMode === 'cutoff' ? (
              <Form.Item
                label={t('Cutoff date')}
                name="fechaCorte"
                rules={[{ required: true, message: t('Please select a cutoff date') }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            ) : (
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    label={t('From')}
                    name="fechaDesde"
                    rules={[{ required: true, message: t('Please select the start date') }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('To')}
                    name="fechaHasta"
                    dependencies={['fechaDesde']}
                    rules={[{ required: true, message: t('Please select the end date') }, ({ getFieldValue }) => ({
                      validator(_, value) {
                        const from = getFieldValue('fechaDesde');
                        if (!value || !from || value.isSame(from) || value.isAfter(from)) return Promise.resolve();
                        return Promise.reject(new Error(t('The end date must be on or after the start date')));
                      }
                    })]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setCustomerStatementVisible(false)}>
                {t('Cancel')}
              </Button>
              <Button type="primary" htmlType="submit">
                {t('Generate')}
              </Button>
            </div>
          </Form>
        </Modal>

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
            <Form.Item label={t('Transfer ID')} name="transferId">
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
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
            <Form.Item name="showAll" valuePropName="checked" initialValue={false}>
              <Checkbox>{t('Show all')}</Checkbox>
            </Form.Item>
          </Form>
        </Drawer>

      </div>
  );
}
