/**
 * @author Axxis Systems
 * @created 2026/09/08
 * @name viewAXX337ZonasCresta
 * @version 1.0
 * @purpose: Manage CRESTA zones and consult the provinces associated with each risk zone.
 */
() => {
 const {useState,useEffect,useRef}=React;
 const {Table,Button,Modal,Input,Alert,Typography}=A;
 const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[provinces,setProvinces]=useState([]);
 const [loading,setLoading]=useState(false),[provinceLoading,setProvinceLoading]=useState(false),[error,setError]=useState(''),[provinceError,setProvinceError]=useState('');
 const [modal,setModal]=useState(false),[original,setOriginal]=useState(null),[description,setDescription]=useState(''),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState('');
 const [height,setHeight]=useState(450),[scrollY,setScrollY]=useState(280);
 const root=useRef(null),body=useRef(null),sequence=useRef(0),mounted=useRef(true);
 // antd 4 no exporta Icon: el ambiente dibuja los iconos como SVG en linea.
 const svg=d=><span role="img" className="anticon"><svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d={d}/></svg></span>;
 const IcoActualizar=()=>svg('M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z');
 const service=request=>exe('ExeChain',{chain:'cmdAXX337ZonasCresta',context:JSON.stringify({request})}).then(r=>{
  if(!r.ok)throw new Error(r.msg||'No se pudo completar la operación');
  if(!r.outData||!r.outData.ok)throw new Error(r.outData&&r.outData.msg||'No se pudo completar la operación');
  return r.outData;
 });
 const load=()=>{
  setLoading(true);setError('');
  return service({action:'list'}).then(r=>{if(mounted.current)setRows(r.rows);return r.rows;}).catch(e=>{if(mounted.current)setError(String(e.message||e));throw e;}).finally(()=>{if(mounted.current)setLoading(false);});
 };
 const select=row=>{
  const ticket=++sequence.current;setSelected(row);setProvinces([]);setProvinceError('');setProvinceLoading(false);
  if(!row)return;
  const code=String(row[0]);
  if(!/^[1-9][0-9]*$/.test(code)||!Number.isSafeInteger(Number(code))){setProvinceError('Código CRESTA inválido');return;}
  setProvinceLoading(true);
  exe('RepoStateCatalog',{operation:'GET',filter:"[countryCode]='591' AND [riskZone]='"+code+"'",size:0}).then(r=>{
   if(!mounted.current||ticket!==sequence.current)return;
   if(!r.ok)throw new Error(r.msg||'No se pudieron consultar las provincias');
   setProvinces(r.outData||[]);
  }).catch(e=>{if(mounted.current&&ticket===sequence.current){setProvinces([]);setProvinceError(String(e.message||e));}}).finally(()=>{if(mounted.current&&ticket===sequence.current)setProvinceLoading(false);});
 };
 useEffect(()=>{
  mounted.current=true;load().catch(()=>{});
  return ()=>{mounted.current=false;sequence.current++;};
 },[]);
 useEffect(()=>{
  // El alto se MIDE contra el ancestro que desplaza; lo que no es cuerpo de la grilla
  // (titulo del panel, encabezado de la tabla, bordes) tambien se mide, no se estima.
  const measure=()=>{
   if(!root.current)return;
   let container=root.current.parentElement;
   while(container&&container!==document.body&&!/(auto|scroll)/.test(getComputedStyle(container).overflowY))container=container.parentElement;
   const rect=root.current.getBoundingClientRect();
   const limit=container&&container!==document.body?container.getBoundingClientRect().bottom:window.innerHeight;
   setHeight(Math.max(200,Math.floor(limit-rect.top-12)));
   if(body.current){
    const panel=body.current.querySelector('.axx337-panel');
    if(panel){
     const panelTitle=panel.querySelector('.axx337-panel-title');
     const tableHeader=panel.querySelector('.ant-table-thead');
     const available=panel.clientHeight-(panelTitle?panelTitle.getBoundingClientRect().height:0)-(tableHeader?tableHeader.getBoundingClientRect().height:0)-2;
     setScrollY(Math.max(90,Math.floor(available)));
    }
   }
  };
  measure();const timer=setTimeout(measure,120);
  window.addEventListener('resize',measure);
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
  if(observer){observer.observe(root.current);if(body.current)observer.observe(body.current);}
  return () => {clearTimeout(timer);window.removeEventListener('resize',measure);if(observer)observer.disconnect();};
 },[]);
 const open=row=>{setOriginal(row?row.slice():null);setDescription(row?row[1]:'');setSaveError('');setModal(true);};
 const save=()=>{
  if(saving)return;
  if(!description.trim()){setSaveError('El nombre de la zona es obligatorio');return;}
  if(description.trim().length>200){setSaveError('El nombre admite hasta 200 caracteres');return;}
  setSaving(true);setSaveError('');
  const attempt=number=>service({action:'save',description:description,original:original}).catch(e=>{
   if(/otro guardado en curso/.test(e.message||'')&&number<11)return new Promise(resolve=>setTimeout(resolve,150+number*40)).then(()=>attempt(number+1));
   throw e;
  });
  attempt(0).then(result=>{
   setModal(false);select(result.row);
   return load().catch(()=>setError('La zona se guardó. No se pudo actualizar la lista; pulse Reintentar.'));
  }).catch(e=>setSaveError(String(e.message||e))).finally(()=>setSaving(false));
 };
 const zoneColumns=[
  {title:t('Código'),dataIndex:0,key:'cod',width:85},
  {title:t('Nombre de la zona'),dataIndex:1,key:'description',width:280},
  {title:t('Acciones'),key:'actions',width:90,render:(value,row)=><Button type="link" size="small" onClick={event=>{event.stopPropagation();open(row);}}>{t('Editar')}</Button>}
 ];
 const provinceColumns=[
  {title:t('Código'),dataIndex:'code',key:'code',width:100},
  {title:t('Provincia'),dataIndex:'name',key:'name',width:300}
 ];
 // Estandar visual del ambiente, acotado a la clase raiz de esta vista para no alterar
 // antd en el resto de la SPA. Las reglas que pisan estilos de antd necesitan !important.
 const css='\
.axx337-view{display:flex;flex-direction:column;min-width:0;overflow:hidden;font-size:13px;}\
.axx337-view .axx337-topbar{display:flex;align-items:center;gap:8px;background:transparent;border:1px solid #e6ebf2;border-radius:6px;padding:4px 0;margin:0 4px 2px 4px;flex-shrink:0;}\
.axx337-view .axx337-topbar>*{margin-left:4px;}\
.axx337-view .axx337-topbar>*:last-child{margin-right:4px;}\
.axx337-view .axx337-alerta{margin:0 4px 2px 4px;}\
.axx337-view .axx337-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;flex:1 1 auto;min-height:0;min-width:0;overflow:hidden;margin:0 4px;}\
.axx337-view .axx337-panel{display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;background:#fff;border:1px solid #cbd1d8;}\
.axx337-view .axx337-panel-title{margin:0;padding:5px 8px;background:#f2f5f8;font-size:13px;line-height:18px;font-weight:600;border-bottom:1px solid #cbd1d8;flex-shrink:0;}\
.axx337-view .axx337-panel .ant-table-wrapper{flex:1 1 auto;min-height:0;min-width:0;}\
.axx337-view .ant-table-body{min-height:'+scrollY+'px;}\
.axx337-view .ant-table-thead>tr>th{background:#bfbfbf !important;color:#262626;border-right:1px solid #cbd1d8 !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;}\
.axx337-view .ant-table-thead>tr>th:last-child{border-right:none !important;}\
.axx337-view .ant-table-thead>tr>th::before{display:none !important;}\
.axx337-view .ant-table-tbody>tr>td{border-right:none !important;border-bottom:1px solid #cbd1d8 !important;font-size:12px;line-height:18px;padding:5px 8px !important;}\
.axx337-view .axx337-panel-zonas .ant-table-tbody>tr.ant-table-row{cursor:pointer;}\
.axx337-view .ant-table-tbody>tr.ant-table-row:hover>td{background:#b7d7ff !important;}\
.axx337-view .ant-table-tbody>tr.ant-table-row-selected>td,.axx337-view .ant-table-tbody>tr.axx337-selected>td{background:#86b4ff !important;}\
.axx337-view .ant-table-tbody>tr.ant-table-row-selected:hover>td,.axx337-view .ant-table-tbody>tr.axx337-selected:hover>td{background:#86b4ff !important;}\
.axx337-view .ant-table-tbody>tr.ant-table-placeholder:hover>td{background:#fff !important;}\
.axx337-view .axx337-btn-sec{border-color:#8f9aa7 !important;}\
.axx337-view .ant-btn[disabled],.axx337-modal .ant-btn[disabled]{border-color:#6f7b88 !important;opacity:1 !important;}\
.axx337-modal .ant-modal-body{font-size:13px;}\
.axx337-modal .ant-modal-footer .ant-btn-default{border-color:#8f9aa7 !important;}';
 return <div ref={root} className="axx337-view" style={{height:height}}>
  <style>{css}</style>
  <div className="axx337-topbar">
   <Typography.Title level={4} style={{marginTop:0,marginBottom:0,flex:1}}>{t('Zonas crestas')}</Typography.Title>
   <Button type="primary" onClick={()=>open(null)} disabled={loading}>{t('Nuevo')}</Button>
  </div>
  {error&&<Alert className="axx337-alerta" type="error" showIcon message={t(error)} action={<Button className="axx337-btn-sec" icon={<IcoActualizar/>} onClick={()=>load().catch(()=>{})}>{t('Reintentar')}</Button>}/>}
  <div ref={body} className="axx337-body">
   <section className="axx337-panel axx337-panel-zonas" aria-label={t('Zonas CRESTA')}>
    <div className="axx337-panel-title">{t('Zonas CRESTA')}</div>
    <Table size="small" columns={zoneColumns} dataSource={rows} loading={loading} pagination={false} rowKey={row=>String(row[0])} scroll={{x:455,y:scrollY}} rowClassName={row=>selected&&String(selected[0])===String(row[0])?'axx337-selected':''} onRow={row=>({onClick:()=>select(row)})} locale={{emptyText:t('No hay zonas registradas')}}/>
   </section>
   <section className="axx337-panel axx337-panel-provincias" aria-label={t('Provincias asociadas')}>
    <div className="axx337-panel-title">{t('Provincias asociadas')}{selected?' — '+selected[1]:''}</div>
    {provinceError?<Alert className="axx337-alerta" type="error" showIcon message={t(provinceError)} action={<Button className="axx337-btn-sec" size="small" icon={<IcoActualizar/>} onClick={()=>select(selected)}>{t('Reintentar')}</Button>}/>:<Table size="small" columns={provinceColumns} dataSource={provinces} loading={provinceLoading} pagination={false} rowKey={row=>String(row.id)} scroll={{x:400,y:scrollY}} locale={{emptyText:t(selected?'No hay provincias asociadas a esta zona':'Seleccione una zona CRESTA')}}/>}
   </section>
  </div>
  <Modal wrapClassName="axx337-modal" title={t(original?'Editar zona CRESTA':'Nueva zona CRESTA')} visible={modal} onCancel={()=>{if(!saving)setModal(false);}} onOk={save} confirmLoading={saving} okText={t('Guardar')} cancelText={t('Cancelar')} destroyOnClose>
   {saveError&&<Alert type="error" showIcon message={t(saveError)} style={{marginBottom:12}}/>}
   <label htmlFor="axx337-code">{t('Código')}</label>
   <Input id="axx337-code" disabled value={original?original[0]:''} placeholder={t('Automático')} style={{marginBottom:14}}/>
   <label htmlFor="axx337-description">{t('Nombre de la zona')} *</label>
   <Input id="axx337-description" value={description} onChange={event=>setDescription(event.target.value)} onPressEnter={save} disabled={saving} autoFocus aria-required="true"/>
  </Modal>
 </div>;
}
