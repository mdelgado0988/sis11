/**
 * @author Michael Delgado
 * @email michael.delgado@axxis-systems.com
 * @created 2026/09/04
 * @name GestionCargosdeRemesas
 * @version 1.0
 * @purpose: Manage remittance batches, cash desk assignments, processing, and remittance detail.
 */
() => {
  const Table      = A.Table;
  const Form       = A.Form;
  const Select     = A.Select;
  const DatePicker = A.DatePicker;
  const Input      = A.Input;
  const Button     = A.Button;
  const Space      = A.Space;
  const Row        = A.Row;
  const Col        = A.Col;
  const Card       = A.Card;
  const Divider    = A.Divider;
  const Progress   = A.Progress;
  const Collapse   = A.Collapse;
  const Drawer     = A.Drawer;
  const Modal      = A.Modal;
  const Pagination = A.Pagination;
  const Tooltip    = A.Tooltip;
  const Upload     = A.Upload;
  const Alert      = A.Alert;
  const message    = A.message;
  const Panel      = Collapse.Panel;

  const PAGE_SIZE = 50;
  const IMPORT_CONFIG_NAME = 'Cobros Masivos';
  const PRE_OPERATION_CHAIN = 'cmdValidateMassivePaymentsPreOperation';
  const BATCH_IMPORT_HEADERS = ['ID_Caja', 'Codigo_Poliza', 'ID_Cliente', 'Numero_Recibo', 'Monto_Pago'];
  const REQUIRED_IMPORT_HEADERS = ['Codigo_Poliza', 'ID_Cliente', 'Numero_Recibo', 'Monto_Pago'];
  const REQUIRED_XLSX_COLUMNS = 'Codigo_Poliza, ID_Cliente, Numero_Recibo y Monto_Pago';
  const BATCH_METADATA_TYPE = 'REMITTANCE_METADATA';
  const EMPTY_VALUE = '—';

  const [form] = Form.useForm();
  const [newCashDeskForm] = Form.useForm();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailExporting, setDetailExporting] = React.useState(false);
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: PAGE_SIZE, total: 0 });
  const [filters, setFilters] = React.useState({});
  const [selectedRowKeys, setSelectedRowKeys] = React.useState([]);
  const [selectedBatch, setSelectedBatch] = React.useState(null);
  const [batchDetail, setBatchDetail] = React.useState(null);
  const [userOptions, setUserOptions] = React.useState([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = React.useState(false);
  const [lineDetailOpen, setLineDetailOpen] = React.useState(false);
  const [lineDetailPage, setLineDetailPage] = React.useState(1);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = React.useState(null);
  const [selectedUploadCashDeskId, setSelectedUploadCashDeskId] = React.useState(null);
  const [selectedUploadPayer, setSelectedUploadPayer] = React.useState(null);
  const [uploadCashDeskOptions, setUploadCashDeskOptions] = React.useState([]);
  const [uploadCashDesksLoading, setUploadCashDesksLoading] = React.useState(false);
  const [uploadPayerOptions, setUploadPayerOptions] = React.useState([]);
  const [uploadPayersLoading, setUploadPayersLoading] = React.useState(false);
  const [uploadFileParsing, setUploadFileParsing] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [processingBatchId, setProcessingBatchId] = React.useState(null);
  const [deletingBatchId, setDeletingBatchId] = React.useState(null);
  const [newCashDeskOpen, setNewCashDeskOpen] = React.useState(false);
  const [newCashDeskLoading, setNewCashDeskLoading] = React.useState(false);
  const [currentUserEmail, setCurrentUserEmail] = React.useState('');
  const [currentUserLoading, setCurrentUserLoading] = React.useState(false);
  const [branchOptions, setBranchOptions] = React.useState([]);
  const [branchesLoading, setBranchesLoading] = React.useState(false);

  const importConfigIdRef = React.useRef(null);
  const importConfigPromiseRef = React.useRef(null);
  const listRequestRef = React.useRef(0);
  const detailRequestRef = React.useRef(0);
  const selectedBatchIdRef = React.useRef(null);
  const uploadFileReadRef = React.useRef(0);
  const uploadPayerSearchRef = React.useRef(0);
  const xlsxLibraryPromiseRef = React.useRef(null);
  const batchExecutionRef = React.useRef({});
  const batchDeletionRef = React.useRef({});
  const batchStatusPollRef = React.useRef(0);
  const shellRef = React.useRef(null);

  const toNumber = (value) => {
    const number = Number(value);
    return isFinite(number) ? number : 0;
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || String(value).trim() === '') return EMPTY_VALUE;
    return String(value);
  };

  const formatDate = (value) => {
    if (!value) return EMPTY_VALUE;
    const date = new Date(value);
    if (isNaN(date.getTime())) return displayValue(value);
    const pad = (part) => String(part).padStart(2, '0');
    return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear()
      + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  };

  const formatCashDeskDate = (value) => {
    if (!value) return EMPTY_VALUE;
    const date = new Date(value);
    if (isNaN(date.getTime())) return displayValue(value);
    const pad = (part) => String(part).padStart(2, '0');
    return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear();
  };

  const renderLongText = (value) => {
    const text = displayValue(value);
    return (
      <Tooltip title={text === EMPTY_VALUE ? '' : text}>
        <span className="gestion-remesas-ellipsis">{text}</span>
      </Tooltip>
    );
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') return EMPTY_VALUE;
    const amount = Number(value);
    if (!isFinite(amount)) return EMPTY_VALUE;
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const progressFor = (record) => {
    const records = Math.max(0, toNumber(record && record.records));
    const processed = Math.max(0, toNumber(record && record.processed));
    const success = Math.max(0, toNumber(record && record.success));
    const errors = Math.max(0, toNumber(record && record.error));
    const completed = processed > 0 ? processed : success + errors;
    const finished = String(record && record.status || '').toUpperCase() === 'FINISHED';

    if (records <= 0) return finished ? 100 : 0;
    return Math.max(0, Math.min(100, Math.round((completed / records) * 100)));
  };

  const boundedBatchCount = (value, record) => {
    const count = Math.max(0, toNumber(value));
    const records = Math.max(0, toNumber(record && record.records));
    return records > 0 ? Math.min(count, records) : count;
  };

  const normalizedBatchStatus = (record) => String(record && record.status || '').trim().toUpperCase();

  const batchExecutionState = (record) => {
    const status = normalizedBatchStatus(record);
    const completed = Math.max(0, toNumber(record && record.processed))
      + Math.max(0, toNumber(record && record.success))
      + Math.max(0, toNumber(record && record.error));

    if (['RUNNING', 'PROCESSING', 'IN_PROGRESS', 'IN PROGRESS', 'EXECUTING'].indexOf(status) >= 0) return 'running';
    if (['PENDING', 'QUEUED'].indexOf(status) >= 0) return completed > 0 ? 'running' : 'pending';
    if (status === 'FINISHED') return 'finished';
    if (['ERROR', 'FAILED'].indexOf(status) >= 0) return 'failed';
    if (!status || ['CREATED', 'READY'].indexOf(status) >= 0) return 'available';
    return 'blocked';
  };

  const canDeleteBatch = (record) => normalizedBatchStatus(record) === 'PENDING'
    && batchExecutionState(record) === 'pending';

  const deleteBatchBlockedMessage = (record) => {
    if (!record) return t('Seleccione una remesa para anular.');
    if (normalizedBatchStatus(record) !== 'PENDING') {
      return t('Solo se pueden anular remesas en estado Pendiente.');
    }
    if (batchExecutionState(record) !== 'pending') {
      return t('La remesa se encuentra en ejecución y no puede anularse.');
    }
    return '';
  };

  const batchStatusPresentation = (record) => {
    const state = batchExecutionState(record);
    if (state === 'running') return { label: t('En ejecución'), color: '#1677ff' };
    if (state === 'pending') return { label: t('Pendiente'), color: '#d48806' };
    if (state === 'finished') return { label: t('Finalizado'), color: '#389e0d' };
    if (state === 'failed') return { label: t('Error'), color: '#cf1322' };
    if (state === 'available') return { label: t('Disponible'), color: '#595959' };
    return { label: displayValue(record && record.status), color: '#595959' };
  };

  const columns = [
    {
      title: t('ID'),
      dataIndex: 'id',
      key: 'remittanceId',
      width: 90,
      render: displayValue
    },
    {
      title: t('Remittance name'),
      dataIndex: 'name',
      key: 'remittanceName',
      width: 220,
      ellipsis: true,
      render: renderLongText
    },
    { title: t('Cash desk'), key: 'cashDesk', width: 90, align: 'center', render: (_, record) => displayValue(record && record.caja) },
    { title: t('Cash desk date'), dataIndex: 'launched', key: 'cashDeskDate', width: 160, align: 'center', render: formatCashDeskDate },
    { title: 'Cajero', dataIndex: 'user', key: 'cashier', width: 180, ellipsis: true, render: renderLongText },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const presentation = batchStatusPresentation(record);
        return <span style={{ color: presentation.color, fontWeight: 600 }}>{presentation.label}</span>;
      }
    },
    {
      title: t('Progress'),
      key: 'progress',
      width: 150,
      render: (_, record) => {
        const percent = progressFor(record);
        const finished = String(record && record.status || '').toUpperCase() === 'FINISHED' || percent >= 100;
        return <Progress percent={percent} size="small" status={finished ? 'success' : 'active'} />;
      }
    },
    { title: t('Lines'), dataIndex: 'records', key: 'lines', width: 90, align: 'right', render: displayValue },
    { title: t('Inconsistencies'), dataIndex: 'error', key: 'inconsistent', width: 120, align: 'right', render: (value, record) => displayValue(boundedBatchCount(value, record)) },
    { title: t('Collected'), dataIndex: 'success', key: 'collected', width: 100, align: 'right', render: (value, record) => displayValue(boundedBatchCount(value, record)) },
    { title: t('Amount paid'), dataIndex: 'montoPagado', key: 'amountPaid', width: 120, align: 'right', render: formatAmount },
    { title: t('Entry date'), dataIndex: 'created', key: 'entryDate', width: 160, align: 'center', render: formatDate }
  ];

  const escapeFilterValue = (value) => String(value || '').replace(/'/g, "''");

  const resolveImportConfigId = () => {
    if (importConfigIdRef.current) return Promise.resolve(importConfigIdRef.current);
    if (importConfigPromiseRef.current) return importConfigPromiseRef.current;

    importConfigPromiseRef.current = exe('RepoImportConfig', {
      operation: 'GET',
      filter: "name = '" + IMPORT_CONFIG_NAME + "'"
    }).then((result) => {
      if (!result || result.ok === false) {
        throw new Error(result && result.msg ? result.msg : t('The Cobros Masivos import configuration could not be loaded.'));
      }

      const data = Array.isArray(result.outData) ? result.outData : [];
      const config = data[0] || null;
      const configId = Number(config && (config.id || config.Id) || 0);
      if (configId <= 0) throw new Error(t('The Cobros Masivos import configuration was not found.'));

      importConfigIdRef.current = configId;
      return configId;
    }).then((configId) => {
      importConfigPromiseRef.current = null;
      return configId;
    }).catch((error) => {
      importConfigPromiseRef.current = null;
      throw error;
    });

    return importConfigPromiseRef.current;
  };

  const buildBatchFilter = (configId, activeFilters) => {
    const conditions = ['importConfigId = ' + Number(configId)];
    const values = activeFilters || {};
    const remesa = String(values.numeroRemesa || '').trim();

    if (remesa) conditions.push('id = ' + Number(remesa));
    if (values.sucursal) {
      conditions.push("JSON_VALUE([jData], '$[0][5].type') = '" + BATCH_METADATA_TYPE + "'");
      conditions.push("JSON_VALUE([jData], '$[0][5].branchCode') = '" + escapeFilterValue(values.sucursal) + "'");
    }
    if (values.cajero) conditions.push("[user] = '" + escapeFilterValue(values.cajero) + "'");
    if (values.fechaDesde) conditions.push("created >= '" + values.fechaDesde.format('YYYY-MM-DD') + "'");
    if (values.fechaHasta) conditions.push("created <= '" + values.fechaHasta.format('YYYY-MM-DD') + " 23:59:59'");

    return conditions.join(' and ');
  };

  const normalizeBatchResponse = (result) => {
    const source = result && result.outData;
    const data = Array.isArray(source)
      ? source
      : (source && Array.isArray(source.data) ? source.data : []);
    const totalSource = source && !Array.isArray(source) ? source.total : null;
    const total = Number(totalSource !== null && totalSource !== undefined ? totalSource : result && result.total);

    return {
      data: data,
      total: isFinite(total) ? total : data.length
    };
  };

  const responseRows = (result) => {
    const source = result && result.outData;
    if (Array.isArray(source)) return source;
    if (source && Array.isArray(source.data)) return source.data;
    return source ? [source] : [];
  };

  const escapeSqlString = (value) => String(value || '').replace(/'/g, "''");

  const openCashDeskFilter = (cashDeskId) => {
    const user = String(currentUserEmail || '').trim();
    if (!user) return '1=0';

    const conditions = ["closed=0", "[user] = N'" + escapeSqlString(user) + "'"];
    if (cashDeskId !== null && cashDeskId !== undefined) {
      conditions.push('id = ' + Number(cashDeskId));
    }
    return conditions.join(' AND ');
  };

  const loadOpenUploadCashDesks = () => {
    if (!currentUserEmail) {
      setUploadCashDeskOptions([]);
      return Promise.reject(new Error(t('The current user could not be identified.')));
    }

    setUploadCashDesksLoading(true);
    return exe('RepoTransferWorkspace', {
      operation: 'GET',
      include: ['Branch'],
      filter: openCashDeskFilter(),
      size: 100,
      page: 0
    })
      .then((result) => {
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : t('Open cash desks could not be loaded.'));
        }

        const options = responseRows(result).map((cashDesk) => {
          const id = Number(cashDesk && cashDesk.id);
          const branch = String(cashDesk && (cashDesk.Branch && (cashDesk.Branch.name || cashDesk.Branch.code)
            || cashDesk.branchCode) || '').trim();
          return {
            value: id,
            label: t('Cash desk') + ' ' + id + (branch ? ' - ' + t('Branch') + ' ' + branch : '')
          };
        }).filter((option) => isFinite(option.value) && option.value > 0);

        setUploadCashDeskOptions(options);
        setSelectedUploadCashDeskId((selectedId) => options.some((option) => option.value === selectedId)
          ? selectedId
          : null);
        return options;
      })
      .catch((error) => {
        setUploadCashDeskOptions([]);
        setSelectedUploadCashDeskId(null);
        throw error;
      })
      .then((options) => {
        setUploadCashDesksLoading(false);
        return options;
      }, (error) => {
        setUploadCashDesksLoading(false);
        throw error;
      });
  };

  const validateOpenUploadCashDesk = (cashDeskId) => exe('RepoTransferWorkspace', {
    operation: 'GET',
    include: ['Branch'],
    filter: openCashDeskFilter(cashDeskId),
    size: 1,
    page: 0
  }).then((result) => {
    if (!result || result.ok === false) {
      throw new Error(result && result.msg ? result.msg : t('The selected cash desk could not be validated.'));
    }
    const cashDesk = responseRows(result)[0];
    if (!cashDesk || Number(cashDesk.id) !== Number(cashDeskId)) {
      throw new Error(t('The selected cash desk is no longer open or available. Select another cash desk.'));
    }
    return cashDesk;
  });

  const payerName = (contact) => {
    const fullName = String(contact && (contact.FullName || contact.fullName) || '').trim();
    if (fullName) return fullName;
    return ['name', 'middlename', 'surname1', 'surname2']
      .map((field) => String(contact && (contact[field]
        || contact[field.charAt(0).toUpperCase() + field.slice(1)]) || '').trim())
      .filter(Boolean)
      .join(' ');
  };

  const payerIdentification = (contact) => {
    if (!contact) return '';
    const isPerson = contact.isPerson === true || contact.isPerson === 1;
    if (isPerson) {
      return String(String(contact.idType || '').toUpperCase() === 'PAS'
        ? (contact.passport || '')
        : (contact.cnp || contact.nationalId || '')).trim();
    }
    return String(contact.nif || contact.nationalId || '').trim();
  };

  const searchUploadPayers = (searchValue) => {
    const search = String(searchValue || '').trim();
    const requestId = uploadPayerSearchRef.current + 1;
    uploadPayerSearchRef.current = requestId;
    if (!search) {
      setUploadPayersLoading(false);
      return Promise.resolve(uploadPayerOptions);
    }

    const escapedSearch = escapeFilterValue(search)
      .replace(/\[/g, '[[]')
      .replace(/%/g, '[%]')
      .replace(/_/g, '[_]');
    const isNumeric = /^\d+$/.test(search);
    const hasNumbers = /\d/.test(search);
    let filter;
    if (isNumeric) {
      filter = "([nationalId] = N'" + escapedSearch + "' OR [id] = " + Number(search)
        + " OR [cnp] LIKE N'" + escapedSearch + "%' OR [passport] LIKE N'" + escapedSearch
        + "%' OR [nif] LIKE N'" + escapedSearch + "%')";
    } else if (hasNumbers) {
      filter = "([cnp] LIKE N'" + escapedSearch + "%' OR [passport] LIKE N'" + escapedSearch
        + "%' OR [nif] LIKE N'" + escapedSearch + "%')";
    } else {
      filter = "TRIM(CONCAT_WS(' ', [name], [middlename], [surname1], [surname2])) LIKE N'"
        + escapedSearch + "%'";
    }

    setUploadPayersLoading(true);
    return exe('GetContacts', {
      filter,
      page: 0,
      size: 50
    }).then((result) => {
      if (requestId !== uploadPayerSearchRef.current) return [];
      if (!result || result.ok === false) {
        throw new Error(result && result.msg ? result.msg : t('Payers could not be loaded.'));
      }

      const options = responseRows(result).map((contact) => {
        const id = Number(contact && (contact.id || contact.Id));
        const name = payerName(contact);
        const identification = payerIdentification(contact);
        return {
          value: id,
          label: id + ' - ' + name + (identification ? ' - ' + identification : ''),
          payerName: name
        };
      }).filter((option) => isFinite(option.value) && option.value > 0 && option.payerName);
      setUploadPayerOptions(options);
      return options;
    }).catch((error) => {
      if (requestId === uploadPayerSearchRef.current) setUploadPayerOptions([]);
      throw error;
    }).then((options) => {
      if (requestId === uploadPayerSearchRef.current) setUploadPayersLoading(false);
      return options;
    }, (error) => {
      if (requestId === uploadPayerSearchRef.current) {
        setUploadPayersLoading(false);
        message.error(error && error.message ? error.message : String(error));
      }
      return [];
    });
  };

  const loadCurrentUser = () => {
    setCurrentUserLoading(true);
    return exe('GetCurrentUser')
      .then((result) => {
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : t('The current user could not be identified.'));
        }

        const user = responseRows(result)[0] || null;
        const email = String(user && (user.email || user.Email || user.userEmail) || '').trim();
        if (!email) throw new Error(t('The current user could not be identified.'));
        setCurrentUserEmail(email);
      })
      .catch((error) => {
        setCurrentUserEmail('');
        message.error(error && error.message ? error.message : String(error));
      })
      .then(() => setCurrentUserLoading(false));
  };

  const loadBranches = () => {
    setBranchesLoading(true);
    return exe('RepoBranch', { operation: 'GET' })
      .then((result) => {
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : t('Branches could not be loaded.'));
        }

        const options = responseRows(result).map((branch) => {
          const code = String(branch && (branch.code || branch.id || branch.branchCode) || '').trim();
          const name = String(branch && (branch.name || branch.description || branch.xdescripcion_l || code) || '').trim();
          return { value: code, label: name || code };
        }).filter((branch) => branch.value);

        setBranchOptions(options);
      })
      .catch((error) => {
        setBranchOptions([]);
        message.error(error && error.message ? error.message : String(error));
      })
      .then(() => setBranchesLoading(false));
  };

  const openNewCashDesk = () => {
    if (!currentUserEmail) {
      message.error(t('The current user could not be identified.'));
      return;
    }

    newCashDeskForm.setFieldsValue({
      user: currentUserEmail,
      date: formatCashDeskDate(new Date()),
      branchCode: undefined
    });
    setNewCashDeskOpen(true);
  };

  const closeNewCashDesk = () => {
    if (newCashDeskLoading) return;
    setNewCashDeskOpen(false);
    newCashDeskForm.resetFields();
  };

  const createCashDesk = (values) => {
    const branchCode = String(values && values.branchCode || '').trim();
    const user = String(currentUserEmail || '').trim();

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
        date: new Date().toISOString(),
        branchCode: branchCode,
        user: user
      }
    })
      .then((result) => {
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : t('The cash desk could not be created.'));
        }

        message.success(result.msg || t('Cash desk created successfully.'));
        setNewCashDeskOpen(false);
        newCashDeskForm.resetFields();
      })
      .catch((error) => message.error(error && error.message ? error.message : String(error)))
      .then(() => setNewCashDeskLoading(false));
  };

  const loadCashiers = () => {
    const usersPageSize = 100;
    setUsersLoading(true);

    const loadUsersPage = (page, collectedUsers, previousSignature) => {
      return exe('GetUsers', { size: usersPageSize, page: page }).then((result) => {
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : t('The cashier catalog could not be loaded.'));
        }

        const users = Array.isArray(result.outData) ? result.outData : [];
        const signature = users.map((user) => String(user && (user.email || user.id || user.nombre) || '')).join('|');
        if (users.length && signature && signature === previousSignature) {
          throw new Error(t('The cashier catalog pagination did not advance.'));
        }

        const accumulatedUsers = collectedUsers.concat(users);
        if (users.length < usersPageSize) return accumulatedUsers;
        return loadUsersPage(page + 1, accumulatedUsers, signature);
      });
    };

    return loadUsersPage(0, [], '')
      .then((users) => {
        const seenEmails = [];
        const options = [];

        users.forEach((user) => {
          const email = String(user && user.email || '').trim();
          if (!email || seenEmails.indexOf(email) >= 0) return;

          const name = String(user && user.nombre || '').trim();
          seenEmails.push(email);
          options.push({
            value: email,
            label: name ? name + ' (' + email + ')' : email
          });
        });

        setUserOptions(options);
      })
      .catch((error) => {
        setUserOptions([]);
        message.error(error && error.message ? error.message : t('The cashier catalog could not be loaded.'));
      })
      .then(() => setUsersLoading(false));
  };

  const enrichBatchRows = (batches) => {
    const source = Array.isArray(batches) ? batches : [];
    const batchIds = source
      .map((batch) => Number(batch && batch.id || 0))
      .filter((id, index, values) => id > 0 && values.indexOf(id) === index);

    if (!batchIds.length) return Promise.resolve(source);

    return exe('LoadEntities', {
      entity: 'Batch',
      fields: 'id,jData',
      filter: 'id in (' + batchIds.join(',') + ')',
      noTracking: true
    }).then((result) => {
      if (!result || result.ok === false) {
        throw new Error(result && result.msg ? result.msg : t('The remittance data could not be loaded.'));
      }

      const entities = Array.isArray(result.outData) ? result.outData : [];
      const detailsById = {};

      entities.forEach((entity) => {
        const batchId = Number(entity && entity.id || 0);
        if (batchId <= 0) return;

        try {
          const paymentRows = parseBatchJData(entity.jData);
          detailsById[batchId] = summarizeBatchDetail(null, paymentRows);
        } catch (error) {
          detailsById[batchId] = null;
        }
      });

      return source.map((batch) => {
        const detail = detailsById[Number(batch && batch.id || 0)];
        if (!detail) return batch;

        const batchDetail = Object.assign({}, detail, { record: batch });
        return Object.assign({}, batch, {
          caja: batchDetail.caja,
          montoPagado: batchDetail.totalRemesa,
          _batchDetail: batchDetail
        });
      });
    });
  };

  const clearSelection = () => {
    detailRequestRef.current += 1;
    selectedBatchIdRef.current = null;
    setSelectedRowKeys([]);
    setSelectedBatch(null);
    setBatchDetail(null);
    setDetailLoading(false);
    setDetailDrawerOpen(false);
    setLineDetailOpen(false);
    setLineDetailPage(1);
  };

  const loadBatches = (current, pageSize, activeFilters) => {
    const requestId = listRequestRef.current + 1;
    listRequestRef.current = requestId;
    setLoading(true);
    setRows([]);
    clearSelection();

    return resolveImportConfigId()
      .then((configId) => exe('RepoBatch', {
        operation: 'GET',
        filter: buildBatchFilter(configId, activeFilters),
        page: Math.max(0, Number(current || 1) - 1),
        size: Number(pageSize || PAGE_SIZE)
      }))
      .then((result) => {
        if (requestId !== listRequestRef.current) return;
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : t('Remittances could not be loaded.'));
        }

        const normalized = normalizeBatchResponse(result);
        return enrichBatchRows(normalized.data).then((enrichedRows) => ({
          normalized: normalized,
          enrichedRows: enrichedRows
        }));
      })
      .then((loadedPage) => {
        if (!loadedPage || requestId !== listRequestRef.current) return;
        setRows(loadedPage.enrichedRows);
        setPagination({
          current: Number(current || 1),
          pageSize: Number(pageSize || PAGE_SIZE),
          total: loadedPage.normalized.total
        });
      })
      .catch((error) => {
        if (requestId !== listRequestRef.current) return;
        setRows([]);
        setPagination({ current: Number(current || 1), pageSize: Number(pageSize || PAGE_SIZE), total: 0 });
        message.error(error && error.message ? error.message : t('Remittances could not be loaded.'));
      })
      .then(() => {
        if (requestId === listRequestRef.current) setLoading(false);
      });
  };

  const loadFreshBatch = (batchId) => exe('RepoBatch', {
    operation: 'GET',
    filter: 'id = ' + Number(batchId),
    page: 0,
    size: 1
  }).then((result) => {
    if (!result || result.ok === false) {
      throw new Error(result && result.msg ? result.msg : t('No se pudo validar el estado actual de la remesa.'));
    }

    const normalized = normalizeBatchResponse(result);
    const batch = normalized.data[0] || null;
    if (!batch) throw new Error(t('La remesa seleccionada ya no se encuentra disponible.'));
    return batch;
  });

  const executionBlockedMessage = (record) => {
    const state = batchExecutionState(record);
    const batchId = displayValue(record && record.id);

    if (state === 'pending') return t('La remesa') + ' ' + batchId + ' ' + t('tiene un proceso pendiente y no puede enviarse nuevamente.');
    if (state === 'running') return t('La remesa') + ' ' + batchId + ' ' + t('se encuentra en ejecución y no puede enviarse nuevamente.');
    if (state === 'finished') return t('La remesa') + ' ' + batchId + ' ' + t('ya fue procesada.');
    if (state === 'failed' || state === 'blocked') {
      return t('El estado actual de la remesa no permite su ejecución:') + ' ' + displayValue(record && record.status);
    }
    return '';
  };

  const mergeFreshBatch = (freshBatch) => {
    const batchId = Number(freshBatch && freshBatch.id || 0);
    if (batchId <= 0) return;

    setRows((currentRows) => currentRows.map((record) => Number(record && record.id) === batchId
      ? Object.assign({}, record, freshBatch)
      : record));
    setSelectedBatch((currentBatch) => Number(currentBatch && currentBatch.id) === batchId
      ? Object.assign({}, currentBatch, freshBatch)
      : currentBatch);

    if (freshBatch._batchDetail && Number(selectedBatchIdRef.current) === batchId) {
      setBatchDetail(Object.assign({}, freshBatch._batchDetail, { record: freshBatch }));
    }
  };

  const refreshFinishedBatchDetail = (batch) => {
    const state = batchExecutionState(batch);
    if (state !== 'finished' && state !== 'failed') return Promise.resolve(batch);

    return enrichBatchRows([batch]).then((enrichedRows) => enrichedRows[0] || batch);
  };

  const refreshActiveBatchRows = () => {
    const pollId = batchStatusPollRef.current + 1;
    batchStatusPollRef.current = pollId;

    const activeIds = rows
      .filter((record) => ['pending', 'running'].indexOf(batchExecutionState(record)) >= 0)
      .map((record) => Number(record && record.id || 0))
      .filter((id, index, values) => id > 0 && values.indexOf(id) === index);

    if (!activeIds.length) return Promise.resolve();

    return Promise.all(activeIds.map((batchId) => exe('SetBatchResults', { batchId: batchId })
      .then((result) => {
        if (result && result.ok === false) {
          throw new Error(result.msg || t('No se pudo actualizar el progreso de la remesa.'));
        }
        return loadFreshBatch(batchId).then(refreshFinishedBatchDetail);
      })))
      .then((freshBatches) => {
        if (pollId !== batchStatusPollRef.current) return;
        freshBatches.forEach(mergeFreshBatch);
      })
      .catch(() => {
        // A transient polling error must not interrupt the user's work.
      });
  };

  const loadBatchValidationRows = (batchId) => exe('LoadEntity', {
    entity: 'Batch',
    fields: 'jData',
    filter: 'id = ' + Number(batchId),
    noTracking: true
  }).then((result) => {
    if (!result || result.ok === false || !result.outData) {
      throw new Error(result && result.msg ? result.msg : t('No se pudieron cargar las filas de la remesa para validarlas.'));
    }

    const entity = Array.isArray(result.outData) ? result.outData[0] : result.outData;
    const validationRows = parseBatchJData(entity && entity.jData);
    if (!validationRows.length) throw new Error(t('La remesa no contiene filas para validar.'));
    return validationRows;
  });

  const processSelectedRemittance = () => {
    const batch = selectedBatch;
    const batchId = Number(batch && batch.id || 0);
    if (batchId <= 0) {
      message.warning(t('Seleccione una remesa para procesar.'));
      return;
    }

    const blockedMessage = executionBlockedMessage(batch);
    if (blockedMessage) {
      message.warning(blockedMessage);
      return;
    }

    if (batchExecutionRef.current[batchId]) {
      message.warning(t('La remesa ya está siendo enviada a procesamiento.'));
      return;
    }

    Modal.confirm({
      title: t('Procesar remesa'),
      content: t('¿Está seguro de que desea procesar la remesa seleccionada?'),
      okText: t('Aceptar'),
      cancelText: t('Cancelar'),
      onOk: () => {
        if (batchExecutionRef.current[batchId]) {
          message.warning(t('La remesa ya está siendo enviada a procesamiento.'));
          return;
        }

        batchExecutionRef.current[batchId] = true;
        setProcessingBatchId(batchId);

        return loadFreshBatch(batchId)
          .then((freshBatch) => {
            mergeFreshBatch(freshBatch);
            const freshBlockedMessage = executionBlockedMessage(freshBatch);
            if (freshBlockedMessage) throw new Error(freshBlockedMessage);
            return loadBatchValidationRows(batchId).then((validationRows) => exe('ExeChain', {
              chain: PRE_OPERATION_CHAIN,
              context: JSON.stringify({ batchId: batchId, rows: validationRows })
            })).then((validationResult) => {
              const validationPayload = validationResult
                && validationResult.outData
                && !Array.isArray(validationResult.outData)
                ? validationResult.outData
                : validationResult;

              if (!validationResult
                || validationResult.ok === false
                || !validationPayload
                || validationPayload.ok === false) {
                throw new Error(validationPayload && validationPayload.msg
                  ? validationPayload.msg
                  : (validationResult && validationResult.msg
                    ? validationResult.msg
                    : t('La validación previa de la remesa fue rechazada.')));
              }

              return exe('DoBatch', { batchId: batchId });
            });
          })
          .then((result) => {
            if (!result || result.ok === false) {
              throw new Error(result && result.msg ? result.msg : t('No se pudo ejecutar la remesa.'));
            }

            const pendingBatch = Object.assign({}, batch, { status: 'PENDING', processed: 0, success: 0, error: 0 });
            mergeFreshBatch(pendingBatch);
            message.success(result.msg || (t('La remesa') + ' ' + batchId + ' ' + t('fue enviada a procesamiento.')));
          })
          .catch((error) => {
            message.error(error && error.message ? error.message : String(error || t('No se pudo ejecutar la remesa.')));
          })
          .then(() => {
            delete batchExecutionRef.current[batchId];
            setProcessingBatchId((currentId) => Number(currentId) === batchId ? null : currentId);
          });
      }
    });
  };

  const deleteSelectedRemittance = () => {
    const batch = selectedBatch;
    const batchId = Number(batch && batch.id || 0);
    const blockedMessage = deleteBatchBlockedMessage(batch);

    if (batchId <= 0 || blockedMessage) {
      message.warning(blockedMessage || t('Seleccione una remesa para anular.'));
      return;
    }

    if (batchExecutionRef.current[batchId] || batchDeletionRef.current[batchId]) {
      message.warning(t('La remesa está siendo procesada y no puede anularse.'));
      return;
    }

    Modal.confirm({
      title: t('Anular remesa'),
      content: t('¿Está seguro de que desea eliminar la remesa seleccionada?'),
      okText: t('Aceptar'),
      cancelText: t('Cancelar'),
      okButtonProps: { danger: true },
      onOk: () => {
        batchDeletionRef.current[batchId] = true;
        setDeletingBatchId(batchId);

        return loadFreshBatch(batchId)
          .then((freshBatch) => {
            mergeFreshBatch(freshBatch);
            const freshBlockedMessage = deleteBatchBlockedMessage(freshBatch);
            if (freshBlockedMessage) throw new Error(freshBlockedMessage);
            if (batchExecutionRef.current[batchId]) {
              throw new Error(t('La remesa se encuentra en ejecución y no puede anularse.'));
            }

            return exe('RepoBatch', {
              operation: 'DELETE',
              entity: { id: batchId }
            });
          })
          .then((result) => {
            if (!result || result.ok === false) {
              throw new Error(result && result.msg ? result.msg : t('No se pudo anular la remesa.'));
            }

            message.success(result.msg || (t('La remesa') + ' ' + batchId + ' ' + t('fue anulada.')));
            return loadBatches(pagination.current, pagination.pageSize, filters);
          })
          .catch((error) => {
            message.error(error && error.message ? error.message : String(error || t('No se pudo anular la remesa.')));
            throw error;
          })
          .then(() => {
            delete batchDeletionRef.current[batchId];
            setDeletingBatchId((currentId) => Number(currentId) === batchId ? null : currentId);
          }, (error) => {
            delete batchDeletionRef.current[batchId];
            setDeletingBatchId((currentId) => Number(currentId) === batchId ? null : currentId);
            throw error;
          });
      }
    });
  };

  const isCanonicalImportHeaderRow = (item) => Array.isArray(item)
    && item.length >= BATCH_IMPORT_HEADERS.length
    && BATCH_IMPORT_HEADERS.every((header, index) => String(item[index] === undefined ? '' : item[index]).trim() === header);

  const isBatchMetadata = (value) => value && typeof value === 'object'
    && !Array.isArray(value)
    && String(value.type || '').toUpperCase() === BATCH_METADATA_TYPE;

  const paymentRowResult = (item) => {
    if (!Array.isArray(item) || item.length <= 5) return null;
    const extraValues = item.slice(5).filter((value) => !isBatchMetadata(value));
    return extraValues.length ? extraValues[extraValues.length - 1] : null;
  };

  const normalizePaymentRows = (jData) => {
    return jData.filter((item) => !isCanonicalImportHeaderRow(item)).map((item) => {
      if (Array.isArray(item)) {
        const metadata = item.slice(5).find(isBatchMetadata) || {};
        return {
          workspaceId: item[0],
          policyCode: item[1],
          holderId: item[2],
          numRecibo: item[3],
          monto: item[4],
          result: paymentRowResult(item),
          accountNumber: null,
          paymentNumber: null,
          client: null,
          branchCode: metadata.branchCode,
          branchName: metadata.branchName,
          ...(metadata.payerId !== undefined || metadata.payerName !== undefined
            ? { payerId: metadata.payerId, payerName: metadata.payerName }
            : {})
        };
      }

      const source = item && typeof item === 'object' ? item : {};
      return {
        workspaceId: source.workspaceId !== undefined ? source.workspaceId : source.ID_Caja,
        policyCode: source.policyCode !== undefined ? source.policyCode : source.Codigo_Poliza,
        holderId: source.holderId !== undefined ? source.holderId : source.ID_Cliente,
        numRecibo: source.numRecibo !== undefined ? source.numRecibo : source.Numero_Recibo,
        monto: source.monto !== undefined ? source.monto : source.Monto_Pago,
        result: source.result !== undefined ? source.result
          : (source.status !== undefined ? source.status
            : (source.estado !== undefined ? source.estado : source.message)),
        accountNumber: source.accountNumber !== undefined ? source.accountNumber
          : (source.No_Cta !== undefined ? source.No_Cta : source.numeroCuenta),
        paymentNumber: source.paymentNumber !== undefined ? source.paymentNumber
          : (source.No_Pago !== undefined ? source.No_Pago : source.numeroPago),
        client: source.client !== undefined ? source.client
          : (source.Cliente !== undefined ? source.Cliente
            : (source.clientName !== undefined ? source.clientName : null)),
        branchCode: source.branchCode,
        branchName: source.branchName,
        ...(source.payerId !== undefined || source.payerName !== undefined
          ? { payerId: source.payerId, payerName: source.payerName }
          : {})
      };
    });
  };

  const parseBatchJData = (value) => {
    if (value === null || value === undefined || String(value).trim() === '') return [];
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error(t('The remittance detail has an invalid structure.'));
    return normalizePaymentRows(parsed);
  };

  const numericPaymentAmount = (value) => {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value !== 'string' || value.trim() === '') return null;
    const trimmedValue = value.trim();
    const normalizedValue = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmedValue)
      ? trimmedValue.replace(/,/g, '')
      : trimmedValue;
    const amount = Number(normalizedValue);
    return isFinite(amount) ? amount : null;
  };

  const normalizedCashDeskValue = (value) => String(value === null || value === undefined ? '' : value).trim();

  const normalizedCompositeText = (value) => String(value === null || value === undefined ? '' : value)
    .trim()
    .toUpperCase();

  const normalizedAmountKey = (value) => {
    const amount = numericPaymentAmount(value);
    return amount === null ? '' : amount.toFixed(2);
  };

  const paymentCompositeKey = (policy, receipt, amount) => [
    normalizedCompositeText(policy),
    normalizedCompositeText(receipt),
    normalizedAmountKey(amount)
  ].join('|');

  const queryValue = (row, names) => {
    for (let index = 0; index < names.length; index += 1) {
      if (row && row[names[index]] !== undefined) return row[names[index]];
    }
    return null;
  };

  const fullClientName = (row) => ['name', 'middlename', 'surname1', 'surname2']
    .map((field) => String(queryValue(row, [field, field.charAt(0).toUpperCase() + field.slice(1)]) || '').trim())
    .filter(Boolean)
    .join(' ');

  const holderIdentityKey = (value) => normalizedCompositeText(value);

  const loadBatchClientReferences = (paymentRows) => {
    const holderIds = paymentRows.map((item) => Number(item.holderId))
      .filter((holderId) => isFinite(holderId) && holderId > 0)
      .filter((holderId, index, values) => values.indexOf(holderId) === index);
    if (!holderIds.length) return Promise.resolve([]);

    const sql = `SELECT
      contact.id AS holderId,
      contact.name,
      contact.middlename,
      contact.surname1,
      contact.surname2
    FROM Contact contact
    WHERE contact.id IN (${holderIds.join(',')})`;

    return exe('DoQuery', { sql: sql }).then((result) => {
      if (!result || result.ok === false) {
        throw new Error(result && result.msg ? result.msg : t('Client references could not be loaded.'));
      }
      return responseRows(result);
    });
  };

  const loadBatchPaymentReferences = (batchId, paymentRows) => {
    const policies = paymentRows.map((item) => normalizedCashDeskValue(item.policyCode)).filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index);
    const receipts = paymentRows.map((item) => normalizedCashDeskValue(item.numRecibo)).filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index);
    if (!policies.length || !receipts.length) return Promise.resolve([]);

    const sqlList = (values) => values.map((value) => "N'" + escapeSqlString(value) + "'").join(',');
    const sql = `SELECT DISTINCT
      transfer.id AS paymentNumber,
      transfer.amount AS transferAmount,
      policy.code AS policyCode,
      CASE
        WHEN bill.fiscalNumber IN (${sqlList(receipts)}) THEN bill.fiscalNumber
        WHEN policy.fiscalNumber IN (${sqlList(receipts)}) THEN policy.fiscalNumber
        ELSE NULL
      END AS receiptNumber
    FROM Transfer transfer
    INNER JOIN AllocationInstallment allocationInstallment
      ON allocationInstallment.allocationId = transfer.allocationId
    INNER JOIN PayPlan payPlan ON payPlan.id = allocationInstallment.payPlanId
    INNER JOIN LifePolicy policy ON policy.id = allocationInstallment.lifePolicyId
    LEFT JOIN [Change] policyChange ON policyChange.id = payPlan.changeId
    LEFT JOIN Bill bill ON bill.changeId = policyChange.id
    WHERE TRY_CAST(transfer.processIdAux AS INT) = ${Number(batchId)}
      AND policy.code IN (${sqlList(policies)})
      AND (policy.fiscalNumber IN (${sqlList(receipts)}) OR bill.fiscalNumber IN (${sqlList(receipts)}))`;

    return exe('DoQuery', { sql: sql }).then((result) => {
      if (!result || result.ok === false) {
        throw new Error(result && result.msg ? result.msg : t('Payment references could not be loaded.'));
      }
      return responseRows(result);
    });
  };

  const enrichPaymentRows = (paymentRows, references, clientReferences) => {
    const transferIdsByKey = {};
    const clientNamesByHolderId = {};

    references.forEach((reference) => {
      const policy = queryValue(reference, ['policyCode', 'PolicyCode']);
      const receipt = queryValue(reference, ['receiptNumber', 'ReceiptNumber']);
      const transferAmount = queryValue(reference, ['transferAmount', 'TransferAmount']);
      const paymentNumber = Number(queryValue(reference, ['paymentNumber', 'PaymentNumber']) || 0);
      const compositeKey = paymentCompositeKey(policy, receipt, transferAmount);

      if (paymentNumber > 0) {
        if (!transferIdsByKey[compositeKey]) transferIdsByKey[compositeKey] = [];
        if (transferIdsByKey[compositeKey].indexOf(paymentNumber) < 0) {
          transferIdsByKey[compositeKey].push(paymentNumber);
        }
      }
    });

    clientReferences.forEach((reference) => {
      const holderId = holderIdentityKey(queryValue(reference, ['holderId', 'HolderId', 'id', 'Id']));
      const clientName = fullClientName(reference);
      if (holderId && clientName) {
        if (!clientNamesByHolderId[holderId]) clientNamesByHolderId[holderId] = [];
        if (clientNamesByHolderId[holderId].indexOf(clientName) < 0) {
          clientNamesByHolderId[holderId].push(clientName);
        }
      }
    });

    return paymentRows.map((item) => {
      const transferIds = transferIdsByKey[paymentCompositeKey(item.policyCode, item.numRecibo, item.monto)] || [];
      const clientNames = clientNamesByHolderId[holderIdentityKey(item.holderId)] || [];
      const existingClient = normalizedCashDeskValue(item.client);
      const safeExistingClient = existingClient
        && existingClient !== normalizedCashDeskValue(item.holderId)
        && !/^\d+$/.test(existingClient)
        ? existingClient
        : null;
      return Object.assign({}, item, {
        paymentNumber: transferIds.length === 1 ? transferIds[0] : null,
        client: clientNames.length === 1 ? clientNames[0] : safeExistingClient
      });
    });
  };

  const summarizeBatchDetail = (record, paymentRows) => {
    const boxes = [];
    let totalAmount = 0;
    let hasAmount = false;

    paymentRows.forEach((item) => {
      const box = normalizedCashDeskValue(item.workspaceId);
      if (box && boxes.indexOf(box) < 0) boxes.push(box);
      const amount = numericPaymentAmount(item.monto);
      if (amount !== null) {
        totalAmount += amount;
        hasAmount = true;
      }
    });

    return {
      caja: boxes.length === 1 ? boxes[0] : (boxes.length > 1 ? t('Multiple') : EMPTY_VALUE),
      sucursal: paymentRows.map((item) => normalizedCashDeskValue(item.branchName || item.branchCode))
        .find(Boolean) || EMPTY_VALUE,
      movimientos: paymentRows.length,
      totalRemesa: hasAmount ? totalAmount : null,
      paymentRows: paymentRows,
      record: record
    };
  };

  const loadBatchDetail = (record) => {
    const batchId = Number(record && record.id || 0);
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setSelectedBatch(record);

    setBatchDetail(null);
    setDetailLoading(true);

    const paymentRowsPromise = record && record._batchDetail
      ? Promise.resolve(record._batchDetail.paymentRows || [])
      : exe('LoadEntity', {
        entity: 'Batch',
        fields: 'jData',
        filter: 'id = ' + batchId,
        noTracking: true
      }).then((result) => {
        if (!result || result.ok === false || !result.outData) {
          throw new Error(result && result.msg ? result.msg : t('The remittance detail could not be loaded.'));
        }
        const entity = Array.isArray(result.outData) ? result.outData[0] : result.outData;
        return parseBatchJData(entity && entity.jData);
      });

    return paymentRowsPromise.then((paymentRows) => Promise.all([
      loadBatchPaymentReferences(batchId, paymentRows).then((references) => ({ references: references, error: null }))
        .catch((error) => ({ references: [], error: error })),
      loadBatchClientReferences(paymentRows).then((references) => ({ references: references, error: null }))
        .catch((error) => ({ references: [], error: error }))
    ]).then((results) => {
      results.filter((result) => result.error).forEach((result) => {
        message.error(result.error && result.error.message ? result.error.message : String(result.error));
      });
      return enrichPaymentRows(paymentRows, results[0].references, results[1].references);
    }))
      .then((paymentRows) => {
      if (requestId !== detailRequestRef.current) return;
      const detail = summarizeBatchDetail(record, paymentRows);
      setBatchDetail(detail);
    }).catch((error) => {
      if (requestId !== detailRequestRef.current) return;
      setBatchDetail(null);
      message.error(error && error.message ? error.message : t('The remittance detail could not be loaded.'));
    }).then(() => {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    });
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const remesa = String(values.numeroRemesa || '').trim();
    if (remesa && !/^\d+$/.test(remesa)) {
      message.warning(t('The remittance ID must be numeric.'));
      return;
    }

    setFilters(values);
    loadBatches(1, pagination.pageSize || PAGE_SIZE, values);
  };

  const handleClear = () => {
    form.resetFields();
    setFilters({});
    loadBatches(1, PAGE_SIZE, {});
  };

  const handleTableChange = (nextPagination) => {
    loadBatches(nextPagination.current || 1, nextPagination.pageSize || PAGE_SIZE, filters);
  };

  const clearUploadSelection = () => {
    uploadFileReadRef.current += 1;
    setSelectedUploadFile(null);
    setUploadFileParsing(false);
  };

  const resetUpload = () => {
    clearUploadSelection();
    setSelectedUploadCashDeskId(null);
    setSelectedUploadPayer(null);
    setUploadCashDeskOptions([]);
    setUploadPayerOptions([]);
    uploadPayerSearchRef.current += 1;
    setUploadModalOpen(false);
  };

  const openUpload = () => {
    if (!currentUserEmail) {
      message.error(t('The current user could not be identified.'));
      return;
    }

    clearUploadSelection();
    setSelectedUploadCashDeskId(null);
    setSelectedUploadPayer(null);
    setUploadPayerOptions([]);
    setUploadModalOpen(true);
    loadOpenUploadCashDesks()
      .then((options) => {
        if (!options.length) message.warning(t('No open cash desks are available for the current user.'));
      })
      .catch((error) => message.error(error && error.message ? error.message : String(error)));
  };

  const isXlsxFileName = (fileName) => /\.xlsx$/i.test(String(fileName || ''));

  const selectUploadFile = (file) => {
    if (!isXlsxFileName(file && file.name)) {
      message.error('No se pudo seleccionar el archivo. Solo se permiten archivos Excel con extensión .xlsx. La primera hoja debe incluir las columnas: ' + REQUIRED_XLSX_COLUMNS + '.');
      return Upload.LIST_IGNORE !== undefined ? Upload.LIST_IGNORE : false;
    }
    if (!file || Number(file.size || 0) <= 0) {
      message.error('No se pudo seleccionar el archivo porque está vacío. El archivo .xlsx debe incluir el encabezado y al menos una fila de datos en la primera hoja.');
      return Upload.LIST_IGNORE !== undefined ? Upload.LIST_IGNORE : false;
    }

    const requestId = uploadFileReadRef.current + 1;
    uploadFileReadRef.current = requestId;
    setSelectedUploadFile(file);
    setUploadFileParsing(true);
    readXlsxFile(file)
      .then(() => undefined)
      .catch((error) => {
        if (requestId !== uploadFileReadRef.current) return;
        setSelectedUploadFile(null);
        message.error(error && error.message ? error.message : String(error));
      })
      .then(() => {
        if (requestId === uploadFileReadRef.current) setUploadFileParsing(false);
      });
    return false;
  };

  const isUsableXlsxLibrary = (xlsxLibrary) => Boolean(xlsxLibrary
    && typeof xlsxLibrary.read === 'function'
    && xlsxLibrary.utils
    && typeof xlsxLibrary.utils.sheet_to_json === 'function');

  const isUsableXlsxExportLibrary = (xlsxLibrary) => Boolean(xlsxLibrary
    && typeof xlsxLibrary.writeFile === 'function'
    && xlsxLibrary.utils
    && typeof xlsxLibrary.utils.aoa_to_sheet === 'function'
    && typeof xlsxLibrary.utils.book_new === 'function'
    && typeof xlsxLibrary.utils.book_append_sheet === 'function');

  const availableXlsxLibrary = () => {
    const runtimeLibraries = typeof libs !== 'undefined' && libs ? libs : {};
    const globalLibrary = typeof XLSX !== 'undefined'
      ? XLSX
      : (typeof window !== 'undefined' ? window.XLSX : null);
    const candidates = [runtimeLibraries.XLSX, runtimeLibraries.xlsx, runtimeLibraries.xlsxJs, globalLibrary];
    return candidates.find(isUsableXlsxLibrary) || null;
  };

  const ensureXlsxLibrary = () => {
    const availableLibrary = availableXlsxLibrary();
    if (availableLibrary) return Promise.resolve(availableLibrary);
    if (xlsxLibraryPromiseRef.current) return xlsxLibraryPromiseRef.current;

    xlsxLibraryPromiseRef.current = exe('ExeChain', {
      chain: 'cmdLoadLibrariesGroupedBordereau',
      context: '{}'
    }).then((response) => {
      if (!response || response.ok === false) {
        throw new Error(response && response.msg
          ? response.msg
          : 'No se pudo cargar el componente de Excel de SIS11. Intente seleccionar nuevamente el archivo .xlsx. Si el problema continúa, contacte al administrador del sistema.');
      }

      const loadedLibraries = response.outData || {};
      const loadedXlsx = loadedLibraries.XLSX || loadedLibraries.xlsx || loadedLibraries.xlsxJs;
      let evaluatedXlsx = null;
      if (typeof loadedXlsx === 'string') {
        // SIS11 returns trusted library source from its backend chain; established views hydrate it locally this way.
        const evaluatedResult = eval(loadedXlsx);
        const evaluatedGlobal = typeof XLSX !== 'undefined' ? XLSX : null;
        evaluatedXlsx = isUsableXlsxLibrary(evaluatedGlobal) ? evaluatedGlobal : evaluatedResult;
      } else if (loadedXlsx && typeof window !== 'undefined') {
        window.XLSX = loadedXlsx;
      }

      const hydratedLibrary = availableXlsxLibrary()
        || (loadedXlsx && typeof loadedXlsx !== 'string' ? loadedXlsx : null)
        || evaluatedXlsx;
      if (!isUsableXlsxLibrary(hydratedLibrary)) {
        throw new Error('SIS11 respondió a la solicitud, pero el componente para leer archivos Excel no quedó disponible. Intente nuevamente y, si el problema continúa, contacte al administrador del sistema.');
      }
      if (typeof window !== 'undefined' && !window.XLSX) window.XLSX = hydratedLibrary;
      return hydratedLibrary;
    }).then((xlsxLibrary) => {
      xlsxLibraryPromiseRef.current = null;
      return xlsxLibrary;
    }).catch((error) => {
      xlsxLibraryPromiseRef.current = null;
      throw error;
    });

    return xlsxLibraryPromiseRef.current;
  };

  const readFileAsArrayBuffer = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (!reader.result) {
        reject(new Error('No se pudo leer el archivo Excel. Verifique que el archivo .xlsx no esté vacío o dañado y que la primera hoja incluya las columnas: ' + REQUIRED_XLSX_COLUMNS + '.'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo Excel. Verifique que el archivo .xlsx no esté vacío o dañado y que la primera hoja incluya las columnas: ' + REQUIRED_XLSX_COLUMNS + '.'));
    reader.readAsArrayBuffer(file);
  });

  const validateWorkbookRows = (workbookRows) => {
    const hasDataRow = workbookRows.slice(1)
      .some((row) => row.some((value) => String(value).trim() !== ''));
    if (workbookRows.length < 2 || !hasDataRow) {
      throw new Error('No se pudo cargar el archivo porque la primera hoja no contiene datos. Incluya el encabezado requerido y al menos una fila de remesa. Columnas obligatorias: ' + REQUIRED_XLSX_COLUMNS + '.');
    }
    const header = workbookRows[0].map((value) => String(value).trim());
    const missingHeaders = REQUIRED_IMPORT_HEADERS.filter((requiredHeader) => header.indexOf(requiredHeader) < 0);
    if (missingHeaders.length) {
      throw new Error('No se pudo cargar el archivo porque faltan columnas obligatorias en la primera hoja: '
        + missingHeaders.join(', ') + '. El encabezado requerido es: ' + REQUIRED_XLSX_COLUMNS + '.');
    }

    const repeatedHeaders = header.filter((value, index, values) => value && values.indexOf(value) !== index);
    if (repeatedHeaders.length) {
      throw new Error('No se pudo cargar el archivo porque contiene columnas duplicadas: '
        + repeatedHeaders.filter((value, index, values) => values.indexOf(value) === index).join(', ') + '.');
    }

    const unexpectedHeaders = header.filter((value) => value && REQUIRED_IMPORT_HEADERS.indexOf(value) < 0);
    if (unexpectedHeaders.length) {
      throw new Error('No se pudo cargar el archivo porque contiene columnas no permitidas: '
        + unexpectedHeaders.join(', ') + '. El encabezado requerido es: ' + REQUIRED_XLSX_COLUMNS + '.');
    }
  };

  const remittanceRowsForCashDesk = (parsedRows, cashDeskId, cashDesk, payer) => {
    const sourceHeader = parsedRows[0].map((value) => String(value).trim());
    const sourceIndexes = REQUIRED_IMPORT_HEADERS.map((header) => sourceHeader.indexOf(header));
    const branch = cashDesk && cashDesk.Branch || {};
    const metadata = {
      type: BATCH_METADATA_TYPE,
      branchCode: String(cashDesk && (cashDesk.branchCode || branch.code || branch.id) || '').trim(),
      branchName: String(branch.name || branch.description || cashDesk && cashDesk.branchCode || '').trim(),
      payerId: payer.id,
      payerName: payer.name
    };
    const dataRows = parsedRows.slice(1).map((row) => [cashDeskId]
      .concat(sourceIndexes.map((sourceIndex) => row[sourceIndex]))
      .concat([metadata]));
    return dataRows;
  };

  const parseXlsxWorkbook = (arrayBuffer, xlsxLibrary) => {
    let workbook;
    try {
      workbook = xlsxLibrary.read(arrayBuffer, { type: 'array' });
    } catch (error) {
      throw new Error('No se pudo abrir el archivo. Verifique que sea un libro Excel .xlsx válido, que no esté dañado y que la primera hoja incluya las columnas: ' + REQUIRED_XLSX_COLUMNS + '.');
    }

    const firstSheetName = workbook && Array.isArray(workbook.SheetNames) ? workbook.SheetNames[0] : null;
    const firstSheet = firstSheetName && workbook.Sheets ? workbook.Sheets[firstSheetName] : null;
    if (!firstSheetName || !firstSheet) {
      throw new Error('No se pudo cargar el archivo porque no contiene una hoja válida. Agregue una primera hoja con las columnas: ' + REQUIRED_XLSX_COLUMNS + '.');
    }

    let workbookRows;
    try {
      workbookRows = xlsxLibrary.utils.sheet_to_json(firstSheet, {
        header: 1,
        defval: '',
        raw: true
      });
    } catch (error) {
      throw new Error('No se pudo leer la primera hoja del archivo .xlsx. Verifique que no esté protegida o dañada y que incluya las columnas: ' + REQUIRED_XLSX_COLUMNS + '.');
    }

    const normalizedRows = (Array.isArray(workbookRows) ? workbookRows : [])
      .map((row) => (Array.isArray(row) ? row : []).map((value) => value === null || value === undefined ? '' : value));
    while (normalizedRows.length
      && normalizedRows[normalizedRows.length - 1].every((value) => String(value).trim() === '')) {
      normalizedRows.pop();
    }
    if (!normalizedRows.length) {
      throw new Error('No se pudo cargar el archivo porque la primera hoja está vacía. Incluya las columnas ' + REQUIRED_XLSX_COLUMNS + ' y al menos una fila de datos.');
    }
    validateWorkbookRows(normalizedRows);
    return normalizedRows;
  };

  const readXlsxFile = (file) => readFileAsArrayBuffer(file)
    .then((arrayBuffer) => ensureXlsxLibrary()
      .then((xlsxLibrary) => parseXlsxWorkbook(arrayBuffer, xlsxLibrary)));

  const processUpload = () => {
    if (!selectedUploadCashDeskId) {
      message.warning(t('Select an open cash desk before processing the file.'));
      return;
    }
    if (!selectedUploadPayer || Number(selectedUploadPayer.id) <= 0 || !String(selectedUploadPayer.name || '').trim()) {
      message.warning(t('Select a payer before processing the file.'));
      return;
    }
    if (!selectedUploadFile) {
      message.warning(t('Seleccione un archivo Excel con extensión .xlsx para cargar.'));
      return;
    }
    if (uploading || uploadFileParsing) return;

    setUploading(true);
    readXlsxFile(selectedUploadFile)
      .then((parsedRows) => {
        return validateOpenUploadCashDesk(selectedUploadCashDeskId).then((cashDesk) => {
          const remittanceRows = remittanceRowsForCashDesk(parsedRows, selectedUploadCashDeskId, cashDesk, selectedUploadPayer);

          return resolveImportConfigId().then((configId) => exe('RepoBatch', {
            operation: 'ADD',
            entity: {
              importConfigId: configId,
              jData: JSON.stringify(remittanceRows),
              name: 'Cobro Remesa - ' + formatCashDeskDate(new Date()) + ' - ' + selectedUploadPayer.name,
              processingType: 0,
              records: parsedRows.length - 1
            }
          }));
        });
      })
      .then((result) => {
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : t('No se pudo cargar la remesa.'));
        }

        if (result.msg) message.success(result.msg);
        resetUpload();
        return loadBatches(1, pagination.pageSize || PAGE_SIZE, filters);
      })
      .catch((error) => {
        message.error(error && error.message ? error.message : String(error || t('No se pudo cargar la remesa.')));
      })
      .then(() => setUploading(false));
  };

  const selectBatch = (record) => {
    const batchId = Number(record && record.id || 0);
    if (batchId <= 0 || selectedBatchIdRef.current === batchId) return;

    selectedBatchIdRef.current = batchId;
    setSelectedRowKeys([record.id]);
    setLineDetailPage(1);
    loadBatchDetail(record);
  };

  const handleSelectionChange = (keys, selectedRows) => {
    const record = selectedRows && selectedRows[0];
    if (record) selectBatch(record);
    else clearSelection();
  };

  React.useEffect(() => {
    const style = document.createElement('style');
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    let resizeFrame = null;

    const fitShellToViewport = () => {
      const shell = shellRef.current;
      if (!shell) return;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const shellTop = Math.max(0, shell.getBoundingClientRect().top);
      const availableHeight = Math.max(0, Math.floor(viewportHeight - shellTop - 8));
      shell.style.height = availableHeight + 'px';
      shell.style.maxHeight = availableHeight + 'px';
    };

    const scheduleViewportFit = () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(fitShellToViewport);
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    style.setAttribute('data-gestion-remesas-style', 'true');
    style.innerHTML = `
      .gestion-remesas-shell {
        width: 100%;
        height: calc(100dvh - 72px);
        max-height: calc(100dvh - 72px);
        min-height: 0;
        overflow: hidden;
        box-sizing: border-box;
        padding: 4px 8px 8px;
      }

      .gestion-remesas-shell > .gestion-remesas-card {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .gestion-remesas-shell > .gestion-remesas-card > .ant-card-head,
      .gestion-remesas-filter-collapse,
      .gestion-remesas-actions {
        flex: 0 0 auto;
      }

      .gestion-remesas-shell > .gestion-remesas-card > .ant-card-head {
        min-height: 48px;
        padding: 0 16px;
        border-bottom: 1px solid #cbd1d8;
      }

      .gestion-remesas-title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #1f1f1f;
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
      }

      .gestion-remesas-title-mark {
        width: 8px;
        height: 22px;
        border-radius: 2px;
        background: #1677ff;
      }

      .gestion-remesas-shell > .gestion-remesas-card > .ant-card-body {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 4px;
      }

      .gestion-remesas-filter-collapse .ant-collapse-content-box {
        padding: 0 !important;
      }

      .gestion-remesas-filter-card .ant-card-body,
      .gestion-remesas-caja-card .ant-card-body {
        padding: 8px 12px !important;
      }

      .gestion-remesas-filter-form .ant-form-item,
      .gestion-remesas-detail-form .ant-form-item {
        margin-bottom: 6px !important;
      }

      .gestion-remesas-filter-collapse {
        border: 1px solid #cbd1d8;
        border-radius: 4px;
      }

      .gestion-remesas-filter-collapse > .ant-collapse-item > .ant-collapse-header {
        padding: 8px 12px;
        color: #174f7c;
        font-size: 13px;
        font-weight: 600;
      }

      .gestion-remesas-actions {
        display: flex;
        align-items: center;
        min-height: 42px;
        margin: 0;
        padding: 4px 0;
        background: #e6f7ff;
        border: 1px solid #91caff;
        border-radius: 0;
        box-shadow: 0 1px 3px rgba(22, 119, 255, 0.12);
      }

      .gestion-remesas-actions > .ant-space {
        margin-left: 4px;
        margin-right: 4px;
      }

      .gestion-remesas-actions,
      .gestion-remesas-upload-actions,
      .gestion-remesas-line-actions {
        gap: 8px;
      }

      .gestion-remesas-upload-actions,
      .gestion-remesas-line-actions {
        display: flex;
        align-items: center;
        min-height: 42px;
        margin: 8px -4px 0;
        padding: 4px;
        background: #e6f7ff;
        border: 1px solid #91caff;
      }

      .gestion-remesas-line-actions {
        flex: 0 0 auto;
        margin-top: 0;
      }

      .gestion-remesas-upload-actions .ant-btn:disabled,
      .gestion-remesas-line-actions .ant-btn:disabled {
        border-color: #6f7b88;
        opacity: 1;
      }

      .gestion-remesas-actions .ant-btn:disabled {
        border-color: #6f7b88;
        opacity: 1;
      }

      .gestion-remesas-actions .gestion-remesas-process-button,
      .gestion-remesas-actions .gestion-remesas-export-button {
        background: #60b13d;
        border-color: #4f9336;
        color: #fff;
      }

      .gestion-remesas-actions .gestion-remesas-process-button:hover,
      .gestion-remesas-actions .gestion-remesas-process-button:focus,
      .gestion-remesas-actions .gestion-remesas-export-button:hover,
      .gestion-remesas-actions .gestion-remesas-export-button:focus {
        background: #4f9336;
        border-color: #3f7d2c;
        color: #fff;
      }

      .gestion-remesas-content-row {
        flex: 1 1 auto;
        min-height: 0;
        flex-wrap: nowrap !important;
        overflow: hidden;
      }

      .gestion-remesas-grid-column {
        flex: 1 1 0 !important;
        width: 100%;
        min-width: 0;
        max-width: none;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .gestion-remesas-drawer-stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .gestion-remesas-detail-drawer .ant-drawer-body {
        padding: 12px;
        overflow: auto;
      }

      .gestion-remesas-line-modal {
        top: 48px;
        padding-bottom: 0;
        max-width: calc(100vw - 32px);
      }

      .gestion-remesas-line-modal .ant-modal-content {
        height: min(760px, calc(100dvh - 96px));
        max-height: calc(100dvh - 96px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .gestion-remesas-line-modal .ant-modal-body {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        overflow: hidden;
      }

      .gestion-remesas-line-summary-card {
        flex: 0 0 auto;
      }

      .gestion-remesas-line-summary-card .ant-card-body {
        padding: 10px 12px;
      }

      .gestion-remesas-line-summary-card .ant-form-item {
        margin-bottom: 8px !important;
      }

      .gestion-remesas-line-table {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .gestion-remesas-line-table .ant-spin-nested-loading,
      .gestion-remesas-line-table .ant-spin-container,
      .gestion-remesas-line-table .ant-table,
      .gestion-remesas-line-table .ant-table-container {
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
      }

      .gestion-remesas-line-table .ant-spin-container,
      .gestion-remesas-line-table .ant-table,
      .gestion-remesas-line-table .ant-table-container {
        display: flex;
        flex-direction: column;
      }

      .gestion-remesas-line-table .ant-table-body {
        flex: 0 1 auto;
        min-height: 0;
        height: clamp(180px, calc(100dvh - 520px), 300px);
        max-height: clamp(180px, calc(100dvh - 520px), 300px) !important;
        position: relative;
        z-index: 1;
        overflow-x: auto !important;
        overflow-y: scroll !important;
        scrollbar-gutter: stable;
      }

      .gestion-remesas-line-table .ant-table-pagination {
        flex: 0 0 auto;
        margin: 8px 0 0 !important;
      }

      .gestion-remesas-line-pagination {
        flex: 0 0 auto;
        align-self: flex-end;
      }

      .gestion-remesas-grid-column .ant-table-wrapper,
      .gestion-remesas-grid-column .ant-spin-nested-loading,
      .gestion-remesas-grid-column .ant-spin-container,
      .gestion-remesas-grid-column .ant-table,
      .gestion-remesas-grid-column .ant-table-container {
        flex: 1 1 auto;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }

      .gestion-remesas-grid-column .ant-table-wrapper,
      .gestion-remesas-grid-column .ant-spin-container,
      .gestion-remesas-grid-column .ant-table,
      .gestion-remesas-grid-column .ant-table-container {
        display: flex;
        flex-direction: column;
      }

      .gestion-remesas-grid-column .ant-table-body {
        flex: 1 1 auto;
        min-height: 0;
        max-height: none !important;
        position: relative;
        z-index: 1;
        overflow: auto !important;
        scrollbar-gutter: stable;
      }

      .gestion-remesas-grid-column .ant-table-header,
      .gestion-remesas-line-table .ant-table-header {
        flex: 0 0 auto;
        position: relative;
        z-index: 3;
        overflow: hidden !important;
        background: #fafafa !important;
      }

      .gestion-remesas-grid-column .ant-table-thead > tr > th,
      .gestion-remesas-line-table .ant-table-thead > tr > th {
        position: relative;
        z-index: 3;
        background: #bfbfbf !important;
        background-clip: padding-box;
        border-inline-end: 1px solid #cbd1d8 !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .gestion-remesas-grid-column .ant-table-container,
      .gestion-remesas-line-table .ant-table-container {
        border: 1px solid #cbd1d8;
      }

      .gestion-remesas-grid-column .ant-table-tbody > tr > td,
      .gestion-remesas-line-table .ant-table-tbody > tr > td {
        border-inline-end: 0 !important;
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .gestion-remesas-grid-column .ant-table-tbody > tr:hover > td,
      .gestion-remesas-line-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .gestion-remesas-grid-column .gestion-remesas-selected-row > td {
        background: #86b4ff !important;
      }

      .gestion-remesas-grid-column .gestion-remesas-selected-row:hover > td {
        background: #86b4ff !important;
      }

      .gestion-remesas-standard-modal .ant-modal-header,
      .gestion-remesas-upload-modal .ant-modal-header,
      .gestion-remesas-line-modal .ant-modal-header {
        border-bottom: 1px solid #cbd1d8;
      }

      .gestion-remesas-standard-modal .ant-modal-footer,
      .gestion-remesas-upload-modal .ant-modal-footer,
      .gestion-remesas-line-modal .ant-modal-footer {
        border-top: 1px solid #cbd1d8;
      }

      .gestion-remesas-caja-card .ant-card-head,
      .gestion-remesas-distribution-card .ant-card-head,
      .gestion-remesas-line-summary-card .ant-card-head {
        min-height: 38px;
        padding: 0 12px;
        background: #f5f7fa;
        border-bottom: 1px solid #cbd1d8;
      }

      .gestion-remesas-caja-card,
      .gestion-remesas-distribution-card,
      .gestion-remesas-line-summary-card {
        border: 1px solid #cbd1d8;
      }

      .gestion-remesas-grid-column .ant-table-pagination {
        flex: 0 0 auto;
        margin: 8px 0 0 !important;
      }

      .gestion-remesas-selectable-row {
        cursor: pointer;
      }

      .gestion-remesas-selected-row > td {
        background: #e6f7ff !important;
      }

      .gestion-remesas-upload-modal .ant-modal-body {
        padding-top: 16px;
      }

      .gestion-remesas-upload-group {
        margin: 0;
        padding: 12px 16px 14px;
        border: 1px solid #b7c8d9;
        border-radius: 2px;
      }

      .gestion-remesas-upload-group legend {
        width: auto;
        margin: 0;
        padding: 0 6px;
        color: #174f7c;
        font-size: 13px;
        font-weight: 600;
      }

      .gestion-remesas-upload-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .gestion-remesas-upload-label {
        flex: 0 0 145px;
        text-align: right;
      }

      .gestion-remesas-upload-control {
        flex: 1 1 auto;
        min-width: 0;
      }

      .gestion-remesas-upload-actions {
        margin-top: 18px;
        padding-top: 12px;
        border-top: 1px solid #d9d9d9;
      }

      .gestion-remesas-ellipsis {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
    window.addEventListener('resize', scheduleViewportFit);
    scheduleViewportFit();
    return () => {
      window.removeEventListener('resize', scheduleViewportFit);
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      if (style.parentNode) style.parentNode.removeChild(style);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  React.useEffect(() => {
    loadCashiers();
    loadCurrentUser();
    loadBranches();
    loadBatches(1, PAGE_SIZE, {});
    return () => {
      listRequestRef.current += 1;
      detailRequestRef.current += 1;
      batchStatusPollRef.current += 1;
    };
  }, []);

  React.useEffect(() => {
    const hasActiveBatch = rows.some((record) => ['pending', 'running'].indexOf(batchExecutionState(record)) >= 0);
    if (!hasActiveBatch) return undefined;

    const intervalId = window.setInterval(refreshActiveBatchRows, 4000);
    return () => window.clearInterval(intervalId);
  }, [rows]);

  const cajaValues = {
    numero: batchDetail ? batchDetail.caja : EMPTY_VALUE,
    fecha: selectedBatch ? formatCashDeskDate(selectedBatch.launched || selectedBatch.created) : EMPTY_VALUE,
    sucursal: batchDetail ? displayValue(batchDetail.sucursal) : EMPTY_VALUE,
    codigo: EMPTY_VALUE,
    cajero: selectedBatch ? displayValue(selectedBatch.user) : EMPTY_VALUE,
    movimientos: batchDetail ? String(batchDetail.movimientos) : EMPTY_VALUE
  };

  const distributionValues = {
    remesa: selectedBatch ? displayValue(selectedBatch.id) : EMPTY_VALUE,
    totalRemesa: batchDetail ? formatAmount(batchDetail.totalRemesa) : EMPTY_VALUE,
    totalPrimas: EMPTY_VALUE,
    totalDeposito: EMPTY_VALUE,
    totalDescuadre: EMPTY_VALUE,
    fechaIngreso: selectedBatch ? formatDate(selectedBatch.created) : EMPTY_VALUE,
    creadaPor: selectedBatch ? displayValue(selectedBatch.user) : EMPTY_VALUE,
    procesadaPor: selectedBatch ? displayValue(selectedBatch.processedBy || selectedBatch.processedUser) : EMPTY_VALUE
  };

  const paymentStatus = (item) => {
    const raw = item && item.result;
    if (raw === true) return 'Collected';
    if (raw === false) return 'Inconsistent';

    const normalized = String(raw === null || raw === undefined ? '' : raw).trim().toUpperCase();
    if (!normalized) {
      const records = Math.max(0, toNumber(selectedBatch && selectedBatch.records));
      const collected = Math.max(0, toNumber(selectedBatch && selectedBatch.success));
      const inconsistent = Math.max(0, toNumber(selectedBatch && selectedBatch.error));
      if (records > 0 && collected >= records) return 'Collected';
      if (records > 0 && inconsistent >= records) return 'Inconsistent';
      return 'Pending';
    }
    if (['OK', 'SUCCESS', 'COLLECTED', 'COBRADO', 'COBRADA'].indexOf(normalized) >= 0) return 'Collected';
    if (['PENDING', 'PENDIENTE', 'DISTRIBUTED', 'DISTRIBUIDO', 'DISTRIBUIDA'].indexOf(normalized) >= 0) return 'Pending';
    return 'Inconsistent';
  };

  const paymentSystemMessage = (item) => {
    const raw = item && item.result;
    if (raw === null || raw === undefined || raw === '' || typeof raw === 'boolean') return EMPTY_VALUE;
    if (typeof raw === 'object') {
      return displayValue(raw.msg !== undefined ? raw.msg
        : (raw.message !== undefined ? raw.message
          : (raw.description !== undefined ? raw.description : JSON.stringify(raw))));
    }
    return displayValue(raw);
  };

  const lineDetailRows = batchDetail && Array.isArray(batchDetail.paymentRows)
    ? batchDetail.paymentRows.map((item, index) => ({
      key: index + 1,
      line: index + 1,
      policy: item.policyCode,
      receipt: item.numRecibo,
      amount: item.monto,
      status: paymentStatus(item),
      systemMessage: paymentSystemMessage(item),
      accountNumber: item.accountNumber,
      paymentNumber: item.paymentNumber,
      client: item.client
    }))
    : [];
  const lineDetailPageSize = 30;
  const lineDetailPageRows = lineDetailRows.slice(
    (lineDetailPage - 1) * lineDetailPageSize,
    lineDetailPage * lineDetailPageSize
  );

  const lineClients = lineDetailRows
    .map((item) => displayValue(item.client))
    .filter((value, index, values) => value !== EMPTY_VALUE && values.indexOf(value) === index);
  const detailLineCount = selectedBatch
    ? Math.max(toNumber(selectedBatch.records), lineDetailRows.length)
    : lineDetailRows.length;
  const detailInconsistentCount = lineDetailRows.filter((item) => item.status === 'Inconsistent').length;
  const detailCollectedCount = lineDetailRows.filter((item) => item.status === 'Collected').length;
  const detailPendingCount = Math.max(0, detailLineCount - detailCollectedCount - detailInconsistentCount);

  const lineSummaryValues = {
    remittance: selectedBatch ? displayValue(selectedBatch.id) : EMPTY_VALUE,
    amount: batchDetail ? formatAmount(batchDetail.totalRemesa) : EMPTY_VALUE,
    lines: String(detailLineCount),
    pending: String(detailPendingCount),
    cashier: selectedBatch ? displayValue(selectedBatch.user) : EMPTY_VALUE,
    inconsistent: String(detailInconsistentCount),
    collected: String(detailCollectedCount),
    client: lineClients.length === 1 ? lineClients[0] : (lineClients.length > 1 ? t('Multiple') : EMPTY_VALUE)
  };

  const lineDetailColumns = [
    { title: t('Line'), dataIndex: 'line', key: 'line', width: 70, align: 'center' },
    { title: t('Policy'), dataIndex: 'policy', key: 'policy', width: 180, render: displayValue },
    { title: t('Receipt'), dataIndex: 'receipt', key: 'receipt', width: 120, render: displayValue },
    { title: t('Amount'), dataIndex: 'amount', key: 'amount', width: 120, align: 'right', render: formatAmount },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (value) => {
        const color = value === 'Collected' ? '#389e0d' : (value === 'Inconsistent' ? '#cf1322' : '#d48806');
        return <span style={{ color: color, fontWeight: 600 }}>{t(value)}</span>;
      }
    },
    { title: 'Mensaje del sistema', dataIndex: 'systemMessage', key: 'systemMessage', width: 300, ellipsis: true, render: renderLongText },
    { title: t('Payment No.'), dataIndex: 'paymentNumber', key: 'paymentNumber', width: 130, render: displayValue },
    { title: t('Client'), dataIndex: 'client', key: 'client', width: 220, ellipsis: true, render: renderLongText }
  ];

  const exportRemittanceDetail = () => {
    if (!batchDetail || !selectedBatch || detailExporting) return;

    const remittanceId = displayValue(selectedBatch.id);
    const exportRows = lineDetailRows.map((row) => {
      const amount = numericPaymentAmount(row.amount);
      return [
        row.line,
        displayValue(row.policy),
        displayValue(row.receipt),
        amount === null ? '' : amount,
        t(row.status),
        displayValue(row.systemMessage),
        displayValue(row.paymentNumber),
        displayValue(row.client)
      ];
    });
    const headers = [
      t('Line'),
      t('Policy'),
      t('Receipt'),
      t('Amount'),
      t('Status'),
      t('System message'),
      t('Payment No.'),
      t('Client')
    ];

    setDetailExporting(true);
    ensureXlsxLibrary()
      .then((xlsxLibrary) => {
        if (!isUsableXlsxExportLibrary(xlsxLibrary)) {
          throw new Error(t('The Excel component required to export the remittance detail is not available.'));
        }

        const worksheet = xlsxLibrary.utils.aoa_to_sheet([headers].concat(exportRows));
        exportRows.forEach((row, index) => {
          const amountCell = worksheet['D' + (index + 2)];
          if (amountCell && typeof row[3] === 'number') amountCell.z = '#,##0.00';
        });
        worksheet['!cols'] = [
          { wch: 8 },
          { wch: 22 },
          { wch: 18 },
          { wch: 14 },
          { wch: 16 },
          { wch: 42 },
          { wch: 18 },
          { wch: 28 }
        ];
        worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1:H1' };

        const workbook = xlsxLibrary.utils.book_new();
        xlsxLibrary.utils.book_append_sheet(workbook, worksheet, 'Remittance Detail');
        xlsxLibrary.writeFile(workbook, 'remittance-detail-' + remittanceId + '.xlsx', {
          bookType: 'xlsx',
          compression: true
        });
        message.success(t('The remittance detail was exported successfully.'));
      })
      .catch((error) => {
        message.error(error && error.message ? error.message : t('The remittance detail could not be exported.'));
      })
      .then(() => setDetailExporting(false));
  };

  const detailField = (label, value) => (
    <Form.Item label={label} style={{ marginBottom: 8 }}>
      <Input disabled value={detailLoading ? t('Loading...') : value} />
    </Form.Item>
  );

  const lineSummaryField = (label, value, background) => (
    <Form.Item label={label} style={{ marginBottom: 8 }}>
      <Input readOnly value={value} style={background ? { background: background, fontWeight: 600 } : undefined} />
    </Form.Item>
  );

  return (
    <div ref={shellRef} className="gestion-remesas-shell">
      <Card
        className="gestion-remesas-card"
        title={(
          <div className="gestion-remesas-title">
            <span className="gestion-remesas-title-mark" aria-hidden="true" />
            <span>{t('Remittance Management and Upload')}</span>
          </div>
        )}
        size="small"
      >
        <Collapse className="gestion-remesas-filter-collapse" defaultActiveKey={['filters']} ghost>
          <Panel header={t('Search filters')} key="filters" style={{ fontWeight: 600 }}>
            <Card className="gestion-remesas-filter-card" size="small" bordered={false}>
              <Form form={form} className="gestion-remesas-filter-form" layout="vertical" size="small">
                <Row gutter={12}>
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item label={t('Remittance ID')} name="numeroRemesa">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item label={t('Branch')} name="sucursal">
                      <Select
                        allowClear
                        showSearch
                        loading={branchesLoading}
                        optionFilterProp="label"
                        placeholder={t('Select')}
                        options={branchOptions}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item label="Cajero" name="cajero">
                      <Select
                        allowClear
                        showSearch
                        loading={usersLoading}
                        optionFilterProp="label"
                        placeholder={t('Select')}
                        options={userOptions}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item label={t('Entry date from / to')}>
                      <Space style={{ width: '100%' }}>
                        <Form.Item name="fechaDesde" noStyle>
                          <DatePicker placeholder={t('From')} format="DD/MM/YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="fechaHasta" noStyle>
                          <DatePicker placeholder={t('To')} format="DD/MM/YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
          </Panel>
        </Collapse>

        <Divider style={{ margin: '6px 0' }} />

        <Space className="gestion-remesas-actions" wrap>
          <Button type="primary" loading={loading} onClick={handleSearch}>{t('Search')}</Button>
          <Button disabled={loading} onClick={handleClear}>{t('Clear filters')}</Button>
          <Button
            disabled={loading || uploading || currentUserLoading || !currentUserEmail}
            onClick={openUpload}
          >
            {t('Upload remittance')}
          </Button>
          <Button
            disabled={loading || currentUserLoading || !currentUserEmail}
            onClick={openNewCashDesk}
          >
            {t('New cash desk')}
          </Button>
          <Tooltip title={deleteBatchBlockedMessage(selectedBatch)}>
            <span>
              <Button
                danger
                loading={deletingBatchId !== null
                  && selectedBatch !== null
                  && Number(deletingBatchId) === Number(selectedBatch.id)}
                disabled={!canDeleteBatch(selectedBatch)
                  || loading
                  || uploading
                  || processingBatchId !== null
                  || deletingBatchId !== null}
                onClick={deleteSelectedRemittance}
              >
                {t('Anular')}
              </Button>
            </span>
          </Tooltip>
          <Button
            className="gestion-remesas-process-button"
            loading={processingBatchId !== null
              && selectedBatch !== null
              && Number(processingBatchId) === Number(selectedBatch.id)}
            disabled={!selectedBatch || loading || uploading || processingBatchId !== null}
            onClick={processSelectedRemittance}
          >
            {t('Process remittance')}
          </Button>
          <Button type="primary" disabled={!selectedBatch} onClick={() => setDetailDrawerOpen(true)}>{t('View Details')}</Button>
        </Space>

        <Row className="gestion-remesas-content-row" gutter={12} wrap={false}>
          <Col className="gestion-remesas-grid-column">
          <Table
            className="gestion-remesas-main-table"
            size="small"
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedRowKeys,
              onChange: handleSelectionChange
            }}
            bordered
            scroll={{ x: 1640, y: '100%' }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: false,
              showTotal: (total, range) => t('Showing') + ' ' + range[0] + ' - ' + range[1] + ' ' + t('of') + ' ' + total
            }}
            onChange={handleTableChange}
            rowClassName={(record) => Number(record && record.id) === Number(selectedBatchIdRef.current)
              ? 'gestion-remesas-selectable-row gestion-remesas-selected-row'
              : 'gestion-remesas-selectable-row'}
            onRow={(record) => ({ onClick: () => selectBatch(record) })}
            locale={{ emptyText: loading ? t('Loading...') : t('No records') }}
          />
          </Col>
        </Row>

        <Drawer
          title={t('View Details')}
          className="gestion-remesas-detail-drawer"
          placement="right"
          width={400}
          open={detailDrawerOpen}
          onClose={() => setDetailDrawerOpen(false)}
          destroyOnClose={false}
        >
          <div className="gestion-remesas-drawer-stack">
            <Card className="gestion-remesas-caja-card" title={t('Cash Desk Details')} size="small" loading={detailLoading}>
              <Form className="gestion-remesas-detail-form" layout="horizontal" size="small" labelCol={{ span: 9 }} wrapperCol={{ span: 15 }}>
                {detailField(t('Cash desk No.'), cajaValues.numero)}
                {detailField(t('Date'), cajaValues.fecha)}
                {detailField(t('Branch'), cajaValues.sucursal)}
                {detailField(t('Code'), cajaValues.codigo)}
                {detailField('Cajero', cajaValues.cajero)}
                {detailField(t('Movements'), cajaValues.movimientos)}
              </Form>
            </Card>

            <Card className="gestion-remesas-distribution-card" title={t('Remittance Distribution')} size="small" loading={detailLoading}>
              <Form className="gestion-remesas-detail-form" layout="horizontal" size="small" labelCol={{ span: 9 }} wrapperCol={{ span: 15 }}>
                {detailField(t('Remittance No.'), distributionValues.remesa)}
                {detailField(t('Total Remittance'), distributionValues.totalRemesa)}
                {detailField(t('Total Premiums'), distributionValues.totalPrimas)}
                {detailField(t('Total Deposit'), distributionValues.totalDeposito)}
                {detailField(t('Total Discrepancy'), distributionValues.totalDescuadre)}
                {detailField(t('Entry date'), distributionValues.fechaIngreso)}
                {detailField(t('Created by'), distributionValues.creadaPor)}
                {detailField(t('Processed by'), distributionValues.procesadaPor)}
              </Form>
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Space>
                  <Button type="primary" disabled={!batchDetail} onClick={() => setLineDetailOpen(true)}>{t('View Detail')}</Button>
                  <Button
                    loading={detailExporting}
                    disabled={!batchDetail || detailLoading}
                    onClick={exportRemittanceDetail}
                  >
                    {t('Export')}
                  </Button>
                </Space>
              </div>
            </Card>
          </div>
        </Drawer>

        <Modal
          title={t('New cash desk')}
          className="gestion-remesas-standard-modal"
          open={newCashDeskOpen}
          onCancel={closeNewCashDesk}
          onOk={() => newCashDeskForm.submit()}
          confirmLoading={newCashDeskLoading}
          maskClosable={!newCashDeskLoading}
          closable={!newCashDeskLoading}
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
                loading={branchesLoading}
                placeholder={t('Select a branch')}
                options={branchOptions}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('Carga de Remesas')}
          className="gestion-remesas-upload-modal"
          width={620}
          open={uploadModalOpen}
          onCancel={() => {
            if (!uploading) resetUpload();
          }}
          closable={!uploading}
          maskClosable={!uploading}
          destroyOnClose
          footer={null}
        >
          <fieldset className="gestion-remesas-upload-group">
            <legend>{t('Datos de Carga de la Remesa')}</legend>

            <div className="gestion-remesas-upload-row">
              <label className="gestion-remesas-upload-label">{t('Caja Activa')}:</label>
              <Select
                className="gestion-remesas-upload-control"
                size="small"
                showSearch
                optionFilterProp="label"
                loading={uploadCashDesksLoading}
                disabled={uploading}
                placeholder={t('Select an open cash desk')}
                value={selectedUploadCashDeskId}
                options={uploadCashDeskOptions}
                onChange={setSelectedUploadCashDeskId}
                notFoundContent={uploadCashDesksLoading
                  ? t('Loading...')
                  : t('No open cash desks are available.')}
              />
            </div>

            {!uploadCashDesksLoading && uploadCashDeskOptions.length === 0 ? (
              <Alert
                type="warning"
                showIcon
                message="No hay ninguna caja abierta disponible para el usuario en sesión. Cree una nueva caja antes de procesar el archivo."
                style={{ marginBottom: 12 }}
              />
            ) : null}

            <div className="gestion-remesas-upload-row">
              <label className="gestion-remesas-upload-label">{t('Pagador')}:</label>
              <Select
                className="gestion-remesas-upload-control"
                size="small"
                showSearch
                filterOption={false}
                loading={uploadPayersLoading}
                disabled={uploading}
                placeholder={t('Search by ID, name or identification')}
                value={selectedUploadPayer ? selectedUploadPayer.id : undefined}
                options={uploadPayerOptions}
                onSearch={searchUploadPayers}
                onChange={(value, option) => setSelectedUploadPayer({
                  id: Number(value),
                  name: String(option && option.payerName || '').trim()
                })}
                notFoundContent={uploadPayersLoading ? t('Loading...') : t('No payers found.')}
              />
            </div>

            <div className="gestion-remesas-upload-row">
              <label className="gestion-remesas-upload-label">{t('Seleccionar Archivo')}:</label>
              <Input
                className="gestion-remesas-upload-control"
                size="small"
                readOnly
                value={selectedUploadFile ? selectedUploadFile.name : ''}
              />
              <Upload
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                beforeUpload={selectUploadFile}
                fileList={selectedUploadFile ? [selectedUploadFile] : []}
                showUploadList={false}
                disabled={uploading}
              >
              <Button size="small" disabled={uploading}>{t('Buscar')}</Button>
              </Upload>
            </div>

            <Space className="gestion-remesas-upload-actions" wrap>
              <Button size="small" disabled={uploading} onClick={clearUploadSelection}>{t('Nueva Carga')}</Button>
              <Button
                size="small"
                type="primary"
                loading={uploading}
                disabled={!selectedUploadCashDeskId || !selectedUploadPayer || !selectedUploadFile
                  || uploadFileParsing || uploadCashDesksLoading || uploadPayersLoading}
                onClick={processUpload}
              >
                {t('Procesar Archivo')}
              </Button>
              <Button size="small" disabled={uploading} onClick={resetUpload}>{t('Cancelar')}</Button>
            </Space>
          </fieldset>
        </Modal>

        <Modal
          title={t('Remittance Detail No.') + ' ' + lineSummaryValues.remittance}
          className="gestion-remesas-line-modal"
          width={1000}
          zIndex={1100}
          open={lineDetailOpen}
          onCancel={() => setLineDetailOpen(false)}
          footer={null}
          destroyOnClose={false}
        >
          <Card className="gestion-remesas-line-summary-card" title={t('Remittance Details')} size="small">
            <Form layout="vertical" size="small">
              <Row gutter={12}>
                <Col xs={24} md={12} lg={6}>{lineSummaryField(t('Remittance No.'), lineSummaryValues.remittance)}</Col>
                <Col xs={24} md={12} lg={6}>{lineSummaryField(t('Total amount'), lineSummaryValues.amount)}</Col>
                <Col xs={24} md={12} lg={6}>{lineSummaryField(t('Lines'), lineSummaryValues.lines)}</Col>
                <Col xs={24} md={12} lg={6}>{lineSummaryField(t('Pending'), lineSummaryValues.pending, '#fffbe6')}</Col>
                <Col xs={24} md={12} lg={6}>{lineSummaryField('Cajero', lineSummaryValues.cashier)}</Col>
                <Col xs={24} md={12} lg={6}>{lineSummaryField(t('Inconsistent'), lineSummaryValues.inconsistent, '#fff1f0')}</Col>
                <Col xs={24} md={12} lg={6}>{lineSummaryField(t('Collected'), lineSummaryValues.collected, '#f6ffed')}</Col>
                <Col xs={24} md={12} lg={6}>{lineSummaryField(t('Client'), lineSummaryValues.client)}</Col>
              </Row>
            </Form>
          </Card>

          <Space className="gestion-remesas-line-actions">
            <Button onClick={() => setLineDetailOpen(false)}>{t('Close')}</Button>
            <Button
              loading={detailExporting}
              disabled={!batchDetail || detailLoading}
              onClick={exportRemittanceDetail}
            >
              {t('Export')}
            </Button>
          </Space>

          <Table
            className="gestion-remesas-line-table"
            size="small"
            rowKey="key"
            bordered
            columns={lineDetailColumns}
            dataSource={lineDetailPageRows}
            scroll={{ x: 1390, y: 300 }}
            pagination={false}
            locale={{ emptyText: t('No records') }}
          />

          <Pagination
            className="gestion-remesas-line-pagination"
            size="small"
            current={lineDetailPage}
            pageSize={lineDetailPageSize}
            total={lineDetailRows.length}
            showSizeChanger={false}
            onChange={(page) => setLineDetailPage(page)}
            showTotal={(total, range) => t('Showing') + ' ' + range[0] + ' - ' + range[1] + ' ' + t('of') + ' ' + total}
          />
        </Modal>
      </Card>
    </div>
  );
}
