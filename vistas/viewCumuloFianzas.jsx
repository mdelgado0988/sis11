/**
 * @author aiden_sa_3
 * @created 2026-09-04
 * @modified 2026-09-07  revision 3 — corrige separación de paneles (CA-08) y recorte (CA-09)
 * @summary Consulta de Cumulo de Fianzas — busca un contacto y muestra sus fianzas vigentes
 *          con la participacion directa o proporcional derivada de consorcios (formulario 611).
 * @name viewCumuloFianzas
 * @version 3.0.0
 * @origin AXX-251 / jira GLOB-1214
 *
 * SOLO CONSULTA: la vista no emite ningun comando de escritura (CA18 rev1).
 * Reglas de calculo intactas: viven en la cadena 841, esta vista no las toca.
 *
 * Notas de motor (react-live -> buble), las dos aprendidas a golpes:
 *  - NO usar arrow functions async: buble le come el `async` y la vista no abre.
 *  - buble NO decodifica entidades HTML en JSX: `&nbsp;` se renderiza literal.
 *    Va `{' '}`.
 *
 * Correccion r3:
 *  - El panel inactivo volvia a verse porque `.ant-tabs-tabpane { display:flex }` (3 clases)
 *    le ganaba a `.ant-tabs-tabpane-hidden { display:none }` (1 clase) de antd, y
 *    `.ant-tabs-content { display:flex }` los ponia uno al lado del otro. Ahora solo se
 *    estiliza el panel ACTIVO y se reafirma el ocultamiento del inactivo.
 *  - El alto/ancho de la grilla los maneja antd con `scroll={{x,y}}`, no una cadena de
 *    contenedores flex: `y` se mide contra el viewport real y `x` habilita el
 *    desplazamiento horizontal dentro de la grilla en vez de empujar el panel.
 */
