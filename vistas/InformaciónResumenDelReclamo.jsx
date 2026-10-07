/*
 * @name InformaciónResumenDelReclamo
 * @description Vista de consulta y gestión del resumen de un reclamo.
 * @purpose Mostrar la información principal del reclamo y permitir la ejecución de sus acciones de flujo.
 * @version 1.0.0
 * @created 2026-09-28
 */
() => {
  // Workflow uses the same process, form data and transition commands as the native claim.
  const ClaimWorkflow = React.useMemo(() => function ClaimWorkflow(props) {
    const claim = props.claim;
    const process = claim && claim.Process;
    const [busy, setBusy] = React.useState(false);
    const [failure, setFailure] = React.useState('');
    const [formOpen, setFormOpen] = React.useState(false);
    const [formLoading, setFormLoading] = React.useState(false);
    const [stepsOpen, setStepsOpen] = React.useState(false);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [definition, setDefinition] = React.useState(null);
    const [reason, setReason] = React.useState(null);
    const container = React.useRef(null);
    const renderer = React.useRef(null);
    const active = React.useRef(true);
    const inFlight = React.useRef(false);
    const generation = React.useRef(0);
    const current = React.useRef(props);
    current.current = props;
    const actions = process && process.userActions ? JSON.parse(process.userActions) : [];
    const hasForm = !!(process && process.formId);
    const actionRequired = actions.length > 0;
    const unmet = claim ? (claim.Requirements || []).filter(r => r.type == 3 && !r.response).length : 0;
    const contextCurrent = () => active.current && current.current.isCurrent();
    const showFailure = e => {
      if (contextCurrent()) setFailure(e && e.message || String(e));
    };
    const request = (name, data) => Promise.resolve().then(() => {
      if (!contextCurrent()) throw new Error('El siniestro seleccionado cambió.');
      return exe(name, data);
    }).then(r => {
      if (!r || r.ok !== true) throw new Error(r && r.msg || 'No se confirmó la operación.');
      return r;
    });
    const guard = direction => {
      if (!contextCurrent() || inFlight.current || props.loading) return false;
      if (props.isDirty()) { setFailure('Guarde o descarte los cambios antes de gestionar el workflow.'); return false; }
      if (direction === '_next' && unmet) {
        setFailure('Hay ' + unmet + ' requisitos bloqueantes. Revise los requisitos antes de continuar.');
        return false;
      }
      return true;
    };
    const advance = (direction, userValues) => {
      if (!process || !guard(direction)) return Promise.resolve(false);
      if (direction === '_next' && (actionRequired || hasForm && userValues === undefined)) return Promise.resolve(false);
      const captured = { id: process.id, estadoId: process.estadoId, fEstado: process.fEstado, claimId: claim.id };
      inFlight.current = true; setBusy(true); setFailure('');
      return request('RepoClaim', { operation: 'GET', filter: 'id=' + captured.claimId,
        include: ['Process', 'Process.Pasos', 'Requirements'], size: 1, page: 0 }).then(r => {
        const fresh = r.outData && r.outData[0], p = fresh && fresh.Process;
        if (!contextCurrent()) throw new Error('El siniestro seleccionado cambió.');
        if (!p || p.id !== captured.id || p.estadoId !== captured.estadoId || p.fEstado !== captured.fEstado
          || p.formId !== process.formId || p.userActions !== process.userActions || p.finalizado !== process.finalizado) {
          current.current.reload();
          throw new Error('El workflow cambió. Revise el estado actualizado antes de continuar.');
        }
        if (direction === '_next' && (fresh.Requirements || []).some(r => r.type == 3 && !r.response))
          throw new Error('Hay requisitos bloqueantes pendientes.');
        const data = { procesoId: captured.id, estado: direction };
        if (userValues !== undefined) data.userValues = JSON.stringify(userValues);
        return request('GotoStep', data);
      }).then(() => {
        if (!contextCurrent()) return false;
        setFormOpen(false);
        return current.current.reload().then(() => true);
      }).catch(e => { showFailure(e); return false; }).then(result => {
        inFlight.current = false;
        if (contextCurrent()) setBusy(false);
        return result;
      });
    };
    const openForm = () => {
      if (guard('_next')) { setMenuOpen(false); setFailure(''); setFormOpen(true); }
    };
    const submitForm = () => {
      if (formLoading || !renderer.current || !container.current || !container.current.reportValidity()) return;
      return advance('_next', renderer.current.userData);
    };
    const openSteps = () => {
      setMenuOpen(false); setStepsOpen(true); setFailure('');
      return request('GetDefinitions', { filter: 'id=' + process.definitionId }).then(r => {
        if (!contextCurrent()) return;
        const d = r.outData && r.outData[0];
        if (!d) throw new Error('No se encontró la definición del workflow.');
        const xml = new DOMParser().parseFromString(d.xml, 'application/xml');
        if (xml.getElementsByTagName('parsererror').length) throw new Error('La definición del workflow no es válida.');
        const nodes = Array.prototype.filter.call(xml.getElementsByTagNameNS('*', '*'), n =>
          ['startEvent', 'task', 'userTask', 'manualTask', 'scriptTask', 'businessRuleTask',
            'exclusiveGateway', 'parallelGateway', 'inclusiveGateway', 'endEvent'].indexOf(n.localName) !== -1);
        setDefinition({ name: d.name, nodes: nodes.map(n => ({
          id: n.getAttribute('id'), name: n.getAttribute('name') || n.localName,
          state: n.getAttribute('entityState'), form: n.getAttribute('form')
        })) });
      }).catch(showFailure);
    };
    const loadReason = visible => {
      if (!visible || !process || !process.entityStateReason || reason !== null) return;
      request('RepoEntityStateReason', { operation: 'GET',
        filter: "code='" + String(process.entityStateReason).replace(/'/g, "''") + "'" }).then(r => {
        if (contextCurrent()) setReason(r.outData && r.outData[0] ? r.outData[0].entityStateReason : process.entityStateReason);
      }).catch(showFailure);
    };
    React.useEffect(() => () => { active.current = false; generation.current += 1; }, []);
    React.useEffect(() => {
      generation.current += 1; setFormOpen(false); setDefinition(null); setReason(null); setFailure('');
    }, [process && process.id, process && process.estadoId, process && process.fEstado]);
    React.useEffect(() => {
      if (!process || !process.entryLogic || !contextCurrent()) return;
      try {
        Function(process.entryLogic).call({ exe: exe, process: process,
          message: A.message, notification: A.notification, setDisabledTabs: () => {} });
      } catch (e) { showFailure(e); }
    }, [process && process.id, process && process.entryLogic]);
    React.useEffect(() => {
      if (!formOpen || !process || !process.formId) return;
      const version = ++generation.current;
      let disposed = false;
      const formCurrent = () => !disposed && contextCurrent() && generation.current === version;
      setFormLoading(true); renderer.current = null;
      request('GetForms', { filter: 'id=' + process.formId }).then(r => {
        if (!formCurrent()) return;
        const form = r.outData && r.outData[0], $ = window.jQuery || window.$;
        if (!form || !container.current || !$ || !$.fn.formRender) throw new Error('No se pudo cargar el formulario del workflow.');
        renderer.current = $(container.current).formRender({ container: container.current, formData: form.json });
        if (form.logic) {
          const scopedExe = (name, data, options) => {
            if (!formCurrent()) return Promise.reject(new Error('El formulario ya no está activo.'));
            return exe(name, data, options);
          };
          Function(form.logic).call({
            exe: scopedExe, processId: process.id, message: A.message,
            downloadFile: props.downloadFile,
            loadCatalog: (catalog, element, filter, valueField, displayField) =>
              scopedExe(catalog, { operation: 'GET', filter: filter }).then(r => {
                if (!formCurrent()) return;
                (r.outData || []).forEach(row => $(element).append(
                  $('<option></option>').attr('value', row[valueField || 'id']).text(row[displayField || 'name'])));
              })
          });
        }
      }).catch(e => { if (formCurrent()) { renderer.current = null; showFailure(e); } })
        .then(() => { if (formCurrent()) setFormLoading(false); });
      return () => { disposed = true; renderer.current = null; };
    }, [formOpen, process && process.id, process && process.formId, process && process.estadoId]);
    if (!claim) return null;
    if (!process) return <A.Tag>Sin workflow</A.Tag>;
    const disabled = busy || props.loading;
    const workflowMenu = <div style={{ minWidth: 245 }}>
      {process.progress ? <A.Progress percent={process.progress} size="small" /> : null}
      <A.Button type="link" onClick={() => { if (guard('open')) window.location.hash = '#/activity/' + process.id; }}>Abrir workflow</A.Button>
      <A.Button type="link" onClick={openSteps}>Etapas e historial</A.Button>
      {hasForm && !actionRequired ? <div><A.Button type="link" onClick={openForm}>Formulario requerido</A.Button></div> : null}
      {process.blockedBy ? <div>Bloqueado por el proceso {process.blockedBy}</div> : null}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <A.Button disabled={disabled} loading={busy} onClick={() => advance('_previous')}>Anterior</A.Button>
        <A.Button type="primary" disabled={disabled || hasForm || actionRequired} loading={busy}
          onClick={() => advance('_next')}>Siguiente</A.Button>
      </div>
    </div>;
    return <div className="resumen-workflow" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
      <A.Popover title="Estado del workflow" content={workflowMenu} trigger="click"
        visible={menuOpen} onVisibleChange={setMenuOpen}>
        <A.Button type="link">Flujo de trabajo</A.Button>
      </A.Popover>
      <span className="resumen-process-id">Proceso Id {process.id}</span>
      <A.Popover onVisibleChange={loadReason} content={<A.Descriptions size="small" bordered column={1}>
        <A.Descriptions.Item label="Estado del workflow">{process.estado}</A.Descriptions.Item>
        <A.Descriptions.Item label="Estado del siniestro">{process.entityState}</A.Descriptions.Item>
        <A.Descriptions.Item label="Motivo">{reason || process.entityStateReason || '—'}</A.Descriptions.Item>
      </A.Descriptions>}>
        <A.Tag color={process.finalizado ? 'green' : 'blue'}>{process.estado}</A.Tag>
      </A.Popover>
      {actionRequired ? <A.Tooltip title="El siguiente paso debe ejecutarse mediante la acción indicada">
        <span>{actions.map(action => <A.Tag key={action}>{action}</A.Tag>)}</span>
      </A.Tooltip> : hasForm ? <A.Button loading={busy} disabled={disabled} onClick={openForm}>Siguiente</A.Button>
        : <A.Button type="link" loading={busy} disabled={disabled || process.finalizado} onClick={() => advance('_next')}>Siguiente</A.Button>}
      {failure ? <A.Alert style={{ width: '100%' }} type="error" showIcon message={failure} /> : null}
      <A.Modal title="Formulario del workflow" visible={formOpen} destroyOnClose
        onCancel={() => { if (!busy) setFormOpen(false); }} onOk={submitForm}
        okButtonProps={{ loading: busy, disabled: formLoading }} cancelButtonProps={{ disabled: busy }}>
        <A.Spin spinning={formLoading}><form ref={container} id={'fb-render-claim-workflow-' + claim.id} /></A.Spin>
      </A.Modal>
      <A.Modal title="Etapas e historial del workflow" visible={stepsOpen} width={850} footer={null}
        onCancel={() => setStepsOpen(false)} afterClose={() => setMenuOpen(false)}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }} destroyOnClose>
        <p>{process.nombre} — {process.estado}</p>
        <A.Table size="small" pagination={false} rowKey="id" dataSource={definition ? definition.nodes : []}
          columns={[{ title: 'Etapa', dataIndex: 'name', render: (name, row) => row.id === process.estadoId ? <strong>{name} (actual)</strong> : name },
            { title: 'Estado', dataIndex: 'state' }, { title: 'Formulario', dataIndex: 'form' }]} />
        <h4>Historial</h4>
        <A.Table size="small" pagination={false} rowKey="id" dataSource={process.Pasos || []}
          columns={[{ title: 'Etapa', dataIndex: 'estado' }, { title: 'Estado', dataIndex: 'entityState' },
            { title: 'Entrada', dataIndex: 'fecha' }, { title: 'Salida', dataIndex: 'fechaFin' }]} />
      </A.Modal>
    </div>;
  }, []);
  const Card = A.Card;
  const Collapse = A.Collapse;
  const Panel = Collapse.Panel;
  const Row = A.Row;
  const Col = A.Col;
  const Button = A.Button;
  const Input = A.Input;
  const Select = A.Select;
  const Checkbox = A.Checkbox;
  const DatePicker = A.DatePicker;
  const Alert = A.Alert;
  const Spin = A.Spin;
  const Modal = A.Modal;
  const Popconfirm = A.Popconfirm;
  const TextArea = Input.TextArea;
  const EMPTY_VALUE = '—';
  const EMPTY_SUMMARY = {
    policy: {
      policyNumber: null, lineOfBusiness: null, year: null, certificateNumber: null,
      insured: null, payer: null, branch: null, policyType: null, startDate: null,
      endDate: null, creator: null, status: null, modified: null
    },
    valuation: { reserves: null, payments: null, recoveries: null, expenses: null, balance: null }
  };
  const EMPTY_DETAILS = {
    claimNumber: null, state: null, claimant: null, occurrence: null, notification: null
  };
  const CLAIM_STAGE_OPTIONS = [
    { value: '1', label: 'NOTIFICADO' },
    { value: '2', label: 'VALORACIÓN' },
    { value: '3', label: 'REPARACIÓN' },
    { value: '4', label: 'ANULADO' },
    { value: '5', label: 'RECHAZADO' },
    { value: '6', label: 'REAPERTURA' },
    { value: '7', label: 'FINALIZADO' },
    { value: '8', label: 'COTIZACIÓN RECIBIDA' },
    { value: '9', label: 'DEDUCIBLE RECIBIDO' },
    { value: '10', label: 'ORDEN DE COMPRA EMITIDA' },
    { value: '11', label: 'SOLICITUD DE CHEQUE' },
    { value: '12', label: 'DIFERIDO' },
    { value: '13', label: 'DECLINADO' },
    { value: 'F', label: 'Finalizado' },
    { value: 'R', label: 'Rechazado' }
  ];
  const ADJUSTER_CATALOG_FIELDS = "id, CASE WHEN isPerson = 0 THEN surname2 ELSE name + ' ' + surname1 END name";
  const ADJUSTER_CATALOG_FILTER = "exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'ADJ')";
  const REPOSITORY_CATALOG_GET = {
    operation: 'GET', showColumnsIfEmpty: true, entity: null, bulkJson: null,
    // El repositorio usa size: 0 para devolver el catálogo completo; los eventos
    // RT de CAR quedan fuera de la primera página predeterminada.
    filter: null, include: null, size: 0, page: 0
  };

  const [claimSummary, setClaimSummary] = React.useState(EMPTY_SUMMARY);
  const [claimDetails, setClaimDetails] = React.useState(EMPTY_DETAILS);
  const [activeTab, setActiveTab] = React.useState('general');
  const routeClaimId = () => {
    const hash = window.location.hash || '';
    const path = hash.replace(/^#/, '').split('?')[0];
    let raw = null;
    if (/^\/view\/48\/?$/.test(path)) {
      const params = new URLSearchParams(hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '');
      const values = params.getAll('claimId');
      if (values.length !== 1) return null;
      raw = values[0];
    } else {
      const match = (hash || window.location.pathname || '').match(/(?:^|\/)healthclaim\/(\d+)\/?$/i);
      raw = match ? match[1] : null;
    }
    if (!raw || !/^\d+$/.test(raw)) return null;
    const parsed = Number(raw);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  };
  const [claimId, setClaimId] = React.useState(routeClaimId);
  const [newClaimModalOpen, setNewClaimModalOpen] = React.useState(false);
  const [newClaimLoading, setNewClaimLoading] = React.useState(false);
  const [newClaimError, setNewClaimError] = React.useState('');
  const [newClaimRows, setNewClaimRows] = React.useState([]);
  const [newClaimSelectedPolicy, setNewClaimSelectedPolicy] = React.useState(null);
  const [newClaimMode, setNewClaimMode] = React.useState(false);
  const [newClaimValidation, setNewClaimValidation] = React.useState({});
  // Bumped on every policy selection so the event catalogs reload even when the same policy row is selected again.
  const [newClaimCatalogSeq, setNewClaimCatalogSeq] = React.useState(0);
  const newClaimModeRef = React.useRef(false);
  const [newClaimLobOptions, setNewClaimLobOptions] = React.useState([]);
  const [newClaimProductOptions, setNewClaimProductOptions] = React.useState([]);
  const [newClaimProductLoading, setNewClaimProductLoading] = React.useState(false);
  const newClaimProductRequest = React.useRef(0);
  const [newClaimPolicyPage, setNewClaimPolicyPage] = React.useState(1);
  const [newClaimPolicyTotal, setNewClaimPolicyTotal] = React.useState(0);
  const [newClaimFilters, setNewClaimFilters] = React.useState({
    code: '', holderId: null, insuredId: null, lob: '', product: '', dates: null
  });
  const newClaimCodeInput = React.useRef(null);
  const [newClaimContactOptions, setNewClaimContactOptions] = React.useState({ holder: [], insured: [] });
  const [newClaimContactLoading, setNewClaimContactLoading] = React.useState({ holder: false, insured: false });
  const newClaimContactTimers = React.useRef({ holder: null, insured: null });
  const newClaimContactRequests = React.useRef({ holder: 0, insured: 0 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [valuationWarning, setValuationWarning] = React.useState('');
  const shellRef = React.useRef(null);
  const mountedRef = React.useRef(true);
  const requestRef = React.useRef(0);
  const currentClaimRef = React.useRef(null);
  const draftRef = React.useRef(null);
  const dirtyRef = React.useRef(false);
  const savingRef = React.useRef(false);
  const touchedRef = React.useRef({});
  const routeRef = React.useRef(window.location.href);
  const [draft, setDraft] = React.useState(null);
  const [editable, setEditable] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const stageSelectionRef = React.useRef(null);
  const stageSavingRef = React.useRef(false);
  const stageOperationRef = React.useRef(0);
  const pendingStageConfirmationRef = React.useRef(null);
  const [stageSelection, setStageSelection] = React.useState(null);
  const [stageSaving, setStageSaving] = React.useState(false);
  const adjusterLoadingRef = React.useRef(false);
  const [adjusterLoading, setAdjusterLoading] = React.useState(false);
  const adjusterOptionsRef = React.useRef([]);
  const [adjusterOptions, setAdjusterOptions] = React.useState([]);
  const claimantOptionsRef = React.useRef([]);
  const [claimantOptions, setClaimantOptions] = React.useState([]);
  const claimantSearchOperationRef = React.useRef(0);
  const claimantSearchTimerRef = React.useRef(null);
  const [claimantSearching, setClaimantSearching] = React.useState(false);
  const [claimantHasMore, setClaimantHasMore] = React.useState(false);
  const [claimantSearchError, setClaimantSearchError] = React.useState('');
  const eventCatalogRef = React.useRef(null);
  const reasonOptionsRef = React.useRef([]);
  const eventOptionsRef = React.useRef([]);
  const [reasonOptions, setReasonOptions] = React.useState([]);
  const [eventOptions, setEventOptions] = React.useState([]);
  const catalogOperationRef = React.useRef(0);
  const catalogLoadingRef = React.useRef(false);
  const [catalogLoading, setCatalogLoading] = React.useState(false);
  const [catalogError, setCatalogError] = React.useState('');
  const customFormsRef = React.useRef([]);
  const customFormsOperationRef = React.useRef(0);
  const customFormsStatusRef = React.useRef('idle');
  const customFormInstancesRef = React.useRef({});
  const customFormCleanupRef = React.useRef(null);
  const [customForms, setCustomForms] = React.useState([]);
  const [customFormsLoading, setCustomFormsLoading] = React.useState(false);
  const [customFormsError, setCustomFormsError] = React.useState('');
  const [activeCustomForm, setActiveCustomForm] = React.useState('');
  const affected = React.useRef({ operation: 0, previewOperation: 0, objects: [], fields: [], rules: {}, saved: [],
    coverageId: null, typeId: null, objectId: null, loading: false, previewLoading: false,
    loaded: false, error: '', previewError: '', detail: null, modal: null, modalContainer: null }).current;
  const [affectedRevision, renderAffected] = React.useState(0);
  const notifyAffected = () => { if (mountedRef.current) renderAffected((value) => value + 1); };
  const coverageRowsRef = React.useRef([]);
  const [coverageRows, setCoverageRows] = React.useState([]);
  const [selectedCoverageId, setSelectedCoverageId] = React.useState(null);
  const reserveSavingRef = React.useRef(false);
  const reserveOperationRef = React.useRef(0);
  const [reserveSaving, setReserveSaving] = React.useState(false);
  const sectionRefreshRef = React.useRef(false);
  const [sectionRefreshing, setSectionRefreshing] = React.useState(false);
  const [reserveError, setReserveError] = React.useState('');
  const [reserveDirection, setReserveDirection] = React.useState('INCREASE');
  const [reserveType, setReserveType] = React.useState('IN');
  const [reserveAmount, setReserveAmount] = React.useState('');
  const [reserveConcept, setReserveConcept] = React.useState('');
  const [reserveModalOpen, setReserveModalOpen] = React.useState(false);
  const paymentSavingRef = React.useRef(false);
  const paymentOperationRef = React.useRef(0);
  const selectedPaymentReserveIdRef = React.useRef(null);
  const [selectedPaymentReserveId, setSelectedPaymentReserveIdState] = React.useState(null);
  const [paymentSaving, setPaymentSaving] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState('');
  const [paymentReserveModalOpen, setPaymentReserveModalOpen] = React.useState(false);
  const [checkRequestModalOpen, setCheckRequestModalOpen] = React.useState(false);
  const [paymentRequestDetail, setPaymentRequestDetail] = React.useState(null);
  const [paymentRequestCatalogs, setPaymentRequestCatalogs] = React.useState({ methods: [], types: [] });
  const [paymentCoverageId, setPaymentCoverageId] = React.useState(null);
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentConcept, setPaymentConcept] = React.useState('');
  const [paymentReference, setPaymentReference] = React.useState('');
  const selectedExpenseReserveIdRef = React.useRef(null);
  const [selectedExpenseReserveId, setSelectedExpenseReserveIdState] = React.useState(null);
  const [expenseError, setExpenseError] = React.useState('');
  const [expenseReserveModalOpen, setExpenseReserveModalOpen] = React.useState(false);
  const [expenseCheckRequestModalOpen, setExpenseCheckRequestModalOpen] = React.useState(false);
  const [expenseCoverageId, setExpenseCoverageId] = React.useState(null);
  const [expenseAmount, setExpenseAmount] = React.useState('');
  const [expenseConcept, setExpenseConcept] = React.useState('');
  React.useEffect(() => {
    setPaymentRequestDetail(null);
    setPaymentRequestCatalogs({ methods: [], types: [] });
  }, [claimId, activeTab]);
  const [recoveryModalOpen, setRecoveryModalOpen] = React.useState(false);
  const recovery = React.useRef({ types: [], typesLoaded: false, currencies: [], operation: 0,
    write: null, created: null, form: null }).current;
  const [recoveryRows, setRecoveryRows] = React.useState([]);
  const [recoveryLoading, setRecoveryLoading] = React.useState(false);
  const [recoverySaving, setRecoverySaving] = React.useState(false);
  const [recoveryError, setRecoveryError] = React.useState('');
  const [, renderRecoveryForm] = React.useState(0);

  const refreshSection = (loader, errorSetter) => {
    if (sectionRefreshRef.current) return Promise.resolve(false);
    sectionRefreshRef.current = true;
    setSectionRefreshing(true);
    if (typeof errorSetter === 'function') errorSetter('');
    return Promise.resolve().then(loader).catch((caughtError) => {
      if (typeof errorSetter === 'function' && mountedRef.current) {
        errorSetter(caughtError && caughtError.message
          ? caughtError.message : 'No fue posible actualizar la sección.');
      }
      return false;
    }).then((result) => {
      sectionRefreshRef.current = false;
      if (mountedRef.current) setSectionRefreshing(false);
      return result;
    });
  };

  const comments = React.useRef({ rows: [], draft: '', loading: false, saving: false,
    error: '', loaded: false, revision: 0 }).current;
  const [, renderComments] = React.useState(0);
  const notifyComments = () => { if (mountedRef.current) renderComments((value) => value + 1); };
  const resetComments = () => {
    Object.assign(comments, { rows: [], draft: '', loading: false, saving: false,
      error: '', loaded: false, revision: comments.revision + 1 });
    notifyComments();
  };
  const commentId = (value) => {
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  };
  const commentScope = () => {
    const claim = currentClaimRef.current;
    if (!mountedRef.current || !claim || routeClaimId() !== commentId(claim.id)) return null;
    const policyId = claim.lifePolicyId == null ? commentId(claim.Policy && claim.Policy.id) : commentId(claim.lifePolicyId);
    if (!policyId || (claim.Policy && claim.Policy.id != null && commentId(claim.Policy.id) !== policyId)) return null;
    return { claimId: commentId(claim.id), policyId: policyId };
  };
  const commentGuard = (scope, revision) => () => {
    const current = commentScope();
    return !!current && current.claimId === scope.claimId && current.policyId === scope.policyId
      && comments.revision === revision;
  };
  const changeCommentDraft = (value) => {
    if (comments.saving || typeof value !== 'string') return;
    comments.draft = value;
    notifyComments();
  };
  const loadComments = (afterWrite) => {
    const scope = commentScope();
    if (comments.loading || (comments.saving && afterWrite !== true)) return Promise.resolve(false);
    if (!scope) {
      comments.error = 'No se pudo identificar la póliza del siniestro.';
      notifyComments();
      return Promise.resolve(false);
    }
    const current = commentGuard(scope, comments.revision);
    comments.loading = true;
    comments.error = '';
    notifyComments();
    return repositoryRequest('RepoComment', { operation: 'GET', filter: 'lifePolicyId=' + scope.policyId }, undefined, current)
      .then((result) => {
        if (!current()) return false;
        if (result && result.ok === false) throw new Error(result.msg || 'No fue posible consultar los comentarios.');
        const data = result && result.outData !== undefined ? result.outData : result;
        const rows = Array.isArray(data) ? data : data && (data.rows || data.data || data.items);
        if (!Array.isArray(rows) || rows.some((row) => !row || !commentId(row.id)
          || commentId(row.lifePolicyId) !== scope.policyId || typeof row.message !== 'string'
          || (row.user != null && typeof row.user !== 'string')
          || (row.created != null && typeof row.created !== 'string'))
          || new Set(rows.map((row) => Number(row.id))).size !== rows.length) {
          throw new Error('La respuesta de comentarios no es válida.');
        }
        comments.rows = rows;
        comments.loaded = true;
        return true;
      }).catch((caught) => {
        if (current()) {
          comments.rows = [];
          comments.loaded = false;
          comments.error = caught.message || 'No fue posible consultar los comentarios.';
        }
        return false;
      }).then((result) => {
        if (current()) { comments.loading = false; notifyComments(); }
        return result;
      });
  };
  const writeComment = (operation, id) => {
    const scope = commentScope();
    if (!scope || comments.saving || comments.loading) return Promise.resolve(false);
    const message = comments.draft.trim();
    if (operation === 'ADD' && !message) return Promise.resolve(false);
    if (operation === 'DELETE' && (!commentId(id) || !comments.rows.some((row) => Number(row.id) === commentId(id)))) {
      return Promise.resolve(false);
    }
    const current = commentGuard(scope, comments.revision);
    const entity = operation === 'ADD' ? { message: message, lifePolicyId: scope.policyId } : { id: commentId(id) };
    comments.saving = true;
    comments.error = '';
    notifyComments();
    return repositoryRequest('RepoComment', { operation: operation, entity: entity }, undefined, current)
      .then((result) => {
        if (!current()) return false;
        if (!result || result.ok !== true) throw new Error(result && result.msg || 'No fue posible guardar el comentario.');
        if (operation === 'ADD') comments.draft = '';
        return loadComments(true);
      }).catch((caught) => {
        if (current()) comments.error = caught.message || 'No fue posible guardar el comentario.';
        return false;
      }).then((result) => {
        if (current()) { comments.saving = false; notifyComments(); }
        return result;
      });
  };
  const addComment = () => writeComment('ADD');
  const deleteComment = (id) => writeComment('DELETE', id);
  const setSelectedPaymentReserveId = (value) => {
    const next = value === null || value === undefined ? null : Number(value);
    selectedPaymentReserveIdRef.current = next;
    setSelectedPaymentReserveIdState(next);
  };
  const setSelectedExpenseReserveId = (value) => {
    const next = value === null || value === undefined ? null : Number(value);
    selectedExpenseReserveIdRef.current = next;
    setSelectedExpenseReserveIdState(next);
  };
  const cancelClaimantSearch = () => {
    claimantSearchOperationRef.current += 1;
    if (claimantSearchTimerRef.current !== null) {
      window.clearTimeout(claimantSearchTimerRef.current);
      claimantSearchTimerRef.current = null;
    }
    if (mountedRef.current) setClaimantSearching(false);
  };
  const cancelCatalogLoad = () => {
    catalogOperationRef.current += 1;
    catalogLoadingRef.current = false;
    if (mountedRef.current) setCatalogLoading(false);
  };
  const clearEventCatalog = () => {
    eventCatalogRef.current = null;
    reasonOptionsRef.current = [];
    eventOptionsRef.current = [];
    if (mountedRef.current) {
      setReasonOptions([]);
      setEventOptions([]);
    }
  };
  const setClaimStageSelection = (value) => {
    stageSelectionRef.current = value;
    setStageSelection(value);
  };
  const changeClaimContext = (nextClaimId) => {
    const currentClaimId = currentClaimRef.current ? Number(currentClaimRef.current.id) : null;
    if (currentClaimId === nextClaimId) return;
    closePaymentCatalogs();
    setClaimSummary(EMPTY_SUMMARY);
    setClaimDetails(EMPTY_DETAILS);
    setError('');
    setValuationWarning('');
    coverageRowsRef.current = [];
    setCoverageRows([]);
    setSelectedCoverageId(null);
    setReserveError('');
    setReserveModalOpen(false);
    reserveOperationRef.current += 1;
    reserveSavingRef.current = false;
    setReserveSaving(false);
    paymentOperationRef.current += 1;
    paymentSavingRef.current = false;
    setPaymentSaving(false);
    setPaymentError('');
    setPaymentReserveModalOpen(false);
    setCheckRequestModalOpen(false);
    setSelectedPaymentReserveId(null);
    setExpenseError('');
    setExpenseReserveModalOpen(false);
    setExpenseCheckRequestModalOpen(false);
    setRecoveryModalOpen(false);
    recovery.operation += 1;
    recovery.types = [];
    recovery.typesLoaded = false;
    recovery.currencies = [];
    recovery.write = false;
    recovery.created = null;
    recovery.form = null;
    setRecoveryRows([]);
    setRecoveryLoading(false);
    setRecoverySaving(false);
    setRecoveryError('');
    setSelectedExpenseReserveId(null);
    clearLoadedClaim();
    stageOperationRef.current += 1;
    if (stageSavingRef.current) {
      stageSavingRef.current = false;
      if (mountedRef.current) setStageSaving(false);
    }
    if (pendingStageConfirmationRef.current
      && pendingStageConfirmationRef.current.claimId !== nextClaimId) {
      pendingStageConfirmationRef.current = null;
    }
    if (adjusterLoadingRef.current) {
      adjusterLoadingRef.current = false;
      if (mountedRef.current) setAdjusterLoading(false);
    }
    adjusterOptionsRef.current = [];
    if (mountedRef.current) setAdjusterOptions([]);
    cancelClaimantSearch();
    claimantOptionsRef.current = [];
    clearEventCatalog();
    cancelCatalogLoad();
    if (mountedRef.current) {
      setClaimantOptions([]);
      setClaimantSearching(false);
      setClaimantHasMore(false);
      setClaimantSearchError('');
      setReasonOptions([]);
      setEventOptions([]);
      setCatalogLoading(false);
      setCatalogError('');
    }
  };

  const displayValue = (value) => value === null || value === undefined || String(value).trim() === ''
    ? EMPTY_VALUE : String(value);
  const formatAmount = (value) => {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') return EMPTY_VALUE;
    const amount = Number(value);
    return isFinite(amount) ? (claimSummary.valuation.currency ? claimSummary.valuation.currency + ' ' : '') + amount.toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }) : EMPTY_VALUE;
  };
  const formatGridAmount = (value) => {
    const amount = Number(value);
    const tone = isFinite(amount) && amount > 0 ? 'resumen-grid-amount-positive'
      : isFinite(amount) && amount < 0 ? 'resumen-grid-amount-negative' : 'resumen-grid-amount-zero';
    return <span className={tone}>{formatAmount(value)}</span>;
  };

  const dateText = (value) => {
    const raw = value && typeof value === 'object' ? value._i : value;
    if (typeof raw !== 'string') return null;
    // The API's year-one sentinel represents an unset date, not a real occurrence.
    return /^\d{4}-\d{2}-\d{2}/.test(raw) && !raw.startsWith('0001-') ? raw : null;
  };
  const utcBrowserDate = (value) => {
    const text = dateText(value);
    if (!text) return null;
    // Repository GET values without an offset are UTC timestamps as well.
    const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(text) ? text + 'T00:00:00Z'
      : /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : text + 'Z';
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const formatDate = (value) => {
    const date = utcBrowserDate(value);
    if (!date) return null;
    return String(date.getDate()).padStart(2, '0') + '/'
      + String(date.getMonth() + 1).padStart(2, '0') + '/' + date.getFullYear();
  };
  const policyStartYear = (value) => {
    const date = utcBrowserDate(value);
    return date ? String(date.getFullYear()) : null;
  };
  const policyTypeLabel = (value) => ({
    I: 'Individual',
    G: 'Grupal',
    C: 'Certificado'
  })[String(value || '').trim().toUpperCase()] || value || null;
  const occurrenceTime = (value) => {
    const date = utcBrowserDate(value);
    if (!date) return {};
    const hour = date.getHours();
    return { hour: String(hour % 12 || 12).padStart(2, '0'), minute: String(date.getMinutes()).padStart(2, '0'), period: hour < 12 ? 'am' : 'pm' };
  };

  const firstValue = (...values) => values.find((value) => value !== null
    && value !== undefined && String(value).trim() !== '');

  const personName = (person) => {
    if (!person) return null;
    if (typeof person !== 'object') return String(person);
    return firstValue(person.FullName, person.fullName, [
      person.name, person.middlename, person.surname1, person.surname2
    ].filter(Boolean).join(' '));
  };

  const responseRows = (result, label) => {
    if (result && result.ok === false) {
      throw new Error(result.msg || ('No fue posible consultar ' + label + '.'));
    }
    const source = result && result.outData !== undefined ? result.outData : result;
    if (Array.isArray(source)) return source;
    if (source && Array.isArray(source.rows)) return source.rows;
    if (source && Array.isArray(source.data)) return source.data;
    if (source && Array.isArray(source.items)) return source.items;
    return source && typeof source === 'object' ? [source] : [];
  };

  const policySearchText = (value) => String(value == null ? '' : value).trim();
  const policySearchDate = (value) => {
    if (!value) return null;
    const text = typeof value === 'string' ? value : value.format && value.format('YYYY-MM-DD');
    return text || null;
  };
  const policyContactNames = (policy) => {
    const contacts = [];
    if (policy && policy.Holder) contacts.push(policy.Holder);
    if (policy && policy.holder) contacts.push(policy.holder);
    (Array.isArray(policy && policy.Insureds) ? policy.Insureds : []).forEach((insured) => {
      contacts.push(insured && (insured.Contact || insured.contact || insured));
    });
    return contacts.map(personName).filter(Boolean).join(' ');
  };
  const policyContactSearchText = (policy) => {
    const contacts = [];
    if (policy && policy.Holder) contacts.push(policy.Holder);
    if (policy && policy.holder) contacts.push(policy.holder);
    (Array.isArray(policy && policy.Insureds) ? policy.Insureds : []).forEach((insured) => {
      contacts.push(insured && (insured.Contact || insured.contact || insured));
    });
    return contacts.filter(Boolean).map((contact) => [personName(contact), contact.id, contact.cnp,
      contact.nif, contact.passport, contact.nationalId].filter(Boolean).join(' ')).join(' ');
  };
  const policySearchLabel = (policy) => {
    const code = firstValue(policy && policy.code, policy && policy.Code, '#' + (policy && policy.id));
    const insured = policyContactNames(policy);
    return insured ? String(insured) : String(code || 'Póliza');
  };
  const newClaimContactLabel = (contact) => {
    const name = personName(contact) || 'Contacto';
    const identifier = firstValue(contact && contact.cnp, contact && contact.nif,
      contact && contact.passport, contact && contact.nationalId);
    const id = Number(contact && contact.id);
    return name + (identifier ? ' | ' + identifier : '') + (id > 0 ? ' | #' + id : '');
  };
  const searchNewClaimContacts = (kind, value) => {
    const search = policySearchText(value);
    if (newClaimContactTimers.current[kind]) window.clearTimeout(newClaimContactTimers.current[kind]);
    newClaimContactRequests.current[kind] += 1;
    const requestId = newClaimContactRequests.current[kind];
    if (search.length < 2 && !/^\d+$/.test(search)) {
      setNewClaimContactOptions((current) => Object.assign({}, current, { [kind]: [] }));
      setNewClaimContactLoading((current) => Object.assign({}, current, { [kind]: false }));
      return;
    }
    newClaimContactTimers.current[kind] = window.setTimeout(() => {
      const escaped = search.replace(/'/g, "''").replace(/[\%_\[]/g, (match) => '[' + match + ']');
      const numericId = /^\d+$/.test(search) && Number.isSafeInteger(Number(search)) ? Number(search) : 0;
      const nameFilter = "TRIM(CONCAT_WS(' ', [name], [middlename], [surname1], [surname2])) LIKE N'%" + escaped + "%'";
      const identityFilter = "[cnp] LIKE N'%" + escaped + "%' OR [nif] LIKE N'%" + escaped
        + "%' OR [passport] LIKE N'%" + escaped + "%' OR [nationalId] LIKE N'%" + escaped + "%'";
      const filter = '([inactive] = 0) AND (' + nameFilter + ' OR ' + identityFilter
        + (numericId > 0 ? ' OR [id] = ' + numericId : '') + ')';
      setNewClaimContactLoading((current) => Object.assign({}, current, { [kind]: true }));
      exe('GetContacts', { operation: 'GET', filter: filter, page: 0, size: 15 })
        .then((result) => {
          if (!mountedRef.current || requestId !== newClaimContactRequests.current[kind]) return;
          const options = responseRows(result, 'los contactos').map((contact) => ({
            value: Number(contact && contact.id), label: newClaimContactLabel(contact), contact: contact
          })).filter((option) => Number.isSafeInteger(option.value) && option.value > 0);
          setNewClaimContactOptions((current) => Object.assign({}, current, { [kind]: options }));
        })
        .catch(() => {
          if (mountedRef.current && requestId === newClaimContactRequests.current[kind]) {
            setNewClaimContactOptions((current) => Object.assign({}, current, { [kind]: [] }));
          }
        })
        .then(() => {
          if (mountedRef.current && requestId === newClaimContactRequests.current[kind]) {
            setNewClaimContactLoading((current) => Object.assign({}, current, { [kind]: false }));
          }
        });
    }, 350);
  };
  const loadNewClaimProducts = (lobCode) => {
    const requestId = newClaimProductRequest.current + 1;
    newClaimProductRequest.current = requestId;
    const normalizedLob = policySearchText(lobCode);
    setNewClaimProductOptions([]);
    setNewClaimFilters((current) => Object.assign({}, current, { product: '' }));
    if (!normalizedLob) {
      setNewClaimProductLoading(false);
      return Promise.resolve();
    }
    setNewClaimProductLoading(true);
    return exe('RepoProduct', {
      operation: 'GET',
      filter: "lobCode = '" + normalizedLob.replace(/'/g, "''") + "'"
    }).then((result) => {
      if (!mountedRef.current || requestId !== newClaimProductRequest.current) return;
      if (!result || result.ok === false) throw new Error(result && result.msg
        ? result.msg : 'No se pudieron cargar los productos.');
      const seen = {};
      setNewClaimProductOptions(responseRows(result, 'los productos').map((product) => {
        const value = String(firstValue(product && product.code, product && product.id, '')).trim();
        if (!value || seen[value]) return null;
        seen[value] = true;
        return { value: value, label: String(firstValue(product && product.name,
          product && product.description, product && product.code, product && product.id, value)) };
      }).filter(Boolean));
    }).catch((caughtError) => {
      if (mountedRef.current && requestId === newClaimProductRequest.current) {
        setNewClaimProductOptions([]);
        setNewClaimError(caughtError && caughtError.message
          ? caughtError.message : 'No se pudieron cargar los productos.');
      }
    }).then(() => {
      if (mountedRef.current && requestId === newClaimProductRequest.current) setNewClaimProductLoading(false);
    });
  };
  const openNewClaimModal = () => {
    const preservedLob = policySearchText(newClaimFilters.lob);
    setNewClaimError('');
    setNewClaimRows([]);
    setNewClaimPolicyPage(1);
    setNewClaimPolicyTotal(0);
    newClaimCodeInput.current = null;
    newClaimContactRequests.current.holder += 1;
    newClaimContactRequests.current.insured += 1;
    newClaimProductRequest.current += 1;
    setNewClaimContactOptions({ holder: [], insured: [] });
    setNewClaimContactLoading({ holder: false, insured: false });
    setNewClaimProductOptions([]);
    setNewClaimProductLoading(false);
    setNewClaimFilters((current) => Object.assign({}, current, { holderId: null, insuredId: null, product: '' }));
    setNewClaimSelectedPolicy(null);
    setNewClaimModalOpen(true);
    if (preservedLob) loadNewClaimProducts(preservedLob);
    if (!newClaimLobOptions.length) {
      exe('RepoLob', { operation: 'GET' }).then((result) => {
        if (!mountedRef.current || !result || result.ok === false) return;
        setNewClaimLobOptions(responseRows(result, 'los ramos').map((row) => ({
          value: String(firstValue(row.code, row.id, '')),
          label: String(firstValue(row.name, row.description, row.code, row.id, ''))
        })).filter((row) => row.value));
      }).catch(() => {});
    }
  };
  const searchNewClaimPolicies = (requestedPage) => {
    const page = Number.isSafeInteger(Number(requestedPage)) && Number(requestedPage) > 0
      ? Number(requestedPage) : 1;
    const code = policySearchText(newClaimCodeInput.current === null
      ? newClaimFilters.code : newClaimCodeInput.current);
    const holderId = Number(newClaimFilters.holderId);
    const insuredId = Number(newClaimFilters.insuredId);
    const lob = policySearchText(newClaimFilters.lob);
    const product = policySearchText(newClaimFilters.product);
    const dates = newClaimFilters.dates || [];
    const from = policySearchDate(dates[0]);
    const to = policySearchDate(dates[1]);
    if (!code && !(Number.isSafeInteger(holderId) && holderId > 0)
      && !(Number.isSafeInteger(insuredId) && insuredId > 0) && !lob && !product && !from && !to) {
      setNewClaimError('Indique al menos un criterio de búsqueda.');
      setNewClaimRows([]);
      setNewClaimPolicyPage(1);
      setNewClaimPolicyTotal(0);
      return Promise.resolve();
    }
    const conditions = ['active = 1'];
    if (code) conditions.push("[code] LIKE N'%" + code.replace(/'/g, "''").replace(/[%_]/g, '[$&]') + "%'");
    if (Number.isSafeInteger(holderId) && holderId > 0) conditions.push('[holderId] = ' + holderId);
    if (Number.isSafeInteger(insuredId) && insuredId > 0) {
      conditions.push('id IN (SELECT lifePolicyId FROM Insured WHERE contactId = ' + insuredId + ')');
    }
    if (lob) conditions.push("[lob] = '" + lob.replace(/'/g, "''") + "'");
    if (product) conditions.push("[productCode] = '" + product.replace(/'/g, "''") + "'");
    if (from) conditions.push("[end] >= '" + from + "T00:00:00Z'");
    if (to) conditions.push("[start] <= '" + to + "T23:59:59Z'");
    setNewClaimLoading(true);
    setNewClaimError('');
    return exe('RepoLifePolicy', {
      operation: 'GET',
      filter: conditions.join(' AND '),
      include: ['Holder', 'Insureds.Contact', 'Product', 'Lob', 'Branch', 'Coverages'],
      orderBy: 'id', orderDir: 'DESC', page: page - 1, size: 15
    }).then((result) => {
      if (!mountedRef.current) return;
      const rows = responseRows(result, 'las pólizas');
      const filtered = rows;
      const total = Number(result && result.total);
      setNewClaimPolicyPage(page);
      setNewClaimPolicyTotal(Number.isFinite(total) ? total : filtered.length);
      setNewClaimRows(filtered.map((policy) => Object.assign({}, policy, {
        __insuredLabel: policyContactNames(policy),
        __lobLabel: firstValue(policy && policy.Lob && policy.Lob.name, policy && policy.lobName,
          policy && policy.lob),
        __productLabel: firstValue(policy && policy.Product && policy.Product.name,
          policy && policy.productCode),
        __startLabel: formatDate(policy && policy.start),
        __endLabel: formatDate(policy && policy.end)
      })));
      if (!filtered.length) setNewClaimError('No se encontraron pólizas con esos criterios.');
    }).catch((caughtError) => {
      if (mountedRef.current) {
        setNewClaimRows([]);
        setNewClaimPolicyTotal(0);
        setNewClaimError(caughtError && caughtError.message ? caughtError.message : 'No se pudieron consultar las pólizas.');
      }
    }).finally(() => {
      if (mountedRef.current) setNewClaimLoading(false);
    });
  };
  const prepareNewClaimPolicy = (policy) => {
    if (dirtyRef.current && !window.confirm('Hay cambios sin guardar. ¿Desea descartarlos para preparar un nuevo siniestro?')) return;
    const policyId = Number(policy && (policy.id || policy.lifePolicyId));
    const insured = policy && Array.isArray(policy.Insureds) && policy.Insureds.length
      ? policy.Insureds[0] && (policy.Insureds[0].Contact || policy.Insureds[0].contact || policy.Insureds[0])
      : null;
    const contact = policy && (policy.Holder || policy.holder) || insured;
    const contactId = Number(contact && contact.id);
    if (!Number.isSafeInteger(policyId) || policyId <= 0 || !Number.isSafeInteger(contactId) || contactId <= 0) {
      setNewClaimError('La póliza seleccionada no contiene un asegurado válido para iniciar el siniestro.');
      return;
    }
    const claimType = String(firstValue(policy.policyType, policy.claimType,
      policy.claimTypeCode, policy.type, 'I'));
    const newClaim = {
      id: 0, closed: false, lifePolicyId: policyId, Policy: policy,
      claimType: claimType, stageCode: '1', claimerId: contactId, contactId: contactId,
      Claimer: contact, Contact: contact, jCustomForms: null,
      eventReason: '', insuredEvent: null, description: '', occurrence: null, notification: null
    };
    dirtyRef.current = false;
    touchedRef.current = {};
    requestRef.current += 1;
    changeClaimContext(null);
    newClaimModeRef.current = true;
    setNewClaimMode(true);
    setNewClaimValidation({});
    setNewClaimSelectedPolicy(policy);
    setNewClaimCatalogSeq((value) => value + 1);
    setNewClaimModalOpen(false);
    setActiveTab('general');
    setClaimId(null);
    setLoading(false);
    setError('');
    currentClaimRef.current = newClaim;
    const currency = typeof policy.currency === 'string' ? policy.currency.trim().toUpperCase() : '';
    setClaimSummary({
      policy: {
        policyNumber: firstValue(policy.code, policy.id),
        lineOfBusiness: firstValue(policy.Lob && policy.Lob.name, policy.lobName, policy.lob),
        year: policyStartYear(policy.start),
        certificateNumber: policy.certificate,
        insured: personName(insured || contact),
        payer: personName(policy.Payer || policy.PayerContact || policy.Holder || policy.holder),
        branch: firstValue(policy.Branch && policy.Branch.name, policy.branchName, policy.branchCode),
        policyType: policyTypeLabel(policy.policyType || policy.type),
        startDate: formatDate(policy.start),
        endDate: formatDate(policy.end),
        creator: formatDate(policy.created),
        status: firstValue(policy.entityState, policy.status),
        modified: formatDate(policy.lastUpdate)
      },
      valuation: { currency: currency, reserves: null, payments: null,
        recoveries: null, expenses: null, balance: null }
    });
    draftRef.current = createDraft(newClaim);
    draftRef.current.stageCode = '1';
    draftRef.current.claimantId = String(contactId);
    draftRef.current.claimantLabel = '';
    draftRef.current.claimantType = '';
    setDraft(draftRef.current);
    setClaimStageSelection('1');
    setEditable(true);
    setClaimantOptionList([claimantOption(contact, true)].filter(Boolean));
    loadPolicySummaryLabels(newClaim, requestRef.current);
    loadAdjusters(0);
    loadCustomForms(newClaim);
    window.location.hash = '#/view/48';
    dirtyRef.current = true;
  };

  const numericValue = (value) => {
    if (value === null || value === undefined || String(value).trim() === '' || typeof value === 'boolean') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  const isReserveMovement = (row) => numericValue(row && row.payed) === 0;
  const parseMoneyInput = (value) => {
    const text = String(value == null ? '' : value);
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d{0,2})?$/.test(text)) return null;
    return text.replace(/,/g, '');
  };
  const formatMoneyInput = (value) => {
    const text = String(value == null ? '' : value);
    const parts = text.split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts.length > 1 ? '.' + parts[1] : '');
  };
  const changeMoneyInput = (event, change) => {
    const inputType = event.nativeEvent && event.nativeEvent.inputType;
    const editing = ['insertText', 'deleteContentBackward', 'deleteContentForward', 'deleteByCut'].indexOf(inputType) !== -1;
    const value = parseMoneyInput(editing ? event.target.value.replace(/,/g, '') : event.target.value);
    if (value === null) return;
    const input = event.target;
    const offset = input.value.slice(0, input.selectionStart).replace(/,/g, '').length;
    change(value);
    window.requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      let position = 0, digits = 0;
      while (position < input.value.length && digits < offset) {
        if (input.value.charAt(position) !== ',') digits++;
        position++;
      }
      input.setSelectionRange(position, position);
    });
  };
  const repositoryRequest = (name, payload, options, guard) => Promise.resolve().then(() =>
    guard && !guard() ? null : exe(name, payload, options));
  const contactSearchFilter = (query, profile) => {
    const raw = String(query || '').trim(), fields = profile && profile.Contacts && profile.Contacts.fullNameFields;
    const valid = Array.isArray(fields) ? fields.filter((field) =>
      ['name', 'middleName', 'surname1', 'surname2'].indexOf(field) !== -1) : [];
    const name = valid.length ? '(' + valid.map((field) => "RTRIM(ISNULL([" + field + "],''))").join("+' '+") + ')'
      : "(RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,'')))";
    return '(' + (/^\d+$/.test(raw) ? 'cnp' : name) + " LIKE N'%" + sqlLikeLiteral(raw) + "%')";
  };
  const notifyRecordUpdated = () => {
    if (A.message && typeof A.message.success === 'function') {
      A.message.success('Registro actualizado');
    }
  };

  const roundMoney = (value) => Number(Number(value || 0).toFixed(2));
  const valuationBalance = (reserves, payments, expenses, recoveries) => roundMoney(
    (numericValue(reserves) || 0) - (numericValue(payments) || 0)
    - (numericValue(expenses) || 0) + (numericValue(recoveries) || 0)
  );
  const effectiveIndemnityMovement = (row) => !([2, '2'].includes(row.status) && numericValue(row.payed) > 0);
  const activeReserveMovements = (claim, coverageId) => {
    const requestedClaimId = claim && Number(claim.id);
    return Array.isArray(claim && claim.Payouts) ? claim.Payouts.filter((item) => {
      const bucket = String(item && item.reserveType || '').trim().toUpperCase();
      return item && Number(item.claimId) === requestedClaimId
        && Number(item.lifeCoverageId) === Number(coverageId)
        && (bucket === 'IN' ? effectiveIndemnityMovement(item) : bucket === 'EX' && Number(item.status) !== 2);
    }) : [];
  };
  const normalizeCoverageRows = (claim) => {
    const policy = claim && claim.Policy ? claim.Policy : {};
    const coverages = Array.isArray(policy.Coverages) ? policy.Coverages : [];
    return coverages.map((coverage) => {
      const id = coverage && Number(coverage.id);
      if (!Number.isSafeInteger(id) || id <= 0) return null;
      const movements = activeReserveMovements(claim, id);
      const bucketTotal = (bucket, field) => roundMoney(movements.reduce((total, item) => {
        if (String(item.reserveType || '').trim().toUpperCase() !== bucket) return total;
        const amount = numericValue(item[field]);
        return total + (amount === null ? 0 : amount);
      }, 0));
      const reserveTotal = (bucket) => roundMoney(movements.reduce((total, item) => {
        if (String(item.reserveType || '').trim().toUpperCase() !== bucket || !isReserveMovement(item)) return total;
        const amount = numericValue(item.reserved);
        return total + (amount === null ? 0 : amount);
      }, 0));
      const paymentReserve = reserveTotal('IN');
      const expenseReserve = reserveTotal('EX');
      const payments = bucketTotal('IN', 'payed');
      const expenses = bucketTotal('EX', 'payed');
      const limit = numericValue(coverage.limit);
      const deductible = numericValue(coverage.deductible);
      return {
        id: id,
        code: String(firstValue(coverage.code, coverage.coverageCode, coverage.number, id)),
        name: String(firstValue(coverage.name, coverage.description, coverage.code, 'Cobertura ' + id)),
        start: formatDate(firstValue(coverage.start, policy.start)),
        end: formatDate(firstValue(coverage.end, policy.end)),
        limit: limit,
        deductible: deductible,
        available: limit === null ? null : roundMoney(limit - paymentReserve - expenseReserve),
        paymentReserve: paymentReserve,
        expenseReserve: expenseReserve,
        totalReserve: roundMoney(paymentReserve + expenseReserve),
        payments: payments,
        expenses: expenses,
        movements: movements
      };
    }).filter(Boolean);
  };

  const buildReserveEntity = (claim, coverageId, direction, bucket, amount, concept) => {
    if (!claim || !canEdit(claim)) throw new Error('El siniestro no permite registrar reservas.');
    const policyId = Number(claim.lifePolicyId || (claim.Policy && claim.Policy.id));
    const requestedClaimId = Number(claim.id);
    const requestedCoverageId = Number(coverageId);
    const coverages = claim.Policy && Array.isArray(claim.Policy.Coverages) ? claim.Policy.Coverages : [];
    if (!Number.isSafeInteger(policyId) || policyId <= 0 || !Number.isSafeInteger(requestedClaimId)
      || requestedClaimId <= 0 || !coverages.some((item) => item && Number(item.id) === requestedCoverageId)) {
      throw new Error('La cobertura seleccionada no pertenece al siniestro.');
    }
    if (direction !== 'INCREASE' && direction !== 'DECREASE') {
      throw new Error('El movimiento de reserva no es válido.');
    }
    if (bucket !== 'IN' && bucket !== 'EX') throw new Error('El tipo de reserva no es válido.');
    const numericAmount = numericValue(amount);
    if (numericAmount === null || numericAmount <= 0) throw new Error('El monto debe ser mayor que cero.');
    const cleanConcept = String(concept || '').trim();
    if (!cleanConcept) throw new Error('El concepto es obligatorio.');
    if (direction === 'DECREASE') {
      const balance = roundMoney(activeReserveMovements(claim, requestedCoverageId).reduce((total, item) => {
        if (String(item.reserveType || '').trim().toUpperCase() !== bucket) return total;
        const reserved = numericValue(item.reserved);
        return total + (reserved === null ? 0 : reserved);
      }, 0));
      if (numericAmount > balance) throw new Error('La disminución no puede superar el saldo reservado.');
    }
    const signedAmount = roundMoney(direction === 'DECREASE' ? -numericAmount : numericAmount);
    return {
      amount: signedAmount,
      operation: 'RESERVE',
      reserveType: bucket,
      concept: cleanConcept,
      lifePolicyId: policyId,
      claimId: requestedClaimId,
      lifeCoverageId: requestedCoverageId,
      reserved: signedAmount,
      payed: 0
    };
  };

  const reserveResultPayload = (result) => result && result.outData
    && !Array.isArray(result.outData) ? result.outData : result;
  const runReserveOperation = (commandName, payload, successMessage) => {
    if (documents.saving) return Promise.resolve(false);
    if (reserveSavingRef.current) {
      setReserveError('Ya hay una operación de reserva en curso.');
      return Promise.resolve(false);
    }
    const operationClaimId = currentClaimRef.current ? Number(currentClaimRef.current.id) : null;
    if (!operationClaimId || routeClaimId() !== operationClaimId) {
      setReserveError('El siniestro cambió. Recargue la información antes de continuar.');
      return Promise.resolve(false);
    }
    const operationId = reserveOperationRef.current + 1;
    reserveOperationRef.current = operationId;
    reserveSavingRef.current = true;
    setReserveSaving(true);
    setReserveError('');
    const operationClaim = currentClaimRef.current;
    const validateObjects = commandName === 'RepoLifeCoveragePayout' && payload.operation === 'ADD'
      ? readFinancialObjects(operationClaim, payload.entity.lifeCoverageId) : Promise.resolve();
    return validateObjects.then(() => {
      if (!affectedCurrent(operationClaim) || reserveOperationRef.current !== operationId) throw new Error('El siniestro cambió. Recargue la información.');
      return repositoryRequest(commandName, payload);
    }).then((result) => {
      const body = reserveResultPayload(result);
      if (!result || result.ok === false || (body && body.ok === false)) {
        throw new Error(body && body.msg ? body.msg
          : result && result.msg ? result.msg : 'No fue posible ejecutar la operación de reserva.');
      }
      if (!mountedRef.current || reserveOperationRef.current !== operationId
        || routeClaimId() !== operationClaimId) return false;
      // The movement is already persisted; do not keep its modal open while the full claim refreshes.
      setReserveModalOpen(false);
      setReserveAmount('');
      setReserveConcept('');
      return refreshFinancialData(operationClaimId).then(() => {
        if (!mountedRef.current || reserveOperationRef.current !== operationId
          || routeClaimId() !== operationClaimId) return false;
        if (A.message && typeof A.message.success === 'function') A.message.success(successMessage);
        return true;
      });
    }).catch((caughtError) => {
      if (mountedRef.current && reserveOperationRef.current === operationId
        && routeClaimId() === operationClaimId) {
        setReserveError(caughtError && caughtError.message
          ? caughtError.message : 'No fue posible ejecutar la operación de reserva.');
      }
      return false;
    }).then((outcome) => {
      if (reserveOperationRef.current === operationId) {
        reserveSavingRef.current = false;
        if (mountedRef.current) setReserveSaving(false);
      }
      return outcome;
    });
  };

  const createReserveMovement = (direction, bucket, amount, concept) => {
    const claim = currentClaimRef.current;
    const rows = normalizeCoverageRows(claim);
    const coverageId = rows.some((row) => row.id === Number(selectedCoverageId))
      ? Number(selectedCoverageId) : rows.length === 1 ? rows[0].id : null;
    let entity;
    try {
      entity = buildReserveEntity(claim, coverageId, direction, bucket, amount, concept);
    } catch (caughtError) {
      setReserveError(caughtError && caughtError.message ? caughtError.message : 'La reserva no es válida.');
      return Promise.resolve(false);
    }
    const selectedObjectId = financialObjects.selectedId;
    return readFinancialObjects(claim, entity.lifeCoverageId).then((objects) => {
      const selected = objects.find((row) => row.key === selectedObjectId);
      if (financialObjects.claim !== claim || financialObjects.coverageId !== Number(entity.lifeCoverageId) || !selected) {
        throw new Error('Seleccione un objeto afectado de esta cobertura antes de registrar la reserva.');
      }
      entity.jAffectedObjects = JSON.stringify(selected);
      return runReserveOperation('RepoLifeCoveragePayout', { operation: 'ADD', entity: entity }, 'Reserva registrada');
    }).catch((caughtError) => {
      setReserveError(caughtError && caughtError.message ? caughtError.message : 'La reserva no es válida.');
      return false;
    });
  };

  const submitReserveMovement = () => createReserveMovement(
    reserveDirection, reserveType, reserveAmount, reserveConcept
  ).then((outcome) => {
    if (outcome && mountedRef.current) setReserveModalOpen(false);
    return outcome;
  });

  const hasOpenReserveBalance = (claim) => normalizeCoverageRows(claim).some((row) =>
    row.paymentReserve !== 0 || row.expenseReserve !== 0);

  const finalizeClaimAfterReserveClose = (claimId) => {
    const operationClaimId = Number(claimId);
    const claim = currentClaimRef.current;
    if (!Number.isSafeInteger(operationClaimId) || operationClaimId <= 0
      || !claim || Number(claim.id) !== operationClaimId
      || routeClaimId() !== operationClaimId) return Promise.resolve(false);
    if (['7', 'F'].includes(String(claimStageCode(claim) || '').trim().toUpperCase())) {
      return Promise.resolve(true);
    }
    const requestId = requestRef.current;
    stageSavingRef.current = true;
    setStageSaving(true);
    return repositoryRequest('SetClaimStage', { claimId: operationClaimId, stageCode: '7' })
      .then((result) => {
        if (!mountedRef.current || routeClaimId() !== operationClaimId
          || requestRef.current !== requestId) return false;
        if (!result || result.ok !== true) {
          throw new Error(result && result.msg ? result.msg : 'No fue posible finalizar el siniestro.');
        }
        pendingStageConfirmationRef.current = { claimId: operationClaimId, stageCode: '7' };
        notifyRecordUpdated();
        return loadClaim(operationClaimId).then(() => true);
      }).catch((caughtError) => {
        if (mountedRef.current && routeClaimId() === operationClaimId
          && requestRef.current === requestId) {
          setError(caughtError && caughtError.message
            ? caughtError.message : 'No fue posible finalizar el siniestro.');
        }
        return false;
      }).then((outcome) => {
        stageSavingRef.current = false;
        if (mountedRef.current) setStageSaving(false);
        return outcome;
      });
  };

  const closeClaimReserves = (confirmed, finalizeAfterClose) => {
    const claim = currentClaimRef.current;
    const hasBalance = hasOpenReserveBalance(claim);
    if (!claim || (!finalizeAfterClose && !canEdit(claim)) || !hasBalance) {
      setReserveError('No hay saldos de reservas disponibles para cerrar.');
      return Promise.resolve(false);
    }
    if (confirmed !== true) return Promise.resolve(false);
    const claimId = Number(claim.id);
    return runReserveOperation('ExeChain', {
      chain: 'cmdClaimReserveClosing',
      context: JSON.stringify({ claimId: claimId })
    }, 'Reservas cerradas').then((outcome) => {
      if (!outcome || !finalizeAfterClose) return outcome;
      return finalizeClaimAfterReserveClose(claimId);
    });
  };

  const confirmReserveClosingAfterFinalization = () => new Promise((resolve) => {
    if (!Modal || typeof Modal.confirm !== 'function') {
      resolve(false);
      return;
    }
    Modal.confirm({
      title: 'Cerrar reservas',
      content: 'El siniestro tiene saldo de reservas. ¿Desea cerrar las reservas antes de continuar?',
      okText: 'Sí, cerrar reservas',
      cancelText: 'No',
      onOk: () => closeClaimReserves(true, true).then(resolve, () => resolve(false)),
      onCancel: () => resolve(false)
    });
  });

  const paymentAdditionalBeneficiary = (payment, payoutId) => {
    const directValue = String(payment && payment.additionalBeneficiary || '').trim();
    if (directValue) return directValue;
    if (!payment || !payment.jDetail) return '';
    try {
      const parsed = typeof payment.jDetail === 'string' ? JSON.parse(payment.jDetail) : payment.jDetail;
      const details = Array.isArray(parsed) ? parsed : [parsed];
      const matchingDetail = details.find((item) => Number(item && item.payoutId) === Number(payoutId))
        || details.find((item) => String(item && item.additionalBeneficiary || '').trim());
      return String(matchingDetail && matchingDetail.additionalBeneficiary || '').trim();
    } catch (failure) {
      return '';
    }
  };

  const paymentPayoutId = (payment) => {
    const direct = numericValue(payment && payment.payoutId);
    if (direct !== null) return direct;
    if (!payment || typeof payment.jDetail !== 'string') return null;
    try {
      const detail = JSON.parse(payment.jDetail);
      return Array.isArray(detail) && detail.length === 1 ? numericValue(detail[0].payoutId) : null;
    } catch (failure) {
      return null;
    }
  };

  const paymentRequestPayoutIds = (request) => {
    const direct = request && request.payoutId;
    const hasDirect = direct !== null && direct !== undefined && direct !== '';
    if (hasDirect && !positiveIdText(direct)) throw new Error('La solicitud tiene una asociación de pago inválida.');
    let details = [];
    if (request && request.jDetail !== null && request.jDetail !== undefined && request.jDetail !== '') {
      try { details = typeof request.jDetail === 'string' ? JSON.parse(request.jDetail) : request.jDetail; }
      catch (error) { throw new Error('La solicitud tiene un detalle de pagos incompatible.'); }
      if (!Array.isArray(details) || details.some((item) => !item || !positiveIdText(item.payoutId))) {
        throw new Error('La solicitud tiene un detalle de pagos incompatible.');
      }
    }
    const ids = Array.from(new Set(details.map((item) => Number(item.payoutId))));
    if (hasDirect && ids.length && !ids.includes(Number(direct))) throw new Error('La solicitud tiene asociaciones de pago contradictorias.');
    if (hasDirect && !ids.length) ids.push(Number(direct));
    if (!ids.length) throw new Error('No se puede identificar el movimiento de una solicitud del siniestro.');
    return ids;
  };
  // Only the observed initial treasury workflow is supported; unknown workflows fail closed.
  const requestTreasuryUnexecuted = (request) => {
    const process = request && request.Process;
    return !!process && positiveIdText(request.processId) === positiveIdText(process.id)
      && positiveIdText(process.id) && process.entity === 'ClaimPayment' && Number(process.entityId) === Number(request.id)
      && process.definitionId === 388 && process.entityState === 'StartEvent_1'
      && process.estadoId === 'Task_1d9491f' && process.isApproved === false && process.finalizado === false;
  };
  const requestHasCheque = (request) => request.checkNum !== null && request.checkNum !== undefined && String(request.checkNum).trim() !== '';
  const revertedRequestHistory = (requests, payoutId) => {
    if (!requests.length) return true;
    let sum = 0, positive = false, negative = false;
    return requests.every((request) => {
      const ids = paymentRequestPayoutIds(request), amount = request.total;
      const noProcess = request.processId == null && request.Process == null;
      if (request.entityState !== 'REVERTED' || requestHasCheque(request)
        || !(noProcess || requestTreasuryUnexecuted(request)) || ids.length !== 1 || ids[0] !== Number(payoutId)
        || typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) return false;
      sum += amount; positive = positive || amount > 0; negative = negative || amount < 0; return true;
    }) && positive && negative && Math.abs(sum) < 0.000001;
  };
  const requestReversalIssue = (claim, requests, requestId) => {
    if (!claim || !canEdit(claim) || !positiveIdText(requestId) || !Array.isArray(requests) || !Array.isArray(claim.Payouts))
      return 'No se puede verificar la solicitud.';
    try {
      const payoutIds = claim.Payouts.map((row) => row && positiveIdText(row.id));
      if (payoutIds.some((id) => !id) || new Set(payoutIds).size !== payoutIds.length
        || claim.Payouts.some((row) => Number(row.claimId) !== Number(claim.id)))
        return 'Los movimientos no tienen una identidad única del siniestro actual.';
      const ids = new Set();
      requests.forEach((request) => {
        if (!request || !positiveIdText(request.id) || ids.has(String(request.id)) || Number(request.claimId) !== Number(claim.id))
          throw new Error('La lista de solicitudes es incompatible.');
        ids.add(String(request.id));
        paymentRequestPayoutIds(request).forEach((id) => {
          if (claim.Payouts.filter((payout) => Number(payout.id) === id && Number(payout.claimId) === Number(claim.id)).length !== 1)
            throw new Error('La asociación de la solicitud no es verificable.');
        });
      });
      const request = requests.find((row) => Number(row.id) === Number(requestId));
      if (!request) return 'La solicitud ya no existe.';
      const references = paymentRequestPayoutIds(request);
      if (references.length !== 1) return 'Las solicitudes de varios movimientos deben gestionarse en el módulo nativo.';
      const payout = claim.Payouts.find((row) => Number(row.id) === references[0] && Number(row.claimId) === Number(claim.id));
      if (payout.reserveType !== 'IN' || !(numericValue(payout.payed) > 0) || ![1, '1', 3, '3'].includes(payout.status))
        return 'La solicitud no corresponde a un pago aplicado verificable de este siniestro.';
      if (request.entityState !== 'StartEvent_1' || !requestTreasuryUnexecuted(request) || requestHasCheque(request)
        || typeof request.total !== 'number' || !Number.isFinite(request.total) || request.total <= 0)
        return 'Solicitud ejecutada, con cheque, terminal o estado de tesorería no verificado. No se puede revertir.';
      if (payout.requestedAmount !== undefined && (typeof payout.requestedAmount !== 'number'
        || !Number.isFinite(payout.requestedAmount) || payout.requestedAmount < request.total
        || payout.requestedAmount > numericValue(payout.payed)))
        return 'El monto solicitado del movimiento es incompatible. Refresque y solicite revisión antes de revertir.';
      const others = requests.filter((row) => row !== request && paymentRequestPayoutIds(row).includes(references[0]));
      if (!revertedRequestHistory(others, references[0])) return 'Existe otra solicitud activa o no verificable para este movimiento.';
      return '';
    } catch (error) { return error.message; }
  };
  const paymentActionIssue = (claim, requests, payoutId, action) => {
    if (!claim || !canEdit(claim) || !positiveIdText(payoutId) || !['CANCEL', 'REVERT'].includes(action)
      || !Array.isArray(claim.Payouts) || !Array.isArray(requests)) return 'No se puede validar esta operación de Pagos.';
    const payouts = claim.Payouts, ids = payouts.map((row) => row && positiveIdText(row.id));
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return 'Los movimientos no tienen una identidad única.';
    const payout = payouts.find((row) => Number(row.id) === Number(payoutId));
    if (!payout || Number(payout.claimId) !== Number(claim.id) || payout.reserveType !== 'IN' || !(numericValue(payout.payed) > 0)) {
      return 'Seleccione un movimiento de Pagos del siniestro actual; no una reserva ni un gasto.';
    }
    const linked = [], requestIds = new Set(); let uncertain = '';
    requests.forEach((request) => {
      try {
        if (!request || !positiveIdText(request.id) || requestIds.has(String(request.id))
          || Number(request.claimId) !== Number(claim.id)) throw new Error('La lista de solicitudes del siniestro es incompatible.');
        requestIds.add(String(request.id));
        const references = paymentRequestPayoutIds(request);
        if (references.some((id) => !payouts.some((row) => Number(row.id) === id && Number(row.claimId) === Number(claim.id)))) {
          throw new Error('Una solicitud tiene asociaciones de movimiento no verificables.');
        }
        if (references.includes(Number(payoutId))) linked.push(request);
      } catch (error) { uncertain = error.message; }
    });
    // Neither an earlier request nor a terminal label can hide an executed process or issued cheque.
    if (linked.some((request) => request.entityState === 'EXECUTED'
      || request.Process && request.Process.entityState === 'EXECUTED'
      || request.checkNum !== null && request.checkNum !== undefined && String(request.checkNum).trim() !== '')) {
      return 'Operación bloqueada: solicitud ejecutada o cheque asignado. No se puede anular ni revertir este movimiento.';
    }
    if (uncertain) return uncertain;
    if (payout.requestedAmount !== undefined && (typeof payout.requestedAmount !== 'number'
      || !Number.isFinite(payout.requestedAmount) || payout.requestedAmount !== 0))
      return 'El movimiento conserva un monto solicitado. Revise las solicitudes y sus compensaciones antes de anularlo o revertirlo.';
    if (linked.length && !(action === 'REVERT' && revertedRequestHistory(linked, payoutId))) return 'El movimiento tiene una solicitud asociada (' + linked.map((request) => request.id).join(', ')
      + '). Revise y revierta primero la solicitud desde su detalle si su estado lo permite. Las solicitudes creadas no se eliminan.';
    if (!(action === 'CANCEL' ? [0, '0'] : [1, '1']).includes(payout.status)) {
      return action === 'CANCEL' ? 'Solo se puede anular un pago pendiente de aprobación (estado 0).'
        : 'Solo se puede revertir un pago aprobado (estado 1).';
    }
    return '';
  };
  const paymentMovementStateLabel = (status) => {
    const labels = { 0: 'Pendiente de aprobación', 1: 'Aprobado', 2: 'Revertido', 3: 'Aplicado a solicitud' };
    return status !== null && status !== undefined && status !== '' && typeof status !== 'boolean'
      && labels[status] || 'Estado no verificado';
  };
  const normalizePayoutRows = (claim, reserveType) => {
    if (!claim) return [];
    const requestedReserveType = String(reserveType || '').trim().toUpperCase();
    if (requestedReserveType !== 'IN' && requestedReserveType !== 'EX') return [];
    const claimId = Number(claim.id);
    const coverageNames = {};
    const coverages = claim.Policy && Array.isArray(claim.Policy.Coverages)
      ? claim.Policy.Coverages : [];
    coverages.forEach((coverage) => {
      const coverageId = Number(coverage && coverage.id);
      if (Number.isSafeInteger(coverageId) && coverageId > 0) {
        coverageNames[coverageId] = String(firstValue(
          coverage.name, coverage.description, coverage.code, 'Cobertura ' + coverageId
        ));
      }
    });
    const payments = Array.isArray(claim.Payments) ? claim.Payments.filter((payment) =>
      payment && Number(payment.claimId) === claimId) : [];
    const beneficiaries = claim.Policy && Array.isArray(claim.Policy.Beneficiaries)
      ? claim.Policy.Beneficiaries : [];
    return (Array.isArray(claim.Payouts) ? claim.Payouts : []).filter((payout) =>
      payout && Number(payout.claimId) === claimId
      && String(payout.reserveType || '').trim().toUpperCase() === requestedReserveType
      && numericValue(payout.payed) > 0
      && Object.prototype.hasOwnProperty.call(coverageNames, Number(payout.lifeCoverageId)))
    .map((payout) => {
      const reserved = numericValue(payout.reserved);
      const amount = reserved === null ? numericValue(payout.amount) : reserved;
      const paid = numericValue(payout.payed);
      const payoutId = Number(payout.id);
      const payment = payments.find((item) => paymentPayoutId(item) === payoutId) || null;
      const paymentContactId = numericValue(payment && payment.contactId);
      const policyBeneficiary = paymentContactId === null ? null : beneficiaries.find((beneficiary) => {
        const contact = beneficiary && (beneficiary.Contact || beneficiary.contact);
        return numericValue(beneficiary && firstValue(beneficiary.contactId, contact && contact.id))
          === paymentContactId;
      });
      const policyBeneficiaryContact = policyBeneficiary
        && (policyBeneficiary.Contact || policyBeneficiary.contact);
      return {
        id: payoutId,
        coverageId: Number(payout.lifeCoverageId),
        coverage: coverageNames[Number(payout.lifeCoverageId)],
        concept: firstValue(payout.concept, payout.description, null),
        amount: roundMoney(amount === null ? 0 : amount),
        paid: roundMoney(paid === null ? 0 : paid),
        available: financialRowAvailable(claim, payout),
        status: payout.status,
        date: firstValue(payment && payment.date, payment && payment.created,
          payout.date, payout.created) || null,
        beneficiary: firstValue(payment && payment.beneficiaryName,
          payment && personName(payment.Beneficiary), payment && payment.contactName,
          personName(policyBeneficiaryContact), policyBeneficiary && policyBeneficiary.name) || null,
        affectedObject: (() => { try { const object = JSON.parse(payout.jAffectedObjects || 'null');
          return object && !Array.isArray(object) ? financialObjectLabel(object) : null; } catch (error) { return null; } })(),
        checkRequestId: payment && payment.id != null ? payment.id : null,
        additionalBeneficiary: paymentAdditionalBeneficiary(payment, payoutId),
        payment: payment
      };
    });
  };

  const financialRowAvailable = (claim, payout) => {
    if (!(Number(payout.payed) > 0) || Number(payout.status) !== 1) return 0;
    try { return nativeSettlementAmount(claim, payout); } catch (error) { return 0; }
  };
  const normalizePaymentRows = (claim) => normalizePayoutRows(claim, 'IN');
  const normalizeExpenseRows = (claim) => normalizePayoutRows(claim, 'EX');
  const recoveryData = (result, label) => {
    if (!result || result.ok !== true || !Array.isArray(result.outData)) {
      throw new Error(result && result.msg || label + ' incompatible.');
    }
    return result.outData;
  };
  const normalizeRecoveryTypes = (result) => {
    const seen = {};
    return recoveryData(result, 'Catálogo de recuperaciones').map((row) => {
      const id = row && Number(row.id);
      const name = row && typeof row.name === 'string' ? row.name.trim() : '';
      if (!Number.isSafeInteger(id) || id < 0 || !name || seen[id]) {
        throw new Error('Catálogo de recuperaciones incompatible.');
      }
      seen[id] = true;
      return { value: id, label: name };
    });
  };
  const normalizeRecoveryRows = (claimIdValue, source, coverages, types) => {
    if (!Array.isArray(source)) throw new Error('Recuperaciones incompatibles.');
    const seen = {};
    return source.filter((row) => row && Number(row.claimId) === Number(claimIdValue)).map((row) => {
      const id = Number(row.id), coverageId = Number(row.coverageId), type = Number(row.type);
      const income = numericValue(row.income), expenses = numericValue(row.expenses), netIncome = numericValue(row.netIncome);
      const processId = numericValue(row.processId), currency = typeof row.currency === 'string' ? row.currency.trim().toUpperCase() : '';
      if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(coverageId) || coverageId <= 0
        || seen[id] || !Number.isSafeInteger(type) || type < 0
        || !/^[A-Z]{3}$/.test(currency) || income === null || expenses === null || netIncome === null
        || (processId !== null && (!Number.isSafeInteger(processId) || processId <= 0))) throw new Error('Recuperaciones incompatibles.');
      seen[id] = true; return row;
    });
  };
  const loadRecoveries = (claim) => {
    const claimIdValue = claim && Number(claim.id);
    if (!Number.isSafeInteger(claimIdValue) || claimIdValue <= 0 || routeClaimId() !== claimIdValue) return Promise.resolve(false);
    const operationId = ++recovery.operation;
    recovery.types = []; recovery.typesLoaded = false;
    if (recovery.form && !recovery.write) { recovery.form = null; setRecoveryModalOpen(false); }
    setRecoveryLoading(true); setRecoveryError('');
    const current = () => recovery.operation === operationId && recoveryClaimCurrent(claim);
    return Promise.all([
      repositoryRequest('RepoSalvageType', { operation: 'GET' }),
      repositoryRequest('RepoSalvage', { operation: 'GET', filter: 'claimId=' + claimIdValue, include: ['Process', 'IncomeExpense'] })
    ]).then((results) => {
      if (!current()) return false;
      const types = normalizeRecoveryTypes(results[0]);
      const rows = normalizeRecoveryRows(claimIdValue, recoveryData(results[1], 'Respuesta de recuperaciones'),
        claim.Policy && claim.Policy.Coverages, types);
      recovery.types = types; recovery.typesLoaded = true; setRecoveryRows(rows);
      const recoveries = rows.length ? roundMoney(rows.reduce((sum, row) => sum + numericValue(row.netIncome), 0)) : null;
      setClaimSummary((summary) => {
        const valuation = summary.valuation || {};
        return Object.assign({}, summary, { valuation: Object.assign({}, valuation, {
          recoveries: recoveries,
          balance: valuationBalance(valuation.reserves, valuation.payments, valuation.expenses, recoveries)
        }) });
      });
      return true;
    }).catch((caught) => {
      if (current()) { setRecoveryRows([]); setRecoveryError(caught.message || 'No fue posible cargar recuperaciones.'); }
      return false;
    }).then((outcome) => {
      if (current()) setRecoveryLoading(false);
      return outcome;
    });
  };
  // Selection and persisted associations are separate from the original policy object.
  const resetAffected = () => {
    affected.operation += 1;
    affected.previewOperation += 1;
    Object.assign(affected, { objects: [], fields: [], rules: {}, saved: [], coverageId: null, typeId: null, objectId: null,
      loading: false, previewLoading: false, loaded: false, error: '', previewError: '', saveMessage: '', detail: null, modal: null, modalContainer: null });
    notifyAffected();
  };
  const affectedCurrent = (claim) => mountedRef.current && claim && currentClaimRef.current === claim
    && routeClaimId() === Number(claim.id);
  const affectedId = (value) => typeof value !== 'boolean' && /^\d+$/.test(String(value))
    && Number.isSafeInteger(Number(value)) && Number(value) > 0;
  const affectedTable = (name, headers, current) => repositoryRequest('DoQuery', {
    sql: "SELECT [id], [name], [data] FROM dbo.[Table] WHERE [name] = N'" + name + "';"
  }, undefined, current).then((result) => {
    if (!current()) return null;
    const tables = strictOutData(result, 'tabla de objetos afectados');
    if (tables.length !== 1 || !tables[0] || tables[0].name !== name || !affectedId(tables[0].id)) {
      throw new Error('No se encontró una tabla única de objetos afectados.');
    }
    const matrix = JSON.parse(tables[0].data);
    const nullableMaximum = name === 'CustomClaimAffectedObjectConfig'
      && JSON.stringify(headers) === JSON.stringify(['Lob', 'ProductCode', 'CoverageCode', 'ObjectDefinitionCodes', 'MaxObjects', 'Active']);
    if (!Array.isArray(matrix) || JSON.stringify(matrix[0]) !== JSON.stringify(headers)
      || matrix.slice(1).some((row) => !Array.isArray(row) || row.length !== headers.length
        || row.some((cell, index) => typeof cell !== 'string'
          && !(nullableMaximum && index === 4 && cell === null)))) throw new Error('La tabla de objetos afectados no tiene el formato esperado.');
    // The native editor stores an empty optional maximum as JSON null.
    return matrix.slice(1).map((row) => row.map((cell, index) => nullableMaximum && index === 4 && cell === null ? '' : cell));
  });
  const affectedRuleMap = (rows, claim) => {
    const policy = claim.Policy, rules = {};
    const parsed = rows.map((row) => {
      const [lob, product, coverage, rawCodes, maximum, active] = row.map((cell) => cell.replace(/^ +| +$/g, ''));
      if (!['true', 'false'].includes(active) || !lob || !product || !coverage) throw new Error('Configuración de objetos inválida.');
      if (active === 'false' || lob !== String(policy.lob)) return null;
      const codes = rawCodes.split(',').map((code) => code.replace(/^ +| +$/g, ''));
      if (!codes.length || codes.some((code) => !/^[A-Za-z0-9_]+$/.test(code))
        || (maximum !== '' && (!affectedId(maximum)))) throw new Error('Tipos o límite de objetos inválidos.');
      return { product, coverage, codes: Array.from(new Set(codes)).sort(), max: maximum === '' ? null : Number(maximum) };
    }).filter(Boolean);
    (policy.Coverages || []).forEach((coverage) => {
      const matches = parsed.filter((rule) => (rule.product === '*' || rule.product === String(policy.productCode))
        && (rule.coverage === '*' || (coverage.code != null && rule.coverage === String(coverage.code))));
      const score = (rule) => Number(rule.product !== '*') + Number(rule.coverage !== '*');
      matches.sort((a, b) => score(b) - score(a));
      if (!matches.length) return;
      const winner = matches[0];
      if (matches.some((rule) => score(rule) === score(winner)
        && (rule.max !== winner.max || JSON.stringify(rule.codes) !== JSON.stringify(winner.codes)))) {
        throw new Error('Hay reglas de objetos en conflicto para una cobertura.');
      }
      if (!affectedId(coverage.id)) throw new Error('Cobertura inválida.');
      rules[Number(coverage.id)] = winner;
    });
    return rules;
  };
  const affectedAvailableObjects = () => {
    const rule = affected.rules[affected.coverageId];
    return rule ? affected.objects.filter((object) => object.ObjectDefinition.code !== 'DISTREA' && rule.codes.includes(object.ObjectDefinition.code)) : [];
  };
  const loadAffectedObjects = () => {
    const claim = currentClaimRef.current;
    resetAffected();
    const operation = affected.operation;
    const current = () => affectedCurrent(claim) && operation === affected.operation;
    if (!current()) return Promise.resolve(false);
    const policyId = claim.Policy && claim.Policy.id;
    if (!affectedId(policyId) || (claim.lifePolicyId != null && Number(claim.lifePolicyId) !== Number(policyId))) {
      affected.error = 'No hay una póliza válida para consultar los objetos.'; notifyAffected();
      return Promise.resolve(false);
    }
    affected.loading = true; notifyAffected();
    return Promise.all([
      affectedTable('CustomClaimAffectedObjectConfig', ['Lob', 'ProductCode', 'CoverageCode', 'ObjectDefinitionCodes', 'MaxObjects', 'Active'], current),
      affectedTable('CustomClaimAffectedObjects', ['ClaimId', 'LifePolicyId', 'LifeCoverageId', 'InsuredObjectId', 'ObjectDefinitionId', 'CreatedAt'], current)
    ]).then(([config, associations]) => {
      if (!current()) return false;
      const rules = affectedRuleMap(config, claim), saved = [], keys = new Set();
      associations.forEach((row) => {
        if (!affectedId(row[0])) throw new Error('Asociación con siniestro inválido.');
        if (Number(row[0]) !== Number(claim.id)) return;
        if (row.slice(1, 5).some((id) => !affectedId(id)) || Number(row[1]) !== Number(policyId)
          || !coverageRowsRef.current.some((coverage) => coverage.id === Number(row[2]))
          || !row[5] || !Number.isFinite(Date.parse(row[5]))) throw new Error('Una asociación guardada no pertenece a la póliza o cobertura.');
        const key = Number(row[2]) + ':' + Number(row[3]);
        if (keys.has(key)) throw new Error('Hay asociaciones de objetos duplicadas.');
        keys.add(key);
        saved.push({ coverageId: Number(row[2]), objectId: Number(row[3]), typeId: Number(row[4]), createdAt: row[5] });
      });
      const codes = Array.from(new Set(Object.values(rules).reduce((all, rule) => all.concat(rule.codes), [])));
      const savedIds = Array.from(new Set(saved.map((row) => row.objectId)));
      const conditions = [];
      if (codes.length) conditions.push("exists(select 1 from objectDefinition where code IN ("
        + codes.map((code) => "'" + code + "'").join(',') + ') and id = insuredObject.objectDefinitionId)');
      if (savedIds.length) conditions.push('id IN (' + savedIds.join(',') + ')');
      const objects = [], ids = new Set();
      const page = (index) => repositoryRequest('RepoInsuredObject', {
        operation: 'GET', filter: 'lifePolicyId = ' + Number(policyId) + ' AND (' + conditions.join(' OR ') + ')',
        include: ['ObjectDefinition'], size: 100, page: index
      }, undefined, current).then((result) => {
        if (!current()) return false;
        const rows = strictOutData(result, 'objetos asegurados');
        rows.forEach((row) => {
          const definition = row && row.ObjectDefinition;
          if (!row || !affectedId(row.id) || ids.has(Number(row.id)) || Number(row.lifePolicyId) !== Number(policyId)
            || !definition || !affectedId(definition.id) || Number(definition.id) !== Number(row.objectDefinitionId)
            || !affectedId(definition.formId) || (!codes.includes(definition.code) && !savedIds.includes(Number(row.id)))) {
            throw new Error('Respuesta de objetos asegurados inválida.');
          }
          ids.add(Number(row.id)); objects.push(row);
        });
        return rows.length === 100 ? page(index + 1) : true;
      });
      return (conditions.length ? page(0) : Promise.resolve(true)).then((complete) => {
        if (!current() || !complete) return false;
        if (saved.some((entry) => !objects.some((object) => Number(object.id) === entry.objectId
          && Number(object.objectDefinitionId) === entry.typeId))) throw new Error('No se pudo verificar un objeto asociado.');
        Object.assign(affected, { rules, saved, objects, loaded: true });
        return true;
      });
    }).catch((error) => {
      if (current()) affected.error = error.message || 'No fue posible cargar los objetos afectados.';
      return false;
    }).then((complete) => {
      if (current()) { affected.loading = false; notifyAffected(); }
      return complete;
    });
  };
  const AFFECTED_FORMS_SECTION = 'ObjetosAfectados';
  const affectedFormConfig = (current) => repositoryRequest('DoQuery', {
    sql: "SELECT [id], [name], [data] FROM dbo.[Table] WHERE [name] = N'CustomClaimAffectedObjectConfig';"
  }, undefined, current).then((result) => {
    if (!current()) return null;
    const tables = strictOutData(result, 'configuracion de objetos afectados');
    if (tables.length !== 1 || !tables[0] || tables[0].name !== 'CustomClaimAffectedObjectConfig') {
      throw new Error('No se encontro una configuracion unica de objetos afectados.');
    }
    const matrix = JSON.parse(tables[0].data);
    if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) {
      throw new Error('La configuracion de objetos afectados no tiene el formato esperado.');
    }
    const indexes = {};
    matrix[0].forEach((header, index) => {
      const name = typeof header === 'string' ? header.trim() : '';
      const key = name.toLowerCase();
      if (!name || indexes[key] !== undefined) throw new Error('La configuracion de objetos afectados no tiene encabezados validos.');
      indexes[key] = index;
    });
    ['Lob', 'ProductCode', 'CoverageCode', 'FormId', 'Description', 'MaxObjects', 'Active'].forEach((name) => {
      if (indexes[name.toLowerCase()] === undefined) throw new Error('La configuracion de objetos afectados no contiene ' + name + '.');
    });
    return matrix.slice(1).map((row) => {
      if (!Array.isArray(row) || row.length !== matrix[0].length) throw new Error('La configuracion de objetos afectados no tiene filas validas.');
      return {
        lob: row[indexes.lob], product: row[indexes.productcode], coverage: row[indexes.coveragecode],
        formId: row[indexes.formid], description: row[indexes.description], maximum: row[indexes.maxobjects], active: row[indexes.active]
      };
    });
  });
  const affectedFormRuleMap = (rows, claim) => {
    const policy = claim && claim.Policy;
    if (!policy) throw new Error('No hay una poliza valida para configurar objetos afectados.');
    const productCode = String(policy.productCode || policy.Product && policy.Product.code || '').trim();
    const lob = String(policy.lob || '').trim();
    if (!lob || !productCode) throw new Error('La poliza no contiene ramo o producto validos.');
    const parsed = rows.map((row) => {
      const active = String(row.active === true ? 'true' : row.active === false ? 'false' : row.active || '').trim().toLowerCase();
      const rowLob = String(row.lob || '').trim();
      const product = String(row.product || '').trim();
      const coverage = String(row.coverage || '').trim();
      const description = String(row.description || '').trim();
      const formId = Number(row.formId);
      const maximum = row.maximum === null || row.maximum === undefined ? '' : String(row.maximum).trim();
      if (!['true', 'false'].includes(active) || !rowLob || !product || !coverage || !description
        || !affectedId(formId) || (maximum !== '' && !affectedId(maximum))) {
        throw new Error('La configuracion de objetos afectados contiene valores invalidos.');
      }
      if (active !== 'true' || rowLob !== lob) return null;
      return { product, coverage, formId, description, max: maximum === '' ? null : Number(maximum) };
    }).filter(Boolean);
    const rules = {};
    (policy.Coverages || []).forEach((coverage) => {
      const coverageCode = coverage && coverage.code != null ? String(coverage.code).trim() : '';
      const matches = parsed.filter((rule) => (rule.product === '*' || rule.product === productCode)
        && (rule.coverage === '*' || rule.coverage === coverageCode));
      const score = (rule) => Number(rule.product !== '*') + Number(rule.coverage !== '*');
      if (!matches.length || !affectedId(coverage.id)) return;
      const winners = {};
      matches.forEach((rule) => {
        const current = winners[rule.formId];
        if (!current || score(rule) > score(current)) {
          winners[rule.formId] = rule;
          return;
        }
        if (score(rule) === score(current) && (rule.description !== current.description || rule.max !== current.max)) {
          throw new Error('Hay configuraciones de objetos afectados en conflicto para el mismo formulario.');
        }
      });
      rules[Number(coverage.id)] = Object.keys(winners).map((formId) => winners[formId])
        .sort((left, right) => left.description.localeCompare(right.description));
    });
    return rules;
  };
  const readAffectedFormInstances = (raw) => {
    const outer = customFormOuter(raw);
    let stored = outer[AFFECTED_FORMS_SECTION];
    if (stored === null || stored === undefined || stored === '') return [];
    try { stored = typeof stored === 'string' ? JSON.parse(stored) : stored; }
    catch (error) { throw new Error('Los objetos afectados guardados no son compatibles.'); }
    if (!Array.isArray(stored)) throw new Error('Los objetos afectados guardados no son compatibles.');
    const keys = {};
    return stored.map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || typeof entry.key !== 'string'
        || !/^AffectedObject_\d+_\d+_\d+$/.test(entry.key) || keys[entry.key]
        || !affectedId(entry.coverageId) || !affectedId(entry.formId) || typeof entry.description !== 'string'
        || !entry.description.trim() || !Array.isArray(entry.fields)) {
        throw new Error('Los objetos afectados guardados no son compatibles.');
      }
      keys[entry.key] = true;
      return { key: entry.key, coverageId: Number(entry.coverageId), formId: Number(entry.formId),
        description: entry.description.trim(), formName: typeof entry.formName === 'string' ? entry.formName : '',
        fields: entry.fields };
    });
  };
  const writeAffectedFormInstances = (raw, instances) => {
    const outer = customFormOuter(raw);
    outer[AFFECTED_FORMS_SECTION] = JSON.stringify(instances);
    return JSON.stringify(outer);
  };
  const affectedFormSummary = (fields) => (fields || []).filter((field) => field && field.type !== 'hidden'
    && Array.isArray(field.userData) && field.userData.some((value) => String(value || '').trim()))
    .slice(0, 3).map((field) => (field.label || field.name) + ': ' + field.userData
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== '').join(', ')).join(' | ') || 'Sin datos registrados';
  const loadAffectedFormInstances = () => {
    const claim = currentClaimRef.current;
    resetAffected();
    const operation = affected.operation;
    const current = () => affectedCurrent(claim) && operation === affected.operation;
    if (!current()) return Promise.resolve(false);
    affected.loading = true; notifyAffected();
    return affectedFormConfig(current).then((config) => {
      if (!current() || !config) return false;
      const rules = affectedFormRuleMap(config, claim);
      const saved = readAffectedFormInstances(claim.jCustomForms).filter((entry) =>
        coverageRowsRef.current.some((coverage) => coverage.id === entry.coverageId));
      Object.assign(affected, { rules, saved, loaded: true });
      return true;
    }).catch((error) => {
      if (current()) affected.error = error.message || 'No fue posible cargar los objetos afectados.';
      return false;
    }).then((complete) => {
      if (current()) { affected.loading = false; notifyAffected(); }
      return complete;
    });
  };
  // Remote form names are dynamic; resolve the two known business labels, never guessed field IDs.
  const affectedLabelKey = (label) => String(label || '').replace(/<[^>]*>/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const collectiveDeathFields = (claim, object) => {
    if (String(claim && claim.Policy && claim.Policy.lob || '') !== '20'
      || affectedLabelKey(object && object.description) !== 'persona asegurada colectivo') return null;
    const fields = object && Array.isArray(object.fields) ? object.fields : [];
    return [
      { label: 'fecha de fallecimiento', labels: ['f fallecimiento', 'fecha fallecimiento', 'fecha de fallecimiento'] },
      { label: 'causa de fallecimiento', labels: ['causa fallecimiento', 'causa de fallecimiento'] }
    ].map((spec) => {
      const matches = fields.filter((field) => field && spec.labels.includes(affectedLabelKey(field.label)));
      const field = matches.length === 1 && matches[0].name
        && fields.filter((candidate) => candidate && candidate.name === matches[0].name).length === 1 ? matches[0] : null;
      return { label: spec.label, field };
    });
  };
  const prepareAffectedFormFields = (claim, object) => {
    const deathFields = collectiveDeathFields(claim, object);
    const names = deathFields ? deathFields.filter((item) => item.field).map((item) => item.field.name) : [];
    return (object.fields || []).map((field) => names.includes(field.name)
      ? Object.assign({}, field, { required: false, label: String(field.label || '').replace(/\*/g, '') }) : Object.assign({}, field));
  };
  const applyOptionalDeathControls = (claim, object, container) => {
    const fields = collectiveDeathFields(claim, object);
    const names = fields ? fields.filter((item) => item.field).map((item) => item.field.name) : [];
    if (container && names.length) Array.prototype.forEach.call(container.querySelectorAll('input, select, textarea'), (control) => {
      if (!names.includes(control.name)) return;
      control.required = false;
      control.removeAttribute('required');
      control.setAttribute('aria-required', 'false');
      control.setAttribute('data-oa-skip-validation', 'true');
    });
    return names;
  };
  const collectiveDeathPaymentError = (claim, object) => {
    const fields = collectiveDeathFields(claim, object);
    if (!fields) return '';
    if (fields.some((item) => !item.field)) return 'No se pudieron identificar los campos de fallecimiento del objeto afectado. Revise su formulario antes de registrar el pago.';
    const missing = fields.filter((item) => !Array.isArray(item.field.userData)
      || !item.field.userData.some((value) => value !== null && value !== undefined && String(value).trim() !== '')).map((item) => item.label);
    return missing.length ? 'El objeto afectado seleccionado no tiene ' + missing.join(' y ')
      + '. Complete estos datos en Objeto afectado para registrar el pago.' : '';
  };
  const openAffectedFormModal = (coverageId, entry, selectedRule) => {
    const claim = currentClaimRef.current;
    const configured = affected.rules[Number(coverageId)] || [];
    const rule = selectedRule || configured.find((item) => entry && item.formId === entry.formId) || (entry ? {
      formId: entry.formId, description: entry.description, max: null
    } : null);
    if (!affectedCurrent(claim) || !rule || affected.write) return Promise.resolve(false);
    const $ = window.jQuery || window.$;
    if (!$ || !$.fn || typeof $.fn.formRender !== 'function') {
      affected.saveMessage = 'El renderizador de formularios personalizados no está disponible.';
      notifyAffected();
      return Promise.resolve(false);
    }
    affected.write = { claim, opening: true }; affected.saveMessage = ''; notifyAffected();
    const current = () => affectedCurrent(claim) && affected.write && affected.write.claim === claim;
    return repositoryRequest('GetForms', { filter: 'id=' + Number(rule.formId) }, undefined, current).then((result) => {
      if (!current()) return false;
      const rows = strictOutData(result, 'formulario de objeto afectado');
      if (rows.length !== 1 || !rows[0] || Number(rows[0].id) !== Number(rule.formId)
        || typeof rows[0].name !== 'string' || typeof rows[0].json !== 'string') {
        throw new Error('No se encontro el formulario configurado para el objeto afectado.');
      }
      const definition = JSON.parse(rows[0].json);
      const fields = hydrateCustomFormFields(definition, entry ? entry.fields : []);
      affected.modal = { coverageId: Number(coverageId), formId: Number(rule.formId), description: rule.description,
        max: rule.max, key: entry ? entry.key : null, formName: rows[0].name, fields: fields,
        logic: typeof rows[0].logic === 'string' ? rows[0].logic : '', renderer: null, error: '' };
      affected.write = null; notifyAffected();
      return true;
    }).catch((error) => {
      if (current()) { affected.write = null; affected.saveMessage = error.message || 'No fue posible abrir el formulario.'; notifyAffected(); }
      return false;
    });
  };
  const closeAffectedFormModal = () => {
    if (affected.write) return;
    affected.modal = null; notifyAffected();
  };
  const saveAffectedFormModal = () => {
    const claim = currentClaimRef.current, modal = affected.modal;
    if (!modal || modal.renderFailed || affected.write || !affectedCurrent(claim) || !canEdit(claim)) return Promise.resolve(false);
    let fields;
    try {
      fields = modal.renderer && Array.isArray(modal.renderer.userData)
        ? JSON.parse(JSON.stringify(modal.renderer.userData)) : JSON.parse(JSON.stringify(modal.fields));
      const container = document.getElementById('resumenAffectedObjectForm');
      const optionalNames = applyOptionalDeathControls(claim, modal, container);
      // Keep remote schema metadata intact; optionality is local to saving this view.
      fields = fields.map((field) => {
        const original = modal.fields.find((item) => item.name === field.name);
        return original && optionalNames.includes(field.name)
          ? Object.assign({}, field, { required: original.required, label: original.label }) : field;
      });
      const configuredInvalid = [];
      if (container) {
        (modal.fields || fields).forEach((field) => {
          if (!field || !field.required || optionalNames.includes(field.name)) return;
          const controls = Array.prototype.filter.call(container.querySelectorAll('input, select, textarea'), (control) => control.name === field.name);
          const visible = controls.filter((control) => {
            const group = control.closest('.form-group');
            return !group || window.getComputedStyle(group).display !== 'none';
          });
          if (visible.length && visible.every((control) => String(control.value || '').trim() === '')) {
            configuredInvalid.push.apply(configuredInvalid, visible);
          }
        });
      }
      const nativeInvalid = container && typeof container.checkValidity === 'function' && !container.checkValidity()
        ? Array.prototype.filter.call(container.querySelectorAll('input, select, textarea'), (control) => !control.validity.valid) : [];
      const labelRequiredInvalid = container ? Array.prototype.reduce.call(container.querySelectorAll('.form-group'), (controls, group) => {
        if (window.getComputedStyle(group).display === 'none') return controls;
        const label = group.querySelector('label');
        const control = group.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea');
        const requiredByLabel = label && /\*/.test(label.textContent || '');
        if (!requiredByLabel || !control || control.getAttribute('data-oa-skip-validation') === 'true' || String(control.value || '').trim() !== '') return controls;
        controls.push(control);
        return controls;
      }, []) : [];
      const invalid = Array.from(new Set(nativeInvalid.concat(configuredInvalid, labelRequiredInvalid)));
      if (invalid.length) {
        container.classList.add('resumen-validation-attempted');
        Array.prototype.forEach.call(container.querySelectorAll('.resumen-field-invalid'), (group) => {
          group.classList.remove('resumen-field-invalid');
        });
        invalid.forEach((control) => {
          const group = control.closest('.form-group');
          if (group) group.classList.add('resumen-field-invalid');
        });
        if (invalid[0] && typeof invalid[0].focus === 'function') invalid[0].focus();
        throw new Error('Complete los campos requeridos del objeto afectado.');
      }
      if (container) {
        container.classList.remove('resumen-validation-attempted');
        Array.prototype.forEach.call(container.querySelectorAll('.resumen-field-invalid'), (group) => {
          group.classList.remove('resumen-field-invalid');
        });
      }
    } catch (error) {
      modal.error = error.message || 'Revise los campos requeridos.'; notifyAffected(); return Promise.resolve(false);
    }
    const write = { claim, modal }; affected.write = write; modal.error = ''; notifyAffected();
    let savedAffectedForms = '';
    const current = () => affectedCurrent(claim) && affected.write === write;
    return repositoryRequest('RepoClaim', claimReadPayload(Number(claim.id)), undefined, current).then((result) => {
      if (!current()) return false;
      const fresh = responseRows(result, 'el siniestro').find((row) => row && Number(row.id) === Number(claim.id));
      if (!fresh) throw new Error('No se encontro el siniestro antes de guardar el objeto afectado.');
      const instances = readAffectedFormInstances(fresh.jCustomForms);
      const index = modal.key ? instances.findIndex((item) => item.key === modal.key) : -1;
      if (modal.key && index < 0) throw new Error('El objeto afectado fue modificado por otra sesion.');
      if (index < 0 && modal.max !== null && instances.filter((item) => item.coverageId === modal.coverageId && item.formId === modal.formId).length >= modal.max) {
        throw new Error('Se alcanzo el limite de objetos afectados para esta cobertura.');
      }
      const prefix = 'AffectedObject_' + modal.coverageId + '_' + modal.formId + '_';
      const nextNumber = instances.reduce((maximum, item) => {
        if (item.key.indexOf(prefix) !== 0) return maximum;
        const value = Number(item.key.slice(prefix.length));
        return Number.isSafeInteger(value) ? Math.max(maximum, value) : maximum;
      }, 0) + 1;
      const instance = { key: modal.key || 'AffectedObject_' + modal.coverageId + '_' + modal.formId + '_' + nextNumber,
        coverageId: modal.coverageId, formId: modal.formId, description: modal.description,
        formName: modal.formName, fields: fields };
      if (index >= 0) instances[index] = instance; else instances.push(instance);
      const entity = serializeEntity(fresh);
      entity.jCustomForms = writeAffectedFormInstances(fresh.jCustomForms, instances);
      savedAffectedForms = entity.jCustomForms;
      return repositoryRequest('RepoClaim', { operation: 'UPDATE', entity: entity });
    }).then((result) => {
      if (!current()) return false;
      if (!result || result.ok !== true) throw new Error(result && result.msg || 'No fue posible guardar el objeto afectado.');
      // Only jCustomForms changed, so keep the loaded claim and refresh this grid in memory.
      claim.jCustomForms = savedAffectedForms;
      affected.saved = readAffectedFormInstances(savedAffectedForms);
      affected.modal = null; affected.saveMessage = 'Objeto afectado guardado.'; notifyAffected();
      return true;
    }).catch((error) => {
      if (current()) { modal.error = error.message || 'No fue posible guardar el objeto afectado.'; notifyAffected(); }
      return false;
    }).then((outcome) => {
      if (affected.write === write) { affected.write = null; notifyAffected(); }
      return outcome;
    });
  };
  const affectedFormContract = [
    ['ownerName', 'text', null], ['ownerIdNumber', 'text', null],
    ['countryCode', 'select', 'cmbPais'], ['provinceCode', 'select', 'cmbProvincia'],
    ['cityCode', 'select', 'cmbMunicipio'], ['corregimientoCode', 'select', 'cmbSector'],
    ['description', 'textarea', 'Descripcion']
  ];
  const affectedIsBond = (object) => object && object.ObjectDefinition && object.ObjectDefinition.code === 'OBJFIANZA';
  const parseAffectedFields = (form, object) => {
    const definitions = JSON.parse(form.json), saved = JSON.parse(object.jValues);
    const bond = affectedIsBond(object);
    const contract = bond ? [['description', 'textarea', 'desc_objeto_afianzado']] : affectedFormContract;
    if (!Array.isArray(definitions) || definitions.length !== contract.length || !Array.isArray(saved)) {
      throw new Error('Invalid affected form contract');
    }
    const values = new Map();
    saved.forEach((field) => {
      // Bond issuance includes unnamed layout and duplicate unrelated fields; inspect only its evidenced source.
      if (bond && (!field || field.name !== 'desc_objeto_afianzado')) return;
      if (bond && (!Array.isArray(field.userData) || field.userData.length !== 1 || typeof field.userData[0] !== 'string')) {
        throw new Error('Invalid bond description');
      }
      if (!field || typeof field.name !== 'string' || values.has(field.name)
        || (field.userData !== undefined && !Array.isArray(field.userData))
        || (field.userData || []).some((value) => value != null && !['string', 'number', 'boolean'].includes(typeof value))) {
        throw new Error('Invalid stored field');
      }
      values.set(field.name, field.userData || []);
    });
    if (bond && !values.has('desc_objeto_afianzado')) throw new Error('Missing bond description');
    return contract.map(([name, type, source]) => {
      const matches = definitions.filter((field) => field && field.name === name);
      if (matches.length !== 1 || matches[0].type !== type || typeof matches[0].label !== 'string'
        || !matches[0].label.trim() || matches[0].multiple === true
        || (bond && matches[0].subtype !== undefined && matches[0].subtype !== 'textarea')) throw new Error('Invalid affected field: ' + name);
      // This dedicated form supplies structure, never defaults, dummy choices or executable logic.
      // Ownership is enriched separately through the authorized contact command for Fire policies.
      const stored = source ? values.get(source) || [] : [];
      const value = stored.map((raw) => raw == null || raw === '' ? EMPTY_VALUE
        : String(raw) + (type === 'select' ? ' (código guardado)' : '')).join(', ') || EMPTY_VALUE;
      return { name, label: matches[0].label, value };
    });
  };
  const affectedObjectLabel = (object) => {
    let fields = [];
    try { const parsed = JSON.parse(object.jValues); if (Array.isArray(parsed)) fields = parsed; } catch (_) {}
    for (const name of (affectedIsBond(object) ? ['desc_objeto_afianzado'] : ['Descripcion', 'direccionexacta', 'txtBarriadas'])) {
      const matches = fields.filter((field) => field && field.name === name);
      if (matches.length !== 1 || !Array.isArray(matches[0].userData)) continue;
      const values = matches[0].userData;
      if (values.length === 1 && typeof values[0] === 'string' && values[0].trim()) return values[0].trim() + ' — #' + object.id;
    }
    return (object.ObjectDefinition.name || 'Objeto asegurado') + ' — #' + object.id;
  };
  const enrichAffectedFields = (fields, object, current) => {
    // Isolated catalog reads only; native form.logic has policy-writing side effects.
    const tables = { cmbTipoObjeto: 'TablaTipoObjeto', cmbCategoriaActividad: 'TablaCategoriaActividad',
      cmbUsoBien: 'TablaUsoBien', cmbTipoMaterial: 'TablaTipoMaterial', cmbZonaCresta: 'ZonaCresta' };
    const geography = { cmbPais: ['RepoCountryCatalog', 'code', 'cmbPais'],
      cmbProvincia: ['RepoStateCatalog', 'countryCode', 'cmbPais'],
      cmbMunicipio: ['RepoCityCatalog', 'stateCode', 'cmbProvincia'],
      cmbSector: ['RepoSectorCatalog', 'cityCode', 'cmbMunicipio'] };
    const saved = new Map(JSON.parse(object.jValues).map((field) => [field.name, field.userData || []]));
    const scalar = (name) => {
      const values = saved.get(name) || [];
      return values.length === 1 && values[0] != null && ['string', 'number'].includes(typeof values[0])
        && String(values[0]).trim() ? String(values[0]) : null;
    };
    return Promise.all(fields.map((field) => {
      const sourceName = (affectedFormContract.find((entry) => entry[0] === field.name) || [null, null, field.name])[2];
      const raw = scalar(sourceName), geo = geography[sourceName], table = tables[sourceName];
      if (!current() || raw === null || (!geo && !table) || !field.value.includes(' (código guardado)')) return Promise.resolve(field);
      const parent = geo && scalar(geo[2]);
      if (geo && parent === null) return Promise.resolve(field);
      const payload = geo ? { operation: 'GET', filter: '[' + geo[1] + "]='" + parent.replace(/'/g, "''") + "'" } : { table };
      return repositoryRequest(geo ? geo[0] : 'GetFullTable', payload, undefined, current).then((result) => {
        if (!current()) return field;
        const data = strictOutData(result, 'catálogo de objeto'), options = geo ? data : data.slice(1);
        if (!geo && (!Array.isArray(data[0]) || data[0].length < 2)) return field;
        const matches = [];
        for (const entry of options) {
          const code = geo ? entry && entry.code : Array.isArray(entry) && entry[0];
          const label = geo ? entry && entry.name : Array.isArray(entry) && entry[1];
          if (!['string', 'number'].includes(typeof code) || (typeof code === 'number' && !Number.isFinite(code))
            || typeof label !== 'string' || !label.trim()) return field;
          const normalized = geo ? String(code) : String(code).trim();
          if (normalized !== raw) continue;
          if (geo && geo[1] !== 'code' && Object.prototype.hasOwnProperty.call(entry, geo[1])
            && String(entry[geo[1]]) !== parent) return field;
          matches.push(label.trim());
        }
        return matches.length === 1 ? Object.assign({}, field, { value: matches[0] }) : field;
      }).catch(() => field);
    }));
  };

  const enrichAffectedOwner = (fields, object, claim, current) => {
    const policy = claim && claim.Policy;
    // Fire business contract: the owner is the policy holder. Other branches remain unavailable.
    if (!current() || !policy || String(policy.lob) !== '1' || !affectedId(policy.holderId)
      || !affectedId(policy.id) || Number(object.lifePolicyId) !== Number(policy.id)
      || Number(claim.lifePolicyId) !== Number(policy.id)
      || !object.ObjectDefinition || !['1_9_DT_INCENDIO', 'DT_INCENDIO_V3'].includes(object.ObjectDefinition.code)) {
      return Promise.resolve(fields);
    }
    const holderId = Number(policy.holderId);
    return repositoryRequest('GetContacts', { filter: 'ID=' + holderId }, undefined, current).then((result) => {
      if (!current() || Number(policy.holderId) !== holderId) return fields;
      const rows = strictOutData(result, 'propietario');
      if (rows.length !== 1 || !rows[0] || !affectedId(rows[0].id) || Number(rows[0].id) !== holderId
        || rows[0].restricted || rows[0].restrictedForUser) return fields;
      const contact = rows[0], safeName = {};
      ['FullName', 'fullName', 'name', 'middlename', 'surname1', 'surname2'].forEach((key) => {
        if (typeof contact[key] === 'string') safeName[key] = contact[key].trim();
      });
      const name = personName(safeName);
      // cnp is the evidenced identity document; nationalId is a Cobis identifier, not a substitute.
      const document = typeof contact.cnp === 'string' && contact.cnp.trim() ? contact.cnp.trim() : EMPTY_VALUE;
      return fields.map((field) => field.name === 'ownerName' ? Object.assign({}, field, { value: name || EMPTY_VALUE })
        : field.name === 'ownerIdNumber' ? Object.assign({}, field, { value: document }) : field);
    }).catch(() => fields);
  };

  const loadAffectedPreview = () => {
    const claim = currentClaimRef.current, operation = ++affected.previewOperation;
    affected.fields = []; affected.previewError = ''; affected.previewLoading = false;
    const object = affected.objects.find((row) => Number(row.id) === affected.objectId
      && Number(row.objectDefinitionId) === affected.typeId);
    const current = () => affectedCurrent(claim) && operation === affected.previewOperation;
    if (!current() || !object || !coverageRowsRef.current.some((row) => row.id === affected.coverageId)) {
      notifyAffected(); return Promise.resolve(false);
    }
    const bond = affectedIsBond(object), formName = bond ? 'CustomClaimAffectedBondForm' : 'CustomClaimAffectedObjectForm';
    affected.previewLoading = true; notifyAffected();
    return repositoryRequest('GetForms', { filter: "name = '" + formName + "'" }, undefined, current)
      .then((result) => {
        if (!current()) return false;
        const rows = strictOutData(result, 'formulario');
        if (rows.length !== 1 || !rows[0] || !affectedId(rows[0].id) || rows[0].name !== formName) {
          throw new Error('Invalid form response');
        }
        const fields = parseAffectedFields(rows[0], object);
        return (bond ? Promise.resolve(fields) : enrichAffectedFields(fields, object, current)
          .then((resolved) => enrichAffectedOwner(resolved, object, claim, current))).then((resolved) => {
          if (!current()) return false;
          affected.fields = resolved; return true;
        });
      }).catch(() => {
        if (current()) affected.previewError = 'No fue posible mostrar los datos: verifique ' + formName
          + (bond ? ' y su campo description.' : ' y sus siete campos.');
        return false;
      }).then((complete) => {
        if (current()) { affected.previewLoading = false; notifyAffected(); }
        return complete;
      });
  };
  const selectAffected = (field, value) => {
    if (affected.write) return Promise.resolve(false);
    affected.previewOperation += 1;
    affected.fields = []; affected.previewError = ''; affected.previewLoading = false;
    const id = affectedId(value) ? Number(value) : null;
    if (field === 'coverageId') {
      affected.coverageId = affected.rules[id] && coverageRowsRef.current.some((row) => row.id === id) ? id : null;
      affected.typeId = null; affected.objectId = null;
    } else if (field === 'typeId') {
      affected.typeId = affected.coverageId && affectedAvailableObjects().some((row) => Number(row.objectDefinitionId) === id) ? id : null;
      affected.objectId = null;
    } else if (field === 'objectId') {
      const object = affectedAvailableObjects().find((row) => Number(row.id) === id);
      affected.objectId = object ? id : null;
      affected.typeId = object ? Number(object.objectDefinitionId) : null;
      return loadAffectedPreview();
    }
    notifyAffected(); return Promise.resolve(true);
  };

  const showAffectedDetails = (entry) => {
    if (affected.write || !affected.saved.includes(entry)) return Promise.resolve(false);
    if (!affected.detail) affected.detail = {
      coverageId: affected.coverageId, typeId: affected.typeId, objectId: affected.objectId,
      fields: affected.fields.slice(), previewError: affected.previewError, previewLoading: affected.previewLoading
    };
    Object.assign(affected, { coverageId: entry.coverageId, typeId: entry.typeId, objectId: entry.objectId });
    return loadAffectedPreview();
  };
  const returnAffectedList = () => {
    if (!affected.detail) return;
    const previous = affected.detail;
    affected.previewOperation += 1;
    Object.assign(affected, previous, { detail: null, previewLoading: false });
    // The detail request invalidated the earlier selection request; restart it rather than restoring a stuck empty preview.
    if (previous.previewLoading && affected.objectId) return loadAffectedPreview();
    notifyAffected();
  };

  // Confirm the physical contract before any SQL mutation; repository DTOs alone are not schema evidence.
  const affectedSchema = {
    Claim: { id: 'int', lifePolicyId: 'int', closed: 'bit' },
    LifePolicy: { id: 'int', lob: 'nvarchar', productCode: 'nvarchar' },
    LifeCoverage: { id: 'int', lifePolicyId: 'int', code: 'nvarchar' },
    InsuredObject: { id: 'int', lifePolicyId: 'int', objectDefinitionId: 'int' },
    ObjectDefinition: { id: 'int', code: 'nvarchar' },
    Table: { id: 'int', name: 'nvarchar', data: 'nvarchar' }
  };
  const verifyAffectedSchema = (current) => repositoryRequest('DoQuery', { sql:
    "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME IN ('Claim','LifePolicy','LifeCoverage','InsuredObject','ObjectDefinition','Table');"
  }, undefined, current).then((result) => {
    if (!current()) return false;
    const columns = strictOutData(result, 'esquema de objetos afectados');
    Object.keys(affectedSchema).forEach((table) => Object.keys(affectedSchema[table]).forEach((column) => {
      const matches = columns.filter((row) => row.TABLE_SCHEMA === 'dbo' && row.TABLE_NAME === table && row.COLUMN_NAME === column);
      if (matches.length !== 1 || matches[0].DATA_TYPE !== affectedSchema[table][column]) {
        throw new Error('Guardado no disponible: verificar esquema ' + table + '.' + column + '.');
      }
    }));
    return true;
  });
  const buildAffectedSaveSql = (ids) => {
    if (['claimId', 'policyId', 'coverageId', 'objectId', 'typeId'].some((key) => !affectedId(ids[key])
      || Number(ids[key]) > 2147483647)) throw new Error('Identificadores inválidos.');
    // Only validated integer literals enter this batch. All business rules are read again under locks.
    return `SET XACT_ABORT ON;
SET LOCK_TIMEOUT 10000;
BEGIN TRY
 BEGIN TRANSACTION;
 DECLARE @claim int=${Number(ids.claimId)}, @policy int=${Number(ids.policyId)}, @coverage int=${Number(ids.coverageId)},
  @object int=${Number(ids.objectId)}, @definition int=${Number(ids.typeId)}, @status nvarchar(30)=N'conflict',
  @config nvarchar(max), @data nvarchar(max), @tableId int, @lob nvarchar(max), @product nvarchar(max),
  @coverageCode nvarchar(max), @objectCode nvarchar(max), @max bigint, @score int, @created nvarchar(40);
 IF (SELECT COUNT(*) FROM dbo.[Table] WITH (UPDLOCK, HOLDLOCK) WHERE [name]=N'CustomClaimAffectedObjectConfig')<>1
  OR (SELECT COUNT(*) FROM dbo.[Table] WITH (UPDLOCK, HOLDLOCK) WHERE [name]=N'CustomClaimAffectedObjects')<>1
  THROW 50001, 'Affected object tables are not unique.', 1;
 SELECT @config=[data] FROM dbo.[Table] WITH (UPDLOCK, HOLDLOCK) WHERE [name]=N'CustomClaimAffectedObjectConfig';
 SELECT @data=[data], @tableId=[id] FROM dbo.[Table] WITH (UPDLOCK, HOLDLOCK) WHERE [name]=N'CustomClaimAffectedObjects';
 IF ISJSON(@config)<>1 OR ISJSON(@data)<>1 OR @config IS NULL OR @data IS NULL
  THROW 50002, 'Invalid affected object JSON.', 1;
 IF LEFT(LTRIM(@config),1)<>N'[' OR LEFT(LTRIM(@data),1)<>N'['
  THROW 50002, 'Invalid affected object matrix.', 1;
 IF EXISTS(SELECT 1 FROM OPENJSON(@config) r WHERE r.[type]<>4)
  OR EXISTS(SELECT 1 FROM OPENJSON(@data) r WHERE r.[type]<>4)
  THROW 50002, 'Invalid affected object rows.', 1;
 IF EXISTS(SELECT 1 FROM OPENJSON(@config) r WHERE (SELECT COUNT(*) FROM OPENJSON(r.[value]))<>6)
  OR EXISTS(SELECT 1 FROM OPENJSON(@data) r WHERE (SELECT COUNT(*) FROM OPENJSON(r.[value]))<>6)
  OR EXISTS(SELECT 1 FROM OPENJSON(@config) r CROSS APPLY OPENJSON(r.[value]) c
   WHERE c.[type]<>1 AND NOT (r.[key]<>N'0' AND c.[key]=N'4' AND c.[type]=0))
  OR EXISTS(SELECT 1 FROM OPENJSON(@data) r CROSS APPLY OPENJSON(r.[value]) c WHERE c.[type]<>1)
  THROW 50002, 'Invalid affected object cells.', 1;
 IF ISNULL(JSON_VALUE(@config,'$[0][0]'),N'')<>N'Lob' OR ISNULL(JSON_VALUE(@config,'$[0][1]'),N'')<>N'ProductCode'
  OR ISNULL(JSON_VALUE(@config,'$[0][2]'),N'')<>N'CoverageCode' OR ISNULL(JSON_VALUE(@config,'$[0][3]'),N'')<>N'ObjectDefinitionCodes'
  OR ISNULL(JSON_VALUE(@config,'$[0][4]'),N'')<>N'MaxObjects' OR ISNULL(JSON_VALUE(@config,'$[0][5]'),N'')<>N'Active'
  OR ISNULL(JSON_VALUE(@data,'$[0][0]'),N'')<>N'ClaimId' OR ISNULL(JSON_VALUE(@data,'$[0][1]'),N'')<>N'LifePolicyId'
  OR ISNULL(JSON_VALUE(@data,'$[0][2]'),N'')<>N'LifeCoverageId' OR ISNULL(JSON_VALUE(@data,'$[0][3]'),N'')<>N'InsuredObjectId'
  OR ISNULL(JSON_VALUE(@data,'$[0][4]'),N'')<>N'ObjectDefinitionId' OR ISNULL(JSON_VALUE(@data,'$[0][5]'),N'')<>N'CreatedAt'
  OR JSON_QUERY(@config,'$[0]') IS NULL OR JSON_QUERY(@data,'$[0]') IS NULL
  THROW 50002, 'Invalid affected object headers.', 1;
 IF NOT EXISTS(SELECT 1 FROM dbo.Claim WITH (UPDLOCK, HOLDLOCK) WHERE id=@claim AND lifePolicyId=@policy AND closed=0)
  THROW 50003, 'Claim is closed or does not belong to this policy.', 1;
 SELECT @lob=lob, @product=productCode FROM dbo.LifePolicy WITH (HOLDLOCK) WHERE id=@policy;
 SELECT @coverageCode=code FROM dbo.LifeCoverage WITH (HOLDLOCK) WHERE id=@coverage AND lifePolicyId=@policy;
 SELECT @objectCode=d.code FROM dbo.InsuredObject o WITH (HOLDLOCK)
  JOIN dbo.ObjectDefinition d WITH (HOLDLOCK) ON d.id=o.objectDefinitionId
  WHERE o.id=@object AND o.lifePolicyId=@policy AND d.id=@definition;
 IF @lob IS NULL OR @product IS NULL OR @coverageCode IS NULL OR @objectCode IS NULL
  THROW 50003, 'Object or coverage does not belong to this policy.', 1;
 DECLARE @rules TABLE (ruleId int IDENTITY(1,1), product nvarchar(max), coverage nvarchar(max), codes nvarchar(max), maximum nvarchar(max), score int);
 IF EXISTS(SELECT 1 FROM OPENJSON(@config) r WHERE r.[key]<>N'0' AND
  (LTRIM(RTRIM(JSON_VALUE(r.[value],'$[5]'))) COLLATE Latin1_General_100_BIN2 NOT IN (N'true',N'false')
   OR LTRIM(RTRIM(JSON_VALUE(r.[value],'$[0]')))=N'' OR LTRIM(RTRIM(JSON_VALUE(r.[value],'$[1]')))=N''
   OR LTRIM(RTRIM(JSON_VALUE(r.[value],'$[2]')))=N''))
  THROW 50004, 'Invalid configuration.', 1;
 INSERT @rules (product,coverage,codes,maximum,score) SELECT LTRIM(RTRIM(JSON_VALUE(r.[value],'$[1]'))), LTRIM(RTRIM(JSON_VALUE(r.[value],'$[2]'))),
  JSON_VALUE(r.[value],'$[3]'), CASE WHEN EXISTS(SELECT 1 FROM OPENJSON(r.[value]) c WHERE c.[key]=N'4' AND c.[type]=0)
   THEN N'' ELSE LTRIM(RTRIM(JSON_VALUE(r.[value],'$[4]'))) END,
  CASE WHEN LTRIM(RTRIM(JSON_VALUE(r.[value],'$[1]')))=N'*' THEN 0 ELSE 1 END
   + CASE WHEN LTRIM(RTRIM(JSON_VALUE(r.[value],'$[2]')))=N'*' THEN 0 ELSE 1 END
 FROM OPENJSON(@config) r WHERE r.[key]<>N'0'
  AND LTRIM(RTRIM(JSON_VALUE(r.[value],'$[5]'))) COLLATE Latin1_General_100_BIN2=N'true'
  AND LTRIM(RTRIM(JSON_VALUE(r.[value],'$[0]'))) COLLATE Latin1_General_100_BIN2=@lob COLLATE Latin1_General_100_BIN2;
 IF EXISTS(SELECT 1 FROM @rules WHERE codes IS NULL OR codes=N'' OR codes LIKE N'%,,%' OR LEFT(codes,1)=N',' OR RIGHT(codes,1)=N','
  OR codes COLLATE Latin1_General_100_BIN2 LIKE N'%[^A-Za-z0-9_, ]%'
  OR maximum IS NULL OR (maximum<>N'' AND (maximum COLLATE Latin1_General_100_BIN2 LIKE N'%[^0-9]%'
   OR TRY_CONVERT(bigint,maximum) IS NULL OR TRY_CONVERT(bigint,maximum)<=0 OR TRY_CONVERT(bigint,maximum)>9007199254740991)))
  THROW 50004, 'Invalid object codes or maximum.', 1;
 DECLARE @codes TABLE (ruleId int, code nvarchar(4000) COLLATE Latin1_General_100_BIN2);
 INSERT @codes SELECT r.ruleId,LTRIM(RTRIM(c.[value])) FROM @rules r
 CROSS APPLY OPENJSON(N'["'+REPLACE(r.codes,N',',N'","')+N'"]') c;
 IF EXISTS(SELECT 1 FROM @codes WHERE code=N'' OR code LIKE N'%[^A-Za-z0-9_]%')
  THROW 50004, 'Invalid object code token.', 1;
 DELETE FROM @rules WHERE NOT ((product=N'*' OR product COLLATE Latin1_General_100_BIN2=@product COLLATE Latin1_General_100_BIN2)
  AND (coverage=N'*' OR coverage COLLATE Latin1_General_100_BIN2=@coverageCode COLLATE Latin1_General_100_BIN2));
 SELECT @score=MAX(score) FROM @rules;
 IF @score IS NULL THROW 50004, 'No applicable configuration.', 1;
 IF EXISTS(SELECT 1 FROM @rules a JOIN @rules b ON a.score=b.score WHERE a.score=@score
  AND ((a.maximum=N'' AND b.maximum<>N'') OR (a.maximum<>N'' AND b.maximum=N'')
   OR TRY_CONVERT(bigint,a.maximum)<>TRY_CONVERT(bigint,b.maximum)
   OR EXISTS(SELECT code FROM @codes WHERE ruleId=a.ruleId EXCEPT SELECT code FROM @codes WHERE ruleId=b.ruleId)
   OR EXISTS(SELECT code FROM @codes WHERE ruleId=b.ruleId EXCEPT SELECT code FROM @codes WHERE ruleId=a.ruleId)))
  THROW 50004, 'Conflicting affected object rules.', 1;
 IF NOT EXISTS(SELECT 1 FROM @rules r JOIN @codes c ON c.ruleId=r.ruleId WHERE r.score=@score
  AND c.code=@objectCode COLLATE Latin1_General_100_BIN2)
  THROW 50004, 'Object type is not allowed.', 1;
 SELECT TOP (1) @max=CASE WHEN maximum=N'' THEN NULL ELSE CONVERT(bigint,maximum) END FROM @rules WHERE score=@score;
 IF EXISTS(SELECT 1 FROM OPENJSON(@data) r CROSS APPLY OPENJSON(r.[value]) c WHERE r.[key]<>N'0' AND c.[key] IN (N'0',N'1',N'2',N'3',N'4')
  AND (c.[value]=N'' OR c.[value] COLLATE Latin1_General_100_BIN2 LIKE N'%[^0-9]%' OR TRY_CONVERT(int,c.[value]) IS NULL OR TRY_CONVERT(int,c.[value])<=0))
  THROW 50005, 'Invalid saved association identifiers.', 1;
 IF EXISTS(SELECT 1 FROM OPENJSON(@data) r WHERE r.[key]<>N'0'
  AND TRY_CONVERT(datetimeoffset,JSON_VALUE(r.[value],'$[5]'),127) IS NULL)
  THROW 50005, 'Invalid association timestamp.', 1;
 IF EXISTS(SELECT 1 FROM OPENJSON(@data) r WHERE r.[key]<>N'0'
  GROUP BY TRY_CONVERT(int,JSON_VALUE(r.[value],'$[0]')),TRY_CONVERT(int,JSON_VALUE(r.[value],'$[2]')),TRY_CONVERT(int,JSON_VALUE(r.[value],'$[3]')) HAVING COUNT(*)>1)
  THROW 50005, 'Duplicate saved associations.', 1;
 IF EXISTS(SELECT 1 FROM OPENJSON(@data) r WHERE r.[key]<>N'0' AND TRY_CONVERT(int,JSON_VALUE(r.[value],'$[0]'))=@claim AND
  (TRY_CONVERT(int,JSON_VALUE(r.[value],'$[1]'))<>@policy
   OR NOT EXISTS(SELECT 1 FROM dbo.LifeCoverage c WITH (HOLDLOCK) WHERE c.id=TRY_CONVERT(int,JSON_VALUE(r.[value],'$[2]')) AND c.lifePolicyId=@policy)
   OR NOT EXISTS(SELECT 1 FROM dbo.InsuredObject o WITH (HOLDLOCK) WHERE o.id=TRY_CONVERT(int,JSON_VALUE(r.[value],'$[3]')) AND o.lifePolicyId=@policy
    AND o.objectDefinitionId=TRY_CONVERT(int,JSON_VALUE(r.[value],'$[4]')))))
  THROW 50005, 'Saved association does not belong to this policy.', 1;
 IF EXISTS(SELECT 1 FROM OPENJSON(@data) r WHERE r.[key]<>N'0'
  AND TRY_CONVERT(int,JSON_VALUE(r.[value],'$[0]'))=@claim AND TRY_CONVERT(int,JSON_VALUE(r.[value],'$[2]'))=@coverage
  AND TRY_CONVERT(int,JSON_VALUE(r.[value],'$[3]'))=@object) SET @status=N'duplicate';
 ELSE IF @max IS NOT NULL AND (SELECT COUNT(*) FROM OPENJSON(@data) r WHERE r.[key]<>N'0'
  AND TRY_CONVERT(int,JSON_VALUE(r.[value],'$[0]'))=@claim AND TRY_CONVERT(int,JSON_VALUE(r.[value],'$[2]'))=@coverage)>=@max SET @status=N'limit';
 ELSE BEGIN
  SET @created=CONVERT(nvarchar(33),SYSUTCDATETIME(),126)+N'Z';
  DECLARE @row nvarchar(max)=N'["'+CONVERT(nvarchar(12),@claim)+N'","'+CONVERT(nvarchar(12),@policy)+N'","'
   +CONVERT(nvarchar(12),@coverage)+N'","'+CONVERT(nvarchar(12),@object)+N'","'+CONVERT(nvarchar(12),@definition)+N'","'+@created+N'"]';
  UPDATE dbo.[Table] SET [data]=JSON_MODIFY([data],'append $',JSON_QUERY(@row)) WHERE id=@tableId AND name=N'CustomClaimAffectedObjects';
  IF @@ROWCOUNT<>1 THROW 50006, 'Association update was not unique.', 1;
  SET @status=N'saved';
 END;
 COMMIT TRANSACTION;
 SET LOCK_TIMEOUT -1;
 SELECT @status AS [status], @claim AS ClaimId, @coverage AS LifeCoverageId, @object AS InsuredObjectId;
END TRY
BEGIN CATCH
 IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
 SET LOCK_TIMEOUT -1;
 THROW;
END CATCH;`;
  };
  const saveAffectedObject = () => {
    const claim = currentClaimRef.current;
    if (affected.write || !affectedCurrent(claim) || !canEdit(claim) || affected.loading || !affected.loaded) return Promise.resolve(false);
    const ids = { claimId: claim.id, policyId: claim.Policy && claim.Policy.id, coverageId: affected.coverageId,
      objectId: affected.objectId, typeId: affected.typeId };
    const rule = affected.rules[ids.coverageId];
    if (!rule || !affectedAvailableObjects().some((row) => Number(row.id) === ids.objectId && Number(row.objectDefinitionId) === ids.typeId)) return Promise.resolve(false);
    const write = { claim }, current = () => affectedCurrent(claim) && affected.write === write;
    affected.write = write; affected.saveMessage = ''; notifyAffected();
    let dispatched = false;
    return verifyAffectedSchema(current).then((valid) => {
      if (!valid || !current() || !canEdit(claim)) return null;
      const sql = buildAffectedSaveSql(ids);
      dispatched = true;
      return repositoryRequest('DoQuery', { sql, timeout: 20 }, undefined, current);
    }).then((result) => {
      if (!current()) return false;
      const rows = strictOutData(result, 'guardado de objeto afectado');
      if (rows.length !== 1 || !rows[0] || !['saved', 'duplicate', 'limit'].includes(rows[0].status)
        || Number(rows[0].ClaimId) !== Number(ids.claimId) || Number(rows[0].LifeCoverageId) !== Number(ids.coverageId)
        || Number(rows[0].InsuredObjectId) !== Number(ids.objectId)) throw new Error('Respuesta de guardado no verificada.');
      const status = rows[0].status;
      return loadAffectedObjects().then((loaded) => {
        if (current()) affected.saveMessage = (status === 'saved' ? 'Objeto afectado agregado.' : status === 'duplicate'
          ? 'Este objeto ya está asociado a la cobertura.' : 'Se alcanzó el límite de objetos de esta cobertura.')
          + (loaded ? '' : ' No fue posible actualizar la lista; vuelva a consultar.');
        return status === 'saved' && loaded;
      });
    }).catch((error) => {
      if (!current()) return false;
      if (!dispatched) { affected.saveMessage = error.message; return false; }
      // A timeout or malformed envelope can follow a committed write. Never automatically retry it.
      return loadAffectedObjects().then(() => {
        if (current()) affected.saveMessage = 'No se pudo confirmar el guardado. Revise los objetos asociados antes de volver a agregar; no se reintentó la operación.';
        return false;
      });
    }).then((result) => {
      if (affected.write === write) { affected.write = null; notifyAffected(); }
      return result;
    });
  };
  const groupAffectedFields = (fields) => {
    const object = affected.objects.find((row) => Number(row.id) === affected.objectId);
    const groups = [ { title: affectedIsBond(object) ? 'Datos de la fianza' : 'Datos del inmueble', fields: [] }, { title: 'Ubicación', fields: [] }, { title: 'Datos adicionales', fields: [] } ];
    const property = ['ownerName', 'ownerIdNumber', 'description', 'cmbTipoObjeto', 'txtSADisplay', 'txtSA', 'txtFinca', 'txtRollo', 'txtDoc', 'cmbCategoriaActividad', 'cmbUsoBien', 'cmbTipoMaterial', 'txtArea', 'txtCantidadPisos', 'Descripcion'];
    const location = ['countryCode', 'provinceCode', 'cityCode', 'corregimientoCode', 'cmbPais', 'cmbProvincia', 'cmbMunicipio', 'cmbSector', 'txtEdificios', 'manzana', 'aptoocasa', 'calleoavenida', 'cmbZonaCresta', 'direccionexacta', 'cmbBarriadas', 'cmbEdificios', 'txtBarriadas'];
    fields.forEach((field) => groups[property.includes(field.name) ? 0 : location.includes(field.name) ? 1 : 2].fields.push(
      Object.assign({}, field, { wide: ['description', 'Descripcion', 'direccionexacta', 'txtMotivoRenovacion'].includes(field.name) })));
    return groups.filter((group) => group.fields.length);
  };

  const changeActiveTab = (key) => {
    if (newClaimMode && key !== 'general') {
      setError('Cree el siniestro antes de acceder a las demás pestañas.');
      return;
    }
    setActiveTab(key);
    if (key === 'recoveries') loadRecoveries(currentClaimRef.current);
    if (key === 'comments') loadComments();
    if (key === 'documents') loadDocuments();
    if (key === 'affected') loadAffectedFormInstances();
  };
  const recoveryClaimCurrent = (claim) => mountedRef.current && currentClaimRef.current === claim
    && routeClaimId() === Number(claim.id);
  const recoveryFormChanged = (field, value) => {
    if (!recovery.form || recovery.write) return;
    recovery.form[field] = value;
    renderRecoveryForm((count) => count + 1);
  };
  const closeRecoveryModal = () => {
    if (recovery.write) return false;
    recovery.form = null; setRecoveryModalOpen(false); return true;
  };
  const recoveryBlocked = (claim) => {
    const config = window.global && window.global.configProfile && window.global.configProfile.Claim || {};
    if (config.salvageFormId) return true;
    if (config.disabledTabs === undefined || config.disabledTabs === null) return false;
    if (!Array.isArray(config.disabledTabs)) return true;
    return config.disabledTabs.some((rule) => {
      if (!rule || rule.name !== 'salvage') return false;
      if (!rule.condition) return true;
      const expression = typeof rule.condition === 'string'
        ? rule.condition.replace(/_cla\b/g, 'cla').replace(/_pol\b/g, 'pol') : '_';
      return /_/.test(expression) || evaluateCustomFormCondition(expression, claim, true);
    });
  };
  const recoverySessionCurrent = (session) => recovery.form === session && recoveryClaimCurrent(session.claim);
  const openRecoveryModal = () => {
    const claim = currentClaimRef.current;
    if (!claim || !canEdit(claim) || !recoveryClaimCurrent(claim) || recovery.write
      || !recovery.typesLoaded || !recovery.types.length) {
      if (claim && !canEdit(claim)) setRecoveryError('Debe reabrir el siniestro antes de registrar una recuperación.');
      return Promise.resolve(false);
    }
    if (recoveryBlocked(claim)) {
      setRecoveryError('Esta configuración requiere el módulo nativo.');
      return Promise.resolve(false);
    }
    recovery.currencies = [];
    recovery.form = { claim: claim, currenciesLoaded: false, buyerOptions: [], recovererOptions: [],
      contactVersion: { buyerId: 0, recovererId: 0 } };
    setRecoveryModalOpen(true); renderRecoveryForm((count) => count + 1);
    const session = recovery.form;
    setRecoveryError('');
    return repositoryRequest('RepoCurrency', { operation: 'GET' }, undefined,
      () => recoverySessionCurrent(session)).then((result) => {
      if (!recoverySessionCurrent(session)) return false;
      const seen = {};
      recovery.currencies = recoveryData(result, 'Catálogo de monedas').filter((row) => row && row.enabled).map((row) => {
        const code = typeof row.code === 'string' ? row.code.trim().toUpperCase() : '';
        if (!/^[A-Z]{3}$/.test(code) || seen[code]) throw new Error('Catálogo de monedas incompatible.');
        seen[code] = true; return Object.assign({}, row, { code: code });
      });
      session.currenciesLoaded = true;
      renderRecoveryForm((count) => count + 1); return true;
    }).catch((caught) => {
      if (recoverySessionCurrent(session)) {
        recovery.currencies = []; session.currency = undefined;
        setRecoveryError(caught.message || 'No fue posible cargar monedas.'); renderRecoveryForm((count) => count + 1);
      }
      return false;
    });
  };
  const searchRecoveryContacts = (field, queryValue) => {
    const session = recovery.form;
    const query = String(queryValue || '').trim();
    if (!session || (field !== 'buyerId' && field !== 'recovererId')) return Promise.resolve(false);
    const options = field === 'buyerId' ? 'buyerOptions' : 'recovererOptions';
    const version = ++session.contactVersion[field];
    if (!query) {
      session[options] = session[field] ? session[options].filter((row) => row.value === String(session[field]) && !row.disabled) : [];
      renderRecoveryForm((count) => count + 1); return Promise.resolve(false);
    }
    const current = () => recoverySessionCurrent(session) && session.contactVersion[field] === version;
    const profile = window.global && window.global.configProfile || {};
    return repositoryRequest('GetContacts', { filter: contactSearchFilter(query, profile), size: 10 }, undefined, current).then((result) => {
      if (!current()) return false;
      const seen = {};
      session[options] = recoveryData(result, 'Respuesta de contactos').map((row) => claimantOption(row, false)).filter((row) => {
        if (!row) return false;
        if (seen[row.value]) throw new Error('Respuesta de contactos incompatible.');
        seen[row.value] = true; return true;
      });
      renderRecoveryForm((count) => count + 1); return true;
    }).catch((caught) => {
      if (current()) setRecoveryError(caught.message || 'No fue posible buscar contactos.');
      return false;
    });
  };
  const buildRecoveryEntity = (claim, form, types, currencies) => {
    const claimIdValue = claim && Number(claim.id), rawType = form && form.type, rawCoverage = form && form.coverageId;
    const type = Number(rawType), coverageId = Number(rawCoverage);
    const currency = form && typeof form.currency === 'string' ? form.currency.trim().toUpperCase() : '';
    const coverageExists = claim && claim.Policy && Array.isArray(claim.Policy.Coverages)
      && claim.Policy.Coverages.some((row) => Number(row.id) === coverageId);
    if (!Number.isSafeInteger(claimIdValue) || claimIdValue <= 0 || rawType === null || rawType === undefined
      || rawType === '' || typeof rawType === 'boolean' || rawCoverage === null || rawCoverage === undefined
      || rawCoverage === '' || typeof rawCoverage === 'boolean' || !Array.isArray(types)
      || !types.some((row) => Number(row.value) === type) || !coverageExists
      || !Array.isArray(currencies) || !currencies.some((row) => row && row.code === currency)) {
      throw new Error('Tipo, cobertura o moneda de recuperación no válidos.');
    }
    const amount = (value, label) => {
      if (value === '' || value === null || value === undefined) return 0;
      const parsed = parseMoneyInput(value);
      const rounded = roundMoney(Number(parsed));
      if (parsed === null || !Number.isFinite(rounded) || rounded < 0
        || !Number.isSafeInteger(Math.round(rounded * 100))) throw new Error(label + ' no es válido.');
      return rounded;
    };
    const income = amount(form.income, 'Ingreso'), expenses = amount(form.expenses, 'Gastos');
    if (form.Retentions && (!Array.isArray(form.Retentions) || form.Retentions.length)
      || form.Additions && (!Array.isArray(form.Additions) || form.Additions.length)) {
      throw new Error('Los ajustes no están habilitados en esta vista.');
    }
    const entity = { claimId: claimIdValue, Retentions: [], jRetentions: '[]', Additions: [],
      type: type, coverageId: coverageId };
    const optionalId = (value, field) => {
      if (value === '' || value === null || value === undefined) return;
      if (!positiveIdText(value)) throw new Error(field + ' no es válido.');
      entity[field] = String(value);
    };
    optionalId(form.buyerId, 'buyerId'); optionalId(form.recovererId, 'recovererId');
    if (form.start) {
      const start = typeof form.start === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(form.start)
        ? new Date(form.start) : null;
      if (!start || !Number.isFinite(start.getTime()) || start.toISOString().slice(0, 19) !== form.start.slice(0, 19)) {
        throw new Error('La fecha de inicio no es válida.');
      }
      entity.start = start.toISOString();
    }
    const netIncome = roundMoney(income - expenses);
    if (!Number.isSafeInteger(Math.round(netIncome * 100))) throw new Error('El ingreso neto no es válido.');
    return Object.assign(entity, { currency: currency, income: income, retentions: 0,
      additions: 0, expenses: expenses, netIncome: netIncome });
  };
  const submitRecovery = (form) => {
    if (documents.saving) return Promise.resolve(false);
    const claim = currentClaimRef.current;
    const claimIdValue = claim && Number(claim.id);
    if (recovery.write || !claim || !recoveryClaimCurrent(claim)
      || !canEdit(claim)
      || recovery.form !== form || form.claim !== claim || !form.currenciesLoaded || !recovery.typesLoaded
      || recoveryBlocked(claim)) {
      setRecoveryError(claim && !canEdit(claim)
        ? 'Debe reabrir el siniestro antes de registrar una recuperación.'
        : 'La recuperación ya no está disponible para registrar.');
      return Promise.resolve(false);
    }
    let entity;
    try { entity = buildRecoveryEntity(claim, form, recovery.types, recovery.currencies); }
    catch (caught) { setRecoveryError(caught.message); return Promise.resolve(false); }
    const owner = { claim: claim, form: form };
    recovery.write = owner; recovery.created = null; setRecoverySaving(true); setRecoveryError('');
    const current = () => recovery.write === owner && recoveryClaimCurrent(claim)
      && (owner.created || recovery.form === form && !recoveryBlocked(claim));
    return repositoryRequest('RepoSalvage', { operation: 'ADD', entity: entity }, undefined, current).then((result) => {
      if (!current()) return false;
      const created = result && result.ok === true && Array.isArray(result.outData) ? result.outData.filter((row) =>
        row && Number(row.claimId) === claimIdValue && Number.isSafeInteger(Number(row.id)) && Number(row.id) > 0) : [];
      if (created.length !== 1) throw new Error(result && result.msg || 'No se confirmó la creación de la recuperación.');
      owner.created = true;
      recovery.created = Number(created[0].id); setRecoveryModalOpen(false);
      if (A.message && typeof A.message.success === 'function') A.message.success('Recuperación registrada');
      return loadRecoveries(claim).then((refreshed) => {
        if (!refreshed && current()) {
          setRecoveryError('Recuperación creada, pero no fue posible refrescar la lista.');
        }
        return true;
      });
    }).catch((caught) => {
      if (current()) setRecoveryError(caught.message || 'No fue posible registrar la recuperación.');
      return false;
    }).then((outcome) => {
      if (recovery.write === owner) {
        recovery.write = null;
        if (mountedRef.current) { setRecoverySaving(false); if (owner.created) recovery.form = null; }
      }
      return outcome;
    });
  };

  // The selected affected-form instance is read afresh before every financial movement.
  const financialObjects = React.useRef({ version: 0, claim: null, coverageId: null, rows: [], selectedId: null, loading: false, error: '' }).current;
  const [, renderFinancialObjects] = React.useState(0);
  const notifyFinancialObjects = () => { if (mountedRef.current) renderFinancialObjects((value) => value + 1); };
  const NO_FINANCIAL_OBJECTS = 'Debe registrar al menos un objeto afectado para esta cobertura antes de registrar reservas, pagos o gastos.';
  const readFinancialObjects = (claim, coverageId) => {
    if (!affectedCurrent(claim) || !affectedId(coverageId) || !claim.Policy
      || !(claim.Policy.Coverages || []).some((row) => Number(row.id) === Number(coverageId))) {
      return Promise.reject(new Error('El siniestro o la cobertura cambió. Recargue la información.'));
    }
    try {
      const objects = readAffectedFormInstances(claim.jCustomForms)
        .filter((entry) => Number(entry.coverageId) === Number(coverageId));
      if (!objects.length) return Promise.reject(new Error(NO_FINANCIAL_OBJECTS));
      return Promise.resolve(objects);
    } catch (error) {
      return Promise.reject(error);
    }
  };
  const loadFinancialObjects = (coverageId) => {
    const claim = currentClaimRef.current, version = ++financialObjects.version;
    Object.assign(financialObjects, { claim, coverageId: Number(coverageId), rows: [], selectedId: null, loading: !!coverageId, error: '' });
    notifyFinancialObjects();
    if (!coverageId) return Promise.resolve(false);
    return readFinancialObjects(claim, coverageId).then((rows) => {
      if (financialObjects.version !== version || !affectedCurrent(claim)) return false;
      financialObjects.rows = rows; return true;
    }).catch((error) => {
      if (financialObjects.version === version && affectedCurrent(claim)) financialObjects.error = error.message;
      return false;
    }).then((ok) => {
      if (financialObjects.version === version) { financialObjects.loading = false; notifyFinancialObjects(); }
      return ok;
    });
  };
  const selectFinancialObject = (value, section) => {
    financialObjects.selectedId = value == null ? null : String(value);
    if (!financialObjects.loading && financialObjects.rows.length) {
      const selected = financialObjects.rows.find((object) => object.key === financialObjects.selectedId);
      financialObjects.error = section === 'payments' && selected
        ? collectiveDeathPaymentError(currentClaimRef.current, selected) : '';
    }
    notifyFinancialObjects();
  };
  const selectFinancialCoverage = (coverageId) => {
    setPaymentCoverageId(coverageId);
    return loadFinancialObjects(coverageId);
  };
  const selectExpenseFinancialCoverage = (coverageId) => {
    setExpenseCoverageId(coverageId);
    return loadFinancialObjects(coverageId);
  };
  const financialObjectLabel = (object) => String(object && object.description || 'Objeto afectado')
    + ' — ' + String(object && object.key || 'Sin identificador');

  const paymentSpendingAvailable = (claim, coverageId, bucket) => {
    if (!claim || !Array.isArray(claim.Payouts)) return null;
    const movements = claim.Payouts.filter((row) => row && Number(row.claimId) === Number(claim.id)
      && Number(row.lifeCoverageId) === Number(coverageId) && row.reserveType === bucket
      && (bucket !== 'IN' || effectiveIndemnityMovement(row)));
    if (movements.some((row) => numericValue(row.reserved) === null)) return null;
    const available = movements.reduce((sum, row) => sum + Number(row.reserved), 0);
    const rounded = roundMoney(available);
    return Number.isFinite(rounded) ? rounded : null;
  };
  const buildFinancialPaymentEntity = (claim, coverageId, amount, concept, bucket) => {
    const entity = buildReserveEntity(claim, coverageId, 'INCREASE', bucket, amount, concept);
    const coverage = normalizeCoverageRows(claim).find((row) => row.id === Number(coverageId));
    if (!coverage) throw new Error('La cobertura seleccionada no pertenece al siniestro.');
    const available = paymentSpendingAvailable(claim, coverageId, bucket);
    if (!Number.isFinite(available) || entity.amount > available) {
      throw new Error('El monto supera el saldo reservado disponible; registre primero la reserva en Cobertura / Reservas.');
    }
    return Object.assign({}, entity, { operation: 'PAY', reserved: -entity.amount, payed: entity.amount });
  };
  const buildPaymentReserveEntity = (claim, coverageId, amount, concept) => buildFinancialPaymentEntity(claim, coverageId, amount, concept, 'IN');
  const expenseAvailableForCoverage = (coverage) => paymentSpendingAvailable(currentClaimRef.current, coverage.id, 'EX');
  const buildExpenseReserveEntity = (claim, coverageId, amount, concept) => buildFinancialPaymentEntity(claim, coverageId, amount, concept, 'EX');

  const confirmedCommandResult = (result, fallback) => {
    const body = reserveResultPayload(result);
    if (!result || result.ok === false || (body && body.ok === false)) {
      throw new Error(body && body.msg ? body.msg : result && result.msg ? result.msg : fallback);
    }
    return body;
  };

  const startPaymentOperation = (errorSetter) => {
    if (documents.saving) return null;
    const reportError = typeof errorSetter === 'function' ? errorSetter : setPaymentError;
    if (paymentSavingRef.current) {
      reportError('Ya hay una operación de pago en curso.');
      return null;
    }
    const operationClaimId = currentClaimRef.current ? Number(currentClaimRef.current.id) : null;
    if (!operationClaimId || routeClaimId() !== operationClaimId) {
      reportError('El siniestro cambió. Recargue la información antes de continuar.');
      return null;
    }
    const operationId = paymentOperationRef.current + 1;
    paymentOperationRef.current = operationId;
    paymentSavingRef.current = true;
    setPaymentSaving(true);
    reportError('');
    return { operationId: operationId, claimId: operationClaimId };
  };

  const finishPaymentOperation = (context, outcome) => {
    if (context && paymentOperationRef.current === context.operationId) {
      paymentSavingRef.current = false;
      if (mountedRef.current) setPaymentSaving(false);
    }
    return outcome;
  };

  const readPaymentActionSnapshot = (claim, current, targetId, action) => Promise.all([
    repositoryRequest('RepoClaim', { operation: 'GET', filter: 'id=' + Number(claim.id), include: ['Payouts'], page: 0, size: 1 }, undefined, current),
    repositoryRequest('RepoClaimPayment', { operation: 'GET', filter: 'claimId=' + Number(claim.id), include: ['Process'], size: 0 }, undefined, current)
  ]).then((results) => {
    if (!current()) throw new Error('El siniestro cambió. Recargue la información.');
    if (results.some((result) => !result || result.ok !== true || !Array.isArray(result.outData))) {
      throw new Error('No fue posible verificar los movimientos y todas sus solicitudes.');
    }
    const claims = results[0].outData;
    if (claims.length !== 1 || Number(claims[0].id) !== Number(claim.id) || !Array.isArray(claims[0].Payouts)
      || Number(results[1].total) > results[1].outData.length) throw new Error('La consulta financiera está incompleta.');
    let scopedPayoutId = Number(targetId);
    if (action === 'REQUEST_REVERT') {
      const targets = results[1].outData.filter((request) => request && positiveIdText(request.id) === positiveIdText(targetId));
      const refs = targets.length === 1 ? paymentRequestPayoutIds(targets[0]) : [];
      if (refs.length !== 1) throw new Error('La solicitud no tiene una asociación única verificable.');
      scopedPayoutId = refs[0];
    }
    // Preserve every request for claim-wide association checks; resolve workflow only for the target.
    return Promise.all(results[1].outData.map((request) => {
      if (!request || !paymentRequestPayoutIds(request).includes(scopedPayoutId) || request.processId == null) return request;
      if (!positiveIdText(request.processId)) throw new Error('Identidad de proceso no válida.');
      const included = request.Process;
      if (included && (typeof included !== 'object' || Array.isArray(included)
        || (included.id != null && positiveIdText(included.id) !== positiveIdText(request.processId))
        || (included.entity != null && included.entity !== 'ClaimPayment')
        || (included.entityId != null && positiveIdText(included.entityId) !== positiveIdText(request.id))))
        throw new Error('La identidad del proceso de la solicitud es inconsistente.');
      if (included && (['EXECUTED', 'APPROVED'].includes(String(included.entityState || '').trim().toUpperCase())
        || String(included.isApproved).toLowerCase() === 'true' || String(included.finalizado).toLowerCase() === 'true'))
        throw new Error('Solicitud ejecutada, aprobada o finalizada; no se permite revertir.');
      return repositoryRequest('GetProcesses', { filter: 'id=' + Number(request.processId), page: 0, size: 0 }, undefined, current).then((result) => {
        const rows = result && result.outData;
        if (!result || result.ok !== true || !Array.isArray(rows) || rows.length !== 1 || Number(result.total) > 1
          || !rows[0] || !positiveIdText(rows[0].id) || positiveIdText(rows[0].id) !== positiveIdText(request.processId) || rows[0].entity !== 'ClaimPayment'
          || !positiveIdText(rows[0].entityId) || positiveIdText(rows[0].entityId) !== positiveIdText(request.id)) throw new Error('No se pudo verificar el proceso de la solicitud.');
        return Object.assign({}, request, { Process: rows[0] });
      });
    })).then((requests) => ({ claim: claims[0], requests: requests }));
  });
  const requestPaymentReversal = (requestId) => requestPaymentMovementAction(requestId, 'REQUEST_REVERT');
  const requestPaymentMovementAction = (payoutId, action) => {
    const claim = currentClaimRef.current;
    if (!claim || !canEdit(claim) || !positiveIdText(payoutId) || !['CANCEL', 'REVERT', 'REQUEST_REVERT'].includes(action)
      || !Modal || typeof Modal.confirm !== 'function') return Promise.resolve(false);
    const context = startPaymentOperation(setPaymentError);
    if (!context) return Promise.resolve(false);
    const current = () => mountedRef.current && currentClaimRef.current === claim && canEdit(claim)
      && routeClaimId() === context.claimId && paymentOperationRef.current === context.operationId;
    let requestAttempted = false;
    const refresh = (snapshot) => {
      if (current()) applyFinancialSnapshot(claim, Object.assign({}, snapshot.claim, { Payments: snapshot.requests }), context.claimId, true);
      return snapshot;
    };
    const validate = (snapshot) => {
      let requestId = action === 'REQUEST_REVERT' ? Number(payoutId) : null;
      let issue = requestId ? requestReversalIssue(snapshot.claim, snapshot.requests, requestId)
        : paymentActionIssue(snapshot.claim, snapshot.requests, payoutId, action);
      if (issue && action === 'REVERT') {
        const linked = snapshot.requests.filter((request) => paymentRequestPayoutIds(request).includes(Number(payoutId)));
        const active = linked.filter((request) => request.entityState !== 'REVERTED');
        if (active.length === 1) {
          const requestIssue = requestReversalIssue(snapshot.claim, snapshot.requests, active[0].id);
          if (!requestIssue) { requestId = Number(active[0].id); issue = ''; }
        }
      }
      if (issue) throw new Error(issue);
      return { snapshot: snapshot, requestId: requestId };
    };
    const reverseRequest = (snapshot, requestId) => {
      const issue = requestReversalIssue(snapshot.claim, snapshot.requests, requestId);
      if (issue) throw new Error(issue);
      const original = snapshot.requests.find((request) => Number(request.id) === requestId);
      const targetId = paymentRequestPayoutIds(original)[0], total = original.total;
      requestAttempted = true;
      return repositoryRequest('RevertClaimPayment', { claimPaymentId: requestId }, undefined, current).then((result) => {
        if (!result || result.ok !== true) throw new Error(result && result.msg || 'El servidor no confirmó la reversión de solicitud.');
        return readPaymentActionSnapshot(claim, current, payoutId, action);
      }).then((fresh) => {
        const matches = fresh.requests.filter((request) => Number(request.id) === requestId);
        if (matches.length !== 1 || matches[0].entityState !== 'REVERTED' || matches[0].total !== total
          || paymentRequestPayoutIds(matches[0]).length !== 1 || paymentRequestPayoutIds(matches[0])[0] !== targetId
          || paymentActionIssue(fresh.claim, fresh.requests, targetId, 'REVERT'))
          throw new Error('No se pudo verificar la compensación de la solicitud.');
        return refresh(fresh);
      });
    };
    return readPaymentActionSnapshot(claim, current, payoutId, action).then(validate).then((initial) => {
      if (!current()) return false;
      return new Promise((resolve) => {
        let handled = false;
        Modal.confirm({
          title: action === 'REQUEST_REVERT' ? '¿Revertir la solicitud #' + Number(payoutId) + '?' : (action === 'CANCEL' ? '¿Anular' : '¿Revertir') + ' el movimiento de pago #' + Number(payoutId) + '?',
          content: 'Siniestro #' + context.claimId + (initial.requestId
            ? '. Se revertirá la solicitud #' + initial.requestId + ' conservando un registro negativo.'
              + (action === 'REVERT' ? ' Después de verificar su compensación, se revertirá el movimiento. Si falla el segundo paso, se informará el resultado parcial.' : ' No se revertirá automáticamente el movimiento de pago.')
            : '. Se conservará el registro como Revertido, sin eliminarlo. Se volverán a verificar el estado y las solicitudes.'),
          okText: action === 'CANCEL' ? 'Anular' : 'Revertir', cancelText: 'Cancelar',
          onCancel: () => { if (!handled) { handled = true; resolve(false); } },
          onOk: () => {
            if (handled) return Promise.resolve(false);
            handled = true;
            return readPaymentActionSnapshot(claim, current, payoutId, action).then(validate).then((plan) => {
              if (plan.requestId !== initial.requestId) throw new Error('Las solicitudes cambiaron. Revise y confirme nuevamente.');
              return plan.requestId ? reverseRequest(plan.snapshot, plan.requestId) : plan.snapshot;
            }).then((snapshot) => {
              if (action === 'REQUEST_REVERT') return snapshot;
              // After compensation, fetch again before UndoPayment; the backend owns atomic race protection.
              return readPaymentActionSnapshot(claim, current, payoutId, action).then((fresh) => {
                const issue = paymentActionIssue(fresh.claim, fresh.requests, payoutId, action);
                if (issue) throw new Error(issue);
                const original = Object.assign({}, fresh.claim.Payouts.find((row) => Number(row.id) === Number(payoutId)));
                return repositoryRequest('UndoPayment', { lifeCoveragePayoutId: Number(payoutId) }, undefined, current).then((result) => {
                  if (!result || result.ok !== true) throw new Error(result && result.msg || 'El servidor no confirmó la reversión del movimiento.');
                  return readPaymentActionSnapshot(claim, current, payoutId, action);
                }).then((verified) => {
                  const matches = verified.claim.Payouts.filter((row) => Number(row.id) === Number(payoutId));
                  if (matches.length !== 1 || ![2, '2'].includes(matches[0].status)
                    || !['claimId', 'lifePolicyId', 'lifeCoverageId', 'reserveType', 'payed', 'reserved', 'requestedAmount']
                      .every((key) => matches[0][key] === original[key])) throw new Error('El resultado no pudo verificarse. Refresque antes de repetir la operación.');
                  return verified;
                });
              });
            }).then((snapshot) => {
              if (!current()) return false;
              refresh(snapshot); setPaymentRequestDetail(null); setPaymentError('');
              if (A.message && A.message.success) A.message.success(action === 'REQUEST_REVERT' ? 'Solicitud revertida. El movimiento de pago no se ha revertido.' : 'Movimiento de pago revertido.');
              return true;
            }).catch((error) => {
              const report = () => { if (current()) setPaymentError((requestAttempted ? 'Resultado parcial o no confirmado: revise las solicitudes antes de reintentar. ' : '') + error.message); return false; };
              return requestAttempted && current() ? readPaymentActionSnapshot(claim, current, payoutId, action).then(refresh).then(report, report) : report();
            }).then((outcome) => { resolve(outcome); return outcome; });
          }
        });
      });
    }).catch((error) => { if (current()) setPaymentError(error.message); return false; })
      .then((outcome) => finishPaymentOperation(context, outcome));
  };
  const approvePaymentMovement = (payoutId, bucket) => {
    const claim = currentClaimRef.current;
    const reportError = bucket === 'EX' ? setExpenseError : setPaymentError;
    const payout = claim && (claim.Payouts || []).find((row) => Number(row.id) === Number(payoutId));
    if (claim && (claim.Payouts || []).filter((row) => Number(row.id) === Number(payoutId)).length !== 1) {
      reportError('El movimiento no tiene una identidad única. Refresque la vista.'); return Promise.resolve(false);
    }
    if (!mountedRef.current || !claim || !canEdit(claim) || !payout || Number(payout.claimId) !== Number(claim.id)
      || payout.reserveType !== bucket || !(numericValue(payout.payed) > 0) || !(bucket === 'IN' ? [0, '0'] : [0, '0', 2, '2']).includes(payout.status)) {
      reportError('Seleccione un movimiento de pago pendiente de aprobación.'); return Promise.resolve(false);
    }
    const context = startPaymentOperation(reportError);
    if (!context) return Promise.resolve(false);
    return Promise.resolve().then(() => {
      if (!mountedRef.current || routeClaimId() !== context.claimId || paymentOperationRef.current !== context.operationId) return null;
      return exe('DoPayment', { lifeCoveragePayoutId: Number(payout.id) });
    }).then((result) => {
      if (!mountedRef.current || routeClaimId() !== context.claimId || paymentOperationRef.current !== context.operationId) return false;
      if (!result || result.ok !== true) throw new Error(result && result.msg || 'No fue posible aprobar el pago.');
      if (!mountedRef.current || paymentOperationRef.current !== context.operationId || routeClaimId() !== context.claimId) return false;
      return refreshFinancialData(context.claimId).then(() => {
        if (!mountedRef.current || paymentOperationRef.current !== context.operationId || routeClaimId() !== context.claimId) return false;
        if (A.message && A.message.success) A.message.success('Aprobación de pago procesada');
        return true;
      });
    }).catch((error) => {
      if (mountedRef.current && paymentOperationRef.current === context.operationId && routeClaimId() === context.claimId) reportError(error.message);
      return false;
    }).then((outcome) => finishPaymentOperation(context, outcome));
  };

  const createPaymentReserve = (coverageId, amount, concept) => {
    let entity;
    try {
      entity = buildPaymentReserveEntity(currentClaimRef.current, coverageId, amount, concept);
    } catch (caughtError) {
      setPaymentError(caughtError && caughtError.message ? caughtError.message : 'El pago no es válido.');
      return Promise.resolve(false);
    }
    const context = startPaymentOperation();
    if (!context) return Promise.resolve(false);
    let createdId = null;
    const objectClaim = currentClaimRef.current;
    const selectedObjectId = financialObjects.selectedId;
    return readFinancialObjects(objectClaim, entity.lifeCoverageId).then((objects) => {
      if (!affectedCurrent(objectClaim) || paymentOperationRef.current !== context.operationId) throw new Error('El siniestro cambió. Recargue la información.');
      const selected = objects.find((row) => row.key === selectedObjectId);
      if (financialObjects.claim !== objectClaim || financialObjects.coverageId !== Number(entity.lifeCoverageId) || !selected) {
        throw new Error('Seleccione un objeto afectado de esta cobertura antes de registrar el pago.');
      }
      const deathError = collectiveDeathPaymentError(objectClaim, selected);
      if (deathError) throw new Error(deathError);
      entity.jAffectedObjects = JSON.stringify(selected);
      return repositoryRequest('RepoLifeCoveragePayout', { operation: 'ADD', entity: entity });
    })
      .then((result) => {
        const body = confirmedCommandResult(result, 'No fue posible crear la reserva de pago.');
        const rows = body && body.outData !== undefined ? responseRows(body, 'la reserva de pago')
          : responseRows(result && result.outData, 'la reserva de pago');
        createdId = numericValue(rows[0] && rows[0].id);
        if (createdId === null) {
          const direct = result && result.outData && !Array.isArray(result.outData) ? result.outData : null;
          createdId = numericValue(direct && direct.id);
        }
        if (createdId === null) throw new Error('La reserva fue aceptada sin un identificador verificable.');
        if (!mountedRef.current || paymentOperationRef.current !== context.operationId
          || routeClaimId() !== context.claimId) return false;
        // Close after the server confirms creation; loading the claim can take longer due to custom forms.
        setSelectedPaymentReserveId(createdId);
        setPaymentCoverageId(null);
        setPaymentAmount('');
        setPaymentConcept('');
        setPaymentReserveModalOpen(false);
        return refreshFinancialData(context.claimId).then(() => {
          if (!mountedRef.current || paymentOperationRef.current !== context.operationId
            || routeClaimId() !== context.claimId) return false;
          if (A.message && typeof A.message.success === 'function') A.message.success('Reserva de pago registrada');
          return true;
        });
      })
      .catch((caughtError) => {
        if (mountedRef.current && paymentOperationRef.current === context.operationId
          && routeClaimId() === context.claimId) {
          setPaymentError(caughtError && caughtError.message
            ? caughtError.message : 'No fue posible crear la reserva de pago.');
        }
        return false;
      })
      .then((outcome) => finishPaymentOperation(context, outcome));
  };

  const createExpenseReserve = (coverageId, amount, concept) => {
    let entity;
    try {
      entity = buildExpenseReserveEntity(currentClaimRef.current, coverageId, amount, concept);
    } catch (caughtError) {
      setExpenseError(caughtError && caughtError.message ? caughtError.message : 'El gasto no es válido.');
      return Promise.resolve(false);
    }
    const context = startPaymentOperation(setExpenseError);
    if (!context) return Promise.resolve(false);
    let createdId = null;
    const objectClaim = currentClaimRef.current;
    const selectedObjectId = financialObjects.selectedId;
    return readFinancialObjects(objectClaim, entity.lifeCoverageId).then((objects) => {
      if (!affectedCurrent(objectClaim) || paymentOperationRef.current !== context.operationId) throw new Error('El siniestro cambió. Recargue la información.');
      const selected = objects.find((row) => row.key === selectedObjectId);
      if (financialObjects.claim !== objectClaim || financialObjects.coverageId !== Number(entity.lifeCoverageId) || !selected) {
        throw new Error('Seleccione un objeto afectado de esta cobertura antes de registrar el gasto.');
      }
      entity.jAffectedObjects = JSON.stringify(selected);
      return repositoryRequest('RepoLifeCoveragePayout', { operation: 'ADD', entity: entity });
    })
      .then((result) => {
        const body = confirmedCommandResult(result, 'No fue posible crear la reserva de gasto.');
        const rows = body && body.outData !== undefined ? responseRows(body, 'la reserva de gasto')
          : responseRows(result && result.outData, 'la reserva de gasto');
        createdId = numericValue(rows[0] && rows[0].id);
        if (createdId === null) {
          const direct = result && result.outData && !Array.isArray(result.outData) ? result.outData : null;
          createdId = numericValue(direct && direct.id);
        }
        if (createdId === null) throw new Error('La reserva fue aceptada sin un identificador verificable.');
        if (!mountedRef.current || paymentOperationRef.current !== context.operationId
          || routeClaimId() !== context.claimId) return false;
        // Close after the server confirms creation; loading the claim can take longer due to custom forms.
        setSelectedExpenseReserveId(createdId);
        setExpenseCoverageId(null);
        setExpenseAmount('');
        setExpenseConcept('');
        setExpenseReserveModalOpen(false);
        return refreshFinancialData(context.claimId).then(() => {
          if (!mountedRef.current || paymentOperationRef.current !== context.operationId
            || routeClaimId() !== context.claimId) return false;
          if (A.message && typeof A.message.success === 'function') A.message.success('Reserva de gasto registrada');
          return true;
        });
      })
      .catch((caughtError) => {
        if (mountedRef.current && paymentOperationRef.current === context.operationId
          && routeClaimId() === context.claimId) {
          setExpenseError(caughtError && caughtError.message
            ? caughtError.message : 'No fue posible crear la reserva de gasto.');
        }
        return false;
      })
      .then((outcome) => finishPaymentOperation(context, outcome));
  };

  const PAYMENT_TYPES = [
    { value: 'BEN', label: 'Beneficiario de la póliza' },
    { value: 'PRO', label: 'Proveedor' },
    { value: 'CES', label: 'Acreedor' },
    { value: 'OTH', label: 'Otros' }
  ];
  const paymentCatalogRef = React.useRef(null);
  const [, updatePaymentCatalog] = React.useState(0);
  const notifyPaymentCatalog = () => { if (mountedRef.current) updatePaymentCatalog((value) => value + 1); };
  const paymentCatalogCurrent = (session) => paymentCatalogRef.current === session && mountedRef.current
    && routeClaimId() === session.claimId && currentClaimRef.current === session.claim;
  const closePaymentCatalogs = () => { paymentCatalogRef.current = null; notifyPaymentCatalog(); };
  const paymentConfig = () => {
    const config = window.global && window.global.configProfile;
    if (!config || typeof config !== 'object') throw new Error('La configuración de SIS11 no está disponible. Reintente.');
    const claim = currentClaimRef.current;
    const raw = claim && claim.Policy && claim.Policy.Product && claim.Policy.Product.configJson;
    let product = {};
    if (raw) { try { product = JSON.parse(raw); } catch (error) { throw new Error('La configuración del producto no es válida.'); } }
    return Object.assign({}, config, { Main: product.Main || {} });
  };
  const paymentTypeOptions = () => {
    let config;
    try { config = paymentConfig(); } catch (error) { return []; }
    const disabled = config.Main && config.Main.disabledBeneficiaryTypes || [];
    return PAYMENT_TYPES.filter((item) => !Array.isArray(disabled) || disabled.indexOf(item.value) === -1);
  };
  const paymentBeneficiaryOptions = () => {
    const session = paymentCatalogRef.current;
    return session ? session.beneficiaries.map((row) => ({
      value: String(session.type === 'PRO' ? row.code : row.contactId),
      label: row.name + (session.type === 'BEN' ? ' — ' + row.percentage + '% (' + (row.type || '') + ')' : ''),
      disabled: !!(row.Contact && row.Contact.isMinor)
    })) : [];
  };
  const paymentAccountOptions = () => {
    const session = paymentCatalogRef.current;
    return session ? session.accounts.map((row) => ({ value: String(row.id),
      label: [row.accNo, row.name].filter(Boolean).join(' — ') || String(row.id) })) : [];
  };
  const paymentSourceAccountOptions = () => {
    const session = paymentCatalogRef.current;
    return session ? session.sourceAccounts.map((row) => ({ value: String(row.id),
      label: [row.accNo, row.name].filter(Boolean).join(' — ') || String(row.id) })) : [];
  };
  const canonicalPaymentType = (value) => {
    if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return null;
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const code = Number(value);
    return Number.isSafeInteger(code) && code >= 0 ? code : null;
  };
  const loadPaymentBeneficiaries = (type, query) => {
    const session = paymentCatalogRef.current;
    if (!session || !paymentCatalogCurrent(session) || paymentSavingRef.current) return;
    const version = ++session.version;
    session.type = type; session.contactId = null; session.providerCode = null;
    session.accountId = null; session.accounts = []; session.beneficiaries = [];
    session.method = session.claim.paymentMethodCode || null; session.managementType = 'DIRECT'; session.amount = ''; session.maximum = 0;
    session.error = ''; session.loading = true; session.accountLoading = false; session.info = ''; session.infoVersion = (session.infoVersion || 0) + 1; session.accountVersion += 1;
    notifyPaymentCatalog();
    return Promise.resolve().then(() => {
      if (!paymentTypeOptions().some((item) => item.value === type)) throw new Error('Tipo de beneficiario no disponible.');
      let result;
      if (type === 'BEN') result = repositoryRequest('GetCoverageBeneficiaries', { coverageId: session.coverageId });
      else if (type === 'CES') result = repositoryRequest('GetCessionBeneficiaries', { policyId: Number(session.claim.Policy.id) });
      else if (type === 'PRO') result = repositoryRequest('RepoProvider', { operation: 'GET', filter: 'active=1' });
      else if (type === 'OTH' && String(query || '').trim()) {
        result = repositoryRequest('GetContacts', { filter: contactSearchFilter(query, session.config), size: 10 });
      } else result = { ok: true, outData: [] };
      return result;
    }).then((result) => {
      if (!paymentCatalogCurrent(session) || session.version !== version) return;
      if (!result || result.ok !== true) throw new Error(result && result.msg || 'No se pudo cargar beneficiarios.');
      const rows = type === 'CES' ? result.outData && result.outData.beneficiaries : result.outData;
      if (!Array.isArray(rows)) throw new Error('Respuesta de beneficiarios incompatible.');
      const seen = {};
      session.beneficiaries = rows.map((row) => {
        const contactId = numericValue(type === 'OTH' ? row.id : row.contactId);
        const name = firstValue(type === 'OTH' ? row.FullName : row.name, personName(row.Contact));
        if (!row || !name || contactId === null || contactId <= 0 || (type === 'PRO' && !row.code)
          || (type === 'BEN' && (numericValue(row.percentage) === null || Number(row.percentage) <= 0 || Number(row.percentage) > 100))) {
          throw new Error('Registro de beneficiario incompatible.');
        }
        const key = type === 'PRO' ? row.code : contactId;
        if (seen[key]) throw new Error('Identificador de beneficiario duplicado.');
        seen[key] = true;
        return Object.assign({}, row, { contactId: contactId, name: String(name) });
      });
    }).catch((caught) => { if (paymentCatalogCurrent(session) && session.version === version) session.error = caught.message; })
    .then(() => { if (paymentCatalogCurrent(session) && session.version === version) { session.loading = false; notifyPaymentCatalog(); } });
  };
  const openPaymentCatalogs = (coverageId, payoutId, reserveType) => {
    const claim = currentClaimRef.current;
    if (!claim || !canEdit(claim)) return;
    const requestedReserveType = String(reserveType || 'IN').trim().toUpperCase() === 'EX' ? 'EX' : 'IN';
    const session = { claim: claim, claimId: Number(claim.id), coverageId: Number(coverageId), version: 0,
      accountVersion: 0, sourceAccountVersion: 0, payoutId: payoutId, settlementError: '', type: 'BEN', beneficiaries: [], accounts: [],
      sourceAccounts: [], paymentTypes: [], methods: [], loading: false, sourceAccountLoading: false, methodsLoading: true,
      error: '', sourceAccountError: '', methodsError: '', method: claim.paymentMethodCode || null, reserveType: requestedReserveType,
      paymentType: null, sourceAccountId: null, additionalBeneficiary: '', managementType: 'DIRECT' };
    paymentCatalogRef.current = session;
    notifyPaymentCatalog();
    return Promise.resolve().then(() => {
      session.config = paymentConfig();
      if (payoutId != null) {
        try { nativeSettlementAmount(claim, (claim.Payouts || []).find((row) => Number(row.id) === Number(payoutId))); }
        catch (caught) { session.settlementError = caught.message; }
      }
      if (session.config.Claim && session.config.Claim.accountFilter) throw new Error('La configuración Claim.accountFilter requiere adaptación segura; no se puede ejecutar esta solicitud.');
      if (session.config.Claim && session.config.Claim.defaultPaymentValues) throw new Error('La configuración Claim.defaultPaymentValues requiere adaptación antes de ejecutar la solicitud.');
      const type = paymentTypeOptions()[0];
      if (!type) throw new Error('No hay tipos de beneficiario habilitados.');
      return Promise.all([loadPaymentBeneficiaries(type.value), repositoryRequest('RepoPaymentMethodCatalog', { operation: 'GET' }).then((result) => {
        if (!paymentCatalogCurrent(session)) return;
        if (!result || result.ok !== true || !Array.isArray(result.outData)) throw new Error('No fue posible cargar los métodos de pago.');
        session.methods = result.outData.filter((row) => row && (!row.module || row.module === 'PAYMENT')
          && ['cheque', 'transferencia cuenta a cuenta'].indexOf(String(row.name || '').trim().toLowerCase()) !== -1);
        if (session.methods.some((row) => !row.code || !row.name)) throw new Error('Catálogo de métodos de pago incompatible.');
        if (session.method && !session.methods.some((row) => row.code === session.method)) throw new Error('El método de pago del siniestro no está disponible.');
      }), repositoryRequest('RepoPaymentTypeCatalog', { operation: 'GET' }).then((result) => {
        if (!paymentCatalogCurrent(session)) return;
        if (!result || result.ok !== true || !Array.isArray(result.outData)) throw new Error('No fue posible cargar los tipos de pago.');
        const seen = {};
        session.paymentTypes = result.outData.map((row) => {
          const code = canonicalPaymentType(row && row.code);
          if (!row || code === null || typeof row.name !== 'string' || row.name.trim() === '' || seen[code]) {
            throw new Error('Catálogo de tipos de pago incompatible.');
          }
          seen[code] = true;
          return Object.assign({}, row, { code: code });
        });
        const expectedName = session.reserveType === 'EX' ? 'gastos siniestros' : 'pago siniestro';
        const defaultPaymentType = session.paymentTypes.find((row) => String(row.name || '').trim().toLowerCase() === expectedName);
        session.paymentType = defaultPaymentType ? defaultPaymentType.code : null;
      })]);
    }).catch((caught) => { if (paymentCatalogCurrent(session)) session.methodsError = caught.message; })
    .then(() => { if (paymentCatalogCurrent(session)) { session.methodsLoading = false; notifyPaymentCatalog(); } });
  };
  const selectPaymentBeneficiary = (value) => {
    const session = paymentCatalogRef.current;
    if (!session || !paymentCatalogCurrent(session) || paymentSavingRef.current) return;
    const row = session.beneficiaries.find((item) => String(session.type === 'PRO' ? item.code : item.contactId) === String(value));
    const version = ++session.accountVersion;
    session.contactId = null; session.providerCode = null; session.accountId = null; session.accounts = []; session.additionalBeneficiary = '';
    session.method = session.claim.paymentMethodCode || null; session.error = ''; session.info = ''; session.infoVersion = (session.infoVersion || 0) + 1; session.accountLoading = false;
    if (!row || row.Contact && row.Contact.isMinor) { notifyPaymentCatalog(); return; }
    session.contactId = Number(row.contactId); session.providerCode = session.type === 'PRO' ? row.code : null;
    session.additionalBeneficiary = String(row.name).trim();
    session.contactName = row.Contact ? personName(row.Contact) : '';
    updatePaymentAmount(session);
    session.accountLoading = true; notifyPaymentCatalog();
    const policy = session.claim.Policy;
    const currency = String(policy.currency || '').trim().toUpperCase();
    return Promise.resolve().then(() => {
      if (!/^[A-Z]{3}$/.test(currency)) throw new Error('La moneda del siniestro no es válida.');
      session.policyAccounts = session.type === 'BEN' && Number(policy.holderId) === session.contactId
        && !(session.config.Claim && session.config.Claim.beneficiaryAllAccounts);
      const filter = 'holderId=' + session.contactId + " AND currency='" + currency + "'"
        + (session.policyAccounts ? ' AND lifePolicyId=' + Number(policy.id) : '');
      return Promise.all([repositoryRequest('RepoAccount', { operation: 'GET', filter: filter }),
        session.type === 'PRO' ? repositoryRequest('GetContacts', { filter: 'ID=' + session.contactId }) : Promise.resolve(null)
      ]).then((results) => {
        if (!paymentCatalogCurrent(session) || session.accountVersion !== version) return null;
        if (session.type === 'PRO') {
          const result = results[1];
          const contact = result && result.ok === true && Array.isArray(result.outData) ? result.outData[0] : null;
          if (!contact || Number(contact.id) !== session.contactId) throw new Error('No se pudo verificar el contacto del proveedor.');
          session.contactName = contact.FullName || personName(contact) || String(contact.id);
        }
        return results[0];
      });
    }).then((result) => {
      if (!paymentCatalogCurrent(session) || session.accountVersion !== version) return;
      if (!result || result.ok !== true || !Array.isArray(result.outData)) throw new Error('No fue posible cargar las cuentas.');
      session.accounts = result.outData.filter((account) => numericValue(account.id) > 0 && Number(account.holderId) === session.contactId
        && account.currency === currency && (!session.policyAccounts || Number(account.lifePolicyId) === Number(policy.id)));
    }).catch((caught) => { if (paymentCatalogCurrent(session) && session.accountVersion === version) session.error = caught.message; })
    .then(() => { if (paymentCatalogCurrent(session) && session.accountVersion === version) { session.accountLoading = false; notifyPaymentCatalog(); } });
  };
  const selectPaymentAccount = (value, reference) => {
    const session = paymentCatalogRef.current;
    if (!session || !paymentCatalogCurrent(session) || paymentSavingRef.current) return;
    session.accountId = session.accounts.some((row) => Number(row.id) === Number(value)) ? Number(value) : null;
    session.method = session.claim.paymentMethodCode || null;
    session.info = ''; session.infoVersion = (session.infoVersion || 0) + 1;
    session.error = '';
    const version = ++session.accountVersion;
    const formula = session.config.Main && session.config.Main.claimPaymentMethod;
    if (formula && session.accountId) {
      session.accountLoading = true;
      notifyPaymentCatalog();
      return repositoryRequest('GetClaimPaymentMethod', { formula: formula, claimId: session.claimId,
          accountId: session.accountId, contactId: session.contactId }).then((result) => {
        if (!paymentCatalogCurrent(session) || session.accountVersion !== version) return;
        if (!result || result.ok !== true || !result.outData) throw new Error('No se pudo resolver el método de pago.');
        const code = result.outData.paymentMethodCode || null;
        if (session.claim.paymentMethodCode && code !== session.claim.paymentMethodCode) throw new Error('El método calculado no coincide con el método del siniestro.');
        if (code && !session.methods.some((row) => row.code === code)) throw new Error('El método calculado no está disponible.');
        session.method = code;
      }).catch((caught) => { if (paymentCatalogCurrent(session) && session.accountVersion === version) session.error = caught.message; })
      .then(() => { if (paymentCatalogCurrent(session) && session.accountVersion === version) { session.accountLoading = false; notifyPaymentCatalog(); if (!session.error) return selectPaymentMethod(session.method, reference); } });
    }
    notifyPaymentCatalog();
    return selectPaymentMethod(session.method, reference);
  };
  const searchPaymentSourceAccounts = (query) => {
    const session = paymentCatalogRef.current;
    if (!session || !paymentCatalogCurrent(session) || paymentSavingRef.current) return Promise.resolve();
    const search = String(query || '').trim();
    const version = ++session.sourceAccountVersion;
    session.sourceAccountId = null; session.sourceAccounts = []; session.sourceAccountError = '';
    if (!search) { session.sourceAccountLoading = false; notifyPaymentCatalog(); return Promise.resolve(); }
    session.sourceAccountLoading = true; notifyPaymentCatalog();
    return repositoryRequest('RepoAccount', { operation: 'GET', filter: "accNo LIKE N'%" + sqlLikeLiteral(search) + "%'", size: 10 })
      .then((result) => {
        if (!paymentCatalogCurrent(session) || session.sourceAccountVersion !== version) return;
        if (!result || result.ok !== true || !Array.isArray(result.outData)) throw new Error('No fue posible cargar las cuentas de origen.');
        const seen = {};
        session.sourceAccounts = result.outData.map((row) => {
          const id = numericValue(row && row.id);
          if (!Number.isSafeInteger(id) || id <= 0 || !row.accNo || seen[id]) throw new Error('Catálogo de cuentas de origen incompatible.');
          seen[id] = true;
          return row;
        });
      }).catch((caught) => {
        if (paymentCatalogCurrent(session) && session.sourceAccountVersion === version) session.sourceAccountError = caught.message;
      }).then(() => {
        if (paymentCatalogCurrent(session) && session.sourceAccountVersion === version) {
          session.sourceAccountLoading = false; notifyPaymentCatalog();
        }
      });
  };
  const selectPaymentSourceAccount = (value) => {
    const session = paymentCatalogRef.current;
    if (!session || !paymentCatalogCurrent(session) || paymentSavingRef.current) return;
    session.sourceAccountId = session.sourceAccounts.some((row) => Number(row.id) === Number(value)) ? Number(value) : null;
    session.sourceAccountError = '';
    notifyPaymentCatalog();
  };
  const selectPaymentMethod = (value, reference) => {
    const session = paymentCatalogRef.current;
    if (!session || !paymentCatalogCurrent(session) || paymentSavingRef.current) return Promise.resolve();
    if (session.claim.paymentMethodCode && value !== session.claim.paymentMethodCode) return Promise.resolve();
    session.method = value || null;
    const version = session.infoVersion = (session.infoVersion || 0) + 1;
    session.info = '';
    notifyPaymentCatalog();
    const entries = session.config.Claim && session.config.Claim.paymentMethods;
    const entry = Array.isArray(entries) ? entries.find((row) => row.code === session.method) : null;
    if (!entry || !entry.showInfo) return Promise.resolve();
    return repositoryRequest('ExeFormula', { formula: entry.showInfo,
      context: JSON.stringify({ payment: Object.assign(nativePaymentForm(reference), { coverageId: session.coverageId }) })
    }).then((result) => {
      if (!paymentCatalogCurrent(session) || session.infoVersion !== version) return;
      session.info = result && result.ok === true && ['string', 'number'].indexOf(typeof result.outData) !== -1
        ? String(result.outData) : 'No se pudo cargar la información adicional del método de pago.';
      notifyPaymentCatalog();
    }).catch(() => {
      if (paymentCatalogCurrent(session) && session.infoVersion === version) {
        session.info = 'No se pudo cargar la información adicional del método de pago.'; notifyPaymentCatalog();
      }
    });
  };
  const nativePaymentForm = (reference) => {
    const session = paymentCatalogRef.current;
    return session ? { beneficiaryType: session.type, contactId: session.contactId, accountId: session.accountId,
      providerCode: session.providerCode, paymentMethodCode: session.method, paymentType: session.paymentType,
      sourceAccountId: session.sourceAccountId, additionalBeneficiary: session.additionalBeneficiary,
      managementType: session.managementType, amount: session.amount, reference: reference } : {};
  };

  const nativePaymentGuidance = (paid, status, bucket = 'IN') => {
    if (bucket === 'IN' && [2, '2'].includes(status)) return 'Este pago está revertido. Se conserva como historial y no puede volver a aprobarse.';
    if (!(Number(paid) > 0)) return 'Registre el movimiento con Registrar pago; las reservas generales se administran en Cobertura / Reservas.';
    if ([0, 2].indexOf(Number(status)) !== -1) return 'Seleccione Aprobar pago para habilitar la solicitud de cheque.';
    if (Number(status) !== 1) return 'Este movimiento no está disponible para solicitar un cheque.';
    return '';
  };
  const nativeSettlementQuote = (claim, payout, beneficiaryType, beneficiary, contactId) => {
    if (!payout || !(claim.Payouts || []).some((row) => row === payout)
      || (claim.Payouts || []).filter((row) => Number(row.id) === Number(payout.id)).length !== 1) throw new Error('El movimiento seleccionado no está disponible. Refresque la vista.');
    if (payout.currency && payout.currency !== claim.Policy.currency) throw new Error('Los pagos en otra moneda requieren liquidación en la vista nativa.');
    const guidance = nativePaymentGuidance(payout.payed, payout.status, payout.reserveType);
    if (guidance) throw new Error(guidance);
    const movements = (claim.Payouts || []).filter((row) => row && Number(row.claimId) === Number(claim.id) && Number(row.lifeCoverageId) === Number(payout.lifeCoverageId)
      && [1, 3].indexOf(Number(row.status)) !== -1);
    if (movements.some((row) => numericValue(row.payed) === null)) throw new Error('Los importes de esta cobertura requieren verificación en la vista nativa.');
    const history = (claim.Payments || []).filter((row) => {
      if (row.claimId != null && Number(row.claimId) !== Number(claim.id)) return false;
      const linked = (claim.Payouts || []).find((item) => Number(item.id) === Number(row.payoutId));
      if (linked && Number(linked.claimId) !== Number(claim.id)) return false;
      const coverageId = firstValue(row.coverageId, row.lifeCoverageId, linked && linked.lifeCoverageId);
      if (coverageId == null) throw new Error('Hay pagos sin cobertura verificable; revise su asociación en la vista nativa.');
      return Number(coverageId) === Number(payout.lifeCoverageId);
    });
    if (history.some((row) => numericValue(row.grossAmount) === null || !Number.isSafeInteger(Number(row.payoutId))
      || !(claim.Payouts || []).some((item) => Number(item.id) === Number(row.payoutId)))) {
      throw new Error('El historial de pagos no tiene importe o movimiento verificable; revise la vista nativa.');
    }
    const coverageAvailable = roundMoney(movements.reduce((sum, row) => sum + Number(row.payed), 0)
      - history.reduce((sum, row) => sum + Number(row.grossAmount), 0));
    const linkedPayments = history.filter((row) => Number(row.payoutId) === Number(payout.id));
    const rowAvailable = roundMoney(Number(payout.payed) - linkedPayments.reduce((sum, row) => sum + Number(row.grossAmount), 0));
    let proposed = coverageAvailable;
    if (beneficiaryType === 'BEN') {
      const share = numericValue(beneficiary && beneficiary.percentage);
      if (!share || share < 0 || share > 100 || !contactId) return { maximum: 0, coverageAvailable: coverageAvailable, rowAvailable: rowAvailable };
      if (share !== 100) {
        if (linkedPayments.some((row) => numericValue(row.contactId) === null)) throw new Error('El historial de beneficiarios requiere verificación en la vista nativa.');
        const same = linkedPayments.filter((row) => Number(row.contactId) === Number(contactId)).reduce((sum, row) => sum + Number(row.grossAmount), 0);
        const other = linkedPayments.filter((row) => Number(row.contactId) !== Number(contactId)).reduce((sum, row) => sum + Number(row.grossAmount), 0);
        proposed = same > 0 ? 0 : (coverageAvailable + (other > 0 ? other : 0)) * share / 100;
      }
    }
    return { maximum: roundMoney(Math.max(0, Math.min(proposed, coverageAvailable, rowAvailable, Number(payout.payed)))),
      coverageAvailable: coverageAvailable, rowAvailable: rowAvailable };
  };
  const nativeSettlementAmount = (claim, payout) => nativeSettlementQuote(claim, payout).maximum;
  const updatePaymentAmount = (session) => {
    if (!session || session.payoutId == null) return;
    try {
      const payout = (session.claim.Payouts || []).find((row) => Number(row.id) === Number(session.payoutId));
      const beneficiary = session.beneficiaries.find((row) => Number(row.contactId) === session.contactId);
      const quote = nativeSettlementQuote(session.claim, payout, session.type, beneficiary, session.contactId);
      session.maximum = quote.maximum; session.amount = quote.maximum > 0 ? String(quote.maximum) : '';
      session.settlementError = quote.maximum > 0 || !session.contactId ? '' : 'No hay importe disponible para este beneficiario y movimiento.';
    } catch (error) { session.maximum = 0; session.amount = ''; session.settlementError = error.message; }
  };

  const buildClaimPaymentPayload = (claim, payout, form, reserveType) => {
    if (!claim || !canEdit(claim)) throw new Error('El siniestro no permite registrar pagos.');
    const claimId = numericValue(claim.id);
    if (!Number.isSafeInteger(claimId) || claimId <= 0) throw new Error('El identificador del siniestro no es válido.');
    const requestedReserveType = String(reserveType || 'IN').trim().toUpperCase();
    if (!payout || Number(payout.claimId) !== claimId
      || (requestedReserveType !== 'IN' && requestedReserveType !== 'EX')
      || String(payout.reserveType || '').trim().toUpperCase() !== requestedReserveType
      || Number(payout.status) === 2) {
      throw new Error('La reserva de pago seleccionada no es válida.');
    }
    const coverage = claim.Policy && Array.isArray(claim.Policy.Coverages)
      ? claim.Policy.Coverages.find((item) => item && Number(item.id) === Number(payout.lifeCoverageId)) : null;
    if (!coverage) throw new Error('La cobertura de la reserva no pertenece al siniestro.');
    let total = nativeSettlementAmount(claim, payout);
    const session = paymentCatalogRef.current;
    if (!session || !paymentCatalogCurrent(session) || session.loading || session.methodsLoading || session.accountLoading
      || session.sourceAccountLoading || session.error || session.methodsError || session.sourceAccountError
      || session.settlementError || Number(session.coverageId) !== Number(coverage.id)) throw new Error('Los catálogos de pago no están listos. Reintente.');
    const contactId = numericValue(form && form.contactId);
    const beneficiary = session.beneficiaries.find((row) => Number(row.contactId) === contactId
      && session.type === form.beneficiaryType && session.contactId === contactId
      && !(row.Contact && row.Contact.isMinor)
      && (session.type !== 'PRO' || row.code === form.providerCode && row.code === session.providerCode));
    if (!beneficiary) throw new Error('El beneficiario seleccionado no es válido.');
    const quote = nativeSettlementQuote(claim, payout, form.beneficiaryType, beneficiary, contactId);
    total = form.amount == null ? quote.maximum : numericValue(form.amount);
    if (total === null || total > quote.maximum) throw new Error('El monto supera el importe aprobado disponible para este beneficiario y movimiento.');
    if (!Number.isFinite(total) || total <= 0) throw new Error('El importe del beneficiario no es válido.');
    const accountId = numericValue(form && form.accountId);
    if (session.accountId !== accountId || !paymentAccountOptions().some((option) => Number(option.value) === accountId)) {
      throw new Error('La cuenta del beneficiario no es válida.');
    }
    const paymentType = canonicalPaymentType(form && form.paymentType);
    if (!session.paymentTypes.some((row) => row.code === paymentType) || session.paymentType !== paymentType) {
      throw new Error('El tipo de pago no es válido.');
    }
    const sourceAccountId = numericValue(form && form.sourceAccountId);
    if (!Number.isSafeInteger(sourceAccountId) || sourceAccountId <= 0 || session.sourceAccountId !== sourceAccountId
      || !paymentSourceAccountOptions().some((option) => Number(option.value) === sourceAccountId)) {
      throw new Error('La cuenta de origen no es válida.');
    }
    const additionalBeneficiary = String(form && form.additionalBeneficiary || '').trim();
    if (!additionalBeneficiary) throw new Error('El beneficiario adicional es obligatorio.');
    const reference = String(form && form.reference || '').trim();
    if (!reference) throw new Error('La referencia es obligatoria.');
    if (!form || (form.managementType !== 'DIRECT' && !(form.beneficiaryType === 'PRO' && form.managementType === 'SO'))) throw new Error('El tipo de gestión no es válido.');
    const currency = claim.Policy && typeof claim.Policy.currency === 'string'
      ? claim.Policy.currency.trim().toUpperCase() : '';
    if (!currency) throw new Error('La moneda del siniestro no está disponible.');
    if (form.paymentMethodCode !== session.method || (session.method && !session.methods.some((row) => row.code === session.method))) throw new Error('El método de pago no es válido.');
    const coverageId = Number(coverage.id);
    return {
      operation: 'ADD',
      cmd: 'DoClaimPayment',
      data: {
        coverageId: coverageId,
        contactId: contactId,
        beneficiaryType: form.beneficiaryType,
        ...(form.beneficiaryType === 'PRO' ? { providerCode: form.providerCode } : {}),
        accountId: accountId,
        sourceAccountId: sourceAccountId,
        paymentMethodCode: form.paymentMethodCode == null ? null : form.paymentMethodCode,
        paymentType: paymentType,
        managementType: form.managementType,
        reference: reference,
        claimId: claimId,
        currency: currency,
        total: total,
        jDetail: JSON.stringify([{
          num: 1,
          payoutId: Number(payout.id),
          item: String(firstValue(coverage.name, coverage.description, coverage.code, 'Cobertura ' + coverageId)),
          description: String(payout.concept || ''),
          amount: total,
          lifeCoverageId: coverageId,
          additionalBeneficiary: additionalBeneficiary
        }])
      }
    };
  };

  const buildClaimExpensePayload = (claim, payout, form) => buildClaimPaymentPayload(
    claim, payout, form, 'EX'
  );

  const paymentFieldLiteral = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    const text = String(value == null ? '' : value).trim();
    return /^-?\d+(\.\d+)?$/.test(text) ? text : "N'" + text.replace(/'/g, "''") + "'";
  };

  const createdClaimPaymentId = (result) => {
    const rows = responseRows(result, 'la solicitud de pago');
    const row = rows[0] || {};
    return numericValue(row.id || row.paymentId || row.claimPaymentId
      || (result && result.entity && result.entity.id));
  };

  const resolveClaimPaymentId = (result, claimId, payoutId) => {
    const directId = createdClaimPaymentId(result);
    if (directId !== null && directId > 0) return Promise.resolve(directId);
    const requestedClaimId = numericValue(claimId), requestedPayoutId = numericValue(payoutId);
    if (requestedClaimId === null || requestedPayoutId === null) {
      return Promise.reject(new Error('La solicitud fue creada, pero la respuesta no incluyó su identificador.'));
    }
    return repositoryRequest('RepoClaimPayment', {
      operation: 'GET',
      filter: 'claimId = ' + requestedClaimId + ' AND payoutId = ' + requestedPayoutId,
      orderBy: 'id',
      orderDir: 'DESC',
      size: 1,
      page: 0
    }).then((lookupResult) => {
      const rows = responseRows(lookupResult, 'la solicitud de pago creada');
      const paymentId = numericValue(rows[0] && rows[0].id);
      if (paymentId === null || paymentId <= 0) {
        throw new Error('La solicitud fue creada, pero no se pudo localizar por la reserva asociada.');
      }
      return paymentId;
    });
  };

  const persistClaimPaymentFields = (result, form, claimId, payoutId) => {
    const sourceAccountId = numericValue(form && form.sourceAccountId);
    const paymentType = form && form.paymentType;
    if (sourceAccountId === null || sourceAccountId <= 0 || paymentType == null
      || String(paymentType).trim() === '') {
      return Promise.reject(new Error('La solicitud fue creada, pero no se pudieron resolver Tipo de pago y Cuenta de origen.'));
    }
    return resolveClaimPaymentId(result, claimId, payoutId).then((paymentId) => {
      return repositoryRequest('SetField', {
        entity: 'ClaimPayment',
        entityId: paymentId,
        fieldValue: 'paymentType = ' + paymentFieldLiteral(paymentType)
          + ', sourceAccountId = ' + sourceAccountId
      }).then((updateResult) => {
        if (!updateResult || updateResult.ok === false) {
          throw new Error(updateResult && updateResult.msg
            ? updateResult.msg : 'No fue posible guardar Tipo de pago y Cuenta de origen.');
        }
        return paymentId;
      });
    });
  };

  const submitClaimPayment = (payoutId, form) => {
    const claim = currentClaimRef.current;
    const payout = claim && Array.isArray(claim.Payouts)
      ? claim.Payouts.find((item) => item && Number(item.id) === Number(payoutId)) : null;
    let payload;
    try {
      payload = buildClaimPaymentPayload(claim, payout, form);
    } catch (caughtError) {
      setPaymentError(caughtError && caughtError.message ? caughtError.message : 'La solicitud de pago no es válida.');
      return Promise.resolve(false);
    }
    const context = startPaymentOperation();
    if (!context) return Promise.resolve(false);
    return repositoryRequest('DoClaimPayment', payload.data, { operation: payload.operation }).then((result) => {
      confirmedCommandResult(result, 'No fue posible ejecutar la solicitud de pago.');
      if (!mountedRef.current || paymentOperationRef.current !== context.operationId
        || routeClaimId() !== context.claimId) return false;
      return persistClaimPaymentFields(result, form, context.claimId, payoutId).then(() => refreshFinancialData(context.claimId)).then(() => {
        if (!mountedRef.current || paymentOperationRef.current !== context.operationId
          || routeClaimId() !== context.claimId) return false;
        setCheckRequestModalOpen(false);
        setPaymentReference('');
        if (A.message && typeof A.message.success === 'function') A.message.success('Solicitud de pago registrada');
        return true;
      });
    }).catch((caughtError) => {
      if (mountedRef.current && paymentOperationRef.current === context.operationId
        && routeClaimId() === context.claimId) {
        setPaymentError(caughtError && caughtError.message
          ? caughtError.message : 'No fue posible ejecutar la solicitud de pago.');
      }
      return false;
    }).then((outcome) => finishPaymentOperation(context, outcome));
  };

  const submitClaimExpense = (payoutId, form) => {
    const claim = currentClaimRef.current;
    const payout = claim && Array.isArray(claim.Payouts)
      ? claim.Payouts.find((item) => item && Number(item.id) === Number(payoutId)) : null;
    let payload;
    try {
      payload = buildClaimExpensePayload(claim, payout, form);
    } catch (caughtError) {
      setExpenseError(caughtError && caughtError.message ? caughtError.message : 'La solicitud de gasto no es válida.');
      return Promise.resolve(false);
    }
    const context = startPaymentOperation(setExpenseError);
    if (!context) return Promise.resolve(false);
    return repositoryRequest('DoClaimPayment', payload.data, { operation: payload.operation }).then((result) => {
      confirmedCommandResult(result, 'No fue posible ejecutar la solicitud de pago del gasto.');
      if (!mountedRef.current || paymentOperationRef.current !== context.operationId
        || routeClaimId() !== context.claimId) return false;
      return persistClaimPaymentFields(result, form, context.claimId, payoutId).then(() => refreshFinancialData(context.claimId)).then(() => {
        if (!mountedRef.current || paymentOperationRef.current !== context.operationId
          || routeClaimId() !== context.claimId) return false;
        setExpenseCheckRequestModalOpen(false);
        setPaymentReference('');
        if (A.message && typeof A.message.success === 'function') A.message.success('Solicitud de gasto registrada');
        return true;
      });
    }).catch((caughtError) => {
      if (mountedRef.current && paymentOperationRef.current === context.operationId
        && routeClaimId() === context.claimId) {
        setExpenseError(caughtError && caughtError.message
          ? caughtError.message : 'No fue posible ejecutar la solicitud de pago del gasto.');
      }
      return false;
    }).then((outcome) => finishPaymentOperation(context, outcome));
  };

  const claimReadPayload = (requestedClaimId) => ({
    operation: 'GET',
    include: [
      'Contact', 'Claimer', 'Stage', 'Process', 'Process.Pasos', 'Policy', 'Policy.Coverages',
      'Policy.Coverages.Benefits', 'Policy.Coverages.Claims', 'Policy.Exclusions',
      'Policy.Beneficiaries', 'Policy.Beneficiaries.Contact', 'Policy.Holder', 'Policy.Payer', 'Policy.Product', 'Policy.Accounts',
      'Policy.Accounts.Movements', 'Payouts', 'Payments', 'Payments.Beneficiary', 'InsuredEvent', 'Events',
      'FraudAnalysis', 'Requirements'
    ],
    filter: 'id=' + requestedClaimId,
    page: 0,
    size: 1
  });

  // General claim saves only need the scalar claim fields and the current insured event
  // for the optimistic-concurrency check; avoid reloading policy and tab data here.
  const claimSaveReadPayload = (requestedClaimId) => ({
    operation: 'GET',
    include: ['InsuredEvent'],
    filter: 'id=' + requestedClaimId,
    page: 0,
    size: 1
  });

  const loadPolicySummaryLabels = (claim, requestId) => {
    const policy = claim && claim.Policy || {};
    const lobCode = String(policy.lob || '').trim();
    const branchCode = String(policy.branchCode || '').trim();
    if (!lobCode && !branchCode) return;
    Promise.all([
      lobCode ? repositoryRequest('RepoLob', {
        operation: 'GET', filter: "code='" + lobCode.replace(/'/g, "''") + "'"
      }) : Promise.resolve(null),
      branchCode ? repositoryRequest('RepoBranch', {
        operation: 'GET', filter: "code='" + branchCode.replace(/'/g, "''") + "'"
      }) : Promise.resolve(null)
    ]).then(([lobResult, branchResult]) => {
      if (!mountedRef.current || requestId !== requestRef.current || currentClaimRef.current !== claim) return;
      const lob = lobCode && responseRows(lobResult, 'los ramos').find((row) => row
        && String(row.code || row.id || '').trim() === lobCode);
      const branch = branchCode && responseRows(branchResult, 'las sucursales').find((row) => row
        && String(row.code || row.id || row.branchCode || '').trim() === branchCode);
      const lobName = lob && firstValue(lob.name, lob.description, lob.xdescripcion_l);
      const branchName = branch && firstValue(branch.name, branch.description, branch.xdescripcion_l);
      if (!lobName && !branchName) return;
      setClaimSummary((summary) => Object.assign({}, summary, {
        policy: Object.assign({}, summary.policy, {
          lineOfBusiness: lobName || summary.policy.lineOfBusiness,
          branch: branchName || summary.policy.branch
        })
      }));
    }).catch(() => {
      // Preserve the source codes when a reference catalog is temporarily unavailable.
    });
  };

  const applyFinancialSnapshot = (claim, fresh, requestedClaimId, includePayments) => {
    claim.Payouts = Array.isArray(fresh.Payouts) ? fresh.Payouts : [];
    if (includePayments) claim.Payments = Array.isArray(fresh.Payments) ? fresh.Payments : [];
    const nextCoverageRows = normalizeCoverageRows(claim);
    coverageRowsRef.current = nextCoverageRows;
    setCoverageRows(nextCoverageRows);
    setSelectedCoverageId((currentId) => nextCoverageRows.some((row) => row.id === Number(currentId))
      ? Number(currentId) : nextCoverageRows.length ? nextCoverageRows[0].id : null);
    const indemnities = claim.Payouts.filter((row) => row && Number(row.claimId) === Number(requestedClaimId)
      && String(row.reserveType || '').trim().toUpperCase() === 'IN' && effectiveIndemnityMovement(row));
    const expenseRows = claim.Payouts.filter((row) => row && Number(row.claimId) === Number(requestedClaimId)
      && String(row.reserveType || '').trim().toUpperCase() === 'EX');
    const total = (rows, field) => roundMoney(rows.reduce((sum, row) => {
      const value = numericValue(row[field]);
      return sum + (value === null ? 0 : value);
    }, 0));
    const reserves = total(indemnities.filter(isReserveMovement), 'reserved');
    const payments = total(indemnities, 'payed');
    const expenses = expenseRows.length ? total(expenseRows, 'payed') : null;
    setClaimSummary((summary) => Object.assign({}, summary, {
      valuation: Object.assign({}, summary.valuation, {
        reserves: reserves,
        payments: payments,
        expenses: expenses,
        balance: valuationBalance(reserves, payments, expenses, summary.valuation && summary.valuation.recoveries)
      })
    }));
  };

  const refreshReserveData = (requestedClaimId) => {
    const claim = currentClaimRef.current;
    if (!claim || Number(claim.id) !== Number(requestedClaimId)
      || routeClaimId() !== Number(requestedClaimId)) return Promise.resolve(false);
    return repositoryRequest('RepoClaim', {
      operation: 'GET', include: ['Payouts'],
      filter: 'id=' + Number(requestedClaimId), page: 0, size: 1
    }).then((result) => {
      if (!mountedRef.current || currentClaimRef.current !== claim
        || routeClaimId() !== Number(requestedClaimId)) return false;
      const fresh = responseRows(result, 'las reservas').find((row) => row
        && Number(row.id) === Number(requestedClaimId));
      if (!fresh) throw new Error('No se pudieron actualizar las reservas del siniestro.');
      applyFinancialSnapshot(claim, fresh, requestedClaimId, false);
      return true;
    });
  };

  const refreshFinancialData = (requestedClaimId) => {
    const claim = currentClaimRef.current;
    if (!claim || Number(claim.id) !== Number(requestedClaimId)
      || routeClaimId() !== Number(requestedClaimId)) return Promise.resolve(false);
    return repositoryRequest('RepoClaim', {
      operation: 'GET', include: ['Payouts', 'Payments', 'Payments.Beneficiary'],
      filter: 'id=' + Number(requestedClaimId), page: 0, size: 1
    }).then((result) => {
      if (!mountedRef.current || currentClaimRef.current !== claim
        || routeClaimId() !== Number(requestedClaimId)) return false;
      const fresh = responseRows(result, 'los movimientos financieros').find((row) => row
        && Number(row.id) === Number(requestedClaimId));
      if (!fresh) throw new Error('No se pudo actualizar los movimientos financieros del siniestro.');
      applyFinancialSnapshot(claim, fresh, requestedClaimId, true);
      return true;
    });
  };

  const refreshValuationRecoveries = (claim) => {
    const claimIdValue = claim && Number(claim.id);
    if (!Number.isSafeInteger(claimIdValue) || claimIdValue <= 0) return Promise.resolve(false);
    return repositoryRequest('RepoSalvage', { operation: 'GET', filter: 'claimId=' + claimIdValue }).then((result) => {
      if (!mountedRef.current || currentClaimRef.current !== claim || routeClaimId() !== claimIdValue) return false;
      const rows = recoveryData(result, 'Respuesta de recuperaciones').filter((row) => row && Number(row.claimId) === claimIdValue);
      const recoveries = rows.length ? roundMoney(rows.reduce((sum, row) => {
        const value = numericValue(row.netIncome);
        return sum + (value === null ? 0 : value);
      }, 0)) : null;
      setClaimSummary((summary) => {
        const valuation = summary.valuation || {};
        return Object.assign({}, summary, { valuation: Object.assign({}, valuation, {
          recoveries: recoveries,
          balance: valuationBalance(valuation.reserves, valuation.payments, valuation.expenses, recoveries)
        }) });
      });
      return true;
    }).catch(() => false);
  };

  const isValidStageCode = (value) => CLAIM_STAGE_OPTIONS.some((option) => option.value === value);
  const claimStageCode = (claim) => claim && claim.stageCode != null ? String(claim.stageCode) : null;
  const claimIsFinalized = (claim) => {
    if (!claim) return false;
    const stageCode = String(firstValue(claim.stageCode, claim.Stage && claim.Stage.code, '')).trim().toUpperCase();
    const closed = claim.closed === true || String(claim.closed).trim().toLowerCase() === 'true';
    return closed || stageCode === '7' || stageCode === 'F';
  };
  const canEdit = (claim) => !!claim && !claimIsFinalized(claim);
  const canSaveClaim = (claim) => !!claim;

  const positiveIdText = (value) => {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    const numeric = Number(value);
    return Number.isSafeInteger(numeric) && numeric > 0 ? String(numeric) : null;
  };

  const sqlLiteral = (value) => String(value).replace(/'/g, "''");
  const sqlLikeLiteral = (value) => sqlLiteral(value)
    .replace(/\[/g, '[[]').replace(/%/g, '[%]').replace(/_/g, '[_]');
  const claimantFilter = (query) => {
    const exact = sqlLiteral(query);
    const like = sqlLikeLiteral(query);
    return "((RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,''))) like N'%"
      + like + "%' OR (cnp = '" + exact + "' OR nif = '" + exact + "'))";
  };

  const strictOutData = (result, label) => {
    if (!result || result.ok === false || !Array.isArray(result.outData)) {
      throw new Error(result && result.msg ? result.msg : ('Respuesta de ' + label + ' incompatible.'));
    }
    return result.outData;
  };

  const claimantOption = (contact, preserve) => {
    if (!contact || typeof contact !== 'object' || Array.isArray(contact)) return null;
    const value = positiveIdText(contact.id);
    const labelValue = personName(contact);
    const label = typeof labelValue === 'string' ? labelValue.trim() : '';
    if (!value || !label) return null;
    const unavailable = contact.inactive === true || contact.restricted === true
      || contact.restrictedForUser === true;
    if (unavailable && !preserve) return null;
    return { value: value, label: label, disabled: unavailable };
  };

  const catalogGetPayload = () => Object.assign({}, REPOSITORY_CATALOG_GET);

  const parseEventMatrix = (matrix, productCode) => {
    if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0])) {
      throw new Error('La tabla de eventos asegurados no es compatible.');
    }
    const indexes = {};
    matrix[0].forEach((header, index) => {
      const name = typeof header === 'string' ? header.trim() : '';
      if (!name || Object.prototype.hasOwnProperty.call(indexes, name)) {
        throw new Error('La tabla de eventos asegurados no es compatible.');
      }
      indexes[name] = index;
    });
    ['CoverageName', 'CoverageCode', 'Product', 'EventReason', 'InsuredEvents'].forEach((name) => {
      if (!Object.prototype.hasOwnProperty.call(indexes, name)) {
        throw new Error('La tabla de eventos asegurados no contiene ' + name + '.');
      }
    });
    const mappings = {};
    matrix.slice(1).forEach((row) => {
      if (!Array.isArray(row)) throw new Error('La tabla de eventos asegurados no es compatible.');
      const product = row[indexes.Product];
      const reason = row[indexes.EventReason];
      const csv = row[indexes.InsuredEvents];
      if (product === null || product === undefined || typeof product !== 'string') {
        throw new Error('La tabla de eventos asegurados no es compatible.');
      }
      if (product.trim() !== productCode) return;
      if (typeof reason !== 'string' || typeof csv !== 'string' || reason.trim() === '') {
        throw new Error('La tabla de eventos asegurados no es compatible.');
      }
      const reasonCode = reason.trim();
      const eventCodes = csv.split(',').map((code) => code.trim()).filter(Boolean);
      if (eventCodes.length === 0) throw new Error('La tabla de eventos asegurados no es compatible.');
      if (!mappings[reasonCode]) mappings[reasonCode] = [];
      eventCodes.forEach((code) => {
        if (mappings[reasonCode].indexOf(code) === -1) mappings[reasonCode].push(code);
      });
    });
    return mappings;
  };

  const parseReasonCatalog = (rows) => {
    const byCode = {};
    rows.forEach((row) => {
      const code = row && typeof row.code === 'string' ? row.code.trim() : '';
      const name = row && typeof row.name === 'string' ? row.name.trim() : '';
      if (!row || typeof row !== 'object' || Array.isArray(row) || !code || !name
        || typeof row.disabled !== 'boolean' || byCode[code]) {
        throw new Error('El catálogo de razones de evento no es compatible.');
      }
      byCode[code] = { code: code, name: name, disabled: row.disabled };
    });
    return byCode;
  };

  const parseInsuredEventCatalog = (rows) => {
    const byCode = {};
    rows.forEach((row) => {
      const code = row && typeof row.code === 'string' ? row.code.trim() : '';
      const name = row && typeof row.name === 'string' ? row.name.trim() : '';
      const mode = row && typeof row.mode === 'string' ? row.mode.trim() : '';
      if (!row || typeof row !== 'object' || Array.isArray(row) || !code || !name || !mode
        || typeof row.disabled !== 'boolean' || typeof row.hasHealthProcedures !== 'boolean'
        || byCode[code]) {
        throw new Error('El catálogo de eventos asegurados no es compatible.');
      }
      byCode[code] = {
        code: code, name: name, mode: mode, disabled: row.disabled,
        hasHealthProcedures: row.hasHealthProcedures
      };
    });
    return byCode;
  };

  const claimTypeCode = (claim) => claim && typeof claim.claimType === 'string'
    ? claim.claimType.trim() : '';

  const insuredEventForUpdate = (event, claimType) => {
    const expectedMode = typeof claimType === 'string' ? claimType.trim() : '';
    const eventMode = event && typeof event.mode === 'string' ? event.mode.trim() : '';
    if (!event || typeof event !== 'object' || Array.isArray(event)
      || typeof event.code !== 'string' || !event.code.trim()
      || typeof event.name !== 'string' || !event.name.trim()
      || !expectedMode || eventMode !== expectedMode || event.disabled !== false
      || typeof event.hasHealthProcedures !== 'boolean') {
      throw new Error('El evento asegurado seleccionado no es válido.');
    }
    return {
      code: event.code.trim(), name: event.name.trim(), mode: eventMode,
      disabled: false, hasHealthProcedures: event.hasHealthProcedures
    };
  };

  const validDateParts = (value, label) => {
    const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) throw new Error(label + ' debe usar el formato DD/MM/AAAA.');
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day) {
      throw new Error(label + ' no es válida.');
    }
    return { year: year, month: month, day: day };
  };

  const toUtcDate = (value, label) => {
    const parts = validDateParts(value, label);
    const pad = (part) => String(part).padStart(2, '0');
    return parts.year + '-' + pad(parts.month) + '-' + pad(parts.day);
  };

  const localMidnightIso = (value, label) => {
    const parts = validDateParts(value, label);
    return new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0).toISOString();
  };

  const EXTRA_SECTION = 'InformacionResumenDelReclamo';
  const EXTRA_FIELDS = [{"name":"culpable","type":"checkbox-group","label":"Culpable","required":false,"className":"form-control","values":[{"label":"Culpable","value":"true","selected":false}]},{"name":"posibleRecupero","type":"checkbox-group","label":"Posible Recupero","required":false,"className":"form-control","values":[{"label":"Posible Recupero","value":"true","selected":false}]},{"name":"perdidaTotal","type":"checkbox-group","label":"Pérdida Total","required":false,"className":"form-control","values":[{"label":"Pérdida Total","value":"true","selected":false}]},{"name":"formatoTransito","type":"text","label":"Formato Tránsito","required":false,"className":"form-control"},{"name":"conductor","type":"text","label":"Conductor","required":false,"className":"form-control"},{"name":"asegurador","type":"checkbox-group","label":"Asegurador","required":false,"className":"form-control","values":[{"label":"Asegurador","value":"true","selected":false}]},{"name":"pagador","type":"checkbox-group","label":"Pagador","required":false,"className":"form-control","values":[{"label":"Pagador","value":"true","selected":false}]},{"name":"otro","type":"checkbox-group","label":"Otro","required":false,"className":"form-control","values":[{"label":"Otro","value":"true","selected":false}]},{"name":"edadConductor","type":"text","label":"Edad del Conductor","required":false,"className":"form-control"},{"name":"cmbProvincia","type":"select","label":"Provincia","required":false,"className":"form-control","values":[]},{"name":"cmbMunicipio","type":"select","label":"Ciudad","required":false,"className":"form-control","values":[]},{"name":"lugar","type":"text","label":"Lugar","required":false,"className":"form-control"},{"name":"fechaAudiencia","type":"date","label":"Fecha de audiencia","required":false,"className":"form-control"},{"name":"lugarAudiencia","type":"text","label":"Lugar de audiencia","required":false,"className":"form-control"},{"name":"fechaVencimientoLicencia","type":"date","label":"Fecha Vencimiento Licencia","required":false,"className":"form-control"},{"name":"numeroLicencia","type":"text","label":"Número de Licencia","required":false,"className":"form-control"}];
  const extraDefinitionRef = React.useRef(null);
  const [, setExtraDefinitionRevision] = React.useState(0);
  const [extraGeo, setExtraGeo] = React.useState({ provinces: [], cities: [], loading: false, error: '' });
  const extraGeoOperation = React.useRef(0);
  const extraMotor = (claim) => !!claim && !!claim.Policy && String(claim.Policy.lob).trim() === '6';
  const extraCommon = (name) => ['cmbProvincia', 'cmbMunicipio', 'lugar'].includes(name);
  const extraRead = (raw) => {
    const outer = customFormOuter(raw);
    let stored = outer[EXTRA_SECTION];
    if (typeof stored === 'string') stored = JSON.parse(stored);
    if (stored == null) stored = [];
    if (!Array.isArray(stored)) throw new Error('Información adicional del siniestro no compatible.');
    const seen = {};
    stored.forEach((f) => {
      if (!f || typeof f.name !== 'string' || seen[f.name]) throw new Error('Campos adicionales duplicados o no válidos.');
      seen[f.name] = true;
    });
    const values = {};
    EXTRA_FIELDS.forEach((definition) => {
      const f = stored.find((item) => item.name === definition.name);
      if (f && (f.type !== definition.type || !Array.isArray(f.userData))) throw new Error('Campo adicional incompatible: ' + definition.label);
      values[definition.name] = definition.type === 'checkbox-group'
        ? !!f && f.userData.some((value) => value === true || value === 'true')
        : f && f.userData.length ? String(f.userData[0]) : '';
    });
    return { outer, stored, values };
  };
  const extraMerge = (raw, claim, values, touched) => {
    const changed = EXTRA_FIELDS.filter((f) => touched && touched['extra_' + f.name]);
    if (!changed.length) return raw;
    if (!extraDefinitionRef.current) throw new Error('Espere a que se verifique el formulario de información adicional.');
    if (changed.some((f) => f.type === 'select')) {
      if (extraGeo.loading || extraGeo.error) throw new Error('Espere a que se carguen Provincia y Ciudad antes de guardar.');
      const province = values.extra_cmbProvincia;
      const city = values.extra_cmbMunicipio;
      if (province && !extraGeo.provinces.some((p) => p.value === province)) throw new Error('Seleccione una provincia válida.');
      if (city && (!province || !extraGeo.cities.some((c) => c.value === city))) throw new Error('Seleccione una ciudad de la provincia elegida.');
    }
    const parsed = extraRead(raw);
    const fields = hydrateCustomFormFields(extraDefinitionRef.current, parsed.stored);
    fields.forEach((f) => {
      if (!Array.isArray(f.userData)) f.userData = f.type === 'checkbox-group' ? [] : [''];
    });
    changed.forEach((f) => {
      if (!extraCommon(f.name) && !extraMotor(claim)) throw new Error('El campo ' + f.label + ' sólo puede modificarse en ramo 6.');
      const value = values['extra_' + f.name];
      if (f.type === 'checkbox-group' ? typeof value !== 'boolean' : typeof value !== 'string') throw new Error('Valor adicional incompatible.');
      if (f.type === 'date' && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value)) throw new Error('Fecha no válida: ' + f.label);
      fields.find((item) => item.name === f.name).userData = f.type === 'checkbox-group' ? (value ? ['true'] : []) : [value];
    });
    parsed.stored.filter((f) => !fields.some((item) => item.name === f.name)).forEach((f) => fields.push(f));
    parsed.outer[EXTRA_SECTION] = JSON.stringify(fields);
    return JSON.stringify(parsed.outer);
  };
  const extraChange = (name, value) => {
    if (!extraDefinitionRef.current || !extraCommon(name) && !extraMotor(currentClaimRef.current)) return;
    changeDraft('extra_' + name, value);
    if (name === 'cmbProvincia') changeDraft('extra_cmbMunicipio', '');
  };
  React.useEffect(() => {
    const operation = ++extraGeoOperation.current;
    const current = () => mountedRef.current && operation === extraGeoOperation.current;
    const province = draft && draft.extra_cmbProvincia;
    const country = '591'; // Same country catalog scope as DTINCENDIO_V3.
    setExtraGeo({ provinces: [], cities: [], loading: true, error: '' });
    if (!country || !/^[A-Za-z0-9_-]+$/.test(String(country)) || province && !/^[A-Za-z0-9_-]+$/.test(province)) {
      setExtraGeo({ provinces: [], cities: [], loading: false, error: 'País o provincia no configurados correctamente.' });
      return;
    }
    Promise.all([
      repositoryRequest('RepoStateCatalog', { operation: 'GET', filter: "countryCode='" + country + "'" }, undefined, current),
      province ? repositoryRequest('RepoCityCatalog', { operation: 'GET', filter: "stateCode='" + province + "'" }, undefined, current) : Promise.resolve({ ok: true, outData: [] })
    ]).then((results) => {
      if (!current()) return;
      const options = (result, label) => strictOutData(result, label).map((row) => ({ value: String(row.code), label: row.name }));
      setExtraGeo({ provinces: options(results[0], 'Provincias'), cities: options(results[1], 'Ciudades'), loading: false, error: '' });
    }).catch(() => { if (current()) setExtraGeo({ provinces: [], cities: [], loading: false, error: 'No se pudieron cargar Provincia/Ciudad. Recargue antes de editarlas.' }); });
    return () => { extraGeoOperation.current += 1; };
  }, [claimId, newClaimCatalogSeq, draft && draft.extra_cmbProvincia]);
  const extraControl = (name) => {
    const f = EXTRA_FIELDS.find((field) => field.name === name);
    const disabled = !generalEditable || !extraDefinitionRef.current || !extraCommon(name) && !extraMotor(currentClaimRef.current);
    const value = draft ? draft['extra_' + name] : f.type === 'checkbox-group' ? false : '';
    if (f.type === 'checkbox-group') return <Checkbox aria-label={f.label} disabled={disabled} checked={!!value} onChange={(e) => extraChange(name, e.target.checked)}>{f.label}</Checkbox>;
    if (f.type === 'select') {
      const list = name === 'cmbProvincia' ? extraGeo.provinces : extraGeo.cities;
      const options = value && !list.some((item) => item.value === value) ? [{ value, label: value }].concat(list) : list;
      return <Select aria-label={f.label} size="small" showSearch allowClear optionFilterProp="label" value={value || undefined} options={options} loading={extraGeo.loading}
        disabled={disabled || extraGeo.loading || !!extraGeo.error || name === 'cmbMunicipio' && !(draft && draft.extra_cmbProvincia)} onChange={(v) => extraChange(name, v || '')} />;
    }
    return <Input aria-label={f.label} size="small" type={f.type === 'date' ? 'date' : 'text'} disabled={disabled} value={value || ''} onChange={(e) => extraChange(name, e.target.value)} />;
  };

  const CLAIM_CUSTOM_SECTION = 'Detalle del Siniestro';
  const CLAIM_CUSTOM_FIELD_TYPES = {
    ajustadorName: 'text',
    ajustadorEmail: 'text',
    hiddenAjustador: 'hidden',
    descripcion: 'textarea'
  };

  const evaluateCustomFormCondition = (condition, claim, failureValue) => {
    if (condition === null || condition === undefined || String(condition).trim() === '') return true;
    if (typeof condition !== 'string') return false;
    try {
      return !!Function('pol', 'cla', '"use strict";return !!(' + condition + ');')(
        claim && claim.Policy, claim
      );
    } catch (failure) {
      return !!failureValue;
    }
  };

  const parseCustomFormConfig = (profile, claim) => {
    const configured = profile && profile.Claim ? profile.Claim.customForms : [];
    if (!Array.isArray(configured)) {
      throw new Error('La configuración de formularios personalizados no es compatible.');
    }
    const names = {};
    return configured.filter((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)
        || typeof entry.name !== 'string' || entry.name.trim() === ''
        || !Number.isSafeInteger(Number(entry.formId)) || Number(entry.formId) <= 0
        || typeof entry.formId === 'boolean') {
        throw new Error('La configuración de formularios personalizados no es compatible.');
      }
      const name = entry.name.trim();
      if (names[name]) throw new Error('La configuración contiene formularios personalizados duplicados.');
      names[name] = true;
      return evaluateCustomFormCondition(entry.condition, claim);
    }).map((entry) => Object.assign({}, entry, {
      name: entry.name.trim(), formId: Number(entry.formId)
    }));
  };

  const customFormOuter = (raw) => {
    if (raw === null || raw === undefined || String(raw).trim() === '') return {};
    let outer;
    try { outer = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch (failure) { throw new Error('La información de formularios personalizados no es compatible.'); }
    if (!outer || typeof outer !== 'object' || Array.isArray(outer)) {
      throw new Error('La información de formularios personalizados no es compatible.');
    }
    return outer;
  };

  const normalizeCustomFormDefinition = (definition) => {
    let current = definition;
    for (let depth = 0; depth < 3; depth += 1) {
      if (typeof current === 'string') {
        try { current = JSON.parse(current); }
        catch (failure) { throw new Error('La definición del formulario no es compatible.'); }
      }
      if (Array.isArray(current)) return current;
      if (!current || typeof current !== 'object') break;
      // Some saved form definitions wrap the form-builder array instead of returning it directly.
      const next = current.fields || current.formData || current.data || current.json;
      if (next === undefined || next === current) break;
      current = next;
    }
    throw new Error('La definición del formulario no es compatible.');
  };

  const hydrateCustomFormFields = (definitionFields, storedSection) => {
    const definition = normalizeCustomFormDefinition(definitionFields);
    let stored = [];
    if (storedSection !== null && storedSection !== undefined && storedSection !== '') {
      try { stored = typeof storedSection === 'string' ? JSON.parse(storedSection) : storedSection; }
      catch (failure) { throw new Error('Los valores del formulario personalizado no son compatibles.'); }
      if (!Array.isArray(stored)) throw new Error('Los valores del formulario personalizado no son compatibles.');
    }
    const values = {};
    stored.forEach((field) => {
      if (field && typeof field.name === 'string' && !values[field.name]
        && Array.isArray(field.userData)) values[field.name] = field.userData.slice();
    });
    return definition.map((field) => {
      const layoutOnly = field && ['header', 'paragraph', 'button'].includes(field.type);
      if (!field || typeof field !== 'object' || Array.isArray(field)
        || typeof field.type !== 'string'
        || (!layoutOnly && (typeof field.name !== 'string' || field.name.trim() === ''))) {
        throw new Error('La definición del formulario no es compatible.');
      }
      const hydrated = Object.assign({}, field);
      if (values[field.name]) hydrated.userData = values[field.name];
      return hydrated;
    });
  };

  const parseCustomFormDefinition = (row, metadata, rawValues) => {
    if (!row || typeof row !== 'object' || Number(row.id) !== Number(metadata.formId)
      || typeof row.name !== 'string' || typeof row.json !== 'string') {
      throw new Error('La respuesta del formulario personalizado no es compatible.');
    }
    let definition;
    try { definition = JSON.parse(row.json); }
    catch (failure) { throw new Error('La definición del formulario personalizado no es compatible.'); }
    const outer = customFormOuter(rawValues);
    return {
      key: 'resumenCustomForm_' + Number(metadata.instanceIndex || 0) + '_'
        + metadata.name.replace(/[^A-Za-z0-9_-]/g, '_') + '_' + Number(metadata.formId),
      label: metadata.name,
      icon: metadata.icon || 'form',
      formId: Number(metadata.formId),
      nativeName: row.name,
      logic: typeof row.logic === 'string' ? row.logic : '',
      fields: hydrateCustomFormFields(definition, outer[metadata.name])
    };
  };

  const serializeCustomForms = (raw, forms) => {
    const outer = customFormOuter(raw);
    (forms || []).forEach((form) => {
      if (!form || typeof form.label !== 'string' || !Array.isArray(form.fields)) {
        throw new Error('El formulario personalizado no es compatible.');
      }
      outer[form.label] = JSON.stringify(form.fields);
    });
    return JSON.stringify(outer);
  };

  const validateCustomForms = (forms) => {
    (forms || []).forEach((form) => {
      if (!form || !Array.isArray(form.fields)) throw new Error('El formulario personalizado no es compatible.');
      form.fields.forEach((field) => {
        const value = field && Array.isArray(field.userData) ? field.userData[0] : undefined;
        if (field && field.required && (value === null || value === undefined || String(value).trim() === '')) {
          throw new Error((field.label || field.name || 'Un campo requerido') + ' es obligatorio.');
        }
      });
    });
    return true;
  };

  const waitForConfigProfile = (operationId, attempts) => new Promise((resolve, reject) => {
    if (!mountedRef.current || operationId !== customFormsOperationRef.current) return resolve(null);
    if (window.global && window.global.configProfile) return resolve(window.global.configProfile);
    if (attempts <= 0) return reject(new Error('No fue posible cargar la configuración de formularios personalizados.'));
    window.setTimeout(() => {
      waitForConfigProfile(operationId, attempts - 1).then(resolve, reject);
    }, 100);
  });

  const loadCustomForms = (claim) => {
    const operationId = customFormsOperationRef.current + 1;
    customFormsOperationRef.current = operationId;
    customFormsStatusRef.current = 'loading';
    extraDefinitionRef.current = null;
    setExtraDefinitionRevision((value) => value + 1);
    customFormsRef.current = [];
    if (mountedRef.current) {
      setCustomForms([]);
      setCustomFormsLoading(true);
      setCustomFormsError('');
      setActiveCustomForm('');
    }
    return waitForConfigProfile(operationId, 30).then((profile) => {
      if (!profile || operationId !== customFormsOperationRef.current
        || !mountedRef.current || currentClaimRef.current !== claim) return null;
      const metadata = parseCustomFormConfig(profile, claim);
      const persistence = (profile.Claim.customForms || []).filter((entry) => entry && typeof entry.name === 'string'
        && entry.name.trim() === EXTRA_SECTION && !evaluateCustomFormCondition(entry.condition, claim));
      if (persistence.length !== 1) throw new Error('No se encontró la asociación oculta de información adicional.');
      return repositoryRequest('GetForms', { filter: 'id=' + Number(persistence[0].formId) }).then((result) => {
        if (operationId !== customFormsOperationRef.current || currentClaimRef.current !== claim) return null;
        const rows = strictOutData(result, 'Formulario adicional');
        if (rows.length !== 1) throw new Error('Formulario adicional no encontrado.');
        const definition = JSON.parse(rows[0].json);
        if (!Array.isArray(definition) || definition.length !== EXTRA_FIELDS.length || EXTRA_FIELDS.some((field) => definition.filter((f) => f.name === field.name && f.type === field.type).length !== 1)) throw new Error('La definición de los 16 campos adicionales no es compatible.');
        extraDefinitionRef.current = definition;
        // El ref no genera render por sí solo: reevalúa los campos de ubicación
        // tan pronto se valida la definición adicional.
        setExtraDefinitionRevision((value) => value + 1);
        return Promise.all(metadata.map((entry, index) => repositoryRequest('GetForms', {
        filter: 'id=' + entry.formId
      }).then((result) => {
        const rows = strictOutData(result, 'GetForms');
        if (rows.length !== 1) throw new Error('No se encontró una definición única para ' + entry.name + '.');
        return parseCustomFormDefinition(rows[0], Object.assign({ instanceIndex: index }, entry), claim.jCustomForms);
      })));
      });
    }).then((forms) => {
      if (!forms || operationId !== customFormsOperationRef.current
        || !mountedRef.current || currentClaimRef.current !== claim) return;
      customFormsRef.current = forms;
      customFormsStatusRef.current = forms.length ? 'rendering' : 'ready';
      setCustomForms(forms);
      setActiveCustomForm(forms.length ? forms[0].key : '');
    }).catch((caughtError) => {
      if (operationId === customFormsOperationRef.current && mountedRef.current
        && currentClaimRef.current === claim) {
        customFormsRef.current = [];
        customFormsStatusRef.current = 'error';
        setCustomForms([]);
        setCustomFormsError(caughtError && caughtError.message
          ? caughtError.message : 'No fue posible cargar los formularios personalizados.');
      }
    }).then(() => {
      if (operationId === customFormsOperationRef.current && mountedRef.current) {
        setCustomFormsLoading(false);
      }
    });
  };

  const createScopedFormRuntime = (root, operationId, hostWindow, hostDocument, hostJQuery, formContext) => {
    const nativeWindow = hostWindow || window;
    const nativeDocument = hostDocument || document;
    const native$ = hostJQuery || nativeWindow.jQuery || nativeWindow.$;
    const namespace = '.resumenCustomForm' + operationId + String(Math.random()).slice(2);
    const listeners = [];
    const observers = [];
    const timers = [];
    const createdNodes = [];
    let alive = true;
    const active = () => alive && mountedRef.current
      && customFormsOperationRef.current === operationId;
    const listen = (target, name, listener, options) => {
      target.addEventListener(name, listener, options);
      listeners.push([target, name, listener, options]);
    };
    const scopedDocument = {
      querySelector: (selector) => root.querySelector(selector),
      querySelectorAll: (selector) => root.querySelectorAll(selector),
      getElementById: (id) => root.querySelector('#' + String(id).replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g, '\\$1')),
      createElement: (name) => {
        const node = nativeDocument.createElement(name);
        createdNodes.push(node);
        return node;
      },
      addEventListener: (name, listener, options) => listen(nativeDocument, name, listener, options),
      removeEventListener: (name, listener, options) => nativeDocument.removeEventListener(name, listener, options)
    };
    const scopedWindow = {
      document: scopedDocument,
      location: nativeWindow.location,
      addEventListener: (name, listener, options) => listen(nativeWindow, name, listener, options),
      removeEventListener: (name, listener, options) => nativeWindow.removeEventListener(name, listener, options)
    };
    const scopedSetTimeout = (callback, delay) => {
      const id = nativeWindow.setTimeout(() => { if (active()) callback(); }, delay);
      timers.push(id);
      return id;
    };
    const scopedClearTimeout = (id) => nativeWindow.clearTimeout(id);
    scopedWindow.setTimeout = scopedSetTimeout;
    scopedWindow.clearTimeout = scopedClearTimeout;
    const ScopedMutationObserver = function (callback) {
      if (typeof nativeWindow.MutationObserver !== 'function') {
        throw new Error('MutationObserver no está disponible para el formulario personalizado.');
      }
      const observer = new nativeWindow.MutationObserver((records, observerInstance) => {
        if (active()) callback(records, observerInstance);
      });
      observers.push(observer);
      return observer;
    };
    const scoped$ = (selector, attributes) => {
      if (!native$) throw new Error('El renderizador de formularios personalizados no está disponible.');
      if (selector === nativeDocument || selector === scopedDocument
        || selector === nativeWindow || selector === scopedWindow) {
        const target = selector === nativeWindow || selector === scopedWindow ? nativeWindow : nativeDocument;
        const collection = native$(target);
        const wrapper = Object.create(collection);
        wrapper.on = function (events) {
          const args = Array.prototype.slice.call(arguments, 1);
          const namespaced = String(events).split(/\s+/).map((eventName) => eventName + namespace).join(' ');
          collection.on.apply(collection, [namespaced].concat(args));
          return wrapper;
        };
        wrapper.off = function () { collection.off(namespace); return wrapper; };
        return wrapper;
      }
      if (typeof selector === 'string') {
        if (/^\s*</.test(selector)) {
          const created = native$(selector, attributes);
          if (typeof created.toArray === 'function') {
            created.toArray().forEach((node) => createdNodes.push(node));
          }
          if (typeof created.appendTo === 'function') {
            const appendTo = created.appendTo;
            created.appendTo = function (target) {
              return appendTo.call(created, target === 'head' || target === 'body' || target === 'html'
                ? native$(root) : target);
            };
          }
          return created;
        }
        if (selector === 'head' || selector === 'body' || selector === 'html') return native$(root);
        return native$(root).find(selector);
      }
      if (selector && (selector === root || (typeof root.contains === 'function' && root.contains(selector)))) {
        return native$(selector);
      }
      return native$([]);
    };
    if (native$) scoped$.fn = native$.fn;
    const scopedExe = (name, payload) => {
      if (!active()) {
        return Promise.reject(new Error('La operación del formulario personalizado fue cancelada.'));
      }
      return repositoryRequest(name, payload).then((result) => {
        if (!active()) throw new Error('La operación del formulario personalizado fue cancelada.');
        return result;
      });
    };
    const cleanup = () => {
      if (!alive) return;
      alive = false;
      timers.forEach((id) => nativeWindow.clearTimeout(id));
      listeners.forEach((entry) => entry[0].removeEventListener(entry[1], entry[2], entry[3]));
      observers.forEach((observer) => observer.disconnect());
      if (native$) {
        native$(nativeDocument).off(namespace);
        native$(nativeWindow).off(namespace);
      }
      createdNodes.forEach((node) => {
        if (node.parentNode && !(typeof root.contains === 'function' && root.contains(node))) {
          node.parentNode.removeChild(node);
        }
      });
    };
    return {
      exe: scopedExe, $: scoped$, jQuery: scoped$, document: scopedDocument,
      window: scopedWindow, MutationObserver: ScopedMutationObserver,
      setTimeout: scopedSetTimeout, clearTimeout: scopedClearTimeout,
      cleanup: cleanup, isActive: active, context: Object.assign({}, formContext || {})
    };
  };

  const executeCustomFormLogic = (logicSource, runtime) => {
    if (!logicSource) return undefined;
    if (typeof logicSource !== 'string' || !runtime || typeof runtime.exe !== 'function') {
      throw new Error('La lógica del formulario personalizado no es compatible.');
    }
    const logic = Function('exe', '$', 'jQuery', 'document', 'window', 'context',
      'MutationObserver', 'setTimeout', 'clearTimeout',
      'return function(){\n' + logicSource + '\n};')(
        runtime.exe, runtime.$, runtime.jQuery, runtime.document, runtime.window, runtime.context,
        runtime.MutationObserver, runtime.setTimeout, runtime.clearTimeout
      );
    return logic.call({
      exe: runtime.exe,
      context: runtime.context,
      policyId: runtime.context && runtime.context.policyId,
      lifePolicyId: runtime.context && runtime.context.policyId
    });
  };

  const readCustomClaimForm = (raw) => {
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      return { outer: {}, fields: [], serialized: true };
    }
    let outer;
    try {
      outer = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (failure) {
      throw new Error('El formulario personalizado del siniestro no es compatible.');
    }
    if (!outer || typeof outer !== 'object' || Array.isArray(outer)) {
      throw new Error('El formulario personalizado del siniestro no es compatible.');
    }
    const section = outer[CLAIM_CUSTOM_SECTION];
    if (section === null || section === undefined || section === '') {
      return { outer: outer, fields: [], serialized: true };
    }
    let fields;
    try {
      fields = typeof section === 'string' ? JSON.parse(section) : section;
    } catch (failure) {
      throw new Error('El formulario personalizado del siniestro no es compatible.');
    }
    if (!Array.isArray(fields)) {
      throw new Error('El formulario personalizado del siniestro no es compatible.');
    }
    const seen = {};
    fields.forEach((field) => {
      if (!field || !Object.prototype.hasOwnProperty.call(CLAIM_CUSTOM_FIELD_TYPES, field.name)) return;
      if (seen[field.name]) throw new Error('El formulario tiene campos personalizados duplicados.');
      seen[field.name] = true;
      if (field.type !== CLAIM_CUSTOM_FIELD_TYPES[field.name]) {
        throw new Error('El campo personalizado ' + field.name + ' no es compatible.');
      }
      if (field.name === 'descripcion') {
        if (field.userData === undefined || field.userData === null
          || Array.isArray(field.userData) && field.userData.length === 0) {
          field.userData = [''];
        } else if (!Array.isArray(field.userData)
          || field.userData.length !== 1 || typeof field.userData[0] !== 'string') {
          throw new Error('El campo personalizado descripcion no tiene un valor editable compatible.');
        }
      }
    });
    return { outer: outer, fields: fields, serialized: typeof section === 'string' };
  };

  const customClaimFieldValue = (form, name) => {
    const field = form.fields.find((item) => item && item.name === name);
    return field && Array.isArray(field.userData) && field.userData.length
      ? String(field.userData[0]) : '';
  };

  const updateCustomClaimFields = (raw, changes, configuredForms) => {
    const form = readCustomClaimForm(raw);
    const names = Object.keys(changes || {});
    const adjusterNames = ['ajustadorName', 'ajustadorEmail', 'hiddenAjustador'];
    const adjusterChangeCount = adjusterNames.filter((name) => names.indexOf(name) !== -1).length;
    if (adjusterChangeCount !== 0 && adjusterChangeCount !== 3) {
      throw new Error('El ajustador requiere actualización atómica.');
    }
    const updates = [];
    names.forEach((name) => {
      if (name !== 'descripcion' && adjusterNames.indexOf(name) === -1) {
        throw new Error('El campo personalizado ' + name + ' no admite escritura.');
      }
      let field = form.fields.find((item) => item && item.name === name);
      if (!field && adjusterNames.indexOf(name) !== -1) {
        const configuredForm = (configuredForms || []).find((item) => item && item.label === CLAIM_CUSTOM_SECTION);
        const configuredField = configuredForm && configuredForm.fields
          && configuredForm.fields.find((item) => item && item.name === name);
        if (configuredField) {
          field = Object.assign({}, configuredField, { userData: [changes[name]] });
          form.fields.push(field);
        }
      }
      if (!field) throw new Error('Campo personalizado no compatible: ' + name + '.');
      const value = changes[name];
      if (typeof value !== 'string') {
        throw new Error('El campo personalizado ' + name + ' requiere texto.');
      }
      if (name !== 'descripcion' && value.trim() === '') throw new Error('El ajustador está vacío.');
      if (name !== 'descripcion' && (!Array.isArray(field.userData)
        || field.userData.length !== 1 || typeof field.userData[0] !== 'string')) {
        throw new Error('El campo ' + name + ' no es editable.');
      }
      updates.push([field, value]);
    });
    updates.forEach((update) => { update[0].userData = [update[1]]; });
    form.outer[CLAIM_CUSTOM_SECTION] = form.serialized ? JSON.stringify(form.fields) : form.fields;
    return JSON.stringify(form.outer);
  };

  const CLAIMANT_TYPES = ['Afectado', 'Asegurado', 'Tercera Persona'];
  const readClaimantType = (raw) => {
    const value = customClaimFieldValue(readCustomClaimForm(raw), 'tipoReclamante');
    return CLAIMANT_TYPES.includes(value) ? value : '';
  };
  const writeClaimantType = (raw, value) => {
    if (!CLAIMANT_TYPES.includes(value)) throw new Error('Seleccione Afectado, Asegurado o Tercera Persona.');
    const form = readCustomClaimForm(raw);
    const matches = form.fields.filter((item) => item && item.name === 'tipoReclamante');
    if (matches.length > 1) throw new Error('El campo Reclamante está duplicado.');
    const field = matches[0] || { type: 'hidden', name: 'tipoReclamante', label: 'Reclamante', access: false };
    field.userData = [value];
    if (!matches.length) form.fields.push(field);
    form.outer[CLAIM_CUSTOM_SECTION] = form.serialized ? JSON.stringify(form.fields) : form.fields;
    return JSON.stringify(form.outer);
  };

  const createDraft = (claim) => {
    const time = occurrenceTime(claim && claim.occurrence);
    const customForm = readCustomClaimForm(claim && claim.jCustomForms);
    const insuredEvent = claim && claim.InsuredEvent && typeof claim.InsuredEvent === 'object'
      ? claim.InsuredEvent : null;
    return {
      ...Object.fromEntries(Object.entries(extraRead(claim && claim.jCustomForms).values).map(([key, value]) => ['extra_' + key, value])),
      claimNumber: claim && firstValue(claim.code, claim.id),
      stageCode: claimStageCode(claim) || '',
      description: claim ? claim.description : null,
      claimantId: claim && positiveIdText(claim.claimerId) || '',
      claimantType: readClaimantType(claim && claim.jCustomForms),
      claimantLabel: readClaimantType(claim && claim.jCustomForms),
      eventReasonCode: claim && typeof claim.eventReason === 'string' ? claim.eventReason : '',
      insuredEventCode: claim ? String(firstValue(claim.insuredEvent,
        insuredEvent && insuredEvent.code) || '') : '',
      insuredEvent: insuredEvent,
      assignedToName: customClaimFieldValue(customForm, 'ajustadorName'),
      assignedToEmail: customClaimFieldValue(customForm, 'ajustadorEmail'),
      assignedToCode: customClaimFieldValue(customForm, 'hiddenAjustador'),
      additionalObservations: customClaimFieldValue(customForm, 'descripcion'),
      occurrenceDate: formatDate(claim && claim.occurrence) || '',
      occurrenceHour: time.hour || '',
      occurrenceMinute: time.minute || '',
      occurrencePeriod: time.period || 'am',
      notificationDate: formatDate(claim && claim.notification) || ''
    };
  };

  const occurrenceIso = (draftValue) => {
    const date = validDateParts(draftValue.occurrenceDate, 'Fecha del Siniestro');
    const hour = Number(draftValue.occurrenceHour);
    const minute = Number(draftValue.occurrenceMinute);
    if (!/^\d{1,2}$/.test(String(draftValue.occurrenceHour || ''))
      || hour < 1 || hour > 12) {
      throw new Error('Hora del Siniestro no es válida.');
    }
    if (!/^\d{1,2}$/.test(String(draftValue.occurrenceMinute || ''))
      || minute < 0 || minute > 59) {
      throw new Error('Minuto del Siniestro no es válido.');
    }
    if (draftValue.occurrencePeriod !== 'am' && draftValue.occurrencePeriod !== 'pm') {
      throw new Error('Período del Siniestro no es válido.');
    }
    const hour24 = draftValue.occurrencePeriod === 'pm'
      ? (hour % 12) + 12 : hour % 12;
    // The form captures browser-local time; persist its equivalent UTC instant.
    return new Date(date.year, date.month - 1, date.day, hour24, minute, 0).toISOString();
  };

  const serializeEntity = (claim) => {
    const entity = {};
    Object.keys(claim || {}).forEach((key) => {
      entity[key] = claim[key];
    });
    ['Policy', 'Contact', 'Claimer', 'Process', 'Payouts', 'Payments',
      'EventReason', 'Stage', 'MasterClaim', 'Organization', 'ReEvent',
      'Procedures', 'Documents', 'SalvageProcedures'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(entity, key)) entity[key] = null;
    });
    return entity;
  };

  const buildUpdate = (claim, draftValue, touchedFields, formsSnapshot) => {
    if (!canSaveClaim(claim, touchedFields)) {
      throw new Error('Debe reabrir el siniestro antes de modificar sus datos.');
    }
    if (!draftValue) throw new Error('No hay cambios disponibles para guardar.');
    const entity = serializeEntity(claim);
    const originalDraft = createDraft(claim);
    const occurrenceFields = ['occurrenceDate', 'occurrenceHour', 'occurrenceMinute', 'occurrencePeriod'];
    const occurrenceTouched = touchedFields
      ? occurrenceFields.some((field) => touchedFields[field])
      : occurrenceFields.some((field) => draftValue[field] !== originalDraft[field]);
    const notificationTouched = touchedFields
      ? !!touchedFields.notificationDate
      : draftValue.notificationDate !== originalDraft.notificationDate;
    const descriptionTouched = touchedFields
      ? !!touchedFields.description
      : draftValue.description !== originalDraft.description;
    const observationsTouched = touchedFields
      ? !!touchedFields.additionalObservations
      : draftValue.additionalObservations !== originalDraft.additionalObservations;
    const adjusterTouched = touchedFields
      ? !!touchedFields.assignedTo
      : ['Name', 'Email', 'Code'].some((suffix) =>
        draftValue['assignedTo' + suffix] !== originalDraft['assignedTo' + suffix]);
    const claimantTouched = touchedFields ? !!touchedFields.claimant
      : draftValue.claimantType !== originalDraft.claimantType;
    const eventReasonTouched = touchedFields ? !!touchedFields.eventReason
      : draftValue.eventReasonCode !== originalDraft.eventReasonCode;
    const insuredEventTouched = touchedFields ? !!touchedFields.insuredEvent
      : draftValue.insuredEventCode !== originalDraft.insuredEventCode;
    const stageTouched = touchedFields ? !!touchedFields.stageCode
      : draftValue.stageCode !== originalDraft.stageCode;
    entity.description = descriptionTouched ? draftValue.description : claim.description;
    const occurrenceValue = occurrenceTouched ? occurrenceIso(draftValue) : claim.occurrence;
    entity.occurrence = occurrenceValue;
    if (notificationTouched || occurrenceTouched) {
      if (typeof occurrenceValue !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(occurrenceValue)) {
        throw new Error('La fecha de ocurrencia no es válida.');
      }
      const occurrenceDate = occurrenceValue.slice(0, 10);
      const notificationDate = notificationTouched
        ? toUtcDate(draftValue.notificationDate, 'Fecha de Notificación')
        : typeof claim.notification === 'string' ? claim.notification.slice(0, 10) : '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(notificationDate)) {
        throw new Error('La fecha de notificación no es válida.');
      }
      if (notificationDate < occurrenceDate) {
        throw new Error('La fecha de notificación no puede ser anterior a la fecha de ocurrencia.');
      }
      entity.notification = notificationDate === occurrenceDate
        ? occurrenceValue : notificationTouched
          ? localMidnightIso(draftValue.notificationDate, 'Fecha de Notificación') : claim.notification;
    } else {
      entity.notification = claim.notification;
    }
    if (stageTouched) {
      if (!isValidStageCode(draftValue.stageCode)) throw new Error('El estado seleccionado no es válido.');
      entity.stageCode = draftValue.stageCode;
    }
    if (claimantTouched && !CLAIMANT_TYPES.includes(draftValue.claimantType)) {
      throw new Error('Seleccione Afectado, Asegurado o Tercera Persona.');
    }
    if (eventReasonTouched) {
      const reasonCode = typeof draftValue.eventReasonCode === 'string'
        ? draftValue.eventReasonCode.trim() : '';
      if (!reasonCode) throw new Error('La razón de evento seleccionada no es válida.');
      entity.eventReason = reasonCode;
    }
    if (insuredEventTouched) {
      const selectedEvent = insuredEventForUpdate(draftValue.insuredEvent, claim.claimType);
      if (selectedEvent.code !== draftValue.insuredEventCode) {
        throw new Error('El evento asegurado seleccionado no es consistente.');
      }
      entity.InsuredEvent = selectedEvent;
      entity.insuredEvent = selectedEvent.code;
    }
    let customFormsPayload = entity.jCustomForms;
    if (touchedFields && touchedFields.customForms) {
      customFormsPayload = serializeCustomForms(customFormsPayload, formsSnapshot || customFormsRef.current);
    }
    if (observationsTouched || adjusterTouched) {
      const customChanges = {};
      if (observationsTouched) customChanges.descripcion = draftValue.additionalObservations;
      if (adjusterTouched) {
        customChanges.ajustadorName = draftValue.assignedToName;
        customChanges.ajustadorEmail = draftValue.assignedToEmail;
        customChanges.hiddenAjustador = String(draftValue.assignedToCode);
      }
      customFormsPayload = updateCustomClaimFields(customFormsPayload, customChanges, formsSnapshot || customFormsRef.current);
    }
    if (claimantTouched) {
      customFormsPayload = writeClaimantType(customFormsPayload, draftValue.claimantType);
    } else if (touchedFields && touchedFields.customForms && readClaimantType(claim.jCustomForms)) {
      customFormsPayload = writeClaimantType(customFormsPayload, readClaimantType(claim.jCustomForms));
    }
    entity.jCustomForms = extraMerge(customFormsPayload, claim, draftValue, touchedFields);
    return entity;
  };

  const buildCreate = (values) => {
    const requiredIds = ['lifePolicyId', 'claimerId', 'contactId'];
    requiredIds.forEach((key) => {
      if (!Number.isSafeInteger(Number(values && values[key])) || Number(values[key]) <= 0) {
        throw new Error(key + ' es obligatorio.');
      }
    });
    if (!values.eventReason || !values.insuredEvent || !values.insuredEvent.code
      || !values.claimType || !values.occurrence || !values.notification
      || typeof values.elegibleCoverages !== 'string' || !values.elegibleCoverages.trim()) {
      throw new Error('Faltan datos verificados para crear el siniestro.');
    }
    return {
      lifePolicyId: Number(values.lifePolicyId),
      claimerId: Number(values.claimerId),
      nameOfPatient: String(Number(values.claimerId)),
      eventReason: values.eventReason,
      InsuredEvent: values.insuredEvent,
      elegibleCoverages: values.elegibleCoverages,
      claimType: values.claimType,
      stageCode: values.stageCode,
      occurrence: values.occurrence,
      notification: values.notification,
      created: values.notification,
      id: '0',
      description: values.description,
      jCustomForms: values.jCustomForms,
      contactId: Number(values.contactId)
    };
  };

  const clearNewClaimValidation = (...fields) => {
    if (!newClaimModeRef.current) return;
    setNewClaimValidation((current) => {
      const next = Object.assign({}, current);
      fields.forEach((field) => { delete next[field]; });
      return next;
    });
  };

  const changeDraft = (field, value) => {
    if (!draftRef.current || !currentClaimRef.current
      || savingRef.current || stageSavingRef.current || adjusterLoadingRef.current) return;
    const next = Object.assign({}, draftRef.current);
    next[field] = value;
    draftRef.current = next;
    touchedRef.current[field] = true;
    dirtyRef.current = true;
    setDraft(next);
    clearNewClaimValidation(field);
    if (field === 'additionalObservations') {
      const detail = customFormsRef.current.find((form) => form.label === CLAIM_CUSTOM_SECTION);
      const description = detail && detail.fields.find((item) => item && item.name === 'descripcion');
      if (description) description.userData = [String(value)];
      const instance = detail && customFormInstancesRef.current[detail.key];
      if (instance && instance.container) {
        const input = instance.container.querySelector('[name="descripcion"]');
        if (input && input.value !== String(value)) input.value = String(value);
      }
    }
  };

  const changeCustomFormValue = (label, name, value) => {
    if (!draftRef.current || !currentClaimRef.current
      || savingRef.current || stageSavingRef.current) return;
    const form = customFormsRef.current.find((item) => item.label === label);
    const field = form && form.fields.find((item) => item && item.name === name);
    if (!field) return;
    field.userData = [String(value === null || value === undefined ? '' : value)];
    touchedRef.current.customForms = true;
    dirtyRef.current = true;
    const mappedDraftFields = {
      descripcion: 'additionalObservations', ajustadorName: 'assignedToName',
      ajustadorEmail: 'assignedToEmail', hiddenAjustador: 'assignedToCode'
    };
    const mappedField = label === CLAIM_CUSTOM_SECTION ? mappedDraftFields[name] : null;
    if (mappedField) {
      const change = {};
      change[mappedField] = field.userData[0];
      const next = Object.assign({}, draftRef.current, change);
      draftRef.current = next;
      if (name === 'descripcion') touchedRef.current.additionalObservations = true;
      else touchedRef.current.assignedTo = true;
      setDraft(next);
    } else {
      setDraft(Object.assign({}, draftRef.current));
    }
  };

  const collectRenderedCustomForms = () => {
    const nextDraft = Object.assign({}, draftRef.current);
    const mappedFields = {
      descripcion: 'additionalObservations', ajustadorName: 'assignedToName',
      ajustadorEmail: 'assignedToEmail', hiddenAjustador: 'assignedToCode'
    };
    customFormsRef.current.forEach((form) => {
      const instance = customFormInstancesRef.current[form.key];
      if (instance && instance.renderer && Array.isArray(instance.renderer.userData)) {
        const fields = JSON.parse(JSON.stringify(instance.renderer.userData));
        if (JSON.stringify(fields) !== JSON.stringify(form.fields)) {
          touchedRef.current.customForms = true;
          dirtyRef.current = true;
        }
        form.fields = fields;
        if (form.label === CLAIM_CUSTOM_SECTION) {
          fields.forEach((field) => {
            const mapped = mappedFields[field.name];
            if (!mapped) return;
            const value = customClaimFieldValue(form, field.name);
            const currentValue = nextDraft[mapped] === null || nextDraft[mapped] === undefined
              ? '' : String(nextDraft[mapped]);
            if (!value && currentValue) {
              field.userData = [currentValue];
              return;
            }
            if (currentValue !== value) {
              nextDraft[mapped] = value;
              touchedRef.current[field.name === 'descripcion' ? 'additionalObservations' : 'assignedTo'] = true;
            }
          });
        }
      }
      if (instance && instance.container && typeof instance.container.checkValidity === 'function'
        && !instance.container.checkValidity()) {
        throw new Error('Complete los campos requeridos del formulario ' + form.label + '.');
      }
    });
    validateCustomForms(customFormsRef.current);
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  };

  const touchedClaimValue = (claim, field) => {
    if (field.startsWith('extra_')) return extraRead(claim.jCustomForms).values[field.slice(6)];
    if (field === 'occurrenceDate' || field === 'occurrenceHour'
      || field === 'occurrenceMinute' || field === 'occurrencePeriod') return claim.occurrence;
    if (field === 'notificationDate') return claim.notification;
    if (field === 'additionalObservations') {
      return customClaimFieldValue(readCustomClaimForm(claim.jCustomForms), 'descripcion');
    }
    if (field === 'customForms') return claim.jCustomForms;
    if (field === 'assignedTo') {
      const form = readCustomClaimForm(claim.jCustomForms);
      return {
        name: customClaimFieldValue(form, 'ajustadorName'),
        email: customClaimFieldValue(form, 'ajustadorEmail'),
        id: customClaimFieldValue(form, 'hiddenAjustador')
      };
    }
    if (field === 'claimant') return readClaimantType(claim.jCustomForms);
    if (field === 'eventReason') return claim.eventReason;
    if (field === 'insuredEvent') {
      return {
        code: firstValue(claim.insuredEvent, claim.InsuredEvent && claim.InsuredEvent.code),
        event: claim.InsuredEvent
      };
    }
    return claim[field];
  };

  const currentClaimantOption = (claim) => {
    if (!claim) return null;
    const contact = Object.assign({}, claim.Claimer || {}, { id: claim.claimerId });
    return claimantOption(contact, true);
  };

  const setClaimantOptionList = (options) => {
    claimantOptionsRef.current = options;
    setClaimantOptions(options);
  };

  const claimantOptionsWithCurrent = (options, claim) => {
    const current = currentClaimantOption(claim);
    if (!current || options.some((option) => option.value === current.value)) return options;
    return [current].concat(options);
  };

  const claimantOptionsWithSelection = (options, claim) => {
    const withCurrent = claimantOptionsWithCurrent(options, claim);
    const selectedId = draftRef.current && positiveIdText(draftRef.current.claimantId);
    const selectedLabel = draftRef.current && typeof draftRef.current.claimantLabel === 'string'
      ? draftRef.current.claimantLabel.trim() : '';
    if (!selectedId || !selectedLabel
      || withCurrent.some((option) => option.value === selectedId)) return withCurrent;
    return [{ value: selectedId, label: selectedLabel, disabled: false }].concat(withCurrent);
  };

  const searchClaimants = (queryValue) => {
    const query = typeof queryValue === 'string' ? queryValue.trim() : '';
    const claim = currentClaimRef.current;
    const claimIdValue = claim ? Number(claim.id) : null;
    if (!query) {
      cancelClaimantSearch();
      setClaimantOptionList(claimantOptionsWithSelection([], claim));
      setClaimantHasMore(false);
      setClaimantSearchError('');
      return Promise.resolve();
    }
    if (!mountedRef.current || !claim || routeClaimId() !== claimIdValue) {
      return Promise.resolve();
    }
    cancelClaimantSearch();
    const operationId = claimantSearchOperationRef.current + 1;
    const requestId = requestRef.current;
    claimantSearchOperationRef.current = operationId;
    setClaimantSearching(true);
    setClaimantSearchError('');
    const isCurrent = () => mountedRef.current
      && claimantSearchOperationRef.current === operationId
      && requestRef.current === requestId && routeClaimId() === claimIdValue;
    return repositoryRequest('GetContacts', {
      filter: claimantFilter(query), size: 10, page: 0, total: 0,
      tagFilterAll: null, tagFilterAny: null, include: null, getRelatedData: false
    }).then((result) => {
      if (!isCurrent()) return;
      const rows = strictOutData(result, 'búsqueda de reclamantes');
      const seen = {};
      const options = [];
      rows.forEach((row) => {
        const id = row && positiveIdText(row.id);
        if (!id || seen[id]) throw new Error('Respuesta de búsqueda de reclamantes incompatible.');
        seen[id] = true;
        const option = claimantOption(row, false);
        if (option) options.push(option);
        else if (!(row && (row.inactive === true || row.restricted === true
          || row.restrictedForUser === true))) {
          throw new Error('Respuesta de búsqueda de reclamantes incompatible.');
        }
      });
      setClaimantOptionList(claimantOptionsWithSelection(options, claim));
      const total = Number(result.total);
      setClaimantHasMore((Number.isFinite(total) && total > rows.length) || rows.length === 10);
    }).catch((caughtError) => {
      if (isCurrent()) {
        setClaimantSearchError(caughtError && caughtError.message
          ? caughtError.message : 'No se pudo buscar reclamantes.');
      }
    }).then(() => {
      if (!isCurrent()) return;
      setClaimantSearching(false);
    });
  };

  const scheduleClaimantSearch = (query) => {
    cancelClaimantSearch();
    claimantSearchTimerRef.current = window.setTimeout(() => {
      claimantSearchTimerRef.current = null;
      searchClaimants(query);
    }, 300);
  };

  const changeClaimant = (value) => {
    if (!CLAIMANT_TYPES.includes(value) || !draftRef.current
      || !mountedRef.current || !currentClaimRef.current
      || savingRef.current || stageSavingRef.current || adjusterLoadingRef.current
      || routeClaimId() !== Number(currentClaimRef.current.id)) return;
    cancelClaimantSearch();
    const next = Object.assign({}, draftRef.current, { claimantType: value, claimantLabel: value });
    const detail = customFormsRef.current.find((form) => form.label === CLAIM_CUSTOM_SECTION);
    const stored = detail && detail.fields.find((item) => item && item.name === 'tipoReclamante');
    if (stored) stored.userData = [value];
    const instance = detail && customFormInstancesRef.current[detail.key];
    const input = instance && instance.container && instance.container.querySelector('[name="tipoReclamante"]');
    if (input) input.value = value;
    draftRef.current = next;
    touchedRef.current.claimant = true;
    dirtyRef.current = true;
    setDraft(next);
    setError('');
  };

  const preservedOption = (options, value, label) => {
    if (!value || options.some((option) => option.value === value)) return options;
    return options.concat([{ value: value, label: label || value, disabled: true }]);
  };

  const eventOptionsForReason = (catalog, reasonCode, selectedCode, selectedEvent, claimType) => {
    const expectedMode = typeof claimType === 'string' ? claimType.trim() : '';
    const codes = catalog && catalog.mappings[reasonCode] || [];
    const options = codes.map((code) => catalog.eventByCode[code]).filter((event) =>
      event && event.disabled === false
        && (newClaimModeRef.current || !expectedMode || event.mode === expectedMode))
      .map((event) => ({ value: event.code, label: event.name }));
    const selectedName = selectedEvent && typeof selectedEvent.name === 'string'
      ? selectedEvent.name.trim() : selectedCode;
    return preservedOption(options, selectedCode, selectedName);
  };

  const setEventOptionList = (options) => {
    eventOptionsRef.current = options;
    setEventOptions(options);
  };

  const applyEventCatalogToDraft = (catalog, draftValue, claim) => {
    const selectedReason = draftValue && draftValue.eventReasonCode || '';
    const selectedReasonName = claim && claim.EventReason && personName(claim.EventReason)
      || selectedReason;
    const visibleReasons = preservedOption(catalog.reasonOptions,
      selectedReason, selectedReasonName);
    reasonOptionsRef.current = visibleReasons;
    setReasonOptions(visibleReasons);
    setEventOptionList(eventOptionsForReason(catalog, selectedReason,
      draftValue && draftValue.insuredEventCode || '',
      draftValue && draftValue.insuredEvent, claimTypeCode(claim)));
  };

  const loadClaimCatalogs = (requestedClaimId) => {
    const claim = currentClaimRef.current;
    const claimIdValue = Number(requestedClaimId);
    const isNewClaim = newClaimModeRef.current && claimIdValue === 0;
    const policy = claim && claim.Policy;
    const productValue = policy && policy.productCode !== null && policy.productCode !== undefined
      ? policy.productCode : policy && policy.Product ? policy.Product.code : null;
    const productCode = productValue === null || productValue === undefined ? '' : String(productValue).trim();
    if (!mountedRef.current || !claim || Number(claim.id) !== claimIdValue
      || !isNewClaim && routeClaimId() !== claimIdValue) return Promise.resolve();
    if (!productCode) {
      clearEventCatalog();
      setCatalogError('El siniestro no contiene un producto válido para cargar eventos.');
      return Promise.resolve();
    }
    const operationId = catalogOperationRef.current + 1;
    const requestId = requestRef.current;
    catalogOperationRef.current = operationId;
    catalogLoadingRef.current = true;
    setCatalogLoading(true);
    setCatalogError('');
    const isCurrent = () => mountedRef.current && catalogOperationRef.current === operationId
      && requestRef.current === requestId
      && (isNewClaim ? newClaimModeRef.current && currentClaimRef.current === claim
        : routeClaimId() === claimIdValue);
    return Promise.all([
      repositoryRequest('GetFullTable', { table: 'SysInsuredEventsPerCoverage', filter: '1=1' }),
      repositoryRequest('RepoEventReasonCatalog', catalogGetPayload()),
      repositoryRequest('RepoInsuredEventCatalog', catalogGetPayload())
    ]).then((results) => {
      if (!isCurrent()) return;
      const mappings = parseEventMatrix(strictOutData(results[0], 'tabla de eventos'), productCode);
      if (Object.keys(mappings).length === 0) {
        clearEventCatalog();
        throw new Error('No hay eventos configurados para el producto del siniestro.');
      }
      const reasonByCode = parseReasonCatalog(strictOutData(results[1], 'catálogo de razones'));
      const eventByCode = parseInsuredEventCatalog(strictOutData(results[2], 'catálogo de eventos'));
      const options = Object.keys(mappings).map((code) => {
        const reason = reasonByCode[code];
        if (!reason) throw new Error('La tabla contiene una razón de evento desconocida.');
        mappings[code].forEach((eventCode) => {
          const event = eventByCode[eventCode];
          if (!event) {
            throw new Error('La tabla contiene un evento asegurado incompatible: '
              + eventCode + ' para el producto ' + productCode + '.');
          }
        });
        return reason.disabled ? null : { value: reason.code, label: reason.name };
      }).filter(Boolean);
      if (options.length === 0) throw new Error('No hay razones de evento activas para este producto.');
      const catalog = {
        productCode: productCode, mappings: mappings, reasonByCode: reasonByCode,
        eventByCode: eventByCode, reasonOptions: options
      };
      eventCatalogRef.current = catalog;
      applyEventCatalogToDraft(catalog, draftRef.current, claim);
    }).catch((caughtError) => {
      if (isCurrent()) {
        setCatalogError(caughtError && caughtError.message
          ? caughtError.message : 'No se pudieron cargar los catálogos de eventos.');
      }
    }).then(() => {
      if (!isCurrent()) return;
      catalogLoadingRef.current = false;
      setCatalogLoading(false);
    });
  };

  const changeEventReason = (reasonCode) => {
    const code = typeof reasonCode === 'string' ? reasonCode.trim() : '';
    const selected = reasonOptionsRef.current.filter((option) => option
      && option.value === code && !option.disabled);
    const catalog = eventCatalogRef.current;
    if (selected.length !== 1 || !catalog || !draftRef.current
      || !currentClaimRef.current || savingRef.current || stageSavingRef.current
      || adjusterLoadingRef.current || !newClaimModeRef.current
        && routeClaimId() !== Number(currentClaimRef.current.id)) {
      setError('La razón de evento seleccionada no es válida.');
      return;
    }
    const next = Object.assign({}, draftRef.current, { eventReasonCode: code });
    const options = eventOptionsForReason(catalog, code,
      next.insuredEventCode, next.insuredEvent, claimTypeCode(currentClaimRef.current));
    const currentIsValid = options.some((option) => option.value === next.insuredEventCode
      && !option.disabled);
    if (!currentIsValid) {
      next.insuredEventCode = '';
      next.insuredEvent = null;
      touchedRef.current.insuredEvent = true;
    }
    draftRef.current = next;
    touchedRef.current.eventReason = true;
    dirtyRef.current = true;
    setDraft(next);
    clearNewClaimValidation('eventReasonCode');
    if (next.insuredEventCode) clearNewClaimValidation('insuredEventCode');
    setEventOptionList(eventOptionsForReason(catalog, code,
      next.insuredEventCode, next.insuredEvent, claimTypeCode(currentClaimRef.current)));
    setError('');
  };

  const changeInsuredEvent = (eventCode) => {
    const code = typeof eventCode === 'string' ? eventCode.trim() : '';
    const catalog = eventCatalogRef.current;
    const selected = eventOptionsRef.current.filter((option) => option
      && option.value === code && !option.disabled);
    const event = catalog && catalog.eventByCode[code];
    if (selected.length !== 1 || !event || event.disabled
      || !newClaimModeRef.current && event.mode !== claimTypeCode(currentClaimRef.current)
      || !draftRef.current || !currentClaimRef.current
      || savingRef.current || stageSavingRef.current || adjusterLoadingRef.current
      || !newClaimModeRef.current && routeClaimId() !== Number(currentClaimRef.current.id)) {
      setError('El evento asegurado seleccionado no es válido.');
      return;
    }
    const next = Object.assign({}, draftRef.current, {
      insuredEventCode: code,
      insuredEvent: {
        code: event.code, name: event.name, mode: event.mode,
        disabled: event.disabled, hasHealthProcedures: event.hasHealthProcedures
      }
    });
    draftRef.current = next;
    touchedRef.current.insuredEvent = true;
    dirtyRef.current = true;
    setDraft(next);
    clearNewClaimValidation('insuredEventCode');
    setError('');
  };

  const loadAdjusters = (requestedClaimId) => {
    const claim = currentClaimRef.current;
    const claimIdValue = Number(requestedClaimId);
    const isNewClaim = newClaimModeRef.current && claimIdValue === 0;
    if (adjusterLoadingRef.current || savingRef.current || stageSavingRef.current
      || !mountedRef.current || !Number.isSafeInteger(claimIdValue) || !isNewClaim && claimIdValue <= 0
      || !claim || Number(claim.id) !== claimIdValue
      || !isNewClaim && routeClaimId() !== claimIdValue) {
      return Promise.resolve();
    }
    const requestId = requestRef.current;
    const isCurrent = () => mountedRef.current && requestRef.current === requestId
      && (isNewClaim ? newClaimModeRef.current && currentClaimRef.current === claim
        : routeClaimId() === claimIdValue);
    adjusterLoadingRef.current = true;
    setAdjusterLoading(true); setError('');
    return repositoryRequest('LoadEntities', {
      fields: ADJUSTER_CATALOG_FIELDS,
      entity: 'Contact',
      filter: ADJUSTER_CATALOG_FILTER
    }).then((result) => {
      if (!isCurrent()) return;
      if (!result || result.ok === false || !Array.isArray(result.outData)) {
        throw new Error(result && result.msg ? result.msg : 'Respuesta de catálogo de ajustadores incompatible.');
      }
      const seen = {};
      const options = result.outData.map((row) => {
        const idIsScalar = row && (typeof row.id === 'number' || typeof row.id === 'string');
        const numericId = idIsScalar ? Number(row.id) : NaN;
        const value = String(numericId);
        const label = row && typeof row.name === 'string' ? row.name.trim() : '';
        if (!row || typeof row !== 'object' || Array.isArray(row)
          || !Number.isSafeInteger(numericId) || numericId <= 0 || label === '' || seen[value]) {
          throw new Error('Respuesta de catálogo de ajustadores incompatible.');
        }
        seen[value] = true;
        return { value: value, label: label };
      });
      adjusterOptionsRef.current = options;
      setAdjusterOptions(options);
    }).catch((caughtError) => {
      if (isCurrent()) {
        setError(caughtError && caughtError.message || 'No se pudo cargar el catálogo de ajustadores.');
      }
    }).then(() => {
      if (requestRef.current !== requestId) return;
      adjusterLoadingRef.current = false;
      if (mountedRef.current) setAdjusterLoading(false);
    });
  };

  const changeAdjuster = (contactId, contactName) => {
    const claim = currentClaimRef.current;
    const claimIdValue = claim ? Number(claim.id) : null;
    const isNewClaim = newClaimModeRef.current && claimIdValue === 0;
    const numericId = Number(contactId);
    const idText = String(numericId);
    const requestedName = typeof contactName === 'string' ? contactName.trim() : '';
    const matches = adjusterOptionsRef.current.filter((option) => option && option.value === idText);
    const nameText = matches.length === 1 && matches[0].label === requestedName ? matches[0].label : '';
    if (adjusterLoadingRef.current || savingRef.current || stageSavingRef.current
      || !mountedRef.current || !claim || !isNewClaim && routeClaimId() !== claimIdValue) return Promise.resolve();
    if (!Number.isSafeInteger(numericId) || numericId <= 0 || nameText === '') {
      setError('El ajustador no es válido.');
      return Promise.resolve();
    }
    const requestId = requestRef.current;
    const isCurrent = () => mountedRef.current && requestRef.current === requestId
      && (isNewClaim ? newClaimModeRef.current && currentClaimRef.current === claim
        : routeClaimId() === claimIdValue);
    adjusterLoadingRef.current = true;
    setAdjusterLoading(true); setError('');
    return repositoryRequest('LoadEntity', {
      entity: 'Contact', fields: 'email', filter: 'id=' + idText
    }).then((result) => {
      if (!isCurrent()) return;
      const contacts = responseRows(result, 'el contacto');
      const contact = contacts.length === 1 && contacts[0] && typeof contacts[0] === 'object'
        && !Array.isArray(contacts[0]) ? contacts[0] : null;
      const email = contact && typeof contact.email === 'string' ? contact.email.trim() : '';
      if (!contact || email === '' || (contact.id !== undefined && String(contact.id) !== idText)) {
        throw new Error('Respuesta de ajustador incompatible.');
      }
      const next = Object.assign({}, draftRef.current, {
        assignedToName: nameText, assignedToEmail: email, assignedToCode: idText
      });
      draftRef.current = next;
      touchedRef.current.assignedTo = true;
      dirtyRef.current = true;
      setDraft(next);
      const detail = customFormsRef.current.find((form) => form.label === CLAIM_CUSTOM_SECTION);
      if (detail) {
        const values = { ajustadorName: nameText, ajustadorEmail: email, hiddenAjustador: idText };
        detail.fields.forEach((field) => {
          if (!field || !Object.prototype.hasOwnProperty.call(values, field.name)) return;
          field.userData = [values[field.name]];
          const instance = customFormInstancesRef.current[detail.key];
          const input = instance && instance.container.querySelector('[name="' + field.name + '"]');
          if (input) input.value = values[field.name];
        });
      }
    }).catch((caughtError) => {
      if (isCurrent()) {
        setError(caughtError && caughtError.message || 'No se pudo cargar el ajustador.');
      }
    }).then(() => {
      if (requestRef.current !== requestId) return;
      adjusterLoadingRef.current = false;
      if (mountedRef.current) setAdjusterLoading(false);
    });
  };

  const refreshClaim = () => {
    if (savingRef.current || stageSavingRef.current || adjusterLoadingRef.current || documents.saving) return Promise.resolve();
    if (dirtyRef.current && !window.confirm('Hay cambios sin guardar. ¿Desea descartarlos?')) {
      return Promise.resolve();
    }
    const recoverCanceledCatalog = catalogLoadingRef.current && !eventCatalogRef.current;
    dirtyRef.current = false;
    touchedRef.current = {};
    return loadClaim(claimId).then(() => {
      if (recoverCanceledCatalog && !eventCatalogRef.current) return loadClaimCatalogs(claimId);
    });
  };

  const clearLoadedClaim = () => {
    resetAffected();
    resetDocuments();
    resetComments();
    customFormsOperationRef.current += 1;
    customFormsStatusRef.current = 'idle';
    if (customFormCleanupRef.current) customFormCleanupRef.current();
    customFormCleanupRef.current = null;
    customFormInstancesRef.current = {};
    customFormsRef.current = [];
    setCustomForms([]);
    setCustomFormsLoading(false);
    setCustomFormsError('');
    setActiveCustomForm('');
    currentClaimRef.current = null;
    draftRef.current = null;
    dirtyRef.current = false;
    touchedRef.current = {};
    setClaimStageSelection(null);
    setDraft(null);
    setEditable(false);
  };

  const changeClaimStage = (stageCode) => {
    if (!isValidStageCode(stageCode)) {
      if (mountedRef.current) setError('El estado seleccionado no es válido.');
      return;
    }
    if (!mountedRef.current || savingRef.current || stageSavingRef.current || adjusterLoadingRef.current
      || !currentClaimRef.current) return;
    if (!draftRef.current) return;
    const next = Object.assign({}, draftRef.current, { stageCode: stageCode });
    draftRef.current = next;
    touchedRef.current.stageCode = true;
    dirtyRef.current = true;
    setDraft(next);
    setClaimStageSelection(stageCode);
    clearNewClaimValidation('stageCode');
    setError('');
  };

  const updateClaimStage = () => {
    if (documents.saving) return Promise.resolve();
    const claim = currentClaimRef.current;
    const stageCode = stageSelectionRef.current;
    const savingClaimId = claim ? Number(claim.id) : null;
    if (stageSavingRef.current || savingRef.current || adjusterLoadingRef.current || !mountedRef.current
      || !claim || !Number.isSafeInteger(savingClaimId) || savingClaimId <= 0
      || routeClaimId() !== savingClaimId) return Promise.resolve();
    if (!isValidStageCode(stageCode)) {
      setError('El estado seleccionado no es válido.');
      return Promise.resolve();
    }
    if (claimStageCode(claim) === stageCode) {
      setError('El siniestro ya tiene el estado seleccionado.');
      return Promise.resolve();
    }
    if (dirtyRef.current) {
      setError('Guarde o descarte los cambios antes de actualizar el estado.');
      return Promise.resolve();
    }
    if (pendingStageConfirmationRef.current
      && pendingStageConfirmationRef.current.claimId === savingClaimId) {
      setError('La actualización anterior está pendiente de confirmación del servidor. Refresque para verificarla.');
      return Promise.resolve();
    }

    const operationId = stageOperationRef.current + 1;
    stageOperationRef.current = operationId;
    stageSavingRef.current = true;
    setStageSaving(true);
    setError('');
    const requestId = requestRef.current;
    return repositoryRequest('SetClaimStage', { claimId: savingClaimId, stageCode: stageCode })
      .then((result) => {
        if (!mountedRef.current || routeClaimId() !== savingClaimId
          || requestRef.current !== requestId) return;
        if (!result || result.ok !== true) {
          throw new Error(result && result.msg ? result.msg : 'No fue posible actualizar el estado.');
        }
        pendingStageConfirmationRef.current = { claimId: savingClaimId, stageCode: stageCode };
        notifyRecordUpdated();
        return loadClaim(savingClaimId);
      })
      .catch((caughtError) => {
        if (mountedRef.current && routeClaimId() === savingClaimId
          && requestRef.current === requestId) {
          setError(caughtError && caughtError.message
            ? caughtError.message : 'No fue posible actualizar el estado.');
        }
      })
      .then(() => {
        if (stageOperationRef.current !== operationId) return;
        stageSavingRef.current = false;
        if (mountedRef.current) setStageSaving(false);
      });
  };

  const createNewClaim = () => {
    const claim = currentClaimRef.current;
    const policy = claim && claim.Policy;
    if (!newClaimModeRef.current || !claim || !draftRef.current || !policy) return Promise.resolve();
    if (customFormsStatusRef.current === 'loading' || customFormsStatusRef.current === 'rendering') {
      setActiveTab('custom');
      setError('Espere a que terminen de cargar los formularios personalizados antes de crear el siniestro.');
      return Promise.resolve();
    }
    let entity;
    try {
      if (customFormsStatusRef.current === 'ready') collectRenderedCustomForms();
      const values = draftRef.current;
      const eligibleCoverages = (Array.isArray(policy.Coverages) ? policy.Coverages : [])
        .map((coverage) => Number(coverage && coverage.id))
        .filter((id, index, ids) => Number.isSafeInteger(id) && id > 0 && ids.indexOf(id) === index)
        .join(',');
      const invalid = {
        policy: !newClaimSelectedPolicy || !policy || !positiveIdText(policy.id || claim.lifePolicyId),
        eligibleCoverages: !eligibleCoverages,
        occurrenceDate: !values.occurrenceDate,
        occurrenceHour: !values.occurrenceHour,
        occurrenceMinute: !values.occurrenceMinute,
        occurrencePeriod: !values.occurrencePeriod,
        notificationDate: !values.notificationDate,
        stageCode: !values.stageCode,
        eventReasonCode: !values.eventReasonCode,
        insuredEventCode: !values.insuredEventCode
      };
      setNewClaimValidation(invalid);
      if (Object.keys(invalid).some((key) => invalid[key])) {
        throw new Error('Complete los campos requeridos del siniestro.');
      }
      const claimantId = positiveIdText(values.claimantId || claim.claimerId);
      const occurrence = occurrenceIso(Object.assign({}, values, {
        occurrenceHour: values.occurrenceHour || '12',
        occurrenceMinute: values.occurrenceMinute || '00',
        occurrencePeriod: values.occurrencePeriod || 'am'
      }));
      const occurrenceDate = occurrence.slice(0, 10);
      const notificationDate = toUtcDate(values.notificationDate, 'Fecha de Notificación');
      if (notificationDate < occurrenceDate) {
        throw new Error('La fecha de notificación no puede ser anterior a la fecha de ocurrencia.');
      }
      const notification = notificationDate === occurrenceDate
        ? occurrence : localMidnightIso(values.notificationDate, 'Fecha de Notificación');
      let dynamicForms = customFormsRef.current.length
        ? serializeCustomForms(null, customFormsRef.current) : null;
      dynamicForms = extraMerge(dynamicForms, claim, values, touchedRef.current);
      if (values.claimantType) dynamicForms = writeClaimantType(dynamicForms, values.claimantType);
      entity = buildCreate({
        lifePolicyId: claim.lifePolicyId || policy.id,
        claimerId: claimantId,
        contactId: claimantId,
        eventReason: values.eventReasonCode,
        insuredEvent: values.insuredEvent,
        stageCode: values.stageCode,
        // Native claim screen: the claim type is the mode of the selected insured event.
        claimType: values.insuredEvent && values.insuredEvent.mode || claim.claimType,
        occurrence: occurrence,
        notification: notification,
        description: values.description || '',
        jCustomForms: dynamicForms,
        elegibleCoverages: eligibleCoverages
      });
    } catch (validationError) {
      setError(validationError && validationError.message
        ? validationError.message : 'Complete los datos requeridos del siniestro.');
      return Promise.resolve();
    }
    savingRef.current = true;
    setSaving(true);
    setError('');
    return repositoryRequest('RepoClaim', { operation: 'ADD', entity: entity })
      .then((result) => {
        if (!result || result.ok !== true) {
          throw new Error(result && result.msg ? result.msg : 'No fue posible crear el siniestro.');
        }
        const rows = responseRows(result, 'el siniestro creado');
        const created = rows[0] || result.entity || result.data || result;
        const createdId = Number(created && (created.id || created.claimId));
        if (!Number.isSafeInteger(createdId) || createdId <= 0) {
          throw new Error('El siniestro fue creado, pero la respuesta no incluyó su identificador.');
        }
        dirtyRef.current = false;
        touchedRef.current = {};
        setNewClaimValidation({});
        notifyRecordUpdated();
        window.location.hash = '#/view/48?claimId=' + createdId;
      })
      .catch((caughtError) => {
        if (mountedRef.current) setError(caughtError && caughtError.message
          ? caughtError.message : 'No fue posible crear el siniestro.');
      })
      .then(() => {
        savingRef.current = false;
        if (mountedRef.current) setSaving(false);
      });
  };

  const saveClaim = () => {
    if (documents.saving) return Promise.resolve();
    if (newClaimModeRef.current) return createNewClaim();
    if (savingRef.current || stageSavingRef.current || adjusterLoadingRef.current
      || !mountedRef.current || !dirtyRef.current
      || !canSaveClaim(currentClaimRef.current, touchedRef.current)
      || routeClaimId() !== Number(currentClaimRef.current.id)) {
      return Promise.resolve();
    }
    if (customFormsStatusRef.current !== 'ready') {
      setActiveTab('custom');
      setError(customFormsStatusRef.current === 'loading' || customFormsStatusRef.current === 'rendering'
        ? 'Espere a que terminen de cargar los formularios personalizados antes de guardar.'
        : 'Los formularios personalizados deben cargarse correctamente antes de guardar. Use Reintentar.');
      return Promise.resolve();
    }
    try {
      collectRenderedCustomForms();
    } catch (validationError) {
      setError(validationError && validationError.message
        ? validationError.message : 'Revise los formularios personalizados.');
      return Promise.resolve();
    }
    const recoverCanceledCatalog = catalogLoadingRef.current && !eventCatalogRef.current;
    cancelClaimantSearch();
    cancelCatalogLoad();
    savingRef.current = true;
    setSaving(true);
    setError('');
    const savingClaimId = Number(currentClaimRef.current.id);
    const original = currentClaimRef.current;
    const savingDraft = Object.assign({}, draftRef.current);
    const touched = Object.assign({}, touchedRef.current);
    const savingForms = JSON.parse(JSON.stringify(customFormsRef.current));
    let updatedEntity = null;
    return repositoryRequest('RepoClaim', claimSaveReadPayload(savingClaimId))
      .then((result) => {
        if (!mountedRef.current || routeClaimId() !== savingClaimId) {
          throw new Error('La ruta cambió antes de guardar.');
        }
        const fresh = responseRows(result, 'el siniestro').find((row) =>
          row && Number(row.id) === savingClaimId);
        if (!fresh) throw new Error('No se encontró el siniestro antes de guardar.');
        const conflict = Object.keys(touched).some((field) =>
          JSON.stringify(touchedClaimValue(original, field))
            !== JSON.stringify(touchedClaimValue(fresh, field)));
        if (conflict) throw new Error('El siniestro fue modificado por otra sesión. Recargue antes de guardar.');
        updatedEntity = buildUpdate(fresh, savingDraft, touched, savingForms);
        return repositoryRequest('RepoClaim', {
          operation: 'UPDATE',
          entity: updatedEntity
        });
      })
      .then((result) => {
        if (!mountedRef.current || routeClaimId() !== savingClaimId) return;
        if (!result || result.ok !== true) {
          throw new Error(result && result.msg ? result.msg : 'No fue posible guardar el siniestro.');
        }
        dirtyRef.current = false;
        touchedRef.current = {};
        notifyRecordUpdated();
        const nextClaim = Object.assign({}, original, {
          closed: claimIsFinalized(original) && !['7', 'F'].includes(String(savingDraft.stageCode).trim().toUpperCase())
            ? false : original.closed,
          description: updatedEntity.description,
          occurrence: updatedEntity.occurrence,
          notification: updatedEntity.notification,
          stageCode: updatedEntity.stageCode,
          claimerId: updatedEntity.claimerId,
          eventReason: updatedEntity.eventReason,
          insuredEvent: touched.insuredEvent ? updatedEntity.insuredEvent : original.insuredEvent,
          InsuredEvent: touched.insuredEvent ? updatedEntity.InsuredEvent : original.InsuredEvent,
          jCustomForms: updatedEntity.jCustomForms
        });
        currentClaimRef.current = nextClaim;
        draftRef.current = savingDraft;
        setDraft(savingDraft);
        setEditable(canEdit(nextClaim));
        setClaimStageSelection(savingDraft.stageCode);
        const time = occurrenceTime(nextClaim.occurrence);
        const stageLabel = (CLAIM_STAGE_OPTIONS.find((option) => option.value === savingDraft.stageCode) || {}).label
          || savingDraft.stageCode;
        const reasonLabel = (reasonOptionsRef.current.find((option) => option.value === savingDraft.eventReasonCode) || {}).label
          || savingDraft.eventReasonCode;
        setClaimDetails((details) => Object.assign({}, details, {
          state: stageLabel || details.state,
          claimant: savingDraft.claimantLabel || details.claimant,
          cause: reasonLabel || details.cause,
          occurrence: formatDate(nextClaim.occurrence),
          notification: formatDate(nextClaim.notification),
          hour: time.hour,
          minute: time.minute,
          period: time.period,
          description: nextClaim.description
        }));
        const finalizingWithOpenReserves = touched.stageCode
          && !claimIsFinalized(original)
          && claimIsFinalized(nextClaim)
          && hasOpenReserveBalance(nextClaim);
        if (finalizingWithOpenReserves) return confirmReserveClosingAfterFinalization();
        return true;
      })
      .catch((caughtError) => {
        if (mountedRef.current && routeClaimId() === savingClaimId) {
          setError(caughtError && caughtError.message
            ? caughtError.message : 'No fue posible guardar el siniestro.');
        }
      })
      .then(() => {
        savingRef.current = false;
        if (mountedRef.current) setSaving(false);
        if (recoverCanceledCatalog && mountedRef.current && routeClaimId() === savingClaimId
          && !eventCatalogRef.current) return loadClaimCatalogs(savingClaimId);
      });
  };

  const loadClaim = (requestedClaimId) => {
    if (documents.saving && currentClaimRef.current && Number(currentClaimRef.current.id) === requestedClaimId) return Promise.resolve();
    const preserveVisibleSnapshot = currentClaimRef.current
      && Number(currentClaimRef.current.id) === requestedClaimId;
    const preservingNewClaim = newClaimModeRef.current && requestedClaimId === null
      && currentClaimRef.current && Number(currentClaimRef.current.id) === 0;
    if (preservingNewClaim) {
      if (mountedRef.current) setLoading(false);
      return Promise.resolve();
    }
    if (!preservingNewClaim) changeClaimContext(requestedClaimId);
    cancelClaimantSearch();
    cancelCatalogLoad();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!Number.isSafeInteger(requestedClaimId) || requestedClaimId <= 0) {
      if (mountedRef.current) {
        if (!preservingNewClaim) {
          setClaimSummary(EMPTY_SUMMARY);
          setClaimDetails(EMPTY_DETAILS);
        }
        setLoading(false);
        setValuationWarning('');
        if (!preservingNewClaim) clearLoadedClaim();
        setError(newClaimModeRef.current ? ''
          : 'Abra el siniestro desde «Ver» en Búsqueda de Siniestro. La dirección debe incluir un claimId válido.');
      }
      return Promise.resolve();
    }

    documentClaimLoadingRef.current = true;
    setLoading(true);
    setError('');
    setValuationWarning('');

    const claimRequest = repositoryRequest('RepoClaim', claimReadPayload(requestedClaimId));

    return claimRequest.then((result) => {
        if (!mountedRef.current || requestId !== requestRef.current || routeClaimId() !== requestedClaimId) return;
        const claims = responseRows(result, 'el siniestro');
        const claim = claims.find((row) => row && Number(row.id) === requestedClaimId);
        if (!claim) throw new Error('No se encontró el siniestro solicitado.');
        newClaimModeRef.current = false;
        setNewClaimMode(false);
        setNewClaimValidation({});
        setNewClaimSelectedPolicy(null);
        const nextDraft = createDraft(claim);
        const previousPolicy = currentClaimRef.current && (currentClaimRef.current.lifePolicyId
          || currentClaimRef.current.Policy && currentClaimRef.current.Policy.id);
        if (previousPolicy != null && Number(previousPolicy) !== Number(claim.lifePolicyId || claim.Policy && claim.Policy.id)) {
          resetComments();
        }
        const pendingDocument = documents.pending && documents.pending.claimId === requestedClaimId ? documents.pending : null;
        const pendingReconciliation = documents.needsReconciliation && currentClaimRef.current && Number(currentClaimRef.current.id) === requestedClaimId;
        resetDocuments();
        documents.pending = pendingDocument;
        documents.needsReconciliation = !!pendingReconciliation;
        currentClaimRef.current = claim;
        draftRef.current = nextDraft;
        dirtyRef.current = false;
        touchedRef.current = {};
        if (activeTab === 'recoveries') loadRecoveries(claim);
        if (activeTab === 'comments') loadComments();
        if (activeTab === 'documents') loadDocuments();
        setClaimantOptionList(claimantOptionsWithCurrent(claimantOptionsRef.current, claim));
        if (eventCatalogRef.current) {
          const policy = claim.Policy;
          const loadedProductValue = policy && policy.productCode !== null && policy.productCode !== undefined
            ? policy.productCode : policy && policy.Product ? policy.Product.code : null;
          const loadedProductCode = String(loadedProductValue || '').trim();
          if (eventCatalogRef.current.productCode === loadedProductCode) {
            applyEventCatalogToDraft(eventCatalogRef.current, nextDraft, claim);
          } else {
            clearEventCatalog();
            setCatalogError('Los catálogos deben recargarse para el producto del siniestro.');
          }
        }
        const nextStage = claimStageCode(claim);
        const pendingStage = pendingStageConfirmationRef.current;
        if (pendingStage && pendingStage.claimId === requestedClaimId) {
          if (nextStage === pendingStage.stageCode) {
            pendingStageConfirmationRef.current = null;
            setClaimStageSelection(nextStage);
          } else {
            setClaimStageSelection(pendingStage.stageCode);
            setError('La actualización fue aceptada, pero el estado aún está pendiente de confirmación del servidor.');
          }
        } else {
          setClaimStageSelection(nextStage);
        }
        setDraft(nextDraft);
        setEditable(canEdit(claim));
        const policy = claim.Policy || {};
        if (policy.id != null && claim.lifePolicyId != null && Number(policy.id) !== Number(claim.lifePolicyId)) {
          throw new Error('La póliza recibida no corresponde al siniestro solicitado.');
        }
        const nextCoverageRows = normalizeCoverageRows(claim);
        coverageRowsRef.current = nextCoverageRows;
        setCoverageRows(nextCoverageRows);
        resetAffected();
        if (activeTab === 'affected') loadAffectedFormInstances();
        setSelectedCoverageId((currentId) => nextCoverageRows.some((row) => row.id === Number(currentId))
          ? Number(currentId) : nextCoverageRows.length ? nextCoverageRows[0].id : null);
        const process = claim.Process || {};
        const stage = claim.Stage || {};
        const currency = typeof policy.currency === 'string' ? policy.currency.trim().toUpperCase() : '';
        let reserves = null;
        let payments = null;
        let expenses = null;
        let warning = '';
        if (Array.isArray(claim.Payouts) && currency) {
          const rows = claim.Payouts.filter((row) => row && Number(row.claimId) === requestedClaimId);
          const reserveType = (row) => String(row.reserveType || '').trim().toUpperCase();
          const indemnityRows = rows.filter((row) => reserveType(row) === 'IN' && effectiveIndemnityMovement(row));
          const expenseRows = rows.filter((row) => reserveType(row) === 'EX');
          const validHeaderAmount = (value) => (typeof value === 'number' || typeof value === 'string')
            && numericValue(value) !== null;
          const usesPolicyCurrency = (row) => {
            if (row.currency != null && typeof row.currency !== 'string') return false;
            const movementCurrency = (row.currency || '').trim().toUpperCase();
            if (movementCurrency) return movementCurrency === currency;
            // Legacy native movements omit currency; do not infer a conversion when FX evidence exists.
            const noFx = row.jFx == null || typeof row.jFx === 'string' && row.jFx.trim() === '';
            const noOriginalAmount = row.originalAmount == null
              || typeof row.originalAmount === 'string' && row.originalAmount.trim() === ''
              || validHeaderAmount(row.originalAmount) && numericValue(row.originalAmount) === 0;
            return noFx && noOriginalAmount;
          };
          // Expense movements belong to a separate channel, not these indemnity totals.
          const usable = rows.every((row) => ['IN', 'EX'].indexOf(reserveType(row)) !== -1)
            && indemnityRows.every((row) => usesPolicyCurrency(row)
              && validHeaderAmount(row.reserved) && validHeaderAmount(row.payed));
          if (usable) {
            // Payment movements reduce their own available balance, but are not a reserve reduction.
            reserves = indemnityRows.filter(isReserveMovement).reduce((total, row) => total + numericValue(row.reserved), 0);
            payments = indemnityRows.reduce((total, row) => total + numericValue(row.payed), 0);
            expenses = expenseRows.length ? expenseRows.reduce((total, row) => total + numericValue(row.payed), 0) : null;
          } else {
            warning = 'Reservas y pagos no disponibles: hay movimientos con moneda, tipo o importe no validado. ' + warning;
          }
        } else {
          warning = 'No se recibió la valoración completa o su moneda. ' + warning;
        }

        setClaimSummary({
          policy: {
            policyNumber: policy.code,
            lineOfBusiness: policy.lob,
            year: policyStartYear(policy.start),
            certificateNumber: policy.certificate,
            insured: personName(claim.Contact),
            payer: personName(policy.Payer),
            branch: policy.branchCode,
            policyType: policyTypeLabel(policy.policyType),
            startDate: formatDate(policy.start),
            endDate: formatDate(policy.end),
            creator: formatDate(process.fInicio),
            status: policy.entityState,
            modified: formatDate(policy.lastUpdate)
          },
          valuation: {
            currency: currency,
            reserves: reserves,
            payments: payments,
            recoveries: null,
            expenses: expenses,
            balance: valuationBalance(reserves, payments, expenses, null)
          }
        });
        loadPolicySummaryLabels(claim, requestId);
        if (activeTab !== 'recoveries') refreshValuationRecoveries(claim);
        const time = occurrenceTime(claim.occurrence);
        setClaimDetails({
          claimNumber: firstValue(claim.code, claim.id),
          state: firstValue(stage.name, (CLAIM_STAGE_OPTIONS.find((option) => option.value === nextStage) || {}).label,
            claim.stageCode, process.entityState, stage.code),
          claimant: readClaimantType(claim.jCustomForms),
          cause: firstValue(claim.EventReason && claim.EventReason.name, claim.eventReason),
          occurrence: formatDate(claim.occurrence),
          notification: formatDate(claim.notification),
          hour: time.hour, minute: time.minute, period: time.period,
          description: claim.description
        });
        setValuationWarning(warning);
        return loadCustomForms(claim);
      })
      .catch((caughtError) => {
        if (!mountedRef.current || requestId !== requestRef.current || routeClaimId() !== requestedClaimId) return;
        if (!preserveVisibleSnapshot) {
          setClaimSummary(EMPTY_SUMMARY);
          setClaimDetails(EMPTY_DETAILS);
        }
        clearLoadedClaim();
        setError(caughtError && caughtError.message
          ? caughtError.message : 'No fue posible cargar la información del siniestro.');
      })
      .then(() => {
        if (mountedRef.current && requestId === requestRef.current) { documentClaimLoadingRef.current = false; setLoading(false); }
      });
  };

  // Deployment endpoint supplied from the native upload request; configure per environment.
  const DOCUMENT_UPLOAD_ENDPOINT = 'https://sisos-api-latest.axxis-systems.net/proxy/upload';
  const documents = React.useRef({ rows: [], statuses: [], loaded: false, loading: false,
    saving: false, downloading: null, needsReconciliation: false, revision: 0, error: '', filter: null, uploadOpen: false, generateOpen: false,
    filterOpen: false, pending: null }).current;
  const [, renderDocuments] = React.useState(0);
  const notifyDocuments = () => { if (mountedRef.current) renderDocuments((value) => value + 1); };
  const resetDocuments = () => {
    Object.assign(documents, { rows: [], statuses: [], loaded: false, loading: false,
      saving: false, downloading: null, needsReconciliation: false, revision: documents.revision + 1, error: '', filter: null,
      uploadOpen: false, generateOpen: false, filterOpen: false, pending: null });
    notifyDocuments();
  };
  const documentInputRef = React.useRef(null);
  const documentClaimLoadingRef = React.useRef(false);
  const documentMutationBlocked = () => documents.saving || documents.loading || documents.needsReconciliation
    || savingRef.current || stageSavingRef.current || adjusterLoadingRef.current
    || reserveSavingRef.current || paymentSavingRef.current || !!recovery.write || documentClaimLoadingRef.current;
  const documentScope = () => {
    const claim = currentClaimRef.current;
    return mountedRef.current && claim && commentId(claim.id) === routeClaimId() ? claim : null;
  };
  const documentGuard = (claim, revision) => () => documentScope() === claim && documents.revision === revision;
  const documentUrl = (value) => {
    if (typeof value !== 'string' || !/^\/(?!\/)/.test(value) || /[\\\x00-\x1f?#]/.test(value)) return null;
    let decoded;
    try { decoded = decodeURIComponent(value); } catch (error) { return null; }
    if (/%(?:2f|5c)/i.test(value) || /[%\\\x00-\x1f?#]/.test(decoded)
      || decoded.split('/').some((part) => part === '.' || part === '..')) return null;
    return value;
  };
  const documentTemplates = () => {
    const claim = documentScope();
    try {
      const config = JSON.parse(claim.Policy.Product.configJson);
      const selected = config.Main.userSelectableClaimTemplates;
      if (!Array.isArray(selected) || !Array.isArray(config.Documents)) return [];
      // Conservative intersection observed in the native picker; do not execute product expressions.
      return Array.from(new Set(config.Documents.filter((item) => item && item.entity === 'CLAIM'
        && item.action == null && typeof item.template === 'string' && selected.indexOf(item.template) !== -1
        && (item.condition == null || item.condition === true || /^\s*1\s*==\s*1\s*$/.test(item.condition)))
        .map((item) => item.template)));
    } catch (error) { return []; }
  };
  const setDocumentFilter = (value) => { documents.filter = value || null; notifyDocuments(); };
  const visibleDocuments = () => documents.rows.filter((row) => !documents.filter || row.status === documents.filter);
  const loadDocuments = (afterWrite) => {
    const claim = documentScope();
    if (!claim || documents.loading || (documents.saving && afterWrite !== true)) return Promise.resolve(false);
    const current = documentGuard(claim, documents.revision);
    documents.loading = true; documents.error = ''; notifyDocuments();
    return Promise.all([
      repositoryRequest('RepoClaimDocument', { operation: 'GET', filter: 'claimId=' + claim.id }, undefined, current),
      repositoryRequest('RepoDocStatusCatalog', { operation: 'GET' }, undefined, current)
    ]).then((results) => {
      if (!current()) return false;
      const rows = responseRows(results[0], 'los documentos');
      const statuses = responseRows(results[1], 'los estados');
      if (!results[0] || !results[1] || !Array.isArray(results[0].outData) || !Array.isArray(results[1].outData) || rows.some((row) => !row || !commentId(row.id)
        || commentId(row.claimId) !== Number(claim.id) || !documentUrl(row.url)
        || typeof row.fileName !== 'string' || typeof row.name !== 'string')
        || new Set(rows.map((row) => Number(row.id))).size !== rows.length
        || statuses.some((row) => !row || typeof row.code !== 'string' || !row.code || typeof row.name !== 'string')
        || new Set(statuses.map((row) => row.code)).size !== statuses.length) throw new Error('La respuesta de documentos no es válida.');
      documents.rows = rows; documents.statuses = statuses; documents.loaded = true; documents.needsReconciliation = false;
      if (documents.pending) {
        if (rows.some((row) => row.url === documents.pending.entity.url)) documents.pending = null;
        else documents.pending.checked = true;
      }
      return true;
    }).catch(() => {
      if (current()) { documents.error = 'No fue posible consultar los documentos. Actualice para reintentar.'; documents.loaded = false; documents.rows = []; }
      return false;
    }).then((result) => { if (current()) { documents.loading = false; notifyDocuments(); } return result; });
  };
  const writeDocument = (operation, id, status) => {
    const claim = documentScope();
    if (!claim || documentMutationBlocked() || !documents.loaded) return Promise.resolve(false);
    const row = documents.rows.find((item) => Number(item.id) === commentId(id));
    let command = 'RepoClaimDocument'; let payload;
    if (operation === 'GENERATE') {
      if (documentTemplates().indexOf(id) === -1) return Promise.resolve(false);
      command = 'GenerateClaimDoc'; payload = { claimId: Number(claim.id), template: id };
    } else if (operation === 'ADD') {
      if (!documents.pending || !documents.pending.checked || documents.pending.claimId !== Number(claim.id)) return Promise.resolve(false);
      payload = { operation: 'ADD', entity: Object.assign({}, documents.pending.entity) };
    } else {
      if (!row || (operation !== 'DELETE' && operation !== 'UPDATE')) return Promise.resolve(false);
      if (operation === 'UPDATE' && !documents.statuses.some((item) => item.code === status)) return Promise.resolve(false);
      payload = { operation: operation, entity: Object.assign({}, row, operation === 'UPDATE' ? { status: status } : {}) };
    }
    const current = documentGuard(claim, documents.revision);
    documents.saving = true; documents.error = '';
    if (operation === 'ADD') documents.pending.checked = false;
    notifyDocuments();
    return repositoryRequest(command, payload, undefined, current).then((result) => {
      if (!current()) return false;
      if (!result || result.ok !== true) throw new Error('unconfirmed');
      if (operation === 'ADD') documents.pending = null;
      documents.generateOpen = false;
      return loadDocuments(true);
    }).catch(() => {
      if (current()) { documents.needsReconciliation = true; documents.error = 'No se confirmó la operación. Actualice y compruebe el resultado antes de volver a intentarlo.'; }
      return false;
    }).then((result) => { if (current()) { documents.saving = false; notifyDocuments(); } return result; });
  };
  const documentAuthorization = () => {
      let token;
      try {
        token = window.localStorage.getItem('token');
        if (typeof token !== 'string' || /[\x00-\x1f\x7f]/.test(token)) throw new Error('invalid');
        token = token.trim();
        if (token.charAt(0) === '"') token = JSON.parse(token);
        if (typeof token !== 'string' || /[\x00-\x1f\x7f]/.test(token)) throw new Error('invalid');
        token = token.trim().replace(/^Bearer(?: +|$)/i, '');
        if (!/^[A-Za-z0-9._~+\/-]+={0,}$/.test(token)) throw new Error('invalid');
      } catch (error) { throw new Error('document-auth'); }
      return 'Bearer ' + token;
  };
  const documentDownloadName = (row) => {
    const leaf = decodeURIComponent(row.url).split('/').pop();
    let name = typeof row.fileName === 'string' && row.fileName.trim() ? row.fileName.trim() : leaf;
    name = name.replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g, '_').replace(/^[. ]+|[. ]+$/g, '') || 'documento';
    const extension = leaf.match(/\.([a-z0-9]{1,10})$/i);
    if (extension && !/\.[a-z0-9]{1,10}$/i.test(name)) name += '.' + extension[1];
    return name;
  };
  const documentCanPreview = (blob) => {
    const type = String(blob && blob.type || '').split(';')[0].trim().toLowerCase();
    return type === 'application/pdf' || type === 'text/plain'
      || type.indexOf('image/') === 0 || type.indexOf('audio/') === 0 || type.indexOf('video/') === 0;
  };
  const downloadDocument = (id) => {
    const claim = documentScope();
    const row = documents.rows.find((item) => commentId(item.id) === commentId(id));
    if (!claim || !documents.loaded || documents.saving || documents.loading || documents.downloading
      || !row || commentId(row.claimId) !== Number(claim.id) || !documentUrl(row.url)) return Promise.resolve(false);
    const operation = {};
    const scopeCurrent = documentGuard(claim, documents.revision);
    const current = () => scopeCurrent() && documents.downloading === operation
      && documents.rows.some((item) => item.id === row.id && item.url === row.url);
    let documentWindow = null;
    try { documentWindow = window.open('about:blank', '_blank'); } catch (error) { documentWindow = null; }
    if (!documentWindow) {
      documents.error = 'El navegador bloqueó la nueva pestaña. Permita ventanas emergentes para abrir el documento.';
      notifyDocuments();
      return Promise.resolve(false);
    }
    try { documentWindow.opener = null; } catch (error) { /* The tab may already be navigating. */ }
    documents.downloading = operation; documents.error = ''; notifyDocuments();
    let browserStage = false;
    return Promise.resolve().then(() => {
      if (!current()) return null;
      const base = new URL('.', DOCUMENT_UPLOAD_ENDPOINT);
      const path = documentUrl(row.url);
      const downloadUrl = new URL(path.indexOf(base.pathname) === 0 ? path : base.pathname + path.slice(1), base.origin);
      return window.fetch(downloadUrl.href, {
        method: 'GET', headers: { Authorization: documentAuthorization() }, credentials: 'include', redirect: 'error', cache: 'no-store'
      });
    }).then((response) => {
      if (!current()) return null;
      if (!response || !response.ok || response.status === 304) {
        const status = response && Number.isInteger(response.status) && response.status >= 100 && response.status <= 599 ? response.status : 0;
        throw new Error('download-http:' + status);
      }
      return Promise.resolve().then(() => response.blob()).catch(() => { throw new Error('download-body'); });
    }).then((blob) => {
      if (!current()) return false;
      if (!blob || typeof blob.size !== 'number' || blob.size <= 0 || typeof blob.slice !== 'function') throw new Error('download-empty');
      browserStage = true;
      const objectUrl = window.URL.createObjectURL(blob);
      const fileName = documentDownloadName(row);
      if (documentCanPreview(blob)) {
        documentWindow.location.href = objectUrl;
      } else {
        const anchor = documentWindow.document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        anchor.rel = 'noopener noreferrer';
        documentWindow.document.body.appendChild(anchor);
        documentWindow.document.title = 'Descargando ' + fileName;
        anchor.click();
      }
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
      return true;
    }).catch((caught) => {
      if (current()) {
        const code = caught && caught.message;
        const http = /^download-http:\d+$/.test(code || '') ? Number(code.split(':')[1]) : 0;
        documents.error = browserStage ? 'El navegador no pudo iniciar la descarga.'
          : code === 'document-auth' ? 'No se pudo autenticar la descarga.'
          : http ? 'No se pudo descargar el archivo (HTTP ' + http + ').'
          : code === 'download-body' ? 'No se pudo leer el archivo recibido.'
          : code === 'download-empty' ? 'El archivo recibido está vacío o no es válido.'
          : code === 'document-window' ? 'No se pudo abrir la nueva pestaña del documento.'
          : 'No se pudo conectar con el servicio de archivos.';
      }
      if (!browserStage && documentWindow && !documentWindow.closed) {
        try { documentWindow.close(); } catch (error) { /* Ignore a tab closed by the browser. */ }
      }
      return false;
    }).then((result) => {
      if (documents.downloading === operation) { documents.downloading = null; notifyDocuments(); }
      return result;
    });
  };
  const uploadDocument = (file) => {
    const claim = documentScope();
    if (!claim || savingRef.current || documentMutationBlocked() || !documents.loaded || documents.pending || !file
      || typeof file.name !== 'string' || !file.name.trim()) return Promise.resolve(false);
    const current = documentGuard(claim, documents.revision);
    documents.saving = true; documents.error = ''; notifyDocuments();
    return Promise.resolve().then(() => {
      if (!current()) return null;
      const body = new FormData(); body.append('file', file);
      return window.fetch(DOCUMENT_UPLOAD_ENDPOINT, { method: 'POST', body: body, credentials: 'include',
        headers: { Authorization: documentAuthorization() }, redirect: 'error' });
    }).then((response) => {
      if (!current()) return null;
      if (!response || !response.ok) throw new Error('upload-http:' + (response && response.status || 0));
      return Promise.resolve().then(() => response.json()).catch(() => { throw new Error('upload-response'); });
    }).then((result) => {
      if (!current()) return false;
      if (!result || !documentUrl(result.url) || result.url.indexOf('/uploaded/') !== 0
        || typeof result.fileName !== 'string' || !Number.isFinite(result.created)) throw new Error('upload-response');
      documents.pending = { checked: true, claimId: Number(claim.id), entity: { claimId: Number(claim.id), name: 'uploaded', filename: file.name, url: result.url } };
      documents.saving = false;
      return writeDocument('ADD');
    }).catch((caught) => {
      if (current()) {
        const code = caught && caught.message;
        const status = /^upload-http:\d+$/.test(code || '') ? Number(code.split(':')[1]) : null;
        documents.error = code === 'document-auth' ? 'No se pudo autenticar la carga.'
          : status === 401 ? 'No se pudo cargar el archivo por un problema de autenticación (HTTP 401).'
          : status === 403 ? 'No tiene permisos para cargar archivos (HTTP 403).'
          : status === 413 ? 'El archivo supera el tamaño permitido (HTTP 413).'
          : status ? 'No se pudo cargar el archivo (HTTP ' + status + ').'
          : code === 'upload-response' ? 'El servicio devolvió una respuesta inesperada. No se registró el documento.'
          : 'No se pudo conectar con el servicio de archivos. No se registró el documento.';
      }
      return false;
    }).then((result) => { if (current()) { documents.saving = false; notifyDocuments(); } return result; });
  };

  const formatDocumentCreated = (value) => {
    if (typeof value !== 'string' || !value) return EMPTY_VALUE;
    // Repository GET omits the UTC marker retained by ADD/GenerateClaimDoc.
    const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value) ? value + 'Z' : value;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? EMPTY_VALUE : date.toLocaleString('es', {
      year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    });
  };

  const policyFieldColumns = [
    [['Póliza', 'policyNumber'], ['Ramo', 'lineOfBusiness'], ['Año', 'year'], ['Sucursal', 'branch'], ['Nº Cert', 'certificateNumber']],
    [['Asegurado', 'insured'], ['Pagador', 'payer'], ['Creador', 'creator'], ['Modificado', 'modified']],
    [['Fecha inicio', 'startDate'], ['Fecha final', 'endDate'], ['Estado', 'status'], ['Tipo de póliza', 'policyType']]
  ];
  const valuationFields = [
    ['Reservas', 'reserves'], ['Pagos', 'payments'], ['Recuperaciones', 'recoveries'],
    ['Gastos', 'expenses'], ['Saldo', 'balance']
  ];
  const SearchIcon = () => (
    <span role="img" aria-label="Ver detalle" className="resumen-search-icon">
      <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
        <path d="M909.6 854.5 704.9 649.8a312.2 312.2 0 1 0-55.1 55.1l204.7 204.7a39 39 0 0 0 55.1-55.1ZM160 448a288 288 0 1 1 576 0 288 288 0 0 1-576 0Z" />
      </svg>
    </span>
  );
  const policySummaryLink = (field, value) => {
    const claim = currentClaimRef.current || {};
    const policy = claim.Policy || {};
    const targetId = field === 'policyNumber'
      ? firstValue(policy.id, claim.lifePolicyId)
      : field === 'insured'
        ? firstValue(claim.contactId, claim.Contact && claim.Contact.id)
        : field === 'payer'
          ? firstValue(policy.payerId, policy.Payer && policy.Payer.id, policy.PayerContact && policy.PayerContact.id)
          : null;
    const numericId = Number(targetId);
    const text = displayValue(value);
    if (text === EMPTY_VALUE || !Number.isSafeInteger(numericId) || numericId <= 0) return text;
    const route = field === 'policyNumber' ? 'lifePolicy' : 'contact';
    return <a className="resumen-summary-link" href={'/#/' + route + '/' + numericId}
      target="_blank" rel="noopener noreferrer">{text}</a>;
  };
  const paymentRequestLink = (value) => {
    const numericId = Number(value);
    const text = displayValue(value);
    if (text === EMPTY_VALUE || !Number.isSafeInteger(numericId) || numericId <= 0) return text;
    return <a className="resumen-payment-request-link"
      href={'https://sisos-latest.axxis-systems.net/#/payments/' + numericId}
      target="_blank" rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}>{text}</a>;
  };
  const loadPaymentRequestCatalogs = () => Promise.all([
    repositoryRequest('RepoPaymentMethodCatalog', { operation: 'GET' }),
    repositoryRequest('RepoPaymentTypeCatalog', { operation: 'GET' })
  ]).then(([methodsResult, typesResult]) => {
    if (!mountedRef.current) return;
    const methods = Array.isArray(methodsResult && methodsResult.outData) ? methodsResult.outData : [];
    const types = Array.isArray(typesResult && typesResult.outData) ? typesResult.outData : [];
    setPaymentRequestCatalogs({ methods: methods, types: types });
  }).catch(() => {
    // El detalle sigue disponible aunque un catálogo no pueda cargarse temporalmente.
  });

  const openPaymentRequestDetail = (row, kind) => {
    if (!row || row.checkRequestId == null) return;
    setPaymentRequestDetail({ row: row, kind: kind });
    loadPaymentRequestCatalogs();
  };
  const ReloadOutlinedIcon = () => (
    <span role="img" aria-label="reload" className="anticon anticon-reload">
      <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
        <path d="M909.1 209.3 862.6 364a8 8 0 0 1-10.7 5.1l-147.4-60.8a8 8 0 0 1-1.6-13.8l50.5-32.3A318.8 318.8 0 0 0 512 148c-176.7 0-320 143.3-320 320s143.3 320 320 320c149.4 0 274.8-102.4 310-240.9a8 8 0 0 1 7.8-6.1h49.8a8 8 0 0 1 7.8 9.8C849.5 717.9 696 844 512 844c-207.7 0-376-168.3-376-376S304.3 92 512 92c116.6 0 220.8 53.1 289.8 136.4l35.9-23a8 8 0 0 1 11.2 3.9z" />
      </svg>
    </span>
  );

  const DocumentIcon = ({ name }) => {
    const paths = {
      upload: 'M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5',
      generate: 'M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8M8 16h5',
      filter: 'M3 4h18l-7 8v7l-4 2v-9L3 4Z',
      refresh: 'M20 7v5h-5M4 17a8 8 0 0 0 14 2M20 7A8 8 0 0 0 6 4L3 7',
      inbox: 'M4 11 7 3h10l3 8v10H4V11Zm0 0h5l1 4h4l1-4h5',
      delete: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7'
    };
    return <svg className="resumen-document-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
  };

  const tabItems = [
    ['general', 'Datos Generales'], ['custom', 'Personalizada'], ['affected', 'Objeto Afectado'], ['coverage', 'Cobertura / Reservas'],
    ['payments', 'Pagos'], ['expenses', 'Gastos'], ['recoveries', 'Recuperaciones'],
    ['documents', 'Documentos'], ['comments', 'Comentarios']
  ];

  const SectionTitle = ({ children, className }) => (
    <h3 className={'resumen-section-title ' + (className || '')}>
      <span className="resumen-section-marker" aria-hidden="true" />{children}
    </h3>
  );
  const Field = React.useMemo(() => function Field({ label, required, invalid, children }) {
    return (
      <div className={'resumen-form-field' + (invalid ? ' resumen-field-invalid' : '')}>
        <label className="resumen-form-label">{label}{required ? <span className="resumen-required-mark">*</span> : null}:</label>
        <div className="resumen-form-control">{children}</div>
      </div>
    );
  }, []);
  const disabledInput = (placeholder, value) => (
    <Input size="small" disabled value={value === null || value === undefined ? undefined : String(value)} placeholder={placeholder || 'Sin datos'} />
  );
  const disabledSelect = (placeholder, value) => (
    <Select
      size="small"
      disabled
      value={value === null || value === undefined ? undefined : String(value)}
      placeholder={placeholder || 'Seleccione'}
      options={value === null || value === undefined ? [] : [{ value: String(value), label: String(value) }]}
    />
  );
  const isAutoClaim = extraMotor(currentClaimRef.current);
  const generalEditable = !!draft && !loading && !saving && !stageSaving && !adjusterLoading;
  const selectedCoverage = coverageRows.find((row) => row.id === Number(selectedCoverageId)) || null;
  const closeReservesDisabled = !editable || reserveSaving
    || !coverageRows.some((row) => row.paymentReserve !== 0 || row.expenseReserve !== 0);
  const selectedReserveHistory = currentClaimRef.current && Array.isArray(currentClaimRef.current.Payouts)
    ? currentClaimRef.current.Payouts.filter((item) => item
      && Number(item.claimId) === Number(currentClaimRef.current.id)
      && Number(item.lifeCoverageId) === Number(selectedCoverageId)
      && isReserveMovement(item)
      && numericValue(item.reserved) !== null && numericValue(item.reserved) !== 0
      && ['IN', 'EX'].indexOf(String(item.reserveType || '').trim().toUpperCase()) !== -1)
    : [];
  const paymentRows = normalizePaymentRows(currentClaimRef.current);
  const selectedPayment = paymentRows.find((row) => row.id === Number(selectedPaymentReserveId)) || null;
  const expenseRows = normalizeExpenseRows(currentClaimRef.current);
  const selectedExpense = expenseRows.find((row) => row.id === Number(selectedExpenseReserveId)) || null;
  const recoveryForm = recovery.form;
  const recoveryNet = recoveryForm ? roundMoney(Number(parseMoneyInput(recoveryForm.income) || 0)
    - Number(parseMoneyInput(recoveryForm.expenses) || 0)) : 0;
  const renderRecoveryField = (label, children, key) => (
    <div className="resumen-reserve-input" key={key}><label>{label}</label>{children}</div>
  );
  const recoveryColumns = ['No.', 'Tipo', 'Cobertura', 'Fecha', 'Ingreso', 'Gastos', 'Neto', 'Proceso'];
  const recoveryValues = (row) => {
    const type = recovery.types.find((item) => Number(item.value) === Number(row.type));
    const coverage = currentClaimRef.current.Policy.Coverages.find((item) => Number(item.id) === Number(row.coverageId)) || {};
    const status = firstValue(row.Process && row.Process.estado, row.Process && row.Process.entityState, row.entityState, null);
    return [row.id, type ? type.label : 'Tipo ' + row.type,
      firstValue(coverage.name, coverage.description, coverage.code, 'Cobertura ' + row.coverageId),
      displayValue(formatDate(row.start)), row.currency + ' ' + formatMoneyInput(row.income),
      row.currency + ' ' + formatMoneyInput(row.expenses), row.currency + ' ' + formatMoneyInput(row.netIncome),
      row.processId ? '#' + row.processId + (status ? ' — ' + status : '') : displayValue(status)];
  };
  const expenseCoverageRows = coverageRows.map((row) => ({
    id: row.id,
    name: row.name,
    available: expenseAvailableForCoverage(row)
  }));
  const beneficiaryOptions = paymentBeneficiaryOptions(currentClaimRef.current);
  const beneficiaryAccountOptions = paymentAccountOptions();
  const sourceAccountOptions = paymentSourceAccountOptions();
  const openCheckRequest = () => {
    if (!selectedPayment || nativePaymentGuidance(selectedPayment.paid, selectedPayment.status)) {
      setPaymentError(selectedPayment ? nativePaymentGuidance(selectedPayment.paid, selectedPayment.status) || 'Seleccione otro movimiento aprobado para pago.' : 'Seleccione un movimiento aprobado para pago.');
      return;
    }
    openPaymentCatalogs(selectedPayment.coverageId, selectedPayment.id, 'IN');
    setPaymentReference(selectedPayment.concept || '');
    setPaymentError('');
    setCheckRequestModalOpen(true);
  };
  const submitCheckRequest = () => submitClaimPayment(selectedPaymentReserveId, nativePaymentForm(paymentReference));
  const openExpenseCheckRequest = () => {
    if (!selectedExpense || nativePaymentGuidance(selectedExpense.paid, selectedExpense.status, 'EX')) {
      setExpenseError(selectedExpense ? nativePaymentGuidance(selectedExpense.paid, selectedExpense.status, 'EX') || 'Seleccione otro movimiento aprobado para pago.' : 'Seleccione un movimiento aprobado para pago.');
      return;
    }
    openPaymentCatalogs(selectedExpense.coverageId, selectedExpense.id, 'EX');
    setPaymentReference(selectedExpense.concept || '');
    setExpenseError('');
    setExpenseCheckRequestModalOpen(true);
  };
  const submitExpenseCheckRequest = () => submitClaimExpense(selectedExpenseReserveId, nativePaymentForm(paymentReference));
  const paymentCatalog = paymentCatalogRef.current;

  const selectedFinancialIssue = (selected) => {
    if (!selected || nativePaymentGuidance(selected.paid, selected.status)) return '';
    try {
      const claim = currentClaimRef.current;
      const payout = (claim.Payouts || []).find((row) => Number(row.id) === Number(selected.id));
      nativeSettlementAmount(claim, payout); return '';
    } catch (error) { return error.message; }
  };
  const closeCheckModal = (config) => {
    if (paymentSavingRef.current) return;
    closePaymentCatalogs();
    config.setCheckOpen(false);
  };
  // GLOB-1269: movement-scoped, read-only reinsurance consultation.
  const [movementReinsurance, setMovementReinsurance] = React.useState(null);
  const movementReinsuranceRequest = React.useRef(0);
  const closeMovementReinsurance = () => {
    movementReinsuranceRequest.current += 1;
    setMovementReinsurance(null);
  };
  React.useEffect(() => {
    closeMovementReinsurance();
    return () => { movementReinsuranceRequest.current += 1; };
  }, [claimId]);

  const openMovementReinsurance = (movementId) => {
    const claim = currentClaimRef.current;
    const id = Number(movementId);
    const owner = Number(claim && claim.id);
    const matches = claim && Array.isArray(claim.Payouts) ? claim.Payouts.filter((row) =>
      Number(row.id) === id && Number(row.claimId) === owner) : [];
    const request = ++movementReinsuranceRequest.current;
    const current = () => mountedRef.current && request === movementReinsuranceRequest.current
      && Number(currentClaimRef.current && currentClaimRef.current.id) === owner
      && routeClaimId() === owner;
    if (!Number.isSafeInteger(id) || id <= 0 || matches.length !== 1 || routeClaimId() !== owner) {
      setMovementReinsurance({ id: movementId, rows: [], loading: false, error: 'El movimiento seleccionado no está disponible. Refresque la vista.' });
      return Promise.resolve(false);
    }
    setMovementReinsurance({ id: id, rows: [], loading: true, error: '' });
    return repositoryRequest('RepoLossCession', {
      operation: 'GET', filter: 'lifeCoveragePayoutId=' + id,
      include: ['Cession', 'Payout', 'Participants.SubParts'], size: 0, page: 0
    }).then((result) => {
      if (!current()) return false;
      if (!result || result.ok !== true || !Array.isArray(result.outData)) {
        throw new Error(result && result.msg || 'No fue posible consultar el reaseguro.');
      }
      if (result.outData.some((row) => Number(row.lifeCoveragePayoutId) !== id
        || !row.Payout || Number(row.Payout.claimId) !== owner
        || !Array.isArray(row.Participants))) {
        throw new Error('La respuesta no permite verificar el reaseguro de este movimiento.');
      }
      setMovementReinsurance({ id: id, rows: result.outData, loading: false, error: '' });
      return true;
    }).catch((failure) => {
      if (current()) setMovementReinsurance({ id: id, rows: [], loading: false,
        error: failure && failure.message || 'No fue posible consultar el reaseguro.' });
      return false;
    });
  };
  const reinsuranceMoney = (value, currency) => value == null ? EMPTY_VALUE
    : Number(value).toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      + (currency ? ' ' + currency : '');
  const reinsuranceFields = [
    ['reserve', 'Reserva'], ['loss', 'Pérdida'],
    ['retainedReserve', 'Reserva retenida'], ['retainedLoss', 'Pérdida retenida'],
    ['cededReserve', 'Reserva cedida'], ['cededLoss', 'Pérdida cedida'],
    ['reinstatementPremium', 'Prima de reinstalación']
  ];
  const reinsuranceParticipants = (rows, sub) => <A.Table size="small" rowKey="id"
    dataSource={rows || []} pagination={false} scroll={{ x: true }}
    locale={{ emptyText: 'Sin participantes' }}
    columns={[
      { title: sub ? 'Subparticipante' : 'Participante', dataIndex: 'name' },
      ...(!sub ? [{ title: 'Línea', dataIndex: 'lineId' }] : []),
      { title: 'Participación %', dataIndex: 'split' },
      { title: 'Pérdida', dataIndex: 'loss', render: (v, r) => reinsuranceMoney(v, r.currency) },
      { title: 'Pagado', dataIndex: 'paid', render: (v, r) => reinsuranceMoney(v, r.currency) }
    ]}
    expandable={sub ? undefined : {
      rowExpandable: (row) => Array.isArray(row.SubParts) && row.SubParts.length > 0,
      expandedRowRender: (row) => reinsuranceParticipants(row.SubParts, true)
    }} />;
  const reinsuranceDetail = (row) => {
    let currencies = null;
    let currencyError = false;
    if (row.jAmounts) {
      try {
        currencies = JSON.parse(row.jAmounts);
        if (!currencies || typeof currencies !== 'object' || Array.isArray(currencies)
          || Object.keys(currencies).some((key) => !currencies[key] || typeof currencies[key] !== 'object')) {
          currencies = null; currencyError = true;
        }
      } catch (e) { currencyError = true; }
    }
    return <A.Tabs defaultActiveKey="distribution">
      <A.Tabs.TabPane tab="Distribución del reaseguro" key="distribution">
        <Row gutter={16}>
          {[
            ['Reclamo', reinsuranceFields.slice(0, 2)],
            ['Cedente', reinsuranceFields.slice(2, 4)],
            ['Reasegurador(es)', reinsuranceFields.slice(4, 6)]
          ].map(([title, fields]) => <Col xs={24} md={8} key={title}>
            <h4>{title}</h4><A.Descriptions bordered size="small" column={1}>
              {fields.map(([field, label]) => <A.Descriptions.Item key={field} label={label}>
                {reinsuranceMoney(row[field], row.currency)}
              </A.Descriptions.Item>)}
              {title === 'Reasegurador(es)' ? <A.Descriptions.Item label="Ex gratia">{row.exGratia ? 'Sí' : 'No'}</A.Descriptions.Item> : null}
            </A.Descriptions>
          </Col>)}
        </Row>
      </A.Tabs.TabPane>
      <A.Tabs.TabPane tab="Participantes" key="participants">
        {reinsuranceParticipants(row.Participants, false)}
      </A.Tabs.TabPane>
      <A.Tabs.TabPane tab="Valores por moneda" key="currencies" disabled={!row.jAmounts}>
        {currencyError ? <Alert type="error" message="No fue posible leer los valores por moneda." /> : null}
        {currencies && Object.keys(currencies).map((currency) => <div key={currency} style={{ marginBottom: 16 }}>
          <h4>{currency}</h4><A.Descriptions bordered size="small" column={3}>
            <A.Descriptions.Item label="Tipo de cambio">{displayValue(currencies[currency].fxRate)}</A.Descriptions.Item>
            <A.Descriptions.Item label="Fecha de cambio">{displayValue(currencies[currency].fxDate)}</A.Descriptions.Item>
            {reinsuranceFields.map(([field, label]) => <A.Descriptions.Item key={field} label={label}>
              {reinsuranceMoney(currencies[currency][field], currency)}
            </A.Descriptions.Item>)}
          </A.Descriptions>
        </div>)}
      </A.Tabs.TabPane>
    </A.Tabs>;
  };
  const renderMovementReinsurance = () => {
    const rows = movementReinsurance && Array.isArray(movementReinsurance.rows) ? movementReinsurance.rows : [];
    const first = rows[0] || {};
    const payout = currentClaimRef.current && Array.isArray(currentClaimRef.current.Payouts)
      ? currentClaimRef.current.Payouts.find((item) => Number(item.id) === Number(movementReinsurance && movementReinsurance.id)) : null;
    const total = (field) => rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
    const movementType = payout && Number(payout.payed) !== 0 ? 'Pago' : 'Reserva';
    const coverage = first.coverageName || (first.Cession && first.Cession.coverageId);
    const currency = first.currency || (payout && payout.currency);
    const summaryItems = [
      ['Movimiento', movementType],
      ['Cobertura', coverage],
      ['Reserva retenida', reinsuranceMoney(total('retainedReserve'), currency)],
      ['Reserva cedida', reinsuranceMoney(total('cededReserve'), currency)],
      ['Pérdida retenida', reinsuranceMoney(total('retainedLoss'), currency)],
      ['Pérdida cedida', reinsuranceMoney(total('cededLoss'), currency)]
    ];
    return <Modal
      title={<span>Reaseguro del movimiento <strong>{movementReinsurance ? movementReinsurance.id : ''}</strong></span>}
      visible={!!movementReinsurance} width={1200} destroyOnClose wrapClassName="resumen-reinsurance-modal"
      onCancel={closeMovementReinsurance}
      footer={<Button size="small" onClick={closeMovementReinsurance}>Cerrar</Button>}>
      {movementReinsurance && movementReinsurance.error ? <Alert type="error" showIcon message={movementReinsurance.error} /> : null}
      {movementReinsurance && !movementReinsurance.loading && !movementReinsurance.error && rows.length === 0
        ? <Alert type="info" showIcon message="Sin reaseguro asociado a este movimiento" /> : null}
      {movementReinsurance && movementReinsurance.loading ? <div className="resumen-reinsurance-loading"><Spin size="small" /> Consultando distribución...</div> : null}
      {!movementReinsurance || movementReinsurance.loading || movementReinsurance.error || rows.length === 0 ? null : <React.Fragment>
        <div className="resumen-reinsurance-summary">
          {summaryItems.map(([label, value]) => <div className="resumen-reinsurance-summary-item" key={label}>
            <span>{label}</span><strong title={value == null ? undefined : String(value)}>{displayValue(value)}</strong>
          </div>)}
        </div>
        <div className="resumen-reinsurance-context">
          <span>Siniestro: <strong>{displayValue(first.Payout && first.Payout.claimId)}</strong></span>
          <span>Contrato: <strong>{displayValue(first.contractId || (first.Cession && first.Cession.contractId))}</strong></span>
          <span>Línea: <strong>{displayValue(first.lineId || (first.Cession && first.Cession.lineId))}</strong></span>
          <span>Moneda: <strong>{displayValue(currency)}</strong></span>
        </div>
        <A.Tabs defaultActiveKey="distribution" className="resumen-reinsurance-tabs">
          <A.Tabs.TabPane tab="Distribución" key="distribution">
            <A.Table rowKey="id" size="small" dataSource={rows} pagination={false}
              scroll={{ x: 900 }} className="resumen-reinsurance-table"
              columns={[
                { title: 'Línea', dataIndex: 'lineId', render: (v, r) => v || (r.Cession && r.Cession.lineId) },
                { title: 'Contrato', dataIndex: 'contractId' },
                { title: 'Moneda', dataIndex: 'currency' },
                { title: 'Reserva retenida', dataIndex: 'retainedReserve', align: 'right', render: (v, r) => reinsuranceMoney(v, r.currency) },
                { title: 'Reserva cedida', dataIndex: 'cededReserve', align: 'right', render: (v, r) => reinsuranceMoney(v, r.currency) },
                { title: 'Pérdida retenida', dataIndex: 'retainedLoss', align: 'right', render: (v, r) => reinsuranceMoney(v, r.currency) },
                { title: 'Pérdida cedida', dataIndex: 'cededLoss', align: 'right', render: (v, r) => reinsuranceMoney(v, r.currency) },
                { title: 'Ex gratia', dataIndex: 'exGratia', render: (v) => v ? 'Sí' : 'No' }
              ]}
              expandable={{ expandedRowRender: reinsuranceDetail, expandRowByClick: true }} />
          </A.Tabs.TabPane>
          <A.Tabs.TabPane tab="Participantes" key="participants">
            {reinsuranceParticipants(rows.reduce((all, row) => all.concat(row.Participants || []), []), false)}
          </A.Tabs.TabPane>
        </A.Tabs>
      </React.Fragment>}
    </Modal>;
  };
  const renderFinancialSection = (config) => (
    <section className={'resumen-' + config.key} aria-label={config.ariaLabel}>
      <div className="resumen-coverage-toolbar">
        <SectionTitle>{config.sectionTitle}</SectionTitle>
        <div className="resumen-reserve-actions">
          <Button size="small" type="primary" disabled={!editable || paymentSaving || config.coverages.length === 0}
            onClick={config.openReserve}>{config.registerLabel}</Button>
          <Popconfirm title="¿Aprobar este movimiento de pago?" okText="Aprobar" cancelText="Cancelar"
            disabled={!editable || paymentSaving || !config.selected || config.selected.paid <= 0 || !(config.key === 'payments' ? [0, '0'] : [0, '0', 2, '2']).includes(config.selected.status)}
            onConfirm={() => approvePaymentMovement(config.selectedId, config.key === 'expenses' ? 'EX' : 'IN')}>
            <Button size="small" disabled={!editable || paymentSaving || !config.selected || config.selected.paid <= 0
              || !(config.key === 'payments' ? [0, '0'] : [0, '0', 2, '2']).includes(config.selected.status)}>Aprobar pago</Button>
          </Popconfirm>
          {config.key === 'payments' ? <React.Fragment>
            <Button size="small" disabled={!editable || paymentSaving || !config.selected || ![0, '0'].includes(config.selected.status)}
              onClick={() => requestPaymentMovementAction(config.selectedId, 'CANCEL')}>Anular pago</Button>
            <Button size="small" disabled={!editable || paymentSaving || !config.selected || ![1, '1', 3, '3'].includes(config.selected.status)}
              onClick={() => requestPaymentMovementAction(config.selectedId, 'REVERT')}>Revertir pago</Button>
          </React.Fragment> : null}
          <Button size="small" title={config.selected ? nativePaymentGuidance(config.selected.paid, config.selected.status, config.key === 'expenses' ? 'EX' : 'IN') || undefined : undefined}
            disabled={!editable || paymentSaving || !config.selected
            || !!nativePaymentGuidance(config.selected.paid, config.selected.status, config.key === 'expenses' ? 'EX' : 'IN') || config.selected.available <= 0}
            onClick={config.openCheck}>Solicitud de cheque</Button>
          <Button size="small" loading={sectionRefreshing} disabled={sectionRefreshing || paymentSaving}
            onClick={() => refreshSection(() => config.refresh(), config.errorSetter)}><ReloadOutlinedIcon /> Refrescar</Button>
        </div>
      </div>
      <small>Solo movimientos del siniestro actual. Disponible corresponde al saldo pendiente de solicitud del movimiento.</small>
      {selectedFinancialIssue(config.selected) ? <div role="alert" className="resumen-reserve-error">{selectedFinancialIssue(config.selected)}</div> : null}
      <div className="resumen-table-wrap"><table className="resumen-data-table">
        <thead><tr><th className="resumen-financial-payment-id">No.</th><th className="resumen-financial-coverage">Cobertura</th><th>Concepto</th>{['payments', 'expenses'].includes(config.key) ? <th className="resumen-financial-affected">Objeto afectado</th> : null}
          <th className="resumen-cell-number">{config.appliedLabel}</th>
          <th className="resumen-cell-number">Disponible</th>
          <th>Fecha</th><th>Beneficiario</th><th className="resumen-financial-check-request">Solicitud de cheque</th><th>Referencia</th><th>Estado</th><th>Reaseguro</th></tr></thead>
        <tbody>{config.rows.length ? config.rows.map((row) => (
          <tr key={row.id} tabIndex="0"
            className={row.id === Number(config.selectedId) ? 'resumen-row-selected' : ''}
            onClick={() => config.select(row.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') config.select(row.id);
            }}>
            <td className="resumen-financial-payment-id">{displayValue(row.id)}</td><td className="resumen-financial-coverage" title={row.coverage || undefined}>{displayValue(row.coverage)}</td><td>{displayValue(row.concept)}</td>
            {['payments', 'expenses'].includes(config.key) ? <td className="resumen-financial-affected" title={row.affectedObject || undefined}>{displayValue(row.affectedObject)}</td> : null}
            <td className="resumen-cell-number">{formatGridAmount(row.paid)}</td>
            <td className="resumen-cell-number">{formatGridAmount(row.available)}</td>
            <td>{displayValue(formatDate(row.date))}</td><td>{displayValue(row.beneficiary)}</td>
            <td className="resumen-financial-check-request">
              {paymentRequestLink(row.checkRequestId)}
              {row.checkRequestId != null ? <Button type="link" size="small"
                className="resumen-payment-request-detail"
                onClick={(event) => { event.stopPropagation(); openPaymentRequestDetail(row, config.key); }}>
                <SearchIcon />
              </Button> : null}
            </td>
            <td>{displayValue(row.payment && row.payment.reference)}</td>
            <td>{config.key === 'payments' ? paymentMovementStateLabel(row.status) : [0, 2].indexOf(Number(row.status)) !== -1 ? 'Pendiente de aprobación' : row.available > 0 ? 'Aprobado — disponible' : 'Aplicado'}</td>
            <td><Button size="small" onClick={(event) => { event.stopPropagation(); openMovementReinsurance(row.id); }}>Ver Reaseguro</Button></td>
          </tr>
        )) : <tr><td className="resumen-empty-row" colSpan="12">{config.emptyText}</td></tr>}</tbody>
      </table></div>
      {config.selected && nativePaymentGuidance(config.selected.paid, config.selected.status, config.key === 'expenses' ? 'EX' : 'IN') ? <div role="status">{nativePaymentGuidance(config.selected.paid, config.selected.status, config.key === 'expenses' ? 'EX' : 'IN')}</div> : null}
      {!config.reserveOpen && !config.checkOpen && config.error
        ? <div className="resumen-reserve-error">{config.error}</div> : null}
      <Modal title={config.registerTitle} visible={config.reserveOpen} footer={null} destroyOnClose
        maskClosable={!paymentSaving} closable={!paymentSaving} wrapClassName="resumen-reserve-modal"
        onCancel={() => { if (!paymentSaving) config.setReserveOpen(false); }}>
        <div className="resumen-reserve-form">
          <div className="resumen-reserve-input"><label>Cobertura</label><Select size="small"
            disabled={!editable || paymentSaving} value={config.coverageId == null ? undefined : Number(config.coverageId)}
            placeholder="Seleccione una cobertura"
            options={config.coverages.filter((row) => row.available !== null && row.available > 0)
              .map((row) => ({ value: row.id, label: row.name + ' — ' + formatAmount(row.available) }))}
            onChange={config.setCoverageId} /></div>
          {['payments', 'expenses'].includes(config.key) ? <div className="resumen-reserve-input">
            <label>Objeto afectado *</label>
            <Select size="small" aria-label="Objeto afectado" aria-required="true" allowClear
              loading={financialObjects.loading} disabled={!editable || paymentSaving || financialObjects.loading || !config.coverageId}
              value={financialObjects.selectedId == null ? undefined : financialObjects.selectedId}
              placeholder="Seleccione un objeto afectado"
              options={financialObjects.claim === currentClaimRef.current && financialObjects.coverageId === Number(config.coverageId)
                ? financialObjects.rows.map((object) => ({ value: object.key, label: financialObjectLabel(object) })) : []}
              onChange={(value) => selectFinancialObject(value, config.key)} />
            {financialObjects.error ? <div role="alert" className="resumen-reserve-error">{financialObjects.error}</div> : null}
          </div> : null}
          <div className="resumen-reserve-input"><label>Monto</label><Input size="small" inputMode="decimal"
            disabled={!editable || paymentSaving} value={formatMoneyInput(config.amount)}
            onChange={(event) => changeMoneyInput(event, config.setAmount)} /></div>
          <div className="resumen-reserve-input resumen-payment-concept">
            <label>Concepto</label>
            <TextArea rows={3} maxLength={250}
              disabled={!editable || paymentSaving} value={config.concept}
              onChange={(event) => config.setConcept(event.target.value)} /></div>
          {config.error ? <div className="resumen-reserve-error">{config.error}</div> : null}
          <div className="resumen-reserve-actions">
            <Button size="small" disabled={paymentSaving} onClick={() => config.setReserveOpen(false)}>Cancelar</Button>
            <Button size="small" type="primary" loading={paymentSaving} disabled={!editable || paymentSaving
              || ['payments', 'expenses'].includes(config.key) && (financialObjects.loading || !!financialObjects.error || !financialObjects.selectedId)}
              onClick={config.createReserve}>Registrar</Button>
          </div>
        </div>
      </Modal>
      <Modal title={config.checkTitle} visible={config.checkOpen} footer={null} destroyOnClose
        maskClosable={!paymentSaving} closable={!paymentSaving} wrapClassName="resumen-reserve-modal"
        onCancel={() => closeCheckModal(config)}>
        <div className="resumen-reserve-form">
          <div className="resumen-reserve-input"><label>Tipo de beneficiario</label><Select size="small"
            disabled={paymentSaving} value={paymentCatalog && paymentCatalog.type} options={paymentTypeOptions()}
            onChange={(value) => loadPaymentBeneficiaries(value)} /></div>
          <div className="resumen-reserve-input"><label>{paymentCatalog && paymentCatalog.type === 'OTH' ? 'Beneficiario'
            : (PAYMENT_TYPES.find((item) => item.value === (paymentCatalog && paymentCatalog.type)) || {}).label}</label><Select size="small"
            showSearch allowClear loading={paymentCatalog && paymentCatalog.loading}
            disabled={paymentSaving || !paymentCatalog} filterOption={paymentCatalog && paymentCatalog.type === 'OTH' ? false
              : (input, option) => String(option.label || '').toLowerCase().indexOf(input.toLowerCase()) !== -1}
            value={!paymentCatalog ? undefined : paymentCatalog.type === 'PRO' ? paymentCatalog.providerCode || undefined
              : paymentCatalog.contactId == null ? undefined : String(paymentCatalog.contactId)}
            placeholder="Seleccione o busque un beneficiario" options={beneficiaryOptions}
            onSearch={(query) => { if (paymentCatalog && paymentCatalog.type === 'OTH') loadPaymentBeneficiaries('OTH', query); }}
            onChange={selectPaymentBeneficiary} /></div>
          <div className="resumen-reserve-input"><label>Beneficiario adicional</label><Input size="small" maxLength={250}
            disabled={paymentSaving || !paymentCatalog || !paymentCatalog.contactId}
            value={paymentCatalog ? paymentCatalog.additionalBeneficiary : ''}
            onChange={(event) => { if (paymentCatalog) { paymentCatalog.additionalBeneficiary = event.target.value; notifyPaymentCatalog(); } }} /></div>
          <div className="resumen-reserve-input"><label>Cobertura</label><Input size="small" disabled
            value={config.selected ? config.selected.coverage : ''} /></div>
          <div className="resumen-reserve-input"><label>Monto de la solicitud</label><Input size="small" inputMode="decimal"
            disabled={paymentSaving || !paymentCatalog || !paymentCatalog.contactId} value={formatMoneyInput(paymentCatalog ? paymentCatalog.amount : '')}
            onChange={(event) => changeMoneyInput(event, (value) => { if (paymentCatalog) { paymentCatalog.amount = value; notifyPaymentCatalog(); } })} />
            <small>Disponible para este movimiento y beneficiario: {formatAmount(paymentCatalog && paymentCatalog.maximum || 0)}</small></div>
          {paymentCatalog && paymentCatalog.type === 'PRO' ? <div className="resumen-reserve-input"><label>Contacto proveedor</label>
            <Input size="small" disabled value={paymentCatalog.contactName || ''} /></div> : null}
          <div className="resumen-reserve-input"><label>Cuenta del beneficiario</label><Select size="small"
            loading={paymentCatalog && paymentCatalog.accountLoading}
            disabled={paymentSaving || !paymentCatalog || paymentCatalog.accountLoading || !paymentCatalog.contactId}
            value={paymentCatalog && paymentCatalog.accountId != null ? String(paymentCatalog.accountId) : undefined}
            placeholder="Seleccione una cuenta" options={beneficiaryAccountOptions} onChange={(value) => selectPaymentAccount(value, paymentReference)} /></div>
          <div className="resumen-reserve-input"><label>Cuenta de origen</label><Select size="small" showSearch allowClear filterOption={false}
            loading={paymentCatalog && paymentCatalog.sourceAccountLoading}
            disabled={paymentSaving || !paymentCatalog}
            value={paymentCatalog && paymentCatalog.sourceAccountId != null ? String(paymentCatalog.sourceAccountId) : undefined}
            placeholder="Busque una cuenta" options={sourceAccountOptions} onSearch={searchPaymentSourceAccounts}
            onChange={selectPaymentSourceAccount} /></div>
          <div className="resumen-reserve-input"><label>Método de pago</label><Select size="small" allowClear
            disabled={paymentSaving || !paymentCatalog || paymentCatalog.methodsLoading || !!paymentCatalog.claim.paymentMethodCode}
            value={paymentCatalog && paymentCatalog.method || undefined} placeholder="Seleccione un método de pago"
            options={paymentCatalog ? paymentCatalog.methods.map((row) => ({ value: row.code, label: row.name })) : []}
            onChange={(value) => selectPaymentMethod(value, paymentReference)} /></div>
          <div className="resumen-reserve-input"><label>Tipo de pago</label><Select size="small" allowClear
            disabled={paymentSaving || !paymentCatalog || paymentCatalog.methodsLoading}
            value={paymentCatalog && paymentCatalog.paymentType != null ? paymentCatalog.paymentType : undefined}
            placeholder="Seleccione un tipo de pago"
            options={paymentCatalog ? paymentCatalog.paymentTypes.map((row) => ({ value: row.code, label: row.name })) : []}
            onChange={(value) => { if (paymentCatalog) { paymentCatalog.paymentType = value; notifyPaymentCatalog(); } }} /></div>
          {paymentCatalog && paymentCatalog.info ? <div role="status">{paymentCatalog.info}</div> : null}
          {paymentCatalog && paymentCatalog.type === 'PRO' ? <div className="resumen-reserve-input"><label>Tipo de gestión</label>
            <Select size="small" disabled={paymentSaving} value={paymentCatalog.managementType}
              options={[{ value: 'DIRECT', label: 'Pago directo' }, { value: 'SO', label: 'Orden de servicio' }]}
              onChange={(value) => { paymentCatalog.managementType = value; notifyPaymentCatalog(); }} /></div> : null}
          {paymentCatalog && paymentCatalog.settlementError ? <div className="resumen-reserve-error">{paymentCatalog.settlementError}</div> : null}
          {paymentCatalog && (paymentCatalog.error || paymentCatalog.methodsError || paymentCatalog.sourceAccountError) ? <div className="resumen-reserve-error">
            {paymentCatalog.error || paymentCatalog.methodsError || paymentCatalog.sourceAccountError}
            <Button size="small" disabled={paymentSaving} onClick={() => openPaymentCatalogs(paymentCatalog.coverageId,
              paymentCatalog.payoutId, paymentCatalog.reserveType)}>Reintentar</Button></div> : null}
          <div className="resumen-reserve-input"><label>Referencia</label><Input size="small" maxLength={250}
            disabled={paymentSaving} value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)} /></div>
          {config.error ? <div className="resumen-reserve-error">{config.error}</div> : null}
          <div className="resumen-reserve-actions">
            <Button size="small" disabled={paymentSaving} onClick={() => closeCheckModal(config)}>Cancelar</Button>
            <Button size="small" type="primary" loading={paymentSaving}
              disabled={!editable || paymentSaving || !config.selected || !paymentCatalog || paymentCatalog.loading
                || paymentCatalog.methodsLoading || paymentCatalog.accountLoading || paymentCatalog.sourceAccountLoading
                || !!paymentCatalog.error || !!paymentCatalog.methodsError || !!paymentCatalog.sourceAccountError
                || !!paymentCatalog.settlementError || !(Number(paymentCatalog.amount) > 0) || Number(paymentCatalog.amount) > paymentCatalog.maximum
                || !paymentCatalog.contactId || !paymentCatalog.accountId || !paymentCatalog.sourceAccountId
                || paymentCatalog.paymentType == null || !paymentCatalog.additionalBeneficiary.trim() || !paymentReference.trim()}
              onClick={config.submitCheck}>Ejecutar solicitud</Button>
          </div>
        </div>
      </Modal>
      <Modal title={paymentRequestDetail && paymentRequestDetail.kind === config.key
        ? 'Detalle de solicitud de cheque ' + displayValue(paymentRequestDetail.row.checkRequestId)
        : 'Detalle de solicitud de cheque'}
        visible={!!paymentRequestDetail && paymentRequestDetail.kind === config.key}
        footer={<div className="resumen-reserve-actions"><Button size="small"
          onClick={() => setPaymentRequestDetail(null)}>Cerrar</Button></div>}
        destroyOnClose onCancel={() => setPaymentRequestDetail(null)}>
        {paymentRequestDetail && paymentRequestDetail.kind === config.key ? (() => {
          const detail = paymentRequestDetail.row;
          const payment = detail.payment || {};
          const beneficiaryType = PAYMENT_TYPES.find((item) => item.value === payment.beneficiaryType);
          const paymentMethod = paymentRequestCatalogs.methods.find((item) =>
            String(item && item.code || '').trim() === String(payment.paymentMethodCode || '').trim());
          const paymentType = paymentRequestCatalogs.types.find((item) =>
            String(item && item.code || '').trim() === String(payment.paymentType || '').trim());
          const status = config.key === 'payments'
            ? [payment.entityState, payment.Process && payment.Process.entityState].filter(Boolean).join(' / ') || 'Estado de solicitud no verificado'
            : [0, 2].indexOf(Number(detail.status)) !== -1
            ? 'Pendiente de aprobación' : detail.available > 0 ? 'Aprobado — disponible' : 'Aplicado';
          return <div className="resumen-payment-request-detail-grid">
            {config.key === 'payments' ? <div className="resumen-payment-request-detail-wide">
              <span>Solicitudes asociadas al movimiento</span>
              {(currentClaimRef.current.Payments || []).filter((request) => {
                try { return paymentRequestPayoutIds(request).includes(Number(detail.id)); } catch (error) { return false; }
              }).map((request) => <div key={request.id}>Solicitud #{request.id} — {displayValue(request.entityState)}{' '}
                <Button size="small" disabled={!editable || paymentSaving || request.entityState !== 'StartEvent_1'}
                  onClick={() => requestPaymentReversal(request.id)}>Revertir solicitud #{request.id}</Button>
              </div>)}
            </div> : null}
            <div><span>Solicitud</span><strong>{displayValue(detail.checkRequestId)}</strong></div>
            <div><span>Movimiento</span><strong>{displayValue(detail.id)}</strong></div>
            <div><span>Tipo</span><strong>{config.key === 'expenses' ? 'Gasto' : 'Pago'}</strong></div>
            <div><span>Tipo de beneficiario</span><strong>{displayValue(beneficiaryType && beneficiaryType.label || payment.beneficiaryType)}</strong></div>
            <div><span>Beneficiario</span><strong>{displayValue(detail.beneficiary)}</strong></div>
            <div><span>Beneficiario adicional</span><strong>{displayValue(detail.additionalBeneficiary)}</strong></div>
            <div><span>Cobertura</span><strong>{displayValue(detail.coverage)}</strong></div>
            <div><span>Objeto afectado</span><strong>{displayValue(detail.affectedObject)}</strong></div>
            <div><span>Monto de la solicitud</span><strong>{formatGridAmount(firstValue(payment.total, payment.amount, detail.paid))}</strong></div>
            <div><span>Cuenta del beneficiario</span><strong>{displayValue(firstValue(payment.accountNo, payment.accountNumber,
              payment.accountId != null ? '#' + payment.accountId : null))}</strong></div>
            <div><span>Cuenta de origen</span><strong>{displayValue(firstValue(payment.sourceAccountNo, payment.sourceAccountNumber,
              payment.sourceAccountId != null ? '#' + payment.sourceAccountId : null))}</strong></div>
            <div><span>Método de pago</span><strong>{displayValue(firstValue(payment.paymentMethodName, paymentMethod && paymentMethod.name, payment.paymentMethodCode))}</strong></div>
            <div><span>Tipo de pago</span><strong>{displayValue(firstValue(payment.paymentTypeName, paymentType && paymentType.name, payment.paymentType))}</strong></div>
            <div><span>Fecha</span><strong>{displayValue(formatDate(detail.date))}</strong></div>
            <div><span>Referencia</span><strong>{displayValue(payment.reference)}</strong></div>
            <div><span>Estado</span><strong>{status}</strong></div>
            <div className="resumen-payment-request-detail-wide"><span>Concepto</span><strong>{displayValue(detail.concept)}</strong></div>
          </div>;
        })() : null}
      </Modal>
    </section>
  );

  React.useEffect(() => {
    mountedRef.current = true;
    const syncClaimIdFromRoute = () => {
      if (dirtyRef.current && !newClaimModeRef.current
        && !window.confirm('Hay cambios sin guardar. ¿Desea descartarlos?')) {
        window.history.replaceState(null, '', routeRef.current);
        return;
      }
      dirtyRef.current = false;
      touchedRef.current = {};
      routeRef.current = window.location.href;
      const nextClaimId = routeClaimId();
      const preservingNewClaim = newClaimModeRef.current && nextClaimId === null
        && currentClaimRef.current && Number(currentClaimRef.current.id) === 0;
      if (!preservingNewClaim) changeClaimContext(nextClaimId);
      setClaimId(nextClaimId);
    };
    const warnUnsaved = (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('hashchange', syncClaimIdFromRoute);
    window.addEventListener('popstate', syncClaimIdFromRoute);
    window.addEventListener('beforeunload', warnUnsaved);
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      claimantSearchOperationRef.current += 1;
      catalogOperationRef.current += 1;
      customFormsOperationRef.current += 1;
      reserveOperationRef.current += 1;
      reserveSavingRef.current = false;
      if (customFormCleanupRef.current) customFormCleanupRef.current();
      if (claimantSearchTimerRef.current !== null) {
        window.clearTimeout(claimantSearchTimerRef.current);
        claimantSearchTimerRef.current = null;
      }
      window.removeEventListener('hashchange', syncClaimIdFromRoute);
      window.removeEventListener('popstate', syncClaimIdFromRoute);
      window.removeEventListener('beforeunload', warnUnsaved);
    };
  }, []);

  React.useEffect(() => {
    if (claimId != null || newClaimSelectedPolicy) return;
    newClaimModeRef.current = true;
    setNewClaimMode(true);
    setActiveTab('general');
    // La entrada directa no debe omitir la carga de ramos y productos que
    // realiza el inicializador normal del modal de nuevo reclamo.
    openNewClaimModal();
  }, [claimId, newClaimSelectedPolicy]);

  React.useEffect(() => {
    if (newClaimModeRef.current && claimId == null && currentClaimRef.current
      && Number(currentClaimRef.current.id) === 0) return;
    loadClaim(claimId).then(() => Promise.all([
      loadAdjusters(claimId), loadClaimCatalogs(claimId)
    ]));
  }, [claimId]);

  React.useEffect(() => {
    if (newClaimMode && claimId == null && currentClaimRef.current
      && Number(currentClaimRef.current.id) === 0) {
      loadClaimCatalogs(0);
    }
  }, [newClaimMode, newClaimSelectedPolicy, claimId, newClaimCatalogSeq]);

  React.useEffect(() => {
    if (customFormCleanupRef.current) customFormCleanupRef.current();
    customFormCleanupRef.current = null;
    customFormInstancesRef.current = {};
    // Loading omits the form containers; initialize only after their commit.
    if (customFormsLoading || customForms.length === 0) return undefined;
    const $ = window.jQuery || window.$;
    if (!$ || !$.fn || typeof $.fn.formRender !== 'function') {
      setCustomFormsError('El renderizador de formularios personalizados no está disponible.');
      customFormsStatusRef.current = 'error';
      return undefined;
    }
    const operationId = customFormsOperationRef.current;
    const cleanups = [];
    try {
      customForms.forEach((form) => {
        const container = document.getElementById(form.key);
        if (!container) throw new Error('No se encontró el contenedor de ' + form.label + '.');
        const runtime = createScopedFormRuntime(container, operationId, window, document, $, form.nativeName === 'frmCanalesSiniestroAXX2417' ? { claim: currentClaimRef.current, policy: currentClaimRef.current && currentClaimRef.current.Policy, fields: form.fields, editable: editable } : undefined);
        const renderer = $(container).formRender({ formData: form.fields });
        customFormInstancesRef.current[form.key] = { renderer: renderer, container: container, runtime: runtime };
        let syncTimer = null;
        Array.prototype.forEach.call(container.querySelectorAll('input,select,textarea,button'), (control) => {
          if (!editable) control.disabled = true;
        });
        const onValueChange = (event) => {
          const target = event.target;
          if (!target || !target.name) return;
          const value = target.type === 'checkbox' ? (target.checked ? target.value || 'true' : '') : target.value;
          changeCustomFormValue(form.label, target.name, value);
        };
        const syncProgrammaticValues = () => {
          syncTimer = null;
          Array.prototype.forEach.call(container.querySelectorAll('input[name],select[name],textarea[name]'), (control) => {
            const value = control.type === 'checkbox' ? (control.checked ? control.value || 'true' : '') : control.value;
            const field = form.fields.find((item) => item && item.name === control.name);
            const previous = field && Array.isArray(field.userData) ? String(field.userData[0] || '') : '';
            if (field && previous !== String(value || '')) changeCustomFormValue(form.label, control.name, value);
          });
        };
        const onClick = () => {
          if (syncTimer !== null) runtime.clearTimeout(syncTimer);
          syncTimer = runtime.setTimeout(syncProgrammaticValues, 0);
        };
        container.addEventListener('input', onValueChange);
        container.addEventListener('change', onValueChange);
        container.addEventListener('click', onClick);
        const cleanup = () => {
          if (syncTimer !== null) runtime.clearTimeout(syncTimer);
          container.removeEventListener('input', onValueChange);
          container.removeEventListener('change', onValueChange);
          container.removeEventListener('click', onClick);
          runtime.cleanup();
          delete customFormInstancesRef.current[form.key];
          container.innerHTML = '';
        };
        cleanups.push(cleanup);
        executeCustomFormLogic(form.logic, runtime);
      });
      const cleanupAll = () => cleanups.splice(0).forEach((cleanup) => cleanup());
      customFormCleanupRef.current = cleanupAll;
      customFormsStatusRef.current = 'ready';
      setCustomFormsError('');
      return cleanupAll;
    } catch (caughtError) {
      cleanups.splice(0).forEach((cleanup) => cleanup());
      customFormsStatusRef.current = 'error';
      setCustomFormsError(caughtError && caughtError.message
        ? caughtError.message : 'No fue posible renderizar el formulario personalizado.');
      return undefined;
    }
  }, [activeTab, customForms, customFormsLoading, editable]);

  React.useEffect(() => {
    const modal = affected.modal;
    if (!modal || modal.renderFailed) return undefined;
    const $ = window.jQuery || window.$;
    let cleanup = null;
    let retryTimer = null;
    const renderForm = (attempts) => {
      if (affected.modal !== modal) return;
      const container = affected.modalContainer;
      if (!container) {
        if (attempts > 0) retryTimer = window.setTimeout(() => renderForm(attempts - 1), 25);
        else {
          modal.renderFailed = true;
          modal.error = 'No se pudo inicializar el formulario del objeto afectado.';
          notifyAffected();
        }
        return;
      }
      if (!$ || !$.fn || typeof $.fn.formRender !== 'function') {
        modal.renderFailed = true;
        modal.error = 'El renderizador de formularios personalizados no está disponible.';
        notifyAffected();
        return;
      }
      const claim = currentClaimRef.current;
      const runtime = createScopedFormRuntime(container, customFormsOperationRef.current, window, document, $, {
        policyId: Number(claim && (claim.lifePolicyId || claim.Policy && claim.Policy.id)) || null,
        lob: String(claim && claim.Policy && claim.Policy.lob || ''),
        claimId: Number(claim && claim.id) || null,
        coverageId: modal.coverageId,
        formId: modal.formId
      });
      try {
      const renderer = $(container).formRender({ formData: prepareAffectedFormFields(claim, modal) });
      modal.renderer = renderer;
      let syncTimer = null;
      Array.prototype.forEach.call(container.querySelectorAll('input,select,textarea,button'), (control) => {
        if (!editable) control.disabled = true;
      });
      const onValueChange = (event) => {
        const target = event.target;
        if (!target || !target.name) return;
        const field = modal.fields.find((item) => item && item.name === target.name);
        if (!field) return;
        field.userData = [target.type === 'checkbox' ? (target.checked ? target.value || 'true' : '') : target.value];
      };
      const syncProgrammaticValues = () => {
        syncTimer = null;
        Array.prototype.forEach.call(container.querySelectorAll('input[name],select[name],textarea[name]'), (control) => {
          const field = modal.fields.find((item) => item && item.name === control.name);
          if (!field) return;
          field.userData = [control.type === 'checkbox' ? (control.checked ? control.value || 'true' : '') : control.value];
        });
      };
      const onClick = () => {
        if (syncTimer !== null) runtime.clearTimeout(syncTimer);
        syncTimer = runtime.setTimeout(syncProgrammaticValues, 0);
      };
      container.addEventListener('input', onValueChange);
      container.addEventListener('change', onValueChange);
      container.addEventListener('click', onClick);
      let readOnlyObserver = null;
      if (!editable && typeof window.MutationObserver === 'function') {
        const lockControls = () => Array.prototype.forEach.call(container.querySelectorAll('input,select,textarea,button'), (control) => {
          if (!control.disabled) control.disabled = true;
        });
        readOnlyObserver = new window.MutationObserver(lockControls);
        readOnlyObserver.observe(container, { childList: true, subtree: true });
      }
      executeCustomFormLogic(modal.logic, runtime);
      applyOptionalDeathControls(claim, modal, container);
      cleanup = () => {
        if (readOnlyObserver) readOnlyObserver.disconnect();
        if (syncTimer !== null) runtime.clearTimeout(syncTimer);
        container.removeEventListener('input', onValueChange);
        container.removeEventListener('change', onValueChange);
        container.removeEventListener('click', onClick);
        runtime.cleanup();
        container.innerHTML = '';
      };
      } catch (error) {
        runtime.cleanup();
        modal.renderFailed = true;
        modal.error = error.message || 'No fue posible cargar el formulario del objeto afectado.';
        notifyAffected();
      }
    };
    renderForm(8);
    return () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (cleanup) cleanup();
    };
  }, [affectedRevision, editable]);

  React.useEffect(() => {
    const style = document.createElement('style');
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    let frame = null;
    const fit = () => {
      const shell = shellRef.current;
      if (!shell) return;
      const viewport = window.innerHeight || document.documentElement.clientHeight || 0;
      const available = Math.max(0, Math.floor(viewport - Math.max(0, shell.getBoundingClientRect().top) - 8));
      shell.style.height = available + 'px';
      shell.style.maxHeight = available + 'px';
    };
    const scheduleFit = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fit);
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    style.setAttribute('data-informacion-resumen-reclamo-style', 'true');
    style.innerHTML = `
      .resumen-documents > .ant-alert { margin-bottom: 4px; }
      .resumen-documents .resumen-document-heading { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; color: var(--rz-brand-dark); font-size: 12.5px; font-weight: 700; line-height: 1.4; }
      .resumen-documents .resumen-document-heading:before { content: ""; width: 8px; height: 8px; flex: 0 0 8px; border-radius: 2px; background: var(--rz-accent); }
      .resumen-documents .resumen-document-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin: 0 0 4px; padding: 4px; border: 1px solid var(--rz-line); border-radius: 6px; background: #f8fbff; }
      .resumen-documents .resumen-document-toolbar .ant-btn { display: inline-flex; align-items: center; gap: 6px; padding: 0 8px; height: 26px; color: var(--rz-accent); font-size: 12px; border-radius: 5px; }
      .resumen-documents .resumen-document-toolbar .ant-btn[disabled] { color: #bfbfbf; }
      .resumen-documents .resumen-document-icon { width: 15px; height: 15px; flex: none; vertical-align: middle; }
      .resumen-documents .resumen-document-upload { box-sizing: border-box; width: 366px; max-width: 100%; min-height: 120px; padding: 12px 10px; margin-bottom: 4px; border: 1px dashed #b8c4d1; border-radius: 6px; background: #f8fbff; text-align: center; cursor: pointer; transition: border-color .2s, background .2s; }
      .resumen-documents .resumen-document-upload:hover, .resumen-documents .resumen-document-upload:focus-visible { border-color: #40a9ff; background: #f0faff; outline: 2px solid #91d5ff; outline-offset: 2px; }
      .resumen-documents .resumen-document-upload[aria-disabled="true"] { opacity: .6; cursor: not-allowed; }
      .resumen-documents .resumen-document-upload > .resumen-document-icon { width: 32px; height: 32px; color: #40a9ff; margin-bottom: 4px; }
      .resumen-documents .resumen-document-upload-title { margin: 4px 0; color: var(--rz-ink); font-size: 12px; line-height: 1.4; }
      .resumen-documents .resumen-document-upload-hint { margin: 0; color: var(--rz-muted); font-size: 11px; line-height: 1.4; }
      .resumen-documents .ant-table { margin-top: 4px; }
      .resumen-documents .ant-table-container { border: 1px solid #cbd1d8; border-radius: 6px; overflow: hidden; }
      .resumen-documents .ant-table-thead > tr > th { background: #bfbfbf; border-right: 1px solid #cbd1d8; border-bottom: 1px solid #cbd1d8; font-weight: 700; padding: 5px 8px; }
      .resumen-documents .ant-table-tbody > tr > td { padding: 5px 8px; line-height: 18px; vertical-align: middle; border-bottom: 1px solid #cbd1d8; }
      .resumen-documents .ant-table-tbody > tr:last-child > td { border-bottom: 0; }
      .resumen-documents .resumen-document-cell-ellipsis { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .resumen-documents .resumen-document-delete { color: #40a9ff; padding: 4px; }
      .resumen-documents .resumen-document-delete[disabled] { color: #bfbfbf; }

      .resumen-shell{--rz-ink:#1e293b;--rz-muted:#64748b;--rz-line:#e2e8f0;--rz-line-strong:#cbd5e1;--rz-page:#f4f6fa;--rz-brand:#1e4b8f;--rz-brand-dark:#15356b;--rz-brand-soft:#eaf1fb;--rz-accent:#2f6fce;--rz-good:#137a4c;--rz-warn:#9a5b12;--rz-warn-bg:#fdf3e3;--rz-warn-line:#f1d9ab;width:100%;min-height:0;padding:4px;box-sizing:border-box;color:var(--rz-ink);font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden;background:var(--rz-page)}
      .resumen-shell *{box-sizing:border-box}
      .resumen-shell .resumen-header{display:flex;align-items:center;gap:12px;min-height:50px;flex:0 0 auto;margin-bottom:4px;padding:2px 4px 4px;border-bottom:2px solid var(--rz-brand);background:transparent}
       .resumen-shell .resumen-header-icon{width:6px;height:30px;flex:0 0 6px;border-radius:3px;background:var(--rz-brand)}
       .resumen-shell .resumen-header-icon:before,.resumen-shell .resumen-header-icon:after{content:none}
       .resumen-shell .resumen-title{margin:0;color:var(--rz-brand-dark);font-size:17px;font-weight:700;letter-spacing:-.01em;line-height:1.3}
       .resumen-shell .resumen-header-claim-number{color:var(--rz-muted);font-size:12px;font-weight:600;white-space:nowrap}
       .resumen-shell .resumen-process-id{color:var(--rz-muted);font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}
       .resumen-shell .resumen-status{flex:0 0 auto;margin-bottom:4px}
      .resumen-shell .resumen-loading{display:flex;align-items:center;gap:8px;padding:4px 8px;color:var(--rz-brand-dark);background:var(--rz-brand-soft);border:1px solid #c7d9f2;border-radius:6px}
      .resumen-shell .resumen-recovery-warning{margin-top:4px;padding:4px 8px;color:var(--rz-warn);background:var(--rz-warn-bg);border:1px solid var(--rz-warn-line);border-radius:6px;font-size:12px}
       .resumen-shell .resumen-summary-card{flex:0 0 auto;border:1px solid #aebdcd;border-radius:8px;box-shadow:0 1px 3px rgba(15,23,42,.08)}
       .resumen-shell .resumen-summary-card>.ant-collapse-item{border-bottom:0}.resumen-shell .resumen-summary-card>.ant-collapse-item>.ant-collapse-header{color:#194b8b;font-weight:600;padding:4px 8px 4px 28px;border-bottom:1px solid #cbd5e1}.resumen-shell .resumen-summary-card .ant-collapse-arrow{color:#194b8b}.resumen-shell .resumen-summary-card .ant-collapse-content-box{padding:4px}
      .resumen-shell .resumen-section-title{display:flex;align-items:center;gap:8px;margin:0 0 4px;color:var(--rz-brand-dark);font-size:12.5px;font-weight:700;letter-spacing:.01em;line-height:1.4}
      .resumen-shell .resumen-section-marker{width:8px;height:8px;flex:0 0 8px;border-radius:2px;background:var(--rz-accent)}
      .resumen-shell .resumen-policy{padding-right:4px}
       .resumen-shell .resumen-valuation{height:100%;padding-left:4px;border-left:1px solid #cbd5e1}
      .resumen-shell .resumen-summary-field,.resumen-shell .resumen-valuation-row{display:flex;min-width:0;line-height:21px}
      .resumen-shell .resumen-summary-field{gap:6px;padding:2px 12px 2px 0}
      .resumen-shell .resumen-policy .resumen-summary-field{padding:1px 4px 1px 0;font-size:12.5px;line-height:19px}
      .resumen-shell .resumen-valuation .resumen-valuation-row{padding:1px 4px 1px 0;font-size:12.5px;line-height:19px}
      .resumen-shell .resumen-summary-label{flex:0 0 auto;color:var(--rz-muted);font-weight:500;white-space:nowrap}
      .resumen-shell .resumen-summary-value{min-width:0;color:var(--rz-accent);font-weight:600;overflow-wrap:anywhere}
      .resumen-shell .resumen-summary-link{color:inherit;text-decoration:none}
      .resumen-shell .resumen-summary-link:hover{text-decoration:underline}
      .resumen-shell .resumen-amount{min-width:0;color:var(--rz-ink);font-weight:600;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
      .resumen-shell .resumen-valuation-row{justify-content:space-between;gap:18px;padding:3px 0}
      .resumen-shell .resumen-amount{text-align:right;white-space:nowrap}
      .resumen-shell .resumen-balance{color:var(--rz-good);font-weight:700}
      .resumen-shell .resumen-valuation-income{color:#237804}
      .resumen-shell .resumen-valuation-expense{color:#cf1322}
      .resumen-shell .resumen-action-icon{margin-right:5px;color:var(--rz-accent);font-weight:700}
      .resumen-shell .resumen-tabs{flex:0 0 auto;display:flex;flex-wrap:wrap;gap:2px;min-height:32px;padding:0;overflow:visible;background:transparent;border-bottom:2px solid var(--rz-line-strong)}
      .resumen-shell .resumen-tab{flex:0 0 auto;display:flex;align-items:center;justify-content:center;height:32px;padding:0 8px;white-space:nowrap;border:0;border-bottom:3px solid transparent;margin-bottom:-2px;background:transparent;color:var(--rz-muted);font-size:12.5px;font-weight:500;cursor:pointer;transition:color .15s ease,border-color .15s ease}
      .resumen-shell .resumen-tab:hover{color:var(--rz-brand-dark)}
      .resumen-shell .resumen-tab-disabled,.resumen-shell .resumen-tab:disabled{color:#aeb7c4;cursor:not-allowed;opacity:.7}
      .resumen-shell .resumen-tab-disabled:hover,.resumen-shell .resumen-tab:disabled:hover{color:#aeb7c4}
      .resumen-shell .resumen-tab-active,.resumen-shell .resumen-tab-active:hover{color:var(--rz-brand);border-bottom-color:var(--rz-brand);font-weight:700}
      .resumen-shell .resumen-secondary{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:32px;margin-top:4px;padding:4px;color:#fff;background:var(--rz-brand-dark);border-radius:8px}
      .resumen-shell .resumen-secondary-actions{display:flex;align-items:center;gap:8px;min-width:0;overflow-x:auto}
      .resumen-shell .resumen-secondary-title{padding:2px 4px;color:#fff;font-weight:700;letter-spacing:.01em}
      .resumen-shell .resumen-secondary .ant-btn{height:26px;padding:0 12px;border-radius:6px;box-shadow:none;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);color:#fff}
      .resumen-shell .resumen-secondary .ant-btn[disabled]{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.55)}
      .resumen-shell .resumen-secondary .anticon{display:inline-flex;align-items:center;vertical-align:-.125em}
      .resumen-shell .resumen-secondary .anticon svg{width:1em;height:1em;fill:currentColor}
      .resumen-shell .resumen-detail-card{flex:1 1 auto;min-height:0;margin-top:4px;overflow:hidden;border:1px solid #aebdcd;border-radius:8px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
      .resumen-shell .resumen-detail-card>.ant-card-body{height:100%;min-height:0;padding:4px;box-sizing:border-box;display:flex;flex-direction:column;overflow:auto}
      .resumen-shell .resumen-detail-heading{flex:0 0 auto;margin-bottom:4px}
      .resumen-shell .resumen-detail-grid{flex:0 0 auto}
      .resumen-shell .resumen-detail-column:first-child{padding-right:4px;border-right:1px solid var(--rz-line)}
      .resumen-shell .resumen-detail-column:last-child{padding-left:4px}
      .resumen-shell .resumen-form-field{display:grid;grid-template-columns:150px minmax(0,1fr);align-items:center;min-width:0;min-height:32px;margin-bottom:5px}
      .resumen-shell .resumen-form-label{padding-right:10px;text-align:left;color:var(--rz-muted);font-size:12px;font-weight:500;white-space:nowrap}
      .resumen-shell .resumen-required-mark{margin-left:2px;color:#cf1322;font-weight:700}
      .resumen-shell .resumen-field-invalid>.resumen-form-label{color:#cf1322}
      .resumen-shell .resumen-field-invalid .ant-select-selector,.resumen-shell .resumen-field-invalid .ant-picker{border-color:#ff4d4f!important;box-shadow:0 0 0 2px rgba(255,77,79,.12)!important}
      .resumen-shell .resumen-form-control{min-width:0}
      .resumen-shell .resumen-form-control>.ant-input,.resumen-shell .resumen-form-control>.ant-select,.resumen-shell .resumen-form-control>.ant-picker{width:100%}
      .resumen-shell .resumen-claimant-control>.ant-select{width:100%}
      .resumen-claimant-dropdown .ant-select-item-option-content,.resumen-claimant-dropdown .ant-select-dropdown-menu-item{white-space:normal;overflow-wrap:anywhere;line-height:1.35}
       .resumen-shell .ant-input,.resumen-shell .ant-select .ant-select-selection,.resumen-shell .ant-select .ant-select-selector,.resumen-shell .ant-picker{border-radius:6px}
       .resumen-shell .ant-input:not([disabled]),.resumen-shell .ant-select:not(.ant-select-disabled) .ant-select-selection,.resumen-shell .ant-select:not(.ant-select-disabled) .ant-select-selector,.resumen-shell .ant-picker:not(.ant-picker-disabled){color:var(--rz-ink);background:#fff;border-color:#b8c4d1!important}
       .resumen-shell .ant-select:not(.ant-select-disabled):hover .ant-select-selection,.resumen-shell .ant-select:not(.ant-select-disabled):hover .ant-select-selector{border-color:#8da9c2!important}
       .resumen-shell .ant-select.ant-select-focused .ant-select-selection,.resumen-shell .ant-select.ant-select-focused .ant-select-selector,.resumen-shell .ant-select.ant-select-open .ant-select-selection,.resumen-shell .ant-select.ant-select-open .ant-select-selector{border-color:#1677ff!important;box-shadow:0 0 0 2px rgba(22,119,255,.12)!important}
       .resumen-shell input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not(.ant-select-search__field):not(.ant-select-selection-search-input),.resumen-shell select,.resumen-shell textarea{border:1px solid #b8c4d1!important;border-radius:6px;transition:border-color .2s ease,box-shadow .2s ease}
       .resumen-shell input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not(.ant-select-search__field):not(.ant-select-selection-search-input):hover,.resumen-shell select:hover,.resumen-shell textarea:hover{border-color:#8da9c2!important}
       .resumen-shell input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not(.ant-select-search__field):not(.ant-select-selection-search-input):focus,.resumen-shell select:focus,.resumen-shell textarea:focus{border-color:#1677ff!important;box-shadow:0 0 0 2px rgba(22,119,255,.12)!important;outline:0}
       .resumen-shell .ant-select .ant-select-search__field,.resumen-shell .ant-select .ant-select-search__field:hover,.resumen-shell .ant-select .ant-select-search__field:focus,.resumen-shell .ant-select .ant-select-selector input,.resumen-shell .ant-select .ant-select-selector input:hover,.resumen-shell .ant-select .ant-select-selector input:focus,.resumen-shell .ant-picker .ant-picker-input>input,.resumen-shell .ant-picker .ant-picker-input>input:hover,.resumen-shell .ant-picker .ant-picker-input>input:focus,.resumen-shell .ant-calendar-picker input,.resumen-shell .ant-calendar-picker input:hover,.resumen-shell .ant-calendar-picker input:focus{border:0!important;box-shadow:none!important;border-radius:0!important;outline:0!important;background:transparent!important}
       .resumen-shell .ant-select:not(.ant-select-disabled) .ant-select-selection-item,.resumen-shell .ant-picker:not(.ant-picker-disabled) .ant-picker-input>input{color:var(--rz-ink)}
      .resumen-shell .ant-select:not(.ant-select-disabled) .ant-select-arrow{color:var(--rz-muted)}
       .resumen-shell .ant-input[disabled],.resumen-shell .ant-select-disabled .ant-select-selection,.resumen-shell .ant-select-disabled .ant-select-selector,.resumen-shell .ant-picker-disabled{color:#7b8794!important;background:#f6f8fa!important;border-color:var(--rz-line)!important;opacity:1}
      .resumen-shell .ant-select-disabled .ant-select-selection-item,.resumen-shell .ant-picker-disabled .ant-picker-input>input{color:#7b8794!important;opacity:1}
      .resumen-shell .ant-select-disabled .ant-select-selection-placeholder,.resumen-shell .ant-select-disabled .ant-select-arrow,.resumen-shell .ant-picker-disabled .ant-picker-suffix{color:#b6bfc9!important;opacity:1}
      .resumen-shell .ant-input[disabled],.resumen-shell .ant-picker-disabled .ant-picker-input>input{-webkit-text-fill-color:#7b8794}
      .resumen-shell .ant-input[disabled]::placeholder,.resumen-shell .ant-picker-disabled .ant-picker-input>input::placeholder{color:#b6bfc9;-webkit-text-fill-color:#b6bfc9;opacity:1}
      .resumen-shell .resumen-checks{display:flex;align-items:center;gap:16px;min-height:24px}
      .resumen-shell .resumen-checks .ant-checkbox-wrapper{color:var(--rz-muted);font-size:12px}
      .resumen-shell .ant-checkbox-wrapper-disabled,.resumen-shell .ant-checkbox-disabled+span{color:#b6bfc9!important;opacity:1}
      .resumen-shell .resumen-inline{display:flex;gap:6px;min-width:0}
      .resumen-shell .resumen-inline>*{flex:1 1 0;min-width:0}
      .resumen-new-claim-search{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 14px;margin-bottom:14px}
      .resumen-new-claim-search-field{min-width:0}
      .resumen-new-claim-search-field label{display:block;margin-bottom:4px;color:#60708a;font-size:12px;font-weight:600}
      .resumen-new-claim-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #d9e2ec}
      .resumen-new-claim-modal .ant-modal-body{padding:16px 20px}
      .resumen-new-claim-modal .ant-input,.resumen-new-claim-modal .ant-picker,.resumen-new-claim-modal .ant-select-selector{height:30px!important;min-height:30px!important;border:1px solid #aebfd4!important;border-radius:5px!important;box-shadow:none!important;background:#fff}
      .resumen-new-claim-modal .ant-input{padding:4px 9px;color:#183153}
      .resumen-new-claim-modal .ant-picker{display:flex;align-items:center;padding:0 8px}
      .resumen-new-claim-modal .ant-picker-input>input{height:28px;border:0!important;box-shadow:none!important;color:#183153}
      .resumen-new-claim-modal .ant-select{width:100%}
      .resumen-new-claim-modal .ant-select-selection__rendered{line-height:28px}
      .resumen-new-claim-modal .ant-input:hover,.resumen-new-claim-modal .ant-picker:hover,.resumen-new-claim-modal .ant-select:not(.ant-select-disabled):hover .ant-select-selector{border-color:#8da9c2!important}
      .resumen-new-claim-modal .ant-input:focus,.resumen-new-claim-modal .ant-picker-focused,.resumen-new-claim-modal .ant-select-focused .ant-select-selector{border-color:#1677ff!important;box-shadow:0 0 0 2px rgba(22,119,255,.12)!important}
      .resumen-new-claim-search-field>.ant-select{width:100%}
      .resumen-new-claim-search-actions{display:flex;align-items:flex-end;justify-content:flex-end}
      .resumen-new-claim-results{max-height:360px;overflow:auto}
      .resumen-new-claim-modal .resumen-new-claim-results{border:1px solid #d9e2ec;border-radius:5px;background:#fff}
      .resumen-new-claim-modal .resumen-new-claim-results .ant-table{font-size:12px;color:#183153}
      .resumen-new-claim-modal .resumen-new-claim-results .ant-table-thead>tr>th{padding:8px 10px;background:#f0f2f5;border-bottom:1px solid #c8d2df;color:#183153;font-weight:600;white-space:nowrap}
      .resumen-new-claim-modal .resumen-new-claim-results .ant-table-tbody>tr>td{padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
      .resumen-new-claim-modal .resumen-new-claim-results .ant-table-tbody>tr:hover>td{background:#f5f9ff}
      .resumen-new-claim-modal .resumen-new-claim-results .ant-pagination{margin:10px 8px}
      .resumen-new-claim-modal .ant-alert{margin-bottom:12px;border-radius:5px}
      .resumen-shell .resumen-stage-control{min-width:0}
      .resumen-shell .resumen-stage-control>.ant-select{width:100%}
      .resumen-shell .resumen-driver{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}
      .resumen-shell .resumen-bottom{flex:0 0 auto;min-height:0;margin-top:14px;padding-top:14px;border-top:1px solid var(--rz-line);display:grid;grid-template-rows:auto auto;gap:10px}
      .resumen-shell .resumen-bottom-field{display:grid;grid-template-columns:190px minmax(0,1fr);min-height:0}
      .resumen-shell .resumen-bottom-field .resumen-form-label{padding-top:6px}
      .resumen-shell .resumen-bottom-field .ant-input{width:100%;max-width:none;min-height:68px;max-height:180px;resize:vertical;overflow:auto;border-radius:5px}
      .resumen-shell .resumen-field-note{margin-top:3px;color:var(--rz-muted);font-size:11px}
      .resumen-shell .resumen-catalog-error{display:flex;align-items:center;gap:8px;margin:4px 0 8px;color:var(--rz-warn);font-size:11px}
      .resumen-shell .resumen-coverage{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;gap:12px}
      .resumen-shell .resumen-payments,.resumen-shell .resumen-expenses,.resumen-shell .resumen-recoveries{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;gap:12px}
      .resumen-shell .resumen-coverage-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .resumen-shell .resumen-coverage-toolbar .ant-btn{height:28px;border-radius:6px}
      .resumen-shell .resumen-table-wrap{flex:0 0 auto;max-width:100%;overflow:auto;border:1px solid #cbd1d8;border-radius:6px;background:#fff}
      .resumen-shell .resumen-data-table{width:100%;min-width:1040px;border-collapse:collapse;font-size:12px;line-height:18px}
      .resumen-shell .resumen-payments .resumen-data-table,.resumen-shell .resumen-expenses .resumen-data-table{table-layout:fixed}
      .resumen-shell .resumen-financial-payment-id{width:52px;max-width:52px}
      .resumen-shell .resumen-financial-coverage,.resumen-shell .resumen-financial-affected{width:180px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .resumen-shell .resumen-financial-check-request{text-align:center}
      .resumen-shell .resumen-payment-request-link{color:var(--rz-accent);font-weight:600;text-decoration:none}
      .resumen-shell .resumen-payment-request-link:hover{text-decoration:underline}
      .resumen-shell .resumen-payment-request-detail{height:auto;padding:0 4px;color:var(--rz-accent);font-size:11px}
      .resumen-shell .resumen-search-icon{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;vertical-align:-2px}
      .resumen-shell .resumen-search-icon svg{width:14px;height:14px;fill:currentColor}
      .resumen-payment-request-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px}
      .resumen-payment-request-detail-grid>div{display:flex;flex-direction:column;gap:2px;min-width:0}
      .resumen-payment-request-detail-grid span{color:var(--rz-muted);font-size:12px}
      .resumen-payment-request-detail-grid strong{font-weight:600;overflow-wrap:anywhere}
      .resumen-payment-request-detail-wide{grid-column:1/-1}
      .resumen-shell .resumen-data-table th{position:sticky;top:0;z-index:1;padding:5px 8px;text-align:left;white-space:nowrap;color:#262626;background:#bfbfbf;border-right:1px solid #cbd1d8;border-bottom:1px solid #cbd1d8;font-weight:700}
      .resumen-shell .resumen-data-table th:last-child{border-right:0}
      .resumen-shell .resumen-data-table td{padding:5px 8px;white-space:nowrap;border:0;border-bottom:1px solid #cbd1d8;font-variant-numeric:tabular-nums}
      .resumen-shell .resumen-data-table tbody tr:last-child td{border-bottom:0}
      .resumen-shell .resumen-data-table tbody tr{cursor:pointer;transition:background .15s ease}
      .resumen-shell .resumen-data-table tbody tr:hover{background:#b7d7ff}
      .resumen-shell .resumen-data-table tbody tr.resumen-row-selected,
      .resumen-shell .resumen-data-table tbody tr.resumen-row-selected:hover{background:#86b4ff;color:#123b66}
      .resumen-shell .resumen-data-table tbody tr.resumen-row-selected td:first-child{box-shadow:inset 4px 0 0 #0050b3}
      .resumen-shell .resumen-data-table .resumen-cell-number{text-align:right}
      .resumen-shell .resumen-data-table .resumen-grid-amount-positive{color:#237804}
      .resumen-shell .resumen-data-table .resumen-grid-amount-negative{color:#cf1322}
      .resumen-shell .resumen-data-table .resumen-grid-amount-zero{color:#262626;font-weight:400}
      .resumen-shell .resumen-empty-row{text-align:center!important;color:var(--rz-muted);padding:18px!important}
      .resumen-shell .resumen-reserve-panel{flex:0 0 auto;display:flex;justify-content:flex-end}
      .resumen-shell .resumen-reserve-actions{display:flex;gap:7px;white-space:nowrap}
      .resumen-shell .resumen-reserve-error{padding:7px 10px;color:#9f2d2d;background:#fff1f0;border:1px solid #ffccc7;border-radius:5px;font-size:12px}
      .resumen-reserve-modal .resumen-reserve-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px}
      .resumen-reserve-modal .resumen-payment-concept{grid-column:1/-1}
      .resumen-reserve-modal .resumen-reserve-input label{display:block;margin-bottom:5px;color:#60708a;font-size:12px;font-weight:600}
      .resumen-reserve-modal .resumen-reserve-input>.ant-input,.resumen-reserve-modal .resumen-reserve-input>.ant-select{width:100%}
      .resumen-reserve-modal .resumen-reserve-input>.ant-input,.resumen-reserve-modal .resumen-reserve-input>.ant-select .ant-select-selector{border-color:#aebfd4!important;border-radius:5px}
      .resumen-reserve-modal .resumen-reserve-input>.ant-input:hover,.resumen-reserve-modal .resumen-reserve-input>.ant-select:hover .ant-select-selector{border-color:#8da9c2!important}
      .resumen-reserve-modal .resumen-reserve-input>.ant-input:focus,.resumen-reserve-modal .resumen-reserve-input>.ant-select-focused .ant-select-selector{border-color:#1677ff!important;box-shadow:0 0 0 2px rgba(22,119,255,.12)!important}
      .resumen-reserve-modal .resumen-reserve-error{grid-column:1/-1;padding:7px 10px;color:#9f2d2d;background:#fff1f0;border:1px solid #ffccc7;border-radius:5px;font-size:12px}
      .resumen-reserve-modal .resumen-reserve-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;padding-top:4px}
      .resumen-reinsurance-modal .ant-modal-content{border:1px solid #b8c4d1;border-radius:6px;overflow:hidden}
      .resumen-reinsurance-modal .ant-modal-header{padding:10px 16px;border-bottom:1px solid #d9e2ec;background:#f8fbff}
      .resumen-reinsurance-modal .ant-modal-title{color:#183153;font-size:14px;font-weight:600}
      .resumen-reinsurance-modal .ant-modal-body{padding:12px 16px;background:#fff}
      .resumen-reinsurance-modal .ant-alert{margin-bottom:10px;border-radius:5px}
      .resumen-reinsurance-loading{display:flex;align-items:center;justify-content:center;gap:8px;min-height:120px;color:#60708a;font-size:12px}
      .resumen-reinsurance-summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:10px}
      .resumen-reinsurance-summary-item{display:flex;flex-direction:column;gap:3px;min-width:0;padding:8px 9px;border:1px solid #d9e2ec;border-radius:5px;background:#f8fbff}
      .resumen-reinsurance-summary-item span{color:#60708a;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .resumen-reinsurance-summary-item strong{color:#183153;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .resumen-reinsurance-context{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:10px;padding:7px 9px;border-left:3px solid #2f6fbd;background:#f5f9ff;color:#60708a;font-size:11px}
      .resumen-reinsurance-context strong{color:#183153;font-weight:600}
      .resumen-reinsurance-tabs .ant-tabs-bar{margin-bottom:8px;border-bottom:1px solid #cbd1d8}
      .resumen-reinsurance-tabs .ant-tabs-tab{padding:7px 10px;color:#60708a;font-size:12px}
      .resumen-reinsurance-tabs .ant-tabs-tab-active{color:#174a86;font-weight:600}
      .resumen-reinsurance-table{border:1px solid #cbd1d8;border-radius:5px;overflow:hidden}
      .resumen-reinsurance-table .ant-table{font-size:12px;color:#183153}
      .resumen-reinsurance-table .ant-table-thead>tr>th{padding:6px 8px;background:#bfbfbf;color:#262626;border-bottom:1px solid #cbd1d8;font-weight:700;white-space:nowrap}
      .resumen-reinsurance-table .ant-table-tbody>tr>td{padding:6px 8px;border-bottom:1px solid #e2e8f0;white-space:nowrap}
      .resumen-reinsurance-table .ant-table-tbody>tr:hover>td{background:#f5f9ff}
      .resumen-reinsurance-modal .ant-table-expanded-row>td{padding:10px!important;background:#f8fbff}
      .resumen-reinsurance-modal .ant-descriptions-bordered .ant-descriptions-item-label{color:#60708a;background:#f0f2f5;font-size:11px}
      .resumen-reinsurance-modal .ant-descriptions-bordered .ant-descriptions-item-content{color:#183153;font-size:11px}
      .resumen-reinsurance-modal .ant-tabs-content{min-height:90px}
      @media(max-width:767px){.resumen-reinsurance-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.resumen-reinsurance-context{gap:7px 12px}.resumen-reinsurance-modal .ant-modal-body{padding:10px}.resumen-reinsurance-modal .ant-modal-header{padding:9px 12px}}
      .resumen-affected-modal .resumen-custom-form{min-height:120px;padding:2px 4px}
      .resumen-affected-modal .resumen-custom-form .form-group{margin-bottom:12px}
      .resumen-affected-modal .resumen-custom-form label{display:block;margin-bottom:4px;color:#60708a;font-size:12px;font-weight:500}
      .resumen-affected-modal .resumen-custom-form input:not([type=checkbox]):not([type=radio]):not([class*="col-"]),.resumen-affected-modal .resumen-custom-form select:not([class*="col-"]),.resumen-affected-modal .resumen-custom-form textarea:not([class*="col-"]){width:100%;padding:5px 9px;color:#183153;background:#fff;border:1px solid #aebfd4;border-radius:5px}
      .resumen-affected-modal .resumen-custom-form.resumen-validation-attempted input:invalid,.resumen-affected-modal .resumen-custom-form.resumen-validation-attempted select:invalid,.resumen-affected-modal .resumen-custom-form.resumen-validation-attempted textarea:invalid,.resumen-affected-modal .resumen-custom-form .resumen-field-invalid input,.resumen-affected-modal .resumen-custom-form .resumen-field-invalid select,.resumen-affected-modal .resumen-custom-form .resumen-field-invalid textarea{border-color:#ff4d4f!important;box-shadow:0 0 0 2px rgba(255,77,79,.12)!important}
      .resumen-affected-modal .resumen-custom-form .resumen-field-invalid label{color:#cf1322!important}
      .resumen-affected-modal .rendered-form>.row{display:flex;flex-wrap:wrap;margin-right:-8px;margin-left:-8px}
      .resumen-affected-modal .rendered-form>.row>[class*="col-"]{position:relative;width:100%;min-height:1px;padding-right:8px;padding-left:8px}
      @media(min-width:768px){.resumen-affected-modal .rendered-form>.row>.col-md-3{flex:0 0 25%;max-width:25%}.resumen-affected-modal .rendered-form>.row>.col-md-4{flex:0 0 33.333333%;max-width:33.333333%}.resumen-affected-modal .rendered-form>.row>.col-md-6{flex:0 0 50%;max-width:50%}.resumen-affected-modal .rendered-form>.row>.col-md-8{flex:0 0 66.666667%;max-width:66.666667%}.resumen-affected-modal .rendered-form>.row>.col-md-12{flex:0 0 100%;max-width:100%}}
      .resumen-shell .resumen-history{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;gap:7px}
      .resumen-shell .resumen-coverage .resumen-coverage-table-wrap{flex:0 1 210px;min-height:0;max-height:210px;overflow:auto}
      .resumen-shell .resumen-coverage .resumen-history{flex:1 1 auto;min-height:220px}
      .resumen-shell .resumen-history .resumen-table-wrap{flex:1 1 auto;min-height:220px;max-height:none;overflow:auto}
      .resumen-shell .resumen-history .resumen-history-table-wrap{min-height:220px}
      .resumen-shell .resumen-history .resumen-data-table{min-width:820px}
       .resumen-shell .resumen-custom{display:flex;flex:1 1 auto;min-height:180px;flex-direction:column}
       .resumen-shell .resumen-custom-preload{display:none}
      .resumen-shell .resumen-affected{gap:7px}
      .resumen-shell .resumen-affected h3,.resumen-shell .resumen-affected p{margin:0}
      .resumen-shell .resumen-affected-toolbar{display:flex;align-items:center;gap:8px;padding:4px 8px;border:1px solid var(--rz-line);border-radius:6px;background:#f8fbff}
      .resumen-shell .resumen-affected-toolbar h3{flex:0 0 auto;color:var(--rz-ink);font-size:13px}
      .resumen-shell .resumen-affected-toolbar p{flex:1 1 auto;color:var(--rz-muted);font-size:12px}
      .resumen-shell .resumen-affected-toolbar .ant-btn{flex:0 0 auto}
      .resumen-shell .resumen-affected .resumen-reserve-input>label{display:block;margin-bottom:6px;color:var(--rz-muted);font-weight:500}
      .resumen-shell .resumen-affected .resumen-reserve-actions{flex-wrap:wrap;gap:10px}
      .resumen-shell .resumen-affected-block{display:flex;flex-direction:column;gap:5px;margin-top:2px}
      .resumen-shell .resumen-affected-available-block{flex:0 1 220px;min-height:0;max-height:220px}
      .resumen-shell .resumen-affected-available-block .resumen-affected-available-table-wrap{flex:1 1 auto;min-height:0;max-height:none;overflow:auto}
      .resumen-shell .resumen-affected-registered-block{flex:1 1 auto;min-height:180px}
      .resumen-shell .resumen-affected-registered-block .resumen-affected-registered-table-wrap{flex:1 1 auto;min-height:180px;max-height:none;overflow:auto}
      .resumen-shell .resumen-affected-table{min-width:680px}
      .resumen-shell .resumen-affected-list{display:grid;gap:12px;margin:0;padding:0;list-style:none}
      .resumen-shell .resumen-affected-list>li{display:flex;align-items:center;flex-wrap:wrap;gap:10px 16px}
      .resumen-shell .resumen-affected-association-label{min-width:0;overflow-wrap:anywhere}
      .resumen-shell .resumen-affected-list .ant-btn{flex-shrink:0}
      .resumen-shell .resumen-affected-sections{display:grid;gap:18px;margin-top:6px}
      .resumen-shell .resumen-affected-section{border:1px solid var(--rz-line);border-radius:7px;overflow:hidden;background:#fff}
      .resumen-shell .resumen-affected-section h4{margin:0;padding:12px 16px;color:var(--rz-ink);background:#f5f8fc;border-bottom:1px solid var(--rz-line);font-size:14px}
      .resumen-shell .resumen-affected-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:0;padding:16px}
      .resumen-shell .resumen-affected-field{min-width:0}
      .resumen-shell .resumen-affected-field dt{font-size:12px;color:var(--rz-muted);margin:0 0 6px;font-weight:500}
      .resumen-shell .resumen-affected-field dd{min-height:36px;margin:0;padding:8px 10px;border:1px solid var(--rz-line-strong);border-radius:5px;background:#f9fbfd;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--rz-ink)}
      .resumen-shell .resumen-affected-wide{grid-column:1/-1}
      @media(max-width:1000px){.resumen-shell .resumen-affected-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:600px){.resumen-shell .resumen-affected-grid{grid-template-columns:minmax(0,1fr)}.resumen-shell .resumen-affected-toolbar{align-items:flex-start;flex-wrap:wrap}.resumen-shell .resumen-affected-toolbar p{flex-basis:100%;order:3}}
      .resumen-shell .resumen-custom-tabs{display:flex;flex-wrap:wrap;gap:2px;margin-bottom:16px;border-bottom:1px solid var(--rz-line)}
      .resumen-shell .resumen-custom-form{min-height:120px;padding:2px 4px}
      .resumen-shell .resumen-custom-form .form-group{margin-bottom:12px}
      .resumen-shell .resumen-custom-form label{display:block;margin-bottom:4px;color:var(--rz-muted);font-size:12px;font-weight:500}
      .resumen-shell .resumen-custom-form input:not([type=checkbox]):not([type=radio]),.resumen-shell .resumen-custom-form select,.resumen-shell .resumen-custom-form textarea{width:100%;padding:5px 9px;color:var(--rz-ink);background:#fff;border:1px solid var(--rz-line-strong);border-radius:5px}
      .resumen-shell .resumen-custom-state{display:flex;flex:1 1 auto;align-items:center;justify-content:center;gap:8px;min-height:160px;color:var(--rz-muted)}
      .resumen-shell .resumen-comment{position:relative;padding:0 0 12px 42px;margin:18px 0;overflow-wrap:anywhere}
      .resumen-shell .resumen-comment::before{content:"👤";position:absolute;left:0;top:0;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:var(--rz-brand-soft)}
      .resumen-shell .resumen-inactive{flex:1 1 auto;display:flex;align-items:center;justify-content:center;min-height:180px;color:var(--rz-muted)}
      @media(max-width:1199px){.resumen-shell .resumen-form-field{grid-template-columns:125px minmax(0,1fr)}.resumen-shell .resumen-bottom-field{grid-template-columns:190px minmax(0,1fr)}}
      @media(max-width:991px){.resumen-shell{overflow:auto}.resumen-shell .resumen-policy{padding-right:0}.resumen-shell .resumen-valuation{margin-top:12px;padding:12px 0 0;border-top:1px solid var(--rz-line);border-left:0}.resumen-shell .resumen-valuation-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px}.resumen-shell .resumen-detail-card{flex:0 0 auto;overflow:visible}.resumen-shell .resumen-detail-card>.ant-card-body{height:auto;overflow:visible}.resumen-shell .resumen-detail-column:first-child{padding-right:0;border-right:0}.resumen-shell .resumen-detail-column:last-child{margin-top:10px;padding:12px 0 0;border-top:1px solid var(--rz-line)}.resumen-shell .resumen-bottom{min-height:190px}}
      @media(max-width:767px){.resumen-new-claim-search{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:575px){.resumen-shell{padding:4px}.resumen-shell .resumen-title{font-size:16px}.resumen-shell .resumen-summary-card .ant-collapse-content-box{padding:4px}.resumen-shell .resumen-valuation-grid{grid-template-columns:1fr}.resumen-shell .resumen-form-field,.resumen-shell .resumen-bottom-field{grid-template-columns:1fr}.resumen-shell .resumen-form-label{padding:0 0 3px;text-align:left}.resumen-shell .resumen-driver{grid-template-columns:1fr}.resumen-shell .resumen-checks{flex-wrap:wrap;gap:8px 14px}.resumen-shell .resumen-reserve-actions{flex-wrap:wrap}.resumen-reserve-modal .resumen-reserve-form{grid-template-columns:1fr}.resumen-new-claim-search{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
    scheduleFit();
    window.addEventListener('resize', scheduleFit);
    return () => {
      window.removeEventListener('resize', scheduleFit);
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (style.parentNode) style.parentNode.removeChild(style);
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, []);

  return (
    <div ref={shellRef} className="resumen-shell">
      <header className="resumen-header">
        <span className="resumen-header-icon" aria-hidden="true" />
        <h2 className="resumen-title">Información Resumen de Siniestro
          {!newClaimMode && claimId != null ? ' ' + claimId + '' : ''}</h2>
        {!newClaimMode && claimId != null && claimDetails.claimNumber
          ? <span className="resumen-header-claim-number">Nº Siniestro {displayValue(claimDetails.claimNumber)}</span> : null}
        <ClaimWorkflow key={claimId || 'new'} claim={currentClaimRef.current} loading={loading}
          isCurrent={() => mountedRef.current && routeClaimId() === claimId}
          isDirty={() => dirtyRef.current}
          reload={() => loadClaim(claimId)}
          downloadFile={route => window.fetch(new URL('..', DOCUMENT_UPLOAD_ENDPOINT).href.replace(/\/$/, '') + '/proxy' + route,
            { headers: { Authorization: documentAuthorization() } }).then(r => {
              if (!r.ok) throw new Error('No se pudo descargar el archivo.');
              return r.blob();
            }).then(blob => window.open(URL.createObjectURL(blob)))} />
      </header>

      {(loading || error || valuationWarning) ? (
        <div className="resumen-status">
          {loading ? <div className="resumen-loading"><Spin size="small" /> Cargando información del siniestro...</div> : null}
          {error ? <Alert type="error" showIcon message={error} /> : null}
          {!loading && !error && valuationWarning
            ? <div className="resumen-recovery-warning">{valuationWarning}</div>
            : null}
        </div>
      ) : null}

      {newClaimSelectedPolicy ? <Alert type="info" showIcon
        message={'Póliza seleccionada para nuevo siniestro: ' + displayValue(newClaimSelectedPolicy.code || newClaimSelectedPolicy.id)}
        description={policySearchLabel(newClaimSelectedPolicy)} /> : null}

      <Modal title="Nuevo siniestro: seleccionar póliza" visible={newClaimModalOpen}
        width={1050} destroyOnClose wrapClassName="resumen-new-claim-modal"
        onCancel={() => setNewClaimModalOpen(false)}
        footer={null}>
        <div className="resumen-new-claim-toolbar">
          <Button size="small" type="primary" loading={newClaimLoading} onClick={searchNewClaimPolicies}>Buscar</Button>
          <Button size="small" onClick={() => setNewClaimModalOpen(false)}>Cancelar</Button>
        </div>
        <div className="resumen-new-claim-search">
          <div className="resumen-new-claim-search-field"><label>Código de póliza</label>
            <Input size="small" defaultValue={newClaimFilters.code} placeholder="Aproximación"
              onChange={(event) => {
                newClaimCodeInput.current = event && event.target && event.target.value != null
                  ? event.target.value : '';
              }} />
          </div>
          <div className="resumen-new-claim-search-field"><label>Tenedor</label>
            <Select size="small" showSearch allowClear filterOption={false}
              value={newClaimFilters.holderId || undefined} loading={newClaimContactLoading.holder}
              options={newClaimContactOptions.holder} placeholder="Nombre, ID, identificación o Cobis"
              notFoundContent={newClaimContactLoading.holder ? 'Buscando...' : 'Escriba al menos 2 caracteres o un ID'}
              onSearch={(value) => searchNewClaimContacts('holder', value)}
              onChange={(value) => setNewClaimFilters((current) => Object.assign({}, current, { holderId: value || null }))} />
          </div>
          <div className="resumen-new-claim-search-field"><label>Asegurado</label>
            <Select size="small" showSearch allowClear filterOption={false}
              value={newClaimFilters.insuredId || undefined} loading={newClaimContactLoading.insured}
              options={newClaimContactOptions.insured} placeholder="Nombre, ID, identificación o Cobis"
              notFoundContent={newClaimContactLoading.insured ? 'Buscando...' : 'Escriba al menos 2 caracteres o un ID'}
              onSearch={(value) => searchNewClaimContacts('insured', value)}
              onChange={(value) => setNewClaimFilters((current) => Object.assign({}, current, { insuredId: value || null }))} />
          </div>
          <div className="resumen-new-claim-search-field"><label>Ramo</label>
            <Select size="small" allowClear showSearch optionFilterProp="label" value={newClaimFilters.lob || undefined}
              placeholder="Seleccione el ramo" options={newClaimLobOptions}
              onChange={(value) => {
                setNewClaimFilters((current) => Object.assign({}, current, { lob: value || '', product: '' }));
                loadNewClaimProducts(value || '');
              }} />
          </div>
          <div className="resumen-new-claim-search-field"><label>Producto</label>
            <Select size="small" allowClear showSearch optionFilterProp="label"
              value={newClaimFilters.product || undefined} loading={newClaimProductLoading}
              disabled={!newClaimFilters.lob || newClaimProductLoading}
              placeholder={newClaimFilters.lob ? 'Seleccione el producto' : 'Seleccione primero el ramo'}
              options={newClaimProductOptions}
              onChange={(value) => setNewClaimFilters((current) => Object.assign({}, current, { product: value || '' }))} />
          </div>
          <div className="resumen-new-claim-search-field"><label>Vigencia</label>
            <DatePicker.RangePicker size="small" format="DD/MM/YYYY" style={{ width: '100%' }}
              value={newClaimFilters.dates || undefined}
              onChange={(values) => setNewClaimFilters((current) => Object.assign({}, current, { dates: values || null }))} />
          </div>
        </div>
        {newClaimError ? <Alert type="warning" showIcon message={newClaimError} /> : null}
        <div className="resumen-table-wrap resumen-new-claim-results">
          <A.Table size="small" rowKey={(row) => String(row.id)} loading={newClaimLoading}
            dataSource={newClaimRows}
            pagination={{ current: newClaimPolicyPage, pageSize: 15, total: newClaimPolicyTotal,
              hideOnSinglePage: true, showSizeChanger: false,
              onChange: (page) => searchNewClaimPolicies(page) }}
            locale={{ emptyText: newClaimLoading ? 'Consultando pólizas...' : 'Realice una búsqueda para ver resultados.' }}
            columns={[
              { title: 'Póliza', dataIndex: 'code', render: (value, row) => displayValue(value || row.id) },
              { title: 'Cliente', dataIndex: '__insuredLabel', render: (value) => displayValue(value) },
              { title: 'Ramo', dataIndex: '__lobLabel', render: (value) => displayValue(value) },
              { title: 'Producto', dataIndex: '__productLabel', render: (value) => displayValue(value) },
              { title: 'Inicio', dataIndex: '__startLabel', render: (value) => displayValue(value) },
              { title: 'Fin', dataIndex: '__endLabel', render: (value) => displayValue(value) },
              { title: '', key: 'select', width: 100, render: (_, row) => <Button size="small" type="primary"
                onClick={() => prepareNewClaimPolicy(row)}>Seleccionar</Button> }
            ]} />
        </div>
      </Modal>

      <Collapse className="resumen-summary-card" defaultActiveKey={['summary']} expandIconPosition="left" bordered>
        <Panel header="Datos de póliza y valoración" key="summary">
        <Row gutter={0}>
          <Col xs={24} lg={19}>
            <section className="resumen-policy">
              <SectionTitle>Datos Generales de la Póliza Relacionada</SectionTitle>
              <Row gutter={[18, 4]}>{policyFieldColumns.map((fields, columnIndex) => (
                <Col xs={24} sm={12} lg={8} key={'policy-column-' + columnIndex}>
                  {fields.map((field) => (
                    <div className="resumen-summary-field" key={field[1]}>
                      <span className="resumen-summary-label">{field[0]}:</span>
                      <span className="resumen-summary-value">{policySummaryLink(field[1], claimSummary.policy[field[1]])}</span>
                    </div>
                  ))}
                </Col>
              ))}</Row>
            </section>
          </Col>
          <Col xs={24} lg={5}>
            <section className="resumen-valuation">
              <SectionTitle>Datos de Valoración</SectionTitle>
              <div className="resumen-valuation-grid">{valuationFields.map((field) => (
                <div className="resumen-valuation-row" key={field[1]}>
                  <span className="resumen-summary-label">{field[0]}:</span>
                  <span className={'resumen-amount ' + (field[1] === 'balance' ? 'resumen-balance'
                    : ['reserves', 'recoveries'].includes(field[1]) ? 'resumen-valuation-income'
                    : ['payments', 'expenses'].includes(field[1]) ? 'resumen-valuation-expense' : '')}>
                    {formatAmount(claimSummary.valuation[field[1]])}
                  </span>
                </div>
              ))}</div>
            </section>
          </Col>
        </Row>
        </Panel>
      </Collapse>

      <nav className="resumen-tabs" aria-label="Secciones del siniestro">
        {tabItems.map((tab) => (
          <button type="button" key={tab[0]}
            disabled={newClaimMode && tab[0] !== 'general'}
            className={(activeTab === tab[0] ? 'resumen-tab resumen-tab-active' : 'resumen-tab')
              + (newClaimMode && tab[0] !== 'general' ? ' resumen-tab-disabled' : '')}
            onClick={() => changeActiveTab(tab[0])}>{tab[1]}</button>
        ))}
      </nav>

      {activeTab === 'general' || activeTab === 'custom' ? (
        <div className="resumen-secondary">
          <div className="resumen-secondary-actions">
            <Button size="small" disabled={(!newClaimMode && !canSaveClaim(currentClaimRef.current, touchedRef.current))
              || !dirtyRef.current || saving}
              loading={saving} onClick={saveClaim}>▣ Guardar</Button>
            <Button size="small" disabled={loading} loading={loading}
              icon={<ReloadOutlinedIcon />} onClick={refreshClaim}>Refrescar</Button>
            <Button size="small" onClick={openNewClaimModal}>
              <span className="resumen-action-icon" aria-hidden="true">+</span>Nuevo Siniestro
            </Button>
          </div>
          <span className="resumen-secondary-title">{newClaimMode ? 'Nuevo Siniestro' : 'Siniestro No. ' + displayValue(claimId)}</span>
        </div>
      ) : null}

      <Card className="resumen-detail-card" size="small" bordered>
        {activeTab === 'general' ? (
          <React.Fragment>
            <SectionTitle className="resumen-detail-heading">Datos Generales del Siniestro</SectionTitle>
            <Row className="resumen-detail-grid" gutter={0}>
              <Col xs={24} lg={12} className="resumen-detail-column">
                <Field label="Nº Siniestro">{disabledInput('Número del siniestro', draft ? draft.claimNumber : claimDetails.claimNumber)}</Field>
                <Field label="Asignado a"><Select size="small"
                  disabled={!generalEditable
                    || adjusterOptions.length === 0}
                  loading={adjusterLoading} value={draft && draft.assignedToCode ? String(draft.assignedToCode) : undefined}
                  placeholder="Seleccione un ajustador"
                  options={adjusterOptions}
                  onSelect={(value, option) => changeAdjuster(value, option && option.label)} /></Field>
                <Field label="Estado" required={newClaimMode} invalid={newClaimValidation.stageCode}><div className="resumen-stage-control">
                  <Select size="small" disabled={!generalEditable}
                    value={draft && draft.stageCode ? draft.stageCode : undefined} placeholder={claimDetails.state || 'Seleccione'}
                    options={CLAIM_STAGE_OPTIONS} onChange={changeClaimStage} />
                </div></Field>
                <div className="resumen-form-field resumen-claimant-field"><label className="resumen-form-label">Reclamante:</label>
                  <div className="resumen-form-control resumen-claimant-control"><Select size="small" aria-label="Reclamante" showSearch={false}
                  disabled={!generalEditable}
                  value={draft && draft.claimantType || undefined}
                  placeholder="Seleccione un reclamante"
                  dropdownClassName="resumen-claimant-dropdown"
                  options={CLAIMANT_TYPES.map((value) => ({ value: value, label: value }))}
                  onChange={changeClaimant} />
                </div></div>
                <Field label="Razón de evento" required={newClaimMode} invalid={newClaimValidation.eventReasonCode}><Select size="small"
                  disabled={!generalEditable || catalogLoading || reasonOptions.length === 0}
                  loading={catalogLoading}
                  value={draft && draft.eventReasonCode || undefined}
                  placeholder="Seleccione una razón de evento"
                  options={reasonOptions} onChange={changeEventReason} /></Field>
                <Field label="Evento asegurado" required={newClaimMode} invalid={newClaimValidation.insuredEventCode}><Select size="small"
                  disabled={!generalEditable || catalogLoading || eventOptions.length === 0}
                  loading={catalogLoading}
                  value={draft && draft.insuredEventCode || undefined}
                  placeholder="Seleccione un evento asegurado"
                  options={eventOptions} onChange={changeInsuredEvent} /></Field>
                {catalogError ? <div className="resumen-catalog-error"><span>{catalogError}</span>
                  <Button size="small" onClick={() => loadClaimCatalogs(claimId)}>Reintentar catálogos</Button></div> : null}
                {isAutoClaim ? <React.Fragment>
                  <Field label="Culpable"><div className="resumen-checks">{extraControl("culpable")}{extraControl("posibleRecupero")}</div></Field>
                  <Field label="Pérdida Total">{extraControl("perdidaTotal")}</Field>
                  <Field label="Formato Tránsito">{extraControl("formatoTransito")}</Field>
                  <Field label="Conductor"><div className="resumen-driver">
                    {extraControl("conductor")}
                    <div className="resumen-checks">{extraControl("asegurador")}{extraControl("pagador")}{extraControl("otro")}</div>
                  </div></Field>
                  <Field label="Edad del Conductor">{extraControl("edadConductor")}</Field>
                </React.Fragment> : null}
              </Col>
              <Col xs={24} lg={12} className="resumen-detail-column">
                <Field label="Fecha del Siniestro" required={newClaimMode} invalid={newClaimValidation.occurrenceDate}><DatePicker size="small" disabled={!generalEditable} allowClear
                  format="DD/MM/YYYY" style={{ width: '100%' }}
                  value={draft && draft.occurrenceDate ? moment(draft.occurrenceDate, 'DD/MM/YYYY', true) : null}
                  onChange={(_, dateString) => changeDraft('occurrenceDate', dateString || '')} /></Field>
                <Field label="Hora" required={newClaimMode}
                  invalid={newClaimValidation.occurrenceHour || newClaimValidation.occurrenceMinute
                    || newClaimValidation.occurrencePeriod}><div className="resumen-inline">
                  <Select size="small" disabled={!generalEditable} value={draft ? draft.occurrenceHour : undefined}
                    placeholder="Hora" options={Array.from({ length: 12 }, (_, index) => {
                      const value = String(index + 1).padStart(2, '0');
                      return { value: value, label: value };
                    })} onChange={(value) => changeDraft('occurrenceHour', value)} />
                  <Select size="small" disabled={!generalEditable} value={draft ? draft.occurrenceMinute : undefined}
                    placeholder="Minuto" options={Array.from({ length: 60 }, (_, index) => {
                      const value = String(index).padStart(2, '0');
                      return { value: value, label: value };
                    })} onChange={(value) => changeDraft('occurrenceMinute', value)} />
                  <Select size="small" disabled={!generalEditable} value={draft ? draft.occurrencePeriod : undefined}
                    placeholder="am/pm" options={[{ value: 'am', label: 'am' }, { value: 'pm', label: 'pm' }]}
                    onChange={(value) => changeDraft('occurrencePeriod', value)} />
                </div></Field>
                {extraGeo.error ? <Alert type="warning" message={extraGeo.error} /> : null}
                <Field label="Provincia">{extraControl("cmbProvincia")}</Field>
                <Field label="Ciudad">{extraControl("cmbMunicipio")}</Field>
                <Field label="Lugar">{extraControl("lugar")}</Field>
                {isAutoClaim ? <React.Fragment>
                  <Field label="Fecha de audiencia">{extraControl("fechaAudiencia")}</Field>
                  <Field label="Lugar de audiencia">{extraControl("lugarAudiencia")}</Field>
                </React.Fragment> : null}
                <Field label="Fecha de Notificación" required={newClaimMode} invalid={newClaimValidation.notificationDate}><DatePicker size="small" disabled={!generalEditable} allowClear
                  format="DD/MM/YYYY" style={{ width: '100%' }}
                  value={draft && draft.notificationDate ? moment(draft.notificationDate, 'DD/MM/YYYY', true) : null}
                  onChange={(_, dateString) => changeDraft('notificationDate', dateString || '')} /></Field>
                {isAutoClaim ? <React.Fragment>
                  <Field label="Fecha Vencimiento Lic.">{extraControl("fechaVencimientoLicencia")}</Field>
                  <Field label="Número de Licencia">{extraControl("numeroLicencia")}</Field>
                </React.Fragment> : null}
              </Col>
            </Row>
            <div className="resumen-bottom">
              <div className="resumen-bottom-field"><label className="resumen-form-label">Descripción del Siniestro:</label><TextArea
                rows={3}
                disabled={!generalEditable} value={draft && draft.description != null ? String(draft.description) : ''}
                onChange={(event) => changeDraft('description', event.target.value)}
                placeholder="Sin descripción" /></div>
              <div className="resumen-bottom-field"><label className="resumen-form-label">Observaciones Adicionales:</label><TextArea
                rows={3}
                disabled={!generalEditable} value={draft ? draft.additionalObservations : ''}
                onChange={(event) => changeDraft('additionalObservations', event.target.value)}
                placeholder="Sin observaciones adicionales" /></div>
            </div>
          </React.Fragment>
        ) : activeTab === 'affected' ? (
          <section className="resumen-custom resumen-affected" aria-label="Objetos afectados">
            <div className="resumen-affected-toolbar">
              <h3>Objetos afectados</h3>
              <p>Agregue los objetos afectados mediante los formularios configurados para cada cobertura.</p>
              <Button size="small" disabled={affected.loading || !!affected.write}
                onClick={loadAffectedFormInstances}>Actualizar objetos</Button>
            </div>
            {affected.loading ? <div role="status"><Spin size="small" /> Cargando configuracion de objetos afectados...</div> : null}
            {affected.error ? <Alert type="error" message={affected.error}
              action={<Button size="small" onClick={loadAffectedFormInstances}>Reintentar</Button>} /> : null}
            {affected.saveMessage ? <Alert type="info" message={affected.saveMessage} /> : null}
            {affected.loaded ? <React.Fragment>
              <div className="resumen-affected-block resumen-affected-available-block"><h3>Objetos disponibles</h3>
                {!Object.keys(affected.rules).length ? <p>No hay formularios de objetos configurados para las coberturas de esta póliza.</p> : <div className="resumen-table-wrap resumen-affected-available-table-wrap"><table className="resumen-data-table resumen-affected-table">
                  <thead><tr><th>Código</th><th>Cobertura</th><th>Tipo de objeto</th><th className="resumen-cell-number">Registrados</th><th>Acción</th></tr></thead>
                  <tbody>{coverageRows.filter((coverage) => affected.rules[coverage.id]).reduce((rows, coverage) => rows.concat(
                    affected.rules[coverage.id].map((rule) => {
                      const count = affected.saved.filter((entry) => entry.coverageId === coverage.id && entry.formId === rule.formId).length;
                      const reachedLimit = rule.max !== null && count >= rule.max;
                      return <tr key={coverage.id + '-' + rule.formId}>
                        <td>{coverage.code}</td><td>{coverage.name}</td><td>{rule.description}</td>
                        <td className="resumen-cell-number">{rule.max !== null ? count + ' / ' + rule.max : count}</td>
                        <td><Button size="small" type="primary" disabled={!canEdit(currentClaimRef.current) || !!affected.write || reachedLimit}
                          onClick={() => openAffectedFormModal(coverage.id, null, rule)}>Agregar</Button></td>
                      </tr>;
                    })
                  ), [])}</tbody>
                </table></div>}
              </div>
              <div className="resumen-affected-block resumen-affected-registered-block"><h3>Objetos registrados</h3>
              {!affected.saved.length ? <p>No hay objetos afectados registrados en este siniestro.</p> : <div className="resumen-table-wrap resumen-affected-registered-table-wrap"><table className="resumen-data-table resumen-affected-table">
                <thead><tr><th>Cobertura</th><th>Tipo de objeto</th><th>Referencia</th><th>Información registrada</th><th>Acción</th></tr></thead>
                <tbody>{affected.saved.map((entry) => <tr key={entry.key}>
                  <td>{(coverageRows.find((row) => row.id === entry.coverageId) || {}).name || 'Cobertura no disponible'}</td>
                  <td>{entry.description}</td><td>{entry.key}</td><td>{affectedFormSummary(entry.fields)}</td>
                  <td><Button size="small" disabled={!!affected.write}
                    onClick={() => openAffectedFormModal(entry.coverageId, entry)}>{canEdit(currentClaimRef.current) ? 'Editar' : 'Consultar'}</Button></td>
                </tr>)}</tbody>
              </table></div>}
              </div>
            </React.Fragment> : null}
            <Modal title={affected.modal ? 'Objeto afectado: ' + affected.modal.description : 'Objeto afectado'}
              visible={!!affected.modal} width={900} destroyOnClose maskClosable={!affected.write} closable={!affected.write}
              wrapClassName="resumen-affected-modal"
              onCancel={closeAffectedFormModal}
              footer={<div className="resumen-reserve-actions"><Button size="small" disabled={!!affected.write} onClick={closeAffectedFormModal}>Cancelar</Button>
                <Button size="small" type="primary" loading={!!affected.write} disabled={!canEdit(currentClaimRef.current) || !!affected.write}
                  onClick={saveAffectedFormModal}>Guardar objeto afectado</Button></div>}>
              {affected.modal && affected.modal.error ? <Alert type="error" showIcon message={affected.modal.error} /> : null}
              <form id="resumenAffectedObjectForm" className="resumen-custom-form" noValidate={false}
                ref={(node) => { affected.modalContainer = node; }} />
            </Modal>
          </section>
        ) : activeTab === 'coverage' ? (
          <section className="resumen-coverage" aria-label="Coberturas y reservas">
            <div className="resumen-coverage-toolbar">
              <SectionTitle>Coberturas vigentes de la póliza</SectionTitle>
              <Button size="small" loading={sectionRefreshing} disabled={sectionRefreshing || reserveSaving}
                onClick={() => refreshSection(() => refreshReserveData(claimId), setReserveError)}><ReloadOutlinedIcon /> Refrescar</Button>
            </div>
            <div className="resumen-table-wrap resumen-coverage-table-wrap">
              <table className="resumen-data-table">
                <thead><tr>
                  <th>Código</th><th>Cobertura</th><th>Desde</th><th>Hasta</th>
                  <th className="resumen-cell-number">Monto</th>
                  <th className="resumen-cell-number">Disponible</th>
                  <th className="resumen-cell-number">R. de pago</th>
                  <th className="resumen-cell-number">R. de gasto</th>
                  <th className="resumen-cell-number">Total reserva</th>
                  <th className="resumen-cell-number">Pagos</th>
                  <th className="resumen-cell-number">Gastos</th>
                </tr></thead>
                <tbody>{coverageRows.length ? coverageRows.map((row) => (
                  <tr key={row.id} tabIndex="0"
                    className={row.id === Number(selectedCoverageId) ? 'resumen-row-selected' : ''}
                    onClick={() => setSelectedCoverageId(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') setSelectedCoverageId(row.id);
                    }}>
                    <td>{row.code}</td><td>{row.name}</td><td>{displayValue(row.start)}</td><td>{displayValue(row.end)}</td>
                    <td className="resumen-cell-number">{formatGridAmount(row.limit)}</td>
                    <td className="resumen-cell-number">{formatGridAmount(row.available)}</td>
                    <td className="resumen-cell-number">{formatGridAmount(row.paymentReserve)}</td>
                    <td className="resumen-cell-number">{formatGridAmount(row.expenseReserve)}</td>
                    <td className="resumen-cell-number">{formatGridAmount(row.totalReserve)}</td>
                    <td className="resumen-cell-number">{formatGridAmount(row.payments)}</td>
                    <td className="resumen-cell-number">{formatGridAmount(row.expenses)}</td>
                  </tr>
                )) : <tr><td className="resumen-empty-row" colSpan="11">No hay coberturas disponibles para este siniestro.</td></tr>}</tbody>
              </table>
            </div>

            <div className="resumen-reserve-panel">
              <div className="resumen-reserve-actions">
                <Button size="small" type="primary"
                  disabled={!editable || reserveSaving || !selectedCoverage}
                  onClick={() => {
                    setReserveError('');
                    loadFinancialObjects(selectedCoverage.id);
                    setReserveModalOpen(true);
                  }}>Registrar reserva</Button>
                <Popconfirm
                  title="¿Está seguro que desea cerrar todas las reservas del siniestro?"
                  okText="Aceptar" cancelText="Cancelar"
                  placement="topRight"
                  disabled={closeReservesDisabled}
                  onConfirm={() => closeClaimReserves(true, true)}>
                  <Button size="small" danger loading={reserveSaving}
                    disabled={closeReservesDisabled}>
                    Cerrar reservas
                  </Button>
                </Popconfirm>
              </div>
            </div>
            {!reserveModalOpen && reserveError ? <div className="resumen-reserve-error">{reserveError}</div> : null}

            <Modal title="Registrar reserva"
              visible={reserveModalOpen}
              footer={null}
              destroyOnClose
              maskClosable={!reserveSaving}
              closable={!reserveSaving}
              wrapClassName="resumen-reserve-modal"
              onCancel={() => {
                if (!reserveSaving) setReserveModalOpen(false);
              }}>
              <div className="resumen-reserve-form">
                <div className="resumen-reserve-input"><label>Movimiento</label><Select size="small"
                  disabled={!editable || reserveSaving || !selectedCoverage}
                  value={reserveDirection} options={[
                    { value: 'INCREASE', label: 'Aumentar reserva' },
                    { value: 'DECREASE', label: 'Disminuir reserva' }
                  ]} onChange={setReserveDirection} /></div>
                <div className="resumen-reserve-input"><label>Tipo de reserva</label><Select size="small"
                  disabled={!editable || reserveSaving || !selectedCoverage}
                  value={reserveType} options={[
                    { value: 'IN', label: 'Reserva para pago' }, { value: 'EX', label: 'Reserva para gasto' }
                  ]} onChange={setReserveType} /></div>
                <div className="resumen-reserve-input"><label>Objeto afectado *</label><Select size="small"
                  aria-label="Objeto afectado" aria-required="true" allowClear loading={financialObjects.loading}
                  disabled={!editable || reserveSaving || financialObjects.loading || !selectedCoverage}
                  value={financialObjects.selectedId == null ? undefined : financialObjects.selectedId}
                  placeholder="Seleccione un objeto afectado"
                  options={financialObjects.claim === currentClaimRef.current && financialObjects.coverageId === Number(selectedCoverageId)
                    ? financialObjects.rows.map((object) => ({ value: object.key, label: financialObjectLabel(object) })) : []}
                  onChange={(value) => { financialObjects.selectedId = value == null ? null : String(value); notifyFinancialObjects(); }} />
                  {financialObjects.error ? <div role="alert" className="resumen-reserve-error">{financialObjects.error}</div> : null}
                </div>
                <div className="resumen-reserve-input"><label>Monto</label><Input size="small" inputMode="decimal"
                  disabled={!editable || reserveSaving || !selectedCoverage}
                  value={formatMoneyInput(reserveAmount)} onChange={(event) => changeMoneyInput(event, setReserveAmount)} /></div>
                <div className="resumen-reserve-input resumen-payment-concept"><label>Concepto</label><TextArea rows={3}
                  maxLength={250} disabled={!editable || reserveSaving || !selectedCoverage}
                  value={reserveConcept} onChange={(event) => setReserveConcept(event.target.value)} /></div>
                {reserveError ? <div className="resumen-reserve-error">{reserveError}</div> : null}
                <div className="resumen-reserve-actions">
                  <Button size="small" disabled={reserveSaving}
                    onClick={() => setReserveModalOpen(false)}>Cancelar</Button>
                  <Button size="small" type="primary" loading={reserveSaving}
                    disabled={!editable || reserveSaving || !selectedCoverage || financialObjects.loading || !!financialObjects.error || !financialObjects.selectedId}
                    onClick={submitReserveMovement}>Registrar</Button>
                </div>
              </div>
            </Modal>

            <div className="resumen-history">
              <SectionTitle>Detalle de reservas{selectedCoverage ? ' — ' + selectedCoverage.name : ''}</SectionTitle>
              <div className="resumen-table-wrap resumen-history-table-wrap"><table className="resumen-data-table">
                <thead><tr><th>No. reserva</th><th>Fecha</th><th>Movimiento</th><th>Tipo</th><th>Objeto afectado</th>
                  <th className="resumen-cell-number">Monto</th><th>Concepto</th><th>Creador</th><th>Estado</th><th>Reaseguro</th></tr></thead>
                <tbody>{selectedReserveHistory.length ? selectedReserveHistory.map((item, index) => {
                  const signed = numericValue(item.reserved) || 0;
                  return <tr key={item.id || 'reserve-' + index}>
                    <td>{displayValue(item.id)}</td><td>{displayValue(formatDate(item.date))}</td>
                    <td>{signed < 0 ? 'Disminución' : 'Aumento'}</td>
                    <td>{String(item.reserveType || '').toUpperCase() === 'EX' ? 'Gasto' : 'Pago'}</td>
                    <td>{(() => { try { const object = JSON.parse(item.jAffectedObjects || 'null'); return object ? financialObjectLabel(object) : EMPTY_VALUE; } catch (error) { return EMPTY_VALUE; } })()}</td>
                    <td className="resumen-cell-number">{formatGridAmount(signed)}</td>
                    <td>{displayValue(item.concept)}</td><td>{displayValue(item.user)}</td>
                    <td>{Number(item.status) === 2 ? 'Cerrada' : 'Activa'}</td>
                    <td><Button size="small" onClick={() => openMovementReinsurance(item.id)}>Ver Reaseguro</Button></td>
                  </tr>;
                }) : <tr><td className="resumen-empty-row" colSpan="10">
                  {selectedCoverage ? 'La cobertura seleccionada no tiene reservas.' : 'Seleccione una cobertura.'}
                </td></tr>}</tbody>
              </table></div>
            </div>
          </section>
        ) : activeTab === 'payments' ? renderFinancialSection({
          key: 'payments', ariaLabel: 'Pagos del siniestro', sectionTitle: 'Pagos',
          registerLabel: 'Registrar pago', registerTitle: 'Registrar pago', checkTitle: 'Solicitud de cheque',
          appliedLabel: 'Pagado', emptyText: 'No hay pagos registrados para este siniestro.',
          rows: paymentRows, selected: selectedPayment, selectedId: selectedPaymentReserveId,
          select: setSelectedPaymentReserveId, coverages: coverageRows.map((row) => Object.assign({}, row, { available: paymentSpendingAvailable(currentClaimRef.current, row.id, 'IN') })), coverageId: paymentCoverageId,
          setCoverageId: selectFinancialCoverage, amount: paymentAmount, setAmount: setPaymentAmount,
          concept: paymentConcept, setConcept: setPaymentConcept, error: paymentError,
          errorSetter: setPaymentError, refresh: () => refreshFinancialData(claimId),
          reserveOpen: paymentReserveModalOpen, setReserveOpen: setPaymentReserveModalOpen,
          checkOpen: checkRequestModalOpen, setCheckOpen: setCheckRequestModalOpen,
          openReserve: () => {
            selectFinancialCoverage(selectedCoverage ? selectedCoverage.id : coverageRows.length === 1 ? coverageRows[0].id : null);
            setPaymentError('');
            setPaymentReserveModalOpen(true);
          },
          createReserve: () => createPaymentReserve(paymentCoverageId, paymentAmount, paymentConcept),
          openCheck: openCheckRequest, submitCheck: submitCheckRequest
        }) : activeTab === 'expenses' ? renderFinancialSection({
          key: 'expenses', ariaLabel: 'Gastos del siniestro', sectionTitle: 'Gastos',
          registerLabel: 'Registrar gasto', registerTitle: 'Registrar gasto', checkTitle: 'Solicitud de cheque de gasto',
          appliedLabel: 'Aplicado', emptyText: 'No hay gastos registrados para este siniestro.',
          rows: expenseRows, selected: selectedExpense, selectedId: selectedExpenseReserveId,
          select: setSelectedExpenseReserveId, coverages: expenseCoverageRows, coverageId: expenseCoverageId,
          setCoverageId: selectExpenseFinancialCoverage, amount: expenseAmount, setAmount: setExpenseAmount,
          concept: expenseConcept, setConcept: setExpenseConcept, error: expenseError,
          errorSetter: setExpenseError, refresh: () => refreshFinancialData(claimId),
          reserveOpen: expenseReserveModalOpen, setReserveOpen: setExpenseReserveModalOpen,
          checkOpen: expenseCheckRequestModalOpen, setCheckOpen: setExpenseCheckRequestModalOpen,
          openReserve: () => {
            const selectedExpenseCoverage = expenseCoverageRows.find((row) => row.id === Number(selectedCoverageId));
            selectExpenseFinancialCoverage(selectedExpenseCoverage ? selectedExpenseCoverage.id
              : expenseCoverageRows.length === 1 ? expenseCoverageRows[0].id : null);
            setExpenseError('');
            setExpenseReserveModalOpen(true);
          },
          createReserve: () => createExpenseReserve(expenseCoverageId, expenseAmount, expenseConcept),
          openCheck: openExpenseCheckRequest, submitCheck: submitExpenseCheckRequest
        }) : activeTab === 'recoveries' ? (
          <section className="resumen-recoveries" aria-label="Recuperaciones del siniestro">
            <div className="resumen-coverage-toolbar">
              <SectionTitle>Recuperaciones</SectionTitle>
              <div className="resumen-reserve-actions">
                <Button size="small" type="primary" disabled={!editable || recoveryLoading || recoverySaving}
                  onClick={openRecoveryModal}>Nueva recuperación</Button>
                <Button size="small" loading={recoveryLoading} disabled={recoveryLoading || recoverySaving}
                  onClick={() => loadRecoveries(currentClaimRef.current)}><ReloadOutlinedIcon /> Refrescar</Button>
              </div>
            </div>
            {recoveryError ? <Alert type="warning" showIcon message={recoveryError} /> : null}
            {recoveryLoading ? <div><Spin size="small" /> Cargando recuperaciones...</div> : <div className="resumen-table-wrap"><table className="resumen-data-table">
              <thead><tr>{recoveryColumns.map((label) => <th key={label}>{label}</th>)}</tr></thead>
              <tbody>{recoveryRows.length ? recoveryRows.map((row) => <tr key={row.id}>{recoveryValues(row).map((value, index) => <td key={index}>{value}</td>)}</tr>)
                : <tr><td className="resumen-empty-row" colSpan="8">Sin recuperaciones.</td></tr>}</tbody>
            </table></div>}
            <Modal title="Nueva recuperación" visible={recoveryModalOpen} footer={null}
              wrapClassName="resumen-reserve-modal" closable={!recoverySaving} maskClosable={!recoverySaving}
              keyboard={!recoverySaving} onCancel={closeRecoveryModal}>
              {recoveryForm ? <div className="resumen-reserve-form">
                {renderRecoveryField('Tipo', <Select size="small" value={recoveryForm.type} options={recovery.types} onChange={(value) => recoveryFormChanged('type', value)} />)}
                {renderRecoveryField('Cobertura', <Select size="small" value={recoveryForm.coverageId} options={coverageRows.map((row) => ({ value: row.id, label: row.name }))} onChange={(value) => recoveryFormChanged('coverageId', value)} />)}
                {['buyerId', 'recovererId'].map((field) => renderRecoveryField(field === 'buyerId' ? 'Comprador' : 'Recuperador', <Select size="small" showSearch allowClear filterOption={false} value={recoveryForm[field]} options={recoveryForm[field === 'buyerId' ? 'buyerOptions' : 'recovererOptions']} onSearch={(text) => searchRecoveryContacts(field, text)} onChange={(value) => recoveryFormChanged(field, value)} />, field))}
                {renderRecoveryField('Inicio', <DatePicker size="small" format="DD/MM/YYYY" onChange={(value) => recoveryFormChanged('start', value && typeof value.clone === 'function' ? value.clone().startOf('day').toISOString() : undefined)} />)}
                {renderRecoveryField('Moneda', <Select size="small" value={recoveryForm.currency} options={recovery.currencies.map((row) => ({ value: row.code, label: row.name || row.code }))} onChange={(value) => recoveryFormChanged('currency', value)} />)}
                {['income', 'expenses'].map((field) => renderRecoveryField(field === 'income' ? 'Ingreso' : 'Gastos', <Input size="small" inputMode="decimal" value={formatMoneyInput(recoveryForm[field])} onChange={(event) => changeMoneyInput(event, (value) => recoveryFormChanged(field, value))} />, field))}
                {['Retenciones', 'Adiciones'].map((label) => renderRecoveryField(label, <Input size="small" disabled value="0.00" />, label))}
                {renderRecoveryField('Ingreso neto', <Input size="small" disabled value={formatMoneyInput(recoveryNet)} />)}
                <small>Los ajustes distintos de cero requieren el módulo nativo.</small>
                {recoveryError ? <div className="resumen-reserve-error">{recoveryError}</div> : null}
                <div className="resumen-reserve-actions"><Button size="small" disabled={recoverySaving} onClick={closeRecoveryModal}>Cancelar</Button>
                  <Button size="small" type="primary" loading={recoverySaving} disabled={recoverySaving} onClick={() => submitRecovery(recoveryForm)}>Registrar</Button></div>
              </div> : null}
            </Modal>
          </section>

        ) : activeTab === 'documents' ? (
          <section className="resumen-documents" aria-label="Documentos del siniestro">
            <Alert type="info" showIcon message="Notas informativas" description="Los archivos enviados a approvals@axxis-systems.com con el ID de la solicitud como asunto se adjuntarán automáticamente aquí." />
            <h3 className="resumen-document-heading">Apartado de archivos adjuntos</h3>
            {documents.error ? <Alert type="error" showIcon message={documents.error} /> : null}
            <div className="resumen-document-toolbar">
              <Button type="link" disabled={!documents.loaded || documentMutationBlocked()}
                onClick={() => { documents.uploadOpen = !documents.uploadOpen; notifyDocuments(); }}><DocumentIcon name="upload" />Cargar</Button>
              <A.Popover title="Generación de documento a demanda" trigger="click" placement="topLeft"
                visible={documents.generateOpen} onVisibleChange={(visible) => {
                  documents.generateOpen = visible && !documentMutationBlocked() && documents.loaded; notifyDocuments();
                }} content={<div style={{ width: 260 }}>
                  <Select aria-label="Seleccionar plantilla" placeholder="Seleccionar plantilla" showSearch value={undefined}
                    style={{ width: '100%' }} disabled={documentMutationBlocked()}
                    onChange={(value) => writeDocument('GENERATE', value)}>
                    {documentTemplates().map((template) => <Select.Option key={template} value={template}>{template}</Select.Option>)}
                  </Select>
                  {!documentTemplates().length ? <p style={{ margin: '8px 0 0' }}>No hay plantillas habilitadas con una condición compatible para este siniestro.</p> : null}
                </div>}>
                <Button type="link" disabled={!documents.loaded || documentMutationBlocked()}><DocumentIcon name="generate" />Generar</Button>
              </A.Popover>
              <A.Popover title="Filtro de estado de los documentos" trigger="click" placement="topLeft"
                visible={documents.filterOpen} onVisibleChange={(visible) => { documents.filterOpen = visible && documents.loaded; notifyDocuments(); }}
                content={<Select aria-label="Filtrar documentos por estado" allowClear placeholder="Ninguno"
                  value={documents.filter || undefined} style={{ width: 240 }} onChange={setDocumentFilter}>
                  {documents.statuses.map((status) => <Select.Option key={status.code} value={status.code}>{status.name}</Select.Option>)}
                </Select>}>
                <Button type="link" disabled={!documents.loaded || documents.loading}><DocumentIcon name="filter" />Filtrar</Button>
              </A.Popover>
              <Button type="link" disabled={documents.saving || documents.loading || !documentScope()}
                onClick={() => loadDocuments()}><DocumentIcon name="refresh" />Actualizar</Button>
            </div>
            {documents.uploadOpen ? <div className="resumen-document-upload" role="button"
              aria-label="Seleccionar archivo para cargar" aria-disabled={documentMutationBlocked() || !!documents.pending}
              tabIndex={documentMutationBlocked() || documents.pending ? -1 : 0}
              onClick={() => { if (!documentMutationBlocked() && !documents.pending && documentInputRef.current) documentInputRef.current.click(); }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (!documentMutationBlocked() && !documents.pending && documentInputRef.current) documentInputRef.current.click();
                }
              }}
              onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                event.preventDefault();
                if (documentMutationBlocked() || documents.pending) return;
                if (event.dataTransfer.files.length !== 1) { documents.error = 'Seleccione un archivo a la vez.'; notifyDocuments(); return; }
                uploadDocument(event.dataTransfer.files[0]);
              }}>
              <DocumentIcon name="inbox" />
              <p className="resumen-document-upload-title">Hacer clic o arrastrar un archivo a esta área para cargar</p>
              <p className="resumen-document-upload-hint">Seleccione un archivo a la vez para adjuntarlo al siniestro.</p>
              <input type="file" ref={documentInputRef} hidden tabIndex={-1} aria-label="Cargar documento"
                disabled={documentMutationBlocked() || !!documents.pending} onClick={(event) => event.stopPropagation()}
                onChange={(event) => { const file = event.target.files[0]; event.target.value = ''; uploadDocument(file); }} />
            </div> : null}
            {documents.pending ? <Alert type="warning" showIcon message="Archivo cargado; registro documental pendiente de confirmación."
              description="Actualice para comprobar si ya se registró antes de reintentar. No es necesario subir el archivo nuevamente."
              action={<Button disabled={documentMutationBlocked() || !documents.pending.checked}
                onClick={() => writeDocument('ADD')}>Reintentar registro</Button>} /> : null}
            <A.Table size="small" rowKey="id" loading={documents.loading || documents.saving}
              dataSource={visibleDocuments()} scroll={{ x: 950 }} pagination={{ pageSize: 10, hideOnSinglePage: false }}
              locale={{ emptyText: 'No hay datos' }} columns={[
                { title: 'Id', dataIndex: 'id', width: 70 },
                { title: 'Archivo', dataIndex: 'fileName', width: 230, render: (value) => <span className="resumen-document-cell-ellipsis" title={value || undefined}>{displayValue(value)}</span> },
                { title: 'Tipo', dataIndex: 'name', width: 180, render: (value) => <span className="resumen-document-cell-ellipsis" title={value || undefined}>{displayValue(value)}</span> },
                { title: 'Creado', dataIndex: 'created', width: 175, render: (value) => formatDocumentCreated(value) },
                { title: 'Estado', key: 'status', width: 145, render: (value, row) => <Select aria-label={'Estado del documento ' + row.id}
                  placeholder="Ninguno" style={{ width: '100%' }} value={row.status || undefined}
                  disabled={documentMutationBlocked() || !documents.loaded}
                  onChange={(status) => writeDocument('UPDATE', row.id, status)}>
                  {row.status && !documents.statuses.some((status) => status.code === row.status)
                    ? <Select.Option value={row.status} disabled>{row.status}</Select.Option> : null}
                  {documents.statuses.map((status) => <Select.Option key={status.code} value={status.code}>{status.name}</Select.Option>)}
                </Select> },
                { title: 'Archivo', key: 'open', width: 80, render: (value, row) => documentUrl(row.url)
                  ? <Button type="link" size="small" disabled={!!documents.downloading || documents.saving || documents.loading}
                    onClick={() => downloadDocument(row.id)}>Abrir</Button> : EMPTY_VALUE },
                { title: 'Asociación', key: 'association', width: 140, render: (value, row) =>
                  <Select aria-label={'Asociación del documento ' + row.id} disabled style={{ width: '100%' }}
                    value={row.association == null ? undefined : String(row.association)}>
                    {row.association == null ? null : <Select.Option value={String(row.association)}>{String(row.association)}</Select.Option>}
                  </Select> },
                { title: '', key: 'delete', width: 54, render: (value, row) => <Popconfirm title="¿Eliminar este documento?"
                  okText="Eliminar" cancelText="Cancelar" disabled={documentMutationBlocked() || !documents.loaded}
                  onConfirm={() => writeDocument('DELETE', row.id)}><Button type="link" className="resumen-document-delete" aria-label={'Eliminar documento ' + row.id}
                    disabled={documentMutationBlocked() || !documents.loaded}><DocumentIcon name="delete" /></Button></Popconfirm> }
              ]} />
          </section>
        ) : activeTab === 'comments' ? (
          <section className="resumen-section" aria-label="Comentarios">
            <SectionTitle>Comentarios{comments.loaded ? ' (' + comments.rows.length + ')' : ''}</SectionTitle>
            {comments.error ? <Alert type="error" showIcon message={comments.error}
              action={<Button disabled={comments.loading || comments.saving} onClick={loadComments}>Reintentar</Button>} /> : null}
            {comments.loading ? <Spin tip="Cargando comentarios..." /> : null}
            {comments.loaded && !comments.loading && !comments.rows.length ? <p>No hay comentarios.</p> : null}
            {comments.rows.map((comment) => (
              <article key={comment.id} className="resumen-comment">
                <span className="resumen-field-note">{comment.user || 'Usuario no disponible'}</span>
                <span className="resumen-field-note" style={{ marginLeft: 12 }}>{displayValue(formatDate(comment.created))}</span>
                <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{comment.message}</p>
                <Popconfirm title="¿Eliminar este comentario?" okText="Eliminar" cancelText="Cancelar"
                  disabled={comments.saving || comments.loading} onConfirm={() => deleteComment(comment.id)}>
                  <Button type="link" size="small" disabled={comments.saving || comments.loading}>Eliminar</Button>
                </Popconfirm>
              </article>
            ))}
            <TextArea aria-label="Nuevo comentario" rows={4} value={comments.draft}
              disabled={comments.saving || !commentScope()} onChange={(event) => changeCommentDraft(event.target.value)} />
            <Button type="primary" style={{ marginTop: 8 }} loading={comments.saving}
              disabled={comments.saving || comments.loading || !commentScope() || !comments.draft.trim()}
              onClick={addComment}>Añadir comentario</Button>
          </section>
        ) : activeTab === 'custom' ? (
          <section className="resumen-custom" aria-label="Formularios personalizados">
            {customFormsLoading ? <div className="resumen-custom-state"><Spin size="small" /> Cargando formularios personalizados...</div> : null}
            {!customFormsLoading && customFormsError ? <div className="resumen-custom-state"><Alert type="error" showIcon
              message={customFormsError} action={<Button size="small" onClick={() => loadCustomForms(currentClaimRef.current)}>Reintentar</Button>} /></div> : null}
            {!customFormsLoading && !customFormsError && customForms.length === 0
              ? <div className="resumen-custom-state">No hay formularios personalizados configurados para este siniestro.</div> : null}
            {!customFormsLoading && !customFormsError && customForms.length ? <React.Fragment>
              <nav className="resumen-custom-tabs" aria-label="Formularios configurados">
                {customForms.map((form) => <button type="button" key={form.key}
                  className={activeCustomForm === form.key ? 'resumen-tab resumen-tab-active' : 'resumen-tab'}
                  onClick={() => setActiveCustomForm(form.key)}>{form.label}</button>)}
              </nav>
              {customForms.map((form) => <form key={form.key} id={form.key}
                style={{ display: activeCustomForm === form.key ? 'block' : 'none' }}
                className="resumen-custom-form" noValidate={false} />)}
            </React.Fragment> : null}
          </section>
        ) : <div className="resumen-inactive">El contenido de esta sección se integrará en una etapa posterior.</div>}
        {activeTab !== 'custom' && !customFormsLoading && !customFormsError && customForms.length ? <div
          className="resumen-custom-preload" aria-hidden="true">
          {customForms.map((form) => <form key={form.key} id={form.key} noValidate={false} />)}
        </div> : null}
      </Card>
      {renderMovementReinsurance()}
    </div>
  );
}
