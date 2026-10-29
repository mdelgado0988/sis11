/**
 * @author aiden_mission_configurator (AIDEN Missions)
 * @name InteligenciaNegocio
 * @version 1.1.0
 * @created 2026-10-21
 * @mission MSN-000091 (globaluat) / AXX-5288; MSN-000112 / AXX-5991
 * @purpose Reportes de usuario por area: la lista nativa del Vizualizador (#/reportlist) con las mismas columnas y
 *          acciones (Abrir, Filtros, Editar informacion, Exportar, Restricciones, Eliminar, Importar, Actualizar),
 *          precedida por dos selectores: Area (las areas de los reportes configurados; un reporte sin area cae en
 *          "General") y Reporte (los reportes del area elegida). La grilla no muestra nada hasta que se elige un area.
 *          Solo comandos nativos: GetReports, RepoReport, ExportReport, ImportReport, DeleteReport,
 *          GetReportRestrictions, SetReportRestrictions, GetUsers.
 */
(() => {
  const ICONS = {"reload":{"vb":"64 64 896 896","paths":["M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01655.9 829c-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27A341.5 341.5 0 01279 755.2a342.16 342.16 0 01-73.7-109.4c-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27a341.5 341.5 0 01109.3 73.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z"]},"search":{"vb":"64 64 896 896","paths":["M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"]},"upload":{"vb":"64 64 896 896","paths":["M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 00-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z"]},"lock":{"vb":"64 64 896 896","paths":["M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 10-56 0z"]},"unlock":{"vb":"64 64 896 896","paths":["M832 464H332V240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v68c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-68c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zm-40 376H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 10-56 0z"]},"plus":{"vb":"64 64 896 896","paths":["M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z","M192 474h672q8 0 8 8v60q0 8-8 8H160q-8 0-8-8v-60q0-8 8-8z"]},"left":{"vb":"64 64 896 896","paths":["M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"]},"save":{"vb":"64 64 896 896","paths":["M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z"]},"delete":{"vb":"64 64 896 896","paths":["M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"]},"filter":{"vb":"64 64 896 896","paths":["M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z"]}};
  const GENERAL = 'General';

  function Ic(props) {
    const def = ICONS[props.name];
    return (
      <span role="img" aria-label={props.name} className={'anticon anticon-' + props.name} style={props.style}>
        <svg viewBox={def.vb} focusable="false" data-icon={props.name} width="1em" height="1em" fill="currentColor" aria-hidden="true">
          {def.paths.map((d, i) => <path key={i} d={d} />)}
        </svg>
      </span>
    );
  }

  const ACTION_ICONS = {
    eye: 'M512 160C291.2 160 102.4 304 32 512c70.4 208 259.2 352 480 352s409.6-144 480-352c-70.4-208-259.2-352-480-352zm0 640c-159.2 0-288-128.8-288-288s128.8-288 288-288 288 128.8 288 288-128.8 288-288 288zm0-480c-106 0-192 86-192 192s86 192 192 192 192-86 192-192-86-192-192-192zm0 320c-70.7 0-128-57.3-128-128s57.3-128 128-128 128 57.3 128 128-57.3 128-128 128z',
    edit: 'M880 256l-112-112c-16-16-42-16-58 0L240 614l-32 146c-4 20 14 38 34 34l146-32 470-470c16-16 16-42 0-58zM352 690l-58 12 12-58 404-404 46 46-404 404zm450-450l-46-46 42-42 46 46-42 42z',
    download: 'M512 96c-22 0-40 18-40 40v432L332 428c-16-16-42-16-58 0s-16 42 0 58l208 208c16 16 42 16 58 0l208-208c16-16 16-42 0-58s-42-16-58 0L552 568V136c0-22-18-40-40-40zm352 672H160c-22 0-40 18-40 40v80c0 22 18 40 40 40h704c22 0 40-18 40-40v-80c0-22-18-40-40-40z',
  };

  function ActionIcon(props) {
    return (
      <span role="img" aria-label={props.name} className={'anticon anticon-' + props.name}>
        <svg viewBox="0 0 1024 1024" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
          <path d={ACTION_ICONS[props.name]} />
        </svg>
      </span>
    );
  }

  // Area as the selector shows it: a report with an empty or missing area belongs to "General".
  const areaOf = r => {
    const a = r && r.area != null ? String(r.area).trim() : '';
    return a ? a : GENERAL;
  };
  const canAccessRestrictedReport = report => {
    if (!report || !report.restricted) return true;

    const sessionEmail = String(localStorage.email || '').trim().toLowerCase();
    const allowedUsers = Array.isArray(report.AllowedUsers) ? report.AllowedUsers : [];
    return allowedUsers.some(user => String(user && user.user || '').trim().toLowerCase() === sessionEmail);
  };
  const byText = (a, b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
  const AREA_AVATAR_COLORS = ['#1677ff', '#13a8a8', '#52a41a', '#d46b08', '#722ed1', '#c41d7f', '#2f54eb', '#389e0d'];
  const areaAvatarColor = area => {
    const hash = Array.from(String(area)).reduce((total, character) => total + character.charCodeAt(0), 0);
    return AREA_AVATAR_COLORS[hash % AREA_AVATAR_COLORS.length];
  };

  const decodeReportLayout = base64 => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
    let escaped = '';
    for (let i = 0; i < bytes.length; i++) escaped += '%' + bytes[i].toString(16).padStart(2, '0');
    return decodeURIComponent(escaped);
  };

  const parseReportParameters = base64 => {
    const xml = new DOMParser().parseFromString(decodeReportLayout(base64), 'application/xml');
    if (xml.getElementsByTagName('parsererror').length) throw new Error('El diseño del reporte no contiene XML válido.');

    const root = xml.documentElement;
    let container = null;
    for (let i = 0; root && i < root.childNodes.length; i++) {
      const node = root.childNodes[i];
      if (node.nodeType === 1 && String(node.nodeName).split(':').pop() === 'Parameters') {
        container = node;
        break;
      }
    }
    if (!container) return [];

    const refs = {};
    const all = xml.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      const ref = all[i].getAttribute('Ref');
      if (ref) refs[ref] = all[i];
    }

    const parameters = [];
    const attribute = (node, name) => {
      const value = node.getAttribute(name);
      return value == null ? '' : value;
    };
    const boolAttribute = (node, name, defaultValue) => {
      const value = attribute(node, name);
      return value === '' ? defaultValue : String(value).toLowerCase() === 'true';
    };
    const referencedContent = value => {
      const match = /^#Ref-(\d+)$/.exec(String(value || ''));
      const target = match ? refs[match[1]] : null;
      return target ? attribute(target, 'Content') : value;
    };
    for (let i = 0; i < container.childNodes.length; i++) {
      const node = container.childNodes[i];
      if (node.nodeType !== 1) continue;
      const name = node.getAttribute('Name');
      if (!name) continue;

      let type = 'String';
      const typeRef = node.getAttribute('Type');
      if (typeRef) {
        const match = /^#Ref-(\d+)$/.exec(typeRef);
        const target = match ? refs[match[1]] : null;
        const content = target && target.getAttribute('Content');
        type = content ? content.replace(/^System\./, '') : 'No disponible';
      }
      if (String(node.getAttribute('MultiValue')).toLowerCase() === 'true') type += '[]';
      const lookupNode = Array.from(node.childNodes || []).find(child => child.nodeType === 1
        && String(child.nodeName).split(':').pop() === 'LookUpSettings');
      const lookupReference = /^#Ref-(\d+)$/.exec(attribute(node, 'ValueSourceSettings'));
      const lookup = lookupReference
        ? refs[lookupReference[1]]
        : lookupNode ? Array.from(lookupNode.childNodes || []).find(child => child.nodeType === 1) : null;
      const lookupType = lookup ? attribute(lookup, 'ObjectType') : '';
      const lookupName = lookup ? String(lookupType || lookup.nodeName).split(',')[0].split('.').pop().split(':').pop() : '';
      const lookupValues = lookup && Array.from(lookup.childNodes || []).find(child => child.nodeType === 1
        && String(child.nodeName).split(':').pop() === 'LookUpValues');
      const staticItems = lookup && lookupName === 'StaticListLookUpSettings' && lookupValues
        ? Array.from(lookupValues.childNodes || []).filter(child => child.nodeType === 1).map((item, itemIndex) => ({
          key: name + '-option-' + itemIndex,
          value: referencedContent(attribute(item, 'Value') || attribute(item, 'ValueInfo')),
          label: attribute(item, 'Description') || attribute(item, 'DisplayValue') || attribute(item, 'DisplayValueInfo') || referencedContent(attribute(item, 'Value') || attribute(item, 'ValueInfo'))
        }))
        : [];
      const contact = contactParameterMetadata(name, node.getAttribute('Description') || name, lookup ? attribute(lookup, 'ValueMember') : '');
      const cashDesk = cashDeskParameterMetadata(name, node.getAttribute('Description') || name);
      const isLob = lobParameterMetadata(name, node.getAttribute('Description') || name);
      parameters.push({
        key: name + '-' + i,
        name: name,
        label: node.getAttribute('Description') || name,
        type: type,
        allowNull: boolAttribute(node, 'AllowNull', false),
        requestParameters: boolAttribute(node, 'RequestParameters', true),
        visible: boolAttribute(node, 'Visible', true),
        defaultValue: attribute(node, 'ValueInfo'),
        lookupType: lookupName || null,
        lookupDataSource: lookup ? attribute(lookup, 'DataSource') : '',
        lookupDataMember: lookup ? attribute(lookup, 'DataMember') : '',
        valueMember: lookup ? attribute(lookup, 'ValueMember') : '',
        displayMember: lookup ? attribute(lookup, 'DisplayMember') : '',
        options: staticItems,
        isContact: contact.isContact,
        contactValueField: contact.valueField,
        isCashDesk: cashDesk.isCashDesk,
        cashDeskValueField: cashDesk.valueField,
        isLob: isLob,
      });
    }
    return parameters;
  };

  const parseReportLookupQueries = base64 => {
    const xml = new DOMParser().parseFromString(decodeReportLayout(base64), 'application/xml');
    const queries = {};
    const collectQueries = source => {
      Array.from(source.getElementsByTagName('*')).forEach(query => {
        if (String(query.nodeName).split(':').pop() !== 'Query') return;
        const name = query.getAttribute('Name');
        const sqlNode = Array.from(query.childNodes || []).find(child => child.nodeType === 1
          && String(child.nodeName).split(':').pop() === 'Sql');
        const sql = sqlNode && String(sqlNode.textContent || '').trim();
        if (name && sql) queries[name] = sql;
      });
    };
    // DevExpress persists SqlDataSource instances either directly or in a Base64 property.
    collectQueries(xml);
    Array.from(xml.getElementsByTagName('*')).forEach(node => {
      const encoded = node.getAttribute('Base64');
      if (!encoded) return;
      try {
        const source = new DOMParser().parseFromString(decodeReportLayout(encoded), 'application/xml');
        if (!source.getElementsByTagName('parsererror').length) collectQueries(source);
      } catch (error) {
        // Base64 is also used by non-data-source report elements; those are intentionally ignored.
      }
    });
    return queries;
  };

  const lookupQueryFor = (queries, dataMember) => {
    const name = String(dataMember || '').trim();
    const normalize = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');
    const target = normalize(name);
    const matchedName = Object.keys(queries).find(key => normalize(key) === target);
    return matchedName ? queries[matchedName] : '';
  };

  const dynamicLookupOptions = (rows, row, queryResult) => {
    let data = queryResult && queryResult.outData;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (error) { data = []; }
    }
    // DoQuery commonly returns an array, but some report data sources wrap it in a result collection.
    if (data && !Array.isArray(data) && typeof data === 'object') {
      data = data.data || data.rows || data.items || data.result || [];
    }
    const items = Array.isArray(data) ? data : [];
    const memberValue = (item, member) => {
      if (!item || !member) return undefined;
      if (item[member] !== undefined) return item[member];
      const key = Object.keys(item).find(current => String(current).toLowerCase() === String(member).toLowerCase());
      return key ? item[key] : undefined;
    };
    const firstValue = (item, fields, fallback) => {
      for (let i = 0; i < fields.length; i++) {
        const value = memberValue(item, fields[i]);
        if (value !== undefined && value !== null && value !== '') return value;
      }
      return fallback;
    };
    return items.map((item, index) => {
      const value = firstValue(item, [row.valueMember, 'value', 'code', 'valor'], '');
      const label = firstValue(item, [row.displayMember, 'label', 'name', 'descripcion', 'etiqueta'], String(value));
      return { key: row.name + '-dynamic-' + index, value: String(value), label: String(label) };
    }).filter(item => item.value !== '');
  };

  const contactParameterMetadata = (name, label, valueMember) => {
    const text = String(name || '') + ' ' + String(label || '');
    const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isContact = /(contact|contacto|holder|tomador|asegurad|insured|beneficiari|cliente|cobis|identific|cedula|document|\bcnp\b|\bnif\b)/i.test(normalized);
    if (!isContact) return { isContact: false, valueField: null };

    const fieldName = String(name || '').toLowerCase();
    const lookupField = String(valueMember || '').toLowerCase();
    if (lookupField === 'id' || lookupField === 'contactid') return { isContact: true, valueField: 'id' };
    if (lookupField === 'nationalid' || lookupField === 'cobis') return { isContact: true, valueField: 'nationalId' };
    if (lookupField === 'cnp' || lookupField === 'nif' || lookupField === 'passport' || lookupField === 'identification') return { isContact: true, valueField: 'identification' };
    if (lookupField === 'name' || lookupField === 'fullname') return { isContact: true, valueField: 'name' };
    if (/cobis|nationalid/.test(normalized)) return { isContact: true, valueField: 'nationalId' };
    if (/identific|cedula|document|\bcnp\b|\bnif\b/.test(normalized)) return { isContact: true, valueField: 'identification' };
    if (/(^|[^a-z])id($|[^a-z])|contactid|holderid|insuredid|aseguradoid|beneficiarioid|clienteid/.test(fieldName)) return { isContact: true, valueField: 'id' };
    if (/name|nombre|holder|tomador|asegurad|insured|beneficiari|cliente/.test(normalized)) return { isContact: true, valueField: 'name' };
    return { isContact: true, valueField: 'id' };
  };

  const cashDeskParameterMetadata = (name, label) => {
    const text = (String(name || '') + ' ' + String(label || '')).toLowerCase();
    return /(cashdesk|cash.?desk|cash.?box|caja|workspace)/i.test(text)
      ? { isCashDesk: true, valueField: 'id' }
      : { isCashDesk: false, valueField: null };
  };

  const lobParameterMetadata = (name, label) => {
    const text = (String(name || '') + ' ' + String(label || '')).toLowerCase();
    return /(\bramo\b|\blob\b|linea.?de.?negocio|line.?of.?business)/i.test(text);
  };

  // User picker of the restrictions window (same behaviour as the native one: search and filter by group).
  function UserSelect(props) {
    const [data, setData] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [filterVisible, setFilterVisible] = useState(false);

    useEffect(() => {
      exe('GetUsers', { include: ['Groups'] }).then(r => {
        if (r.ok) {
          const users = r.outData || [];
          const found = [];
          users.forEach(u => (u.Groups || []).forEach(g => { if (!found.find(x => x.usrGroupId == g.usrGroupId)) found.push(g); }));
          setData(users);
          setGroups(found);
        } else A.message.error(r.msg);
      });
    }, []);

    const shown = data.filter(u => (selectedGroups.length ? selectedGroups.some(id => (u.Groups || []).some(g => g.usrGroupId == id)) : true));
    return (
      <div>
        <div style={{ display: 'flex', width: '100%' }}>
          <A.Select
            showSearch
            allowClear
            value={props.value}
            onChange={v => props.onChange && props.onChange(v)}
            style={{ width: '100%', flexGrow: 1 }}
            placeholder={t('Select User')}
            optionFilterProp="label"
            filterOption={(input, option) => String(option.label || '').toLowerCase().indexOf(input.toLowerCase()) >= 0}>
            {shown.map(p => (
              <A.Select.Option key={p.email} value={p.email} label={p.nombre + ' ' + p.email}>
                {p.nombre} <span style={{ color: '#999', fontSize: '11px' }}>{'(' + p.email + ')'}</span>
              </A.Select.Option>
            ))}
          </A.Select>
          <A.Button style={{ flexShrink: 0 }} type="link" icon={<Ic name="filter" />} onClick={() => setFilterVisible(true)} />
        </div>
        <A.Modal title={t('Filter by Group')} visible={filterVisible} onOk={() => setFilterVisible(false)} onCancel={() => setFilterVisible(false)}>
          <A.Select
            showSearch
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder={t('Select Groups')}
            value={selectedGroups}
            onChange={v => setSelectedGroups(v)}
            filterOption={(input, option) => String(option.children).toLowerCase().indexOf(input.toLowerCase()) >= 0}>
            {groups.map(g => (
              <A.Select.Option key={g.usrGroupId} value={g.usrGroupId}>
                {g.name}
              </A.Select.Option>
            ))}
          </A.Select>
        </A.Modal>
      </div>
    );
  }

  // "Report Restrictions" window of the native list: lock on/off and authorized users.
  function ReportRestrictions(props) {
    const [loading, setLoading] = useState(false);
    const [addUserVisible, setAddUserVisible] = useState(false);
    const [users, setUsers] = useState([]);
    const [form] = A.Form.useForm();
    const [userForm] = A.Form.useForm();

    useEffect(() => {
      form.resetFields();
      setUsers([]);
      if (props.reportId) load();
    }, [props.visible]);

    const load = () => {
      exe('GetReportRestrictions', { reportId: props.reportId }).then(r => {
        if (r.ok) {
          form.setFieldsValue({ restricted: r.outData.restricted });
          setUsers(r.outData.users || []);
        } else A.message.error(r.msg);
      });
    };
    const save = formValues => {
      setLoading(true);
      exe('SetReportRestrictions', { reportId: props.reportId, restricted: formValues.restricted, users: users }).then(r => {
        setLoading(false);
        if (r.ok) {
          A.message.success(t('Saved'));
          props.onOk();
        } else A.message.error(r.msg);
      });
    };
    const onOk = () => {
      form.validateFields().then(formValues => {
        A.Modal.confirm({
          title: t('Are you sure?'),
          content: t('This action will limit access to this report to the selected users only. If you are not among the selected users, you will lose your access.'),
          onOk: () => save(formValues),
          okText: t('Yes'),
          cancelText: t('No'),
        });
      });
    };
    const onAddUser = () => {
      userForm.validateFields().then(values => {
        if (users.find(u => u.user === values.user)) {
          A.message.error(t('User already added'));
          return;
        }
        setUsers(users.concat([values]));
        setAddUserVisible(false);
        userForm.resetFields();
      });
    };
    const onRemoveUser = record => setUsers(users.filter(u => u.user !== record.user));
    const isRestricted = A.Form.useWatch('restricted', form);

    return (
      <div>
        <A.Modal visible={props.visible} onCancel={props.onCancel} title={t('Report Restrictions')} onOk={onOk} okText={t('Save')} okButtonProps={{ loading: loading }}>
          <A.Form form={form} layout="vertical">
            <A.Form.Item label={t('Restricted')} name="restricted" valuePropName="checked">
              <A.Switch checkedChildren={<Ic name="lock" />} unCheckedChildren={<Ic name="unlock" />} />
            </A.Form.Item>
          </A.Form>
          {isRestricted && (
            <div>
              {!addUserVisible && (
                <div>
                  <A.Button type="link" style={{ padding: 0 }} icon={<Ic name="plus" />} onClick={() => setAddUserVisible(true)}>
                    {t('Add')}
                  </A.Button>
                  <A.Table dataSource={users} pagination={false} size="small" rowKey="user">
                    <A.Table.Column title={t('Authorized Users')} dataIndex="user" />
                    <A.Table.Column title={t('Actions')} render={(v, r) => <A.Button type="link" icon={<Ic name="delete" />} onClick={() => onRemoveUser(r)} />} />
                  </A.Table>
                </div>
              )}
              {addUserVisible && (
                <div>
                  <A.Button type="link" icon={<Ic name="left" />} onClick={() => setAddUserVisible(false)}>
                    {t('Back')}
                  </A.Button>
                  <A.Button type="link" icon={<Ic name="save" />} onClick={onAddUser}>
                    {t('Save')}
                  </A.Button>
                  <A.Form form={userForm} layout="vertical">
                    <A.Form.Item label={t('User')} name="user" rules={[{ required: true }]}>
                      <UserSelect />
                    </A.Form.Item>
                  </A.Form>
                </div>
              )}
            </div>
          )}
        </A.Modal>
      </div>
    );
  }

  return function InteligenciaNegocio() {
    const [data, setData] = useState([]);
    const [editReport, setEditReport] = useState({});
    const [loading, setLoading] = useState(false);
    const [area, setArea] = useState(undefined);
    const [showRestricted, setShowRestricted] = useState(false);
    const [reportIdRestrictions, setReportIdRestrictions] = useState(null);
    const [parameterModal, setParameterModal] = useState({ visible: false, loading: false, report: null, rows: [], values: {}, contactOptions: {}, contactLoading: {}, cashDeskOptions: {}, cashDeskLoading: {}, lobOptions: [], lobLoading: false, error: '' });
    const parameterRequestRef = React.useRef(0);
    const contactSearchRefs = React.useRef({});
    const cashDeskSearchRefs = React.useRef({});
    const searchInput = React.useRef(null);
    const workspaceRef = React.useRef(null);
    const tableViewportRef = React.useRef(null);
    const [workspaceHeight, setWorkspaceHeight] = useState(480);
    const [tableScrollY, setTableScrollY] = useState(280);

    useEffect(() => getReports(), []);

    useEffect(() => {
      const updateTableHeight = () => {
        const workspace = workspaceRef.current;
        const viewport = tableViewportRef.current;
        if (workspace) {
          setWorkspaceHeight(Math.max(360, Math.floor(window.innerHeight - workspace.getBoundingClientRect().top - 42)));
        }
        if (!viewport) return;

        // Keep the table header and pagination inside the actual workspace boundary.
        const workspaceBottom = workspace ? workspace.getBoundingClientRect().bottom : window.innerHeight;
        setTableScrollY(Math.max(220, Math.floor(workspaceBottom - viewport.getBoundingClientRect().top - 100)));
      };

      updateTableHeight();
      window.addEventListener('resize', updateTableHeight);
      return () => window.removeEventListener('resize', updateTableHeight);
    }, [area, loading, workspaceHeight]);

    const getReports = () => {
      setLoading(true);
      exe('GetReports').then(r => {
        setLoading(false);
        if (r.ok) setData(r.outData || []);
        else A.message.error(r.msg);
      });
    };

    // Restricted reports outside the current user's allow-list stay hidden by default.
    // The toggle is intentionally only a visibility aid; opening still validates access.
    const visibleData = showRestricted ? data : data.filter(canAccessRestrictedReport);

    // The selected area controls the report grid shown alongside the area list.
    const areas = Array.from(new Set(visibleData.map(areaOf))).sort(byText);
    const areaReports = area ? visibleData.filter(r => areaOf(r) === area) : [];
    const rows = areaReports.slice().sort((a, b) => byText(a.name || a.fileName, b.name || b.fileName));

    const reportUrl = (report, values) => {
      const reportName = String(report && report.fileName || '').replace(/\.repx$/i, '').toLowerCase();
      const isCustomerStatementDate = name => reportName === 'estadocuentacliente'
        && ['fechadesde', 'fechahasta', 'fechacorte'].indexOf(String(name || '').toLowerCase()) >= 0;
      const pairs = Object.keys(values || {}).filter(name => values[name] !== undefined && values[name] !== null)
        .map(name => {
          const raw = values[name];
          const value = isCustomerStatementDate(name) && String(raw == null ? '' : raw).trim() === ''
            ? '(none)'
            : raw && typeof raw.format === 'function'
              ? raw.format(isCustomerStatementDate(name) ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm:ss')
              : isCustomerStatementDate(name) && /^\d{4}-\d{2}-\d{2}/.test(String(raw || ''))
                ? String(raw).slice(0, 10)
                : raw;
          return name + '=' + encodeURIComponent(Array.isArray(value) ? value.join(',') : value);
        });
      return '#/reportview/' + report.fileName + (pairs.length ? '/' + pairs.join('&') : '');
    };
    const openReportWithValues = (report, values) => {
      if (!canAccessRestrictedReport(report)) {
        A.message.error(t('This report is restricted and only authorized users can access it'));
        return;
      }
      const url = reportUrl(report, values);
      console.debug('[InteligenciaNegocio] parámetros del reporte', { report: report.fileName, values: values, url: url });
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    const openReport = r => {
      if (!canAccessRestrictedReport(r)) {
        A.message.error(t('This report is restricted and only authorized users can access it'));
        return;
      }
      openReportWithValues(r, {});
    };

    const updateReport = () => {
      if (!editReport.name) {
        A.message.error(t('Please enter a name'));
        return;
      }
      setLoading(true);
      exe('RepoReport', { operation: editReport.id ? 'UPDATE' : 'ADD', entity: editReport }).then(r => {
        setLoading(false);
        if (r.ok) {
          A.message.success(r.msg);
          setEditReport({});
          getReports();
        } else A.message.error(r.msg);
      });
    };

    // search by column
    const handleSearch = (selectedKeys, confirm) => confirm();
    const handleReset = clearFilters => clearFilters();
    const getColumnSearchProps = dataIndex => ({
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <A.Input
            ref={node => {
              searchInput.current = node;
            }}
            placeholder={t('Search') + ' ' + dataIndex}
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm)}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <A.Button type="primary" onClick={() => handleSearch(selectedKeys, confirm)} icon={<Ic name="search" />} size="small" style={{ width: 90, marginRight: 8 }}>
            {t('Search')}
          </A.Button>
          <A.Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            {t('Reset')}
          </A.Button>
        </div>
      ),
      filterIcon: filtered => <Ic name="search" style={{ color: filtered ? '#1890ff' : undefined, fontSize: 15 }} />,
      onFilter: (value, record) => record[dataIndex] && record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
      onFilterDropdownOpenChange: open => {
        if (open) setTimeout(() => searchInput.current && searchInput.current.select());
      },
    });

    const onExport = r => {
      setLoading(true);
      exe('ExportReport', { reportName: r.fileName }).then(res => {
        setLoading(false);
        if (res.ok) {
          // outData.pdf is the layout serialized as base64: decoded it is the .repx the designer opens
          const binary = atob(res.outData.pdf);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
          a.download = r.fileName + '.repx';
          a.click();
        } else A.message.error(res.msg);
      });
    };

    const closeReportParameters = () => {
      parameterRequestRef.current += 1;
      setParameterModal(current => Object.assign({}, current, { visible: false }));
    };

    const initialParameterValues = rows => rows.reduce((result, row) => {
      if (row.defaultValue !== '' && !(row.isLob && String(row.defaultValue).trim() === '0')) result[row.name] = row.defaultValue;
      return result;
    }, {});

    const showReportParameters = r => {
      const request = ++parameterRequestRef.current;
      setParameterModal({ visible: true, loading: true, report: r, rows: [], values: {}, contactOptions: {}, contactLoading: {}, cashDeskOptions: {}, cashDeskLoading: {}, lobOptions: [], lobLoading: false, error: '' });
      exe('ExportReport', { reportName: r.fileName }).then(res => {
        if (request !== parameterRequestRef.current) return;
        if (!res.ok) {
          setParameterModal({ visible: true, loading: false, report: r, rows: [], values: {}, contactOptions: {}, contactLoading: {}, cashDeskOptions: {}, cashDeskLoading: {}, lobOptions: [], lobLoading: false, error: res.msg || 'No se pudo leer el diseño del reporte.' });
          return;
        }
        try {
          const reportLayout = res.outData && res.outData.pdf;
          const rows = parseReportParameters(reportLayout);
          const values = initialParameterValues(rows);
          setParameterModal({ visible: true, loading: false, report: r, rows: rows, values: values, contactOptions: {}, contactLoading: {}, cashDeskOptions: {}, cashDeskLoading: {}, lobOptions: [], lobLoading: false, error: '' });
          if (rows.some(row => row.isLob)) {
            setParameterModal(current => Object.assign({}, current, { lobLoading: true }));
            const lookupQueries = parseReportLookupQueries(reportLayout);
            const lobRow = rows.find(row => row.isLob);
            // Some report versions omit DataMember even though the query name follows the parameter name.
            const reportQuery = lobRow && lookupQueryFor(lookupQueries, lobRow.lookupDataMember || lobRow.name);
            const numericLobWithoutDataSource = rows.find(row => row.isLob
              && !row.lookupDataSource
              && !row.lookupDataMember
              && /Int|Decimal|Double|Single|Float|Numeric|Long|Short|Byte/.test(row.type || ''));
            // Keep this visible in the browser console while onboarding report layouts from DevExpress.
            console.log('[InteligenciaNegocio] resolución catálogo de ramo', {
              parameter: lobRow && lobRow.name,
              dataSource: lobRow && lobRow.lookupDataSource,
              dataMember: lobRow && lobRow.lookupDataMember,
              valueMember: lobRow && lobRow.valueMember,
              displayMember: lobRow && lobRow.displayMember,
              availableQueries: Object.keys(lookupQueries),
              queryFound: Boolean(reportQuery),
              usesRepoLobFallback: Boolean(numericLobWithoutDataSource),
            });
            const lookupRequest = reportQuery
              ? exe('DoQuery', { sql: reportQuery })
              : numericLobWithoutDataSource
                ? exe('RepoLob', { operation: 'GET' })
                : Promise.resolve({ ok: true, outData: [] });
            lookupRequest.then(result => {
              const options = lobRow && reportQuery
                ? dynamicLookupOptions(rows, lobRow, result)
                : numericLobWithoutDataSource && result && result.ok !== false
                  ? (result.outData || []).map(item => ({ value: String(item.code), label: item.name || String(item.code) }))
                  : [];
              if (lobRow) {
                console.debug('[InteligenciaNegocio] catálogo de ramo', {
                  parameter: lobRow.name,
                  dataSource: lobRow.lookupDataSource,
                  dataMember: lobRow.lookupDataMember,
                  queryFound: Boolean(reportQuery),
                  availableQueries: Object.keys(lookupQueries),
                  response: result && result.outData,
                  optionCount: options.length,
                });
              }
              setParameterModal(current => Object.assign({}, current, { lobOptions: options, lobLoading: false }));
            }).catch(error => {
              console.error('[InteligenciaNegocio] no se pudo cargar el catálogo de ramo', {
                parameter: lobRow && lobRow.name,
                dataMember: lobRow && lobRow.lookupDataMember,
                queryFound: Boolean(reportQuery),
                error: error && (error.message || error),
              });
              setParameterModal(current => Object.assign({}, current, { lobLoading: false }));
            });
          }
        } catch (error) {
          setParameterModal({ visible: true, loading: false, report: r, rows: [], values: {}, contactOptions: {}, contactLoading: {}, cashDeskOptions: {}, cashDeskLoading: {}, lobOptions: [], lobLoading: false, error: error.message || 'No se pudieron leer los parámetros.' });
        }
      }).catch(error => {
        if (request !== parameterRequestRef.current) return;
        setParameterModal({ visible: true, loading: false, report: r, rows: [], values: {}, contactOptions: {}, contactLoading: {}, cashDeskOptions: {}, cashDeskLoading: {}, lobOptions: [], lobLoading: false, error: error.message || 'No se pudo consultar el reporte.' });
      });
    };

    const updateParameterValue = (name, value) => {
      setParameterModal(current => Object.assign({}, current, { values: Object.assign({}, current.values, { [name]: value }) }));
    };
    const datePickerValue = value => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof moment !== 'undefined') return moment(value);
      return value;
    };
    const updateDateParameterValue = (row, value) => {
      if (!value) {
        updateParameterValue(row.name, undefined);
        return;
      }
      const format = row.type.indexOf('DateTime') >= 0 ? 'YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DD';
      updateParameterValue(row.name, typeof value.format === 'function' ? value.format(format) : value);
    };

    const contactName = contact => contact && (contact.FullName || contact.fullName || contact.name || [contact.firstName, contact.middleName, contact.surname1, contact.surname2].filter(Boolean).join(' ')) || '';
    const contactIdentification = contact => contact && (contact.cnp || contact.nif || contact.passport || contact.identification || '') || '';
    const contactValue = (contact, field) => {
      if (!contact) return '';
      if (field === 'id') return contact.id;
      if (field === 'nationalId') return contact.nationalId;
      if (field === 'identification') return contactIdentification(contact);
      return contactName(contact);
    };
    const contactLabel = contact => {
      const id = contact && contact.id != null ? 'ID ' + contact.id : '';
      const identification = contactIdentification(contact);
      const cobis = contact && contact.nationalId != null ? 'COBIS ' + contact.nationalId : '';
      return [contactName(contact), id, identification, cobis].filter(Boolean).join(' | ');
    };
    const contactFilter = text => {
      const value = String(text || '').trim().replace(/'/g, "''");
      if (!value) return '';
      const nameExpression = "RTRIM(ISNULL([name],''))+' '+RTRIM(ISNULL(middleName,''))+' '+RTRIM(ISNULL(surname1,''))+' '+RTRIM(ISNULL(surname2,''))";
      const like = "LIKE N'%" + value + "%'";
      return "(" + nameExpression + " " + like + " OR ISNULL(cnp,'') " + like + " OR ISNULL(nif,'') " + like + " OR ISNULL(nationalId,'') " + like + (/^\d+$/.test(value) ? " OR id = " + value : '') + ")";
    };
    const searchContactParameter = (row, text) => {
      const key = row.name;
      const query = String(text || '').trim();
      if (query.length < 2 && !/^\d+$/.test(query)) {
        setParameterModal(current => Object.assign({}, current, { contactOptions: Object.assign({}, current.contactOptions, { [key]: [] }) }));
        return;
      }
      const request = (contactSearchRefs.current[key] || 0) + 1;
      contactSearchRefs.current[key] = request;
      setParameterModal(current => Object.assign({}, current, { contactLoading: Object.assign({}, current.contactLoading, { [key]: true }) }));
      exe('GetContacts', { operation: 'GET', filter: contactFilter(query), size: 15 }).then(result => {
        if (contactSearchRefs.current[key] !== request) return;
        const contacts = result && result.ok !== false ? (result.outData || []) : [];
        const options = contacts.map(contact => ({ value: contactValue(contact, row.contactValueField), label: contactLabel(contact), contact: contact }));
        setParameterModal(current => Object.assign({}, current, {
          contactOptions: Object.assign({}, current.contactOptions, { [key]: options }),
          contactLoading: Object.assign({}, current.contactLoading, { [key]: false }),
        }));
      }).catch(() => {
        if (contactSearchRefs.current[key] !== request) return;
        setParameterModal(current => Object.assign({}, current, { contactLoading: Object.assign({}, current.contactLoading, { [key]: false }) }));
      });
    };
    const cashDeskLabel = desk => {
      const branch = desk && (desk.Branch || desk.branch);
      const branchText = branch && (branch.name || branch.code || branch.id) || desk && (desk.branchCode || desk.branch) || '-';
      const cashier = desk && (desk.user || desk.cashier || desk.cashierEmail || desk.email || desk.User && (desk.User.name || desk.User.email));
      const code = desk && desk.code && String(desk.code) !== String(desk.id) ? 'Código: ' + desk.code : '';
      return ['Caja ' + (desk && desk.id != null ? desk.id : ''), code, 'Sucursal: ' + branchText, 'Cajero: ' + (cashier || '-')].filter(Boolean).join(' | ');
    };
    const cashDeskFilter = text => {
      const value = String(text || '').trim().replace(/'/g, "''");
      if (!value) return '';
      const like = "LIKE N'%" + value + "%'";
      return '(id = ' + (/^\d+$/.test(value) ? value : '0') + " OR branchCode " + like + " OR [user] " + like + ')';
    };
    const searchCashDeskParameter = (row, text) => {
      const key = row.name;
      const query = String(text || '').trim();
      if (query.length < 2) {
        setParameterModal(current => Object.assign({}, current, { cashDeskOptions: Object.assign({}, current.cashDeskOptions, { [key]: [] }) }));
        return;
      }
      const request = (cashDeskSearchRefs.current[key] || 0) + 1;
      cashDeskSearchRefs.current[key] = request;
      setParameterModal(current => Object.assign({}, current, { cashDeskLoading: Object.assign({}, current.cashDeskLoading, { [key]: true }) }));
      exe('RepoTransferWorkspace', { operation: 'GET', include: ['Branch'], filter: cashDeskFilter(query), size: 15, page: 0 }).then(result => {
        if (cashDeskSearchRefs.current[key] !== request) return;
        const desks = result && result.ok !== false ? (result.outData || []) : [];
        const options = desks.map(desk => ({ value: desk.id, label: cashDeskLabel(desk) }));
        setParameterModal(current => Object.assign({}, current, {
          cashDeskOptions: Object.assign({}, current.cashDeskOptions, { [key]: options }),
          cashDeskLoading: Object.assign({}, current.cashDeskLoading, { [key]: false }),
        }));
      }).catch(() => {
        if (cashDeskSearchRefs.current[key] !== request) return;
        setParameterModal(current => Object.assign({}, current, { cashDeskLoading: Object.assign({}, current.cashDeskLoading, { [key]: false }) }));
      });
    };

    const saveAndOpenReport = () => {
      const report = parameterModal.report;
      if (!report) return;
      const isNumericParameter = row => /Int|Decimal|Double|Single|Float|Numeric|Long|Short|Byte/.test(row.type || '');
      const normalizeParameterValue = (row, value) => {
        if (!row.isLob || value === undefined || value === null || value === '') return value;
        return String(value).split(' - ')[0].trim();
      };
      const values = Object.assign({}, parameterModal.values);
      parameterModal.rows.forEach(row => {
        if (row.requestParameters === false || values[row.name] !== undefined && values[row.name] !== null && values[row.name] !== '') return;
        if (row.allowNull) values[row.name] = '';
        else if (isNumericParameter(row) && !row.isLob) values[row.name] = 0;
        else if (row.defaultValue !== '' && !(row.isLob && String(row.defaultValue).trim() === '0')) values[row.name] = row.defaultValue;
      });
      parameterModal.rows.forEach(row => {
        if (Object.prototype.hasOwnProperty.call(values, row.name)) values[row.name] = normalizeParameterValue(row, values[row.name]);
      });
      const isEmptyParameterValue = (row, value) => row.isLob && String(value).trim() === '0' || value === undefined || value === null || value === '' && !row.allowNull;
      const missing = parameterModal.rows.filter(row => row.visible !== false && row.requestParameters !== false
        && !row.allowNull && (row.defaultValue === '' || row.isLob && String(row.defaultValue).trim() === '0')
        && isEmptyParameterValue(row, values[row.name]));
      if (missing.length) {
        A.message.error('Completa los parámetros obligatorios: ' + missing.map(row => row.label).join(', '));
        return;
      }
      const reportName = String(report.fileName || '').replace(/\.repx$/i, '').toLowerCase();
      if (reportName === 'estadocuentacliente') {
        const valueFor = name => {
          const row = parameterModal.rows.find(item => String(item.name || '').toLowerCase() === name.toLowerCase());
          return row ? values[row.name] : undefined;
        };
        const hasValue = value => value !== undefined && value !== null && String(value).trim() !== '';
        const from = valueFor('FechaDesde');
        const to = valueFor('FechaHasta');
        const cutoff = valueFor('FechaCorte');
        if (hasValue(from) !== hasValue(to)) {
          A.message.error('Para Estado de cuenta de un cliente, completa Fecha Desde y Fecha Hasta o indica Fecha Corte.');
          return;
        }
        if (!hasValue(cutoff) && !hasValue(from)) {
          A.message.error('Para Estado de cuenta de un cliente, indica un rango de fechas o una Fecha Corte.');
          return;
        }
      }
      openReportWithValues(report, values);
    };

    const renderParameterInput = row => {
      const value = parameterModal.values[row.name];
      const common = { style: { width: '100%' }, value: value, onChange: next => updateParameterValue(row.name, next) };
      if (row.isLob) {
        return <A.Select
          {...common}
          allowClear
          showSearch
          loading={parameterModal.lobLoading}
          optionFilterProp="label"
          optionLabelProp="label"
          placeholder="Seleccione un ramo">
          {parameterModal.lobOptions.map(option => <A.Select.Option key={String(option.value)} value={option.value} label={option.label}>{option.label}</A.Select.Option>)}
        </A.Select>;
      }
      if (row.isCashDesk) {
        const options = parameterModal.cashDeskOptions[row.name] || [];
        return <A.Select
          {...common}
          showSearch
          allowClear
          filterOption={false}
          optionFilterProp="label"
          optionLabelProp="label"
          loading={!!parameterModal.cashDeskLoading[row.name]}
          onSearch={text => searchCashDeskParameter(row, text)}
          notFoundContent="Escribe al menos 2 caracteres">
          {options.map(option => <A.Select.Option key={String(option.value)} value={option.value} label={option.label}>{option.label}</A.Select.Option>)}
        </A.Select>;
      }
      if (row.isContact) {
        const options = parameterModal.contactOptions[row.name] || [];
        return <A.Select
          {...common}
          showSearch
          allowClear
          filterOption={false}
          optionFilterProp="label"
          optionLabelProp="label"
          loading={!!parameterModal.contactLoading[row.name]}
          onSearch={text => searchContactParameter(row, text)}
          notFoundContent="Escribe al menos 2 caracteres o un ID">
          {options.map(option => <A.Select.Option key={String(option.value)} value={option.value} label={option.label}>{option.label}</A.Select.Option>)}
        </A.Select>;
      }
      if (row.options && row.options.length) {
        return <A.Select {...common} mode={row.type.indexOf('[]') >= 0 ? 'multiple' : undefined} allowClear showSearch optionFilterProp="children">
          {row.options.map(option => <A.Select.Option key={option.key} value={option.value}>{option.label}</A.Select.Option>)}
        </A.Select>;
      }
      if (row.type.indexOf('DateTime') >= 0 || row.type === 'Date') {
        return <A.DatePicker
          style={{ width: '100%' }}
          value={datePickerValue(value)}
          onChange={next => updateDateParameterValue(row, next)}
        />;
      }
      if (row.type.indexOf('Int') >= 0 || row.type.indexOf('Decimal') >= 0 || row.type.indexOf('Double') >= 0) return <A.InputNumber {...common} />;
      // Ant Input emits a DOM event, unlike Select and InputNumber which emit the selected scalar value.
      return <A.Input style={{ width: '100%' }} value={value == null ? '' : value} onChange={event => updateParameterValue(row.name, event.target.value)} />;
    };
    const parameterHint = row => row.isCashDesk
      ? 'Caja: busca por código, sucursal o cajero. Se enviará el ID de la caja.'
      : row.isContact
      ? 'Contacto: busca por nombre, identificación, COBIS o ID. Se enviará ' + (row.contactValueField === 'id' ? 'el ID' : row.contactValueField === 'nationalId' ? 'el número COBIS' : row.contactValueField === 'identification' ? 'la identificación' : 'el nombre')
      : row.lookupType === 'DynamicListLookUpSettings'
      ? 'Lista dinámica: ' + [row.lookupDataSource, row.lookupDataMember].filter(Boolean).join('.')
      : (row.allowNull ? 'Opcional' : 'Obligatorio');

    const onImport = file => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          // ImportReport takes base64: a plain-XML .repx is encoded, a legacy base64 export goes as it is
          const bytes = new Uint8Array(e.target.result);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          const myData = /^(\xEF\xBB\xBF)?\s*</.test(binary) ? btoa(binary) : binary;
          exe('ImportReport', { reportName: file.name, file: myData }).then(r => {
            if (r.ok) {
              A.message.success(r.msg);
              getReports();
            } else A.message.error(r.msg);
          });
        } catch (error) {
          A.message.error(t('Invalid file'));
        }
      };
      reader.readAsArrayBuffer(file);
      return false;
    };

    const onDelete = r => {
      setLoading(true);
      exe('DeleteReport', { reportName: r.fileName }).then(res => {
        setLoading(false);
        if (res.ok) {
          A.message.success(res.msg);
          getReports();
        } else A.message.error(res.msg);
      });
    };

    const showReportRestrictions = r => {
      if (r.id) setReportIdRestrictions(r.id);
      else A.message.error(t('Please define a report name first'));
    };
    const onReportRestrictionsChanged = () => {
      setReportIdRestrictions(null);
      getReports();
    };

    return (
      <div className="business-intelligence-page">
        <style>{`
          body:has(.business-intelligence-page) .ant-page-header,
          body:has(.business-intelligence-page) .page-header {
            background: #edf5ff !important;
            border: 1px solid #8da9c2 !important;
            border-radius: 6px !important;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 1px 3px rgba(31,45,61,.14);
          }
          body:has(.business-intelligence-page) .ant-page-header-heading {
            padding-bottom: 8px;
            border-bottom: 1px solid #b8cbe0;
          }
          .bi-report-grid .ant-table-container {
            border: 1px solid #cbd1d8;
            border-radius: 0;
          }
          .bi-report-grid .ant-table-thead > tr > th {
            background: #bfbfbf;
            border-bottom: 1px solid #cbd1d8;
            border-right: 1px solid #cbd1d8;
            padding: 5px 8px;
            color: #262626;
            font-size: 13px;
            line-height: 20px;
          }
          .bi-report-grid .ant-table-thead > tr > th:last-child {
            border-right: 0;
          }
          .bi-report-grid .ant-table-tbody > tr > td {
            border-bottom: 1px solid #cbd1d8;
            border-right: 0;
            padding: 5px 8px;
            font-size: 13px;
            line-height: 20px;
          }
          .bi-report-grid .ant-table-tbody > tr:hover > td {
            background: #b7d7ff !important;
          }
          .bi-report-grid .ant-table-body {
            overflow-x: scroll !important;
            overflow-y: scroll !important;
            scrollbar-gutter: stable;
            min-height: var(--bi-grid-body-height);
            box-sizing: border-box;
          }
          .bi-parameter-modal .ant-form-item {
            margin-bottom: 10px;
          }
          .bi-parameter-modal .bi-parameter-item {
            display: flex !important;
            align-items: flex-start;
            width: 100% !important;
          }
          .bi-parameter-modal .ant-form {
            display: block !important;
            width: 100% !important;
          }
          .bi-parameter-modal .bi-parameter-form {
            width: 100%;
          }
          .bi-parameter-modal .bi-parameter-row {
            display: flex;
            align-items: flex-start;
            width: 100%;
            margin-bottom: 10px;
          }
          .bi-parameter-modal .bi-parameter-label {
            flex: 0 0 260px;
            width: 260px;
            padding: 5px 12px 0 0;
            color: #262626;
            line-height: 20px;
          }
          .bi-parameter-modal .bi-parameter-required {
            margin-right: 4px;
            color: #ff4d4f;
          }
          .bi-parameter-modal .bi-parameter-control {
            flex: 1 1 0;
            min-width: 0;
          }
          .bi-parameter-modal .bi-parameter-control .ant-input,
          .bi-parameter-modal .bi-parameter-control .ant-input-number,
          .bi-parameter-modal .bi-parameter-control .ant-picker,
          .bi-parameter-modal .bi-parameter-control .ant-select {
            width: 100% !important;
          }
          .bi-parameter-modal .bi-parameter-hint {
            margin-top: 3px;
            color: #8c8c8c;
            line-height: 20px;
          }
          .bi-parameter-modal .bi-parameter-item > .ant-form-item-label {
            flex: 0 0 190px !important;
            width: 190px !important;
            max-width: 190px !important;
            padding: 0 12px 0 0;
            text-align: left;
          }
          .bi-parameter-modal .ant-form-item-label > label {
            color: #262626;
            display: block;
            height: auto;
            line-height: 20px;
            white-space: normal;
            overflow-wrap: anywhere;
          }
          .bi-parameter-modal .bi-parameter-item > .ant-form-item-control-wrapper,
          .bi-parameter-modal .bi-parameter-item > .ant-form-item-control {
            flex: 1 1 0 !important;
            width: 0 !important;
            max-width: none !important;
            min-width: 0;
          }
          .bi-parameter-modal .bi-parameter-item .ant-form-item-control,
          .bi-parameter-modal .bi-parameter-item .ant-form-item-control-input,
          .bi-parameter-modal .bi-parameter-item .ant-form-item-control-input-content,
          .bi-parameter-modal .bi-parameter-item .ant-select,
          .bi-parameter-modal .bi-parameter-item .ant-picker,
          .bi-parameter-modal .bi-parameter-item .ant-input-number {
            width: 100% !important;
          }
          .bi-parameter-modal .ant-form-item-control-input,
          .bi-parameter-modal .ant-form-item-control-input-content {
            width: 100%;
          }
          .bi-parameter-modal .ant-input,
          .bi-parameter-modal .ant-input-number,
          .bi-parameter-modal .ant-picker,
          .bi-parameter-modal .ant-select-selector {
            border: 1px solid #b8c4d1 !important;
            border-radius: 4px !important;
            box-shadow: none !important;
          }
          .bi-parameter-modal .ant-input:hover,
          .bi-parameter-modal .ant-input-number:hover,
          .bi-parameter-modal .ant-picker:hover,
          .bi-parameter-modal .ant-select:not(.ant-select-disabled):hover .ant-select-selector {
            border-color: #7f9fc8 !important;
          }
          .bi-parameter-modal .ant-input:focus,
          .bi-parameter-modal .ant-input-number-focused,
          .bi-parameter-modal .ant-picker-focused,
          .bi-parameter-modal .ant-select-focused .ant-select-selector {
            border-color: #1677ff !important;
            box-shadow: 0 0 0 2px rgba(22,119,255,.12) !important;
          }
          @media (max-width: 620px) {
            .bi-parameter-modal .bi-parameter-row {
              display: block;
            }
            .bi-parameter-modal .bi-parameter-label {
              width: auto;
              padding: 0 0 4px;
            }
            .bi-parameter-modal .bi-parameter-item {
              display: block !important;
            }
            .bi-parameter-modal .bi-parameter-item > .ant-form-item-label {
              flex: none !important;
              width: auto !important;
              max-width: none !important;
              padding: 0 0 4px;
            }
            .bi-parameter-modal .bi-parameter-item > .ant-form-item-control-wrapper,
            .bi-parameter-modal .bi-parameter-item > .ant-form-item-control {
              width: 100% !important;
              max-width: 100% !important;
            }
          }
        `}</style>
        <DefaultPage
          title={t('User Reports')}
          icon="profile"
          extra={
            <div>
              <A.Upload showUploadList={false} beforeUpload={f => onImport(f)}>
                <A.Button icon={<Ic name="upload" />}>{t('Import')}</A.Button>
              </A.Upload>
            </div>
          }>
          <div ref={workspaceRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%', maxWidth: '100%', height: workspaceHeight, minHeight: 360, alignItems: 'stretch', overflow: 'hidden' }}>
            <section style={{ flex: '0 1 280px', minWidth: 240, minHeight: 0 }}>
              <A.List
                bordered
                header={<div style={{ margin: -12, padding: '12px 16px', borderBottom: '1px solid #7f9fc8', background: '#f4f8fc' }}><strong>{t('Area')}</strong></div>}
                loading={loading && !data.length}
                dataSource={areas}
                locale={{ emptyText: t('No hay áreas configuradas') }}
                style={{
                  height: '100%',
                  border: '2px solid #7f9fc8',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
                renderItem={item => {
                  const selected = item === area;
                  const count = visibleData.filter(r => areaOf(r) === item).length;
                  return (
                    <A.List.Item
                      onClick={() => setArea(item)}
                      style={{
                        cursor: 'pointer',
                        background: selected ? '#e6f4ff' : undefined,
                        borderBottom: '1px solid #b7c9df',
                        borderLeft: selected ? '3px solid #1890ff' : '3px solid transparent',
                        paddingLeft: selected ? 13 : 16,
                      }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <A.Avatar size={24} style={{ flexShrink: 0, backgroundColor: selected ? '#1890ff' : areaAvatarColor(item), fontSize: 13 }}>
                          {item.charAt(0).toUpperCase()}
                        </A.Avatar>
                        <span style={{ color: selected ? '#0050b3' : undefined, fontWeight: selected ? 600 : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                      </span>
                      <A.Badge count={count} overflowCount={999} style={{ backgroundColor: selected ? '#1890ff' : '#8c8c8c' }} />
                    </A.List.Item>
                  );
                }}
              />
            </section>
            <section style={{ display: 'flex', flex: '1 1 640px', flexDirection: 'column', minWidth: 0, minHeight: 0, maxWidth: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, padding: '4px 0', background: '#e6f4ff', border: '1px solid #cbd1d8', borderRadius: 0 }}>
                <strong style={{ marginLeft: 4 }}>{area || t('Reports')}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
                  <A.Tooltip title={t('Reload')}>
                    <A.Button type="link" icon={<Ic name="reload" />} onClick={() => getReports()}>
                      {t('Reload')}
                    </A.Button>
                  </A.Tooltip>
                  <span>Visualizar Restringidos</span>
                  <A.Switch checked={showRestricted} onChange={setShowRestricted} />
                </div>
              </div>
              <div ref={tableViewportRef} style={{ flex: '1 1 auto', width: '100%', maxWidth: '100%', minHeight: 0, overflow: 'hidden' }}>
                <A.Table
                  className="bi-report-grid"
                  dataSource={rows}
                  loading={loading}
                  rowKey="fileName"
                  tableLayout="fixed"
                  scroll={{ x: 970, y: tableScrollY }}
                  pagination={{ pageSize: 15, showSizeChanger: false }}
                  style={{ '--bi-grid-body-height': tableScrollY + 'px' }}
                  locale={area ? undefined : { emptyText: t('Seleccione un \u00e1rea para ver sus reportes') }}>
            <A.Table.Column
              title={t('File Name')}
              dataIndex="fileName"
              width={240}
              render={(v, r) => (
                <span>
                  <A.Typography.Text code>{v}</A.Typography.Text>
                  {r.restricted && <Ic name="lock" />}
                </span>
              )}
              {...getColumnSearchProps('fileName')}
            />
            <A.Table.Column title={t('Name')} dataIndex="name" width={270} {...getColumnSearchProps('name')} />
            <A.Table.Column
              title={t('Description')}
              dataIndex="description"
              width={220}
              render={value => {
                const description = value || '';
                return (
                  <A.Tooltip title={description} placement="topLeft">
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {description || '-'}
                    </span>
                  </A.Tooltip>
                );
              }}
            />
            <A.Table.Column
              title={t('Action')}
              width={205}
              align="center"
              render={(v, r) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                  <A.Tooltip title={t('Open')}>
                    <A.Button type="link" size="small" icon={<ActionIcon name="eye" />} onClick={() => openReport(r)}>
                      {t('Open')}
                    </A.Button>
                  </A.Tooltip>
                  <A.Tooltip title="Filtros">
                    <A.Button type="link" size="small" style={{ minWidth: 24, padding: '0 4px' }} aria-label="Filtros" icon={<Ic name="filter" />} onClick={() => showReportParameters(r)} />
                  </A.Tooltip>
                  <A.Tooltip title={t('Edit Info')}>
                    <A.Button type="link" size="small" style={{ minWidth: 24, padding: '0 4px' }} aria-label={t('Edit Info')} icon={<ActionIcon name="edit" />} onClick={() => setEditReport(Object.assign({}, r, { fileName: r.fileName }))} />
                  </A.Tooltip>
                  <A.Tooltip title={t('Export')}>
                    <A.Button type="link" size="small" style={{ minWidth: 24, padding: '0 4px' }} aria-label={t('Export')} icon={<ActionIcon name="download" />} onClick={() => onExport(r)} />
                  </A.Tooltip>
                  <A.Tooltip title={t('Report Restrictions')}>
                    <A.Button type="link" size="small" style={{ minWidth: 24, padding: '0 4px' }} aria-label={t('Report Restrictions')} icon={<Ic name="lock" />} onClick={() => showReportRestrictions(r)} />
                  </A.Tooltip>
                  <A.Popconfirm title={t('Are you sure you want to delete this report?')} onConfirm={() => onDelete(r)}>
                    <A.Tooltip title={t('Delete')}>
                      <A.Button type="link" size="small" style={{ minWidth: 24, padding: '0 4px' }} aria-label={t('Delete')} icon={<Ic name="delete" />} />
                    </A.Tooltip>
                  </A.Popconfirm>
                </div>
              )}
            />
                </A.Table>
              </div>
            </section>
          </div>
          <A.Modal
            title={t('Edit Report Info for') + ' ' + editReport.name}
            visible={!!editReport.fileName}
            onCancel={() => setEditReport({})}
            onOk={() => updateReport()}>
            <A.Form layout="vertical">
              <A.Form.Item label={t('Name')}>
                <A.Input value={editReport.name} onChange={v => setEditReport(Object.assign({}, editReport, { name: v.target.value }))} />
              </A.Form.Item>
              <A.Form.Item label={t('Area')}>
                <A.Input value={editReport.area} onChange={v => setEditReport(Object.assign({}, editReport, { area: v.target.value }))} />
              </A.Form.Item>
              <A.Form.Item label={t('Description')}>
                <A.Input.TextArea value={editReport.description} onChange={v => setEditReport(Object.assign({}, editReport, { description: v.target.value }))} />
              </A.Form.Item>
            </A.Form>
          </A.Modal>
          <A.Modal
            className="bi-parameter-modal"
            title={'Filtros de ' + ((parameterModal.report && (parameterModal.report.name || parameterModal.report.fileName)) || '')}
            visible={parameterModal.visible}
            onCancel={closeReportParameters}
            maskClosable={false}
            keyboard={false}
            width={760}
            footer={[
              <A.Button key="close" onClick={closeReportParameters}>Cerrar</A.Button>,
              <A.Button key="open" type="primary" onClick={saveAndOpenReport}>Abrir reporte</A.Button>
            ]}>
            {parameterModal.report && (
              <A.Typography.Paragraph type="secondary">
                Diseño: <A.Typography.Text code>{parameterModal.report.fileName + '.repx'}</A.Typography.Text>
              </A.Typography.Paragraph>
            )}
            {parameterModal.loading && (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <A.Spin tip="Leyendo filtros del reporte..." />
              </div>
            )}
            {!parameterModal.loading && parameterModal.error && (
              <A.Alert type="error" showIcon message="No se pudieron leer los filtros" description={parameterModal.error} />
            )}
            {!parameterModal.loading && !parameterModal.error && parameterModal.rows.length === 0 && (
              <A.Empty description="Este reporte no declara parámetros" />
            )}
            {!parameterModal.loading && !parameterModal.error && parameterModal.rows.length > 0 && (
              <div className="bi-parameter-form">
                {parameterModal.rows.filter(row => row.visible !== false && row.requestParameters !== false).map(row => (
                  <div className="bi-parameter-row" key={row.key}>
                    <div className="bi-parameter-label">
                      {!row.allowNull && (row.defaultValue === '' || row.isLob && String(row.defaultValue).trim() === '0') ? <span className="bi-parameter-required">*</span> : null}
                      {row.label}
                    </div>
                    <div className="bi-parameter-control">
                      {renderParameterInput(row)}
                      <div className="bi-parameter-hint">{parameterHint(row)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </A.Modal>
          <ReportRestrictions
            reportId={reportIdRestrictions}
            visible={reportIdRestrictions !== null}
            onCancel={() => setReportIdRestrictions(null)}
            onOk={() => onReportRestrictionsChanged()}
          />
        </DefaultPage>
      </div>
    );
  };
})()
