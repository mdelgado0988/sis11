()=>{
  /*
   * Name: InformeReaseguro
   * MSN-000265 / AXX-11812 — Informe de Reaseguro, reproducción del formulario reaInformesEXT.
   * Pestañas: Pólizas Vigentes, Cúmulos, Perfil de Cartera y Rangos del Perfil (mantenimiento).
   * Toda la lógica vive en comandos nuevos, uno por consulta:
   *   cmdInformaReaseguroCatalogos, cmdInformaReaseguroPolizasVigentes, cmdInformaReaseguroCumulos,
   *   cmdInformaReaseguroPerfilCartera, cmdInformaReaseguroRangos y cmdInformaReaseguroExportar.
   * Reaseguro: cesiones vigentes de la póliza, filtradas por la configuración dinámica del ramo y producto.
   * Prima suscrita: prima base de LifePolicy, sin consultar renovaciones ni endosos ejecutados.
   */
  const { useState, useEffect } = React;
  const { Table, Select, Button, DatePicker, Space, Tabs, Tag, Tooltip, Empty, Checkbox, InputNumber, Alert, Spin, Modal, message } = A;

  const CSS = [
    '.ir-view{padding:8px 12px;color:#262626}',
    '.ir-title{font-size:18px;font-weight:700;margin:4px 0 8px 0;color:#1f3b57}',
    '.ir-bar{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px;padding:10px 12px;background:#eef2f6;border:1px solid #8f9aa7;border-radius:4px;margin-bottom:8px;box-shadow:0 1px 3px rgba(38,38,38,.12)}',
    '.ir-field{display:flex;flex-direction:column;font-size:12px;color:#262626;font-weight:600}',
    '.ir-field>span{margin-bottom:3px}',
    '.ir-info{font-size:12px;color:#5a6673;margin:4px 0 6px 2px}',
    '.ir-grid .ant-table-container{border:1px solid #8f9aa7!important;border-radius:2px}',
    '.ir-grid .ant-table{border:0!important}',
    '.ir-grid .ant-table-thead>tr>th{font-size:12px;font-weight:700;background:#bfbfbf!important;color:#262626;padding:5px 6px;white-space:normal;border-color:#cbd1d8!important}',
    '.ir-grid .ant-table-tbody>tr>td{font-size:12px;padding:4px 6px;border-color:#cbd1d8!important}',
    '.ir-grid .ant-table-tbody>tr:hover>td{background:#f5f9ff!important}',
    '.ir-grid .ant-table-summary td{font-weight:700;background:#e8edf3;font-size:12px;padding:5px 6px;border-color:#8f9aa7!important}',
    '.ir-grid .ant-table-body{overflow-y:scroll!important}',
    '.ir-grid .ant-table-content{overflow-x:scroll!important}',
    '.ir-grid .ant-pagination{margin:8px 0 2px}',
    '.ir-neg{color:#cf1322}',
    '.ir-rangos{padding:10px 12px;border:1px solid #8f9aa7;border-radius:4px;background:#f8fafc}',
    '.ir-rangos .ir-fila{display:flex;gap:8px;align-items:center;margin-bottom:6px}',
    '.ir-view .ant-input,.ir-view .ant-input-number,.ir-view .ant-picker,.ir-view .ant-select-selector,.ir-view .ant-btn,.ir-view .ant-radio-button-wrapper{border-color:#8f9aa7!important}',
    '.ir-view .ant-btn{border-style:solid!important;border-width:1px!important}',
    '.ir-view .ant-input:hover,.ir-view .ant-input-number:hover,.ir-view .ant-picker:hover,.ir-view .ant-select:not(.ant-select-disabled):hover .ant-select-selector,.ir-view .ant-btn:hover,.ir-view .ant-radio-button-wrapper:hover{border-color:#6f7b88!important}',
    '.ir-view .ant-input:focus,.ir-view .ant-input-focused,.ir-view .ant-input-number-focused,.ir-view .ant-input-number:focus-within,.ir-view .ant-picker-focused,.ir-view .ant-select-focused .ant-select-selector{border-color:#1677ff!important;box-shadow:0 0 0 2px rgba(22,119,255,.12)!important}',
    '.ir-view .ant-checkbox-inner{background:#fff!important;border:1px solid #8f9aa7!important}',
    '.ir-view .ant-checkbox:hover .ant-checkbox-inner{border-color:#6f7b88!important}',
    '.ir-view .ant-checkbox-checked .ant-checkbox-inner{background:#1677ff!important;border-color:#1677ff!important}',
    '.ir-view .ant-btn:disabled,.ir-view .ant-input:disabled,.ir-view .ant-input-number-disabled,.ir-view .ant-picker-disabled,.ir-view .ant-select-disabled .ant-select-selector{border-color:#6f7b88!important;opacity:1}',
    '.ir-view .ir-tabs .ant-tabs-tab{margin-right:4px;padding:9px 14px;border:1px solid #cbd1d8;border-bottom:0;border-radius:4px 4px 0 0;background:#f5f7fa;color:#262626;font-weight:600}',
    '.ir-view .ir-tabs .ant-tabs-tab+.ant-tabs-tab{margin-left:4px!important}',
    '.ir-view .ir-tabs .ant-tabs-tab-active{background:#edf5fc;border-color:#78a9d6}',
    '.ir-view .ir-tabs .ant-tabs-tab:hover{color:#1769aa}'
  ].join('\n');

  function txt(v){ return v === null || v === undefined ? '' : String(v); }
  function num(v){ const n = Number(v); return isFinite(n) ? n : 0; }
  function money(v){
    if (v === null || v === undefined || v === '' || isNaN(Number(v))) return txt(v);
    const n = Number(v);
    const r = Math.round(Math.abs(n) * 100 + 1e-9) / 100;
    return (n < 0 ? '-' : '') + r.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function entero(v){ return v === null || v === undefined || v === '' ? '' : Math.round(num(v)).toLocaleString('en-US'); }
  function tasa(v){ return v === null || v === undefined || v === '' ? '' : num(v).toFixed(4); }
  function fecha(v){
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(txt(v));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : txt(v);
  }
  function mensajeDeError(res, defecto){
    const raw = res && res.msg ? String(res.msg) : '';
    const limpio = raw.split('fórmula ->')[0].split('formula ->')[0].split(' --> ')[0]
      .replace('Error calculando fórmula. err ->', '').replace('Error computing formula. err ->', '').replace(/^\s*@/, '').trim();
    return limpio || defecto;
  }
  async function correr(cadena, ctx){
    return await exe('ExeChain', { chain: cadena, context: JSON.stringify(ctx || {}) });
  }

  /* Columnas: t = título, k = campo, tipo = texto | num | entero | tasa | fecha, w = ancho. */
  function col(t, k, tipo, w){ return { t: t, k: k, tipo: tipo || 'texto', w: w || (tipo === 'num' ? 130 : (tipo === 'fecha' ? 96 : 140)) }; }
  const SUMAS = [col('Suma Asegurada 100%', 'sumaAsegurada100', 'num', 140), col('Suma Retenida', 'sumaRetenida', 'num'), col('Suma Cedida', 'sumaCedida', 'num'),
    col('Suma Facultativa', 'sumaFacultativa', 'num'), col('Suma Coaseguro', 'sumaCoaseguro', 'num')];
  const PRIMAS = [col('Prima Suscrita 100%', 'primaSuscrita100', 'num'), col('Prima Retenida', 'primaRetenida', 'num'), col('Prima Cedida', 'primaCedida', 'num'),
    col('Prima Cat', 'primaCat', 'num', 110), col('Prima Facultativa', 'primaFacultativa', 'num'), col('Prima Coaseguro', 'primaCoaseguro', 'num')];

  function columnasVigentes(tipoRamo, coberturas){
    const esFianza = tipoRamo === 'FIANZAS', esIncendio = tipoRamo === 'INCENDIO';
    let c = [col('Fecha Emisión', 'fechaEmision', 'fecha'), col('Ramo', 'ramo', 'texto', 170), col('Plan', 'plan', 'texto', 190)];
    if (esFianza) c.push(col('Tipo Fianza', 'tipoFianza', 'texto', 220));
    c = c.concat([col(esFianza ? 'No. Fianza' : 'Póliza', 'poliza', 'texto', 110), col('Fecha Inicial', 'fechaInicial', 'fecha'), col('Fecha Final', 'fechaFinal', 'fecha'),
      col('Fecha Cob. Principal', 'fechaCobPrincipal', 'fecha'), col('Vigencia Días', 'vigenciaDias', 'entero', 80)]);
    if (esFianza) c.push(col('Garantizado A', 'garantizadoA', 'texto', 240));
    c.push(col('Cliente', 'cliente', 'texto', 220));
    if (esIncendio) c = c.concat([col('Tipo Riesgo', 'tipoRiesgo', 'texto', 110), col('Provincia', 'provincia', 'texto', 120), col('Distrito', 'distrito', 'texto', 120),
      col('Corregimiento', 'corregimiento', 'texto', 140), col('Barriada', 'barriada', 'texto', 160), col('Edificio', 'edificio', 'texto', 160),
      col('Tarifa', 'tarifa', 'texto', 100), col('Zona Cresta', 'zonaCresta', 'texto', 150)]);
    c = c.concat([SUMAS[0], col('Rango', 'rango', 'num', 120)]).concat(SUMAS.slice(1)).concat(PRIMAS);
    c = c.concat([col('Prima sin distribuir', 'descuadrePrima', 'num', 120), col('Tasa', 'tasa', 'tasa', 80)]);
    if (esFianza) c = c.concat([col('Beneficiario', 'beneficiario', 'texto', 220), col('Estado Fianza', 'estadoFianza', 'texto', 100)]);
    c.push(col('Grupo Económico', 'grupoEconomico', 'texto', 180));
    if (esFianza) c = c.concat([col('Secuestrante/Secuestrado', 'secuestrante', 'texto', 180), col('Descripción Garantía', 'descripcionGarantia', 'texto', 200),
      col('Valor Garantía', 'valorGarantia', 'texto', 120)]);
    c = c.concat([col('Moneda', 'moneda', 'texto', 70), col('Cesión', 'cesionTexto', 'texto', 90)]);
    (coberturas || []).forEach(function(cb){ c.push(col(cb.nombre + ' (' + cb.lob + '-' + cb.codigo + ')', cb.clave, 'num', 150)); });
    return c;
  }
  function columnasCumulos(res){
    const c = [];
    if (res.agrupaRamo) c.push(col('Ramo', 'ramo', 'texto', 170));
    c.push(col(res.criterio && res.criterio.nombre ? res.criterio.nombre : 'Descripción', 'descripcion', 'texto', 260));
    if (res.criterio && res.criterio.codigo === 10) {
      [col('Plan', 'plan', 'texto', 180), col('Asegurado', 'asegurado', 'texto', 220), col('Grupo Económico', 'grupoEconomico', 'texto', 180),
        col('Beneficiario', 'beneficiario', 'texto', 220), col('Serie', 'serie', 'texto', 80), col('Fecha Desde', 'fechaDesde', 'fecha'),
        col('Fecha Hasta', 'fechaHasta', 'fecha')].forEach(function(x){ c.push(x); });
    }
    c.push(col('Cantidad', 'cantidad', 'entero', 80));
    return c.concat(SUMAS).concat(PRIMAS);
  }
  function columnasPerfil(res){
    const c = [];
    if (res.agrupaRamo) c.push(col(res.tipoRamo === 'FIANZAS' ? 'Tipo Fianza' : 'Ramo', 'grupo', 'texto', 230));
    c.push(col('Límite Inferior', 'limiteInferior', 'num', 130), col('Límite Superior', 'limiteSuperior', 'num', 130), col('Cantidad', 'cantidad', 'entero', 80));
    return c.concat(SUMAS).concat([PRIMAS[0], PRIMAS[1], PRIMAS[2], PRIMAS[4], PRIMAS[3], PRIMAS[5]])
      .concat([col('Suma Asegurada Promedio', 'sumaPromedio', 'num', 140), col('Prima Promedio', 'primaPromedio', 'num'), col('Tasa Promedio', 'tasaPromedio', 'tasa', 90)]);
  }

  function columnasAntd(defs){
    return defs.map(function(d){
      const c = { title: d.t, dataIndex: d.k, key: d.k, width: d.w };
      if (d.tipo === 'num') {
        c.align = 'right';
        c.render = function(v){ return <span className={ num(v) < 0 ? 'ir-neg' : undefined }>{ money(v) }</span>; };
        c.sorter = function(a, b){ return num(a[d.k]) - num(b[d.k]); };
      } else if (d.tipo === 'entero') {
        c.align = 'right'; c.render = function(v){ return entero(v); };
        c.sorter = function(a, b){ return num(a[d.k]) - num(b[d.k]); };
      } else if (d.tipo === 'tasa') {
        c.align = 'right'; c.render = function(v){ return tasa(v); };
        c.sorter = function(a, b){ return num(a[d.k]) - num(b[d.k]); };
      } else if (d.tipo === 'fecha') {
        c.align = 'center'; c.render = function(v){ return fecha(v); };
        c.sorter = function(a, b){ return txt(a[d.k]) < txt(b[d.k]) ? -1 : (txt(a[d.k]) > txt(b[d.k]) ? 1 : 0); };
      } else {
        c.ellipsis = true;
        c.render = function(v){ const s = txt(v); return s ? <Tooltip title={ s }><span>{ s }</span></Tooltip> : ''; };
        c.sorter = function(a, b){ return txt(a[d.k]).localeCompare(txt(b[d.k])); };
      }
      return c;
    });
  }
  function anchoDe(defs){ return defs.reduce(function(s, d){ return s + d.w; }, 0); }

  function descargar(nombre, b64){
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  }

  const App = () => {
    const [cat, setCat] = useState(null);
    const [tab, setTab] = useState('vigentes');
    const [fechaCalculo, setFechaCalculo] = useState(moment());
    const [tipoRamo, setTipoRamo] = useState(null);
    const [ramosSel, setRamosSel] = useState([]);
    const [conCoberturas, setConCoberturas] = useState(false);
    const [criterio, setCriterio] = useState(null);
    const [agrupaCumulo, setAgrupaCumulo] = useState(true);
    const [tipoRango, setTipoRango] = useState('AUTOMATICO');
    const [agrupaPerfil, setAgrupaPerfil] = useState(true);
    const [resultados, setResultados] = useState({});
    const [cargando, setCargando] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [rangos, setRangos] = useState([]);
    const [rgTipo, setRgTipo] = useState('AUTOMATICO');
    const [rgClave, setRgClave] = useState('*');
    const [rgFilas, setRgFilas] = useState([]);
    const [guardando, setGuardando] = useState(false);

    async function cargarCatalogos(){
      const res = await correr('cmdInformaReaseguroCatalogos', {});
      if (!res || !res.ok) { message.error(mensajeDeError(res, 'No se pudieron cargar los catálogos del informe.')); setCat({ tiposRamo: [], ramos: [], tiposFianza: [], criterios: [] }); return; }
      const c = res.outData || {};
      setCat(c);
      const tipos = c.tiposRamo || [];
      const inicial = tipos.filter(function(t){ return t.codigo === 'FIANZAS'; })[0] || tipos[0];
      if (inicial) elegirTipo(inicial.codigo, c);
    }
    async function cargarRangos(){
      const res = await correr('cmdInformaReaseguroRangos', { operacion: 'GET' });
      if (!res || !res.ok) { message.error(mensajeDeError(res, 'No se pudieron leer los rangos.')); return; }
      setRangos((res.outData && res.outData.rangos) || []);
    }
    useEffect(function(){ cargarCatalogos(); cargarRangos(); }, []);
    useEffect(function(){
      setRgFilas(rangos.filter(function(r){ return r.tipo === rgTipo && r.clave === rgClave; })
        .map(function(r){ return { desde: r.desde, hasta: r.hasta }; }));
    }, [rangos, rgTipo, rgClave]);

    function tipoActual(c){ const k = c || cat; return k ? (k.tiposRamo || []).filter(function(t){ return t.codigo === tipoRamo; })[0] : null; }
    function elegirTipo(codigo, c){
      const k = c || cat;
      const t = (k.tiposRamo || []).filter(function(x){ return x.codigo === codigo; })[0];
      setTipoRamo(codigo);
      setRamosSel(t ? t.ramos.slice() : []);
      setCriterio(t ? t.criterioDefecto : null);
    }
    function nombreRamo(codigo){
      const r = ((cat && cat.ramos) || []).filter(function(x){ return x.codigo === codigo; })[0];
      return r ? r.nombre : codigo;
    }
    function filtrosBase(){
      if (!fechaCalculo) { message.error('La fecha de cálculo es obligatoria.'); return null; }
      if (!ramosSel.length) { message.error('Seleccione al menos un ramo.'); return null; }
      return { fecha: fechaCalculo.format('YYYY-MM-DD'), tipoRamo: tipoRamo, ramos: ramosSel.slice() };
    }

    function normalizarFilas(out, clave){
      return (out.filas || []).map(function(f, i){
        const x = Object.assign({ clave: clave === 'vigentes' ? f.id : i }, f);
        if (clave === 'vigentes') x.cesionTexto = f.conCesion ? 'Con cesión' : 'Sin cesión';
        if (clave === 'perfil' && f.sinRango) { x.limiteInferior = 'Sin rango'; x.limiteSuperior = ''; }
        return x;
      });
    }

    async function calcular(){
      const base = filtrosBase();
      if (!base) return;
      let cadena, ctx;
      if (tab === 'vigentes') { cadena = 'cmdInformaReaseguroPolizasVigentes'; ctx = Object.assign({ conCoberturas: conCoberturas, pagina: 1, tamanoPagina: 50 }, base); }
      else if (tab === 'cumulos') { cadena = 'cmdInformaReaseguroCumulos'; ctx = Object.assign({ criterio: criterio, agrupaRamo: agrupaCumulo }, criterio === 10 ? { pagina: 1, tamanoPagina: 50 } : {}, base); }
      else { cadena = 'cmdInformaReaseguroPerfilCartera'; ctx = Object.assign({ tipoRango: tipoRango, agrupaRamo: agrupaPerfil }, base); }
      setCargando(true);
      const t0 = Date.now();
      const res = await correr(cadena, ctx);
      setCargando(false);
      if (!res || !res.ok) { message.error(mensajeDeError(res, 'No se pudo calcular el informe.')); return; }
      const out = res.outData || {};
      const filas = normalizarFilas(out, tab);
      const nuevo = Object.assign({}, resultados);
      nuevo[tab] = Object.assign({}, out, { filas: filas, segundos: Math.round((Date.now() - t0) / 100) / 10, ctx: ctx });
      setResultados(nuevo);
    }

    async function cargarPagina(clave, pagina, tamanoPagina){
      const actual = resultados[clave];
      const esCumuloPorPoliza = clave === 'cumulos' && actual && actual.criterio && Number(actual.criterio.codigo) === 10;
      if ((clave !== 'vigentes' && !esCumuloPorPoliza) || !actual || !actual.ctx) return;
      const ctx = Object.assign({}, actual.ctx, { pagina: pagina, tamanoPagina: tamanoPagina });
      setCargando(true);
      const res = await correr(clave === 'vigentes' ? 'cmdInformaReaseguroPolizasVigentes' : 'cmdInformaReaseguroCumulos', ctx);
      setCargando(false);
      if (!res || !res.ok) { message.error(mensajeDeError(res, 'No se pudo cargar la página del informe.')); return; }
      const out = res.outData || {};
      const nuevo = Object.assign({}, resultados);
      nuevo[clave] = Object.assign({}, actual, out, { filas: normalizarFilas(out, clave), ctx: ctx });
      setResultados(nuevo);
    }

    function definicionesDe(r, clave){
      if (!r) return [];
      if (clave === 'vigentes') return columnasVigentes(r.tipoRamo, r.coberturas);
      if (clave === 'cumulos') return columnasCumulos(r);
      return columnasPerfil(r);
    }
    function filtrosTexto(r, clave){
      const t = ((cat && cat.tiposRamo) || []).filter(function(x){ return x.codigo === r.tipoRamo; })[0];
      const lineas = ['Fecha de cálculo: ' + fecha(r.fecha), 'Tipo de ramo: ' + (t ? t.nombre : r.tipoRamo),
        'Ramos: ' + (r.ramos || []).map(nombreRamo).join(', ')];
      if (clave === 'cumulos') lineas.push('Cúmulo por: ' + (r.criterio ? r.criterio.nombre : '') + (r.agrupaRamo ? ' (agrupado por ramo)' : ''));
      if (clave === 'perfil') lineas.push('Tipo de rango: ' + (r.tipoRango === 'DINAMICO' ? 'Dinámico' : 'Automático') + (r.agrupaRamo ? ' (agrupado por ramo)' : ''));
      return lineas;
    }
    async function exportar(){
      const r = resultados[tab];
      if (!r || !(r.total || r.filas.length)) { message.info('Primero calcule el informe.'); return; }
      setExportando(true);
      let exportData = r;
      const exportaCumuloPorPolizaCompleto = tab === 'cumulos' && r.criterio && Number(r.criterio.codigo) === 10 && r.pagina > 0 && r.ctx;
      if (tab === 'vigentes' && r.pagina > 0 && r.ctx) {
        const fullRes = await correr('cmdInformaReaseguroPolizasVigentes', Object.assign({}, r.ctx, { pagina: 0, tamanoPagina: 0, exportarCompleto: true }));
        if (!fullRes || !fullRes.ok) { setExportando(false); message.error(mensajeDeError(fullRes, 'No se pudo preparar el resultado completo para exportar.')); return; }
        const fullOut = fullRes.outData || {};
        exportData = Object.assign({}, fullOut, { filas: normalizarFilas(fullOut, tab), ctx: r.ctx });
      } else if (exportaCumuloPorPolizaCompleto) {
        const fullRes = await correr('cmdInformaReaseguroCumulos', Object.assign({}, r.ctx, { pagina: 0, tamanoPagina: 0, exportarCompleto: true }));
        if (!fullRes || !fullRes.ok) { setExportando(false); message.error(mensajeDeError(fullRes, 'No se pudo preparar el resultado completo para exportar.')); return; }
        const fullOut = fullRes.outData || {};
        exportData = Object.assign({}, fullOut, { filas: normalizarFilas(fullOut, tab), ctx: r.ctx });
      }
      const defs = definicionesDe(exportData, tab);
      const titulos = { vigentes: 'Pólizas Vigentes', cumulos: 'Cúmulos', perfil: 'Perfil de Cartera' };
      const filas = exportData.filas.map(function(f){ const x = {}; defs.forEach(function(d){ x[d.k] = f[d.k]; }); return x; });
      const res = await correr('cmdInformaReaseguroExportar', {
        titulo: 'Informe de Reaseguro - ' + titulos[tab], filtros: filtrosTexto(exportData, tab), hoja: titulos[tab],
        archivo: 'InformeReaseguro-' + titulos[tab].replace(/[^A-Za-z]/g, '') + '-' + exportData.fecha,
        columnas: defs.map(function(d){ return { titulo: d.t, campo: d.k, tipo: d.tipo }; }), filas: filas, totales: exportData.totales
      });
      setExportando(false);
      if (!res || !res.ok || !res.outData || !res.outData.base64) { message.error(mensajeDeError(res, 'No se pudo exportar el informe.')); return; }
      descargar(res.outData.archivo, res.outData.base64);
      message.success('Exportadas ' + res.outData.filas + ' filas.');
    }

    async function guardarRangos(filasNuevas){
      const opcion = opcionesClave().filter(function(o){ return o.value === rgClave; })[0];
      setGuardando(true);
      const res = await correr('cmdInformaReaseguroRangos', { operacion: 'SAVE', tipo: rgTipo, clave: rgClave, descripcion: opcion ? opcion.label : rgClave,
        rangos: filasNuevas.map(function(f){ return { desde: f.desde, hasta: f.hasta }; }) });
      setGuardando(false);
      if (!res || !res.ok) { message.error(mensajeDeError(res, 'No se pudieron guardar los rangos.')); return; }
      setRangos((res.outData && res.outData.rangos) || []);
      message.success(filasNuevas.length ? 'Rangos guardados.' : 'Juego de rangos quitado; se usará el general.');
    }
    function opcionesClave(){
      if (rgTipo === 'DINAMICO' || !cat) return [{ value: '*', label: 'General' }];
      const o = [{ value: '*', label: 'General' }];
      (cat.ramos || []).filter(function(r){ return r.tipoRamo !== 'FIANZAS'; }).forEach(function(r){ o.push({ value: r.codigo, label: 'Ramo ' + r.nombre }); });
      (cat.tiposFianza || []).forEach(function(f){ o.push({ value: f.clave, label: 'Fianza ' + f.nombre + ' (' + f.ramo + ')' }); });
      return o;
    }

    if (!cat) return <div className='ir-view'><Spin /> Cargando catálogos del informe...</div>;
    const tipo = tipoActual();
    const opcionesRamo = ((cat.ramos || []).filter(function(r){ return tipo && r.tipoRamo === tipo.codigo; }))
      .map(function(r){ return { value: r.codigo, label: r.nombre }; });
    const opcionesCriterio = (cat.criterios || []).filter(function(c){ return tipo && tipo.criterios.indexOf(c.codigo) >= 0; })
      .map(function(c){ return { value: c.codigo, label: c.nombre }; });
    // La altura incluye encabezado, filtros, avisos, encabezado de tabla y paginación;
    // el scroll debe quedar dentro de la grilla y no provocar scroll en toda la vista.
    const alto = Math.max(220, (typeof window !== 'undefined' ? window.innerHeight : 800) - 450);

    function barra(){
      return <div className='ir-bar'>
        <label className='ir-field'><span>Fecha de cálculo</span>
          <DatePicker value={ fechaCalculo } onChange={ setFechaCalculo } format='DD/MM/YYYY' allowClear={ false } style={{ width: 140 }} />
        </label>
        <label className='ir-field'><span>Tipo de ramo</span>
          <Select value={ tipoRamo } style={{ width: 220 }} onChange={ function(v){ elegirTipo(v); } }
            options={ (cat.tiposRamo || []).map(function(t){ return { value: t.codigo, label: t.nombre }; }) } />
        </label>
        <label className='ir-field'><span>Ramos</span>
          <Select mode='multiple' value={ ramosSel } style={{ minWidth: 260, maxWidth: 520 }} onChange={ setRamosSel }
            options={ opcionesRamo } optionFilterProp='label' maxTagCount={ 3 } placeholder='Seleccione ramos' />
        </label>
        { tab === 'vigentes'
          ? <Checkbox checked={ conCoberturas } onChange={ function(e){ setConCoberturas(e.target.checked); } }>Con coberturas</Checkbox>
          : null }
        { tab === 'cumulos'
          ? <label className='ir-field'><span>Cúmulo por</span>
              <Select value={ criterio } style={{ width: 180 }} onChange={ setCriterio } options={ opcionesCriterio } />
            </label>
          : null }
        { tab === 'cumulos'
          ? <Checkbox checked={ agrupaCumulo } onChange={ function(e){ setAgrupaCumulo(e.target.checked); } }>Mantener agrupación por ramo</Checkbox>
          : null }
        { tab === 'perfil'
          ? <label className='ir-field'><span>Tipo de rango</span>
              <Select value={ tipoRango } style={{ width: 150 }} onChange={ setTipoRango }
                options={ [{ value: 'AUTOMATICO', label: 'Automático' }, { value: 'DINAMICO', label: 'Dinámico' }] } />
            </label>
          : null }
        { tab === 'perfil'
          ? <Checkbox checked={ agrupaPerfil } onChange={ function(e){ setAgrupaPerfil(e.target.checked); } }>Mantener agrupación por ramo</Checkbox>
          : null }
        <Space>
          <Button type='primary' loading={ cargando } onClick={ calcular }>Calcular</Button>
          <Button loading={ exportando } disabled={ cargando || !resultados[tab] || !resultados[tab].filas.length } onClick={ exportar }>Exportar a Excel</Button>
        </Space>
      </div>;
    }

    function informe(clave){
      const r = resultados[clave];
      if (cargando) return <div style={{ padding: 24 }}><Spin /> Calculando...</div>;
      if (!r) return <Empty description='Elija los filtros y presione Calcular.' />;
      const paginaRemota = clave === 'vigentes' || (clave === 'cumulos' && r.criterio && Number(r.criterio.codigo) === 10);
      const totalFilas = paginaRemota && r.total !== undefined ? r.total : r.filas.length;
      if (!totalFilas) return <Empty description='No hay pólizas vigentes a la fecha para los ramos elegidos.' />;
      const defs = definicionesDe(r, clave);
      const columnas = columnasAntd(defs);
      const tz = r.trazabilidad || {};
      const origen = tz.origen || tz;
      const avisos = [];
      if (num(origen.polizasSinCesion) > 0) avisos.push(num(origen.polizasSinCesion) + ' pólizas vigentes sin cesión en el borderó (suma 100% de la póliza, reparto en cero).');
      if (num(origen.polizasConDescuadrePrima) > 0) avisos.push(num(origen.polizasConDescuadrePrima) + ' pólizas con prima sin distribuir de 1.00 o más: la prima suscrita (facturación) no coincide con la suma de primas de reaseguro del borderó (columna Prima sin distribuir).');
      if (num(tz.polizasSinRango) > 0) avisos.push(num(tz.polizasSinRango) + ' pólizas con suma en un hueco entre rangos (fila Sin rango).');
      return <div>
        <div className='ir-info'>
          { (clave === 'vigentes' ? totalFilas + ' pólizas vigentes' : (paginaRemota ? totalFilas : r.filas.length) + ' filas · ' + num(r.totales && r.totales.cantidad) + ' pólizas') +
            ' · fecha de cálculo ' + fecha(r.fecha) + ' · ' + r.segundos + ' s' }
        </div>
        { avisos.length ? <Alert type='info' showIcon style={{ marginBottom: 6, fontSize: 12 }} message={ avisos.join(' ') } /> : null }
          <div className='ir-grid'>
          <Table size='small' rowKey='clave' dataSource={ r.filas } columns={ columnas } bordered
            scroll={{ x: anchoDe(defs), y: clave === 'perfil' ? Math.max(220, alto - 30) : alto }}
            pagination={{ current: paginaRemota && r.pagina ? r.pagina : undefined, pageSize: paginaRemota && r.tamanoPagina ? r.tamanoPagina : undefined,
              total: paginaRemota && r.total !== undefined ? r.total : undefined, onChange: paginaRemota ? function(p, s){ cargarPagina(clave, p, s); } : undefined,
              defaultPageSize: 50, showSizeChanger: true, pageSizeOptions: ['20', '50', '100', '200'], size: 'small',
              showTotal: function(t){ return t + ' filas'; } }} />
        </div>
      </div>;
    }

    function panelRangos(){
      const opciones = opcionesClave();
      const juegos = {};
      rangos.forEach(function(r){ juegos[r.tipo + '|' + r.clave] = r; });
      const conJuego = Object.keys(juegos).map(function(k){ return juegos[k]; });
      function cambiar(i, campo, v){
        const copia = rgFilas.map(function(f){ return Object.assign({}, f); });
        copia[i][campo] = v;
        setRgFilas(copia);
      }
      return <div className='ir-rangos' style={{ maxWidth: 760 }}>
        <div className='ir-bar'>
          <label className='ir-field'><span>Tipo de rango</span>
            <Select value={ rgTipo } style={{ width: 150 }} onChange={ function(v){ setRgTipo(v); setRgClave('*'); } }
              options={ [{ value: 'AUTOMATICO', label: 'Automático' }, { value: 'DINAMICO', label: 'Dinámico' }] } />
          </label>
          <label className='ir-field'><span>Aplica a</span>
            <Select value={ rgClave } style={{ width: 420 }} onChange={ setRgClave } options={ opciones } showSearch optionFilterProp='label' />
          </label>
        </div>
        <div className='ir-info'>
          { rgTipo === 'AUTOMATICO'
            ? 'Automático: cada ramo o tipo de fianza usa su propio juego; si no tiene, usa el General.'
            : 'Dinámico: un único juego de rangos para todos los ramos.' }
          { rgClave !== '*' && !rgFilas.length ? ' Este elemento no tiene juego propio: hoy usa el General.' : '' }
        </div>
        { rgFilas.map(function(f, i){
            return <div className='ir-fila' key={ i }>
              <span style={{ width: 70, fontSize: 12 }}>{ 'Rango ' + (i + 1) }</span>
              <InputNumber value={ f.desde } min={ 0 } style={{ width: 200 }} placeholder='Desde'
                formatter={ function(v){ return txt(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','); } } parser={ function(v){ return txt(v).replace(/,/g, ''); } }
                onChange={ function(v){ cambiar(i, 'desde', v); } } />
              <InputNumber value={ f.hasta } min={ 0 } style={{ width: 200 }} placeholder='Hasta'
                formatter={ function(v){ return txt(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','); } } parser={ function(v){ return txt(v).replace(/,/g, ''); } }
                onChange={ function(v){ cambiar(i, 'hasta', v); } } />
              <Button size='small' danger onClick={ function(){ setRgFilas(rgFilas.filter(function(x, j){ return j !== i; })); } }>Quitar</Button>
            </div>;
          }) }
        <Space style={{ marginTop: 6 }}>
          <Button onClick={ function(){
            const ultimo = rgFilas.length ? num(rgFilas[rgFilas.length - 1].hasta) : -1;
            setRgFilas(rgFilas.concat([{ desde: ultimo + 1, hasta: null }]));
          } }>Agregar rango</Button>
          <Button type='primary' loading={ guardando } disabled={ !rgFilas.length } onClick={ function(){ guardarRangos(rgFilas); } }>Guardar</Button>
          { rgClave !== '*'
            ? <Button danger disabled={ guardando || !rangos.some(function(r){ return r.tipo === rgTipo && r.clave === rgClave; }) }
                onClick={ function(){ guardarRangos([]); } }>Quitar juego propio</Button>
            : null }
        </Space>
        <div className='ir-info' style={{ marginTop: 12 }}>
          { 'Juegos definidos: ' }
          { conJuego.map(function(r){
              return <Tag key={ r.tipo + r.clave } style={{ cursor: 'pointer' }} color={ r.tipo === 'DINAMICO' ? 'purple' : 'blue' }
                onClick={ function(){ setRgTipo(r.tipo); setRgClave(r.clave); } }>
                { (r.tipo === 'DINAMICO' ? 'Dinámico' : 'Automático') + ' · ' + (r.descripcion || r.clave) }
              </Tag>;
            }) }
        </div>
      </div>;
    }

    return <div className='ir-view'>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Modal visible={ exportando } footer={ null } closable={ false } maskClosable={ false } centered width={ 280 }>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <Spin size='large' />
          <span>{'Exportando informe...'}</span>
        </div>
      </Modal>
      <div className='ir-title'>Informe de Reaseguro</div>
      <Tabs className='ir-tabs' activeKey={ tab } onChange={ setTab } items={ [
        { key: 'vigentes', label: 'Pólizas Vigentes', children: <div>{ barra() }{ informe('vigentes') }</div> },
        { key: 'cumulos', label: 'Cúmulos', children: <div>{ barra() }{ informe('cumulos') }</div> },
        { key: 'perfil', label: 'Perfil de Cartera', children: <div>{ barra() }{ informe('perfil') }</div> },
        { key: 'rangos', label: 'Rangos del Perfil', children: panelRangos() }
      ] } />
    </div>;
  };

  return <App />;
}
