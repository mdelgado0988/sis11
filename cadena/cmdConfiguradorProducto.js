//block
//noreplace
/**
 * Name: cmdConfiguradorProducto
 * Purpose: Server side of the ConfiguradorProducto view (Taller de productos). Lists the lines of business, their products with status and validity and each product's coverages, and reads and saves the rows of one product + coverage in the cfgCobtar, cfgCoberturaProductoRea and tarificacionSIS9 tables of the product's line. A save rewrites only those rows, under ChainLock, and is refused when the rows changed after they were loaded. No triggers.
 * Author: AIDEN (MSN-000278)
 */
/*
 Input: context.request = { action, ... }
   lobs      {}                                  -> { lobs: [{ code, name, products, tables }] }
   products  { lobCode }                         -> { products: [{ code, name, subLobCode, status, validity, from, to, note }] }
   coverages { productCode }                     -> { product, tables, coverages: [{ code, name, commercialName, status, inProduct, counts }] }
   rows      { productCode, coverageCode, family } family: cob | rea | tar
             -> { table, header, keys, hidden, rows: [{ pos, values }], hash, template, typeOptions | fields, variables }
   save      { productCode, coverageCode, family, header, hash, rows: [[...]] }
             -> { ok, msg, rows, hash, previous, saved }
 Rules:
   - Tables per line of business are the ones the premium and reinsurance commands read (MAP below).
   - Rows of a product + coverage: same product code and coverage code (trimmed; numeric codes compared as numbers).
   - save: every row must keep the product and coverage; formula columns of tarificacion must be valid expressions.
     The new rows take the place of the first old row (or follow the product's last row, or go at the end);
     every other row of the table is written back as it was read. Read back by id after the write.
 SQL justification: read-only SELECT statements on Lob, Product and [Table]; the write is AddOrUpdateTable.
*/
(() => {
const req = context.request || {};
const fail = function(msg, extra){ const r = {ok:false, msg:msg}; if(extra) Object.keys(extra).forEach(function(k){ r[k]=extra[k]; }); return r; };
const call = function(cmd, data){ const r = doCmd({cmd:cmd, data:data}); if(!r || !r.ok) throw new Error(r && r.msg || ('No se pudo ejecutar '+cmd)); return r.outData; };
const txt = function(v){ return v===null || v===undefined ? '' : String(v).trim(); };
const same = function(a, b){
  a = txt(a); b = txt(b);
  if(a===b) return true;
  return a!=='' && b!=='' && !isNaN(Number(a)) && !isNaN(Number(b)) && Number(a)===Number(b);
};
const sq = function(v, what){
  const s = txt(v);
  if(!s || s.length>60 || /[\u0000-\u001f]/.test(s)) throw new Error((what||'Código')+' no válido: '+s);
  return s.split("'").join("''");
};
const MAP = (function(){
  const m = {
    '1':  {cob:'cfgCobtarIncendio',       rea:'cfgCoberturaProductoRea',               tar:'tarificacionSis9'},
    '6':  {cob:'cfgCobtarAuto',           rea:'cfgCoberturaProductoReaAuto',           tar:'tarificacionSIS9Auto'},
    '20': {cob:'cfgCobtarVidaColectivo',  rea:'cfgCoberturaProductoReaVidaColectivo',  tar:'tarificacionsis9VidaColectivo'},
    '31': {cob:'cfgCobtarVida',           rea:'cfgCoberturaProductoReaVida',           tar:'tarificacionSIS9Vida'},
    '52': {cob:'cfgCobtarRiesgosVarios',  rea:'cfgCoberturaProductoReaRiesgosVarios',  tar:'tarificacionSIS9RiesgosVarios'},
    '71': {cob:'cfgCobtarVidaIndividual', rea:'cfgCoberturaProductoReaVidaIndividual', tar:'tarificacionSIS9VidaIndividual'},
    '96': {cob:'cfgCobtarRamoTecnico',    rea:'cfgCoberturaProductoReaTecnicos',       tar:'tarificacionSIS9RamoTecnico'}
  };
  ['81','82','83','84'].forEach(function(l){ m[l] = {cob:'cfgCobtar', rea:'cfgCoberturaProductoReaFianza', tar:'tarificacionsis9Fianza'}; });
  return m;
})();
const FAMILIES = ['cob','rea','tar'];
const FORMULAS = ['condicion','prima','deducible','deducibleMinimo','sumaasegurada','etiqueta'];
const JSWORDS = {};
['Number','Math','true','false','null','undefined','typeof','new','Date','parseInt','parseFloat','isNaN','isFinite','String','Boolean','Array','Object','JSON','return','var','let','const','function','if','else','in','of','instanceof','NaN','Infinity','this','void'].forEach(function(w){ JSWORDS[w] = true; });

const hashRows = function(rows){
  const s = JSON.stringify(rows);
  let h = 0x811c9dc5;
  for(let i=0; i<s.length; i++){ h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; }
  return h.toString(16)+':'+rows.length;
};
const readTable = function(name){
  const res = call('DoQuery', {sql:"SELECT id, name, data FROM [Table] WHERE name='"+name.split("'").join("''")+"'"}) || [];
  if(!res.length) throw new Error('@No se encontró la tabla '+name);
  if(res.length>1) throw new Error('@Hay '+res.length+' tablas llamadas '+name);
  const data = typeof res[0].data==='string' ? JSON.parse(res[0].data) : res[0].data;
  if(!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('@La tabla '+name+' no tiene encabezado');
  return {id:res[0].id, name:name, data:data};
};
const keysOf = function(family, h){
  let k;
  if(family==='cob') k = {p:h.indexOf('productCode'), pn:h.indexOf('productName'), c:h.indexOf('coverageCode'), cn:h.indexOf('coverageName'), l:-1};
  else if(family==='rea') { const c = h.indexOf('coverageCode'); k = {l:h.indexOf('lobCode'), p:h.indexOf('productCode'), pn:h.indexOf('name'), c:c, cn:c<0 ? -1 : h.indexOf('name', c+1)}; }
  else k = {l:h.indexOf('cramo'), p:h.indexOf('codigoplan'), c:h.indexOf('ccobertura'), pn:-1, cn:-1};
  if(k.p<0 || k.c<0) throw new Error('@La tabla no tiene las columnas de producto y cobertura esperadas');
  return k;
};
const hiddenOf = function(k){ return [k.l, k.p, k.pn, k.c, k.cn].filter(function(i){ return i>=0; }); };
const validity = function(active, aactive){
  const f = txt(active);
  if(!f) return {status:'Activo', validity:'Sin vigencia definida', from:null, to:null, note: txt(aactive) ? 'Hay una vigencia escrita en la clave "aactive", que el sistema no aplica' : null};
  const m = /^new Date\(\)\s*(>=?)\s*new Date\((["'])([^"']+)\2\)\s*&&\s*new Date\(\)\s*(<=?)\s*new Date\((["'])([^"']+)\5\)$/.exec(f);
  if(m) {
    const now = Date.now(), a = Date.parse(m[3]), b = Date.parse(m[6]);
    const afterStart = m[1]==='>=' ? now>=a : now>a;
    const beforeEnd = m[4]==='<=' ? now<=b : now<b;
    return {status: afterStart && beforeEnd ? 'Activo' : (afterStart ? 'Vencido' : 'Aún no vigente'), validity: m[3]+' a '+m[6], from:m[3], to:m[6], note:null};
  }
  if(f==='true') return {status:'Activo', validity:'Sin vigencia definida', from:null, to:null, note:null};
  if(f==='false') return {status:'Inactivo', validity:'Sin vigencia definida', from:null, to:null, note:null};
  return {status:'Según fórmula', validity:f, from:null, to:null, note:null};
};
const productOf = function(code){
  const res = call('DoQuery', {sql:"SELECT code, name, lobCode, subLobCode, JSON_QUERY(configJson,'$.Coverages') coverages FROM Product WHERE code='"+sq(code,'Producto')+"'"}) || [];
  if(!res.length) throw new Error('@No existe el producto '+txt(code));
  const p = res[0];
  let cov = [];
  try { cov = p.coverages ? JSON.parse(p.coverages) : []; } catch(e) { cov = []; }
  return {code:txt(p.code), name:txt(p.name), lobCode:txt(p.lobCode), subLobCode:txt(p.subLobCode), coverages: (Array.isArray(cov) ? cov : []).map(function(c){
    return {code:txt(c.code), name:txt(c.name), commercialName:txt(c.commercialName), mandatory:c.mandatory===true || c.mandatory==='true', basic:c.basic===true || c.basic==='true'};
  })};
};
const tablesOf = function(lob){
  const m = MAP[txt(lob)];
  if(!m) throw new Error('@El ramo '+txt(lob)+' no tiene tablas de configuración asignadas');
  return m;
};
const matches = function(row, k, p, c){ return Array.isArray(row) && same(row[k.p], p) && same(row[k.c], c); };
const identsInto = function(s, acc){
  const clean = String(s===null || s===undefined ? '' : s).replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, ' ');
  const re = /(^|[^.\w$])([A-Za-z_$][\w$]*)/g;
  let m;
  while((m = re.exec(clean))) { const w = m[2]; if(!JSWORDS[w]) acc[w] = (acc[w]||0)+1; }
};
const template = function(family, h, k, lob, prod, cov){
  const row = h.map(function(name){ return name===null || name===undefined ? null : ''; });
  const set = function(col, v){ const i = h.indexOf(col); if(i>=0) row[i] = v; };
  if(k.l>=0) row[k.l] = lob;
  row[k.p] = prod.code;
  if(k.pn>=0) row[k.pn] = prod.name;
  row[k.c] = cov.code;
  if(k.cn>=0) row[k.cn] = cov.name;
  if(family==='cob') { set('type','text'); set('readOnly','false'); set('required','false'); }
  else if(family==='rea') { set('isCoverage','No'); set('cessionCode','0'); set('coberturaPrincipal','-1'); set('coverageCodeDep','-1'); set('changeable','false'); set('sameValidityAs','-1'); }
  else { set('cendoso', lob==='1' ? 'QUOTE' : '36'); set('condicion','1==1'); set('prima','0'); set('deducible','0'); set('deducibleMinimo','0'); set('sumaasegurada','0'); set('usaProrrata','false'); }
  return row;
};
const coverageOf = function(prod, code, rows, k){
  const c = prod.coverages.find(function(x){ return same(x.code, code); });
  if(c) return c;
  const r = rows.find(function(x){ return k.cn>=0 && same(x[k.c], code) && txt(x[k.cn]); });
  return {code:txt(code), name: r ? txt(r[k.cn]) : '', commercialName:'', inProduct:false};
};

let lockToken = null, lockKey = null, result;
try {
  const action = txt(req.action);
  if(action==='lobs') {
    const rows = call('DoQuery', {sql:"SELECT l.code, l.name, (SELECT COUNT(*) FROM Product p WHERE p.lobCode=l.code) products FROM Lob l ORDER BY TRY_CAST(l.code AS int), l.code"}) || [];
    result = {ok:true, lobs: rows.map(function(r){ return {code:txt(r.code), name:txt(r.name), products:r.products, tables: MAP[txt(r.code)] || null}; })};
  } else if(action==='products') {
    const lob = sq(req.lobCode, 'Ramo');
    const rows = call('DoQuery', {sql:"SELECT code, name, subLobCode, JSON_VALUE(configJson,'$.Main.active') active, JSON_VALUE(configJson,'$.Main.aactive') aactive FROM Product WHERE lobCode='"+lob+"' ORDER BY code"}) || [];
    result = {ok:true, tables: MAP[txt(req.lobCode)] || null, products: rows.map(function(r){
      const v = validity(r.active, r.aactive);
      return {code:txt(r.code), name:txt(r.name), subLobCode:txt(r.subLobCode), status:v.status, validity:v.validity, from:v.from, to:v.to, note:v.note};
    })};
  } else if(action==='coverages') {
    const prod = productOf(req.productCode);
    const map = tablesOf(prod.lobCode);
    const counts = {}, extra = {};
    const tables = {};
    prod.coverages.forEach(function(c){ counts[c.code] = {cob:0, rea:0, tar:0}; });
    FAMILIES.forEach(function(f){
      const t = readTable(map[f]);
      const k = keysOf(f, t.data[0]);
      tables[f] = {id:t.id, name:t.name};
      t.data.slice(1).forEach(function(r){
        if(!Array.isArray(r) || !same(r[k.p], prod.code)) return;
        const own = prod.coverages.find(function(c){ return same(c.code, r[k.c]); });
        const code = own ? own.code : txt(r[k.c]);
        if(!own && !extra[code]) extra[code] = {code:code, name: k.cn>=0 ? txt(r[k.cn]) : ''};
        if(!own && !extra[code].name && k.cn>=0) extra[code].name = txt(r[k.cn]);
        if(!counts[code]) counts[code] = {cob:0, rea:0, tar:0};
        counts[code][f]++;
      });
    });
    const list = prod.coverages.map(function(c){
      return {code:c.code, name:c.name, commercialName:c.commercialName, mandatory:c.mandatory, basic:c.basic, status: c.mandatory ? 'Obligatoria' : 'Opcional', inProduct:true, counts:counts[c.code]};
    }).concat(Object.keys(extra).map(function(code){
      return {code:code, name:extra[code].name, commercialName:'', mandatory:false, basic:false, status:'No está en el producto', inProduct:false, counts:counts[code]};
    }));
    result = {ok:true, product:{code:prod.code, name:prod.name, lobCode:prod.lobCode}, tables:tables, coverages:list};
  } else if(action==='rows' || action==='save') {
    const family = txt(req.family);
    if(FAMILIES.indexOf(family)<0) return fail('Tabla no válida: '+family);
    const prod = productOf(req.productCode);
    const map = tablesOf(prod.lobCode);
    const covCode = txt(req.coverageCode);
    if(!covCode) return fail('Indique la cobertura');
    if(action==='save') {
      lockKey = 'cmdConfiguradorProducto:'+map[family];
      const lock = doCmd({cmd:'ChainLock', data:{operation:'LOCK', key:lockKey, ttl:30}});
      if(!lock || !lock.ok || !lock.outData || !lock.outData.token) return fail('Otro usuario está guardando en la tabla '+map[family]+' en este momento. Intente de nuevo en unos segundos.'+(lock && lock.msg ? ' ('+lock.msg+')' : ''));
      lockToken = lock.outData.token;
    }
    const t = readTable(map[family]);
    const h = t.data[0];
    const k = keysOf(family, h);
    const body = t.data.slice(1);
    const mine = [];
    body.forEach(function(r, i){ if(matches(r, k, prod.code, covCode)) mine.push({pos:i+1, values:r}); });
    const cov = coverageOf(prod, covCode, body, k);
    const currentHash = hashRows(mine.map(function(x){ return x.values; }));
    if(action==='rows') {
      const out = {ok:true, family:family, table:{id:t.id, name:t.name}, header:h, keys:k, hidden:hiddenOf(k), rows:mine, hash:currentHash,
        template: template(family, h, k, prod.lobCode, prod, cov), product:{code:prod.code, name:prod.name, lobCode:prod.lobCode}, coverage:cov};
      if(family==='cob') {
        const ti = h.indexOf('type'), freq = {};
        if(ti>=0) body.forEach(function(r){ const v = Array.isArray(r) ? txt(r[ti]) : ''; if(v) freq[v] = (freq[v]||0)+1; });
        out.typeOptions = Object.keys(freq).sort(function(a, b){ return freq[b]-freq[a]; });
      }
      if(family==='tar') {
        const ct = readTable(map.cob);
        const ck = keysOf('cob', ct.data[0]);
        const ch = ct.data[0];
        const col = function(name){ return ch.indexOf(name); };
        out.fields = ct.data.slice(1).filter(function(r){ return Array.isArray(r) && same(r[ck.p], prod.code) && txt(r[col('name')]); }).map(function(r){
          return {name:txt(r[col('name')]), description:txt(r[col('description')]), type:txt(r[col('type')]), catalog: col('catalog')>=0 ? r[col('catalog')] : null, coverageCode:txt(r[ck.c]), thisCoverage: same(r[ck.c], covCode)};
        });
        const acc = {}, own = {};
        const fi = FORMULAS.map(function(n){ return h.indexOf(n); }).filter(function(i){ return i>=0; });
        body.forEach(function(r){ if(Array.isArray(r)) fi.forEach(function(i){ identsInto(r[i], acc); }); });
        mine.forEach(function(x){ fi.forEach(function(i){ identsInto(x.values[i], own); }); });
        out.variables = Object.keys(acc).sort(function(a, b){ return (own[b]||0)-(own[a]||0) || acc[b]-acc[a]; }).slice(0, 300).map(function(n){ return {name:n, count:acc[n], here:own[n]||0}; });
      }
      result = out;
    } else {
      if(JSON.stringify(req.header)!==JSON.stringify(h)) return fail('Cambió la estructura de la tabla '+t.name+'. Vuelva a cargar la pantalla.');
      if(txt(req.hash)!==currentHash) return fail('Otro usuario cambió estas filas de '+t.name+' después de que usted las cargó. Vuelva a cargarlas antes de guardar.', {stale:true});
      if(!Array.isArray(req.rows)) return fail('Faltan las filas a guardar');
      const rows = [];
      for(let i=0; i<req.rows.length; i++) {
        const r = req.rows[i];
        if(!Array.isArray(r) || r.length!==h.length) return fail('La fila '+(i+1)+' no tiene '+h.length+' columnas');
        const v = r.map(function(x){ return x===null || x===undefined ? null : (typeof x==='object' ? JSON.stringify(x) : String(x)); });
        if(!matches(v, k, prod.code, covCode)) return fail('La fila '+(i+1)+' no corresponde al producto '+prod.code+' y la cobertura '+covCode);
        if(family==='tar') {
          for(let j=0; j<FORMULAS.length; j++) {
            const ci = h.indexOf(FORMULAS[j]);
            const f = ci>=0 ? txt(v[ci]) : '';
            if(!f) continue;
            try { new Function('return ('+f+'\n);'); } catch(e) { return fail('Fila '+(i+1)+', '+FORMULAS[j]+': la fórmula no es válida ('+String(e.message||e)+')'); }
          }
        }
        rows.push(v);
      }
      let anchor = mine.length ? mine[0].pos : -1;
      if(anchor<0) { for(let i=body.length; i>=1; i--) { if(Array.isArray(t.data[i]) && same(t.data[i][k.p], prod.code)) { anchor = i+1; break; } } }
      if(anchor<0) anchor = t.data.length;
      const taken = {};
      mine.forEach(function(x){ taken[x.pos] = true; });
      const next = [h];
      let placed = false;
      for(let i=1; i<=t.data.length; i++) {
        if(i===anchor && !placed) { rows.forEach(function(r){ next.push(r); }); placed = true; }
        if(i<t.data.length && !taken[i]) next.push(t.data[i]);
      }
      if(!placed) rows.forEach(function(r){ next.push(r); });
      call('AddOrUpdateTable', {id:t.id, name:t.name, data:JSON.stringify(next)});
      const back = call('DoQuery', {sql:'SELECT id, data FROM [Table] WHERE id='+Number(t.id)}) || [];
      const backData = back.length ? (typeof back[0].data==='string' ? back[0].data : JSON.stringify(back[0].data)) : '';
      if(backData!==JSON.stringify(next)) {
        let parsed = null;
        try { parsed = JSON.parse(backData); } catch(e) {}
        if(!parsed || JSON.stringify(parsed)!==JSON.stringify(next)) return fail('La tabla '+t.name+' se guardó pero al releerla no coincide. Revise antes de seguir.');
      }
      const saved = [];
      next.forEach(function(r, i){ if(i>0 && matches(r, k, prod.code, covCode)) saved.push({pos:i, values:r}); });
      result = {ok:true, msg:'Se guardaron '+rows.length+' fila(s) en '+t.name+' (antes '+mine.length+').', table:{id:t.id, name:t.name}, rows:saved, hash:hashRows(saved.map(function(x){ return x.values; })), previous:mine.length, saved:rows.length, total:next.length-1};
    }
  } else {
    result = fail('Acción no válida: '+action);
  }
} catch(e) { result = fail(String(e && e.message || e).replace(/^@/, '')); }
finally { if(lockToken) { try { doCmd({cmd:'ChainLock', data:{operation:'UNLOCK', key:lockKey, token:lockToken}}); } catch(u) {} } }
return result;
})()
