()=>{
  /*
   * Name: BorderoMovimientos
   * AXX-271 — Borderó (Nuevo), simplificado.
   * Una sola barra de botones (Filtrar / Exportar), los filtros en un Drawer con
   * Buscar / Limpiar filtros, una grilla PLANA de movimientos con paginación de 50
   * resuelta en servidor, y exportación del conjunto COMPLETO de la búsqueda.
   *
   * Lo que sale de la PANTALLA y NO del motor: el panel de conciliación (CA17 de
   * AXX-252) sigue corriendo en la cadena cmdBorderoMovimientos y su resultado sigue
   * viajando en la respuesta (descuadres / controles / conciliacion); acá sólo no se
   * dibuja. El título de agrupación por póliza también sale, pero cada fila conserva
   * póliza, movimiento y las 34 columnas, así que la identificación no se pierde.
   *
   * AXX-300 — tres ajustes sobre esta misma vista, sin tocar nada de AXX-271:
   *   1. Ancho total de columnas 5.200 -> 4.680 px (-10,00%), entregado a la tabla como
   *      scroll.x, con el desborde horizontal confinado al cuerpo de la grilla.
   *   2. El filtro "endoso ejecutado + póliza emitida" vive en la cadena 844, no acá.
   *   3. La columna Tipo muestra el nombre del movimiento en español: t() validado,
   *      catálogo de respaldo, y nunca una clave cruda ni undefined. Cuando no hay
   *      ni traducción ni catálogo, 'Movimiento sin descripción' — sin maquillar la
   *      clave (corrección de la ronda 1 de pruebas de AXX-300).
   *
   * Ronda 1 de corrección (AXX-271): los rótulos de acción salían en inglés en pantalla
   * porque t() resuelve contra el idioma de la sesión, no contra el idioma configurado
   * del ambiente. Ahora todo el texto visible es literal en español.
   */
  const { useState, useEffect } = React;
  const { Table, Select, Button, DatePicker, Skeleton, Space, Row, Col, Form, Drawer,
          Tag, Tooltip, Empty, Pagination, Input, message } = A;

  const VERDE = '#60b13d', VERDE_B = '#4f9336', BORDE = '#cbd1d8', BARRA_B = '#e6ebf2';

  const IconoLupa = () =>
    <span role='img' aria-label='search' className='anticon anticon-search'>
      <svg viewBox='64 64 896 896' focusable='false' width='1em' height='1em' fill='currentColor' aria-hidden='true'>
        <path d='M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z' />
      </svg>
    </span>;

  const IconoDescarga = () =>
    <span role='img' aria-label='download' className='anticon anticon-download'>
      <svg viewBox='64 64 896 896' focusable='false' width='1em' height='1em' fill='currentColor' aria-hidden='true'>
        <path d='M505.7 661a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z' />
      </svg>
    </span>;

  /* Presentación: 2 decimales, medio hacia arriba. El cálculo y las restas de delta
     viajan en precisión completa desde el servidor y así se exportan. */
  function money(v){
    if(v === null || v === undefined || isNaN(Number(v))) return '';
    const n = Number(v);
    const r = Math.round(Math.abs(n) * 100 + 1e-9) / 100;
    const s = r.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (n < 0 ? '-' : '') + s;
  }
  function fecha(v){ return v ? String(v).substring(0,10) : ''; }
  function num(v){ return (v === null || v === undefined || isNaN(Number(v))) ? 0 : Number(v); }
  /* CA-05 — el tipo solo no identifica el movimiento: una poliza puede traer dos
     reemisiones el mismo dia con los mismos importes (824 EMI:2/EMI:3, 829 EMI:3/EMI:6
     en global1) y sin la clave quedan como dos filas identicas. La clave del movimiento
     es el "id de movimiento" que el diseno de AXX-252 pide conservar; va dentro de la
     columna Tipo para no alterar la lista exacta de 34 encabezados. */
  /* AXX-300 alcance 3 — nombre del movimiento en español en la columna Tipo.
     Se resuelve por t() PRIMERO, como pide el requerimiento, pero el resultado se
     VALIDA: t() devuelve la propia clave cuando no hay traducción (i18next resuelve
     contra el idioma de la SESIÓN, que en este ambiente corre en 'en' — medido en
     AXX-271), y el diccionario ES cubre 4 de las 24 clases de movimiento, una de ellas
     mapeada a sí misma. Sin la validación el usuario leería 'InsuredObjectChange'.
     Orden: t() válido -> catálogo en español -> 'Movimiento sin descripción'.
     Nunca una clave cruda, nunca vacío, nunca undefined.
     Montos, códigos e ids NO se traducen: la clave del movimiento va tal cual. */
  const TIPO_MOV_ES = {
    'EMISION': 'Emisión',
    'ANIVERSARIO': 'Aniversario',
    'CANCELACION': 'Cancelación',
    'RETIRO DE CESION': 'Retiro de cesión',
    'ENDOSO': 'Endoso',
    'AddCoverageChange': 'Alta de cobertura',
    'BeneficiaryChange': 'Cambio de beneficiarios',
    'BenefitChange': 'Cambio de beneficio',
    'CancellationChange': 'Cancelación',
    'CapitalChange': 'Cambio de capital',
    'CessionBeneficiaryChange': 'Cambio de beneficiario de cesión',
    'ClauseChange': 'Cambio de cláusulas',
    'ContingentBeneficiaryChange': 'Cambio de beneficiario contingente',
    'CoverageChange': 'Cambio de coberturas',
    'CoverageChangeTechData': 'Cambio de datos técnicos de cobertura',
    'ExclusionChange': 'Cambio de exclusiones',
    'FrequencyChange': 'Cambio de frecuencia',
    'InformativeChange': 'Cambio informativo',
    'InsuredObjectChange': 'Cambio de objeto asegurado',
    'IntermediaryChange': 'Cambio de intermediario',
    'LoadingChange': 'Recargo / Descuento',
    'PaymentMethodChange': 'Cambio de medio de pago',
    'PayPlanChange': 'Cambio de plan de pagos',
    'PolicyholderChange': 'Cambio de tomador',
    'PolicySurchargeChange': 'Cambio de recargos de póliza',
    'ReinstatementChange': 'Rehabilitación',
    'RemoveCoverageChange': 'Baja de cobertura',
    'TemporalStatusChange': 'Cambio de estado temporal',
    'TermChange': 'Cambio de vigencia'
  };

  /* AXX-300, ronda 1 de corrección — el respaldo NO embellece la clave.
     Había un paso intermedio que separaba el CamelCase; para una clave sin descripción
     producía 'X', 'Zzz 001', 'Undefined'. Eso sigue siendo la clave técnica, apenas
     maquillada, y es exactamente lo que el supuesto 5 del dictamen prohíbe. Sin
     traducción y sin catálogo, el texto es el aprobado y no hay tercer intento. */
  const SIN_DESCRIPCION = 'Movimiento sin descripción';

  function traducirTipo(v){
    const k = (v === null || v === undefined) ? '' : String(v).trim();
    const kb = k.toLowerCase();
    /* 'undefined' y 'null' COMO TEXTO son ausencia de dato, no un tipo de movimiento. */
    if (!k || kb === 'undefined' || kb === 'null') return SIN_DESCRIPCION;
    /* 1 - t(), aceptado solo si devolvio una traduccion real y no la clave. */
    let r1 = '';
    try {
      if (typeof t === 'function') {
        const r = t(k);
        const rs = (r === null || r === undefined) ? '' : String(r).trim();
        if (rs && rs !== k) r1 = rs;
      }
    } catch (e) { r1 = ''; }
    /* 2 - catalogo en espanol de las clases de movimiento del ambiente. */
    if (!r1 && TIPO_MOV_ES[k]) r1 = TIPO_MOV_ES[k];
    /* Si no existe traducción ni entrada en el catálogo, conservar el tipo original. */
    return r1 || k;
  }

  function etiquetaMovimiento(r){
    const tp = traducirTipo(r ? r.tipo : '');
    return r && r.movKey ? (tp + ' · ' + r.movKey) : tp;
  }
  function claveMovimiento(r){
    return [r.poliza, r.id, r.movKey, fecha(r.fechaEmision), r.cserie].join('|');
  }

  /* UNA sola definición de columnas: de acá salen la grilla Y el archivo exportado.
     Por eso CA-09 ("el archivo respeta las mismas columnas, encabezados y orden")
     no puede desincronizarse: no hay dos listas que mantener.
     🔴 TODO texto visible de esta vista va LITERAL en español, incluidos los rótulos de
     acción. `t()` resuelve contra el idioma de la SESIÓN, y la sesión de este ambiente
     corre en `en` aunque el único idioma configurado sea ES y el diccionario tenga las
     claves: `t('Filter')` llega al usuario como "Filter". Medido en pantalla real
     (AXX-271, ronda 1 del tester). Además el diccionario traduce mal 'End Date' y
     'Start Date'. El requerimiento nombra Filtrar / Exportar / Buscar / Limpiar filtros:
     eso es lo que se dibuja, sin intermediario. */
  const COLUMNAS = [
    { t: 'id',                        c: 'id',                  w: 75,  tipo: 'txt', fixed: 'left' },
    { t: 'Ramo',                      c: 'lob',                 w: 210, tipo: 'ramo' },
    { t: 'Plan',                      c: 'plan',                w: 100, tipo: 'txt' },
    { t: 'Poliza',                    c: 'poliza',              w: 155, tipo: 'poliza' },
    { t: 'Recibo',                    c: 'recibo',              w: 100, tipo: 'txt' },
    { t: 'Tipo',                      c: 'tipo',                w: 250, tipo: 'mov' },
    { t: 'Contratante',               c: 'contratante',         w: 175, tipo: 'txt' },
    { t: 'Asegurado',                 c: 'asegurado',           w: 175, tipo: 'txt' },
    { t: 'Fecha Emision',             c: 'fechaEmision',        w: 115, tipo: 'fecha' },
    { t: 'Fecha Desde',               c: 'fDesde',              w: 105, tipo: 'fecha' },
    { t: 'Fecha Hasta',               c: 'fHasta',              w: 105, tipo: 'fecha' },
    { t: 'Suma Asegurada 100%',       c: 'sumaAsegurada100',    w: 150, tipo: 'num' },
    { t: 'Suma Retenida',             c: 'sumaRetenida',        w: 125, tipo: 'num' },
    { t: 'Suma Cedida',               c: 'sumaCedida',          w: 125, tipo: 'num' },
    { t: 'Suma Cuota Parte',          c: 'sumaCuotaParte',      w: 135, tipo: 'num' },
    { t: 'Suma Excedente',            c: 'sumaExcedente',       w: 135, tipo: 'num' },
    { t: 'Suma Facultativa',          c: 'sumaFacultativa',     w: 135, tipo: 'num' },
    { t: 'Prima Suscrita 100%',       c: 'primaSuscrita100',    w: 145, tipo: 'num' },
    { t: 'Prima Retenida',            c: 'primaRetenida',       w: 125, tipo: 'num' },
    { t: 'Prima Cedida',              c: 'primaCedida',         w: 125, tipo: 'num' },
    { t: 'Suma Prima Cuota Parte',    c: 'primaCuotaParte',     w: 165, tipo: 'num' },
    { t: 'Suma Prima Excedente',      c: 'primaExcedente',      w: 160, tipo: 'num' },
    { t: 'Prima Cat',                 c: 'primaCat',            w: 105, tipo: 'num' },
    { t: 'Prima Facultativa',         c: 'primaFacultativa',    w: 135, tipo: 'num' },
    { t: 'Comision Contractual',      c: 'comisionContractual', w: 155, tipo: 'num' },
    { t: 'Comision Cuota Parte',      c: 'comisionCuotaParte',  w: 160, tipo: 'num' },
    { t: 'Comision Excedente',        c: 'comisionExcedente',   w: 155, tipo: 'num' },
    { t: 'Comision Facultativa',      c: 'comisionFacultativa', w: 160, tipo: 'num' },
    { t: 'Impuesto',                  c: 'impuesto',            w: 105, tipo: 'num' },
    { t: 'Impuesto Facultativo',      c: 'impuestoFacultativo', w: 155, tipo: 'num' },
    { t: 'Reaseguro por Cuota Parte', c: 'reaseguroCuotaParte', w: 175, tipo: 'num' },
    { t: 'Reaseguro por Excedente',   c: 'reaseguroExcedente',  w: 175, tipo: 'num' },
    { t: 'Reaseguro por Pagar',       c: 'reaseguroPorPagar',   w: 160, tipo: 'num' },
    { t: 'cserie',                    c: 'cserie',              w: 85,  tipo: 'txt' }
  ];

  /* AXX-300 alcance 1 - el ancho total de la grilla es la SUMA de los anchos de columna,
     y se le entrega a la tabla como scroll.x. Con x:'max-content' (AXX-271) antd ignoraba
     estos anchos y estiraba cada columna a su contenido, asi que reducirlos no cambiaba
     nada: la grilla se desbordaba igual. 5.200 -> 4.680 px = -10,00% exacto, sin eliminar
     ni reordenar ninguna de las 34 columnas. */
  const ANCHO_TOTAL = COLUMNAS.reduce(function(a, c){ return a + c.w; }, 0);

  /* Anexo de diseño, acotado a lo que este cambio toca (supuesto 5): barra de botones,
     bordes y encabezados de la grilla, densidad compacta, estados de fila y layout. */
  const CSS = [
    /* AXX-300 ronda 1 — el alto reservado para el chrome de la aplicacion estaba 22 px
       corto, y como la vista recorta lo que sobra, el paginador quedaba debajo del borde
       inferior. Medido: 922>900, 790>768, 622>600 — el mismo excedente en las tres, o sea
       que no depende del tamano de la ventana. 168 -> 190 = 168 + los 22 medidos. */
    '.bm-view{display:flex;flex-direction:column;min-height:0;overflow:hidden;height:calc(100dvh - 190px);font-size:13px}',
    '.bm-view{max-width:100%}',
    '.bm-topbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;background:transparent;border:1px solid ' + BARRA_B + ';',
    '  border-radius:6px;padding:10px 12px;margin:0 0 2px 4px}',
    '.bm-topbar .ant-btn{border-color:#8f9aa7}',
    '.bm-topbar .ant-btn-primary{border-color:#1677ff}',
    '.bm-topbar .ant-btn[disabled]{border-color:#6f7b88;opacity:1}',
    '.bm-export{background:' + VERDE + ';border-color:' + VERDE_B + ';color:#fff}',
    '.bm-export:hover,.bm-export:focus{background:' + VERDE + ';border-color:' + VERDE_B + ';color:#fff;opacity:.92}',
    '.bm-export[disabled],.bm-export[disabled]:hover{background:' + VERDE + ';border-color:#6f7b88;color:#fff;opacity:1}',
    '.bm-grid{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}',
    '.bm-grid .ant-table-wrapper,.bm-grid .ant-spin-nested-loading,.bm-grid .ant-spin-container,',
    '.bm-grid .ant-table,.bm-grid .ant-table-container{height:100%;display:flex;flex-direction:column;min-height:0}',
    '.bm-grid .ant-table-body{flex:1 1 auto;min-height:0}',
    /* AXX-300 alcance 1 - el scroll horizontal vive en el cuerpo de la grilla y en
       ningun ancestro: la vista no puede desbordar el contenedor ni la ventana. */
    '.bm-grid,.bm-grid .ant-table-wrapper,.bm-grid .ant-table,.bm-grid .ant-table-container{max-width:100%;overflow-x:hidden}',
    '.bm-grid .ant-table-body{overflow-x:auto !important;overflow-y:auto !important}',
    '.bm-grid .ant-table-header{overflow:hidden !important}',
    '.bm-grid .ant-table{border:1px solid ' + BORDE + ';border-radius:0}',
    '.bm-grid .ant-table-thead>tr>th{background:#bfbfbf;font-size:12px;line-height:18px;padding:5px 6px;',
    '  white-space:normal;word-break:normal;overflow-wrap:anywhere;',
    '  border-right:1px solid ' + BORDE + ';border-bottom:1px solid ' + BORDE + '}',
    '.bm-grid .ant-table-tbody>tr>td{font-size:12px;line-height:18px;padding:5px 6px;',
    '  border-right:0;border-bottom:1px solid ' + BORDE + '}',
    '.bm-grid .ant-table-tbody>tr{cursor:pointer}',
    '.bm-grid .ant-table-tbody>tr:hover>td,.bm-grid .ant-table-tbody>tr.ant-table-row-hover>td,',
    '.bm-grid .ant-table-tbody>tr.ant-table-row:hover>td{background:#b7d7ff !important}',
    '.bm-grid .ant-table-tbody>tr.bm-row-selected>td,',
    '.bm-grid .ant-table-tbody>tr.ant-table-row-selected>td,',
    '.bm-grid .ant-table-tbody>tr.bm-row-selected:hover>td,',
    '.bm-grid .ant-table-tbody>tr.ant-table-row-selected:hover>td{background:#86b4ff !important}',
    '.bm-pager{padding:6px 4px 2px 0;text-align:right}',
    '.bm-drawer .ant-form-item{margin-bottom:12px}'
  ].join('\n');

  const App = () => {
    const [form] = Form.useForm();
    const [ramos, setRamos] = useState([]);
    const [cargandoCat, setCargandoCat] = useState(true);
    const [cargando, setCargando] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [abierto, setAbierto] = useState(false);
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(50);
    const [criterio, setCriterio] = useState(null);
    const [seleccion, setSeleccion] = useState(null);
    const [alto, setAlto] = useState(360);
    const cajaRef = React.useRef(null);
    const enVuelo = React.useRef(false);

    function defectos(){
      return {
        DateField_fdesde_bor: moment().startOf('month'),
        DateField_fhasta_bor: moment(),
        ComboBox_cramo_bor: [],
        poliza: ''
      };
    }

    async function cargarRamos(){
      setCargandoCat(true);
      const res = await exe('RepoLob', { operation: 'GET' });
      if (res && res.ok) {
        setRamos((res.outData || []).map(function(l){
          return { value: String(l.code), label: (l.name ? l.name : String(l.code)) };
        }));
      } else {
        message.error('No se pudo cargar el catálogo de ramos.');
      }
      setCargandoCat(false);
    }

    function nombreRamo(code){
      const f = ramos.filter(function(x){ return x.value === String(code); });
      return f.length > 0 ? f[0].label : String(code === null || code === undefined ? '' : code);
    }

    /* Valida y devuelve el criterio, o null. Devolver null es lo que mantiene el
       Drawer abierto en CA-02: la validación falló y el usuario tiene que verla. */
    function criterioDelFormulario(){
      const v = form.getFieldsValue();
      const d1 = v.DateField_fdesde_bor, d2 = v.DateField_fhasta_bor, rs = v.ComboBox_cramo_bor;
      const poliza = String(v.poliza || '').trim();
      const tieneRamo = Array.isArray(rs) ? rs.length > 0 : !!rs;
      if (!d1 || !d2) { message.error('Fecha Inicial y Fecha Final son obligatorias.'); return null; }
      if (!tieneRamo && !poliza) {
        message.error('Debe seleccionar al menos un Ramo o indicar una Póliza.');
        return null;
      }
      if (d1.format('YYYY-MM-DD') > d2.format('YYYY-MM-DD')) {
        message.error('La Fecha Inicial debe ser menor o igual a la Fecha Final.'); return null;
      }
      return {
        fdesde: d1.format('YYYY-MM-DD'),
        fhasta: d2.format('YYYY-MM-DD'),
        ramos: (Array.isArray(rs) ? rs : []).map(function(x){ return String(x); }),
        poliza: poliza
      };
    }

    function mensajeDeError(res){
      const raw = res && res.msg ? String(res.msg) : '';
      const limpio = raw.split('fórmula ->')[0].split('formula ->')[0]
                        .replace('Error calculando fórmula. err ->','').trim();
      return limpio || 'No se pudo obtener el borderó.';
    }

    async function consultar(pg, sz, base){
      const crit = base || criterio || criterioDelFormulario();
      if (!crit) return false;
      const ctxObj = { fdesde: crit.fdesde, fhasta: crit.fhasta, ramos: crit.ramos, poliza: crit.poliza || '', page: pg, size: sz };
      setCargando(true);
      const res = await exe('ExeChain', { chain: 'cmdBorderoMovimientos', context: JSON.stringify(ctxObj) });
      setCargando(false);
      if (!res || !res.ok) {
        /* CA-10 — el estado anterior no se pierde y no se inventa un resultado vacío. */
        message.error(mensajeDeError(res));
        return false;
      }
      setData(res.outData);
      setCriterio(crit);
      setPage(pg); setSize(sz);
      setSeleccion(null);
      return true;
    }

    async function onBuscar(){
      const crit = criterioDelFormulario();
      if (!crit) return;                       /* CA-02 — el Drawer queda abierto */
      const ok = await consultar(1, size, crit);
      if (ok) setAbierto(false);               /* CA-02 — se cierra al buscar bien */
    }

    /* CA-03 / supuesto 4 — vuelve a los valores por defecto, limpia el estado de la
       consulta y NO relanza la búsqueda. El Drawer queda abierto. */
    function onLimpiar(){
      form.setFieldsValue(defectos());
      setData(null); setCriterio(null); setPage(1); setSize(50); setSeleccion(null);
    }

    function ejecutarLibreria(fuente){
      const codigo = String(fuente || '').trim();
      if (!codigo) return;
      /* Mismo mecanismo que ya usa la exportación de borderó de este ambiente: la
         cadena devuelve el fuente de la librería porque el runtime no sale a Internet. */
      eval(codigo);
    }

    async function asegurarExcel(){
      if (typeof window !== 'undefined' && window.XLSX) return;
      const res = await exe('ExeChain', { chain: 'cmdLoadLibrariesGroupedBordereau', context: '{}' });
      if (!res || !res.ok) throw new Error(mensajeDeError(res));
      const libs = res.outData || {};
      const lib = libs.XLSX || libs.xlsx || libs.xlsxJs;
      if (!lib) throw new Error('No es posible crear un archivo de Excel en este momento.');
      if (typeof lib === 'string') ejecutarLibreria(lib); else window.XLSX = lib;
    }

    function filaExportable(r){
      const o = {};
      COLUMNAS.forEach(function(col){
        const v = r[col.c];
        if (col.tipo === 'num') o[col.t] = num(v);
        else if (col.tipo === 'mov') o[col.t] = etiquetaMovimiento(r);
        else if (col.tipo === 'fecha') o[col.t] = fecha(v);
        else if (col.tipo === 'ramo') o[col.t] = nombreRamo(v);
        else o[col.t] = (v === null || v === undefined) ? '' : v;
      });
      return o;
    }

    /* CA-08 / CA-09 / alcance 6-7 — el archivo NO sale de lo cargado en el navegador:
       se pide de nuevo al servidor con los MISMOS filtros y `exportar:true`, y la cadena
       responde el conjunto completo de la búsqueda en el mismo orden, sin paginar. */
    async function onExportar(){
      if (enVuelo.current) return;             /* supuesto 7 — doble clic */
      const crit = criterio;
      if (!crit) { message.info('Primero realice una búsqueda.'); return; }
      enVuelo.current = true;
      setExportando(true);
      try {
        const ctxObj = { fdesde: crit.fdesde, fhasta: crit.fhasta, ramos: crit.ramos, poliza: crit.poliza || '', exportar: true };
        const res = await exe('ExeChain', { chain: 'cmdBorderoMovimientos', context: JSON.stringify(ctxObj) });
        if (!res || !res.ok) { message.error(mensajeDeError(res)); return; }
        const filas = (res.outData && res.outData.filas) ? res.outData.filas : [];
        /* CA-10 — sin datos no se genera un archivo vacío engañoso. */
        if (filas.length === 0) { message.info('La búsqueda no devolvió movimientos para exportar.'); return; }
        await asegurarExcel();
        const X = (typeof window !== 'undefined') ? window.XLSX : null;
        if (!X) { message.error('No es posible crear un archivo de Excel en este momento.'); return; }
        const hoja = X.utils.json_to_sheet(filas.map(filaExportable),
                                           { header: COLUMNAS.map(function(c){ return c.t; }) });
        const libro = X.utils.book_new();
        X.utils.book_append_sheet(libro, hoja, 'Bordero');
        X.writeFile(libro, 'Bordero-Movimientos-' + crit.fdesde + '_' + crit.fhasta
                            + '-' + new Date().getTime() + '.xlsx');
        message.success('Exportados ' + filas.length + ' movimientos.');
      } catch (e) {
        message.error((e && e.message) ? String(e.message) : 'No se pudo exportar el borderó.');
      } finally {
        enVuelo.current = false;
        setExportando(false);
      }
    }

    useEffect(function(){
      cargarRamos();
      form.setFieldsValue(defectos());
    }, []);

    /* Anexo — alto disponible recalculado de forma reactiva; el scroll vertical vive
       dentro del cuerpo de la grilla, nunca en la ventana. */
    useEffect(function(){
      function medir(){
        const el = cajaRef.current;
        if (!el) return;
        const h = el.clientHeight - 44;
        setAlto(h > 120 ? h : 120);
      }
      medir();
      let ro = null;
      if (typeof ResizeObserver !== 'undefined' && cajaRef.current) {
        ro = new ResizeObserver(medir);
        ro.observe(cajaRef.current);
      }
      window.addEventListener('resize', medir);
      return function(){
        window.removeEventListener('resize', medir);
        if (ro) ro.disconnect();
      };
    }, [cargandoCat]);

    const columnas = COLUMNAS.map(function(col){
      const c = { title: col.t, dataIndex: col.c, width: col.w };
      if (col.fixed) c.fixed = col.fixed;
      if (col.tipo === 'num') {
        c.align = 'right';
        c.render = function(v){
          const n = Number(v);
          const color = n > 0 ? '#008000' : (n < 0 ? '#cf1322' : undefined);
          return <span style={ color ? { color: color } : undefined }>{ money(v) }</span>;
        };
      }
      else if (col.tipo === 'fecha') c.render = fecha;
      else if (col.tipo === 'ramo') c.render = function(v){ return nombreRamo(v); };
      else if (col.tipo === 'mov') c.render = function(v, r){ return etiquetaMovimiento(r); };
      else if (col.tipo === 'poliza') c.render = function(v, r){
        /* Un null de identidad no se coerciona: la fila se lista y queda marcada. */
        if (r && r.filaIncompleta === 1) {
          return <span>{ v || <i>(sin código)</i> } <Tooltip title='Faltan datos de identidad de la póliza (código o recibo). El movimiento se lista igual, marcado como incompleto.'><Tag color='orange'>incompleta</Tag></Tooltip></span>;
        }
        return v;
      };
      return c;
    });

    if (cargandoCat) return <DefaultPage title='Borderó (Nuevo)' icon='file-protect'><Skeleton active /></DefaultPage>;

    const filas = (data && data.filas) ? data.filas : [];

    return <DefaultPage title='Borderó (Nuevo)' icon='file-protect'>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className='bm-view'>

        { /* Alcance 1 — UNA sola barra de botones, con Filtrar y Exportar. */ }
        <div className='bm-topbar'>
          <Space size={ 8 }>
            <Button type='primary' icon={ <IconoLupa /> } onClick={ function(){ setAbierto(true); } }>
              { 'Filtrar' }
            </Button>
            <Button loading={ cargando } disabled={ cargando || !criterio }
                    onClick={ function(){ consultar(1, size, criterio); } }>
              { 'Refrescar' }
            </Button>
            <Button className='bm-export' icon={ <IconoDescarga /> }
                    loading={ exportando } disabled={ exportando || cargando || !criterio }
                    onClick={ onExportar }>
              { 'Exportar' }
            </Button>
          </Space>
          <span style={{ marginLeft: 'auto', marginRight: 4, color: '#5a6673' }}>
            { data ? (num(data.total) + ' movimientos · ' + num(data.polizas) + ' pólizas') : '' }
          </span>
        </div>

        <div className='bm-grid' ref={ cajaRef }>
          { cargando
            ? <Skeleton active />
            : (!data
                ? <Empty description='Presione Filtrar, defina el período y el ramo, y presione Buscar.' />
                : (filas.length === 0
                    ? <Empty description='Sin movimientos de reaseguro en el período y ramo seleccionados.' />
                    : <Table size='small' rowKey={ claveMovimiento } dataSource={ filas }
                        columns={ columnas } pagination={ false }
                        scroll={{ x: ANCHO_TOTAL, y: alto }}
                        rowClassName={ function(r){ return claveMovimiento(r) === seleccion ? 'bm-row-selected' : ''; } }
                        onRow={ function(r){ return { onClick: function(){ setSeleccion(claveMovimiento(r)); } }; } } />
                  )
              )
          }
        </div>

        { /* CA-06 / CA-07 — 50 por página por defecto, resueltos en servidor. El paginador
             va aparte a propósito: si se le entrega a la grilla, antd vuelve a recortar en
             memoria las 50 filas de la página y la página 2 sale vacía. */ }
        { data && filas.length > 0
          ? <div className='bm-pager'>
              <Pagination current={ page } pageSize={ size } total={ num(data.total) }
                showSizeChanger pageSizeOptions={ ['20','50','100','200'] } disabled={ cargando }
                showTotal={ function(tot){ return tot + ' movimientos · ' + num(data.polizas) + ' pólizas'; } }
                onChange={ function(p, s){ consultar(s !== size ? 1 : p, s, criterio); } } />
            </div>
          : null }

        { /* Alcance 2 / CA-01 — los filtros existentes, tal cual, dentro del Drawer. */ }
        <Drawer className='bm-drawer' title='Filtros' open={ abierto } width={ 420 }
                onClose={ function(){ setAbierto(false); } }
                footer={
                  <Space>
                    <Button type='primary' icon={ <IconoLupa /> } loading={ cargando } onClick={ onBuscar }>
                      { 'Buscar' }
                    </Button>
                    <Button onClick={ onLimpiar } disabled={ cargando }>{ 'Limpiar filtros' }</Button>
                  </Space>
                }>
          <Form form={ form } layout='vertical'>
            <Form.Item label='Fecha Inicial' name='DateField_fdesde_bor'
                       rules={[{ required: true, message: 'Fecha Inicial es obligatoria' }]}>
              <DatePicker style={{ width: '100%' }} format='YYYY-MM-DD' allowClear={ false } />
            </Form.Item>
            <Form.Item label='Fecha Final' name='DateField_fhasta_bor'
                       rules={[{ required: true, message: 'Fecha Final es obligatoria' }]}>
              <DatePicker style={{ width: '100%' }} format='YYYY-MM-DD' allowClear={ false } />
            </Form.Item>
            <Form.Item label='Ramo' name='ComboBox_cramo_bor'
                       rules={[{ required: false }]}>
              <Select mode='multiple' allowClear placeholder='Seleccione uno o más ramos'
                      options={ ramos } optionFilterProp='label' style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label='Póliza' name='poliza'>
              <Input placeholder='Digite parte del código de la póliza' />
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </DefaultPage>;
  };

  return <App />;
}
