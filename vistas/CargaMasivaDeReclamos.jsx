/**
 * @name CargaMasivaDeReclamos
 * @purpose Bulk claim import preparation, batch execution and results for SISOS11.
 * @version 1.0.0
 */
() => {
  const Card = A.Card;
  const Form = A.Form;
  const Select = A.Select;
  const Button = A.Button;
  const Space = A.Space;
  const Row = A.Row;
  const Col = A.Col;
  const Table = A.Table;
  const Alert = A.Alert;
  const Drawer = A.Drawer;
  const Modal = A.Modal;
  const Upload = A.Upload;
  const Tag = A.Tag;
  const Tooltip = A.Tooltip;
  const Progress = A.Progress;
  const actionPaths = {
    search: 'M909.6 854.6L649.9 594.9A314.3 314.3 0 0 0 712 412c0-166.8-135.2-302-302-302S108 245.2 108 412s135.2 302 302 302a299.5 299.5 0 0 0 182.8-62.1l259.7 259.7a8 8 0 0 0 11.3 0l45.8-45.7a8 8 0 0 0 0-11.3zM410 634c-122.6 0-222-99.4-222-222s99.4-222 222-222 222 99.4 222 222-99.4 222-222 222z',
    upload: 'M472 656h80V344l104 104 56-56-200-200-200 200 56 56 104-104v312zM160 760h704v80H160z',
    download: 'M472 128h80v384h128L512 704 344 512h128V128zM160 800h704v80H160z',
    play: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-80 672V288l240 224-240 224z',
    view: 'M942.2 486.2C847.4 286.5 704.1 186 512 186S176.6 286.5 81.8 486.2a60.7 60.7 0 0 0 0 51.6C176.6 737.5 319.9 838 512 838s335.4-100.5 430.2-300.2a60.7 60.7 0 0 0 0-51.6zM512 726c-119.4 0-227.2-65.6-305.3-177C284.8 437.6 392.6 372 512 372s227.2 65.6 305.3 177C739.2 660.4 631.4 726 512 726zm0-304c-69 0-125 56-125 125s56 125 125 125 125-56 125-125-56-125-125-125z',
    detail: 'M832 128H384c-35.3 0-64 28.7-64 64v640c0 35.3 28.7 64 64 64h448c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64zM400 256h320v64H400v-64zm0 128h224v64H400v-64zm0 128h128v64H400v-64zm360 248H516l-80-80 45-45 35 35 91-91 45 45-91 91h199v45z',
    close: 'M563.8 512l262.5-312.2c4.4-5.2.7-13.3-6.1-13.3H745.5c-4.6 0-9 2-12 5.6L512 451.8 290.5 192.1c-3-3.6-7.4-5.6-12-5.6H203.8c-6.8 0-10.5 8.1-6.1 13.3L460.2 512 197.7 824.2c-4.4 5.2-.7 13.3 6.1 13.3h74.7c4.6 0 9-2 12-5.6L512 572.2l221.5 259.7c3 3.6 7.4 5.6 12 5.6h74.7c6.8 0 10.5-8.1 6.1-13.3L563.8 512z',
    refresh: 'M832 192v224H608l88-88a256 256 0 1 0 72 248h82A336 336 0 1 1 753 271l79-79z'
  };
  const ActionIcon = (props) => React.createElement('span', { className: 'anticon bulk-claims-action-icon', 'aria-hidden': true },
    React.createElement('svg', { viewBox: '64 64 896 896', width: '1em', height: '1em', fill: 'currentColor', focusable: false },
      React.createElement('path', { d: actionPaths[props.name] })));
  const CLAIMS_IMPORT_CATEGORY = 'ReclamosMasivos';
  const [state, setState] = React.useState({
    product: null, configs: [], configsLoading: false, file: null, rows: [], detail: null, detailOpen: false, error: '',
    loading: false, loaded: false, current: 1, total: null, hasNext: false, templateLoading: false,
    uploading: false, uploadUncertain: false, notice: '', detailLoading: false, detailError: '', exporting: false,
    selectedBatchId: null, resultsOpen: false,
    cobis: { open: false, file: null, rows: [], busy: false, exporting: false, complete: false, error: '' }
  });
  const mountedRef = React.useRef(true);
  const requestRef = React.useRef(0);
  const configsRef = React.useRef([]);
  const configRequestRef = React.useRef(0);
  const productRef = React.useRef(null);
  const templateRequestRef = React.useRef(0);
  const templateBusyRef = React.useRef(false);
  const uploadBusyRef = React.useRef(false);
  const uploadUncertainRef = React.useRef(false);
  const fileRef = React.useRef(null);
  const detailRequestRef = React.useRef(0);
  const detailRef = React.useRef(null);
  const exportBusyRef = React.useRef(false);
  const xlsxPromiseRef = React.useRef(null);
  const listedBatchesRef = React.useRef([]);
  const selectedBatchRef = React.useRef(null);
  const pageRef = React.useRef(1);
  const executionRef = React.useRef({});
  const pollBusyRef = React.useRef(false);
  const pollTimerRef = React.useRef(null);
  const cobisRef = React.useRef({ token: 0, open: false, file: null, rows: [], busy: false, exporting: false, complete: false });
  const update = (values) => { if (mountedRef.current) setState((current) => Object.assign({}, current, values)); };
  const responseRows = (result) => {
    if (!result || result.ok === false) throw new Error(result && result.msg || 'No se pudo consultar la información.');
    const rows = Array.isArray(result.outData) ? result.outData : result.outData && result.outData.data;
    if (!Array.isArray(rows)) throw new Error('La respuesta del sistema no tiene el formato esperado.');
    return rows;
  };
  const configFilter = (product) => {
    const id = Number(product);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Seleccione un tipo de carga válido.');
    return "category = '" + CLAIMS_IMPORT_CATEGORY + "' and id = " + id;
  };
  const configRows = (result, product) => {
    const configs = responseRows(result);
    if (configs.length !== 1 || Number(configs[0].id || configs[0].Id) !== Number(product)
      || configs[0].category !== CLAIMS_IMPORT_CATEGORY) {
      throw new Error('El tipo de carga ya no pertenece a ' + CLAIMS_IMPORT_CATEGORY + ' o no está disponible.');
    }
    return configs;
  };
  const loadConfigs = () => {
    if (uploadBusyRef.current) return Promise.resolve();
    const token = ++configRequestRef.current;
    const active = () => mountedRef.current && token === configRequestRef.current;
    update({ configsLoading: true, error: '' });
    return Promise.resolve().then(() => exe('RepoImportConfig', { operation: 'GET', filter: "category = '" + CLAIMS_IMPORT_CATEGORY + "'" })).then((result) => {
      if (!active()) return;
      const configs = responseRows(result);
      const seen = new Set();
      if (!configs.length) throw new Error('No hay importaciones configuradas en la categoría ' + CLAIMS_IMPORT_CATEGORY + '.');
      configs.forEach((config) => {
        const id = Number(config.id || config.Id);
        if (!Number.isSafeInteger(id) || id <= 0 || typeof config.name !== 'string' || !config.name.trim()
          || config.category !== CLAIMS_IMPORT_CATEGORY || seen.has(id)) {
          throw new Error('La lista de tipos de carga no es válida.');
        }
        seen.add(id);
      });
      configsRef.current = configs;
      update({ configs: configs });
      return selectProduct(seen.has(Number(productRef.current)) ? productRef.current : String(configs[0].id || configs[0].Id));
    }).catch((error) => {
      if (active()) {
        configsRef.current = [];
        productRef.current = null;
        requestRef.current++;
        listedBatchesRef.current = [];
        selectedBatchRef.current = null;
        closeDetail();
        update({ configs: [], product: null, rows: [], selectedBatchId: null, loading: false, error: error.message });
      }
    }).then(() => { if (active()) update({ configsLoading: false }); });
  };
  const loadBatches = (page) => {
    if (!mountedRef.current) return Promise.resolve();
    const product = productRef.current;
    if (!product) return Promise.resolve();
    const current = Number.isSafeInteger(page) && page > 0 ? page : 1;
    if (current !== pageRef.current) closeDetail();
    listedBatchesRef.current = [];
    if (current !== pageRef.current) selectedBatchRef.current = null;
    pageRef.current = current;
    const token = ++requestRef.current;
    let configId;
    const active = () => mountedRef.current && token === requestRef.current;
    update({ loading: true, loaded: false, rows: [], current: current, total: null, hasNext: false, error: '',
      selectedBatchId: selectedBatchRef.current ? String(selectedBatchRef.current.id) : null });
    return Promise.resolve().then(() => {
      if (!active()) return null;
      return exe('RepoImportConfig', { operation: 'GET', filter: configFilter(product) });
    }).then((result) => {
      if (!active()) return null;
      const configs = configRows(result, product);
      configId = Number(configs[0].id || configs[0].Id);
      if (!Number.isSafeInteger(configId) || configId <= 0) throw new Error('La configuración de carga no tiene un identificador válido.');
      return exe('RepoBatch', { operation: 'GET', filter: 'importConfigId = ' + configId, page: current - 1, size: 10 });
    }).then((result) => {
      if (!active()) return;
      const rows = responseRows(result);
      if (!rows.every((row) => row && Number.isSafeInteger(Number(row.id)) && Number(row.id) > 0 && Number(row.importConfigId) === configId)) {
        throw new Error('Se recibieron lotes que no corresponden al producto seleccionado.');
      }
      const source = result.outData;
      const rawTotal = source && !Array.isArray(source) && source.total != null ? source.total : result.total;
      const total = rawTotal != null && rawTotal !== '' ? Number(rawTotal) : null;
      if (total !== null && (!Number.isSafeInteger(total) || total < 0 || (rows.length && total < (current - 1) * 10 + rows.length))) {
        throw new Error('La cantidad total de lotes recibida no es válida.');
      }
      listedBatchesRef.current = rows;
      const selectedId = selectedBatchRef.current && String(selectedBatchRef.current.id);
      selectedBatchRef.current = rows.find((row) => String(row.id) === selectedId) || null;
      update({ rows: rows, loaded: true, total: total, hasNext: total === null ? rows.length === 10 : current * 10 < total,
        selectedBatchId: selectedBatchRef.current ? String(selectedBatchRef.current.id) : null });
      if (detailRef.current) {
        const visibleDetail = rows.find((row) => executionKey(row) === executionKey(detailRef.current));
        if (!visibleDetail) closeDetail();
        else if (!exportBusyRef.current) return showDetail(visibleDetail, true);
      }
    }).catch((error) => {
      if (active()) {
        selectedBatchRef.current = null;
        closeDetail();
        update({ rows: [], loaded: false, selectedBatchId: null, error: error && error.message || 'No se pudieron consultar las cargas.' });
      }
    }).then(() => { if (active()) update({ loading: false }); });
  };
  const selectProduct = (product) => {
    const configId = Number(product);
    if (uploadBusyRef.current || !Number.isSafeInteger(configId) || configId <= 0
      || !configsRef.current.some((config) => Number(config.id || config.Id) === configId)) return;
    closeDetail();
    selectedBatchRef.current = null;
    templateRequestRef.current++;
    templateBusyRef.current = false;
    fileRef.current = null;
    uploadUncertainRef.current = false;
    productRef.current = String(configId);
    update({ product: productRef.current, file: null, detail: null, detailOpen: false, error: '', templateLoading: false, uploadUncertain: false, notice: '' });
    return loadBatches(1);
  };
  const selectFile = (file) => {
    if (uploadBusyRef.current) return;
    fileRef.current = file && file.size > 0 ? file : null;
    uploadUncertainRef.current = false;
    update({ file: fileRef.current, uploadUncertain: false, notice: '', error: file && !file.size ? 'El archivo está vacío.' : '' });
  };
  const closeDetail = () => {
    detailRequestRef.current++;
    detailRef.current = null;
    exportBusyRef.current = false;
    update({ detailOpen: false, resultsOpen: false, detail: null, detailLoading: false, detailError: '', exporting: false });
  };
  const selectBatch = (batch) => {
    if (uploadBusyRef.current || !mountedRef.current) return;
    const selected = listedBatchesRef.current.find((row) => batch && String(row.id) === String(batch.id));
    if (!selected) return;
    closeDetail();
    selectedBatchRef.current = selected;
    update({ selectedBatchId: String(selected.id) });
  };
  const showSelectedDetail = () => {
    const selected = selectedBatchRef.current;
    if (!selected || !listedBatchesRef.current.some((row) => row === selected)) return Promise.resolve();
    return showDetail(selected);
  };
  const openResults = () => {
    if (detailRef.current) update({ resultsOpen: true });
  };
  const closeResults = () => update({ resultsOpen: false });
  const templateHeaders = (value) => {
    let mappings;
    try { mappings = typeof value === 'string' ? JSON.parse(value) : value; }
    catch (error) { throw new Error('No se pudo leer la configuración de columnas de la plantilla.'); }
    if (!Array.isArray(mappings) || !mappings.length) throw new Error('La plantilla no tiene columnas configuradas.');
    const seen = Object.create(null);
    return mappings.map((mapping) => {
      if (!Array.isArray(mapping) || mapping.length !== 3 || typeof mapping[0] !== 'string'
        || !mapping[0].trim() || typeof mapping[2] !== 'string' || !mapping[2].trim()) {
        throw new Error('La configuración de columnas de la plantilla no es válida.');
      }
      const title = mapping[0];
      if (/^[\s]*[=+@-]/.test(title) || /[\u0000-\u001f\u007f]/.test(title)) {
        throw new Error('La plantilla contiene un encabezado que no se puede exportar de forma segura: ' + mapping[2] + '.');
      }
      const normalized = title.trim().toLowerCase();
      if (seen[normalized]) throw new Error('La plantilla contiene un encabezado duplicado: ' + title + '.');
      seen[normalized] = true;
      return title;
    });
  };
  const normalizeDetail = (batch, value, mappings, product) => {
    const headers = templateHeaders(mappings);
    const inputWidth = headers.length;
    if (batch.dataCols != null && batch.dataCols !== '' && Number(batch.dataCols) !== 0 && Number(batch.dataCols) !== inputWidth) {
      throw new Error('Las columnas del lote no coinciden con la plantilla actual.');
    }
    let data;
    try { data = typeof value === 'string' ? JSON.parse(value) : value; }
    catch (error) { throw new Error('No se pudieron leer los registros del lote.'); }
    if (!Array.isArray(data)) throw new Error('Los registros del lote no tienen el formato esperado.');
    let width = inputWidth;
    const rows = data.map((row, index) => {
      if (!Array.isArray(row) || row.length < inputWidth || row.some((cell) => cell !== null && ['string', 'number', 'boolean'].indexOf(typeof cell) < 0)) {
        throw new Error('El lote contiene registros con columnas inválidas.');
      }
      const canonical = batch.dataCols != null && batch.dataCols !== ''
        && [0, inputWidth].indexOf(Number(batch.dataCols)) >= 0
        && row.length === inputWidth + 2 && typeof row[inputWidth] === 'boolean' && typeof row[inputWidth + 1] === 'string';
      const awaitingResult = row.length === inputWidth && (isProcessing(batch)
        || (batch.launched === null && (batch.status === null || ['CREATED', 'READY'].indexOf(String(batch.status).toUpperCase()) >= 0)));
      const values = canonical ? row.slice(0, inputWidth) : row;
      width = Math.max(width, values.length);
      return { key: String(index), line: index + 1, values: values,
        resultLabel: canonical ? (row[inputWidth] ? 'Exitoso' : 'Con error') : awaitingResult ? 'Pendiente' : 'Sin resultado',
        resultColor: canonical ? (row[inputWidth] ? 'green' : 'red') : awaitingResult ? (isProcessing(batch) ? 'blue' : 'red') : undefined,
        resultMessage: canonical ? row[inputWidth + 1] : '' };
    });
    for (let index = inputWidth; index < width; index++) headers.push('Dato adicional ' + (index - inputWidth + 1));
    return Object.assign({}, batch, { product: product, headers: headers, rows: rows });
  };
  const showDetail = (selected, refresh) => {
    if (!mountedRef.current || uploadBusyRef.current) return Promise.resolve();
    if (!refresh) closeDetail();
    const token = detailRequestRef.current;
    const product = productRef.current;
    const id = Number(selected && selected.id);
    let config, batch, filter;
    const active = () => mountedRef.current && token === detailRequestRef.current && product === productRef.current;
    if (!refresh) update({ detailOpen: true, detailLoading: true });
    return Promise.resolve().then(() => {
      if (!active()) return null;
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error('El lote seleccionado no tiene un identificador válido.');
      return exe('RepoImportConfig', { operation: 'GET', filter: configFilter(product) });
    }).then((result) => {
      if (!active()) return null;
      const configs = configRows(result, product);
      config = configs[0];
      const configId = Number(config.id || config.Id);
      if (!Number.isSafeInteger(configId) || configId <= 0 || Number(selected.importConfigId) !== configId) {
        throw new Error('El lote no corresponde al tipo de carga seleccionado.');
      }
      filter = 'id = ' + id + ' and importConfigId = ' + configId;
      return exe('RepoBatch', { operation: 'GET', filter: filter, page: 0, size: 1 });
    }).then((result) => {
      if (!active()) return null;
      const rows = responseRows(result);
      if (rows.length !== 1 || Number(rows[0].id) !== id || Number(rows[0].importConfigId) !== Number(config.id || config.Id)) {
        throw new Error('No se encontró el lote seleccionado para este tipo de carga.');
      }
      batch = rows[0];
      return exe('LoadEntity', { entity: 'Batch', fields: 'jData', filter: filter, noTracking: true });
    }).then((result) => {
      if (!active()) return;
      if (!result || result.ok === false || !result.outData) throw new Error(result && result.msg || 'No se pudo consultar el detalle del lote.');
      const entities = Array.isArray(result.outData) ? result.outData : [result.outData];
      if (entities.length !== 1 || !entities[0] || (entities[0].id != null && Number(entities[0].id) !== id)
        || (entities[0].importConfigId != null && Number(entities[0].importConfigId) !== Number(batch.importConfigId))) {
        throw new Error('La respuesta no corresponde al lote seleccionado.');
      }
      const detail = normalizeDetail(batch, entities[0].jData, config.jMappings, config.name);
      detailRef.current = detail;
      update({ detail: detail });
    }).catch((error) => {
      if (active()) update({ detailError: error && error.message || 'No se pudo consultar el detalle del lote.' });
    }).then(() => { if (active()) update({ detailLoading: false }); });
  };
  const usableXlsx = (library) => library && typeof library.writeFile === 'function' && library.utils
    && typeof library.utils.aoa_to_sheet === 'function' && typeof library.utils.book_new === 'function'
    && typeof library.utils.book_append_sheet === 'function';
  const availableXlsx = () => {
    const libraries = typeof libs !== 'undefined' && libs ? libs : {};
    const globalLibrary = typeof XLSX !== 'undefined' ? XLSX : typeof window !== 'undefined' ? window.XLSX : null;
    return [libraries.XLSX, libraries.xlsx, libraries.xlsxJs, globalLibrary].find(usableXlsx) || null;
  };
  const ensureXlsx = () => {
    const available = availableXlsx();
    if (available) return Promise.resolve(available);
    if (xlsxPromiseRef.current) return xlsxPromiseRef.current;
    xlsxPromiseRef.current = Promise.resolve().then(() => exe('ExeChain', { chain: 'cmdLoadLibrariesGroupedBordereau', context: '{}' })).then((result) => {
      if (!result || result.ok === false) throw new Error(result && result.msg || 'No se pudo cargar la herramienta de Excel.');
      const libraries = result.outData || {};
      const loaded = libraries.XLSX || libraries.xlsx || libraries.xlsxJs;
      let evaluated = null;
      if (typeof loaded === 'string') {
        const value = eval(loaded);
        evaluated = typeof XLSX !== 'undefined' && usableXlsx(XLSX) ? XLSX : value;
      }
      const library = availableXlsx() || (usableXlsx(loaded) ? loaded : null) || evaluated;
      if (!usableXlsx(library)) throw new Error('No está disponible la herramienta de Excel. Solicite al administrador revisar las bibliotecas del sistema.');
      if (typeof window !== 'undefined' && !window.XLSX) window.XLSX = library;
      return library;
    }).then((library) => { xlsxPromiseRef.current = null; return library; }, (error) => { xlsxPromiseRef.current = null; throw error; });
    return xlsxPromiseRef.current;
  };
  const exportDetail = () => {
    const detail = detailRef.current;
    if (!mountedRef.current || !detail || exportBusyRef.current) return Promise.resolve();
    const token = detailRequestRef.current;
    const active = () => mountedRef.current && token === detailRequestRef.current
      && Number(detail.importConfigId) === Number(productRef.current);
    exportBusyRef.current = true;
    update({ exporting: true, detailError: '' });
    return ensureXlsx().then((library) => {
      if (!active()) return;
      const rows = [['Fila', 'Estado', 'Mensaje del proceso'].concat(detail.headers)].concat(detail.rows.map((row) => [String(row.line), row.resultLabel, row.resultMessage].concat(detail.headers.map((_, index) => {
        const value = row.values[index];
        return value == null ? '' : String(value);
      }))));
      const sheet = library.utils.aoa_to_sheet(rows);
      const workbook = library.utils.book_new();
      library.utils.book_append_sheet(workbook, sheet, 'Detalle de reclamos');
      return library.writeFile(workbook, 'detalle-reclamos-' + detail.product.toLowerCase() + '-' + String(detail.id).replace(/[^0-9]/g, '') + '.xlsx', { bookType: 'xlsx', compression: true });
    }).catch((error) => {
      if (active()) update({ detailError: error && error.message || 'No se pudo exportar el detalle a Excel.' });
    }).then(() => { if (active()) { exportBusyRef.current = false; update({ exporting: false }); } });
  };
  const uploadRows = (buffer, mappings, library) => {
    const headers = templateHeaders(mappings);
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4 || bytes[0] !== 80 || bytes[1] !== 75 || bytes[2] !== 3 || bytes[3] !== 4) {
      throw new Error('El archivo no es un libro .xlsx válido. Guárdelo como Libro de Excel (.xlsx).');
    }
    if (typeof library.read !== 'function' || typeof library.utils.encode_cell !== 'function' || typeof library.utils.decode_cell !== 'function') throw new Error('La herramienta de Excel no permite importar archivos.');
    let workbook;
    try { workbook = library.read(buffer, { type: 'array', cellDates: false, cellNF: true, cellFormula: true, bookFiles: true }); }
    catch (error) { throw new Error('No se pudo abrir el libro .xlsx. Verifique que no esté dañado ni protegido con contraseña.'); }
    if (!workbook.files || !workbook.files['xl/workbook.xml']) throw new Error('El archivo no tiene el formato .xlsx requerido.');
    const populated = (workbook.SheetNames || []).filter((name) => {
      const sheet = workbook.Sheets[name];
      return sheet && Object.keys(sheet).some((key) => /^[A-Z]+[1-9][0-9]*$/.test(key)
        && sheet[key] && (sheet[key].f != null || sheet[key].F != null || sheet[key].v != null && String(sheet[key].v) !== ''));
    });
    if (populated.length !== 1) throw new Error('El archivo debe contener una sola hoja con datos y encabezados.');
    const sheet = workbook.Sheets[populated[0]];
    if (sheet['!merges'] && sheet['!merges'].length) throw new Error('La hoja de carga no debe contener celdas combinadas.');
    let lastRow = 0;
    const extraColumns = new Set();
    const columnLetter = (c) => library.utils.encode_cell({ r: 0, c: c }).replace(/[0-9]+$/, '');
    const headerLabel = (value) => {
      const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
      return text.length > 80 ? text.slice(0, 80) + '…' : text;
    };
    Object.keys(sheet).forEach((key) => {
      if (!/^[A-Z]+[1-9][0-9]*$/.test(key)) return;
      const cell = sheet[key];
      if (!cell || cell.f == null && cell.F == null && (cell.v == null || String(cell.v) === '')) return;
      const position = library.utils.decode_cell(key);
      if (position.c >= headers.length) extraColumns.add(position.c);
      lastRow = Math.max(lastRow, position.r);
    });
    if (extraColumns.size) {
      const columns = Array.from(extraColumns).sort((a, b) => a - b);
      const labels = columns.slice(0, 8).map((c) => {
        const cell = sheet[library.utils.encode_cell({ r: 0, c: c })];
        const title = cell && cell.f == null && cell.F == null && cell.t !== 'e' ? headerLabel(cell.v) : '';
        return title ? title + ' (' + columnLetter(c) + ')' : columnLetter(c);
      });
      const remaining = columns.length > labels.length ? ', y ' + (columns.length - labels.length) + ' más' : '';
      throw new Error('El archivo contiene columnas fuera de la plantilla: ' + labels.join(', ') + remaining + '. Use únicamente las columnas de la plantilla descargada.');
    }
    const dates = ['fsiniestro', 'fnotificacions', 'fnotificacionp', 'finiprestamo', 'ffinprestamo', 'ffallecimiento'];
    const valueAt = (r, c) => {
      const cell = sheet[library.utils.encode_cell({ r: r, c: c })];
      if (!cell) return '';
      const label = 'Fila ' + (r + 1) + ', campo ' + headers[c] + ': ';
      if (cell.f != null || cell.F != null) throw new Error(label + 'no se permiten fórmulas. Pegue únicamente valores.');
      if (cell.t === 'e') throw new Error(label + 'la celda contiene un error de Excel.');
      if (cell.v == null) return '';
      if (cell.t === 'n') {
        if (!Number.isFinite(cell.v)) throw new Error(label + 'el número no es válido.');
        if (r > 0 && dates.indexOf(headers[c].toLowerCase()) >= 0) {
          if (!library.SSF || typeof library.SSF.parse_date_code !== 'function') throw new Error('La herramienta de Excel no permite interpretar fechas.');
          const date = library.SSF.parse_date_code(cell.v, { date1904: !!(workbook.Workbook && workbook.Workbook.WBProps && workbook.Workbook.WBProps.date1904) });
          if (!date || date.y < 1900 || date.m < 1 || date.m > 12 || date.d < 1 || date.d > 31 || date.y === 1900 && date.m === 2 && date.d === 29) throw new Error(label + 'la fecha de Excel no es válida.');
          const pad = (value) => String(value).padStart(2, '0');
          return date.y + '-' + pad(date.m) + '-' + pad(date.d) + ' ' + pad(date.H) + ':' + pad(date.M) + ':' + pad(Math.floor(date.S));
        }
        if (Math.abs(cell.v) >= 1e15) throw new Error(label + 'use formato de texto para números de más de 15 dígitos.');
        if (/^0+$/.test(cell.z || '') && Number.isSafeInteger(cell.v) && cell.v >= 0) return String(cell.v).padStart(cell.z.length, '0');
        return String(cell.v);
      }
      if (cell.t !== 's' && cell.t !== 'str' && cell.t !== 'b' && cell.t !== 'z') throw new Error(label + 'el tipo de celda no es compatible.');
      return String(cell.v);
    };
    headers.forEach((title, c) => {
      const received = valueAt(0, c);
      if (received !== title) throw new Error('Los encabezados no coinciden en la columna ' + columnLetter(c) + ': se esperaba "' + headerLabel(title) + '" y se encontró ' + (received === '' ? 'un encabezado vacío' : '"' + headerLabel(received) + '"') + '. Respete los nombres y el orden de la plantilla descargada.');
    });
    if (!lastRow) throw new Error('El archivo no contiene registros para cargar.');
    const rows = [];
    for (let r = 1; r <= lastRow; r++) {
      const row = headers.map((_, c) => valueAt(r, c));
      if (row.every((value) => value === '')) throw new Error('La fila ' + (r + 1) + ' está vacía entre registros con datos.');
      rows.push(row);
    }
    return rows;
  };
  const cobisHeaders = ['No. Cobis', 'Id Sis', 'Nombre completo', 'Identificación', 'Fecha de creación del contacto', 'Fecha de nacimiento'];
  const updateCobis = (values) => {
    if (mountedRef.current) setState((current) => Object.assign({}, current, { cobis: Object.assign({}, current.cobis, values) }));
  };
  const resetCobis = (open, file) => {
    cobisRef.current = { token: cobisRef.current.token + 1, open: open, file: file, rows: [], busy: false, exporting: false, complete: false };
    updateCobis({ open: open, file: file, rows: [], busy: false, exporting: false, complete: false, error: '' });
  };
  const openCobis = () => resetCobis(true, null);
  const closeCobis = () => resetCobis(false, null);
  const selectCobisFile = (file) => {
    resetCobis(true, file);
    if (file && !/\.xlsx$/i.test(file.name || '')) updateCobis({ error: 'Seleccione un archivo .xlsx.' });
    return false;
  };
  const cobisDate = (value) => {
    if (value == null || value === '') return '—';
    let text = String(value).trim().replace(' ', 'T');
    if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})?)?$/i.test(text)) return '—';
    if (text.length === 10) text += 'T00:00:00';
    text = text.replace(/(\.\d{3})\d+/, '$1');
    if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) text += 'Z';
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return '—';
    return String(parsed.getDate()).padStart(2, '0') + '/' + String(parsed.getMonth() + 1).padStart(2, '0') + '/' + parsed.getFullYear();
  };
  const lookupCobis = () => {
    const session = cobisRef.current;
    if (!mountedRef.current || !session.open || session.busy || session.exporting) return Promise.resolve();
    const file = session.file;
    if (!file || !/\.xlsx$/i.test(file.name || '')) { updateCobis({ error: 'Seleccione un archivo .xlsx.' }); return Promise.resolve(); }
    session.busy = true;
    session.complete = false;
    session.rows = [];
    const active = () => mountedRef.current && session === cobisRef.current && session.open;
    updateCobis({ busy: true, complete: false, rows: [], error: '' });
    let numbers;
    return ensureXlsx().then((library) => new Promise((resolve, reject) => {
      if (!active()) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo Excel.'));
      reader.onabort = () => reject(new Error('Se canceló la lectura del archivo Excel.'));
      reader.readAsArrayBuffer(file);
    }).then((buffer) => {
      if (!active()) return null;
      numbers = uploadRows(buffer, [['No. Cobis', '', 'nationalId']], library).map((row, index) => {
        if (!row[0].trim()) throw new Error('Fila ' + (index + 2) + ', No. Cobis: el valor está vacío. Indique el número COBIS para consultar.');
        return row[0];
      });
      const unique = Array.from(new Set(numbers));
      const contacts = [];
      const readChunk = (offset) => {
        if (!active() || offset >= unique.length) return Promise.resolve(contacts);
        const values = JSON.stringify(unique.slice(offset, offset + 200)).replace(/'/g, "''");
        const sql = "SELECT c.[id], c.[nationalId], c.[name], c.[middleName], c.[surname1], c.[surname2], c.[isPerson], c.[idType], c.[cnp], c.[passport], c.[nif], c.[created], c.[birth] FROM dbo.Contact c JOIN OPENJSON(N'" + values
          + "') n ON c.[nationalId] COLLATE Latin1_General_100_BIN2 = n.[value] COLLATE Latin1_General_100_BIN2 AND DATALENGTH(c.[nationalId]) = DATALENGTH(n.[value]) ORDER BY c.[id];";
        return Promise.resolve().then(() => active() ? exe('DoQuery', { sql: sql }) : null).then((result) => {
          if (!active()) return contacts;
          if (!result || result.ok !== true) throw new Error(result && result.msg || 'No se pudo confirmar la consulta de contactos.');
          const rows = responseRows(result);
          if (!rows.every((contact) => contact && Number.isSafeInteger(Number(contact.id)) && Number(contact.id) > 0
            && typeof contact.nationalId === 'string' && unique.slice(offset, offset + 200).indexOf(contact.nationalId) >= 0)) {
            throw new Error('La consulta devolvió contactos con datos no válidos. No se publicaron resultados parciales.');
          }
          rows.forEach((contact) => contacts.push(contact));
          return readChunk(offset + 200);
        });
      };
      return readChunk(0);
    })).then((contacts) => {
      if (!active()) return;
      const byNumber = new Map();
      contacts.forEach((contact) => {
        if (!byNumber.has(contact.nationalId)) byNumber.set(contact.nationalId, []);
        byNumber.get(contact.nationalId).push(contact);
      });
      const rows = [];
      const text = (value) => value == null || String(value).trim() === '' ? '—' : String(value).trim();
      numbers.forEach((number, index) => {
        const matches = byNumber.get(number) || [];
        if (!matches.length) rows.push({ key: String(index), values: [number, 'No Existe', 'No Existe', 'No Existe', 'No Existe', 'No Existe'] });
        matches.forEach((contact) => {
          const name = ['name', 'middleName', 'surname1', 'surname2'].map((field) => String(contact[field] || '').trim()).filter(Boolean).join(' ');
          const person = contact.isPerson === true || contact.isPerson === 1;
          const identification = person ? (String(contact.idType || '').trim().toUpperCase() === 'PAS' ? contact.passport : contact.cnp) : contact.nif;
          rows.push({ key: index + '-' + contact.id, values: [number, String(contact.id), text(name), text(identification), cobisDate(contact.created), cobisDate(contact.birth)] });
        });
      });
      session.rows = rows;
      session.complete = true;
      updateCobis({ rows: rows, complete: true });
    }).catch((error) => {
      if (active()) updateCobis({ error: error && error.message || 'No se pudieron validar los números COBIS.' });
    }).then(() => { if (active()) { session.busy = false; updateCobis({ busy: false }); } });
  };
  const exportCobis = () => {
    const session = cobisRef.current;
    if (!mountedRef.current || !session.open || session.busy || session.exporting || !session.complete) return Promise.resolve();
    session.exporting = true;
    const active = () => mountedRef.current && session === cobisRef.current && session.open;
    updateCobis({ exporting: true, error: '' });
    return ensureXlsx().then((library) => {
      if (!active()) return;
      const sheet = library.utils.aoa_to_sheet([cobisHeaders].concat(session.rows.map((row) => row.values)));
      const workbook = library.utils.book_new();
      library.utils.book_append_sheet(workbook, sheet, 'Validación COBIS');
      return library.writeFile(workbook, 'validacion-numeros-cobis.xlsx', { bookType: 'xlsx', compression: true });
    }).catch((error) => { if (active()) updateCobis({ error: error && error.message || 'No se pudo exportar a Excel.' }); })
      .then(() => { if (active()) { session.exporting = false; updateCobis({ exporting: false }); } });
  };
  const uploadFile = () => {
    if (!mountedRef.current || uploadBusyRef.current || templateBusyRef.current || uploadUncertainRef.current) return Promise.resolve();
    const file = fileRef.current;
    const product = productRef.current;
    if (!file || !/\.xlsx$/i.test(file.name || '')) { update({ error: 'Seleccione un archivo .xlsx con datos.' }); return Promise.resolve(); }
    uploadBusyRef.current = true;
    requestRef.current++;
    let submitted = false, rejected = false;
    update({ uploading: true, loading: false, error: '', notice: '' });
    return Promise.resolve().then(() => {
      if (!mountedRef.current) return null;
      return exe('RepoImportConfig', { operation: 'GET', filter: configFilter(product) });
    }).then((result) => {
      if (!mountedRef.current) return null;
      const configs = configRows(result, product);
      const config = configs[0];
      const id = Number(config.id || config.Id);
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error('La configuración de carga no tiene un identificador válido.');
      return ensureXlsx().then((library) => new Promise((resolve, reject) => {
        if (!mountedRef.current) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('No se pudo leer el archivo Excel.'));
        reader.onabort = () => reject(new Error('Se canceló la lectura del archivo Excel.'));
        reader.readAsArrayBuffer(file);
      }).then((buffer) => {
        if (!mountedRef.current) return null;
        const rows = uploadRows(buffer, config.jMappings, library);
        const active = () => mountedRef.current && product === productRef.current && file === fileRef.current;
        if (!active()) throw new Error('La selección cambió; vuelva a cargar el archivo.');
        submitted = true;
        return exe('RepoBatch', { operation: 'ADD', entity: {
          importConfigId: id, name: file.name, processingType: 0, records: rows.length, jData: JSON.stringify(rows)
        } });
      }));
    }).then((result) => {
      if (!mountedRef.current) return;
      if (!result || result.ok !== true) {
        rejected = !!result && result.ok === false;
        throw new Error(result && result.msg || 'No se pudo confirmar la creación del lote.');
      }
      fileRef.current = null;
      update({ file: null, notice: 'Lote creado. La carga no se ha ejecutado.' });
      return loadBatches(1);
    }).catch((error) => {
      if (!mountedRef.current) return;
      const uncertain = submitted && !rejected;
      uploadUncertainRef.current = uncertain;
      update({ uploadUncertain: uncertain, error: (error && error.message || 'No se pudo cargar el archivo.')
        + (uncertain ? ' La solicitud pudo haber sido recibida. Consulte las cargas antes de volver a seleccionar y cargar el archivo.' : '') });
    }).then(() => { uploadBusyRef.current = false; update({ uploading: false }); });
  };
  const downloadTemplate = () => {
    if (!mountedRef.current || templateBusyRef.current || uploadBusyRef.current) return Promise.resolve();
    const product = productRef.current;
    const token = ++templateRequestRef.current;
    const active = () => mountedRef.current && token === templateRequestRef.current && product === productRef.current;
    templateBusyRef.current = true;
    update({ templateLoading: true, error: '' });
    return Promise.resolve().then(() => {
      if (!active()) return null;
      return exe('RepoImportConfig', { operation: 'GET', filter: configFilter(product) });
    }).then((result) => {
      if (!active()) return;
      const configs = configRows(result, product);
      const headers = templateHeaders(configs[0].jMappings);
      return ensureXlsx().then((library) => {
        if (!active()) return;
        const sheet = library.utils.aoa_to_sheet([headers]);
        sheet['!cols'] = headers.map((title) => ({ wch: Math.max(18, title.length + 2) }));
        const workbook = library.utils.book_new();
        library.utils.book_append_sheet(workbook, sheet, 'Carga de reclamos');
        return library.writeFile(workbook, 'plantilla-reclamos-' + product.toLowerCase() + '.xlsx', { bookType: 'xlsx', compression: true });
      });
    }).catch((error) => {
      if (active()) update({ error: error && error.message || 'No se pudo descargar la plantilla.' });
    }).then(() => {
      if (active()) { templateBusyRef.current = false; update({ templateLoading: false }); }
    });
  };
  const validCounters = (batch) => [batch.records, batch.success, batch.error].every((value) => value !== null && value !== ''
    && Number.isSafeInteger(Number(value)) && Number(value) >= 0)
    && Number(batch.success) + Number(batch.error) <= Number(batch.records);
  const executionKey = (batch) => String(batch.importConfigId) + ':' + String(batch.id);
  const readyToExecute = (batch) => batch && Number.isSafeInteger(Number(batch.id)) && Number(batch.id) > 0
    && batch.launched === null && (batch.status === null || ['CREATED', 'READY'].indexOf(String(batch.status).toUpperCase()) >= 0)
    && validCounters(batch) && Number(batch.records) > 0 && Number(batch.success) === 0 && Number(batch.error) === 0;
  const canExecute = (batch) => readyToExecute(batch) && !executionRef.current[executionKey(batch)];
  const isProcessing = (batch) => ['PENDING', 'QUEUED', 'RUNNING', 'PROCESSING', 'IN_PROGRESS', 'IN PROGRESS', 'EXECUTING'].indexOf(String(batch.status).toUpperCase()) >= 0;
  const completionLabel = (batch) => String(batch.status || '').toUpperCase() === 'FINISHED' ? 'Finalizado'
    : isProcessing(batch) && validCounters(batch) && Number(batch.records) > 0
      ? Math.floor((Number(batch.success) + Number(batch.error)) * 100 / Number(batch.records)) + '%' : '—';
  const progressPresentation = (batch) => {
    if (String(batch.status || '').toUpperCase() === 'FINISHED') return { percent: 100, color: '#52c41a' };
    if (isProcessing(batch) && validCounters(batch) && Number(batch.records) > 0) {
      return { percent: Math.floor((Number(batch.success) + Number(batch.error)) * 100 / Number(batch.records)), color: '#1890ff' };
    }
    if (readyToExecute(batch)) return { percent: 0, color: '#ff4d4f' };
    return { percent: null, color: '#bfbfbf' };
  };
  const renderProgress = (batch) => {
    const progress = progressPresentation(batch);
    if (progress.percent === null) return '—';
    return React.createElement(Progress, { percent: progress.percent, size: 'small', status: 'normal',
      strokeColor: progress.color, format: (percent) => percent + '%' });
  };
  const freshBatch = (selected, product, active) => {
    let configId;
    return Promise.resolve().then(() => {
      if (!active()) return null;
      return exe('RepoImportConfig', { operation: 'GET', filter: configFilter(product) });
    }).then((result) => {
      if (!active()) return null;
      const configs = configRows(result, product);
      configId = Number(configs[0].id || configs[0].Id);
      if (!Number.isSafeInteger(configId) || configId <= 0 || configId !== Number(selected.importConfigId)) throw new Error('El lote no corresponde al tipo de carga seleccionado.');
      return exe('RepoBatch', { operation: 'GET', filter: 'id = ' + Number(selected.id) + ' and importConfigId = ' + configId, page: 0, size: 1 });
    }).then((result) => {
      if (!active()) return null;
      const rows = responseRows(result);
      if (rows.length !== 1 || Number(rows[0].id) !== Number(selected.id) || Number(rows[0].importConfigId) !== configId) throw new Error('No se encontró el lote seleccionado.');
      return rows[0];
    });
  };
  const mergeBatch = (batch) => {
    listedBatchesRef.current = listedBatchesRef.current.map((row) => executionKey(row) === executionKey(batch) ? batch : row);
    if (selectedBatchRef.current && executionKey(selectedBatchRef.current) === executionKey(batch)) selectedBatchRef.current = batch;
    update({ rows: listedBatchesRef.current });
  };
  const requestExecution = (selected) => {
    if (!mountedRef.current || uploadBusyRef.current || !canExecute(selected)
      || !listedBatchesRef.current.some((row) => executionKey(row) === executionKey(selected))) return;
    const key = executionKey(selected), product = productRef.current, token = requestRef.current;
    const active = () => mountedRef.current && product === productRef.current && token === requestRef.current;
    executionRef.current[key] = 'confirming';
    update({ error: '', notice: '' });
    Modal.confirm({ title: 'Ejecutar lote ' + selected.id, className: 'bulk-claims-confirm',
      content: 'Esta operación procesará los registros y puede crear reclamos. Confirme que el archivo contiene datos válidos. No ejecute archivos con datos ficticios de prueba.',
      okText: React.createElement('span', null, React.createElement(ActionIcon, { name: 'play' }), 'Ejecutar'),
      cancelText: React.createElement('span', null, React.createElement(ActionIcon, { name: 'close' }), 'Cancelar'),
      okButtonProps: { className: 'bulk-claims-action bulk-claims-execute' },
      cancelButtonProps: { className: 'bulk-claims-action' },
      onCancel: () => { if (executionRef.current[key] === 'confirming') { delete executionRef.current[key]; update({}); } },
      onOk: () => {
        if (executionRef.current[key] !== 'confirming') return Promise.resolve();
        if (!active()) { delete executionRef.current[key]; return Promise.resolve(); }
        executionRef.current[key] = 'checking';
        let dispatched = false;
        return freshBatch(selected, product, active).then((batch) => {
          if (!active()) return null;
          mergeBatch(batch);
          if (!readyToExecute(batch)) throw new Error('El lote ya no está disponible para ejecutar.');
          dispatched = true;
          executionRef.current[key] = 'submitted';
          return exe('DoBatch', { batchId: Number(batch.id) });
        }).then((result) => {
          if (!dispatched) { delete executionRef.current[key]; return; }
          if (!result || result.ok !== true) throw new Error(result && result.msg || 'Respuesta de ejecución no confirmada.');
          if (active()) update({ notice: 'Lote ' + selected.id + ' enviado a procesamiento.' });
        }).catch((error) => {
          if (dispatched) executionRef.current[key] = 'uncertain';
          else delete executionRef.current[key];
          if (active()) update({ error: (error && error.message || 'No se pudo ejecutar el lote.')
            + (dispatched ? ' No vuelva a ejecutarlo: confirme el resultado con el administrador antes de reintentar.' : '') });
        }).then(() => { if (active()) { update({}); return pollBatches(); } });
      }
    });
  };
  const pollBatches = () => {
    if (!mountedRef.current || pollBusyRef.current || uploadBusyRef.current || document.visibilityState === 'hidden') return Promise.resolve();
    const product = productRef.current, token = requestRef.current;
    const active = () => mountedRef.current && product === productRef.current && token === requestRef.current;
    const rows = listedBatchesRef.current.filter((row) => isProcessing(row)
      || (['submitted', 'uncertain'].indexOf(executionRef.current[executionKey(row)]) >= 0 && String(row.status).toUpperCase() !== 'FINISHED'));
    if (!rows.length) return Promise.resolve();
    pollBusyRef.current = true;
    return Promise.all(rows.map((row) => freshBatch(row, product, active).then((fresh) => {
      if (!active()) return null;
      return exe('SetBatchResults', { batchId: Number(fresh.id) }).then((result) => {
        if (!result || result.ok === false) throw new Error(result && result.msg || 'No se pudo actualizar el avance.');
        return freshBatch(row, product, active);
      });
    }).then((fresh) => {
      if (!active() || !fresh) return;
      mergeBatch(fresh);
      if (detailRef.current && executionKey(detailRef.current) === executionKey(fresh) && !exportBusyRef.current) return showDetail(fresh, true);
    }).catch((error) => {
      if (active()) update({ error: error && error.message || 'No se pudo actualizar el avance. Presione Actualizar.' });
    }))).then(() => { pollBusyRef.current = false; });
  };
  const statusPresentation = (batch) => {
    const raw = batch.status == null ? '' : String(batch.status).trim();
    const status = raw.toUpperCase();
    if (status === 'FINISHED') return { label: 'Finalizado', color: 'green' };
    if (status === 'PENDING' || status === 'QUEUED' || (batch.status === null && batch.launched === null)) {
      return { label: 'Pendiente', color: 'red' };
    }
    if (['RUNNING', 'PROCESSING', 'IN_PROGRESS', 'IN PROGRESS', 'EXECUTING'].indexOf(status) >= 0) {
      return { label: 'En proceso', color: 'blue' };
    }
    return { label: raw || '—', color: undefined };
  };
  const countersInconsistent = (batch) => [batch.records, batch.success, batch.error].every((value) => value !== null && value !== '' && Number.isFinite(Number(value)))
    && Number(batch.success) + Number(batch.error) > Number(batch.records);
  React.useEffect(() => {
    mountedRef.current = true;
    loadConfigs();
    const schedule = () => {
      if (!mountedRef.current) return;
      pollTimerRef.current = window.setTimeout(() => { pollBatches().then(schedule); }, 4000);
    };
    schedule();
    return () => {
      mountedRef.current = false;
      window.clearTimeout(pollTimerRef.current);
      detailRequestRef.current++;
      detailRef.current = null;
      exportBusyRef.current = false;
      requestRef.current++;
      templateRequestRef.current++;
      templateBusyRef.current = false;
    };
  }, []);
  const display = value => value === null || value === undefined || value === '' ? '—' : String(value);
  const date = value => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? display(value) : parsed.toLocaleString('es-NI');
  };
  const columns = [
    { title: 'Lote', dataIndex: 'id', width: 110 },
    { title: 'Nombre del lote', dataIndex: 'name', width: 250, render: display },
    { title: 'Fecha de carga', dataIndex: 'created', width: 175, render: date },
    { title: 'Estado', dataIndex: 'status', width: 160, render: (_, batch) => {
      const status = statusPresentation(batch);
      return <Tag color={status.color}>{status.label}</Tag>;
    } },
    { title: 'Registros', dataIndex: 'records', width: 90, align: 'center', render: value => <span className="bulk-claims-count-records">{display(value)}</span> },
    { title: 'Exitosos', dataIndex: 'success', width: 90, align: 'center', render: value => <span className="bulk-claims-count-success">{display(value)}</span> },
    { title: 'Con error', dataIndex: 'error', width: 90, align: 'center', render: value => <span className="bulk-claims-count-error">{display(value)}</span> },
    { title: 'Avance', key: 'progress', width: 180, render: (_, batch) => <div>{renderProgress(batch)}{countersInconsistent(batch) && <div>Contadores inconsistentes</div>}</div> }
  ];
  const resultColumns = [{ title: 'Fila', dataIndex: 'line', width: 75, fixed: 'left' },
    { title: 'Estado', dataIndex: 'resultLabel', width: 130, render: (_, row) => <Tag color={row.resultColor}>{row.resultLabel}</Tag> },
    { title: 'Mensaje del proceso', dataIndex: 'resultMessage', width: 340,
      render: (value) => <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{display(value)}</div> }].concat(
    state.detail ? state.detail.headers.map((title, index) => ({ title: title, key: 'column-' + index, width: 180,
      render: (_, row) => display(row.values[index]) })) : []);
  const selectedConfig = state.configs.find((config) => String(config.id || config.Id) === String(state.product));
  const selectedConfigName = selectedConfig ? selectedConfig.name : '—';
  return (
    <div className="bulk-claims-shell">
      <style>{`
        .bulk-claims-shell, .bulk-claims-detail { color:#1e293b; font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
        .bulk-claims-shell { width:100%; min-height:calc(100dvh - 72px); padding:4px; box-sizing:border-box; display:flex; flex-direction:column; background:#f4f6fa; }
        .bulk-claims-shell *, .bulk-claims-detail * { box-sizing:border-box; }
        .bulk-claims-shell > .bulk-claims-card { flex:1 1 auto; display:flex; flex-direction:column; min-width:0; border:1px solid #aebdcd; border-radius:8px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
        .bulk-claims-shell .bulk-claims-card > .ant-card-head { flex:0 0 auto; min-height:50px; padding:2px 8px 4px; background:#f4f6fa; border-bottom:2px solid #1e4b8f; }
        .bulk-claims-shell .bulk-claims-card > .ant-card-head .ant-card-head-title { padding:6px 0; }
        .bulk-claims-shell .bulk-claims-card > .ant-card-body { flex:1 1 auto; min-width:0; padding:4px; display:flex; flex-direction:column; }
        .bulk-claims-title { display:flex; align-items:center; gap:12px; color:#15356b; font-size:17px; font-weight:700; letter-spacing:-.01em; line-height:1.3; }
        .bulk-claims-title-mark { width:6px; height:30px; flex:0 0 6px; border-radius:3px; background:#1e4b8f; }
        .bulk-claims-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; min-height:32px; margin:4px 0; padding:4px; color:#fff; background:#15356b; border-radius:8px; }
        .bulk-claims-action.ant-btn { height:32px; padding:0 15px; border-radius:4px; font-size:14px; font-weight:500; box-shadow:none; background:#fff; border-color:#d9d9d9; color:#262626; }
        .bulk-claims-action.ant-btn:not([disabled]):hover, .bulk-claims-action.ant-btn:not([disabled]):focus { border-color:#1890ff; color:#1890ff; }
        .bulk-claims-action.ant-btn-primary { background:#1890ff; border-color:#1890ff; color:#fff; }
        .bulk-claims-action.ant-btn-primary:not([disabled]):hover, .bulk-claims-action.ant-btn-primary:not([disabled]):focus { background:#147bd1; border-color:#147bd1; color:#fff; }
        .bulk-claims-action.bulk-claims-upload { background:#315f8f; border-color:#264d75; color:#fff; }
        .bulk-claims-action.bulk-claims-upload:not([disabled]):hover, .bulk-claims-action.bulk-claims-upload:not([disabled]):focus { background:#264d75; border-color:#1f4163; color:#fff; }
        .bulk-claims-action.bulk-claims-execute, .bulk-claims-action.bulk-claims-export { background:#60b13d; border-color:#4f9336; color:#fff; }
        .bulk-claims-action.bulk-claims-execute:not([disabled]):hover, .bulk-claims-action.bulk-claims-execute:not([disabled]):focus, .bulk-claims-action.bulk-claims-export:not([disabled]):hover, .bulk-claims-action.bulk-claims-export:not([disabled]):focus { background:#4f9336; border-color:#3f7d2c; color:#fff; }
        .bulk-claims-action.ant-btn[disabled], .bulk-claims-action.ant-btn[disabled]:hover { background:#f1f5f9; border-color:#aebdcd; color:#526174; opacity:1; }
        .bulk-claims-action-icon { display:inline-flex; align-items:center; justify-content:center; width:1em; height:1em; margin-right:6px; vertical-align:middle; line-height:1; }
        .bulk-claims-action.ant-btn-loading .bulk-claims-action-icon { display:none; }
        .bulk-claims-shell fieldset { flex:0 0 auto; min-width:0; padding:4px 8px; border:1px solid #aebdcd; border-radius:8px; margin:4px 0; }
        .bulk-claims-shell legend { width:auto; margin:0; padding:0 6px; color:#15356b; font-size:12.5px; font-weight:700; line-height:1.4; }
        .bulk-claims-shell .ant-form-item { display:flex; align-items:center; margin-bottom:5px; min-height:32px; }
        .bulk-claims-shell .ant-form-item-label { flex:0 0 125px; width:125px; padding:0 10px 0 0; text-align:left; line-height:26px; }
        .bulk-claims-shell .ant-form-item-label > label { height:auto; color:#64748b; font-size:12px; font-weight:500; }
        .bulk-claims-shell .ant-form-item-control-wrapper, .bulk-claims-shell .ant-form-item-control { flex:1 1 auto; min-width:0; line-height:26px; }
        .bulk-claims-shell .ant-select { width:100%; font-size:12px; }
        .bulk-claims-upload-fields { display:flex; flex-wrap:wrap; align-items:flex-start; gap:12px; }
        .bulk-claims-upload-type { flex:0 1 445px; min-width:0; max-width:100%; }
        .bulk-claims-upload-file { flex:1 1 360px; min-width:0; max-width:100%; }
        .bulk-claims-shell .ant-select-selector, .bulk-claims-shell .ant-select-selection { color:#1e293b; background:#fff; border-color:#b8c4d1!important; border-radius:6px; }
        .bulk-claims-shell .ant-alert { margin-bottom:4px; }
        .bulk-claims-shell .ant-table, .bulk-claims-detail .ant-table { color:#183153; font-size:12px; }
        .bulk-claims-shell .ant-table-thead > tr > th, .bulk-claims-detail .ant-table-thead > tr > th { padding:6px 8px; background:#bfbfbf; color:#262626; border-bottom:1px solid #cbd1d8; font-weight:700; white-space:nowrap; }
        .bulk-claims-shell .ant-table-tbody > tr > td, .bulk-claims-detail .ant-table-tbody > tr > td { padding:6px 8px; border-bottom:1px solid #e2e8f0; }
        .bulk-claims-shell .ant-table-tbody > tr:hover > td, .bulk-claims-detail .ant-table-tbody > tr:hover > td { background:#f5f9ff; }
        .bulk-claims-shell .ant-table-tbody > tr.bulk-claims-selected > td, .bulk-claims-shell .ant-table-tbody > tr.bulk-claims-selected:hover > td { background:#b7d5ff; }
        .bulk-claims-selectable-grid .ant-table-tbody > tr:not(.ant-table-placeholder) > td { cursor:pointer; }
        .bulk-claims-grid { flex:1 1 auto; min-width:0; border:1px solid #aebdcd; border-radius:8px; overflow:hidden; background:#fff; }
        .bulk-claims-file { display:inline-block; max-width:100%; overflow-wrap:anywhere; color:#64748b; font-size:12px; }
        .bulk-claims-hint { margin:4px 0; color:#64748b; font-size:12px; }
        .bulk-claims-section { flex:0 0 auto; display:flex; justify-content:space-between; align-items:center; gap:8px; margin:4px 0; padding:4px 8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fbff; }
        .bulk-claims-section h3 { margin:0; color:#15356b; font-size:12.5px; font-weight:700; }
        .bulk-claims-detail { max-width:100vw; }
        .bulk-claims-detail .ant-drawer-header { background:#f4f6fa; border-bottom:2px solid #1e4b8f; }
        .bulk-claims-detail .ant-drawer-title { color:#15356b; font-size:17px; font-weight:700; }
        .bulk-claims-detail .ant-drawer-body { padding:8px; }
        .bulk-claims-detail .ant-modal-body { padding:16px; max-height:calc(100vh - 140px); overflow-y:auto; }
        .bulk-claims-detail .ant-modal-header { background:#f4f6fa; border-bottom:2px solid #1e4b8f; }
        .bulk-claims-detail .bulk-claims-cobis-toolbar { background:#e6f7ff; border:1px solid #91caff; border-radius:0; padding:4px 0; margin:-16px -16px 12px; box-shadow:0 1px 3px rgba(22,119,255,.12); }
        .bulk-claims-detail .bulk-claims-cobis-toolbar > .ant-space { margin-left:4px; }
        .bulk-claims-detail .bulk-claims-cobis-toolbar .ant-btn { border-radius:6px; font-size:13px; }
        .bulk-claims-cobis-grid .ant-table-body { overflow-x:auto !important; overflow-y:auto !important; scrollbar-gutter:stable; }
        .bulk-claims-cobis-grid .ant-table-thead > tr > th { white-space:normal; line-height:1.25; }
        .bulk-claims-cobis-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .bulk-claims-cobis-missing { color:#d32029; }
        .bulk-claims-count-records { color:#1677ff; font-weight:700; }
        .bulk-claims-count-success { color:#389e0d; font-weight:700; }
        .bulk-claims-count-error { color:#d32029; font-weight:700; }
        .bulk-claims-detail .bulk-claims-summary-panel { padding:8px; border:1px solid #cbd5e1; }
        .bulk-claims-detail .bulk-claims-results-actions { display:flex; flex-wrap:wrap; gap:8px; margin:12px 0 16px; }
        .bulk-claims-detail dl { display:grid; grid-template-columns:125px minmax(0,1fr); gap:5px 10px; }
        .bulk-claims-detail dt { color:#64748b; font-size:12px; font-weight:500; }
        .bulk-claims-detail dd { margin:0; overflow-wrap:anywhere; }
        .bulk-claims-summary { margin:8px 0; }
        .bulk-claims-summary .ant-col > div { border:1px solid #cbd5e1; border-radius:6px; padding:8px; background:#f9fbfd; color:#64748b; font-size:12px; }
        .bulk-claims-summary strong { display:block; color:#1e293b; font-size:17px; }
        @media (max-width:575px) { .bulk-claims-title { font-size:16px; } .bulk-claims-shell .ant-form-item { display:block; } .bulk-claims-shell .ant-form-item-label { width:auto; padding:0 0 3px; } }
      `}</style>
      <Card className="bulk-claims-card" size="small" title={<div className="bulk-claims-title"><span className="bulk-claims-title-mark" aria-hidden="true" />Carga masiva de reclamos</div>}>
        {state.error && <div role="alert"><Alert showIcon type="error" message="No se pudo completar la operación" description={state.error} /></div>}
        {state.notice && <div role="status"><Alert showIcon type="success" message={state.notice} /></div>}
        <fieldset>
          <legend>Carga de archivo</legend>
          <Form layout="horizontal" size="small">
            <div className="bulk-claims-upload-fields">
              <div className="bulk-claims-upload-type">
                <Form.Item label="Tipo de Carga">
                  <Select className="bulk-claims-load-type" style={{ width: 320, maxWidth: '100%' }} size="small" aria-label="Tipo de Carga" value={state.product} loading={state.configsLoading} disabled={state.uploading || state.configsLoading || !state.configs.length} onChange={selectProduct}>
                    {state.configs.map((config) => <Select.Option key={config.id || config.Id} value={String(config.id || config.Id)}>{config.name}</Select.Option>)}
                  </Select>
                </Form.Item>
              </div>
              <div className="bulk-claims-upload-file">
                <Form.Item label="Archivo de carga">
                  <Space wrap>
                    <Upload accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={state.uploading} beforeUpload={(file) => { selectFile(file); return false; }} showUploadList={false} multiple={false}>
                      <Button className="bulk-claims-action" disabled={state.uploading}><ActionIcon name="search" />Seleccionar archivo</Button>
                    </Upload>
                    <span className="bulk-claims-file" role="status">{state.file ? state.file.name : 'Ningún archivo seleccionado'}</span>
                    {state.file && <Button className="bulk-claims-action" disabled={state.uploading} onClick={() => selectFile(null)}><ActionIcon name="close" />Quitar archivo</Button>}
                  </Space>
                </Form.Item>
              </div>
            </div>
          </Form>
          <div className="bulk-claims-toolbar">
            <Button className="bulk-claims-action" loading={state.templateLoading} disabled={state.templateLoading || state.uploading} onClick={downloadTemplate}><ActionIcon name="download" />Descargar plantilla</Button>
            <Button type="primary" className="bulk-claims-action bulk-claims-upload" loading={state.uploading} disabled={!state.file || state.uploading || state.templateLoading || state.uploadUncertain} onClick={uploadFile}><ActionIcon name="upload" />Cargar archivo</Button>
            <Button className="bulk-claims-action" onClick={openCobis}><ActionIcon name="search" />Validar números COBIS</Button>
          </div>
          <p className="bulk-claims-hint">Use la plantilla del producto seleccionado. Cargar el archivo crea el lote; la ejecución se realiza por separado.</p>
        </fieldset>
        <div className="bulk-claims-section">
          <h3>Cargas activas · {selectedConfigName}</h3>
          <Space>
            <Button type="primary" className="bulk-claims-action" disabled={!state.selectedBatchId || state.loading || state.uploading} onClick={showSelectedDetail}><ActionIcon name="view" />Ver detalles</Button>
            <Button type="primary" className="bulk-claims-action bulk-claims-execute" disabled={state.loading || state.uploading || !canExecute(selectedBatchRef.current)} onClick={() => requestExecution(selectedBatchRef.current)}><ActionIcon name="play" />Ejecutar</Button>
            <Button className="bulk-claims-action" loading={state.loading} disabled={state.loading || state.uploading} onClick={() => loadBatches(state.current)}><ActionIcon name="refresh" />Actualizar</Button>
          </Space>
        </div>
        <div className="bulk-claims-grid">
        <Table className="bulk-claims-selectable-grid" size="small" bordered rowKey={(row) => String(row.id)} columns={columns} dataSource={state.rows} loading={state.loading}
          rowSelection={{ type: 'radio', selectedRowKeys: state.selectedBatchId ? [state.selectedBatchId] : [],
            onChange: (_, rows) => selectBatch(rows[0]), getCheckboxProps: () => ({ disabled: state.loading || state.uploading }) }}
          rowClassName={(row) => String(row.id) === state.selectedBatchId ? 'bulk-claims-selected' : ''}
          onRow={(row) => ({ onClick: () => { if (!state.loading && !state.uploading) selectBatch(row); } })}
          scroll={{ x: 1400 }} pagination={state.total === null ? false : { current: state.current, total: state.total, pageSize: 10, showSizeChanger: false, showTotal: (total) => total + ' lotes' }}
          onChange={(page) => loadBatches(page.current)}
          locale={{ emptyText: state.loading ? 'Consultando cargas…' : state.loaded ? 'No hay cargas para mostrar.' : 'No se pudieron consultar las cargas. Presione Actualizar.' }} />
        {state.total === null && <Space style={{ padding: 8 }}>
          <Button size="small" disabled={state.loading || state.current <= 1} onClick={() => loadBatches(state.current - 1)}>Anterior</Button>
          <span>Página {state.current}</span>
          <Button size="small" disabled={state.loading || !state.hasNext} onClick={() => loadBatches(state.current + 1)}>Siguiente</Button>
        </Space>}
        </div>
      </Card>
      <Modal title="Validar números COBIS" visible={state.cobis.open} width={1100} centered footer={null}
        className="bulk-claims-detail" style={{ maxWidth: 'calc(100vw - 32px)' }} onCancel={closeCobis} destroyOnClose>
        {state.cobis.error && <Alert showIcon type="error" message={state.cobis.error} style={{ marginBottom: 16 }} />}
        <div className="bulk-claims-results-actions bulk-claims-cobis-toolbar">
          <Space wrap>
            <Upload accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" showUploadList={false}
              beforeUpload={selectCobisFile} disabled={state.cobis.busy || state.cobis.exporting}>
              <Button className="bulk-claims-action" disabled={state.cobis.busy || state.cobis.exporting}><ActionIcon name="search" />Seleccionar archivo</Button>
            </Upload>
            <span>{state.cobis.file ? state.cobis.file.name : 'Ningún archivo seleccionado'}</span>
            {state.cobis.file && <Button className="bulk-claims-action" disabled={state.cobis.busy || state.cobis.exporting} onClick={() => selectCobisFile(null)}><ActionIcon name="close" />Quitar archivo</Button>}
            <Button type="primary" className="bulk-claims-action" loading={state.cobis.busy} disabled={!state.cobis.file || state.cobis.busy || state.cobis.exporting} onClick={lookupCobis}><ActionIcon name="search" />Validar</Button>
            <Button className="bulk-claims-action bulk-claims-export" loading={state.cobis.exporting} disabled={!state.cobis.complete || state.cobis.busy || state.cobis.exporting} onClick={exportCobis}><ActionIcon name="download" />Exportar a Excel</Button>
          </Space>
        </div>
        <Table className="bulk-claims-cobis-grid" size="small" bordered tableLayout="fixed" rowKey="key" loading={state.cobis.busy} dataSource={state.cobis.rows}
          columns={cobisHeaders.map((title, index) => {
            const compact = index === 0 || index === 1 || index === 4 || index === 5;
            const width = index === 0 ? 90 : index === 1 ? 70 : index === 2 ? 260 : index === 3 ? 165 : 130;
            return {
              title: title,
              key: String(index),
              width: width,
              align: compact ? 'center' : 'left',
              render: (_, row) => {
                const value = display(row.values[index]);
                const className = String(value).trim().toUpperCase() === 'NO EXISTE' ? 'bulk-claims-cobis-missing' : '';
                return index === 2
                  ? <Tooltip title={value}><div className={'bulk-claims-cobis-name ' + className}>{value}</div></Tooltip>
                  : <span className={className}>{value}</span>;
              }
            };
          })}
          scroll={{ x: 975, y: 360 }} pagination={{ pageSize: 25, showSizeChanger: false, showTotal: total => total + ' resultados' }}
          locale={{ emptyText: state.cobis.complete ? 'No hay resultados.' : 'Cargue el archivo y presione Validar.' }} />
      </Modal>
      <Drawer title="Ver detalles" visible={state.detailOpen} width={420} className="bulk-claims-detail"
        keyboard={!state.resultsOpen} maskClosable={!state.resultsOpen} onClose={closeDetail}>
        {state.detailError && <Alert showIcon type="error" message={state.detailError} style={{ marginBottom: 16 }} />}
        {state.detailLoading && <div role="status">Consultando detalle…</div>}
        {!state.detail && !state.detailLoading && !state.detailError && <Alert type="info" message="No hay detalle para mostrar." />}
        {state.detail && <div className="bulk-claims-summary-panel">
          <div className="bulk-claims-section"><h3>Información del lote</h3></div>
          <dl>
            <dt>Lote</dt><dd>{display(state.detail.id)}</dd>
            <dt>Tipo de Carga</dt><dd>{state.detail.product}</dd>
            <dt>Nombre del lote</dt><dd>{display(state.detail.name)}</dd>
            <dt>Fecha de carga</dt><dd>{date(state.detail.created)}</dd>
            <dt>Estado</dt><dd><Tag color={statusPresentation(state.detail).color}>{statusPresentation(state.detail).label}</Tag> {state.detail.status != null && '(' + state.detail.status + ')'}</dd>
            <dt>Avance</dt><dd>{renderProgress(state.detail)}</dd>
          </dl>
          <Row gutter={[12, 12]} className="bulk-claims-summary">
            {[["Registros", "records"], ["Exitosos", "success"], ["Con error", "error"]].map(item =>
              <Col xs={24} sm={8} key={item[1]}><div>{item[0]}<strong>{display(state.detail[item[1]])}</strong></div></Col>)}
          </Row>
          {countersInconsistent(state.detail) && <Alert showIcon type="warning" message="Contadores inconsistentes" description="Los contadores se muestran tal como están registrados en el lote." />}
          <Space wrap>
            <Button type="primary" className="bulk-claims-action" onClick={openResults}><ActionIcon name="detail" />Ver detalle</Button>
            <Button className="bulk-claims-action bulk-claims-export" loading={state.exporting} disabled={state.exporting} onClick={exportDetail}><ActionIcon name="download" />Exportar a Excel</Button>
          </Space>
        </div>}
      </Drawer>
      <Modal title={'Detalle y resultados · Lote ' + (state.detail ? state.detail.id : '')} visible={state.resultsOpen}
        width={1100} centered footer={null} zIndex={1100} className="bulk-claims-detail" style={{ maxWidth: 'calc(100vw - 32px)' }}
        onCancel={closeResults} destroyOnClose>
        {state.detail && <div>
          {state.detailError && <Alert showIcon type="error" message={state.detailError} />}
          <div className="bulk-claims-summary-panel">
            <div className="bulk-claims-section"><h3>{display(state.detail.name)}</h3></div>
            <dl>
              <dt>Tipo de Carga</dt><dd>{state.detail.product}</dd>
              <dt>Estado</dt><dd><Tag color={statusPresentation(state.detail).color}>{statusPresentation(state.detail).label}</Tag></dd>
            </dl>
            <Row gutter={[12, 12]} className="bulk-claims-summary">
              {[["Registros", "records"], ["Exitosos", "success"], ["Con error", "error"]].map(item =>
                <Col xs={24} sm={8} key={item[1]}><div>{item[0]}<strong>{display(state.detail[item[1]])}</strong></div></Col>)}
            </Row>
            {countersInconsistent(state.detail) && <Alert showIcon type="warning" message="Contadores inconsistentes" description="Los contadores se muestran tal como están registrados en el lote." />}
          </div>
          <div className="bulk-claims-results-actions">
            <Button className="bulk-claims-action" onClick={closeResults}><ActionIcon name="close" />Cerrar</Button>
            <Button className="bulk-claims-action bulk-claims-export" loading={state.exporting} disabled={state.exporting} onClick={exportDetail}><ActionIcon name="download" />Exportar a Excel</Button>
          </div>
          <Table size="small" bordered rowKey="key" columns={resultColumns} dataSource={state.detail.rows}
            scroll={{ x: 545 + state.detail.headers.length * 180, y: 360 }} pagination={{ pageSize: 10, showSizeChanger: false, showTotal: total => total + ' registros' }}
            locale={{ emptyText: 'No hay resultados para mostrar.' }} />
          <p className="bulk-claims-hint" style={{ marginTop: 12 }}>Fila indica la posición del registro en el lote. Los datos adicionales conservan los valores guardados por el proceso. “—” indica un dato no disponible.</p>
        </div>}
      </Modal>
    </div>
  );
}
