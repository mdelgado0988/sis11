/**
 * @author aiden_mission_configurator (AIDEN Missions)
 * @name InteligenciaNegocio
 * @version 1.0.0
 * @created 2026-10-21
 * @mission MSN-000091 (globaluat) / AXX-5288
 * @purpose Reportes de usuario por area: la lista nativa del Vizualizador (#/reportlist) con las mismas columnas y
 *          acciones (Abrir, Editar informacion, Exportar, Restricciones, Eliminar, Importar, Actualizar), precedida por
 *          dos selectores: Area (las areas de los reportes configurados; un reporte sin area cae en "General") y
 *          Reporte (los reportes del area elegida). La grilla no muestra nada hasta que se elige un area.
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
  const byText = (a, b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
  const AREA_AVATAR_COLORS = ['#1677ff', '#13a8a8', '#52a41a', '#d46b08', '#722ed1', '#c41d7f', '#2f54eb', '#389e0d'];
  const areaAvatarColor = area => {
    const hash = Array.from(String(area)).reduce((total, character) => total + character.charCodeAt(0), 0);
    return AREA_AVATAR_COLORS[hash % AREA_AVATAR_COLORS.length];
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
    const [reportIdRestrictions, setReportIdRestrictions] = useState(null);
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

    // The selected area controls the report grid shown alongside the area list.
    const areas = Array.from(new Set(data.map(areaOf))).sort(byText);
    const areaReports = area ? data.filter(r => areaOf(r) === area) : [];
    const rows = areaReports.slice().sort((a, b) => byText(a.name || a.fileName, b.name || b.fileName));

    const openReport = r => {
      if (r.restricted) {
        //checking if user is authorized
        if (r.AllowedUsers && r.AllowedUsers.map(q => q.user).indexOf(localStorage.email) === -1) {
          A.message.error(t('This report is restricted and only authorized users can access it'));
          return;
        }
      }
      window.location.href = '#/reportview/' + r.fileName;
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
                  const count = data.filter(r => areaOf(r) === item).length;
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
                <A.Tooltip title={t('Reload')}>
                  <A.Button type="link" icon={<Ic name="reload" />} style={{ marginRight: 4 }} onClick={() => getReports()}>
                    {t('Reload')}
                  </A.Button>
                </A.Tooltip>
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
              width={180}
              align="center"
              render={(v, r) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                  <A.Tooltip title={t('Open')}>
                    <A.Button type="link" size="small" icon={<ActionIcon name="eye" />} onClick={() => openReport(r)}>
                      {t('Open')}
                    </A.Button>
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
