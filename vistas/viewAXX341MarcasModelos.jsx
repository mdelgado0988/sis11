/**
 * @author Global Development Team
 * @created 2026/09/08
 * @name viewAXX341MarcasModelos
 * @version 1.0
 * @purpose: Manage the consultation, filtering, creation, editing, and export of vehicle brands and models.
 */
() => {
 const {useState,useEffect,useRef}=React;
 const {Tabs,Table,Button,Drawer,Modal,Input,Select,Checkbox,Space,Alert,Typography,message}=A;
 const ActionIcon=({label,children})=><span role="img" aria-label={label} className="anticon axx341-action-icon"><svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">{children}</svg></span>;
 const SearchIcon=()=> <ActionIcon label="search"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-166.8-135.2-302-302-302S108 245.2 108 412s135.2 302 302 302c67 0 130.6-21.8 182.8-62l259.7 259.7a8 8 0 0 0 11.3 0l45.8-45.7a8 8 0 0 0 0-11.5zM410 634c-122.6 0-222-99.4-222-222s99.4-222 222-222 222 99.4 222 222-99.4 222-222 222z"/></ActionIcon>;
 const PlusIcon=()=> <ActionIcon label="new"><path d="M480 160h64v320h320v64H544v320h-64V544H160v-64h320V160z"/></ActionIcon>;
 const ExportIcon=()=> <ActionIcon label="export"><path d="M472 128h80v384h128L512 704 344 512h128V128zM160 800h704v80H160z"/></ActionIcon>;
 const [tab,setTab]=useState('brands'),[brand,setBrand]=useState(null);
 const [rows,setRows]=useState([]),[lobs,setLobs]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const empty={text:'',lob:'',active:false};
 const [filters,setFilters]=useState({brands:{...empty},models:{...empty}}),[draft,setDraft]=useState({...empty}),[drawer,setDrawer]=useState(false);
 const [edit,setEdit]=useState(null),[values,setValues]=useState([]),[modal,setModal]=useState(false),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState('');
 const [height,setHeight]=useState(500),[bodyHeight,setBodyHeight]=useState(280);
 const root=useRef(null),sequence=useRef(0),xlsxLibraryPromiseRef=useRef(null);
 const key=(r,k=tab)=>JSON.stringify(r.slice(0,k==='brands'?2:3).map(String));
 const api=(request)=>exe('ExeChain',{chain:'cmdAXX341MarcasModelos',context:JSON.stringify({request})}).then(r=>{if(!r.ok)throw new Error(r.msg||t('No se pudo completar la operación'));if(!r.outData||!r.outData.ok)throw new Error(r.outData&&r.outData.msg||t('No se pudo completar la operación'));return r.outData;});
 const load=(which=tab,filter=filters[which],selected=brand)=>{
  const ticket=++sequence.current;
  setRows([]);setError('');
  if(which==='models'&&!selected){setLoading(false);return Promise.resolve();}
  setLoading(true);
  return api({action:'list',kind:which,filter,brand:selected?selected.slice(0,2):null}).then(data=>{
   if(ticket!==sequence.current)return;
   setRows(data.rows);setLobs(data.lobs);
   if(which==='brands'&&selected){const retained=data.rows.find(r=>key(r,'brands')===key(selected,'brands'));setBrand(retained||null);}
  }).catch(e=>{if(ticket===sequence.current)setError(String(e.message||e));}).finally(()=>{if(ticket===sequence.current)setLoading(false);});
 };
 useEffect(()=>{load();return () => {sequence.current++;};},[]);
 useEffect(()=>{
  const measure=()=>{
   if(!root.current)return;
   const element=root.current;let parent=element.parentElement;
   while(parent&&parent!==document.body&&!/auto|scroll/.test(getComputedStyle(parent).overflowY))parent=parent.parentElement;
   const rect=element.getBoundingClientRect();
   const bound=parent&&parent!==document.body?parent.getBoundingClientRect():{top:0,bottom:window.innerHeight};
   const offset=rect.top-bound.top+(parent&&parent!==document.body?parent.scrollTop:0);
   const h=Math.max(180,Math.min(window.innerHeight,bound.bottom)-bound.top-offset-16);
   setHeight(h);
   const pane=element.querySelector('.ant-tabs-tabpane-active');
   const body=pane&&pane.querySelector('.ant-table-body');
   const pagination=pane&&pane.querySelector('.ant-pagination');
   if(body)setBodyHeight(Math.max(80,h-(body.getBoundingClientRect().top-rect.top)-(pagination?pagination.getBoundingClientRect().height:32)-32));
  };
  const timeout=setTimeout(measure,50),later=setTimeout(measure,250);
  window.addEventListener('resize',measure);
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
  if(observer&&root.current&&root.current.parentElement)observer.observe(root.current.parentElement);
  return () => {clearTimeout(timeout);clearTimeout(later);window.removeEventListener('resize',measure);if(observer)observer.disconnect();};
 },[tab,rows.length,error]);
 const switchTab=(k)=>{if(k==='models'&&!brand)return;setTab(k);setDrawer(false);setModal(false);load(k,filters[k],brand);};
 const choose=(r)=>{if(!brand||key(r,'brands')!==key(brand,'brands'))setFilters(f=>({...f,models:{...empty}}));setBrand(r);};
 const openModal=(row)=>{setEdit(row||null);setValues(row?row.map(String):tab==='brands'?['','','','1','0']:[String(brand[0]),String(brand[1]),'','','1','0']);setSaveError('');setModal(true);};
 const save=()=>{
  const row=values.slice();
  if(tab==='brands'&&String(row[0]==null?'':row[0]).trim()===''){
   setSaveError(t('Seleccione un ramo antes de guardar la marca'));return;
  }
  if(String(row[1]==null?'':row[1]).trim()===''){
   setSaveError(t('Ingrese el código antes de guardar el registro'));return;
  }
  if(tab==='brands'&&String(row[4]==null?'':row[4]).trim()==='')row[4]=0;
  const integerIndexes=tab==='brands'?[0,1,4]:[0,1,2,5];
  const invalidInteger=integerIndexes.some(index=>{
   const value=String(row[index]==null?'':row[index]).trim();
   if(value==='')return false;
   if(!/^\d+$/.test(value))return true;
   row[index]=Number(value);
   return false;
  });
  if(invalidInteger){setSaveError(t('Los códigos y el ranking deben ser enteros no negativos'));return;}
  setSaving(true);setSaveError('');
  api({action:'save',kind:tab,brand:brand?brand.slice(0,2):null,row,original:edit}).then(()=>{setModal(false);message.success(t('Registro guardado'));return load();}).catch(e=>setSaveError(String(e.message||e))).finally(()=>setSaving(false));
 };
 const labels=tab==='brands'?['Ramo','Código de marca','Marca','Vigente','Ranking']:['Ramo','Marca','Código de modelo','Modelo','Vigente','Categoría (código)'];
 const display=(row,i)=>{
  if(i===0){const l=lobs.find(x=>String(x.code)===String(row[0]));return l&&l.name?l.name+' ('+row[0]+')':String(row[0]);}
  if(tab==='models'&&i===1)return String(brand&&brand[2]||'')+' ('+row[1]+')';
  if(i===(tab==='brands'?3:4))return t(String(row[i])==='1'?'Si':'No');
  return String(row[i]==null?'':row[i]);
 };
 const isUsableXlsxLibrary=(xlsxLibrary)=>Boolean(xlsxLibrary
  && typeof xlsxLibrary.writeFile==='function'
  && xlsxLibrary.utils
  && typeof xlsxLibrary.utils.aoa_to_sheet==='function'
  && typeof xlsxLibrary.utils.book_new==='function'
  && typeof xlsxLibrary.utils.book_append_sheet==='function');
 const availableXlsxLibrary=()=>{
  const runtimeLibraries=typeof libs!=='undefined'&&libs?libs:{};
  const globalLibrary=typeof XLSX!=='undefined'?XLSX:(typeof window!=='undefined'?window.XLSX:null);
  return [runtimeLibraries.XLSX,runtimeLibraries.xlsx,runtimeLibraries.xlsxJs,globalLibrary].find(isUsableXlsxLibrary)||null;
 };
 const ensureXlsxLibrary=()=>{
  const availableLibrary=availableXlsxLibrary();
  if(availableLibrary)return Promise.resolve(availableLibrary);
  if(xlsxLibraryPromiseRef.current)return xlsxLibraryPromiseRef.current;
  xlsxLibraryPromiseRef.current=exe('ExeChain',{chain:'cmdLoadLibrariesGroupedBordereau',context:'{}'}).then(response=>{
   if(!response||response.ok===false)throw new Error(response&&response.msg?response.msg:t('No se pudo cargar el componente de Excel.'));
   const loadedLibraries=response.outData||{};
   const loadedXlsx=loadedLibraries.XLSX||loadedLibraries.xlsx||loadedLibraries.xlsxJs;
   let evaluatedXlsx=null;
   if(typeof loadedXlsx==='string'){
    const evaluatedResult=eval(loadedXlsx);
    const evaluatedGlobal=typeof XLSX!=='undefined'?XLSX:null;
    evaluatedXlsx=isUsableXlsxLibrary(evaluatedGlobal)?evaluatedGlobal:evaluatedResult;
   }else if(loadedXlsx&&typeof window!=='undefined')window.XLSX=loadedXlsx;
   const hydratedLibrary=availableXlsxLibrary()||(loadedXlsx&&typeof loadedXlsx!=='string'?loadedXlsx:null)||evaluatedXlsx;
   if(!isUsableXlsxLibrary(hydratedLibrary))throw new Error(t('El componente de Excel no está disponible.'));
   if(typeof window!=='undefined'&&!window.XLSX)window.XLSX=hydratedLibrary;
   return hydratedLibrary;
  }).then(xlsxLibrary=>{xlsxLibraryPromiseRef.current=null;return xlsxLibrary;}).catch(error=>{xlsxLibraryPromiseRef.current=null;throw error;});
  return xlsxLibraryPromiseRef.current;
 };
 const exportAll=()=>{
  setLoading(true);
  Promise.all([api({action:'list',kind:tab,filter:filters[tab],brand:brand?brand.slice(0,2):null}),ensureXlsxLibrary()]).then(([data,xlsxLibrary])=>{
   const rows=[labels.map(label=>t(label))].concat(data.rows.map(r=>labels.map((_,i)=>display(r,i))));
   const worksheet=xlsxLibrary.utils.aoa_to_sheet(rows);
   const workbook=xlsxLibrary.utils.book_new();
   xlsxLibrary.utils.book_append_sheet(workbook,worksheet,tab==='brands'?t('Marcas'):t('Modelos'));
   xlsxLibrary.writeFile(workbook,(tab==='brands'?'Marcas':'Modelos')+'.xlsx',{bookType:'xlsx',compression:true});
  }).catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false));
 };
 if (/No tiene permisos|Unauthorized/i.test(error)) return <Alert type="error" message={t(error)} showIcon/>;
 const cols=labels.map((label,i)=>({title:t(label),key:String(i),width:i===(tab==='brands'?2:3)?240:160,render:(_,r)=>display(r,i)})).concat([{title:t('Acciones'),key:'actions',width:100,render:(_,r)=><Button type="link" onClick={()=>openModal(r)}>{t('Editar')}</Button>}]);
 const content=<div className="axx341-marcas-modelos-tab-content">
  <div className="axx341-marcas-modelos-toolbar">
   <Space wrap>
    <Button type="primary" onClick={()=>{setDraft({...filters[tab]});setDrawer(true);}} icon={<SearchIcon/>}>{t('Filtrar')}</Button>
    <Button type="primary" disabled={tab==='models'&&!brand} onClick={()=>openModal(null)} icon={<PlusIcon/>}>{t(tab==='brands'?'Nueva Marca':'Nuevo Modelo')}</Button>
    <Button className="axx341-export-button" disabled={!rows.length||loading} onClick={exportAll} icon={<ExportIcon/>}>{t('Exportar')}</Button>
    {tab==='models'&&brand&&<Typography.Text className="axx341-selected-brand">{t('Marca')+': '+brand[2]}</Typography.Text>}
   </Space>
  </div>
  {error&&<Alert type="error" message={t(error)} showIcon className="axx341-error"/>}
  <div className="axx341-marcas-modelos-grid">
   <Table className="axx341-marcas-modelos-table" size="small" loading={loading} columns={cols} dataSource={rows} rowKey={r=>key(r)} scroll={{x:labels.length*160+180,y:bodyHeight}} pagination={{pageSize:25,showSizeChanger:false}} locale={{emptyText:t('Sin resultados')}} rowSelection={tab==='brands'?{type:'radio',selectedRowKeys:brand?[key(brand,'brands')]:[],onSelect:choose}:undefined} onRow={r=>({onClick:()=>{if(tab==='brands')choose(r);}})}/>
  </div>
 </div>;
 return <div ref={root} className="axx341-marcas-modelos-view" style={{height}}>
  <style>{`
   .axx341-marcas-modelos-view{display:flex;flex-direction:column;min-height:0;box-sizing:border-box;overflow:hidden;padding:12px;background:#fff;color:#1f1f1f;font-size:13px;}
   .axx341-marcas-modelos-header{display:flex!important;align-items:center;justify-content:space-between;gap:16px;flex:0 0 auto;min-height:58px;margin-bottom:10px;padding:10px 14px;border:1px solid #cbd1d8;background:#fff;box-sizing:border-box;}
   .axx341-marcas-modelos-header-content{display:block;min-width:0;}
   .axx341-marcas-modelos-title{display:flex;align-items:center;gap:8px;color:#1f1f1f!important;font-size:16px;line-height:24px;font-weight:600;}
   .axx341-marcas-modelos-title-mark{width:8px;height:22px;border-radius:2px;background:#1677ff;flex:0 0 auto;}
   .axx341-marcas-modelos-kicker{margin-bottom:1px;color:#1677ff!important;font-size:12px;line-height:18px;font-weight:600;text-transform:uppercase;letter-spacing:.25px;}
   .axx341-marcas-modelos-purpose{margin:2px 0 0 16px;color:#595959!important;font-size:12px;line-height:18px;}
   .axx341-marcas-modelos-context{flex:0 0 auto;padding:4px 8px;border:1px solid #91caff;background:#e6f4ff;color:#174f7c;font-size:12px;line-height:18px;}
   .axx341-marcas-modelos-tabs{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;}
   .axx341-marcas-modelos-tabs>.ant-tabs-nav{flex:0 0 auto;margin:0;background:#e6f4ff;border-bottom:1px solid #91caff;}
   .axx341-marcas-modelos-tabs.ant-tabs-card>.ant-tabs-nav .ant-tabs-tab{height:30px;margin:0 2px 0 0!important;padding:0 11px;background:#f0f5ff;border:1px solid #91caff!important;border-radius:4px 4px 0 0!important;color:#245b9e;font-size:12px;font-weight:400;}
   .axx341-marcas-modelos-tabs.ant-tabs-card>.ant-tabs-nav .ant-tabs-tab:hover{background:#e6f4ff;color:#0b3f7d;}
   .axx341-marcas-modelos-tabs.ant-tabs-card>.ant-tabs-nav .ant-tabs-tab-active{background:#fff;border-bottom-color:#fff!important;}
   .axx341-marcas-modelos-tabs.ant-tabs-card>.ant-tabs-nav .ant-tabs-tab-active .ant-tabs-tab-btn{color:#0b3f7d;font-weight:600;}
   .axx341-marcas-modelos-tabs>.ant-tabs-content-holder{flex:1 1 auto;min-height:0;display:flex;}
   .axx341-marcas-modelos-tabs .ant-tabs-content,.axx341-marcas-modelos-tabs .ant-tabs-tabpane{min-height:0;display:flex;flex:1 1 auto;flex-direction:column;}
   .axx341-marcas-modelos-tab-content{min-height:0;display:flex;flex:1 1 auto;flex-direction:column;gap:8px;}
   .axx341-marcas-modelos-toolbar{display:flex;align-items:center;flex:0 0 auto;min-height:42px;margin:0;padding:4px 0;background:transparent;border:1px solid #e6ebf2;border-radius:6px;}
   .axx341-marcas-modelos-toolbar>.ant-space{margin-left:4px;margin-right:4px;}
   .axx341-marcas-modelos-toolbar .ant-btn{border-color:#8f9aa7;}
   .axx341-marcas-modelos-toolbar .ant-btn:disabled{border-color:#6f7b88;opacity:1;}
   .axx341-marcas-modelos-toolbar .axx341-export-button{background:#60b13d;border-color:#4f9336;color:#fff;}
   .axx341-marcas-modelos-toolbar .axx341-export-button:hover,.axx341-marcas-modelos-toolbar .axx341-export-button:focus{background:#4f9336;border-color:#3f7d2c;color:#fff;}
   .axx341-action-icon{font-size:14px;vertical-align:-.12em;}
   .axx341-selected-brand{padding-left:4px;color:#174f7c;}
   .axx341-error{flex:0 0 auto;margin:0;}
   .axx341-marcas-modelos-grid{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;overflow:hidden;}
   .axx341-marcas-modelos-grid .ant-table-wrapper,.axx341-marcas-modelos-grid .ant-spin-nested-loading,.axx341-marcas-modelos-grid .ant-spin-container,.axx341-marcas-modelos-grid .ant-table,.axx341-marcas-modelos-grid .ant-table-container{display:flex;flex:1 1 auto;min-height:0;height:100%;flex-direction:column;overflow:hidden;}
   .axx341-marcas-modelos-grid .ant-table-header{flex:0 0 auto;position:relative;z-index:2;height:auto!important;min-height:30px;overflow:hidden!important;background:#fafafa!important;}
   .axx341-marcas-modelos-table .ant-table-thead>tr{height:30px;}
   .axx341-marcas-modelos-grid .ant-table-body{flex:1 1 auto;min-height:0;max-height:none!important;overflow:auto!important;scrollbar-gutter:stable;}
   .axx341-marcas-modelos-table .ant-table-container{border:1px solid #cbd1d8;}
   .axx341-marcas-modelos-table .ant-table-thead>tr>th{height:30px;box-sizing:border-box;vertical-align:middle;background:#bfbfbf!important;border-right:1px solid #cbd1d8!important;border-bottom:1px solid #cbd1d8!important;padding:5px 8px!important;font-size:12px;line-height:18px;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr>td{border-right:0!important;border-bottom:1px solid #cbd1d8!important;padding:5px 8px!important;font-size:12px;line-height:18px;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr{height:29px;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr>td{height:29px;box-sizing:border-box;vertical-align:middle;}
   .axx341-marcas-modelos-table .ant-table-tbody .ant-btn-link{height:20px;min-height:20px;padding:0 4px;line-height:18px;}
   .axx341-marcas-modelos-table .ant-table-tbody .ant-radio-wrapper{line-height:18px;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr:hover>td{background:#b7d7ff!important;}
   .axx341-marcas-modelos-table .ant-table-tbody>tr.ant-table-row-selected>td{background:#86b4ff!important;}
   .axx341-marcas-modelos-table .ant-pagination{flex:0 0 auto;margin:8px 0 0!important;}
   .axx341-marcas-modelos-table .ant-table-row{cursor:pointer;}
   .axx341-marcas-modelos-view .ant-drawer-content,.axx341-marcas-modelos-view .ant-modal-content{border:1px solid #cbd1d8;}
   .axx341-marcas-modelos-view .ant-drawer-header,.axx341-marcas-modelos-view .ant-modal-header{background:#bfbfbf;border-bottom:1px solid #cbd1d8;}
   .axx341-marcas-modelos-view .ant-drawer-body,.axx341-marcas-modelos-view .ant-modal-body{font-size:13px;}
  `}</style>
  <div className="axx341-marcas-modelos-header">
   <div className="axx341-marcas-modelos-header-content"><div className="axx341-marcas-modelos-kicker">{t('Catálogos')}</div><div className="axx341-marcas-modelos-title"><span className="axx341-marcas-modelos-title-mark" aria-hidden="true" />{t('Marcas y modelos')}</div><div className="axx341-marcas-modelos-purpose">{t('Consulta, filtrado y administración del catálogo de marcas y modelos de vehículos.')}</div></div>
   <div className="axx341-marcas-modelos-context">{t(tab==='brands'?'Catálogo de marcas':'Catálogo de modelos')}</div>
  </div>
  <Tabs className="axx341-marcas-modelos-tabs" type="card" activeKey={tab} onChange={switchTab} destroyInactiveTabPane>
   <Tabs.TabPane tab={t('Marcas')} key="brands">{tab==='brands'&&content}</Tabs.TabPane>
   <Tabs.TabPane tab={t('Modelos')} key="models" disabled={!brand}>{tab==='models'&&content}</Tabs.TabPane>
  </Tabs>
  <Drawer className="axx341-marcas-modelos-drawer" title={t('Filtrar')} visible={drawer} onClose={()=>setDrawer(false)} width={Math.min(380,window.innerWidth)}>
   {tab==='brands'&&<div style={{marginBottom:16}}><label>{t('Ramo')}</label><Select allowClear showSearch optionFilterProp="children" style={{width:'100%'}} value={draft.lob||undefined} onChange={v=>setDraft({...draft,lob:v||''})}>{lobs.map(l=><Select.Option key={l.code} value={String(l.code)}>{l.name||l.code}</Select.Option>)}</Select></div>}
   <label>{t(tab==='brands'?'Marca':'Modelo')}</label><Input value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})}/>
   <Checkbox style={{margin:'16px 0'}} checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}>{t(tab==='brands'?'Vigentes':'Vigente')}</Checkbox>
   <Space wrap><Button type="primary" onClick={()=>{setFilters({...filters,[tab]:{...draft}});setDrawer(false);load(tab,draft,brand);}}>{t('Buscar')}</Button><Button onClick={()=>{setDraft({...empty});setFilters({...filters,[tab]:{...empty}});setDrawer(false);load(tab,empty,brand);}}>{t('Limpiar filtros')}</Button></Space>
  </Drawer>
  <Modal className="axx341-marcas-modelos-modal" title={t(edit?'Editar':tab==='brands'?'Nueva Marca':'Nuevo Modelo')} visible={modal} onCancel={()=>{if(!saving)setModal(false);}} onOk={save} confirmLoading={saving} okText={t('Guardar')} cancelText={t('Cancelar')} destroyOnClose>
   {saveError&&<Alert type="error" message={t(saveError)} showIcon style={{marginBottom:12}}/>}
   {labels.map((label,i)=>{
    const fixed=!!edit&&i<(tab==='brands'?2:3)||tab==='models'&&i<2;
    const change=v=>setValues(old=>old.map((x,j)=>j===i?v:x));
    return <div key={i} style={{marginBottom:14}}><label>{t(label)}</label>{i===(tab==='brands'?3:4)?<Select style={{width:'100%'}} value={values[i]} onChange={change}><Select.Option value="1">{t('Si')}</Select.Option><Select.Option value="0">{t('No')}</Select.Option></Select>:i===0?<Select style={{width:'100%'}} disabled={fixed} value={values[i]||undefined} onChange={change}>{lobs.map(l=><Select.Option key={l.code} value={String(l.code)}>{l.name||l.code}</Select.Option>)}</Select>:<Input disabled={fixed} value={tab==='models'&&i===1?String(brand&&brand[2]||'')+' ('+values[i]+')':values[i]||''} onChange={e=>change(e.target.value)}/>}</div>;
   })}
  </Modal>
 </div>;
}
