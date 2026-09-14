//block
//noreplace
/**
 * @author Equipo Global
 * @created 2026-09-13
 * @name cmdAXX337ZonasCresta
 * @version 1.1.0
 * @summary Consulta y mantenimiento del catálogo de zonas CRESTA.
 */
(() => {
const request = context.request || {};
let tableId = null;
const tableName = 'ZonaCresta';
const fail = msg => ({ok:false,msg:msg});
const call = (cmd,data) => { const r=doCmd({cmd:cmd,data:data}); if(!r || !r.ok) throw new Error(r && r.msg || 'No se pudo completar la operación'); return r.outData; };
try {
 if (['list','save'].indexOf(request.action)<0) return fail('Operación no permitida. No se permite eliminar zonas CRESTA.');
 const result=call('DoQuery',{sql:"SELECT id,data FROM [Table] WHERE name='"+tableName+"'"});
 const raw=result&&result[0]!==undefined?result[0]:result;
 const catalog=typeof raw==='string'?JSON.parse(raw):raw;
 if(!catalog) return fail('No se encontró el catálogo de zonas CRESTA');
 tableId=catalog.id??catalog.Id??catalog.ID;
 if(tableId===null||tableId===undefined) return fail('El catálogo de zonas CRESTA no tiene un identificador válido');
 const table=typeof catalog.data==='string'?JSON.parse(catalog.data):catalog.data;
 if(JSON.stringify(table[0])!==JSON.stringify(['cod','descripcion'])) return fail('Cambió la estructura del catálogo de zonas CRESTA');
 const rows=table.slice(1);
 if(request.action==='list') return {ok:true,rows:rows};
 const description=String(request.description==null?'':request.description).trim();
 if(!description) return fail('El nombre de la zona es obligatorio');
 if(description.length>200) return fail('El nombre admite hasta 200 caracteres');
 let row;
 if(request.original==null) {
  if(request.cod!=null) return fail('El código se genera automáticamente');
  const codes=rows.map(r=>Number(r[0]));
  if(codes.some(v=>!Number.isSafeInteger(v)||v<1)) return fail('El catálogo contiene un código inválido');
  const next=Math.max.apply(null,[0].concat(codes))+1;
  if(!Number.isSafeInteger(next)) return fail('No se puede generar otro código');
  row=[String(next),description];rows.push(row);
 } else {
  if(!Array.isArray(request.original)||request.original.length!==2) return fail('Registro original inválido');
  const code=String(request.original[0]);
  if(request.cod!=null && String(request.cod)!==code) return fail('No se permite modificar el código');
  const index=rows.findIndex(r=>String(r[0])===code);
  if(index<0||JSON.stringify(rows[index])!==JSON.stringify(request.original)) return fail('La zona cambió. Vuelva a cargar antes de guardar');
  row=[code,description];rows[index]=row;
 }
 const saved=doCmd({cmd:'AddOrUpdateTable',data:{id:tableId,name:tableName,data:JSON.stringify([table[0]].concat(rows))}});
 if(!saved || !saved.ok) throw new Error(saved && saved.msg || 'No se pudo guardar la zona');
 return {ok:true,row:row,msg:'Zona guardada'};
} catch(e){return fail(String(e.message||e));}
})()
