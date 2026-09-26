/**
 * @author aiden_mission_configurator
 * @created 2026-09-22
 * @summary Administracion de informacion de contacto: busca un contacto por nombre,
 *          identificacion o numero cobis desde un drawer de filtros, lo lista en una
 *          grilla con su telefono y correo principales, y permite dar de alta, modificar
 *          y dar de baja telefonos y correos con la misma funcionalidad de la vista
 *          nativa de contacto. La actualizacion se hace con la cadena
 *          cmdUpdateContactInfoCashier, que crea la solicitud de cambio, lleva el flujo
 *          de trabajo vigente hasta la aprobacion y lo ejecuta.
 * @name ContactInfoAdministration
 * @version 1.0.0
 * @origin MSN-000018 / AXX-1465
 *
 * Notas de motor (react-live -> buble):
 *  - NO usar arrow functions async: buble le come el `async` y la vista no abre.
 *  - buble NO decodifica entidades HTML en JSX: va {' '} en vez de &nbsp;.
 *  - antd 4 no exporta Icon: los iconos se dibujan como SVG inline.
 *  - El scope no trae useRef suelto; llega como React.useRef.
 */
() => {
  const { Table, Form, Input, Select, Button, Space, Card, Alert, Spin, Tag, Empty,
          Typography, Drawer, Tabs, Popconfirm, message } = A;
  const { Column } = Table;
  const { Option } = Select;
  const { Text } = Typography;
  const { TabPane } = Tabs;

  const CADENA = 'cmdUpdateContactInfoCashier';
  const PAGINA = 10;
  const ANCHO_GRILLA = 1020;

  // ---------- iconos (antd 4 no exporta Icon) ----------
  const svg = (ds) => (
    <span role="img" className="anticon">
      <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        {ds.map(function (d, i) { return <path key={i} d={d} />; })}
      </svg>
    </span>
  );
  const IcoBuscar = () => svg(['M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z']);
  const IcoActualizar = () => svg(['M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z']);
  const IcoAgregar = () => svg([
    'M696 480H544V328c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v152H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h152v152c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V544h152c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8z',
    'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z']);
  const IcoQuitar = () => svg([
    'M696 480H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h368c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8z',
    'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z']);
  const IcoGuardar = () => svg(['M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z']);

  const CRITERIOS_VACIOS = { tipo: '', nombre: '', identificacion: '', noCobis: '' };

  const [criterios, setCriterios] = useState(CRITERIOS_VACIOS);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [contactos, setContactos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [buscado, setBuscado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [errorFiltros, setErrorFiltros] = useState(null);
  const [pestana, setPestana] = useState('busqueda');

  const [sel, setSel] = useState(null);
  const [phonePpal, setPhonePpal] = useState('');
  const [emailPpal, setEmailPpal] = useState('');
  const [phones, setPhones] = useState([]);
  const [emails, setEmails] = useState([]);
  const [tiposTel, setTiposTel] = useState([]);
  const [tiposMail, setTiposMail] = useState([]);
  const [mascaraTelefono, setMascaraTelefono] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorEdicion, setErrorEdicion] = useState(null);
  const [altoGrilla, setAltoGrilla] = useState(260);

  const refBusq = React.useRef(null);

  // ---------- catalogos de tipo, los mismos que usa la vista nativa ----------
  useEffect(function () {
    exe('RepoCommunicationsCatalog', { operation: 'GET', filter: "field='PHONETYPE'" }).then(function (r) {
      if (r && r.ok) setTiposTel(r.outData || []);
    });
    exe('RepoCommunicationsCatalog', { operation: 'GET', filter: "field='EMAILTYPE'" }).then(function (r) {
      if (r && r.ok) setTiposMail(r.outData || []);
    });
    exe('RepoFieldRule', { operation: 'GET', filter: "entity='Contact' AND field = 'phone'" }).then(function (r) {
      const reglas = r && Array.isArray(r.outData)
        ? r.outData
        : (r && r.outData && Array.isArray(r.outData.data) ? r.outData.data : []);
      const regla = reglas[0] || {};
      const frontValidation = regla.frontValidation || regla.FrontValidation;
      if (!frontValidation) return;

      let configuracion = frontValidation;
      if (typeof configuracion === 'string') {
        try {
          configuracion = JSON.parse(configuracion);
        } catch (jsonError) {
          try {
            // frontValidation stores JavaScript configuration, not always strict JSON.
            configuracion = Function('return (' + configuracion + ')')();
          } catch (jsError) {
            configuracion = null;
          }
        }
      }
      if (Array.isArray(configuracion)) {
        configuracion = configuracion.length === 1
          ? configuracion[0]
          : { mask: configuracion };
      }
      if (configuracion && typeof configuracion === 'object') setMascaraTelefono(configuracion);
    }).catch(function () { setMascaraTelefono(null); });
  }, []);

  useEffect(function () {
    if (!mascaraTelefono || typeof document === 'undefined') return undefined;
    const root = document.querySelector('.axx1465');
    if (!root) return undefined;
    const inputs = root.querySelectorAll('input.axx-phone-mask, .axx-phone-mask input');
    const opciones = mascaraTelefono;
    const InputmaskGlobal = typeof Inputmask === 'function'
      ? Inputmask
      : (typeof window !== 'undefined' ? window.Inputmask : null);
    const jquery = typeof window !== 'undefined' ? (window.jQuery || window.$) : null;
    const enmascarados = [];

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (typeof InputmaskGlobal === 'function') {
        if (input.inputmask && typeof input.inputmask.remove === 'function') input.inputmask.remove();
        InputmaskGlobal(opciones).mask(input);
        enmascarados.push(input);
      } else if (jquery && jquery.fn && typeof jquery.fn.inputmask === 'function') {
        jquery(input).inputmask('remove');
        jquery(input).inputmask(opciones);
        enmascarados.push(input);
      }
    }

    return function () {
      enmascarados.forEach(function (input) {
        if (input.inputmask && typeof input.inputmask.remove === 'function') input.inputmask.remove();
        else if (jquery && jquery.fn && typeof jquery.fn.inputmask === 'function') jquery(input).inputmask('remove');
      });
    };
  }, [mascaraTelefono, phones.length]);

  // ---------- alto de la grilla: se mide, no se estima ----------
  function contenedorDesplazable(nodo) {
    let n = nodo.parentElement;
    while (n && n !== document.body) {
      const ov = window.getComputedStyle(n).overflowY;
      if (ov === 'auto' || ov === 'scroll') return n;
      n = n.parentElement;
    }
    return null;
  }
  function medirAlto() {
    const ref = refBusq.current;
    if (!ref) return;
    const el = ref.closest ? (ref.closest('.axx-panel') || ref) : ref;
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) return;
    const cuerpo = el.querySelector('.ant-table-body');
    if (!cuerpo) return;
    const fueraDelCuerpo = rect.height - cuerpo.getBoundingClientRect().height;
    const cont = contenedorDesplazable(el);
    let topRelativo, disponible;
    if (cont) {
      topRelativo = rect.top - cont.getBoundingClientRect().top + cont.scrollTop;
      disponible = cont.clientHeight;
    } else {
      topRelativo = rect.top + (window.pageYOffset || 0);
      disponible = window.innerHeight;
    }
    const h = Math.max(140, Math.floor(disponible - topRelativo - fueraDelCuerpo - 2));
    setAltoGrilla(function (prev) { return Math.abs(prev - h) > 2 ? h : prev; });
  }
  useEffect(function () {
    medirAlto();
    const t1 = setTimeout(medirAlto, 0);
    const t2 = setTimeout(medirAlto, 200);
    window.addEventListener('resize', medirAlto);
    return function () {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', medirAlto);
    };
  });

  // ---------- helpers ----------
  function txt(v) { return v === null || v === undefined ? '' : String(v).trim(); }
  function lit(v) { return txt(v).replace(/'/g, "''"); }
  // En SQL Server '[' abre una clase de caracteres: se neutraliza junto a los comodines.
  function likeLit(v) { return lit(v).replace(/[%_[]/g, function (c) { return '\\' + c; }); }
  function esPersona(c) { return c && (c.isPerson === true || c.isPerson === 1); }
  function nombreDe(c) {
    if (!c) return '';
    if (esPersona(c)) return txt([c.name, c.middleName, c.surname1, c.surname2].filter(function (p) { return txt(p) !== ''; }).join(' '));
    return txt(c.surname2) || txt(c.name) || txt(c.FullName);
  }
  // Identificacion segun el tipo de contacto: cnp para persona, nif para no persona.
  function identificacionDe(c) { return esPersona(c) ? txt(c.cnp) : txt(c.nif); }
  // Principal = el campo del contacto; si esta vacio, el primero de la coleccion.
  function telPrincipalDe(c) {
    const p = txt(c.phone);
    if (p !== '') return p;
    const col = c.Phones || [];
    return col.length ? txt(col[0].num) : '';
  }
  function mailPrincipalDe(c) {
    const e = txt(c.email);
    if (e !== '') return e;
    const col = c.Emails || [];
    for (let i = 0; i < col.length; i++) if (txt(col[i].type) === 'EMAILTYPE1') return txt(col[i].email);
    return col.length ? txt(col[0].email) : '';
  }
  function etiquetaTipo(lista, code) {
    for (let i = 0; i < lista.length; i++) if (lista[i].code === code) return t(lista[i].name);
    return code || '';
  }

  function setCampo(campo, valor) {
    const nuevo = Object.assign({}, criterios);
    nuevo[campo] = valor;
    setCriterios(nuevo);
    if (errorFiltros) setErrorFiltros(null);
  }
  function hayCriterio() {
    return txt(criterios.nombre) !== '' || txt(criterios.identificacion) !== '' ||
           txt(criterios.noCobis) !== '' || txt(criterios.tipo) !== '';
  }

  // ---------- busqueda ----------
  function armarFiltro() {
    const f = [];
    const tipo = txt(criterios.tipo);
    if (tipo === 'P') f.push('isPerson = 1');
    if (tipo === 'J') f.push('isPerson = 0');
    const nom = txt(criterios.nombre);
    if (nom !== '') {
      const p = likeLit(nom);
      const porPersona = "(isPerson = 1 AND LTRIM(RTRIM(CONCAT(name,' ',surname1))) COLLATE Latin1_General_CI_AI LIKE '%" + p + "%' ESCAPE '\\')";
      const porEmpresa = "(isPerson = 0 AND surname2 COLLATE Latin1_General_CI_AI LIKE '%" + p + "%' ESCAPE '\\')";
      if (tipo === 'P') f.push(porPersona);
      else if (tipo === 'J') f.push(porEmpresa);
      else f.push('(' + porPersona + ' OR ' + porEmpresa + ')');
    }
    const ide = txt(criterios.identificacion);
    if (ide !== '') {
      const v = lit(ide);
      const porCnp = "(isPerson = 1 AND cnp = '" + v + "')";
      const porNif = "(isPerson = 0 AND nif = '" + v + "')";
      if (tipo === 'P') f.push(porCnp);
      else if (tipo === 'J') f.push(porNif);
      else f.push('(' + porCnp + ' OR ' + porNif + ')');
    }
    const cobis = txt(criterios.noCobis);
    if (cobis !== '') f.push("nationalId = '" + lit(cobis) + "'");
    return f.join(' AND ');
  }

  function buscar(pag) {
    if (!hayCriterio()) {
      setErrorFiltros(t('Enter at least one search criterion'));
      return;
    }
    const p = pag || 1;
    setErrorFiltros(null);
    setError(null);
    setCargando(true);
    setPestana('busqueda');
    // GetContacts pagina en BASE 0: la pagina 1 de la grilla es la pagina 0 del comando.
    // Con base 1 la primera pagina se saltea los primeros registros y una busqueda de un
    // solo resultado devuelve total 1 y ninguna fila.
    exe('GetContacts', { filter: armarFiltro(), size: PAGINA, page: p - 1, include: ['Phones', 'Emails'] })
      .then(function (r) {
        setCargando(false);
        setBuscado(true);
        setDrawerAbierto(false);
        setPagina(p);
        if (!r || !r.ok) { setError((r && r.msg) || t('Query error')); setContactos([]); setTotal(0); return; }
        setContactos(r.outData || []);
        setTotal(r.total || 0);
      })
      .catch(function (e) {
        setCargando(false); setBuscado(true); setContactos([]); setTotal(0); setError(String(e));
      });
  }

  function limpiarFiltros() {
    setCriterios(CRITERIOS_VACIOS);
    setContactos([]);
    setTotal(0);
    setPagina(1);
    setBuscado(false);
    setError(null);
    setErrorFiltros(null);
    cerrarEdicion();
    setPestana('busqueda');
  }

  // ---------- edicion ----------
  function cerrarEdicion() {
    setSel(null);
    setPhonePpal('');
    setEmailPpal('');
    setPhones([]);
    setEmails([]);
    setResultado(null);
    setErrorEdicion(null);
  }

  function cargarContacto(c) {
    setSel(c);
    setResultado(null);
    setErrorEdicion(null);
    setPhonePpal(telPrincipalDe(c));
    setEmailPpal(mailPrincipalDe(c));
    setPhones((c.Phones || []).map(function (p) { return { id: p.id, num: txt(p.num), type: txt(p.type) }; }));
    setEmails((c.Emails || []).map(function (e) { return { id: e.id, email: txt(e.email), type: txt(e.type) }; }));
    setPestana('informacion');
  }

  function cambiarPhone(idx, campo, valor) {
    const copia = phones.slice();
    copia[idx] = Object.assign({}, copia[idx]);
    copia[idx][campo] = valor;
    setPhones(copia);
  }
  function cambiarEmail(idx, campo, valor) {
    const copia = emails.slice();
    copia[idx] = Object.assign({}, copia[idx]);
    copia[idx][campo] = valor;
    setEmails(copia);
  }
  function agregarPhone() { setPhones(phones.concat([{ id: 0, num: '', type: undefined }])); }
  function agregarEmail() { setEmails(emails.concat([{ id: 0, email: '', type: undefined }])); }
  function quitarPhone(idx) { const c = phones.slice(); c.splice(idx, 1); setPhones(c); }
  function quitarEmail(idx) { const c = emails.slice(); c.splice(idx, 1); setEmails(c); }

  function validarEdicion() {
    const msgs = [];
    const reMail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
    for (let i = 0; i < phones.length; i++) {
      if (txt(phones[i].num) === '') msgs.push(t('There is a phone without a number'));
    }
    for (let j = 0; j < emails.length; j++) {
      const d = txt(emails[j].email);
      if (d === '') msgs.push(t('There is an email without an address'));
      else if (!reMail.test(d)) msgs.push(t('Invalid email address') + ': ' + d);
    }
    if (txt(emailPpal) !== '' && !reMail.test(txt(emailPpal))) {
      msgs.push(t('Invalid primary email address') + ': ' + txt(emailPpal));
    }
    // Sin duplicados, que es lo que la grilla no puede distinguir despues.
    const vistosT = {}, vistosM = {};
    for (let k = 0; k < phones.length; k++) {
      const n = txt(phones[k].num);
      if (n !== '' && vistosT[n]) msgs.push(t('Duplicate phone') + ': ' + n);
      vistosT[n] = true;
    }
    for (let m = 0; m < emails.length; m++) {
      const d2 = txt(emails[m].email).toLowerCase();
      if (d2 !== '' && vistosM[d2]) msgs.push(t('Duplicate email') + ': ' + d2);
      vistosM[d2] = true;
    }
    const unicos = [];
    for (let z = 0; z < msgs.length; z++) if (unicos.indexOf(msgs[z]) === -1) unicos.push(msgs[z]);
    return unicos;
  }

  // Las dos llamadas a la cadena son una sola accion para el usuario: la primera crea la
  // solicitud y la aprueba con el flujo vigente, la segunda la ejecuta.
  function guardar() {
    if (!sel) return;
    const problemas = validarEdicion();
    if (problemas.length) { setErrorEdicion(problemas.join(' · ')); return; }
    setErrorEdicion(null);
    setResultado(null);
    setGuardando(true);
    const contactId = sel.id;
    const row = {
      contactId: contactId,
      phone: txt(phonePpal),
      email: txt(emailPpal),
      phones: phones.map(function (p) { return { id: p.id || 0, num: txt(p.num), type: txt(p.type) }; }),
      emails: emails.map(function (e) { return { id: e.id || 0, email: txt(e.email), type: txt(e.type) }; })
    };
    exe('ExeChain', { chain: CADENA, context: JSON.stringify({ row: row }) })
      .then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.msg) || t('Update error'));
        const o = r.outData || {};
        if (!o.ok) throw new Error(o.msg || t('Update error'));
        if (!o.pendingExecution || !o.changeId) return o;
        return exe('ExeChain', {
          chain: CADENA,
          context: JSON.stringify({ row: { contactId: contactId, executeChangeId: o.changeId } })
        }).then(function (r2) {
          if (!r2 || !r2.ok) throw new Error((r2 && r2.msg) || t('Error executing approved change'));
          const o2 = r2.outData || {};
          if (!o2.ok) throw new Error(o2.msg || t('Error executing approved change'));
          return Object.assign({}, o, o2, { pendingExecution: false });
        });
      })
      .then(function (o) {
        setGuardando(false);
        setResultado(o);
        // Lo que se muestra sale de la RELECTURA que devuelve la cadena, no de lo tecleado.
      if (o.phone !== undefined) setPhonePpal(txt(o.phone));
        if (o.email !== undefined) setEmailPpal(txt(o.email));
        if (o.phones) setPhones(o.phones.map(function (p) { return { id: p.id, num: txt(p.num), type: txt(p.type) }; }));
        if (o.emails) setEmails(o.emails.map(function (e) { return { id: e.id, email: txt(e.email), type: txt(e.type) }; }));
        refrescarFila(o);
        message.success(o.msg || t('Updated'));
      })
      .catch(function (e) {
        setGuardando(false);
        setErrorEdicion(String(e.message || e));
      });
  }

  // La grilla de busqueda tiene que reflejar lo que quedo guardado sin repetir la consulta.
  function refrescarFila(o) {
    if (!sel) return;
    const nuevos = contactos.map(function (c) {
      if (c.id !== sel.id) return c;
      return Object.assign({}, c, {
        phone: o.phone !== undefined ? o.phone : c.phone,
        email: o.email !== undefined ? o.email : c.email,
        Phones: o.phones || c.Phones,
        Emails: o.emails || c.Emails
      });
    });
    setContactos(nuevos);
    for (let i = 0; i < nuevos.length; i++) if (nuevos[i].id === sel.id) setSel(nuevos[i]);
  }

  const css = `
.axx1465 { display:flex; flex-direction:column; min-width:0; overflow:hidden; font-size:13px; }
.axx1465 .axx-topbar { display:flex; align-items:center; padding:4px 0; margin:0 4px 2px 4px;
          background:transparent; border:1px solid #e6ebf2; border-radius:6px; }
.axx1465 .axx-topbar > * { margin-left:4px; }
.axx1465 .axx-topbar .axx-derecha { margin-left:auto; margin-right:4px; }
.axx1465 .axx-status { background:linear-gradient(90deg, #e6f4ff 0%, #4096ff 100%); color:#fff;
          padding:4px 10px; border-radius:4px; margin:0 4px 4px 4px; font-size:13px; }
.axx1465 .axx-status b { color:#fff; }
.axx1465 .axx-tabs { min-width:0; margin:0 4px; }
.axx1465 .axx-tabs .ant-tabs-tabpane-hidden { display:none !important; }
.axx1465 .axx-tabs .ant-tabs-content { min-width:0; }
.axx1465 .axx-tabs .ant-tabs-tabpane-active { min-width:0; }
.axx1465 .axx-tabs .ant-tabs-tab { border:1px solid #cbd1d8 !important; border-radius:6px 6px 0 0 !important;
          margin-right:2px !important; background:#f7f9fb; position:relative; }
.axx1465 .axx-tabs .ant-tabs-tab-active { border-color:#1677ff !important; background:#fff; }
.axx1465 .axx-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color:#1677ff; }
.axx1465 .axx-tabs .ant-tabs-tab-active::after { content:''; position:absolute; left:0; right:0; bottom:-1px;
          height:1px; background:#fff; }
.axx1465 .axx-panel { border:1px solid #cbd1d8; border-top:none; background:#fff; min-width:0; }
.axx1465 .axx-panel .ant-card { border:none; }
.axx1465 .axx-panel .ant-card-body { padding:4px; }
.axx1465 .axx-panel .ant-spin-nested-loading { min-width:0; }
.axx1465 .ant-table-wrapper { border:1px solid #cbd1d8; min-width:0; }
.axx1465 .axx-panel .axx-grilla-busqueda .ant-table-body { min-height:${altoGrilla}px; }
.axx1465 .ant-table-thead > tr > th { background:#bfbfbf !important; color:#262626;
          border-right:1px solid #cbd1d8 !important; border-bottom:1px solid #cbd1d8 !important;
          font-size:12px; line-height:18px; padding:5px 8px !important; }
.axx1465 .ant-table-thead > tr > th:last-child { border-right:none !important; }
.axx1465 .ant-table-thead > tr > th::before { display:none !important; }
.axx1465 .ant-table-tbody > tr > td { border-right:none !important;
          border-bottom:1px solid #cbd1d8 !important; font-size:12px; line-height:18px;
          padding:5px 8px !important; }
.axx1465 .axx-grilla-busqueda .ant-table-tbody > tr { cursor:pointer; }
.axx1465 .ant-table-tbody > tr:hover > td { background:#b7d7ff !important; }
.axx1465 .ant-table-tbody > tr.ant-table-row-selected > td,
.axx1465 .ant-table-tbody > tr.axx-fila-seleccionada > td { background:#86b4ff !important; }
.axx1465 .ant-table-tbody > tr.ant-table-row-selected:hover > td,
.axx1465 .ant-table-tbody > tr.axx-fila-seleccionada:hover > td { background:#86b4ff !important; }
.axx1465 .axx-monto-pos { color:#237804; }
.axx1465 .axx-monto-neg { color:#cf1322; }
.axx1465 .axx-monto-cero { color:#262626; font-weight:normal; }
.axx1465 .axx-btn-sec, .axx-drawer-1465 .axx-btn-sec { border-color:#8f9aa7 !important; }
.axx1465 .ant-btn[disabled], .axx-drawer-1465 .ant-btn[disabled] {
          border-color:#6f7b88 !important; opacity:1 !important; }
.axx1465 .ant-input, .axx1465 .ant-input-number, .axx1465 .ant-picker,
.axx1465 .ant-select:not(.ant-select-customize-input) .ant-select-selector,
.axx1465 textarea.ant-input,
.axx-drawer-1465 .ant-input, .axx-drawer-1465 .ant-picker,
.axx-drawer-1465 .ant-select:not(.ant-select-customize-input) .ant-select-selector {
          border:1px solid #b8c4d1 !important; border-radius:6px !important; }
.axx1465 .ant-input:hover, .axx1465 .ant-picker:hover,
.axx1465 .ant-select:not(.ant-select-customize-input):hover .ant-select-selector,
.axx-drawer-1465 .ant-input:hover, .axx-drawer-1465 .ant-picker:hover,
.axx-drawer-1465 .ant-select:not(.ant-select-customize-input):hover .ant-select-selector {
          border-color:#8da9c2 !important; }
.axx1465 .ant-input:focus, .axx1465 .ant-input-focused, .axx1465 .ant-picker-focused,
.axx1465 .ant-select-focused:not(.ant-select-customize-input) .ant-select-selector,
.axx-drawer-1465 .ant-input:focus, .axx-drawer-1465 .ant-input-focused,
.axx-drawer-1465 .ant-select-focused:not(.ant-select-customize-input) .ant-select-selector {
          border-color:#1677ff !important; box-shadow:0 0 0 2px rgba(22,119,255,0.2) !important; }
.axx1465 .ant-input[disabled], .axx1465 .ant-select-disabled .ant-select-selector,
.axx-drawer-1465 .ant-input[disabled] {
          border-color:#b8c4d1 !important; background:#f5f5f5 !important; cursor:not-allowed !important; }
.axx1465 .axx-ficha { display:flex; flex-wrap:wrap; padding:4px 4px 0 4px; }
.axx1465 .axx-ficha .axx-campo { margin:0 12px 8px 0; min-width:260px; }
.axx1465 .axx-ficha label { display:block; font-size:12px; line-height:18px; color:#595959; }
.axx1465 .axx-seccion { margin:4px 4px 2px 4px; font-size:13px; font-weight:600; color:#262626; }
.axx1465 .axx-acciones { display:flex; align-items:center; padding:4px 0; margin:6px 4px 4px 4px;
          background:transparent; border:1px solid #e6ebf2; border-radius:6px; }
.axx1465 .axx-acciones > * { margin-left:4px; }
.axx-drawer-1465 .ant-drawer-body { font-size:13px; }
.axx-drawer-1465 .ant-form-item { margin-bottom:10px; }
`;

  const gridContactos = (
    <Card size="small" bordered={false}>
      <div ref={refBusq}>
        {buscado && contactos.length === 0 && !cargando
          ? <Empty description={t('No contacts found')} />
          : <Table className="axx-grilla-busqueda" dataSource={contactos} rowKey="id" size="small"
              scroll={{ x: ANCHO_GRILLA, y: altoGrilla }}
              pagination={{ current: pagina, pageSize: PAGINA, total: total, size: 'small',
                            showSizeChanger: false,
                            showTotal: function (tot) { return t('Total') + ': ' + tot; } }}
              onChange={function (pg) { if (pg && pg.current !== pagina) buscar(pg.current); }}
              onRow={function (record) { return { onClick: function () { cargarContacto(record); } }; }}
              rowClassName={function (record) { return sel && sel.id === record.id ? 'axx-fila-seleccionada' : ''; }}>
               <Column title={t('SIS Number')} dataIndex="id" key="id" width={90} />
               <Column title={t('Type')} key="tipo" width={110}
                render={function (v, r) { return <Tag color={esPersona(r) ? 'blue' : 'purple'}>{esPersona(r) ? t('Person') : t('Legal entity')}</Tag>; }} />
               <Column title={t('Name')} key="nombre" width={280} render={function (v, r) { return nombreDe(r); }} />
               <Column title={t('Identification')} key="identificacion" width={160}
                render={function (v, r) { return identificacionDe(r); }} />
               <Column title={t('Cobis number')} dataIndex="nationalId" key="nationalId" width={130} />
               <Column title={t('Primary phone')} key="tel" width={140}
                render={function (v, r) { return telPrincipalDe(r); }} />
               <Column title={t('Primary email')} key="mail" width={240}
                render={function (v, r) { return mailPrincipalDe(r); }} />
            </Table>}
      </div>
    </Card>
  );

  const panelEdicion = (
    <Card size="small" bordered={false}>
      {!sel
        ? <Empty description={t('Select a contact from the Search tab')} />
        : <div>
            <div className="axx-ficha">
              <div className="axx-campo">
                <label>{t('Primary phone')}</label>
                <Input className="axx-phone-mask" value={phonePpal} maxLength={50}
                  onChange={function (e) { setPhonePpal(e.target.value); }}
                  onInput={function (e) { setPhonePpal(e.target.value); }}
                  onBlur={function (e) { setPhonePpal(e.target.value); }} />
              </div>
              <div className="axx-campo">
                <label>{t('Primary email')}</label>
                <Input value={emailPpal} maxLength={200}
                  onChange={function (e) { setEmailPpal(e.target.value); }} />
              </div>
            </div>

            <div className="axx-seccion">{t('Phones')}</div>
            <Table className="axx-grilla-telefonos" rowKey="__i" size="small" pagination={false}
              dataSource={phones.map(function (p, i) { return Object.assign({}, p, { __i: i }); })}>
              <Column title={t('Number')} key="num" width={260}
                render={function (v, r) {
                  return <Input className="axx-phone-mask" value={r.num} maxLength={50}
                    onChange={function (e) { cambiarPhone(r.__i, 'num', e.target.value); }}
                    onInput={function (e) { cambiarPhone(r.__i, 'num', e.target.value); }}
                    onBlur={function (e) { cambiarPhone(r.__i, 'num', e.target.value); }} />;
                }} />
              <Column title={t('Type')} key="type" width={240}
                render={function (v, r) {
                  return <Select style={{ width: '100%' }} value={r.type || undefined} allowClear
                    placeholder={t('Select phone type')}
                    onChange={function (val) { cambiarPhone(r.__i, 'type', val); }}>
                    {tiposTel.map(function (o) { return <Option key={o.code} value={o.code}>{t(o.name)}</Option>; })}
                  </Select>;
                }} />
               <Column title={t('Actions')} key="acc" width={110}
                render={function (v, r) {
                  return <Popconfirm title={t('Confirm phone deletion?')}
                    onConfirm={function () { quitarPhone(r.__i); }}>
                    <Button type="link" icon={<IcoQuitar />}>{t('Delete')}</Button>
                  </Popconfirm>;
                }} />
            </Table>
            <Button type="link" icon={<IcoAgregar />} onClick={agregarPhone} style={{ paddingLeft: 2 }}>
              {t('Add phone')}
            </Button>

            <div className="axx-seccion">{t('Emails')}</div>
            <Table className="axx-grilla-correos" rowKey="__i" size="small" pagination={false}
              dataSource={emails.map(function (e, i) { return Object.assign({}, e, { __i: i }); })}>
              <Column title={t('Email')} key="email" width={260}
                render={function (v, r) {
                  return <Input value={r.email} maxLength={200}
                    onChange={function (e) { cambiarEmail(r.__i, 'email', e.target.value); }} />;
                }} />
              <Column title={t('Type')} key="type" width={240}
                render={function (v, r) {
                  return <Select style={{ width: '100%' }} value={r.type || undefined} allowClear
                    placeholder={t('Select email type')}
                    onChange={function (val) { cambiarEmail(r.__i, 'type', val); }}>
                    {tiposMail.map(function (o) { return <Option key={o.code} value={o.code}>{t(o.name)}</Option>; })}
                  </Select>;
                }} />
              <Column title={t('Actions')} key="acc" width={110}
                render={function (v, r) {
                  return <Popconfirm title={t('Confirm email deletion?')}
                    onConfirm={function () { quitarEmail(r.__i); }}>
                    <Button type="link" icon={<IcoQuitar />}>{t('Delete')}</Button>
                  </Popconfirm>;
                }} />
            </Table>
            <Button type="link" icon={<IcoAgregar />} onClick={agregarEmail} style={{ paddingLeft: 2 }}>
              {t('Add email')}
            </Button>

            <div className="axx-acciones">
              <Button type="primary" icon={<IcoGuardar />} loading={guardando} onClick={guardar}>
                {t('Save and submit for approval')}
              </Button>
              <Button className="axx-btn-sec" icon={<IcoActualizar />} disabled={guardando}
                onClick={function () { cargarContacto(sel); }}>
                {t('Discard changes')}
              </Button>
            </div>

            {errorEdicion
              ? <Alert type="error" showIcon message={errorEdicion} style={{ margin: '0 4px 4px 4px' }} />
              : null}
            {resultado
              ? <Alert type={resultado.executed ? 'success' : 'warning'} showIcon
                  style={{ margin: '0 4px 4px 4px' }}
                  message={resultado.msg}
                  description={
                    <div>
                      {resultado.changeId
              ? <div>{t('Change request')}: {resultado.changeId}
                            {resultado.flujo ? <span>{' '}·{' '}{t('Workflow')}: {resultado.flujo}</span> : null}
                            {resultado.entityState ? <span>{' '}·{' '}{t('Status')}: {resultado.entityState}</span> : null}
                          </div>
                        : null}
                      {resultado.bajas && resultado.bajas.length
                        ? <div>{t('Applied removals')}: {resultado.bajas.map(function (b) { return b.valor; }).join(', ')}</div>
                        : null}
                    </div>}
                />
              : null}
          </div>}
    </Card>
  );

  return (
    <DefaultPage title={t('Contact Information Administration')} icon="contacts">
      <style>{css}</style>
      <div className="axx1465">

        <div className="axx-topbar">
          <Button type="primary" icon={<IcoBuscar />} onClick={function () { setDrawerAbierto(true); }}>
            {t('Filter')}
          </Button>
          <Button className="axx-btn-sec" icon={<IcoActualizar />} disabled={!hayCriterio()}
            loading={cargando} onClick={function () { buscar(pagina); }}>
            {t('Refresh')}
          </Button>
          <span className="axx-derecha">
            <Text type="secondary">{buscado ? t('Records') + ': ' + total : ''}</Text>
          </span>
        </div>

        <div className="axx-status">
          {sel
            ? <span><b>{t('Contact')}:</b> {nombreDe(sel)}{' '}·{' '}
                <b>{t('SIS Number')}:</b> {sel.id}{' '}·{' '}
                <b>{t('Identification')}:</b> {identificacionDe(sel) || '-'}</span>
            : <span>{t('Select a contact from the Search tab to manage phones and emails')}</span>}
        </div>

        {error ? <Alert type="error" showIcon message={error} style={{ margin: '0 4px 4px 4px' }} /> : null}

        <Tabs type="card" className="axx-tabs" activeKey={pestana} onChange={setPestana}>
          <TabPane tab={t('Search')} key="busqueda">
            <div className="axx-panel">
              <Spin spinning={cargando}>{gridContactos}</Spin>
            </div>
          </TabPane>
          <TabPane tab={t('Contact information')} key="informacion" disabled={!sel}>
            <div className="axx-panel">
              <Spin spinning={guardando}>{panelEdicion}</Spin>
            </div>
          </TabPane>
        </Tabs>

        <Drawer className="axx-drawer-1465" title={t('Filters')} width={420} placement="right"
          visible={drawerAbierto} onClose={function () { setDrawerAbierto(false); }}
          footer={
            <Space>
              <Button type="primary" icon={<IcoBuscar />} loading={cargando}
                onClick={function () { buscar(1); }}>{t('Search')}</Button>
              <Button className="axx-btn-sec" onClick={limpiarFiltros}>{t('Clear filters')}</Button>
            </Space>
          }>
          {errorFiltros ? <Alert type="warning" showIcon message={errorFiltros} style={{ marginBottom: 10 }} /> : null}
          <Form layout="vertical">
            <Form.Item label={t('Contact type')}>
              <Select allowClear style={{ width: '100%' }} value={criterios.tipo || undefined}
                placeholder={t('All')}
                onChange={function (v) { setCampo('tipo', v || ''); }}>
                <Option value="P">{t('Person')}</Option>
                <Option value="J">{t('Legal entity')}</Option>
              </Select>
            </Form.Item>
            <Form.Item label={t('Name')}
              help={t('Person: name and first surname. Legal entity: business name.')}>
              <Input value={criterios.nombre} maxLength={100}
                onChange={function (e) { setCampo('nombre', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t('Identification')}>
              <Input value={criterios.identificacion} maxLength={50}
                onChange={function (e) { setCampo('identificacion', e.target.value); }} />
            </Form.Item>
            <Form.Item label={t('Cobis number')}>
              <Input value={criterios.noCobis} maxLength={50}
                onChange={function (e) { setCampo('noCobis', e.target.value); }} />
            </Form.Item>
          </Form>
        </Drawer>

      </div>
    </DefaultPage>
  );
}
