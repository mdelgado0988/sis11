() => {
  const {useState, useEffect, useRef} = React;
  const {Table, Button, Drawer, Modal, Input, Select, Alert, Form, Space} = A;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawer, setDrawer] = useState(false);
  const empty = {id:'', name:'', cobis:''};
  const [draft, setDraft] = useState(empty);
  const [filters, setFilters] = useState(empty);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({name:'', percentage:'', category:'', status:undefined, cobis:''});
  const [height, setHeight] = useState(300);
  const request = useRef(0);
  const load = () => {
    const current = ++request.current;
    setLoading(true); setError('');
    exe('GetFullTable', {table:'actividad'}).then(r => {
      if (request.current !== current) return;
      if (!r.ok) throw new Error(r.msg || t('No se pudo consultar el catálogo.'));
      const data = r.outData;
      const expected = ['cactividad','xactividad','pactividad','ccategoria','Estatus','COD_COBIS'];
      if (!Array.isArray(data) || !Array.isArray(data[0]) || expected.some((key,i) => data[0][i] !== key)) throw new Error(t('El formato del catálogo cambió. No se actualizaron los resultados.'));
      setRows(data.slice(1).filter(row => Array.isArray(row) && row.some(x => x !== null && x !== '')).map((row,i) => ({key:String(i),id:row[0],name:row[1],percentage:row[2],category:row[3],status:row[4],cobis:row[5],raw:row.slice()})));
    }).catch(e => {if (request.current === current) setError(t(String(e.message || e)));})
      .finally(() => {if (request.current === current) setLoading(false);});
  };
  useEffect(() => {load(); return () => {request.current++;};}, []);
  useEffect(() => {
    const measure = () => {
      const root = document.querySelector('.axx343');
      const body = root && root.querySelector('.ant-table-body');
      const pager = root && root.querySelector('.ant-pagination');
      if (!body) return;
      if (!pager) return;
      const bodyRect = body.getBoundingClientRect();
      const pagerRect = pager.getBoundingClientRect();
      const belowBody = pagerRect.bottom - bodyRect.bottom;
      const next = Math.max(100, window.innerHeight - bodyRect.top - belowBody - 14);
      if (Math.abs(next-height)>2) setHeight(next);
    };
    const timer = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => {clearTimeout(timer); window.removeEventListener('resize', measure);};
  });
  const text = x => x === null || x === undefined ? '' : String(x);
  const norm = x => text(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const visible = rows.filter(r => (!filters.id || text(r.id)===filters.id.trim()) && (!filters.name || norm(r.name).includes(norm(filters.name.trim()))) && (!filters.cobis || text(r.cobis)===filters.cobis.trim()));
  const clear = () => {setDraft(empty); setFilters(empty); setPage(1);};
  const edit = row => {setEditing(row); setValues(row ? {name:text(row.name),percentage:text(row.percentage),category:text(row.category),status:text(row.status),cobis:text(row.cobis)} : {name:'',percentage:'',category:'',status:'1',cobis:''}); setOpen(true);};
  const update = (key,value) => setValues(previous => Object.assign({},previous,{[key]:value}));
  const numericError = (value,integer) => {
    if (value === '') return '';
    if (!/^-?\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) return t('Ingrese un número válido.');
    if (integer && !Number.isInteger(Number(value))) return t('Ingrese un número entero.');
    if (!integer && Math.abs(Number(value)*100-Math.round(Number(value)*100))>0.000001) return t('Use como máximo dos decimales.');
    return '';
  };
  const percentageError = numericError(values.percentage,false);
  const categoryError = numericError(values.category,true);
  const save = () => {
    if (loading || !values.name.trim()) return;
    if (percentageError || categoryError || (values.status !== '0' && values.status !== '1')) {
      setError(t('Revise los datos obligatorios y los formatos ingresados.'));
      return;
    }
    setLoading(true); setError('');
    let nextData;
    const name = values.name.trim();
    const percentage = values.percentage === '' ? '' : Number(values.percentage.replace(',', '.')).toFixed(2);
    const category = values.category === '' ? '' : String(Number(values.category));
    exe('GetFullTable', {table:'actividad'})
      .then(response => {
        if (!response || response.ok === false) throw new Error((response && response.msg) || t('No se pudo consultar el catálogo.'));
        const data = response.outData;
        const expected = ['cactividad','xactividad','pactividad','ccategoria','Estatus','COD_COBIS'];
        if (!Array.isArray(data) || !Array.isArray(data[0]) || expected.some((key,i) => data[0][i] !== key)) throw new Error(t('El formato del catálogo cambió. No se actualizaron los resultados.'));
        nextData = data.map(row => Array.isArray(row) ? row.slice() : row);
        let index = -1;
        if (editing) {
          for (let i = 1; i < nextData.length; i++) {
            if (String(nextData[i][0]) === String(editing.id)) { index = i; break; }
          }
          if (index < 0) throw new Error(t('La ocupación no existe. Actualice el listado.'));
          if (editing.raw && JSON.stringify(nextData[index]) !== JSON.stringify(editing.raw)) throw new Error(t('La ocupación cambió desde que se abrió. Cancele y vuelva a editarla.'));
          nextData[index][1] = name;
          nextData[index][2] = percentage;
          nextData[index][3] = category;
          nextData[index][4] = values.status;
          nextData[index][5] = values.cobis.trim();
        } else {
          let nextId = 1;
          nextData.slice(1).forEach(row => { const id = Number(row && row[0]); if (Number.isSafeInteger(id) && id >= nextId) nextId = id + 1; });
          nextData.push([nextId, name, percentage, category, values.status, values.cobis.trim()]);
        }
        const json = JSON.stringify(nextData).replace(/'/g, "''");
        return exe('DoQuery', {sql:"UPDATE [Table] SET data='" + json + "' WHERE [name]='actividad'"});
      })
      .then(saved => {
        if (!saved || saved.ok === false) throw new Error((saved && saved.msg) || t('No se pudo guardar la ocupación.'));
        return exe('GetFullTable', {table:'actividad'});
      })
      .then(verification => {
        if (!verification || verification.ok === false || !Array.isArray(verification.outData)) throw new Error(t('No se pudo verificar el registro guardado.'));
        const persisted = verification.outData.slice(1).some(row => Array.isArray(row) && String(row[1]) === name && String(row[4]) === String(values.status));
        if (!persisted) throw new Error(t('El registro no pudo verificarse después de guardar.'));
        const cleanRows = verification.outData.slice(1).filter(row => Array.isArray(row) && row.some(x => x !== null && x !== '')).map((row,i) => ({key:String(i),id:row[0],name:row[1],percentage:row[2],category:row[3],status:row[4],cobis:row[5],raw:row.slice()}));
        setRows(cleanRows); setOpen(false); setEditing(null); A.message.success(t('Ocupación guardada correctamente.'));
      })
      .catch(e => setError(String(e.message || e)))
      .then(() => setLoading(false));
  };
  const columns = [
    {title:t('Id'),dataIndex:'id',width:80},
    {title:t('Nombre'),dataIndex:'name',width:340,ellipsis:true},
    {title:t('Porcentaje'),dataIndex:'percentage',width:120,align:'right',render:v => text(v)==='' ? '' : Number.isFinite(Number(v)) ? Number(v).toFixed(2) : text(v)},
    {title:t('Categoría'),dataIndex:'category',width:100},
    {title:t('Estatus'),dataIndex:'status',width:90,render:v => text(v)==='1' ? t('Si') : text(v)==='0' ? t('No') : t('Sin estatus')},
    {title:t('COD_COBIS'),dataIndex:'cobis',width:130,render:text},
    {title:t('Acciones'),key:'actions',width:110,render:(_,row) => <Button size="small" onClick={() => edit(row)}>{t('Editar')}</Button>}
  ];
  return <DefaultPage title={t('Ocupaciones')} icon="unordered-list">
    <div className="axx343">
      <style>{`
        .axx343{font-size:13px;min-width:0;max-width:100%}
        .axx343 .axx343-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:4px;border:1px solid #e6ebf2;border-radius:6px;margin:0 4px 8px;background:#fff}
        .axx343 .axx343-count{margin-left:auto;padding:0 8px}
        .axx343 .ant-alert{margin:0 4px 8px;font-size:13px}
        .axx343 .axx343-grid{border:1px solid #cbd1d8;border-radius:6px;padding:4px;background:white;min-width:0}
        .axx343 .ant-table-thead>tr>th{background:#bfbfbf!important;border-right:1px solid #cbd1d8!important;border-bottom:1px solid #cbd1d8!important;font-size:12px;padding:5px 8px!important;line-height:18px}
        .axx343 .ant-table-thead>tr>th:before{display:none!important}
        .axx343 .ant-table-tbody>tr>td{border-right:0!important;border-bottom:1px solid #cbd1d8!important;padding:5px 8px!important;font-size:12px;line-height:18px}
        .axx343 .ant-table-tbody>tr:hover>td{background:#b7d7ff!important}
        .axx343 .ant-table-body{min-height:${height}px}
        .axx343 .ant-table-pagination{margin:8px 0!important}
        .axx343-dialog .ant-modal-header,.axx343-drawer .ant-drawer-header{background:linear-gradient(90deg,#e6f4ff 0%,#4096ff 100%)}
        .axx343-dialog .ant-form-item{margin-bottom:14px}
        .axx343-dialog .ant-modal-body{max-height:65vh;overflow:auto}
        .axx343-dialog .ant-btn[disabled]{border:1px solid #d9d9d9!important;color:#777!important}
      `}</style>
      <div className="axx343-bar">
        <Button onClick={() => {setDraft(filters);setDrawer(true);}}>{t('Filtrar')}</Button>
        <Button type="primary" disabled={loading || !!error} onClick={() => edit(null)}>{t('Nuevo')}</Button>
        <Button loading={loading} onClick={load}>{t('Actualizar')}</Button>
        <span className="axx343-count" role="status">{visible.length} {t('de')} {rows.length} {t('registros')}</span>
      </div>
      {error ? <Alert type="error" showIcon message={error} description={t('Se conservan los filtros y los últimos resultados disponibles. Pulse Actualizar para reintentar.')}/> : null}
      <div className="axx343-grid"><Table rowKey="key" size="small" tableLayout="fixed" loading={loading} columns={columns} dataSource={visible} scroll={{x:1070,y:height}} locale={{emptyText:t('No se encontraron ocupaciones.')}} pagination={{current:page,pageSize:pageSize,showSizeChanger:true,pageSizeOptions:['20','50','100'],locale:{items_per_page:t('por página'),prev_page:t('Página anterior'),next_page:t('Página siguiente'),prev_5:t('Cinco páginas anteriores'),next_5:t('Cinco páginas siguientes')},onChange:(p,s) => {setPage(p);setPageSize(s);}}}/></div>
      <Drawer className="axx343-drawer" title={t('Filtrar ocupaciones')} width="min(380px, 100vw)" visible={drawer} onClose={() => setDrawer(false)} footer={<Space><Button onClick={clear}>{t('Limpiar filtros')}</Button><Button type="primary" onClick={() => {setFilters(draft);setPage(1);setDrawer(false);}}>{t('Buscar')}</Button></Space>}>
        <Form layout="vertical" onFinish={() => {setFilters(draft);setPage(1);setDrawer(false);}}>
          <Form.Item label={t('Id')}><Input id="axx343-filter-id" value={draft.id} onChange={e => setDraft(Object.assign({},draft,{id:e.target.value}))}/></Form.Item>
          <Form.Item label={t('Nombre')}><Input id="axx343-filter-name" value={draft.name} onChange={e => setDraft(Object.assign({},draft,{name:e.target.value}))}/></Form.Item>
          <Form.Item label={t('COD_COBIS')}><Input id="axx343-filter-cobis" value={draft.cobis} onChange={e => setDraft(Object.assign({},draft,{cobis:e.target.value}))}/></Form.Item>
        </Form>
      </Drawer>
      <Modal wrapClassName="axx343-dialog" title={editing ? t('Editar ocupación') : t('Nueva ocupación')} visible={open} width={560} maskClosable={false} onCancel={() => {if(!loading)setOpen(false);}} footer={<Space><Button disabled={loading} onClick={() => setOpen(false)}>{t('Cancelar')}</Button><Button type="primary" loading={loading} onClick={save}>{t('Guardar')}</Button></Space>}>
        <Form layout="vertical" onFinish={save}>
          {editing ? <Form.Item label={t('Id')}><Input id="axx343-id" value={text(editing.id)} readOnly/></Form.Item> : null}
          <Form.Item label={t('Nombre')} required validateStatus={!values.name.trim()?'error':''} help={!values.name.trim()?t('El nombre es obligatorio.'):null}><Input id="axx343-name" value={values.name} onChange={e => update('name',e.target.value)}/></Form.Item>
          <Form.Item label={t('Estatus')} required validateStatus={values.status!=='0'&&values.status!=='1'?'error':''} help={values.status!=='0'&&values.status!=='1'?t('Seleccione un estatus.'):null}><Select id="axx343-status" value={values.status} style={{width:'100%'}} onChange={v => update('status',v)}><Select.Option value="1">{t('Si')}</Select.Option><Select.Option value="0">{t('No')}</Select.Option></Select></Form.Item>
          <Form.Item label={t('Porcentaje')} validateStatus={percentageError?'error':''} help={percentageError||null}><Input id="axx343-percentage" inputMode="decimal" value={values.percentage} onChange={e => update('percentage',e.target.value)}/></Form.Item>
          <Form.Item label={t('Categoría')} validateStatus={categoryError?'error':''} help={categoryError||null}><Input id="axx343-category" inputMode="numeric" value={values.category} onChange={e => update('category',e.target.value)}/></Form.Item>
          <Form.Item label={t('COD_COBIS')}><Input id="axx343-cobis" value={values.cobis} onChange={e => update('cobis',e.target.value)}/></Form.Item>
        </Form>
      </Modal>
    </div>
  </DefaultPage>;
}
