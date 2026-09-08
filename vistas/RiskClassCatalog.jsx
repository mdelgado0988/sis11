/**
 * @author aiden_sa_3
 * @created 2026-09-08
 * @summary Mantenimiento de clases de riesgo (Fianzas). Catalogo nativo RiskClassCatalog:
 *          id (identity) = cclaries del requerimiento, name = xdescripcion_l.
 * @name RiskClassCatalog
 * @version 1.1.0
 * @issue AXX-338 / GLOB-1237 · estandar de diseno aplicado en MSN-000002 (AXX-378)
 *
 * Solo presentacion: el bloque `css`, el marcado del topbar/panel y la medicion de
 * alto. La logica, los comandos, los filtros, la validacion y la paginacion quedan
 * exactamente como estaban.
 *
 * Notas de plataforma (no borrar):
 *  - El motor es react-live 2.4.1 -> buble 0.19.6: nada de arrow async, ni ?., ni ??,
 *    ni entidades HTML dentro del JSX.
 *  - RepoRiskClassCatalog GET pagina con `page` BASE 0 y ordena por id ASCENDENTE.
 *  - El id lo genera la base (columna identity): la vista NUNCA calcula max(id)+1,
 *    y por eso dos altas simultaneas no pueden colisionar.
 */
() => {
  const A_ = A;
  const Table = A_.Table;
  const Button = A_.Button;
  const Modal = A_.Modal;
  const Drawer = A_.Drawer;
  const Input = A_.Input;
  const InputNumber = A_.InputNumber;
  const Space = A_.Space;
  const Alert = A_.Alert;
  const Empty = A_.Empty;
  const Tag = A_.Tag;
  const message = A_.message;

  // antd 4 no exporta Icon: el ambiente dibuja los iconos como SVG en linea.
  const svg = (d) => (
    <span role="img" className="anticon">
      <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
    </span>
  );
  const IcoBuscar = () => svg('M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z');
  const IcoActualizar = () => svg('M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z');

  const CMD = 'RepoRiskClassCatalog';
  const MAX_LEN = 200;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [applied, setApplied] = useState({ id: null, name: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [dupWarn, setDupWarn] = useState(null);

  const [perm, setPerm] = useState({ canAdd: true, canEdit: true, resolved: false });
  const [tableY, setTableY] = useState(360);
  const [viewH, setViewH] = useState(450);

  // ---------------------------------------------------------------- filtros
  // Los filtros activos se combinan con AND (dictamen, supuesto 2). El nombre
  // se busca por subcadena con la comparacion propia del catalogo: no se fuerza
  // COLLATE ni LOWER(), asi la sensibilidad a mayusculas y acentos es la misma
  // que ya aplica el resto del sistema sobre esta tabla.
  const sqlSafe = (s) => String(s).split("'").join("''");

  const buildFilter = (f) => {
    const parts = [];
    if (f.id !== null && f.id !== undefined && String(f.id) !== '') parts.push('id=' + Number(f.id));
    if (f.name && f.name.trim() !== '') parts.push("name LIKE '%" + sqlSafe(f.name.trim()) + "%'");
    return parts.join(' AND ');
  };

  const hasFilter = (f) => buildFilter(f) !== '';

  // ---------------------------------------------------------------- lectura
  const fetchPage = (wantedPage, size, f) => {
    const data = { operation: 'GET', size: size, page: wantedPage - 1 };
    const flt = buildFilter(f);
    if (flt !== '') data.filter = flt;
    return exe(CMD, data);
  };

  // Relee y, si la pagina pedida quedo fuera de rango (por ejemplo tras filtrar
  // o tras una edicion que saca la fila del filtro), retrocede a la ultima
  // pagina valida en lugar de dejar la grilla vacia (dictamen, supuesto 3).
  const load = (wantedPage, size, f) => {
    setLoading(true);
    setLoadError(null);
    return fetchPage(wantedPage, size, f)
      .then((r) => {
        if (!r.ok) throw new Error(r.msg || 'No se pudo consultar el catalogo');
        const count = r.total || 0;
        const lastPage = count === 0 ? 1 : Math.ceil(count / size);
        const list = r.outData || [];
        if (list.length === 0 && count > 0 && wantedPage > lastPage) {
          return fetchPage(lastPage, size, f).then((r2) => {
            if (!r2.ok) throw new Error(r2.msg || 'No se pudo consultar el catalogo');
            setPage(lastPage);
            setRows(r2.outData || []);
            setTotal(r2.total || 0);
          });
        }
        setPage(wantedPage);
        setRows(list);
        setTotal(count);
      })
      .catch((e) => {
        setLoadError(String(e.message || e));
        setRows([]);
        setTotal(0);
      })
      .then(() => setLoading(false));
  };

  // ------------------------------------------------------------- permisos
  // jActions de un grupo es una lista de DENEGACION: el codigo presente PROHIBE.
  // Sin filas de catalogo para este comando nadie esta denegado, que es como se
  // comporta hoy el gate nativo.
  const resolvePerms = () => {
    exe('RepoActionCatalog', { operation: 'GET', filter: "cmd='" + CMD + "'" })
      .then((r) => {
        const acts = (r && r.ok && r.outData) || [];
        if (acts.length === 0) {
          setPerm({ canAdd: true, canEdit: true, resolved: true });
          return null;
        }
        return exe('GetCurrentUser', {}).then((u) => {
          const groups = (u && u.ok && u.outData && u.outData.Groups) || [];
          const ids = [];
          for (let i = 0; i < groups.length; i++) {
            if (groups[i].usrGroupId && ids.indexOf(groups[i].usrGroupId) === -1) ids.push(groups[i].usrGroupId);
          }
          if (ids.length === 0) {
            setPerm({ canAdd: true, canEdit: true, resolved: true });
            return null;
          }
          return exe('RepoUsrGroup', { operation: 'GET', filter: 'id IN (' + ids.join(',') + ')' }).then((g) => {
            const denied = [];
            const gr = (g && g.ok && g.outData) || [];
            for (let i = 0; i < gr.length; i++) {
              let list = [];
              try { list = JSON.parse(gr[i].jActions || '[]'); } catch (e) { list = []; }
              for (let j = 0; j < list.length; j++) {
                const code = typeof list[j] === 'string' ? list[j] : list[j].code;
                if (code && denied.indexOf(code) === -1) denied.push(code);
              }
            }
            let canAdd = true;
            let canEdit = true;
            for (let i = 0; i < acts.length; i++) {
              if (denied.indexOf(acts[i].code) === -1) continue;
              const d = acts[i].data || '';
              const isAdd = d.indexOf('ADD') !== -1;
              const isUpd = d.indexOf('UPDATE') !== -1;
              if (isAdd) canAdd = false;
              if (isUpd) canEdit = false;
              if (!isAdd && !isUpd) { canAdd = false; canEdit = false; }
            }
            setPerm({ canAdd: canAdd, canEdit: canEdit, resolved: true });
            return null;
          });
        });
      })
      .catch(() => setPerm({ canAdd: true, canEdit: true, resolved: true }));
  };

  useEffect(() => {
    load(1, pageSize, { id: null, name: '' });
    resolvePerms();
  }, []);

  // -------------------------------------------------------------- alto util
  // El alto se MIDE contra el ancestro que scrollea; no se fija con una constante ni
  // con calc(100dvh - n), que ya fallo en otra vista. Dentro del panel se mide lo que
  // NO es cuerpo de grilla -encabezado arriba, paginacion con sus margenes abajo- para
  // que la paginacion nunca quede fuera de la vista. La paginacion recien existe
  // cuando hay filas, asi que el efecto corre en CADA render, no solo al montar.
  const measure = () => {
    const root = document.querySelector('.axx338');
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (!rect || rect.height === 0) return;
    let cont = root.parentElement;
    while (cont && cont !== document.body && !/(auto|scroll)/.test(window.getComputedStyle(cont).overflowY)) cont = cont.parentElement;
    const limit = cont && cont !== document.body ? cont.getBoundingClientRect().bottom : window.innerHeight;
    const h = Math.max(200, Math.floor(limit - rect.top - 12));
    setViewH((prev) => (Math.abs(h - prev) > 4 ? h : prev));
    const panel = root.querySelector('.axx338-panel');
    if (!panel) return;
    const body = panel.querySelector('.ant-table-body');
    if (!body) return;
    const pRect = panel.getBoundingClientRect();
    const bRect = body.getBoundingClientRect();
    const bt = parseFloat(window.getComputedStyle(panel).borderTopWidth || 0);
    const above = bRect.top - (pRect.top + bt);
    let below = 0;
    const pager = panel.querySelector('.ant-table-pagination');
    if (pager) {
      const ps = window.getComputedStyle(pager);
      below = pager.getBoundingClientRect().bottom + parseFloat(ps.marginBottom || 0) - bRect.bottom;
    }
    const y = Math.max(90, Math.floor(panel.clientHeight - above - below - 1));
    setTableY((prev) => (Math.abs(y - prev) > 4 ? y : prev));
  };

  useEffect(() => {
    measure();
    const t1 = setTimeout(measure, 0);
    const t2 = setTimeout(measure, 200);
    window.addEventListener('resize', measure);
    const root = document.querySelector('.axx338');
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer && root) observer.observe(root);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', measure);
      if (observer) observer.disconnect();
    };
  });

  // ------------------------------------------------------------- validacion
  const validate = (value) => {
    const v = String(value === null || value === undefined ? '' : value);
    if (v.trim() === '') return t('La descripcion es obligatoria y no puede contener solo espacios');
    if (v.trim().length > MAX_LEN) return t('La descripcion no puede superar los 200 caracteres');
    return null;
  };

  // El modelo vigente no tiene indice unico sobre la descripcion, asi que la
  // duplicidad se ADVIERTE y no bloquea: es la unica restriccion que impone el
  // modelo, tal como pide el requerimiento.
  const checkDuplicate = (value, selfId) => {
    const v = String(value || '').trim();
    if (v === '') return Promise.resolve(null);
    return exe(CMD, { operation: 'GET', filter: "name LIKE '%" + sqlSafe(v) + "%'", size: 50 }).then((r) => {
      const list = (r && r.ok && r.outData) || [];
      for (let i = 0; i < list.length; i++) {
        const same = String(list[i].name || '').trim().toLowerCase() === v.toLowerCase();
        if (same && list[i].id !== selfId) return list[i].id;
      }
      return null;
    });
  };

  // --------------------------------------------------------------- escritura
  const openNew = () => {
    setEditing(null);
    setDesc('');
    setFormError(null);
    setDupWarn(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setDesc(row.name === null || row.name === undefined ? '' : String(row.name));
    setFormError(null);
    setDupWarn(null);
    setModalOpen(true);
  };

  // Cancelar no toca el registro: solo cierra y limpia el borrador.
  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setDesc('');
    setFormError(null);
    setDupWarn(null);
  };

  const save = () => {
    if (saving) return; // evita el doble envio mientras la operacion esta en curso
    const err = validate(desc);
    if (err) {
      setFormError(err);
      return;
    }
    const value = String(desc).trim();
    const isEdit = editing !== null && editing !== undefined;
    setSaving(true);
    setFormError(null);
    checkDuplicate(value, isEdit ? editing.id : null)
      .then((dupId) => {
        if (dupId !== null) setDupWarn(t('Ya existe una clase con esa descripcion') + ' (id ' + dupId + ')');
        else setDupWarn(null);
        // ADD sin id: lo asigna la base. UPDATE manda solo id + name, de modo que
        // ningun otro campo del registro se toca.
        const data = isEdit
          ? { operation: 'UPDATE', entity: { id: editing.id, name: value } }
          : { operation: 'ADD', entity: { name: value } };
        return exe(CMD, data);
      })
      .then((r) => {
        if (!r || !r.ok) throw new Error((r && r.msg) || t('No se pudo guardar'));
        message.success(isEdit ? t('Clase de riesgo actualizada') : t('Clase de riesgo creada'));
        setModalOpen(false);
        setEditing(null);
        setDesc('');
        setDupWarn(null);
        // Refresco conservando filtros y pagina; load() reencuadra si hace falta.
        return load(page, pageSize, applied);
      })
      .catch((e) => {
        // El modal queda abierto con lo capturado: nada se da por guardado.
        setFormError(String((e && e.message) || e));
      })
      .then(() => setSaving(false));
  };

  // ----------------------------------------------------------------- filtros
  const applyFilter = () => {
    const f = { id: draftId, name: draftName };
    setApplied(f);
    setDrawerOpen(false);
    load(1, pageSize, f);
  };

  const clearFilter = () => {
    const f = { id: null, name: '' };
    setDraftId(null);
    setDraftName('');
    setApplied(f);
    setDrawerOpen(false);
    load(1, pageSize, f);
  };

  const openDrawer = () => {
    setDraftId(applied.id);
    setDraftName(applied.name);
    setDrawerOpen(true);
  };

  // ------------------------------------------------------------------ render
  const columns = [
    { title: t('Id'), dataIndex: 'id', key: 'id', width: 110, sorter: (a, b) => a.id - b.id },
    {
      title: t('Nombre'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (v) => (v === null || v === undefined || String(v).trim() === '' ? <Tag>{t('Sin descripcion')}</Tag> : String(v)),
    },
    {
      title: t('Acciones'),
      key: 'acciones',
      width: 140,
      render: (v, row) => (
        <Button type="link" size="small" disabled={!perm.canEdit} onClick={() => openEdit(row)}>
          {t('Editar')}
        </Button>
      ),
    },
  ];

  const filtrosActivos = hasFilter(applied);

  // Estandar visual del ambiente, acotado a la clase raiz de esta vista para no
  // alterar antd en el resto de la SPA. Las reglas que pisan estilos propios de
  // antd necesitan !important. El modal y el drawer viven en portales fuera del
  // arbol de la vista: se alcanzan por su propia clase.
  const css =
    '.axx338{display:flex;flex-direction:column;min-width:0;overflow:hidden;font-size:13px;}' +
    '.axx338 .axx338-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;background:transparent;border:1px solid #e6ebf2;border-radius:6px;padding:4px 0;margin:0 0 2px 0;flex-shrink:0;}' +
    '.axx338 .axx338-bar>*{margin-left:4px;}' +
    '.axx338 .axx338-bar>*:last-child{margin-right:4px;}' +
    '.axx338 .axx338-spacer{flex:1 1 auto;min-width:0;}' +
    '.axx338 .axx338-alerta{margin:0 0 2px 0;flex-shrink:0;}' +
    '.axx338 .axx338-panel{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;min-width:0;overflow:hidden;background:#fff;border:1px solid #cbd1d8;}' +
    '.axx338 .axx338-panel .ant-table-wrapper{flex:1 1 auto;min-height:0;min-width:0;}' +
    '.axx338 .ant-table-body{min-height:' + tableY + 'px;}' +
    '.axx338 .ant-table-thead>tr>th{background:#bfbfbf !important;color:#262626;font-weight:600;border-right:1px solid #cbd1d8 !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;}' +
    '.axx338 .ant-table-thead>tr>th:last-child{border-right:none !important;}' +
    '.axx338 .ant-table-thead>tr>th::before{display:none !important;}' +
    '.axx338 .ant-table-tbody>tr>td{border-right:none !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;}' +
    '.axx338 .ant-table-tbody>tr.ant-table-row:hover>td{background:#b7d7ff !important;}' +
    '.axx338 .ant-table-tbody>tr.ant-table-row-selected>td,.axx338 .ant-table-tbody>tr.axx338-selected>td{background:#86b4ff !important;}' +
    '.axx338 .ant-table-tbody>tr.ant-table-row-selected:hover>td,.axx338 .ant-table-tbody>tr.axx338-selected:hover>td{background:#86b4ff !important;}' +
    '.axx338 .ant-table-tbody>tr.ant-table-placeholder:hover>td{background:#fff !important;}' +
    '.axx338 .ant-table-pagination.ant-pagination{margin:8px;flex-shrink:0;}' +
    '.axx338 .axx338-btn-sec{border-color:#8f9aa7 !important;}' +
    '.axx338 .ant-btn[disabled],.axx338-modal .ant-btn[disabled],.axx338-drawer .ant-btn[disabled]{border-color:#6f7b88 !important;opacity:1 !important;}' +
    '.axx338-modal .ant-modal-body,.axx338-drawer .ant-drawer-body{font-size:13px;}' +
    '.axx338-modal .ant-modal-footer .ant-btn-default,.axx338-drawer .axx338-btn-sec{border-color:#8f9aa7 !important;}';

  return (
    <DefaultPage title={t('Clases de Riesgo (Fianzas)')} icon="safety-certificate">
      <div className="axx338" style={{ height: viewH }}>
        <style>{css}</style>

        <div className="axx338-bar">
          <Button type="primary" disabled={!perm.canAdd} onClick={openNew}>
            {t('Nuevo')}
          </Button>
          <Button type="primary" icon={<IcoBuscar />} onClick={openDrawer}>
            {t('Filtrar')}
          </Button>
          {filtrosActivos ? (
            <Button className="axx338-btn-sec" onClick={clearFilter}>
              {t('Limpiar filtros')}
            </Button>
          ) : null}
          {filtrosActivos ? (
            <Tag color="blue">
              {t('Filtros activos')}
              {applied.id !== null && applied.id !== undefined && String(applied.id) !== '' ? ' - ' + t('Id') + ': ' + applied.id : ''}
              {applied.name && applied.name.trim() !== '' ? ' - ' + t('Nombre') + ': ' + applied.name : ''}
            </Tag>
          ) : null}
          <span className="axx338-spacer" />
          <Button className="axx338-btn-sec" icon={<IcoActualizar />} disabled={loading} onClick={() => load(page, pageSize, applied)}>
            {t('Actualizar')}
          </Button>
        </div>

        {loadError ? <Alert className="axx338-alerta" type="error" showIcon message={loadError} /> : null}

        <section className="axx338-panel">
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 620, y: tableY }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={filtrosActivos ? t('No hay clases de riesgo que coincidan con los filtros aplicados') : t('El catalogo de clases de riesgo esta vacio')}
              />
            ),
          }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            size: 'small',
            showTotal: (n) => t('Total') + ': ' + n,
            onChange: (p, s) => {
              setPageSize(s);
              load(p, s, applied);
            },
          }}
        />
        </section>

        <Drawer
          title={t('Filtrar clases de riesgo')}
          className="axx338-drawer"
          placement="right"
          width={340}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 4 }}>{t('Id')}</div>
            <InputNumber
              style={{ width: '100%' }}
              value={draftId}
              min={1}
              precision={0}
              placeholder={t('Busqueda exacta por id')}
              onChange={(v) => setDraftId(v)}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 4 }}>{t('Nombre')}</div>
            <Input
              value={draftName}
              placeholder={t('Busqueda por coincidencia')}
              onChange={(e) => setDraftName(e.target.value)}
              onPressEnter={applyFilter}
            />
          </div>
          <Space>
            <Button type="primary" icon={<IcoBuscar />} onClick={applyFilter}>
              {t('Aplicar')}
            </Button>
            <Button className="axx338-btn-sec" onClick={clearFilter}>
              {t('Limpiar')}
            </Button>
          </Space>
        </Drawer>

        <Modal
          title={editing ? t('Editar clase de riesgo') : t('Nueva clase de riesgo')}
          wrapClassName="axx338-modal"
          open={modalOpen}
          onOk={save}
          onCancel={closeModal}
          okText={t('Guardar')}
          cancelText={t('Cancelar')}
          confirmLoading={saving}
          maskClosable={false}
          destroyOnClose={false}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>{t('Id')}</div>
            <Input value={editing ? String(editing.id) : t('Se asigna automaticamente')} disabled readOnly />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>
              {t('Nombre')} <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Input
              value={desc}
              maxLength={null}
              autoFocus
              placeholder={t('Descripcion de la clase de riesgo')}
              onChange={(e) => {
                setDesc(e.target.value);
                if (formError) setFormError(null);
              }}
            />
          </div>
          {dupWarn ? <Alert type="warning" showIcon message={dupWarn} style={{ marginBottom: 8 }} /> : null}
          {formError ? <Alert type="error" showIcon message={formError} /> : null}
        </Modal>
      </div>
    </DefaultPage>
  );
}
