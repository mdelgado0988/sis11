/**
 * @author Global Development Team
 * @email development@axxis-systems.com
 * @created 2026/09/08
 * @name SuretyActivityCatalog
 * @version 1.0
 * @purpose: Manage the surety activity catalog, including consultation, filtering, creation, and editing.
 */
function SuretyActivityCatalog() {
  const TABLE_ID = 1419;
  const TABLE_NAME = 'tbMaActivi';
  const VIEW_PATH = String(window.location.hash || window.location.pathname).replace(/^#/,'').split('?')[0];
  const HEADER = ['cmercado','cactividad','u_version','xactividad','pactividad','usuario','fRegistro','usuarioModifica','fModifica'];
  const h = React.createElement;
  const box = React.useRef(null);
  const busy = React.useRef(false);
  const generation = React.useRef(0);
  const [rows,setRows] = useState([]);
  const [user,setUser] = useState(null);
  const [rights,setRights] = useState({read:false,write:false,ready:false});
  const [loading,setLoading] = useState(true);
  const [loadError,setLoadError] = useState('');
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(10);
  const [filters,setFilters] = useState({id:'',name:''});
  const [draftFilters,setDraftFilters] = useState({id:'',name:''});
  const [drawer,setDrawer] = useState(false);
  const [filterError,setFilterError] = useState('');
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState({name:'',percent:'0',version:''});
  const [formError,setFormError] = useState('');
  const [saving,setSaving] = useState(false);
  const [wide,setWide] = useState(window.innerWidth>=1100);
  const [tableHeight,setTableHeight] = useState(360);
  function parseArray(value) {
    if(value===null || value===undefined || value==='') return [];
    const out=typeof value==='string'?JSON.parse(value):value;
    if(!Array.isArray(out)) throw new Error(t('No se pudieron interpretar los permisos.'));
    return out;
  }
  function permissions(current,actions) {
    const paths=parseArray(current.jPermissions);
    const deniedPath=paths.some(function(p){return typeof p==='string' && p && (p.indexOf(VIEW_PATH)>=0 || VIEW_PATH.indexOf(p)===0);});
    let denied=[];
    (current.Groups||[]).forEach(function(m){if(!m.Group)throw new Error(t('No se pudieron comprobar los permisos del grupo.'));denied=denied.concat(parseArray(m.Group.jActions));});
    function deniedCommand(cmd) {
      return actions.some(function(a){
        if(denied.indexOf(a.code)<0 || (a.cmd!==cmd && a.cmd!=='*'))return false;
        if(!a.data)return true;
        const match=String(a.data).match(/@\.?operation\s*==\s*['"](GET|ADD|UPDATE|DELETE)['"]/i);
        if(match)return match[1].toUpperCase()===(cmd==='AddOrUpdateTable'?'UPDATE':'GET');
        return true;
      });
    }
    const read=!!current.email && !current.blocked && !deniedPath && !deniedCommand('GetTables');
    return {read:read,write:read && !deniedCommand('AddOrUpdateTable') && !deniedCommand('DoQuery'),ready:true};
  }
  function checked(result,fallback) {
    if(!result || result.ok!==true)throw new Error((result && result.msg)||t(fallback));
    return result.outData;
  }
  function decode(entity) {
    if(!entity || Number(entity.id)!==TABLE_ID || entity.name!==TABLE_NAME)throw new Error(t('No se pudo verificar el origen del catálogo.'));
    const data=JSON.parse(entity.data);
    if(!Array.isArray(data) || JSON.stringify(data[0])!==JSON.stringify(HEADER))throw new Error(t('El catálogo no tiene el formato esperado.'));
    return data;
  }
  function mapRows(data) {
    return data.slice(1).map(function(row,index){return {key:String(row[1])+'-'+index,id:String(row[1]),version:row[2]==null?'':String(row[2]),name:String(row[3]||'').trim(),percent:row[4],createdBy:row[5],createdAt:row[6],modifiedBy:row[7],modifiedAt:row[8],raw:row.slice()};});
  }
  function fetchCatalog() {
    return exe('GetTables',{filter:'id='+TABLE_ID,size:1}).then(function(r){const data=checked(r,'No se pudo consultar el catálogo.');return decode(data && data[0]);});
  }
  function refresh() {
    const run=++generation.current;
    setLoading(true);setLoadError('');
    return fetchCatalog().then(function(data){if(run===generation.current)setRows(mapRows(data));}).catch(function(e){if(run===generation.current)setLoadError(e.message||t('No se pudo consultar el catálogo.'));}).then(function(){if(run===generation.current)setLoading(false);});
  }
  useEffect(function(){
    let mounted=true;
    Promise.all([exe('GetCurrentUser',{}),exe('RepoActionCatalog',{operation:'GET',size:1000})]).then(function(res){
      const current=checked(res[0],'No se pudo identificar al usuario.');
      const actions=checked(res[1],'No se pudieron comprobar los permisos.');
      const access=permissions(current,actions||[]);
      if(!mounted)return;
      setUser(current);setRights(access);
      if(!access.read){setLoadError(t('No tiene permiso para consultar este catálogo.'));setLoading(false);return;}
      return refresh();
    }).catch(function(e){if(mounted){setLoadError(e.message||t('No se pudieron comprobar los permisos.'));setRights({read:false,write:false,ready:true});setLoading(false);}});
    return function(){mounted=false;generation.current++;};
  },[]);
  useEffect(function(){
    let frame;
    function measure(){
      if(!box.current)return;
      const body=box.current.querySelector('.ant-table-body');
      const footer=box.current.querySelector('.ant-pagination');
      const bottom=Math.min(box.current.getBoundingClientRect().bottom,window.innerHeight-12);
      const top=body?body.getBoundingClientRect().top:box.current.getBoundingClientRect().top+100;
      setTableHeight(Math.max(120,bottom-top-(footer?footer.getBoundingClientRect().height:32)-40));
    }
    function resize(){setWide(window.innerWidth>=1100);window.cancelAnimationFrame(frame);frame=window.requestAnimationFrame(measure);}
    resize();window.addEventListener('resize',resize);
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
    if(observer && box.current)observer.observe(box.current);
    return function(){window.removeEventListener('resize',resize);window.cancelAnimationFrame(frame);if(observer)observer.disconnect();};
  },[wide,filters,loadError,rights.ready,rights.write]);
  function normalize(s){return String(s||'').toLocaleLowerCase();}
  const visible=rows.filter(function(r){return (filters.id==='' || Number(r.id)===Number(filters.id)) && (!filters.name.trim() || normalize(r.name).indexOf(normalize(filters.name.trim()))>=0);});
  const currentPage=Math.min(page,Math.max(1,Math.ceil(visible.length/pageSize)));
  function openNew(){if(!rights.write || busy.current)return;setEditing(null);setForm({name:'',percent:'0',version:''});setFormError('');setModal(true);}
  function openEdit(row){if(!rights.write || busy.current)return;setEditing(row);setForm({name:row.name,percent:String(row.percent),version:row.version});setFormError('');setModal(true);}
  function patchForm(key,value){setForm(function(prev){const next=Object.assign({},prev);next[key]=value;return next;});}
  function date(value){if(!value)return '—';const utc=moment.utc(String(value).replace(' ','T'));if(!utc.isValid())return String(value);return user && user.timezone && momentTimezone.tz.zone(user.timezone)?utc.tz(user.timezone).format('DD/MM/YYYY HH:mm:ss'):utc.local().format('DD/MM/YYYY HH:mm:ss');}
  function money(value){const n=Number(value);return Number.isFinite(n)?n.toFixed(2):String(value||'');}
  function save(){
    if(busy.current || !rights.write)return;
    const name=form.name.trim();
    if(!name){setFormError(t('El nombre de la actividad es obligatorio.'));return;}
    const raw=String(form.percent).trim().replace(',','.');
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw) || !Number.isFinite(Number(raw)) || Math.abs(Number(raw))*100>Number.MAX_SAFE_INTEGER){setFormError(t('Introduzca un porcentaje numérico válido dentro del rango admitido.'));return;}
    const percent=(Math.round((Number(raw)+Number.EPSILON)*100)/100).toFixed(2);
    busy.current=true;setSaving(true);setFormError('');
    let nextData;
    Promise.all([fetchCatalog(),exe('GetCurrentUser',{}),exe('RepoActionCatalog',{operation:'GET',size:1000}),exe('DoQuery',{sql:'SELECT SYSUTCDATETIME() AS utcNow'})]).then(function(results){
      const current=checked(results[1],'No se pudo identificar al usuario.');
      const actions=checked(results[2],'No se pudieron comprobar los permisos.');
      const access=permissions(current,actions||[]);setRights(access);
      if(!access.write)throw new Error(t('No tiene permiso para guardar este catálogo.'));
      const clock=checked(results[3],'No se pudo obtener la fecha de auditoría.');
      if(!clock || !clock[0] || !clock[0].utcNow)throw new Error(t('No se pudo obtener la fecha de auditoría.'));
      const timestamp=String(clock[0].utcNow).replace(/Z$/,'')+'Z';
      nextData=results[0].map(function(r){return r.slice();});
      let row;
      if(editing){
        const matches=[];for(let i=1;i<nextData.length;i++)if(String(nextData[i][1])===editing.id)matches.push(i);
        if(matches.length!==1)throw new Error(t('La actividad no existe o su identificador está duplicado. Actualice el listado.'));
        const index=matches[0];
        if(JSON.stringify(nextData[index])!==JSON.stringify(editing.raw))throw new Error(t('La actividad cambió desde que se abrió. Cancele y vuelva a editarla.'));
        row=nextData[index].slice();row[0]=row[1];row[2]=form.version;row[3]=name;row[4]=percent;row[7]=current.email;row[8]=timestamp;nextData[index]=row;
      }else{
        let max=0;const used={};for(let i=1;i<nextData.length;i++){const id=Number(nextData[i][1]);if(!Number.isSafeInteger(id) || id<0 || used[String(id)])throw new Error(t('El catálogo tiene identificadores inválidos o duplicados.'));used[String(id)]=true;max=Math.max(max,id);}
        if(!Number.isSafeInteger(max+1))throw new Error(t('No se pudo generar el identificador.'));
        row=[String(max+1),String(max+1),form.version,name,percent,current.email,timestamp,'',''];nextData.push(row);
      }
      return exe('AddOrUpdateTable',{id:TABLE_ID,name:TABLE_NAME,data:JSON.stringify(nextData)},{operation:'UPDATE'});
    }).then(function(r){
      checked(r,'No se pudo guardar la actividad.');
      setRows(mapRows(nextData));setModal(false);setEditing(null);
      A.message.success(t('Actividad guardada correctamente.'));
      return refresh();
    }).catch(function(e){setFormError(e.message||t('No se pudo guardar. Compruebe la conexión y vuelva a intentarlo.'));}).then(function(){busy.current=false;setSaving(false);});
  }
  function applyFilters(){
    const id=draftFilters.id.trim();
    if(id && (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)))){setFilterError(t('El Id debe ser un entero no negativo.'));return;}
    setFilters({id:id,name:draftFilters.name});setPage(1);setDrawer(false);setFilterError('');
  }
  function clearFilters(){setFilters({id:'',name:''});setDraftFilters({id:'',name:''});setPage(1);setFilterError('');setDrawer(false);}
  const columns=[
    {title:t('Id'),dataIndex:'id',width:wide?65:45},
    {title:t('Nombre'),dataIndex:'name',ellipsis:false,render:function(value){return h('span',{style:{overflowWrap:'anywhere'}},value);}},
    {title:t('Porcentaje'),dataIndex:'percent',width:wide?100:85,align:'right',render:money}
  ];
  if(wide)columns.push({title:t('Versión'),dataIndex:'version',width:70},{title:t('Creado por'),dataIndex:'createdBy',width:145,ellipsis:true},{title:t('Fecha de creación'),dataIndex:'createdAt',width:150,render:date},{title:t('Modificado por'),dataIndex:'modifiedBy',width:145,ellipsis:true},{title:t('Fecha de modificación'),dataIndex:'modifiedAt',width:150,render:date});
  if(rights.write)columns.push({title:wide?t('Acciones'):t('Editar'),key:'actions',width:wide?90:64,render:function(_,row){return h(A.Button,{type:'link',size:'small',disabled:saving,onClick:function(){openEdit(row);},'aria-label':t('Editar')+' '+row.id},t('Editar'));}});
  const details=function(row){return h(A.Descriptions,{size:'small',column:1},h(A.Descriptions.Item,{label:t('Versión')},row.version||'—'),h(A.Descriptions.Item,{label:t('Creado por')},row.createdBy||'—'),h(A.Descriptions.Item,{label:t('Fecha de creación')},date(row.createdAt)),h(A.Descriptions.Item,{label:t('Modificado por')},row.modifiedBy||'—'),h(A.Descriptions.Item,{label:t('Fecha de modificación')},date(row.modifiedAt)));};
  return h('section',{ref:box,'data-testid':'surety-activities',style:{height:'calc(100vh - 140px)',minHeight:360,display:'flex',flexDirection:'column',minWidth:0,background:'#fff',padding:12,borderRadius:6}},
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:12}},
      h('h2',{style:{margin:0,fontSize:20}},t('Actividades (Fianzas)')),
      h(A.Space,{wrap:true},h(A.Button,{disabled:!rights.read || saving,onClick:function(){setDraftFilters(filters);setFilterError('');setDrawer(true);}},t('Filtrar')),h(A.Button,{disabled:!rights.read || loading || saving,onClick:refresh},t('Actualizar')),rights.write?h(A.Button,{type:'primary',disabled:loading || saving,onClick:openNew},t('Nuevo')):null)),
    loadError?h(A.Alert,{type:'error',showIcon:true,message:loadError,style:{marginBottom:12}}):null,
    rights.ready && rights.read && !rights.write?h(A.Alert,{type:'info',message:t('Consulta: no dispone de permiso para guardar cambios.'),style:{marginBottom:12}}):null,
    rights.read && (filters.id!=='' || filters.name.trim())?h('div',{style:{marginBottom:8}},h(A.Tag,null,t('Id')+': '+(filters.id||'—')),h(A.Tag,null,t('Nombre')+': '+(filters.name||'—')),h(A.Button,{type:'link',size:'small',onClick:clearFilters},t('Limpiar filtros'))):null,
    h('div',{style:{flex:1,minHeight:0,minWidth:0}},h(A.Table,{columns:columns,dataSource:rights.read?visible:[],rowKey:'key',loading:loading,size:'small',tableLayout:'fixed',scroll:{y:tableHeight},pagination:{current:currentPage,pageSize:pageSize,total:visible.length,showSizeChanger:true,pageSizeOptions:['10','20','50'],showTotal:function(total){return total+' '+t('actividades');},onChange:function(p,s){setPage(p);setPageSize(s);}},locale:{emptyText:t('No se encontraron actividades.')},expandable:wide?undefined:{expandedRowRender:details,columnWidth:28}})),
    h(A.Drawer,{title:t('Filtrar actividades'),visible:drawer,onClose:function(){setDrawer(false);},width:'min(400px, 100vw)',destroyOnClose:true,footer:h(A.Space,null,h(A.Button,{onClick:clearFilters},t('Limpiar')),h(A.Button,{type:'primary',onClick:applyFilters},t('Aplicar')))},
      filterError?h(A.Alert,{type:'error',message:filterError,style:{marginBottom:12}}):null,
      h('label',{htmlFor:'axx339-filter-id'},t('Id')),h(A.Input,{id:'axx339-filter-id',value:draftFilters.id,inputMode:'numeric',onChange:function(e){setDraftFilters(Object.assign({},draftFilters,{id:e.target.value}));},style:{marginBottom:16}}),
      h('label',{htmlFor:'axx339-filter-name'},t('Nombre')),h(A.Input,{id:'axx339-filter-name',value:draftFilters.name,onChange:function(e){setDraftFilters(Object.assign({},draftFilters,{name:e.target.value}));},onPressEnter:applyFilters})),
    h(A.Modal,{title:editing?t('Editar actividad')+' '+editing.id:t('Nueva actividad'),visible:modal,width:560,destroyOnClose:true,maskClosable:!saving,closable:!saving,keyboard:!saving,onCancel:function(){if(!busy.current)setModal(false);},footer:h(A.Space,null,h(A.Button,{disabled:saving,onClick:function(){setModal(false);}},t('Cancelar')),h(A.Button,{type:'primary',loading:saving,disabled:!rights.write,onClick:save},t('Guardar')))},
      formError?h(A.Alert,{type:'error',showIcon:true,message:formError,style:{marginBottom:16}}):null,
      editing?h('div',{style:{marginBottom:12}},h('label',{htmlFor:'axx339-id'},t('Id')),h(A.Input,{id:'axx339-id',value:editing.id,disabled:true})):null,
      h('div',{style:{marginBottom:16}},h('label',{htmlFor:'axx339-name'},t('Nombre')+' *'),h(A.Input,{id:'axx339-name',value:form.name,disabled:saving,autoFocus:true,onChange:function(e){patchForm('name',e.target.value);}})),
      h('div',{style:{marginBottom:16}},h('label',{htmlFor:'axx339-percent'},t('Porcentaje')),h(A.Input,{id:'axx339-percent',inputMode:'decimal',value:form.percent,disabled:saving,onChange:function(e){patchForm('percent',e.target.value);}})),
      h('div',null,h('label',{htmlFor:'axx339-version'},t('Versión')),h(A.Input,{id:'axx339-version',value:form.version,disabled:saving,onChange:function(e){patchForm('version',e.target.value);}}))
    )
  );
}
