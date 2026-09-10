/**
 * @name  ChangeCoverageSuretyEndorsement
 * @issue AXX-299 / GLOB-1201
 * @purpose Endoso de extension o reduccion de vigencia para Fianzas: calcula el impacto en
 *          prima y facturacion, simula el reaseguro del movimiento y ejecuta el endoso
 *          conservando exactamente los valores mostrados.
 * Se abre con ?policyId=<id>. Todo el calculo vive en cadenas de configuracion:
 *   cmdCalcChangeCoverageSurety   pestania 1 (prorrata, dependientes, impuestos y total)
 *   cmdSweepQuoteResidueSuretyAxx299    retira el residuo fiscal que deja la cotizacion nativa
 *   cmdSimReaChangeCoverageSuretyAxx299 pestania 2 (reaseguro del movimiento, en memoria)
 *   cmdExeChangeCoverageSuretyAxx299    registro del endoso + guard de doble ejecucion
 *   cmdFinishChangeCoverageSuretyAxx299 aprobacion, ejecucion y verificacion de la cesion
 */
() => {
  const Tabs = A.Tabs;
  const Card = A.Card;
  const Table = A.Table;
  const Button = A.Button;
  const Select = A.Select;
  const DatePicker = A.DatePicker;
  const InputNumber = A.InputNumber;
  const Input = A.Input;
  const Modal = A.Modal;
  const Alert = A.Alert;
  const Spin = A.Spin;
  const Tag = A.Tag;
  const Empty = A.Empty;

  const [policyId, setPolicyId] = useState(0);
  const [policy, setPolicy] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [covCode, setCovCode] = useState(null);
  const [newEnd, setNewEnd] = useState(null);
  const [surcharge, setSurcharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [calc, setCalc] = useState(null);
  const [sim, setSim] = useState(null);
  const [tab, setTab] = useState('calc');
  const [loading, setLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [modal, setModal] = useState(false);
  const [note, setNote] = useState('');
  const [noteTouched, setNoteTouched] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [key, setKey] = useState(null);
  const [altoGrilla, setAltoGrilla] = useState(180);
  // 🔴 Cerrojo contra doble clic: `running` es estado y no cambia entre dos clics del MISMO
  // lote de React, asi que tres clics seguidos disparaban tres ejecuciones. El objeto que
  // devuelve useState conserva su identidad entre renders y se muta de forma sincrona.
  const [lock] = useState({ busy: false });
  const [buscarPoliza, setBuscarPoliza] = useState('');
  const [splits, setSplits] = useState([]);

  const money = function (v) { return Number(Number(v || 0).toFixed(2)); };
  const txt = function (v) { return String(v === null || v === undefined ? '' : v).trim(); };
  const day10 = function (v) { return txt(v).slice(0, 10); };
  const fmt = function (v) {
    const n = Number(v || 0);
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const signo = function (v) {
    const n = Number(v || 0);
    return n > 0 ? 'axx-monto-pos' : (n < 0 ? 'axx-monto-neg' : 'axx-monto-cero');
  };
  const conSigno = function (v) {
    const n = Number(v || 0);
    return (n > 0 ? '+' : '') + fmt(n);
  };

  function readPolicyId() {
    const href = String(window.location.href || '').replace('#/', '');
    const m = /[?&]policyId=(\d+)/.exec(href);
    if (m) return Number(m[1]);
    if (context && context.policyId) return Number(context.policyId);
    return 0;
  }

  // ------------------------------------------------------------- carga inicial
  function loadPolicy(id) {
    if (!id) { return; }
    setLoading(true);
    setError(null);
    exe('RepoLifePolicy', { operation: 'GET', filter: 'id=' + id, include: ['Coverages'], size: 1 })
      .then(function (r) {
        if (!r || !r.ok || !r.outData || !r.outData.length) {
          setLoading(false); setError(t('No se encontro la poliza') + ' ' + id); return null;
        }
        const p = r.outData[0];
        setPolicy(p);
        return exe('GetFullTable', { table: 'cfgCoberturaProductoReaFianza' }).then(function (tr) {
          setLoading(false);
          let rows = (tr && tr.outData) || [];
          if (typeof rows === 'string') rows = JSON.parse(rows);
          const cfg = {};
          for (let i = 1; i < rows.length; i++) {
            if (txt(rows[i][1]) !== txt(p.productCode)) continue;
            cfg[txt(rows[i][3])] = { principal: txt(rows[i][7]), parent: txt(rows[i][8]) };
          }
          const list = [];
          const covs = p.Coverages || [];
          for (let i = 0; i < covs.length; i++) {
            const c = txt(covs[i].code);
            const row = cfg[c];
            // principal del producto (coberturaPrincipal = -1) y mantenimiento 313 cuando esta contratada
            if (c === '313' || (row && row.principal === '-1')) {
              list.push({ code: c, name: covs[i].name, end: covs[i].end, start: covs[i].start, premium: covs[i].premium });
            }
          }
          setEligible(list);
          if (list.length) {
            setCovCode(list[0].code);
            if (list[0].end) {
              setNewEnd(moment(day10(list[0].end), 'YYYY-MM-DD', true));
            } else {
              setNewEnd(null);
            }
          }
          return null;
        });
      })
      .catch(function (e) { setLoading(false); setError(String(e)); });
  }

  // Abierta desde el menu no llega ?policyId=: se busca por numero o por codigo de poliza.
  function buscar() {
    const v = txt(buscarPoliza);
    if (!v) { setError(t('Indique el numero o el codigo de la poliza')); return; }
    invalidate(); setPolicy(null); setEligible([]); setCovCode(null); setNewEnd(null);
    if (/^[0-9]+$/.test(v)) { setPolicyId(Number(v)); loadPolicy(Number(v)); return; }
    setLoading(true); setError(null);
    exe('RepoLifePolicy', { operation: 'GET', filter: "code='" + v.replace(/'/g, "''") + "'", size: 1 })
      .then(function (r) {
        setLoading(false);
        if (!r || !r.ok || !r.outData || !r.outData.length) { setError(t('No se encontro la poliza') + ' ' + v); return; }
        setPolicyId(r.outData[0].id);
        loadPolicy(r.outData[0].id);
      })
      .catch(function (e) { setLoading(false); setError(String(e)); });
  }

  useEffect(function () {
    const id = readPolicyId();
    setPolicyId(id);
    loadPolicy(id);
  }, []);

  // el alto de la grilla se mide en cada render: .ant-table-pagination no existe hasta que hay filas
  useEffect(function () {
    const root = document.querySelector('.axx299');
    if (!root) return;
    const body = root.querySelector('.ant-table-body');
    if (!body) return;
    const disponible = window.innerHeight - body.getBoundingClientRect().top - 90;
    if (disponible > 120 && Math.abs(disponible - altoGrilla) > 4) setAltoGrilla(Math.round(disponible));
  });

  const selected = (function () {
    for (let i = 0; i < eligible.length; i++) { if (eligible[i].code === covCode) return eligible[i]; }
    return null;
  })();

  // la distribucion en memoria se invalida en cuanto cambia el calculo o la poliza
  function invalidate() { setCalc(null); setSim(null); setResult(null); setKey(null); setSplits([]); }

  // edicion de aceptantes: se guarda la participacion cambiada y se vuelve a simular
  function editarSplit(cessionId, contactId, value) {
    const next = [];
    for (let i = 0; i < splits.length; i++) {
      const x = splits[i];
      if (x.cessionId === cessionId && x.contactId === contactId) continue;
      next.push(x);
    }
    next.push({ cessionId: cessionId, contactId: contactId, split: Number(value || 0) });
    setSplits(next);
    setSim(null);
  }

  // ------------------------------------------------------------- pestania 1
  function calcular() {
    setError(null); setResult(null);
    if (!covCode) { setError(t('Seleccione la cobertura a endosar')); return; }
    if (!newEnd) { setError(t('Indique la nueva fecha final')); return; }
    setLoading(true);
    setSim(null);
    const ctx = {
      policyId: policyId, coverageCode: covCode,
      newEnd: moment(newEnd).format('YYYY-MM-DD'),
      surcharge: Number(surcharge || 0), discount: Number(discount || 0)
    };
    exe('ExeChain', { chain: 'cmdCalcChangeCoverageSurety', context: JSON.stringify(ctx) })
      .then(function (r) {
        if (!r || !r.ok) {
          setLoading(false);
          setError(String((r && r.msg) || t('Error de calculo')).replace(/formula ->[\s\S]*/, '').trim());
          return null;
        }
        let o = r.outData;
        if (typeof o === 'string') o = JSON.parse(o);
        if (o && o.length !== undefined && o.length >= 0 && !o.rows) o = o[0];
        setCalc(o);
        setKey('AXX299-' + policyId + '-' + covCode + '-' + moment().format('YYYYMMDDHHmmss'));
        // la cotizacion nativa no es de solo lectura: deja una fila de impuesto deshabilitada
        return exe('ExeChain', {
          chain: 'cmdSweepQuoteResidueSuretyAxx299',
          context: JSON.stringify({ policyId: policyId })
        }).then(function () { setLoading(false); return null; });
      })
      .catch(function (e) { setLoading(false); setError(String(e)); });
  }

  // recargo y descuento recalculan sin borrar lo capturado
  function onAjuste(kind, value) {
    const v = value === null || value === undefined ? 0 : Number(value);
    if (kind === 'surcharge') setSurcharge(v); else setDiscount(v);
    setSim(null);
  }

  // ------------------------------------------------------------- pestania 2
  function simular() {
    if (!calc) { setError(t('Calcule el endoso antes de simular el reaseguro')); return; }
    setSimLoading(true); setError(null);
    const rows = [];
    for (let i = 0; i < calc.rows.length; i++) {
      // el prorrateado es la base sobre la que el endoso reparte la cesion; sin el, la
      // simulacion anuncia un reparto que no es el que se escribe
      rows.push({ code: calc.rows[i].code, variation: calc.rows[i].variation, prorated: calc.rows[i].prorated });
    }
    exe('ExeChain', {
      chain: 'cmdSimReaChangeCoverageSuretyAxx299',
      context: JSON.stringify({ policyId: policyId, rows: rows, participants: splits })
    })
      .then(function (r) {
        setSimLoading(false);
        if (!r || !r.ok) { setError(String((r && r.msg) || '').replace(/formula ->[\s\S]*/, '').trim()); return; }
        let o = r.outData;
        if (typeof o === 'string') o = JSON.parse(o);
        if (o && o.length !== undefined && !o.contracts) o = o[0];
        setSim(o);
      })
      .catch(function (e) { setSimLoading(false); setError(String(e)); });
  }

  // Tambien cuando una edicion invalida la distribucion: sin `sim` en las dependencias, editar
  // o agregar un aceptante limpiaba la simulacion y nadie la volvia a pedir.
  useEffect(function () {
    if (tab === 'rea' && calc && !sim && !simLoading) simular();
  }, [tab, calc, sim, splits]);

  // ------------------------------------------------------------- ejecucion
  function ejecutar() {
    if (lock.busy || running) return;          // proteccion contra doble clic y doble envio
    if (!txt(note)) { setNoteTouched(true); return; }
    lock.busy = true;
    setRunning(true); setError(null);
    const expected = {
      coveragePremium: calc.rows[0].adjustedPremium,
      variation: calc.rows[0].variation,
      premiumAfter: calc.billing.premium.after,
      taxAfter: calc.billing.tax.after,
      totalAfter: calc.billing.total.after,
      newEnd: calc.rows[0].newEnd
    };
    const base = {
      policyId: policyId, coverageCode: covCode,
      newEnd: moment(newEnd).format('YYYY-MM-DD'),
      surcharge: Number(surcharge || 0), discount: Number(discount || 0),
      note: txt(note), key: key
    };
    const regCtx = JSON.parse(JSON.stringify(base));
    regCtx.expected = expected;

    exe('ExeChain', { chain: 'cmdExeChangeCoverageSuretyAxx299', context: JSON.stringify(regCtx) })
      .then(function (r) {
        if (!r || !r.ok) { throw new Error(String((r && r.msg) || '').replace(/formula ->[\s\S]*/, '').trim()); }
        let reg = r.outData;
        if (typeof reg === 'string') reg = JSON.parse(reg);
        if (reg && reg.length !== undefined && !reg.changeId) reg = reg[0];
        // Ya procesado y aplicado: no se vuelve a ejecutar.
        if (reg.duplicate && !reg.resumable) { return { done: true, reg: reg }; }
        // Registrado y sin aplicar: la cadena devuelve la entidad lista y aqui se continua.
        const filas = reg.resumable && reg.rows ? reg.rows : calc.rows;
        // el ADD deja la entidad trackeada: el UPDATE que fija las vigencias va en OTRO request
        return exe('ChangeCoverage', { Entity: reg.patchEntity, operation: 'UPDATE' })
          .then(function (u) {
            if (!u || !u.ok) { throw new Error(t('No se pudieron fijar las vigencias calculadas') + ': ' + ((u && u.msg) || '')); }
            const rows = [];
            for (let i = 0; i < filas.length; i++) {
              rows.push({ code: filas[i].code, newStart: filas[i].newStart, newEnd: filas[i].newEnd });
            }
            // la distribucion que el usuario vio viaja al cierre para cotejarla con la escrita
            const dist = [];
            const parts = [];
            if (sim && sim.contracts) {
              for (let g = 0; g < sim.contracts.length; g++) {
                const grp = sim.contracts[g];
                for (let k = 0; k < grp.rows.length; k++) {
                  const rr = grp.rows[k];
                  dist.push({ contractId: grp.contractId, lineId: grp.lineId, coverageCode: rr.coverageCode, premiumMovement: rr.premiumMovement, premiumCedant: rr.premiumCedant, premiumRe: rr.premiumRe, commission: rr.commission });
                }
                for (let k = 0; k < (grp.participants || []).length; k++) {
                  const pp = grp.participants[k];
                  parts.push({ coverageCode: pp.coverageCode, contactId: pp.contactId, split: pp.split, premium: pp.premium, commission: pp.commission, lineId: pp.lineId });
                }
              }
            }
            return exe('ExeChain', {
              chain: 'cmdFinishChangeCoverageSuretyAxx299',
              context: JSON.stringify({ changeId: reg.changeId, key: key, rows: rows, distribution: dist })
            }).then(function (f) {
              if (!f || !f.ok) { throw new Error(String((f && f.msg) || '').replace(/formula ->[\s\S]*/, '').trim()); }
              let fin = f.outData;
              if (typeof fin === 'string') fin = JSON.parse(fin);
              if (fin && fin.length !== undefined && !fin.stage) fin = fin[0];
              if (!fin.ok || !fin.executed || !dist.length) return { done: true, reg: reg, fin: fin };
              // El reparto que escribe el motor puede diferir en el ultimo centavo, y las
              // participaciones editadas no las escribe el endoso: aqui se persiste lo CONFIRMADO,
              // acotado al movimiento, y se comprueba la igualdad exacta.
              return exe('ExeChain', {
                chain: 'cmdApplyReaChangeCoverageSuretyAxx299',
                context: JSON.stringify({ changeId: reg.changeId, distribution: dist, participants: parts })
              }).then(function (ap) {
                if (!ap || !ap.ok) { throw new Error(String((ap && ap.msg) || '').replace(/formula ->[\s\S]*/, '').trim()); }
                let app = ap.outData;
                if (typeof app === 'string') app = JSON.parse(app);
                if (app && app.length !== undefined && !app.stage) app = app[0];
                return { done: true, reg: reg, fin: fin, app: app };
              });
            });
          });
      })
      .then(function (o) {
        lock.busy = false;
        setRunning(false); setModal(false);
        const shownResult = o.app ? JSON.parse(JSON.stringify(o.app)) : (o.fin || o.reg);
        if (o.app && o.fin) { shownResult.msg = o.fin.msg + ' ' + o.app.msg; }
        setResult(shownResult);
        if (!o.fin || o.fin.ok) { setSim(null); loadPolicy(policyId); }   // distribucion invalidada tras exito
      })
      .catch(function (e) {
        lock.busy = false; setRunning(false); setModal(false);
        setError(String(e && e.message ? e.message : e));
        // la cotizacion del registro deja una fila de impuesto: no se abandona tras un fallo
        exe('ExeChain', { chain: 'cmdSweepQuoteResidueSuretyAxx299', context: JSON.stringify({ policyId: policyId }) });
      });
  }

  // ------------------------------------------------------------- columnas
  const colsGrid = [
    { title: t('Codigo'), dataIndex: 'code', width: 80 },
    { title: t('Nombre'), dataIndex: 'name' },
    { title: t('Tipo'), dataIndex: 'reason', width: 110, render: function (v) { return v === 'SELECTED' ? <Tag color="blue">{t('Seleccionada')}</Tag> : <Tag>{t('Recalculada')}</Tag>; } },
    { title: t('Prima anterior'), dataIndex: 'oldPremium', align: 'right', width: 120, render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Vigencia inicial anterior'), dataIndex: 'oldStart', width: 140, render: function (v) { return <span className="axx-antes">{day10(v)}</span>; } },
    { title: t('Vigencia final anterior'), dataIndex: 'oldEnd', width: 140, render: function (v) { return <span className="axx-antes">{day10(v)}</span>; } },
    { title: t('Nueva prima'), dataIndex: 'newPremium', align: 'right', width: 120, render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } },
    { title: t('Variacion'), dataIndex: 'variation', align: 'right', width: 110, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Nueva vigencia inicial'), dataIndex: 'newStart', width: 140, render: function (v, row) { return <span className={row.oldStart === row.newStart ? '' : 'axx-nuevo'}>{day10(v)}</span>; } },
    { title: t('Nueva vigencia final'), dataIndex: 'newEnd', width: 140, render: function (v) { return <span className="axx-nuevo">{day10(v)}</span>; } }
  ];

  const colsResumen = [
    { title: t('Concepto'), dataIndex: 'label' },
    { title: t('Anterior'), dataIndex: 'before', align: 'right', render: function (v) { return <span className="axx-antes">{fmt(v)}</span>; } },
    { title: t('Calculado'), dataIndex: 'calculated', align: 'right', render: function (v) { return fmt(v); } },
    { title: t('Nuevo'), dataIndex: 'after', align: 'right', render: function (v) { return <span className="axx-nuevo">{fmt(v)}</span>; } }
  ];

  const filasResumen = calc ? [
    { key: 'p', label: t('Prima'), before: calc.billing.premium.before, calculated: calc.billing.premium.calculated, after: calc.billing.premium.after },
    { key: 'a', label: t('Ajustes'), before: calc.billing.adjustments.before, calculated: calc.billing.adjustments.calculated, after: calc.billing.adjustments.after },
    { key: 'g', label: t('Gasto'), before: calc.billing.fee.before, calculated: calc.billing.fee.calculated, after: calc.billing.fee.after },
    { key: 'i', label: t('Impuesto'), before: calc.billing.tax.before, calculated: calc.billing.tax.calculated, after: calc.billing.tax.after },
    { key: 'T', label: t('Total'), before: calc.billing.total.before, calculated: calc.billing.total.calculated, after: calc.billing.total.after }
  ] : [];

  const colsAceptantes = [
    { title: t('Cobertura'), dataIndex: 'coverageCode', width: 100 },
    { title: t('Aceptante'), dataIndex: 'contactId', width: 120 },
    { title: t('Linea'), dataIndex: 'lineId', width: 130 },
    {
      title: t('Participacion %'), dataIndex: 'split', width: 150, render: function (v, row) {
        return <InputNumber size="small" min={0} max={100} step={1} value={v} style={{ width: 110 }}
          onChange={function (x) { editarSplit(row.cessionId, row.contactId, x); }} />;
      }
    },
    { title: t('Prima cedida'), dataIndex: 'premium', align: 'right', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Comision'), dataIndex: 'commission', align: 'right', width: 120, render: function (v) { return fmt(v); } }
  ];

  const colsPersistida = [
    { title: t('Contrato'), dataIndex: 'contractId', width: 100 },
    { title: t('Linea'), dataIndex: 'lineId', width: 130 },
    { title: t('Cobertura'), dataIndex: 'coverageCode', width: 110 },
    { title: t('Movimiento'), dataIndex: 'premium', align: 'right', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Retencion'), dataIndex: 'premiumCedant', align: 'right', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Cedido'), dataIndex: 'premiumRe', align: 'right', width: 130, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } }
  ];

  const colsRea = [
    { title: t('Cobertura'), dataIndex: 'coverageCode', width: 100 },
    { title: t('Descripcion'), dataIndex: 'cover' },
    { title: t('Suma para el contrato'), dataIndex: 'counts', width: 160, render: function (v) { return v ? <Tag color="blue">{t('Si')}</Tag> : <Tag>{t('No')}</Tag>; } },
    { title: t('Movimiento'), dataIndex: 'premiumMovement', align: 'right', width: 120, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Base prorrateada'), dataIndex: 'proratedMovement', align: 'right', width: 140, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('% Retencion'), dataIndex: 'proportionCed', align: 'right', width: 110, render: function (v) { return (Number(v || 0) * 100).toFixed(2) + '%'; } },
    { title: t('Retencion'), dataIndex: 'premiumCedant', align: 'right', width: 120, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('% Cedido'), dataIndex: 'proportionRe', align: 'right', width: 100, render: function (v) { return (Number(v || 0) * 100).toFixed(2) + '%'; } },
    { title: t('Cedido'), dataIndex: 'premiumRe', align: 'right', width: 120, render: function (v) { return <span className={signo(v)}>{conSigno(v)}</span>; } },
    { title: t('Comision'), dataIndex: 'commission', align: 'right', width: 110, render: function (v) { return fmt(v); } }
  ];

  const css = `
.axx299 { display:flex; flex-direction:column; min-width:0; overflow:hidden; font-size:13px; }
.axx299 .axx-topbar { display:flex; align-items:center; gap:8px; padding:4px 0; margin:0 4px 2px 4px;
          background:transparent; border:1px solid #e6ebf2; border-radius:6px; }
.axx299 .axx-topbar > * { margin-left:4px; }
.axx299 .axx-status { background:linear-gradient(90deg, #e6f4ff 0%, #4096ff 100%); color:#fff;
          padding:4px 10px; border-radius:4px; margin:0 4px 4px 4px; font-size:13px; }
.axx299 .axx-status b { color:#fff; }
.axx299 .axx-tabs { min-width:0; margin:0 4px; }
.axx299 .axx-tabs .ant-tabs-tabpane-hidden { display:none !important; }
.axx299 .axx-tabs .ant-tabs-content { min-width:0; }
.axx299 .axx-tabs .ant-tabs-tabpane-active { min-width:0; }
.axx299 .axx-tabs .ant-tabs-tab { border:1px solid #cbd1d8 !important; border-radius:6px 6px 0 0 !important;
          margin-right:2px !important; background:#f7f9fb; position:relative; }
.axx299 .axx-tabs .ant-tabs-tab-active { border-color:#1677ff !important; background:#fff; }
.axx299 .axx-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color:#1677ff; }
.axx299 .axx-tabs .ant-tabs-tab-active::after { content:''; position:absolute; left:0; right:0; bottom:-1px;
          height:1px; background:#fff; }
.axx299 .axx-panel { border:1px solid #cbd1d8; border-top:none; background:#fff; min-width:0; }
.axx299 .axx-panel .ant-card { border:none; }
.axx299 .axx-panel .ant-card-body { padding:4px; }
.axx299 .ant-table-wrapper { border:1px solid #cbd1d8; min-width:0; }
.axx299 .ant-table-thead > tr > th { background:#bfbfbf !important; color:#262626;
          border-right:1px solid #cbd1d8 !important; border-bottom:1px solid #cbd1d8 !important;
          font-size:12px; line-height:18px; padding:5px 8px !important; }
.axx299 .ant-table-thead > tr > th:last-child { border-right:none !important; }
.axx299 .ant-table-thead > tr > th::before { display:none !important; }
.axx299 .ant-table-tbody > tr > td { border-right:none !important;
          border-bottom:1px solid #cbd1d8 !important; font-size:12px; line-height:18px;
          padding:5px 8px !important; }
.axx299 .ant-table-tbody > tr:hover > td { background:#b7d7ff !important; }
.axx299 .ant-table-tbody > tr.ant-table-row-selected > td { background:#86b4ff !important; }
/* Valores anteriores en rojo, valores nuevos en azul (criterio de la grilla antes/despues) */
.axx299 .axx-antes { color:#cf1322; }
.axx299 .axx-nuevo { color:#1677ff; }
.axx299 .axx-monto-pos { color:#237804; }
.axx299 .axx-monto-neg { color:#cf1322; }
.axx299 .axx-monto-cero { color:#262626; font-weight:normal; }
.axx299 .axx-btn-sec, .axx299-modal .axx-btn-sec { border-color:#8f9aa7 !important; }
.axx299 .ant-btn[disabled], .axx299-modal .ant-btn[disabled] {
          border-color:#6f7b88 !important; opacity:1 !important; }
.axx299 .axx-pie { padding:4px 8px; text-align:right; }
.axx299 .axx-filtros { display:flex; flex-wrap:wrap; align-items:flex-end; gap:10px; padding:6px 4px; }
.axx299 .axx-campo { display:flex; flex-direction:column; }
.axx299 .axx-campo label { font-size:12px; color:#5a6572; margin-bottom:2px; }
.axx299-modal .ant-modal-body { font-size:13px; }
.axx299 .axx-aceptantes-barra { display:flex; align-items:center; gap:8px; }
`;

  const puedeEjecutar = !!(calc && calc.rows && calc.rows.length && !running);

  return (
    <DefaultPage title={t('Endoso de vigencia de Fianzas')} subTitle={policy ? policy.code : ''}>
      <div className="axx299">
        <style>{css}</style>

        <div className="axx-status">
          <b>{t('Poliza')}:</b> {policy ? policy.code + ' — ' + policy.productCode + ' — ' + policy.currency : t('sin cargar')}
          {policy ? <span> &nbsp;|&nbsp; <b>{t('Estado')}:</b> {policy.entityState}</span> : null}
          {calc ? <span> &nbsp;|&nbsp; <b>{t('Movimiento')}:</b> {calc.direction === 'EXTENSION' ? t('Extension') : t('Reduccion')} ({calc.deltaDays} {t('dias')})</span> : null}
        </div>

        <div className="axx-topbar">
          <span>{t('Poliza')}</span>
          <Input id="txtBuscarPoliza" style={{ width: 200 }} placeholder={t('Numero o codigo')}
            value={buscarPoliza} onChange={function (e) { setBuscarPoliza(e.target.value); }}
            onPressEnter={buscar} />
          <Button id="btnBuscarPoliza" onClick={buscar} loading={loading}>{t('Cargar poliza')}</Button>
          {!policy ? <span style={{ color: '#5a6572' }}>{t('Abra la vista desde la poliza o indique aqui su numero o codigo')}</span> : null}
        </div>

        {error ? <Alert className="axx-alerta" type="error" showIcon message={error} closable onClose={function () { setError(null); }} /> : null}

        {result ? (
          <Alert type={result.ok === false ? 'error' : 'success'} showIcon
            message={result.ok === false ? t('El endoso no se completo') : t('Endoso procesado')}
            description={result.msg} closable onClose={function () { setResult(null); }} />
        ) : null}

        {result && result.persistedDistribution && result.persistedDistribution.length ? (
          <div className="axx-panel">
            <Table className="axx-persistida" size="small" pagination={false} rowKey="id"
              dataSource={result.persistedDistribution} columns={colsPersistida}
              title={function () {
                return t('Cesion escrita por el endoso') + (result.rounding && result.rounding.length
                  ? ' — ' + t('con ajuste de redondeo de un centavo en') + ' ' + result.rounding.length + ' ' + t('importe(s)')
                  : '');
              }} />
          </div>
        ) : null}

        <Tabs className="axx-tabs" activeKey={tab} onChange={setTab} type="card"
          items={[
            {
              key: 'calc', label: t('Calculo de cobertura'), children: (
                <div className="axx-panel">
                  <Card bordered={false}>
                    <div className="axx-filtros">
                      <div className="axx-campo" style={{ minWidth: 260 }}>
                        <label>{t('Cobertura a endosar')}</label>
                        <Select id="cbxCobertura" value={covCode} style={{ width: 260 }}
                          onChange={function (v) {
                            setCovCode(v);
                            const selectedCoverage = eligible.find(function (item) { return item.code === v; });
                            setNewEnd(selectedCoverage && selectedCoverage.end
                              ? moment(day10(selectedCoverage.end), 'YYYY-MM-DD', true)
                              : null);
                            invalidate();
                          }}
                          options={eligible.map(function (c) { return { value: c.code, label: c.code + ' — ' + c.name }; })} />
                      </div>
                      <div className="axx-campo">
                        <label>{t('Fecha final actual')}</label>
                        <Input id="txtFinActual" readOnly style={{ width: 140 }} value={selected ? day10(selected.end) : ''} />
                      </div>
                      <div className="axx-campo">
                        <label>{t('Nueva fecha final')}</label>
                        <DatePicker id="dtpNuevoFin" style={{ width: 150 }} value={newEnd}
                          onChange={function (v) { setNewEnd(v); invalidate(); }} />
                      </div>
                      <div className="axx-campo">
                        <label>{t('Recargo')}</label>
                        <InputNumber id="numRecargo" min={0} step={1} style={{ width: 120 }} value={surcharge}
                          onChange={function (v) { onAjuste('surcharge', v); }} />
                      </div>
                      <div className="axx-campo">
                        <label>{t('Descuento')}</label>
                        <InputNumber id="numDescuento" min={0} step={1} style={{ width: 120 }} value={discount}
                          onChange={function (v) { onAjuste('discount', v); }} />
                      </div>
                      <Button id="btnCalcular" type="primary" loading={loading}
                        disabled={!covCode || !newEnd} onClick={calcular}>{t('Calcular endoso')}</Button>
                    </div>

                    <Spin spinning={loading}>
                      {calc ? (
                        <div>
                          <Table className="axx-grilla" size="small" pagination={false} rowKey="code"
                            dataSource={calc.rows} columns={colsGrid} scroll={{ y: altoGrilla }} />
                          <div style={{ height: 8 }} />
                          <Table className="axx-resumen" size="small" pagination={false} rowKey="key"
                            dataSource={filasResumen} columns={colsResumen}
                            title={function () { return t('Resumen de facturacion') + ' (' + calc.billing.currency + ')'; }} />
                          <div className="axx-pie">
                            {t('Movimiento')}: <span className={signo(calc.billing.movement.premium)}>{conSigno(calc.billing.movement.premium)}</span>
                            {' '}{t('prima')} {' | '}
                            <span className={signo(calc.billing.movement.tax)}>{conSigno(calc.billing.movement.tax)}</span> {t('impuesto')} {' | '}
                            <span className={signo(calc.billing.movement.total)}>{conSigno(calc.billing.movement.total)}</span> {t('total')}
                            {' | '}{t('Fecha efectiva')}: {day10(calc.effectiveDate)}
                          </div>
                        </div>
                      ) : <Empty description={t('Indique la nueva fecha final y pulse Calcular endoso')} />}
                    </Spin>
                  </Card>
                </div>
              )
            },
            {
              key: 'rea', label: t('Reaseguro del movimiento'), children: (
                <div className="axx-panel">
                  <Card bordered={false}>
                    <Alert type="info" showIcon
                      message={t('Simulacion en memoria: no se escribe en Cession hasta ejecutar el endoso')} />
                    <Spin spinning={simLoading}>
                      {!calc ? <Empty description={t('Calcule el endoso en la primera pestania')} /> : null}
                      {calc && sim && sim.contracts && sim.contracts.length ? (
                        <div>
                          {sim.contracts.map(function (g) {
                            return (
                              <div key={'c' + g.contractId + g.lineId} style={{ marginTop: 8 }}>
                                <div className="axx-status">
                                  <b>{t('Contrato')}:</b> {g.contractId} &nbsp;|&nbsp; <b>{t('Linea')}:</b> {g.lineId}
                                  &nbsp;|&nbsp; <b>{t('Movimiento')}:</b> {conSigno(g.totals.movement)}
                                  &nbsp;|&nbsp; <b>{t('Retencion')}:</b> {conSigno(g.totals.cedant)}
                                  &nbsp;|&nbsp; <b>{t('Cedido')}:</b> {conSigno(g.totals.re)}
                                  &nbsp;|&nbsp; <b>{t('Comision')}:</b> {fmt(g.totals.commission)}
                                  &nbsp;|&nbsp; <b>{t('Coberturas que suman')}:</b> {g.totals.coveragesCounted}/{g.rows.length}
                                </div>
                                <Table size="small" pagination={false} rowKey="coverageCode"
                                  dataSource={g.rows} columns={colsRea} />
                                {g.facultative ? <Alert type="warning" showIcon message={t('Linea facultativa: hay que distribuir los aceptantes antes de ejecutar')} /> : null}
                                {g.participants && g.participants.length ? (
                                  <div className="axx-aceptantes-barra">
                                    <span>{t('Agregar aceptante del contrato')}:</span>
                                    {(function () {
                                      const faltan = [];
                                      for (let i = 0; i < (g.contractParticipants || []).length; i++) {
                                        const cp = g.contractParticipants[i];
                                        let esta = false;
                                        for (let k = 0; k < g.participants.length; k++) { if (g.participants[k].contactId === cp.contactId) esta = true; }
                                        if (!esta) faltan.push(cp);
                                      }
                                      if (!faltan.length) return <span>{t('todos los aceptantes del contrato ya participan')}</span>;
                                      const cesionPrincipal = g.rows.length ? g.rows[0].basedOnCessionId : 0;
                                      return faltan.map(function (cp) {
                                        return (
                                          <Button key={'add' + cp.contactId} id={'btnAgregarAceptante' + cp.contactId} size="small"
                                            onClick={function () { editarSplit(cesionPrincipal, cp.contactId, cp.contractSplit); }}>
                                            {t('Aceptante') + ' ' + cp.contactId + ' (' + cp.lineId + ' ' + cp.contractSplit + '%)'}
                                          </Button>
                                        );
                                      });
                                    })()}
                                  </div>
                                ) : null}
                                {g.participants && g.participants.length ? (
                                  <Table className="axx-aceptantes" size="small" pagination={false}
                                    rowKey={function (r) { return r.cessionId + '-' + r.contactId; }}
                                    dataSource={g.participants} columns={colsAceptantes}
                                    title={function () { return t('Aceptantes de la linea') + ' — ' + t('cedido distribuido') + ' ' + fmt(g.totals.participantPremium); }} />
                                ) : null}
                              </div>
                            );
                          })}
                          {sim.warnings && sim.warnings.length
                            ? <Alert type="warning" showIcon message={sim.warnings.join(' | ')} /> : null}
                          <div className="axx-pie">
                            {t('Base de reparto')}: {t('importe prorrateado del movimiento')} ({conSigno(sim.proratedMovement)}) &nbsp;|&nbsp;
                            {t('Movimiento total')}: {conSigno(sim.movement)} &nbsp;|&nbsp;
                            {t('Distribuido')}: {conSigno(sim.distributed)} &nbsp;|&nbsp;
                            {sim.balanced ? <Tag color="blue">{t('Cuadrado')}</Tag> : <Tag color="red">{t('Descuadrado')}</Tag>}
                          </div>
                        </div>
                      ) : null}
                      {calc && sim && (!sim.contracts || !sim.contracts.length)
                        ? <Empty description={sim.msg || t('La poliza no tiene reaseguro vigente para este movimiento')} /> : null}
                    </Spin>
                  </Card>
                </div>
              )
            }
          ]} />

        <div className="axx-pie">
          <Button id="btnEjecutar" type="primary" disabled={!puedeEjecutar} loading={running}
            onClick={function () { setNote(''); setNoteTouched(false); setModal(true); }}>{t('Ejecutar endoso')}</Button>
        </div>

        <Modal wrapClassName="axx299-modal" title={t('Confirmar ejecucion del endoso')} open={modal}
          okText={t('Confirmar')} cancelText={t('Cancelar')} confirmLoading={running}
          okButtonProps={{ id: 'btnConfirmar', disabled: running }}
          onOk={ejecutar}
          onCancel={function () { if (!running) { setModal(false); } }}>
          <div>
            {calc ? (
              <div style={{ marginBottom: 8 }}>
                {t('Cobertura')} <b>{calc.rows[0].code}</b>: {day10(calc.rows[0].oldEnd)} → <b>{day10(calc.rows[0].newEnd)}</b><br />
                {t('Prima')} {fmt(calc.rows[0].oldPremium)} → <b>{fmt(calc.rows[0].adjustedPremium)}</b> {calc.billing.currency}
                &nbsp;({conSigno(calc.rows[0].variation)})<br />
                {t('Total de la poliza')} {fmt(calc.billing.total.before)} → <b>{fmt(calc.billing.total.after)}</b>
              </div>
            ) : null}
            <label>{t('Observacion')} *</label>
            <Input.TextArea id="txtObservacion" rows={3} value={note} maxLength={500}
              onChange={function (e) { setNote(e.target.value); setNoteTouched(true); }} />
            {noteTouched && !txt(note)
              ? <div style={{ color: '#cf1322' }}>{t('La observacion es obligatoria')}</div> : null}
          </div>
        </Modal>
      </div>
    </DefaultPage>
  );
}
