/**
 * @author Cesar Aguilar
 * @email cesar.aguilar@axxis-systems.com
 * @created 2026/08/25
 * @name NotificacionesMasivas
 * @version 1.0
 * @purpose: Manage massive notification batches, including file import, validation, tracking, and execution.
 */
() => {
  const actionIconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1em',
    height: '1em',
    marginRight: 6,
    verticalAlign: 'middle',
    lineHeight: 1
  };

  const ActionIcon = ({ label, children }) => (
    <span role="img" aria-label={label} className="anticon" style={actionIconStyle}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        {children}
      </svg>
    </span>
  );

  const SearchIcon = () => (
    <ActionIcon label="search">
      <path d="M909.6 854.6L649.9 594.9A314.3 314.3 0 0 0 712 412c0-166.8-135.2-302-302-302S108 245.2 108 412s135.2 302 302 302a299.5 299.5 0 0 0 182.8-62.1l259.7 259.7a8 8 0 0 0 11.3 0l45.8-45.7a8 8 0 0 0 0-11.3zM410 634c-122.6 0-222-99.4-222-222s99.4-222 222-222 222 99.4 222 222-99.4 222-222 222z" />
    </ActionIcon>
  );

  const UploadIcon = () => (
    <ActionIcon label="upload">
      <path d="M472 656h80V344l104 104 56-56-200-200-200 200 56 56 104-104v312zM160 760h704v80H160z" />
    </ActionIcon>
  );

  const EyeIcon = () => (
    <ActionIcon label="view">
      <path d="M942.2 486.2C847.4 286.5 704.1 186 512 186S176.6 286.5 81.8 486.2a60.7 60.7 0 0 0 0 51.6C176.6 737.5 319.9 838 512 838s335.4-100.5 430.2-300.2a60.7 60.7 0 0 0 0-51.6zM512 726c-119.4 0-227.2-65.6-305.3-177C284.8 437.6 392.6 372 512 372s227.2 65.6 305.3 177C739.2 660.4 631.4 726 512 726zm0-304c-69 0-125 56-125 125s56 125 125 125 125-56 125-125-56-125-125-125z" />
    </ActionIcon>
  );

  const PlayIcon = () => (
    <ActionIcon label="execute">
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-80 672V288l240 224-240 224z" />
    </ActionIcon>
  );

  const ClearIcon = () => (
    <ActionIcon label="clear">
      <path d="M832 256H640l-48-48H432l-48 48H192v80h640v-80zM240 400h544v368c0 44.2-35.8 80-80 80H320c-44.2 0-80-35.8-80-80V400z" />
    </ActionIcon>
  );

  const CloseIcon = () => (
    <ActionIcon label="close">
      <path d="M563.8 512l262.5-312.2c4.4-5.2.7-13.3-6.1-13.3H745.5c-4.6 0-9 2-12 5.6L512 451.8 290.5 192.1c-3-3.6-7.4-5.6-12-5.6H203.8c-6.8 0-10.5 8.1-6.1 13.3L460.2 512 197.7 824.2c-4.4 5.2-.7 13.3 6.1 13.3h74.7c4.6 0 9-2 12-5.6L512 572.2l221.5 259.7c3 3.6 7.4 5.6 12 5.6h74.7c6.8 0 10.5-8.1 6.1-13.3L563.8 512z" />
    </ActionIcon>
  );

  const ExportIcon = () => (
    <ActionIcon label="export">
      <path d="M472 128h80v384h128L512 704 344 512h128V128zM160 800h704v80H160z" />
    </ActionIcon>
  );

  const TrashIcon = () => (
    <ActionIcon label="delete">
      <path d="M360 184v-8c0-4.4 3.6-8 8-8h288c4.4 0 8 3.6 8 8v8h72v-40c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v40h72zM792 256H232c-17.7 0-32 14.3-32 32v32h64v472c0 39.8 32.2 72 72 72h352c39.8 0 72-32.2 72-72V320h64v-32c0-17.7-14.3-32-32-32zM440 752h-72V416h72v336zm216 0h-72V416h72v336z" />
    </ActionIcon>
  );

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
  const Modal      = A.Modal;
  const Upload     = A.Upload;
  const Tooltip    = A.Tooltip;
  const Tag        = A.Tag;
  const message    = A.message;

  const PAGE_SIZE = 50;
  const EMPTY_VALUE = '—';
  const IMPORT_CONFIG_NAME = 'Notificaciones MASIVAS';
  const PREPROCESSOR_CHAIN = 'cmdImportPreloadMassiveNotification';

  const [form] = Form.useForm();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState({});
  const [loadTypeOptions, setLoadTypeOptions] = React.useState([]);
  const [loadTypesLoading, setLoadTypesLoading] = React.useState(false);
  const [userOptions, setUserOptions] = React.useState([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState([]);
  const [selectedBatch, setSelectedBatch] = React.useState(null);
  const [exporting, setExporting] = React.useState(false);
  const [inconsistencyOpen, setInconsistencyOpen] = React.useState(false);
  const [inconsistencyLoading, setInconsistencyLoading] = React.useState(false);
  const [inconsistencyRows, setInconsistencyRows] = React.useState([]);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [parsedUploadRows, setParsedUploadRows] = React.useState([]);
  const [prevalidatedUploadRows, setPrevalidatedUploadRows] = React.useState([]);
  const [invalidUploadRows, setInvalidUploadRows] = React.useState([]);
  const [uploadFileParsing, setUploadFileParsing] = React.useState(false);
  const [currentUserEmail, setCurrentUserEmail] = React.useState('');
  const [currentUserLoading, setCurrentUserLoading] = React.useState(false);
  const [selectedLoadType, setSelectedLoadType] = React.useState(undefined);
  const [processingFile, setProcessingFile] = React.useState(false);
  const [processingBatchId, setProcessingBatchId] = React.useState(null);
  const [deletingBatchId, setDeletingBatchId] = React.useState(null);
  const [pagination, setPagination] = React.useState({
    current: 1,
    pageSize: PAGE_SIZE,
    total: 0
  });

  const shellRef = React.useRef(null);
  const listRequestRef = React.useRef(0);
  const uploadFileReadRef = React.useRef(0);
  const xlsxLibraryPromiseRef = React.useRef(null);
  const importConfigIdRef = React.useRef(null);
  const importConfigPromiseRef = React.useRef(null);
  const loadTypesByIdRef = React.useRef({});
  const loadTypeLabelsByNameRef = React.useRef({});
  const batchExecutionRef = React.useRef({});
  const batchStatusPollRef = React.useRef(0);

  const displayValue = (value) => {
    if (value === null || value === undefined || String(value).trim() === '') return EMPTY_VALUE;
    return String(value);
  };

  const formatDate = (value) => {
    if (!value) return EMPTY_VALUE;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return displayValue(value);
    const pad = (part) => String(part).padStart(2, '0');
    return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear()
      + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  };

  const renderLongText = (value) => {
    const text = displayValue(value);
    return (
      <Tooltip title={text === EMPTY_VALUE ? '' : text}>
        <span className="notificaciones-masivas-ellipsis">{text}</span>
      </Tooltip>
    );
  };

  const statusPresentation = (status) => {
    const normalized = String(status || '').trim().toUpperCase();
    if (normalized === 'PENDING') return { label: 'Pendiente', color: 'gold' };
    if (['PROCESS', 'PROCESSING', 'RUNNING', 'IN_PROGRESS', 'IN PROGRESS'].indexOf(normalized) >= 0) {
      return { label: 'Proceso', color: 'processing' };
    }
    if (normalized === 'FINISHED') return { label: 'Finalizado', color: 'green' };
    if (['ERROR', 'FAILED'].indexOf(normalized) >= 0) return { label: 'Error', color: 'red' };
    return { label: displayValue(status), color: 'default' };
  };

  const columns = [
    {
      title: 'ID lote',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      align: 'center',
      render: displayValue
    },
    {
      title: 'Fecha de carga',
      dataIndex: 'created',
      key: 'fechaCarga',
      width: 160,
      align: 'center',
      render: formatDate
    },
    {
      title: 'Usuario',
      dataIndex: 'user',
      key: 'usuario',
      width: 220,
      ellipsis: true,
      render: renderLongText
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoCarga',
      key: 'tipoCarga',
      width: 140,
      align: 'center',
      render: displayValue
    },
    {
      title: 'Estado del lote',
      dataIndex: 'status',
      key: 'estado',
      width: 160,
      align: 'center',
      render: (value) => {
        const presentation = statusPresentation(value);
        return <Tag color={presentation.color}>{presentation.label}</Tag>;
      }
    },
    {
      title: 'Pólizas válidas',
      dataIndex: 'success',
      key: 'polizasValidas',
      width: 130,
      align: 'right',
      render: displayValue
    },
    {
      title: 'Pólizas no válidas',
      dataIndex: 'error',
      key: 'polizasNoValidas',
      width: 145,
      align: 'right',
      render: displayValue
    },
    {
      title: 'Cant. mensajes',
      dataIndex: 'records',
      key: 'cantidadMensajes',
      width: 130,
      align: 'right',
      render: displayValue
    }
  ];

  const inconsistencyColumns = [
    {
      title: 'Fila',
      dataIndex: 'fila',
      key: 'fila',
      width: 80,
      align: 'center',
      render: displayValue
    },
    {
      title: 'Póliza',
      dataIndex: 'poliza',
      key: 'poliza',
      width: 180,
      render: displayValue
    },
    {
      title: 'Motivo',
      dataIndex: 'motivo',
      key: 'motivo',
      render: renderLongText
    }
  ];

  const uploadValidationColumns = [
    {
      title: 'Fila',
      dataIndex: 'fila',
      key: 'fila',
      width: 70,
      align: 'center',
      render: displayValue
    },
    {
      title: 'Póliza',
      dataIndex: 'poliza',
      key: 'poliza',
      width: 160,
      render: displayValue
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      align: 'center',
      render: value => <Tag color={value === 'Válida' ? 'green' : 'red'}>{value}</Tag>
    },
    {
      title: 'Mensaje de validación',
      dataIndex: 'mensaje',
      key: 'mensaje',
      render: renderLongText
    }
  ];

  const resetSelection = () => {
    setSelectedRowKeys([]);
    setSelectedBatch(null);
    setInconsistencyOpen(false);
    setInconsistencyRows([]);
  };

  const closeInconsistencies = () => {
    if (inconsistencyLoading) return;
    setInconsistencyOpen(false);
    setInconsistencyRows([]);
  };

  const openInconsistencies = () => {
    const batchId = Number(selectedBatch && selectedBatch.id || 0);
    const invalidCount = Number(selectedBatch && selectedBatch.error || 0);
    if (batchId <= 0 || invalidCount <= 0) {
      message.warning('Seleccione un lote que tenga pólizas no válidas.');
      return;
    }

    setInconsistencyOpen(true);
    setInconsistencyLoading(true);
    setInconsistencyRows([]);

    exe('LoadEntity', {
      entity: 'Batch',
      fields: 'id,jData',
      filter: 'id = ' + batchId,
      noTracking: true
    })
      .then((result) => {
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : 'No se pudo consultar el detalle del lote.');
        }

        const batch = result.outData || null;
        const storedData = parseStoredData(batch && batch.jData);
        if (batch && batch.jData && !storedData) {
          throw new Error('El lote contiene un detalle de inconsistencias inválido.');
        }

        const invalidRows = splitStoredData(storedData).invalidRows;
        if (!invalidRows.length) {
          throw new Error('Este lote no conserva el detalle de sus inconsistencias. Realice una nueva carga.');
        }

        setInconsistencyRows(invalidRows.map((row, index) => ({
          key: String(row && row.fila || index + 1) + '-' + index,
          fila: row && row.fila,
          poliza: row && row.poliza,
          motivo: Array.isArray(row && row.errores)
            ? row.errores.join(' ')
            : String(row && row.errores || '')
        })));
      })
      .catch((error) => {
        setInconsistencyRows([]);
        message.error(error && error.message ? error.message : String(error));
      })
      .then(() => setInconsistencyLoading(false));
  };

  const executionCount = (record, field) => {
    const internalField = field === 'success' ? '_executionSuccess' : '_executionError';
    const value = record && record[internalField] !== undefined
      ? record[internalField]
      : record && record[field];
    const count = Number(value || 0);
    return isFinite(count) ? Math.max(0, count) : 0;
  };

  const batchExecutionState = (record) => {
    const status = String(record && record.status || '').trim().toUpperCase();
    const completed = executionCount(record, 'success') + executionCount(record, 'error');

    if (['RUNNING', 'PROCESSING', 'IN_PROGRESS', 'IN PROGRESS', 'EXECUTING'].indexOf(status) >= 0) return 'running';
    if (['PENDING', 'QUEUED'].indexOf(status) >= 0) return completed > 0 ? 'running' : 'pending';
    if (status === 'FINISHED') return 'finished';
    if (['ERROR', 'FAILED'].indexOf(status) >= 0) return 'failed';
    if (!status || ['CREATED', 'READY'].indexOf(status) >= 0) return completed > 0 ? 'blocked' : 'available';
    return 'blocked';
  };

  const executionBlockedMessage = (record) => {
    if (!record) return 'Seleccione un lote para ejecutar.';
    if (Number(record.importConfigId) !== Number(importConfigIdRef.current)) {
      return 'El lote seleccionado no pertenece a Notificaciones MASIVAS.';
    }
    // AXX-1085: la carga y el envio ya no se restringen por inconsistencias.
    // Las filas no validas quedan registradas en el detalle y no se procesan.

    const state = batchExecutionState(record);
    if (state === 'pending') return 'El lote ya tiene un proceso pendiente.';
    if (state === 'running') return 'El lote se encuentra en ejecución.';
    if (state === 'finished') return 'El lote ya fue procesado.';
    if (state === 'failed' || state === 'blocked') {
      return 'El estado actual del lote no permite su ejecución: ' + displayValue(record.status);
    }
    return '';
  };

  const escapeFilterValue = (value) => String(value || '').replace(/'/g, "''");

  const buildBatchFilter = (activeFilters, importConfigId) => {
    const conditions = ['importConfigId = ' + Number(importConfigId)];
    const values = activeFilters || {};
    const batchId = String(values.numeroLote || '').trim();

    if (batchId) conditions.push('id = ' + Number(batchId));
    if (values.tipoCarga !== null && values.tipoCarga !== undefined) {
      const loadType = loadTypesByIdRef.current[Number(values.tipoCarga)];
      if (loadType && loadType.name) {
        conditions.push("[jData] like N'%" + escapeFilterValue(JSON.stringify(loadType.name)) + "%'");
      } else {
        conditions.push('id = -1');
      }
    }
    if (values.estado) conditions.push("status = '" + escapeFilterValue(values.estado) + "'");
    if (values.usuarioCarga) conditions.push("[user] = '" + escapeFilterValue(values.usuarioCarga) + "'");
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

  // AXX-1085: el detalle del lote se guarda SIEMPRE como una sola matriz de filas.
  // Primero el encabezado y las filas que se cargan (incluidas las que no tienen correo),
  // y a continuacion el bloque de inconsistencias, cuyas filas empiezan con la primera
  // celda vacia: asi el procesador de lotes las ignora y el lote sigue siendo ejecutable.
  const INCONSISTENCY_MARKER = 'INCONSISTENCIAS';

  const parseStoredData = (jData) => {
    let storedData = jData;
    try {
      if (typeof storedData === 'string') storedData = JSON.parse(storedData);
    } catch (error) {
      return null;
    }
    return storedData || null;
  };

  const splitStoredData = (storedData) => {
    if (!storedData) return { validRows: [], invalidRows: [] };

    // Formato anterior: { validRows, invalidRows }
    if (!Array.isArray(storedData)) {
      return {
        validRows: Array.isArray(storedData.validRows) ? storedData.validRows : [],
        invalidRows: Array.isArray(storedData.invalidRows) ? storedData.invalidRows : []
      };
    }

    const markerIndex = storedData.findIndex((row) => Array.isArray(row)
      && String(row[0] || '').trim() === ''
      && String(row[1] || '').trim().toUpperCase() === INCONSISTENCY_MARKER);

    if (markerIndex < 0) return { validRows: storedData, invalidRows: [] };

    return {
      validRows: storedData.slice(0, markerIndex),
      invalidRows: storedData.slice(markerIndex + 2)
        .filter((row) => Array.isArray(row))
        .map((row) => ({ fila: row[1], poliza: row[2], errores: row[3] }))
    };
  };

  const buildStoredData = (validRows, invalidRows) => {
    const rows = (Array.isArray(validRows) ? validRows : []).slice();
    if (!invalidRows || !invalidRows.length) return rows;

    const width = Array.isArray(rows[0]) ? rows[0].length : 4;
    const padRow = (cells) => {
      const padded = cells.slice();
      while (padded.length < width) padded.push('');
      return padded;
    };

    rows.push(padRow(['', INCONSISTENCY_MARKER, '', '']));
    rows.push(padRow(['', 'Fila', 'Poliza', 'Motivo']));
    invalidRows.forEach((row) => {
      rows.push(padRow([
        '',
        row && row.fila,
        row && row.poliza,
        Array.isArray(row && row.errores) ? row.errores.join(' ') : String(row && row.errores || '')
      ]));
    });
    return rows;
  };

  const prevalidationCountsFromJData = (jData) => {
    const storedData = parseStoredData(jData);
    if (!storedData) return null;

    const detail = splitStoredData(storedData);
    return {
      valid: Math.max(0, detail.validRows.length - 1),
      invalid: detail.invalidRows.length
    };
  };

  const loadTypeNameFromJData = (jData) => {
    const storedData = parseStoredData(jData);
    if (!storedData) return '';

    const validRows = splitStoredData(storedData).validRows;
    if (validRows.length < 2 || !Array.isArray(validRows[0]) || !Array.isArray(validRows[1])) return '';

    const typeIndex = validRows[0].findIndex((header) => String(header || '').trim().toLowerCase() === 'tipoplantilla');
    return typeIndex >= 0 ? String(validRows[1][typeIndex] || '').trim() : '';
  };

  const enrichBatchDisplayData = (batchRows, importConfigId) => {
    const rowsToEnrich = batchRows.filter((row) => Number(row && row.importConfigId) === Number(importConfigId));
    if (!rowsToEnrich.length) return Promise.resolve(batchRows);

    const batchIds = rowsToEnrich
      .map((row) => Number(row && row.id || 0))
      .filter((id) => id > 0);
    if (!batchIds.length) return Promise.resolve(batchRows);

    return exe('LoadEntities', {
      entity: 'Batch',
      fields: 'id,jData',
      filter: 'id in (' + batchIds.join(',') + ')',
      noTracking: true
    }).then((result) => {
      if (!result || result.ok === false) {
        throw new Error(result && result.msg
          ? result.msg
          : 'No se pudo consultar el tipo de carga de los lotes.');
      }

      const detailsById = {};
      responseRows(result).forEach((batch) => {
        detailsById[Number(batch && batch.id)] = batch;
      });

      return batchRows.map((row) => {
        if (Number(row && row.importConfigId) !== Number(importConfigId)) return row;

        const detail = detailsById[Number(row && row.id)];
        const counts = prevalidationCountsFromJData(detail && detail.jData);
        const loadTypeName = loadTypeNameFromJData(detail && detail.jData);
        const loadTypeLabel = loadTypeLabelsByNameRef.current[loadTypeName] || loadTypeName;
        if (!counts && !loadTypeLabel) return row;

        return Object.assign({}, row, {
          _executionSuccess: row.success,
          _executionError: row.error,
          success: counts ? counts.valid : row.success,
          error: counts ? counts.invalid : row.error,
          records: counts ? counts.valid : row.records,
          tipoCarga: loadTypeLabel
        });
      });
    });
  };

  const loadLoadTypes = () => {
    setLoadTypesLoading(true);

    return exe('RepoHtmlTemplate', {
      operation: 'GET',
      filter: "name like 'Notification%'",
      size: 0,
      page: 0
    })
      .then((result) => {
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : 'No se pudieron cargar los tipos de carga.');
        }

        const templates = Array.isArray(result.outData)
          ? result.outData
          : (result.outData && Array.isArray(result.outData.data) ? result.outData.data : []);
        const seenIds = [];
        const options = [];
        const typesById = {};
        const labelsByName = {};

        templates.forEach((template) => {
          const id = Number(template && template.id);
          const name = String(template && template.name || '').trim();
          const description = String(template && template.description || '').trim();
          if (!isFinite(id) || !name.startsWith('Notification_') || !description || seenIds.indexOf(id) >= 0) return;

          seenIds.push(id);
          options.push({ value: id, label: description });
          typesById[id] = { name: name, label: description };
          labelsByName[name] = description;
        });

        loadTypesByIdRef.current = typesById;
        loadTypeLabelsByNameRef.current = labelsByName;
        setLoadTypeOptions(options);
      })
      .catch((error) => {
        loadTypesByIdRef.current = {};
        loadTypeLabelsByNameRef.current = {};
        setLoadTypeOptions([]);
        message.error(error && error.message ? error.message : 'No se pudieron cargar los tipos de carga.');
      })
      .then(() => setLoadTypesLoading(false));
  };

  const loadUsers = () => {
    const usersPageSize = 100;
    setUsersLoading(true);

    const loadUsersPage = (page, collectedUsers, previousSignature) => exe('GetUsers', {
      size: usersPageSize,
      page: page
    }).then((result) => {
      if (!result || result.ok === false) {
        throw new Error(result && result.msg ? result.msg : 'No se pudo cargar el catálogo de usuarios.');
      }

      const users = Array.isArray(result.outData) ? result.outData : [];
      const signature = users.map((user) => String(user && (user.email || user.id || user.nombre) || '')).join('|');
      if (users.length && signature && signature === previousSignature) {
        throw new Error('La paginación del catálogo de usuarios no avanzó.');
      }

      const accumulatedUsers = collectedUsers.concat(users);
      if (users.length < usersPageSize) return accumulatedUsers;
      return loadUsersPage(page + 1, accumulatedUsers, signature);
    });

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
        message.error(error && error.message ? error.message : 'No se pudo cargar el catálogo de usuarios.');
      })
      .then(() => setUsersLoading(false));
  };

  const responseRows = (result) => {
    const source = result && result.outData;
    if (Array.isArray(source)) return source;
    if (source && Array.isArray(source.data)) return source.data;
    return source ? [source] : [];
  };

  const resolveImportConfigId = () => {
    if (importConfigIdRef.current) return Promise.resolve(importConfigIdRef.current);
    if (importConfigPromiseRef.current) return importConfigPromiseRef.current;

    importConfigPromiseRef.current = exe('RepoImportConfig', {
      operation: 'GET',
      filter: "name = '" + IMPORT_CONFIG_NAME + "'"
    }).then((result) => {
      if (!result || result.ok === false) {
        throw new Error(result && result.msg
          ? result.msg
          : 'No se pudo consultar la configuración de Notificaciones MASIVAS.');
      }

      const config = responseRows(result)[0] || null;
      const configId = Number(config && (config.id || config.Id) || 0);
      if (configId <= 0) throw new Error('No se encontró la configuración de Notificaciones MASIVAS.');

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

  const loadCurrentUser = () => {
    setCurrentUserLoading(true);
    return exe('GetCurrentUser')
      .then((result) => {
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : 'No se pudo identificar el usuario de la sesión.');
        }

        const user = responseRows(result)[0] || null;
        const email = String(user && (user.email || user.Email || user.userEmail) || '').trim();
        if (!email) throw new Error('No se pudo identificar el usuario de la sesión.');
        setCurrentUserEmail(email);
      })
      .catch((error) => {
        setCurrentUserEmail('');
        message.error(error && error.message ? error.message : String(error));
      })
      .then(() => setCurrentUserLoading(false));
  };

  const loadBatches = (current, pageSize, activeFilters) => {
    const requestId = listRequestRef.current + 1;
    listRequestRef.current = requestId;
    setLoading(true);
    setRows([]);
    resetSelection();

    return resolveImportConfigId()
      .then((configId) => Promise.all([configId, exe('RepoBatch', {
        operation: 'GET',
        filter: buildBatchFilter(activeFilters, configId),
        page: Math.max(0, Number(current || 1) - 1),
        size: Number(pageSize || PAGE_SIZE)
      })]))
      .then((resolved) => {
        const configId = resolved[0];
        const result = resolved[1];
        if (requestId !== listRequestRef.current) return;
        if (!result || result.ok === false) {
          throw new Error(result && result.msg ? result.msg : 'No se pudieron cargar los lotes de notificaciones.');
        }

        const normalized = normalizeBatchResponse(result);
        return enrichBatchDisplayData(normalized.data, configId)
          .then((enrichedRows) => {
            if (requestId !== listRequestRef.current) return;
            setRows(enrichedRows);
            setPagination({
              current: Number(current || 1),
              pageSize: Number(pageSize || PAGE_SIZE),
              total: normalized.total
            });
          });
      })
      .catch((error) => {
        if (requestId !== listRequestRef.current) return;
        setRows([]);
        setPagination({ current: Number(current || 1), pageSize: Number(pageSize || PAGE_SIZE), total: 0 });
        message.error(error && error.message ? error.message : 'No se pudieron cargar los lotes de notificaciones.');
      })
      .then(() => {
        if (requestId === listRequestRef.current) setLoading(false);
      });
  };

  const loadFreshBatch = (batchId) => exe('RepoBatch', {
    operation: 'GET',
    filter: 'id = ' + Number(batchId),
    size: 1,
    page: 0
  }).then((result) => {
    if (!result || result.ok === false) {
      throw new Error(result && result.msg ? result.msg : 'No se pudo actualizar el lote seleccionado.');
    }

    const batch = normalizeBatchResponse(result).data[0] || null;
    if (!batch) throw new Error('El lote seleccionado ya no se encuentra disponible.');
    return resolveImportConfigId()
      .then((configId) => enrichBatchDisplayData([batch], configId))
      .then((enrichedRows) => enrichedRows[0] || batch);
  });

  const loadBatchStoredData = (batchId) => exe('LoadEntity', {
    entity: 'Batch',
    fields: 'id,jData',
    filter: 'id = ' + Number(batchId),
    noTracking: true
  }).then((result) => {
    if (!result || result.ok === false || !result.outData) {
      throw new Error(result && result.msg ? result.msg : 'No se pudo validar el contenido del lote.');
    }

    try {
      return result.outData.jData ? JSON.parse(result.outData.jData) : null;
    } catch (error) {
      throw new Error('El contenido del lote no tiene un formato válido.');
    }
  });

  // AXX-1084: el detalle exportado debe traer la informacion completa del lote,
  // con el encabezado del archivo de referencia y el bloque de cabecera del reporte.
  const DETAIL_SHEET_HEADER = [
    'IDLote',
    'Poliza',
    'FechaRechazo',
    'CodigoSIS',
    'Nombres',
    'Apellidos',
    'TipoTelefono',
    'Telefono',
    'Mensaje',
    'Valido',
    'Observaciones'
  ];

  const loadBatchStoredDetail = (batchId) => exe('LoadEntity', {
    entity: 'Batch',
    fields: 'id,jData,dataCols',
    filter: 'id = ' + Number(batchId),
    noTracking: true
  }).then((result) => {
    if (!result || result.ok === false || !result.outData) {
      throw new Error(result && result.msg ? result.msg : 'No se pudo validar el contenido del lote.');
    }

    return {
      content: parseStoredData(result.outData.jData),
      dataCols: Number(result.outData.dataCols || 0)
    };
  });

  const loadExportIdentity = () => Promise.all([
    exe('GetConfig', { path: '$.Main.company' }).catch(() => null),
    exe('GetCurrentUser').catch(() => null)
  ]).then((resolved) => {
    const configResult = resolved[0];
    const userResult = resolved[1];
    const user = userResult ? responseRows(userResult)[0] || null : null;
    const userName = String(user && (user.name || user.Name || user.fullName || user.userName) || '').trim();
    return {
      company: String(configResult && configResult.outData || '').trim(),
      exportedBy: userName || currentUserEmail || ''
    };
  });

  const detailColumnIndex = (headerRow) => {
    const index = {};
    (Array.isArray(headerRow) ? headerRow : []).forEach((value, position) => {
      const key = String(value === null || value === undefined ? '' : value).trim().toLowerCase();
      if (key && index[key] === undefined) index[key] = position;
    });
    return index;
  };

  const detailCell = (row, columnIndex, columnName) => {
    const position = columnIndex[columnName];
    if (position === undefined) return '';
    const value = Array.isArray(row) ? row[position] : undefined;
    return value === null || value === undefined ? '' : value;
  };

  const exportStamp = () => {
    const now = new Date();
    const pad = (value) => (value < 10 ? '0' : '') + value;
    return pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear();
  };

  const buildValidDetailRows = (batchId, storedRows, dataCols) => {
    if (!Array.isArray(storedRows) || storedRows.length < 2) return [];

    const headerRow = Array.isArray(storedRows[0]) ? storedRows[0] : [];
    const columnIndex = detailColumnIndex(headerRow);
    const resultOffset = Number(dataCols) > 0 ? Number(dataCols) : headerRow.length;

    return storedRows.slice(1).map((row) => {
      const hasResult = Array.isArray(row) && row.length > resultOffset;
      const resultOk = hasResult ? row[resultOffset] : null;
      const resultMessage = hasResult ? row[resultOffset + 1] : '';
      const sent = resultOk === true || String(resultOk).trim().toLowerCase() === 'true';
      // AXX-1085: una fila sin correo entra al lote pero no se le envia nada.
      const sendStatus = String(detailCell(row, columnIndex, 'estadoenvio') || '').trim();
      const deliverable = sendStatus === '' || sendStatus.toLowerCase().indexOf('sin correo') < 0;

      return [
        batchId,
        detailCell(row, columnIndex, 'poliza'),
        '',
        detailCell(row, columnIndex, 'clienteid'),
        detailCell(row, columnIndex, 'cliente'),
        detailCell(row, columnIndex, 'apellidos'),
        detailCell(row, columnIndex, 'tipotelefono'),
        detailCell(row, columnIndex, 'correo'),
        detailCell(row, columnIndex, 'mensaje'),
        // AXX-1085: la marca de «sin correo» gana sobre el resultado del procesador.
        // Esa fila entra al lote pero nunca se despacha, asi que el ok/OK que deja la
        // ejecucion no puede borrarla: el detalle exportado dice lo mismo antes y despues
        // del envio.
        !deliverable ? 'No' : (hasResult ? (sent ? 'Si' : 'No') : 'Si'),
        !deliverable
          ? sendStatus
          : (hasResult
            ? String(resultMessage === null || resultMessage === undefined ? '' : resultMessage)
            : sendStatus)
      ];
    });
  };

  const buildInvalidDetailRows = (batchId, invalidRows) => (Array.isArray(invalidRows) ? invalidRows : [])
    .map((row) => [
      batchId,
      String(row && row.poliza || ''),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'No',
      Array.isArray(row && row.errores)
        ? row.errores.join(' ')
        : String(row && row.errores || '')
    ]);

  const buildDetailSheetRows = (batchId, identity, detailRows) => [
    ['Detalle de los Mensajes Enviados - Lote No.: ' + batchId],
    ['Compañia: ' + String(identity && identity.company || '')],
    ['Fecha de Exportación: ' + exportStamp()],
    ['Exportado Por: ' + String(identity && identity.exportedBy || '')],
    [],
    DETAIL_SHEET_HEADER.slice()
  ].concat(detailRows);

  const isUsableXlsxExportLibrary = (xlsxLibrary) => Boolean(xlsxLibrary
    && typeof xlsxLibrary.writeFile === 'function'
    && xlsxLibrary.utils
    && typeof xlsxLibrary.utils.aoa_to_sheet === 'function'
    && typeof xlsxLibrary.utils.book_new === 'function'
    && typeof xlsxLibrary.utils.book_append_sheet === 'function');

  const exportSelectedBatch = () => {
    const batchId = Number(selectedBatch && selectedBatch.id || 0);
    if (batchId <= 0) {
      message.warning('Seleccione al menos un lote para exportar su detalle.');
      return;
    }

    setExporting(true);
    Promise.all([loadBatchStoredDetail(batchId), ensureXlsxLibrary(), loadExportIdentity()])
      .then(([stored, xlsxLibrary, identity]) => {
        if (!isUsableXlsxExportLibrary(xlsxLibrary)) {
          throw new Error('El componente de Excel no permite generar archivos de salida.');
        }

        const detail = splitStoredData(stored && stored.content);
        const validRows = detail.validRows;
        const invalidRows = detail.invalidRows;

        if (!validRows.length && !invalidRows.length) {
          throw new Error('El lote seleccionado no contiene detalle para exportar.');
        }

        const detailRows = buildValidDetailRows(batchId, validRows, stored && stored.dataCols)
          .concat(buildInvalidDetailRows(batchId, invalidRows));

        if (!detailRows.length) {
          throw new Error('El lote seleccionado no contiene detalle para exportar.');
        }

        const workbook = xlsxLibrary.utils.book_new();
        const detailSheet = xlsxLibrary.utils.aoa_to_sheet(
          buildDetailSheetRows(batchId, identity, detailRows)
        );
        xlsxLibrary.utils.book_append_sheet(workbook, detailSheet, 'Detalle del lote');

        if (invalidRows.length) {
          const inconsistencyRows = [
            ['Fila', 'Póliza', 'Motivo']
          ].concat(invalidRows.map((row) => [
            row && row.fila,
            row && row.poliza,
            Array.isArray(row && row.errores)
              ? row.errores.join(' ')
              : String(row && row.errores || '')
          ]));
          const inconsistencySheet = xlsxLibrary.utils.aoa_to_sheet(inconsistencyRows);
          xlsxLibrary.utils.book_append_sheet(workbook, inconsistencySheet, 'Inconsistencias');
        }

        xlsxLibrary.writeFile(workbook, 'notificaciones-masivas-lote-' + batchId + '.xlsx', {
          bookType: 'xlsx',
          compression: true
        });
        message.success('El detalle del lote fue exportado correctamente.');
      })
      .catch((error) => {
        message.error(error && error.message ? error.message : 'No se pudo exportar el detalle del lote.');
      })
      .then(() => setExporting(false));
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
          throw new Error(result.msg || 'No se pudo actualizar el progreso del lote.');
        }
        return loadFreshBatch(batchId);
      })))
      .then((freshBatches) => {
        if (pollId !== batchStatusPollRef.current) return;
        freshBatches.forEach(mergeFreshBatch);
      })
      .catch(() => {
        // A transient polling failure must not interrupt the user.
      });
  };

  const executeSelectedBatch = () => {
    const batch = selectedBatch;
    const batchId = Number(batch && batch.id || 0);
    const blockedMessage = executionBlockedMessage(batch);
    if (batchId <= 0 || blockedMessage) {
      message.warning(blockedMessage || 'Seleccione un lote para ejecutar.');
      return;
    }
    if (batchExecutionRef.current[batchId]) {
      message.warning('El lote ya está siendo enviado a procesamiento.');
      return;
    }

    Modal.confirm({
      title: 'Ejecutar lote ' + batchId,
      content: 'Se enviarán ' + Number(batch.records || 0)
        + ' notificaciones a los correos de los clientes previamente validados. ¿Desea continuar?',
      okText: 'Ejecutar',
      cancelText: 'Cancelar',
      onOk: () => {
        if (batchExecutionRef.current[batchId]) return;
        batchExecutionRef.current[batchId] = true;
        setProcessingBatchId(batchId);

        return Promise.all([loadFreshBatch(batchId), loadBatchStoredData(batchId)])
          .then((results) => {
            const freshBatch = results[0];
            const storedData = results[1];
            mergeFreshBatch(freshBatch);

            const freshBlockedMessage = executionBlockedMessage(freshBatch);
            if (freshBlockedMessage) throw new Error(freshBlockedMessage);

            const validCount = Math.max(0, splitStoredData(storedData).validRows.length - 1);
            if (validCount <= 0 || validCount !== Number(freshBatch.records || 0)) {
              throw new Error('La cantidad de registros válidos del lote no coincide con los mensajes a procesar.');
            }

            return exe('DoBatch', { batchId: batchId }).then((result) => ({ result: result, freshBatch: freshBatch }));
          })
          .then((execution) => {
            if (!execution.result || execution.result.ok === false) {
              throw new Error(execution.result && execution.result.msg
                ? execution.result.msg
                : 'No se pudo ejecutar el lote.');
            }

            mergeFreshBatch(Object.assign({}, execution.freshBatch, { status: 'PENDING' }));
            message.success(execution.result.msg || ('El lote ' + batchId + ' fue enviado a procesamiento.'));
          })
          .catch((error) => {
            message.error(error && error.message ? error.message : String(error || 'No se pudo ejecutar el lote.'));
          })
          .then(() => {
            delete batchExecutionRef.current[batchId];
            setProcessingBatchId((currentId) => Number(currentId) === batchId ? null : currentId);
          });
      }
    });
  };

  // AXX-1085: eliminar un lote ya cargado que no se quiere enviar.
  const deletionBlockedMessage = (record) => {
    if (!record) return 'Seleccione un lote para eliminarlo.';
    if (Number(record.importConfigId) !== Number(importConfigIdRef.current)) {
      return 'El lote seleccionado no pertenece a Notificaciones MASIVAS.';
    }
    const state = batchExecutionState(record);
    if (state !== 'available') {
      return 'Solo se pueden eliminar lotes cargados que todavía no fueron enviados.';
    }
    return '';
  };

  const deleteSelectedBatch = () => {
    const batch = selectedBatch;
    const batchId = Number(batch && batch.id || 0);
    const blockedMessage = deletionBlockedMessage(batch);
    if (batchId <= 0 || blockedMessage) {
      message.warning(blockedMessage || 'Seleccione un lote para eliminarlo.');
      return;
    }

    Modal.confirm({
      title: 'Eliminar lote ' + batchId,
      content: 'Se eliminará el lote ' + batchId + ' (' + displayValue(batch.name)
        + ') y su detalle de carga. Esta acción no se puede deshacer. ¿Desea continuar?',
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => {
        setDeletingBatchId(batchId);
        return loadFreshBatch(batchId)
          .then((freshBatch) => {
            const freshBlockedMessage = deletionBlockedMessage(freshBatch);
            if (freshBlockedMessage) throw new Error(freshBlockedMessage);

            return exe('RepoBatch', {
              operation: 'DELETE',
              entity: { id: batchId, name: freshBatch.name }
            });
          })
          .then((result) => {
            if (!result || result.ok === false) {
              throw new Error(result && result.msg ? result.msg : 'No se pudo eliminar el lote.');
            }
            message.success('El lote ' + batchId + ' fue eliminado.');
            resetSelection();
            return loadBatches(1, pagination.pageSize || PAGE_SIZE, filters);
          })
          .catch((error) => {
            message.error(error && error.message ? error.message : 'No se pudo eliminar el lote.');
          })
          .then(() => setDeletingBatchId(null));
      }
    });
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const batchId = String(values.numeroLote || '').trim();
    if (batchId && !/^\d+$/.test(batchId)) {
      message.warning('El número de lote debe ser numérico.');
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

  const isXlsxFileName = (fileName) => /\.xlsx$/i.test(String(fileName || ''));

  const isUsableXlsxLibrary = (xlsxLibrary) => Boolean(xlsxLibrary
    && typeof xlsxLibrary.read === 'function'
    && xlsxLibrary.utils
    && typeof xlsxLibrary.utils.sheet_to_json === 'function');

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
          : 'No se pudo cargar el componente de Excel de SIS11.');
      }

      const loadedLibraries = response.outData || {};
      const loadedXlsx = loadedLibraries.XLSX || loadedLibraries.xlsx || loadedLibraries.xlsxJs;
      let evaluatedXlsx = null;
      if (typeof loadedXlsx === 'string') {
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
        throw new Error('SIS11 respondió, pero el componente para leer archivos Excel no quedó disponible.');
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
        reject(new Error('No se pudo leer el archivo Excel. Verifique que no esté vacío o dañado.'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo Excel.'));
    reader.readAsArrayBuffer(file);
  });

  const validateWorkbookRows = (workbookRows) => {
    const firstHeader = workbookRows[0] && String(workbookRows[0][0] || '').trim();
    const hasPolicyData = workbookRows.slice(1)
      .some((row) => String(row && row[0] || '').trim() !== '');
    if (workbookRows.length < 2 || !firstHeader || !hasPolicyData) {
      throw new Error('La primera hoja debe incluir una primera columna con el código de póliza y al menos un registro.');
    }
  };

  const parseXlsxWorkbook = (arrayBuffer, xlsxLibrary) => {
    let workbook;
    try {
      workbook = xlsxLibrary.read(arrayBuffer, { type: 'array' });
    } catch (error) {
      throw new Error('No se pudo abrir el archivo. Verifique que sea un libro Excel .xlsx válido.');
    }

    const firstSheetName = workbook && Array.isArray(workbook.SheetNames) ? workbook.SheetNames[0] : null;
    const firstSheet = firstSheetName && workbook.Sheets ? workbook.Sheets[firstSheetName] : null;
    if (!firstSheetName || !firstSheet) {
      throw new Error('El archivo no contiene una primera hoja válida.');
    }

    let workbookRows;
    try {
      workbookRows = xlsxLibrary.utils.sheet_to_json(firstSheet, {
        header: 1,
        defval: '',
        raw: true
      });
    } catch (error) {
      throw new Error('No se pudo leer la primera hoja del archivo Excel.');
    }

    const normalizedRows = (Array.isArray(workbookRows) ? workbookRows : [])
      .map((row) => (Array.isArray(row) ? row : [])
        .map((value) => value === null || value === undefined ? '' : value));
    while (normalizedRows.length
      && normalizedRows[normalizedRows.length - 1].every((value) => String(value).trim() === '')) {
      normalizedRows.pop();
    }
    if (!normalizedRows.length) {
      throw new Error('La primera hoja del archivo Excel está vacía.');
    }

    validateWorkbookRows(normalizedRows);
    return normalizedRows;
  };

  const readXlsxFile = (file) => readFileAsArrayBuffer(file)
    .then((arrayBuffer) => ensureXlsxLibrary()
      .then((xlsxLibrary) => parseXlsxWorkbook(arrayBuffer, xlsxLibrary)));

  const clearUploadSelection = () => {
    uploadFileReadRef.current += 1;
    setSelectedFile(null);
    setParsedUploadRows([]);
    setPrevalidatedUploadRows([]);
    setInvalidUploadRows([]);
    setUploadFileParsing(false);
  };

  const openUpload = () => {
    if (!currentUserEmail) {
      message.error('No se pudo identificar el usuario de la sesión. Recargue la vista e intente nuevamente.');
      return;
    }
    clearUploadSelection();
    setSelectedLoadType(undefined);
    setUploadOpen(true);
  };

  const closeUpload = () => {
    if (processingFile) return;
    setUploadOpen(false);
    clearUploadSelection();
    setSelectedLoadType(undefined);
  };

  const selectUploadFile = (file) => {
    if (!isXlsxFileName(file && file.name)) {
      message.error('Solo se permiten archivos Excel con extensión .xlsx.');
      return Upload.LIST_IGNORE !== undefined ? Upload.LIST_IGNORE : false;
    }
    if (!file || Number(file.size || 0) <= 0) {
      message.error('No se pudo seleccionar el archivo porque está vacío.');
      return Upload.LIST_IGNORE !== undefined ? Upload.LIST_IGNORE : false;
    }

    const requestId = uploadFileReadRef.current + 1;
    uploadFileReadRef.current = requestId;
    setSelectedFile(file);
    setParsedUploadRows([]);
    setPrevalidatedUploadRows([]);
    setInvalidUploadRows([]);
    setUploadFileParsing(true);
    readXlsxFile(file)
      .then((workbookRows) => {
        if (requestId !== uploadFileReadRef.current) return;
        setParsedUploadRows(workbookRows);
      })
      .catch((error) => {
        if (requestId !== uploadFileReadRef.current) return;
        setSelectedFile(null);
        setParsedUploadRows([]);
        message.error(error && error.message ? error.message : String(error));
      })
      .then(() => {
        if (requestId === uploadFileReadRef.current) setUploadFileParsing(false);
      });
    return false;
  };

  const getUploadValidationRows = () => invalidUploadRows.map((row, index) => ({
    key: String(row && row.fila || index + 2) + '-' + index,
    fila: row && row.fila || index + 2,
    poliza: row && row.poliza,
    estado: 'No válida',
    mensaje: Array.isArray(row && row.errores)
      ? row.errores.join(' ')
      : String(row && (row.errores || row.mensaje || row.message || row.motivo) || 'La póliza no pudo ser validada.')
  }));

  const getPreprocessorRows = () => parsedUploadRows
    .filter((row) => Array.isArray(row))
    .map((row, index) => index === 0 ? ['poliza'] : [row[0]]);

  const validateSelectedFile = () => {
    if (selectedLoadType === null || selectedLoadType === undefined) {
      message.warning('Seleccione un tipo de carga para continuar.');
      return;
    }

    if (!selectedFile) {
      message.warning('Seleccione un archivo para continuar.');
      return;
    }
    if (uploadFileParsing) return;
    if (!parsedUploadRows.length) {
      message.warning('El archivo todavía no contiene filas válidas para procesar.');
      return;
    }
    if (!currentUserEmail) {
      message.error('No se pudo identificar el usuario de la sesión.');
      return;
    }

    setProcessingFile(true);
    setPrevalidatedUploadRows([]);
    setInvalidUploadRows([]);
    exe('ExeChain', {
      chain: PREPROCESSOR_CHAIN,
      context: JSON.stringify({
        rows: getPreprocessorRows(),
        templateId: Number(selectedLoadType),
        usuario: currentUserEmail
      })
    })
      .then((result) => {
        const payload = result && result.outData && !Array.isArray(result.outData)
          ? result.outData
          : result;
        const validRows = payload && Array.isArray(payload.outData) ? payload.outData : [];
        const invalidRows = payload && Array.isArray(payload.outDataAux) ? payload.outDataAux : [];
        const validCount = Math.max(0, validRows.length - 1);

        setPrevalidatedUploadRows(validRows);
        setInvalidUploadRows(invalidRows);

        if (!result || result.ok === false || !payload || payload.ok === false) {
          throw new Error(payload && payload.msg
            ? payload.msg
            : (result && result.msg ? result.msg : 'No se pudo validar el archivo.'));
        }

        if (validCount <= 0) {
          message.warning('No se encontraron pólizas válidas. Revise el detalle de validación antes de cargar el archivo.');
        } else {
          message.success('Validación finalizada: ' + validCount + ' válidas y ' + invalidRows.length + ' no válidas.');
        }
      })
      .catch((error) => {
        message.error(error && error.message ? error.message : 'No se pudo validar el archivo.');
      })
      .then(() => setProcessingFile(false));
  };

  const processSelectedFile = () => {
    if (selectedLoadType === null || selectedLoadType === undefined) {
      message.warning('Seleccione un tipo de carga para continuar.');
      return;
    }
    if (!selectedFile) {
      message.warning('Seleccione un archivo para continuar.');
      return;
    }
    if (!prevalidatedUploadRows.length) {
      message.warning('Valide el archivo antes de cargarlo.');
      return;
    }

    const validCount = Math.max(0, prevalidatedUploadRows.length - 1);
    if (validCount <= 0) {
      message.warning('No hay pólizas válidas para crear el lote. Corrija el archivo y vuelva a validarlo.');
      return;
    }
    if (!currentUserEmail || processingFile) return;

    setProcessingFile(true);
    resolveImportConfigId()
      .then((configId) => exe('RepoBatch', {
        operation: 'ADD',
        entity: {
          importConfigId: configId,
          jData: JSON.stringify(buildStoredData(prevalidatedUploadRows, invalidUploadRows)),
          name: selectedFile.name,
          processingType: 0,
          records: validCount,
          success: 0,
          error: 0
        }
      }))
      .then((batchResult) => {
        if (!batchResult || batchResult.ok === false) {
          throw new Error(batchResult && batchResult.msg
            ? batchResult.msg
            : 'No se pudo crear el lote de notificaciones masivas.');
        }

        if (invalidUploadRows.length) {
          message.warning('Lote creado con ' + validCount + ' pólizas; '
            + invalidUploadRows.length + ' quedaron registradas como inconsistencias y no se procesarán.');
        } else {
          message.success('Lote creado correctamente con ' + validCount + ' pólizas.');
        }
        setUploadOpen(false);
        clearUploadSelection();
        setSelectedLoadType(undefined);
        return loadBatches(1, pagination.pageSize || PAGE_SIZE, filters);
      })
      .catch((error) => {
        message.error(error && error.message ? error.message : 'No se pudo crear el lote de notificaciones masivas.');
      })
      .then(() => setProcessingFile(false));
  };

  const handleTableChange = (nextPagination) => {
    loadBatches(nextPagination.current || 1, nextPagination.pageSize || PAGE_SIZE, filters);
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
    style.setAttribute('data-notificaciones-masivas-style', 'true');
    style.innerHTML = `
      .notificaciones-masivas-shell {
        width: 100%;
        height: calc(100dvh - 72px);
        max-height: calc(100dvh - 72px);
        min-height: 0;
        padding: 4px 8px 8px;
        overflow: hidden;
        box-sizing: border-box;
      }

      .notificaciones-masivas-shell > .notificaciones-masivas-card {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .notificaciones-masivas-shell > .notificaciones-masivas-card > .ant-card-head {
        flex: 0 0 auto;
        min-height: 48px;
        padding: 0 16px;
        border-bottom: 1px solid #cbd1d8;
      }

      .notificaciones-masivas-title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #1f1f1f;
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
      }

      .notificaciones-masivas-title-mark {
        width: 8px;
        height: 22px;
        border-radius: 2px;
        background: #1677ff;
      }

      .notificaciones-masivas-shell > .notificaciones-masivas-card > .ant-card-head,
      .notificaciones-masivas-toolbar,
      .notificaciones-masivas-filters {
        flex: 0 0 auto;
      }

      .notificaciones-masivas-shell > .notificaciones-masivas-card > .ant-card-body {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px 12px;
        overflow: hidden;
      }

      .notificaciones-masivas-toolbar {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        min-height: 42px;
        margin: -6px -8px 0;
        padding: 4px 0;
        background: #e6f7ff;
        border: 1px solid #91caff;
        border-radius: 0;
        box-shadow: 0 1px 3px rgba(22, 119, 255, 0.12);
      }

      .notificaciones-masivas-toolbar > .ant-space {
        margin-left: 4px;
        margin-right: 4px;
      }

      .notificaciones-masivas-toolbar .ant-btn:disabled {
        border-color: #6f7b88;
        opacity: 1;
      }

      .notificaciones-masivas-toolbar .notificaciones-masivas-report-button {
        background: #dd603d;
        border-color: #bd4d35;
        color: #fff;
      }

      .notificaciones-masivas-toolbar .notificaciones-masivas-report-button:hover,
      .notificaciones-masivas-toolbar .notificaciones-masivas-report-button:focus {
        background: #bd4d35;
        border-color: #a9432e;
        color: #fff;
      }

      .notificaciones-masivas-toolbar .notificaciones-masivas-execute-button {
        background: #60b13d;
        border-color: #4f9336;
        color: #fff;
      }

      .notificaciones-masivas-toolbar .notificaciones-masivas-execute-button:hover,
      .notificaciones-masivas-toolbar .notificaciones-masivas-execute-button:focus {
        background: #4f9336;
        border-color: #3f7d2c;
        color: #fff;
      }

      .notificaciones-masivas-toolbar .notificaciones-masivas-export-button {
        background: #60b13d;
        border-color: #4f9336;
        color: #fff;
      }

      .notificaciones-masivas-toolbar .notificaciones-masivas-export-button:hover,
      .notificaciones-masivas-toolbar .notificaciones-masivas-export-button:focus {
        background: #4f9336;
        border-color: #3f7d2c;
        color: #fff;
      }

      .notificaciones-masivas-filters {
        margin: 0;
        padding: 8px 12px 2px;
        border: 1px solid #b7c8d9;
        border-radius: 2px;
      }

      .notificaciones-masivas-filters legend {
        width: auto;
        margin: 0;
        padding: 0 6px;
        color: #174f7c;
        font-size: 13px;
        font-weight: 600;
      }

      .notificaciones-masivas-filter-form .ant-form-item {
        margin-bottom: 8px !important;
      }

      .notificaciones-masivas-filter-actions {
        margin-bottom: 8px;
      }

      .notificaciones-masivas-grid {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .notificaciones-masivas-grid .ant-table-wrapper,
      .notificaciones-masivas-grid .ant-spin-nested-loading,
      .notificaciones-masivas-grid .ant-spin-container,
      .notificaciones-masivas-grid .ant-table,
      .notificaciones-masivas-grid .ant-table-container {
        flex: 1 1 auto;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }

      .notificaciones-masivas-grid .ant-table-wrapper,
      .notificaciones-masivas-grid .ant-spin-container,
      .notificaciones-masivas-grid .ant-table,
      .notificaciones-masivas-grid .ant-table-container {
        display: flex;
        flex-direction: column;
      }

      .notificaciones-masivas-grid .ant-table-body {
        flex: 1 1 auto;
        min-height: 0;
        max-height: none !important;
        overflow: auto !important;
        scrollbar-gutter: stable;
      }

      .notificaciones-masivas-grid .ant-table-header {
        flex: 0 0 auto;
        position: relative;
        z-index: 3;
        overflow: hidden !important;
        background: #fafafa !important;
      }

      .notificaciones-masivas-grid .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-inline-end: 1px solid #cbd1d8 !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .notificaciones-masivas-grid .ant-table-container {
        border: 1px solid #cbd1d8;
      }

      .notificaciones-masivas-grid .ant-table-tbody > tr > td {
        border-inline-end: 0 !important;
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .notificaciones-masivas-grid .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      .notificaciones-masivas-grid .notificaciones-masivas-selected-row:hover > td,
      .notificaciones-masivas-grid .notificaciones-masivas-selected-row > td {
        background: #86b4ff !important;
      }

      .notificaciones-masivas-grid .ant-table-pagination {
        flex: 0 0 auto;
        margin: 8px 0 0 !important;
      }

      .notificaciones-masivas-selectable-row {
        cursor: pointer;
      }

      .notificaciones-masivas-selected-row > td {
        background: #e6f7ff !important;
      }

      .notificaciones-masivas-ellipsis {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notificaciones-masivas-upload-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .notificaciones-masivas-upload-file {
        flex: 1 1 auto;
        min-width: 0;
      }

      .notificaciones-masivas-upload-modal .ant-modal-body {
        padding: 14px 16px 8px;
      }

      .notificaciones-masivas-upload-modal .ant-modal-footer {
        padding-top: 8px;
        text-align: right;
      }

      .notificaciones-masivas-upload-group {
        margin: 0;
        padding: 12px 16px 4px;
        border: 1px solid #b7c8d9;
        border-radius: 2px;
      }

      .notificaciones-masivas-upload-group legend {
        width: auto;
        margin: 0;
        padding: 0 6px;
        color: #174f7c;
        font-size: 13px;
        font-weight: 600;
      }

      .notificaciones-masivas-upload-form .ant-form-item {
        margin-bottom: 10px !important;
      }

      .notificaciones-masivas-upload-form .ant-form-item-label {
        text-align: left;
      }

      .notificaciones-masivas-detail {
        display: grid;
        gap: 8px;
        padding-top: 8px;
      }

      .notificaciones-masivas-upload-validation {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }

      .notificaciones-masivas-upload-validation-summary {
        padding: 8px 10px;
        background: #eaf4ff;
        border: 1px solid #b7d7f5;
        color: #174f7c;
        font-size: 12px;
      }

      .notificaciones-masivas-inconsistency-table .ant-table-container {
        border: 1px solid #cbd1d8;
      }

      .notificaciones-masivas-inconsistency-table .ant-table-thead > tr > th {
        background: #bfbfbf !important;
        border-inline-end: 1px solid #cbd1d8 !important;
        border-right: 1px solid #cbd1d8 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .notificaciones-masivas-inconsistency-table .ant-table-tbody > tr > td {
        border-inline-end: 0 !important;
        border-right: 0 !important;
        border-bottom: 1px solid #cbd1d8 !important;
        padding: 5px 8px !important;
        font-size: 12px;
        line-height: 18px;
      }

      .notificaciones-masivas-inconsistency-table .ant-table-tbody > tr:hover > td {
        background: #b7d7ff !important;
      }

      @media (max-width: 768px) {
        .notificaciones-masivas-shell > .notificaciones-masivas-card > .ant-card-body {
          padding: 8px;
        }

        .notificaciones-masivas-filters {
          max-height: 42vh;
          overflow-y: auto;
        }
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
    loadLoadTypes().then(() => loadBatches(1, PAGE_SIZE, {}));
    loadUsers();
    loadCurrentUser();
    return () => {
      listRequestRef.current += 1;
      batchStatusPollRef.current += 1;
    };
  }, []);

  React.useEffect(() => {
    const hasActiveBatch = rows.some((record) => ['pending', 'running'].indexOf(batchExecutionState(record)) >= 0);
    if (!hasActiveBatch) return undefined;

    const intervalId = window.setInterval(refreshActiveBatchRows, 4000);
    return () => window.clearInterval(intervalId);
  }, [rows]);

  return (
    <div ref={shellRef} className="notificaciones-masivas-shell">
      <Card
        className="notificaciones-masivas-card"
        title={(
          <div className="notificaciones-masivas-title">
            <span className="notificaciones-masivas-title-mark" aria-hidden="true" />
            <span>Gestión de lotes de notificaciones masivas</span>
          </div>
        )}
        size="small"
      >
        <Space className="notificaciones-masivas-toolbar" wrap>
          <Button
            className="notificaciones-masivas-primary-button"
            type="primary"
            loading={currentUserLoading}
            disabled={currentUserLoading || !currentUserEmail}
            onClick={openUpload}
          >
            <UploadIcon />
            Cargar archivo
          </Button>
          <Button
            className="notificaciones-masivas-outline-button"
            danger
            disabled={!selectedBatch || Number(selectedBatch.error || 0) <= 0}
            onClick={openInconsistencies}
          >
            <EyeIcon />
            Ver inconsistencias
          </Button>
          <Tooltip title={selectedBatch ? executionBlockedMessage(selectedBatch) : 'Seleccione un lote para ejecutar.'}>
            <span>
              <Button
                className="notificaciones-masivas-execute-button"
                type="primary"
                loading={processingBatchId !== null
                  && selectedBatch !== null
                  && Number(processingBatchId) === Number(selectedBatch.id)}
                disabled={!selectedBatch || loading || processingBatchId !== null
                  || Boolean(executionBlockedMessage(selectedBatch))}
                onClick={executeSelectedBatch}
              >
                <PlayIcon />
                Ejecutar lote
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={selectedBatch ? deletionBlockedMessage(selectedBatch) : 'Seleccione un lote para eliminarlo.'}>
            <span>
              <Button
                className="notificaciones-masivas-outline-button"
                danger
                loading={deletingBatchId !== null
                  && selectedBatch !== null
                  && Number(deletingBatchId) === Number(selectedBatch.id)}
                disabled={!selectedBatch || loading || deletingBatchId !== null
                  || Boolean(deletionBlockedMessage(selectedBatch))}
                onClick={deleteSelectedBatch}
              >
                <TrashIcon />
                Eliminar lote
              </Button>
            </span>
          </Tooltip>
          <Button className="notificaciones-masivas-outline-button" onClick={handleClear}>
            <ClearIcon />
            Limpiar filtros
          </Button>
          <Button
            className="notificaciones-masivas-export-button"
            loading={exporting}
            disabled={!selectedBatch || exporting || loading}
            onClick={exportSelectedBatch}
          >
            <ExportIcon />
            Exportar
          </Button>
        </Space>

        <fieldset className="notificaciones-masivas-filters">
          <legend>Búsqueda y seguimiento de lotes</legend>

          <Form
            form={form}
            className="notificaciones-masivas-filter-form"
            layout="vertical"
            size="small"
          >
            <Row gutter={12}>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item label="Tipo de carga" name="tipoCarga">
                  <Select
                    allowClear
                    loading={loadTypesLoading}
                    disabled={loadTypesLoading || !loadTypeOptions.length}
                    placeholder={loadTypesLoading
                      ? 'Cargando tipos...'
                      : (loadTypeOptions.length ? 'No especificado' : 'No hay tipos disponibles')}
                    options={loadTypeOptions}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Form.Item label="Estado del lote" name="estado">
                  <Select
                    allowClear
                    placeholder="No especificado"
                    options={[
                      { value: 'PENDING', label: 'Pendiente' },
                      { value: 'PROCESSING', label: 'Proceso' },
                      { value: 'FINISHED', label: 'Finalizado' },
                      { value: 'ERROR', label: 'Error' }
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Form.Item label="Usuario de carga" name="usuarioCarga">
                  <Select
                    allowClear
                    showSearch
                    loading={usersLoading}
                    optionFilterProp="label"
                    placeholder="No especificado"
                    options={userOptions}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Form.Item label="Número de lote" name="numeroLote">
                  <Input placeholder="Ingrese el número de lote" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Form.Item label="Carga desde" name="fechaDesde">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Form.Item label="Carga hasta" name="fechaHasta">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Space className="notificaciones-masivas-filter-actions" wrap>
              <Button type="primary" loading={loading} onClick={handleSearch}>
                <SearchIcon />
                Buscar
              </Button>
            </Space>
          </Form>
        </fieldset>

        <div className="notificaciones-masivas-grid">
          <Table
            size="small"
            rowKey="id"
            bordered
            loading={loading}
            columns={columns}
            dataSource={rows}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedRowKeys,
              onChange: (keys, selectedRows) => {
                setSelectedRowKeys(keys);
                setSelectedBatch(selectedRows && selectedRows[0] ? selectedRows[0] : null);
              }
            }}
            scroll={{ x: 1185, y: '100%' }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: false,
              showTotal: (total, range) => 'Mostrando ' + range[0] + ' - ' + range[1] + ' de ' + total
            }}
            onChange={handleTableChange}
            onRow={(record) => ({
              onClick: () => {
                setSelectedRowKeys([record.id]);
                setSelectedBatch(record);
              }
            })}
            rowClassName={(record) => selectedBatch && String(selectedBatch.id) === String(record.id)
              ? 'notificaciones-masivas-selectable-row notificaciones-masivas-selected-row'
              : 'notificaciones-masivas-selectable-row'}
            locale={{ emptyText: loading ? 'Consultando...' : 'No hay lotes para mostrar' }}
          />
        </div>

        <Modal
          className="notificaciones-masivas-upload-modal"
          title="Carga de archivo para notificaciones masivas"
          width={760}
          open={uploadOpen}
          onCancel={closeUpload}
          closable={!processingFile}
          maskClosable={!processingFile}
          destroyOnClose
          footer={[
            <Button key="close" disabled={processingFile} onClick={closeUpload}>
              <CloseIcon />
              Cerrar
            </Button>,
            <Button
              key="validate"
              loading={processingFile || uploadFileParsing}
              disabled={!selectedFile || !parsedUploadRows.length || uploadFileParsing || processingFile
                || selectedLoadType === null || selectedLoadType === undefined}
              onClick={validateSelectedFile}
            >
              <EyeIcon />
              Validar archivo
            </Button>,
            <Button
              key="load"
              type="primary"
              loading={processingFile}
              disabled={!selectedFile || !parsedUploadRows.length || uploadFileParsing
                || selectedLoadType === null || selectedLoadType === undefined
                || !prevalidatedUploadRows.length || prevalidatedUploadRows.length <= 1}
              onClick={processSelectedFile}
            >
              <UploadIcon />
              Cargar
            </Button>
          ]}
        >
          <fieldset className="notificaciones-masivas-upload-group">
            <legend>Datos del archivo</legend>

            <Form
              className="notificaciones-masivas-upload-form"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              labelAlign="left"
              colon
              size="small"
            >
              <Form.Item label="Tipo de carga">
                <Select
                  value={selectedLoadType}
                  onChange={(value) => {
                    setSelectedLoadType(value);
                    setPrevalidatedUploadRows([]);
                    setInvalidUploadRows([]);
                  }}
                  loading={loadTypesLoading}
                  disabled={loadTypesLoading || !loadTypeOptions.length || processingFile}
                  placeholder={loadTypesLoading
                    ? 'Cargando tipos...'
                    : (loadTypeOptions.length ? 'No especificado' : 'No hay tipos disponibles')}
                  options={loadTypeOptions}
                />
              </Form.Item>

              <Form.Item label="Archivo">
                <div className="notificaciones-masivas-upload-row">
                  <Input
                    className="notificaciones-masivas-upload-file"
                    readOnly
                    value={selectedFile ? selectedFile.name : ''}
                    placeholder="Seleccione un archivo"
                  />
                  <Upload
                    accept=".xlsx"
                    beforeUpload={selectUploadFile}
                    fileList={selectedFile ? [selectedFile] : []}
                    showUploadList={false}
                    disabled={processingFile || uploadFileParsing}
                  >
                    <Button loading={uploadFileParsing} disabled={processingFile}>
                      <SearchIcon />
                      Buscar
                    </Button>
                  </Upload>
                </div>
              </Form.Item>
            </Form>
          </fieldset>

          {(prevalidatedUploadRows.length > 0 || invalidUploadRows.length > 0) && (
            <div className="notificaciones-masivas-upload-validation">
              <div className="notificaciones-masivas-upload-validation-summary">
                <strong>Resultado de validación:</strong>{' '}
                {Math.max(0, prevalidatedUploadRows.length - 1)} válidas, {invalidUploadRows.length} no válidas.
              </div>
              <Table
                className="notificaciones-masivas-inconsistency-table"
                rowKey="key"
                size="small"
                bordered
                columns={uploadValidationColumns}
                dataSource={getUploadValidationRows()}
                pagination={{ pageSize: 8, hideOnSinglePage: true }}
                locale={{ emptyText: 'No se encontraron inconsistencias.' }}
              />
            </div>
          )}
        </Modal>

        <Modal
          title={selectedBatch ? 'Inconsistencias del lote ' + selectedBatch.id : 'Inconsistencias del lote'}
          width={760}
          open={inconsistencyOpen}
          onCancel={closeInconsistencies}
          closable={!inconsistencyLoading}
          maskClosable={!inconsistencyLoading}
          footer={[
            <Button key="close" disabled={inconsistencyLoading} onClick={closeInconsistencies}>
              <CloseIcon />
              Cerrar
            </Button>
          ]}
        >
          <Table
            className="notificaciones-masivas-inconsistency-table"
            rowKey="key"
            size="small"
            loading={inconsistencyLoading}
            columns={inconsistencyColumns}
            dataSource={inconsistencyRows}
            pagination={false}
            locale={{ emptyText: inconsistencyLoading ? 'Consultando...' : 'No hay inconsistencias para mostrar' }}
          />
        </Modal>
      </Card>
    </div>
  );
}
