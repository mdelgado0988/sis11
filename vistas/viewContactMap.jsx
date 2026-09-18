/**
 * @name viewContactMap
 * @description Mapa de relaciones de un contacto con sus pólizas y reclamos.
 * @type VIEW
 * @author Equipo de Desarrollo
 * @created 2026/09/18
 * @version 1.0.0
 * @purpose Buscar un contacto, consultar sus pólizas y reclamos, mostrar el
 *          estado de la póliza y, para fianzas, el estado leído del objeto asegurado.
 */

function ContactMap() {
  const Input = A.Input;
  const Tree = A.Tree;
  const Empty = A.Empty;
  const Alert = A.Alert;
  const Spin = A.Spin;
  const Descriptions = A.Descriptions;
  const Tag = A.Tag;
  const Row = A.Row;
  const Col = A.Col;
  const Card = A.Card;
  const Modal = A.Modal;
  const Table = A.Table;
  const Button = A.Button;

  // Tamano de pagina: 100 por nivel del Tree y por pagina de la grilla del modal.
  const PAGE = 100;

  const [error, setError] = useState(null);
  const [contact, setContact] = useState(null);
  const [matchType, setMatchType] = useState("");
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [loadedKeys, setLoadedKeys] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [panel, setPanel] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [treeHeight, setTreeHeight] = useState(420);

  // modal de busqueda
  const [modalOpen, setModalOpen] = useState(false);
  const [fName, setFName] = useState("");
  const [fIdent, setFIdent] = useState("");
  const [fCode, setFCode] = useState("");
  const [fCobis, setFCobis] = useState("");
  const [gridRows, setGridRows] = useState([]);
  const [gridTotal, setGridTotal] = useState(0);
  const [gridPage, setGridPage] = useState(1);      // 1-based para antd; al comando va -1
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState(null);
  const [gridSearched, setGridSearched] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const clickTimer = React.useRef(null);
  const branchRef = React.useRef({});               // estado de paginacion por rama

  // ---------- helpers ----------

  function esc(v) {
    return String(v === null || v === undefined ? "" : v)
      .replace(/'/g, "''")
      .replace(/;/g, " ")
      .replace(/--/g, " ");
  }

  function fmtDate(d) {
    return d ? moment(d).format("DD/MM/YYYY") : "-";
  }

  function fmtNum(n) {
    if (n === null || n === undefined || n === "") return "-";
    return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function periodicityLabel(p) {
    const m = { m: t("Mensual"), q: t("Trimestral"), s: t("Semestral"), y: t("Anual"), a: t("Anual") };
    if (!p) return "-";
    return m[String(p).toLowerCase()] || String(p);
  }

  // Nombre completo segun la revision: persona = name + surname1, empresa = surname2.
  function contactName(c) {
    if (!c) return "";
    if (c.isPerson) return [c.name, c.surname1].filter(function (x) { return x; }).join(" ").trim();
    return String(c.surname2 || "").trim();
  }

  function contactType(c) {
    return c && c.isPerson ? t("Natural") : t("Jurídico");
  }

  function contactIdent(c) {
    if (!c) return "-";
    const v = c.isPerson ? c.cnp : c.nif;
    return v ? String(v) : "-";
  }

  // Icono de lupa de Ant Design. `antd` 4 no exporta iconos, asi que va el mismo trazado
  // oficial como SVG en linea, con la clase `anticon` para heredar el estilo nativo.
  function searchIcon() {
    return React.createElement("span", { className: "anticon", role: "img" },
      React.createElement("svg", {
        viewBox: "64 64 896 896", width: "1em", height: "1em", fill: "currentColor",
        "aria-hidden": "true", focusable: "false"
      }, React.createElement("path", {
        d: "M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"
      })));
  }

  // ---------- busqueda del modal (CA-01 a CA-05) ----------
  // Los cuatro campos combinan con AND; los vacios se ignoran (N3).
  // Nombre: inicial por isPerson. Identificacion / codigo / COBIS: exactos como cadena (N4).
  function buildGridFilter() {
    const parts = [];
    const nombre = esc(String(fName).trim());
    const ident = esc(String(fIdent).trim());
    const code = esc(String(fCode).trim());
    const cobis = esc(String(fCobis).trim());

    if (nombre) {
      parts.push("((isPerson=1 AND (RTRIM(ISNULL(name,'')) + ' ' + RTRIM(ISNULL(surname1,''))) LIKE N'" + nombre + "%')" +
        " OR (isPerson=0 AND surname2 LIKE N'" + nombre + "%'))");
    }
    if (ident) parts.push("(cnp = N'" + ident + "' OR nif = N'" + ident + "')");
    if (code) parts.push("CAST(id AS NVARCHAR(50)) = N'" + code + "'");
    if (cobis) parts.push("CAST(nationalId AS NVARCHAR(50)) = N'" + cobis + "'");
    return parts.join(" AND ");
  }

  async function runGridSearch(page) {
    const filter = buildGridFilter();
    if (!filter) {
      setGridError(t("Ingrese al menos un criterio de búsqueda"));
      return;
    }
    setGridError(null);
    setGridLoading(true);
    setSelectedRow(null);
    try {
      // 🔴 `page` es BASE 0 en el comando; antd pagina desde 1.
      const r = await exe("GetContacts", { filter: filter, size: PAGE, page: page - 1 });
      if (!r || !r.ok) throw new Error(r && r.msg ? r.msg : "GetContacts");
      setGridRows(r.outData || []);
      setGridTotal(r.total || 0);
      setGridPage(page);
      setGridSearched(true);
    } catch (err) {
      setGridError(err && err.message ? err.message : String(err));
      setGridRows([]);
      setGridTotal(0);
    }
    setGridLoading(false);
  }

  function openModal() {
    setGridError(null);
    setModalOpen(true);
  }

  function clearModal() {
    setFName(""); setFIdent(""); setFCode(""); setFCobis("");
    setGridRows([]); setGridTotal(0); setGridPage(1);
    setGridSearched(false); setSelectedRow(null); setGridError(null);
  }

  // ---------- arbol (CA-06, CA-07, CA-08) ----------

  function ramoOfPolicy(p) {
    if (p.Lob && p.Lob.name) return p.Lob.name;
    return p.lob ? String(p.lob) : t("Sin ramo");
  }

  function ramoCodeOfPolicy(p) {
    const lob = p && p.Lob;
    const value = lob && (lob.code !== undefined ? lob.code : lob.id) !== undefined
      ? (lob.code !== undefined ? lob.code : lob.id)
      : (p && (p.lobCode !== undefined ? p.lobCode : p.lob));
    return String(value === null || value === undefined ? "" : value).trim();
  }

  function esFianza(p) {
    return ["81", "82", "83", "84"].indexOf(ramoCodeOfPolicy(p)) >= 0;
  }

  function estadoTag(estado, activoLabel, inactivoLabel) {
    const value = String(estado || "").trim().toUpperCase();
    if (value === "ACTIVE" || value === "ACTIVO" || value === "VIGENTE" || value === "1") {
      return <Tag color="green">{activoLabel}</Tag>;
    }
    if (value === "INACTIVE" || value === "INACTIVO" || value === "NO VIGENTE" || value === "0") {
      return <Tag color="red">{inactivoLabel}</Tag>;
    }
    return <Tag color="orange">{estado || t("No informado")}</Tag>;
  }

  function valorCampoObjeto(objeto, nombre) {
    let campos = objeto && objeto.jValues;
    try {
      if (typeof campos === "string") campos = JSON.parse(campos || "[]");
    } catch (e) {
      campos = [];
    }
    if (!Array.isArray(campos)) return "";
    const campo = campos.find(function (item) { return item && item.name === nombre; });
    const valor = campo && Array.isArray(campo.userData) ? campo.userData[0] : null;
    return valor === null || valor === undefined ? "" : String(valor).trim();
  }

  async function cargarEstadoFianza(policyId) {
    const r = await exe("LoadEntities", {
      entity: "InsuredObject",
      fields: "lifePolicyId,jValues",
      filter: "lifePolicyId = " + Number(policyId),
      noTracking: true
    });
    if (!r || r.ok === false) return "";
    const objetos = Array.isArray(r.outData) ? r.outData : [];
    const objeto = objetos.find(function (item) { return valorCampoObjeto(item, "cmbEstadoFianza") !== ""; });
    return objeto ? valorCampoObjeto(objeto, "cmbEstadoFianza") : "";
  }

  function ramoOfClaim(cl) {
    if (cl.Policy && cl.Policy.Lob && cl.Policy.Lob.name) return cl.Policy.Lob.name;
    if (cl.Policy && cl.Policy.lob) return String(cl.Policy.lob);
    return t("Sin ramo");
  }

  function yearOf(d) {
    return d ? moment(d).format("YYYY") : t("Sin año");
  }

  function groupBranch(items, ramoFn, dateFn, kind) {
    const map = {};
    items.forEach(function (it) {
      const r = ramoFn(it);
      const y = yearOf(dateFn(it));
      if (!map[r]) map[r] = {};
      if (!map[r][y]) map[r][y] = [];
      map[r][y].push(it);
    });
    const ramos = Object.keys(map).sort(function (a, b) { return a.localeCompare(b); });
    return ramos.map(function (r) {
      const years = Object.keys(map[r]).sort(function (a, b) { return b.localeCompare(a); });
      return {
        key: kind + "|ramo|" + r,
        title: r,
        selectable: false,
        children: years.map(function (y) {
          const rows = map[r][y].slice().sort(function (a, b) {
            const da = dateFn(a) ? moment(dateFn(a)).valueOf() : 0;
            const db = dateFn(b) ? moment(dateFn(b)).valueOf() : 0;
            return db - da;
          });
          return {
            key: kind + "|year|" + r + "|" + y,
            title: y + "  (" + rows.length + ")",
            selectable: false,
            children: rows.map(function (it) {
              const label = (it.code ? String(it.code) : "#" + it.id) + "  ·  " + fmtDate(dateFn(it));
              return { key: kind + "|item|" + it.id, title: label, isLeaf: true, kind: kind };
            })
          };
        })
      };
    });
  }

  // Titulo de rama: SIEMPRE el total del servidor, aunque las hojas esten cargadas de a 100 (N11).
  // Con carga parcial el contador es lo unico que distingue un arbol truncado de uno completo.
  function branchTitle(kind, loaded, total) {
    const label = kind === "policies" ? t("Pólizas") : t("Reclamos");
    if (loaded >= total) return label + " (" + total + ")";
    return label + " (" + loaded + " " + t("de") + " " + total + ")";
  }

  function branchChildren(kind) {
    const st = branchRef.current[kind];
    if (!st) return [];
    if (!st.rows.length) {
      const vacio = kind === "policies" ? t("Sin pólizas") : t("Sin reclamos");
      return [{ key: kind + "|none", title: vacio, selectable: false, disabled: true, isLeaf: true }];
    }
    const groups = kind === "policies"
      ? groupBranch(st.rows, ramoOfPolicy, function (p) { return p.start; }, kind)
      : groupBranch(st.rows, ramoOfClaim, function (cl) { return cl.occurrence; }, kind);
    if (st.rows.length < st.total) {
      const faltan = st.total - st.rows.length;
      const lote = Math.min(PAGE, faltan);
      groups.push({
        key: kind + "|more",
        title: "⬇  " + t("Cargar más") + "  (" + lote + " " + t("de") + " " + faltan + " " + t("restantes") + ")",
        isLeaf: true,
        selectable: true,
        className: "cm-more"
      });
    }
    return groups;
  }

  // 🔴 El total de una rama sale del conteo que se hizo al elegir el contacto, NO del
  // estado de carga: si se lee de ahi, al cargar una rama la OTRA vuelve a cero y se
  // pierde justo el contador que N11 pide conservar.
  function totalOf(kind) {
    const st = branchRef.current[kind];
    if (st) return st.total;
    const tot = branchRef.current.totals;
    return tot && tot[kind] !== undefined ? tot[kind] : 0;
  }

  function rebuildTree(c) {
    const p = branchRef.current.policies;
    const cl = branchRef.current.claims;
    setTreeData([{
      key: "root",
      title: contactName(c),
      selectable: false,
      children: [
        {
          key: "policies",
          title: branchTitle("policies", p ? p.rows.length : 0, totalOf("policies")),
          selectable: false,
          isLeaf: false,
          children: p ? branchChildren("policies") : undefined
        },
        {
          key: "claims",
          title: branchTitle("claims", cl ? cl.rows.length : 0, totalOf("claims")),
          selectable: false,
          isLeaf: false,
          children: cl ? branchChildren("claims") : undefined
        }
      ]
    }]);
  }

  function contactClause(id) {
    return "holderId=" + id +
      " OR id in (select lifePolicyId from Insured where contactId=" + id + ")" +
      " OR id in (select lifePolicyId from Beneficiary where contactId=" + id + ")";
  }

  // CA-07: la rama Polizas solo trae pólizas con activeDate distinto de null.
  // Los reclamos NO se filtran por estado (N9), y un reclamo cuya poliza ya no aparece
  // se sigue mostrando (N10).
  function branchFilter(kind, id) {
    if (kind === "policies") return "(" + contactClause(id) + ") AND activeDate IS NOT NULL";
    return "contactId=" + id + " OR claimerId=" + id;
  }

  async function tryExe(cmd, rich, plain) {
    let r = await exe(cmd, rich);
    if (r && r.ok) return r;
    r = await exe(cmd, plain);
    return r;
  }

  async function fetchBranchPage(kind, c, page) {
    const filter = branchFilter(kind, c.id);
    const inc = kind === "policies" ? ["Lob"] : ["Policy", "Policy.Lob", "Payouts", "Stage"];
    // 🔴 page BASE 0 tambien en cada nivel del Tree (N12).
    const r = await tryExe(kind === "policies" ? "RepoLifePolicy" : "RepoClaim",
      { operation: "GET", filter: filter, include: inc, size: PAGE, page: page },
      { operation: "GET", filter: filter, size: PAGE, page: page });
    if (!r || !r.ok) throw new Error(r && r.msg ? r.msg : kind);
    return { rows: r.outData || [], total: r.total || 0 };
  }

  // Conteo de la rama sin traer filas: da el total que el titulo muestra siempre (N11).
  async function fetchBranchTotal(kind, c) {
    const filter = branchFilter(kind, c.id);
    const r = await exe(kind === "policies" ? "RepoLifePolicy" : "RepoClaim",
      { operation: "GET", filter: filter, size: 1, page: 0 });
    if (!r || !r.ok) throw new Error(r && r.msg ? r.msg : kind);
    return r.total || 0;
  }

  // rc-tree llama esto al expandir una rama sin hijos: ahi se cargan los primeros 100 (CA-08).
  async function onLoadData(node) {
    const kind = node.key;
    if (kind !== "policies" && kind !== "claims") return;
    if (branchRef.current[kind]) return;
    const c = contact;
    if (!c) return;
    const page0 = await fetchBranchPage(kind, c, 0);
    branchRef.current[kind] = { rows: page0.rows, total: page0.total, page: 0 };
    rebuildTree(c);
  }

  async function loadMore(kind) {
    const st = branchRef.current[kind];
    const c = contact;
    if (!st || !c) return;
    setTreeLoading(true);
    try {
      const next = await fetchBranchPage(kind, c, st.page + 1);
      st.rows = st.rows.concat(next.rows);
      st.total = next.total;
      st.page = st.page + 1;
      rebuildTree(c);
    } catch (err) {
      setError(err && err.message ? err.message : String(err));
    }
    setTreeLoading(false);
  }

  // CA-06: la fila seleccionada se carga como NUEVA raiz; se descarta el arbol anterior
  // y se limpia el panel (N7).
  async function selectContact(c) {
    setModalOpen(false);
    setError(null);
    setPanel(null);
    setPanelLoading(false);
    branchRef.current = {};
    setLoadedKeys([]);
    setContact(c);
    setMatchType(contactType(c));
    setTreeLoading(true);
    try {
      const tp = await fetchBranchTotal("policies", c);
      const tc = await fetchBranchTotal("claims", c);
      branchRef.current = { totals: { policies: tp, claims: tc } };
      rebuildTree(c);
      setExpandedKeys(["root"]);
    } catch (err) {
      setError(err && err.message ? err.message : String(err));
      setTreeData([]);
    }
    setTreeLoading(false);
  }

  // ---------- panel de resumen (se conserva tal cual estaba) ----------

  async function loadPolicyPanel(id) {
    const rich = { operation: "GET", filter: "id=" + id, include: ["Holder", "Insureds.Contact", "Beneficiaries.Contact", "PayPlan", "Lob"], size: 1, page: 0 };
    const plain = { operation: "GET", filter: "id=" + id, include: ["Holder", "PayPlan"], size: 1, page: 0 };
    const r = await tryExe("RepoLifePolicy", rich, plain);
    if (!r || !r.ok) throw new Error(r && r.msg ? r.msg : "RepoLifePolicy");
    const p = (r.outData || [])[0];
    if (!p) throw new Error(t("Póliza no encontrada"));

    let estadoFianza = "";
    if (esFianza(p)) {
      estadoFianza = await cargarEstadoFianza(id);
    }

    let nextDue = "-";
    const plan = (p.PayPlan || []).filter(function (x) {
      const pend = x.pending !== undefined && x.pending !== null ? x.pending : (Number(x.expected || 0) - Number(x.payed || 0));
      return Number(pend) > 0 && x.dueDate;
    }).sort(function (a, b) { return moment(a.dueDate).valueOf() - moment(b.dueDate).valueOf(); });
    if (plan.length) nextDue = fmtDate(plan[0].dueDate);

    const insureds = (p.Insureds || []).map(function (i) {
      return i.Contact ? contactName(i.Contact) : "#" + i.contactId;
    });
    const benefs = (p.Beneficiaries || []).map(function (b) {
      const n = b.Contact ? contactName(b.Contact) : "#" + b.contactId;
      return b.percentage !== undefined && b.percentage !== null ? n + " (" + b.percentage + "%)" : n;
    });

    setPanel({
      title: t("Póliza") + " " + (p.code ? p.code : "#" + p.id),
      rows: [
        { label: t("Estado"), value: estadoTag(p.entityState, t("Activo"), t("Inactiva")) },
        ...(esFianza(p) ? [{
          label: t("Estado de la fianza"),
          value: estadoTag(estadoFianza, t("Vigente"), t("No vigente"))
        }] : []),
        { label: t("Ramo"), value: ramoOfPolicy(p) },
        { label: t("Vigencia"), value: fmtDate(p.start) + " - " + fmtDate(p.end) },
        { label: t("Periodicidad"), value: periodicityLabel(p.periodicity) },
        { label: t("Forma de pago"), value: p.paymentMethod ? String(p.paymentMethod) : "-" },
        { label: t("Próximo vencimiento"), value: nextDue },
        { label: t("Prima"), value: fmtNum(p.installment !== undefined && p.installment !== null ? p.installment : p.anualPremium) },
        { label: t("Tenedor"), value: p.Holder ? contactName(p.Holder) : (p.holderId ? "#" + p.holderId : "-") },
        { label: t("Asegurado"), value: insureds.length ? insureds.join(", ") : "-" },
        { label: t("Beneficiario"), value: benefs.length ? benefs.join(", ") : "-" }
      ]
    });
  }

  async function loadClaimPanel(id) {
    const rich = { operation: "GET", filter: "id=" + id, include: ["Payouts", "Stage", "Policy", "EventReason", "InsuredEvent"], size: 1, page: 0 };
    const plain = { operation: "GET", filter: "id=" + id, size: 1, page: 0 };
    const r = await tryExe("RepoClaim", rich, plain);
    if (!r || !r.ok) throw new Error(r && r.msg ? r.msg : "RepoClaim");
    const cl = (r.outData || [])[0];
    if (!cl) throw new Error(t("Reclamo no encontrado"));

    let reserved = 0;
    let payed = 0;
    (cl.Payouts || []).forEach(function (po) {
      reserved += Number(po.reserved || 0);
      payed += Number(po.payed || 0);
    });

    setPanel({
      title: t("Reclamo") + " " + (cl.code ? cl.code : "#" + cl.id),
      rows: [
        { label: t("Fecha ocurrencia"), value: fmtDate(cl.occurrence) },
        { label: t("Fecha notificación"), value: fmtDate(cl.notification) },
        { label: t("Saldo reserva"), value: fmtNum(reserved) },
        { label: t("Saldo pagos"), value: fmtNum(payed) },
        { label: t("Razón del evento"), value: cl.EventReason && cl.EventReason.name ? cl.EventReason.name : (cl.eventReason ? String(cl.eventReason) : "-") },
        { label: t("Evento asegurado"), value: cl.InsuredEvent && cl.InsuredEvent.name ? cl.InsuredEvent.name : (cl.insuredEvent ? String(cl.insuredEvent) : "-") },
        { label: t("Estado"), value: cl.Stage && cl.Stage.name ? cl.Stage.name : (cl.stageCode ? String(cl.stageCode) : "-") },
        { label: t("Descripción"), value: cl.description ? String(cl.description) : "-" }
      ]
    });
  }

  async function openPanel(key) {
    const parts = String(key).split("|");
    setPanel(null);          // CA17: nunca conserva el nodo anterior
    setPanelLoading(true);
    try {
      if (parts[0] === "policies") await loadPolicyPanel(parts[2]);
      else await loadClaimPanel(parts[2]);
    } catch (err) {
      setPanel({ title: t("Error"), rows: [{ label: t("Detalle"), value: err && err.message ? err.message : String(err) }] });
    }
    setPanelLoading(false);
  }

  // ---------- interacciones ----------

  function onSelect(keys, info) {
    const node = info && info.node;
    if (!node) return;
    const key = String(node.key);
    if (key === "policies|more" || key === "claims|more") {   // cargar mas: accion inmediata
      loadMore(key.split("|")[0]);
      return;
    }
    if (!node.isLeaf || node.disabled) return;                // padres/agrupadores: solo navegacion
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(function () {
      clickTimer.current = null;
      openPanel(key);
    }, 250);
  }

  function onDoubleClick(e, node) {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    if (!node || !node.isLeaf || node.disabled) return;
    const parts = String(node.key).split("|");
    if (parts[1] !== "item") return;
    setPanel(null);
    setPanelLoading(false);
    if (parts[0] === "policies") window.location.hash = "#/lifePolicy/" + parts[2];
    else window.location.hash = "#/healthclaim/" + parts[2];
  }

  // Alto del arbol atado al viewport, recalculado en cada resize y limpiado al desmontar.
  useEffect(function () {
    function recalc() {
      const h = Math.max(220, window.innerHeight - 300);
      setTreeHeight(h);
    }
    recalc();
    window.addEventListener("resize", recalc);
    return function () { window.removeEventListener("resize", recalc); };
  }, []);

  // ---------- estilos (INSTRUCCIONES_DISENO_VISTAS, acotado a lo que esta vista dibuja) ----------

  const CSS =
    ".cm-root{display:flex;flex-direction:column;min-height:0;overflow:hidden;font-size:13px}" +
    ".cm-root .ant-card-body{padding:4px}" +
    ".cm-bar{background:transparent;border:1px solid #e6ebf2;border-radius:6px;padding:10px 12px;margin-bottom:8px}" +
    ".cm-body{display:flex;flex:1 1 auto;min-height:0}" +
    ".cm-tree{border:1px solid #cbd1d8;border-radius:6px;padding:4px;overflow:auto;min-height:0}" +
    ".cm-more .ant-tree-title{color:#1677ff;font-weight:500}" +
    ".cm-grid .ant-table{border:1px solid #cbd1d8;border-radius:6px;font-size:12px;line-height:18px}" +
    ".cm-grid .ant-table-thead>tr>th{background:#bfbfbf;border-right:1px solid #cbd1d8;padding:5px 8px;font-size:12px;line-height:18px}" +
    ".cm-grid .ant-table-thead>tr>th:last-child{border-right:none}" +
    ".cm-grid .ant-table-tbody>tr>td{border-right:none;border-bottom:1px solid #cbd1d8;padding:5px 8px;font-size:12px;line-height:18px}" +
    ".cm-grid .ant-table-tbody>tr{cursor:pointer}" +
    ".cm-grid .ant-table-tbody>tr:hover>td{background:#b7d7ff !important}" +
    ".cm-grid .ant-table-tbody>tr.ant-table-row-selected>td," +
    ".cm-grid .ant-table-tbody>tr.cm-selected-row>td," +
    ".cm-grid .ant-table-tbody>tr.cm-selected-row:hover>td{background:#86b4ff !important}" +
    ".cm-panel .ant-descriptions-item-label{background:#fafafa}";

  // ---------- grilla del modal (CA-05 columnas) ----------

  const columns = [
    { title: t("Id Contacto"), dataIndex: "id", width: 110 },
    { title: t("Número COBIS"), key: "cobis", render: function (r) { return r.nationalId ? String(r.nationalId) : "-"; }, width: 140 },
    { title: t("Nombre Completo"), key: "full", render: function (r) { return contactName(r) || "-"; } },
    { title: t("Tipo de Contacto"), key: "tipo", render: function (r) { return contactType(r); }, width: 130 },
    { title: t("Identificación"), key: "ident", render: function (r) { return contactIdent(r); }, width: 170 }
  ];

  return (
    <DefaultPage title="ContactMap" subTitle={t("Mapa del contacto")} icon="apartment">
      <style>{CSS}</style>
      <div className="cm-root">

        <div className="cm-bar">
          <Button className="cm-btn-buscar" type="primary" icon={searchIcon()} onClick={openModal}>
            {"  " + t("Buscar")}
          </Button>
          {matchType ? <Tag className="cm-matchtype" color="blue" style={{ marginLeft: 12 }}>{matchType}</Tag> : null}
          {contact ? <span className="cm-contacto" style={{ marginLeft: 8 }}>{contactName(contact)}</span> : null}
        </div>

        <div className="cm-body">
          <Row gutter={16} style={{ flex: "1 1 auto", minHeight: 0, width: "100%" }}>
            <Col span={14} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              {error ? <Alert className="cm-error" type="error" showIcon message={error} /> : null}
              {treeLoading ? <div className="cm-loading"><Spin /></div> : null}
              {!error && treeData.length ? (
                <Tree
                  className="cm-tree"
                  treeData={treeData}
                  height={treeHeight}
                  virtual
                  loadData={onLoadData}
                  loadedKeys={loadedKeys}
                  onLoad={setLoadedKeys}
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                  onSelect={onSelect}
                  onDoubleClick={onDoubleClick} />
              ) : null}
              {!error && !treeData.length && !treeLoading ? (
                <div className="cm-vacio"><Empty description={t("Pulse Buscar para elegir un contacto")} /></div>
              ) : null}
            </Col>

            <Col span={10} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              <Card className="cm-panel" size="small" title={panel ? panel.title : t("Resumen")}>
                {panelLoading ? <div className="cm-panel-loading"><Spin /></div> : null}
                {!panelLoading && panel ? (
                  <Descriptions className="cm-panel-body" column={1} size="small" bordered>
                    {panel.rows.map(function (row) {
                      return <Descriptions.Item key={row.label} label={row.label}>{row.value}</Descriptions.Item>;
                    })}
                  </Descriptions>
                ) : null}
                {!panelLoading && !panel ? <Empty description={t("Seleccione un nodo final")} /> : null}
              </Card>
            </Col>
          </Row>
        </div>

        <Modal
          className="cm-modal"
          title={t("Buscar contacto")}
          visible={modalOpen}
          width={900}
          onCancel={function () { setModalOpen(false); }}
          footer={null}
          destroyOnClose={false}>

          <div className="cm-bar">
            <Row gutter={8}>
              <Col span={6}>
                <Input className="cm-f-nombre" placeholder={t("Nombre")} value={fName}
                  onChange={function (e) { setFName(e.target.value); }}
                  onPressEnter={function () { runGridSearch(1); }} />
              </Col>
              <Col span={6}>
                <Input className="cm-f-ident" placeholder={t("Identificación")} value={fIdent}
                  onChange={function (e) { setFIdent(e.target.value); }}
                  onPressEnter={function () { runGridSearch(1); }} />
              </Col>
              <Col span={6}>
                <Input className="cm-f-codigo" placeholder={t("Código del contacto")} value={fCode}
                  onChange={function (e) { setFCode(e.target.value); }}
                  onPressEnter={function () { runGridSearch(1); }} />
              </Col>
              <Col span={6}>
                <Input className="cm-f-cobis" placeholder={t("COBIS")} value={fCobis}
                  onChange={function (e) { setFCobis(e.target.value); }}
                  onPressEnter={function () { runGridSearch(1); }} />
              </Col>
            </Row>
            <div style={{ marginTop: 10 }}>
              <Button className="cm-btn-modal-buscar" type="primary" icon={searchIcon()}
                loading={gridLoading} onClick={function () { runGridSearch(1); }}>
                {"  " + t("Buscar")}
              </Button>
              <Button className="cm-btn-limpiar" style={{ marginLeft: 8, borderColor: "#8f9aa7" }} onClick={clearModal}>
                {t("Limpiar")}
              </Button>
            </div>
          </div>

          {gridError ? <Alert className="cm-grid-error" type="error" showIcon message={gridError} style={{ marginBottom: 8 }} /> : null}

          <Table
            className="cm-grid"
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={gridRows}
            loading={gridLoading}
            locale={{ emptyText: gridSearched ? t("No se encontraron contactos") : t("Ingrese un criterio y pulse Buscar") }}
            rowClassName={function (r) { return selectedRow && selectedRow.id === r.id ? "cm-selected-row" : ""; }}
            onRow={function (r) {
              return {
                onClick: function () { setSelectedRow(r); },
                onDoubleClick: function () { selectContact(r); }
              };
            }}
            pagination={{
              current: gridPage,
              pageSize: PAGE,
              total: gridTotal,
              showSizeChanger: false,
              showTotal: function (tot) { return t("Total") + ": " + tot; },
              onChange: function (p) { runGridSearch(p); }
            }} />

          <div style={{ marginTop: 10, textAlign: "right" }}>
            <Button className="cm-btn-cancelar" style={{ marginRight: 8, borderColor: "#8f9aa7" }}
              onClick={function () { setModalOpen(false); }}>
              {t("Cancelar")}
            </Button>
            <Button className="cm-btn-cargar" type="primary" disabled={!selectedRow}
              onClick={function () { if (selectedRow) selectContact(selectedRow); }}>
              {t("Cargar contacto")}
            </Button>
          </div>
        </Modal>

      </div>
    </DefaultPage>
  );
}