() => {
  const { Table, Form, Row, Col, Input, Select, Button, Space, Card, Alert, Spin,
          Tag, Empty, Typography, Drawer, Tabs } = A;
  const { Column } = Table;
  const { Option } = Select;
  const { Text } = Typography;
  const { TabPane } = Tabs;

  // antd 4 no exporta Icon; el ambiente dibuja los iconos como SVG inline (igual que la vista 26).
  const svg = (d) => (
    <span role="img" className="anticon">
      <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d={d} />
      </svg>
    </span>
  );
  const IcoBuscar = () => svg('M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z');
  const IcoActualizar = () => svg('M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z');

  const CRITERIOS_VACIOS = {
    noCobis: '', noSis: '', grupoEconomico: '', cnp: '', nif: '',
    nombrePersona: '', surname2: ''
  };

  const [criterios, setCriterios] = useState(CRITERIOS_VACIOS);
  const [grupos, setGrupos] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [contactoSel, setContactoSel] = useState(null);
  const [filas, setFilas] = useState([]);
  const [totalCumulo, setTotalCumulo] = useState(null);
  const [totalesMoneda, setTotalesMoneda] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const [cargandoCumulo, setCargandoCumulo] = useState(false);
  const [error, setError] = useState(null);
  const [errorFiltros, setErrorFiltros] = useState(null);
  const [buscado, setBuscado] = useState(false);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [pestana, setPestana] = useState('busqueda');
  const [altoGrilla, setAltoGrilla] = useState(260);

  const refBusq = React.useRef(null);
  const refCum = React.useRef(null);

  // Ancho total de cada grilla: con el se habilita el desplazamiento horizontal DENTRO
  // de la grilla en vez de que el panel crezca y se salga del area visible.
  const ANCHO_CONTACTOS = 910;
  const ANCHO_CUMULO = 1810;

  useEffect(function () {
    exe('GetFullTable', { table: 'cfgGrupoEconomico' }).then(function (r) {
      if (r && r.ok && r.outData && r.outData.length > 1) {
        const fs = r.outData.slice(1);
        setGrupos(fs.filter(function (f) { return f[2] === '1' || f[2] === 1; })
                    .map(function (f) { return { id: f[0], nombre: f[1] }; }));
      }
    });
  }, []);

  // El limite real no es el viewport sino el contenedor desplazable de la pagina
  // (en la SPA, el area de contenido). Se busca el ancestro que efectivamente scrollea.
  function contenedorDesplazable(nodo) {
    let n = nodo.parentElement;
    while (n && n !== document.body) {
      const ov = window.getComputedStyle(n).overflowY;
      if (ov === 'auto' || ov === 'scroll') return n;
      n = n.parentElement;
    }
    return null;
  }

  // Alto disponible: TODO se mide, nada se estima.
  // El "fuera del cuerpo" (encabezado fijo, paginacion, pie del total, bordes y margenes)
  // se obtiene restando el cuerpo desplazable al contenedor, asi que no depende de que
  // pestana este activa ni de cuantas lineas ocupen los titulos tras un redimensionado.
  function medirAlto() {
    const ref = pestana === 'cumulo' ? refCum.current : refBusq.current;
    if (!ref) return;
    // Se mide desde el PANEL, no desde el div interno: asi el relleno del card y los
    // bordes que quedan por debajo de la grilla entran en el descuento y no hace falta
    // compensarlos con un margen inventado.
    const el = ref.closest ? (ref.closest('.axx-panel') || ref) : ref;
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) return;               // panel oculto o todavia sin layout
    const cuerpo = el.querySelector('.ant-table-body');
    if (!cuerpo) return;                        // estado vacio: no hay grilla que dimensionar
    const fueraDelCuerpo = rect.height - cuerpo.getBoundingClientRect().height;
    const cont = contenedorDesplazable(el);
    let topRelativo, disponible;
    if (cont) {
      // coordenadas independientes del desplazamiento actual del contenedor
      topRelativo = rect.top - cont.getBoundingClientRect().top + cont.scrollTop;
      disponible = cont.clientHeight;
    } else {
      topRelativo = rect.top + (window.pageYOffset || 0);
      disponible = window.innerHeight;
    }
    const margen = 2;   // solo redondeo de subpixel
    const h = Math.max(140, Math.floor(disponible - topRelativo - fueraDelCuerpo - margen));
    setAltoGrilla(function (prev) { return Math.abs(prev - h) > 2 ? h : prev; });
  }

  useEffect(function () {
    medirAlto();
    // 🔴 antd aplica la visibilidad del panel DESPUES de este efecto: al alternar de pestana
    // la medicion sincrona ve el panel todavia oculto (alto 0), sale sin medir y la grilla se
    // queda con el alto de la pestana anterior. De ahi salia el desborde de la pagina.
    const t1 = setTimeout(medirAlto, 0);
    const t2 = setTimeout(medirAlto, 200);
    window.addEventListener('resize', medirAlto);
    return function () {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', medirAlto);
    };
  });

  function num2(v) {
    const n = Number(v);
    if (v === null || v === undefined || isNaN(n)) return '';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // Estilo por signo: SOLO color, sin tocar el formateo ni el valor.
  function monto(v) {
    const n = Number(v);
    const txt = num2(v);
    if (txt === '') return '';
    const cls = n > 0 ? 'axx-monto-pos' : (n < 0 ? 'axx-monto-neg' : 'axx-monto-cero');
    return <span className={cls}>{txt}</span>;
  }

  function setCampo(campo, valor) {
    const nuevo = Object.assign({}, criterios);
    nuevo[campo] = valor;
    setCriterios(nuevo);
    if (errorFiltros) setErrorFiltros(null);
  }
  // CA-03 / S19: Numero SIS solo digitos — se impide teclear cualquier otra cosa.
  function setNumeroSis(valor) {
    setCampo('noSis', String(valor === null || valor === undefined ? '' : valor).replace(/[^0-9]/g, ''));
  }

  function hayCriterio() {
    const k = Object.keys(criterios);
    for (let i = 0; i < k.length; i++) {
      if (String(criterios[k[i]] || '').trim() !== '') return true;
    }
    return false;
  }

  // CA-06 / S18: reinicia campos, mensajes y estado de resultados. NO cierra el Drawer.
  function limpiarFiltros() {
    setCriterios(CRITERIOS_VACIOS);
    setContactos([]);
    setContactoSel(null);
    setFilas([]);
    setTotalCumulo(null);
    setTotalesMoneda([]);
    setError(null);
    setErrorFiltros(null);
    setBuscado(false);
    setPestana('busqueda');
  }

  // CA-02: sin ningun filtro no se consulta.
  function buscar() {
    if (!hayCriterio()) {
      setErrorFiltros(t('Indique al menos un criterio de búsqueda'));
      return;
    }
    setErrorFiltros(null);
    setError(null);
    setCargandoBusqueda(true);
    setContactoSel(null);
    setFilas([]);
    setTotalCumulo(null);
    setTotalesMoneda([]);
    setPestana('busqueda');
    const row = Object.assign({}, criterios, { currentPage: 1, pageSize: 50 });
    exe('ExeChain', { chain: 'cmdBuscarContactoFianzas', context: JSON.stringify({ row: row }) })
      .then(function (r) {
        setCargandoBusqueda(false);
        setBuscado(true);
        setDrawerAbierto(false);
        if (!r || !r.ok) { setError((r && r.msg) || t('Error de consulta')); setContactos([]); return; }
        const o = r.outData || {};
        if (!o.ok) { setError(o.msg || t('Error de consulta')); setContactos([]); return; }
        setContactos(o.data || []);
      })
      .catch(function (e) {
        setCargandoBusqueda(false); setBuscado(true);
        setContactos([]); setError(String(e));
      });
  }

  function numeroCumulo(valor) {
    const numero = Number(String(valor === null || valor === undefined ? 0 : valor).replace(/,/g, ''));
    return isNaN(numero) ? 0 : numero;
  }

  function objetoMarcaFianzaNoVigente(objeto) {
    let campos = objeto && objeto.jValues;
    try {
      if (typeof campos === 'string') campos = JSON.parse(campos || '[]');
    } catch (e) {
      campos = [];
    }
    if (!Array.isArray(campos)) return false;
    return campos.some(function (campo) {
      const datos = campo && Array.isArray(campo.userData) ? campo.userData : [];
      return campo && campo.name === 'cmbEstadoFianza' && String(datos[0] === undefined ? '' : datos[0]).trim() === '0';
    });
  }

  function aplicarCumuloFiltrado(filasValidas) {
    const totales = {};
    let total = 0;
    filasValidas.forEach(function (fila) {
      const montoFila = numeroCumulo(fila.sumaasegurada);
      const moneda = String(fila.moneda || '');
      total += montoFila;
      totales[moneda] = (totales[moneda] || 0) + montoFila;
    });
    setFilas(filasValidas);
    setTotalCumulo(total);
    setTotalesMoneda(Object.keys(totales).map(function (moneda) {
      return { moneda: moneda, totalCumulo: totales[moneda] };
    }));
  }

  // CA-08 / S17: al elegir contacto se habilita la segunda pestana y el foco pasa a ella.
  function cargarCumulo(contacto) {
    setContactoSel(contacto);
    setPestana('cumulo');
    setCargandoCumulo(true);
    setError(null);
    setFilas([]);
    setTotalCumulo(null);
    setTotalesMoneda([]);
    exe('ExeChain', {
      chain: 'cmdCumuloFianzasPorContacto',
      context: JSON.stringify({ row: { contactId: contacto.noSis } })
    })
      .then(function (r) {
        if (!r || !r.ok) { setCargandoCumulo(false); setError((r && r.msg) || t('Error de consulta')); return; }
        const o = r.outData || {};
        if (!o.ok) { setCargandoCumulo(false); setError(o.msg || t('Error de consulta')); return; }
        const data = o.data || [];
        const policyIds = [];
        data.forEach(function (fila) {
          const id = Number(fila.polizaId || 0);
          if (id > 0 && policyIds.indexOf(id) < 0) policyIds.push(id);
        });
        if (!policyIds.length) {
          setCargandoCumulo(false);
          setFilas(data);
          setTotalCumulo(o.totalCumulo);
          setTotalesMoneda(o.totalesPorMoneda || []);
          return null;
        }
        return exe('LoadEntities', {
          entity: 'InsuredObject',
          fields: 'lifePolicyId,jValues',
          filter: 'lifePolicyId IN (' + policyIds.join(',') + ')',
          noTracking: true
        }).then(function (objectsResponse) {
          if (!objectsResponse || objectsResponse.ok === false) {
            throw new Error((objectsResponse && objectsResponse.msg) || t('No se pudo validar el estado de las fianzas'));
          }
          const inactivePolicies = {};
          const objects = Array.isArray(objectsResponse.outData) ? objectsResponse.outData : [];
          objects.forEach(function (objeto) {
            if (objetoMarcaFianzaNoVigente(objeto)) inactivePolicies[String(objeto.lifePolicyId)] = true;
          });
          const inactiveIds = Object.keys(inactivePolicies);
          setCargandoCumulo(false);
          if (!inactiveIds.length) {
            setFilas(data);
            setTotalCumulo(o.totalCumulo);
            setTotalesMoneda(o.totalesPorMoneda || []);
            return;
          }
          aplicarCumuloFiltrado(data.filter(function (fila) {
            return !inactivePolicies[String(fila.polizaId)];
          }));
        });
      })
      .catch(function (e) { setCargandoCumulo(false); setError(String(e)); });
  }

  const etiquetaRelacion = {
    DIRECTO: t('Ente asegurado directo'),
    PADRE_CONSORCIO: t('Ente padre (consorcio)'),
    INTEGRANTE: t('Integrante del consorcio'),
    MIEMBRO_DE_CONSORCIO: t('Participación como integrante')
  };

  const css = `
.axx251 { display:flex; flex-direction:column; min-width:0; overflow:hidden; font-size:13px; }
.axx251 .axx-topbar { display:flex; align-items:center; gap:8px; padding:4px 0; margin:0 4px 2px 4px;
          background:transparent; border:1px solid #e6ebf2; border-radius:6px; }
.axx251 .axx-topbar > * { margin-left:4px; }
.axx251 .axx-status { background:linear-gradient(90deg, #e6f4ff 0%, #4096ff 100%); color:#fff;
          padding:4px 10px; border-radius:4px; margin:0 4px 4px 4px; font-size:13px; }
.axx251 .axx-status b { color:#fff; }
.axx251 .axx-tabs { min-width:0; margin:0 4px; }
/* 🔴 El panel INACTIVO se oculta: antd lo hace con una sola clase, asi que cualquier regla
   propia con mas especificidad se lo pisa. Se reafirma aqui y solo se estiliza el activo. */
.axx251 .axx-tabs .ant-tabs-tabpane-hidden { display:none !important; }
.axx251 .axx-tabs .ant-tabs-content { min-width:0; }
.axx251 .axx-tabs .ant-tabs-tabpane-active { min-width:0; }
/* Pestanas tipo tarjeta: borde sutil, esquinas superiores 6px, separacion 2px, activo #1677ff */
.axx251 .axx-tabs .ant-tabs-tab { border:1px solid #cbd1d8 !important; border-radius:6px 6px 0 0 !important;
          margin-right:2px !important; background:#f7f9fb; position:relative; }
.axx251 .axx-tabs .ant-tabs-tab-active { border-color:#1677ff !important; background:#fff; }
.axx251 .axx-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color:#1677ff; }
.axx251 .axx-tabs .ant-tabs-tab-active::after { content:''; position:absolute; left:0; right:0; bottom:-1px;
          height:1px; background:#fff; }
.axx251 .axx-panel { border:1px solid #cbd1d8; border-top:none; background:#fff; min-width:0; }
.axx251 .axx-panel .ant-card { border:none; }
.axx251 .axx-panel .ant-card-body { padding:4px; }
/* Grillas: borde exterior sutil, encabezado mas oscuro con separadores verticales,
   filas solo con separadores horizontales, densidad compacta.
   El alto y el desplazamiento los gobierna la prop scroll de antd, no CSS. */
.axx251 .ant-table-wrapper { border:1px solid #cbd1d8; min-width:0; }
/* La prop scroll de antd fija un MAX-height, asi que con pocas filas la grilla no llega
   al borde inferior y queda espacio muerto. El min-height la hace ocupar el alto
   disponible y conserva su estructura aunque venga vacia. */
.axx251 .axx-panel .ant-table-body { min-height:${altoGrilla}px; }
.axx251 .ant-table-thead > tr > th { background:#bfbfbf !important; color:#262626;
          border-right:1px solid #cbd1d8 !important; border-bottom:1px solid #cbd1d8 !important;
          font-size:12px; line-height:18px; padding:5px 8px !important; }
.axx251 .ant-table-thead > tr > th:last-child { border-right:none !important; }
.axx251 .ant-table-thead > tr > th::before { display:none !important; }
.axx251 .ant-table-tbody > tr > td { border-right:none !important;
          border-bottom:1px solid #cbd1d8 !important; font-size:12px; line-height:18px;
          padding:5px 8px !important; }
.axx251 .ant-table-tbody > tr { cursor:pointer; }
.axx251 .ant-table-tbody > tr:hover > td { background:#b7d7ff !important; }
.axx251 .ant-table-tbody > tr.ant-table-row-selected > td,
.axx251 .ant-table-tbody > tr.axx-fila-seleccionada > td { background:#86b4ff !important; }
.axx251 .ant-table-tbody > tr.ant-table-row-selected:hover > td,
.axx251 .ant-table-tbody > tr.axx-fila-seleccionada:hover > td { background:#86b4ff !important; }
/* Montos: color por signo, sin tocar el formato */
.axx251 .axx-monto-pos { color:#237804; }
.axx251 .axx-monto-neg { color:#cf1322; }
.axx251 .axx-monto-cero { color:#262626; font-weight:normal; }
/* Botones */
.axx251 .axx-btn-sec, .axx-drawer-cumulo .axx-btn-sec { border-color:#8f9aa7 !important; }
.axx251 .ant-btn[disabled], .axx-drawer-cumulo .ant-btn[disabled] {
          border-color:#6f7b88 !important; opacity:1 !important; }
.axx251 .axx-pie { padding:4px 8px; text-align:right; }
.axx-drawer-cumulo .ant-drawer-body { font-size:13px; }
.axx-drawer-cumulo .ant-form-item { margin-bottom:10px; }
`;

  const gridContactos = (
    <Card size="small" bordered={false}>
      <div ref={refBusq}>
        {buscado && contactos.length === 0 && !cargandoBusqueda
          ? <Empty description={t('No se encontraron contactos')} />
          : <Table dataSource={contactos} rowKey="noSis" size="small"
              pagination={{ pageSize: 10, size: 'small' }}
              scroll={{ x: ANCHO_CONTACTOS, y: altoGrilla }}
              onRow={function (record) {
                return { onClick: function () { cargarCumulo(record); } };
              }}
              rowClassName={function (record) {
                return contactoSel && contactoSel.noSis === record.noSis ? 'axx-fila-seleccionada' : '';
              }}>
              <Column title={t('Número SIS')} dataIndex="noSis" key="noSis" width={95} />
              <Column title={t('Número COBIS')} dataIndex="noCobis" key="noCobis" width={115} />
              <Column title={t('Nombre')} dataIndex="nombreCompleto" key="nombreCompleto" width={280} />
              <Column title={t('cnp')} dataIndex="cnp" key="cnp" width={150} />
              <Column title={t('nif')} dataIndex="nif" key="nif" width={160} />
              <Column title={t('Consorcio')} dataIndex="esEntePadreConsorcio" key="esEntePadreConsorcio" width={110}
                render={function (v) { return v ? <Tag color="blue">{t('Ente padre')}</Tag> : null; }} />
            </Table>}
      </div>
    </Card>
  );

  const gridCumulo = (
    <Card size="small" bordered={false}>
      <div ref={refCum}>
        {!cargandoCumulo && filas.length === 0
          ? <Empty description={t('El contacto no tiene fianzas vigentes')} />
          : <div>
              <Table dataSource={filas} size="small" pagination={false}
                scroll={{ x: ANCHO_CUMULO, y: altoGrilla }}
                rowKey={function (r) { return r.polizaId + '|' + r.relacion + '|' + (r.clienteMiembroRelacionado || ''); }}>
                <Column title={t('Número de póliza')} dataIndex="numeroPoliza" key="numeroPoliza" width={130}
                  render={function (v, r) { return v || '(' + r.polizaId + ')'; }} />
                <Column title={t('Ramo')} dataIndex="ramo" key="ramo" width={165} />
                <Column title={t('Ente asegurado principal')} dataIndex="enteAseguradoPrincipal" key="ente" width={185} />
                <Column title={t('Cliente / miembro relacionado')} dataIndex="clienteMiembroRelacionado" key="miembro" width={185} />
                <Column title={t('Relación')} dataIndex="relacion" key="relacion" width={165}
                  render={function (v) { return etiquetaRelacion[v] || v; }} />
                <Column title={t('Vigencia desde')} dataIndex="vigenciaDesde" key="vDesde" width={105} />
                <Column title={t('Vigencia hasta')} dataIndex="vigenciaHasta" key="vHasta" width={105} />
                <Column title={t('Moneda')} dataIndex="moneda" key="moneda" width={80} />
                <Column title={t('Suma asegurada de la póliza')} dataIndex="sumaAseguradaPoliza" key="saPoliza"
                  align="right" width={150} render={monto} />
                <Column title={t('Prima de la póliza')} dataIndex="primaPoliza" key="primaPoliza"
                  align="right" width={125} render={monto} />
                <Column title={t('% de participación')} dataIndex="porcentajeParticipacion" key="pct"
                  align="right" width={95} render={monto} />
                <Column title={t('Suma asegurada usada para el cálculo')} dataIndex="sumaasegurada" key="saCalc"
                  align="right" width={175} render={monto} />
                <Column title={t('Prima de la participación')} dataIndex="primaParticipacion" key="primaPart"
                  align="right" width={145} render={monto} />
              </Table>
              <div className="axx-pie">
                {totalesMoneda.length > 1
                  ? totalesMoneda.map(function (m) {
                      return <div key={m.moneda}>
                        <Text strong>{t('Total Cúmulo')} ({m.moneda}): </Text>
                        <Text strong style={{ fontSize: 16 }}>{num2(m.totalCumulo)}</Text>
                      </div>;
                    })
                  : <div>
                      <Text strong>{t('Total Cúmulo')}{totalesMoneda.length === 1 ? ' (' + totalesMoneda[0].moneda + ')' : ''}: </Text>
                      <Text strong style={{ fontSize: 16 }}>{num2(totalCumulo)}</Text>
                    </div>}
              </div>
            </div>}
      </div>
    </Card>
  );

  return (
    <DefaultPage title={t('Consulta de Cúmulo de Fianzas')} icon="audit">
      <style>{css}</style>
      <div className="axx251">

        <div className="axx-topbar">
          <Button type="primary" icon={<IcoBuscar />} onClick={function () { setDrawerAbierto(true); }}>
            {t('Filtrar')}
          </Button>
          <Button className="axx-btn-sec" icon={<IcoActualizar />} disabled={!hayCriterio()}
            loading={cargandoBusqueda} onClick={buscar}>
            {t('Actualizar')}
          </Button>
        </div>

        <div className="axx-status">
          {contactoSel
            ? <span><b>{t('Contacto')}:</b> {contactoSel.nombreCompleto}{' '}·{' '}
                <b>{t('Número SIS')}:</b> {contactoSel.noSis}</span>
            : <span>{t('Seleccione un contacto de la pestaña Búsqueda para ver su cúmulo')}</span>}
        </div>

        {error ? <Alert type="error" showIcon message={error} style={{ margin: '0 4px 4px 4px' }} /> : null}

        <Tabs type="card" className="axx-tabs" activeKey={pestana} onChange={setPestana}>
          <TabPane tab={t('Búsqueda')} key="busqueda">
            <div className="axx-panel">
              <Spin spinning={cargandoBusqueda}>{gridContactos}</Spin>
            </div>
          </TabPane>
          <TabPane tab={t('Cúmulo')} key="cumulo" disabled={!contactoSel}>
            <div className="axx-panel">
              <Spin spinning={cargandoCumulo}>{gridCumulo}</Spin>
            </div>
          </TabPane>
        </Tabs>

        <Drawer className="axx-drawer-cumulo" title={t('Filtros')} width={420} placement="right"
          visible={drawerAbierto} onClose={function () { setDrawerAbierto(false); }}
          footer={
            <Space>
              <Button type="primary" icon={<IcoBuscar />} loading={cargandoBusqueda} onClick={buscar}>
                {t('Buscar')}
              </Button>
              <Button className="axx-btn-sec" onClick={limpiarFiltros}>{t('Limpiar filtros')}</Button>
            </Space>
          }>
          {errorFiltros ? <Alert type="warning" showIcon message={errorFiltros} style={{ marginBottom: 10 }} /> : null}
          <Form layout="vertical">
            <Form.Item label={t('Número COBIS')}>
              <Input value={criterios.noCobis} onChange={function (e) { setCampo('noCobis', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t('Número SIS')}>
              <Input value={criterios.noSis} inputMode="numeric"
                onChange={function (e) { setNumeroSis(e.target.value); }} />
            </Form.Item>
            <Form.Item label={t('Grupo Económico')}>
              <Select allowClear style={{ width: '100%' }} value={criterios.grupoEconomico || undefined}
                onChange={function (v) { setCampo('grupoEconomico', v || ''); }}>
                {grupos.map(function (g) { return <Option key={g.id} value={g.id}>{g.nombre}</Option>; })}
              </Select>
            </Form.Item>
            <Form.Item label={t('cnp')}>
              <Input value={criterios.cnp} onChange={function (e) { setCampo('cnp', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t('nif')}>
              <Input value={criterios.nif} onChange={function (e) { setCampo('nif', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t('Nombre Persona')}>
              <Input value={criterios.nombrePersona}
                onChange={function (e) { setCampo('nombrePersona', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t('Nombre Compañía')}>
              <Input value={criterios.surname2} onChange={function (e) { setCampo('surname2', e.target.value); }} />
            </Form.Item>
          </Form>
        </Drawer>

      </div>
    </DefaultPage>
  );
}
