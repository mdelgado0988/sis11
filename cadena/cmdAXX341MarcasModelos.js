//block
//noreplace
/**
 * @author Equipo Global
 * @created 2026-09-13
 * @name cmdAXX341MarcasModelos
 * @version 1.1.0
 * @summary Consulta y mantenimiento de los catálogos de marcas y modelos.
 */
(() => {
const arg = context.request || {};
const failure = function(msg){return {ok:false,msg:msg};};
const call = function(cmd,data){ const result=doCmd({cmd:cmd,data:data}); if(!result || !result.ok) throw new Error(result && result.msg || 'No se pudo completar la operación'); return result.outData; };
const kind = arg.kind === 'models' ? 'models' : 'brands';
const ids={brands:null,models:null};
const names={brands:'tbMarcas',models:'tbModelos'};
const headers={brands:['cramo','cmarca','xmarca','iestado','qranking'],models:['cramo','cmarca','cmodelo','xmodelo','iestado','ccategoria']};
const key=function(row,which){return JSON.stringify(row.slice(0,which==='brands'?2:3).map(String));};
const read=function(which){ const result=call('DoQuery',{sql:"SELECT id,data FROM [Table] WHERE name='"+names[which]+"'"}); const raw=result&&result[0]!==undefined?result[0]:result; const catalog=typeof raw==='string'?JSON.parse(raw):raw; if(!catalog) throw new Error('No se encontró el catálogo '+names[which]); ids[which]=catalog.id??catalog.Id??catalog.ID; if(ids[which]===null||ids[which]===undefined) throw new Error('El catálogo '+names[which]+' no tiene un identificador válido'); const data=typeof catalog.data==='string'?JSON.parse(catalog.data):catalog.data; if(JSON.stringify(data[0])!==JSON.stringify(headers[which])) throw new Error('Cambió la estructura del catálogo; revise la configuración'); return data; };
let result;
try {
 if(['list','save'].indexOf(arg.action)<0) return failure('Operación no permitida; utilice la baja lógica');
 if(kind==='models' && (!Array.isArray(arg.brand) || arg.brand.length!==2)) return failure('Seleccione una marca');
 const brands=read('brands');
 const models=kind==='models'?read('models'):null;
 const brand=kind==='models'?brands.slice(1).find(function(row){return key(row,'brands')===JSON.stringify(arg.brand.map(String));}):null;
 if(kind==='models' && !brand) throw new Error('La marca seleccionada ya no existe');
 const table=kind==='brands'?brands:models;
 const rows=table.slice(1);
 if(arg.action==='list') {
  const lob=call('RepoLob',{operation:'GET',size:0});
  const f=arg.filter||{};
  const filtered=rows.filter(function(row){return (kind!=='models'||key(row,'brands')===key(brand,'brands')) && (!f.lob||String(row[0])===String(f.lob)) && (!f.text||String(row[kind==='brands'?2:3]).toLocaleLowerCase().indexOf(String(f.text).toLocaleLowerCase())>=0) && (!f.active||String(row[kind==='brands'?3:4])==='1');});
  return {ok:true,rows:filtered,header:headers[kind],lobs:lob.map(function(x){return {code:x.code,name:x.name};}),brand:brand,total:filtered.length};
 }
 const row=arg.row;
 if(!Array.isArray(row)||row.length!==headers[kind].length) throw new Error('Complete todos los campos del registro');
 const next=row.map(function(v){return v==null?'':String(v).trim();});
 const nameIndex=kind==='brands'?2:3;
 const stateIndex=kind==='brands'?3:4;
 const codeIndices=kind==='brands'?[0,1,4]:[0,1,2,5];
 if(!next[nameIndex]) throw new Error('El nombre es obligatorio');
 if(next[nameIndex].length>200) throw new Error('El nombre admite hasta 200 caracteres');
 if(['0','1'].indexOf(next[stateIndex])<0) throw new Error('Vigente sólo admite Si o No');
 if(codeIndices.some(function(i){return !/^\d+$/.test(next[i]);})) throw new Error('Los códigos y el ranking deben ser enteros no negativos');
 const lobs=call('RepoLob',{operation:'GET',size:0});
 if(!lobs.some(function(l){return String(l.code)===next[0];})) throw new Error('Seleccione un ramo válido');
 if(kind==='models' && key(next,'brands')!==key(brand,'brands')) throw new Error('La marca del modelo no coincide con la marca seleccionada');
 const existing=rows.findIndex(function(r){return key(r,kind)===key(next,kind);});
 if(arg.original==null) {
  if(existing>=0) throw new Error('El código ya existe en este catálogo');
  rows.push(next);
 } else {
  if(!Array.isArray(arg.original)||key(arg.original,kind)!==key(next,kind)) throw new Error('No se permite cambiar los identificadores ni la marca');
  if(existing<0||JSON.stringify(rows[existing])!==JSON.stringify(arg.original)) throw new Error('El registro cambió desde que abrió la edición. Cierre y vuelva a cargar antes de guardar');
  rows[existing]=next;
 }
 call('AddOrUpdateTable',{id:ids[kind],name:names[kind],data:JSON.stringify([headers[kind]].concat(rows))});
 result={ok:true,row:next,msg:'Registro guardado'};
} catch(e) {result=failure(String(e.message||e));}
return result;
})()
